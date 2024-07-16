#!/bin/sh

# Wait for the database to be ready
/usr/local/bin/wait-for-it.sh database:5432

# Run migrations
python /app/backend/manage.py makemigrations
python /app/backend/manage.py migrate

# Start the server
export DJANGO_SETTINGS_MODULE=backend.settings
cd backend
/usr/local/bin/daphne -b 0.0.0.0 -p 8000 backend.asgi:application
