from rest_framework.views import APIView
from .serializers import *
from django.contrib.auth.hashers import check_password
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
import jwt, datetime
from django.contrib.auth.models import User
from rest_framework import status
from .models import *
from django.http import JsonResponse
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate, login
from django.contrib.auth import logout
from django.utils.html import escape
import io
import json
from io import BytesIO
import qrcode
import base64
import pyotp
from django.contrib.auth.decorators import login_required
from .services import user_two_factor_auth_data_create


def Setup_2FA(request):
	user = request.user
	secret_key = pyotp.random_base32()
	print(f"Generated Secret Key: {secret_key}")
	otp_auth_url = pyotp.totp.TOTP(secret_key).provisioning_uri(user.username, issuer_name="Transcendence")
	user_profile, created = UserTwoFactorAuthData.objects.get_or_create(user=user)
	user_profile.otp_secret = secret_key
	user_profile.save()
	qr = qrcode.make(otp_auth_url)
	buffered = BytesIO()
	qr.save(buffered, format="PNG")
	img_str = base64.b64encode(buffered.getvalue()).decode()
	return JsonResponse({'qr_code': img_str})


class LogoutView(APIView):
	permission_classes = (IsAuthenticated)
	def post(self, request):
		try:
			refresh_token = request.data["refresh_token"]
			token = RefreshToken(refresh_token)
			token.blacklist()
			return Response(status=status.HTTP_205_RESET_CONTENT)
		except Exception as e:
			return Response(status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
	def post(self, request):
		username = request.data.get('username')
		password = request.data.get('password')
		user = authenticate(request, username=username, password=password)
		if user is not None:
			login(request ,user)
			return JsonResponse({'message': 'successful'}, status=200)
		else:
			return JsonResponse({'error': 'Invalid credentials'}, status=401)

class RegisterView(APIView):
	def post(self, request):
		email = request.data.get('email')
		username = request.data.get('username')
		password = request.data.get('password')

		if User.objects.filter(email=email).exists():
			return JsonResponse({'error': 'User with this email already exists.'}, status=450)
		if User.objects.filter(username=username).exists():
			return JsonResponse({'error': 'User with this username already exists.'}, status=410)
		user = User.objects.create_user(username=username, email=email, password=password)
		return JsonResponse({'success': 'User registered successfully'}, status=201)