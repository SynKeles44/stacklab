---
title: Logs lesen und typische Fehler finden
summary: Wie Access- und Error-Log aufgebaut sind, wie du sie mit tail, grep und awk auswertest und wie du die häufigsten nginx-Fehler – 502, 404 trotz Datei, 403, 413 und Weiterleitungsschleifen – systematisch eingrenzt.
duration: 25
sources:
  - title: nginx – ngx_http_log_module (access_log, log_format)
    url: https://nginx.org/en/docs/http/ngx_http_log_module.html
  - title: nginx – error_log
    url: https://nginx.org/en/docs/ngx_core_module.html#error_log
  - title: nginx – A debugging log
    url: https://nginx.org/en/docs/debugging_log.html
  - title: GNU Awk – Getting Started
    url: https://www.gnu.org/software/gawk/manual/html_node/Getting-Started.html
quiz:
  - type: single
    question: "Im Error-Log steht `connect() failed (111: Connection refused) while connecting to upstream`. Was ist die wahrscheinlichste Ursache?"
    options:
      - Die Datei fehlt im root-Ordner
      - Die Anwendung hinter proxy_pass läuft nicht oder lauscht auf einem anderen Port
      - Das Zertifikat ist abgelaufen
      - Der Client hat zu viele Anfragen geschickt
    answer: 1
    explanation: >
      „Connection refused“ heißt: Unter der Adresse aus proxy_pass oder fastcgi_pass nimmt niemand die
      Verbindung an. Der Browser sieht dabei 502 Bad Gateway.
  - type: match
    question: Ordne jedem Symptom die häufigste Ursache zu.
    pairs:
      - { left: "502 Bad Gateway", right: "Anwendung oder PHP-FPM nicht erreichbar" }
      - { left: "403 Forbidden auf alle Dateien", right: "Worker-Benutzer darf den Ordner nicht lesen" }
      - { left: "413 Request Entity Too Large", right: "Upload größer als client_max_body_size" }
      - { left: "ERR_TOO_MANY_REDIRECTS", right: "App leitet auf https um, weil X-Forwarded-Proto fehlt" }
      - { left: "404, obwohl die Datei existiert", right: "alias ohne Schrägstrich oder falscher root" }
    explanation: Fast jedes dieser Symptome steht mit genauerer Ursache im Error-Log.
  - type: cloze
    text: "Neue Einträge eines Logs verfolgst du live mit `tail ___ /var/log/nginx/error.log`. Für ruhige Bereiche schaltest du das Access-Log mit `access_log ___;` ab."
    blanks:
      - ["-f", "-F"]
      - ["off"]
    explanation: "`-f` (follow) wartet auf neue Zeilen. `access_log off;` ist z. B. für favicon.ico oder Health-Checks üblich."
  - type: single
    question: Welche Spalte enthält im Standardformat `combined` nach dem Aufteilen an Leerzeichen den Statuscode?
    options: ["$1", "$7", "$9", "$12"]
    answer: 2
    explanation: >
      `$1` ist die IP, `$7` der Pfad, `$9` der Status und `$10` die Größe der Antwort. Mit
      `awk '{print $9}' access.log` bekommst du alle Statuscodes.
tasks:
  - id: log-detektiv
    type: terminal
    title: Detektivarbeit im Access-Log
    description: |
      Im Ordner `log-analyse` liegen `access.log` und `error.log` eines Shops von heute Morgen. Werte
      sie mit `grep`, `awk`, `sort`, `uniq` und `wc` aus und schreibe deine Antworten jeweils als
      einzige Zeile in den Ordner `antworten/`:

      1. `antworten/ip.txt`: die IP-Adresse mit den **meisten** Anfragen.
      2. `antworten/5xx.txt`: die **Anzahl** der Antworten mit einem Statuscode 500–599.
      3. `antworten/404.txt`: der **Pfad**, der am häufigsten mit 404 beantwortet wurde.
      4. `antworten/upstream.txt`: Adresse und Port der Anwendung, die laut `error.log` nicht
         erreichbar war (Format `127.0.0.1:1234`).

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: log-analyse
    setup: |
      mkdir -p antworten
      z() { printf '%s - - [10/Oct/2026:09:%s +0000] "%s %s HTTP/1.1" %s %s "-" "%s"\n' "$1" "$2" "$3" "$4" "$5" "$6" "$7"; }
      {
      z 203.0.113.25 "00:01" GET / 200 5123 "Mozilla/5.0"
      z 203.0.113.25 "00:01" GET /assets/index-4f2a9c.js 200 81233 "Mozilla/5.0"
      z 203.0.113.25 "00:02" GET /assets/style-91be0d.css 200 9120 "Mozilla/5.0"
      z 203.0.113.25 "00:04" GET /api/products 200 2210 "Mozilla/5.0"
      z 198.51.100.7 "01:10" GET /.env 404 153 "curl/8.15.0"
      z 198.51.100.7 "01:10" GET /wp-login.php 404 153 "curl/8.15.0"
      z 198.51.100.7 "01:11" GET /wp-login.php 404 153 "curl/8.15.0"
      z 198.51.100.7 "01:11" GET /.git/config 404 153 "curl/8.15.0"
      z 198.51.100.7 "01:12" GET /wp-login.php 404 153 "curl/8.15.0"
      z 198.51.100.7 "01:12" POST /login 429 169 "curl/8.15.0"
      z 198.51.100.7 "01:12" POST /login 429 169 "curl/8.15.0"
      z 198.51.100.7 "01:13" GET /phpmyadmin/ 404 153 "curl/8.15.0"
      z 192.0.2.44 "02:30" GET / 200 5123 "Mozilla/5.0"
      z 192.0.2.44 "02:31" GET /api/orders 502 157 "Mozilla/5.0"
      z 192.0.2.44 "02:33" GET /api/orders 502 157 "Mozilla/5.0"
      z 192.0.2.44 "02:40" POST /api/orders 504 167 "Mozilla/5.0"
      z 203.0.113.25 "03:05" GET /api/cart 200 812 "Mozilla/5.0"
      z 192.0.2.44 "03:06" GET /favicon.ico 404 153 "Mozilla/5.0"
      z 203.0.113.25 "03:20" POST /login 302 0 "Mozilla/5.0"
      } > access.log
      cat > error.log <<'EOF'
      2026/10/10 09:01:10 [error] 813#813: *41 open() "/srv/shop/dist/.env" failed (2: No such file or directory), client: 198.51.100.7, server: shop.example.com, request: "GET /.env HTTP/1.1"
      2026/10/10 09:01:12 [error] 814#814: *44 limiting requests, excess: 3.250 by zone "login", client: 198.51.100.7, server: shop.example.com, request: "POST /login HTTP/1.1"
      2026/10/10 09:02:31 [error] 813#813: *57 connect() failed (111: Connection refused) while connecting to upstream, client: 192.0.2.44, server: shop.example.com, request: "GET /api/orders HTTP/1.1", upstream: "http://127.0.0.1:4000/orders", host: "shop.example.com"
      2026/10/10 09:02:40 [error] 814#814: *61 upstream timed out (110: Connection timed out) while reading response header from upstream, client: 192.0.2.44, server: shop.example.com, request: "POST /api/orders HTTP/1.1", upstream: "http://127.0.0.1:4000/orders", host: "shop.example.com"
      EOF
    checks:
      - type: command
        run: tr -d '[:space:]' < antworten/ip.txt
        stdout_equals: 198.51.100.7
        message: In antworten/ip.txt steht noch nicht die IP mit den meisten Anfragen. Tipp – awk '{print $1}' access.log | sort | uniq -c | sort -rn
      - type: command
        run: tr -d '[:space:]' < antworten/5xx.txt
        stdout_equals: "3"
        message: In antworten/5xx.txt steht noch nicht die Anzahl der 5xx-Antworten. Tipp – awk '$9 ~ /^5/' access.log | wc -l
      - type: command
        run: tr -d '[:space:]' < antworten/404.txt
        stdout_equals: /wp-login.php
        message: In antworten/404.txt steht noch nicht der häufigste 404-Pfad. Tipp – awk '$9 == 404 {print $7}' access.log | sort | uniq -c | sort -rn
      - type: command
        run: tr -d '[:space:]' < antworten/upstream.txt
        stdout_equals: 127.0.0.1:4000
        message: In antworten/upstream.txt steht noch nicht Adresse und Port aus dem upstream-Eintrag im error.log (nur IP:Port, ohne http:// und Pfad).
    hints:
      - "`awk '{print $1}' access.log` gibt die erste Spalte (IP) jeder Zeile aus. `sort | uniq -c | sort -rn` zählt und sortiert."
      - "Der Statuscode steht in Spalte 9, der Pfad in Spalte 7. Mit `awk '$9 == 404 {print $7}'` filterst du."
      - "Im error.log suchst du mit `grep upstream error.log` nach dem Eintrag `upstream: \"http://…\"`. Schreibe z. B. `echo 127.0.0.1:1234 > antworten/upstream.txt` mit dem richtigen Port."
    solution: |
      ```bash
      cd log-analyse
      awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -n 1
      awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -n 1 | awk '{print $2}' > antworten/ip.txt
      awk '$9 ~ /^5/' access.log | wc -l > antworten/5xx.txt
      awk '$9 == 404 {print $7}' access.log | sort | uniq -c | sort -rn | head -n 1 | awk '{print $2}' > antworten/404.txt
      grep -o 'upstream: "http://[^/"]*' error.log | head -n 1 | sed 's#.*//##' > antworten/upstream.txt
      ```
      Ergebnis: `198.51.100.7` (ein Scanner), `3` Fehler, `/wp-login.php` und `127.0.0.1:4000` –
      die API lief also nicht.
  - id: fehler-zuordnen
    type: dragdrop
    title: Welche Konfiguration verursacht welchen Fehler?
    description: Ordne jede fehlerhafte Zeile dem Symptom zu, das sie im Browser auslöst.
    targets:
      - { id: fehler404, label: "404 Not Found" }
      - { id: fehler502, label: "502 Bad Gateway" }
      - { id: schleife, label: "Weiterleitungsschleife" }
      - { id: quelltext, label: "Browser lädt index.php herunter" }
    items:
      - { label: "location /bilder/ { alias /srv/fotos; }", target: fehler404 }
      - { label: "proxy_pass http://127.0.0.1:3001; (App läuft auf 3000)", target: fehler502 }
      - { label: "fastcgi_pass unix:/run/php/php8.4-fpm.sock; (installiert ist 8.5)", target: fehler502 }
      - { label: "Laravel erzwingt HTTPS, nginx setzt kein X-Forwarded-Proto", target: schleife }
      - { label: "server-Block für Laravel ohne fastcgi_pass-location", target: quelltext }
      - { label: "location /api/ { proxy_pass http://127.0.0.1:3000/; } – App erwartet /api/…", target: fehler404 }
---

„Die Seite geht nicht!“ – so beginnen viele Tage im Betrieb. Ob es an nginx, an der Anwendung oder an
einer Datei liegt, verraten dir zwei Dateien: das Access-Log und das Error-Log. Wer sie lesen kann,
findet die meisten Fehler in Minuten statt in Stunden.

## Das Access-Log

Das [[access-log|Access-Log]] bekommt pro Anfrage eine Zeile. Unter Debian und Ubuntu liegt es unter
`/var/log/nginx/access.log` im Format `combined`:

```text title="Eine Zeile im Format combined"
203.0.113.25 - - [10/Oct/2026:09:00:01 +0000] "GET /api/products HTTP/1.1" 200 2210 "-" "Mozilla/5.0"
```

| Teil | Bedeutung | Spalte bei `awk` |
|---|---|---|
| `203.0.113.25` | Client-IP | `$1` |
| `[10/Oct/2026:09:00:01 +0000]` | Zeitpunkt | `$4`, `$5` |
| `"GET /api/products HTTP/1.1"` | Methode, Pfad, Protokoll | `$6`, `$7`, `$8` |
| `200` | Statuscode | `$9` |
| `2210` | Größe der Antwort in Bytes | `$10` |
| `"-"` / `"Mozilla/5.0"` | Referer / [[user-agent|User-Agent]] | ab `$11` |

Mit `log_format` definierst du eigene Formate, etwa mit Antwortzeit:

```nginx title="im http-Block"
log_format timed '$remote_addr [$time_local] "$request" $status $request_time';
access_log /var/log/nginx/access.log timed;
```

`access_log off;` schaltet das Log für eine location ab – üblich für `favicon.ico` oder Health-Checks.

## Das Error-Log

Das [[error-log|Error-Log]] erklärt, **warum** etwas schiefging. Jede Zeile hat Datum, Stufe, Prozess
und eine Beschreibung.

```text title="/var/log/nginx/error.log"
2026/10/10 09:02:31 [error] 813#813: *57 connect() failed (111: Connection refused) while
connecting to upstream, client: 192.0.2.44, request: "GET /api/orders HTTP/1.1",
upstream: "http://127.0.0.1:4000/orders"
```

Die Stufe stellst du mit `error_log /var/log/nginx/error.log warn;` ein. Mögliche Werte reichen von
`debug` über `info`, `notice`, `warn` und `error` bis `crit`, `alert` und `emerg`.

> [!MERKSATZ]
> Access-Log: **was** passiert ist. Error-Log: **warum** es schiefging. Bei Problemen immer zuerst das
> Error-Log lesen.

## Logs auswerten

Im Terminal reichen wenige Werkzeuge für die meisten Fragen:

```bash title="Typische Auswertungen"
tail -f /var/log/nginx/error.log                              # live mitlesen
grep ' 502 ' /var/log/nginx/access.log | tail -n 20           # letzte 502er
awk '{print $9}' access.log | sort | uniq -c | sort -rn       # Statuscodes zählen
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head  # aktivste IPs
awk '$9 == 404 {print $7}' access.log | sort | uniq -c | sort -rn | head
```

[[awk]] zerlegt jede Zeile an Leerzeichen in Spalten. `sort | uniq -c` zählt gleiche Zeilen,
`sort -rn` sortiert die Zählung absteigend.

> [!PRAXIS]
> Siehst du viele 404 auf `/wp-login.php` oder `/.env`, scannt ein Bot nach bekannten Lücken. Das ist
> Alltag im Internet und kein Grund zur Panik – solange deine Konfiguration versteckte Dateien sperrt.
> In größeren Teams landen die Logs in einem zentralen System, die Werkzeuge bleiben aber dieselben.

## Langsame Anfragen finden

Nicht jeder Fehler ist ein roter Statuscode. Oft ist die Seite einfach langsam. Dafür lohnt sich ein
eigenes Log-Format mit Zeitangaben:

```nginx title="Log-Format mit Antwortzeiten"
log_format timing '$remote_addr [$time_local] "$request" $status '
                  'rt=$request_time urt=$upstream_response_time';
access_log /var/log/nginx/app.access.log timing;
```

| Variable | Bedeutung |
|---|---|
| `$request_time` | Gesamtzeit der Anfrage aus Sicht von nginx, in Sekunden |
| `$upstream_response_time` | wie lange die Anwendung hinter nginx gebraucht hat |

Ist `rt` groß, aber `urt` klein, hängt es am Netz zum Client oder an großen Dateien. Sind beide groß,
ist die Anwendung langsam – dann suchst du dort weiter, etwa nach langsamen Datenbankabfragen.

```bash title="Die zehn langsamsten Anfragen"
awk '{for (i=1; i<=NF; i++) if ($i ~ /^rt=/) print substr($i, 4), $0}' app.access.log | sort -rn | head
```

## Die häufigsten Fehler

| Symptom | Typische Ursache | Erste Prüfung |
|---|---|---|
| 502 Bad Gateway | App oder PHP-FPM läuft nicht, falscher Port oder Socket | Error-Log, `ss -tlnp` |
| 504 Gateway Timeout | App zu langsam | `proxy_read_timeout`, App-Log |
| 404 trotz Datei | falscher `root`, `alias` ohne `/` | Error-Log zeigt den gesuchten Pfad |
| 403 Forbidden | Worker darf Ordner nicht lesen, kein `index` | Dateirechte mit `ls -l` |
| 413 | Upload größer als `client_max_body_size` | Wert erhöhen |
| Weiterleitungsschleife | App kennt HTTPS nicht | `X-Forwarded-Proto` setzen |
| API bekommt falsche Pfade | Schrägstrich in `proxy_pass` | Log der App |
| Änderung wirkt nicht | kein Reload oder falsche Datei | `nginx -T` |

> [!FEHLER]
> **Blind herumprobieren.** Wer bei 502 die nginx-Konfiguration umbaut, sucht an der falschen Stelle:
> nginx meldet hier nur, dass dahinter niemand antwortet. Lies erst das Error-Log, dann ändere genau
> eine Sache, dann `nginx -t` und Reload.

## Zusammenfassung

- Das Access-Log hat pro Anfrage eine Zeile: IP, Zeit, Anfrage, Status, Größe, Referer, User-Agent.
- Das Error-Log erklärt Ursachen; die Stufe stellst du mit `error_log … warn;` ein.
- `tail -f`, `grep`, `awk`, `sort` und `uniq -c` beantworten die meisten Fragen an ein Log.
- 502 und 504 liegen an der Anwendung dahinter, 404 und 403 meist an Pfaden und Rechten.
- Erst lesen, dann gezielt eine Sache ändern, prüfen und neu laden.
