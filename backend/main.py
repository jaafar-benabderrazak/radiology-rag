# main.py
import os
from pathlib import Path
from typing import List, Optional, Literal
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

# Google Generative AI
import google.generativeai as genai

# Local imports
from config import settings
from database import get_db, Base, engine
from models import Template, Report, User, CriticalNotification, NotificationStatus, NotificationPriority
from cache_service import cache
from vector_service import vector_service
from document_generator import DocumentGenerator, PDFConverter
from ai_analysis_service import ai_analysis_service
from auth import get_current_active_user
from routers import auth_router, users_router, reports_router, templates_router, suggestions_router, notifications_router, backup_router, voice_router, dicom_router
from critical_findings_detector import critical_detector
from notification_service import notification_service

# Configure Gemini
if not settings.GEMINI_API_KEY:
    raise RuntimeError("Set GEMINI_API_KEY (or GOOGLE_API_KEY) in environment/.env")

genai.configure(api_key=settings.GEMINI_API_KEY)

# --- FastAPI app with CORS ---
app = FastAPI(title="Radiology RAG API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include authentication routers
app.include_router(auth_router.router)
app.include_router(users_router.router)

# Include new feature routers
app.include_router(reports_router.router)
app.include_router(templates_router.router)
app.include_router(suggestions_router.router)
app.include_router(notifications_router.router)
app.include_router(backup_router.router)
app.include_router(voice_router.router)
app.include_router(dicom_router.router)

# Create tables on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database and services on startup"""
    print("=" * 60)
    print("Starting Radiology RAG Backend...")
    print("=" * 60)

    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables ready")

    # Initialize services (already done in their constructors)
    print("✓ Cache service initialized")
    print("✓ Vector service initialized")
    print("✓ Authentication system ready")

    print("=" * 60)
    print("Backend ready!")
    print("=" * 60)

# ---------- Request/Response models ----------
class Meta(BaseModel):
    doctorName: Optional[str] = "Dr. John Doe"
    hospitalName: Optional[str] = "General Hospital"
    referrer: Optional[str] = "—"
    patient_name: Optional[str] = "[Name not provided]"
    study_datetime: Optional[str] = None
    accession: Optional[str] = "CR-000001"

class GenerateRequest(BaseModel):
    input: str
    templateId: Optional[str] = "auto"  # Changed to Optional[str] for flexibility
    meta: Optional[Meta] = None
    use_rag: bool = True  # Enable RAG by default for auto mode

class GenerateResponse(BaseModel):
    report: str
    templateTitle: str
    templateId: str
    highlights: List[str] = []
    similar_cases: List[dict] = []
    report_id: Optional[int] = None  # ID of the saved report
    critical_findings: Optional[dict] = None  # Critical findings detection results

class TemplateResponse(BaseModel):
    id: int
    template_id: str
    title: str
    keywords: List[str]
    category: Optional[str]

class ReportHistoryResponse(BaseModel):
    id: int
    patient_name: Optional[str]
    accession: Optional[str]
    indication: str
    template_title: str
    created_at: datetime

# ---------- Helper Functions ----------
SYSTEM_INSTRUCTIONS = (
    "You are a professional radiology reporting assistant. "
    "CRITICAL: You MUST follow the provided template structure EXACTLY. "
    "Rules:\n"
    "1. Keep ALL sections, headers, and formatting from the template\n"
    "2. Replace ALL placeholders like <fill>, <à remplir>, <concisely>, etc. with actual clinical findings\n"
    "3. Fill EVERY section - do NOT leave any <placeholders> unfilled\n"
    "4. Do NOT skip any sections from the template\n"
    "5. Do NOT add extra sections not in the template\n"
    "6. Use professional medical terminology appropriate for formal radiology reports\n"
    "7. Base your findings on the clinical indication provided\n"
    "8. Use negative findings when appropriate (e.g., 'No evidence of pulmonary embolism', 'Pas de signe de...', 'Normal')\n"
    "9. Be concise but complete in each section\n"
    "10. Do NOT include markdown formatting, code blocks, or backticks\n"
    "Output ONLY the completed report with all placeholders filled."
)

def choose_template_auto(text: str, db: Session) -> Optional[Template]:
    """Auto-select template based on keywords"""
    templates = db.query(Template).filter(Template.is_active == True).all()
    if not templates:
        return None

    low = text.lower()
    best = max(templates, key=lambda t: sum(1 for k in t.keywords if k.lower() in low))
    return best

def format_skeleton(skeleton: str, meta: Meta, indication: str) -> str:
    """Format template skeleton with metadata"""
    study_datetime = meta.study_datetime or datetime.now().strftime("%Y-%m-%d %H:%M")

    return skeleton.format(
        doctor_name=meta.doctorName,
        hospital_name=meta.hospitalName,
        referrer=meta.referrer,
        patient_name=meta.patient_name,
        study_datetime=study_datetime,
        accession=meta.accession,
        indication=indication.strip()
    )

# ---------- API Endpoints ----------
# Note: Root endpoint "/" is defined at the bottom of this file
# to serve the frontend after static files are mounted

@app.get("/templates", response_model=List[TemplateResponse])
async def list_templates(db: Session = Depends(get_db)):
    """Get all available templates"""
    templates = db.query(Template).filter(Template.is_active == True).all()
    return [
        TemplateResponse(
            id=t.id,
            template_id=t.template_id,
            title=t.title,
            keywords=t.keywords,
            category=t.category
        )
        for t in templates
    ]

@app.post("/generate", response_model=GenerateResponse)
async def generate(
    req: GenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Generate radiology report from clinical text (requires authentication)"""

    meta = req.meta or Meta()

    # Use current user's information as the reporting radiologist
    if not meta.doctorName or meta.doctorName == "Dr. John Doe":
        meta.doctorName = current_user.full_name
    if not meta.hospitalName or meta.hospitalName == "General Hospital":
        meta.hospitalName = current_user.hospital_name or "General Hospital"

    if not meta.study_datetime:
        meta.study_datetime = datetime.now().strftime("%Y-%m-%d %H:%M")

    # Check cache first
    cache_key_data = {
        "input": req.input,
        "templateId": req.templateId,
        "meta": meta.dict()
    }
    cached_result = cache.get("generate", cache_key_data)
    if cached_result:
        print("✓ Returning cached result")
        return GenerateResponse(**cached_result)

    # Pick template
    template = None
    if req.templateId and req.templateId != "auto":
        template = db.query(Template).filter(
            Template.template_id == req.templateId,
            Template.is_active == True
        ).first()
        if not template:
            raise HTTPException(status_code=404, detail=f"Template '{req.templateId}' not found")
    else:
        # Auto-select template
        template = choose_template_auto(req.input, db)
        if not template:
            raise HTTPException(status_code=404, detail="No suitable template found")

    # Search for similar cases if RAG enabled and in auto mode
    similar_cases = []
    if req.use_rag and req.templateId == "auto":
        similar_cases = vector_service.search_similar_cases(
            query=req.input,
            limit=3,
            category=template.category
        )

    # Format skeleton with metadata
    formatted_skeleton = format_skeleton(template.skeleton, meta, req.input)

    # Compose prompt for Gemini
    user_prompt = f"""
Indication text (verbatim user input):
\"\"\"{req.input.strip()}\"\"\"

Hospital: {meta.hospitalName}
Reporting Radiologist: {meta.doctorName}
Referring Physician: {meta.referrer}
Patient: {meta.patient_name}
Study Date/Time: {meta.study_datetime}
Accession/ID: {meta.accession}
"""

    # Add similar cases context if available
    if similar_cases:
        user_prompt += "\n\nSimilar Cases for Reference:\n"
        for i, case in enumerate(similar_cases, 1):
            user_prompt += f"\n{i}. {case['text'][:200]}... (similarity: {case['score']:.2f})\n"

    user_prompt += f"""

INSTRUCTIONS:
You must produce a complete radiology report following the template below EXACTLY.
- Keep the EXACT structure, sections, headers, and formatting
- Replace ALL <fill>, <à remplir>, and similar placeholders with appropriate clinical findings
- Base your findings on the indication text above
- Fill EVERY section - leave NO placeholders unfilled
- Use professional medical terminology
- Output plain text only (no markdown, no code blocks, no backticks)

TEMPLATE TO FOLLOW:

{formatted_skeleton}

Now generate the COMPLETE report with all placeholders filled:
""".strip()

    # Call Gemini - combine system instructions with user prompt
    # Gemini doesn't support "system" role in messages
    model = genai.GenerativeModel(
        model_name=settings.GEMINI_MODEL,
        system_instruction=SYSTEM_INSTRUCTIONS
    )
    resp = model.generate_content(user_prompt)

    # Extract text
    report_text = (resp.text or "").strip()

    # Detect critical findings
    critical_results = critical_detector.detect_critical_findings(
        report_text=report_text,
        indication=req.input
    )

    # Generate highlights - extract key phrases from IMPRESSION/CONCLUSION section
    highlights: List[str] = []

    # Find and highlight the conclusion/impression section
    import re
    conclusion_patterns = [
        r'(?:IMPRESSION|CONCLUSION|SYNTHÈSE|DIAGNOSTIC)[\s:]*\n(.+?)(?=\n\n|\Z)',
        r'(?:^|\n)(?:IMPRESSION|CONCLUSION|SYNTHÈSE)[\s:]*\n(.+?)(?=\n[A-Z]|\Z)'
    ]

    for pattern in conclusion_patterns:
        match = re.search(pattern, report_text, re.MULTILINE | re.DOTALL | re.IGNORECASE)
        if match:
            conclusion_text = match.group(1).strip()
            # Split into sentences and highlight key ones
            sentences = [s.strip() for s in re.split(r'[.!]\s+', conclusion_text) if s.strip()]
            for sentence in sentences[:3]:  # Highlight first 3 sentences of conclusion
                if len(sentence) > 10:
                    highlights.append(sentence)
            break

    # Highlight key medical findings (both positive and negative)
    key_phrases = [
        # Negative findings (English)
        r"No evidence of [^.!]+",
        r"No [^.!]+ identified",
        r"Unremarkable [^.!]+",
        r"Normal [^.!]+",
        r"No significant [^.!]+",
        # Positive findings (English)
        r"[^.!]+ consistent with [^.!]+",
        r"[^.!]+ suggestive of [^.!]+",
        r"Evidence of [^.!]+",
        r"Suspicious for [^.!]+",
        # Negative findings (French)
        r"Pas d[e']? [^.!]+",
        r"Absence d[e']? [^.!]+",
        r"Aucun[e]? [^.!]+",
        r"Sans [^.!]+",
        # Positive findings (French)
        r"Compatible avec [^.!]+",
        r"En faveur d[e']? [^.!]+",
        r"Présence d[e']? [^.!]+",
        r"Signes de [^.!]+"
    ]

    for phrase_pattern in key_phrases:
        matches = re.finditer(phrase_pattern, report_text, re.IGNORECASE)
        for match in matches:
            phrase = match.group(0).strip()
            if 5 < len(phrase) < 150:  # Reasonable length
                highlights.append(phrase)

    # Extract modality from template category or title
    modality = template.category if template.category else None
    if not modality:
        # Try to extract from title (e.g., "CT Head", "MRI Brain", etc.)
        title_upper = template.title.upper()
        for mod in ["CT", "MRI", "X-RAY", "ULTRASOUND", "PET"]:
            if mod in title_upper:
                modality = mod
                break

    # Save report to database
    report_id = None
    try:
        report = Report(
            template_id=template.id,
            user_id=current_user.id,  # Track who created it
            patient_name=meta.patient_name,
            accession=meta.accession,
            doctor_name=meta.doctorName,
            hospital_name=meta.hospitalName,
            referrer=meta.referrer,
            indication=req.input,
            generated_report=report_text,
            study_datetime=meta.study_datetime,
            modality=modality,  # Add modality for filtering
            similar_cases_used=similar_cases,  # Store RAG context
            highlights=list(set(highlights))  # Store highlights
        )
        db.add(report)
        db.commit()
        db.refresh(report)  # Get the generated ID
        report_id = report.id
        print(f"✓ Report saved with ID: {report_id}")

        # Handle critical findings notification
        if critical_results['requires_notification'] and meta.referrer:
            try:
                print(f"⚠️  Critical findings detected, creating notification...")

                # Create notification record
                notification = CriticalNotification(
                    report_id=report.id,
                    sent_by_user_id=current_user.id,
                    recipient_email=meta.referrer if '@' in str(meta.referrer) else f"{meta.referrer}@hospital.com",
                    critical_findings=critical_results['findings'],
                    priority=NotificationPriority.CRITICAL if critical_results['highest_severity'] == 'critical' else NotificationPriority.URGENT,
                    status=NotificationStatus.PENDING,
                    notification_method='email'
                )
                db.add(notification)
                db.commit()
                db.refresh(notification)

                # Send email notification
                # Extract relevant excerpt from report (first 500 chars of impression/conclusion)
                report_excerpt = report_text[:500] if len(report_text) <= 500 else report_text[:497] + "..."

                email_sent = notification_service.send_critical_finding_notification(
                    recipient_email=notification.recipient_email,
                    patient_name=meta.patient_name or "Unknown Patient",
                    accession=meta.accession or "N/A",
                    findings=critical_results['findings'],
                    report_excerpt=report_excerpt,
                    radiologist_name=current_user.full_name,
                    notification_id=notification.id
                )

                if email_sent:
                    notification.status = NotificationStatus.SENT
                    notification.sent_at = datetime.now()
                    db.commit()
                    print(f"✓ Critical findings notification sent successfully")
                else:
                    print(f"⚠️  Failed to send notification email")

            except Exception as e:
                print(f"Error creating/sending critical notification: {e}")
                db.rollback()

    except Exception as e:
        print(f"Error saving report: {e}")
        db.rollback()

    # Prepare response
    response_data = {
        "report": report_text,
        "templateTitle": template.title,
        "templateId": template.template_id,
        "highlights": list(set(highlights)),
        "similar_cases": similar_cases,
        "report_id": report_id,
        "critical_findings": critical_results if critical_results['has_critical'] else None
    }

    # Cache the result
    cache.set("generate", cache_key_data, response_data)

    return GenerateResponse(**response_data)

@app.get("/reports/history", response_model=List[ReportHistoryResponse])
async def get_report_history(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get report generation history"""
    reports = (
        db.query(Report)
        .join(Template)
        .order_by(Report.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        ReportHistoryResponse(
            id=r.id,
            patient_name=r.patient_name,
            accession=r.accession,
            indication=r.indication[:100] + "..." if len(r.indication) > 100 else r.indication,
            template_title=r.template.title,
            created_at=r.created_at
        )
        for r in reports
    ]

@app.get("/reports/{report_id}")
async def get_report(report_id: int, db: Session = Depends(get_db)):
    """Get a specific report by ID"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return {
        "id": report.id,
        "template_title": report.template.title,
        "patient_name": report.patient_name,
        "accession": report.accession,
        "doctor_name": report.doctor_name,
        "hospital_name": report.hospital_name,
        "indication": report.indication,
        "generated_report": report.generated_report,
        "study_datetime": report.study_datetime,
        "created_at": report.created_at
    }

@app.get("/reports/{report_id}/download/word")
async def download_report_word(
    report_id: int,
    highlight: bool = False,
    db: Session = Depends(get_db)
):
    """
    Download a report as Word document (.docx)

    Args:
        report_id: The report ID
        highlight: Whether to highlight AI-generated content (default: False)
    """
    # Get report from database
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Get template for formatting metadata
    template = report.template

    # Generate Word document
    generator = DocumentGenerator()
    try:
        docx_stream = generator.generate_word_document(
            report_text=report.generated_report,
            template_skeleton=template.skeleton,
            formatting_metadata=template.formatting_metadata,
            highlight_ai_content=highlight
        )

        # Generate filename
        patient_name = report.patient_name or "Patient"
        # Clean filename (remove special characters)
        safe_patient_name = "".join(c for c in patient_name if c.isalnum() or c in (' ', '-', '_')).strip()
        filename = f"{safe_patient_name}_{report.accession or report_id}_Report.docx"

        # Return as streaming response
        return StreamingResponse(
            docx_stream,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        print(f"Error generating Word document: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating document: {str(e)}")

@app.get("/reports/{report_id}/download/pdf")
async def download_report_pdf(
    report_id: int,
    db: Session = Depends(get_db)
):
    """
    Download a report as PDF document

    Args:
        report_id: The report ID
    """
    # Get report from database
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Get template for formatting metadata
    template = report.template

    # Generate Word document first
    generator = DocumentGenerator()
    try:
        docx_stream = generator.generate_word_document(
            report_text=report.generated_report,
            template_skeleton=template.skeleton,
            formatting_metadata=template.formatting_metadata,
            highlight_ai_content=False  # No highlighting in PDF
        )

        # Convert to PDF
        converter = PDFConverter()
        pdf_stream = converter.convert_docx_to_pdf(docx_stream)

        # Generate filename
        patient_name = report.patient_name or "Patient"
        # Clean filename (remove special characters)
        safe_patient_name = "".join(c for c in patient_name if c.isalnum() or c in (' ', '-', '_')).strip()
        filename = f"{safe_patient_name}_{report.accession or report_id}_Report.pdf"

        # Return as streaming response
        return StreamingResponse(
            pdf_stream,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        print(f"Error generating PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

@app.post("/reports/{report_id}/generate-summary")
async def generate_report_summary(
    report_id: int,
    max_length: int = 200,
    language: str = 'en',
    db: Session = Depends(get_db)
):
    """
    Generate an AI-powered concise summary/impression from a report

    Args:
        report_id: The report ID
        max_length: Maximum length of summary in words (default: 200)
        language: Language for summary (en or fr, default: en)
    """
    # Get report from database
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    try:
        # Generate summary using AI service with indication text and specified language
        result = ai_analysis_service.generate_summary(
            report.generated_report,
            indication_text=report.indication,
            max_length=max_length,
            language=language
        )

        # Update report with summary, conclusion, and language
        report.ai_summary = result['summary']
        report.ai_conclusion = result.get('conclusion', '')
        report.key_findings = result['key_findings']
        report.report_language = language
        db.commit()

        return {
            "status": "success",
            "report_id": report_id,
            "summary": result['summary'],
            "conclusion": result.get('conclusion', ''),
            "key_findings": result['key_findings'],
            "language": language
        }

    except Exception as e:
        print(f"Error generating summary: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")

@app.post("/reports/{report_id}/validate")
async def validate_report(
    report_id: int,
    language: str = 'en',
    db: Session = Depends(get_db)
):
    """
    Validate a report for inconsistencies and errors

    Checks for:
    - Contradictions between findings and impression
    - Logical inconsistencies
    - Missing critical information
    - Unfilled placeholders

    Args:
        report_id: The report ID
        language: Language for validation messages (en or fr, default: en)
    """
    # Get report from database
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    try:
        # Validate using AI service with specified language
        validation_result = ai_analysis_service.detect_inconsistencies(
            report.generated_report,
            language=language
        )

        # Determine status
        if validation_result['errors']:
            status = 'errors'
        elif validation_result['warnings']:
            status = 'warnings'
        else:
            status = 'passed'

        # Update report with validation results
        report.validation_status = status
        report.validation_errors = validation_result['errors']
        report.validation_warnings = validation_result['warnings']
        report.validation_details = validation_result['details']
        db.commit()

        return {
            "status": status,
            "report_id": report_id,
            "is_consistent": validation_result['is_consistent'],
            "severity": validation_result['severity'],
            "errors": validation_result['errors'],
            "warnings": validation_result['warnings'],
            "details": validation_result['details']
        }

    except Exception as e:
        print(f"Error validating report: {e}")
        raise HTTPException(status_code=500, detail=f"Error validating report: {str(e)}")

@app.get("/reports/{report_id}/analysis")
async def get_report_analysis(
    report_id: int,
    db: Session = Depends(get_db)
):
    """
    Get the stored AI analysis (summary and validation) for a report

    Args:
        report_id: The report ID
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return {
        "report_id": report_id,
        "summary": {
            "text": report.ai_summary,
            "conclusion": report.ai_conclusion,
            "key_findings": report.key_findings,
            "language": report.report_language
        },
        "validation": {
            "status": report.validation_status,
            "errors": report.validation_errors or [],
            "warnings": report.validation_warnings or [],
            "details": report.validation_details or []
        }
    }

@app.post("/cache/clear")
async def clear_cache():
    """Clear all cached data"""
    cache.clear()
    return {"status": "success", "message": "Cache cleared"}

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",
        "cache": "enabled" if cache.enabled else "disabled",
        "vector_db": "connected" if vector_service.client else "disconnected",
        "gemini_model": settings.GEMINI_MODEL
    }

# Serve static frontend files (for production deployment)
# Get the project root directory (parent of backend directory)
backend_dir = Path(__file__).resolve().parent
project_root = backend_dir.parent
frontend_dist = project_root / "frontend" / "dist"

if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    print(f"✓ Serving frontend from: {frontend_dist}")
    
    # Mount static assets (js, css, images, etc.) if they exist
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")
    
    # Root endpoint serves frontend
    @app.get("/")
    async def root_frontend():
        """Serve frontend for root path"""
        return FileResponse(frontend_dist / "index.html")
    
    # Catch-all route for SPA (Single Page Application) routing
    # This handles client-side routes like /dashboard, /reports, etc.
    # Note: API routes (/api/*) are already registered above and take precedence
    @app.get("/{full_path:path}")
    async def catch_all_frontend(full_path: str):
        """Serve frontend index.html for all non-API, non-static routes"""
        # Skip API routes - they're handled by specific endpoints above
        if full_path.startswith("api/") or full_path.startswith("health") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            # Let the actual API route handler process this
            # This shouldn't normally be reached since specific routes take precedence
            raise HTTPException(status_code=404, detail="Not Found")
        
        # Check if it's a file request (has extension)
        if "." in full_path.split("/")[-1]:
            # Try to serve the actual file
            file_path = frontend_dist / full_path
            if file_path.exists() and file_path.is_file():
                return FileResponse(file_path)
        
        # For all other routes, serve index.html (SPA routing)
        return FileResponse(frontend_dist / "index.html")
else:
    print("⚠ Frontend not built. Serving API only.")
    print(f"  Expected location: {frontend_dist}")
    print("  Run: cd frontend && npm run build")
    
    @app.get("/")
    async def root():
        """Root endpoint when frontend is not built"""
        return {
            "message": "Radiology RAG API",
            "status": "running",
            "version": "1.0.0",
            "docs": "/docs",
            "health": "/health",
            "note": "Frontend not built. Deploy will build it automatically."
        }
