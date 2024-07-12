import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Tournament
from channels.db import database_sync_to_async
from django.template.loader import render_to_string
from django.db import transaction
from asgiref.sync import sync_to_async

MSG_JOIN_LOBBY = "has joined the lobby"
MSG_LEAVE_LOBBY = "has left the lobby"
MSG_IS_READY = "is ready"
MSG_IS_NOT_READY = "is not ready"
MSG_SETTINGS_CHANGED = "has changed the match settings"
MSG_START = "has started the tournament"
MSG_MATCH_JOIN = "has joined his next game"
MSG_NEXT_MATCH = "[ Your next match is ready! ]"
MSG_BACK_IN_LOBBY = " has returned to the lobby"
MSG_ENDED = "[ The Tournament is finished! ]"

# Hint:
# Because of Python, everytime you change something in the DB, variables have to
# be reinitialised - otherwise they wont reflect the changes (no pointers)!
# ==> use await self.update_db_variables() whenever you make changes to db


class TournamentConsumer(AsyncWebsocketConsumer):

    async def connect(self):

        # Hint:
        # parse variables from frontend scope
        # add user to channel group
        # Setup necessary database variables
        # Notify Group about joining and which will trigger rendering on all sockets
        self.lobby_name = self.scope["url_route"]["kwargs"]["lobby_name"]
        self.lobby_group_name = f"lobby_{self.lobby_name}"
        self.username = self.scope["url_route"]["kwargs"]["username"]

        await self.channel_layer.group_add(self.lobby_group_name, self.channel_name)
        await self.accept()
        await self.update_db_variables()
        await self.send_chat_notification(MSG_JOIN_LOBBY)

    async def disconnect(self, close_code):

        # Hint:
        # Remove Participant from Lobby in DB
        # Notify Group about leaving and sending them new data to render
        # Clean Group, Tournament if necessary
        await self.update_db_variables()
        await self.send_chat_notification(MSG_LEAVE_LOBBY)
        await self.channel_layer.group_discard(self.lobby_group_name, self.channel_name)
        if self.tournament.state != 'finished':
            await database_sync_to_async(self.tournament.remove_participant)(self.user_profile)
            await database_sync_to_async(self.tournament.delete_if_empty)()

    async def receive(self, text_data):

        # Hint:
        # Handle Json messages sent from the Frontend to this socket
        text_data_json = json.loads(text_data)

        if "message" in text_data_json:
            await self.send_chat_message(text_data_json['message'])

        elif "waiting_for_opponent" in text_data_json:
            await self.send_chat_notification(MSG_MATCH_JOIN, should_update=False)

        elif "finished_match" in text_data_json:
            await self.update_db_variables()
            if await self.process_match():
                await self.update_db_variables()
                match = await database_sync_to_async(self.tournament.get_last_match)(self.tournament_user)
                results = await database_sync_to_async(match.get_results)()
                await self.channel_layer.group_send(
                    self.lobby_group_name,
                    {
                        "type": "event_chat_notification",
                        "notification": f"{results['winner']} has won the match against {results['loser']} {results['winner_score']}:{results['loser_score']}",
                        "should_update": False,
                    }
                )
                if await database_sync_to_async(self.tournament.are_matches_finished)():
                    await database_sync_to_async(self.tournament.advance_state)()
                    await self.channel_layer.group_send(
                        self.lobby_group_name,
                        {
                            "type": "event_chat_notification",
                            "notification": MSG_ENDED,
                            "should_update": True,
                        }
                    )
            else:
                self.next_match = await database_sync_to_async(self.tournament.get_last_match)(self.tournament_user)
            await database_sync_to_async(self.tournament_user.update_stats)(match=self.next_match)

        elif "updated_match_list" in text_data_json:
            await self.update_db_variables()
            if not await database_sync_to_async(self.tournament.get_next_match)(self.tournament_user) is None:
                await self.send(text_data=json.dumps({'notification': MSG_NEXT_MATCH, }))

        elif "back_to_lobby" in text_data_json:
            await self.send_chat_notification(MSG_BACK_IN_LOBBY, should_update=False)
            await self.update_db_variables()
            await self.update_content()

        elif "advanced_state" in text_data_json:
            await database_sync_to_async(self.tournament.advance_state)()
            await self.update_db_variables()
            # Hint:
            # This is state 'playing'
            if not await database_sync_to_async(self.tournament.has_matches_list)():
                await database_sync_to_async(self.tournament.create_matches_list)()
                await self.send_remove_setup_content()
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

    @sync_to_async
    def process_match(self):
        with transaction.atomic():
            match_id = self.next_match.id
            next_match = self.tournament.get_next_match(self.tournament_user)
            if next_match is not None and next_match.id == match_id:
                locked_match = self.next_match.__class__.objects.select_for_update().get(id=match_id)
                if locked_match == next_match:
                    game_result = self.user_profile.game_results.latest('date_played')
                    self.next_match.set_results_and_finished(game_result=game_result)
                    return True
        return False

    # Hint:
    # If naming formatting would be changed...
    # also change in tournament model get_participants_names() method
    async def build_nickname(self):
        if self.is_host:
            return f'👑 {self.user_profile.display_name}({self.username})'
        return f'🐸 {self.user_profile.display_name}({self.username})'

    async def update_content(self):
        if self.state == 'setup':
            await self.send_setup_content()
        elif self.state == 'playing':
            await self.send_playing_content()
        elif self.state == 'finished':
            await self.send_finished_content()

    async def update_db_variables(self):
        self.tournament = await database_sync_to_async(Tournament.objects.get)(name=self.lobby_name)
        self.tournament_user = await database_sync_to_async(self.tournament.get_participant_by)(username=self.username)
        self.user_profile = await database_sync_to_async(lambda: self.tournament_user.user_profile)()
        self.is_host = await database_sync_to_async(self.tournament.is_host)(user_profile=self.user_profile)
        self.nickname = await self.build_nickname()
        self.are_participants_ready = await database_sync_to_async(self.tournament.are_participants_ready)()
        self.state = await database_sync_to_async(self.tournament.get_state)()

#   ==========================     SEND FUNCTIONS AND EVENT HANDLERS

#   --------------  NOTIFICATIONS ---------------------

    async def send_chat_notification(self, notification, should_update: bool = True):
        await self.channel_layer.group_send(
            self.lobby_group_name,
            {
                "type": "event_chat_notification",
                "notification": f"{self.nickname} {notification}",
                "should_update": should_update,
            }
        )

    # Hint:
    # this function triggers updating vars and rendering for all socket users
    async def event_chat_notification(self, event):

        notification = event["notification"]
        if MSG_ENDED in notification:
            await self.send(text_data=json.dumps({
                'end_screen': True,
                }))

        if event["should_update"]:
            await self.update_db_variables()
            await self.update_content()

        # Hint:
        # handle disconnect of someone during playing phase
        disconnect = False
        if self.state == 'playing':
            if MSG_LEAVE_LOBBY in notification:
                disconnect = True

        await self.send(text_data=json.dumps({
            'notification': notification,
            'disconnect': disconnect,
            }))


#   --------------  CHAT MESSAGE ---------------------

    async def send_chat_message(self, message):
        await self.channel_layer.group_send(
            self.lobby_group_name,
            {
                "type": "event_chat_message",
                "message": f"{self.nickname}: {message}",
            }
        )

    async def event_chat_message(self, event):
        message = event["message"]
        await self.send(text_data=json.dumps({
            'message': message,
        }))

#   --------------  SETUP PHASE ROUTINE ---------------------

    async def send_setup_content(self):

        participants = await database_sync_to_async(self.tournament.get_participants_names_and_statuses)()
        participants_html = await database_sync_to_async(render_to_string)('tournament_lobby_setup_participants.html', {'participants': participants})

        game_settings = await database_sync_to_async(self.tournament.get_game_settings)()
        game_settings_html = await database_sync_to_async(render_to_string)('tournament_lobby_setup_game_settings.html', {'game_settings': game_settings, 'is_host': self.is_host})

        advance_button_html = False
        if self.is_host:
            if self.are_participants_ready:
                advance_button_html = await database_sync_to_async(render_to_string)('tournament_lobby_setup_advance_button.html')

        await self.channel_layer.send(
            self.channel_name,
            {
                'type': 'event_setup_content',
                'setup_content': {
                    'participants_html': participants_html,
                    'game_settings_html': game_settings_html,
                    'advance_button_html': advance_button_html,
                }
            }
        )

    # Hint:
    # This triggers removing unused setup content when state is switched to playing phase
    async def send_remove_setup_content(self):
        await self.channel_layer.group_send(
                self.lobby_group_name,
                {
                    'type': 'event_playing_content',
                    'playing_content': 'remove',
                    }
                )

    async def event_setup_content(self, event):
        setup_content = event['setup_content']
        await self.send(text_data=json.dumps({
            'setup_content': setup_content,
        }))

#   --------------  PLAYING PHASE ROUTINE ---------------------

    async def send_playing_content(self):
        game_settings = await database_sync_to_async(self.tournament.get_game_settings)()

        standings = await database_sync_to_async(self.tournament.get_participants_for_standings)()
        standings_html = await database_sync_to_async(render_to_string)('tournament_lobby_playing_standings.html', {'standings': standings})

        if not await database_sync_to_async(self.tournament.has_matches_list)():
            return
        matches_list = await database_sync_to_async(self.tournament.get_matches_list)()
        self.next_match = await database_sync_to_async(self.tournament.get_next_match)(self.tournament_user)
        match_name = None
        if self.next_match:
            match_name = self.next_match.name
        matches_list_html = await database_sync_to_async(render_to_string)('tournament_lobby_playing_matches_list.html', {'matches_list': matches_list, 'next_match': self.next_match, 'tournament_user': self.tournament_user})

        match_html = await database_sync_to_async(render_to_string)('tournament_lobby_playing_match_lobby.html')

        await self.channel_layer.send(
            self.channel_name,
            {
                'type': 'event_playing_content',
                'playing_content': {
                    'username': self.username,
                    'display_name': self.user_profile.display_name,
                    'room_name': match_name,
                    'match_html': match_html,
                    'game_settings': game_settings,
                    'standings_html': standings_html,
                    'matches_list_html': matches_list_html,
                }
            }
        )

    async def event_playing_content(self, event):
        playing_content = event['playing_content']
        await self.send(text_data=json.dumps({
            'playing_content': playing_content,
        }))

#   --------------  FINISHED PHASE ROUTINE ---------------------

    async def send_finished_content(self):
        self.next_match = await database_sync_to_async(self.tournament.get_next_match)(self.tournament_user)
        matches_list = await database_sync_to_async(self.tournament.get_matches_list)()
        matches_list_html = await database_sync_to_async(render_to_string)('tournament_lobby_playing_matches_list.html', {'matches_list': matches_list, 'next_match': self.next_match, 'tournament_user': self.tournament_user})
        standings = await database_sync_to_async(self.tournament.get_participants_for_standings)()
        standings_html = await database_sync_to_async(render_to_string)('tournament_lobby_playing_standings.html', {'standings': standings})
        winners = await database_sync_to_async(self.tournament.get_winners)()
        is_single_winner = True
        if len(winners) > 1:
            is_single_winner = False
        is_winner = self.tournament_user in winners
        winners_html = await database_sync_to_async(render_to_string)('tournament_lobby_finished_winners.html', {'winners': winners, 'is_single_winner': is_single_winner})
        finished_buttons_html = await database_sync_to_async(render_to_string)('tournament_lobby_finished_buttons.html', {'is_winner': is_winner})
        await self.channel_layer.send(
                self.channel_name,
                {
                    'type': 'event_finished_content',
                    'finished_content': {
                        'standings_html': standings_html,
                        'matches_list_html': matches_list_html,
                        'winners_html': winners_html,
                        'finished_buttons_html': finished_buttons_html,
                        'is_winner': is_winner,
                        }
                    }
                )

    async def event_finished_content(self, event):
        finished_content = event['finished_content']
        await self.send(text_data=json.dumps({
            'finished_content': finished_content,
        }))
