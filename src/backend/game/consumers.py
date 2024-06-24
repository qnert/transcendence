import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import GameResult
from api.models import UserProfile
from asgiref.sync import sync_to_async

class GameRoomConsumer(AsyncWebsocketConsumer):
  connected_user = {}

  async def connect(self):
    self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
    self.username = self.scope["url_route"]["kwargs"]["username"]
    self.room_group_name = f"game{self.room_name}"

    if self.room_name not in self.connected_user:
      self.connected_user[self.room_name] = []

    if len(self.connected_user[self.room_name]) == 2:
      await self.channel_layer.group_add(self.room_group_name, self.channel_name)
      await self.accept()
      await self.send(text_data=json.dumps({'type': 'connect_error'}))
      return

    self.connected_user[self.room_name].append(self.username)

    await self.channel_layer.group_add(self.room_group_name, self.channel_name)
    await self.accept()

    await self.send_connected_user()

  async def disconnect(self, close_code):
    if self.username not in self.connected_user[self.room_name]:
      await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
      return

    await self.disconnect_remote()

    self.connected_user[self.room_name].remove(self.username)
    if len(self.connected_user[self.room_name]) == 0:
      del self.connected_user[self.room_name]
    await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
    await self.send_connected_user()

  async def receive(self, text_data):
    text_data_json = json.loads(text_data)
    if text_data_json['type'] == 'start_game':
      await self.start_game_remote(text_data_json)
    elif text_data_json['type'] == 'game_action':
      await self.send_game_action(text_data_json)
    elif text_data_json['type'] == 'ball_move':
      await self.send_ball_move(text_data_json)
    elif text_data_json['type'] == 'reset_game':
      await self.reset_game_remote(text_data_json)
    elif text_data_json['type'] == 'end_score':
      user_profile = await sync_to_async(UserProfile.objects.get)(display_name=self.username)
      opponent_profile = await sync_to_async(UserProfile.objects.get)(display_name=text_data_json['opponent'])
      await sync_to_async(GameResult.objects.create)(
          user_profile=user_profile,
          opponent_profile=opponent_profile,
          user_score=text_data_json['user_score'],
          opponent_score=text_data_json['opponent_score'],
          is_win=text_data_json['is_win'],
          max_rally=text_data_json['max_rally'],
          min_rally=text_data_json['min_rally'],
          average_rally=text_data_json['average_rally']
      )

  async def send_connected_user(self):
    connected_user_json = json.dumps(self.connected_user)

    await self.channel_layer.group_send(
      self.room_group_name,{
        'type': 'connected_users',
        'room_name': self.room_name,
        'username': self.username,
        'connected_users': connected_user_json
      }
    )

  async def connected_users(self, event):
    room_name = event['room_name']
    connected_users_json = event['connected_users']

    data = {
        'type': 'connected_users',
        'room_name': room_name,
        'username': self.username,
        'connected_users': connected_users_json
    }

    await self.send(text_data=json.dumps(data))

  async def disconnect_remote(self):
    await self.channel_layer.group_send(
      self.room_group_name,{
        'type': 'disconnected'
      }
    )

  async def disconnected(self, event):
    data = {
        'type': 'disconnected'
    }
    await self.send(text_data=json.dumps(data))

  async def start_game_remote(self, text_data_json):
    await self.channel_layer.group_send(
      self.room_group_name,{
        'type': 'start_game',
        'ballspeed_x': text_data_json['ball_speed_x'],
        'ballspeed_y': text_data_json['ball_speed_y'],
        'ball_color': text_data_json['ballColor'],
        'border_color': text_data_json['borderColor'],
        'background_color': text_data_json['backgroundColor'],
        'ballspeed': text_data_json['ballSpeed'],
        'max_score': text_data_json['maxScore'],
        'advancedMode': text_data_json['advancedMode'],
        'powerUps': text_data_json['powerUps']
      }
    )

  async def start_game(self, event):
    data = {
        'type': 'start_game',
        'ball_speed_x': event['ballspeed_x'],
        'ball_speed_y': event['ballspeed_y'],
        'backgroundColor': event['background_color'],
        'borderColor': event['border_color'],
        'ballColor': event['ball_color'],
        'ballSpeed': event['ballspeed'],
        'maxScore': event['max_score'],
        'advancedMode': event['advancedMode'],
        'powerUps': event['powerUps']
    }
    await self.send(text_data=json.dumps(data))

  async def reset_game_remote(self, text_data_json):
    await self.channel_layer.group_send(
      self.room_group_name,{
        'type': 'reset_game',
        'ballspeed_x': text_data_json['ball_speed_x'],
        'ballspeed_y': text_data_json['ball_speed_y'],
        'score_1': text_data_json['score1'],
        'score_2': text_data_json['score2']
      }
    )

  async def reset_game(self, event):
    data = {
        'type': 'reset_game',
        'ball_speed_x': event['ballspeed_x'],
        'ball_speed_y': event['ballspeed_y'],
        'score1': event['score_1'],
        'score2': event['score_2']
    }
    await self.send(text_data=json.dumps(data))

  async def send_ball_move(self, text_data_json):
    await self.channel_layer.group_send(
      self.room_group_name,{
        'type': 'ball_move',
        'ballspeed_x': text_data_json['ball_speed_x'],
        'ballspeed_y': text_data_json['ball_speed_y']
      }
    )

  async def ball_move(self, event):
    data = {
        'type': 'ball_move',
        'ball_speed_x': event['ballspeed_x'],
        'ball_speed_y': event['ballspeed_y']
    }
    await self.send(text_data=json.dumps(data))

  async def game_action(self, event):
    data = {
        'type': 'game_action',
        'action': event['action'],
        'player': event['player']
    }
    await self.send(text_data=json.dumps(data))

  async def send_game_action(self, text_data_json):
    await self.channel_layer.group_send(
      self.room_group_name,{
        'type': 'game_action',
        'action': text_data_json['action'],
        'player': text_data_json['player']
      }
    )

  async def game_action(self, event):
    data = {
        'type': 'game_action',
        'action': event['action'],
        'player': event['player']
    }
    await self.send(text_data=json.dumps(data))

