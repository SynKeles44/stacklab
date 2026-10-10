---
title: HTTPS mit Let's Encrypt
summary: Wie du mit Let's Encrypt und certbot kostenlos ein Zertifikat bekommst, wie die ACME-Prüfung über /.well-known/ funktioniert und wie ein server-Block für HTTPS mit HTTP/2 und Weiterleitung von Port 80 aussieht.
duration: 25
sources:
  - title: nginx – Configuring HTTPS servers
    url: https://nginx.org/en/docs/http/configuring_https_servers.html
  - title: nginx – ngx_http_ssl_module
    url: https://nginx.org/en/docs/http/ngx_http_ssl_module.html
  - title: nginx – ngx_http_v2_module (http2)
    url: https://nginx.org/en/docs/http/ngx_http_v2_module.html
  - title: Let's Encrypt – How It Works
    url: https://letsencrypt.org/how-it-works/
  - title: Let's Encrypt – Challenge Types
    url: https://letsencrypt.org/docs/challenge-types/
  - title: Certbot – Dokumentation
    url: https://eff-certbot.readthedocs.io/en/stable/using.html
quiz:
  - type: single
    question: Wie beweist dein Server bei der HTTP-01-Prüfung von Let's Encrypt, dass dir die Domain gehört?
    options:
      - Er schickt eine E-Mail an den Domain-Inhaber
      - Er stellt eine von Let's Encrypt vorgegebene Datei unter `/.well-known/acme-challenge/` auf Port 80 bereit
      - Er lädt das Zertifikat per FTP hoch
      - Er nennt die IP-Adresse des Servers
    answer: 1
    explanation: >
      Let's Encrypt ruft `http://deine-domain/.well-known/acme-challenge/<token>` auf. Kommt der erwartete
      Inhalt zurück, kontrollierst du den Server hinter der Domain.
  - type: match
    question: Welche Datei aus `/etc/letsencrypt/live/example.com/` gehört zu welcher Direktive?
    pairs:
      - { left: "fullchain.pem", right: "ssl_certificate – Zertifikat plus Zwischenzertifikate" }
      - { left: "privkey.pem", right: "ssl_certificate_key – geheimer Schlüssel" }
      - { left: "cert.pem", right: "nur das Server-Zertifikat – ohne Kette, für nginx ungeeignet" }
    explanation: >
      nginx braucht Zertifikat und Zwischenzertifikate in einer Datei. Mit `cert.pem` fehlt manchen Clients
      die Kette und sie melden ein unsicheres Zertifikat.
  - type: multiple
    question: Welche Aussagen zur HTTPS-Konfiguration in aktuellen nginx-Versionen stimmen?
    options:
      - "`listen 443 ssl;` schaltet TLS für diesen Port ein"
      - "HTTP/2 schaltest du mit der Direktive `http2 on;` ein"
      - "`listen 443 ssl http2;` ist die empfohlene neue Schreibweise"
      - "Ohne Angabe erlaubt nginx TLSv1.2 und TLSv1.3"
    answers: [0, 1, 3]
    explanation: >
      Der Parameter `http2` an listen ist seit nginx 1.25.1 veraltet – dafür gibt es die Direktive
      `http2 on;`. Die Standard-Protokolle sind seit 1.23.4 TLSv1.2 und TLSv1.3.
  - type: cloze
    text: "Let's-Encrypt-Zertifikate gelten standardmäßig ___ Tage. certbot erneuert sie automatisch; testen kannst du das mit `certbot renew ___`."
    blanks:
      - ["90", neunzig]
      - [--dry-run]
    explanation: Die kurze Laufzeit zwingt zur Automatisierung – ein vergessenes manuelles Erneuern ist so ausgeschlossen.
tasks:
  - id: certbot-holen
    type: simulated
    title: Ein Zertifikat mit certbot holen
    description: |
      Auf dem Server `203.0.113.10` läuft nginx mit einem server-Block für `example.com` und
      `www.example.com` auf Port 80. Die DNS-Einträge zeigen bereits auf den Server.

      1. Hole mit dem nginx-Plugin von certbot ein Zertifikat für **beide** Namen:
         `sudo certbot --nginx -d example.com -d www.example.com`
      2. Teste die automatische Erneuerung mit `sudo certbot renew --dry-run`.
      3. Prüfe mit `curl -I https://example.com`, ob HTTPS antwortet.
    prompt: "deploy@server:~$"
    steps:
      - expect: "^sudo\\s+certbot\\s+--nginx\\s+(-d\\s+example\\.com\\s+-d\\s+www\\.example\\.com|-d\\s+www\\.example\\.com\\s+-d\\s+example\\.com)$"
        output: |
          Saving debug log to /var/log/letsencrypt/letsencrypt.log
          Requesting a certificate for example.com and www.example.com

          Successfully received certificate.
          Certificate is saved at: /etc/letsencrypt/live/example.com/fullchain.pem
          Key is saved at:         /etc/letsencrypt/live/example.com/privkey.pem
          This certificate expires on 2027-01-08.
          Certbot has set up a scheduled task to automatically renew this certificate in the background.

          Deploying certificate
          Successfully deployed certificate for example.com to /etc/nginx/conf.d/example.conf
          Successfully deployed certificate for www.example.com to /etc/nginx/conf.d/example.conf
          Congratulations! You have successfully enabled HTTPS on https://example.com and https://www.example.com
        hint: Für jeden Namen ein eigenes -d.
      - expect: "^sudo\\s+certbot\\s+renew\\s+--dry-run$"
        output: |
          Processing /etc/letsencrypt/renewal/example.com.conf
          Account registered.
          Simulating renewal of an existing certificate for example.com and www.example.com

          Congratulations, all simulated renewals succeeded:
            /etc/letsencrypt/live/example.com/fullchain.pem (success)
        hint: sudo certbot renew --dry-run
      - expect: "^curl\\s+-I\\s+https://example\\.com/?$"
        output: |
          HTTP/2 200
          server: nginx
          content-type: text/html
          strict-transport-security: max-age=31536000
        hint: curl -I https://example.com
    responses:
      - match: "^sudo\\s+certbot\\s+certificates"
        output: "Certificate Name: example.com\n    Domains: example.com www.example.com\n    Expiry Date: 2027-01-08 (VALID: 89 days)"
      - match: "^sudo\\s+nginx\\s+-t"
        output: "nginx: the configuration file /etc/nginx/nginx.conf syntax is ok\nnginx: configuration file /etc/nginx/nginx.conf test is successful"
    hints:
      - certbot prüft die Domain über Port 80 und trägt das Zertifikat danach selbst in die nginx-Konfiguration ein.
      - "`--dry-run` erneuert nur zum Schein, ohne echte Zertifikate zu verbrauchen."
    solution: |
      ```bash
      sudo certbot --nginx -d example.com -d www.example.com
      sudo certbot renew --dry-run
      curl -I https://example.com
      ```
  - id: https-konfig
    type: terminal
    title: Den HTTPS-server-Block selbst schreiben
    description: |
      Viele Teams lassen certbot die Konfiguration nicht verändern und schreiben sie selbst. Im Ordner
      `https-konfig` liegt `example.conf` mit dem bisherigen Port-80-Block. Baue daraus:

      1. **Block 1** (Port 80): `listen 80;`, `server_name example.com www.example.com;`, eine
         `location /.well-known/acme-challenge/` mit `root /var/www/certbot;` und eine `location /`
         mit `return 301 https://example.com$request_uri;`
      2. **Block 2** (HTTPS): `listen 443 ssl;`, `http2 on;`, `server_name example.com;`,
         `ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;`,
         `ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;` und der bisherige
         `root /srv/example.com/public;`

      Prüfe mit `bash pruefe.sh example.conf`. Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: https-konfig
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
      cat > example.conf <<'EOF'
      server {
          listen 80;
          server_name example.com www.example.com;
          root /srv/example.com/public;
          index index.html;
      }
      EOF
    checks:
      - type: command
        run: bash pruefe.sh example.conf
        message: example.conf hat noch Syntaxfehler. Führe bash pruefe.sh example.conf aus.
      - type: command
        run: test "$(grep -Ec '^\s*server\s*\{' example.conf)" = 2
        message: example.conf soll genau zwei server-Blöcke enthalten – einen für Port 80, einen für 443.
      - type: command
        run: grep -Eq '^\s*listen\s+443\s+ssl\s*;' example.conf && grep -Eq '^\s*http2\s+on\s*;' example.conf
        message: Der HTTPS-Block braucht listen 443 ssl; und http2 on;
      - type: command
        run: "! grep -Eq 'listen\\s+443\\s+ssl\\s+http2' example.conf"
        message: Der Parameter http2 an listen ist veraltet – nutze die eigene Zeile http2 on;
      - type: command
        run: grep -Eq '^\s*ssl_certificate\s+/etc/letsencrypt/live/example\.com/fullchain\.pem\s*;' example.conf && grep -Eq '^\s*ssl_certificate_key\s+/etc/letsencrypt/live/example\.com/privkey\.pem\s*;' example.conf
        message: Es fehlen ssl_certificate mit fullchain.pem oder ssl_certificate_key mit privkey.pem.
      - type: command
        run: bash pruefe.sh --baum example.conf | grep -Eq '^server > location /\.well-known/acme-challenge/ > root /var/www/certbot/?$'
        message: Im Port-80-Block fehlt location /.well-known/acme-challenge/ mit root /var/www/certbot;
      - type: command
        run: bash pruefe.sh --baum example.conf | grep -Eq '^server > location / > return 301 https://example\.com\$request_uri$'
        message: "Im Port-80-Block fehlt location / mit return 301 https://example.com$request_uri;"
      - type: command
        run: awk '/^[[:space:]]*server[[:space:]]*\{/{n++} n==2 && /^[[:space:]]*root[[:space:]]+\/srv\/example\.com\/public/{f=1} END{exit !f}' example.conf
        message: Der zweite (HTTPS-)Block braucht root /srv/example.com/public; – die Dateien kommen jetzt über HTTPS.
    hints:
      - Der Port-80-Block liefert nur noch die ACME-Dateien aus und leitet sonst alles auf HTTPS um.
      - "Die Weiterleitung: `location / { return 301 https://example.com$request_uri; }`"
      - Schreibe den HTTPS-Block als zweiten Block unter den ersten. `index index.html;` darf mit umziehen.
    solution: |
      ```nginx title="example.conf"
      server {
          listen 80;
          server_name example.com www.example.com;

          location /.well-known/acme-challenge/ {
              root /var/www/certbot;
          }

          location / {
              return 301 https://example.com$request_uri;
          }
      }

      server {
          listen 443 ssl;
          http2 on;
          server_name example.com;

          ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
          ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

          root /srv/example.com/public;
          index index.html;
      }
      ```
---

Ohne HTTPS markiert der Browser deine Seite als „Nicht sicher“, Passwörter gehen im
[[klartext|Klartext]] durchs Netz und moderne Funktionen wie HTTP/2 im Browser funktionieren nicht.
Früher kostete ein [[zertifikat|Zertifikat]] Geld und Nerven. Heute bekommst du es in einer Minute
kostenlos – und es erneuert sich von selbst.

## Let's Encrypt und ACME

[[lets-encrypt|Let's Encrypt]] ist eine kostenlose [[zertifizierungsstelle|Zertifizierungsstelle]].
Sie stellt Zertifikate automatisch über das Protokoll [[acme|ACME]] aus. Vorher musst du beweisen, dass
dir die Domain gehört – ganz ohne Formular.

Die häufigste Prüfung heißt [[http-01-challenge|HTTP-01]]:

1. Dein Programm (meist [[certbot]]) bittet um ein Zertifikat für `example.com`.
2. Let's Encrypt antwortet mit einem zufälligen Token.
3. certbot legt eine Datei mit diesem Token unter `/.well-known/acme-challenge/` ab.
4. Let's Encrypt ruft `http://example.com/.well-known/acme-challenge/<token>` auf.
5. Passt der Inhalt, wird das Zertifikat ausgestellt.

| Prüfung | Wie | Wann |
|---|---|---|
| HTTP-01 | Datei auf Port 80 | Standard für einzelne Domains |
| DNS-01 | TXT-Eintrag im DNS | für Wildcard-Zertifikate wie `*.example.com` |

> [!MERKSATZ]
> Für HTTP-01 muss Port 80 erreichbar sein und `/.well-known/acme-challenge/` ausliefern – auch wenn
> sonst alles auf HTTPS umgeleitet wird.

## certbot benutzen

certbot gibt es als Paket für alle großen Linux-Distributionen. Zwei Arbeitsweisen sind üblich:

```bash title="Variante 1: certbot passt nginx selbst an"
sudo certbot --nginx -d example.com -d www.example.com
```

```bash title="Variante 2: nur Zertifikat holen, Konfiguration selbst schreiben"
sudo certbot certonly --webroot -w /var/www/certbot -d example.com -d www.example.com
```

Die Dateien landen unter `/etc/letsencrypt/live/example.com/`:

| Datei | Inhalt | nginx-Direktive |
|---|---|---|
| `fullchain.pem` | Zertifikat plus [[zwischenzertifikat|Zwischenzertifikate]] | `ssl_certificate` |
| `privkey.pem` | [[privater-schluessel|privater Schlüssel]] | `ssl_certificate_key` |

Zertifikate gelten standardmäßig 90 Tage. certbot richtet einen Timer ein, der sie rechtzeitig
erneuert. Ob das klappt, testest du mit `sudo certbot renew --dry-run`.

> [!FEHLER]
> **Die Erneuerung schlägt nach Monaten still fehl.** Jemand hat eine Weiterleitung oder ein
> `deny all` gebaut, das auch `/.well-known/` trifft. Prüfe nach jeder Änderung an Port 80 mit
> `certbot renew --dry-run` und überwache das Ablaufdatum.

## Der server-Block für HTTPS

```nginx title="/etc/nginx/conf.d/example.conf"
server {
    listen 80;
    server_name example.com www.example.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://example.com$request_uri;
    }
}

server {
    listen 443 ssl;
    http2 on;
    server_name example.com;

    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_session_cache   shared:SSL:10m;

    root /srv/example.com/public;
}
```

| Direktive | Bedeutung |
|---|---|
| `listen 443 ssl;` | auf Port 443 mit [[tls|TLS]] lauschen |
| `http2 on;` | [[http-2|HTTP/2]] erlauben (seit nginx 1.25.1 eigene Direktive) |
| `ssl_certificate` / `_key` | Zertifikatskette und Schlüssel |
| `ssl_session_cache` | Wiederverbindungen ohne kompletten [[handshake|Handshake]] |

Die erlaubten TLS-Versionen musst du nicht setzen: Seit nginx 1.23.4 sind TLSv1.2 und TLSv1.3 der
Standard. Mehrere HTTPS-Domains auf einer IP funktionieren über [[sni|SNI]].

## Das Zertifikat prüfen

Nach dem Einrichten willst du wissen: Liefert der Server das richtige Zertifikat mit der kompletten
Kette, und wann läuft es ab? Zwei Befehle reichen:

```bash title="Zertifikat von außen prüfen"
curl -vI https://example.com 2>&1 | grep -E "subject:|expire date:|issuer:"
sudo certbot certificates
```

```text title="Ausschnitt aus curl -v"
*  subject: CN=example.com
*  expire date: Jan  8 09:12:44 2027 GMT
*  issuer: C=US; O=Let's Encrypt; CN=R12
```

| Prüfung | Woran du ein Problem erkennst |
|---|---|
| Name | `subject` oder die alternativen Namen enthalten deine Domain nicht |
| Ablaufdatum | weniger als 30 Tage übrig, obwohl certbot erneuern sollte |
| Kette | manche Clients melden „unable to get local issuer certificate“ – meist `cert.pem` statt `fullchain.pem` |

> [!TIPP]
> Richte eine Überwachung ein, die dich warnt, wenn ein Zertifikat in weniger als 14 Tagen abläuft.
> Viele Monitoring-Dienste können das nebenbei. So bemerkst du eine kaputte automatische Erneuerung,
> bevor es deine Besucher tun.

## HSTS: nie wieder HTTP

Die Weiterleitung von Port 80 hat eine Lücke: Der allererste Aufruf geht noch unverschlüsselt los.
Mit dem Header [[hsts|HSTS]] merkt sich der Browser, die Seite nur noch per HTTPS aufzurufen.

```nginx title="im HTTPS-server-Block"
add_header Strict-Transport-Security "max-age=31536000" always;
```

> [!PRAXIS]
> Schalte HSTS erst ein, wenn HTTPS stabil läuft – Browser halten sich ein Jahr daran. Den Zusatz
> `includeSubDomains` setzt man nur, wenn **alle** Subdomains HTTPS können. Den eigenen Server kannst du
> mit Online-Testern wie dem SSL-Test von Qualys prüfen.

## Zusammenfassung

- Let's Encrypt stellt kostenlose Zertifikate über ACME aus; certbot erledigt das auf dem Server.
- HTTP-01 prüft eine Datei unter `/.well-known/acme-challenge/` auf Port 80.
- `ssl_certificate` bekommt `fullchain.pem`, `ssl_certificate_key` bekommt `privkey.pem`.
- `listen 443 ssl;` plus `http2 on;` – der Parameter `http2` an listen ist veraltet.
- Port 80 leitet per `return 301` auf HTTPS um, HSTS verhindert künftige HTTP-Aufrufe.
