from django.urls import path
from tournament import views

urlpatterns = [
    path('', views.tournament),
    path('hub/', views.tournament_hub, name="hub"),
    path('api/get_list/', views.tournament_api_get_list, name="get_list"),
    path('api/get_state/', views.tournament_api_get_state, name="get_state"),
    path('api/get_participants/', views.tournament_api_get_participants, name="get_participants"),
    path('api/create/', views.tournament_api_create, name="create"),
    path('api/join/', views.tournament_api_join, name="join"),
    path("lobby/<str:lobby_name>/", views.tournament_lobby, name="lobby"),
]
