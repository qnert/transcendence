from django.db import models
from django.core.exceptions import ValidationError
from datetime import date
from api.models import UserProfile

MAX_PARTICIPANTS = 4


class Tournament(models.Model):


    # TODO declare DEFAULT_SETTINGS here


    name = models.CharField(max_length=50, unique=True)
    # participants (Foreign Key to TournamentUser)
    state = models.CharField(max_length=10, default='setup')
    created_at = models.DateField(default=date.today)
    created_by = models.ForeignKey(UserProfile, related_name='created_tournaments',
                                   null=True, on_delete=models.CASCADE)
    game_settings = models.JSONField(default=dict)

    # TODO implement
    # list of matches
    # match-name could be something like:
        # {forbidden_character}_tournament_{lobby_name}_{game_id}

    class Meta:
        ordering = ['name']

    def add_participant(self, user_profile: UserProfile):
        if self.participants.filter(userprofile=user_profile).exists():
            raise ValidationError("User is already a participant!")
        if self.participants.count() >= MAX_PARTICIPANTS:
            raise ValidationError("Maximum number of participants reached!")
        TournamentUser.objects.create(tournament=self, userprofile=user_profile)

    def advance_state(self):
        if self.state == 'setup':
            self.state = 'playing'
        elif self.state == 'playing':
            self.state = 'finished'
        else:
            raise ValidationError("Invalid state transition")
        self.save(update_fields=['state'])

    def delete_if_empty(self):
        if self.participants.count() == 0:
            self.delete()

    def get_host(self):
        if self.participants.count() > 0:
            return self.participants.first()
        raise ValidationError("No Users yet!")

    def get_participant_count(self):
        return self.participants.count()

    def get_participants(self):
        return [participant.userprofile.user.username for participant in self.participants.all()]

    def get_settings(self):
        return self.game_settings

    def get_state(self):
        return self.state

    def remove_participant(self, user_profile: UserProfile):
        participant = self.participants.filter(userprofile=user_profile).first()
        if participant:
            participant.delete()
        else:
            raise ValidationError("User is not a participant!")

    def save(self, *args, **kwargs):
        # New instance being forced to 'setup'
        if not self.pk:
            self.state = 'setup'
        self.game_settings = {
            "max_score": 8,
            "ball_speed": 8,
            "background_color": 0,
            "border_color": 0,
            "ball_color": 0,
            "advanced_mode": False,
            "power_ups": False
        }
        super().save(*args, **kwargs)

    def set_settings(settings: dict):
        pass
        # TODO implement

    def __str__(self):
        return self.name

class TournamentUser(models.Model):

    tournament = models.ForeignKey(Tournament, related_name='participants', on_delete=models.CASCADE)
    userprofile = models.ForeignKey(UserProfile, related_name='tournament_members',
                                    on_delete=models.CASCADE, null=True)
    is_ready = models.BooleanField(default=False)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    goals_scored = models.IntegerField(default=0)
    goals_conceded = models.IntegerField(default=0)

    def __str__(self):
        return f'{self.userprofile.user.username} in {self.tournament.name}'
