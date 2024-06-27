from django.contrib import admin
from .models import Tournament


@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    list_display = ('name', 'host', 'get_participants', 'state')
    search_fields = ('name', 'created_by__user__username')

    def host(self, obj):
        return obj.created_by.user.username

    def get_participants(self, obj):
        return ", ".join([participant.user.username for participant in obj.participants.all()])

    get_participants.short_description = 'Participants'
