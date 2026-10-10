---
title: Gates und Policies
summary: Wer darf was? Berechtigungen mit Gates für einzelne Aktionen und mit Policies pro Model prüfen – im Controller, an der Route und in Blade.
duration: 20
sources:
  - title: Laravel – Authorization
    url: https://laravel.com/docs/13.x/authorization
quiz:
  - type: single
    question: Ada ist eingeloggt und ruft `PUT /notes/7` auf. Notiz 7 gehört Grace. Die Route nutzt `->can('update', 'note')`. Was passiert?
    options:
      - Die Notiz wird geändert, weil Ada eingeloggt ist
      - Laravel antwortet mit 403, weil die Policy-Methode update false liefert
      - Laravel leitet zur Login-Seite um
    answer: 1
    explanation: Eingeloggt sein (Authentifizierung) heißt noch nicht, alles zu dürfen (Autorisierung). Die Policy prüft den Besitz und lehnt mit 403 ab.
  - type: match
    question: Gate oder Policy?
    pairs:
      - { left: Darf jemand das Admin-Dashboard sehen?, right: Gate }
      - { left: Darf jemand genau diese Rechnung bearbeiten?, right: Policy }
      - { left: Darf jemand Berichte exportieren?, right: Gate }
      - { left: Darf jemand diesen Kommentar löschen?, right: Policy }
    explanation: Gates passen zu Aktionen ohne Model. Policies bündeln alle Regeln rund um ein Model wie Rechnung oder Kommentar.
  - type: cloze
    text: "Laravel findet die Policy für `App\\Models\\Note` automatisch, wenn sie `App\\Policies\\___` heißt. Gibt die Methode `___()` einer Policy `true` zurück, ist jede Aktion erlaubt – praktisch für Admins."
    blanks:
      - [NotePolicy]
      - [before]
    explanation: Die Namenskonvention Model + Policy im Ordner app/Policies reicht für die automatische Erkennung. before() läuft vor jeder Policy-Methode; null heißt „weiter prüfen“.
  - type: find-bug
    question: Admins sollen alles dürfen, alle anderen nur eigene Notizen bearbeiten. Trotzdem darf plötzlich niemand außer Admins etwas. Welche Zeile ist falsch?
    language: php
    code: |
      class NotePolicy
      {
          public function before(User $user, string $ability): ?bool
          {
              return $user->is_admin;
          }

          public function update(User $user, Note $note): bool
          {
              return $user->id === $note->user_id;
          }
      }
    bug_line: 5
    explanation: "Gibt before() false zurück, ist die Aktion sofort verboten – update() läuft nie. Für Nicht-Admins muss before() null liefern, z. B. return $user->is_admin ? true : null;"
tasks:
  - id: notiz-policy
    type: terminal
    title: Eine Policy für Notizen
    description: |
      Im Ordner `policy-uebung` liegt eine Laravel-Anwendung mit dem Model `Note` (Spalten `user_id`,
      `title`) und drei Nutzern: **Ada** (ID 1, Notiz 1), **Grace** (ID 2, Notiz 2) und **Root** (ID 3,
      `is_admin = true`).

      1. Erzeuge `php artisan make:policy NotePolicy --model=Note`.
         - `view`, `update` und `delete`: erlaubt, wenn die Notiz dem Nutzer gehört.
         - `before()`: Admins (`is_admin`) dürfen alles – für alle anderen gibt `before()` `null` zurück.
      2. Definiere im `AppServiceProvider` das Gate `view-reports`: nur Admins.
      3. Lege die Route `GET /notes/{note}` an, die den Titel als JSON liefert
         (`['title' => $note->title]`) und mit `->can('view', 'note')` geschützt ist.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: policy-uebung
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
      sed -i "s/^SESSION_DRIVER=.*/SESSION_DRIVER=array/" .env
      cat > database/migrations/2026_01_01_000000_create_notes_table.php <<'EOF'
      <?php

      use Illuminate\Database\Migrations\Migration;
      use Illuminate\Database\Schema\Blueprint;
      use Illuminate\Support\Facades\DB;
      use Illuminate\Support\Facades\Schema;

      return new class extends Migration
      {
          public function up(): void
          {
              Schema::table('users', function (Blueprint $table) {
                  $table->boolean('is_admin')->default(false);
              });
              Schema::create('notes', function (Blueprint $table) {
                  $table->id();
                  $table->foreignId('user_id')->constrained();
                  $table->string('title');
                  $table->timestamps();
              });
              foreach ([[1, 'Ada', false], [2, 'Grace', false], [3, 'Root', true]] as [$id, $name, $admin]) {
                  DB::table('users')->insert(['id' => $id, 'name' => $name, 'email' => strtolower($name).'@example.com', 'password' => bcrypt('geheim123'), 'is_admin' => $admin]);
              }
              DB::table('notes')->insert([['id' => 1, 'user_id' => 1, 'title' => 'Adas Einkaufsliste'], ['id' => 2, 'user_id' => 2, 'title' => 'Graces Ideen']]);
          }

          public function down(): void
          {
              Schema::dropIfExists('notes');
          }
      };
      EOF
      cat > app/Models/Note.php <<'EOF'
      <?php

      namespace App\Models;

      use Illuminate\Database\Eloquent\Model;

      class Note extends Model
      {
      }
      EOF
      php artisan migrate --force -q
    checks:
      - type: file_exists
        path: app/Policies/NotePolicy.php
        message: Die Datei app/Policies/NotePolicy.php fehlt noch.
      - type: command
        run: |
          php artisan tinker --execute="\$n = App\Models\Note::find(2); \$r = []; foreach ([1, 2, 3] as \$id) { \$u = App\Models\User::find(\$id); \$r[] = (Gate::forUser(\$u)->allows('update', \$n) ? 'ja' : 'nein').(Gate::forUser(\$u)->allows('delete', \$n) ? 'ja' : 'nein'); } echo implode(',', \$r);"
        stdout_matches: "^neinnein,jaja,jaja\\s*$"
        message: "Für Notiz 2 (gehört Grace) sollen update und delete so ausfallen: Ada nein, Grace ja, Root (Admin) ja. Prüfe die Policy-Methoden und before()."
      - type: command
        run: |
          php artisan tinker --execute="echo implode(',', array_map(fn (\$id) => Gate::forUser(App\Models\User::find(\$id))->allows('view-reports') ? 'ja' : 'nein', [1, 3]));"
        stdout_matches: "^nein,ja\\s*$"
        message: Das Gate view-reports soll nur Admins erlauben (Ada nein, Root ja).
      - type: command
        run: |
          php <<'PHP'
          <?php
          require 'vendor/autoload.php';
          $app = require 'bootstrap/app.php';
          $kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
          $kernel->bootstrap();
          $codes = [];
          foreach ([1, 2] as $id) {
              $request = Illuminate\Http\Request::create('/notes/1', 'GET', [], [], [], ['HTTP_ACCEPT' => 'application/json']);
              $app->instance('request', $request);
              $app['auth']->guard('web')->setUser(App\Models\User::find($id));
              $r = $kernel->handle($request);
              $codes[] = $r->getStatusCode().':'.(json_decode($r->getContent(), true)['title'] ?? '-');
          }
          echo implode(',', $codes), "\n";
          PHP
        stdout_matches: "^200:Adas Einkaufsliste,403:-\\s*$"
        message: "GET /notes/1 soll für Ada 200 mit dem Titel liefern und für Grace 403. Schütze die Route mit ->can('view', 'note')."
    hints:
      - "In der Policy: `return $user->id === $note->user_id;` für view, update und delete."
      - "`public function before(User $user, string $ability): ?bool { return $user->is_admin ? true : null; }`"
      - "Gate im Provider (`boot()`): `Gate::define('view-reports', fn (User $user) => (bool) $user->is_admin);` – die Route: `Route::get('/notes/{note}', fn (App\\Models\\Note $note) => ['title' => $note->title])->can('view', 'note');`"
    solution: |
      ```php title="app/Policies/NotePolicy.php"
      class NotePolicy
      {
          public function before(User $user, string $ability): ?bool
          {
              return $user->is_admin ? true : null;
          }

          public function view(User $user, Note $note): bool
          {
              return $user->id === $note->user_id;
          }

          public function update(User $user, Note $note): bool
          {
              return $user->id === $note->user_id;
          }

          public function delete(User $user, Note $note): bool
          {
              return $user->id === $note->user_id;
          }
      }
      ```

      ```php title="app/Providers/AppServiceProvider.php (boot)"
      Gate::define('view-reports', fn (User $user) => (bool) $user->is_admin);
      ```

      ```php title="routes/web.php"
      Route::get('/notes/{note}', fn (App\Models\Note $note) => ['title' => $note->title])
          ->can('view', 'note');
      ```
  - id: mini-gate
    type: code
    language: php
    title: Ein Mini-Gate mit before()
    description: |
      Baue das Grundprinzip von Laravels Gate nach.

      - `define(string $ability, Closure $check)` registriert eine Regel. Die Closure bekommt den Nutzer
        (ein Array wie `['id' => 1, 'admin' => false]`) und weitere Argumente.
      - `before(Closure $check)` registriert eine Vorab-Prüfung. Gibt sie `true` oder `false` zurück, ist
        das die Entscheidung. Gibt sie `null` zurück, wird die eigentliche Regel gefragt.
      - `allows(array $user, string $ability, mixed ...$args): bool` entscheidet. Gibt es keine Regel,
        ist die Antwort `false` (verboten ist der sichere Standard).
    starter: |
      <?php

      class MiniGate
      {
          private array $abilities = [];
          private array $befores = [];

          public function define(string $ability, Closure $check): void
          {
          }

          public function before(Closure $check): void
          {
          }

          public function allows(array $user, string $ability, mixed ...$args): bool
          {
          }
      }
    tests:
      - name: eine Regel entscheidet anhand der Argumente
        code: |
          $g = new MiniGate();
          $g->define('update-note', fn ($user, $note) => $user['id'] === $note['user_id']);
          assert_true($g->allows(['id' => 1], 'update-note', ['user_id' => 1]));
          assert_same(false, $g->allows(['id' => 2], 'update-note', ['user_id' => 1]));
      - name: unbekannte Fähigkeiten sind verboten
        code: |
          $g = new MiniGate();
          assert_same(false, $g->allows(['id' => 1], 'delete-everything'));
      - name: before mit true erlaubt alles
        code: |
          $g = new MiniGate();
          $g->define('update-note', fn ($user, $note) => false);
          $g->before(fn ($user, $ability) => $user['admin'] ? true : null);
          assert_true($g->allows(['id' => 9, 'admin' => true], 'update-note', ['user_id' => 1]));
      - name: before mit null fragt die Regel
        code: |
          $g = new MiniGate();
          $g->define('update-note', fn ($user, $note) => $user['id'] === $note['user_id']);
          $g->before(fn ($user, $ability) => $user['admin'] ? true : null);
          assert_true($g->allows(['id' => 1, 'admin' => false], 'update-note', ['user_id' => 1]));
          assert_same(false, $g->allows(['id' => 2, 'admin' => false], 'update-note', ['user_id' => 1]));
      - name: before mit false verbietet sofort
        code: |
          $g = new MiniGate();
          $g->define('read', fn ($user) => true);
          $g->before(fn ($user, $ability) => $user['banned'] ?? false ? false : null);
          assert_same(false, $g->allows(['id' => 3, 'banned' => true], 'read'));
    hints:
      - "Speichere Regeln in `$this->abilities[$ability] = $check;` und Vorab-Prüfungen mit `$this->befores[] = $check;`."
      - "In `allows()`: Gehe alle `befores` durch. Ist ein Ergebnis nicht `null`, gib es als bool zurück."
      - "Danach: `isset($this->abilities[$ability]) ? (bool) ($this->abilities[$ability])($user, ...$args) : false`."
    solution: |
      <?php

      class MiniGate
      {
          private array $abilities = [];
          private array $befores = [];

          public function define(string $ability, Closure $check): void
          {
              $this->abilities[$ability] = $check;
          }

          public function before(Closure $check): void
          {
              $this->befores[] = $check;
          }

          public function allows(array $user, string $ability, mixed ...$args): bool
          {
              foreach ($this->befores as $before) {
                  $result = $before($user, $ability);
                  if ($result !== null) {
                      return (bool) $result;
                  }
              }

              if (! isset($this->abilities[$ability])) {
                  return false;
              }

              return (bool) ($this->abilities[$ability])($user, ...$args);
          }
      }
---
Ada und Grace nutzen dieselbe Notiz-App. Beide sind eingeloggt – aber Ada darf Graces Notizen weder
lesen noch löschen. Und nur Admins sehen die Umsatzberichte. Die Frage „**Wer darf was?**“ heißt
[[autorisierung|Autorisierung]], und Laravel beantwortet sie mit **Gates** und **Policies**.

## Authentifizierung ist nicht Autorisierung

| Begriff | Frage | Laravel-Werkzeug |
|---|---|---|
| [[authentifizierung|Authentifizierung]] | Wer bist du? | Login, Middleware `auth` |
| Autorisierung | Was darfst du? | Gates, Policies, Middleware `can` |

Die Middleware `auth` lässt jeden eingeloggten Nutzer durch. Ob Ada **diese** Notiz bearbeiten darf, ist
eine zweite Frage – und genau die wird in der Praxis am häufigsten vergessen.

> [!MERKSATZ]
> Prüfe Rechte immer auf dem **Server**. Ein ausgeblendeter Button im Frontend schützt nichts – jeder
> kann die URL direkt aufrufen.

## Gates: Regeln für einzelne Aktionen

Ein [[gate|Gate]] ist eine benannte Regel als Closure. Du definierst sie in `boot()` des
`AppServiceProvider`. Der eingeloggte Nutzer kommt automatisch als erstes Argument:

```php title="app/Providers/AppServiceProvider.php"
use Illuminate\Support\Facades\Gate;

public function boot(): void
{
    Gate::define('view-reports', fn (User $user) => $user->is_admin);
}
```

Geprüft wird an der passenden Stelle:

```php
if (Gate::denies('view-reports')) {
    abort(403);
}

Gate::authorize('view-reports');          // wirft sonst eine Exception → 403
Gate::forUser($user)->allows('view-reports');   // für einen anderen Nutzer
```

Gates passen zu Aktionen **ohne** Model: Dashboard ansehen, Export starten, Einstellungen ändern.
Ist niemand eingeloggt, liefern Gates automatisch `false` – Gäste dürfen also erst einmal nichts. Soll
eine Regel auch für Gäste gelten, schreibst du den Parameter als `?User $user`.

## Policies: alle Regeln eines Models

Geht es um ein bestimmtes Model, sammelt eine [[policy|Policy]] alle Regeln dazu in einer Klasse:

```bash title="Terminal"
php artisan make:policy NotePolicy --model=Note
```

```php title="app/Policies/NotePolicy.php"
class NotePolicy
{
    public function view(User $user, Note $note): bool
    {
        return $user->id === $note->user_id;
    }

    public function update(User $user, Note $note): bool
    {
        return $user->id === $note->user_id;
    }

    public function create(User $user): bool
    {
        return true;
    }
}
```

Laravel findet die Policy automatisch, wenn sie `NotePolicy` heißt und in `app/Policies` liegt. Für
abweichende Namen gibt es das Attribut `#[UsePolicy(NotePolicy::class)]` am Model.

## Prüfen – überall gleich

Policy-Methoden rufst du über ihren Namen auf. Laravel wählt die Policy anhand des Models aus:

```php
$request->user()->can('update', $note);       // im Controller: true/false
Gate::authorize('update', $note);             // wirft → 403
Gate::authorize('create', Note::class);       // ohne Model-Instanz
```

An der Route übernimmt die Middleware `can` die Prüfung, bevor dein Code überhaupt läuft:

```php title="routes/web.php"
Route::put('/notes/{note}', [NoteController::class, 'update'])->can('update', 'note');
```

Und in Blade blendest du Elemente passend ein:

```blade
@can('update', $note)
    <a href="{{ route('notes.edit', $note) }}">Bearbeiten</a>
@endcan
```

> [!FEHLER]
> **`before()` gibt `false` statt `null` zurück.** `return $user->is_admin;` liefert für normale Nutzer
> `false` – damit ist jede Aktion verboten, bevor die eigentliche Regel gefragt wird. Richtig:
> `return $user->is_admin ? true : null;`

## Admins und Sonderfälle

Die Methode `before()` läuft vor jeder anderen Methode der Policy:

```php
public function before(User $user, string $ability): ?bool
{
    return $user->is_admin ? true : null;   // null = normal weiterprüfen
}
```

Für globale Regeln gibt es `Gate::before()` im Provider. Willst du statt 403 lieber verbergen, dass ein
Datensatz existiert, liefert eine Policy `Response::denyAsNotFound()` – dann antwortet Laravel mit 404.

> [!PRAXIS]
> In Mandanten-Software (mehrere Firmen in einer Anwendung) ist die Policy-Prüfung „gehört dieser
> Datensatz zur Firma des Nutzers?“ eine der wichtigsten Sicherheitsregeln. Teams prüfen sie mit Tests,
> in denen Nutzerin A versucht, Daten von Firma B zu öffnen.

## Zusammenfassung

- Authentifizierung fragt „Wer bist du?“, Autorisierung „Was darfst du?“ – Rechte immer serverseitig prüfen.
- **Gates** (`Gate::define`) sind Regeln für Aktionen ohne Model.
- **Policies** bündeln Regeln pro Model; `NotePolicy` in `app/Policies` wird automatisch gefunden.
- Prüfen mit `$user->can()`, `Gate::authorize()`, `->can()` an der Route oder `@can` in Blade.
- `before()` gibt Admins alles frei – und muss für alle anderen `null` liefern.
