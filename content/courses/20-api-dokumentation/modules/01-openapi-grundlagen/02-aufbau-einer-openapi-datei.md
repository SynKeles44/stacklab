---
title: Aufbau einer OpenAPI-Datei
summary: Du lernst die oberste Ebene einer OpenAPI-3.1-Datei kennen, schreibst deine erste Spezifikation und wandelst sie von YAML in JSON um.
duration: 20
sources:
  - title: OpenAPI Specification 3.1.1 – OpenAPI Object
    url: https://spec.openapis.org/oas/v3.1.1.html#openapi-object
  - title: Learn OpenAPI – The Structure of an OpenAPI Description
    url: https://learn.openapis.org/specification/structure.html
  - title: Redocly CLI – bundle
    url: https://redocly.com/docs/cli/commands/bundle
quiz:
  - type: multiple
    question: Welche Felder sind in einer OpenAPI-3.1-Datei auf oberster Ebene Pflicht?
    options:
      - openapi
      - info
      - servers
      - tags
    answers: [0, 1]
    explanation: >
      openapi und info sind immer Pflicht. Zusätzlich braucht die Datei mindestens eins von paths,
      components oder webhooks. servers und tags sind optional, aber sehr empfehlenswert.
  - type: single
    question: Was gehört in `info.version`?
    options:
      - Die Version des OpenAPI-Standards, z. B. 3.1.0
      - Die Version deiner API bzw. dieses Dokuments, z. B. 1.4.0
      - Die PHP-Version des Servers
      - Die Versionsnummer von Redocly
    answer: 1
    explanation: >
      Das ist eine häufige Verwechslung. `openapi: 3.1.0` nennt die Version des Standards,
      `info.version` die Version deiner eigenen API-Beschreibung.
  - type: cloze
    text: "Unter `paths` steht jeder Pfad, darunter die HTTP-Methode in Kleinbuchstaben. Eine Methode an einem Pfad heißt in OpenAPI ___. Ihr eindeutiger Name steht im Feld ___."
    blanks:
      - [Operation, Operationen]
      - [operationId]
    explanation: Pfad plus Methode ergibt eine Operation. Die operationId ist ihr eindeutiger Name – Generatoren machen daraus Funktionsnamen.
  - type: find-bug
    question: Diese Spezifikation ist ungültig. In welcher Zeile steckt der Fehler?
    language: yaml
    code: |
      openapi: 3.1.0
      info:
        title: Buch-API
        version: 1.0.0
      paths:
        /books:
          GET:
            responses:
              '200':
                description: Alle Bücher
    bug_line: 7
    explanation: >
      HTTP-Methoden stehen in OpenAPI immer in Kleinbuchstaben: get, post, put, patch, delete.
      `GET` erkennt der Standard nicht.
tasks:
  - id: aufbau-beschriften
    type: diagram
    title: Beschrifte die oberste Ebene
    description: Ziehe die Schlüssel der obersten Ebene an die passende Stelle. Rechts steht jeweils, wofür der Bereich da ist.
    image: /assets/api-dokumentation/openapi-aufbau-leer.svg
    slots:
      - { x: 18.75, y: 12.9, answer: "openapi:" }
      - { x: 18.75, y: 25.4, answer: "info:" }
      - { x: 18.75, y: 37.9, answer: "servers:" }
      - { x: 18.75, y: 50.4, answer: "paths:" }
      - { x: 18.75, y: 62.9, answer: "components:" }
      - { x: 18.75, y: 75.4, answer: "security:" }
      - { x: 18.75, y: 87.9, answer: "tags:" }
    distractors: ["swagger:", "routes:"]
    hints:
      - "`swagger:` stand nur in der alten Version 2.0 ganz oben."
  - id: erste-spec
    type: terminal
    title: Deine erste OpenAPI-Datei
    description: |
      Du schreibst eine kleine, aber gültige Spezifikation für eine Wetter-API und erzeugst daraus
      eine JSON-Fassung.

      Vorbereitet sind im Ordner `erste-spec` ein npm-Projekt mit **Redocly CLI** und eine
      Konfiguration `redocly.yaml`. Klicke zuerst auf **Aufgabe vorbereiten** (die Installation dauert
      ein paar Sekunden).

      1. Lege mit `nano openapi.yaml` eine Datei an mit:
         - `openapi: 3.1.0`
         - `info` mit `title: Wetter-API` und `version: 1.0.0`
         - einem Server `https://api.example.com/v1`
         - dem Pfad `/health` mit einer `get`-Operation, `operationId: getHealth`, einer `summary`
           und einer Antwort `"200"` mit `description`
      2. Prüfe sie mit `npx redocly lint openapi.yaml`. Es dürfen Warnungen bleiben, aber **keine Fehler**.
      3. Erzeuge die JSON-Fassung: `npx redocly bundle openapi.yaml --ext json -o openapi.json`
      4. Lies den Titel mit `jq -r '.info.title' openapi.json` aus.
    workdir: erste-spec
    setup: |
      npm init -y >/dev/null
      timeout 170 npm install --no-audit --no-fund --silent @redocly/cli@2.62.1
      cat > redocly.yaml <<'EOF'
      extends:
        - recommended
      rules:
        # Kommt erst in der Lektion zur Authentifizierung dran:
        security-defined: off
        # Wir nutzen bewusst Platzhalter-Adressen wie api.example.com:
        no-server-example.com: off
      EOF
    checks:
      - type: file_exists
        path: openapi.yaml
        message: Es gibt noch keine Datei openapi.yaml im Ordner erste-spec.
      - type: command
        run: npx redocly lint openapi.yaml >/dev/null 2>&1
        message: "`npx redocly lint openapi.yaml` meldet noch Fehler. Lies die Ausgabe – oft ist es die Einrückung oder ein fehlendes `description`."
      - type: command
        run: "d=$(mktemp -d \"$PWD/.pruefung-XXXXXX\"); npx redocly bundle openapi.yaml --ext json -o \"$d/s.json\" >/dev/null 2>&1; jq -r '[.openapi, .info.title, .info.version] | join(\"|\")' \"$d/s.json\"; rm -rf \"$d\""
        stdout_matches: "^3\\.1\\.\\d+\\|Wetter-API\\|1\\.0\\.0$"
        message: "Prüfe `openapi: 3.1.0`, `info.title: Wetter-API` und `info.version: 1.0.0`."
      - type: command
        run: "d=$(mktemp -d \"$PWD/.pruefung-XXXXXX\"); npx redocly bundle openapi.yaml --ext json -o \"$d/s.json\" >/dev/null 2>&1; jq -r '.servers[0].url, .paths[\"/health\"].get.operationId' \"$d/s.json\"; rm -rf \"$d\""
        stdout_matches: "^https://api\\.example\\.com/v1\\s+getHealth$"
        message: Es fehlt der Server https://api.example.com/v1 oder die get-Operation unter /health mit operationId getHealth.
      - type: command
        run: jq -r '.info.title' openapi.json
        stdout_equals: Wetter-API
        message: Die Datei openapi.json fehlt oder enthält nicht den Titel. Erzeuge sie mit `npx redocly bundle openapi.yaml --ext json -o openapi.json`.
    hints:
      - Achte auf die Einrückung mit Leerzeichen – YAML ist dabei streng. `paths` steht ganz links, `/health` zwei Leerzeichen eingerückt.
      - 'Statuscodes als Schlüssel schreibst du in Anführungszeichen: `"200":`.'
      - Orientiere dich am Beispiel „Eine vollständige Minimal-Spezifikation“ in der Lektion.
    solution: |
      ```yaml title="openapi.yaml"
      openapi: 3.1.0
      info:
        title: Wetter-API
        version: 1.0.0
      servers:
        - url: https://api.example.com/v1
      paths:
        /health:
          get:
            operationId: getHealth
            summary: Prüft, ob die API läuft
            responses:
              "200":
                description: Die API ist erreichbar
      ```

      ```bash
      npx redocly lint openapi.yaml
      npx redocly bundle openapi.yaml --ext json -o openapi.json
      jq -r '.info.title' openapi.json
      ```
---
Du hast eine 500 Zeilen lange OpenAPI-Datei vor dir und suchst, wo die Anmeldung beschrieben ist.
Wer den Grundaufbau kennt, findet sich in jeder Spezifikation sofort zurecht – egal ob sie von Hand
geschrieben oder aus Code erzeugt wurde. In dieser Lektion lernst du die oberste Ebene kennen.

## Die oberste Ebene im Überblick

Eine [[openapi|OpenAPI]]-Datei ist ein großes Objekt mit wenigen Schlüsseln auf der obersten Ebene.
Jeder Schlüssel hat eine feste Aufgabe:

![Die Schlüssel der obersten Ebene einer OpenAPI-Datei](/assets/api-dokumentation/openapi-aufbau.svg)

| Schlüssel | Pflicht? | Inhalt |
|---|---|---|
| `openapi` | ja | Version des Standards, z. B. `3.1.0` |
| `info` | ja | Titel, Version und Beschreibung deiner API |
| `servers` | nein | Basis-[[url|URLs]], unter denen die API erreichbar ist |
| `paths` | (ja)* | Die [[endpunkt|Endpunkte]] |
| `components` | nein | Wiederverwendbare Bausteine wie Schemas |
| `security` | nein | Welche Anmeldung standardmäßig gilt |
| `tags` | nein | Gruppen für die Sortierung in der Doku |

\* Mindestens eins von `paths`, `components` oder `webhooks` muss vorhanden sein.

## info und servers

`info` beschreibt die API als Ganzes. `title` und `version` sind Pflicht, `description` darf
[[markdown|Markdown]] enthalten und wird in Doku-Ansichten als Einleitung angezeigt.

```yaml title="info und servers"
openapi: 3.1.0
info:
  title: Buch-API
  version: 1.4.0
  description: Verwaltet Bücher und Ausleihen.
  license:
    name: MIT
    identifier: MIT
servers:
  - url: https://api.example.com/v1
    description: Produktion
  - url: http://localhost:8000/api/v1
    description: Lokale Entwicklung
```

`servers` ist eine Liste von Basis-URLs. Alle Pfade werden an diese Adresse angehängt: Aus
`/books` wird `https://api.example.com/v1/books`. Doku-Seiten bieten eine Auswahl an, auf welchem
Server ein Testaufruf landen soll.

> [!FEHLER]
> `openapi: 3.1.0` und `info.version` werden oft verwechselt. Das erste ist die Version des
> **Standards**, das zweite die Version **deiner API**. Wenn du die API änderst, erhöhst du nur
> `info.version`.

## paths und Operationen

Unter `paths` steht jeder Pfad. Darunter folgt die [[http-methode|HTTP-Methode]] in
**Kleinbuchstaben**. Die Kombination aus Pfad und Methode heißt [[openapi-operation|Operation]].

```yaml title="Zwei Pfade, drei Operationen"
paths:
  /books:
    get:
      operationId: listBooks
      summary: Alle Bücher auflisten
      tags: [Books]
      responses:
        "200":
          description: Liste der Bücher
    post:
      operationId: createBook
      summary: Ein Buch anlegen
      tags: [Books]
      responses:
        "201":
          description: Das Buch wurde angelegt
  /health:
    get:
      operationId: getHealth
      responses:
        "200":
          description: Die API läuft
```

Wichtige Felder einer Operation:

- **`operationId`** – eindeutiger Name. Code-Generatoren machen daraus Funktionsnamen wie `listBooks()`
  ([[operation-id|mehr dazu]]).
- **`summary`** – ein kurzer Satz, der in der Navigation der Doku erscheint.
- **`tags`** – ordnet die Operation einer Gruppe zu ([[openapi-tag|Tag]]).
- **`responses`** – Pflicht, mindestens eine Antwort mit `description`.

> [!MERKSATZ]
> Pfad + Methode = Operation. Jede Operation braucht `responses`, und jede Antwort braucht eine `description`.

## YAML oder JSON?

OpenAPI-Dateien gibt es in [[yaml|YAML]] und [[json|JSON]] – der Inhalt ist identisch, nur die
Schreibweise unterscheidet sich.

| | YAML | JSON |
|---|---|---|
| Struktur | Einrückung mit Leerzeichen | Geschweifte Klammern |
| Kommentare | ja (`#`) | nein |
| Typischer Einsatz | Von Menschen geschrieben und gelesen | Von Programmen gelesen, z. B. mit [[jq]] |

```json title="Dieselbe Operation als JSON"
{
  "paths": {
    "/health": {
      "get": {
        "operationId": "getHealth",
        "responses": { "200": { "description": "Die API läuft" } }
      }
    }
  }
}
```

Mit [[redocly-cli|Redocly CLI]] wandelst du YAML in JSON um:
`npx redocly bundle openapi.yaml --ext json -o openapi.json`. Danach liest du Werte mit `jq` aus:
`jq -r '.paths | keys[]' openapi.json` listet alle Pfade.

> [!PRAXIS]
> Viele Teams schreiben YAML, weil es sich besser lesen und im Review vergleichen lässt. Werkzeuge
> in der CI arbeiten oft mit der JSON-Fassung.

## Eine vollständige Minimal-Spezifikation

So sieht die kleinste sinnvolle Datei aus. Sie ist gültig, und du kannst sie mit
`npx redocly lint openapi.yaml` prüfen – wie das genau funktioniert, lernst du in Modul 2.

```yaml title="openapi.yaml"
openapi: 3.1.0
info:
  title: Wetter-API
  version: 1.0.0
servers:
  - url: https://api.example.com/v1
paths:
  /health:
    get:
      operationId: getHealth
      summary: Prüft, ob die API läuft
      responses:
        "200":
          description: Die API ist erreichbar
```

Achte auf drei Dinge: Einrückung mit **Leerzeichen** (nie Tabs), Methoden in Kleinbuchstaben und
Statuscodes als Text in Anführungszeichen (`"200"`), weil Schlüssel in JSON immer Strings sind.

## Zusammenfassung

- Pflicht sind `openapi` (Version des Standards) und `info` mit `title` und `version`.
- `servers` nennt Basis-URLs, an die alle Pfade angehängt werden.
- Unter `paths` steht pro Pfad die Methode in Kleinbuchstaben – das ist eine **Operation**.
- Jede Operation braucht `responses`, jede Antwort eine `description`; `operationId` gibt ihr einen Namen.
- YAML und JSON sind gleichwertig; `redocly bundle --ext json` wandelt um, `jq` liest aus.
