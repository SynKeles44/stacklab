---
title: Query-Konsolen
summary: SQL direkt aus PhpStorm ausführen – Statements gezielt starten, mit Parametern arbeiten und alte Abfragen in der Historie wiederfinden.
duration: 20
sources:
  - title: PhpStorm-Hilfe – Query consoles
    url: https://www.jetbrains.com/help/phpstorm/query-consoles.html
  - title: PhpStorm-Hilfe – Run queries
    url: https://www.jetbrains.com/help/phpstorm/run-a-query.html
  - title: PhpStorm-Hilfe – Code editor tips and reference
    url: https://www.jetbrains.com/help/phpstorm/code-editor-tips-and-ref-db-tools-and-sql.html
  - title: PhpStorm-Hilfe – User Parameters
    url: https://www.jetbrains.com/help/phpstorm/settings-tools-database-user-parameters.html
  - title: SQLite-Dokumentation – SQL Parameters im CLI (.parameter)
    url: https://sqlite.org/cli.html#sql_parameters
quiz:
  - type: single
    question: In der Konsole stehen drei Statements. Der Cursor steht im zweiten. Was passiert bei Ctrl+Enter (macOS ⌘↩)?
    options:
      - Alle drei werden immer nacheinander ausgeführt.
      - PhpStorm führt das Statement unter dem Cursor aus (oder bietet eine Auswahl an).
      - Es passiert nichts, man muss erst alles markieren.
    answer: 1
    explanation: Ohne Markierung nimmt PhpStorm das aktuelle Statement – je nach Einstellung direkt oder über eine kleine Auswahlliste, in der auch „alle ausführen“ steht.
  - type: multiple
    question: Welche Vorteile hat `WHERE customer_id = :kunde` gegenüber `WHERE customer_id = 42`?
    options:
      - Du kannst dieselbe Abfrage mit verschiedenen Werten ausführen, ohne sie zu ändern.
      - PhpStorm fragt dich beim Ausführen nach dem Wert.
      - Die Abfrage wird dadurch automatisch schneller.
      - In Programmcode schützen Parameter vor SQL-Injection.
    answers: [0, 1, 3]
    explanation: Parameter machen Abfragen wiederverwendbar und sicher. Schneller werden sie nicht automatisch.
  - type: match
    question: Ordne die Aktion dem Tastenkürzel (Windows/Linux) zu.
    pairs:
      - { left: "Statement ausführen", right: "Ctrl+Enter" }
      - { left: "Query-Historie öffnen", right: "Ctrl+Alt+E" }
      - { left: "Laufende Abfrage abbrechen", right: "Ctrl+F2" }
      - { left: "Konsole der Datenquelle öffnen", right: "F4" }
    explanation: "Auf macOS entsprechen dem ⌘↩, ⌥⌘E, ⌘F2 und F4."
  - type: find-bug
    question: Diese Konsole soll zuerst den Status ändern und ihn dann anzeigen. Der Cursor steht in Zeile 3, du drückst Ctrl+Enter – aber es wird nur ein Statement ausgeführt. Welche Zeile ist schuld?
    language: sql
    code: |
      UPDATE orders
      SET status = 'paid'
      WHERE id = 17
      SELECT id, status FROM orders WHERE id = 17;
    bug_line: 3
    explanation: Nach `WHERE id = 17` fehlt das Semikolon. Ohne Trennzeichen sieht PhpStorm (und die Datenbank) beide Zeilenblöcke als ein einziges, kaputtes Statement.
tasks:
  - id: bericht-mit-parameter
    type: terminal
    title: Ein wiederverwendbarer Bericht mit Parameter
    description: |
      In PhpStorm würdest du `:kunde` in die Konsole schreiben und beim Ausführen einen Wert eingeben. Das
      Kommandozeilenprogramm `sqlite3` kann das auch: Mit `.param set :kunde 2` legst du den Wert fest.

      Vorbereitet ist `shop.db`. Klicke auf **Aufgabe vorbereiten** und dann:

      1. Lege die Datei `bericht.sql` an. Sie enthält **eine** Abfrage, die für den Kunden `:kunde` alle
         Bestellungen mit `id`, `status` und `total` liefert, sortiert nach `id`.
      2. Teste sie in `sqlite3 shop.db`:
         `.param set :kunde 1`, danach `.read bericht.sql`. Probiere auch Kunde 2.
      3. Der Wert darf nicht fest in der Datei stehen – nur der Parameter `:kunde`.
    workdir: bericht-mit-parameter
    setup: |
      sqlite3 shop.db <<'SQL'
      CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
      CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(id), status TEXT NOT NULL, total REAL NOT NULL);
      INSERT INTO customers (name) VALUES ('Ada'), ('Linus'), ('Grace');
      INSERT INTO orders (customer_id, status, total) VALUES (1, 'paid', 49.90), (1, 'open', 12.00), (2, 'paid', 99.00), (1, 'paid', 7.50), (2, 'open', 3.20), (3, 'open', 5.50);
      SQL
    checks:
      - type: file_contains
        path: bericht.sql
        pattern: ":kunde"
        message: In bericht.sql fehlt der Parameter :kunde.
      - type: command
        run: printf '.param set :kunde 1\n.read bericht.sql\n' | sqlite3 shop.db | tr '\n' ' '
        stdout_matches: "^1\\|paid\\|49\\.9 2\\|open\\|12\\.0 4\\|paid\\|7\\.5$"
        message: "Für Kunde 1 sollten genau die Zeilen 1, 2 und 4 mit id, status und total (sortiert nach id) erscheinen."
      - type: command
        run: printf '.param set :kunde 2\n.read bericht.sql\n' | sqlite3 shop.db | wc -l
        stdout_matches: "^\\s*2\\s*$"
        message: Für Kunde 2 sollten genau zwei Zeilen erscheinen. Steht vielleicht ein fester Wert statt :kunde in der Abfrage?
    hints:
      - "Die Abfrage beginnt mit `SELECT id, status, total FROM orders WHERE customer_id = :kunde`."
      - "Vergiss `ORDER BY id` und das Semikolon am Ende nicht."
      - "`echo \"SELECT id, status, total FROM orders WHERE customer_id = :kunde ORDER BY id;\" > bericht.sql`"
    solution: |
      ```bash
      echo "SELECT id, status, total FROM orders WHERE customer_id = :kunde ORDER BY id;" > bericht.sql
      sqlite3 shop.db
      # in sqlite3:
      # .param set :kunde 1
      # .read bericht.sql
      # .quit
      ```
  - id: konsole-ablauf
    type: steps
    title: Was passiert in der Konsole?
    description: Spiel eine kleine Sitzung in der Query-Konsole durch.
    steps:
      - situation: >
          Du markierst im Database-Tool-Fenster die Datenquelle `shop@localhost` und drückst F4.
        question: Was öffnet sich?
        options:
          - Die Standard-Query-Konsole dieser Datenquelle
          - Der Dialog für eine neue Datenquelle
          - Der Daten-Editor der ersten Tabelle
        answer: 0
        explanation: F4 auf einer Datenquelle öffnet ihre Standard-Konsole. Eine zusätzliche Konsole legst du über Jump to Query Console → New Query Console an.
      - situation: >
          In der Konsole steht `SELECT * FROM orders WHERE customer_id = :kunde;`. Du drückst Ctrl+Enter (⌘↩).
        question: Was macht PhpStorm vor dem Ausführen?
        options:
          - Es bricht mit einem Syntaxfehler ab.
          - Es fragt dich nach einem Wert für `:kunde`.
          - Es setzt automatisch 0 ein.
        answer: 1
        explanation: PhpStorm erkennt benannte Parameter und fragt die Werte ab. Die letzten Werte merkt es sich.
      - situation: >
          Die Abfrage läuft schon 40 Sekunden, weil du die Bedingung vergessen hast.
        question: Wie stoppst du sie?
        options:
          - Mit Cancel Running Statements (Ctrl+F2, macOS ⌘F2)
          - Nur durch Neustart von PhpStorm
          - Mit Revert Selected
        answer: 0
        explanation: Der rote Stopp-Knopf in der Konsole bzw. Ctrl+F2/⌘F2 bricht die laufende Anweisung ab.
      - situation: >
          Eine Woche später brauchst du genau diese Abfrage wieder, die Konsole ist aber leer.
        question: Wo findest du sie?
        options:
          - Gar nicht mehr, Konsolen werden gelöscht.
          - In der Query-Historie (Ctrl+Alt+E, macOS ⌥⌘E)
          - Im Git-Log
        answer: 1
        explanation: PhpStorm speichert alle ausgeführten Statements je Datenquelle. Doppelklick in der Historie fügt sie wieder ein.
---
Der Daten-Editor ist praktisch, um einzelne Zeilen anzusehen. Aber sobald du Fragen stellst wie „Wie viele
offene Bestellungen hat jeder Kunde?“ oder „Welche Bestellungen sind älter als 30 Tage?“, brauchst du
[[sql|SQL]]. Dafür hat PhpStorm die [[query-konsole|Query-Konsole]] – einen SQL-Editor mit eigener
Verbindung, Autovervollständigung und Ergebnistabelle.

## Eine Konsole öffnen

Es gibt mehrere Wege, alle führen zum selben Ziel:

1. **F4** auf einer markierten Datenquelle öffnet deren **Standard-Konsole**.
2. **Jump to Query Console** in der Werkzeugleiste des Database-Fensters (Ctrl+Shift+F10, macOS ⇧⌘L)
   → **New Query Console** legt eine zusätzliche Konsole an.
3. Hauptmenü: **File | New | Query Console**.

Der Tab heißt dann z. B. `console [shop@localhost]`. Oben rechts in der Werkzeugleiste siehst du das aktive
[[datenbank-schema|Schema]] und kannst es umschalten.

Konsolen sind keine Projektdateien. PhpStorm speichert sie unter **Scratches and Consoles | Database
Consoles** im Project-Fenster. Sie landen also nicht in deinem Git-[[repository|Repository]].

> [!TIPP]
> Willst du SQL im Team teilen, lege eine echte `.sql`-Datei im Projekt an und verbinde sie oben rechts mit
> einer Datenquelle. Für schnelle Experimente bleibt die Konsole.

## Statements ausführen

Schreib eine [[abfrage|Abfrage]] und drücke **Ctrl+Enter** (macOS ⌘↩) oder klicke auf den grünen
**Execute**-Pfeil.

- **Ein Statement**: Steht der Cursor darin, wird genau dieses ausgeführt. Bei mehreren Statements zeigt
  PhpStorm eine kleine Auswahl, in der auch „alle ausführen“ steht.
- **Ein Ausschnitt**: Markierst du Text, wird nur die Markierung ausgeführt.
- **Trennzeichen**: Jedes Statement endet mit `;`. Fehlt es, verschmelzen zwei Statements.

```sql title="console [shop@localhost]"
SELECT status, count(*) AS anzahl
FROM orders
GROUP BY status;

UPDATE orders SET status = 'paid' WHERE id = 17;
```

Ergebnisse erscheinen unten im **Services**-Tool-Fenster. Der Reiter **Output** protokolliert jede Ausführung
mit Dauer und Anzahl betroffener Zeilen. Dauert etwas zu lange, bricht **Cancel Running Statements**
(Ctrl+F2, macOS ⌘F2) ab.

![Schema der Query-Konsole mit Werkzeugleiste, SQL-Editor und Ergebnisbereich](/assets/phpstorm-datenbank-tools/query-konsole.svg)

## Parameter statt fester Werte

Oft willst du dieselbe Abfrage für verschiedene Werte ausführen. Statt die Zahl jedes Mal zu ändern,
schreibst du einen [[sql-parameter|Parameter]]:

```sql title="Mit benanntem Parameter"
SELECT id, status, total
FROM orders
WHERE customer_id = :kunde
ORDER BY id;
```

Beim Ausführen erkennt PhpStorm `:kunde` und fragt nach dem Wert. Auch `?` gilt als Parameter. Welche
Muster erkannt werden, legst du unter **Settings | Tools | Database | Query Execution | User Parameters**
fest. Über **View Parameters** in der Werkzeugleiste siehst du alle Werte auf einen Blick.

Auf der Kommandozeile geht dasselbe mit `sqlite3`:

```text title="sqlite3"
sqlite> .param set :kunde 1
sqlite> .read bericht.sql
```

> [!FEHLER]
> Parameter in Anführungszeichen setzen: `WHERE status = ':status'`. Dann ist es ein ganz normaler Text und
> kein Platzhalter mehr. Richtig ist `WHERE status = :status` – den Text gibst du als Wert ein.

## Die Query-Historie

PhpStorm merkt sich jedes Statement, das du für eine Datenquelle ausgeführt hast, in der [[query-historie|Query-Historie]]. **Browse Query History**
(Ctrl+Alt+E, macOS ⌥⌘E) öffnet die Liste:

- Tippen filtert die Einträge.
- Doppelklick fügt die Abfrage wieder in die Konsole ein.
- Entf löscht einen Eintrag.

> [!MERKSATZ]
> Konsole = Notizblock mit Verbindung. Ctrl+Enter/⌘↩ führt aus, `:name` macht Abfragen wiederverwendbar,
> Ctrl+Alt+E/⌥⌘E holt alte Abfragen zurück.

> [!PRAXIS]
> Bei der Fehlersuche sammelst du in einer Konsole nach und nach Abfragen: Wie sieht die Bestellung aus?
> Welche Positionen hat sie? Welche Zahlung gehört dazu? Die Historie ist dabei dein Protokoll.

## Tastenkürzel dieser Lektion

| Aktion | Windows/Linux | macOS |
|---|---|---|
| Konsole der Datenquelle | F4 | F4 |
| Jump to Query Console | Ctrl+Shift+F10 | ⇧⌘L |
| Statement ausführen | Ctrl+Enter | ⌘↩ |
| Abbrechen | Ctrl+F2 | ⌘F2 |
| Query-Historie | Ctrl+Alt+E | ⌥⌘E |

## Zusammenfassung

- Eine Query-Konsole ist ein SQL-Editor mit eigener Verbindung zu einer Datenquelle.
- F4 öffnet die Standard-Konsole, **Jump to Query Console** legt weitere an.
- Ctrl+Enter (⌘↩) führt das Statement unter dem Cursor oder die Markierung aus; `;` trennt Statements.
- Parameter wie `:kunde` oder `?` fragt PhpStorm beim Ausführen ab.
- Die Query-Historie (Ctrl+Alt+E / ⌥⌘E) speichert alle ausgeführten Statements.
