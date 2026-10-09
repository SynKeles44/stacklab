---
title: Die erste Stunde in einem neuen Projekt
summary: README lesen, das Projekt starten, zuerst die Tests ausführen und die Ordnerstruktur verstehen – eine feste Reihenfolge für jedes neue Projekt.
duration: 20
sources:
  - title: GNU make – Handbuch
    url: https://www.gnu.org/software/make/manual/make.html
  - title: npm Docs – npm run
    url: https://docs.npmjs.com/cli/v11/commands/npm-run
  - title: Composer – Scripts
    url: https://getcomposer.org/doc/articles/scripts.md
  - title: PHP-Handbuch – Der eingebaute Webserver
    url: https://www.php.net/manual/de/features.commandline.webserver.php
quiz:
  - type: single
    question: Warum führst du die Tests aus, bevor du irgendetwas änderst?
    options:
      - Damit der Rechner warm läuft.
      - Damit du weißt, welche Tests schon vorher rot waren – sonst hältst du alte Fehler für deine eigenen.
      - Weil Tests nach einer Änderung nicht mehr laufen.
      - Weil das README es immer so vorschreibt.
    answer: 1
    explanation: >
      Der erste Testlauf ist deine Ausgangslage. Schlägt danach ein Test fehl, weißt du sicher, ob er schon vorher
      rot war oder ob deine Änderung ihn kaputt gemacht hat.
  - type: match
    question: Wo findest du die Befehle eines Projekts? Ordne zu.
    pairs:
      - { left: "Node-Projekt", right: "Abschnitt scripts in package.json, Liste mit npm run" }
      - { left: "PHP-Projekt mit Composer", right: "Abschnitt scripts in composer.json" }
      - { left: "Projekt mit Makefile", right: "Targets im Makefile, z. B. make test" }
      - { left: "Laravel-Projekt", right: "php artisan list" }
    explanation: >
      Diese Dateien sind die „Bedienungsanleitung“ eines Projekts. Wer sie liest, findet sofort die Befehle für
      Starten, Testen und Bauen.
  - type: cloze
    text: Mit `tree -L ___` siehst du nur die obersten zwei Ebenen eines Ordners. Ordner wie `vendor` blendest du mit `tree -___ vendor` aus.
    blanks:
      - ["2"]
      - [I]
    explanation: "`-L` begrenzt die Tiefe, `-I` ignoriert Namen, die auf ein Muster passen – zum Beispiel `-I 'vendor|node_modules'`."
  - type: multiple
    question: Welche Ordner kannst du beim ersten Überblick getrost ignorieren?
    options:
      - "`vendor/`"
      - "`src/`"
      - "`node_modules/`"
      - "`tests/`"
    answers: [0, 2]
    explanation: >
      `vendor/` und `node_modules/` enthalten installierte Pakete von anderen. Der eigene Code steckt in Ordnern
      wie `src/` oder `app/`, die Spezifikation in `tests/`.
tasks:
  - id: tests-zuerst
    type: terminal
    title: Bring den Kiezladen zum Laufen und führe die Tests aus
    description: |
      Klicke zuerst auf **Aufgabe vorbereiten**. Danach liegt im Ordner `kiezladen-tests` der Kiezladen mit
      seiner vollständigen Git-Historie.

      1. Wechsle mit `cd kiezladen-tests` in den Ordner und lies das README.
      2. Finde im `Makefile` heraus, mit welchem Befehl die Tests laufen.
      3. Führe die Tests aus.
      4. Schreibe die **Anzahl der fehlgeschlagenen Tests** als Zahl in die Datei `antwort.txt`.

      Ändere keine Dateien des Projekts – heute wird nur gelesen.
    workdir: kiezladen-tests
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
        message: Lege die Datei antwort.txt an und schreibe die Anzahl der fehlgeschlagenen Tests hinein.
      - type: command
        run: tr -d '[:space:]' < antwort.txt
        stdout_equals: "1"
        message: Die Zahl in antwort.txt stimmt noch nicht. Schau in die letzte Zeile der Testausgabe – dort steht, wie viele Tests fehlgeschlagen sind.
      - type: command
        run: git status --porcelain | grep -v '^?? antwort.txt$' | wc -l
        stdout_matches: "^\\s*0\\s*$"
        message: Du hast Dateien des Projekts geändert. Setze sie mit git restore zurück – in dieser Aufgabe wird nur gelesen.
    hints:
      - "`cat README.md` und `cat Makefile` zeigen dir, welche Befehle es gibt."
      - "`make test` ruft `php tests/run.php` auf. Die letzte Zeile der Ausgabe fasst das Ergebnis zusammen."
      - "`echo 1 > antwort.txt` schreibt eine Zahl in die Datei – setze die richtige Zahl ein."
    solution: |
      ```bash
      cd kiezladen-tests
      cat README.md
      cat Makefile
      make test
      echo 1 > antwort.txt
      ```
      Die Ausgabe endet mit `5 bestanden, 1 fehlgeschlagen`. Der rote Test heißt
      `orders of exactly 50 euro ship for free` – genau der Fehler aus dem Ticket.
  - id: onboarding-reihenfolge
    type: order
    title: Die erste Stunde in der richtigen Reihenfolge
    description: Bring die Schritte in die Reihenfolge, in der du dich in ein neues Projekt einarbeitest.
    items:
      - README und weitere Dokumentation lesen
      - Abhängigkeiten installieren, wie im README beschrieben
      - Die verfügbaren Befehle in Makefile, package.json oder composer.json ansehen
      - Die Tests ausführen und das Ergebnis notieren
      - Das Projekt starten und einmal im Browser ausprobieren
      - Die Ordnerstruktur auf oberster Ebene ansehen
    hints:
      - Erst lesen, dann installieren, dann prüfen, ob alles läuft.
---
Ein neues Projekt fühlt sich am Anfang an wie eine fremde Wohnung: Du weißt nicht, wo der Lichtschalter ist.
Statt wahllos Schubladen aufzuziehen, gehst du in einer festen Reihenfolge vor. Nach einer Stunde läuft das
Projekt bei dir, du kennst die wichtigsten Befehle und weißt, ob die Tests grün sind.

## Erst lesen, was schon aufgeschrieben ist

Die meisten Projekte erklären sich zu einem Teil selbst. Bevor du Code öffnest, schaust du nach diesen
Dateien:

| Datei oder Ordner | Was sie dir verrät |
|---|---|
| [[readme|README.md]] | Wozu das Projekt da ist, wie du es startest |
| `CONTRIBUTING.md` | Regeln im Team: Branches, Commits, Reviews |
| `docs/` | Ausführlichere Dokumentation, manchmal Entscheidungen |
| `.env.example` | Welche Einstellungen das Projekt braucht ([[env-datei]]) |
| `CHANGELOG.md` | Was sich in den letzten Versionen geändert hat |

Nicht jedes Projekt hat alle Dateien – und manche Anleitung ist veraltet. Wenn du so eine Stelle findest,
notiere sie. Eine verbesserte Startanleitung ist ein wunderbarer erster Beitrag im neuen Team.

## Die Befehle eines Projekts finden

Fast jedes Projekt hat eine Stelle, an der seine Befehle stehen. Dort findest du heraus, wie du startest,
testest und baust:

```bash title="Wo stehen die Befehle?"
cat Makefile                   # Targets wie serve und test
jq .scripts package.json       # npm-Scripts in Node-Projekten
npm run                        # listet alle npm-Scripts auf
composer run-script --list     # Composer-Scripts in PHP-Projekten
php artisan list               # alle Befehle eines Laravel-Projekts
```

Ein [[makefile|Makefile]] bündelt lange Befehle unter kurzen Namen, den [[make-target|Targets]]. Im
Kiezladen sieht das so aus:

```makefile title="Makefile im Kiezladen"
serve:
	php -S localhost:8000 -t public

test:
	php tests/run.php
```

`make test` ist also nur eine Abkürzung für `php tests/run.php`. Ein [[npm-script]] funktioniert genauso.

## Zuerst die Tests

Bevor du eine einzige Zeile änderst, führst du die [[automatisierter-test|Tests]] aus. Das Ergebnis ist
deine **Ausgangslage**: Du weißt danach, was schon vor dir funktioniert hat und was nicht.

```text title="Ausgabe eines Testlaufs"
  ok    cart sums up price times quantity
  FAIL  orders of exactly 50 euro ship for free: erwartet 0, bekommen 495

5 bestanden, 1 fehlgeschlagen
```

Außerdem erzählen dir Tests, was das Projekt können soll. Jeder Testname ist ein Satz über das gewünschte
Verhalten. Wie du Tests als Dokumentation liest, lernst du in Modul 3.

> [!FEHLER]
> Erst etwas ändern und dann zum ersten Mal die Tests starten. Ist danach ein Test rot, weißt du nicht, ob
> du ihn kaputt gemacht hast oder ob er schon vorher rot war.

> [!MERKSATZ]
> Erst die Tests, dann der Code. Der erste Testlauf ist deine Messlatte für alles, was danach kommt.

## Die Ordnerstruktur lesen

Jetzt verschaffst du dir einen Überblick über die Ordner. `tree` zeigt die Struktur als Baum, `-L 2`
begrenzt die Tiefe:

```bash title="Ordner auf einen Blick"
tree -L 2
tree -L 2 -I 'vendor|node_modules'
```

Viele Projekte folgen ähnlichen Konventionen:

| Ordner | Typischer Inhalt |
|---|---|
| `src/` oder `app/` | Der eigene Code des Projekts |
| `public/` | Was der Webserver ausliefert, oft mit `index.php` |
| `tests/` | Automatische Tests |
| `config/` | Einstellungen |
| `database/migrations/` | Änderungen am Datenbankschema |
| `vendor/`, `node_modules/` | Fremde Pakete – beim Lesen ignorieren |

## Das Projekt einmal benutzen

Zum Schluss startest du das Projekt und klickst dich einmal durch, wie eine Kundin es tun würde. Der
Kiezladen bringt dafür den eingebauten [[webserver|Webserver]] von PHP mit:

```bash title="Den Kiezladen starten"
make serve
# in einem zweiten Terminal:
curl -s localhost:8000/products
```

Die Texte, die du dabei siehst, sind später wertvolle Suchbegriffe. Mit ihnen findest du die Stelle im
Code, die eine bestimmte Ausgabe erzeugt.

> [!PRAXIS]
> Viele Teams haben eine Onboarding-Checkliste. Hält sie nicht, was sie verspricht, ist deine Korrektur der
> perfekte erste [[pull-request|Pull Request]] – klein, nützlich und ohne Risiko.

## Zusammenfassung

- Lies zuerst README, CONTRIBUTING und Co. – und notiere, wo sie veraltet sind.
- Die Befehle eines Projekts stehen im Makefile, in `package.json` oder in `composer.json`.
- Führe die Tests aus, **bevor** du etwas änderst. Das Ergebnis ist deine Ausgangslage.
- `tree -L 2` zeigt dir die Ordnerstruktur. `vendor/` und `node_modules/` ignorierst du.
- Starte das Projekt einmal und benutze es. Die sichtbaren Texte sind gute Suchbegriffe.
