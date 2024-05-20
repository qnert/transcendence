from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
import pyotp
import qrcode
import qrcode.image.svg
from typing import Optional

# Create your models here.
class User(AbstractUser):
	name = models.CharField(max_length=255)
	email = models.CharField(max_length=255, unique=True)
	password = models.CharField(max_length=255)
	username = models.CharField(max_length=255, unique=True)
	is_2fa_enabled = models.BooleanField(default=True)
	# completed_2fa = models.BooleanField(default=False)
	
	REQUIRED_FIELDS = []

class UserTwoFactorAuthData(models.Model):
	user = models.OneToOneField(
		settings.AUTH_USER_MODEL,
		related_name='two_factor_auth_data',
		on_delete=models.CASCADE)
	otp_secret = models.CharField(max_length=255, blank=True, null=True)
	