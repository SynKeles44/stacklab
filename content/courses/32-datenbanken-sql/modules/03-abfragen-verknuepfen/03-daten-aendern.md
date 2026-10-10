---
title: Daten ändern – INSERT, UPDATE, DELETE
summary: Zeilen einfügen, Werte ändern und Daten löschen, den gefährlichsten Fehler (fehlendes WHERE) vermeiden und mit RETURNING sehen, was sich geändert hat.
duration: 20
sources:
  - title: SQLite – INSERT
    url: https://sqlite.org/lang_insert.html
  - title: SQLite – UPDATE
    url: https://sqlite.org/lang_update.html
  - title: SQLite – DELETE
    url: https://sqlite.org/lang_delete.html
  - title: SQLite – RETURNING
    url: https://sqlite.org/lang_returning.html
  - title: PostgreSQL – Data Manipulation
    url: https://www.postgresql.org/docs/current/dml.html
quiz:
  - type: find-bug
    question: Der Hoodie (id 3) soll 5 Euro günstiger werden. Nach dem Ausführen sind **alle** Produkte günstiger. Welche Zeile ist schuld?
    language: sql
    code: |
      UPDATE products
      SET price = price - 5;
      WHERE id = 3;
    bug_line: 2
    explanation: >
      Das Semikolon am Ende von Zeile 2 beendet die Anweisung. Das UPDATE läuft ohne WHERE auf allen Zeilen, und
      `WHERE id = 3;` ist danach ein eigener, ungültiger Rest. Richtig: `SET price = price - 5` ohne Semikolon.
  - type: single
    question: Was ist die sicherste Gewohnheit vor einem DELETE in einer wichtigen Datenbank?
    options:
      - Das DELETE möglichst schnell ausführen, damit niemand dazwischenfunkt.
      - Erst ein SELECT mit genau derselben WHERE-Bedingung ausführen und das Ergebnis prüfen.
      - WHERE weglassen und danach die falschen Zeilen wieder einfügen.
      - Die Tabelle vorher mit DROP TABLE leeren.
    answer: 1
    explanation: >
      Das SELECT zeigt dir, welche Zeilen betroffen sein werden. Stimmt die Anzahl, tauschst du `SELECT *` gegen
      `DELETE` – die Bedingung bleibt Zeichen für Zeichen gleich. Noch sicherer wird es in einer Transaktion.
  - type: match
    question: Ordne jeder Anweisung ihre Wirkung zu.
    pairs:
      - { left: "INSERT INTO … VALUES …", right: "Fügt neue Zeilen hinzu" }
      - { left: "UPDATE … SET … WHERE …", right: "Ändert Werte in passenden Zeilen" }
      - { left: "DELETE FROM … WHERE …", right: "Entfernt passende Zeilen" }
      - { left: "… RETURNING id", right: "Gibt Werte der geänderten Zeilen zurück" }
    explanation: INSERT, UPDATE und DELETE gehören zur DML (Data Manipulation Language). RETURNING gibt es in PostgreSQL und SQLite, MySQL kennt es nicht.
  - type: cloze
    text: "Mit `INSERT INTO tags (name) ___ ('neu'), ('sale');` legst du zwei Zeilen in einer Anweisung an."
    blanks:
      - [VALUES]
    explanation: Mehrere Wertelisten trennst du mit Kommas. Spalten, die du nicht nennst, bekommen ihren DEFAULT-Wert oder NULL.
tasks:
  - id: daten-pflegen
    type: terminal
    title: Den Shop-Bestand pflegen
    description: |
      Im Ordner `daten-pflegen` liegt `shop.db`. Schreibe alle Änderungen in die Datei `aenderungen.sql` und
      führe sie **einmal** mit `sqlite3 shop.db < aenderungen.sql` aus.

      1. Lege das Produkt `Trinkflasche` in der Kategorie `Küche` mit Preis `12.5` und Lagerbestand `30` an.
         Die id vergibt die Datenbank.
      2. Erhöhe den Preis **aller** Produkte der Kategorie `Kleidung` um 1 Euro.
      3. Setze den Status der Bestellung mit der id `6` auf `bezahlt`.
      4. Lösche alle **stornierten** Bestellungen samt ihren Positionen. `order_items` löscht per
         `ON DELETE CASCADE` mit – aber nur, wenn die erste Zeile deiner Datei `PRAGMA foreign_keys = ON;` ist.

      Ging etwas schief, klicke erneut auf **Aufgabe vorbereiten** – das setzt `shop.db` zurück.
      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: daten-pflegen
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
        run: sqlite3 shop.db "SELECT COUNT(*) FROM products WHERE name = 'Trinkflasche' AND category = 'Küche' AND price = 12.5 AND stock = 30;"
        stdout_equals: "1"
        message: Es gibt noch nicht genau ein Produkt Trinkflasche (Küche, 12.5, Bestand 30). Lief die Datei vielleicht zweimal? Dann Aufgabe neu vorbereiten.
      - type: command
        run: sqlite3 shop.db "SELECT COUNT(*) FROM products;"
        stdout_equals: "8"
        message: In products sollen genau 8 Zeilen stehen – die 7 alten und die Trinkflasche.
      - type: command
        run: sqlite3 shop.db "SELECT group_concat(name || '=' || price, ' ') FROM (SELECT name, price FROM products WHERE category = 'Kleidung' ORDER BY id);"
        stdout_equals: T-Shirt=20.5 Hoodie=40.0
        message: Die Kleidungspreise stimmen noch nicht. T-Shirt soll 20.5 und Hoodie 40.0 kosten – UPDATE products SET price = price + 1 WHERE category = 'Kleidung'.
      - type: command
        run: sqlite3 shop.db "SELECT SUM(price) FROM products WHERE category <> 'Kleidung';"
        stdout_equals: "81.0"
        message: Preise außerhalb der Kategorie Kleidung haben sich verändert. Hat ein UPDATE sein WHERE verloren? Bereite die Aufgabe neu vor.
      - type: command
        run: sqlite3 shop.db "SELECT status FROM orders WHERE id = 6;"
        stdout_equals: bezahlt
        message: Bestellung 6 hat noch nicht den Status bezahlt.
      - type: command
        run: sqlite3 shop.db "SELECT COUNT(*) || '/' || SUM(status = 'storniert') || '/' || SUM(status = 'versendet') FROM orders;"
        stdout_equals: 7/0/3
        message: In orders sollen noch 7 Bestellungen stehen, keine stornierte mehr, und die versendeten müssen unverändert bleiben.
      - type: command
        run: sqlite3 shop.db "SELECT COUNT(*) || '/' || SUM(order_id = 4) FROM order_items;"
        stdout_equals: 12/0
        message: Die Positionen der stornierten Bestellung 4 sind noch da (oder es fehlen andere). Steht PRAGMA foreign_keys = ON; in der ersten Zeile deiner Datei?
    hints:
      - "Gerüst: `INSERT INTO products (name, category, price, stock) VALUES (…);` – ohne id, die vergibt SQLite."
      - "Teste jede Bedingung vorher mit SELECT, z. B. `SELECT * FROM orders WHERE status = 'storniert';`."
      - "Die Datei beginnt mit `PRAGMA foreign_keys = ON;` und endet mit `DELETE FROM orders WHERE status = 'storniert';`."
    solution: |
      ```bash
      cd daten-pflegen
      cat > aenderungen.sql <<'SQL'
      PRAGMA foreign_keys = ON;
      INSERT INTO products (name, category, price, stock) VALUES ('Trinkflasche', 'Küche', 12.5, 30);
      UPDATE products SET price = price + 1 WHERE category = 'Kleidung';
      UPDATE orders SET status = 'bezahlt' WHERE id = 6;
      DELETE FROM orders WHERE status = 'storniert';
      SQL
      sqlite3 shop.db < aenderungen.sql
      ```
  - id: sicher-loeschen
    type: steps
    title: Sicher löschen im Ernstfall
    description: >
      Eine Kollegin bittet dich, alle Testkunden mit E-Mail-Adressen auf `@test.example.com` aus der Datenbank zu
      entfernen. Gehe den sicheren Weg Schritt für Schritt.
    steps:
      - situation: Du hast die Bedingung `email LIKE '%@test.example.com'` formuliert.
        question: Was tust du zuerst?
        options:
          - "`SELECT COUNT(*) FROM customers WHERE email LIKE '%@test.example.com';` ausführen"
          - "`DELETE FROM customers;` ausführen und dann nachsehen"
          - "Die Tabelle exportieren und von Hand bearbeiten"
        answer: 0
        explanation: Das SELECT zeigt dir, wie viele und welche Zeilen betroffen sind, ohne etwas zu verändern.
      - situation: Das SELECT liefert 12 Zeilen, und alle sehen nach Testdaten aus. Die Datenbank ist PostgreSQL.
        question: Wie führst du das DELETE aus?
        options:
          - "`BEGIN;`, dann das DELETE mit derselben Bedingung, Ausgabe `DELETE 12` prüfen, dann `COMMIT;`"
          - "Das DELETE ohne WHERE, weil das SELECT schon geprüft hat"
          - "Mit `DROP TABLE customers;`"
        answer: 0
        explanation: In einer Transaktion kannst du die gemeldete Anzahl prüfen und bei einer Überraschung mit ROLLBACK alles zurücknehmen.
      - situation: "Statt `DELETE 12` meldet die Datenbank `DELETE 1240`."
        question: Was tust du?
        options:
          - "`ROLLBACK;` – und die Bedingung erneut prüfen"
          - "`COMMIT;` – die Datenbank wird schon wissen, was sie tut"
          - "Das Terminal schließen"
        answer: 0
        explanation: Weicht die Anzahl ab, stimmt etwas nicht – vielleicht wurde die Bedingung beim Kopieren verändert. ROLLBACK macht alles ungeschehen.
---

Bisher hast du nur gelesen. Ein Shop lebt aber von Änderungen: neue Produkte, geänderte Preise, stornierte
Bestellungen. Dafür gibt es drei Anweisungen der [[dml|DML]]: [[insert|INSERT]],
[[update-anweisung|UPDATE]] und [[delete-anweisung|DELETE]]. Mit ihnen kannst du in Sekunden viel Arbeit
erledigen – oder viel kaputt machen.

## INSERT: neue Zeilen anlegen

```sql title="Einfügen"
INSERT INTO products (name, category, price, stock)
VALUES ('Trinkflasche', 'Küche', 12.5, 30);

INSERT INTO products (name, category, price)
VALUES ('Mütze', 'Kleidung', 14.0), ('Schal', 'Kleidung', 18.0);
```

- Nenne die Spalten immer ausdrücklich. Dann bleibt die Anweisung richtig, auch wenn später Spalten
  dazukommen.
- Lässt du `id` weg, vergibt die Datenbank die nächste Nummer.
- Lässt du `stock` weg, greift der `DEFAULT` 0.
- Mehrere Zeilen trennst du mit Kommas.

Du kannst auch das Ergebnis einer Abfrage einfügen, etwa um Daten zu kopieren:
`INSERT INTO archiv_orders SELECT * FROM orders WHERE order_date < '2026-01-01';`.

Daten, die eine leere Datenbank für Entwicklung oder Tests füllen, heißen übrigens
[[seed-daten|Seed-Daten]]. Sie bestehen meist aus genau solchen INSERT-Anweisungen.

## UPDATE: Werte ändern

```sql title="Ändern"
UPDATE orders SET status = 'versendet' WHERE id = 7;
UPDATE products SET price = price + 1 WHERE category = 'Kleidung';
UPDATE products SET stock = stock - 2, price = 8.0 WHERE id = 1;
```

`SET` darf den alten Wert verwenden: `price = price + 1` liest den bisherigen Preis jeder Zeile und schreibt
den neuen. Mehrere Spalten trennst du mit Kommas. `WHERE` bestimmt, welche Zeilen betroffen sind – fehlt es,
sind es **alle**.

> [!FEHLER]
> **UPDATE oder DELETE ohne WHERE.** `UPDATE products SET price = 0;` setzt jeden Preis im Shop auf 0. Eine
> Rückfrage gibt es nicht. Ein verirrtes Semikolon vor dem WHERE hat dieselbe Wirkung.

## DELETE: Zeilen löschen

```sql title="Löschen"
DELETE FROM orders WHERE status = 'storniert';
DELETE FROM order_items WHERE order_id = 4 AND product_id = 2;
```

Beim Löschen greifen die Fremdschlüssel-Regeln aus dem Modul Datenmodellierung. Mit `ON DELETE CASCADE`
verschwinden abhängige Zeilen mit. Ohne diese Regel verweigert die Datenbank das Löschen, solange noch
Verweise existieren. In SQLite gilt das alles nur nach `PRAGMA foreign_keys = ON;`.

`DELETE FROM orders;` ohne WHERE leert die ganze Tabelle, behält aber ihre Struktur. `DROP TABLE` würde auch
die Struktur entfernen.

## Sicher arbeiten: erst lesen, dann ändern

Profis ändern Daten nach einem festen Ablauf:

1. Bedingung als `SELECT` schreiben: `SELECT * FROM orders WHERE status = 'storniert';`
2. Ergebnis prüfen: Sind es die richtigen Zeilen, stimmt die Anzahl?
3. Nur den Anfang tauschen: `SELECT *` wird zu `DELETE`. Die Bedingung bleibt identisch.
4. Bei wichtigen Daten in einer [[transaktion|Transaktion]] arbeiten, damit du zurück kannst.

Mit [[returning|RETURNING]] siehst du direkt, was sich geändert hat:

```sql title="RETURNING (PostgreSQL und SQLite)"
UPDATE products SET price = price + 1 WHERE category = 'Kleidung'
RETURNING id, name, price;
```

> [!MERKSATZ]
> Erst `SELECT`, dann `UPDATE`/`DELETE` mit exakt derselben WHERE-Bedingung. Wer diese Gewohnheit hat,
> löscht nie versehentlich eine ganze Tabelle.

> [!PRAXIS]
> In vielen Teams darf auf der Produktionsdatenbank niemand ändernde Anweisungen von Hand ausführen. Nötige
> Korrekturen laufen als geprüftes Skript oder Migration – mit Review durch eine zweite Person.

## Zusammenfassung

- `INSERT INTO tabelle (spalten) VALUES (…), (…)` legt Zeilen an; fehlende Spalten erhalten DEFAULT oder NULL.
- `UPDATE tabelle SET spalte = ausdruck WHERE …` ändert Werte und darf den alten Wert nutzen.
- `DELETE FROM tabelle WHERE …` löscht Zeilen; Fremdschlüssel-Regeln bestimmen, was mit Abhängigen passiert.
- Ohne WHERE trifft UPDATE oder DELETE jede Zeile – ohne Rückfrage.
- Erst SELECT mit derselben Bedingung, dann ändern; wichtige Änderungen in einer Transaktion.
- `RETURNING` zeigt die geänderten Zeilen (PostgreSQL, SQLite).
