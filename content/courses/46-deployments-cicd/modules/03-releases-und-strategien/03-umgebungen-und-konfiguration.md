---
title: Umgebungen und Konfiguration
summary: Warum dasselbe Artefakt in jeder Umgebung läuft, wie Konfiguration über Umgebungsvariablen hineinkommt und wie du fehlende oder gefährliche Einstellungen vor dem Deployment erkennst.
duration: 20
sources:
  - title: The Twelve-Factor App – Config
    url: https://12factor.net/de/config
  - title: The Twelve-Factor App – Dev/prod parity
    url: https://12factor.net/de/dev-prod-parity
  - title: Laravel Docs – Configuration
    url: https://laravel.com/docs/13.x/configuration
  - title: Laravel Docs – Deployment
    url: https://laravel.com/docs/13.x/deployment
quiz:
  - type: find-bug
    question: Nach `php artisan config:cache` ist der API-Schlüssel in Produktion plötzlich leer. In welcher Zeile steckt der Fehler?
    language: php
    code: |
      <?php

      namespace App\Services;

      final class PaymentClient
      {
          public function key(): string
          {
              return (string) env('PAYMENT_API_KEY');
          }
      }
    bug_line: 9
    explanation: >
      Mit gecachter Konfiguration lädt Laravel die .env nicht mehr – `env()` außerhalb von `config/` liefert dann
      `null`. Richtig: den Wert in einer Config-Datei lesen und im Code `config('services.payment.key')` nutzen.
  - type: single
    question: Was gehört NICHT in das Git-Repository?
    options:
      - .env.example mit allen Schlüsseln und leeren Werten
      - config/services.php mit env('PAYMENT_API_KEY')
      - .env.production mit dem echten Datenbank-Passwort
      - Der Deploy-Workflow
    answer: 2
    explanation: Echte Werte und Geheimnisse liegen auf dem Server oder in einem Secret-Speicher – nie im Repository.
  - type: multiple
    question: Welche Einstellungen gehören in eine Produktionsumgebung einer Laravel-App?
    options:
      - APP_ENV=production
      - APP_DEBUG=false
      - APP_DEBUG=true, damit Fehler schneller gefunden werden
      - Ein eigener, geheimer APP_KEY
    answers: [0, 1, 3]
    explanation: >
      APP_DEBUG=true zeigt Nutzern Stack-Traces und Umgebungswerte – in Produktion ein Sicherheitsleck.
  - type: cloze
    text: Werte, die sich zwischen Umgebungen unterscheiden, kommen über ___ in die Anwendung. Laravel fasst die Konfiguration in Produktion mit `php artisan config:___` zu einer Datei zusammen.
    blanks:
      - [Umgebungsvariablen, Umgebungsvariable, Environment-Variablen, env]
      - [cache]
    explanation: Code bleibt gleich, Konfiguration wechselt – und gecacht ist sie schneller.
tasks:
  - id: was-wohin
    type: dragdrop
    title: Code, Konfiguration oder Secret?
    description: Ordne jeden Wert dem Ort zu, an den er gehört.
    targets:
      - { id: code, label: "Im Code bzw. in config/*.php (Git)" }
      - { id: env, label: "Umgebungsvariable, nicht geheim" }
      - { id: secret, label: "Secret-Speicher bzw. geschützte .env auf dem Server" }
    items:
      - { label: "Standard-Zeitzone der App: UTC", target: code }
      - { label: "Liste der erlaubten Bild-Formate", target: code }
      - { label: "APP_URL=https://shop.example.com", target: env }
      - { label: "LOG_LEVEL=warning", target: env }
      - { label: "DB_PASSWORD", target: secret }
      - { label: "APP_KEY", target: secret }
    hints:
      - Unterscheidet sich der Wert zwischen Staging und Produktion? Wäre es schlimm, wenn er öffentlich würde?
  - id: env-pruefen
    type: terminal
    title: Konfiguration vor dem Deployment prüfen
    description: |
      Im Ordner `env-check` liegen `.env.example` (alle nötigen Schlüssel, ohne echte Werte) und zwei
      Server-Konfigurationen: `staging.env` und `production.env`. Eine davon ist kaputt.

      Schreib ein ausführbares Skript `check-env.sh <datei>` mit `set -euo pipefail`, das:

      1. für **jeden** Schlüssel aus `.env.example` prüft, ob die übergebene Datei eine Zeile `SCHLUESSEL=` mit
         einem **nicht leeren** Wert enthält, und fehlende Schlüssel als `FEHLT: SCHLUESSEL` ausgibt,
      2. mit `FEHLER: APP_DEBUG` meldet, wenn `APP_ENV=production` gesetzt ist und `APP_DEBUG` nicht `false` ist,
      3. am Ende mit Exit-Code `1` endet, wenn es etwas gefunden hat, sonst `OK` ausgibt und mit `0` endet.

      Teste es mit beiden Dateien.
      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: env-check
    setup: |
      cat > .env.example <<'EOF'
      APP_NAME=
      APP_ENV=
      APP_KEY=
      APP_DEBUG=
      APP_URL=
      DB_HOST=
      DB_PASSWORD=
      EOF
      cat > staging.env <<'EOF'
      APP_NAME=Shop
      APP_ENV=staging
      APP_KEY=base64:c3RhZ2luZy1iZWlzcGllbC1zY2hsdWVzc2Vs
      APP_DEBUG=true
      APP_URL=https://staging.example.com
      DB_HOST=192.0.2.20
      DB_PASSWORD=platzhalter-staging
      EOF
      cat > production.env <<'EOF'
      APP_NAME=Shop
      APP_ENV=production
      APP_KEY=base64:cHJvZHVrdGlvbi1iZWlzcGllbA==
      APP_DEBUG=true
      APP_URL=https://shop.example.com
      DB_HOST=192.0.2.10
      DB_PASSWORD=
      EOF
    checks:
      - type: command
        run: test -x check-env.sh && grep -q "set -euo pipefail" check-env.sh
        message: check-env.sh fehlt, ist nicht ausführbar oder hat kein set -euo pipefail.
      - type: command
        run: ./check-env.sh staging.env
        stdout_matches: "OK"
        message: Für staging.env soll das Skript OK ausgeben und mit 0 enden (APP_DEBUG=true ist auf Staging erlaubt).
      - type: command
        run: ./check-env.sh production.env
        expect_exit: 1
        message: Für production.env muss das Skript mit Exit-Code 1 enden.
      - type: command
        run: ./check-env.sh production.env || true
        stdout_matches: "FEHLT: DB_PASSWORD"
        message: 'Das Skript soll den leeren Wert als "FEHLT: DB_PASSWORD" melden.'
      - type: command
        run: ./check-env.sh production.env || true
        stdout_matches: "FEHLER: APP_DEBUG"
        message: 'Das Skript soll APP_DEBUG=true in Produktion mit "FEHLER: APP_DEBUG" melden.'
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX"); cp .env.example check-env.sh "$d"/
          printf 'APP_NAME=Shop\nAPP_ENV=production\nAPP_KEY=base64:eA==\nAPP_DEBUG=false\nAPP_URL=https://shop.example.com\nDB_PASSWORD=x\n' > "$d/p.env"
          out=$(cd "$d" && ./check-env.sh p.env); rc=$?; rm -rf "$d"
          [ "$rc" -eq 1 ] && printf '%s' "$out" | grep -q "FEHLT: DB_HOST" && ! printf '%s' "$out" | grep -q "APP_DEBUG"
        message: 'Eine Datei ganz ohne DB_HOST-Zeile muss "FEHLT: DB_HOST" melden – und APP_DEBUG=false darf keinen Fehler auslösen.'
    hints:
      - "Schlüssel aus .env.example lesen: `cut -d= -f1 .env.example`. Den Wert eines Schlüssels: `grep -E \"^$key=\" \"$file\" | cut -d= -f2-`."
      - "Achtung mit `set -e`: `grep` ohne Treffer endet mit 1. Hänge `|| true` an, wenn ein fehlender Treffer erlaubt ist."
      - "Zähle Probleme in einer Variable `errors=$((errors + 1))` und entscheide am Ende über `exit 1` oder `echo OK`."
    solution: |
      ```bash
      cd env-check
      cat > check-env.sh <<'EOF'
      #!/usr/bin/env bash
      set -euo pipefail

      file="${1:?Aufruf: ./check-env.sh <datei>}"
      errors=0

      value_of() {
        grep -E "^$1=" "$file" | tail -n 1 | cut -d= -f2- || true
      }

      for key in $(cut -d= -f1 .env.example); do
        if [ -z "$(value_of "$key")" ]; then
          echo "FEHLT: $key"
          errors=$((errors + 1))
        fi
      done

      if [ "$(value_of APP_ENV)" = "production" ] && [ "$(value_of APP_DEBUG)" != "false" ]; then
        echo "FEHLER: APP_DEBUG muss in Produktion false sein"
        errors=$((errors + 1))
      fi

      if [ "$errors" -gt 0 ]; then
        exit 1
      fi
      echo "OK"
      EOF
      chmod +x check-env.sh
      ./check-env.sh staging.env
      ./check-env.sh production.env || echo "production.env ist noch nicht bereit"
      ```
---

Auf Staging funktioniert alles, in Produktion zeigt die Startseite einen roten Fehler mit Stack-Trace – und
darin das Datenbank-Passwort. Ursache: eine vergessene Zeile in der Server-Konfiguration. Weil dasselbe
Artefakt überall läuft, steckt der Unterschied zwischen Umgebungen **nur** in der Konfiguration. Also
verdient sie dieselbe Sorgfalt wie der Code.

## Die Umgebungen einer Anwendung

| Umgebung | Zweck | Typische Einstellungen |
|---|---|---|
| lokal | entwickeln | `APP_DEBUG=true`, lokale Datenbank |
| CI | testen | Testdatenbank, keine echten Dienste |
| Staging | Generalprobe | wie Produktion, eigene Daten |
| Produktion | echte Nutzer | `APP_DEBUG=false`, echte Dienste |

Die [[staging-umgebung|Staging-Umgebung]] soll der [[produktionsumgebung|Produktion]] so ähnlich wie möglich
sein: gleiche PHP-Version, gleiche Datenbank, gleicher Webserver. Dieses Ziel heißt
[[umgebungsparitaet|Umgebungsparität]]. Jeder Unterschied ist ein Fehler, den Staging nicht finden kann.

Manche Teams ergänzen kurzlebige [[review-umgebung|Review-Umgebungen]], die für jeden Pull Request
automatisch entstehen und nach dem Merge wieder verschwinden. Auch sie bekommen dasselbe Artefakt wie alle
anderen – nur eigene Konfiguration und eigene Testdaten. Gefährlich wird es, wenn Server von Hand
angepasst werden: Mit der Zeit weicht ihre Konfiguration still voneinander ab, und niemand weiß mehr,
warum Staging sich anders verhält als Produktion.

> [!MERKSATZ]
> Ein Artefakt, viele Umgebungen: Code ist überall gleich, nur die Konfiguration unterscheidet sich.

## Konfiguration über Umgebungsvariablen

Die [[twelve-factor-app|Twelve-Factor App]] empfiehlt: Alles, was sich zwischen Umgebungen unterscheidet,
kommt über [[umgebungsvariable|Umgebungsvariablen]] in die Anwendung. Laravel liest sie aus der
[[env-datei|.env-Datei]] des Servers oder direkt aus der Umgebung des Prozesses.

```php title="config/services.php"
return [
    'payment' => [
        'key' => env('PAYMENT_API_KEY'),
        'url' => env('PAYMENT_API_URL', 'https://api.example.com'),
    ],
];
```

Im übrigen Code liest du nur noch `config('services.payment.key')`. Die `.env` mit echten Werten liegt auf dem
Server – im Repository liegt nur `.env.example` mit allen Schlüsseln und leeren Werten. Geheimnisse wie
`DB_PASSWORD` oder `APP_KEY` kommen aus einem geschützten Speicher, etwa einem Secrets Manager der Cloud oder
den Environment-Secrets der Pipeline.

## Konfiguration cachen

In Produktion fasst `php artisan config:cache` alle Config-Dateien zu einer schnellen PHP-Datei zusammen
– der [[config-cache|Config-Cache]]. Danach liest Laravel die `.env` nicht mehr.

```bash title="Typische Optimierung beim Deployment"
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

Laravel fasst diese Befehle auch in `php artisan optimize` zusammen.

> [!FEHLER]
> **`env()` außerhalb von `config/`.** Mit gecachter Konfiguration liefert `env('PAYMENT_API_KEY')` im
> Service plötzlich `null`. Rufe `env()` ausschließlich in Config-Dateien auf.

## Konfiguration prüfen, bevor es knallt

Ein fehlender Schlüssel fällt oft erst auf, wenn ein Nutzer die betroffene Seite aufruft. Besser: Die
Pipeline prüft vor dem Umschalten, ob die Konfiguration vollständig und sicher ist.

| Prüfung | Warum |
|---|---|
| Jeder Schlüssel aus `.env.example` hat einen Wert | Vergessene neue Einstellung |
| `APP_DEBUG=false` in Produktion | sonst sehen Nutzer interne Details |
| `APP_ENV=production` | manche Pakete verhalten sich sonst anders |
| `php artisan about` läuft ohne Fehler | Konfiguration ist ladbar |

> [!PRAXIS]
> Wird eine neue Einstellung eingeführt, gehört sie im selben Pull Request in `.env.example` – und in die
> Konfiguration jeder Umgebung, **bevor** der Code ausgeliefert wird. Ein Check wie in der Aufgabe dieser
> Lektion macht aus einer Erinnerung eine Regel.

## Zusammenfassung

- Lokal, CI, Staging und Produktion unterscheiden sich nur in der Konfiguration.
- **Umgebungsparität**: Staging so nah wie möglich an Produktion.
- Konfiguration kommt über Umgebungsvariablen; Geheimnisse aus einem geschützten Speicher, nie aus Git.
- `config:cache` beschleunigt Laravel – `env()` gehört deshalb nur in `config/`.
- Prüfe vollständige und sichere Konfiguration automatisch vor dem Deployment.
