---
title: Überwachung und der Go-live
summary: Die wichtigsten Signale eines Servers beobachten, ein einfaches Prüfskript schreiben und mit einer Checkliste ruhig live gehen.
duration: 25
sources:
  - title: Laravel 13 – Deployment, The Health Route
    url: https://laravel.com/docs/13.x/deployment#the-health-route
  - title: Laravel 13 – Logging (daily channel)
    url: https://laravel.com/docs/13.x/logging
  - title: Google SRE Book – Monitoring Distributed Systems
    url: https://sre.google/sre-book/monitoring-distributed-systems/
  - title: df(1) – GNU coreutils
    url: https://www.gnu.org/software/coreutils/manual/html_node/df-invocation.html
quiz:
  - type: multiple
    question: Welche Signale sollte eine Grundüberwachung für eine kleine Laravel-App prüfen?
    options:
      - Ob https://example.com/up von außen mit 200 antwortet
      - Wie lange das TLS-Zertifikat noch gültig ist
      - Wie voll die Festplatte ist und ob das letzte Backup frisch ist
      - Wie viele Commits pro Tag im Repository landen
    answers: [0, 1, 2]
    explanation: Commits sagen nichts über den Zustand der Produktion. Die drei anderen Signale melden echte Ausfälle oder kommende Probleme.
  - type: single
    question: Warum prüft ein Uptime-Monitor die Seite von außen und nicht vom Server selbst?
    options:
      - Weil er sonst zu schnell ist.
      - Weil Probleme mit DNS, Firewall, Zertifikat oder Netz nur von außen sichtbar sind – und ein ausgefallener Server sich nicht selbst melden kann.
      - Weil das billiger ist.
      - Das ist egal.
    answer: 1
    explanation: Ein Server, der abgestürzt ist, schickt keine Warnung mehr. Die Prüfung von außen sieht genau das, was Besucher sehen.
  - type: find-bug
    question: Dieses Prüfskript soll bei mehr als 80 % Belegung warnen. Welche Zeile ist falsch?
    language: bash
    code: |
      MAX_DISK="${MAX_DISK:-80}"
      used=$(df -P / | awk 'NR==2 {gsub("%","",$5); print $5}')
      if [ "$used" -lt "$MAX_DISK" ]; then
        echo "WARNUNG: Festplatte zu ${used} % belegt"
        exit 1
      fi
    bug_line: 3
    explanation: Der Vergleich ist umgedreht. Warnen soll das Skript, wenn die Belegung größer als die Grenze ist – also -gt statt -lt.
  - type: cloze
    text: "Damit Laravel jeden Tag eine eigene Logdatei schreibt und alte löscht, setzt du `LOG_CHANNEL=stack` und `LOG_STACK=___`."
    blanks:
      - [daily]
    explanation: Der daily-Kanal rotiert die Logdatei täglich und behält standardmäßig 14 Tage (LOG_DAILY_DAYS).
tasks:
  - id: healthcheck-skript
    type: terminal
    title: Ein Prüfskript für Platte und Backups
    description: |
      Schreibe im Ordner `ueberwachung` ein Skript `healthcheck.sh`, das ein Cron-Job alle fünf Minuten
      aufrufen kann. Klicke zuerst auf **Aufgabe vorbereiten** (legt einen Ordner `sicherungen` an).

      1. `#!/usr/bin/env bash` und `set -euo pipefail`.
      2. Variablen mit Standardwerten: `MAX_DISK` (`80`), `CHECK_PATH` (`/`),
         `BACKUP_DIR` (`/var/backups/example.com`) und `MAX_BACKUP_AGE_H` (`26`).
      3. Lies die Belegung in Prozent mit `df -P "$CHECK_PATH" | awk 'NR==2 {gsub("%","",$5); print $5}'`.
         Ist sie **größer** als `MAX_DISK`, gib eine Zeile aus, die mit `WARNUNG: Festplatte` beginnt.
      4. Gibt es in `BACKUP_DIR` kein `backup-*.tar.gz`, das jünger als `MAX_BACKUP_AGE_H` Stunden ist
         (`find … -mmin -$((MAX_BACKUP_AGE_H * 60))`), gib eine Zeile aus, die mit `WARNUNG: Backup` beginnt.
         Ein fehlender Ordner zählt auch als fehlendes Backup.
      5. Gab es mindestens eine Warnung, endet das Skript mit `exit 1`, sonst gibt es `OK` aus und endet mit `exit 0`.

      Teste mit `BACKUP_DIR=sicherungen bash healthcheck.sh; echo $?` und mit `MAX_DISK=0 BACKUP_DIR=sicherungen bash healthcheck.sh`.
    workdir: ueberwachung
    setup: |
      mkdir -p sicherungen
      touch sicherungen/backup-20261010020000.tar.gz
    checks:
      - type: command
        run: bash -n healthcheck.sh && head -n1 healthcheck.sh
        stdout_matches: "^#!/usr/bin/env bash$"
        message: healthcheck.sh fehlt, hat einen Syntaxfehler oder beginnt nicht mit #!/usr/bin/env bash.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX"); touch "$d/backup-20261010020000.tar.gz"
          MAX_DISK=100 CHECK_PATH=. BACKUP_DIR="$d" bash healthcheck.sh; rc=$?; rm -rf "${d:?}"; echo "exit=$rc"
        stdout_matches: "^OK[\\s\\S]*exit=0$"
        message: Mit frischem Backup und MAX_DISK=100 soll das Skript OK ausgeben und mit 0 enden.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX"); touch "$d/backup-20261010020000.tar.gz"
          MAX_DISK=0 CHECK_PATH=. BACKUP_DIR="$d" bash healthcheck.sh; rc=$?; rm -rf "${d:?}"; echo "exit=$rc"
        stdout_matches: "^WARNUNG: Festplatte[\\s\\S]*exit=1$"
        message: Mit MAX_DISK=0 muss eine Zeile mit „WARNUNG Festplatte“ erscheinen und das Skript mit 1 enden.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX"); touch -d '3 days ago' "$d/backup-20261007020000.tar.gz"
          MAX_DISK=100 CHECK_PATH=. BACKUP_DIR="$d" bash healthcheck.sh; rc=$?; rm -rf "${d:?}"; echo "exit=$rc"
        stdout_matches: "^WARNUNG: Backup[\\s\\S]*exit=1$"
        message: Ist das neueste Backup älter als 26 Stunden, muss eine Zeile mit „WARNUNG Backup“ erscheinen und das Skript mit 1 enden.
      - type: command
        run: |
          MAX_DISK=100 CHECK_PATH=. BACKUP_DIR="$PWD/gibt-es-nicht" bash healthcheck.sh 2>&1; echo "exit=$?"
        stdout_matches: "^WARNUNG: Backup[\\s\\S]*exit=1$"
        message: Fehlt der Backup-Ordner ganz, soll das Skript nicht abstürzen, sondern „WARNUNG Backup“ melden und mit 1 enden.
    hints:
      - "Sammle Warnungen in einer Variablen: `fehler=0`, bei jeder Warnung `fehler=1`, am Ende `[ \"$fehler\" -eq 0 ] || exit 1`."
      - "Zahlen vergleichst du mit `-gt`: `if [ \"$used\" -gt \"$MAX_DISK\" ]; then …`."
      - "Gegen einen fehlenden Ordner hilft `find \"$BACKUP_DIR\" … 2>/dev/null | grep -q .` – mit `if !` davor, damit `set -e` nicht zuschlägt."
    solution: |
      ```bash title="ueberwachung/healthcheck.sh"
      #!/usr/bin/env bash
      set -euo pipefail

      MAX_DISK="${MAX_DISK:-80}"
      CHECK_PATH="${CHECK_PATH:-/}"
      BACKUP_DIR="${BACKUP_DIR:-/var/backups/example.com}"
      MAX_BACKUP_AGE_H="${MAX_BACKUP_AGE_H:-26}"
      fehler=0

      used=$(df -P "$CHECK_PATH" | awk 'NR==2 {gsub("%","",$5); print $5}')
      if [ "$used" -gt "$MAX_DISK" ]; then
        echo "WARNUNG: Festplatte zu ${used} % belegt (Grenze ${MAX_DISK} %)"
        fehler=1
      fi

      if ! find "$BACKUP_DIR" -maxdepth 1 -name 'backup-*.tar.gz' -mmin -$((MAX_BACKUP_AGE_H * 60)) 2>/dev/null | grep -q .; then
        echo "WARNUNG: Backup – kein Archiv jünger als ${MAX_BACKUP_AGE_H} Stunden in ${BACKUP_DIR}"
        fehler=1
      fi

      if [ "$fehler" -ne 0 ]; then
        exit 1
      fi
      echo "OK"
      ```
  - id: go-live-ablauf
    type: order
    title: Der Ablauf am Go-live-Tag
    description: Bring die Schritte des Go-live in eine sinnvolle Reihenfolge. Die TTL wurde schon am Vortag gesenkt.
    items:
      - Letzten Deploy auf den neuen Server ausführen und unter staging.example.com testen
      - Backup der alten Datenbank ziehen und auf dem neuen Server einspielen
      - A- und AAAA-Eintrag von example.com auf die neue IP umstellen
      - Mit certbot das Zertifikat für example.com und www.example.com holen
      - Mit curl und im Browser prüfen – Startseite, Login, /up, Mails, Queue
      - Uptime- und Zertifikats-Überwachung einschalten
      - Nach ein paar Tagen TTL wieder erhöhen und den alten Server abschalten
---
Die App ist online – herzlichen Glückwunsch! Ab jetzt stellt sich eine neue Frage: **Woher weißt du, dass
sie es morgen noch ist?** Ohne Überwachung erfährst du von einem Ausfall durch eine verärgerte Kundin. Mit
ein paar einfachen Prüfungen erfährst du es vorher – oft sogar, bevor überhaupt etwas kaputt ist.

## Die vier Signale für den Anfang

Für eine kleine App reichen vier Fragen, die regelmäßig automatisch gestellt werden:

| Signal | Prüfung | Warnen, wenn … |
|---|---|---|
| Erreichbarkeit | `https://example.com/up` von außen abrufen | kein Status 200 |
| Zertifikat | Ablaufdatum des TLS-Zertifikats lesen | weniger als 14 Tage Restlaufzeit |
| Speicherplatz | `df -P /` | mehr als 80 % belegt |
| Backups | Alter des neuesten Archivs | älter als 26 Stunden |

Die Route `/up` bringt Laravel mit: Sie antwortet mit 200, wenn die App ohne Fehler startet. Ein
[[uptime-monitoring|Uptime-Monitor]] ruft sie von **außen** auf, etwa jede Minute. Nur so fallen auch
Probleme mit DNS, Firewall oder Netz auf – und ein abgestürzter Server kann sich nicht selbst melden.

> [!MERKSATZ]
> Überwachung beantwortet zwei Fragen: **Ist es jetzt kaputt?** (Erreichbarkeit) und **Wird es bald
> kaputt?** (Platte, Zertifikat, Backups).

## Logs: lesen, begrenzen, auswerten

Wenn etwas schiefgeht, sind [[logdatei|Logdateien]] deine erste Spur:

```bash title="Terminal"
tail -f /var/www/example.com/shared/storage/logs/laravel-$(date +%F).log
sudo tail -f /var/log/nginx/error.log
sudo journalctl -u php8.5-fpm --since "1 hour ago"
```

Logs wachsen ohne Grenze, bis die Platte voll ist. Laravel löst das mit dem `daily`-Kanal: eine Datei pro
Tag, ältere werden nach `LOG_DAILY_DAYS` Tagen gelöscht (Standard 14). nginx-Logs rotiert das
System-Werkzeug logrotate von selbst.

```bash title="shared/.env"
LOG_CHANNEL=stack
LOG_STACK=daily
LOG_LEVEL=warning
```

Für Fehler lohnt sich zusätzlich ein Dienst zur Fehlerverfolgung, der Exceptions sammelt und dich
benachrichtigt – Laravel bindet solche Dienste über Pakete an.

## Ein eigenes Prüfskript

Für Platte und Backups genügt ein kleines Skript, das Cron alle fünf Minuten startet. Es gibt `OK` aus oder
eine Warnung und endet mit einem passenden [[exit-code|Exit-Code]]:

```bash title="healthcheck.sh (Kern)"
used=$(df -P "$CHECK_PATH" | awk 'NR==2 {gsub("%","",$5); print $5}')
if [ "$used" -gt "$MAX_DISK" ]; then
  echo "WARNUNG: Festplatte zu ${used} % belegt"
  fehler=1
fi
```

Ein Exit-Code ungleich 0 lässt sich weiterverarbeiten: Cron kann die Ausgabe per Mail schicken, ein
Monitoring-Agent kann ihn melden. Wichtig ist, dass jemand die Warnung **sieht**.

> [!FEHLER]
> Warnungen, die niemand liest. Eine Mail, die täglich „alles kaputt“ meldet, wird nach einer Woche
> ignoriert. Setze Grenzen so, dass jede Warnung eine Handlung auslöst – sonst ist das [[alerting|Alerting]]
> nutzlos.

## Die Go-live-Checkliste

Der [[go-live|Go-live]] ist der Moment, in dem die Domain auf den neuen Server zeigt. Gehe vorher jeden Punkt durch – am besten zu zweit:

| Bereich | Prüfen |
|---|---|
| Server | Updates eingespielt, SSH nur mit Schlüssel, Firewall 22/80/443, unattended-upgrades aktiv |
| App | `APP_ENV=production`, `APP_DEBUG=false`, APP_KEY gesichert, `optimize` gelaufen |
| Prozesse | Worker laufen (`supervisorctl status`), Cron-Zeile für den Scheduler aktiv |
| HTTPS | Zertifikat gültig, HTTP leitet um, `certbot renew --dry-run` erfolgreich |
| Daten | Backup läuft nachts, Kopie außer Haus, Restore-Probe einmal durchgeführt |
| Überwachung | Uptime-Monitor auf `/up`, Zertifikats-, Platten- und Backup-Prüfung aktiv |
| DNS | TTL vorab gesenkt, alter Server bleibt ein paar Tage erreichbar |

> [!PRAXIS]
> Plane den Go-live nicht für Freitagnachmittag. Wähle einen Zeitpunkt mit wenig Besuch, an dem du danach
> noch ein paar Stunden Zeit hast, die Logs zu beobachten.

## Zusammenfassung

- Überwache von außen die **Erreichbarkeit** (`/up`) und das **Zertifikat**, auf dem Server **Platte** und **Backups**.
- Logs begrenzen: Laravel-Kanal `daily`, nginx-Logs per logrotate.
- Ein Prüfskript meldet Probleme über Ausgabe und **Exit-Code**; Warnungen müssen zu Handlungen führen.
- Eine **Go-live-Checkliste** deckt Server, App, Prozesse, HTTPS, Daten, Überwachung und DNS ab.
- Live gehen zu einer ruhigen Zeit – und den alten Server erst nach ein paar Tagen abschalten.
