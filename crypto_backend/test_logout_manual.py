#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append('/Users/macair/dev/coin-watcher/crypto_backend')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crypto_backend.test_settings')
django.setup()

from rest_framework.test import APIClient
from rest_framework import status

# Test logout endpoint
client = APIClient()

# Test unauthenticated logout
print("Testing unauthenticated logout...")
response = client.post('/api/auth/logout/')
print(f"Status code: {response.status_code}")
print(f"Response data: {response.data}")
print(f"Response content: {response.content}")