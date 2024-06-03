from django.urls import re_path, path
from . import consumers
from . import views

websocket_urlpatterns = [
  re_path(r'ws/game/(?P<room_name>\w+)/(?P<username>\w+)/$', consumers.GameRoomConsumer.as_asgi())
]

patterns = [
    path('username/', views.get_username, name='get_username'),
]
