from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt  # disable token security for testing


def tournament(request):
    return render(request, 'tournament.html')


@csrf_exempt  # @note just for testing purposes
def create_tournament(request):
    if request.method == "POST":
        print("correct request")
    return JsonResponse({"message": "received something"}, status=201)
