from django.http import JsonResponse,  HttpResponseForbidden
from functools import wraps
from django.shortcuts import render
from django.contrib.auth.models import AnonymousUser

def own_login_required(view_func):
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
             return JsonResponse("You are not logged in!")
        elif isinstance(request.user, AnonymousUser):
             return JsonResponse("You are not logged in!")
        elif not request.user.is_logged_in:
            return JsonResponse("You are not logged in!")
        return view_func(request, *args, **kwargs)
    return _wrapped_view


# def own_login_required(view_func):
#     def _wrapped_view(request, *args, **kwargs):
#         if not request.user.is_authenticated:
#             if request.headers.get('Accept') == 'application/json':
#                 return JsonResponse({'error': 'You are not logged in'}, status=401)
#             else:
#                 return redirect('/login/')
#         elif not request.user.is_logged_in:
#             if request.headers.get('Accept') == 'application/json':
#                 return JsonResponse({'error': 'You are not logged in!'}, status=403)
#             else:
#                 return redirect('/login/')
#         return view_func(request, *args, **kwargs)
#     return _wrapped_view


def OTP_required(view_func):
	def _wrapped_view(request, *args, **kwargs):
		if(request.user.is_2fa_enabled):
			if not getattr(request.user, 'completed_2fa', False):
				return JsonResponse({'error': '2FA required'}, status=598)
			return view_func(request, *args, **kwargs)
	return _wrapped_view
