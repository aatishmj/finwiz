"""
ASGI config for god project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os

try:
    from django.core.asgi import get_asgi_application
except ModuleNotFoundError:
    import sys
    print("Django is not installed or not found in your environment.", file=sys.stderr)
    raise

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'god.settings')

application = get_asgi_application()
