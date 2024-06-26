from django.db import models
from django.core.exceptions import ValidationError
from datetime import date
from api.models import UserProfile

# TODO stats for 1st, 2nd, 3rd and hosting and leaving early in UserProfile
# TODO add change tournament state, with conditions (min amount of players)
# TODO add tournament abort?
# @note prob want something like a list of game sessions/ids that can be shown to the participants

MAX_PARTICIPANTS = 4


class Tournament(models.Model):

    created_at = models.DateField(default=date.today)
    name = models.CharField(max_length=50, unique=True)
    participants = models.ManyToManyField(UserProfile, related_name='active_tournament')
    created_by = models.ForeignKey(UserProfile, related_name='created_tournaments', null=True, on_delete=models.CASCADE)
    STATE_CHOICES = [
        ('setup', 'Setup'),
        ('playing', 'Playing'),
        ('finished', 'Finished'),
    ]
    state = models.CharField(
        max_length=10, choices=STATE_CHOICES, default='setup')

    class Meta:
        ordering = ['name']

    def __str__(self):
        names = [participant.user.username for participant in self.participants.all()]
        return (f'Tournament name: {self.name}\nHost: {self.created_by.display_name}\nUsers: {names}')

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    def add_participant(self, user_profile: UserProfile):
        if user_profile is not self.created_by and user_profile in self.participants.all():
            raise ValidationError("User already in tournament!")
        if self.participants.count() >= MAX_PARTICIPANTS:
            raise ValidationError("Maximum amount of participants reached!")
        self.participants.add(user_profile)

    def remove_participant(self, user_profile: UserProfile):
        if user_profile in self.participants.all():
            self.participants.remove(user_profile)
        else:
            raise ValidationError("Unnecessary removal of participant!")
        # TODO needs condition for if the tournament is finished (should it persist vs should just the result persist)
        if self.participants.count() == 0:
            self.delete()

    def get_participants(self):
        obj = []
        for participant in self.participants.all():
            obj.append(participant.display_name)
        return obj

    # def toggle_state():
    # toggle setup -> playing -> finished
