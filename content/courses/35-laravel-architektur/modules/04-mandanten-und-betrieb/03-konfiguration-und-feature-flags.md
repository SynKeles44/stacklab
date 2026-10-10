---
title: Konfiguration und Feature Flags
summary: Wie du Konfiguration sauber von Code trennst, sie als typisiertes Objekt in Actions bringst und mit Feature Flags neue Funktionen schrittweise pro Mandant freischaltest.
duration: 25
sources:
  - title: Laravel-Dokumentation – Configuration
    url: https://laravel.com/docs/13.x/configuration
  - title: Laravel-Dokumentation – Configuration Caching
    url: https://laravel.com/docs/13.x/configuration#configuration-caching
  - title: Laravel-Dokumentation – Pennant
    url: https://laravel.com/docs/13.x/pennant
quiz:
  - type: single
    question: Warum rufst du `env()` nur in Dateien unter `config/` auf?
    options:
      - Weil `env()` außerhalb von config/ verboten ist und einen Syntaxfehler wirft.
      - Weil nach `php artisan config:cache` die .env-Datei nicht mehr geladen wird und `env()` im übrigen Code dann nur noch Standardwerte liefert.
      - Weil `env()` langsamer ist als eine Datenbankabfrage.
      - Weil Pest sonst nicht läuft.
    answer: 1
    explanation: >
      Mit gecachter Konfiguration liest Laravel die .env nicht mehr ein. Werte aus der .env kommen dann nur
      noch über `config()` an – deshalb gehört `env()` ausschließlich in die Konfigurationsdateien.
  - type: multiple
    question: Welche Aussagen über Feature Flags stimmen?
    options:
      - Mit einem Flag kannst du Code ausliefern, der für die meisten Mandanten noch ausgeschaltet ist.
      - Ein Flag ist ein Notausschalter, wenn die neue Funktion Probleme macht.
      - Flags sollten für immer im Code bleiben, falls man sie noch einmal braucht.
      - Pennant kann Flags pro Mandant auswerten, wenn der Mandant als Scope übergeben wird.
    answers: [0, 1, 3]
    explanation: >
      Flags sind Werkzeuge für den Übergang. Ist eine Funktion für alle aktiv, entfernst du Flag und alten
      Code – sonst wächst ein Dickicht aus Verzweigungen.
  - type: match
    question: Wohin gehört welche Einstellung?
    pairs:
      - { left: "Datenbank-Passwort", right: ".env bzw. Umgebungsvariable" }
      - { left: "Standard-Steuersatz der App", right: "config/invoicing.php" }
      - { left: "Rechnungslogo eines Mandanten", right: "Tabelle mit Mandanten-Einstellungen" }
      - { left: "Neues PDF-Layout für 10 % der Mandanten", right: "Feature Flag" }
    explanation: Geheimnisse und Umgebungsdetails in die Umgebung, App-Standards in config, Kundendaten in die Datenbank, Übergänge in Flags.
  - type: find-bug
    question: Nach dem Deployment mit `php artisan config:cache` werden Erinnerungen nach 14 statt nach 10 Tagen verschickt. Welche Zeile ist schuld?
    language: php
    code: |
      final class SendReminders
      {
          public function dueAfterDays(): int
          {
              return (int) env('INVOICING_REMINDER_DAYS', 14);
          }
      }
    bug_line: 5
    explanation: >
      Mit gecachter Konfiguration liefert `env()` außerhalb von config/ nur den Standardwert 14. Der Wert
      muss über `config('invoicing.reminder_days')` oder ein Settings-Objekt kommen.
tasks:
  - id: typisierte-konfiguration
    type: terminal
    title: Konfiguration typisiert einbinden
    description: |
      Im Ordner `einstellungen` liegt eine App mit der Action `App\Actions\SendReminders`. Sie liest
      `env('INVOICING_REMINDER_DAYS', 14)` direkt – nach `config:cache` geht das schief.

      Klicke zuerst auf **Aufgabe vorbereiten** und wechsle mit `cd einstellungen` in die App.

      1. Lege `config/invoicing.php` an. Es gibt ein Array mit `default_tax_rate`
         (`(int) env('INVOICING_TAX_RATE', 19)`) und `reminder_days`
         (`(int) env('INVOICING_REMINDER_DAYS', 14)`) zurück.
      2. Ergänze in der `.env` die Zeile `INVOICING_REMINDER_DAYS=10`.
      3. Lege `app/Support/InvoicingSettings.php` an: `final readonly class` mit `int $defaultTaxRate`
         und `int $reminderDays` sowie `public static function fromConfig(): self`, die beide Werte mit
         `config('invoicing....')` liest.
      4. Binde sie in `AppServiceProvider::register()`:
         `$this->app->singleton(InvoicingSettings::class, fn () => InvoicingSettings::fromConfig());`
      5. `SendReminders` bekommt `InvoicingSettings` über den Konstruktor, und `dueAfterDays()` gibt
         `reminderDays` zurück. Unter `app/` darf danach kein `env(` mehr stehen.
      6. Probiere es aus: `php artisan config:cache`, dann
         `php artisan tinker --execute='echo app(App\Actions\SendReminders::class)->dueAfterDays();'`
         (soll 10 zeigen), danach `php artisan config:clear`.
    workdir: einstellungen
    setup: |
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
      mkdir -p app/Actions
      cat > app/Actions/SendReminders.php <<'EOF'
      <?php

      declare(strict_types=1);

      namespace App\Actions;

      final class SendReminders
      {
          public function dueAfterDays(): int
          {
              return (int) env('INVOICING_REMINDER_DAYS', 14);
          }
      }
      EOF
    checks:
      - type: file_exists
        path: config/invoicing.php
        message: Die Datei config/invoicing.php fehlt noch.
      - type: file_contains
        path: .env
        pattern: "INVOICING_REMINDER_DAYS=10"
        message: In der .env fehlt noch die Zeile INVOICING_REMINDER_DAYS=10.
      - type: command
        run: grep -rn "env(" app
        expect_exit: 1
        message: Unter app/ steht noch ein env(-Aufruf. Lies Werte nur über config() bzw. InvoicingSettings.
      - type: command
        run: php artisan tinker --execute='$s = app(App\Support\InvoicingSettings::class); echo $s->reminderDays, "|", $s->defaultTaxRate, "|", var_export((new ReflectionClass($s))->isReadOnly(), true);'
        stdout_matches: "10\\|19\\|true"
        message: InvoicingSettings liefert noch nicht 10 Tage und 19 Prozent – oder ist nicht readonly bzw. nicht im Container gebunden.
      - type: command
        run: php artisan config:cache -q && php artisan tinker --execute='echo app(App\Actions\SendReminders::class)->dueAfterDays();'; php artisan config:clear -q
        stdout_matches: "^\\s*10\\s*$"
        message: Mit gecachter Konfiguration liefert SendReminders::dueAfterDays() noch nicht 10. Hol den Wert über InvoicingSettings statt über env().
    hints:
      - "Eine Config-Datei ist nur `<?php return ['reminder_days' => (int) env('INVOICING_REMINDER_DAYS', 14), ...];`"
      - "`fromConfig()`: `return new self(defaultTaxRate: (int) config('invoicing.default_tax_rate'), reminderDays: (int) config('invoicing.reminder_days'));`"
      - "Eine Zeile an die .env hängen: `echo 'INVOICING_REMINDER_DAYS=10' >> .env`"
    solution: |
      ```php title="config/invoicing.php"
      <?php

      return [
          'default_tax_rate' => (int) env('INVOICING_TAX_RATE', 19),
          'reminder_days' => (int) env('INVOICING_REMINDER_DAYS', 14),
      ];
      ```

      ```php title="app/Support/InvoicingSettings.php"
      <?php

      declare(strict_types=1);

      namespace App\Support;

      final readonly class InvoicingSettings
      {
          public function __construct(public int $defaultTaxRate, public int $reminderDays) {}

          public static function fromConfig(): self
          {
              return new self(
                  defaultTaxRate: (int) config('invoicing.default_tax_rate'),
                  reminderDays: (int) config('invoicing.reminder_days'),
              );
          }
      }
      ```

      ```php title="app/Actions/SendReminders.php"
      final class SendReminders
      {
          public function __construct(private InvoicingSettings $settings) {}

          public function dueAfterDays(): int
          {
              return $this->settings->reminderDays;
          }
      }
      ```

      Dazu `echo 'INVOICING_REMINDER_DAYS=10' >> .env` und im `AppServiceProvider::register()`:
      `$this->app->singleton(InvoicingSettings::class, fn () => InvoicingSettings::fromConfig());`
  - id: flag-rollout
    type: code
    language: php
    title: Ein Feature Flag mit schrittweisem Rollout
    description: |
      Schreibe `FeatureFlags`, das wie ein kleines Pennant pro Mandant entscheidet. Der Konstruktor bekommt
      ein Array wie dieses:

      ```php
      ['new-pdf' => ['enabled' => true, 'tenants' => [3, 8], 'percent' => 20]]
      ```

      `active(string $feature, int $tenantId): bool` entscheidet in dieser Reihenfolge:

      1. Unbekanntes Feature → `false`.
      2. `enabled` ist `false` → `false` (Notausschalter, gilt auch für die Liste).
      3. Mandant steht in `tenants` → `true`.
      4. Sonst Rollout nach Prozent: `crc32("{$feature}:{$tenantId}") % 100 < percent`. So bekommt
         derselbe Mandant immer dieselbe Antwort.
    starter: |
      <?php

      declare(strict_types=1);

      final class FeatureFlags
      {
          public function __construct(private array $flags) {}

          public function active(string $feature, int $tenantId): bool
          {
          }
      }
    tests:
      - name: Mandanten auf der Liste bekommen das Feature
        code: |
          $flags = new FeatureFlags(['new-pdf' => ['enabled' => true, 'tenants' => [3, 8], 'percent' => 0]]);
          assert_true($flags->active('new-pdf', 3));
          assert_same(false, $flags->active('new-pdf', 4));
      - name: der Notausschalter gewinnt immer
        code: |
          $flags = new FeatureFlags(['new-pdf' => ['enabled' => false, 'tenants' => [3], 'percent' => 100]]);
          assert_same(false, $flags->active('new-pdf', 3));
          assert_same(false, $flags->active('new-pdf', 99));
      - name: unbekannte Features sind aus
        code: assert_same(false, (new FeatureFlags([]))->active('gibt-es-nicht', 1));
      - name: der Rollout ist stabil und trifft ungefähr den Prozentsatz
        code: |
          $flags = new FeatureFlags(['new-pdf' => ['enabled' => true, 'tenants' => [], 'percent' => 20]]);
          $on = 0;
          for ($t = 1; $t <= 1000; $t++) {
              $first = $flags->active('new-pdf', $t);
              assert_same($first, $flags->active('new-pdf', $t));
              $on += $first ? 1 : 0;
          }
          assert_true($on > 150 && $on < 250);
          $all = new FeatureFlags(['x' => ['enabled' => true, 'tenants' => [], 'percent' => 100]]);
          assert_true($all->active('x', 12345));
    solution: |
      <?php

      declare(strict_types=1);

      final class FeatureFlags
      {
          public function __construct(private array $flags) {}

          public function active(string $feature, int $tenantId): bool
          {
              $flag = $this->flags[$feature] ?? null;

              if ($flag === null || ! $flag['enabled']) {
                  return false;
              }

              if (in_array($tenantId, $flag['tenants'], true)) {
                  return true;
              }

              return crc32("{$feature}:{$tenantId}") % 100 < $flag['percent'];
          }
      }
    hints:
      - "`$this->flags[$feature] ?? null` liefert `null` für unbekannte Features."
      - "`in_array($tenantId, $flag['tenants'], true)` prüft die Liste streng."
---
Euer neues Rechnungs-PDF ist fertig. Direkt für alle 3000 Mandanten einschalten? Wenn es bei einem
Sonderfall abstürzt, rufen 3000 Kunden gleichzeitig an. Besser: erst für zwei Pilotkunden, dann für 10 %,
dann für alle – und bei Problemen per Schalter zurück. Dazu brauchst du saubere Konfiguration und
Feature Flags.

## Vier Orte für Einstellungen

Nicht jede Einstellung gehört an denselben Ort. Die Frage ist: Wer ändert sie, und wie oft?

| Ort | Für | Wer ändert? |
|---|---|---|
| [[umgebungsvariable\|Umgebungsvariable]] / `.env` | Geheimnisse, Hosts, Umgebung | Betrieb, pro Server |
| `config/*.php` | App-Standards mit Namen und Default | Entwickler:innen, per Deployment |
| Datenbank-Tabelle | Einstellungen **pro Mandant** | der Mandant selbst, zur Laufzeit |
| [[feature-flag\|Feature Flag]] | Übergänge: neue Funktion an/aus | Team, zur Laufzeit |

Mandanten-Einstellungen wie Logo, Rechnungstext oder Zahlungsziel gehören **nicht** in Config-Dateien.
Sonst brauchst du für jeden Kunden ein Deployment.

> [!MERKSATZ]
> `.env` beschreibt die Umgebung, `config/` die App, die Datenbank den Mandanten und Flags den Übergang.

## env() nur in config/

Laravel liest die `.env` beim Start und stellt die Werte über `env()` bereit. In Produktion
führst du `php artisan config:cache` aus: Alle Config-Dateien werden zu einer Datei zusammengefasst –
und die `.env` wird danach **nicht mehr geladen**.

```php title="config/invoicing.php"
<?php

return [
    'default_tax_rate' => (int) env('INVOICING_TAX_RATE', 19),
    'reminder_days' => (int) env('INVOICING_REMINDER_DAYS', 14),
];
```

Im übrigen Code liest du `config('invoicing.reminder_days')`. Ein `env()` in einer Action liefert nach dem
Caching nur noch den Standardwert – ein Fehler, der lokal nie auftritt und in Produktion sofort.

> [!FEHLER]
> `env('...')` in Controllern, Actions oder Jobs. Lokal funktioniert es, nach `config:cache` auf dem
> Server liefert es still den Default. Ein [[architekturtest|Architekturtest]] kann das verbieten:
> `arch()->expect('App')->not->toUse('env');`

## Konfiguration als Objekt

Statt überall `config('invoicing.reminder_days')` zu streuen, bündelst du zusammengehörige Werte in
einem typisierten, unveränderlichen Objekt – im Prinzip ein [[dto|DTO]] für Einstellungen:

```php title="app/Support/InvoicingSettings.php"
final readonly class InvoicingSettings
{
    public function __construct(public int $defaultTaxRate, public int $reminderDays) {}

    public static function fromConfig(): self
    {
        return new self(
            defaultTaxRate: (int) config('invoicing.default_tax_rate'),
            reminderDays: (int) config('invoicing.reminder_days'),
        );
    }
}
```

```php title="AppServiceProvider::register()"
$this->app->singleton(InvoicingSettings::class, fn () => InvoicingSettings::fromConfig());
```

Eine Action verlangt dann `InvoicingSettings` im Konstruktor. Im Test übergibst du einfach
`new InvoicingSettings(19, 3)` – ohne globale Konfiguration zu verbiegen.

Mandanten-Einstellungen funktionieren genauso, nur mit anderer Quelle: Ein `TenantSettings`-Objekt wird
aus der Datenbank geladen und als `scoped` gebunden, damit jeder Request und jeder Job die Werte
**seines** Mandanten bekommt. Der Code, der die Einstellungen nutzt, merkt keinen Unterschied.

## Feature Flags mit Pennant

Ein [[feature-flag|Feature Flag]] entscheidet zur Laufzeit, ob eine Funktion aktiv ist. Laravels
offizielles Paket dafür ist [[pennant|Pennant]] (`composer require laravel/pennant`). Ein Flag bekommt
einen **Scope** – bei uns den Mandanten:

```php title="AppServiceProvider::boot()"
Feature::define('new-invoice-pdf', fn (Tenant $tenant) => match (true) {
    $tenant->is_pilot => true,
    default => Lottery::odds(1, 10),
});
```

```php title="In der Action"
$renderer = Feature::for($tenant)->active('new-invoice-pdf')
    ? $this->newRenderer
    : $this->legacyRenderer;
```

Pennant speichert das Ergebnis pro Mandant (Treiber `database`), damit ein Mandant nicht bei jedem Aufruf
neu ausgelost wird. Mit `Feature::resolveScopeUsing(...)` kannst du festlegen, dass standardmäßig der
aktuelle Mandant der Scope ist. `Feature::for($tenant)->deactivate(...)` schaltet gezielt ab.

> [!PRAXIS]
> Jedes Flag bekommt beim Anlegen ein Ablaufdatum im Ticket. Ist die Funktion für alle aktiv, entfernst du
> Flag, Verzweigung und alten Code im nächsten Sprint. Vergessene Flags sind
> [[technische-schulden|technische Schulden]] mit Verzweigungen in jedem Test.

## Zusammenfassung

- Umgebung in `.env`, App-Standards in `config/`, Mandanten-Einstellungen in die Datenbank, Übergänge in Flags.
- `env()` nur in `config/`-Dateien – nach `config:cache` wird die `.env` nicht mehr geladen.
- Typisierte Settings-Objekte machen Konfiguration testbar und auffindbar.
- Feature Flags schalten Funktionen pro Mandant schrittweise frei und dienen als Notausschalter.
- Pennant wertet Flags pro Scope aus und speichert das Ergebnis; fertige Flags werden wieder entfernt.
