import os

class Settings:
    PROJECT_NAME: str = "VayuIndex — Airfare Price Index Prototype"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./vayu_index.db")
    METHODOLOGY_VERSION: str = os.getenv("METHODOLOGY_VERSION", "1.0.0-Jevons")
    WEIGHT_VERSION: str = os.getenv("WEIGHT_VERSION", "2026.1")
    BASE_PERIOD: str = os.getenv("BASE_PERIOD", "2026-01-01")
    
    LEAD_TIMES: list[int] = [1, 7, 15, 30, 45]

settings = Settings()
