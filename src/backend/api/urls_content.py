from django.urls import path
from . import views_content
from django.conf.urls import handler404

handler404 = views_content.custom_404

urlpatterns = [
	path('', views_content.baseView),
	path('home/', views_content.homeView),
	path('login/', views_content.loginFormView, name="login"),
	path('2FA/', views_content.twoFAView),
	path('set_passwd/', views_content.set_passwd, name="set_passwd"),
	path('profile/', views_content.profileView),
	path('friend/<str:display_name>/', views_content.friends_profile),
	path('chat/', views_content.chatView),
	path('error_page', views_content.ErrorPage),
]
