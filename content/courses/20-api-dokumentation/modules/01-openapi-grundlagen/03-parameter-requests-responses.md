---
title: Parameter, Request-Bodies und Antworten
summary: Du beschreibst, was eine Operation entgegennimmt und was sie zurückgibt – Pfad- und Query-Parameter, JSON-Bodies und Antworten mit Statuscodes.
duration: 25
sources:
  - title: OpenAPI Specification 3.1.1 – Parameter Object
    url: https://spec.openapis.org/oas/v3.1.1.html#parameter-object
  - title: OpenAPI Specification 3.1.1 – Request Body Object
    url: https://spec.openapis.org/oas/v3.1.1.html#request-body-object
  - title: Learn OpenAPI – Parameters and Payload of an Operation
    url: https://learn.openapis.org/specification/parameters.html
quiz:
  - type: match
    question: Ordne jeder Angabe die passende Stelle in OpenAPI zu.
    pairs:
      - { left: "id in /books/{id}", right: "Parameter mit in: path" }
      - { left: "?limit=20", right: "Parameter mit in: query" }
      - { left: "Accept-Language: de", right: "Parameter mit in: header" }
      - { left: "JSON mit Titel und Autor", right: "requestBody" }
    explanation: Parameter stecken in der Adresse oder im Header, der Body ist der eigentliche Inhalt der Anfrage.
  - type: single
    question: "Was gilt für einen Parameter mit `in: path`?"
    options:
      - Er ist optional.
      - Er muss `required: true` haben und sein Name muss im Pfad in geschweiften Klammern vorkommen.
      - Er darf nur Zahlen enthalten.
      - Er wird im Body gesendet.
    answer: 1
    explanation: >
      Ein Pfadparameter ist Teil der Adresse – ohne ihn gibt es die URL gar nicht. Deshalb ist
      `required: true` Pflicht, und der Name muss exakt zum Platzhalter `{id}` passen.
  - type: multiple
    question: Welche Antworten sollte die Operation `GET /books/{id}` sinnvollerweise dokumentieren?
    options:
      - "200 – das gefundene Buch"
      - "404 – Buch nicht gefunden"
      - "201 – Buch angelegt"
      - "401 – nicht angemeldet, wenn die API eine Anmeldung verlangt"
    answers: [0, 1, 3]
    explanation: >
      201 gehört zu einem POST, der etwas anlegt. Für das Laden eines einzelnen Buchs sind 200, 404
      und – bei geschützten APIs – 401 die wichtigen Fälle.
  - type: find-bug
    question: In welcher Zeile steckt der Fehler?
    language: yaml
    code: |
      paths:
        /books/{bookId}:
          get:
            operationId: getBook
            parameters:
              - name: id
                in: path
                required: true
                schema:
                  type: integer
    bug_line: 6
    explanation: >
      Der Pfad heißt `{bookId}`, der Parameter aber `id`. Die Namen müssen exakt übereinstimmen,
      sonst bleibt der Platzhalter undokumentiert – Redocly meldet das als Fehler.
tasks:
  - id: buch-anlegen-request
    type: request
    title: Schick die dokumentierte Anfrage
    description: |
      Die Spezifikation der Buch-API beschreibt die Operation `createBook` so:

      ```yaml
      /books:
        post:
          operationId: createBook
          requestBody:
            required: true
            content:
              application/json:
                schema:
                  type: object
                  required: [title, author]
      ```

      Baue die passende Anfrage: richtige Methode, richtiger Pfad, Header `Content-Type: application/json`
      und ein JSON-Body mit den Feldern `title` und `author`.
    base_url: https://api.example.com/v1
    expected:
      method: POST
      path: "^/books/?$"
      headers: { Content-Type: "application/json" }
      body_contains: ['"title"', '"author"']
    response:
      status: 201
      body: '{"id": 42, "title": "Der kleine Prinz", "author": "Antoine de Saint-Exupéry"}'
    hints:
      - Welche Methode legt in REST etwas Neues an?
      - 'Der Body könnte so aussehen: `{"title": "Der kleine Prinz", "author": "Antoine de Saint-Exupéry"}`'
  - id: parameter-ergaenzen
    type: terminal
    title: Parameter und Antworten ergänzen
    description: |
      Im Ordner `parameter` liegt `openapi.yaml` einer Buch-API mit der Operation `GET /books`.
      Redocly CLI ist installiert. Klicke zuerst auf **Aufgabe vorbereiten**.

      1. Ergänze bei `GET /books` einen **Query-Parameter** `limit` (Typ `integer`, optional,
         `minimum: 1`, `maximum: 100`).
      2. Lege den neuen Pfad `/books/{id}` mit einer `get`-Operation `operationId: getBook` an.
         Beschreibe den **Pfadparameter** `id` (Typ `integer`).
      3. Dokumentiere dort die Antworten `"200"` (Das Buch) und `"404"` (Buch nicht gefunden).
      4. Prüfe mit `npx redocly lint openapi.yaml`, bis keine Fehler mehr gemeldet werden.
    workdir: parameter
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
            summary: Alle Bücher auflisten
            responses:
              "200":
                description: Liste der Bücher
                content:
                  application/json:
                    schema:
                      type: array
                      items:
                        type: object
      EOF
    checks:
      - type: command
        run: npx redocly lint openapi.yaml >/dev/null 2>&1
        message: "`npx redocly lint openapi.yaml` meldet noch Fehler – lies die Ausgabe und behebe sie."
      - type: command
        run: "d=$(mktemp -d \"$PWD/.pruefung-XXXXXX\"); npx redocly bundle openapi.yaml --ext json -o \"$d/s.json\" >/dev/null 2>&1; jq -r '.paths[\"/books\"].get.parameters[]? | select(.name==\"limit\") | [.in, .schema.type, (.required // false), .schema.minimum, .schema.maximum] | map(tostring) | join(\"|\")' \"$d/s.json\"; rm -rf \"$d\""
        stdout_equals: "query|integer|false|1|100"
        message: "Bei GET /books fehlt der Query-Parameter limit – mit in: query, schema type integer, minimum 1 und maximum 100 (und nicht required)."
      - type: command
        run: "d=$(mktemp -d \"$PWD/.pruefung-XXXXXX\"); npx redocly bundle openapi.yaml --ext json -o \"$d/s.json\" >/dev/null 2>&1; jq -r '.paths[\"/books/{id}\"].get | .operationId, (.parameters[]? | select(.name==\"id\") | [.in, (.required|tostring), .schema.type] | join(\"|\"))' \"$d/s.json\"; rm -rf \"$d\""
        stdout_matches: "^getBook\\s+path\\|true\\|integer$"
        message: "Unter /books/{id} fehlt die get-Operation getBook mit dem Pfadparameter id (in: path, required: true, type integer)."
      - type: command
        run: "d=$(mktemp -d \"$PWD/.pruefung-XXXXXX\"); npx redocly bundle openapi.yaml --ext json -o \"$d/s.json\" >/dev/null 2>&1; jq -r '.paths[\"/books/{id}\"].get.responses | keys | join(\",\")' \"$d/s.json\"; rm -rf \"$d\""
        stdout_matches: "200.*404"
        message: "getBook soll die Antworten \"200\" und \"404\" dokumentieren, jeweils mit description."
    hints:
      - Parameter stehen unter `parameters:` als Liste direkt in der Operation, auf derselben Ebene wie `responses`.
      - "Ein Parameter braucht mindestens `name`, `in` und `schema`. Für einen Pfadparameter zusätzlich `required: true`."
      - Schau dir den Abschnitt „Ein vollständiges Beispiel“ in der Lektion an und passe ihn an.
    solution: |
      ```yaml title="openapi.yaml (Ausschnitt unter paths)"
      paths:
        /books:
          get:
            operationId: listBooks
            summary: Alle Bücher auflisten
            parameters:
              - name: limit
                in: query
                required: false
                schema:
                  type: integer
                  minimum: 1
                  maximum: 100
            responses:
              "200":
                description: Liste der Bücher
                content:
                  application/json:
                    schema:
                      type: array
                      items:
                        type: object
        /books/{id}:
          get:
            operationId: getBook
            summary: Ein Buch laden
            parameters:
              - name: id
                in: path
                required: true
                schema:
                  type: integer
            responses:
              "200":
                description: Das Buch
              "404":
                description: Buch nicht gefunden
      ```

      Danach `npx redocly lint openapi.yaml` ausführen.
---
Eine Operation ohne Eingaben und Ausgaben ist wie ein Formular ohne Felder. Wer `GET /books/{id}`
aufrufen will, muss wissen: Was ist `id`? Darf ich filtern? Was bekomme ich zurück, wenn das Buch
fehlt? Genau das beschreibst du mit Parametern, Request-Bodies und Antworten.

## Parameter: Eingaben in Adresse und Header

Ein Parameter ist eine Eingabe, die **nicht** im Body steckt. Das Feld `in` sagt, wo er steht:

| `in` | Beispiel | Typischer Zweck |
|---|---|---|
| `path` | `/books/42` → [[pfadparameter|Pfadparameter]] `id` | Welche Ressource? |
| `query` | `/books?limit=20` → [[query-string|Query-Parameter]] | Filtern, Sortieren, Seiten |
| `header` | `Accept-Language: de` | Zusatzinfos zur Anfrage |
| `cookie` | `session=abc` | Selten in APIs |

```yaml title="Zwei Parameter an einer Operation"
/books/{id}:
  get:
    operationId: getBook
    parameters:
      - name: id
        in: path
        required: true
        description: Die ID des Buchs
        schema:
          type: integer
      - name: include
        in: query
        schema:
          type: string
          enum: [author, reviews]
```

`schema` beschreibt den Datentyp mit [[json-schema|JSON Schema]]: `type`, `minimum`, `maximum`,
`enum` und mehr. Mehr dazu in Modul 2.

> [!FEHLER]
> Pfadparameter ohne `required: true` sind ungültig – ohne `id` existiert die Adresse nicht.
> Und der `name` muss **exakt** zum Platzhalter im Pfad passen: `{id}` braucht `name: id`.

## Request-Bodies: der Inhalt einer Anfrage

Bei `POST`, `PUT` und `PATCH` schickt der Client Daten mit, meist als JSON. Das beschreibt der
[[http-body|Request-Body]]. Unter `content` steht pro [[content-type|Media-Type]] ein Schema:

```yaml title="Ein JSON-Body für createBook"
/books:
  post:
    operationId: createBook
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [title, author]
            properties:
              title:
                type: string
                example: Der kleine Prinz
              author:
                type: string
              year:
                type: integer
```

Der Media-Type entspricht dem `Content-Type`-[[http-header|Header]] der Anfrage. Eine Operation
kann mehrere anbieten, z. B. `application/json` und `multipart/form-data` für Datei-Uploads.

> [!MERKSATZ]
> Parameter = Eingaben in Pfad, Query oder Header. Request-Body = der Inhalt, unterschieden nach Media-Type.

## Antworten: ein Statuscode, ein Inhalt

`responses` ist eine Liste von [[statuscode|Statuscodes]]. Jede Antwort braucht eine `description`,
und wenn sie Daten liefert, ein `content` mit Schema:

```yaml title="Antworten für getBook"
responses:
  "200":
    description: Das gefundene Buch
    content:
      application/json:
        schema:
          type: object
          properties:
            id: { type: integer }
            title: { type: string }
  "404":
    description: Es gibt kein Buch mit dieser ID
  "401":
    description: Du bist nicht angemeldet
```

Dokumentiere nicht nur den Erfolgsfall. Wer deine API nutzt, muss wissen, welche Fehler kommen
können – sonst baut niemand eine sinnvolle Fehlerbehandlung.

| Statuscode | Wann dokumentieren? |
|---|---|
| `200` / `201` / `204` | Erfolg: Daten, angelegt, kein Inhalt |
| `400` / `422` | Ungültige Eingaben |
| `401` / `403` | Nicht angemeldet / keine Berechtigung |
| `404` | Ressource fehlt |

Statt einzelner Codes geht auch `"4XX"` oder `default` für „alle anderen Fälle“.

Liefert eine Fehlerantwort einen Body, beschreibe ihn ebenfalls. Viele APIs schicken bei `422` eine
Liste der ungültigen Felder mit. Steht diese Struktur in der Spezifikation, kann das Frontend die
Meldungen direkt neben dem passenden Eingabefeld anzeigen, statt nur „Es ist ein Fehler aufgetreten“.

> [!FEHLER]
> Nur `"200"` dokumentieren, weil „Fehler ja eh selten sind“. Genau die seltenen Fälle sind es, für die
> andere Teams eine Anleitung brauchen – im Erfolgsfall versteht man eine API oft auch ohne Doku.

## Ein vollständiges Beispiel

So sieht eine sauber beschriebene Operation aus – alle Bausteine dieser Lektion zusammen:

```yaml title="GET /books mit Query-Parametern"
/books:
  get:
    operationId: listBooks
    summary: Bücher auflisten
    tags: [Books]
    parameters:
      - name: limit
        in: query
        description: Wie viele Bücher höchstens geliefert werden
        schema:
          type: integer
          minimum: 1
          maximum: 100
          default: 20
      - name: author
        in: query
        schema:
          type: string
    responses:
      "200":
        description: Liste der Bücher
        content:
          application/json:
            schema:
              type: array
              items:
                type: object
      "422":
        description: Ein Parameter ist ungültig, z. B. limit=500
```

> [!PRAXIS]
> In echten Projekten wiederholen sich `limit`, `page` und die Fehlerantworten an vielen Operationen.
> Statt sie zu kopieren, legst du sie einmal unter `components` ab und verweist mit `$ref` darauf.
> Das lernst du in der nächsten Lektion.

## Zusammenfassung

- `parameters` beschreiben Eingaben mit `name`, `in` (path, query, header, cookie) und `schema`.
- Pfadparameter brauchen `required: true` und denselben Namen wie der Platzhalter `{…}`.
- `requestBody` beschreibt den Inhalt einer Anfrage pro Media-Type, z. B. `application/json`.
- `responses` listet Statuscodes; jede Antwort braucht eine `description`, Daten stehen unter `content`.
- Dokumentiere auch Fehlerfälle wie `404`, `422` oder `401` – nicht nur den Erfolg.
