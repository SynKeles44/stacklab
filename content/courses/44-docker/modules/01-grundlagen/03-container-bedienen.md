---
title: Container bedienen – Ports, Umgebung, Logs und exec
summary: Wie du Container von außen erreichbar machst, per Umgebungsvariablen konfigurierst, ihre Logs liest und in sie hineinschaust.
duration: 25
sources:
  - title: Docker Docs – Publishing and exposing ports
    url: https://docs.docker.com/get-started/docker-concepts/running-containers/publishing-ports/
  - title: Docker Docs – Overriding container defaults
    url: https://docs.docker.com/get-started/docker-concepts/running-containers/overriding-container-defaults/
  - title: Docker Docs – docker container logs
    url: https://docs.docker.com/reference/cli/docker/container/logs/
  - title: Docker Docs – docker container exec
    url: https://docs.docker.com/reference/cli/docker/container/exec/
quiz:
  - type: single
    question: Was bewirkt `-p 8080:80` bei `docker run`?
    options:
      - Der Container lauscht auf Port 8080 statt 80.
      - Anfragen an Port 8080 deines Rechners werden an Port 80 im Container weitergeleitet.
      - Anfragen an Port 80 deines Rechners werden an Port 8080 im Container weitergeleitet.
      - Der Container darf höchstens 8080 Verbindungen annehmen.
    answer: 1
    explanation: Die Reihenfolge ist immer **Host:Container**. Links steht der Port auf deinem Rechner, rechts der im Container.
  - type: multiple
    question: Welche Aussagen über `docker exec` stimmen?
    options:
      - Es führt einen zusätzlichen Befehl in einem bereits laufenden Container aus.
      - Es startet einen neuen Container aus einem Image.
      - Mit `-it` und `sh` bekommst du eine interaktive Shell im Container.
      - Es funktioniert auch bei gestoppten Containern.
    answers: [0, 2]
    explanation: >
      `docker exec` braucht einen laufenden Container und startet darin einen weiteren Prozess. Einen neuen
      Container erzeugt nur `docker run`.
  - type: find-bug
    question: Der Webserver soll unter http://localhost:8080 erreichbar sein, die Seite lädt aber nicht. In welcher Zeile steckt der Fehler?
    language: bash
    code: |
      docker run -d \
        --name web \
        -p 80:8080 \
        nginx:1.30-alpine
    bug_line: 3
    explanation: >
      Nginx lauscht im Container auf Port 80. Richtig ist `-p 8080:80` – zuerst der Port auf deinem Rechner, dann der
      Port im Container.
  - type: cloze
    text: Mit `docker logs ___ api` folgst du den Logs live. Eine Umgebungsvariable setzt du mit der Option ___.
    blanks:
      - [-f, --follow]
      - [-e, --env]
    explanation: "`-f` hält die Ausgabe offen wie `tail -f`. `-e NAME=wert` setzt eine Umgebungsvariable."
tasks:
  - id: nginx-erreichbar
    type: simulated
    title: Einen Webserver erreichbar machen und untersuchen
    description: |
      Starte einen Nginx-Container, der auf deinem Rechner unter Port 8080 erreichbar ist, und schau ihm unter die Haube.

      1. Starte im Hintergrund einen Container `web` aus `nginx:1.30-alpine`, der Port 8080 deines Rechners auf Port 80 im Container weiterleitet.
      2. Rufe mit `curl http://localhost:8080` die Startseite ab.
      3. Zeige die letzten 5 Log-Zeilen des Containers an (`--tail`).
      4. Lass dir im Container mit `docker exec` die Nginx-Version anzeigen (`nginx -v`).
    prompt: "du@laptop:~$"
    steps:
      - expect: "^docker\\s+run\\s+(?=.*(-d|--detach)\\b)(?=.*--name[\\s=]web\\b)(?=.*(-p|--publish)[\\s=](0\\.0\\.0\\.0:|127\\.0\\.0\\.1:)?8080:80\\b).*nginx:1\\.30-alpine\\s*$"
        output: 9c1e4b2a7d3f8e6c5b4a3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a
        hint: "docker run -d --name web -p 8080:80 nginx:1.30-alpine"
      - expect: "^curl\\s+(-s\\s+)?(http://)?localhost:8080/?\\s*$"
        output: |
          <!DOCTYPE html>
          <html>
          <head>
          <title>Welcome to nginx!</title>
          …
        hint: curl http://localhost:8080
      - expect: "^docker\\s+(container\\s+)?logs\\s+(--tail[\\s=]5\\s+web|web\\s+--tail[\\s=]5|-n\\s+5\\s+web)\\s*$"
        output: |
          2026/10/10 09:14:02 [notice] 1#1: nginx/1.30.0
          2026/10/10 09:14:02 [notice] 1#1: start worker processes
          2026/10/10 09:14:02 [notice] 1#1: start worker process 29
          2026/10/10 09:14:02 [notice] 1#1: start worker process 30
          192.0.2.1 - - [10/Oct/2026:09:14:20 +0000] "GET / HTTP/1.1" 200 615 "-" "curl/8.14.1" "-"
        hint: docker logs --tail 5 web
      - expect: "^docker\\s+(container\\s+)?exec\\s+(-it\\s+)?web\\s+nginx\\s+-v\\s*$"
        output: "nginx version: nginx/1.30.0"
        hint: docker exec web nginx -v
    responses:
      - match: "^docker\\s+ps"
        output: |
          CONTAINER ID   IMAGE               COMMAND                  CREATED          STATUS          PORTS                  NAMES
          9c1e4b2a7d3f   nginx:1.30-alpine   "/docker-entrypoint.…"   30 seconds ago   Up 29 seconds   0.0.0.0:8080->80/tcp   web
    hints:
      - "Die Port-Angabe lautet Host:Container – also 8080:80."
      - "Für die Logs: docker logs --tail 5 web. Für den Befehl im Container: docker exec web nginx -v."
    solution: |
      ```bash
      docker run -d --name web -p 8080:80 nginx:1.30-alpine
      curl http://localhost:8080
      docker logs --tail 5 web
      docker exec web nginx -v
      ```
  - id: start-skript
    type: terminal
    title: Ein Startskript für eine Datenbank schreiben
    description: |
      Du willst auf deinem Rechner schnell eine PostgreSQL-Datenbank im Container starten. Damit du dir den
      langen Befehl nicht merken musst, schreibst du ihn in ein Skript. (Ausführen kannst du es nur auf einem
      Rechner mit Docker – hier prüft Stacklab den Inhalt.)

      Klicke zuerst auf **Aufgabe vorbereiten**. Im Ordner `start-skript` liegt dann ein leeres `start-db.sh`.

      1. Schreibe in `start-db.sh` **einen** `docker run`-Befehl, der
         - im Hintergrund läuft,
         - den Container `db` nennt,
         - Port **5433** deines Rechners auf Port **5432** im Container weiterleitet, aber nur auf
           `127.0.0.1` (also `-p 127.0.0.1:5433:5432`),
         - die Umgebungsvariable `POSTGRES_PASSWORD` auf `geheim` setzt,
         - das Image `postgres:18-alpine` verwendet.
      2. Mach das Skript ausführbar (`chmod +x start-db.sh`).
    workdir: start-skript
    setup: |
      printf '#!/usr/bin/env bash\nset -euo pipefail\n\n' > start-db.sh
    checks:
      - type: file_contains
        path: start-db.sh
        pattern: "docker\\s+(container\\s+)?run\\b"
        message: In start-db.sh fehlt noch der Befehl docker run.
      - type: file_contains
        path: start-db.sh
        pattern: "\\s(-d|--detach)\\b"
        message: Der Container soll im Hintergrund laufen – ergänze -d.
      - type: file_contains
        path: start-db.sh
        pattern: "--name[ =]db\\b"
        message: Gib dem Container mit --name db einen festen Namen.
      - type: file_contains
        path: start-db.sh
        pattern: "(-p|--publish)[ =]127\\.0\\.0\\.1:5433:5432\\b"
        message: "Die Port-Weiterleitung fehlt oder ist falsch. Gesucht ist -p 127.0.0.1:5433:5432 (Host-IP:Host-Port:Container-Port)."
      - type: file_contains
        path: start-db.sh
        pattern: "(-e|--env)[ =]\"?POSTGRES_PASSWORD=\"?geheim"
        message: Setze die Umgebungsvariable mit -e POSTGRES_PASSWORD=geheim.
      - type: file_contains
        path: start-db.sh
        pattern: "postgres:18-alpine\\s*$"
        message: Am Ende des Befehls steht das Image postgres:18-alpine – Optionen kommen immer davor.
      - type: command
        run: bash -n start-db.sh && echo ok
        stdout_equals: ok
        message: Das Skript enthält einen Syntaxfehler. Prüfe, ob jeder Zeilenumbruch mit einem Backslash \ endet.
      - type: command
        run: test -x start-db.sh && echo ok
        stdout_equals: ok
        message: Das Skript ist noch nicht ausführbar. Nutze chmod +x start-db.sh.
    hints:
      - "Die Reihenfolge ist immer: docker run [Optionen] image. Der Image-Name steht ganz am Ende."
      - "Lange Befehle kannst du mit \\ am Zeilenende auf mehrere Zeilen verteilen."
      - "Komplett: docker run -d --name db -p 127.0.0.1:5433:5432 -e POSTGRES_PASSWORD=geheim postgres:18-alpine"
    solution: |
      ```bash
      cd start-skript
      cat >> start-db.sh <<'EOF'
      docker run -d \
        --name db \
        -p 127.0.0.1:5433:5432 \
        -e POSTGRES_PASSWORD=geheim \
        postgres:18-alpine
      EOF
      chmod +x start-db.sh
      cat start-db.sh
      ```
---
Ein Nginx-Container läuft – aber dein Browser findet ihn nicht. Eine Datenbank startet nicht, weil ihr ein
Passwort fehlt. Und irgendwas geht schief, aber du siehst keine Fehlermeldung. In dieser Lektion lernst du
die vier Handgriffe, die du im Container-Alltag ständig brauchst.

## Ports veröffentlichen

Ein Container hat sein eigenes Netzwerk. Lauscht Nginx darin auf [[port|Port]] 80, ist das von deinem
Rechner aus erst einmal **nicht** erreichbar. Du musst den Port veröffentlichen – das nennt man
[[port-mapping|Port-Mapping]].

```bash title="Port-Mapping"
docker run -d --name web -p 8080:80 nginx:1.30-alpine
curl http://localhost:8080
```

Die Regel lautet immer **Host:Container**. Links steht der Port auf deinem Rechner, rechts der im Container.

| Angabe | Bedeutung |
|---|---|
| `-p 8080:80` | Port 8080 auf allen Netzwerkschnittstellen deines Rechners → Port 80 im Container |
| `-p 127.0.0.1:8080:80` | Nur von deinem eigenen Rechner aus erreichbar |
| `-p 80` | Docker wählt einen freien Host-Port aus |

> [!ACHTUNG]
> `-p 5432:5432` macht deine Datenbank für **jeden** im selben Netzwerk erreichbar – im Café-WLAN keine gute
> Idee. Binde Entwicklungsdatenbanken an `127.0.0.1`.

Die Anweisung `EXPOSE` in einem Image ist übrigens nur Dokumentation. Sie veröffentlicht nichts – das macht
allein `-p`.

## Konfiguration über Umgebungsvariablen

Images sollen überall gleich sein. Was sich unterscheidet – Passwörter, Hostnamen, Log-Level – übergibst du
beim Start als [[umgebungsvariable|Umgebungsvariablen]].

```bash title="Umgebungsvariablen setzen"
docker run -d --name db \
  -e POSTGRES_PASSWORD=geheim \
  -e POSTGRES_DB=shop \
  postgres:18-alpine

docker run --rm --env-file .env meine-app:1.0
```

Welche Variablen ein Image versteht, steht in seiner Dokumentation auf Docker Hub. Das offizielle
PostgreSQL-Image startet zum Beispiel **gar nicht**, wenn `POSTGRES_PASSWORD` fehlt.

> [!MERKSATZ]
> Gleiches Image, andere Umgebungsvariablen: So läuft derselbe Container in Entwicklung, Test und Produktion.

## Logs lesen

Container schreiben ihre Ausgaben auf die [[standardausgabe|Standardausgabe]] und
[[standardfehlerausgabe|Standardfehlerausgabe]]. Docker sammelt beides, und du liest es mit `docker logs`.

```bash title="Logs"
docker logs web             # alles seit dem Start
docker logs --tail 20 web   # nur die letzten 20 Zeilen
docker logs -f web          # live mitlesen (Strg+C beendet)
docker logs --since 10m web # nur die letzten 10 Minuten
```

Startet ein Container und stoppt sofort wieder, ist `docker logs` dein erster Blick. Meist steht dort die
Fehlermeldung, etwa „Database is uninitialized and superuser password is not specified“.

> [!FEHLER]
> Anwendungen, die nur in eine [[logdatei|Logdatei]] im Container schreiben, sind für `docker logs` unsichtbar.
> In Containern gilt: Logs gehören nach stdout und stderr.

## In einen laufenden Container schauen

Mit `docker exec` startest du einen **zusätzlichen** Befehl in einem laufenden Container.

```bash title="exec"
docker exec web nginx -v          # einzelnen Befehl ausführen
docker exec -it web sh            # interaktive Shell (bash fehlt oft)
docker exec -it db psql -U postgres
```

`-i` hält die Eingabe offen, `-t` gibt dir ein richtiges Terminal. Zusammen (`-it`) brauchst du sie für alles
Interaktive. In schlanken Images gibt es oft keine `bash`, nur `sh`.

Änderungen, die du per `exec` im Container machst, sind übrigens nicht dauerhaft. Spätestens wenn der
Container neu erzeugt wird, sind sie weg. Dauerhafte Änderungen gehören ins Image.

> [!PRAXIS]
> Beim Debuggen ist `docker exec -it <name> sh` Gold wert: Du prüfst Umgebungsvariablen (`env`),
> Dateien und ob ein anderer Container erreichbar ist – direkt aus Sicht der Anwendung.

## Aufräumen und Überblick behalten

Container, Images und Daten belegen Platz. Diese Befehle helfen dir:

| Befehl | Wirkung |
|---|---|
| `docker system df` | Zeigt, wie viel Platz Images, Container und Volumes belegen |
| `docker container prune` | Löscht alle gestoppten Container |
| `docker image prune` | Löscht Images ohne Namen (übrig gebliebene Build-Reste) |
| `docker stop $(docker ps -q)` | Stoppt alle laufenden Container |

## Zusammenfassung

- `-p HOST:CONTAINER` veröffentlicht einen Port; `127.0.0.1:` davor beschränkt ihn auf deinen Rechner.
- `EXPOSE` dokumentiert nur – erreichbar wird ein Port erst durch `-p`.
- Konfiguration kommt per `-e NAME=wert` oder `--env-file`, nicht ins Image.
- `docker logs` (mit `--tail`, `-f`) zeigt stdout und stderr des Containers.
- `docker exec -it <name> sh` öffnet eine Shell im laufenden Container; Änderungen dort sind nicht dauerhaft.
