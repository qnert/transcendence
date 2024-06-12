from django.middleware.csrf import CsrfViewMiddleware
from django.http import JsonResponse
from django.conf import settings


class CSRFMiddleware(CsrfViewMiddleware):
    def process_view(self, request, callback, callback_args, callback_kwargs):
        if request.method not in ('GET', 'HEAD', 'OPTIONS', 'TRACE'):
            csrf_token = self._sanitize_token(request.COOKIES.get(settings.CSRF_COOKIE_NAME))
            csrf_token_from_header = request.headers.get('X-CSRFToken')
            if not constant_time_compare(csrf_token, csrf_token_from_header):
                return JsonResponse({'error': 'CSRF token mismatch'}, status=403)

        return None