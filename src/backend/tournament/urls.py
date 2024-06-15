from django.urls import path
from tournament import views

urlpatterns = [
    path('', views.tournament),
    path('hub/', views.tournament_hub),
    path('api/get_list/', views.tournament_get_list),
    path('api/create/', views.tournament_create),
]
