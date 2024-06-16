from django.urls import path
from tournament import views

urlpatterns = [
    path('', views.tournament),
    path('hub/', views.tournament_hub),
    path('api/get_list/', views.tournament_api_get_list),
    path('api/create/', views.tournament_api_create),
    path("lobby/<str:lobby_name>/", views.tournament_lobby, name="lobby"),
]
