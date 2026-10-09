#!/bin/bash
# Prepares the Laravel backend: dependencies, app key, sandbox secret, migrations, content import.
set -euo pipefail
cd /var/www/backend

if [ ! -f vendor/autoload.php ] || [ composer.lock -nt vendor/autoload.php ]; then
  echo "[stacklab] Installing PHP dependencies…"
  composer install --no-interaction --no-progress --prefer-dist --optimize-autoloader
  touch vendor/autoload.php
fi

if [ ! -f .env ]; then
  cp .env.docker .env
fi
if ! grep -q '^APP_KEY=base64:' .env; then
  php artisan key:generate --force --no-interaction
fi

SECRET_FILE="${STACKLAB_SANDBOX_SECRET_FILE:-/run/stacklab/sandbox.secret}"
if [ ! -s "$SECRET_FILE" ]; then
  mkdir -p "$(dirname "$SECRET_FILE")"
  head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n' > "$SECRET_FILE"
  chmod 0644 "$SECRET_FILE"
fi

echo "[stacklab] Waiting for the database…"
for i in $(seq 1 60); do
  pg_isready -h "${DB_HOST:-db}" -U "${DB_USERNAME:-stacklab}" -q && break
  sleep 1
done

if [ "${STACKLAB_SKIP_BOOT:-0}" != "1" ]; then
  php artisan migrate --force --no-interaction
  php artisan stacklab:import --no-interaction || {
    echo "[stacklab] Content import reported errors – importing anyway so the platform stays usable."
    php artisan stacklab:import --force --no-interaction
  }
  php artisan config:clear >/dev/null
fi

chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
exec "$@"
