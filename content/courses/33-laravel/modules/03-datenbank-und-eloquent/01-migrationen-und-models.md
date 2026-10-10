---
title: Migrationen, Models und Testdaten
summary: Du beschreibst Tabellen mit Migrationen, arbeitest mit Eloquent-Models und füllst die Datenbank mit Factories und Seedern.
duration: 40
sources:
  - title: Laravel – Database Migrations
    url: https://laravel.com/docs/13.x/migrations
  - title: Laravel – Eloquent Getting Started
    url: https://laravel.com/docs/13.x/eloquent
  - title: Laravel – Eloquent Factories
    url: https://laravel.com/docs/13.x/eloquent-factories
  - title: Laravel – Database Seeding
    url: https://laravel.com/docs/13.x/seeding
quiz:
  - type: single
    question: Du hast eine Migration geschrieben, aber die Tabelle existiert noch nicht. Was fehlt?
    options:
      - "php artisan make:migration"
      - "php artisan migrate"
      - "php artisan db:seed"
      - "composer install"
    answer: 1
    explanation: Eine Migration ist nur eine Beschreibung. Erst php artisan migrate führt alle noch nicht gelaufenen Migrationen aus und legt die Tabellen an.
  - type: match
    question: Ordne jedem Befehl seine Wirkung zu.
    pairs:
      - { left: "php artisan migrate", right: Führt alle neuen Migrationen aus }
      - { left: "php artisan migrate:rollback", right: Macht den letzten Migrationslauf rückgängig }
      - { left: "php artisan migrate:fresh --seed", right: "Löscht alle Tabellen, baut sie neu und füllt sie mit Testdaten" }
      - { left: "php artisan migrate:status", right: "Zeigt, welche Migrationen schon gelaufen sind" }
    explanation: "migrate:fresh löscht alle Daten – lokal praktisch, auf einem Server mit echten Daten verboten."
  - type: multiple
    question: "Das Model heißt `BookReview`. Welche Aussagen stimmen ohne weitere Einstellungen?"
    options:
      - Eloquent sucht die Tabelle book_reviews.
      - Der Primärschlüssel heißt id.
      - Eloquent erwartet die Spalten created_at und updated_at.
      - Eloquent legt die Tabelle beim ersten Zugriff automatisch an.
    answers: [0, 1, 2]
    explanation: Eloquent folgt Konventionen (Klassenname in snake_case und Mehrzahl, id, Zeitstempel). Tabellen entstehen aber nur durch Migrationen.
  - type: find-bug
    question: "`Book::create($request->all())` wirft eine `MassAssignmentException`. Welche Zeile im Model muss geändert werden?"
    language: php
    code: |
      <?php

      namespace App\Models;

      use Illuminate\Database\Eloquent\Attributes\Fillable;
      use Illuminate\Database\Eloquent\Model;

      #[Fillable(['title'])]
      class Book extends Model
      {
      }
    bug_line: 8
    explanation: Das Formular schickt auch author und pages. Nur Felder, die in #[Fillable] stehen, dürfen per create() gesetzt werden. Ergänze sie dort – oder nimm sie bewusst nicht an.
  - type: cloze
    text: "Eine Spalte, die leer bleiben darf, markierst du in der Migration mit `->___()`. Einen Standardwert setzt du mit `->___(false)`."
    blanks:
      - [nullable]
      - [default]
    explanation: Ohne nullable() ist eine Spalte NOT NULL. default() legt fest, was gespeichert wird, wenn kein Wert angegeben ist.
tasks:
  - id: notizen-model
    type: terminal
    title: Eine Tabelle für Notizen
    description: |
      Im Ordner `notizen-model` liegt eine frische Laravel-Anwendung mit SQLite. Lege eine Tabelle für
      Notizen an – samt Model, Factory und Testdaten.

      1. Erzeuge Model, Migration und Factory: `php artisan make:model Note -mf`.
      2. Die Migration bekommt zusätzlich zu `id()` und `timestamps()` die Spalten:
         `title` (Text, Pflicht), `body` (langer Text, darf leer sein) und `pinned` (Boolean,
         Standardwert `false`).
      3. Erlaube Mass Assignment für `title`, `body` und `pinned` mit `#[Fillable([...])]`.
      4. Lass `pinned` als Boolean casten.
      5. Fülle die Factory (`title` z. B. mit `fake()->sentence(3)`, `body` mit `fake()->paragraph()`,
         `pinned` mit `false`).
      6. Der `DatabaseSeeder` legt zusätzlich **5 Notizen** an.
      7. Baue die Datenbank neu: `php artisan migrate:fresh --seed`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: notizen-model
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
        path: app/Models/Note.php
        message: Das Model app/Models/Note.php fehlt noch. Nutze php artisan make:model Note -mf.
      - type: command
        run: php artisan tinker --execute="echo implode(',', Schema::getColumnListing('notes'));"
        stdout_matches: "(?=.*\\btitle\\b)(?=.*\\bbody\\b)(?=.*\\bpinned\\b)(?=.*\\bcreated_at\\b)"
        message: Die Tabelle notes fehlt oder hat nicht alle Spalten (title, body, pinned, Zeitstempel). Ergänze die Migration und führe php artisan migrate:fresh --seed aus.
      - type: command
        run: php artisan tinker --execute="\$n = App\Models\Note::create(['title' => 'Probe']); echo var_export(\$n->fresh()->pinned, true), ' ', var_export(\$n->fresh()->body, true);"
        stdout_matches: "^false NULL\\s*$"
        message: "Note::create(['title' => 'Probe']) klappt noch nicht wie erwartet: body soll leer bleiben dürfen (nullable), pinned soll false sein (default(false) und Cast boolean). Prüfe auch #[Fillable]."
      - type: command
        run: php artisan tinker --execute="echo implode(',', (new App\Models\Note)->getFillable());"
        stdout_matches: "(?=.*\\btitle\\b)(?=.*\\bbody\\b)(?=.*\\bpinned\\b)"
        message: "Das Model Note erlaubt noch nicht title, body und pinned für Mass Assignment."
      - type: command
        run: php artisan tinker --execute="echo App\Models\Note::where('title', '!=', 'Probe')->count();"
        stdout_matches: "^\\s*([5-9]|[1-9][0-9]+)\\s*$"
        message: In der Datenbank liegen noch keine 5 Notizen. Ergänze Note::factory(5)->create() im DatabaseSeeder und führe php artisan migrate:fresh --seed aus.
    hints:
      - "Spalten: `$table->string('title');`, `$table->text('body')->nullable();`, `$table->boolean('pinned')->default(false);`"
      - "Über die Klasse: `#[Fillable(['title', 'body', 'pinned'])]` mit `use Illuminate\\Database\\Eloquent\\Attributes\\Fillable;` – Cast: `protected function casts(): array { return ['pinned' => 'boolean']; }`"
      - "Im Seeder: `Note::factory(5)->create();` und oben `use App\\Models\\Note;`."
    solution: |
      ```php title="Migration (Ausschnitt)"
      Schema::create('notes', function (Blueprint $table) {
          $table->id();
          $table->string('title');
          $table->text('body')->nullable();
          $table->boolean('pinned')->default(false);
          $table->timestamps();
      });
      ```

      ```php title="app/Models/Note.php"
      <?php

      namespace App\Models;

      use Illuminate\Database\Eloquent\Attributes\Fillable;
      use Illuminate\Database\Eloquent\Factories\HasFactory;
      use Illuminate\Database\Eloquent\Model;

      #[Fillable(['title', 'body', 'pinned'])]
      class Note extends Model
      {
          use HasFactory;

          protected function casts(): array
          {
              return ['pinned' => 'boolean'];
          }
      }
      ```

      ```php title="database/factories/NoteFactory.php (definition)"
      return [
          'title' => fake()->sentence(3),
          'body' => fake()->paragraph(),
          'pinned' => false,
      ];
      ```

      ```bash
      php artisan migrate:fresh --seed
      ```
  - id: spaltentypen
    type: dragdrop
    title: Welche Spalte passt?
    description: Du planst die Tabelle `books`. Ordne jedem Feld die passende Zeile für die Migration zu.
    targets:
      - { id: string, label: "$table->string(...)" }
      - { id: text, label: "$table->text(...)->nullable()" }
      - { id: int, label: "$table->unsignedInteger(...)" }
      - { id: bool, label: "$table->boolean(...)->default(false)" }
      - { id: fk, label: "$table->foreignId(...)->constrained()" }
      - { id: date, label: "$table->date(...)->nullable()" }
    items:
      - { label: Titel des Buchs (Pflicht), target: string }
      - { label: "Klappentext, mehrere Absätze, optional", target: text }
      - { label: Seitenzahl, target: int }
      - { label: "Schon gelesen? (ja/nein)", target: bool }
      - { label: Verweis auf die Tabelle authors, target: fk }
      - { label: "Datum, an dem du es beendet hast", target: date }
    hints:
      - string ist für kurze Texte bis 255 Zeichen, text für lange.
      - "foreignId('author_id')->constrained() legt einen Fremdschlüssel auf authors.id an."
---
Bisher kamen deine Bücher aus einem fest eingetippten Array. Eine echte Leseliste muss sich aber merken,
was du einträgst – auch nach einem Neustart. Dafür braucht sie eine Datenbank. Laravel macht daraus zwei
Aufgaben: **Tabellen beschreiben** mit [[migration|Migrationen]] und **Daten benutzen** mit
[[eloquent|Eloquent]]-Models.

## Migrationen: Tabellen als Code

Eine Migration ist eine PHP-Datei, die eine Änderung am [[datenbank-schema|Datenbankschema]] beschreibt –
etwa „lege die Tabelle `books` an“. Weil sie im Repository liegt, haben alle im Team und jeder Server
exakt dieselben Tabellen. Denk an ein Bauprotokoll: Jede Migration ist ein Eintrag, der genau einmal
ausgeführt wird.

```bash title="Terminal"
php artisan make:migration create_books_table
```

```php title="database/migrations/2026_10_10_120000_create_books_table.php"
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('books', function (Blueprint $table) {
            $table->id();                                 // Primärschlüssel
            $table->string('title');                      // VARCHAR, Pflicht
            $table->unsignedInteger('pages')->nullable(); // darf leer sein
            $table->boolean('finished')->default(false);
            $table->timestamps();                         // created_at, updated_at
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('books');
    }
};
```

`up()` führt die Änderung aus, `down()` macht sie rückgängig. Der Zeitstempel im Dateinamen legt die
Reihenfolge fest.

## Migrationen ausführen

| Befehl | Wirkung |
|---|---|
| `php artisan migrate` | führt alle Migrationen aus, die noch nicht gelaufen sind |
| `php artisan migrate:status` | zeigt, was schon gelaufen ist |
| `php artisan migrate:rollback` | ruft `down()` für den letzten Lauf auf |
| `php artisan migrate:fresh` | löscht **alle** Tabellen und baut sie neu |

Laravel merkt sich in der Tabelle `migrations`, welche Dateien schon ausgeführt wurden. Deshalb läuft
jede Migration nur einmal.

> [!FEHLER]
> **Eine schon ausgeführte Migration nachträglich ändern.** Auf deinem Rechner läuft sie nicht noch
> einmal, und deine Kolleg:innen bekommen die Änderung nie. Ist eine Migration einmal geteilt, schreibst
> du für jede Änderung eine **neue** Migration, z. B. `add_isbn_to_books_table`.

> [!ACHTUNG]
> `migrate:fresh` löscht alle Daten. Lokal ist das praktisch, auf einem Server mit echten Daten niemals.

## Das Model

Ein [[model|Model]] ist eine Klasse, die für eine Tabelle steht. Eloquent ist das [[orm|ORM]] von
Laravel: Jede Zeile wird ein Objekt, jede Spalte eine Eigenschaft.

```php title="app/Models/Book.php"
#[Fillable(['title', 'pages', 'finished'])]
class Book extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return ['finished' => 'boolean'];
    }
}
```

Eloquent arbeitet mit [[konvention-vor-konfiguration|Konventionen]]: Das Model `Book` gehört zur
Tabelle `books`, `BookReview` zu `book_reviews`. Der Primärschlüssel heißt `id`, die Zeitstempel
`created_at` und `updated_at` füllt Eloquent selbst.

Die Methode `casts()` wandelt Werte beim Lesen um. SQLite speichert `finished` als `0` oder `1` – mit
dem [[eloquent-cast|Cast]] `'boolean'` bekommst du `true` oder `false`. Weitere Casts sind `'integer'`,
`'datetime'` oder `'array'`.

> [!MERKSATZ]
> Migrationen beschreiben, **wie** eine Tabelle aussieht. Models beschreiben, **wie du mit ihren Daten
> arbeitest**. Beides gehört zusammen, ist aber getrennter Code.

## Mass Assignment

Am bequemsten legst du Datensätze mit einem Array an:

```php
$book = Book::create(['title' => 'Dune', 'pages' => 412]);
```

Das nennt sich [[mass-assignment|Mass Assignment]]. Gefährlich wird es, wenn das Array direkt aus einem
Formular kommt: Ein Angreifer könnte ein verstecktes Feld `is_admin=1` mitschicken. Deshalb verlangt
Eloquent eine Liste erlaubter Felder – in Laravel 13 als [[php-attribut|PHP-Attribut]] `#[Fillable]`
über der Klasse. Felder, die dort fehlen, werden bei `create()` nicht gesetzt.

| Aktion | Code |
|---|---|
| Anlegen | `Book::create([...])` |
| Alle lesen | `Book::all()` |
| Einen finden | `Book::find(1)` oder `Book::findOrFail(1)` |
| Ändern | `$book->update(['pages' => 420])` |
| Löschen | `$book->delete()` |

Ausprobieren kannst du alles in [[tinker|Tinker]]: `php artisan tinker`, dann `Book::count()`.

## Factories und Seeder

Zum Entwickeln und Testen brauchst du Daten – aber keine echten. Eine [[factory|Factory]] beschreibt,
wie ein „typischer“ Datensatz aussieht. `fake()` erzeugt dabei passende Zufallswerte:

```php title="database/factories/BookFactory.php"
public function definition(): array
{
    return [
        'title' => fake()->sentence(3),
        'pages' => fake()->numberBetween(80, 900),
        'finished' => fake()->boolean(),
    ];
}
```

Ein Seeder füllt die Datenbank mit diesen [[seed-daten|Seed-Daten]]. Der `DatabaseSeeder` ist der
Einstieg:

```php title="database/seeders/DatabaseSeeder.php (in run())"
Book::factory(12)->create();
Book::factory()->create(['title' => 'Momo']); // einzelne Werte überschreiben
```

```bash title="Terminal"
php artisan migrate:fresh --seed
```

> [!PRAXIS]
> In Teams ist `php artisan migrate:fresh --seed` der Standard-Befehl, um lokal einen sauberen
> Ausgangszustand herzustellen. Echte Kundendaten haben auf Entwickler-Rechnern nichts verloren – Factories
> erzeugen realistische, aber erfundene Daten.

## Zusammenfassung

- Migrationen beschreiben Tabellen als Code; `php artisan migrate` führt sie aus, `down()` macht sie rückgängig.
- Eine bereits geteilte Migration änderst du nicht – du schreibst eine neue.
- Ein Eloquent-Model steht für eine Tabelle (`Book` → `books`); Zeilen werden Objekte.
- `#[Fillable]` legt fest, welche Felder per `create()`/`update()` gesetzt werden dürfen; `casts()` wandelt Typen um.
- Factories erzeugen Testdaten mit `fake()`, Seeder füllen damit die Datenbank (`migrate:fresh --seed`).
