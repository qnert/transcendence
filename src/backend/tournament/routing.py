from django.urls import re_path
from . import consumers


websocket_urlpatterns = [
    re_path(r"ws/tournament/lobby/(?P<lobby_name>\w+)/(?P<username>\w+)/$", consumers.TournamentConsumer.as_asgi()),
]
