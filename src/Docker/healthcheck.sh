#!/bin/sh
set -e

host="database"
shift
cmd="$@"

until nc -z -w 2 "$host" 5432; do
  echo "Waiting for $host to be online..."
  sleep 2
done

echo "$host is online, executing command: $cmd"
exec $cmd
