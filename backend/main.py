# main.py
import os
from typing import List, Optional, Literal
from pathlib import Path
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
from models import Template, Report, User, MedicalField
from cache_service import cache
from vector_service import vector_service
from document_generator import DocumentGenerator, PDFConverter
from ai_analysis_service import ai_analysis_service
from auth import get_current_active_user, get_current_admin_user
from routers import auth_router, users_router

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

# Store frontend path for later use (SPA routing will be added at the end)
FRONTEND_DIST_PATH = Path(__file__).parent.parent / "frontend" / "dist"
if FRONTEND_DIST_PATH.exists() and FRONTEND_DIST_PATH.is_dir():
    print(f"✓ Serving frontend from: {FRONTEND_DIST_PATH}")
    # Mount static assets (JS, CSS, images)
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST_PATH / "assets")), name="assets")
else:
    print(f"⚠ Frontend dist directory not found at: {FRONTEND_DIST_PATH}")
    print("  Run 'cd frontend && npm run build' to build the frontend")

# Create tables on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database and services on startup"""
    import logging
    logger = logging.getLogger(__name__)
    
    print("=" * 60)
    print("Starting Radiology RAG Backend...")
    print("=" * 60)

    # Create tables if they don't exist with retry logic
    max_retries = 3
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            Base.metadata.create_all(bind=engine)
            print("✓ Database tables ready")
            break
        except Exception as e:
            if attempt < max_retries - 1:
                logger.warning(f"Database connection attempt {attempt + 1} failed: {e}. Retrying in {retry_delay}s...")
                import time
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
            else:
                logger.error(f"Failed to connect to database after {max_retries} attempts: {e}")
                print(f"⚠ Database connection failed. Running in limited mode.")
                print(f"⚠ Please check your DATABASE_URL configuration.")
                return

    # Run database migrations
    try:
        from migrate_db import migrate_add_language_column
        from migrate_reports import migrate_add_user_id_to_reports
        migrate_add_language_column()
        migrate_add_user_id_to_reports()
    except Exception as e:
        logger.warning(f"Migration warning: {e}")
        print(f"⚠ Migration note: {e}")

    # Load templates from .docx files if database is empty
    try:
        from template_loader import load_templates_from_files, DEFAULT_TEMPLATES

        db = next(get_db())
        template_count = db.query(Template).count()

        if template_count == 0:
            print("\nLoading templates from files...")

            # Try to load from .docx files
            templates_data = load_templates_from_files()

            # If no .docx files found, use default templates
            if not templates_data:
                print("⚠ No template files found, using default templates")
                templates_data = DEFAULT_TEMPLATES

            # Insert templates into database
            for tpl_data in templates_data:
                template = Template(**tpl_data)
                db.add(template)

            db.commit()
            print(f"✓ Loaded {len(templates_data)} templates successfully")

            # Print loaded templates
            for tpl in templates_data:
                print(f"  - {tpl['title']} ({tpl['category']})")
        else:
            print(f"✓ Found {template_count} existing templates in database")

        db.close()
    except Exception as e:
        logger.error(f"Error loading templates: {e}")
        print(f"⚠ Failed to load templates: {e}")
        import traceback
        traceback.print_exc()

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

class TemplateResponse(BaseModel):
    id: int
    template_id: str
    title: str
    keywords: List[str]
    category: Optional[str]
    medical_field: str

class TemplateDetailResponse(BaseModel):
    id: int
    template_id: str
    title: str
    keywords: List[str]
    skeleton: str
    category: Optional[str]
    medical_field: str
    language: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

class TemplateCreateRequest(BaseModel):
    template_id: str
    title: str
    keywords: List[str]
    skeleton: str
    category: Optional[str] = None
    medical_field: str = "radiology"
    language: Optional[str] = 'fr'
    is_active: bool = True

class TemplateUpdateRequest(BaseModel):
    title: Optional[str] = None
    keywords: Optional[List[str]] = None
    skeleton: Optional[str] = None
    category: Optional[str] = None
    medical_field: Optional[str] = None
    language: Optional[str] = None
    is_active: Optional[bool] = None

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
# Note: Root path "/" is handled by SPA catch-all at end of file
# Use /health for API health checks

@app.get("/medical-fields")
async def list_medical_fields():
    """Get all available medical fields"""
    return {
        "fields": [
            {"value": field.value, "label": field.value.replace("_", " ").title()}
            for field in MedicalField
        ]
    }

@app.get("/templates", response_model=List[TemplateResponse])
async def list_templates(
    medical_field: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all available templates, optionally filtered by medical field"""
    query = db.query(Template).filter(Template.is_active == True)

    if medical_field:
        query = query.filter(Template.medical_field == medical_field)

    templates = query.all()
    return [
        TemplateResponse(
            id=t.id,
            template_id=t.template_id,
            title=t.title,
            keywords=t.keywords,
            category=t.category,
            medical_field=t.medical_field.value
        )
        for t in templates
    ]

@app.get("/admin/templates", response_model=List[TemplateDetailResponse])
async def list_all_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get all templates including inactive ones (admin only)"""
    templates = db.query(Template).order_by(Template.created_at.desc()).all()
    return templates

@app.get("/templates/{template_id}", response_model=TemplateDetailResponse)
async def get_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get template details by ID (admin only)"""
    template = db.query(Template).filter(Template.template_id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@app.post("/admin/templates", response_model=TemplateDetailResponse, status_code=201)
async def create_template(
    template_data: TemplateCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Create a new template (admin only)"""
    # Check if template_id already exists
    existing = db.query(Template).filter(Template.template_id == template_data.template_id).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Template with ID '{template_data.template_id}' already exists"
        )

    # Create new template
    new_template = Template(
        template_id=template_data.template_id,
        title=template_data.title,
        keywords=template_data.keywords,
        skeleton=template_data.skeleton,
        category=template_data.category,
        medical_field=MedicalField(template_data.medical_field),
        language=template_data.language,
        is_active=template_data.is_active,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )

    db.add(new_template)
    db.commit()
    db.refresh(new_template)

    return new_template

@app.put("/admin/templates/{template_id}", response_model=TemplateDetailResponse)
async def update_template(
    template_id: str,
    template_data: TemplateUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update an existing template (admin only)"""
    template = db.query(Template).filter(Template.template_id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Update fields if provided
    if template_data.title is not None:
        template.title = template_data.title
    if template_data.keywords is not None:
        template.keywords = template_data.keywords
    if template_data.skeleton is not None:
        template.skeleton = template_data.skeleton
    if template_data.category is not None:
        template.category = template_data.category
    if template_data.medical_field is not None:
        template.medical_field = MedicalField(template_data.medical_field)
    if template_data.language is not None:
        template.language = template_data.language
    if template_data.is_active is not None:
        template.is_active = template_data.is_active

    template.updated_at = datetime.now()

    db.commit()
    db.refresh(template)

    return template

@app.delete("/admin/templates/{template_id}", status_code=204)
async def delete_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Soft delete a template by marking it as inactive (admin only)"""
    template = db.query(Template).filter(Template.template_id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    template.is_active = False
    template.updated_at = datetime.now()

    db.commit()

    return None

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

    # Determine language instruction based on template language
    template_lang = getattr(template, 'language', 'fr')  # Default to French if not set
    language_instructions = {
        'fr': "IMPORTANT: Generate the ENTIRE report in FRENCH. All medical terminology and text must be in French.",
        'en': "IMPORTANT: Generate the ENTIRE report in ENGLISH. All medical terminology and text must be in English.",
        'ar': "IMPORTANT: Generate the ENTIRE report in ARABIC. All medical terminology and text must be in Arabic (right-to-left)."
    }
    lang_instruction = language_instructions.get(template_lang, language_instructions['fr'])

    user_prompt += f"""

{lang_instruction}

INSTRUCTIONS:
You must produce a complete radiology report following the template below EXACTLY.
- Keep the EXACT structure, sections, headers, and formatting
- Replace ALL <fill>, <à remplir>, and similar placeholders with appropriate clinical findings
- Base your findings on the indication text above
- Fill EVERY section - leave NO placeholders unfilled
- Use professional medical terminology in {template_lang.upper()}
- Output plain text only (no markdown, no code blocks, no backticks)
- The report MUST be in the SAME LANGUAGE as the template ({template_lang.upper()})

TEMPLATE TO FOLLOW:

{formatted_skeleton}

Now generate the COMPLETE report with all placeholders filled IN {template_lang.upper()}:
""".strip()

    # Call Gemini - combine system instructions with user prompt
    # Gemini doesn't support "system" role in messages
    try:
        model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            system_instruction=SYSTEM_INSTRUCTIONS
        )
        resp = model.generate_content(user_prompt)

        # Extract text
        report_text = (resp.text or "").strip()

        if not report_text:
            raise HTTPException(
                status_code=500,
                detail="Gemini API returned empty response. Please try again."
            )
    except HTTPException:
        # Re-raise HTTPException without modification
        raise
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Gemini API error: {error_msg}")

        # Provide user-friendly error messages based on error type
        if "API_KEY" in error_msg.upper() or "PERMISSION_DENIED" in error_msg:
            raise HTTPException(
                status_code=500,
                detail="Invalid or missing Gemini API key. Please check your GEMINI_API_KEY in Replit Secrets."
            )
        elif "QUOTA" in error_msg.upper() or "RESOURCE_EXHAUSTED" in error_msg:
            raise HTTPException(
                status_code=429,
                detail="Gemini API quota exceeded. Please try again later or upgrade your API plan."
            )
        elif "RATE_LIMIT" in error_msg.upper():
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please wait a moment and try again."
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate report: {error_msg}"
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
            user_id=current_user.id,  # Track which user generated this report
            patient_name=meta.patient_name,
            accession=meta.accession,
            doctor_name=meta.doctorName,
            hospital_name=meta.hospitalName,
            referrer=meta.referrer,
            indication=req.input,
            generated_report=report_text,
            study_datetime=meta.study_datetime,
            report_language=template_lang  # Save the report language from template
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
    limit: int = 50,
    skip: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get report generation history for current user"""
    reports = (
        db.query(Report)
        .join(Template)
        .filter(Report.user_id == current_user.id)  # Filter by current user
        .order_by(Report.created_at.desc())
        .offset(skip)
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
async def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific report by ID (must be owned by current user)"""
    report = db.query(Report).filter(
        Report.id == report_id,
        Report.user_id == current_user.id  # Ensure user owns this report
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found or access denied")

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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Download a report as Word document (.docx)

    Args:
        report_id: The report ID
        highlight: Whether to highlight AI-generated content (default: False)
    """
    # Get report from database (ensure user owns it)
    report = db.query(Report).filter(
        Report.id == report_id,
        Report.user_id == current_user.id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found or access denied")

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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Download a report as PDF document

    Args:
        report_id: The report ID
    """
    # Get report from database (ensure user owns it)
    report = db.query(Report).filter(
        Report.id == report_id,
        Report.user_id == current_user.id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found or access denied")

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

# ============================================================
# SPA Frontend Routing - MUST BE LAST!
# Catch-all route to serve frontend for all unmatched paths
# ============================================================
if FRONTEND_DIST_PATH.exists() and FRONTEND_DIST_PATH.is_dir():
    index_path = FRONTEND_DIST_PATH / "index.html"

    @app.get("/")
    async def serve_root():
        """Serve frontend SPA for root path"""
        if index_path.exists():
            return FileResponse(index_path)
        raise HTTPException(status_code=404, detail="Frontend not found")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """
        Serve frontend SPA for all unmatched routes.
        This must be defined LAST so API routes are matched first.
        """
        # Serve index.html for SPA routing
        if index_path.exists():
            return FileResponse(index_path)
        raise HTTPException(status_code=404, detail="Frontend not found")
