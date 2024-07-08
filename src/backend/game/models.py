from django.db import models
from api.models import UserProfile
from django.utils import timezone
from django.contrib import admin

# Create your models here.
class GameResult(models.Model):
  user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='game_results')
  opponent_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='game_results_opp')
  user_score = models.IntegerField(null=True)
  opponent_score = models.IntegerField(null=True)
  is_win = models.BooleanField(null=True)
  max_rally = models.IntegerField(null=True)
  min_rally = models.IntegerField(null=True)
  average_rally = models.FloatField(null=True)
  date_played = models.DateTimeField(default=timezone.now)

# TODO add boolean for tournament_match?
