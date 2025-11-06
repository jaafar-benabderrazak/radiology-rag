# DICOM Integration Setup Guide

## Overview

The **DICOM Integration System** enables seamless handling of DICOM (Digital Imaging and Communications in Medicine) medical imaging files within the Radiology RAG platform. This feature allows radiologists to upload, parse, view, and integrate DICOM images directly into their reporting workflow.

### Key Features

- **DICOM File Parsing**: Extract comprehensive metadata from DICOM files
- **Patient Information Extraction**: Automatic extraction of patient demographics
- **Study Management**: Organize images by study, series, and instance
- **Image Viewing**: Convert DICOM pixel data to viewable PNG images
- **Clinical Summary Generation**: Auto-generate formatted summaries for reports
- **Secure Storage**: Hash-based file naming with organized directory structure
- **REST API**: Complete API for DICOM operations
- **Multi-modality Support**: CT, MRI, X-ray, Ultrasound, and more

---

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ DICOM Upload     │  │ DICOM Viewer     │  │ Metadata View │ │
│  │ Component        │  │ Component        │  │ Component     │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↕ REST API
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              DICOM Router (/api/dicom/*)                 │   │
│  │  - Upload DICOM files                                    │   │
│  │  - Extract metadata                                      │   │
│  │  - Convert to images                                     │   │
│  │  - Generate clinical summaries                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↕                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  DICOM Service                           │   │
│  │  - pydicom integration                                   │   │
│  │  - File storage management                               │   │
│  │  - Image conversion (PIL)                                │   │
│  │  - Metadata extraction                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                   DICOM File Storage                             │
│  /app/dicom_storage/                                             │
│    └── studies/                                                  │
│        └── {study_uid}/                                          │
│            └── {series_uid}/                                     │
│                └── {hash}.dcm                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Upload**: Frontend uploads DICOM file → Backend receives → Parse with pydicom
2. **Storage**: Generate hash → Organize by Study/Series → Save to disk
3. **Metadata**: Extract patient, study, series, image info → Return to frontend
4. **Viewing**: Read DICOM → Extract pixel data → Convert to PNG → Stream to frontend
5. **Reporting**: Generate clinical summary → Inject into report template

---

## Installation

### Prerequisites

```bash
# Python dependencies
pip install pydicom>=2.4.3
pip install Pillow>=10.0.0
pip install numpy>=1.24.0
```

### Docker Installation

Update your `backend/Dockerfile`:

```dockerfile
# Add DICOM dependencies
RUN pip install pydicom>=2.4.3 Pillow>=10.0.0 numpy>=1.24.0

# Create DICOM storage directory
RUN mkdir -p /app/dicom_storage && chmod 755 /app/dicom_storage
```

### Manual Installation

```bash
cd backend

# Install dependencies
pip install pydicom Pillow numpy

# Create storage directory
mkdir -p /app/dicom_storage
chmod 755 /app/dicom_storage
```

---

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# ==============================================
# DICOM Integration Configuration
# ==============================================
# Enable/disable DICOM file handling
DICOM_ENABLED=true

# DICOM storage directory (must be on persistent volume)
DICOM_UPLOAD_DIR=/app/dicom_storage

# Maximum DICOM file size in bytes (default: 100MB)
DICOM_MAX_FILE_SIZE=104857600
```

### Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `DICOM_ENABLED` | `true` | Enable/disable DICOM functionality |
| `DICOM_UPLOAD_DIR` | `/app/dicom_storage` | Storage location for DICOM files |
| `DICOM_MAX_FILE_SIZE` | `104857600` (100MB) | Maximum file size for uploads |

### Storage Structure

```
/app/dicom_storage/
├── studies/
│   └── 1.2.840.113619.2.55.3.2831164877.123.1234567890.1/
│       └── 1.2.840.113619.2.55.3.2831164877.123.1234567890.2/
│           ├── a3f5b8c9d2e1f4g7h8i9j0k1l2m3n4o5.dcm
│           └── b4g6c9d3f2e5g8h9i0j1k2l3m4n5o6p7.dcm
└── .dicom_registry.json
```

**Registry Structure:**
```json
{
  "files": [
    {
      "file_hash": "a3f5b8c9d2e1f4g7h8i9j0k1l2m3n4o5",
      "original_filename": "CT_CHEST_001.dcm",
      "study_uid": "1.2.840.113619.2.55.3.2831164877.123.1234567890.1",
      "series_uid": "1.2.840.113619.2.55.3.2831164877.123.1234567890.2",
      "patient_id": "12345678",
      "patient_name": "DOE^JOHN",
      "modality": "CT",
      "uploaded_at": "2025-11-06T10:30:00"
    }
  ]
}
```

---

## API Reference

### Base URL

```
http://localhost:8000/api/dicom
```

All endpoints require authentication via JWT Bearer token.

---

### 1. Upload DICOM File

**Endpoint:** `POST /api/dicom/upload`

**Description:** Upload and parse a DICOM file.

**Request:**
```http
POST /api/dicom/upload
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

file: <DICOM_FILE>
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/api/dicom/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@CT_CHEST_001.dcm"
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "DICOM file uploaded and parsed successfully",
  "file_path": "studies/1.2.840.113619.../1.2.840.113619.../a3f5b8c9.dcm",
  "metadata": {
    "patient": {
      "patient_name": "DOE^JOHN",
      "patient_id": "12345678",
      "patient_birth_date": "19850315",
      "patient_sex": "M",
      "patient_age": "038Y"
    },
    "study": {
      "study_instance_uid": "1.2.840.113619.2.55.3.2831164877.123.1234567890.1",
      "study_date": "20251106",
      "study_time": "103000",
      "study_description": "CT CHEST W CONTRAST",
      "accession_number": "A2025110601",
      "referring_physician": "SMITH^JOHN^M"
    },
    "series": {
      "series_instance_uid": "1.2.840.113619.2.55.3.2831164877.123.1234567890.2",
      "series_number": "2",
      "series_description": "CHEST 5.0 B70f",
      "modality": "CT",
      "body_part": "CHEST"
    },
    "image": {
      "instance_number": "1",
      "rows": 512,
      "columns": 512,
      "bits_allocated": 16,
      "bits_stored": 12,
      "samples_per_pixel": 1,
      "photometric_interpretation": "MONOCHROME2",
      "pixel_spacing": [0.6836, 0.6836],
      "slice_thickness": "5.0",
      "has_pixel_data": true
    },
    "equipment": {
      "manufacturer": "SIEMENS",
      "model": "SOMATOM Definition",
      "station_name": "CT01"
    }
  }
}
```

**Error Responses:**
```json
// 400 Bad Request - No file provided
{
  "detail": "No file uploaded"
}

// 400 Bad Request - Invalid DICOM file
{
  "detail": "Invalid DICOM file: <error_message>"
}

// 413 Payload Too Large
{
  "detail": "File size exceeds maximum allowed size (100MB)"
}
```

---

### 2. Get DICOM Metadata

**Endpoint:** `GET /api/dicom/metadata/{file_path:path}`

**Description:** Retrieve metadata from a stored DICOM file.

**Request:**
```http
GET /api/dicom/metadata/studies/1.2.840.113619.../a3f5b8c9.dcm
Authorization: Bearer <access_token>
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/api/dicom/metadata/studies/1.2.840.113619.../a3f5b8c9.dcm" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**
```json
{
  "success": true,
  "metadata": {
    "patient": { /* ... */ },
    "study": { /* ... */ },
    "series": { /* ... */ },
    "image": { /* ... */ },
    "equipment": { /* ... */ }
  }
}
```

---

### 3. Extract DICOM Image

**Endpoint:** `GET /api/dicom/image/{file_path:path}`

**Description:** Convert DICOM pixel data to PNG image.

**Request:**
```http
GET /api/dicom/image/studies/1.2.840.113619.../a3f5b8c9.dcm
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `format` (optional): Image format (`png`, `jpeg`). Default: `png`
- `quality` (optional): JPEG quality (1-100). Default: `95`

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/api/dicom/image/studies/1.2.840.113619.../a3f5b8c9.dcm?format=png" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output image.png
```

**Response (200 OK):**
```
Content-Type: image/png
<PNG_BINARY_DATA>
```

**Error Responses:**
```json
// 404 Not Found
{
  "detail": "DICOM file not found"
}

// 400 Bad Request
{
  "detail": "DICOM file does not contain pixel data"
}
```

---

### 4. List DICOM Files

**Endpoint:** `GET /api/dicom/list`

**Description:** List all stored DICOM files with metadata.

**Request:**
```http
GET /api/dicom/list?patient_id=12345678&modality=CT&limit=50
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `patient_id` (optional): Filter by patient ID
- `patient_name` (optional): Filter by patient name
- `modality` (optional): Filter by modality (CT, MR, XR, etc.)
- `study_date_from` (optional): Filter by study date (YYYYMMDD)
- `study_date_to` (optional): Filter by study date (YYYYMMDD)
- `limit` (optional): Maximum results. Default: `100`

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/api/dicom/list?modality=CT&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**
```json
{
  "success": true,
  "count": 15,
  "files": [
    {
      "file_path": "studies/1.2.840.../a3f5b8c9.dcm",
      "patient_id": "12345678",
      "patient_name": "DOE^JOHN",
      "study_uid": "1.2.840.113619.2.55.3.2831164877.123.1234567890.1",
      "series_uid": "1.2.840.113619.2.55.3.2831164877.123.1234567890.2",
      "modality": "CT",
      "study_date": "20251106",
      "study_description": "CT CHEST W CONTRAST",
      "uploaded_at": "2025-11-06T10:30:00"
    }
  ]
}
```

---

### 5. Delete DICOM File

**Endpoint:** `DELETE /api/dicom/{file_path:path}`

**Description:** Delete a DICOM file from storage.

**Request:**
```http
DELETE /api/dicom/studies/1.2.840.113619.../a3f5b8c9.dcm
Authorization: Bearer <access_token>
```

**cURL Example:**
```bash
curl -X DELETE "http://localhost:8000/api/dicom/studies/1.2.840.113619.../a3f5b8c9.dcm" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "DICOM file deleted successfully"
}
```

---

### 6. Generate Clinical Summary

**Endpoint:** `POST /api/dicom/clinical-summary/{file_path:path}`

**Description:** Generate formatted clinical summary for report.

**Request:**
```http
POST /api/dicom/clinical-summary/studies/1.2.840.../a3f5b8c9.dcm
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "include_patient_info": true,
  "include_study_info": true,
  "include_technical_params": true
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/api/dicom/clinical-summary/studies/1.2.840.../a3f5b8c9.dcm" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "include_patient_info": true,
    "include_study_info": true,
    "include_technical_params": true
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "summary": "PATIENT INFORMATION:\nName: DOE, JOHN\nID: 12345678\nAge: 38Y\nSex: M\n\nSTUDY INFORMATION:\nExam: CT CHEST W CONTRAST\nDate: November 6, 2025\nAccession: A2025110601\nModality: CT\n\nTECHNICAL PARAMETERS:\nManufacturer: SIEMENS SOMATOM Definition\nSlice Thickness: 5.0 mm\nMatrix: 512 x 512\nPixel Spacing: 0.68 x 0.68 mm",
  "structured_data": {
    "patient": { /* ... */ },
    "study": { /* ... */ },
    "technical": { /* ... */ }
  }
}
```

---

### 7. Get Service Status

**Endpoint:** `GET /api/dicom/status`

**Description:** Check DICOM service status and configuration.

**Request:**
```http
GET /api/dicom/status
Authorization: Bearer <access_token>
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/api/dicom/status" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**
```json
{
  "enabled": true,
  "storage_dir": "/app/dicom_storage",
  "max_file_size_mb": 100,
  "supported_formats": [".dcm", ".dicom"],
  "pydicom_version": "2.4.3",
  "storage_info": {
    "total_files": 150,
    "total_size_mb": 2450.5,
    "studies_count": 45,
    "series_count": 78
  }
}
```

---

## Usage Examples

### Python Usage

```python
import requests

API_BASE = "http://localhost:8000"
TOKEN = "your_jwt_token_here"

headers = {
    "Authorization": f"Bearer {TOKEN}"
}

# 1. Upload DICOM file
with open("CT_CHEST_001.dcm", "rb") as f:
    files = {"file": ("CT_CHEST_001.dcm", f, "application/dicom")}
    response = requests.post(
        f"{API_BASE}/api/dicom/upload",
        headers=headers,
        files=files
    )
    upload_result = response.json()
    file_path = upload_result["file_path"]
    print(f"Uploaded: {file_path}")

# 2. Get metadata
response = requests.get(
    f"{API_BASE}/api/dicom/metadata/{file_path}",
    headers=headers
)
metadata = response.json()
print(f"Patient: {metadata['metadata']['patient']['patient_name']}")

# 3. Download image
response = requests.get(
    f"{API_BASE}/api/dicom/image/{file_path}",
    headers=headers
)
with open("extracted_image.png", "wb") as f:
    f.write(response.content)
print("Image saved")

# 4. Generate clinical summary
response = requests.post(
    f"{API_BASE}/api/dicom/clinical-summary/{file_path}",
    headers=headers,
    json={
        "include_patient_info": True,
        "include_study_info": True,
        "include_technical_params": True
    }
)
summary = response.json()
print(summary["summary"])

# 5. List all CT studies
response = requests.get(
    f"{API_BASE}/api/dicom/list",
    headers=headers,
    params={"modality": "CT", "limit": 20}
)
files = response.json()
print(f"Found {files['count']} CT studies")
```

### JavaScript/TypeScript Usage

```typescript
const API_BASE = "http://localhost:8000"
const token = localStorage.getItem("access_token")

const headers = {
  "Authorization": `Bearer ${token}`
}

// 1. Upload DICOM file
async function uploadDICOM(file: File) {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(`${API_BASE}/api/dicom/upload`, {
    method: "POST",
    headers: headers,
    body: formData
  })

  const result = await response.json()
  console.log("Uploaded:", result.file_path)
  return result
}

// 2. Get DICOM metadata
async function getMetadata(filePath: string) {
  const response = await fetch(
    `${API_BASE}/api/dicom/metadata/${filePath}`,
    { headers }
  )

  const result = await response.json()
  return result.metadata
}

// 3. Display DICOM image
async function displayImage(filePath: string, imgElement: HTMLImageElement) {
  const response = await fetch(
    `${API_BASE}/api/dicom/image/${filePath}`,
    { headers }
  )

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  imgElement.src = url
}

// 4. List DICOM files
async function listDICOMs(modality?: string) {
  const params = new URLSearchParams()
  if (modality) params.append("modality", modality)

  const response = await fetch(
    `${API_BASE}/api/dicom/list?${params}`,
    { headers }
  )

  const result = await response.json()
  return result.files
}

// Usage in React component
function DicomUpload() {
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const result = await uploadDICOM(file)
      alert(`DICOM uploaded: ${result.metadata.patient.patient_name}`)
    } catch (error) {
      console.error("Upload failed:", error)
    }
  }

  return (
    <input
      type="file"
      accept=".dcm,.dicom"
      onChange={handleFileUpload}
    />
  )
}
```

---

## Integration with Report Generation

### Auto-populate Report from DICOM

When generating a radiology report, automatically inject DICOM metadata:

```python
# In your report generation endpoint
from dicom_service import dicom_service

@router.post("/generate")
async def generate_report(
    dicom_file_path: Optional[str] = None,
    clinical_indication: str = None,
    ...
):
    # If DICOM file provided, extract clinical summary
    dicom_context = ""
    if dicom_file_path:
        summary_result = dicom_service.generate_clinical_summary(
            file_path=Path(dicom_file_path),
            include_patient_info=True,
            include_study_info=True,
            include_technical_params=True
        )

        if summary_result["success"]:
            dicom_context = summary_result["summary"]

    # Include DICOM context in AI prompt
    prompt = f"""
    Generate a radiology report.

    {dicom_context}

    Clinical Indication: {clinical_indication}

    Findings:
    """

    # Generate report with AI...
```

### Template Integration

Update report templates to include DICOM metadata:

```jinja2
{# report_template.html #}
<h2>PATIENT INFORMATION</h2>
<p>Name: {{ dicom_metadata.patient.patient_name }}</p>
<p>ID: {{ dicom_metadata.patient.patient_id }}</p>
<p>DOB: {{ dicom_metadata.patient.patient_birth_date }}</p>

<h2>STUDY INFORMATION</h2>
<p>Exam: {{ dicom_metadata.study.study_description }}</p>
<p>Date: {{ dicom_metadata.study.study_date }}</p>
<p>Accession: {{ dicom_metadata.study.accession_number }}</p>

<h2>TECHNIQUE</h2>
<p>Modality: {{ dicom_metadata.series.modality }}</p>
<p>Manufacturer: {{ dicom_metadata.equipment.manufacturer }}</p>
<p>Slice Thickness: {{ dicom_metadata.image.slice_thickness }} mm</p>
```

---

## Security Considerations

### File Validation

```python
# Always validate DICOM files before processing
def is_valid_dicom(file_path: Path) -> bool:
    try:
        ds = pydicom.dcmread(str(file_path))
        # Check required attributes
        required = ["PatientID", "StudyInstanceUID", "SeriesInstanceUID"]
        return all(hasattr(ds, attr) for attr in required)
    except:
        return False
```

### Path Traversal Prevention

```python
# dicom_service.py already includes path validation
def _validate_file_path(self, file_path: Path) -> bool:
    """Prevent directory traversal attacks"""
    resolved = file_path.resolve()
    return str(resolved).startswith(str(self.storage_dir.resolve()))
```

### File Size Limits

```python
# Enforce file size limits
MAX_FILE_SIZE = int(os.getenv("DICOM_MAX_FILE_SIZE", 104857600))  # 100MB

@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    # Check file size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(413, "File too large")
```

### PHI Protection

**IMPORTANT:** DICOM files contain Protected Health Information (PHI):

1. **Encryption at Rest**: Store DICOM files on encrypted volumes
2. **Access Control**: Require authentication for all endpoints
3. **Audit Logging**: Log all DICOM file access
4. **Retention Policy**: Implement automatic deletion after retention period
5. **De-identification**: Consider de-identifying DICOM files for research

```python
# Example: De-identify DICOM file
def de_identify_dicom(input_path: Path, output_path: Path):
    ds = pydicom.dcmread(str(input_path))

    # Remove patient identifying information
    ds.PatientName = "ANONYMIZED"
    ds.PatientID = "000000"
    ds.PatientBirthDate = ""
    ds.PatientAddress = ""

    # Remove physician information
    ds.ReferringPhysicianName = ""
    ds.PerformingPhysicianName = ""

    # Save de-identified file
    ds.save_as(str(output_path))
```

---

## Troubleshooting

### Common Issues

#### 1. "pydicom not installed"

**Symptom:**
```
ModuleNotFoundError: No module named 'pydicom'
```

**Solution:**
```bash
pip install pydicom>=2.4.3
```

#### 2. "Invalid DICOM file"

**Symptom:**
```json
{
  "detail": "Invalid DICOM file: Cannot read DICOM header"
}
```

**Solutions:**
- Verify file is actually a DICOM file (not renamed JPEG/PNG)
- Check file is not corrupted
- Ensure file has DICOM preamble and prefix
- Try opening file with DICOM viewer (Horos, 3D Slicer)

**Validation:**
```bash
# Use pydicom CLI to validate
python -m pydicom.cli.show yourfile.dcm
```

#### 3. "No pixel data found"

**Symptom:**
```json
{
  "detail": "DICOM file does not contain pixel data"
}
```

**Explanation:**
Some DICOM files contain only metadata (e.g., RT Structure Sets, SR documents).

**Solution:**
Only image modalities (CT, MR, XR, US) contain pixel data. Check modality:
```python
ds = pydicom.dcmread("file.dcm")
print(ds.Modality)  # Should be CT, MR, XR, US, etc.
```

#### 4. "Permission denied" on storage directory

**Symptom:**
```
PermissionError: [Errno 13] Permission denied: '/app/dicom_storage'
```

**Solution:**
```bash
# Fix permissions
sudo chown -R appuser:appuser /app/dicom_storage
sudo chmod -R 755 /app/dicom_storage
```

**Docker solution:**
```dockerfile
# In Dockerfile
RUN mkdir -p /app/dicom_storage && \
    chown -R appuser:appuser /app/dicom_storage && \
    chmod 755 /app/dicom_storage
```

#### 5. "File size exceeds maximum"

**Symptom:**
```json
{
  "detail": "File size exceeds maximum allowed size (100MB)"
}
```

**Solution:**
Increase file size limit in `.env`:
```bash
DICOM_MAX_FILE_SIZE=209715200  # 200MB
```

**Note:** Large files may cause memory issues. Consider streaming for files >100MB.

#### 6. Image conversion fails

**Symptom:**
```
ValueError: Cannot convert pixel array to image
```

**Causes:**
- Unsupported photometric interpretation
- Compressed transfer syntax
- Multi-frame images

**Solution:**
```python
# Install additional dependencies for compression
pip install pylibjpeg pylibjpeg-libjpeg pylibjpeg-openjpeg

# Or decompress before conversion
ds = pydicom.dcmread("file.dcm")
if ds.file_meta.TransferSyntaxUID.is_compressed:
    ds.decompress()
```

---

## DICOM Standards Reference

### Common Modalities

| Code | Modality | Description |
|------|----------|-------------|
| `CT` | Computed Tomography | X-ray CT scans |
| `MR` | Magnetic Resonance | MRI scans |
| `XR` | X-Ray | Plain radiography |
| `US` | Ultrasound | Ultrasound imaging |
| `CR` | Computed Radiography | Digital X-ray |
| `DX` | Digital Radiography | Digital X-ray |
| `MG` | Mammography | Breast imaging |
| `PT` | PET | Positron Emission Tomography |
| `NM` | Nuclear Medicine | Nuclear imaging |
| `SR` | Structured Report | Text reports |
| `RT` | Radiotherapy | Treatment planning |

### Key DICOM Tags

| Tag | Name | Description |
|-----|------|-------------|
| `(0010,0010)` | PatientName | Patient's full name |
| `(0010,0020)` | PatientID | Unique patient identifier |
| `(0010,0030)` | PatientBirthDate | Birth date (YYYYMMDD) |
| `(0010,0040)` | PatientSex | M, F, O |
| `(0020,000D)` | StudyInstanceUID | Unique study identifier |
| `(0020,000E)` | SeriesInstanceUID | Unique series identifier |
| `(0008,0018)` | SOPInstanceUID | Unique image identifier |
| `(0008,0060)` | Modality | Imaging modality |
| `(0020,0011)` | SeriesNumber | Series number |
| `(0020,0013)` | InstanceNumber | Image number |
| `(0028,0010)` | Rows | Image height in pixels |
| `(0028,0011)` | Columns | Image width in pixels |

### Transfer Syntaxes

| UID | Name | Description |
|-----|------|-------------|
| `1.2.840.10008.1.2` | Implicit VR Little Endian | Uncompressed, default |
| `1.2.840.10008.1.2.1` | Explicit VR Little Endian | Uncompressed |
| `1.2.840.10008.1.2.4.50` | JPEG Baseline | Lossy compression |
| `1.2.840.10008.1.2.4.90` | JPEG 2000 | Lossy compression |
| `1.2.840.10008.1.2.4.91` | JPEG 2000 Lossless | Lossless compression |

---

## PACS Integration (Future Enhancement)

### DICOM Query/Retrieve (C-FIND, C-MOVE)

For enterprise deployment, integrate with PACS systems:

```python
# Install pynetdicom for DICOM networking
pip install pynetdicom

# Query PACS for studies
from pynetdicom import AE, QueryRetrievePresentationContexts

ae = AE()
ae.requested_contexts = QueryRetrievePresentationContexts

# Associate with PACS
assoc = ae.associate("pacs.hospital.com", 11112)

if assoc.is_established:
    # Query for studies
    from pydicom.dataset import Dataset

    ds = Dataset()
    ds.PatientID = '12345678'
    ds.StudyDate = '20251106'
    ds.QueryRetrieveLevel = 'STUDY'

    responses = assoc.send_c_find(ds, query_model='S')

    for (status, identifier) in responses:
        if identifier:
            print(identifier.StudyDescription)

    assoc.release()
```

### DICOM Storage SCP (C-STORE)

Accept DICOM files pushed from modalities:

```python
from pynetdicom import AE, StoragePresentationContexts

# Create Application Entity
ae = AE()
ae.supported_contexts = StoragePresentationContexts

# Start SCP server
ae.start_server(('', 11112), block=True)
```

---

## Performance Optimization

### Large File Handling

For files >100MB:

```python
# Stream file to disk instead of loading in memory
import shutil

@router.post("/upload-large")
async def upload_large(file: UploadFile):
    temp_path = Path(tempfile.mktemp(suffix=".dcm"))

    # Stream to disk
    with open(temp_path, "wb") as f:
        shutil.copyfileobj(file.file, f, length=1024*1024)  # 1MB chunks

    # Process file
    result = dicom_service.parse_dicom_file(temp_path)

    return result
```

### Image Caching

Cache converted PNG images:

```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_cached_image(file_path: str) -> bytes:
    result = dicom_service.extract_image_png(Path(file_path))
    return result["image_data"]
```

### Async Processing

Process large studies asynchronously:

```python
from fastapi import BackgroundTasks

@router.post("/upload-async")
async def upload_async(
    file: UploadFile,
    background_tasks: BackgroundTasks
):
    # Save file
    file_path = await save_file(file)

    # Process in background
    background_tasks.add_task(process_dicom, file_path)

    return {"status": "processing", "file_path": str(file_path)}

async def process_dicom(file_path: Path):
    # Parse metadata
    metadata = dicom_service.parse_dicom_file(file_path)

    # Generate thumbnail
    dicom_service.extract_image_png(file_path)

    # Update database
    # ...
```

---

## Testing

### Unit Tests

```python
# tests/test_dicom_service.py
import pytest
from pathlib import Path
from dicom_service import dicom_service

def test_parse_dicom_file():
    # Test with sample DICOM file
    test_file = Path("tests/fixtures/sample.dcm")
    result = dicom_service.parse_dicom_file(test_file)

    assert result["success"] == True
    assert "patient" in result
    assert result["patient"]["patient_id"] != ""

def test_invalid_dicom_file():
    # Test with non-DICOM file
    test_file = Path("tests/fixtures/invalid.txt")
    result = dicom_service.parse_dicom_file(test_file)

    assert result["success"] == False
    assert "error" in result

def test_extract_image():
    test_file = Path("tests/fixtures/sample_with_pixels.dcm")
    result = dicom_service.extract_image_png(test_file)

    assert result["success"] == True
    assert len(result["image_data"]) > 0
```

### Integration Tests

```python
# tests/test_dicom_api.py
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_upload_dicom():
    with open("tests/fixtures/sample.dcm", "rb") as f:
        response = client.post(
            "/api/dicom/upload",
            files={"file": ("sample.dcm", f, "application/dicom")},
            headers={"Authorization": f"Bearer {get_test_token()}"}
        )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert "file_path" in data

def test_get_metadata():
    # Upload file first
    file_path = upload_test_dicom()

    response = client.get(
        f"/api/dicom/metadata/{file_path}",
        headers={"Authorization": f"Bearer {get_test_token()}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "metadata" in data
```

---

## Monitoring and Logging

### Logging Configuration

```python
# dicom_service.py
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Log all DICOM operations
def parse_dicom_file(self, file_path: Path):
    logger.info(f"Parsing DICOM file: {file_path.name}")
    try:
        result = self._parse(file_path)
        logger.info(f"✓ Parsed successfully: {result['patient']['patient_id']}")
        return result
    except Exception as e:
        logger.error(f"✗ Parsing failed: {e}")
        raise
```

### Metrics Collection

```python
# Track DICOM operations
from prometheus_client import Counter, Histogram

dicom_uploads = Counter('dicom_uploads_total', 'Total DICOM uploads')
dicom_parse_duration = Histogram('dicom_parse_duration_seconds', 'DICOM parse time')

@router.post("/upload")
async def upload(file: UploadFile):
    dicom_uploads.inc()

    with dicom_parse_duration.time():
        result = dicom_service.parse_dicom_file(file_path)

    return result
```

---

## Conclusion

The DICOM Integration System provides a complete solution for handling medical imaging files within the Radiology RAG platform. With comprehensive metadata extraction, image viewing, and seamless report integration, radiologists can efficiently incorporate imaging data into their workflow.

### Key Takeaways

✅ **Production-Ready**: Secure file handling, validation, and error management
✅ **Standards-Compliant**: Full DICOM support with pydicom
✅ **Scalable**: Efficient storage with hash-based organization
✅ **Integrated**: Seamless integration with report generation
✅ **Extensible**: Ready for PACS integration and advanced features

### Next Steps

1. **Deploy**: Configure environment variables and test with sample DICOM files
2. **Frontend**: Implement DICOM upload and viewer components
3. **PACS**: Integrate with hospital PACS systems (optional)
4. **Analytics**: Add image analysis and measurement tools
5. **AI**: Integrate AI models for automatic image analysis

---

## Support and Resources

### Official Documentation

- **DICOM Standard**: https://www.dicomstandard.org/
- **pydicom Documentation**: https://pydicom.github.io/
- **DICOM Tags Browser**: https://dicom.innolitics.com/

### Sample DICOM Files

- **Medical Connections**: https://www.mccoymed.com/dicom-samples/
- **OsiriX Samples**: https://www.osirix-viewer.com/resources/dicom-image-library/

### Tools

- **DICOM Viewer (Free)**:
  - Horos (macOS): https://horosproject.org/
  - RadiAnt (Windows): https://www.radiantviewer.com/
  - 3D Slicer (All): https://www.slicer.org/

- **DICOM Server (Testing)**:
  - Orthanc: https://www.orthanc-server.com/
  - dcm4che: https://www.dcm4che.org/

---

**Version:** 1.0.0
**Last Updated:** November 6, 2025
**Author:** Radiology RAG Development Team
