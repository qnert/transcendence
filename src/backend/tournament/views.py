from django.shortcuts import render
from django.http import JsonResponse
# from django.core.exceptions import ObjectDoesNotExist
from django.views.decorators.csrf import csrf_exempt  # @note disable token security for testing
from tournament.models import Tournament
from api.models import UserProfile
import json


def tournament(request):
    return render(request, 'tournament_base.html')


def tournament_hub(request):
    if (request.method == "GET"):
        tournaments = list(Tournament.objects.all().values())
        return render(request, 'tournament_hub.html', {'tournaments': tournaments})


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
                return JsonResponse({"error": "Tournament exists already!"}, status=400)

            Tournament.objects.create(name=tournament_name, created_by=user_profile)
            return JsonResponse({"message": "Success"}, status=201)


# @csrf_exempt
# TODO check if error handling is actually required because parsing is mostly done in frontend already
# def create_tournament(request):
#    # TODO check for POST request
#    try:
#        request_json = json.loads(request.body)
#        user_profile = UserProfile.objects.get(user=request.user)
#    except ObjectDoesNotExist:
#        return JsonResponse({"error": "UserProfile doesn't exist for the current user"}, status=400)
#    except json.JSONDecodeError:
#        return JsonResponse({"error": "Invalid JSON data in request body"}, status=400)
#
#    tournament_name = request_json.get("tournament_name")
#    if not tournament_name:
#        return JsonResponse({"error": "Tournament name is required"}, status=400)
#
#    if Tournament.objects.filter(name=tournament_name).exists():
#        return JsonResponse({"error": "Tournament name is already taken"}, status=409)
#
#    Tournament.objects.create(name=tournament_name, created_by=user_profile)
#
#    return JsonResponse({"message": "success"}, status=201)
