---
title: GitHub Actions und CI
summary: Workflows, Jobs, Steps und Runner verstehen und einen CI-Workflow schreiben, der bei jedem Push und Pull Request deine Tests ausführt – mit Matrix, Cache und Secrets.
duration: 25
sources:
  - title: GitHub Docs – GitHub Actions verstehen
    url: https://docs.github.com/de/actions/get-started/understand-github-actions
  - title: GitHub Docs – Workflowsyntax für GitHub Actions
    url: https://docs.github.com/de/actions/reference/workflows-and-actions/workflow-syntax
  - title: GitHub Docs – Erstellen und Testen von Node.js
    url: https://docs.github.com/de/actions/tutorials/build-and-test-code/nodejs
  - title: GitHub Docs – Verwenden von Geheimnissen in GitHub Actions
    url: https://docs.github.com/de/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets
  - title: actions/setup-node
    url: https://github.com/actions/setup-node
quiz:
  - type: match
    question: Ordne jeden Begriff seiner Bedeutung zu.
    pairs:
      - { left: "on", right: "Welches Ereignis den Workflow startet" }
      - { left: "jobs", right: "Gruppen von Schritten, die auf je einem Runner laufen" }
      - { left: "runs-on", right: "Auf welcher Maschine ein Job läuft" }
      - { left: "uses", right: "Eine fertige Action einbinden" }
      - { left: "run", right: "Einen Shell-Befehl ausführen" }
    explanation: Ereignis → Workflow → Jobs → Steps. Steps sind entweder eine Action (uses) oder ein Befehl (run).
  - type: find-bug
    question: Dieser Workflow wird von GitHub abgelehnt. In welcher Zeile steckt der Fehler?
    language: yaml
    code: |
      name: Hallo
      on: push
      jobs:
        gruss:
          runs-on: ubuntu-latest
          steps:
            - run: echo "Hallo"
           - run: echo "Tschüss"
    bug_line: 8
    explanation: YAML hängt an der Einrückung. Die zweite Liste ist um ein Leerzeichen weniger eingerückt als die erste und gehört damit nicht mehr zu steps.
  - type: single
    question: 'Ein Workflow hat `matrix` mit `node-version: [22, 24]` und `os: [ubuntu-latest, windows-latest]`. Wie viele Jobs startet GitHub?'
    options:
      - "2"
      - "4"
      - "6"
    answer: 1
    explanation: Die Matrix bildet alle Kombinationen – 2 Node-Versionen mal 2 Betriebssysteme ergibt 4 Jobs.
  - type: multiple
    question: Wie gehst du richtig mit einem API-Schlüssel um, den ein Test braucht?
    options:
      - Ihn unter Settings → Secrets and variables → Actions als Secret anlegen
      - Im Workflow über `secrets.API_KEY` in eine Umgebungsvariable geben
      - Ihn direkt in die ci.yml schreiben
      - Ihn mit echo ins Log ausgeben, um zu prüfen, ob er ankommt
    answers: [0, 1]
    explanation: Secrets werden verschlüsselt gespeichert und in Logs maskiert. In Dateien oder bewusst ins Log gehören sie nie.
  - type: cloze
    text: Statt `npm install` nutzt man in CI `npm ___`, weil es exakt das Lockfile installiert. Mit `cache:___` speichert setup-node den npm-Cache zwischen Läufen.
    blanks:
      - [ci]
      - [npm]
    explanation: npm ci ist reproduzierbar und schneller; der Cache spart das erneute Herunterladen von Paketen.
tasks:
  - id: workflow-beschriften
    type: diagram
    title: Beschrifte den Aufbau eines Workflows
    description: Ordne jedem Kasten den passenden Begriff zu. Grüne Schritte binden eine fertige Action ein, blaue führen einen Befehl aus.
    image: /assets/github/workflow-anatomie-leer.svg
    slots:
      - { x: 13, y: 23, answer: "Ereignis (on)" }
      - { x: 64, y: 19, answer: Workflow }
      - { x: 48, y: 34, answer: Job }
      - { x: 48, y: 47, answer: Step mit uses }
      - { x: 48, y: 69, answer: Step mit run }
    distractors: [Branch, Issue]
    hints:
      - Der äußerste Rahmen ist die Datei in .github/workflows/.
  - id: ci-schreiben
    type: terminal
    title: Schreib einen CI-Workflow mit Matrix und Cache
    description: |
      Im Ordner `ci` liegt ein kleines Node-Projekt mit Tests (`npm test`). Schreib
      `.github/workflows/ci.yml`:

      1. `name: CI`
      2. Auslöser: `push` auf `main` **und** `pull_request`.
      3. `permissions` mit `contents: read`.
      4. Ein Job `test` auf `ubuntu-latest` mit einer Matrix `node-version: [22, 24]`.
      5. Steps: `actions/checkout@v7`, dann `actions/setup-node@v7` mit
         `node-version: ${{ matrix.node-version }}` und `cache: npm`, dann `run: npm ci` und `run: npm test`.
      6. Führe `npm test` einmal lokal aus – es muss grün sein. Committe alles.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: ci
    setup: |
      git init -q -b main
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      cat > package.json <<'EOF'
      {
        "name": "rechner",
        "version": "1.0.0",
        "type": "module",
        "scripts": { "test": "node --test" }
      }
      EOF
      printf '{\n  "name": "rechner",\n  "version": "1.0.0",\n  "lockfileVersion": 3,\n  "requires": true,\n  "packages": { "": { "name": "rechner", "version": "1.0.0" } }\n}\n' > package-lock.json
      printf 'export const add = (a, b) => a + b\n' > add.js
      cat > add.test.js <<'EOF'
      import { test } from 'node:test'
      import assert from 'node:assert/strict'
      import { add } from './add.js'

      test('addiert zwei Zahlen', () => {
        assert.equal(add(2, 3), 5)
      })
      EOF
      git add .
      git commit -q -m "feat: add calculator"
    checks:
      - type: file_contains
        path: .github/workflows/ci.yml
        pattern: "^name:\\s*[\"']?CI[\"']?\\s*$"
        message: 'Es fehlt "name: CI".'
      - type: file_contains
        path: .github/workflows/ci.yml
        pattern: "^\\s+push:\\s*\\n\\s+branches:\\s*\\[?\\s*[\"']?main"
        message: Unter on fehlt push mit branches main.
      - type: file_contains
        path: .github/workflows/ci.yml
        pattern: "^\\s+pull_request:"
        message: Unter on fehlt pull_request.
      - type: file_contains
        path: .github/workflows/ci.yml
        pattern: "^permissions:\\s*\\n\\s+contents:\\s*read"
        message: Es fehlt permissions mit contents read.
      - type: file_contains
        path: .github/workflows/ci.yml
        pattern: "node-version:\\s*\\[\\s*22\\s*,\\s*24\\s*\\]"
        message: Es fehlt die Matrix node-version [22, 24].
      - type: file_contains
        path: .github/workflows/ci.yml
        pattern: "uses:\\s*actions/setup-node@v7"
        message: Es fehlt der Step actions/setup-node@v7.
      - type: file_contains
        path: .github/workflows/ci.yml
        pattern: "node-version:\\s*\\$\\{\\{\\s*matrix\\.node-version\\s*\\}\\}"
        message: setup-node soll die Version aus der Matrix bekommen (matrix.node-version).
      - type: file_contains
        path: .github/workflows/ci.yml
        pattern: "cache:\\s*[\"']?npm"
        message: setup-node soll den npm-Cache nutzen (cache npm).
      - type: file_contains
        path: .github/workflows/ci.yml
        pattern: "run:\\s*npm ci"
        message: Es fehlt der Step run npm ci.
      - type: file_contains
        path: .github/workflows/ci.yml
        pattern: "run:\\s*npm test"
        message: Es fehlt der Step run npm test.
      - type: command
        run: "! grep -q \"$(printf '\\t')\" .github/workflows/ci.yml"
        message: In ci.yml stecken Tabs – nur Leerzeichen sind erlaubt.
      - type: command
        run: npm test --silent
        message: npm test schlägt lokal fehl – in CI wäre der Check rot.
      - type: command
        run: git ls-files .github/workflows/ci.yml
        stdout_equals: .github/workflows/ci.yml
        message: ci.yml ist noch nicht committet.
    hints:
      - "Grundgerüst: `on:` → `push:` mit `branches: [main]` und `pull_request:`."
      - "Die Matrix steht im Job: `strategy:` → `matrix:` → `node-version: [22, 24]`."
      - "Die Ausdrücke `${{ … }}` schreibst du genau so in die Datei, GitHub ersetzt sie später."
    solution: |
      ```bash
      cd ci
      mkdir -p .github/workflows
      cat > .github/workflows/ci.yml <<'EOF'
      name: CI

      on:
        push:
          branches: [main]
        pull_request:

      permissions:
        contents: read

      jobs:
        test:
          runs-on: ubuntu-latest
          strategy:
            matrix:
              node-version: [22, 24]
          steps:
            - uses: actions/checkout@v7
            - uses: actions/setup-node@v7
              with:
                node-version: ${{ matrix.node-version }}
                cache: npm
            - run: npm ci
            - run: npm test
      EOF
      npm test
      git add .github
      git commit -m "ci: run tests on push and pull requests"
      ```
  - id: matrix-ausrechnen
    type: code
    language: js
    title: Welche Jobs erzeugt eine Matrix?
    description: |
      GitHub erzeugt aus einer Matrix **alle Kombinationen** der Werte. Schreib eine Funktion
      `expandMatrix(matrix)`, die genau das tut.

      - Eingabe: ein Objekt, dessen Werte Arrays sind, z. B. `{ os: ['ubuntu', 'windows'], node: [22, 24] }`.
      - Ausgabe: ein Array von Objekten, eins pro Kombination, z. B. `{ os: 'ubuntu', node: 22 }`.
      - Reihenfolge: Der **erste** Schlüssel ändert sich am langsamsten (wie bei verschachtelten Schleifen).
      - Eine leere Matrix `{}` ergibt `[{}]` (ein Job ohne Variablen); ist ein Array leer, gibt es keine Jobs: `[]`.
    starter: |
      function expandMatrix(matrix) {
        let result = [{}]
        // für jeden Schlüssel: jede bisherige Kombination mit jedem Wert verbinden
        return result
      }
    tests:
      - name: zwei mal zwei Kombinationen
        code: |
          assertDeepEqual(expandMatrix({ os: ['ubuntu', 'windows'], node: [22, 24] }), [
            { os: 'ubuntu', node: 22 }, { os: 'ubuntu', node: 24 },
            { os: 'windows', node: 22 }, { os: 'windows', node: 24 },
          ])
      - name: ein Schlüssel
        code: "assertDeepEqual(expandMatrix({ node: [20, 22, 24] }), [{ node: 20 }, { node: 22 }, { node: 24 }])"
      - name: leere Matrix ergibt einen Job
        code: "assertDeepEqual(expandMatrix({}), [{}])"
      - name: leeres Array ergibt keine Jobs
        code: "assertDeepEqual(expandMatrix({ os: ['ubuntu'], node: [] }), [])"
      - name: Anzahl bei drei Dimensionen
        code: "assertEqual(expandMatrix({ a: [1, 2], b: [1, 2, 3], c: [1, 2] }).length, 12)"
    solution: |
      function expandMatrix(matrix) {
        let result = [{}]
        for (const [key, values] of Object.entries(matrix)) {
          const next = []
          for (const combination of result) {
            for (const value of values) {
              next.push({ ...combination, [key]: value })
            }
          }
          result = next
        }
        return result
      }
---

Fünf Leute arbeiten am selben Projekt. Jede Person „hat lokal getestet“ – trotzdem ist `main` morgens
rot. [[github-actions|GitHub Actions]] löst das: Bei jedem Push und Pull Request laufen deine Tests
automatisch auf einer frischen Maschine bei GitHub.

![Aufbau eines Workflows: Ereignis, Workflow, Jobs und Steps](/assets/github/workflow-anatomie.svg)

## Die Bausteine

| Baustein | Bedeutung |
|---|---|
| **[[workflow|Workflow]]** | automatisierter Ablauf, als YAML-Datei in `.github/workflows/` |
| **Ereignis** (`on`) | was ihn startet: `push`, `pull_request`, `workflow_dispatch`, `schedule` … |
| **[[job|Job]]** | Gruppe von Schritten auf **einem** [[runner|Runner]], z. B. `ubuntu-latest` |
| **Step** | eine fertige [[action|Action]] (`uses`) oder ein Shell-Befehl (`run`) |

Jobs laufen parallel und jeder auf einer leeren Maschine, Steps innerhalb eines Jobs nacheinander.
Ergebnisse siehst du im Reiter **Actions** oder mit `gh run list`. Jeder Step hat ein aufklappbares
Protokoll – bei einem roten Lauf liest du dort die Fehlermeldung wie im Terminal.

> [!MERKSATZ]
> Ereignis startet Workflow → Workflow enthält Jobs → Jobs enthalten Steps.

[[yaml|YAML]] verlangt Disziplin: `schluessel: wert` mit Leerzeichen nach dem Doppelpunkt, Einrückung
**nur mit Leerzeichen**, `- ` für Listen, Texte mit `:` oder `#` in Anführungszeichen.

## Ein CI-Workflow

[[continuous-integration|Continuous Integration]] (CI) heißt: Jede Änderung wird automatisch gebaut
und getestet. Das Ergebnis erscheint als [[status-check|Status-Check]] im Pull Request.

```yaml title=".github/workflows/ci.yml"
name: CI

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [22, 24]
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: ${{ matrix.node-version }}
          cache: npm
      - run: npm ci
      - run: npm test
```

| Teil | Wozu |
|---|---|
| `actions/checkout` | holt den Code auf den Runner – ohne ihn ist die Maschine leer |
| `permissions` | das automatische Token darf nur lesen |
| `with:` | Eingaben für eine Action |
| `npm ci` | installiert exakt das [[lockfile|Lockfile]] |

> [!FEHLER]
> **Den Checkout vergessen.** `run: npm test` ohne `actions/checkout` findet keine `package.json` und scheitert.

## Matrix und Cache

Eine [[matrix-build|Matrix]] startet denselben Job mit verschiedenen Werten – hier Node 22 und 24.
Mehrere Dimensionen ergeben **alle Kombinationen**: zwei Versionen mal drei Betriebssysteme sind sechs
Jobs. `${{ … }}` ist ein Ausdruck, den GitHub vor dem Step mit dem passenden Wert füllt.

Weil jeder Lauf leer startet, würde `npm ci` jedes Mal alles neu laden. `cache: npm` in `setup-node`
speichert den [[cache|Cache]]; der Schlüssel ist ein Hash deines Lockfiles. Für andere Werkzeuge gibt
es `actions/cache`.

## Secrets im Workflow

Passwörter und Tokens legst du als [[secret|Secret]] unter **Settings → Secrets and variables → Actions**
an und reichst sie als Umgebungsvariable weiter:

```yaml title="Ein Secret verwenden"
      - run: npm run test:integration
        env:
          API_TOKEN: ${{ secrets.API_TOKEN }}
```

GitHub speichert Secrets verschlüsselt und ersetzt sie in Logs durch `***`. Workflows aus Fork-PRs
bekommen keine Secrets.

> [!PRAXIS]
> In vielen Teams laufen Linter, Typprüfung und Tests als getrennte Jobs, die im Branch-Schutz als
> Pflicht-Checks eingetragen sind. Fertige Actions aus dem Marketplace pinnt man auf eine Version oder
> sogar auf einen Commit-Hash. Deployments und tiefere CI/CD lernst du im Kurs zu Deployments.

## Zusammenfassung

- Ein **Workflow** ist eine YAML-Datei in `.github/workflows/`: `on` → `jobs` → `steps`.
- Steps sind Actions (`uses`) oder Befehle (`run`); `actions/checkout` ist fast immer der erste.
- **CI** führt bei jedem Push und PR `npm ci` und `npm test` aus und meldet einen Status-Check.
- Eine **Matrix** erzeugt alle Kombinationen, `cache: npm` beschleunigt Läufe.
- **Secrets** kommen über `${{ secrets.NAME }}` in den Job – nie in die YAML-Datei.
