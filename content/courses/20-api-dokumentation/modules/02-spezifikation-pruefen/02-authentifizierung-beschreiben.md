---
title: Authentifizierung beschreiben
summary: Du dokumentierst mit securitySchemes und security, wie sich Clients anmelden – global, pro Operation und für öffentliche Endpunkte.
duration: 20
sources:
  - title: OpenAPI Specification 3.1.1 – Security Scheme Object
    url: https://spec.openapis.org/oas/v3.1.1.html#security-scheme-object
  - title: Learn OpenAPI – Describing API Security
    url: https://learn.openapis.org/specification/security.html
  - title: Redocly CLI – Regel security-defined
    url: https://redocly.com/docs/cli/rules/oas/security-defined
quiz:
  - type: match
    question: Ordne jedes Anmeldeverfahren seiner OpenAPI-Beschreibung zu.
    pairs:
      - { left: "Authorization: Bearer <token>", right: "type: http, scheme: bearer" }
      - { left: "X-API-Key: <schlüssel>", right: "type: apiKey, in: header" }
      - { left: "Benutzername und Passwort im Header", right: "type: http, scheme: basic" }
      - { left: "Login über einen Autorisierungsserver mit Scopes", right: "type: oauth2" }
    explanation: Bearer und Basic sind HTTP-Verfahren, ein API-Key ist ein frei benannter Header, Query-Parameter oder Cookie.
  - type: single
    question: "Die API verlangt global `security: [{ bearerAuth: [] }]`. Wie machst du `GET /health` öffentlich?"
    options:
      - Den Endpunkt aus der Spezifikation löschen.
      - "An der Operation `security: []` setzen."
      - "An der Operation `bearerAuth: false` setzen."
      - Das geht nicht, global gilt immer.
    answer: 1
    explanation: >
      security an einer Operation überschreibt die globale Angabe. Eine leere Liste bedeutet:
      Für diese Operation ist keine Anmeldung nötig.
  - type: multiple
    question: Was steht in einer OpenAPI-Datei, wenn sie richtig gepflegt ist?
    options:
      - Die Art der Anmeldung, z. B. Bearer-Token
      - Ein echtes, gültiges Token zum Ausprobieren
      - Welche Operationen geschützt sind
      - Bei OAuth2 die nötigen Scopes
    answers: [0, 2, 3]
    explanation: >
      Die Spezifikation beschreibt das Verfahren, nie echte Zugangsdaten. Sie liegt oft öffentlich –
      ein Token darin wäre sofort ein Sicherheitsleck.
  - type: cloze
    text: "Anmeldeverfahren werden unter components → ___ definiert und mit dem Schlüssel ___ angewendet."
    blanks:
      - [securitySchemes]
      - [security]
    explanation: securitySchemes beschreibt, welche Verfahren es gibt. security sagt, welches wo gilt.
tasks:
  - id: geschuetzt-aufrufen
    type: request
    title: Rufe einen geschützten Endpunkt auf
    description: |
      In der Spezifikation steht:

      ```yaml
      components:
        securitySchemes:
          bearerAuth:
            type: http
            scheme: bearer
      security:
        - bearerAuth: []
      paths:
        /me:
          get:
            operationId: getCurrentUser
      ```

      Rufe `GET /me` so auf, wie es die Spezifikation verlangt. Als Token nimmst du den Platzhalter
      `<dein-token>`.
    base_url: https://api.example.com/v1
    expected:
      method: GET
      path: "^/me/?$"
      headers: { Authorization: "^Bearer\\s+\\S+" }
    response:
      status: 200
      body: '{"id": 7, "email": "user@example.com"}'
    hints:
      - Bei `scheme: bearer` steht das Token im Header `Authorization`.
      - "Der Header-Wert beginnt mit dem Wort `Bearer`, dann ein Leerzeichen, dann das Token."
  - id: security-ergaenzen
    type: terminal
    title: Anmeldung dokumentieren
    description: |
      Die Spezifikation in `security` beschreibt eine API, bei der alle Endpunkte ein Bearer-Token
      brauchen – außer `GET /health`. Die Anmeldung fehlt aber in der Datei, deshalb meldet Redocly
      Fehler der Regel `security-defined`. Klicke zuerst auf **Aufgabe vorbereiten**.

      1. Führe `npx redocly lint openapi.yaml` aus und lies die Fehler.
      2. Lege unter `components.securitySchemes` ein Schema `bearerAuth` an (`type: http`,
         `scheme: bearer`, `bearerFormat: JWT`).
      3. Setze auf oberster Ebene `security` so, dass `bearerAuth` für alle Operationen gilt.
      4. Mach `GET /health` öffentlich, indem du dort `security: []` setzt.
      5. Lint erneut, bis keine Fehler mehr übrig sind.
    workdir: security
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
        title: Konto-API
        version: 1.0.0
      servers:
        - url: https://api.example.com/v1
      paths:
        /health:
          get:
            operationId: getHealth
            summary: Erreichbarkeit prüfen
            responses:
              "200":
                description: Die API läuft
        /me:
          get:
            operationId: getCurrentUser
            summary: Angemeldeten Benutzer laden
            responses:
              "200":
                description: Der Benutzer
              "401":
                description: Nicht angemeldet
      EOF
    checks:
      - type: command
        run: npx redocly lint openapi.yaml >/dev/null 2>&1
        message: "`npx redocly lint openapi.yaml` meldet noch Fehler – vermutlich fehlt security noch an einer Stelle."
      - type: command
        run: "d=$(mktemp -d \"$PWD/.pruefung-XXXXXX\"); npx redocly bundle openapi.yaml --ext json -o \"$d/s.json\" >/dev/null 2>&1; jq -r '.components.securitySchemes.bearerAuth | [.type, .scheme] | join(\"|\")' \"$d/s.json\"; rm -rf \"$d\""
        stdout_equals: "http|bearer"
        message: "Unter components.securitySchemes fehlt bearerAuth mit type: http und scheme: bearer."
      - type: command
        run: "d=$(mktemp -d \"$PWD/.pruefung-XXXXXX\"); npx redocly bundle openapi.yaml --ext json -o \"$d/s.json\" >/dev/null 2>&1; jq -r '.security[0] | keys[0]' \"$d/s.json\"; rm -rf \"$d\""
        stdout_equals: bearerAuth
        message: "Auf oberster Ebene fehlt security mit dem Eintrag bearerAuth: []."
      - type: command
        run: "d=$(mktemp -d \"$PWD/.pruefung-XXXXXX\"); npx redocly bundle openapi.yaml --ext json -o \"$d/s.json\" >/dev/null 2>&1; jq -c '[.paths[\"/health\"].get.security, .paths[\"/me\"].get.security]' \"$d/s.json\"; rm -rf \"$d\""
        stdout_equals: "[[],null]"
        message: "GET /health soll security: [] bekommen. GET /me soll keine eigene security-Angabe haben, damit die globale gilt."
    hints:
      - Die Regel security-defined will, dass für jede Operation klar ist, welche Anmeldung gilt – global oder an der Operation.
      - "`security` auf oberster Ebene ist eine Liste: `security:` und darunter `  - bearerAuth: []`."
      - "Für den öffentlichen Endpunkt reicht in der get-Operation von /health die Zeile `security: []`."
    solution: |
      ```yaml title="openapi.yaml (Ergänzungen)"
      security:
        - bearerAuth: []
      paths:
        /health:
          get:
            operationId: getHealth
            summary: Erreichbarkeit prüfen
            security: []
            responses:
              "200":
                description: Die API läuft
        # /me bleibt unverändert
      components:
        securitySchemes:
          bearerAuth:
            type: http
            scheme: bearer
            bearerFormat: JWT
      ```
---
Ein Frontend-Team ruft deine API auf und bekommt nur `401 Unauthorized`. In der Doku steht kein Wort
darüber, wie man sich anmeldet. Also fragen sie im Chat – jedes Team, jedes Mal. Dabei kann OpenAPI
das genau beschreiben, und Doku-Seiten bieten dann sogar einen Knopf zum Anmelden an.

## Zwei Schritte: definieren und anwenden

OpenAPI trennt die Anmeldung in zwei Teile:

1. **Definieren** unter `components.securitySchemes`: Welche Verfahren gibt es überhaupt? Jedes
   bekommt einen Namen, z. B. `bearerAuth`. Das ist ein [[security-scheme|Security Scheme]].
2. **Anwenden** mit `security`: Welches Verfahren gilt wo?

```yaml title="Definieren und global anwenden"
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
security:
  - bearerAuth: []
```

Steht `security` auf oberster Ebene, gilt es für **alle** Operationen. Die leere Liste `[]` hinter
`bearerAuth` ist für Scopes da – bei Bearer-Tokens bleibt sie leer.

> [!MERKSATZ]
> `securitySchemes` sagt, **welche** Anmeldeverfahren es gibt. `security` sagt, **wo** sie gelten.

## Die wichtigsten Verfahren

| `type` | Weitere Felder | So sieht die Anfrage aus |
|---|---|---|
| `http` + `scheme: bearer` | `bearerFormat` (nur Info) | `Authorization: Bearer <dein-token>` |
| `http` + `scheme: basic` | – | `Authorization: Basic <base64>` |
| `apiKey` | `in` (header, query, cookie), `name` | `X-API-Key: <dein-schlüssel>` |
| `oauth2` | `flows` mit URLs und Scopes | Token von einem Autorisierungsserver |
| `openIdConnect` | `openIdConnectUrl` | Login über einen Identitätsanbieter |

```yaml title="Ein API-Key im Header"
components:
  securitySchemes:
    apiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
```

Ein [[bearer-token|Bearer-Token]] ist ein Zugangsausweis: Wer ihn hat („trägt“), darf rein.
Ein [[api-key|API-Key]] ist ein fester Schlüssel, meist für Server-zu-Server-Aufrufe.

Wichtig: OpenAPI beschreibt nur, **wie** sich ein Client anmeldet – nicht, wie er an das Token kommt.
Wenn deine API dafür einen eigenen Login-Endpunkt hat (z. B. `POST /auth/token`), dokumentierst du ihn
als ganz normale Operation mit `security: []`, denn vor dem Login hat der Client ja noch kein Token.
In `description` von `info` oder des Security Schemes erklärst du in ein, zwei Sätzen den Ablauf.

## Pro Operation überschreiben

`security` an einer Operation **ersetzt** die globale Angabe. So machst du einzelne Endpunkte
öffentlich oder verlangst ein anderes Verfahren:

```yaml title="Öffentlich und anders geschützt"
paths:
  /health:
    get:
      operationId: getHealth
      security: []          # öffentlich, keine Anmeldung
      responses:
        "200":
          description: Die API läuft
  /admin/reports:
    get:
      operationId: listReports
      security:
        - apiKeyAuth: []    # hier gilt nur der API-Key
      responses:
        "200":
          description: Berichte
```

Die Liste unter `security` bedeutet **ODER**: Jeder Eintrag ist eine Alternative. Stehen zwei Namen
im **selben** Eintrag (`- { bearerAuth: [], apiKeyAuth: [] }`), müssen **beide** erfüllt sein.

> [!FEHLER]
> `security: []` an der Operation vergessen – dann zeigt die Doku ein Schloss an einem Endpunkt, der
> gar keine Anmeldung braucht. Umgekehrt ist ein vergessenes globales `security` schlimmer: Die Doku
> behauptet, alles sei öffentlich.

## Scopes bei OAuth2

Bei [[oauth2|OAuth2]] gibt es Berechtigungen, sogenannte Scopes. Die Liste hinter dem Namen nennt,
welche Scopes eine Operation braucht:

```yaml title="OAuth2 mit Scopes"
components:
  securitySchemes:
    oauth:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://auth.example.com/authorize
          tokenUrl: https://auth.example.com/token
          scopes:
            books:read: Bücher lesen
            books:write: Bücher ändern
paths:
  /books:
    post:
      security:
        - oauth: [books:write]
```

> [!PRAXIS]
> Echte Tokens oder Schlüssel gehören **nie** in die Spezifikation – auch nicht als `example`. Die
> Datei landet im Repository und oft öffentlich im Netz. Schreib Platzhalter wie `<dein-token>`.

## Zusammenfassung

- Anmeldeverfahren definierst du unter `components.securitySchemes`, angewendet werden sie mit `security`.
- `security` auf oberster Ebene gilt für alle Operationen, an einer Operation überschreibt es die globale Angabe.
- `security: []` macht eine Operation öffentlich.
- Häufige Typen: `http` mit `bearer` oder `basic`, `apiKey` (header/query/cookie), `oauth2`, `openIdConnect`.
- Einträge der `security`-Liste sind Alternativen (ODER), Namen im selben Eintrag gelten zusammen (UND).
- Die Regel `security-defined` von Redocly meldet Operationen ohne Angabe zur Anmeldung.
