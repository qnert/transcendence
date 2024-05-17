from django.shortcuts import render


def homeView(request):
	return render(request, 'home.html')

def loginFormView(request):
	return render(request, 'loginForm.html')

def testView(request):
	return render(request, 'test.html')

def twoFAView(request):
	return render(request, '2FA.html')