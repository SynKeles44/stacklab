---
title: Was ist Laravel?
summary: Warum es Frameworks gibt, was Laravel dir abnimmt und wie eine Anfrage durch eine Laravel-Anwendung wandert.
duration: 30
sources:
  - title: Laravel – Introduction
    url: https://laravel.com/docs/13.x
  - title: Laravel – Request Lifecycle
    url: https://laravel.com/docs/13.x/lifecycle
  - title: Laravel – Release Notes 13.x
    url: https://laravel.com/docs/13.x/releases
quiz:
  - type: single
    question: Welche Datei nimmt in einer Laravel-Anwendung **jede** Anfrage aus dem Browser zuerst entgegen?
    options:
      - routes/web.php
      - public/index.php
      - app/Http/Controllers/Controller.php
      - .env
    answer: 1
    explanation: public/index.php ist der Front-Controller. Er lädt Composer und startet die Anwendung. Erst danach entscheidet der Router anhand von routes/web.php, welcher Code läuft.
  - type: match
    question: Ordne jedem Baustein von MVC seine Aufgabe zu.
    pairs:
      - { left: Model, right: "Steht für Daten und ihre Regeln, z. B. ein Buch in der Datenbank" }
      - { left: View, right: "Erzeugt aus Daten die Ausgabe, meist HTML" }
      - { left: Controller, right: Nimmt die Anfrage an und koordiniert Model und View }
    explanation: MVC trennt Daten, Darstellung und Steuerung. In Laravel sind das Eloquent-Models, Blade-Views und Controller-Klassen.
  - type: multiple
    question: Welche Aufgaben nimmt dir Laravel im Vergleich zu reinem PHP ab?
    options:
      - Anfragen anhand der URL an den richtigen Code verteilen
      - Datenbankzugriffe ohne handgeschriebenes SQL
      - Benutzereingaben prüfen und Fehlermeldungen anzeigen
      - Dir die Entscheidung abnehmen, was deine Anwendung fachlich tun soll
    answers: [0, 1, 2]
    explanation: Routing, Datenbankzugriff (Eloquent) und Validierung sind eingebaut. Was deine Anwendung fachlich können soll, bleibt deine Aufgabe – genau dafür schafft Laravel Freiraum.
  - type: cloze
    text: Ein ___ ist ein Grundgerüst, das typische Aufgaben schon löst. Laravel ist eines für die Programmiersprache ___.
    blanks:
      - [Framework]
      - [PHP]
    explanation: Laravel ist ein PHP-Framework. Du schreibst weiterhin PHP, aber in vorgegebenen Bahnen.
tasks:
  - id: lebenszyklus-beschriften
    type: diagram
    title: Beschrifte den Weg einer Anfrage
    description: |
      Eine Anfrage `GET /books` wandert durch die Anwendung. Ordne jedem leeren Kasten den richtigen
      Baustein zu. Die Pfeile zeigen die Richtung, in der die Anfrage weitergereicht wird.
    image: /assets/laravel/request-lebenszyklus-leer.svg
    slots:
      - { x: 30, y: 29, answer: Front-Controller }
      - { x: 52, y: 29, answer: Middleware }
      - { x: 72, y: 29, answer: Router }
      - { x: 91, y: 29, answer: Controller }
      - { x: 91, y: 69, answer: Model }
      - { x: 52, y: 69, answer: View }
    distractors: [Composer, Migration]
    hints:
      - Die erste Station nach dem Browser ist immer dieselbe PHP-Datei im Ordner public.
      - Der Controller holt Daten über das Model und gibt sie an die View weiter.
  - id: lebenszyklus-ordnen
    type: order
    title: Bringe den Ablauf in die richtige Reihenfolge
    description: Was passiert, wenn jemand `https://example.com/books` aufruft? Sortiere die Schritte.
    items:
      - Der Webserver leitet die Anfrage an public/index.php weiter.
      - Laravel startet die Anwendung und lädt die Konfiguration.
      - Middleware prüft und ergänzt die Anfrage, z. B. die Session.
      - Der Router findet die passende Route in routes/web.php.
      - Der Controller holt die Bücher über das Model aus der Datenbank.
      - Eine Blade-View erzeugt daraus HTML.
      - Laravel schickt die Response mit Statuscode 200 an den Browser.
    hints:
      - Die Konfiguration muss geladen sein, bevor irgendetwas anderes passieren kann.
      - Die View ist der letzte Schritt vor der Antwort.
---
Stell dir vor, du baust mit reinem PHP eine kleine Leseliste. Schnell brauchst du Code, der URLs
auswertet, SQL-Abfragen zusammensetzt, Formulare prüft, Passwörter sicher speichert und HTML ohne
Sicherheitslücken ausgibt. Nichts davon ist das, was deine Leseliste besonders macht – trotzdem frisst es
die meiste Zeit. Genau hier setzt [[laravel|Laravel]] an.

## Warum überhaupt ein Framework?

Ein [[framework|Framework]] ist ein Grundgerüst, das die immer gleichen Aufgaben einer Anwendung schon
gelöst hat. Du füllst es mit deinem eigenen Code. Der Unterschied zu einer [[library|Library]]: Eine
Library rufst *du* auf. Ein Framework ruft *deinen* Code an den richtigen Stellen auf.

Eine Alltagsanalogie: Mit reinem PHP baust du ein Haus Stein für Stein, inklusive Stromleitungen und
Wasserrohren. Mit Laravel bekommst du einen Rohbau mit fertigen Leitungen. Du entscheidest nur noch, wo
die Zimmer hinkommen.

| Aufgabe | Reines PHP | Laravel |
|---|---|---|
| URL auswerten | `$_SERVER['REQUEST_URI']` von Hand zerlegen | Routen in `routes/web.php` |
| Datenbank | SQL-Strings und PDO | Eloquent-Models wie `Book::all()` |
| HTML ausgeben | `echo` mit `htmlspecialchars()` | Blade-Views mit `{{ $titel }}` |
| Formulare prüfen | viele `if`-Abfragen | Validierungsregeln wie `required\|max:255` |
| Werkzeuge | eigene Skripte | Kommandozeile `php artisan` |

> [!MERKSATZ]
> Ein Framework nimmt dir die Infrastruktur ab, nicht das Denken. Was deine Anwendung fachlich tun soll,
> entscheidest weiterhin du.

## Laravel in einem Satz

Laravel ist ein freies PHP-Framework für Webanwendungen und APIs. Es erscheint einmal pro Jahr in einer
neuen Hauptversion. In diesem Kurs nutzt du **Laravel 13** mit **PHP 8.5**. Installiert wird es über
[[composer|Composer]], den Paketmanager von PHP.

Die wichtigsten Bausteine, die dir in diesem Kurs begegnen:

- **Routing** – legt fest, welcher Code bei welcher URL läuft.
- **Controller** – Klassen, die eine Anfrage bearbeiten.
- [[blade|Blade]] – die Template-Sprache für HTML-Seiten.
- [[eloquent|Eloquent]] – das [[orm|ORM]], mit dem du Datenbanktabellen als PHP-Objekte benutzt.
- [[artisan|Artisan]] – die Kommandozeile von Laravel, z. B. `php artisan make:model Book`.
- **Validierung** und **Tests** – damit falsche Eingaben und kaputter Code gar nicht erst durchrutschen.

> [!HINWEIS]
> Rund um Laravel gibt es viele Zusatzpakete, etwa Starter-Kits mit fertiger Anmeldung. Für den Einstieg
> brauchst du sie nicht. Eine Übersicht findest du in der [offiziellen Dokumentation](https://laravel.com/docs/13.x/starter-kits).

## Das MVC-Muster

Laravel ordnet Code nach dem Muster [[mvc|MVC]] (Model – View – Controller). Jeder Teil hat genau eine
Aufgabe:

| Teil | Aufgabe | In Laravel |
|---|---|---|
| [[model|Model]] | Daten und ihre Regeln | `app/Models/Book.php` |
| [[view|View]] | Darstellung, meist HTML | `resources/views/books/index.blade.php` |
| [[controller|Controller]] | nimmt die Anfrage an, holt Daten, wählt die View | `app/Http/Controllers/BookController.php` |

Denk an ein Restaurant: Der Kellner (Controller) nimmt die Bestellung auf, die Küche (Model) liefert die
Zutaten, und der Teller (View) bestimmt, wie das Essen aussieht. Der Kellner kocht nicht selbst, und die
Küche spricht nicht mit den Gästen.

> [!FEHLER]
> **Alles in den Controller packen.** Wer SQL, HTML und Rechenlogik in eine Controller-Methode schreibt,
> bekommt schnell 300 Zeilen, die niemand mehr versteht. Halte Controller schlank: Daten holen, an die
> View geben, fertig.

## Der Weg einer Anfrage

![Der Weg einer Anfrage durch Laravel: Browser, Front-Controller, Middleware, Router, Controller, Model, Datenbank, View, Response](/assets/laravel/request-lebenszyklus.svg)

Ruft jemand `/books` auf, passiert Folgendes – der sogenannte [[request-lebenszyklus|Request-Lebenszyklus]]:

1. Der [[webserver|Webserver]] reicht jede Anfrage an `public/index.php` weiter. Diese Datei ist der
   [[front-controller|Front-Controller]].
2. Laravel startet: Composer-Autoloader, Konfiguration, [[service-provider|Service-Provider]].
3. [[middleware|Middleware]] bearbeitet die Anfrage, etwa um die Session zu laden oder ein
   CSRF-Token zu prüfen.
4. Der [[router|Router]] sucht die passende [[route|Route]].
5. Der Controller holt Daten über ein Model und gibt eine View zurück.
6. Laravel verpackt das Ergebnis als [[response|Response]] und schickt sie zurück.

> [!PRAXIS]
> Wenn in einem fremden Laravel-Projekt „irgendwas“ bei einer URL passiert, folgst du genau diesem Weg:
> Route suchen (`php artisan route:list`), Controller öffnen, Model und View ansehen. So findest du dich
> in jeder Laravel-Codebasis schnell zurecht.

## Zusammenfassung

- Ein Framework löst wiederkehrende Aufgaben; du füllst es mit deinem fachlichen Code.
- Laravel ist das bekannteste PHP-Framework; du nutzt Version 13 mit PHP 8.5.
- Laravel ordnet Code nach MVC: Model (Daten), View (Darstellung), Controller (Steuerung).
- Jede Anfrage startet in `public/index.php`, läuft durch Middleware und Router zum Controller.
- Der Controller holt Daten über Models und lässt eine Blade-View die Antwort erzeugen.
