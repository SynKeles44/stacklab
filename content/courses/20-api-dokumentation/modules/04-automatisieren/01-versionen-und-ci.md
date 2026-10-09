---
title: Versionen trennen und Doku in der CI prüfen
summary: Du erzeugst pro API-Version eine eigene Spezifikation und baust eine Prüfung, die fehlschlägt, sobald Code und eingecheckte Doku auseinanderlaufen.
duration: 25
sources:
  - title: Redocly CLI – Configuration (apis)
    url: https://redocly.com/docs/cli/configuration
  - title: git diff – Dokumentation (--exit-code)
    url: https://git-scm.com/docs/git-diff
  - title: GitHub Actions – Workflow-Syntax
    url: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
quiz:
  - type: single
    question: Warum bekommt jede API-Version eine eigene Spezifikationsdatei?
    options:
      - Weil OpenAPI nur einen Pfad pro Datei erlaubt
      - Weil Clients von v1 nur sehen sollen, was in v1 gilt – und v1 sich nicht still ändern darf, während v2 wächst
      - Damit die Dateien kleiner sind
      - Weil Redocly nur Dateien mit „v“ im Namen liest
    answer: 1
    explanation: >
      Eine Version ist ein Versprechen an ihre Nutzer. Getrennte Dateien machen sichtbar, dass v1 stabil
      bleibt, während in v2 Neues dazukommt.
  - type: cloze
    text: "Der Befehl git diff --___ -- docs endet mit Exit-Code 1, wenn sich Dateien unter docs geändert haben."
    blanks:
      - [exit-code]
    explanation: Mit --exit-code wird git diff zu einer Prüfung, die eine CI-Pipeline abbrechen kann.
  - type: multiple
    question: Welche Schritte gehören in einen CI-Job, der veraltete Doku verhindert?
    options:
      - Abhängigkeiten installieren (composer install, npm ci)
      - Spezifikationen aus dem Code neu erzeugen
      - Die erzeugten Dateien mit Redocly linten
      - Die eingecheckten Doku-Dateien löschen, damit nichts veraltet
      - Prüfen, ob sich die Dateien gegenüber dem Commit verändert haben
    answers: [0, 1, 2, 4]
    explanation: >
      Erzeugen, linten, vergleichen. Unterscheidet sich die neu erzeugte Datei von der eingecheckten,
      wurde vergessen, sie zu aktualisieren – der Job wird rot.
  - type: find-bug
    question: Dieses Prüfskript soll scheitern, wenn die Doku veraltet ist. Welche Zeile verhindert das?
    language: bash
    code: |
      #!/usr/bin/env bash
      set -euo pipefail
      ./vendor/bin/openapi src/V1 -o docs/v1/openapi.yaml
      npx redocly lint docs/v1/openapi.yaml
      git diff -- docs || true
    bug_line: 5
    explanation: >
      `git diff` ohne `--exit-code` endet immer mit 0, und `|| true` würde jeden Fehler zusätzlich
      verschlucken. Richtig ist `git diff --exit-code -- docs`.
tasks:
  - id: ci-reihenfolge
    type: order
    title: Der Doku-Job in der CI
    description: Bring die Schritte eines CI-Jobs, der die API-Doku prüft, in die richtige Reihenfolge.
    items:
      - Repository auschecken
      - PHP und Node.js einrichten
      - composer install und npm ci ausführen
      - Spezifikationen pro Version neu erzeugen
      - Erzeugte Dateien mit Redocly linten
      - Mit git diff --exit-code prüfen, ob die eingecheckte Doku aktuell ist
    hints:
      - Ohne installierte Pakete gibt es weder vendor/bin/openapi noch Redocly.
  - id: versionen-ci
    type: terminal
    title: Zwei Versionen und ein Drift-Wächter
    description: |
      Im Ordner `versionen` liegt ein Git-Repository mit einer Buch-API in zwei Versionen:
      `src/V1` und `src/V2` (jeweils mit eigenem `OA\Info`). swagger-php und Redocly CLI sind
      installiert. Klicke zuerst auf **Aufgabe vorbereiten** (das dauert einen Moment).

      1. Erzeuge `docs/v1/openapi.yaml` nur aus `src/V1` und `docs/v2/openapi.yaml` nur aus `src/V2`.
      2. Schreibe das Skript `bin/check-docs.sh`, das
         - beide Dateien neu erzeugt,
         - beide mit `npx redocly lint` prüft und
         - mit `git diff --exit-code -- docs` scheitert, wenn sich etwas geändert hat.
         Beginne es mit `#!/usr/bin/env bash` und `set -euo pipefail`.
      3. Committe `docs` und `bin` (z. B. `git add docs bin && git commit -m "docs: add api specs"`).
      4. Teste: `bash bin/check-docs.sh; echo $?` muss jetzt `0` ausgeben.
    workdir: versionen
    setup: |
      git init -q
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      mkdir -p src/V1 src/V2
      printf 'vendor/\nnode_modules/\n' > .gitignore
      cat > composer.json <<'EOF'
      {
          "name": "stacklab/buch-api",
          "type": "project",
          "autoload": {
              "psr-4": {
                  "App\\": "src/"
              }
          }
      }
      EOF
      timeout 170 composer require -q --no-interaction zircote/swagger-php:^6.12
      npm init -y >/dev/null
      timeout 170 npm install --no-audit --no-fund --silent @redocly/cli@2.62.1
      cat > redocly.yaml <<'EOF'
      extends:
        - recommended
      rules:
        no-server-example.com: off
        security-defined: off
        info-license: off
      EOF
      cat > src/V1/OpenApiV1.php <<'EOF'
      <?php

      declare(strict_types=1);

      namespace App\V1;

      use OpenApi\Attributes as OA;

      #[OA\OpenApi(openapi: "3.1.0")]
      #[OA\Info(version: "1.4.0", title: "Buch-API v1")]
      #[OA\Server(url: "https://api.example.com/v1")]
      final class OpenApiV1
      {
      }
      EOF
      cat > src/V1/BookController.php <<'EOF'
      <?php

      declare(strict_types=1);

      namespace App\V1;

      use OpenApi\Attributes as OA;

      final class BookController
      {
          #[OA\Get(path: "/books", operationId: "listBooks", summary: "Alle Bücher")]
          #[OA\Response(response: 200, description: "Liste der Bücher")]
          #[OA\Response(response: 401, description: "Nicht angemeldet")]
          public function index(): array
          {
              return [];
          }
      }
      EOF
      cat > src/V2/OpenApiV2.php <<'EOF'
      <?php

      declare(strict_types=1);

      namespace App\V2;

      use OpenApi\Attributes as OA;

      #[OA\OpenApi(openapi: "3.1.0")]
      #[OA\Info(version: "2.0.0", title: "Buch-API v2")]
      #[OA\Server(url: "https://api.example.com/v2")]
      final class OpenApiV2
      {
      }
      EOF
      cat > src/V2/BookController.php <<'EOF'
      <?php

      declare(strict_types=1);

      namespace App\V2;

      use OpenApi\Attributes as OA;

      final class BookController
      {
          #[OA\Get(path: "/books", operationId: "listBooks", summary: "Bücher seitenweise")]
          #[OA\Parameter(name: "page", in: "query", schema: new OA\Schema(type: "integer", minimum: 1))]
          #[OA\Response(response: 200, description: "Eine Seite der Bücherliste")]
          #[OA\Response(response: 401, description: "Nicht angemeldet")]
          public function index(): array
          {
              return [];
          }
      }
      EOF
      git add -A
      git commit -q -m "feat: add book api v1 and v2"
    checks:
      - type: command
        run: "for v in v1 v2; do d=$(mktemp -d \"$PWD/.pruefung-XXXXXX\"); npx redocly bundle docs/$v/openapi.yaml --ext json -o \"$d/s.json\" >/dev/null 2>&1; jq -r '.info.version' \"$d/s.json\" 2>/dev/null; rm -rf \"$d\"; done | paste -sd'|'"
        stdout_equals: "1.4.0|2.0.0"
        message: docs/v1/openapi.yaml soll Version 1.4.0 und docs/v2/openapi.yaml Version 2.0.0 enthalten. Erzeuge jede Datei nur aus ihrem eigenen Ordner (src/V1 bzw. src/V2).
      - type: command
        run: "! grep -q 'page' docs/v1/openapi.yaml && grep -q 'page' docs/v2/openapi.yaml"
        message: In docs/v1 darf der Parameter page aus v2 nicht auftauchen – und in docs/v2 muss er stehen. Scanne pro Version nur den passenden Ordner.
      - type: file_exists
        path: bin/check-docs.sh
        message: Das Skript bin/check-docs.sh fehlt.
      - type: file_contains
        path: bin/check-docs.sh
        pattern: "git diff --exit-code"
        message: bin/check-docs.sh muss mit git diff --exit-code prüfen, ob sich die Doku geändert hat.
      - type: command
        run: test -z "$(git status --porcelain -- docs bin)"
        message: docs und bin sind noch nicht (vollständig) committet. Nutze git add docs bin und git commit.
      - type: command
        run: bash bin/check-docs.sh >/dev/null 2>&1
        message: bash bin/check-docs.sh scheitert, obwohl alles aktuell sein sollte. Führe es selbst aus und lies die Ausgabe.
      - type: command
        run: "sed -i 's/summary: \"Alle Bücher\"/summary: \"Alle Bücher (Drift-Test)\"/' src/V1/BookController.php; bash bin/check-docs.sh >/dev/null 2>&1; e=$?; git checkout -q -- src docs; test $e -ne 0"
        message: bin/check-docs.sh erkennt veraltete Doku nicht. Nach einer Code-Änderung muss das Skript neu erzeugen und dann mit git diff --exit-code scheitern.
    hints:
      - "Pro Version ein Aufruf: `./vendor/bin/openapi src/V1 -o docs/v1/openapi.yaml` – für v2 entsprechend."
      - Mit `set -euo pipefail` bricht das Skript beim ersten fehlschlagenden Befehl ab und gibt dessen Exit-Code weiter.
      - Teste das Skript auch einmal mit einer absichtlichen Änderung in src/V1 – danach `git checkout -- src docs`.
    solution: |
      ```bash title="bin/check-docs.sh"
      #!/usr/bin/env bash
      set -euo pipefail

      ./vendor/bin/openapi src/V1 -o docs/v1/openapi.yaml
      ./vendor/bin/openapi src/V2 -o docs/v2/openapi.yaml

      npx redocly lint docs/v1/openapi.yaml docs/v2/openapi.yaml

      git diff --exit-code -- docs
      ```

      ```bash
      mkdir -p bin docs/v1 docs/v2
      ./vendor/bin/openapi src/V1 -o docs/v1/openapi.yaml
      ./vendor/bin/openapi src/V2 -o docs/v2/openapi.yaml
      nano bin/check-docs.sh
      chmod +x bin/check-docs.sh
      git add docs bin
      git commit -m "docs: add api specs"
      bash bin/check-docs.sh; echo $?
      ```
---
Deine API hat Kunden auf Version 1 und neue Funktionen in Version 2. Ein Kollege ändert einen Endpunkt
in v2 und vergisst, die Doku neu zu erzeugen. Niemand merkt es – bis ein Partner sich beschwert. In
dieser Lektion sorgst du dafür, dass so etwas automatisch auffällt.

## API-Versionen und ihre Spezifikationen

Wenn sich eine API inkompatibel ändert (ein [[breaking-change|Breaking Change]]), bekommt sie eine
neue Hauptversion. Bestehende Clients bleiben auf der alten. Üblich ist die Version im Pfad:

| Weg | Beispiel | Hinweis |
|---|---|---|
| Pfad | `https://api.example.com/v2/books` | Am verbreitetsten, gut sichtbar |
| Header | `Accept: application/vnd.example.v2+json` | Saubere URLs, schwerer zu testen |
| Query | `/books?version=2` | Selten, leicht zu übersehen |

Für die Doku heißt das: **eine Spezifikation pro Version**. Clients von v1 sollen nur sehen, was in
v1 gilt. Und v1 darf sich nicht still verändern, nur weil in v2 etwas Neues dazukommt. Das ist
[[api-versionierung|API-Versionierung]] auf Doku-Ebene.

```text title="Typische Ablage"
docs/
├── v1/openapi.yaml   ← info.version 1.4.0, servers …/v1
└── v2/openapi.yaml   ← info.version 2.0.0, servers …/v2
```

> [!MERKSATZ]
> Die Hauptversion steht im Pfad (`/v1`, `/v2`), die genaue Version in `info.version` (`1.4.0`).
> Jede Hauptversion hat ihre eigene Datei.

## Eine Datei pro Version erzeugen

Mit swagger-php trennst du die Versionen über die **Ordner**, die du scannst. Jede Version hat ihre
eigene `OA\Info`-Klasse und ihre eigenen Controller:

```bash title="Terminal"
./vendor/bin/openapi src/V1 -o docs/v1/openapi.yaml
./vendor/bin/openapi src/V2 -o docs/v2/openapi.yaml
```

Gemeinsam genutzte Schemas legst du z. B. in `src/Shared` und scannst den Ordner bei beiden Versionen
mit: `./vendor/bin/openapi src/Shared src/V2 -o docs/v2/openapi.yaml`.

Redocly kann alle Versionen auf einmal prüfen. In `redocly.yaml` gibst du ihnen Namen:

```yaml title="redocly.yaml"
extends:
  - recommended
apis:
  v1:
    root: docs/v1/openapi.yaml
  v2:
    root: docs/v2/openapi.yaml
```

Danach prüft `npx redocly lint` beide, `npx redocly lint v2` nur eine.

> [!FEHLER]
> Beide Versionen in **einem** Lauf erzeugen (`./vendor/bin/openapi src -o …`): Dann landen zwei
> `OA\Info`-Angaben und die Endpunkte von v1 und v2 durcheinander in einer Datei.

## Der Drift-Wächter

Die erzeugten Dateien liegen im Repository. Jetzt brauchst du eine Prüfung, die merkt, wenn jemand
den Code ändert, aber die Doku nicht neu erzeugt. Die Idee: **neu erzeugen und vergleichen**.

![Code-first: aus dem Code entsteht die Spezifikation, daraus Doku, Collections und Clients](/assets/api-dokumentation/code-first-pipeline.svg)

```bash title="bin/check-docs.sh"
#!/usr/bin/env bash
set -euo pipefail

./vendor/bin/openapi src/V1 -o docs/v1/openapi.yaml
./vendor/bin/openapi src/V2 -o docs/v2/openapi.yaml

npx redocly lint docs/v1/openapi.yaml docs/v2/openapi.yaml

git diff --exit-code -- docs
```

`git diff --exit-code` endet mit Exit-Code 1, sobald sich eine Datei unter `docs` vom letzten Commit
unterscheidet. `set -euo pipefail` sorgt dafür, dass das Skript beim ersten Fehler abbricht und
genau diesen [[exit-code|Exit-Code]] weitergibt.

> [!HINWEIS]
> `git diff` sieht nur Dateien, die Git schon kennt. Eine komplett neue, nie committete Datei fällt
> nicht auf. Wer das abdecken will, prüft zusätzlich `test -z "$(git status --porcelain -- docs)"`.

## Ab in die CI

Das Skript läuft lokal und in der [[ci-pipeline|CI-Pipeline]] gleich. Ein Job in
[[github-actions|GitHub Actions]] sieht etwa so aus:

```yaml title=".github/workflows/api-docs.yml"
name: API docs
on: [pull_request]
jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: shivammathur/setup-php@v2
        with:
          php-version: '8.5'
      - uses: actions/setup-node@v7
        with:
          node-version: 24
      - run: composer install --no-interaction
      - run: npm ci
      - run: bash bin/check-docs.sh
```

Wird der Job rot, weiß das Team: Doku neu erzeugen und mitcommitten. Breaking Changes zwischen zwei
Ständen einer Spezifikation erkennen Werkzeuge wie [oasdiff](https://github.com/oasdiff/oasdiff).

> [!PRAXIS]
> In größeren Projekten werden die Spezifikationen pro Version in der CI erzeugt und gelintet. Der
> `diff` der YAML-Dateien im Pull Request zeigt Reviewern auf einen Blick, wie sich die API ändert.

## Zusammenfassung

- Jede Hauptversion einer API bekommt ihre eigene Spezifikation, z. B. `docs/v1` und `docs/v2`.
- Mit swagger-php trennst du Versionen über die gescannten Ordner und je eine eigene `OA\Info`.
- `redocly.yaml` kann mehrere Spezifikationen unter `apis` zusammenfassen.
- Der Drift-Wächter erzeugt neu, lintet und prüft mit `git diff --exit-code -- docs`.
- Das gleiche Skript läuft lokal und in der CI – ein roter Job heißt: Doku neu erzeugen und committen.
