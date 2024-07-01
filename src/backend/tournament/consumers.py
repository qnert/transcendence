import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Tournament
from api.models import UserProfile
from api.models import User
from channels.db import database_sync_to_async
from django.template.loader import render_to_string


class TournamentConsumer(AsyncWebsocketConsumer):

    # TODO error handling
    async def connect(self):
        self.lobby_name = self.scope["url_route"]["kwargs"]["lobby_name"]
        self.lobby_group_name = f"chat_{self.lobby_name}"
        self.tournament = await database_sync_to_async(Tournament.objects.get)(name=self.lobby_name)
        self.username = self.scope["url_route"]["kwargs"]["username"]
        self.tournament_user = await database_sync_to_async(self.tournament.get_participant_by)(username=self.username)

        # database_sync_to_async expects a callable function with a return, thats why lambda keyword has to be used
        self.user_profile = await database_sync_to_async(lambda: self.tournament_user.user_profile)()
        first_participant = await database_sync_to_async(lambda: self.tournament.participants.first())()

        # TODO can be refactored with new method
        if self.tournament_user == first_participant:
            self.nickname = f'👑 {self.user_profile.display_name}({self.username})'
        else:
            self.nickname = f'🐸 {self.user_profile.display_name}({self.username})'

        await self.channel_layer.group_add(self.lobby_group_name, self.channel_name)
        await self.channel_layer.group_send(
            self.lobby_group_name,
            {
                "type": "chat.message",
                "message": f"{self.nickname} joined the channel",
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
                "message": f"{self.nickname} has left the channel",
            }
        )
        await self.send_updated_participants()
        await self.channel_layer.group_discard(self.lobby_group_name, self.channel_name)
        await database_sync_to_async(self.tournament.delete_if_empty)()

    async def receive(self, text_data):

        text_data_json = json.loads(text_data)

        # on status update
        if "status" in text_data_json:
            # TODO notify everyone by message
            await database_sync_to_async(self.tournament.toggle_ready_state_by)(self.user_profile)
            await self.send_updated_participants()

        # on regular message
        if "message" in text_data_json:
            message = f"{self.nickname}: {text_data_json['message']}"
            await self.channel_layer.group_send(
                    self.lobby_group_name,
                    {
                        'type': 'chat_message',
                        'message': message,
                    }
            )

        if "game_settings" in text_data_json:
            game_settings = text_data_json['game_settings']
            await database_sync_to_async(self.tournament.set_game_settings)(game_settings)
            # TODO notify everyone by message
            # TODO update game info box


    async def chat_message(self, event):
        message = event["message"]
        await self.send(text_data=json.dumps({
            'message': message,
        }))

    # TODO implement
    def build_message(nickname, message):
        return {
            "type": "chat.message",
            "message": f"{nickname} {message}",
        }

    async def send_updated_participants(self):
        participants = await database_sync_to_async(self.tournament.get_participants_names_and_statuses)()
        participants_html = await database_sync_to_async(render_to_string)('tournament_participants.html', {'participants': participants})
        await self.channel_layer.group_send(
            self.lobby_group_name,
            {
                'type': 'update_participants',
                'participants': participants_html,
            }
        )

    async def update_participants(self, event):
        participants_html = event['participants']
        await self.send(text_data=json.dumps({
            'participants': participants_html,
        }))
