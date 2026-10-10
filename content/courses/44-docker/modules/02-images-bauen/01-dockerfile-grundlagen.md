---
title: Das erste Dockerfile
summary: Wie ein Dockerfile aufgebaut ist, was die wichtigsten Anweisungen tun und wie aus Rezept und Build-Kontext ein Image wird.
duration: 25
sources:
  - title: Docker Docs – Dockerfile reference
    url: https://docs.docker.com/reference/dockerfile/
  - title: Docker Docs – Writing a Dockerfile
    url: https://docs.docker.com/get-started/docker-concepts/building-images/writing-a-dockerfile/
  - title: Docker Docs – Build context
    url: https://docs.docker.com/build/concepts/context/
quiz:
  - type: single
    question: Was ist der Build-Kontext bei `docker build -t shop:1.0 .`?
    options:
      - Der Name des Images.
      - Der aktuelle Ordner `.` – nur Dateien daraus kann das Dockerfile mit COPY ins Image holen.
      - Das Basis-Image aus der FROM-Zeile.
      - Die Liste aller Umgebungsvariablen.
    answer: 1
    explanation: >
      Der Punkt am Ende ist der Build-Kontext. Docker schickt diesen Ordner an den Builder. `COPY` kann nur Dateien
      aus diesem Kontext ins Image übernehmen – nichts von außerhalb.
  - type: find-bug
    question: Das Image baut, aber die App findet ihre Dateien nicht. In welcher Zeile steckt der Fehler?
    language: dockerfile
    code: |
      FROM node:24-alpine
      RUN cd /app
      COPY . .
      RUN npm ci
      CMD ["node", "server.js"]
    bug_line: 2
    explanation: >
      Jede RUN-Anweisung läuft in einer eigenen Shell. Das `cd` gilt nur innerhalb dieser einen Zeile. Das
      Arbeitsverzeichnis für alle folgenden Anweisungen setzt du mit `WORKDIR /app`.
  - type: match
    question: Ordne jeder Anweisung ihren Zweck zu.
    pairs:
      - { left: "FROM", right: "Legt das Basis-Image fest" }
      - { left: "RUN", right: "Führt beim Bauen einen Befehl aus" }
      - { left: "COPY", right: "Holt Dateien aus dem Build-Kontext ins Image" }
      - { left: "CMD", right: "Legt den Standardbefehl beim Start des Containers fest" }
      - { left: "EXPOSE", right: "Dokumentiert, auf welchem Port die App lauscht" }
    explanation: RUN wirkt beim Bauen, CMD beim Starten – diese Unterscheidung ist der häufigste Stolperstein.
  - type: single
    question: Warum schreibt man `CMD ["node", "server.js"]` statt `CMD node server.js`?
    options:
      - Die eckigen Klammern machen das Image kleiner.
      - In der Exec-Form läuft node direkt als Prozess 1 und bekommt Signale wie SIGTERM, statt hinter einer Shell zu stecken.
      - Die Shell-Form ist in neuen Docker-Versionen verboten.
      - Es gibt keinen Unterschied.
    answer: 1
    explanation: >
      Die Shell-Form startet `/bin/sh -c "node server.js"`. Dann ist die Shell Prozess 1 und leitet `docker stop`
      oft nicht weiter – der Container wird nach 10 Sekunden hart beendet. Die Exec-Form vermeidet das.
tasks:
  - id: node-dockerfile
    type: terminal
    title: Ein Dockerfile für eine Node-App schreiben
    description: |
      Klicke zuerst auf **Aufgabe vorbereiten**. Im Ordner `node-app` liegt dann eine kleine Node-Anwendung:
      `package.json`, `package-lock.json` und `server.js` (lauscht auf Port 3000).

      Schreibe eine Datei `Dockerfile` (genau so geschrieben), die:

      1. auf `node:24-alpine` aufbaut,
      2. `/app` als Arbeitsverzeichnis setzt,
      3. alle Dateien des Build-Kontexts ins Arbeitsverzeichnis kopiert,
      4. mit `npm ci --omit=dev` die Abhängigkeiten installiert,
      5. dokumentiert, dass die App auf Port 3000 lauscht,
      6. die App in der **Exec-Form** mit `node server.js` startet.

      Bauen kannst du das Image hier nicht – auf deinem Rechner würdest du `docker build -t node-app:1.0 .` ausführen.
    workdir: node-app
    setup: |
      cat > package.json <<'EOF'
      {
        "name": "node-app",
        "version": "1.0.0",
        "private": true,
        "scripts": { "start": "node server.js" }
      }
      EOF
      cat > package-lock.json <<'EOF'
      {
        "name": "node-app",
        "version": "1.0.0",
        "lockfileVersion": 3,
        "requires": true,
        "packages": { "": { "name": "node-app", "version": "1.0.0" } }
      }
      EOF
      cat > server.js <<'EOF'
      const http = require('node:http');
      const port = process.env.PORT ?? 3000;
      http.createServer((req, res) => res.end('Hallo aus dem Container\n')).listen(port);
      console.log(`listening on ${port}`);
      EOF
    checks:
      - type: file_exists
        path: Dockerfile
        message: Es gibt noch keine Datei namens Dockerfile (großes D, keine Endung).
      - type: command
        run: grep -vE '^\s*(#|$)' Dockerfile | head -n 1 | grep -ciE '^FROM\s+node:24-alpine(\s|$)'
        stdout_equals: "1"
        message: Die erste Anweisung muss FROM node:24-alpine sein.
      - type: file_contains
        path: Dockerfile
        pattern: "^WORKDIR\\s+/app/?\\s*$"
        message: Setze das Arbeitsverzeichnis mit WORKDIR /app.
      - type: file_contains
        path: Dockerfile
        pattern: "^COPY\\s+\\.\\s+(\\.|/app/?)\\s*$"
        message: "Kopiere den Build-Kontext mit COPY . . ins Arbeitsverzeichnis."
      - type: file_contains
        path: Dockerfile
        pattern: "^RUN\\s+npm\\s+ci\\s+--omit=dev\\s*$"
        message: Installiere die Abhängigkeiten mit RUN npm ci --omit=dev.
      - type: command
        run: >-
          awk 'toupper($1)=="COPY"{c=NR} /^RUN +npm +ci/{r=NR} END{print (c && r && c<r) ? "ok" : "falsch"}' Dockerfile
        stdout_equals: ok
        message: npm ci braucht package.json und package-lock.json – die COPY-Zeile muss vor RUN npm ci stehen.
      - type: file_contains
        path: Dockerfile
        pattern: "^EXPOSE\\s+3000\\s*$"
        message: Dokumentiere den Port mit EXPOSE 3000.
      - type: file_contains
        path: Dockerfile
        pattern: "^CMD\\s+\\[\\s*\"node\"\\s*,\\s*\"server\\.js\"\\s*\\]\\s*$"
        message: 'Starte die App in der Exec-Form: CMD ["node", "server.js"].'
    hints:
      - Die Reihenfolge ist FROM, WORKDIR, COPY, RUN, EXPOSE, CMD.
      - "Die Exec-Form ist ein JSON-Array mit doppelten Anführungszeichen: CMD [\"node\", \"server.js\"]."
      - "Schreib die Datei am einfachsten mit cat > Dockerfile <<'EOF' … EOF."
    solution: |
      ```bash
      cd node-app
      cat > Dockerfile <<'EOF'
      FROM node:24-alpine
      WORKDIR /app
      COPY . .
      RUN npm ci --omit=dev
      EXPOSE 3000
      CMD ["node", "server.js"]
      EOF
      ```
  - id: anweisungen-zuordnen
    type: dragdrop
    title: Bauzeit oder Startzeit?
    description: Manche Anweisungen wirken, während das Image gebaut wird, andere erst, wenn ein Container startet. Ordne zu.
    targets:
      - { id: build, label: Wirkt beim Bauen des Images }
      - { id: start, label: Wirkt erst beim Start des Containers }
    items:
      - { label: "RUN npm ci", target: build }
      - { label: "COPY . .", target: build }
      - { label: "CMD [\"node\", \"server.js\"]", target: start }
      - { label: "ENTRYPOINT [\"php-fpm\"]", target: start }
      - { label: "RUN apk add --no-cache git", target: build }
    hints:
      - Alles, was das Dateisystem des Images verändert, passiert beim Bauen.
---
Bisher hast du fertige Images von Docker Hub benutzt. Für deine eigene Anwendung gibt es aber kein fertiges
Image – das baust du selbst. Das Rezept dafür ist eine Textdatei namens **Dockerfile**.

## Vom Rezept zum Image

Ein [[dockerfile|Dockerfile]] beschreibt Schritt für Schritt, wie ein Image entsteht: Nimm dieses Basis-Image,
kopiere diese Dateien hinein, führe diese Befehle aus, starte am Ende dieses Programm.

```dockerfile title="Dockerfile"
FROM node:24-alpine
WORKDIR /app
COPY . .
RUN npm ci --omit=dev
EXPOSE 3000
CMD ["node", "server.js"]
```

Gebaut wird das Image mit `docker build`:

```bash title="Image bauen und starten"
docker build -t node-app:1.0 .
docker run -d --name app -p 3000:3000 node-app:1.0
```

`-t` gibt dem Image Name und Tag. Der Punkt am Ende ist der [[build-kontext|Build-Kontext]] – dazu gleich mehr.

> [!MERKSATZ]
> Das Dockerfile ist das Rezept, `docker build` backt daraus das Image, `docker run` startet einen Container.

## Die wichtigsten Anweisungen

| Anweisung | Wirkung |
|---|---|
| `FROM node:24-alpine` | [[basis-image|Basis-Image]], auf dem alles aufbaut – immer die erste Anweisung |
| `WORKDIR /app` | Arbeitsverzeichnis für alle folgenden Anweisungen (wird bei Bedarf angelegt) |
| `COPY src/ ./src/` | Dateien aus dem Build-Kontext ins Image kopieren |
| `RUN npm ci` | Befehl **beim Bauen** ausführen, das Ergebnis landet im Image |
| `ENV NODE_ENV=production` | Umgebungsvariable im Image und in jedem Container |
| `ARG VERSION` | Variable, die es nur während des Builds gibt (`--build-arg`) |
| `EXPOSE 3000` | Dokumentiert den Port – veröffentlicht ihn aber nicht |
| `USER node` | Benutzer, unter dem folgende Befehle und der Container laufen |
| `CMD [...]` | Standardbefehl **beim Start** des Containers |
| `ENTRYPOINT [...]` | Fester Startbefehl; CMD liefert dann nur die Argumente |

Die Anweisungen schreibt man per Konvention groß. Kommentare beginnen mit `#`.

> [!FEHLER]
> `RUN cd /app` wirkt nicht auf die nächsten Zeilen – jede `RUN`-Anweisung startet eine frische Shell.
> Das Arbeitsverzeichnis setzt du immer mit `WORKDIR`.

## Der Build-Kontext

Bei `docker build -t node-app:1.0 .` ist der Punkt der Build-Kontext: der Ordner, den Docker an den Builder
schickt. `COPY` kann **nur** Dateien aus diesem Ordner ins Image holen.

```text title="Build-Kontext"
node-app/            ← Build-Kontext „.“
├── Dockerfile
├── package.json
├── package-lock.json
└── server.js
```

`COPY ../geheim.txt .` funktioniert deshalb nicht. Umgekehrt landet ohne Vorsorge **alles** im Kontext – auch
`node_modules`, `.git` oder eine `.env`-Datei. Wie du das verhinderst, lernst du in der nächsten Lektion mit
`.dockerignore`.

Seit Docker Engine 23 baut immer **[[buildkit|BuildKit]]**, der moderne Builder. Er baut parallel, cached klug und kann
Secrets sicher in den Build reichen.

## CMD, ENTRYPOINT und die Exec-Form

`CMD` und `ENTRYPOINT` gibt es in zwei Schreibweisen:

| Form | Beispiel | Was startet wirklich |
|---|---|---|
| [[exec-form|Exec-Form]] | `CMD ["node", "server.js"]` | `node` direkt als Prozess 1 |
| Shell-Form | `CMD node server.js` | `/bin/sh -c "node server.js"` |

Bei `docker stop` schickt Docker das [[signal|Signal]] SIGTERM an Prozess 1. In der Shell-Form ist das die Shell –
und die reicht das Signal oft nicht weiter. Nach 10 Sekunden beendet Docker den Container dann hart, deine App
kann nicht sauber herunterfahren. Nutze deshalb die Exec-Form.

```dockerfile title="ENTRYPOINT plus CMD"
ENTRYPOINT ["php", "artisan"]
CMD ["list"]
```

Ein [[entrypoint|ENTRYPOINT]] legt das Programm fest, `CMD` die Standard-Argumente. `docker run image migrate`
ersetzt nur das CMD – heraus kommt `php artisan migrate`.

> [!PRAXIS]
> Offizielle Images haben oft schon ein sinnvolles `ENTRYPOINT`-Skript, das z. B. eine Datenbank initialisiert.
> Überschreibst du es versehentlich, fehlen diese Schritte. Lies vorher die Image-Doku.

## Zusammenfassung

- Ein **Dockerfile** ist das Rezept; `docker build -t name:tag .` baut daraus ein Image.
- `FROM` kommt zuerst; `WORKDIR` setzt das Arbeitsverzeichnis – nicht `RUN cd`.
- `RUN` wirkt beim Bauen, `CMD`/`ENTRYPOINT` beim Starten.
- Der **Build-Kontext** (der Punkt) ist alles, was `COPY` sehen kann.
- `EXPOSE` dokumentiert nur; veröffentlicht wird mit `-p`.
- Nutze die **Exec-Form** `CMD ["…", "…"]`, damit deine App Signale wie SIGTERM bekommt.
