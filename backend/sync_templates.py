"""
Sync Default Templates - Ensures all 10 default templates exist in database
"""
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Template
from template_loader import DEFAULT_TEMPLATES

def sync_templates():
    """Ensure all default templates exist in the database"""
    print("=" * 60)
    print("Syncing Default Templates...")
    print("=" * 60)

    db = SessionLocal()

    try:
        # Get all existing template IDs
        existing_templates = db.query(Template).all()
        existing_ids = {t.template_id for t in existing_templates}

        print(f"\nCurrently in database: {len(existing_templates)} templates")
        print(f"Available in DEFAULT_TEMPLATES: {len(DEFAULT_TEMPLATES)} templates")

        added_count = 0
        updated_count = 0

        for tpl_data in DEFAULT_TEMPLATES:
            template_id = tpl_data['template_id']

            # Check if template exists
            existing = db.query(Template).filter(Template.template_id == template_id).first()

            if existing:
                # Template exists - optionally update it
                print(f"\n✓ Template exists: {template_id}")
                print(f"  Title: {existing.title}")

                # You can uncomment below to update existing templates
                # existing.title = tpl_data['title']
                # existing.keywords = tpl_data['keywords']
                # existing.skeleton = tpl_data['skeleton']
                # existing.category = tpl_data.get('category')
                # updated_count += 1
                # print(f"  → Updated")
            else:
                # Template doesn't exist - add it
                print(f"\n➕ Adding new template: {template_id}")
                print(f"  Title: {tpl_data['title']}")
                print(f"  Category: {tpl_data.get('category', 'General')}")
                print(f"  Keywords: {', '.join(tpl_data['keywords'][:3])}...")

                new_template = Template(
                    template_id=template_id,
                    title=tpl_data['title'],
                    keywords=tpl_data['keywords'],
                    skeleton=tpl_data['skeleton'],
                    category=tpl_data.get('category'),
                    is_active=True,
                    is_system_template=True,
                    is_shared=False
                )
                db.add(new_template)
                added_count += 1

        # Commit all changes
        db.commit()

        # Final count
        final_count = db.query(Template).filter(Template.is_system_template == True).count()

        print("\n" + "=" * 60)
        print(f"✅ Sync Complete!")
        print(f"  Added: {added_count} new templates")
        if updated_count > 0:
            print(f"  Updated: {updated_count} templates")
        print(f"  Total system templates: {final_count}")
        print("=" * 60)

        # List all system templates
        print("\nAll System Templates:")
        all_templates = db.query(Template).filter(Template.is_system_template == True).order_by(Template.category, Template.title).all()

        current_category = None
        for tpl in all_templates:
            if tpl.category != current_category:
                current_category = tpl.category
                print(f"\n{current_category or 'General'}:")
            print(f"  • {tpl.title} ({tpl.template_id})")

    except Exception as e:
        print(f"\n❌ Error syncing templates: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    sync_templates()
