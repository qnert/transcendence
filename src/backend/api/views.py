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
from .decorators import *
from django.contrib.auth import authenticate, login
from django.contrib.auth import logout
from django.utils.html import escape
from django.shortcuts import redirect, render
import io
import json
from io import BytesIO
import qrcode
import base64
import pyotp
from django.contrib.auth.decorators import login_required
import os
from dotenv import load_dotenv
from urllib.parse import urlencode
import requests
from django.urls import reverse
import random
import string

REDIRECT_URI = "http://0.0.0.0:8000/callback/"
UID = "u-s4t2ud-eb4d25721512a1e2da0dcdd30cf8690c975996bfe99fea803547dfdde2556456"
SECRET = "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"
code = ''
state = ''

def generate_random_string():
    length = random.randint(16, 32)
    characters = string.ascii_letters + string.digits + string.punctuation
    return ''.join(random.choice(characters) for _ in range(length))

random_string = generate_random_string()
def redirect_to_login(request):
	params = {
		'client_id': UID,
		'redirect_uri': REDIRECT_URI,
		'response_type': 'code',
		'scope': 'public',
		'state': random_string,
	}
	url = f"https://api.intra.42.fr/oauth/authorize?{urlencode(params)}"
	return JsonResponse({'url': url}, status=200)


def auth_callback(request):
	code = request.GET.get('code')
	state = request.GET.get('state')
	# if not state or state != state:
	# 	return JsonResponse({'error': 'Unauthoriazed access detected'}, status=401)
	print("Code1: ", code)
	request.session['auth_code'] = code
	print("Code_session: ", request.session['auth_code'])
	return redirect('set_passwd')
	

def fetch_user_data(request):
	code = request.session.get('auth_code')
	print("CODE INCOMING", code)
	token_response = requests.post('https://api.intra.42.fr/oauth/token', data={
        'grant_type': 'authorization_code',
        'client_id': UID,
        'client_secret': SECRET,
        'code': code,
        'redirect_uri': REDIRECT_URI,
    })
	if token_response.status_code != 200:
		return JsonResponse({'error': 'Unable to retrie the access token'}, status=400)
	token_data = token_response.json()
	access_token = token_data.get('access_token')
	user_info = get_user_data(access_token)
	if not user_info:
		return JsonResponse({'error': 'could not fetch user data'}, status=401)
	username = user_info['login']
	email = user_info.get('email', '')
	first_name = user_info.get('first_name', '')
	last_name = user_info.get('last_name', '')
	profile_picture_url = user_info.get('image', {}).get('version', {}).get('large', '')
	user, created = User.objects.get_or_create(username=username, defaults={
		'username': username,
		'first_name': first_name,
		'last_name': last_name,
		'email': email,
		'password': "123"
	})

	if created:
		return JsonResponse({'error': 'User already registerd'}, status=400)

	user_profile, created = UserProfile.objects.get_or_create(user=user, defaults={
		'profile_picture_url': profile_picture_url,
		'needs_password_set': True,
		'registered': True,
		'display_name': username,
	})
	return JsonResponse({'success': 'success'}, status=200)

def get_user_data(access_token):
    headers = {'Authorization': f'Bearer {access_token}'}
    response = requests.get('https://api.intra.42.fr/v2/me', headers=headers)
    if response.status_code == 200:
        return response.json()
    return {}


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
			user.completed_2fa = True
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
			token = RefreshToken(refresh_token)
			token.blacklist()
			request.user.completed_2fa = False
			return JsonResponse({'logout': True})
	
		except (TokenError, InvalidToken) as e:
			return JsonResponse({'error': 'Invalid or expired token'}, status=400)
	else:
		return JsonResponse({'error': 'Refresh token not provided'}, status=400)	


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