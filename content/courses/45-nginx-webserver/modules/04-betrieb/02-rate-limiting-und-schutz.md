---
title: Rate Limiting und Schutzmaßnahmen
summary: Wie du mit limit_req_zone und limit_req Anfragen pro IP begrenzt, was burst und nodelay bewirken und welche weiteren Einstellungen wie server_tokens, client_max_body_size und Sicherheits-Header einen nginx robuster machen.
duration: 20
sources:
  - title: nginx – ngx_http_limit_req_module
    url: https://nginx.org/en/docs/http/ngx_http_limit_req_module.html
  - title: nginx – ngx_http_limit_conn_module
    url: https://nginx.org/en/docs/http/ngx_http_limit_conn_module.html
  - title: nginx – client_max_body_size, server_tokens
    url: https://nginx.org/en/docs/http/ngx_http_core_module.html#client_max_body_size
  - title: MDN – 429 Too Many Requests
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429
quiz:
  - type: single
    question: In welchen Kontext gehört `limit_req_zone`?
    options:
      - http
      - server
      - location
      - events
    answer: 0
    explanation: >
      limit_req_zone legt einen gemeinsamen Speicherbereich an und ist nur im http-Kontext erlaubt.
      `limit_req`, das die Zone benutzt, darf in http, server und location stehen.
  - type: cloze
    text: "Ohne weitere Angabe antwortet nginx auf abgelehnte Anfragen mit Status ___. Mit `limit_req_status ___;` sendest du den passenderen Code Too Many Requests."
    blanks:
      - ["503"]
      - ["429"]
    explanation: 503 klingt nach einem kaputten Server. 429 sagt dem Client klar, dass er zu viele Anfragen schickt.
  - type: match
    question: Was bewirkt welcher Teil?
    pairs:
      - { left: "$binary_remote_addr", right: "Schlüssel: zählt pro Client-IP, platzsparend gespeichert" }
      - { left: "zone=login:10m", right: "Name und Größe des gemeinsamen Speichers" }
      - { left: "rate=5r/m", right: "im Mittel fünf Anfragen pro Minute" }
      - { left: "burst=3", right: "bis zu drei überzählige Anfragen dürfen warten" }
      - { left: "nodelay", right: "Anfragen im Burst sofort bearbeiten statt verzögern" }
    explanation: Zusammen ergibt das z. B. `limit_req zone=login burst=3 nodelay;`.
  - type: multiple
    question: Welche Einstellungen gehören zu einer sinnvollen Grundabsicherung?
    options:
      - "`server_tokens off;` – keine Versionsnummer in Headern und Fehlerseiten"
      - "`client_max_body_size` passend zu den erlaubten Uploads setzen"
      - "`add_header X-Content-Type-Options \"nosniff\" always;`"
      - "`worker_processes 1;` – weniger Prozesse sind sicherer"
    answers: [0, 1, 2]
    explanation: Die Zahl der Worker hat nichts mit Sicherheit zu tun.
tasks:
  - id: burst-verstehen
    type: steps
    title: Was passiert bei rate=1r/s und burst=2?
    description: |
      Für `/login` gilt `limit_req zone=login burst=2;` mit `rate=1r/s` – **ohne** nodelay und mit
      `limit_req_status 429;`. Ein Skript schickt in derselben Sekunde mehrere Anfragen von einer IP.
    steps:
      - situation: Die erste Anfrage kommt an. Bisher war es ruhig.
        question: Was passiert?
        options: [Sofort bearbeitet, Verzögert, Abgelehnt mit 429]
        answer: 0
        explanation: Die Rate ist nicht überschritten – die Anfrage geht direkt durch.
      - situation: Unmittelbar danach kommen die Anfragen 2 und 3.
        question: Was passiert mit ihnen?
        options: [Beide sofort bearbeitet, Beide warten im Burst und werden im Takt von 1 pro Sekunde bearbeitet, Beide abgelehnt]
        answer: 1
        explanation: Sie sind überzählig, passen aber in `burst=2`. Ohne nodelay verzögert nginx sie so, dass die Rate eingehalten wird.
      - situation: Noch in derselben Sekunde kommt Anfrage 4.
        question: Was passiert?
        options: [Sie wartet ebenfalls, Sie wird mit 429 abgelehnt, Sie verdrängt Anfrage 2]
        answer: 1
        explanation: Der Burst ist voll. Alles Weitere wird mit `limit_req_status` abgelehnt.
      - situation: Ein Kollege ändert die Zeile zu `limit_req zone=login burst=2 nodelay;` und das Skript startet neu.
        question: Was ändert sich für die Anfragen 2 und 3?
        options: [Nichts, Sie werden sofort bearbeitet – zählen aber weiter gegen den Burst, Sie werden jetzt abgelehnt]
        answer: 1
        explanation: nodelay entfernt die Wartezeit, nicht die Grenze. Anfrage 4 wird weiterhin abgelehnt, bis der Burst-Platz wieder frei ist.
  - id: login-schuetzen
    type: terminal
    title: Den Login vor Brute-Force schützen
    description: |
      Im Ordner `rate-limit` liegen `nginx.conf` und `conf.d/shop.conf`. Der Login des Shops wird mit
      Passwort-Rateversuchen überflutet.

      1. In `nginx.conf` im http-Block: `server_tokens off;` und
         `limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;`
      2. In `conf.d/shop.conf` im server-Block: `client_max_body_size 10m;` und
         `limit_req_status 429;`
      3. In `conf.d/shop.conf`: in der vorhandenen `location = /login` die Zeile
         `limit_req zone=login burst=3 nodelay;`

      Prüfe mit `bash pruefe.sh nginx.conf conf.d/shop.conf`. Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: rate-limit
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
          include conf.d/*.conf;
      }
      EOF
      cat > conf.d/shop.conf <<'EOF'
      server {
          listen 80;
          server_name shop.example.com;

          location = /login {
              proxy_pass http://127.0.0.1:3000;
          }

          location / {
              proxy_pass http://127.0.0.1:3000;
          }
      }
      EOF
    checks:
      - type: command
        run: bash pruefe.sh nginx.conf conf.d/shop.conf
        message: Eine der Dateien hat noch Syntaxfehler. Führe bash pruefe.sh nginx.conf conf.d/shop.conf aus.
      - type: command
        run: bash pruefe.sh --baum nginx.conf | grep -Eq '^http > server_tokens off$'
        message: Im http-Block von nginx.conf fehlt server_tokens off;
      - type: command
        run: bash pruefe.sh --baum nginx.conf | grep -Eq '^http > limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m$'
        message: "Im http-Block fehlt limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m; – es gehört in nginx.conf, nicht in shop.conf."
      - type: command
        run: "! grep -q limit_req_zone conf.d/shop.conf"
        message: limit_req_zone ist im server-Block nicht erlaubt. Verschiebe es in den http-Block von nginx.conf.
      - type: command
        run: bash pruefe.sh --baum conf.d/shop.conf | grep -Eq '^server > client_max_body_size 10m$' && bash pruefe.sh --baum conf.d/shop.conf | grep -Eq '^server > limit_req_status 429$'
        message: Im server-Block von shop.conf fehlen client_max_body_size 10m; oder limit_req_status 429;
      - type: command
        run: bash pruefe.sh --baum conf.d/shop.conf | grep -Eq '^server > location = /login > limit_req zone=login burst=3 nodelay$'
        message: In location = /login fehlt limit_req zone=login burst=3 nodelay;
      - type: command
        run: bash pruefe.sh --baum conf.d/shop.conf | grep -Eq '^server > location = /login > proxy_pass http://127\.0\.0\.1:3000$'
        message: In location = /login soll proxy_pass http://127.0.0.1:3000; erhalten bleiben.
    hints:
      - Die Zone definierst du einmal global im http-Block, benutzt wird sie mit limit_req in der location.
      - "Achtung bei `$binary_remote_addr` in einem Heredoc ohne Anführungszeichen – nimm `nano`."
      - "Die location sieht am Ende so aus: `location = /login { limit_req zone=login burst=3 nodelay; proxy_pass http://127.0.0.1:3000; }`"
    solution: |
      ```nginx title="nginx.conf"
      worker_processes auto;
      events {
          worker_connections 1024;
      }
      http {
          include mime.types;
          server_tokens off;
          limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
          include conf.d/*.conf;
      }
      ```
      ```nginx title="conf.d/shop.conf"
      server {
          listen 80;
          server_name shop.example.com;
          client_max_body_size 10m;
          limit_req_status 429;

          location = /login {
              limit_req zone=login burst=3 nodelay;
              proxy_pass http://127.0.0.1:3000;
          }

          location / {
              proxy_pass http://127.0.0.1:3000;
          }
      }
      ```
---

Nachts um drei schickt ein Bot 50 Login-Versuche pro Sekunde an deinen Shop. Er probiert Passwörter
aus einer Liste durch – ein [[brute-force|Brute-Force-Angriff]]. Deine Anwendung prüft jedes Passwort
mit einem teuren Hash, die CPU läuft auf Anschlag, echte Kunden warten. nginx kann solche Fluten
abfangen, bevor sie die Anwendung erreichen.

## Die Idee hinter limit_req

[[rate-limiting|Rate Limiting]] begrenzt, wie viele Anfragen ein Client in einer Zeitspanne schicken
darf. nginx nutzt dafür das Prinzip eines undichten Eimers: Anfragen laufen oben hinein, unten tropfen
sie gleichmäßig im erlaubten Takt heraus. Läuft der Eimer über, wird abgelehnt.

Du brauchst zwei Direktiven:

```nginx title="Zone definieren (http) und benutzen (location)"
http {
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    server {
        location = /login {
            limit_req zone=login burst=3 nodelay;
            proxy_pass http://127.0.0.1:3000;
        }
    }
}
```

| Teil | Bedeutung |
|---|---|
| `$binary_remote_addr` | gezählt wird pro Client-IP (platzsparend als Binärwert) |
| `zone=login:10m` | gemeinsamer Speicher „login“, 10 MB reichen für zehntausende IPs |
| `rate=5r/m` | im Mittel 5 Anfragen pro Minute (`r/s` für pro Sekunde) |

> [!MERKSATZ]
> `limit_req_zone` steht im **http**-Block und beschreibt die Regel. `limit_req` steht dort, wo die
> Regel gelten soll – meist in einer location.

## burst und nodelay

Echte Menschen klicken nicht im perfekten Takt. Eine Seite lädt oft mehrere Anfragen gleichzeitig.
Deshalb gibt es Puffer:

| Einstellung | Verhalten bei vielen Anfragen auf einmal |
|---|---|
| nur `zone=login` | alles über der Rate wird sofort abgelehnt |
| `burst=3` | 3 überzählige Anfragen warten und werden im Takt abgearbeitet |
| `burst=3 nodelay` | 3 überzählige Anfragen werden sofort bearbeitet, danach wird abgelehnt |

Abgelehnte Anfragen bekommen standardmäßig Status `503`. Passender ist
[[statuscode|Statuscode]] `429 Too Many Requests`:

```nginx
limit_req_status 429;
```

> [!FEHLER]
> **Alle Nutzer teilen sich ein Limit.** Steht nginx hinter einem weiteren Proxy oder
> [[load-balancer|Load Balancer]], ist `$binary_remote_addr` für alle Anfragen dieselbe IP – die des
> Proxys. Dann sperrt das Limit plötzlich alle Kunden. Die echte IP holst du mit dem Modul `realip`
> aus `X-Forwarded-For`, aber nur von Proxys, denen du vertraust.

## Prüfen, ob das Limit greift

Ein Limit, das nie getestet wurde, ist ein Gerücht. Mit einer kleinen [[schleife|Schleife]] im
Terminal schickst du viele Anfragen hintereinander und zählst die Statuscodes:

```bash title="20 Login-Versuche in schneller Folge"
for i in $(seq 1 20); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST https://shop.example.com/login
done | sort | uniq -c
```

```text title="Mögliche Ausgabe bei rate=5r/m und burst=3 nodelay"
      4 200
     16 429
```

Die erste Anfrage plus drei aus dem Burst kommen durch, alle weiteren werden abgelehnt. Im Error-Log
steht für jede abgelehnte Anfrage eine Zeile mit `limiting requests` und dem Namen der Zone.

> [!TIPP]
> Teste Limits nie gegen fremde Server und auf dem eigenen am besten auf einer Testumgebung. Mit
> `limit_req_dry_run on;` zählt nginx nur mit und schreibt ins Log, lehnt aber nichts ab – praktisch,
> um ein neues Limit erst einmal zu beobachten.

## Weitere Schutzmaßnahmen

| Direktive | Wirkung | Standard |
|---|---|---|
| `server_tokens off;` | keine nginx-Version in Headern und Fehlerseiten | `on` |
| `client_max_body_size 10m;` | größere Uploads bekommen `413` | `1m` |
| `limit_conn` | begrenzt gleichzeitige Verbindungen pro IP | – |
| `deny` / `allow` | Pfade für IP-Bereiche sperren oder freigeben | – |

```nginx title="Interne Statusseite nur aus dem eigenen Netz"
location /status {
    allow 192.0.2.0/24;
    deny all;
}
```

[[security-header|Sicherheits-Header]] setzt du mit `add_header … always;` – `always` sorgt dafür,
dass sie auch bei Fehlerantworten mitkommen:

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

> [!PRAXIS]
> In Teams liegen diese Header oft in einer eigenen Datei `snippets/security-headers.conf`, die jeder
> server-Block und jede location mit eigenem add_header per `include` lädt. Rate Limiting in nginx
> ersetzt keine Sperre in der Anwendung – es nimmt nur die grobe Last weg.

## Zusammenfassung

- `limit_req_zone` (im http-Block) definiert Schlüssel, Speicher und Rate.
- `limit_req zone=… burst=… nodelay;` wendet die Regel in server oder location an.
- `burst` puffert überzählige Anfragen, `nodelay` bearbeitet sie ohne Wartezeit.
- `limit_req_status 429;` statt des Standards 503.
- `server_tokens off;`, `client_max_body_size` und Sicherheits-Header mit `always` runden den Schutz ab.
