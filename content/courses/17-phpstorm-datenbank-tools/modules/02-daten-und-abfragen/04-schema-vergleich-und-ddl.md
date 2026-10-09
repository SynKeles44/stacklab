---
title: Schema-Vergleich und DDL
summary: Die DDL einer Tabelle ansehen und erzeugen, zwei Datenbank-Strukturen vergleichen und ein Migrationsskript daraus ableiten.
duration: 20
sources:
  - title: PhpStorm-Hilfe – Schema comparison and migration
    url: https://www.jetbrains.com/help/phpstorm/schema-comparison-and-migration.html
  - title: PhpStorm-Hilfe – Modify source code of database objects
    url: https://www.jetbrains.com/help/phpstorm/modifying-source-code-of-database-objects.html
  - title: PhpStorm-Hilfe – Database tool window (SQL Scripts)
    url: https://www.jetbrains.com/help/phpstorm/database-tool-window.html
  - title: SQLite-Dokumentation – ALTER TABLE
    url: https://sqlite.org/lang_altertable.html
quiz:
  - type: match
    question: Ordne jede Anweisung der richtigen Gruppe zu.
    pairs:
      - { left: "CREATE TABLE orders (…)", right: "DDL – Struktur anlegen" }
      - { left: "ALTER TABLE orders ADD COLUMN note TEXT", right: "DDL – Struktur ändern" }
      - { left: "UPDATE orders SET total = 0", right: "DML – Daten ändern" }
      - { left: "INSERT INTO orders VALUES (…)", right: "DML – Daten anlegen" }
    explanation: DDL beschreibt die Form der Datenbank, DML ihren Inhalt.
  - type: single
    question: Du vergleichst `shop (lokal)` als Origin mit `shop (staging)` als Target. Was macht das erzeugte Migrationsskript?
    options:
      - Es passt Staging an den lokalen Stand an.
      - Es passt den lokalen Stand an Staging an.
      - Es kopiert alle Daten von lokal nach Staging.
    answer: 0
    explanation: Das Skript macht das Target gleich dem Origin. Daten werden dabei nicht kopiert – es geht nur um Struktur.
  - type: cloze
    text: "Zwei Schemas markierst du im Database-Fenster und wählst im Kontextmenü „Compare ___ With“ (Ctrl+D, macOS ⌘D)."
    blanks:
      - [Structure]
    explanation: Compare Structure With vergleicht Struktur. Für Daten gibt es Compare Data.
  - type: multiple
    question: Welche Wege zeigen dir die DDL einer Tabelle in PhpStorm?
    options:
      - "Rechtsklick → Navigation | Go to DDL (Ctrl+B, macOS ⌘B)"
      - "Rechtsklick → SQL Scripts | SQL Generator (Ctrl+Alt+G, macOS ⌥⌘G)"
      - "Doppelklick auf eine Zeile im Daten-Editor"
      - "Rechtsklick → SQL Scripts | Generate DDL to Query Console"
    answers: [0, 1, 3]
    explanation: Go to DDL zeigt die Definition, der SQL Generator erzeugt ein ausführbares Skript, Generate DDL to Query Console legt es direkt in eine Konsole.
tasks:
  - id: klickpfad-vergleich
    type: order
    title: Klickpfad für einen Schema-Vergleich
    description: >
      Du willst wissen, wie sich das Schema deiner lokalen Datenbank von dem der Testumgebung unterscheidet,
      und daraus ein Skript für die Testumgebung erzeugen. Bring die Schritte in die richtige Reihenfolge.
    items:
      - "Im Database-Fenster das lokale Schema anklicken"
      - "Mit Ctrl-Klick (macOS ⌘-Klick) das Schema der Testumgebung dazu markieren"
      - "Rechtsklick → Compare Structure With (Ctrl+D / ⌘D)"
      - "Im Vergleich Origin = lokal und Target = Testumgebung prüfen"
      - "Im Reiter Script Preview das erzeugte Skript lesen"
      - "Open Query in Console wählen und das Skript bewusst ausführen"
    hints:
      - Erst beide Objekte markieren, dann vergleichen.
      - Bevor etwas ausgeführt wird, liest du das Skript.
  - id: schema-angleichen
    type: terminal
    title: Struktur-Unterschied finden und beheben
    description: |
      Im Ordner `schema-angleichen` liegen zwei SQLite-Datenbanken: `lokal.db` (dein Entwicklungsstand) und
      `staging.db` (die Testumgebung). Auf Staging fehlt etwas.

      Klicke auf **Aufgabe vorbereiten** und dann:

      1. Schreibe die Struktur beider Datenbanken in Dateien:
         `sqlite3 lokal.db .schema > lokal.sql` und `sqlite3 staging.db .schema > staging.sql`.
      2. Vergleiche sie mit `diff staging.sql lokal.sql` – das ist dein Schema-Vergleich.
      3. Schreibe die fehlende(n) Anweisung(en) in die Datei `migration.sql`.
      4. Spiele `migration.sql` in `staging.db` ein, sodass beide Schemas gleich sind. Die Daten in Staging
         müssen erhalten bleiben.
    workdir: schema-angleichen
    setup: |
      sqlite3 lokal.db <<'SQL'
      CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, status TEXT NOT NULL, total REAL NOT NULL, note TEXT);
      CREATE INDEX idx_orders_status ON orders (status);
      SQL
      sqlite3 staging.db <<'SQL'
      CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, status TEXT NOT NULL, total REAL NOT NULL);
      INSERT INTO orders (customer_id, status, total) VALUES (1, 'paid', 49.90), (2, 'open', 12.00), (3, 'open', 5.50);
      SQL
    checks:
      - type: file_exists
        path: migration.sql
        message: Die Datei migration.sql fehlt noch.
      - type: file_contains
        path: migration.sql
        pattern: "[Aa][Ll][Tt][Ee][Rr]\\s+[Tt][Aa][Bb][Ll][Ee]\\s+\"?orders\"?\\s+[Aa][Dd][Dd]"
        message: In migration.sql fehlt ein ALTER TABLE orders ADD COLUMN für die fehlende Spalte.
      - type: command
        run: sqlite3 staging.db "SELECT group_concat(name, ',') FROM pragma_table_info('orders');"
        stdout_equals: "id,customer_id,status,total,note"
        message: In staging.db fehlt noch die Spalte note in der Tabelle orders. Hast du migration.sql eingespielt?
      - type: command
        run: sqlite3 staging.db "SELECT count(*) FROM pragma_index_list('orders') WHERE name = 'idx_orders_status';"
        stdout_equals: "1"
        message: In staging.db fehlt noch der Index idx_orders_status.
      - type: command
        run: sqlite3 staging.db "SELECT count(*) FROM orders;"
        stdout_equals: "3"
        message: Die drei Bestellungen in staging.db müssen erhalten bleiben – nicht die Tabelle neu anlegen, sondern ändern.
    hints:
      - "Im diff stehen Zeilen mit `>` nur in lokal.sql – genau das fehlt auf Staging."
      - "Eine fehlende Spalte ergänzt du mit `ALTER TABLE orders ADD COLUMN note TEXT;`, einen fehlenden Index mit `CREATE INDEX …`."
      - "Einspielen: `sqlite3 staging.db < migration.sql`"
    solution: |
      ```bash
      sqlite3 lokal.db .schema > lokal.sql
      sqlite3 staging.db .schema > staging.sql
      diff staging.sql lokal.sql
      cat > migration.sql <<'SQL'
      ALTER TABLE orders ADD COLUMN note TEXT;
      CREATE INDEX idx_orders_status ON orders (status);
      SQL
      sqlite3 staging.db < migration.sql
      ```
---
„Auf meinem Rechner funktioniert es, auf der Testumgebung kracht es mit *no such column: note*.“ Hinter
diesem Satz steckt fast immer ein Unterschied in der Struktur der Datenbanken. PhpStorm kann Strukturen
anzeigen, erzeugen und vergleichen – und dir so in Minuten zeigen, was auf der einen Seite fehlt.

## DDL und DML

[[sql|SQL]]-Anweisungen fallen in zwei große Gruppen:

| Gruppe | Steht für | Anweisungen | Ändert |
|---|---|---|---|
| [[ddl|DDL]] | Data Definition Language | `CREATE`, `ALTER`, `DROP` | die **Struktur** |
| [[dml|DML]] | Data Manipulation Language | `INSERT`, `UPDATE`, `DELETE` | die **Daten** |

Der Daten-Editor erzeugt DML. In dieser Lektion geht es um DDL – also um Tabellen, Spalten und
[[datenbank-index|Indizes]] selbst.

> [!MERKSATZ]
> DDL ist der Bauplan, DML sind die Möbel. Ein Schema-Vergleich vergleicht Baupläne – keine Möbel.

## DDL ansehen und erzeugen

Drei Wege, alle über einen Rechtsklick auf eine Tabelle im Database-Fenster:

1. **Navigation | Go to DDL** (Ctrl+B, macOS ⌘B) – zeigt die Definition der Tabelle. Dasselbe Kürzel
   funktioniert auf einem Tabellennamen in einer SQL-Abfrage.
2. **SQL Scripts | SQL Generator** (Ctrl+Alt+G, macOS ⌥⌘G) – erzeugt ein ausführbares Skript. Auf einem
   ganzen Schema angewendet, bekommst du das Skript für alle Objekte.
3. **SQL Scripts | Generate DDL to Query Console** – legt das Skript direkt in eine Konsole.

Ein Ergebnis sieht zum Beispiel so aus:

```sql title="Erzeugte DDL"
CREATE TABLE orders (
    id          INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    status      TEXT    NOT NULL,
    total       REAL    NOT NULL,
    note        TEXT
);
CREATE INDEX idx_orders_status ON orders (status);
```

Auf der Kommandozeile zeigt `sqlite3 lokal.db .schema` dieselbe Information.

## Zwei Strukturen vergleichen

So vergleichst du zwei Schemas (oder zwei Tabellen):

1. Im Database-Fenster das erste Objekt anklicken, z. B. das Schema der lokalen Datenbank.
2. Mit **Ctrl-Klick** (macOS ⌘-Klick) das zweite dazu markieren.
3. Rechtsklick → **Compare Structure With** (Ctrl+D, macOS ⌘D).

Für diesen [[schema-vergleich|Schema-Vergleich]] zeigt PhpStorm die Unterschiede im Diff-Viewer bzw. im Migrationsdialog. Die beiden Seiten heißen
**Origin** und **Target**. Wichtig ist die Richtung:

> [!ACHTUNG]
> Das erzeugte [[migrationsskript|Migrationsskript]] macht das **Target gleich dem Origin**. Vertauschst du
> die Seiten, schlägt PhpStorm im schlimmsten Fall vor, deine neue Spalte zu löschen.

Im Reiter **Object Properties Diff** siehst du Unterschiede als Tabelle, im Reiter **DDL Diff** als
SQL-Text. Darunter erzeugt PhpStorm im Reiter **Script Preview** das passende Skript.

## Vom Vergleich zum Skript

Für unser Beispiel schlägt PhpStorm etwa vor:

```sql title="Script Preview"
ALTER TABLE orders ADD COLUMN note TEXT;
CREATE INDEX idx_orders_status ON orders (status);
```

Du kannst es mit **Execute** direkt ausführen oder mit **Open Query in Console** erst in eine Konsole
holen. Optionen wie **Allow object recreation** erlauben PhpStorm, Objekte neu anzulegen, wenn ein
`ALTER` nicht reicht – dabei können Daten verloren gehen.

> [!FEHLER]
> Das Skript ungelesen mit **Execute** auf eine geteilte Datenbank loslassen. Lies jede Zeile. Steht dort
> ein `DROP`, frag dich, ob das wirklich gewollt ist.

> [!PRAXIS]
> In Projekten mit Frameworks wie Laravel sind die Migrationsdateien im Repository die Wahrheit über die
> Struktur. Der Schema-Vergleich dient dann als Kontrolle: „Ist auf Staging wirklich jede Migration
> gelaufen?“ Das gefundene Problem behebst du mit einer neuen Migration, nicht von Hand.

## Tastenkürzel dieser Lektion

| Aktion | Windows/Linux | macOS |
|---|---|---|
| Go to DDL | Ctrl+B | ⌘B |
| SQL Generator | Ctrl+Alt+G | ⌥⌘G |
| Compare Structure With | Ctrl+D | ⌘D |
| Mehrfachauswahl | Ctrl-Klick | ⌘-Klick |

## Zusammenfassung

- DDL ändert die Struktur (`CREATE`, `ALTER`, `DROP`), DML die Daten.
- **Go to DDL** zeigt, **SQL Generator** erzeugt die DDL eines Objekts oder ganzen Schemas.
- **Compare Structure With** vergleicht zwei Objekte; das Skript macht das **Target** gleich dem **Origin**.
- Lies erzeugte Skripte immer, bevor du sie ausführst – besonders `DROP`-Zeilen.
- Auf der Kommandozeile entspricht das `sqlite3 db .schema` plus `diff`.
