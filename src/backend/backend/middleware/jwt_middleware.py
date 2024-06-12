from rest_framework_simplejwt.views import TokenVerifyView
from rest_framework.response import Response
from rest_framework import status


class JWTMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_view(self, request, view_func, view_args, view_kwargs):
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(' ')[1]
            verify_view = TokenVerifyView.as_view()
            verify_request = request._request
            response = verify_view(verify_request)

            if response.status_code != status.HTTP_200_OK:
                return Response({'error': 'Invalid token'}, status=response.status_code)

        return None