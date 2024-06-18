from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
import pyotp
import qrcode
import qrcode.image.svg
from typing import Optional
from django.utils import timezone

# Create your models here.
class User(AbstractUser):
	first_name = models.CharField(max_length=255)
	last_name = models.CharField(max_length=255)
	email = models.CharField(max_length=255, unique=True)
	password = models.CharField(max_length=255)
	access_token = models.CharField(max_length=255, unique=True, null=True)
	refresh_token = models.CharField(max_length=255, unique=True, null=True)
	username = models.CharField(max_length=255, unique=True)
	is_2fa_enabled = models.BooleanField(default=False)
	completed_2fa = models.BooleanField(default=False)
	is_logged_in = models.BooleanField(default=False)
	last_login = models.DateTimeField(null=True, blank=True, default=timezone.now)
	
	REQUIRED_FIELDS = []

class UserTwoFactorAuthData(models.Model):
	user = models.OneToOneField(
		settings.AUTH_USER_MODEL,
		related_name='two_factor_auth_data',
		on_delete=models.CASCADE,
		)
	otp_secret = models.CharField(max_length=255, blank=True, null=True)


class UserProfile(models.Model):
	user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
	display_name = models.CharField(max_length=50, blank=True)
	profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
	profile_picture_url = models.URLField(max_length=5000, blank=True, default='')
	needs_password_set = models.BooleanField(default=True)
	registered = models.BooleanField(default=False)
	is_online = models.BooleanField(default=False)

	# access_token = models.CharField(max_length=255, blank=True, null=True)
	# token_expiration = models.DateTimeField(null=True, blank=True
	def save(self, *args, **kwargs):
		if not self.display_name:
			self.display_name = self.user.username
		super().save(*args, **kwargs)

	def get_profile_picture(self):
		if self.profile_picture:
			return self.profile_picture.url
		return self.profile_picture_url
	


# Friend request table - stores data about the request history
class FriendRequest(models.Model):
    from_user = models.ForeignKey(User, related_name='sent_requests', on_delete=models.CASCADE)
    to_user = models.ForeignKey(User, related_name='received_requests', on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    accepted = models.BooleanField(default=False)

    class Meta:
      unique_together = ('from_user', 'to_user')

    def __str__(self):
      return f"{self.from_user} to {self.to_user} (accepted: {self.accepted})"

# Active Friendship table - stores data about current friendships held by the user
class Friendship(models.Model):
    user1 = models.ForeignKey(User, related_name='friends1', on_delete=models.CASCADE)
    user2 = models.ForeignKey(User, related_name='friends2', on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
      unique_together = ('user1', 'user2')

    def __str__(self):
      return f"{self.user1} is friends with {self.user2}"
