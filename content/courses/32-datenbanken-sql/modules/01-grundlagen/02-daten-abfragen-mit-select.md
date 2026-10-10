---
title: Daten abfragen mit SELECT
summary: Mit SELECT Spalten auswählen, mit WHERE Zeilen filtern, mit ORDER BY sortieren und mit LIMIT begrenzen – inklusive LIKE, IN, BETWEEN und dem Sonderfall NULL.
duration: 25
sources:
  - title: SQLite – SELECT
    url: https://sqlite.org/lang_select.html
  - title: SQLite – SQL Language Expressions (LIKE, IN, BETWEEN, IS NULL)
    url: https://sqlite.org/lang_expr.html
  - title: PostgreSQL – Querying a Table
    url: https://www.postgresql.org/docs/current/tutorial-select.html
  - title: PostgreSQL – Comparison Functions and Operators
    url: https://www.postgresql.org/docs/current/functions-comparison.html
quiz:
  - type: single
    question: Welche Bedingung findet alle Kunden, bei denen keine Stadt eingetragen ist?
    options:
      - "`WHERE city = NULL`"
      - "`WHERE city IS NULL`"
      - "`WHERE city = ''`"
      - "`WHERE NOT city`"
    answer: 1
    explanation: >
      NULL bedeutet „unbekannt“. Jeder Vergleich mit `=` gegen NULL ergibt wieder unbekannt, also nie wahr.
      Deshalb gibt es den eigenen Operator `IS NULL` bzw. `IS NOT NULL`.
  - type: cloze
    text: "Alle Produkte, deren Name mit „T“ beginnt: `WHERE name ___ 'T%'`. Die teuersten zuerst: `ORDER BY price ___`."
    blanks:
      - [LIKE]
      - [DESC]
    explanation: "`%` steht in LIKE-Mustern für beliebig viele Zeichen, `_` für genau eines. `DESC` sortiert absteigend, `ASC` (Standard) aufsteigend."
  - type: find-bug
    question: Gesucht sind alle Kleidungsstücke, die weniger als 30 Euro kosten **oder** nicht auf Lager sind. In welcher Zeile steckt der Denkfehler?
    language: sql
    code: |
      SELECT name, price, stock
      FROM products
      WHERE category = 'Kleidung'
        AND price < 30 OR stock = 0
      ORDER BY name;
    bug_line: 4
    explanation: >
      `AND` bindet stärker als `OR`. So liest die Datenbank `(category = 'Kleidung' AND price < 30) OR stock = 0`
      und liefert auch den Rucksack aus der Kategorie Taschen. Richtig wäre
      `AND (price < 30 OR stock = 0)`.
  - type: multiple
    question: Welche Bedingungen liefern genau die Produkte mit einem Preis von 5 bis einschließlich 20 Euro?
    options:
      - "`price BETWEEN 5 AND 20`"
      - "`price >= 5 AND price <= 20`"
      - "`price > 5 AND price < 20`"
      - "`price IN (5, 20)`"
    answers: [0, 1]
    explanation: "`BETWEEN` schließt beide Grenzen ein. `IN (5, 20)` prüft nur auf genau diese zwei Werte."
tasks:
  - id: erste-abfragen
    type: terminal
    title: Drei Fragen an den Shop
    description: |
      Im Ordner `erste-abfragen` liegt wieder `shop.db`. Schreibe für jede Frage **eine** SQL-Abfrage in die
      angegebene Datei. Stacklab führt deine Datei mit `sqlite3 shop.db < datei.sql` aus und vergleicht das
      Ergebnis mit einer Musterlösung – Spalten und Reihenfolge müssen also genau stimmen.

      1. `a1.sql`: Name und Preis (`name`, `price`) aller Produkte der Kategorie `Büro`, das teuerste zuerst.
      2. `a2.sql`: Name und E-Mail (`name`, `email`) aller Kunden, bei denen **keine Stadt** eingetragen ist.
      3. `a3.sql`: Name und Preis der **drei günstigsten** Produkte, die auf Lager sind (`stock` größer 0),
         aufsteigend nach Preis.

      Schreibe nur die Abfrage in die Datei, keine Punkt-Befehle wie `.headers on`.
      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: erste-abfragen
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
          test -s a1.sql || exit 1
          ist=$(sqlite3 shop.db < a1.sql 2>&1)
          soll=$(sqlite3 shop.db "SELECT name, price FROM products WHERE category = 'Büro' ORDER BY price DESC;")
          [ "$ist" = "$soll" ] && echo ok
        stdout_equals: ok
        message: a1.sql liefert noch nicht Name und Preis der Büro-Produkte, teuerstes zuerst. Denk an WHERE category = 'Büro' und ORDER BY price DESC.
      - type: command
        run: |
          test -s a2.sql || exit 1
          ist=$(sqlite3 shop.db < a2.sql 2>&1)
          soll=$(sqlite3 shop.db "SELECT name, email FROM customers WHERE city IS NULL;")
          [ "$ist" = "$soll" ] && echo ok
        stdout_equals: ok
        message: a2.sql liefert noch nicht Name und E-Mail der Kunden ohne Stadt. Mit = NULL klappt das nicht – nutze IS NULL.
      - type: command
        run: |
          test -s a3.sql || exit 1
          ist=$(sqlite3 shop.db < a3.sql 2>&1)
          soll=$(sqlite3 shop.db "SELECT name, price FROM products WHERE stock > 0 ORDER BY price ASC LIMIT 3;")
          [ "$ist" = "$soll" ] && echo ok
        stdout_equals: ok
        message: a3.sql liefert noch nicht die drei günstigsten Produkte mit Lagerbestand. Du brauchst WHERE stock > 0, ORDER BY price und LIMIT 3.
    hints:
      - "Baue jede Abfrage in der Reihenfolge `SELECT … FROM … WHERE … ORDER BY … LIMIT …;` auf und teste sie mit `sqlite3 shop.db < a1.sql`."
      - "Texte stehen in einfachen Anführungszeichen: `category = 'Büro'`. Fehlende Werte findest du mit `IS NULL`."
      - "a3: `SELECT name, price FROM products WHERE stock > 0 ORDER BY price LIMIT 3;`"
    solution: |
      ```bash
      cd erste-abfragen
      echo "SELECT name, price FROM products WHERE category = 'Büro' ORDER BY price DESC;" > a1.sql
      echo "SELECT name, email FROM customers WHERE city IS NULL;" > a2.sql
      echo "SELECT name, price FROM products WHERE stock > 0 ORDER BY price ASC LIMIT 3;" > a3.sql
      sqlite3 shop.db < a1.sql
      ```
  - id: logische-reihenfolge
    type: order
    title: In welcher Reihenfolge arbeitet die Datenbank?
    description: >
      Du schreibst `SELECT` zuerst, aber die Datenbank wertet die Teile einer Abfrage logisch in einer anderen
      Reihenfolge aus. Bringe die Klauseln in diese logische Reihenfolge.
    items:
      - "FROM – Tabelle festlegen"
      - "WHERE – Zeilen filtern"
      - "SELECT – Spalten und Ausdrücke berechnen"
      - "ORDER BY – Ergebnis sortieren"
      - "LIMIT – Anzahl begrenzen"
---

Die Shop-Betreiberin will wissen: Welche Büroartikel haben wir, und welcher ist der teuerste? Welche Kunden
haben keine Adresse hinterlegt? Jede dieser Fragen ist eine [[abfrage|Abfrage]] – und fast jede Abfrage
beginnt mit [[select|SELECT]].

## SELECT und FROM: Spalten auswählen

Die einfachste Abfrage nennt Spalten und eine Tabelle. Die Datenbank liefert eine
[[ergebnismenge|Ergebnismenge]] – wieder eine Tabelle.

```sql title="Spalten auswählen"
SELECT name, price FROM products;
SELECT * FROM customers;
SELECT name, price * 1.19 AS brutto FROM products;
SELECT DISTINCT category FROM products;
```

| Teil | Bedeutung |
|---|---|
| `SELECT name, price` | diese Spalten, in dieser Reihenfolge |
| `*` | alle Spalten |
| `price * 1.19` | ein berechneter Wert pro Zeile |
| `AS brutto` | [[spaltenalias|Spaltenalias]]: neuer Name für die Ergebnisspalte |
| `DISTINCT` | [[distinct|doppelte Zeilen]] entfernen |

SQL-Schlüsselwörter sind unabhängig von Groß- und Kleinschreibung. Üblich ist, sie großzuschreiben und
Tabellen- und Spaltennamen klein – so liest sich die Abfrage leichter.

> [!PRAXIS]
> `SELECT *` ist zum Erkunden praktisch. In Anwendungscode nennst du die Spalten lieber einzeln: Kommt
> später eine Spalte dazu, ändert sich dein Ergebnis sonst ungewollt mit.

## WHERE: Zeilen filtern

Mit der [[where-klausel|WHERE-Klausel]] behältst du nur Zeilen, für die eine Bedingung wahr ist.

```sql title="Filtern"
SELECT name, price FROM products WHERE category = 'Büro';
SELECT name FROM products WHERE price >= 20 AND stock > 0;
SELECT name FROM customers WHERE city = 'Berlin' OR city = 'Hamburg';
```

| Operator | Bedeutung |
|---|---|
| `=`, `<>` (oder `!=`) | gleich, ungleich |
| `<`, `<=`, `>`, `>=` | kleiner, größer |
| `AND`, `OR`, `NOT` | Bedingungen verknüpfen |

Texte stehen in **einfachen** Anführungszeichen: `'Büro'`. Doppelte Anführungszeichen sind in SQL für
Namen von Spalten oder Tabellen gedacht.

`AND` bindet stärker als `OR`. Setze im Zweifel Klammern:
`WHERE category = 'Kleidung' AND (price < 30 OR stock = 0)`.

## Muster, Listen, Bereiche und NULL

Für häufige Fragen gibt es eigene Operatoren:

```sql title="Weitere Filter"
SELECT name FROM products WHERE name LIKE 'T%';
SELECT name FROM products WHERE category IN ('Büro', 'Küche');
SELECT name FROM products WHERE price BETWEEN 5 AND 20;
SELECT name FROM customers WHERE city IS NULL;
```

| Operator | findet |
|---|---|
| `LIKE 'T%'` | Text beginnt mit T (`%` = beliebig viele Zeichen, `_` = genau eins) |
| `IN (…)` | Wert steht in der Liste |
| `BETWEEN 5 AND 20` | Bereich, beide Grenzen eingeschlossen |
| `IS NULL` / `IS NOT NULL` | Wert fehlt bzw. ist vorhanden |

[[sql-null|NULL]] bedeutet „unbekannt“. Ist die Stadt unbekannt, kann die Datenbank nicht sagen, ob sie
Berlin ist. Darum ergibt `city = NULL` nie wahr – auch nicht für fehlende Städte.

> [!FEHLER]
> **`WHERE city = NULL` liefert immer null Zeilen.** Ein Vergleich mit NULL ergibt wieder NULL, also
> „unbekannt“, und WHERE behält nur Zeilen mit „wahr“. Schreibe `IS NULL`.

## Sortieren und begrenzen

Ohne [[order-by|ORDER BY]] gibt es **keine** garantierte Reihenfolge. Dass SQLite oft nach `id` sortiert
ausgibt, ist Zufall der Speicherung, kein Versprechen.

```sql title="Sortieren"
SELECT name, price FROM products ORDER BY price DESC;
SELECT name, city FROM customers ORDER BY city, name;
SELECT name, price FROM products ORDER BY price LIMIT 3;
SELECT name, price FROM products ORDER BY price LIMIT 3 OFFSET 3;
```

- `ASC` sortiert aufsteigend (Standard), `DESC` absteigend.
- Mehrere Spalten: erst nach der ersten, bei Gleichstand nach der zweiten.
- [[limit|LIMIT]] begrenzt die Anzahl, `OFFSET` überspringt Zeilen – so baut man Seiten („Seite 2“).

Logisch arbeitet die Datenbank in dieser Reihenfolge: `FROM` → `WHERE` → `SELECT` → `ORDER BY` →
`LIMIT`. Deshalb kannst du in `ORDER BY` einen Alias aus `SELECT` verwenden, in `WHERE` aber nicht.

> [!MERKSATZ]
> Brauchst du eine bestimmte Reihenfolge, schreibe `ORDER BY`. Und `LIMIT` ohne `ORDER BY` liefert
> irgendwelche Zeilen, nicht die ersten.

## Zusammenfassung

- `SELECT spalten FROM tabelle` liest Daten; `*` nimmt alle Spalten, `AS` vergibt einen Alias.
- `WHERE` filtert Zeilen mit `=`, `<>`, `<`, `>`, `AND`, `OR`, `NOT` – Klammern klären die Logik.
- `LIKE`, `IN`, `BETWEEN` decken Muster, Listen und Bereiche ab.
- NULL heißt „unbekannt“ und wird nur mit `IS NULL` / `IS NOT NULL` geprüft.
- `ORDER BY … ASC/DESC` sortiert, `LIMIT` und `OFFSET` begrenzen – ohne ORDER BY keine feste Reihenfolge.
- Logische Reihenfolge: FROM, WHERE, SELECT, ORDER BY, LIMIT.
