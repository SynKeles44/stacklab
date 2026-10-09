---
title: Der Aufbau einer URL
summary: Schema, Host, Port, Pfad, Query-String und Fragment – was jeder Teil einer Webadresse bedeutet und wer ihn auswertet.
duration: 20
sources:
  - title: MDN – What is a URL?
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_URL
  - title: MDN – URL API
    url: https://developer.mozilla.org/en-US/docs/Web/API/URL
  - title: RFC 3986 – Uniform Resource Identifier (URI) Generic Syntax
    url: https://www.rfc-editor.org/rfc/rfc3986
quiz:
  - type: match
    question: "Ordne die Teile von `https://shop.example.com:8443/produkte?farbe=rot#bewertungen` zu."
    pairs:
      - { left: "https", right: "Schema" }
      - { left: "shop.example.com", right: "Host" }
      - { left: "8443", right: "Port" }
      - { left: "/produkte", right: "Pfad" }
      - { left: "farbe=rot", right: "Query-String" }
      - { left: "bewertungen", right: "Fragment" }
    explanation: Schema vor `://`, Host bis zum Doppelpunkt oder Schrägstrich, Port nach dem Doppelpunkt, dann Pfad, `?` Query und `#` Fragment.
  - type: single
    question: Welcher Teil einer URL wird **nicht** an den Server geschickt?
    options:
      - Der Pfad
      - Der Query-String
      - Das Fragment nach dem #
      - Der Host
    answer: 2
    explanation: Das Fragment wertet nur der Browser aus, etwa um zu einer Überschrift zu springen. Es taucht in der HTTP-Anfrage nicht auf.
  - type: cloze
    text: "Lässt du den Port weg, nimmt der Browser bei `http` Port ___ und bei `https` Port ___."
    blanks:
      - ["80"]
      - ["443"]
    explanation: Das sind die Standardports. Nur wenn ein Server auf einem anderen Port lauscht, musst du ihn in der URL angeben.
  - type: find-bug
    question: Welche Zeile enthält eine fehlerhafte URL?
    language: text
    code: |
      https://www.example.com/
      https://api.example.com/v1/users?seite=2
      https://shop.example.com/suche?q=rote schuhe
      https://example.com/hilfe#kontakt
    bug_line: 3
    explanation: Leerzeichen sind in URLs nicht erlaubt. Richtig wäre `q=rote%20schuhe` (oder `rote+schuhe` im Query-String).
tasks:
  - id: url-teile
    type: dragdrop
    title: Zerlege die URL
    description: "Ordne jeden Ausschnitt aus `https://shop.example.com:8443/produkte/schuhe?farbe=rot&seite=2#bewertungen` dem richtigen Teil zu."
    targets:
      - { id: schema, label: Schema }
      - { id: host, label: Host }
      - { id: port, label: Port }
      - { id: pfad, label: Pfad }
      - { id: query, label: Query-String }
      - { id: fragment, label: Fragment }
    items:
      - { label: "https", target: schema }
      - { label: "shop.example.com", target: host }
      - { label: "8443", target: port }
      - { label: "/produkte/schuhe", target: pfad }
      - { label: "farbe=rot&seite=2", target: query }
      - { label: "bewertungen", target: fragment }
  - id: url-zerlegen
    type: code
    language: js
    title: Schreibe zerlegeUrl()
    description: |
      Schreibe eine Funktion `zerlegeUrl(text)`, die eine URL mit der eingebauten Klasse `URL` zerlegt und ein Objekt
      zurückgibt:

      ```js
      { schema: "https", host: "shop.example.com", port: 443, pfad: "/produkte", query: { farbe: "rot" }, fragment: "top" }
      ```

      - `schema` ohne Doppelpunkt, `fragment` ohne `#` (leerer String, wenn keins da ist).
      - `port` ist eine **Zahl**. Steht kein Port in der URL, nimm den Standardport: 80 für `http`, 443 für `https`.
      - `query` ist ein Objekt aus den Parametern (leeres Objekt, wenn keine da sind).
    starter: |
      function zerlegeUrl(text) {
        const url = new URL(text)
        // url.protocol, url.hostname, url.port, url.pathname, url.searchParams, url.hash
        return {}
      }
    tests:
      - name: zerlegt eine URL mit allen Teilen
        code: |
          assertDeepEqual(zerlegeUrl("https://shop.example.com:8443/produkte?farbe=rot&seite=2#top"), {
            schema: "https", host: "shop.example.com", port: 8443, pfad: "/produkte",
            query: { farbe: "rot", seite: "2" }, fragment: "top"
          })
      - name: ergänzt den Standardport für https
        code: assertEqual(zerlegeUrl("https://example.com/").port, 443)
      - name: ergänzt den Standardport für http
        code: assertEqual(zerlegeUrl("http://example.com/hilfe").port, 80)
      - name: leere Query und leeres Fragment
        code: |
          const teile = zerlegeUrl("https://example.org")
          assertDeepEqual(teile.query, {})
          assertEqual(teile.fragment, "")
          assertEqual(teile.pfad, "/")
      - name: dekodiert Prozent-Kodierung
        code: assertEqual(zerlegeUrl("https://example.com/suche?q=rote%20schuhe").query.q, "rote schuhe")
    hints:
      - "`url.protocol` ist z. B. `\"https:\"` – den Doppelpunkt entfernst du mit `.replace(':', '')`."
      - "`url.port` ist ein leerer String, wenn der Standardport gilt."
      - "`Object.fromEntries(url.searchParams)` macht aus den Parametern ein Objekt."
    solution: |
      function zerlegeUrl(text) {
        const url = new URL(text)
        const schema = url.protocol.replace(':', '')
        const standard = { http: 80, https: 443 }
        return {
          schema,
          host: url.hostname,
          port: url.port === '' ? standard[schema] : Number(url.port),
          pfad: url.pathname,
          query: Object.fromEntries(url.searchParams),
          fragment: url.hash.replace('#', ''),
        }
      }
---

Jeden Tag tippst und klickst du Dutzende Webadressen. Sie sehen wie ein langer Textschnipsel aus, sind aber
genau aufgebaut: Jeder Teil hat eine Aufgabe und wird von jemand anderem ausgewertet – vom Browser, vom
DNS oder vom Server. Wer eine [[url|URL]] lesen kann, versteht viel besser, was beim Aufruf passiert.

## Die Teile im Überblick

Eine URL (*Uniform Resource Locator*) beschreibt, **wo** eine Ressource liegt und **wie** man sie abruft:

```text title="Anatomie einer URL"
https://shop.example.com:8443/produkte/schuhe?farbe=rot&seite=2#bewertungen
└─┬─┘   └──────┬───────┘ └┬─┘└──────┬───────┘└───────┬───────┘└────┬────┘
Schema       Host       Port      Pfad          Query-String    Fragment
```

| Teil | Beispiel | Wer wertet ihn aus? |
|---|---|---|
| [[url-schema\|Schema]] | `https` | Browser: welches Protokoll? |
| Host | `shop.example.com` | DNS: welche IP-Adresse? |
| [[port\|Port]] | `8443` | TCP: welches Programm auf dem Server? |
| Pfad | `/produkte/schuhe` | Server: welche Seite oder Datei? |
| [[query-string\|Query-String]] | `farbe=rot&seite=2` | Server: zusätzliche Parameter |
| [[fragment\|Fragment]] | `bewertungen` | Nur der Browser: wohin scrollen? |

> [!MERKSATZ]
> Eine URL verteilt Aufgaben: Das **Schema** wählt das Protokoll, der **Host** geht an DNS, der **Port**
> an TCP, **Pfad** und **Query** an den Server – und das **Fragment** bleibt im Browser.

## Schema, Host und Port

Das **Schema** steht vor `://`. Für Webseiten ist es `http` oder `https`. Es gibt viele weitere, etwa
`mailto:` für E-Mail-Links oder `file://` für lokale Dateien.

Der **Host** ist meist ein Domainname, kann aber auch eine IP-Adresse sein: `http://127.0.0.1:8080/`.
IPv6-Adressen kommen in eckige Klammern: `http://[2001:db8::10]/`.

Der **Port** ist optional. Fehlt er, gilt der Standardport des Schemas:

| Schema | Standardport | Muss man ihn schreiben? |
|---|---|---|
| `http` | 80 | Nein |
| `https` | 443 | Nein |
| `http` auf einem Dev-Server | z. B. 8080 | Ja: `http://localhost:8080/` |

## Pfad, Query-String und Fragment

Der **Pfad** beginnt mit `/` und sagt dem Server, welche Ressource gemeint ist. Früher entsprach er oft
einer echten Datei (`/kontakt.html`), heute entscheidet meist ein Programm, was zu `/produkte/schuhe` gehört.

Der **Query-String** beginnt mit `?`. Er enthält Schlüssel-Wert-Paare, getrennt durch `&`:
`?farbe=rot&seite=2`. Typisch für Suchen, Filter und Seitennummern.

Das **Fragment** beginnt mit `#`. Der Browser schickt es **nicht** an den Server, sondern springt damit
zum Element mit `id="bewertungen"` auf der Seite. Single-Page-Apps nutzen es manchmal auch für die Navigation.

> [!FEHLER]
> „Ich habe `#preise` angehängt, aber der Server sieht den Parameter nicht.“ – Richtig, Fragmente kommen
> nie beim Server an. Für Werte, die der Server lesen soll, nimmst du den Query-String: `?abschnitt=preise`.

## Sonderzeichen: Percent-Encoding

In URLs sind nur bestimmte Zeichen erlaubt. Leerzeichen, Umlaute oder Zeichen wie `&` innerhalb eines
Werts müssen kodiert werden. Das nennt man [[percent-encoding|Percent-Encoding]]: Jedes Byte wird als `%`
plus zwei Hex-Ziffern geschrieben.

| Zeichen | Kodiert |
|---|---|
| Leerzeichen | `%20` (im Query-String auch `+`) |
| `ä` | `%C3%A4` (zwei Bytes in UTF-8) |
| `&` innerhalb eines Werts | `%26` |
| `/` innerhalb eines Werts | `%2F` |

In JavaScript erledigt das die eingebaute Klasse `URL` für dich:

```js run
const url = new URL('https://shop.example.com/suche?q=rote%20schuhe&seite=2#top')
console.log(url.hostname)                // shop.example.com
console.log(url.pathname)                // /suche
console.log(url.searchParams.get('q'))   // rote schuhe
console.log(url.hash)                    // #top
```

## Absolute und relative URLs

Eine **absolute** URL enthält alles ab dem Schema. Eine **relative** URL ergänzt der Browser anhand der
aktuellen Seite. Bist du auf `https://example.com/blog/artikel.html`, dann gilt:

| Relativ | Wird zu |
|---|---|
| `bild.png` | `https://example.com/blog/bild.png` |
| `/impressum` | `https://example.com/impressum` |
| `../index.html` | `https://example.com/index.html` |
| `//cdn.example.net/app.js` | `https://cdn.example.net/app.js` |

> [!PRAXIS]
> In Fehlermeldungen und Logs stehen ständig URLs. Wer sie zerlegen kann, sieht sofort: Ist der Host falsch
> (DNS-Problem)? Der Port (nichts lauscht)? Oder der Pfad (404 vom Server)?

## Zusammenfassung

- Eine URL besteht aus **Schema, Host, Port, Pfad, Query-String und Fragment**.
- Fehlt der Port, gilt der Standard: **80** für http, **443** für https.
- Der **Query-String** (`?a=1&b=2`) geht an den Server, das **Fragment** (`#…`) bleibt im Browser.
- Sonderzeichen werden per **Percent-Encoding** kodiert, z. B. Leerzeichen als `%20`.
- Relative URLs ergänzt der Browser anhand der aktuellen Seite.
