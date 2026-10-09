---
title: Spezifikationen linten mit Redocly CLI
summary: Du prüfst OpenAPI-Dateien mit Redocly CLI, liest die Meldungen, behebst Fehler und passt die Regeln mit redocly.yaml an dein Team an.
duration: 25
sources:
  - title: Redocly CLI – lint
    url: https://redocly.com/docs/cli/commands/lint
  - title: Redocly CLI – Built-in rules
    url: https://redocly.com/docs/cli/rules/built-in-rules
  - title: Redocly CLI – Configuration
    url: https://redocly.com/docs/cli/configuration
quiz:
  - type: single
    question: Wann endet `npx redocly lint openapi.yaml` mit einem Exit-Code ungleich 0?
    options:
      - Sobald es mindestens eine Warnung gibt.
      - Sobald es mindestens einen Fehler (error) gibt.
      - Nur wenn die Datei nicht existiert.
      - Nie, lint gibt immer 0 zurück.
    answer: 1
    explanation: >
      Fehler lassen den Befehl scheitern, Warnungen nicht. Genau deshalb eignet er sich für die CI:
      Ein Fehler bricht den Build ab, eine Warnung ist ein Hinweis.
  - type: match
    question: Ordne jede Regel dem Problem zu, das sie findet.
    pairs:
      - { left: "no-unresolved-refs", right: "Ein $ref zeigt ins Leere" }
      - { left: "path-parameters-defined", right: "Ein Platzhalter {id} ist nicht als Parameter beschrieben" }
      - { left: "operation-operationId-unique", right: "Zwei Operationen heißen gleich" }
      - { left: "security-defined", right: "Für eine Operation ist keine Anmeldung angegeben" }
    explanation: Der Regelname steht in jeder Meldung. Auf redocly.com gibt es zu jeder Regel eine eigene Seite.
  - type: cloze
    text: "In der Datei ___ legst du die Regeln fest. Mit extends: [___] übernimmst du den empfohlenen Regelsatz, und mit dem Wert ___ schaltest du eine Regel ab."
    blanks:
      - [redocly.yaml]
      - [recommended]
      - ["off"]
    explanation: Jede Regel kann error, warn oder off sein. extends lädt einen fertigen Regelsatz als Grundlage.
  - type: multiple
    question: Welche Aussagen über Linting stimmen?
    options:
      - Ein Linter prüft, ob die Datei dem Standard entspricht.
      - Ein Linter prüft zusätzlich Stil- und Qualitätsregeln deines Teams.
      - Ein Linter prüft, ob der Server wirklich so antwortet, wie die Datei es beschreibt.
      - Der Linter kann in der CI laufen und bei Fehlern den Build abbrechen.
    answers: [0, 1, 3]
    explanation: >
      Redocly liest nur die Datei. Ob die echte API sich so verhält, prüfen Contract-Tests – oder du
      erzeugst die Datei gleich aus dem Code, dann können beide gar nicht auseinanderlaufen.
tasks:
  - id: lint-ablauf
    type: order
    title: Vom roten zum grünen Lint
    description: In welcher Reihenfolge gehst du vor, wenn Redocly in einer fremden Spezifikation viele Fehler meldet?
    items:
      - "`npx redocly lint openapi.yaml` ausführen"
      - Den ersten Fehler lesen – Zeile, Regelname und Meldung
      - Bei Unklarheit die Seite der Regel auf redocly.com öffnen
      - Die Ursache in der Datei beheben
      - Erneut linten und mit dem nächsten Fehler weitermachen
      - Erst wenn keine Fehler mehr da sind, die Warnungen bewerten
    hints:
      - Fehler zuerst, Warnungen danach – Fehler brechen die CI ab.
  - id: lint-fehler
    type: terminal
    title: Eine kaputte Spezifikation reparieren
    description: |
      Ein Kollege hat die Spezifikation einer Bestell-API geschrieben, aber nie gelintet. Im Ordner
      `lint-fehler` liegen `openapi.yaml`, `redocly.yaml` und Redocly CLI. Klicke zuerst auf
      **Aufgabe vorbereiten**.

      1. Führe `npx redocly lint openapi.yaml` aus. Du siehst fünf Fehler.
      2. Behebe alle Fehler – **ohne** Regeln abzuschalten:
         - Der `$ref` zeigt auf `Order`, das Schema heißt aber `Orders`. Benenne das Schema in `Order` um.
         - `POST /orders` braucht eine eigene `operationId` (`createOrder`) und eine `summary`.
         - `GET /orders/{id}` braucht den Pfadparameter `id` (integer).
      3. Das Team möchte, dass ungenutzte Komponenten künftig als **Fehler** zählen. Ergänze in
         `redocly.yaml` unter `rules` die Zeile `no-unused-components: error`.
      4. Lint erneut, bis keine Fehler mehr gemeldet werden.
    workdir: lint-fehler
    setup: |
      npm init -y >/dev/null
      timeout 170 npm install --no-audit --no-fund --silent @redocly/cli@2.62.1
      cat > redocly.yaml <<'EOF'
      extends:
        - recommended
      rules:
        no-server-example.com: off
      EOF
      cat > openapi.yaml <<'EOF'
      openapi: 3.1.0
      info:
        title: Bestell-API
        version: 1.0.0
        license:
          name: MIT
          identifier: MIT
      servers:
        - url: https://api.example.com/v1
      security:
        - bearerAuth: []
      paths:
        /orders:
          get:
            operationId: listOrders
            summary: Bestellungen auflisten
            responses:
              "200":
                description: Liste der Bestellungen
                content:
                  application/json:
                    schema:
                      type: array
                      items:
                        $ref: "#/components/schemas/Order"
              "401":
                description: Nicht angemeldet
          post:
            operationId: listOrders
            responses:
              "201":
                description: Bestellung angelegt
              "422":
                description: Ungültige Daten
        /orders/{id}:
          get:
            operationId: getOrder
            summary: Eine Bestellung laden
            responses:
              "200":
                description: Die Bestellung
                content:
                  application/json:
                    schema:
                      $ref: "#/components/schemas/Order"
              "404":
                description: Nicht gefunden
      components:
        securitySchemes:
          bearerAuth:
            type: http
            scheme: bearer
        schemas:
          Orders:
            type: object
            required: [id, total]
            properties:
              id:
                type: integer
              total:
                type: number
      EOF
    checks:
      - type: file_contains
        path: redocly.yaml
        pattern: "^\\s+no-unused-components:\\s*error\\s*$"
        message: "In redocly.yaml fehlt unter rules die Zeile no-unused-components: error."
      - type: command
        run: npx redocly lint openapi.yaml >/dev/null 2>&1
        message: "`npx redocly lint openapi.yaml` meldet noch Fehler. Arbeite sie von oben nach unten ab."
      - type: command
        run: "grep -v 'no-server-example.com' redocly.yaml | grep -Eq ':\\s*off\\s*(#.*)?$'"
        expect_exit: 1
        message: Du hast in redocly.yaml eine Regel abgeschaltet. Behebe die Ursache in openapi.yaml, statt die Regel auszuschalten.
      - type: command
        run: "d=$(mktemp -d \"$PWD/.pruefung-XXXXXX\"); npx redocly bundle openapi.yaml --ext json -o \"$d/s.json\" >/dev/null 2>&1; jq -r '[(.components.schemas | keys | join(\",\")), .paths[\"/orders\"].post.operationId, (.paths[\"/orders\"].post.summary // \"\" | length > 0 | tostring)] | join(\"|\")' \"$d/s.json\"; rm -rf \"$d\""
        stdout_equals: "Order|createOrder|true"
        message: Das Schema soll Order heißen (nicht Orders), und POST /orders braucht operationId createOrder und eine summary.
      - type: command
        run: "d=$(mktemp -d \"$PWD/.pruefung-XXXXXX\"); npx redocly bundle openapi.yaml --ext json -o \"$d/s.json\" >/dev/null 2>&1; jq -r '[.paths[\"/orders/{id}\"] | (.parameters // []) + (.get.parameters // []) | .[] | select(.name==\"id\" and .in==\"path\")] | length' \"$d/s.json\"; rm -rf \"$d\""
        stdout_equals: "1"
        message: Unter /orders/{id} fehlt der Pfadparameter id (in path, required true).
    hints:
      - Die Meldungen nennen Zeile und Spalte, z. B. `25:19`. Fang beim ersten Fehler an und lint nach jeder Änderung neu.
      - Mit `npx redocly lint openapi.yaml --format stylish` bekommst du eine kompakte Liste aller Probleme.
      - "Der Pfadparameter sieht so aus: `parameters:` → `- name: id`, `in: path`, `required: true`, `schema: { type: integer }`."
    solution: |
      ```yaml title="redocly.yaml"
      extends:
        - recommended
      rules:
        no-server-example.com: off
        no-unused-components: error
      ```

      ```yaml title="openapi.yaml (geänderte Teile)"
          post:
            operationId: createOrder
            summary: Bestellung anlegen
            # …
        /orders/{id}:
          get:
            operationId: getOrder
            summary: Eine Bestellung laden
            parameters:
              - name: id
                in: path
                required: true
                schema:
                  type: integer
            # …
      components:
        # …
        schemas:
          Order:
            # …
      ```
---
Deine Spezifikation hat 600 Zeilen. Irgendwo zeigt ein `$ref` ins Leere, zwei Operationen heißen
gleich, und an einer Stelle fehlt ein Pfadparameter. Mit bloßem Auge findest du das nie. Ein
[[linter|Linter]] findet es in Millisekunden – und er tut es bei jedem Push wieder.

## Was Linting bei OpenAPI bedeutet

Linting heißt: Ein Programm liest deine Datei und prüft sie gegen Regeln. Bei OpenAPI gibt es zwei
Arten von Regeln:

| Art | Frage | Beispiel |
|---|---|---|
| Gültigkeit | Entspricht die Datei dem Standard? | Jede Antwort braucht `description` |
| Qualität | Ist sie gut und einheitlich? | Jede Operation hat eine `summary` |

Das verbreitete Werkzeug dafür ist [[redocly-cli|Redocly CLI]]. Du brauchst es nicht global zu
installieren – [[npx]] lädt es bei Bedarf:

```bash title="Terminal"
npx @redocly/cli lint openapi.yaml
```

Im Projekt installierst du es besser mit fester Version als Entwicklungsabhängigkeit
(`npm install --save-dev @redocly/cli`). Dann heißt der Befehl einfach `npx redocly lint`.

> [!MERKSATZ]
> Ein **Fehler** lässt `redocly lint` mit Exit-Code 1 enden, eine **Warnung** nicht. Fehler brechen
> die CI ab, Warnungen sind Hinweise.

## Meldungen lesen

Jede Meldung hat vier Teile: Ort, Schwere, Regelname und Text.

```text title="Ausgabe mit --format stylish"
openapi.yaml:
  25:19  error    no-unresolved-refs            Can't resolve $ref
  29:7   error    operation-operationId-unique  Every operation must have a unique `operationId`.
  36:5   error    path-parameters-defined       The operation does not define the path parameter `{id}` …
  54:5   warning  no-unused-components          Component: "Orders" is never used.

❌ Validation failed with 3 errors and 1 warning.
```

`25:19` heißt Zeile 25, Spalte 19. Ohne `--format` zeigt Redocly zusätzlich einen Codeausschnitt mit
Markierung (`codeframe`). Weitere Formate sind `json`, `summary` oder `github-actions` – letzteres
zeigt Fehler direkt im Pull Request an.

> [!FEHLER]
> Mehrere Meldungen haben oft **eine** Ursache: Hier zeigen zwei `$ref` auf `Order`, das Schema heißt
> aber `Orders`. Deshalb gibt es zwei Fehler *und* die Warnung „never used“. Eine Umbenennung behebt alle drei.

## Regelsätze und redocly.yaml

Redocly bringt fertige Regelsätze mit. Welchen du nutzt, legst du in [[redocly-yaml|redocly.yaml]]
im Projektordner fest:

| Regelsatz | Strenge |
|---|---|
| `minimal` | Nur das Nötigste, wenige Warnungen |
| `recommended` | Standard: sinnvolle Fehler und Warnungen |
| `recommended-strict` | Wie recommended, aber alle Warnungen werden Fehler |

```yaml title="redocly.yaml"
extends:
  - recommended
rules:
  operation-4xx-response: error   # strenger als der Standard
  info-license: off               # brauchen wir intern nicht
  no-server-example.com: off      # unsere Beispiele nutzen api.example.com
```

Jede [[lint-regel|Regel]] kann `error`, `warn` oder `off` sein. So passt du den Regelsatz an euer Team
an. Prüfe die Konfiguration selbst mit `npx redocly check-config`.

## Fehler beheben, nicht verstecken

Eine Regel abzuschalten ist verführerisch – aber nur richtig, wenn das Team die Regel **bewusst**
nicht will. Eine falsche Spezifikation wird durch `off` nicht richtig.

- **Ursache beheben:** der Normalfall.
- **Regel anpassen:** wenn die Regel für euer Projekt grundsätzlich nicht passt.
- **Einzelfall ignorieren:** `npx redocly lint --generate-ignore-file` schreibt alle aktuellen
  Probleme in `.redocly.lint-ignore.yaml`. Sinnvoll, um eine alte Spezifikation schrittweise zu
  verbessern, ohne die CI sofort rot zu machen.

Eigene Regeln, z. B. „jede Operation braucht ein Tag aus dieser Liste“, sind über konfigurierbare
Regeln möglich ([Redocly – Configurable rules](https://redocly.com/docs/cli/rules/configurable-rules)).

> [!PRAXIS]
> In vielen Teams läuft `redocly lint` in der CI direkt nach dem Erzeugen der Spezifikation. Ein
> neuer Endpunkt ohne `summary` oder mit doppelter `operationId` wird so schon im Pull Request rot.

## Zusammenfassung

- Linting prüft eine Spezifikation auf **Gültigkeit** und **Qualität** – ohne die API aufzurufen.
- `npx redocly lint openapi.yaml` endet bei Fehlern mit Exit-Code 1, Warnungen lassen ihn durch.
- Jede Meldung nennt Zeile:Spalte, Schwere, **Regelname** und Text – der Regelname führt zur Doku.
- In `redocly.yaml` wählst du mit `extends` einen Regelsatz und setzt Regeln auf `error`, `warn` oder `off`.
- Behebe Ursachen, statt Regeln abzuschalten; Altlasten kannst du mit einer Ignore-Datei schrittweise abbauen.
