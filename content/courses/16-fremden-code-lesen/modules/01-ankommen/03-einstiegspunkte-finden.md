---
title: Einstiegspunkte finden
summary: Wo ein Programm beginnt – vom Front Controller über Routen bis zu CLI-Befehlen – und wie du von dort zum zuständigen Code kommst.
duration: 20
sources:
  - title: Laravel 13 – Routing
    url: https://laravel.com/docs/13.x/routing
  - title: Laravel 13 – Request Lifecycle
    url: https://laravel.com/docs/13.x/lifecycle
  - title: npm Docs – package.json (main, bin, scripts)
    url: https://docs.npmjs.com/cli/v11/configuring-npm/package-json
  - title: PHP-Handbuch – Autoloading von Klassen
    url: https://www.php.net/manual/de/language.oop5.autoload.php
quiz:
  - type: single
    question: Was ist ein Front Controller?
    options:
      - Eine Datei, die jede Anfrage an eine Webanwendung als Erstes entgegennimmt und weiterverteilt.
      - Der Controller, der die Startseite anzeigt.
      - Ein Programm, das das Frontend kompiliert.
      - Eine Datenbanktabelle mit allen URLs.
    answer: 0
    explanation: >
      In vielen PHP-Projekten ist `public/index.php` der Front Controller: Der Webserver schickt jede Anfrage
      dorthin, und von dort aus entscheidet der Router, welcher Code zuständig ist.
  - type: match
    question: Ordne jeder Projektart ihren typischen Einstiegspunkt zu.
    pairs:
      - { left: "Laravel-Webanwendung", right: "public/index.php und routes/web.php" }
      - { left: "Laravel-Konsolenbefehl", right: "artisan und app/Console/Commands" }
      - { left: "React-App mit Vite", right: "index.html und src/main.tsx" }
      - { left: "Node-Kommandozeilenwerkzeug", right: "Feld bin in package.json" }
    explanation: >
      Jede Projektart hat ihre festen Türen. Kennst du die Konvention, findest du den Einstieg in Sekunden.
  - type: find-bug
    question: Die Route soll `POST /cart/add` mit der Methode `add` des CartControllers verbinden. In welcher Zeile steckt der Fehler?
    language: php
    code: |
      $router = new Router();
      $router->get("/", fn () => "Willkommen");
      $router->get("/cart", [new Controller\CartController(), "show"]);
      $router->get("/cart/add", [new Controller\CartController(), "add"]);
      return $router;
    bug_line: 4
    explanation: >
      Für `/cart/add` wurde `get` statt `post` registriert. Ein Formular, das per POST schickt, bekäme jetzt
      „Seite nicht gefunden“, weil der Router nur unter GET nachschaut.
  - type: cloze
    text: Die Datei, die jede Web-Anfrage zuerst entgegennimmt, heißt ___ Controller. Die Liste, welche URL zu welchem Code führt, nennt man ___.
    blanks:
      - [Front]
      - [Routen, Routes, Routing, Routentabelle]
    explanation: Front Controller nimmt alle Anfragen an, die Routen verteilen sie an den richtigen Handler.
tasks:
  - id: route-verfolgen
    type: terminal
    title: Wer bearbeitet POST /cart/add?
    description: |
      Klicke zuerst auf **Aufgabe vorbereiten**. Im Ordner `kiezladen-einstieg` liegt der Kiezladen.

      1. Öffne den Front Controller `public/index.php` und finde heraus, welche Datei die Routen festlegt.
      2. Suche dort die Route für `POST /cart/add`.
      3. Schreibe Klasse und Methode im Format `Klasse::methode` in die Datei `antwort.txt`,
         zum Beispiel `ProductController::index`.
    workdir: kiezladen-einstieg
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
      - type: file_exists
        path: antwort.txt
        message: Lege die Datei antwort.txt an.
      - type: command
        run: tr -d '[:space:]' < antwort.txt
        stdout_matches: "^(Kiez\\\\Controller\\\\)?CartController::add(\\(\\))?$"
        message: "In antwort.txt steht noch nicht die richtige Methode. Achte auf post (nicht get) und auf das Format Klasse::methode."
    hints:
      - "In `public/index.php` steht ein `require` auf die Datei mit den Routen."
      - "`cat src/routes.php` – jede Zeile verbindet Methode, Pfad und Handler."
      - "Der Handler `[new Controller\\XyController(), \"methode\"]` bedeutet: Methode `methode` der Klasse `XyController`."
    solution: |
      ```bash
      cd kiezladen-einstieg
      cat public/index.php
      cat src/routes.php
      echo "CartController::add" > antwort.txt
      ```
      In `src/routes.php` steht `$router->post("/cart/add", [new Controller\CartController(), "add"]);`.
  - id: einstieg-zuordnen
    type: dragdrop
    title: Wo fängt es an?
    description: Ordne jede Datei der Art von Einstiegspunkt zu, die sie typischerweise ist.
    targets:
      - { id: web, label: Web-Anfragen }
      - { id: cli, label: Befehle im Terminal }
      - { id: frontend, label: Start einer Frontend-App im Browser }
    items:
      - { label: "public/index.php", target: web }
      - { label: "routes/api.php", target: web }
      - { label: "artisan", target: cli }
      - { label: "bin/cli.js (Feld bin in package.json)", target: cli }
      - { label: "src/main.tsx", target: frontend }
      - { label: "index.html eines Vite-Projekts", target: frontend }
    hints:
      - Was startet ein Mensch im Terminal, was ruft ein Browser auf?
---
Du kennst jetzt die Ordner des Kiezladens. Aber wo fängt das Programm eigentlich an? Wenn du `/products`
im Browser aufrufst, muss irgendeine Datei als Erstes reagieren. Diese Stellen heißen
[[einstiegspunkt|Einstiegspunkte]] – und wer sie kennt, findet zu jedem Verhalten den passenden Code.

## Jedes Programm hat Eingangstüren

Ein Einstiegspunkt ist die Stelle, an der die Ausführung beginnt. Ein Programm kann mehrere davon haben,
wie ein Haus mit Vordertür, Hintertür und Garage:

| Tür | Wer kommt herein? | Beispiel |
|---|---|---|
| Web | Ein Browser oder eine App schickt einen [[http-request|HTTP-Request]] | `public/index.php` |
| Kommandozeile | Ein Mensch oder ein Cronjob startet einen Befehl | `php artisan`, `bin/cli.js` |
| Hintergrund | Ein Worker holt Aufträge aus einer Warteschlange | Queue-Worker |
| Tests | Der Test-Runner ruft Code direkt auf | `tests/run.php` |

Wenn du eine Frage zum Verhalten hast, fragst du zuerst: **Durch welche Tür kommt diese Anfrage herein?**

## Typische Einstiegspunkte nach Projektart

Frameworks halten sich an feste Konventionen. Diese Tabelle spart dir viel Suchzeit:

| Projektart | Hier beginnt es |
|---|---|
| PHP ohne Framework | `public/index.php` |
| Laravel | `public/index.php`, Routen in `routes/web.php` und `routes/api.php`, Befehle über `artisan` |
| Node-Server | `scripts.start` und `main` in `package.json`, oft `src/index.ts` oder `server.ts` |
| React mit Vite | `index.html` lädt `src/main.tsx` |
| Node-CLI | Feld `bin` in `package.json` |

```bash title="Einstiegspunkte eines Node-Projekts ablesen"
jq '{main, bin, scripts}' package.json
```

## Der Front Controller

Viele Webanwendungen haben genau eine Datei, die **jede** Anfrage annimmt: den
[[front-controller|Front Controller]]. Im Kiezladen ist das `public/index.php`:

```php title="public/index.php"
require __DIR__ . '/../src/bootstrap.php';

$router = require __DIR__ . '/../src/routes.php';
echo $router->dispatch($_SERVER['REQUEST_METHOD'], parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
```

Drei Zeilen, drei Hinweise für dich:

1. `bootstrap.php` richtet einen [[autoloader|Autoloader]] ein. Er lädt Klassen automatisch, sobald sie
   gebraucht werden. Der [[namespace|Namespace]] `Kiez\Service` zeigt dabei auf den Ordner `src/Service/`.
2. `routes.php` liefert einen [[http-router|Router]] mit allen bekannten Adressen.
3. `dispatch()` sucht zur HTTP-Methode und zum Pfad den passenden Code und führt ihn aus.

## Routen: die Landkarte der URLs

Eine [[web-route|Route]] verbindet eine [[http-methode|HTTP-Methode]] und einen Pfad mit dem Code, der
antwortet. Diesen Code nennt man Handler – meist eine Methode in einem [[controller|Controller]].

```php title="src/routes.php (Auszug)"
$router->get("/products", [new Controller\ProductController(), "index"]);
$router->post("/cart/add", [new Controller\CartController(), "add"]);
```

Lies das so: Ein `POST` auf `/cart/add` ruft die Methode `add` der Klasse `CartController` auf. In Laravel
zeigt `php artisan route:list` dieselbe Information als Tabelle für alle Routen des Projekts.

> [!MERKSATZ]
> Die Routen-Datei ist das Inhaltsverzeichnis einer Webanwendung. Von dort findest du zu jeder URL ihren
> Controller.

## Die vergessenen Türen

Nicht jedes Verhalten beginnt mit einem Klick im Browser. Gerade bei rätselhaften Fehlern lohnt ein Blick auf
die anderen Eingänge: geplante Aufgaben (Cronjobs), Konsolenbefehle und Hintergrundjobs.

> [!FEHLER]
> „In den Routen kommt diese Funktion nicht vor – also wird sie nie aufgerufen.“ Vielleicht doch: von einem
> nächtlichen Konsolenbefehl oder einem Listener, der auf ein Ereignis reagiert. Prüfe alle Türen, bevor du
> Code für tot erklärst.

> [!PRAXIS]
> In großen Laravel-Projekten liegen Einstiegspunkte verteilt: Web- und API-Routen, Artisan-Befehle,
> Queue-Jobs und der Scheduler. Wer neu ist, schreibt sich diese Türen als Erstes in seine Notizen.

## Zusammenfassung

- Ein **Einstiegspunkt** ist die Stelle, an der die Ausführung beginnt. Programme haben oft mehrere.
- Frage bei jedem Verhalten: Durch welche Tür (Web, Kommandozeile, Hintergrund, Test) kommt es herein?
- Der **Front Controller** (`public/index.php`) nimmt alle Web-Anfragen an und reicht sie an den Router.
- **Routen** verbinden Methode und Pfad mit einem Handler, meist einer Controller-Methode.
- Konventionen helfen: `package.json`, `artisan`, `routes/` oder `src/main.tsx` verraten den Einstieg.
