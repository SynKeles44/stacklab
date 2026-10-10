---
title: Matrix, Cache und Artefakte
summary: Denselben Job für mehrere Versionen starten, Abhängigkeiten zwischen Läufen cachen und Build-Ergebnisse per Artefakt und Job-Output an spätere Jobs weitergeben.
duration: 25
sources:
  - title: GitHub Docs – Running variations of jobs in a workflow
    url: https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/run-job-variations
  - title: GitHub Docs – Dependency caching reference
    url: https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching
  - title: GitHub Docs – Store and share data with workflow artifacts
    url: https://docs.github.com/en/actions/tutorials/store-and-share-data
  - title: GitHub Docs – Passing information between jobs
    url: https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/pass-job-outputs
  - title: actions/cache
    url: https://github.com/actions/cache
quiz:
  - type: single
    question: "Eine Matrix hat `php: ['8.4', '8.5']` und `db: [mysql, pgsql]`, dazu `exclude` mit `{ php: '8.4', db: pgsql }`. Wie viele Jobs laufen?"
    options: ["2", "3", "4", "5"]
    answer: 1
    explanation: Zwei mal zwei ergibt vier Kombinationen, eine davon wird ausgeschlossen – bleiben drei.
  - type: multiple
    question: Welche Aussagen über Cache und Artefakte stimmen?
    options:
      - Ein Cache beschleunigt spätere Läufe, ist aber nur eine Abkürzung – fehlt er, muss alles trotzdem funktionieren.
      - Ein Artefakt gibt Dateien an andere Jobs weiter und kann heruntergeladen werden.
      - Der Cache-Schlüssel sollte den Hash des Lockfiles enthalten.
      - Artefakte eignen sich, um Secrets zwischen Jobs zu teilen.
    answers: [0, 1, 2]
    explanation: >
      Cache = Beschleunigung, Artefakt = Ergebnis. Ändert sich das Lockfile, ändert sich der Schlüssel und der
      Cache wird neu aufgebaut. Secrets gehören nie in Artefakte – jeder mit Lesezugriff kann sie herunterladen.
  - type: cloze
    text: "Ein Step schreibt einen Output mit `echo \"sha=...\" >> \"$GITHUB_OUTPUT\"`. Damit der Job ihn findet, braucht der Step eine ___. Ein späterer Job liest den Wert über `needs.build.___.sha`."
    blanks:
      - [id]
      - [outputs]
    explanation: Steps schreiben Schlüssel-Wert-Paare in die Datei aus $GITHUB_OUTPUT; der Job reicht sie über `outputs` weiter.
  - type: match
    question: Ordne jedem Werkzeug seinen Zweck zu.
    pairs:
      - { left: "strategy.matrix", right: "denselben Job mit verschiedenen Werten starten" }
      - { left: "actions/cache", right: "Abhängigkeiten zwischen Läufen aufheben" }
      - { left: "actions/upload-artifact", right: "Build-Ergebnis speichern und weitergeben" }
      - { left: "jobs.<id>.outputs", right: "kleine Werte wie eine Versionsnummer weiterreichen" }
    explanation: Für Dateien nimmst du Artefakte, für kurze Texte Outputs, für Beschleunigung den Cache.
tasks:
  - id: build-workflow
    type: terminal
    title: Matrix, Cache und Artefakt in einem Workflow
    description: |
      Im Ordner `matrix` liegt eine PHP-App mit `composer.json` und dem Build-Skript `build.sh`, das ein Archiv
      in `dist/` erzeugt. Schreib `.github/workflows/build.yml`:

      1. Trigger: `push` auf `main` und `pull_request`; `permissions` mit `contents: read`.
      2. Job `test` auf `ubuntu-latest` mit einer Matrix `php: ['8.4', '8.5']` und `fail-fast: false`.
         Steps: `actions/checkout@v7`, `shivammathur/setup-php@v2` mit `php-version: ${{ matrix.php }}`,
         dann `actions/cache@v6` mit `path: vendor` und einem `key`, der `matrix.php` **und**
         `hashFiles('composer.lock')` enthält, danach `run: composer install --no-interaction` und
         `run: composer test`.
      3. Job `build`, der `test` braucht: Checkout, `run: ./build.sh`, danach `actions/upload-artifact@v7` mit
         `name: app`, `path: dist/` und `retention-days: 7`.
      4. Führe `./build.sh` einmal lokal aus.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: matrix
    setup: |
      mkdir -p src
      cat > composer.json <<'EOF'
      {
          "name": "example/matrix-app",
          "type": "project",
          "require": { "php": "^8.4" },
          "scripts": { "test": "php -r \"exit(0);\"" }
      }
      EOF
      printf '<?php\n\necho "Hallo";\n' > src/app.php
      cat > build.sh <<'EOF'
      #!/usr/bin/env bash
      set -euo pipefail
      mkdir -p dist
      tar -czf dist/app.tar.gz src composer.json
      echo "dist/app.tar.gz"
      EOF
      chmod +x build.sh
    checks:
      - type: command
        run: bun -e 'Bun.YAML.parse(await Bun.file(".github/workflows/build.yml").text())'
        message: .github/workflows/build.yml fehlt oder ist kein gültiges YAML.
      - type: command
        run: |
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/build.yml").text())))' | jq -e '.on.push.branches == ["main"] and (.on | has("pull_request")) and .permissions.contents == "read"'
        message: "Prüfe die Trigger (push auf main, pull_request) und permissions mit contents: read."
      - type: command
        run: |
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/build.yml").text())))' | jq -e '(.jobs.test.strategy.matrix.php | map(tostring) | sort) == ["8.4","8.5"] and .jobs.test.strategy["fail-fast"] == false'
        message: "Job test braucht strategy.matrix.php mit '8.4' und '8.5' (in Anführungszeichen) und fail-fast: false."
      - type: command
        run: |
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/build.yml").text())))' | jq -e '.jobs.test.steps | map(select((.uses // "") | startswith("shivammathur/setup-php@v2"))) | .[0].with["php-version"] | test("matrix\\.php")'
        message: setup-php soll php-version aus der Matrix bekommen (${{ matrix.php }}).
      - type: command
        run: |
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/build.yml").text())))' | jq -e '.jobs.test.steps | map(select(.uses == "actions/cache@v6")) | .[0] | (.with.path == "vendor") and (.with.key | test("matrix\\.php")) and (.with.key | test("hashFiles\\(.composer\\.lock.\\)"))'
        message: "Der Cache-Step (actions/cache@v6) braucht path: vendor und einen key mit matrix.php und hashFiles('composer.lock')."
      - type: command
        run: |
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/build.yml").text())))' | jq -e '(.jobs.test.steps | map(.run // "") | (any(test("composer install")) and any(test("composer test"))))'
        message: Im Job test fehlen run-Steps für composer install und composer test.
      - type: command
        run: |
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/build.yml").text())))' | jq -e '(.jobs.build.needs == "test" or .jobs.build.needs == ["test"]) and (.jobs.build.steps | map(.run // "") | any(test("\\./build\\.sh")))'
        message: "Job build braucht needs: test und einen Step run: ./build.sh."
      - type: command
        run: |
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/build.yml").text())))' | jq -e '.jobs.build.steps | map(select(.uses == "actions/upload-artifact@v7")) | .[0].with | .name == "app" and (.path | test("^dist/?$")) and (.["retention-days"] | tostring) == "7"'
        message: "Es fehlt actions/upload-artifact@v7 mit name: app, path: dist/ und retention-days: 7."
      - type: file_exists
        path: dist/app.tar.gz
        message: Führe ./build.sh einmal lokal aus – dist/app.tar.gz fehlt noch.
    hints:
      - "Die Matrix steht unter `strategy:` – daneben `fail-fast: false`, darunter `matrix:` mit `php: ['8.4', '8.5']`."
      - "Cache-Schlüssel zum Beispiel: `key: composer-${{ runner.os }}-${{ matrix.php }}-${{ hashFiles('composer.lock') }}`."
      - "Prüfe die Struktur mit `bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(\".github/workflows/build.yml\").text())))' | jq .jobs`."
    solution: |
      ```bash
      cd matrix
      mkdir -p .github/workflows
      cat > .github/workflows/build.yml <<'EOF'
      name: Build

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
            fail-fast: false
            matrix:
              php: ['8.4', '8.5']
          steps:
            - uses: actions/checkout@v7
            - uses: shivammathur/setup-php@v2
              with:
                php-version: ${{ matrix.php }}
            - uses: actions/cache@v6
              with:
                path: vendor
                key: composer-${{ runner.os }}-${{ matrix.php }}-${{ hashFiles('composer.lock') }}
                restore-keys: |
                  composer-${{ runner.os }}-${{ matrix.php }}-
            - run: composer install --no-interaction
            - run: composer test

        build:
          needs: test
          runs-on: ubuntu-latest
          steps:
            - uses: actions/checkout@v7
            - run: ./build.sh
            - uses: actions/upload-artifact@v7
              with:
                name: app
                path: dist/
                retention-days: 7
      EOF
      ./build.sh
      ```
  - id: cache-suche
    type: code
    language: js
    title: So findet actions/cache einen Treffer
    description: |
      `actions/cache` sucht zuerst nach dem **exakten** `key`. Gibt es keinen, probiert es die `restoreKeys`
      **der Reihe nach** als **Präfix**. Passen mehrere gespeicherte Einträge auf denselben Präfix, gewinnt der
      **neueste** (größtes `created`).

      Schreib `findCache(key, restoreKeys, entries)`:

      - `entries` ist ein Array wie `[{ key: 'composer-8.5-abc', created: 3 }]`.
      - Rückgabe: `{ hit: 'exact', key }`, `{ hit: 'partial', key }` oder `null`, wenn nichts passt.
    starter: |
      function findCache(key, restoreKeys, entries) {
        // 1. exakter Treffer?
        // 2. restoreKeys der Reihe nach als Präfix, neuester Eintrag gewinnt
        return null
      }
    tests:
      - name: exakter Treffer gewinnt
        code: |
          const entries = [{ key: 'composer-8.5-abc', created: 1 }, { key: 'composer-8.5-old', created: 9 }]
          assertDeepEqual(findCache('composer-8.5-abc', ['composer-8.5-'], entries), { hit: 'exact', key: 'composer-8.5-abc' })
      - name: Präfix-Treffer nimmt den neuesten Eintrag
        code: |
          const entries = [{ key: 'composer-8.5-a', created: 1 }, { key: 'composer-8.5-b', created: 5 }, { key: 'composer-8.4-c', created: 9 }]
          assertDeepEqual(findCache('composer-8.5-new', ['composer-8.5-'], entries), { hit: 'partial', key: 'composer-8.5-b' })
      - name: restoreKeys der Reihe nach
        code: |
          const entries = [{ key: 'composer-8.4-x', created: 7 }, { key: 'composer-other', created: 9 }]
          assertDeepEqual(findCache('composer-8.5-new', ['composer-8.5-', 'composer-'], entries), { hit: 'partial', key: 'composer-other' })
      - name: kein Treffer
        code: "assertEqual(findCache('npm-abc', ['npm-'], [{ key: 'composer-1', created: 1 }]), null)"
      - name: leerer Cache
        code: "assertEqual(findCache('npm-abc', [], []), null)"
    solution: |
      function findCache(key, restoreKeys, entries) {
        if (entries.some((entry) => entry.key === key)) {
          return { hit: 'exact', key }
        }
        for (const prefix of restoreKeys) {
          const matches = entries.filter((entry) => entry.key.startsWith(prefix))
          if (matches.length > 0) {
            const newest = matches.reduce((a, b) => (b.created > a.created ? b : a))
            return { hit: 'partial', key: newest.key }
          }
        }
        return null
      }
---

Dein Workflow ist grün, aber jeder Lauf dauert acht Minuten – fünf davon lädt Composer dieselben Pakete
herunter. Außerdem willst du wissen, ob der Code auch mit der nächsten PHP-Version läuft, und das gebaute
Paket soll der Deploy-Job bekommen, ohne es neu zu bauen. Drei Werkzeuge lösen diese drei Probleme.

## Die Matrix: ein Job, viele Varianten

Eine [[matrix-build|Matrix]] startet denselben Job für jede Kombination ihrer Werte. Du kennst sie aus dem
GitHub-Kurs; zwei Einstellungen machen sie alltagstauglich:

```yaml title="Matrix mit exclude und fail-fast"
strategy:
  fail-fast: false
  matrix:
    php: ['8.4', '8.5']
    db: [mysql, pgsql]
    exclude:
      - php: '8.4'
        db: pgsql
```

| Schlüssel | Wirkung |
|---|---|
| `exclude` | entfernt einzelne Kombinationen |
| `include` | fügt Kombinationen oder Zusatzwerte hinzu |
| `fail-fast` | `true` (Standard): ein roter Job bricht die anderen ab |
| `max-parallel` | begrenzt, wie viele gleichzeitig laufen |

`fail-fast: false` lohnt sich bei Versions-Matrizen: Du willst sehen, **welche** Versionen scheitern, nicht
nur die erste.

> [!FEHLER]
> **Versionen ohne Anführungszeichen.** `php: [8.4, 8.10]` liest YAML als Zahlen – aus `8.10` wird `8.1`.
> Schreib Versionen immer als Text: `['8.4', '8.10']`.

## Cache: schneller, nicht anders

Jeder Job startet auf einer leeren Maschine. Ein [[cache|Cache]] hebt Dateien wie `vendor/` oder
`node_modules/` zwischen Läufen auf. Herzstück ist der [[cache-schluessel|Cache-Schlüssel]]:

```yaml title="Composer-Abhängigkeiten cachen"
- uses: actions/cache@v6
  with:
    path: vendor
    key: composer-${{ runner.os }}-${{ matrix.php }}-${{ hashFiles('composer.lock') }}
    restore-keys: |
      composer-${{ runner.os }}-${{ matrix.php }}-
```

`hashFiles` bildet einen Fingerabdruck des [[lockfile|Lockfiles]]. Ändert sich eine Abhängigkeit, ändert
sich der Schlüssel – es gibt einen neuen Cache. Findet `actions/cache` keinen exakten Treffer, nimmt es den
neuesten Eintrag, der mit einem `restore-keys`-Präfix beginnt. `composer install` ergänzt dann nur, was fehlt.

Viele Setup-Actions bringen den Cache schon mit, etwa `actions/setup-node@v7` mit `cache: npm`.

Caches haben Grenzen: Ein Branch kann seine eigenen Caches und die des Standard-Branches nutzen, aber nicht die
anderer Feature-Branches. Einträge, die längere Zeit niemand abruft, löscht GitHub automatisch, und pro
Repository gibt es ein Speicherlimit. Rechne also immer damit, dass ein Lauf ohne Cache startet – er ist dann
nur langsamer, nicht anders.

> [!MERKSATZ]
> Ein Cache ist eine Abkürzung, kein Ergebnis. Der Job muss auch ohne Cache korrekt durchlaufen.

## Artefakte: Ergebnisse weitergeben

Ein [[workflow-artefakt|Workflow-Artefakt]] speichert Dateien aus einem Job – zum Beispiel dein
[[build-artefakt|Build-Artefakt]]. Andere Jobs laden es herunter, und du findest es in der Lauf-Übersicht.

```yaml title="Bauen und weitergeben"
build:
  needs: test
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v7
    - run: ./build.sh
    - uses: actions/upload-artifact@v7
      with:
        name: app
        path: dist/
        retention-days: 7

deploy:
  needs: build
  runs-on: ubuntu-latest
  steps:
    - uses: actions/download-artifact@v8
      with:
        name: app
        path: dist/
```

So setzt du „Build once, deploy many“ in GitHub Actions um: `deploy` baut nicht neu, sondern holt das
geprüfte Paket. `retention-days` legt fest, wie lange GitHub es aufbewahrt. Artefakte belegen
Speicherplatz deines Kontos: Für Zwischenergebnisse reichen wenige Tage, dauerhaft aufbewahrte
Release-Pakete hängst du besser an einen GitHub-Release oder legst sie in eine Registry.

## Job-Outputs für kleine Werte

Für eine Versionsnummer oder einen Hash ist ein Artefakt zu groß. Dafür gibt es
[[job-output|Job-Outputs]]: Ein Step schreibt in die Datei `$GITHUB_OUTPUT`, der Job reicht den Wert weiter.

```yaml title="Einen Wert an spätere Jobs geben"
build:
  runs-on: ubuntu-latest
  outputs:
    sha: ${{ steps.meta.outputs.sha }}
  steps:
    - uses: actions/checkout@v7
    - id: meta
      run: echo "sha=$(git rev-parse --short HEAD)" >> "$GITHUB_OUTPUT"

deploy:
  needs: build
  runs-on: ubuntu-latest
  steps:
    - run: echo "Deploye ${{ needs.build.outputs.sha }}"
```

> [!PRAXIS]
> Schreib niemals Secrets in Artefakte oder Outputs. Artefakte kann jeder mit Lesezugriff aufs Repository
> herunterladen, und Outputs landen im Protokoll.

## Zusammenfassung

- Eine **Matrix** prüft mehrere Versionen; `exclude`, `include` und `fail-fast` steuern sie.
- Versionsnummern in YAML immer in Anführungszeichen.
- Ein **Cache** spart Downloads; der Schlüssel enthält den Lockfile-Hash, `restore-keys` liefern Teil-Treffer.
- **Artefakte** geben Dateien an spätere Jobs weiter – Grundlage für „Build once, deploy many“.
- **Job-Outputs** transportieren kleine Werte über `$GITHUB_OUTPUT` und `needs.<job>.outputs`.
