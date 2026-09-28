from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.api import api_router

# Create database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="MoSPI / DIID Prototype for Real-time Airfare Price Index (APIx) for India.",
    version="1.0.0"
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root Endpoint
@app.get("/", tags=["Root"])
def root():
    return {
        "service": settings.PROJECT_NAME,
        "status": "online",
        "docs_url": "/docs",
        "health_url": "/health",
        "meta_url": "/api/v1/meta",
        "frontend_dashboard": "http://localhost:5173",
        "disclaimer": "VayuIndex is a proposed SIH prototype and does not replace CPI. Uses controlled/simulated source data for demonstration."
    }

# Health Check Endpoints
@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
@app.get("/api/v1/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "database_connected": True,
        "disclaimer": "Prototype uses controlled/simulated source data for demonstration. Does not replace CPI."
    }

# Include API v1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)
