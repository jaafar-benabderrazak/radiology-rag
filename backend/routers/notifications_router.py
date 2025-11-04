"""
API Router for Critical Notifications Management
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from models import CriticalNotification, Report, User, NotificationStatus
from auth import get_current_active_user

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

class NotificationResponse(BaseModel):
    id: int
    report_id: int
    patient_name: Optional[str]
    accession: Optional[str]
    recipient_email: str
    critical_findings: List[dict]
    priority: str
    status: str
    sent_at: Optional[datetime]
    read_at: Optional[datetime]
    acknowledged_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class AcknowledgeRequest(BaseModel):
    note: Optional[str] = None

@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all critical notifications (filtered by user role)"""
    query = db.query(CriticalNotification).join(Report)

    # Filter based on user role
    if current_user.role == "doctor":
        # Doctors see notifications sent to them
        query = query.filter(CriticalNotification.recipient_email == current_user.email)
    elif current_user.role == "radiologist":
        # Radiologists see notifications they sent
        query = query.filter(CriticalNotification.sent_by_user_id == current_user.id)
    # Admins see all

    if status:
        query = query.filter(CriticalNotification.status == status)

    notifications = query.order_by(desc(CriticalNotification.created_at)).limit(limit).all()

    return [
        NotificationResponse(
            id=n.id,
            report_id=n.report_id,
            patient_name=n.report.patient_name,
            accession=n.report.accession,
            recipient_email=n.recipient_email,
            critical_findings=n.critical_findings,
            priority=n.priority.value,
            status=n.status.value,
            sent_at=n.sent_at,
            read_at=n.read_at,
            acknowledged_at=n.acknowledged_at,
            created_at=n.created_at
        )
        for n in notifications
    ]

@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific notification by ID"""
    notification = db.query(CriticalNotification).filter(
        CriticalNotification.id == notification_id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    # Check permissions
    if current_user.role == "doctor" and notification.recipient_email != current_user.email:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == "radiologist" and notification.sent_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Mark as read if recipient is viewing
    if notification.recipient_email == current_user.email and not notification.read_at:
        notification.read_at = datetime.now()
        if notification.status == NotificationStatus.SENT:
            notification.status = NotificationStatus.READ
        db.commit()

    return NotificationResponse(
        id=notification.id,
        report_id=notification.report_id,
        patient_name=notification.report.patient_name,
        accession=notification.report.accession,
        recipient_email=notification.recipient_email,
        critical_findings=notification.critical_findings,
        priority=notification.priority.value,
        status=notification.status.value,
        sent_at=notification.sent_at,
        read_at=notification.read_at,
        acknowledged_at=notification.acknowledged_at,
        created_at=notification.created_at
    )

@router.post("/{notification_id}/acknowledge")
async def acknowledge_notification(
    notification_id: int,
    req: AcknowledgeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Acknowledge a critical notification"""
    notification = db.query(CriticalNotification).filter(
        CriticalNotification.id == notification_id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    # Only recipient can acknowledge
    if notification.recipient_email != current_user.email:
        raise HTTPException(status_code=403, detail="Only recipient can acknowledge")

    notification.acknowledged_at = datetime.now()
    notification.acknowledgment_note = req.note
    notification.status = NotificationStatus.ACKNOWLEDGED

    db.commit()

    return {"message": "Notification acknowledged successfully"}

@router.get("/stats/summary")
async def get_notification_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get notification statistics"""
    query = db.query(CriticalNotification)

    # Filter based on user role
    if current_user.role == "doctor":
        query = query.filter(CriticalNotification.recipient_email == current_user.email)
    elif current_user.role == "radiologist":
        query = query.filter(CriticalNotification.sent_by_user_id == current_user.id)

    total = query.count()
    pending = query.filter(CriticalNotification.status == NotificationStatus.PENDING).count()
    sent = query.filter(CriticalNotification.status == NotificationStatus.SENT).count()
    read = query.filter(CriticalNotification.status == NotificationStatus.READ).count()
    acknowledged = query.filter(CriticalNotification.status == NotificationStatus.ACKNOWLEDGED).count()

    return {
        "total": total,
        "pending": pending,
        "sent": sent,
        "read": read,
        "acknowledged": acknowledged,
        "unacknowledged": total - acknowledged
    }
