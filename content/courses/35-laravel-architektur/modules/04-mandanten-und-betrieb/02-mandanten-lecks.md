---
title: Wo Mandanten-Daten lecken
summary: Die typischen Lücken in mandantenfähigen Laravel-Apps – Abfragen am Global Scope vorbei, Cache und Dateien, Validierung und vor allem Queue-Jobs ohne Mandanten-Kontext.
duration: 25
sources:
  - title: Laravel-Dokumentation – Context
    url: https://laravel.com/docs/13.x/context
  - title: Laravel-Dokumentation – Queues
    url: https://laravel.com/docs/13.x/queues
  - title: Laravel-Dokumentation – Removing Global Scopes
    url: https://laravel.com/docs/13.x/eloquent#removing-global-scopes
quiz:
  - type: multiple
    question: Welche Abfragen umgehen einen Eloquent-Global-Scope?
    options:
      - "DB::table('invoices')->get()"
      - "Invoice::where('paid', false)->get()"
      - "Invoice::withoutGlobalScopes()->get()"
      - "DB::select('select * from invoices')"
    answers: [0, 2, 3]
    explanation: >
      Global Scopes hängen am Eloquent-Model. Der Query Builder über `DB::` und rohes SQL kennen sie nicht,
      und `withoutGlobalScopes()` schaltet sie bewusst ab.
  - type: single
    question: Ein Job wird im Request von Mandant 2 abgeschickt und später von einem Queue-Worker ausgeführt. Was weiß der Worker über den Mandanten?
    options:
      - Er übernimmt automatisch den Mandanten aus dem Request.
      - Nichts – der Worker ist ein anderer Prozess, der scoped Mandanten-Kontext ist leer.
      - Er nimmt den Mandanten des zuletzt verarbeiteten Jobs.
      - Er fragt den Benutzer.
    answer: 1
    explanation: >
      Der Worker läuft in einem eigenen Prozess und setzt scoped-Objekte vor jedem Job zurück. Der Job muss
      seinen Mandanten selbst mitbringen.
  - type: find-bug
    question: Mehrere Mandanten nutzen diese App. Welche Zeile führt dazu, dass ein Mandant die Zahl eines anderen sieht?
    language: php
    code: |
      public function openInvoiceCount(): int
      {
          $tenant = app(TenantContext::class)->id();

          return Cache::remember(
              'open-invoices',
              now()->addMinutes(5),
              fn () => Invoice::where('paid', false)->count(),
          );
      }
    bug_line: 6
    explanation: >
      Der Cache-Schlüssel ist für alle Mandanten gleich. Wer zuerst fragt, füllt ihn – alle anderen bekommen
      seine Zahl. Richtig: `"tenant.{$tenant}.open-invoices"`.
  - type: cloze
    text: "Damit eine `unique`-Regel nur innerhalb des Mandanten prüft, ergänzt du `Rule::unique('projects', 'slug')->___('tenant_id', $tenantId)`."
    blanks:
      - [where]
    explanation: Ohne die Einschränkung verrät die Fehlermeldung „schon vergeben“, dass ein anderer Mandant diesen Wert nutzt.
tasks:
  - id: job-mit-mandant
    type: terminal
    title: Ein Job verliert seinen Mandanten
    description: |
      Im Ordner `mandanten-job` liegt eine mandantenfähige App (Kontext, Global Scope, Trait wie im Projekt).
      Mandant 1 hat eine Rechnung, Mandant 2 hat zwei. Die Queue nutzt die Datenbank.

      Der Befehl `php artisan report:dispatch 2` setzt den Mandanten 2 und schickt den Job
      `App\Jobs\CountInvoices` ab. Der Job zählt die Rechnungen und legt das Ergebnis im Cache unter
      `invoice-count.<mandant>` ab. Im Worker kommt aber nur `invoice-count.none` mit 0 an.

      Klicke zuerst auf **Aufgabe vorbereiten**.

      1. `cd mandanten-job`, dann `php artisan report:dispatch 2` und `php artisan queue:work --once`.
         Prüfe mit `php artisan tinker --execute='echo Cache::get("invoice-count.none");'` – das Leck ist
         hier „fail closed“: 0 statt fremder Daten.
      2. Ändere `CountInvoices`: Im Konstruktor merkt sich der Job den aktuellen Mandanten in
         `public ?int $tenantId`. In `handle()` setzt er ihn zuerst wieder in den `TenantContext`.
      3. Wiederhole Schritt 1 – jetzt muss `invoice-count.2` den Wert 2 haben.
      4. `./vendor/bin/pest` muss grün sein.
    workdir: mandanten-job
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
      mkdir -p app/Support/Tenancy app/Jobs
      cat > database/migrations/2026_01_01_000000_create_invoices_table.php <<'EOF'
      <?php

      use Illuminate\Database\Migrations\Migration;
      use Illuminate\Database\Schema\Blueprint;
      use Illuminate\Support\Facades\DB;
      use Illuminate\Support\Facades\Schema;

      return new class extends Migration
      {
          public function up(): void
          {
              Schema::create('invoices', function (Blueprint $table) {
                  $table->id();
                  $table->unsignedBigInteger('tenant_id')->index();
                  $table->string('customer');
                  $table->timestamps();
              });

              DB::table('invoices')->insert([
                  ['tenant_id' => 1, 'customer' => 'Kunde A'],
                  ['tenant_id' => 2, 'customer' => 'Kunde B'],
                  ['tenant_id' => 2, 'customer' => 'Kunde C'],
              ]);
          }

          public function down(): void
          {
              Schema::dropIfExists('invoices');
          }
      };
      EOF
      cat > app/Support/Tenancy/TenantContext.php <<'EOF'
      <?php

      namespace App\Support\Tenancy;

      final class TenantContext
      {
          private ?int $tenantId = null;

          public function set(?int $tenantId): void
          {
              $this->tenantId = $tenantId;
          }

          public function id(): ?int
          {
              return $this->tenantId;
          }
      }
      EOF
      cat > app/Support/Tenancy/TenantScope.php <<'EOF'
      <?php

      namespace App\Support\Tenancy;

      use Illuminate\Database\Eloquent\Builder;
      use Illuminate\Database\Eloquent\Model;
      use Illuminate\Database\Eloquent\Scope;

      final class TenantScope implements Scope
      {
          public function apply(Builder $builder, Model $model): void
          {
              $tenant = app(TenantContext::class)->id();

              if ($tenant === null) {
                  $builder->whereRaw('1 = 0');

                  return;
              }

              $builder->where($model->qualifyColumn('tenant_id'), $tenant);
          }
      }
      EOF
      cat > app/Support/Tenancy/BelongsToTenant.php <<'EOF'
      <?php

      namespace App\Support\Tenancy;

      use Illuminate\Database\Eloquent\Model;

      trait BelongsToTenant
      {
          public static function bootBelongsToTenant(): void
          {
              static::addGlobalScope(new TenantScope);

              static::creating(function (Model $model): void {
                  $model->tenant_id ??= app(TenantContext::class)->id();
              });
          }
      }
      EOF
      cat > app/Models/Invoice.php <<'EOF'
      <?php

      namespace App\Models;

      use App\Support\Tenancy\BelongsToTenant;
      use Illuminate\Database\Eloquent\Model;

      class Invoice extends Model
      {
          use BelongsToTenant;
      }
      EOF
      cat > app/Providers/AppServiceProvider.php <<'EOF'
      <?php

      namespace App\Providers;

      use App\Support\Tenancy\TenantContext;
      use Illuminate\Support\ServiceProvider;

      class AppServiceProvider extends ServiceProvider
      {
          public function register(): void
          {
              $this->app->scoped(TenantContext::class);
          }

          public function boot(): void
          {
              //
          }
      }
      EOF
      cat > app/Jobs/CountInvoices.php <<'EOF'
      <?php

      namespace App\Jobs;

      use App\Models\Invoice;
      use App\Support\Tenancy\TenantContext;
      use Illuminate\Contracts\Queue\ShouldQueue;
      use Illuminate\Foundation\Queue\Queueable;
      use Illuminate\Support\Facades\Cache;

      class CountInvoices implements ShouldQueue
      {
          use Queueable;

          public function handle(TenantContext $context): void
          {
              Cache::put('invoice-count.'.($context->id() ?? 'none'), Invoice::count());
          }
      }
      EOF
      cat > routes/console.php <<'EOF'
      <?php

      use App\Jobs\CountInvoices;
      use App\Support\Tenancy\TenantContext;
      use Illuminate\Support\Facades\Artisan;

      Artisan::command('report:dispatch {tenant}', function (string $tenant) {
          app(TenantContext::class)->set((int) $tenant);
          CountInvoices::dispatch();
          $this->info("Job for tenant {$tenant} queued.");
      });
      EOF
      cat > tests/Feature/CountInvoicesTest.php <<'EOF'
      <?php

      use App\Jobs\CountInvoices;
      use App\Support\Tenancy\TenantContext;
      use Illuminate\Foundation\Testing\RefreshDatabase;
      use Illuminate\Support\Facades\Cache;

      uses(RefreshDatabase::class);

      test('the job remembers the tenant it was dispatched for', function () {
          app(TenantContext::class)->set(2);
          $job = new CountInvoices();

          app()->forgetScopedInstances();
          app()->call([$job, 'handle']);

          expect(Cache::get('invoice-count.2'))->toBe(2);
      });
      EOF
      php artisan migrate -q --force
    checks:
      - type: file_contains
        path: app/Jobs/CountInvoices.php
        pattern: "tenantId"
        message: CountInvoices merkt sich den Mandanten noch nicht. Lege die Eigenschaft public ?int $tenantId an und fülle sie im Konstruktor.
      - type: command
        run: php artisan queue:clear -q; php artisan cache:clear -q; php artisan report:dispatch 2 -q && php artisan queue:work --once -q && php artisan tinker --execute='echo Cache::get("invoice-count.2", "fehlt");'
        stdout_matches: "^\\s*2\\s*$"
        message: Im Worker kommt der Mandant noch nicht an – invoice-count.2 sollte 2 sein. Setze in handle() zuerst den gemerkten Mandanten in den TenantContext.
      - type: command
        run: php artisan queue:clear -q; php artisan cache:clear -q; php artisan report:dispatch 1 -q && php artisan queue:work --once -q && php artisan tinker --execute='echo Cache::get("invoice-count.1", "fehlt");'
        stdout_matches: "^\\s*1\\s*$"
        message: Für Mandant 1 soll der Job genau eine Rechnung zählen. Prüfe, ob der Job wirklich den Mandanten aus dem Konstruktor verwendet.
      - type: command
        run: ./vendor/bin/pest
        message: Die Tests sind noch rot. Führe ./vendor/bin/pest aus und lies die Meldung.
    hints:
      - "Der Konstruktor läuft noch im abschickenden Prozess – dort ist der Mandant bekannt: `$this->tenantId = app(TenantContext::class)->id();`"
      - "Öffentliche Eigenschaften eines Jobs werden mit in die Queue geschrieben. `handle()` läuft später im Worker."
      - "In `handle(TenantContext $context)` als erste Zeile: `$context->set($this->tenantId);`"
    solution: |
      ```php title="app/Jobs/CountInvoices.php"
      <?php

      namespace App\Jobs;

      use App\Models\Invoice;
      use App\Support\Tenancy\TenantContext;
      use Illuminate\Contracts\Queue\ShouldQueue;
      use Illuminate\Foundation\Queue\Queueable;
      use Illuminate\Support\Facades\Cache;

      class CountInvoices implements ShouldQueue
      {
          use Queueable;

          public ?int $tenantId;

          public function __construct()
          {
              $this->tenantId = app(TenantContext::class)->id();
          }

          public function handle(TenantContext $context): void
          {
              $context->set($this->tenantId);

              Cache::put('invoice-count.'.($context->id() ?? 'none'), Invoice::count());
          }
      }
      ```
  - id: leck-oder-sicher
    type: dragdrop
    title: Leck oder sicher?
    description: Das Model `Project` nutzt den Trait `BelongsToTenant` mit fail-closed-Scope. Ordne jede Zeile zu.
    targets:
      - { id: sicher, label: Mandantensicher }
      - { id: leck, label: Mögliches Leck }
    items:
      - { label: "Project::where('archived', false)->get()", target: sicher }
      - { label: "DB::table('projects')->count()", target: leck }
      - { label: "Cache::remember('dashboard-stats', ...)", target: leck }
      - { label: "Route::get('/projects/{project}', ...) mit Route Model Binding", target: sicher }
      - { label: "Storage::put('exports/report.csv', $csv)", target: leck }
      - { label: "Storage::put(\"tenants/{$tenantId}/report.csv\", $csv)", target: sicher }
      - { label: "Rule::unique('projects', 'slug') ohne where", target: leck }
    hints:
      - Alles, was über Eloquent und das Model läuft, bekommt den Scope. Alles daneben – DB::, Cache, Dateien, Validierung – musst du selbst trennen.
---
Euer Global Scope steht, die Tests sind grün, ein Penetrationstest findet nichts. Drei Wochen später
meldet ein Kunde: „In meinem Monatsbericht stehen Rechnungen, die nicht von uns sind.“ Der Bericht
wurde in einem Queue-Job erzeugt. Der Global Scope schützt Eloquent-Abfragen im Request – aber nicht
alles andere. Diese Lektion zeigt dir die typischen Lücken.

## Abfragen am Scope vorbei

Ein [[global-scope|Global Scope]] hängt am Eloquent-Model. Alles, was nicht über das Model läuft, sieht
ihn nicht:

| Abfrage | Scope aktiv? |
|---|---|
| `Invoice::where(...)->get()` | ja |
| `$customer->invoices` (Beziehung zu einem Model mit Scope) | ja |
| Route Model Binding `/invoices/{invoice}` | ja – fremde IDs ergeben 404 |
| `DB::table('invoices')->...` | **nein** |
| `DB::select('...')`, rohes SQL in Reports | **nein** |
| `Invoice::withoutGlobalScopes()` | **nein**, bewusst abgeschaltet |

Wo du am Scope vorbei musst, etwa für einen schnellen Report, filterst du **selbst** auf `tenant_id`.
Ein [[architekturtest|Architekturtest]] kann verbieten, dass außerhalb bestimmter Namespaces `DB::`
benutzt wird.

> [!MERKSATZ]
> Der Global Scope schützt Eloquent. Jeder Weg daneben braucht seine eigene, ausdrückliche Mandanten-Bedingung.

## Cache, Dateien, Validierung

Daten verlassen die Datenbank – und mit ihnen die Trennung:

- **Cache:** Schlüssel ohne Mandant sind geteilt. `dashboard-stats` wird für alle Mandanten befüllt,
  von dem, der zuerst kommt. Richtig: `"tenant.{$tenantId}.dashboard-stats"`.
- **Dateien:** Exporte, Uploads und PDFs gehören in einen Mandanten-Ordner,
  `tenants/{$tenantId}/exports/…` – und Downloads prüfen diesen Pfad.
- **Validierung:** `Rule::unique('projects', 'slug')` prüft über **alle** Mandanten. Die Meldung
  „schon vergeben“ verrät dann, was ein anderer Kunde angelegt hat.

```php title="unique nur innerhalb des Mandanten"
'slug' => [
    'required',
    Rule::unique('projects', 'slug')->where('tenant_id', $this->tenantId()),
],
```

> [!FEHLER]
> Ein zentraler Cache-Helfer, der den Schlüssel nicht automatisch mit dem Mandanten versieht. Baue lieber
> einen kleinen `TenantCache`, der das Präfix immer setzt – dann kann es niemand vergessen.

## Queue-Jobs: der Mandant reist nicht mit

Ein [[queue-job|Job]] wird im Request abgeschickt und später von einem [[queue-worker|Worker]]
ausgeführt – einem anderen Prozess. Der Worker kennt keinen Request, keine Middleware und keinen
Mandanten. Außerdem setzt er vor jedem Job alle `scoped`-Objekte zurück.

![Ein Job trägt die Mandanten-ID vom Request in den Worker](/assets/laravel-architektur/mandant-im-job.svg)

Mit einem fail-closed-Scope sieht der Job dann **nichts**. Mit einem nachlässigen Scope sieht er
**alles**. Beides ist falsch, das zweite ist ein Datenleck.

Achtung bei Models als Job-Parameter: Laravel speichert nur die ID und lädt das Model im Worker neu –
dabei werden Global Scopes **nicht** angewendet. Das Model selbst kommt also an, aber jede weitere
Abfrage im Job läuft ohne Mandant.

## Den Mandanten mitschicken

Die einfachste Lösung: Der Job merkt sich den Mandanten beim Abschicken und setzt ihn beim Ausführen.

```php title="app/Jobs/CountInvoices.php"
class CountInvoices implements ShouldQueue
{
    use Queueable;

    public ?int $tenantId;

    public function __construct()
    {
        $this->tenantId = app(TenantContext::class)->id();
    }

    public function handle(TenantContext $context): void
    {
        $context->set($this->tenantId);
        // ... ab hier filtert der Global Scope wieder richtig
    }
}
```

Für viele Jobs auf einmal gibt es eine zentrale Lösung mit Laravels [[laravel-context|Context]]:
Die Middleware speichert den Mandanten mit `Context::addHidden('tenant_id', $id)`. Laravel gibt diese
Daten automatisch an jeden abgeschickten Job weiter. Im Worker setzt ein `Context::hydrated(...)`-Callback
im `AppServiceProvider` den Mandanten zurück in den `TenantContext`.

> [!PRAXIS]
> Schreib für jede mandantenfähige Funktion einen Test mit **zwei** Mandanten: Daten für A anlegen, als B
> abfragen, leeres Ergebnis erwarten. Diese Tests finden Lecks, bevor es ein Kunde tut.

## Zusammenfassung

- Global Scopes wirken nur über Eloquent; `DB::`, rohes SQL und `withoutGlobalScopes()` brauchen eigene Filter.
- Cache-Schlüssel, Dateipfade und `unique`-Regeln müssen den Mandanten enthalten.
- Queue-Worker kennen keinen Request; scoped-Objekte werden vor jedem Job zurückgesetzt.
- Ein Job merkt sich die Mandanten-ID beim Abschicken und setzt sie beim Ausführen wieder.
- Zentral lässt sich das mit `Context::addHidden` und `Context::hydrated` lösen.
- Tests mit zwei Mandanten sind die wirksamste Versicherung gegen Lecks.
