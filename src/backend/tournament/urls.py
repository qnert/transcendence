from django.urls import path
from . import views

urlpatterns = [
    path('creation/', views.tournament_creation),
    path('api/create/', views.create_tournament),
    path('lobby/', views.tournament_lobby)
]
