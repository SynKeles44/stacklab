---
title: Die .env für Produktion
summary: Welche Werte in Produktion anders sind, wie du den APP_KEY erzeugst und schützt und wo die Datei auf dem Server liegt.
duration: 20
sources:
  - title: Laravel 13 – Configuration, Environment Configuration
    url: https://laravel.com/docs/13.x/configuration#environment-configuration
  - title: Laravel 13 – Encryption (APP_KEY und Schlüsselrotation)
    url: https://laravel.com/docs/13.x/encryption#gracefully-rotating-encryption-keys
  - title: Laravel 13 – Deployment, Debug Mode
    url: https://laravel.com/docs/13.x/deployment#debug-mode
quiz:
  - type: single
    question: Was passiert, wenn du in Produktion einfach einen neuen APP_KEY erzeugst?
    options:
      - Nichts, der Schlüssel wird nur für Logs verwendet.
      - Alle Nutzer:innen werden abgemeldet, und mit dem alten Schlüssel verschlüsselte Daten lassen sich nicht mehr entschlüsseln.
      - Die Datenbank wird gelöscht.
      - Die App wird schneller.
    answer: 1
    explanation: >
      Der APP_KEY verschlüsselt Sessions, Cookies und Werte mit `encrypted`-Cast. Einen Wechsel machst du
      bewusst mit APP_PREVIOUS_KEYS, damit alte Daten lesbar bleiben.
  - type: multiple
    question: Welche Werte gehören in eine Produktions-.env?
    options:
      - APP_ENV=production
      - APP_DEBUG=false
      - APP_URL=https://example.com
      - DB_PASSWORD= (leer, ist ja intern)
    answers: [0, 1, 2]
    explanation: Auch eine Datenbank, die nur lokal lauscht, bekommt ein starkes Passwort.
  - type: find-bug
    question: In welcher Zeile steckt das größte Sicherheitsproblem dieser Produktions-.env?
    language: bash
    code: |
      APP_NAME=Shop
      APP_ENV=production
      APP_DEBUG=true
      APP_URL=https://example.com
      LOG_LEVEL=warning
    bug_line: 3
    explanation: Mit APP_DEBUG=true zeigt jede Fehlerseite Stacktraces und Konfigurationswerte. In Produktion immer false.
  - type: cloze
    text: "Nach `php artisan config:cache` liest Laravel die .env nicht mehr. Deshalb darfst du `env()` nur in den Dateien im Ordner ___ aufrufen."
    blanks:
      - [config, config/]
    explanation: Im Code liest du Werte mit config('app.url'). env() außerhalb von config/ liefert nach dem Caching null.
tasks:
  - id: env-pruefer
    type: code
    language: php
    title: Ein Prüfer für Produktions-.env-Dateien
    description: |
      Schreibe zwei Funktionen, die ein Deploy-Skript vor dem Umschalten aufrufen könnte:

      1. `leseEnv(string $inhalt): array` wandelt den Text einer .env-Datei in ein Array `Schlüssel => Wert`
         um. Leere Zeilen und Zeilen, die mit `#` beginnen, werden übersprungen. Getrennt wird am **ersten**
         `=`. Umschließende doppelte Anführungszeichen um den Wert werden entfernt. Leerzeichen am Rand
         von Schlüssel und Wert werden abgeschnitten.
      2. `pruefeProduktion(array $env): array` gibt die Namen aller Probleme in **dieser Reihenfolge** zurück:
         - `APP_ENV`, wenn der Wert nicht `production` ist,
         - `APP_DEBUG`, wenn der Wert nicht `false` ist,
         - `APP_KEY`, wenn er fehlt oder nicht mit `base64:` beginnt,
         - `APP_URL`, wenn er fehlt oder nicht mit `https://` beginnt,
         - `DB_PASSWORD`, wenn er fehlt oder leer ist.

      Fehlende Schlüssel zählen wie falsche Werte. Eine einwandfreie Datei ergibt ein leeres Array.
    starter: |
      <?php
      declare(strict_types=1);

      function leseEnv(string $inhalt): array
      {
          $werte = [];
          // Zeilen durchgehen …
          return $werte;
      }

      function pruefeProduktion(array $env): array
      {
          $probleme = [];
          // Bedingungen prüfen …
          return $probleme;
      }
    tests:
      - name: liest einfache Zeilen und ignoriert Kommentare
        code: |
          $env = leseEnv("# Kommentar\nAPP_ENV=production\n\nAPP_NAME=\"Mein Shop\"\n");
          assert_same(['APP_ENV' => 'production', 'APP_NAME' => 'Mein Shop'], $env);
      - name: trennt am ersten Gleichheitszeichen
        code: |
          $env = leseEnv("APP_KEY=base64:abc==\nDB_PASSWORD = geheim \n");
          assert_same('base64:abc==', $env['APP_KEY']);
          assert_same('geheim', $env['DB_PASSWORD']);
      - name: eine korrekte Produktions-Umgebung hat keine Probleme
        code: |
          $env = ['APP_ENV' => 'production', 'APP_DEBUG' => 'false', 'APP_KEY' => 'base64:AAAA', 'APP_URL' => 'https://example.com', 'DB_PASSWORD' => 'x7!kq'];
          assert_same([], pruefeProduktion($env));
      - name: ein leeres Array hat alle fünf Probleme
        code: |
          assert_same(['APP_ENV', 'APP_DEBUG', 'APP_KEY', 'APP_URL', 'DB_PASSWORD'], pruefeProduktion([]));
      - name: findet Debug-Modus und fehlendes HTTPS
        code: |
          $env = leseEnv("APP_ENV=production\nAPP_DEBUG=true\nAPP_KEY=base64:AAAA\nAPP_URL=http://example.com\nDB_PASSWORD=x7!kq\n");
          assert_same(['APP_DEBUG', 'APP_URL'], pruefeProduktion($env));
    solution: |
      <?php
      declare(strict_types=1);

      function leseEnv(string $inhalt): array
      {
          $werte = [];
          foreach (explode("\n", $inhalt) as $zeile) {
              $zeile = trim($zeile);
              if ($zeile === '' || str_starts_with($zeile, '#') || !str_contains($zeile, '=')) {
                  continue;
              }
              [$schluessel, $wert] = explode('=', $zeile, 2);
              $wert = trim($wert);
              if (strlen($wert) >= 2 && str_starts_with($wert, '"') && str_ends_with($wert, '"')) {
                  $wert = substr($wert, 1, -1);
              }
              $werte[trim($schluessel)] = $wert;
          }
          return $werte;
      }

      function pruefeProduktion(array $env): array
      {
          $probleme = [];
          if (($env['APP_ENV'] ?? '') !== 'production') {
              $probleme[] = 'APP_ENV';
          }
          if (($env['APP_DEBUG'] ?? '') !== 'false') {
              $probleme[] = 'APP_DEBUG';
          }
          if (!str_starts_with($env['APP_KEY'] ?? '', 'base64:')) {
              $probleme[] = 'APP_KEY';
          }
          if (!str_starts_with($env['APP_URL'] ?? '', 'https://')) {
              $probleme[] = 'APP_URL';
          }
          if (($env['DB_PASSWORD'] ?? '') === '') {
              $probleme[] = 'DB_PASSWORD';
          }
          return $probleme;
      }
    hints:
      - "`explode('=', $zeile, 2)` trennt nur am ersten Gleichheitszeichen."
      - "Mit `$env['APP_ENV'] ?? ''` vermeidest du Fehler bei fehlenden Schlüsseln."
  - id: env-anlegen
    type: terminal
    title: Die Produktions-.env vorbereiten
    description: |
      Im Ordner `env-produktion` liegt die `.env.example` aus dem Repository. Erstelle daraus die Datei, die
      später als `shared/.env` auf dem Server liegt. Klicke zuerst auf **Aufgabe vorbereiten**.

      1. Kopiere `.env.example` nach `.env.production`.
      2. Setze `APP_ENV=production`, `APP_DEBUG=false` und `APP_URL=https://example.com`.
      3. Erzeuge einen neuen Schlüssel und trage ihn als `APP_KEY` ein. Ohne Laravel-Projekt geht das mit
         `php -r 'echo "base64:".base64_encode(random_bytes(32)).PHP_EOL;'`.
      4. Setze `DB_PASSWORD` auf ein Passwort mit mindestens 16 Zeichen (nur Buchstaben und Ziffern).
      5. Setze `LOG_LEVEL=warning` und `SESSION_SECURE_COOKIE=true`.
      6. Die Datei darf nur vom Besitzer gelesen und geschrieben und von der Gruppe gelesen werden:
         `chmod 640 .env.production`.
    workdir: env-produktion
    setup: |
      cat > .env.example <<'ENV'
      APP_NAME=Shop
      APP_ENV=local
      APP_KEY=
      APP_DEBUG=true
      APP_URL=http://localhost:8000

      LOG_CHANNEL=stack
      LOG_LEVEL=debug

      DB_CONNECTION=pgsql
      DB_HOST=127.0.0.1
      DB_PORT=5432
      DB_DATABASE=shop
      DB_USERNAME=shop
      DB_PASSWORD=

      SESSION_DRIVER=database
      SESSION_SECURE_COOKIE=false
      QUEUE_CONNECTION=database
      MAIL_MAILER=log
      ENV
    checks:
      - type: file_exists
        path: .env.production
        message: Die Datei .env.production fehlt noch.
      - type: command
        run: grep -E '^(APP_ENV|APP_DEBUG|APP_URL|LOG_LEVEL|SESSION_SECURE_COOKIE)=' .env.production | sort | tr '\n' ' '
        stdout_equals: "APP_DEBUG=false APP_ENV=production APP_URL=https://example.com LOG_LEVEL=warning SESSION_SECURE_COOKIE=true"
        message: Prüfe APP_ENV, APP_DEBUG, APP_URL, LOG_LEVEL und SESSION_SECURE_COOKIE – jeder Schlüssel genau einmal mit dem geforderten Wert.
      - type: command
        run: |
          php -r '$l = preg_grep("/^APP_KEY=/", file(".env.production", FILE_IGNORE_NEW_LINES)); $k = substr((string) reset($l), 8); exit(str_starts_with($k, "base64:") && strlen((string) base64_decode(substr($k, 7), true)) === 32 ? 0 : 1);'
        message: APP_KEY muss mit base64 beginnen und genau 32 zufällige Bytes enthalten – erzeuge ihn mit dem php-Befehl aus der Beschreibung.
      - type: command
        run: grep -E '^DB_PASSWORD=[A-Za-z0-9]{16,}$' .env.production
        message: DB_PASSWORD braucht mindestens 16 Buchstaben oder Ziffern.
      - type: command
        run: grep -E '^(DB_DATABASE=shop|DB_USERNAME=shop|QUEUE_CONNECTION=database)$' .env.production | wc -l
        stdout_matches: "^\\s*3\\s*$"
        message: Die übrigen Werte aus .env.example (z. B. DB_DATABASE, DB_USERNAME, QUEUE_CONNECTION) sollen erhalten bleiben.
      - type: command
        run: stat -c '%a' .env.production
        stdout_equals: "640"
        message: Setze die Rechte mit chmod 640 .env.production.
    hints:
      - "`cp .env.example .env.production`, dann mit `nano .env.production` die Werte ändern."
      - "Den Schlüssel kannst du direkt einsetzen: `key=$(php -r 'echo \"base64:\".base64_encode(random_bytes(32));')` und dann `sed -i \"s|^APP_KEY=.*|APP_KEY=$key|\" .env.production`."
      - "Ein zufälliges Passwort: `php -r 'echo bin2hex(random_bytes(16)).PHP_EOL;'` (32 Zeichen, nur Ziffern und a–f)."
    solution: |
      ```bash
      cd env-produktion
      cp .env.example .env.production
      key=$(php -r 'echo "base64:".base64_encode(random_bytes(32));')
      pass=$(php -r 'echo bin2hex(random_bytes(16));')
      sed -i \
        -e 's|^APP_ENV=.*|APP_ENV=production|' \
        -e 's|^APP_DEBUG=.*|APP_DEBUG=false|' \
        -e 's|^APP_URL=.*|APP_URL=https://example.com|' \
        -e "s|^APP_KEY=.*|APP_KEY=$key|" \
        -e "s|^DB_PASSWORD=.*|DB_PASSWORD=$pass|" \
        -e 's|^LOG_LEVEL=.*|LOG_LEVEL=warning|' \
        -e 's|^SESSION_SECURE_COOKIE=.*|SESSION_SECURE_COOKIE=true|' \
        .env.production
      chmod 640 .env.production
      ```
---
Lokal ist deine `.env` ein Notizzettel: `APP_DEBUG=true`, Passwort leer, Mails landen im Log. Auf dem Server
ist dieselbe Datei der Tresor deiner App – mit Datenbankpasswort, API-Schlüsseln und dem Schlüssel, mit dem
Laravel Cookies verschlüsselt. Wer sie falsch befüllt oder ungeschützt ablegt, hat ein Problem, bevor der
erste Besuch kommt.

## Was in Produktion anders ist

Die [[env-datei|.env]] enthält [[umgebungsvariable|Umgebungsvariablen]]. Im Repository liegt nur die
Vorlage [[env-example|.env.example]] mit leeren oder harmlosen Werten. Die echte Datei legst du einmal von
Hand auf dem Server an.

```bash title="shared/.env (Auszug)"
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:<dein-schluessel>
APP_URL=https://example.com

LOG_CHANNEL=stack
LOG_LEVEL=warning

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_DATABASE=shop
DB_USERNAME=shop
DB_PASSWORD=<dein-passwort>

SESSION_SECURE_COOKIE=true
QUEUE_CONNECTION=database
```

| Variable | Warum dieser Wert |
|---|---|
| `APP_DEBUG=false` | keine Stacktraces und Konfigurationswerte für Besucher |
| `APP_URL=https://…` | korrekte Links in Mails und Weiterleitungen |
| `LOG_LEVEL=warning` | Logs bleiben übersichtlich und füllen nicht die Platte |
| `SESSION_SECURE_COOKIE=true` | das Session-Cookie wird nur über HTTPS gesendet |

Auch Zugangsdaten für den Mail-Dienst, für externe APIs oder für Objektspeicher stehen in dieser Datei. Jede Umgebung bekommt eigene Werte: Staging nutzt nie die Produktions-Datenbank und verschickt nie echte Mails an Kundschaft. So kann ein Test auf Staging keinen Schaden in Produktion anrichten.

## Der APP_KEY

Der [[app-key|APP_KEY]] ist ein zufälliger 32-Byte-Schlüssel. Laravel verschlüsselt damit Cookies und
Sessions sowie Spalten mit dem `encrypted`-Cast. Du erzeugst ihn **einmal** pro Umgebung:

```bash title="Terminal"
php artisan key:generate --show
```

`--show` gibt den Schlüssel nur aus, statt eine Datei zu ändern. Du trägst ihn in die `.env` auf dem Server
ein und bewahrst eine Kopie in deinem Passwort-Manager auf.

> [!FEHLER]
> Den APP_KEY bei jedem Deploy neu erzeugen. Dann sind alle Nutzer:innen abgemeldet, und verschlüsselte
> Spalten lassen sich nicht mehr lesen. Musst du ihn wechseln, trägst du den alten Schlüssel in
> `APP_PREVIOUS_KEYS` ein – so kann Laravel alte Daten noch entschlüsseln.

## Wo die Datei liegt – und wer sie lesen darf

Die `.env` liegt **außerhalb** der Release-Ordner in `shared/`. Jedes neue Release bekommt nur einen
Symlink darauf. So überlebt sie jeden Deploy, und du pflegst sie an genau einer Stelle.

```bash title="Terminal"
sudo chown deploy:www-data /var/www/example.com/shared/.env
chmod 640 /var/www/example.com/shared/.env
```

Mit [[dateirechte|Rechten]] `640` darf `deploy` lesen und schreiben, die Gruppe `www-data` (PHP-FPM) nur
lesen, alle anderen nichts.

> [!MERKSATZ]
> Die `.env` ist ein [[secret|Geheimnis]]: nie ins Repository, nie in den Web-Root, Rechte `640`, und eine
> Sicherung des APP_KEY gehört in den Passwort-Manager.

## env() nur in config/

Beim Deploy cacht Laravel die gesamte Konfiguration in eine Datei. Danach wird die `.env` **nicht mehr
gelesen**. Deshalb gilt:

```php title="Richtig und falsch"
// config/services.php – richtig
'shop_api' => ['key' => env('SHOP_API_KEY')],

// app/Http/Controllers/OrderController.php – richtig
$key = config('services.shop_api.key');

// im Controller – falsch, nach config:cache ist das null
$key = env('SHOP_API_KEY');
```

Änderst du später einen Wert in der `.env`, musst du den Cache neu bauen (`php artisan config:cache`) und
die Worker neu starten. Wer die Datei verschlüsselt ins Repository legen möchte, findet dazu
`php artisan env:encrypt` in der [Laravel-Dokumentation](https://laravel.com/docs/13.x/configuration#encrypting-environment-files).

> [!PRAXIS]
> In Teams liegen Produktions-Geheimnisse oft in einem Secrets-Manager oder als verschlüsselte Variablen der
> CI-Pipeline. Die `.env` auf dem Server wird dann beim Deploy aus diesen Quellen erzeugt – niemand tippt
> Passwörter von Hand ab.

## Zusammenfassung

- Im Repository liegt nur `.env.example`; die echte `.env` liegt in `shared/` auf dem Server.
- Produktion heißt: `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL` mit `https://`.
- Der **APP_KEY** wird einmal erzeugt, sicher verwahrt und nur mit `APP_PREVIOUS_KEYS` gewechselt.
- Rechte `640`: `deploy` schreibt, PHP-FPM liest, sonst niemand.
- Nach `config:cache` gilt: `env()` nur in `config/`, im Code `config()`.
