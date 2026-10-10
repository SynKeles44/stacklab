---
title: Logging in Laravel – Kanäle, JSON und was niemals ins Log gehört
summary: Wie Laravels Logging-Kanäle funktionieren, wie du JSON-Logs auf stderr für Container einrichtest und wie du Geheimnisse und personenbezogene Daten aus den Logs heraushältst.
duration: 25
sources:
  - title: Laravel 13 – Logging
    url: https://laravel.com/docs/13.x/logging
  - title: Laravel 13 – Context
    url: https://laravel.com/docs/13.x/context
  - title: PHP – SensitiveParameter-Attribut
    url: https://www.php.net/manual/de/class.sensitiveparameter.php
  - title: OWASP Logging Cheat Sheet
    url: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
quiz:
  - type: single
    question: Deine Laravel-App läuft in einem Docker-Container. Wohin sollten die Logs gehen?
    options:
      - In `storage/logs/laravel.log` im Container – dort findet man sie immer.
      - Nach stderr bzw. stdout, damit die Container-Plattform sie einsammelt.
      - Per E-Mail an das ganze Team.
      - Nirgendwohin, Container brauchen keine Logs.
    answer: 1
    explanation: Container sind kurzlebig. Eine Datei im Container verschwindet beim nächsten Deployment. Die Plattform (Docker, Kubernetes, ECS) sammelt stdout/stderr ein und leitet sie an Loki oder einen anderen Log-Speicher weiter.
  - type: multiple
    question: Was gehört niemals im Klartext in ein Log?
    options:
      - Passwörter und Passwort-Hashes
      - API-Tokens und der Authorization-Header
      - Die Route, z. B. `POST /checkout`
      - Vollständige Kreditkartennummern
    answers: [0, 1, 3]
    explanation: Logs werden kopiert, weitergeleitet und oft länger aufbewahrt als gedacht. Geheimnisse und Zahlungsdaten haben dort nichts zu suchen. Die Route ist dagegen unkritisch und sehr nützlich.
  - type: cloze
    text: Der Kanal, der mehrere andere Kanäle bündelt, heißt in Laravel ___. Welche Kanäle er enthält, steuerst du mit der Umgebungsvariable `LOG____`.
    blanks:
      - [stack]
      - [STACK]
    explanation: Der Standard-Kanal ist `stack`. Seine Liste kommt aus `LOG_STACK`, z. B. `LOG_STACK=single,stderr_json`.
  - type: find-bug
    question: In welcher Zeile landet ein Geheimnis im Log?
    language: php
    code: |
      public function login(LoginRequest $request): RedirectResponse
      {
          Log::info('Login attempt', ['email_hash' => hash('sha256', $request->email)]);
          if (! Auth::attempt($request->only('email', 'password'))) {
              Log::warning('Login failed', $request->all());
              return back();
          }
          return redirect('/dashboard');
      }
    bug_line: 5
    explanation: "`$request->all()` enthält auch das Passwort im Klartext. Logge nur ausgewählte, unkritische Felder – etwa den Hash der E-Mail-Adresse wie in Zeile 3."
tasks:
  - id: json-kanal-einrichten
    type: terminal
    title: Einen JSON-Kanal für Container einrichten
    description: |
      Im Ordner `logging-config` liegt eine verkleinerte `config/logging.php` einer Laravel-App. Sie
      schreibt bisher nur in eine Datei. Für den Betrieb im Container soll sie zusätzlich JSON nach stderr
      schreiben.

      1. Füge im Array `channels` einen Kanal `stderr_json` hinzu:
         - `driver` ist `monolog`,
         - `handler` ist `StreamHandler::class` mit `handler_with` → `stream` = `php://stderr`,
         - `formatter` ist `JsonFormatter::class` (die `use`-Zeilen stehen schon oben in der Datei),
         - `level` ist `env('LOG_LEVEL', 'info')`.
      2. Ändere den Standardwert von `LOG_STACK` so, dass der Kanal `stack` die Kanäle `single` **und**
         `stderr_json` enthält.
      3. Prüfe die Syntax mit `php -l config/logging.php`.

      Klicke zuerst auf **Aufgabe vorbereiten**. Bearbeiten kannst du die Datei mit `nano config/logging.php`.
    workdir: logging-config
    setup: |
      mkdir -p config
      cat > config/logging.php <<'EOF'
      <?php

      use Monolog\Formatter\JsonFormatter;
      use Monolog\Handler\StreamHandler;

      return [
          'default' => env('LOG_CHANNEL', 'stack'),

          'channels' => [
              'stack' => [
                  'driver' => 'stack',
                  'channels' => explode(',', (string) env('LOG_STACK', 'single')),
                  'ignore_exceptions' => false,
              ],

              'single' => [
                  'driver' => 'single',
                  'path' => storage_path('logs/laravel.log'),
                  'level' => env('LOG_LEVEL', 'debug'),
              ],
          ],
      ];
      EOF
    checks:
      - type: command
        run: php -l config/logging.php
        message: config/logging.php enthält einen Syntaxfehler. Prüfe Kommas und Klammern mit php -l config/logging.php.
      - type: command
        run: php -r 'function env($k, $d = null) { return $d; } function storage_path($p = "") { return "/storage/" . $p; } echo json_encode((require "config/logging.php")["channels"]["stderr_json"] ?? null);' | jq -r '.driver'
        stdout_equals: monolog
        message: Es gibt noch keinen Kanal stderr_json mit 'driver' => 'monolog'.
      - type: command
        run: php -r 'function env($k, $d = null) { return $d; } function storage_path($p = "") { return "/storage/" . $p; } echo json_encode((require "config/logging.php")["channels"]["stderr_json"] ?? null);' | jq -r '[.handler, .handler_with.stream] | join(" ")'
        stdout_equals: "Monolog\\Handler\\StreamHandler php://stderr"
        message: "Der Kanal stderr_json braucht 'handler' => StreamHandler::class und 'handler_with' => ['stream' => 'php://stderr']."
      - type: command
        run: php -r 'function env($k, $d = null) { return $d; } function storage_path($p = "") { return "/storage/" . $p; } echo json_encode((require "config/logging.php")["channels"]["stderr_json"] ?? null);' | jq -r '.formatter'
        stdout_equals: "Monolog\\Formatter\\JsonFormatter"
        message: "Setze im Kanal stderr_json 'formatter' => JsonFormatter::class."
      - type: command
        run: php -r 'function env($k, $d = null) { return $d; } function storage_path($p = "") { return "/storage/" . $p; } echo json_encode((require "config/logging.php")["channels"]["stderr_json"] ?? null);' | jq -r '.level'
        stdout_equals: info
        message: "Setze im Kanal stderr_json 'level' => env('LOG_LEVEL', 'info')."
      - type: command
        run: php -r 'function env($k, $d = null) { return $d; } function storage_path($p = "") { return "/storage/" . $p; } echo json_encode((require "config/logging.php")["channels"]["stack"]["channels"]);' | jq -r 'sort | join(",")'
        stdout_equals: "single,stderr_json"
        message: Der Kanal stack soll standardmäßig single und stderr_json enthalten – ändere den Standardwert von env('LOG_STACK', …) auf 'single,stderr_json'.
    hints:
      - Kopiere den Block von `single` als Vorlage und passe ihn an. Achte auf das Komma nach jedem Eintrag.
      - "`'handler_with' => ['stream' => 'php://stderr'],` übergibt den Ausgabekanal an den StreamHandler."
      - "Für den Stack: `env('LOG_STACK', 'single,stderr_json')` – explode macht daraus zwei Einträge."
    solution: |
      ```php
      'stack' => [
          'driver' => 'stack',
          'channels' => explode(',', (string) env('LOG_STACK', 'single,stderr_json')),
          'ignore_exceptions' => false,
      ],

      // … single bleibt unverändert …

      'stderr_json' => [
          'driver' => 'monolog',
          'level' => env('LOG_LEVEL', 'info'),
          'handler' => StreamHandler::class,
          'handler_with' => ['stream' => 'php://stderr'],
          'formatter' => JsonFormatter::class,
      ],
      ```

      Danach `php -l config/logging.php`.
  - id: kontext-schwaerzen
    type: code
    language: php
    title: Sensible Felder schwärzen
    description: |
      Bevor Kontext-Daten ins Log gehen, sollen sensible Werte ersetzt werden. Schreibe
      `redact(array $context): array`:

      - Ist ein Schlüssel einer von `password`, `password_confirmation`, `token`, `authorization`,
        `credit_card` (Groß-/Kleinschreibung egal), wird sein Wert durch `'[REDACTED]'` ersetzt.
      - Verschachtelte Arrays werden ebenfalls durchsucht.
      - Alle anderen Werte bleiben unverändert.
    starter: |
      <?php
      declare(strict_types=1);

      function redact(array $context): array
      {
          $sensitive = ['password', 'password_confirmation', 'token', 'authorization', 'credit_card'];

          return $context;
      }
    tests:
      - name: schwärzt ein Passwort
        code: assert_same(['email_hash' => 'ab12', 'password' => '[REDACTED]'], redact(['email_hash' => 'ab12', 'password' => 'geheim']));
      - name: leerer Kontext bleibt leer
        code: assert_same([], redact([]));
      - name: ignoriert Groß- und Kleinschreibung
        code: assert_same(['Authorization' => '[REDACTED]', 'route' => '/api'], redact(['Authorization' => 'Bearer abc', 'route' => '/api']));
      - name: durchsucht verschachtelte Arrays
        code: assert_same(['order_id' => 7, 'payment' => ['credit_card' => '[REDACTED]', 'provider' => 'card']], redact(['order_id' => 7, 'payment' => ['credit_card' => '4111111111111111', 'provider' => 'card']]));
    solution: |
      <?php
      declare(strict_types=1);

      function redact(array $context): array
      {
          $sensitive = ['password', 'password_confirmation', 'token', 'authorization', 'credit_card'];
          $result = [];

          foreach ($context as $key => $value) {
              if (is_string($key) && in_array(strtolower($key), $sensitive, true)) {
                  $result[$key] = '[REDACTED]';
              } elseif (is_array($value)) {
                  $result[$key] = redact($value);
              } else {
                  $result[$key] = $value;
              }
          }

          return $result;
      }
---
Du hast verstanden, wie gute Logzeilen aussehen. Jetzt geht es um die Praxis in Laravel: Wohin schreibt
die App ihre Logs, wie bekommst du JSON statt Text – und wie verhinderst du, dass eines Tages ein Passwort
oder eine Kreditkartennummer in deinem Log-System landet?

## Kanäle: wohin Laravel loggt

Laravel nutzt intern die Bibliothek [[monolog|Monolog]]. Wohin eine Meldung geht, bestimmt ein
[[log-channel|Logging-Kanal]]. Alle Kanäle stehen in `config/logging.php`.

| Treiber | Wohin? | Typischer Einsatz |
|---|---|---|
| `single` | eine Datei `storage/logs/laravel.log` | lokale Entwicklung |
| `daily` | eine Datei pro Tag, alte werden gelöscht | klassischer Server |
| `stack` | mehrere Kanäle gleichzeitig | Standard-Kanal |
| `monolog` | beliebiger Monolog-Handler, z. B. stderr | Container |
| `syslog`, `errorlog` | System-Log bzw. PHP-Fehlerlog | ältere Server |
| `slack` | eine Chat-Nachricht | nur für `critical` und schlimmer |

Gesteuert wird das über [[umgebungsvariable|Umgebungsvariablen]] in der `.env`:

```bash title=".env"
LOG_CHANNEL=stack
LOG_STACK=single,stderr_json
LOG_LEVEL=info
```

Jeder Kanal hat ein `level`: Meldungen darunter ignoriert er. So kann `single` alles ab `debug`
speichern, während `slack` nur `critical` weiterleitet.

## JSON auf stderr für Container

Läuft die App in einem [[container|Container]], gilt die Regel aus der [[twelve-factor-app|Twelve-Factor-App]]:
Logs sind ein **Strom von Ereignissen** nach stdout/stderr. Die Plattform sammelt ihn ein und leitet ihn
weiter – etwa zu Loki. Eine Datei im Container wäre beim nächsten Deployment weg.

```php title="config/logging.php – zusätzlicher Kanal"
use Monolog\Formatter\JsonFormatter;
use Monolog\Handler\StreamHandler;

'stderr_json' => [
    'driver' => 'monolog',
    'level' => env('LOG_LEVEL', 'info'),
    'handler' => StreamHandler::class,
    'handler_with' => ['stream' => 'php://stderr'],
    'formatter' => JsonFormatter::class,
],
```

Der `JsonFormatter` schreibt pro Meldung eine JSON-Zeile mit `message`, `context`, `level_name`,
`channel` und `datetime`. Lokal liest du die Logs mit `docker compose logs -f app` mit.

> [!TIPP]
> Neuere Laravel-Projekte haben schon einen Kanal `stderr`. Dessen Formatter steuerst du über
> `LOG_STDERR_FORMATTER` – schau zuerst in deine `config/logging.php`, bevor du etwas Neues anlegst.

## Kontext an jede Zeile hängen

Damit du die Korrelations-ID nicht in jeden Aufruf schreiben musst, gibt es zwei Wege:

```php title="Kontext für alle Kanäle – typischerweise in einer Middleware"
Log::shareContext(['request_id' => $id]);
Log::info('Order created', ['order_id' => $order->id]);
// → {"message":"Order created","context":{"order_id":42,"request_id":"req-b2"}, …}
```

Seit Laravel 11 gibt es außerdem die Facade `Context`. Was du mit `Context::add('request_id', $id)`
hinzufügst, hängt Laravel als Metadaten an jede Logzeile – und gibt es automatisch an
[[queue-job|Queue-Jobs]] weiter, die während der Anfrage verschickt werden. So bleibt die ID auch im
Hintergrund-Job erhalten.

> [!PRAXIS]
> In der Praxis sitzt eine kleine Middleware ganz vorne in der Kette: Sie liest oder erzeugt die
> Request-ID und legt sie per `Context::add()` ab. Alles andere loggt danach ganz normal.

## Was niemals ins Log gehört

Logs werden kopiert, an Dienstleister geschickt, monatelang aufbewahrt und von vielen Menschen gelesen.
Behandle sie wie eine halböffentliche Datei.

| Niemals | Stattdessen |
|---|---|
| Passwörter, auch gehasht | gar nichts – höchstens „Login failed“ |
| [[api-key\|API-Keys]], Tokens, `Authorization`-Header, Session-IDs | nichts oder die letzten 4 Zeichen |
| Kreditkarten- und Kontonummern | nur Zahlungs-ID des Anbieters |
| komplette Request-Bodies (`$request->all()`) | ausgewählte, harmlose Felder |
| [[personenbezogene-daten\|Personenbezogene Daten]] wie Name, E-Mail, Adresse | interne User-ID oder Hash |

Für personenbezogene Daten gilt die DSGVO: nur loggen, was du wirklich brauchst, und Logs nach einer
festen Frist löschen (etwa 14 oder 30 Tage).

> [!FEHLER]
> **`Log::error('Login failed', $request->all())`.** Das schreibt das eingegebene Passwort im Klartext ins
> Log – oft sogar ein **richtiges** Passwort mit einem Tippfehler. Logge nur, was du ausdrücklich auswählst.

## Schutz eingebaut statt vergessen

Verlass dich nicht darauf, dass alle immer aufpassen. Baue Schutz ein:

- **Allowlist statt Blocklist:** Logge nur ausgewählte Felder, nie ganze Objekte oder Requests.
- **Schwärzen:** Ein Monolog-[[log-processor|Processor]] ersetzt Felder wie `password` oder `token` zentral durch `[REDACTED]`.
- **`#[\SensitiveParameter]`:** Markiert Funktionsparameter, damit PHP ihren Wert in [[stack-trace|Stack-Traces]] verbirgt.
- **Aufbewahrung begrenzen:** `daily` mit `max_files`, in Loki eine Retention-Frist.

```php title="Parameter in Stack-Traces verbergen"
public function charge(string $orderId, #[\SensitiveParameter] string $cardToken): void
```

## Zusammenfassung

- Laravel loggt über **Kanäle** in `config/logging.php`; `stack` bündelt mehrere, `LOG_STACK` wählt sie aus.
- In Containern gehen Logs als **JSON nach stderr** – Kanal mit `monolog`, `StreamHandler` und `JsonFormatter`.
- `Log::shareContext()` und die `Context`-Facade hängen Kontext wie die Request-ID an jede Zeile.
- Passwörter, Tokens, Zahlungsdaten und unnötige personenbezogene Daten gehören **nie** ins Log.
- Schütze dich mit Allowlists, zentralem Schwärzen, `#[\SensitiveParameter]` und begrenzter Aufbewahrung.
