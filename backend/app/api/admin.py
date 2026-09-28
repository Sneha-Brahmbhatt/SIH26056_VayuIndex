from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models import IndexValue
from app.schemas.schemas import RebaseRequest, RebaseResponse
from app.config import settings

router = APIRouter()

@router.post("/admin/rebase", response_model=RebaseResponse)
def rebase_index(req: RebaseRequest, db: Session = Depends(get_db)):
    if not req.confirm:
        raise HTTPException(status_code=400, detail="Rebase requires explicit confirmation (confirm=True).")

    new_base_str = req.new_base_period.isoformat()
    new_methodology_ver = f"{settings.METHODOLOGY_VERSION}-Rebased-{new_base_str}"

    updated = db.query(IndexValue).update({
        IndexValue.base_period: new_base_str,
        IndexValue.methodology_version: new_methodology_ver,
        IndexValue.revised_at: datetime.utcnow(),
        IndexValue.revision_reason: f"Admin rebase operation to {new_base_str}. Notes: {req.notes or 'N/A'}"
    }, synchronize_session=False)

    db.commit()

    return RebaseResponse(
        status="success",
        new_base_period=new_base_str,
        methodology_version=new_methodology_ver,
        affected_records_count=updated,
        message=f"Index successfully rebased to {new_base_str}. Updated {updated} records."
    )
