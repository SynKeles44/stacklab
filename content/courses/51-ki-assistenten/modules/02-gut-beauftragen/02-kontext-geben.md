---
title: Den richtigen Kontext geben
summary: Relevante Dateien, Fehlermeldungen, Beispiele und eine Projekt-Anweisungsdatei – damit der Assistent dein Projekt statt den Durchschnitt kennt.
duration: 25
sources:
  - title: AGENTS.md – offenes Format für Anweisungen an Coding-Agenten
    url: https://agents.md/
  - title: GitHub Docs – Repository-Anweisungen für Copilot
    url: https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions
  - title: Claude Code – Memory und CLAUDE.md
    url: https://code.claude.com/docs/en/memory
quiz:
  - type: multiple
    question: Du lässt einen Assistenten einen fehlschlagenden Test reparieren. Was gehört in den Kontext?
    options:
      - Die vollständige Fehlermeldung des Testlaufs
      - Die Testdatei und die getestete Datei
      - Der komplette Ordner `node_modules`
      - Der Befehl, mit dem die Tests laufen
    answers: [0, 1, 3]
    explanation: >
      Gezielter Kontext schlägt viel Kontext. `node_modules` sprengt das Kontextfenster und lenkt nur ab.
  - type: single
    question: Wofür ist eine Projekt-Anweisungsdatei wie `AGENTS.md` gedacht?
    options:
      - Sie speichert die Gespräche mit dem Assistenten.
      - Sie enthält Befehle, Konventionen und Grenzen, die ein Assistent bei jeder Sitzung kennen soll.
      - Sie enthält API-Schlüssel, damit der Agent selbstständig deployen kann.
      - Sie ersetzt die README für Menschen.
    answer: 1
    explanation: >
      Die Datei wird zu Beginn geladen und landet so in jedem Kontext. Geheimnisse gehören niemals hinein – sie
      ist versioniert und für alle im Repository lesbar.
  - type: find-bug
    question: Welche Zeile dieser Projekt-Anweisungsdatei ist ein Problem?
    language: markdown
    code: |
      # AGENTS.md
      ## Befehle
      - Tests: `npm test`
      - Linter: `npm run lint`
      ## Regeln
      - Commits nach Conventional Commits.
      - Zugang zur Staging-Datenbank: user=admin pass=Winter2026!
      - Keine neuen Abhängigkeiten ohne Rückfrage.
    bug_line: 7
    explanation: >
      Zugangsdaten haben in keiner Datei im Repository etwas zu suchen. Wer sie braucht, bekommt sie über einen
      Secret-Manager oder eine nicht versionierte `.env`-Datei.
  - type: single
    question: In einem Monorepo liegt eine `AGENTS.md` im Wurzelordner und eine weitere in `packages/shop/`. Ein Agent ändert `packages/shop/src/cart.ts`. Welche Anweisungen haben bei Widersprüchen Vorrang?
    options:
      - Die aus dem Wurzelordner
      - Die aus `packages/shop/`, weil sie näher an der geänderten Datei liegt
      - Keine von beiden, der Agent entscheidet frei
      - Die Datei, die zuletzt geändert wurde
    answer: 1
    explanation: >
      Nach der AGENTS.md-Konvention gilt die Datei, die der bearbeiteten Datei am nächsten liegt. Ausdrückliche
      Anweisungen im Chat gehen allerdings allen Dateien vor.
tasks:
  - id: agents-md-schreiben
    type: terminal
    title: Schreibe eine Projekt-Anweisungsdatei
    description: |
      Im Ordner `rezepte-api` liegt ein kleines Node-Projekt mit Git-Repository. Bisher bekommt jeder
      Assistent dort keinen Projektkontext. Das änderst du.

      1. Sieh dich um: `cat package.json`, `cat CONTRIBUTING.md`, `ls src test`.
      2. Lege `AGENTS.md` an. Sie soll **kurz** sein (höchstens 40 Zeilen) und enthalten:
         - den Befehl für die Tests und den Befehl für den Linter – genau so, wie sie in `package.json` definiert sind (mit `npm test` bzw. `npm run …`),
         - das Commit-Format aus `CONTRIBUTING.md`,
         - eine Regel, dass die Datei `.env` nicht gelesen, ausgegeben oder committet wird.
      3. Schreibe **keine** Werte aus `.env` in die Datei.
      4. Committe `AGENTS.md` mit einer passenden Message.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit das Projekt angelegt wird.
    workdir: rezepte-api
    setup: |
      git init -q -b main
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      mkdir -p src test scripts
      cat > package.json <<'JSON'
      {
        "name": "rezepte-api",
        "version": "1.0.0",
        "type": "module",
        "scripts": {
          "test": "node --test",
          "lint": "node scripts/lint.mjs",
          "start": "node src/server.js"
        }
      }
      JSON
      cat > CONTRIBUTING.md <<'MD'
      # Mitarbeiten

      - Commit-Messages folgen Conventional Commits, z. B. `feat: add recipe search`.
      - Jede Änderung bekommt einen Test.
      MD
      printf 'export function byTag(recipes, tag) {\n  return recipes.filter((r) => r.tags.includes(tag));\n}\n' > src/recipes.js
      printf "import { test } from 'node:test';\nimport assert from 'node:assert/strict';\nimport { byTag } from '../src/recipes.js';\n\ntest('filters by tag', () => {\n  assert.equal(byTag([{ tags: ['vegan'] }, { tags: [] }], 'vegan').length, 1);\n});\n" > test/recipes.test.js
      printf "console.log('lint ok');\n" > scripts/lint.mjs
      printf '.env\nnode_modules/\n' > .gitignore
      printf 'RECIPES_API_KEY=stacklab-demo-9f8e7d6c\n' > .env
      git add -A
      git commit -q -m "chore: initial commit"
    checks:
      - type: file_exists
        path: AGENTS.md
        message: Lege die Datei AGENTS.md im Projektordner an.
      - type: file_contains
        path: AGENTS.md
        pattern: "npm test"
        message: Nenne in AGENTS.md den Testbefehl `npm test`.
      - type: file_contains
        path: AGENTS.md
        pattern: "npm run lint"
        message: Nenne in AGENTS.md den Linter-Befehl `npm run lint` (das Skript heißt in package.json `lint`).
      - type: file_contains
        path: AGENTS.md
        pattern: "([Cc]onventional [Cc]ommits|feat:)"
        message: Beschreibe das Commit-Format aus CONTRIBUTING.md (Conventional Commits).
      - type: file_contains
        path: AGENTS.md
        pattern: "\\.env"
        message: Ergänze eine Regel zur Datei .env – sie wird nicht gelesen, ausgegeben oder committet.
      - type: command
        run: "! grep -q '9f8e7d6c' AGENTS.md"
        message: In AGENTS.md steht ein Wert aus .env. Entferne ihn – Geheimnisse gehören nie in versionierte Dateien.
      - type: command
        run: "test $(wc -l < AGENTS.md) -le 40"
        message: AGENTS.md ist zu lang. Halte sie bei höchstens 40 Zeilen – nur das, was ein Assistent wirklich braucht.
      - type: command
        run: git ls-files AGENTS.md
        stdout_equals: AGENTS.md
        message: AGENTS.md ist noch nicht committet.
      - type: command
        run: git status --porcelain
        stdout_equals: ""
        message: Es gibt noch nicht committete Änderungen. Committe AGENTS.md – .env bleibt durch .gitignore außen vor.
    hints:
      - "Die Befehle stehen unter `scripts` in package.json: `test` startest du mit `npm test`, alle anderen mit `npm run <name>`."
      - "Schreib die Datei mit `nano AGENTS.md` oder per Heredoc: `cat > AGENTS.md <<'EOF'` … `EOF`."
      - "Zum Schluss: `git add AGENTS.md && git commit -m \"docs: add agents instructions\"`."
    solution: |
      ```bash
      cd rezepte-api
      cat package.json CONTRIBUTING.md
      cat > AGENTS.md <<'EOF'
      # AGENTS.md

      ## Befehle
      - Tests: `npm test`
      - Linter: `npm run lint`

      ## Konventionen
      - Code liegt in `src/`, Tests in `test/` (Node-Testrunner).
      - Commit-Messages nach Conventional Commits, z. B. `feat: add recipe search`.
      - Jede Änderung bekommt einen Test.

      ## Grenzen
      - Die Datei `.env` niemals lesen, ausgeben oder committen.
      - Keine neuen Abhängigkeiten ohne Rückfrage.
      EOF
      git add AGENTS.md
      git commit -m "docs: add agents instructions"
      ```
  - id: kontext-auswaehlen
    type: dragdrop
    title: Was gehört in den Kontext?
    description: Du bittest einen Assistenten, einen Fehler im Warenkorb zu beheben. Ordne jedes Material zu.
    targets:
      - { id: rein, label: Gehört in den Kontext }
      - { id: raus, label: Gehört nicht in den Kontext }
    items:
      - { label: "Die vollständige Fehlermeldung mit Stack-Trace", target: rein }
      - { label: "Die Datei mit der Warenkorb-Logik und ihre Tests", target: rein }
      - { label: "Ein Beispiel-Warenkorb mit erfundenen Daten, der den Fehler auslöst", target: rein }
      - { label: "Der Befehl, mit dem du den Fehler reproduzierst", target: rein }
      - { label: "Ein Datenbank-Export mit echten Kundenbestellungen", target: raus }
      - { label: "Die `.env`-Datei mit Zugangsdaten zum Zahlungsdienst", target: raus }
      - { label: "Der komplette Ordner `vendor/`", target: raus }
---
Zwei Kollegen bitten denselben Assistenten um denselben Fix. Der eine schreibt „Der Warenkorb rechnet
falsch“. Der andere hängt die Fehlermeldung, die betroffene Datei, einen Beispiel-Warenkorb und den
Testbefehl an. Gleiches Modell, gleiche Frage – aber nur einer bekommt eine brauchbare Antwort.

## Kontext ist dein stärkster Hebel

Aus Modul 1 weißt du: Was im [[kontextfenster|Kontextfenster]] steht, beeinflusst die Antwort direkt.
Echte Dateien verdrängen geratene Annahmen. Kontext ist deshalb wichtiger als jede raffinierte
Formulierung.

Guter Kontext ist **relevant, vollständig und klein**:

| Gib mit | Warum |
|---|---|
| die betroffene Datei und ihre Tests | das Modell sieht echten Code statt Durchschnitt |
| die **vollständige** Fehlermeldung | Zeilennummern und Aufrufkette zeigen die Ursache |
| einen Befehl zum Reproduzieren | der Agent kann selbst prüfen |
| eine ähnliche, gute Stelle im Projekt | „so wie in `CustomerCsv.php`“ überträgt euren Stil |
| die Version wichtiger Bibliotheken | verhindert Lösungen für veraltete APIs |

> [!MERKSATZ]
> Gezielter Kontext schlägt viel Kontext. Zwei passende Dateien helfen mehr als der ganze Ordner.

## Kontext in den verschiedenen Werkzeugen

Wie du Kontext lieferst, hängt von der Art des Assistenten ab:

- **Vervollständigung** – öffne die passenden Nachbardateien; viele Werkzeuge beziehen offene Tabs ein.
- **Chat** – füge Code, Fehlermeldung und Beispiele ein oder hänge Dateien an.
- **Agent** – nenne Dateien und Befehle; der Agent liest selbst nach. Je genauer dein Hinweis, desto
  weniger sucht er herum.

```text title="Kontext für einen Agenten"
Der Test "applies SPAR10" in test/discount.test.js schlägt fehl:
  TypeError: items.sumBy is not a function
      at applyDiscount (src/discount.js:6:23)
Reproduzieren: npm test
Vorbild für die Summenberechnung: subtotal() in src/cart.js
```

> [!FEHLER]
> **„Ich kopiere einfach alles rein.“** Riesige Kontexte kosten Tokens, verdrängen ältere Teile und
> verwässern die Aufmerksamkeit des Modells. Schlimmer: Dabei rutschen schnell `.env`-Dateien oder
> Kundendaten mit hinein.

## Die Projekt-Anweisungsdatei

Manche Informationen braucht der Assistent **jedes Mal**: Testbefehl, Commit-Format, Ordnerstruktur,
Verbote. Statt sie in jedem Gespräch zu wiederholen, legst du sie in eine
[[projekt-anweisungsdatei|Projekt-Anweisungsdatei]] im Repository.

Das verbreitete offene Format heißt [[agents-md|AGENTS.md]]: eine normale Markdown-Datei im
Wurzelordner. Viele Werkzeuge lesen sie automatisch; einige haben eigene Dateinamen, etwa
[[claude-md|CLAUDE.md]] oder eine Anweisungsdatei im Ordner `.github/`. Die Idee ist überall gleich.

```markdown title="AGENTS.md"
# AGENTS.md

## Befehle
- Tests: `npm test`
- Linter: `npm run lint`

## Konventionen
- Code in `src/`, Tests in `test/`.
- Commit-Messages nach Conventional Commits.

## Grenzen
- `.env` niemals lesen, ausgeben oder committen.
- Keine neuen Abhängigkeiten ohne Rückfrage.
- Tests nie löschen oder überspringen, um sie grün zu bekommen.
```

## Was in die Datei gehört – und was nicht

Weil die Datei bei jeder Sitzung im Kontext landet, kostet jede Zeile Platz und Aufmerksamkeit. Halte
sie kurz und konkret.

| Gehört hinein | Gehört nicht hinein |
|---|---|
| exakte Befehle für Tests, Linter, Build | Zugangsdaten, Tokens, Passwörter |
| Konventionen, die vom Üblichen abweichen | Allgemeinwissen („schreibe sauberen Code“) |
| klare Verbote mit Begründung | lange Architektur-Romane – verlinke die Doku |
| Hinweise auf Fallen („Migrationen nie ändern“) | veraltete Regeln, die niemand mehr pflegt |

In einem [[monorepo|Monorepo]] kann jedes Paket eine eigene Datei haben. Es gilt die Datei, die der
bearbeiteten Datei am nächsten liegt. Ausdrückliche Anweisungen im Chat gehen allen Dateien vor.

> [!PRAXIS]
> Behandle die Anweisungsdatei wie Code: Sie liegt im Repository, Änderungen gehen durchs
> [[code-review|Code-Review]], und wer eine Regel einführt, prüft, ob der Assistent sie wirklich
> befolgt. Tipps zum Schreiben findest du im Kurs [Dokumentation schreiben](/kurse/dokumentation-schreiben).

## Zusammenfassung

- Relevanter, vollständiger, kleiner Kontext ist der wichtigste Hebel für gute Antworten.
- Gib Datei, Tests, vollständige Fehlermeldung, Reproduktionsbefehl und ein Vorbild mit.
- Immer gleiche Informationen gehören in eine Projekt-Anweisungsdatei wie AGENTS.md.
- Die Datei ist kurz, konkret, versioniert – und enthält niemals Geheimnisse.
- Die näheste Anweisungsdatei gilt; Anweisungen im Chat gehen vor.
