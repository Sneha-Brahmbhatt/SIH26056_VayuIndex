from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional

from app.database import get_db
from app.schemas.schemas import QualityMetricsResponse
from app.services.quality import calculate_quality_metrics

router = APIRouter()

@router.get("/quality", response_model=QualityMetricsResponse)
def get_quality(
    as_of_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    metrics = calculate_quality_metrics(db, as_of_date=as_of_date)
    return QualityMetricsResponse(**metrics)
