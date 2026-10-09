---
title: "Laravel: Scramble und Scribe"
summary: Für Laravel gibt es Werkzeuge, die die Spezifikation größtenteils selbst aus Routen, FormRequests und Resources ableiten. Du vergleichst Scramble, Scribe und swagger-php.
duration: 20
sources:
  - title: Scramble – Getting started
    url: https://scramble.dedoc.co/usage/getting-started
  - title: Scramble – Exporting specification
    url: https://scramble.dedoc.co/usage/export
  - title: Scribe für Laravel
    url: https://scribe.knuckles.wtf/laravel/
quiz:
  - type: single
    question: Woher bekommt Scramble die Felder eines Request-Bodys?
    options:
      - Aus Kommentaren, die du über jede Methode schreibst
      - Aus den Validierungsregeln des FormRequests bzw. von validate()
      - Aus einer YAML-Datei, die du von Hand pflegst
      - Aus der Datenbank
    answer: 1
    explanation: >
      Scramble analysiert den Code: `'title' => ['required', 'string', 'max:200']` wird zu einem
      Pflichtfeld vom Typ string mit maxLength 200. Du schreibst keine extra Beschreibung.
  - type: match
    question: Ordne jedes Werkzeug seiner Arbeitsweise zu.
    pairs:
      - { left: "swagger-php", right: "Explizite OA-Attribute an Klassen und Methoden" }
      - { left: "Scramble", right: "Statische Code-Analyse, fast ohne Annotationen" }
      - { left: "Scribe", right: "Docblocks oder Attribute plus Beispielaufrufe der API" }
    explanation: Alle drei erzeugen OpenAPI. Sie unterscheiden sich darin, wie viel du selbst beschreibst.
  - type: multiple
    question: Welche Aussagen über Scramble stimmen?
    options:
      - Die Doku-Seite liegt standardmäßig unter /docs/api.
      - Die Spezifikation als JSON gibt es unter /docs/api.json.
      - "`php artisan scramble:export` schreibt die Spezifikation in eine Datei."
      - Scramble funktioniert nur mit Symfony.
    answers: [0, 1, 2]
    explanation: Scramble ist ein Laravel-Paket. Standardmäßig dokumentiert es alle Routen, die mit api beginnen.
  - type: cloze
    text: "Scramble exportiert die Spezifikation mit php artisan scramble:___. Scribe erzeugt seine Doku mit php artisan scribe:___."
    blanks:
      - [export]
      - [generate]
    explanation: Beide Befehle eignen sich für die CI, um die Datei bei jedem Build neu zu erzeugen.
tasks:
  - id: werkzeug-waehlen
    type: dragdrop
    title: Welches Werkzeug passt am besten?
    description: Ordne jede Situation dem Werkzeug zu, das am besten passt.
    targets:
      - { id: swaggerphp, label: swagger-php }
      - { id: scramble, label: Scramble }
      - { id: scribe, label: Scribe }
    items:
      - { label: "Ein Projekt ohne Laravel, z. B. Symfony oder pures PHP", target: swaggerphp }
      - { label: "Laravel-Team will möglichst gar nichts annotieren", target: scramble }
      - { label: "Beispielantworten sollen durch echte Aufrufe der API entstehen", target: scribe }
      - { label: Volle Kontrolle über jedes Detail der Spezifikation, target: swaggerphp }
      - { label: Typen werden aus FormRequests und API-Resources abgeleitet, target: scramble }
      - { label: Neben der Doku wird gleich eine Postman-Collection gebaut, target: scribe }
  - id: scramble-export
    type: simulated
    title: Scramble installieren und exportieren
    description: |
      Du arbeitest in einem Laravel-Projekt. Installiere Scramble, exportiere die Spezifikation nach
      `docs/v1/openapi.json` und prüfe sie mit Redocly.

      1. Installiere das Paket `dedoc/scramble` mit Composer.
      2. Exportiere die Spezifikation mit `php artisan scramble:export --path=docs/v1/openapi.json`.
      3. Prüfe die Datei mit `npx @redocly/cli lint docs/v1/openapi.json`.
    prompt: "du@laptop:~/shop$"
    steps:
      - expect: "^composer\\s+require\\s+dedoc/scramble(:\\S+)?$"
        output: |
          ./composer.json has been updated
          Running composer update dedoc/scramble
          Loading composer repositories with package information
          Updating dependencies
          Lock file operations: 1 install, 0 updates, 0 removals
            - Locking dedoc/scramble
          Writing lock file
          Installing dependencies from lock file (including require-dev)
            - Installing dedoc/scramble: Extracting archive
          Generating optimized autoload files
          > @php artisan package:discover --ansi
            dedoc/scramble .................................................. DONE
        hint: "composer require dedoc/scramble"
      - expect: "^php\\s+artisan\\s+scramble:export\\s+--path=docs/v1/openapi\\.json$"
        output: |
          OpenAPI document exported to docs/v1/openapi.json.
        hint: "php artisan scramble:export --path=docs/v1/openapi.json"
      - expect: "^npx\\s+(@redocly/cli|redocly)\\s+lint\\s+docs/v1/openapi\\.json$"
        output: |
          validating docs/v1/openapi.json...
          docs/v1/openapi.json: validated in 41ms

          Woohoo! Your API description is valid. 🎉
        hint: "npx @redocly/cli lint docs/v1/openapi.json"
    responses:
      - match: "^ls"
        output: "app  bootstrap  composer.json  config  docs  public  routes  vendor"
      - match: "^php\\s+artisan\\s+route:list"
        output: |
          GET|HEAD   api/products ........ ProductController@index
          POST       api/products ........ ProductController@store
          GET|HEAD   api/products/{product} ProductController@show
---
Du hast gesehen, wie swagger-php mit Attributen arbeitet. In Laravel steckt aber schon viel
Information im Code: Routen kennen Pfad und Methode, FormRequests kennen die Eingaben, API-Resources
die Ausgaben. Zwei verbreitete Pakete nutzen das und erzeugen die Spezifikation mit wenig oder ganz
ohne Annotationen.

## Was Laravel schon über deine API weiß

| Im Laravel-Code | Daraus wird in OpenAPI |
|---|---|
| `Route::get('/products/{product}', …)` in `routes/api.php` | Pfad, Methode, Pfadparameter |
| [[form-request|FormRequest]] mit `rules()` | Request-Body mit Typen und Pflichtfeldern |
| [[api-resource|API-Resource]] mit `toArray()` | Schema der Antwort |
| `abort(404)` / Model Binding | Antwort `404` |
| Middleware `auth:sanctum` | Security-Angabe |

```php title="Ein FormRequest – alles Wissen ist schon da"
public function rules(): array
{
    return [
        'name'  => ['required', 'string', 'max:120'],
        'price' => ['required', 'numeric', 'min:0'],
        'tags'  => ['array'],
        'tags.*' => ['string'],
    ];
}
```

Aus `required|string|max:120` lässt sich ein Pflichtfeld vom Typ `string` mit `maxLength: 120` ableiten.
Genau das tun die Werkzeuge in diesem Abschnitt.

## Scramble: Doku durch Code-Analyse

[[scramble|Scramble]] (Paket `dedoc/scramble`) analysiert deinen Code statisch – ohne ihn auszuführen.
Es erkennt Routen, Validierungsregeln, Rückgabetypen und Resources.

```bash title="Terminal"
composer require dedoc/scramble
```

Danach gibt es zwei Routen, standardmäßig nur in der lokalen Umgebung:

- `/docs/api` – die Doku-Seite,
- `/docs/api.json` – die Spezifikation als JSON.

Dokumentiert werden alle Routen, deren Pfad mit `api` beginnt. Für die CI exportierst du die Datei:

```bash title="Terminal"
php artisan scramble:export --path=docs/v1/openapi.json
```

Wo die Analyse nicht reicht, ergänzt du Docblocks oder Attribute – etwa für eine Beschreibung.

> [!MERKSATZ]
> Scramble leitet ab, was im Code steht. Je sauberer der Code typisiert ist (FormRequests,
> Resources, Rückgabetypen), desto besser wird die Doku.

## Scribe: Annotationen und echte Aufrufe

[[scribe|Scribe]] (Paket `knuckleswtf/scribe`) liest ebenfalls Routen und FormRequests, setzt aber
stärker auf Beschreibungen per Docblock oder Attribut. Außerdem kann es die API bei der Erzeugung
**wirklich aufrufen** (*response calls*), um echte Beispielantworten zu sammeln.

```php title="Beschreibung mit Scribe-Attributen"
#[Group('Products')]
#[BodyParam('name', 'string', 'Name des Produkts.', example: 'Tasse')]
public function store(StoreProductRequest $request) { /* … */ }
```

```bash title="Terminal"
composer require --dev knuckleswtf/scribe
php artisan vendor:publish --tag=scribe-config
php artisan scribe:generate
```

Scribe erzeugt eine HTML-Doku und auf Wunsch eine Postman-Collection und eine OpenAPI-Datei.

> [!FEHLER]
> Response calls schicken echte Anfragen. Laufen sie gegen eine Datenbank mit echten Daten, landen
> diese als Beispiele in der Doku – oder ein `DELETE` löscht etwas. Nutze dafür nur eine Testdatenbank.

## Drei Werkzeuge im Vergleich

| | swagger-php | Scramble | Scribe |
|---|---|---|---|
| Framework | jedes PHP-Projekt | Laravel | Laravel |
| Beschreibung | explizite `OA\`-Attribute | automatisch aus dem Code | Code + Docblocks/Attribute |
| Aufwand pro Endpunkt | hoch | sehr gering | mittel |
| Kontrolle | vollständig | so gut wie die Analyse | hoch |
| Beispiele | von Hand | abgeleitet | auch aus echten Aufrufen |

Es gibt kein „bestes“ Werkzeug. Ältere oder gemischte Projekte bleiben oft bei swagger-php, weil es
überall funktioniert und jedes Detail steuerbar ist. Neue Laravel-Projekte starten gern mit Scramble.

> [!PRAXIS]
> Egal welches Werkzeug: Der Ablauf in der CI ist immer gleich – erzeugen, mit Redocly linten,
> die Datei mit der eingecheckten Version vergleichen. Das baust du im nächsten Modul.

## Zusammenfassung

- Laravel-Code enthält viel API-Wissen: Routen, FormRequests, Resources, Middleware.
- **Scramble** (`dedoc/scramble`) leitet die Spezifikation per Code-Analyse ab; Doku unter `/docs/api`, Export mit `php artisan scramble:export`.
- **Scribe** (`knuckleswtf/scribe`) nutzt Docblocks/Attribute und kann echte Beispielaufrufe machen; `php artisan scribe:generate`.
- **swagger-php** funktioniert in jedem PHP-Projekt und gibt dir volle Kontrolle – mit mehr Schreibarbeit.
- Unabhängig vom Werkzeug wird die erzeugte Datei gelintet und in der CI geprüft.
