---
title: Der Service Container
summary: Wie Laravel Objekte für dich baut, warum du gegen Interfaces programmierst und wann bind, singleton und scoped passen.
duration: 25
sources:
  - title: Laravel – Service Container
    url: https://laravel.com/docs/13.x/container
  - title: Laravel – Facades
    url: https://laravel.com/docs/13.x/facades
quiz:
  - type: single
    question: Ein Controller verlangt im Konstruktor `App\Services\ReportBuilder` – eine normale Klasse ohne Interface-Parameter. Musst du sie im Container registrieren?
    options:
      - Ja, sonst wirft Laravel einen Fehler
      - Nein, der Container baut konkrete Klassen automatisch per Reflection
      - Nur wenn die Klasse im Ordner app/Services liegt
    answer: 1
    explanation: Konkrete Klassen, deren Abhängigkeiten wieder auflösbar sind, baut der Container ohne Konfiguration. Registrieren musst du vor allem Interfaces und Klassen, die Werte wie API-Schlüssel brauchen.
  - type: match
    question: Welche Bindung passt zu welchem Verhalten?
    pairs:
      - { left: "bind()", right: Bei jedem Auflösen ein neues Objekt }
      - { left: "singleton()", right: Ein Objekt für die ganze Laufzeit des Prozesses }
      - { left: "scoped()", right: Ein Objekt pro Request oder pro Queue-Job }
      - { left: "instance()", right: Ein bereits fertiges Objekt wird hinterlegt }
    explanation: Der Unterschied liegt nur darin, wie oft der Container das Objekt neu baut. scoped ist wichtig, wenn ein Prozess viele Requests oder Jobs nacheinander verarbeitet.
  - type: cloze
    text: "Mit `$this->app->___(PaymentGateway::class, HttpPaymentGateway::class);` bekommt jede Klasse, die `PaymentGateway` verlangt, dieselbe Instanz. Ohne Provider erreichst du das mit dem Attribut `#[___(HttpPaymentGateway::class)]` plus `#[Singleton]` am Interface."
    blanks:
      - [singleton]
      - [Bind]
    explanation: singleton() registriert die Bindung im Service Provider. Das Attribut Bind an einem Interface sagt dem Container direkt im Code, welche Klasse dahintersteckt.
  - type: find-bug
    question: Der Controller soll im Test einen Fake-Zahlungsdienst bekommen können. Welche Zeile verhindert das?
    language: php
    code: |
      class CheckoutController extends Controller
      {
          public function store(Request $request)
          {
              $gateway = new HttpPaymentGateway();
              $id = $gateway->charge($request->email, 1999);

              return ['payment' => $id];
          }
      }
    bug_line: 5
    explanation: Mit new baut der Controller die konkrete Klasse selbst – der Container kommt nie zum Zug. Besser verlangst du PaymentGateway als Parameter und lässt Laravel die passende Klasse einsetzen.
tasks:
  - id: mini-container
    type: code
    language: php
    title: Baue einen Mini-Container
    description: |
      Um zu verstehen, was Laravel im Inneren tut, baust du einen winzigen Container.

      - `bind(string $id, Closure $factory)` merkt sich eine Fabrik-Funktion. `make()` ruft sie **jedes
        Mal** neu auf.
      - `singleton(string $id, Closure $factory)` merkt sich ebenfalls eine Fabrik. `make()` ruft sie
        aber nur **beim ersten Mal** auf und gibt danach immer dasselbe Objekt zurück.
      - `make(string $id)` liefert das Objekt. Die Fabrik bekommt den Container als Argument, damit sie
        selbst weitere Objekte auflösen kann.
      - Ist für `$id` nichts registriert, wirft `make()` eine `RuntimeException`.
    starter: |
      <?php

      class Container
      {
          private array $factories = [];
          private array $shared = [];
          private array $instances = [];

          public function bind(string $id, Closure $factory): void
          {
              // merke dir die Fabrik
          }

          public function singleton(string $id, Closure $factory): void
          {
              // merke dir die Fabrik und dass sie geteilt wird
          }

          public function make(string $id): object
          {
              // Instanz bauen oder wiederverwenden
          }
      }
    tests:
      - name: bind liefert bei jedem Aufruf ein neues Objekt
        code: |
          $c = new Container();
          $c->bind('uhr', fn () => new ArrayObject());
          assert_true($c->make('uhr') instanceof ArrayObject);
          assert_true($c->make('uhr') !== $c->make('uhr'));
      - name: singleton liefert immer dasselbe Objekt
        code: |
          $c = new Container();
          $zaehler = new ArrayObject();
          $c->singleton('log', function () use ($zaehler) { $zaehler->append(1); return new ArrayObject(); });
          assert_true($c->make('log') === $c->make('log'));
          assert_same(1, count($zaehler));
      - name: die Fabrik bekommt den Container
        code: |
          $c = new Container();
          $c->singleton('config', fn () => new ArrayObject(['key' => 'abc']));
          $c->bind('client', fn (Container $c) => new ArrayObject(['key' => $c->make('config')['key']]));
          assert_same('abc', $c->make('client')['key']);
      - name: unbekannte IDs werfen eine RuntimeException
        code: |
          $c = new Container();
          $geworfen = false;
          try { $c->make('gibt-es-nicht'); } catch (RuntimeException $e) { $geworfen = true; }
          assert_true($geworfen);
    hints:
      - "Speichere in `bind()` die Fabrik in `$this->factories[$id]` und in `singleton()` zusätzlich `$this->shared[$id] = true`."
      - "In `make()`: Gibt es schon `$this->instances[$id]`, gib es zurück. Sonst `$objekt = ($this->factories[$id])($this);`."
      - "Nur wenn `$this->shared[$id]` gesetzt ist, legst du das Objekt in `$this->instances[$id]` ab."
    solution: |
      <?php

      class Container
      {
          private array $factories = [];
          private array $shared = [];
          private array $instances = [];

          public function bind(string $id, Closure $factory): void
          {
              $this->factories[$id] = $factory;
          }

          public function singleton(string $id, Closure $factory): void
          {
              $this->factories[$id] = $factory;
              $this->shared[$id] = true;
          }

          public function make(string $id): object
          {
              if (isset($this->instances[$id])) {
                  return $this->instances[$id];
              }

              if (! isset($this->factories[$id])) {
                  throw new RuntimeException("Nothing bound for {$id}");
              }

              $object = ($this->factories[$id])($this);

              if (isset($this->shared[$id])) {
                  $this->instances[$id] = $object;
              }

              return $object;
          }
      }
  - id: bindung-waehlen
    type: dragdrop
    title: Welche Bindung passt?
    description: Ordne jede Situation der passenden Art von Container-Bindung zu.
    targets:
      - { id: bind, label: "bind() – jedes Mal neu" }
      - { id: singleton, label: "singleton() – einmal pro Prozess" }
      - { id: scoped, label: "scoped() – einmal pro Request/Job" }
    items:
      - { label: "Ein Objekt, das sich den gerade eingeloggten Nutzer merkt", target: scoped }
      - { label: Ein HTTP-Client mit fester Basis-URL und Token, target: singleton }
      - { label: "Ein Warenkorb-Rechner, der Zwischenstände in Eigenschaften speichert", target: bind }
      - { label: "Eine Sammlung aller Fehler des aktuellen Requests", target: scoped }
      - { label: "Ein Markdown-Parser, dessen Aufbau teuer ist und der keinen Zustand hat", target: singleton }
      - { label: "Ein Formular-Objekt, das pro Aufruf andere Eingaben bekommt", target: bind }
    hints:
      - Frage dich jedes Mal, ob das Objekt Daten über den aktuellen Request mit sich herumträgt.
      - Zustandslose, teure Objekte teilst du. Request-bezogene Daten dürfen nie in den nächsten Request rutschen.
---
Dein Controller soll eine Zahlung buchen. Also schreibst du `new HttpPaymentGateway()` – und brauchst
dafür einen API-Schlüssel, eine Basis-URL und einen HTTP-Client. Spätestens im Test willst du keine
echte Zahlung auslösen. Genau hier hilft der **Service Container**.

![Der Service Container: Provider registrieren, Container löst auf, Code bekommt fertige Objekte](/assets/laravel-vertieft/service-container.svg)

## Das Problem: Klassen, die sich selbst bauen

Stell dir eine Werkstatt vor, in der jede Mechanikerin ihr Werkzeug selbst schmiedet, bevor sie
anfängt. Das dauert, und niemand kann ihr ein anderes Werkzeug in die Hand geben. Genau so verhält sich
Code mit `new` mitten in einer Methode:

```php
public function store(Request $request)
{
    $gateway = new HttpPaymentGateway(config('services.pay.key'));
    $gateway->charge($request->email, 1999);
}
```

Der Controller weiß jetzt, **welche** Klasse es ist und **wie** man sie baut. Austauschen geht nur, indem
du den Controller änderst.

Die Lösung heißt [[dependency-injection|Dependency Injection]]: Die Klasse sagt nur, **was** sie braucht,
und bekommt es von außen gereicht.

```php
public function __construct(private PaymentGateway $gateway) {}
```

Wer das Objekt baut und hineinreicht, ist der [[service-container|Service Container]] – Laravels zentrale
Werkzeugausgabe. Dieses Prinzip, dass nicht die Klasse selbst, sondern jemand anderes die Abhängigkeiten
liefert, heißt [[inversion-of-control|Inversion of Control]].

## Automatisches Auflösen mit Reflection

Für die meisten Klassen musst du **nichts** konfigurieren. Verlangt ein Controller eine konkrete Klasse,
schaut der Container per [[reflection|Reflection]] in ihren [[konstruktor|Konstruktor]], baut alle
Parameter rekursiv und reicht das fertige Objekt hinein.

```php
class ReportController extends Controller
{
    public function __construct(private ReportBuilder $builder) {}
}
```

Das funktioniert überall, wo Laravel selbst Objekte erzeugt: Controller, Middleware, Listener,
Artisan-Befehle und die `handle()`-Methode von Jobs. Selbst auflösen kannst du so:

| Aufruf | Bedeutung |
|---|---|
| `app(ReportBuilder::class)` | Objekt über den Helfer holen |
| `app()->make(ReportBuilder::class)` | dasselbe, ausgeschrieben |
| `app()->makeWith(Report::class, ['id' => 5])` | fehlende Parameter mitgeben |

> [!MERKSATZ]
> Konkrete Klassen löst der Container selbst auf. Registrieren musst du nur, was er nicht erraten kann:
> **Interfaces** und **Werte** wie API-Schlüssel.

## Interfaces binden: bind, singleton, scoped

Ein [[interface|Interface]] beschreibt nur Methoden – der Container weiß nicht, welche Klasse er bauen
soll. Das sagst du ihm in einem Service Provider (nächste Lektion):

```php title="app/Providers/AppServiceProvider.php"
public function register(): void
{
    $this->app->singleton(PaymentGateway::class, HttpPaymentGateway::class);

    $this->app->bind(Exporter::class, function (Application $app) {
        return new CsvExporter(delimiter: ';');
    });
}
```

| Methode | Wie oft wird gebaut? |
|---|---|
| `bind()` | bei jedem Auflösen neu |
| `singleton()` | einmal, danach immer dieselbe Instanz ([[singleton]]) |
| `scoped()` | einmal pro Request bzw. pro Queue-Job |
| `instance()` | gar nicht – du übergibst ein fertiges Objekt |

`scoped()` ist wichtig, wenn ein Prozess viele Requests nacheinander bedient, etwa ein Queue-Worker: Ein
Singleton würde Daten aus dem vorigen Job mitschleppen.

> [!FEHLER]
> **Request-Daten in einem Singleton.** Merkt sich ein Singleton den aktuellen Nutzer, sieht im
> Queue-Worker der nächste Job plötzlich den Nutzer des vorigen. Für solche Objekte nimmst du `scoped()`.

## Bindungen per Attribut

Laravel 13 erlaubt es, Bindungen direkt am Interface festzulegen – ganz ohne Provider:

```php title="app/Contracts/PaymentGateway.php"
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Singleton;

#[Bind(HttpPaymentGateway::class)]
#[Bind(FakePaymentGateway::class, environments: ['local', 'testing'])]
#[Singleton]
interface PaymentGateway
{
    public function charge(string $email, int $cents): string;
}
```

Ein [[php-attribut|PHP-Attribut]] ist eine Markierung im Code, die Laravel per Reflection ausliest.
Außerdem kannst du einzelne Werte gezielt in Konstruktoren einspritzen, sogenannte *kontextuelle
Attribute*:

```php
public function __construct(
    #[Config('services.pay.key')] private string $apiKey,
    #[Storage('public')] private Filesystem $disk,
) {}
```

> [!PRAXIS]
> In großen Projekten liegt jeder externe Dienst – Zahlung, Versand, SMS – hinter einem Interface. Im
> Test tauschst du die Bindung mit einer Zeile aus (`$this->app->instance(...)` oder einem Fake) und
> testest ohne Netzwerk.

## Facades sind auch nur der Container

`Cache::get()` sieht aus wie ein statischer Aufruf. Eine [[facade|Facade]] holt im Hintergrund aber
das passende Objekt aus dem Container und ruft die Methode darauf auf. Deshalb kann Laravel sie im Test
austauschen – `Mail::fake()` legt einfach ein anderes Objekt in den Container.

```php
Cache::get('key');            // Facade
app('cache')->get('key');     // dasselbe ohne Facade
```

## Zusammenfassung

- Der **Service Container** baut Objekte und reicht ihre Abhängigkeiten hinein (Dependency Injection).
- Konkrete Klassen löst er automatisch per Reflection auf – ohne Konfiguration.
- Interfaces bindest du mit `bind()`, `singleton()`, `scoped()` oder `instance()`.
- `scoped()` statt `singleton()`, sobald ein Objekt Daten des aktuellen Requests oder Jobs hält.
- Attribute wie `#[Bind]`, `#[Singleton]` und `#[Config]` sparen Provider-Code.
- Facades holen ihr Objekt aus dem Container und sind darum im Test austauschbar.
