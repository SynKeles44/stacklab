---
title: Layer, Build-Cache und .dockerignore
summary: Warum ein Image aus Schichten besteht, wie der Build-Cache funktioniert und wie du ein Dockerfile so ordnest, dass Builds Sekunden statt Minuten dauern.
duration: 25
sources:
  - title: Docker Docs – Understanding the image layers
    url: https://docs.docker.com/get-started/docker-concepts/building-images/understanding-image-layers/
  - title: Docker Docs – Using the build cache
    url: https://docs.docker.com/get-started/docker-concepts/building-images/using-the-build-cache/
  - title: Docker Docs – Build cache invalidation
    url: https://docs.docker.com/build/cache/invalidation/
  - title: Docker Docs – .dockerignore files
    url: https://docs.docker.com/build/concepts/context/#dockerignore-files
quiz:
  - type: single
    question: Du änderst eine einzige Zeile in `server.js`. Im Dockerfile steht `COPY . .` direkt nach `FROM` und danach `RUN npm ci`. Was passiert beim nächsten Build?
    options:
      - Nur die COPY-Zeile wird neu ausgeführt, npm ci kommt aus dem Cache.
      - Die COPY-Zeile und alle Anweisungen danach – also auch `npm ci` – werden neu ausgeführt.
      - Das ganze Image inklusive Basis-Image wird neu heruntergeladen.
      - Gar nichts, Docker erkennt Code-Änderungen nicht.
    answer: 1
    explanation: >
      Ändert sich der Inhalt der kopierten Dateien, ist der Cache für diesen Layer ungültig – und damit für alle
      Layer darüber. Deshalb kopiert man zuerst nur `package.json` und `package-lock.json`, installiert, und kopiert
      erst danach den restlichen Code.
  - type: multiple
    question: Was gehört typischerweise in eine `.dockerignore` einer Node-Anwendung?
    options:
      - "`node_modules`"
      - "`.git`"
      - "`.env`"
      - "`package.json`"
    answers: [0, 1, 2]
    explanation: >
      `node_modules` wird im Image frisch installiert, `.git` ist groß und unnötig, `.env` enthält Geheimnisse.
      `package.json` braucht der Build dagegen unbedingt.
  - type: cloze
    text: Jede Anweisung, die das Dateisystem ändert (z. B. `RUN`, `COPY`), erzeugt einen neuen ___. Ändert sich einer davon, baut Docker ihn und alle ___ ihm neu.
    blanks:
      - [Layer, Schicht, Image-Layer]
      - [über, nach, darüber]
    explanation: Layer bauen aufeinander auf. Ein geänderter Layer macht den Cache für alle folgenden Layer ungültig.
  - type: find-bug
    question: Dieses Dockerfile installiert bei jeder Code-Änderung alle Pakete neu. Welche Zeile müsste stattdessen nur die Paketdateien kopieren?
    language: dockerfile
    code: |
      FROM node:24-alpine
      WORKDIR /app
      COPY . .
      RUN npm ci --omit=dev
      CMD ["node", "server.js"]
    bug_line: 3
    explanation: >
      Richtig wäre zuerst `COPY package.json package-lock.json ./`, dann `RUN npm ci --omit=dev` und erst danach
      `COPY . .`. So bleibt der teure Install-Layer im Cache, solange sich die Abhängigkeiten nicht ändern.
tasks:
  - id: cache-freundlich
    type: terminal
    title: Dockerfile cache-freundlich umbauen
    description: |
      Klicke zuerst auf **Aufgabe vorbereiten**. Im Ordner `cache-app` liegt eine Node-Anwendung mit einem
      Dockerfile, das bei jeder Code-Änderung alle Pakete neu installiert. Außerdem liegen dort `node_modules`,
      ein `.git`-Ordner und eine `.env` mit einem Passwort – all das würde heute im Build-Kontext landen.

      1. Ändere das `Dockerfile` so, dass zuerst **nur** `package.json` und `package-lock.json` nach `./` kopiert
         werden, danach `RUN npm ci --omit=dev` läuft und erst dann `COPY . .` folgt.
      2. Lege eine `.dockerignore` an, die `node_modules`, `.git` und `.env` ausschließt (je eine Zeile).
      3. `FROM`, `WORKDIR` und `CMD` bleiben, wie sie sind.
    workdir: cache-app
    setup: |
      cat > package.json <<'EOF'
      { "name": "cache-app", "version": "1.0.0", "private": true }
      EOF
      cat > package-lock.json <<'EOF'
      { "name": "cache-app", "version": "1.0.0", "lockfileVersion": 3, "requires": true, "packages": { "": { "name": "cache-app", "version": "1.0.0" } } }
      EOF
      echo "console.log('hallo');" > server.js
      mkdir -p node_modules/irgendwas .git
      echo "DB_PASSWORD=geheim" > .env
      cat > Dockerfile <<'EOF'
      FROM node:24-alpine
      WORKDIR /app
      COPY . .
      RUN npm ci --omit=dev
      CMD ["node", "server.js"]
      EOF
    checks:
      - type: command
        run: grep -cE '^COPY\s+(package\.json\s+package-lock\.json|package-lock\.json\s+package\.json|package\*\.json)\s+\./?\s*$' Dockerfile
        stdout_equals: "1"
        message: "Es fehlt eine Zeile, die nur die Paketdateien kopiert: COPY package.json package-lock.json ./"
      - type: command
        run: >-
          awk '/^COPY +package/{p=NR} /^RUN +npm +ci/{r=NR} /^COPY +\. +\.\/? *$/{c=NR} END{print (p && r && c && p<r && r<c) ? "ok" : "falsch"}' Dockerfile
        stdout_equals: ok
        message: "Die Reihenfolge stimmt noch nicht: erst COPY der Paketdateien, dann RUN npm ci --omit=dev, dann COPY . ."
      - type: command
        run: grep -vE '^\s*(#|$)' Dockerfile | head -n 1
        stdout_matches: "^FROM\\s+node:24-alpine\\s*$"
        message: Die erste Anweisung soll weiterhin FROM node:24-alpine sein.
      - type: file_contains
        path: Dockerfile
        pattern: "^CMD\\s+\\[\"node\",\\s*\"server\\.js\"\\]"
        message: Die CMD-Zeile ist verloren gegangen – sie soll bleiben.
      - type: file_exists
        path: .dockerignore
        message: Es gibt noch keine Datei .dockerignore (mit Punkt am Anfang).
      - type: file_contains
        path: .dockerignore
        pattern: "^/?node_modules/?\\s*$"
        message: In .dockerignore fehlt die Zeile node_modules.
      - type: file_contains
        path: .dockerignore
        pattern: "^/?\\.git/?\\s*$"
        message: In .dockerignore fehlt die Zeile .git.
      - type: file_contains
        path: .dockerignore
        pattern: "^/?\\.env\\s*$"
        message: In .dockerignore fehlt die Zeile .env – sonst landet dein Passwort im Image.
    hints:
      - Die teuren, selten geänderten Schritte gehören nach oben, der oft geänderte Code nach unten.
      - "Mit printf 'node_modules\\n.git\\n.env\\n' > .dockerignore legst du die Datei in einem Schritt an."
      - "Neue Reihenfolge: FROM, WORKDIR, COPY package.json package-lock.json ./, RUN npm ci --omit=dev, COPY . ., CMD."
    solution: |
      ```bash
      cd cache-app
      cat > Dockerfile <<'EOF'
      FROM node:24-alpine
      WORKDIR /app
      COPY package.json package-lock.json ./
      RUN npm ci --omit=dev
      COPY . .
      CMD ["node", "server.js"]
      EOF
      printf 'node_modules\n.git\n.env\n' > .dockerignore
      ```
  - id: was-wird-neu-gebaut
    type: steps
    title: Was kommt aus dem Cache?
    description: |
      Dein Dockerfile sieht so aus: `FROM node:24-alpine` → `WORKDIR /app` → `COPY package.json package-lock.json ./`
      → `RUN npm ci --omit=dev` → `COPY . .` → `CMD ["node", "server.js"]`. Du hast es schon einmal gebaut.
    steps:
      - situation: Du änderst eine Zeile in `server.js` und baust neu.
        question: Ab welcher Anweisung baut Docker neu?
        options:
          - Ab `FROM` – alles wird neu gebaut.
          - Ab `RUN npm ci --omit=dev`.
          - Ab `COPY . .` – npm ci kommt aus dem Cache.
        answer: 2
        explanation: Die Paketdateien sind unverändert, also bleibt der Install-Layer gültig. Nur `COPY . .` und alles danach wird neu ausgeführt.
      - situation: Du installierst ein neues Paket – `package.json` und `package-lock.json` ändern sich.
        question: Was passiert jetzt?
        options:
          - Docker baut ab `COPY package.json package-lock.json ./` neu, also auch `npm ci`.
          - Nur `npm ci` läuft neu, die COPY-Zeile kommt aus dem Cache.
          - Nichts, weil sich der Code nicht geändert hat.
        answer: 0
        explanation: Docker vergleicht die Prüfsummen kopierter Dateien. Geänderte Paketdateien machen diesen Layer und alle folgenden ungültig.
      - situation: Du änderst nichts und baust noch einmal.
        question: Wie lange dauert der Build ungefähr?
        options:
          - Wieder einige Minuten.
          - Wenige Sekunden – jeder Layer kommt aus dem Cache.
        answer: 1
        explanation: Ohne Änderungen nutzt Docker für alle Anweisungen den Cache und meldet `CACHED`.
---
Du änderst ein Komma in deinem Code, startest `docker build` – und wartest drei Minuten, weil alle Pakete neu
installiert werden. Das muss nicht sein. Wenn du verstehst, wie Images aus Schichten entstehen, baust du dieselbe
Anwendung in wenigen Sekunden.

## Images bestehen aus Layern

Ein Image ist keine einzelne große Datei, sondern ein Stapel aus [[image-layer|Layern]]. Jede Anweisung, die das
Dateisystem verändert (`RUN`, `COPY`, `ADD`), erzeugt einen neuen Layer. Er enthält nur die **Änderungen**
gegenüber dem Layer darunter.

![Ein Image als Stapel aus Layern, darüber die beschreibbare Container-Schicht](/assets/docker/image-layer.svg)

Layer sind schreibgeschützt und werden geteilt. Bauen zehn deiner Images auf `node:24-alpine` auf, liegt dieses
Basis-Image nur **einmal** auf der Festplatte. Startest du einen Container, legt Docker eine dünne, beschreibbare
Schicht obendrauf – das Prinzip heißt [[copy-on-write|Copy-on-Write]].

```bash title="Layer eines Images ansehen"
docker image history node-app:1.0
```

> [!MERKSATZ]
> Ein Image ist ein Stapel unveränderlicher Layer. Jede `RUN`- oder `COPY`-Anweisung legt einen neuen obendrauf.

## So funktioniert der Build-Cache

Beim Bauen prüft Docker für jede Anweisung: Habe ich genau diesen Schritt schon einmal gebaut? Wenn ja, nimmt es
den fertigen Layer aus dem [[build-cache|Build-Cache]] und schreibt `CACHED` in die Ausgabe.

| Anweisung | Wann ist der Cache ungültig? |
|---|---|
| `RUN …` | Wenn sich der Befehlstext ändert |
| `COPY` / `ADD` | Wenn sich der **Inhalt** der kopierten Dateien ändert |
| jede Anweisung | Wenn ein Layer **darunter** neu gebaut wurde |

Die letzte Zeile ist entscheidend: Ist ein Layer einmal ungültig, werden **alle** folgenden neu gebaut – auch wenn
sie sich selbst nicht geändert haben. Die Reihenfolge deiner Anweisungen bestimmt also, wie viel Arbeit Docker
wiederverwenden kann.

> [!HINWEIS]
> `RUN apt-get update` wird nicht automatisch neu ausgeführt, nur weil es neue Pakete gibt – der Befehlstext ist
> ja gleich. Mit `docker build --no-cache` erzwingst du einen kompletten Neubau.

## Die richtige Reihenfolge

Die Faustregel lautet: **Was sich selten ändert, nach oben. Was sich oft ändert, nach unten.**

```dockerfile title="Cache-freundliches Dockerfile"
FROM node:24-alpine
WORKDIR /app
# 1. Nur die Paketdateien – ändern sich selten
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
# 2. Der Code – ändert sich ständig
COPY . .
CMD ["node", "server.js"]
```

Änderst du jetzt `server.js`, bleibt der teure `npm ci`-Layer gültig. Nur `COPY . .` läuft neu – der Build ist
nach Sekunden fertig. Für PHP gilt dasselbe mit `composer.json` und `composer.lock`.

> [!FEHLER]
> `COPY . .` direkt am Anfang ist der häufigste Grund für langsame Builds. Jede Änderung irgendwo im Projekt
> macht dann den Install-Schritt ungültig.

Zusammengehörige Befehle fasst man außerdem in **ein** `RUN` zusammen, z. B.
`RUN apk add --no-cache git curl`. Das spart Layer, und Aufräumen im selben Schritt macht das Image wirklich kleiner.

## .dockerignore: was nicht in den Kontext gehört

Der Build-Kontext wird komplett an den Builder geschickt. Liegen dort `node_modules` (oft Hunderte MB), der
`.git`-Ordner oder eine `.env` mit Passwörtern, landen sie per `COPY . .` im Image. Eine [[dockerignore|.dockerignore]]
im Kontext-Ordner schließt sie aus – die Syntax kennst du von der [[gitignore|.gitignore]].

```text title=".dockerignore"
node_modules
vendor
.git
.env
*.log
Dockerfile
compose.yaml
```

Drei Vorteile: Der Build startet schneller, das Image wird kleiner, und Geheimnisse rutschen nicht hinein.
Außerdem ändert sich der Kontext seltener, wodurch der Cache länger hält.

> [!PRAXIS]
> In Code-Reviews ist eine fehlende `.dockerignore` ein Klassiker. Eine `.env` im Image ist ein echtes
> Sicherheitsproblem: Jeder, der das Image ziehen kann, kann mit `docker run … cat .env` dein Passwort lesen.

## Zusammenfassung

- Ein Image ist ein Stapel schreibgeschützter **Layer**; Container bekommen eine beschreibbare Schicht obendrauf.
- Der **Build-Cache** verwendet unveränderte Layer wieder und schreibt `CACHED`.
- Ein geänderter Layer macht den Cache für **alle** folgenden Layer ungültig.
- Erst Paketdateien kopieren und installieren, dann den Code kopieren.
- Zusammengehörige Befehle in ein `RUN` packen.
- Eine `.dockerignore` hält `node_modules`, `.git` und `.env` aus Kontext und Image heraus.
