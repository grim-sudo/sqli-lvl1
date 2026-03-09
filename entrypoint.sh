#!/bin/sh
# entrypoint.sh — MeridianHR Lab 1
# Reads FLAG env variable, seeds database, starts Express API.
set -e

FLAG="${FLAG:-MCG{placeholder_flag_not_set}}"
DB_PATH="${DB_PATH:-/app/data/meridianhr.db}"
PORT="${PORT:-80}"

export FLAG DB_PATH PORT

echo "[entrypoint] Initialising MeridianHR..."
echo "[entrypoint] FLAG provided: $([ "$FLAG" = 'MCG{placeholder_flag_not_set}' ] && echo 'no (using placeholder)' || echo 'yes')"

mkdir -p "$(dirname "$DB_PATH")"

# Remove any existing database so passwords are freshly randomised on every start
if [ -f "$DB_PATH" ]; then
  echo "[entrypoint] Removing stale database (ensures fresh random passwords)..."
  rm -f "$DB_PATH"
fi

echo "[entrypoint] Running database setup..."
node /app/setup-db.js

echo "[entrypoint] Starting application server on port ${PORT}..."
exec node /app/server.js
