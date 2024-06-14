from django.shortcuts import render
from django.http import JsonResponse
from django.core.exceptions import ObjectDoesNotExist
from django.views.decorators.csrf import csrf_exempt  # @note disable token security for testing
from tournament.models import Tournament
from api.models import UserProfile
import json


def tournament_creation(request):
    return render(request, 'tournament_creation.html')


def tournament_lobby(request, room_name):
    if not Tournament.objects.filter(name=room_name).exists():
        return JsonResponse({"error:" "Tournament name is not existing"}, status=400)
    return render(request, 'tournament_lobby.html', {"room-name": room_name})


def get_tournaments(request):
    if request.method == 'GET':
        data = list(Tournament.objects.all().values())
        #  safe == false because we are returning a list, not a dict
        return JsonResponse(data, safe=False)
    else:
        return JsonResponse({"message": "failure!"})


@csrf_exempt
# TODO check if error handling is actually required because parsing is mostly done in frontend already
def create_tournament(request):
    try:
        request_json = json.loads(request.body)
        user_profile = UserProfile.objects.get(user=request.user)
    except ObjectDoesNotExist:
        return JsonResponse({"error": "UserProfile doesn't exist for the current user"}, status=400)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON data in request body"}, status=400)

    tournament_name = request_json.get("tournament_name")
    if not tournament_name:
        return JsonResponse({"error": "Tournament name is required"}, status=400)

    if Tournament.objects.filter(name=tournament_name).exists():
        return JsonResponse({"error": "Tournament name is already taken"}, status=409)

    Tournament.objects.create(name=tournament_name, created_by=user_profile)

    return JsonResponse({"message": "success"}, status=201)
