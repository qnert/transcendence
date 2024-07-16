import os
from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Get the ASGI application
django_asgi_application = get_asgi_application()

# Define the WebSocket application
import backend.routing
import game.routing
import tournament.routing

application = ProtocolTypeRouter({
    'http': django_asgi_application,
    'websocket': AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                backend.routing.websocket_urlpatterns +
                game.routing.websocket_urlpatterns +
                tournament.routing.websocket_urlpatterns
            )
        )
    ),
})
