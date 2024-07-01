from django.db import models
from django.core.exceptions import ValidationError
from datetime import date
from api.models import UserProfile

MAX_PARTICIPANTS = 4
DEFAULT_GAME_SETTINGS = {
    "ball_speed": 8,
    "max_score": 8,
    "background_color": 0,
    "border_color": 0,
    "ball_color": 0,
    "advanced_mode": False,
    "power_ups": False
}

class Tournament(models.Model):

    name = models.CharField(max_length=50, unique=True)
    state = models.CharField(max_length=10, default='setup')
    created_at = models.DateField(default=date.today)
    created_by = models.ForeignKey(UserProfile, related_name='created_tournaments',
                                   null=True, on_delete=models.CASCADE)
    game_settings = models.JSONField(default=dict)
    # participants (Foreign Key <- TournamentUser)
    # matches (Foreign Key <- TournamentUser)

    class Meta:
        ordering = ['created_at']

    def add_participant(self, user_profile: UserProfile):
        if self.participants.filter(user_profile=user_profile).exists():
            raise ValidationError("User is already a participant!")
        if self.participants.count() >= MAX_PARTICIPANTS:
            raise ValidationError("Maximum number of participants reached!")
        TournamentUser.objects.create(tournament=self, user_profile=user_profile)

    def advance_state(self):
        if self.state == 'setup':
            self.state = 'playing'
        elif self.state == 'playing':
            self.state = 'finished'
        else:
            raise ValidationError("Invalid state transition")
        self.save(update_fields=['state'])

    def create_game(self):
        #TODO implement
        if self.state != 'playing':
            raise ValidationError("Cannot create games in this phase")

    def delete_if_empty(self):
        if self.participants.count() == 0:
            self.delete()

    def get_host(self):
        if self.participants.count() > 0:
            return self.participants.first()
        raise ValidationError("No Users yet!")

    def get_participant_by(self, username):
        if self.participants.filter(user_profile__user__username=username):
            return self.participants.filter(user_profile__user__username=username).first()
        raise ValidationError("User not found!")

    def get_participants_count(self):
        return self.participants.count()

    def get_participants_names(self):
        return [f'{participant.user_profile.display_name}({participant.user_profile.user.username})' for participant in self.participants.all()]

    def get_participants_statuses(self):
        return [participant.is_ready for participant in self.participants.all()]

    def get_participants_names_and_statuses(self):
        statuses = self.get_participants_statuses()
        names = self.get_participants_names()
        participants_list = [{'name': name, 'status': status} for name, status in zip(names, statuses)]
        return participants_list

    def get_participants(self):
        return self.participants.all()

    def get_game_settings(self):
        return self.game_settings

    def get_state(self):
        return self.state

    def remove_participant(self, user_profile: UserProfile):
        participant = self.participants.filter(user_profile=user_profile).first()
        if participant:
            participant.delete()
        else:
            raise ValidationError("User is not a participant!")

    def save(self, *args, **kwargs):
        # New instances should default to state 'setup' and DEFAULT_GAME_SETTINGS
        if not self.pk:
            self.state = 'setup'
            self.game_settings = DEFAULT_GAME_SETTINGS
        super().save(*args, **kwargs)

    def set_game_settings(self, new_game_settings: dict):
        if not new_game_settings or new_game_settings is None:
            raise ValidationError("No Empty Object allowed!")
        for key in new_game_settings:
            if key not in DEFAULT_GAME_SETTINGS:
                raise ValidationError(f"Invalid game setting key: {key}")
            if not isinstance(new_game_settings[key], type(DEFAULT_GAME_SETTINGS[key])):
                raise ValidationError(f"Invalid game setting value type, expected {type(DEFAULT_GAME_SETTINGS[key])}!")
        self.game_settings = new_game_settings
        self.save(update_fields=['game_settings'])

    def __str__(self):
        return self.name

    def toggle_ready_state_by(self, user_profile: UserProfile):
        tournament_user = TournamentUser.objects.filter(tournament=self, user_profile=user_profile).first()
        if not tournament_user:
            raise ValidationError("Toggling state of a user that is not a participant!")
        tournament_user.is_ready = not tournament_user.is_ready
        tournament_user.save()

class TournamentUser(models.Model):

    tournament = models.ForeignKey(Tournament, related_name='participants', on_delete=models.CASCADE)
    user_profile = models.ForeignKey(UserProfile, related_name='tournament_members',
                                    on_delete=models.CASCADE, null=True)
    is_ready = models.BooleanField(default=False)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    goals_scored = models.IntegerField(default=0)
    goals_conceded = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    # matches_home (OneToOneField <- TournamentMatch)
    # matches_away (OneToOneField <- TournamentMatch)

    # makes sure the host is always the first in the participants list
    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f'{self.user_profile.user.username} in {self.tournament.name}'


class TournamentMatch(models.Model):

    tournament = models.ForeignKey(Tournament, related_name='matches', on_delete=models.CASCADE)
    name = models.CharField(max_length=100, unique=True)
    is_finished = models.BooleanField(default=False)
    player_home = models.OneToOneField(TournamentUser, related_name='matches_home', on_delete=models.CASCADE)
    player_away = models.OneToOneField(TournamentUser, related_name='matches_away', on_delete=models.CASCADE)
    goals_home = models.IntegerField(default=0)
    goals_away = models.IntegerField(default=0)

    def __str__(self):
        return f'{self.player_home.user_profile.user.username} versus {self.player_away.user_profile.user.username}'
