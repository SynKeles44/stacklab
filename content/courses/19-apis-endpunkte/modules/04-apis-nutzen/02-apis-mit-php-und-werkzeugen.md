---
title: APIs mit PHP und Werkzeugen nutzen
summary: APIs aus PHP aufrufen (Streams, cURL, Laravel-HTTP-Client) und mit curl, jq, HTTPie, Postman und Bruno ausprobieren.
duration: 25
sources:
  - title: PHP-Handbuch – HTTP-Kontextoptionen
    url: https://www.php.net/manual/de/context.http.php
  - title: PHP-Handbuch – http_get_last_response_headers
    url: https://www.php.net/manual/de/function.http-get-last-response-headers.php
  - title: PHP-Handbuch – cURL
    url: https://www.php.net/manual/de/book.curl.php
  - title: Laravel-Dokumentation – HTTP Client
    url: https://laravel.com/docs/13.x/http-client
  - title: HTTPie-Dokumentation
    url: https://httpie.io/docs/cli
  - title: Bruno-Dokumentation
    url: https://docs.usebruno.com/
quiz:
  - type: single
    question: "Warum setzt man bei `file_get_contents` mit HTTP-Kontext die Option `'ignore_errors' => true`?"
    options:
      - Damit PHP-Fehler im Log verschwinden.
      - Damit bei 4xx/5xx-Antworten trotzdem der Body gelesen werden kann, statt nur `false` zu bekommen.
      - Damit ungültiges JSON akzeptiert wird.
      - Damit keine Verbindung aufgebaut wird.
    answer: 1
    explanation: Ohne die Option liefert `file_get_contents` bei Fehlerstatus nur `false` und eine Warnung – die Problem Details der API gehen verloren.
  - type: match
    question: Ordne jedem Werkzeug seine Stärke zu.
    pairs:
      - { left: "curl", right: "Überall vorinstalliert, ideal für Skripte" }
      - { left: "jq", right: "JSON-Antworten filtern und umformen" }
      - { left: "HTTPie", right: "Kurze, lesbare Befehle mit farbiger Ausgabe" }
      - { left: "Bruno", right: "Request-Sammlungen als Dateien im Git-Repository" }
      - { left: "Postman", right: "Grafische Oberfläche mit Team-Arbeitsbereichen" }
    explanation: Viele Teams kombinieren sie – curl und jq für Skripte, ein grafisches Werkzeug zum Erkunden.
  - type: cloze
    text: "In HTTPie schickt `year:=2025` den Wert als JSON-Zahl, `year=2025` dagegen als ___."
    blanks:
      - [String, Zeichenkette, Text]
    explanation: "`=` erzeugt Strings, `:=` übernimmt den Wert als rohes JSON (Zahl, true/false, Array)."
  - type: single
    question: "Was macht `->throw()` beim Laravel-HTTP-Client?"
    options:
      - Es wirft den Request weg.
      - Es wirft eine Exception, wenn die Antwort einen 4xx- oder 5xx-Status hat.
      - Es wiederholt den Request.
      - Es setzt einen Timeout.
    answer: 1
    explanation: Wie fetch wirft auch der Laravel-Client bei HTTP-Fehlern nicht von selbst. `throw()` macht Fehlerstatus zu Exceptions.
tasks:
  - id: api-bedienen
    type: terminal
    title: Bediene die Buch-API mit curl und jq
    description: |
      Im Ordner `api-bedienen` liegt die Buch-API `api.php` (Token: `test-token`). Klicke zuerst auf
      **Aufgabe vorbereiten**.

      1. Starte die API: `php -S 127.0.0.1:8080 api.php > server.log 2>&1 &`
      2. Lege das Buch `{"title": "Kaffee und Kernel", "genre": "sachbuch", "year": 2026}` an. Merke dir die
         ID aus der Antwort.
      3. Ups, es erscheint schon 2025: Ändere per `PATCH` **nur** das Jahr des neuen Buchs auf `2025`.
      4. Lösche das Buch mit der ID 1.
      5. Hole alle Bücher mit dem Genre `sachbuch`, **nach Titel sortiert** (`sort=title`), und schreibe mit
         `jq -r` nur die Titel – einen pro Zeile – in `sachbuecher.txt`.
      6. Stoppe den Server mit `kill %1`.
    workdir: api-bedienen
    setup: |
      cat > api.php <<'PHP'
      <?php
      declare(strict_types=1);

      $stateFile = __DIR__ . '/.api-state.json';
      $seed = [
          'next_id' => 7,
          'books' => [
              ['id' => 1, 'title' => 'Die Wolkeninsel', 'author_id' => 1, 'genre' => 'fantasy', 'year' => 2019],
              ['id' => 2, 'title' => 'Code im Morgengrauen', 'author_id' => 2, 'genre' => 'sachbuch', 'year' => 2021],
              ['id' => 3, 'title' => 'Der stille Hafen', 'author_id' => 1, 'genre' => 'krimi', 'year' => 2015],
              ['id' => 4, 'title' => 'Atlas der Funken', 'author_id' => 2, 'genre' => 'fantasy', 'year' => 2023],
              ['id' => 5, 'title' => 'Bits und Bohnen', 'author_id' => 2, 'genre' => 'sachbuch', 'year' => 2018],
              ['id' => 6, 'title' => 'Nebel über Nordheim', 'author_id' => 1, 'genre' => 'krimi', 'year' => 2024],
          ],
          'authors' => [
              ['id' => 1, 'name' => 'Mira Sand'],
              ['id' => 2, 'name' => 'Jonas Feld'],
          ],
          'idempotency' => [],
          'limited' => [],
      ];
      $state = is_file($stateFile) ? json_decode((string) file_get_contents($stateFile), true) : $seed;
      $save = static function () use (&$state, $stateFile): void {
          file_put_contents($stateFile, json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
      };

      $method = $_SERVER['REQUEST_METHOD'];
      $path = rtrim((string) parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
      $path = $path === '' ? '/' : $path;
      parse_str((string) parse_url($_SERVER['REQUEST_URI'], PHP_URL_QUERY), $query);
      $genres = ['fantasy', 'sachbuch', 'krimi'];

      function send(int $status, ?array $body = null, array $headers = []): never
      {
          $reasons = [422 => "Unprocessable Content", 429 => "Too Many Requests"];
          isset($reasons[$status]) ? header("HTTP/1.1 {$status} {$reasons[$status]}") : http_response_code($status);
          foreach ($headers as $name => $value) {
              header("{$name}: {$value}");
          }
          if ($body !== null) {
              if (!isset($headers['Content-Type'])) {
                  header('Content-Type: application/json');
              }
              echo json_encode($body, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), "\n";
          }
          exit;
      }

      function problem(int $status, string $slug, string $title, string $detail, array $extra = [], array $headers = []): never
      {
          send($status, array_merge([
              'type' => "https://api.example.com/probleme/{$slug}",
              'title' => $title,
              'status' => $status,
              'detail' => $detail,
          ], $extra), array_merge(['Content-Type' => 'application/problem+json'], $headers));
      }

      function requireToken(): void
      {
          $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
          if ($auth !== 'Bearer test-token') {
              problem(401, 'nicht-angemeldet', 'Nicht angemeldet', 'Schicke den Header Authorization: Bearer test-token mit.', [], ['WWW-Authenticate' => 'Bearer']);
          }
      }

      function readJson(): array
      {
          $type = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
          if (!str_starts_with(strtolower($type), 'application/json')) {
              problem(415, 'falscher-content-type', 'Falscher Content-Type', 'Der Body muss JSON sein: Content-Type: application/json.');
          }
          $data = json_decode((string) file_get_contents('php://input'), true);
          if (!is_array($data)) {
              problem(400, 'kaputtes-json', 'Ungültiges JSON', 'Der Body konnte nicht als JSON-Objekt gelesen werden.');
          }

          return $data;
      }

      function validateBook(array $input, array $genres, bool $partial): array
      {
          $errors = [];
          if (!$partial || array_key_exists('title', $input)) {
              if (!is_string($input['title'] ?? null) || trim($input['title']) === '') {
                  $errors[] = ['field' => 'title', 'message' => 'Der Titel ist ein Pflichtfeld.'];
              }
          }
          if (!$partial || array_key_exists('genre', $input)) {
              if (!in_array($input['genre'] ?? null, $genres, true)) {
                  $errors[] = ['field' => 'genre', 'message' => 'Das Genre muss fantasy, sachbuch oder krimi sein.'];
              }
          }
          if (!$partial || array_key_exists('year', $input)) {
              $year = $input['year'] ?? null;
              if (!is_int($year) || $year < 1450 || $year > 2100) {
                  $errors[] = ['field' => 'year', 'message' => 'Das Jahr muss eine ganze Zahl zwischen 1450 und 2100 sein.'];
              }
          }
          if ($errors !== []) {
              problem(422, 'validierung', 'Ungültige Eingabe', 'Mindestens ein Feld ist ungültig.', ['errors' => $errors]);
          }

          return $input;
      }

      function findIndex(array $books, int $id): int
      {
          foreach ($books as $index => $book) {
              if ($book['id'] === $id) {
                  return $index;
              }
          }
          problem(404, 'nicht-gefunden', 'Nicht gefunden', "Es gibt kein Buch mit der ID {$id}.");
      }

      if ($path === '/') {
          send(200, ['name' => 'Buch-API', 'version' => '1', 'endpoints' => [
              'GET /books', 'POST /books', 'GET /books/{id}', 'PATCH /books/{id}', 'DELETE /books/{id}',
              'GET /authors/{id}/books', 'GET /limited',
          ]]);
      }

      if ($path === '/books') {
          if ($method === 'GET') {
              $books = $state['books'];
              if (isset($query['genre'])) {
                  $books = array_values(array_filter($books, fn (array $b): bool => $b['genre'] === $query['genre']));
              }
              $sort = (string) ($query['sort'] ?? 'id');
              $desc = str_starts_with($sort, '-');
              $field = ltrim($sort, '-');
              if (!in_array($field, ['id', 'title', 'year'], true)) {
                  problem(400, 'ungueltiger-parameter', 'Ungültiger Parameter', "Nach '{$field}' kann nicht sortiert werden. Erlaubt: id, title, year.");
              }
              usort($books, fn (array $a, array $b): int => $desc ? $b[$field] <=> $a[$field] : $a[$field] <=> $b[$field]);
              $perPage = max(1, min(50, (int) ($query['per_page'] ?? 10)));
              $page = max(1, (int) ($query['page'] ?? 1));
              $total = count($books);
              $pages = max(1, (int) ceil($total / $perPage));
              $link = function (int $p) use ($query, $perPage): string {
                  return '/books?' . http_build_query(array_merge($query, ['page' => $p, 'per_page' => $perPage]));
              };
              send(200, [
                  'data' => array_slice($books, ($page - 1) * $perPage, $perPage),
                  'meta' => ['page' => $page, 'per_page' => $perPage, 'total' => $total, 'total_pages' => $pages],
                  'links' => [
                      'self' => $link($page),
                      'next' => $page < $pages ? $link($page + 1) : null,
                      'prev' => $page > 1 ? $link($page - 1) : null,
                  ],
              ]);
          }
          if ($method === 'POST') {
              requireToken();
              $key = $_SERVER['HTTP_IDEMPOTENCY_KEY'] ?? null;
              if ($key !== null && isset($state['idempotency'][$key])) {
                  $stored = $state['idempotency'][$key];
                  send(201, ['data' => $stored], ['Location' => "/books/{$stored['id']}", 'Idempotent-Replayed' => 'true']);
              }
              $input = validateBook(readJson(), $genres, false);
              $book = [
                  'id' => $state['next_id']++,
                  'title' => trim($input['title']),
                  'author_id' => is_int($input['author_id'] ?? null) ? $input['author_id'] : null,
                  'genre' => $input['genre'],
                  'year' => $input['year'],
              ];
              $state['books'][] = $book;
              if ($key !== null) {
                  $state['idempotency'][$key] = $book;
              }
              $save();
              send(201, ['data' => $book], ['Location' => "/books/{$book['id']}"]);
          }
          problem(405, 'methode-nicht-erlaubt', 'Methode nicht erlaubt', "{$method} ist auf /books nicht erlaubt.", [], ['Allow' => 'GET, POST']);
      }

      if (preg_match('#^/books/(\d+)$#', $path, $m) === 1) {
          $index = findIndex($state['books'], (int) $m[1]);
          if ($method === 'GET') {
              send(200, ['data' => $state['books'][$index]]);
          }
          if ($method === 'PATCH') {
              requireToken();
              $input = validateBook(readJson(), $genres, true);
              foreach (['title', 'genre', 'year'] as $field) {
                  if (array_key_exists($field, $input)) {
                      $state['books'][$index][$field] = $input[$field];
                  }
              }
              $save();
              send(200, ['data' => $state['books'][$index]]);
          }
          if ($method === 'DELETE') {
              requireToken();
              array_splice($state['books'], $index, 1);
              $save();
              send(204);
          }
          problem(405, 'methode-nicht-erlaubt', 'Methode nicht erlaubt', "{$method} ist auf {$path} nicht erlaubt.", [], ['Allow' => 'GET, PATCH, DELETE']);
      }

      if (preg_match('#^/authors/(\d+)/books$#', $path, $m) === 1 && $method === 'GET') {
          $id = (int) $m[1];
          if (!in_array($id, array_column($state['authors'], 'id'), true)) {
              problem(404, 'nicht-gefunden', 'Nicht gefunden', "Es gibt keine Autorin und keinen Autor mit der ID {$id}.");
          }
          send(200, ['data' => array_values(array_filter($state['books'], fn (array $b): bool => $b['author_id'] === $id))]);
      }

      if ($path === '/limited' && $method === 'GET') {
          $now = time();
          $state['limited'] = array_values(array_filter($state['limited'], fn (int $t): bool => $t > $now - 60));
          if (count($state['limited']) >= 3) {
              $retry = max(1, 60 - ($now - min($state['limited'])));
              $save();
              problem(429, 'zu-viele-anfragen', 'Zu viele Anfragen', 'Höchstens 3 Anfragen pro Minute.', [], ['Retry-After' => (string) $retry, 'X-RateLimit-Limit' => '3', 'X-RateLimit-Remaining' => '0']);
          }
          $state['limited'][] = $now;
          $save();
          send(200, ['message' => 'Hallo!'], ['X-RateLimit-Limit' => '3', 'X-RateLimit-Remaining' => (string) (3 - count($state['limited']))]);
      }

      problem(404, 'nicht-gefunden', 'Nicht gefunden', "Den Endpunkt {$method} {$path} gibt es nicht.");
      PHP
    checks:
      - type: command
        run: jq -r '[.books[] | select(.title == "Kaffee und Kernel")] | length' .api-state.json
        stdout_equals: "1"
        message: Das Buch „Kaffee und Kernel“ existiert noch nicht (oder mehrfach). Lege es genau einmal per POST /books an.
      - type: command
        run: jq -r '.books[] | select(.title == "Kaffee und Kernel") | "\(.genre) \(.year)"' .api-state.json
        stdout_equals: sachbuch 2025
        message: 'Das neue Buch soll das Genre sachbuch und das Jahr 2025 haben. Ändere das Jahr per PATCH /books/<id> mit dem Body {"year": 2025}.'
      - type: command
        run: jq -r '[.books[] | select(.id == 1)] | length' .api-state.json
        stdout_equals: "0"
        message: Das Buch mit der ID 1 gibt es noch. Lösche es mit DELETE /books/1 und dem Token.
      - type: command
        run: cat sachbuecher.txt
        stdout_equals: "Bits und Bohnen\nCode im Morgengrauen\nKaffee und Kernel"
        message: In sachbuecher.txt sollen genau die Titel aller Sachbücher stehen, alphabetisch sortiert und einer pro Zeile.
    hints:
      - "Schreibende Requests brauchen `-H 'Authorization: Bearer test-token'`, solche mit Body zusätzlich `-H 'Content-Type: application/json'`."
      - "PATCH: `curl -s -X PATCH http://127.0.0.1:8080/books/7 -H … -d '{\"year\": 2025}'` – die 7 ersetzt du durch deine ID."
      - "Liste: `curl -s \"http://127.0.0.1:8080/books?genre=sachbuch&sort=title\" | jq -r '.data[].title' > sachbuecher.txt`"
    solution: |
      ```bash
      php -S 127.0.0.1:8080 api.php > server.log 2>&1 &
      B=http://127.0.0.1:8080
      AUTH='Authorization: Bearer test-token'
      JSON='Content-Type: application/json'
      curl -s -X POST $B/books -H "$AUTH" -H "$JSON" \
        -d '{"title": "Kaffee und Kernel", "genre": "sachbuch", "year": 2026}'   # liefert id 7
      curl -s -X PATCH $B/books/7 -H "$AUTH" -H "$JSON" -d '{"year": 2025}'
      curl -s -X DELETE $B/books/1 -H "$AUTH"
      curl -s "$B/books?genre=sachbuch&sort=title" | jq -r '.data[].title' > sachbuecher.txt
      kill %1
      ```
  - id: kontext-optionen
    type: code
    language: php
    title: Request-Optionen für PHP-Streams bauen
    description: |
      Schreibe `buildRequestOptions(string $method, string $token, ?array $body = null): array`. Das Ergebnis
      wird später an `stream_context_create()` übergeben und hat diese Form:

      ```php
      ['http' => [
          'method' => 'POST',
          'header' => ['Accept: application/json', 'Authorization: Bearer abc', 'Content-Type: application/json'],
          'content' => '{"title":"Atlas"}',
          'ignore_errors' => true,
          'timeout' => 5,
      ]]
      ```

      - `header` enthält immer `Accept` und `Authorization`. `Content-Type` und `content` gibt es **nur**, wenn
        `$body` nicht `null` ist. `content` ist der mit `json_encode` erzeugte Body.
      - `ignore_errors` ist immer `true`, `timeout` immer `5`.
    starter: |
      <?php
      declare(strict_types=1);

      function buildRequestOptions(string $method, string $token, ?array $body = null): array
      {
          $http = [
              'method' => $method,
          ];

          return ['http' => $http];
      }
    tests:
      - name: GET ohne Body
        code: |
          $o = buildRequestOptions('GET', 'abc')['http'];
          assert_same('GET', $o['method']);
          assert_same(['Accept: application/json', 'Authorization: Bearer abc'], $o['header']);
          assert_true(!array_key_exists('content', $o), 'Ohne Body darf es keinen content-Eintrag geben.');
      - name: POST mit JSON-Body
        code: |
          $o = buildRequestOptions('POST', 'abc', ['title' => 'Atlas', 'year' => 2023])['http'];
          assert_same(['Accept: application/json', 'Authorization: Bearer abc', 'Content-Type: application/json'], $o['header']);
          assert_same('{"title":"Atlas","year":2023}', $o['content']);
      - name: liest Fehlerantworten und setzt einen Timeout
        code: |
          $o = buildRequestOptions('DELETE', 'xyz')['http'];
          assert_same(true, $o['ignore_errors'] ?? null);
          assert_same(5, $o['timeout'] ?? null);
      - name: ein leeres Array ist auch ein Body
        code: |
          $o = buildRequestOptions('PATCH', 'abc', [])['http'];
          assert_same('[]', $o['content'] ?? null);
    hints:
      - "Starte mit `'header' => ['Accept: application/json', \"Authorization: Bearer {$token}\"]`."
      - "Prüfe mit `if ($body !== null)` – nicht mit `if ($body)`, sonst fällt das leere Array durch."
      - "`$http['header'][] = 'Content-Type: application/json';` hängt einen Header an."
    solution: |
      ```php
      <?php
      declare(strict_types=1);

      function buildRequestOptions(string $method, string $token, ?array $body = null): array
      {
          $http = [
              'method' => $method,
              'header' => ['Accept: application/json', "Authorization: Bearer {$token}"],
              'ignore_errors' => true,
              'timeout' => 5,
          ];
          if ($body !== null) {
              $http['header'][] = 'Content-Type: application/json';
              $http['content'] = json_encode($body);
          }

          return ['http' => $http];
      }
      ```
  - id: httpie-ausprobieren
    type: simulated
    title: Dieselben Requests mit HTTPie
    description: |
      HTTPie ist im Übungs-Terminal nicht installiert, deshalb probierst du es hier in einer Simulation aus.
      Die Buch-API liegt unter `api.example.com`.

      1. Lies das Buch mit der ID 2: `http api.example.com/books/2`
      2. Lege ein Buch an: Titel „Neue Spur“, Genre `krimi`, Jahr **als Zahl** 2025, mit dem Header
         `Authorization:"Bearer test-token"`.
    prompt: "du@laptop:~$"
    steps:
      - expect: "^http\\s+(GET\\s+)?(https://)?api\\.example\\.com/books/2/?\\s*$"
        output: |
          HTTP/1.1 200 OK
          Content-Type: application/json

          {
              "data": {
                  "author_id": 2,
                  "genre": "sachbuch",
                  "id": 2,
                  "title": "Code im Morgengrauen",
                  "year": 2021
              }
          }
        hint: "Tippe `http api.example.com/books/2` – GET ist der Standard."
      - expect: "^http\\s+(POST\\s+)?(https://)?api\\.example\\.com/books/?\\s+(?=.*title=)(?=.*genre=krimi)(?=.*year:=2025)(?=.*Authorization:\\s*['\"]?Bearer\\s+test-token).*$"
        output: |
          HTTP/1.1 201 Created
          Content-Type: application/json
          Location: /books/7

          {
              "data": {
                  "author_id": null,
                  "genre": "krimi",
                  "id": 7,
                  "title": "Neue Spur",
                  "year": 2025
              }
          }
        hint: "Zum Beispiel `http POST api.example.com/books title=\"Neue Spur\" genre=krimi year:=2025 Authorization:\"Bearer test-token\"`"
    responses:
      - match: "^http\\s+.*year=2025"
        output: |
          HTTP/1.1 422 Unprocessable Content
          Content-Type: application/problem+json

          {
              "errors": [{"field": "year", "message": "Das Jahr muss eine ganze Zahl zwischen 1450 und 2100 sein."}],
              "status": 422,
              "title": "Ungültige Eingabe"
          }
      - match: "^curl"
        output: "Hier übst du HTTPie – nutze den Befehl http statt curl."
---
Im Browser-Frontend nutzt du `fetch`. Aber auch dein PHP-Backend spricht ständig mit anderen APIs: mit
einem Zahlungsdienst, einem Mail-Versand, einem Wetterdienst. Und bevor du überhaupt Code schreibst,
probierst du eine API meist im Terminal oder in einem grafischen Werkzeug aus. Diese Lektion zeigt dir
beide Seiten.

## PHP: Streams mit file_get_contents

PHP kann HTTP ohne Zusatzpakete. Die Request-Details übergibst du als [[stream-context|Stream-Kontext]]:

```php title="POST mit PHP-Streams"
<?php
$context = stream_context_create(['http' => [
    'method' => 'POST',
    'header' => ['Accept: application/json', 'Authorization: Bearer <dein-token>', 'Content-Type: application/json'],
    'content' => json_encode(['title' => 'Atlas der Funken', 'genre' => 'fantasy', 'year' => 2023]),
    'ignore_errors' => true,
    'timeout' => 5,
]]);

$body = file_get_contents('https://api.example.com/books', false, $context);
$headers = http_get_last_response_headers();   // ['HTTP/1.1 201 Created', 'Location: /books/7', …]
$data = json_decode($body, true);
```

- `ignore_errors` sorgt dafür, dass du auch bei 4xx/5xx den Body bekommst.
- `http_get_last_response_headers()` (seit PHP 8.4) liefert Statuszeile und Header. Die alte Variable
  `$http_response_header` ist seit PHP 8.5 veraltet.

## PHP: die cURL-Erweiterung

Für mehr Kontrolle (Weiterleitungen, Zertifikate, viele parallele Requests) nutzt man die
cURL-Erweiterung – dieselbe Bibliothek, die auch hinter dem Kommando `curl` steckt:

```php title="GET mit cURL"
<?php
$ch = curl_init('https://api.example.com/books/2');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Accept: application/json'],
    CURLOPT_TIMEOUT => 5,
]);
$body = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
```

`curl_close()` brauchst du nicht mehr – es ist seit PHP 8.5 veraltet, weil es keine Wirkung hat.

## Antworten in PHP sauber prüfen

Egal ob Streams oder cURL – drei Prüfungen gehören zu jedem Aufruf:

1. **Hat die Verbindung geklappt?** `file_get_contents` liefert sonst `false`, `curl_exec` ebenfalls;
   `curl_error($ch)` nennt den Grund.
2. **Passt der Statuscode?** Nur 2xx ist Erfolg. Bei 4xx/5xx liest du die Problem Details und wirfst eine
   eigene Exception.
3. **Ist der Body gültiges JSON?** Mit `json_decode($body, true, flags: JSON_THROW_ON_ERROR)` wirft PHP
   bei kaputtem JSON eine `JsonException`, statt still `null` zu liefern.

```php
$data = json_decode($body, true, flags: JSON_THROW_ON_ERROR);
if ($status >= 400) {
    throw new RuntimeException($data['title'] ?? "HTTP {$status}");
}
```

## Laravel: der HTTP-Client

In Laravel schreibst du dasselbe kürzer und lesbarer. Der eingebaute [[http-client|HTTP-Client]] baut
auf Guzzle auf:

```php title="Laravel"
use Illuminate\Support\Facades\Http;

$book = Http::withToken($token)
    ->acceptJson()
    ->timeout(5)
    ->retry(3, 200)
    ->post('https://api.example.com/books', ['title' => 'Atlas der Funken', 'genre' => 'fantasy', 'year' => 2023])
    ->throw()
    ->json('data');
```

Ohne `throw()` kannst du das Ergebnis auch selbst prüfen: `$response->successful()`, `$response->status()`
und `$response->json()` stehen dir zur Verfügung. `post()` schickt das Array automatisch als JSON, `retry(3, 200)` versucht es bis zu dreimal mit 200 ms
Pause, `throw()` macht aus 4xx/5xx eine Exception.

> [!FEHLER]
> Kein Timeout gesetzt. Hängt der fremde Dienst, hängt dein eigener Request mit – bis der Webserver
> aufgibt. Jeder Aufruf einer fremden API bekommt einen Timeout.

## Werkzeuge zum Ausprobieren

Zum Erkunden einer API nutzt du kein eigenes Programm, sondern Werkzeuge: [[curl]] und [[jq]] kennst du
schon, dazu kommen [[httpie|HTTPie]] im Terminal sowie [[postman|Postman]] und [[bruno|Bruno]] mit grafischer
Oberfläche.

| Werkzeug | Art | Typischer Einsatz |
|---|---|---|
| curl | Kommandozeile | Skripte, CI, schnelle Tests – überall vorhanden |
| jq | Kommandozeile | JSON filtern: `jq -r '.data[].title'` |
| HTTPie | Kommandozeile | lesbare Befehle: `http POST api.example.com/books title=X year:=2025` |
| Postman | grafisch | Sammlungen, Umgebungen, Team-Arbeitsbereiche |
| Bruno | grafisch | Sammlungen als Textdateien im Git-Repository |

```bash title="Dasselbe in curl und HTTPie"
curl -s -X POST https://api.example.com/books -H 'Content-Type: application/json' -d '{"title": "X", "year": 2025}'
http POST api.example.com/books title=X year:=2025
```

> [!MERKSATZ]
> Erst ausprobieren, dann programmieren: Ein Request, der in curl oder Bruno funktioniert, ist die beste
> Vorlage für deinen Code.

> [!PRAXIS]
> Viele Teams legen eine Bruno-Sammlung direkt ins Repository. Neue Kolleginnen öffnen sie und können
> jeden Endpunkt sofort ausprobieren – Token und Basis-URL kommen aus einer lokalen, nicht eingecheckten
> Umgebungsdatei.

## Zusammenfassung

- PHP-Streams: `stream_context_create` mit `method`, `header`, `content`, `ignore_errors` und `timeout`.
- Header der Antwort liefert `http_get_last_response_headers()` (PHP 8.4+).
- Die **cURL-Erweiterung** bietet mehr Kontrolle; `curl_close()` ist veraltet.
- Laravel: `Http::withToken()->acceptJson()->timeout()->post()->throw()`.
- **curl** und **jq** für Skripte, **HTTPie** für lesbare Befehle, **Postman** und **Bruno** grafisch.
- Jeder Aufruf einer fremden API braucht einen Timeout.
