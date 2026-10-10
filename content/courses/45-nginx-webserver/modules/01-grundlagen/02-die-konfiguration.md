---
title: Die Konfiguration lesen und prüfen
summary: Wie nginx.conf aufgebaut ist – Direktiven, Kontexte wie events, http, server und location, include-Dateien – und wie du Änderungen mit nginx -t prüfst und per Reload ohne Ausfall übernimmst.
duration: 25
sources:
  - title: nginx – Beginner's Guide, Configuration File's Structure
    url: https://nginx.org/en/docs/beginners_guide.html#conf_structure
  - title: nginx – Core functionality (include, worker_processes, events)
    url: https://nginx.org/en/docs/ngx_core_module.html
  - title: nginx – Command-line parameters (-t, -T, -s)
    url: https://nginx.org/en/docs/switches.html
  - title: nginx – Controlling nginx
    url: https://nginx.org/en/docs/control.html
quiz:
  - type: find-bug
    question: nginx -t meldet einen Fehler. In welcher Zeile steckt er?
    language: nginx
    code: |
      http {
          include mime.types;
          server {
              listen 80;
              server_name example.com
              root /srv/shop/public;
          }
      }
    bug_line: 5
    explanation: >
      Hinter `server_name example.com` fehlt das Semikolon. nginx liest deshalb weiter und hält `root`
      und den Pfad für weitere Servernamen – die Fehlermeldung zeigt dann oft erst auf Zeile 6.
  - type: single
    question: Du hast die Konfiguration geändert. Was ist die sichere Reihenfolge?
    options:
      - "`systemctl restart nginx`, dann `nginx -t`"
      - "`nginx -t`, dann `systemctl reload nginx`"
      - Nur speichern – nginx liest Änderungen automatisch ein.
      - "`nginx -s stop`, dann `nginx`"
    answer: 1
    explanation: >
      Erst prüfen, dann neu laden. Ein Reload startet neue Worker mit der neuen Konfiguration und lässt
      die alten ihre laufenden Anfragen zu Ende bearbeiten. Ist die Konfiguration kaputt, behält nginx
      beim Reload die alte – ein Restart dagegen würde scheitern und die Seite wäre offline.
  - type: match
    question: In welchen Kontext gehört die Direktive typischerweise?
    pairs:
      - { left: "worker_processes auto;", right: "main (ganz außen)" }
      - { left: "worker_connections 1024;", right: "events" }
      - { left: "include mime.types;", right: "http" }
      - { left: "server_name example.com;", right: "server" }
      - { left: "try_files $uri =404;", right: "location (oder server)" }
    explanation: >
      Jede Direktive ist nur in bestimmten Kontexten erlaubt. Die Dokumentation nennt sie bei jeder
      Direktive unter „Context“.
  - type: cloze
    text: "Einfache Direktiven enden mit einem ___. Block-Direktiven wie `server` umschließen ihren Inhalt mit ___."
    blanks:
      - [Semikolon, ";"]
      - [geschweiften Klammern, geschweifte Klammern, "{}", Klammern]
    explanation: Ein fehlendes Semikolon oder eine fehlende schließende Klammer sind die häufigsten Syntaxfehler.
tasks:
  - id: konfig-reparieren
    type: terminal
    title: Eine kaputte nginx.conf reparieren
    description: |
      Im Ordner `konfig-reparieren` liegt eine `nginx.conf` mit **zwei Syntaxfehlern**. Im Übungs-Terminal
      gibt es kein nginx, deshalb liegt daneben das Skript `pruefe.sh` – eine kleine Stacklab-Prüfung, die
      wie `nginx -t` fehlende Semikolons und Klammern findet (aber nicht jede Direktive kennt).

      1. Lass die Prüfung laufen: `bash pruefe.sh nginx.conf`.
      2. Repariere beide Fehler mit `nano nginx.conf`.
      3. Ergänze im `server`-Block die Zeile `index index.html;`.
      4. Lass dir mit `bash pruefe.sh --baum nginx.conf` anzeigen, in welchem Kontext jede Direktive steht.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit die Dateien angelegt werden.
    workdir: konfig-reparieren
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
      cat > nginx.conf <<'EOF'
      worker_processes auto;

      events {
          worker_connections 1024;
      }

      http {
          include mime.types;
          default_type application/octet-stream;

          server {
              listen 80;
              server_name example.com
              root /srv/example.com/public;

              location / {
                  try_files $uri $uri/ =404;
              }
      }
      EOF
    checks:
      - type: command
        run: bash pruefe.sh nginx.conf
        message: Die Mini-Prüfung findet noch Fehler. Führe bash pruefe.sh nginx.conf aus und lies die Meldungen.
      - type: command
        run: grep -Eq '^\s*server_name\s+example\.com\s*;' nginx.conf
        message: Hinter server_name example.com fehlt noch das Semikolon.
      - type: command
        run: bash pruefe.sh --baum nginx.conf | grep -Eq '^http > server > index index\.html$'
        message: Im server-Block (nicht in location) fehlt noch die Zeile index index.html;
      - type: command
        run: bash pruefe.sh --baum nginx.conf | grep -Eq '^http > server > location / > try_files'
        message: Der location-Block mit try_files soll im server-Block erhalten bleiben. Prüfe, wo die fehlende } hingehört.
    hints:
      - Die Prüfung nennt dir Dateiname und Zeilennummer. Eine Meldung betrifft ein Semikolon, die andere eine Klammer.
      - "Zähle die Klammern: `http {`, `server {` und `location / {` öffnen drei Blöcke – wie viele `}` gibt es?"
      - "Hinter `server_name example.com` gehört ein `;`. Nach dem location-Block fehlt die `}`, die den server-Block schließt. `index index.html;` schreibst du z. B. unter die root-Zeile."
    solution: |
      ```nginx
      worker_processes auto;

      events {
          worker_connections 1024;
      }

      http {
          include mime.types;
          default_type application/octet-stream;

          server {
              listen 80;
              server_name example.com;
              root /srv/example.com/public;
              index index.html;

              location / {
                  try_files $uri $uri/ =404;
              }
          }
      }
      ```
      Danach: `bash pruefe.sh nginx.conf` und `bash pruefe.sh --baum nginx.conf`.
  - id: pruefen-und-neu-laden
    type: simulated
    title: Änderung prüfen und ohne Ausfall übernehmen
    description: |
      Auf dem Server `203.0.113.10` hast du gerade `/etc/nginx/conf.d/shop.conf` bearbeitet. Übernimm
      die Änderung sicher:

      1. Prüfe die gesamte Konfiguration mit `sudo nginx -t`.
      2. nginx meldet einen Fehler. Er ist inzwischen behoben – prüfe mit `sudo nginx -t` erneut.
      3. Lade die Konfiguration mit `sudo systemctl reload nginx` neu.
    prompt: "deploy@server:~$"
    steps:
      - expect: "^sudo\\s+nginx\\s+-t$"
        output: |
          nginx: [emerg] unexpected "}" in /etc/nginx/conf.d/shop.conf:14
          nginx: configuration file /etc/nginx/nginx.conf test failed
        hint: sudo nginx -t
      - expect: "^sudo\\s+nginx\\s+-t$"
        output: |
          nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
          nginx: configuration file /etc/nginx/nginx.conf test is successful
        hint: Noch einmal sudo nginx -t
      - expect: "^sudo\\s+(systemctl\\s+reload\\s+nginx|nginx\\s+-s\\s+reload)$"
        output: ""
        hint: sudo systemctl reload nginx
    responses:
      - match: "^sudo\\s+systemctl\\s+restart"
        output: "Ein Restart beendet alle laufenden Verbindungen. Nimm lieber reload."
      - match: "^sudo\\s+nginx\\s+-T"
        output: "# configuration file /etc/nginx/nginx.conf:\nuser www-data;\nworker_processes auto;\n..."
    hints:
      - "`-t` steht für test."
      - "`reload` übernimmt die neue Konfiguration, ohne laufende Verbindungen abzubrechen."
    solution: |
      ```bash
      sudo nginx -t
      # Fehler beheben, dann erneut:
      sudo nginx -t
      sudo systemctl reload nginx
      ```
---

Du öffnest zum ersten Mal die Konfiguration eines Servers und siehst hunderte Zeilen voller
geschweifter Klammern. Keine Sorge: Die Datei folgt einem einfachen Muster aus nur zwei Bausteinen.
Wer das Muster kennt, findet sich in jeder nginx-Konfiguration zurecht.

## Direktiven und Blöcke

Eine nginx-Konfiguration besteht aus [[nginx-direktive|Direktiven]]. Es gibt zwei Arten:

| Art | Aufbau | Beispiel |
|---|---|---|
| einfache Direktive | Name, Werte, Semikolon | `listen 80;` |
| Block-Direktive | Name, Werte, Inhalt in `{ }` | `server { … }` |

Eine Block-Direktive bildet einen [[nginx-kontext|Kontext]]. Darin stehen weitere Direktiven, die nur
für diesen Bereich gelten. Kommentare beginnen mit `#`.

```nginx title="/etc/nginx/nginx.conf (gekürzt)"
user www-data;
worker_processes auto;          # main-Kontext

events {
    worker_connections 1024;    # events-Kontext
}

http {
    include mime.types;         # http-Kontext
    server {
        listen 80;              # server-Kontext
        location / {
            root /var/www/html; # location-Kontext
        }
    }
}
```

> [!MERKSATZ]
> Jede einfache Direktive endet mit `;`, jede geöffnete `{` braucht eine schließende `}`.

## Die Kontexte

Die Kontexte sind ineinander verschachtelt wie russische Puppen:

| Kontext | Gilt für | Typische Direktiven |
|---|---|---|
| main | den ganzen nginx-Prozess | `user`, `worker_processes`, `error_log` |
| `events` | Verbindungsverwaltung | `worker_connections` |
| `http` | alle Websites | `include mime.types`, `gzip`, `log_format` |
| `server` | eine Website (Domain + Port) | `listen`, `server_name`, `root` |
| `location` | bestimmte Pfade | `try_files`, `proxy_pass`, `expires` |

Viele Direktiven sind in mehreren Kontexten erlaubt und werden nach innen **vererbt**: Ein `root` im
`server` gilt in allen `location`-Blöcken, solange dort kein eigenes `root` steht. Welche Kontexte
erlaubt sind, steht in der Dokumentation jeder Direktive unter „Context“.

> [!FEHLER]
> **`proxy_pass` im http-Block.** nginx antwortet mit
> `"proxy_pass" directive is not allowed here`. Die Direktive ist nur in `location` erlaubt. Die
> Meldung „not allowed here“ heißt immer: richtiger Name, falscher Kontext.

## include und die Ordnerstruktur

Damit nicht alles in einer Riesendatei steht, holt `include` andere Dateien an genau dieser Stelle
herein – auch mit [[glob-muster|Glob-Mustern]].

```nginx title="Ende des http-Blocks"
http {
    include mime.types;
    include /etc/nginx/conf.d/*.conf;
}
```

| Pfad | Inhalt |
|---|---|
| `/etc/nginx/nginx.conf` | Hauptdatei mit main, events und http |
| `/etc/nginx/mime.types` | Zuordnung Dateiendung → [[mime-typ|MIME-Typ]] |
| `/etc/nginx/conf.d/*.conf` | ein server-Block pro Website |
| `/etc/nginx/sites-available/`, `sites-enabled/` | Debian-Variante: aktiviert per [[symlink|Symlink]] |
| `/var/log/nginx/` | Access- und Error-Log |

> [!PRAXIS]
> In Projekten liegt meist pro Website eine Datei in `conf.d/`, etwa `shop.conf` und `api.conf`. Wer
> eine neue Seite anlegt, fasst die Hauptdatei gar nicht an. Mit `nginx -T` gibst du die komplette,
> zusammengesetzte Konfiguration aus – praktisch, um zu sehen, was wirklich gilt.

## Eine fremde Konfiguration lesen

Wenn du auf einem Server eine Konfiguration übernimmst, gehst du am besten immer gleich vor – von
außen nach innen:

1. **`nginx -T | less`** ausgeben lassen. So siehst du alle Dateien zusammengesetzt, auch die per
   `include` eingebundenen. Jede Datei beginnt mit einer Kommentarzeile `# configuration file …`.
2. **server-Blöcke suchen.** Mit `nginx -T | grep -n "server_name"` findest du schnell, welche Domains
   es gibt und in welcher Datei sie stehen.
3. **Für deine Domain den Block lesen:** Auf welchem Port lauscht er, wo liegt `root`?
4. **Die locations durchgehen:** Welche Pfade bekommen Sonderregeln? Davon handelt das nächste Modul.
5. **Vererbte Werte beachten:** Was nicht im Block steht, kommt von außen – aus `http` oder als
   eingebauter Standardwert.

```bash title="Alle Domains und ihre Dateien finden"
sudo nginx -T 2>/dev/null | grep -nE "configuration file|server_name"
```

Fehlt eine Direktive komplett, gilt ihr Standardwert. Den findest du in der Dokumentation unter
„Default“ – etwa `client_max_body_size 1m;`. Viele Überraschungen im Betrieb entstehen genau dort: Ein
Wert, den niemand gesetzt hat, gilt trotzdem.

## Prüfen und neu laden

Bevor eine Änderung live geht, prüfst du sie mit `nginx -t`. nginx liest dann alle Dateien, meldet
Fehler mit Datei und Zeile und ändert am laufenden Server nichts.

```bash title="Der sichere Ablauf"
sudo nginx -t
sudo systemctl reload nginx
```

Beim [[graceful-reload|Reload]] liest der Master die neue Konfiguration, startet neue Worker und lässt
die alten ihre laufenden Anfragen zu Ende bearbeiten. Kein Besucher merkt etwas. Ein Restart beendet
dagegen alle Verbindungen sofort.

| Befehl | Wirkung |
|---|---|
| `nginx -t` | Konfiguration prüfen |
| `nginx -T` | prüfen und komplette Konfiguration ausgeben |
| `systemctl reload nginx` oder `nginx -s reload` | neu laden ohne Ausfall |
| `systemctl restart nginx` | hart neu starten |

> [!TIPP]
> `systemctl` gehört zu [[systemd]], das auf den meisten Linux-Servern Dienste startet und überwacht.

## Zusammenfassung

- Die Konfiguration besteht aus einfachen Direktiven (mit `;`) und Block-Direktiven (mit `{ }`).
- Kontexte sind verschachtelt: main → events / http → server → location.
- Viele Direktiven werden nach innen vererbt; jede ist nur in bestimmten Kontexten erlaubt.
- `include` holt weitere Dateien herein, üblich ist eine Datei pro Website in `conf.d/`.
- Immer erst `nginx -t`, dann `systemctl reload nginx` – nie blind neu starten.
