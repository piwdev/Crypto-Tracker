"""
Test settings for crypto_backend project.
"""

from .settings import *

# Use in-memory SQLite for faster tests
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Keep migrations enabled for test reliability
# MIGRATION_MODULES can cause issues with complex tests

# Faster password hashing for tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Disable logging during tests
LOGGING_CONFIG = None

# Use local memory cache
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Disable CORS checks in tests
CORS_ALLOW_ALL_ORIGINS = True

# Test-specific settings
SECRET_KEY = 'test-secret-key-for-ci-only'
DEBUG = False
ALLOWED_HOSTS = ['testserver', 'localhost', '127.0.0.1']

# Disable external API calls in tests
USE_TZ = True