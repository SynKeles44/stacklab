---
title: Mit Indizes beschleunigen
summary: Einen passenden Index anlegen, den Plan vorher und nachher vergleichen und erkennen, wann ein Index nicht hilft.
duration: 25
sources:
  - title: PostgreSQL-Dokumentation – Indexes
    url: https://www.postgresql.org/docs/current/indexes.html
  - title: PostgreSQL-Dokumentation – Multicolumn Indexes
    url: https://www.postgresql.org/docs/current/indexes-multicolumn.html
  - title: SQLite-Dokumentation – CREATE INDEX
    url: https://sqlite.org/lang_createindex.html
  - title: SQLite-Dokumentation – Query Planning
    url: https://sqlite.org/queryplanner.html
  - title: PhpStorm-Hilfe – Query execution plan
    url: https://www.jetbrains.com/help/phpstorm/query-execution-plan.html
quiz:
  - type: single
    question: Welcher Index hilft der Abfrage `SELECT * FROM orders WHERE customer_id = 42 AND status = 'open'` am meisten?
    options:
      - "CREATE INDEX ON orders (total)"
      - "CREATE INDEX ON orders (customer_id, status)"
      - "CREATE INDEX ON orders (created_at)"
    answer: 1
    explanation: Ein zusammengesetzter Index auf genau die beiden Spalten aus dem WHERE erlaubt es, die passenden Zeilen direkt zu finden.
  - type: multiple
    question: In welchen Fällen kann ein normaler Index auf `email` NICHT genutzt werden?
    options:
      - "WHERE email = 'ada@example.com'"
      - "WHERE lower(email) = 'ada@example.com'"
      - "WHERE email LIKE '%@example.com'"
      - "WHERE email LIKE 'ada%'"
    answers: [1, 2]
    explanation: Eine Funktion um die Spalte und ein Platzhalter am Anfang verhindern die Suche im sortierten Index. Ein Präfix wie 'ada%' kann je nach Datenbank und Einstellung genutzt werden.
  - type: single
    question: "Es gibt einen Index auf `(customer_id, status)`. Welche Abfrage kann ihn NICHT gezielt nutzen?"
    options:
      - "WHERE customer_id = 42"
      - "WHERE customer_id = 42 AND status = 'open'"
      - "WHERE status = 'open'"
    answer: 2
    explanation: Ein zusammengesetzter Index ist nach der ersten Spalte sortiert, wie ein Telefonbuch nach Nachnamen. Ohne die erste Spalte fehlt der Einstieg.
  - type: find-bug
    question: Nach dem Anlegen des Index zeigt der Plan weiterhin `SCAN orders`. Welche Zeile verhindert die Nutzung?
    language: sql
    code: |
      CREATE INDEX idx_orders_created ON orders (created_at);

      SELECT id, total
      FROM orders
      WHERE substr(created_at, 1, 7) = '2026-09';
    bug_line: 5
    explanation: "`substr(created_at, …)` verändert den Spaltenwert, bevor verglichen wird – der Index enthält aber die Originalwerte. Besser: `WHERE created_at >= '2026-09-01' AND created_at < '2026-10-01'`."
tasks:
  - id: index-anlegen
    type: terminal
    title: Eine langsame Abfrage mit einem Index beschleunigen
    description: |
      Vorbereitet ist `shop.db` mit 50 000 Bestellungen, aber **ohne** Index. Diese Abfrage aus der
      Kundenansicht ist langsam:

      ```sql
      SELECT id, total FROM orders WHERE customer_id = 42 AND status = 'open';
      ```

      Klicke auf **Aufgabe vorbereiten** und dann:

      1. Speichere den Plan **vor** der Optimierung in `vorher.txt` (`EXPLAIN QUERY PLAN …`).
      2. Lege einen **zusammengesetzten Index** mit dem Namen `idx_orders_customer_status` auf
         `customer_id` und `status` an.
      3. Speichere den Plan **nach** der Optimierung in `nachher.txt`.

      Optional: Mit `.timer on` in `sqlite3` siehst du die Laufzeit vorher und nachher.
    workdir: index-anlegen
    setup: |
      sqlite3 shop.db <<'SQL'
      CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, status TEXT NOT NULL, total REAL NOT NULL);
      WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 50000)
      INSERT INTO orders (customer_id, status, total)
      SELECT i % 1000, CASE i % 3 WHEN 0 THEN 'open' ELSE 'paid' END, (i % 97) + 0.5 FROM n;
      SQL
    checks:
      - type: file_contains
        path: vorher.txt
        pattern: "SCAN orders"
        message: vorher.txt soll den Plan ohne Index enthalten (SCAN orders). Hast du den Plan vor dem CREATE INDEX gespeichert?
      - type: command
        run: sqlite3 shop.db "SELECT group_concat(name, ',') FROM pragma_index_info('idx_orders_customer_status');"
        stdout_equals: "customer_id,status"
        message: Der Index idx_orders_customer_status auf (customer_id, status) fehlt noch – oder die Spalten stehen in anderer Reihenfolge.
      - type: file_contains
        path: nachher.txt
        pattern: "SEARCH orders USING INDEX idx_orders_customer_status \\(customer_id=\\? AND status=\\?\\)"
        message: nachher.txt soll den Plan mit dem neuen Index enthalten (SEARCH … USING INDEX idx_orders_customer_status).
      - type: command
        run: sqlite3 shop.db "SELECT count(*) FROM orders;"
        stdout_equals: "50000"
        message: Die Tabelle soll weiterhin 50 000 Bestellungen enthalten.
    hints:
      - "Reihenfolge: erst Plan speichern, dann Index anlegen, dann wieder Plan speichern."
      - "`CREATE INDEX idx_orders_customer_status ON orders (customer_id, status);`"
      - "`sqlite3 shop.db \"EXPLAIN QUERY PLAN SELECT id, total FROM orders WHERE customer_id = 42 AND status = 'open';\" > nachher.txt`"
    solution: |
      ```bash
      Q="SELECT id, total FROM orders WHERE customer_id = 42 AND status = 'open';"
      sqlite3 shop.db "EXPLAIN QUERY PLAN $Q" > vorher.txt
      sqlite3 shop.db "CREATE INDEX idx_orders_customer_status ON orders (customer_id, status);"
      sqlite3 shop.db "EXPLAIN QUERY PLAN $Q" > nachher.txt
      cat vorher.txt nachher.txt
      ```
  - id: optimierungs-ablauf
    type: order
    title: Der Ablauf einer Optimierung
    description: >
      Eine Abfrage ist zu langsam. Bring die Schritte in die Reihenfolge, in der du sie sauber und
      nachvollziehbar optimierst.
    items:
      - "Die langsame Abfrage in eine Query-Konsole kopieren"
      - "Explain Plan ausführen und den Plan sichern (Pin Tab)"
      - "Im Plan den teuren Knoten finden, z. B. einen Seq Scan mit wenigen Treffern"
      - "Einen passenden Index anlegen"
      - "Explain Plan erneut ausführen und mit dem alten Plan vergleichen"
      - "Prüfen, dass die Abfrage dasselbe Ergebnis liefert"
      - "Befund und Index-Änderung dokumentieren (z. B. als Migration)"
    hints:
      - Erst messen, dann ändern, dann wieder messen.
---
Im letzten Kapitel hast du gesehen, **dass** eine Abfrage die ganze Tabelle liest. Jetzt sorgst du dafür,
dass sie es nicht mehr muss. Das wichtigste Werkzeug dafür ist ein [[datenbank-index|Index]] – und das
wichtigste Prinzip: erst messen, dann ändern, dann wieder messen.

## Wie ein Index hilft

Stell dir ein dickes Fachbuch vor. Suchst du alle Stellen zu „Transaktion“, kannst du jede Seite lesen –
oder hinten im Stichwortverzeichnis nachschlagen und direkt zu den Seiten springen. Ein Datenbank-Index ist
dieses Stichwortverzeichnis: eine **sortierte** Liste der Werte einer Spalte, jeweils mit Verweis auf die
Zeile.

```sql title="Index anlegen"
CREATE INDEX idx_orders_customer ON orders (customer_id);
```

Konvention für den Namen: `idx_<tabelle>_<spalten>`. So erkennst du im Plan sofort, welcher Index benutzt
wird.

In PhpStorm geht es auch per Klick: Rechtsklick auf die Tabelle im Database-Fenster → **New** → **Index**
(Alt+Insert, macOS ⌘N). Der Dialog zeigt dir vor dem Ausführen das erzeugte SQL.

> [!MERKSATZ]
> Ein Index beschleunigt das **Finden** (WHERE, [[join|JOIN]], ORDER BY) und verlangsamt das **Schreiben** ein wenig,
> weil bei jedem INSERT und UPDATE auch der Index gepflegt werden muss.

## Messen: vorher und nachher

Gute Optimierung ist nachvollziehbar. So gehst du vor:

1. Plan der langsamen Abfrage ansehen und sichern (PhpStorm: **Explain Plan**, dann **Pin Tab**).
2. Index anlegen.
3. Plan erneut ansehen und vergleichen.
4. Prüfen, dass das Ergebnis gleich bleibt.

Mit SQLite sieht der Unterschied so aus:

```text title="Vorher"
QUERY PLAN
`--SCAN orders
```

```text title="Nachher"
QUERY PLAN
`--SEARCH orders USING INDEX idx_orders_customer_status (customer_id=? AND status=?)
```

Zum Üben brauchst du große Tabellen. Testdaten erzeugst du mit einer [[rekursive-cte|rekursiven CTE]]:

```sql title="50 000 Testzeilen"
WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 50000)
INSERT INTO orders (customer_id, status, total)
SELECT i % 1000, CASE i % 3 WHEN 0 THEN 'open' ELSE 'paid' END, i % 97 FROM n;
```

In `sqlite3` zeigt `.timer on` zusätzlich die Laufzeit jeder Abfrage.

## Mehrere Spalten: die Reihenfolge zählt

Filtert eine Abfrage nach zwei Spalten, hilft ein [[zusammengesetzter-index|zusammengesetzter Index]]:

```sql title="Zwei Spalten"
CREATE INDEX idx_orders_customer_status ON orders (customer_id, status);
```

Er ist zuerst nach `customer_id` sortiert, innerhalb davon nach `status` – wie ein Telefonbuch nach Nachname,
dann Vorname. Daraus folgt:

| Abfrage filtert nach | Index nutzbar? |
|---|---|
| `customer_id` | ja |
| `customer_id` und `status` | ja, optimal |
| nur `status` | nein, der Einstieg fehlt |

> [!TIPP]
> Stell die Spalte nach vorn, nach der am häufigsten **mit Gleichheit** gefiltert wird. Bereichsbedingungen
> wie `created_at >= …` gehören eher ans Ende.

## Wenn ein Index nicht hilft

Ein Index existiert, aber der Plan zeigt weiter einen Seq Scan? Typische Gründe:

- **Funktion um die Spalte**: `WHERE lower(email) = …` oder `substr(created_at, 1, 7) = …`. Der Index enthält
  die Originalwerte.
- **Platzhalter am Anfang**: `LIKE '%@example.com'` – ein sortiertes Verzeichnis hilft nicht, wenn das Ende
  gesucht wird.
- **Zu viele Treffer**: Trifft die Bedingung die Hälfte der Tabelle, ist Komplettlesen günstiger.
- **Veraltete Statistiken**: Der Planer schätzt falsch – `ANALYZE` aktualisiert sie.

> [!FEHLER]
> Auf Verdacht jede Spalte indizieren. Jeder Index kostet Speicher und Schreibzeit, und der Planer nutzt
> ohnehin nur die passenden. Lege Indizes gezielt für Abfragen an, die du **gemessen** hast.

> [!PRAXIS]
> In Framework-Projekten legst du den Index nicht von Hand in der IDE an, sondern als Migration im
> Repository. PhpStorm dient zum Ausprobieren und Messen; die Migration macht die Änderung für alle
> Umgebungen reproduzierbar. Auf großen PostgreSQL-Tabellen nutzt man dafür `CREATE INDEX CONCURRENTLY`,
> damit die Tabelle während des Aufbaus beschreibbar bleibt.

## Tastenkürzel dieser Lektion

| Aktion | Windows/Linux | macOS |
|---|---|---|
| Neues Objekt (z. B. Index) | Alt+Insert | ⌘N |
| Statement ausführen | Ctrl+Enter | ⌘↩ |
| Plan als Diagramm | Ctrl+Alt+Shift+U | ⌥⇧⌘U |
| Struktur neu laden | Ctrl+F5 | ⌘R |

## Zusammenfassung

- Ein Index ist ein sortiertes Verzeichnis: schneller finden, etwas langsamer schreiben.
- Optimieren heißt: Plan sichern, Index anlegen, Plan vergleichen, Ergebnis prüfen.
- In PhpStorm: Rechtsklick auf die Tabelle → **New → Index** (Alt+Insert / ⌘N).
- Bei zusammengesetzten Indizes entscheidet die Spaltenreihenfolge, welche Abfragen profitieren.
- Funktionen um Spalten, `LIKE '%…'` und sehr viele Treffer verhindern die Index-Nutzung.
