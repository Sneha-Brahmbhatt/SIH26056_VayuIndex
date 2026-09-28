from fastapi import APIRouter
from app.api.meta import router as meta_router
from app.api.collection import router as collection_router
from app.api.observations import router as observations_router
from app.api.index import router as index_router
from app.api.quality import router as quality_router
from app.api.trace import router as trace_router
from app.api.admin import router as admin_router
from app.api.backtest import router as backtest_router

api_router = APIRouter()

api_router.include_router(meta_router, tags=["Metadata"])
api_router.include_router(collection_router, tags=["Collection"])
api_router.include_router(observations_router, tags=["Observations"])
api_router.include_router(index_router, tags=["Index Engine"])
api_router.include_router(quality_router, tags=["Data Quality"])
api_router.include_router(trace_router, tags=["Traceability"])
api_router.include_router(admin_router, tags=["Admin"])
api_router.include_router(backtest_router, tags=["Backtesting"])
