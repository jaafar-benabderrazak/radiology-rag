# main.py
import os
from typing import List, Optional, Literal
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

# Local imports
from config import settings
from database import get_db, Base, engine
from models import Template, Report, User
from cache_service import cache
from vector_service import vector_service
from document_generator import DocumentGenerator, PDFConverter
from ai_analysis_service import ai_analysis_service
import auth_routes
from auth import get_optional_user
from llm_service import llm_service

# Check if at least one LLM is configured
if not (settings.GEMINI_API_KEY or settings.OPENAI_API_KEY or settings.ANTHROPIC_API_KEY):
    print("⚠️ WARNING: No LLM API key configured! Set GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY")
    print("⚠️ The application will not be able to generate reports.")

# --- FastAPI app with CORS ---
app = FastAPI(title="Radiology RAG API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include authentication routes
app.include_router(auth_routes.router)

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

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Radiology RAG API",
        "version": "1.0.0",
        "cache_enabled": cache.enabled,
        "vector_db_enabled": vector_service.client is not None
    }

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
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Generate radiology report from clinical text"""

    meta = req.meta or Meta()
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

    # Call LLM with automatic fallback
    try:
        report_text = llm_service.generate_content(
            system_instruction=SYSTEM_INSTRUCTIONS,
            user_prompt=user_prompt
        )
    except Exception as e:
        error_msg = str(e)
        print(f"❌ All LLM providers failed: {error_msg}")
        raise HTTPException(
            status_code=503,
            detail=f"Unable to generate report. All LLM providers failed. {error_msg}"
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

    # Save report to database
    report_id = None
    try:
        report = Report(
            template_id=template.id,
            patient_name=meta.patient_name,
            accession=meta.accession,
            doctor_name=meta.doctorName,
            hospital_name=meta.hospitalName,
            referrer=meta.referrer,
            indication=req.input,
            generated_report=report_text,
            study_datetime=meta.study_datetime,
            user_id=current_user.id if current_user else None
        )
        db.add(report)
        db.commit()
        db.refresh(report)  # Get the generated ID
        report_id = report.id
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
        "report_id": report_id
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
