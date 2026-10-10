---
title: Unterabfragen und CTEs
summary: Abfragen in Abfragen schachteln – als Wert, als Liste mit IN und EXISTS oder als Zwischentabelle – und komplexe Auswertungen mit WITH in lesbare, benannte Schritte zerlegen.
duration: 20
sources:
  - title: SQLite – The WITH Clause
    url: https://sqlite.org/lang_with.html
  - title: SQLite – SQL Language Expressions (Subqueries, EXISTS, IN)
    url: https://sqlite.org/lang_expr.html
  - title: PostgreSQL – WITH Queries (Common Table Expressions)
    url: https://www.postgresql.org/docs/current/queries-with.html
  - title: PostgreSQL – Subquery Expressions
    url: https://www.postgresql.org/docs/current/functions-subquery.html
quiz:
  - type: single
    question: Was liefert `SELECT name FROM products WHERE price > (SELECT AVG(price) FROM products);`?
    options:
      - Einen Fehler, weil AVG nicht in WHERE stehen darf.
      - Alle Produkte, die teurer sind als der Durchschnitt aller Produkte.
      - Den Durchschnittspreis.
      - Alle Produkte, sortiert nach Preis.
    answer: 1
    explanation: >
      Die Unterabfrage in Klammern läuft zuerst und liefert genau einen Wert – den Durchschnitt. Mit diesem Wert
      vergleicht die äußere Abfrage jede Zeile. Das ist erlaubt, weil das Aggregat in seiner eigenen Abfrage steckt.
  - type: multiple
    question: Welche Abfragen finden Produkte, die noch nie bestellt wurden?
    options:
      - "`SELECT name FROM products p WHERE NOT EXISTS (SELECT 1 FROM order_items i WHERE i.product_id = p.id);`"
      - "`SELECT p.name FROM products p LEFT JOIN order_items i ON i.product_id = p.id WHERE i.product_id IS NULL;`"
      - "`SELECT name FROM products WHERE id NOT IN (SELECT product_id FROM order_items);`"
      - "`SELECT name FROM products WHERE id <> (SELECT product_id FROM order_items);`"
    answers: [0, 1, 2]
    explanation: >
      NOT EXISTS, LEFT JOIN mit IS NULL und NOT IN führen hier zum selben Ergebnis. Die letzte Variante vergleicht
      mit einer Unterabfrage, die viele Zeilen liefert – das ist kein sinnvoller Einzelwert.
  - type: cloze
    text: "Eine CTE beginnt mit dem Schlüsselwort ___, gefolgt von einem Namen und `___ (SELECT …)`. Danach folgt die eigentliche Abfrage."
    blanks:
      - [WITH]
      - [AS]
    explanation: "`WITH bestellwerte AS (SELECT …) SELECT … FROM bestellwerte;` – der Name ist nur innerhalb dieser einen Anweisung gültig."
  - type: single
    question: "`order_items.product_id` enthielte eine Zeile mit NULL. Was liefert dann `WHERE id NOT IN (SELECT product_id FROM order_items)`?"
    options:
      - Die nie bestellten Produkte wie bisher.
      - Keine einzige Zeile.
      - Alle Produkte.
      - Einen Syntaxfehler.
    answer: 1
    explanation: >
      `id NOT IN (…, NULL)` heißt „id ist ungleich jedem Wert“. Der Vergleich mit NULL ist unbekannt, also ist die
      ganze Bedingung nie wahr. NOT EXISTS hat dieses Problem nicht – deshalb ist es die robustere Wahl.
tasks:
  - id: unterabfragen
    type: terminal
    title: Fragen, die eine zweite Frage brauchen
    description: |
      Im Ordner `unterabfragen` liegt `shop.db`. Schreibe jede Abfrage in die angegebene Datei.

      1. `u1.sql`: Name und Preis aller Produkte, die **teurer als der Durchschnittspreis** aller Produkte sind,
         teuerstes zuerst. Nutze eine Unterabfrage.
      2. `u2.sql`: Die Namen aller Produkte, die **noch nie bestellt** wurden, sortiert nach Name.
      3. `u3.sql`: Nutze eine CTE `bestellwerte`, die pro `order_id` den Bestellwert
         `SUM(quantity * unit_price)` berechnet. Gib damit für jeden Kunden den Namen und den Wert seiner
         **größten** nicht stornierten Bestellung aus. Sortiert nach diesem Wert absteigend, bei Gleichstand nach
         Name. Kunden ohne nicht stornierte Bestellung erscheinen nicht.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: unterabfragen
    setup: |
      sqlite3 shop.db <<'SQL'
      PRAGMA foreign_keys = ON;
      CREATE TABLE customers (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        city TEXT,
        created_at TEXT NOT NULL
      );
      CREATE TABLE products (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL CHECK (price >= 0),
        stock INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE orders (
        id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        order_date TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('offen', 'bezahlt', 'versendet', 'storniert'))
      );
      CREATE TABLE order_items (
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_price REAL NOT NULL,
        PRIMARY KEY (order_id, product_id)
      );
      INSERT INTO customers VALUES
        (1, 'Ada Lovelace', 'ada@example.com', 'Berlin', '2026-01-15'),
        (2, 'Grace Hopper', 'grace@example.com', 'Hamburg', '2026-02-03'),
        (3, 'Alan Turing', 'alan@example.com', 'Berlin', '2026-02-20'),
        (4, 'Margaret Hamilton', 'margaret@example.com', 'München', '2026-03-11'),
        (5, 'Katherine Johnson', 'katherine@example.com', NULL, '2026-04-02'),
        (6, 'Tim Berners-Lee', 'tim@example.com', 'Köln', '2026-05-19');
      INSERT INTO products VALUES
        (1, 'Tasse', 'Küche', 8.5, 40),
        (2, 'T-Shirt', 'Kleidung', 19.5, 25),
        (3, 'Hoodie', 'Kleidung', 39.0, 10),
        (4, 'Notizbuch', 'Büro', 6.0, 100),
        (5, 'Kugelschreiber', 'Büro', 1.5, 300),
        (6, 'Rucksack', 'Taschen', 49.5, 0),
        (7, 'Sticker-Set', 'Büro', 3.0, 150);
      INSERT INTO orders VALUES
        (1, 1, '2026-03-01', 'versendet'),
        (2, 2, '2026-03-05', 'versendet'),
        (3, 1, '2026-04-10', 'bezahlt'),
        (4, 3, '2026-04-12', 'storniert'),
        (5, 4, '2026-05-02', 'versendet'),
        (6, 2, '2026-06-18', 'offen'),
        (7, 5, '2026-07-01', 'bezahlt'),
        (8, 1, '2026-08-21', 'offen');
      INSERT INTO order_items VALUES
        (1, 1, 2, 8.5), (1, 4, 3, 6.0),
        (2, 2, 1, 19.5), (2, 3, 1, 39.0),
        (3, 6, 1, 49.5),
        (4, 2, 2, 19.5),
        (5, 4, 5, 6.0), (5, 5, 10, 1.5),
        (6, 3, 1, 39.0), (6, 1, 1, 8.5),
        (7, 2, 3, 19.5),
        (8, 5, 4, 1.5), (8, 1, 1, 8.5);
      SQL
    checks:
      - type: command
        run: |
          test -s u1.sql || exit 1
          ist=$(sqlite3 shop.db < u1.sql 2>&1)
          soll=$(sqlite3 shop.db "SELECT name, price FROM products WHERE price > (SELECT AVG(price) FROM products) ORDER BY price DESC;")
          [ "$ist" = "$soll" ] && echo ok
        stdout_equals: ok
        message: u1.sql stimmt noch nicht. Vergleiche price mit (SELECT AVG(price) FROM products) und sortiere absteigend nach Preis.
      - type: command
        run: |
          test -s u2.sql || exit 1
          ist=$(sqlite3 shop.db < u2.sql 2>&1)
          soll=$(sqlite3 shop.db "SELECT name FROM products p WHERE NOT EXISTS (SELECT 1 FROM order_items i WHERE i.product_id = p.id) ORDER BY name;")
          [ "$ist" = "$soll" ] && echo ok
        stdout_equals: ok
        message: u2.sql stimmt noch nicht. Gesucht sind Produkte, zu denen es keine Zeile in order_items gibt – etwa mit NOT EXISTS.
      - type: file_contains
        path: u3.sql
        pattern: "(WITH|with|With)\\s+bestellwerte"
        message: u3.sql soll mit einer CTE beginnen – WITH bestellwerte AS (…).
      - type: command
        run: |
          ist=$(sqlite3 shop.db < u3.sql 2>&1)
          soll=$(sqlite3 shop.db "WITH bestellwerte AS (SELECT order_id, SUM(quantity * unit_price) AS total FROM order_items GROUP BY order_id) SELECT c.name, MAX(b.total) AS groesste FROM customers c JOIN orders o ON o.customer_id = c.id JOIN bestellwerte b ON b.order_id = o.id WHERE o.status <> 'storniert' GROUP BY c.id, c.name ORDER BY groesste DESC, c.name;")
          [ "$ist" = "$soll" ] && echo ok
        stdout_equals: ok
        message: u3.sql liefert noch nicht das erwartete Ergebnis. Verknüpfe customers, orders und die CTE, filtere stornierte Bestellungen, nimm MAX(total) pro Kunde und sortiere nach diesem Wert absteigend, dann nach Name.
    hints:
      - "u1: Die Unterabfrage `(SELECT AVG(price) FROM products)` liefert einen einzigen Wert, mit dem du in WHERE vergleichen kannst."
      - "u2: `WHERE NOT EXISTS (SELECT 1 FROM order_items i WHERE i.product_id = p.id)` – die innere Abfrage bezieht sich auf die äußere Zeile `p`."
      - "u3: `WITH bestellwerte AS (SELECT order_id, SUM(quantity * unit_price) AS total FROM order_items GROUP BY order_id) SELECT c.name, MAX(b.total) … FROM customers c JOIN orders o ON … JOIN bestellwerte b ON b.order_id = o.id …`"
    solution: |
      ```bash
      cd unterabfragen
      cat > u1.sql <<'SQL'
      SELECT name, price
      FROM products
      WHERE price > (SELECT AVG(price) FROM products)
      ORDER BY price DESC;
      SQL
      cat > u2.sql <<'SQL'
      SELECT name
      FROM products p
      WHERE NOT EXISTS (SELECT 1 FROM order_items i WHERE i.product_id = p.id)
      ORDER BY name;
      SQL
      cat > u3.sql <<'SQL'
      WITH bestellwerte AS (
        SELECT order_id, SUM(quantity * unit_price) AS total
        FROM order_items
        GROUP BY order_id
      )
      SELECT c.name, MAX(b.total) AS groesste
      FROM customers c
      JOIN orders o ON o.customer_id = c.id
      JOIN bestellwerte b ON b.order_id = o.id
      WHERE o.status <> 'storniert'
      GROUP BY c.id, c.name
      ORDER BY groesste DESC, c.name;
      SQL
      ```
  - id: cte-aufbauen
    type: order
    title: Baue die CTE-Abfrage zusammen
    description: >
      Die Abfrage soll alle Kunden zeigen, deren Bestellungen zusammen mehr als 80 Euro ergeben. Bringe die Zeilen
      in die richtige Reihenfolge.
    items:
      - "WITH kundenumsatz AS ("
      - "  SELECT o.customer_id, SUM(i.quantity * i.unit_price) AS umsatz"
      - "  FROM orders o JOIN order_items i ON i.order_id = o.id"
      - "  GROUP BY o.customer_id"
      - ")"
      - "SELECT c.name, k.umsatz FROM kundenumsatz k"
      - "JOIN customers c ON c.id = k.customer_id"
      - "WHERE k.umsatz > 80;"
---

„Welche Produkte sind teurer als der Durchschnitt?“ Um das zu beantworten, brauchst du zuerst eine andere
Antwort: den Durchschnitt. SQL erlaubt dir, eine Abfrage in eine andere zu setzen – als
[[unterabfrage|Unterabfrage]]. Werden die Schachteln zu tief, hilft eine [[cte|CTE]] mit `WITH`.

## Unterabfragen als Wert und als Liste

Eine Unterabfrage steht in Klammern und läuft logisch vor der äußeren Abfrage. Liefert sie **genau einen
Wert**, kannst du damit vergleichen:

```sql title="Unterabfrage als einzelner Wert"
SELECT name, price
FROM products
WHERE price > (SELECT AVG(price) FROM products)
ORDER BY price DESC;
```

Liefert sie eine **Liste**, prüfst du mit `IN`, ob ein Wert darin vorkommt:

```sql title="Unterabfrage als Liste"
SELECT name
FROM customers
WHERE id IN (SELECT customer_id FROM orders WHERE status = 'offen');
```

Das liest sich fast wie ein Satz: „Kunden, deren id unter den Kunden offener Bestellungen ist“.

## EXISTS: gibt es mindestens eine?

`EXISTS (…)` ist wahr, sobald die Unterabfrage mindestens eine Zeile liefert. Die innere Abfrage darf sich
dabei auf die aktuelle Zeile der äußeren beziehen – man nennt sie dann korreliert.

```sql title="Produkte, die nie bestellt wurden"
SELECT name
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM order_items i WHERE i.product_id = p.id
);
```

`SELECT 1` ist Absicht: Bei EXISTS zählt nur, **ob** es Zeilen gibt, nicht was darin steht.

> [!FEHLER]
> **`NOT IN` mit NULL-Werten in der Liste.** Enthält die Unterabfrage auch nur ein NULL, ist
> `x NOT IN (…)` nie wahr, und du bekommst null Zeilen. `NOT EXISTS` kennt dieses Problem nicht und ist die
> sichere Wahl für „gibt es keine“-Fragen.

## Unterabfragen als Zwischentabelle

Eine Unterabfrage darf auch im `FROM` stehen. Ihr Ergebnis verhält sich dann wie eine Tabelle und braucht
einen Alias:

```sql title="Durchschnittlicher Bestellwert"
SELECT ROUND(AVG(total), 2) AS schnitt
FROM (
  SELECT order_id, SUM(quantity * unit_price) AS total
  FROM order_items
  GROUP BY order_id
) AS bestellwerte;
```

Das ist nötig, wenn du ein Aggregat über ein Aggregat bildest – hier den Durchschnitt über Summen. Ab zwei
solcher Ebenen wird es allerdings schnell unübersichtlich.

## CTEs: benannte Zwischenschritte mit WITH

Eine CTE (Common Table Expression) zieht die Zwischentabelle nach vorn und gibt ihr einen Namen. Dieselbe
Auswertung liest sich dann von oben nach unten:

```sql title="Dieselbe Auswertung mit WITH"
WITH bestellwerte AS (
  SELECT order_id, SUM(quantity * unit_price) AS total
  FROM order_items
  GROUP BY order_id
),
grosse AS (
  SELECT order_id FROM bestellwerte WHERE total >= 50
)
SELECT o.id, c.name
FROM grosse g
JOIN orders o ON o.id = g.order_id
JOIN customers c ON c.id = o.customer_id;
```

- Mehrere CTEs trennst du mit Kommas; spätere dürfen frühere verwenden.
- Der Name gilt nur innerhalb dieser einen Anweisung.
- Mit `WITH RECURSIVE` lassen sich sogar Baumstrukturen durchlaufen – siehe [[rekursive-cte|rekursive CTE]].

> [!MERKSATZ]
> Eine CTE macht eine Abfrage nicht schneller, sondern lesbarer. Jeder Schritt hat einen Namen, den du
> einzeln testen kannst.

## Wann nimmst du was?

| Frage | Werkzeug |
|---|---|
| Spalten aus mehreren Tabellen nebeneinander | JOIN |
| Vergleich mit einem berechneten Einzelwert | Unterabfrage als Wert |
| „Gibt es (k)einen passenden Eintrag?“ | `EXISTS` / `NOT EXISTS` |
| mehrstufige Auswertung, Aggregat über Aggregat | CTE mit `WITH` |

> [!PRAXIS]
> Lange Berichts-Abfragen im Team werden fast immer als Kette von CTEs geschrieben. Beim Fehlersuchen
> führst du die CTEs einzeln aus und schaust dir jedes Zwischenergebnis an – wie bei einer Pipeline im
> Terminal.

## Zusammenfassung

- Eine Unterabfrage in Klammern liefert einen Wert, eine Liste oder eine Zwischentabelle.
- `IN (SELECT …)` prüft Listen, `EXISTS` prüft, ob es überhaupt passende Zeilen gibt.
- `NOT IN` scheitert an NULL-Werten – nimm für „gibt es keine“ lieber `NOT EXISTS`.
- Unterabfragen im `FROM` brauchen einen Alias und erlauben Aggregate über Aggregate.
- `WITH name AS (…)` benennt Zwischenschritte; mehrere CTEs werden mit Kommas verkettet.
- CTEs machen Abfragen lesbar und Schritt für Schritt testbar.
