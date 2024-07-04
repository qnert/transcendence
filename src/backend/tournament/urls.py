from django.urls import path
from tournament import views

urlpatterns = [
    # TODO not sure if this or we should handle all 404 errors instead
    path('', views.tournament_hub, name="hub"),
    path('hub/', views.tournament_hub, name="hub"),
    path('api/create/', views.tournament_api_create, name="create"),
    path("lobby/<str:lobby_name>/", views.tournament_lobby, name="lobby"),

    # TODO remove at some point if not used
    path('api/get_list/', views.tournament_api_get_list, name="get_list"),
    path('api/get_state/', views.tournament_api_get_state, name="get_state"),
    path('api/get_participants/<str:lobby_name>/', views.tournament_api_get_participants, name="get_participants"),
]
