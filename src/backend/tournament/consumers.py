import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Tournament
from api.models import UserProfile
from api.models import User
from channels.db import database_sync_to_async
from django.template.loader import render_to_string

MSG_JOIN              = "has joined the lobby"
MSG_LEAVE             = "has left the lobby"
MSG_IS_READY          = "is ready"
MSG_IS_NOT_READY      = "is not ready"
MSG_SETTINGS_CHANGED  = "The host has changed the match settings"


class TournamentConsumer(AsyncWebsocketConsumer):

    # TODO error handling
    async def connect(self):

        # Setup Channel and accept connection
        self.lobby_name = self.scope["url_route"]["kwargs"]["lobby_name"]
        self.lobby_group_name = f"chat_{self.lobby_name}"
        await self.channel_layer.group_add(self.lobby_group_name, self.channel_name)
        await self.accept()

        # Setup necessary database variables
        self.tournament = await database_sync_to_async(Tournament.objects.get)(name=self.lobby_name)
        self.username = self.scope["url_route"]["kwargs"]["username"]
        self.tournament_user = await database_sync_to_async(self.tournament.get_participant_by)(username=self.username)
        self.user_profile = await database_sync_to_async(lambda: self.tournament_user.user_profile)()
        self.nickname = await self.build_nickname()

        # ROUTINE
            # rebuild nickname
            # update game info
            # hide/show host box

        # Notify Group about joining and sending them new data to render
        await self.send_chat_notification(MSG_JOIN)
        await self.send_updated_participants()

    async def disconnect(self, close_code):

        # Remove Participant from Database and notify Group with new data to be rendered
        await database_sync_to_async(self.tournament.remove_participant)(self.user_profile)
        await self.send_chat_notification(MSG_LEAVE)
        await self.send_updated_participants()

        await self.channel_layer.group_discard(self.lobby_group_name, self.channel_name)

        # Delete Tournament if it has no participants
        await database_sync_to_async(self.tournament.delete_if_empty)()

    async def receive(self, text_data):

        text_data_json = json.loads(text_data)

        #   status update
        if "status" in text_data_json:
            # TODO notify everyone by message
            await database_sync_to_async(self.tournament.toggle_ready_state_by)(self.user_profile)
            await self.send_updated_participants()

        #   regular message
        if "message" in text_data_json:
            await self.send_chat_message(text_data_json['message'])

        #   settings update
        if "game_settings" in text_data_json:
            game_settings = text_data_json['game_settings']
            await database_sync_to_async(self.tournament.set_game_settings)(game_settings)
            # TODO notify everyone by message
            # TODO update game info box


#   ==========================     HELPERS

    async def routine(self):
        pass


#   ==========================     HELPERS

    async def send_chat_notification(self, message):
        await self.channel_layer.group_send(
            self.lobby_group_name,
            {
                "type": "chat.message",
                "message": f"{self.nickname} {message}",
            }
        )

    async def send_chat_message(self, message):
        await self.channel_layer.group_send(
            self.lobby_group_name,
            {
                "type": "chat.message",
                "message": f"{self.nickname}: {message}",
            }
        )

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

    async def build_nickname(self):
        if await database_sync_to_async(self.tournament.is_host)(username=self.username):
            return f'👑 {self.user_profile.display_name}({self.username})'
        return f'🐸 {self.user_profile.display_name}({self.username})'

#   ==========================     EVENTS

    async def chat_message(self, event):
        message = event["message"]
        await self.send(text_data=json.dumps({
            'message': message,
        }))

    async def update_participants(self, event):
        participants_html = event['participants']
        await self.send(text_data=json.dumps({
            'participants': participants_html,
        }))
