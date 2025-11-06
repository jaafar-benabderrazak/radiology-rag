"""
API Router for DICOM Operations
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from typing import List, Optional
from pydantic import BaseModel
from pathlib import Path

from models import User
from auth import get_current_active_user
from dicom_service import dicom_service

router = APIRouter(prefix="/api/dicom", tags=["dicom"])

class DICOMMetadataResponse(BaseModel):
    success: bool
    patient: Optional[dict] = None
    study: Optional[dict] = None
    series: Optional[dict] = None
    image: Optional[dict] = None
    equipment: Optional[dict] = None
    has_pixel_data: Optional[bool] = None
    transfer_syntax: Optional[str] = None
    error: Optional[str] = None

class DICOMUploadResponse(BaseModel):
    success: bool
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    metadata: Optional[dict] = None
    error: Optional[str] = None

class DICOMFileInfo(BaseModel):
    path: str
    filename: str
    size: int
    modified: str

@router.post("/upload", response_model=DICOMUploadResponse)
async def upload_dicom(
    file: UploadFile = File(...),
    study_uid: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload and parse DICOM file

    Args:
        file: DICOM file to upload
        study_uid: Optional study UID for organization

    Returns:
        Upload results with extracted metadata
    """
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        # Check file size
        file_content = await file.read()
        if len(file_content) > dicom_service.max_file_size:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Max size: {dicom_service.max_file_size / (1024*1024)} MB"
            )

        # Reset file pointer
        await file.seek(0)

        # Save and parse DICOM
        result = dicom_service.save_dicom_file(
            file=file.file,
            filename=file.filename,
            study_uid=study_uid
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Failed to process DICOM file")
            )

        return DICOMUploadResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DICOM upload error: {str(e)}")

@router.get("/metadata/{file_path:path}", response_model=DICOMMetadataResponse)
async def get_dicom_metadata(
    file_path: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get metadata from DICOM file

    Args:
        file_path: Path to DICOM file

    Returns:
        DICOM metadata
    """
    try:
        path = Path(file_path)

        # Security check
        if not path.resolve().is_relative_to(dicom_service.upload_dir.resolve()):
            raise HTTPException(status_code=403, detail="Access denied")

        if not path.exists():
            raise HTTPException(status_code=404, detail="DICOM file not found")

        # Parse DICOM
        metadata = dicom_service.parse_dicom_file(path)

        if not metadata.get("success"):
            raise HTTPException(
                status_code=500,
                detail=metadata.get("error", "Failed to parse DICOM")
            )

        return DICOMMetadataResponse(**metadata)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Metadata extraction error: {str(e)}")

@router.get("/image/{file_path:path}")
async def get_dicom_image(
    file_path: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get DICOM image as PNG

    Args:
        file_path: Path to DICOM file

    Returns:
        PNG image file
    """
    try:
        path = Path(file_path)

        # Security check
        if not path.resolve().is_relative_to(dicom_service.upload_dir.resolve()):
            raise HTTPException(status_code=403, detail="Access denied")

        if not path.exists():
            raise HTTPException(status_code=404, detail="DICOM file not found")

        # Check if PNG already exists
        png_path = path.with_suffix('.png')

        if not png_path.exists():
            # Extract PNG from DICOM
            result = dicom_service.extract_image_png(path, png_path)

            if not result.get("success"):
                raise HTTPException(
                    status_code=500,
                    detail=result.get("error", "Failed to extract image")
                )

        # Return PNG file
        return FileResponse(
            png_path,
            media_type="image/png",
            filename=f"{path.stem}.png"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image extraction error: {str(e)}")

@router.get("/list", response_model=List[DICOMFileInfo])
async def list_dicom_files(
    study_uid: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """
    List DICOM files in storage

    Args:
        study_uid: Optional study UID to filter by

    Returns:
        List of DICOM files
    """
    try:
        files = dicom_service.get_dicom_files(study_uid=study_uid)
        return files

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list DICOM files: {str(e)}")

@router.delete("/{file_path:path}")
async def delete_dicom(
    file_path: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete DICOM file

    Args:
        file_path: Path to DICOM file

    Returns:
        Deletion status
    """
    try:
        success = dicom_service.delete_dicom_file(file_path)

        if not success:
            raise HTTPException(status_code=404, detail="DICOM file not found or could not be deleted")

        return {"message": "DICOM file deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deletion error: {str(e)}")

@router.get("/status")
async def get_dicom_status(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get DICOM service status

    Returns:
        Service configuration and status
    """
    return dicom_service.get_status()

@router.post("/clinical-summary/{file_path:path}")
async def generate_clinical_summary(
    file_path: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate clinical summary from DICOM metadata for report generation

    Args:
        file_path: Path to DICOM file

    Returns:
        Clinical summary text
    """
    try:
        path = Path(file_path)

        # Security check
        if not path.resolve().is_relative_to(dicom_service.upload_dir.resolve()):
            raise HTTPException(status_code=403, detail="Access denied")

        if not path.exists():
            raise HTTPException(status_code=404, detail="DICOM file not found")

        # Parse DICOM
        metadata = dicom_service.parse_dicom_file(path)

        if not metadata.get("success"):
            raise HTTPException(
                status_code=500,
                detail=metadata.get("error", "Failed to parse DICOM")
            )

        # Generate summary
        summary = dicom_service.generate_clinical_summary(metadata)

        return {
            "success": True,
            "summary": summary,
            "metadata": metadata
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary generation error: {str(e)}")
