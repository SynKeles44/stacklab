---
title: Deploy-Kit und Go-Live
summary: Ein Deploy-Skript in der richtigen Reihenfolge, Produktions-Konfiguration ohne Geheimnisse im Repository, ein Rückweg für den Notfall und eine Checkliste für den großen Tag.
duration: 25
sources:
  - title: Laravel-Dokumentation – Deployment
    url: https://laravel.com/docs/13.x/deployment
  - title: Laravel-Dokumentation – Configuration (Environment)
    url: https://laravel.com/docs/13.x/configuration#environment-configuration
  - title: Docker-Dokumentation – docker compose run
    url: https://docs.docker.com/reference/cli/docker/compose/run/
  - title: The Twelve-Factor App – Config
    url: https://12factor.net/de/config
quiz:
  - type: single
    question: Warum läuft `php artisan migrate --force` im Deploy-Skript **vor** `docker compose up -d`?
    options:
      - Weil Migrationen nur ohne laufende Container funktionieren.
      - Damit der neue Code beim Start schon das passende Datenbankschema vorfindet.
      - Weil `--force` sonst ignoriert wird.
    answer: 1
    explanation: >
      Startet der neue Code zuerst, greift er womöglich auf Spalten zu, die es noch nicht gibt. Für Änderungen
      ohne jede Ausfallzeit plant man Migrationen zusätzlich abwärtskompatibel (Expand/Contract).
  - type: multiple
    question: Welche Werte gehören in die Produktions-Umgebung von Vereinskurse?
    options:
      - "`APP_ENV=production`"
      - "`APP_DEBUG=true`, damit man Fehler besser sieht"
      - "`APP_DEBUG=false`"
      - Ein eigener `APP_KEY`, der nicht im Repository steht
    answers: [0, 2, 3]
    explanation: Mit `APP_DEBUG=true` zeigt Laravel bei Fehlern Code und Konfiguration an – in Produktion ein Datenleck.
  - type: cloze
    text: Ein Deploy-Skript beginnt mit `set ___`, damit es beim ersten Fehler abbricht, statt mit kaputtem Zustand weiterzulaufen.
    blanks:
      - ["-euo pipefail", "-eu -o pipefail"]
    explanation: "`-e` bricht bei Fehlern ab, `-u` bei unbekannten Variablen, `-o pipefail` auch bei Fehlern mitten in einer Pipe."
  - type: match
    question: Ordne jedem Begriff seine Rolle beim Go-Live zu.
    pairs:
      - { left: "Health-Check /up", right: "zeigt, dass die App antwortet" }
      - { left: "Rollback", right: "zurück auf die letzte funktionierende Version" }
      - { left: "Runbook", right: "Schritt-für-Schritt-Anleitung für den Notfall" }
      - { left: "Backup-Probe", right: "beweist, dass sich Daten wiederherstellen lassen" }
    explanation: Ein Go-Live ist erst sicher, wenn auch der Weg zurück geplant und geübt ist.
tasks:
  - id: erstes-deployment
    type: simulated
    title: Das erste Deployment auf dem Server
    description: |
      Der Server `203.0.113.20` ist eingerichtet (Docker, Compose, das Repository liegt unter
      `/srv/vereinskurse`, die Datei `api/.env` mit den Produktionswerten ist angelegt). Führe das erste
      Deployment durch:

      1. Melde dich als `deploy` an: `ssh deploy@203.0.113.20`
      2. Wechsle in den Projektordner: `cd /srv/vereinskurse`
      3. Hole den neuesten Stand von main: `git pull --ff-only`
      4. Starte das Deploy-Skript: `./deploy/deploy.sh`
      5. Prüfe von außen den Health-Check: `curl -fsS https://kurse.example.com/up`
    prompt: "du@laptop:~$"
    steps:
      - expect: "^ssh\\s+deploy@203\\.0\\.113\\.20$"
        output: |
          Welcome to Ubuntu 24.04 LTS
          Last login: Fri Oct  9 18:02:11 2026 from 198.51.100.7
        prompt: "deploy@server:~$"
        hint: "ssh benutzer@ip-adresse"
      - expect: "^cd\\s+/srv/vereinskurse/?$"
        output: ""
        prompt: "deploy@server:/srv/vereinskurse$"
        hint: "cd /srv/vereinskurse"
      - expect: "^git\\s+pull\\s+--ff-only$"
        output: |
          Updating 3f2a9c1..8b7d4e0
          Fast-forward
           api/app/Http/Controllers/BookingController.php | 12 ++++++++----
           1 file changed, 8 insertions(+), 4 deletions(-)
        prompt: "deploy@server:/srv/vereinskurse$"
        hint: "`--ff-only` bricht ab, statt auf dem Server einen Merge-Commit zu erzeugen."
      - expect: "^(\\./deploy/deploy\\.sh|bash\\s+deploy/deploy\\.sh)$"
        output: |
          [+] Building 18.2s (24/24) FINISHED
             INFO  Running migrations.
            2026_10_10_000003_add_index_to_bookings .............. 8.12ms DONE
             INFO  Caching framework bootstrap, configuration, and metadata.
          [+] Running 3/3
           ✔ Container vereinskurse-db-1   Healthy
           ✔ Container vereinskurse-api-1  Started
           ✔ Container vereinskurse-web-1  Started
          Deployment erfolgreich: https://kurse.example.com
        prompt: "deploy@server:/srv/vereinskurse$"
        hint: "Das Skript liegt unter deploy/deploy.sh und ist ausführbar."
      - expect: "^curl\\s+-fsS\\s+https://kurse\\.example\\.com/up$"
        output: |
          Application up
        prompt: "deploy@server:/srv/vereinskurse$"
        hint: "curl -fsS https://kurse.example.com/up"
    responses:
      - match: "^docker\\s+compose\\s+ps"
        output: |
          NAME                 SERVICE   STATUS                    PORTS
          vereinskurse-api-1   api       Up 1 minute               9000/tcp
          vereinskurse-db-1    db        Up 3 days (healthy)       5432/tcp
          vereinskurse-web-1   web       Up 1 minute               0.0.0.0:8080->80/tcp
      - match: "^cat\\s+api/\\.env"
        output: "Bitte nicht: Die .env enthält Geheimnisse. Nutze php artisan about, um die Konfiguration ohne Werte zu prüfen."
  - id: go-live-stoerung
    type: steps
    title: Wenn der Health-Check rot bleibt
    description: Der große Tag. Spiel durch, wie du ruhig bleibst, wenn etwas schiefgeht.
    steps:
      - situation: >
          Das Deploy-Skript endet mit „curl: (22) The requested URL returned error: 500“. Die Seite zeigt eine
          Fehlermeldung, Mitglieder können nicht buchen.
        question: Was tust du zuerst?
        options:
          - Den Server neu installieren.
          - Nach Runbook auf die letzte funktionierende Version zurückgehen (Rollback) und dann in Ruhe die Ursache suchen.
          - Im Code auf dem Server direkt herumprobieren, bis es wieder geht.
        answer: 1
        explanation: Erst den Schaden begrenzen, dann analysieren. Ein geübter Rollback dauert Minuten, Fehlersuche unter Druck Stunden.
      - situation: >
          Der Rollback läuft, die alte Version antwortet wieder mit 200. In den Logs des api-Containers steht
          „SQLSTATE[42703]: column "waitlist" does not exist“.
        question: Was ist die wahrscheinlichste Ursache?
        options:
          - Die Migration für die neue Spalte ist nicht gelaufen oder ist fehlgeschlagen.
          - PostgreSQL ist kaputt.
          - Der Health-Check ist falsch konfiguriert.
        answer: 0
        explanation: >
          Der neue Code erwartet eine Spalte, die es nicht gibt. Prüfe die Ausgabe von migrate – und ob das
          Skript bei einem Fehler wirklich abbricht (set -euo pipefail).
      - situation: Der Fehler ist gefunden und behoben. Das nächste Deployment läuft grün durch.
        question: Was gehört jetzt noch dazu?
        options:
          - Nichts, es läuft ja wieder.
          - Die Störung kurz aufschreiben, die Ursache und die Lehre ins Runbook oder die Checkliste übernehmen.
        answer: 1
        explanation: Aus jeder Störung wird ein Punkt auf der Checkliste. So passiert derselbe Fehler kein zweites Mal.
---
Die Container laufen, die Pipeline ist grün. Jetzt soll Vereinskurse für echte Mitglieder erreichbar sein.
Ein gutes Deployment ist langweilig: ein Befehl, immer dieselbe Reihenfolge, und am Ende ein Beweis, dass die
App antwortet. Dafür baust du ein **Deploy-Kit** – und eine Checkliste für den Tag, an dem es zum ersten Mal
ernst wird.

## Konfiguration ohne Geheimnisse im Repository

Die App liest ihre Einstellungen aus [[umgebungsvariable|Umgebungsvariablen]]. Ins Repository kommt nur eine
**Beispieldatei** mit Platzhaltern, die echten Werte liegen nur auf dem Server:

```bash title="deploy/.env.production.example"
APP_ENV=production
APP_DEBUG=false
APP_KEY=
APP_URL=https://kurse.example.com
DB_CONNECTION=pgsql
DB_HOST=db
DB_PASSWORD=
```

| Variable | Warum so? |
|---|---|
| `APP_DEBUG=false` | Fehlerseiten zeigen sonst Code und Konfiguration |
| `APP_KEY` | verschlüsselt Sessions und Cookies – einmal erzeugen, sicher aufbewahren |
| `DB_PASSWORD` | nur auf dem Server bzw. im Secret-Speicher ([[secret\|Secret]]) |

> [!FEHLER]
> Die echte `.env` committen, „nur kurz“. Was einmal in der Git-Historie liegt, gilt als veröffentlicht – das
> Passwort muss dann sofort gewechselt werden.

## Das Deploy-Skript

Ein [[deployment|Deployment]] folgt immer derselben Reihenfolge. Das Skript schreibt sie fest:

```bash title="deploy/deploy.sh"
#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
APP_URL="${APP_URL:-http://localhost:8080}"

docker compose build
docker compose run --rm api php artisan migrate --force
docker compose run --rm api php artisan optimize
docker compose up -d

curl -fsS --retry 5 --retry-delay 2 "$APP_URL/up" >/dev/null
echo "Deployment erfolgreich: $APP_URL"
```

1. **Bauen** – schlägt der Build fehl, läuft die alte Version einfach weiter.
2. **Migrieren** – `--force`, weil Laravel in Produktion sonst nachfragt.
3. **Caches aufbauen** – `optimize` cached Konfiguration, Routen und Views.
4. **Starten** – `up -d` ersetzt nur Container, deren Image sich geändert hat.
5. **Prüfen** – der [[health-endpunkt|Health-Check]] `/up` muss antworten, sonst endet das Skript rot.

> [!MERKSATZ]
> `set -euo pipefail` macht aus „irgendwas ging schief“ ein klares Stopp. Ein Deploy-Skript ohne diese Zeile
> läuft nach einem Fehler einfach weiter.

## Der Weg zurück

Bevor du live gehst, beantwortest du eine Frage: **Wie komme ich in fünf Minuten zurück?** Für Vereinskurse
gibt es zwei Bausteine:

- **Code:** auf den letzten funktionierenden Commit oder Tag wechseln und das Skript erneut starten – ein
  [[deployment-rollback|Rollback]].
- **Daten:** ein [[backup|Backup]] der Datenbank vor jeder Migration. Ein Backup zählt erst, wenn du einmal
  erfolgreich daraus wiederhergestellt hast.

Beides gehört in ein kurzes [[runbook|Runbook]] in `docs/` – geschrieben an einem ruhigen Tag, damit es im
Notfall niemand erfinden muss.

> [!PRAXIS]
> Professionelle Setups deployen ohne Ausfallzeit, etwa mit atomaren Release-Ordnern oder Rolling Updates.
> Wie das geht, zeigen die Kurse Deployments & CI/CD und Projekt live stellen. Für ein Vereins-MVP sind
> ein paar Sekunden Neustart in Ordnung – wenn ihr sie bewusst in Kauf nehmt.

## Die Go-Live-Checkliste

Am Tag X arbeitest du eine [[deployment-checkliste|Checkliste]] ab, statt dich auf dein Gedächtnis zu
verlassen ([[go-live|Go-Live]]):

- [ ] CI auf `main` ist grün
- [ ] `APP_ENV=production`, `APP_DEBUG=false`, eigener `APP_KEY`
- [ ] Geheimnisse nur auf dem Server, nicht im Repository
- [ ] Backup erstellt und Wiederherstellung einmal geprobt
- [ ] HTTPS aktiv, HTTP leitet um
- [ ] Health-Check `/up` antwortet mit 200
- [ ] Fehler-Logs und Monitoring eingerichtet
- [ ] Rollback-Weg aufgeschrieben und geübt
- [ ] Ein Mensch ist in der ersten Stunde nach dem Go-Live erreichbar

## Zusammenfassung

- Ins Repository kommt nur eine **Beispiel-Umgebung**, die Geheimnisse liegen auf dem Server.
- Das **Deploy-Skript** baut, migriert, cached, startet und prüft – immer in dieser Reihenfolge.
- `set -euo pipefail` und ein **Health-Check** machen Fehler sofort sichtbar.
- **Rollback** und **Backup** sind vor dem Go-Live geplant und geprobt, das **Runbook** beschreibt sie.
- Eine **Go-Live-Checkliste** ersetzt das Gedächtnis am großen Tag.
