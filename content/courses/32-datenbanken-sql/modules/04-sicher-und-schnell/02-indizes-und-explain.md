---
title: Indizes und EXPLAIN
summary: Verstehen, warum Abfragen auf großen Tabellen langsam werden, wie ein Index als B-Baum hilft, wann er sich lohnt und wie du mit EXPLAIN QUERY PLAN prüfst, ob die Datenbank ihn wirklich nutzt.
duration: 20
sources:
  - title: SQLite – CREATE INDEX
    url: https://sqlite.org/lang_createindex.html
  - title: SQLite – EXPLAIN QUERY PLAN
    url: https://sqlite.org/eqp.html
  - title: SQLite – Query Planning
    url: https://sqlite.org/queryplanner.html
  - title: PostgreSQL – Indexes
    url: https://www.postgresql.org/docs/current/indexes.html
  - title: PostgreSQL – Using EXPLAIN
    url: https://www.postgresql.org/docs/current/using-explain.html
quiz:
  - type: single
    question: "`EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 4;` zeigt `SCAN orders`. Was bedeutet das?"
    options:
      - Die Abfrage ist fehlerhaft.
      - Die Datenbank liest jede Zeile der Tabelle und prüft die Bedingung einzeln.
      - Die Datenbank nutzt einen Index auf customer_id.
      - Die Tabelle orders ist leer.
    answer: 1
    explanation: >
      SCAN heißt: vollständiger Durchlauf durch die Tabelle. Mit einem passenden Index stünde dort
      `SEARCH orders USING INDEX … (customer_id=?)`.
  - type: multiple
    question: Für welche Spalten lohnt sich ein Index typischerweise?
    options:
      - Fremdschlüssel-Spalten wie `orders.customer_id`, über die oft gejoint wird.
      - Spalten, nach denen häufig in WHERE gesucht wird, etwa `customers.email`.
      - Jede Spalte jeder Tabelle, sicherheitshalber.
      - Eine Spalte, die nur zwei Werte kennt und nie gefiltert wird.
    answers: [0, 1]
    explanation: >
      Indizes helfen beim Suchen, Joinen und Sortieren. Jeder Index kostet aber Speicher und verlangsamt jedes
      INSERT, UPDATE und DELETE, weil er mitgepflegt werden muss. Deshalb indexierst du gezielt.
  - type: cloze
    text: "Einen Index legst du mit `CREATE ___ idx_orders_customer_id ___ orders(customer_id);` an."
    blanks:
      - [INDEX]
      - ["ON"]
    explanation: Nach dem Indexnamen folgen ON, der Tabellenname und in Klammern die Spalte(n).
  - type: single
    question: "Es gibt einen Index auf `orders(status, order_date)`. Welche Abfrage kann ihn **nicht** gut nutzen?"
    options:
      - "`WHERE status = 'offen'`"
      - "`WHERE status = 'offen' AND order_date >= '2026-06-01'`"
      - "`WHERE order_date >= '2026-06-01'`"
    answer: 2
    explanation: >
      Ein zusammengesetzter Index ist erst nach der ersten Spalte sortiert, dann nach der zweiten – wie ein
      Telefonbuch erst nach Nachname, dann nach Vorname. Ohne Bedingung auf status hilft er kaum.
  - type: find-bug
    question: Die Abfrage soll den Index auf `customers(email)` nutzen, tut es aber nicht. In welcher Zeile liegt das Problem?
    language: sql
    code: |
      SELECT id, name
      FROM customers
      WHERE lower(email) = 'ada@example.com';
    bug_line: 3
    explanation: >
      Der Index enthält die Werte von `email`, nicht von `lower(email)`. Wendest du eine Funktion auf die Spalte
      an, muss die Datenbank jede Zeile umrechnen. Vergleiche die Spalte direkt oder lege einen Index auf den
      Ausdruck an.
tasks:
  - id: index-anlegen
    type: terminal
    title: Zwei Abfragen beschleunigen
    description: |
      Im Ordner `index-tuning` liegt `shop.db`. Der Shop sucht oft alle Positionen eines Produkts und alle offenen
      Bestellungen ab einem Datum. Beide Abfragen lesen bisher die ganze Tabelle.

      1. Speichere den Plan **vor** deiner Änderung:
         `sqlite3 shop.db "EXPLAIN QUERY PLAN SELECT * FROM order_items WHERE product_id = 1;" > plan-vorher.txt`
      2. Schreibe `indizes.sql` mit zwei Anweisungen und führe sie mit `sqlite3 shop.db < indizes.sql` aus:
         - einen Index `idx_order_items_product_id` auf `order_items(product_id)`
         - einen zusammengesetzten Index `idx_orders_status_date` auf `orders(status, order_date)` – in dieser Reihenfolge
      3. Speichere den Plan **danach** in `plan-nachher.txt` – mit demselben Befehl wie in Schritt 1.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: index-tuning
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
      - type: file_contains
        path: plan-vorher.txt
        pattern: "SCAN order_items"
        message: plan-vorher.txt soll den Plan ohne Index enthalten (SCAN order_items). Führe Schritt 1 vor dem Anlegen der Indizes aus.
      - type: command
        run: sqlite3 shop.db "SELECT ii.name FROM pragma_index_list('order_items') il JOIN pragma_index_info(il.name) ii WHERE il.origin = 'c';"
        stdout_equals: product_id
        message: Auf order_items fehlt noch ein selbst angelegter Index auf die Spalte product_id.
      - type: command
        run: sqlite3 shop.db "SELECT group_concat(ii.name, ',') FROM (SELECT name FROM pragma_index_list('orders') WHERE origin = 'c') il JOIN pragma_index_info(il.name) ii;"
        stdout_equals: status,order_date
        message: Auf orders fehlt noch der zusammengesetzte Index über (status, order_date) – genau in dieser Reihenfolge.
      - type: command
        run: sqlite3 shop.db "EXPLAIN QUERY PLAN SELECT * FROM orders WHERE status = 'offen' AND order_date >= '2026-06-01';"
        stdout_matches: "SEARCH orders USING (COVERING )?INDEX"
        message: Die Abfrage auf offene Bestellungen nutzt noch keinen Index. Prüfe den Index auf orders(status, order_date).
      - type: file_contains
        path: plan-nachher.txt
        pattern: "SEARCH order_items USING (COVERING )?INDEX"
        message: plan-nachher.txt soll den neuen Plan zeigen (SEARCH order_items USING INDEX …). Lege ihn nach den Indizes an.
    hints:
      - "Die Syntax lautet `CREATE INDEX name ON tabelle(spalte);` – für zwei Spalten `ON tabelle(spalte1, spalte2)`."
      - "Mit `sqlite3 shop.db \".indexes\"` siehst du alle Indizes. Die automatisch angelegten heißen `sqlite_autoindex_…`."
      - "Hast du einen Index falsch angelegt, entferne ihn mit `DROP INDEX name;` und lege ihn neu an."
    solution: |
      ```bash
      cd index-tuning
      sqlite3 shop.db "EXPLAIN QUERY PLAN SELECT * FROM order_items WHERE product_id = 1;" > plan-vorher.txt
      cat > indizes.sql <<'SQL'
      CREATE INDEX idx_order_items_product_id ON order_items(product_id);
      CREATE INDEX idx_orders_status_date ON orders(status, order_date);
      SQL
      sqlite3 shop.db < indizes.sql
      sqlite3 shop.db "EXPLAIN QUERY PLAN SELECT * FROM order_items WHERE product_id = 1;" > plan-nachher.txt
      ```
  - id: index-ja-nein
    type: dragdrop
    title: Hilft hier ein Index?
    description: Im Shop gibt es Indizes auf `customers(email)`, `orders(customer_id)` und `orders(status, order_date)`. Ordne jede Abfrage zu.
    targets:
      - { id: hilft, label: Ein vorhandener Index hilft }
      - { id: hilftnicht, label: Kein Index hilft – die Tabelle wird gescannt }
    items:
      - { label: "WHERE email = 'ada@example.com'", target: hilft }
      - { label: "JOIN orders o ON o.customer_id = c.id", target: hilft }
      - { label: "WHERE status = 'offen' AND order_date >= '2026-06-01'", target: hilft }
      - { label: "WHERE lower(email) = 'ada@example.com'", target: hilftnicht }
      - { label: "WHERE order_date >= '2026-06-01' (ohne status)", target: hilftnicht }
      - { label: "WHERE city = 'Berlin'", target: hilftnicht }
---

Der Beispiel-Shop hat acht Bestellungen – jede Abfrage ist sofort fertig. Ein echter Shop hat nach ein paar
Jahren zehn Millionen. Plötzlich braucht die Seite „Meine Bestellungen“ drei Sekunden. Die Abfrage ist
richtig, aber die Datenbank muss jede einzelne Zeile ansehen. Ein [[datenbank-index|Index]] ist die übliche
Lösung.

## Das Problem: jede Zeile prüfen

Ohne Hilfe beantwortet die Datenbank `WHERE customer_id = 4` so: Sie liest Zeile 1, prüft, liest Zeile 2,
prüft – bis zur letzten Zeile. Dieser vollständige Durchlauf heißt [[seq-scan|Full Table Scan]]. Bei zehn
Zeilen merkst du nichts, bei zehn Millionen sehr wohl.

Stell dir ein dickes Fachbuch ohne Stichwortverzeichnis vor. Suchst du „Transaktion“, blätterst du jede
Seite durch. Mit Stichwortverzeichnis schlägst du hinten nach und springst direkt auf Seite 214. Genau das
ist ein Index: ein sortiertes Verzeichnis der Werte einer Spalte mit Verweisen auf die passenden Zeilen.

| Ohne Index | Mit Index |
|---|---|
| liest alle Zeilen | springt zu den passenden Zeilen |
| Aufwand wächst mit der Tabellengröße | Aufwand wächst nur sehr langsam |
| nichts zusätzlich zu pflegen | Index muss bei jeder Änderung mitgepflegt werden |

> [!MERKSATZ]
> Ein Index ist ein zusätzliches, sortiertes Verzeichnis einer oder mehrerer Spalten. Er ändert nie das
> Ergebnis einer Abfrage – nur, wie schnell es gefunden wird.

## Wie ein Index aufgebaut ist

Die meisten Datenbanken speichern einen Index als [[b-baum|B-Baum]]. Das ist ein Baum aus sortierten Knoten.
Die Wurzel sagt: „Kleiner als 3 links, sonst rechts.“ Die Zwischenknoten verfeinern das, bis die Suche in
einem Blatt ankommt. Dort stehen die Werte und der Verweis auf die Zeile.

![Ein B-Baum-Index auf orders(customer_id): Die Suche nach 4 läuft von der Wurzel über einen Zwischenknoten zum passenden Blatt](/assets/datenbanken-sql/b-baum.svg)

Selbst bei Millionen Einträgen sind das nur drei oder vier Sprünge. Weil die Blätter sortiert und miteinander
verbunden sind, helfen sie auch bei Bereichen (`BETWEEN`, `>=`) und beim Sortieren mit `ORDER BY`.

Einen Index legst du mit [[sql|SQL]] an und entfernst ihn bei Bedarf wieder:

```sql title="Index anlegen und löschen"
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
DROP INDEX idx_orders_customer_id;
```

Für `PRIMARY KEY`- und `UNIQUE`-Spalten legt die Datenbank automatisch einen Index an. In SQLite heißen sie
`sqlite_autoindex_…`. Der Befehl `.indexes` in `sqlite3` listet alle auf.

## EXPLAIN: der Datenbank über die Schulter schauen

Ob ein Index benutzt wird, entscheidet der [[query-planer|Query-Planer]]. Er sucht für jede Abfrage den
günstigsten Weg – den [[ausfuehrungsplan|Ausführungsplan]]. Mit [[explain|EXPLAIN]] lässt du ihn dir zeigen.
In SQLite heißt die lesbare Variante `EXPLAIN QUERY PLAN`:

```text title="Vorher und nachher"
sqlite> EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 1;
QUERY PLAN
`--SCAN orders

sqlite> CREATE INDEX idx_orders_customer_id ON orders(customer_id);
sqlite> EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 1;
QUERY PLAN
`--SEARCH orders USING INDEX idx_orders_customer_id (customer_id=?)
```

| Ausgabe | Bedeutung |
|---|---|
| `SCAN orders` | ganze Tabelle lesen |
| `SEARCH orders USING INDEX …` | gezielt über den Index suchen |
| `USING COVERING INDEX` | alle nötigen Spalten stehen schon im Index, die Tabelle wird gar nicht gelesen |

PostgreSQL und MySQL schreiben `EXPLAIN SELECT …` und zeigen ähnliche Begriffe: `Seq Scan` statt SCAN,
[[index-scan|Index Scan]] statt SEARCH. `EXPLAIN ANALYZE` führt die Abfrage zusätzlich aus und misst die
echte Zeit.

> [!PRAXIS]
> Wird eine Seite langsam, kopierst du die verdächtige Abfrage aus dem Log, stellst `EXPLAIN` davor und
> suchst nach vollständigen Scans großer Tabellen. Das ist fast immer der erste Schritt jeder
> Datenbank-Optimierung.

## Wann sich ein Index lohnt

Indizes sind nicht kostenlos. Jeder Index belegt Speicherplatz, und jedes `INSERT`, `UPDATE` und `DELETE`
muss ihn mitpflegen. Eine Tabelle mit zwanzig Indizes schreibt deshalb spürbar langsamer.

Gute Kandidaten sind:

- **[[fremdschluessel|Fremdschlüssel]]-Spalten** wie `orders.customer_id` – über sie wird ständig gejoint.
  PostgreSQL und SQLite legen dafür **keinen** Index automatisch an.
- Spalten, die oft in `WHERE` stehen und viele verschiedene Werte haben, etwa `email`.
- Spalten in `ORDER BY` bei großen Ergebnissen.

Ein [[zusammengesetzter-index|zusammengesetzter Index]] über `(status, order_date)` ist erst nach `status`
sortiert, innerhalb davon nach `order_date` – wie ein Telefonbuch nach Nachname, dann Vorname. Er hilft bei
`status = 'offen'` und bei `status = 'offen' AND order_date >= …`, aber kaum bei `order_date` allein.

> [!FEHLER]
> **Funktionen auf der indexierten Spalte.** `WHERE lower(email) = 'ada@example.com'` kann den Index auf
> `email` nicht nutzen, denn der Index kennt nur die Originalwerte. Vergleiche die Spalte direkt – oder lege
> bewusst einen Index auf den Ausdruck an.

Weitere Indexarten wie Teil- oder Volltextindizes findest du in der
[PostgreSQL-Dokumentation zu Indizes](https://www.postgresql.org/docs/current/indexes.html).

## Zusammenfassung

- Ohne Index liest die Datenbank jede Zeile (Full Table Scan) – bei großen Tabellen langsam.
- Ein Index ist ein sortiertes Verzeichnis, meist als B-Baum, mit Verweisen auf die Zeilen.
- `CREATE INDEX name ON tabelle(spalte);` legt ihn an, `DROP INDEX name;` entfernt ihn.
- `EXPLAIN QUERY PLAN` (SQLite) bzw. `EXPLAIN` (PostgreSQL, MySQL) zeigt, ob der Index genutzt wird.
- Indexiere Fremdschlüssel und häufig gefilterte Spalten – nicht einfach alles.
- Bei zusammengesetzten Indizes zählt die Reihenfolge der Spalten.
- Funktionen auf der Spalte in `WHERE` verhindern die Nutzung des Index.
