from django.shortcuts import render
from django.http import JsonResponse
from django.core.exceptions import ObjectDoesNotExist
from django.views.decorators.csrf import csrf_exempt  # @note disable token security for testing
from tournament.models import Tournament
from api.models import UserProfile
import json


def tournament_creation(request):
    return render(request, 'tournament_creation.html')


@csrf_exempt  # @note
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


def tournament_lobby(request):
    return render(request, 'tournament_lobby.html')
