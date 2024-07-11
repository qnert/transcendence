from django.urls import re_path, path
from chat import consumers as consumers_chat
from api import consumers as consumers_api

websocket_urlpatterns = [
  re_path(r'ws/chat/(?P<user_id>\d+)/(?P<friend_id>\d+)/$', consumers_chat.ChatConsumer.as_asgi()),
  path('ws/online/', consumers_api.FriendRequestConsumer.as_asgi())
]
# TODO this path triggers errors!!
