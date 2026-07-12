import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    # Flask application settings
    SECRET_KEY = os.environ.get('SECRET_KEY', 'ecosphere-super-secret-key-change-in-production')
    
    # Database configurations - SQLite inside backend/database/ecosphere.db
    DATABASE_DIR = os.path.join(BASE_DIR, 'database')
    # Ensure database folder exists
    os.makedirs(DATABASE_DIR, exist_ok=True)
    db_path = os.path.join(DATABASE_DIR, "ecosphere.db").replace('\\', '/')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', f'sqlite:///{db_path}')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Extended configurations
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'ecosphere-jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_ERROR_MESSAGE_KEY = 'message'
    
    # CORS Settings
    CORS_HEADERS = 'Content-Type'
