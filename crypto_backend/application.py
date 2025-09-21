#!/usr/bin/env python
"""
WSGI config for crypto_backend project for Elastic Beanstalk.
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crypto_backend.settings')
application = get_wsgi_application()