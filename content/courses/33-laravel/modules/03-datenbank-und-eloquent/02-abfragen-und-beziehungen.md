---
title: Abfragen und Beziehungen
summary: Du filterst und sortierst Daten mit Eloquent, verbindest Tabellen über Beziehungen und vermeidest das N+1-Problem mit Eager Loading.
duration: 40
sources:
  - title: Laravel – Eloquent Relationships
    url: https://laravel.com/docs/13.x/eloquent-relationships
  - title: Laravel – Query Builder
    url: https://laravel.com/docs/13.x/queries
  - title: Laravel – Eloquent Getting Started (Retrieving Models)
    url: https://laravel.com/docs/13.x/eloquent#retrieving-models
quiz:
  - type: single
    question: "Ein Buch gehört zu genau einer Autorin, eine Autorin hat viele Bücher. Wo steht der Fremdschlüssel `author_id`?"
    options:
      - In der Tabelle authors
      - In der Tabelle books
      - In einer Zwischentabelle author_book
      - In beiden Tabellen
    answer: 1
    explanation: Der Fremdschlüssel steht immer auf der „vielen“ Seite. Jedes Buch merkt sich, zu wem es gehört. Eine Zwischentabelle brauchst du erst bei n:m.
  - type: match
    question: Ordne jeder Beziehung die passende Eloquent-Methode zu.
    pairs:
      - { left: "Autorin → ihre Bücher", right: "hasMany(Book::class)" }
      - { left: "Buch → seine Autorin", right: "belongsTo(Author::class)" }
      - { left: "Buch ↔ Schlagwörter", right: "belongsToMany(Tag::class)" }
    explanation: Die Seite mit dem Fremdschlüssel nutzt belongsTo, die Gegenseite hasMany. Bei n:m nutzen beide belongsToMany.
  - type: multiple
    question: "Welche Aufrufe schicken eine Abfrage an die Datenbank und liefern Ergebnisse?"
    options:
      - "Book::where('pages', '>', 300)->get()"
      - "Book::where('pages', '>', 300)"
      - "Book::orderBy('title')->first()"
      - "Book::count()"
    answers: [0, 2, 3]
    explanation: where() und orderBy() bauen die Abfrage nur zusammen. Erst get(), first(), count() oder paginate() führen sie aus.
  - type: find-bug
    question: "Diese Seite schickt bei 100 Büchern 101 Abfragen an die Datenbank. Welche Zeile musst du ändern?"
    language: php
    code: |
      public function index()
      {
          $books = Book::orderBy('title')->get();

          return view('books.index', ['books' => $books]);
      }

      // In der View: @foreach ($books as $book) {{ $book->author->name }} @endforeach
    bug_line: 3
    explanation: "Jeder Zugriff auf $book->author lädt die Autorin einzeln nach (N+1). Mit Book::with('author')->orderBy('title')->get() kommen alle Autor:innen in einer zweiten Abfrage."
  - type: cloze
    text: "Statt `Book::find($id)` mit eigener Prüfung auf `null` nutzt du `Book::___($id)` – dann antwortet Laravel automatisch mit 404."
    blanks:
      - [findOrFail]
    explanation: findOrFail wirft eine ModelNotFoundException, die Laravel in eine 404-Antwort verwandelt.
tasks:
  - id: autoren-beziehungen
    type: terminal
    title: Autor:innen und ihre Bücher
    description: |
      Im Ordner `autoren-buecher` liegt eine Laravel-Anwendung mit den Tabellen `authors` und `books`
      (mit Fremdschlüssel `author_id`). Die Models `Author` und `Book` existieren, die Datenbank ist mit
      drei Autor:innen und fünf Büchern gefüllt. Es fehlen die Beziehungen und zwei Routen.

      1. Ergänze im Model `Author` die Beziehung `books()` (hat viele Bücher) und im Model `Book` die
         Beziehung `author()` (gehört zu einer Autorin).
      2. Ergänze die Route `GET /autoren`. Sie gibt alle Autor:innen **alphabetisch nach Name** samt
         ihren Büchern als JSON zurück. Lade die Bücher per Eager Loading mit – die Route darf höchstens
         **2 Datenbankabfragen** brauchen.
      3. Ergänze die Route `GET /buecher/dick`. Sie gibt nur die **Titel** aller Bücher mit mindestens
         400 Seiten zurück, das dickste zuerst – als JSON-Liste, z. B. `["Titel A","Titel B"]`.

      Tipp: Gibt eine Route eine Eloquent-Collection zurück, macht Laravel automatisch JSON daraus.
      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: autoren-buecher
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
      cat > database/migrations/2026_10_01_000001_create_authors_table.php <<'PHP'
      <?php

      use Illuminate\Database\Migrations\Migration;
      use Illuminate\Database\Schema\Blueprint;
      use Illuminate\Support\Facades\Schema;

      return new class extends Migration
      {
          public function up(): void
          {
              Schema::create('authors', function (Blueprint $table) {
                  $table->id();
                  $table->string('name');
                  $table->timestamps();
              });
          }

          public function down(): void
          {
              Schema::dropIfExists('authors');
          }
      };
      PHP
      cat > database/migrations/2026_10_01_000002_create_books_table.php <<'PHP'
      <?php

      use Illuminate\Database\Migrations\Migration;
      use Illuminate\Database\Schema\Blueprint;
      use Illuminate\Support\Facades\Schema;

      return new class extends Migration
      {
          public function up(): void
          {
              Schema::create('books', function (Blueprint $table) {
                  $table->id();
                  $table->foreignId('author_id')->constrained()->cascadeOnDelete();
                  $table->string('title');
                  $table->unsignedInteger('pages');
                  $table->timestamps();
              });
          }

          public function down(): void
          {
              Schema::dropIfExists('books');
          }
      };
      PHP
      cat > app/Models/Author.php <<'PHP'
      <?php

      namespace App\Models;

      use Illuminate\Database\Eloquent\Attributes\Fillable;
      use Illuminate\Database\Eloquent\Model;

      #[Fillable(['name'])]
      class Author extends Model
      {
          // Hier fehlt die Beziehung books()
      }
      PHP
      cat > app/Models/Book.php <<'PHP'
      <?php

      namespace App\Models;

      use Illuminate\Database\Eloquent\Attributes\Fillable;
      use Illuminate\Database\Eloquent\Model;

      #[Fillable(['title', 'pages', 'author_id'])]
      class Book extends Model
      {
          // Hier fehlt die Beziehung author()
      }
      PHP
      cat > database/seeders/DatabaseSeeder.php <<'PHP'
      <?php

      namespace Database\Seeders;

      use App\Models\Author;
      use App\Models\Book;
      use Illuminate\Database\Seeder;

      class DatabaseSeeder extends Seeder
      {
          public function run(): void
          {
              $daten = [
                  'Michael Ende' => ['Momo' => 304, 'Die unendliche Geschichte' => 480],
                  'Frank Herbert' => ['Dune' => 412],
                  'Ursula K. Le Guin' => ['Erdsee' => 240, 'Die Enteigneten' => 416],
              ];

              foreach ($daten as $name => $buecher) {
                  $author = Author::create(['name' => $name]);
                  foreach ($buecher as $titel => $seiten) {
                      Book::create(['author_id' => $author->id, 'title' => $titel, 'pages' => $seiten]);
                  }
              }
          }
      }
      PHP
      php artisan migrate:fresh --seed --force -q
    checks:
      - type: command
        run: php artisan tinker --execute="echo App\Models\Author::where('name', 'Michael Ende')->first()->books()->count();"
        stdout_matches: "^2\\s*$"
        message: Die Beziehung books() im Model Author fehlt oder stimmt nicht. Sie soll hasMany(Book::class) zurückgeben.
      - type: command
        run: php artisan tinker --execute="echo App\Models\Book::where('title', 'Dune')->first()->author->name;"
        stdout_matches: "^Frank Herbert\\s*$"
        message: Die Beziehung author() im Model Book fehlt oder stimmt nicht. Sie soll belongsTo(Author::class) zurückgeben.
      - type: command
        run: |
          php -r 'require "vendor/autoload.php"; $app = require "bootstrap/app.php"; $k = $app->make(Illuminate\Contracts\Http\Kernel::class); $k->bootstrap(); echo $k->handle(Illuminate\Http\Request::create("/autoren"))->getContent();' | jq -r '[.[].name] == ["Frank Herbert","Michael Ende","Ursula K. Le Guin"] and ([.[1].books[].title] | sort) == ["Die unendliche Geschichte","Momo"]'
        stdout_equals: "true"
        message: GET /autoren liefert noch nicht alle Autor:innen alphabetisch samt ihren Büchern (Schlüssel books) als JSON.
      - type: command
        run: |
          php -r 'require "vendor/autoload.php"; $app = require "bootstrap/app.php"; $k = $app->make(Illuminate\Contracts\Http\Kernel::class); $k->bootstrap(); Illuminate\Support\Facades\DB::enableQueryLog(); $k->handle(Illuminate\Http\Request::create("/autoren")); echo count(array_filter(Illuminate\Support\Facades\DB::getQueryLog(), fn ($q) => preg_match("/\b(authors|books)\b/", $q["query"])));'
        stdout_matches: "^[12]$"
        message: GET /autoren schickt zu viele Abfragen an die Datenbank (N+1). Lade die Bücher mit with('books') vorab.
      - type: command
        run: |
          php -r 'require "vendor/autoload.php"; $app = require "bootstrap/app.php"; $k = $app->make(Illuminate\Contracts\Http\Kernel::class); echo $k->handle(Illuminate\Http\Request::create("/buecher/dick"))->getContent();' | jq -c .
        stdout_equals: '["Die unendliche Geschichte","Die Enteigneten","Dune"]'
        message: GET /buecher/dick liefert noch nicht genau die Titel der Bücher ab 400 Seiten, absteigend nach Seitenzahl.
    hints:
      - "`public function books(): HasMany { return $this->hasMany(Book::class); }` – Import: `use Illuminate\\Database\\Eloquent\\Relations\\HasMany;`"
      - "`Author::with('books')->orderBy('name')->get()` lädt alle Autor:innen und ihre Bücher in zwei Abfragen."
      - "`Book::where('pages', '>=', 400)->orderByDesc('pages')->pluck('title')` liefert nur die Titel."
    solution: |
      ```php title="app/Models/Author.php (Ausschnitt)"
      use Illuminate\Database\Eloquent\Relations\HasMany;

      public function books(): HasMany
      {
          return $this->hasMany(Book::class);
      }
      ```

      ```php title="app/Models/Book.php (Ausschnitt)"
      use Illuminate\Database\Eloquent\Relations\BelongsTo;

      public function author(): BelongsTo
      {
          return $this->belongsTo(Author::class);
      }
      ```

      ```php title="routes/web.php (Ergänzung)"
      use App\Models\Author;
      use App\Models\Book;

      Route::get('/autoren', function () {
          return Author::with('books')->orderBy('name')->get();
      });

      Route::get('/buecher/dick', function () {
          return Book::where('pages', '>=', 400)->orderByDesc('pages')->pluck('title');
      });
      ```
  - id: n-plus-1-steps
    type: steps
    title: Wie viele Abfragen sind es?
    description: In der Datenbank liegen 50 Bücher von 20 verschiedenen Autor:innen. Sag voraus, wie viele SQL-Abfragen der Code auslöst.
    steps:
      - situation: "`$books = Book::all();` und danach `foreach ($books as $b) { echo $b->title; }`"
        question: Wie viele Abfragen?
        options: ["1", "50", "51"]
        answer: 0
        explanation: Alle Bücher kommen in einer Abfrage. title ist eine normale Spalte, dafür fragt Eloquent nicht nach.
      - situation: "`$books = Book::all();` und danach `foreach ($books as $b) { echo $b->author->name; }`"
        question: Wie viele Abfragen?
        options: ["2", "21", "51"]
        answer: 2
        explanation: 1 Abfrage für die Bücher plus je eine pro Buch für die Autorin – das N+1-Problem. Eloquent lädt eine Beziehung beim ersten Zugriff auf jedes einzelne Objekt nach.
      - situation: "`$books = Book::with('author')->get();` und dieselbe Schleife wie eben."
        question: Wie viele Abfragen?
        options: ["2", "21", "51"]
        answer: 0
        explanation: "Eager Loading: eine Abfrage für die Bücher, eine zweite für alle benötigten Autor:innen (WHERE id IN (...))."
      - situation: "`$author = Author::find(3);` und danach `$author->books()->where('pages', '>', 300)->count()`"
        question: Was passiert bei books() mit Klammern?
        options:
          - Eloquent lädt alle Bücher und zählt sie in PHP.
          - Eloquent baut eine Abfrage mit WHERE author_id = 3 AND pages > 300 und lässt die Datenbank zählen.
          - Es gibt einen Fehler, weil books eine Eigenschaft ist.
        answer: 1
        explanation: books() liefert die Beziehung als Abfrage, an die du weitere Bedingungen hängen kannst. books ohne Klammern lädt die Bücher als Collection.
---
Deine Leseliste wächst. Bald willst du nur ungelesene Bücher sehen, die dicksten zuerst – und zu jedem
Buch die Autorin. Die Daten dafür liegen in zwei Tabellen. Eloquent hilft dir beim Filtern **und** beim
Verbinden der Tabellen, ohne dass du JOINs von Hand schreibst.

## Abfragen bauen

Jedes Model ist gleichzeitig der Startpunkt für eine Abfrage. Du hängst Bedingungen aneinander, bis du sie
mit einer **abschließenden Methode** ausführst:

```php
$books = Book::where('finished', false)
    ->where('pages', '>=', 300)
    ->orderByDesc('pages')
    ->get();
```

| Methode | Wirkung |
|---|---|
| `where('spalte', 'wert')` | Bedingung mit `=` |
| `where('pages', '>=', 300)` | Bedingung mit Operator |
| `orderBy('title')` / `orderByDesc('pages')` | sortieren |
| `limit(5)` | höchstens 5 Zeilen |
| `get()` | **ausführen**, alle Treffer als Collection |
| `first()` | ausführen, erster Treffer oder `null` |
| `count()`, `pluck('title')` | ausführen, Anzahl bzw. nur eine Spalte |
| `paginate(10)` | ausführen, Seite für Seite |

Hinter den Kulissen erzeugt Eloquent eine [[prepared-statement|Prepared Statement]]. Werte werden nie in
den SQL-Text geklebt – das schützt dich vor [[sql-injection|SQL-Injection]].

> [!MERKSATZ]
> `where()` und `orderBy()` **bauen** die Abfrage. Erst `get()`, `first()`, `count()` oder `paginate()`
> **schicken** sie an die Datenbank.

## Einzelne Datensätze finden

Für Detailseiten brauchst du einen Datensatz anhand seiner ID:

```php
$book = Book::find(42);        // Book oder null
$book = Book::findOrFail(42);  // Book – oder 404-Antwort
```

`findOrFail()` ist in Controllern fast immer die bessere Wahl. Noch bequemer ist das
[[route-model-binding|Route-Model-Binding]]: Heißt der Platzhalter `{book}` und der Parameter
`Book $book`, ruft Laravel `findOrFail()` für dich auf.

```php
Route::get('/books/{book}', function (Book $book) {
    return $book;   // wird automatisch zu JSON
});
```

> [!FEHLER]
> **`find()` ohne Prüfung auf `null`.** Ruft jemand `/books/9999` auf, stürzt `$book->title` mit
> „Attempt to read property on null“ ab – Status 500 statt 404. Nutze `findOrFail()` oder
> Route-Model-Binding.

## Beziehungen

![Tabellen authors, books, tags und book_tag mit den passenden Eloquent-Beziehungen](/assets/laravel/eloquent-beziehungen.svg)

Eine Autorin hat viele Bücher, ein Buch gehört zu einer Autorin. In der Datenbank steht dafür ein
[[fremdschluessel|Fremdschlüssel]] `author_id` in `books`. In der Migration legst du ihn so an:

```php
$table->foreignId('author_id')->constrained()->cascadeOnDelete();
```

In den Models beschreibst du dieselbe [[eloquent-beziehung|Beziehung]] als Methoden:

```php title="app/Models/Author.php"
public function books(): HasMany
{
    return $this->hasMany(Book::class);
}
```

```php title="app/Models/Book.php"
public function author(): BelongsTo
{
    return $this->belongsTo(Author::class);
}
```

| Beziehung | Methode | Fremdschlüssel steht … |
|---|---|---|
| 1 : n (Autorin → Bücher) | `hasMany` | in der anderen Tabelle |
| n : 1 (Buch → Autorin) | `belongsTo` | in der eigenen Tabelle |
| n : m (Buch ↔ Tags) | `belongsToMany` | in einer [[zwischentabelle|Zwischentabelle]] |

## Beziehungen benutzen

Ohne Klammern bekommst du die Daten, mit Klammern eine Abfrage zum Weiterbauen:

```php
$author->books;                                  // Collection aller Bücher
$author->books()->where('pages', '>', 300)->get(); // nur dicke Bücher
$book->author->name;                             // "Michael Ende"

$author->books()->create(['title' => 'Momo', 'pages' => 304]); // author_id wird gesetzt
```

Eloquent leitet die Spaltennamen aus den Methodennamen ab: `author()` sucht `author_id`. Hältst du dich an
diese Konvention, brauchst du keine weiteren Angaben.

> [!TIPP]
> `Author::withCount('books')->get()` hängt jeder Autorin eine Eigenschaft `books_count` an – ideal für
> Listen wie „Michael Ende (2 Bücher)“, ohne alle Bücher zu laden.

## Das N+1-Problem und Eager Loading

Eloquent lädt Beziehungen erst beim ersten Zugriff nach. Bei einem einzelnen Buch ist das praktisch. In
einer Schleife wird es teuer:

```php
$books = Book::all();               // 1 Abfrage
foreach ($books as $book) {
    echo $book->author->name;       // je Buch 1 weitere Abfrage
}
```

Bei 100 Büchern sind das 101 Abfragen – das [[n-plus-1-problem|N+1-Problem]]. Die Lösung heißt
[[eager-loading|Eager Loading]]: Du sagst vorher, welche Beziehungen du brauchst.

```php
$books = Book::with('author')->get(); // 2 Abfragen, egal wie viele Bücher
```

> [!PRAXIS]
> Langsame Seiten in Laravel-Projekten haben erstaunlich oft diese eine Ursache. Werkzeuge wie die
> Laravel Debugbar zeigen die Zahl der Abfragen pro Seite an. Mit `Model::preventLazyLoading()` (in
> `AppServiceProvider::boot()`) wirft Laravel lokal sogar eine Exception, sobald irgendwo nachgeladen wird.

## Zusammenfassung

- Abfragen baust du mit `where()`, `orderBy()`, `limit()`; `get()`, `first()`, `count()` führen sie aus.
- `findOrFail()` und Route-Model-Binding antworten automatisch mit 404, wenn ein Datensatz fehlt.
- Beziehungen sind Methoden im Model: `hasMany`, `belongsTo`, `belongsToMany`.
- `$author->books` liefert Daten, `$author->books()` eine Abfrage zum Weiterbauen.
- Schleifen über Beziehungen ohne `with()` erzeugen das N+1-Problem; Eager Loading löst es mit einer zusätzlichen Abfrage.
