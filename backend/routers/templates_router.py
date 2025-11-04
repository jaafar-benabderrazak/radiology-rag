"""
Templates Router - API endpoints for custom template management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from pydantic import BaseModel, Field
import re

from database import get_db
from models import Template, User
from auth import get_current_active_user

router = APIRouter(prefix="/api/templates", tags=["templates"])

# Pydantic schemas
class TemplateCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    keywords: List[str] = Field(..., min_items=1)
    skeleton: str = Field(..., min_length=50)
    category: Optional[str] = Field(None, max_length=100)
    is_shared: bool = Field(default=False, description="Make template available to other users")

class TemplateUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    keywords: Optional[List[str]] = Field(None, min_items=1)
    skeleton: Optional[str] = Field(None, min_length=50)
    category: Optional[str] = Field(None, max_length=100)
    is_shared: Optional[bool] = None
    is_active: Optional[bool] = None

class TemplateResponse(BaseModel):
    id: int
    template_id: str
    title: str
    keywords: List[str]
    skeleton: str
    category: Optional[str]
    is_active: bool
    is_system_template: bool
    is_shared: bool
    created_by_user_name: Optional[str]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

def generate_template_id(title: str, user_id: int) -> str:
    """Generate a unique template_id from title"""
    # Convert to lowercase, replace spaces/special chars with underscores
    template_id = title.lower()
    template_id = re.sub(r'[^a-z0-9]+', '_', template_id)
    template_id = template_id.strip('_')
    # Add user prefix for custom templates
    return f"custom_{user_id}_{template_id}"

@router.get("/", response_model=List[TemplateResponse])
async def list_all_templates(
    include_inactive: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List all templates (system + user's custom + shared custom templates)
    """
    query = db.query(Template)

    # Include system templates, user's own templates, and shared templates
    query = query.filter(
        or_(
            Template.is_system_template == True,
            Template.created_by_user_id == current_user.id,
            Template.is_shared == True
        )
    )

    if not include_inactive:
        query = query.filter(Template.is_active == True)

    templates = query.all()

    results = []
    for tpl in templates:
        results.append(TemplateResponse(
            id=tpl.id,
            template_id=tpl.template_id,
            title=tpl.title,
            keywords=tpl.keywords,
            skeleton=tpl.skeleton,
            category=tpl.category,
            is_active=tpl.is_active,
            is_system_template=tpl.is_system_template,
            is_shared=tpl.is_shared,
            created_by_user_name=tpl.created_by.full_name if tpl.created_by else None,
            created_at=tpl.created_at.isoformat(),
            updated_at=tpl.updated_at.isoformat()
        ))

    return results

@router.get("/my", response_model=List[TemplateResponse])
async def list_my_templates(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List only the current user's custom templates
    """
    templates = db.query(Template).filter(
        Template.created_by_user_id == current_user.id
    ).all()

    results = []
    for tpl in templates:
        results.append(TemplateResponse(
            id=tpl.id,
            template_id=tpl.template_id,
            title=tpl.title,
            keywords=tpl.keywords,
            skeleton=tpl.skeleton,
            category=tpl.category,
            is_active=tpl.is_active,
            is_system_template=tpl.is_system_template,
            is_shared=tpl.is_shared,
            created_by_user_name=current_user.full_name,
            created_at=tpl.created_at.isoformat(),
            updated_at=tpl.updated_at.isoformat()
        ))

    return results

@router.post("/", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_data: TemplateCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new custom template
    """
    # Generate unique template_id
    template_id = generate_template_id(template_data.title, current_user.id)

    # Check if template_id already exists
    existing = db.query(Template).filter(Template.template_id == template_id).first()
    if existing:
        # Add timestamp to make it unique
        from datetime import datetime
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        template_id = f"{template_id}_{timestamp}"

    # Create template
    new_template = Template(
        template_id=template_id,
        title=template_data.title,
        keywords=template_data.keywords,
        skeleton=template_data.skeleton,
        category=template_data.category,
        is_active=True,
        is_system_template=False,
        is_shared=template_data.is_shared,
        created_by_user_id=current_user.id
    )

    db.add(new_template)
    db.commit()
    db.refresh(new_template)

    return TemplateResponse(
        id=new_template.id,
        template_id=new_template.template_id,
        title=new_template.title,
        keywords=new_template.keywords,
        skeleton=new_template.skeleton,
        category=new_template.category,
        is_active=new_template.is_active,
        is_system_template=new_template.is_system_template,
        is_shared=new_template.is_shared,
        created_by_user_name=current_user.full_name,
        created_at=new_template.created_at.isoformat(),
        updated_at=new_template.updated_at.isoformat()
    )

@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific template by ID
    """
    template = db.query(Template).filter(Template.id == template_id).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Check access permissions
    if not template.is_system_template and not template.is_shared:
        if template.created_by_user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this template")

    return TemplateResponse(
        id=template.id,
        template_id=template.template_id,
        title=template.title,
        keywords=template.keywords,
        skeleton=template.skeleton,
        category=template.category,
        is_active=template.is_active,
        is_system_template=template.is_system_template,
        is_shared=template.is_shared,
        created_by_user_name=template.created_by.full_name if template.created_by else None,
        created_at=template.created_at.isoformat(),
        updated_at=template.updated_at.isoformat()
    )

@router.put("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: int,
    template_data: TemplateUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update a custom template (only creator can update)
    """
    template = db.query(Template).filter(Template.id == template_id).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Only template creator or admin can update
    if template.created_by_user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this template")

    # Cannot update system templates
    if template.is_system_template:
        raise HTTPException(status_code=403, detail="Cannot update system templates")

    # Update fields
    if template_data.title is not None:
        template.title = template_data.title
    if template_data.keywords is not None:
        template.keywords = template_data.keywords
    if template_data.skeleton is not None:
        template.skeleton = template_data.skeleton
    if template_data.category is not None:
        template.category = template_data.category
    if template_data.is_shared is not None:
        template.is_shared = template_data.is_shared
    if template_data.is_active is not None:
        template.is_active = template_data.is_active

    db.commit()
    db.refresh(template)

    return TemplateResponse(
        id=template.id,
        template_id=template.template_id,
        title=template.title,
        keywords=template.keywords,
        skeleton=template.skeleton,
        category=template.category,
        is_active=template.is_active,
        is_system_template=template.is_system_template,
        is_shared=template.is_shared,
        created_by_user_name=current_user.full_name,
        created_at=template.created_at.isoformat(),
        updated_at=template.updated_at.isoformat()
    )

@router.delete("/{template_id}")
async def delete_template(
    template_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a custom template (only creator can delete)
    """
    template = db.query(Template).filter(Template.id == template_id).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Only template creator or admin can delete
    if template.created_by_user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this template")

    # Cannot delete system templates
    if template.is_system_template:
        raise HTTPException(status_code=403, detail="Cannot delete system templates")

    db.delete(template)
    db.commit()

    return {"message": "Template deleted successfully"}
