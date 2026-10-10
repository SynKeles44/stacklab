---
title: Tabellen anlegen – Datentypen und Constraints
summary: Mit CREATE TABLE Tabellen anlegen, passende Datentypen wählen und die Datenbank mit NOT NULL, UNIQUE, CHECK, DEFAULT und Fremdschlüsseln samt ON DELETE über die Datenqualität wachen lassen.
duration: 25
sources:
  - title: SQLite – CREATE TABLE
    url: https://sqlite.org/lang_createtable.html
  - title: SQLite – Datatypes In SQLite (Type Affinity)
    url: https://sqlite.org/datatype3.html
  - title: SQLite – Foreign Key Support (PRAGMA foreign_keys)
    url: https://sqlite.org/foreignkeys.html
  - title: SQLite – STRICT Tables
    url: https://sqlite.org/stricttables.html
  - title: PostgreSQL – Constraints
    url: https://www.postgresql.org/docs/current/ddl-constraints.html
  - title: PostgreSQL – Identity Columns
    url: https://www.postgresql.org/docs/current/ddl-identity-columns.html
quiz:
  - type: single
    question: Du löschst einen Kunden. Seine Bestellungen sollen dabei automatisch mitgelöscht werden. Welche Regel gehört an `orders.customer_id`?
    options:
      - "`ON DELETE SET NULL`"
      - "`ON DELETE CASCADE`"
      - "`ON DELETE RESTRICT`"
      - "`DEFAULT NULL`"
    answer: 1
    explanation: >
      CASCADE gibt das Löschen an abhängige Zeilen weiter. SET NULL würde die Bestellungen behalten und den
      Verweis leeren, RESTRICT würde das Löschen verbieten, solange Bestellungen existieren.
  - type: match
    question: Ordne jedem Constraint seine Wirkung zu.
    pairs:
      - { left: "NOT NULL", right: "Die Spalte muss immer einen Wert haben" }
      - { left: "UNIQUE", right: "Kein Wert darf in zwei Zeilen vorkommen" }
      - { left: "CHECK (rating BETWEEN 1 AND 5)", right: "Nur Werte, die die Bedingung erfüllen" }
      - { left: "DEFAULT 0", right: "Wert, der eingesetzt wird, wenn keiner angegeben ist" }
    explanation: Constraints sind Regeln, die die Datenbank bei jedem INSERT und UPDATE selbst prüft – egal, welches Programm schreibt.
  - type: find-bug
    question: In SQLite wurde `orders.customer_id` mit `REFERENCES customers(id)` angelegt. Trotzdem klappt der INSERT mit einer Kunden-ID, die es nicht gibt. Welche Zeile fehlt bzw. ist falsch?
    language: sql
    code: |
      PRAGMA foreign_keys = OFF;
      INSERT INTO orders (customer_id, order_date, status)
      VALUES (999, '2026-09-01', 'offen');
      SELECT COUNT(*) FROM orders WHERE customer_id = 999;
    bug_line: 1
    explanation: >
      SQLite prüft Fremdschlüssel nur, wenn `PRAGMA foreign_keys = ON;` für die Verbindung gesetzt ist. Standard
      ist aus. PostgreSQL und MySQL (InnoDB) prüfen Fremdschlüssel immer.
  - type: cloze
    text: "In PostgreSQL legst du eine automatisch hochzählende id mit `id integer GENERATED ALWAYS AS ___ PRIMARY KEY` an, in MySQL mit `id INT ___ PRIMARY KEY`."
    blanks:
      - [IDENTITY]
      - [AUTO_INCREMENT]
    explanation: SQLite braucht dafür nichts Zusätzliches – eine Spalte `INTEGER PRIMARY KEY` bekommt automatisch die nächste freie Nummer.
tasks:
  - id: reviews-tabelle
    type: terminal
    title: Eine Tabelle für Bewertungen
    description: |
      Der Shop möchte Produktbewertungen speichern. Im Ordner `bewertungen` liegt `shop.db`.

      1. Schreibe in `schema.sql` eine `CREATE TABLE`-Anweisung für die Tabelle `reviews` mit diesen Spalten:

         | Spalte | Regeln |
         |---|---|
         | `id` | `INTEGER PRIMARY KEY` |
         | `product_id` | Pflichtfeld, Fremdschlüssel auf `products(id)`; wird ein Produkt gelöscht, verschwinden seine Bewertungen mit |
         | `customer_id` | darf leer sein, Fremdschlüssel auf `customers(id)`; wird der Kunde gelöscht, bleibt die Bewertung, der Verweis wird leer |
         | `rating` | Pflichtfeld, ganze Zahl von 1 bis 5 |
         | `comment` | Text, darf leer sein |
         | `created_at` | Pflichtfeld, Standardwert `CURRENT_TIMESTAMP` |

      2. Führe die Datei aus: `sqlite3 shop.db < schema.sql`.
      3. Prüfe mit `sqlite3 shop.db ".schema reviews"` und mit
         `sqlite3 shop.db "PRAGMA foreign_key_list(reviews);"`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: bewertungen
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
        path: schema.sql
        pattern: "(CREATE|create|Create)\\s+(TABLE|table|Table)\\s+(IF NOT EXISTS\\s+|if not exists\\s+)?\"?reviews"
        message: In schema.sql fehlt noch die Anweisung CREATE TABLE reviews.
      - type: command
        run: sqlite3 shop.db "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'reviews';"
        stdout_equals: reviews
        message: Die Tabelle reviews existiert noch nicht in shop.db. Führe sqlite3 shop.db < schema.sql aus.
      - type: command
        run: sqlite3 shop.db "SELECT name FROM pragma_table_info('reviews') ORDER BY name;" | tr '\n' ' '
        stdout_matches: "^comment created_at customer_id id product_id rating\\s*$"
        message: reviews soll genau die Spalten id, product_id, customer_id, rating, comment und created_at haben.
      - type: command
        run: sqlite3 shop.db "SELECT name FROM pragma_table_info('reviews') WHERE \"notnull\" = 1 OR pk = 1 ORDER BY name;" | tr '\n' ' '
        stdout_matches: "^created_at id product_id rating\\s*$"
        message: NOT NULL stimmt noch nicht. product_id, rating und created_at sind Pflichtfelder, customer_id und comment dürfen leer sein.
      - type: command
        run: sqlite3 shop.db "SELECT \"table\" || ':' || \"from\" || ':' || on_delete FROM pragma_foreign_key_list('reviews') ORDER BY \"from\";" | tr '\n' ' '
        stdout_matches: "^customers:customer_id:SET NULL products:product_id:CASCADE\\s*$"
        message: Die Fremdschlüssel stimmen noch nicht. customer_id zeigt mit ON DELETE SET NULL auf customers, product_id mit ON DELETE CASCADE auf products.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX"); cp shop.db "$d/t.db"
          if sqlite3 "$d/t.db" "INSERT INTO reviews (product_id, rating) VALUES (1, 6);" 2>/dev/null; then echo zu-viel; elif sqlite3 "$d/t.db" "INSERT INTO reviews (product_id, rating) VALUES (1, 0);" 2>/dev/null; then echo zu-wenig; else echo ok; fi
          rm -rf "$d"
        stdout_equals: ok
        message: rating akzeptiert noch Werte außerhalb von 1 bis 5. Ergänze CHECK (rating BETWEEN 1 AND 5).
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX"); cp shop.db "$d/t.db"
          sqlite3 "$d/t.db" "INSERT INTO reviews (product_id, rating) VALUES (2, 4); SELECT created_at IS NOT NULL FROM reviews WHERE product_id = 2;" 2>&1
          rm -rf "$d"
        stdout_equals: "1"
        message: created_at wird ohne Angabe nicht automatisch gefüllt. Ergänze DEFAULT CURRENT_TIMESTAMP.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX"); cp shop.db "$d/t.db"
          sqlite3 "$d/t.db" "PRAGMA foreign_keys = ON; INSERT INTO reviews (product_id, customer_id, rating) VALUES (7, 6, 5), (1, 6, 3); DELETE FROM products WHERE id = 7; DELETE FROM customers WHERE id = 6; SELECT COUNT(*) || '/' || SUM(customer_id IS NULL) FROM reviews;" 2>&1
          rm -rf "$d"
        stdout_equals: 1/1
        message: Das Löschverhalten stimmt noch nicht. Beim Löschen eines Produkts sollen seine Bewertungen verschwinden (CASCADE), beim Löschen eines Kunden soll customer_id NULL werden (SET NULL).
    hints:
      - "Gerüst: `CREATE TABLE reviews ( id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE …, … );` – zwischen den Spalten steht ein Komma, nach der letzten nicht."
      - "Die Regeln heißen `NOT NULL`, `CHECK (rating BETWEEN 1 AND 5)`, `DEFAULT CURRENT_TIMESTAMP`, `ON DELETE CASCADE` und `ON DELETE SET NULL`."
      - "Hast du dich vertippt und die Tabelle existiert schon falsch? `sqlite3 shop.db \"DROP TABLE reviews;\"`, dann schema.sql korrigieren und erneut ausführen."
    solution: |
      ```bash
      cd bewertungen
      cat > schema.sql <<'SQL'
      CREATE TABLE reviews (
        id INTEGER PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      SQL
      sqlite3 shop.db < schema.sql
      sqlite3 shop.db "PRAGMA foreign_key_list(reviews);"
      ```
  - id: constraint-zuordnen
    type: dragdrop
    title: Welcher Constraint setzt die Regel durch?
    description: Ordne jede fachliche Regel dem Constraint zu, mit dem die Datenbank sie erzwingt.
    targets:
      - { id: notnull, label: NOT NULL }
      - { id: unique, label: UNIQUE }
      - { id: check, label: CHECK }
      - { id: default, label: DEFAULT }
      - { id: fk, label: FOREIGN KEY }
    items:
      - { label: "Jede Bestellung braucht ein Datum", target: notnull }
      - { label: "Zwei Konten dürfen nicht dieselbe E-Mail-Adresse haben", target: unique }
      - { label: "Die Menge einer Position muss größer als 0 sein", target: check }
      - { label: "Neue Produkte haben ohne Angabe den Lagerbestand 0", target: default }
      - { label: "Eine Bestellung darf nur auf existierende Kunden verweisen", target: fk }
---

Ein Programmierfehler schreibt eine Bestellung mit der Menge `-3` in die Datenbank. Ein anderer legt zwei
Konten mit derselben E-Mail an. Prüft nur der Anwendungscode, rutschen solche Fehler früher oder später
durch. Besser: Die Datenbank selbst kennt die Regeln und lehnt ungültige Daten ab. Dafür gibt es
[[constraint|Constraints]].

## CREATE TABLE und Datentypen

Eine Tabelle legst du mit `CREATE TABLE` an – eine Anweisung der [[ddl|DDL]] (Data Definition Language).

```sql title="Eine Tabelle anlegen"
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0
);
```

Jede Spalte bekommt einen Datentyp. Die Namen unterscheiden sich je nach System:

| Inhalt | PostgreSQL | MySQL | SQLite |
|---|---|---|---|
| ganze Zahl | `integer`, `bigint` | `INT`, `BIGINT` | `INTEGER` |
| Geldbetrag | `numeric(10,2)` | `DECIMAL(10,2)` | `REAL` oder Cent als `INTEGER` |
| Text | `text`, `varchar(255)` | `VARCHAR(255)`, `TEXT` | `TEXT` |
| Wahrheitswert | `boolean` | `BOOLEAN` (= `TINYINT(1)`) | `INTEGER` 0/1 |
| Datum/Zeit | `date`, `timestamptz` | `DATE`, `DATETIME` | `TEXT` im ISO-Format |

SQLite ist hier locker: Es kennt nur eine [[typaffinitaet|Typaffinität]] und speichert notfalls auch Text in
einer `INTEGER`-Spalte. Mit `CREATE TABLE … STRICT` erzwingst du echte Typen.

## Automatische IDs

Für künstliche Schlüssel soll die Datenbank die nächste Nummer selbst vergeben:

```sql title="Automatisch hochzählende id"
-- SQLite: INTEGER PRIMARY KEY genügt
CREATE TABLE tags (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
-- PostgreSQL
CREATE TABLE tags (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name text NOT NULL);
-- MySQL / MariaDB
CREATE TABLE tags (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL);
```

In SQLite wird eine `INTEGER PRIMARY KEY`-Spalte zum Alias der internen [[rowid|rowid]] und erhält beim
Einfügen ohne Wert automatisch die nächste Zahl. Das Schlüsselwort [[autoincrement|AUTOINCREMENT]] brauchst du
dafür nicht; es verhindert nur, dass Nummern gelöschter Zeilen wiederverwendet werden.

## Constraints: Regeln in der Datenbank

| Constraint | Wirkung | Beispiel |
|---|---|---|
| [[not-null|NOT NULL]] | Wert ist Pflicht | `name TEXT NOT NULL` |
| [[unique-constraint|UNIQUE]] | keine Duplikate | `email TEXT NOT NULL UNIQUE` |
| [[check-constraint|CHECK]] | Bedingung muss gelten | `CHECK (quantity > 0)` |
| [[default-wert|DEFAULT]] | Ersatzwert ohne Angabe | `stock INTEGER DEFAULT 0` |
| `PRIMARY KEY` | eindeutig und Pflicht | `id INTEGER PRIMARY KEY` |

Verstößt ein `INSERT` oder `UPDATE` gegen eine Regel, bricht die Datenbank die Anweisung ab:

```text title="sqlite3"
sqlite> INSERT INTO products (name, category, price) VALUES ('Mütze', 'Kleidung', -5);
Runtime error: CHECK constraint failed: price >= 0 (19)
```

> [!MERKSATZ]
> Validierung im Code ist für freundliche Fehlermeldungen da. Constraints in der Datenbank sind die letzte
> Verteidigungslinie – sie gelten für jedes Programm und jedes Skript.

## Fremdschlüssel und ON DELETE

Ein Fremdschlüssel sichert die [[referentielle-integritaet|referentielle Integrität]]: Jeder Verweis zeigt
auf eine existierende Zeile. Spannend wird es beim Löschen. Was passiert mit Bestellpositionen, wenn ihre
Bestellung gelöscht wird?

| Regel | Beim Löschen der Elternzeile |
|---|---|
| `ON DELETE CASCADE` | abhängige Zeilen werden mitgelöscht |
| `ON DELETE SET NULL` | Verweis wird NULL, die Zeile bleibt |
| `ON DELETE RESTRICT` / Standard | Löschen wird verweigert, solange Verweise existieren |

```sql title="Positionen hängen an ihrer Bestellung"
order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE
```

> [!FEHLER]
> **SQLite prüft Fremdschlüssel nicht automatisch.** Ohne `PRAGMA foreign_keys = ON;` am Anfang jeder
> Verbindung ignoriert SQLite alle `REFERENCES` – auch `CASCADE`. PostgreSQL und MySQL mit InnoDB prüfen
> immer.

## Schema nachträglich ändern

Tabellen ändern sich mit dem Projekt. Die wichtigsten Befehle:

```sql title="Schema ändern"
ALTER TABLE customers ADD COLUMN phone TEXT;
ALTER TABLE customers RENAME COLUMN phone TO phone_number;
DROP TABLE IF EXISTS reviews;
```

`DROP TABLE` löscht Struktur **und** Daten unwiderruflich. SQLite kann mit `ALTER TABLE` nur wenig – etwa
keine Constraints nachträglich hinzufügen. Dann legt man eine neue Tabelle an und kopiert die Daten um.

> [!PRAXIS]
> Im Team ändert niemand das Schema der Produktionsdatenbank von Hand. Jede Änderung wird als
> [[migration|Migration]] versioniert – dazu mehr im letzten Modul.

## Zusammenfassung

- `CREATE TABLE` legt Spalten mit Datentypen an; die Typnamen unterscheiden sich je System.
- SQLite nutzt Typaffinität; `STRICT` erzwingt echte Typen.
- `INTEGER PRIMARY KEY` (SQLite), `GENERATED ALWAYS AS IDENTITY` (PostgreSQL), `AUTO_INCREMENT` (MySQL) vergeben IDs.
- NOT NULL, UNIQUE, CHECK und DEFAULT lassen die Datenbank selbst über die Daten wachen.
- `ON DELETE CASCADE` löscht mit, `SET NULL` leert den Verweis, `RESTRICT` verbietet das Löschen.
- In SQLite gelten Fremdschlüssel nur mit `PRAGMA foreign_keys = ON;`.
