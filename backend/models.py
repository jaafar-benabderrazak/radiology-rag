from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

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
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship to template
    template = relationship("Template", back_populates="reports")

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
