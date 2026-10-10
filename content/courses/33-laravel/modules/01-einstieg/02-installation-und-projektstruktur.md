---
title: Installation und Projektstruktur
summary: Du legst mit Composer dein erstes Laravel-Projekt an, startest den Entwicklungsserver und lernst, wofür jeder Ordner da ist.
duration: 40
sources:
  - title: Laravel – Installation
    url: https://laravel.com/docs/13.x/installation
  - title: Laravel – Directory Structure
    url: https://laravel.com/docs/13.x/structure
  - title: Composer – create-project
    url: https://getcomposer.org/doc/03-cli.md#create-project
quiz:
  - type: single
    question: In welchem Ordner legst du deine eigenen Controller und Models ab?
    options:
      - vendor/
      - app/
      - public/
      - storage/
    answer: 1
    explanation: Im Ordner app/ liegt dein eigener PHP-Code, etwa app/Models und app/Http/Controllers. vendor/ gehört Composer und wird nie von Hand bearbeitet.
  - type: match
    question: Ordne jedem Ordner seinen Inhalt zu.
    pairs:
      - { left: routes/, right: Welche URL welchen Code auslöst }
      - { left: resources/views/, right: Blade-Templates für HTML }
      - { left: database/migrations/, right: Beschreibung der Tabellen }
      - { left: public/, right: "Einziger Ordner, den der Webserver direkt ausliefert" }
    explanation: Jeder Ordner hat eine feste Aufgabe. Wer sie kennt, findet sich in jedem Laravel-Projekt zurecht.
  - type: find-bug
    question: Die App soll im Browser unter http://localhost:8000 erreichbar sein. In welcher Zeile liegt der Fehler?
    language: bash
    code: |
      composer create-project laravel/laravel leseliste
      cd leseliste
      php -S localhost:8000
    bug_line: 3
    explanation: "`php -S` im Projektordner würde die falsche Wurzel ausliefern. Der richtige Befehl ist `php artisan serve` – er startet den PHP-Server mit public/ als Wurzel."
  - type: cloze
    text: Den Entwicklungsserver startest du mit `php artisan ___`. Die installierte Version zeigt `php artisan ___`.
    blanks:
      - [serve]
      - [--version, "-V", about]
    explanation: serve startet den Server auf Port 8000. --version (oder about für eine ausführliche Übersicht) zeigt die Laravel-Version.
tasks:
  - id: erste-app
    type: terminal
    title: Deine erste Laravel-Anwendung
    description: |
      Der Ordner `erste-app` ist leer. Du legst darin eine frische Laravel-13-Anwendung an und
      ergänzt eine eigene Route.

      1. Wechsle in den Ordner: `cd erste-app`.
      2. Lege das Projekt `meine-app` an:
         `composer create-project laravel/laravel meine-app "^13.0"` (das dauert etwa eine Minute).
      3. Wechsle hinein und prüfe die Version mit `php artisan --version`.
      4. Öffne `routes/web.php` (z. B. mit `nano`) und ergänze eine Route, die bei `GET /hallo` den Text
         `Hallo Laravel!` zurückgibt.
      5. Optional: Starte `php artisan serve` und rufe in einem zweiten Terminal-Tab
         `curl localhost:8000/hallo` auf. Beende den Server mit **Strg+C**.
    workdir: erste-app
    checks:
      - type: file_exists
        path: meine-app/artisan
        message: Im Ordner meine-app liegt noch keine Laravel-Anwendung. Führe composer create-project laravel/laravel meine-app aus.
      - type: command
        run: cd meine-app && php artisan --version
        stdout_matches: "Laravel Framework 13\\."
        message: In meine-app ist kein Laravel 13 installiert. Lösche den Ordner und lege ihn mit "^13.0" neu an.
      - type: command
        run: |
          cd meine-app && php -r 'require "vendor/autoload.php"; $app = require "bootstrap/app.php"; $r = $app->make(Illuminate\Contracts\Http\Kernel::class)->handle(Illuminate\Http\Request::create("/hallo")); echo $r->getStatusCode(), " ", $r->getContent();'
        stdout_matches: "^200 Hallo Laravel!\\s*$"
        message: GET /hallo liefert noch nicht genau „Hallo Laravel!“. Ergänze die Route in meine-app/routes/web.php.
    hints:
      - Composer braucht für create-project den Paketnamen `laravel/laravel` und den Zielordner.
      - "Eine Route mit einer anonymen Funktion: `Route::get('/url', function () { return '…'; });`"
      - Achte auf das Ausrufezeichen und die Großschreibung in `Hallo Laravel!`.
    solution: |
      ```bash
      cd erste-app
      composer create-project laravel/laravel meine-app "^13.0"
      cd meine-app
      php artisan --version
      ```

      ```php title="routes/web.php (Ergänzung)"
      Route::get('/hallo', function () {
          return 'Hallo Laravel!';
      });
      ```
  - id: ordner-zuordnen
    type: dragdrop
    title: Wohin gehört diese Datei?
    description: Ordne jede Datei dem Ordner zu, in dem sie in einem Laravel-Projekt liegt.
    targets:
      - { id: app, label: "app/" }
      - { id: routes, label: "routes/" }
      - { id: resources, label: "resources/" }
      - { id: database, label: "database/" }
      - { id: public, label: "public/" }
    items:
      - { label: Book.php (Model), target: app }
      - { label: BookController.php, target: app }
      - { label: web.php, target: routes }
      - { label: welcome.blade.php, target: resources }
      - { label: 2026_10_01_create_books_table.php, target: database }
      - { label: database.sqlite, target: database }
      - { label: index.php (Front-Controller), target: public }
      - { label: favicon.ico, target: public }
    hints:
      - Alles, was der Browser direkt abrufen darf, liegt in public/.
      - Views sind Ressourcen, keine Klassen.
---
Du willst loslegen – aber womit? Laravel ist kein Programm, das du einmal installierst, sondern ein Paket,
das in jedem Projekt neu landet. Gut so: Jedes Projekt hat damit seine eigene, feste Laravel-Version.

## Was du brauchst

Für Laravel 13 brauchst du drei Dinge auf deinem Rechner. Im Übungs-Terminal von Stacklab ist alles schon
installiert.

| Werkzeug | Wofür | Prüfen mit |
|---|---|---|
| PHP 8.3 oder neuer (wir nutzen 8.5) | führt den Code aus | `php -v` |
| [[composer|Composer]] | lädt Laravel und alle Pakete | `composer --version` |
| eine Datenbank | speichert Daten | SQLite ist eingebaut |

Für Frontend-Werkzeuge wie Vite brauchst du außerdem Node.js und npm. Für diesen Kurs ist das nicht
nötig, weil wir HTML direkt mit Blade erzeugen.

## Ein neues Projekt anlegen

Es gibt zwei gleichwertige Wege. Beide laden das offizielle Projektgerüst `laravel/laravel`:

```bash title="Weg 1: direkt mit Composer"
composer create-project laravel/laravel leseliste "^13.0"
```

```bash title="Weg 2: mit dem Laravel-Installer"
laravel new leseliste
```

Der Installer fragt dich interaktiv nach Starter-Kit, Test-Framework und Datenbank. Composer legt dagegen
ohne Rückfragen das Grundgerüst an – mit [[sqlite|SQLite]] als Datenbank, einer fertigen `.env`-Datei
und bereits ausgeführten Migrationen.

> [!MERKSATZ]
> Ein Laravel-Projekt ist ein normaler Ordner mit PHP-Code. Laravel selbst steckt als Paket in `vendor/`
> – installiert von Composer, beschrieben in `composer.json` und `composer.lock`.

## Die Anwendung starten

Im Projektordner startest du den eingebauten Entwicklungsserver:

```bash title="Terminal"
cd leseliste
php artisan serve
```

```text title="Ausgabe"
   INFO  Server running on [http://127.0.0.1:8000].
```

Im Browser siehst du jetzt die Willkommensseite. Beenden kannst du den Server mit **Strg+C**. Der Befehl
`php artisan --version` zeigt die Version, `php artisan about` eine ausführliche Übersicht über
Umgebung, Treiber und Pfade.

> [!TIPP]
> `composer run dev` startet in einem frischen Projekt gleich mehrere Prozesse zusammen: Server,
> Log-Anzeige, Queue und Vite. Für diesen Kurs reicht `php artisan serve`.

## Die Ordnerstruktur

Ein frisches Projekt sieht auf den ersten Blick einschüchternd aus. Die meisten Ordner brauchst du am
Anfang aber kaum.

| Ordner/Datei | Inhalt | Wie oft du ihn anfasst |
|---|---|---|
| `app/` | dein PHP-Code: `Models/`, `Http/Controllers/`, `Providers/` | ständig |
| `routes/` | `web.php` (Seiten) und `console.php` (eigene Befehle) | ständig |
| `resources/views/` | [[blade|Blade]]-Templates | ständig |
| `database/` | Migrationen, Factories, Seeder, `database.sqlite` | oft |
| `config/` | Konfigurationsdateien | gelegentlich |
| `tests/` | automatisierte Tests | oft |
| `public/` | `index.php`, Bilder, CSS – das Einzige, was der Webserver ausliefert | selten |
| `bootstrap/` | startet die App (`app.php`) | selten |
| `storage/` | Logs, Cache, hochgeladene Dateien | selten |
| `vendor/` | Laravel und alle Pakete | nie |

> [!FEHLER]
> **Dateien in `vendor/` ändern.** Beim nächsten `composer install` oder `composer update` ist deine
> Änderung weg. Was du anpassen willst, gehört in `app/`, `config/` oder ein eigenes Paket.

## Warum public/ so wichtig ist

Der [[webserver|Webserver]] zeigt in der Produktion auf `public/` als [[document-root|Document Root]].
Alles außerhalb – `.env` mit Passwörtern, dein Code, `vendor/` – ist für Besucher:innen damit nicht
abrufbar. Jede Anfrage landet in `public/index.php`, dem [[front-controller|Front-Controller]].

> [!PRAXIS]
> Wenn du in einem neuen Team ein bestehendes Laravel-Projekt bekommst, sind die ersten drei Befehle fast
> immer: `composer install` (Pakete laden), `cp .env.example .env` und `php artisan key:generate`
> (Konfiguration anlegen) und `php artisan migrate` (Tabellen anlegen).

## Zusammenfassung

- Laravel installierst du pro Projekt mit `composer create-project laravel/laravel <ordner>` oder `laravel new`.
- `php artisan serve` startet den Entwicklungsserver auf Port 8000.
- Dein Code liegt in `app/`, Routen in `routes/`, Views in `resources/views/`, Datenbank-Dateien in `database/`.
- `vendor/` gehört Composer – dort änderst du nie etwas.
- Nur `public/` ist von außen erreichbar; `public/index.php` nimmt jede Anfrage an.
