#!/bin/sh

# Wait for the database to be ready
/usr/local/bin/wait-for-it.sh database:5432

# Run migrations
python /app/backend/manage.py makemigrations
python /app/backend/manage.py migrate

# Start the server
python /app/backend/manage.py runserver 0.0.0.0:8000
