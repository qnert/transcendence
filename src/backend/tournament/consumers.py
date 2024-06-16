import json
from channels.generic.websocket import AsyncWebsocketConsumer


class TournamentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.lobby_name = self.scope["url_route"]["kwargs"]["lobby_name"]
        self.lobby_group_name = f"chat_{self.lobby_name}"
        self.username = self.scope['user'].username

        await self.channel_layer.group_add(self.lobby_group_name, self.channel_name)

        message = f"{self.username} joined the channel."
        await self.channel_layer.group_send(
            self.lobby_group_name,
            {
                "type": "chat.message",
                "message": message,
            }
        )

        await self.accept()

    async def disconnect(self, close_code):
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
