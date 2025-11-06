"""
API Router for Backup & Restore Operations
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from models import User
from auth import get_current_active_user, require_admin
from backup_service import backup_service
from restore_service import restore_service

router = APIRouter(prefix="/api/backups", tags=["backups"])

class BackupResponse(BaseModel):
    backup_name: str
    timestamp: str
    datetime: str
    archive_path: str
    size_mb: float
    database_size_mb: float

class BackupCreateRequest(BaseModel):
    description: Optional[str] = None

class RestoreRequest(BaseModel):
    backup_name: str
    restore_database: bool = True
    restore_config: bool = True
    restore_files: bool = True
    confirm: bool = False  # Safety check

@router.post("/create")
async def create_backup(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_admin)
):
    """
    Create a full system backup (admin only)
    Runs in background
    """
    try:
        # Run backup in background
        background_tasks.add_task(backup_service.create_full_backup)

        return {
            "message": "Backup started in background",
            "status": "processing"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start backup: {str(e)}")

@router.post("/create-sync")
async def create_backup_sync(
    current_user: User = Depends(require_admin)
):
    """
    Create a full system backup synchronously (admin only)
    Waits for completion
    """
    try:
        result = backup_service.create_full_backup()

        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Backup failed"))

        return {
            "message": "Backup created successfully",
            "backup": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")

@router.get("/list", response_model=List[BackupResponse])
async def list_backups(
    current_user: User = Depends(require_admin)
):
    """List all available backups (admin only)"""
    try:
        backups = backup_service.list_backups()
        return backups

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list backups: {str(e)}")

@router.get("/{backup_name}")
async def get_backup_info(
    backup_name: str,
    current_user: User = Depends(require_admin)
):
    """Get information about a specific backup (admin only)"""
    backup_info = backup_service.get_backup_info(backup_name)

    if not backup_info:
        raise HTTPException(status_code=404, detail="Backup not found")

    return backup_info

@router.delete("/{backup_name}")
async def delete_backup(
    backup_name: str,
    current_user: User = Depends(require_admin)
):
    """Delete a specific backup (admin only)"""
    success = backup_service.delete_backup(backup_name)

    if not success:
        raise HTTPException(status_code=404, detail="Backup not found or could not be deleted")

    return {"message": f"Backup {backup_name} deleted successfully"}

@router.post("/restore")
async def restore_from_backup(
    request: RestoreRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_admin)
):
    """
    Restore system from a backup (admin only)

    DANGEROUS: This will overwrite current data!
    Requires confirm=true
    """
    if not request.confirm:
        raise HTTPException(
            status_code=400,
            detail="Restore operation requires confirmation. Set 'confirm' to true."
        )

    try:
        # Verify backup exists
        backup_info = backup_service.get_backup_info(request.backup_name)
        if not backup_info:
            raise HTTPException(status_code=404, detail="Backup not found")

        # Run restore in background
        restore_options = {
            "restore_database": request.restore_database,
            "restore_config": request.restore_config,
            "restore_files": request.restore_files
        }

        background_tasks.add_task(
            restore_service.restore_from_backup,
            request.backup_name,
            restore_options
        )

        return {
            "message": "Restore started in background",
            "backup_name": request.backup_name,
            "backup_date": backup_info.get("datetime"),
            "status": "processing",
            "warning": "Application may need to be restarted after restore completes"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start restore: {str(e)}")

@router.post("/verify/{backup_name}")
async def verify_backup(
    backup_name: str,
    current_user: User = Depends(require_admin)
):
    """Verify backup integrity without restoring (admin only)"""
    try:
        result = restore_service.verify_backup(backup_name)

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Verification failed"))

        return {
            "message": "Backup verification passed",
            "verification": result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

@router.get("/status/health")
async def backup_health_check(
    current_user: User = Depends(require_admin)
):
    """
    Get backup system health status (admin only)
    Returns information about backup configuration and recent backups
    """
    try:
        backups = backup_service.list_backups()

        # Get most recent backup
        most_recent = backups[0] if backups else None

        # Calculate time since last backup
        time_since_last = None
        if most_recent:
            last_backup_time = datetime.fromisoformat(most_recent["datetime"])
            time_since_last = (datetime.now() - last_backup_time).total_seconds() / 3600  # hours

        # Calculate total backup size
        total_size_mb = sum(b.get("size_mb", 0) for b in backups)

        return {
            "backup_enabled": backup_service.backup_enabled,
            "backup_directory": str(backup_service.backup_dir),
            "total_backups": len(backups),
            "total_size_mb": round(total_size_mb, 2),
            "retention_days": backup_service.retention_days,
            "max_backups": backup_service.max_backups,
            "most_recent_backup": most_recent,
            "hours_since_last_backup": round(time_since_last, 1) if time_since_last else None,
            "remote_backup_enabled": backup_service.remote_backup_enabled,
            "status": "healthy" if most_recent and time_since_last < 48 else "warning"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")
