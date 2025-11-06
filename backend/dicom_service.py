"""
DICOM Service for Medical Image Handling
Provides DICOM file parsing, metadata extraction, and image processing
"""
import os
import shutil
from pathlib import Path
from typing import Dict, List, Optional, BinaryIO
import logging
from datetime import datetime
import hashlib

logger = logging.getLogger(__name__)

class DICOMService:
    """Service for DICOM file handling"""

    def __init__(self):
        # Configuration
        self.enabled = os.getenv("DICOM_ENABLED", "true").lower() == "true"
        self.upload_dir = Path(os.getenv("DICOM_UPLOAD_DIR", "/app/dicom_storage"))
        self.max_file_size = int(os.getenv("DICOM_MAX_FILE_SIZE", "104857600"))  # 100MB default

        # Create storage directory
        self.upload_dir.mkdir(parents=True, exist_ok=True)

        # Check for pydicom
        self.pydicom_available = False
        try:
            import pydicom
            self.pydicom_available = True
            logger.info("✓ pydicom library available")
        except ImportError:
            logger.warning("pydicom not installed. Install with: pip install pydicom")
            self.enabled = False

    def parse_dicom_file(self, file_path: Path) -> Dict[str, any]:
        """
        Parse DICOM file and extract metadata

        Args:
            file_path: Path to DICOM file

        Returns:
            Dictionary with DICOM metadata
        """
        if not self.pydicom_available:
            return {
                "success": False,
                "error": "pydicom library not available"
            }

        try:
            import pydicom
            from pydicom.errors import InvalidDicomError

            logger.info(f"Parsing DICOM file: {file_path}")

            # Read DICOM file
            ds = pydicom.dcmread(str(file_path))

            # Extract patient information
            patient_info = {
                "patient_name": str(ds.get("PatientName", "Unknown")),
                "patient_id": str(ds.get("PatientID", "")),
                "patient_birth_date": str(ds.get("PatientBirthDate", "")),
                "patient_sex": str(ds.get("PatientSex", "")),
                "patient_age": str(ds.get("PatientAge", ""))
            }

            # Extract study information
            study_info = {
                "study_instance_uid": str(ds.get("StudyInstanceUID", "")),
                "study_date": str(ds.get("StudyDate", "")),
                "study_time": str(ds.get("StudyTime", "")),
                "study_description": str(ds.get("StudyDescription", "")),
                "accession_number": str(ds.get("AccessionNumber", "")),
                "referring_physician": str(ds.get("ReferringPhysicianName", ""))
            }

            # Extract series information
            series_info = {
                "series_instance_uid": str(ds.get("SeriesInstanceUID", "")),
                "series_number": str(ds.get("SeriesNumber", "")),
                "series_description": str(ds.get("SeriesDescription", "")),
                "modality": str(ds.get("Modality", "")),
                "body_part_examined": str(ds.get("BodyPartExamined", ""))
            }

            # Extract image information
            image_info = {
                "sop_instance_uid": str(ds.get("SOPInstanceUID", "")),
                "instance_number": str(ds.get("InstanceNumber", "")),
                "rows": int(ds.get("Rows", 0)),
                "columns": int(ds.get("Columns", 0)),
                "bits_allocated": int(ds.get("BitsAllocated", 0)),
                "bits_stored": int(ds.get("BitsStored", 0)),
                "pixel_spacing": str(ds.get("PixelSpacing", "")),
                "slice_thickness": str(ds.get("SliceThickness", "")),
                "image_position": str(ds.get("ImagePositionPatient", "")),
                "image_orientation": str(ds.get("ImageOrientationPatient", ""))
            }

            # Extract equipment information
            equipment_info = {
                "manufacturer": str(ds.get("Manufacturer", "")),
                "manufacturer_model": str(ds.get("ManufacturerModelName", "")),
                "station_name": str(ds.get("StationName", "")),
                "institution_name": str(ds.get("InstitutionName", ""))
            }

            # Check if image data is present
            has_pixel_data = hasattr(ds, 'PixelData')

            logger.info(f"✓ DICOM parsed: {patient_info['patient_name']} - {series_info['modality']}")

            return {
                "success": True,
                "patient": patient_info,
                "study": study_info,
                "series": series_info,
                "image": image_info,
                "equipment": equipment_info,
                "has_pixel_data": has_pixel_data,
                "transfer_syntax": str(ds.file_meta.get("TransferSyntaxUID", "")) if hasattr(ds, 'file_meta') else ""
            }

        except InvalidDicomError as e:
            logger.error(f"Invalid DICOM file: {e}")
            return {
                "success": False,
                "error": "Invalid DICOM file format"
            }
        except Exception as e:
            logger.error(f"DICOM parsing failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def save_dicom_file(
        self,
        file: BinaryIO,
        filename: str,
        study_uid: Optional[str] = None
    ) -> Dict[str, any]:
        """
        Save DICOM file to storage

        Args:
            file: File binary stream
            filename: Original filename
            study_uid: Study UID for organization (optional)

        Returns:
            Dictionary with save results
        """
        if not self.enabled:
            return {
                "success": False,
                "error": "DICOM service is disabled"
            }

        try:
            # Generate unique filename based on content hash
            file_content = file.read()
            file.seek(0)  # Reset file pointer

            file_hash = hashlib.sha256(file_content).hexdigest()[:16]
            new_filename = f"{file_hash}_{filename}"

            # Organize by study UID if provided
            if study_uid:
                save_dir = self.upload_dir / study_uid
            else:
                save_dir = self.upload_dir / "unknown_study"

            save_dir.mkdir(parents=True, exist_ok=True)

            # Save file
            save_path = save_dir / new_filename

            with open(save_path, 'wb') as f:
                f.write(file_content)

            logger.info(f"✓ DICOM file saved: {save_path}")

            # Parse the saved file to extract metadata
            metadata = self.parse_dicom_file(save_path)

            return {
                "success": True,
                "file_path": str(save_path),
                "file_size": len(file_content),
                "metadata": metadata
            }

        except Exception as e:
            logger.error(f"Failed to save DICOM file: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def extract_image_png(self, file_path: Path, output_path: Optional[Path] = None) -> Dict[str, any]:
        """
        Extract image from DICOM as PNG

        Args:
            file_path: Path to DICOM file
            output_path: Optional output path for PNG (default: same dir as DICOM)

        Returns:
            Dictionary with extraction results
        """
        if not self.pydicom_available:
            return {
                "success": False,
                "error": "pydicom not available"
            }

        try:
            import pydicom
            import numpy as np
            from PIL import Image

            # Read DICOM
            ds = pydicom.dcmread(str(file_path))

            if not hasattr(ds, 'PixelData'):
                return {
                    "success": False,
                    "error": "No pixel data in DICOM file"
                }

            # Get pixel array
            pixel_array = ds.pixel_array

            # Normalize to 0-255 range
            pixel_array = pixel_array.astype(float)
            pixel_array = (pixel_array - pixel_array.min()) / (pixel_array.max() - pixel_array.min()) * 255
            pixel_array = pixel_array.astype(np.uint8)

            # Create PIL Image
            image = Image.fromarray(pixel_array)

            # Determine output path
            if output_path is None:
                output_path = file_path.with_suffix('.png')

            # Save as PNG
            image.save(output_path)

            logger.info(f"✓ Image extracted to PNG: {output_path}")

            return {
                "success": True,
                "png_path": str(output_path),
                "image_size": image.size
            }

        except ImportError as e:
            return {
                "success": False,
                "error": f"Missing dependency: {e}. Install with: pip install Pillow numpy"
            }
        except Exception as e:
            logger.error(f"PNG extraction failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def get_dicom_files(self, study_uid: Optional[str] = None) -> List[Dict[str, any]]:
        """
        List DICOM files in storage

        Args:
            study_uid: Optional study UID to filter by

        Returns:
            List of DICOM file information
        """
        files = []

        try:
            if study_uid:
                search_dir = self.upload_dir / study_uid
                if not search_dir.exists():
                    return []
            else:
                search_dir = self.upload_dir

            # Find all DICOM files
            for dicom_file in search_dir.rglob("*.dcm"):
                files.append({
                    "path": str(dicom_file),
                    "filename": dicom_file.name,
                    "size": dicom_file.stat().st_size,
                    "modified": datetime.fromtimestamp(dicom_file.stat().st_mtime).isoformat()
                })

            # Also check files without .dcm extension
            for dicom_file in search_dir.rglob("*"):
                if dicom_file.is_file() and dicom_file.suffix != '.dcm' and dicom_file.suffix != '.png':
                    # Try to parse as DICOM
                    metadata = self.parse_dicom_file(dicom_file)
                    if metadata.get("success"):
                        files.append({
                            "path": str(dicom_file),
                            "filename": dicom_file.name,
                            "size": dicom_file.stat().st_size,
                            "modified": datetime.fromtimestamp(dicom_file.stat().st_mtime).isoformat()
                        })

            return files

        except Exception as e:
            logger.error(f"Failed to list DICOM files: {e}")
            return []

    def delete_dicom_file(self, file_path: str) -> bool:
        """
        Delete DICOM file from storage

        Args:
            file_path: Path to DICOM file

        Returns:
            True if deleted successfully
        """
        try:
            path = Path(file_path)

            # Security check: ensure path is within upload directory
            if not path.resolve().is_relative_to(self.upload_dir.resolve()):
                logger.error(f"Security violation: Attempted to delete file outside storage: {file_path}")
                return False

            if path.exists():
                path.unlink()
                logger.info(f"✓ DICOM file deleted: {file_path}")

                # Also delete associated PNG if exists
                png_path = path.with_suffix('.png')
                if png_path.exists():
                    png_path.unlink()

                return True

            return False

        except Exception as e:
            logger.error(f"Failed to delete DICOM file: {e}")
            return False

    def generate_clinical_summary(self, metadata: Dict[str, any]) -> str:
        """
        Generate a clinical summary from DICOM metadata for report generation

        Args:
            metadata: DICOM metadata dictionary

        Returns:
            Formatted clinical summary string
        """
        if not metadata.get("success"):
            return ""

        patient = metadata.get("patient", {})
        study = metadata.get("study", {})
        series = metadata.get("series", {})

        summary_parts = []

        # Patient demographics
        if patient.get("patient_name") != "Unknown":
            summary_parts.append(f"Patient: {patient.get('patient_name')}")

        if patient.get("patient_age"):
            summary_parts.append(f"Age: {patient.get('patient_age')}")

        if patient.get("patient_sex"):
            summary_parts.append(f"Sex: {patient.get('patient_sex')}")

        # Study information
        if study.get("study_date"):
            summary_parts.append(f"Study Date: {study.get('study_date')}")

        if study.get("accession_number"):
            summary_parts.append(f"Accession: {study.get('accession_number')}")

        # Series information
        modality = series.get("modality")
        body_part = series.get("body_part_examined")

        if modality and body_part:
            summary_parts.append(f"Exam: {modality} {body_part}")
        elif modality:
            summary_parts.append(f"Modality: {modality}")

        if series.get("series_description"):
            summary_parts.append(f"Series: {series.get('series_description')}")

        return "\n".join(summary_parts)

    def get_status(self) -> Dict[str, any]:
        """Get DICOM service status"""
        return {
            "enabled": self.enabled,
            "pydicom_available": self.pydicom_available,
            "upload_dir": str(self.upload_dir),
            "max_file_size_mb": self.max_file_size / (1024 * 1024),
            "storage_used_mb": self._get_storage_size() / (1024 * 1024) if self.upload_dir.exists() else 0,
            "total_files": len(list(self.upload_dir.rglob("*"))) if self.upload_dir.exists() else 0
        }

    def _get_storage_size(self) -> int:
        """Get total size of DICOM storage in bytes"""
        total = 0
        for file in self.upload_dir.rglob("*"):
            if file.is_file():
                total += file.stat().st_size
        return total

# Singleton instance
dicom_service = DICOMService()
