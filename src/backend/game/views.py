from django.shortcuts import render

# Create your views here.
from django.shortcuts import render
from api.models import UserProfile
from .models import GameResult
from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from channels.layers import get_channel_layer
from asgiref.sync import sync_to_async
from django.http import JsonResponse

channel_layer = get_channel_layer()

# Create your views here.

def game(request):
  return render(request, 'game.html')

def multiplayer(request, room_name=None):
  return render(request, 'multiplayer.html', {'room_name': room_name})

def get_username(request):
  username = UserProfile.objects.get(user=request.user)
  return JsonResponse({'username': username.display_name})

def matches(request):
  user_profile = request.user.profile
  game_results = GameResult.objects.filter(user_profile=user_profile)
  return render(request, 'game/match_history.html', {'game_results': game_results})
