from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date

from app.database import get_db
from app.models import FareObservation, RawResponse
from app.schemas.schemas import ObservationResponse, PaginatedObservations, RawResponseSchema

router = APIRouter()

@router.get("/observations", response_model=PaginatedObservations)
def get_observations(
    route_id: Optional[int] = Query(None),
    airline_id: Optional[int] = Query(None),
    source_id: Optional[int] = Query(None),
    booking_lead_time_days: Optional[int] = Query(None),
    quality_status: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(FareObservation)

    if route_id:
        query = query.filter(FareObservation.route_id == route_id)
    if airline_id:
        query = query.filter(FareObservation.airline_id == airline_id)
    if source_id:
        query = query.filter(FareObservation.source_id == source_id)
    if booking_lead_time_days:
        query = query.filter(FareObservation.booking_lead_time_days == booking_lead_time_days)
    if quality_status:
        query = query.filter(FareObservation.quality_status == quality_status)
    if start_date:
        query = query.filter(func.date(FareObservation.collection_timestamp_ist) >= start_date)
    if end_date:
        query = query.filter(func.date(FareObservation.collection_timestamp_ist) <= end_date)

    total = query.count()
    observations = query.order_by(FareObservation.collection_timestamp_ist.desc())\
                         .offset((page - 1) * page_size)\
                         .limit(page_size)\
                         .all()

    items = []
    for obs in observations:
        item = ObservationResponse.model_validate(obs)
        if obs.source:
            item.source_name = obs.source.name
        if obs.route:
            item.route_code = f"{obs.route.origin_iata}-{obs.route.destination_iata}"
        if obs.airline:
            item.airline_name = obs.airline.airline_name
        items.append(item)

    return PaginatedObservations(
        total=total,
        page=page,
        page_size=page_size,
        items=items
    )


@router.get("/observations/{observation_id}")
def get_observation_by_id(observation_id: int, db: Session = Depends(get_db)):
    obs = db.query(FareObservation).filter(FareObservation.id == observation_id).first()
    if not obs:
        raise HTTPException(status_code=404, detail=f"Observation {observation_id} not found.")

    obs_resp = ObservationResponse.model_validate(obs)
    if obs.source:
        obs_resp.source_name = obs.source.name
    if obs.route:
        obs_resp.route_code = f"{obs.route.origin_iata}-{obs.route.destination_iata}"
    if obs.airline:
        obs_resp.airline_name = obs.airline.airline_name

    raw_resp = None
    if obs.raw_response_id:
        raw_obj = db.query(RawResponse).filter(RawResponse.id == obs.raw_response_id).first()
        if raw_obj:
            raw_resp = RawResponseSchema.model_validate(raw_obj)

    return {
        "observation": obs_resp,
        "raw_response": raw_resp
    }
