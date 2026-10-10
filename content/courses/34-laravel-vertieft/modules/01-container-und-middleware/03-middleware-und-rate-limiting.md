---
title: Middleware und Rate Limiting
summary: Eigene Middleware vor und nach der Route, Parameter, Aliase und Gruppen – und wie du Routen mit benannten Rate Limitern schützt.
duration: 25
sources:
  - title: Laravel – Middleware
    url: https://laravel.com/docs/13.x/middleware
  - title: Laravel – Routing, Rate Limiting
    url: https://laravel.com/docs/13.x/routing#rate-limiting
  - title: Laravel – Rate Limiting
    url: https://laravel.com/docs/13.x/rate-limiting
quiz:
  - type: single
    question: Eine Middleware soll an jede Response den Header `X-Request-Id` hängen. Wo im `handle()` passiert das?
    options:
      - Vor `$next($request)`, weil der Header früh gesetzt werden muss
      - Nach `$response = $next($request)`, weil erst dann eine Response existiert
      - In einer eigenen Methode `after()`
    answer: 1
    explanation: Erst $next($request) läuft weiter bis zur Route und liefert die Response. Danach kannst du sie verändern und zurückgeben – das ist eine „After“-Middleware.
  - type: match
    question: Was bewirkt welche Zeile in `bootstrap/app.php`?
    pairs:
      - { left: "$middleware->append(Foo::class)", right: Läuft bei jedem Request (global) }
      - { left: "$middleware->alias(['foo' => Foo::class])", right: "Kurzer Name für ->middleware('foo')" }
      - { left: "$middleware->web(append: [Foo::class])", right: Läuft für alle Routen in routes/web.php }
    explanation: Global heißt wirklich jeder Request. Ein Alias registriert nichts, sondern gibt nur einen Namen. Mit web() hängst du Middleware an die Gruppe der Web-Routen.
  - type: cloze
    text: "Die Route `->middleware('role:editor')` ruft `handle($request, $next, ___ $role)` mit `$role = 'editor'` auf. Wird ein Rate Limit überschritten, antwortet Laravel mit dem Statuscode ___."
    blanks:
      - [string]
      - ["429"]
    explanation: Parameter stehen nach dem Doppelpunkt und kommen als zusätzliche Argumente nach $next an. 429 bedeutet „Too Many Requests“.
  - type: find-bug
    question: Diese Middleware soll Anfragen ohne gültigen Schlüssel ablehnen. Trotzdem kommt jede Anfrage durch. Welche Zeile ist falsch?
    language: php
    code: |
      public function handle(Request $request, Closure $next): Response
      {
          if ($request->header('X-Api-Key') !== config('services.partner.key')) {
              response('Unauthorized', 401);
          }

          return $next($request);
      }
    bug_line: 4
    explanation: Die Response wird zwar erzeugt, aber nicht zurückgegeben. Ohne return läuft der Code weiter zu $next($request). Richtig ist return response('Unauthorized', 401); oder abort(401);.
tasks:
  - id: pipeline-bauen
    type: code
    language: php
    title: Die Middleware-Zwiebel nachbauen
    description: |
      Laravel schickt jeden Request durch eine *Pipeline* aus Middleware. Baue dieses Prinzip nach.

      Schreibe `run_pipeline(array $layers, Closure $core, array $request): array`.

      - Jede Schicht in `$layers` ist eine Funktion `fn (array $request, Closure $next): array`.
      - Die **erste** Schicht im Array ist die **äußerste**: Sie sieht den Request zuerst und die
        Response zuletzt.
      - `$core` ist die Route: `fn (array $request): array` und liefert die Response.
      - Ruft eine Schicht `$next` nicht auf, kommt der Request nie beim Kern an (Abbruch).
      - Ohne Schichten wird einfach `$core($request)` zurückgegeben.
    starter: |
      <?php

      function run_pipeline(array $layers, Closure $core, array $request): array
      {
          // Tipp: Baue die Kette von innen nach außen auf.
      }
    tests:
      - name: ohne Schichten antwortet direkt der Kern
        code: |
          $r = run_pipeline([], fn ($req) => ['status' => 200, 'body' => $req['path']], ['path' => '/']);
          assert_same(['status' => 200, 'body' => '/'], $r);
      - name: Reihenfolge vorher und nachher stimmt
        code: |
          $log = new ArrayObject();
          $a = function ($req, $next) use ($log) { $log->append('A vor'); $res = $next($req); $log->append('A nach'); return $res; };
          $b = function ($req, $next) use ($log) { $log->append('B vor'); $res = $next($req); $log->append('B nach'); return $res; };
          run_pipeline([$a, $b], function ($req) use ($log) { $log->append('Route'); return ['status' => 200]; }, []);
          assert_same(['A vor', 'B vor', 'Route', 'B nach', 'A nach'], $log->getArrayCopy());
      - name: eine Schicht kann abbrechen
        code: |
          $auth = fn ($req, $next) => isset($req['key']) ? $next($req) : ['status' => 401];
          $kernAufgerufen = new ArrayObject();
          $r = run_pipeline([$auth], function ($req) use ($kernAufgerufen) { $kernAufgerufen->append(1); return ['status' => 200]; }, []);
          assert_same(401, $r['status']);
          assert_same(0, count($kernAufgerufen));
      - name: Schichten können Request und Response verändern
        code: |
          $setzeUser = fn ($req, $next) => $next($req + ['user' => 'ada']);
          $header = function ($req, $next) { $res = $next($req); $res['headers'] = ['X-Request-Id' => 'abc']; return $res; };
          $r = run_pipeline([$header, $setzeUser], fn ($req) => ['status' => 200, 'body' => $req['user']], []);
          assert_same('ada', $r['body']);
          assert_same('abc', $r['headers']['X-Request-Id']);
    hints:
      - "Starte mit `$next = $core;` und gehe die Schichten **rückwärts** durch (`array_reverse`)."
      - "Für jede Schicht: `$next = fn (array $req) => $layer($req, $nextBisher);` – merke dir das alte `$next` vorher in einer eigenen Variable."
      - "Am Ende `return $next($request);`."
    solution: |
      <?php

      function run_pipeline(array $layers, Closure $core, array $request): array
      {
          $next = $core;

          foreach (array_reverse($layers) as $layer) {
              $inner = $next;
              $next = fn (array $req): array => $layer($req, $inner);
          }

          return $next($request);
      }
  - id: limit-ueberschritten
    type: request
    title: Die geschützte Status-Route abfragen
    description: |
      Die Route `GET /orders/{order}` der Partner-API ist mit `api.key` und `throttle:orders` geschützt.
      Frage den Status der Bestellung **42** ab. Der API-Schlüssel lautet `test-api-key` und gehört in
      den Header `X-Api-Key`. Damit die Antwort als JSON kommt, schickst du außerdem
      `Accept: application/json` mit.
    base_url: https://shop.example.com
    expected:
      method: GET
      path: "^/orders/42$"
      headers:
        X-Api-Key: "^test-api-key$"
        Accept: "application/json"
    response:
      status: 200
      body: '{"number": "B-20261010-K7QZ", "status": "paid", "total": "12,50 €"}'
    hints:
      - Ohne den Header würde die Middleware mit 401 abbrechen.
      - Der Pfad enthält nur die ID, keine Query-Parameter.
---
Jeder Request an deine Anwendung soll eine Request-ID im Header bekommen, eine Partner-Schnittstelle
braucht einen API-Schlüssel, und niemand darf sie mit tausend Anfragen pro Minute fluten. Diese Regeln in
jeden Controller zu kopieren, wäre fehleranfällig. Dafür gibt es **Middleware**.

![Middleware als Schichten um die Route: Rate Limit, API-Schlüssel, Request-ID](/assets/laravel-vertieft/middleware-zwiebel.svg)

## Middleware: Schichten um die Route

Eine [[middleware|Middleware]] ist eine Klasse mit einer Methode `handle()`. Sie bekommt den Request und
eine [[closure|Closure]] `$next`, die „die nächste Schicht“ aufruft. Stell dir eine Zwiebel vor: Der
Request geht von außen durch alle Schichten zur Route, die Response geht denselben Weg zurück.

```php title="app/Http/Middleware/EnsureApiKey.php"
public function handle(Request $request, Closure $next): Response
{
    if ($request->header('X-Api-Key') !== config('services.partner.key')) {
        abort(401);
    }

    return $next($request);
}
```

Jede Middleware hat zwei Möglichkeiten:

- **Durchlassen**: `return $next($request);`
- **Abbrechen**: eine eigene Response zurückgeben oder `abort(401)` – dann sieht die Route den Request nie.

Erzeugt wird sie mit `php artisan make:middleware EnsureApiKey`. Wie Controller wird sie über den
Service Container gebaut – du kannst also Abhängigkeiten im Konstruktor verlangen.

## Vorher oder nachher

Was **vor** `$next()` steht, läuft auf dem Hinweg. Was **danach** steht, läuft auf dem Rückweg und kann
die Response verändern:

```php title="app/Http/Middleware/AddRequestId.php"
public function handle(Request $request, Closure $next): Response
{
    $id = (string) Str::uuid();          // vorher: Request vorbereiten

    $response = $next($request);         // weiter zur Route

    $response->headers->set('X-Request-Id', $id);   // nachher: Response ergänzen

    return $response;
}
```

| Position | Typische Aufgabe |
|---|---|
| vor `$next` | prüfen (Login, Schlüssel), Request anreichern, abbrechen |
| nach `$next` | [[http-header|Header]] setzen, Antwortzeit messen, Response umbauen |

> [!FEHLER]
> **Response erzeugt, aber nicht zurückgegeben.** `response('Nein', 401);` ohne `return` tut nichts –
> der Code läuft weiter zu `$next`. Nutze `return response(…)` oder `abort(401)`.

## Registrieren: global, Alias, Gruppe

Seit Laravel 11 registrierst du Middleware in `bootstrap/app.php`:

```php title="bootstrap/app.php"
->withMiddleware(function (Middleware $middleware): void {
    $middleware->append(AddRequestId::class);                 // global, jeder Request
    $middleware->alias(['api.key' => EnsureApiKey::class]);   // Kurzname
    $middleware->web(append: [TrackLastVisit::class]);        // alle Web-Routen
})
```

An einzelnen Routen oder Gruppen hängst du sie mit `middleware()` an:

```php title="routes/web.php"
Route::middleware(['api.key'])->group(function () {
    Route::get('/orders/{order}', [OrderStatusController::class, 'show']);
    Route::get('/health', HealthController::class)->withoutMiddleware(['api.key']);
});
```

**Parameter** folgen nach einem Doppelpunkt und kommen als zusätzliche Argumente an:

```php
Route::put('/posts/{post}', …)->middleware('role:editor,publisher');

public function handle(Request $request, Closure $next, string ...$roles): Response
```

> [!TIPP]
> Muss nach dem Senden der Response noch etwas passieren, etwa Logging, kannst du eine Methode
> `terminate(Request $request, Response $response)` ergänzen. Details:
> [Terminable Middleware](https://laravel.com/docs/13.x/middleware#terminable-middleware).

## Rate Limiting mit benannten Limitern

[[rate-limiting|Rate Limiting]] begrenzt, wie oft jemand eine Route aufrufen darf. In Laravel definierst
du dafür **benannte Limiter** im `boot()` eines Providers:

```php title="app/Providers/AppServiceProvider.php"
public function boot(): void
{
    RateLimiter::for('orders', function (Request $request) {
        return Limit::perMinute(5)->by($request->header('X-Api-Key') ?: $request->ip());
    });
}
```

Die Route nutzt ihn über die eingebaute Middleware `throttle`:

```php
Route::get('/orders/{order}', …)->middleware(['api.key', 'throttle:orders']);
```

- `perMinute(5)`, `perHour(100)`, `perDay(1000)` legen das Limit fest.
- `by(...)` bestimmt, **wer** gezählt wird: pro IP, pro Nutzer oder pro API-Schlüssel.
- Ist das Limit erreicht, antwortet Laravel mit [[statuscode|Statuscode]] **429** und dem Header
  `Retry-After` – die Sekunden bis zum nächsten erlaubten Versuch.

Gezählt wird im Cache. Für eigene Zählungen ohne Route gibt es `RateLimiter::attempt()`.

> [!PRAXIS]
> Partner-Schnittstellen begrenzt man pro API-Schlüssel, nicht pro IP: Mehrere Server eines Partners
> teilen sich oft eine IP, und ein einzelner Partner soll nicht alle anderen ausbremsen.

> [!MERKSATZ]
> Middleware erledigt alles, was **viele Routen gleich** brauchen. Rate Limiter definierst du mit
> `RateLimiter::for()` in `boot()` und hängst sie mit `throttle:name` an.

## Zusammenfassung

- Middleware umschließt die Route wie Zwiebelschichten; `$next($request)` reicht weiter.
- Code vor `$next` prüft und bricht ab, Code danach verändert die Response.
- Registrierung in `bootstrap/app.php`: `append()` global, `alias()` für Kurznamen, `web()`/`api()` für Gruppen.
- Parameter stehen nach dem Doppelpunkt (`role:editor`) und kommen nach `$next` an.
- `RateLimiter::for('name', …)` mit `Limit::perMinute()->by()` plus `throttle:name` schützt Routen; zu viele Anfragen ergeben 429.
