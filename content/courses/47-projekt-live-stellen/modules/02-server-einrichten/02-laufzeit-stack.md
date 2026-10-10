---
title: Den Laufzeit-Stack installieren
summary: nginx, PHP-FPM mit den richtigen Erweiterungen, Composer, Datenbank und Supervisor installieren – als wiederholbares Skript.
duration: 25
sources:
  - title: Laravel 13 – Server Requirements
    url: https://laravel.com/docs/13.x/deployment#server-requirements
  - title: Ubuntu Server – Install and configure PHP
    url: https://documentation.ubuntu.com/server/how-to/web-services/install-php/
  - title: PostgreSQL – createuser und createdb
    url: https://www.postgresql.org/docs/current/app-createuser.html
  - title: systemctl(1)
    url: https://www.freedesktop.org/software/systemd/man/latest/systemctl.html
quiz:
  - type: single
    question: Warum nutzt man in Skripten `apt-get` statt `apt`?
    options:
      - apt-get ist schneller.
      - Die Ausgabe und Optionen von apt-get sind stabil für Skripte; apt ist für Menschen am Terminal gedacht und warnt, dass sich seine Ausgabe ändern kann.
      - apt kann keine Pakete installieren.
      - apt-get braucht kein root.
    answer: 1
    explanation: apt ist die bequeme Oberfläche für Menschen. In Skripten nimmst du apt-get, dessen Verhalten verlässlich bleibt.
  - type: multiple
    question: Welche Pakete brauchst du für eine Laravel-App mit PostgreSQL, Queue-Worker und nginx mindestens?
    options:
      - nginx
      - php8.5-fpm und php8.5-pgsql
      - supervisor
      - apache2
    answers: [0, 1, 2]
    explanation: Apache wäre ein zweiter Webserver und würde sich mit nginx um Port 80 streiten.
  - type: cloze
    text: "Mit `sudo systemctl ___ --now nginx` startest du nginx sofort und bei jedem Hochfahren. Den Zustand zeigt `systemctl ___ nginx`."
    blanks:
      - [enable]
      - [status]
    explanation: enable trägt den Dienst für den Systemstart ein, --now startet ihn zusätzlich sofort.
  - type: match
    question: Ordne jeden Befehl seiner Wirkung zu.
    pairs:
      - { left: "systemctl reload php8.5-fpm", right: "Konfiguration neu lesen ohne Abbruch laufender Anfragen" }
      - { left: "systemctl restart nginx", right: "Dienst komplett stoppen und neu starten" }
      - { left: "journalctl -u nginx", right: "Protokoll eines Dienstes anzeigen" }
      - { left: "php -m", right: "geladene PHP-Erweiterungen auflisten" }
    explanation: reload ist sanfter als restart. Logs eines Dienstes findest du mit journalctl -u.
tasks:
  - id: provision-skript
    type: terminal
    title: Ein Provisionierungs-Skript schreiben
    description: |
      Du schreibst das Skript, das einen frisch gehärteten Server mit allem ausstattet, was deine App braucht.
      Stacklab führt es danach mit **Attrappen** für `apt-get`, `systemctl` und `chown` aus und prüft, was es
      aufgerufen hätte. Klicke zuerst auf **Aufgabe vorbereiten** (legt die Attrappen an).

      Schreibe im Ordner `provision` die Datei `provision.sh`:

      1. Erste Zeile `#!/usr/bin/env bash`, danach `set -euo pipefail`.
      2. Eine Variable `BASE="${BASE:-/var/www/example.com}"` – so kann Stacklab den Pfad umbiegen.
      3. `apt-get update` und danach **ein** `apt-get install -y` mit diesen Paketen: `nginx`, `php8.5-fpm`,
         `php8.5-cli`, `php8.5-mbstring`, `php8.5-xml`, `php8.5-curl`, `php8.5-pgsql`, `php8.5-intl`,
         `php8.5-zip`, `postgresql`, `supervisor`, `composer`, `git`, `unzip`.
      4. `systemctl enable --now` für `nginx`, `php8.5-fpm`, `postgresql` und `supervisor`.
      5. `mkdir -p "$BASE/releases" "$BASE/shared/storage"` und danach `chown -R deploy:www-data "$BASE"`.

      Teste selbst mit `bash -n provision.sh`.
    workdir: provision
    setup: |
      mkdir -p .attrappen
      for c in apt-get systemctl chown; do
        printf '#!/usr/bin/env bash\necho "%s $*" >> "${ATTRAPPEN_LOG:?}"\n' "$c" > ".attrappen/$c"
        chmod +x ".attrappen/$c"
      done
    checks:
      - type: command
        run: bash -n provision.sh && head -n1 provision.sh
        stdout_matches: "^#!/usr/bin/env bash$"
        message: provision.sh fehlt, hat einen Syntaxfehler oder beginnt nicht mit #!/usr/bin/env bash.
      - type: dir_exists
        path: .attrappen
        message: Die Attrappen fehlen – klicke auf „Aufgabe vorbereiten“.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          ATTRAPPEN_LOG="$d/log" BASE="$d/www" PATH="$PWD/.attrappen:$PATH" bash provision.sh >/dev/null 2>&1; rc=$?
          test -d "$d/www/releases" && test -d "$d/www/shared/storage" && echo ordner
          rm -rf "$d"; exit $rc
        stdout_equals: ordner
        message: Das Skript bricht ab oder legt "$BASE/releases" und "$BASE/shared/storage" nicht an. Nutzt du die Variable BASE?
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          ATTRAPPEN_LOG="$d/log" BASE="$d/www" PATH="$PWD/.attrappen:$PATH" bash provision.sh >/dev/null 2>&1
          grep -n '^apt-get' "$d/log" | head -1 | grep -q 'apt-get update' || echo "update fehlt oder nicht zuerst"
          line=$(grep '^apt-get install' "$d/log" | head -1)
          for p in nginx php8.5-fpm php8.5-cli php8.5-mbstring php8.5-xml php8.5-curl php8.5-pgsql php8.5-intl php8.5-zip postgresql supervisor composer git unzip; do
            echo " $line " | grep -q " $p " || echo "fehlt $p"
          done
          echo " $line " | grep -q ' -y ' || echo "ohne -y"
          rm -rf "$d"
        stdout_equals: ""
        message: Es fehlt `apt-get update` am Anfang oder ein `apt-get install -y` mit allen vierzehn Paketen in einem Aufruf.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          ATTRAPPEN_LOG="$d/log" BASE="$d/www" PATH="$PWD/.attrappen:$PATH" bash provision.sh >/dev/null 2>&1
          for s in nginx php8.5-fpm postgresql supervisor; do
            grep -E "^systemctl enable --now( .*)? $s( |$)" "$d/log" >/dev/null || echo "fehlt $s"
          done
          rm -rf "$d"
        stdout_equals: ""
        message: Starte nginx, php8.5-fpm, postgresql und supervisor mit `systemctl enable --now`.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          ATTRAPPEN_LOG="$d/log" BASE="$d/www" PATH="$PWD/.attrappen:$PATH" bash provision.sh >/dev/null 2>&1
          grep -E "^chown -R deploy:www-data $d/www$" "$d/log" >/dev/null && echo ok
          rm -rf "$d"
        stdout_equals: ok
        message: "Am Ende fehlt `chown -R deploy:www-data \"$BASE\"`."
    hints:
      - "Mehrere Pakete schreibst du in einen Aufruf: `apt-get install -y nginx php8.5-fpm …` – mit `\\` am Zeilenende darfst du umbrechen."
      - "`systemctl enable --now nginx php8.5-fpm postgresql supervisor` geht in einer Zeile."
      - "Setze `\"$BASE\"` immer in Anführungszeichen."
    solution: |
      ```bash title="provision/provision.sh"
      #!/usr/bin/env bash
      set -euo pipefail

      BASE="${BASE:-/var/www/example.com}"

      apt-get update
      apt-get install -y \
        nginx \
        php8.5-fpm php8.5-cli php8.5-mbstring php8.5-xml php8.5-curl \
        php8.5-pgsql php8.5-intl php8.5-zip \
        postgresql supervisor composer git unzip

      systemctl enable --now nginx php8.5-fpm postgresql supervisor

      mkdir -p "$BASE/releases" "$BASE/shared/storage"
      chown -R deploy:www-data "$BASE"
      ```
  - id: stack-reihenfolge
    type: order
    title: In welcher Reihenfolge richtest du den Stack ein?
    description: Bring die Schritte für einen frisch gehärteten Server in eine sinnvolle Reihenfolge.
    items:
      - Paketlisten aktualisieren (apt-get update)
      - nginx, PHP-FPM, Datenbank und Supervisor installieren
      - Dienste mit systemctl enable --now starten
      - Datenbank-Benutzer und Datenbank für die App anlegen
      - Projektordner anlegen und dem Benutzer deploy übergeben
      - Mit php -m und systemctl status prüfen, ob alles läuft
---
Der Server ist abgesichert, aber leer. Jetzt kommt der **Laufzeit-Stack**: alle Programme, die deine
Laravel-App zum Leben braucht. Du könntest jedes Paket einzeln von Hand installieren – aber spätestens
beim zweiten Server wüsstest du nicht mehr genau, was du damals getan hast. Deshalb schreibst du die
Installation als Skript.

## Was eine Laravel-App braucht

Laravel 13 setzt mindestens PHP 8.3 und eine Handvoll Erweiterungen voraus (u. a. mbstring, xml, curl,
openssl, pdo). Wir nehmen **PHP 8.5**, das Ubuntu 26.04 LTS direkt mitbringt.

| Paket | Aufgabe |
|---|---|
| `nginx` | Webserver, nimmt HTTP(S) an |
| `php8.5-fpm` | führt PHP aus ([[php-fpm\|PHP-FPM]]) |
| `php8.5-cli` | PHP für Artisan, Composer und Worker |
| `php8.5-mbstring`, `-xml`, `-curl`, `-intl`, `-zip` | Erweiterungen für Laravel und Pakete |
| `php8.5-pgsql` | Datenbanktreiber für [[postgresql\|PostgreSQL]] (für MySQL: `php8.5-mysql`) |
| `postgresql` | die Datenbank selbst |
| `supervisor` | hält Queue-Worker am Leben |
| `composer`, `git`, `unzip` | Code holen und Abhängigkeiten installieren |

Node.js brauchst du nur, wenn du die Frontend-Assets **auf dem Server** baust. Besser ist es, sie in der
CI-Pipeline zu bauen und fertig mitzuliefern.

> [!FEHLER]
> Für die Datenbank `php8.5-pgsql` vergessen. Die App startet, aber jede Anfrage endet mit
> „could not find driver“. Prüfe mit `php -m`, welche Erweiterungen wirklich geladen sind.

## Dienste mit systemd steuern

Auf Ubuntu startet und überwacht [[systemd|systemd]] alle Dienste. Du sprichst es mit `systemctl` an:

```bash title="Terminal"
sudo systemctl enable --now nginx php8.5-fpm postgresql supervisor
systemctl status php8.5-fpm          # läuft der Dienst? letzte Logzeilen
sudo systemctl reload nginx          # Konfiguration neu lesen, ohne Verbindungen abzubrechen
sudo journalctl -u nginx --since "10 min ago"   # Protokoll eines Dienstes
```

| Befehl | Wirkung |
|---|---|
| `enable` | beim Hochfahren automatisch starten |
| `--now` | zusätzlich sofort starten |
| `reload` | Konfiguration neu lesen, laufende Anfragen laufen weiter |
| `restart` | hart stoppen und neu starten |

> [!MERKSATZ]
> Nach Konfigurationsänderungen **erst prüfen, dann neu laden**: `nginx -t`, `php-fpm8.5 -t`, `sshd -t`.

## Datenbank und Projektordner

Die App bekommt einen **eigenen** Datenbank-Benutzer mit eigenem Passwort – nie den Admin-Benutzer:

```bash title="Terminal"
sudo -u postgres createuser --pwprompt shop   # fragt nach dem Passwort
sudo -u postgres createdb --owner=shop shop
```

PostgreSQL lauscht standardmäßig nur auf `localhost` – genau so soll es bleiben.

Für den Code legst du einen Ordner an, der dem Benutzer `deploy` gehört. Die Gruppe `www-data` ist die
Gruppe, unter der PHP-FPM läuft:

```bash title="Terminal"
sudo mkdir -p /var/www/example.com/releases /var/www/example.com/shared/storage
sudo chown -R deploy:www-data /var/www/example.com
```

So darf `deploy` deployen, und PHP-FPM darf später in `storage` schreiben.

## Alles als Skript

Ein [[provisionierung|Provisionierungs-Skript]] fasst diese Schritte zusammen. `set -euo pipefail` lässt
es beim ersten Fehler abbrechen, statt halb fertig weiterzulaufen:

```bash title="provision.sh"
#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-/var/www/example.com}"

apt-get update
apt-get install -y nginx php8.5-fpm php8.5-cli php8.5-mbstring php8.5-xml \
  php8.5-curl php8.5-pgsql php8.5-intl php8.5-zip postgresql supervisor composer git unzip
systemctl enable --now nginx php8.5-fpm postgresql supervisor

mkdir -p "$BASE/releases" "$BASE/shared/storage"
chown -R deploy:www-data "$BASE"
```

Der Ausdruck `${BASE:-…}` setzt einen Standardwert, falls die Variable leer ist. In Skripten verwendest du
`apt-get` statt `apt`: Dessen Ausgabe bleibt über Versionen stabil.

> [!PRAXIS]
> Wächst so ein Skript, steigen Teams auf Werkzeuge wie Ansible um. Die Idee bleibt dieselbe: Der Zustand
> des Servers ist in Dateien beschrieben und lässt sich jederzeit neu herstellen.

## Zusammenfassung

- Laravel 13 braucht PHP ≥ 8.3 mit Erweiterungen wie mbstring, xml, curl und einem Datenbanktreiber.
- Dienste steuerst du mit `systemctl enable --now`, `status`, `reload` und `journalctl -u`.
- Die App bekommt einen eigenen Datenbank-Benutzer; die Datenbank lauscht nur lokal.
- Der Projektordner gehört `deploy`, die Gruppe `www-data` darf in `storage` schreiben.
- Ein Skript mit `set -euo pipefail` macht die Installation wiederholbar.
