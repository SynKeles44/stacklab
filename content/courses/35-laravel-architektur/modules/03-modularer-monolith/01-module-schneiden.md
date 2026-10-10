---
title: Den modularen Monolithen schneiden
summary: Was ein modularer Monolith ist, wie du eine Laravel-App nach fachlichen Modulen schneidest und wie Module nur über öffentliche Schnittstellen und Events miteinander reden.
duration: 25
sources:
  - title: Laravel-Dokumentation – Service Providers
    url: https://laravel.com/docs/13.x/providers
  - title: Laravel-Dokumentation – Service Container (Binding Interfaces)
    url: https://laravel.com/docs/13.x/container#binding-interfaces-to-implementations
  - title: Composer – PSR-4 Autoloading
    url: https://getcomposer.org/doc/04-schema.md#psr-4
quiz:
  - type: single
    question: Was unterscheidet einen modularen Monolithen von Microservices?
    options:
      - Ein modularer Monolith hat keine Module.
      - Alle Module laufen in einer Anwendung und einem Deployment, sind aber intern durch Grenzen getrennt.
      - Jedes Modul hat einen eigenen Server und kommuniziert über HTTP.
      - Ein modularer Monolith darf nur eine Datenbanktabelle haben.
    answer: 1
    explanation: >
      Ein modularer Monolith ist **eine** Laravel-App mit **einem** Deployment. Die Trennung ist eine
      Code-Disziplin, keine Netzwerkgrenze – das spart den ganzen Betriebsaufwand verteilter Systeme.
  - type: multiple
    question: Welche Regeln gelten typischerweise zwischen zwei Modulen?
    options:
      - Ein Modul ruft das andere nur über dessen öffentliche Schnittstelle auf.
      - Ein Modul liest die Tabellen des anderen direkt mit DB::table(), wenn es schneller geht.
      - Module informieren sich über Domain Events.
      - Ein Modul gibt DTOs heraus, keine eigenen Eloquent-Models.
    answers: [0, 2, 3]
    explanation: >
      Direkter Tabellenzugriff ist die häufigste Grenzverletzung: Benennt das andere Team eine Spalte um,
      bricht dein Modul. Schnittstelle, DTOs und Events sind der Vertrag.
  - type: single
    question: Wie schneidest du Module sinnvoll?
    options:
      - Nach technischen Schichten – ein Modul Controllers, eines Models, eines Services.
      - Nach fachlichen Fähigkeiten – Katalog, Bestellung, Abrechnung.
      - Nach Anfangsbuchstaben der Klassen.
      - Nach den Teammitgliedern, die zuletzt daran gearbeitet haben.
    answer: 1
    explanation: >
      Ein Modul bündelt eine fachliche Fähigkeit samt Controller, Actions, Models und Tabellen. Technische
      Schichten gibt es dann **innerhalb** jedes Moduls.
  - type: find-bug
    question: Das Modul Ordering soll nur die öffentliche Schnittstelle von Catalog nutzen. Welche Zeile verletzt die Grenze?
    language: php
    code: |
      final class AddToCart
      {
          public function __construct(private CatalogApi $catalog) {}

          public function handle(int $productId, int $quantity): CartLine
          {
              $product = \App\Modules\Catalog\Models\Product::findOrFail($productId);

              return new CartLine($productId, $product->price_cents * $quantity);
          }
      }
    bug_line: 7
    explanation: >
      Ordering greift auf das interne Model von Catalog zu. Richtig wäre `$this->catalog->priceOf($productId)` –
      dann darf Catalog seine Tabelle umbauen, ohne Ordering zu brechen.
tasks:
  - id: modul-api
    type: code
    language: php
    title: Eine öffentliche Modul-Schnittstelle
    description: |
      Das Modul **Catalog** soll anderen Modulen Produktdaten geben, ohne seine internen Klassen
      preiszugeben. `ProductRecord` ist intern (im echten Projekt ein Eloquent-Model), `CatalogApi` und
      `ProductSummary` sind öffentlich.

      1. Schreibe `ProductSummary` als `final readonly class` mit `int $id`, `string $name` und
         `int $priceCents`.
      2. Implementiere `CatalogService implements CatalogApi`. Es bekommt im Konstruktor ein Array von
         `ProductRecord`.
         - `find(int $id): ?ProductSummary` liefert eine Zusammenfassung oder `null`.
         - `priceOf(int $id): int` liefert den Preis in Cent oder wirft eine `DomainException`.
      3. Implementiere im Modul **Ordering** `AddToCart`. Der Konstruktor verlangt **nur** `CatalogApi`.
         `handle(int $productId, int $quantity): int` gibt Preis × Menge zurück.
    starter: |
      <?php

      declare(strict_types=1);

      // ---- Modul Catalog: intern ----
      final class ProductRecord
      {
          public function __construct(
              public int $id,
              public string $name,
              public int $price_cents,
              public string $supplierNote,
          ) {}
      }

      // ---- Modul Catalog: öffentlich ----
      final readonly class ProductSummary
      {
          // id, name, priceCents
      }

      interface CatalogApi
      {
          public function find(int $id): ?ProductSummary;

          public function priceOf(int $id): int;
      }

      final class CatalogService implements CatalogApi
      {
          /** @param list<ProductRecord> $products */
          public function __construct(private array $products) {}

          public function find(int $id): ?ProductSummary
          {
          }

          public function priceOf(int $id): int
          {
          }
      }

      // ---- Modul Ordering ----
      final class AddToCart
      {
          public function handle(int $productId, int $quantity): int
          {
          }
      }
    tests:
      - name: liefert eine Zusammenfassung ohne interne Felder
        code: |
          $api = new CatalogService([new ProductRecord(1, 'Tasse', 899, 'intern')]);
          $summary = $api->find(1);
          assert_true($summary instanceof ProductSummary);
          assert_same('Tasse', $summary->name);
          assert_same(899, $summary->priceCents);
          assert_same(false, property_exists($summary, 'supplierNote'));
      - name: ein unbekanntes Produkt ergibt null bzw. eine Exception
        code: |
          $api = new CatalogService([]);
          assert_same(null, $api->find(42));
          $thrown = false;
          try { $api->priceOf(42); } catch (DomainException $e) { $thrown = true; }
          assert_true($thrown);
      - name: AddToCart rechnet über die Schnittstelle
        code: |
          $api = new CatalogService([new ProductRecord(1, 'Tasse', 899, ''), new ProductRecord(2, 'Teller', 1250, '')]);
          assert_same(3750, (new AddToCart($api))->handle(2, 3));
          assert_same(0, (new AddToCart($api))->handle(1, 0));
      - name: AddToCart hängt nur vom Interface ab
        code: |
          $params = (new ReflectionClass(AddToCart::class))->getConstructor()->getParameters();
          assert_same(1, count($params));
          assert_same('CatalogApi', $params[0]->getType()->getName());
          assert_true((new ReflectionClass(ProductSummary::class))->isReadOnly());
    solution: |
      <?php

      declare(strict_types=1);

      final class ProductRecord
      {
          public function __construct(
              public int $id,
              public string $name,
              public int $price_cents,
              public string $supplierNote,
          ) {}
      }

      final readonly class ProductSummary
      {
          public function __construct(
              public int $id,
              public string $name,
              public int $priceCents,
          ) {}
      }

      interface CatalogApi
      {
          public function find(int $id): ?ProductSummary;

          public function priceOf(int $id): int;
      }

      final class CatalogService implements CatalogApi
      {
          /** @param list<ProductRecord> $products */
          public function __construct(private array $products) {}

          public function find(int $id): ?ProductSummary
          {
              foreach ($this->products as $product) {
                  if ($product->id === $id) {
                      return new ProductSummary($product->id, $product->name, $product->price_cents);
                  }
              }

              return null;
          }

          public function priceOf(int $id): int
          {
              return $this->find($id)?->priceCents ?? throw new DomainException("Unknown product {$id}.");
          }
      }

      final class AddToCart
      {
          public function __construct(private CatalogApi $catalog) {}

          public function handle(int $productId, int $quantity): int
          {
              return $this->catalog->priceOf($productId) * $quantity;
          }
      }
    hints:
      - "`find` sucht mit einer Schleife das passende `ProductRecord` und baut daraus `new ProductSummary(...)`."
      - "`priceOf` kann `find` wiederverwenden: `$this->find($id)?->priceCents ?? throw new DomainException('...')`."
      - "`AddToCart` braucht einen Konstruktor mit `private CatalogApi $catalog`."
  - id: modul-diagramm
    type: diagram
    title: Die Teile eines Moduls
    description: >
      Das Diagramm zeigt die Module Ordering und Catalog. Beschrifte die freien Stellen im Modul Catalog
      und den Pfeil zurück zu Ordering.
    image: /assets/laravel-architektur/modularer-monolith-leer.svg
    slots:
      - { x: 77, y: 30, answer: Öffentliche Schnittstelle }
      - { x: 77, y: 55, answer: Interne Models und Actions }
      - { x: 77, y: 80, answer: Eigene Tabellen }
      - { x: 50, y: 69, answer: Domain Event }
    distractors: [Gemeinsame Tabelle, Fremdes Model]
---
Deine App hat 400 Klassen in `app/Models`, `app/Services` und `app/Http/Controllers`. Welche davon
gehören zur Abrechnung? Welche darf das Reporting-Team ändern, ohne die Bestellung zu brechen? Niemand
weiß es, weil die Ordner nach **Technik** sortiert sind, nicht nach **Fachlichkeit**. Ein modularer
Monolith ändert genau das.

## Monolith, Microservices – und dazwischen

Ein [[monolith|Monolith]] ist eine Anwendung, die als Ganzes ausgeliefert wird. Das ist erst einmal gut:
ein Deployment, eine Datenbank, Methodenaufrufe statt Netzwerk. Gefährlich wird er, wenn jede Klasse
jede andere benutzt.

| | Unstrukturierter Monolith | [[modularer-monolith\|Modularer Monolith]] | [[microservices\|Microservices]] |
|---|---|---|---|
| Deployment | eins | eins | viele |
| Grenzen | keine | im Code, durch Regeln geprüft | Netzwerk |
| Aufruf zwischen Teilen | beliebig | Schnittstelle oder Event | HTTP, Nachrichten |
| Betriebsaufwand | gering | gering | hoch |

Der modulare Monolith verbindet die einfache Auslieferung mit klaren Grenzen. Und falls ein Modul eines
Tages wirklich ein eigener Dienst werden muss, ist es schon sauber abgetrennt.

> [!MERKSATZ]
> Ein modularer Monolith ist **eine** App mit **inneren** Grenzen. Die Grenzen sind Disziplin im Code,
> keine Server.

## Nach Fachlichkeit schneiden

Ein [[fachliches-modul|Modul]] bündelt eine fachliche Fähigkeit: Katalog, Bestellung, Abrechnung,
Versand. Innerhalb des Moduls findest du die bekannten Schichten.

```text title="app/Modules"
app/Modules/
├── Catalog/
│   ├── Contracts/CatalogApi.php        ← öffentlich
│   ├── Data/ProductSummary.php         ← öffentlich
│   ├── Events/ProductPriceChanged.php  ← öffentlich
│   ├── Actions/UpdatePrice.php         ← intern
│   ├── Models/Product.php              ← intern
│   ├── Http/ProductController.php      ← intern
│   └── CatalogServiceProvider.php
└── Ordering/
    └── …
```

Weil `app/` per [[psr-4|PSR-4]] auf den [[namespace|Namespace]] `App\` zeigt, lädt Composer
`App\Modules\Catalog\…` ohne weitere Konfiguration.

Gute Modulgrenzen erkennst du daran, dass sich Änderungen **innerhalb** eines Moduls abspielen. Musst du
für eine Preisänderung drei Module anfassen, ist der Schnitt falsch.

> [!FEHLER]
> Module nach Technik schneiden (`Modules/Controllers`, `Modules/Models`). Dann gehört jede fachliche
> Änderung wieder allen Modulen gleichzeitig.

## Öffentlich und intern

Jedes Modul hat eine kleine [[modul-schnittstelle|öffentliche Schnittstelle]] und einen großen,
internen Rest.

![Zwei Module mit öffentlicher Schnittstelle, internen Klassen und eigenen Tabellen](/assets/laravel-architektur/modularer-monolith.svg)

| Öffentlich (Vertrag) | Intern (darf sich jederzeit ändern) |
|---|---|
| Interfaces in `Contracts/` | Eloquent-Models |
| DTOs in `Data/` | Actions, Services, Controller |
| Domain Events in `Events/` | Tabellen und Migrationen |

```php title="app/Modules/Catalog/Contracts/CatalogApi.php"
interface CatalogApi
{
    public function find(int $id): ?ProductSummary;

    public function priceOf(int $id): int;
}
```

Die Implementierung bleibt intern. Das Modul bindet sie in seinem eigenen
[[service-provider|Service Provider]]:

```php title="app/Modules/Catalog/CatalogServiceProvider.php"
final class CatalogServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(CatalogApi::class, EloquentCatalog::class);
    }
}
```

Den Provider trägst du in `bootstrap/providers.php` ein. So bringt jedes Modul seine Bindungen, Routen
und Listener selbst mit.

## Wie Module miteinander reden

Es gibt genau zwei erlaubte Wege:

1. **Synchron über die Schnittstelle:** Ordering braucht jetzt einen Preis → `$catalog->priceOf($id)`.
   Zurück kommt ein `int` oder ein DTO, nie ein Model.
2. **Asynchron über Events:** Catalog meldet `ProductPriceChanged`, und wer will, hört zu.

Und die Daten? Jedes Modul **besitzt** seine Tabellen. Ordering speichert die `product_id` und den Preis
zum Zeitpunkt der Bestellung, macht aber keinen Join auf `products` und definiert keine
Eloquent-Beziehung zu `Product`.

> [!PRAXIS]
> Eine Kopie des Preises in der Bestellung ist kein Fehler, sondern fachlich richtig: Die Bestellung
> soll den Preis von damals behalten, auch wenn der Katalog ihn morgen ändert.

## Zusammenfassung

- Ein modularer Monolith ist eine App mit einem Deployment und klaren inneren Grenzen.
- Module schneidest du nach fachlichen Fähigkeiten; Schichten gibt es innerhalb jedes Moduls.
- Öffentlich sind nur Contracts, DTOs und Events – Models, Actions und Tabellen bleiben intern.
- Jedes Modul bindet seine Implementierungen in einem eigenen Service Provider.
- Module reden über die Schnittstelle (synchron) oder über Domain Events – nie über fremde Tabellen.
