---
title: Backups und die Restore-Probe
summary: Was gesichert werden muss, wie ein Backup-Skript Datenbank und Uploads sichert, prüft und rotiert – und warum nur eine geprobte Wiederherstellung zählt.
duration: 25
sources:
  - title: PostgreSQL – pg_dump
    url: https://www.postgresql.org/docs/current/app-pgdump.html
  - title: MySQL 8.4 – mysqldump
    url: https://dev.mysql.com/doc/refman/8.4/en/mysqldump.html
  - title: SQLite – Command Line Shell (.backup)
    url: https://sqlite.org/cli.html
  - title: GNU Bash – Shell Parameter Expansion
    url: https://www.gnu.org/software/bash/manual/html_node/Shell-Parameter-Expansion.html
quiz:
  - type: multiple
    question: Was gehört bei einer Laravel-App ins Backup?
    options:
      - die Datenbank
      - hochgeladene Dateien in storage/app
      - der Ordner vendor
      - die .env (verschlüsselt oder im Passwort-Manager)
    answers: [0, 1, 3]
    explanation: vendor lässt sich jederzeit aus composer.lock neu installieren. Daten, Uploads und Geheimnisse dagegen nicht.
  - type: single
    question: Was besagt die 3-2-1-Regel?
    options:
      - Drei Backups pro Tag, zwei pro Woche, eins pro Monat.
      - Drei Kopien der Daten, auf zwei verschiedenen Speichern, eine davon außer Haus.
      - Drei Server, zwei Datenbanken, ein Load Balancer.
      - Backups drei Tage, zwei Wochen und ein Jahr aufbewahren.
    answer: 1
    explanation: So überstehen deine Daten auch den Totalausfall des Servers oder des ganzen Anbieters.
  - type: match
    question: Ordne jede Datenbank dem passenden Sicherungsbefehl zu.
    pairs:
      - { left: "PostgreSQL", right: "pg_dump -Fc shop > shop.dump" }
      - { left: "MySQL", right: "mysqldump --single-transaction shop > shop.sql" }
      - { left: "SQLite", right: "sqlite3 database.sqlite \".backup db.sqlite\"" }
    explanation: Alle drei erzeugen eine konsistente Kopie, während die App weiterläuft. Einfaches Kopieren der Datenbankdateien ist dagegen riskant.
  - type: cloze
    text: "Wie viele Daten du im schlimmsten Fall verlieren darfst, heißt ___; wie lange die Wiederherstellung dauern darf, heißt ___."
    blanks:
      - [RPO, Recovery Point Objective]
      - [RTO, Recovery Time Objective]
    explanation: Bei einem nächtlichen Backup ist dein RPO bis zu 24 Stunden. Das RTO misst du, indem du die Wiederherstellung probst.
  - type: find-bug
    question: Welche Zeile dieses Aufräum-Codes kann im schlimmsten Fall viel mehr löschen als gedacht?
    language: bash
    code: |
      BACKUP_DIR="${BACKUP_DIR:-/var/backups/example.com}"
      for alt in $(ls -1 "$BACKUP_DIR" | sort | head -n -7); do
        rm -rf "$BACKUP_DIR/$alt"
      done
    bug_line: 3
    explanation: >
      Ist eine Variable leer (Tippfehler im Namen, leere Ausgabe), wird aus dem Pfad schnell `/`. Mit
      `"${BACKUP_DIR:?}/${alt:?}"` bricht die Shell stattdessen mit einem Fehler ab.
tasks:
  - id: backup-skript
    type: terminal
    title: Ein Backup-Skript mit Prüfsumme und Rotation
    description: |
      Im Ordner `backup` liegt unter `daten/` eine nachgebaute App: eine SQLite-Datenbank `database.sqlite`
      mit einer Tabelle `orders` und hochgeladene Dateien in `storage/app/`. Klicke zuerst auf
      **Aufgabe vorbereiten**.

      Schreibe `backup.sh` mit `#!/usr/bin/env bash` und `set -euo pipefail`. Es nutzt diese Variablen mit
      Standardwerten: `DB_FILE` (`/var/www/example.com/shared/database.sqlite`), `STORAGE_DIR`
      (`/var/www/example.com/shared/storage`), `BACKUP_DIR` (`/var/backups/example.com`) und `KEEP` (`7`).

      1. Zeitstempel bilden: `ts=$(date +%Y%m%d%H%M%S)`.
      2. Einen Arbeitsordner anlegen, z. B. `tmp=$(mktemp -d "$BACKUP_DIR/.tmp-XXXXXX")`.
      3. Die Datenbank konsistent sichern: `sqlite3 "$DB_FILE" ".backup '$tmp/db.sqlite'"`.
      4. `storage/app` dazukopieren, sodass im Archiv `storage/app/…` liegt.
      5. Alles als `$BACKUP_DIR/backup-$ts.tar.gz` packen (im Archiv: `db.sqlite` und `storage/`), den
         Arbeitsordner löschen.
      6. Eine Prüfsumme anlegen: im Ordner `$BACKUP_DIR` `sha256sum "backup-$ts.tar.gz" > "backup-$ts.tar.gz.sha256"`.
      7. Nur die `$KEEP` neuesten Archive behalten – ältere samt `.sha256` löschen. Schreibe Löschpfade
         als `"${BACKUP_DIR:?}/${alt:?}"`.

      Teste mit: `mkdir -p sicherungen && DB_FILE=daten/database.sqlite STORAGE_DIR=daten/storage BACKUP_DIR=sicherungen KEEP=3 bash backup.sh`
    workdir: backup
    setup: |
      mkdir -p daten/storage/app/public/rechnungen daten/storage/logs
      sqlite3 daten/database.sqlite "CREATE TABLE orders (id INTEGER PRIMARY KEY, total INTEGER NOT NULL);"
      for i in $(seq 1 42); do echo "INSERT INTO orders (total) VALUES ($((i * 250)));"; done | sqlite3 daten/database.sqlite
      printf 'Rechnung 1\n' > daten/storage/app/public/rechnungen/rechnung-1.txt
      printf 'Rechnung 2\n' > daten/storage/app/public/rechnungen/rechnung-2.txt
      printf 'debug\n' > daten/storage/logs/laravel.log
    checks:
      - type: command
        run: bash -n backup.sh && head -n1 backup.sh && grep -c 'set -euo pipefail' backup.sh
        stdout_matches: "^#!/usr/bin/env bash\\n[1-9]"
        message: backup.sh fehlt, hat einen Syntaxfehler oder es fehlen `#!/usr/bin/env bash` bzw. `set -euo pipefail`.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX"); mkdir -p "$d/b"
          DB_FILE=daten/database.sqlite STORAGE_DIR=daten/storage BACKUP_DIR="$d/b" KEEP=3 bash backup.sh >/dev/null 2>&1
          ls "$d/b" | grep -cE '^backup-[0-9]{14}\.tar\.gz(\.sha256)?$'; ls -A "$d/b" | grep -c '^\.tmp'; rm -rf "${d:?}"
        stdout_equals: "2\n0"
        message: Nach einem Lauf sollen in BACKUP_DIR genau backup-<zeitstempel>.tar.gz und die .sha256-Datei liegen – und kein Arbeitsordner mehr.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX"); mkdir -p "$d/b" "$d/x"
          DB_FILE=daten/database.sqlite STORAGE_DIR=daten/storage BACKUP_DIR="$d/b" KEEP=3 bash backup.sh >/dev/null 2>&1
          tar -xzf "$d"/b/backup-*.tar.gz -C "$d/x" && sqlite3 "$d/x/db.sqlite" "SELECT COUNT(*) FROM orders;" && cat "$d/x/storage/app/public/rechnungen/rechnung-2.txt"
          rm -rf "${d:?}"
        stdout_equals: "42\nRechnung 2"
        message: Im Archiv müssen db.sqlite (mit allen 42 Bestellungen) und storage/app/public/rechnungen/… liegen.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX"); mkdir -p "$d/b"
          DB_FILE=daten/database.sqlite STORAGE_DIR=daten/storage BACKUP_DIR="$d/b" KEEP=3 bash backup.sh >/dev/null 2>&1
          (cd "$d/b" && sha256sum -c backup-*.tar.gz.sha256); rc=$?; rm -rf "${d:?}"; exit $rc
        stdout_matches: ": OK$"
        message: Die .sha256-Datei fehlt oder passt nicht. Erzeuge sie im Ordner BACKUP_DIR mit sha256sum backup-<ts>.tar.gz.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX"); mkdir -p "$d/b"
          for t in 20260101000001 20260101000002 20260101000003 20260101000004 20260101000005; do touch "$d/b/backup-$t.tar.gz" "$d/b/backup-$t.tar.gz.sha256"; done
          DB_FILE=daten/database.sqlite STORAGE_DIR=daten/storage BACKUP_DIR="$d/b" KEEP=3 bash backup.sh >/dev/null 2>&1
          ls "$d/b" | grep -c '\.tar\.gz$'; ls "$d/b" | grep -c '\.sha256$'; ls "$d/b" | grep -c '20260101000001'; ls "$d/b" | grep -c '20260101000005'
          rm -rf "${d:?}"
        stdout_equals: "3\n3\n0\n2"
        message: Mit KEEP=3 sollen nur die drei neuesten Archive (samt .sha256) übrig bleiben – ältere werden gelöscht.
    hints:
      - "Variablen mit Standardwert: `DB_FILE=\"${DB_FILE:-/var/www/example.com/shared/database.sqlite}\"`."
      - "Für das Archiv: `mkdir -p \"$tmp/storage\" && cp -a \"$STORAGE_DIR/app\" \"$tmp/storage/\"` und dann `tar -czf \"$BACKUP_DIR/backup-$ts.tar.gz\" -C \"$tmp\" db.sqlite storage`."
      - "Rotation: `ls -1 \"$BACKUP_DIR\" | grep -E '^backup-[0-9]+\\.tar\\.gz$' | sort | head -n -\"$KEEP\"` liefert die zu löschenden Archive."
    solution: |
      ```bash title="backup/backup.sh"
      #!/usr/bin/env bash
      set -euo pipefail

      DB_FILE="${DB_FILE:-/var/www/example.com/shared/database.sqlite}"
      STORAGE_DIR="${STORAGE_DIR:-/var/www/example.com/shared/storage}"
      BACKUP_DIR="${BACKUP_DIR:-/var/backups/example.com}"
      KEEP="${KEEP:-7}"

      ts=$(date +%Y%m%d%H%M%S)
      mkdir -p "$BACKUP_DIR"
      tmp=$(mktemp -d "$BACKUP_DIR/.tmp-XXXXXX")

      sqlite3 "$DB_FILE" ".backup '$tmp/db.sqlite'"
      mkdir -p "$tmp/storage"
      cp -a "$STORAGE_DIR/app" "$tmp/storage/"

      tar -czf "$BACKUP_DIR/backup-$ts.tar.gz" -C "$tmp" db.sqlite storage
      rm -rf "${tmp:?}"

      (cd "$BACKUP_DIR" && sha256sum "backup-$ts.tar.gz" > "backup-$ts.tar.gz.sha256")

      ls -1 "$BACKUP_DIR" | grep -E '^backup-[0-9]+\.tar\.gz$' | sort | head -n -"$KEEP" | while read -r alt; do
        rm -f "${BACKUP_DIR:?}/${alt:?}" "${BACKUP_DIR:?}/${alt:?}.sha256"
      done
      ```
  - id: was-sichern
    type: dragdrop
    title: Sichern oder neu erzeugen?
    description: Ordne zu, was ins Backup gehört und was sich jederzeit neu erzeugen lässt.
    targets:
      - { id: sichern, label: Ins Backup }
      - { id: neu, label: Lässt sich neu erzeugen }
    items:
      - { label: Datenbank, target: sichern }
      - { label: "Uploads in storage/app", target: sichern }
      - { label: ".env (verschlüsselt bzw. im Passwort-Manager)", target: sichern }
      - { label: "vendor/", target: neu }
      - { label: "public/build (von Vite gebaute Assets)", target: neu }
      - { label: "Caches in bootstrap/cache", target: neu }
---
Irgendwann passiert es: Eine Migration löscht die falsche Spalte, ein Kollege führt `DELETE` ohne `WHERE`
aus, oder der Anbieter verliert eine Festplatte. Dann zählt nur eine Frage: **Kannst du den Stand von
gestern wiederherstellen – und wie lange dauert das?** Ein [[backup|Backup]] ist erst dann eines, wenn du
die Antwort kennst.

## Was gesichert werden muss

Code und Abhängigkeiten liegen im Repository und in `composer.lock` – die stellst du per Deploy wieder her.
Sichern musst du alles, was **nur** auf dem Server existiert:

| Was | Wo | Wie |
|---|---|---|
| Datenbank | PostgreSQL, MySQL oder SQLite | als Dump mit dem passenden Werkzeug |
| Uploads | `shared/storage/app` | als Dateien ins Archiv |
| Geheimnisse | `shared/.env` | verschlüsselt oder im Passwort-Manager |

Zwei Kennzahlen helfen bei der Planung: Das [[rpo|RPO]] sagt, wie viele Daten du maximal verlieren darfst
(nächtliches Backup → bis zu 24 Stunden). Das [[rto|RTO]] sagt, wie lange die Wiederherstellung dauern darf.

> [!FEHLER]
> „Der Anbieter macht doch Snapshots.“ Ein [[snapshot|Snapshot]] liegt beim selben Anbieter, oft im selben
> Rechenzentrum, und sichert den ganzen Server – auch einen kaputten Zustand. Er ist eine gute Ergänzung,
> aber kein Ersatz für ein eigenes Backup außer Haus.

## Die Datenbank konsistent sichern

Kopierst du die Datendateien einer laufenden Datenbank einfach, erwischst du womöglich einen halb
geschriebenen Zustand. Jedes System hat deshalb ein eigenes Werkzeug für einen
[[datenbank-dump|Dump]]:

```bash title="Terminal"
pg_dump -Fc shop > shop.dump                                # PostgreSQL, zurück mit pg_restore
mysqldump --single-transaction shop > shop.sql              # MySQL/MariaDB mit InnoDB
sqlite3 database.sqlite ".backup '/var/backups/db.sqlite'"  # SQLite
```

Alle drei liefern einen konsistenten Stand, während die App weiterläuft. Im Übungs-Terminal nutzen wir
SQLite, weil es ohne Datenbankserver auskommt – das Prinzip ist identisch.

## Ein Backup-Skript: sichern, prüfen, rotieren

![Die 3-2-1-Regel und der Ablauf eines Backups bis zur Restore-Probe](/assets/projekt-live-stellen/backup-3-2-1.svg)

Ein gutes Backup-Skript erledigt vier Dinge:

1. **Sichern**: Dump und Uploads in einen Arbeitsordner.
2. **Packen**: ein Archiv mit Zeitstempel im Namen, z. B. `backup-20261010020000.tar.gz`.
3. **Prüfsumme**: eine [[pruefsumme|Prüfsumme]] mit `sha256sum`. Damit erkennst du später, ob das Archiv
   beim Kopieren oder auf der Platte beschädigt wurde.
4. **Rotieren**: nur die letzten N Archive behalten, damit die Platte nicht vollläuft.

Beim Löschen schreibst du Pfade als `"${BACKUP_DIR:?}/${alt:?}"`: Ist eine Variable leer, bricht die Shell
ab, statt im Wurzelverzeichnis zu löschen.

Danach kopiert ein zweiter Schritt das Archiv **außer Haus** – zu einem anderen Anbieter oder in einen
Objektspeicher, idealerweise verschlüsselt. Das ist die [[3-2-1-regel|3-2-1-Regel]]: drei Kopien, zwei
verschiedene Speicher, eine davon woanders. Gestartet wird das Skript nachts per Cron.

## Die Restore-Probe

Ein Backup, das nie wiederhergestellt wurde, ist eine Hoffnung. Typische Überraschungen: Das Archiv ist leer,
weil sich ein Pfad geändert hat; der Dump ist abgeschnitten, weil die Platte voll war; niemand kennt das
Passwort der Verschlüsselung.

Eine [[restore-probe|Restore-Probe]] beantwortet das regelmäßig:

```bash title="Restore-Probe"
sha256sum -c backup-20261010020000.tar.gz.sha256
mkdir -p probe && tar -xzf backup-20261010020000.tar.gz -C probe
sqlite3 probe/db.sqlite "PRAGMA integrity_check;"
sqlite3 probe/db.sqlite "SELECT COUNT(*) FROM orders;"
```

> [!MERKSATZ]
> Ein Backup zählt erst, wenn die Wiederherstellung **geprobt** wurde. Miss dabei die Zeit – das ist dein
> echtes RTO.

> [!PRAXIS]
> Viele Teams automatisieren die Probe: Ein Job stellt jede Nacht das neueste Backup in einer
> Wegwerf-Datenbank wieder her, zählt die Zeilen einiger Tabellen und schlägt Alarm, wenn etwas fehlt.

## Zusammenfassung

- Sichere **Datenbank, Uploads und Geheimnisse** – Code und `vendor/` lassen sich neu erzeugen.
- Datenbanken immer mit ihrem Werkzeug dumpen (`pg_dump`, `mysqldump --single-transaction`, `.backup`).
- Ein Backup-Skript **sichert, packt, prüft (sha256) und rotiert** – mit abgesicherten Löschpfaden.
- **3-2-1**: drei Kopien, zwei Speicher, eine außer Haus. Snapshots sind nur eine Ergänzung.
- Nur eine **geprobte Wiederherstellung** beweist, dass das Backup taugt.
