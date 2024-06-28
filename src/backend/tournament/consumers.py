import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Tournament
from api.models import UserProfile
from api.models import User
from channels.db import database_sync_to_async


class TournamentConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.lobby_name = self.scope["url_route"]["kwargs"]["lobby_name"]
        self.lobby_group_name = f"chat_{self.lobby_name}"
        self.username = self.scope["url_route"]["kwargs"]["username"]
        self.user_profile = await database_sync_to_async(UserProfile.objects.get)(user__username=self.username)
        self.tournament = await database_sync_to_async(Tournament.objects.get)(name=self.lobby_name)
        # self.chatname = f'{self.user_profile. {self.username}'

        await self.channel_layer.group_add(self.lobby_group_name, self.channel_name)
        await self.channel_layer.group_send(
            self.lobby_group_name,
            {
                "type": "chat.message",
                "message": f"{self.username} joined the channel",
            }
        )
        await self.send_updated_participants()
        await self.accept()

    async def disconnect(self, close_code):
        await database_sync_to_async(self.tournament.remove_participant)(self.user_profile)
        await self.channel_layer.group_send(
            self.lobby_group_name,
            {
                "type": "chat.message",
                "message": f"{self.username} has left the channel",
            }
        )
        await self.send_updated_participants()
        await self.channel_layer.group_discard(self.lobby_group_name, self.channel_name)

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]
        message = f"{self.username}: {message}"

        await self.channel_layer.group_send(
            self.lobby_group_name,
            {
                'type': 'chat_message',
                'message': message,
            }
        )

    async def chat_message(self, event):
        message = event["message"]

        await self.send(text_data=json.dumps({
            'message': message,
        }))

    # TODO implement
    def build_message(username, message):
        return {
            "type": "chat.message",
            "message": f"{username} {message}",
        }

    async def send_updated_participants(self):
        participants = await database_sync_to_async(self.tournament.get_participants)()
        await self.channel_layer.group_send(
            self.lobby_group_name,
            {
                'type': 'update_participants',
                'participants': participants,
            }
        )

    async def update_participants(self, event):
        participants = event['participants']
        await self.send(text_data=json.dumps({
            'participants': participants,
        }))
