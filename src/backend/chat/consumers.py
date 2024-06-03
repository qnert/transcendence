from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from api.models import User, Friendship
from django.db import models
from .models import Message, BlockedUser
import json

class ChatConsumer(AsyncWebsocketConsumer):
  async def connect(self):
    # Make a database row with our channel name
    self.user = self.scope["user"]
    self.friend_id = int(self.scope['url_route']['kwargs']['friend_id'])

    is_blocked = await self.is_user_blocked(self.user.id, self.friend_id)
    if is_blocked:
      await self.close()
      return

    self.room_group_name = f'chat_{min(self.user.id, self.friend_id)}_{max(self.user.id, self.friend_id)}'

    await self.channel_layer.group_add(
      self.room_group_name,
      self.channel_name
    )
    await self.accept()

  async def disconnect(self, close_code):
    if hasattr(self, 'room_group_name'):
      await self.channel_layer.group_discard(
        self.room_group_name,
        self.channel_name
      )

  async def receive(self, text_data):
    text_data_json = json.loads(text_data)
    message = text_data_json['message']
    sender = self.user

    is_blocked = await self.is_user_blocked(self.user.id, self.friend_id)
    if is_blocked:
      return

    await self.save_message(sender.id, self.friend_id, message)

    await self.channel_layer.group_send(
      self.room_group_name,
      {
        'type': 'chat_message',
        'message': message,
        'sender': sender.username,
      }
    )

  async def chat_message(self, event):
    # Handles the "chat.message" event when it's sent to us.
    message = event['message']
    sender = event['sender']

    await self.send(text_data=json.dumps({
      'message': message,
      'sender': sender,
    }))

  @database_sync_to_async
  def save_message(self, sender_id, recipient_id, message):
    sender = User.objects.get(id=sender_id)
    recipient = User.objects.get(id=recipient_id)
    friendship = Friendship.objects.get(user1__in=[sender, recipient], user2__in=[sender, recipient])
    return Message.objects.create(sender=sender, recipient=recipient, content=message, friendship=friendship)

  @database_sync_to_async
  def is_user_blocked(self, user_id, friend_id):
      # Check if either user has blocked the other
      return BlockedUser.objects.filter(
          (models.Q(blocker_id=user_id) & models.Q(blocked_id=friend_id)) |
          (models.Q(blocker_id=friend_id) & models.Q(blocked_id=user_id))
      ).exists()
