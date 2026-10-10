---
title: PHP über PHP-FPM anbinden
summary: Wie nginx PHP-Anfragen per FastCGI an PHP-FPM übergibt, was SCRIPT_FILENAME und fastcgi_params bedeuten und warum in einer Laravel-Konfiguration ausschließlich der Front-Controller public/index.php ausgeführt werden darf.
duration: 25
sources:
  - title: nginx – ngx_http_fastcgi_module
    url: https://nginx.org/en/docs/http/ngx_http_fastcgi_module.html
  - title: PHP-Handbuch – FastCGI Process Manager (FPM)
    url: https://www.php.net/manual/de/install.fpm.php
  - title: Laravel 13 – Deployment, Nginx
    url: https://laravel.com/docs/13.x/deployment#nginx
  - title: OWASP – Unrestricted File Upload
    url: https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload
quiz:
  - type: single
    question: Wer führt in einem nginx-Setup den PHP-Code tatsächlich aus?
    options:
      - nginx selbst
      - PHP-FPM, an das nginx die Anfrage per FastCGI übergibt
      - Der Browser
      - Composer
    answer: 1
    explanation: >
      nginx kann kein PHP. Er schickt die Anfrage samt Dateipfad über das FastCGI-Protokoll an PHP-FPM.
      Ein Worker von PHP-FPM führt das Skript aus und gibt die Ausgabe zurück.
  - type: multiple
    question: Ein Angreifer lädt über ein Profilbild-Formular die Datei `avatar.php` nach `public/uploads/` hoch. Welche Konfigurationen schützen davor, dass sie ausgeführt wird?
    options:
      - "`location ~ ^/index\\.php(/|$) { fastcgi_pass …; }` plus `location ~ \\.php$ { return 404; }`"
      - "`location ~ \\.php$ { fastcgi_pass …; }`"
      - Uploads außerhalb von `public/` speichern (z. B. in `storage/`)
      - "`gzip on;`"
    answers: [0, 2]
    explanation: >
      Die allgemeine Regel `~ \.php$` mit fastcgi_pass führt **jede** PHP-Datei aus – auch hochgeladene.
      Sicher ist: nur `index.php` ausführen und Uploads gar nicht erst öffentlich ablegen.
  - type: cloze
    text: "Der FastCGI-Parameter ___ sagt PHP-FPM, welche Datei ausgeführt werden soll. In Laravel-Konfigurationen setzt man ihn auf `$realpath_root$fastcgi_script_name`."
    blanks:
      - [SCRIPT_FILENAME]
    explanation: Ohne SCRIPT_FILENAME antwortet PHP-FPM mit „Primary script unknown“ und nginx zeigt 404 oder eine leere Seite.
  - type: find-bug
    question: Welche Zeile macht diese Laravel-Konfiguration unsicher?
    language: nginx
    code: |
      server {
          root /srv/shop/public;
          location / {
              try_files $uri $uri/ /index.php?$query_string;
          }
          location ~ \.php$ {
              fastcgi_pass unix:/run/php/php8.5-fpm.sock;
              fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
              include fastcgi_params;
          }
      }
    bug_line: 6
    explanation: >
      `~ \.php$` übergibt jede beliebige PHP-Datei unter `public/` an PHP-FPM. Richtig ist
      `location ~ ^/index\.php(/|$)` und für alle anderen PHP-Pfade `return 404;`.
tasks:
  - id: laravel-konfig
    type: terminal
    title: Eine sichere Laravel-Konfiguration
    description: |
      Im Ordner `laravel-konfig` liegt `shop.conf` mit einem halb fertigen server-Block für eine
      Laravel-App. PHP-FPM lauscht auf dem Socket `unix:/run/php/php8.5-fpm.sock`. Ergänze:

      1. `root /srv/shop/public;` und `index index.php;`
      2. `location /` mit `try_files $uri $uri/ /index.php?$query_string;`
      3. `location ~ ^/index\.php(/|$)` mit `fastcgi_pass unix:/run/php/php8.5-fpm.sock;`,
         `fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;` und `include fastcgi_params;`
      4. `location ~ \.php$` mit `return 404;` – alle anderen PHP-Dateien werden nie ausgeführt.
      5. `location ~ /\.(?!well-known)` mit `deny all;` – versteckte Dateien wie `.env` bleiben geheim.

      Prüfe mit `bash pruefe.sh shop.conf`. Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: laravel-konfig
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
      cat > shop.conf <<'EOF'
      server {
          listen 80;
          server_name shop.example.com;
          charset utf-8;

      }
      EOF
    checks:
      - type: command
        run: bash pruefe.sh shop.conf
        message: shop.conf hat noch Syntaxfehler. Führe bash pruefe.sh shop.conf aus.
      - type: command
        run: bash pruefe.sh --baum shop.conf | grep -Eq '^server > root /srv/shop/public/?$'
        message: Im server-Block fehlt root /srv/shop/public; – der root zeigt immer auf public, nie auf den Projektordner.
      - type: command
        run: bash pruefe.sh --baum shop.conf | grep -Eq '^server > location / > try_files \$uri \$uri/ /index\.php\?\$query_string$'
        message: "location / braucht try_files $uri $uri/ /index.php?$query_string;"
      - type: command
        run: bash pruefe.sh --baum shop.conf | grep -Fq 'server > location ~ ^/index\.php(/|$) > fastcgi_pass unix:/run/php/php8.5-fpm.sock'
        message: "Es fehlt location ~ ^/index\\.php(/|$) mit fastcgi_pass unix:/run/php/php8.5-fpm.sock;"
      - type: command
        run: bash pruefe.sh --baum shop.conf | grep -Fq 'server > location ~ ^/index\.php(/|$) > fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name' && bash pruefe.sh --baum shop.conf | grep -Fq 'server > location ~ ^/index\.php(/|$) > include fastcgi_params'
        message: "In der index.php-location fehlen fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name; oder include fastcgi_params;"
      - type: command
        run: bash pruefe.sh --baum shop.conf | grep -Fq 'server > location ~ \.php$ > return 404'
        message: "Es fehlt location ~ \\.php$ mit return 404; – sonst sind andere PHP-Dateien erreichbar."
      - type: command
        run: test "$(grep -c 'fastcgi_pass' shop.conf)" = 1
        message: fastcgi_pass darf nur ein einziges Mal vorkommen – in der index.php-location.
      - type: command
        run: bash pruefe.sh --baum shop.conf | grep -Fq 'server > location ~ /\.(?!well-known) > deny all'
        message: "Es fehlt location ~ /\\.(?!well-known) mit deny all;"
    hints:
      - Die drei Regex-locations stehen nebeneinander im server-Block. Die index.php-location muss **vor** der allgemeinen `\.php$`-location stehen – bei Regex gewinnt die erste passende.
      - "Achte beim Abtippen auf jedes Zeichen: `location ~ ^/index\\.php(/|$) {`"
      - "Am sichersten schreibst du die Datei mit `nano shop.conf` – in einem Heredoc ohne `<<'EOF'` würde die Shell `$uri` und Co. ersetzen."
    solution: |
      ```nginx title="shop.conf"
      server {
          listen 80;
          server_name shop.example.com;
          charset utf-8;
          root /srv/shop/public;
          index index.php;

          location / {
              try_files $uri $uri/ /index.php?$query_string;
          }

          location ~ ^/index\.php(/|$) {
              fastcgi_pass unix:/run/php/php8.5-fpm.sock;
              fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
              include fastcgi_params;
          }

          location ~ \.php$ {
              return 404;
          }

          location ~ /\.(?!well-known) {
              deny all;
          }
      }
      ```
  - id: angriff-durchspielen
    type: steps
    title: Ein Upload-Angriff, Schritt für Schritt
    description: Ein Shop erlaubt Nutzern, ein Profilbild hochzuladen. Die Bilder landen in `public/uploads/`. Spiele durch, was mit zwei verschiedenen Konfigurationen passiert.
    steps:
      - situation: Ein Angreifer lädt statt eines Bildes die Datei `bild.php` hoch. Das Formular prüft nur die Dateigröße.
        question: Wo liegt die Datei jetzt?
        options:
          - In der Datenbank
          - Unter public/uploads/bild.php – erreichbar als /uploads/bild.php
          - Nirgends, PHP-Dateien kann man nicht hochladen
        answer: 1
        explanation: Alles unter `public/` ist für nginx eine normale Datei und über eine URL erreichbar.
      - situation: Der Server nutzt `location ~ \.php$ { fastcgi_pass …; }`. Der Angreifer ruft `/uploads/bild.php?cmd=ls` auf.
        question: Was passiert?
        options:
          - nginx liefert die Datei als Text aus
          - PHP-FPM führt den Code des Angreifers aus – er kann Befehle auf dem Server starten
          - nginx antwortet mit 404
        answer: 1
        explanation: Die Regex passt auf jede `.php`-Datei. Damit hat der Angreifer eine Webshell und volle Kontrolle über die App.
      - situation: Jetzt nutzt der Server die Laravel-Variante mit `location ~ ^/index\.php(/|$)` und `location ~ \.php$ { return 404; }`.
        question: Was passiert beim Aufruf von `/uploads/bild.php?cmd=ls`?
        options:
          - PHP-FPM führt den Code aus
          - nginx antwortet mit 404 – die Datei wird nie ausgeführt
          - Laravel führt die Datei aus
        answer: 1
        explanation: Nur `/index.php` erreicht PHP-FPM. Alle anderen PHP-Pfade bekommen 404. Den Upload solltest du trotzdem prüfen und außerhalb von public/ speichern.
---

Du hast eine Laravel-App gebaut und willst sie auf einem Server mit nginx veröffentlichen. Die
Startseite zeigt aber nur den Quelltext von `index.php` – oder der Browser bietet die Datei zum
Download an. nginx kann eben kein PHP. Er braucht einen Partner.

## PHP-FPM und FastCGI

[[php-fpm|PHP-FPM]] ist ein eigenständiges Programm, das einen Pool von PHP-Prozessen bereithält. nginx
schickt ihm Anfragen über das Protokoll [[fastcgi|FastCGI]] – eine schlanke Sprache zwischen Webserver
und Anwendung, ähnlich wie HTTP.

| Schritt | Wer | Was |
|---|---|---|
| 1 | Browser → nginx | `GET /produkte?seite=2` |
| 2 | nginx | `try_files` findet keine Datei → intern `/index.php?seite=2` |
| 3 | nginx → PHP-FPM | FastCGI-Anfrage mit Pfad zu `index.php` und allen Parametern |
| 4 | PHP-FPM | führt `index.php` aus, Laravel erzeugt die Seite |
| 5 | PHP-FPM → nginx → Browser | fertiges HTML |

PHP-FPM lauscht entweder auf einem [[unix-socket|Unix-Socket]] wie `/run/php/php8.5-fpm.sock` oder auf
einem TCP-Port wie `127.0.0.1:9000`. In Docker-Setups ist es oft `php:9000`, also ein anderer
Container.

## fastcgi_pass und SCRIPT_FILENAME

```nginx title="Die Übergabe an PHP-FPM"
location ~ ^/index\.php(/|$) {
    fastcgi_pass unix:/run/php/php8.5-fpm.sock;
    fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
    include fastcgi_params;
}
```

| Zeile | Bedeutung |
|---|---|
| `fastcgi_pass` | wohin die Anfrage geht: Socket oder Host und Port |
| `SCRIPT_FILENAME` | welche Datei PHP-FPM ausführen soll |
| `$realpath_root` | der `root` mit aufgelösten [[symlink|Symlinks]] |
| `$fastcgi_script_name` | der Skriptpfad aus der URL, hier `/index.php` |
| `include fastcgi_params` | Standard-Parameter wie `QUERY_STRING`, `REQUEST_METHOD`, `HTTP_HOST` |

`$realpath_root` statt `$document_root` ist wichtig bei Deployments, die einen Symlink `current` auf
den neuen Release-Ordner umbiegen. Sonst führt PHP-FPM wegen seines [[opcache|OPcache]] eventuell noch
alten Code aus.

> [!FEHLER]
> **„File not found.“ oder „Primary script unknown“** im Error-Log heißt: PHP-FPM findet die Datei unter
> `SCRIPT_FILENAME` nicht. Meist fehlt die fastcgi_param-Zeile, der `root` ist falsch oder PHP-FPM läuft
> in einem Container, in dem der Pfad anders heißt.

## Der Front-Controller

Laravel hat genau einen Einstiegspunkt: `public/index.php`, den [[front-controller|Front-Controller]].
Jede Anfrage – `/produkte`, `/login`, `/api/orders` – läuft durch ihn. Den Rest erledigt Laravels Router.

```nginx title="Alles, was keine Datei ist, an index.php"
location / {
    try_files $uri $uri/ /index.php?$query_string;
}
```

Bilder und CSS aus `public/` liefert nginx direkt aus. Für alles andere springt `try_files` intern auf
`/index.php` und hängt den [[query-string|Query-String]] an.

> [!MERKSATZ]
> Der `root` zeigt immer auf `public/`, nie auf den Projektordner. Sonst wären `.env`, `vendor/` und
> der ganze Quelltext per URL abrufbar.

## Warum nur index.php ausgeführt werden darf

Viele alte Anleitungen schreiben `location ~ \.php$ { fastcgi_pass …; }`. Das führt **jede** PHP-Datei
aus, die irgendwo unter `public/` liegt. Gelingt einem Angreifer ein Upload von `bild.php`, hat er eine
[[webshell|Webshell]] – und damit Zugriff auf Datenbank, `.env` und Server.

```nginx title="Sicher: nur der Front-Controller"
location ~ ^/index\.php(/|$) {
    fastcgi_pass unix:/run/php/php8.5-fpm.sock;
    fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
    include fastcgi_params;
    fastcgi_hide_header X-Powered-By;
}

location ~ \.php$ {
    return 404;
}

location ~ /\.(?!well-known) {
    deny all;
}
```

Die Reihenfolge ist wichtig: Beide sind Regex – die erste passende gewinnt. Die letzte location sperrt
versteckte Dateien wie `.env` oder `.git`, lässt aber `/.well-known/` für Let's Encrypt offen.

> [!PRAXIS]
> Genau diese Struktur empfiehlt die Laravel-Dokumentation. Prüfe sie bei jedem neuen Server – der
> Unterschied zwischen `\.php$` und `^/index\.php` ist eine der folgenreichsten Zeilen der
> Konfiguration.

## PHP-FPM in einem eigenen Container

In [[docker|Docker]]-Setups laufen nginx und PHP-FPM meist in getrennten [[container|Containern]].
nginx erreicht PHP-FPM dann über den Dienstnamen aus der Compose-Datei:

```nginx title="nginx-Container spricht mit dem Container php"
location ~ ^/index\.php(/|$) {
    fastcgi_pass php:9000;
    fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
    include fastcgi_params;
}
```

Dabei gibt es eine Falle: `SCRIPT_FILENAME` ist ein **Pfad**, den PHP-FPM in **seinem** Container
öffnet. nginx baut ihn aber aus **seinem** `root`. Beide Container müssen den Code deshalb unter
demselben Pfad sehen, etwa beide unter `/var/www/html`.

| nginx-Container | PHP-Container | Ergebnis |
|---|---|---|
| `/var/www/html/public` | `/var/www/html/public` | funktioniert |
| `/usr/share/nginx/html` | `/var/www/html/public` | „Primary script unknown“, 404 |

> [!TIPP]
> Statische Dateien liefert nginx aus seinem eigenen Container. Liegt `public/` dort gar nicht, gehen
> CSS und Bilder verloren, obwohl die PHP-Seiten funktionieren. Den Docker-Teil vertieft der Kurs
> Docker.

## Zusammenfassung

- nginx führt kein PHP aus, sondern übergibt per FastCGI an PHP-FPM (Socket oder Port).
- `SCRIPT_FILENAME $realpath_root$fastcgi_script_name` sagt PHP-FPM, welche Datei es ausführen soll.
- `include fastcgi_params` liefert Query-String, Methode und Header mit.
- `try_files $uri $uri/ /index.php?$query_string;` schickt alles ohne Datei an den Front-Controller.
- Nur `^/index\.php` an PHP-FPM, alle anderen `.php` mit `return 404;`, versteckte Dateien sperren.
