from django.db import models
from core.models import UserProfile
from django.core.exceptions import ValidationError
from datetime import date


# TODO stats for 1st, 2nd, 3rd and hosting and leaving early in UserProfile
class Tournament(models.Model):
    created_at = models.DateField(default=date.today)
    name = models.CharField(max_length=50)
    # @note mb a ForeignKey on User side would make more sense
    participants = models.ManyToManyField(UserProfile, related_name='active_tournament')
    created_by = models.ForeignKey(UserProfile, related_name='created_tournaments',
                                   null=True, on_delete=models.CASCADE)
    # @note prob want something like a list of game sessions/ids that can be shown to the participants
    # @note prob want something like tournament channel when joining

    def __str__(self):
        names = [participant.user.username for participant in self.participants.all()]
        return (f'Tournament name: {self.name}\nHost: {self.created_by}\nUsers: {names}')

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
        # @note not sure if i want an exception

    def remove_participant(self, user_profile: UserProfile):
        if user_profile in self.participants.all():
            # @note remove created_by?
            self.participants.remove(user_profile)
        else:
            raise ValidationError("Unnecessary removal of participant!")
        # @note exception needed?
