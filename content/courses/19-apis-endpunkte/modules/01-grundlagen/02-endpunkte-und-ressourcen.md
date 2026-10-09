---
title: Endpunkte und Ressourcen
summary: Was ein Endpunkt genau ist, wie Ressourcen in URLs abgebildet werden und wie du eine API mit curl erkundest.
duration: 25
sources:
  - title: MDN – Identifying resources on the Web (URLs)
    url: https://developer.mozilla.org/en-US/docs/Web/URI
  - title: RFC 9110 – HTTP Semantics, Abschnitt 3.1 Resources
    url: https://www.rfc-editor.org/rfc/rfc9110#section-3.1
  - title: curl-Handbuch
    url: https://curl.se/docs/manpage.html
  - title: PHP-Handbuch – Der eingebaute Webserver
    url: https://www.php.net/manual/de/features.commandline.webserver.php
quiz:
  - type: single
    question: Woraus besteht ein Endpunkt einer Web-API?
    options:
      - Nur aus dem Hostnamen, z. B. api.example.com
      - Aus HTTP-Methode und Pfad, z. B. GET /books/{id}
      - Aus dem Namen der Datenbanktabelle
      - Aus dem JSON, das zurückkommt
    answer: 1
    explanation: >
      `GET /books/{id}` und `DELETE /books/{id}` haben denselben Pfad, sind aber zwei verschiedene Endpunkte,
      weil sie Verschiedenes tun. Erst Methode plus Pfad ergeben einen Endpunkt.
  - type: match
    question: Ordne jedem Teil der URL `https://api.example.com/books/2?fields=title` seinen Namen zu.
    pairs:
      - { left: "https", right: "Schema" }
      - { left: "api.example.com", right: "Host" }
      - { left: "/books/2", right: "Pfad" }
      - { left: "fields=title", right: "Query-String" }
    explanation: Der Pfad adressiert die Ressource, der Query-String verfeinert die Anfrage (Felder, Filter, Seiten).
  - type: cloze
    text: "In `/authors/{id}/books` ist `{id}` ein ___ – ein Platzhalter, der beim Aufruf durch einen echten Wert ersetzt wird."
    blanks:
      - [Pfadparameter, Path-Parameter, Pfad-Parameter, Parameter]
    explanation: "Pfadparameter identifizieren eine bestimmte Ressource, z. B. `/authors/1/books`."
  - type: multiple
    question: Welche Aussagen über Ressourcen stimmen?
    options:
      - Eine Ressource ist ein „Ding“, über das die API spricht, z. B. ein Buch oder eine Bestellung.
      - Eine Ressource muss genau einer Datenbanktabelle entsprechen.
      - Die Sammlung `/books` und das Element `/books/2` sind zwei Ressourcen.
      - Ressourcen werden durch URLs identifiziert.
    answers: [0, 2, 3]
    explanation: >
      Ressourcen sind fachliche Dinge mit eigener URL. Wie sie gespeichert werden, ist egal – eine Ressource
      kann aus mehreren Tabellen stammen oder berechnet sein.
tasks:
  - id: buch-api-erkunden
    type: terminal
    title: Erkunde die Buch-API mit curl
    description: |
      Im Ordner `api-erkunden` liegt `api.php` – eine kleine Buch-API zum Üben. Klicke zuerst auf
      **Aufgabe vorbereiten**.

      1. Starte die API im Hintergrund: `php -S 127.0.0.1:8080 api.php > server.log 2>&1 &`
      2. Rufe `GET /` auf und lies die Liste der Endpunkte: `curl -s http://127.0.0.1:8080/`
      3. Speichere die Antwort von `GET /books/2` in der Datei `buch-2.json`.
      4. Speichere die Antwort von `GET /authors/1/books` in der Datei `autorin-1.json`.
      5. Finde den Statuscode von `GET /books/99` heraus und schreibe nur die Zahl in `status.txt`.
      6. Stoppe den Server am Ende mit `kill %1`.
    workdir: api-erkunden
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
        run: jq -r '.data.title' buch-2.json
        stdout_equals: Code im Morgengrauen
        message: buch-2.json enthält noch nicht die Antwort von GET /books/2. Leite die Ausgabe von curl mit > in die Datei um.
      - type: command
        run: jq -r '.data | length' autorin-1.json
        stdout_equals: "3"
        message: autorin-1.json enthält noch nicht die drei Bücher von GET /authors/1/books.
      - type: file_contains
        path: status.txt
        pattern: "^\\s*404\\s*$"
        message: In status.txt soll nur der Statuscode von GET /books/99 stehen. Tipp – curl -s -o /dev/null -w '%{http_code}' URL
    hints:
      - "Mit `curl -s URL > datei.json` landet die Antwort in einer Datei. `cat datei.json` zeigt sie dir."
      - "`-w '%{http_code}'` gibt nach dem Request den Statuscode aus, `-o /dev/null` wirft den Body weg."
      - "Meldet `php -S` „Address already in use“, läuft noch ein alter Server. Beende ihn mit `pkill -f 'php -S'`."
    solution: |
      ```bash
      php -S 127.0.0.1:8080 api.php > server.log 2>&1 &
      curl -s http://127.0.0.1:8080/
      curl -s http://127.0.0.1:8080/books/2 > buch-2.json
      curl -s http://127.0.0.1:8080/authors/1/books > autorin-1.json
      curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/books/99 > status.txt
      kill %1
      ```
  - id: url-teile
    type: dragdrop
    title: Was gehört wohin?
    description: Ordne die Bestandteile von Endpunkten den richtigen Kategorien zu.
    targets:
      - { id: methode, label: HTTP-Methode }
      - { id: sammlung, label: Pfad einer Sammlung }
      - { id: element, label: Pfad eines einzelnen Elements }
      - { id: query, label: Query-Parameter }
    items:
      - { label: "DELETE", target: methode }
      - { label: "PATCH", target: methode }
      - { label: "/orders", target: sammlung }
      - { label: "/authors/7/books", target: sammlung }
      - { label: "/orders/815", target: element }
      - { label: "/users/42", target: element }
      - { label: "?status=open", target: query }
      - { label: "?page=3", target: query }
    hints:
      - "Endet der Pfad mit einer ID, meint er ein einzelnes Element. Auch eine verschachtelte Liste wie `/authors/7/books` ist eine Sammlung."
---
Du hast einen Brief, aber nur „Berlin“ auf den Umschlag geschrieben. Er kommt nie an. Auch ein Request an
eine API braucht eine genaue Adresse – und eine klare Angabe, was dort passieren soll. Genau das ist ein
**Endpunkt**.

## Ressourcen: die Dinge, über die eine API spricht

Eine [[ressource|Ressource]] ist ein fachliches „Ding“, das eine API anbietet: ein Buch, eine Bestellung,
ein Benutzerkonto. Jede Ressource hat eine eigene Adresse, ihre [[url|URL]].

| URL | Ressource |
|---|---|
| `https://api.example.com/books` | die Sammlung aller Bücher |
| `https://api.example.com/books/2` | das Buch mit der ID 2 |
| `https://api.example.com/authors/1/books` | die Bücher der Person mit der ID 1 |

Wichtig: Eine Ressource ist **nicht** dasselbe wie eine Datenbanktabelle. Sie kann aus mehreren Tabellen
zusammengesetzt oder berechnet sein. Die API zeigt das, was für Clients sinnvoll ist.

## Endpunkt = Methode + Pfad

Ein [[endpunkt|Endpunkt]] ist eine konkrete Stelle der API, die eine bestimmte Aufgabe erledigt. Er
besteht aus der [[http-methode|HTTP-Methode]] und dem Pfad:

```text title="Fünf Endpunkte, zwei Pfade"
GET    /books        alle Bücher auflisten
POST   /books        neues Buch anlegen
GET    /books/{id}   ein Buch lesen
PATCH  /books/{id}   ein Buch ändern
DELETE /books/{id}   ein Buch löschen
```

`{id}` ist ein [[pfadparameter|Pfadparameter]]: ein Platzhalter, der beim Aufruf ersetzt wird, z. B.
`/books/2`. Alles nach dem `?` ist der [[query-string|Query-String]] – er verfeinert die Anfrage, etwa
`/books?genre=krimi`.

> [!MERKSATZ]
> Der **Pfad** sagt, *welche* Ressource gemeint ist. Die **Methode** sagt, *was* mit ihr passieren soll.

## Eine API zum Anfassen

Im Übungs-Terminal startest du gleich eine kleine Buch-API. Dafür nutzt du den eingebauten Webserver von
PHP, den [[php-entwicklungsserver|PHP-Entwicklungsserver]]. Mit einer Router-Datei (`api.php`) beantwortet
er jeden Request:

```bash title="Terminal"
php -S 127.0.0.1:8080 api.php > server.log 2>&1 &
```

- `127.0.0.1` ist [[localhost]] – der Server ist nur auf deinem Rechner erreichbar.
- `8080` ist der [[port|Port]].
- `&` startet den Server im Hintergrund, damit dein Terminal frei bleibt. `kill %1` beendet ihn wieder.

Eine solche Übungs-API, die echte Antworten nur nachspielt, heißt [[mock-api|Mock-API]].

## Requests mit curl schicken

[[curl]] schickt Requests direkt aus dem Terminal. Die wichtigsten Optionen:

| Option | Wirkung |
|---|---|
| `-s` | still: keine Fortschrittsanzeige |
| `-i` | Statuszeile und Header mit ausgeben |
| `-o datei` | Body in eine Datei schreiben |
| `-w '%{http_code}'` | nach dem Request den Statuscode ausgeben |

```bash title="Terminal"
curl -s http://127.0.0.1:8080/books/2
curl -si http://127.0.0.1:8080/books/99
curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/books/99
```

Der zweite Befehl zeigt dir `HTTP/1.1 404 Not Found` und eine Fehlerbeschreibung im JSON-Format.

> [!FEHLER]
> `curl http://127.0.0.1:8080/books/2` meldet „Connection refused“? Dann läuft der Server nicht. Starte
> ihn neu und prüfe mit `jobs`, ob er im Hintergrund aktiv ist.

## Antworten lesen und filtern

JSON-Antworten können lang werden. [[jq]] liest JSON und zeigt dir nur das, was du brauchst:

```bash title="Terminal"
curl -s http://127.0.0.1:8080/books/2 | jq '.data.title'
curl -s http://127.0.0.1:8080/books | jq '.data | length'
curl -s http://127.0.0.1:8080/authors/1/books | jq -r '.data[].title'
```

`.data.title` greift auf ein Feld zu, `length` zählt Einträge, `.data[]` geht durch eine Liste, `-r`
gibt Text ohne Anführungszeichen aus.

> [!PRAXIS]
> Bevor du Code gegen eine fremde API schreibst, probierst du ihre Endpunkte mit `curl` aus. So siehst du
> echte Antworten und Fehler, bevor dein Programm daran scheitert.

## Zusammenfassung

- Eine **Ressource** ist ein fachliches Ding mit eigener URL – nicht zwingend eine Datenbanktabelle.
- Ein **Endpunkt** ist Methode plus Pfad, z. B. `GET /books/{id}`.
- **Pfadparameter** wie `{id}` identifizieren ein Element, der **Query-String** verfeinert die Anfrage.
- `php -S 127.0.0.1:8080 api.php &` startet eine API lokal im Hintergrund.
- Mit `curl` schickst du Requests, mit `jq` filterst du die JSON-Antworten.
