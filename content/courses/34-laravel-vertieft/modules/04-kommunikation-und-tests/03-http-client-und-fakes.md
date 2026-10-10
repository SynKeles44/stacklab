---
title: HTTP-Client und Testing-Fakes
summary: Externe APIs mit Laravels HTTP-Client robust aufrufen und Code mit Http-, Mail-, Queue-, Event- und Notification-Fakes testen – ohne echtes Netzwerk.
duration: 25
sources:
  - title: Laravel – HTTP Client
    url: https://laravel.com/docs/13.x/http-client
  - title: Laravel – Mocking
    url: https://laravel.com/docs/13.x/mocking
  - title: Laravel – Queues, Testing
    url: https://laravel.com/docs/13.x/queues#testing
quiz:
  - type: single
    question: "`Http::get('https://api.example.com/users')` liefert Status 500. Was passiert ohne weitere Methoden?"
    options:
      - Laravel wirft automatisch eine Exception
      - Du bekommst ein Response-Objekt; `failed()` ist true – werfen musst du selbst, z. B. mit `throw()`
      - Laravel wiederholt die Anfrage dreimal
    answer: 1
    explanation: Der HTTP-Client wirft bei 4xx/5xx nicht von selbst. Mit ->throw() wird daraus eine RequestException; mit retry() wird wiederholt.
  - type: match
    question: Welche Prüfung passt zu welchem Fake?
    pairs:
      - { left: "Http::fake()", right: "Http::assertSent(fn ($request) => …)" }
      - { left: "Mail::fake()", right: "Mail::assertSent(WelcomeMail::class)" }
      - { left: "Queue::fake()", right: "Queue::assertPushed(ExportReport::class)" }
      - { left: "Notification::fake()", right: "Notification::assertSentTo($user, PasswordChanged::class)" }
    explanation: Jeder Fake ersetzt den echten Dienst im Container durch einen Rekorder, der sich merkt, was passiert ist. Die assert-Methoden fragen diesen Rekorder ab.
  - type: cloze
    text: "Mit `Http::___Requests()` schlägt jeder Test fehl, der eine nicht gefakte HTTP-Anfrage verschicken will. Eine bestimmte Antwort für eine URL baust du mit `Http::___(['id' => 1], 201)`."
    blanks:
      - [preventStray]
      - [response]
    explanation: preventStrayRequests() verhindert, dass ein Test aus Versehen echte APIs aufruft. Http::response() erzeugt eine gefakte Antwort mit Body und Status.
  - type: find-bug
    question: Der Test soll prüfen, dass die Willkommens-Mail rausgeht. Er schlägt mit „The expected [WelcomeMail] mailable was not sent“ fehl, obwohl der Code korrekt ist. Welche Zeile ist das Problem?
    language: php
    code: |
      test('registration sends a welcome mail', function () {
          $this->postJson('/register', ['email' => 'ada@example.com', 'password' => 'geheim123']);

          Mail::fake();

          Mail::assertSent(WelcomeMail::class);
      });
    bug_line: 4
    explanation: Der Fake muss vor der Aktion stehen. Hier wird die Mail an den echten Mailer geschickt und erst danach der leere Fake eingesetzt.
tasks:
  - id: wetter-tests
    type: terminal
    title: Tests mit Fakes für einen Wetterdienst
    description: |
      Im Ordner `fakes-uebung` liegt eine Laravel-Anwendung mit Pest und diesen fertigen Teilen:

      - `App\Services\WeatherClient` – `temperature(string $city): float` ruft
        `GET https://api.example.com/current?city=…` mit Bearer-Token auf und liefert das Feld `temperature`.
      - `App\Jobs\SendWeatherReport` – Job mit `$city` und `$email`; holt die Temperatur und schickt die
        Mail `App\Mail\WeatherReport` an `$email`.
      - Route `POST /weather-reports` – prüft `city` und `email` und legt den Job in die Queue (Antwort 202).

      Schreibe `tests/Feature/WeatherTest.php` mit mindestens **vier** Tests – ohne echte HTTP-Anfragen
      und ohne echte Mails:

      1. `temperature('Berlin')` liefert `21.5`, wenn die API `{"temperature": 21.5}` antwortet. Prüfe mit
         `Http::assertSent`, dass genau die URL `https://api.example.com/current?city=Berlin` aufgerufen
         wurde.
      2. Antwortet die API mit Status 500, wirft `temperature()` eine `RequestException`.
      3. Der Job verschickt die Mail `WeatherReport` an die richtige Adresse (`Mail::fake()`,
         `Mail::assertSent`).
      4. `POST /weather-reports` antwortet mit 202 und legt `SendWeatherReport` in die Queue
         (`Queue::fake()`, `Queue::assertPushed`).

      Rufe in `beforeEach` `Http::preventStrayRequests();` auf. Starte die Tests mit `php artisan test`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: fakes-uebung
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
      printf '\nWEATHER_KEY=test-weather-key\n' >> .env
      sed -i "s/^];\$/    'weather' => [\n        'url' => env('WEATHER_URL', 'https:\/\/api.example.com'),\n        'key' => env('WEATHER_KEY'),\n    ],\n\n];/" config/services.php
      mkdir -p app/Services app/Jobs app/Mail
      cat > app/Services/WeatherClient.php <<'EOF'
      <?php

      namespace App\Services;

      use Illuminate\Support\Facades\Http;

      class WeatherClient
      {
          public function temperature(string $city): float
          {
              return (float) Http::baseUrl(config('services.weather.url'))
                  ->withToken(config('services.weather.key'))
                  ->timeout(5)
                  ->get('/current', ['city' => $city])
                  ->throw()
                  ->json('temperature');
          }
      }
      EOF
      cat > app/Mail/WeatherReport.php <<'EOF'
      <?php

      namespace App\Mail;

      use Illuminate\Mail\Mailable;
      use Illuminate\Mail\Mailables\Content;
      use Illuminate\Mail\Mailables\Envelope;

      class WeatherReport extends Mailable
      {
          public function __construct(public string $city, public float $temperature) {}

          public function envelope(): Envelope
          {
              return new Envelope(subject: "Wetter in {$this->city}: {$this->temperature} °C");
          }

          public function content(): Content
          {
              return new Content(htmlString: "<p>In {$this->city} sind es gerade {$this->temperature} °C.</p>");
          }
      }
      EOF
      cat > app/Jobs/SendWeatherReport.php <<'EOF'
      <?php

      namespace App\Jobs;

      use App\Mail\WeatherReport;
      use App\Services\WeatherClient;
      use Illuminate\Contracts\Queue\ShouldQueue;
      use Illuminate\Foundation\Queue\Queueable;
      use Illuminate\Support\Facades\Mail;

      class SendWeatherReport implements ShouldQueue
      {
          use Queueable;

          public function __construct(public string $city, public string $email) {}

          public function handle(WeatherClient $client): void
          {
              Mail::to($this->email)->send(new WeatherReport($this->city, $client->temperature($this->city)));
          }
      }
      EOF
      cat >> routes/web.php <<'EOF'

      Route::post('/weather-reports', function (Illuminate\Http\Request $request) {
          $data = $request->validate(['city' => 'required|string', 'email' => 'required|email']);
          App\Jobs\SendWeatherReport::dispatch($data['city'], $data['email']);

          return response()->json(['status' => 'queued'], 202);
      });
      EOF
    checks:
      - type: file_exists
        path: tests/Feature/WeatherTest.php
        message: Die Datei tests/Feature/WeatherTest.php fehlt noch.
      - type: command
        run: grep -cE "^\s*(test|it)\(" tests/Feature/WeatherTest.php
        stdout_matches: "^([4-9]|[1-9][0-9]+)\\s*$"
        message: WeatherTest.php braucht mindestens vier Tests (test(...) oder it(...)).
      - type: command
        run: "grep -q 'Http::fake' tests/Feature/WeatherTest.php && grep -q 'Mail::fake' tests/Feature/WeatherTest.php && grep -q 'Queue::fake' tests/Feature/WeatherTest.php && grep -q 'preventStrayRequests' tests/Feature/WeatherTest.php"
        message: Nutze in WeatherTest.php Http::fake, Mail::fake, Queue::fake und Http::preventStrayRequests().
      - type: command
        run: php artisan test tests/Feature/WeatherTest.php
        message: Die Tests in tests/Feature/WeatherTest.php schlagen noch fehl. Lies die Meldung von php artisan test tests/Feature/WeatherTest.php.
      - type: command
        run: |
          cp app/Services/WeatherClient.php .WeatherClient.orig && sed -i "s#'/current'#'/now'#" app/Services/WeatherClient.php && { php artisan test tests/Feature/WeatherTest.php >/dev/null 2>&1; rc=$?; cp .WeatherClient.orig app/Services/WeatherClient.php; rm -f .WeatherClient.orig; [ "$rc" -ne 0 ]; }
        message: "Deine Tests bemerken nicht, wenn der Client eine falsche URL aufruft. Prüfe mit Http::assertSent die vollständige URL, z. B. $request->url() === 'https://api.example.com/current?city=Berlin'."
    hints:
      - "`Http::fake(['api.example.com/*' => Http::response(['temperature' => 21.5])]);` – danach `expect(app(WeatherClient::class)->temperature('Berlin'))->toBe(21.5);`"
      - "Für den Job: `Http::fake(...)`, `Mail::fake()`, dann `SendWeatherReport::dispatchSync('Berlin', 'ada@example.com');` und `Mail::assertSent(WeatherReport::class, fn ($mail) => $mail->hasTo('ada@example.com'));`"
      - "Für die Route: `Queue::fake(); $this->postJson('/weather-reports', ['city' => 'Berlin', 'email' => 'ada@example.com'])->assertStatus(202); Queue::assertPushed(SendWeatherReport::class);`"
    solution: |
      ```php title="tests/Feature/WeatherTest.php"
      <?php

      use App\Jobs\SendWeatherReport;
      use App\Mail\WeatherReport;
      use App\Services\WeatherClient;
      use Illuminate\Http\Client\Request;
      use Illuminate\Http\Client\RequestException;
      use Illuminate\Support\Facades\Http;
      use Illuminate\Support\Facades\Mail;
      use Illuminate\Support\Facades\Queue;

      beforeEach(fn () => Http::preventStrayRequests());

      test('it reads the temperature from the api', function () {
          Http::fake(['api.example.com/*' => Http::response(['temperature' => 21.5])]);

          expect(app(WeatherClient::class)->temperature('Berlin'))->toBe(21.5);

          Http::assertSent(fn (Request $request) => $request->url() === 'https://api.example.com/current?city=Berlin'
              && $request->hasHeader('Authorization', 'Bearer test-weather-key'));
      });

      test('it throws when the api fails', function () {
          Http::fake(['api.example.com/*' => Http::response([], 500)]);

          expect(fn () => app(WeatherClient::class)->temperature('Berlin'))->toThrow(RequestException::class);
      });

      test('the job mails the report', function () {
          Http::fake(['api.example.com/*' => Http::response(['temperature' => 18.0])]);
          Mail::fake();

          SendWeatherReport::dispatchSync('Berlin', 'ada@example.com');

          Mail::assertSent(WeatherReport::class, fn (WeatherReport $mail) => $mail->hasTo('ada@example.com')
              && $mail->temperature === 18.0);
      });

      test('the route queues the job', function () {
          Queue::fake();

          $this->postJson('/weather-reports', ['city' => 'Berlin', 'email' => 'ada@example.com'])
              ->assertStatus(202);

          Queue::assertPushed(SendWeatherReport::class, fn ($job) => $job->city === 'Berlin');
      });
      ```
  - id: fakes-zuordnen
    type: dragdrop
    title: Welcher Fake gehört dazu?
    description: Ordne jede Assertion dem Fake zu, der vorher aufgerufen werden muss.
    targets:
      - { id: http, label: "Http::fake()" }
      - { id: mail, label: "Mail::fake()" }
      - { id: queue, label: "Queue::fake()" }
      - { id: event, label: "Event::fake()" }
      - { id: notification, label: "Notification::fake()" }
    items:
      - { label: "Http::assertSentCount(2)", target: http }
      - { label: "Mail::assertQueued(InvoiceMail::class)", target: mail }
      - { label: "Queue::assertNothingPushed()", target: queue }
      - { label: "Event::assertDispatched(OrderPaid::class)", target: event }
      - { label: "Notification::assertSentTo($user, PasswordChanged::class)", target: notification }
      - { label: "Http::assertNotSent(fn ($r) => str_contains($r->url(), 'delete'))", target: http }
    hints:
      - Der Name vor den zwei Doppelpunkten verrät die Facade.
---
Dein Bestellservice ruft einen Zahlungsdienst auf, verschickt Mails und legt Jobs in die Queue. Im Test
willst du nichts davon wirklich auslösen – keine Abbuchung, keine Mail an Kunden, kein wartender Worker.
Trotzdem musst du prüfen, **dass** es passiert wäre. Dafür hat Laravel den **HTTP-Client** und **Fakes**.

## Der HTTP-Client

Laravels [[http-client|HTTP-Client]] ist eine schlanke Schicht über der Bibliothek [[guzzle|Guzzle]]:

```php
use Illuminate\Support\Facades\Http;

$response = Http::withToken(config('services.weather.key'))
    ->acceptJson()
    ->timeout(5)
    ->retry(3, 200)
    ->get('https://api.example.com/current', ['city' => 'Berlin']);

$response->json('temperature');   // Feld aus dem JSON
$response->status();              // 200
$response->successful();          // true bei 2xx
$response->failed();              // true bei 4xx/5xx
```

| Methode | Wirkung |
|---|---|
| `withToken($t)` | Header `Authorization: Bearer …` |
| `timeout(5)` | nach 5 Sekunden abbrechen |
| `retry(3, 200)` | bis zu 3 Versuche, 200 ms Pause ([[retry|Retry]]) |
| `baseUrl($url)` | gemeinsamer Anfang aller Pfade |
| `throw()` | bei 4xx/5xx eine `RequestException` werfen |

> [!FEHLER]
> **Fehler werden still geschluckt.** Ohne `throw()` liefert ein 500er einfach eine Response, und
> `json('temperature')` ist `null`. Nutze `throw()` oder prüfe `failed()`, sonst rechnet dein Code mit
> leeren Daten weiter.

## Fakes: Rekorder statt echter Dienste

Ein [[fake|Fake]] ersetzt einen Laravel-Dienst im Container durch einen Rekorder. Er führt nichts aus,
merkt sich aber jeden Aufruf. Möglich ist das, weil Facades ihr Objekt aus dem Service Container holen –
der Fake wird einfach an diese Stelle gelegt.

```php
Http::fake([
    'api.example.com/*' => Http::response(['temperature' => 21.5], 200),
    'payments.example.com/*' => Http::response([], 500),
    '*' => Http::response('Nicht erwartet', 404),
]);
```

Die Muster werden von oben nach unten verglichen. Für wechselnde Antworten gibt es
`Http::sequence()->push(...)->push(...)`, etwa um einen Retry zu testen.

> [!MERKSATZ]
> **Erst faken, dann handeln, dann prüfen.** Ein Fake, der nach der Aktion gesetzt wird, hat nichts
> aufgezeichnet.

## Anfragen prüfen und verbieten

Nach der Aktion fragst du den Rekorder ab:

```php
Http::assertSent(function (Request $request) {
    return $request->url() === 'https://api.example.com/current?city=Berlin'
        && $request->hasHeader('Authorization', 'Bearer test-weather-key');
});

Http::assertSentCount(1);
Http::assertNothingSent();
```

`Request` ist hier `Illuminate\Http\Client\Request`. Prüfe so genau wie nötig: Ein Fake mit `'*'` ohne
`assertSent` bemerkt nicht, wenn dein Code die falsche URL aufruft.

Damit kein Test aus Versehen eine echte API erreicht, setzt du am Anfang:

```php
beforeEach(fn () => Http::preventStrayRequests());
```

## Wiederholungen testen mit Sequenzen

Wie testest du, dass `retry(2, 100)` wirklich hilft? Mit einer Sequenz: Der erste Aufruf scheitert, der
zweite klappt.

```php
Http::fake([
    'api.example.com/*' => Http::sequence()
        ->push([], 503)                       // 1. Versuch: Dienst überlastet
        ->push(['temperature' => 21.5], 200), // 2. Versuch: Erfolg
]);

expect(app(WeatherClient::class)->temperature('Berlin'))->toBe(21.5);
Http::assertSentCount(2);
```

Ohne `retry()` würde dieser Test mit einer `RequestException` scheitern – er beweist also genau das
Verhalten, auf das du dich in Produktion verlässt. Sind alle Antworten einer Sequenz verbraucht, wirft
der Fake einen Fehler; mit `->whenEmpty(Http::response())` legst du eine Standardantwort fest.

## Mail, Queue, Event und Notification

Die anderen Fakes funktionieren nach demselben Prinzip:

```php
Mail::fake();
Mail::assertSent(WeatherReport::class, fn ($mail) => $mail->hasTo('ada@example.com'));
Mail::assertQueued(InvoiceMail::class);      // bei Mail::queue() / ShouldQueue
Mail::assertNothingSent();

Queue::fake();
Queue::assertPushed(SendWeatherReport::class, fn ($job) => $job->city === 'Berlin');

Event::fake([OrderPaid::class]);             // nur dieses Event abfangen
Event::assertDispatched(OrderPaid::class);

Notification::fake();
Notification::assertSentTo($user, PasswordChanged::class);

Storage::fake('public');
Storage::disk('public')->assertExists('avatars/ada.png');
```

`Event::fake()` ohne Liste schaltet **alle** Events ab – auch Model-Events, an denen deine Observer
hängen. Gib deshalb lieber gezielt die Events an, die du prüfen willst.

> [!PRAXIS]
> Eine bewährte Teststrategie: Den Controller-Test mit `Queue::fake()` schreiben („legt er den Job
> ab?“) und den Job getrennt mit `dispatchSync()` plus `Http::fake()` und `Mail::fake()` testen („tut er
> das Richtige?“). So bleiben beide Tests klein und schnell.

## Zusammenfassung

- `Http::` mit `withToken`, `timeout`, `retry` und `throw()` ruft externe APIs robust auf.
- Fakes ersetzen Dienste im Container durch Rekorder: `Http`, `Mail`, `Queue`, `Event`, `Notification`, `Storage`.
- Reihenfolge: faken → Code ausführen → mit `assert…` prüfen.
- `Http::assertSent()` prüft URL, Header und Body; `Http::preventStrayRequests()` verbietet echte Anfragen.
- `Event::fake([...])` gezielt einsetzen, damit Observer und andere Events weiterlaufen.
