---
title: Workflows, Trigger und Job-Abhängigkeiten
summary: Wann ein Workflow startet, wie Jobs voneinander abhängen, wie Ausdrücke und Kontexte funktionieren und wie Concurrency doppelte Läufe verhindert.
duration: 25
sources:
  - title: GitHub Docs – Workflow syntax for GitHub Actions
    url: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
  - title: GitHub Docs – Events that trigger workflows
    url: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
  - title: GitHub Docs – Contexts reference
    url: https://docs.github.com/en/actions/reference/workflows-and-actions/contexts
  - title: GitHub Docs – Control the concurrency of workflows and jobs
    url: https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency
quiz:
  - type: match
    question: Ordne jedem Trigger zu, wann er den Workflow startet.
    pairs:
      - { left: "push", right: "Commits landen auf einem Branch oder ein Tag wird gepusht" }
      - { left: "pull_request", right: "Ein Pull Request wird geöffnet oder bekommt neue Commits" }
      - { left: "workflow_dispatch", right: "Jemand startet den Workflow per Knopf oder gh workflow run" }
      - { left: "schedule", right: "Zu festen Zeiten nach einem Cron-Ausdruck" }
    explanation: Ein Workflow kann mehrere Trigger gleichzeitig haben – sie stehen alle unter `on`.
  - type: single
    question: "Job `deploy` hat `needs: [lint, test]`. Was passiert, wenn `test` fehlschlägt?"
    options:
      - deploy läuft trotzdem, weil lint grün war.
      - deploy wird übersprungen.
      - deploy startet gleichzeitig mit test.
      - Der ganze Workflow wird neu gestartet.
    answer: 1
    explanation: >
      `needs` wartet auf alle genannten Jobs. Scheitert einer davon, wird der abhängige Job standardmäßig
      übersprungen.
  - type: find-bug
    question: Dieser Job soll nur auf main deployen, läuft aber auch auf jedem Feature-Branch. In welcher Zeile steckt der Fehler?
    language: yaml
    code: |
      jobs:
        deploy:
          needs: test
          if: github.ref == 'main'
          runs-on: ubuntu-latest
          steps:
            - run: ./deploy.sh
    bug_line: 4
    explanation: >
      `github.ref` enthält die volle Referenz `refs/heads/main`. Der Vergleich mit `'main'` ist nie wahr – der Job
      würde nie laufen. Richtig: `github.ref == 'refs/heads/main'` oder `github.ref_name == 'main'`.
  - type: cloze
    text: "Mit `concurrency: group` und `cancel-in-___: true` bricht GitHub einen älteren Lauf derselben Gruppe ab. Den Commit des Laufs liefert der Ausdruck `${{ github.___ }}`."
    blanks:
      - [progress]
      - [sha]
    explanation: Concurrency spart Rechenzeit bei vielen Pushes; `github.sha` ist der Commit-Hash, für den der Lauf startet.
tasks:
  - id: workflow-trigger
    type: terminal
    title: Schreib einen CI-Workflow mit Triggern und Abhängigkeiten
    description: |
      Im Ordner `trigger` liegt eine kleine PHP-App mit dem Skript `ci.sh` (Argument `lint` oder `test`).
      Schreib `.github/workflows/ci.yml`:

      1. `name: CI`
      2. Trigger: `push` auf `main` – aber **nicht**, wenn sich nur Dateien unter `docs/` ändern
         (`paths-ignore`), außerdem `pull_request` und `workflow_dispatch`.
      3. `concurrency` mit der Gruppe `ci-${{ github.ref }}` und `cancel-in-progress: true`.
      4. `permissions` mit `contents: read`.
      5. Job `lint` auf `ubuntu-latest`: `actions/checkout@v7`, dann `shivammathur/setup-php@v2` mit
         `php-version: '8.5'`, dann `run: ./ci.sh lint`.
      6. Job `test` mit denselben Steps, aber `run: ./ci.sh test` – und er startet erst, wenn `lint` grün ist.
      7. Prüfe lokal mit `./ci.sh lint` und `./ci.sh test`, dass beide Befehle grün sind.

      Stacklab liest deine Datei mit einem echten YAML-Parser und prüft die Struktur.
      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: trigger
    setup: |
      mkdir -p src tests docs
      printf '<?php\n\ndeclare(strict_types=1);\n\nfunction slugify(string $text): string\n{\n    return trim((string) preg_replace("/[^a-z0-9]+/", "-", strtolower($text)), "-");\n}\n' > src/slug.php
      printf '<?php\n\nrequire __DIR__ . "/../src/slug.php";\n\nexit(slugify("Hallo Welt!") === "hallo-welt" ? 0 : 1);\n' > tests/run.php
      printf '# Doku\n' > docs/index.md
      cat > ci.sh <<'EOF'
      #!/usr/bin/env bash
      set -euo pipefail
      case "${1:-}" in
        lint) for f in src/*.php tests/*.php; do php -l "$f" > /dev/null; done; echo "lint ok" ;;
        test) php tests/run.php && echo "test ok" ;;
        *) echo "Aufruf: ./ci.sh lint|test" >&2; exit 2 ;;
      esac
      EOF
      chmod +x ci.sh
    checks:
      - type: command
        run: bun -e 'Bun.YAML.parse(await Bun.file(".github/workflows/ci.yml").text())'
        message: .github/workflows/ci.yml fehlt oder ist kein gültiges YAML (Einrückung mit Leerzeichen prüfen).
      - type: command
        run: |
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/ci.yml").text())))' | jq -e '.name == "CI" and .on.push.branches == ["main"] and (.on | has("pull_request")) and (.on | has("workflow_dispatch"))'
        message: "Prüfe name: CI und die Trigger: push mit branches [main], pull_request und workflow_dispatch."
      - type: command
        run: |
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/ci.yml").text())))' | jq -e '.on.push["paths-ignore"] | map(test("^docs/")) | any'
        message: Unter push fehlt paths-ignore mit einem Muster für docs/, z. B. 'docs/**'.
      - type: command
        run: |
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/ci.yml").text())))' | jq -e '(.concurrency.group | test("^ci-\\$\\{\\{\\s*github\\.ref\\s*\\}\\}$")) and .concurrency["cancel-in-progress"] == true'
        message: concurrency braucht group "ci-${{ github.ref }}" und cancel-in-progress true.
      - type: command
        run: |
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/ci.yml").text())))' | jq -e '.permissions.contents == "read"'
        message: "Es fehlt permissions mit contents: read."
      - type: command
        run: |
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/ci.yml").text())))' | jq -e '.jobs.lint["runs-on"] == "ubuntu-latest" and (.jobs.lint.steps | map(.uses // "") | index("actions/checkout@v7") != null) and (.jobs.lint.steps | map(select((.uses // "") | startswith("shivammathur/setup-php@v2")) | .with["php-version"] | tostring) | index("8.5") != null) and (.jobs.lint.steps | map(.run // "") | index("./ci.sh lint") != null)'
        message: "Job lint braucht runs-on ubuntu-latest, actions/checkout@v7, shivammathur/setup-php@v2 mit php-version '8.5' und run: ./ci.sh lint."
      - type: command
        run: |
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/ci.yml").text())))' | jq -e '(.jobs.test.needs == "lint" or .jobs.test.needs == ["lint"]) and (.jobs.test.steps | map(.run // "") | index("./ci.sh test") != null) and (.jobs.test.steps | map(.uses // "") | index("actions/checkout@v7") != null)'
        message: "Job test braucht needs: lint, einen Checkout und run: ./ci.sh test."
      - type: command
        run: ./ci.sh lint && ./ci.sh test
        message: ./ci.sh lint oder ./ci.sh test schlägt lokal fehl.
    hints:
      - "Gerüst: `on:` → `push:` (mit `branches:` und `paths-ignore:`), `pull_request:`, `workflow_dispatch:` – leere Trigger schreibst du einfach mit Doppelpunkt ohne Wert."
      - "Ausdrücke wie `${{ github.ref }}` schreibst du wörtlich in die Datei. Die Abhängigkeit lautet `needs: lint`."
      - "Prüfe die Struktur selbst: `bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(\".github/workflows/ci.yml\").text())))' | jq .`"
    solution: |
      ```bash
      cd trigger
      mkdir -p .github/workflows
      cat > .github/workflows/ci.yml <<'EOF'
      name: CI

      on:
        push:
          branches: [main]
          paths-ignore:
            - 'docs/**'
        pull_request:
        workflow_dispatch:

      concurrency:
        group: ci-${{ github.ref }}
        cancel-in-progress: true

      permissions:
        contents: read

      jobs:
        lint:
          runs-on: ubuntu-latest
          steps:
            - uses: actions/checkout@v7
            - uses: shivammathur/setup-php@v2
              with:
                php-version: '8.5'
            - run: ./ci.sh lint

        test:
          needs: lint
          runs-on: ubuntu-latest
          steps:
            - uses: actions/checkout@v7
            - uses: shivammathur/setup-php@v2
              with:
                php-version: '8.5'
            - run: ./ci.sh test
      EOF
      ./ci.sh lint && ./ci.sh test
      ```
  - id: workflow-manuell
    type: simulated
    title: Starte einen Workflow von Hand
    description: |
      Dein Repository hat einen Workflow `smoke.yml` mit dem Trigger `workflow_dispatch` und einem Eingabewert
      `target` (Auswahl `staging` oder `production`). Nutze die GitHub CLI:

      1. Liste die Workflows des Repositorys auf.
      2. Starte `smoke.yml` mit dem Eingabewert `target=staging`.
      3. Sieh dir die letzten Läufe dieses Workflows an.
    prompt: "du@laptop:~/shop$"
    steps:
      - expect: "^gh\\s+workflow\\s+list\\s*$"
        output: |
          NAME        STATE   ID
          CI          active  101
          Smoke-Test  active  102
          Release     active  103
        hint: "`gh workflow list` zeigt alle Workflows."
      - expect: "^gh\\s+workflow\\s+run\\s+smoke\\.yml\\s+(-f|--raw-field|-F|--field)\\s+target=staging\\s*$"
        output: |
          ✓ Created workflow_dispatch event for smoke.yml at main

          To see runs for this workflow, try: gh run list --workflow="smoke.yml"
        hint: "Eingabewerte übergibst du mit `-f name=wert`: `gh workflow run smoke.yml -f target=staging`."
      - expect: "^gh\\s+run\\s+list\\s+(--workflow[= ]|-w\\s+)[\"']?smoke\\.yml[\"']?\\s*$"
        output: |
          STATUS  TITLE       WORKFLOW    BRANCH  EVENT              ID          ELAPSED  AGE
          *       Smoke-Test  Smoke-Test  main    workflow_dispatch  1234567890  12s      now
          ✓       Smoke-Test  Smoke-Test  main    workflow_dispatch  1234567801  41s      2d
        hint: "`gh run list --workflow=smoke.yml`"
    responses:
      - match: "^gh\\s+run\\s+watch"
        output: "✓ main Smoke-Test · 1234567890\nTriggered via workflow_dispatch less than a minute ago"
---

Ein Workflow, der bei **jedem** Ereignis alles tut, kostet Zeit und Geld. Einer, der zu selten läuft,
übersieht Fehler. In dieser Lektion lernst du, genau zu steuern, **wann** ein [[workflow|Workflow]]
startet und **in welcher Reihenfolge** seine Jobs laufen. Die Grundbausteine kennst du aus dem
GitHub-Kurs – jetzt gehen wir in die Tiefe.

## Trigger: wann ein Workflow startet

Unter `on` stehen die [[workflow-trigger|Trigger]]. Jeder kann mit Filtern eingeschränkt werden.

```yaml title="Trigger mit Filtern"
on:
  push:
    branches: [main]
    paths-ignore:
      - 'docs/**'
  pull_request:
    branches: [main]
  workflow_dispatch:
  schedule:
    - cron: '30 3 * * 1'
```

| Trigger | Startet bei … |
|---|---|
| `push` | Commits auf Branches oder neuen Tags (`tags: ['v*']`) |
| `pull_request` | PR geöffnet, aktualisiert, wieder geöffnet |
| `workflow_dispatch` | Klick auf „Run workflow“ oder `gh workflow run` |
| `schedule` | [[cron|Cron]]-Zeitplan in UTC, z. B. montags 3:30 Uhr |

`paths` und `paths-ignore` filtern nach geänderten Dateien: Ein Tippfehler in der Doku muss keine
zehnminütige Testsuite starten.

## Manuelle Starts mit Eingaben

[[workflow-dispatch|workflow_dispatch]] kann Eingaben abfragen – praktisch für Deployments oder Wartungsaufgaben.

```yaml title="Eingaben für einen manuellen Start"
on:
  workflow_dispatch:
    inputs:
      target:
        description: 'Wohin?'
        required: true
        type: choice
        options: [staging, production]
```

Im Job liest du den Wert mit `${{ inputs.target }}`. Erlaubte Typen sind `string`, `boolean`, `number`,
`choice` und `environment`.

> [!MERKSATZ]
> `on` beantwortet die Frage **wann**, `jobs` die Frage **was**. Filter wie `branches` und `paths` sparen
> Läufe, die nichts Neues prüfen würden.

## Jobs, needs und if

Jeder [[workflow-job|Job]] läuft auf einem eigenen frischen [[runner|Runner]] und besteht aus
[[workflow-step|Steps]]. Ohne weitere Angabe starten alle Jobs **gleichzeitig**. Mit
[[job-abhaengigkeit|needs]] baust du eine Reihenfolge:

```yaml title="Jobs mit Abhängigkeiten"
jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [ ... ]
  test:
    needs: lint
    runs-on: ubuntu-latest
    steps: [ ... ]
  deploy:
    needs: [lint, test]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps: [ ... ]
```

Scheitert ein Job, werden alle, die ihn per `needs` brauchen, übersprungen – das ist Fail fast auf
Job-Ebene. Mit `if` läuft ein Job oder Step nur unter einer Bedingung, etwa nur auf `main`.

> [!FEHLER]
> **`github.ref` mit `main` vergleichen.** `github.ref` enthält `refs/heads/main`, nicht `main`. Nutze
> `github.ref == 'refs/heads/main'` oder `github.ref_name == 'main'`.

## Ausdrücke und Kontexte

`${{ … }}` ist ein [[ausdruck|Ausdruck]], den GitHub vor dem Ausführen auswertet. Darin liest du
[[github-kontext|Kontexte]] – Objekte mit Infos zum Lauf:

| Ausdruck | Beispielwert |
|---|---|
| `github.sha` | `3f2a9c1e…` (Commit des Laufs) |
| `github.ref_name` | `main` oder `v1.4.2` |
| `github.event_name` | `push`, `pull_request` … |
| `inputs.target` | `staging` |
| `secrets.NAME` | ein Geheimnis (nächste Lektionen) |

Ein Ausdruck kann auch vergleichen und Funktionen nutzen: `startsWith(github.ref, 'refs/tags/')`.

## Concurrency: keine doppelten Läufe

Pushst du dreimal in einer Minute, starten drei Läufe. Meist interessiert nur der neueste.
[[concurrency-gruppe|Concurrency]] fasst Läufe zu einer Gruppe zusammen:

```yaml title="Ältere Läufe abbrechen"
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```

Pro Branch läuft dann höchstens ein Lauf, ältere werden abgebrochen. Für Deployments setzt du
`cancel-in-progress: false`: Ein halb abgebrochenes Deployment ist gefährlicher als ein wartendes.

> [!PRAXIS]
> Vor dem ersten `git push` lohnt sich ein Werkzeug wie `actionlint`, das Workflows statisch prüft:
> falsche Schlüssel, Tippfehler in Ausdrücken, unbekannte Kontexte. Viele Teams lassen es selbst als
> CI-Job laufen.

## Zusammenfassung

- `on` legt fest, wann ein Workflow startet: `push`, `pull_request`, `workflow_dispatch`, `schedule` …
- Filter wie `branches`, `tags`, `paths` und `paths-ignore` vermeiden überflüssige Läufe.
- Jobs laufen parallel; `needs` erzwingt eine Reihenfolge, `if` eine Bedingung.
- `${{ … }}` wertet Ausdrücke mit Kontexten wie `github`, `inputs` und `secrets` aus.
- **Concurrency** bricht veraltete CI-Läufe ab und reiht Deployments hintereinander ein.
