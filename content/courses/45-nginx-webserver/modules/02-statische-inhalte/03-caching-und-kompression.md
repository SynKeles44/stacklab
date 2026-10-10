---
title: Cache-Header und Kompression
summary: Wie du mit expires und Cache-Control festlegst, wie lange Browser Dateien behalten, warum Dateien mit Hash im Namen ein Jahr gecacht werden dürfen, index.html aber nicht, und wie gzip die Übertragung verkleinert.
duration: 25
sources:
  - title: nginx – ngx_http_headers_module (expires, add_header)
    url: https://nginx.org/en/docs/http/ngx_http_headers_module.html
  - title: nginx – ngx_http_gzip_module
    url: https://nginx.org/en/docs/http/ngx_http_gzip_module.html
  - title: nginx – ngx_http_gzip_static_module
    url: https://nginx.org/en/docs/http/ngx_http_gzip_static_module.html
  - title: MDN – Cache-Control
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control
  - title: MDN – HTTP caching
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching
quiz:
  - type: single
    question: Warum darf `app.4f2a9c.js` ein Jahr im Browser-Cache bleiben, `index.html` aber nicht?
    options:
      - Weil JavaScript-Dateien kleiner sind
      - Weil sich bei jeder Änderung der Hash im Dateinamen ändert – eine neue Version hat eine neue URL
      - Weil Browser HTML-Dateien grundsätzlich nicht cachen
      - Weil nginx JavaScript automatisch komprimiert
    answer: 1
    explanation: >
      Eine geänderte Datei bekommt einen neuen Namen. Die alte URL zeigt also für immer auf denselben
      Inhalt. `index.html` behält dagegen ihren Namen und verweist auf die jeweils neuen Dateien – sie muss
      immer frisch sein.
  - type: find-bug
    question: "Im server-Block steht `add_header X-Content-Type-Options \"nosniff\";`. Bei Bildern fehlt dieser Header plötzlich. Welche Zeile verursacht das?"
    language: nginx
    code: |
      server {
          root /srv/shop/public;
          add_header X-Content-Type-Options "nosniff";
          location /bilder/ {
              add_header Cache-Control "public, max-age=2592000";
          }
      }
    bug_line: 5
    explanation: >
      add_header wird nur vererbt, wenn die innere Ebene **kein eigenes** add_header hat. Sobald die
      location eines setzt, gelten die äußeren nicht mehr. Lösung: den Sicherheits-Header in der location
      wiederholen (z. B. über ein include) oder `expires` statt add_header nutzen.
  - type: match
    question: Welche Einstellung passt zu welcher Datei?
    pairs:
      - { left: "assets/app.4f2a9c.js", right: "Cache-Control: public, max-age=31536000, immutable" }
      - { left: "index.html", right: "Cache-Control: no-cache" }
      - { left: "favicon.ico", right: "expires 7d" }
      - { left: "Antwort mit Kontodaten", right: "Cache-Control: no-store" }
    explanation: >
      `no-cache` heißt „vor jeder Nutzung beim Server nachfragen“ (meist mit 304-Antwort), `no-store` heißt
      „gar nicht speichern“.
  - type: multiple
    question: Welche Aussagen zu gzip in nginx stimmen?
    options:
      - "`text/html` wird bei `gzip on;` immer komprimiert"
      - CSS und JavaScript musst du über `gzip_types` ergänzen
      - JPEG- und PNG-Bilder sollte man zusätzlich gzippen
      - "`gzip_vary on;` sendet `Vary: Accept-Encoding` für Caches dazwischen"
    answers: [0, 1, 3]
    explanation: >
      Bilder wie JPEG und PNG sind schon komprimiert – gzip kostet dort nur CPU und spart nichts.
tasks:
  - id: cache-strategie
    type: dragdrop
    title: Die richtige Cache-Strategie
    description: Ordne jede Datei oder Antwort der passenden Cache-Strategie zu.
    targets:
      - { id: lang, label: "1 Jahr, immutable" }
      - { id: kurz, label: "einige Tage" }
      - { id: nachfragen, label: "no-cache (immer nachfragen)" }
      - { id: nie, label: "no-store (nie speichern)" }
    items:
      - { label: assets/index-4f2a9c.js, target: lang }
      - { label: assets/style-91be0d.css, target: lang }
      - { label: index.html einer SPA, target: nachfragen }
      - { label: robots.txt, target: kurz }
      - { label: logo.png ohne Hash im Namen, target: kurz }
      - { label: /api/konto mit persönlichen Daten, target: nie }
  - id: cache-und-gzip
    type: terminal
    title: Cache-Header und gzip einbauen
    description: |
      Im Ordner `cache-und-gzip` liegen `nginx.conf` (http-Block) und `conf.d/app.conf` einer Vite-App.

      1. In `nginx.conf` im http-Block: `gzip on;`, `gzip_vary on;` und
         `gzip_types text/css application/javascript application/json image/svg+xml;`
      2. In `conf.d/app.conf`: eine neue `location /assets/` mit `expires 1y;` und
         `add_header Cache-Control "public, immutable";` sowie `try_files $uri =404;`
      3. In `conf.d/app.conf`: eine exakte `location = /index.html` mit
         `add_header Cache-Control "no-cache";`

      Prüfe mit `bash pruefe.sh nginx.conf conf.d/app.conf`. Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: cache-und-gzip
    setup: |
      cat > pruefe.sh <<'PRUEFE'
      #!/usr/bin/env bash
      # Stacklab-Mini-Pruefung fuer nginx-Konfigurationen.
      # Ersetzt NICHT "nginx -t": Es findet nur Klammer- und Semikolonfehler.
      #   bash pruefe.sh datei.conf ...        Syntax pruefen
      #   bash pruefe.sh --baum datei.conf     jede Direktive mit ihrem Kontext zeigen
      modus=pruefen
      if [ "$1" = "--baum" ]; then modus=baum; shift; fi
      [ $# -eq 0 ] && set -- nginx.conf
      status=0
      for datei in "$@"; do
        if [ ! -f "$datei" ]; then echo "FEHLER: $datei gibt es nicht"; status=1; continue; fi
        awk -v modus="$modus" -v q="'" '
          { roh = $0; sub(/#.*/, ""); zeile = $0; sub(/[ \t]+$/, "", zeile)
            ende = substr(zeile, length(zeile), 1)
            if (zeile ~ /[^ \t]/ && index(";{}\"" q, ende) == 0) { print FILENAME ":" NR ": Semikolon fehlt -> " roh; fehler = 1 }
            rest = $0
            while (length(rest) > 0) {
              if (match(rest, /[{};]/) == 0) { puffer = puffer " " rest; break }
              teil = puffer " " substr(rest, 1, RSTART - 1); zeichen = substr(rest, RSTART, 1)
              rest = substr(rest, RSTART + 1); puffer = ""
              gsub(/^[ \t]+|[ \t]+$/, "", teil); gsub(/[ \t]+/, " ", teil)
              if (zeichen == "{") { stapel[++tiefe] = teil }
              else if (zeichen == "}") { tiefe--; if (tiefe < 0) { print FILENAME ":" NR ": } ohne passende {"; fehler = 1; tiefe = 0 } }
              else if (teil != "" && modus == "baum") { pfad = ""; for (i = 1; i <= tiefe; i++) pfad = pfad stapel[i] " > "; print pfad teil }
            } }
          END { if (tiefe > 0) { print FILENAME ": " tiefe " Block/Bloecke nicht mit } geschlossen"; fehler = 1 }
                if (modus == "pruefen" && !fehler) print FILENAME ": Syntax sieht gut aus (Stacklab-Mini-Pruefung)"
                exit fehler }' "$datei" || status=1
      done
      exit $status
      PRUEFE
      mkdir -p conf.d
      cat > nginx.conf <<'EOF'
      worker_processes auto;
      events {
          worker_connections 1024;
      }
      http {
          include mime.types;
          sendfile on;
          include conf.d/*.conf;
      }
      EOF
      cat > conf.d/app.conf <<'EOF'
      server {
          listen 80;
          server_name app.example.com;
          root /srv/app/dist;
          index index.html;

          location / {
              try_files $uri $uri/ /index.html;
          }
      }
      EOF
    checks:
      - type: command
        run: bash pruefe.sh nginx.conf conf.d/app.conf
        message: Eine der Dateien hat noch Syntaxfehler. Führe bash pruefe.sh nginx.conf conf.d/app.conf aus.
      - type: command
        run: bash pruefe.sh --baum nginx.conf | grep -Eq '^http > gzip on$' && bash pruefe.sh --baum nginx.conf | grep -Eq '^http > gzip_vary on$'
        message: Im http-Block fehlen gzip on; oder gzip_vary on;
      - type: command
        run: l=$(bash pruefe.sh --baum nginx.conf | grep -E '^http > gzip_types '); for t in text/css application/javascript application/json 'image/svg\+xml'; do echo "$l" | grep -Eq " $t( |$)" || exit 1; done
        message: gzip_types braucht text/css, application/javascript, application/json und image/svg+xml.
      - type: command
        run: bash pruefe.sh --baum conf.d/app.conf | grep -Eq '^server > location /assets/ > expires 1y$'
        message: In location /assets/ fehlt expires 1y;
      - type: command
        run: bash pruefe.sh --baum conf.d/app.conf | grep -Eq '^server > location /assets/ > add_header Cache-Control "public, immutable"$'
        message: 'In location /assets/ fehlt add_header Cache-Control "public, immutable";'
      - type: command
        run: bash pruefe.sh --baum conf.d/app.conf | grep -Eq '^server > location /assets/ > try_files \$uri =404$'
        message: "In location /assets/ fehlt try_files $uri =404; – sonst bekommen fehlende Assets index.html."
      - type: command
        run: bash pruefe.sh --baum conf.d/app.conf | grep -Eq '^server > location = /index\.html > add_header Cache-Control "no-cache"$'
        message: 'Es fehlt location = /index.html mit add_header Cache-Control "no-cache";'
    hints:
      - Die gzip-Zeilen gehören in den http-Block von nginx.conf, die locations in den server-Block von conf.d/app.conf.
      - "Alle MIME-Typen stehen in **einer** Zeile: `gzip_types text/css application/javascript …;`"
      - "Exakte location: `location = /index.html { add_header Cache-Control \"no-cache\"; }`"
    solution: |
      ```nginx title="nginx.conf"
      worker_processes auto;
      events {
          worker_connections 1024;
      }
      http {
          include mime.types;
          sendfile on;
          gzip on;
          gzip_vary on;
          gzip_types text/css application/javascript application/json image/svg+xml;
          include conf.d/*.conf;
      }
      ```
      ```nginx title="conf.d/app.conf"
      server {
          listen 80;
          server_name app.example.com;
          root /srv/app/dist;
          index index.html;

          location / {
              try_files $uri $uri/ /index.html;
          }

          location /assets/ {
              expires 1y;
              add_header Cache-Control "public, immutable";
              try_files $uri =404;
          }

          location = /index.html {
              add_header Cache-Control "no-cache";
          }
      }
      ```
---

Jedes Mal, wenn jemand deine Seite öffnet, lädt der Browser HTML, CSS, JavaScript und Bilder. Lädt er
bei jedem Klick alles neu, ist die Seite langsam und dein Server hat unnötig viel zu tun. Mit den
richtigen Headern sagst du dem Browser, was er behalten darf – und mit Kompression wird der Rest
kleiner.

## Wie Browser-Caching funktioniert

Ein [[cache|Cache]] ist ein Zwischenspeicher. Der Browser legt Antworten ab und nutzt sie beim
nächsten Mal wieder. Wie lange, bestimmt der Server über den Header [[cache-control|Cache-Control]].

| Header-Wert | Bedeutung |
|---|---|
| `max-age=31536000` | ein Jahr ohne Nachfrage verwenden |
| `immutable` | die Datei ändert sich nie – auch beim Neuladen nicht nachfragen |
| `no-cache` | speichern, aber vor jeder Nutzung beim Server nachfragen |
| `no-store` | gar nicht speichern |
| `public` / `private` | darf auch ein Proxy dazwischen cachen / nur der Browser |

Beim Nachfragen hilft das [[etag|ETag]], das nginx für statische Dateien automatisch setzt. Ist die
Datei unverändert, antwortet nginx nur mit `304 Not Modified` – ohne Inhalt.

## expires und add_header

nginx bietet zwei Werkzeuge:

```nginx title="Zwei Wege zum Cache-Header"
location /bilder/ {
    expires 30d;                      # setzt Expires und Cache-Control: max-age=2592000
}

location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

[[expires-direktive|expires]] rechnet die Zeit für dich aus und setzt `Expires` und
`Cache-Control: max-age`. Mit `add_header` setzt du beliebige Header selbst. Kombinierst du beide, schickt
nginx zwei `Cache-Control`-Zeilen – Browser fassen sie zusammen.

> [!FEHLER]
> **Verschwundene Header.** `add_header` wird nur nach innen vererbt, wenn die innere Ebene **kein
> eigenes** `add_header` hat. Setzt eine location einen Cache-Header, fallen alle Sicherheits-Header aus
> dem server-Block für diese location weg. Wiederhole sie dort (oft per `include security-headers.conf;`).

## Dateien mit Hash im Namen

Build-Werkzeuge wie [[vite|Vite]] hängen an jede Datei einen [[content-hash|Content-Hash]]:
`index-4f2a9c.js`. Ändert sich der Code, ändert sich der Name. Diese Technik heißt
[[cache-busting|Cache-Busting]].

| Datei | Strategie | Grund |
|---|---|---|
| `assets/index-4f2a9c.js` | 1 Jahr, `immutable` | neue Version = neue URL |
| `index.html` | `no-cache` | verweist auf die aktuellen Dateinamen |
| `logo.png` ohne Hash | einige Tage | Kompromiss: Änderung kommt verzögert an |

> [!MERKSATZ]
> Was einen Hash im Namen hat, darf ewig gecacht werden. Was keinen hat – vor allem `index.html` –
> darf es nicht.

> [!PRAXIS]
> Nach einem Deployment melden Nutzer oft „Ich sehe noch die alte Version“. Fast immer wurde
> `index.html` zu lange gecacht. Mit `no-cache` darauf ist das Problem verschwunden.

## Kompression mit gzip

Textdateien lassen sich stark verkleinern – HTML, CSS und JavaScript oft auf ein Viertel. Der Browser
sagt mit `Accept-Encoding: gzip, br`, was er kann. nginx komprimiert dann mit [[gzip]].

```nginx title="im http-Block"
gzip on;
gzip_vary on;
gzip_min_length 1000;
gzip_types text/css application/javascript application/json image/svg+xml;
```

| Direktive | Wirkung |
|---|---|
| `gzip on;` | Kompression einschalten (Standard: aus) |
| `gzip_types` | weitere MIME-Typen – `text/html` ist immer dabei |
| `gzip_vary on;` | sendet `Vary: Accept-Encoding`, damit Caches beide Varianten trennen |
| `gzip_min_length` | sehr kleine Antworten nicht komprimieren |

Bilder wie JPEG, PNG und WebP sind bereits komprimiert – lass sie aus `gzip_types` heraus. Wer schon
beim Build `.gz`-Dateien erzeugt, schaltet `gzip_static on;` ein. Das modernere
[[brotli|Brotli]] braucht in nginx ein Zusatzmodul.

## Header mit curl prüfen

Ob deine Einstellungen wirken, siehst du nicht im Browserfenster, sondern in den Antwort-Headern.
Am schnellsten geht das mit [[curl]]:

```bash title="Cache-Header und Kompression prüfen"
curl -sI https://app.example.com/assets/index-4f2a9c.js
curl -sI -H "Accept-Encoding: gzip" https://app.example.com/assets/index-4f2a9c.js
curl -sI https://app.example.com/
```

```text title="Antwort für die JS-Datei mit gzip"
HTTP/2 200
content-type: application/javascript
expires: Sun, 10 Oct 2027 09:00:00 GMT
cache-control: max-age=31536000
cache-control: public, immutable
content-encoding: gzip
vary: Accept-Encoding
```

| Header | Was er dir verrät |
|---|---|
| `cache-control` | ob `expires`/`add_header` greifen |
| `content-encoding: gzip` | ob gzip aktiv ist und der Typ in `gzip_types` steht |
| `vary` | ob `gzip_vary on;` gesetzt ist |
| `etag`, `last-modified` | Grundlage für `304 Not Modified` |

Im Browser findest du dieselben Angaben in den Entwicklertools im [[netzwerk-tab|Netzwerk-Tab]]. Fehlt
`content-encoding`, obwohl gzip an ist, ist die Antwort meist kleiner als `gzip_min_length` oder ihr
MIME-Typ fehlt in `gzip_types`.

## Zusammenfassung

- `Cache-Control` steuert, wie lange der Browser eine Antwort wiederverwendet.
- `expires 30d;` rechnet die Zeit aus, `add_header` setzt beliebige Header.
- `add_header` wird nicht vererbt, sobald eine innere Ebene ein eigenes hat.
- Dateien mit Hash im Namen: 1 Jahr und `immutable`; `index.html`: `no-cache`.
- `gzip on;` plus `gzip_types` für CSS, JS, JSON und SVG; Bilder nicht gzippen.
