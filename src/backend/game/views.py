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

def history(request):
  return render(request, 'match_history.html')

def get_username(request):
  username = UserProfile.objects.get(user=request.user)
  return JsonResponse({'username': username.display_name})

def game_history(request):
    if request.method == "GET":
        user_profile = request.user.profile
        game_results = GameResult.objects.filter(user_profile=user_profile)
        if game_results is None:
            return JsonResponse({'error': 'There is no Game History'}, status=400)
        data = [
            {
                # 'user_profile': result.user_profile.display_name,
                'opponent_profile': result.opponent_profile.display_name,
                'user_score': result.user_score,
                'opponent_score': result.opponent_score,
                'is_win': result.is_win,
                'date_played': result.date_played.strftime('%Y-%m-%d %H:%M:%S')
            }
            for result in game_results
        ]
        return JsonResponse(data, safe=False)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)
