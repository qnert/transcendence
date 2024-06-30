from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt  # TODO remove
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from tournament.models import Tournament
from api.models import UserProfile
import json

# TODO protect if method isnt correct?


def tournament_hub(request):
    if (request.method == "GET"):
        tournaments = list(Tournament.objects.all().values())
        return render(request, 'tournament_hub.html', {'tournaments': tournaments})


def tournament_lobby(request, lobby_name):
    if request.method == "GET":
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            tournament = Tournament.objects.get(name=lobby_name)
            tournament.add_participant(user_profile=user_profile)
            lobby = {
                "name": lobby_name,
                "state": tournament.get_state(),
                "names": tournament.get_participants_names(),
                "states": tournament.get_participants_states(),
            }
        except UserProfile.DoesNotExist:
            return JsonResponse({"error": "User profile not found!"}, status=401)
        except Tournament.DoesNotExist:
            return JsonResponse({"error": "Lobby not found!"}, status=404)
        except ValidationError as e:
            return JsonResponse({"error": e.message}, status=400)
        return render(request, "tournament_lobby.html", {"lobby": lobby})


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
