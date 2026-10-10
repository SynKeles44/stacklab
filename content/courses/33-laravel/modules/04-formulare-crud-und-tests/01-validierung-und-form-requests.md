---
title: Validierung und Form Requests
summary: Du prüfst Benutzereingaben mit Validierungsregeln, zeigst Fehler im Formular an und lagerst die Regeln in Form Requests aus.
duration: 35
sources:
  - title: Laravel – Validation
    url: https://laravel.com/docs/13.x/validation
  - title: Laravel – Form Request Validation
    url: https://laravel.com/docs/13.x/validation#form-request-validation
  - title: Laravel – CSRF Protection
    url: https://laravel.com/docs/13.x/csrf
quiz:
  - type: single
    question: "Ein Formular schickt `title` leer ab. Der Controller ruft `$request->validate(['title' => 'required'])` auf. Was passiert?"
    options:
      - Der Controller speichert einen leeren Titel.
      - Laravel wirft eine Fehlerseite mit Status 500.
      - Laravel leitet zurück zum Formular, mit Fehlermeldungen und den alten Eingaben.
      - Laravel ignoriert das Feld.
    answer: 2
    explanation: Schlägt eine Regel fehl, bricht Laravel ab, bevor dein restlicher Code läuft. Bei Formularen gibt es eine Weiterleitung zurück, bei JSON-Anfragen eine 422-Antwort.
  - type: multiple
    question: "Welche Werte besteht das Feld `pages` mit den Regeln `['nullable', 'integer', 'min:1']`?"
    options:
      - "Ein leeres Feld"
      - "\"250\""
      - "\"0\""
      - "\"zwölf\""
    answers: [0, 1]
    explanation: nullable erlaubt leere Werte. "250" ist eine ganze Zahl ≥ 1. 0 verletzt min:1, "zwölf" ist keine Zahl.
  - type: find-bug
    question: "Jedes Absenden endet mit „403 This action is unauthorized.“ Welche Zeile ist schuld?"
    language: php
    code: |
      class StoreNoteRequest extends FormRequest
      {
          public function authorize(): bool
          {
              return false;
          }

          public function rules(): array
          {
              return ['title' => ['required', 'max:100']];
          }
      }
    bug_line: 5
    explanation: make:request erzeugt authorize() mit return false. Solange du keine eigene Berechtigungsprüfung brauchst, gibst du true zurück – sonst lehnt Laravel jede Anfrage mit 403 ab.
  - type: cloze
    text: "Nach der Validierung holst du nur die geprüften Felder mit `$request->___()`. Im Formular füllt `___('title')` das Feld nach einem Fehler wieder mit der alten Eingabe."
    blanks:
      - [validated]
      - [old]
    explanation: validated() liefert ausschließlich Felder, für die es Regeln gibt – zusätzliche, eingeschleuste Felder fallen heraus.
tasks:
  - id: notiz-validieren
    type: terminal
    title: Notizen nur mit gültigen Daten
    description: |
      Im Ordner `validierung` liegt eine Laravel-Anwendung mit dem Model `Note` (Spalten `title`, `body`,
      `priority`), dem `NoteController` und dem Formular `notes/create.blade.php`. Leider speichert
      `store()` alles ungeprüft. Das änderst du.

      1. Erzeuge `php artisan make:request StoreNoteRequest`.
      2. Regeln: `title` Pflicht, Text, höchstens 100 Zeichen. `body` optional, Text, höchstens 1000
         Zeichen. `priority` Pflicht, ganze Zahl zwischen 1 und 3.
      3. Achte auf `authorize()`.
      4. Nutze den Form Request in `store()` und speichere nur `validated()`. Danach leitet `store()` wie
         bisher zu `/notes` weiter.
      5. Ergänze im Formular unter jedem Feld die Fehlermeldung (`@error`) und fülle die Felder nach einem
         Fehler mit `old()` wieder.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: validierung
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
      cat > database/migrations/2026_10_01_000001_create_notes_table.php <<'PHP'
      <?php

      use Illuminate\Database\Migrations\Migration;
      use Illuminate\Database\Schema\Blueprint;
      use Illuminate\Support\Facades\Schema;

      return new class extends Migration
      {
          public function up(): void
          {
              Schema::create('notes', function (Blueprint $table) {
                  $table->id();
                  $table->string('title');
                  $table->text('body')->nullable();
                  $table->unsignedTinyInteger('priority')->default(2);
                  $table->timestamps();
              });
          }

          public function down(): void
          {
              Schema::dropIfExists('notes');
          }
      };
      PHP
      cat > app/Models/Note.php <<'PHP'
      <?php

      namespace App\Models;

      use Illuminate\Database\Eloquent\Attributes\Fillable;
      use Illuminate\Database\Eloquent\Model;

      #[Fillable(['title', 'body', 'priority'])]
      class Note extends Model
      {
      }
      PHP
      cat > app/Http/Controllers/NoteController.php <<'PHP'
      <?php

      namespace App\Http\Controllers;

      use App\Models\Note;
      use Illuminate\Http\Request;

      class NoteController extends Controller
      {
          public function index()
          {
              return view('notes.index', ['notes' => Note::latest()->get()]);
          }

          public function create()
          {
              return view('notes.create');
          }

          public function store(Request $request)
          {
              Note::create($request->all());

              return redirect('/notes')->with('status', 'Notiz gespeichert.');
          }
      }
      PHP
      mkdir -p resources/views/notes
      cat > resources/views/notes/index.blade.php <<'BLADE'
      <!DOCTYPE html>
      <html lang="de">
      <body>
          @if (session('status')) <p>{{ session('status') }}</p> @endif
          <a href="/notes/create">Neue Notiz</a>
          <ul>
              @foreach ($notes as $note)
                  <li>{{ $note->title }} (Priorität {{ $note->priority }})</li>
              @endforeach
          </ul>
      </body>
      </html>
      BLADE
      cat > resources/views/notes/create.blade.php <<'BLADE'
      <!DOCTYPE html>
      <html lang="de">
      <body>
          <form method="POST" action="/notes">
              @csrf
              <label>Titel <input name="title"></label>
              <label>Text <textarea name="body"></textarea></label>
              <label>Priorität <input name="priority" type="number"></label>
              <button>Speichern</button>
          </form>
      </body>
      </html>
      BLADE
      cat >> routes/web.php <<'PHP'

      Route::get('/notes', [App\Http\Controllers\NoteController::class, 'index']);
      Route::get('/notes/create', [App\Http\Controllers\NoteController::class, 'create']);
      Route::post('/notes', [App\Http\Controllers\NoteController::class, 'store']);
      PHP
      php artisan migrate --force -q
    checks:
      - type: file_exists
        path: app/Http/Requests/StoreNoteRequest.php
        message: Der Form Request app/Http/Requests/StoreNoteRequest.php fehlt noch.
      - type: file_contains
        path: app/Http/Controllers/NoteController.php
        pattern: "StoreNoteRequest \\$request"
        message: store() nutzt den Form Request noch nicht. Ändere den Parameter auf StoreNoteRequest $request.
      - type: command
        run: |
          f=tests/Feature/StacklabPruefungValidierungTest.php
          cat > "$f" <<'EOF'
          <?php

          use Illuminate\Foundation\Testing\RefreshDatabase;

          uses(RefreshDatabase::class);

          test('stacklab: gueltige notiz', function () {
              $this->post('/notes', ['title' => 'Einkaufen', 'body' => 'Milch', 'priority' => 3, 'id' => 99])
                  ->assertRedirect('/notes');
              $this->assertDatabaseHas('notes', ['title' => 'Einkaufen', 'priority' => 3]);
              $this->assertDatabaseMissing('notes', ['id' => 99]);
              $this->post('/notes', ['title' => 'Ohne Text', 'priority' => 1])->assertSessionHasNoErrors();
          });

          test('stacklab: regeln', function () {
              $this->post('/notes', ['title' => '', 'priority' => 4])->assertSessionHasErrors(['title', 'priority']);
              $this->post('/notes', ['title' => str_repeat('a', 101), 'priority' => 2])->assertSessionHasErrors('title');
              $this->post('/notes', ['title' => 'Lang', 'body' => str_repeat('b', 1001), 'priority' => 2])->assertSessionHasErrors('body');
              $this->post('/notes', ['title' => 'Komma', 'priority' => 'zwei'])->assertSessionHasErrors('priority');
              $this->assertDatabaseCount('notes', 0);
          });
          EOF
          php artisan test "$f" >/dev/null 2>&1; s=$?; rm -f "$f"; exit $s
        message: "Die Regeln greifen noch nicht richtig. Erwartet: title Pflicht (max. 100), body optional (max. 1000), priority Pflicht und ganze Zahl von 1 bis 3; gespeichert wird nur validated(). Prüfe auch authorize()."
      - type: command
        run: |
          f=tests/Feature/StacklabPruefungFormularTest.php
          cat > "$f" <<'EOF'
          <?php

          use Illuminate\Foundation\Testing\RefreshDatabase;

          uses(RefreshDatabase::class);

          test('stacklab: formular zeigt fehler und alte eingaben', function () {
              $this->followingRedirects()
                  ->from('/notes/create')
                  ->post('/notes', ['title' => 'Mein Entwurf', 'priority' => 9])
                  ->assertSee('Mein Entwurf')
                  ->assertSee('priority field must be between 1 and 3');
              $this->followingRedirects()
                  ->from('/notes/create')
                  ->post('/notes', ['title' => '', 'priority' => 2])
                  ->assertSee('title field is required');
          });
          EOF
          php artisan test "$f" >/dev/null 2>&1; s=$?; rm -f "$f"; exit $s
        message: Das Formular zeigt nach einem Fehler noch keine Fehlermeldungen (@error) oder füllt die alte Eingabe nicht wieder ein (value="{{ old('title') }}").
    hints:
      - "Regeln als Arrays: `'priority' => ['required', 'integer', 'between:1,3']`. `authorize()` muss `true` zurückgeben."
      - "Im Controller: `use App\\Http\\Requests\\StoreNoteRequest;` und `Note::create($request->validated());`"
      - "Im Formular: `<input name=\"title\" value=\"{{ old('title') }}\">` und darunter `@error('title') <p>{{ $message }}</p> @enderror`."
    solution: |
      ```php title="app/Http/Requests/StoreNoteRequest.php"
      <?php

      namespace App\Http\Requests;

      use Illuminate\Foundation\Http\FormRequest;

      class StoreNoteRequest extends FormRequest
      {
          public function authorize(): bool
          {
              return true;
          }

          public function rules(): array
          {
              return [
                  'title' => ['required', 'string', 'max:100'],
                  'body' => ['nullable', 'string', 'max:1000'],
                  'priority' => ['required', 'integer', 'between:1,3'],
              ];
          }
      }
      ```

      ```php title="NoteController::store()"
      public function store(StoreNoteRequest $request)
      {
          Note::create($request->validated());

          return redirect('/notes')->with('status', 'Notiz gespeichert.');
      }
      ```

      ```blade title="resources/views/notes/create.blade.php (Formular)"
      <form method="POST" action="/notes">
          @csrf
          <label>Titel <input name="title" value="{{ old('title') }}"></label>
          @error('title') <p>{{ $message }}</p> @enderror

          <label>Text <textarea name="body">{{ old('body') }}</textarea></label>
          @error('body') <p>{{ $message }}</p> @enderror

          <label>Priorität <input name="priority" type="number" value="{{ old('priority') }}"></label>
          @error('priority') <p>{{ $message }}</p> @enderror

          <button>Speichern</button>
      </form>
      ```
  - id: regeln-zuordnen
    type: dragdrop
    title: Welche Regel passt zum Feld?
    description: Ordne jeder Anforderung an ein Formularfeld die Laravel-Regel zu, die sie umsetzt.
    targets:
      - { id: required, label: required }
      - { id: email, label: email }
      - { id: integer, label: integer }
      - { id: max, label: "max:10 (bei Text)" }
      - { id: in, label: "in:neu,gelesen" }
      - { id: date, label: date }
    items:
      - { label: "Der Titel muss ausgefüllt sein", target: required }
      - { label: "Kontaktadresse wie user@example.com", target: email }
      - { label: "Anzahl der Exemplare (ganze Zahl)", target: integer }
      - { label: "Kürzel mit höchstens 10 Zeichen", target: max }
      - { label: "Status ist entweder neu oder gelesen", target: in }
      - { label: "Erscheinungsdatum", target: date }
    hints:
      - Bei Text zählt max die Zeichen, bei Zahlen den Wert.
      - in erlaubt nur die aufgezählten Werte, getrennt durch Kommas.
---
Ein Formular ist eine offene Tür: Jede:r kann hineinschreiben, was er oder sie will – einen leeren Titel,
einen Roman statt einer Zahl oder versteckte Felder, die du nie vorgesehen hast. Bevor deine Anwendung
irgendetwas speichert, muss sie die Eingaben prüfen. Das nennt sich [[validierung|Validierung]], und
Laravel bringt dafür über 90 fertige Regeln mit.

## Formulare in Laravel

Ein Formular schickt seine Daten per POST an eine Route. Zwei Dinge sind in Laravel Pflicht:

```blade title="resources/views/notes/create.blade.php"
<form method="POST" action="{{ route('notes.store') }}">
    @csrf
    <input name="title">
    <button>Speichern</button>
</form>
```

`@csrf` fügt ein verstecktes Feld mit einem Token ein. Es beweist, dass das Formular wirklich von deiner
Seite stammt, und schützt so vor [[csrf|CSRF-Angriffen]]. Fehlt es, antwortet Laravel mit dem Status
**419 Page Expired**.

Im Controller liest du die Daten über das [[request|Request]]-Objekt: `$request->input('title')` oder
`$request->all()`. Ungeprüft speichern solltest du sie aber nie.

## Regeln im Controller

Der schnellste Weg ist `validate()` direkt im Controller:

```php
public function store(Request $request)
{
    $daten = $request->validate([
        'title' => ['required', 'string', 'max:100'],
        'priority' => ['required', 'integer', 'between:1,3'],
    ]);

    Note::create($daten);

    return redirect()->route('notes.index');
}
```

![Ablauf beim Absenden: Validierung erfolgreich, dann speichern und weiterleiten – sonst zurück zum Formular mit Fehlern](/assets/laravel/validierung-ablauf.svg)

Schlägt eine Regel fehl, läuft dein restlicher Code **nicht** weiter. Laravel leitet zurück zum
Formular, legt die Fehlermeldungen in die Session und merkt sich die alten Eingaben. Bei JSON-Anfragen
gibt es stattdessen eine Antwort mit Status **422** und den Fehlern als JSON.

| Regel | Bedeutung |
|---|---|
| `required` | muss vorhanden und nicht leer sein |
| `nullable` | darf leer sein |
| `string`, `integer`, `boolean`, `date` | Datentyp |
| `max:100`, `min:1`, `between:1,3` | Länge bei Text, Wert bei Zahlen |
| `email` | gültige E-Mail-Adresse |
| `in:neu,gelesen` | nur diese Werte |
| `unique:books,isbn` | darf in der Spalte noch nicht vorkommen |

> [!MERKSATZ]
> Validierung gehört **auf den Server**. Prüfungen im Browser (HTML-Attribut `required`, JavaScript) sind
> nur Komfort – sie lassen sich mit einem einzigen `curl`-Befehl umgehen.

## Fehler im Formular anzeigen

Nach der Weiterleitung stehen in jeder View die Fehler in `$errors` bereit. Mit `@error` zeigst du die
Meldung zu einem Feld an, mit `old()` füllst du die Eingabe wieder ein:

```blade
<label>Titel <input name="title" value="{{ old('title') }}"></label>
@error('title')
    <p class="fehler">{{ $message }}</p>
@enderror
```

Ohne `old()` müssten Nutzer:innen nach jedem Tippfehler das ganze Formular neu ausfüllen. Die Meldungen
sind standardmäßig englisch („The title field is required.“). Mit `php artisan lang:publish` legst du
eigene Sprachdateien an und kannst sie übersetzen.

> [!TIPP]
> Für einen Bearbeiten-Dialog kombinierst du beides: `old('title', $note->title)` nimmt die alte
> Eingabe, falls es einen Fehler gab – sonst den gespeicherten Wert.

## Form Requests

Bei vielen Feldern wird der Controller mit Regeln voll. Dann ziehst du sie in einen
[[form-request|Form Request]] um – eine eigene Klasse nur für die Prüfung einer Anfrage:

```bash title="Terminal"
php artisan make:request StoreNoteRequest
```

```php title="app/Http/Requests/StoreNoteRequest.php"
class StoreNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // darf diese Person das überhaupt?
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:100'],
            'body' => ['nullable', 'string', 'max:1000'],
            'priority' => ['required', 'integer', 'between:1,3'],
        ];
    }
}
```

Im Controller tauschst du nur den Typ des Parameters aus. Laravel prüft die Anfrage, **bevor** deine
Methode überhaupt aufgerufen wird:

```php
public function store(StoreNoteRequest $request)
{
    Note::create($request->validated());

    return redirect()->route('notes.index')->with('status', 'Notiz gespeichert.');
}
```

> [!FEHLER]
> **`authorize()` auf `false` lassen.** `make:request` erzeugt die Methode mit `return false;`. Jede
> Anfrage endet dann mit 403. Gib `true` zurück, solange du keine eigene Berechtigungsprüfung brauchst.

## validated() statt all()

`$request->all()` enthält **alles**, was geschickt wurde – auch Felder, die gar nicht im Formular stehen.
`$request->validated()` enthält nur die Felder, für die es Regeln gibt. Zusammen mit `#[Fillable]` im
Model hast du so zwei Sicherheitsnetze gegen eingeschleuste Felder.

> [!PRAXIS]
> In großen Laravel-Projekten haben Controller-Methoden oft nur drei Zeilen: Form Request annehmen,
> Model speichern, weiterleiten. Regeln liegen gebündelt in `app/Http/Requests/` – dort sieht jede:r im
> Team auf einen Blick, was eine Anfrage erfüllen muss.

## Zusammenfassung

- Jedes Formular braucht `@csrf`; ohne Token antwortet Laravel mit 419.
- `$request->validate([...])` prüft Eingaben; bei Fehlern geht es zurück zum Formular (bzw. 422 bei JSON).
- In der View zeigt `@error('feld')` die Meldung, `old('feld')` füllt die alte Eingabe wieder ein.
- Form Requests bündeln Regeln in `rules()` und Berechtigung in `authorize()` – Letzteres muss `true` liefern.
- Gespeichert wird nur `$request->validated()`, niemals ungeprüft `$request->all()`.
