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
MSG_SETTINGS_CHANGED  = "has changed the match settings"

# Hint:
# Because of Python, everytime you change something in the DB, variables have to
# be reinitialised - otherwise they wont reflect the changes!
# ==> use await self.update_db_variables() whenever you make changes to db


class TournamentConsumer(AsyncWebsocketConsumer):

    async def connect(self):

        # Setup Channel and accept connection
        self.lobby_name = self.scope["url_route"]["kwargs"]["lobby_name"]
        self.lobby_group_name = f"chat_{self.lobby_name}"
        self.username = self.scope["url_route"]["kwargs"]["username"]
        await self.channel_layer.group_add(self.lobby_group_name, self.channel_name)
        await self.accept()

        # Setup necessary database variables
        await self.update_db_variables()

        # Notify Group about joining and sending them new data to render
        await self.update_content(notification=MSG_JOIN)

    async def disconnect(self, close_code):

        # Remove participant
        await database_sync_to_async(self.tournament.remove_participant)(self.user_profile)

        # Notify Group about leaving and sending them new data to render
        await self.update_content(notification=MSG_LEAVE)

        # Clean Group, Tournament if necessary
        await self.channel_layer.group_discard(self.lobby_group_name, self.channel_name)
        await database_sync_to_async(self.tournament.delete_if_empty)()

    async def receive(self, text_data):

        text_data_json = json.loads(text_data)

        #   TODO participant Event?
        #   TODO notification Event?

        #   TODO should be renamed in front/ and backend
        #   Status Event:
        #   Toggle profiles status, update variables, update content for all users
        if "status" in text_data_json:
            await database_sync_to_async(self.tournament.toggle_ready_state_by)(self.user_profile)
            await self.update_db_variables()
            if await database_sync_to_async(lambda: self.tournament_user.is_ready)():
                await self.update_content(notification=MSG_IS_READY)
            else:
                await self.update_content(notification=MSG_IS_NOT_READY)

        #   Message Event:
        #   Post message to all users
        if "message" in text_data_json:
            await self.send_chat_message(text_data_json['message'])

        #   Settings Event:
        #   Change settings in database, update variables, update content for all users
        if "game_settings" in text_data_json:
            game_settings = text_data_json['game_settings']
            await database_sync_to_async(self.tournament.set_game_settings)(game_settings)
            await self.update_db_variables()
            await self.update_content(notification=MSG_SETTINGS_CHANGED)

#   ==========================     UPDATE ROUTINES

    async def build_nickname(self):
        if await database_sync_to_async(self.tournament.is_host)(username=self.username):
            return f'👑 {self.user_profile.display_name}({self.username})'
        return f'🐸 {self.user_profile.display_name}({self.username})'

    async def update_content(self, notification=None, message=None):
        if notification:
            await self.send_chat_notification(notification)
        elif message:
            await self.send_chat_message(message)
        await self.send_participant_list()
        await self.send_game_settings()

    async def update_db_variables(self):
        self.tournament = await database_sync_to_async(Tournament.objects.get)(name=self.lobby_name)
        self.tournament_user = await database_sync_to_async(self.tournament.get_participant_by)(username=self.username)
        self.user_profile = await database_sync_to_async(lambda: self.tournament_user.user_profile)()
        self.nickname = await self.build_nickname()

#   ==========================     SEND FUNCTIONS

    async def send_chat_notification(self, notification):
        await self.channel_layer.group_send(
            self.lobby_group_name,
            {
                "type": "event_chat_notification",
                "notification": f"{self.nickname} {notification}",
            }
        )

    async def send_chat_message(self, message):
        await self.channel_layer.group_send(
            self.lobby_group_name,
            {
                "type": "event_chat_message",
                "message": f"{self.nickname}: {message}",
            }
        )

    async def send_participant_list(self):
        participants = await database_sync_to_async(self.tournament.get_participants_names_and_statuses)()
        participants_html = await database_sync_to_async(render_to_string)('tournament_participants.html', {'participants': participants})
        await self.channel_layer.group_send(
            self.lobby_group_name,
            {
                'type': 'event_participants',
                'participants': participants_html,
            }
        )

    async def send_game_settings(self):
        game_settings = await database_sync_to_async(self.tournament.get_game_settings)()
        game_settings_html = await database_sync_to_async(render_to_string)('tournament_game_settings_list.html', {'game_settings': game_settings})
        await self.channel_layer.group_send(
            self.lobby_group_name,
            {
                'type': 'event_game_settings',
                'game_settings': game_settings_html,
            }
        )

#   ==========================     EVENT LISTENERS

    async def event_chat_message(self, event):
        message = event["message"]
        await self.send(text_data=json.dumps({
            'message': message,
        }))

    async def event_chat_notification(self, event):
        message = event["notification"]
        await self.send(text_data=json.dumps({
            'message': message,
        }))

    async def event_participants(self, event):
        participants_html = event['participants']
        await self.send(text_data=json.dumps({
            'participants': participants_html,
        }))

    async def event_game_settings(self, event):
        game_settings_html = event['game_settings']
        await self.send(text_data=json.dumps({
            'game_settings': game_settings_html,
        }))
