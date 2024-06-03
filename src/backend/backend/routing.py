from django.urls import re_path, path
from chat import consumers as consumers_chat
from core import consumers as consumers_core

websocket_urlpatterns = [
  re_path(r'ws/chat/(?P<user_id>\d+)/(?P<friend_id>\d+)/$', consumers_chat.ChatConsumer.as_asgi()),
  path('ws/online/', consumers_core.FriendRequestConsumer.as_asgi())
]
