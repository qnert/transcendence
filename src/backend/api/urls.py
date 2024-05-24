from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view()),
	path('login/', views.LoginView.as_view()),
	path('logout/', views.LogoutView),
	path('setup-2fa/', views.Setup_2FA),
	path('validateOTP/', views.Validate_OTP),
	path('get_2fa_status/', views.Get_2FA_Status),
	path('oauth/', views.redirect_to_login, name='oauth'),
	path('fetch_user_data/', views.fetch_user_data),
	path('set_passwd/', views.SetPasswd),
]
