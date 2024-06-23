"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""


import os

from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
import backend.routing
import game.routing
import tournament.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    'http': asgi_app,
    'websocket': AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(backend.routing.websocket_urlpatterns
                      + game.routing.websocket_urlpatterns
                      + tournament.routing.websocket_urlpatterns
                      ))
    ),
})
