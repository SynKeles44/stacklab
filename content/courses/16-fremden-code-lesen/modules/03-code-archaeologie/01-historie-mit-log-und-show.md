---
title: Die Historie lesen mit git log und git show
summary: Wie du mit git log, seinen Filtern und git show herausfindest, wann, von wem und warum Code entstanden ist.
duration: 20
sources:
  - title: git-log – Dokumentation
    url: https://git-scm.com/docs/git-log
  - title: git-show – Dokumentation
    url: https://git-scm.com/docs/git-show
  - title: Pro Git (deutsch), Kapitel 2.3 – Anzeigen der Commit-Historie
    url: https://git-scm.com/book/de/v2/Git-Grundlagen-Anzeigen-der-Commit-Historie
quiz:
  - type: match
    question: Ordne jedem Aufruf seine Wirkung zu.
    pairs:
      - { left: "git log --oneline", right: "Ein Commit pro Zeile: Kurz-Hash und Betreff" }
      - { left: "git log --stat", right: "Dazu die geänderten Dateien mit Zeilenzahlen" }
      - { left: "git log -p", right: "Dazu den vollständigen Diff jedes Commits" }
      - { left: "git log -- src/Service", right: "Nur Commits, die diesen Ordner betreffen" }
    explanation: >
      Je mehr Details, desto länger die Ausgabe. Starte mit `--oneline`, grenze ein und schalte erst dann `-p` dazu.
  - type: single
    question: Mit welchem Befehl siehst du, wie `src/routes.php` zwei Commits vor dem aktuellen Stand aussah?
    options:
      - "`git show HEAD~2:src/routes.php`"
      - "`git log HEAD~2 src/routes.php`"
      - "`git diff src/routes.php`"
      - "`git show src/routes.php~2`"
    answer: 0
    explanation: >
      Die Schreibweise `<commit>:<pfad>` zeigt den Inhalt einer Datei in einem bestimmten Commit. `HEAD~2` ist der
      Commit zwei Schritte vor HEAD.
  - type: cloze
    text: Commits einer bestimmten Person findest du mit `git log --___=Tom`. Commits, deren Nachricht ein Wort enthält, mit `git log --___=voucher`.
    blanks:
      - [author]
      - [grep]
    explanation: "`--author` und `--grep` sind reguläre Ausdrücke. `--grep` durchsucht die Commit-Nachrichten, nicht den Code."
  - type: multiple
    question: Woran erkennst du in einer Historie, warum ein Commit gemacht wurde?
    options:
      - An einer aussagekräftigen Commit-Message.
      - An einer Ticket-ID wie `Refs: KIEZ-12` im Nachrichtentext.
      - Am Kurz-Hash des Commits.
      - Am Pull Request, zu dem der Commit gehört.
    answers: [0, 1, 3]
    explanation: >
      Der Hash identifiziert einen Commit eindeutig, sagt aber nichts über den Grund. Message, Ticket und Pull
      Request erzählen die Geschichte dahinter.
tasks:
  - id: gutschein-commit
    type: terminal
    title: Wann kamen die Gutscheine dazu?
    description: |
      Klicke zuerst auf **Aufgabe vorbereiten**. Im Ordner `kiezladen-log` liegt der Kiezladen mit seiner
      Historie.

      Das Marketing will wissen, seit wann es Gutscheincodes gibt und zu welchem Ticket die Funktion gehört.

      1. Finde den Commit, mit dem die Unterstützung für Gutscheincodes (englisch *voucher*) eingeführt wurde.
      2. Schreibe seinen Hash (mindestens die ersten 7 Zeichen) in `antwort.txt`.
      3. Schreibe die Ticket-ID, die in seiner Commit-Message steht, in `ticket.txt`.
    workdir: kiezladen-log
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
          h=$(git log --format=%H --grep='support voucher codes')
          [ ${#a} -ge 7 ] && [ "${h#"$a"}" != "$h" ] && echo ok
        stdout_equals: ok
        message: Der Hash in antwort.txt passt nicht. Suche mit git log --oneline --grep nach dem Commit und kopiere mindestens 7 Zeichen seines Hashs.
      - type: command
        run: tr -d '[:space:]' < ticket.txt
        stdout_equals: KIEZ-12
        message: In ticket.txt steht noch nicht die richtige Ticket-ID. Sieh dir die vollständige Commit-Message mit git show an.
    hints:
      - "`git log --oneline` zeigt alle zehn Commits. Welcher Betreff klingt nach Gutscheinen?"
      - "`git log --oneline --grep=voucher` grenzt direkt ein."
      - "`git show --stat <hash>` zeigt die ganze Message – die Ticket-ID steht im Nachrichtentext unter dem Betreff."
    solution: |
      ```bash
      cd kiezladen-log
      git log --oneline --grep=voucher
      git show --stat c7a222d
      echo c7a222d > antwort.txt
      echo KIEZ-12 > ticket.txt
      ```
      Der Commit `feat(checkout): support voucher codes` von Tom Muster vom 25. März 2026 trägt im
      Nachrichtentext `Refs: KIEZ-12`.
  - id: log-deuten
    type: steps
    title: Eine Historie deuten
    description: Lies die gezeigten Ausgaben und entscheide, was sie bedeuten.
    steps:
      - situation: |
          `git log --oneline -- src/Service/PriceCalculator.php` gibt aus:

          ```text
          862c991 refactor(pricing): extract shipping constants
          c7a222d feat(checkout): support voucher codes
          154483b feat(checkout): calculate shipping and order total
          ```
        question: Was weißt du jetzt?
        options:
          - Die Datei wurde in drei Commits geändert, zuletzt beim Auslagern der Versandkonstanten.
          - Das Projekt hat insgesamt nur drei Commits.
          - Die drei Commits haben jeweils nur diese eine Datei geändert.
        answer: 0
        explanation: >
          Mit `-- <pfad>` zeigt git log nur Commits, die diese Datei berühren. Andere Dateien können in denselben
          Commits ebenfalls geändert worden sein.
      - situation: Der neueste der drei Commits heißt „refactor“. Ein Refactoring soll das Verhalten nicht ändern.
        question: Seit diesem Commit ist der Versand bei genau 50 € plötzlich kostenpflichtig. Was ist der nächste sinnvolle Schritt?
        options:
          - Dem Betreff glauben und an anderer Stelle suchen.
          - Mit `git show 862c991` den Diff ansehen und prüfen, ob sich wirklich nur Namen geändert haben.
          - Den Commit sofort löschen.
        answer: 1
        explanation: >
          Eine Commit-Message beschreibt die Absicht, nicht zwingend das Ergebnis. Der Diff zeigt, was wirklich
          passiert ist – und in Lektion 2 findest du genau dort den Fehler.
---
Im Code siehst du nur den aktuellen Stand. Warum steht da `5000`? Seit wann gibt es Gutscheine? Wer hat das
eingebaut, und zu welchem Ticket gehörte es? Die Antworten stecken in der Git-Historie. Sie systematisch
auszuwerten nennt man [[code-archaeologie|Code-Archäologie]].

## Code hat eine Geschichte

Jeder [[commit|Commit]] ist eine Fundstelle mit Datum, Person und Begründung. Wenn die Commits gut gemacht
sind, beantwortet die Historie drei Fragen, die der Code allein nicht beantwortet:

| Frage | Wo steht die Antwort? |
|---|---|
| **Wann** kam das dazu? | Datum des Commits |
| **Wer** weiß darüber Bescheid? | Autor:in des Commits |
| **Warum** ist es so? | [[commit-message|Commit-Message]], [[ticket-id|Ticket-ID]], Pull Request |

Die Person aus dem Commit ist deine beste Ansprechpartnerin – sofern sie noch im Team ist.

## git log lesen

[[git-log|git log]] zeigt die Historie vom neuesten Commit rückwärts. Für den Überblick reicht eine Zeile pro
Commit:

```bash title="Die Historie des Kiezladens"
git log --oneline
```

```text
68d9874 test(pricing): cover free shipping boundary
653f51f docs: describe local setup in readme
862c991 refactor(pricing): extract shipping constants
a3900af feat(checkout): dispatch OrderPlaced event
c7a222d feat(checkout): support voucher codes
…
```

Mehr Details bekommst du mit diesen Optionen:

```bash title="Mehr Details"
git log --stat -3                         # geänderte Dateien der letzten 3 Commits
git log -p -1                             # Diff des letzten Commits
git log --format='%h %an %ad %s' --date=short   # eigenes Format
```

> [!MERKSATZ]
> Erst eingrenzen, dann Details anschalten. `git log -p` über die ganze Historie ist eine Textwand.

## Die Historie filtern

Die Stärke von git log liegt in den Filtern. Du kombinierst sie beliebig:

| Filter | Beispiel | Zeigt |
|---|---|---|
| Pfad | `git log --oneline -- src/Service` | Nur Commits, die diesen Ordner betreffen |
| Person | `git log --author=Tom` | Nur Commits von Tom |
| Zeitraum | `git log --since=2026-04-01` | Nur Commits ab April |
| Nachricht | `git log --grep=voucher -i` | Nur Commits mit „voucher“ in der Message |
| Anzahl | `git log -5` | Nur die letzten fünf |

Wurde eine Datei umbenannt, verfolgt `git log --follow -- pfad/datei.php` ihre Geschichte auch über den
alten Namen hinweg.

## git show: einen Commit im Detail

Hast du einen interessanten Commit gefunden, zeigt [[git-show|git show]] ihn vollständig an: Kopfzeilen,
Message und Diff.

```bash title="Commits und alte Dateistände ansehen"
git show c7a222d                          # Commit mit Message und Diff
git show --stat c7a222d                   # nur Message und Dateiliste
git show HEAD~3:src/Service/PriceCalculator.php   # Datei, wie sie drei Commits zuvor aussah
```

Die Schreibweise `<commit>:<pfad>` ist besonders praktisch: Du liest eine alte Version einer Datei, ohne
etwas auszuchecken.

> [!FEHLER]
> Dem Betreff blind vertrauen. „refactor: …“ verspricht, dass sich das Verhalten nicht ändert. Ob das stimmt,
> zeigt nur der Diff. Gerade unscheinbare Commits verstecken oft die Ursache eines Fehlers.

## Vom Commit zum Ticket und Pull Request

Viele Teams schreiben eine Ticket-ID in die Message, oft als [[commit-trailer|Trailer]] in der letzten Zeile.
Im Kiezladen sieht das so aus:

```text title="git show --stat c7a222d (Auszug)"
    feat(checkout): support voucher codes

    Refs: KIEZ-12
```

Im Ticket findest du dann die fachliche Begründung. Auf Code-Hosting-Diensten wie GitHub zeigt die Seite eines
Commits außerdem den [[pull-request|Pull Request]], über den er hereinkam – mit Beschreibung und
Review-Diskussion. Wird mit Merge-Commits gearbeitet, findest du den passenden Merge mit
`git log --merges --ancestry-path <hash>..main --oneline`.

> [!PRAXIS]
> In gewachsenen Projekten ist die Historie oft die einzige Dokumentation einer Entscheidung. Deshalb lohnen
> sich gute Commit-Messages: Die nächste Person, die deinen Code liest, bist vielleicht du selbst.

## Zusammenfassung

- Die Git-Historie beantwortet **wann**, **wer** und **warum** – Code-Archäologie.
- `git log --oneline` gibt den Überblick, `--stat` und `-p` liefern Details.
- Filter wie `-- pfad`, `--author`, `--since` und `--grep` grenzen die Historie ein.
- `git show <hash>` zeigt einen Commit, `git show <hash>:<pfad>` eine alte Dateiversion.
- Ticket-IDs und Pull Requests führen dich zur fachlichen Begründung.
