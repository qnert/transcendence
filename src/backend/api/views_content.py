from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from .decorators import *
# from .views import check_access_token
from django.http import JsonResponse


def baseView(request):
	return render(request, 'base.html')

def loginFormView(request):
	return render(request, 'login.html')

# @own_jwt_required
@twoFA_required
@own_login_required
def homeView(request):
	return render(request, 'home.html')

def twoFAView(request):
	return render(request, '2FA.html')

@own_login_required
def profileView(request):
    return render(request, 'profile.html')

def set_passwd(request):
	return render(request, 'set_passwd.html')

def chatView(request):
	return render(request, 'chatroom.html')