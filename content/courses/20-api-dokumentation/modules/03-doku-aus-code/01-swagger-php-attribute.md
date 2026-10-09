---
title: OpenAPI aus PHP-Attributen mit swagger-php
summary: Du beschreibst Endpunkte direkt im PHP-Code mit Attributen und lässt swagger-php daraus die openapi.yaml erzeugen.
duration: 25
sources:
  - title: swagger-php – Dokumentation
    url: https://zircote.github.io/swagger-php/
  - title: swagger-php auf Packagist
    url: https://packagist.org/packages/zircote/swagger-php
  - title: PHP-Handbuch – Attribute
    url: https://www.php.net/manual/de/language.attributes.overview.php
quiz:
  - type: single
    question: 'Was ist ein PHP-Attribut wie `#[OA\Get(path: "/books")]`?'
    options:
      - Ein Kommentar, den PHP komplett ignoriert
      - Strukturierte Metadaten an Klassen, Methoden oder Eigenschaften, die Werkzeuge auslesen können
      - Eine Funktion, die beim Aufruf der Methode einen HTTP-Request schickt
      - Eine Laravel-Route
    answer: 1
    explanation: >
      Attribute (seit PHP 8) hängen Metadaten an Code. PHP führt sie nicht von selbst aus –
      swagger-php liest sie per Reflection und baut daraus die Spezifikation.
  - type: cloze
    text: "Installiert wird swagger-php mit `composer require zircote/swagger-php`. Die Spec erzeugst du mit `./vendor/bin/___ src -o openapi.yaml`."
    blanks:
      - [openapi]
    explanation: Das Paket bringt das Kommandozeilenprogramm vendor/bin/openapi mit. Es durchsucht die angegebenen Ordner.
  - type: multiple
    question: "swagger-php meldet `Skipping unknown App\\BookController` und erzeugt keine Pfade. Was kann die Ursache sein?"
    options:
      - Die Klasse ist nicht per Composer-Autoloading ladbar (Namespace und Ordner passen nicht zu autoload.psr-4).
      - Nach dem Anlegen der Klasse wurde der Autoloader nicht neu erzeugt.
      - Es fehlt ein Bearer-Token.
      - In einer Datei stehen mehrere Klassen, die der PSR-4-Autoloader nicht findet.
    answers: [0, 1, 3]
    explanation: >
      swagger-php lädt die Klassen, um ihre Attribute zu lesen. Das klappt nur, wenn Composer sie
      findet: eine Klasse pro Datei, Namespace passend zum Ordner, und `composer dump-autoload` nach Änderungen.
  - type: find-bug
    question: In welcher Zeile steckt der Fehler?
    language: php
    code: |
      #[OA\Get(path: "/books/{id}", operationId: "getBook")]
      #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
      #[OA\Response(response: 200, description: "Das Buch")]
      #[OA\Response(response: 404)]
      public function show(int $id): array
    bug_line: 4
    explanation: >
      Jede Antwort braucht eine description – genau wie in der YAML-Datei. swagger-php schreibt sonst
      eine ungültige Spezifikation, und Redocly meldet einen Fehler.
tasks:
  - id: attribute-zuordnen
    type: dragdrop
    title: Welches Attribut erzeugt was?
    description: Ordne jedes swagger-php-Attribut dem Teil der OpenAPI-Datei zu, den es erzeugt.
    targets:
      - { id: info, label: "info / servers" }
      - { id: operation, label: "paths → Operation" }
      - { id: detail, label: "parameters / requestBody / responses" }
    items:
      - { label: "#[OA\\Info(title: ..., version: ...)]", target: info }
      - { label: "#[OA\\Server(url: ...)]", target: info }
      - { label: "#[OA\\Get(path: \"/books\")]", target: operation }
      - { label: "#[OA\\Delete(path: \"/books/{id}\")]", target: operation }
      - { label: "#[OA\\Parameter(name: \"id\", in: \"path\")]", target: detail }
      - { label: "#[OA\\Response(response: 200, description: ...)]", target: detail }
      - { label: "#[OA\\RequestBody(required: true, ...)]", target: detail }
  - id: erste-attribute
    type: terminal
    title: Deine erste Spezifikation aus PHP-Code
    description: |
      Im Ordner `shop-api` liegt eine kleine PHP-API: `src/OpenApi.php` (mit `OA\Info`) und
      `src/Controller/ProductController.php`. Die Methode `index()` ist schon beschrieben, `show()`
      noch nicht. Klicke zuerst auf **Aufgabe vorbereiten**.

      1. Installiere swagger-php: `composer require zircote/swagger-php:^6.12`
      2. Ergänze an `show()` die Attribute für `GET /products/{id}` mit `operationId: "getProduct"`,
         einem Pfadparameter `id` (integer) und den Antworten `200` (Das Produkt) und `404` (Produkt nicht gefunden).
      3. Erzeuge die Spezifikation: `./vendor/bin/openapi src -o openapi.yaml`
      4. Schau sie dir mit `cat openapi.yaml` an. Steht `openapi: 3.1.0` ganz oben?
    workdir: shop-api
    setup: |
      mkdir -p src/Controller
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
      cat > src/OpenApi.php <<'EOF'
      <?php

      declare(strict_types=1);

      namespace App;

      use OpenApi\Attributes as OA;

      #[OA\OpenApi(openapi: "3.1.0")]
      #[OA\Info(version: "1.0.0", title: "Shop-API", description: "Produkte eines kleinen Online-Shops.")]
      #[OA\Server(url: "https://api.example.com/v1")]
      final class OpenApi
      {
      }
      EOF
      cat > src/Controller/ProductController.php <<'EOF'
      <?php

      declare(strict_types=1);

      namespace App\Controller;

      use OpenApi\Attributes as OA;

      final class ProductController
      {
          #[OA\Get(path: "/products", operationId: "listProducts", summary: "Alle Produkte", tags: ["Products"])]
          #[OA\Response(response: 200, description: "Liste der Produkte")]
          public function index(): array
          {
              return [['id' => 1, 'name' => 'Tasse']];
          }

          public function show(int $id): array
          {
              return ['id' => $id, 'name' => 'Tasse'];
          }
      }
      EOF
    checks:
      - type: dir_exists
        path: vendor/zircote/swagger-php
        message: swagger-php ist noch nicht installiert. Führe composer require zircote/swagger-php:^6.12 aus.
      - type: file_exists
        path: openapi.yaml
        message: openapi.yaml fehlt. Erzeuge sie mit ./vendor/bin/openapi src -o openapi.yaml.
      - type: file_contains
        path: openapi.yaml
        pattern: "^openapi: 3\\.1\\.0"
        message: openapi.yaml beginnt nicht mit openapi 3.1.0. Wurde sie mit den Attributen aus src erzeugt?
      - type: file_contains
        path: openapi.yaml
        pattern: "operationId: getProduct"
        message: In openapi.yaml fehlt die Operation getProduct. Ergänze die Attribute an show() und erzeuge die Datei neu.
      - type: command
        run: "./vendor/bin/openapi src --format json 2>/dev/null | jq -r '.paths[\"/products/{id}\"].get | [.operationId, (.parameters[0] | .name + \":\" + .in + \":\" + .schema.type), (.responses | keys | join(\",\"))] | join(\"|\")'"
        stdout_equals: "getProduct|id:path:integer|200,404"
        message: "GET /products/{id} braucht operationId getProduct, den Pfadparameter id (integer) und die Antworten 200 und 404."
    hints:
      - Schau dir an, wie `index()` beschrieben ist – `show()` funktioniert genauso, nur mit Pfadparameter.
      - 'Der Parameter: `#[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]`'
      - Nach jeder Änderung an den Attributen musst du `./vendor/bin/openapi src -o openapi.yaml` erneut ausführen.
    solution: |
      ```php title="src/Controller/ProductController.php (show)"
      #[OA\Get(path: "/products/{id}", operationId: "getProduct", summary: "Ein Produkt", tags: ["Products"])]
      #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
      #[OA\Response(response: 200, description: "Das Produkt")]
      #[OA\Response(response: 404, description: "Produkt nicht gefunden")]
      public function show(int $id): array
      {
          return ['id' => $id, 'name' => 'Tasse'];
      }
      ```

      ```bash
      composer require zircote/swagger-php:^6.12
      ./vendor/bin/openapi src -o openapi.yaml
      cat openapi.yaml
      ```
---
Du hast gelernt, eine OpenAPI-Datei von Hand zu schreiben. Aber was passiert, wenn morgen jemand im
Controller einen neuen Parameter einbaut? Die YAML-Datei weiß davon nichts. Beim **Code-first**-Ansatz
steht die Beschreibung deshalb direkt neben dem Code – und ein Werkzeug erzeugt die Datei daraus.

## PHP-Attribute: Metadaten am Code

Seit PHP 8 gibt es [[php-attribut|Attribute]]. Das sind strukturierte Zusatzinfos in `#[...]`, die du
an Klassen, Methoden, Eigenschaften oder Parameter hängst:

```php title="Ein Attribut an einer Methode"
#[OA\Get(path: '/books', operationId: 'listBooks')]
public function index(): array
{
    // …
}
```

PHP führt Attribute nicht von selbst aus. Ein Programm kann sie aber per [[reflection|Reflection]] auslesen. Genau
das macht [[swagger-php]]: Es liest die Attribute deiner Klassen und baut daraus eine OpenAPI-Datei.

| Früher (Docblock-Annotation) | Heute (Attribut) |
|---|---|
| `/** @OA\Get(path="/books") */` | `#[OA\Get(path: '/books')]` |
| Text in einem Kommentar | Echter PHP-Code, von der IDE geprüft |

Ältere Projekte nutzen noch Docblock-Annotationen. Für neuen Code nimmst du Attribute – die
IDE ergänzt Namen, und Tippfehler fallen sofort auf.

## Installation und Grundgerüst

swagger-php ist ein [[composer|Composer]]-Paket:

```bash title="Terminal"
composer require zircote/swagger-php:^6.12
```

Einmal pro Projekt beschreibst du die API als Ganzes – meist in einer eigenen, leeren Klasse:

```php title="src/OpenApi.php"
<?php

declare(strict_types=1);

namespace App;

use OpenApi\Attributes as OA;

#[OA\OpenApi(openapi: '3.1.0')]
#[OA\Info(version: '1.0.0', title: 'Shop-API', description: 'Produkte eines Online-Shops.')]
#[OA\Server(url: 'https://api.example.com/v1')]
final class OpenApi
{
}
```

`use OpenApi\Attributes as OA;` gibt dem [[namespace|Namespace]] den kurzen Namen `OA`. Das
`OA\OpenApi`-Attribut legt die Version des Standards fest – ohne Angabe schreibt swagger-php `3.0.0`.

## Operationen am Controller beschreiben

Jede Controller-Methode bekommt die passenden Attribute. Sie entsprechen eins zu eins den YAML-Teilen,
die du kennst:

```php title="src/Controller/ProductController.php"
final class ProductController
{
    #[OA\Get(path: '/products/{id}', operationId: 'getProduct', summary: 'Ein Produkt', tags: ['Products'])]
    #[OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))]
    #[OA\Response(response: 200, description: 'Das Produkt')]
    #[OA\Response(response: 404, description: 'Produkt nicht gefunden')]
    public function show(int $id): array
    {
        // …
    }
}
```

| Attribut | YAML-Gegenstück |
|---|---|
| `OA\Get`, `OA\Post`, `OA\Put`, `OA\Patch`, `OA\Delete` | Operation unter `paths` |
| `OA\Parameter` | Eintrag in `parameters` |
| `OA\RequestBody` | `requestBody` |
| `OA\Response` | Eintrag in `responses` |

Verschachtelte Teile übergibst du als Objekte mit `new`, etwa `schema: new OA\Schema(type: 'integer')`
im Parameter. Benannte Argumente (`path:`, `operationId:`) machen die Attribute gut lesbar, und die IDE
schlägt dir die erlaubten Namen vor. Ein Tippfehler wie `operationID:` fällt so schon beim Schreiben auf.

> [!MERKSATZ]
> Ein Attribut pro YAML-Baustein: Die Namen und Felder heißen fast genauso wie in der Spezifikation.

## Die Spezifikation erzeugen

Das Paket bringt das Programm `vendor/bin/openapi` mit. Du gibst die Ordner an, die es durchsuchen soll:

```bash title="Terminal"
./vendor/bin/openapi src -o openapi.yaml          # YAML-Datei schreiben
./vendor/bin/openapi src --format json            # JSON auf die Standardausgabe
./vendor/bin/openapi src -e src/Legacy -o openapi.yaml   # Ordner ausschließen
```

Die Dateiendung von `-o` bestimmt das Format. Mit `--version 3.1.0` legst du die Version auch auf der
Kommandozeile fest.

> [!FEHLER]
> `Skipping unknown App\ProductController` und keine Pfade in der Datei? swagger-php muss die Klassen
> **laden** können. Prüfe: Steht `autoload.psr-4` in `composer.json`? Passt der [[psr-4|PSR-4]]-Namespace
> zum Ordner? Eine Klasse pro Datei? Nach neuen Dateien hilft `composer dump-autoload`.

> [!PRAXIS]
> In Projekten steht der Befehl als Composer-Skript in `composer.json` (z. B. `"docs": "openapi src -o docs/openapi.yaml"`),
> damit alle im Team und die CI exakt denselben Aufruf nutzen: `composer docs`.

## Zusammenfassung

- **PHP-Attribute** (`#[...]`) sind Metadaten am Code; swagger-php liest sie per Reflection aus.
- Installation: `composer require zircote/swagger-php`, Import mit `use OpenApi\Attributes as OA;`.
- `OA\Info`, `OA\Server` und `OA\OpenApi` beschreiben die API als Ganzes – einmal pro Projekt.
- `OA\Get`/`OA\Post`/…, `OA\Parameter`, `OA\RequestBody` und `OA\Response` beschreiben Operationen.
- `./vendor/bin/openapi src -o openapi.yaml` erzeugt die Datei; die Klassen müssen per Autoloading ladbar sein.
