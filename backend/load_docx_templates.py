"""
Load Templates from .docx Files into Database
This script loads all .docx template files from the templates/ directory
"""
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Template
from template_loader import load_templates_from_files

def load_docx_templates():
    """Load all .docx templates from templates/ folder into database"""
    print("=" * 70)
    print("Loading Templates from .docx Files")
    print("=" * 70)

    # Load templates from .docx files
    print("\nSearching for .docx templates in /app/templates/...")
    templates_data = load_templates_from_files("/app/templates")

    if not templates_data:
        print("❌ No .docx template files found!")
        print("Make sure .docx files are in the backend/templates/ directory")
        return False

    print(f"✓ Found {len(templates_data)} template files\n")

    # Connect to database
    db = SessionLocal()

    try:
        # Get existing template IDs
        existing_templates = db.query(Template).all()
        existing_ids = {t.template_id for t in existing_templates}
        existing_titles = {t.title for t in existing_templates}

        print(f"Current database state:")
        print(f"  - Existing templates: {len(existing_templates)}")
        print(f"  - Templates to load: {len(templates_data)}\n")

        added_count = 0
        updated_count = 0
        skipped_count = 0

        for tpl_data in templates_data:
            template_id = tpl_data['template_id']
            title = tpl_data['title']

            # Check if template exists by ID or title
            existing = db.query(Template).filter(
                (Template.template_id == template_id) | (Template.title == title)
            ).first()

            if existing:
                print(f"⚠ Template exists: {title}")
                print(f"   ID: {existing.template_id}")
                skipped_count += 1

                # Optionally update it (commented out by default)
                # existing.keywords = tpl_data['keywords']
                # existing.skeleton = tpl_data['skeleton']
                # existing.category = tpl_data.get('category')
                # updated_count += 1
                # print(f"   → Updated")
            else:
                # Add new template
                print(f"➕ Adding: {title}")
                print(f"   ID: {template_id}")
                print(f"   Category: {tpl_data.get('category', 'General')}")
                print(f"   Keywords: {', '.join(tpl_data['keywords'][:3])}...")

                new_template = Template(
                    template_id=template_id,
                    title=title,
                    keywords=tpl_data['keywords'],
                    skeleton=tpl_data['skeleton'],
                    category=tpl_data.get('category'),
                    is_active=True,
                    is_system_template=True,
                    is_shared=False
                )
                db.add(new_template)
                added_count += 1
                print(f"   ✓ Added\n")

        # Commit all changes
        db.commit()

        # Final count
        final_count = db.query(Template).count()

        print("=" * 70)
        print("✅ Loading Complete!")
        print(f"  Added: {added_count} new templates")
        if updated_count > 0:
            print(f"  Updated: {updated_count} templates")
        if skipped_count > 0:
            print(f"  Skipped: {skipped_count} existing templates")
        print(f"  Total in database: {final_count} templates")
        print("=" * 70)

        # Show all templates by category
        print("\nAll Templates in Database:")
        all_templates = db.query(Template).order_by(Template.category, Template.title).all()

        current_category = None
        for tpl in all_templates:
            if tpl.category != current_category:
                current_category = tpl.category
                print(f"\n{current_category or 'General'}:")
            print(f"  • {tpl.title}")
            print(f"    ({tpl.template_id})")

        return True

    except Exception as e:
        print(f"\n❌ Error loading templates: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    try:
        success = load_docx_templates()
        if not success:
            exit(1)
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
