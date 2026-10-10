---
title: Konfiguration mit .env und config/
summary: Wie Laravel Einstellungen aus .env-Datei und config-Dateien liest, warum env() nur in config/ gehört und was APP_KEY und APP_DEBUG bedeuten.
duration: 40
sources:
  - title: Laravel – Configuration
    url: https://laravel.com/docs/13.x/configuration
  - title: Laravel – Deployment (Optimierung)
    url: https://laravel.com/docs/13.x/deployment
  - title: The Twelve-Factor App – Config
    url: https://12factor.net/de/config
quiz:
  - type: single
    question: Du willst in einem Controller wissen, wie viele Einträge pro Seite angezeigt werden. Wie liest du den Wert richtig aus?
    options:
      - "env('PRO_SEITE')"
      - "config('leseliste.pro_seite')"
      - "$_ENV['PRO_SEITE']"
      - "file_get_contents('.env')"
    answer: 1
    explanation: Außerhalb von config/ liest du Werte immer mit config(). Nach php artisan config:cache wird .env gar nicht mehr geladen – env() im Controller liefert dann null.
  - type: multiple
    question: Welche Aussagen über die Datei .env stimmen?
    options:
      - Sie gehört nicht ins Git-Repository.
      - Sie enthält Passwörter und Schlüssel für genau diese Umgebung.
      - Jede Umgebung (lokal, Staging, Produktion) hat ihre eigene .env.
      - Neue Variablen trägt man nur in .env ein, damit niemand sie sieht.
    answers: [0, 1, 2]
    explanation: Neue Variablen gehören zusätzlich (ohne echte Werte) in .env.example, damit das Team weiß, dass es sie gibt.
  - type: find-bug
    question: Diese Route funktioniert lokal, liefert aber in der Produktion (mit config:cache) einen leeren Text. Welche Zeile ist schuld?
    language: php
    code: |
      <?php

      use Illuminate\Support\Facades\Route;

      Route::get('/kontakt', function () {
          $mail = env('KONTAKT_EMAIL');

          return "Schreib uns: {$mail}";
      });
    bug_line: 6
    explanation: env() darf nur in Konfigurationsdateien stehen. Richtig ist eine config/kontakt.php mit env() und in der Route config('kontakt.email').
  - type: match
    question: Ordne jeder Variable ihre Bedeutung zu.
    pairs:
      - { left: APP_ENV, right: Name der Umgebung (local oder production) }
      - { left: APP_DEBUG, right: Zeigt bei Fehlern Details wie den Stack-Trace }
      - { left: APP_KEY, right: Geheimer Schlüssel zum Verschlüsseln von Cookies und Sessions }
      - { left: DB_CONNECTION, right: Welcher Datenbanktreiber benutzt wird }
    explanation: Diese Variablen stehen in jeder frischen .env. APP_DEBUG muss in der Produktion immer false sein.
tasks:
  - id: kontakt-konfiguration
    type: terminal
    title: Eine eigene Konfigurationsdatei
    description: |
      Im Ordner `kontakt-config` liegt eine frische Laravel-Anwendung. Die Kontaktadresse soll pro
      Umgebung einstellbar sein.

      1. Lege `config/kontakt.php` an. Sie gibt ein Array mit dem Schlüssel `email` zurück, gelesen aus
         der Umgebungsvariable `KONTAKT_EMAIL` mit dem Standardwert `info@example.com`.
      2. Setze in `.env` den Wert `KONTAKT_EMAIL=hallo@example.com`.
      3. Trage die Variable in `.env.example` ein (z. B. `KONTAKT_EMAIL=`).
      4. Ergänze in `routes/web.php` die Route `GET /kontakt`, die `Schreib uns: hallo@example.com`
         zurückgibt – die Adresse liest sie mit `config()`, **nicht** mit `env()`.

      Klicke zuerst auf **Aufgabe vorbereiten**. Beim ersten Mal lädt Composer Laravel herunter, das
      dauert etwa eine Minute.
    workdir: kontakt-config
    setup: |
      # Laravel-13-Basis (mit Pest) einmal bauen und zwischenspeichern, dann hierher kopieren
      B="$HOME/.cache/stacklab/laravel13"
      if [ ! -f "$B/.fertig" ]; then
        T="$B.bau.$$"; rm -rf "$T"; mkdir -p "$(dirname "$B")"
        timeout 170 composer create-project laravel/laravel "$T" "^13.0" -n -q --prefer-dist </dev/null
        cd "$T"
        timeout 170 composer require pestphp/pest pestphp/pest-plugin-laravel --dev -W -n -q </dev/null
        printf '%s\n' '<?php' '' "pest()->extend(Tests\\TestCase::class)->in('Feature');" > tests/Pest.php
        printf '%s\n' '<?php' '' "test('the application returns a successful response', function () {" "    \$this->get('/')->assertStatus(200);" '});' > tests/Feature/ExampleTest.php
        printf '%s\n' '<?php' '' "test('that true is true', function () {" '    expect(true)->toBeTrue();' '});' > tests/Unit/ExampleTest.php
        touch .fertig && cd - >/dev/null
        rm -rf "$B" && mv "$T" "$B"
      fi
      cp -a "$B/." . && rm -f .fertig
    checks:
      - type: file_exists
        path: config/kontakt.php
        message: Die Datei config/kontakt.php fehlt noch.
      - type: command
        run: php artisan tinker --execute="echo config('kontakt.email');"
        stdout_matches: "^hallo@example\\.com\\s*$"
        message: config('kontakt.email') liefert noch nicht hallo@example.com. Prüfe config/kontakt.php und die Zeile in .env.
      - type: file_contains
        path: .env.example
        pattern: "^KONTAKT_EMAIL="
        message: Dokumentiere KONTAKT_EMAIL in .env.example.
      - type: command
        run: |
          php -r 'require "vendor/autoload.php"; $app = require "bootstrap/app.php"; $r = $app->make(Illuminate\Contracts\Http\Kernel::class)->handle(Illuminate\Http\Request::create("/kontakt")); echo $r->getStatusCode(), " ", $r->getContent();'
        stdout_matches: "^200 Schreib uns: hallo@example\\.com\\s*$"
        message: "GET /kontakt liefert noch nicht „Schreib uns: hallo@example.com“."
      - type: command
        run: "! grep -n \"env(\" routes/web.php"
        message: In routes/web.php steht noch env(. Lies den Wert dort mit config('kontakt.email').
    hints:
      - "Eine Konfigurationsdatei: `<?php return ['email' => env('KONTAKT_EMAIL', 'info@example.com')];`"
      - Den Dateinamen ohne `.php` benutzt du als ersten Teil des Schlüssels – `config('kontakt.email')`.
      - Bekommst du den Standardwert statt deiner Adresse? Dann prüfe die Schreibweise in `.env` und führe `php artisan config:clear` aus.
    solution: |
      ```php title="config/kontakt.php"
      <?php

      return [
          'email' => env('KONTAKT_EMAIL', 'info@example.com'),
      ];
      ```

      ```bash
      echo 'KONTAKT_EMAIL=hallo@example.com' >> .env
      echo 'KONTAKT_EMAIL=' >> .env.example
      ```

      ```php title="routes/web.php (Ergänzung)"
      Route::get('/kontakt', function () {
          return 'Schreib uns: '.config('kontakt.email');
      });
      ```
  - id: env-parser
    type: code
    language: php
    title: Ein Mini-.env-Parser
    description: |
      Laravel liest `.env` mit einer Bibliothek ein. Baue das Prinzip in klein nach: Schreibe die
      Funktion `parseEnv(string $inhalt): array`, die aus dem Text einer `.env`-Datei ein Array macht.

      - Jede Zeile hat die Form `SCHLUESSEL=wert`. Leerzeichen um Schlüssel und Wert werden entfernt.
      - Leere Zeilen und Zeilen, die mit `#` beginnen, werden übersprungen.
      - Steht der Wert in doppelten Anführungszeichen (`"Meine App"`), werden diese entfernt.
      - Der Wert darf selbst ein `=` enthalten – getrennt wird nur am **ersten** `=`.
    starter: |
      <?php

      function parseEnv(string $inhalt): array
      {
          $werte = [];

          // Tipp: explode("\n", $inhalt) liefert die Zeilen

          return $werte;
      }
    tests:
      - name: liest einfache Zeilen
        code: |
          assert_same(['APP_NAME' => 'Leseliste', 'APP_DEBUG' => 'true'], parseEnv("APP_NAME=Leseliste\nAPP_DEBUG=true"));
      - name: überspringt Kommentare und leere Zeilen
        code: |
          assert_same(['A' => '1'], parseEnv("# Kommentar\n\nA=1\n"));
      - name: entfernt Anführungszeichen und Leerzeichen
        code: |
          assert_same(['APP_NAME' => 'Meine App'], parseEnv('  APP_NAME = "Meine App"  '));
      - name: trennt nur am ersten Gleichheitszeichen
        code: |
          assert_same(['APP_KEY' => 'base64:abc=='], parseEnv('APP_KEY=base64:abc=='));
      - name: leerer Inhalt ergibt leeres Array
        code: |
          assert_same([], parseEnv(''));
    hints:
      - "`explode('=', $zeile, 2)` teilt nur am ersten Gleichheitszeichen."
      - "`str_starts_with(trim($zeile), '#')` erkennt Kommentare."
      - "Anführungszeichen entfernst du mit `trim($wert, '\"')`."
    solution: |
      <?php

      function parseEnv(string $inhalt): array
      {
          $werte = [];

          foreach (explode("\n", $inhalt) as $zeile) {
              $zeile = trim($zeile);
              if ($zeile === '' || str_starts_with($zeile, '#') || ! str_contains($zeile, '=')) {
                  continue;
              }

              [$schluessel, $wert] = explode('=', $zeile, 2);
              $werte[trim($schluessel)] = trim(trim($wert), '"');
          }

          return $werte;
      }
  - id: produktion-vorbereiten
    type: simulated
    title: Konfiguration auf dem Server absichern
    description: |
      Deine Leseliste läuft auf einem Server. Eine Kollegin meldet, dass bei einem Fehler der komplette
      Stack-Trace im Browser erscheint. Melde dich als `deploy` am Server `203.0.113.10` an, wechsle nach
      `/var/www/leseliste`, schau nach, wie `APP_DEBUG` gesetzt ist, korrigiere den Wert auf `false` und
      baue danach den Konfigurations-Cache neu.
    prompt: "du@laptop:~$"
    steps:
      - expect: "^ssh\\s+deploy@203\\.0\\.113\\.10$"
        output: |
          Welcome to Ubuntu 24.04 LTS
        prompt: "deploy@server:~$"
        hint: "Anmelden mit `ssh benutzer@ip`."
      - expect: "^cd\\s+/var/www/leseliste/?$"
        output: ""
        prompt: "deploy@server:/var/www/leseliste$"
        hint: "Wechsle mit `cd /var/www/leseliste` in den Projektordner."
      - expect: "^(grep\\s+APP_DEBUG\\s+\\.env|cat\\s+\\.env)$"
        output: |
          APP_DEBUG=true
        hint: "`grep APP_DEBUG .env` zeigt die Zeile."
      - expect: "^sed\\s+-i\\s+['\"]?s/APP_DEBUG=true/APP_DEBUG=false/['\"]?\\s+\\.env$"
        output: ""
        hint: "Ersetze den Wert mit `sed -i 's/APP_DEBUG=true/APP_DEBUG=false/' .env`."
      - expect: "^php\\s+artisan\\s+config:cache$"
        output: |
             INFO  Configuration cached successfully.
        hint: "Der Cache wird mit `php artisan config:cache` neu gebaut."
    responses:
      - match: "^ls"
        output: "app  artisan  bootstrap  config  database  public  resources  routes  storage  vendor"
      - match: "^php\\s+artisan\\s+about"
        output: "  Environment ......................................... production"
---
Lokal willst du jeden Fehler mit allen Details sehen. Auf dem Server dürfen Besucher:innen dagegen niemals
einen Stack-Trace mit Dateipfaden und Passwörtern zu Gesicht bekommen. Dieselbe Anwendung braucht also
**unterschiedliche Einstellungen** – ohne dass du den Code änderst.

## Die Datei .env

Laravel liest beim Start die Datei `.env` im Projektordner. Sie enthält einfache Zeilen der Form
`SCHLUESSEL=wert`, also [[umgebungsvariable|Umgebungsvariablen]]:

```ini title=".env (Ausschnitt)"
APP_NAME=Leseliste
APP_ENV=local
APP_KEY=base64:...
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=sqlite
```

Jede Umgebung hat ihre **eigene** `.env`: dein Laptop, der Testserver, die Produktion. Deshalb steht
`.env` in der `.gitignore` und landet nie im Repository. Stattdessen gibt es die
[[env-example|.env.example]] mit allen Schlüsseln, aber ohne echte Geheimnisse.

> [!MERKSATZ]
> Code ist überall gleich, die [[env-datei|.env]] ist pro Umgebung verschieden. Geheimnisse wie Passwörter
> stehen nur in `.env`, niemals im Code oder im Repository.

## Die wichtigsten Einträge

| Variable | Bedeutung | Lokal | Produktion |
|---|---|---|---|
| `APP_ENV` | Name der Umgebung | `local` | `production` |
| `APP_DEBUG` | Fehlerdetails anzeigen | `true` | **immer** `false` |
| `APP_KEY` | Schlüssel für Verschlüsselung | eigener Wert | eigener Wert |
| `APP_URL` | Basis-Adresse der App | `http://localhost:8000` | `https://example.com` |
| `DB_CONNECTION` | Datenbanktreiber | `sqlite` | z. B. `mysql` |

Der [[app-key|APP_KEY]] verschlüsselt Cookies und Sessions. Fehlt er, startet die App mit einer
Fehlermeldung. `php artisan key:generate` erzeugt einen neuen Schlüssel und trägt ihn in `.env` ein.

> [!ACHTUNG]
> Ändere den `APP_KEY` einer laufenden Produktion nicht leichtfertig: Alle angemeldeten Personen verlieren
> ihre Session, und verschlüsselte Daten lassen sich nicht mehr lesen.

## Die Dateien in config/

Der Code liest `.env` nicht direkt. Dazwischen liegen die Konfigurationsdateien in `config/`. Jede gibt ein
PHP-Array zurück:

```php title="config/app.php (Ausschnitt)"
return [
    'name' => env('APP_NAME', 'Laravel'),
    'debug' => (bool) env('APP_DEBUG', false),
];
```

`env('APP_NAME', 'Laravel')` liest die Variable und nimmt `'Laravel'`, falls sie fehlt. Im restlichen Code
nutzt du `config()` mit Punkt-Schreibweise: **Dateiname.Schlüssel**.

```php
config('app.name');               // "Leseliste"
config('app.debug');              // true
config('leseliste.pro_seite', 10); // mit Standardwert
```

Eigene Einstellungen bekommen eine eigene Datei, etwa `config/leseliste.php`. `php artisan config:show app`
zeigt dir alle Werte einer Datei an.

## Der Konfigurations-Cache

In der Produktion führt man `php artisan config:cache` aus. Laravel liest dann alle Dateien in `config/`
einmal ein und speichert das Ergebnis in **einer** Datei – das spart bei jeder Anfrage Zeit.

Der Haken: Mit Cache lädt Laravel `.env` gar nicht mehr. Jedes `env()` außerhalb von `config/` liefert
dann `null`.

```php title="Falsch – im Controller"
$mail = env('KONTAKT_EMAIL');
```

```php title="Richtig – im Controller"
$mail = config('kontakt.email');
```

> [!FEHLER]
> **`env()` im Controller oder in einer View.** Lokal funktioniert es, in der Produktion mit
> `config:cache` plötzlich nicht mehr. Regel: `env()` nur in `config/`, sonst immer `config()`.

> [!TIPP]
> Änderst du lokal `.env` und siehst den alten Wert, hast du vermutlich einmal `config:cache`
> ausgeführt. `php artisan config:clear` löscht den Cache wieder.

## Umgebung im Code abfragen

Manchmal soll Code nur lokal laufen, etwa eine Testanzeige. Dafür gibt es
`app()->environment()`:

```php
if (app()->environment('local')) {
    // nur auf deinem Rechner
}
```

`php artisan env` zeigt die aktuelle Umgebung im Terminal. Halte solche Abfragen aber selten: Je mehr Code
sich je nach Umgebung anders verhält, desto schwerer ist er zu testen.

> [!PRAXIS]
> In Teams gilt fast immer: Wer eine neue Variable einführt, trägt sie im selben Commit in
> `.env.example` ein und erwähnt sie in der Pull-Request-Beschreibung. So stolpert niemand beim nächsten
> `git pull` über eine fehlende Einstellung.

## Zusammenfassung

- `.env` enthält Einstellungen und Geheimnisse **pro Umgebung** und gehört nicht ins Repository.
- `.env.example` dokumentiert alle Schlüssel ohne echte Werte.
- Dateien in `config/` lesen `.env` mit `env()`; der Rest des Codes nutzt `config('datei.schluessel')`.
- `APP_DEBUG` ist in der Produktion immer `false`; `APP_KEY` erzeugst du mit `php artisan key:generate`.
- `php artisan config:cache` beschleunigt die Produktion, `config:clear` löscht den Cache.
