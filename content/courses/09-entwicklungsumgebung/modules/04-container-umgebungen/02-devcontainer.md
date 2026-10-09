---
title: Dev-Container mit devcontainer.json
summary: Wie eine devcontainer.json die komplette Entwicklungsumgebung samt Runtimes, Werkzeugen, Erweiterungen und Ports in einen Container packt.
duration: 25
sources:
  - title: Development Containers – Spezifikation
    url: https://containers.dev/
  - title: devcontainer.json – Referenz
    url: https://containers.dev/implementors/json_reference/
  - title: Dev Container Features
    url: https://containers.dev/features
  - title: VS Code – Developing inside a Container
    url: https://code.visualstudio.com/docs/devcontainers/containers
quiz:
  - type: single
    question: Was ist der Unterschied zwischen einer compose.yaml für Dienste und einem Dev-Container?
    options:
      - Es gibt keinen Unterschied.
      - Beim Dev-Container läuft auch deine Arbeitsumgebung (Runtimes, Werkzeuge, Terminal des Editors) im Container – nicht nur die Dienste.
      - Ein Dev-Container läuft nur in der Cloud.
    answer: 1
    explanation: Mit einem Dev-Container verbindet sich der Editor in den Container. Terminal, Language Server und Erweiterungen laufen dort – auf dem Host brauchst du nur noch Docker und den Editor.
  - type: match
    question: Ordne jede Eigenschaft der devcontainer.json ihrer Aufgabe zu.
    pairs:
      - { left: "image", right: "Grundlage des Containers" }
      - { left: "features", right: "Zusätzliche Werkzeuge wie Node.js oder PHP installieren" }
      - { left: "forwardPorts", right: "Ports aus dem Container auf deinem Rechner erreichbar machen" }
      - { left: "postCreateCommand", right: "Befehl nach dem ersten Erstellen, z. B. make setup" }
    explanation: Mit diesen vier Eigenschaften beschreibst du die meisten Dev-Container.
  - type: find-bug
    question: "`jq . .devcontainer/devcontainer.json` meldet einen Fehler. In welcher Zeile?"
    language: json
    code: |
      {
        "name": "Shop",
        "image": "mcr.microsoft.com/devcontainers/base:ubuntu",
        "forwardPorts": [8000, 5173],
        "postCreateCommand": 'make setup'
      }
    bug_line: 5
    explanation: JSON kennt nur doppelte Anführungszeichen. `'make setup'` muss `"make setup"` heißen.
  - type: cloze
    text: Die Konfiguration liegt in der Datei `.devcontainer/___.json`.
    blanks:
      - [devcontainer]
    explanation: Editoren suchen `.devcontainer/devcontainer.json` (oder `.devcontainer.json` im Wurzelordner).
tasks:
  - id: devcontainer-schreiben
    type: terminal
    title: Eine devcontainer.json schreiben
    description: |
      Im Ordner `devcontainer` liegt ein Projekt mit einem Makefile. Beschreibe seine Entwicklungsumgebung
      als Dev-Container.

      1. Lege den Ordner `.devcontainer` und darin `devcontainer.json` an.
      2. Setze `"name": "Shop"` und als `image` `mcr.microsoft.com/devcontainers/base:ubuntu`.
      3. Füge unter `features` die Features `ghcr.io/devcontainers/features/node:1` mit
         `{ "version": "24" }` und `ghcr.io/devcontainers/features/php:1` mit `{ "version": "8.5" }` hinzu.
      4. Leite die Ports `8000` und `5173` weiter (`forwardPorts`).
      5. Führe nach dem Erstellen `make setup` aus (`postCreateCommand`).
      6. Empfiehl unter `customizations.vscode.extensions` mindestens die Erweiterung `editorconfig.editorconfig`.

      Prüfe die Datei mit `jq . .devcontainer/devcontainer.json` – sie muss gültiges JSON sein
      (Kommentare würden VS Code zwar verstehen, jq aber nicht). Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: devcontainer
    setup: |
      printf '.PHONY: setup\nsetup:\n\t@echo "Setup fertig"\n' > Makefile
    checks:
      - type: command
        run: jq -e . .devcontainer/devcontainer.json > /dev/null
        message: .devcontainer/devcontainer.json fehlt oder ist kein gültiges JSON (prüfe mit jq).
      - type: command
        run: jq -r '.image' .devcontainer/devcontainer.json
        stdout_equals: mcr.microsoft.com/devcontainers/base:ubuntu
        message: Das image soll mcr.microsoft.com/devcontainers/base:ubuntu sein.
      - type: command
        run: jq -r '.features["ghcr.io/devcontainers/features/node:1"].version' .devcontainer/devcontainer.json
        stdout_equals: "24"
        message: Das Node-Feature mit version 24 fehlt.
      - type: command
        run: jq -r '.features["ghcr.io/devcontainers/features/php:1"].version' .devcontainer/devcontainer.json
        stdout_equals: "8.5"
        message: Das PHP-Feature mit version 8.5 fehlt.
      - type: command
        run: jq -c '.forwardPorts | sort' .devcontainer/devcontainer.json
        stdout_equals: "[5173,8000]"
        message: forwardPorts soll genau die Zahlen 8000 und 5173 enthalten (als Zahlen, nicht als Text).
      - type: command
        run: jq -r '.postCreateCommand' .devcontainer/devcontainer.json
        stdout_equals: make setup
        message: postCreateCommand soll make setup sein.
      - type: command
        run: jq -e '.customizations.vscode.extensions | index("editorconfig.editorconfig")' .devcontainer/devcontainer.json
        message: Unter customizations.vscode.extensions fehlt editorconfig.editorconfig.
    hints:
      - "Grundgerüst: `{ \"name\": \"Shop\", \"image\": \"…\", \"features\": { … }, \"forwardPorts\": [8000, 5173] }`"
      - "Feature-IDs sind Schlüssel in einem Objekt: `\"ghcr.io/devcontainers/features/node:1\": { \"version\": \"24\" }`"
      - "Verschachtelung: `\"customizations\": { \"vscode\": { \"extensions\": [\"editorconfig.editorconfig\"] } }`"
    solution: |
      ```bash
      cd devcontainer
      mkdir -p .devcontainer
      cat > .devcontainer/devcontainer.json <<'EOF'
      {
        "name": "Shop",
        "image": "mcr.microsoft.com/devcontainers/base:ubuntu",
        "features": {
          "ghcr.io/devcontainers/features/node:1": { "version": "24" },
          "ghcr.io/devcontainers/features/php:1": { "version": "8.5" }
        },
        "forwardPorts": [8000, 5173],
        "postCreateCommand": "make setup",
        "customizations": {
          "vscode": {
            "extensions": ["editorconfig.editorconfig", "dbaeumer.vscode-eslint"]
          }
        }
      }
      EOF
      jq . .devcontainer/devcontainer.json
      ```
  - id: devcontainer-diagramm
    type: diagram
    title: Beschrifte den Dev-Container
    description: Ordne die Begriffe den Stellen im Diagramm zu. Links ist dein Rechner, rechts der Container.
    image: /assets/entwicklungsumgebung/devcontainer-leer.svg
    slots:
      - { x: 22.5, y: 33, answer: Editor / IDE }
      - { x: 22.5, y: 69, answer: Projektordner }
      - { x: 77.5, y: 33, answer: Node & PHP }
      - { x: 50, y: 49, answer: Port-Weiterleitung }
      - { x: 50, y: 63, answer: Mount }
    distractors: [.env mit Secrets, Dotfiles]
    hints:
      - Die Runtimes laufen im Container, dein Code liegt auf dem Host und wird eingebunden.
---

Mit mise und Docker Compose hast du Runtimes und Dienste im Griff. Trotzdem bleibt ein Rest: Jede Person
muss mise, die richtigen Erweiterungen und ein paar Werkzeuge installieren – und unter Windows sieht
alles ein bisschen anders aus. Ein [[devcontainer|Dev-Container]] geht den letzten Schritt: Die
**gesamte** Arbeitsumgebung läuft in einem Container.

![Editor auf dem Host, Runtimes im Container, Code per Mount, Ports weitergeleitet](/assets/entwicklungsumgebung/devcontainer.svg)

## Die Idee

Der Editor läuft weiter auf deinem Rechner, verbindet sich aber in einen Container. Terminal, Language
Server, Runtimes und Werkzeuge laufen **im Container**. Dein Projektordner wird hineingemountet und
Ports werden zurück auf `localhost` weitergeleitet.

| Was | Wo |
|---|---|
| Editor-Oberfläche | Auf deinem Rechner |
| Projektdateien | Auf deinem Rechner, im Container unter `/workspaces/<projekt>` |
| Node.js, PHP, make, Linter | Im Container |
| Terminal im Editor | Im Container |
| App im Browser | `http://localhost:8000` per Port-Weiterleitung |

Beschrieben wird alles in einer offenen Spezifikation (*Development Containers*). VS Code unterstützt sie
direkt, JetBrains-IDEs wie PhpStorm ebenfalls, und GitHub Codespaces baut darauf auf.

> [!MERKSATZ]
> Ein Dev-Container macht die Umgebung zu Code: Wer das Repository öffnet, bekommt exakt dieselben
> Werkzeuge – auf jedem Betriebssystem.

## Die devcontainer.json

Die Konfiguration liegt in `.devcontainer/devcontainer.json`:

```json title=".devcontainer/devcontainer.json"
{
  "name": "Shop",
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu",
  "features": {
    "ghcr.io/devcontainers/features/node:1": { "version": "24" },
    "ghcr.io/devcontainers/features/php:1": { "version": "8.5" }
  },
  "forwardPorts": [8000, 5173],
  "postCreateCommand": "make setup",
  "customizations": {
    "vscode": { "extensions": ["editorconfig.editorconfig"] }
  }
}
```

| Eigenschaft | Bedeutung |
|---|---|
| `name` | Anzeigename im Editor |
| `image` | Basis-[[docker-image|Image]] des Containers |
| `features` | Fertige Bausteine, die Werkzeuge nachinstallieren |
| `forwardPorts` | [[port|Ports]], die auf deinem Rechner erreichbar werden |
| `postCreateCommand` | Läuft einmal nach dem Erstellen – ideal für `make setup` |
| `customizations.vscode` | Erweiterungen und Einstellungen für VS Code |

## Features, Dockerfile und Compose

[[devcontainer-feature|Features]] sind wiederverwendbare Installationspakete mit einer ID wie
`ghcr.io/devcontainers/features/node:1`. So brauchst du kein eigenes Dockerfile, nur weil Node.js fehlt.

Reicht das nicht, gibt es zwei Alternativen zu `image`:

- `"build": { "dockerfile": "Dockerfile" }` baut aus einem eigenen Dockerfile.
- `"dockerComposeFile": "../compose.yaml"` mit `"service": "app"` und `"workspaceFolder"` nutzt deine
  bestehende Compose-Datei. Der Editor verbindet sich dann mit dem Dienst `app`, Datenbank und Cache
  starten automatisch mit.

> [!FEHLER]
> **Kommentare und jq.** Die `devcontainer.json` darf laut Editoren Kommentare enthalten (JSON with
> Comments). Werkzeuge wie `jq` verstehen das aber nicht. Wer die Datei in Skripten auswertet, verzichtet
> besser auf Kommentare.

## Arbeiten mit dem Dev-Container

In VS Code öffnest du das Projekt und wählst „Reopen in Container“. Beim ersten Mal wird das Image gebaut;
danach startet der Container in Sekunden. Ohne Editor geht es mit der offiziellen CLI:

```bash title="Dev Container CLI"
npx @devcontainers/cli up --workspace-folder .
npx @devcontainers/cli exec --workspace-folder . make test
```

> [!PRAXIS]
> Dev-Container lohnen sich besonders für Onboarding, Workshops und Projekte mit vielen Werkzeugen. Wer
> lieber lokal arbeitet, kann das weiterhin tun – `mise.toml` und `compose.yaml` bleiben gültig. Die
> `devcontainer.json` ist ein zusätzlicher, bequemer Weg.

## Zusammenfassung

- Ein Dev-Container verlagert Runtimes, Werkzeuge und das Editor-Terminal in einen Container.
- Die Beschreibung steht in `.devcontainer/devcontainer.json` im Repository.
- Wichtige Eigenschaften: `image`, `features`, `forwardPorts`, `postCreateCommand`, `customizations`.
- Features installieren Werkzeuge ohne eigenes Dockerfile; alternativ `build` oder `dockerComposeFile`.
- Editoren erlauben Kommentare in der Datei, `jq` nicht – für Skripte reines JSON verwenden.
