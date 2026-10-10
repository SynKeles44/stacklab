---
title: Tabellen verknüpfen mit JOIN
summary: Mit INNER JOIN passende Zeilen aus mehreren Tabellen zusammenführen, mit LEFT JOIN auch Zeilen ohne Partner behalten und RIGHT sowie FULL OUTER JOIN einordnen.
duration: 25
sources:
  - title: SQLite – SELECT (Join Processing)
    url: https://sqlite.org/lang_select.html#from_clause
  - title: PostgreSQL – Joins Between Tables (Tutorial)
    url: https://www.postgresql.org/docs/current/tutorial-join.html
  - title: PostgreSQL – Table Expressions (Joined Tables)
    url: https://www.postgresql.org/docs/current/queries-table-expressions.html
  - title: MySQL 8.4 – JOIN Clause
    url: https://dev.mysql.com/doc/refman/8.4/en/join.html
quiz:
  - type: single
    question: Tim hat noch nie bestellt. Welche Abfrage zeigt ihn trotzdem in einer Liste „Kunde und Anzahl Bestellungen“?
    options:
      - "`… FROM customers c JOIN orders o ON o.customer_id = c.id …`"
      - "`… FROM customers c LEFT JOIN orders o ON o.customer_id = c.id …`"
      - "`… FROM orders o LEFT JOIN customers c ON o.customer_id = c.id …`"
      - "`… FROM customers c, orders o …`"
    answer: 1
    explanation: >
      LEFT JOIN behält alle Zeilen der linken Tabelle – hier customers – und füllt die Spalten von orders mit NULL,
      wenn es keinen Partner gibt. Die dritte Variante behält alle Bestellungen, nicht alle Kunden.
  - type: find-bug
    question: Die Abfrage soll pro Kunde die Anzahl der Bestellungen zeigen, Tim mit 0. Sie zeigt Tim aber mit 1. Welche Zeile ist schuld?
    language: sql
    code: |
      SELECT c.name, COUNT(*) AS anzahl
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      GROUP BY c.id, c.name
      ORDER BY c.name;
    bug_line: 1
    explanation: >
      `COUNT(*)` zählt Zeilen – und Tims Zeile existiert dank LEFT JOIN, nur mit NULL in den orders-Spalten.
      `COUNT(o.id)` zählt nur Zeilen mit echter Bestellung und liefert für Tim 0.
  - type: cloze
    text: "Die Bedingung, die festlegt, welche Zeilen zusammenpassen, steht nach dem Schlüsselwort ___. Ohne sie verbindet die Datenbank jede Zeile mit jeder – das ___ Produkt."
    blanks:
      - [ON]
      - [kartesische, kartesisches]
    explanation: Bei 6 Kunden und 8 Bestellungen ergäbe das 48 Kombinationen, von denen nur 8 sinnvoll sind.
  - type: multiple
    question: Welche Aussagen über JOINs stimmen?
    options:
      - "`JOIN` ohne Zusatz bedeutet `INNER JOIN`."
      - "Ein `RIGHT JOIN` lässt sich als `LEFT JOIN` mit vertauschten Tabellen schreiben."
      - "MySQL unterstützt `FULL OUTER JOIN` direkt."
      - "Man kann beliebig viele Tabellen hintereinander verknüpfen."
    answers: [0, 1, 3]
    explanation: >
      MySQL kennt keinen FULL OUTER JOIN; dort kombiniert man LEFT JOIN und RIGHT JOIN mit UNION. PostgreSQL und
      SQLite (seit Version 3.39) unterstützen ihn.
tasks:
  - id: joins-schreiben
    type: terminal
    title: Bestellungen mit Namen statt Nummern
    description: |
      Im Ordner `joins` liegt `shop.db`. Schreibe jede Abfrage in die angegebene Datei. Spaltenreihenfolge und
      Sortierung müssen genau stimmen.

      1. `j1.sql`: Für jede Bestellung die Bestellnummer (`orders.id`), den Namen des Kunden und das
         Bestelldatum, sortiert nach Bestellnummer.
      2. `j2.sql`: **Alle** Kunden mit der Anzahl ihrer Bestellungen – auch Kunden ohne Bestellung (Anzahl 0).
         Spalten: Name, Anzahl. Sortiert nach Name.
      3. `j3.sql`: Umsatz pro Produkt über alle **nicht stornierten** Bestellungen. Spalten: Produktname,
         Umsatz `SUM(quantity * unit_price)`. Nur Produkte, die verkauft wurden. Sortiert nach Umsatz
         absteigend, bei Gleichstand nach Produktname.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: joins
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
          test -s j1.sql || exit 1
          ist=$(sqlite3 shop.db < j1.sql 2>&1)
          soll=$(sqlite3 shop.db "SELECT o.id, c.name, o.order_date FROM orders o JOIN customers c ON c.id = o.customer_id ORDER BY o.id;")
          [ "$ist" = "$soll" ] && echo ok
        stdout_equals: ok
        message: j1.sql stimmt noch nicht. Verknüpfe orders und customers mit ON c.id = o.customer_id und gib o.id, c.name, o.order_date sortiert nach o.id aus.
      - type: command
        run: |
          test -s j2.sql || exit 1
          ist=$(sqlite3 shop.db < j2.sql 2>&1)
          soll=$(sqlite3 shop.db "SELECT c.name, COUNT(o.id) FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id, c.name ORDER BY c.name;")
          [ "$ist" = "$soll" ] && echo ok
        stdout_equals: ok
        message: j2.sql stimmt noch nicht. Du brauchst einen LEFT JOIN von customers auf orders und COUNT(o.id) statt COUNT(*), damit Kunden ohne Bestellung 0 bekommen.
      - type: command
        run: |
          test -s j3.sql || exit 1
          ist=$(sqlite3 shop.db < j3.sql 2>&1)
          soll=$(sqlite3 shop.db "SELECT p.name, SUM(i.quantity * i.unit_price) AS umsatz FROM order_items i JOIN orders o ON o.id = i.order_id JOIN products p ON p.id = i.product_id WHERE o.status <> 'storniert' GROUP BY p.id, p.name ORDER BY umsatz DESC, p.name;")
          [ "$ist" = "$soll" ] && echo ok
        stdout_equals: ok
        message: j3.sql stimmt noch nicht. Verknüpfe order_items mit orders (für den Status) und products (für den Namen), filtere stornierte Bestellungen, gruppiere pro Produkt und sortiere nach Umsatz absteigend, dann nach Name.
    hints:
      - "Gerüst: `SELECT … FROM orders o JOIN customers c ON c.id = o.customer_id …;` – die Kürzel o und c sparen Tipparbeit."
      - "Für j2 steht customers links: `FROM customers c LEFT JOIN orders o ON …` und gezählt wird `COUNT(o.id)`."
      - "j3 verknüpft drei Tabellen: `FROM order_items i JOIN orders o ON o.id = i.order_id JOIN products p ON p.id = i.product_id`."
    solution: |
      ```bash
      cd joins
      cat > j1.sql <<'SQL'
      SELECT o.id, c.name, o.order_date
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      ORDER BY o.id;
      SQL
      cat > j2.sql <<'SQL'
      SELECT c.name, COUNT(o.id) AS anzahl
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      GROUP BY c.id, c.name
      ORDER BY c.name;
      SQL
      cat > j3.sql <<'SQL'
      SELECT p.name, SUM(i.quantity * i.unit_price) AS umsatz
      FROM order_items i
      JOIN orders o ON o.id = i.order_id
      JOIN products p ON p.id = i.product_id
      WHERE o.status <> 'storniert'
      GROUP BY p.id, p.name
      ORDER BY umsatz DESC, p.name;
      SQL
      ```
  - id: join-ergebnisse
    type: dragdrop
    title: Welcher JOIN liefert dieses Ergebnis?
    description: |
      Gegeben sind `customers` (links) und `orders` (rechts), verknüpft mit `ON o.customer_id = c.id`. Tim hat
      keine Bestellung. Stell dir außerdem eine Bestellung vor, deren Kunde gelöscht wurde. Ordne jedes
      Ergebnis dem JOIN zu, der es liefert.
    targets:
      - { id: inner, label: INNER JOIN }
      - { id: left, label: LEFT JOIN }
      - { id: right, label: RIGHT JOIN }
      - { id: full, label: FULL OUTER JOIN }
    items:
      - { label: "Nur Kunden mit mindestens einer Bestellung", target: inner }
      - { label: "Alle Kunden, Tim mit NULL in den Bestellspalten", target: left }
      - { label: "Alle Bestellungen, die verwaiste mit NULL beim Kundennamen", target: right }
      - { label: "Tim und die verwaiste Bestellung, jeweils mit NULL auf der anderen Seite", target: full }
---

In `orders` steht bei Bestellung 4 nur `customer_id = 3`. Wer ist das? Weil die Daten normalisiert sind,
steht der Name in einer anderen Tabelle. Ein [[join|JOIN]] führt beide Tabellen in einer Abfrage zusammen –
das ist die wichtigste Fähigkeit relationaler Datenbanken.

## Die Idee: Zeilen über Schlüssel zusammenführen

Stell dir zwei Stapel Karteikarten vor: Kunden und Bestellungen. Für jede Bestellung suchst du die
Kundenkarte mit derselben Nummer und heftest beide zusammen. Genau das macht ein JOIN.

```sql title="Bestellungen mit Kundennamen"
SELECT o.id, c.name, o.order_date
FROM orders o
JOIN customers c ON c.id = o.customer_id
ORDER BY o.id;
```

- `orders o` gibt der Tabelle den kurzen Alias `o`, damit du `o.id` statt `orders.id` schreibst.
- `ON c.id = o.customer_id` ist die Verknüpfungsbedingung: Fremdschlüssel trifft Primärschlüssel.
- `o.id` und `c.id` heißen beide `id` – mit dem Präfix ist klar, welche gemeint ist.

Ohne `ON` würde die Datenbank jede Kundenzeile mit jeder Bestellung kombinieren, das
[[kartesisches-produkt|kartesische Produkt]]. 6 Kunden mal 8 Bestellungen ergäben 48 meist unsinnige Paare.

## INNER JOIN: nur passende Paare

`JOIN` allein bedeutet [[inner-join|INNER JOIN]]: Im Ergebnis landen nur Paare, bei denen die Bedingung
erfüllt ist. Hat ein Kunde keine Bestellung, taucht er nicht auf.

```text title="Ergebnis (Auszug)"
1|Ada Lovelace|2026-03-01
2|Grace Hopper|2026-03-05
3|Ada Lovelace|2026-04-10
4|Alan Turing|2026-04-12
```

Danach kannst du wie gewohnt filtern, gruppieren und sortieren:

```sql title="Umsatz pro Kunde"
SELECT c.name, SUM(i.quantity * i.unit_price) AS umsatz
FROM customers c
JOIN orders o ON o.customer_id = c.id
JOIN order_items i ON i.order_id = o.id
WHERE o.status <> 'storniert'
GROUP BY c.id, c.name
ORDER BY umsatz DESC;
```

So verkettest du beliebig viele Tabellen: Jeder weitere `JOIN` bringt eine Tabelle mit ihrer eigenen
`ON`-Bedingung dazu.

## LEFT JOIN: auch ohne Partner

Manchmal brauchst du **alle** Zeilen der linken Tabelle – auch ohne Partner. Ein [[left-join|LEFT JOIN]]
behält sie und füllt die Spalten der rechten Tabelle mit NULL.

```sql title="Alle Kunden mit Anzahl Bestellungen"
SELECT c.name, COUNT(o.id) AS anzahl
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name
ORDER BY c.name;
```

Tim Berners-Lee erscheint mit `0`. Mit `WHERE o.id IS NULL` findest du gezielt alle Kunden **ohne**
Bestellung – ein häufiges Muster für „Wer fehlt?“-Fragen.

> [!FEHLER]
> **`COUNT(*)` nach einem LEFT JOIN.** Die Zeile für Tim existiert ja, nur mit NULL-Werten. `COUNT(*)` zählt
> sie als 1. Zähle eine Spalte der rechten Tabelle, etwa `COUNT(o.id)`.

> [!FEHLER]
> **Den LEFT JOIN mit WHERE wieder aushebeln.** `WHERE o.status = 'offen'` wirft alle Zeilen mit NULL weg –
> der LEFT JOIN wirkt dann wie ein INNER JOIN. Gehört die Bedingung zur rechten Tabelle, schreibe sie in das
> `ON`: `LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'offen'`.

## RIGHT und FULL OUTER JOIN

![Vier JOIN-Arten als Mengendiagramme](/assets/datenbanken-sql/join-arten.svg)

| JOIN | behält |
|---|---|
| `INNER JOIN` | nur passende Paare |
| `LEFT JOIN` | alle Zeilen links, rechts notfalls NULL |
| `RIGHT JOIN` | alle Zeilen rechts, links notfalls NULL |
| [[full-outer-join|FULL OUTER JOIN]] | alle Zeilen beider Seiten |

Ein `RIGHT JOIN` ist ein gespiegelter `LEFT JOIN`. Die meisten Teams schreiben nur `LEFT JOIN` und stellen
die Tabellen passend um – das liest sich einheitlicher. `FULL OUTER JOIN` brauchst du selten, etwa beim
Abgleich zweier Listen. SQLite unterstützt `RIGHT` und `FULL` seit Version 3.39, MySQL kennt keinen
`FULL OUTER JOIN`.

> [!MERKSATZ]
> Frag dich bei jedem JOIN: Darf eine Zeile ohne Partner verschwinden? Ja → `JOIN`. Nein → `LEFT JOIN` mit
> der Tabelle, deren Zeilen bleiben müssen, auf der linken Seite.

> [!PRAXIS]
> Verschwinden in einem Bericht plötzlich Datensätze, ist sehr oft ein INNER JOIN schuld, wo ein LEFT JOIN
> hingehört hätte. Zähle zur Kontrolle die Zeilen vor und nach dem JOIN.

## Zusammenfassung

- Ein JOIN führt Zeilen mehrerer Tabellen über eine `ON`-Bedingung zusammen, meist Fremdschlüssel = Primärschlüssel.
- Tabellen-Aliase (`orders o`) machen Abfragen kürzer und eindeutig.
- `JOIN` = `INNER JOIN`: nur passende Paare.
- `LEFT JOIN` behält alle Zeilen der linken Tabelle; fehlende Partner werden NULL.
- Nach LEFT JOIN zählst du mit `COUNT(rechte.spalte)`; Bedingungen der rechten Tabelle gehören ins `ON`.
- `RIGHT JOIN` ist ein gespiegelter LEFT JOIN, `FULL OUTER JOIN` behält beide Seiten.
