#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
fail() { printf '\033[31m%s\033[0m\n' "$1" >&2; exit 1; }

command -v docker >/dev/null 2>&1 || fail "Docker ist nicht installiert. Installiere Docker Desktop: https://www.docker.com/products/docker-desktop/"
docker info >/dev/null 2>&1 || fail "Docker läuft nicht. Starte Docker Desktop und führe den Befehl dann noch einmal aus."
docker compose version >/dev/null 2>&1 || fail "Docker Compose fehlt. Installiere das Compose-Plugin (docker compose version muss funktionieren)."

if [ ! -f .env ]; then
  cp .env.example .env
  if [ "$(uname -s)" = "Linux" ]; then
    sed -i "s/^STACKLAB_UID=.*/STACKLAB_UID=$(id -u)/; s/^STACKLAB_GID=.*/STACKLAB_GID=$(id -g)/" .env
  fi
fi
mkdir -p workspace

port="$(grep -E '^STACKLAB_PORT=' .env | tail -n 1 | cut -d= -f2 | tr -d '"' || true)"
port="${port:-8080}"
url="http://localhost:${port}"

bold "Stacklab wird gestartet …"
echo "Beim ersten Mal dauert das einige Minuten: Programme werden geladen und alle Kurse importiert."
docker compose up -d --build

printf 'Warte, bis Stacklab bereit ist '
for _ in $(seq 1 180); do
  if curl -fsS "${url}/api/courses" -o /dev/null 2>/dev/null; then
    echo
    docker compose exec -T php php artisan stacklab:import --force --no-interaction >/dev/null 2>&1 || echo "Hinweis: Kurse konnten nicht neu importiert werden (docker compose logs php)."
    bold "Fertig! Stacklab läuft unter ${url}"
    echo "Lege dort ein Konto an und leg los. Beenden mit: make stop (ohne make: docker compose down)"
    if [ "${STACKLAB_NO_BROWSER:-0}" = "1" ]; then :
    elif command -v open >/dev/null 2>&1; then open "$url"
    elif command -v wslview >/dev/null 2>&1; then wslview "$url"
    elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$url" >/dev/null 2>&1 || true
    fi
    exit 0
  fi
  printf '.'
  sleep 5
done

echo
fail "Stacklab ist nach 15 Minuten noch nicht erreichbar. Schau mit 'docker compose logs php' nach, was noch läuft."
