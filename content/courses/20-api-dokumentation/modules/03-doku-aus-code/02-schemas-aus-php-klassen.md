---
title: Schemas aus PHP-Klassen erzeugen
summary: Du machst aus PHP-Klassen und Enums OpenAPI-Schemas, nutzt die PHP-Typen für die Typangaben und verweist in Antworten und Bodies mit Klasse::class darauf.
duration: 25
sources:
  - title: swagger-php – Dokumentation
    url: https://zircote.github.io/swagger-php/
  - title: swagger-php – Quellcode und Beispiele
    url: https://github.com/zircote/swagger-php
  - title: PHP-Handbuch – Enumerationen
    url: https://www.php.net/manual/de/language.enumerations.backed.php
quiz:
  - type: match
    question: Welcher PHP-Typ wird zu welchem OpenAPI-Typ?
    pairs:
      - { left: "int $id", right: "type: integer" }
      - { left: "float $price", right: "type: number" }
      - { left: "?string $note", right: "type: [string, \"null\"]" }
      - { left: "bool $active", right: "type: boolean" }
    explanation: swagger-php liest die PHP-Typen per Reflection. Ein vorangestelltes ? macht in OpenAPI 3.1 eine Typliste mit null daraus.
  - type: single
    question: "Wie verweist du in einer Antwort auf das Schema der Klasse `Product`?"
    options:
      - "content: new OA\\JsonContent(ref: Product::class)"
      - "content: 'Product'"
      - "schema: new Product()"
      - "ref: '/products'"
    answer: 0
    explanation: >
      Mit Klasse::class gibst du die Klasse an. swagger-php macht daraus automatisch den Verweis
      `#/components/schemas/Product` – Tippfehler im Namen fallen der IDE sofort auf.
  - type: multiple
    question: Was gilt für Arrays wie `public array $tags`?
    options:
      - PHP kennt den Typ der Elemente nicht, swagger-php also auch nicht automatisch.
      - "Den Elementtyp gibst du mit items: new OA\\Items(type: 'string') an."
      - Arrays sind in OpenAPI verboten.
      - "Für eine Liste von Objekten nutzt du items: new OA\\Items(ref: Product::class)."
    answers: [0, 1, 3]
    explanation: >
      `array` sagt nur „Liste oder Map“. Ohne items steht in der Spezifikation ein leeres items-Objekt,
      und Clients wissen nicht, was in der Liste steckt.
  - type: find-bug
    question: Das Schema soll die Werte draft und published erlauben. Welche Zeile führt dazu, dass stattdessen Draft und Published in der Spec landen?
    language: php
    code: |
      use OpenApi\Attributes as OA;

      #[OA\Schema]
      enum Status: string
      {
          case Draft = 'draft';
          case Published = 'published';
      }
    bug_line: 3
    explanation: >
      Ohne Typangabe schreibt swagger-php (Stand Version 6) die Namen der Cases ins Schema. Mit
      `#[OA\Schema(type: 'string')]` nutzt es die Werte des Backed Enums. Prüfe die erzeugte Datei
      immer einmal mit eigenen Augen.
tasks:
  - id: schemas-aus-klassen
    type: terminal
    title: Ein Produkt-Schema aus PHP erzeugen
    description: |
      Im Ordner `shop-schemas` liegt die Shop-API aus der letzten Lektion – swagger-php ist bereits
      installiert. Neu sind `src/Model/Product.php` und `src/Model/Status.php`, beide noch ohne
      Attribute. Klicke zuerst auf **Aufgabe vorbereiten** (Composer lädt dabei kurz Pakete).

      1. Mach aus `Status` ein Schema mit den Werten `draft` und `published` (`#[OA\Schema(type: "string")]`).
      2. Mach aus `Product` ein Schema mit `required: ["id", "name", "price"]` und versieh alle
         Eigenschaften mit `#[OA\Property]`. Für `tags` gibst du den Elementtyp `string` an.
      3. Ändere im `ProductController` die 200-Antworten:
         - `show()` liefert `new OA\JsonContent(ref: Product::class)`
         - `index()` liefert eine Liste: `new OA\JsonContent(type: "array", items: new OA\Items(ref: Product::class))`
      4. Erzeuge die Spezifikation neu: `./vendor/bin/openapi src -o openapi.yaml`
    workdir: shop-schemas
    setup: |
      mkdir -p src/Controller src/Model
      cat > composer.json <<'EOF'
      {
          "name": "stacklab/shop-api",
          "type": "project",
          "autoload": {
              "psr-4": {
                  "App\\": "src/"
              }
          }
      }
      EOF
      timeout 170 composer require -q --no-interaction zircote/swagger-php:^6.12
      cat > src/OpenApi.php <<'EOF'
      <?php

      declare(strict_types=1);

      namespace App;

      use OpenApi\Attributes as OA;

      #[OA\OpenApi(openapi: "3.1.0")]
      #[OA\Info(version: "1.0.0", title: "Shop-API")]
      #[OA\Server(url: "https://api.example.com/v1")]
      final class OpenApi
      {
      }
      EOF
      cat > src/Model/Status.php <<'EOF'
      <?php

      declare(strict_types=1);

      namespace App\Model;

      use OpenApi\Attributes as OA;

      enum Status: string
      {
          case Draft = 'draft';
          case Published = 'published';
      }
      EOF
      cat > src/Model/Product.php <<'EOF'
      <?php

      declare(strict_types=1);

      namespace App\Model;

      use OpenApi\Attributes as OA;

      final class Product
      {
          /**
           * @param list<string> $tags
           */
          public function __construct(
              public int $id,
              public string $name,
              public float $price,
              public Status $status,
              public ?string $description = null,
              public array $tags = [],
          ) {
          }
      }
      EOF
      cat > src/Controller/ProductController.php <<'EOF'
      <?php

      declare(strict_types=1);

      namespace App\Controller;

      use App\Model\Product;
      use OpenApi\Attributes as OA;

      final class ProductController
      {
          #[OA\Get(path: "/products", operationId: "listProducts", summary: "Alle Produkte", tags: ["Products"])]
          #[OA\Response(response: 200, description: "Liste der Produkte")]
          public function index(): array
          {
              return [];
          }

          #[OA\Get(path: "/products/{id}", operationId: "getProduct", summary: "Ein Produkt", tags: ["Products"])]
          #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
          #[OA\Response(response: 200, description: "Das Produkt")]
          #[OA\Response(response: 404, description: "Produkt nicht gefunden")]
          public function show(int $id): ?Product
          {
              return null;
          }
      }
      EOF
    checks:
      - type: file_exists
        path: openapi.yaml
        message: openapi.yaml fehlt. Erzeuge sie mit ./vendor/bin/openapi src -o openapi.yaml.
      - type: command
        run: "./vendor/bin/openapi src --format json 2>/dev/null | jq -c '.components.schemas.Status.enum'"
        stdout_equals: '["draft","published"]'
        message: "Das Schema Status fehlt oder enthält nicht die Werte draft und published. Nutze #[OA\\Schema(type: \"string\")] am Enum."
      - type: command
        run: "./vendor/bin/openapi src --format json 2>/dev/null | jq -r '.components.schemas.Product | [(.required | sort | join(\",\")), (.properties | keys | sort | join(\",\")), .properties.price.type, (.properties.description.type | tostring), .properties.tags.items.type, .properties.status[\"$ref\"]] | join(\"|\")'"
        stdout_equals: 'id,name,price|description,id,name,price,status,tags|number|["string","null"]|string|#/components/schemas/Status'
        message: Das Schema Product ist noch unvollständig. Alle sechs Eigenschaften brauchen #[OA\Property], required ist id, name, price, und tags braucht items vom Typ string.
      - type: command
        run: "./vendor/bin/openapi src --format json 2>/dev/null | jq -r '[.paths[\"/products/{id}\"].get.responses[\"200\"].content[\"application/json\"].schema[\"$ref\"], .paths[\"/products\"].get.responses[\"200\"].content[\"application/json\"].schema.items[\"$ref\"]] | join(\"|\")'"
        stdout_equals: "#/components/schemas/Product|#/components/schemas/Product"
        message: "Die 200-Antworten verweisen noch nicht auf Product: show() mit JsonContent(ref: Product::class), index() mit type array und items ref Product::class."
      - type: command
        run: "d=$(mktemp -d \"$PWD/.pruefung-XXXXXX\"); ./vendor/bin/openapi src -o \"$d/neu.yaml\" >/dev/null 2>&1; cmp -s \"$d/neu.yaml\" openapi.yaml; e=$?; rm -rf \"$d\"; exit $e"
        message: openapi.yaml ist nicht auf dem neuesten Stand. Erzeuge sie nach deinen Änderungen erneut.
    hints:
      - Jede Eigenschaft im Konstruktor kann ein eigenes Attribut tragen – schreib `#[OA\Property]` direkt vor `public int $id,`.
      - 'Für die Liste: `#[OA\Property(items: new OA\Items(type: "string"))]` vor `public array $tags = [],`.'
      - "Am Controller: `#[OA\\Response(response: 200, description: \"Das Produkt\", content: new OA\\JsonContent(ref: Product::class))]`"
    solution: |
      ```php title="src/Model/Status.php"
      #[OA\Schema(type: "string")]
      enum Status: string
      {
          case Draft = 'draft';
          case Published = 'published';
      }
      ```

      ```php title="src/Model/Product.php"
      #[OA\Schema(required: ["id", "name", "price"])]
      final class Product
      {
          public function __construct(
              #[OA\Property(example: 7)]
              public int $id,
              #[OA\Property(maxLength: 120)]
              public string $name,
              #[OA\Property(minimum: 0)]
              public float $price,
              #[OA\Property]
              public Status $status,
              #[OA\Property]
              public ?string $description = null,
              #[OA\Property(items: new OA\Items(type: "string"))]
              public array $tags = [],
          ) {
          }
      }
      ```

      ```php title="src/Controller/ProductController.php (Antworten)"
      #[OA\Response(response: 200, description: "Liste der Produkte", content: new OA\JsonContent(type: "array", items: new OA\Items(ref: Product::class)))]
      // …
      #[OA\Response(response: 200, description: "Das Produkt", content: new OA\JsonContent(ref: Product::class))]
      ```

      ```bash
      ./vendor/bin/openapi src -o openapi.yaml
      ```
---
Deine API liefert Produkte, und das Produkt gibt es schon als PHP-Klasse mit Typen: `int $id`,
`string $name`, `float $price`. Diese Informationen in YAML noch einmal abzutippen wäre doppelte Arbeit –
und die nächste Quelle für Drift. swagger-php kann die Typen direkt aus der Klasse lesen.

## Eine Klasse wird ein Schema

Setzt du `#[OA\Schema]` an eine Klasse, landet sie unter `components.schemas`. Der Name ist
standardmäßig der Klassenname. Jede Eigenschaft mit `#[OA\Property]` wird ein Feld:

```php title="src/Model/Product.php"
#[OA\Schema(required: ['id', 'name', 'price'])]
final class Product
{
    public function __construct(
        #[OA\Property(example: 7)]
        public int $id,
        #[OA\Property(maxLength: 120)]
        public string $name,
        #[OA\Property(minimum: 0)]
        public float $price,
        #[OA\Property]
        public ?string $description = null,
    ) {
    }
}
```

Das funktioniert mit normalen Eigenschaften und mit Konstruktor-Eigenschaften (*constructor promotion*)
wie oben. In den Attributen ergänzt du alles, was PHP nicht ausdrücken kann: `example`,
`description`, `maxLength`, `minimum`, `format`.

## PHP-Typen werden OpenAPI-Typen

swagger-php liest die Typen per Reflection. Du musst `type` deshalb meist **nicht** angeben:

| PHP | Erzeugtes Schema |
|---|---|
| `int` | `type: integer` |
| `float` | `type: number` |
| `string` | `type: string` |
| `bool` | `type: boolean` |
| `?string` | `type: [string, "null"]` |
| `Status` (Klasse/Enum mit Schema) | `$ref: '#/components/schemas/Status'` |
| `array` | `type: array` – aber ohne Elementtyp! |

Für Arrays fehlt die Info, was drinsteckt. Die gibst du mit `items` an:

```php title="Listen beschreiben"
#[OA\Property(items: new OA\Items(type: 'string'))]
public array $tags = [],

#[OA\Property(items: new OA\Items(ref: Review::class))]
public array $reviews = [],
```

> [!MERKSATZ]
> Was PHP weiß (Typ, nullable), erkennt swagger-php selbst. Was PHP nicht weiß (Elementtyp von
> Arrays, Beispiele, Grenzen), schreibst du ins Attribut.

## Enums

Ein PHP-Enum mit Werten ([[backed-enum|Backed Enum]]) wird ein Schema mit `enum`:

```php title="src/Model/Status.php"
#[OA\Schema(type: 'string')]
enum Status: string
{
    case Draft = 'draft';
    case Published = 'published';
}
```

Ergebnis: `type: string` mit `enum: [draft, published]`. Eigenschaften vom Typ `Status` verweisen
automatisch per `$ref` darauf.

Der Vorteil: Kommt ein neuer Fall wie `case Archived = 'archived'` dazu, steht er nach dem nächsten
Erzeugen automatisch in der Doku. Bei einer handgepflegten Liste in YAML würde genau dieser neue Wert
fehlen – ein typischer Fall von Drift.

> [!FEHLER]
> Ohne `type: 'string'` schreibt swagger-php (Stand Version 6) die **Namen** der Cases ins Schema:
> `Draft`, `Published` statt `draft`, `published`. Clients würden dann falsche Werte schicken. Kontrolliere
> erzeugte Dateien deshalb immer einmal mit `jq` oder in der Doku-Ansicht.

## Schemas in Antworten und Bodies verwenden

In Antworten und Request-Bodies verweist du mit `Klasse::class` auf ein Schema. `OA\JsonContent` ist eine
Abkürzung für „Inhalt als `application/json` mit diesem Schema“:

```php title="src/Controller/ProductController.php"
#[OA\Get(path: '/products', operationId: 'listProducts')]
#[OA\Response(
    response: 200,
    description: 'Liste der Produkte',
    content: new OA\JsonContent(type: 'array', items: new OA\Items(ref: Product::class)),
)]
public function index(): array { /* … */ }

#[OA\Post(path: '/products', operationId: 'createProduct')]
#[OA\RequestBody(required: true, content: new OA\JsonContent(ref: Product::class))]
#[OA\Response(response: 201, description: 'Angelegt', content: new OA\JsonContent(ref: Product::class))]
public function store(): Product { /* … */ }
```

Aus `ref: Product::class` wird `$ref: '#/components/schemas/Product'`. Benennst du die Klasse um,
zieht die IDE den Verweis mit – bei einem Text-`$ref` in YAML müsstest du daran denken.

> [!PRAXIS]
> In Laravel-Projekten liefern Controller oft API-Resources statt Modelle direkt aus. Dann beschreibt
> man das Schema an einer eigenen Klasse, die genau die Felder der Resource abbildet – nicht am
> Eloquent-Modell mit allen Datenbankspalten. So landen keine internen Felder in der Doku.

## Zusammenfassung

- `#[OA\Schema]` an einer Klasse erzeugt einen Eintrag unter `components.schemas`.
- `#[OA\Property]` an jeder Eigenschaft – Typen und `null` liest swagger-php aus den PHP-Typen.
- Für Arrays gibst du den Elementtyp mit `items: new OA\Items(...)` an.
- Backed Enums bekommen `#[OA\Schema(type: 'string')]`, damit die Werte und nicht die Namen im Schema landen.
- In Antworten und Bodies verweist du mit `new OA\JsonContent(ref: Product::class)` auf das Schema.
- Prüfe erzeugte Spezifikationen mit `jq`, Redocly oder der Doku-Ansicht.
