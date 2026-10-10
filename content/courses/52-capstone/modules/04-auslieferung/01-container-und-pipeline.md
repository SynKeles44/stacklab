---
title: Container und Pipeline
summary: Vereinskurse in Container verpacken, alle Dienste mit Compose zusammenschalten und jede Änderung in einer CI-Pipeline prüfen.
duration: 20
sources:
  - title: Docker-Dokumentation – Multi-stage builds
    url: https://docs.docker.com/build/building/multi-stage/
  - title: Docker-Dokumentation – Compose file reference
    url: https://docs.docker.com/reference/compose-file/
  - title: GitHub Docs – Workflow syntax for GitHub Actions
    url: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
quiz:
  - type: single
    question: Warum baut `web/Dockerfile` in einer Node-Stage und liefert dann aus einem Nginx-Image aus?
    options:
      - Weil Nginx kein JavaScript ausliefern kann.
      - Weil Node, npm und node_modules nur zum Bauen gebraucht werden – das fertige Image enthält nur noch die statischen Dateien.
      - Weil Docker nur zwei Stages erlaubt.
    answer: 1
    explanation: Ein Multi-Stage-Build lässt das Werkzeug zurück. Das Laufzeit-Image ist klein und hat weniger Angriffsfläche.
  - type: multiple
    question: Was gehört in die CI-Pipeline von Vereinskurse?
    options:
      - "`composer check` (Pint und alle Tests)"
      - "`npm ci`, `npm run lint` und `npm run build`"
      - Das Produktions-Passwort der Datenbank im Klartext im Workflow
      - Ein Auslöser für Pull Requests
    answers: [0, 1, 3]
    explanation: Geheimnisse gehören in die Secrets des Repositorys, nie in die Workflow-Datei.
  - type: match
    question: Ordne jeden Compose-Service seiner Aufgabe zu.
    pairs:
      - { left: "db", right: "PostgreSQL mit Volume für die Daten" }
      - { left: "api", right: "PHP-FPM mit der Laravel-Anwendung" }
      - { left: "web", right: "Nginx mit SPA und Weiterleitung von /api" }
    explanation: Drei Services, ein Netzwerk. Nach außen ist nur web mit einem Port sichtbar.
  - type: find-bug
    question: In welcher Zeile dieses CI-Jobs steckt der Fehler?
    language: yaml
    code: |
      web:
        runs-on: ubuntu-latest
        defaults:
          run:
            working-directory: web
        steps:
          - uses: actions/checkout@v7
          - run: npm run build
          - run: npm ci
    bug_line: 8
    explanation: Der Build läuft, bevor die Abhängigkeiten installiert sind. `npm ci` muss vor `npm run build` stehen.
tasks:
  - id: compose-hochfahren
    type: simulated
    title: Die App mit Compose starten
    description: |
      Du bist auf deinem Rechner im Projektordner `vereinskurse`. Docker läuft. Starte die App:

      1. Baue alle Images: `docker compose build`
      2. Starte alle Services im Hintergrund: `docker compose up -d`
      3. Führe die Migrationen im api-Container aus: `docker compose exec api php artisan migrate --force`
      4. Prüfe den Health-Check: `curl -i http://localhost:8080/up`
    prompt: "du@laptop:~/vereinskurse$"
    steps:
      - expect: "^docker\\s+compose\\s+build$"
        output: |
          [+] Building 41.3s (24/24) FINISHED
           => [api base 1/3] FROM docker.io/library/php:8.5-fpm-alpine
           => [api vendor 4/6] RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist
           => [web build 4/6] RUN npm ci
           => [web build 6/6] RUN npm run build
           => [web stage-1 2/2] COPY --from=build /app/dist /usr/share/nginx/html
          [+] Building 2/2
           ✔ vereinskurse-api  Built
           ✔ vereinskurse-web  Built
        hint: "Mit `docker compose build` baust du alle Services, die einen build-Abschnitt haben."
      - expect: "^docker\\s+compose\\s+up\\s+-d$"
        output: |
          [+] Running 5/5
           ✔ Network vereinskurse_default    Created
           ✔ Volume "vereinskurse_db-daten"  Created
           ✔ Container vereinskurse-db-1     Healthy
           ✔ Container vereinskurse-api-1    Started
           ✔ Container vereinskurse-web-1    Started
        hint: "`-d` startet die Container im Hintergrund."
      - expect: "^docker\\s+compose\\s+exec\\s+api\\s+php\\s+artisan\\s+migrate\\s+--force$"
        output: |
            INFO  Running migrations.

            0001_01_01_000000_create_users_table ................. 31.07ms DONE
            2026_10_10_000001_create_workshops_table ............. 12.44ms DONE
            2026_10_10_000002_create_bookings_table ............... 9.81ms DONE
        hint: "`docker compose exec <service> <befehl>` führt einen Befehl im laufenden Container aus. In Produktion braucht migrate `--force`."
      - expect: "^curl\\s+(-i\\s+)?(-s\\s+)?http://localhost:8080/up$"
        output: |
          HTTP/1.1 200 OK
          Server: nginx
          Content-Type: text/html; charset=utf-8

          Application up
        hint: "Der web-Container ist auf Port 8080 erreichbar und reicht /up an Laravel weiter."
    responses:
      - match: "^docker\\s+compose\\s+ps"
        output: |
          NAME                 SERVICE   STATUS                   PORTS
          vereinskurse-api-1   api       Up 2 minutes             9000/tcp
          vereinskurse-db-1    db        Up 2 minutes (healthy)   5432/tcp
          vereinskurse-web-1   web       Up 2 minutes             0.0.0.0:8080->80/tcp
      - match: "^docker\\s+compose\\s+logs"
        output: |
          api-1  | [10-Oct-2026 09:12:01] NOTICE: fpm is running, pid 1
          api-1  | [10-Oct-2026 09:12:01] NOTICE: ready to handle connections
  - id: pipeline-reihenfolge
    type: order
    title: Der API-Job in der CI
    description: Bringe die Schritte des CI-Jobs `api` in die richtige Reihenfolge.
    items:
      - Repository auschecken (actions/checkout)
      - PHP 8.5 einrichten (setup-php)
      - composer install
      - .env aus .env.example erzeugen und key:generate
      - composer check (Pint und Tests)
    hints:
      - Ohne Code kein Composer, ohne Composer keine Tests.
---
Auf deinem Rechner läuft Vereinskurse mit `php artisan serve` und `npm run dev`. Auf einem Server soll es ohne
dieses Handanlegen laufen – reproduzierbar, mit festgelegten Versionen und so, dass jede Änderung vorher
automatisch geprüft wird. Dafür sorgen Container und eine CI-Pipeline.

## Ein Image pro Dienst

Jeder Dienst bekommt sein eigenes [[docker-image|Image]], gebaut per
[[multi-stage-build|Multi-Stage-Build]]:

| Image | Stages | Ergebnis |
|---|---|---|
| `api` | `base` (PHP-FPM + pdo_pgsql) → `vendor` (Composer) → `final` | PHP-FPM mit Code und Paketen, läuft als `www-data` |
| `web` | `build` (Node: `npm ci`, `npm run build`) → Nginx | nur `dist/` plus `nginx.conf` |
| `db` | fertiges Image `postgres:18-alpine` | Datenbank mit Volume |

```dockerfile title="web/Dockerfile"
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV VITE_API_URL=""
RUN npm run build

FROM nginx:1.30-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
```

`VITE_API_URL=""` sorgt dafür, dass das Frontend relative Pfade wie `/api/workshops` nutzt – im Container
liegen SPA und API auf demselben Origin.

> [!MERKSATZ]
> Werkzeuge zum Bauen bleiben in der Build-Stage. Das Laufzeit-Image enthält nur, was zur Laufzeit gebraucht
> wird.

## Ein Origin dank Nginx

Der `web`-Container ist der einzige mit offenem Port. Seine `nginx.conf` macht zwei Dinge:

```nginx title="web/nginx.conf (Kern)"
location / {
    try_files $uri /index.html;
}

location /api/ {
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME /var/www/html/public/index.php;
    fastcgi_pass api:9000;
}
```

Die erste Regel ist der [[spa-fallback|SPA-Fallback]]: Ruft jemand `/workshops/3` direkt auf, bekommt er
`index.html`, und React Router übernimmt. Die zweite reicht alle API-Anfragen per [[fastcgi|FastCGI]] an
PHP-FPM im Service `api` weiter.

## Compose verbindet alles

[[docker-compose|Docker Compose]] beschreibt die drei Services, ihr gemeinsames Netzwerk und das Volume:

```yaml title="compose.yaml (Kern)"
services:
  db:
    image: postgres:18-alpine
    volumes: [db-daten:/var/lib/postgresql]
  api:
    build: { context: ./api, target: final }
    env_file: ./api/.env
    depends_on:
      db: { condition: service_healthy }
  web:
    build: ./web
    ports: ["8080:80"]
volumes:
  db-daten:
```

Ohne Volume wären alle Workshops nach einem Neustart weg. `depends_on` mit `service_healthy` startet die API
erst, wenn PostgreSQL wirklich bereit ist.

> [!FEHLER]
> `.env` oder `vendor/` ins Image kopieren. Eine `.dockerignore` schließt beides aus – Geheimnisse gehören in
> die Umgebung des Servers, Pakete installiert der Build selbst.

## Die Pipeline

Die [[ci-pipeline|CI-Pipeline]] läuft bei jedem Pull Request und jedem Push auf `main`. Zwei
[[workflow-job|Jobs]] laufen parallel:

- **api:** PHP einrichten, `composer install`, `.env` erzeugen, `composer check`.
- **web:** Node 24 einrichten (mit npm-Cache), `npm ci`, `npm run lint`, `npm run build`.

Es sind dieselben Befehle wie lokal – das Gate aus Modul 3. Ein [[geschuetzter-branch|geschützter Branch]]
`main` erlaubt das Mergen erst, wenn beide Jobs grün sind.

> [!PRAXIS]
> Viele Teams bauen in der CI zusätzlich die Docker-Images und schieben sie mit einem eindeutigen Tag (z. B.
> dem Commit-Hash) in eine [[container-registry|Registry]]. Ausgeliefert wird dann genau das geprüfte Image –
> [[build-once-deploy-many|Build once, deploy many]].

## Checkliste für Container und CI

1. Jedes Image baut in Stages, das Laufzeit-Image enthält keine Build-Werkzeuge.
2. Eine `.dockerignore` hält `.env`, `vendor` und `node_modules` aus dem Build-Kontext.
3. Die API läuft als `www-data`, nicht als root.
4. Nur der web-Container hat einen offenen Port, die Datenbank liegt auf einem Volume.
5. Die CI läuft bei jedem Pull Request und prüft beide Seiten mit denselben Befehlen wie lokal.
6. Geheimnisse stehen in den Repository-Secrets, nie in der Workflow-Datei.

## Zusammenfassung

- Jeder Dienst hat sein eigenes Image aus einem **Multi-Stage-Build**; die API läuft nicht als root.
- **Nginx** im web-Container liefert die SPA aus und reicht `/api` an PHP-FPM weiter – ein Origin, kein CORS.
- **Compose** verbindet db, api und web; ein **Volume** bewahrt die Daten.
- Die **CI** führt bei jedem Pull Request dasselbe Gate aus wie lokal.
- Ein geschützter `main`-Branch lässt nur grüne Änderungen zu.
