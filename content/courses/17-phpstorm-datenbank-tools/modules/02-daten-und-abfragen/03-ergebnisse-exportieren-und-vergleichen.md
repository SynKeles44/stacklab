---
title: Ergebnisse exportieren und vergleichen
summary: Ergebnismengen als CSV, JSON oder SQL exportieren, in die Zwischenablage kopieren und zwei Ergebnisse miteinander vergleichen.
duration: 20
sources:
  - title: PhpStorm-Hilfe – Query results
    url: https://www.jetbrains.com/help/phpstorm/viewing-query-results.html
  - title: PhpStorm-Hilfe – Export
    url: https://www.jetbrains.com/help/phpstorm/export-data.html
  - title: PhpStorm-Hilfe – Data extractors
    url: https://www.jetbrains.com/help/phpstorm/data-extractors.html
  - title: PhpStorm-Hilfe – Compare the data of database objects
    url: https://www.jetbrains.com/help/phpstorm/compare-data.html
  - title: SQLite-Dokumentation – Changing Output Formats
    url: https://sqlite.org/cli.html#changing_output_formats
quiz:
  - type: single
    question: Was bestimmt der „Data Extractor“ in PhpStorm?
    options:
      - Welche Zeilen exportiert werden
      - In welchem Format Daten exportiert oder kopiert werden (CSV, JSON, SQL …)
      - Welche Datenbank verbunden ist
    answer: 1
    explanation: Der Extractor ist das Ausgabeformat. Er gilt beim Export in eine Datei und auch beim Kopieren in die Zwischenablage.
  - type: multiple
    question: Welche Wege führen zu einer CSV-Datei mit dem Ergebnis einer Abfrage?
    options:
      - Im Ergebnis auf Export Data klicken, Extractor CSV wählen, Export to File
      - Rechtsklick auf das SELECT-Statement → Execute to File → CSV
      - Rechtsklick auf die Tabelle im Database-Fenster → Import/Export → Export Data to File
      - Ctrl+S im Ergebnisfenster
    answers: [0, 1, 2]
    explanation: Alle drei Wege nutzen denselben Export-Dialog. Ctrl+S speichert nur Dateien im Editor, keine Ergebnisse.
  - type: cloze
    text: "Im Programm sqlite3 schaltest du mit `.mode ___` auf kommagetrennte Ausgabe und mit `.headers ___` auf eine Kopfzeile."
    blanks:
      - [csv]
      - ["on"]
    explanation: "`.mode csv` plus `.headers on` erzeugt eine CSV-Datei mit Spaltennamen in der ersten Zeile. `.once datei.csv` leitet die nächste Ausgabe in eine Datei um."
  - type: single
    question: Wozu dient „Compare Data“ im Services-Tool-Fenster?
    options:
      - Es vergleicht zwei Ergebnismengen Zeile für Zeile und zeigt die Unterschiede als Diff.
      - Es vergleicht die Struktur zweier Datenbanken.
      - Es misst, welche Abfrage schneller war.
    answer: 0
    explanation: Compare Data vergleicht Daten. Für die Struktur gibt es Compare Structure With – das kommt in der nächsten Lektion.
tasks:
  - id: format-zuordnen
    type: dragdrop
    title: Welches Exportformat passt?
    description: Ordne jedem Zweck den passenden Data Extractor zu.
    targets:
      - { id: tabelle, label: "Fachabteilung will die Liste in einer Tabellenkalkulation öffnen" }
      - { id: api, label: "Testdaten für eine JavaScript-Anwendung" }
      - { id: seed, label: "Dieselben Zeilen in eine andere Datenbank einspielen" }
      - { id: ticket, label: "Ergebnis lesbar in ein Ticket oder eine README einfügen" }
    items:
      - { label: "CSV", target: tabelle }
      - { label: "JSON", target: api }
      - { label: "SQL Inserts", target: seed }
      - { label: "Markdown", target: ticket }
  - id: export-csv-json
    type: terminal
    title: Offene Bestellungen exportieren
    description: |
      In PhpStorm würdest du das Ergebnis über **Export Data** speichern. Hier machst du dasselbe mit
      `sqlite3`. Vorbereitet ist `shop.db`.

      Klicke auf **Aufgabe vorbereiten** und erzeuge dann:

      1. `offen.csv` – alle Bestellungen mit `status = 'open'`, Spalten `id`, `customer_id`, `total`,
         sortiert nach `id`, **mit Kopfzeile**.
      2. `offen.json` – dieselben Zeilen und Spalten als JSON-Array.

      Tipp: `sqlite3 -csv -header` und `sqlite3 -json` steuern das Format direkt beim Aufruf.
    workdir: export-csv-json
    setup: |
      sqlite3 shop.db <<'SQL'
      CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, status TEXT NOT NULL, total REAL NOT NULL);
      INSERT INTO orders (customer_id, status, total) VALUES (1, 'paid', 49.90), (1, 'open', 12.00), (2, 'paid', 99.00), (3, 'open', 5.50), (2, 'open', 3.20), (3, 'cancelled', 8.00);
      SQL
    checks:
      - type: command
        run: head -n 1 offen.csv | tr -d '\r'
        stdout_equals: "id,customer_id,total"
        message: Die erste Zeile von offen.csv muss die Kopfzeile id,customer_id,total sein.
      - type: command
        run: tail -n +2 offen.csv | tr -d '\r' | tr '\n' ' '
        stdout_matches: "^2,1,12\\.0 4,3,5\\.5 5,2,3\\.2$"
        message: In offen.csv sollen genau die drei offenen Bestellungen 2, 4 und 5 stehen, sortiert nach id.
      - type: command
        run: jq -r 'map(.id) | join(",")' offen.json
        stdout_equals: "2,4,5"
        message: offen.json ist kein gültiges JSON-Array mit den Bestellungen 2, 4 und 5.
      - type: command
        run: jq -r '.[0] | keys_unsorted | join(",")' offen.json
        stdout_equals: "id,customer_id,total"
        message: Die JSON-Objekte sollen genau die Felder id, customer_id und total haben.
    hints:
      - "Die Abfrage ist für beide Dateien gleich: `SELECT id, customer_id, total FROM orders WHERE status = 'open' ORDER BY id;`"
      - "Leite die Ausgabe mit `>` in die Datei um: `sqlite3 -csv -header shop.db \"…\" > offen.csv`"
      - "Für JSON nur die Option tauschen: `sqlite3 -json shop.db \"…\" > offen.json`"
    solution: |
      ```bash
      Q="SELECT id, customer_id, total FROM orders WHERE status = 'open' ORDER BY id;"
      sqlite3 -csv -header shop.db "$Q" > offen.csv
      sqlite3 -json shop.db "$Q" > offen.json
      cat offen.csv
      jq . offen.json
      ```
---
Die Abfrage steht, das Ergebnis stimmt – und jetzt? Die Kollegin aus dem Support möchte die Liste als
Tabelle, das Frontend-Team braucht Testdaten als JSON, und du willst wissen, ob dein Skript wirklich nur
die erwarteten Zeilen geändert hat. In dieser Lektion lernst du, was du mit einer
[[ergebnismenge|Ergebnismenge]] alles anfangen kannst.

## Das Ergebnisfenster

Jedes `SELECT` aus einer Query-Konsole landet als eigener Reiter im **Services**-Tool-Fenster
(**View | Tool Windows | Services**). Ein paar Handgriffe machen die Arbeit leichter:

- **Pin Tab**: Rechtsklick auf den Ergebnis-Reiter → **Pin Tab**. Das Ergebnis bleibt erhalten, auch wenn
  du die nächste Abfrage ausführst.
- **Sortieren**: Klick auf den Spaltenkopf. Bei Abfrage-Ergebnissen sortiert PhpStorm lokal – die Datenbank
  wird nicht erneut gefragt.
- **Transponieren**: Breite Zeilen mit vielen Spalten lassen sich gedreht anzeigen, eine Spalte pro Zeile.
  Das ist praktisch, um einen einzelnen Datensatz zu lesen.
- **Kopieren**: Zellen markieren und Ctrl+C (macOS ⌘C). Kopiert wird im aktuell gewählten Format.

> [!MERKSATZ]
> Ein Ergebnis ist eine Momentaufnahme. Es aktualisiert sich nicht von selbst – führe die Abfrage erneut
> aus, wenn sich die Daten geändert haben könnten.

## Exportieren mit Data Extractors

Das Format eines Exports bestimmt der [[data-extractor|Data Extractor]]. PhpStorm bringt unter anderem mit:

| Extractor | Ergebnis | Typischer Zweck |
|---|---|---|
| [[csv|CSV]] / TSV | Werte mit Trennzeichen | Tabellenkalkulation, Import |
| [[json|JSON]] | Array von Objekten | Testdaten, APIs |
| SQL Inserts | `INSERT INTO …`-Zeilen | Daten in andere DB übertragen |
| Markdown | Tabelle in Markdown | Tickets, Doku |

So exportierst du ein Ergebnis in eine Datei:

1. Im Ergebnis auf **Export Data** klicken (Pfeil-Symbol in der Werkzeugleiste).
2. Im Dialog bei **Extractor** z. B. `CSV` wählen, ggf. **Add column header** anhaken.
3. Ziel bei **Output file** eintragen.
4. **Export to File** klicken – oder **Export Table to Clipboard** für die Zwischenablage.

Alternativen: Rechtsklick auf ein `SELECT` in der Konsole → **Execute to File**, oder Rechtsklick auf
eine Tabelle im Database-Fenster → **Import/Export → Export Data to File**.

## Dasselbe auf der Kommandozeile

Auch `sqlite3` kennt Ausgabeformate. Das ist nützlich für Skripte und Automatisierung:

```bash title="Terminal"
sqlite3 -csv -header shop.db "SELECT id, total FROM orders;" > orders.csv
sqlite3 -json shop.db "SELECT id, total FROM orders;" > orders.json
```

Innerhalb von `sqlite3` geht es mit Punkt-Befehlen:

```text title="sqlite3"
sqlite> .headers on
sqlite> .mode csv
sqlite> .once orders.csv
sqlite> SELECT id, total FROM orders;
```

`.once` leitet nur die **nächste** Ausgabe in eine Datei um, `.output datei` alle folgenden.

> [!FEHLER]
> Eine CSV-Datei ohne Kopfzeile verschicken. Die Empfängerin sieht dann nur Zahlenkolonnen und muss raten,
> was `12.0` bedeutet. Setze in PhpStorm **Add column header**, in `sqlite3` `-header` bzw. `.headers on`.

## Ergebnisse vergleichen

Manchmal ist die spannende Frage: **Was hat sich geändert?** Etwa vor und nach einem Korrektur-Skript.

1. Führe die Abfrage aus und **pinne** den Ergebnis-Reiter.
2. Führe dein Skript aus und danach dieselbe Abfrage noch einmal.
3. Im Services-Fenster: **Compare Data** auf dem einen Ergebnis wählen und das andere als Gegenstück
   auswählen.

PhpStorm zeigt beide Ergebnisse im Diff-Viewer nebeneinander, Unterschiede sind farbig markiert. Das
funktioniert auch für zwei Tabellen, etwa lokal gegen Testumgebung.

> [!PRAXIS]
> Vor einer Datenkorrektur exportierst du die betroffenen Zeilen als SQL Inserts oder CSV. Geht etwas schief,
> hast du den alten Stand – und für das Ticket einen Beleg, was vorher drinstand.

## Zusammenfassung

- Ergebnisse erscheinen im **Services**-Fenster; **Pin Tab** hält sie fest.
- Das Exportformat heißt **Data Extractor**: CSV, JSON, SQL Inserts, Markdown und mehr.
- Export: **Export Data → Extractor → Export to File**, oder **Execute to File** direkt aus der Konsole.
- `sqlite3 -csv -header` und `sqlite3 -json` exportieren auf der Kommandozeile.
- **Compare Data** zeigt die Unterschiede zwischen zwei Ergebnismengen als Diff.
