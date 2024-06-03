from django.db import models

# Create your models here.
from django.db import models
from core.models import User, Friendship

# Create your models here.
class Message(models.Model):
    sender = models.ForeignKey(User, related_name='sent_messages', on_delete=models.CASCADE)
    recipient = models.ForeignKey(User, related_name='received_messages', on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    friendship = models.ForeignKey(Friendship, related_name='messages', on_delete=models.CASCADE)

    class Meta:
        ordering = ('timestamp',)

class BlockedUser(models.Model):
    blocker = models.ForeignKey(User, related_name='blocker', on_delete=models.CASCADE)
    blocked = models.ForeignKey(User, related_name='blocked', on_delete=models.CASCADE)

    class Meta:
        unique_together = ('blocker', 'blocked')
