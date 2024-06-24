"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from api.views import *
from rest_framework_simplejwt import views as jwt_views
from two_factor.urls import urlpatterns as tf_urls
from api.views import auth_callback
from game.views import *

urlpatterns = [
	path('', include('django_prometheus.urls')),
    path('admin/', admin.site.urls),
	path('api/', include('api.urls')),
	path('', include('api.urls_content')),
	path('token/', jwt_views.TokenObtainPairView.as_view(), name="token_obtain_pair"),
	path('token/refresh/', jwt_views.TokenRefreshView.as_view(), name="token_refresh"),
	path('token/verify/', jwt_views.TokenVerifyView.as_view(), name="token_verify"),
	path('callback/', auth_callback, name='oauth_callback'),
    path('api/', include('api.urls')),
    path('tournament/', include('tournament.urls')),
	path('game/', game, name='game'),
    path('username/', get_username, name='get_username'),
    path('multiplayer/', multiplayer, name='multiplayer'),
    path('history/', history, name='history'),
    path('game_history/', game_history, name='game_history'),
	path('pie_chart/', generate_pie_chart),
	path('line_chart_avg/', generate_line_chart_avg),
	path('line_chart_max/', generate_line_chart_max),
	path('line_chart_min/', generate_line_chart_min),
]
