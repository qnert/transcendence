from django.db import models
from api.models import UserProfile
from django.utils import timezone

# Create your models here.
class GameResult(models.Model):
  user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='game_results')
  opponent_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='game_results_opp')
  user_score = models.IntegerField()
  opponent_score = models.IntegerField()
  is_win = models.BooleanField()
  date_played = models.DateTimeField(default=timezone.now)
