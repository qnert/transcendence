from django.http import JsonResponse, HttpResponseForbidden, HttpRequest
from functools import wraps
from django.shortcuts import render, redirect
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.views import TokenVerifyView
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from .models import User

def fast_logout(request):
    if not isinstance(request.user, AnonymousUser):
        user = request.user
        if user.is_logged_in:
            refresh_token = user.refresh_token
            if refresh_token is not None:
                user.refresh_token = None
                refresh_token = RefreshToken(refresh_token)
                refresh_token.blacklist()

            user.completed_2fa = False
            user.is_logged_in = False
            user.save()


def own_login_required(view_func):
    def _wrapped_view(request, *args, **kwargs):
        if isinstance(request.user, AnonymousUser):
            if request.headers.get('Content-Type') == 'application/json':
                return JsonResponse({'error': 'You are not logged in'}, status=401)
            else:
                return redirect('/login/')
        elif not request.user.is_logged_in:
            if request.headers.get('Content-Type') == 'application/json':
                return JsonResponse({'error': 'You are not logged in!'}, status=401)
            else:
                return redirect('/login/')
        return view_func(request, *args, **kwargs)
    return _wrapped_view


def twoFA_required(view_func):
    def _wrapped_view(request, *args, **kwargs):
        if isinstance(request.user, AnonymousUser):
            if request.headers.get('Content-Type') == 'application/json':
                return JsonResponse({'error': 'You are not logged in'}, status=401)
            else:
                return redirect('/login/')
        elif request.user.is_2fa_enabled:
            if not getattr(request.user, 'completed_2fa', False):
                if request.headers.get('Content-Type') == 'application/json':
                    return JsonResponse({'error': 'You are not logged in'}, status=401)
                else:
                    fast_logout(request)
                    return redirect('/login/')
        return view_func(request, *args, **kwargs)
    return _wrapped_view



def own_jwt_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if 'Authorization' in request.headers:        
            auth_header = request.headers['Authorization']
    
            if not auth_header.startswith('Bearer '):
                return JsonResponse({'error': 'Invalid authorization header format'}, status=401)
    
            token = auth_header.split(' ')[1]
            jwt_authentication = JWTAuthentication()
    
            try:
                jwt_authentication.get_validated_token(token)
            except:
                return JsonResponse({'error': 'Invalid access token'}, status=401)
        return view_func(request, *args, **kwargs)
    return wrapper