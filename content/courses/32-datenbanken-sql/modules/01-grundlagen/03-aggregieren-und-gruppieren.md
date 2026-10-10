---
title: Zählen, summieren, gruppieren
summary: Mit COUNT, SUM, AVG, MIN und MAX Kennzahlen berechnen, mit GROUP BY pro Gruppe auswerten und mit HAVING ganze Gruppen filtern – und WHERE von HAVING sicher unterscheiden.
duration: 25
sources:
  - title: SQLite – Built-in Aggregate Functions
    url: https://sqlite.org/lang_aggfunc.html
  - title: SQLite – SELECT (GROUP BY und HAVING)
    url: https://sqlite.org/lang_select.html#resultset
  - title: PostgreSQL – Aggregate Functions (Tutorial)
    url: https://www.postgresql.org/docs/current/tutorial-agg.html
  - title: MySQL 8.4 – MySQL Handling of GROUP BY
    url: https://dev.mysql.com/doc/refman/8.4/en/group-by-handling.html
quiz:
  - type: find-bug
    question: Diese Abfrage soll pro Kategorie den Durchschnittspreis zeigen. PostgreSQL bricht mit einem Fehler ab. Welche Zeile ist schuld?
    language: sql
    code: |
      SELECT category, name, AVG(price) AS schnitt
      FROM products
      GROUP BY category
      ORDER BY category;
    bug_line: 1
    explanation: >
      `name` steht weder in `GROUP BY` noch in einer Aggregatfunktion. Eine Kategorie hat aber mehrere Namen –
      welcher soll in der einen Ergebniszeile stehen? PostgreSQL und MySQL (mit ONLY_FULL_GROUP_BY) melden einen
      Fehler, SQLite nimmt stillschweigend irgendeinen Namen. Lösung: `name` aus dem SELECT streichen.
  - type: find-bug
    question: Gesucht sind Kategorien mit mehr als zwei Produkten. In welcher Zeile steckt der Fehler?
    language: sql
    code: |
      SELECT category, COUNT(*) AS anzahl
      FROM products
      WHERE COUNT(*) > 2
      GROUP BY category;
    bug_line: 3
    explanation: >
      WHERE filtert einzelne Zeilen, **bevor** gruppiert wird – dort gibt es noch kein COUNT. Bedingungen auf
      Aggregate gehören in `HAVING COUNT(*) > 2` nach dem GROUP BY.
  - type: single
    question: In `customers` haben 6 Zeilen eine id, aber nur 5 eine Stadt. Was liefert `SELECT COUNT(city) FROM customers;`?
    options: ["6", "5", "1", "NULL"]
    answer: 1
    explanation: "`COUNT(spalte)` zählt nur Zeilen, in denen die Spalte nicht NULL ist. `COUNT(*)` zählt alle Zeilen."
  - type: match
    question: Ordne jeder Funktion ihr Ergebnis zu.
    pairs:
      - { left: "COUNT(*)", right: "Anzahl der Zeilen" }
      - { left: "SUM(quantity)", right: "Summe aller Mengen" }
      - { left: "AVG(price)", right: "Durchschnittspreis" }
      - { left: "MAX(order_date)", right: "Datum der neuesten Bestellung" }
    explanation: Aggregatfunktionen fassen viele Zeilen zu einem Wert zusammen – ohne GROUP BY über die ganze Tabelle, mit GROUP BY pro Gruppe.
tasks:
  - id: kennzahlen
    type: terminal
    title: Kennzahlen für die Shop-Betreiberin
    description: |
      Im Ordner `kennzahlen` liegt `shop.db`. Schreibe jede Auswertung in die angegebene Datei. Spaltenreihenfolge
      und Sortierung müssen genau stimmen, Spaltennamen (Aliase) sind dir überlassen.

      1. `g1.sql`: Für jeden Bestellstatus (`status`) die Anzahl der Bestellungen aus `orders`, sortiert nach `status`.
      2. `g2.sql`: Für jede Kategorie aus `products`: `category`, die Anzahl der Produkte und den
         Durchschnittspreis gerundet auf zwei Nachkommastellen (`ROUND(…, 2)`), sortiert nach `category`.
      3. `g3.sql`: Alle `customer_id` mit **mindestens zwei** Bestellungen, die **nicht** storniert sind
         (`status` ungleich `'storniert'`), dazu die Anzahl dieser Bestellungen, sortiert nach `customer_id`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: kennzahlen
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
          test -s g1.sql || exit 1
          ist=$(sqlite3 shop.db < g1.sql 2>&1)
          soll=$(sqlite3 shop.db "SELECT status, COUNT(*) FROM orders GROUP BY status ORDER BY status;")
          [ "$ist" = "$soll" ] && echo ok
        stdout_equals: ok
        message: g1.sql stimmt noch nicht. Erwartet werden zwei Spalten – status und Anzahl – mit GROUP BY status und ORDER BY status.
      - type: command
        run: |
          test -s g2.sql || exit 1
          ist=$(sqlite3 shop.db < g2.sql 2>&1)
          soll=$(sqlite3 shop.db "SELECT category, COUNT(*), ROUND(AVG(price), 2) FROM products GROUP BY category ORDER BY category;")
          [ "$ist" = "$soll" ] && echo ok
        stdout_equals: ok
        message: g2.sql stimmt noch nicht. Erwartet werden category, Anzahl und ROUND(AVG(price), 2) pro Kategorie, sortiert nach category.
      - type: command
        run: |
          test -s g3.sql || exit 1
          ist=$(sqlite3 shop.db < g3.sql 2>&1)
          soll=$(sqlite3 shop.db "SELECT customer_id, COUNT(*) FROM orders WHERE status <> 'storniert' GROUP BY customer_id HAVING COUNT(*) >= 2 ORDER BY customer_id;")
          [ "$ist" = "$soll" ] && echo ok
        stdout_equals: ok
        message: g3.sql stimmt noch nicht. Stornierte Bestellungen filterst du mit WHERE vor dem Gruppieren, die Mindestanzahl mit HAVING COUNT(*) >= 2 danach.
    hints:
      - "Gerüst für jede Auswertung: `SELECT gruppenspalte, COUNT(*) FROM tabelle GROUP BY gruppenspalte ORDER BY gruppenspalte;`"
      - "g2 braucht drei Spalten: `category, COUNT(*), ROUND(AVG(price), 2)`."
      - "g3: Zeilenfilter in WHERE (`status <> 'storniert'`), Gruppenfilter in `HAVING COUNT(*) >= 2`."
    solution: |
      ```bash
      cd kennzahlen
      echo "SELECT status, COUNT(*) AS anzahl FROM orders GROUP BY status ORDER BY status;" > g1.sql
      echo "SELECT category, COUNT(*) AS anzahl, ROUND(AVG(price), 2) AS schnitt FROM products GROUP BY category ORDER BY category;" > g2.sql
      cat > g3.sql <<'SQL'
      SELECT customer_id, COUNT(*) AS anzahl
      FROM orders
      WHERE status <> 'storniert'
      GROUP BY customer_id
      HAVING COUNT(*) >= 2
      ORDER BY customer_id;
      SQL
      sqlite3 shop.db < g3.sql
      ```
  - id: gruppen-denken
    type: steps
    title: Was passiert in welcher Phase?
    description: >
      Verfolge die Abfrage
      `SELECT category, COUNT(*) FROM products WHERE stock > 0 GROUP BY category HAVING COUNT(*) >= 2;`
      Schritt für Schritt. Die Tabelle `products` hat sieben Produkte, der Rucksack hat `stock = 0`.
    steps:
      - situation: Die Datenbank liest die Tabelle `products` und wendet `WHERE stock > 0` an.
        question: Wie viele Zeilen bleiben übrig?
        options: ["7", "6", "3"]
        answer: 1
        explanation: Nur der Rucksack fällt heraus. WHERE arbeitet auf einzelnen Zeilen, vor jeder Gruppierung.
      - situation: "Jetzt bildet `GROUP BY category` Gruppen: Büro (Notizbuch, Kugelschreiber, Sticker-Set), Kleidung (T-Shirt, Hoodie), Küche (Tasse)."
        question: Wie viele Gruppen gibt es?
        options: ["3", "4", "6"]
        answer: 0
        explanation: Die Kategorie Taschen ist verschwunden, weil ihr einziges Produkt schon von WHERE aussortiert wurde.
      - situation: "`HAVING COUNT(*) >= 2` prüft jede Gruppe."
        question: Welche Gruppen erscheinen im Ergebnis?
        options: ["Büro und Kleidung", "Nur Büro", "Alle drei"]
        answer: 0
        explanation: Küche hat nur ein Produkt und fällt heraus. HAVING filtert ganze Gruppen nach dem Gruppieren.
---

„Wie viele Bestellungen sind noch offen? Was kostet ein Büroartikel im Schnitt? Welche Kunden bestellen
regelmäßig?“ Für solche Fragen willst du keine Zeilenliste, sondern **eine Zahl** – oder eine Zahl pro
Gruppe. Dafür kennt SQL Aggregatfunktionen und `GROUP BY`.

## Aggregatfunktionen: viele Zeilen, ein Wert

Eine [[aggregatfunktion|Aggregatfunktion]] fasst viele Zeilen zu einem einzigen Wert zusammen.

```sql title="Kennzahlen über die ganze Tabelle"
SELECT COUNT(*) FROM orders;
SELECT COUNT(city) FROM customers;
SELECT SUM(stock), AVG(price), MIN(price), MAX(price) FROM products;
SELECT ROUND(AVG(price), 2) FROM products WHERE category = 'Büro';
```

| Funktion | liefert |
|---|---|
| `COUNT(*)` | Anzahl der Zeilen |
| `COUNT(spalte)` | Anzahl der Zeilen, in denen die Spalte **nicht** NULL ist |
| `SUM(spalte)` | Summe |
| `AVG(spalte)` | Durchschnitt |
| `MIN(spalte)`, `MAX(spalte)` | kleinster, größter Wert – klappt auch mit Text und Datum |

Alle Aggregatfunktionen außer `COUNT(*)` ignorieren NULL-Werte. Ein fehlender Preis zieht den Durchschnitt
also nicht auf null, er zählt einfach nicht mit. `ROUND(wert, 2)` rundet auf zwei Nachkommastellen.

## GROUP BY: eine Zeile pro Gruppe

Mit [[group-by|GROUP BY]] teilst du die Zeilen in Gruppen mit gleichem Wert ein. Die Aggregatfunktion
läuft dann pro Gruppe. Stell dir Körbe vor: Jede Bestellung landet im Korb ihres Status, dann zählst du jeden
Korb.

```sql title="Bestellungen pro Status"
SELECT status, COUNT(*) AS anzahl
FROM orders
GROUP BY status
ORDER BY status;
```

```text title="Ergebnis"
bezahlt|2
offen|2
storniert|1
versendet|3
```

Für jede Spalte im `SELECT` gilt eine Regel: Sie steht im `GROUP BY` **oder** in einer Aggregatfunktion.
Sonst ist unklar, welcher Wert der Gruppe gemeint ist.

> [!FEHLER]
> **`SELECT category, name, AVG(price) … GROUP BY category`** – eine Kategorie hat mehrere Namen. PostgreSQL
> und MySQL brechen hier mit einem Fehler ab. SQLite liefert ohne Warnung **irgendeinen** Namen der Gruppe.
> Dass es „funktioniert“, heißt also nicht, dass es stimmt.

## HAVING: ganze Gruppen filtern

`WHERE` filtert Zeilen, **bevor** gruppiert wird. Willst du Gruppen nach ihrem Ergebnis filtern – „nur
Kunden mit mindestens zwei Bestellungen“ –, brauchst du [[having|HAVING]].

```sql title="WHERE und HAVING zusammen"
SELECT customer_id, COUNT(*) AS anzahl
FROM orders
WHERE status <> 'storniert'
GROUP BY customer_id
HAVING COUNT(*) >= 2
ORDER BY anzahl DESC;
```

| | WHERE | HAVING |
|---|---|---|
| filtert | einzelne Zeilen | ganze Gruppen |
| läuft | vor GROUP BY | nach GROUP BY |
| darf Aggregate nutzen | nein | ja |

Die vollständige logische Reihenfolge lautet damit: `FROM` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT` →
`ORDER BY` → `LIMIT`.

> [!MERKSATZ]
> Bedingung auf einzelne Werte (`status`, `price`) → WHERE. Bedingung auf ein Ergebnis der Gruppe
> (`COUNT(*)`, `SUM(…)`) → HAVING.

## Gruppieren in der Praxis

Du kannst nach mehreren Spalten gruppieren. Dann bildet jede Kombination eine eigene Gruppe:

```sql title="Kunden pro Stadt und Jahr der Registrierung"
SELECT city, substr(created_at, 1, 4) AS jahr, COUNT(*) AS anzahl
FROM customers
GROUP BY city, jahr
ORDER BY city, jahr;
```

Die NULL-Stadt bildet dabei eine eigene Gruppe. SQLite speichert Datumswerte hier als Text im Format
`JJJJ-MM-TT`, deshalb schneidet `substr` das Jahr heraus. PostgreSQL und MySQL haben echte Datumstypen und
Funktionen wie `EXTRACT(YEAR FROM …)`.

> [!PRAXIS]
> Dashboards in Web-Anwendungen – „Umsatz pro Monat“, „Bestellungen pro Status“ – sind fast immer eine
> GROUP-BY-Abfrage. Wer sie sicher liest und schreibt, kann viele Fragen aus dem Team selbst beantworten,
> statt auf eine Auswertung zu warten.

## Zusammenfassung

- `COUNT`, `SUM`, `AVG`, `MIN`, `MAX` fassen viele Zeilen zu einem Wert zusammen; NULL zählt nicht mit.
- `COUNT(*)` zählt Zeilen, `COUNT(spalte)` nur Zeilen mit Wert in dieser Spalte.
- `GROUP BY` bildet Gruppen; jede SELECT-Spalte steht im GROUP BY oder in einer Aggregatfunktion.
- `WHERE` filtert Zeilen vor dem Gruppieren, `HAVING` filtert Gruppen danach.
- Logische Reihenfolge: FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT.
- SQLite toleriert „lose“ Spalten im GROUP BY – PostgreSQL und MySQL nicht. Schreib es gleich richtig.
