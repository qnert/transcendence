from django.shortcuts import render
from django.contrib.auth.decorators import login_required

def baseView(request):
	return render(request, 'base.html')

def loginFormView(request):
	return render(request, 'login.html')

def homeView(request):
	return render(request, 'home.html')

def twoFAView(request):
	return render(request, '2FA.html')