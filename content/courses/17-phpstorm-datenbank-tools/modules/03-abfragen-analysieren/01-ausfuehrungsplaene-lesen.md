---
title: Ausführungspläne lesen
summary: Mit EXPLAIN und Explain Plan sehen, wie die Datenbank eine Abfrage beantwortet – Seq Scan, Index Scan und Kosten verstehen.
duration: 25
sources:
  - title: PostgreSQL-Dokumentation – Using EXPLAIN
    url: https://www.postgresql.org/docs/current/using-explain.html
  - title: PostgreSQL-Dokumentation – EXPLAIN
    url: https://www.postgresql.org/docs/current/sql-explain.html
  - title: PhpStorm-Hilfe – Query execution plan
    url: https://www.jetbrains.com/help/phpstorm/query-execution-plan.html
  - title: SQLite-Dokumentation – EXPLAIN QUERY PLAN
    url: https://sqlite.org/eqp.html
quiz:
  - type: single
    question: Was bedeutet `Seq Scan on orders` in einem PostgreSQL-Plan?
    options:
      - Die Datenbank liest die Tabelle orders komplett, Zeile für Zeile.
      - Die Datenbank nutzt einen Index auf orders.
      - Die Abfrage wurde abgebrochen.
    answer: 0
    explanation: Sequential Scan heißt, ohne Index alles lesen und jede Zeile gegen die Bedingung prüfen.
  - type: cloze
    text: "In `cost=0.29..8.98` ist 0.29 der geschätzte Aufwand bis zur ___ Zeile und 8.98 bis zur ___ Zeile."
    blanks:
      - [ersten]
      - [letzten]
    explanation: Die erste Zahl ist der Startaufwand, die zweite der Gesamtaufwand. Beides sind relative Schätzwerte, keine Millisekunden.
  - type: multiple
    question: Welche Aussagen über EXPLAIN und EXPLAIN ANALYZE stimmen?
    options:
      - EXPLAIN plant nur und führt die Abfrage nicht aus.
      - EXPLAIN ANALYZE führt die Abfrage wirklich aus und misst die Zeiten.
      - EXPLAIN ANALYZE auf ein DELETE ist harmlos, weil es nur misst.
      - Die Kosten in EXPLAIN sind Millisekunden.
    answers: [0, 1]
    explanation: ANALYZE führt die Anweisung aus – ein DELETE löscht also wirklich. Pack so etwas in eine Transaktion mit ROLLBACK. Kosten sind abstrakte Einheiten.
  - type: match
    question: Ordne die SQLite-Planzeile ihrer Bedeutung zu.
    pairs:
      - { left: "SCAN orders", right: "ganze Tabelle lesen" }
      - { left: "SEARCH orders USING INDEX idx_orders_customer", right: "gezielt über einen Index suchen" }
      - { left: "SEARCH orders USING INTEGER PRIMARY KEY", right: "direkt über den Primärschlüssel springen" }
      - { left: "USE TEMP B-TREE FOR ORDER BY", right: "Ergebnis nachträglich sortieren" }
    explanation: SQLite verwendet eigene Wörter, die Idee ist dieselbe wie bei PostgreSQL – SCAN entspricht Seq Scan, SEARCH … USING INDEX einem Index Scan.
tasks:
  - id: plaene-vergleichen
    type: terminal
    title: Zwei Pläne aufnehmen und vergleichen
    description: |
      Vorbereitet ist `shop.db` mit 20 000 Bestellungen und einem Index auf `orders(customer_id)`.

      Klicke auf **Aufgabe vorbereiten** und dann:

      1. Speichere den Plan dieser Abfrage in `plan-kunde.txt`:
         `SELECT * FROM orders WHERE customer_id = 7;`
      2. Speichere den Plan dieser Abfrage in `plan-status.txt`:
         `SELECT * FROM orders WHERE status = 'open';`
      3. Eine der beiden Abfragen liest die ganze Tabelle. Schreibe in `antwort.txt` nur das Wort
         `kunde` oder `status` – je nachdem, welche das ist.

      Den Plan bekommst du mit `EXPLAIN QUERY PLAN` vor der Abfrage, z. B.
      `sqlite3 shop.db "EXPLAIN QUERY PLAN SELECT …;" > plan-kunde.txt`.
    workdir: plaene-vergleichen
    setup: |
      sqlite3 shop.db <<'SQL'
      CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, status TEXT NOT NULL, total REAL NOT NULL);
      WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 20000)
      INSERT INTO orders (customer_id, status, total)
      SELECT i % 500, CASE i % 4 WHEN 0 THEN 'open' ELSE 'paid' END, (i % 97) + 0.5 FROM n;
      CREATE INDEX idx_orders_customer ON orders (customer_id);
      SQL
    checks:
      - type: file_contains
        path: plan-kunde.txt
        pattern: "SEARCH orders USING INDEX idx_orders_customer"
        message: plan-kunde.txt enthält noch nicht den Plan der Kunden-Abfrage. Erwartet wird eine SEARCH-Zeile mit idx_orders_customer.
      - type: file_contains
        path: plan-status.txt
        pattern: "SCAN orders"
        message: plan-status.txt enthält noch nicht den Plan der Status-Abfrage (erwartet SCAN orders).
      - type: command
        run: tr -d ' \r\n' < antwort.txt | tr 'A-Z' 'a-z'
        stdout_equals: status
        message: Die Antwort stimmt noch nicht. Welche Planzeile beginnt mit SCAN?
    hints:
      - "`EXPLAIN QUERY PLAN` schreibst du direkt vor das SELECT."
      - "Ein Index auf `customer_id` hilft nur Abfragen, die nach `customer_id` filtern."
      - "`sqlite3 shop.db \"EXPLAIN QUERY PLAN SELECT * FROM orders WHERE status = 'open';\" > plan-status.txt`"
    solution: |
      ```bash
      sqlite3 shop.db "EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 7;" > plan-kunde.txt
      sqlite3 shop.db "EXPLAIN QUERY PLAN SELECT * FROM orders WHERE status = 'open';" > plan-status.txt
      cat plan-kunde.txt plan-status.txt
      echo status > antwort.txt
      ```
  - id: plan-deuten
    type: steps
    title: Was sagt dir dieser Plan?
    description: Du siehst in PhpStorm nacheinander drei Pläne. Entscheide jeweils, was er bedeutet.
    steps:
      - situation: |
          `Seq Scan on customers (cost=0.00..1.05 rows=5 width=40)` – die Tabelle `customers` hat 5 Zeilen.
        question: Musst du hier etwas tun?
        options:
          - Ja, sofort einen Index anlegen.
          - Nein – bei 5 Zeilen ist ein Seq Scan der schnellste Weg.
          - Ja, die Tabelle ist kaputt.
        answer: 1
        explanation: Kleine Tabellen liest man am schnellsten komplett. Der Planer wählt den Seq Scan hier bewusst.
      - situation: |
          `Seq Scan on orders (cost=0.00..1887.00 rows=40 width=24)` mit `Filter: (customer_id = 42)` –
          die Tabelle hat 100 000 Zeilen, das Ergebnis nur 40.
        question: Wie bewertest du das?
        options:
          - Warnzeichen – 100 000 Zeilen lesen, um 40 zu finden. Ein Index auf customer_id liegt nahe.
          - Alles bestens, Seq Scans sind immer optimal.
          - Die Abfrage liefert ein falsches Ergebnis.
        answer: 0
        explanation: Viele gelesene Zeilen, wenige Treffer – das ist das klassische Muster für einen fehlenden Index.
      - situation: |
          Nach `CREATE INDEX idx_orders_customer ON orders (customer_id);` zeigt der Plan
          `Index Scan using idx_orders_customer on orders (cost=0.29..8.98 rows=40 width=24)`.
        question: Was hat sich verbessert?
        options:
          - Die geschätzten Gesamtkosten sind von 1887 auf rund 9 gefallen.
          - Die Abfrage liefert jetzt mehr Zeilen.
          - Nichts, Kosten sind bedeutungslos.
        answer: 0
        explanation: Gleiche Abfrage, gleiches Ergebnis, aber ein weit günstigerer Weg. Ob es in echt schneller ist, zeigt EXPLAIN ANALYZE.
---
Die Bestellübersicht lädt plötzlich acht Sekunden. Im Code hat sich nichts geändert – nur die Tabelle ist
auf eine Million Zeilen gewachsen. Raten hilft hier nicht. Du fragst die Datenbank direkt: „Wie gehst du
bei dieser Abfrage vor?“ Die Antwort ist der [[ausfuehrungsplan|Ausführungsplan]].

## Was ein Ausführungsplan ist

Eine [[abfrage|Abfrage]] sagt nur, **was** du haben willst – nicht, **wie** die Datenbank es findet. Das
entscheidet der [[query-planer|Query-Planer]]. Er kennt mehrere Wege:

- die ganze [[tabelle|Tabelle]] Zeile für Zeile lesen,
- über einen [[datenbank-index|Index]] gezielt passende Zeilen finden,
- direkt über den [[primaerschluessel|Primärschlüssel]] springen.

Für jeden Weg schätzt er den Aufwand und wählt den günstigsten. Das Ergebnis ist der Plan.

Mit [[explain|EXPLAIN]] lässt du ihn dir zeigen:

```sql title="PostgreSQL"
EXPLAIN SELECT * FROM orders WHERE customer_id = 42;
```

```text title="Ausgabe"
Seq Scan on orders  (cost=0.00..1887.00 rows=40 width=24)
  Filter: (customer_id = 42)
```

> [!MERKSATZ]
> `EXPLAIN` zeigt den Plan, ohne die Abfrage auszuführen. Es ist also ungefährlich – auch bei `UPDATE` und
> `DELETE`.

## Seq Scan und Index Scan

Die erste Zeile jedes Plan-Knotens sagt, **wie** gelesen wird:

| Knoten | Bedeutung | Wann gut? |
|---|---|---|
| [[seq-scan|Seq Scan]] | ganze Tabelle lesen | kleine Tabellen, Abfragen auf fast alle Zeilen |
| [[index-scan|Index Scan]] | über einen Index springen | wenige Treffer in großer Tabelle |
| Index Only Scan | Antwort steht schon im Index | nur indizierte Spalten gefragt |
| Bitmap Heap Scan | Index sammelt Treffer, dann gebündelt lesen | mittelviele Treffer |

`Filter:` heißt: Die Zeilen werden gelesen und danach aussortiert. `Index Cond:` heißt: Der Index
erledigt die Auswahl schon beim Suchen.

![Vergleich Seq Scan und Index Scan mit PostgreSQL- und SQLite-Ausgabe](/assets/phpstorm-datenbank-tools/query-plan.svg)

> [!FEHLER]
> „Seq Scan = schlecht“ ist zu einfach. Bei einer Tabelle mit 20 Zeilen oder einer Abfrage, die 90 % aller
> Zeilen braucht, ist der Seq Scan oft der schnellste Weg. Verdächtig ist die Kombination **große Tabelle +
> wenige Treffer + Seq Scan**.

## Kosten und Schätzungen

Die Klammer hinter jedem Knoten enthält die Schätzungen des Planers:

- `cost=0.00..1887.00` – Aufwand bis zur **ersten** Zeile .. bis zur **letzten** Zeile. Die
  [[plan-kosten|Kosten]] sind abstrakte Einheiten, **keine** Millisekunden.
- `rows=40` – geschätzte Anzahl Ergebniszeilen.
- `width=24` – geschätzte Breite einer Zeile in Bytes.

Kosten vergleichst du nur zwischen Plänen **derselben** Abfrage: vorher 1887, nachher 8,98 heißt „der neue
Weg ist viel günstiger“.

Echte Zeiten liefert `EXPLAIN ANALYZE`. Es führt die Abfrage wirklich aus und ergänzt `actual time` und
`actual rows`. Weichen geschätzte und echte Zeilenzahl stark ab, sind oft die Statistiken veraltet – dann
hilft der Befehl `ANALYZE orders;`.

> [!ACHTUNG]
> `EXPLAIN ANALYZE DELETE …` löscht wirklich. Willst du schreibende Anweisungen messen, pack sie in
> `BEGIN; … ROLLBACK;`.

## Pläne in PhpStorm

So holst du dir einen Plan in der Query-Konsole:

1. Cursor in das Statement setzen.
2. Rechtsklick → **Explain Plan** → **Explain Plan** (nur planen) oder **Explain Analyse** (ausführen und
   messen). Alternativ das **Explain Plan**-Menü in der Werkzeugleiste der Konsole.
3. Der Plan erscheint im **Services**-Fenster im Reiter **Query Plan** als Baum mit Tabelle.

Nützliche Ansichten:

- **Show Diagram** (Ctrl+Alt+Shift+U, macOS ⌥⇧⌘U) zeichnet den Plan als Diagramm.
- **Flame Graph** zeigt mit **Total Cost** und **Startup Cost**, welcher Knoten am meisten kostet.
- **Raw** zeigt die Originalausgabe der Datenbank.

## Dasselbe mit SQLite

SQLite hat eine kompaktere Form: `EXPLAIN QUERY PLAN`.

```text title="Terminal"
$ sqlite3 shop.db "EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 7;"
QUERY PLAN
`--SEARCH orders USING INDEX idx_orders_customer (customer_id=?)
```

`SCAN orders` entspricht dem Seq Scan, `SEARCH … USING INDEX` dem Index Scan. `USE TEMP B-TREE FOR ORDER BY`
heißt: Das Ergebnis muss nachträglich sortiert werden.

> [!PRAXIS]
> Hängt eine Seite, kopierst du die langsame Abfrage aus dem Log oder Debugger in eine Konsole und schaust
> dir zuerst den Plan an. Sehr oft siehst du dort sofort den Seq Scan über eine große Tabelle.

## Tastenkürzel dieser Lektion

| Aktion | Windows/Linux | macOS |
|---|---|---|
| Statement ausführen | Ctrl+Enter | ⌘↩ |
| Plan als Diagramm (Show Diagram) | Ctrl+Alt+Shift+U | ⌥⇧⌘U |
| Kontextmenü (Explain Plan) | Rechtsklick | Rechtsklick / ⌃-Klick |
| Services-Fenster (Query Plan) | Alt+8 | ⌘8 |

Explain Plan selbst hat standardmäßig kein Kürzel; unter **Settings | Keymap** kannst du eins vergeben.

## Zusammenfassung

- Der Query-Planer wählt den günstigsten Weg; der Ausführungsplan zeigt ihn.
- `EXPLAIN` plant nur, `EXPLAIN ANALYZE` führt aus und misst – Vorsicht bei schreibenden Anweisungen.
- **Seq Scan** liest alles, **Index Scan** springt gezielt; verdächtig ist ein Seq Scan bei wenigen Treffern.
- `cost=start..gesamt` sind relative Schätzungen zum Vergleichen, keine Millisekunden.
- In PhpStorm: Rechtsklick → **Explain Plan**; SQLite: `EXPLAIN QUERY PLAN` mit `SCAN` und `SEARCH`.
