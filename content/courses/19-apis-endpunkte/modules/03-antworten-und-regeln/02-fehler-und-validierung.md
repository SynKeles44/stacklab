---
title: Fehler und Validierung
summary: Fehlerantworten nach RFC 9457 (Problem Details), Validierungsfehler pro Feld und was eine Fehlermeldung nie verraten darf.
duration: 25
sources:
  - title: RFC 9457 – Problem Details for HTTP APIs
    url: https://www.rfc-editor.org/rfc/rfc9457
  - title: Laravel-Dokumentation – Validation (Validation Error Response Format)
    url: https://laravel.com/docs/13.x/validation
  - title: jq-Handbuch
    url: https://jqlang.org/manual/
quiz:
  - type: match
    question: Ordne jedem Feld einer Problem-Details-Antwort seine Bedeutung zu.
    pairs:
      - { left: "type", right: "URI, die die Fehlerart eindeutig benennt" }
      - { left: "title", right: "Kurze, gleichbleibende Überschrift der Fehlerart" }
      - { left: "status", right: "Der HTTP-Statuscode als Zahl" }
      - { left: "detail", right: "Erklärung für genau diesen Fall" }
      - { left: "instance", right: "URI dieses konkreten Vorkommens" }
    explanation: Alle fünf Felder sind optional, aber `type`, `title`, `status` und `detail` solltest du immer füllen.
  - type: cloze
    text: "Fehlerantworten nach RFC 9457 tragen den Medientyp `application/___`."
    blanks:
      - [problem+json]
    explanation: Am Content-Type erkennt ein Client sofort, dass er eine Fehlerbeschreibung im Standardformat vor sich hat.
  - type: single
    question: Was darf eine Fehlerantwort an einen Client auf keinen Fall enthalten?
    options:
      - Den Statuscode
      - Den Namen des ungültigen Felds
      - Einen Stack-Trace mit Dateipfaden und SQL-Abfrage
      - Einen Link zur Dokumentation der Fehlerart
    answer: 2
    explanation: Interne Details helfen Angreifern. Sie gehören ins Server-Log – der Client bekommt eine verständliche, sichere Beschreibung.
  - type: multiple
    question: Welche Aussagen über Validierungsfehler stimmen?
    options:
      - Die API meldet alle ungültigen Felder auf einmal, nicht nur das erste.
      - Jeder Fehler nennt das betroffene Feld, damit das Formular es markieren kann.
      - Validierungsfehler sind 5xx-Fehler, weil der Server die Daten nicht speichern kann.
      - Validiert wird auf dem Server, auch wenn das Frontend schon prüft.
    answers: [0, 1, 3]
    explanation: >
      Ungültige Eingaben sind Client-Fehler (meist 422). Das Frontend prüft für die Bequemlichkeit, der
      Server für die Sicherheit – Requests lassen sich am Frontend vorbei schicken.
tasks:
  - id: validierung-bauen
    type: code
    language: php
    title: Validiere ein Buch und antworte mit Problem Details
    description: |
      Schreibe `validationProblem(array $input): ?array`. Sind alle Felder gültig, gib `null` zurück.
      Sonst gib ein Problem-Details-Array zurück:

      ```php
      [
          'type' => 'https://api.example.com/probleme/validierung',
          'title' => 'Ungültige Eingabe',
          'status' => 422,
          'detail' => 'Mindestens ein Feld ist ungültig.',
          'errors' => [ ['field' => 'title', 'message' => '…'], … ],
      ]
      ```

      Regeln – prüfe **alle** Felder in dieser Reihenfolge und sammle jeden Fehler:

      | Feld | Regel | Meldung |
      |---|---|---|
      | `title` | String, nach `trim` nicht leer, höchstens 120 Zeichen | `Der Titel ist ein Pflichtfeld (max. 120 Zeichen).` |
      | `genre` | genau `fantasy`, `sachbuch` oder `krimi` | `Unbekanntes Genre.` |
      | `year` | ganze Zahl (`int`) von 1450 bis 2100 | `Das Jahr muss zwischen 1450 und 2100 liegen.` |
    starter: |
      <?php
      declare(strict_types=1);

      function validationProblem(array $input): ?array
      {
          $errors = [];

          // Regeln prüfen und Fehler sammeln:
          // $errors[] = ['field' => 'title', 'message' => '...'];

          if ($errors === []) {
              return null;
          }

          return [];
      }
    tests:
      - name: gültige Eingabe ergibt null
        code: assert_same(null, validationProblem(['title' => 'Atlas der Funken', 'genre' => 'fantasy', 'year' => 2023]))
      - name: leere Eingabe meldet alle drei Felder in der richtigen Reihenfolge
        code: |
          $p = validationProblem([]);
          assert_same(422, $p['status'] ?? null);
          assert_same('Ungültige Eingabe', $p['title'] ?? null);
          assert_same('https://api.example.com/probleme/validierung', $p['type'] ?? null);
          assert_same(['title', 'genre', 'year'], array_column($p['errors'] ?? [], 'field'));
      - name: ein Jahr als String ist ungültig
        code: |
          $p = validationProblem(['title' => 'X', 'genre' => 'krimi', 'year' => '2020']);
          assert_same([['field' => 'year', 'message' => 'Das Jahr muss zwischen 1450 und 2100 liegen.']], $p['errors'] ?? null);
      - name: prüft Grenzen und Leerzeichen
        code: |
          assert_same(null, validationProblem(['title' => str_repeat('a', 120), 'genre' => 'sachbuch', 'year' => 1450]));
          $p = validationProblem(['title' => str_repeat('a', 121), 'genre' => 'Krimi', 'year' => 2101]);
          assert_same(['title', 'genre', 'year'], array_column($p['errors'] ?? [], 'field'));
          assert_same('title', validationProblem(['title' => '   ', 'genre' => 'krimi', 'year' => 2000])['errors'][0]['field'] ?? null);
    hints:
      - "Titel: `is_string($t) && trim($t) !== '' && mb_strlen($t) <= 120` mit `$t = $input['title'] ?? null`."
      - "Genre: `in_array($input['genre'] ?? null, ['fantasy', 'sachbuch', 'krimi'], true)` – das `true` macht den Vergleich strikt."
      - "Jahr: `is_int($y) && $y >= 1450 && $y <= 2100`."
    solution: |
      ```php
      <?php
      declare(strict_types=1);

      function validationProblem(array $input): ?array
      {
          $errors = [];

          $title = $input['title'] ?? null;
          if (!is_string($title) || trim($title) === '' || mb_strlen($title) > 120) {
              $errors[] = ['field' => 'title', 'message' => 'Der Titel ist ein Pflichtfeld (max. 120 Zeichen).'];
          }
          if (!in_array($input['genre'] ?? null, ['fantasy', 'sachbuch', 'krimi'], true)) {
              $errors[] = ['field' => 'genre', 'message' => 'Unbekanntes Genre.'];
          }
          $year = $input['year'] ?? null;
          if (!is_int($year) || $year < 1450 || $year > 2100) {
              $errors[] = ['field' => 'year', 'message' => 'Das Jahr muss zwischen 1450 und 2100 liegen.'];
          }

          if ($errors === []) {
              return null;
          }

          return [
              'type' => 'https://api.example.com/probleme/validierung',
              'title' => 'Ungültige Eingabe',
              'status' => 422,
              'detail' => 'Mindestens ein Feld ist ungültig.',
              'errors' => $errors,
          ];
      }
      ```
  - id: fehler-auslesen
    type: terminal
    title: Lies eine Fehlerantwort mit curl und jq
    description: |
      Im Ordner `fehler-lesen` liegt die Buch-API `api.php`. Klicke zuerst auf **Aufgabe vorbereiten**.

      1. Starte die API: `php -S 127.0.0.1:8080 api.php > server.log 2>&1 &`
      2. Schicke `POST /books` mit dem Header `Authorization: Bearer test-token`, dem Header
         `Content-Type: application/json` und dem Body `{"title": "Testbuch"}`.
         Speichere dabei die **Header** der Antwort in `kopf.txt` (`-D kopf.txt`) und den **Body** in
         `fehler.json` (`-o fehler.json`).
      3. Schreibe mit `jq` die Namen aller ungültigen Felder – einen pro Zeile – in `felder.txt`.
      4. Stoppe den Server mit `kill %1`.
    workdir: fehler-lesen
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
      - type: file_contains
        path: kopf.txt
        pattern: "^[Cc]ontent-[Tt]ype:\\s*application/problem\\+json"
        message: kopf.txt enthält noch nicht die Antwort-Header mit Content-Type application/problem+json. Nutze curl -D kopf.txt.
      - type: command
        run: jq -r '.status' fehler.json
        stdout_equals: "422"
        message: fehler.json enthält noch keine 422-Fehlerantwort. Hast du Token, Content-Type und Body mitgeschickt?
      - type: command
        run: cat felder.txt
        stdout_equals: "genre\nyear"
        message: In felder.txt sollen genau die Feldnamen genre und year stehen, je einer pro Zeile – nimm jq -r '.errors[].field'.
    hints:
      - "Header schickst du mit `-H 'Name: Wert'`, den Body mit `-d '{\"title\": \"Testbuch\"}'`. Mit `-d` wird automatisch POST verwendet."
      - "`-D kopf.txt -o fehler.json` schreibt Header und Body in getrennte Dateien."
      - "`jq -r '.errors[].field' fehler.json > felder.txt`"
    solution: |
      ```bash
      php -S 127.0.0.1:8080 api.php > server.log 2>&1 &
      curl -s -X POST http://127.0.0.1:8080/books \
        -H 'Authorization: Bearer test-token' \
        -H 'Content-Type: application/json' \
        -d '{"title": "Testbuch"}' \
        -D kopf.txt -o fehler.json
      cat fehler.json
      jq -r '.errors[].field' fehler.json > felder.txt
      kill %1
      ```
---
Du füllst ein Formular aus, klickst auf „Speichern“ – und bekommst „Es ist ein Fehler aufgetreten“. Welches
Feld? Was ist falsch? Eine API, die Fehler schlecht beschreibt, führt genau zu solchen Formularen. Gute
Fehlerantworten sind deshalb genauso sorgfältig gestaltet wie Erfolgsantworten – und folgen am besten
einem Standard.

## Der Standard: Problem Details (RFC 9457)

[[rfc|RFC]] 9457 beschreibt ein einheitliches Format für Fehlerantworten von HTTP-APIs, die
[[problem-details|Problem Details]]. Es hat einen eigenen Medientyp im [[content-type|Content-Type]]:
`application/problem+json`.

![Aufbau einer Problem-Details-Antwort mit type, title, status, detail und errors](/assets/apis-endpunkte/problem-details.svg)

| Feld | Inhalt |
|---|---|
| `type` | URI der Fehlerart, z. B. `https://api.example.com/probleme/validierung` |
| `title` | kurze Überschrift, gleich für alle Fehler dieser Art |
| `status` | der Statuscode als Zahl |
| `detail` | Erklärung für genau diesen Fall |
| `instance` | optional: URI dieses einen Vorkommens |

Eigene Zusatzfelder sind ausdrücklich erlaubt, etwa `errors` für Validierungsfehler.

> [!MERKSATZ]
> Clients entscheiden anhand von **`type`** (maschinenlesbar), Menschen lesen **`title`** und **`detail`**.

## Validierungsfehler pro Feld

[[validierung|Validierung]] prüft Eingaben, bevor der Server sie verarbeitet. Schlägt sie fehl,
antwortet die API mit `422` und nennt **jedes** ungültige Feld – nicht nur das erste:

```http title="Antwort auf POST /books mit nur einem Titel"
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json

{
  "type": "https://api.example.com/probleme/validierung",
  "title": "Ungültige Eingabe",
  "status": 422,
  "detail": "Mindestens ein Feld ist ungültig.",
  "errors": [
    {"field": "genre", "message": "Das Genre muss fantasy, sachbuch oder krimi sein."},
    {"field": "year", "message": "Das Jahr muss eine ganze Zahl zwischen 1450 und 2100 sein."}
  ]
}
```

Das Frontend kann so jedes Feld direkt markieren. Für verschachtelte Felder nutzt man Pfade wie
`address.zip` oder `items.2.quantity`.

## Wann welcher Fehler?

| Situation | Status | `type` (Beispiel) |
|---|---|---|
| JSON nicht lesbar | 400 | `…/kaputtes-json` |
| Token fehlt | 401 | `…/nicht-angemeldet` |
| Feld ungültig | 422 | `…/validierung` |
| Ressource fehlt | 404 | `…/nicht-gefunden` |
| Unerwarteter Fehler | 500 | `about:blank` |

`about:blank` ist der Standardwert von `type`, wenn es keine genauere Fehlerart gibt. Dann soll `title`
dem Text des Statuscodes entsprechen, z. B. „Internal Server Error“.

> [!FEHLER]
> Fehler im Body verstecken und `200` senden – oder jede Fehlerart in einem anderen Format melden. Ein
> Client sollte **eine** Funktion haben, die alle Fehler deiner API versteht.

## Sicher bleiben

Fehlerantworten verlassen deinen Server. Sie dürfen **nie** enthalten:

- [[stack-trace|Stack-Traces]], Dateipfade oder Zeilennummern,
- SQL-Abfragen oder Datenbank-Fehlermeldungen,
- Hinweise wie „Passwort falsch“ statt „Anmeldedaten falsch“ (verrät, dass das Konto existiert).

Diese Details schreibst du ins Server-Log und gibst dem Client höchstens eine Fehler-ID mit, unter der
das Team den Eintrag findet:

```json title="Sichere 500-Antwort"
{"type": "about:blank", "title": "Internal Server Error", "status": 500,
 "detail": "Ein unerwarteter Fehler ist aufgetreten.", "instance": "/fehler/7c1e2f90"}
```

Meldet sich jemand beim Support, nennt er die ID aus `instance` – und das Team findet den vollständigen
Stack-Trace im Log, ohne dass er je den Server verlassen hat.

> [!PRAXIS]
> Laravel antwortet bei fehlgeschlagener Validierung automatisch mit `422` und dem Format
> `{"message": "…", "errors": {"title": ["…"]}}`. Viele Teams passen den zentralen Exception-Handler an,
> damit alle Fehler einheitlich als Problem Details herauskommen.

## Zusammenfassung

- **RFC 9457** definiert Problem Details: `type`, `title`, `status`, `detail`, `instance`.
- Medientyp `application/problem+json`; eigene Felder wie `errors` sind erlaubt.
- Validierung meldet **alle** ungültigen Felder mit Feldname und Meldung, Status `422`.
- Ein Format für **alle** Fehler – dann braucht der Client nur eine Fehlerbehandlung.
- Nie Stack-Traces, SQL oder interne Details an den Client; die gehören ins Log.
