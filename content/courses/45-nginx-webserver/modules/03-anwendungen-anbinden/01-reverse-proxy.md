---
title: nginx als Reverse Proxy
summary: Wie nginx Anfragen mit proxy_pass an eine Anwendung weiterreicht, welche Header die Anwendung braucht, um Host, Client-IP und Protokoll zu kennen, und warum ein einziger Schrägstrich in proxy_pass die URL verändert.
duration: 25
sources:
  - title: nginx – ngx_http_proxy_module (proxy_pass, proxy_set_header)
    url: https://nginx.org/en/docs/http/ngx_http_proxy_module.html
  - title: nginx – ngx_http_upstream_module
    url: https://nginx.org/en/docs/http/ngx_http_upstream_module.html
  - title: nginx – WebSocket proxying
    url: https://nginx.org/en/docs/http/websocket.html
  - title: MDN – X-Forwarded-For
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Forwarded-For
quiz:
  - type: single
    question: "`location /api/ { proxy_pass http://127.0.0.1:3000/; }` – welchen Pfad bekommt die Anwendung bei `/api/users`?"
    options:
      - "`/api/users`"
      - "`/users`"
      - "`/api/api/users`"
      - "`//users`"
    answer: 1
    explanation: >
      proxy_pass hat hier einen URI-Teil (den Schrägstrich). Dann ersetzt nginx den passenden
      location-Teil `/api/` durch `/`. Ohne Schrägstrich (`http://127.0.0.1:3000`) käme `/api/users` an.
  - type: match
    question: Welcher Header verrät der Anwendung was?
    pairs:
      - { left: "Host", right: "welche Domain der Browser aufgerufen hat" }
      - { left: "X-Real-IP", right: "die IP-Adresse des Clients" }
      - { left: "X-Forwarded-For", right: "die Kette aller Client- und Proxy-IPs" }
      - { left: "X-Forwarded-Proto", right: "ob der Browser http oder https benutzt hat" }
    explanation: >
      Ohne diese Header sieht die Anwendung nur nginx: Host `127.0.0.1:3000`, Client-IP `127.0.0.1`,
      Protokoll http.
  - type: multiple
    question: Welche Vorteile bringt ein Reverse Proxy vor einer Node.js- oder Python-Anwendung?
    options:
      - Die Anwendung muss nicht selbst als root auf Port 443 laufen
      - nginx übernimmt TLS, Kompression und statische Dateien
      - Mehrere Anwendungen teilen sich eine Domain über verschiedene Pfade
      - Die Anwendung braucht keine Datenbank mehr
    answers: [0, 1, 2]
    explanation: Der Proxy ändert nichts an der Logik der Anwendung – er nimmt ihr aber Netzwerkaufgaben ab.
  - type: cloze
    text: "Bekommt nginx von der Anwendung keine Antwort, weil sie nicht läuft, liefert er den Status ___ Bad Gateway. Antwortet sie zu langsam, kommt ___ Gateway Timeout."
    blanks:
      - ["502"]
      - ["504"]
    explanation: Beide Fehler kommen von nginx, die Ursache liegt aber fast immer bei der Anwendung dahinter.
tasks:
  - id: proxy-diagramm
    type: diagram
    title: Beschrifte den Weg durch den Reverse Proxy
    description: |
      Ein Browser ruft `https://example.com` auf. nginx liefert die React-App selbst aus, reicht `/api/`
      an eine Node.js-Anwendung und PHP-Anfragen an PHP-FPM weiter. Ziehe die Beschriftungen an die
      richtigen Stellen.
    image: /assets/nginx-webserver/reverse-proxy-leer.svg
    slots:
      - { x: 12, y: 50, answer: Browser }
      - { x: 41, y: 50, answer: nginx }
      - { x: 80, y: 22, answer: "Dateien in /srv/app/dist" }
      - { x: 80, y: 50, answer: "Node.js-App auf 127.0.0.1:3000" }
      - { x: 80, y: 78, answer: "PHP-FPM über FastCGI" }
    distractors: [Datenbank, DNS-Server]
    hints:
      - Der Browser spricht immer nur mit nginx.
      - Statische Dateien liest nginx selbst, für den Rest fragt er andere Programme.
    solution: |
      Links der Browser, in der Mitte nginx. Rechts oben die statischen Dateien, in der Mitte die
      Node.js-App (per `proxy_pass`), unten PHP-FPM (per `fastcgi_pass`).
  - id: api-proxy
    type: terminal
    title: Eine API hinter nginx stellen
    description: |
      Im Ordner `api-proxy` liegt `api.conf` für `api.example.com`. Die Anwendung läuft auf
      `127.0.0.1:3000` und erwartet Pfade **ohne** `/v1` – aus `/v1/users` soll `/users` werden.

      1. Lege `location /v1/` an mit `proxy_pass http://127.0.0.1:3000/;` (Schrägstrich am Ende!).
      2. Setze darin die vier Header `Host $host`, `X-Real-IP $remote_addr`,
         `X-Forwarded-For $proxy_add_x_forwarded_for` und `X-Forwarded-Proto $scheme`
         mit `proxy_set_header`.
      3. Setze `proxy_read_timeout 30s;` in derselben location.

      Prüfe mit `bash pruefe.sh api.conf`. Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: api-proxy
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
      cat > api.conf <<'EOF'
      server {
          listen 80;
          server_name api.example.com;

      }
      EOF
    checks:
      - type: command
        run: bash pruefe.sh api.conf
        message: api.conf hat noch Syntaxfehler. Führe bash pruefe.sh api.conf aus.
      - type: command
        run: bash pruefe.sh --baum api.conf | grep -Eq '^server > location /v1/ > proxy_pass http://127\.0\.0\.1:3000/$'
        message: "location /v1/ braucht proxy_pass http://127.0.0.1:3000/; – mit Schrägstrich, damit /v1 entfernt wird."
      - type: command
        run: bash pruefe.sh --baum api.conf | grep -Eq '^server > location /v1/ > proxy_set_header Host \$host$'
        message: "Es fehlt proxy_set_header Host $host; in location /v1/."
      - type: command
        run: bash pruefe.sh --baum api.conf | grep -Eq '^server > location /v1/ > proxy_set_header X-Real-IP \$remote_addr$'
        message: "Es fehlt proxy_set_header X-Real-IP $remote_addr;"
      - type: command
        run: bash pruefe.sh --baum api.conf | grep -Eq '^server > location /v1/ > proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for$'
        message: "Es fehlt proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
      - type: command
        run: bash pruefe.sh --baum api.conf | grep -Eq '^server > location /v1/ > proxy_set_header X-Forwarded-Proto \$scheme$'
        message: "Es fehlt proxy_set_header X-Forwarded-Proto $scheme;"
      - type: command
        run: bash pruefe.sh --baum api.conf | grep -Eq '^server > location /v1/ > proxy_read_timeout 30s$'
        message: Es fehlt proxy_read_timeout 30s; in location /v1/.
    hints:
      - Alle Direktiven stehen in einem Block `location /v1/ { … }` im server-Block.
      - "Achtung in einem Heredoc: Schreibe `<<'EOF'` mit Anführungszeichen, sonst ersetzt die Shell `$host` und Co. durch leere Texte. In `nano` passiert das nicht."
      - "Eine Header-Zeile sieht so aus: `proxy_set_header X-Real-IP $remote_addr;`"
    solution: |
      ```nginx title="api.conf"
      server {
          listen 80;
          server_name api.example.com;

          location /v1/ {
              proxy_pass http://127.0.0.1:3000/;
              proxy_set_header Host $host;
              proxy_set_header X-Real-IP $remote_addr;
              proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
              proxy_set_header X-Forwarded-Proto $scheme;
              proxy_read_timeout 30s;
          }
      }
      ```
---

Deine API ist eine Node.js-Anwendung, die auf Port 3000 läuft. Du könntest sie direkt ins Internet
stellen – aber dann müsste sie selbst HTTPS, Kompression und den Schutz vor Angriffen erledigen. Viel
einfacher: nginx steht davor und reicht nur die passenden Anfragen weiter.

## Was ein Reverse Proxy ist

Ein [[reverse-proxy|Reverse Proxy]] nimmt Anfragen im Namen anderer Server an. Der Browser spricht nur
mit nginx und erfährt nie, dass dahinter eine andere Anwendung antwortet. Die Anwendung dahinter heißt
[[upstream-server|Upstream]] oder Backend.

![Der Browser spricht nur mit nginx; nginx liest statische Dateien selbst, reicht /api/ per proxy_pass an eine Node.js-App und PHP per fastcgi_pass an PHP-FPM weiter](/assets/nginx-webserver/reverse-proxy.svg)

| Vorteil | Erklärung |
|---|---|
| Ein Eingang | Shop, API und Admin teilen sich eine Domain und Port 443 |
| TLS an einer Stelle | nur nginx braucht das Zertifikat |
| Schutz | Anwendungen lauschen nur auf [[localhost]], nicht im Internet |
| Entlastung | nginx liefert statische Dateien und komprimiert |

> [!MERKSATZ]
> Der Browser sieht nur nginx. Die Anwendung dahinter lauscht nur lokal, z. B. auf `127.0.0.1:3000`.

## proxy_pass

Die Weitergabe erledigt eine einzige Direktive in einer location:

```nginx title="/api/ an eine Node.js-App"
location /api/ {
    proxy_pass http://127.0.0.1:3000;
}
```

nginx öffnet eine eigene HTTP-Verbindung zur Anwendung, schickt die Anfrage dorthin und reicht die
Antwort an den Browser zurück. Seit Version 1.29.7 spricht nginx dabei standardmäßig HTTP/1.1 mit der
Anwendung; bei älteren Versionen setzt man `proxy_http_version 1.1;`.

Läuft die Anwendung mehrfach, fasst ein `upstream`-Block die Instanzen zusammen. nginx verteilt die
Anfragen dann wie ein [[load-balancer|Load Balancer]]:

```nginx
upstream api_backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
}
# in der location: proxy_pass http://api_backend;
```

## Der Schrägstrich in proxy_pass

Hier passieren die meisten Fehler. Entscheidend ist, ob hinter Host und Port **noch etwas** steht.

| Konfiguration | Anfrage | kommt an als |
|---|---|---|
| `location /api/` + `proxy_pass http://127.0.0.1:3000;` | `/api/users` | `/api/users` |
| `location /api/` + `proxy_pass http://127.0.0.1:3000/;` | `/api/users` | `/users` |
| `location /api/` + `proxy_pass http://127.0.0.1:3000/v2/;` | `/api/users` | `/v2/users` |
| `location /api/` + `proxy_pass http://127.0.0.1:3000/v2;` | `/api/users` | `/v2users` |

Die Regel: Steht ein Pfad in `proxy_pass` – und sei es nur `/` –, ersetzt nginx den passenden
location-Teil durch diesen Pfad. Ohne Pfad geht die URL unverändert weiter.

> [!FEHLER]
> **„Die API antwortet immer mit 404.“** Die Anwendung kennt `/users`, bekommt aber `/api/users` –
> oder umgekehrt. Prüfe den Schrägstrich in `proxy_pass` und schau ins Log der Anwendung, welcher Pfad
> wirklich ankommt.

## Die wichtigen Header

Ohne Hilfe sieht die Anwendung nur nginx: Die Anfrage kommt von `127.0.0.1`, der Host ist
`127.0.0.1:3000`. Für Links, Logs und Sicherheitsprüfungen braucht sie aber die echten Werte.

```nginx title="Standard-Header für jeden Proxy"
location /api/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

| Header | nginx-Variable | Inhalt |
|---|---|---|
| `Host` | `$host` | Domain aus der Browser-Anfrage |
| [[x-forwarded-for|X-Forwarded-For]] | `$proxy_add_x_forwarded_for` | bisherige Kette plus Client-IP |
| `X-Real-IP` | `$remote_addr` | IP des direkten Clients |
| `X-Forwarded-Proto` | `$scheme` | `http` oder `https` |

> [!PRAXIS]
> Frameworks lesen diese Header nur von vertrauenswürdigen Proxys – in Laravel über die
> TrustProxies-Middleware, in Express über `app.set("trust proxy", …)`. Sonst könnte jeder Client sich
> per gefälschtem Header eine andere IP geben. Fehlt `X-Forwarded-Proto`, erzeugt die App oft
> `http://`-Links und Weiterleitungsschleifen.

Für [[websocket|WebSockets]] braucht es zusätzlich die Header `Upgrade` und `Connection` – die
Anleitung steht in der verlinkten nginx-Dokumentation.

## Timeouts: wie lange nginx wartet

Zwischen nginx und der Anwendung gibt es eine eigene Verbindung – und damit eigene Wartezeiten.
Antwortet die Anwendung nicht rechtzeitig, bricht nginx ab und schickt dem Browser einen Fehler.

| Direktive | Wartet auf | Standard |
|---|---|---|
| `proxy_connect_timeout` | den Verbindungsaufbau zur Anwendung | 60s |
| `proxy_read_timeout` | die nächste Antwort-Portion der Anwendung | 60s |
| `proxy_send_timeout` | das Senden der Anfrage an die Anwendung | 60s |

```nginx title="Ein langsamer Export-Endpunkt"
location /api/export/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_read_timeout 300s;
}
```

Läuft die Zeit ab, meldet nginx `504 Gateway Timeout`. Ist die Anwendung gar nicht erreichbar, kommt
sofort `502 Bad Gateway`.

> [!TIPP]
> Erhöhe Timeouts nur gezielt für einzelne locations. Ein globales `proxy_read_timeout 600s;` versteckt
> langsame Endpunkte und bindet bei einem Fehler viele Verbindungen. Lange Aufgaben gehören besser in
> eine [[job-queue|Job-Queue]].

## Zusammenfassung

- Ein Reverse Proxy nimmt Anfragen an und reicht sie an Anwendungen weiter, die nur lokal lauschen.
- `proxy_pass http://127.0.0.1:3000;` in einer location erledigt die Weitergabe.
- Mit Pfad in `proxy_pass` (auch nur `/`) ersetzt nginx den location-Teil; ohne Pfad bleibt die URL gleich.
- `Host`, `X-Real-IP`, `X-Forwarded-For` und `X-Forwarded-Proto` geben der App die echten Werte.
- 502 heißt „Anwendung nicht erreichbar“, 504 „Anwendung zu langsam“.
