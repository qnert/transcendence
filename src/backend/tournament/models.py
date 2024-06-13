from django.db import models
from django.core.exceptions import ValidationError
from datetime import date
from api.models import UserProfile

# TODO stats for 1st, 2nd, 3rd and hosting and leaving early in UserProfile
# TODO add tournament state
# TODO add change tournament state, with conditions (min amount of players)
# TODO add tournament abort?

# @note prob want something like a list of game sessions/ids that can be shown to the participants
# @note prob want something like tournament channel when joining
# @note mb a ForeignKey on User side would make more sense
# @note not sure if i want an exception
# @note remove created_by?


class Tournament(models.Model):
    created_at = models.DateField(default=date.today)
    name = models.CharField(max_length=50, unique=True)
    participants = models.ManyToManyField(UserProfile, related_name='active_tournament')
    created_by = models.ForeignKey(UserProfile, related_name='created_tournaments',
                                   null=True, on_delete=models.CASCADE)

    def __str__(self):
        names = [participant.user.username for participant in self.participants.all()]
        return (f'Tournament name: {self.name}\nHost: {self.created_by.display_name}\nUsers: {names}')

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.participants.exists() and self.created_by is not None:
            self.participants.add(self.created_by)

    def add_participant(self, user_profile: UserProfile):
        if user_profile in self.participants.all():
            return
        if self.participants.count() < 8:
            self.participants.add(user_profile)
        else:
            raise ValidationError("Maximum amount of participants reached!")

    def remove_participant(self, user_profile: UserProfile):
        if user_profile in self.participants.all():
            self.participants.remove(user_profile)
        else:
            raise ValidationError("Unnecessary removal of participant!")
