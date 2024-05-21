from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from .decorators import *

def baseView(request):
	return render(request, 'base.html')
def loginFormView(request):
	return render(request, 'login.html')

@login_required
def homeView(request):
	return render(request, 'home.html')

@own_login_required
def twoFAView(request):
	return render(request, '2FA.html')