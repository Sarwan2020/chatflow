"""
Script to create a test user for the application.
"""
import sys
import os

# Add the parent directory to the path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.utils.security import hash_password

def create_test_user():
    """Create a test user with email test@example.com and password 'testpass123'"""
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == "test@example.com").first()
        if existing_user:
            print("Test user already exists!")
            print(f"Email: test@example.com")
            print(f"Password: testpass123")
            print(f"User ID: {existing_user.id}")
            return
        
        # Create new test user
        hashed_password = hash_password("testpass123")
        test_user = User(
            email="test@example.com",
            password_hash=hashed_password
        )
        
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        print("✅ Test user created successfully!")
        print(f"Email: test@example.com")
        print(f"Password: testpass123")
        print(f"User ID: {test_user.id}")
        print("\nYou can now log in with these credentials.")
        
    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()
