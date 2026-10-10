---
title: N+1-Abfragen und Indizes
summary: Wie aus einer harmlosen Schleife hunderte Datenbankabfragen werden, wie du sie zu einer zusammenfasst und wie du mit EXPLAIN prüfst, ob ein Index genutzt wird.
duration: 25
sources:
  - title: Laravel – Eloquent Relationships, Eager Loading
    url: https://laravel.com/docs/13.x/eloquent-relationships#eager-loading
  - title: Laravel – Preventing Lazy Loading
    url: https://laravel.com/docs/13.x/eloquent-relationships#preventing-lazy-loading
  - title: SQLite – EXPLAIN QUERY PLAN
    url: https://sqlite.org/eqp.html
  - title: SQLite – CREATE INDEX
    url: https://sqlite.org/lang_createindex.html
quiz:
  - type: single
    question: Eine Seite zeigt 50 Blogartikel mit dem Namen der Autorin. Der Code lädt die Artikel und fragt in der Schleife pro Artikel die Autorin ab. Wie viele Abfragen sind das?
    options: ["1", "2", "50", "51"]
    answer: 3
    explanation: Eine Abfrage für die Artikel plus 50 für die Autorinnen – das N+1-Problem. Mit Eager Loading sind es zwei.
  - type: find-bug
    question: In welcher Zeile entsteht das N+1-Problem?
    language: php
    code: |
      $customers = Customer::query()->limit(100)->get();

      foreach ($customers as $customer) {
          $total = $customer->orders->sum('amount');
          echo "{$customer->name}: {$total}\n";
      }
    bug_line: 4
    explanation: >
      `$customer->orders` lädt die Bestellungen erst beim Zugriff nach – für jeden Kunden mit einer eigenen Abfrage.
      Abhilfe: `Customer::query()->with('orders')->limit(100)->get()` oder direkt `withSum('orders', 'amount')`.
  - type: multiple
    question: Welche Aussagen über Indizes stimmen?
    options:
      - Ein Index auf `orders.customer_id` beschleunigt `WHERE customer_id = ?`.
      - Jeder Index macht INSERT und UPDATE etwas langsamer.
      - Mehr Indizes machen jede Abfrage schneller.
      - "`EXPLAIN QUERY PLAN` zeigt bei SQLite, ob ein Index genutzt wird."
    answers: [0, 1, 3]
    explanation: Ein Index muss bei jeder Änderung mitgepflegt werden und kostet Speicher. Lege ihn gezielt für Spalten an, nach denen du suchst, verknüpfst oder sortierst.
  - type: cloze
    text: "Steht im Ausführungsplan `___ orders`, liest SQLite die ganze Tabelle. Mit Index steht dort `SEARCH orders USING ___ idx_orders_customer_id`."
    blanks:
      - [SCAN]
      - [INDEX]
    explanation: SCAN ist ein vollständiger Durchlauf, SEARCH … USING INDEX ein gezielter Zugriff über den Index.
tasks:
  - id: index-mit-explain
    type: terminal
    title: Einen fehlenden Index finden und anlegen
    description: |
      `shop.db` ist eine SQLite-Datenbank mit 2 000 Kund:innen und 200 000 Bestellungen. Die Abfrage
      `SELECT * FROM orders WHERE customer_id = 42;` ist langsam. Finde heraus, warum, und behebe es.

      Klicke zuerst auf **Aufgabe vorbereiten** (das Anlegen der Datenbank dauert einige Sekunden). Dann:

      1. Öffne die Datenbank mit `sqlite3 shop.db`, schalte mit `.timer on` die Zeitmessung ein und führe die Abfrage aus.
      2. Lass dir mit `EXPLAIN QUERY PLAN` den Ausführungsplan zeigen. Was steht dort?
      3. Lege einen Index namens `idx_orders_customer_id` auf `orders(customer_id)` an.
      4. Führe die Abfrage erneut mit Zeitmessung aus und vergleiche.
      5. Speichere den neuen Ausführungsplan in `plan.txt`:
         `sqlite3 shop.db "EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 42;" > plan.txt`
    workdir: index-mit-explain
    setup: |
      sqlite3 shop.db <<'SQL'
      CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
      CREATE TABLE orders (
        id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        amount INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );
      WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 2000)
      INSERT INTO customers (id, name) SELECT i, 'Kunde ' || i FROM n;
      WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 200000)
      INSERT INTO orders (customer_id, amount, created_at)
      SELECT (i * 7919) % 2000 + 1, (i * 37) % 9000 + 100, date('2026-01-01', '+' || (i % 270) || ' days') FROM n;
      SQL
    checks:
      - type: command
        run: sqlite3 shop.db "SELECT name FROM pragma_index_list('orders')" | grep -x idx_orders_customer_id
        message: Es gibt noch keinen Index namens idx_orders_customer_id auf der Tabelle orders.
      - type: command
        run: sqlite3 shop.db "SELECT name FROM pragma_index_info('idx_orders_customer_id')" | head -n 1
        stdout_equals: customer_id
        message: Der Index idx_orders_customer_id soll auf der Spalte customer_id liegen (als erste Spalte).
      - type: command
        run: sqlite3 shop.db "EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 42;"
        stdout_matches: "USING (COVERING )?INDEX idx_orders_customer_id"
        message: SQLite nutzt den Index für die Abfrage noch nicht.
      - type: file_contains
        path: plan.txt
        pattern: "SEARCH orders USING (COVERING )?INDEX"
        message: In plan.txt steht noch nicht der neue Ausführungsplan mit SEARCH … USING INDEX.
      - type: command
        run: sqlite3 shop.db "SELECT count(*) FROM orders"
        stdout_equals: "200000"
        message: Die Tabelle orders soll weiterhin 200000 Bestellungen enthalten.
    hints:
      - "Vor dem Index zeigt der Plan `SCAN orders` – SQLite liest alle 200 000 Zeilen."
      - "`CREATE INDEX idx_orders_customer_id ON orders(customer_id);`"
      - "Innerhalb von `sqlite3` beendest du die Sitzung mit `.quit`."
    solution: |
      ```bash
      sqlite3 shop.db
      ```

      ```sql
      .timer on
      SELECT * FROM orders WHERE customer_id = 42;
      EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 42;
      -- `--SCAN orders`
      CREATE INDEX idx_orders_customer_id ON orders(customer_id);
      SELECT * FROM orders WHERE customer_id = 42;
      .quit
      ```

      ```bash
      sqlite3 shop.db "EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 42;" > plan.txt
      cat plan.txt
      ```
  - id: n-plus-1-beheben
    type: code
    language: php
    title: Das N+1-Problem beheben
    description: |
      `FakeDb` simuliert eine Datenbank und zählt in `$queries` jede Abfrage. Die Funktion `totalsByCustomer()` soll für
      eine Liste von Kunden-IDs die Summe ihrer Bestellbeträge liefern, z. B. `[1 => 250, 2 => 0]` – aber sie stellt pro
      Kunde eine eigene Abfrage.

      Schreibe sie so um, dass sie **genau eine** Abfrage über `ordersForCustomers()` stellt. Jede übergebene ID kommt im
      Ergebnis vor (ohne Bestellungen mit `0`), die Reihenfolge entspricht der Eingabe. Bei einer leeren Liste gibt die
      Funktion `[]` zurück, **ohne** die Datenbank zu fragen.
    starter: |
      <?php

      declare(strict_types=1);

      final class FakeDb
      {
          public int $queries = 0;

          /** @param list<array{customer_id: int, amount: int}> $orders */
          public function __construct(private readonly array $orders) {}

          /** @return list<array{customer_id: int, amount: int}> */
          public function ordersForCustomer(int $customerId): array
          {
              $this->queries++;
              return array_values(array_filter($this->orders, fn (array $o): bool => $o['customer_id'] === $customerId));
          }

          /**
           * @param list<int> $customerIds
           * @return list<array{customer_id: int, amount: int}>
           */
          public function ordersForCustomers(array $customerIds): array
          {
              $this->queries++;
              return array_values(array_filter($this->orders, fn (array $o): bool => in_array($o['customer_id'], $customerIds, true)));
          }
      }

      /**
       * @param list<int> $customerIds
       * @return array<int, int>
       */
      function totalsByCustomer(FakeDb $db, array $customerIds): array
      {
          $totals = [];
          foreach ($customerIds as $id) {
              $totals[$id] = array_sum(array_column($db->ordersForCustomer($id), 'amount'));
          }
          return $totals;
      }
    tests:
      - name: richtige Summen
        code: |
          $db = new FakeDb([
              ['customer_id' => 1, 'amount' => 100],
              ['customer_id' => 2, 'amount' => 40],
              ['customer_id' => 1, 'amount' => 150],
              ['customer_id' => 3, 'amount' => 5],
          ]);
          assert_same([1 => 250, 2 => 40, 3 => 5], totalsByCustomer($db, [1, 2, 3]));
      - name: genau eine Abfrage
        code: |
          $db = new FakeDb([['customer_id' => 1, 'amount' => 10], ['customer_id' => 2, 'amount' => 20]]);
          totalsByCustomer($db, [1, 2, 3, 4, 5, 6, 7, 8]);
          assert_same(1, $db->queries);
      - name: Kunde ohne Bestellungen bekommt 0
        code: |
          $db = new FakeDb([['customer_id' => 1, 'amount' => 10]]);
          assert_same([7 => 0, 1 => 10], totalsByCustomer($db, [7, 1]));
      - name: leere Liste ohne Abfrage
        code: |
          $db = new FakeDb([['customer_id' => 1, 'amount' => 10]]);
          assert_same([], totalsByCustomer($db, []));
          assert_same(0, $db->queries);
    hints:
      - "Lege zuerst alle Summen mit 0 an: `$totals = array_fill_keys($customerIds, 0);`"
      - Hole danach alle Bestellungen mit einem einzigen Aufruf von `ordersForCustomers($customerIds)`.
      - "Addiere in einer Schleife: `$totals[$order['customer_id']] += $order['amount'];`"
    solution: |
      <?php

      declare(strict_types=1);

      final class FakeDb
      {
          public int $queries = 0;

          public function __construct(private readonly array $orders) {}

          public function ordersForCustomer(int $customerId): array
          {
              $this->queries++;
              return array_values(array_filter($this->orders, fn (array $o): bool => $o['customer_id'] === $customerId));
          }

          public function ordersForCustomers(array $customerIds): array
          {
              $this->queries++;
              return array_values(array_filter($this->orders, fn (array $o): bool => in_array($o['customer_id'], $customerIds, true)));
          }
      }

      function totalsByCustomer(FakeDb $db, array $customerIds): array
      {
          if ($customerIds === []) {
              return [];
          }

          $totals = array_fill_keys($customerIds, 0);
          foreach ($db->ordersForCustomers($customerIds) as $order) {
              $totals[$order['customer_id']] += $order['amount'];
          }

          return $totals;
      }
---
Die Produktliste deines Shops lädt lokal in 40 ms. In Produktion mit echten Daten dauert sie zwei Sekunden. Der
Code sieht harmlos aus – eine kleine Schleife. Im Log der Datenbank stehen aber 301 Abfragen für einen einzigen
Seitenaufruf. Willkommen beim häufigsten Performance-Problem in Web-Backends.

## Das N+1-Problem

Das [[n-plus-1-problem|N+1-Problem]] entsteht, wenn du erst eine Liste lädst (1 Abfrage) und dann **pro Eintrag**
weitere Daten nachlädst (N Abfragen):

```php title="Sieht harmlos aus"
$customers = $pdo->query('SELECT id, name FROM customers LIMIT 100')->fetchAll();

foreach ($customers as $customer) {
    $stmt = $pdo->prepare('SELECT SUM(amount) FROM orders WHERE customer_id = ?');
    $stmt->execute([$customer['id']]);
    echo $customer['name'], ': ', $stmt->fetchColumn(), "\n";
}
```

Jede einzelne Abfrage ist schnell. Aber jede ist eine Rundreise zur Datenbank – mit Netzwerk, Parsen und Planen.
101 Rundreisen à 2 ms sind schon 200 ms, bevor überhaupt etwas Sinnvolles passiert.

![N+1 mit 101 Abfragen im Vergleich zu Eager Loading mit 2 Abfragen](/assets/performance/n-plus-1.svg)

> [!MERKSATZ]
> Eine Datenbankabfrage in einer Schleife ist fast immer ein N+1-Problem. Hole zusammengehörige Daten in einer einzigen Abfrage.

## N+1 beheben

Es gibt zwei typische Lösungen:

**1. Eine Abfrage mit `IN` und Zuordnung im Code** – das, was ein ORM beim [[eager-loading|Eager Loading]] macht:

```sql
SELECT customer_id, amount FROM orders WHERE customer_id IN (1, 2, 3, …, 100);
```

**2. Die Datenbank rechnen lassen** – mit [[join|JOIN]] und `GROUP BY` in einer Abfrage:

```sql
SELECT c.id, c.name, COALESCE(SUM(o.amount), 0) AS total
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name
LIMIT 100;
```

## N+1 in Laravel

Mit einem ORM wie Eloquent in [[laravel|Laravel]] ist das Problem noch besser versteckt, weil Beziehungen beim ersten
Zugriff automatisch nachgeladen werden:

```php title="N+1 – und die Lösung"
// 101 Abfragen: $customer->orders lädt in jeder Runde nach
foreach (Customer::limit(100)->get() as $customer) {
    echo $customer->orders->sum('amount');
}

// 2 Abfragen: Bestellungen vorab für alle laden
foreach (Customer::with('orders')->limit(100)->get() as $customer) {
    echo $customer->orders->sum('amount');
}

// 1 Abfrage: die Summe direkt von der Datenbank
Customer::withSum('orders', 'amount')->limit(100)->get();
```

> [!PRAXIS]
> Viele Laravel-Teams rufen in der Entwicklung `Model::preventLazyLoading()` auf. Dann wirft jedes versehentliche
> Nachladen eine Exception, und N+1-Probleme fallen auf, bevor sie in Produktion gehen.

## N+1 aufspüren

N+1-Probleme fallen lokal selten auf, weil die Testdatenbank klein ist. Darum zählst du Abfragen, statt Zeiten zu schätzen:

- **Abfrage-Log:** Viele Datenbanken und Frameworks können jede Abfrage protokollieren. 300 fast gleiche Zeilen mit
  wechselnder ID sind das typische Bild.
- **Entwicklerwerkzeuge:** In Laravel zeigen Werkzeuge wie Telescope oder eine Debug-Leiste die Zahl der Abfragen pro Anfrage.
- **Ein Test:** Du kannst die Zahl der Abfragen in einem Test festschreiben – dann bricht er, sobald jemand ein N+1 einbaut.

```php title="Abfragen in Laravel zählen"
DB::enableQueryLog();
$this->get('/customers')->assertOk();
$this->assertLessThanOrEqual(3, count(DB::getQueryLog()));
```

## Indizes kurz wiederholt

Auch eine einzelne Abfrage kann langsam sein: Ohne [[datenbank-index|Index]] muss die Datenbank für
`WHERE customer_id = 42` jede Zeile lesen. Wie Indizes als [[b-baum|B-Baum]] funktionieren, hast du im Kurs
[Datenbanken & SQL](/kurse/datenbanken-sql/indizes-und-explain) gelernt. Hier zählt die Praxis: Mit
[[explain|`EXPLAIN QUERY PLAN`]] siehst du, was SQLite vorhat.

```text title="Ohne und mit Index"
sqlite> EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 42;
`--SCAN orders

sqlite> CREATE INDEX idx_orders_customer_id ON orders(customer_id);
sqlite> EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 42;
`--SEARCH orders USING INDEX idx_orders_customer_id (customer_id=?)
```

`SCAN` liest alles, `SEARCH … USING INDEX` springt gezielt zu den passenden Zeilen. Eine eingebaute Zeitmessung
schaltest du in `sqlite3` mit `.timer on` ein; PostgreSQL zeigt mit `EXPLAIN ANALYZE` echte Laufzeiten.

> [!FEHLER]
> „Wir legen einfach auf jede Spalte einen Index.“ – Jeder Index kostet Speicher und verlangsamt `INSERT`, `UPDATE`
> und `DELETE`. Lege Indizes für Spalten an, die du in `WHERE`, `JOIN` und `ORDER BY` wirklich nutzt – vor allem Fremdschlüssel.

## Zusammenfassung

- Das **N+1-Problem** entsteht durch Abfragen in einer Schleife – jede Rundreise kostet Zeit.
- Lösungen: eine Abfrage mit `IN` und Zuordnung im Code (**Eager Loading**) oder `JOIN` mit `GROUP BY`.
- In Laravel helfen `with()`, `withSum()` und `Model::preventLazyLoading()`.
- Ohne Index liest die Datenbank die ganze Tabelle (`SCAN`), mit Index sucht sie gezielt (`SEARCH … USING INDEX`).
- Prüfe mit **`EXPLAIN QUERY PLAN`** und miss vorher und nachher.
