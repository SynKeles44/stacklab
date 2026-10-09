---
title: Unbekannte Muster erkennen
summary: Services, DTOs, Events, Listener und Repositorys – wie du typische Muster an Namen und Ordnern erkennst und ihre Rolle verstehst, ohne jedes Detail zu kennen.
duration: 25
sources:
  - title: Laravel 13 – Events
    url: https://laravel.com/docs/13.x/events
  - title: Laravel 13 – Service Container
    url: https://laravel.com/docs/13.x/container
  - title: PHP-Handbuch – Readonly-Klassen
    url: https://www.php.net/manual/de/language.oop5.basic.php#language.oop5.basic.class.readonly
  - title: Refactoring.Guru – Design Patterns (Katalog)
    url: https://refactoring.guru/design-patterns/catalog
quiz:
  - type: match
    question: Ordne jedem Muster seine Aufgabe zu.
    pairs:
      - { left: "Controller", right: "Nimmt einen Request an und gibt eine Antwort zurück" }
      - { left: "Service", right: "Bündelt Geschäftslogik wie eine Preisberechnung" }
      - { left: "DTO", right: "Transportiert Daten, ohne eigene Logik" }
      - { left: "Event", right: "Meldet, dass etwas passiert ist" }
      - { left: "Listener", right: "Reagiert auf ein bestimmtes Ereignis" }
    explanation: >
      Die Namen sind Abkürzungen für Rollen. Wer die Rolle kennt, versteht eine Klasse schon zur Hälfte, bevor er
      sie liest.
  - type: single
    question: "Im CheckoutController steht `EventDispatcher::default()->dispatch(new OrderPlaced($summary));`. Wo findest du heraus, was danach passiert?"
    options:
      - Nirgends – dispatch macht nichts Sichtbares.
      - Dort, wo Listener für OrderPlaced registriert werden – hier in EventDispatcher::default().
      - In der Klasse OrderSummary.
      - Im Test-Runner.
    answer: 1
    explanation: >
      Events entkoppeln Auslöser und Reaktion. Wer reagiert, steht in der Registrierung der Listener. Suche nach
      dem Klassennamen des Events, um sie zu finden.
  - type: multiple
    question: Woran erkennst du im Kiezladen, dass `OrderSummary` ein DTO ist?
    options:
      - Die Klasse liegt im Ordner `src/Dto`.
      - Sie ist `readonly` und hat nur öffentliche Eigenschaften.
      - Sie enthält keine Methoden mit Geschäftslogik.
      - Sie wird vom Router aufgerufen.
    answers: [0, 1, 2]
    explanation: >
      Ordner, `readonly` und das Fehlen von Logik sind typische Merkmale. Ein DTO wird erzeugt und weitergereicht,
      aber nie vom Router aufgerufen.
  - type: cloze
    text: Wenn eine Klasse ihre Abhängigkeiten über den Konstruktor bekommt, statt sie selbst zu erzeugen, nennt man das Dependency ___.
    blanks:
      - [Injection]
    explanation: "`Cart` bekommt sein `ProductRepository` im Konstruktor übergeben. Dadurch lässt sich die Klasse leicht testen und austauschen."
tasks:
  - id: muster-im-kiezladen
    type: terminal
    title: Wer reagiert auf eine Bestellung?
    description: |
      Klicke zuerst auf **Aufgabe vorbereiten**. Im Ordner `kiezladen-muster` liegt der Kiezladen.

      1. Finde heraus, welche Klasse auf das Event `OrderPlaced` reagiert. Schreibe ihren Klassennamen (ohne
         Namespace) in `listener.txt`.
      2. Finde heraus, welche Klasse `PriceCalculator::summarize()` zurückgibt. Schreibe ihren Klassennamen
         (ohne Namespace) in `dto.txt`.
    workdir: kiezladen-muster
    setup: |
      # Beispielprojekt "Kiezladen" mit fester Git-Historie (10 Commits)
      git init -q -b main
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      commit() {
        if [ "$1" = tom ]; then n="Tom Muster"; else n="Mira Beispiel"; fi
        git add -A
        GIT_AUTHOR_NAME="$n" GIT_AUTHOR_EMAIL="$1@example.com" GIT_AUTHOR_DATE="$2" \
        GIT_COMMITTER_NAME="$n" GIT_COMMITTER_EMAIL="$1@example.com" GIT_COMMITTER_DATE="$2" \
        git commit -q -m "$3" ${4:+-m "$4"}
      }
      routes() {
        { printf '<?php\ndeclare(strict_types=1);\n\nnamespace Kiez;\n\n$router = new Router();\n'
          printf '%s\n' "$@"; printf '\nreturn $router;\n'; } > src/routes.php
      }
      R1='$router->get("/", fn () => "Willkommen im Kiezladen – versandkostenfrei ab 50 €");'
      R2='$router->get("/products", [new Controller\ProductController(), "index"]);'
      R3='$router->get("/cart", [new Controller\CartController(), "show"]);
      $router->post("/cart/add", [new Controller\CartController(), "add"]);'
      R4='$router->post("/checkout", [new Controller\CheckoutController(), "store"]);'
      mkdir -p public src/Controller src/Service src/Repository src/Dto src/Event src/Listener tests
      printf '# Kiezladen\n\nEin kleiner Online-Shop für den Laden um die Ecke.\n' > README.md
      printf '.PHONY: serve test\n\nserve:\n\tphp -S localhost:8000 -t public\n\ntest:\n\tphp tests/run.php\n' > Makefile
      cat > public/index.php <<'EOF'
      <?php
      declare(strict_types=1);

      require __DIR__ . '/../src/bootstrap.php';

      $router = require __DIR__ . '/../src/routes.php';
      echo $router->dispatch($_SERVER['REQUEST_METHOD'], parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
      EOF
      cat > src/bootstrap.php <<'EOF'
      <?php
      declare(strict_types=1);

      spl_autoload_register(function (string $class): void {
          $file = __DIR__ . '/' . str_replace(['Kiez\\', '\\'], ['', '/'], $class) . '.php';
          if (is_file($file)) {
              require $file;
          }
      });
      EOF
      cat > src/Router.php <<'EOF'
      <?php
      declare(strict_types=1);

      namespace Kiez;

      final class Router
      {
          private array $routes = [];

          public function get(string $path, callable $handler): void
          {
              $this->routes['GET'][$path] = $handler;
          }

          public function post(string $path, callable $handler): void
          {
              $this->routes['POST'][$path] = $handler;
          }

          public function dispatch(string $method, string $path): string
          {
              $handler = $this->routes[$method][$path] ?? null;
              if ($handler === null) {
                  http_response_code(404);
                  return 'Seite nicht gefunden';
              }
              return $handler();
          }
      }
      EOF
      routes "$R1"
      commit mira 2026-03-02T09:15:00+01:00 "chore: initial project skeleton"
      cat > src/Repository/ProductRepository.php <<'EOF'
      <?php
      declare(strict_types=1);

      namespace Kiez\Repository;

      final class ProductRepository
      {
          private const PRODUCTS = [
              1 => ['name' => 'Kaffee Hausmischung', 'price' => 1290],
              2 => ['name' => 'Bio-Hafermilch', 'price' => 249],
              3 => ['name' => 'Kiez-Tasse', 'price' => 1500],
          ];

          public function all(): array
          {
              return self::PRODUCTS;
          }

          public function find(int $id): ?array
          {
              return self::PRODUCTS[$id] ?? null;
          }
      }
      EOF
      cat > src/Controller/ProductController.php <<'EOF'
      <?php
      declare(strict_types=1);

      namespace Kiez\Controller;

      use Kiez\Repository\ProductRepository;

      final class ProductController
      {
          public function index(): string
          {
              $lines = [];
              foreach ((new ProductRepository())->all() as $id => $product) {
                  $lines[] = sprintf('%d: %s (%d Cent)', $id, $product['name'], $product['price']);
              }
              return implode("\n", $lines);
          }
      }
      EOF
      routes "$R1" "$R2"
      commit mira 2026-03-04T14:40:00+01:00 "feat(catalog): list products"
      cat > src/Service/Cart.php <<'EOF'
      <?php
      declare(strict_types=1);

      namespace Kiez\Service;

      use Kiez\Repository\ProductRepository;

      final class Cart
      {
          private array $items = [];

          public function __construct(private ProductRepository $products)
          {
          }

          public function add(int $productId, int $quantity = 1): void
          {
              if ($this->products->find($productId) === null) {
                  throw new \InvalidArgumentException('Produkt nicht gefunden');
              }
              $this->items[$productId] = ($this->items[$productId] ?? 0) + $quantity;
          }

          public function subtotal(): int
          {
              $sum = 0;
              foreach ($this->items as $id => $quantity) {
                  $sum += $this->products->find($id)['price'] * $quantity;
              }
              return $sum;
          }
      }
      EOF
      cat > src/Controller/CartController.php <<'EOF'
      <?php
      declare(strict_types=1);

      namespace Kiez\Controller;

      use Kiez\Repository\ProductRepository;
      use Kiez\Service\Cart;

      final class CartController
      {
          public static function cart(): Cart
          {
              session_start();
              return $_SESSION['cart'] ??= new Cart(new ProductRepository());
          }

          public function show(): string
          {
              return sprintf('Zwischensumme: %d Cent', self::cart()->subtotal());
          }

          public function add(): string
          {
              self::cart()->add((int) ($_POST['product_id'] ?? 0));
              return 'Zum Warenkorb hinzugefügt';
          }
      }
      EOF
      routes "$R1" "$R2" "$R3"
      commit tom 2026-03-09T11:05:00+01:00 "feat(cart): add cart and endpoints"
      cat > tests/run.php <<'EOF'
      <?php
      declare(strict_types=1);

      require __DIR__ . '/../src/bootstrap.php';

      function expect_same(mixed $expected, mixed $actual): void
      {
          if ($expected !== $actual) {
              throw new RuntimeException('erwartet ' . var_export($expected, true) . ', bekommen ' . var_export($actual, true));
          }
      }

      $passed = 0;
      $failed = 0;
      foreach (glob(__DIR__ . '/*Test.php') as $file) {
          foreach (require $file as $name => $test) {
              try {
                  $test();
                  $passed++;
                  echo "  ok    $name\n";
              } catch (Throwable $e) {
                  $failed++;
                  echo "  FAIL  $name: {$e->getMessage()}\n";
              }
          }
      }
      echo "\n$passed bestanden, $failed fehlgeschlagen\n";
      exit($failed > 0 ? 1 : 0);
      EOF
      cat > tests/CartTest.php <<'EOF'
      <?php
      declare(strict_types=1);

      use Kiez\Repository\ProductRepository;
      use Kiez\Service\Cart;

      return [
          'cart sums up price times quantity' => function (): void {
              $cart = new Cart(new ProductRepository());
              $cart->add(1, 2);
              $cart->add(2);
              expect_same(2829, $cart->subtotal());
          },
          'cart rejects unknown products' => function (): void {
              try {
                  (new Cart(new ProductRepository()))->add(99);
              } catch (InvalidArgumentException) {
                  return;
              }
              throw new RuntimeException('keine Exception für Produkt 99');
          },
      ];
      EOF
      commit tom 2026-03-12T16:30:00+01:00 "test: add tiny test runner and cart tests"
      cat > src/Dto/OrderSummary.php <<'EOF'
      <?php
      declare(strict_types=1);

      namespace Kiez\Dto;

      final readonly class OrderSummary
      {
          public function __construct(
              public int $subtotal,
              public int $discount,
              public int $shipping,
              public int $total,
          ) {
          }
      }
      EOF
      cat > src/Service/PriceCalculator.php <<'EOF'
      <?php
      declare(strict_types=1);

      namespace Kiez\Service;

      use Kiez\Dto\OrderSummary;

      final class PriceCalculator
      {
          public function summarize(int $subtotal): OrderSummary
          {
              $shipping = $subtotal >= 5000 ? 0 : 495;

              return new OrderSummary($subtotal, 0, $shipping, $subtotal + $shipping);
          }
      }
      EOF
      cat > src/Controller/CheckoutController.php <<'EOF'
      <?php
      declare(strict_types=1);

      namespace Kiez\Controller;

      use Kiez\Service\PriceCalculator;

      final class CheckoutController
      {
          public function store(): string
          {
              $summary = (new PriceCalculator())->summarize(CartController::cart()->subtotal());

              return sprintf('Danke! Summe: %d Cent (Versand: %d Cent)', $summary->total, $summary->shipping);
          }
      }
      EOF
      cat > tests/PriceCalculatorTest.php <<'EOF'
      <?php
      declare(strict_types=1);

      use Kiez\Service\PriceCalculator;

      return [
          'orders below 50 euro pay shipping' => function (): void {
              $summary = (new PriceCalculator())->summarize(4999);
              expect_same(495, $summary->shipping);
              expect_same(5494, $summary->total);
          },
          'orders above 50 euro ship for free' => function (): void {
              expect_same(0, (new PriceCalculator())->summarize(6000)->shipping);
          },
      ];
      EOF
      routes "$R1" "$R2" "$R3" "$R4"
      commit mira 2026-03-18T10:20:00+01:00 "feat(checkout): calculate shipping and order total"
      cat > src/Service/PriceCalculator.php <<'EOF'
      <?php
      declare(strict_types=1);

      namespace Kiez\Service;

      use Kiez\Dto\OrderSummary;

      final class PriceCalculator
      {
          private const VOUCHERS = ['KIEZ10' => 10];

          public function summarize(int $subtotal, ?string $voucher = null): OrderSummary
          {
              $discount = 0;
              if ($voucher !== null) {
                  $percent = self::VOUCHERS[$voucher] ?? throw new \InvalidArgumentException('Gutschein ungültig');
                  $discount = intdiv($subtotal * $percent, 100);
              }
              $shipping = $subtotal - $discount >= 5000 ? 0 : 495;

              return new OrderSummary($subtotal, $discount, $shipping, $subtotal - $discount + $shipping);
          }
      }
      EOF
      sed -i "s/subtotal())/subtotal(), \$_POST['voucher'] ?? null)/" src/Controller/CheckoutController.php
      sed -i '$d' tests/PriceCalculatorTest.php
      cat >> tests/PriceCalculatorTest.php <<'EOF'
          'voucher KIEZ10 gives ten percent off' => function (): void {
              $summary = (new PriceCalculator())->summarize(10000, 'KIEZ10');
              expect_same(1000, $summary->discount);
              expect_same(9000, $summary->total);
          },
      ];
      EOF
      commit tom 2026-03-25T13:45:00+01:00 "feat(checkout): support voucher codes" "Refs: KIEZ-12"
      cat > src/Event/OrderPlaced.php <<'EOF'
      <?php
      declare(strict_types=1);

      namespace Kiez\Event;

      use Kiez\Dto\OrderSummary;

      final readonly class OrderPlaced
      {
          public function __construct(public OrderSummary $summary)
          {
          }
      }
      EOF
      cat > src/Event/EventDispatcher.php <<'EOF'
      <?php
      declare(strict_types=1);

      namespace Kiez\Event;

      use Kiez\Listener\SendOrderConfirmation;

      final class EventDispatcher
      {
          private array $listeners = [];

          public static function default(): self
          {
              $dispatcher = new self();
              $dispatcher->listen(OrderPlaced::class, new SendOrderConfirmation());
              return $dispatcher;
          }

          public function listen(string $event, callable $listener): void
          {
              $this->listeners[$event][] = $listener;
          }

          public function dispatch(object $event): void
          {
              foreach ($this->listeners[$event::class] ?? [] as $listener) {
                  $listener($event);
              }
          }
      }
      EOF
      cat > src/Listener/SendOrderConfirmation.php <<'EOF'
      <?php
      declare(strict_types=1);

      namespace Kiez\Listener;

      use Kiez\Event\OrderPlaced;

      final class SendOrderConfirmation
      {
          public function __invoke(OrderPlaced $event): void
          {
              error_log(sprintf('Bestellbestätigung über %d Cent verschickt', $event->summary->total));
          }
      }
      EOF
      cat > src/Controller/CheckoutController.php <<'EOF'
      <?php
      declare(strict_types=1);

      namespace Kiez\Controller;

      use Kiez\Event\EventDispatcher;
      use Kiez\Event\OrderPlaced;
      use Kiez\Service\PriceCalculator;

      final class CheckoutController
      {
          public function store(): string
          {
              try {
                  $summary = (new PriceCalculator())->summarize(CartController::cart()->subtotal(), $_POST['voucher'] ?? null);
              } catch (\InvalidArgumentException $e) {
                  http_response_code(422);
                  return $e->getMessage();
              }
              EventDispatcher::default()->dispatch(new OrderPlaced($summary));

              return sprintf('Danke! Summe: %d Cent (Versand: %d Cent)', $summary->total, $summary->shipping);
          }
      }
      EOF
      commit mira 2026-04-01T09:50:00+02:00 "feat(checkout): dispatch OrderPlaced event"
      sed -i -e 's/>= 5000 ? 0 : 495/> self::FREE_SHIPPING_FROM ? 0 : self::SHIPPING_COST/' \
        -e 's/^    private const VOUCHERS.*/    private const FREE_SHIPPING_FROM = 5000;\n    private const SHIPPING_COST = 495;\n&/' src/Service/PriceCalculator.php
      commit tom 2026-04-08T17:10:00+02:00 "refactor(pricing): extract shipping constants" "Replaces magic numbers with named constants. Refs: KIEZ-17"
      printf '\n## Lokal starten\n\n    make serve   # startet http://localhost:8000\n    make test    # führt alle Tests aus\n\nVoraussetzung: PHP 8.5, keine weiteren Pakete.\n' >> README.md
      commit mira 2026-04-15T08:30:00+02:00 "docs: describe local setup in readme"
      sed -i '$d' tests/PriceCalculatorTest.php
      cat >> tests/PriceCalculatorTest.php <<'EOF'
          'orders of exactly 50 euro ship for free' => function (): void {
              expect_same(0, (new PriceCalculator())->summarize(5000)->shipping);
          },
      ];
      EOF
      commit tom 2026-04-22T15:00:00+02:00 "test(pricing): cover free shipping boundary" "Customer report: orders of exactly 50.00 EUR are charged shipping. Refs: KIEZ-23"
    checks:
      - type: command
        run: tr -d '[:space:]' < listener.txt
        stdout_equals: SendOrderConfirmation
        message: In listener.txt steht noch nicht der richtige Listener. Suche mit grep -rn nach OrderPlaced – wo wird ein Listener dafür registriert?
      - type: command
        run: tr -d '[:space:]' < dto.txt
        stdout_equals: OrderSummary
        message: In dto.txt steht noch nicht die richtige Klasse. Sieh dir den Rückgabetyp von summarize() an – er steht hinter dem Doppelpunkt der Signatur.
    hints:
      - "`grep -rn OrderPlaced src` zeigt, wo das Event erzeugt, registriert und verarbeitet wird."
      - "In `src/Event/EventDispatcher.php` verbindet `listen(…)` ein Event mit einem Listener."
      - "`grep -n 'function summarize' src/Service/PriceCalculator.php` zeigt die Signatur samt Rückgabetyp."
    solution: |
      ```bash
      cd kiezladen-muster
      grep -rn OrderPlaced src
      grep -n "function summarize" src/Service/PriceCalculator.php
      echo SendOrderConfirmation > listener.txt
      echo OrderSummary > dto.txt
      ```
  - id: muster-zuordnen
    type: dragdrop
    title: Welches Muster steckt dahinter?
    description: Ordne jeden Code-Ausschnitt dem Muster zu, das er zeigt.
    targets:
      - { id: dto, label: DTO }
      - { id: event, label: Event und Listener }
      - { id: di, label: Dependency Injection }
      - { id: repository, label: Repository }
    items:
      - { label: "final readonly class OrderSummary { public function __construct(public int $total) {} }", target: dto }
      - { label: "$dispatcher->listen(OrderPlaced::class, new SendOrderConfirmation());", target: event }
      - { label: "public function __construct(private ProductRepository $products) {}", target: di }
      - { label: "public function find(int $id): ?array", target: repository }
      - { label: "public function __invoke(OrderPlaced $event): void", target: event }
    hints:
      - Ein Konstruktor, der eine andere Klasse als Parameter bekommt, ist das Kennzeichen von Dependency Injection.
---
Im Kiezladen gibt es Ordner namens `Dto`, `Event` und `Listener`. Vielleicht hast du diese Begriffe noch nie
gehört. Das ist normal: Jedes Projekt nutzt Muster, die du (noch) nicht kennst. Die gute Nachricht: Du musst
ein Muster nicht in allen Einzelheiten verstehen, um den Code zu lesen. Es reicht, seine **Rolle** zu kennen.

## Muster sind Abkürzungen

Ein [[entwurfsmuster|Entwurfsmuster]] ist eine bewährte Lösung für ein wiederkehrendes Problem. Der Name
eines Musters steckt oft im Klassen- oder Ordnernamen. Für dich als Leser:in ist er eine Abkürzung: Weißt du,
was ein „Listener“ ist, weißt du schon viel über `SendOrderConfirmation`, bevor du die Datei öffnest.

So gehst du bei einem unbekannten Muster vor:

1. **Ein Beispiel lesen:** Öffne die kleinste Klasse dieser Art.
2. **Verwendung suchen:** Wer erzeugt sie, wer ruft sie auf?
3. **Nachschlagen:** Die Doku des Frameworks erklärt die Konvention meist in wenigen Absätzen.
4. **Notieren:** Halte die Rolle in einem Satz fest.

## Controller, Service und Dependency Injection

Ein [[controller|Controller]] sollte dünn sein: Request annehmen, Arbeit delegieren, Antwort zurückgeben. Die
eigentlichen Regeln stecken in einer [[service-klasse|Service-Klasse]] wie dem `PriceCalculator`. Suchst du
nach einer Geschäftsregel, schaust du deshalb zuerst in die Services.

Oft bekommen Klassen das, was sie brauchen, im Konstruktor übergeben, statt es selbst zu erzeugen. Das heißt
[[dependency-injection|Dependency Injection]]:

```php title="src/Service/Cart.php (Auszug)"
public function __construct(private ProductRepository $products)
{
}
```

Für dich heißt das: Die Konstruktor-Parameter sind eine Liste der Abhängigkeiten einer Klasse. In Laravel
erzeugt der Service Container solche Objekte automatisch – deshalb siehst du dort selten ein `new`.

## DTOs: Daten in einer festen Form

Ein [[dto|DTO]] (Data Transfer Object) transportiert Daten zwischen Teilen der Anwendung. Es hat Eigenschaften,
aber keine Logik:

```php title="src/Dto/OrderSummary.php"
final readonly class OrderSummary
{
    public function __construct(
        public int $subtotal,
        public int $discount,
        public int $shipping,
        public int $total,
    ) {
    }
}
```

Statt eines Arrays mit beliebigen Schlüsseln weißt du genau, was drin ist. `readonly` sorgt dafür, dass sich
die Werte nach dem Erzeugen nicht mehr ändern.

## Events und Listener

Ein [[event|Event]] meldet: „Etwas ist passiert.“ Ein [[event-listener|Listener]] reagiert darauf. Der
Auslöser weiß nicht, wer zuhört. Dadurch kann man neue Reaktionen hinzufügen, ohne den Checkout anzufassen.

```php title="Auslösen und Reagieren"
// CheckoutController: das Ereignis melden
EventDispatcher::default()->dispatch(new OrderPlaced($summary));

// EventDispatcher::default(): wer reagiert?
$dispatcher->listen(OrderPlaced::class, new SendOrderConfirmation());
```

Um herauszufinden, was nach einem `dispatch` passiert, suchst du nach dem Klassennamen des Events. In
Laravel listet `php artisan event:list` alle Events mit ihren Listenern auf.

> [!FEHLER]
> „Nach `dispatch()` passiert nichts weiter, die Zeile kann weg.“ Die Wirkung steckt in den Listenern – hier
> eine Bestellbestätigung. Wer die Zeile löscht, verschickt keine Bestätigungen mehr.

## Weitere Muster auf einen Blick

| Name oder Endung | Rolle |
|---|---|
| `…Repository` | Lädt und speichert Daten ([[repository-muster|Repository-Muster]]) |
| `…Factory` | Erzeugt komplizierte Objekte |
| `…Middleware` | Läuft vor oder nach jedem Request, z. B. für die Anmeldung |
| `…Job` | Arbeit, die im Hintergrund erledigt wird |
| `…Policy` | Entscheidet, ob jemand etwas darf |

> [!MERKSATZ]
> Erkenne die Rolle, nicht jedes Detail. Ein Muster zu benennen ist der halbe Weg, es zu verstehen.

> [!PRAXIS]
> In großen Projekten trennt man oft strikt: Controller sind dünn, Services enthalten die Regeln, DTOs
> transportieren Daten, Events entkoppeln Nebenwirkungen. Wer das einmal erkannt hat, findet sich in vielen
> Projekten schnell zurecht.

## Zusammenfassung

- Muster sind Abkürzungen: Klassen- und Ordnernamen verraten Rollen.
- Controller sind dünn, Services enthalten die Geschäftslogik.
- Konstruktor-Parameter zeigen die Abhängigkeiten einer Klasse (Dependency Injection).
- DTOs transportieren Daten ohne Logik, oft `readonly`.
- Nach einem `dispatch` wirken die Listener – suche nach dem Event-Namen, um sie zu finden.
