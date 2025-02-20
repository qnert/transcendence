from django.urls import path
from tournament import views

urlpatterns = [
    path('', views.tournament_hub, name="hub"),
    path('hub/', views.tournament_hub, name="hub"),
    path("lobby/<str:lobby_name>/", views.tournament_lobby, name="lobby"),
    path('api/create/', views.tournament_api_create, name="create"),
    path('api/get_list/', views.tournament_api_get_list, name="get_list"),
]
