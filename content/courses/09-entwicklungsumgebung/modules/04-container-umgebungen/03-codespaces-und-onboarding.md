---
title: GitHub Codespaces und gutes Onboarding
summary: Wie Codespaces aus der devcontainer.json eine Umgebung in der Cloud macht – und wie ein Setup-Abschnitt in der README alle Bausteine dieses Kurses zusammenführt.
duration: 20
sources:
  - title: GitHub Docs – GitHub Codespaces
    url: https://docs.github.com/de/codespaces/overview
  - title: GitHub Docs – Introduction to dev containers
    url: https://docs.github.com/de/codespaces/setting-up-your-project-for-codespaces/adding-a-dev-container-configuration/introduction-to-dev-containers
  - title: GitHub CLI – gh codespace
    url: https://cli.github.com/manual/gh_codespace
quiz:
  - type: single
    question: Woher weiß GitHub Codespaces, welche Werkzeuge in einem Codespace installiert sein sollen?
    options:
      - Aus der README.md
      - Aus der devcontainer.json im Repository
      - Aus den Einstellungen deines Laptops
    answer: 1
    explanation: Codespaces baut die Umgebung aus `.devcontainer/devcontainer.json`. Ohne diese Datei gibt es nur ein allgemeines Standard-Image.
  - type: multiple
    question: Was sollte ein guter Setup-Abschnitt in der README enthalten?
    options:
      - Die Voraussetzungen (z. B. Docker und mise)
      - Die wenigen Befehle bis zur laufenden App
      - Echte Zugangsdaten zur Datenbank, damit es schneller geht
      - Wo die App danach erreichbar ist
    answers: [0, 1, 3]
    explanation: Zugangsdaten gehören nie in die README – sie kommen in die lokale `.env`, deren Vorlage `.env.example` ist.
  - type: match
    question: Welcher gh-Befehl macht was?
    pairs:
      - { left: "gh codespace create", right: "Einen neuen Codespace anlegen" }
      - { left: "gh codespace list", right: "Deine Codespaces anzeigen" }
      - { left: "gh codespace ssh", right: "Per Terminal in einen Codespace verbinden" }
      - { left: "gh codespace stop", right: "Einen Codespace anhalten, damit er keine Rechenzeit verbraucht" }
    explanation: Codespaces kosten Rechenzeit, solange sie laufen. Nach der Arbeit anhalten spart Kontingent.
tasks:
  - id: codespace-simulation
    type: simulated
    title: Einen Codespace per CLI starten
    description: |
      Die GitHub CLI ist hier nicht mit einem Konto verbunden – deshalb simulieren wir. Das Repository
      `example/shop` hat eine `devcontainer.json`.

      1. Lege einen Codespace an: `gh codespace create --repo example/shop`
      2. Zeige deine Codespaces: `gh codespace list`
      3. Verbinde dich per Terminal: `gh codespace ssh`
      4. Prüfe im Codespace die Node-Version: `node --version`
    prompt: "du@laptop:~$"
    steps:
      - expect: "^gh\\s+codespace\\s+create\\s+(--repo|-R)\\s+example/shop$"
        output: |
          ✓ Codespaces usage for this repository is paid for by du
          shop-a1b2c3
        hint: "gh codespace create --repo example/shop"
      - expect: "^gh\\s+codespace\\s+(list|ls)$"
        output: |
          NAME          DISPLAY NAME    REPOSITORY    BRANCH  STATE      CREATED AT
          shop-a1b2c3   shop codespace  example/shop  main    Available  about 1 minute ago
        hint: "gh codespace list"
      - expect: "^gh\\s+codespace\\s+ssh$"
        output: |
          Welcome to Codespaces!
        prompt: "@du ➜ /workspaces/shop (main) $"
        hint: "gh codespace ssh"
      - expect: "^node\\s+(--version|-v)$"
        output: "v24.11.0"
        hint: "node --version"
    responses:
      - match: "^ls"
        output: "Makefile  README.md  compose.yaml  mise.toml  package.json  src"
  - id: readme-setup
    type: terminal
    title: Ein Setup-Abschnitt für die README
    description: |
      Im Ordner `onboarding` liegt ein Projekt mit Makefile, `.env.example` und Dev-Container. Es fehlt nur
      die Anleitung. Schreibe eine `README.md`:

      1. Erste Zeile: eine Überschrift `# Shop`.
      2. Ein Abschnitt `## Setup` mit
         - einer Liste der Voraussetzungen, in der `Docker` und `mise` vorkommen,
         - einem Code-Block (```` ```bash ````), der `make setup` und `make start` enthält,
         - einem Satz, dass die App unter `http://localhost:8000` erreichbar ist.
      3. Ein Abschnitt `## Dev-Container`, der erwähnt, dass man das Projekt auch in einem Dev-Container
         bzw. in GitHub Codespaces öffnen kann.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: onboarding
    setup: |
      mkdir -p .devcontainer
      printf '{ "name": "Shop", "image": "mcr.microsoft.com/devcontainers/base:ubuntu" }\n' > .devcontainer/devcontainer.json
      printf 'APP_NAME=Shop\nAPP_PORT=8000\n' > .env.example
      printf '.PHONY: setup start\nsetup:\n\t@echo "Setup fertig"\nstart:\n\t@echo "Läuft auf http://localhost:8000"\n' > Makefile
    checks:
      - type: file_contains
        path: README.md
        pattern: "^# Shop"
        message: Die README braucht die Überschrift „# Shop“.
      - type: file_contains
        path: README.md
        pattern: "^## Setup"
        message: Es fehlt der Abschnitt „## Setup“.
      - type: command
        run: awk '/^## /{s=$0} s=="## Setup"' README.md | grep -ci 'docker' && awk '/^## /{s=$0} s=="## Setup"' README.md | grep -c 'mise'
        message: Im Setup-Abschnitt sollen die Voraussetzungen Docker und mise genannt werden.
      - type: command
        run: awk '/^```bash/{c=1;next} /^```/{c=0} c' README.md | tr '\n' ' '
        stdout_matches: "make setup.*make start"
        message: Ein ```bash-Block mit make setup und danach make start fehlt.
      - type: file_contains
        path: README.md
        pattern: "http://localhost:8000"
        message: Nenne die Adresse http://localhost:8000.
      - type: command
        run: awk '/^## /{s=$0} s ~ /^## Dev-Container/' README.md | grep -ciE 'codespaces'
        message: Im Abschnitt „## Dev-Container“ sollen GitHub Codespaces erwähnt werden.
    hints:
      - Schreib die Datei mit `nano README.md` oder einem Heredoc.
      - Ein Code-Block beginnt mit einer Zeile ```` ```bash ```` und endet mit ```` ``` ````.
    solution: |
      ~~~bash
      cd onboarding
      cat > README.md <<'EOF'
      # Shop

      ## Setup

      Voraussetzungen:

      - Docker (mit Docker Compose v2)
      - mise (installiert Node.js und PHP aus der mise.toml)

      ```bash
      git clone git@github.com:example/shop.git
      cd shop
      make setup
      make start
      ```

      Danach ist die App unter http://localhost:8000 erreichbar. `make` zeigt alle weiteren Befehle.

      ## Dev-Container

      Statt lokal zu installieren, kannst du das Projekt in einem Dev-Container öffnen
      („Reopen in Container“) oder direkt in GitHub Codespaces starten.
      EOF
      ~~~
---

Du hast jetzt alle Bausteine: `.editorconfig`, `mise.toml`, `.env.example`, Makefile, Git-Hooks und
`devcontainer.json`. Zwei Fragen bleiben: Wie wird daraus eine Umgebung, die **ohne lokale Installation**
läuft? Und wie erfährt ein neues Teammitglied, wo es anfangen soll?

## GitHub Codespaces

[[codespaces|GitHub Codespaces]] startet einen Dev-Container auf einem Server von GitHub. Du öffnest ihn
im Browser (mit einer VS-Code-Oberfläche) oder verbindest deinen lokalen Editor. Die Grundlage ist
dieselbe `devcontainer.json` wie lokal.

| Vorteil | Nachteil |
|---|---|
| Startklar in Minuten, auch auf schwachen Rechnern oder Tablets | Kostet Rechenzeit (es gibt ein monatliches Freikontingent) |
| Jede Person, jeder Branch bekommt eine frische Umgebung | Braucht eine Internetverbindung |
| Ideal zum Ausprobieren von Pull Requests | Daten liegen auf fremden Servern – Firmenrichtlinien beachten |

Mit der GitHub CLI steuerst du Codespaces auch aus dem Terminal:

```bash title="gh codespace"
gh codespace create --repo example/shop   # anlegen
gh codespace list                         # anzeigen
gh codespace ssh                          # per Terminal verbinden
gh codespace stop                         # anhalten
```

> [!FEHLER]
> **Codespaces laufen lassen.** Ein Codespace verbraucht Kontingent, solange er läuft. Halte ihn nach der
> Arbeit an oder stelle in den Einstellungen ein kurzes Timeout ein.

## Onboarding als Ziel

[[onboarding|Onboarding]] heißt: Ein neues Teammitglied wird arbeitsfähig. Für die Umgebung lässt sich
das messen – wie lange dauert es vom Klonen bis zur laufenden App? Alle Bausteine dieses Kurses zahlen
darauf ein:

| Baustein | Erspart dem neuen Teammitglied … |
|---|---|
| `.editorconfig` | Diskussionen über Formatierung |
| `mise.toml` | Die Suche nach den richtigen Versionen |
| `.env.example` | Rätselraten, welche Variablen gebraucht werden |
| `Makefile` mit `help` | Das Auswendiglernen langer Befehle |
| `.githooks/` | Fehlgeschlagene CI-Läufe wegen Kleinigkeiten |
| `devcontainer.json` | Die gesamte lokale Installation |

> [!MERKSATZ]
> Gutes Onboarding ist kein Dokument mit 40 Schritten, sondern ein Repository, das sich selbst
> einrichtet – plus eine kurze README, die sagt, wo man anfängt.

## Der Setup-Abschnitt in der README

Die [[readme|README]] ist die erste Datei, die jemand öffnet. Ihr Setup-Abschnitt sollte kurz sein:
Voraussetzungen, eine Handvoll Befehle, wo die App läuft.

~~~markdown title="README.md (Ausschnitt)"
## Setup

Voraussetzungen: Docker (Compose v2) und mise.

```bash
make setup   # .env anlegen, Abhängigkeiten installieren, Hooks aktivieren
make start   # Container starten
```

Die App läuft danach unter http://localhost:8000. `make` zeigt alle Befehle.
~~~

Alles Weitere steht im Makefile (`make help`) – die README muss es nicht wiederholen. So kann sie nicht
veralten, wenn sich ein Befehl ändert.

Ergänzend lohnen sich zwei kurze Abschnitte: „Häufige Probleme“ (etwa „Port 8000 belegt? `make start
PORT=9000`“) und ein Hinweis auf den Dev-Container für alle, die nichts lokal installieren möchten.

> [!PRAXIS]
> Lass das nächste neue Teammitglied die README Schritt für Schritt befolgen – ohne Hilfe. Jede Stelle,
> an der es hängen bleibt, ist ein Fehler in eurer Umgebung, nicht in der Person. Repariere sie direkt.

## Zusammenfassung

- GitHub Codespaces startet die `devcontainer.json` auf einem GitHub-Server – im Browser oder im lokalen Editor.
- Codespaces kosten Rechenzeit; nach der Arbeit anhalten.
- Onboarding misst sich an der Zeit vom Klonen bis zur laufenden App.
- Jede Datei des Kurses (`.editorconfig`, `mise.toml`, `.env.example`, Makefile, Hooks, Dev-Container) spart Einrichtungsarbeit.
- Die README nennt Voraussetzungen, wenige Befehle und die Adresse der App – Details stehen in `make help`.
