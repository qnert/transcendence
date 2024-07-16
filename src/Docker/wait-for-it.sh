#!/usr/bin/env bash

set -e

echo "Waiting for database to be ready..."

while ! nc -z database 5432; do
  sleep 1
done

echo "Postgres is up - executing command"
