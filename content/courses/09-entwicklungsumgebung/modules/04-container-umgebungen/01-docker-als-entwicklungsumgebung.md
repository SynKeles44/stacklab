---
title: Docker als Entwicklungsumgebung
summary: Warum Datenbank, Cache und oft auch die App in Containern laufen, wie eine compose.yaml für die Entwicklung aussieht und wie das Makefile sie bedient.
duration: 20
sources:
  - title: Docker Docs – What is a container?
    url: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/
  - title: Docker Docs – Compose file reference
    url: https://docs.docker.com/reference/compose-file/
  - title: Docker Docs – Bind mounts
    url: https://docs.docker.com/engine/storage/bind-mounts/
quiz:
  - type: single
    question: Warum startet man die Datenbank für die Entwicklung gern in einem Container?
    options:
      - Weil Datenbanken nur in Containern funktionieren.
      - Weil alle im Team mit einem Befehl exakt dieselbe Version bekommen, ohne sie auf dem System zu installieren.
      - Weil Container schneller sind als jede lokale Installation.
    answer: 1
    explanation: Die Version steht in der `compose.yaml` (z. B. `postgres:18`). Ein Container lässt sich jederzeit löschen und neu erstellen – dein Betriebssystem bleibt sauber.
  - type: match
    question: Was bewirkt der jeweilige Eintrag in der compose.yaml?
    pairs:
      - { left: "image: postgres:18", right: "Welches Image der Dienst nutzt" }
      - { left: "ports: [\"5432:5432\"]", right: "Port des Containers auf dem Host erreichbar machen" }
      - { left: "volumes: [\"./:/var/www/html\"]", right: "Projektordner in den Container einbinden" }
      - { left: "env_file: .env", right: "Umgebungsvariablen aus einer Datei laden" }
    explanation: Mit diesen vier Einträgen beschreibst du die meisten Entwicklungsdienste.
  - type: multiple
    question: Welche Befehle gehören zu Docker Compose v2?
    options:
      - "`docker compose up -d`"
      - "`docker compose exec app bash`"
      - "`docker compose logs -f`"
      - "`docker-compose-start`"
    answers: [0, 1, 2]
    explanation: "Compose v2 ist ein Unterbefehl von docker: `docker compose` mit Leerzeichen. Den letzten Befehl gibt es nicht."
tasks:
  - id: compose-simulation
    type: simulated
    title: Die Entwicklungsumgebung hochfahren
    description: |
      Docker läuft im Übungs-Terminal nicht. In dieser Simulation hat das Projekt eine `compose.yaml` mit
      den Diensten `app`, `db` und `mail`.

      1. Starte alle Dienste im Hintergrund: `docker compose up -d`
      2. Prüfe, was läuft: `docker compose ps`
      3. Führe im App-Container die PHP-Version aus: `docker compose exec app php -v`
      4. Fahre alles wieder herunter: `docker compose down`
    prompt: "du@laptop:~/projekte/shop$"
    steps:
      - expect: "^docker\\s+compose\\s+up\\s+-d$"
        output: |
          [+] Running 4/4
           ✔ Network shop_default   Created
           ✔ Container shop-db-1    Started
           ✔ Container shop-mail-1  Started
           ✔ Container shop-app-1   Started
        hint: "docker compose up -d"
      - expect: "^docker\\s+compose\\s+ps$"
        output: |
          NAME          IMAGE              SERVICE   STATUS         PORTS
          shop-app-1    shop-app           app       Up 5 seconds   0.0.0.0:8000->8000/tcp
          shop-db-1     postgres:18        db        Up 6 seconds   0.0.0.0:5432->5432/tcp
          shop-mail-1   axllent/mailpit    mail      Up 6 seconds   0.0.0.0:8025->8025/tcp
        hint: "docker compose ps"
      - expect: "^docker\\s+compose\\s+exec\\s+app\\s+php\\s+(-v|--version)$"
        output: |
          PHP 8.5.0 (cli) (built: Nov 20 2025 10:00:00) (NTS)
          Copyright (c) The PHP Group
        hint: "docker compose exec app php -v"
      - expect: "^docker\\s+compose\\s+down$"
        output: |
          [+] Running 4/4
           ✔ Container shop-app-1   Removed
           ✔ Container shop-mail-1  Removed
           ✔ Container shop-db-1    Removed
           ✔ Network shop_default   Removed
        hint: "docker compose down"
    responses:
      - match: "^docker\\s+compose\\s+logs"
        output: "shop-db-1  | database system is ready to accept connections"
  - id: lokal-oder-container
    type: dragdrop
    title: Lokal oder im Container?
    description: In einem typischen Laravel-/React-Projekt laufen manche Teile lokal, andere in Containern. Ordne die übliche Aufteilung zu.
    targets:
      - { id: lokal, label: Lokal auf deinem Rechner }
      - { id: container, label: In einem Container }
    items:
      - { label: Editor bzw. IDE, target: lokal }
      - { label: Git und deine Dotfiles, target: lokal }
      - { label: PostgreSQL-Datenbank, target: container }
      - { label: Redis-Cache, target: container }
      - { label: Mail-Testserver, target: container }
---

Eine Datenbank direkt auf dem Laptop zu installieren, klingt einfach – bis das zweite Projekt eine andere
Version braucht, der Dienst nach jedem Neustart Speicher frisst und niemand mehr weiß, welche
Einstellungen man vor einem Jahr geändert hat. [[container|Container]] lösen dieses Problem für Dienste
genauso, wie mise es für Runtimes löst. Die Details lernst du im Docker-Kurs; hier geht es darum, wie
Docker in die Entwicklungsumgebung passt.

## Warum Container für die Entwicklung?

Ein Container ist ein abgeschottetes Paket aus Programm und allem, was es zum Laufen braucht. Er entsteht
aus einem [[docker-image|Image]], etwa `postgres:18`. Für die Entwicklung bringt das drei Vorteile:

| Vorteil | Bedeutung |
|---|---|
| Gleiche Versionen | Alle im Team starten dasselbe Image in derselben Version |
| Sauberes System | Nichts wird ins Betriebssystem installiert; `docker compose down` räumt auf |
| Nähe zur Produktion | Läuft die App später in Containern, testest du lokal unter ähnlichen Bedingungen |

> [!MERKSATZ]
> Was ein Projekt an Diensten braucht, steht in der `compose.yaml` im Repository – nicht in einer
> Anleitung, die jede Person von Hand nachbaut.

## Eine compose.yaml für die Entwicklung

[[docker-compose|Docker Compose]] beschreibt mehrere Container und ihr Zusammenspiel in einer Datei im
[[yaml|YAML-Format]]:

```yaml title="compose.yaml"
services:
  app:
    build: .
    ports: ["8000:8000"]
    volumes: ["./:/var/www/html"]
    env_file: .env
    depends_on: [db]
  db:
    image: postgres:18
    environment:
      POSTGRES_DB: app
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports: ["5432:5432"]
  mail:
    image: axllent/mailpit
    ports: ["8025:8025"]
```

Wichtig ist der **Bind-Mount** `./:/var/www/html`: Dein Projektordner erscheint im Container. Du
bearbeitest Dateien wie gewohnt im Editor, und der Container sieht die Änderung sofort.
`${DB_PASSWORD}` liest Compose aus der `.env` – das Passwort steht also nicht in der Datei.

## Daten behalten mit benannten Volumes

Ein Container ist wegwerfbar: Nach `docker compose down` ist alles weg, was nur im Container lag. Für
die Datenbank wäre das ärgerlich. Deshalb speichert man ihre Daten in einem **benannten Volume**, das
Docker getrennt vom Container aufbewahrt:

```yaml title="compose.yaml (Ausschnitt)"
services:
  db:
    image: postgres:18
    volumes: ["db-data:/var/lib/postgresql"]

volumes:
  db-data:
```

| Befehl | Wirkung auf die Datenbank-Daten |
|---|---|
| `docker compose down` | Bleiben erhalten – das Volume überlebt |
| `docker compose down -v` | Werden gelöscht – frischer Start |

`down -v` ist praktisch, wenn du die Datenbank absichtlich neu aufsetzen willst, etwa vor einem
`make setup`. Aus Versehen ausgeführt, sind deine lokalen Testdaten weg.

## Das Makefile als Bedienfeld

Die Compose-Befehle sind lang. Genau dafür hast du das Makefile:

```makefile title="Makefile"
COMPOSE := docker compose

start: ## Startet alle Container
	$(COMPOSE) up -d
stop: ## Stoppt alle Container
	$(COMPOSE) down
console: ## Shell im App-Container
	$(COMPOSE) exec app bash
test: ## Tests im Container ausführen
	$(COMPOSE) exec app php artisan test
```

> [!FEHLER]
> **Befehle auf dem Host statt im Container.** Läuft die App im Container, führst du `php artisan`
> oder `composer` dort aus (`docker compose exec app …`). Auf dem Host erwischst du sonst eine andere
> PHP-Version – oder gar keine.

> [!PRAXIS]
> Viele Teams kombinieren: Runtimes für Werkzeuge wie Linter lokal über mise, die App und alle Dienste
> in Docker Compose. Der nächste Schritt ist der Dev-Container, in dem auch der Editor „im Container
> arbeitet“.

## Zusammenfassung

- Container liefern Dienste wie Datenbank, Cache und Mail-Testserver in festen Versionen.
- Die `compose.yaml` im Repository beschreibt alle Dienste, Ports, Volumes und Variablen.
- Ein Bind-Mount macht deinen Projektordner im Container sichtbar.
- Secrets kommen über `.env` und `${VARIABLE}` in Compose, nicht in die Datei selbst.
- Das Makefile versteckt die langen `docker compose`-Befehle hinter `make start`, `make console` und `make test`.
