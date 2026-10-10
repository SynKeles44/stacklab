---
title: Views mit Blade
summary: Du erzeugst HTML mit Blade – Daten sicher ausgeben, Schleifen und Bedingungen, Layouts als Komponenten.
duration: 40
sources:
  - title: Laravel – Views
    url: https://laravel.com/docs/13.x/views
  - title: Laravel – Blade Templates
    url: https://laravel.com/docs/13.x/blade
  - title: OWASP – Cross Site Scripting (XSS)
    url: https://owasp.org/www-community/attacks/xss/
quiz:
  - type: single
    question: "Ein Buchtitel lautet `<b>Fett</b>`. Was steht im HTML, wenn du ihn mit `{{ $title }}` ausgibst?"
    options:
      - "<b>Fett</b> – der Text erscheint fett"
      - "&lt;b&gt;Fett&lt;/b&gt; – der Text erscheint mit sichtbaren Spitzklammern"
      - Nichts, Blade entfernt HTML-Tags
      - Eine Fehlermeldung
    answer: 1
    explanation: "{{ }} maskiert Sonderzeichen mit htmlspecialchars(). Der Browser zeigt die Zeichen an, statt sie als HTML auszuführen – das schützt vor XSS."
  - type: cloze
    text: "Die View `resources/views/books/show.blade.php` gibst du im Controller mit `return view('___');` zurück. Eine Liste, die auch leer sein kann, durchläufst du am besten mit `@___ ... @empty ... @endforelse`."
    blanks:
      - [books.show]
      - [forelse]
    explanation: Ordner werden im View-Namen durch Punkte getrennt, die Endung .blade.php lässt du weg. @forelse hat einen eingebauten @empty-Zweig.
  - type: match
    question: Ordne jeder Blade-Schreibweise ihre Bedeutung zu.
    pairs:
      - { left: "{{ $wert }}", right: Wert HTML-sicher ausgeben }
      - { left: "{!! $html !!}", right: "Wert ungeprüft als HTML ausgeben" }
      - { left: "{{-- Notiz --}}", right: "Kommentar, der nicht im HTML landet" }
      - { left: "<x-layout>", right: Die Komponente components/layout.blade.php einbinden }
    explanation: "{!! !!} nur für HTML, das du selbst erzeugt hast – niemals für Benutzereingaben."
  - type: find-bug
    question: Die Seite soll die Bücher im gemeinsamen Layout zeigen, doch die Liste fehlt komplett. Welche Zeile ist schuld?
    language: php
    code: |
      {{-- resources/views/components/layout.blade.php --}}
      <html>
      <body>
          <h1>{{ $title }}</h1>
          <main></main>
      </body>
      </html>
    bug_line: 5
    explanation: "Der Inhalt zwischen <x-layout> und </x-layout> landet in der Variablen $slot. Das Layout muss ihn ausgeben: <main>{{ $slot }}</main>."
tasks:
  - id: blade-layout
    type: terminal
    title: Eine Bücherliste mit Layout
    description: |
      Im Ordner `blade-views` liegt eine Laravel-Anwendung. Die Routen `/books` und `/books/leer`
      sind schon da (schau in `routes/web.php`): Sie übergeben ein Array `$books` an die View
      `books.index` – einmal mit drei Büchern, einmal leer. Die Views fehlen noch.

      1. Lege die Layout-Komponente `resources/views/components/layout.blade.php` an. Sie hat die
         Eigenschaft `title` mit dem Standardwert `Leseliste` und gibt sie im `<title>` aus:
         `<title>{{ $title }}</title>`. Den eigentlichen Inhalt gibt sie mit `{{ $slot }}` aus.
      2. Lege `resources/views/books/index.blade.php` an. Sie nutzt `<x-layout title="Bücher">`.
      3. Gib jedes Buch als `<li>Titel (Seiten Seiten)</li>` aus, z. B. `<li>Dune (412 Seiten)</li>`.
      4. Ist die Liste leer, erscheint `<p>Noch keine Bücher.</p>`.
      5. Eines der Bücher hat einen gefährlichen Titel. Er darf **nicht** als HTML ausgeführt werden.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: blade-views
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
      cat >> routes/web.php <<'PHP'

      $books = [
          ['title' => 'Dune', 'pages' => 412],
          ['title' => 'Momo', 'pages' => 304],
          ['title' => '<script>alert("hallo")</script>', 'pages' => 1],
      ];

      Route::get('/books', fn () => view('books.index', ['books' => $books]));
      Route::get('/books/leer', fn () => view('books.index', ['books' => []]));
      PHP
    checks:
      - type: file_exists
        path: resources/views/components/layout.blade.php
        message: Die Layout-Komponente resources/views/components/layout.blade.php fehlt noch.
      - type: file_contains
        path: resources/views/books/index.blade.php
        pattern: "<x-layout"
        message: books/index.blade.php soll das Layout mit <x-layout title="Bücher"> nutzen.
      - type: command
        run: |
          php -r 'require "vendor/autoload.php"; $app = require "bootstrap/app.php"; $k = $app->make(Illuminate\Contracts\Http\Kernel::class); $h = $k->handle(Illuminate\Http\Request::create("/books"))->getContent(); echo str_contains($h, "<title>Bücher</title>") ? "titel " : "-", str_contains($h, "<li>Dune (412 Seiten)</li>") ? "liste " : "-", str_contains($h, "<li>Momo (304 Seiten)</li>") ? "momo" : "-";'
        stdout_equals: titel liste momo
        message: "/books zeigt noch nicht den Titel <title>Bücher</title> und die Einträge wie <li>Dune (412 Seiten)</li>."
      - type: command
        run: |
          php -r 'require "vendor/autoload.php"; $app = require "bootstrap/app.php"; $k = $app->make(Illuminate\Contracts\Http\Kernel::class); $h = $k->handle(Illuminate\Http\Request::create("/books"))->getContent(); echo (str_contains($h, "&lt;script&gt;") && ! str_contains($h, "<script>alert")) ? "sicher" : "unsicher";'
        stdout_equals: sicher
        message: Der gefährliche Buchtitel wird noch als HTML ausgeführt. Gib Titel mit {{ }} aus, nicht mit {!! !!}.
      - type: command
        run: |
          php -r 'require "vendor/autoload.php"; $app = require "bootstrap/app.php"; $k = $app->make(Illuminate\Contracts\Http\Kernel::class); $h = $k->handle(Illuminate\Http\Request::create("/books/leer"))->getContent(); echo str_contains($h, "<p>Noch keine Bücher.</p>") && ! str_contains($h, "<li>") ? "ok" : "fehlt";'
        stdout_equals: ok
        message: /books/leer zeigt noch nicht <p>Noch keine Bücher.</p>. Nutze @forelse mit einem @empty-Zweig.
      - type: command
        run: |
          php -r 'require "vendor/autoload.php"; $app = require "bootstrap/app.php"; $app->make(Illuminate\Contracts\Http\Kernel::class)->bootstrap(); echo Illuminate\Support\Facades\Blade::render("<x-layout>Inhalt</x-layout>");' | tr -d '\n'
        stdout_matches: "<title>Leseliste</title>.*Inhalt"
        message: Ohne Angabe soll das Layout den Titel „Leseliste“ zeigen – und den Inhalt über {{ $slot }} ausgeben. Nutze @props(['title' => 'Leseliste']).
    hints:
      - "In der ersten Zeile der Komponente legst du die Eigenschaft fest: `@props(['title' => 'Leseliste'])`."
      - "`@forelse ($books as $book) <li>{{ $book['title'] }} ({{ $book['pages'] }} Seiten)</li> @empty <p>Noch keine Bücher.</p> @endforelse`"
      - Achte auf exakt ein Leerzeichen vor der öffnenden Klammer und das Wort „Seiten“ in der Klammer.
    solution: |
      ```blade title="resources/views/components/layout.blade.php"
      @props(['title' => 'Leseliste'])
      <!DOCTYPE html>
      <html lang="de">
      <head>
          <meta charset="utf-8">
          <title>{{ $title }}</title>
      </head>
      <body>
          <main>{{ $slot }}</main>
      </body>
      </html>
      ```

      ```blade title="resources/views/books/index.blade.php"
      <x-layout title="Bücher">
          <h1>Bücher</h1>
          <ul>
              @forelse ($books as $book)
                  <li>{{ $book['title'] }} ({{ $book['pages'] }} Seiten)</li>
              @empty
                  <p>Noch keine Bücher.</p>
              @endforelse
          </ul>
      </x-layout>
      ```
  - id: html-escape
    type: code
    language: php
    title: Was {{ }} für dich erledigt
    description: |
      Blade schützt dich bei `{{ $wert }}` vor [XSS](https://owasp.org/www-community/attacks/xss/), indem es
      Sonderzeichen maskiert. Baue das Prinzip in klein nach: Schreibe `renderListe(array $titel): string`.

      - Für jeden Titel entsteht `<li>…</li>`, alle hintereinander ohne Leerzeichen, umschlossen von `<ul>…</ul>`.
      - Jeder Titel wird mit `htmlspecialchars()` maskiert (so wie Blade es tut).
      - Ist das Array leer, gibt die Funktion `<p>Noch keine Bücher.</p>` zurück – wie ein `@empty`-Zweig.
    starter: |
      <?php

      function renderListe(array $titel): string
      {
          $html = '<ul>';

          foreach ($titel as $t) {
              $html .= '<li>' . $t . '</li>';
          }

          return $html . '</ul>';
      }
    tests:
      - name: erzeugt eine Liste
        code: |
          assert_same('<ul><li>Dune</li><li>Momo</li></ul>', renderListe(['Dune', 'Momo']));
      - name: maskiert gefährliche Zeichen
        code: |
          assert_same('<ul><li>&lt;b&gt;Fett&lt;/b&gt;</li></ul>', renderListe(['<b>Fett</b>']));
      - name: maskiert Anführungszeichen und &
        code: |
          assert_same('<ul><li>Tom &amp; Jerry &quot;Live&quot;</li></ul>', renderListe(['Tom & Jerry "Live"']));
      - name: leere Liste
        code: |
          assert_same('<p>Noch keine Bücher.</p>', renderListe([]));
    hints:
      - "`htmlspecialchars($t)` wandelt `<`, `>`, `&` und `\"` in sichere Entitäten um."
      - "Prüfe am Anfang mit `if ($titel === [])`, ob die Liste leer ist."
    solution: |
      <?php

      function renderListe(array $titel): string
      {
          if ($titel === []) {
              return '<p>Noch keine Bücher.</p>';
          }

          $html = '<ul>';

          foreach ($titel as $t) {
              $html .= '<li>' . htmlspecialchars($t) . '</li>';
          }

          return $html . '</ul>';
      }
---
Deine Controller geben bisher nackten Text zurück. Echte Seiten brauchen aber HTML – mit Kopfbereich,
Navigation und Fußzeile auf jeder Seite. Würdest du das HTML als String im Controller zusammenkleben,
hättest du schnell unlesbaren Code und dazu Sicherheitslücken. Dafür gibt es [[view|Views]] und die
Template-Sprache [[blade|Blade]].

## Views zurückgeben

Eine View ist eine Datei in `resources/views/` mit der Endung `.blade.php`. Der Controller wählt sie
mit der Hilfsfunktion `view()` aus und übergibt Daten als Array:

```php title="app/Http/Controllers/BookController.php"
public function index()
{
    $books = [
        ['title' => 'Dune', 'pages' => 412],
        ['title' => 'Momo', 'pages' => 304],
    ];

    return view('books.index', ['books' => $books]);
}
```

Der Name `books.index` steht für `resources/views/books/index.blade.php` – Punkte trennen Ordner, die
Endung lässt du weg. Jeder Schlüssel im Array wird in der View zu einer Variablen: aus `'books'` wird
`$books`.

> [!MERKSATZ]
> Der Controller entscheidet, **welche** Daten angezeigt werden. Die View entscheidet nur, **wie** sie
> aussehen. Datenbankabfragen haben in einer View nichts zu suchen.

## Daten sicher ausgeben

Mit doppelten geschweiften Klammern gibst du einen Wert aus:

```blade title="resources/views/books/show.blade.php"
<h1>{{ $book['title'] }}</h1>
<p>{{ $book['pages'] }} Seiten</p>
```

Blade schickt jeden Wert dabei durch `htmlspecialchars()`. Aus `<script>` wird `&lt;script&gt;` – der
Browser zeigt die Zeichen an, statt sie auszuführen. Dieses [[escaping|Escaping]] schützt dich vor
[[xss|Cross-Site-Scripting (XSS)]]: Ein Angreifer kann keinen eigenen JavaScript-Code einschleusen, indem
er ihn als Buchtitel speichert.

| Schreibweise | Wirkung |
|---|---|
| `{{ $wert }}` | maskiert ausgeben – **Standard** |
| `{!! $html !!}` | ungeprüft als HTML ausgeben |
| `{{-- Notiz --}}` | Kommentar, erscheint nicht im HTML |

> [!FEHLER]
> **`{!! !!}` für Benutzereingaben.** Wer Titel, Kommentare oder Namen damit ausgibt, öffnet eine
> XSS-Lücke. `{!! !!}` ist nur für HTML gedacht, das deine Anwendung selbst erzeugt hat.

## Bedingungen und Schleifen

Blade-[[blade-direktive|Direktiven]] beginnen mit `@` und entsprechen den PHP-Kontrollstrukturen – nur
lesbarer zwischen HTML-Tags:

```blade
@if (count($books) > 10)
    <p>Du hast viel vor!</p>
@elseif (count($books) === 0)
    <p>Zeit für ein neues Buch.</p>
@endif

<ul>
    @forelse ($books as $book)
        <li>{{ $book['title'] }} ({{ $book['pages'] }} Seiten)</li>
    @empty
        <li>Noch keine Bücher.</li>
    @endforelse
</ul>
```

`@forelse` ist ein `@foreach` mit eingebautem Plan B: Ist die Liste leer, läuft der `@empty`-Zweig.
Innerhalb von Schleifen gibt es außerdem die Variable `$loop`, etwa `$loop->first` oder
`$loop->iteration` (Zählung ab 1).

> [!TIPP]
> Hinter den Kulissen übersetzt Laravel jede Blade-Datei einmal in normales PHP und legt das Ergebnis in
> `storage/framework/views/` ab. Blade kostet deshalb praktisch keine Rechenzeit.

## Layouts als Komponenten

Jede Seite braucht dasselbe Gerüst: `<html>`, `<head>`, Navigation. Dieses Gerüst schreibst du **einmal**
als [[blade-komponente|Blade-Komponente]]. Eine Datei in `resources/views/components/` wird automatisch
zum Tag `<x-dateiname>`:

```blade title="resources/views/components/layout.blade.php"
@props(['title' => 'Leseliste'])
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
</head>
<body>
    <nav><a href="{{ route('books.index') }}">Alle Bücher</a></nav>
    <main>{{ $slot }}</main>
</body>
</html>
```

```blade title="resources/views/books/index.blade.php"
<x-layout title="Bücher">
    <h1>Meine Bücher</h1>
    {{-- … die Liste von oben … --}}
</x-layout>
```

Alles zwischen `<x-layout>` und `</x-layout>` landet in `$slot`. Mit `@props` legst du fest, welche
Eigenschaften die Komponente annimmt – hier `title` mit dem Standardwert `Leseliste`.

## Kleine Bausteine wiederverwenden

Komponenten sind nicht nur für Layouts da. Jedes wiederkehrende Stück HTML – ein Hinweis-Kasten, eine
Buchkarte, ein Button – kann eine Komponente werden:

```blade title="resources/views/components/alert.blade.php"
@props(['type' => 'info'])
<div class="alert alert-{{ $type }}">{{ $slot }}</div>
```

```blade
<x-alert type="success">Buch gespeichert.</x-alert>
```

Für einfache Fälle gibt es auch `@include('books._felder')`, das eine andere View an dieser Stelle
einfügt. Komponenten sind aber übersichtlicher, weil sie ihre Eingaben mit `@props` klar benennen.

> [!PRAXIS]
> In Teams gibt es oft einen Ordner `components/` mit Dutzenden kleinen Bausteinen. Wer eine neue Seite
> baut, setzt sie wie Lego aus vorhandenen Komponenten zusammen – und das ganze Projekt sieht einheitlich
> aus. Mehr Möglichkeiten (Klassen-Komponenten, benannte Slots) findest du in der
> [Blade-Dokumentation](https://laravel.com/docs/13.x/blade#components).

## Zusammenfassung

- Views liegen in `resources/views/` und enden auf `.blade.php`; `view('books.index', [...])` gibt eine zurück.
- `{{ $wert }}` gibt Daten maskiert aus und schützt vor XSS; `{!! !!}` nur für eigenes HTML.
- Direktiven wie `@if`, `@foreach` und `@forelse … @empty` steuern die Ausgabe.
- Layouts und wiederkehrende Bausteine werden Komponenten in `resources/views/components/` und als `<x-name>` eingebunden.
- `{{ $slot }}` gibt den Inhalt zwischen den Tags aus, `@props` legt Eigenschaften mit Standardwerten fest.
