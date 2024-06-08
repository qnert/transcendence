from django.urls import path
from . import views

urlpatterns = [
    path('tournament/creation/', views.tournament_creation),
    path('tournament/api/create/', views.create_tournament),
    path('tournament/lobby/', views.tournament_lobby)
]
