---
title: Was ist eine relationale Datenbank?
summary: Tabellen, Zeilen, Spalten und Schema verstehen, die wichtigsten Datenbanksysteme einordnen und die Shop-Datenbank mit sqlite3 zum ersten Mal öffnen.
duration: 20
sources:
  - title: SQLite – Command Line Shell (sqlite3)
    url: https://sqlite.org/cli.html
  - title: SQLite – Appropriate Uses For SQLite
    url: https://sqlite.org/whentouse.html
  - title: PostgreSQL – Tutorial, Concepts
    url: https://www.postgresql.org/docs/current/tutorial-concepts.html
  - title: MySQL 8.4 Reference Manual – What is MySQL?
    url: https://dev.mysql.com/doc/refman/8.4/en/what-is-mysql.html
  - title: MariaDB – About MariaDB Server
    url: https://mariadb.org/about/
quiz:
  - type: single
    question: Was beschreibt das Schema einer Datenbank?
    options:
      - Alle gespeicherten Datensätze.
      - Die Struktur – welche Tabellen es gibt, welche Spalten sie haben und welche Regeln gelten.
      - Das Passwort, mit dem man sich verbindet.
      - Die Reihenfolge, in der Zeilen gespeichert werden.
    answer: 1
    explanation: >
      Das Schema ist der Bauplan: Tabellen, Spalten, Datentypen und Regeln. Die eigentlichen Daten sind die
      Zeilen in diesen Tabellen.
  - type: match
    question: Ordne jedem Begriff seine Bedeutung zu.
    pairs:
      - { left: Tabelle, right: "Sammlung gleichartiger Datensätze, z. B. alle Kunden" }
      - { left: Zeile, right: "Ein einzelner Datensatz, z. B. eine Kundin" }
      - { left: Spalte, right: "Eine Eigenschaft mit festem Datentyp, z. B. email" }
      - { left: Primärschlüssel, right: "Spalte, die jede Zeile eindeutig kennzeichnet" }
    explanation: Eine Tabelle besteht aus Spalten (Struktur) und Zeilen (Daten). Der Primärschlüssel macht jede Zeile eindeutig ansprechbar.
  - type: multiple
    question: Welche Aussagen über SQLite stimmen?
    options:
      - Die ganze Datenbank liegt in einer einzigen Datei.
      - SQLite braucht einen eigenen Server-Dienst, der im Hintergrund läuft.
      - SQLite eignet sich gut für Tests, Prototypen und Apps auf einem Gerät.
      - SQLite spricht SQL.
    answers: [0, 2, 3]
    explanation: >
      SQLite ist eine Bibliothek, die direkt im Programm läuft und in eine Datei schreibt – ohne Server.
      PostgreSQL und MySQL dagegen laufen als eigener Dienst, mit dem sich Programme über das Netzwerk verbinden.
  - type: cloze
    text: "Im Programm `sqlite3` zeigt der Punkt-Befehl `.___` alle Tabellen, `.___` die CREATE-Anweisungen. Eine SQL-Datei führst du mit `sqlite3 shop.db ___ abfrage.sql` aus."
    blanks:
      - [tables]
      - [schema]
      - ["<"]
    explanation: >
      Punkt-Befehle steuern das Programm `sqlite3` selbst und sind kein SQL. Mit `<` leitest du den Inhalt einer
      Datei auf die Standardeingabe um – sqlite3 führt dann jede Anweisung darin aus.
tasks:
  - id: shop-erkunden
    type: terminal
    title: Die Shop-Datenbank erkunden
    description: |
      Im Ordner `shop-erkunden` liegt `shop.db`, die SQLite-Datenbank eines kleinen Online-Shops. Schau sie dir
      mit `sqlite3` an und halte deine Funde in Dateien fest:

      1. Speichere die Liste aller Tabellen in `tabellen.txt`:
         `sqlite3 shop.db ".tables" > tabellen.txt`
      2. Speichere das Schema der Tabelle `products` in `schema-products.txt` (Punkt-Befehl `.schema products`).
      3. Lege die Datei `kunden.sql` an. Sie soll eine SQL-Abfrage enthalten, die **alle Spalten aller Kunden**
         aus der Tabelle `customers` liest. Teste sie mit `sqlite3 shop.db < kunden.sql`.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit `shop.db` angelegt wird.
    workdir: shop-erkunden
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
      - type: file_exists
        path: tabellen.txt
        message: Die Datei tabellen.txt fehlt noch. Leite die Ausgabe von .tables mit > in die Datei um.
      - type: command
        run: for t in customers orders order_items products; do grep -qw "$t" tabellen.txt || exit 1; done; echo ok
        stdout_equals: ok
        message: In tabellen.txt fehlen Tabellennamen. Erwartet werden customers, order_items, orders und products.
      - type: file_contains
        path: schema-products.txt
        pattern: "CREATE TABLE products"
        message: In schema-products.txt steht noch nicht die CREATE-TABLE-Anweisung von products. Nutze sqlite3 shop.db ".schema products".
      - type: file_exists
        path: kunden.sql
        message: Die Datei kunden.sql fehlt noch.
      - type: command
        run: |
          ist=$(sqlite3 shop.db < kunden.sql 2>&1)
          soll=$(sqlite3 shop.db "SELECT * FROM customers;")
          [ "$ist" = "$soll" ] && echo ok
        stdout_equals: ok
        message: kunden.sql liefert noch nicht alle Spalten aller Kunden. Erwartet wird SELECT * FROM customers; – prüfe Tippfehler und das Semikolon.
    hints:
      - "Punkt-Befehle wie `.tables` kannst du direkt als Argument übergeben: `sqlite3 shop.db \".tables\"`."
      - "Mit `>` schreibst du die Ausgabe eines Befehls in eine Datei, z. B. `sqlite3 shop.db \".schema products\" > schema-products.txt`."
      - "Für kunden.sql: `echo 'SELECT * FROM customers;' > kunden.sql`, dann `sqlite3 shop.db < kunden.sql`."
    solution: |
      ```bash
      cd shop-erkunden
      sqlite3 shop.db ".tables" > tabellen.txt
      sqlite3 shop.db ".schema products" > schema-products.txt
      echo 'SELECT * FROM customers;' > kunden.sql
      sqlite3 shop.db < kunden.sql
      ```
  - id: dbms-waehlen
    type: dragdrop
    title: Welches Datenbanksystem passt?
    description: Ordne jede Situation dem Datenbanksystem zu, das dafür typischerweise gewählt wird.
    targets:
      - { id: sqlite, label: SQLite }
      - { id: postgres, label: PostgreSQL }
      - { id: mysql, label: MySQL / MariaDB }
    items:
      - { label: "Eine Notiz-App speichert Daten lokal auf dem Smartphone", target: sqlite }
      - { label: "Automatische Tests sollen eine Wegwerf-Datenbank in einer Datei nutzen", target: sqlite }
      - { label: "Eine neue Web-Plattform braucht viele gleichzeitige Schreibzugriffe und JSON-Abfragen", target: postgres }
      - { label: "Ein Team will strenge Standardtreue und umfangreiche Datentypen wie Arrays", target: postgres }
      - { label: "Ein günstiges PHP-Webhosting bietet nur diese Datenbank an", target: mysql }
      - { label: "Eine bestehende Anwendung nutzt seit Jahren AUTO_INCREMENT und Backticks im SQL", target: mysql }
---

Stell dir vor, ein kleiner Online-Shop verwaltet alles in einer Tabellenkalkulation: Kunden, Bestellungen,
Produkte. Bald wird es eng. Zwei Leute ändern gleichzeitig dieselbe Datei, ein Tippfehler im Kundennamen
taucht in zwanzig Bestellungen auf, und die Frage „Wie viel Umsatz hat Berlin im Mai gemacht?“ kostet eine
Stunde. Genau dafür gibt es [[relationale-datenbank|relationale Datenbanken]].

## Warum überhaupt eine Datenbank?

Eine [[datenbank|Datenbank]] speichert Daten dauerhaft und strukturiert – und beantwortet Fragen dazu
schnell. Im Vergleich zu Dateien oder Tabellenkalkulationen bringt sie vier Dinge mit:

| Problem mit Dateien | Lösung der Datenbank |
|---|---|
| Zwei Programme schreiben gleichzeitig und überschreiben sich | Sie koordiniert gleichzeitige Zugriffe |
| Ein Absturz mitten im Speichern hinterlässt halbe Daten | Änderungen gelten ganz oder gar nicht |
| Jeder darf alles eintragen, auch Unsinn | Regeln verhindern ungültige Werte |
| Fragen beantworten heißt selbst suchen und rechnen | Eine Abfrage in [[sql|SQL]] erledigt das |

SQL steht für „Structured Query Language“. Damit beschreibst du, **was** du wissen willst, nicht **wie** die
Datenbank es findet. Das „Wie“ plant die Datenbank selbst.

> [!MERKSATZ]
> Eine Datenbank ist mehr als ein Speicherort: Sie sorgt dafür, dass Daten gültig bleiben, auch wenn viele
> Programme gleichzeitig lesen und schreiben.

## Tabellen, Zeilen, Spalten, Schema

„Relational“ heißt: Die Daten liegen in [[tabelle|Tabellen]], und Tabellen stehen über gemeinsame Werte in
Beziehung zueinander. Jede Tabelle hat feste [[spalte|Spalten]] und beliebig viele Zeilen.

![Aufbau der Tabelle customers mit Spalten, Zeilen, Primärschlüssel und NULL](/assets/datenbanken-sql/tabelle-aufbau.svg)

- Eine **Spalte** hat einen Namen und einen [[datentyp|Datentyp]], etwa `email` als Text.
- Eine **Zeile** ist ein [[datensatz|Datensatz]], also eine Kundin mit all ihren Werten.
- Der [[primaerschluessel|Primärschlüssel]] (hier `id`) kennzeichnet jede Zeile eindeutig.
- `NULL` heißt „Wert unbekannt“ – nicht 0 und nicht leerer Text. Dazu später mehr.

Das [[datenbank-schema|Schema]] ist der Bauplan: welche Tabellen, welche Spalten, welche Regeln. Unser
Beispiel-Shop hat vier Tabellen: `customers`, `products`, `orders` und `order_items`.

## Das Datenbanksystem: wer die Arbeit macht

Die Software, die Tabellen verwaltet und SQL ausführt, heißt [[rdbms|relationales
Datenbankmanagementsystem (RDBMS)]]. Es gibt zwei Bauarten: Server-Datenbanken laufen als eigener
[[dienst|Dienst]], und Programme verbinden sich über das Netzwerk. Eingebettete Datenbanken laufen direkt im
Programm und schreiben in eine Datei.

| System | Bauart | Typischer Einsatz |
|---|---|---|
| [[postgresql|PostgreSQL]] 18 | Server | große Web-Anwendungen, strenge Standardtreue, viele Datentypen (JSON, Arrays) |
| [[mysql|MySQL]] 8.4 / 9 | Server | sehr verbreitet bei PHP-Hosting, viele bestehende Anwendungen |
| [[mariadb|MariaDB]] | Server | Abspaltung von MySQL, weitgehend kompatibel, in vielen Linux-Distributionen Standard |
| [[sqlite|SQLite]] | eingebettet | Apps auf einem Gerät, Tests, Prototypen, Werkzeuge |

Alle vier sprechen SQL, jeweils mit eigenen Eigenheiten. Was du hier lernst, gilt fast überall gleich.

> [!PRAXIS]
> Viele Teams nutzen in der Produktion PostgreSQL oder MySQL, aber SQLite für automatische Tests – weil es
> keine Installation braucht und eine Test-Datenbank einfach eine Datei ist.

## Erste Schritte mit sqlite3

Im Übungs-Terminal ist das Kommandozeilenprogramm [[sqlite3-shell|sqlite3]] installiert. Du öffnest damit
eine Datenbank-Datei und tippst SQL oder [[punkt-befehl|Punkt-Befehle]], die das Programm selbst steuern.

```bash title="Interaktiv arbeiten"
sqlite3 shop.db
sqlite> .tables
customers    order_items  orders       products
sqlite> .headers on
sqlite> .mode column
sqlite> SELECT * FROM products LIMIT 2;
id  name     category  price  stock
--  -------  --------  -----  -----
1   Tasse    Küche     8.5    40
2   T-Shirt  Kleidung  19.5   25
sqlite> .quit
```

| Befehl | Wirkung |
|---|---|
| `.tables` | alle Tabellen auflisten |
| `.schema products` | die `CREATE TABLE`-Anweisung anzeigen |
| `.headers on` / `.mode column` | Spaltennamen zeigen, Ausgabe ausrichten |
| `.quit` | sqlite3 beenden |

Ohne `.mode` gibt sqlite3 jede Zeile als Werte mit `|` dazwischen aus. Für die Aufgaben schreibst du SQL in
eine Datei und leitest sie hinein:

```bash title="Eine SQL-Datei ausführen"
echo 'SELECT name, price FROM products;' > abfrage.sql
sqlite3 shop.db < abfrage.sql
Tasse|8.5
T-Shirt|19.5
```

> [!FEHLER]
> **Das Semikolon vergessen.** Interaktiv wartet sqlite3 dann mit `...>` auf mehr Eingabe. Jede
> SQL-Anweisung endet mit `;`. Punkt-Befehle dagegen haben **kein** Semikolon und stehen allein in einer Zeile.

## Zusammenfassung

- Eine relationale Datenbank speichert Daten in Tabellen aus Spalten (Struktur) und Zeilen (Datensätze).
- Das Schema ist der Bauplan; der Primärschlüssel macht jede Zeile eindeutig.
- Ein RDBMS führt SQL aus: PostgreSQL, MySQL und MariaDB als Server, SQLite eingebettet in einer Datei.
- SQL beschreibt, was du wissen willst – die Datenbank plant selbst, wie sie es findet.
- `sqlite3 shop.db` öffnet die Datenbank; `.tables`, `.schema`, `.headers on`, `.mode column` helfen beim Erkunden.
- `sqlite3 shop.db < datei.sql` führt alle Anweisungen einer Datei aus.
