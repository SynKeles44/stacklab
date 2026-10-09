---
title: Doku anzeigen – Swagger UI, Redoc und Scalar
summary: Aus derselben OpenAPI-Datei entstehen verschiedene Doku-Ansichten. Du vergleichst Swagger UI, Redoc und Scalar und baust eine statische Doku-Seite.
duration: 20
sources:
  - title: Swagger UI – Installation
    url: https://swagger.io/docs/open-source-tools/swagger-ui/usage/installation/
  - title: Redocly CLI – build-docs
    url: https://redocly.com/docs/cli/commands/build-docs
  - title: Scalar API Reference (npm)
    url: https://www.npmjs.com/package/@scalar/api-reference
quiz:
  - type: match
    question: Ordne jedes Werkzeug seiner Stärke zu.
    pairs:
      - { left: "Swagger UI", right: "Klassiker mit „Try it out“ direkt im Browser" }
      - { left: "Redoc", right: "Dreispaltige Lese-Doku, auch als einzelne statische HTML-Datei" }
      - { left: "Scalar", right: "Moderne Oberfläche mit eingebautem API-Client und Code-Beispielen" }
    explanation: Alle drei lesen dieselbe OpenAPI-Datei. Welches ihr nutzt, ist Geschmack und Einsatzzweck.
  - type: single
    question: Was erzeugt `npx redocly build-docs openapi.yaml -o docs/index.html`?
    options:
      - Einen Webserver, der dauerhaft läuft
      - Eine einzelne HTML-Datei mit der kompletten Doku, die du überall ablegen kannst
      - Eine neue openapi.yaml
      - Einen API-Client in TypeScript
    answer: 1
    explanation: build-docs bündelt Spezifikation und Redoc in eine statische HTML-Datei – ideal für GitHub Pages oder einen Ordner auf dem Webserver.
  - type: multiple
    question: Worauf solltest du achten, wenn die Doku öffentlich erreichbar ist?
    options:
      - Keine echten Tokens oder internen Adressen in Beispielen
      - Interne Admin-Endpunkte nicht versehentlich mitveröffentlichen
      - Die Doku muss immer passwortgeschützt sein
      - „Try it out“ schickt echte Anfragen – am besten gegen eine Test-Umgebung
    answers: [0, 1, 3]
    explanation: >
      Öffentliche Doku ist bei öffentlichen APIs gewollt. Wichtig ist, dass nichts Internes darin
      landet und Testaufrufe nicht ungewollt Produktionsdaten ändern.
tasks:
  - id: werkzeuge-zuordnen
    type: dragdrop
    title: Welches Werkzeug passt?
    description: Ordne jede Situation dem Werkzeug zu, das am besten passt.
    targets:
      - { id: swagger, label: Swagger UI }
      - { id: redoc, label: Redoc / redocly build-docs }
      - { id: scalar, label: Scalar }
    items:
      - { label: Eine einzige HTML-Datei für GitHub Pages bauen, target: redoc }
      - { label: Der bekannte „Try it out“-Knopf mit Authorize-Dialog, target: swagger }
      - { label: Moderne Doku mit Code-Beispielen in vielen Sprachen, target: scalar }
      - { label: Dreispaltiges Layout mit Beispielen rechts, target: redoc }
      - { label: Paket swagger-ui-dist mit SwaggerUIBundle, target: swagger }
      - { label: "Scalar.createApiReference('#app', { url })", target: scalar }
  - id: doku-bauen
    type: terminal
    title: Eine statische Doku-Seite bauen
    description: |
      Im Ordner `doku-bauen` liegt eine gültige `openapi.yaml` der Buch-API, und Redocly CLI ist
      installiert. Du baust daraus einen Ordner `public`, den man auf jeden Webserver legen könnte.
      Klicke zuerst auf **Aufgabe vorbereiten**.

      1. Erzeuge mit Redoc die Datei `public/docs/index.html`:
         `npx redocly build-docs openapi.yaml -o public/docs/index.html`
      2. Kopiere die Spezifikation nach `public/openapi.yaml`.
      3. Lege `public/scalar.html` an, die Scalar per CDN lädt und `openapi.yaml` anzeigt. Nutze das
         HTML-Gerüst aus dem Abschnitt „Scalar“ der Lektion.
      4. Schau dir mit `ls -R public` das Ergebnis an.
    workdir: doku-bauen
    setup: |
      npm init -y >/dev/null
      timeout 170 npm install --no-audit --no-fund --silent @redocly/cli@2.62.1
      cat > openapi.yaml <<'EOF'
      openapi: 3.1.0
      info:
        title: Buch-API
        version: 1.0.0
        description: Verwaltet Bücher einer kleinen Bibliothek.
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
      EOF
    checks:
      - type: file_exists
        path: public/docs/index.html
        message: public/docs/index.html fehlt. Erzeuge sie mit npx redocly build-docs openapi.yaml -o public/docs/index.html.
      - type: file_contains
        path: public/docs/index.html
        pattern: "<title>Buch-API</title>"
        message: public/docs/index.html enthält nicht den Titel Buch-API – wurde sie aus openapi.yaml erzeugt?
      - type: command
        run: cmp -s openapi.yaml public/openapi.yaml
        message: public/openapi.yaml fehlt oder unterscheidet sich von openapi.yaml. Kopiere die Datei mit cp.
      - type: file_contains
        path: public/scalar.html
        pattern: "cdn\\.jsdelivr\\.net/npm/@scalar/api-reference"
        message: public/scalar.html lädt Scalar noch nicht über das CDN-Script.
      - type: file_contains
        path: public/scalar.html
        pattern: "createApiReference\\([^)]*url:\\s*['\"](\\./)?openapi\\.yaml['\"]"
        message: "In public/scalar.html fehlt der Aufruf Scalar.createApiReference(...) mit url: 'openapi.yaml'."
    hints:
      - "`-o` gibt den Zielpfad an. Fehlende Ordner legt Redocly selbst an."
      - "Zum Kopieren: `cp openapi.yaml public/openapi.yaml`"
      - Für scalar.html kannst du `nano public/scalar.html` nutzen und das Gerüst aus der Lektion abtippen.
    solution: |
      ```bash
      npx redocly build-docs openapi.yaml -o public/docs/index.html
      cp openapi.yaml public/openapi.yaml
      nano public/scalar.html
      ```

      ```html title="public/scalar.html"
      <!doctype html>
      <html>
        <head>
          <title>Buch-API</title>
          <meta charset="utf-8" />
        </head>
        <body>
          <div id="app"></div>
          <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
          <script>
            Scalar.createApiReference('#app', { url: 'openapi.yaml' })
          </script>
        </body>
      </html>
      ```
---
Eine OpenAPI-Datei ist für Maschinen gemacht. Kein Mensch liest gern 800 Zeilen YAML, um einen
Endpunkt zu verstehen. Zum Glück gibt es Werkzeuge, die aus der Datei eine übersichtliche Webseite
machen – mit Navigation, Beispielen und oft sogar einem Knopf zum Ausprobieren.

## Eine Spezifikation, viele Ansichten

Alle Doku-Werkzeuge funktionieren gleich: Sie lesen die OpenAPI-Datei und zeigen sie als Webseite an.
Du schreibst die Doku also **nie** doppelt – du wählst nur die Darstellung.

| Werkzeug | Eigenschaften | Typischer Einsatz |
|---|---|---|
| [[swagger-ui|Swagger UI]] | „Try it out“, Authorize-Dialog, sehr verbreitet | Interne Entwickler-Doku |
| [[redoc|Redoc]] | Dreispaltig, gut lesbar, als statische HTML-Datei | Öffentliche Doku, GitHub Pages |
| [[scalar|Scalar]] | Modern, eingebauter API-Client, Code-Beispiele | Öffentliche und interne Doku |

Viele Frameworks bringen eine dieser Ansichten gleich mit. Die Laravel-Werkzeuge aus Modul 3 liefern
zum Beispiel eine Doku-Seite unter `/docs/api` aus.

Wie gut die Seite wird, entscheidet aber die Spezifikation, nicht das Werkzeug. `summary` wird zum
Menüeintrag, `description` zum Erklärtext, `tags` zu Abschnitten und `example` zu den Beispielen
rechts neben dem Text. Fehlen diese Angaben, zeigt jedes Werkzeug nur nackte Pfade.

> [!MERKSATZ]
> Die OpenAPI-Datei ist die Quelle, die Doku-Seite nur eine Ansicht davon. Ändert sich die Datei,
> ändert sich jede Ansicht automatisch mit.

## Redoc: eine HTML-Datei

Mit Redocly CLI baust du aus der Spezifikation eine **einzelne statische HTML-Datei**:

```bash title="Terminal"
npx redocly build-docs openapi.yaml -o public/docs/index.html
```

Die Datei enthält Spezifikation und Oberfläche – du brauchst keinen Server, der irgendetwas
berechnet. Leg sie auf einen [[webserver|Webserver]], in GitHub Pages oder einen Objektspeicher.
Mit `--title` setzt du den Seitentitel; ohne Angabe nimmt Redocly `info.title`.

> [!HINWEIS]
> Redocly kündigt an, `build-docs` bald mit Redoc 3 zu rendern. Darum siehst du beim Ausführen einen
> Hinweiskasten. Die Datei entsteht trotzdem wie gewohnt.

## Swagger UI

Swagger UI ist der Klassiker. Du kannst es als npm-Paket einbinden oder per CDN in eine HTML-Datei
laden. Die Oberfläche zeigt jede Operation als aufklappbaren Block mit einem „Try it out“-Knopf.

```html title="swagger.html"
<div id="swagger-ui"></div>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui.css" />
<script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui-bundle.js"></script>
<script>
  SwaggerUIBundle({ url: 'openapi.yaml', dom_id: '#swagger-ui' })
</script>
```

Über „Authorize“ trägst du ein Token ein. Swagger UI weiß aus `securitySchemes`, wo es hingehört.

> [!FEHLER]
> „Try it out“ schickt **echte** Anfragen an den Server aus `servers`. Steht dort nur die
> Produktion, legt ein Klick vielleicht echte Datensätze an. Biete eine Test-Umgebung als ersten
> Server an.

## Scalar

Scalar ist ein neueres Werkzeug mit eingebautem API-Client und Code-Beispielen für viele Sprachen.
Per CDN reichen wenige Zeilen:

```html title="scalar.html"
<!doctype html>
<html>
  <head>
    <title>Buch-API</title>
    <meta charset="utf-8" />
  </head>
  <body>
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
    <script>
      Scalar.createApiReference('#app', { url: 'openapi.yaml' })
    </script>
  </body>
</html>
```

`url` ist relativ zur HTML-Datei. Liegt `openapi.yaml` daneben, wird sie geladen. Lokal ohne Server
blockiert der Browser das Laden oft – deshalb liefert man die Seite über einen Webserver aus.

> [!PRAXIS]
> In der CI wird die Doku-Seite oft bei jedem Merge in `main` neu gebaut und veröffentlicht. So zeigt
> die Doku immer den aktuellen Stand – ohne dass jemand daran denken muss.

## Zusammenfassung

- Doku-Werkzeuge lesen die OpenAPI-Datei und zeigen sie als Webseite – die Datei bleibt die einzige Quelle.
- **Swagger UI** ist verbreitet und bietet „Try it out“ mit Authorize-Dialog.
- **Redoc** erzeugst du mit `npx redocly build-docs openapi.yaml -o …` als einzelne HTML-Datei.
- **Scalar** bindest du per CDN mit `Scalar.createApiReference('#app', { url })` ein.
- „Try it out“ schickt echte Anfragen – achte auf die Server-Liste und auf Daten in Beispielen.
