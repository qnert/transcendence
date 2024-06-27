from django.contrib import admin
from .models import User, UserProfile


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'is_logged_in', 'is_2fa_enabled', 'completed_2fa')


@admin.register(UserProfile)
class UserProfile(admin.ModelAdmin):
    list_display = ('user', 'display_name', 'registered', 'is_online')
    list_filter = ('user',)
    search_fields = ('user__username', 'display_name')
    ordering = ('user',)
