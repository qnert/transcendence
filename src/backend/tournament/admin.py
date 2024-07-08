from django.contrib import admin
from .models import Tournament, TournamentUser, TournamentMatch


@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    list_display = ('name', 'host', 'participants', 'state', 'statuses', 'settings')
    search_fields = ('name', 'created_by__user__username')

    def participants(self, obj):
        return obj.get_participants_names()

    def host(self, obj):
        return obj.created_by.user.username

    def statuses(self, obj):
        return obj.get_participants_statuses()

    def settings(self, obj):
        return obj.get_game_settings()

@admin.register(TournamentUser)
class TournamentUser(admin.ModelAdmin):
    list_display = ('username', 'display_name', 'tournament', 'is_ready', 'wins', 'losses', 'goals_scored', 'goals_conceded', 'created_at', 'matches_home', 'matches_away')

    def display_name(self, obj):
        return obj.user_profile.display_name

    def username(self, obj):
        return obj.user_profile.user.username

    def matches_home(self, obj):
        if obj.matches_home.count() > 0:
            matches = obj.matches_home.all()
            return [match.name for match in matches]
        return None

    def matches_away(self, obj):
        if obj.matches_away.count() > 0:
            matches = obj.matches_away.all()
            return [match.name for match in matches]
        return None

@admin.register(TournamentMatch)
class TournamentMatch(admin.ModelAdmin):
    list_display = ('name', 'tournament', 'is_finished', 'player_home', 'player_away', 'goals_home', 'goals_away',)

