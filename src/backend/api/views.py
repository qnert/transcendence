from rest_framework.views import APIView
from .serializers import *
from django.contrib.auth.hashers import check_password
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
import jwt
import datetime
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
from loguru import logger
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
from .serializers import *
from django.core.exceptions import ObjectDoesNotExist
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.db import transaction
from django.shortcuts import render, get_object_or_404
from api.models import UserProfile, Friendship, FriendRequest
from chat.models import Message, BlockedUser
from django.conf import settings


REDIRECT_URI = "http://0.0.0.0:8000/callback/"
UID = "u-s4t2ud-eb4d25721512a1e2da0dcdd30cf8690c975996bfe99fea803547dfdde2556456"
SECRET = "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"
code = ''
state = ''


def login_status(request):
	if request.method == "GET":
		loginStatus = request.user.is_logged_in
		return JsonResponse({'loginStatus': loginStatus}, status=200)
	else:
		return JsonResponse({'error': 'Method not allowed'}, status=405)

def activate_two_FA(request):
    if request.method == "POST":
        try:
            user = request.user
            user.is_2fa_enabled = True
            user.save()
            return JsonResponse({'message': 'success'})
        except User.DoesNotExist:
            return JsonResponse({'message': 'failed'})
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


def deactivate_two_FA(request):
    if request.method == "POST":
        try:
            user = request.user
            user.is_2fa_enabled = False
            user.save()
            return JsonResponse({'message': 'success'})
        except User.DoesNotExist:
            return JsonResponse({'message': 'failed'})
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


def check_login_status(request):
    if request.method == "GET":
        if request.user.is_authenticated:
            login_status = request.user.is_logged_in
            return JsonResponse({'status': login_status})
        else:
            return JsonResponse({'error': 'user is not logged in'})
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


def friends_list(request):
    user_profile = UserProfile.objects.get(user=request.user)
    user_id = user_profile.user_id

    # Get friends' IDs
    friend_ids_query = Friendship.objects.filter(
        models.Q(user1_id=user_id) | models.Q(user2_id=user_id))
    friend_ids = set()

    for friendship in friend_ids_query:
        if friendship.user1_id != user_id:
            friend_ids.add(friendship.user1_id)
        else:
            friend_ids.add(friendship.user2_id)

    # Retrieve friends' data
    friends_data = UserProfile.objects.filter(user_id__in=friend_ids).exclude(
        user_id=user_id).values('display_name', 'profile_picture_url', 'user_id', 'is_online')

    response_data = []
    for friend in friends_data:
        is_blocked = BlockedUser.objects.filter(
            blocker_id=user_id, blocked_id=friend['user_id']).exists()
        blocked_by = BlockedUser.objects.filter(
            blocker_id=friend['user_id'], blocked_id=user_id).exists()
        friend_data = {
            'display_name': friend['display_name'],
            'profile_picture_url': friend['profile_picture_url'],
            'user_id': friend['user_id'],
            'is_blocked': is_blocked,
            'blocked_by': blocked_by,
            'is_online': friend['is_online']
        }
        response_data.append(friend_data)
    return JsonResponse(response_data, safe=False)


def friends_online_status(request):
    user = request.user
    # Get all friends where the user is either user1 or user2
    friends_user1 = Friendship.objects.filter(
        user1=user).values_list('user2', flat=True)
    friends_user2 = Friendship.objects.filter(
        user2=user).values_list('user1', flat=True)

    # Combine the two sets of friend IDs
    friend_ids = list(friends_user1) + list(friends_user2)

    # Get the User objects of these friend IDs
    friends = UserProfile.objects.filter(id__in=friend_ids)
    online_status = {}

    for friend in friends:
        online_status[friend.id] = friend.is_online

    return JsonResponse(online_status)


def pending_friend_requests(request):
    pending_requests = FriendRequest.objects.filter(
        to_user=request.user, accepted=False)
    requests_data = [
        {
            "id": req.id,
            "from_user_id": req.from_user.id,
            "from_user_name": req.from_user.username,
            "profile_picture_url": req.from_user.profile.get_profile_picture(),
        }
        for req in pending_requests
    ]
    return JsonResponse(requests_data, safe=False)


def get_chat_messages(request, friend_id):
    try:
        current_user = request.user
        friend = User.objects.get(id=friend_id)

        if BlockedUser.objects.filter(blocker=friend, blocked=current_user).exists():
            return JsonResponse({'error': 'You are blocked by this user and cannot view messages.'}, status=403)
        # Fetch messages between the current user and the specified friend
        messages = Message.objects.filter(
            (models.Q(sender=current_user) & models.Q(recipient=friend)) |
            (models.Q(sender=friend) & models.Q(recipient=current_user))
        ).order_by('timestamp')
        # Prepare the data to be returned as JSON
        messages_data = [
            {
                'sender': message.sender.username,
                'content': message.content,
                'timestamp': message.timestamp.strftime('%Y-%m-%d %H:%M:%S')
            }
            for message in messages
        ]
        return JsonResponse({'messages': messages_data}, status=200)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Friend not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def block_user(request, user_id):
    if request.method == "POST":
        user_to_block = get_object_or_404(User, id=user_id)
        BlockedUser.objects.get_or_create(
            blocker=request.user, blocked=user_to_block)
        return JsonResponse({'status': 'success', 'message': f'You have blocked {user_to_block.username}'})
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


def unblock_user(request, user_id):
    if request.method == "POST":
        user_to_unblock = get_object_or_404(User, id=user_id)
        BlockedUser.objects.filter(
            blocker=request.user, blocked=user_to_unblock).delete()
        return JsonResponse({'status': 'success', 'message': f'You have unblocked {user_to_unblock.username}'})
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


def search_friends(request):
    if request.method == "GET":
        query = request.GET.get('q', '')
        if query:
            users = UserProfile.objects.filter(
                display_name__icontains=query).exclude(user=request.user)
            results = [{
                'id': user.user.id,
                'display_name': user.display_name,
                'profile_picture_url': user.get_profile_picture(),
            } for user in users]
            return JsonResponse({'results': results})
        return JsonResponse({'results': []})
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


def send_friend_request(request):
    if request.method == "POST":
        data = json.loads(request.body)
        user_id = data.get('user_id')
        to_user = get_object_or_404(User, id=user_id)

        if not FriendRequest.objects.filter(from_user=request.user, to_user=to_user).exists():
            FriendRequest.objects.create(
                from_user=request.user, to_user=to_user)

        # Notify the recipient via WebSocket
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"user_{to_user.id}",
                {
                    "type": "friend_request_notification",
                    "message": f"{request.user.username} sent you a friend request!",
                    "friend_name": request.user.username,
                    "friend_id": request.user.id
                }
            )

            return JsonResponse({'message': 'Friend request sent successfully'})
        return JsonResponse({'message': 'Friend request already sent'}, status=400)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


def delete_friend(request):
    if request.method == "POST":
        data = json.loads(request.body)
        friend_id = data.get('friend_id')

        try:
            friend = User.objects.get(id=friend_id)
            Friendship.objects.filter(
                user1=request.user, user2=friend).delete()
            Friendship.objects.filter(
                user1=friend, user2=request.user).delete()
            FriendRequest.objects.filter(
                from_user=request.user, to_user=friend).delete()
            FriendRequest.objects.filter(
                from_user=friend, to_user=request.user).delete()
            return JsonResponse({'success': True})
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'User not found'})
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


def get_username(request):
    if request.method == "GET":
        username = request.user.username
        return JsonResponse({'username': username})
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


def save_changes(request):
    if request.method == "PUT":
        user = request.user
        data = json.loads(request.body)
        display_name = data.get('display_name')
        picture_url = data.get('picture_url')
        print("picture_url:", picture_url)
        print("displa_name:", display_name)
        profile = user.profile
        if display_name is not None:
            profile.display_name = display_name
        if picture_url is not None:
            profile.profile_picture_url = picture_url
        profile.save()
        return JsonResponse({'message': 'Changes saved successfully'})
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


def set_new_passwd(request):
    if request.method == "POST":
        user = request.user
        data = json.loads(request.body)
        old_passwd = data.get('old_passwd')
        if not authenticate(username=user.username, password=old_passwd):
            return JsonResponse({'error': 'Incorrect old Password'}, status=400)
        new_passwd = data.get('password')
        print(request.user.username)
        print(new_passwd)
        user.set_password(new_passwd)
        user.save()
        return JsonResponse({'message': 'New password set successfully'})
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


def get_profile(request):
    if request.method == "GET":
        user = request.user
        profile_picture = user.profile.profile_picture_url
        profile_data = {
            'username': user.username,
            'email': user.email,
            'profile_picture': profile_picture if profile_picture else None,
            'picture_url': user.profile.profile_picture_url,
            'display_name': user.profile.display_name
        }
        return JsonResponse(profile_data)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


def check_passwd(request):
    if request.method == "GET":
        username = request.session.get('username')
        value = User.objects.filter(username=username, condition=True).exists()
        return JsonResponse({'value': value})
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


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
    request.session['auth_code'] = code
    return redirect('set_passwd')


def SetPasswd(request):
    # password security for example at least 8 characters long
    if request.method == "POST":
        username = request.session.get('username')
        data = json.loads(request.body)
        password = data.get('password')
        user = User.objects.get(username=username)
        if user is not None:
            user.set_password(password)
            if hasattr(user, 'profile'):
                user.profile.needs_password_set = False
                user.profile.save()
            user.save()
            if 'username' in request.session:
                del request.session['username']
            return JsonResponse({'success': 'User registered successfully'}, status=200)
        else:
            return JsonResponse({'error': 'User does not exist'}, status=404)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


def fetch_user_data(request):
    if request.method == "GET":
        code = request.session.get('auth_code')
        token_response = requests.post('https://api.intra.42.fr/oauth/token', data={
            'grant_type': 'authorization_code',
            'client_id': UID,
            'client_secret': SECRET,
            'code': code,
            'redirect_uri': REDIRECT_URI,
        })
        if 'auth_code' in request.session:
            del request.session['auth_code']

        if token_response.status_code != 200:
            return JsonResponse({'error': 'Unable to retrie the access token'}, status=500)

        token_data = token_response.json()
        access_token = token_data.get('access_token')
        # maybe test if access_token is there?
        user_info = get_user_data(access_token)
        if not user_info:
            return JsonResponse({'error': 'could not fetch user data'}, status=401)

        username = user_info['login']
        email = user_info.get('email', '')
        first_name = user_info.get('first_name', '')
        last_name = user_info.get('last_name', '')
        profile_picture_url = user_info['image']['versions']['large']
        request.session['username'] = username
        try:
            user = User.objects.get(username=username)
            if user is not None:
                if hasattr(user, 'profile'):
                    user_profile = user.profile
                    if not user_profile.needs_password_set:
                        return JsonResponse({'error': 'User already registered'}, status=400)
                    else:
                        return JsonResponse({'error': 'Password needs to be set'}, status=403)

        except User.DoesNotExist:
            user = User.objects.create(username=username,
                                       first_name=first_name,
                                       last_name=last_name,
                                       email=email,
                                       )

        user_profile, profile_created = UserProfile.objects.get_or_create(user=user,
                                                                          profile_picture_url=profile_picture_url,
                                                                          needs_password_set=True,
                                                                          registered=True,
                                                                          display_name=username,
                                                                          )
        return JsonResponse({'success': 'success'}, status=200)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


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
            return JsonResponse({'status': is_2fa_enabled})
        else:
            return JsonResponse({'error': 'User is not authenticated'})
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


def Update_2FA_Status(request):
    if request.method == "POST":
        user = request.user
        data = json.loads(request.body)
        new_2fa_status = data.get('enable')
        user.is_2fa_enabled = new_2fa_status
        user.save()
        return JsonResponse({'success': True})

    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


def Validate_OTP(request):
    if request.method == "POST":
        user = request.user
        data = json.loads(request.body)
        otp = data.get('otp')
        user_2fa_data, created = UserTwoFactorAuthData.objects.get_or_create(
            user=user)
        if (user_2fa_data):
            totp = pyotp.TOTP(user_2fa_data.otp_secret)
            is_valid = totp.verify(otp)
            if is_valid:
                user.completed_2fa = True
                return JsonResponse({'valid': True})
            return JsonResponse({'valid': False}, status=200)
        else:
            return JsonResponse({'error': '2FA is not set up for this user'}, status=405)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


def Setup_2FA(request):
    if request.method == "POST":
        user = request.user
        secret_key = pyotp.random_base32()
        otp_auth_url = pyotp.totp.TOTP(secret_key).provisioning_uri(
            user.username, issuer_name="Transcendence")
        user_2fa_data, created = UserTwoFactorAuthData.objects.get_or_create(
            user=user)
        user_2fa_data.otp_secret = secret_key
        user_2fa_data.save()
        qr = qrcode.make(otp_auth_url)
        buffered = BytesIO()
        qr.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        return JsonResponse({'qr_code': img_str})
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


def LogoutView(request):
    if request.method == "POST":
        body = json.loads(request.body)
        refresh_token = body.get("refresh_token")
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
                request.user.completed_2fa = False
                request.user.is_logged_in = False
                request.user.save()
                return JsonResponse({'logout': True})

            except (TokenError, InvalidToken) as e:
                return JsonResponse({'error': 'Invalid or expired token'}, status=400)
        else:
            return JsonResponse({'error': 'Refresh token not provided'}, status=400)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)

# add that the user needs to set a password, if not set, then he gets redirected to set_passwd


def LoginView(request):
    if request.method == "POST":
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            user.is_logged_in = True
            user.save()
            return JsonResponse({'message': 'successful'}, status=200)
        else:
            return JsonResponse({'error': 'Invalid credentials'}, status=401)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


class RegisterView(APIView):
    def post(self, request):
        email = request.data.get('email')
        username = request.data.get('username')
        password = request.data.get('password')

        if User.objects.filter(email=email).exists():
            return JsonResponse({'error': 'User with this email already exists.'}, status=450)
        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': 'User with this username already exists.'}, status=410)
        user = User.objects.create_user(
            username=username, email=email, password=password)
        return JsonResponse({'success': 'User registered successfully'}, status=201)


def get_user_id(request):
    if request.method == "GET":
        id = request.user.id
        return JsonResponse({'id': id})
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)
