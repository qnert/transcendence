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
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

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



def Get_2FA_Status(request):
	if request.method == "GET":
		user = request.user
		if user.is_authenticated:
			is_2fa_enabled = user.is_2fa_enabled
			return JsonResponse({'enable': is_2fa_enabled})
	else:
		return JsonResponse({'error': 'Method not allowed'}, status=405)

def Update_2FA_Status(request):
	if request.method == "PUT":
		user = request.user
		data = json.loads(request.body)
		new_2fa_status = data.get('is_2fa_enabled')
		user.is_2fa_enabled = new_2fa_status
		user.save()
		return JsonResponse({'success': True})
	
	else:
		return JsonResponse({'error': 'Method not allowed'}, status=405)

def Validate_OTP(request):
	user = request.user
	data = json.loads(request.body)
	otp = data.get('otp')
	user_2fa_data, created = UserTwoFactorAuthData.objects.get_or_create(user=user)
	if (user_2fa_data):
		totp = pyotp.TOTP(user_2fa_data.otp_secret)
		is_valid = totp.verify(otp)
		if is_valid:
			return JsonResponse({'valid': True})
		return JsonResponse({'valid': False}, status=200)
	else:
		return JsonResponse({'error': '2FA is not set up for this user'}, status=405)

def Setup_2FA(request):
	user = request.user
	secret_key = pyotp.random_base32()
	otp_auth_url = pyotp.totp.TOTP(secret_key).provisioning_uri(user.username, issuer_name="Transcendence")
	user_2fa_data, created = UserTwoFactorAuthData.objects.get_or_create(user=user)
	user_2fa_data.otp_secret = secret_key
	user_2fa_data.save()
	qr = qrcode.make(otp_auth_url)
	buffered = BytesIO()
	qr.save(buffered, format="PNG")
	img_str = base64.b64encode(buffered.getvalue()).decode()
	return JsonResponse({'qr_code': img_str})


def LogoutView(request):		
	body = json.loads(request.body)
	refresh_token = body.get("refresh_token")
	if refresh_token:
		try:
			if refresh_token is None:
				return JsonResponse({'error': 'Refresh token not provided'}, status=400)	
			token = RefreshToken(refresh_token)
			token.blacklist()
			(request)
			return JsonResponse({'logout': True})
	
		except (TokenError, InvalidToken) as e:
			return JsonResponse({'error': 'Invalid or expired token'}, status=400)
	else:
		return JsonResponse({'error': 'User was not logged in'}, status=400)


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