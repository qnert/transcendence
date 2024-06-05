from django.shortcuts import render


def tournament(request):
    return render(request, 'tournament.html')
