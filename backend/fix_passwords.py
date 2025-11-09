"""Fix user passwords after bcrypt migration

This script updates existing user passwords to use the new native bcrypt hashing
instead of the old passlib bcrypt hashing.
"""
import sys
from sqlalchemy.orm import Session
from database import engine, SessionLocal
from models import User
from auth import get_password_hash

def fix_passwords():
    """Update all user passwords with new bcrypt hashing"""
    print("Connecting to database...")
    db = SessionLocal()

    try:
        # Default credentials to reset
        users_to_fix = [
            ("admin@radiology.com", "admin123"),
            ("doctor@hospital.com", "doctor123")
        ]

        print("\nUpdating user passwords with new bcrypt hashing...\n")

        for email, password in users_to_fix:
            user = db.query(User).filter(User.email == email).first()
            if user:
                print(f"Updating password for: {email}")
                user.hashed_password = get_password_hash(password)
                db.commit()
                print(f"✓ Password updated successfully for {email}")
            else:
                print(f"⚠ User not found: {email}")

        # Also check for any other users and report them
        all_users = db.query(User).all()
        print(f"\n✓ Total users in database: {len(all_users)}")

        for user in all_users:
            if user.email not in [email for email, _ in users_to_fix]:
                print(f"  - {user.email} (not updated - custom user)")

        print("\n✓ Password fix complete!")
        print("\nYou can now login with:")
        print("  Admin: admin@radiology.com / admin123")
        print("  Doctor: doctor@hospital.com / doctor123")

    except Exception as e:
        print(f"\n✗ Error fixing passwords: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    fix_passwords()
