from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt  # TODO remove
from tournament.models import Tournament
from api.models import UserProfile
import json


def tournament(request):
    if (request.method == "GET"):
        return render(request, 'tournament_base.html')


def tournament_hub(request):
    if (request.method == "GET"):
        tournaments = list(Tournament.objects.all().values())
        return render(request, 'tournament_hub.html', {'tournaments': tournaments})


def tournament_lobby(request, lobby_name):
    if (request.method == "GET"):
        return render(request, "tournament_lobby.html", {"lobby_name": lobby_name})


def tournament_api_get_list(request):
    if (request.method == "GET"):
        tournaments = list(Tournament.objects.all().values())
        return render(request, 'tournament_list.html', {'tag': 'option', 'tournaments': tournaments})


@csrf_exempt
def tournament_api_create(request):
    if (request.method == "POST"):
        tournament_name = json.loads(request.body).get("tournament_name")
        user_profile = UserProfile.objects.get(user=request.user)
        if tournament_name is not None:
            if Tournament.objects.filter(name=tournament_name).exists():
                return JsonResponse({"error": "Tournament exists already!"}, status=409)

            Tournament.objects.create(name=tournament_name, created_by=user_profile)
            return JsonResponse({"message": "Success"}, status=201)
