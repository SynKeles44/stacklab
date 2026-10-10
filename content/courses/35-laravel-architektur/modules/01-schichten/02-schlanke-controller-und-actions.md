---
title: Schlanke Controller und Actions
summary: Wie du Geschäftslogik aus dem Controller in Action- und Service-Klassen verlagerst und warum dadurch Tests und Wiederverwendung einfacher werden.
duration: 25
sources:
  - title: Laravel-Dokumentation – Controllers (Dependency Injection)
    url: https://laravel.com/docs/13.x/controllers#dependency-injection-and-controllers
  - title: Laravel-Dokumentation – Service Container
    url: https://laravel.com/docs/13.x/container
  - title: Laravel-Dokumentation – Validation (Form Requests)
    url: https://laravel.com/docs/13.x/validation#form-request-validation
quiz:
  - type: single
    question: Was ist das wichtigste Merkmal einer Action-Klasse?
    options:
      - Sie erbt von Controller.
      - Sie bildet genau einen Anwendungsfall ab und hat eine öffentliche Methode, z. B. handle().
      - Sie enthält alle Methoden rund um ein Model.
      - Sie darf nur aus Jobs aufgerufen werden.
    answer: 1
    explanation: >
      Eine Action ist „ein Verb“: PlaceOrder, CreateInvoice, CancelSubscription. Genau eine öffentliche
      Methode, genau ein Anwendungsfall.
  - type: multiple
    question: Welche Aufgaben bleiben in einem schlanken Controller?
    options:
      - Den Request entgegennehmen (inklusive Form Request).
      - Die Action aufrufen.
      - Rabatte berechnen.
      - Eine Response bauen (JSON, Redirect, View).
    answers: [0, 1, 3]
    explanation: Rabatte sind Geschäftslogik und gehören in die Action. Der Controller übersetzt nur zwischen HTTP und Anwendungsfall.
  - type: find-bug
    question: Diese Action soll von Controller, Artisan-Befehl und Job aufrufbar sein. Welche Zeile verhindert das?
    language: php
    code: |
      final class PlaceOrder
      {
          public function handle(string $email, array $items): Order
          {
              $customer = request()->user();
              $total = $this->sum($items);

              return Order::create(['customer_email' => $email, 'total_cents' => $total]);
          }
      }
    bug_line: 5
    explanation: >
      `request()` gibt es nur bei HTTP-Anfragen. In einem Job oder Artisan-Befehl ist kein Nutzer
      eingeloggt. Alles, was die Action braucht, kommt als Parameter herein.
  - type: match
    question: Ordne die Begriffe zu.
    pairs:
      - { left: "Action", right: "Ein Anwendungsfall, eine Methode: PlaceOrder::handle()" }
      - { left: "Service", right: "Mehrere verwandte Operationen: TaxCalculator::forCountry()" }
      - { left: "Methoden-Injection", right: "Laravel übergibt die Action als Parameter von store()" }
      - { left: "Konstruktor-Injection", right: "Abhängigkeiten kommen über __construct herein" }
    explanation: Actions und Services sind beide normale Klassen. Der Service-Container baut sie und reicht sie per Injection weiter.
tasks:
  - id: action-extrahieren
    type: terminal
    title: Eine Action aus dem Controller ziehen
    description: |
      Im Ordner `bestellung-action` liegt eine Laravel-App mit einem dicken `OrderController`. Seine
      Methode `store` validiert, summiert Positionen, gewährt ab 100 € Bestellwert 5 % Rabatt und
      speichert die Bestellung. Ein Feature-Test `tests/Feature/OrderTest.php` sichert das Verhalten ab.

      Klicke zuerst auf **Aufgabe vorbereiten** (beim ersten Mal lädt Composer Pakete, das dauert etwas).

      1. Wechsle mit `cd bestellung-action` in die App und lass die Tests laufen: `./vendor/bin/pest`.
      2. Lege `app/Actions/PlaceOrder.php` an (Namespace `App\Actions`) mit der Methode
         `handle(string $email, array $items): Order`. Sie enthält Summe, Rabatt und `Order::create`.
      3. Ändere `OrderController::store`: Er nimmt `PlaceOrder $placeOrder` als zweiten Parameter,
         ruft `$placeOrder->handle(...)` auf und baut nur noch die JSON-Response.
      4. Führe `./vendor/bin/pest` erneut aus – alles muss grün bleiben.
    workdir: bestellung-action
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
      cat > database/migrations/2026_01_01_000000_create_orders_table.php <<'EOF'
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
                  $table->string('customer_email');
                  $table->unsignedInteger('total_cents');
                  $table->timestamps();
              });
          }

          public function down(): void
          {
              Schema::dropIfExists('orders');
          }
      };
      EOF
      cat > app/Models/Order.php <<'EOF'
      <?php

      namespace App\Models;

      use Illuminate\Database\Eloquent\Attributes\Fillable;
      use Illuminate\Database\Eloquent\Model;

      #[Fillable(['customer_email', 'total_cents'])]
      class Order extends Model
      {
      }
      EOF
      cat > app/Http/Controllers/OrderController.php <<'EOF'
      <?php

      namespace App\Http\Controllers;

      use App\Models\Order;
      use Illuminate\Http\JsonResponse;
      use Illuminate\Http\Request;

      class OrderController extends Controller
      {
          public function store(Request $request): JsonResponse
          {
              $data = $request->validate([
                  'email' => ['required', 'email'],
                  'items' => ['required', 'array', 'min:1'],
                  'items.*.price_cents' => ['required', 'integer', 'min:0'],
                  'items.*.quantity' => ['required', 'integer', 'min:1'],
              ]);

              $total = 0;
              foreach ($data['items'] as $item) {
                  $total += $item['price_cents'] * $item['quantity'];
              }

              if ($total >= 10000) {
                  $total = (int) round($total * 0.95);
              }

              $order = Order::create([
                  'customer_email' => $data['email'],
                  'total_cents' => $total,
              ]);

              return response()->json(['id' => $order->id, 'total_cents' => $order->total_cents], 201);
          }
      }
      EOF
      cat > routes/web.php <<'EOF'
      <?php

      use App\Http\Controllers\OrderController;
      use Illuminate\Support\Facades\Route;

      Route::get('/', function () {
          return view('welcome');
      });

      Route::post('/orders', [OrderController::class, 'store']);
      EOF
      cat > tests/Feature/OrderTest.php <<'EOF'
      <?php

      use App\Models\Order;
      use Illuminate\Foundation\Testing\RefreshDatabase;

      uses(RefreshDatabase::class);

      test('small orders have no discount', function () {
          $this->postJson('/orders', [
              'email' => 'user@example.com',
              'items' => [['price_cents' => 1500, 'quantity' => 2]],
          ])->assertCreated()->assertJson(['total_cents' => 3000]);
      });

      test('orders from 100 euro get five percent discount', function () {
          $this->postJson('/orders', [
              'email' => 'user@example.com',
              'items' => [['price_cents' => 4000, 'quantity' => 2], ['price_cents' => 2000, 'quantity' => 1]],
          ])->assertCreated()->assertJson(['total_cents' => 9500]);

          expect(Order::count())->toBe(1);
      });

      test('empty orders are rejected', function () {
          $this->postJson('/orders', ['email' => 'user@example.com', 'items' => []])
              ->assertUnprocessable();
      });
      EOF
      php artisan migrate -q --force
    checks:
      - type: file_exists
        path: app/Actions/PlaceOrder.php
        message: Die Datei app/Actions/PlaceOrder.php fehlt noch.
      - type: command
        run: php artisan tinker --execute='DB::beginTransaction(); $o = app(App\Actions\PlaceOrder::class)->handle("user@example.com", [["price_cents" => 5000, "quantity" => 2]]); echo $o->total_cents, "|", $o->customer_email; DB::rollBack();'
        stdout_matches: "9500\\|user@example\\.com"
        message: PlaceOrder::handle liefert noch nicht die richtige Bestellung. Für 2 × 50 € sollen nach 5 % Rabatt 9500 Cent herauskommen.
      - type: file_contains
        path: app/Http/Controllers/OrderController.php
        pattern: "PlaceOrder"
        message: Der OrderController nutzt die Action PlaceOrder noch nicht.
      - type: command
        run: grep -cE "foreach|0\.95|Order::create|10000" app/Http/Controllers/OrderController.php
        expect_exit: 1
        message: Im Controller stehen noch Summe, Rabatt oder Order::create. Diese Logik gehört in die Action.
      - type: command
        run: ./vendor/bin/pest
        message: Die Tests sind rot. Führe ./vendor/bin/pest aus und lies, welcher Test fehlschlägt.
    hints:
      - Kopiere die Logik ab `$total = 0;` bis einschließlich `Order::create(...)` in die Action und gib die Bestellung zurück.
      - "Laravel baut die Action automatisch: `public function store(Request $request, PlaceOrder $placeOrder): JsonResponse`."
      - "Im Controller bleibt: validieren, `$order = $placeOrder->handle($data['email'], $data['items']);`, JSON zurückgeben."
    solution: |
      ```php title="app/Actions/PlaceOrder.php"
      <?php

      declare(strict_types=1);

      namespace App\Actions;

      use App\Models\Order;

      final class PlaceOrder
      {
          public function handle(string $email, array $items): Order
          {
              $total = 0;
              foreach ($items as $item) {
                  $total += $item['price_cents'] * $item['quantity'];
              }

              if ($total >= 10000) {
                  $total = (int) round($total * 0.95);
              }

              return Order::create(['customer_email' => $email, 'total_cents' => $total]);
          }
      }
      ```

      ```php title="app/Http/Controllers/OrderController.php (store)"
      public function store(Request $request, PlaceOrder $placeOrder): JsonResponse
      {
          $data = $request->validate([/* unverändert */]);

          $order = $placeOrder->handle($data['email'], $data['items']);

          return response()->json(['id' => $order->id, 'total_cents' => $order->total_cents], 201);
      }
      ```
  - id: action-ohne-framework
    type: code
    language: php
    title: Eine Action, die sich ohne Laravel testen lässt
    description: |
      Eine gute Action bekommt alles, was sie braucht, von außen. Dann kannst du sie ohne Datenbank testen.

      Schreibe die Klasse `RegisterMember` mit der Methode `handle(string $email): array`:

      - Die E-Mail wird mit `trim` und `strtolower` normalisiert.
      - Ist sie ungültig (`filter_var($email, FILTER_VALIDATE_EMAIL) === false`), wirf eine
        `InvalidArgumentException`.
      - Existiert die Adresse schon im Mitgliederverzeichnis, wirf eine `DomainException`.
      - Sonst speichert die Action das Mitglied mit `$this->members->add($email)` und gibt
        `['email' => $email, 'welcome' => true]` zurück.

      Das Mitgliederverzeichnis kommt über den Konstruktor herein: ein Objekt der Klasse `MemberList` (ist
      schon vorgegeben, im echten Projekt wäre es ein Repository oder Eloquent).
    starter: |
      <?php

      declare(strict_types=1);

      final class MemberList
      {
          private array $emails = [];

          public function has(string $email): bool
          {
              return in_array($email, $this->emails, true);
          }

          public function add(string $email): void
          {
              $this->emails[] = $email;
          }
      }

      final class RegisterMember
      {
          public function __construct(private MemberList $members) {}

          public function handle(string $email): array
          {
              // Normalisieren, prüfen, speichern
          }
      }
    tests:
      - name: registriert ein neues Mitglied mit normalisierter E-Mail
        code: |
          $list = new MemberList();
          $result = (new RegisterMember($list))->handle('  Ada@Example.com ');
          assert_same(['email' => 'ada@example.com', 'welcome' => true], $result);
          assert_true($list->has('ada@example.com'));
      - name: lehnt doppelte Adressen ab
        code: |
          $list = new MemberList();
          $action = new RegisterMember($list);
          $action->handle('ada@example.com');
          $thrown = false;
          try { $action->handle('ADA@example.com'); } catch (DomainException $e) { $thrown = true; }
          assert_true($thrown);
      - name: lehnt ungültige Adressen ab
        code: |
          $thrown = false;
          try { (new RegisterMember(new MemberList()))->handle('keine-adresse'); } catch (InvalidArgumentException $e) { $thrown = true; }
          assert_true($thrown);
      - name: lehnt einen leeren String ab
        code: |
          $thrown = false;
          try { (new RegisterMember(new MemberList()))->handle('   '); } catch (InvalidArgumentException $e) { $thrown = true; }
          assert_true($thrown);
    solution: |
      <?php

      declare(strict_types=1);

      final class MemberList
      {
          private array $emails = [];

          public function has(string $email): bool
          {
              return in_array($email, $this->emails, true);
          }

          public function add(string $email): void
          {
              $this->emails[] = $email;
          }
      }

      final class RegisterMember
      {
          public function __construct(private MemberList $members) {}

          public function handle(string $email): array
          {
              $email = strtolower(trim($email));

              if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
                  throw new InvalidArgumentException('Invalid email.');
              }

              if ($this->members->has($email)) {
                  throw new DomainException('Already registered.');
              }

              $this->members->add($email);

              return ['email' => $email, 'welcome' => true];
          }
      }
    hints:
      - Normalisiere zuerst, dann prüfe – sonst gilt `ADA@example.com` als neue Adresse.
      - Exceptions wirfst du mit `throw new DomainException('...');`.
---
Stell dir vor, du sollst den Bestellvorgang deiner App zusätzlich als Artisan-Befehl für Großkunden
anbieten. Die ganze Logik – Summe, Rabatt, Speichern – steckt in `OrderController::store`. Kopieren?
Dann hast du zwei Stellen, die bei der nächsten Rabattänderung auseinanderlaufen. Die Lösung heißt:
den Anwendungsfall in eine eigene Klasse ziehen.

## Was ein schlanker Controller tut

Ein [[schlanker-controller|schlanker Controller]] macht nur drei Dinge:

1. Den [[request|Request]] entgegennehmen – die Validierung erledigt ein [[form-request|Form Request]].
2. Den Anwendungsfall aufrufen.
3. Eine [[response|Response]] bauen: JSON, Redirect oder View.

```php title="Schlank: 6 Zeilen statt 60"
public function store(StoreOrderRequest $request, PlaceOrder $placeOrder): JsonResponse
{
    $order = $placeOrder->handle($request->validated('email'), $request->validated('items'));

    return response()->json(['id' => $order->id], 201);
}
```

Alles Fachliche – Preise, Rabatte, Statusregeln – kennt der Controller nicht mehr. Er ist ein
Übersetzer zwischen HTTP und deiner Anwendung.

> [!MERKSATZ]
> Ein Controller übersetzt HTTP. Er entscheidet nichts Fachliches.

## Die Action: ein Anwendungsfall, eine Klasse

Eine [[action-klasse|Action]] bildet genau einen [[use-case|Anwendungsfall]] ab. Ihr Name ist ein
Verb: `PlaceOrder`, `CreateInvoice`, `CancelSubscription`. Sie hat **eine** öffentliche Methode,
meist `handle` oder `__invoke`.

```php title="app/Actions/PlaceOrder.php"
final class PlaceOrder
{
    public function __construct(private DiscountPolicy $discounts) {}

    public function handle(string $email, array $items): Order
    {
        $total = $this->discounts->apply($this->sum($items));

        return Order::create(['customer_email' => $email, 'total_cents' => $total]);
    }

    private function sum(array $items): int
    {
        return array_sum(array_map(fn ($i) => $i['price_cents'] * $i['quantity'], $items));
    }
}
```

Abhängigkeiten wie `DiscountPolicy` kommen per [[dependency-injection|Dependency Injection]] über den
[[konstruktor|Konstruktor]] herein. Den Rest erledigt der [[service-container|Service-Container]]:
Er baut die Action automatisch, wenn der Controller sie als Parameter verlangt.

Laravel hat keinen eigenen Befehl dafür – eine Action ist eine ganz normale PHP-Klasse, meist unter
`app/Actions`.

## Action oder Service?

Beide Begriffe begegnen dir in Projekten. Der Unterschied ist eine Konvention, kein Framework-Feature:

| | Action | Service |
|---|---|---|
| Umfang | ein Anwendungsfall | mehrere verwandte Operationen |
| Name | Verb: `PlaceOrder` | Substantiv: `TaxCalculator` |
| Methoden | eine öffentliche | mehrere öffentliche |
| Typischer Aufrufer | Controller, Befehl, Job | Actions und andere Services |

Ein [[service-klasse|Service]] kapselt oft wiederverwendbares Fachwissen („Steuer für ein Land
berechnen“) oder eine externe Anbindung („Zahlungsanbieter“). Actions orchestrieren den Ablauf und
benutzen Services.

> [!FEHLER]
> Der „Gott-Service“: ein `OrderService` mit 40 Methoden von `create` bis `exportToCsv`. Er ist nur ein
> verschobener fetter Controller. Teile ihn nach Anwendungsfällen in Actions auf.

## Was in eine Action nicht hineingehört

Damit eine Action von überall aufrufbar bleibt, darf sie nichts über ihren Aufrufer wissen:

- kein `request()`, kein `auth()->user()`, keine `session()` – diese Werte kommen als Parameter
- keine Response, kein `redirect()`, kein `abort(404)` für fachliche Fehler – wirf stattdessen eine
  eigene [[exception|Exception]], die der Controller übersetzt
- keine Validierung von Formularfeldern – die erledigt der Form Request vorher

Das macht Actions auch leicht testbar: Du rufst `handle()` direkt auf, ganz ohne simulierten Request.

> [!PRAXIS]
> In großen Projekten gibt es oft hunderte Actions, sortiert nach fachlichem Bereich:
> `app/Actions/Billing/CreateInvoice.php`, `app/Actions/Billing/CancelInvoice.php`. Ein Blick in den
> Ordner zeigt, was die Anwendung **kann**.

## Zusammenfassung

- Ein schlanker Controller nimmt den Request an, ruft den Anwendungsfall auf und baut die Response.
- Eine Action bildet genau einen Anwendungsfall ab, heißt wie ein Verb und hat eine öffentliche Methode.
- Abhängigkeiten kommen per Konstruktor-Injection, der Service-Container baut die Action automatisch.
- Services bündeln verwandte Operationen; Actions orchestrieren und benutzen sie.
- Actions kennen weder Request noch Session noch Response – dadurch laufen sie überall und sind leicht testbar.
