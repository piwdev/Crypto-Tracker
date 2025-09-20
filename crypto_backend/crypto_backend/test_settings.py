"""
Test settings for crypto_backend project.
Uses SQLite for testing to avoid PostgreSQL dependency.
"""

from .settings import *

# Use SQLite for testing
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': 'test_db.sqlite3',
    }
}

# Faster password hashing for tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]