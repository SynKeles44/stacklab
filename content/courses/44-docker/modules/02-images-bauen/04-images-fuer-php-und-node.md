---
title: Images für Laravel und Node bauen
summary: Wie ein produktionsreifes Image für eine Laravel-App mit PHP-FPM, Composer und Vite-Assets aussieht – und worauf du bei Node-Anwendungen zusätzlich achtest.
duration: 25
sources:
  - title: Docker Hub – Official PHP image
    url: https://hub.docker.com/_/php
  - title: Docker Hub – Official Composer image
    url: https://hub.docker.com/_/composer
  - title: Docker Docs – Containerize a PHP application
    url: https://docs.docker.com/guides/php/containerize/
  - title: Docker Docs – Containerize a Node.js application
    url: https://docs.docker.com/guides/nodejs/containerize/
  - title: Laravel Docs – Deployment
    url: https://laravel.com/docs/deployment
quiz:
  - type: single
    question: Warum braucht ein Container aus `php:8.5-fpm-alpine` noch einen Webserver wie Nginx davor?
    options:
      - PHP-FPM spricht kein HTTP, sondern das FastCGI-Protokoll auf Port 9000.
      - PHP-FPM kann nur eine Anfrage gleichzeitig bearbeiten.
      - Ohne Nginx startet PHP-FPM nicht.
      - Nginx übersetzt den PHP-Code in Maschinencode.
    answer: 0
    explanation: >
      PHP-FPM ist ein Prozess-Manager für PHP und nimmt Anfragen per FastCGI entgegen. Nginx beantwortet die
      HTTP-Anfragen des Browsers, liefert statische Dateien selbst aus und reicht nur PHP-Anfragen an PHP-FPM weiter.
  - type: multiple
    question: Welche Composer-Optionen sind für ein Produktions-Image sinnvoll?
    options:
      - "`--no-dev`"
      - "`--prefer-dist`"
      - "`--optimize-autoloader` (bzw. `dump-autoload --optimize`)"
      - "`--dev`"
    answers: [0, 1, 2]
    explanation: >
      Dev-Pakete wie PHPUnit gehören nicht in Produktion. `--prefer-dist` lädt fertige Archive statt Git-Klone, und
      ein optimierter Autoloader beschleunigt das Laden von Klassen.
  - type: find-bug
    question: Dieses Image soll ohne root laufen und trotzdem Logs nach `storage/` schreiben können. Welche Zeile ist das Problem?
    language: dockerfile
    code: |
      FROM php:8.5-fpm-alpine
      WORKDIR /var/www/html
      COPY --from=vendor /var/www/html ./
      USER www-data
      CMD ["php-fpm"]
    bug_line: 3
    explanation: >
      Ohne `--chown=www-data:www-data` gehören die kopierten Dateien root. Der Benutzer `www-data` kann dann nicht in
      `storage/` und `bootstrap/cache/` schreiben, und Laravel scheitert beim ersten Log-Eintrag.
  - type: cloze
    text: Das Composer-Programm holst du aus dem offiziellen Image mit `COPY ___=composer:2 /usr/bin/composer /usr/bin/composer`. PHP-Erweiterungen wie `pdo_pgsql` installierst du im offiziellen PHP-Image mit `docker-php-ext-___`.
    blanks:
      - [--from]
      - [install]
    explanation: "`COPY --from` funktioniert nicht nur mit eigenen Stages, sondern auch mit beliebigen Images. `docker-php-ext-install` ist ein Hilfsskript im offiziellen PHP-Image."
tasks:
  - id: laravel-dockerfile
    type: terminal
    title: Die finale Stage für eine Laravel-App
    description: |
      Klicke zuerst auf **Aufgabe vorbereiten**. Im Ordner `laravel-image` liegen die Dateien einer (stark
      verkleinerten) Laravel-App und ein `Dockerfile` mit drei fertigen Stages: `base` (PHP-FPM mit `pdo_pgsql`),
      `vendor` (Composer) und `assets` (Vite-Build mit Node).

      Hänge die **finale Stage** an das Ende des Dockerfiles an:

      1. Sie baut auf der Stage `base` auf (`FROM base`).
      2. Sie kopiert `/var/www/html` aus der Stage `vendor` nach `./` – mit `--chown=www-data:www-data`.
      3. Sie kopiert `/app/public/build` aus der Stage `assets` nach `./public/build` – ebenfalls mit
         `--chown=www-data:www-data`.
      4. Sie wechselt auf den Benutzer `www-data`.
      5. Sie dokumentiert Port 9000 und startet `php-fpm` in der Exec-Form.

      Die drei vorhandenen Stages lässt du unverändert.
    workdir: laravel-image
    setup: |
      mkdir -p app public resources/js storage/logs bootstrap/cache
      echo '{ "name": "example/shop", "require": { "php": "^8.5" } }' > composer.json
      echo '{ "packages": [], "packages-dev": [] }' > composer.lock
      echo '{ "name": "shop", "private": true, "scripts": { "build": "vite build" } }' > package.json
      echo '{ "name": "shop", "lockfileVersion": 3, "requires": true, "packages": {} }' > package-lock.json
      echo '<?php echo "Hallo";' > public/index.php
      printf 'vendor\nnode_modules\n.git\n.env\nstorage/logs/*\n' > .dockerignore
      cat > Dockerfile <<'EOF'
      FROM php:8.5-fpm-alpine AS base
      RUN apk add --no-cache libpq-dev \
       && docker-php-ext-install pdo_pgsql
      WORKDIR /var/www/html

      FROM base AS vendor
      RUN apk add --no-cache unzip
      COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
      COPY composer.json composer.lock ./
      RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist
      COPY . .
      RUN composer dump-autoload --optimize --no-dev

      FROM node:24-alpine AS assets
      WORKDIR /app
      COPY package.json package-lock.json ./
      RUN npm ci
      COPY . .
      RUN npm run build
      EOF
    checks:
      - type: command
        run: grep -cE '^FROM\s' Dockerfile
        stdout_equals: "4"
        message: Das Dockerfile soll genau vier Stages haben – die drei vorhandenen plus deine finale.
      - type: command
        run: grep -E '^FROM\s' Dockerfile | head -n 3 | tr -s ' ' | paste -sd '|' -
        stdout_equals: "FROM php:8.5-fpm-alpine AS base|FROM base AS vendor|FROM node:24-alpine AS assets"
        message: Die drei vorhandenen Stages sollen unverändert bleiben.
      - type: command
        run: grep -E '^FROM\s' Dockerfile | tail -n 1
        stdout_matches: "^FROM\\s+base\\s*$"
        message: Die finale Stage beginnt mit FROM base.
      - type: command
        run: awk '/^FROM/{s++} s==4 && /^COPY +--from=vendor +--chown=www-data:www-data +\/var\/www\/html\/? +\.\/? *$/{print "ok"}' Dockerfile
        stdout_equals: ok
        message: "In der finalen Stage fehlt: COPY --from=vendor --chown=www-data:www-data /var/www/html ./"
      - type: command
        run: awk '/^FROM/{s++} s==4 && /^COPY +--from=assets +--chown=www-data:www-data +\/app\/public\/build\/? +\.\/public\/build\/? *$/{print "ok"}' Dockerfile
        stdout_equals: ok
        message: "In der finalen Stage fehlt: COPY --from=assets --chown=www-data:www-data /app/public/build ./public/build"
      - type: command
        run: >-
          awk '/^FROM/{s++} s==4 && /^USER +www-data *$/{u=NR} s==4 && /^CMD/{c=NR} END{print (u && c && u<c) ? "ok" : "falsch"}' Dockerfile
        stdout_equals: ok
        message: In der finalen Stage muss USER www-data vor der CMD-Zeile stehen.
      - type: command
        run: awk '/^FROM/{s++} s==4 && /^EXPOSE +9000 *$/{print "ok"}' Dockerfile
        stdout_equals: ok
        message: Dokumentiere in der finalen Stage den Port mit EXPOSE 9000.
      - type: command
        run: tail -n 5 Dockerfile | grep -cE '^CMD\s+\[\s*"php-fpm"\s*\]\s*$'
        stdout_equals: "1"
        message: 'Am Ende steht CMD ["php-fpm"] in der Exec-Form.'
    hints:
      - "Mit cat >> Dockerfile <<'EOF' … EOF hängst du Zeilen an, ohne die Datei zu überschreiben."
      - Die Stages vendor und assets sprichst du mit `COPY --from=vendor` bzw. `COPY --from=assets` an.
      - "Reihenfolge: FROM base, zwei COPY-Zeilen, USER www-data, EXPOSE 9000, CMD [\"php-fpm\"]."
    solution: |
      ```bash
      cd laravel-image
      cat >> Dockerfile <<'EOF'

      FROM base
      COPY --from=vendor --chown=www-data:www-data /var/www/html ./
      COPY --from=assets --chown=www-data:www-data /app/public/build ./public/build
      USER www-data
      EXPOSE 9000
      CMD ["php-fpm"]
      EOF
      ```
  - id: laravel-build-reihenfolge
    type: order
    title: Wie entsteht das Laravel-Image?
    description: Bring die Schritte des Multi-Stage-Builds in eine sinnvolle Reihenfolge.
    items:
      - "Stage base: PHP-FPM-Image holen und pdo_pgsql installieren"
      - "Stage vendor: composer.json und composer.lock kopieren"
      - "Stage vendor: composer install --no-dev ausführen"
      - "Stage vendor: restlichen Code kopieren und den Autoloader optimieren"
      - "Stage assets: npm ci und npm run build für die Vite-Assets"
      - "Finale Stage: Code mit vendor/ und public/build zusammenführen"
      - "Finale Stage: USER www-data setzen und php-fpm starten"
    hints:
      - Paketdateien kommen immer vor dem restlichen Code – wegen des Caches.
---
Du kennst jetzt alle Bausteine: Layer, Cache, Multi-Stage, Non-Root. Jetzt setzt du sie für die beiden Stacks
zusammen, die dir im Berufsalltag am häufigsten begegnen: eine **Laravel-App** mit PHP-FPM und eine
**Node-Anwendung**.

## Wie eine Laravel-App im Container läuft

Eine Laravel-App braucht zur Laufzeit drei Dinge: PHP mit den passenden Erweiterungen, den `vendor/`-Ordner von
Composer und die von Vite gebauten Assets in `public/build`.

Das offizielle PHP-Image gibt es in mehreren Varianten:

| Tag | Inhalt | Typischer Einsatz |
|---|---|---|
| `php:8.5-cli-alpine` | Nur die Kommandozeile | Artisan-Befehle, Queue-Worker |
| `php:8.5-fpm-alpine` | [[php-fpm\|PHP-FPM]] auf Port 9000 | Web-Anfragen hinter Nginx |
| `php:8.5-apache` | PHP als Apache-Modul | Einfache Setups mit nur einem Container |

PHP-FPM spricht kein HTTP, sondern [[fastcgi|FastCGI]]. Davor sitzt deshalb ein [[webserver|Webserver]] wie
[[nginx|Nginx]] in einem eigenen Container. Er liefert Bilder und CSS selbst aus und reicht PHP-Anfragen an
`php:9000` weiter. Wie die beiden Container sich finden, lernst du im Netzwerk- und im Compose-Modul.

> [!MERKSATZ]
> Ein Container, ein Prozess: PHP-FPM und Nginx laufen in getrennten Containern und sprechen per FastCGI miteinander.

## Erweiterungen und Composer

Das offizielle PHP-Image bringt Hilfsskripte mit. Mit `docker-php-ext-install` installierst du Erweiterungen; die
nötigen Systembibliotheken holst du vorher mit dem Alpine-Paketmanager `apk`.

```dockerfile title="Stage base"
FROM php:8.5-fpm-alpine AS base
RUN apk add --no-cache libpq-dev \
 && docker-php-ext-install pdo_pgsql
WORKDIR /var/www/html
```

[[composer|Composer]] musst du nicht installieren: `COPY --from` funktioniert auch mit fremden Images. Du kopierst
einfach die fertige Datei aus dem offiziellen Composer-Image.

```dockerfile title="Stage vendor"
FROM base AS vendor
RUN apk add --no-cache unzip
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist
COPY . .
RUN composer dump-autoload --optimize --no-dev
```

Das Muster kennst du: erst [[composer-lock|composer.lock]] kopieren und installieren, dann den Code. `--no-scripts`
und `--no-autoloader` sind nötig, weil der Code beim Install noch fehlt.

## Assets und die finale Stage

Die Vite-Assets baut eine Node-Stage. Danach führt die finale Stage alles zusammen – ohne Composer, ohne Node.

```dockerfile title="Stages assets und final"
FROM node:24-alpine AS assets
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base
COPY --from=vendor --chown=www-data:www-data /var/www/html ./
COPY --from=assets --chown=www-data:www-data /app/public/build ./public/build
USER www-data
EXPOSE 9000
CMD ["php-fpm"]
```

> [!FEHLER]
> Ohne `--chown=www-data:www-data` gehören alle Dateien root. Laravel kann dann nicht nach `storage/` und
> `bootstrap/cache/` schreiben – die App stirbt beim ersten Log-Eintrag mit „Permission denied“.

Konfiguration wie `APP_KEY` oder Datenbank-Zugangsdaten kommen **nicht** ins Image, sondern beim Start als
Umgebungsvariablen. Befehle wie `php artisan config:cache` und `php artisan migrate --force` führst du beim
Deployment aus, wenn die echte Umgebung bekannt ist.

## Besonderheiten bei Node-Anwendungen

Für Node gelten die Regeln der letzten Lektionen: Paketdateien zuerst, `npm ci --omit=dev`, Multi-Stage, `USER node`.
Drei Dinge kommen dazu:

- **`NODE_ENV=production`** setzen. Viele Bibliotheken schalten dann Debug-Ausgaben ab und arbeiten schneller.
- **Signale:** Node als Prozess 1 bekommt keine Standard-Signalbehandlung. Ohne eigenen `SIGTERM`-Handler hilft
  `docker run --init` (bzw. `init: true` in Compose): Ein winziges Init-Programm leitet Signale weiter.
- **Nicht `npm start`** als CMD. npm startet Node als Kindprozess und reicht Signale nicht zuverlässig weiter –
  starte `node` direkt.

> [!PRAXIS]
> `docker init` erzeugt in einem bestehenden Projekt ein Dockerfile, eine `.dockerignore` und eine `compose.yaml`
> als Startpunkt. Prüfe das Ergebnis aber immer mit dem Wissen aus diesem Modul – Vorlagen kennen dein Projekt nicht.

## Zusammenfassung

- Laravel im Container: PHP-FPM-Image plus Nginx in einem eigenen Container, verbunden per FastCGI auf Port 9000.
- Erweiterungen installierst du mit `docker-php-ext-install`, Composer holst du per `COPY --from=composer:2`.
- Eine `vendor`-Stage (Composer) und eine `assets`-Stage (Vite) liefern ihre Ergebnisse an die finale Stage.
- Die finale Stage kopiert mit `--chown=www-data:www-data` und läuft als `www-data`.
- Konfiguration und Secrets kommen beim Start als Umgebungsvariablen, nie ins Image.
- Node-Images: `NODE_ENV=production`, `node` direkt starten, bei Bedarf `--init` für saubere Signale.
