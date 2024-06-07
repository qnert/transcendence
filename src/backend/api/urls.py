from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('register/', views.RegisterView.as_view()),
	path('login/', views.LoginView.as_view()),
	path('logout/', views.LogoutView),
	path('setup-2fa/', views.Setup_2FA),
	path('Update_2FA_Status/', views.Update_2FA_Status),
	path('validateOTP/', views.Validate_OTP),
	path('get_2fa_status/', views.Get_2FA_Status),
	path('oauth/', views.redirect_to_login, name='oauth'),
	path('fetch_user_data/', views.fetch_user_data),
	path('set_passwd/', views.SetPasswd),
	path('set_new_passwd/', views.set_new_passwd),
	path('get_profile/', views.get_profile),
	path('save_changes/', views.save_changes),
	path('search_friends/', views.search_friends, name='search_friends'),
    path('send_friend_request/', views.send_friend_request, name='send_friend_request'),
    path('delete_friend/', views.delete_friend, name='delete_friend'),
	path('get_username/', views.get_username),
	path('activate_two_FA/', views.activate_two_FA),
	path('deactivate_two_FA/', views.deactivate_two_FA),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) #is it really needed?
