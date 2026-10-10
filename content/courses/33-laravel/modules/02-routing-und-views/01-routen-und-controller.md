---
title: Routen und Controller
summary: Wie Laravel eine URL dem richtigen Code zuordnet – mit Routen, Parametern, Namen und Controller-Klassen.
duration: 35
sources:
  - title: Laravel – Routing
    url: https://laravel.com/docs/13.x/routing
  - title: Laravel – Controllers
    url: https://laravel.com/docs/13.x/controllers
  - title: Laravel – URL Generation
    url: https://laravel.com/docs/13.x/urls
quiz:
  - type: single
    question: "Welche Route passt zur Anfrage `GET /books/42`?"
    options:
      - "Route::post('/books/{book}', ...)"
      - "Route::get('/books/{book}', ...)"
      - "Route::get('/books', ...)"
      - "Route::get('/book/{id}', ...)"
    answer: 1
    explanation: Methode (GET) und Muster (/books/{book}) müssen beide passen. {book} ist ein Platzhalter, der hier den Wert 42 bekommt.
  - type: cloze
    text: "Einer Route gibst du mit `->___('books.index')` einen Namen. Die URL dazu erzeugst du dann mit der Hilfsfunktion `___('books.index')`."
    blanks:
      - [name]
      - [route]
    explanation: Benannte Routen entkoppeln deinen Code von der konkreten URL. Ändert sich die URL, passt route() alle Links automatisch an.
  - type: multiple
    question: Welche Aussagen über Controller stimmen?
    options:
      - Ein Controller bündelt zusammengehörige Aktionen in einer Klasse.
      - Jede öffentliche Methode kann Ziel einer Route sein.
      - Ein Controller muss zwingend HTML zurückgeben.
      - "`php artisan make:controller` legt die Klasse in app/Http/Controllers an."
    answers: [0, 1, 3]
    explanation: Controller-Methoden dürfen Text, Arrays (werden zu JSON), Views oder Weiterleitungen zurückgeben.
  - type: find-bug
    question: "Die Route soll `/greet/Ada` mit `Hallo, Ada!` beantworten. In welcher Zeile liegt der Fehler?"
    language: php
    code: |
      <?php

      use Illuminate\Support\Facades\Route;

      Route::get('/greet/{name}', function (string $vorname) {
          return "Hallo, {$name}!";
      });
    bug_line: 6
    explanation: Der Wert des Platzhalters landet im Parameter $vorname. Die Variable $name gibt es in der Funktion gar nicht. Am einfachsten benennst du Platzhalter und Parameter gleich.
  - type: match
    question: Ordne jedem Befehl oder Aufruf seine Wirkung zu.
    pairs:
      - { left: "php artisan route:list", right: Zeigt alle registrierten Routen }
      - { left: "->whereNumber('id')", right: Platzhalter darf nur Ziffern enthalten }
      - { left: "[BookController::class, 'index']", right: Leitet die Route an eine Controller-Methode }
      - { left: "abort(404)", right: Bricht ab und antwortet mit „Nicht gefunden“ }
    explanation: Diese vier Bausteine brauchst du in fast jeder Route-Datei.
tasks:
  - id: routen-controller
    type: terminal
    title: Routen und ein erster Controller
    description: |
      Im Ordner `routen-controller` liegt eine frische Laravel-Anwendung. Du baust drei Routen – eine mit
      Closure, zwei mit Controller.

      1. `GET /ueber` gibt den Text `Über die Leseliste` zurück. Die Route heißt `about`.
      2. Erzeuge den Controller `GreetingController` mit `php artisan make:controller GreetingController`.
      3. Die Methode `show(string $name)` gibt `Hallo, <name>!` zurück. Registriere sie für
         `GET /hallo/{name}` mit dem Namen `greeting.show`. Der Platzhalter darf nur Buchstaben
         enthalten – `/hallo/123` soll also mit 404 antworten.
      4. Die Methode `index()` gibt einen Link auf Ada zurück. Erzeuge die URL mit `route()`, nicht von
         Hand: `<a href="http://localhost/hallo/Ada">Ada begrüßen</a>`. Route: `GET /hallo`, Name
         `greeting.index`.
      5. Prüfe dein Ergebnis mit `php artisan route:list --except-vendor`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: routen-controller
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
      - type: command
        run: php artisan route:list --json | jq -r '.[].name' | grep -E '^(about|greeting\.show|greeting\.index)$' | sort | tr '\n' ' '
        stdout_matches: "^about greeting\\.index greeting\\.show\\s*$"
        message: Es fehlen benannte Routen. Erwartet werden about, greeting.index und greeting.show.
      - type: command
        run: |
          php -r 'require "vendor/autoload.php"; $app = require "bootstrap/app.php"; $k = $app->make(Illuminate\Contracts\Http\Kernel::class); $r = $k->handle(Illuminate\Http\Request::create("/ueber")); echo $r->getStatusCode(), " ", $r->getContent();'
        stdout_matches: "^200 Über die Leseliste\\s*$"
        message: GET /ueber liefert noch nicht genau „Über die Leseliste“.
      - type: file_exists
        path: app/Http/Controllers/GreetingController.php
        message: Der Controller app/Http/Controllers/GreetingController.php fehlt noch.
      - type: command
        run: |
          php -r 'require "vendor/autoload.php"; $app = require "bootstrap/app.php"; $k = $app->make(Illuminate\Contracts\Http\Kernel::class); $a = $k->handle(Illuminate\Http\Request::create("/hallo/Grace")); $b = $k->handle(Illuminate\Http\Request::create("/hallo/123")); echo $a->getStatusCode(), " ", $a->getContent(), " | ", $b->getStatusCode();'
        stdout_matches: "^200 Hallo, Grace! \\| 404\\s*$"
        message: "/hallo/Grace soll „Hallo, Grace!“ liefern und /hallo/123 mit 404 antworten. Prüfe show() und die Einschränkung whereAlpha('name')."
      - type: command
        run: |
          php -r 'require "vendor/autoload.php"; $app = require "bootstrap/app.php"; $k = $app->make(Illuminate\Contracts\Http\Kernel::class); $r = $k->handle(Illuminate\Http\Request::create("/hallo")); echo $r->getStatusCode(), " ", $r->getContent();'
        stdout_matches: "^200 <a href=\"http://localhost/hallo/Ada\">Ada begrüßen</a>\\s*$"
        message: GET /hallo liefert noch nicht genau den Link <a href="http://localhost/hallo/Ada">Ada begrüßen</a>.
      - type: command
        run: grep -q "route('greeting.show'" app/Http/Controllers/GreetingController.php
        message: Erzeuge die URL in index() mit route('greeting.show', ...) statt sie von Hand zu schreiben.
    hints:
      - "Controller-Routen schreibst du so: `Route::get('/hallo/{name}', [GreetingController::class, 'show'])->name('greeting.show');` – oben in der Datei `use App\\Http\\Controllers\\GreetingController;`."
      - "Die Einschränkung hängst du an die Route: `->whereAlpha('name')`."
      - "`route('greeting.show', ['name' => 'Ada'])` liefert `http://localhost/hallo/Ada`, weil APP_URL auf `http://localhost` steht."
    solution: |
      ```php title="routes/web.php (Ergänzung)"
      use App\Http\Controllers\GreetingController;

      Route::get('/ueber', function () {
          return 'Über die Leseliste';
      })->name('about');

      Route::get('/hallo', [GreetingController::class, 'index'])->name('greeting.index');
      Route::get('/hallo/{name}', [GreetingController::class, 'show'])
          ->whereAlpha('name')
          ->name('greeting.show');
      ```

      ```php title="app/Http/Controllers/GreetingController.php"
      <?php

      namespace App\Http\Controllers;

      class GreetingController extends Controller
      {
          public function index()
          {
              $url = route('greeting.show', ['name' => 'Ada']);

              return '<a href="'.$url.'">Ada begrüßen</a>';
          }

          public function show(string $name)
          {
              return "Hallo, {$name}!";
          }
      }
      ```
  - id: route-zuordnen
    type: dragdrop
    title: Welche Route antwortet?
    description: |
      In `routes/web.php` stehen diese Routen:

      ```php
      Route::get('/books', [BookController::class, 'index']);
      Route::get('/books/{book}', [BookController::class, 'show'])->whereNumber('book');
      Route::post('/books', [BookController::class, 'store']);
      Route::get('/autoren/{name?}', [AuthorController::class, 'show']);
      ```

      Ordne jede Anfrage der Controller-Methode zu, die sie beantwortet – oder „404“, wenn keine Route passt.
    targets:
      - { id: index, label: "BookController@index" }
      - { id: show, label: "BookController@show" }
      - { id: store, label: "BookController@store" }
      - { id: autor, label: "AuthorController@show" }
      - { id: keine, label: "404 – keine Route" }
    items:
      - { label: "GET /books", target: index }
      - { label: "GET /books/7", target: show }
      - { label: "POST /books", target: store }
      - { label: "GET /autoren", target: autor }
      - { label: "GET /autoren/ada", target: autor }
      - { label: "GET /books/dune", target: keine }
      - { label: "DELETE /books/7", target: keine }
    hints:
      - Eine Route passt nur, wenn Methode **und** Muster stimmen.
      - "Das Fragezeichen in `{name?}` macht den Platzhalter optional, `whereNumber` erlaubt nur Ziffern."
---
Ein Besucher tippt `example.com/books/42` in die Adresszeile. Woher weiß deine Anwendung, dass jetzt die
Detailseite von Buch 42 erscheinen soll – und nicht die Startseite? Diese Zuordnung von URL zu Code heißt
[[routing|Routing]], und sie ist der erste Halt jeder Anfrage nach dem Front-Controller.

## Die erste Route

Routen für Webseiten stehen in `routes/web.php`. Jede [[route|Route]] verbindet eine
[[http-methode|HTTP-Methode]] und ein URL-Muster mit Code:

```php title="routes/web.php"
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/ueber', function () {
    return 'Über die Leseliste';
});
```

`Route::get()` reagiert nur auf GET-Anfragen. Für die anderen Methoden gibt es `Route::post()`,
`put()`, `patch()` und `delete()`. Der zweite Parameter ist hier eine [[closure|Closure]], also eine
anonyme Funktion. Was sie zurückgibt, wird zur [[response|Response]]:

| Rückgabe | Was Laravel daraus macht |
|---|---|
| Text (`'Hallo'`) | HTML-Antwort mit Status 200 |
| Array (`['ok' => true]`) | [[json|JSON]]-Antwort |
| `view('welcome')` | gerenderte Blade-Seite |
| `redirect('/books')` | Weiterleitung (Status 302) |

> [!MERKSATZ]
> Eine Route passt nur, wenn **Methode und URL** stimmen. `GET /books` und `POST /books` sind zwei
> verschiedene Routen.

## Parameter in der URL

Oft steckt ein Wert in der URL, etwa eine ID oder ein Name. Dafür setzt du einen Platzhalter in
geschweifte Klammern. Laravel übergibt seinen Wert als Parameter an deine Funktion:

```php
Route::get('/books/{id}', function (string $id) {
    return "Buch Nummer {$id}";
});

Route::get('/autoren/{name?}', function (?string $name = null) {
    return $name ? "Autor:in {$name}" : 'Alle Autor:innen';
});
```

Ein Fragezeichen (`{name?}`) macht den [[pfadparameter|Pfadparameter]] optional – dann braucht der
Funktionsparameter einen Standardwert. Mit Einschränkungen legst du fest, welche Werte erlaubt sind:

```php
Route::get('/books/{id}', ...)->whereNumber('id');   // nur Ziffern
Route::get('/hallo/{name}', ...)->whereAlpha('name'); // nur Buchstaben
```

Passt der Wert nicht, antwortet Laravel automatisch mit 404 – dein Code läuft gar nicht erst.

> [!FEHLER]
> **Platzhalter und Parameter verwechseln.** Laravel ordnet die Werte der Reihe nach zu. Benenne den
> Funktionsparameter trotzdem wie den Platzhalter (`{name}` → `$name`) – sonst sucht man später lange,
> woher ein Wert kommt.

## Benannte Routen

URLs ändern sich. Wenn aus `/ueber` eines Tages `/about` wird, willst du nicht jeden Link im Projekt
suchen. Deshalb gibst du Routen einen Namen und erzeugst URLs mit der Hilfsfunktion `route()`:

```php
Route::get('/ueber', fn () => 'Über die Leseliste')->name('about');

route('about');                           // http://localhost/ueber
route('greeting.show', ['name' => 'Ada']); // http://localhost/hallo/Ada
```

Die Adresse am Anfang kommt aus `APP_URL` in der `.env`. Namen mit Punkt (`books.index`,
`books.show`) sind Konvention: erst die Sache, dann die Aktion.

Alle Routen mit Methode, URL, Name und Ziel zeigt dir Artisan:

```bash title="Terminal"
php artisan route:list --except-vendor
```

```text title="Ausgabe (gekürzt)"
GET|HEAD  /ueber ............ about
GET|HEAD  hallo/{name} ...... greeting.show › GreetingController@show
```

## Controller statt Closures

Closures sind praktisch für zwei Zeilen. Sobald es mehr wird, wandert der Code in einen
[[controller|Controller]] – eine Klasse in `app/Http/Controllers/`, die zusammengehörige Aktionen bündelt:

```bash title="Terminal"
php artisan make:controller GreetingController
```

```php title="app/Http/Controllers/GreetingController.php"
class GreetingController extends Controller
{
    public function show(string $name)
    {
        return "Hallo, {$name}!";
    }
}
```

In der Route verweist du mit einem Array aus Klasse und Methodenname darauf:

```php title="routes/web.php"
use App\Http\Controllers\GreetingController;

Route::get('/hallo/{name}', [GreetingController::class, 'show'])
    ->whereAlpha('name')
    ->name('greeting.show');
```

> [!TIPP]
> `routes/web.php` bleibt so eine gut lesbare Landkarte deiner Anwendung: Jede Zeile sagt, welche URL
> zu welcher Methode führt – die Logik steckt im Controller.

## Ressourcen und Model-Binding

Für eine Sache wie „Bücher“ brauchst du fast immer dieselben Aktionen: auflisten, anzeigen, anlegen,
ändern, löschen. Laravel kennt dafür eine Abkürzung, die du in Modul 4 ausführlich nutzt:

```php
Route::resource('books', BookController::class); // registriert sieben Routen auf einmal
```

Außerdem kann Laravel aus einer ID in der URL direkt ein Datenbank-Objekt machen. Heißt der Platzhalter
`{book}` und der Parameter `Book $book`, lädt Laravel das Buch selbst – oder antwortet mit 404, wenn es
nicht existiert. Dieses [[route-model-binding|Route-Model-Binding]] lernst du kennen, sobald du Models
hast.

> [!PRAXIS]
> In großen Projekten hat `routes/web.php` schnell hunderte Zeilen. Wer einen Fehler auf einer Seite
> sucht, startet mit `php artisan route:list --path=books` und springt von dort direkt in die richtige
> Controller-Methode.

## Zusammenfassung

- Routen in `routes/web.php` verbinden HTTP-Methode und URL-Muster mit Code.
- Platzhalter wie `{name}` landen als Parameter in deiner Funktion; `whereNumber`/`whereAlpha` schränken sie ein.
- Benannte Routen (`->name('about')`) und `route('about')` machen Links unabhängig von der URL.
- Controller bündeln Aktionen in Klassen; die Route verweist mit `[Klasse::class, 'methode']` darauf.
- `php artisan route:list` zeigt dir alle Routen samt Namen und Ziel.
