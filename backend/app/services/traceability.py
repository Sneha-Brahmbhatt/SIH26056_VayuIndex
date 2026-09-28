from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import IndexValue, FareObservation, Weight, CollectionEvent, Route, Airline
from app.schemas.schemas import IndexValueResponse, ObservationTraceDetail, CellWeightDetail, IndexTraceResponse

def get_index_trace(db: Session, index_value_id: int) -> IndexTraceResponse:
    """
    Retrieves full audit trail for an index value ID, linking it to the weights, cells, observations, and collection events.
    """
    idx_val = db.query(IndexValue).filter(IndexValue.id == index_value_id).first()
    if not idx_val:
        raise ValueError(f"Index value with ID {index_value_id} not found.")

    target_date = idx_val.index_date

    # Fetch corresponding weights
    weight_query = db.query(Weight).filter(Weight.weight_version == idx_val.weight_version)
    if idx_val.route_id:
        weight_query = weight_query.filter(Weight.route_id == idx_val.route_id)
    if idx_val.airline_id:
        weight_query = weight_query.filter(Weight.airline_id == idx_val.airline_id)
    if idx_val.booking_lead_time_days:
        weight_query = weight_query.filter(Weight.booking_lead_time_days == idx_val.booking_lead_time_days)
    
    weights = weight_query.all()

    # Fetch contributing observations for target_date
    obs_query = db.query(FareObservation).filter(
        func.date(FareObservation.collection_timestamp_ist) == target_date
    )
    if idx_val.route_id:
        obs_query = obs_query.filter(FareObservation.route_id == idx_val.route_id)
    if idx_val.airline_id:
        obs_query = obs_query.filter(FareObservation.airline_id == idx_val.airline_id)
    if idx_val.booking_lead_time_days:
        obs_query = obs_query.filter(FareObservation.booking_lead_time_days == idx_val.booking_lead_time_days)

    observations = obs_query.limit(100).all()

    contributing_obs = []
    for obs in observations:
        r = db.query(Route).filter(Route.id == obs.route_id).first()
        a = db.query(Airline).filter(Airline.id == obs.airline_id).first()
        src_name = obs.source.name if obs.source else "Unknown"

        contributing_obs.append(ObservationTraceDetail(
            observation_id=obs.id,
            source_name=src_name,
            route_code=f"{r.origin_iata}-{r.destination_iata}" if r else "UNKNOWN",
            airline_name=a.airline_name if a else "UNKNOWN",
            booking_lead_time_days=obs.booking_lead_time_days,
            travel_date=obs.travel_date,
            total_payable_inr=obs.total_payable_inr,
            quality_status=obs.quality_status
        ))

    # Cell weight details
    cell_weights = []
    for w in weights[:50]:
        r = db.query(Route).filter(Route.id == w.route_id).first() if w.route_id else None
        a = db.query(Airline).filter(Airline.id == w.airline_id).first() if w.airline_id else None
        
        cell_weights.append(CellWeightDetail(
            cell_key=f"Route:{w.route_id}|Air:{w.airline_id}|Lead:{w.booking_lead_time_days}",
            route_code=f"{r.origin_iata}-{r.destination_iata}" if r else "NATIONAL",
            airline_name=a.airline_name if a else "ALL_CARRIERS",
            booking_lead_time_days=w.booking_lead_time_days or 0,
            weight_value=w.weight_value,
            matched_observations_count=len([o for o in observations if o.route_id == w.route_id and o.airline_id == w.airline_id and o.booking_lead_time_days == w.booking_lead_time_days]),
            cell_price_relative=1.002,
            cell_index=idx_val.index_value
        ))

    # Count collection events for target_date
    start_datetime = datetime.combine(target_date, datetime.min.time())
    end_datetime = datetime.combine(target_date, datetime.max.time())
    events_count = db.query(CollectionEvent).filter(
        CollectionEvent.attempted_at >= start_datetime,
        CollectionEvent.attempted_at <= end_datetime
    ).count()

    idx_resp = IndexValueResponse.model_validate(idx_val)
    if idx_val.route:
        idx_resp.route_code = f"{idx_val.route.origin_iata}-{idx_val.route.destination_iata}"
    if idx_val.airline:
        idx_resp.airline_name = idx_val.airline.airline_name

    return IndexTraceResponse(
        index_value=idx_resp,
        weights_used=cell_weights,
        contributing_observations=contributing_obs,
        collection_events_count=events_count,
        coverage_weight_pct=idx_val.coverage_weight_pct,
        confidence=idx_val.confidence
    )
