# Radiology RAG System

## Overview

The Radiology RAG (Retrieval-Augmented Generation) System is an AI-powered medical imaging report generation platform designed for radiologists and medical professionals. It combines traditional template-based reporting with advanced AI technologies including semantic search, automated template selection, and intelligent report generation using Google's Gemini AI.

The system provides comprehensive features for radiology workflow automation including user authentication, template management, report history tracking, voice dictation, DICOM image handling, critical findings detection with automated notifications, and multi-format document export (Word/PDF). It supports multiple imaging modalities (CT, MRI, X-Ray, Ultrasound) and languages (English, French, Arabic).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling and development server
- Context-based state management for authentication and theming
- Modern CSS with gradient designs and responsive layouts

**Backend:**
- FastAPI (Python) for REST API
- SQLAlchemy ORM with PostgreSQL for relational data
- Pydantic for request/response validation and settings management
- OAuth2 with JWT tokens for authentication (bcrypt password hashing)

**AI & Machine Learning:**
- Google Gemini AI (gemini-1.5-pro) for report generation and analysis
- SentenceTransformers (all-MiniLM-L6-v2, 384 dimensions) for semantic embeddings
- OpenAI Whisper for voice-to-text transcription (local or API-based)

**Data Storage:**
- PostgreSQL: Primary relational database for users, templates, reports, notifications
- Qdrant: Vector database for semantic similarity search (RAG functionality)
- Redis: Caching layer for performance optimization
- File system: DICOM images and document storage

### Authentication & Authorization

- JWT-based authentication with configurable token expiration (default 30 minutes)
- Role-based access control with three roles: Admin, Doctor, Radiologist
- Password hashing using bcrypt via passlib
- OAuth2PasswordBearer for token validation
- Protected API endpoints with optional authentication support
- User management includes doctor-specific fields (hospital_name, specialization, license_number)

### RAG (Retrieval-Augmented Generation)

The RAG system enhances report generation by retrieving semantically similar historical cases:

1. User provides clinical indication
2. Text is embedded using SentenceTransformer model
3. Qdrant performs cosine similarity search for top-3 similar cases
4. Similar cases are injected into Gemini AI prompt as context
5. AI generates report enriched with relevant historical patterns

Configuration includes category-based filtering, embedding dimension of 384, and automatic collection creation with proper vector parameters.

### Template System

Dual-source template architecture:

1. **System Templates**: 10 hardcoded default templates in Python code
2. **File-based Templates**: Word (.docx) documents loaded from `/app/templates/` directory
3. **Custom Templates**: User-created templates stored in database with sharing capabilities

Templates support:
- Keyword-based auto-selection
- Structured skeletons with placeholders (patient_name, accession, indication, etc.)
- Category organization (CT, MRI, X-Ray, Ultrasound)
- Formatting metadata for document generation
- Multi-language support

Auto-template selection uses keyword matching against clinical indication text.

### Document Generation & Export

- **Word Documents**: Generated using python-docx with formatting preservation
- **PDF Export**: Conversion from Word documents using pypdf2
- **Highlighting**: Optional AI-generated content highlighting in blue/yellow
- **Formatting Metadata**: JSON-based formatting instructions stored with templates
- **Download Endpoints**: Separate routes for Word, highlighted Word, and PDF formats

### Voice Dictation

Speech-to-text transcription supporting:
- Local Whisper models (tiny, base, small, medium, large) for privacy
- OpenAI Whisper API for cloud-based transcription
- Medical specialty-specific prompts for improved accuracy
- Multi-language support with auto-detection
- Supported formats: WebM, MP3, MP4, WAV, M4A, MPEG, MPGA

### Critical Findings Detection & Notifications

Automated patient safety system:

1. **Detection**: AI scans generated reports for 60+ critical keywords across categories (vascular emergencies, neurological, cardiac, respiratory, etc.)
2. **Severity Levels**: CRITICAL (life-threatening), URGENT (serious), HIGH (important)
3. **Notifications**: Automated email alerts to referring physicians with HTML formatting
4. **Audit Trail**: Complete notification log with statuses (pending, sent, read, acknowledged, escalated)
5. **SMTP Configuration**: Supports Gmail and other SMTP servers with TLS encryption

### DICOM Integration

Medical imaging file handling:

- **Parsing**: Extract comprehensive metadata from DICOM files using pydicom
- **Storage**: Hash-based file naming with organized directory structure
- **Metadata Extraction**: Patient demographics, study information, series data, equipment details
- **Image Conversion**: Convert DICOM pixel data to PNG for viewing
- **Clinical Summaries**: Auto-generate formatted summaries for report integration

### Report Analysis & Validation

AI-powered quality assurance:

- **Summary Generation**: Automatic extraction of key findings and conclusions
- **Inconsistency Detection**: Scans for contradictions, anatomical errors, measurement inconsistencies
- **Language Detection**: Auto-detects French, English, or Arabic based on keywords
- **Validation Status**: Reports marked as validated/flagged for review

### Backup & Disaster Recovery

Automated backup system:

- **Full Backups**: Database dumps (PostgreSQL), configuration files, uploaded documents
- **Compression**: tar.gz archives to minimize storage
- **Retention**: Configurable retention period (default 30 days, max 50 backups)
- **Remote Storage**: Optional remote backup to NFS or S3-mounted volumes
- **Restore Capabilities**: Full or selective restore (database/config/files)
- **Scheduling**: Cron-compatible script for automated daily backups
- **Metadata Tracking**: JSON registry of all backups with timestamps and sizes

### API Architecture

Router-based organization:

- `auth_router`: User registration, login, token management, password changes
- `users_router`: User CRUD operations with role-based permissions
- `reports_router`: Report history, search, filtering, deletion
- `templates_router`: Custom template creation, sharing, management
- `suggestions_router`: AI-powered differential diagnosis, follow-up recommendations, ICD-10 coding
- `notifications_router`: Critical findings notification management
- `backup_router`: Backup creation, listing, restore operations
- `voice_router`: Voice transcription endpoint
- `dicom_router`: DICOM upload, metadata extraction, image viewing

All routers support dependency injection for database sessions and authentication.

### Caching Strategy

Redis-based caching with:
- MD5 hash-based cache keys generated from request data
- Configurable TTL (default 3600 seconds / 1 hour)
- JSON serialization for complex data structures
- Graceful degradation when Redis unavailable
- Cache prefix system for namespace separation

### Database Schema

Key models:

- **User**: Authentication with role-based permissions, doctor profile fields
- **Template**: System and user-created templates with keyword arrays, formatting metadata
- **Report**: Generated reports with patient metadata, AI analysis results, validation status
- **CriticalNotification**: Alert tracking with priority levels, recipient information, status workflow
- **SimilarCase**: Placeholder for RAG case storage (primarily uses Qdrant)

Relationships: Users create templates and reports; reports reference templates; notifications link to reports.

## External Dependencies

### Third-Party APIs

- **Google Gemini AI** (`GEMINI_API_KEY`): Primary AI engine for report generation, analysis, and suggestions
- **OpenAI Whisper API** (optional, `OPENAI_API_KEY`): Cloud-based voice transcription

### Databases

- **PostgreSQL**: Primary relational database (version flexible, tested with 13+)
  - Connection pooling: 10 base connections, 20 max overflow
  - Schema managed via SQLAlchemy declarative models
  - Migrations handled through manual SQL scripts

- **Qdrant Vector Database**: Semantic search engine
  - Host/port configurable via environment variables
  - Collection: "radiology_reports" with 384-dimensional vectors
  - Distance metric: Cosine similarity
  - Auto-creates collection on first run

- **Redis**: Optional caching layer
  - Can be disabled via `CACHE_ENABLED=false`
  - Default TTL: 1 hour
  - Graceful degradation if unavailable

### Python Libraries

**Core Framework:**
- fastapi (0.104.1), uvicorn with standard extras (0.24.0)
- sqlalchemy (2.0.23), psycopg2-binary (2.9.9)
- pydantic (2.5.0), pydantic-settings (2.1.0)

**AI & ML:**
- google-generativeai (configured via genai.configure)
- sentence-transformers (2.2.2), torch (>=2.0.0), transformers (4.35.0)
- qdrant-client (1.7.0)
- openai-whisper (optional for local transcription)

**Authentication:**
- python-jose with cryptography (3.3.0) for JWT
- passlib with bcrypt (1.7.4) for password hashing

**Document Processing:**
- python-docx (1.1.0), pypdf2 (3.0.1), mammoth (1.6.0)
- pydicom (optional for DICOM handling)

**Infrastructure:**
- redis (5.0.1), aiofiles (23.2.1)
- python-multipart (0.0.6) for file uploads
- email-validator (2.1.0)

### Email Service

- SMTP server (configurable: Gmail, custom server)
- TLS encryption required
- Environment variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
- From address customization: `FROM_EMAIL`, `FROM_NAME`

### Development Tools

- Docker & Docker Compose for containerization
- Vite development server (port 3000)
- FastAPI auto-generated OpenAPI documentation at `/docs`

### Environment Configuration

All services configured via environment variables or `.env` files:
- Database credentials and connection strings
- API keys for external services
- Feature flags (caching, notifications, voice dictation, DICOM)
- Security settings (JWT secret, token expiration)
- SMTP configuration for email notifications
- Backup settings (retention, paths, remote storage)