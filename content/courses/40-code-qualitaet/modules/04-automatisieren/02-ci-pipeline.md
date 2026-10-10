---
title: Ein Befehl für alles – und die CI-Pipeline
summary: Wie du alle Prüfungen hinter einem gemeinsamen Befehl (Composer- und npm-Skripte) bündelst, in sinnvoller Reihenfolge in GitHub Actions ausführst und den Merge an eine grüne Pipeline knüpfst.
duration: 20
sources:
  - title: Composer – Scripts
    url: https://getcomposer.org/doc/articles/scripts.md
  - title: npm – scripts
    url: https://docs.npmjs.com/cli/v11/using-npm/scripts
  - title: GitHub Actions – Workflow-Syntax
    url: https://docs.github.com/de/actions/reference/workflows-and-actions/workflow-syntax
  - title: PHPStan – Output Format
    url: https://phpstan.org/user-guide/output-format
  - title: Biome – Continuous Integration
    url: https://biomejs.dev/recipes/continuous-integration/
quiz:
  - type: single
    question: Warum bündelt man alle Prüfungen hinter einem Befehl wie `composer qa`?
    options:
      - Damit lokal, im Hook und in der CI exakt dieselben Prüfungen mit denselben Optionen laufen.
      - Weil GitHub Actions nur einen Befehl pro Workflow erlaubt.
      - Damit die Prüfungen parallel laufen.
      - Weil Composer sonst die Werkzeuge nicht findet.
    answer: 0
    explanation: Steht die Liste nur in der CI-Datei, weicht sie irgendwann von dem ab, was Entwickler lokal ausführen. Ein gemeinsamer Befehl ist die einzige Quelle.
  - type: multiple
    question: Welche Reihenfolge der Schritte in einer Pipeline ist sinnvoll?
    options:
      - Schnelle Prüfungen (Formatter, Linter) zuerst.
      - Langsame Tests ganz am Ende.
      - Erst die Tests, dann der Formatter, damit Tests nicht an Leerzeichen scheitern.
      - Bricht ein Schritt ab, laufen die folgenden nicht – das spart Zeit.
    answers: [0, 1, 3]
    explanation: Schnelles zuerst liefert die meisten Fehler nach Sekunden. Für den Formatter sind Tests nicht nötig.
  - type: match
    question: Ordne jedem Werkzeug seinen CI-Aufruf zu.
    pairs:
      - { left: "Pint", right: "pint --test" }
      - { left: "PHPStan", right: "phpstan analyse --error-format=github" }
      - { left: "Rector", right: "rector process --dry-run" }
      - { left: "Biome", right: "biome ci" }
    explanation: In der CI läuft jedes Werkzeug im Prüfmodus. `--error-format=github` lässt PHPStan die Fehler direkt an die Zeilen im Pull Request schreiben.
  - type: cloze
    text: "In der composer.json verweist `\"@lint\"` in einem Skript auf ein anderes ___ namens lint."
    blanks:
      - [Skript, Script]
    explanation: Mit `@name` ruft ein Composer-Skript ein anderes auf. So entsteht aus kleinen Skripten ein Sammelbefehl.
tasks:
  - id: qa-befehl
    type: terminal
    title: Ein qa-Befehl und ein Workflow
    description: |
      Im Ordner `qa-befehl` liegt ein PHP-Projekt mit `pint.json` und `phpstan.neon`. Es fehlt ein gemeinsamer
      Befehl und eine Pipeline.

      1. Ergänze die `composer.json` um einen Abschnitt `scripts` mit drei Skripten:
         - `lint`: `pint --test`
         - `analyse`: `phpstan analyse --no-progress`
         - `qa`: ruft erst `@lint`, dann `@analyse` auf (als Liste).
      2. Teste mit `composer qa` – es muss grün sein.
      3. Lege `.github/workflows/qa.yml` an: ein Workflow, der bei `push` und `pull_request` läuft, mit einem Job
         auf `ubuntu-latest`, der den Code mit `actions/checkout@v7` holt, PHP mit `shivammathur/setup-php@v2`
         einrichtet, `composer install` ausführt und dann `composer qa`.

      Klicke zuerst auf **Aufgabe vorbereiten**. Im Übungs-Terminal sind `pint` und `phpstan` global installiert –
      Composer findet sie auch so.
    workdir: qa-befehl
    setup: |
      cat > composer.json <<'EOF'
      {
          "name": "stacklab/qa-uebung",
          "type": "project",
          "require": {
              "php": "^8.4"
          },
          "autoload": {
              "psr-4": { "App\\": "src/" }
          }
      }
      EOF
      printf '{\n    "preset": "laravel"\n}\n' > pint.json
      printf 'parameters:\n    level: 8\n    paths:\n        - src\n' > phpstan.neon
      mkdir -p src
      cat > src/Temperature.php <<'EOF'
      <?php

      declare(strict_types=1);

      namespace App;

      final readonly class Temperature
      {
          public function __construct(public float $celsius) {}

          public function fahrenheit(): float
          {
              return $this->celsius * 9 / 5 + 32;
          }
      }
      EOF
    checks:
      - type: command
        run: jq -r '.scripts.lint' composer.json
        stdout_equals: pint --test
        message: Lege in der composer.json unter "scripts" das Skript "lint" mit "pint --test" an.
      - type: command
        run: jq -r '.scripts.analyse' composer.json
        stdout_matches: "^phpstan analyse"
        message: Lege das Skript "analyse" mit "phpstan analyse --no-progress" an.
      - type: command
        run: jq -c '.scripts.qa' composer.json
        stdout_equals: '["@lint","@analyse"]'
        message: Das Skript "qa" soll eine Liste sein, die erst "@lint" und dann "@analyse" aufruft.
      - type: command
        run: composer qa
        message: composer qa schlägt fehl. Führe es aus und lies die Ausgabe.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          cp -r composer.json pint.json phpstan.neon src "$d"/
          printf '<?php\n\ndeclare(strict_types=1);\n\nfunction laut(?string $s): string\n{\n    return strtoupper($s);\n}\n' > "$d/src/laut.php"
          (cd "$d" && composer qa >/dev/null 2>&1)
          ec=$?
          rm -rf "$d"
          [ "$ec" -ne 0 ]
        message: composer qa bleibt grün, obwohl PHPStan einen Fehler finden müsste. Ruft qa wirklich @analyse auf?
      - type: file_exists
        path: .github/workflows/qa.yml
        message: Es fehlt die Datei .github/workflows/qa.yml.
      - type: file_contains
        path: .github/workflows/qa.yml
        pattern: "pull_request"
        message: Der Workflow soll auch bei pull_request laufen.
      - type: file_contains
        path: .github/workflows/qa.yml
        pattern: "uses:\\s*actions/checkout@v7"
        message: Hole den Code mit actions/checkout@v7.
      - type: file_contains
        path: .github/workflows/qa.yml
        pattern: "uses:\\s*shivammathur/setup-php@v2"
        message: Richte PHP mit shivammathur/setup-php@v2 ein.
      - type: file_contains
        path: .github/workflows/qa.yml
        pattern: "run:\\s*composer (run(-script)? )?qa"
        message: Der letzte Schritt soll composer qa ausführen – denselben Befehl wie lokal.
    hints:
      - "Mit jq geht es ohne Editor: `jq '.scripts = {\"lint\": \"pint --test\", …}' composer.json > c.json && mv c.json composer.json`."
      - "`composer run-script --list` zeigt, welche Skripte Composer kennt."
      - "Der Workflow hat `on: [push, pull_request]`, darunter `jobs:` → `qa:` → `runs-on: ubuntu-latest` und `steps:` mit `uses:`- und `run:`-Einträgen."
    solution: |
      ```bash
      cd qa-befehl
      jq '.scripts = {"lint": "pint --test", "analyse": "phpstan analyse --no-progress", "qa": ["@lint", "@analyse"]}' composer.json > c.json && mv c.json composer.json
      composer qa
      mkdir -p .github/workflows
      cat > .github/workflows/qa.yml <<'EOF'
      name: QA

      on: [push, pull_request]

      jobs:
        qa:
          runs-on: ubuntu-latest
          steps:
            - uses: actions/checkout@v7
            - uses: shivammathur/setup-php@v2
              with:
                php-version: "8.5"
                tools: pint, phpstan
            - run: composer install --no-interaction --no-progress
            - run: composer qa
      EOF
      ```
  - id: pipeline-reihenfolge
    type: order
    title: Schritte eines Qualitäts-Jobs
    description: Bringe die Schritte eines CI-Jobs in eine sinnvolle Reihenfolge – von schnell zu langsam.
    items:
      - Code auschecken
      - PHP und Node einrichten
      - "Abhängigkeiten installieren (composer install, npm ci)"
      - "Code-Stil prüfen (pint --test, biome ci)"
      - "Rector im dry-run"
      - "Statische Analyse (phpstan, tsc --noEmit)"
      - Tests ausführen
    hints:
      - Ohne installierte Abhängigkeiten gibt es kein vendor/bin.
      - Was in Sekunden fertig ist, kommt vor dem, was Minuten braucht.
---
Lokal gibt es inzwischen viele Befehle: `pint --test`, `phpstan analyse`, `rector process --dry-run`,
`biome ci`, `tsc --noEmit`. Niemand tippt die alle vor jedem Push ein – und die CI-Pipeline braucht
dieselbe Liste noch einmal. In dieser Lektion bündelst du alles hinter **einem** Befehl und lässt ihn in der
[[ci-pipeline|CI-Pipeline]] laufen.

## Ein Befehl als einzige Quelle

Composer und npm können eigene Befehle als Skripte speichern. Bei Composer heißt das
[[composer-script|Composer-Skript]], bei npm [[npm-script|npm-Skript]]:

```json title="composer.json (Ausschnitt)"
{
    "scripts": {
        "lint": "pint --test",
        "refactor-check": "rector process --dry-run",
        "analyse": "phpstan analyse --no-progress",
        "qa": ["@lint", "@refactor-check", "@analyse"]
    }
}
```

```json title="package.json (Ausschnitt)"
{
  "scripts": {
    "lint": "biome ci",
    "typecheck": "tsc --noEmit",
    "check": "npm run lint && npm run typecheck"
  }
}
```

- `@lint` ruft ein anderes Composer-Skript auf. Eine Liste läuft der Reihe nach und bricht beim ersten Fehler ab.
- Composer und npm legen `vendor/bin` beziehungsweise `node_modules/.bin` automatisch in den Suchpfad – du
  schreibst `pint` statt `./vendor/bin/pint`.

Danach genügt `composer qa` oder `npm run check` – lokal, im Hook und in der CI.

> [!MERKSATZ]
> Die CI ruft dieselben Befehle auf wie du. Steht eine Prüfung nur in der Workflow-Datei, kann sie lokal
> niemand nachstellen.

## Die Pipeline in GitHub Actions

Eine Pipeline in [[github-actions|GitHub Actions]] ist eine YAML-Datei unter `.github/workflows/`:

```yaml title=".github/workflows/qa.yml"
name: QA

on: [push, pull_request]

jobs:
  qa:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: shivammathur/setup-php@v2
        with:
          php-version: "8.5"
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
      - run: composer install --no-interaction --no-progress
      - run: npm ci
      - run: composer qa
      - run: npm run check
```

Jeder `run`-Schritt ist ein Shell-Befehl. Endet er mit einem Exit-Code ungleich 0, wird der Job rot, und die
folgenden Schritte laufen nicht mehr.

- **`on`** legt fest, wann der Workflow startet – hier bei jedem Push und jedem Pull Request.
- **`runs-on`** wählt den [[runner|Runner]], also die Maschine, auf der der Job läuft.
- **`uses`** bindet eine fertige Action ein, etwa zum Auschecken oder zum Einrichten von PHP und Node.
- **`npm ci`** installiert exakt die Versionen aus der `package-lock.json` – so formatiert Biome in der CI
  genau wie bei dir.

![Qualitäts-Pipeline: schnell vor langsam](/assets/code-qualitaet/ci-pipeline.svg)

## Reihenfolge und Geschwindigkeit

Eine gute Pipeline meldet die häufigsten Fehler **zuerst**:

| Schritt | Dauer | Warum hier |
|---|---|---|
| Formatter und Linter | Sekunden | Häufigste Fehler, schnellstes Feedback |
| Rector (dry-run) | Sekunden | Vergessene Umbauten |
| PHPStan, `tsc` | Sekunden bis 1 Minute | Braucht das komplette Projekt |
| Tests | Minuten | Am langsamsten |

Zwei Kniffe sparen Zeit: **Caching** der Abhängigkeiten (`cache: npm` oben, für Composer z. B. mit
`actions/cache`) und **Ausgabeformate**, die Fehler direkt im Pull Request anzeigen. PHPStan schreibt mit
`--error-format=github` Kommentare an die betroffenen Zeilen, `biome ci` erkennt GitHub Actions von selbst.

> [!FEHLER]
> `phpstan analyse | tee phpstan.log` in einer Pipeline – der Exit-Code ist jetzt der von `tee`, also `0`. Die
> Pipeline bleibt grün, obwohl PHPStan Fehler gefunden hat. Lass Pipes in Prüfschritten weg oder setze
> `set -o pipefail`.

## Die Qualitätsschranke schließen

Eine rote Pipeline nützt nur, wenn sie den Merge auch verhindert. Dafür schützt man den Haupt-Branch
([[geschuetzter-branch|geschützter Branch]]) und macht den Job zum Pflicht-[[status-check|Status-Check]]:
Ein Pull Request kann erst gemergt werden, wenn `qa` grün ist. Erst damit ist die
[[quality-gate|Qualitätsschranke]] wirklich zu.

> [!PRAXIS]
> Lege die Pipeline zuerst in einem eigenen Pull Request an und baue absichtlich einen Fehler ein. Erst wenn du
> gesehen hast, dass die Pipeline **rot** wird, kannst du ihr vertrauen.

## Zusammenfassung

- Composer- und npm-Skripte bündeln alle Prüfungen hinter einem Befehl wie `composer qa` oder `npm run check`.
- Die CI ruft genau diese Befehle auf – lokal und in der Pipeline läuft dasselbe.
- Ein Workflow in `.github/workflows/` checkt aus, installiert Abhängigkeiten und führt die Prüfungen aus.
- Schnelle Prüfungen zuerst, Tests zuletzt; ein Exit-Code ungleich 0 stoppt den Job.
- Erst ein Pflicht-Status-Check auf dem geschützten Branch macht aus der Pipeline eine echte Qualitätsschranke.
