---
title: Schemas, components und $ref
summary: Du beschreibst Datenstrukturen mit JSON Schema, legst sie einmal unter components ab und verweist mit $ref darauf, statt sie zu kopieren.
duration: 25
sources:
  - title: OpenAPI Specification 3.1.1 – Schema Object
    url: https://spec.openapis.org/oas/v3.1.1.html#schema-object
  - title: Learn OpenAPI – Reusing Descriptions
    url: https://learn.openapis.org/specification/components.html
  - title: JSON Schema – Getting Started
    url: https://json-schema.org/learn/getting-started-step-by-step
quiz:
  - type: single
    question: Wie beschreibst du in OpenAPI 3.1 ein Feld, das ein String oder null sein darf?
    options:
      - "type: string und nullable: true"
      - "type: [string, \"null\"]"
      - "type: string?"
      - "type: optional"
    answer: 1
    explanation: >
      OpenAPI 3.1 nutzt echtes JSON Schema. Dort ist `type` eine Liste möglicher Typen, und null ist
      ein eigener Typ. `nullable: true` gab es nur in OpenAPI 3.0.
  - type: cloze
    text: "Wiederverwendbare Schemas liegen unter components → ___. Verwiesen wird mit dem Schlüssel ___, z. B. auf #/components/schemas/Book."
    blanks:
      - [schemas]
      - [$ref, "ref"]
    explanation: Unter components/schemas stehen die Bausteine, $ref zeigt auf sie. Das # steht für „diese Datei“.
  - type: multiple
    question: Was lässt sich unter `components` wiederverwendbar ablegen?
    options:
      - schemas
      - parameters
      - responses
      - servers
    answers: [0, 1, 2]
    explanation: >
      components kennt u. a. schemas, parameters, responses, requestBodies, headers, examples und
      securitySchemes. servers steht dagegen auf oberster Ebene (oder an Pfaden).
  - type: find-bug
    question: Dieses Schema soll sagen, dass `title` Pflicht ist. In welcher Zeile steckt der Fehler?
    language: yaml
    code: |
      Book:
        type: object
        properties:
          id:
            type: integer
          title:
            type: string
            required: true
    bug_line: 8
    explanation: >
      In JSON Schema ist `required` eine Liste auf Ebene des Objekts: `required: [title]` neben
      `properties`. `required: true` an einer Eigenschaft gibt es nur bei Parametern.
tasks:
  - id: schema-begriffe
    type: dragdrop
    title: Was beschreibt welches Schlüsselwort?
    description: Ordne jedes JSON-Schema-Schlüsselwort seiner Aufgabe zu.
    targets:
      - { id: typ, label: Welcher Datentyp? }
      - { id: pflicht, label: Was muss vorhanden sein? }
      - { id: werte, label: Welche Werte sind erlaubt? }
      - { id: verweis, label: Wo steht die Beschreibung? }
    items:
      - { label: "type: integer", target: typ }
      - { label: "format: date-time", target: typ }
      - { label: "required: [id, title]", target: pflicht }
      - { label: "enum: [draft, published]", target: werte }
      - { label: "minimum: 1", target: werte }
      - { label: "$ref: '#/components/schemas/Book'", target: verweis }
    hints:
      - "`format` verfeinert den Typ: Ein date-time ist ein String in einem bestimmten Format."
  - id: ref-refactoring
    type: terminal
    title: Wiederholungen mit $ref entfernen
    description: |
      In `ref-refactoring/openapi.yaml` ist das Buch-Objekt dreimal **kopiert**: bei `listBooks`,
      `getBook` und `createBook`. Außerdem steht die gleiche 404-Antwort doppelt da.
      Klicke zuerst auf **Aufgabe vorbereiten**.

      1. Lege unter `components.schemas` ein Schema `Book` an (Objekt mit `id` integer, `title` string,
         `isbn` string oder null) mit `required: [id, title]`.
      2. Ersetze alle drei Kopien durch `$ref: '#/components/schemas/Book'` (bei der Liste steht der
         Verweis unter `items`).
      3. Lege unter `components.responses` eine Antwort `NotFound` an und verweise bei `getBook` und
         `deleteBook` mit `$ref: '#/components/responses/NotFound'` darauf.
      4. Prüfe mit `npx redocly lint openapi.yaml`.
    workdir: ref-refactoring
    setup: |
      npm init -y >/dev/null
      timeout 170 npm install --no-audit --no-fund --silent @redocly/cli@2.62.1
      cat > redocly.yaml <<'EOF'
      extends:
        - recommended
      rules:
        security-defined: off
        no-server-example.com: off
      EOF
      cat > openapi.yaml <<'EOF'
      openapi: 3.1.0
      info:
        title: Buch-API
        version: 1.0.0
      servers:
        - url: https://api.example.com/v1
      paths:
        /books:
          get:
            operationId: listBooks
            summary: Alle Bücher
            responses:
              "200":
                description: Liste der Bücher
                content:
                  application/json:
                    schema:
                      type: array
                      items:
                        type: object
                        required: [id, title]
                        properties:
                          id:
                            type: integer
                          title:
                            type: string
                          isbn:
                            type: [string, "null"]
          post:
            operationId: createBook
            summary: Buch anlegen
            requestBody:
              required: true
              content:
                application/json:
                  schema:
                    type: object
                    required: [id, title]
                    properties:
                      id:
                        type: integer
                      title:
                        type: string
                      isbn:
                        type: [string, "null"]
            responses:
              "201":
                description: Angelegt
              "422":
                description: Ungültige Daten
        /books/{id}:
          parameters:
            - name: id
              in: path
              required: true
              schema:
                type: integer
          get:
            operationId: getBook
            summary: Ein Buch
            responses:
              "200":
                description: Das Buch
                content:
                  application/json:
                    schema:
                      type: object
                      required: [id, title]
                      properties:
                        id:
                          type: integer
                        title:
                          type: string
                        isbn:
                          type: [string, "null"]
              "404":
                description: Das Buch gibt es nicht
          delete:
            operationId: deleteBook
            summary: Buch löschen
            responses:
              "204":
                description: Gelöscht
              "404":
                description: Das Buch gibt es nicht
      EOF
    checks:
      - type: command
        run: npx redocly lint openapi.yaml >/dev/null 2>&1
        message: "`npx redocly lint openapi.yaml` meldet noch Fehler – z. B. einen Verweis auf ein Schema, das es nicht gibt."
      - type: command
        run: "d=$(mktemp -d \"$PWD/.pruefung-XXXXXX\"); npx redocly bundle openapi.yaml --ext json -o \"$d/s.json\" >/dev/null 2>&1; jq -r '.components.schemas.Book | [.type, (.required|sort|join(\"+\")), (.properties|keys|join(\"+\"))] | join(\"|\")' \"$d/s.json\"; rm -rf \"$d\""
        stdout_equals: "object|id+title|id+isbn+title"
        message: "Unter components.schemas fehlt das Schema Book (type object, properties id, title, isbn, required [id, title])."
      - type: command
        run: "d=$(mktemp -d \"$PWD/.pruefung-XXXXXX\"); npx redocly bundle openapi.yaml --ext json -o \"$d/s.json\" >/dev/null 2>&1; jq '[.paths | .. | objects | select(.[\"$ref\"] == \"#/components/schemas/Book\")] | length' \"$d/s.json\"; rm -rf \"$d\""
        stdout_matches: "^[3-9]$"
        message: Es sollen mindestens drei Verweise auf '#/components/schemas/Book' unter paths stehen (Liste, Laden, Anlegen).
      - type: command
        run: "d=$(mktemp -d \"$PWD/.pruefung-XXXXXX\"); npx redocly bundle openapi.yaml --ext json -o \"$d/s.json\" >/dev/null 2>&1; jq '[.paths | .. | objects | select(has(\"properties\"))] | length' \"$d/s.json\"; rm -rf \"$d\""
        stdout_equals: "0"
        message: Unter paths steht noch eine kopierte Objektbeschreibung mit properties. Ersetze sie durch den $ref auf Book.
      - type: command
        run: "d=$(mktemp -d \"$PWD/.pruefung-XXXXXX\"); npx redocly bundle openapi.yaml --ext json -o \"$d/s.json\" >/dev/null 2>&1; jq -r '[(.components.responses.NotFound.description // \"\" | length > 0), (.paths[\"/books/{id}\"].get.responses[\"404\"][\"$ref\"]), (.paths[\"/books/{id}\"].delete.responses[\"404\"][\"$ref\"])] | map(tostring) | join(\"|\")' \"$d/s.json\"; rm -rf \"$d\""
        stdout_equals: "true|#/components/responses/NotFound|#/components/responses/NotFound"
        message: "Lege components.responses.NotFound mit description an und verweise bei getBook und deleteBook unter \"404\" mit $ref darauf."
    hints:
      - "`components` steht auf oberster Ebene, also ganz links – auf derselben Höhe wie `paths`."
      - "Ein Verweis ersetzt das ganze Schema: Statt `type`, `required` und `properties` steht dort nur noch `$ref: '#/components/schemas/Book'`."
      - "Für die Antwort: Unter `\"404\":` steht nur noch `$ref: '#/components/responses/NotFound'`, ohne description."
    solution: |
      ```yaml title="openapi.yaml (geänderte Teile)"
      paths:
        /books:
          get:
            # …
            responses:
              "200":
                description: Liste der Bücher
                content:
                  application/json:
                    schema:
                      type: array
                      items:
                        $ref: '#/components/schemas/Book'
          post:
            # …
            requestBody:
              required: true
              content:
                application/json:
                  schema:
                    $ref: '#/components/schemas/Book'
        /books/{id}:
          get:
            # …
            responses:
              "200":
                description: Das Buch
                content:
                  application/json:
                    schema:
                      $ref: '#/components/schemas/Book'
              "404":
                $ref: '#/components/responses/NotFound'
          delete:
            # …
            responses:
              "204":
                description: Gelöscht
              "404":
                $ref: '#/components/responses/NotFound'
      components:
        schemas:
          Book:
            type: object
            required: [id, title]
            properties:
              id:
                type: integer
              title:
                type: string
              isbn:
                type: [string, "null"]
        responses:
          NotFound:
            description: Das Buch gibt es nicht
      ```
---
Deine Buch-API liefert an fünf Stellen ein Buch-Objekt. Du hast die Beschreibung fünfmal kopiert.
Jetzt kommt ein neues Feld `year` dazu – und du musst fünf Stellen ändern. Vergisst du eine, ist die
Doku in sich widersprüchlich. Die Lösung: das Buch **einmal** beschreiben und überall darauf verweisen.

## JSON Schema: Daten beschreiben

Die Form von Daten beschreibt OpenAPI 3.1 mit [[json-schema|JSON Schema]] – einem eigenen Standard,
den auch viele andere Werkzeuge nutzen. Die wichtigsten Schlüsselwörter:

| Schlüsselwort | Bedeutung | Beispiel |
|---|---|---|
| `type` | Datentyp | `string`, `integer`, `number`, `boolean`, `array`, `object`, `null` |
| `properties` | Felder eines Objekts | `title: { type: string }` |
| `required` | Pflichtfelder (Liste!) | `required: [id, title]` |
| `items` | Typ der Elemente eines Arrays | `items: { type: string }` |
| `enum` | Erlaubte feste Werte | `enum: [draft, published]` |
| `format` | Feinere Angabe | `date-time`, `email`, `uuid` |
| `minimum` / `maxLength` | Grenzen | `minimum: 1` |
| `example` / `examples` | Beispielwerte für die Doku | `example: Der kleine Prinz` |

```yaml title="Ein Buch als Schema"
type: object
required: [id, title]
properties:
  id:
    type: integer
    example: 42
  title:
    type: string
    maxLength: 200
  status:
    type: string
    enum: [draft, published]
  published_at:
    type: string
    format: date-time
```

## null in OpenAPI 3.1

Ein häufiger Stolperstein ist `null`. In OpenAPI 3.1 ist `null` ein **eigener Typ**, und `type`
darf eine Liste sein:

```yaml title="isbn darf ein String oder null sein"
isbn:
  type: [string, "null"]
```

In der älteren Version 3.0 schrieb man `nullable: true`. Das gibt es in 3.1 nicht mehr – du siehst es
aber noch oft in alten Spezifikationen und Blogartikeln.

> [!FEHLER]
> „Optional“ und „nullable“ sind nicht dasselbe. **Optional** heißt: Das Feld darf fehlen (es steht
> nicht in `required`). **Nullable** heißt: Das Feld ist da, aber sein Wert darf `null` sein.

## components: der Baukasten

Unter [[openapi-components|components]] legst du wiederverwendbare Bausteine ab. Jeder bekommt
einen Namen:

| Bereich | Inhalt |
|---|---|
| `schemas` | Datenstrukturen wie `Book`, `Error` |
| `parameters` | Parameter wie `PageParam`, `LimitParam` |
| `responses` | Antworten wie `NotFound`, `ValidationError` |
| `requestBodies` | Request-Bodies |
| `securitySchemes` | Anmeldeverfahren (nächste Lektion) |

```yaml title="components auf oberster Ebene"
components:
  schemas:
    Book:
      type: object
      required: [id, title]
      properties:
        id: { type: integer }
        title: { type: string }
  responses:
    NotFound:
      description: Die Ressource gibt es nicht
```

## $ref: verweisen statt kopieren

Mit [[ref-verweis|$ref]] zeigst du auf einen Baustein. Der Wert ist ein Pfad: `#` heißt „diese
Datei“, danach folgen die Schlüssel, getrennt durch `/`.

```yaml title="Drei Verweise auf dasselbe Schema"
/books:
  get:
    responses:
      "200":
        description: Liste der Bücher
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/Book'
/books/{id}:
  get:
    responses:
      "200":
        description: Das Buch
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Book'
      "404":
        $ref: '#/components/responses/NotFound'
```

Ein `$ref` **ersetzt** das Objekt, an dem er steht. Daneben weitere Felder zu schreiben, hat bei
Schemas kaum Wirkung und verwirrt Werkzeuge. Den Wert in einfache Anführungszeichen zu setzen ist
Pflicht, weil `#` in YAML sonst einen Kommentar beginnt.

> [!MERKSATZ]
> Beschreibe jede Datenstruktur **einmal** unter `components` und verweise überall mit `$ref` darauf.

## Große Spezifikationen aufteilen

Ein `$ref` kann auch auf andere Dateien zeigen: `$ref: './schemas/book.yaml'`. So teilst du eine
große Spezifikation in viele kleine Dateien auf. Für die Auslieferung fügt
`npx redocly bundle openapi.yaml -o dist/openapi.yaml` alles wieder zu einer Datei zusammen.

Schemas lassen sich außerdem kombinieren: `allOf` (alle Bedingungen gelten), `oneOf` (genau eine)
und `anyOf` (mindestens eine). So baust du z. B. ein `BookWithAuthor` aus `Book` plus Autor-Feldern
([JSON Schema – Composition](https://json-schema.org/understanding-json-schema/reference/combining)).

> [!PRAXIS]
> Wenn die Spezifikation aus Code erzeugt wird, entstehen die `components` automatisch: Jede PHP-Klasse
> mit Schema-Attribut wird ein Eintrag unter `components.schemas`, und alle Stellen verweisen per
> `$ref` darauf. Du lernst das in Modul 3.

## Zusammenfassung

- Datenstrukturen beschreibst du mit **JSON Schema**: `type`, `properties`, `required`, `items`, `enum`, `format`.
- `required` ist eine **Liste** auf Objekt-Ebene; in 3.1 schreibst du `type: [string, "null"]` statt `nullable`.
- Optional (darf fehlen) und nullable (darf null sein) sind zwei verschiedene Dinge.
- Unter **`components`** liegen wiederverwendbare Schemas, Parameter, Antworten und mehr.
- **`$ref: '#/components/schemas/Book'`** ersetzt das Objekt durch einen Verweis – immer in Anführungszeichen.
- Mit `$ref` auf Dateien und `redocly bundle` teilst du große Spezifikationen auf.
