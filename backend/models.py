from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    RADIOLOGIST = "radiologist"

class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    keywords = Column(JSON, nullable=False)  # Store as JSON array
    skeleton = Column(Text, nullable=False)
    category = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    formatting_metadata = Column(Text, nullable=True)  # JSON string with formatting info

    # Custom template tracking
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Null for system templates
    is_system_template = Column(Boolean, default=True)  # False for user-created templates
    is_shared = Column(Boolean, default=False)  # Allow sharing custom templates

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    reports = relationship("Report", back_populates="template")
    created_by = relationship("User", foreign_keys=[created_by_user_id], back_populates="created_templates")

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Track who created it
    patient_name = Column(String(200), nullable=True, index=True)  # Added index for search
    accession = Column(String(100), nullable=True, index=True)
    doctor_name = Column(String(200), nullable=True)
    hospital_name = Column(String(200), nullable=True)
    referrer = Column(String(200), nullable=True)
    indication = Column(Text, nullable=False)  # Original input text
    generated_report = Column(Text, nullable=False)
    study_datetime = Column(String(100), nullable=True)
    modality = Column(String(50), nullable=True, index=True)  # CT, MRI, X-Ray, etc. for filtering

    # AI Analysis fields
    ai_summary = Column(Text, nullable=True)  # AI-generated concise summary
    ai_conclusion = Column(Text, nullable=True)  # AI-generated conclusion based on indication
    key_findings = Column(JSON, nullable=True)  # List of key findings
    report_language = Column(String(10), nullable=True)  # Detected language (en, fr, ar, etc.)
    validation_status = Column(String(20), nullable=True)  # 'passed', 'warnings', 'errors'
    validation_errors = Column(JSON, nullable=True)  # List of errors
    validation_warnings = Column(JSON, nullable=True)  # List of warnings
    validation_details = Column(JSON, nullable=True)  # Additional validation info

    # RAG context
    similar_cases_used = Column(JSON, nullable=True)  # Store similar cases that were used
    highlights = Column(JSON, nullable=True)  # Store highlighted phrases

    created_at = Column(DateTime, default=datetime.utcnow, index=True)  # Added index for date filtering
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    template = relationship("Template", back_populates="reports")
    user = relationship("User", back_populates="reports")

class SimilarCase(Base):
    __tablename__ = "similar_cases"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    findings = Column(Text, nullable=False)
    impression = Column(Text, nullable=False)
    category = Column(String(100), nullable=True)
    embedding_id = Column(String(100), nullable=True)  # ID in Qdrant
    created_at = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.DOCTOR, nullable=False)
    hospital_name = Column(String, nullable=True)
    specialization = Column(String, nullable=True)
    license_number = Column(String, unique=True, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    reports = relationship("Report", back_populates="user")
    created_templates = relationship("Template", foreign_keys="Template.created_by_user_id", back_populates="created_by")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
