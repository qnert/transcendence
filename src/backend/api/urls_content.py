from django.urls import path
from . import views_content

urlpatterns = [
	path('', views_content.baseView),
	path('home/', views_content.homeView),
	path('login/', views_content.loginFormView, name="login"),
	path('2FA/', views_content.twoFAView),
	path('set_passwd', views_content.set_passwd, name="set_passwd"),
]
