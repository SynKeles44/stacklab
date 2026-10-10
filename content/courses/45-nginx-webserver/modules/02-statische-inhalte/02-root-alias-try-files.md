---
title: Dateien ausliefern mit root, alias und try_files
summary: Wie nginx aus einer URL einen Dateipfad baut, worin sich root und alias unterscheiden, wie try_files nach Dateien sucht und wie du damit eine Single-Page-App samt Fallback auf index.html auslieferst.
duration: 25
sources:
  - title: nginx – root
    url: https://nginx.org/en/docs/http/ngx_http_core_module.html#root
  - title: nginx – alias
    url: https://nginx.org/en/docs/http/ngx_http_core_module.html#alias
  - title: nginx – try_files
    url: https://nginx.org/en/docs/http/ngx_http_core_module.html#try_files
  - title: nginx – index
    url: https://nginx.org/en/docs/http/ngx_http_index_module.html
  - title: nginx – error_page
    url: https://nginx.org/en/docs/http/ngx_http_core_module.html#error_page
  - title: Vite – Deploying a Static Site
    url: https://vite.dev/guide/static-deploy
quiz:
  - type: single
    question: "`location /bilder/ { root /srv/data; }` – welche Datei liest nginx für `/bilder/hund.jpg`?"
    options:
      - "`/srv/data/hund.jpg`"
      - "`/srv/data/bilder/hund.jpg`"
      - "`/srv/bilder/hund.jpg`"
      - "`/bilder/hund.jpg`"
    answer: 1
    explanation: root hängt den **kompletten** Pfad der URL an den Ordner an – inklusive `/bilder/`.
  - type: single
    question: "`location /bilder/ { alias /srv/fotos/; }` – welche Datei liest nginx für `/bilder/hund.jpg`?"
    options:
      - "`/srv/fotos/bilder/hund.jpg`"
      - "`/srv/fotos/hund.jpg`"
      - "`/srv/fotoshund.jpg`"
      - "`/bilder/hund.jpg`"
    answer: 1
    explanation: alias **ersetzt** den passenden Teil `/bilder/` durch `/srv/fotos/`.
  - type: find-bug
    question: Die React-App funktioniert auf der Startseite, aber ein Neuladen auf `/profil` liefert 404. Welche Zeile ist schuld?
    language: nginx
    code: |
      server {
          listen 80;
          server_name app.example.com;
          root /srv/app/dist;
          location / {
              try_files $uri $uri/ =404;
          }
      }
    bug_line: 6
    explanation: >
      Für eine SPA muss der letzte Parameter `/index.html` sein, damit unbekannte Pfade an die App gehen
      und der Client-Router sie anzeigt: `try_files $uri $uri/ /index.html;`.
  - type: cloze
    text: "`try_files $uri $uri/ /index.html;` prüft zuerst eine passende ___, dann einen passenden ___ und springt sonst intern auf `/index.html`."
    blanks:
      - [Datei]
      - [Ordner, Verzeichnis]
    explanation: "Der Schrägstrich hinter `$uri/` bedeutet: Prüfe, ob es ein Verzeichnis ist."
tasks:
  - id: root-und-alias
    type: code
    language: js
    title: Bau nach, wie nginx Pfade auflöst
    description: |
      Schreibe zwei Funktionen, die zeigen, welche Datei nginx liest:

      - `mitRoot(root, uri)` – Verhalten von `root`: Der komplette URI wird an `root` angehängt.
        Endet `root` auf `/`, darf kein doppelter Schrägstrich entstehen.
      - `mitAlias(prefix, alias, uri)` – Verhalten von `alias` in `location <prefix>`: Der passende
        Anfang `prefix` wird durch `alias` ersetzt. Beginnt `uri` nicht mit `prefix`, gib `null` zurück.

      Beispiele: `mitRoot("/srv/www", "/img/a.png")` → `"/srv/www/img/a.png"`,
      `mitAlias("/img/", "/data/bilder/", "/img/a.png")` → `"/data/bilder/a.png"`.
    starter: |
      function mitRoot(root, uri) {
        // root + kompletter URI
      }

      function mitAlias(prefix, alias, uri) {
        // prefix durch alias ersetzen
      }
    tests:
      - name: root hängt den ganzen Pfad an
        code: assertEqual(mitRoot("/srv/www", "/img/a.png"), "/srv/www/img/a.png")
      - name: root mit Schrägstrich am Ende
        code: assertEqual(mitRoot("/srv/www/", "/index.html"), "/srv/www/index.html")
      - name: alias ersetzt das Präfix
        code: assertEqual(mitAlias("/img/", "/data/bilder/", "/img/a.png"), "/data/bilder/a.png")
      - name: alias ohne Schrägstrich am Ende erzeugt den typischen Fehler
        code: assertEqual(mitAlias("/img/", "/data/bilder", "/img/a.png"), "/data/bildera.png")
      - name: passt das Präfix nicht, gibt es null
        code: assertEqual(mitAlias("/img/", "/data/bilder/", "/css/app.css"), null)
    hints:
      - "Für root: Entferne einen abschließenden `/` von `root` und hänge dann `uri` an."
      - "Für alias: `uri.startsWith(prefix)` prüft den Anfang, `uri.slice(prefix.length)` liefert den Rest."
    solution: |
      ```js
      function mitRoot(root, uri) {
        return root.replace(/\/$/, "") + uri
      }

      function mitAlias(prefix, alias, uri) {
        if (!uri.startsWith(prefix)) return null
        return alias + uri.slice(prefix.length)
      }
      ```
      Der vierte Test zeigt, warum `alias` und location-Präfix beide auf `/` enden sollten.
  - id: spa-konfig
    type: terminal
    title: Eine Single-Page-App ausliefern
    description: |
      Im Ordner `spa-ausliefern` liegt der Build einer React-App unter `dist/` und eine fast leere
      `app.conf`. Ergänze den server-Block:

      1. `root` zeigt auf `/srv/app/dist`, `index index.html;`
      2. `location /` mit `try_files $uri $uri/ /index.html;` – der SPA-Fallback.
      3. `location /downloads/` liefert Dateien aus `/srv/files/` per `alias` (beide mit `/` am Ende).
      4. Eine eigene Fehlerseite: `error_page 404 /404.html;`

      Prüfe mit `bash pruefe.sh app.conf` und `bash pruefe.sh --baum app.conf`. Klicke zuerst auf
      **Aufgabe vorbereiten**.
    workdir: spa-ausliefern
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
      mkdir -p dist/assets
      printf '<!doctype html>\n<div id="root"></div>\n<script type="module" src="/assets/index-4f2a9c.js"></script>\n' > dist/index.html
      printf 'console.log("app")\n' > dist/assets/index-4f2a9c.js
      printf '<h1>Seite nicht gefunden</h1>\n' > dist/404.html
      cat > app.conf <<'EOF'
      server {
          listen 80;
          server_name app.example.com;

          # Hier ergänzen
      }
      EOF
    checks:
      - type: command
        run: bash pruefe.sh app.conf
        message: app.conf hat noch Syntaxfehler. Führe bash pruefe.sh app.conf aus.
      - type: command
        run: bash pruefe.sh --baum app.conf | grep -Eq '^server > root /srv/app/dist/?$'
        message: Im server-Block fehlt root /srv/app/dist;
      - type: command
        run: bash pruefe.sh --baum app.conf | grep -Eq '^server > location / > try_files \$uri \$uri/ /index\.html$'
        message: "location / braucht try_files $uri $uri/ /index.html; – damit landen unbekannte Pfade bei der App."
      - type: command
        run: bash pruefe.sh --baum app.conf | grep -Eq '^server > location /downloads/ > alias /srv/files/$'
        message: "location /downloads/ braucht alias /srv/files/; – mit Schrägstrich am Ende."
      - type: command
        run: bash pruefe.sh --baum app.conf | grep -Eq '^server > error_page 404 /404\.html$'
        message: Im server-Block fehlt error_page 404 /404.html;
      - type: command
        run: "! grep -Eq '^\\s*root\\s' app.conf || test \"$(grep -Ec '^\\s*root\\s' app.conf)\" = 1"
        message: Setze root nur einmal im server-Block – die locations erben es.
    hints:
      - Den `root` schreibst du in den server-Block, nicht in jede location.
      - "Ein location-Block sieht so aus: `location / { try_files … ; }`."
      - "Bei alias müssen location und alias beide auf `/` enden: `location /downloads/ { alias /srv/files/; }`."
    solution: |
      ```nginx title="app.conf"
      server {
          listen 80;
          server_name app.example.com;
          root /srv/app/dist;
          index index.html;
          error_page 404 /404.html;

          location / {
              try_files $uri $uri/ /index.html;
          }

          location /downloads/ {
              alias /srv/files/;
          }
      }
      ```
---

Du hast deine React-App gebaut, der Ordner `dist/` ist fertig. Jetzt soll nginx die Dateien
ausliefern. Die Startseite klappt sofort – aber wer `/profil` neu lädt, sieht plötzlich eine
404-Seite. Um das zu verstehen, musst du wissen, wie nginx aus einer URL einen Dateipfad macht.

## root: Ordner plus Pfad

Die Direktive [[root-direktive|root]] nennt den Ordner, in dem nginx sucht. Den Pfad der URL hängt er
**komplett** hinten an.

```nginx
server {
    root /srv/shop/public;
}
```

| URL-Pfad | gelesene Datei |
|---|---|
| `/` | `/srv/shop/public/` → mit `index` dann `index.html` |
| `/css/app.css` | `/srv/shop/public/css/app.css` |
| `/bilder/logo.png` | `/srv/shop/public/bilder/logo.png` |

Bei Pfaden, die auf `/` enden, sucht die Direktive `index` nach einer Startdatei – Standard ist
`index.html`. Den `root` schreibst du einmal in den server-Block. Alle locations erben ihn.

> [!MERKSATZ]
> root = Ordner + kompletter URL-Pfad. Die Ordnerstruktur auf der Platte spiegelt die URLs.

## Ordner, index und der Schrägstrich am Ende

Fragt jemand einen Ordner an, kommt es auf den Schrägstrich am Ende an:

| Anfrage | Was nginx tut |
|---|---|
| `/hilfe/` | sucht im Ordner `hilfe` nach der Datei aus `index`, z. B. `index.html` |
| `/hilfe` (Ordner existiert) | antwortet mit `301` auf `/hilfe/` – erst dann gelten relative Links richtig |
| `/hilfe/` ohne Index-Datei | `403 Forbidden`, weil Ordnerinhalte nicht gelistet werden |

Die Direktive `index` darf mehrere Namen nennen, nginx nimmt den ersten vorhandenen:

```nginx
index index.html index.htm;
```

Eine Ordnerliste zeigt nginx nur mit `autoindex on;`. Auf echten Websites lässt du das aus, denn
sonst kann jeder sehen, welche Dateien in einem Ordner liegen – auch solche, die nie verlinkt waren.

> [!TIPP]
> Ein unerwartetes `403` bei einem Ordner heißt also oft nur: Es gibt keine Index-Datei. Prüfe das,
> bevor du an den Dateirechten drehst.

## alias: einen Teil ersetzen

Manchmal liegen Dateien woanders als der URL-Pfad vermuten lässt. Dann ersetzt
[[alias-direktive|alias]] den passenden Anfang der location durch einen anderen Ordner.

```nginx
location /downloads/ {
    alias /srv/files/;
}
```

| URL-Pfad | mit `root /srv/files;` | mit `alias /srv/files/;` |
|---|---|---|
| `/downloads/preise.pdf` | `/srv/files/downloads/preise.pdf` | `/srv/files/preise.pdf` |

> [!FEHLER]
> **alias ohne Schrägstrich.** `location /downloads/ { alias /srv/files; }` macht aus
> `/downloads/preise.pdf` den Pfad `/srv/filespreise.pdf` – nginx findet nichts. Noch gefährlicher ist
> `location /downloads { alias /srv/files/; }`: Dann wird `/downloads../geheim` zu
> `/srv/files/../geheim` – eine [[path-traversal|Path-Traversal]]-Lücke. Location und alias enden
> **beide** auf `/` – oder du nimmst einfach `root`, wenn es geht.

## try_files: der Reihe nach suchen

[[try-files|try_files]] probiert mehrere Möglichkeiten in der angegebenen Reihenfolge. Der **letzte**
Parameter ist der Ausweg, wenn nichts passt.

```nginx
location / {
    try_files $uri $uri/ =404;
}
```

| Parameter | Bedeutung |
|---|---|
| `$uri` | gibt es eine Datei mit genau diesem Pfad? |
| `$uri/` | gibt es einen Ordner? (dann greift `index`) |
| `=404` | sonst: Status 404 |
| `/index.html` | sonst: interner Sprung zu dieser URL |
| `@backend` | sonst: interner Sprung in eine benannte location |

Ein interner Sprung ist keine Weiterleitung: Der Browser bekommt nichts davon mit, die Adresszeile
bleibt gleich.

## Der SPA-Fallback

Eine [[spa|Single-Page-App]] hat nur eine echte HTML-Datei: `index.html`. Pfade wie `/profil` gibt es
als Datei gar nicht – der Router im Browser erzeugt die Seite. Klickt man in der App, merkt nginx
nichts. Lädt man `/profil` aber neu, fragt der Browser nginx nach dieser Datei.

```nginx title="Konfiguration für eine React- oder Vite-App"
server {
    listen 80;
    server_name app.example.com;
    root /srv/app/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

So liefert nginx echte Dateien wie `/assets/index-4f2a9c.js` direkt und alles Unbekannte als
`index.html` aus. Das nennt man [[spa-fallback|SPA-Fallback]].

> [!PRAXIS]
> Der Fallback hat eine Nebenwirkung: Auch ein Tippfehler wie `/assets/fehlt.js` bekommt `index.html`
> mit Status 200. Teams geben dem Ordner deshalb eine eigene location:
> `location /assets/ { try_files $uri =404; }`. Dann fallen kaputte Links sofort auf.

## Eigene Fehlerseiten

Mit [[error-page|error_page]] zeigst du statt der nackten nginx-Meldung eine eigene Seite.

```nginx
error_page 404 /404.html;
error_page 500 502 503 504 /50x.html;
```

Die Seiten sind normale Dateien im `root`. Der Statuscode bleibt erhalten – Suchmaschinen sehen
weiterhin 404.

## Zusammenfassung

- `root` hängt den kompletten URL-Pfad an den Ordner; `index` wählt die Startdatei bei Ordnern.
- `alias` ersetzt den passenden Anfang der location – location und alias enden beide auf `/`.
- `try_files` prüft Dateien und Ordner der Reihe nach; der letzte Parameter ist der Ausweg.
- Eine SPA braucht `try_files $uri $uri/ /index.html;`, sonst liefert Neuladen 404.
- `error_page` zeigt eigene Fehlerseiten, ohne den Statuscode zu verändern.
