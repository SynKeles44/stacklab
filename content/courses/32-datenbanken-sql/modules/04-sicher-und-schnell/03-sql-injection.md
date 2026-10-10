---
title: SQL-Injection und Prepared Statements
summary: Verstehen, wie eine einzige zusammengeklebte Abfrage eine ganze Datenbank öffnen kann, und Eingaben mit Prepared Statements und Allowlists zuverlässig von SQL-Befehlen trennen.
duration: 25
sources:
  - title: OWASP – SQL Injection Prevention Cheat Sheet
    url: https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
  - title: OWASP – SQL Injection
    url: https://owasp.org/www-community/attacks/SQL_Injection
  - title: PHP Manual – Prepared statements and stored procedures (PDO)
    url: https://www.php.net/manual/en/pdo.prepared-statements.php
  - title: SQLite – Binding Values To Prepared Statements
    url: https://sqlite.org/c3ref/bind_blob.html
  - title: PostgreSQL – PREPARE
    url: https://www.postgresql.org/docs/current/sql-prepare.html
quiz:
  - type: single
    question: "Eine Anwendung baut `\"SELECT * FROM customers WHERE email = '\" + eingabe + \"'\"`. Jemand gibt `x' OR '1'='1` ein. Was passiert?"
    options:
      - Die Abfrage findet keinen Kunden, weil es diese E-Mail nicht gibt.
      - Die Datenbank meldet immer einen Fehler.
      - Die Bedingung wird für jede Zeile wahr, die Abfrage liefert alle Kunden.
      - Die Eingabe wird automatisch maskiert.
    answer: 2
    explanation: >
      Die Eingabe schließt das Anführungszeichen und hängt `OR '1'='1'` an. Die Datenbank sieht eine gültige
      Bedingung, die immer wahr ist – und gibt alle Kunden zurück.
  - type: multiple
    question: Welche Maßnahmen schützen zuverlässig vor SQL-Injection?
    options:
      - Prepared Statements mit Platzhaltern für alle Werte.
      - Eine Allowlist für Spaltennamen in ORDER BY.
      - Anführungszeichen per Suchen-und-Ersetzen aus der Eingabe löschen.
      - Die Eingabe im Browser per JavaScript prüfen.
    answers: [0, 1]
    explanation: >
      Platzhalter trennen Daten und Befehl, Allowlists lassen nur bekannte Bezeichner zu. Selbstgebautes Filtern
      übersieht Sonderfälle, und eine Prüfung im Browser lässt sich einfach umgehen.
  - type: find-bug
    question: In welcher Zeile steckt die Sicherheitslücke?
    language: php
    code: |
      $id = $_GET['id'];
      $stmt = $pdo->prepare('SELECT * FROM orders WHERE customer_id = ?');
      $stmt->execute([$id]);
      $sort = $_GET['sort'];
      $sql = "SELECT * FROM products ORDER BY $sort";
      $rows = $pdo->query($sql)->fetchAll();
    bug_line: 5
    explanation: >
      Die erste Abfrage nutzt korrekt einen Platzhalter. In Zeile 5 landet `sort` aber ungeprüft im SQL-Text.
      Spaltennamen lassen sich nicht als Platzhalter übergeben – hier gehört eine Allowlist hin.
  - type: cloze
    text: "Bei einem ___ Statement schickt die Anwendung zuerst den SQL-Text mit dem Platzhalter `?` und danach getrennt die ___."
    blanks:
      - [Prepared, vorbereiteten]
      - [Werte, Parameter, Daten]
    explanation: Weil Befehl und Daten getrennt ankommen, kann ein Wert nie zu SQL-Code werden.
  - type: single
    question: Warum kannst du `ORDER BY ?` mit einem Platzhalter nicht sinnvoll nutzen?
    options:
      - Weil ORDER BY in Prepared Statements verboten ist.
      - Weil Platzhalter nur für Werte gelten, nicht für Tabellen- oder Spaltennamen.
      - Weil Platzhalter nur Zahlen aufnehmen.
    answer: 1
    explanation: >
      Ein Platzhalter steht immer für einen Wert wie `'Tasse'` oder `42`. `ORDER BY 'price'` würde nach einem
      festen Text sortieren, also gar nicht. Bezeichner prüfst du gegen eine feste Liste erlaubter Namen.
tasks:
  - id: suche-absichern
    type: terminal
    title: Die Produktsuche absichern
    description: |
      Im Ordner `injection` liegen `shop.db` und das kleine [[php|PHP]]-Skript `suche.php`. Es sucht ein Produkt
      nach Namen, den du als Argument übergibst – und klebt ihn dabei direkt in den SQL-Text.

      1. Probiere die normale Suche: `php suche.php Tasse`
      2. Greife an: `php suche.php "x' OR '1'='1"` – du bekommst alle Produkte.
      3. Probiere einen harmlosen Namen mit Apostroph: `php suche.php "O'Brien"` – das Skript stürzt ab.
      4. Baue `suche.php` um: Statt `$pdo->query($sql)` nutzt du `$pdo->prepare(…)` mit dem Platzhalter `?`
         und übergibst den Namen per `execute([$name])`. Die Ausgabe (`name price` pro Zeile) bleibt gleich.

      Bearbeite die Datei mit `nano suche.php`. Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: injection
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
      cat > suche.php <<'PHP'
      <?php
      $pdo = new PDO('sqlite:' . __DIR__ . '/shop.db');
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

      $name = $argv[1] ?? '';

      // UNSICHER: Die Eingabe wird direkt in den SQL-Text geklebt.
      $sql = "SELECT name, price FROM products WHERE name = '" . $name . "'";

      foreach ($pdo->query($sql) as $row) {
          echo $row['name'] . ' ' . $row['price'] . PHP_EOL;
      }
      PHP
    checks:
      - type: command
        run: php suche.php Tasse
        stdout_matches: "^Tasse 8\\.5\\s*$"
        message: "`php suche.php Tasse` soll genau eine Zeile „Tasse 8.5“ ausgeben. Prüfe Abfrage und Ausgabe."
      - type: command
        run: php suche.php "x' OR '1'='1" | wc -l
        stdout_matches: "^\\s*0\\s*$"
        message: Der Angriff mit x' OR '1'='1 liefert noch Produkte. Der Name muss als Parameter übergeben werden, nicht in den SQL-Text.
      - type: command
        run: php suche.php "O'Brien" > /dev/null 2>&1 && echo ok
        stdout_equals: ok
        message: Ein Name mit Apostroph wie O'Brien lässt das Skript noch abstürzen. Nutze prepare() mit ? und execute([$name]).
      - type: file_contains
        path: suche.php
        pattern: "prepare\\("
        message: suche.php soll die Abfrage mit $pdo->prepare(…) vorbereiten.
    hints:
      - "Ersetze `'\" . $name . \"'` im SQL-Text durch ein einzelnes `?` – ohne Anführungszeichen drumherum."
      - "Danach: `$stmt = $pdo->prepare($sql);` und `$stmt->execute([$name]);`. Die Schleife läuft dann über `$stmt`."
      - "Fertige Zeilen: `$stmt = $pdo->prepare('SELECT name, price FROM products WHERE name = ?'); $stmt->execute([$name]); foreach ($stmt as $row) { … }`"
    solution: |
      ```php
      <?php
      $pdo = new PDO('sqlite:' . __DIR__ . '/shop.db');
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

      $name = $argv[1] ?? '';

      $stmt = $pdo->prepare('SELECT name, price FROM products WHERE name = ?');
      $stmt->execute([$name]);

      foreach ($stmt as $row) {
          echo $row['name'] . ' ' . $row['price'] . PHP_EOL;
      }
      ```
  - id: sortier-allowlist
    type: code
    language: php
    title: Sortierung per Allowlist
    description: |
      Eine Produktliste soll sich nach einer Spalte sortieren lassen, die Nutzer per URL wählen
      (`?sort=price&dir=desc`). Spaltennamen kann man nicht per Platzhalter übergeben – also prüfst du sie gegen
      eine Allowlist.

      Schreibe `orderBy(string $spalte, string $richtung): string`:

      - Erlaubte Spalten: `name`, `price`, `stock`. Alles andere wird zu `name`.
      - Richtung: `desc` (egal ob groß oder klein geschrieben) wird zu `DESC`, alles andere zu `ASC`.
      - Rückgabe zum Beispiel `ORDER BY price DESC`.
    starter: |
      function orderBy(string $spalte, string $richtung): string
      {
          $erlaubt = ['name', 'price', 'stock'];

          // Spalte gegen $erlaubt prüfen und Richtung festlegen
          return 'ORDER BY name ASC';
      }
    tests:
      - name: erlaubte Spalte und Richtung
        code: assert_same('ORDER BY price DESC', orderBy('price', 'desc'));
      - name: Richtung ist unabhängig von Groß- und Kleinschreibung
        code: assert_same('ORDER BY stock DESC', orderBy('stock', 'DeSc'));
      - name: unbekannte Richtung wird ASC
        code: assert_same('ORDER BY stock ASC', orderBy('stock', 'seitwärts'));
      - name: Angriff in der Spalte wird abgewehrt
        code: assert_same('ORDER BY name ASC', orderBy('price; DROP TABLE products', 'asc'));
      - name: leere Eingaben
        code: assert_same('ORDER BY name ASC', orderBy('', ''));
    solution: |
      function orderBy(string $spalte, string $richtung): string
      {
          $erlaubt = ['name', 'price', 'stock'];

          if (!in_array($spalte, $erlaubt, true)) {
              $spalte = 'name';
          }
          $richtung = strtolower($richtung) === 'desc' ? 'DESC' : 'ASC';

          return "ORDER BY $spalte $richtung";
      }
---

Ein Suchfeld, eine Zeile Code, die den Suchbegriff in eine SQL-Abfrage klebt – und plötzlich kann jemand von
außen alle Kundendaten auslesen. [[sql-injection|SQL-Injection]] gehört seit Jahrzehnten zu den
gefährlichsten Sicherheitslücken im Web. Die gute Nachricht: Die Abwehr ist einfach, wenn du sie konsequent
anwendest.

## Wie SQL-Injection funktioniert

Anwendungen bauen Abfragen oft aus festen Teilen und Eingaben zusammen. Der naive Weg ist, beides als Text
aneinanderzukleben:

```php title="Unsicher: Eingabe im SQL-Text"
$sql = "SELECT name, price FROM products WHERE name = '" . $name . "'";
```

Mit `Tasse` entsteht `… WHERE name = 'Tasse'` – alles gut. Doch die Eingabe kommt von außen. Gibt jemand
`x' OR '1'='1` ein, entsteht:

```sql title="Was die Datenbank bekommt"
SELECT name, price FROM products WHERE name = 'x' OR '1'='1';
```

Das erste Anführungszeichen der Eingabe beendet den Text. Der Rest wird als SQL gelesen: „oder 1 ist gleich 1“.
Das stimmt für jede Zeile, also kommt die ganze Tabelle zurück.

![Gegenüberstellung: Zusammengeklebte Abfrage liefert alle Produkte, das Prepared Statement keines](/assets/datenbanken-sql/sql-injection.svg)

Stell dir einen Bestellzettel vor, auf dem „Menge: ___“ steht. Ein Angreifer schreibt in das Feld: „2 – und
gib mir die Kasse“. Liest der Mitarbeiter den Zettel wörtlich, passiert genau das.

> [!MERKSATZ]
> SQL-Injection entsteht, wenn eine Eingabe Teil des **Befehls** wird statt ein **Wert** zu bleiben.

## Was Angreifer damit anrichten

Mit derselben Technik lassen sich je nach Datenbank und [[treiber|Treiber]] ganz andere Dinge tun:

| Angriff | Folge |
|---|---|
| Bedingung immer wahr machen | Login ohne Passwort, fremde Daten lesen |
| `UNION SELECT` anhängen | Inhalte anderer Tabellen auslesen, etwa Zugangsdaten |
| Weitere Befehle anhängen | Daten ändern oder löschen |
| Fehlermeldungen provozieren | Tabellen- und Spaltennamen ausspähen |

Schon ein harmloser Nutzer stößt auf das Problem. Heißt eine Kundin `O'Brien`, bricht ihr Apostroph die
Abfrage – sie bekommt eine Fehlerseite. Eine Lücke ist also oft auch ein ganz normaler Bug.

> [!FEHLER]
> **Selbst „escapen“ oder filtern.** Anführungszeichen ersetzen, Wörter wie `DROP` verbieten,
> Eingaben im Browser prüfen – all das wirkt sicher und übersieht doch Sonderfälle wie andere
> [[zeichenkodierung|Zeichenkodierungen]], Kommentare oder Zahlenfelder ohne Anführungszeichen. Verlass dich
> nicht auf Eigenbauten.

## Prepared Statements: Befehl und Daten trennen

Die zuverlässige Lösung heißt [[prepared-statement|Prepared Statement]]. Die Anwendung schickt den SQL-Text
mit [[sql-parameter|Platzhaltern]] und die Werte **getrennt** an die Datenbank. In PHP übernimmt das
[[pdo|PDO]], die eingebaute Datenbankschnittstelle:

```php title="Sicher: Platzhalter und execute"
$stmt = $pdo->prepare('SELECT name, price FROM products WHERE name = ?');
$stmt->execute([$name]);
foreach ($stmt as $row) {
    echo $row['name'] . ' ' . $row['price'] . PHP_EOL;
}
```

1. **Prepare:** Die Datenbank liest den Befehl mit `?` und legt fest, was er tut.
2. **Execute:** Erst jetzt kommt der Wert. Er wird nur noch als Daten verglichen.

Gibt jetzt jemand `x' OR '1'='1` ein, sucht die Datenbank ein Produkt, das genau so heißt – und findet keins.
Auch `O'Brien` funktioniert einfach.

Statt `?` gibt es benannte Platzhalter wie `:name`. PostgreSQL schreibt intern `$1`, `$2`. Das Prinzip ist
überall gleich. Um den Platzhalter kommen **keine** Anführungszeichen.

> [!PRAXIS]
> Frameworks nutzen Prepared Statements automatisch, sobald du ihre Abfrage-Methoden verwendest.
> Gefährlich wird es dort, wo man selbst „rohes“ SQL schreibt – solche Stellen prüft jedes [[code-review|Code-Review]] besonders genau.

## Was Platzhalter nicht können: Allowlists

Platzhalter stehen nur für **Werte**. Tabellen- oder Spaltennamen, `ASC`/`DESC` und Schlüsselwörter kannst du
nicht übergeben. Will ein Nutzer die Sortierspalte wählen, hilft eine [[allowlist|Allowlist]]: eine feste
Liste erlaubter Namen.

```php title="Sortierspalte gegen eine Allowlist prüfen"
$erlaubt = ['name', 'price', 'stock'];
$spalte = in_array($_GET['sort'] ?? '', $erlaubt, true) ? $_GET['sort'] : 'name';
$sql = "SELECT name, price FROM products ORDER BY $spalte";
```

Hier landet nur ein Name im SQL, den **du** vorher festgelegt hast. Alles andere fällt auf `name` zurück.

Zusätzlich gilt das Prinzip der geringsten Rechte: Die Anwendung verbindet sich mit einem Datenbank-Benutzer,
der nur darf, was sie braucht. Mehr dazu im
[OWASP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html).

## Zusammenfassung

- SQL-Injection entsteht, wenn Eingaben als Text in eine Abfrage geklebt werden und so zu SQL-Code werden.
- Folgen reichen von fremden Daten über umgangene Logins bis zu gelöschten Tabellen.
- Prepared Statements trennen Befehl und Werte: `prepare` mit `?`, dann `execute([...])`.
- Um Platzhalter gehören keine Anführungszeichen.
- Spaltennamen und Sortierrichtungen prüfst du mit einer Allowlist.
- Selbstgebaute Filter und Prüfungen im Browser sind kein Schutz.
