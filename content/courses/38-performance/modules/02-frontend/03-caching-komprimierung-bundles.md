---
title: Cache-Header, Komprimierung und Bundle-Größe
summary: Wie der Browser mit Cache-Control und Content-Hashes Dateien wiederverwendet, warum gzip und Brotli Text so stark verkleinern und wie Code-Splitting das JavaScript am Start klein hält.
duration: 25
sources:
  - title: MDN – HTTP caching
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching
  - title: MDN – Cache-Control
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control
  - title: MDN – Compression in HTTP
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Compression
  - title: Node.js – zlib (gzip und Brotli)
    url: https://nodejs.org/api/zlib.html
  - title: Vite – Building for Production
    url: https://vite.dev/guide/build
quiz:
  - type: single
    question: "Die Datei `app.81bd2e4f.js` enthält einen Hash ihres Inhalts im Namen. Welcher Cache-Header passt?"
    options:
      - "Cache-Control: no-store"
      - "Cache-Control: no-cache"
      - "Cache-Control: public, max-age=31536000, immutable"
      - "Cache-Control: max-age=60"
    answer: 2
    explanation: >
      Ändert sich der Inhalt, ändert sich der Name – unter diesem Namen kann es also nie eine neue Version geben. Der
      Browser darf die Datei darum ein Jahr lang ohne Rückfrage verwenden.
  - type: match
    question: Ordne jede Cache-Control-Anweisung ihrer Bedeutung zu.
    pairs:
      - { left: "max-age=3600", right: "Eine Stunde lang frisch, ohne Rückfrage nutzen" }
      - { left: "no-cache", right: "Speichern erlaubt, aber vor jeder Nutzung beim Server nachfragen" }
      - { left: "no-store", right: "Gar nicht speichern" }
      - { left: "immutable", right: "Ändert sich nie – auch beim Neuladen nicht nachfragen" }
    explanation: "Achtung: `no-cache` heißt nicht „nicht cachen“, sondern „immer erst nachfragen“. Gar nicht speichern ist `no-store`."
  - type: multiple
    question: Welche Dateien profitieren deutlich von gzip oder Brotli?
    options: [HTML, JavaScript, CSS, JSON-Antworten, AVIF-Bilder, ZIP-Archive]
    answers: [0, 1, 2, 3]
    explanation: Text ist voller Wiederholungen und schrumpft oft auf ein Viertel. Bilder und Archive sind schon komprimiert – erneutes Komprimieren kostet nur CPU.
  - type: cloze
    text: "Der Browser kündigt mit dem Header `Accept-___` an, welche Komprimierungen er versteht. Der Server antwortet mit `Content-___: br`."
    blanks:
      - [Encoding]
      - [Encoding]
    explanation: "So handeln Browser und Server die Komprimierung aus. `br` steht für Brotli, `gzip` für gzip."
tasks:
  - id: bundle-groessen
    type: terminal
    title: Wie groß ist das Bundle wirklich?
    description: |
      Im Ordner `dist` liegt das gebaute JavaScript einer Anwendung. Die Dateigröße auf der Platte ist nicht das, was
      übers Netz geht – miss die komprimierten Größen von `dist/app.js`.

      Klicke zuerst auf **Aufgabe vorbereiten**. Dann:

      1. Ermittle die Rohgröße in Bytes: `wc -c < dist/app.js`.
      2. Ermittle die Größe mit gzip auf höchster Stufe: `gzip -9 -c dist/app.js | wc -c`.
      3. Ermittle die Größe mit Brotli über das `zlib`-Modul von Node.js (Befehl in der Lektion).
      4. Schreibe die drei Zahlen in `groessen.json`:

         ```json
         { "roh": 0, "gzip": 0, "brotli": 0 }
         ```
    workdir: bundle-groessen
    setup: |
      mkdir -p dist
      {
        echo '"use strict";'
        for i in $(seq 1 400); do
          echo "export function formatPrice$i(amount, currency) { const value = Number(amount) / 100; return new Intl.NumberFormat('de-DE', { style: 'currency', currency: currency ?? 'EUR' }).format(value + $i); }"
          echo "export const productLabel$i = (product) => product.name.trim() + ' (' + product.sku + ') #$i';"
        done
      } > dist/app.js
    checks:
      - type: command
        run: jq -e '(.roh | type == "number") and (.gzip | type == "number") and (.brotli | type == "number")' groessen.json
        message: groessen.json braucht die drei Zahlen roh, gzip und brotli.
      - type: command
        run: test "$(jq -r .roh groessen.json)" -eq "$(wc -c < dist/app.js)"
        message: '"roh" stimmt nicht mit der Dateigröße überein. Nutze wc -c < dist/app.js.'
      - type: command
        run: g=$(gzip -9 -c dist/app.js | wc -c); jq -e --argjson g "$g" '(.gzip - $g) | fabs <= ($g * 0.05)' groessen.json
        message: '"gzip" weicht zu stark ab. Miss mit gzip -9 -c dist/app.js | wc -c.'
      - type: command
        run: b=$(node -e 'process.stdout.write(String(require("zlib").brotliCompressSync(require("fs").readFileSync("dist/app.js")).length))'); jq -e --argjson b "$b" '(.brotli - $b) | fabs <= ($b * 0.1)' groessen.json
        message: '"brotli" weicht zu stark ab. Miss mit zlib.brotliCompressSync aus Node.js.'
    hints:
      - "Jede Zahl bekommst du mit einem eigenen Befehl, z. B. `wc -c < dist/app.js`."
      - "Brotli: `node -e 'const z = require(\"zlib\"), fs = require(\"fs\"); console.log(z.brotliCompressSync(fs.readFileSync(\"dist/app.js\")).length)'`"
      - "Die Datei kannst du mit `echo '{\"roh\": 123, \"gzip\": 45, \"brotli\": 40}' > groessen.json` schreiben – mit deinen Zahlen."
    solution: |
      ```bash
      roh=$(wc -c < dist/app.js)
      gz=$(gzip -9 -c dist/app.js | wc -c)
      br=$(node -e 'const z = require("zlib"), fs = require("fs"); console.log(z.brotliCompressSync(fs.readFileSync("dist/app.js")).length)')
      echo "{\"roh\": $roh, \"gzip\": $gz, \"brotli\": $br}" > groessen.json
      cat groessen.json
      ```

      Das Bundle schrumpft auf einen Bruchteil, weil sich im Code sehr viel wiederholt. Brotli ist meist noch etwas kleiner als gzip.
  - id: cache-header-funktion
    type: code
    language: js
    title: Der richtige Cache-Control-Header
    description: |
      Schreibe `cacheControlFor(path)`, die für einen Pfad den passenden `Cache-Control`-Wert liefert:

      | Pfad | Rückgabe |
      |---|---|
      | beginnt mit `/api/` | `"no-store"` |
      | endet auf `.html` oder ist `/` | `"no-cache"` |
      | Dateiname mit Content-Hash, z. B. `app.81bd2e4f.js` (Punkt, **8** Hex-Zeichen, Punkt, Endung) | `"public, max-age=31536000, immutable"` |
      | alles andere | `"public, max-age=3600"` |
    starter: |
      function cacheControlFor(path) {
      }
    tests:
      - name: gehashtes Skript
        code: assertEqual(cacheControlFor('/assets/app.81bd2e4f.js'), 'public, max-age=31536000, immutable')
      - name: gehashtes Stylesheet
        code: assertEqual(cacheControlFor('/assets/main.0a1b2c3d.css'), 'public, max-age=31536000, immutable')
      - name: HTML-Seite
        code: assertEqual(cacheControlFor('/produkte/index.html'), 'no-cache')
      - name: Startseite
        code: assertEqual(cacheControlFor('/'), 'no-cache')
      - name: API-Antwort
        code: assertEqual(cacheControlFor('/api/cart'), 'no-store')
      - name: Datei ohne Hash
        code: assertEqual(cacheControlFor('/favicon.ico'), 'public, max-age=3600')
      - name: zu kurzer Hash zählt nicht
        code: assertEqual(cacheControlFor('/assets/app.abc.js'), 'public, max-age=3600')
    hints:
      - Prüfe die Regeln von oben nach unten und gib beim ersten Treffer zurück.
      - "Der reguläre Ausdruck `/\\.[0-9a-f]{8}\\.[a-z0-9]+$/` findet den Hash vor der Endung."
    solution: |
      function cacheControlFor(path) {
        if (path.startsWith('/api/')) return 'no-store';
        if (path === '/' || path.endsWith('.html')) return 'no-cache';
        if (/\.[0-9a-f]{8}\.[a-z0-9]+$/.test(path)) return 'public, max-age=31536000, immutable';
        return 'public, max-age=3600';
      }
---
Ein Besucher öffnet deinen Shop zum zweiten Mal an diesem Tag. Muss er wirklich wieder 800 KB JavaScript, alle
Schriften und das Logo herunterladen? Nein – wenn du dem Browser sagst, was er behalten darf. Diese Lektion
behandelt drei Hebel, die jede Seite schneller machen: Cache-Header, Komprimierung und schlankes JavaScript.

## Cache-Control: was darf der Browser behalten?

Mit dem [[cache-control|`Cache-Control`]]-Header legt der Server fest, ob und wie lange eine Antwort im
[[cache|Cache]] bleiben darf:

| Anweisung | Bedeutung |
|---|---|
| `max-age=3600` | 3600 Sekunden frisch – ohne Rückfrage nutzen |
| `no-cache` | Speichern ja, aber vor jeder Nutzung nachfragen |
| `no-store` | Gar nicht speichern (z. B. private API-Daten) |
| `immutable` | Ändert sich nie, auch beim Neuladen nicht nachfragen |
| `public` / `private` | Dürfen auch geteilte Caches (z. B. ein [[cdn|CDN]]) speichern? |

Ist eine Kopie abgelaufen, fragt der Browser mit dem [[etag|ETag]] nach: „Habe ich noch die aktuelle Version?“
Der Server antwortet dann nur mit `304 Not Modified` – ohne die Datei erneut zu senden.

## Cache-Busting mit Content-Hash

Das Dilemma: Lange Cache-Zeiten sparen Ladezeit, aber nach einem Release sollen alle sofort die neue Version
bekommen. Die Lösung heißt [[cache-busting|Cache-Busting]]: Der [[bundler|Bundler]] schreibt einen Hash des
Inhalts in den Dateinamen.

```text title="Build-Ausgabe"
dist/index.html                    0.6 kB
dist/assets/app.81bd2e4f.js      142.3 kB
dist/assets/app.3f9a1c07.css      18.9 kB
```

| Datei | Header |
|---|---|
| `index.html` | `no-cache` – wird immer geprüft und verweist auf die neuen Dateinamen |
| `app.81bd2e4f.js` | `public, max-age=31536000, immutable` – ein Jahr, ohne Rückfrage |

> [!MERKSATZ]
> HTML kurz oder gar nicht cachen, gehashte Assets ein Jahr lang. Eine neue Version bekommt einen neuen Namen.

## Komprimierung: gzip und Brotli

Text wie HTML, CSS, JavaScript und JSON wiederholt sich ständig (`function`, `return`, `class=`). Darum lässt er
sich stark [[komprimierung|komprimieren]]. Browser und Server handeln das über Header aus:

```http title="Anfrage und Antwort"
GET /assets/app.81bd2e4f.js HTTP/2
Accept-Encoding: gzip, br, zstd

HTTP/2 200
Content-Encoding: br
Cache-Control: public, max-age=31536000, immutable
```

[[gzip]] wird überall verstanden, [[brotli|Brotli]] (`br`) ist meist noch 10–20 % kleiner. Statische Dateien
komprimierst du am besten schon beim Build vor, damit der [[webserver|Webserver]] nicht bei jeder Anfrage rechnen muss.

> [!FEHLER]
> Bilder, Videos und ZIP-Dateien noch einmal mit gzip zu komprimieren, bringt nichts – sie sind schon komprimiert.
> Es kostet nur Rechenzeit. Komprimiere Text, nicht Binärdaten.

## Bundle-Größe: JavaScript ist teuer

Ein Byte JavaScript kostet mehr als ein Byte Bild: Der Browser muss es laden, parsen, kompilieren und ausführen –
alles im [[main-thread|Main Thread]]. Ein großes [[bundle|Bundle]] verschlechtert deshalb LCP und INP.

Miss die Größe so, wie sie übers Netz geht – komprimiert:

```bash title="Terminal"
wc -c < dist/app.js                       # roh
gzip -9 -c dist/app.js | wc -c            # gzip
node -e 'const z = require("zlib"), fs = require("fs");
  console.log(z.brotliCompressSync(fs.readFileSync("dist/app.js")).length)'   # Brotli
```

Bundler helfen beim Verkleinern: [[minifizierung|Minifizierung]] entfernt Leerzeichen und kürzt Namen,
[[tree-shaking|Tree Shaking]] wirft ungenutzte Exporte heraus.

## Code-Splitting: nur laden, was gebraucht wird

Die Startseite braucht keinen Diagramm-Editor, der nur im Admin-Bereich vorkommt. Mit
[[code-splitting|Code-Splitting]] teilt der Bundler den Code in mehrere Dateien, die erst bei Bedarf geladen werden.
Das Werkzeug dafür ist der [[dynamischer-import|dynamische Import]]:

```js title="Den Editor erst beim Klick laden"
button.addEventListener('click', async () => {
  const { openChartEditor } = await import('./chart-editor.js');
  openChartEditor();
});
```

Vite und andere Bundler erzeugen für `chart-editor.js` automatisch eine eigene, gehashte Datei. In React erreichst
du dasselbe für ganze Seiten mit `React.lazy()` oder dem `lazy`-Feld einer Route.

> [!PRAXIS]
> Bevor du eine neue Bibliothek installierst, prüf ihre Größe. Eine Datumsbibliothek mit 70 KB für eine einzige
> Formatierung lässt sich oft durch das eingebaute `Intl.DateTimeFormat` ersetzen – das kostet 0 Byte.

## Zusammenfassung

- **Cache-Control** steuert, wie lange Dateien ohne Rückfrage genutzt werden; mit **ETag** gibt es günstige 304-Antworten.
- **Cache-Busting:** gehashte Dateinamen ein Jahr `immutable` cachen, HTML mit `no-cache` ausliefern.
- **gzip** und **Brotli** verkleinern Text drastisch; Bilder und Archive nicht erneut komprimieren.
- JavaScript kostet Download und Rechenzeit im Main Thread – miss die komprimierte Bundle-Größe.
- **Code-Splitting** per `import()` lädt selten genutzten Code erst bei Bedarf.
