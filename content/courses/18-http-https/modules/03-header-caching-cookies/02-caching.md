---
title: Caching mit Cache-Control, ETag und 304
summary: Wie Browser und Proxys Antworten zwischenspeichern, was max-age, no-cache und no-store bedeuten und wie bedingte Anfragen mit ETag Daten sparen.
duration: 25
sources:
  - title: MDN – HTTP caching
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching
  - title: MDN – Cache-Control
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control
  - title: MDN – ETag
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ETag
  - title: RFC 9111 – HTTP Caching
    url: https://www.rfc-editor.org/rfc/rfc9111
quiz:
  - type: match
    question: Ordne jeder Cache-Control-Anweisung ihre Bedeutung zu.
    pairs:
      - { left: "max-age=3600", right: "Eine Stunde lang frisch – ohne Nachfrage nutzen" }
      - { left: "no-cache", right: "Speichern erlaubt, aber vor jeder Nutzung beim Server nachfragen" }
      - { left: "no-store", right: "Gar nicht speichern" }
      - { left: "private", right: "Nur der Browser darf speichern, keine geteilten Caches" }
      - { left: "immutable", right: "Ändert sich nie – auch beim Neuladen nicht nachfragen" }
    explanation: Der häufigste Irrtum ist no-cache – es heißt „nachfragen“, nicht „nicht speichern“.
  - type: single
    question: "Der Browser schickt `If-None-Match: \"a1b2\"` und die Datei hat sich nicht geändert. Was antwortet der Server?"
    options:
      - 200 OK mit der kompletten Datei
      - 304 Not Modified ohne Body
      - 301 Moved Permanently
      - 204 No Content
    answer: 1
    explanation: 304 sagt „deine Kopie ist noch aktuell“. Ohne Body spart das Bandbreite.
  - type: multiple
    question: Welche Antworten sollten auf keinen Fall in einem geteilten Cache (z. B. einem CDN) landen?
    options:
      - Die Seite „Mein Konto“ mit Name und Adresse
      - Ein Logo, das alle Besucher gleich sehen
      - Eine JSON-Antwort mit den Bestellungen einer Person
      - Eine CSS-Datei mit Hash im Dateinamen
    answers: [0, 2]
    explanation: Persönliche Daten brauchen `private` oder `no-store`. Sonst bekommt der nächste Besucher womöglich fremde Daten aus dem Cache.
  - type: cloze
    text: "Zu einem ETag gehört in der nächsten Anfrage der Header ___. Zu Last-Modified gehört der Header ___."
    blanks:
      - [If-None-Match]
      - [If-Modified-Since]
    explanation: Beides sind bedingte Anfragen. Der Server antwortet mit 304, wenn sich nichts geändert hat.
tasks:
  - id: cache-entscheidungen
    type: steps
    title: Aus dem Cache oder vom Server?
    description: "Eine Seite bindet `app.css` ein. Der Server liefert sie mit `Cache-Control: max-age=600` und `ETag: \"c7\"`. Was passiert als Nächstes?"
    steps:
      - situation: Du öffnest die Seite zum ersten Mal.
        question: Woher kommt app.css?
        options:
          - Vom Server – der Cache ist noch leer.
          - Aus dem Cache.
          - Gar nicht, weil max-age gesetzt ist.
        answer: 0
        explanation: Beim ersten Besuch gibt es nichts zwischenzuspeichern. Die Antwort wird danach mit ETag gespeichert.
      - situation: Fünf Minuten später klickst du auf eine andere Seite, die dieselbe app.css nutzt.
        question: Was macht der Browser?
        options:
          - Er fragt mit If-None-Match beim Server nach.
          - Er nimmt die Datei aus dem Cache, ganz ohne Anfrage.
          - Er lädt die Datei komplett neu.
        answer: 1
        explanation: 300 Sekunden < 600 Sekunden – die Kopie ist noch frisch. Im Netzwerk-Tab steht „(disk cache)“ oder „(memory cache)“.
      - situation: Nach 15 Minuten kommst du zurück. In der Zwischenzeit hat niemand app.css geändert.
        question: Was passiert?
        options:
          - 'Der Browser fragt mit `If-None-Match: "c7"` nach und bekommt 304.'
          - Der Browser nimmt die Datei ohne Nachfrage aus dem Cache.
          - Der Server schickt 404.
        answer: 0
        explanation: Die Kopie ist abgelaufen (älter als 600 s). Der Browser prüft per bedingter Anfrage – und darf seine Kopie behalten.
      - situation: Ein Entwickler ändert app.css. Der Server berechnet den ETag neu.
        question: Was bekommt der Browser bei der nächsten Nachfrage?
        options:
          - 304 Not Modified
          - 200 OK mit der neuen Datei und einem neuen ETag
          - 409 Conflict
        answer: 1
        explanation: "`\"c7\"` passt nicht mehr zum aktuellen ETag – also gibt es die neue Version."
  - id: etag-server
    type: terminal
    title: Ein Server mit ETag und 304
    description: |
      Im Ordner `etag-server` liegt `daten.json` und ein unfertiges `router.php`. Baue bedingte Anfragen ein.

      Klicke zuerst auf **Aufgabe vorbereiten**.

      1. Für `GET /daten.json` soll `router.php`
         - den ETag als MD5-Prüfsumme der Datei in Anführungszeichen berechnen: `'"' . md5_file(...) . '"'`,
         - die Header `ETag` und `Cache-Control: no-cache` setzen,
         - mit `304` **ohne Body** antworten, wenn der Header `If-None-Match` den aktuellen ETag enthält,
         - sonst mit `200`, `Content-Type: application/json` und dem Dateiinhalt.
      2. Starte den Server auf Port 8080 und hole dir den ETag: `curl -i http://127.0.0.1:8080/daten.json`
      3. Frag bedingt nach und speichere die Ausgabe:
         `curl -i -H 'If-None-Match: <der ETag mit Anführungszeichen>' http://127.0.0.1:8080/daten.json > antwort-304.txt`

      Den Header `If-None-Match` findest du in PHP unter `$_SERVER['HTTP_IF_NONE_MATCH']`.
    workdir: etag-server
    setup: |
      printf '{"version": 1, "produkte": ["Tee", "Kaffee"]}\n' > daten.json
      cat > router.php <<'PHP'
      <?php
      $pfad = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

      if ($pfad === '/daten.json') {
          $datei = __DIR__ . '/daten.json';
          // TODO: ETag berechnen, Header setzen, bei passendem If-None-Match mit 304 antworten
          header('Content-Type: application/json');
          readfile($datei);
          exit;
      }

      http_response_code(404);
      PHP
    checks:
      - type: command
        run: |
          T=$(mktemp -d "$PWD/.pruefung-XXXXXX"); cp router.php daten.json "$T"/; cd "$T"
          php -S 127.0.0.1:18501 router.php >/dev/null 2>&1 & P=$!; sleep 1
          curl -s -o /dev/null -D - http://127.0.0.1:18501/daten.json | tr -d '\r' | grep -iE '^(etag|cache-control):' | tr 'A-Z' 'a-z' | sort
          kill $P; cd ..; rm -rf "$T"
        stdout_matches: "^cache-control: no-cache\\netag: \"[0-9a-f]{32}\"$"
        message: "GET /daten.json braucht die Header ETag (MD5 der Datei in Anführungszeichen) und Cache-Control: no-cache."
      - type: command
        run: |
          T=$(mktemp -d "$PWD/.pruefung-XXXXXX"); cp router.php daten.json "$T"/; cd "$T"
          php -S 127.0.0.1:18502 router.php >/dev/null 2>&1 & P=$!; sleep 1
          E="\"$(md5sum daten.json | cut -d' ' -f1)\""
          curl -s -o /dev/null -w '%{http_code} %{size_download}' -H "If-None-Match: $E" http://127.0.0.1:18502/daten.json
          kill $P; cd ..; rm -rf "$T"
        stdout_equals: "304 0"
        message: Mit passendem If-None-Match soll der Server 304 ohne Body antworten.
      - type: command
        run: |
          T=$(mktemp -d "$PWD/.pruefung-XXXXXX"); cp router.php daten.json "$T"/; cd "$T"
          php -S 127.0.0.1:18503 router.php >/dev/null 2>&1 & P=$!; sleep 1
          E="\"$(md5sum daten.json | cut -d' ' -f1)\""
          printf '{"version": 2}\n' > daten.json
          curl -s -w ' %{http_code}' -H "If-None-Match: $E" http://127.0.0.1:18503/daten.json
          kill $P; cd ..; rm -rf "$T"
        stdout_matches: "^\\{\"version\": 2\\}\\s+200$"
        message: Wenn sich daten.json geändert hat, passt der alte ETag nicht mehr – dann muss 200 mit dem neuen Inhalt kommen.
      - type: file_contains
        path: antwort-304.txt
        pattern: "^HTTP/1\\.1 304 Not Modified"
        message: antwort-304.txt soll die 304-Antwort deiner bedingten Anfrage enthalten (curl -i mit -H 'If-None-Match …').
    hints:
      - "`$etag = '\"' . md5_file($datei) . '\"';` – die Anführungszeichen gehören zum ETag dazu."
      - "Vergleich: `if (($_SERVER['HTTP_IF_NONE_MATCH'] ?? '') === $etag) { http_response_code(304); exit; }`"
      - "Setze `ETag` und `Cache-Control` vor dem Vergleich – auch eine 304-Antwort trägt sie."
    solution: |
      ```bash
      cd etag-server
      cat > router.php <<'PHP'
      <?php
      $pfad = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

      if ($pfad === '/daten.json') {
          $datei = __DIR__ . '/daten.json';
          $etag = '"' . md5_file($datei) . '"';
          header('ETag: ' . $etag);
          header('Cache-Control: no-cache');

          if (($_SERVER['HTTP_IF_NONE_MATCH'] ?? '') === $etag) {
              http_response_code(304);
              exit;
          }

          header('Content-Type: application/json');
          readfile($datei);
          exit;
      }

      http_response_code(404);
      PHP
      php -S 127.0.0.1:8080 router.php > server.log 2>&1 &
      sleep 1
      curl -i http://127.0.0.1:8080/daten.json
      ETAG=$(curl -s -o /dev/null -D - http://127.0.0.1:8080/daten.json | tr -d '\r' | grep -i '^etag:' | cut -d' ' -f2)
      curl -i -H "If-None-Match: $ETAG" http://127.0.0.1:8080/daten.json > antwort-304.txt
      cat antwort-304.txt
      kill %1
      ```
---
Ein Logo, eine Schriftart und ein Stylesheet ändern sich vielleicht einmal im Monat – trotzdem würde
der Browser sie ohne [[cache|Cache]] bei jedem Klick neu laden. Das kostet Zeit, Datenvolumen und
Serverleistung. HTTP-Caching löst das: Der Server sagt in Headern, wie lange eine Antwort gültig ist
und wie man prüft, ob sie noch stimmt.

## Wer speichert was?

Eine Antwort kann an mehreren Stellen zwischengespeichert werden:

| Cache | Wo | Für wen |
|---|---|---|
| Browser-Cache | auf deinem Gerät | nur dich (privat) |
| Geteilter Cache | Proxy, CDN, Reverse Proxy | viele Nutzer:innen |

Ein geteilter Cache – etwa ein [[cdn|CDN]] – ist mächtig: Eine Antwort, tausendfach ausgeliefert, belastet den Server nur
einmal. Er ist aber auch gefährlich – persönliche Daten dürfen dort nie landen.

Gecacht werden normalerweise nur Antworten auf `GET` (und `HEAD`) mit Status wie 200, 301 oder 404.
`POST`-Antworten nutzt kein Browser erneut.

## Cache-Control: frisch und abgelaufen

Der Header [[cache-control|Cache-Control]] steuert alles. Die wichtigsten Anweisungen:

| Anweisung | Bedeutung |
|---|---|
| `max-age=600` | 600 Sekunden frisch – so lange ohne Nachfrage nutzen |
| `no-cache` | Speichern ja, aber **vor jeder Nutzung** beim Server nachfragen |
| `no-store` | Überhaupt nicht speichern |
| `private` | Nur der Browser darf speichern |
| `public` | Auch geteilte Caches dürfen speichern |
| `immutable` | Ändert sich nie – auch beim Neuladen nicht nachfragen |

Anweisungen lassen sich kombinieren: `Cache-Control: private, max-age=60`.

> [!FEHLER]
> `no-cache` heißt **nicht** „nicht cachen“. Es heißt „immer erst nachfragen“. Wer wirklich nichts
> speichern will – etwa bei Kontoauszügen –, schreibt `no-store`.

Ist eine Kopie älter als `max-age`, gilt sie als abgelaufen. Weggeworfen wird sie aber nicht: Der
Browser fragt nach, ob sie noch stimmt.

## Bedingte Anfragen mit ETag

Ein [[etag|ETag]] ist ein Fingerabdruck einer Version, zum Beispiel eine Prüfsumme des Inhalts. Der
Server schickt ihn mit. Ist die Kopie abgelaufen, stellt der Browser eine
[[bedingte-anfrage|bedingte Anfrage]]: „Gib mir die Datei nur, wenn sie nicht mehr diesen ETag hat.“

![Ablauf von Caching mit max-age und ETag](/assets/http-https/caching-ablauf.svg)

```http title="Bedingte Anfrage und 304"
GET /logo.svg HTTP/1.1
Host: example.com
If-None-Match: "v1"

HTTP/1.1 304 Not Modified
ETag: "v1"
Cache-Control: max-age=60
```

Ein `304` hat keinen Body. Die Datei wird also nicht erneut übertragen – nur ein paar Header.

> [!MERKSATZ]
> `max-age` spart die ganze Anfrage, ein ETag mit `304` spart den Body. Beides zusammen ist das
> Standardrezept.

## Last-Modified als Alternative

Statt eines ETags kann der Server den Zeitpunkt der letzten Änderung schicken:

| Antwort-Header | Passender Anfrage-Header |
|---|---|
| `ETag: "v1"` | `If-None-Match: "v1"` |
| `Last-Modified: Fri, 09 Oct 2026 10:00:00 GMT` | `If-Modified-Since: Fri, 09 Oct 2026 10:00:00 GMT` |

[[last-modified|Last-Modified]] ist nur sekundengenau. Ändert sich eine Datei zweimal in derselben
Sekunde, merkt es niemand. ETags sind genauer und werden bevorzugt, wenn beide vorhanden sind.

## Rezepte aus der Praxis

| Inhalt | Empfehlung |
|---|---|
| CSS/JS mit Hash im Namen (`app.3f9a1c.js`) | `public, max-age=31536000, immutable` |
| HTML-Seiten | `no-cache` plus ETag |
| JSON einer persönlichen API | `private, no-cache` oder `no-store` |
| Kontoauszug, Gesundheitsdaten | `no-store` |

Der Trick bei Dateien mit Hash im Namen: Ändert sich der Inhalt, ändert sich der Name. Die alte Datei
darf ewig im Cache bleiben – das HTML verweist einfach auf die neue.

> [!PRAXIS]
> „Ich habe deployt, aber der Browser zeigt die alte Version“ – meist cacht das HTML zu lange. Im
> Netzwerk-Tab zeigt die Spalte Size „(disk cache)“. Mit „Disable cache“ prüfst du, ob es daran liegt.

## Zusammenfassung

- `Cache-Control` sagt, wer speichern darf und wie lange eine Antwort frisch ist.
- `no-cache` = immer nachfragen, `no-store` = nie speichern, `private` = nur der Browser.
- Ein ETag ist ein Fingerabdruck; mit `If-None-Match` fragt der Browser bedingt nach.
- `304 Not Modified` hat keinen Body und spart die erneute Übertragung.
- `Last-Modified` und `If-Modified-Since` funktionieren ähnlich, aber nur sekundengenau.
- Dateien mit Hash im Namen dürfen sehr lange gecacht werden.
