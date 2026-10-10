---
title: Server-Blöcke und virtuelle Hosts
summary: Wie ein nginx viele Websites gleichzeitig bedient, wie er über listen und server_name den passenden server-Block auswählt und warum jeder Server einen bewusst gesetzten default_server braucht.
duration: 20
sources:
  - title: nginx – How nginx processes a request
    url: https://nginx.org/en/docs/http/request_processing.html
  - title: nginx – Server names
    url: https://nginx.org/en/docs/http/server_names.html
  - title: nginx – listen-Direktive
    url: https://nginx.org/en/docs/http/ngx_http_core_module.html#listen
quiz:
  - type: single
    question: Woran erkennt nginx bei einer HTTP-Anfrage auf Port 80, welche Website gemeint ist?
    options:
      - An der IP-Adresse des Browsers
      - Am Host-Header der Anfrage
      - Am Dateinamen in der URL
      - Am User-Agent
    answer: 1
    explanation: >
      Alle Domains zeigen auf dieselbe IP. Der Browser schickt den Namen der Domain im Header `Host` mit,
      und nginx vergleicht ihn mit den `server_name`-Einträgen.
  - type: multiple
    question: "Welche Anfragen landen bei dieser Konfiguration im Block mit `server_name shop.example.com`? (Nur zwei server-Blöcke auf Port 80; der erste ist `default_server` für `_`.)"
    options:
      - "Host: shop.example.com"
      - "Host: SHOP.example.com"
      - "Host: blog.example.com"
      - "Anfrage direkt an die IP 203.0.113.10 ohne passenden Namen"
    answers: [0, 1]
    explanation: >
      Servernamen werden ohne Beachtung der Groß- und Kleinschreibung verglichen. Unbekannte Namen und
      reine IP-Anfragen gehen an den default_server.
  - type: cloze
    text: "Passt kein server_name, beantwortet der Block mit dem Parameter ___ an der listen-Direktive die Anfrage. Fehlt er, nimmt nginx den ___ server-Block für diesen Port."
    blanks:
      - [default_server]
      - [ersten]
    explanation: Weil „der erste“ von der Reihenfolge der include-Dateien abhängt, setzt man default_server immer bewusst.
  - type: match
    question: Welcher server_name passt auf welchen Host?
    pairs:
      - { left: "example.com www.example.com", right: "beide Schreibweisen der Hauptdomain" }
      - { left: "*.example.com", right: "jede Subdomain wie api.example.com" }
      - { left: "~^(?<kunde>.+)\\.example\\.net$", right: "regulärer Ausdruck mit benannter Gruppe" }
      - { left: "_", right: "kein echter Name – Platzhalter im default_server" }
    explanation: Exakte Namen werden zuerst geprüft, dann Wildcards, dann reguläre Ausdrücke in Reihenfolge.
tasks:
  - id: zwei-websites
    type: terminal
    title: Zwei Websites und ein Auffang-Server
    description: |
      Im Ordner `zwei-websites` liegt eine fertige `nginx.conf`, die alle Dateien aus `conf.d/` einbindet.
      Lege dort drei server-Blöcke an – jeden in eine eigene Datei:

      1. `conf.d/00-default.conf`: `listen 80 default_server;`, `server_name _;` und `return 444;`
         (nginx schließt die Verbindung dann ohne Antwort).
      2. `conf.d/shop.conf`: `listen 80;`, `server_name shop.example.com;`, `root /srv/shop/public;`
      3. `conf.d/blog.conf`: `listen 80;`, `server_name blog.example.com www.blog.example.com;`,
         `root /srv/blog/public;`

      Prüfe am Ende alle Dateien mit `bash pruefe.sh conf.d/*.conf`. Klicke zuerst auf
      **Aufgabe vorbereiten**.
    workdir: zwei-websites
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
      events {}

      http {
          include mime.types;
          include conf.d/*.conf;
      }
      EOF
    checks:
      - type: command
        run: bash pruefe.sh conf.d/00-default.conf conf.d/shop.conf conf.d/blog.conf
        message: Mindestens eine der drei Dateien fehlt oder hat einen Syntaxfehler. Führe bash pruefe.sh conf.d/*.conf aus.
      - type: command
        run: grep -Eq '^\s*listen\s+80\s+default_server\s*;' conf.d/00-default.conf && grep -Eq '^\s*return\s+444\s*;' conf.d/00-default.conf
        message: "In conf.d/00-default.conf fehlt listen 80 default_server; oder return 444;"
      - type: command
        run: test "$(cat conf.d/*.conf | grep -Ec 'default_server')" = 1
        message: Genau ein server-Block soll default_server sein – der in 00-default.conf.
      - type: command
        run: grep -Eq '^\s*server_name\s+shop\.example\.com\s*;' conf.d/shop.conf && grep -Eq '^\s*root\s+/srv/shop/public/?\s*;' conf.d/shop.conf
        message: "conf.d/shop.conf braucht server_name shop.example.com; und root /srv/shop/public;"
      - type: command
        run: grep -Eq '^\s*server_name\s+(blog\.example\.com\s+www\.blog\.example\.com|www\.blog\.example\.com\s+blog\.example\.com)\s*;' conf.d/blog.conf && grep -Eq '^\s*root\s+/srv/blog/public/?\s*;' conf.d/blog.conf
        message: conf.d/blog.conf braucht beide Namen in einer server_name-Zeile und root /srv/blog/public;
      - type: command
        run: for f in conf.d/00-default.conf conf.d/shop.conf conf.d/blog.conf; do bash pruefe.sh --baum "$f" | grep -q '^server > listen' || exit 1; done
        message: Jede Datei braucht einen server { … }-Block mit einer listen-Direktive darin.
    hints:
      - Jede Datei enthält genau einen Block `server { … }`. Der http-Block steht schon in nginx.conf.
      - Mit `cat > conf.d/shop.conf <<'EOF'` … `EOF` schreibst du mehrzeilige Dateien direkt im Terminal – oder du nimmst `nano`.
      - "Der Auffang-Server: `server { listen 80 default_server; server_name _; return 444; }` – gern auf mehrere Zeilen verteilt."
    solution: |
      ```nginx title="conf.d/00-default.conf"
      server {
          listen 80 default_server;
          server_name _;
          return 444;
      }
      ```
      ```nginx title="conf.d/shop.conf"
      server {
          listen 80;
          server_name shop.example.com;
          root /srv/shop/public;
      }
      ```
      ```nginx title="conf.d/blog.conf"
      server {
          listen 80;
          server_name blog.example.com www.blog.example.com;
          root /srv/blog/public;
      }
      ```
  - id: host-header
    type: request
    title: Die richtige Website ansprechen
    description: |
      Auf dem Server `203.0.113.10` laufen `shop.example.com` und `blog.example.com`. Der DNS-Eintrag für
      den Blog existiert noch nicht. Du willst den Blog trotzdem testen und schickst eine Anfrage direkt an
      die IP-Adresse.

      Baue eine `GET`-Anfrage auf die Startseite `/` und setze den Header so, dass nginx den **Blog**
      ausliefert.
    base_url: http://203.0.113.10
    expected:
      method: GET
      path: "^/$"
      headers: { Host: "^blog\\.example\\.com$" }
    response:
      status: 200
      body: "<!doctype html><title>Blog</title><h1>Willkommen im Blog</h1>"
    hints:
      - nginx wählt den server-Block anhand eines bestimmten Headers.
      - "Setze `Host: blog.example.com`."
    solution: |
      `GET /` mit dem Header `Host: blog.example.com`. Im Terminal entspricht das
      `curl -H "Host: blog.example.com" http://203.0.113.10/`.
---

Ein kleiner Server kostet ein paar Euro im Monat – und trotzdem laufen darauf oft fünf Websites:
der Shop, der Blog, eine Testumgebung. Alle teilen sich dieselbe IP-Adresse und denselben Port 80.
Woher weiß nginx, welche Seite der Besucher sehen will?

## Ein server-Block pro Website

Für jede Website schreibst du einen [[server-block|server-Block]]. Er sagt: „Auf diesem Port und für
diese Namen bin ich zuständig.“ Das Konzept heißt allgemein [[virtual-host|virtueller Host]].

```nginx title="/etc/nginx/conf.d/shop.conf"
server {
    listen 80;
    listen [::]:80;
    server_name shop.example.com;
    root /srv/shop/public;
    index index.html;
}
```

| Direktive | Bedeutung |
|---|---|
| `listen 80;` | auf Port 80 aller [[ipv4|IPv4]]-Adressen warten |
| `listen [::]:80;` | dasselbe für [[ipv6|IPv6]] |
| `server_name` | einer oder mehrere Domainnamen, durch Leerzeichen getrennt |
| `root` | Ordner, aus dem Dateien kommen ([[document-root|Document Root]]) |
| `index` | Datei, die bei Ordner-Anfragen wie `/` geliefert wird |

> [!MERKSATZ]
> Eine Website = ein server-Block, meist in einer eigenen Datei unter `conf.d/`.

## Wie nginx den server-Block wählt

Die Auswahl läuft in zwei Stufen:

1. **listen:** Nur Blöcke, deren `listen` zu IP und Port der Verbindung passt, kommen infrage.
2. **server_name:** Unter diesen vergleicht nginx den [[host-header|Host-Header]] der Anfrage mit
   den `server_name`-Einträgen.

```http title="Was der Browser schickt"
GET /produkte HTTP/1.1
Host: shop.example.com
Accept: text/html
```

Beim Vergleich gilt eine feste Reihenfolge: exakter Name, dann [[wildcard|Wildcard]] am Anfang
(`*.example.com`), dann Wildcard am Ende (`mail.*`), dann reguläre Ausdrücke (beginnen mit `~`) in
der Reihenfolge der Konfiguration. Groß- und Kleinschreibung spielt keine Rolle.

> [!TIPP]
> Mit `curl -H "Host: shop.example.com" http://203.0.113.10/` testest du einen server-Block, bevor der
> DNS-Eintrag existiert.

## DNS und nginx arbeiten zusammen

Damit ein Name überhaupt bei deinem nginx ankommt, braucht es zwei Dinge:

| Schritt | Wer | Was passiert |
|---|---|---|
| 1 | [[dns|DNS]] | `shop.example.com` und `blog.example.com` zeigen per [[a-record|A-Record]] auf `203.0.113.10` |
| 2 | Browser | baut eine Verbindung zu `203.0.113.10:80` auf und schickt `Host: blog.example.com` |
| 3 | nginx | wählt anhand des Host-Headers den passenden server-Block |

DNS sorgt also nur dafür, dass der Browser **den richtigen Server** findet. Welche **Website** er
bekommt, entscheidet nginx. Deshalb funktionieren beliebig viele Domains mit einer einzigen IP.

Bevor ein DNS-Eintrag existiert, kannst du einen neuen server-Block trotzdem testen:

```bash title="Zwei Wege zum Testen ohne DNS"
curl -H "Host: blog.example.com" http://203.0.113.10/
curl --resolve blog.example.com:80:203.0.113.10 http://blog.example.com/
```

Die zweite Variante funktioniert auch später mit HTTPS, weil `curl` den Namen dann korrekt für die
Zertifikatsprüfung verwendet. Für den Browser trägst du die Zuordnung vorübergehend in die
[[hosts-datei|Hosts-Datei]] ein.

## Der default_server

Was passiert, wenn kein Name passt – etwa bei einem Aufruf über die nackte IP oder bei einem
Tippfehler? Dann antwortet der [[default-server|Default-Server]] für diesen Port. Ohne Angabe ist das
der **erste** passende Block – und welcher das ist, hängt von der Reihenfolge der include-Dateien ab.

```nginx title="/etc/nginx/conf.d/00-default.conf"
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    return 444;
}
```

`_` ist kein besonderer Name, sondern ein Wert, der garantiert nie passt. `return 444;` ist ein
nginx-eigener Code: Die Verbindung wird ohne Antwort geschlossen.

> [!FEHLER]
> **Der Shop erscheint unter fremden Domains.** Ohne bewussten default_server beantwortet zufällig der
> erste Block – oft der Shop – jede Anfrage. Dann ist deine Seite auch unter Domains erreichbar, die
> irgendwer auf deine IP zeigen lässt. Suchmaschinen indexieren sie dort doppelt.

## Weiterleitungen zwischen Namen

Oft soll eine Website nur unter **einem** Namen erreichbar sein. Den zweiten Namen leitest du per
[[weiterleitung|Weiterleitung]] um:

```nginx title="www auf die Hauptdomain umleiten"
server {
    listen 80;
    server_name www.example.com;
    return 301 http://example.com$request_uri;
}
```

`$request_uri` ist eine [[nginx-variable|nginx-Variable]] und enthält Pfad und Query-String der
ursprünglichen Anfrage. `301` bedeutet „dauerhaft umgezogen“ – Browser und Suchmaschinen merken sich
das.

> [!PRAXIS]
> In Projekten gibt es typischerweise einen default_server, der alles Unbekannte abweist, einen Block
> für die Hauptdomain und einen für die Weiterleitung von `www`. Sobald HTTPS dazukommt, leitet der
> Port-80-Block alles auf `https://` um – das lernst du im letzten Modul.

## Zusammenfassung

- Ein server-Block beschreibt eine Website: `listen`, `server_name`, `root`, `index`.
- nginx filtert zuerst nach IP und Port (`listen`), dann nach dem Host-Header (`server_name`).
- Exakte Namen schlagen Wildcards, Wildcards schlagen reguläre Ausdrücke.
- Passt kein Name, antwortet der `default_server` – setze ihn immer bewusst, z. B. mit `return 444;`.
- `return 301 …$request_uri;` leitet einen Namen dauerhaft auf einen anderen um.
