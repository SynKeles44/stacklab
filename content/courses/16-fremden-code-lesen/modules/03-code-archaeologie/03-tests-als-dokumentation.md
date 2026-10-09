---
title: Tests als Dokumentation lesen
summary: Wie dir Tests verraten, was Code tun soll, wie du sie in fremden Projekten findest und wie du mit einem eigenen Test eine Vermutung prüfst.
duration: 25
sources:
  - title: PHPUnit – Writing Tests
    url: https://docs.phpunit.de/en/12.0/writing-tests-for-phpunit.html
  - title: Pest – Writing Tests
    url: https://pestphp.com/docs/writing-tests
  - title: Laravel 13 – Testing
    url: https://laravel.com/docs/13.x/testing
  - title: Node.js – Test runner
    url: https://nodejs.org/api/test.html
quiz:
  - type: single
    question: Warum lohnt es sich, in einem fremden Projekt zuerst die Tests zu einer Klasse zu lesen?
    options:
      - Weil Tests immer kürzer sind als der Code.
      - Weil Tests zeigen, wie die Klasse benutzt wird und welches Verhalten gewünscht ist – inklusive Randfällen.
      - Weil Tests nie Fehler enthalten.
      - Weil man den Code dann nicht mehr lesen muss.
    answer: 1
    explanation: >
      Tests sind ausführbare Beispiele: Sie zeigen Aufrufe, Eingaben und erwartete Ergebnisse. Was dort steht,
      war jemandem wichtig genug, es abzusichern.
  - type: match
    question: Ordne jedem Teil eines Tests nach Arrange-Act-Assert seine Zeile zu.
    pairs:
      - { left: "Arrange", right: "$cart = new Cart(new ProductRepository());" }
      - { left: "Act", right: "$cart->add(1, 2);" }
      - { left: "Assert", right: "expect_same(2580, $cart->subtotal());" }
    explanation: >
      Erst wird die Ausgangslage hergestellt, dann die zu testende Aktion ausgeführt, dann das Ergebnis geprüft.
  - type: multiple
    question: "Ein Test heißt `orders below 50 euro pay shipping` und prüft den Wert 4999. Was lernst du daraus?"
    options:
      - Unter 50 € (5000 Cent) kostet der Versand etwas.
      - Preise werden in Cent gerechnet.
      - Der Versand kostet immer 4999 Cent.
      - Die Grenze liegt bei 50 € – 4999 Cent ist knapp darunter.
    answers: [0, 1, 3]
    explanation: >
      Gute Tests prüfen Werte direkt an Grenzen. 4999 statt 5000 verrät, wo die Grenze liegt und dass in Cent
      gerechnet wird.
  - type: cloze
    text: Ein Test, der sicherstellt, dass ein behobener Fehler nicht wiederkommt, heißt ___test. Die Prüfung im Test, ob ein Ergebnis stimmt, nennt man ___.
    blanks:
      - [Regressions, Regression]
      - [Assertion, Zusicherung, Assert]
    explanation: Der Test `orders of exactly 50 euro ship for free` ist ein Regressionstest. Assertions wie `expect_same` prüfen das Ergebnis.
tasks:
  - id: test-als-frage
    type: terminal
    title: Dokumentiere unbekannte Gutscheine mit einem Test
    description: |
      Klicke zuerst auf **Aufgabe vorbereiten**. Im Ordner `kiezladen-testlesen` liegt der Kiezladen.

      In `tests/PriceCalculatorTest.php` fehlt ein Test dafür, was bei einem **unbekannten** Gutscheincode
      passiert. Du vermutest: Es wird eine `InvalidArgumentException` geworfen.

      1. Lies `tests/PriceCalculatorTest.php` und `tests/CartTest.php`. Wie ist ein Test aufgebaut, wie wird
         eine erwartete Exception geprüft?
      2. Ergänze in `tests/PriceCalculatorTest.php` einen Test, dessen Name das Wort `voucher` enthält. Er ruft
         `summarize()` mit einem unbekannten Code auf (z. B. `GIBTSNICHT`) und ist nur grün, wenn eine
         `InvalidArgumentException` geworfen wird.
      3. Führe die Tests aus. Dein neuer Test muss grün sein. Der bekannte rote Test bleibt rot – den behebst
         du im Abschlussprojekt.

      Ändere nichts im Ordner `src`.
    workdir: kiezladen-testlesen
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
      - type: file_contains
        path: tests/PriceCalculatorTest.php
        pattern: "InvalidArgumentException"
        message: Dein Test prüft noch nicht auf eine InvalidArgumentException. Schau dir an, wie CartTest.php das für unbekannte Produkte macht.
      - type: command
        run: php tests/run.php | grep -E '^  ok' | grep -ci voucher
        stdout_matches: "^\\s*2\\s*$"
        message: Es sollen zwei grüne Tests mit „voucher“ im Namen geben – der vorhandene und deiner. Prüfe Name und Ablauf deines Tests mit php tests/run.php.
      - type: command
        run: php tests/run.php | tail -n 1
        stdout_matches: "^6 bestanden, 1 fehlgeschlagen$"
        message: Die Testbilanz stimmt nicht. Erwartet sind 6 grüne Tests (5 alte + deiner) und weiterhin 1 roter.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          cp -r src tests "$d"/
          sed -i "s/?? throw new \\\\InvalidArgumentException('Gutschein ungültig')/?? 0/" "$d/src/Service/PriceCalculator.php"
          n=$(cd "$d" && php tests/run.php | grep -E '^  FAIL' | grep -ci voucher)
          rm -rf "$d"
          echo "$n"
        stdout_matches: "^\\s*1\\s*$"
        message: Dein Test würde nicht merken, wenn keine Exception mehr geworfen wird. Er darf nur dann grün sein, wenn summarize() wirklich eine InvalidArgumentException wirft – sonst muss er scheitern.
      - type: command
        run: git status --porcelain -- src | wc -l
        stdout_matches: "^\\s*0\\s*$"
        message: Du hast Dateien in src geändert. Setze sie mit git restore src zurück – hier wird nur ein Test ergänzt.
    hints:
      - "Ein Test ist ein Eintrag im zurückgegebenen Array: `'name' => function (): void { … },` – füge ihn vor der letzten Zeile `];` ein."
      - "In `CartTest.php` steht das Muster: `try { … } catch (InvalidArgumentException) { return; }` und danach `throw new RuntimeException('…');`."
      - "Ruf im try-Block `(new PriceCalculator())->summarize(1000, 'GIBTSNICHT');` auf."
    solution: |
      ```bash
      cd kiezladen-testlesen
      cat tests/CartTest.php tests/PriceCalculatorTest.php
      sed -i '$d' tests/PriceCalculatorTest.php
      cat >> tests/PriceCalculatorTest.php <<'EOF'
          'unknown voucher is rejected' => function (): void {
              try {
                  (new PriceCalculator())->summarize(1000, 'GIBTSNICHT');
              } catch (InvalidArgumentException) {
                  return;
              }
              throw new RuntimeException('keine Exception für unbekannten Gutschein');
          },
      ];
      EOF
      php tests/run.php
      ```
  - id: preis-formatieren
    type: code
    language: php
    title: Die Tests sind die Spezifikation
    description: |
      Im Kiezladen sollen Preise in Cent künftig schön formatiert ausgegeben werden. Eine Kollegin hat schon die
      Tests geschrieben – sie sind die einzige Beschreibung der gewünschten Funktion.

      Lies die Tests (unten) genau und implementiere `formatCents(int $cents): string` so, dass alle grün werden.
      Achte auf Randfälle: Was passiert bei kleinen Beträgen und bei Tausendern?
    starter: |
      <?php
      function formatCents(int $cents): string
      {
          return '';
      }
    tests:
      - name: "1290 Cent werden zu 12,90 €"
        code: "assert_same('12,90 €', formatCents(1290));"
      - name: "Kleine Beträge haben eine führende Null"
        code: "assert_same('0,05 €', formatCents(5));"
      - name: "0 Cent werden zu 0,00 €"
        code: "assert_same('0,00 €', formatCents(0));"
      - name: "Tausender bekommen einen Punkt"
        code: "assert_same('1.234,56 €', formatCents(123456));"
    hints:
      - "Die Tests verraten das Format: Komma als Dezimaltrenner, Punkt als Tausendertrenner, Leerzeichen vor dem €."
      - "`number_format($zahl, 2, ',', '.')` formatiert eine Zahl mit zwei Nachkommastellen und deutschen Trennzeichen."
    solution: |
      <?php
      function formatCents(int $cents): string
      {
          return number_format($cents / 100, 2, ',', '.') . ' €';
      }
---
Du sollst eine Klasse ändern, die du nie gesehen hast. Bevor du ihren Code liest, schaust du in ihre Tests.
Dort steht in Beispielen, was die Klasse können soll – samt der Fälle, an die beim Schreiben jemand gedacht
hat. Tests sind die einzige Dokumentation, die garantiert zum aktuellen Code passt: Sonst wären sie rot.

## Tests sind ausführbare Beispiele

Ein [[automatisierter-test|automatisierter Test]] ruft Code mit festen Eingaben auf und prüft das Ergebnis.
Für dich als Leser:in sind Tests deshalb eine [[spezifikation|Spezifikation]] mit Beispielen. Schon die
Testnamen lesen sich wie Anforderungen:

```text title="Die Tests des Kiezladens als Anforderungsliste"
cart sums up price times quantity
cart rejects unknown products
orders below 50 euro pay shipping
orders above 50 euro ship for free
voucher KIEZ10 gives ten percent off
orders of exactly 50 euro ship for free
```

In sechs Zeilen kennst du die wichtigsten Geschäftsregeln des Shops – ohne eine Zeile Code gelesen zu haben.

> [!MERKSATZ]
> Tests zeigen dir, **wie** Code benutzt wird und **was** er tun soll. Lies sie, bevor du den Code liest.

## Aufbau eines Tests: Arrange, Act, Assert

Die meisten Tests folgen dem Muster [[arrange-act-assert|Arrange-Act-Assert]]:

```php title="tests/CartTest.php (Auszug)"
'cart sums up price times quantity' => function (): void {
    $cart = new Cart(new ProductRepository());   // Arrange: Ausgangslage
    $cart->add(1, 2);                            // Act: die Aktion
    $cart->add(2);
    expect_same(2829, $cart->subtotal());        // Assert: Ergebnis prüfen
},
```

Aus diesen fünf Zeilen lernst du: Ein `Cart` braucht ein `ProductRepository`, `add()` nimmt eine Produkt-ID
und eine Menge, und Preise sind ganze Zahlen in Cent. Die Prüfung `expect_same` ist eine
[[assertion|Assertion]] – ein kleiner Test-Runner im Ordner `tests/` führt alle Tests aus.

## Was du aus Tests herausliest

| Im Test | Was er dir verrät |
|---|---|
| Testname | Die Anforderung in einem Satz |
| Arrange-Teil | Welche Abhängigkeiten eine Klasse braucht |
| Eingabewerte wie `4999` und `5000` | Wo Grenzen liegen ([[randfall|Randfälle]]) |
| Erwartete Exceptions | Welche Fehlerfälle es gibt |
| Fehlende Tests | Welches Verhalten nie abgesichert wurde |

Der Wert `4999` im Versandtest ist kein Zufall: Er liegt einen Cent unter der Grenze. Der neueste Test prüft
genau `5000` – und ist rot. Er beschreibt also ein gewünschtes Verhalten, das der Code gerade nicht erfüllt.

## Tests in fremden Projekten finden und ausführen

Jedes Ökosystem hat seine Konventionen:

| Projekt | Hier liegen Tests | Einzelnen Test ausführen |
|---|---|---|
| Laravel mit Pest oder PHPUnit | `tests/Unit`, `tests/Feature` | `php artisan test --filter=Shipping` |
| PHP mit PHPUnit | `tests/`, Endung `Test.php` | `vendor/bin/phpunit --filter Shipping` |
| Node mit Vitest | `*.test.ts` neben dem Code | `npx vitest run src/price.test.ts` |
| Node ohne Framework | `*.test.js` | `node --test` |

Ein [[unit-test|Unit-Test]] prüft eine einzelne Klasse isoliert. Ein Feature- oder Integrationstest schickt
dagegen einen echten Request durch die Anwendung – er zeigt dir zusätzlich, wie die Teile zusammenspielen.

## Mit einem Test eine Vermutung prüfen

Bist du unsicher, was Code bei einer bestimmten Eingabe tut, schreibst du einen Test dafür. Er beantwortet
deine Frage verlässlich und bleibt danach als Dokumentation erhalten. Behebst du einen Fehler, sichert ein
[[regressionstest|Regressionstest]] ab, dass er nicht zurückkommt.

> [!FEHLER]
> Einen roten Test so „anpassen“, dass er zum fehlerhaften Code passt. Steht im Test `5000` → gratis Versand,
> dann ist der Test die Anforderung. Geändert wird der Code, nicht die Erwartung – es sei denn, die Anforderung
> selbst hat sich geändert, und das klärst du vorher mit dem Team.

> [!PRAXIS]
> In vielen Teams beginnt die Arbeit an einem Bug mit einem Test, der ihn nachstellt. Erst wenn der Test rot
> ist, wird der Fehler behoben. Genau so ist auch der rote Test im Kiezladen entstanden.

## Zusammenfassung

- Tests sind ausführbare Beispiele und die verlässlichste Dokumentation eines Projekts.
- Testnamen lesen sich wie Anforderungen, Eingabewerte verraten Grenzen und Randfälle.
- **Arrange-Act-Assert:** Ausgangslage herstellen, Aktion ausführen, Ergebnis prüfen.
- Jedes Ökosystem hat feste Orte für Tests und eine Möglichkeit, einzelne Tests zu starten.
- Mit einem eigenen Test prüfst du Vermutungen. Bei Bugs ändert sich der Code, nicht der Test.
