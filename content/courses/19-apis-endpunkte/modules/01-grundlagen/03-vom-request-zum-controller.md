---
title: Vom Request zum Controller
summary: Wie ein Request auf dem Server seinen Endpunkt findet – Front Controller, Router, Route und Controller.
duration: 20
sources:
  - title: Laravel-Dokumentation – Routing
    url: https://laravel.com/docs/13.x/routing
  - title: Laravel-Dokumentation – Controllers
    url: https://laravel.com/docs/13.x/controllers
  - title: PHP-Handbuch – preg_match
    url: https://www.php.net/manual/de/function.preg-match.php
quiz:
  - type: single
    question: Welche Aufgabe hat der Router in einer Web-Anwendung?
    options:
      - Er leitet Datenpakete zwischen Netzwerken weiter.
      - Er sucht anhand von Methode und Pfad die passende Route und ruft den zugehörigen Controller auf.
      - Er speichert die Daten in der Datenbank.
      - Er verschlüsselt die Verbindung.
    answer: 1
    explanation: >
      Gemeint ist der Router *in der Anwendung*, nicht das Netzwerkgerät. Er vergleicht Methode und Pfad mit
      allen Routen und reicht den Request an den passenden Controller weiter.
  - type: cloze
    text: "Bei PHP-Anwendungen landen alle Requests zuerst in einer einzigen Datei, dem ___ – meist `public/index.php`."
    blanks:
      - [Front Controller, Front-Controller, Frontcontroller]
    explanation: Der Webserver schickt alles an index.php. Erst dort entscheidet der Router, welcher Code zuständig ist.
  - type: find-bug
    question: "Diese Routen-Tabelle soll `DELETE /books/{id}` zum Löschen anbieten. In welcher Zeile steckt der Fehler?"
    language: php
    code: |
      $routes = [
          ['GET', '/books', 'index'],
          ['POST', '/books', 'store'],
          ['GET', '/books/{id}', 'show'],
          ['GET', '/books/{id}', 'destroy'],
      ];
    bug_line: 5
    explanation: >
      Zeile 5 nutzt GET statt DELETE. Damit gibt es zwei Routen für `GET /books/{id}` – der Router nimmt die
      erste, und `destroy` ist nie erreichbar. Schlimmer noch: Ein Löschen per GET dürfte nie passieren.
  - type: multiple
    question: Was gehört typischerweise in einen Controller?
    options:
      - Eingaben aus dem Request lesen und prüfen lassen
      - Die passende Logik aufrufen, z. B. „Buch speichern“
      - Eine Response mit Statuscode und Body bauen
      - Die TCP-Verbindung zum Client aufbauen
    answers: [0, 1, 2]
    explanation: Verbindungen baut der Webserver auf. Der Controller arbeitet mit dem fertigen Request und liefert eine Response.
tasks:
  - id: route-finden
    type: code
    language: php
    title: Baue einen Mini-Router
    description: |
      Schreibe `matchRoute(array $routes, string $method, string $path): ?array`.

      - `$routes` ist eine Liste von Routen, jede Route ist `[Methode, Muster, Handler]`, z. B.
        `['GET', '/books/{id}', 'show']`.
      - Gib für die **erste** passende Route `['handler' => …, 'params' => […]]` zurück. `params` enthält die
        Werte der Platzhalter als Strings, z. B. `['id' => '2']`.
      - Passt keine Route, gib `null` zurück.

      Ein Platzhalter `{name}` passt auf genau ein Pfadsegment (alles außer `/`).
    starter: |
      <?php
      declare(strict_types=1);

      function matchRoute(array $routes, string $method, string $path): ?array
      {
          foreach ($routes as [$routeMethod, $pattern, $handler]) {
              // 1. Methode vergleichen
              // 2. Muster in einen regulären Ausdruck umwandeln: {id} -> (?P<id>[^/]+)
              // 3. preg_match ausführen und die benannten Treffer als params zurückgeben
          }

          return null;
      }
    tests:
      - name: findet eine Route ohne Platzhalter
        code: |
          $routes = [['GET', '/books', 'index'], ['GET', '/books/{id}', 'show']];
          assert_same(['handler' => 'index', 'params' => []], matchRoute($routes, 'GET', '/books'));
      - name: liest den Pfadparameter aus
        code: |
          $routes = [['GET', '/books', 'index'], ['GET', '/books/{id}', 'show']];
          assert_same(['handler' => 'show', 'params' => ['id' => '2']], matchRoute($routes, 'GET', '/books/2'));
      - name: unterscheidet Routen nach Methode
        code: |
          $routes = [['GET', '/books/{id}', 'show'], ['DELETE', '/books/{id}', 'destroy']];
          assert_same('destroy', matchRoute($routes, 'DELETE', '/books/5')['handler']);
          assert_same(null, matchRoute($routes, 'POST', '/books/5'));
      - name: passt nur auf den ganzen Pfad
        code: |
          $routes = [['GET', '/books/{id}', 'show']];
          assert_same(null, matchRoute($routes, 'GET', '/books/2/extra'));
          assert_same(null, matchRoute($routes, 'GET', '/books/'));
      - name: funktioniert mit verschachtelten Routen
        code: |
          $routes = [['GET', '/authors/{author}/books/{book}', 'authorBook']];
          assert_same(['handler' => 'authorBook', 'params' => ['author' => '7', 'book' => '3']], matchRoute($routes, 'GET', '/authors/7/books/3'));
    hints:
      - "`preg_replace('#\\{(\\w+)\\}#', '(?P<$1>[^/]+)', $pattern)` macht aus `{id}` eine benannte Gruppe."
      - "Setze `^` und `$` um das Muster, z. B. `'#^' . $regex . '$#'`, sonst passt `/books/2/extra` auch."
      - "`preg_match` liefert benannte Gruppen doppelt (Name und Nummer). Behalte nur die String-Schlüssel: `array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY)`."
    solution: |
      ```php
      <?php
      declare(strict_types=1);

      function matchRoute(array $routes, string $method, string $path): ?array
      {
          foreach ($routes as [$routeMethod, $pattern, $handler]) {
              if ($routeMethod !== $method) {
                  continue;
              }
              $regex = '#^' . preg_replace('#\{(\w+)\}#', '(?P<$1>[^/]+)', $pattern) . '$#';
              if (preg_match($regex, $path, $matches) === 1) {
                  $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);

                  return ['handler' => $handler, 'params' => $params];
              }
          }

          return null;
      }
      ```
  - id: weg-beschriften
    type: diagram
    title: Beschrifte den Weg eines Requests
    description: Ein Client fragt `GET /books/2`. Ordne jedem Kasten die richtige Station zu.
    image: /assets/apis-endpunkte/request-weg-leer.svg
    slots:
      - { x: 13, y: 37, answer: Client }
      - { x: 37, y: 37, answer: Router }
      - { x: 62, y: 37, answer: Controller }
      - { x: 87, y: 37, answer: Datenspeicher }
    distractors: [DNS-Server, Firewall]
    hints:
      - Der Router übersetzt `GET /books/2` in den Aufruf `show(2)`.
---
Du rufst `curl http://127.0.0.1:8080/books/2` auf und bekommst ein Buch zurück. Auf dem Server gibt es
aber keine Datei namens `books/2`. Wer entscheidet also, welcher Code diesen Request beantwortet? Das
erledigen zwei Bausteine, die du in jedem Web-Framework findest: **Router** und **Controller**.

## Die Reise eines Requests

![Der Weg eines Requests vom Client über Router und Controller zum Datenspeicher](/assets/apis-endpunkte/request-weg.svg)

1. Der **Client** schickt `GET /books/2` an den Server. Wie der Request über das Internet dorthin kommt
   (DNS, TCP, TLS), lernst du im Kurs „HTTP & HTTPS“.
2. Der [[webserver|Webserver]] (z. B. [[nginx]] oder `php -S`) nimmt die Verbindung an.
3. Der **Router** sucht die passende Route.
4. Der **Controller** erledigt die Arbeit und fragt dafür den Datenspeicher.
5. Die **Response** mit Statuscode, Headern und JSON geht zurück zum Client.

## Der Front Controller

Bei PHP-Anwendungen schickt der Webserver **alle** Requests an dieselbe Datei, meist `public/index.php`.
Dieses Muster heißt [[front-controller|Front Controller]]: Es gibt genau einen Eingang, und von dort aus
wird verteilt.

```php title="index.php – stark vereinfacht"
<?php
$method = $_SERVER['REQUEST_METHOD'];                       // z. B. "GET"
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);   // z. B. "/books/2"

$route = matchRoute($routes, $method, $path);
```

Der Vorteil: Gemeinsame Aufgaben – Anmeldung prüfen, Fehler abfangen, Antworten im JSON-Format bauen –
stehen an einer Stelle statt in hundert Dateien. Bilder, CSS und andere statische Dateien liefert der Webserver
dagegen meist direkt aus, ohne PHP zu starten – das ist deutlich schneller.

## Router und Routen

Eine [[route|Route]] verbindet einen Endpunkt mit dem Code, der ihn bedient. Der
[[http-router|Router]] hält eine Liste aller Routen und vergleicht jeden Request damit:

```php title="Routen-Tabelle"
$routes = [
    ['GET',    '/books',      'index'],
    ['POST',   '/books',      'store'],
    ['GET',    '/books/{id}', 'show'],
    ['DELETE', '/books/{id}', 'destroy'],
];
```

In Laravel sieht dasselbe so aus:

```php title="routes/api.php in Laravel"
Route::get('/books/{id}', [BookController::class, 'show']);
Route::delete('/books/{id}', [BookController::class, 'destroy']);
```

Passt keine Route, antwortet der Router mit `404 Not Found`. Passt nur der Pfad, aber nicht die Methode,
ist `405 Method Not Allowed` die richtige Antwort.

Die meisten Router nehmen die **erste** passende Route. Deshalb stehen feste Pfade wie `/books/export`
vor Mustern wie `/books/{id}` – sonst würde `export` als ID gelesen. Platzhalter passen außerdem nur auf
ein Pfadsegment: `/books/{id}` trifft `/books/2`, aber nicht `/books/2/reviews`.

> [!FEHLER]
> Der Router im Programm ist **nicht** der Router in deinem Netzwerk. Der Netzwerk-[[router]] leitet
> Datenpakete weiter; der Router einer Web-Anwendung ordnet Requests dem richtigen Code zu.

## Der Controller

Ein [[controller|Controller]] ist eine Klasse oder Funktion, die zu einer Route gehört. Er arbeitet in
drei Schritten:

1. **Eingaben lesen:** Pfadparameter, Query-String, Body.
2. **Arbeit erledigen:** Daten laden, prüfen, speichern – oft über eigene Service-Klassen.
3. **Response bauen:** Statuscode, Header, JSON.

```php title="Ein Controller als Funktion"
function show(array $params): array
{
    $book = findBook((int) $params['id']);
    if ($book === null) {
        return ['status' => 404, 'body' => ['title' => 'Nicht gefunden']];
    }

    return ['status' => 200, 'body' => ['data' => $book]];
}
```

Zwischen Router und Controller können noch [[middleware|Middlewares]] laufen, etwa um den Zugangsschlüssel
zu prüfen, bevor der Controller überhaupt startet.

> [!MERKSATZ]
> Router = „Wer ist zuständig?“, Controller = „Was ist zu tun?“. Der Controller bleibt schlank und
> delegiert die eigentliche Logik.

> [!PRAXIS]
> In großen Laravel-Projekten ist ein Controller selten länger als ein paar Zeilen: Eingabe prüfen lassen,
> eine Service-Methode aufrufen, eine Resource zurückgeben. So bleibt die Logik testbar und wiederverwendbar.

## Zusammenfassung

- Der Webserver nimmt den Request an und gibt ihn an den **Front Controller** (`index.php`).
- Der **Router** vergleicht Methode und Pfad mit allen **Routen**.
- Keine passende Route ergibt `404`, eine falsche Methode bei passendem Pfad ergibt `405`.
- Der **Controller** liest Eingaben, erledigt die Arbeit und baut die Response.
- **Middlewares** laufen davor, z. B. für Anmeldung oder Logging.
