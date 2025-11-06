"""
Reports Router - API endpoints for report history and search
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, desc, func
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from database import get_db
from models import Report, Template, User
from auth import get_current_active_user

router = APIRouter(prefix="/api/reports", tags=["reports"])

# Pydantic schemas
class ReportSummary(BaseModel):
    id: int
    patient_name: Optional[str]
    accession: Optional[str]
    modality: Optional[str]
    template_title: str
    indication_preview: str  # First 200 chars
    created_at: datetime
    user_name: Optional[str]

    class Config:
        from_attributes = True

class ReportDetail(BaseModel):
    id: int
    patient_name: Optional[str]
    accession: Optional[str]
    doctor_name: Optional[str]
    hospital_name: Optional[str]
    referrer: Optional[str]
    indication: str
    generated_report: str
    modality: Optional[str]
    study_datetime: Optional[str]
    template_title: str
    template_category: Optional[str]

    # AI fields
    ai_summary: Optional[str]
    ai_conclusion: Optional[str]
    key_findings: Optional[List[str]]
    report_language: Optional[str]
    validation_status: Optional[str]
    validation_errors: Optional[List[str]]
    validation_warnings: Optional[List[str]]

    # Context
    similar_cases_used: Optional[List[dict]]
    highlights: Optional[List[str]]

    # Metadata
    created_at: datetime
    updated_at: datetime
    created_by_user_name: Optional[str]

    class Config:
        from_attributes = True

class ReportStats(BaseModel):
    total_reports: int
    reports_today: int
    reports_this_week: int
    reports_this_month: int
    by_modality: dict
    by_template: dict

@router.get("/", response_model=List[ReportSummary])
async def list_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    modality: Optional[str] = Query(None),
    patient_name: Optional[str] = Query(None),
    accession: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List all reports with filtering and pagination
    """
    query = db.query(Report).join(Template).join(User, Report.user_id == User.id, isouter=True)

    # Apply filters
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Report.patient_name.ilike(search_term),
                Report.accession.ilike(search_term),
                Report.indication.ilike(search_term),
                Report.generated_report.ilike(search_term),
                Template.title.ilike(search_term)
            )
        )

    if modality:
        query = query.filter(Report.modality == modality)

    if patient_name:
        query = query.filter(Report.patient_name.ilike(f"%{patient_name}%"))

    if accession:
        query = query.filter(Report.accession == accession)

    if start_date:
        start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        query = query.filter(Report.created_at >= start_dt)

    if end_date:
        end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        query = query.filter(Report.created_at <= end_dt)

    # Order by most recent first
    query = query.order_by(desc(Report.created_at))

    # Pagination
    reports = query.offset(skip).limit(limit).all()

    # Format results
    results = []
    for report in reports:
        results.append(ReportSummary(
            id=report.id,
            patient_name=report.patient_name,
            accession=report.accession,
            modality=report.modality,
            template_title=report.template.title,
            indication_preview=report.indication[:200] + "..." if len(report.indication) > 200 else report.indication,
            created_at=report.created_at,
            user_name=report.user.full_name if report.user else None
        ))

    return results

@router.get("/stats", response_model=ReportStats)
async def get_report_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get statistics about reports
    """
    now = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    total = db.query(func.count(Report.id)).scalar()
    today_count = db.query(func.count(Report.id)).filter(Report.created_at >= today).scalar()
    week_count = db.query(func.count(Report.id)).filter(Report.created_at >= week_ago).scalar()
    month_count = db.query(func.count(Report.id)).filter(Report.created_at >= month_ago).scalar()

    # By modality
    modality_counts = db.query(
        Report.modality,
        func.count(Report.id)
    ).filter(Report.modality.isnot(None)).group_by(Report.modality).all()

    by_modality = {mod: count for mod, count in modality_counts}

    # By template
    template_counts = db.query(
        Template.title,
        func.count(Report.id)
    ).join(Report).group_by(Template.title).all()

    by_template = {title: count for title, count in template_counts}

    return ReportStats(
        total_reports=total,
        reports_today=today_count,
        reports_this_week=week_count,
        reports_this_month=month_count,
        by_modality=by_modality,
        by_template=by_template
    )

@router.get("/{report_id}", response_model=ReportDetail)
async def get_report(
    report_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific report
    """
    report = db.query(Report).options(
        joinedload(Report.template),
        joinedload(Report.user)
    ).filter(Report.id == report_id).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return ReportDetail(
        id=report.id,
        patient_name=report.patient_name,
        accession=report.accession,
        doctor_name=report.doctor_name,
        hospital_name=report.hospital_name,
        referrer=report.referrer,
        indication=report.indication,
        generated_report=report.generated_report,
        modality=report.modality,
        study_datetime=report.study_datetime,
        template_title=report.template.title,
        template_category=report.template.category,
        ai_summary=report.ai_summary,
        ai_conclusion=report.ai_conclusion,
        key_findings=report.key_findings,
        report_language=report.report_language,
        validation_status=report.validation_status,
        validation_errors=report.validation_errors,
        validation_warnings=report.validation_warnings,
        similar_cases_used=report.similar_cases_used,
        highlights=report.highlights,
        created_at=report.created_at,
        updated_at=report.updated_at,
        created_by_user_name=report.user.full_name if report.user else None
    )

@router.delete("/{report_id}")
async def delete_report(
    report_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a report
    """
    report = db.query(Report).filter(Report.id == report_id).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Only allow deletion by the creator or admins
    if report.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this report")

    db.delete(report)
    db.commit()

    return {"message": "Report deleted successfully"}

@router.get("/export/{report_id}/text")
async def export_report_text(
    report_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Export report as plain text
    """
    report = db.query(Report).filter(Report.id == report_id).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    from fastapi.responses import PlainTextResponse

    return PlainTextResponse(
        content=report.generated_report,
        media_type="text/plain",
        headers={
            "Content-Disposition": f"attachment; filename=report_{report.accession or report.id}.txt"
        }
    )
