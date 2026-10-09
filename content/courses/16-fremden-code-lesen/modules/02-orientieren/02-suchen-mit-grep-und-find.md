---
title: Suchen mit grep und find
summary: Wie du mit grep, git grep und find in Sekunden die Stelle findest, die einen Text, eine Meldung oder eine Klasse erzeugt.
duration: 20
sources:
  - title: GNU grep – Handbuch
    url: https://www.gnu.org/software/grep/manual/grep.html
  - title: GNU findutils – find
    url: https://www.gnu.org/software/findutils/manual/find.html
  - title: git-grep – Dokumentation
    url: https://git-scm.com/docs/git-grep
  - title: ripgrep – Projektseite
    url: https://github.com/BurntSushi/ripgrep
quiz:
  - type: match
    question: Ordne jeder grep-Option ihre Wirkung zu.
    pairs:
      - { left: "-r", right: "Ordner rekursiv durchsuchen" }
      - { left: "-n", right: "Zeilennummer anzeigen" }
      - { left: "-i", right: "Groß- und Kleinschreibung ignorieren" }
      - { left: "-l", right: "Nur Dateinamen ausgeben" }
      - { left: "-F", right: "Suchbegriff wörtlich nehmen, nicht als Regex" }
    explanation: >
      `grep -rn` ist die häufigste Kombination. `-F` brauchst du, sobald der Suchbegriff Zeichen wie `.`, `(` oder
      `$` enthält, die in regulären Ausdrücken eine Sonderbedeutung haben.
  - type: single
    question: "Im Browser steht „Danke! Summe: 3285 Cent (Versand: 495 Cent)“. Wonach suchst du im Code?"
    options:
      - Nach dem ganzen Satz inklusive der Zahlen.
      - Nach einem festen Teil wie „Danke! Summe“.
      - Nach „3285“.
      - Nach „Cent“.
    answer: 1
    explanation: >
      Die Zahlen werden erst zur Laufzeit eingesetzt (z. B. mit `sprintf`), im Code stehen Platzhalter wie `%d`.
      „Cent“ kommt zu oft vor. Ein fester, seltener Teil des Textes trifft genau.
  - type: cloze
    text: "Mit `find src -___ '*Controller.php'` findest du alle Controller-Dateien. `git ___ -n Cart` durchsucht nur Dateien, die Git verfolgt."
    blanks:
      - [name]
      - [grep]
    explanation: "`-name` vergleicht den Dateinamen mit einem Glob-Muster. `git grep` ignoriert automatisch alles, was nicht im Repository liegt."
  - type: multiple
    question: Welche Befehle zeigen alle Stellen im Ordner src, an denen PriceCalculator vorkommt, mit Zeilennummer?
    options:
      - "`grep -rn PriceCalculator src`"
      - "`git grep -n PriceCalculator -- src`"
      - "`find src -name PriceCalculator`"
      - "`grep -n PriceCalculator src`"
    answers: [0, 1]
    explanation: >
      `find -name` sucht nach Dateinamen, nicht nach Inhalten. `grep` ohne `-r` kann keinen Ordner durchsuchen und
      meldet „Is a directory“.
tasks:
  - id: fehlertext-finden
    type: terminal
    title: Woher kommt „Gutschein ungültig“?
    description: |
      Klicke zuerst auf **Aufgabe vorbereiten**. Im Ordner `kiezladen-suche` liegt der Kiezladen.

      Eine Kundin schreibt dem Support: „Beim Bezahlen steht nur **Gutschein ungültig** da.“ Finde die Stelle,
      an der dieser Text entsteht.

      1. Wechsle in den Ordner und durchsuche das Projekt nach dem Text.
      2. Schreibe den Pfad der Datei, relativ zum Projektordner, in `antwort.txt`
         (Format wie `src/Ordner/Datei.php`).
    workdir: kiezladen-suche
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
        run: tr -d '[:space:]' < antwort.txt | sed 's#^\./##'
        stdout_equals: src/Service/PriceCalculator.php
        message: Der Pfad in antwort.txt stimmt noch nicht. Suche mit grep -rn nach dem Text und übernimm den Dateipfad aus der Ausgabe.
    hints:
      - "`grep -rn` durchsucht einen Ordner rekursiv und zeigt Datei und Zeile."
      - "Setze den Suchtext in Anführungszeichen, weil er ein Leerzeichen enthält: `grep -rn \"Gutschein ungültig\" .`"
      - "Die Ausgabe beginnt mit `./src/…:Zeile:` – der Teil vor dem ersten Doppelpunkt ist der Pfad."
    solution: |
      ```bash
      cd kiezladen-suche
      grep -rn "Gutschein ungültig" src
      echo "src/Service/PriceCalculator.php" > antwort.txt
      ```
      Der Text steht in `src/Service/PriceCalculator.php` – dort wirft `summarize()` eine Exception, die
      der `CheckoutController` abfängt und als Antwort ausgibt.
  - id: suchwerkzeug-waehlen
    type: dragdrop
    title: Welches Werkzeug für welche Suche?
    description: Ordne jede Suchfrage dem Befehl zu, der sie am direktesten beantwortet.
    targets:
      - { id: grep, label: "grep -rn \"…\" src" }
      - { id: find, label: "find . -name \"…\"" }
      - { id: grepl, label: "grep -rl \"…\" src" }
    items:
      - { label: "In welcher Zeile steht der Text „Zum Warenkorb hinzugefügt“?", target: grep }
      - { label: "Wo liegt die Datei CartController.php?", target: find }
      - { label: "Welche Dateien benutzen ProductRepository? (nur die Namen)", target: grepl }
      - { label: "Gibt es irgendwo eine Datei namens .env.example?", target: find }
      - { label: "An welchen Stellen wird summarize( aufgerufen?", target: grep }
      - { label: "Welche Dateien erwähnen KIEZ10? (nur die Liste)", target: grepl }
    hints:
      - find sucht nach Dateinamen, grep nach Inhalten. -l kürzt die Ausgabe auf Dateinamen.
---
Ein Ticket nennt fast immer einen Anker: eine Fehlermeldung, einen Button-Text, eine URL. Statt das Projekt
von oben nach unten zu lesen, suchst du nach diesem Anker und landest direkt an der richtigen Stelle. Gute
Suchtechnik ist der schnellste Weg in fremden Code.

## Suchen schlägt Lesen

Bevor du suchst, überlegst du dir einen guten Suchbegriff. Gute Kandidaten sind:

| Anker | Beispiel | Warum gut? |
|---|---|---|
| Sichtbarer Text | „Gutschein ungültig“ | Steht fast wörtlich im Code |
| URL-Pfad | `/cart/add` | Führt zur Route |
| Klassen- oder Funktionsname | `PriceCalculator` | Findet Definition und Verwendungen |
| Fehlermeldung aus dem Log | „Produkt nicht gefunden“ | Führt zur Stelle, die sie auslöst |
| Konfigurationsschlüssel | `FREE_SHIPPING_FROM` | Zeigt, wo ein Wert gesetzt und gelesen wird |

Wähle einen Begriff, der **selten** vorkommt. Nach „Cent“ zu suchen liefert Dutzende Treffer, nach
„versandkostenfrei“ genau einen.

## grep: Text in Dateien finden

[[grep]] durchsucht Dateien Zeile für Zeile. Für Code brauchst du fast immer dieselben Optionen:

```bash title="Die wichtigsten grep-Aufrufe"
grep -rn "Gutschein ungültig" src      # rekursiv, mit Zeilennummer
grep -rni "versandkostenfrei" .        # dazu ohne Groß-/Kleinschreibung
grep -rl "ProductRepository" src       # nur die Dateinamen
grep -rnw "add" src                    # nur ganze Wörter, nicht "address"
grep -rnF '$_POST[' src                # wörtlich, ohne Regex-Bedeutung
grep -rn --include='*.php' "Cart" .    # nur PHP-Dateien
```

```text title="Ausgabe: Datei, Zeile, Inhalt"
src/Service/PriceCalculator.php:18:            $percent = self::VOUCHERS[$voucher] ?? throw new \InvalidArgumentException('Gutschein ungültig');
```

Ohne `-F` behandelt grep den Suchbegriff als [[regex|regulären Ausdruck]]. Dann haben Zeichen wie `.`, `[`
oder `$` eine Sonderbedeutung.

## Nach sichtbaren Texten suchen

Texte aus der Oberfläche sind die besten Anker. Ein paar Tücken solltest du kennen:

- **Platzhalter:** Aus `'Danke! Summe: %d Cent'` wird im Browser „Danke! Summe: 3285 Cent“. Suche nur nach
  dem festen Teil.
- **Übersetzungen:** In Projekten mit mehreren Sprachen steht im Code oft nur ein Schlüssel wie
  `checkout.voucher_invalid`. Dann findest du den Text in einer Sprachdatei und suchst danach nach dem
  Schlüssel.
- **Umbrüche:** Lange Texte sind manchmal auf mehrere Zeilen verteilt. Suche dann nach einem kurzen Stück.

> [!FEHLER]
> Den kompletten Satz samt Zahlen suchen und bei null Treffern aufgeben. Kürze den Suchbegriff Schritt für
> Schritt, bis du etwas findest.

## find, git grep und ripgrep

[[find]] sucht nach **Dateinamen** und Eigenschaften, nicht nach Inhalten:

```bash title="Dateien finden"
find . -name "*Controller.php"         # alle Controller
find src -type f -name "*.php" | wc -l # wie viele PHP-Dateien?
find . -path ./vendor -prune -o -name "*.php" -print   # vendor überspringen
```

Zwei Alternativen solltest du kennen:

- **`git grep -n Cart`** durchsucht nur Dateien, die Git verfolgt. Ordner wie `vendor/` oder
  `node_modules/` stehen meist in der [[gitignore|.gitignore]] und tauchen deshalb gar nicht erst auf.
- **[[ripgrep]]** (`rg`) ist ein sehr schnelles grep, das die `.gitignore` von selbst beachtet. Es ist auf
  vielen Entwicklungsrechnern installiert, im Übungs-Terminal aber nicht.

> [!MERKSATZ]
> grep findet Inhalte, find findet Dateien. `git grep` sucht nur im eigenen Code.

## Treffer eingrenzen

Zu viele Treffer? Kombiniere grep mit einer [[pipe|Pipe]]:

```bash title="Treffer filtern"
grep -rn "PriceCalculator" . | grep -v tests/   # Tests ausblenden
grep -rc "router->" src | grep -v ":0"          # Treffer pro Datei zählen
```

Geh dabei schrittweise vor: Starte mit einem seltenen Begriff, schau dir die Treffer an und grenze dann mit
Ordner, Dateityp oder einem zweiten Begriff ein. Liefert eine Suche gar nichts, prüfe zuerst die
Schreibweise und kürze den Begriff, statt sofort aufzugeben.

> [!PRAXIS]
> Bei einem Fehlerbericht ist die Suche nach dem exakten Fehlertext oft der allererste Schritt – noch bevor
> jemand die Anwendung startet. In vielen Teams ist das die schnellste Abkürzung von Ticket zu Code.

## Zusammenfassung

- Wähle einen **seltenen**, festen Suchbegriff: Fehlertext, URL, Klassenname, Schlüssel.
- `grep -rn` zeigt Datei, Zeile und Inhalt. `-i`, `-l`, `-w`, `-F` und `--include` verfeinern die Suche.
- Bei sichtbaren Texten: Platzhalter, Übersetzungsschlüssel und Umbrüche beachten.
- `find` sucht Dateinamen. `git grep` und `rg` überspringen ignorierte Ordner.
- Mit Pipes und `grep -v` grenzt du zu viele Treffer ein.
