---
title: Service Provider
summary: Der Ort, an dem deine Anwendung startet – was in register() gehört, was in boot() und wie Laravel Provider findet.
duration: 20
sources:
  - title: Laravel – Service Providers
    url: https://laravel.com/docs/13.x/providers
  - title: Laravel – Request Lifecycle
    url: https://laravel.com/docs/13.x/lifecycle
quiz:
  - type: single
    question: Du willst in einem Provider einen Rate Limiter definieren, der die Facade `RateLimiter` nutzt. Wohin gehört der Code?
    options:
      - In register(), weil dort alles registriert wird
      - In boot(), weil dann alle anderen Provider schon registriert sind
      - In den Konstruktor des Providers
    answer: 1
    explanation: In register() darfst du nur Bindungen anlegen. Andere Dienste – auch Facades wie RateLimiter – nutzt du in boot(), denn erst dann sind alle Provider registriert.
  - type: multiple
    question: Was passiert, wenn du `php artisan make:provider BillingServiceProvider` ausführst?
    options:
      - Die Datei app/Providers/BillingServiceProvider.php wird angelegt
      - Der Provider wird in bootstrap/providers.php eingetragen
      - Alle Klassen in app/Billing werden automatisch gebunden
      - config/app.php bekommt einen neuen Eintrag
    answers: [0, 1]
    explanation: Seit Laravel 11 stehen eigene Provider in bootstrap/providers.php, und make:provider trägt sie dort ein. Bindungen schreibst du weiterhin selbst.
  - type: cloze
    text: "Ein Provider hat zwei Methoden: In ___() bindest du Dienste in den Container, in ___() nutzt du sie."
    blanks:
      - [register]
      - [boot]
    explanation: Zuerst laufen alle register()-Methoden, danach alle boot()-Methoden. Deshalb ist in boot() jeder Dienst verfügbar.
  - type: find-bug
    question: Dieser Provider stürzt beim Start manchmal ab. Welche Zeile ist das Problem?
    language: php
    code: |
      class ReportServiceProvider extends ServiceProvider
      {
          public function register(): void
          {
              $this->app->singleton(ReportBuilder::class, fn () => new ReportBuilder());
              View::share('reportTitle', config('reports.title'));
          }
      }
    bug_line: 6
    explanation: View::share nutzt den View-Dienst eines anderen Providers. Der ist in register() eventuell noch nicht registriert. Diese Zeile gehört in boot().
tasks:
  - id: eigener-provider
    type: terminal
    title: Ein eigener Service Provider
    description: |
      Im Ordner `provider-uebung` liegt eine frische Laravel-Anwendung. Dazu gibt es schon das Interface
      `App\Contracts\CurrencyFormatter` und die Klasse `App\Services\EuroFormatter`, die Cent-Beträge
      als Text formatiert (`1250` → `12,50 €`).

      1. Lege mit `php artisan make:provider FormattingServiceProvider` einen neuen Provider an und
         prüfe, dass er in `bootstrap/providers.php` steht.
      2. Binde in `register()` das Interface `CurrencyFormatter` als **Singleton** an `EuroFormatter`.
      3. Registriere in `boot()` ein Makro, damit überall `Str::euro(1250)` funktioniert. Es nutzt den
         Formatter aus dem Container:
         `Str::macro('euro', fn (int $cents) => app(CurrencyFormatter::class)->format($cents));`
      4. Teste mit `php artisan tinker --execute="echo Illuminate\Support\Str::euro(1250);"`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: provider-uebung
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
      mkdir -p app/Contracts app/Services
      cat > app/Contracts/CurrencyFormatter.php <<'EOF'
      <?php

      namespace App\Contracts;

      interface CurrencyFormatter
      {
          public function format(int $cents): string;
      }
      EOF
      cat > app/Services/EuroFormatter.php <<'EOF'
      <?php

      namespace App\Services;

      use App\Contracts\CurrencyFormatter;

      class EuroFormatter implements CurrencyFormatter
      {
          public function format(int $cents): string
          {
              return number_format($cents / 100, 2, ',', '.').' €';
          }
      }
      EOF
    checks:
      - type: file_exists
        path: app/Providers/FormattingServiceProvider.php
        message: Die Datei app/Providers/FormattingServiceProvider.php fehlt noch. Nutze php artisan make:provider FormattingServiceProvider.
      - type: file_contains
        path: bootstrap/providers.php
        pattern: "FormattingServiceProvider::class"
        message: FormattingServiceProvider steht noch nicht in bootstrap/providers.php.
      - type: command
        run: php artisan tinker --execute="\$a = app(App\Contracts\CurrencyFormatter::class); echo get_class(\$a), '|', var_export(\$a === app(App\Contracts\CurrencyFormatter::class), true);"
        stdout_matches: "^App\\\\Services\\\\EuroFormatter\\|true\\s*$"
        message: app(CurrencyFormatter::class) liefert noch nicht immer dieselbe EuroFormatter-Instanz. Binde das Interface mit singleton() in register().
      - type: command
        run: php artisan tinker --execute="echo Illuminate\Support\Str::euro(1250);"
        stdout_matches: "^12,50 €\\s*$"
        message: "Str::euro(1250) liefert noch nicht „12,50 €“. Registriere das Makro in boot()."
    hints:
      - "`make:provider` legt die Datei in `app/Providers` an und trägt sie automatisch in `bootstrap/providers.php` ein."
      - "In `register()`: `$this->app->singleton(CurrencyFormatter::class, EuroFormatter::class);`"
      - "Vergiss die `use`-Zeilen nicht: `App\\Contracts\\CurrencyFormatter`, `App\\Services\\EuroFormatter` und `Illuminate\\Support\\Str`."
    solution: |
      ```bash
      cd provider-uebung
      php artisan make:provider FormattingServiceProvider
      ```

      ```php title="app/Providers/FormattingServiceProvider.php"
      <?php

      namespace App\Providers;

      use App\Contracts\CurrencyFormatter;
      use App\Services\EuroFormatter;
      use Illuminate\Support\ServiceProvider;
      use Illuminate\Support\Str;

      class FormattingServiceProvider extends ServiceProvider
      {
          public function register(): void
          {
              $this->app->singleton(CurrencyFormatter::class, EuroFormatter::class);
          }

          public function boot(): void
          {
              Str::macro('euro', fn (int $cents) => app(CurrencyFormatter::class)->format($cents));
          }
      }
      ```
  - id: start-reihenfolge
    type: order
    title: Wie startet eine Laravel-Anwendung?
    description: Bringe die Schritte eines HTTP-Requests in die richtige Reihenfolge – vom Eintreffen bis zur Antwort.
    items:
      - "public/index.php nimmt den Request entgegen"
      - "bootstrap/app.php erzeugt die Application (den Container)"
      - "register() aller Service Provider läuft"
      - "boot() aller Service Provider läuft"
      - "Der Request durchläuft die Middleware"
      - "Router ruft Route bzw. Controller auf"
      - "Die Response geht zurück an den Browser"
    hints:
      - Erst müssen alle Dienste bekannt sein, bevor einer sie benutzt.
      - Middleware umschließt die Route – sie kommt vor dem Controller.
---
Im Service Container liegen die Baupläne deiner Anwendung. Aber irgendwo muss jemand sie eintragen –
bevor der erste Controller etwas verlangt. Das ist die Aufgabe der **Service Provider**: Sie sind der
Startpunkt, an dem eine Laravel-Anwendung zusammengesteckt wird.

## Was ein Service Provider ist

Ein [[service-provider|Service Provider]] ist eine Klasse, die beim Start der Anwendung aufgerufen wird.
Denk an das Aufbau-Team vor einem Konzert: Es stellt Bühne, Licht und Ton auf, bevor das Publikum
hereinkommt. Laravel selbst besteht aus vielen solchen Providern – für Datenbank, Cache, Mail, Queue.

Deine eigenen Provider stehen in `bootstrap/providers.php`:

```php title="bootstrap/providers.php"
<?php

return [
    App\Providers\AppServiceProvider::class,
    App\Providers\FormattingServiceProvider::class,
];
```

Einen neuen Provider erzeugst du mit [[artisan|Artisan]]. Der Befehl trägt ihn gleich in diese Datei ein:

```bash title="Terminal"
php artisan make:provider FormattingServiceProvider
```

> [!TIPP]
> Für kleine Projekte reicht der `AppServiceProvider`. Eigene Provider lohnen sich, wenn ein Bereich
> (Zahlung, Formatierung, Suche) viele Bindungen hat – dann bleibt jeder Provider übersichtlich.

## register(): nur Baupläne eintragen

In `register()` sagst du dem Container, wie er Dinge baut – sonst nichts.

```php
public function register(): void
{
    $this->app->singleton(CurrencyFormatter::class, EuroFormatter::class);

    $this->app->bind(Exporter::class, fn () => new CsvExporter(';'));
}
```

Warum diese Strenge? Laravel ruft **zuerst** `register()` aller Provider auf. Wenn dein Code dort einen
anderen Dienst benutzt, ist dessen Provider vielleicht noch gar nicht dran gewesen. Ergebnis: Fehler, die
nur manchmal auftreten – je nach Reihenfolge der Provider.

> [!MERKSATZ]
> In `register()` wird **nur gebunden**. Alles, was andere Dienste benutzt, gehört in `boot()`.

## boot(): die Anwendung einrichten

Wenn alle Provider registriert sind, ruft Laravel `boot()` auf. Jetzt steht dir der ganze Container zur
Verfügung. Typische Aufgaben:

| Aufgabe | Beispiel |
|---|---|
| Rate Limiter definieren | `RateLimiter::for('api', …)` |
| Makros registrieren | `Str::macro('euro', …)` |
| Eloquent-Einstellungen | `Model::preventLazyLoading(! app()->isProduction())` |
| Gates definieren | `Gate::define('admin', …)` |
| Daten für alle Views | `View::share('appName', config('app.name'))` |

```php
public function boot(): void
{
    Str::macro('euro', fn (int $cents) => app(CurrencyFormatter::class)->format($cents));
}
```

Ein [[makro|Makro]] hängt eine eigene Methode an eine Laravel-Klasse. Danach funktioniert `Str::euro(1250)`
überall in deiner Anwendung. Beachte: Das Makro holt den Formatter erst beim Aufruf aus dem Container.
So bleibt `boot()` schnell, auch wenn der Dienst teuer zu bauen ist.

> [!FEHLER]
> **Facades in `register()` benutzen.** `View::share()`, `Gate::define()` oder `RateLimiter::for()` in
> `register()` laufen manchmal gut und brechen dann nach einem Update ab. Sie gehören in `boot()`.

## Der Weg eines Requests

Mit den Providern wird klar, wie eine Anfrage durch Laravel läuft:

1. `public/index.php` – der [[front-controller|Front-Controller]] – nimmt jeden Request an.
2. `bootstrap/app.php` erzeugt die Application. Sie **ist** der Service Container.
3. Alle Provider registrieren ihre Dienste (`register()`), danach richten sie sich ein (`boot()`).
4. Der Request läuft durch die [[middleware|Middleware]] zur Route.
5. Die Response wandert zurück durch die Middleware zum Browser.

Ein Artisan-Befehl oder ein Queue-Worker startet genauso – nur ohne HTTP-Teil.

> [!PRAXIS]
> Wenn in einem Projekt „irgendwo“ etwas global eingestellt wird – ein Makro, ein Datumsformat, eine
> Lazy-Loading-Sperre –, schau zuerst in die `boot()`-Methoden der Provider. Dort steckt fast immer
> die Antwort.

## Zusammenfassung

- Service Provider stecken die Anwendung beim Start zusammen; eigene stehen in `bootstrap/providers.php`.
- `php artisan make:provider` legt einen Provider an und registriert ihn.
- `register()`: nur Bindungen in den Container eintragen.
- `boot()`: alles, was andere Dienste nutzt – Rate Limiter, Makros, Gates, View-Daten.
- Erst laufen alle `register()`-Methoden, dann alle `boot()`-Methoden.
