---
title: Eager Loading und große Datenmengen
summary: Das N+1-Problem erkennen und mit with() lösen, Lazy Loading verbieten und Tausende Datensätze speicherschonend mit chunkById() und lazy() verarbeiten.
duration: 25
sources:
  - title: Laravel – Eloquent Relationships, Eager Loading
    url: https://laravel.com/docs/13.x/eloquent-relationships#eager-loading
  - title: Laravel – Eloquent, Chunking Results
    url: https://laravel.com/docs/13.x/eloquent#chunking-results
  - title: Laravel – Eloquent, Configuring Eloquent Strictness
    url: https://laravel.com/docs/13.x/eloquent#configuring-eloquent-strictness
quiz:
  - type: single
    question: Eine Seite zeigt 100 Bestellungen mit dem Namen des Kunden (`$order->customer->name`). Wie viele Abfragen laufen ohne Eager Loading?
    options:
      - "1"
      - "2"
      - "101"
    answer: 2
    explanation: Eine Abfrage für die Bestellungen plus eine pro Bestellung für den Kunden – das ist das N+1-Problem. Mit with('customer') sind es zwei.
  - type: multiple
    question: Welche Aufrufe vermeiden das N+1-Problem beim Zählen und Laden von Beziehungen?
    options:
      - "`Post::with('author')->get()`"
      - "`Author::withCount('posts')->get()`"
      - "`$posts->load('comments')` auf einer bereits geladenen Collection"
      - "`foreach (Author::all() as $a) { $a->posts()->count(); }`"
    answers: [0, 1, 2]
    explanation: with() und load() laden Beziehungen für alle Models in einer Abfrage, withCount() zählt per Unterabfrage. Die Schleife mit posts()->count() schickt pro Autor eine eigene Abfrage.
  - type: cloze
    text: "Mit `Model::prevent___(! app()->isProduction())` wirft Laravel in der Entwicklung eine Exception, sobald eine Beziehung nachgeladen wird. Große Mengen, die du währenddessen änderst, verarbeitest du mit `chunk___(500, …)`."
    blanks:
      - [LazyLoading]
      - [ById]
    explanation: preventLazyLoading macht N+1-Fehler sofort sichtbar. chunkById arbeitet mit der ID statt mit Seitenzahlen und überspringt darum keine Zeilen, wenn du sie änderst.
  - type: find-bug
    question: Der Befehl soll alle inaktiven Nutzer aktivieren, lässt aber jedes zweite Paket aus. Welche Zeile ist das Problem?
    language: php
    code: |
      User::where('active', false)
          ->chunk(100, function ($users) {
              foreach ($users as $user) {
                  $user->update(['active' => true]);
              }
          });
    bug_line: 2
    explanation: chunk() blättert mit OFFSET. Weil die aktualisierten Zeilen aus der Bedingung fallen, verschieben sich die Seiten und Pakete werden übersprungen. chunkById() orientiert sich an der ID und ist hier richtig.
tasks:
  - id: n-plus-1-beheben
    type: terminal
    title: Das N+1-Problem beheben
    description: |
      Im Ordner `n-plus-1-uebung` liegt eine Laravel-Anwendung mit `Author`- und `Post`-Models
      (`Post` gehört zu einem `Author`) und 30 Beiträgen von 5 Autor:innen.

      Die Route `GET /posts` liefert eine Liste „Titel – Autor“ – und schickt dabei 31 Abfragen an die
      Datenbank. Mit `php artisan posts:queries` siehst du die Zahl.

      1. Korrigiere die Route `/posts` in `routes/web.php` mit Eager Loading. Danach sind es höchstens
         zwei Abfragen.
      2. Ergänze die Route `GET /authors`, die für jede Person `name` und `posts_count` als JSON liefert –
         in höchstens **einer** Abfrage (`withCount`).
      3. Schalte im `AppServiceProvider` (`boot()`) Lazy Loading außerhalb der Produktion ab:
         `Model::preventLazyLoading(! app()->isProduction());`

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: n-plus-1-uebung
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
      cat > database/migrations/2026_01_01_000000_create_authors_and_posts_tables.php <<'EOF'
      <?php

      use Illuminate\Database\Migrations\Migration;
      use Illuminate\Database\Schema\Blueprint;
      use Illuminate\Support\Facades\DB;
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
              Schema::create('posts', function (Blueprint $table) {
                  $table->id();
                  $table->foreignId('author_id')->constrained();
                  $table->string('title');
                  $table->timestamps();
              });
              foreach (['Ada', 'Grace', 'Linus', 'Margaret', 'Tim'] as $i => $name) {
                  DB::table('authors')->insert(['id' => $i + 1, 'name' => $name]);
              }
              for ($i = 1; $i <= 30; $i++) {
                  DB::table('posts')->insert(['author_id' => ($i % 5) + 1, 'title' => "Beitrag {$i}"]);
              }
          }

          public function down(): void
          {
              Schema::dropIfExists('posts');
              Schema::dropIfExists('authors');
          }
      };
      EOF
      cat > app/Models/Author.php <<'EOF'
      <?php

      namespace App\Models;

      use Illuminate\Database\Eloquent\Model;
      use Illuminate\Database\Eloquent\Relations\HasMany;

      class Author extends Model
      {
          public function posts(): HasMany
          {
              return $this->hasMany(Post::class);
          }
      }
      EOF
      cat > app/Models/Post.php <<'EOF'
      <?php

      namespace App\Models;

      use Illuminate\Database\Eloquent\Model;
      use Illuminate\Database\Eloquent\Relations\BelongsTo;

      class Post extends Model
      {
          public function author(): BelongsTo
          {
              return $this->belongsTo(Author::class);
          }
      }
      EOF
      cat >> routes/web.php <<'EOF'

      Route::get('/posts', function () {
          return App\Models\Post::all()
              ->map(fn ($post) => $post->title.' – '.$post->author->name);
      });
      EOF
      cat >> routes/console.php <<'EOF'

      Artisan::command('posts:queries {url=/posts}', function (string $url) {
          $count = 0;
          Illuminate\Support\Facades\DB::listen(function () use (&$count) {
              $count++;
          });
          $response = app(Illuminate\Contracts\Http\Kernel::class)->handle(Illuminate\Http\Request::create($url));
          $this->line("Status {$response->getStatusCode()}, Abfragen: {$count}");
      })->purpose('Zählt die Datenbankabfragen einer Route');
      EOF
      sed -i "s/^SESSION_DRIVER=.*/SESSION_DRIVER=array/" .env
      php artisan migrate --force -q
    checks:
      - type: command
        run: |
          php artisan tinker --execute="\$n = 0; DB::listen(function () use (&\$n) { \$n++; }); \$r = app(Illuminate\Contracts\Http\Kernel::class)->handle(Illuminate\Http\Request::create('/posts')); \$d = json_decode(\$r->getContent(), true); echo count(\$d), '|', \$d[0] ?? '', '|', \$n <= 2 ? 'wenig' : 'zu-viele:'.\$n;"
        stdout_matches: "^30\\|Beitrag 1 – Grace\\|wenig\\s*$"
        message: GET /posts schickt noch zu viele Abfragen (oder liefert nicht mehr 30 Einträge „Titel – Autor“). Lade die Beziehung mit Post::with('author').
      - type: command
        run: |
          php artisan tinker --execute="\$n = 0; DB::listen(function () use (&\$n) { \$n++; }); \$r = app(Illuminate\Contracts\Http\Kernel::class)->handle(Illuminate\Http\Request::create('/authors')); \$d = collect(json_decode(\$r->getContent(), true)); echo \$r->getStatusCode(), '|', \$d->firstWhere('name', 'Ada')['posts_count'] ?? 'x', '|', \$n <= 1 ? 'eine' : 'zu-viele:'.\$n;"
        stdout_matches: "^200\\|6\\|eine\\s*$"
        message: GET /authors soll name und posts_count liefern (Ada hat 6 Beiträge) – in einer einzigen Abfrage mit withCount('posts').
      - type: command
        run: |
          php artisan tinker --execute="try { App\Models\Post::take(2)->get()->first()->author; echo 'erlaubt'; } catch (Illuminate\Database\LazyLoadingViolationException \$e) { echo 'verboten'; }"
        stdout_matches: "verboten\\s*$"
        message: Lazy Loading ist noch erlaubt. Rufe Model::preventLazyLoading(! app()->isProduction()) in boot() des AppServiceProvider auf.
    hints:
      - "Ersetze `Post::all()` durch `Post::with('author')->get()`."
      - "Für `/authors`: `Route::get('/authors', fn () => App\\Models\\Author::withCount('posts')->get(['id', 'name']));`"
      - "`Model` importierst du mit `use Illuminate\\Database\\Eloquent\\Model;`. Prüfe danach mit `php artisan posts:queries /posts`."
    solution: |
      ```php title="routes/web.php"
      Route::get('/posts', function () {
          return App\Models\Post::with('author')->get()
              ->map(fn ($post) => $post->title.' – '.$post->author->name);
      });

      Route::get('/authors', fn () => App\Models\Author::withCount('posts')->get(['id', 'name']));
      ```

      ```php title="app/Providers/AppServiceProvider.php"
      public function boot(): void
      {
          Model::preventLazyLoading(! app()->isProduction());
      }
      ```

      ```bash
      php artisan posts:queries /posts     # Status 200, Abfragen: 2
      php artisan posts:queries /authors   # Status 200, Abfragen: 1
      ```
  - id: grosse-mengen
    type: steps
    title: Welche Methode für große Datenmengen?
    description: Die Tabelle `orders` hat zwei Millionen Zeilen. Wähle jeweils das passende Werkzeug.
    steps:
      - situation: Du willst alle Bestellungen eines Jahres in eine CSV-Datei schreiben, ohne etwas zu ändern. Der Code soll wie eine normale foreach-Schleife aussehen.
        question: Was nimmst du?
        options:
          - "`Order::whereYear('created_at', 2025)->get()`"
          - "`Order::whereYear('created_at', 2025)->lazy()`"
          - "`Order::all()->filter(...)`"
        answer: 1
        explanation: lazy() lädt intern in Paketen (Standard 1000), liefert aber eine LazyCollection, über die du wie gewohnt iterierst. get() und all() würden zwei Millionen Models gleichzeitig in den Speicher laden.
      - situation: Ein nächtlicher Befehl setzt alle unbezahlten Bestellungen älter als 30 Tage auf `cancelled`.
        question: Welche Methode verarbeitet sicher in Paketen?
        options:
          - "`chunk(500, …)`"
          - "`chunkById(500, …)`"
          - "`cursor()`"
        answer: 1
        explanation: Die geänderten Zeilen fallen aus der where-Bedingung. chunk() blättert mit OFFSET und würde Zeilen überspringen. chunkById() merkt sich die letzte ID und ist darum sicher.
      - situation: Es geht nur darum, bei allen alten Bestellungen eine Spalte zu setzen. Observer und Model-Events werden nicht gebraucht.
        question: Was ist am schnellsten?
        options:
          - "`Order::where(...)->update(['archived' => true])`"
          - "`Order::where(...)->lazy()->each->update(['archived' => true])`"
        answer: 0
        explanation: Ein einziges UPDATE in der Datenbank ist um Größenordnungen schneller als zwei Millionen einzelne Speichervorgänge. Dafür feuern keine Model-Events – hier ausdrücklich in Ordnung.
      - situation: Du zeigst eine Liste mit 20 Bestellungen pro Seite an.
        question: Was brauchst du?
        options:
          - "`Order::with('customer')->paginate(20)`"
          - "`Order::lazy()`"
          - "`Order::chunkById(20, …)`"
        answer: 0
        explanation: Für die Anzeige brauchst du nur eine Seite – plus Eager Loading für die Kunden. lazy() und chunkById() sind für die Verarbeitung im Hintergrund gedacht.
---
Die Bestellübersicht lädt lokal sofort. In Produktion mit 5 000 Bestellungen braucht sie acht Sekunden.
Der Code sieht harmlos aus – ein `foreach` mit `$order->customer->name`. Schuld ist das häufigste
Performance-Problem in Laravel-Anwendungen: das **N+1-Problem**.

![Lazy Loading mit 1+N Abfragen im Vergleich zu Eager Loading mit 2 Abfragen](/assets/laravel-vertieft/n-plus-1.svg)

## Das N+1-Problem

Beziehungen lädt Eloquent standardmäßig erst, wenn du darauf zugreifst. Das heißt
[[eloquent-lazy-loading|Lazy Loading]]:

```php
$posts = Post::all();                // 1 Abfrage

foreach ($posts as $post) {
    echo $post->author->name;        // je Beitrag 1 weitere Abfrage
}
```

Bei 50 Beiträgen sind das 51 Abfragen – daher der Name [[n-plus-1-problem|N+1-Problem]]. Jede Abfrage
ist schnell, aber jede kostet eine Runde zur Datenbank. Lokal mit zehn Testdaten merkst du nichts, in
Produktion summiert es sich zu Sekunden.

Stell dir vor, du kaufst für ein Rezept ein und fährst für jede Zutat einzeln zum Supermarkt. Besser:
erst die Liste schreiben, dann einmal fahren.

> [!MERKSATZ]
> Steht in einer Schleife `$model->beziehung`, frag dich sofort: Wurde die Beziehung vorher mit
> `with()` geladen?

## Eager Loading mit with() und load()

[[eager-loading|Eager Loading]] ist der Einkaufszettel. Du sagst vorher, welche Beziehungen du brauchst,
und Eloquent lädt sie für alle Models in **einer** zusätzlichen Abfrage:

```php
$posts = Post::with('author')->get();                 // 2 Abfragen, egal wie viele Beiträge
$posts = Post::with(['author', 'comments.user'])->get();   // verschachtelt
$posts = Post::with('author:id,name')->get();         // nur bestimmte Spalten
```

Hast du die Collection schon, lädst du nach – ebenfalls gebündelt:

```php
$posts->load('comments');
```

Brauchst du nur die **Anzahl** verwandter Datensätze, zählt die Datenbank per Unterabfrage:

```php
$authors = Author::withCount('posts')->get();
$authors->first()->posts_count;   // 6
```

> [!FEHLER]
> **`$author->posts()->count()` in einer Schleife.** Mit Klammern baust du jedes Mal eine neue Abfrage.
> Für Listen nimmst du `withCount('posts')` und liest `posts_count`.

## Lazy Loading verbieten

N+1-Fehler schleichen sich unbemerkt ein. Laravel kann sie in der Entwicklung sofort melden:

```php title="app/Providers/AppServiceProvider.php"
use Illuminate\Database\Eloquent\Model;

public function boot(): void
{
    Model::preventLazyLoading(! app()->isProduction());
}
```

Jetzt wirft jeder Zugriff auf eine nicht geladene Beziehung lokal und in Tests eine
`LazyLoadingViolationException`. In Produktion bleibt alles, wie es ist – kein Nutzer sieht einen Fehler.
Noch strenger ist `Model::shouldBeStrict()`, das zusätzlich weitere Nachlässigkeiten meldet.

> [!PRAXIS]
> Viele Teams schalten `preventLazyLoading` am ersten Projekttag ein. Die Exception zeigt Datei und
> Zeile – ein N+1-Fehler wird so schon im Code-Review statt im Monitoring entdeckt.

## Große Datenmengen verarbeiten

`Order::all()` mit zwei Millionen Zeilen sprengt den Arbeitsspeicher. Für die Verarbeitung im Hintergrund
gibt es [[chunking|Chunking]] und [[lazy-collection|Lazy Collections]]:

| Methode | Wie es arbeitet | Wann |
|---|---|---|
| `chunk(500, fn)` | Pakete per OFFSET | nur lesen |
| `chunkById(500, fn)` | Pakete nach ID | lesen **und ändern** |
| `lazy()` / `lazyById()` | Pakete, aber eine einzige Schleife | Exporte, Berichte |
| `cursor()` | ein Model nach dem anderen | sehr wenig Speicher, ohne Eager Loading |

```php
Order::where('status', 'pending')
    ->where('created_at', '<', now()->subDays(30))
    ->chunkById(500, function ($orders) {
        foreach ($orders as $order) {
            $order->update(['status' => 'cancelled']);
        }
    });

foreach (Order::whereYear('created_at', 2025)->lazy() as $order) {
    $csv->insertOne([$order->number, $order->total_cents]);
}
```

Brauchst du keine Model-Events, ist ein einziges `Order::where(...)->update([...])` am schnellsten.

Wie viele Abfragen eine Seite wirklich schickt, siehst du am einfachsten mit `DB::listen()` oder einem
Debug-Werkzeug wie Laravel Telescope. In Tests kannst du die Zahl sogar festschreiben, damit ein späterer
N+1-Fehler sofort auffällt.

## Zusammenfassung

- Lazy Loading in Schleifen erzeugt das N+1-Problem: 1 Abfrage + 1 pro Datensatz.
- `with()` lädt Beziehungen vorab, `load()` lädt nach, `withCount()` zählt per Unterabfrage.
- `Model::preventLazyLoading(! app()->isProduction())` macht N+1-Fehler in Entwicklung und Tests sichtbar.
- Große Mengen: `chunkById()` zum Ändern, `lazy()` für Exporte, `cursor()` für minimalen Speicher.
- Massen-`update()` ist am schnellsten, löst aber keine Model-Events aus.
