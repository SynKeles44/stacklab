---
title: Transaktionen – alles oder nichts
summary: Mehrere Änderungen mit BEGIN, COMMIT und ROLLBACK zu einer unteilbaren Einheit bündeln, die vier ACID-Eigenschaften verstehen und Transaktionen im Alltag richtig einsetzen.
duration: 20
sources:
  - title: SQLite – Transaction (BEGIN, COMMIT, ROLLBACK)
    url: https://sqlite.org/lang_transaction.html
  - title: SQLite – Atomic Commit In SQLite
    url: https://sqlite.org/atomiccommit.html
  - title: PostgreSQL – Transactions (Tutorial)
    url: https://www.postgresql.org/docs/current/tutorial-transactions.html
  - title: PostgreSQL – psql (Prompting)
    url: https://www.postgresql.org/docs/current/app-psql.html
  - title: MySQL 8.4 – START TRANSACTION, COMMIT, and ROLLBACK
    url: https://dev.mysql.com/doc/refman/8.4/en/commit.html
quiz:
  - type: single
    question: Eine Bestellung wird angelegt, die Positionen werden eingefügt – dann stürzt das Programm ab, bevor der Lagerbestand sinkt. Was verhindert eine Transaktion?
    options:
      - Dass das Programm abstürzt.
      - Dass ein halber Zustand gespeichert bleibt – ohne COMMIT wird alles verworfen.
      - Dass andere Nutzer die Tabelle lesen.
      - Dass doppelte Bestellnummern entstehen.
    answer: 1
    explanation: >
      Bis zum COMMIT ist nichts dauerhaft. Bricht die Verbindung vorher ab, rollt die Datenbank alle Änderungen der
      Transaktion zurück. Atomarität heißt: ganz oder gar nicht.
  - type: match
    question: Ordne jedem Buchstaben von ACID seine Bedeutung zu.
    pairs:
      - { left: "Atomicity", right: "Alle Änderungen gelten zusammen oder keine" }
      - { left: "Consistency", right: "Nach der Transaktion sind alle Regeln und Constraints erfüllt" }
      - { left: "Isolation", right: "Gleichzeitige Transaktionen stören sich nicht gegenseitig" }
      - { left: "Durability", right: "Nach COMMIT überlebt die Änderung auch einen Stromausfall" }
    explanation: ACID beschreibt die Garantien, die relationale Datenbanken für Transaktionen geben.
  - type: multiple
    question: Welche Aussagen stimmen?
    options:
      - Ohne ausdrückliches BEGIN ist jede einzelne Anweisung ihre eigene Transaktion (Auto-Commit).
      - Nach COMMIT kann man mit ROLLBACK noch alles zurücknehmen.
      - Transaktionen sollten kurz sein, weil sie Sperren halten können.
      - Innerhalb der Transaktion sieht man die eigenen, noch nicht bestätigten Änderungen.
    answers: [0, 2, 3]
    explanation: >
      ROLLBACK wirkt nur bis zum COMMIT. Danach sind die Änderungen dauerhaft und lassen sich nur durch neue
      Änderungen korrigieren.
  - type: cloze
    text: "Eine Transaktion beginnt mit `___;` und endet entweder mit `___;` (speichern) oder mit `ROLLBACK;` (verwerfen)."
    blanks:
      - [BEGIN, "BEGIN TRANSACTION", "START TRANSACTION"]
      - [COMMIT, END]
    explanation: MySQL nutzt meist `START TRANSACTION`, PostgreSQL und SQLite kennen beide Schreibweisen. `END` ist in SQLite und PostgreSQL ein Synonym für COMMIT.
tasks:
  - id: bestellung-transaktion
    type: terminal
    title: Eine Bestellung als Transaktion
    description: |
      Im Ordner `transaktion` liegt `shop.db`. Tim (Kunde mit der id `6`) bestellt zum ersten Mal.

      1. Schreibe `bestellung.sql`. Die Datei beginnt mit `BEGIN;` und endet mit `COMMIT;`. Dazwischen:
         - Lege die Bestellung mit der id `9` für Kunde `6`, Datum `2026-09-15`, Status `offen` an.
         - Lege zwei Positionen an: 2 × Notizbuch (Produkt `4`, Stückpreis `6.0`) und 1 × Sticker-Set
           (Produkt `7`, Stückpreis `3.0`).
         - Verringere den Lagerbestand beider Produkte um die bestellte Menge.
      2. Führe sie aus: `sqlite3 shop.db < bestellung.sql`.
      3. Schreibe `probe.sql`, die zeigt, dass ROLLBACK wirklich schützt: `BEGIN;`, dann
         `DELETE FROM order_items;`, dann `SELECT COUNT(*) FROM order_items;` und zum Schluss `ROLLBACK;`.
         Führe sie aus – die Ausgabe zeigt `0`, danach sind trotzdem alle Positionen noch da.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: transaktion
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
        run: grep -Eiq '^\s*BEGIN' bestellung.sql && grep -Eiq '^\s*(COMMIT|END)' bestellung.sql && echo ok
        stdout_equals: ok
        message: bestellung.sql soll mit BEGIN; beginnen und mit COMMIT; enden.
      - type: command
        run: sqlite3 shop.db "SELECT customer_id || '|' || order_date || '|' || status FROM orders WHERE id = 9;"
        stdout_equals: 6|2026-09-15|offen
        message: Bestellung 9 fehlt noch oder hat falsche Werte (Kunde 6, Datum 2026-09-15, Status offen). Hast du bestellung.sql ausgeführt?
      - type: command
        run: sqlite3 shop.db "SELECT group_concat(product_id || 'x' || quantity || '@' || unit_price, ' ') FROM (SELECT * FROM order_items WHERE order_id = 9 ORDER BY product_id);"
        stdout_equals: 4x2@6.0 7x1@3.0
        message: Die Positionen von Bestellung 9 stimmen noch nicht. Erwartet werden Produkt 4 mit Menge 2 zu 6.0 und Produkt 7 mit Menge 1 zu 3.0.
      - type: command
        run: sqlite3 shop.db "SELECT group_concat(stock, ' ') FROM (SELECT stock FROM products WHERE id IN (4, 7) ORDER BY id);"
        stdout_equals: 98 149
        message: Der Lagerbestand stimmt noch nicht. Notizbuch soll 98 und Sticker-Set 149 Stück haben. Lief die Datei mehrfach? Dann neu vorbereiten.
      - type: command
        run: grep -Eiq '^\s*BEGIN' probe.sql && grep -Eiq 'ROLLBACK' probe.sql && ! grep -Eiq 'COMMIT' probe.sql && echo ok
        stdout_equals: ok
        message: probe.sql soll mit BEGIN; beginnen, mit ROLLBACK; enden und kein COMMIT enthalten.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX"); cp shop.db "$d/t.db"
          vorher=$(sqlite3 "$d/t.db" "SELECT COUNT(*) FROM order_items;")
          aus=$(sqlite3 "$d/t.db" < probe.sql 2>&1 | tr -d '[:space:]')
          nachher=$(sqlite3 "$d/t.db" "SELECT COUNT(*) FROM order_items;")
          rm -rf "$d"
          [ "$aus" = "0" ] && [ "$vorher" = "$nachher" ] && [ "$vorher" -gt 0 ] && echo ok
        stdout_equals: ok
        message: probe.sql soll innerhalb der Transaktion 0 Positionen anzeigen und danach alles zurückrollen. Prüfe die Reihenfolge – BEGIN, DELETE, SELECT COUNT(*), ROLLBACK.
    hints:
      - "Die Bestellung: `INSERT INTO orders (id, customer_id, order_date, status) VALUES (9, 6, '2026-09-15', 'offen');`"
      - "Lagerbestand: `UPDATE products SET stock = stock - 2 WHERE id = 4;` und ebenso für Produkt 7 mit 1."
      - "Für probe.sql vier Zeilen: `BEGIN;`, `DELETE FROM order_items;`, `SELECT COUNT(*) FROM order_items;`, `ROLLBACK;`."
    solution: |
      ```bash
      cd transaktion
      cat > bestellung.sql <<'SQL'
      BEGIN;
      INSERT INTO orders (id, customer_id, order_date, status) VALUES (9, 6, '2026-09-15', 'offen');
      INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (9, 4, 2, 6.0), (9, 7, 1, 3.0);
      UPDATE products SET stock = stock - 2 WHERE id = 4;
      UPDATE products SET stock = stock - 1 WHERE id = 7;
      COMMIT;
      SQL
      sqlite3 shop.db < bestellung.sql
      cat > probe.sql <<'SQL'
      BEGIN;
      DELETE FROM order_items;
      SELECT COUNT(*) FROM order_items;
      ROLLBACK;
      SQL
      sqlite3 shop.db < probe.sql
      sqlite3 shop.db "SELECT COUNT(*) FROM order_items;"
      ```
  - id: psql-rettung
    type: simulated
    title: Rettung per ROLLBACK auf dem Server
    description: |
      Du bist per Terminal mit der PostgreSQL-Datenbank einer Staging-Umgebung verbunden (simuliert). Der Hoodie
      soll im Preis auf 35 sinken. Arbeite vorsichtig in einer Transaktion:

      1. Verbinde dich mit `psql -h db.example.com -U shop shop`.
      2. Starte eine Transaktion mit `BEGIN;`.
      3. Dir rutscht ein UPDATE ohne WHERE heraus: `UPDATE products SET price = 35;`
      4. Die Ausgabe meldet viel zu viele Zeilen – nimm alles mit `ROLLBACK;` zurück.
      5. Beende psql mit `\q`.
    prompt: "du@laptop:~$"
    steps:
      - expect: "^psql\\s+-h\\s+db\\.example\\.com\\s+-U\\s+shop\\s+shop$"
        output: |
          psql (18.0)
          Type "help" for help.
        prompt: "shop=>"
        hint: "Tippe psql -h db.example.com -U shop shop"
      - expect: "^(BEGIN|begin)( TRANSACTION| transaction)?;$"
        output: BEGIN
        prompt: "shop=*>"
        hint: "Tippe BEGIN; – das Sternchen im Prompt zeigt danach an, dass eine Transaktion offen ist."
      - expect: "^(UPDATE|update)\\s+products\\s+(SET|set)\\s+price\\s*=\\s*35;$"
        output: UPDATE 7
        prompt: "shop=*>"
        hint: "Tippe genau UPDATE products SET price = 35;"
      - expect: "^(ROLLBACK|rollback);$"
        output: ROLLBACK
        prompt: "shop=>"
        hint: "UPDATE 7 heißt: alle sieben Produkte wurden geändert. Tippe ROLLBACK;"
      - expect: "^\\\\q$"
        output: ""
        prompt: "du@laptop:~$"
        hint: "Mit \\q verlässt du psql."
    responses:
      - match: "^(COMMIT|commit);"
        output: "Halt! Mit COMMIT wären alle Preise dauerhaft 35. Nimm lieber ROLLBACK;"
---

Eine Bestellung im Shop besteht aus drei Schritten: Bestellung anlegen, Positionen einfügen, Lagerbestand
senken. Stürzt der Server nach dem zweiten Schritt ab, gibt es eine Bestellung, deren Ware nie reserviert
wurde. Eine [[transaktion|Transaktion]] verhindert genau das: Alle Schritte gelten zusammen – oder keiner.

## BEGIN, COMMIT, ROLLBACK

Du klammerst zusammengehörige Änderungen ein:

```sql title="Eine Bestellung als Transaktion"
BEGIN;
INSERT INTO orders (id, customer_id, order_date, status)
VALUES (9, 6, '2026-09-15', 'offen');
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
VALUES (9, 4, 2, 6.0), (9, 7, 1, 3.0);
UPDATE products SET stock = stock - 2 WHERE id = 4;
UPDATE products SET stock = stock - 1 WHERE id = 7;
COMMIT;
```

![Ablauf einer Transaktion von BEGIN über die Anweisungen zu COMMIT oder ROLLBACK](/assets/datenbanken-sql/transaktion-ablauf.svg)

- `BEGIN` startet die Transaktion. Ab jetzt sammelt die Datenbank die Änderungen.
- `COMMIT` speichert alle Änderungen dauerhaft.
- [[rollback|ROLLBACK]] verwirft alle Änderungen seit `BEGIN`.

Bricht die Verbindung vor dem `COMMIT` ab, rollt die Datenbank automatisch zurück. Innerhalb der
Transaktion siehst du deine eigenen Änderungen schon – andere Verbindungen noch nicht.

## ACID in einfachen Worten

Relationale Datenbanken geben für Transaktionen vier Garantien, zusammen [[acid|ACID]]:

| Eigenschaft | Bedeutung | Beispiel |
|---|---|---|
| **A**tomicity | ganz oder gar nicht | keine Bestellung ohne Lagerbuchung |
| **C**onsistency | danach gelten alle Regeln | ein `CHECK (stock >= 0)` verhindert negative Bestände |
| **I**solation | parallele Transaktionen stören sich nicht | zwei Käufe des letzten Rucksacks verkaufen ihn nicht doppelt |
| **D**urability | nach COMMIT dauerhaft | auch ein Stromausfall löscht nichts mehr |

Wie streng die Isolation ist, lässt sich über die [[isolationsebene|Isolationsebene]] einstellen. Für den
Einstieg genügt: Die Standardeinstellung der großen Datenbanken ist für normale Web-Anwendungen gut gewählt.

> [!MERKSATZ]
> Gehören mehrere Änderungen fachlich zusammen, gehören sie in **eine** Transaktion. Bis zum COMMIT ist
> nichts endgültig.

## Auto-Commit und Fehler

Ohne `BEGIN` ist jede einzelne Anweisung ihre eigene kleine Transaktion – das heißt
[[auto-commit|Auto-Commit]]. Ein einzelnes `UPDATE` ist also schon atomar. Erst wenn **mehrere** Anweisungen
zusammengehören, brauchst du ein ausdrückliches `BEGIN`.

Schlägt mitten in einer Transaktion eine Anweisung fehl, etwa wegen eines Constraints, entscheidest du: Fehler
beheben und weitermachen oder `ROLLBACK`. PostgreSQL ist hier streng. Nach einem Fehler akzeptiert es in
dieser Transaktion nur noch `ROLLBACK`.

> [!FEHLER]
> **Eine Transaktion offen lassen.** Wer `BEGIN` tippt und in die Mittagspause geht, hält womöglich Sperren
> ([[sperre|Locks]]). Andere Verbindungen warten dann auf deine Zeilen. Halte Transaktionen kurz und schließe
> sie immer mit COMMIT oder ROLLBACK.

## Transaktionen in Anwendungen

In echten Anwendungen tippt niemand `BEGIN`. Das Programm öffnet die Transaktion, führt die Schritte aus und
entscheidet am Ende:

```php title="Schematisch in PHP mit PDO"
$pdo->beginTransaction();
try {
    $pdo->prepare('INSERT INTO orders (customer_id, order_date, status) VALUES (?, ?, ?)')
        ->execute([6, '2026-09-15', 'offen']);
    $pdo->prepare('UPDATE products SET stock = stock - ? WHERE id = ?')->execute([2, 4]);
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    throw $e;
}
```

Frameworks bieten dafür Hilfsfunktionen, die genau dieses Muster kapseln: Läuft alles durch, folgt COMMIT,
fliegt eine Exception, folgt ROLLBACK.

> [!PRAXIS]
> Bei Korrekturen direkt auf einer Server-Datenbank startest du mit `BEGIN`, führst die Änderung aus und
> liest die gemeldete Zeilenzahl, etwa `UPDATE 1`. Erst wenn sie stimmt, folgt `COMMIT`.

## Zusammenfassung

- Eine Transaktion bündelt mehrere Änderungen: `BEGIN` … `COMMIT` oder `ROLLBACK`.
- Vor dem COMMIT ist nichts dauerhaft; bei Absturz rollt die Datenbank zurück.
- ACID: Atomarität, Konsistenz, Isolation, Dauerhaftigkeit.
- Ohne BEGIN gilt Auto-Commit – jede Anweisung ist ihre eigene Transaktion.
- Transaktionen kurz halten und immer abschließen, sonst blockieren Sperren andere.
- In Anwendungen: beginTransaction, bei Erfolg commit, bei Exception rollBack.
