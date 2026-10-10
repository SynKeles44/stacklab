---
title: Multi-Stage-Builds, schlanke Basis-Images und Non-Root
summary: Wie du Build-Werkzeuge aus dem fertigen Image heraushältst, das passende Basis-Image wählst und deinen Container ohne root-Rechte laufen lässt.
duration: 25
sources:
  - title: Docker Docs – Multi-stage builds
    url: https://docs.docker.com/build/building/multi-stage/
  - title: Docker Docs – Building best practices
    url: https://docs.docker.com/build/building/best-practices/
  - title: Docker Docs – Dockerfile reference (USER)
    url: https://docs.docker.com/reference/dockerfile/#user
quiz:
  - type: single
    question: Was landet bei einem Multi-Stage-Build im finalen Image?
    options:
      - Alle Layer aller Stages.
      - Nur die Layer der letzten Stage – plus das, was du mit `COPY --from=…` ausdrücklich herüberkopierst.
      - Nur die erste Stage.
      - Nur der Quellcode, ohne Basis-Image.
    answer: 1
    explanation: >
      Frühere Stages sind Werkbänke. Ihr Inhalt (Compiler, Dev-Pakete, Quellcode) wird verworfen. Ins finale Image
      kommt nur, was die letzte Stage selbst enthält oder per `COPY --from` holt.
  - type: multiple
    question: Warum sollte ein Container nicht als root laufen?
    options:
      - Schafft ein Angreifer den Einbruch in die App, hat er im Container sofort alle Rechte.
      - Bei einem Ausbruch aus dem Container wäre er auf dem Host womöglich ebenfalls root.
      - Container mit root starten grundsätzlich langsamer.
      - Es entspricht dem Prinzip der geringsten Rechte.
    answers: [0, 1, 3]
    explanation: Mit Geschwindigkeit hat das nichts zu tun. Es geht darum, den Schaden eines erfolgreichen Angriffs klein zu halten.
  - type: match
    question: Ordne jedem Basis-Image seine typische Eigenschaft zu.
    pairs:
      - { left: "node:24", right: "Komplettes Debian mit vielen Werkzeugen – groß, aber bequem" }
      - { left: "node:24-slim", right: "Abgespecktes Debian – guter Kompromiss" }
      - { left: "node:24-alpine", right: "Winziges Alpine mit musl statt glibc" }
      - { left: "Distroless-Image", right: "Nur Laufzeit, nicht einmal eine Shell" }
    explanation: Je kleiner das Basis-Image, desto weniger Pakete können Sicherheitslücken enthalten – aber desto weniger Werkzeuge hast du zum Debuggen.
  - type: cloze
    text: Eine Stage benennst du mit `FROM node:24-alpine ___ build`. Dateien daraus holst du mit `COPY ___=build /app/dist ./dist`.
    blanks:
      - [AS, as]
      - [--from]
    explanation: "`AS name` gibt der Stage einen Namen, `COPY --from=name` kopiert aus ihr."
tasks:
  - id: multi-stage-api
    type: terminal
    title: Ein Multi-Stage-Dockerfile für eine TypeScript-API
    description: |
      Klicke zuerst auf **Aufgabe vorbereiten**. Im Ordner `ts-api` liegt eine kleine TypeScript-API. `npm run build`
      übersetzt `src/` nach `dist/`. Zum Bauen braucht sie Dev-Abhängigkeiten, zur Laufzeit nicht.

      Schreibe ein `Dockerfile` mit **zwei** Stages:

      1. Stage `build` auf `node:24-alpine`: Arbeitsverzeichnis `/app`, Paketdateien kopieren, `RUN npm ci`,
         Code kopieren, `RUN npm run build`.
      2. Finale Stage auf `node:24-alpine`: `ENV NODE_ENV=production`, Arbeitsverzeichnis `/app`, Paketdateien
         kopieren, `RUN npm ci --omit=dev`.
      3. Kopiere mit `COPY --from=build --chown=node:node /app/dist ./dist` das Build-Ergebnis herüber.
      4. Wechsle mit `USER node` auf den unprivilegierten Benutzer, **bevor** `CMD ["node", "dist/server.js"]` folgt.
    workdir: ts-api
    setup: |
      mkdir -p src
      cat > package.json <<'EOF'
      {
        "name": "ts-api",
        "version": "1.0.0",
        "private": true,
        "scripts": { "build": "tsc" },
        "devDependencies": { "typescript": "^7.0.0" }
      }
      EOF
      echo '{ "compilerOptions": { "outDir": "dist", "rootDir": "src", "module": "nodenext", "target": "es2024" } }' > tsconfig.json
      echo 'console.log("api läuft");' > src/server.ts
      printf 'node_modules\ndist\n.git\n.env\n' > .dockerignore
    checks:
      - type: file_exists
        path: Dockerfile
        message: Es gibt noch kein Dockerfile.
      - type: command
        run: grep -ciE '^FROM\s' Dockerfile
        stdout_equals: "2"
        message: Ein Multi-Stage-Build braucht hier genau zwei FROM-Zeilen.
      - type: command
        run: grep -E '^FROM\s' Dockerfile | head -n 1
        stdout_matches: "^FROM\\s+node:24-alpine\\s+(AS|as)\\s+build\\s*$"
        message: "Die erste Stage soll so beginnen: FROM node:24-alpine AS build"
      - type: command
        run: grep -E '^FROM\s' Dockerfile | tail -n 1
        stdout_matches: "^FROM\\s+node:24-alpine\\s*$"
        message: "Die finale Stage beginnt mit FROM node:24-alpine (ohne AS)."
      - type: command
        run: awk '/^FROM/{s++} s==1 && /^RUN +npm +run +build/{print "ok"}' Dockerfile
        stdout_equals: ok
        message: In der build-Stage fehlt RUN npm run build.
      - type: command
        run: awk '/^FROM/{s++} s==2 && /^RUN +npm +ci +--omit=dev *$/{print "ok"}' Dockerfile
        stdout_equals: ok
        message: In der finalen Stage fehlt RUN npm ci --omit=dev.
      - type: command
        run: awk '/^FROM/{s++} s==2 && /^ENV +NODE_ENV=production *$/{print "ok"}' Dockerfile
        stdout_equals: ok
        message: In der finalen Stage fehlt ENV NODE_ENV=production.
      - type: command
        run: awk '/^FROM/{s++} s==2 && /^COPY +--from=build +--chown=node:node +\/app\/dist +\.\/dist\/? *$/{print "ok"}' Dockerfile
        stdout_equals: ok
        message: "In der finalen Stage fehlt COPY --from=build --chown=node:node /app/dist ./dist"
      - type: command
        run: >-
          awk '/^FROM/{s++} s==2 && /^USER +node *$/{u=NR} s==2 && /^CMD/{c=NR} END{print (u && c && u<c) ? "ok" : "falsch"}' Dockerfile
        stdout_equals: ok
        message: In der finalen Stage muss USER node vor der CMD-Zeile stehen.
      - type: file_contains
        path: Dockerfile
        pattern: "^CMD\\s+\\[\\s*\"node\"\\s*,\\s*\"dist/server\\.js\"\\s*\\]\\s*$"
        message: 'Starte mit CMD ["node", "dist/server.js"] in der Exec-Form.'
    hints:
      - Jede Stage beginnt mit einer eigenen FROM-Zeile. Nur die erste bekommt den Namen `AS build`.
      - In beiden Stages kopierst du zuerst `package.json package-lock.json ./` – wegen des Caches.
      - "Finale Stage: FROM, ENV, WORKDIR, COPY package…, RUN npm ci --omit=dev, COPY --from=build …, USER node, CMD."
    solution: |
      ```bash
      cd ts-api
      cat > Dockerfile <<'EOF'
      FROM node:24-alpine AS build
      WORKDIR /app
      COPY package.json package-lock.json ./
      RUN npm ci
      COPY . .
      RUN npm run build

      FROM node:24-alpine
      ENV NODE_ENV=production
      WORKDIR /app
      COPY package.json package-lock.json ./
      RUN npm ci --omit=dev
      COPY --from=build --chown=node:node /app/dist ./dist
      USER node
      CMD ["node", "dist/server.js"]
      EOF
      ```
  - id: sicher-oder-riskant
    type: dragdrop
    title: Sicher oder riskant?
    description: Ordne jede Dockerfile-Praxis ein.
    targets:
      - { id: gut, label: Gute Praxis }
      - { id: riskant, label: Riskant oder verschwenderisch }
    items:
      - { label: "USER node vor CMD", target: gut }
      - { label: "FROM node:latest", target: riskant }
      - { label: "COPY --from=build nur mit dem Build-Ergebnis", target: gut }
      - { label: "ENV DB_PASSWORD=geheim im Dockerfile", target: riskant }
      - { label: "FROM node:24-alpine statt node:24", target: gut }
      - { label: "Compiler und Dev-Pakete im finalen Image", target: riskant }
    hints:
      - Alles, was im Image steht, kann jeder lesen, der das Image ziehen darf.
---
Deine Node-App ist 2 MB groß – das Image aber 1,2 GB. Darin stecken Compiler, Testwerkzeuge, der komplette
Quellcode und ein ganzes Debian. Alles davon muss heruntergeladen, gespeichert und auf Sicherheitslücken geprüft
werden. In dieser Lektion machst du Images klein und sicher.

## Das Problem: Bauen braucht mehr als Laufen

Zum **Bauen** einer Anwendung brauchst du viel: den TypeScript-Compiler, Vite, Dev-Abhängigkeiten, manchmal
`git` oder `gcc`. Zum **Laufen** braucht sie fast nichts davon – nur die Laufzeit und das Build-Ergebnis.

In einem Dockerfile mit nur einer Stage landet trotzdem alles im Image. Selbst wenn du am Ende `rm -rf` ausführst:
Die Dateien stecken weiter in den Layern darunter.

| Im Image | Nötig zum Bauen | Nötig zur Laufzeit |
|---|---|---|
| Node.js | ja | ja |
| TypeScript, Vite, Testtools | ja | nein |
| `src/` mit Quellcode | ja | nein |
| `dist/` mit dem Ergebnis | – | ja |

## Multi-Stage-Builds

Ein [[multi-stage-build|Multi-Stage-Build]] hat mehrere `FROM`-Zeilen. Jede beginnt eine neue Stage mit frischem
Dateisystem. Frühere Stages sind Werkbänke – ins finale Image kommt nur die **letzte** Stage.

![Ein Multi-Stage-Build: Die Build-Stage wird verworfen, nur das Ergebnis wandert ins finale Image](/assets/docker/multi-stage.svg)

```dockerfile title="Frontend: bauen mit Node, ausliefern mit Nginx"
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.30-alpine
COPY --from=build /app/dist /usr/share/nginx/html
```

`AS build` gibt der Stage einen Namen, `COPY --from=build` holt gezielt Dateien heraus. Aus über einem Gigabyte
Werkbank werden so wenige Dutzend Megabyte.

> [!MERKSATZ]
> Baue in einer Stage, liefere aus einer anderen. Ins finale Image kommt nur, was du ausdrücklich herüberkopierst.

Mit `docker build --target build .` baust du übrigens nur bis zu einer bestimmten Stage – praktisch für Tests.

## Das passende Basis-Image

Das Basis-Image bestimmt Größe und Angriffsfläche. Jedes Paket darin kann eine [[cve|bekannte Sicherheitslücke]]
haben – auch wenn deine App es nie benutzt.

| Variante | Basis | Ungefähre Größe | Geeignet für |
|---|---|---|---|
| `node:24` | Debian, viele Tools | ~1 GB | Build-Stages |
| `node:24-slim` | Debian, abgespeckt | ~250 MB | Laufzeit, wenn glibc nötig ist |
| `node:24-alpine` | Alpine, musl | ~60 MB | Laufzeit, Standardwahl |
| [[distroless-image\|Distroless]] | nur Laufzeit | ~50 MB | Produktion mit hohen Sicherheitsanforderungen |

> [!FEHLER]
> Alpine nutzt die C-Bibliothek musl statt glibc. Manche vorkompilierten Pakete (z. B. native Node-Module) laufen
> darauf nicht. Gibt es seltsame Fehler beim Start, probiere die `-slim`-Variante.

Pinne außerdem immer eine Version (`node:24-alpine` statt `node:latest`). Wer ganz sicher gehen will, pinnt
zusätzlich den Digest: `node:24-alpine@sha256:…`.

## Nicht als root laufen

Ohne weitere Angabe läuft ein Container als [[root]]. Findet ein Angreifer eine Lücke in deiner App, hat er im
Container sofort alle Rechte – und bei einem Ausbruch aus dem Container womöglich auch auf dem Host. Das
[[least-privilege|Prinzip der geringsten Rechte]] sagt: Gib nur so viele Rechte wie nötig.

```dockerfile title="Als unprivilegierter Benutzer laufen"
COPY --from=build --chown=node:node /app/dist ./dist
USER node
CMD ["node", "dist/server.js"]
```

- Die offiziellen Node-Images bringen den Benutzer `node` mit, die PHP-Images den Benutzer `www-data`.
- `USER` gilt für alle folgenden `RUN`-Befehle **und** für den gestarteten Container. Pakete installierst du
  deshalb vorher, solange du noch root bist.
- `--chown` setzt den Besitzer kopierter Dateien, damit dein Benutzer sie lesen (und falls nötig schreiben) kann.
- Als Nicht-root darf der Prozess keine Ports unter 1024 öffnen – lass die App z. B. auf 3000 oder 8080 lauschen.

> [!PRAXIS]
> Viele Plattformen (z. B. Kubernetes mit strengen Richtlinien) verweigern Container, die als root laufen wollen.
> Wer `USER` von Anfang an setzt, erspart sich später Umbauten.

## Zusammenfassung

- Ein **Multi-Stage-Build** trennt Werkbank und Auslieferung; nur die letzte Stage wird zum Image.
- `FROM … AS name` benennt eine Stage, `COPY --from=name` holt gezielt Dateien heraus.
- Kleine Basis-Images (`-alpine`, `-slim`, Distroless) bedeuten weniger Download und weniger Angriffsfläche.
- Alpine nutzt musl – bei Problemen mit nativen Modulen auf `-slim` ausweichen.
- Setze `USER` auf einen unprivilegierten Benutzer und nutze `--chown` beim Kopieren.
- Pinne Versionen statt `latest`, für maximale Sicherheit zusätzlich den Digest.
