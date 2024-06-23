from django.contrib import admin
from .models import Tournament


# This will allow /admin to interact with Tournament models in the DB
@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_by', 'get_participants', 'state')
    search_fields = ('name', 'created_by__user__username')

    def get_participants(self, obj):
        return ", ".join([participant.user.username for participant in obj.participants.all()])

    get_participants.short_description = 'Participants'
