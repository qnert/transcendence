from django.contrib import admin
from .models import Tournament

# This will allow /admin to interact with Tournament models in the DB
admin.site.register(Tournament)
