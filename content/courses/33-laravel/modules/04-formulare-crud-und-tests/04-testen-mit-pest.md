---
title: Testen mit Pest
summary: Du sicherst deine Anwendung mit Feature-Tests in Pest ab – mit RefreshDatabase, Factories, HTTP-Anfragen im Test und aussagekräftigen Assertions.
duration: 40
sources:
  - title: Laravel – Testing Getting Started
    url: https://laravel.com/docs/13.x/testing
  - title: Laravel – HTTP Tests
    url: https://laravel.com/docs/13.x/http-tests
  - title: Laravel – Database Testing
    url: https://laravel.com/docs/13.x/database-testing
  - title: Pest – Writing Tests
    url: https://pestphp.com/docs/writing-tests
quiz:
  - type: single
    question: Was bewirkt `uses(RefreshDatabase::class);` am Anfang einer Testdatei?
    options:
      - Die Datenbank wird nach allen Tests einmal gelöscht.
      - Jeder Test startet mit frisch migrierter, leerer Datenbank; Änderungen werden danach zurückgerollt.
      - Die Tests benutzen die echte Datenbank der Produktion.
      - Die Factories werden automatisch ausgeführt.
    answer: 1
    explanation: RefreshDatabase migriert einmal und packt jeden Test in eine Transaktion, die danach zurückgerollt wird. So beeinflussen sich Tests nicht gegenseitig.
  - type: match
    question: Ordne jeder Assertion zu, was sie prüft.
    pairs:
      - { left: "assertOk()", right: Status 200 }
      - { left: "assertRedirect('/todos')", right: Weiterleitung zu /todos }
      - { left: "assertSessionHasErrors('title')", right: Validierungsfehler für title }
      - { left: "assertDatabaseHas('todos', [...])", right: Diese Zeile existiert in der Tabelle }
      - { left: "assertJsonPath('data.title', 'Momo')", right: Wert an einer Stelle im JSON }
    explanation: Laravel ergänzt Pest um viele Assertions für Antworten, Session und Datenbank.
  - type: multiple
    question: Was gehört in einen guten Feature-Test für „Aufgabe anlegen“?
    options:
      - Eine erfolgreiche Anfrage mit gültigen Daten und eine Prüfung der Datenbank
      - Eine Anfrage mit ungültigen Daten, die abgelehnt werden muss
      - Ein fester Wert für die ID, z. B. assertDatabaseHas('todos', ['id' => 1])
      - Ein eigener Test pro Fall mit sprechendem Namen
    answers: [0, 1, 3]
    explanation: IDs hängen von der Reihenfolge ab und machen Tests zerbrechlich. Prüfe lieber die fachlichen Werte, etwa den Titel.
  - type: find-bug
    question: Der Test ist immer grün – auch wenn das Löschen kaputt ist. Welche Zeile ist das Problem?
    language: php
    code: |
      test('eine aufgabe kann geloescht werden', function () {
          $todo = Todo::factory()->create();

          $response = $this->delete("/todos/{$todo->id}");

          expect(true)->toBeTrue();
      });
    bug_line: 6
    explanation: Der Test prüft nichts, was mit dem Löschen zu tun hat. Richtig wären $response->assertRedirect('/todos') und $this->assertModelMissing($todo).
tasks:
  - id: todo-tests
    type: terminal
    title: Tests für die Aufgabenliste
    description: |
      Im Ordner `pest-tests` liegt die fertige Aufgabenliste aus der Lektion „CRUD mit
      Resource-Controllern“ (Model `Todo` mit Factory, Resource-Controller, Validierung: `title` Pflicht,
      höchstens 100 Zeichen). Es gibt aber noch keine eigenen Tests. Schreib sie.

      1. Erzeuge `php artisan make:test TodoTest` (landet in `tests/Feature/`).
      2. Aktiviere `RefreshDatabase` für die Datei.
      3. Schreibe **mindestens vier** Tests:
         - Die Liste `/todos` zeigt eine Aufgabe, die du mit der Factory angelegt hast.
         - Ein gültiger POST auf `/todos` legt die Aufgabe an und leitet weiter.
         - Ein POST ohne Titel wird abgelehnt (`assertSessionHasErrors`) und speichert nichts.
         - Ein DELETE löscht die Aufgabe.
      4. `php artisan test` muss grün sein.

      Stacklab prüft am Ende auch, ob deine Tests **Fehler finden**: Es baut absichtlich Bugs in den
      Controller ein und erwartet, dass deine Tests dann rot werden.
      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: pest-tests
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
      perl -0 -i -pe "s/Route::get\('\/todos'.*?todos\.store'\);/Route::resource('todos', TodoController::class);/s" routes/web.php
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
              Todo::create($this->pruefe($request));

              return redirect()->route('todos.index')->with('status', 'Aufgabe gespeichert.');
          }

          public function edit(Todo $todo)
          {
              return view('todos.edit', ['todo' => $todo]);
          }

          public function update(Request $request, Todo $todo)
          {
              $todo->update($this->pruefe($request));

              return redirect()->route('todos.index')->with('status', 'Aufgabe aktualisiert.');
          }

          public function destroy(Todo $todo)
          {
              $todo->delete();

              return redirect()->route('todos.index')->with('status', 'Aufgabe gelöscht.');
          }

          private function pruefe(Request $request): array
          {
              return $request->validate([
                  'title' => ['required', 'string', 'max:100'],
                  'done' => ['boolean'],
              ]);
          }
      }
      PHP
      cat > resources/views/todos/edit.blade.php <<'B'
      <!DOCTYPE html>
      <html lang="de">
      <body>
          <form method="POST" action="{{ route('todos.update', $todo) }}">
              @csrf
              @method('PUT')
              <label>Titel <input name="title" value="{{ old('title', $todo->title) }}"></label>
              @error('title') <p>{{ $message }}</p> @enderror
              <input type="hidden" name="done" value="0">
              <label><input type="checkbox" name="done" value="1" @checked(old('done', $todo->done))> erledigt</label>
              <button>Speichern</button>
          </form>
      </body>
      </html>
      B
      cat > resources/views/todos/index.blade.php <<'B'
      <!DOCTYPE html>
      <html lang="de">
      <body>
          @if (session('status')) <p class="status">{{ session('status') }}</p> @endif
          <a href="{{ route('todos.create') }}">Neue Aufgabe</a>
          <ul>
              @foreach ($todos as $todo)
                  <li>
                      {{ $todo->title }} {{ $todo->done ? '(erledigt)' : '' }}
                      <a href="{{ route('todos.edit', $todo) }}">Bearbeiten</a>
                      <form method="POST" action="{{ route('todos.destroy', $todo) }}">
                          @csrf
                          @method('DELETE')
                          <button>Löschen</button>
                      </form>
                  </li>
              @endforeach
          </ul>
      </body>
      </html>
      B
    checks:
      - type: file_exists
        path: tests/Feature/TodoTest.php
        message: Die Datei tests/Feature/TodoTest.php fehlt noch. Nutze php artisan make:test TodoTest.
      - type: command
        run: grep -cE "^\s*(test|it)\(" tests/Feature/TodoTest.php
        stdout_matches: "^([4-9]|[1-9][0-9]+)$"
        message: In tests/Feature/TodoTest.php stehen noch keine vier Tests (test(...) oder it(...)).
      - type: file_contains
        path: tests/Feature/TodoTest.php
        pattern: "RefreshDatabase"
        message: Nutze RefreshDatabase in TodoTest.php, damit jeder Test mit einer leeren Datenbank startet.
      - type: command
        run: php artisan test >/dev/null 2>&1
        message: "`php artisan test` ist noch nicht grün. Führe den Befehl aus und lies die Fehlermeldung."
      - type: command
        run: |
          c=app/Http/Controllers/TodoController.php; cp "$c" "$c.orig"
          sed -i "s/'required', 'string', 'max:100'/'nullable'/" "$c"
          php artisan test tests/Feature/TodoTest.php >/dev/null 2>&1; s=$?
          mv "$c.orig" "$c"; [ "$s" -ne 0 ]
        message: Deine Tests merken nicht, wenn die Regeln für den Titel fehlen. Prüfe mit assertSessionHasErrors('title'), dass ein leerer Titel abgelehnt wird.
      - type: command
        run: |
          c=app/Http/Controllers/TodoController.php; cp "$c" "$c.orig"
          sed -i 's/\$todo->delete();/\/\/ kaputt/' "$c"
          php artisan test tests/Feature/TodoTest.php >/dev/null 2>&1; s=$?
          mv "$c.orig" "$c"; [ "$s" -ne 0 ]
        message: Deine Tests merken nicht, wenn das Löschen kaputt ist. Prüfe nach dem DELETE mit assertModelMissing($todo) oder assertDatabaseMissing, dass die Aufgabe weg ist.
    hints:
      - "Oben in der Datei: `use App\\Models\\Todo;`, `use Illuminate\\Foundation\\Testing\\RefreshDatabase;` und `uses(RefreshDatabase::class);`"
      - "`$todo = Todo::factory()->create(); $this->get('/todos')->assertOk()->assertSee($todo->title);`"
      - "`$this->post('/todos', ['title' => ''])->assertSessionHasErrors('title'); $this->assertDatabaseCount('todos', 0);`"
    solution: |
      ```php title="tests/Feature/TodoTest.php"
      <?php

      use App\Models\Todo;
      use Illuminate\Foundation\Testing\RefreshDatabase;

      uses(RefreshDatabase::class);

      test('die liste zeigt vorhandene aufgaben', function () {
          $todo = Todo::factory()->create();

          $this->get('/todos')->assertOk()->assertSee($todo->title);
      });

      test('eine gueltige aufgabe wird angelegt', function () {
          $this->post('/todos', ['title' => 'Steuererklärung'])
              ->assertRedirect('/todos');

          $this->assertDatabaseHas('todos', ['title' => 'Steuererklärung', 'done' => false]);
      });

      test('eine aufgabe ohne titel wird abgelehnt', function () {
          $this->post('/todos', ['title' => ''])
              ->assertSessionHasErrors('title');

          $this->assertDatabaseCount('todos', 0);
      });

      test('eine aufgabe kann geloescht werden', function () {
          $todo = Todo::factory()->create();

          $this->delete("/todos/{$todo->id}")->assertRedirect('/todos');

          $this->assertModelMissing($todo);
      });
      ```

      ```bash
      php artisan test
      ```
  - id: aaa-ordnen
    type: order
    title: Ein Test in der richtigen Reihenfolge
    description: |
      Ein guter Test folgt dem Muster **Arrange – Act – Assert**: vorbereiten, ausführen, prüfen. Bringe
      die Zeilen des Tests „eine Aufgabe kann umbenannt werden“ in die richtige Reihenfolge.
    items:
      - "test('eine aufgabe kann umbenannt werden', function () {"
      - "$todo = Todo::factory()->create(['title' => 'Alt']);"
      - "$response = $this->put(\"/todos/{$todo->id}\", ['title' => 'Neu']);"
      - "$response->assertRedirect('/todos');"
      - "expect($todo->fresh()->title)->toBe('Neu');"
      - "});"
    hints:
      - Erst braucht der Test Daten, dann die Anfrage, dann die Prüfungen.
      - "fresh() lädt das Model neu aus der Datenbank – das geht erst nach der Anfrage sinnvoll."
---
Du änderst eine Kleinigkeit im Controller, klickst dich durch zwei Seiten, alles sieht gut aus. Drei Tage
später merkt jemand, dass das Löschen seitdem kaputt ist. Von Hand testet niemand jedes Mal alles.
[[automatisierter-test|Automatisierte Tests]] schon: Sie prüfen in Sekunden die ganze Anwendung – nach
jeder Änderung, vor jedem Deployment.

## Pest in Laravel

Laravel bringt eine fertige Test-Umgebung mit. In diesem Kurs nutzt du [[pest|Pest]], ein Test-Framework
mit kurzer Schreibweise, das auf [[phpunit|PHPUnit]] aufbaut. (Neue Projekte mit `laravel new` fragen
nach Pest oder PHPUnit; in unseren Übungsprojekten ist Pest schon installiert.)

| Ordner | Art | Was wird getestet? |
|---|---|---|
| `tests/Feature/` | [[feature-test|Feature-Test]] | ganze Abläufe: Anfrage rein, Antwort und Datenbank prüfen |
| `tests/Unit/` | [[unit-test|Unit-Test]] | einzelne Klassen oder Funktionen ohne App |

```bash title="Terminal"
php artisan make:test TodoTest   # legt tests/Feature/TodoTest.php an
php artisan test                 # alle Tests
php artisan test --filter=loesch # nur Tests, deren Name „loesch“ enthält
```

Für Webanwendungen sind Feature-Tests am wertvollsten: Sie prüfen, was Nutzer:innen wirklich erleben.

## Der erste Feature-Test

Ein Pest-Test ist eine Funktion mit Beschreibung. Innerhalb von `test()` steht dir mit `$this` die App
zur Verfügung – du kannst Anfragen schicken, ohne Browser und ohne Server:

```php title="tests/Feature/TodoTest.php"
<?php

use App\Models\Todo;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('die liste zeigt vorhandene aufgaben', function () {
    $todo = Todo::factory()->create();                 // Arrange

    $response = $this->get('/todos');                  // Act

    $response->assertOk()->assertSee($todo->title);    // Assert
});
```

Das Muster [[arrange-act-assert|Arrange – Act – Assert]] macht jeden Test lesbar: Daten vorbereiten,
eine Aktion ausführen, das Ergebnis prüfen.

> [!MERKSATZ]
> Ein Test prüft **eine** Sache und heißt so, wie das erwartete Verhalten: „eine aufgabe ohne titel wird
> abgelehnt“. Schlägt er fehl, weißt du sofort, was kaputt ist.

## Die Datenbank im Test

Tests brauchen Daten – aber niemals deine echten. Laravel nutzt im Test eine eigene Datenbank (in
`phpunit.xml` steht SQLite im Arbeitsspeicher). Zwei Werkzeuge kennst du schon:

- `RefreshDatabase` migriert die Datenbank und setzt sie nach **jedem** Test zurück. Kein Test hängt von
  den Resten eines anderen ab.
- Factories erzeugen genau die Daten, die ein Test braucht: `Todo::factory()->create(['done' => true])`.

Für die Prüfung danach gibt es eigene Assertions:

```php
$this->assertDatabaseHas('todos', ['title' => 'Steuererklärung']);
$this->assertDatabaseCount('todos', 0);
$this->assertModelMissing($todo);   // nach dem Löschen
expect($todo->fresh()->done)->toBeTrue(); // Model neu laden und vergleichen
```

## Formulare und Fehler testen

Das Wichtigste sind oft die Fälle, in denen etwas **schiefgehen** muss:

```php
test('eine gueltige aufgabe wird angelegt', function () {
    $this->post('/todos', ['title' => 'Steuererklärung'])
        ->assertRedirect('/todos')
        ->assertSessionHas('status');

    $this->assertDatabaseHas('todos', ['title' => 'Steuererklärung']);
});

test('eine aufgabe ohne titel wird abgelehnt', function () {
    $this->post('/todos', ['title' => ''])
        ->assertSessionHasErrors('title');

    $this->assertDatabaseCount('todos', 0);
});
```

Im Test musst du kein CSRF-Token mitschicken – Laravel schaltet diese Prüfung während der Tests ab.

> [!FEHLER]
> **Tests, die nichts prüfen.** Ein Test ohne passende Assertion ist immer grün, auch wenn die Funktion
> kaputt ist. Prüfe nach jeder Aktion das Ergebnis, das wirklich zählt: Status, Weiterleitung,
> Datenbankinhalt. Mach den Gegentest: Bau absichtlich einen Fehler ein – wird der Test rot?

## APIs testen

Für JSON-APIs gibt es Varianten, die automatisch `Accept: application/json` mitschicken, und passende
Assertions:

```php
test('die api legt ein buch an', function () {
    $this->postJson('/api/books', ['title' => 'Momo', 'author' => 'Michael Ende'])
        ->assertCreated()                          // 201
        ->assertJsonPath('data.title', 'Momo');
});

test('die api lehnt buecher ohne titel ab', function () {
    $this->postJson('/api/books', ['author' => 'Niemand'])
        ->assertUnprocessable()                    // 422
        ->assertJsonValidationErrors('title');
});
```

> [!PRAXIS]
> In Teams laufen alle Tests bei jedem Pull Request automatisch in der CI-Pipeline. Ist ein Test rot, wird
> nicht gemergt. Wer einen Bug behebt, schreibt zuerst einen Test, der ihn zeigt – dann kann derselbe Bug
> nie unbemerkt zurückkommen.

## Zusammenfassung

- Feature-Tests in `tests/Feature/` schicken Anfragen an die App und prüfen Antwort und Datenbank.
- `php artisan make:test` legt eine Testdatei an, `php artisan test` (mit `--filter`) führt Tests aus.
- `RefreshDatabase` gibt jedem Test eine frische Datenbank, Factories liefern die Testdaten.
- Assertions wie `assertOk`, `assertRedirect`, `assertSessionHasErrors`, `assertDatabaseHas` und `assertJsonPath` prüfen das Ergebnis.
- Gute Tests decken auch Fehlerfälle ab und werden rot, wenn der Code kaputtgeht.
