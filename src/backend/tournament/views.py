from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt  # TODO remove
from django.core.exceptions import ValidationError
from tournament.models import Tournament, MAX_PARTICIPANTS
from api.models import UserProfile
import json

# TODO
#@own_jwt_required
#@twoFA_required
#@own_login_required
def tournament_hub(request):
    if request.method == "GET":
        state_order = {
                'setup': 1,
                'playing': 2,
                'finished': 3
                }
        tournaments = sorted(Tournament.objects.all(), key=lambda t: state_order.get(t.get_state(), 99))
        return render(request, 'tournament_hub.html', {'tournaments': tournaments, 'max_participants': MAX_PARTICIPANTS})

# TODO
# Hint:
# Used after creating and joining
# tournament_hub.js
#@own_jwt_required
#@twoFA_required
#@own_login_required
def tournament_lobby(request, lobby_name):
    if request.method == "GET":
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            tournament = Tournament.objects.get(name=lobby_name)
            tournament.add_participant(user_profile=user_profile)
            lobby = {
                "name": lobby_name,
                "state": tournament.get_state(),
                "participants": tournament.get_participants_names_and_statuses(),
                "game_settings": tournament.get_game_settings(),
                "is_host": tournament.is_host(user_profile),
                "are_participants_ready": tournament.are_participants_ready(),
            }
        except UserProfile.DoesNotExist:
            return JsonResponse({"error": "User profile not found!"}, status=401)
        except Tournament.DoesNotExist:
            return JsonResponse({"error": "Lobby not found!"}, status=400)
        except ValidationError as e:
            return JsonResponse({"error": e.message}, status=400)
        return render(request, "tournament_lobby.html", {"lobby": lobby})

# TODO
# Hint:
# Used in Dropdown Menu
# tournament_hub.js
#@own_jwt_required
#@twoFA_required
#@own_login_required
def tournament_api_get_list(request):
    if request.method == "GET":
        state_order = {
                'setup': 1,
                'playing': 2,
                'finished': 3
                }
        tournaments = sorted(Tournament.objects.all(), key=lambda t: state_order.get(t.get_state(), 99))
        return render(request, 'tournament_hub_list.html', {'tournaments': tournaments, 'max_participants': MAX_PARTICIPANTS})

# TODO
# Hint:
# Used in on createButton click
# tournament_hub.js
@csrf_exempt
#@own_jwt_required
#@twoFA_required
#@own_login_required
def tournament_api_create(request):
    if request.method == "POST":
        tournament_name = json.loads(request.body).get("tournament_name")
        user_profile = UserProfile.objects.get(user=request.user)
        if tournament_name is not None:
            if Tournament.objects.filter(name=tournament_name).exists():
                return JsonResponse({"error": "Tournament exists already!"}, status=400)
            Tournament.objects.create(name=tournament_name, created_by=user_profile)
            return JsonResponse({"message": "Success"}, status=201)
