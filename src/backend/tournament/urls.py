from django.urls import path
from . import views

urlpatterns = [
    path('creation/', views.tournament_creation),
    path('api/create/', views.create_tournament),
    path('api/get_list/', views.get_tournaments),
    path("<str:lobby_name>/", views.tournament_lobby),
]
