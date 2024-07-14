from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import FriendRequest, Friendship, UserProfile
import json


class FriendRequestConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_authenticated:
            await self.channel_layer.group_add(
                f"user_{self.user.id}",
                self.channel_name
            )
            await self.set_user_online_status(True)
            await self.accept()
            await self.notify_friends_status()
        else:
            await self.close()

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            await self.channel_layer.group_discard(
                f"user_{self.user.id}",
                self.channel_name
            )
            await self.set_user_online_status(False)
            await self.notify_friends_status()

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')
        request_id = data.get('request_id')
        if action == 'accept':
            await self.accept_request(request_id)
        elif action == 'deny':
            await self.deny_request(request_id)
        elif action == 'invite':
            room_name = data.get('room_name')
            username = data.get('username')
            friend_id = data.get('friend_id')
            await self.invite(room_name, username, friend_id)

    @database_sync_to_async
    def accept_request(self, request_id):
        try:
            friend_request = FriendRequest.objects.get(
                from_user=request_id, to_user=self.user)
            if not friend_request.accepted:
                friend_request.accepted = True
                friend_request.save()

                # Create a Friendship record
                Friendship.objects.create(
                    user1=friend_request.from_user, user2=friend_request.to_user)

                from_user_profile = UserProfile.objects.get(
                    user=friend_request.from_user)
                to_user_profile = UserProfile.objects.get(
                    user=friend_request.to_user)

                channel_layer = get_channel_layer()
                # Notify the user who accepted the request
                async_to_sync(channel_layer.group_send)(
                    f"user_{self.user.id}",
                    {
                        "type": "friend_request_accepted",
                        "friend_id": friend_request.from_user.id,
                        "friend_profile_picture_url": from_user_profile.profile_picture_url,
                        "friend_name": friend_request.from_user.username
                    }
                )
                # Notify the user who sent the request
                async_to_sync(channel_layer.group_send)(
                    f"user_{friend_request.from_user.id}",
                    {
                        "type": "friend_request_accepted",
                        "friend_id": self.user.id,
                        "friend_profile_picture_url": to_user_profile.profile_picture_url,
                        "friend_name": self.user.username
                    }
                )
        except Exception as e:
            print(f"In accept_request: {e}")

    @database_sync_to_async
    def deny_request(self, request_id):
        try:
            friend_request = FriendRequest.objects.get(
                from_user=request_id, to_user=self.user)
            friend_request.delete()
        except Exception as e:
            print(f"In deny_request: {e}")


    @database_sync_to_async
    def invite(self, room_name, username, friend_id):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
                f"user_{friend_id}",
                {
                    "type": "match_invite",
                    "message": f"{username} invited you to Multiplayer Lobby {room_name}",
                    "friend_name": username,
                    "friend_id": friend_id,
                    "room_name": room_name,
                    }
                )

    async def match_invite(self, event):
        message = event['message']
        friend_name = event['friend_name']
        friend_id = event['friend_id']
        room_name = event['room_name']

        await self.send(text_data=json.dumps({
        'type': 'match_invite',
        'message': message,
        'friend_name': friend_name,
        'friend_id': friend_id,
        'room_name': room_name,
        }))

    async def friend_request_notification(self, event):
        message = event['message']
        friend_name = event['friend_name']
        friend_id = event['friend_id']

        await self.send(text_data=json.dumps({
            'type': 'friend_request_notification',
            'message': message,
            'friend_name': friend_name,
            'friend_id': friend_id
        }))

    async def friend_request_accepted(self, event):
        friend_id = event['friend_id']
        friend_profile_picture_url = event['friend_profile_picture_url']
        friend_name = event['friend_name']

        await self.send(text_data=json.dumps({
            'type': 'friend_request_accepted',
            'friend_id': friend_id,
            'friend_profile_picture_url': friend_profile_picture_url,
            'friend_name': friend_name,
        }))

    @database_sync_to_async
    def set_user_online_status(self, is_online):
        profile = UserProfile.objects.get(user=self.user)
        profile.is_online = is_online
        profile.save()

    @database_sync_to_async
    def get_friends(self):
        friendships1 = Friendship.objects.filter(
            user1=self.user).values_list('user2', flat=True)
        friendships2 = Friendship.objects.filter(
            user2=self.user).values_list('user1', flat=True)
        friend_ids = list(friendships1) + list(friendships2)
        return friend_ids

    @database_sync_to_async
    def get_user_online_status(self):
        try:
            profile = UserProfile.objects.get(user=self.user)
            return profile.is_online
        except UserProfile.DoesNotExist:
            return False

    async def notify_friends_status(self):
        friends = await self.get_friends()
        for friend_id in friends:
            group_name = f"user_{friend_id}"
            is_online = await self.get_user_online_status()
            await self.channel_layer.group_send(
                group_name,
                {
                    "type": "user_status",
                    "user_id": self.user.id,
                    "status": "online" if is_online else "offline"
                }
            )

    async def user_status(self, event):
        user_id = event['user_id']
        status = event['status']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'user_status',
            'user_id': user_id,
            'status': status
        }))
