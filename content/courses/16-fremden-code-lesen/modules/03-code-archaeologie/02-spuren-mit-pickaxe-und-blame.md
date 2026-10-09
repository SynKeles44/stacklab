---
title: Spuren finden mit git log -S und git blame
summary: Wie du den Commit findest, der eine Zeile, einen Namen oder ein Verhalten eingeführt hat – mit der Pickaxe-Suche, git blame und einem Blick in den Diff.
duration: 25
sources:
  - title: git-log – Optionen -S und -G
    url: https://git-scm.com/docs/git-log
  - title: git-blame – Dokumentation
    url: https://git-scm.com/docs/git-blame
  - title: git-bisect – Dokumentation
    url: https://git-scm.com/docs/git-bisect
quiz:
  - type: single
    question: Was findet `git log -S "FREE_SHIPPING_FROM"`?
    options:
      - Alle Commits, deren Message FREE_SHIPPING_FROM enthält.
      - Alle Commits, in denen sich die Anzahl der Vorkommen von FREE_SHIPPING_FROM im Code geändert hat.
      - Alle Dateien, in denen FREE_SHIPPING_FROM steht.
      - Nur den neuesten Commit des Projekts.
    answer: 1
    explanation: >
      Die Pickaxe-Suche `-S` findet Commits, die einen Text hinzufügen oder entfernen – also typischerweise den
      Commit, der einen Namen eingeführt hat. Für die Message gibt es `--grep`.
  - type: find-bug
    question: "Laut Ticket ist der Versand **ab** 50 € gratis (5000 Cent). In welcher Zeile steckt der Fehler?"
    language: php
    code: |
      private const FREE_SHIPPING_FROM = 5000;
      private const SHIPPING_COST = 495;

      public function shipping(int $amount): int
      {
          return $amount > self::FREE_SHIPPING_FROM ? 0 : self::SHIPPING_COST;
      }
    bug_line: 6
    explanation: >
      „Ab 50 €“ schließt genau 50 € ein. `>` lässt 5000 Cent aber Versand zahlen. Richtig wäre `>=` – vor dem
      Refactoring stand genau das im Code.
  - type: cloze
    text: "Mit `git blame -___ 10,20 datei.php` zeigst du nur die Zeilen 10 bis 20. Den Stand direkt vor einem Commit erreichst du mit `<hash>___`."
    blanks:
      - [L]
      - ["^", "~1", "~"]
    explanation: "`-L` begrenzt blame auf einen Zeilenbereich. `<hash>^` (oder `<hash>~1`) ist der Eltern-Commit – damit blickst du hinter eine Änderung zurück."
  - type: multiple
    question: Welche Aussagen über git blame stimmen?
    options:
      - Es zeigt für jede Zeile den Commit, der sie zuletzt geändert hat.
      - Es zeigt, wer sich eine Zeile ursprünglich ausgedacht hat.
      - Mit `-w` ignoriert es reine Leerzeichen-Änderungen.
      - Eine reine Formatierungsänderung kann den eigentlich interessanten Commit verdecken.
    answers: [0, 2, 3]
    explanation: >
      blame zeigt die letzte Änderung, nicht die Idee dahinter. Wurde eine Zeile nur umformatiert, gehst du mit
      `-w`, `--ignore-revs-file` oder `git blame <hash>^ -- datei` weiter zurück.
tasks:
  - id: konstante-ausgraben
    type: terminal
    title: Wer hat FREE_SHIPPING_FROM eingeführt?
    description: |
      Klicke zuerst auf **Aufgabe vorbereiten**. Im Ordner `kiezladen-spuren` liegt der Kiezladen.

      In `src/Service/PriceCalculator.php` vergleicht eine Zeile die Bestellsumme mit der Konstante
      `FREE_SHIPPING_FROM`. Finde heraus, woher sie kommt.

      1. Finde den Commit, der die Konstante `FREE_SHIPPING_FROM` eingeführt hat.
      2. Schreibe seinen Hash (mindestens 7 Zeichen) in `antwort.txt`.
      3. Sieh dir den Diff des Commits an. Welcher Vergleichsoperator stand **vorher** in der Zeile mit den
         Versandkosten? Schreibe ihn (nur die Zeichen, z. B. `<`) in `vorher.txt`.
    workdir: kiezladen-spuren
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
        message: Lege die Datei antwort.txt mit dem Commit-Hash an.
      - type: command
        run: |
          a=$(tr -d '[:space:]' < antwort.txt | tr 'A-F' 'a-f')
          h=$(git log -S FREE_SHIPPING_FROM --reverse --format=%H | head -n 1)
          [ ${#a} -ge 7 ] && [ "${h#"$a"}" != "$h" ] && echo ok
        stdout_equals: ok
        message: Der Hash in antwort.txt passt nicht. Nutze git log -S FREE_SHIPPING_FROM oder git blame auf die Zeile mit dem Vergleich.
      - type: command
        run: tr -d '[:space:]' < vorher.txt
        stdout_equals: ">="
        message: In vorher.txt steht noch nicht der alte Operator. Im Diff von git show <hash> zeigt die mit - beginnende Zeile den Stand vorher.
    hints:
      - "`git log -S FREE_SHIPPING_FROM --oneline` listet die Commits, die diesen Namen hinzufügen oder entfernen."
      - "Alternativ: `grep -n FREE_SHIPPING_FROM src/Service/PriceCalculator.php` liefert die Zeilennummer, `git blame -L <nr>,<nr> src/Service/PriceCalculator.php` den Commit."
      - "`git show <hash>` zeigt den Diff: Zeilen mit `-` sind der alte Stand, Zeilen mit `+` der neue."
    solution: |
      ```bash
      cd kiezladen-spuren
      git log -S FREE_SHIPPING_FROM --oneline
      git blame -L 21,21 src/Service/PriceCalculator.php
      git show 862c991
      echo 862c991 > antwort.txt
      echo '>=' > vorher.txt
      ```
      Im Diff steht `-        $shipping = $subtotal - $discount >= 5000 ? 0 : 495;` und
      `+        $shipping = $subtotal - $discount > self::FREE_SHIPPING_FROM ? 0 : self::SHIPPING_COST;`.
      Beim „Refactoring“ ist aus `>=` versehentlich `>` geworden.
  - id: spur-werkzeug
    type: dragdrop
    title: Welches Werkzeug für welche Spur?
    description: Ordne jede Ausgangslage dem Befehl zu, mit dem du am schnellsten zum passenden Commit kommst.
    targets:
      - { id: blame, label: "git blame -L …" }
      - { id: pickaxe, label: "git log -S \"…\"" }
      - { id: pfad, label: "git log -- pfad" }
      - { id: bisect, label: git bisect }
    items:
      - { label: "Zeile 21 von PriceCalculator.php sieht verdächtig aus", target: blame }
      - { label: "Seit wann gibt es den Gutscheincode KIEZ10 im Code?", target: pickaxe }
      - { label: "Was ist alles an der Datei Cart.php passiert?", target: pfad }
      - { label: "Vor drei Wochen lief alles, heute nicht – keine Ahnung, wo", target: bisect }
      - { label: "In welchem Commit wurde die Methode dispatch() eingeführt?", target: pickaxe }
      - { label: "Wer hat die Fehlermeldung in Zeile 18 zuletzt geändert?", target: blame }
    hints:
      - "Zeile bekannt → blame. Text bekannt → -S. Datei bekannt → log -- pfad. Nichts bekannt außer „früher ging es“ → bisect."
---
Im letzten Kapitel hast du die Historie Commit für Commit durchgeblättert. Bei zehn Commits geht das. Bei
zehntausend nicht. Dann drehst du die Suche um: Du startest bei einer Zeile oder einem Namen im Code und
lässt Git den Commit finden, der sie eingeführt hat.

## git log -S: die Pickaxe-Suche

`git log -S "text"` findet alle Commits, in denen sich die **Anzahl** der Vorkommen eines Textes geändert
hat. Typischerweise sind das der Commit, der etwas eingeführt hat, und der, der es entfernt hat. Wegen
dieser Spitzhacken-Arbeit heißt die Option [[pickaxe|Pickaxe]].

```bash title="Wann kam FREE_SHIPPING_FROM in den Code?"
git log -S FREE_SHIPPING_FROM --oneline
```

```text
862c991 refactor(pricing): extract shipping constants
```

Verwandt ist `-G`: Es findet Commits, deren geänderte Zeilen auf einen [[regex|regulären Ausdruck]] passen –
auch wenn sich die Anzahl nicht ändert. Mit `-p` siehst du direkt den passenden Diff dazu.

| Option | Durchsucht | Findet |
|---|---|---|
| `--grep=text` | Commit-Messages | Commits, die über etwas sprechen |
| `-S text` | Code-Änderungen | Commits, die den Text hinzufügen oder entfernen |
| `-G regex` | Code-Änderungen | Commits, deren geänderte Zeilen passen |

## git blame: Wer hat diese Zeile zuletzt geändert?

[[git-blame|git blame]] schreibt vor jede Zeile einer Datei den Commit, die Person und das Datum der letzten
Änderung. Mit `-L` beschränkst du die Ausgabe auf die Zeilen, die dich interessieren:

```bash title="Blame für eine einzelne Zeile"
grep -n "FREE_SHIPPING_FROM ?" src/Service/PriceCalculator.php
git blame -L 21,21 src/Service/PriceCalculator.php
```

```text
862c9915 (Tom Muster 2026-04-08 17:10:00 +0200 21)         $shipping = $subtotal - $discount > self::FREE_SHIPPING_FROM ? 0 : self::SHIPPING_COST;
```

Nützliche Varianten: `-w` ignoriert reine Leerzeichen-Änderungen, `-C` erkennt Zeilen, die aus einer anderen Datei hierher verschoben wurden,
und in der IDE blendet „Annotate with Git Blame“ dieselbe Information neben dem Code ein.

> [!FEHLER]
> blame als Schuldfrage lesen. Der Name zeigt nur, wer die Zeile **zuletzt angefasst** hat – vielleicht beim
> Umformatieren. Die eigentliche Entscheidung kann viel älter sein. Und selbst wenn nicht: Fehler passieren
> allen. Es geht um das Warum, nicht um das Wer.

## Hinter eine Änderung zurückblicken

Hat dich blame zu einem Commit geführt, schaust du dir an, was er wirklich geändert hat:

```bash title="Vorher und nachher vergleichen"
git show 862c991                                  # der Diff des Commits
git show 862c991^:src/Service/PriceCalculator.php # die Datei direkt davor
git blame 862c991^ -- src/Service/PriceCalculator.php   # blame vor diesem Commit
```

`862c991^` ist der Eltern-Commit. So hangelst du dich Schritt für Schritt in die Vergangenheit, wenn ein
Commit eine Zeile nur umformatiert hat.

> [!MERKSATZ]
> Jede Spur endet bei einem Commit. Erst `git show` verrät, was er wirklich geändert hat.

## Vom Symptom zum verursachenden Commit

![Welches Werkzeug für welche Spur?](/assets/fremden-code-lesen/archaeologie-werkzeuge.svg)

Im Kiezladen sieht der komplette Weg so aus:

1. **Symptom:** Bei genau 50 € wird Versand berechnet.
2. **Stelle finden:** grep nach `FREE_SHIPPING_FROM` führt zu Zeile 21 im `PriceCalculator`.
3. **Commit finden:** `git blame -L 21,21` oder `git log -S` liefert `862c991`.
4. **Ursache verstehen:** Der Diff zeigt, dass aus `>=` beim Auslagern der Konstanten `>` wurde.

Weißt du gar nicht, wo du suchen sollst, aber kennst einen funktionierenden alten Stand, hilft
[[git-bisect|git bisect]]. Git halbiert dann die Historie, bis der erste schlechte Commit gefunden ist.

> [!PRAXIS]
> Bei einem Fehler im Live-System ist der verursachende Commit Gold wert: Er zeigt, was sich geändert hat,
> welches Ticket dahinterstand und wen du fragen kannst. Oft ist der Fix dann nur noch eine Zeile.

## Zusammenfassung

- `git log -S text` findet Commits, die einen Text einführen oder entfernen. `-G` sucht mit Regex.
- `git blame -L von,bis datei` zeigt pro Zeile den Commit der letzten Änderung.
- blame zeigt, wer zuletzt geändert hat, nicht wer schuld ist.
- Mit `<hash>^` blickst du hinter eine Änderung zurück.
- Weg zum Fehler: Symptom → Stelle → Commit → Diff → Ursache. Ohne Anhaltspunkt hilft `git bisect`.
