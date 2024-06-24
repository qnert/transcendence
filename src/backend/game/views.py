from django.shortcuts import render
from api.models import *
from .models import GameResult
from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from channels.layers import get_channel_layer
from asgiref.sync import sync_to_async
from django.http import JsonResponse
import matplotlib.pyplot as plt
import io
import urllib, base64
import numpy as np

channel_layer = get_channel_layer()

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




def generate_pie_chart(request):
    user_profile = request.user.profile
    game_results = GameResult.objects.filter(user_profile=user_profile)
    column_values = game_results.values_list('is_win', flat=True)
    data = list(column_values)
    if len(data) == 0:
      return JsonResponse({'error': 'No data given'}, status=400)
    labels = ['Won', 'Lost']
    counts = [sum(1 for value in data if value), len(data) - sum(1 for value in data if value)]

    plt.figure(figsize=(6, 6))
    plt.pie(counts, labels=labels, autopct='%.1f%%', startangle=140)
    plt.title('Win/Loss Percentage')
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    image_png = buffer.getvalue()
    buffer.close()

    graphic = base64.b64encode(image_png).decode('utf-8')
    return JsonResponse({'success': graphic}, status=200)


def generate_line_chart_avg(request):
    user_profile = request.user.profile
    game_results = GameResult.objects.filter(user_profile=user_profile)
    average_rallies = game_results.values_list('average_rally', flat=True)
    average_rallies = [rally for rally in average_rallies if rally is not None]
    if len(average_rallies) == 0:
      return JsonResponse({'error': 'No data given'}, status=400)

    games = list(range(1, len(average_rallies) + 1))

    fig, ax = plt.subplots()
    ax.plot(games, average_rallies, marker='o', linestyle='-', color='b', label='Average Rally')
    
    ax.set_xlabel('Games')
    ax.set_ylabel('Average Rally')
    ax.set_title('Average Rallies per Game')

    for i, txt in enumerate(average_rallies):
        ax.annotate(f'{txt}', (games[i], average_rallies[i]), textcoords="offset points", xytext=(0, 10), ha='center')

    ax.legend()
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    image_png = buffer.getvalue()
    buffer.close()

    graphic = base64.b64encode(image_png).decode('utf-8')
    return JsonResponse({'success': graphic}, status=200)


def generate_line_chart_max(request):
    user_profile = request.user.profile
    game_results = GameResult.objects.filter(user_profile=user_profile)
    max_rallies = game_results.values_list('max_rally', flat=True)
    max_rallies = [rally for rally in max_rallies if rally is not None]
    if len(max_rallies) == 0:
      return JsonResponse({'error': 'No data given'}, status=400)

    games = list(range(1, len(max_rallies) + 1))
    fig, ax = plt.subplots()
    ax.plot(games, max_rallies, marker='o', linestyle='-', color='b', label='Max. Rally')

    ax.set_xlabel('Games')
    ax.set_ylabel('Max. Rally')
    ax.set_title('Max. Rallies per Game')

    for i, txt in enumerate(max_rallies):
        ax.annotate(f'{txt}', (games[i], max_rallies[i]), textcoords="offset points", xytext=(0, 10), ha='center')

    ax.legend()
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    image_png = buffer.getvalue()
    buffer.close()

    graphic = base64.b64encode(image_png).decode('utf-8')
    return JsonResponse({'success': graphic}, status=200)



def generate_line_chart_min(request):
    user_profile = request.user.profile
    game_results = GameResult.objects.filter(user_profile=user_profile)
    min_rallies = game_results.values_list('min_rally', flat=True)
    min_rallies = [rally for rally in min_rallies if rally is not None]
    if len(min_rallies) == 0:
      return JsonResponse({'error': 'No data given'}, status=400)
    games = list(range(1, len(min_rallies) + 1))
    fig, ax = plt.subplots()
    ax.plot(games, min_rallies, marker='o', linestyle='-', color='b', label='Min. Rally')

    ax.set_xlabel('Games')
    ax.set_ylabel('Min. Rally')
    ax.set_title('Min. Rallies per Game')

    for i, txt in enumerate(min_rallies):
        ax.annotate(f'{txt}', (games[i], min_rallies[i]), textcoords="offset points", xytext=(0, 10), ha='center')

    ax.legend()
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    image_png = buffer.getvalue()
    buffer.close()

    graphic = base64.b64encode(image_png).decode('utf-8')
    return JsonResponse({'success': graphic}, status=200)
