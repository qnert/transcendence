from django.urls import path
from . import views_content

urlpatterns = [
	path('', views_content.baseView),
	path('home/', views_content.homeView),
	path('login/', views_content.loginFormView),
	path('2FA/', views_content.twoFAView),
]
