from django.contrib import admin
from .models import GameResult

# Define the admin class for GameResult
@admin.register(GameResult)
class GameResultAdmin(admin.ModelAdmin):
    list_display = ('user_profile', 'opponent_profile', 'user_score', 'opponent_score', 'is_win', 'date_played')
    list_filter = ('user_profile', 'opponent_profile', 'date_played')
    search_fields = ('user_profile__user__username', 'opponent_profile__user__username')
    date_hierarchy = 'date_played'
    
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related('user_profile', 'opponent_profile')

    def user_profile(self, obj):
        return obj.user_profile.user.username
    
    def opponent_profile(self, obj):
        return obj.opponent_profile.user.username
    
    user_profile.admin_order_field = 'user_profile__user__username'
    opponent_profile.admin_order_field = 'opponent_profile__user__username'
