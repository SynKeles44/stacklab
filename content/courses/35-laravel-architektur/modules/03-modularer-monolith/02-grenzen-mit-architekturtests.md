---
title: Grenzen mit Architekturtests sichern
summary: Wie du Modulgrenzen und Schichtregeln mit Pest-Architekturtests aufschreibst, sodass jede Verletzung im Test und in der CI rot wird.
duration: 25
sources:
  - title: Pest-Dokumentation – Architecture Testing
    url: https://pestphp.com/docs/arch-testing
  - title: Laravel-Dokumentation – Testing
    url: https://laravel.com/docs/13.x/testing
quiz:
  - type: single
    question: Was prüft ein Pest-Architekturtest?
    options:
      - Ob die App schnell genug antwortet.
      - Ob Klassen bestimmte Regeln über Abhängigkeiten, Namen und Form einhalten – ohne den Code auszuführen.
      - Ob die Datenbank-Migrationen laufen.
      - Ob alle Routen erreichbar sind.
    answer: 1
    explanation: >
      Pest liest den Code und prüft, welche Klassen welche anderen benutzen, ob sie final oder readonly
      sind und wie sie heißen. Es braucht dafür weder Datenbank noch HTTP.
  - type: match
    question: Ordne jede Expectation ihrer Bedeutung zu.
    pairs:
      - { left: "->not->toUse('Illuminate')", right: "Benutzt nichts aus Laravel" }
      - { left: "->toOnlyBeUsedIn('App\\Modules\\Catalog')", right: "Wird nur innerhalb von Catalog benutzt" }
      - { left: "->classes()->toBeReadonly()", right: "Alle Klassen sind readonly" }
      - { left: "->toHaveSuffix('Controller')", right: "Alle Klassennamen enden auf Controller" }
    explanation: Mit wenigen Expectations kannst du Richtung, Reichweite und Form deiner Klassen festschreiben.
  - type: find-bug
    question: Diese Regel soll verhindern, dass Ordering interne Klassen von Catalog nutzt. Warum wird sie nie rot?
    language: php
    code: |
      <?php

      arch('ordering respects catalog boundary')
          ->expect('App\Modules\Ordering')
          ->toUse('App\Modules\Catalog\Models');
    bug_line: 5
    explanation: >
      Ohne `->not` verlangt die Regel das Gegenteil: Ordering **muss** Catalog-Models benutzen. Richtig ist
      `->not->toUse('App\Modules\Catalog\Models')`.
  - type: cloze
    text: "Mit `arch()->___()->php();` aktivierst du ein vorgefertigtes Regelpaket, das z. B. `dd` und `var_dump` im Code verbietet."
    blanks:
      - [preset]
    explanation: Pest bringt Presets wie php, security, laravel, strict und relaxed mit.
tasks:
  - id: grenze-erzwingen
    type: terminal
    title: Eine Modulgrenze erzwingen
    description: |
      Im Ordner `modul-grenzen` liegt eine App mit zwei Modulen. **Catalog** bietet die Schnittstelle
      `App\Modules\Catalog\Contracts\CatalogApi` an (Methode `priceOf(int $id): int`). Die Action
      `App\Modules\Ordering\Actions\AddToCart` umgeht sie aber und liest direkt das interne Model
      `App\Modules\Catalog\Models\Product`. Der Feature-Test ist trotzdem grün – Tests auf Verhalten sehen
      solche Grenzverletzungen nicht.

      Klicke zuerst auf **Aufgabe vorbereiten**.

      1. `cd modul-grenzen` und lege `tests/Unit/ArchitectureTest.php` mit zwei Regeln an:
         - Die Models von Catalog werden nur innerhalb von `App\Modules\Catalog` benutzt (`toOnlyBeUsedIn`).
         - `App\Modules\Ordering` benutzt `App\Modules\Catalog\Models` **nicht** (`->not->toUse(...)`).
      2. Führe `./vendor/bin/pest tests/Unit/ArchitectureTest.php` aus – die Regeln müssen rot werden.
      3. Repariere `AddToCart`: Lass dir `CatalogApi` per Konstruktor geben und frag `priceOf` statt das Model.
      4. `./vendor/bin/pest` muss komplett grün sein.
    workdir: modul-grenzen
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
      mkdir -p app/Modules/Catalog/Contracts app/Modules/Catalog/Models app/Modules/Catalog/Services app/Modules/Ordering/Actions
      cat > database/migrations/2026_01_01_000000_create_products_table.php <<'EOF'
      <?php

      use Illuminate\Database\Migrations\Migration;
      use Illuminate\Database\Schema\Blueprint;
      use Illuminate\Support\Facades\Schema;

      return new class extends Migration
      {
          public function up(): void
          {
              Schema::create('products', function (Blueprint $table) {
                  $table->id();
                  $table->string('name');
                  $table->unsignedInteger('price_cents');
                  $table->timestamps();
              });
          }

          public function down(): void
          {
              Schema::dropIfExists('products');
          }
      };
      EOF
      cat > app/Modules/Catalog/Models/Product.php <<'EOF'
      <?php

      namespace App\Modules\Catalog\Models;

      use Illuminate\Database\Eloquent\Attributes\Fillable;
      use Illuminate\Database\Eloquent\Model;

      #[Fillable(['name', 'price_cents'])]
      class Product extends Model
      {
      }
      EOF
      cat > app/Modules/Catalog/Contracts/CatalogApi.php <<'EOF'
      <?php

      namespace App\Modules\Catalog\Contracts;

      interface CatalogApi
      {
          public function priceOf(int $id): int;
      }
      EOF
      cat > app/Modules/Catalog/Services/EloquentCatalog.php <<'EOF'
      <?php

      namespace App\Modules\Catalog\Services;

      use App\Modules\Catalog\Contracts\CatalogApi;
      use App\Modules\Catalog\Models\Product;

      final class EloquentCatalog implements CatalogApi
      {
          public function priceOf(int $id): int
          {
              return Product::findOrFail($id)->price_cents;
          }
      }
      EOF
      cat > app/Modules/Catalog/CatalogServiceProvider.php <<'EOF'
      <?php

      namespace App\Modules\Catalog;

      use App\Modules\Catalog\Contracts\CatalogApi;
      use App\Modules\Catalog\Services\EloquentCatalog;
      use Illuminate\Support\ServiceProvider;

      final class CatalogServiceProvider extends ServiceProvider
      {
          public function register(): void
          {
              $this->app->bind(CatalogApi::class, EloquentCatalog::class);
          }
      }
      EOF
      cat > bootstrap/providers.php <<'EOF'
      <?php

      use App\Modules\Catalog\CatalogServiceProvider;
      use App\Providers\AppServiceProvider;

      return [
          AppServiceProvider::class,
          CatalogServiceProvider::class,
      ];
      EOF
      cat > app/Modules/Ordering/Actions/AddToCart.php <<'EOF'
      <?php

      declare(strict_types=1);

      namespace App\Modules\Ordering\Actions;

      use App\Modules\Catalog\Models\Product;

      final class AddToCart
      {
          public function handle(int $productId, int $quantity): int
          {
              return Product::findOrFail($productId)->price_cents * $quantity;
          }
      }
      EOF
      cat > tests/Feature/CartTest.php <<'EOF'
      <?php

      use App\Modules\Ordering\Actions\AddToCart;
      use Illuminate\Foundation\Testing\RefreshDatabase;
      use Illuminate\Support\Facades\DB;

      uses(RefreshDatabase::class);

      test('a cart line costs price times quantity', function () {
          $id = DB::table('products')->insertGetId(['name' => 'Tasse', 'price_cents' => 899]);

          expect(app(AddToCart::class)->handle($id, 3))->toBe(2697);
      });
      EOF
      php artisan migrate -q --force
    checks:
      - type: file_contains
        path: tests/Unit/ArchitectureTest.php
        pattern: "toOnlyBeUsedIn"
        message: In tests/Unit/ArchitectureTest.php fehlt die Regel mit toOnlyBeUsedIn.
      - type: file_contains
        path: tests/Unit/ArchitectureTest.php
        pattern: "->not->toUse"
        message: In tests/Unit/ArchitectureTest.php fehlt die Regel mit ->not->toUse(...) für das Modul Ordering.
      - type: command
        run: grep -rl "Catalog\\\\Models" app/Modules/Ordering
        expect_exit: 1
        message: AddToCart benutzt noch das interne Model App\Modules\Catalog\Models\Product. Nutze stattdessen CatalogApi.
      - type: file_contains
        path: app/Modules/Ordering/Actions/AddToCart.php
        pattern: "CatalogApi"
        message: AddToCart bekommt CatalogApi noch nicht über den Konstruktor.
      - type: command
        run: ./vendor/bin/pest
        message: Die Tests sind noch rot. Führe ./vendor/bin/pest aus – die Meldung nennt die Klasse, die eine Regel bricht.
    hints:
      - "Eine Regel: `arch('catalog models stay inside')->expect('App\\Modules\\Catalog\\Models')->toOnlyBeUsedIn('App\\Modules\\Catalog');`"
      - "Architekturtests brauchen keine Datenbank – deshalb gehören sie nach `tests/Unit`."
      - "`public function __construct(private CatalogApi $catalog) {}` und in `handle`: `return $this->catalog->priceOf($productId) * $quantity;`"
    solution: |
      ```php title="tests/Unit/ArchitectureTest.php"
      <?php

      arch('catalog models stay inside the catalog module')
          ->expect('App\Modules\Catalog\Models')
          ->toOnlyBeUsedIn('App\Modules\Catalog');

      arch('ordering does not touch catalog internals')
          ->expect('App\Modules\Ordering')
          ->not->toUse('App\Modules\Catalog\Models');
      ```

      ```php title="app/Modules/Ordering/Actions/AddToCart.php"
      <?php

      declare(strict_types=1);

      namespace App\Modules\Ordering\Actions;

      use App\Modules\Catalog\Contracts\CatalogApi;

      final class AddToCart
      {
          public function __construct(private CatalogApi $catalog) {}

          public function handle(int $productId, int $quantity): int
          {
              return $this->catalog->priceOf($productId) * $quantity;
          }
      }
      ```
  - id: regel-formulieren
    type: dragdrop
    title: Welche Expectation passt?
    description: Ordne jede Architekturregel der Pest-Expectation zu, mit der du sie aufschreibst.
    targets:
      - { id: notuse, label: "->not->toUse(...)" }
      - { id: onlyused, label: "->toOnlyBeUsedIn(...)" }
      - { id: readonly, label: "->classes()->toBeReadonly()" }
      - { id: implement, label: "->toImplement(...)" }
    items:
      - { label: "Der Domain-Kern kennt kein Laravel.", target: notuse }
      - { label: "Controller rufen nie DB:: direkt auf.", target: notuse }
      - { label: "Die Models von Billing benutzt nur Billing selbst.", target: onlyused }
      - { label: "Alle DTOs sind unveränderlich.", target: readonly }
      - { label: "Jeder Job in App\\Jobs läuft in der Queue (ShouldQueue).", target: implement }
    hints:
      - Geht es darum, was eine Klasse benutzt, oder darum, wer sie benutzen darf? Das sind zwei verschiedene Richtungen.
---
Ihr habt euch im Team auf Modulgrenzen geeinigt. Drei Monate später braucht jemand schnell einen Preis
und schreibt `Product::find($id)` in das Modul Ordering. Der Code-Review übersieht es, alle Tests sind
grün. Eine Regel, die nur in einem Wiki steht, hält nicht. Eine Regel, die als Test rot wird, schon.

## Architektur als Test

Ein [[architekturtest|Architekturtest]] prüft nicht, **was** dein Code tut, sondern **wie er gebaut
ist**: Welche Klasse benutzt welche, wie heißen sie, sind sie final oder readonly. [[pest|Pest]]
bringt dafür die Funktion `arch()` mit.

```php title="tests/Unit/ArchitectureTest.php"
<?php

arch('domain is framework free')
    ->expect('App\Modules\Invoicing\Domain')
    ->not->toUse('Illuminate');
```

Pest liest dafür den Quellcode aller Klassen im Namespace und sammelt ihre Abhängigkeiten. Eine
Datenbank braucht es nicht – Architekturtests sind schnell und gehören nach `tests/Unit`.

> [!MERKSATZ]
> Verhaltenstests prüfen, was der Code tut. Architekturtests prüfen, wie er gebaut ist. Grenzverletzungen
> sieht nur die zweite Sorte.

## Die wichtigsten Expectations

| Expectation | Prüft |
|---|---|
| `->toUse('X')` / `->not->toUse('X')` | ob die Klassen `X` benutzen |
| `->toOnlyUse([...])` | dass sie **nur** das Genannte benutzen |
| `->toUseNothing()` | dass sie gar nichts benutzen |
| `->toOnlyBeUsedIn('X')` | dass sie **nur** von `X` benutzt werden |
| `->classes()->toBeFinal()` / `->toBeReadonly()` | Form der Klassen |
| `->toHaveSuffix('Controller')` | Namenskonvention |
| `->toImplement('X')` / `->toExtend('X')` | Interface oder Elternklasse |

Achte auf die **Richtung**: `not->toUse` schaut aus dem Modul heraus („was darf ich benutzen?“),
`toOnlyBeUsedIn` schaut von außen hinein („wer darf mich benutzen?“). Für eine Modulgrenze brauchst du
meist beide.

## Modulgrenzen aufschreiben

Für jedes Modul formulierst du dieselben drei Fragen als Regeln:

```php title="Regeln für das Modul Catalog"
arch('catalog internals stay inside')
    ->expect(['App\Modules\Catalog\Models', 'App\Modules\Catalog\Actions'])
    ->toOnlyBeUsedIn('App\Modules\Catalog');

arch('catalog data objects are readonly')
    ->expect('App\Modules\Catalog\Data')
    ->classes()->toBeReadonly();

arch('ordering uses only the catalog contract')
    ->expect('App\Modules\Ordering')
    ->not->toUse(['App\Modules\Catalog\Models', 'App\Modules\Catalog\Actions']);
```

Wird eine Regel verletzt, nennt Pest die Klasse und die verbotene Abhängigkeit. So weiß die Person im
Pull Request sofort, was zu ändern ist.

> [!FEHLER]
> Eine Regel schreiben, die nie rot wird – etwa weil der Namespace falsch geschrieben ist. Mach jede neue
> Regel zur Probe einmal kaputt (z. B. ein verbotenes `use` einfügen) und prüfe, dass sie anschlägt.

## Presets und Ausnahmen

Pest bringt fertige Regelpakete mit, sogenannte Presets:

| Preset | Inhalt (vereinfacht) |
|---|---|
| `php` | keine Debug-Funktionen wie `dd` oder `var_dump` |
| `security` | keine unsicheren Funktionen wie `eval` oder `md5` |
| `laravel` | Laravel-Konventionen, z. B. Controller-Suffix |
| `strict` / `relaxed` | strenge bzw. lockere Code-Regeln |

```php title="Presets mit Ausnahme"
arch()->preset()->php();
arch()->preset()->security()->ignoring('md5');
```

Mit `ignoring(...)` nimmst du bewusst etwas aus. Jede Ausnahme ist eine Entscheidung – schreib sie so
eng wie möglich, nie für einen ganzen Namespace „bis später“.

## In der CI ausführen

Die Regeln wirken erst, wenn sie bei **jedem** [[pull-request|Pull Request]] laufen. Weil sie Teil von
`./vendor/bin/pest` sind, nimmt deine [[continuous-integration|CI]] sie automatisch mit.

> [!PRAXIS]
> In großen Laravel-Projekten gibt es oft eine Datei pro Modul, z. B.
> `tests/Arch/CatalogArchTest.php`. Neue Module bekommen ihre Regeln gleich beim Anlegen. So wird die
> Architektur nicht in Meetings verteidigt, sondern von der Pipeline.

Architekturtests ersetzen keine Code-Reviews. Sie nehmen ihnen aber die mechanischen Fragen ab, damit
sich das Review auf Fachlichkeit konzentrieren kann.

## Zusammenfassung

- Architekturtests prüfen Abhängigkeiten, Namen und Form von Klassen, ohne den Code auszuführen.
- `not->toUse` begrenzt, was ein Modul benutzt; `toOnlyBeUsedIn` begrenzt, wer es benutzen darf.
- Mit `classes()->toBeReadonly()`, `toBeFinal()`, `toHaveSuffix()` schreibst du Konventionen fest.
- Presets liefern fertige Regelpakete; Ausnahmen mit `ignoring()` so eng wie möglich halten.
- Jede neue Regel einmal absichtlich verletzen, um zu sehen, dass sie anschlägt.
- In der CI werden die Regeln bei jedem Pull Request geprüft.
