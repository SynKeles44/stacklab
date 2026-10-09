---
title: Skripte als Bedienoberfläche des Projekts
summary: Mit npm-Skripten, Composer-Skripten und Makefile-Targets bekommt jedes Projekt einheitliche Befehle wie dev, test und build.
duration: 25
sources:
  - title: npm – scripts
    url: https://docs.npmjs.com/cli/using-npm/scripts
  - title: npm – npm run
    url: https://docs.npmjs.com/cli/commands/npm-run
  - title: Composer – Scripts
    url: https://getcomposer.org/doc/articles/scripts.md
  - title: GNU make – Phony Targets
    url: https://www.gnu.org/software/make/manual/html_node/Phony-Targets.html
quiz:
  - type: single
    question: Warum definiert man Befehle wie `test` als Skript, statt sie in der README zu erklären?
    options:
      - Weil Skripte schneller laufen als normale Befehle.
      - Damit alle denselben, versionierten Befehl mit einem kurzen Namen ausführen.
      - Weil npm sonst keine Tests findet.
      - Weil man in der README keine Befehle schreiben darf.
    answer: 1
    explanation: Ein Skript ist ein Befehl mit Namen, der mit dem Projekt mitwandert. Ändert sich der Befehl, ändert man ihn an einer Stelle – alle nutzen weiter npm test.
  - type: match
    question: Wie startest du das Skript in welchem Werkzeug?
    pairs:
      - { left: "Skript build in package.json", right: "npm run build" }
      - { left: "Skript test in package.json", right: "npm test" }
      - { left: "Skript analyse in composer.json", right: "composer run analyse" }
      - { left: "Target setup im Makefile", right: "make setup" }
    explanation: Für test, start und einige andere Namen kennt npm Kurzformen ohne run.
  - type: find-bug
    question: "`make test` meldet „missing separator“. Welche Zeile ist falsch?"
    language: bash
    code: |
      .PHONY: test lint

      test:
          npm test

      lint:
      	npm run lint
    bug_line: 4
    explanation: Befehle unter einem Target müssen mit einem Tab beginnen, nicht mit Leerzeichen. Zeile 7 ist richtig eingerückt, Zeile 4 nicht.
  - type: cloze
    text: Ein npm-Skript namens `prebuild` läuft automatisch ___ dem Skript `build`. Targets, die keine Dateien erzeugen, trägt man im Makefile unter `.___` ein.
    blanks:
      - [vor]
      - [PHONY]
    explanation: pre- und post-Skripte laufen automatisch vor bzw. nach dem gleichnamigen Skript. .PHONY sagt make, dass ein Target kein Dateiname ist.
tasks:
  - id: npm-skripte-anlegen
    type: terminal
    title: npm-Skripte und ein Makefile anlegen
    description: |
      Im Ordner `skripte` liegt ein kleines Node-Projekt mit `src/index.js`, `src/sum.js` und einem
      Test in `tests/sum.test.js`. Es gibt aber noch keine Skripte.

      1. Lege in der `package.json` drei Skripte an:
         - `start` führt `node src/index.js` aus,
         - `test` führt `node --test` aus,
         - `lint` führt `node --check src/index.js src/sum.js` aus (prüft die Syntax).
      2. Probiere sie aus: `npm start`, `npm test`, `npm run lint`.
      3. Lege ein `Makefile` mit den Targets `start`, `test` und `lint` an, die jeweils das passende
         npm-Skript aufrufen. Trage alle drei unter `.PHONY` ein.
      4. Probiere `make test` aus.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: skripte
    setup: |
      mkdir -p src tests
      printf 'export function sum(a, b) {\n  return a + b\n}\n' > src/sum.js
      printf 'import { sum } from "./sum.js"\nconsole.log(`Hallo! 2 + 3 = ${sum(2, 3)}`)\n' > src/index.js
      printf 'import { test } from "node:test"\nimport assert from "node:assert/strict"\nimport { sum } from "../src/sum.js"\n\ntest("sum adds two numbers", () => {\n  assert.equal(sum(2, 3), 5)\n})\n' > tests/sum.test.js
      echo '{ "name": "skripte", "version": "1.0.0", "private": true, "type": "module" }' > package.json
    checks:
      - type: command
        run: npm start --silent
        stdout_matches: "Hallo! 2 \\+ 3 = 5"
        message: npm start funktioniert noch nicht. Das Skript start soll node src/index.js ausführen.
      - type: command
        run: npm test 2>&1 | grep -E "pass [1-9]"
        message: npm test führt noch keinen Test erfolgreich aus. Das Skript test soll node --test ausführen.
      - type: command
        run: jq -r '.scripts.lint' package.json | grep -E "node --check"
        message: Das Skript lint fehlt oder ruft nicht node --check auf.
      - type: command
        run: npm run lint --silent
        message: npm run lint schlägt fehl.
      - type: file_contains
        path: Makefile
        pattern: "^\\.PHONY:.*\\bstart\\b"
        message: Trage die Targets im Makefile unter .PHONY ein (z. B. .PHONY start test lint).
      - type: command
        run: make -s test 2>&1 | grep -E "pass [1-9]"
        message: make test funktioniert noch nicht. Denk an den Tab vor dem Befehl.
      - type: command
        run: make -s start | grep -F "Hallo!"
        message: make start funktioniert noch nicht.
    hints:
      - "`npm pkg set scripts.start=\"node src/index.js\"` legt ein Skript an, ohne die Datei von Hand zu bearbeiten."
      - Im Makefile muss die Befehlszeile unter einem Target mit einem Tab beginnen. `printf` schreibt einen Tab als `\t`.
      - "`printf '.PHONY: start test lint\\n\\nstart:\\n\\tnpm start\\n' > Makefile` zeigt das Muster für ein Target."
    solution: |
      ```bash
      cd skripte
      npm pkg set scripts.start="node src/index.js" scripts.test="node --test" scripts.lint="node --check src/index.js src/sum.js"
      npm start
      npm test
      npm run lint
      printf '.PHONY: start test lint\n\nstart:\n\tnpm start\n\ntest:\n\tnpm test\n\nlint:\n\tnpm run lint\n' > Makefile
      make test
      ```
  - id: skript-ablauf
    type: steps
    title: Was passiert bei npm run build?
    description: Verfolge, was npm mit deinen Skripten macht.
    steps:
      - situation: "In der package.json stehen `\"prebuild\": \"npm run lint\"` und `\"build\": \"vite build\"`. Du tippst `npm run build`."
        question: Was läuft zuerst?
        options: [prebuild, build, Nur build – prebuild wird ignoriert]
        answer: 0
        explanation: npm führt automatisch das Skript mit dem Präfix pre vor build aus.
      - situation: Das Skript prebuild meldet einen Linter-Fehler und endet mit Exit-Code 1.
        question: Was passiert mit build?
        options: [build läuft trotzdem, build wird nicht mehr ausgeführt, npm wiederholt prebuild]
        answer: 1
        explanation: Schlägt ein Skript fehl, bricht npm die Kette ab. So landet kein fehlerhafter Code im Build.
      - situation: Im Skript build steht nur `vite build`, obwohl vite nicht global installiert ist.
        question: Warum funktioniert es trotzdem?
        options:
          - npm ergänzt beim Ausführen node_modules/.bin im Suchpfad
          - vite ist in jedes Betriebssystem eingebaut
          - npm lädt vite jedes Mal aus dem Internet
        answer: 0
        explanation: In npm-Skripten sind alle lokal installierten Werkzeuge direkt aufrufbar. Deshalb braucht das Team keine globalen Installationen.
---
Stell dir vor, jedes Projekt im Team startet anders: hier `node server.js`, dort
`php -S localhost:8000 -t public`, woanders `vite --port 3000`. Wer zwischen Projekten wechselt,
müsste jedes Mal nachschlagen. Die Lösung: Jedes Projekt bekommt eine einheitliche **Bedienoberfläche**
aus kurzen Befehlen.

## npm-Skripte

Ein [[npm-script|npm-Skript]] ist ein benannter Befehl im Feld `scripts` der `package.json`:

```json title="package.json"
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "lint": "eslint ."
  }
}
```

| Aufruf | Wirkung |
|---|---|
| `npm run dev` | startet den Dev-Server |
| `npm run build` | prüft Typen und baut |
| `npm test` | Kurzform von `npm run test` |
| `npm run` | listet alle Skripte auf |

Der Trick: npm legt beim Ausführen `node_modules/.bin` in den Suchpfad. Darum findet das Skript
`vite`, obwohl du es nie global installiert hast.

> [!MERKSATZ]
> Die Namen `dev`, `build`, `test` und `lint` sind eine Konvention. Wer sie kennt, bedient jedes
> JavaScript-Projekt, ohne die Details der Werkzeuge zu kennen.

## Vorher und nachher: pre und post

Ein Skript mit dem Präfix `pre` läuft automatisch **vor**, eines mit `post` **nach** dem gleichnamigen
Skript:

```json
{
  "scripts": {
    "prebuild": "npm run lint",
    "build": "vite build"
  }
}
```

Schlägt `prebuild` fehl, bricht npm ab, und `build` läuft gar nicht erst. Mit `&&` verkettest du
Befehle innerhalb eines Skripts auf dieselbe Weise.

Brauchst du einmalig eine zusätzliche Option, hängst du sie nach `--` an. Alles danach reicht npm
unverändert an den Befehl im Skript weiter:

```bash
npm test -- --watch      # führt "vitest run --watch" aus
```

So bleibt das Skript kurz, und trotzdem ist jede Option erreichbar.

## Composer-Skripte

[[composer|Composer]] kennt dasselbe Prinzip im Feld `scripts` der `composer.json`:

```json title="composer.json (Ausschnitt)"
{
  "scripts": {
    "analyse": "phpstan analyse",
    "test": ["@analyse", "phpunit"]
  }
}
```

Du startest sie mit `composer run analyse` oder kurz `composer analyse`. Ein `@` ruft ein anderes
Skript auf. Wie bei npm liegt `vendor/bin` im Suchpfad. Aktuelle Laravel-Projekte bringen zum Beispiel
`composer run dev` mit, das Server, Queue und Vite gemeinsam startet.

## Das Makefile als gemeinsamer Einstieg

In Full-Stack-Projekten gibt es npm **und** Composer. Ein [[makefile|Makefile]] in der Wurzel fasst
beides unter einheitlichen Namen zusammen:

```makefile title="Makefile"
.PHONY: setup dev test

setup:
	test -f .env || cp .env.example .env
	composer install
	npm ci

dev:
	npm run dev

test:
	composer test
	npm test
```

make ist auf Linux und macOS meist schon installiert und kennt weder npm noch Composer – es führt
einfach die Befehle aus, die du darunter schreibst. Genau das macht es zum neutralen Einstieg für
Projekte mit mehreren Sprachen.

Jedes [[make-target|Target]] ist ein Name mit Befehlen darunter. `make setup` richtet das Projekt ein,
`make test` testet Backend und Frontend. [[phony-target|.PHONY]] sagt make, dass `test` kein
Dateiname ist, sondern ein Befehl.

> [!FEHLER]
> **Leerzeichen statt Tab.** Die Befehlszeilen unter einem Target müssen mit einem **Tab** beginnen.
> Mit Leerzeichen meldet make „missing separator“. Viele Editoren ersetzen Tabs – stelle in der
> `.editorconfig` für `Makefile` `indent_style = tab` ein.

> [!PRAXIS]
> In vielen Teams ist `make setup` der einzige Befehl, den Neue nach dem Klonen brauchen. Die README
> verweist darauf, und CI-Pipelines rufen dieselben Targets auf wie die Menschen. So testet die CI
> genau das, was du lokal testest.

## Zusammenfassung

- Skripte geben einem Projekt kurze, einheitliche Befehle wie `dev`, `build`, `test`, `lint`.
- npm-Skripte stehen in `package.json`, gestartet mit `npm run <name>` (Kurzform `npm test`).
- `pre`- und `post`-Skripte laufen automatisch davor bzw. danach.
- Composer-Skripte stehen in `composer.json`, gestartet mit `composer run <name>`.
- Ein Makefile bündelt Befehle mehrerer Werkzeuge zu Targets wie `make setup`.
- Befehle im Makefile beginnen mit einem Tab; Befehls-Targets gehören in `.PHONY`.
