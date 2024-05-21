from django.http import JsonResponse
from functools import wraps

def OTP_required(view_func):
	def _wrapped_view(request, *args, **kwargs):
		if(request.user.is_2fa_enabled):
			if not request.user.is_authenticated:
				return JsonResponse({'error': 'User not authenticated'}, status=401)
			if not getattr(request.user, 'completed_2fa', False):
				return JsonResponse({'error': '2FA required'}, status=403)
			return view_func(request, *args, **kwargs)
	
	return _wrapped_view


def own_login_required(view_func):
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'User not authenticated'}, status=401)
        return view_func(request, *args, **kwargs)
    return _wrapped_view