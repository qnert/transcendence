from django.db import models
from django.core.exceptions import ValidationError
from datetime import date
from api.models import UserProfile
from game.models import GameResult
import json

MAX_PARTICIPANTS = 4  # TODO change back after dev
DEFAULT_GAME_SETTINGS = {
    "ball_speed": '8',
    "max_score": '8',
    "background_color": '#ffffff',
    "border_color": '#0000ff',
    "ball_color": '#0000ff',
    "advanced_mode": False,
    "power_ups": False
}


class TournamentUser(models.Model):

    tournament = models.ForeignKey('Tournament', related_name='participants', on_delete=models.CASCADE)
    user_profile = models.ForeignKey(UserProfile, related_name='tournament_members',
                                     on_delete=models.CASCADE, null=True)
    is_ready = models.BooleanField(default=False)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    goals_scored = models.IntegerField(default=0)
    goals_conceded = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    # matches_home (ForeignKey <- TournamentMatch)
    # matches_away (ForeignKey <- TournamentMatch)

    # makes sure the host is always the first in the participants list
    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f'{self.user_profile.display_name}({self.user_profile.user.username})'


class TournamentMatch(models.Model):

    tournament = models.ForeignKey('Tournament', related_name='matches', on_delete=models.CASCADE)
    name = models.CharField(max_length=100, unique=True)
    is_finished = models.BooleanField(default=False)
    player_home = models.ForeignKey(TournamentUser, related_name='matches_home', on_delete=models.CASCADE)
    player_away = models.ForeignKey(TournamentUser, related_name='matches_away', on_delete=models.CASCADE)
    goals_home = models.IntegerField(default=0)
    goals_away = models.IntegerField(default=0)

    def __str__(self):
        obj = {}
        for field in self._meta.fields:
            field_name = field.name
            field_value = getattr(self, field_name)
            obj[field_name] = field_value
        return json.dumps(obj, default=str)

    def is_match_participant(self, participant: TournamentUser):
        if self.player_home == participant or self.player_away == participant:
            return True
        return False

    def set_finished(self):
        self.is_finished = True
        self.save()

    def set_results_and_finished(self, game_result: GameResult):
        if self.is_finished:
            raise ValidationError("Game is already finished!")
        if not self.tournament.has_participant(user_profile=game_result.user_profile) or not self.tournament.has_participant(user_profile=game_result.opponent_profile):
            raise ValidationError("Users are not part of Tournament!")
        if not self.player_home.user_profile == game_result.user_profile and not self.player_home.user_profile == game_result.opponent_profile:
            raise ValidationError("Wrong Users in Game Result!")
        if not self.player_away.user_profile == game_result.user_profile and not self.player_away.user_profile == game_result.opponent_profile:
            raise ValidationError("Wrong Users in Game Result!")
        if self.player_home.user_profile == game_result.user_profile:
            self.goals_home = game_result.user_score
            self.goals_away = game_result.opponent_score
        else:
            self.goals_home = game_result.opponent_score
            self.goals_away = game_result.user_score
        self.set_finished()

class Tournament(models.Model):

    name = models.CharField(max_length=50, unique=True)
    state = models.CharField(max_length=10, default='setup')
    created_at = models.DateField(default=date.today)
    created_by = models.ForeignKey(UserProfile, related_name='created_tournaments',
                                   null=True, on_delete=models.CASCADE)
    game_settings = models.JSONField(default=dict)
    # participants (Foreign Key <- TournamentUser)
    # matches (Foreign Key <- TournamentMatch)

    class Meta:
        ordering = ['created_at']

    def are_participants_ready(self):
        if self.participants.count() < MAX_PARTICIPANTS:
            return False
        for participant in self.participants.all():
            if not participant.is_ready:
                return False
        return True

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

    def get_matches_list(self):
        return self.matches.all()

    def create_matches_list(self):
        if self.matches.exists():
            raise ValidationError("Matches have already been created")
        # Hint:
        # Tournament should use advance_state() method (all participants have to be ready)
        # and create all matches so they can be displayed in Frontend after that
        if self.state != 'playing':
            raise ValidationError("Matches can only be created during the setup phase.")

        participants = list(self.participants.all())
        num_participants = len(participants)

        if num_participants < 2:
            raise ValidationError("Not enough participants to create matches.")

        # Hint:
        # appends a Dummy (None) if the num_participants is not even
        # Dummy has to be handled as an auto win (bye week)
        if num_participants % 2 == 1:
            participants.append(None)

        # Hint:
        # This algorithm creates matches based on the amount of participants
        # there have to be (participants - 1) amount of rounds so everyone plays against everyonce exactly once
        rounds = num_participants - 1
        matches = []
        for round_num in range(rounds):
            for i in range(num_participants // 2):
                # Hint:
                # We only have to loop until the middle of the List, because at that point
                # everyone has gotten a matchup. The algorithm moves simultaneously from
                # start --> middle and middle <-- end
                player1 = participants[i]
                player2 = participants[num_participants - 1 - i]

                if player1 is not None and player2 is not None:
                    # TODO match_name just an ID? can display player names in Table
                    match_name = f'{self.name}_{player1.user_profile.user.username}_vs_{player2.user_profile.user.username}'
                    match = TournamentMatch(
                        tournament=self,
                        player_home=player1,
                        player_away=player2,
                        name=match_name
                    )
                    matches.append(match)

            # Hint:
            # This will shift the participants to the end of the list
            # the last one will get the second position in the list
            # [ A - B - C - D ] --> [ A - D - B - C ]
            participants = [participants[0]] + [participants[-1]] + participants[1:-1]

        # Hint:
        # bulk_create saves database operations, by creating all Matches at once
        TournamentMatch.objects.bulk_create(matches)

    def has_matches_list(self):
        return self.matches.exists()

    def has_participant(self, user_profile: UserProfile):
        for participant in self.participants.all():
            if participant.user_profile == user_profile:
                return True
        return False

    def delete_if_empty(self):
        if self.participants.count() == 0:
            self.delete()

    def get_host(self):
        if self.participants.count() > 0:
            return self.participants.first()
        raise ValidationError("No Users yet!")
    
    def get_next_match(self, participant: TournamentUser):
        matches = self.get_matches_list()
        if matches.count() == 0:
            raise ValidationError("No matches in tournament!")
        for match in matches:
            if not match.is_finished and match.is_match_participant(participant):
                return match
        return None

    def get_participant_by(self, user_profile=None, username=None):
        if isinstance(user_profile, UserProfile):
            participant = self.participants.filter(user_profile=user_profile).first()
        elif isinstance(username, str):
            participant = self.participants.filter(user_profile__user__username=username).first()
        else:
            raise ValidationError("No user profile or username provided!")
        if not participant:
            raise ValidationError("User not found!")
        return participant

    def get_participants_count(self):
        return self.participants.count()

    def get_participants_names(self):
        # Hint:
        # If formatting of name would be changed, also change in consumer class (build_nickname())
        obj = []
        for participant in self.participants.all():
            if self.is_host(user_profile=participant.user_profile):
                obj.append(f'👑 {participant.user_profile.display_name}({participant.user_profile.user.username})')
            else:
                obj.append(f'🐸 {participant.user_profile.display_name}({participant.user_profile.user.username})')
        return obj

    def get_participants_statuses(self):
        return [participant.is_ready for participant in self.participants.all()]

    def get_participants_names_and_statuses(self):
        statuses = self.get_participants_statuses()
        names = self.get_participants_names()
        participants_list = [{'name': name, 'status': status} for name, status in zip(names, statuses)]
        return participants_list

    def get_participants_for_standings(self):
        names = self.get_participants_names()
        participants = self.get_participants()

        for participant, name in zip(participants, names):
            participant.name = name

        # sort by amount of wins
        participants = sorted(participants, key=lambda p: p.wins, reverse=True)
        return participants

    def get_participants(self):
        return self.participants.all()

    def get_game_settings(self):
        return self.game_settings

    def get_state(self):
        return self.state

    def is_host(self, user_profile=None, username=None):
        if isinstance(user_profile, UserProfile):
            return self.get_participant_by(user_profile=user_profile) == self.get_host()
        elif isinstance(username, str):
            return self.get_participant_by(username=username) == self.get_host()
        raise ValidationError("Wrong parameters given!")

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
