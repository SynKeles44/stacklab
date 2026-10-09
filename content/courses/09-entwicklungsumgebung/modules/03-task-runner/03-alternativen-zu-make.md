---
title: npm-Scripts, Composer-Scripts und andere Task-Runner
summary: Wann du npm- und Composer-Scripts nutzt, was Taskfile, just und mise-Tasks anders machen – und wie sie mit einem Makefile zusammenspielen.
duration: 25
sources:
  - title: npm Docs – scripts
    url: https://docs.npmjs.com/cli/v11/using-npm/scripts
  - title: Composer – Scripts
    url: https://getcomposer.org/doc/articles/scripts.md
  - title: Task – Dokumentation (Taskfile.yml)
    url: https://taskfile.dev/docs/guide
  - title: just – Programmer's Manual
    url: https://just.systems/man/en/
  - title: mise – Tasks
    url: https://mise.jdx.dev/tasks/
quiz:
  - type: single
    question: Warum findet `npm run lint` das Programm `eslint`, obwohl es nicht global installiert ist?
    options:
      - npm lädt eslint bei jedem Aufruf neu aus dem Internet.
      - npm hängt `node_modules/.bin` des Projekts für die Dauer des Scripts an PATH.
      - eslint ist Teil von Node.js.
    answer: 1
    explanation: Das ist einer der größten Vorteile von npm-Scripts – sie nutzen automatisch die im Projekt installierten Werkzeuge in der richtigen Version.
  - type: match
    question: Ordne jedem Task-Runner seine Konfigurationsdatei zu.
    pairs:
      - { left: "make", right: "Makefile" }
      - { left: "npm", right: "package.json (scripts)" }
      - { left: "Composer", right: "composer.json (scripts)" }
      - { left: "Task", right: "Taskfile.yml" }
      - { left: "just", right: "justfile" }
    explanation: Jedes Werkzeug hat seine eigene Datei. mise-Tasks stehen zusätzlich als `[tasks]` in der `mise.toml`.
  - type: multiple
    question: Welche Aussagen über npm-Scripts stimmen?
    options:
      - "`npm test` und `npm start` funktionieren ohne `run`."
      - "Für eigene Namen wie `lint` brauchst du `npm run lint`."
      - "Ein Script `pretest` läuft automatisch vor `test`."
      - npm-Scripts können nur JavaScript ausführen.
    answers: [0, 1, 2]
    explanation: "Scripts sind Shell-Befehle – sie können alles aufrufen. `test`, `start`, `stop` und `restart` haben Abkürzungen, `pre`- und `post`-Scripts laufen automatisch drumherum."
  - type: find-bug
    question: In welcher Zeile ist die `package.json` kaputt?
    language: json
    code: |
      {
        "name": "shop",
        "scripts": {
          "dev": "vite",
          "test": "vitest run",
        }
      }
    bug_line: 5
    explanation: JSON erlaubt kein Komma nach dem letzten Eintrag. `npm` bricht mit einem Parse-Fehler ab. Prüfen kannst du JSON mit `jq . package.json`.
tasks:
  - id: scripts-einrichten
    type: terminal
    title: npm- und Composer-Scripts einrichten
    description: |
      Im Ordner `scripts` liegt ein kleines Projekt mit JavaScript (`greet.js`, `greet.test.js`) und PHP
      (`src/App.php`). Es gibt eine `package.json` und eine `composer.json` – aber noch keine Scripts.

      1. Ergänze in der `package.json` einen Abschnitt `scripts` mit
         - `"start": "node greet.js"`
         - `"test": "node --test"`
      2. Ergänze in der `composer.json` einen Abschnitt `scripts` mit `"lint": "php -l src/App.php"`.
      3. Ergänze in der `package.json` ein Script `"check"`, das **erst** `npm test` und **dann**
         `composer run-script lint` ausführt (verbunden mit `&&`).
      4. Probiere alles aus: `npm start`, `npm test`, `composer run-script lint`, `npm run check`.

      Prüfe deine JSON-Dateien zwischendurch mit `jq . package.json`. Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: scripts
    setup: |
      mkdir -p src
      printf 'console.log("Hallo aus npm");\n' > greet.js
      printf 'const test = require("node:test");\nconst assert = require("node:assert");\ntest("rechnet", () => assert.strictEqual(1 + 1, 2));\n' > greet.test.js
      printf '<?php\n\necho "Hallo aus PHP";\n' > src/App.php
      printf '{\n  "name": "demo",\n  "version": "1.0.0",\n  "private": true\n}\n' > package.json
      printf '{\n  "name": "example/demo"\n}\n' > composer.json
    checks:
      - type: command
        run: jq -e . package.json > /dev/null && jq -e . composer.json > /dev/null
        message: package.json oder composer.json ist kein gültiges JSON – prüfe Kommas und Anführungszeichen mit jq.
      - type: command
        run: npm start --silent
        stdout_matches: "Hallo aus npm"
        message: npm start soll node greet.js ausführen.
      - type: command
        run: jq -r '.scripts.test' package.json
        stdout_equals: node --test
        message: In der package.json fehlt "test" mit dem Wert "node --test".
      - type: command
        run: composer run-script lint 2>&1
        stdout_matches: "No syntax errors detected"
        message: composer run-script lint soll php -l src/App.php ausführen.
      - type: command
        run: npm run check 2>&1
        stdout_matches: "pass 1[\\s\\S]*No syntax errors detected"
        message: npm run check soll zuerst die Tests und danach composer run-script lint ausführen.
    hints:
      - "Der scripts-Abschnitt ist ein Objekt: `\"scripts\": { \"start\": \"node greet.js\", \"test\": \"node --test\" }`"
      - "Achte auf das Komma **zwischen** Einträgen und kein Komma nach dem letzten."
      - "`\"check\": \"npm test && composer run-script lint\"`"
    solution: |
      ```bash
      cd scripts
      jq '.scripts = {"start": "node greet.js", "test": "node --test", "check": "npm test && composer run-script lint"}' package.json > package.tmp && mv package.tmp package.json
      jq '.scripts = {"lint": "php -l src/App.php"}' composer.json > composer.tmp && mv composer.tmp composer.json
      npm start
      npm run check
      ```
  - id: runner-waehlen
    type: steps
    title: Welcher Task-Runner passt?
    description: Für jede Situation gibt es einen naheliegenden Task-Runner. Wähle.
    steps:
      - situation: Ein reines React-Projekt. Du willst den Vite-Dev-Server starten und Vitest ausführen.
        question: Wo legst du die Befehle ab?
        options: [In den scripts der package.json, In einer composer.json, In einem justfile]
        answer: 0
        explanation: Im JavaScript-Ökosystem sind npm-Scripts der Standard – jede:r erwartet `npm run dev` und `npm test`.
      - situation: Ein Laravel-Paket ohne Frontend. Du willst Pest und PHPStan mit festen Optionen starten.
        question: Was ist naheliegend?
        options: [npm-Scripts, Composer-Scripts, Taskfile]
        answer: 1
        explanation: "Composer-Scripts liegen dort, wo PHP-Entwickler:innen suchen, und finden `vendor/bin` automatisch."
      - situation: Ein Projekt mit Laravel-Backend, React-Frontend und Docker Compose. Neue Leute sollen mit einem Befehl starten.
        question: Was bündelt alles am besten?
        options: [Nur npm-Scripts, Ein Makefile (oder Taskfile/just) als Bedienfeld, Eine Wiki-Seite]
        answer: 1
        explanation: Ein übergeordneter Task-Runner ruft Compose, Composer und npm auf. Die Sprach-Scripts bleiben trotzdem bestehen.
---

Make ist nicht der einzige Task-Runner. Viele Ökosysteme bringen einen eigenen mit, und moderne
Werkzeuge wollen make's Eigenheiten (Tabs, `$$`, Datei-Logik) loswerden. Hier lernst du die wichtigsten
kennen – und wann welcher passt.

## npm-Scripts

Jedes JavaScript-Projekt hat eine `package.json`. Im Abschnitt `scripts` stehen benannte Befehle – ein
[[npm-script|npm-Script]] pro Eintrag:

```json title="package.json"
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run",
    "lint": "eslint .",
    "check": "npm run lint && npm test"
  }
}
```

| Aufruf | Bemerkung |
|---|---|
| `npm test`, `npm start` | Kurzformen ohne `run` |
| `npm run lint` | Eigene Namen brauchen `run` |
| `npm run` | Listet alle Scripts auf |
| `pretest`, `posttest` | Laufen automatisch vor bzw. nach `test` |

Der wichtigste Vorteil: Während ein Script läuft, hängt npm `node_modules/.bin` an `PATH`. `eslint` und
`vite` werden also in der Version aus dem Projekt gefunden, ohne globale Installation. Bun versteht
dieselben Scripts mit `bun run`.

Außerhalb von Scripts erreichst du dieselben Werkzeuge mit `npx eslint .` – auch hier gewinnt die
Version aus `node_modules`. Scripts sind trotzdem besser: Der Befehl samt Optionen steht an einer Stelle,
und alle im Team rufen ihn gleich auf.

> [!FEHLER]
> **Ein Komma zu viel.** JSON erlaubt kein Komma nach dem letzten Eintrag und keine Kommentare. Prüfe
> eine kaputte `package.json` mit `jq . package.json` – jq zeigt Zeile und Spalte des Fehlers.

## Composer-Scripts

Im PHP-Ökosystem gibt es dasselbe Prinzip in der `composer.json`:

```json title="composer.json"
{
  "scripts": {
    "test": "pest",
    "analyse": "phpstan analyse --memory-limit=1G",
    "lint": "pint --test",
    "check": ["@lint", "@analyse", "@test"]
  }
}
```

Aufgerufen wird mit `composer run-script lint` oder kurz `composer lint`. `@lint` ruft ein anderes Script
auf; eine Liste führt mehrere Befehle nacheinander aus. Wie bei npm wird `vendor/bin` automatisch
gefunden.

## Taskfile, just und mise-Tasks

Neuere Task-Runner nehmen die Idee von make, lassen aber die Altlasten weg:

| Werkzeug | Datei | Besonderheit |
|---|---|---|
| Task | `Taskfile.yml` | YAML statt Tabs, eingebaute Beschreibungen (`task --list`) |
| just | `justfile` | make-ähnliche Syntax, aber ohne Datei-Logik und `.PHONY`; Parameter für Rezepte |
| mise | `mise.toml` (`[tasks]`) | Tasks direkt neben den Tool-Versionen; laufen mit den richtigen Versionen |

```toml title="mise.toml mit Tasks"
[tools]
node = "24"

[tasks.test]
description = "Führt alle Tests aus"
run = "npm test"
```

`mise run test` führt den Task aus – garantiert mit Node.js 24. Der Haken bei allen dreien: Sie müssen
erst installiert werden, während make fast überall schon da ist.

> [!MERKSATZ]
> Sprach-Scripts (npm, Composer) gehören zu ihrem Ökosystem. Ein übergeordneter Task-Runner (make, Task,
> just, mise) bündelt alles für das ganze Projekt.

## Wie sie zusammenspielen

In gemischten Projekten ergänzen sich die Ebenen. Die Sprach-Scripts machen die Detailarbeit, das
Makefile ist das Bedienfeld:

```makefile title="Makefile ruft die Sprach-Scripts auf"
test: ## Führt alle Tests aus (PHP und JavaScript)
	docker compose exec app composer test
	npm test
```

> [!PRAXIS]
> Achte darauf, dass jeder Befehl nur **eine** Quelle der Wahrheit hat. Steht die PHPStan-Option sowohl
> im Makefile als auch in der `composer.json`, laufen die beiden irgendwann auseinander. Lass das
> Makefile lieber `composer analyse` aufrufen.

## Zusammenfassung

- npm-Scripts stehen in der `package.json`; `npm run name` startet sie, `npm test`/`npm start` gehen ohne `run`.
- npm und Composer finden Werkzeuge aus `node_modules/.bin` bzw. `vendor/bin` automatisch.
- Composer-Scripts stehen in der `composer.json`; `@name` ruft andere Scripts auf.
- Task (`Taskfile.yml`), just (`justfile`) und mise-Tasks sind moderne Alternativen zu make.
- In gemischten Projekten ruft ein Makefile die Sprach-Scripts auf – jeder Befehl hat eine Quelle.
