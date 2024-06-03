from django.shortcuts import render

# Create your views here.
from django.shortcuts import render
from django.contrib.auth.decorators import login_required

# room_name argument for websocket url
@login_required
def chat(request, room_name=None):
  if room_name:
    return render(request, 'chat/chatroom.html', {'room_name': room_name})
  else:
    return render(request, 'chat/chatroom.html', {'room_name': 'default'})
