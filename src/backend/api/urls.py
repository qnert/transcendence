from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
  path('register/', views.RegisterView.as_view()),
	path('login/', views.LoginView),
	path('logout/', views.LogoutView),
	path('setup-2fa/', views.setup_2FA),
	path('Update_2FA_Status/', views.Update_2FA_Status),
	path('validate_otp/', views.validate_otp),
	path('get_2fa_status/', views.Get_2FA_Status),
	path('check_login_status/', views.check_login_status),
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
  	path('get_user_id/', views.get_user_id),
  	path('store_jwt/', views.store_jwt),
	path('activate_two_FA/', views.activate_two_FA),
	path('deactivate_two_FA/', views.deactivate_two_FA),
	path('login_status/', views.login_status),
	path('friends/', views.friends_list, name='friends_list'),
	path('friends_online_status/', views.friends_online_status, name='friends_online_status'),
	path('pending_friend_requests/', views.pending_friend_requests, name='pending_friend_requests'),
	path('messages/<int:friend_id>/', views.get_chat_messages, name='get_chat_messages'),
	path('block/<int:user_id>/', views.block_user, name='block_user'),
	path('unblock/<int:user_id>/', views.unblock_user, name='unblock_user'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) #is it really needed?
