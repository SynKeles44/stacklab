---
title: Scopes, Accessoren und Casts
summary: Wiederkehrende Abfragen benennen, Werte beim Lesen und Schreiben umformen und Spalten automatisch in die richtigen PHP-Typen verwandeln.
duration: 25
sources:
  - title: Laravel – Eloquent, Query Scopes
    url: https://laravel.com/docs/13.x/eloquent#query-scopes
  - title: Laravel – Eloquent Mutators & Casting
    url: https://laravel.com/docs/13.x/eloquent-mutators
quiz:
  - type: single
    question: "Ein Model hat `#[Scope] protected function active(Builder $query): void`. Wie rufst du den Scope auf?"
    options:
      - "`Product::scopeActive()->get()`"
      - "`Product::active()->get()`"
      - "`Product::where('active')->get()`"
    answer: 1
    explanation: Mit dem Attribut Scope wird die Methode unter ihrem eigenen Namen aufrufbar. Den Builder übergibt Laravel selbst; du kannst weitere Bedingungen anhängen.
  - type: match
    question: Was liefert die Eigenschaft nach dem Cast?
    pairs:
      - { left: "'active' => 'boolean' (DB-Wert 1)", right: "true" }
      - { left: "'tags' => 'array' (DB-Wert [\"neu\"])", right: "['neu']" }
      - { left: "'published_at' => 'datetime'", right: Ein Carbon-Datumsobjekt }
      - { left: "'status' => ProductStatus::class", right: "ProductStatus::Active" }
    explanation: Casts wandeln beim Lesen in PHP-Typen und beim Speichern zurück. Bei Enums landet der Backing-Wert in der Datenbank.
  - type: cloze
    text: "Ein Accessor ist eine Methode, die ein `___`-Objekt zurückgibt: `return Attribute::make(get: fn (string $value) => ucfirst($value));`. Mit dem zusätzlichen Parameter `___:` wird daraus auch ein Mutator."
    blanks:
      - [Attribute]
      - [set]
    explanation: Attribute::make(get:, set:) bündelt Lesen und Schreiben in einer Methode, die wie das Attribut heißt (in camelCase).
  - type: find-bug
    question: "`$product->tags` soll ein Array sein, ist aber ein JSON-Text. Welche Zeile muss geändert werden?"
    language: php
    code: |
      class Product extends Model
      {
          protected function casts(): array
          {
              return [
                  'active' => 'boolean',
                  'tags' => 'string',
              ];
          }
      }
    bug_line: 7
    explanation: Mit dem Cast string bleibt der JSON-Text unverändert. Richtig ist 'tags' => 'array' (oder AsCollection::class für eine Collection).
tasks:
  - id: produkt-model
    type: terminal
    title: Das Product-Model aufräumen
    description: |
      Im Ordner `eloquent-uebung` liegt eine Laravel-Anwendung mit der Tabelle `products` (mit Testdaten)
      und dem Enum `App\Enums\ProductStatus` (`draft`, `active`, `archived`). Das Model
      `App\Models\Product` ist noch fast leer. Ergänze es:

      1. **Casts:** `active` → `boolean`, `tags` → `array`, `status` → `ProductStatus::class`.
      2. **Scope `active`** (mit `#[Scope]`): nur Produkte mit `active = true`.
      3. **Scope `cheaperThan(int $cents)`**: nur Produkte mit `price_cents` kleiner als `$cents`.
      4. **Accessor `priceEuro`**: liefert `price_cents / 100` als Zahl (z. B. `19.99`). Aufruf:
         `$product->price_euro`.
      5. **Mutator für `name`**: Beim Speichern werden Leerzeichen am Rand entfernt
         (`trim`). Gelesen wird der Name unverändert.

      Probiere in Tinker: `App\Models\Product::active()->cheaperThan(2000)->pluck('name')`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: eloquent-uebung
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
      mkdir -p app/Enums
      cat > app/Enums/ProductStatus.php <<'EOF'
      <?php

      namespace App\Enums;

      enum ProductStatus: string
      {
          case Draft = 'draft';
          case Active = 'active';
          case Archived = 'archived';
      }
      EOF
      cat > database/migrations/2026_01_01_000000_create_products_table.php <<'EOF'
      <?php

      use Illuminate\Database\Migrations\Migration;
      use Illuminate\Database\Schema\Blueprint;
      use Illuminate\Support\Facades\DB;
      use Illuminate\Support\Facades\Schema;

      return new class extends Migration
      {
          public function up(): void
          {
              Schema::create('products', function (Blueprint $table) {
                  $table->id();
                  $table->string('name');
                  $table->unsignedInteger('price_cents');
                  $table->boolean('active')->default(true);
                  $table->json('tags')->nullable();
                  $table->string('status')->default('draft');
                  $table->timestamps();
              });

              DB::table('products')->insert([
                  ['name' => 'Kaffeebecher', 'price_cents' => 1299, 'active' => true, 'tags' => '["kueche","neu"]', 'status' => 'active'],
                  ['name' => 'Notizbuch', 'price_cents' => 899, 'active' => true, 'tags' => '["buero"]', 'status' => 'active'],
                  ['name' => 'Schreibtischlampe', 'price_cents' => 4599, 'active' => true, 'tags' => '["buero","licht"]', 'status' => 'active'],
                  ['name' => 'Alter Kalender', 'price_cents' => 199, 'active' => false, 'tags' => '[]', 'status' => 'archived'],
              ]);
          }

          public function down(): void
          {
              Schema::dropIfExists('products');
          }
      };
      EOF
      cat > app/Models/Product.php <<'EOF'
      <?php

      namespace App\Models;

      use Illuminate\Database\Eloquent\Attributes\Fillable;
      use Illuminate\Database\Eloquent\Model;

      #[Fillable(['name', 'price_cents', 'active', 'tags', 'status'])]
      class Product extends Model
      {
          //
      }
      EOF
      php artisan migrate --force -q
    checks:
      - type: command
        run: |
          php artisan tinker --execute="\$p = App\Models\Product::where('name', 'Kaffeebecher')->first(); echo var_export(\$p->active, true), '|', json_encode(\$p->tags), '|', \$p->status instanceof App\Enums\ProductStatus ? 'enum' : 'kein-enum';"
        stdout_matches: "^true\\|\\[\"kueche\",\"neu\"\\]\\|enum\\s*$"
        message: Die Casts fehlen noch. active soll true/false, tags ein Array und status ein ProductStatus-Enum liefern.
      - type: command
        run: php artisan tinker --execute="echo App\Models\Product::active()->cheaperThan(2000)->orderBy('name')->pluck('name')->implode(',');"
        stdout_matches: "^Kaffeebecher,Notizbuch\\s*$"
        message: Product::active()->cheaperThan(2000) liefert noch nicht genau Kaffeebecher und Notizbuch. Prüfe die beiden Scopes.
      - type: command
        run: php artisan tinker --execute="var_export(App\Models\Product::where('name', 'Notizbuch')->first()->price_euro);"
        stdout_matches: "^8\\.99\\s*$"
        message: price_euro soll den Preis als Zahl in Euro liefern (899 Cent → 8.99).
      - type: command
        run: |
          php artisan tinker --execute="DB::beginTransaction(); \$p = App\Models\Product::create(['name' => '  Stifteset  ', 'price_cents' => 500]); echo '[', DB::table('products')->where('id', \$p->id)->value('name'), ']'; DB::rollBack();"
        stdout_matches: "^\\[Stifteset\\]\\s*$"
        message: "Der Name wird noch nicht getrimmt gespeichert. Aus „  Stifteset  “ soll „Stifteset“ werden (Mutator mit set:)."
    hints:
      - "Casts schreibst du in eine Methode `protected function casts(): array { return ['active' => 'boolean', ...]; }`."
      - "Scope mit Parameter: `#[Scope] protected function cheaperThan(Builder $query, int $cents): void { $query->where('price_cents', '<', $cents); }`"
      - "Accessor und Mutator: `protected function priceEuro(): Attribute { return Attribute::make(get: fn () => $this->price_cents / 100); }` und `protected function name(): Attribute { return Attribute::make(set: fn (string $value) => trim($value)); }`"
    solution: |
      ```php title="app/Models/Product.php"
      <?php

      namespace App\Models;

      use App\Enums\ProductStatus;
      use Illuminate\Database\Eloquent\Attributes\Fillable;
      use Illuminate\Database\Eloquent\Attributes\Scope;
      use Illuminate\Database\Eloquent\Builder;
      use Illuminate\Database\Eloquent\Casts\Attribute;
      use Illuminate\Database\Eloquent\Model;

      #[Fillable(['name', 'price_cents', 'active', 'tags', 'status'])]
      class Product extends Model
      {
          protected function casts(): array
          {
              return [
                  'active' => 'boolean',
                  'tags' => 'array',
                  'status' => ProductStatus::class,
              ];
          }

          #[Scope]
          protected function active(Builder $query): void
          {
              $query->where('active', true);
          }

          #[Scope]
          protected function cheaperThan(Builder $query, int $cents): void
          {
              $query->where('price_cents', '<', $cents);
          }

          protected function priceEuro(): Attribute
          {
              return Attribute::make(get: fn () => $this->price_cents / 100);
          }

          protected function name(): Attribute
          {
              return Attribute::make(set: fn (string $value) => trim($value));
          }
      }
      ```
  - id: cast-zuordnen
    type: dragdrop
    title: Welcher Cast passt?
    description: Ordne jeder Spalte den Cast zu, mit dem du in PHP am bequemsten arbeitest.
    targets:
      - { id: boolean, label: "'boolean'" }
      - { id: array, label: "'array'" }
      - { id: datetime, label: "'datetime'" }
      - { id: enum, label: Enum-Klasse }
      - { id: hashed, label: "'hashed'" }
    items:
      - { label: "newsletter (0 oder 1)", target: boolean }
      - { label: "settings (JSON wie {\"theme\": \"dark\"})", target: array }
      - { label: shipped_at (Zeitstempel), target: datetime }
      - { label: "status (pending, paid, cancelled)", target: enum }
      - { label: password, target: hashed }
      - { label: is_admin, target: boolean }
    hints:
      - "'hashed' verschlüsselt einen Wert beim Speichern automatisch mit dem Passwort-Hasher."
      - Eine feste Liste von Zuständen ist ein typischer Fall für ein Backed Enum.
---
In einer Shop-Anwendung steht an zwanzig Stellen `where('active', true)->where('stock', '>', 0)`. Preise
liegen als Cent in der Datenbank, im Template rechnest du sie jedes Mal um. Und `$product->tags` ist ein
JSON-Text, den du ständig dekodierst. Eloquent hat für alle drei Probleme ein eigenes Werkzeug.

## Lokale Scopes: Abfragen einen Namen geben

Ein [[query-scope|Query Scope]] ist eine wiederverwendbare Abfrage-Bedingung im Model. In Laravel 13
markierst du eine geschützte Methode mit dem Attribut `#[Scope]`:

```php title="app/Models/Product.php"
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;

#[Scope]
protected function active(Builder $query): void
{
    $query->where('active', true)->where('stock', '>', 0);
}

#[Scope]
protected function cheaperThan(Builder $query, int $cents): void
{
    $query->where('price_cents', '<', $cents);
}
```

Aufrufen kannst du die Scopes wie normale Methoden – und beliebig kombinieren:

```php
Product::active()->cheaperThan(2000)->orderBy('name')->get();
$category->products()->active()->count();
```

> [!MERKSATZ]
> Ein Scope gibt einer Bedingung einen **fachlichen Namen**. Ändert sich die Regel („aktiv heißt jetzt
> auch: nicht gesperrt“), änderst du eine Stelle statt zwanzig.

## Globale Scopes – mit Vorsicht

Ein globaler Scope hängt seine Bedingung an **jede** Abfrage des Models. Du erzeugst ihn mit
`php artisan make:scope VisibleScope` und registrierst ihn per Attribut:

```php
#[ScopedBy([VisibleScope::class])]
class Product extends Model
```

Abschalten kannst du ihn gezielt: `Product::withoutGlobalScope(VisibleScope::class)->get()`. Laravels
[[soft-delete|Soft Deletes]] funktionieren genau so – gelöschte Datensätze sind standardmäßig unsichtbar.

> [!FEHLER]
> **Globale Scopes für Rechte.** „Nutzer sehen nur eigene Datensätze“ per globalem Scope wirkt bequem.
> Aber in Jobs, Befehlen und im Admin-Bereich fehlen plötzlich Daten – und niemand weiß, warum. Für
> Berechtigungen nimmst du Policies (Modul 4).

## Accessoren und Mutatoren

Ein [[accessor|Accessor]] formt einen Wert beim **Lesen** um, ein [[mutator|Mutator]] beim
**Schreiben**. Beides steckt in einer Methode, die ein `Attribute` zurückgibt:

```php
use Illuminate\Database\Eloquent\Casts\Attribute;

protected function priceEuro(): Attribute
{
    return Attribute::make(
        get: fn () => $this->price_cents / 100,
    );
}

protected function name(): Attribute
{
    return Attribute::make(
        get: fn (string $value) => $value,
        set: fn (string $value) => trim($value),
    );
}
```

| Methodenname | Aufruf im Code |
|---|---|
| `priceEuro()` | `$product->price_euro` |
| `name()` | `$product->name` |

Der Methodenname steht in camelCase, das Attribut in snake_case. Ein Accessor ohne echte Spalte wie
`price_euro` heißt *berechnetes Attribut*.

## Casts: die richtigen Typen

Aus der Datenbank kommen oft nur Texte und Zahlen. [[eloquent-cast|Casts]] wandeln sie automatisch um:

```php
protected function casts(): array
{
    return [
        'active' => 'boolean',
        'tags' => 'array',                  // JSON ⇄ PHP-Array
        'published_at' => 'datetime',       // Carbon-Objekt
        'status' => ProductStatus::class,   // Backed Enum
        'password' => 'hashed',
    ];
}
```

Der Cast `datetime` liefert ein [[carbon|Carbon]]-Objekt, mit dem du rechnen kannst: `$post->published_at->addDays(7)`.

Mit einem [[backed-enum|Backed Enum]] als Cast speicherst du `'active'` in der Datenbank und arbeitest im
Code mit `ProductStatus::Active` – Tippfehler fallen sofort auf. Für eigene Umwandlungen gibt es
[Custom Casts](https://laravel.com/docs/13.x/eloquent-mutators#custom-casts).

## Welches Werkzeug wofür?

Alle drei Werkzeuge sitzen im Model, lösen aber verschiedene Probleme. Eine kleine Entscheidungshilfe:

| Problem | Werkzeug | Beispiel |
|---|---|---|
| Dieselbe `where`-Bedingung an vielen Stellen | lokaler Scope | `Product::active()` |
| Bedingung, die **immer** gelten soll | globaler Scope | nur sichtbare Produkte |
| Wert soll beim Lesen anders aussehen | Accessor | `price_euro` aus Cent |
| Wert soll beim Speichern bereinigt werden | Mutator | Name ohne Leerzeichen |
| Spalte hat einen festen PHP-Typ | Cast | `bool`, Array, Datum, Enum |

Eine Faustregel: Casts zuerst. Sie sind kurz, eindeutig und funktionieren in beide Richtungen. Accessoren
und Mutatoren nimmst du, wenn eine echte Umrechnung oder Bereinigung nötig ist. Und alles, was mit
Darstellung im HTML zu tun hat – Farben, Icons, lange Texte –, gehört eher in Blade oder eine API Resource
als ins Model. So bleibt das Model ein Ort für Daten und Regeln, nicht für Layout.

> [!PRAXIS]
> In großen Projekten stehen Geldbeträge als Cent-Integer in der Datenbank – nie als Float, weil
> Gleitkommazahlen runden. Ein Accessor oder ein Custom Cast liefert für die Anzeige den formatierten
> Betrag.

## Zusammenfassung

- `#[Scope]` macht eine geschützte Methode zum Query Scope: `Product::active()->cheaperThan(2000)`.
- Globale Scopes (`#[ScopedBy]`) gelten für jede Abfrage – nicht für Rechte missbrauchen.
- `Attribute::make(get: …, set: …)` definiert Accessoren und Mutatoren; Methode in camelCase, Attribut in snake_case.
- Casts in `casts()` wandeln Spalten in `bool`, Arrays, Datumsobjekte, Enums oder Hashes um.
- Geldbeträge als Cent speichern und erst für die Anzeige umrechnen.
