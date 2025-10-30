from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    TECHNICIAN = "technician"
    VIEWER = "viewer"

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
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to reports
    reports = relationship("Report", back_populates="template")

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=False)
    patient_name = Column(String(200), nullable=True)
    accession = Column(String(100), nullable=True, index=True)
    doctor_name = Column(String(200), nullable=True)
    hospital_name = Column(String(200), nullable=True)
    referrer = Column(String(200), nullable=True)
    indication = Column(Text, nullable=False)  # Original input text
    generated_report = Column(Text, nullable=False)
    study_datetime = Column(String(100), nullable=True)

    # AI Analysis fields
    ai_summary = Column(Text, nullable=True)  # AI-generated concise summary
    ai_conclusion = Column(Text, nullable=True)  # AI-generated conclusion based on indication
    key_findings = Column(JSON, nullable=True)  # List of key findings
    report_language = Column(String(10), nullable=True)  # Detected language (en, fr, ar, etc.)
    validation_status = Column(String(20), nullable=True)  # 'passed', 'warnings', 'errors'
    validation_errors = Column(JSON, nullable=True)  # List of errors
    validation_warnings = Column(JSON, nullable=True)  # List of warnings
    validation_details = Column(JSON, nullable=True)  # Additional validation info

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to template
    template = relationship("Template", back_populates="reports")

    # Relationship to user (creator)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User", back_populates="reports")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(200), nullable=True)

    # Professional information
    role = Column(Enum(UserRole), default=UserRole.DOCTOR, nullable=False)
    specialization = Column(String(200), nullable=True)  # e.g., "Radiology", "Neurology"
    license_number = Column(String(100), nullable=True)
    hospital_affiliation = Column(String(200), nullable=True)

    # Account status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # Relationship to reports
    reports = relationship("Report", back_populates="user")

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
