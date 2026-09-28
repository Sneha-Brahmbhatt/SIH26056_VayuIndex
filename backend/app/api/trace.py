from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.schemas import IndexTraceResponse
from app.services.traceability import get_index_trace

router = APIRouter()

@router.get("/index/{index_value_id}/trace", response_model=IndexTraceResponse)
def trace_index_value(index_value_id: int, db: Session = Depends(get_db)):
    try:
        return get_index_trace(db, index_value_id=index_value_id)
    except ValueError as err:
        raise HTTPException(status_code=404, detail=str(err))
