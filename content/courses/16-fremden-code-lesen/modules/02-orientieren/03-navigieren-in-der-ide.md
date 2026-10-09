---
title: Navigieren in der IDE
summary: Go to Definition, Find Usages und Call Hierarchy – wie deine IDE Code versteht, wo sie an Grenzen stößt und wann grep doch besser ist.
duration: 20
sources:
  - title: PhpStorm – Source code navigation
    url: https://www.jetbrains.com/help/phpstorm/navigating-through-the-source-code.html
  - title: PhpStorm – Find usages
    url: https://www.jetbrains.com/help/phpstorm/find-highlight-usages.html
  - title: Visual Studio Code – Code Navigation
    url: https://code.visualstudio.com/docs/editing/editingevolved
quiz:
  - type: single
    question: Warum findet „Find Usages“ in der IDE manchmal Aufrufe, die eine Textsuche nach `CartController::cart` übersieht?
    options:
      - Weil die IDE heimlich das Internet durchsucht.
      - Weil die IDE den Code versteht und auch Aufrufe wie `self::cart()` derselben Methode zuordnet.
      - Weil grep keine PHP-Dateien lesen kann.
      - Weil die IDE alle Kommentare ignoriert.
    answer: 1
    explanation: >
      Die IDE kennt Klassen, Methoden und Namespaces. Innerhalb der Klasse heißt der Aufruf `self::cart()` – die
      Textsuche nach `CartController::cart` findet ihn nicht, die IDE schon.
  - type: match
    question: Ordne jeder IDE-Funktion ihre Frage zu.
    pairs:
      - { left: "Go to Definition", right: "Wo ist diese Methode geschrieben?" }
      - { left: "Find Usages", right: "Wo wird diese Methode benutzt?" }
      - { left: "Call Hierarchy", right: "Über welche Kette von Aufrufen komme ich hierher?" }
      - { left: "Go to File / Search Everywhere", right: "Wo ist die Datei mit diesem Namen?" }
    explanation: Diese vier Funktionen ersetzen beim Lesen einen Großteil der Suche von Hand.
  - type: multiple
    question: In welchen Fällen kann die IDE Verwendungen nicht sicher finden?
    options:
      - Der Methodenname steht als String in einem Array, z. B. `[new CartController(), "add"]`.
      - Ein Aufruf wie `$listener($event)`, bei dem erst zur Laufzeit feststeht, welche Funktion es ist.
      - Ein normaler Aufruf `$calculator->summarize(…)` mit Typangabe.
      - Ein `new PriceCalculator()` mit passendem `use`-Import.
    answers: [0, 1]
    explanation: >
      Dynamische Aufrufe kann die statische Analyse nur teilweise auflösen. Dann hilft eine Textsuche nach dem
      Namen als Ergänzung.
  - type: cloze
    text: Das Hintergrundprogramm, das einem Editor Code-Verständnis liefert, heißt Language ___. In PhpStorm springst du mit Strg/Cmd + ___ zur Definition.
    blanks:
      - [Server]
      - [B, Klick, Click]
    explanation: Language Server liefern Funktionen wie Go to Definition auch an einfache Editoren. In PhpStorm geht das mit Strg+B bzw. Cmd+B oder per Klick mit gedrückter Taste.
tasks:
  - id: verwendungen-finden
    type: terminal
    title: Wo wird CartController::cart() benutzt?
    description: |
      Klicke zuerst auf **Aufgabe vorbereiten**. Im Ordner `kiezladen-verwendungen` liegt der Kiezladen.

      Die statische Methode `cart()` im `CartController` holt den Warenkorb aus der Session. Bevor jemand sie
      ändert, muss klar sein, wo sie überall aufgerufen wird.

      1. Finde **alle** Dateien, in denen `cart()` aufgerufen wird. Die Definition selbst zählt nicht, Aufrufe
         innerhalb derselben Klasse aber schon.
      2. Schreibe die Pfade (relativ zum Projektordner, z. B. `src/Ordner/Datei.php`) in die Datei
         `verwendungen.txt`, eine Datei pro Zeile.

      Achtung: Eine Suche nur nach `CartController::cart` übersieht etwas.
    workdir: kiezladen-verwendungen
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
        path: verwendungen.txt
        message: Lege die Datei verwendungen.txt an.
      - type: command
        run: sed 's#^\./##; s/[[:space:]]*$//' verwendungen.txt | grep -v '^$' | sort -u | paste -sd' ' -
        stdout_equals: src/Controller/CartController.php src/Controller/CheckoutController.php
        message: In verwendungen.txt fehlt eine Datei oder es steht eine zu viel. Denk an Aufrufe innerhalb der Klasse selbst – dort heißt der Aufruf self::cart().
    hints:
      - "`grep -rn \"cart()\" src` findet alle Stellen, an denen `cart()` vorkommt – auch die Definition."
      - "Die Zeile mit `public static function cart()` ist die Definition und zählt nicht als Aufruf."
      - "Aufrufe gibt es als `CartController::cart()` und als `self::cart()`."
    solution: |
      ```bash
      cd kiezladen-verwendungen
      grep -rnF "cart()" src
      printf 'src/Controller/CartController.php\nsrc/Controller/CheckoutController.php\n' > verwendungen.txt
      ```
      `CheckoutController` ruft `CartController::cart()` auf, der `CartController` selbst nutzt `self::cart()`
      in `show()` und `add()`. In einer IDE liefert „Find Usages“ auf der Methode genau diese Liste.
  - id: ide-funktion-waehlen
    type: dragdrop
    title: Welche IDE-Funktion hilft hier?
    description: Ordne jede Situation der IDE-Funktion zu, die sie am schnellsten löst.
    targets:
      - { id: definition, label: Go to Definition }
      - { id: usages, label: Find Usages }
      - { id: hierarchy, label: Call Hierarchy }
    items:
      - { label: "Du siehst summarize(…) im Controller und willst den Code der Methode lesen", target: definition }
      - { label: "Du willst den Konstruktor von OrderSummary ändern und musst wissen, wer ihn aufruft", target: usages }
      - { label: "Du willst wissen, über welche Aufrufkette man bis zu Cart::subtotal() gelangt", target: hierarchy }
      - { label: "Du fragst dich, was hinter der Klasse OrderPlaced steckt", target: definition }
      - { label: "Du willst eine Konstante umbenennen und prüfen, wo sie gelesen wird", target: usages }
    hints:
      - "Definition: wo steht es? Usages: wer benutzt es? Hierarchy: über welchen Weg komme ich hierher?"
---
Mit grep findest du Text. Deine [[ide|IDE]] kann mehr: Sie versteht, welche Klasse, welche Methode und
welcher [[namespace|Namespace]] gemeint ist. Damit springst du mit einem Tastendruck von einem Aufruf zur
Definition – und zurück zu allen Stellen, die ihn benutzen.

## Warum die IDE mehr weiß als grep

Eine IDE wie PhpStorm oder VS Code liest den Code nicht nur als Text. Sie baut einen Index aller Klassen,
Methoden und Variablen auf. Bei VS Code liefert diese Fähigkeit meist ein
[[language-server|Language Server]] für die jeweilige Sprache.

Der Unterschied zeigt sich im Kiezladen an der Methode `cart()`:

```php title="Zwei Aufrufe derselben Methode"
// in CheckoutController
CartController::cart()->subtotal();

// in CartController selbst
self::cart()->add((int) ($_POST['product_id'] ?? 0));
```

Eine Textsuche nach `CartController::cart` findet nur den ersten Aufruf. Die IDE weiß, dass `self::cart()`
dieselbe Methode meint.

## Go to Definition

Du liest `summarize(…)` und willst wissen, was dahintersteckt. Mit [[go-to-definition|Go to Definition]]
springst du direkt zur Stelle, an der die Methode geschrieben ist – auch in eine andere Datei.

| Funktion | PhpStorm | VS Code |
|---|---|---|
| Go to Definition | Strg+B / Cmd+B oder Strg/Cmd + Klick | F12 oder Strg/Cmd + Klick |
| Find Usages | Alt+F7 / Option+F7 | Umschalt+F12 (Vorschau), Umschalt+Alt+F12 (Liste) |
| Call Hierarchy | Strg+Alt+H / Ctrl+Option+H | Umschalt+Alt+H |
| Datei nach Namen öffnen | Zweimal Umschalt (Search Everywhere) | Strg/Cmd+P |

Genauso wichtig ist der Weg zurück: Nach drei Sprüngen in andere Dateien bringt dich „Navigate Back“ bzw.
„Go Back“ wieder an die Stelle, an der du angefangen hast. So verlierst du beim Erkunden nie den Faden.

Die Tastenkürzel können je nach Betriebssystem und Einstellung abweichen. Im Menü findest du die
Funktionen unter „Navigate“ bzw. „Go“.

> [!MERKSATZ]
> Lerne zuerst zwei Kürzel auswendig: zur Definition springen und wieder zurück. Damit liest du Code wie
> eine Webseite mit Links.

## Find Usages und Call Hierarchy

[[find-usages|Find Usages]] beantwortet die umgekehrte Frage: **Wer benutzt das hier?** Das brauchst du vor
jeder Änderung an einer Methode, einer Konstante oder einem Konstruktor. Jede gefundene Stelle könnte von
deiner Änderung betroffen sein.

Die [[aufrufhierarchie|Call Hierarchy]] geht noch weiter. Sie zeigt einen Baum: Wer ruft die Methode auf,
wer ruft wiederum diese Stelle auf, und so weiter bis zum Einstiegspunkt.

```text title="Call Hierarchy für Cart::subtotal()"
Cart::subtotal()
├── CartController::show()
└── CheckoutController::store()
```

## Wo die IDE an Grenzen stößt

Manche Aufrufe entstehen erst zur Laufzeit. Dann kann die IDE sie nicht sicher zuordnen:

- **Methodennamen als String:** In `routes.php` steht `[new Controller\CartController(), "add"]`. Für die IDE
  ist `"add"` nur Text.
- **Variable Funktionen:** Bei `$listener($event)` steht erst zur Laufzeit fest, welcher Listener läuft.
- **Framework-Magie:** Manche Frameworks erzeugen Methoden dynamisch. Plugins wie die Laravel-Unterstützung
  in PhpStorm schließen viele dieser Lücken.

> [!FEHLER]
> „Find Usages zeigt null Treffer, also kann ich `CartController::add()` löschen.“ Falsch – die Methode wird
> über den String `"add"` in den Routen aufgerufen. Prüfe vor dem Löschen zusätzlich mit grep.

> [!PRAXIS]
> Erfahrene Entwickler:innen kombinieren beides: die IDE für schnelle, sichere Sprünge und grep für Strings,
> Konfiguration, Templates und alles, was die IDE nicht versteht.

## Zusammenfassung

- Die IDE versteht Code-Strukturen, grep nur Text.
- **Go to Definition** springt zur Implementierung, **Find Usages** listet alle Verwendungen.
- Die **Call Hierarchy** zeigt die Aufrufkette bis zum Einstiegspunkt.
- Lerne die Kürzel für „zur Definition“ und „zurück“ zuerst.
- Bei Strings, variablen Funktionen und Framework-Magie ergänzt du die IDE mit grep.
