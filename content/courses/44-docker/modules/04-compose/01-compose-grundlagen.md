---
title: Docker Compose – mehrere Container als ein Projekt
summary: Wie du mit einer compose.yaml Services, Ports, Volumes und Umgebungsvariablen beschreibst und den ganzen Stack mit einem Befehl startest.
duration: 25
sources:
  - title: Docker Docs – Docker Compose overview
    url: https://docs.docker.com/compose/
  - title: Docker Docs – Compose file reference (services)
    url: https://docs.docker.com/reference/compose-file/services/
  - title: Docker Docs – Networking in Compose
    url: https://docs.docker.com/compose/how-tos/networking/
  - title: Docker Docs – docker compose CLI
    url: https://docs.docker.com/reference/cli/docker/compose/
quiz:
  - type: single
    question: Wie heißt der Befehl, der alle Services einer `compose.yaml` im Hintergrund startet?
    options:
      - "`docker-compose start --all`"
      - "`docker compose up -d`"
      - "`docker run compose.yaml`"
      - "`docker compose build`"
    answer: 1
    explanation: >
      `docker compose up -d` baut fehlende Images, legt Netzwerk und Volumes an und startet alle Services im
      Hintergrund. Compose v2 schreibt man ohne Bindestrich als Unterbefehl von `docker`.
  - type: multiple
    question: Was legt Compose bei `docker compose up` automatisch für dich an?
    options:
      - Ein gemeinsames Netzwerk, in dem sich die Services über ihren Namen finden.
      - Die benannten Volumes aus dem Abschnitt `volumes:`.
      - Ein Backup der Datenbank.
      - Container mit vorhersagbaren Namen wie `shop-db-1`.
    answers: [0, 1, 3]
    explanation: Netzwerk, Volumes und Container entstehen automatisch. Backups musst du dagegen selbst organisieren.
  - type: match
    question: Ordne jedem Compose-Befehl seine Wirkung zu.
    pairs:
      - { left: "docker compose ps", right: "Zeigt die Container des Projekts und ihren Status" }
      - { left: "docker compose logs -f php", right: "Folgt den Logs des Services php" }
      - { left: "docker compose exec php sh", right: "Öffnet eine Shell im laufenden php-Container" }
      - { left: "docker compose down", right: "Stoppt und löscht Container und Netzwerk, Volumes bleiben" }
      - { left: "docker compose config", right: "Prüft die Datei und zeigt das zusammengeführte Ergebnis" }
    explanation: Die Befehle kennst du schon von `docker` – Compose wendet sie auf alle Services des Projekts an und nutzt Service-Namen statt Container-Namen.
  - type: find-bug
    question: Compose meldet einen YAML-Fehler. In welcher Zeile steckt er?
    language: yaml
    code: |
      services:
        web:
          image: nginx:1.30-alpine
          ports:
            - "8080:80"
        db:
        image: postgres:18-alpine
          environment:
            POSTGRES_PASSWORD: geheim
    bug_line: 7
    explanation: >
      In YAML bestimmt die Einrückung die Struktur. `image:` muss unter `db:` eingerückt sein (vier Leerzeichen),
      sonst gehört es nicht zum Service `db`.
tasks:
  - id: erste-compose-datei
    type: terminal
    title: Deine erste compose.yaml
    description: |
      Klicke zuerst auf **Aufgabe vorbereiten**. Im Ordner `erste-compose` liegt ein Ordner `public/` mit einer
      `index.html`. Schreibe eine `compose.yaml` mit zwei Services:

      1. `web` aus `nginx:1.30-alpine`, Port `8080:80` veröffentlicht und `./public` schreibgeschützt nach
         `/usr/share/nginx/html` eingehängt (`./public:/usr/share/nginx/html:ro`).
      2. `db` aus `postgres:18-alpine` mit der Umgebungsvariable `POSTGRES_PASSWORD` = `geheim` und dem benannten
         Volume `pgdata` unter `/var/lib/postgresql`.
      3. Deklariere das Volume `pgdata` im Abschnitt `volumes:` auf oberster Ebene.

      Ohne Docker prüfst du die YAML-Syntax so (Bun bringt einen YAML-Parser mit):

      ```bash
      bun -e 'console.log(Bun.YAML.parse(await Bun.file("compose.yaml").text()))'
      ```
    workdir: erste-compose
    setup: |
      mkdir -p public
      echo '<h1>Hallo Compose</h1>' > public/index.html
    checks:
      - type: file_exists
        path: compose.yaml
        message: Es gibt noch keine Datei compose.yaml.
      - type: command
        run: >-
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file("compose.yaml").text())))' | jq -r '.services | keys | sort | join(",")'
        stdout_equals: "db,web"
        message: Die Datei ist kein gültiges YAML oder hat nicht genau die Services web und db unter services.
      - type: command
        run: >-
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file("compose.yaml").text())))' | jq -r '.services.web.image'
        stdout_equals: "nginx:1.30-alpine"
        message: Der Service web soll das Image nginx:1.30-alpine nutzen.
      - type: command
        run: >-
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file("compose.yaml").text())))' | jq -r '.services.web.ports // [] | map(tostring) | index("8080:80") != null'
        stdout_equals: "true"
        message: 'Veröffentliche beim Service web den Port mit ports: ["8080:80"] (in Anführungszeichen).'
      - type: command
        run: >-
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file("compose.yaml").text())))' | jq -r '.services.web.volumes // [] | map(tostring) | index("./public:/usr/share/nginx/html:ro") != null'
        stdout_equals: "true"
        message: "Hänge beim Service web ./public:/usr/share/nginx/html:ro ein."
      - type: command
        run: >-
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file("compose.yaml").text())))' | jq -r '.services.db.image'
        stdout_equals: "postgres:18-alpine"
        message: Der Service db soll das Image postgres:18-alpine nutzen.
      - type: command
        run: >-
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file("compose.yaml").text())))' | jq -r '.services.db.environment | if type=="array" then (map(select(startswith("POSTGRES_PASSWORD="))) | .[0] // "" | sub("^POSTGRES_PASSWORD=";"")) else (.POSTGRES_PASSWORD // "") end'
        stdout_equals: geheim
        message: Setze beim Service db die Umgebungsvariable POSTGRES_PASSWORD auf geheim.
      - type: command
        run: >-
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file("compose.yaml").text())))' | jq -r '.services.db.volumes // [] | map(tostring) | map(select(test("^pgdata:/var/lib/postgresql/?$"))) | length'
        stdout_equals: "1"
        message: "Hänge beim Service db das Volume mit pgdata:/var/lib/postgresql ein."
      - type: command
        run: >-
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file("compose.yaml").text())))' | jq -r '.volumes | has("pgdata")'
        stdout_equals: "true"
        message: "Deklariere das Volume auf oberster Ebene: volumes: mit dem Eintrag pgdata: (Wert darf leer sein)."
    hints:
      - "Die Datei beginnt mit services: – darunter je Service ein eingerückter Block. Nutze Leerzeichen, keine Tabs."
      - "Ports immer in Anführungszeichen schreiben: - \"8080:80\"."
      - "Am Ende auf oberster Ebene: volumes: und darunter eingerückt pgdata: (ohne Wert)."
    solution: |
      ```bash
      cd erste-compose
      cat > compose.yaml <<'EOF'
      services:
        web:
          image: nginx:1.30-alpine
          ports:
            - "8080:80"
          volumes:
            - ./public:/usr/share/nginx/html:ro
        db:
          image: postgres:18-alpine
          environment:
            POSTGRES_PASSWORD: geheim
          volumes:
            - pgdata:/var/lib/postgresql

      volumes:
        pgdata:
      EOF
      ```
  - id: compose-alltag
    type: simulated
    title: Ein Compose-Projekt bedienen
    description: |
      Im Ordner `shop` liegt eine fertige `compose.yaml` mit den Services `web` und `db`. Das Terminal ist simuliert.

      1. Starte alle Services im Hintergrund.
      2. Zeige den Status der Container an.
      3. Zeige die letzten 10 Log-Zeilen des Services `db`.
      4. Stoppe das Projekt und entferne Container und Netzwerk (die Volumes bleiben).
    prompt: "du@laptop:~/shop$"
    steps:
      - expect: "^docker\\s+compose\\s+up\\s+(-d|--detach)\\s*$"
        output: |
          [+] Running 4/4
           ✔ Network shop_default    Created
           ✔ Volume "shop_pgdata"    Created
           ✔ Container shop-db-1     Started
           ✔ Container shop-web-1    Started
        hint: docker compose up -d
      - expect: "^docker\\s+compose\\s+ps\\s*$"
        output: |
          NAME         IMAGE                COMMAND                  SERVICE   STATUS          PORTS
          shop-db-1    postgres:18-alpine   "docker-entrypoint.s…"   db        Up 8 seconds    5432/tcp
          shop-web-1   nginx:1.30-alpine    "/docker-entrypoint.…"   web       Up 8 seconds    0.0.0.0:8080->80/tcp
        hint: docker compose ps
      - expect: "^docker\\s+compose\\s+logs\\s+(--tail[\\s=]10\\s+db|db\\s+--tail[\\s=]10|-n\\s*10\\s+db)\\s*$"
        output: |
          db-1  | PostgreSQL init process complete; ready for start up.
          db-1  | LOG:  starting PostgreSQL 18.0 on aarch64-unknown-linux-musl
          db-1  | LOG:  listening on IPv4 address "0.0.0.0", port 5432
          db-1  | LOG:  database system is ready to accept connections
        hint: docker compose logs --tail 10 db
      - expect: "^docker\\s+compose\\s+down\\s*$"
        output: |
          [+] Running 3/3
           ✔ Container shop-web-1   Removed
           ✔ Container shop-db-1    Removed
           ✔ Network shop_default   Removed
        hint: docker compose down
    responses:
      - match: "^docker\\s+compose\\s+down\\s+-v"
        output: "Achtung: -v löscht auch das Volume samt Datenbank. Für diese Aufgabe sollen die Volumes bleiben – nutze docker compose down ohne -v."
    hints:
      - Alle Befehle beginnen mit `docker compose` (ohne Bindestrich).
      - "up -d, ps, logs --tail 10 db, down"
    solution: |
      ```bash
      docker compose up -d
      docker compose ps
      docker compose logs --tail 10 db
      docker compose down
      ```
---
Dein Projekt braucht einen Webserver, PHP-FPM, eine Datenbank und einen Cache. Mit `docker run` wären das vier
lange Befehle, plus Netzwerk und Volumes – und jede Kollegin müsste sie exakt gleich eintippen. Docker Compose
schreibt das alles in **eine** Datei, die mit ins Repository kommt.

## Eine Datei für den ganzen Stack

[[docker-compose|Docker Compose]] liest eine [[yaml|YAML]]-Datei namens `compose.yaml` und erzeugt daraus
Container, Netzwerke und Volumes. Jeder Container-Typ ist dort ein [[compose-service|Service]].

```yaml title="compose.yaml"
services:
  web:
    image: nginx:1.30-alpine
    ports:
      - "8080:80"
    volumes:
      - ./public:/usr/share/nginx/html:ro
  db:
    image: postgres:18-alpine
    environment:
      POSTGRES_PASSWORD: geheim
    volumes:
      - pgdata:/var/lib/postgresql

volumes:
  pgdata:
```

Jeder Eintrag entspricht einer Option von `docker run`, die du schon kennst: `ports` ist `-p`, `volumes` ist `-v`,
`environment` ist `-e`. Benannte Volumes deklarierst du zusätzlich auf oberster Ebene.

> [!MERKSATZ]
> Eine `compose.yaml` ist eine Sammlung von `docker run`-Befehlen in lesbarer, versionierbarer Form.

> [!HINWEIS]
> Die Zeile `version: "3.8"` aus alten Anleitungen ist veraltet. Compose v2 ignoriert sie und zeigt eine Warnung.

## Image oder build

Fertige Images holst du mit `image:`. Für deine eigene Anwendung zeigt `build:` auf den Ordner mit dem Dockerfile.

```yaml title="Eigenes Image bauen"
services:
  php:
    build:
      context: .
      target: base       # nur bis zur Stage "base" bauen
    image: shop-php:dev  # Name für das gebaute Image
```

`docker compose build` baut alle Services mit `build:`. `docker compose up --build` baut vor dem Start neu. Mit
`target` wählst du eine Stage aus deinem Multi-Stage-Dockerfile – praktisch, um lokal eine Stage mit Dev-Werkzeugen
zu nutzen.

## Das Netzwerk kommt automatisch

Compose legt für jedes Projekt ein eigenes Netzwerk an, z. B. `shop_default`. Der Projektname ist standardmäßig der
Ordnername. Alle Services hängen darin und finden sich über ihren **Service-Namen**.

![Ein Compose-Projekt: Services in einem gemeinsamen Netzwerk](/assets/docker/compose-stack.svg)

Die Laravel-App trägt also `DB_HOST=db` ein, Nginx reicht PHP-Anfragen an `php:9000` weiter. Ein eigenes
`docker network create` brauchst du nicht mehr.

> [!FEHLER]
> YAML ist streng mit der Einrückung. Ein Leerzeichen zu wenig, und `image:` gehört plötzlich nicht mehr zum
> Service. Nutze immer Leerzeichen (keine Tabs) und prüfe die Datei mit `docker compose config`.

## Die wichtigsten Befehle

Alle Befehle laufen im Ordner mit der `compose.yaml` und nutzen Service-Namen.

| Befehl | Wirkung |
|---|---|
| `docker compose up -d` | Alles bauen (falls nötig) und im Hintergrund starten |
| `docker compose ps` | Status aller Container des Projekts |
| `docker compose logs -f php` | Logs eines Services live verfolgen |
| `docker compose exec php php artisan migrate` | Befehl im laufenden Service ausführen |
| `docker compose run --rm php composer install` | Einmal-Container für einen Befehl |
| `docker compose down` | Container und Netzwerk entfernen, Volumes behalten |
| `docker compose down -v` | Zusätzlich die Volumes löschen – Daten weg! |
| `docker compose config` | Datei prüfen und aufgelöst anzeigen |

> [!PRAXIS]
> In vielen Teams ist `docker compose up -d` der erste Befehl am ersten Arbeitstag. Häufig steckt er noch in einem
> `Makefile` (`make up`), zusammen mit `make shell` für `docker compose exec php sh`.

Compose liest außerdem automatisch eine `compose.override.yaml` und führt sie mit der Hauptdatei zusammen – ideal für
lokale Abweichungen. Details stehen in der [Compose-Dokumentation](https://docs.docker.com/compose/how-tos/multiple-compose-files/merge/).

## Zusammenfassung

- Docker Compose beschreibt mehrere Container in einer `compose.yaml` im Repository.
- `ports`, `volumes` und `environment` entsprechen `-p`, `-v` und `-e` von `docker run`.
- `image:` nutzt ein fertiges Image, `build:` baut aus deinem Dockerfile (optional mit `target`).
- Compose legt automatisch ein Projekt-Netzwerk an; Services finden sich über ihren Namen.
- `up -d`, `ps`, `logs`, `exec`, `down` sind die Befehle für den Alltag; `down -v` löscht auch die Daten.
- `version:` ist veraltet, `docker compose config` prüft deine Datei.
