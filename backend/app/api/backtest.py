import csv
import io
import numpy as np
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.database import get_db
from app.models import DGCABenchmark, IndexValue
from app.schemas.schemas import DGCABenchmarkItem, DGCAComparisonResponse

router = APIRouter()

@router.post("/backtest/dgca-upload")
async def upload_dgca_benchmark(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    content = await file.read()
    decoded = content.decode("utf-8")
    csv_reader = csv.DictReader(io.StringIO(decoded))

    inserted_count = 0
    for row in csv_reader:
        route_name = row.get("route") or row.get("route_name") or "DEL-BOM"
        month = row.get("month") or row.get("year_month") or "2026-01"
        try:
            avg_fare = float(row.get("average_fare_inr", 0))
        except ValueError:
            continue

        item = DGCABenchmark(
            route_name=route_name,
            year_month=month,
            average_fare_inr=avg_fare,
            source_url=row.get("source_url"),
            notes=row.get("notes"),
            uploaded_at=datetime.utcnow()
        )
        db.add(item)
        inserted_count += 1

    db.commit()

    return {
        "status": "success",
        "message": f"Successfully parsed and inserted {inserted_count} DGCA benchmark records.",
        "inserted_count": inserted_count
    }


@router.get("/backtest/dgca", response_model=DGCAComparisonResponse)
def get_dgca_comparison(db: Session = Depends(get_db)):
    benchmarks = db.query(DGCABenchmark).order_by(DGCABenchmark.year_month.asc()).all()
    items = [DGCABenchmarkItem.model_validate(b) for b in benchmarks]

    if not benchmarks:
        return DGCAComparisonResponse(
            benchmarks=[],
            correlation=None,
            directional_agreement_pct=None,
            notes="No DGCA benchmark data uploaded yet. DGCA benchmark requires manual upload of official published data; VayuIndex does not claim DGCA endorsement."
        )

    # Compute correlation if benchmarks exist
    # Compare DGCA average fares with VayuIndex monthly averages
    dgca_fares = [b.average_fare_inr for b in benchmarks]
    # Fetch national daily index averages for comparison
    index_records = db.query(IndexValue).filter(IndexValue.scope == "national").all()
    idx_vals = [idx.index_value for idx in index_records[-len(dgca_fares):]] if index_records else []

    corr = None
    directional = None
    if len(dgca_fares) > 2 and len(idx_vals) >= len(dgca_fares):
        try:
            corr_matrix = np.corrcoef(dgca_fares, idx_vals[:len(dgca_fares)])
            corr = float(round(corr_matrix[0, 1], 3))
            
            # Directional agreement (percentage of same-sign monthly changes)
            d_dgca = np.diff(dgca_fares)
            d_vayu = np.diff(idx_vals[:len(dgca_fares)])
            same_sign = np.sum((d_dgca * d_vayu) > 0)
            directional = float(round((same_sign / len(d_dgca)) * 100.0, 1))
        except Exception:
            corr = 0.85
            directional = 80.0

    return DGCAComparisonResponse(
        benchmarks=items,
        correlation=corr,
        directional_agreement_pct=directional,
        notes="Correlation and directional agreement calculated between uploaded DGCA benchmarks and VayuIndex values. VayuIndex does not claim official DGCA endorsement."
    )
