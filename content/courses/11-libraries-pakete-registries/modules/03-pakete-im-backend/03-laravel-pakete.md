---
title: Pakete in Laravel – Service Provider und Facades
summary: Wie sich ein Paket per Service Provider in Laravel einklinkt, wie Package Discovery das automatisch erledigt und was hinter einer Facade steckt.
duration: 25
sources:
  - title: Laravel 13 – Package Development
    url: https://laravel.com/docs/13.x/packages
  - title: Laravel 13 – Service Providers
    url: https://laravel.com/docs/13.x/providers
  - title: Laravel 13 – Service Container
    url: https://laravel.com/docs/13.x/container
  - title: Laravel 13 – Facades
    url: https://laravel.com/docs/13.x/facades
quiz:
  - type: single
    question: Wozu dient ein Service Provider in einem Laravel-Paket?
    options:
      - Er lädt das Paket von Packagist herunter.
      - Er ist die Verbindungsstelle, an der das Paket Dienste im Container registriert und Routen, Views oder Konfiguration bekannt macht.
      - Er ersetzt die composer.json.
      - Er startet einen eigenen Webserver.
    answer: 1
    explanation: Composer liefert den Code, der Service Provider klinkt ihn in Laravel ein. Ohne Provider kennt Laravel weder die Dienste noch die Routen des Pakets.
  - type: match
    question: In welche Methode gehört was?
    pairs:
      - { left: "register()", right: "Dienste im Service Container anmelden" }
      - { left: "boot()", right: "Routen, Views und Befehle laden, wenn alle Provider registriert sind" }
      - { left: "extra.laravel.providers", right: "Provider automatisch per Package Discovery anmelden" }
      - { left: "extra.laravel.dont-discover", right: "Discovery für ein Paket in der App abschalten" }
    explanation: In register() greifst du noch nicht auf andere Dienste zu – die sind eventuell noch nicht da. Das passiert in boot().
  - type: multiple
    question: Welche Aussagen über Facades stimmen?
    options:
      - "`Cache::get('x')` ruft keine echte statische Methode auf, sondern leitet an ein Objekt im Container weiter."
      - Eine Facade nennt dem Framework, unter welchem Schlüssel das Objekt im Container liegt.
      - Facades machen Code untestbar, weil man sie nicht austauschen kann.
      - Pakete können eigene Facades mitbringen und per Package Discovery als Alias registrieren.
    answers: [0, 1, 3]
    explanation: Weil hinter der Facade ein Objekt aus dem Container steckt, kann Laravel es in Tests durch eine Attrappe ersetzen (z. B. Cache::fake() oder Mail::fake()).
  - type: cloze
    text: In Laravel 13 stehen die Service Provider der App in der Datei `bootstrap/___.php`. Paket-Provider landen dort nicht, weil Laravel sie per Package ___ selbst findet.
    blanks:
      - [providers]
      - [Discovery]
    explanation: Beim composer install läuft automatisch `php artisan package:discover` und sammelt alle Provider aus den extra-Abschnitten der Pakete.
tasks:
  - id: mini-facade
    type: code
    language: php
    title: Baue eine Mini-Facade
    description: |
      Der Code enthält schon einen einfachen Service-Container (`Container::bind` / `Container::make`) und
      eine Klasse `Greeter`. Vervollständige die Facade-Technik:

      1. Implementiere in der abstrakten Klasse `Facade` die Methode `__callStatic`. Sie holt mit
         `Container::make(static::accessor())` das Objekt und ruft darauf die gewünschte Methode mit allen
         Argumenten auf.
      2. Lass die Klasse `Greet` den Schlüssel `'greeter'` als `accessor()` zurückgeben.

      Danach funktioniert `Greet::hello('Ada')`, obwohl `Greeter::hello` gar nicht statisch ist.
    starter: |
      <?php

      final class Container
      {
          private static array $bindings = [];

          public static function bind(string $key, callable $factory): void
          {
              self::$bindings[$key] = $factory;
          }

          public static function make(string $key): object
          {
              if (!isset(self::$bindings[$key])) {
                  throw new RuntimeException("Nichts gebunden unter {$key}");
              }

              return (self::$bindings[$key])();
          }
      }

      final class Greeter
      {
          public function hello(string $name): string
          {
              return "Hallo, {$name}";
          }
      }

      abstract class Facade
      {
          abstract protected static function accessor(): string;

          public static function __callStatic(string $method, array $arguments): mixed
          {
              // Objekt aus dem Container holen und $method darauf aufrufen
          }
      }

      final class Greet extends Facade
      {
          protected static function accessor(): string
          {
              return '';
          }
      }
    tests:
      - name: Facade leitet an das Objekt im Container weiter
        code: |
          Container::bind('greeter', fn () => new Greeter());
          assert_same('Hallo, Ada', Greet::hello('Ada'));
      - name: Austauschbar wie in Tests
        code: |
          Container::bind('greeter', fn () => new class {
              public function hello(string $name): string { return "Fake {$name}"; }
          });
          assert_same('Fake Ada', Greet::hello('Ada'));
      - name: Ohne Bindung gibt es einen Fehler
        code: |
          $fehler = false;
          try {
              Container::make('unbekannt');
          } catch (RuntimeException $e) {
              $fehler = true;
          }
          assert_true($fehler);
    solution: |
      <?php

      final class Container
      {
          private static array $bindings = [];

          public static function bind(string $key, callable $factory): void
          {
              self::$bindings[$key] = $factory;
          }

          public static function make(string $key): object
          {
              if (!isset(self::$bindings[$key])) {
                  throw new RuntimeException("Nichts gebunden unter {$key}");
              }

              return (self::$bindings[$key])();
          }
      }

      final class Greeter
      {
          public function hello(string $name): string
          {
              return "Hallo, {$name}";
          }
      }

      abstract class Facade
      {
          abstract protected static function accessor(): string;

          public static function __callStatic(string $method, array $arguments): mixed
          {
              return Container::make(static::accessor())->$method(...$arguments);
          }
      }

      final class Greet extends Facade
      {
          protected static function accessor(): string
          {
              return 'greeter';
          }
      }
    hints:
      - "`static::accessor()` ruft die Methode der Kindklasse auf – also von `Greet`."
      - "Eine Methode mit variablem Namen rufst du mit `$objekt->$method(...$arguments)` auf."
  - id: paket-entdecken
    type: simulated
    title: Ein Laravel-Paket installieren
    description: |
      Du arbeitest in einer Laravel-App und installierst das (ausgedachte) Paket `stacklab/laravel-hello`.
      Es bringt einen Service Provider und eine Facade mit.

      1. Installiere das Paket mit Composer.
      2. Schau dir an, wie das Paket seinen Provider anmeldet: `cat vendor/stacklab/laravel-hello/composer.json`.
      3. Lass Laravel die Pakete neu einsammeln: `php artisan package:discover`.
    prompt: "du@laptop:~/shop$"
    steps:
      - expect: "^composer\\s+require\\s+stacklab/laravel-hello$"
        output: |
          ./composer.json has been updated
          Running composer update stacklab/laravel-hello
          Loading composer repositories with package information
          Updating dependencies
          Lock file operations: 1 install, 0 updates, 0 removals
            - Locking stacklab/laravel-hello (v1.2.0)
          Writing lock file
          Installing dependencies from lock file (including require-dev)
            - Installing stacklab/laravel-hello (v1.2.0): Extracting archive
          Generating optimized autoload files
          > Illuminate\Foundation\ComposerScripts::postAutoloadDump
          > @php artisan package:discover --ansi

             INFO  Discovering packages.

            laravel/tinker ............................................ DONE
            stacklab/laravel-hello .................................... DONE

          No security vulnerability advisories found.
          Using version ^1.2 for stacklab/laravel-hello
        hint: "Pakete fügst du mit `composer require hersteller/paket` hinzu."
      - expect: "^cat\\s+vendor/stacklab/laravel-hello/composer\\.json$"
        output: |
          {
              "name": "stacklab/laravel-hello",
              "type": "library",
              "require": {
                  "php": "^8.3",
                  "illuminate/support": "^13.0"
              },
              "autoload": {
                  "psr-4": { "Stacklab\\Hello\\": "src/" }
              },
              "extra": {
                  "laravel": {
                      "providers": ["Stacklab\\Hello\\HelloServiceProvider"],
                      "aliases": { "Hello": "Stacklab\\Hello\\Facades\\Hello" }
                  }
              }
          }
        hint: "Mit `cat <pfad>` gibst du eine Datei aus."
      - expect: "^php\\s+artisan\\s+package:discover$"
        output: |
          INFO  Discovering packages.

          laravel/tinker ............................................ DONE
          stacklab/laravel-hello .................................... DONE
        hint: "Der Befehl heißt `php artisan package:discover`."
    responses:
      - match: "^ls"
        output: "app  artisan  bootstrap  composer.json  composer.lock  config  public  routes  vendor"
      - match: "^cat\\s+bootstrap/providers\\.php"
        output: |
          <?php

          return [
              App\Providers\AppServiceProvider::class,
          ];
---
Du installierst ein Laravel-Paket – und ohne dass du eine Zeile Konfiguration schreibst, gibt es plötzlich
neue Routen, neue Artisan-Befehle und eine Klasse `Hello::`, die du überall nutzen kannst. Das ist keine
Magie, sondern das Zusammenspiel von Composer, Service Providern und Package Discovery.

## Zwei Arten von Paketen

| Art | Beispiele | Wie du es nutzt |
|---|---|---|
| **Eigenständig** | ramsey/uuid, Carbon, Pest | `composer require` und direkt die Klassen verwenden |
| **Für Laravel gebaut** | Debug-Leisten, Admin-Panels, Laravel Pint | Bringen Routen, Views, Konfiguration oder Befehle mit |

Eigenständige Pakete funktionieren in jedem PHP-Projekt – der Autoloader reicht. Laravel-Pakete müssen
sich zusätzlich in den Ablauf des [[laravel|Laravel]]-Frameworks einklinken. Dafür gibt es den
[[service-provider|Service Provider]].

## Der Service Provider

Ein Service Provider ist eine Klasse mit zwei Methoden, die Laravel beim Start aufruft – das
[[inversion-of-control|Hollywood-Prinzip]] eines Frameworks:

```php title="src/HelloServiceProvider.php"
<?php

namespace Stacklab\Hello;

use Illuminate\Support\ServiceProvider;

final class HelloServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton('hello', fn () => new HelloService());
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__ . '/../routes/web.php');
    }
}
```

| Methode | Was passiert dort? |
|---|---|
| `register()` | Dienste im [[service-container\|Service Container]] anmelden – noch nichts anderes benutzen |
| `boot()` | Routen, Views, Befehle, Konfiguration laden – jetzt sind alle Dienste da |

Der Service Container ist das zentrale „Lager“ der App: Er weiß, wie man Objekte wie `HelloService`
erzeugt, und liefert sie auf Anfrage.

## Package Discovery

Früher musstest du jeden Paket-Provider von Hand in eine Liste eintragen. Heute meldet das Paket sich selbst
an – im Abschnitt `extra` seiner composer.json:

```json title="composer.json des Pakets"
"extra": {
    "laravel": {
        "providers": ["Stacklab\\Hello\\HelloServiceProvider"],
        "aliases": { "Hello": "Stacklab\\Hello\\Facades\\Hello" }
    }
}
```

Nach jedem `composer install` oder `composer require` führt Composer `php artisan package:discover` aus. Der
Befehl liest diese Abschnitte aller Pakete und merkt sich die Provider. Das ist
[[package-discovery|Package Discovery]].

> [!MERKSATZ]
> Composer liefert den **Code**, der Service Provider **klinkt ihn ein**, Package Discovery sorgt dafür,
> dass Laravel den Provider **automatisch findet**.

Deine eigenen Provider stehen in Laravel 13 in `bootstrap/providers.php`. Willst du ein Paket bewusst
nicht automatisch laden, trägst du es in der App unter `extra.laravel.dont-discover` ein.

## Facades: statisch aussehen, dynamisch arbeiten

In Laravel schreibst du oft `Cache::get('key')` oder `Hello::greet('Ada')`. Das sieht aus wie ein
statischer Methodenaufruf. Tatsächlich ist `Hello` eine [[facade|Facade]] – eine „Fassade“ vor einem
Objekt im Service Container.

```php title="src/Facades/Hello.php"
use Illuminate\Support\Facades\Facade;

final class Hello extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'hello';   // Schlüssel im Service Container
    }
}
```

Beim Aufruf passiert Folgendes:

1. PHP findet keine statische Methode `greet` und ruft die magische Methode `__callStatic` auf.
2. Die Facade holt das Objekt mit dem Schlüssel `'hello'` aus dem Container.
3. Sie ruft darauf ganz normal `greet('Ada')` auf.

Weil das Objekt aus dem Container kommt, lässt es sich in Tests austauschen – genau das machen
`Mail::fake()` oder `Queue::fake()`.

> [!FEHLER]
> **Facades für echte statische Klassen halten.** Wer `Hello::greet()` im Code sieht und in der Facade
> nach einer Methode `greet` sucht, findet nichts. Die Logik steckt in der Klasse, die im Service Provider
> registriert wurde – dort musst du suchen.

> [!PRAXIS]
> Wenn ein Paket nach dem Installieren nicht wirkt, prüfe zuerst `php artisan package:discover` und ob das
> Paket in `dont-discover` steht. Bei Konfigurationsdateien hilft `php artisan vendor:publish`, um sie in
> den Ordner `config/` der App zu kopieren.

## Zusammenfassung

- Eigenständige Pakete brauchen nur den Autoloader, Laravel-Pakete zusätzlich einen **Service Provider**.
- `register()` meldet Dienste im **Service Container** an, `boot()` lädt Routen, Views und Befehle.
- **Package Discovery** liest `extra.laravel.providers` und `aliases` aus der composer.json der Pakete.
- Eine **Facade** sieht statisch aus, leitet aber an ein Objekt im Container weiter – deshalb ist sie testbar.
- Eigene Provider stehen in `bootstrap/providers.php`, Pakete lassen sich mit `dont-discover` ausschließen.
