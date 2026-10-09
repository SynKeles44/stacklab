---
title: Anatomie eines Laravel-Projekts
summary: app, routes, config, database, resources, tests, public, storage, vendor – was in welchen Ordner eines Laravel-Backends gehört.
duration: 25
sources:
  - title: Laravel – Directory Structure
    url: https://laravel.com/docs/structure
  - title: Laravel – Request Lifecycle
    url: https://laravel.com/docs/lifecycle
  - title: Laravel – Installation
    url: https://laravel.com/docs/installation
quiz:
  - type: single
    question: Auf welchen Ordner sollte der Webserver bei einem Laravel-Projekt zeigen?
    options: [Die Projektwurzel, app/, public/, storage/]
    answer: 2
    explanation: Nur public/ ist für Besucher erreichbar. Zeigte der Webserver auf die Wurzel, könnte jemand womöglich .env oder Quellcode abrufen.
  - type: match
    question: Ordne jedem Ordner seinen Inhalt zu.
    pairs:
      - { left: "routes/", right: "Welche URL welchen Code aufruft" }
      - { left: "database/migrations/", right: "Schritte, die Tabellen anlegen und ändern" }
      - { left: "resources/views/", right: "Blade-Templates für HTML" }
      - { left: "storage/logs/", right: "Log-Dateien zur Laufzeit" }
      - { left: "vendor/", right: "Von Composer installierte Pakete" }
    explanation: Jeder Ordner hat genau eine Aufgabe. Das macht Laravel-Projekte so leicht lesbar – auch fremde.
  - type: multiple
    question: Welche Ordner oder Dateien committest du in einem Laravel-Projekt nicht?
    options: [vendor/, app/, .env, config/app.php, storage/logs/laravel.log]
    answers: [0, 2, 4]
    explanation: vendor/ erzeugt Composer neu, .env enthält Geheimnisse, Logs entstehen zur Laufzeit. app/ und config/ sind Quellcode und Konfiguration.
  - type: cloze
    text: Jede Anfrage betritt Laravel über die Datei public/___.php. Das Kommandozeilen-Werkzeug von Laravel heißt ___.
    blanks:
      - [index]
      - [artisan, php artisan]
    explanation: public/index.php ist der Einstiegspunkt für Web-Anfragen, artisan der für die Konsole.
tasks:
  - id: laravel-dateien-einsortieren
    type: terminal
    title: Dateien in ein Laravel-Gerüst einsortieren
    description: |
      Im Ordner `laravel-geruest` liegt das Gerüst eines Laravel-Projekts (nur Ordner und leere
      Dateien, keine echte Installation). Eine Kollegin hat vier neue Dateien einfach in die
      Projektwurzel gelegt. Verschiebe sie an ihren richtigen Platz:

      1. `PostController.php` → zu den anderen Controllern
      2. `Post.php` (ein Model) → zu den Models
      3. `2026_10_01_000000_create_posts_table.php` → zu den Migrationen
      4. `PostTest.php` (ein Feature-Test) → zu den Feature-Tests

      Erkunde das Gerüst zuerst mit `tree -L 3`. Klicke vorher auf **Aufgabe vorbereiten**.
    workdir: laravel-geruest
    setup: |
      mkdir -p app/Http/Controllers app/Models app/Providers bootstrap/cache config \
        database/migrations database/factories database/seeders public \
        resources/views resources/js resources/css routes \
        storage/app storage/framework storage/logs tests/Feature tests/Unit
      touch app/Http/Controllers/Controller.php app/Models/User.php app/Providers/AppServiceProvider.php
      touch bootstrap/app.php config/app.php config/database.php
      touch database/migrations/0001_01_01_000000_create_users_table.php database/seeders/DatabaseSeeder.php
      touch public/index.php resources/views/welcome.blade.php resources/js/app.js resources/css/app.css
      touch routes/web.php routes/console.php tests/TestCase.php tests/Feature/ExampleTest.php tests/Unit/ExampleTest.php
      touch artisan composer.json package.json phpunit.xml vite.config.js .env.example
      touch PostController.php Post.php 2026_10_01_000000_create_posts_table.php PostTest.php
    checks:
      - type: file_exists
        path: app/Http/Controllers/PostController.php
        message: PostController.php gehört nach app/Http/Controllers.
      - type: file_exists
        path: app/Models/Post.php
        message: Post.php gehört nach app/Models.
      - type: file_exists
        path: database/migrations/2026_10_01_000000_create_posts_table.php
        message: Die Migration gehört nach database/migrations.
      - type: file_exists
        path: tests/Feature/PostTest.php
        message: PostTest.php gehört nach tests/Feature.
      - type: command
        run: ls -p | grep -v / | grep -c '\.php$' || true
        stdout_matches: "^0$"
        message: In der Projektwurzel liegen noch PHP-Dateien, die woanders hingehören.
    hints:
      - Mit `mv datei ziel/` verschiebst du eine Datei in einen Ordner.
      - Controller liegen unter `app/Http/Controllers`, Models unter `app/Models`.
      - Migrationen liegen unter `database/migrations`, Feature-Tests unter `tests/Feature`.
    solution: |
      ```bash
      cd laravel-geruest
      tree -L 3
      mv PostController.php app/Http/Controllers/
      mv Post.php app/Models/
      mv 2026_10_01_000000_create_posts_table.php database/migrations/
      mv PostTest.php tests/Feature/
      ```
  - id: laravel-wohin
    type: dragdrop
    title: Wohin gehört das?
    description: Ordne jede Aufgabe dem Laravel-Ordner zu, in dem du sie erledigst.
    targets:
      - { id: app, label: app/ }
      - { id: routes, label: routes/ }
      - { id: config, label: config/ }
      - { id: database, label: database/ }
      - { id: resources, label: resources/ }
      - { id: public, label: public/ }
    items:
      - { label: Eine neue Model-Klasse anlegen, target: app }
      - { label: Die URL /kontakt einrichten, target: routes }
      - { label: Den Standard-Mailversand einstellen, target: config }
      - { label: Eine Tabelle für Bestellungen anlegen, target: database }
      - { label: Ein HTML-Template schreiben, target: resources }
      - { label: Eine favicon.ico ablegen, target: public }
      - { label: Testdaten-Seeder schreiben, target: database }
---
Laravel ist eines der beliebtesten PHP-Frameworks. Öffnest du ein Laravel-Projekt, siehst du über ein
Dutzend Ordner. Die gute Nachricht: In **jedem** Laravel-Projekt der Welt sehen sie gleich aus. Wer die
Struktur einmal verstanden hat, findet sich überall zurecht.

![Die Ordner eines Laravel-Projekts nach Aufgaben gruppiert](/assets/projektaufbau/laravel-struktur.svg)

## Der Überblick

[[laravel|Laravel]] ist ein [[framework|Framework]]: ein Grundgerüst, das dir Struktur und fertige
Bausteine vorgibt. Ein neues Projekt legst du mit `laravel new` oder
`composer create-project laravel/laravel` an. Danach sieht die Wurzel so aus:

```text title="Ein frisches Laravel-Projekt"
app/          bootstrap/    config/       database/
public/       resources/    routes/       storage/
tests/        vendor/
.env  .env.example  artisan  composer.json  composer.lock
package.json  phpunit.xml  vite.config.js
```

Auffällig: Neben `composer.json` liegt auch eine `package.json` mit `vite.config.js`. Laravel nutzt Vite,
um CSS und JavaScript aus `resources/` zu bauen. Die Datei `artisan` ist das Kommandozeilen-Werkzeug des
Projekts, `phpunit.xml` die Test-Konfiguration.

Die Ordner lassen sich in vier Gruppen teilen: **dein Code**, **Einstellungen**, **Daten und Tests**
sowie **vom Werkzeug verwaltet**. Die nächsten Seiten gehen sie der Reihe nach durch.

## Dein Code: app, routes, resources

| Ordner | Inhalt |
|---|---|
| `app/Models/` | [[model|Models]] – je eine Klasse pro Datenbanktabelle |
| `app/Http/Controllers/` | Controller, die Anfragen beantworten |
| `app/Providers/` | Klassen, die Dienste beim Start registrieren |
| `routes/web.php` | [[route|Routen]] für Webseiten |
| `routes/console.php` | eigene Konsolenbefehle und Zeitpläne |
| `resources/views/` | Blade-Templates für HTML |
| `resources/js/`, `resources/css/` | Frontend-Dateien, die Vite verarbeitet |

```php title="routes/web.php"
Route::get('/posts', [PostController::class, 'index']);
```

Diese Zeile verbindet die URL `/posts` mit einer Methode im Controller. So liest du ein
Laravel-Projekt am schnellsten: Starte bei `routes/` und folge den Spuren nach `app/`.

## Einstellungen und Daten

`config/` enthält PHP-Dateien wie `app.php`, `database.php` oder `mail.php`. Sie lesen Werte aus der
`.env` und stellen sie der Anwendung bereit. `bootstrap/app.php` baut die Anwendung beim Start
zusammen.

`database/` hat drei Unterordner:

- `migrations/`: [[migration|Migrationen]] – Schritt für Schritt das Tabellenschema
- `factories/`: Vorlagen für Testdaten
- `seeders/`: Klassen, die die Datenbank mit Startdaten füllen

`tests/` enthält `Feature/` (ganze Abläufe, z. B. „Login klappt“) und `Unit/` (einzelne Klassen).
Wie [[phpunit|PHPUnit]] sie findet, steht in `phpunit.xml`.

> [!MERKSATZ]
> Liest du ein unbekanntes Laravel-Projekt: **routes → app → resources**. Willst du die Daten
> verstehen: **database/migrations**.

## public, storage und vendor

`public/` ist der einzige Ordner, den Besucher erreichen. Darin liegt `index.php`, der
[[einstiegspunkt|Einstiegspunkt]] jeder Web-Anfrage, außerdem Bilder und gebaute CSS- und
JavaScript-Dateien.

`storage/` füllt Laravel zur Laufzeit: Logs in `storage/logs/`, Caches in `storage/framework/`,
Uploads in `storage/app/`. Die Ordner selbst gehören zum Projekt, ihr Inhalt nicht.

`vendor/` erzeugt [[composer|Composer]] aus `composer.json` und `composer.lock`. Er wird nie committet.

> [!FEHLER]
> **Den Webserver auf die Projektwurzel zeigen lassen.** Dann sind womöglich `.env` oder
> `composer.json` direkt im Browser abrufbar. Das [[document-root|Document Root]] muss immer `public/`
> sein.

> [!PRAXIS]
> Mit `php artisan` bekommst du eine Liste aller Befehle des Projekts. `php artisan route:list` zeigt
> alle Routen auf einen Blick – oft der schnellste Weg in ein fremdes Projekt.

## Zusammenfassung

- Alle Laravel-Projekte teilen dieselbe Ordnerstruktur.
- Code: `app/` (Models, Controller), `routes/` (URLs), `resources/` (Views, JS, CSS).
- Einstellungen: `config/` liest Werte aus `.env`; `bootstrap/` startet die App.
- Daten und Tests: `database/` (Migrationen, Factories, Seeder), `tests/` (Feature, Unit).
- `public/` ist das Document Root mit `index.php` als Einstiegspunkt.
- `storage/`-Inhalte und `vendor/` entstehen erst auf dem Rechner und werden nicht committet.
