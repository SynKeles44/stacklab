---
title: Artisan – die Kommandozeile von Laravel
summary: Mit Artisan erzeugst du Code, prüfst Routen, erkundest Daten mit Tinker und schreibst eigene Befehle.
duration: 40
sources:
  - title: Laravel – Artisan Console
    url: https://laravel.com/docs/13.x/artisan
  - title: Laravel – Tinker
    url: https://laravel.com/docs/13.x/artisan#tinker
quiz:
  - type: single
    question: Was erzeugt `php artisan make:model Book -mf`?
    options:
      - Nur das Model Book
      - Das Model Book, eine Migration und eine Factory
      - Das Model, einen Controller und Views
      - Eine Tabelle books in der Datenbank
    answer: 1
    explanation: -m steht für Migration, -f für Factory. Eine Tabelle entsteht erst, wenn du die Migration mit php artisan migrate ausführst.
  - type: match
    question: Welcher Befehl hilft in welcher Situation?
    pairs:
      - { left: php artisan route:list, right: Welche URLs gibt es und wohin führen sie? }
      - { left: php artisan tinker, right: PHP-Code direkt mit der App ausprobieren }
      - { left: php artisan list, right: Welche Befehle gibt es überhaupt? }
      - { left: php artisan help make:controller, right: Welche Optionen hat ein Befehl? }
    explanation: list und help sind deine Landkarte, route:list zeigt alle Routen, Tinker ist eine interaktive PHP-Konsole mit geladener Anwendung.
  - type: cloze
    text: "In Laravel 13 legst du Name und Parameter eines eigenen Befehls mit dem Attribut `#[___('app:aufraeumen {tage}')]` fest. Den Wert von `tage` liest du in `handle()` mit `$this->___('tage')`."
    blanks:
      - [Signature]
      - [argument]
    explanation: Das Attribut Signature beschreibt Name, Argumente und Optionen. Argumente liest du mit argument(), Optionen mit option().
  - type: find-bug
    question: "`php artisan leseliste:zaehlen` gibt die Zahl der Bücher aus – und bricht danach mit einem TypeError ab. In welcher Zeile steckt der Fehler?"
    language: php
    code: |
      #[Signature('leseliste:zaehlen')]
      #[Description('Zählt alle Bücher')]
      class ZaehleBuecher extends Command
      {
          public function handle(): int
          {
              $this->info('Bücher: '.Book::count());

              return 'fertig';
          }
      }
    bug_line: 9
    explanation: "handle() ist als int deklariert und meldet damit den Exit-Code an das Terminal. Richtig ist return self::SUCCESS; (0) – bei einem Fehler self::FAILURE (1)."
tasks:
  - id: eigener-befehl
    type: terminal
    title: Ein eigener Artisan-Befehl
    description: |
      Im Ordner `artisan-befehl` liegt eine frische Laravel-Anwendung. Du baust den Befehl
      `leseliste:begruessen`, der eine Person begrüßt.

      1. Erzeuge die Klasse: `php artisan make:command Begruessen`.
      2. Ändere die Signatur auf `leseliste:begruessen {name} {--laut}`.
      3. `handle()` gibt `Hallo, Ada!` aus, wenn du `php artisan leseliste:begruessen Ada` aufrufst.
      4. Mit der Option `--laut` erscheint der ganze Gruß in Großbuchstaben: `HALLO, ADA!`.
      5. Gib eine sinnvolle Beschreibung an, damit der Befehl in `php artisan list` verständlich ist.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: artisan-befehl
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
        path: app/Console/Commands/Begruessen.php
        message: Die Klasse app/Console/Commands/Begruessen.php fehlt noch. Nutze php artisan make:command Begruessen.
      - type: command
        run: php artisan leseliste:begruessen Ada
        stdout_matches: "^\\s*Hallo, Ada!\\s*$"
        message: "`php artisan leseliste:begruessen Ada` gibt noch nicht „Hallo, Ada!“ aus."
      - type: command
        run: php artisan leseliste:begruessen Grace --laut
        stdout_matches: "^\\s*HALLO, GRACE!\\s*$"
        message: Mit --laut soll der Gruß komplett in Großbuchstaben erscheinen, z. B. „HALLO, GRACE!“.
      - type: command
        run: php artisan list leseliste --raw
        stdout_matches: "leseliste:begruessen\\s+(?!Command description)\\S"
        message: Der Befehl hat noch keine Beschreibung. Ändere das Attribut Description.
    hints:
      - "Die Signatur steht im Attribut über der Klasse: `#[Signature('leseliste:begruessen {name} {--laut}')]`."
      - "`$this->argument('name')` liefert den Namen, `$this->option('laut')` ist `true` oder `false`."
      - "`strtoupper()` macht aus einem Text Großbuchstaben, `$this->line(...)` gibt ihn aus."
    solution: |
      ```php title="app/Console/Commands/Begruessen.php"
      <?php

      namespace App\Console\Commands;

      use Illuminate\Console\Attributes\Description;
      use Illuminate\Console\Attributes\Signature;
      use Illuminate\Console\Command;

      #[Signature('leseliste:begruessen {name} {--laut}')]
      #[Description('Begrüßt eine Person mit Namen')]
      class Begruessen extends Command
      {
          public function handle(): int
          {
              $gruss = 'Hallo, '.$this->argument('name').'!';

              $this->line($this->option('laut') ? strtoupper($gruss) : $gruss);

              return self::SUCCESS;
          }
      }
      ```
  - id: artisan-was-passiert
    type: steps
    title: Was macht Artisan als Nächstes?
    description: Du arbeitest in einem frischen Laravel-Projekt. Sag voraus, was die Befehle bewirken.
    steps:
      - situation: Du tippst `php artisan make:controller BookController`.
        question: Was passiert?
        options:
          - Laravel legt app/Http/Controllers/BookController.php mit einer leeren Klasse an.
          - Laravel legt zusätzlich automatisch eine Route an.
          - Laravel legt eine Tabelle books an.
        answer: 0
        explanation: make-Befehle erzeugen nur Dateien aus Vorlagen. Routen und Tabellen musst du selbst anlegen.
      - situation: Du tippst denselben Befehl noch einmal.
        question: Was passiert jetzt?
        options:
          - Die Datei wird stillschweigend überschrieben.
          - Artisan meldet, dass der Controller schon existiert, und ändert nichts.
          - Es entsteht BookController2.php.
        answer: 1
        explanation: Artisan schützt bestehende Dateien. Mit --force würde die Datei überschrieben – Vorsicht.
      - situation: Du startest `php artisan tinker` und tippst `config('app.name')`.
        question: Was siehst du?
        options:
          - Eine Fehlermeldung, weil Tinker keine Konfiguration kennt.
          - Den Wert von APP_NAME aus .env, z. B. "Laravel".
          - Den Inhalt der Datei config/app.php.
        answer: 1
        explanation: Tinker startet die komplette Anwendung. Du kannst jede Funktion und jedes Model direkt aufrufen.
---
Du willst ein Model anlegen. Du könntest eine Datei erstellen, den Namespace tippen, die richtige
Elternklasse importieren … oder du tippst einen Befehl, und alles steht an der richtigen Stelle. Genau das
ist [[artisan|Artisan]]: die Kommandozeile, die jedes Laravel-Projekt mitbringt.

## Artisan aufrufen

Artisan ist die Datei `artisan` im Projektordner – ein PHP-Skript. Du rufst es immer aus dem Projektordner
auf:

```bash title="Terminal"
php artisan list              # alle Befehle, nach Gruppen sortiert
php artisan help make:model   # Hilfe und Optionen zu einem Befehl
php artisan list make         # nur die Befehle der Gruppe make
```

Befehle heißen meist `gruppe:aktion`, etwa `make:model`, `route:list` oder `migrate:fresh`. Die
Gruppen helfen dir, Befehle zu finden, auch wenn du ihren genauen Namen nicht kennst.

> [!MERKSATZ]
> Artisan ist kein separates Programm, sondern Teil deines Projekts. Es kennt deine Konfiguration, deine
> Models und deine Routen.

## Code erzeugen mit make:

Die `make:`-Befehle legen Dateien aus Vorlagen an – mit richtigem Namespace und Grundgerüst:

| Befehl | Erzeugt |
|---|---|
| `make:model Book` | `app/Models/Book.php` |
| `make:controller BookController` | `app/Http/Controllers/BookController.php` |
| `make:migration create_books_table` | Datei in `database/migrations/` |
| `make:request StoreBookRequest` | `app/Http/Requests/StoreBookRequest.php` |
| `make:test BookTest` | `tests/Feature/BookTest.php` |
| `make:command Begruessen` | `app/Console/Commands/Begruessen.php` |

Viele Befehle lassen sich kombinieren. `php artisan make:model Book -mfc` legt Model, Migration, Factory
und Controller in einem Rutsch an. Was die Kürzel bedeuten, zeigt `php artisan help make:model`.

> [!FEHLER]
> **Dateien von Hand anlegen und Namespace vertippen.** Ein falscher Namespace führt zu Fehlern wie
> „Class not found“. Nutze `make:`-Befehle – sie machen keine Tippfehler.

## Die Anwendung untersuchen

Artisan ist auch ein Werkzeug zum Nachschauen:

```bash title="Terminal"
php artisan about                  # Version, Umgebung, Treiber
php artisan route:list             # alle Routen mit Methode, URL, Name, Ziel
php artisan route:list --path=books
php artisan config:show database   # Konfiguration ansehen
php artisan migrate:status         # welche Migrationen gelaufen sind
```

Besonders praktisch ist [[tinker|Tinker]]: eine interaktive PHP-Konsole mit vollständig geladener App.

```text title="php artisan tinker"
> config('app.name')
= "Laravel"
> App\Models\User::count()
= 0
> exit
```

Mit `--execute` geht es auch ohne interaktive Sitzung: `php artisan tinker --execute="echo now();"`.

> [!TIPP]
> Wenn du einen Befehl nicht kennst, ist `php artisan help <befehl>` fast immer schneller als eine
> Websuche: Es zeigt alle Argumente und Optionen der Version, die **in deinem Projekt** installiert ist.
> Eine Übersicht aller eingebauten Befehle findest du in der
> [Artisan-Dokumentation](https://laravel.com/docs/13.x/artisan).

## Eigene Befehle schreiben

Wiederkehrende Aufgaben – alte Einträge löschen, Daten importieren, einen Bericht erzeugen – verpackst du
in eigene Befehle. `php artisan make:command Begruessen` erzeugt eine Klasse in `app/Console/Commands/`.
Laravel 13 beschreibt den Befehl mit [[php-attribut|PHP-Attributen]]:

```php title="app/Console/Commands/Begruessen.php"
#[Signature('leseliste:begruessen {name} {--laut}')]
#[Description('Begrüßt eine Person mit Namen')]
class Begruessen extends Command
{
    public function handle(): int
    {
        $gruss = 'Hallo, '.$this->argument('name').'!';
        $this->info($this->option('laut') ? strtoupper($gruss) : $gruss);

        return self::SUCCESS;
    }
}
```

| Teil der Signatur | Bedeutung | Auslesen |
|---|---|---|
| `{name}` | Pflicht-Argument | `$this->argument('name')` |
| `{name?}` | optionales Argument | liefert `null`, wenn es fehlt |
| `{--laut}` | Schalter (Option ohne Wert) | `$this->option('laut')` → `true`/`false` |
| `{--tage=30}` | Option mit Standardwert | `$this->option('tage')` |

Ausgeben kannst du mit `line()`, `info()` (grün), `warn()`, `error()` oder `table()`. Laravel findet
Befehle in `app/Console/Commands/` automatisch – du musst sie nirgends registrieren.

> [!TIPP]
> Ganz kleine Befehle kannst du auch als Funktion in `routes/console.php` schreiben:
> `Artisan::command('inspire', function () { ... })`. Sobald ein Befehl wächst, lohnt sich die eigene Klasse.

> [!PRAXIS]
> In echten Projekten laufen eigene Befehle oft automatisch, etwa nachts über den Scheduler. Wie das geht,
> lernst du im Kurs „Laravel vertieft“. Die Grundlage ist immer eine Befehlsklasse wie diese.

## Zusammenfassung

- Artisan ist die Kommandozeile jedes Laravel-Projekts: `php artisan list` zeigt alle Befehle.
- `make:`-Befehle erzeugen Models, Controller, Migrationen und mehr mit korrektem Namespace.
- `route:list`, `about`, `config:show` und `migrate:status` helfen beim Untersuchen der App.
- Tinker ist eine interaktive PHP-Konsole mit geladener Anwendung.
- Eigene Befehle beschreibst du mit den Attributen `#[Signature]` und `#[Description]` und programmierst sie in `handle()`.
