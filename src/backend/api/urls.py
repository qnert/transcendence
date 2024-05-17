from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view()),
	path('login/', views.LoginView.as_view()),
	path('logout/', views.LogoutView.as_view(), name='logout'),
	path('get_2fa_status/', views.Get_2FA_Status),
	path('setup_2FA/', views.Setup_2FA),
	path('update_2fa_status/', views.Update_2FA_Status),

]
