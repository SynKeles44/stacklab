---
title: Die nginx-Site für Laravel
summary: Ein server-Block, der auf current/public zeigt, PHP sicher an PHP-FPM übergibt und versteckte Dateien schützt.
duration: 20
sources:
  - title: Laravel 13 – Deployment, Nginx
    url: https://laravel.com/docs/13.x/deployment#nginx
  - title: nginx – How nginx processes a request
    url: https://nginx.org/en/docs/http/request_processing.html
  - title: nginx – ngx_http_fastcgi_module
    url: https://nginx.org/en/docs/http/ngx_http_fastcgi_module.html
  - title: nginx – $realpath_root
    url: https://nginx.org/en/docs/http/ngx_http_core_module.html#var_realpath_root
quiz:
  - type: single
    question: Warum zeigt `root` auf `…/current/public` und nicht auf `…/current`?
    options:
      - Weil nginx Ordner namens current nicht lesen kann.
      - Weil sonst `.env`, `storage` und der ganze Quellcode direkt aus dem Internet abrufbar sein könnten.
      - Weil Laravel sonst langsamer ist.
      - Das ist egal.
    answer: 1
    explanation: >
      Nur `public/` enthält Dateien, die öffentlich sein dürfen – den Front-Controller `index.php` und
      Assets. Alles andere, vor allem `.env`, muss außerhalb des Web-Roots liegen.
  - type: find-bug
    question: Welche Zeile führt bei Deploys mit einem current-Symlink zu alten Dateien im PHP-Cache?
    language: nginx
    code: |
      location ~ ^/index\.php(/|$) {
          fastcgi_pass unix:/run/php/php8.5-fpm.sock;
          fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
          include fastcgi_params;
      }
    bug_line: 3
    explanation: >
      `$document_root` enthält den Symlink-Pfad `current/public`. OPcache merkt sich Dateien unter diesem
      Pfad und liefert nach dem Umschalten womöglich alten Code. `$realpath_root` löst den Symlink auf und
      übergibt den echten Release-Pfad.
  - type: multiple
    question: Was gehört in eine sichere nginx-Site für Laravel?
    options:
      - "`try_files $uri $uri/ /index.php?$query_string;`"
      - Ein Block, der Dateien mit Punkt am Anfang (außer .well-known) verbietet
      - "`autoindex on;`, damit man Dateien findet"
      - Nur `index.php` wird an PHP-FPM übergeben, nicht jede beliebige .php-Datei
    answers: [0, 1, 3]
    explanation: autoindex würde Ordnerinhalte auflisten. Die übrigen Punkte sind genau die Bausteine der Laravel-Beispielkonfiguration.
  - type: cloze
    text: "Eine Site aktivierst du mit einem Symlink von sites-available nach sites-___. Danach prüfst du mit `sudo nginx ___` und lädst mit `sudo systemctl reload nginx` neu."
    blanks:
      - [enabled]
      - ["-t"]
    explanation: nginx -t prüft die Syntax aller Dateien. Erst wenn es „syntax is ok“ meldet, lädst du neu.
tasks:
  - id: site-schreiben
    type: terminal
    title: Schreibe die Site-Konfiguration
    description: |
      Lege im Ordner `nginx-site` die Datei `example.com.conf` an. Sie kommt später nach
      `/etc/nginx/sites-available/`. Der server-Block soll:

      1. auf Port 80 für IPv4 und IPv6 lauschen (`listen 80;` und `listen [::]:80;`),
      2. für `example.com` **und** `www.example.com` zuständig sein,
      3. als `root` den Pfad `/var/www/example.com/current/public` haben und `index index.php;` setzen,
      4. alle Anfragen mit `try_files $uri $uri/ /index.php?$query_string;` zum Front-Controller leiten,
      5. **nur** `index.php` per `location ~ ^/index\.php(/|$)` an `unix:/run/php/php8.5-fpm.sock` übergeben –
         mit `fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;` und `include fastcgi_params;`,
      6. Dateien, die mit einem Punkt beginnen (außer `.well-known`), per `deny all;` sperren.

      nginx selbst ist im Übungs-Terminal nicht installiert – Stacklab prüft die Datei inhaltlich.
    workdir: nginx-site
    checks:
      - type: file_exists
        path: example.com.conf
        message: Die Datei example.com.conf fehlt noch.
      - type: command
        run: '[ "$(tr -cd "{" < example.com.conf | wc -c)" -eq "$(tr -cd "}" < example.com.conf | wc -c)" ] && grep -Eq "^\s*server\s*\{" example.com.conf'
        message: Es fehlt ein server-Block, oder die Anzahl von { und } passt nicht zusammen.
      - type: command
        run: grep -Eq '^\s*listen\s+80\s*;' example.com.conf && grep -Eq '^\s*listen\s+\[::\]:80\s*;' example.com.conf
        message: "Es fehlen `listen 80;` und `listen [::]:80;`."
      - type: command
        run: grep -E '^\s*server_name\s' example.com.conf | grep -Eq '[[:space:]]example\.com([[:space:]]|;)' && grep -E '^\s*server_name\s' example.com.conf | grep -Eq '[[:space:]]www\.example\.com([[:space:]]|;)'
        message: server_name muss example.com und www.example.com enthalten.
      - type: command
        run: grep -Eq '^\s*root\s+/var/www/example\.com/current/public/?\s*;' example.com.conf && grep -Eq '^\s*index\s+index\.php\s*;' example.com.conf
        message: "root muss genau auf /var/www/example.com/current/public zeigen, dazu `index index.php;`."
      - type: file_contains
        path: example.com.conf
        pattern: "try_files\\s+\\$uri\\s+\\$uri/\\s+/index\\.php\\?\\$query_string\\s*;"
        message: "Es fehlt `try_files $uri $uri/ /index.php?$query_string;`."
      - type: command
        run: grep -Fq 'location ~ ^/index\.php(/|$)' example.com.conf && grep -Eq 'fastcgi_pass\s+unix:(/var)?/run/php/php8\.5-fpm\.sock\s*;' example.com.conf && grep -Eq '^\s*include\s+fastcgi_params\s*;' example.com.conf
        message: Der PHP-Block braucht `location ~ ^/index\.php(/|$)`, `fastcgi_pass unix:/run/php/php8.5-fpm.sock;` und `include fastcgi_params;`.
      - type: command
        run: grep -Eq 'fastcgi_param\s+SCRIPT_FILENAME\s+\$realpath_root\$fastcgi_script_name\s*;' example.com.conf
        message: "SCRIPT_FILENAME muss `$realpath_root$fastcgi_script_name` sein – nicht $document_root."
      - type: command
        run: grep -Fq 'location ~ /\.(?!well-known).*' example.com.conf && grep -Eq 'deny\s+all\s*;' example.com.conf
        message: "Es fehlt der Block `location ~ /\\.(?!well-known).* { deny all; }`."
      - type: command
        run: grep -Eq '^\s*autoindex\s+on' example.com.conf
        expect_exit: 1
        message: autoindex on listet Ordnerinhalte öffentlich auf – lass die Zeile weg.
    hints:
      - "Starte mit dem Gerüst `server { … }` und schreibe jede Anweisung mit Semikolon am Ende."
      - "Die Laravel-Dokumentation (Deployment → Nginx) enthält ein Beispiel, an dem du dich orientieren kannst."
      - "Der Sperr-Block lautet `location ~ /\\.(?!well-known).* { deny all; }`."
    solution: |
      ```bash
      cd nginx-site
      cat > example.com.conf <<'EOF'
      server {
          listen 80;
          listen [::]:80;
          server_name example.com www.example.com;
          root /var/www/example.com/current/public;

          add_header X-Frame-Options "SAMEORIGIN";
          add_header X-Content-Type-Options "nosniff";

          index index.php;
          charset utf-8;
          client_max_body_size 20m;

          location / {
              try_files $uri $uri/ /index.php?$query_string;
          }

          location = /favicon.ico { access_log off; log_not_found off; }
          location = /robots.txt  { access_log off; log_not_found off; }

          error_page 404 /index.php;

          location ~ ^/index\.php(/|$) {
              fastcgi_pass unix:/run/php/php8.5-fpm.sock;
              fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
              include fastcgi_params;
              fastcgi_hide_header X-Powered-By;
          }

          location ~ /\.(?!well-known).* {
              deny all;
          }
      }
      EOF
      ```
  - id: site-aktivieren
    type: simulated
    title: Die Site aktivieren
    description: |
      Die Datei liegt auf dem Server unter `/etc/nginx/sites-available/example.com`. Aktiviere sie:

      1. Verlinke sie nach `sites-enabled`: `sudo ln -s /etc/nginx/sites-available/example.com /etc/nginx/sites-enabled/`
      2. Entferne die Standard-Site: `sudo rm /etc/nginx/sites-enabled/default`
      3. Prüfe die Konfiguration: `sudo nginx -t`
      4. Lade nginx neu: `sudo systemctl reload nginx`
      5. Teste den Health-Check von Laravel: `curl -I http://example.com/up`
    prompt: "deploy@web-01:~$"
    steps:
      - expect: "^sudo\\s+ln\\s+-s\\s+/etc/nginx/sites-available/example\\.com\\s+/etc/nginx/sites-enabled/?(example\\.com)?\\s*$"
        output: ""
        hint: "sudo ln -s /etc/nginx/sites-available/example.com /etc/nginx/sites-enabled/"
      - expect: "^sudo\\s+rm\\s+(-f\\s+)?/etc/nginx/sites-enabled/default\\s*$"
        output: ""
        hint: "sudo rm /etc/nginx/sites-enabled/default"
      - expect: "^sudo\\s+nginx\\s+-t\\s*$"
        output: |
          nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
          nginx: configuration file /etc/nginx/nginx.conf test is successful
        hint: "sudo nginx -t"
      - expect: "^sudo\\s+systemctl\\s+reload\\s+nginx\\s*$"
        output: ""
        hint: "sudo systemctl reload nginx"
      - expect: "^curl\\s+-I\\s+http://example\\.com/up\\s*$"
        output: |
          HTTP/1.1 200 OK
          Server: nginx
          Content-Type: text/html; charset=utf-8
          X-Frame-Options: SAMEORIGIN
          X-Content-Type-Options: nosniff
        hint: "curl -I http://example.com/up"
    solution: |
      ```bash
      sudo ln -s /etc/nginx/sites-available/example.com /etc/nginx/sites-enabled/
      sudo rm /etc/nginx/sites-enabled/default
      sudo nginx -t
      sudo systemctl reload nginx
      curl -I http://example.com/up
      ```
      Die Route `/up` bringt Laravel von Haus aus mit. Sie antwortet mit 200, wenn die App ohne Fehler startet.
---
nginx läuft, aber er zeigt noch seine Willkommensseite. Damit er deine Laravel-App ausliefert, schreibst du
eine **Site-Konfiguration**: einen [[server-block|server-Block]], der sagt, für welche Domain er zuständig ist, wo die
Dateien liegen und wie PHP ausgeführt wird. Drei Zeilen darin entscheiden über Sicherheit – die schauen wir
uns genau an.

## Der server-Block im Überblick

```nginx title="/etc/nginx/sites-available/example.com"
server {
    listen 80;
    listen [::]:80;
    server_name example.com www.example.com;
    root /var/www/example.com/current/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ ^/index\.php(/|$) {
        fastcgi_pass unix:/run/php/php8.5-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

| Anweisung | Bedeutung |
|---|---|
| `listen 80` / `[::]:80` | lauscht auf HTTP für IPv4 und IPv6 – HTTPS ergänzt später Certbot |
| `server_name` | für welche Namen dieser Block zuständig ist ([[virtual-host\|virtueller Host]]) |
| `root` | der [[document-root\|Document Root]]: der einzige Ordner, der öffentlich ist |
| `try_files` | gibt es die Datei? sonst Ordner? sonst an `index.php` |
| `location ~ ^/index\.php` | nur der Front-Controller wird an PHP-FPM übergeben |

## Nur public/ ist öffentlich

Laravel legt alle öffentlichen Dateien nach `public/`: den [[front-controller|Front-Controller]]
`index.php`, kompilierte Assets und Bilder. Alles andere – `app/`, `config/`, `vendor/` und vor allem die
`.env` mit Passwörtern – liegt eine Ebene darüber.

> [!FEHLER]
> `root /var/www/example.com/current;` statt `…/current/public;`. Dann ist `https://example.com/.env`
> unter Umständen direkt abrufbar – mit Datenbankpasswort und `APP_KEY`. Bots suchen genau danach.

Der letzte Block ist ein zweiter Schutz: Er verbietet alle Pfade, die mit einem Punkt beginnen (`.env`,
`.git`), lässt aber `.well-known` durch. Diesen Ordner braucht Let's Encrypt gleich für die
Domain-Prüfung.

Umgekehrt muss PHP-FPM in zwei Ordner **schreiben** dürfen: `storage/` (Logs, Sessions, Uploads) und `bootstrap/cache/` (Caches). Weil `storage` aus `shared/` kommt und der Gruppe `www-data` gehört, reicht dort Gruppen-Schreibrecht. Alle anderen Dateien darf der Webserver nur lesen – wird PHP-Code eingeschleust, kann er so keine Programmdateien verändern.

## PHP sicher übergeben

nginx führt selbst kein PHP aus. Er reicht die Anfrage über einen [[unix-socket|Unix-Socket]] an PHP-FPM weiter.
Zwei Details sind wichtig:

- **Nur `index.php`** wird ausgeführt. Ein Block wie `location ~ \.php$` würde jede hochgeladene
  `.php`-Datei ausführen – ein klassischer Weg zu einer [[webshell|Webshell]].
- **`$realpath_root` statt `$document_root`**: `current` ist ein [[symlink|Symlink]] auf das aktuelle
  Release. `$realpath_root` löst ihn auf, sodass PHP-FPM und [[opcache|OPcache]] nach jedem Deploy den
  echten, neuen Pfad sehen.

> [!MERKSATZ]
> `root` zeigt auf `current/public`, PHP bekommt den aufgelösten Pfad über `$realpath_root`, und nur
> `index.php` wird ausgeführt.

## Aktivieren, prüfen, neu laden

Auf Ubuntu liegen Sites in `/etc/nginx/sites-available/`. Aktiv wird eine Site durch einen Symlink nach
`sites-enabled/`:

```bash title="Terminal"
sudo ln -s /etc/nginx/sites-available/example.com /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
curl -I http://example.com/up
```

`nginx -t` prüft alle Dateien, **bevor** du neu lädst. Ein Tippfehler legt so nicht die laufende Seite lahm.
Die Route `/up` ist Laravels eingebauter Health-Check – er eignet sich auch später für die Überwachung.

> [!PRAXIS]
> Lade nginx nach Änderungen immer mit `reload`, nicht mit `restart`. Bei `reload` beenden die alten
> Worker-Prozesse ihre laufenden Anfragen noch sauber, während neue schon die neue Konfiguration nutzen.

Mehr zu location-Regeln, Caching und Kompression findest du im nginx-Kurs und in der
[offiziellen Dokumentation](https://nginx.org/en/docs/).

## Zusammenfassung

- Eine Site ist ein `server`-Block mit `listen`, `server_name`, `root` und `location`-Blöcken.
- `root` zeigt auf **`current/public`** – nie auf den Projektordner selbst.
- Nur `index.php` geht an PHP-FPM, mit `SCRIPT_FILENAME $realpath_root$fastcgi_script_name`.
- Dateien mit Punkt am Anfang werden gesperrt, `.well-known` bleibt erreichbar.
- Aktivieren per Symlink, dann `nginx -t` und `systemctl reload nginx`.
