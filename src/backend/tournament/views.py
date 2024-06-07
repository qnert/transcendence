from django.shortcuts import render
from django.http import JsonResponse
from django.core.exceptions import ObjectDoesNotExist
from django.views.decorators.csrf import csrf_exempt  # @note disable token security for testing
from tournament.models import Tournament
from api.models import UserProfile
import json


def tournament(request):
    return render(request, 'tournament.html')


@csrf_exempt  # @note
def create_tournament(request):
    try:
        request_json = json.loads(request.body)
        user_profile = UserProfile.objects.get(user=request.user)
    except ObjectDoesNotExist:
        return JsonResponse({"error": "UserProfile doesn't exist for the current user"})
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON data in request body"})

    tournament_name = request_json.get("tournament_name")
    if not tournament_name:
        return JsonResponse({"error": "Tournament name is required"}, status=400)

    Tournament.objects.create(name=tournament_name, created_by=user_profile)

    return JsonResponse({"message": "success"}, status=201)
