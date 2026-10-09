# Inhaltsformat (Content-Vertrag)

Alle Lerninhalte von Stacklab liegen in diesem Ordner. Sie werden mit `make import`
(`php artisan stacklab:import`) in die Datenbank übernommen und mit `make validate`
(`php artisan stacklab:validate`) geprüft. Ein Pull Request mit neuen Inhalten muss die Validierung bestehen.

Sprache der Inhalte: **Deutsch** (Du-Form, einfache Sprache). Code und Bezeichner: Englisch.
Niemals echte Zugangsdaten, Hostnamen, Account-IDs oder Firmendaten verwenden – nur Platzhalter wie
`example.com`, `123456789012`, `<dein-token>`, `user@example.com`.

## Ordnerstruktur

```
content/
├── courses/
│   └── 06-git/                     # NN-slug  (NN = Position in der Lernreihenfolge)
│       ├── course.yaml
│       ├── project.yaml            # begleitetes Projekt (Pflicht)
│       ├── exam.yaml               # Abschlussprüfung (Pflicht)
│       └── modules/
│           └── 01-grundlagen/      # NN-slug
│               ├── module.yaml
│               ├── 01-was-ist-git.md
│               └── 02-installation.md
├── glossary/                       # Begriffslexikon, beliebig viele YAML-Dateien
│   └── git.yaml
├── assets/<kurs-slug>/*.svg        # Diagramme, erreichbar unter /assets/<kurs-slug>/…
└── screenshots/<kurs-slug>/*.png   # Screenshots, Quelle in SOURCES.md
```

Slugs: nur `a-z`, `0-9`, `-`. Kurs-Slugs sind global eindeutig, Lektions-Slugs innerhalb eines Kurses.

## course.yaml

```yaml
title: Git
subtitle: Versionskontrolle von null an verstehen
description: >
  Mehrzeilige Beschreibung (Markdown erlaubt).
category: grundlagen        # grundlagen | web | frontend | backend | infrastruktur | abschluss
level: einsteiger           # einsteiger | fortgeschritten | profi
icon: git-branch            # Name eines lucide-Icons
color: "#f05032"
estimated_hours: 12
workspace_dir: git          # Unterordner im Workspace (workspace/git/)
prerequisites: [terminal-shell]   # Kurs-Slugs
learning_goals:
  - Du verstehst, wie Git Änderungen speichert.
references:                  # nur Themen, nie Code oder Daten
  - Git-Konventionen aus realen Teamprojekten (Conventional Commits mit Ticket-Scope)
```

## module.yaml

```yaml
title: Die Grundlagen
description: Was Git ist und wie du dein erstes Repository anlegst.
exercise:                    # größere Übung am Modulende – ein Aufgaben-Objekt (siehe Aufgaben)
  id: modul-uebung
  type: terminal
  # …
```

## Lektion (`NN-slug.md`)

```markdown
---
title: Was ist Git?
summary: Ein Satz, worum es geht.
duration: 15                 # Minuten
sources:
  - title: Pro Git, Kapitel 1
    url: https://git-scm.com/book/de/v2
quiz:   [ … ]                # mindestens 3 Fragen
tasks:  [ … ]                # mindestens 1 interaktive Aufgabe
---

Fließtext in Markdown …
```

### Markdown-Erweiterungen

| Syntax | Wirkung |
|---|---|
| `[[variable]]` / `[[variable\|Variablen]]` | Begriff aus dem Lexikon (Tooltip, Link, Freischaltung). Slug muss existieren. |
| `> [!MERKSATZ]` | Merksatz-Kasten |
| `> [!FEHLER]` | Typischer Fehler |
| `> [!PRAXIS]` | Praxisbezug |
| `> [!TIPP]`, `> [!HINWEIS]`, `> [!ACHTUNG]` | Hinweis-Kästen |
| ` ```js run ` | Editierbarer, im Browser ausführbarer Code-Block (js, ts) |
| ` ```bash title="Terminal" ` | Code-Block mit Titel |
| `![Beschreibung](/assets/git/drei-bereiche.svg)` | Diagramm (SVG) |

Callout-Beispiel:

```markdown
> [!MERKSATZ]
> Ein Commit ist ein Schnappschuss, kein Diff.
```

## Quizfragen

Jede Frage hat eine `explanation` (wird nach dem Antworten gezeigt).

```yaml
- type: single               # genau eine richtige Antwort
  question: Was speichert ein Commit?
  options: [Einen Schnappschuss, Nur die Änderungen, Den Branch-Namen]
  answer: 0                  # Index ab 0
  explanation: …

- type: multiple             # mehrere richtige Antworten
  question: …
  options: [A, B, C, D]
  answers: [0, 2]
  explanation: …

- type: cloze                # Lückentext, ___ markiert eine Lücke
  text: Mit `git ___` legst du ein neues Repository an.
  blanks: [[init]]           # akzeptierte Antworten je Lücke (Groß-/Kleinschreibung egal)
  explanation: …

- type: match                # Zuordnung, z. B. Code ↔ Ausgabe
  question: Ordne jedem Befehl seine Wirkung zu.
  pairs:
    - { left: "git add", right: "Änderung vormerken" }
    - { left: "git commit", right: "Schnappschuss speichern" }
  explanation: …

- type: find-bug             # Finde den Fehler: Zeile anklicken
  question: In welcher Zeile steckt der Fehler?
  language: js
  code: |
    const name = "Ada"
    console.log(nme)
  bug_line: 2                # 1-basiert
  explanation: …
```

## Aufgaben (`tasks`)

Jede Aufgabe hat `id` (eindeutig in der Lektion), `type`, `title`, `description` (Markdown) und optional
`hints` (Liste) und `solution` (Markdown).

### `terminal` – echte Befehle im Übungs-Terminal

```yaml
- id: erstes-repo
  type: terminal
  title: Lege dein erstes Repository an
  description: Erstelle im Ordner `erstes-repo` ein Git-Repository …
  workdir: erstes-repo       # relativ zu workspace/<workspace_dir>/
  setup: |                   # Bash, läuft beim Zurücksetzen im (leeren) workdir
    echo "# Hallo" > README.md
  checks:
    - type: dir_exists       # file_exists | dir_exists | file_absent
      path: .git
      message: Im Ordner gibt es noch kein Repository.
    - type: file_contains
      path: README.md
      pattern: "Hallo"       # regulärer Ausdruck
      message: …
    - type: command
      run: git log --oneline | wc -l
      expect_exit: 0         # Standard 0
      stdout_matches: "^\\s*1\\s*$"   # oder stdout_equals: "1"
      message: Es sollte genau ein Commit existieren.
  hints: [Nutze `git init`.]
  solution: "`git init`"
```

### `simulated` – simuliertes Terminal (SSH, AWS, DNS …)

```yaml
- id: ssh-login
  type: simulated
  title: Melde dich am Server an
  description: …
  prompt: "du@laptop:~$"
  steps:                     # in dieser Reihenfolge zu tippen
    - expect: "^ssh\\s+deploy@203\\.0\\.113\\.10$"   # Regex für den Befehl
      output: |
        Welcome to Ubuntu 24.04 LTS
      prompt: "deploy@server:~$"   # optional: neuer Prompt danach
      hint: Nutze ssh benutzer@ip
  responses:                 # optional: Antworten auf beliebige weitere Befehle
    - match: "^ls"
      output: "app  logs"
```

Für Beispiele nur Dokumentations-Adressen verwenden: `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`,
`2001:db8::/32`, Domains `example.com|org|net`.

### `code` – Programmieraufgabe

```yaml
- id: summe
  type: code
  language: js               # js | ts | jsx | tsx | php
  title: Schreibe add()
  description: …
  starter: |
    function add(a, b) {
    }
  tests:
    - name: addiert zwei Zahlen
      code: assertEqual(add(2, 3), 5)
  solution: |
    function add(a, b) { return a + b }
```

- **js/ts:** Testcode läuft nach deinem Code im selben Gültigkeitsbereich. Helfer: `assertEqual(a, b)`,
  `assertDeepEqual(a, b)`, `assertTrue(x)`, `assertThrows(fn)`. `console.log` wird angezeigt.
- **jsx/tsx (React):** Dein Code muss eine Komponente `App` definieren (React ist als `React` verfügbar,
  Hooks z. B. als `React.useState` oder per `const { useState } = React`). Testcode ist asynchron und hat
  `container`, `query(selector)`, `queryAll(selector)`, `text()`, `click(selector)`, `type(selector, value)`.
- **php:** Läuft im Sandbox-Container (`php`). Testcode ist PHP und nutzt `assert_same($erwartet, $ist)`,
  `assert_true($x)`. Kein `<?php` im Testcode.

### `dragdrop` – Zuordnen per Drag & Drop

```yaml
- id: http-methoden
  type: dragdrop
  title: Ordne die Methoden zu
  description: …
  targets:
    - { id: lesen, label: Daten lesen }
    - { id: anlegen, label: Daten anlegen }
  items:
    - { label: GET, target: lesen }
    - { label: POST, target: anlegen }
```

### `order` – Reihenfolge herstellen

```yaml
- id: request-ablauf
  type: order
  title: Bringe die Schritte in die richtige Reihenfolge
  description: …
  items: [DNS-Auflösung, TCP-Verbindung, TLS-Handshake, HTTP-Request]   # korrekte Reihenfolge
```

### `diagram` – Diagramm ausfüllen

```yaml
- id: drei-bereiche
  type: diagram
  title: Beschrifte das Diagramm
  description: …
  image: /assets/git/drei-bereiche-leer.svg
  slots:                     # Positionen in Prozent des Bildes
    - { x: 15, y: 50, answer: Arbeitsverzeichnis }
    - { x: 50, y: 50, answer: Staging-Bereich }
  distractors: [Remote]      # optionale falsche Beschriftungen
```

### `request` – HTTP-Request zusammenbauen

```yaml
- id: user-anlegen
  type: request
  title: Lege einen Nutzer an
  description: …
  base_url: https://api.example.com
  expected:
    method: POST
    path: "^/users$"         # Regex
    headers: { Content-Type: "application/json" }   # Werte als Regex
    body_contains: ['"name"']
  response:                  # wird bei Erfolg angezeigt
    status: 201
    body: '{"id": 1, "name": "Ada"}'
```

### `steps` – „Was passiert als Nächstes?“

```yaml
- id: browser-ablauf
  type: steps
  title: Was passiert als Nächstes?
  description: …
  steps:
    - situation: Du tippst `example.com` in die Adresszeile und drückst Enter.
      question: Was macht der Browser zuerst?
      options: [Er fragt einen DNS-Server, Er rendert HTML, Er sendet einen POST]
      answer: 0
      explanation: …
```

## project.yaml – begleitetes Projekt

```yaml
title: Dein Portfolio-Repository
description: …
goal: Was am Ende auf deiner Festplatte liegt.
workdir: projekt             # relativ zu workspace/<workspace_dir>/
setup: |                     # optional: Bash, legt die Ausgangslage an (Button „Projekt vorbereiten“)
  git init -q
steps:
  - id: anlegen
    title: Repository anlegen
    description: …           # Markdown
    checklist: [README angelegt, Erster Commit erstellt]
    hints: […]
    checks: […]              # optional, gleiche Check-Typen wie bei terminal-Aufgaben
    solution: …
```

## exam.yaml – Prüfung

```yaml
title: Abschlussprüfung Git
description: …
time_limit_minutes: 45       # optional
pass_percent: 70
questions:                   # Quizfragen + Feld `module` (Modul-Slug) für die Schwächenanalyse
  - module: grundlagen
    type: single
    # …
tasks:                       # Aufgaben (code | terminal) + Feld `module`
  - module: branches
    id: pruefung-branch
    type: terminal
    # …
```

## glossary/*.yaml – Lexikon

```yaml
- slug: repository
  term: Repository
  short: Ein Ordner, dessen Änderungsgeschichte Git verwaltet.
  explanation: >
    Zwei bis vier Sätze in einfacher Sprache.
  example: "`git init` macht aus dem aktuellen Ordner ein Repository."
  category: git
  aliases: [Repo, Repositories]
  related: [commit, branch]
  lesson: git/was-ist-git    # kurs-slug/lektions-slug, in der der Begriff erklärt wird
```

**Jedes** IT-spezifische Wort bekommt einen Eintrag – auch einfache wie „Terminal“ oder „Datei“.
Vor dem Anlegen prüfen, ob der Slug schon existiert (`grep -r "slug: name" content/glossary`).
