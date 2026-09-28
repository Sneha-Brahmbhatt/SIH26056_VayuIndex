from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date

from app.database import get_db
from app.models import CollectionEvent
from app.schemas.schemas import CollectionRunRequest, CollectionRunResponse, CollectionEventResponse
from app.services.collector import run_collection_cycle
from app.services.indexer import calculate_daily_index

router = APIRouter()

@router.post("/collection/run", response_model=CollectionRunResponse)
def trigger_collection(
    body: Optional[CollectionRunRequest] = None,
    db: Session = Depends(get_db)
):
    req = body or CollectionRunRequest()
    target_dt = req.target_date or date.today()

    res = run_collection_cycle(
        db=db,
        target_date=target_dt,
        route_ids=req.route_ids,
        source_ids=req.source_ids,
        booking_windows=req.booking_windows
    )

    # Re-calculate index for target date
    calculate_daily_index(db, target_date=target_dt)

    return CollectionRunResponse(**res)


@router.get("/collection-events", response_model=List[CollectionEventResponse])
def get_collection_events(
    source_id: Optional[int] = Query(None),
    outcome: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(CollectionEvent)
    if source_id:
        query = query.filter(CollectionEvent.source_id == source_id)
    if outcome:
        query = query.filter(CollectionEvent.outcome == outcome)

    events = query.order_by(CollectionEvent.attempted_at.desc()).limit(limit).all()

    resp = []
    for ev in events:
        item = CollectionEventResponse.model_validate(ev)
        item.source_name = ev.source.name if ev.source else None
        resp.append(item)

    return resp
