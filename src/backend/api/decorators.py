from django.http import JsonResponse, HttpResponseForbidden, HttpRequest
from functools import wraps
from django.shortcuts import render
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.views import TokenVerifyView
from rest_framework import status

def own_login_required(view_func):
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
            if request.headers.get('Content-Type') == 'application/json':
                return JsonResponse({'error': 'You are not logged in'}, status=401)
            else:
                return render(request, 'base.html')
        elif not request.user.is_logged_in:
            if request.headers.get('Content-Type') == 'application/json':
                return JsonResponse({'error': 'You are not logged in!'}, status=401)
            else:
                return render(request, 'base.html')
        return view_func(request, *args, **kwargs)
    return _wrapped_view


def twoFA_required(view_func):
	def _wrapped_view(request, *args, **kwargs):
		if(request.user.is_2fa_enabled):
			if isinstance(request.user, AnonymousUser):
				return JsonResponse({'error': '2FA required'}, status=401)
			if not getattr(request.user, 'completed_2fa', False):
				return JsonResponse({'error': '2FA required'}, status=401)
			return view_func(request, *args, **kwargs)
	return _wrapped_view
