---
title: CRUD mit Resource-Controllern
summary: Du baust das vollständige Anlegen, Anzeigen, Ändern und Löschen eines Datensatzes – mit Resource-Routen, Route-Model-Binding, Method Spoofing und Flash-Nachrichten.
duration: 35
sources:
  - title: Laravel – Resource Controllers
    url: https://laravel.com/docs/13.x/controllers#resource-controllers
  - title: Laravel – Route Model Binding
    url: https://laravel.com/docs/13.x/routing#route-model-binding
  - title: Laravel – Redirects
    url: https://laravel.com/docs/13.x/redirects
  - title: Laravel – Session (Flash Data)
    url: https://laravel.com/docs/13.x/session#flash-data
quiz:
  - type: single
    question: "Wie viele Routen registriert `Route::resource('books', BookController::class)`?"
    options: ["4", "5", "7", "8"]
    answer: 2
    explanation: index, create, store, show, edit, update und destroy – sieben Routen mit festen Namen wie books.index oder books.update.
  - type: single
    question: "HTML-Formulare kennen nur GET und POST. Wie schickst du trotzdem ein DELETE an `books.destroy`?"
    options:
      - "Mit `<form method=\"DELETE\">`"
      - "Mit `<form method=\"POST\">` und `@method('DELETE')` darin"
      - Gar nicht, Löschen geht nur per API
      - "Mit einem Link `<a href=\"/books/1/delete\">`"
    answer: 1
    explanation: "@method('DELETE') erzeugt ein verstecktes Feld _method. Laravel liest es und behandelt die POST-Anfrage wie DELETE (Method Spoofing). Ein Link wäre gefährlich: GET-Anfragen dürfen nichts ändern."
  - type: match
    question: Ordne jeder Controller-Methode ihre Aufgabe zu.
    pairs:
      - { left: create, right: Formular zum Anlegen anzeigen }
      - { left: store, right: Neuen Datensatz speichern }
      - { left: edit, right: Formular zum Bearbeiten anzeigen }
      - { left: update, right: Änderungen speichern }
      - { left: destroy, right: Datensatz löschen }
    explanation: Zu jedem Formular (create, edit) gehört eine Methode, die es entgegennimmt (store, update).
  - type: find-bug
    question: "Nach dem Speichern sieht man die Erfolgsmeldung nie. Welche Zeile ist schuld?"
    language: php
    code: |
      public function update(UpdateBookRequest $request, Book $book)
      {
          $book->update($request->validated());

          session()->put('status', 'Gespeichert.');

          return view('books.show', ['book' => $book]);
      }
    bug_line: 7
    explanation: Nach einem erfolgreichen POST/PUT leitet man weiter (Post/Redirect/Get), statt direkt eine View zu rendern – sonst schickt ein Neuladen das Formular erneut ab. Richtig ist return redirect()->route('books.show', $book)->with('status', 'Gespeichert.');
  - type: cloze
    text: "In der Methode `show(Book $book)` lädt Laravel das Buch automatisch aus der URL. Das heißt ___-___-Binding. Gibt es die ID nicht, antwortet Laravel mit Status ___."
    blanks:
      - [Route]
      - [Model]
      - ["404"]
    explanation: Platzhaltername ({book}) und Parametername ($book) müssen übereinstimmen, der Typ ist das Model.
tasks:
  - id: todo-crud
    type: terminal
    title: Aufgaben bearbeiten und löschen
    description: |
      Im Ordner `todo-crud` liegt eine kleine Aufgabenliste. Das Model `Todo` (Spalten `title`, `done`),
      der `TodoController` mit `index`, `create` und `store` und die passenden Views sind fertig. Es fehlen
      Bearbeiten und Löschen.

      1. Ersetze in `routes/web.php` die drei einzelnen Routen durch **eine** Resource-Route:
         `Route::resource('todos', TodoController::class);`
      2. `edit(Todo $todo)` zeigt die View `todos.edit` mit einem Formular, das per `@method('PUT')` an
         `todos.update` geht und den aktuellen Titel vorausfüllt.
      3. `update()` validiert wie `store()` (`title` Pflicht, max. 100 Zeichen; `done` Boolean), speichert
         und leitet mit der Flash-Nachricht `Aufgabe aktualisiert.` zu `todos.index`.
      4. `destroy(Todo $todo)` löscht und leitet mit der Flash-Nachricht `Aufgabe gelöscht.` zu
         `todos.index`.
      5. Ergänze in `todos/index.blade.php` bei jeder Aufgabe einen Link „Bearbeiten“ und ein
         Lösch-Formular mit `@method('DELETE')`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: todo-crud
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
      cat > database/migrations/2026_10_01_000001_create_todos_table.php <<'PHP'
      <?php

      use Illuminate\Database\Migrations\Migration;
      use Illuminate\Database\Schema\Blueprint;
      use Illuminate\Support\Facades\Schema;

      return new class extends Migration
      {
          public function up(): void
          {
              Schema::create('todos', function (Blueprint $table) {
                  $table->id();
                  $table->string('title');
                  $table->boolean('done')->default(false);
                  $table->timestamps();
              });
          }

          public function down(): void
          {
              Schema::dropIfExists('todos');
          }
      };
      PHP
      cat > app/Models/Todo.php <<'PHP'
      <?php

      namespace App\Models;

      use Illuminate\Database\Eloquent\Attributes\Fillable;
      use Illuminate\Database\Eloquent\Factories\HasFactory;
      use Illuminate\Database\Eloquent\Model;

      #[Fillable(['title', 'done'])]
      class Todo extends Model
      {
          use HasFactory;

          protected function casts(): array
          {
              return ['done' => 'boolean'];
          }
      }
      PHP
      cat > database/factories/TodoFactory.php <<'PHP'
      <?php

      namespace Database\Factories;

      use Illuminate\Database\Eloquent\Factories\Factory;

      class TodoFactory extends Factory
      {
          public function definition(): array
          {
              return ['title' => fake()->sentence(3), 'done' => false];
          }
      }
      PHP
      cat > app/Http/Controllers/TodoController.php <<'PHP'
      <?php

      namespace App\Http\Controllers;

      use App\Models\Todo;
      use Illuminate\Http\Request;

      class TodoController extends Controller
      {
          public function index()
          {
              return view('todos.index', ['todos' => Todo::orderBy('title')->get()]);
          }

          public function create()
          {
              return view('todos.create');
          }

          public function store(Request $request)
          {
              $daten = $request->validate([
                  'title' => ['required', 'string', 'max:100'],
                  'done' => ['boolean'],
              ]);

              Todo::create($daten);

              return redirect()->route('todos.index')->with('status', 'Aufgabe gespeichert.');
          }
      }
      PHP
      mkdir -p resources/views/todos
      cat > resources/views/todos/index.blade.php <<'BLADE'
      <!DOCTYPE html>
      <html lang="de">
      <body>
          @if (session('status')) <p class="status">{{ session('status') }}</p> @endif
          <a href="{{ route('todos.create') }}">Neue Aufgabe</a>
          <ul>
              @foreach ($todos as $todo)
                  <li>
                      {{ $todo->title }} {{ $todo->done ? '(erledigt)' : '' }}
                  </li>
              @endforeach
          </ul>
      </body>
      </html>
      BLADE
      cat > resources/views/todos/create.blade.php <<'BLADE'
      <!DOCTYPE html>
      <html lang="de">
      <body>
          <form method="POST" action="{{ route('todos.store') }}">
              @csrf
              <label>Titel <input name="title" value="{{ old('title') }}"></label>
              @error('title') <p>{{ $message }}</p> @enderror
              <button>Speichern</button>
          </form>
      </body>
      </html>
      BLADE
      cat >> routes/web.php <<'PHP'

      use App\Http\Controllers\TodoController;

      Route::get('/todos', [TodoController::class, 'index'])->name('todos.index');
      Route::get('/todos/create', [TodoController::class, 'create'])->name('todos.create');
      Route::post('/todos', [TodoController::class, 'store'])->name('todos.store');
      PHP
      php artisan migrate --force -q
    checks:
      - type: command
        run: php artisan route:list --json | jq -r '.[].name' | grep -cE '^todos\.(index|create|store|show|edit|update|destroy)$'
        stdout_matches: "^7$"
        message: Es sind noch nicht alle sieben Resource-Routen registriert. Nutze Route::resource('todos', TodoController::class).
      - type: command
        run: |
          f=tests/Feature/StacklabPruefungTodoTest.php
          cat > "$f" <<'EOF'
          <?php

          use App\Models\Todo;
          use Illuminate\Foundation\Testing\RefreshDatabase;

          uses(RefreshDatabase::class);

          test('stacklab: bearbeiten', function () {
              $todo = Todo::create(['title' => 'Müll rausbringen']);
              $this->get("/todos/{$todo->id}/edit")->assertOk()
                  ->assertSee('Müll rausbringen')->assertSee('name="_method"', false)->assertSee('value="PUT"', false);
              $this->put("/todos/{$todo->id}", ['title' => 'Altpapier rausbringen', 'done' => 1])
                  ->assertRedirect('/todos')->assertSessionHas('status', 'Aufgabe aktualisiert.');
              expect($todo->fresh()->title)->toBe('Altpapier rausbringen');
              expect($todo->fresh()->done)->toBeTrue();
              $this->put("/todos/{$todo->id}", ['title' => ''])->assertSessionHasErrors('title');
              $this->get('/todos/9999/edit')->assertNotFound();
          });

          test('stacklab: loeschen und liste', function () {
              $todo = Todo::create(['title' => 'Blumen gießen']);
              $this->get('/todos')->assertSee(route('todos.edit', $todo), false)->assertSee('value="DELETE"', false);
              $this->delete("/todos/{$todo->id}")->assertRedirect('/todos')->assertSessionHas('status', 'Aufgabe gelöscht.');
              $this->assertModelMissing($todo);
          });
          EOF
          php artisan test "$f" >/dev/null 2>&1; s=$?; rm -f "$f"; exit $s
        message: "Bearbeiten oder Löschen klappt noch nicht vollständig. Geprüft wird: GET /todos/{id}/edit (Formular mit @method('PUT') und altem Titel, 404 bei unbekannter ID), PUT /todos/{id} (Validierung, Speichern, Weiterleitung mit „Aufgabe aktualisiert.“), DELETE /todos/{id} (Weiterleitung mit „Aufgabe gelöscht.“) und die Liste mit Bearbeiten-Link und Lösch-Formular."
    hints:
      - "`php artisan route:list --path=todos` zeigt dir Namen und URLs der sieben Routen."
      - "Im Formular: `<form method=\"POST\" action=\"{{ route('todos.update', $todo) }}\"> @csrf @method('PUT') ...` – Wert: `value=\"{{ old('title', $todo->title) }}\"`."
      - "`$todo->update($daten);` bzw. `$todo->delete();` und danach `return redirect()->route('todos.index')->with('status', '...');`"
    solution: |
      ```php title="routes/web.php (statt der drei Routen)"
      Route::resource('todos', TodoController::class);
      ```

      ```php title="TodoController (Ergänzung)"
      public function edit(Todo $todo)
      {
          return view('todos.edit', ['todo' => $todo]);
      }

      public function update(Request $request, Todo $todo)
      {
          $daten = $request->validate([
              'title' => ['required', 'string', 'max:100'],
              'done' => ['boolean'],
          ]);

          $todo->update($daten);

          return redirect()->route('todos.index')->with('status', 'Aufgabe aktualisiert.');
      }

      public function destroy(Todo $todo)
      {
          $todo->delete();

          return redirect()->route('todos.index')->with('status', 'Aufgabe gelöscht.');
      }
      ```

      ```blade title="resources/views/todos/edit.blade.php"
      <form method="POST" action="{{ route('todos.update', $todo) }}">
          @csrf
          @method('PUT')
          <label>Titel <input name="title" value="{{ old('title', $todo->title) }}"></label>
          @error('title') <p>{{ $message }}</p> @enderror
          <input type="hidden" name="done" value="0">
          <label><input type="checkbox" name="done" value="1" @checked(old('done', $todo->done))> erledigt</label>
          <button>Speichern</button>
      </form>
      ```

      ```blade title="resources/views/todos/index.blade.php (in der Schleife)"
      <li>
          {{ $todo->title }} {{ $todo->done ? '(erledigt)' : '' }}
          <a href="{{ route('todos.edit', $todo) }}">Bearbeiten</a>
          <form method="POST" action="{{ route('todos.destroy', $todo) }}">
              @csrf
              @method('DELETE')
              <button>Löschen</button>
          </form>
      </li>
      ```
  - id: resource-routen
    type: dragdrop
    title: Die sieben Resource-Routen
    description: "`Route::resource('books', BookController::class)` hat sieben Routen registriert. Ordne jede Anfrage der Controller-Methode zu, die sie bearbeitet."
    targets:
      - { id: index, label: index }
      - { id: create, label: create }
      - { id: store, label: store }
      - { id: show, label: show }
      - { id: edit, label: edit }
      - { id: update, label: update }
      - { id: destroy, label: destroy }
    items:
      - { label: "GET /books", target: index }
      - { label: "GET /books/create", target: create }
      - { label: "POST /books", target: store }
      - { label: "GET /books/7", target: show }
      - { label: "GET /books/7/edit", target: edit }
      - { label: "PUT /books/7", target: update }
      - { label: "DELETE /books/7", target: destroy }
    hints:
      - Formulare anzeigen sind GET-Anfragen, Daten ändern nie.
      - PUT und PATCH führen beide zu update.
---
Du kannst Daten anzeigen, und du kannst Eingaben prüfen. Jetzt fügst du alles zu dem Muster zusammen,
das in fast jeder Webanwendung steckt: [[crud|CRUD]] – Create, Read, Update, Delete. Laravel hat dafür
feste Konventionen. Wer sie kennt, baut eine komplette Verwaltung in wenigen Minuten – und findet sich in
jedem fremden Projekt sofort zurecht.

## Resource-Routen

Statt sieben einzelne Routen zu schreiben, registrierst du sie mit einer Zeile:

```php title="routes/web.php"
Route::resource('books', BookController::class);
```

| Methode | URL | Controller | Name | Zweck |
|---|---|---|---|---|
| GET | `/books` | `index` | `books.index` | Liste |
| GET | `/books/create` | `create` | `books.create` | Formular „Neu“ |
| POST | `/books` | `store` | `books.store` | speichern |
| GET | `/books/{book}` | `show` | `books.show` | Detailseite |
| GET | `/books/{book}/edit` | `edit` | `books.edit` | Formular „Bearbeiten“ |
| PUT/PATCH | `/books/{book}` | `update` | `books.update` | Änderungen speichern |
| DELETE | `/books/{book}` | `destroy` | `books.destroy` | löschen |

Den passenden [[resource-controller|Resource-Controller]] mit allen sieben leeren Methoden erzeugt
Artisan: `php artisan make:controller BookController --resource --model=Book`. Brauchst du nicht alle
Routen, schränkst du sie ein: `Route::resource('books', BookController::class)->only(['index', 'show']);`

> [!MERKSATZ]
> Gleiche URL, andere Methode, andere Aktion: `GET /books/7` zeigt, `PUT /books/7` ändert,
> `DELETE /books/7` löscht.

## Route-Model-Binding

In allen Methoden mit `{book}` in der URL bekommst du direkt das Model:

```php
public function show(Book $book)
{
    return view('books.show', ['book' => $book]);
}
```

Laravel sieht den Typ `Book`, nimmt den Wert aus der URL und ruft `Book::findOrFail()` auf. Gibt es das Buch
nicht, antwortet Laravel mit 404 – ohne eine Zeile Code von dir. Wichtig ist nur, dass Platzhalter und
Parameter gleich heißen (`{book}` → `$book`).

## Anlegen: create und store

`create()` zeigt das Formular, `store()` nimmt es entgegen:

```php
public function create()
{
    return view('books.create');
}

public function store(StoreBookRequest $request)
{
    $book = Book::create($request->validated());

    return redirect()->route('books.show', $book)->with('status', 'Buch gespeichert.');
}
```

Nach dem Speichern wird **weitergeleitet**, nicht direkt eine Seite gerendert. Dieses Muster heißt
Post/Redirect/Get: Lädt jemand die Seite danach neu, wird das Formular nicht ein zweites Mal abgeschickt.

`with('status', ...)` legt eine [[flash-nachricht|Flash-Nachricht]] in die Session. Sie überlebt genau
eine weitere Anfrage – perfekt für „Gespeichert“-Hinweise im Layout:

```blade
@if (session('status'))
    <p class="status">{{ session('status') }}</p>
@endif
```

## Ändern: edit und update

HTML-Formulare können nur GET und POST. Für PUT und DELETE nutzt Laravel [[method-spoofing|Method Spoofing]]:
Du schickst POST und verrätst die eigentliche Methode in einem versteckten Feld.

```blade title="resources/views/books/edit.blade.php"
<form method="POST" action="{{ route('books.update', $book) }}">
    @csrf
    @method('PUT')
    <input name="title" value="{{ old('title', $book->title) }}">
    <button>Speichern</button>
</form>
```

```php
public function update(UpdateBookRequest $request, Book $book)
{
    $book->update($request->validated());

    return redirect()->route('books.show', $book)->with('status', 'Buch aktualisiert.');
}
```

> [!FEHLER]
> **`@method('PUT')` vergessen.** Das Formular landet dann als POST auf `/books/7` – dafür gibt es keine
> Route, Laravel antwortet mit „405 Method Not Allowed“. Fehlt `@csrf`, gibt es „419 Page Expired“.

## Löschen: destroy

Löschen ist eine Änderung und gehört deshalb **nie** hinter einen normalen Link. Ein kleines Formular
reicht:

```blade
<form method="POST" action="{{ route('books.destroy', $book) }}">
    @csrf
    @method('DELETE')
    <button>Löschen</button>
</form>
```

```php
public function destroy(Book $book)
{
    $book->delete();

    return redirect()->route('books.index')->with('status', 'Buch gelöscht.');
}
```

> [!PRAXIS]
> Wer darf eigentlich bearbeiten und löschen? Im Moment jede:r. In echten Anwendungen prüfst du das mit
> Anmeldung und Policies – beides behandelt der Kurs „Authentifizierung“. Das CRUD-Gerüst aus dieser
> Lektion bleibt dabei gleich, es kommen nur Prüfungen hinzu.

## Zusammenfassung

- `Route::resource()` registriert sieben Routen mit festen Namen (`books.index` … `books.destroy`).
- Route-Model-Binding lädt das Model aus der URL und antwortet bei unbekannter ID mit 404.
- Nach `store`, `update` und `destroy` leitest du weiter (Post/Redirect/Get) – mit Flash-Nachricht per `with()`.
- PUT und DELETE schickst du aus Formularen mit `@method('PUT')` bzw. `@method('DELETE')` und immer mit `@csrf`.
- Löschen läuft über ein Formular, nie über einen einfachen Link.
