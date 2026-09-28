import numpy as np
import pandas as pd
from datetime import date, datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import FareObservation, IndexValue, Weight, Route, Airline
from app.config import settings

def calculate_daily_index(
    db: Session,
    target_date: date,
    base_period: str = None,
    methodology_version: str = None,
    weight_version: str = None
) -> List[IndexValue]:
    """
    Calculates the matched-model Jevons index for a given date across national, route, airline, and booking-window scopes.
    """
    if base_period is None:
        base_period = settings.BASE_PERIOD
    if methodology_version is None:
        methodology_version = settings.METHODOLOGY_VERSION
    if weight_version is None:
        weight_version = settings.WEIGHT_VERSION

    # 1. Fetch active weights for current weight version
    weights = db.query(Weight).filter(Weight.weight_version == weight_version).all()
    if not weights:
        # Fallback equal weights if no weights loaded yet
        weight_lookup = {}
    else:
        weight_lookup = {
            (w.route_id, w.airline_id, w.booking_lead_time_days): w.weight_value
            for w in weights
        }

    # 2. Fetch accepted observations for target_date and target_date - 1 day
    prev_date = target_date - timedelta(days=1)

    curr_obs = db.query(FareObservation).filter(
        FareObservation.quality_status == "accepted",
        FareObservation.availability_status == "available",
        func.date(FareObservation.collection_timestamp_ist) == target_date
    ).all()

    prev_obs = db.query(FareObservation).filter(
        FareObservation.quality_status == "accepted",
        FareObservation.availability_status == "available",
        func.date(FareObservation.collection_timestamp_ist) == prev_date
    ).all()

    # Group cell prices: cell = (route_id, airline_id, lead_time)
    def compute_cell_means(observations):
        cell_dict = {}
        for obs in observations:
            key = (obs.route_id, obs.airline_id, obs.booking_lead_time_days)
            if key not in cell_dict:
                cell_dict[key] = []
            cell_dict[key].append(obs.total_payable_inr)
        
        cell_means = {}
        for key, fares in cell_dict.items():
            # Jevons geometric mean of prices in cell
            cell_means[key] = float(np.exp(np.mean(np.log(fares))))
        return cell_means

    curr_cells = compute_cell_means(curr_obs)
    prev_cells = compute_cell_means(prev_obs)

    # Fetch previous day index values to chain-link
    prev_indices = db.query(IndexValue).filter(
        IndexValue.index_date == prev_date,
        IndexValue.granularity == "daily"
    ).all()

    prev_index_map = {
        (idx.scope, idx.route_id, idx.airline_id, idx.booking_lead_time_days): idx.index_value
        for idx in prev_indices
    }

    # Calculate matched price relatives for available cells
    matched_cells = {}
    total_intended_weight = sum(w.weight_value for w in weights) if weights else 1.0
    covered_weight = 0.0

    all_routes = db.query(Route).filter(Route.is_active == True).all()
    all_airlines = db.query(Airline).filter(Airline.is_active == True).all()
    all_lead_times = settings.LEAD_TIMES

    cell_indices = {}

    for route in all_routes:
        for airline in all_airlines:
            for lead in all_lead_times:
                cell_key = (route.id, airline.id, lead)
                cell_weight = weight_lookup.get(cell_key, 1.0)
                
                prev_cell_idx = prev_index_map.get(("cell", route.id, airline.id, lead), 100.0)

                if cell_key in curr_cells and cell_key in prev_cells:
                    # Matched model price relative
                    price_rel = curr_cells[cell_key] / prev_cells[cell_key]
                    curr_cell_idx = prev_cell_idx * price_rel
                    matched_cells[cell_key] = (price_rel, curr_cell_idx, cell_weight)
                    cell_indices[cell_key] = curr_cell_idx
                    covered_weight += cell_weight
                elif cell_key in curr_cells:
                    # Standalone current observation (first period or recovered cell)
                    # Carry forward index level or assume price relative = 1.0
                    cell_indices[cell_key] = prev_cell_idx
                    covered_weight += cell_weight * 0.8
                else:
                    # Missing cell - carry forward previous cell index with provisional note
                    cell_indices[cell_key] = prev_cell_idx

    coverage_pct = round((covered_weight / total_intended_weight) * 100.0, 2) if total_intended_weight > 0 else 100.0
    confidence = "high" if coverage_pct >= 90.0 else ("medium" if coverage_pct >= 70.0 else "low")

    # National Index Calculation
    prev_national = prev_index_map.get(("national", None, None, None), 100.0)
    if matched_cells:
        weighted_log_relatives = sum(w * np.log(rel) for rel, idx, w in matched_cells.values())
        norm_weight = sum(w for rel, idx, w in matched_cells.values())
        national_change_mult = float(np.exp(weighted_log_relatives / norm_weight)) if norm_weight > 0 else 1.0
        national_idx_val = round(prev_national * national_change_mult, 4)
    else:
        national_idx_val = prev_national

    national_change_val = round(national_idx_val - prev_national, 4)
    national_change_pct = round(((national_idx_val - prev_national) / prev_national) * 100.0, 4)

    created_records = []

    # Store National Record
    national_record = IndexValue(
        index_date=target_date,
        granularity="daily",
        scope="national",
        route_id=None,
        airline_id=None,
        booking_lead_time_days=None,
        index_value=national_idx_val,
        previous_index_value=prev_national,
        change_value=national_change_val,
        change_percent=national_change_pct,
        base_period=base_period,
        methodology_version=methodology_version,
        weight_version=weight_version,
        coverage_weight_pct=coverage_pct,
        confidence=confidence,
        created_at=datetime.utcnow()
    )
    db.add(national_record)
    created_records.append(national_record)

    # Route Sub-Indices
    for route in all_routes:
        prev_route_idx = prev_index_map.get(("route", route.id, None, None), 100.0)
        route_matched = [item for key, item in matched_cells.items() if key[0] == route.id]
        if route_matched:
            w_sum = sum(w for rel, idx, w in route_matched)
            r_mult = float(np.exp(sum(w * np.log(rel) for rel, idx, w in route_matched) / w_sum)) if w_sum > 0 else 1.0
            r_idx_val = round(prev_route_idx * r_mult, 4)
        else:
            r_idx_val = prev_route_idx

        r_record = IndexValue(
            index_date=target_date,
            granularity="daily",
            scope="route",
            route_id=route.id,
            airline_id=None,
            booking_lead_time_days=None,
            index_value=r_idx_val,
            previous_index_value=prev_route_idx,
            change_value=round(r_idx_val - prev_route_idx, 4),
            change_percent=round(((r_idx_val - prev_route_idx) / prev_route_idx) * 100.0, 4),
            base_period=base_period,
            methodology_version=methodology_version,
            weight_version=weight_version,
            coverage_weight_pct=coverage_pct,
            confidence=confidence,
            created_at=datetime.utcnow()
        )
        db.add(r_record)
        created_records.append(r_record)

    # Airline Sub-Indices
    for airline in all_airlines:
        prev_air_idx = prev_index_map.get(("airline", None, airline.id, None), 100.0)
        air_matched = [item for key, item in matched_cells.items() if key[1] == airline.id]
        if air_matched:
            w_sum = sum(w for rel, idx, w in air_matched)
            a_mult = float(np.exp(sum(w * np.log(rel) for rel, idx, w in air_matched) / w_sum)) if w_sum > 0 else 1.0
            a_idx_val = round(prev_air_idx * a_mult, 4)
        else:
            a_idx_val = prev_air_idx

        a_record = IndexValue(
            index_date=target_date,
            granularity="daily",
            scope="airline",
            route_id=None,
            airline_id=airline.id,
            booking_lead_time_days=None,
            index_value=a_idx_val,
            previous_index_value=prev_air_idx,
            change_value=round(a_idx_val - prev_air_idx, 4),
            change_percent=round(((a_idx_val - prev_air_idx) / prev_air_idx) * 100.0, 4),
            base_period=base_period,
            methodology_version=methodology_version,
            weight_version=weight_version,
            coverage_weight_pct=coverage_pct,
            confidence=confidence,
            created_at=datetime.utcnow()
        )
        db.add(a_record)
        created_records.append(a_record)

    # Booking Lead Time Sub-Indices (T+1, T+7, T+15, T+30, T+45)
    for lead in all_lead_times:
        prev_lead_idx = prev_index_map.get(("booking_window", None, None, lead), 100.0)
        lead_matched = [item for key, item in matched_cells.items() if key[2] == lead]
        if lead_matched:
            w_sum = sum(w for rel, idx, w in lead_matched)
            l_mult = float(np.exp(sum(w * np.log(rel) for rel, idx, w in lead_matched) / w_sum)) if w_sum > 0 else 1.0
            l_idx_val = round(prev_lead_idx * l_mult, 4)
        else:
            l_idx_val = prev_lead_idx

        l_record = IndexValue(
            index_date=target_date,
            granularity="daily",
            scope="booking_window",
            route_id=None,
            airline_id=None,
            booking_lead_time_days=lead,
            index_value=l_idx_val,
            previous_index_value=prev_lead_idx,
            change_value=round(l_idx_val - prev_lead_idx, 4),
            change_percent=round(((l_idx_val - prev_lead_idx) / prev_lead_idx) * 100.0, 4),
            base_period=base_period,
            methodology_version=methodology_version,
            weight_version=weight_version,
            coverage_weight_pct=coverage_pct,
            confidence=confidence,
            created_at=datetime.utcnow()
        )
        db.add(l_record)
        created_records.append(l_record)

    db.commit()
    return created_records
