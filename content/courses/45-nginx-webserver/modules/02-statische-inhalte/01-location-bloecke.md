---
title: location-Blöcke und ihre Reihenfolge
summary: Wie nginx unter mehreren location-Blöcken den richtigen findet – exakte Treffer, längstes Präfix, ^~ und reguläre Ausdrücke – und wie du die Entscheidung für jede URL sicher vorhersagst.
duration: 25
sources:
  - title: nginx – location-Direktive
    url: https://nginx.org/en/docs/http/ngx_http_core_module.html#location
  - title: nginx – How nginx processes a request
    url: https://nginx.org/en/docs/http/request_processing.html
  - title: nginx – Regular expressions in nginx (PCRE)
    url: https://nginx.org/en/docs/http/ngx_http_core_module.html#location
quiz:
  - type: single
    question: "Es gibt `location /` und `location /bilder/`. Welcher Block bearbeitet `/bilder/katze.jpg`?"
    options:
      - "`location /`, weil er zuerst in der Datei steht"
      - "`location /bilder/`, weil er das längere passende Präfix ist"
      - Beide nacheinander
      - Keiner, es kommt 404
    answer: 1
    explanation: >
      Bei Präfix-Locations zählt nicht die Reihenfolge, sondern die Länge: Das längste passende Präfix
      gewinnt (sofern kein regulärer Ausdruck danach zuschlägt).
  - type: match
    question: Ordne jedem Modifikator seine Bedeutung zu.
    pairs:
      - { left: "location = /", right: "nur genau dieser Pfad, Suche endet sofort" }
      - { left: "location ^~ /static/", right: "Präfix – wenn es das längste ist, werden keine Regex mehr geprüft" }
      - { left: "location ~ \\.php$", right: "regulärer Ausdruck, Groß-/Kleinschreibung beachten" }
      - { left: "location ~* \\.(jpg|png)$", right: "regulärer Ausdruck, Groß-/Kleinschreibung egal" }
      - { left: "location /api/", right: "normales Präfix" }
    explanation: Ohne Modifikator ist eine location ein Präfix. Regex-Locations beginnen mit ~ oder ~*.
  - type: multiple
    question: "Konfiguration: `location /docs/ {A}`, `location ~* \\.pdf$ {B}`, `location ^~ /docs/intern/ {C}`. Welche Aussagen stimmen?"
    options:
      - "`/docs/handbuch.pdf` landet in B"
      - "`/docs/intern/plan.pdf` landet in C"
      - "`/docs/start.html` landet in A"
      - "`/docs/intern/plan.pdf` landet in B, weil Regex immer gewinnen"
    answers: [0, 1, 2]
    explanation: >
      Für `/docs/handbuch.pdf` ist A das längste Präfix, aber danach passt die Regex B – sie gewinnt. Für
      `/docs/intern/plan.pdf` ist C das längste Präfix und hat `^~`, also prüft nginx keine Regex mehr.
  - type: cloze
    text: "Reguläre Ausdrücke werden in der Reihenfolge geprüft, in der sie in der ___ stehen. Der ___ passende Ausdruck gewinnt."
    blanks:
      - [Konfiguration, Datei, Konfigurationsdatei]
      - [erste]
    explanation: Bei Präfixen zählt die Länge, bei Regex die Reihenfolge. Genau dieser Unterschied führt zu Überraschungen.
tasks:
  - id: wer-gewinnt
    type: steps
    title: Welcher location-Block gewinnt?
    description: |
      Für alle Fragen gilt dieser server-Block:

      ```nginx
      location = / { … }                      # A
      location / { … }                        # B
      location /assets/ { … }                 # C
      location ^~ /assets/vendor/ { … }       # D
      location ~* \.(css|js)$ { … }           # E
      location ~ ^/api/ { … }                 # F
      ```
    steps:
      - situation: Ein Browser ruft die Startseite `/` auf.
        question: Welcher Block antwortet?
        options: [A, B, E]
        answer: 0
        explanation: "`= /` ist ein exakter Treffer. Die Suche endet sofort – B wird gar nicht erst betrachtet."
      - situation: Jetzt kommt `/assets/app.css`.
        question: Welcher Block antwortet?
        options: [B, C, E]
        answer: 2
        explanation: >
          Das längste Präfix ist C. Da C kein `^~` hat, prüft nginx danach die Regex – E passt auf `.css`
          und gewinnt.
      - situation: Nun `/assets/vendor/chart.js`.
        question: Welcher Block antwortet?
        options: [C, D, E]
        answer: 1
        explanation: "Das längste Präfix ist D mit `^~`. Deshalb werden die Regex E und F übersprungen."
      - situation: Als Nächstes `/api/users.js`.
        question: Welcher Block antwortet?
        options: [B, E, F]
        answer: 1
        explanation: >
          Beide Regex passen. Gewinner ist die **erste** passende in der Datei – und E steht vor F. Das ist
          eine klassische Falle: Die API bekommt diese Anfrage nie.
      - situation: Zuletzt `/kontakt`.
        question: Welcher Block antwortet?
        options: [A, B, F]
        answer: 1
        explanation: Kein exakter Treffer, keine Regex passt. Übrig bleibt das gemerkte längste Präfix `/` – also B.
  - id: urls-zuordnen
    type: dragdrop
    title: Ordne die URLs ihrem Block zu
    description: |
      Gegeben ist:

      ```nginx
      location = /health { … }              # Health-Check
      location / { … }                      # Website
      location /api/ { … }                  # API
      location ~* \.(png|jpg|webp)$ { … }   # Bilder
      ```

      Ziehe jede URL zu dem Block, der sie beantwortet.
    targets:
      - { id: health, label: "= /health" }
      - { id: website, label: "location /" }
      - { id: api, label: "location /api/" }
      - { id: bilder, label: "Regex für Bilder" }
    items:
      - { label: /health, target: health }
      - { label: /health/details, target: website }
      - { label: /api/orders, target: api }
      - { label: /api/avatar.png, target: bilder }
      - { label: /team/LOGO.PNG, target: bilder }
      - { label: /impressum, target: website }
---

Deine Website hat Bilder, eine API und eine Startseite – und jeder Bereich braucht andere Regeln.
Bilder sollen lange im Browser-Cache bleiben, die API soll an eine Anwendung gehen. Dafür gibt es
[[location-block|location-Blöcke]]. Spannend wird es, wenn mehrere auf dieselbe URL passen.

## Was eine location ist

Eine location gilt innerhalb eines server-Blocks für alle Anfragen, deren **Pfad** zu ihr passt.
Der Pfad ist der Teil der URL ohne Domain und ohne [[query-string|Query-String]]: Bei
`https://example.com/shop/tasse?farbe=rot` ist das `/shop/tasse`.

```nginx title="Ein server-Block mit drei Bereichen"
server {
    listen 80;
    server_name example.com;
    root /srv/example.com/public;

    location / {
        try_files $uri $uri/ =404;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
    }

    location ~* \.(png|jpg|webp)$ {
        expires 30d;
    }
}
```

Pro Anfrage gewinnt **genau eine** location. Ihre Direktiven gelten, die anderen nicht.

> [!MERKSATZ]
> location vergleicht nur den Pfad – nie die Domain, nie den Query-String.

## Die Arten im Überblick

| Schreibweise | Art | Beispiel passt auf |
|---|---|---|
| `location = /pfad` | exakt | nur `/pfad` |
| `location /pfad` | Präfix | `/pfad`, `/pfad/x`, auch `/pfadfinder` |
| `location ^~ /pfad/` | Präfix mit Vorrang | alles unter `/pfad/` |
| `location ~ regex` | [[regex|regulärer Ausdruck]] | Groß-/Kleinschreibung beachten |
| `location ~* regex` | regulärer Ausdruck | Groß-/Kleinschreibung egal |

Achtung beim Präfix ohne Schrägstrich: `location /admin` passt auch auf `/administrator.html`. Willst
du nur den Ordner treffen, schreibe `location /admin/`.

Es gibt außerdem **benannte** locations wie `location @fallback`. Sie passen auf keine URL, sondern
werden nur intern angesprungen – du begegnest ihnen bei `try_files`.

## Regex-locations lesen

Reguläre Ausdrücke sehen anfangs kryptisch aus. In nginx-Konfigurationen tauchen aber fast immer
dieselben Bausteine auf:

| Baustein | Bedeutung | Beispiel |
|---|---|---|
| `\.` | ein echter Punkt (ohne `\` heißt `.` „beliebiges Zeichen“) | `\.php` |
| `$` | Ende des Pfads | `\.css$` passt nicht auf `/app.css.map` |
| `^` | Anfang des Pfads | `^/api/` |
| `(a\|b)` | eins von beiden | `\.(jpg\|png)$` |
| `?` | das Zeichen davor ist optional | `\.jpe?g$` passt auf `.jpg` und `.jpeg` |

```nginx title="Typische Regex-locations"
location ~* \.(css|js|woff2)$ { expires 30d; }
location ~ ^/index\.php(/|$) { … }
location ~ /\.(?!well-known) { deny all; }
```

Die letzte Zeile nutzt einen [[lookaround|Lookahead]]: „ein Punkt nach einem Schrägstrich, aber nicht
gefolgt von `well-known`“. Sie sperrt versteckte Dateien wie `/.env` oder `/.git/config`.

> [!TIPP]
> nginx nutzt [[pcre|PCRE]]-Ausdrücke. Testen kannst du sie vorab mit `grep -P` im Terminal, etwa
> `echo "/assets/app.css" | grep -P '\.(css|js)$'`.

## Der Entscheidungsweg

nginx geht immer in derselben Reihenfolge vor:

![Entscheidungsweg: erst exakte Treffer, dann längstes Präfix merken, ^~ prüfen, dann Regex in Dateireihenfolge, sonst das gemerkte Präfix](/assets/nginx-webserver/location-reihenfolge.svg)

1. Gibt es einen **exakten** Treffer (`=`)? Dann ist er es. Ende.
2. Alle **Präfixe** prüfen und das **längste** passende merken.
3. Hat dieses längste Präfix `^~`? Dann ist es der Gewinner. Ende.
4. Die **regulären Ausdrücke** in der Reihenfolge der Datei prüfen. Der erste Treffer gewinnt.
5. Passt keine Regex, gewinnt das gemerkte Präfix aus Schritt 2.

> [!MERKSATZ]
> Präfixe: das **längste** gewinnt. Regex: der **erste** gewinnt. Regex schlagen Präfixe – außer bei
> `=` und `^~`.

## Ein Beispiel durchspielen

Nimm diese Konfiguration und die URL `/static/logo.png`:

```nginx
location /          { … }   # A
location /static/   { … }   # B
location ~* \.png$  { … }   # C
```

- Schritt 1: kein `=`.
- Schritt 2: A und B passen, B ist länger → B merken.
- Schritt 3: B hat kein `^~`.
- Schritt 4: C passt auf `.png` → **C gewinnt**.

Wolltest du, dass alles unter `/static/` in B bleibt, schreibst du `location ^~ /static/`. Dann endet
die Suche in Schritt 3.

> [!FEHLER]
> **„Mein Cache-Header für /static/ wirkt bei Bildern nicht.“** Eine Regex-location für Bildendungen
> weiter unten schnappt sich die Anfrage. Entweder `^~` am Präfix setzen oder die Regeln in die
> Regex-location verschieben. Vererbt wird zwischen locations übrigens nichts – jede steht für sich.

> [!PRAXIS]
> Halte die Zahl der Regex-locations klein. Präfixe sind schneller und ihre Reihenfolge spielt keine
> Rolle. Teams nutzen Regex fast nur für Dateiendungen und für PHP.

## Zusammenfassung

- Pro Anfrage gewinnt genau ein location-Block; verglichen wird nur der Pfad.
- `=` ist exakt und beendet die Suche sofort.
- Unter Präfixen gewinnt das längste; `^~` verhindert, dass danach Regex geprüft werden.
- Regex (`~`, `~*`) werden in Dateireihenfolge geprüft, die erste passende gewinnt.
- Passt keine Regex, gilt das längste Präfix.
