from django.contrib import admin
from .models import Tournament


@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    list_display = ('name', 'host', 'participants', 'state')
    search_fields = ('name', 'created_by__user__username')

    def participants(self, obj):
        return obj.get_participants_names()

    def host(self, obj):
        return obj.created_by.user.username

