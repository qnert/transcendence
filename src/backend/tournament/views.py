from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt  # @note disable token security for testing
from tournament.models import Tournament
from api.models import UserProfile
import json


def tournament(request):
    return render(request, 'tournament.html')


# TODO write tests, implement error handling
@csrf_exempt  # @note
def create_tournament(request):
    request_json = json.loads(request.body)
    user_profile = UserProfile.objects.get(user=request.user)
    tournament_name = request_json.get("tournament_name")
    Tournament.objects.create(name=tournament_name, created_by=user_profile)
    return JsonResponse({"message": "success"}, status=201)
