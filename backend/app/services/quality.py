import math
from datetime import date, datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import Source, CollectionEvent, FareObservation, Weight, Route, Airline
from app.config import settings

def calculate_quality_metrics(db: Session, as_of_date: date = None) -> Dict[str, Any]:
    """
    Computes data quality, source health, coverage weights, and missing-cell metrics.
    """
    if as_of_date is None:
        as_of_date = date.today()

    start_datetime = datetime.combine(as_of_date, datetime.min.time())
    end_datetime = datetime.combine(as_of_date, datetime.max.time())

    # Fetch collection events for as_of_date
    events = db.query(CollectionEvent).filter(
        CollectionEvent.attempted_at >= start_datetime,
        CollectionEvent.attempted_at <= end_datetime
    ).all()

    if not events:
        # Look back up to 7 days if no events today
        events = db.query(CollectionEvent).filter(
            CollectionEvent.attempted_at >= start_datetime - timedelta(days=7)
        ).all()

    total_events = len(events)
    if total_events == 0:
        total_events = 1 # avoid div by zero

    outcomes = {
        "success": 0,
        "blocked": 0,
        "timeout": 0,
        "schema_change": 0,
        "sold_out": 0,
        "invalid": 0
    }

    for ev in events:
        if ev.outcome in outcomes:
            outcomes[ev.outcome] += 1

    success_rate = round((outcomes["success"] / total_events) * 100.0, 2)
    blocked_rate = round((outcomes["blocked"] / total_events) * 100.0, 2)
    timeout_rate = round((outcomes["timeout"] / total_events) * 100.0, 2)
    schema_change_rate = round((outcomes["schema_change"] / total_events) * 100.0, 2)
    sold_out_rate = round((outcomes["sold_out"] / total_events) * 100.0, 2)
    source_availability_rate = round(100.0 - blocked_rate - timeout_rate - schema_change_rate, 2)

    # Calculate Source Health Breakdown
    sources = db.query(Source).all()
    source_health_list = []

    source_obs_counts = {}

    for src in sources:
        src_events = [ev for ev in events if ev.source_id == src.id]
        src_total = len(src_events)
        if src_total == 0:
            src_total = 1
        
        s_outcomes = {"success": 0, "blocked": 0, "timeout": 0, "schema_change": 0, "sold_out": 0}
        for ev in src_events:
            if ev.outcome in s_outcomes:
                s_outcomes[ev.outcome] += 1

        last_ev = db.query(CollectionEvent).filter(
            CollectionEvent.source_id == src.id
        ).order_by(CollectionEvent.attempted_at.desc()).first()

        last_time = last_ev.attempted_at if last_ev else None

        source_health_list.append({
            "source_id": src.id,
            "source_name": src.name,
            "source_type": src.source_type,
            "status": src.status,
            "total_attempts": len(src_events),
            "success_rate": round((s_outcomes["success"] / src_total) * 100.0, 2),
            "blocked_rate": round((s_outcomes["blocked"] / src_total) * 100.0, 2),
            "timeout_rate": round((s_outcomes["timeout"] / src_total) * 100.0, 2),
            "schema_change_rate": round((s_outcomes["schema_change"] / src_total) * 100.0, 2),
            "sold_out_rate": round((s_outcomes["sold_out"] / src_total) * 100.0, 2),
            "last_collection_timestamp": last_time
        })

        # Count accepted observations for concentration
        obs_count = db.query(FareObservation).filter(
            FareObservation.source_id == src.id,
            FareObservation.quality_status == "accepted",
            func.date(FareObservation.collection_timestamp_ist) == as_of_date
        ).count()
        source_obs_counts[src.id] = obs_count

    # Concentration Index (Herfindahl-Hirschman Index HHI)
    total_obs = sum(source_obs_counts.values())
    if total_obs > 0:
        hhi = sum(((count / total_obs) * 100.0) ** 2 for count in source_obs_counts.values())
    else:
        hhi = 2000.0 # moderate baseline

    # Missing Cell Rate
    total_routes = db.query(Route).filter(Route.is_active == True).count()
    total_airlines = db.query(Airline).filter(Airline.is_active == True).count()
    total_cells = total_routes * total_airlines * len(settings.LEAD_TIMES)

    filled_cells = db.query(
        FareObservation.route_id,
        FareObservation.airline_id,
        FareObservation.booking_lead_time_days
    ).filter(
        FareObservation.quality_status == "accepted",
        func.date(FareObservation.collection_timestamp_ist) == as_of_date
    ).distinct().count()

    missing_cells = max(0, total_cells - filled_cells)
    missing_cell_rate = round((missing_cells / max(1, total_cells)) * 100.0, 2)

    # Intended vs Covered Weight
    weights = db.query(Weight).filter(Weight.weight_version == settings.WEIGHT_VERSION).all()
    intended_weight = sum(w.weight_value for w in weights) if weights else 100.0
    covered_weight = intended_weight * (1.0 - (missing_cell_rate / 100.0))
    coverage_weight_pct = round((covered_weight / max(1.0, intended_weight)) * 100.0, 2)

    # Observation Freshness (hours since latest collection)
    latest_obs = db.query(FareObservation).order_by(FareObservation.collection_timestamp_ist.desc()).first()
    if latest_obs and latest_obs.collection_timestamp_ist:
        delta = datetime.utcnow() - latest_obs.collection_timestamp_ist
        freshness_hours = round(max(0.0, delta.total_seconds() / 3600.0), 1)
    else:
        freshness_hours = 0.5

    disclaimer = f"Today's APIx reflects {coverage_weight_pct}% of intended route-carrier-window weight. Treat comparisons involving unavailable sources cautiously."

    return {
        "as_of_date": as_of_date,
        "intended_weight_total": round(intended_weight, 2),
        "covered_weight_total": round(covered_weight, 2),
        "coverage_weight_pct": coverage_weight_pct,
        "source_availability_rate": source_availability_rate,
        "successful_collection_rate": success_rate,
        "blocked_rate": blocked_rate,
        "timeout_rate": timeout_rate,
        "schema_change_rate": schema_change_rate,
        "sold_out_rate": sold_out_rate,
        "missing_cell_rate": missing_cell_rate,
        "observation_freshness_hours": freshness_hours,
        "source_concentration_hhi": round(hhi, 1),
        "source_health": source_health_list,
        "disclaimer": disclaimer
    }
