from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date

from app.database import get_db
from app.models import IndexValue
from app.schemas.schemas import IndexValueResponse

router = APIRouter()

def _decorate_index_response(idx_list: List[IndexValue]) -> List[IndexValueResponse]:
    resp = []
    for idx in idx_list:
        item = IndexValueResponse.model_validate(idx)
        if idx.route:
            item.route_code = f"{idx.route.origin_iata}-{idx.route.destination_iata}"
        if idx.airline:
            item.airline_name = idx.airline.airline_name
        resp.append(item)
    return resp

@router.get("/index", response_model=List[IndexValueResponse])
def get_national_index(
    granularity: str = Query("daily", pattern="^(daily|weekly|monthly)$"),
    booking_lead_time_days: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(IndexValue).filter(
        IndexValue.scope == "national",
        IndexValue.granularity == granularity
    )

    if booking_lead_time_days:
        query = query.filter(IndexValue.booking_lead_time_days == booking_lead_time_days)
    if start_date:
        query = query.filter(IndexValue.index_date >= start_date)
    if end_date:
        query = query.filter(IndexValue.index_date <= end_date)

    indices = query.order_by(IndexValue.index_date.asc()).all()
    return _decorate_index_response(indices)


@router.get("/index/routes", response_model=List[IndexValueResponse])
def get_route_indices(
    route_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(IndexValue).filter(IndexValue.scope == "route")
    if route_id:
        query = query.filter(IndexValue.route_id == route_id)
    if start_date:
        query = query.filter(IndexValue.index_date >= start_date)
    if end_date:
        query = query.filter(IndexValue.index_date <= end_date)

    indices = query.order_by(IndexValue.index_date.asc()).all()
    return _decorate_index_response(indices)


@router.get("/index/airlines", response_model=List[IndexValueResponse])
def get_airline_indices(
    airline_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(IndexValue).filter(IndexValue.scope == "airline")
    if airline_id:
        query = query.filter(IndexValue.airline_id == airline_id)
    if start_date:
        query = query.filter(IndexValue.index_date >= start_date)
    if end_date:
        query = query.filter(IndexValue.index_date <= end_date)

    indices = query.order_by(IndexValue.index_date.asc()).all()
    return _decorate_index_response(indices)


@router.get("/index/booking-windows", response_model=List[IndexValueResponse])
def get_booking_window_indices(
    lead_time_days: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(IndexValue).filter(IndexValue.scope == "booking_window")
    if lead_time_days:
        query = query.filter(IndexValue.booking_lead_time_days == lead_time_days)
    if start_date:
        query = query.filter(IndexValue.index_date >= start_date)
    if end_date:
        query = query.filter(IndexValue.index_date <= end_date)

    indices = query.order_by(IndexValue.index_date.asc()).all()
    return _decorate_index_response(indices)
