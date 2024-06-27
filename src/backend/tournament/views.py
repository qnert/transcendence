from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt  # TODO remove
from django.core.exceptions import ValidationError
from tournament.models import Tournament
from api.models import UserProfile
import json


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


def tournament_api_get_participants(request):
    if (request.method == "GET"):
        tournament_name = request.GET.get("tournament_name")
        tournament = Tournament.objects.get(name=tournament_name)
        participants = tournament.get_participants()
        return render(request, 'tournament_participants.html', {'participants': participants})


def tournament_api_get_state(request):
    if (request.method == "GET"):
        tournament_name = request.GET.get("tournament_name")
        tournament = Tournament.objects.get(name=tournament_name)
        tournament_state = tournament.state
        return JsonResponse({"state": tournament_state}, status=200)


@csrf_exempt
def tournament_api_create(request):
    if (request.method == "POST"):
        tournament_name = json.loads(request.body).get("tournament_name")
        # TODO check for exceptions?
        user_profile = UserProfile.objects.get(user=request.user)
        if tournament_name is not None:
            if Tournament.objects.filter(name=tournament_name).exists():
                return JsonResponse({"error": "Tournament exists already!"}, status=400)
            Tournament.objects.create(name=tournament_name, created_by=user_profile)
            return JsonResponse({"message": "Success"}, status=201)


@csrf_exempt
def tournament_api_join(request):
    if (request.method == "POST"):
        tournament_name = json.loads(request.body).get("tournament_name")
        # TODO mb allow superusers to join tournament too for testing?
        # TODO check for exceptions?
        tournament = Tournament.objects.get(name=tournament_name)
        user_profile = UserProfile.objects.get(user=request.user)
        try:
            tournament.add_participant(user_profile=user_profile)
        except ValidationError as e:
            return JsonResponse({"error": e.message }, status=400)
        return JsonResponse({"message": "Success"}, status=201)
