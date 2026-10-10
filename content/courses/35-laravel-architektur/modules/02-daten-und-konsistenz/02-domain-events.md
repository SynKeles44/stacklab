---
title: Domain Events
summary: Wie du mit fachlichen Ereignissen Module entkoppelst, was in ein Event gehört und wann Listener synchron oder in der Queue laufen sollten.
duration: 25
sources:
  - title: Laravel-Dokumentation – Events
    url: https://laravel.com/docs/13.x/events
  - title: Laravel-Dokumentation – Events (Database Transactions)
    url: https://laravel.com/docs/13.x/events#dispatching-events-after-database-transactions
  - title: Laravel-Dokumentation – Mocking (Event Fake)
    url: https://laravel.com/docs/13.x/mocking#event-fake
quiz:
  - type: single
    question: Welcher Name passt am besten zu einem Domain Event?
    options:
      - SendShipmentMail
      - OrderPlaced
      - OrderService
      - HandleOrder
    answer: 1
    explanation: >
      Ein Domain Event beschreibt etwas, das fachlich **passiert ist** – deshalb steht es in der
      Vergangenheit. `SendShipmentMail` wäre ein Befehl, also eine Aufforderung an jemand Bestimmten.
  - type: multiple
    question: Was gehört in die Nutzdaten eines Domain Events, das andere Module lesen?
    options:
      - Die ID des betroffenen Datensatzes
      - Die fachlich wichtigen Werte, z. B. der Gesamtbetrag in Cent
      - Das komplette Request-Objekt
      - Die ID des Mandanten
    answers: [0, 1, 3]
    explanation: >
      Einfache, stabile Werte genügen: IDs, Beträge, Mandant. Den Request gibt es in einem Queue-Worker
      gar nicht, und er verrät HTTP-Details an fremde Module.
  - type: find-bug
    question: Das Modul Ordering soll das Modul Shipping nicht kennen. Welche Zeile bricht diese Regel?
    language: php
    code: |
      final class PlaceOrder
      {
          public function handle(PlaceOrderData $data): Order
          {
              $order = Order::create(['total_cents' => $data->total->cents]);
              app(CreateShipment::class)->forOrder($order->id);
              OrderPlaced::dispatch($order->id, $order->total_cents);

              return $order;
          }
      }
    bug_line: 6
    explanation: >
      Zeile 6 ruft eine Klasse aus Shipping direkt auf. Damit hängt Ordering wieder von Shipping ab. Das
      Event in Zeile 7 reicht – Shipping hört selbst zu.
  - type: cloze
    text: "Damit ein Event erst nach dem Commit der Transaktion ausgelöst wird, implementiert es das Interface `ShouldDispatch___`."
    blanks:
      - [AfterCommit]
    explanation: Wird die Transaktion zurückgerollt, verwirft Laravel das Event. So reagiert niemand auf Daten, die es nie gab.
tasks:
  - id: event-zwischen-modulen
    type: terminal
    title: Zwei Module über ein Event verbinden
    description: |
      Im Ordner `bestellung-events` liegt eine Laravel-App mit zwei Modulen:

      - `app/Modules/Ordering` mit dem Model `Order` und der Action `PlaceOrder`
      - `app/Modules/Shipping` mit dem Model `Shipment` (Tabelle `shipments`)

      Ein Test `tests/Feature/ShippingTest.php` erwartet, dass zu jeder Bestellung automatisch eine
      Sendung entsteht. Er ist noch rot.

      Klicke zuerst auf **Aufgabe vorbereiten** (beim ersten Mal lädt Composer Pakete, das dauert etwas).

      1. `cd bestellung-events` und `./vendor/bin/pest` – sieh dir den roten Test an.
      2. Lege das Event `app/Modules/Ordering/Events/OrderPlaced.php` an (Namespace
         `App\Modules\Ordering\Events`, Trait `Illuminate\Foundation\Events\Dispatchable`) mit
         `public int $orderId` und `public int $totalCents` im Konstruktor.
      3. Löse es in `PlaceOrder::handle` nach dem Anlegen aus: `OrderPlaced::dispatch(...)`.
      4. Lege den Listener `app/Modules/Shipping/Listeners/CreateShipment.php` an. `handle(OrderPlaced $event)`
         legt mit `Shipment::create(['order_id' => $event->orderId])` eine Sendung an.
      5. Registriere ihn in `AppServiceProvider::boot()`:
         `Event::listen(OrderPlaced::class, CreateShipment::class);`
      6. `./vendor/bin/pest` muss grün sein. Das Modul Ordering darf das Wort `Shipping` nirgends enthalten.
    workdir: bestellung-events
    setup: |
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
      mkdir -p app/Modules/Ordering/Models app/Modules/Ordering/Actions app/Modules/Shipping/Models
      cat > database/migrations/2026_01_01_000000_create_orders_and_shipments.php <<'EOF'
      <?php

      use Illuminate\Database\Migrations\Migration;
      use Illuminate\Database\Schema\Blueprint;
      use Illuminate\Support\Facades\Schema;

      return new class extends Migration
      {
          public function up(): void
          {
              Schema::create('orders', function (Blueprint $table) {
                  $table->id();
                  $table->unsignedInteger('total_cents');
                  $table->timestamps();
              });

              Schema::create('shipments', function (Blueprint $table) {
                  $table->id();
                  $table->unsignedBigInteger('order_id')->index();
                  $table->timestamps();
              });
          }

          public function down(): void
          {
              Schema::dropIfExists('shipments');
              Schema::dropIfExists('orders');
          }
      };
      EOF
      cat > app/Modules/Ordering/Models/Order.php <<'EOF'
      <?php

      namespace App\Modules\Ordering\Models;

      use Illuminate\Database\Eloquent\Attributes\Fillable;
      use Illuminate\Database\Eloquent\Model;

      #[Fillable(['total_cents'])]
      class Order extends Model
      {
      }
      EOF
      cat > app/Modules/Ordering/Actions/PlaceOrder.php <<'EOF'
      <?php

      declare(strict_types=1);

      namespace App\Modules\Ordering\Actions;

      use App\Modules\Ordering\Models\Order;

      final class PlaceOrder
      {
          public function handle(int $totalCents): Order
          {
              return Order::create(['total_cents' => $totalCents]);
          }
      }
      EOF
      cat > app/Modules/Shipping/Models/Shipment.php <<'EOF'
      <?php

      namespace App\Modules\Shipping\Models;

      use Illuminate\Database\Eloquent\Attributes\Fillable;
      use Illuminate\Database\Eloquent\Model;

      #[Fillable(['order_id'])]
      class Shipment extends Model
      {
      }
      EOF
      cat > tests/Feature/ShippingTest.php <<'EOF'
      <?php

      use App\Modules\Ordering\Actions\PlaceOrder;
      use App\Modules\Shipping\Models\Shipment;
      use Illuminate\Foundation\Testing\RefreshDatabase;

      uses(RefreshDatabase::class);

      test('placing an order creates a shipment', function () {
          $order = app(PlaceOrder::class)->handle(2500);

          expect(Shipment::where('order_id', $order->id)->count())->toBe(1);
      });
      EOF
      php artisan migrate -q --force
    checks:
      - type: file_exists
        path: app/Modules/Ordering/Events/OrderPlaced.php
        message: Das Event app/Modules/Ordering/Events/OrderPlaced.php fehlt noch.
      - type: file_contains
        path: app/Modules/Ordering/Actions/PlaceOrder.php
        pattern: "OrderPlaced::dispatch"
        message: PlaceOrder löst das Event noch nicht mit OrderPlaced::dispatch(...) aus.
      - type: command
        run: grep -rl "Shipping" app/Modules/Ordering
        expect_exit: 1
        message: Im Modul Ordering taucht noch das Wort Shipping auf. Ordering darf Shipping nicht kennen – nur das Event verbindet die beiden.
      - type: command
        run: php artisan event:list
        stdout_matches: "CreateShipment"
        message: Laravel kennt den Listener CreateShipment noch nicht. Registriere ihn in AppServiceProvider::boot() mit Event::listen(...).
      - type: command
        run: php artisan tinker --execute='DB::beginTransaction(); $o = app(App\Modules\Ordering\Actions\PlaceOrder::class)->handle(990); echo App\Modules\Shipping\Models\Shipment::where("order_id", $o->id)->count(); DB::rollBack();'
        stdout_matches: "^\\s*1\\s*$"
        message: Nach einer Bestellung entsteht noch keine Sendung. Prüfe Event, Listener und die Registrierung.
      - type: command
        run: ./vendor/bin/pest
        message: Die Tests sind noch rot. Führe ./vendor/bin/pest aus und lies die Meldung.
    hints:
      - Das Event ist eine ganz normale Klasse mit `use Dispatchable;` und Konstruktor-Promotion – mehr nicht.
      - "In der Action: erst `$order = Order::create(...)`, dann `OrderPlaced::dispatch($order->id, $order->total_cents);`, dann `return $order;`."
      - "Im AppServiceProvider brauchst du `use Illuminate\\Support\\Facades\\Event;` sowie die `use`-Zeilen für Event und Listener."
    solution: |
      ```php title="app/Modules/Ordering/Events/OrderPlaced.php"
      <?php

      namespace App\Modules\Ordering\Events;

      use Illuminate\Foundation\Events\Dispatchable;

      final class OrderPlaced
      {
          use Dispatchable;

          public function __construct(public int $orderId, public int $totalCents) {}
      }
      ```

      ```php title="app/Modules/Ordering/Actions/PlaceOrder.php (handle)"
      $order = Order::create(['total_cents' => $totalCents]);
      OrderPlaced::dispatch($order->id, $order->total_cents);

      return $order;
      ```

      ```php title="app/Modules/Shipping/Listeners/CreateShipment.php"
      <?php

      namespace App\Modules\Shipping\Listeners;

      use App\Modules\Ordering\Events\OrderPlaced;
      use App\Modules\Shipping\Models\Shipment;

      final class CreateShipment
      {
          public function handle(OrderPlaced $event): void
          {
              Shipment::create(['order_id' => $event->orderId]);
          }
      }
      ```

      ```php title="app/Providers/AppServiceProvider.php (boot)"
      Event::listen(OrderPlaced::class, CreateShipment::class);
      ```
  - id: ereignis-oder-befehl
    type: dragdrop
    title: Ereignis oder Befehl?
    description: >
      Domain Events beschreiben, was passiert ist. Befehle sagen, was jemand tun soll. Ordne jeden Namen
      zu.
    targets:
      - { id: event, label: Domain Event }
      - { id: befehl, label: "Befehl (Action, Job)" }
    items:
      - { label: InvoicePaid, target: event }
      - { label: SendReminderMail, target: befehl }
      - { label: SubscriptionCancelled, target: event }
      - { label: CreateShipment, target: befehl }
      - { label: StockReserved, target: event }
      - { label: RecalculateTaxes, target: befehl }
    hints:
      - Steht der Name in der Vergangenheit („…ed“, „…paid“)? Dann meldet er etwas, das schon passiert ist.
---
Wenn eine Bestellung eingeht, soll das Lager reservieren, der Versand eine Sendung anlegen, das
Reporting den Umsatz zählen und der Kunde eine Mail bekommen. Schreibst du das alles in `PlaceOrder`,
kennt die Bestell-Action plötzlich vier fremde Bereiche. Jede Änderung im Versand bricht dann die
Bestellung. Domain Events drehen diese Abhängigkeit um.

## Was ein Domain Event ist

Ein [[domain-event|Domain Event]] meldet, dass **fachlich** etwas passiert ist: „Bestellung
aufgegeben“, „Rechnung bezahlt“, „Abo gekündigt“. Den Mechanismus aus [[event|Events]] und
[[event-listener|Listenern]] kennst du aus „Laravel vertieft“. Neu ist hier die Rolle als
**Architektur-Werkzeug**.

| Begriff | Bedeutung | Beispiel |
|---|---|---|
| Domain Event | fachliches Geschehen, Vergangenheit | `OrderPlaced` |
| Framework-Event | technisches Geschehen in Laravel | `eloquent.created`, `JobFailed` |
| Befehl | Aufforderung an genau einen Empfänger | `CreateShipment` |

Der Unterschied zwischen Event und Befehl ist wichtig: Ein Befehl hat **einen** Empfänger, der ihn
ausführen muss. Ein Event hat **beliebig viele** Zuhörer – auch keinen.

> [!MERKSATZ]
> Ein Domain Event steht in der Vergangenheit und sagt, was passiert ist – nicht, was als Nächstes zu tun ist.

## Abhängigkeiten umdrehen

Ohne Events ruft das Modul Ordering die anderen Module direkt auf. Mit Events meldet Ordering nur, was
geschehen ist. Die anderen Module hören zu.

```php title="app/Modules/Ordering/Actions/PlaceOrder.php"
public function handle(PlaceOrderData $data): Order
{
    $order = Order::create(['total_cents' => $data->total->cents]);

    OrderPlaced::dispatch($order->id, $order->total_cents);

    return $order;
}
```

```php title="app/Modules/Shipping/Listeners/CreateShipment.php"
final class CreateShipment
{
    public function handle(OrderPlaced $event): void
    {
        Shipment::create(['order_id' => $event->orderId]);
    }
}
```

Jetzt kennt **Shipping** das Event aus Ordering – aber Ordering kennt Shipping nicht mehr. Ein neues
Modul „Treuepunkte“ kommt dazu, ohne dass du `PlaceOrder` anfasst. Diese lose
[[kopplung|Kopplung]] ist der Kern modularer Apps.

> [!FEHLER]
> Ein Event auslösen **und** zusätzlich den Listener direkt aufrufen („zur Sicherheit“). Dann läuft die
> Arbeit doppelt, und die Abhängigkeit ist wieder da.

## Was in ein Event gehört

Ein Event ist ein kleiner Vertrag zwischen Modulen. Halte ihn schmal und stabil:

- **IDs** statt ganzer Models: `orderId`, nicht `Order $order`. Ein fremdes Modul soll das Model aus
  Ordering nicht anfassen.
- **Fachliche Werte**, die fast jeder Zuhörer braucht: Betrag, Status, Zeitpunkt.
- Bei mandantenfähigen Apps immer die **Mandanten-ID** – mehr dazu in Modul 4.
- **Nichts** aus HTTP: kein Request, keine Session, kein eingeloggter Nutzer als Objekt.

```php title="Ein schmales, stabiles Event"
final class OrderPlaced
{
    use Dispatchable;

    public function __construct(
        public int $orderId,
        public int $tenantId,
        public int $totalCents,
    ) {}
}
```

Einfache Werte haben noch einen Vorteil: Sie lassen sich problemlos
[[serialisierung|serialisieren]], wenn ein Listener in der Queue läuft.

## Synchron oder in der Queue?

Listener laufen standardmäßig **synchron**, also im selben Request. Mit `ShouldQueue` werden sie zu
einem [[queue-job|Job]] und laufen später in einem Worker.

| Listener | Wann sinnvoll | Folge |
|---|---|---|
| synchron | muss sofort gelten, schnell | Fehler bricht den Request ab |
| `ShouldQueue` | langsam, extern (Mail, API) | läuft Sekunden später, eigene Wiederholungen |

Queued Listener führen zu [[eventuelle-konsistenz|eventueller Konsistenz]]: Für einen kurzen Moment
gibt es die Bestellung, aber noch keine Sendung. Das ist meist völlig in Ordnung – du musst es nur
wissen, etwa wenn eine Seite direkt nach dem Bestellen die Sendungsnummer anzeigen will.

> [!PRAXIS]
> In großen Apps sind fast alle modulübergreifenden Listener in der Queue. So bleibt der Request schnell,
> und ein Fehler im Reporting verhindert keine Bestellung.

## Events testen

Mit `Event::fake()` prüfst du, **dass** ein Event ausgelöst wurde – ohne die Listener auszuführen:

```php title="tests/Feature/PlaceOrderTest.php"
test('placing an order announces it', function () {
    Event::fake([OrderPlaced::class]);

    app(PlaceOrder::class)->handle(2500);

    Event::assertDispatched(OrderPlaced::class, fn (OrderPlaced $e) => $e->totalCents === 2500);
});
```

Den Listener testest du getrennt: Du baust ein `OrderPlaced` von Hand und rufst `handle()` auf. Und mit
`Event::assertListening(OrderPlaced::class, CreateShipment::class)` prüfst du die Verdrahtung.

Damit ein Event bei einer zurückgerollten [[transaktion|Transaktion]] nicht trotzdem ankommt, gibt es
`ShouldDispatchAfterCommit` – darum geht es in der nächsten Lektion.

## Zusammenfassung

- Ein Domain Event meldet ein fachliches Geschehen in der Vergangenheit, z. B. `OrderPlaced`.
- Events drehen Abhängigkeiten um: Das auslösende Modul kennt seine Zuhörer nicht.
- Ein Event trägt schmale, stabile Werte: IDs, Beträge, Mandanten-ID – keine Models aus fremden Modulen, nichts aus HTTP.
- Langsame oder externe Listener laufen mit `ShouldQueue` in der Queue; das bedeutet eventuelle Konsistenz.
- `Event::fake()` und `assertDispatched` prüfen das Auslösen, Listener testest du getrennt.
