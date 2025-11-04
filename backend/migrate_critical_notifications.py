"""
Database Migration Script - Add Critical Notifications table
"""
from sqlalchemy import text
from database import engine, SessionLocal
from models import Base

def table_exists(conn, table_name):
    """Check if a table exists"""
    result = conn.execute(text("""
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_name = :table_name
        )
    """), {"table_name": table_name})
    return result.scalar()

def migrate_database():
    """Add critical_notifications table"""
    print("=" * 70)
    print("Running Critical Notifications Migration...")
    print("=" * 70)

    with engine.connect() as conn:
        trans = conn.begin()

        try:
            # Check if table already exists
            if table_exists(conn, 'critical_notifications'):
                print("\n⚠️  critical_notifications table already exists, skipping")
                trans.commit()
                return

            print("\n📋 Creating critical_notifications table...")

            # Create the table
            conn.execute(text("""
                CREATE TABLE critical_notifications (
                    id SERIAL PRIMARY KEY,
                    report_id INTEGER NOT NULL REFERENCES reports(id),
                    sent_by_user_id INTEGER NOT NULL REFERENCES users(id),
                    recipient_user_id INTEGER REFERENCES users(id),
                    recipient_email VARCHAR(200) NOT NULL,
                    recipient_phone VARCHAR(50),

                    critical_findings JSON NOT NULL,
                    priority VARCHAR(20) NOT NULL DEFAULT 'critical',

                    status VARCHAR(20) NOT NULL DEFAULT 'pending',
                    sent_at TIMESTAMP,
                    read_at TIMESTAMP,
                    acknowledged_at TIMESTAMP,
                    acknowledgment_note TEXT,

                    escalated_at TIMESTAMP,
                    escalated_to_email VARCHAR(200),
                    escalation_reason TEXT,

                    notification_method VARCHAR(50),
                    email_subject VARCHAR(500),
                    email_body TEXT,

                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            print("  ✓ Created critical_notifications table")

            # Create indexes
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_critical_notifications_report_id ON critical_notifications(report_id)"))
            print("  ✓ Created index on report_id")

            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_critical_notifications_status ON critical_notifications(status)"))
            print("  ✓ Created index on status")

            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_critical_notifications_created_at ON critical_notifications(created_at)"))
            print("  ✓ Created index on created_at")

            # Commit transaction
            trans.commit()
            print("\n" + "=" * 70)
            print("✅ Migration completed successfully!")
            print("=" * 70)

        except Exception as e:
            trans.rollback()
            print(f"\n❌ Migration failed: {e}")
            print("Rolling back changes...")
            raise

if __name__ == "__main__":
    try:
        migrate_database()
    except Exception as e:
        print(f"\n💥 Error during migration: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
