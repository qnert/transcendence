import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Tournament
from api.models import UserProfile
from api.models import User
from channels.db import database_sync_to_async
from django.template.loader import render_to_string

MSG_JOIN = "has joined the lobby"
MSG_LEAVE = "has left the lobby"
MSG_IS_READY = "is ready"
MSG_IS_NOT_READY = "is not ready"
MSG_SETTINGS_CHANGED = "has changed the match settings"
MSG_START = "has started the tournament"

# Hint:
# Because of Python, everytime you change something in the DB, variables have to
# be reinitialised - otherwise they wont reflect the changes (no pointers)!
# ==> use await self.update_db_variables() whenever you make changes to db


class TournamentConsumer(AsyncWebsocketConsumer):

    async def connect(self):

        # parse variables from frontend scope
        # add user to channel group
        # Setup necessary database variables
        # Notify Group about joining and which will trigger rendering on all sockets
        self.lobby_name = self.scope["url_route"]["kwargs"]["lobby_name"]
        self.lobby_group_name = f"chat_{self.lobby_name}"
        self.username = self.scope["url_route"]["kwargs"]["username"]
        await self.channel_layer.group_add(self.lobby_group_name, self.channel_name)
        await self.accept()
        await self.update_db_variables()
        await self.send_chat_notification(MSG_JOIN)

    async def disconnect(self, close_code):

        # Remove Participant from Lobby in DB
        # Notify Group about leaving and sending them new data to render
        # Clean Group, Tournament if necessary
        await database_sync_to_async(self.tournament.remove_participant)(self.user_profile)
        await self.send_chat_notification(MSG_LEAVE)
        await self.channel_layer.group_discard(self.lobby_group_name, self.channel_name)
        await database_sync_to_async(self.tournament.delete_if_empty)()

    async def receive(self, text_data):

        # Handle Json messages sent from the Frontend to this socket
        text_data_json = json.loads(text_data)

        if "message" in text_data_json:
            await self.send_chat_message(text_data_json['message'])
        
        elif "advanced_state" in text_data_json:
            await database_sync_to_async(self.tournament.advance_state)()
            await self.send_chat_notification(MSG_START)
        
        elif "status_change" in text_data_json:
            await database_sync_to_async(self.tournament.toggle_ready_state_by)(self.user_profile)
            # because self.tournament_user doesnt reflect toggle change, the logic is the opposite
            if await database_sync_to_async(lambda: self.tournament_user.is_ready)():
                await self.send_chat_notification(MSG_IS_NOT_READY)
            else:
                await self.send_chat_notification(MSG_IS_READY)

        elif "game_settings_edited" in text_data_json:
            game_settings_edited = text_data_json['game_settings_edited']
            await database_sync_to_async(self.tournament.set_game_settings)(game_settings_edited)
            await self.send_chat_notification(MSG_SETTINGS_CHANGED)

#   ==========================     UPDATE ROUTINES

#   all notifications send to a socket will trigger these routines per socket
#       - reinit db variables
#       - send prerendered (SSR) dynamic content to Frontend

    async def build_nickname(self):
        if self.is_host:
            return f'👑 {self.user_profile.display_name}({self.username})'
        return f'🐸 {self.user_profile.display_name}({self.username})'

    async def update_content(self):
        # TODO might be abstracted away and send in one packet / object
        if self.state == 'setup':
            await self.send_participant_list()
            await self.send_game_settings_list()
            if self.is_host:
                await self.send_game_settings_editor()
                if self.are_participants_ready:
                    await self.send_advance_button()
                else:
                    await self.send_remove_advance_button()
        elif self.state == 'playing':
            await self.send_remove_setup_content()
            await self.send_playing_content()

    async def update_db_variables(self):
        self.tournament = await database_sync_to_async(Tournament.objects.get)(name=self.lobby_name)
        self.tournament_user = await database_sync_to_async(self.tournament.get_participant_by)(username=self.username)
        self.user_profile = await database_sync_to_async(lambda: self.tournament_user.user_profile)()
        self.is_host = await database_sync_to_async(self.tournament.is_host)(user_profile=self.user_profile)
        self.nickname = await self.build_nickname()
        self.are_participants_ready = await database_sync_to_async(self.tournament.are_participants_ready)()
        self.state = await database_sync_to_async(self.tournament.get_state)()

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
        await self.channel_layer.send(
            self.channel_name,
            {
                'type': 'event_participants',
                'participants': participants_html,
            }
        )

    async def send_game_settings_list(self):
        game_settings_list = await database_sync_to_async(self.tournament.get_game_settings)()
        game_settings_list_html = await database_sync_to_async(render_to_string)('tournament_game_settings_list.html', {'game_settings': game_settings_list})
        await self.channel_layer.send(
            self.channel_name,
            {
                'type': 'event_game_settings_list',
                'game_settings_list': game_settings_list_html,
            }
        )

    async def send_game_settings_editor(self):
        game_settings_editor_html = await database_sync_to_async(render_to_string)('tournament_game_settings_editor.html')
        await self.channel_layer.send(
            self.channel_name,
            {
                'type': 'event_game_settings_editor',
                'game_settings_editor': game_settings_editor_html,
            }
        )

    async def send_advance_button(self):
        advance_button_html = await database_sync_to_async(render_to_string)('tournament_advance_button.html')
        await self.channel_layer.send(
            self.channel_name,
            {
                'type': 'event_advance_button',
                'advance_button': advance_button_html,
            }
        )

    async def send_remove_advance_button(self):
        await self.channel_layer.send(
            self.channel_name,
            {
                'type': 'event_advance_button',
                'advance_button': " ",
            }
        )
    
    # TODO implement
    # TODO an algorithm should figure out the room_name
    async def send_playing_content(self):
        match_html = await database_sync_to_async(render_to_string)('tournament_match_lobby.html')
        game_settings = await database_sync_to_async(self.tournament.get_game_settings)()
        await self.channel_layer.send(
            self.channel_name,
            {
                'type': 'event_playing_content',
                'playing_content': {
                    'game_settings': game_settings,
                    'username': self.username,
                    'room_name': self.lobby_name,
                    'match_html': match_html,
                }
            }
        )

    async def send_remove_setup_content(self):
        await self.channel_layer.send(
            self.channel_name,
            {
                'type': 'event_playing_content',
                'playing_content': "remove",
            }
        )

#   ==========================     EVENT LISTENERS

    # Hint:
    # this function triggers updating vars and rendering for all socket users
    async def event_chat_notification(self, event):
        await self.update_db_variables()
        await self.update_content()
        notification = event["notification"]
        await self.send(text_data=json.dumps({
            'notification': notification,
        }))

    async def event_chat_message(self, event):
        message = event["message"]
        await self.send(text_data=json.dumps({
            'message': message,
        }))

    async def event_participants(self, event):
        participants_html = event['participants']
        await self.send(text_data=json.dumps({
            'participants': participants_html,
        }))

    async def event_game_settings_list(self, event):
        game_settings_list_html = event['game_settings_list']
        await self.send(text_data=json.dumps({
            'game_settings_list': game_settings_list_html,
        }))

    async def event_game_settings_editor(self, event):
        game_settings_editor_html = event['game_settings_editor']
        await self.send(text_data=json.dumps({
            'game_settings_editor': game_settings_editor_html,
        }))

    async def event_advance_button(self, event):
        advance_button_html = event['advance_button']
        await self.send(text_data=json.dumps({
            'advance_button': advance_button_html,
        }))
    
    async def event_playing_content(self, event):
        playing_content = event['playing_content']
        await self.send(text_data=json.dumps({
            'playing_content': playing_content,
        }))
