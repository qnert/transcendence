from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from .decorators import *
from django.http import JsonResponse
from .models import *

def baseView(request):
	return render(request, 'base.html')

def loginFormView(request):
	return render(request, 'login.html')

@own_jwt_required
@own_login_required
def twoFAView(request):
	return render(request, '2FA.html')

@own_jwt_required
@twoFA_required
@own_login_required
def homeView(request):
	return render(request, 'home.html')


@own_jwt_required
@twoFA_required
@own_login_required
def profileView(request):
    return render(request, 'profile.html')

@own_jwt_required
@twoFA_required
@own_login_required
def friends_profile(request, display_name):
	try:
		user_profile = UserProfile.objects.get(display_name=display_name)
	except:
		context= {'error_message': f'There is no user with name: {display_name}'}
		return render(request, '404.html', context)
	context= {'display_name': display_name}
	return render(request, 'friends.html', context)


def set_passwd(request):
	return render(request, 'set_passwd.html')

def chatView(request):
	return render(request, 'chatroom.html')
