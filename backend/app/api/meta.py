from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Route, Airline, Source
from app.schemas.schemas import MetaResponse, RouteMeta, AirlineMeta, SourceMeta
from app.config import settings

router = APIRouter()

@router.get("/meta", response_model=MetaResponse)
def get_metadata(db: Session = Depends(get_db)):
    routes = db.query(Route).all()
    airlines = db.query(Airline).all()
    sources = db.query(Source).all()

    return MetaResponse(
        routes=[RouteMeta.model_validate(r) for r in routes],
        airlines=[AirlineMeta.model_validate(a) for a in airlines],
        sources=[SourceMeta.model_validate(s) for s in sources],
        booking_windows=settings.LEAD_TIMES,
        methodology_version=settings.METHODOLOGY_VERSION,
        weight_version=settings.WEIGHT_VERSION,
        base_period=settings.BASE_PERIOD,
        disclaimer="Prototype uses controlled/simulated source data for demonstration. Real-source adapters must comply with each website's robots.txt, terms, and rate limits. VayuIndex is a proposed SIH prototype and does not replace CPI."
    )
