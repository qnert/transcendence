from rest_framework_simplejwt.views import TokenVerifyView
from rest_framework.response import Response
from rest_framework import status
from django.utils.deprecation import MiddlewareMixin
from rest_framework.request import Request
from django.http import HttpRequest
from django.http import JsonResponse

class JWTMiddleware(MiddlewareMixin):
    def process_view(self, request, view_func, view_args, view_kwargs):
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(' ')[1]
            verify_view = TokenVerifyView.as_view()

            # Create a new DRF Request object for verification
            verify_request = Request(request._request)
            verify_request.data = {'token': token}

            response = verify_view(verify_request)

            if response.status_code != status.HTTP_200_OK:
                return JsonResponse({'error': 'Invalid token'}, status=401)

        return None

# import jwt
# from django.conf import settings
# from django.http import JsonResponse
# from datetime import datetime
# from django.utils.timezone import utc
# from django.core.cache import cache

# class JWTMiddleware:
#     def __init__(self, get_response):
#         self.get_response = get_response

#     def __call__(self, request):
#         response = self.get_response(request)
#         return response

#     def process_view(self, request, view_func, view_args, view_kwargs):
#         # Get the JWT token from the Authorization header
#         token = request.headers.get('Authorization', '').split(' ')[1] if 'Authorization' in request.headers else None
        
#         # Check if token exists
#         if token:
#             try:
#                 # Verify the JWT token
#                 decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])

#                 # Ensure token hasn't been blacklisted
#                 if self.token_is_blacklisted(token):
#                     return JsonResponse({'error': 'Token is blacklisted'}, status=401)

#                 # Ensure token hasn't expired
#                 if not self.token_not_expired(decoded['exp']):
#                     return JsonResponse({'error': 'Token is expired'}, status=401)

#                 # Attach user data to the request object
#                 request.user = decoded['user']
#             except jwt.ExpiredSignatureError:
#                 return JsonResponse({'error': 'Token is expired'}, status=401)
#             except jwt.InvalidTokenError:
#                 return JsonResponse({'error': 'Invalid token'}, status=401)

#         return None

#     def token_is_blacklisted(self, token):
#         """
#         Check if token is blacklisted
#         """
#         return cache.get(token) is not None

#     def token_not_expired(self, expiration_time):
#         """
#         Check if token expiration time is in the future
#         """
#         now = datetime.utcnow().replace(tzinfo=utc)
#         return expiration_time > now