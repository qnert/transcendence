from django.contrib import admin
from .models import User, UserProfile, FriendRequest, Friendship


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'is_logged_in', 'is_2fa_enabled', 'completed_2fa')


@admin.register(UserProfile)
class UserProfile(admin.ModelAdmin):
    list_display = ('user', 'display_name', 'registered', 'is_online')
    list_filter = ('user',)
    search_fields = ('user__username', 'display_name')
    ordering = ('user',)


# Register your models here.
@admin.register(FriendRequest)
class FriendRequest(admin.ModelAdmin):
    list_display = ('from_user', 'to_user', 'timestamp', 'accepted')


@admin.register(Friendship)
class Friendship(admin.ModelAdmin):
    list_display = ('user1', 'user2', 'timestamp')
