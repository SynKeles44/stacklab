---
title: Der Daten-Editor
summary: Tabellen öffnen, mit WHERE und ORDER BY filtern und sortieren, Zellen bearbeiten – und verstehen, wann Änderungen wirklich in der Datenbank landen.
duration: 20
sources:
  - title: PhpStorm-Hilfe – Data editor and viewer
    url: https://www.jetbrains.com/help/phpstorm/data-editor-and-viewer.html
  - title: PhpStorm-Hilfe – Filter data
    url: https://www.jetbrains.com/help/phpstorm/tables-filter.html
  - title: PhpStorm-Hilfe – Sort data
    url: https://www.jetbrains.com/help/phpstorm/tables-sort.html
  - title: PhpStorm-Hilfe – Submit changes to a database
    url: https://www.jetbrains.com/help/phpstorm/submitting-and-reverting-changes.html
  - title: SQLite-Dokumentation – UPDATE, INSERT, DELETE
    url: https://sqlite.org/lang_update.html
quiz:
  - type: single
    question: Du hast im Daten-Editor drei Zellen geändert. Was ist danach in der Datenbank passiert?
    options:
      - Alle drei Änderungen sind sofort gespeichert.
      - Noch nichts – erst Submit (Ctrl+Enter / ⌘↩) schickt die Änderungen.
      - PhpStorm speichert automatisch nach 30 Sekunden.
    answer: 1
    explanation: Geänderte Zellen sind zunächst nur lokal markiert (blau). Erst Submit erzeugt die DML-Anweisungen und schickt sie an die Datenbank.
  - type: cloze
    text: "Im Filterfeld des Daten-Editors tippst du die Bedingung ohne das Schlüsselwort ___, zum Beispiel `status = 'open'`."
    blanks:
      - [WHERE]
    explanation: Das Feld heißt WHERE und erwartet nur die Bedingung selbst. Genauso erwartet das ORDER-BY-Feld nur `total DESC`.
  - type: match
    question: Ordne die Farbe einer Zeile oder Zelle im Daten-Editor ihrer Bedeutung zu.
    pairs:
      - { left: "Blau", right: "Wert geändert, noch nicht gesendet" }
      - { left: "Grün", right: "Neue Zeile" }
      - { left: "Rot / durchgestrichen", right: "Zeile zum Löschen markiert" }
    explanation: Die Farben zeigen ausstehende Änderungen. Mit Revert Selected nimmst du sie zurück, mit Submit schickst du sie ab.
  - type: multiple
    question: Warum braucht der Daten-Editor einen Primärschlüssel, um eine Zeile zu ändern?
    options:
      - Damit das erzeugte UPDATE genau eine Zeile trifft (WHERE id = …).
      - Weil SQL ohne Primärschlüssel kein UPDATE kennt.
      - Ohne eindeutige Kennung könnten mehrere gleiche Zeilen gleichzeitig geändert werden.
      - Weil der Primärschlüssel die Farbe der Zeile bestimmt.
    answers: [0, 2]
    explanation: Der Editor übersetzt deine Änderung in `UPDATE … WHERE <Schlüssel> = …`. Ohne eindeutigen Schlüssel ist nicht klar, welche Zeile gemeint ist.
tasks:
  - id: editor-knoepfe
    type: dragdrop
    title: Welcher Knopf macht was?
    description: Ordne die Knöpfe und Felder des Daten-Editors ihrer Funktion zu.
    targets:
      - { id: senden, label: "Änderungen an die Datenbank schicken" }
      - { id: vorschau, label: "Erzeugtes SQL vor dem Senden ansehen" }
      - { id: zurueck, label: "Lokale Änderung verwerfen" }
      - { id: filtern, label: "Nur bestimmte Zeilen laden" }
      - { id: neu, label: "Leere Zeile anhängen" }
    items:
      - { label: "Submit (Ctrl+Enter / ⌘↩)", target: senden }
      - { label: "Preview Pending Changes", target: vorschau }
      - { label: "Revert Selected (Ctrl+Alt+Z / ⌥⌘Z)", target: zurueck }
      - { label: "WHERE-Feld", target: filtern }
      - { label: "Add Row (Alt+Insert / ⌘N)", target: neu }
  - id: dml-von-hand
    type: terminal
    title: Schreibe das SQL, das der Daten-Editor erzeugen würde
    description: |
      Im Daten-Editor klickst du, PhpStorm erzeugt daraus [[dml|DML]]. Hier schreibst du diese Anweisungen
      selbst. Vorbereitet ist `shop.db` mit den Tabellen `customers` und `orders`.

      Klicke auf **Aufgabe vorbereiten** und führe dann mit `sqlite3 shop.db` aus:

      1. Die Bestellung mit `id = 2` hat den falschen Betrag: Setze `total` auf `15.00`.
      2. Die Bestellung mit `id = 4` wurde doppelt angelegt: Lösche sie.
      3. Lege für den Kunden mit `id = 3` eine neue Bestellung an: `status` `'open'`, `total` `29.90`,
         `created_at` `'2026-10-09'`.

      Ändere keine anderen Zeilen.
    workdir: dml-von-hand
    setup: |
      sqlite3 shop.db <<'SQL'
      CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE);
      CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(id), status TEXT NOT NULL, total REAL NOT NULL, created_at TEXT NOT NULL);
      INSERT INTO customers (name, email) VALUES ('Ada', 'ada@example.com'), ('Linus', 'linus@example.com'), ('Grace', 'grace@example.com');
      INSERT INTO orders (customer_id, status, total, created_at) VALUES (1, 'paid', 49.90, '2026-09-01'), (1, 'open', 1.50, '2026-09-14'), (2, 'paid', 99.00, '2026-09-20'), (2, 'paid', 99.00, '2026-09-20'), (3, 'open', 5.50, '2026-10-02');
      SQL
    checks:
      - type: command
        run: sqlite3 shop.db "SELECT printf('%.2f', total) FROM orders WHERE id = 2;"
        stdout_equals: "15.00"
        message: Bestellung 2 hat noch nicht den Betrag 15.00. Nutze UPDATE … SET total = 15.00 WHERE id = 2.
      - type: command
        run: sqlite3 shop.db "SELECT count(*) FROM orders WHERE id = 4;"
        stdout_equals: "0"
        message: Bestellung 4 existiert noch. Lösche sie mit DELETE … WHERE id = 4.
      - type: command
        run: sqlite3 shop.db "SELECT count(*) FROM orders WHERE customer_id = 3 AND status = 'open' AND total = 29.90 AND created_at = '2026-10-09';"
        stdout_equals: "1"
        message: Die neue Bestellung für Kunde 3 (open, 29.90, 2026-10-09) fehlt noch – oder sie wurde mehrfach angelegt.
      - type: command
        run: sqlite3 shop.db "SELECT count(*) || '|' || printf('%.2f', sum(total)) FROM orders WHERE id IN (1, 3, 5);"
        stdout_equals: "3|154.40"
        message: Die Bestellungen 1, 3 und 5 sollten unverändert bleiben. Hast du ein WHERE vergessen?
    hints:
      - "Jede Änderung ist eine eigene Anweisung: UPDATE, DELETE, INSERT – immer mit WHERE auf die id, außer beim INSERT."
      - "`UPDATE orders SET total = 15.00 WHERE id = 2;`"
      - "`INSERT INTO orders (customer_id, status, total, created_at) VALUES (3, 'open', 29.90, '2026-10-09');`"
    solution: |
      ```bash
      sqlite3 shop.db "UPDATE orders SET total = 15.00 WHERE id = 2;"
      sqlite3 shop.db "DELETE FROM orders WHERE id = 4;"
      sqlite3 shop.db "INSERT INTO orders (customer_id, status, total, created_at) VALUES (3, 'open', 29.90, '2026-10-09');"
      sqlite3 shop.db "SELECT * FROM orders;"
      ```
---
Ein Kunde ruft an: Seine Bestellung zeigt den falschen Betrag. Du willst schnell die Zeile finden, den
Wert prüfen und korrigieren – ohne erst eine `UPDATE`-Anweisung zu tippen. Dafür gibt es den
[[daten-editor|Daten-Editor]]: eine Tabellenansicht, die sich fast wie eine Tabellenkalkulation bedienen
lässt. Fast – denn ein paar Regeln entscheiden darüber, ob deine Änderung wirklich ankommt.

## Eine Tabelle öffnen

1. Öffne das Database-Tool-Fenster (**View | Tool Windows | Database**).
2. Klappe Datenquelle → Datenbank → Schema → `tables` auf.
3. **Doppelklicke** auf die Tabelle, z. B. `orders`.

PhpStorm öffnet einen neuen Editor-Tab mit den Zeilen der Tabelle. Standardmäßig lädt der Editor nur die
ersten 500 Zeilen; mit den Pfeilen in der Werkzeugleiste blätterst du weiter. Die Seitengröße stellst du
unter **Settings | Tools | Database | Data Editor and Viewer** ein.

![Schema des Daten-Editors mit Werkzeugleiste, Filterfeldern, markierten Änderungen und DML-Vorschau](/assets/phpstorm-datenbank-tools/daten-editor.svg)

Jede Zeile ist ein [[datensatz|Datensatz]], jede Spalte hat einen festen Typ. Ganz links erkennst du am
Schlüsselsymbol den [[primaerschluessel|Primärschlüssel]], meist `id`.

## Filtern und sortieren

Über der Tabelle liegen zwei Felder:

| Feld | Du tippst | Daraus wird |
|---|---|---|
| **WHERE** | `status = 'open'` | `… WHERE status = 'open'` |
| **ORDER BY** | `total DESC` | `… ORDER BY total DESC` |

Du schreibst also nur die Bedingung, **ohne** das Schlüsselwort, und drückst Enter. PhpStorm schickt eine
neue Abfrage an die Datenbank. Auch `LIKE` funktioniert: `email LIKE '%@example.com'`.

Sortieren geht noch schneller: Klicke auf das Sortiersymbol im Spaltenkopf. Ein zweiter Klick dreht die
Richtung um.

Siehst du die Filterzeile nicht, blendest du sie über das Optionsmenü (Zahnrad) mit **Show Filter** ein.

> [!TIPP]
> Filter und Sortierung im Kopf des Daten-Editors laufen **auf dem Server**. Das ist wichtig bei großen
> Tabellen: Du bekommst die richtigen 500 Zeilen, nicht irgendwelche 500, die dann lokal gefiltert werden.

## Daten bearbeiten

- **Zelle ändern**: Doppelklick in die Zelle (oder Enter), neuen Wert tippen, Enter.
- **Zeile hinzufügen**: **Add Row** (Alt+Insert, macOS ⌘N).
- **Zeile löschen**: Zeile markieren, **Delete Row** (Ctrl+Y, macOS ⌘⌫).

Danach passiert in der Datenbank **noch nichts**. PhpStorm markiert die Änderungen farbig: blau geändert,
grün neu, rot gelöscht. Erst **Submit** (Ctrl+Enter, macOS ⌘↩) schickt sie ab.

Vorher lohnt ein Blick auf **Preview Pending Changes**. Dort siehst du die [[dml|DML]]-Anweisungen, die
PhpStorm erzeugt:

```sql title="DML-Vorschau"
UPDATE orders SET total = 129.90 WHERE id = 17;
DELETE FROM orders WHERE id = 23;
INSERT INTO orders (customer_id, status, total) VALUES (99, 'open', 5.00);
```

Hast du dich vertan, markiere die Zelle und wähle **Revert Selected** (Ctrl+Alt+Z, macOS ⌥⌘Z).

> [!MERKSATZ]
> Bearbeiten markiert nur. **Submit** schreibt. Und jedes `UPDATE` trifft die Zeile über ihren
> Primärschlüssel.

## Typische Stolperfallen

> [!FEHLER]
> Werte ändern, Tab schließen, Feierabend – und am nächsten Tag ist nichts gespeichert. PhpStorm fragt
> beim Schließen zwar nach, aber wer schnell „Discard“ klickt, verliert die Änderungen. Gewöhne dir an,
> nach jeder Änderung bewusst **Submit** zu drücken.

Weitere Fallen:

- **Keine eindeutige Spalte**: Hat eine Tabelle keinen Primärschlüssel, kann PhpStorm eine Zeile nicht
  sicher treffen. Ändere solche Tabellen lieber gezielt per SQL.
- **Auto-Commit**: Steht in der Werkzeugleiste **Tx: Auto**, ist nach Submit alles endgültig. Wie du das mit
  **Tx: Manual** absicherst, lernst du im Modul zu Transaktionen.
- **Falsche Datenquelle**: Prüfe im Tab-Titel, ob du wirklich in der lokalen Datenbank bist.

> [!PRAXIS]
> Für einzelne Korrekturen in der Entwicklungs-Datenbank ist der Daten-Editor ideal. Datenkorrekturen auf
> geteilten Umgebungen schreiben viele Teams dagegen als SQL-Skript, lassen es reviewen und führen es
> nachvollziehbar aus.

## Tastenkürzel dieser Lektion

| Aktion | Windows/Linux | macOS |
|---|---|---|
| Zeile hinzufügen | Alt+Insert | ⌘N |
| Zeile löschen | Ctrl+Y | ⌘⌫ |
| Änderung verwerfen | Ctrl+Alt+Z | ⌥⌘Z |
| Änderungen senden (Submit) | Ctrl+Enter | ⌘↩ |
| Filterzeile ein/aus | Ctrl+Alt+Shift+F | ⌥⇧⌘F |

## Zusammenfassung

- Doppelklick auf eine Tabelle öffnet den Daten-Editor mit den ersten 500 Zeilen.
- **WHERE** und **ORDER BY** nehmen die Bedingung ohne Schlüsselwort und laufen auf dem Server.
- Änderungen sind erst farbig markiert; **Submit** schickt sie als DML an die Datenbank.
- **Preview Pending Changes** zeigt das erzeugte SQL, **Revert Selected** verwirft lokale Änderungen.
- Der Editor braucht einen Primärschlüssel, um Zeilen eindeutig zu treffen.
