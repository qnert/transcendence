from rest_framework.views import APIView
from .serializers import *
from django.contrib.auth.hashers import check_password
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
import jwt, datetime
from django.contrib.auth.models import User
from rest_framework import status
from api.models import User
from django.http import JsonResponse
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate, login
from django.contrib.auth import logout
from django.utils.html import escape
from django_otp import devices_for_user
from django_otp.plugins.otp_totp.models import TOTPDevice
import pyotp
import qrcode
import io
import json
import base64
from django.contrib.auth.decorators import login_required



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