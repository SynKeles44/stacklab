---
title: Eine JSON-API mit API Resources
summary: Du baust eine REST-API mit API-Routen, API-Controller und API Resources, lernst die passenden Statuscodes und bekommst einen ersten Blick auf Sanctum und Queues.
duration: 40
sources:
  - title: Laravel – Eloquent API Resources
    url: https://laravel.com/docs/13.x/eloquent-resources
  - title: Laravel – Routing (API Routes)
    url: https://laravel.com/docs/13.x/routing#api-routes
  - title: Laravel – Sanctum
    url: https://laravel.com/docs/13.x/sanctum
  - title: Laravel – Queues
    url: https://laravel.com/docs/13.x/queues
quiz:
  - type: single
    question: "Du hast `Route::apiResource('books', ...)` in `routes/api.php` eingetragen. Unter welcher URL erreichst du die Liste?"
    options: ["/books", "/api/books", "/api/v1/books", "/books/api"]
    answer: 1
    explanation: Alle Routen aus routes/api.php bekommen automatisch das Präfix /api.
  - type: match
    question: Welcher Statuscode passt zu welcher Situation?
    pairs:
      - { left: "200", right: Daten erfolgreich geliefert }
      - { left: "201", right: Neuer Datensatz angelegt }
      - { left: "204", right: Gelöscht – Antwort ohne Inhalt }
      - { left: "404", right: Datensatz existiert nicht }
      - { left: "422", right: Validierung fehlgeschlagen }
    explanation: Laravel setzt 201 automatisch, wenn eine Resource ein gerade angelegtes Model zurückgibt, und 422, wenn die Validierung einer JSON-Anfrage scheitert.
  - type: multiple
    question: Warum gibst du ein Model nicht einfach direkt als JSON zurück, sondern über eine API Resource?
    options:
      - Interne Spalten (z. B. Notizen, Zeitstempel) gelangen nicht versehentlich nach außen.
      - Die Form der API bleibt stabil, auch wenn sich die Tabelle ändert.
      - Ohne Resource kann Laravel gar kein JSON erzeugen.
      - Du kannst Werte umwandeln, etwa 0/1 in true/false.
    answers: [0, 1, 3]
    explanation: Ein Model wird auch ohne Resource zu JSON. Die Resource ist eine bewusste Zwischenschicht zwischen Datenbank und öffentlicher API.
  - type: cloze
    text: "API-Routen schützt du mit Sanctum über die Middleware `auth:___`. Den Token schickt der Client im Header `Authorization: ___ <token>`."
    blanks:
      - [sanctum]
      - [Bearer]
    explanation: Ohne gültigen Token antwortet eine geschützte Route mit 401 Unauthenticated.
  - type: find-bug
    question: "Das Anlegen soll in der API möglichst schnell antworten. Trotzdem wartet der Client jedes Mal mehrere Sekunden. Welche Zeile gehört in eine Queue?"
    language: php
    code: |
      public function store(StoreBookRequest $request)
      {
          $book = Book::create($request->validated());

          Mail::to('team@example.com')->send(new BookAdded($book));

          return $book->toResource();
      }
    bug_line: 5
    explanation: Das Versenden einer Mail dauert und ist für die Antwort nicht nötig. Mit Mail::to(...)->queue(...) oder einem Job erledigt ein Worker es im Hintergrund.
tasks:
  - id: buecher-api
    type: terminal
    title: Eine REST-API für Bücher
    description: |
      Im Ordner `buecher-api` liegt eine Laravel-Anwendung mit dem Model `Book` (Spalten `title`,
      `author`, `pages`, `finished` und eine **interne** Spalte `internal_note`) und drei Büchern in der
      Datenbank. Baue eine JSON-API dafür.

      1. Richte API-Routen ein: `php artisan install:api` (die Migrations-Frage beantwortest du mit
         „yes“ oder führst danach `php artisan migrate` aus).
      2. Erzeuge `php artisan make:resource BookResource`. Sie gibt nur `id`, `title`, `author`,
         `pages` und `finished` (als echtes `true`/`false`) aus – **kein** `internal_note`, keine
         Zeitstempel.
      3. Erzeuge `php artisan make:controller Api/BookController --api --model=Book` und registriere ihn
         in `routes/api.php` mit `Route::apiResource('books', ...)`.
      4. `index` liefert alle Bücher alphabetisch nach Titel, `show` ein Buch – beides über die Resource.
      5. `store` validiert (`title` und `author` Pflicht, `pages` optional, ganze Zahl ≥ 1) und antwortet
         mit dem neuen Buch (Status 201). `update` validiert genauso.
      6. `destroy` löscht und antwortet mit **204** ohne Inhalt.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: buecher-api
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
      cat > database/migrations/2026_10_01_000001_create_books_table.php <<'PHP'
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
                  $table->string('title');
                  $table->string('author');
                  $table->unsignedInteger('pages')->nullable();
                  $table->boolean('finished')->default(false);
                  $table->text('internal_note')->nullable();
                  $table->timestamps();
              });
          }

          public function down(): void
          {
              Schema::dropIfExists('books');
          }
      };
      PHP
      cat > app/Models/Book.php <<'PHP'
      <?php

      namespace App\Models;

      use Illuminate\Database\Eloquent\Attributes\Fillable;
      use Illuminate\Database\Eloquent\Factories\HasFactory;
      use Illuminate\Database\Eloquent\Model;

      #[Fillable(['title', 'author', 'pages', 'finished'])]
      class Book extends Model
      {
          use HasFactory;
      }
      PHP
      cat > database/factories/BookFactory.php <<'PHP'
      <?php

      namespace Database\Factories;

      use Illuminate\Database\Eloquent\Factories\Factory;

      class BookFactory extends Factory
      {
          public function definition(): array
          {
              return [
                  'title' => fake()->sentence(3),
                  'author' => fake()->name(),
                  'pages' => fake()->numberBetween(80, 900),
                  'finished' => false,
                  'internal_note' => 'nur intern',
              ];
          }
      }
      PHP
      php artisan migrate --force -q
      php artisan tinker --execute="App\Models\Book::factory()->createMany([['title' => 'Momo', 'author' => 'Michael Ende'], ['title' => 'Dune', 'author' => 'Frank Herbert'], ['title' => 'Erdsee', 'author' => 'Ursula K. Le Guin']]);" >/dev/null
    checks:
      - type: file_exists
        path: routes/api.php
        message: routes/api.php fehlt noch. Führe php artisan install:api aus.
      - type: file_exists
        path: app/Http/Resources/BookResource.php
        message: Die Resource app/Http/Resources/BookResource.php fehlt noch.
      - type: command
        run: php artisan route:list --json | jq -r '.[].name' | grep -cE '^books\.(index|store|show|update|destroy)$'
        stdout_matches: "^5$"
        message: Die fünf API-Routen (books.index, store, show, update, destroy) fehlen noch. Nutze Route::apiResource('books', BookController::class) in routes/api.php.
      - type: command
        run: |
          f=tests/Feature/StacklabPruefungApiLesenTest.php
          cat > "$f" <<'EOF'
          <?php

          use App\Models\Book;
          use Illuminate\Foundation\Testing\RefreshDatabase;

          uses(RefreshDatabase::class);

          test('stacklab: lesen', function () {
              Book::factory()->create(['title' => 'Zebra', 'author' => 'Z']);
              Book::factory()->create(['title' => 'Apfel', 'author' => 'A', 'pages' => 120]);
              $this->getJson('/api/books')->assertOk()
                  ->assertJsonPath('data.0.title', 'Apfel')
                  ->assertJsonPath('data.1.title', 'Zebra')
                  ->assertJsonMissingPath('data.0.internal_note')
                  ->assertJsonMissingPath('data.0.created_at');
              $book = Book::where('title', 'Apfel')->first();
              $this->getJson("/api/books/{$book->id}")->assertOk()
                  ->assertExactJson(['data' => ['id' => $book->id, 'title' => 'Apfel', 'author' => 'A', 'pages' => 120, 'finished' => false]]);
              $this->getJson('/api/books/9999')->assertNotFound();
          });
          EOF
          php artisan test "$f" >/dev/null 2>&1; s=$?; rm -f "$f"; exit $s
        message: "Lesen klappt noch nicht wie erwartet. GET /api/books soll alle Bücher alphabetisch unter data liefern, GET /api/books/{id} genau id, title, author, pages und finished (als true/false) – ohne internal_note und Zeitstempel. Unbekannte IDs: 404."
      - type: command
        run: |
          f=tests/Feature/StacklabPruefungApiSchreibenTest.php
          cat > "$f" <<'EOF'
          <?php

          use App\Models\Book;
          use Illuminate\Foundation\Testing\RefreshDatabase;

          uses(RefreshDatabase::class);

          test('stacklab: schreiben', function () {
              $this->postJson('/api/books', ['title' => 'Momo', 'author' => 'Michael Ende', 'pages' => 304])
                  ->assertCreated()->assertJsonPath('data.title', 'Momo');
              $this->postJson('/api/books', ['title' => '', 'pages' => 0])
                  ->assertUnprocessable()->assertJsonValidationErrors(['title', 'author', 'pages']);
              $book = Book::first();
              $this->putJson("/api/books/{$book->id}", ['title' => 'Momo (Neuauflage)', 'author' => 'Michael Ende'])
                  ->assertOk()->assertJsonPath('data.title', 'Momo (Neuauflage)');
              $this->putJson("/api/books/{$book->id}", ['title' => ''])->assertUnprocessable();
              $this->deleteJson("/api/books/{$book->id}")->assertNoContent();
              $this->assertDatabaseCount('books', 0);
          });
          EOF
          php artisan test "$f" >/dev/null 2>&1; s=$?; rm -f "$f"; exit $s
        message: "Schreiben klappt noch nicht vollständig. POST /api/books soll mit 201 antworten (bei Fehlern 422), PUT /api/books/{id} ändern und validieren, DELETE /api/books/{id} mit 204 ohne Inhalt antworten."
    hints:
      - "In der Resource: `return ['id' => $this->id, 'title' => $this->title, 'author' => $this->author, 'pages' => $this->pages, 'finished' => (bool) $this->finished];`"
      - "Im Controller: `return BookResource::collection(Book::orderBy('title')->get());` bzw. `return new BookResource($book);` – oder kürzer `$book->toResource()`."
      - "Für 204: `$book->delete(); return response()->noContent();` – für die Regeln eignet sich ein Form Request oder `$request->validate([...])`."
    solution: |
      ```php title="app/Http/Resources/BookResource.php (toArray)"
      public function toArray(Request $request): array
      {
          return [
              'id' => $this->id,
              'title' => $this->title,
              'author' => $this->author,
              'pages' => $this->pages,
              'finished' => (bool) $this->finished,
          ];
      }
      ```

      ```php title="app/Http/Controllers/Api/BookController.php"
      class BookController extends Controller
      {
          public function index()
          {
              return BookResource::collection(Book::orderBy('title')->get());
          }

          public function store(Request $request)
          {
              $book = Book::create($request->validate($this->regeln()));

              return new BookResource($book); // 201, weil gerade angelegt
          }

          public function show(Book $book)
          {
              return new BookResource($book);
          }

          public function update(Request $request, Book $book)
          {
              $book->update($request->validate($this->regeln()));

              return new BookResource($book);
          }

          public function destroy(Book $book)
          {
              $book->delete();

              return response()->noContent();
          }

          private function regeln(): array
          {
              return [
                  'title' => ['required', 'string', 'max:255'],
                  'author' => ['required', 'string', 'max:255'],
                  'pages' => ['nullable', 'integer', 'min:1'],
              ];
          }
      }
      ```

      ```php title="routes/api.php (Ergänzung)"
      use App\Http\Controllers\Api\BookController;

      Route::apiResource('books', BookController::class);
      ```
  - id: api-request
    type: request
    title: Ein Buch über die geschützte API anlegen
    description: |
      Die Leseliste läuft unter `https://api.example.com`. Die Route `POST /api/books` ist mit
      `auth:sanctum` geschützt. Lege das Buch **Momo** von **Michael Ende** an.

      - Schicke die Daten als JSON (passender `Content-Type`).
      - Sag dem Server mit `Accept`, dass du JSON zurückhaben willst.
      - Authentifiziere dich mit deinem Token im Header `Authorization` (Schema `Bearer`, Token-Platzhalter `<dein-token>`).
    base_url: https://api.example.com
    expected:
      method: POST
      path: "^/api/books/?$"
      headers:
        Content-Type: "application/json"
        Accept: "application/json"
        Authorization: "^Bearer\\s+\\S+"
      body_contains: ['"title"', 'Momo', '"author"', 'Michael Ende']
    response:
      status: 201
      body: '{"data": {"id": 4, "title": "Momo", "author": "Michael Ende", "pages": null, "finished": false}}'
    hints:
      - Die URL beginnt mit /api, weil die Route in routes/api.php steht.
      - "Der Body sieht so aus: {\"title\": \"Momo\", \"author\": \"Michael Ende\"}"
      - "Header: Authorization: Bearer <dein-token>"
---
Deine Leseliste soll eine App fürs Handy bekommen. Die App braucht kein HTML – sie will die Daten als
[[json|JSON]] und baut ihre Oberfläche selbst. Dafür bietet deine Laravel-Anwendung eine zweite Tür an:
eine [[rest-api|REST-API]]. Die Bausteine kennst du schon – Routen, Controller, Validierung. Neu sind nur
die API-Routen und die [[api-resource|API Resources]].

## API-Routen einrichten

Ein frisches Laravel-Projekt hat nur Web-Routen. Die API schaltest du mit einem Befehl frei:

```bash title="Terminal"
php artisan install:api
```

Der Befehl legt `routes/api.php` an, installiert das Paket [[sanctum|Sanctum]] für Token-Anmeldung und
bietet an, die Migration für dessen Tabelle auszuführen. Routen in `routes/api.php` unterscheiden sich in
zwei Punkten von Web-Routen:

| | `routes/web.php` | `routes/api.php` |
|---|---|---|
| URL-Präfix | keins | `/api` |
| Session, Cookies, CSRF | ja | nein – zustandslos |
| Antwort bei Fehlern | HTML-Seite oder Weiterleitung | JSON |

## API-Controller und apiResource

Eine API braucht keine Formulare. Von den sieben Resource-Routen fallen `create` und `edit` weg:

```bash title="Terminal"
php artisan make:controller Api/BookController --api --model=Book
```

```php title="routes/api.php"
use App\Http\Controllers\Api\BookController;

Route::apiResource('books', BookController::class);
```

| Methode | URL | Controller | Statuscode bei Erfolg |
|---|---|---|---|
| GET | `/api/books` | `index` | 200 |
| POST | `/api/books` | `store` | **201** Created |
| GET | `/api/books/{book}` | `show` | 200 |
| PUT/PATCH | `/api/books/{book}` | `update` | 200 |
| DELETE | `/api/books/{book}` | `destroy` | **204** No Content |

Den Unterordner `Api/` nutzt man, damit Web- und API-Controller sich nicht in die Quere kommen.

## API Resources

Gibst du ein Model direkt zurück, landet **jede** Spalte im JSON – auch interne Notizen. Eine API Resource
ist die Zwischenschicht, die Feld für Feld festlegt, was nach außen geht:

```bash title="Terminal"
php artisan make:resource BookResource
```

```php title="app/Http/Resources/BookResource.php"
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'title' => $this->title,
        'pages' => $this->pages,
        'finished' => (bool) $this->finished,
    ];
}
```

![Das Model enthält alle Spalten, die BookResource wählt aus und wandelt um, die JSON-Antwort enthält nur die freigegebenen Felder](/assets/laravel/api-resource.svg)

Im Controller benutzt du sie so:

```php
return BookResource::collection(Book::orderBy('title')->get()); // Liste
return new BookResource($book);                                 // ein Buch
return $book->toResource();                                     // Kurzform, findet BookResource selbst
```

Laravel verpackt das Ergebnis in einen Schlüssel `data`. Bei `paginate()` kommen `links` und `meta` mit
Seiteninformationen dazu.

> [!MERKSATZ]
> Die Resource ist der **Vertrag** deiner API. Die Datenbank darf sich ändern – solange `toArray()` gleich
> bleibt, merkt die Handy-App nichts davon.

## Statuscodes und Fehler

Eine gute API sagt mit dem [[statuscode|Statuscode]], was passiert ist. Vieles erledigt Laravel selbst:

- Gibst du eine Resource eines **gerade angelegten** Models zurück, setzt Laravel **201**.
- Scheitert die Validierung, kommt **422** mit allen Fehlern als JSON – keine Weiterleitung.
- Route-Model-Binding liefert bei unbekannter ID **404**.
- Für „gelöscht, nichts mehr zu sagen“ gibst du `response()->noContent()` zurück (**204**).

```json title="Antwort bei POST /api/books ohne Titel (422)"
{
  "message": "The title field is required.",
  "errors": { "title": ["The title field is required."] }
}
```

> [!FEHLER]
> **Den Header `Accept: application/json` weglassen.** Für URLs unter `/api` antwortet Laravel zwar immer
> mit JSON. Clients sollten den Header trotzdem schicken – manche Fehlerseiten außerhalb von `/api` kommen
> sonst als HTML zurück, und der Client kann sie nicht lesen.

## Ausblick: Anmeldung mit Sanctum

Im Moment darf jede:r Bücher anlegen und löschen. Sanctum, das `install:api` mitinstalliert hat, schützt
Routen mit [[personal-access-token|Tokens]]:

```php title="routes/api.php"
Route::apiResource('books', BookController::class)->middleware('auth:sanctum');
```

Ein Token erzeugst du für einen User mit `$user->createToken('handy-app')->plainTextToken` (das Model
`User` braucht dafür den Trait `HasApiTokens`). Der Client schickt es bei jeder Anfrage als
[[bearer-token|Bearer-Token]]: `Authorization: Bearer <dein-token>`. Ohne gültigen Token antwortet
Laravel mit **401**. Anmeldung, Passwörter und Rechte behandelt der Kurs „Authentifizierung“ ausführlich.

## Ausblick: Langsame Arbeit in die Queue

Manche Aufgaben dauern: Mails verschicken, Bilder verkleinern, Daten an einen anderen Dienst senden. Die
API soll darauf nicht warten. Laravel legt solche Arbeit als [[queue-job|Job]] in eine
[[task-queue|Warteschlange]], ein eigener Prozess arbeitet sie im Hintergrund ab:

```bash title="Terminal"
php artisan make:job SendReadingReminder
```

```php
SendReadingReminder::dispatch($book);  // im Controller: sofort weiter, Job wartet in der Queue
```

```bash title="Terminal – der Worker"
php artisan queue:work
```

In einem frischen Projekt steht `QUEUE_CONNECTION=database`: Jobs landen in der Tabelle `jobs`, bis
ein [[queue-worker|Worker]] sie holt. Wiederholungen, Fehlerbehandlung und Horizon lernst du im Kurs
„Laravel vertieft“.

> [!PRAXIS]
> Viele Laravel-Projekte bedienen mit derselben Codebasis eine Website **und** eine API für Apps. Models,
> Validierung und Jobs werden geteilt – nur die äußerste Schicht unterscheidet sich: Blade-Views hier,
> API Resources dort.

## Zusammenfassung

- `php artisan install:api` legt `routes/api.php` an; diese Routen haben das Präfix `/api` und keine Session.
- `Route::apiResource()` registriert fünf Routen ohne `create` und `edit`.
- API Resources legen in `toArray()` fest, welche Felder nach außen gehen – Liste mit `::collection()`, einzeln mit `new ...Resource()` oder `toResource()`.
- Statuscodes: 201 beim Anlegen (automatisch), 204 mit `response()->noContent()`, 404 und 422 liefert Laravel selbst.
- Sanctum schützt Routen mit `auth:sanctum` und Bearer-Tokens; langsame Arbeit wandert als Job in die Queue (`dispatch()`, `queue:work`).
