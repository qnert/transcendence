import pyotp
from .models import UserTwoFactorAuthData
from django.core.exceptions import ValidationError


def user_two_factor_auth_data_create(*, user) -> UserTwoFactorAuthData:
	if hasattr(user, 'two_factor_auth_data'):
		raise ValidationError('Can not have more than one 2FA related data')
	two_fatctor_auth_data = UserTwoFactorAuthData.objects.creaet(
		user=user,
		otp_secret=pyotp.random_base32()
	)
	return two_fatctor_auth_data
