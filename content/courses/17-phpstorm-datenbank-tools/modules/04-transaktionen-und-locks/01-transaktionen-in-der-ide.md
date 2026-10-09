---
title: Transaktionen in der IDE
summary: Was eine Transaktion garantiert, wie Auto-Commit und manueller Modus in PhpStorm funktionieren und wann du Commit oder Roll back drückst.
duration: 25
sources:
  - title: PostgreSQL-Dokumentation – Transactions (Tutorial)
    url: https://www.postgresql.org/docs/current/tutorial-transactions.html
  - title: PostgreSQL-Dokumentation – Transaction Isolation
    url: https://www.postgresql.org/docs/current/transaction-iso.html
  - title: PhpStorm-Hilfe – Code editor tips and reference (Transaction Mode, Commit, Roll back)
    url: https://www.jetbrains.com/help/phpstorm/code-editor-tips-and-ref-db-tools-and-sql.html
  - title: PhpStorm-Hilfe – Submit changes to a database
    url: https://www.jetbrains.com/help/phpstorm/submitting-and-reverting-changes.html
  - title: PhpStorm-Hilfe – Sessions
    url: https://www.jetbrains.com/help/phpstorm/managing-connection-sessions.html
  - title: SQLite-Dokumentation – Transaction
    url: https://sqlite.org/lang_transaction.html
quiz:
  - type: single
    question: "In der Konsole steht **Tx: Auto**. Du führst `DELETE FROM orders WHERE id = 5;` aus. Kannst du das mit Roll back rückgängig machen?"
    options:
      - Ja, Roll back geht immer.
      - Nein – im Auto-Modus ist jede Anweisung sofort committet, Roll back ist nicht verfügbar.
      - Ja, aber nur innerhalb von 60 Sekunden.
    answer: 1
    explanation: Auto-Commit heißt, jede Anweisung ist eine eigene, sofort abgeschlossene Transaktion. Commit und Roll back gibt es nur im manuellen Modus.
  - type: match
    question: Ordne den ACID-Buchstaben ihre Bedeutung zu.
    pairs:
      - { left: "A – Atomarität", right: "Alles oder nichts" }
      - { left: "C – Konsistenz", right: "Regeln wie Schlüssel bleiben erfüllt" }
      - { left: "I – Isolation", right: "Parallele Transaktionen stören sich nicht unkontrolliert" }
      - { left: "D – Dauerhaftigkeit", right: "Nach dem Commit bleibt die Änderung auch nach einem Absturz" }
    explanation: Diese vier Garantien machen Transaktionen zum Sicherheitsnetz für zusammengehörige Änderungen.
  - type: cloze
    text: "Eine Transaktion beginnt mit `___` und endet entweder mit `COMMIT` oder mit `___`."
    blanks:
      - [BEGIN, "BEGIN TRANSACTION", "START TRANSACTION"]
      - [ROLLBACK]
    explanation: COMMIT macht die Änderungen dauerhaft, ROLLBACK verwirft sie komplett.
  - type: multiple
    question: "Du arbeitest in Konsole A mit **Tx: Manual** und hast ein UPDATE ausgeführt, aber noch nicht committet. Was stimmt?"
    options:
      - Du selbst siehst die Änderung in Konsole A.
      - Eine Kollegin in einer anderen Sitzung sieht die Änderung noch nicht.
      - Die geänderte Zeile ist bis zum Commit oder Roll back für andere Schreibzugriffe gesperrt.
      - Die Änderung ist schon dauerhaft gespeichert.
    answers: [0, 1, 2]
    explanation: Offene Änderungen sind nur in der eigenen Sitzung sichtbar und halten Sperren. Erst der Commit macht sie dauerhaft und für alle sichtbar.
tasks:
  - id: konsole-beschriften
    type: diagram
    title: Beschrifte die Werkzeugleiste der Query-Konsole
    description: >
      Das Bild zeigt eine vereinfachte Query-Konsole im manuellen Transaktionsmodus. Ziehe die Begriffe in die
      Kästen über den Knöpfen. Zwei Begriffe gehören nicht dazu.
    image: /assets/phpstorm-datenbank-tools/query-konsole-leer.svg
    slots:
      - { x: 9.4, y: 5, answer: Execute }
      - { x: 25, y: 5, answer: Explain Plan }
      - { x: 40.6, y: 5, answer: Query-Historie }
      - { x: 56.1, y: 5, answer: Tx-Modus }
      - { x: 71.7, y: 5, answer: Commit }
      - { x: 87.2, y: 5, answer: Roll back }
    distractors: [Submit, Add Row]
    hints:
      - Der grüne Pfeil ganz links führt aus.
      - Commit und Roll back sitzen rechts neben dem Modus-Schalter, das Häkchen bestätigt.
  - id: umbuchung
    type: terminal
    title: Eine Umbuchung als Transaktion
    description: |
      Vorbereitet ist `bank.db` mit der Tabelle `accounts` (Konten 1, 2 und 3 mit je 100.00).

      Klicke auf **Aufgabe vorbereiten** und dann:

      1. Schreibe `test-loeschen.sql`: Starte eine Transaktion, lösche **alle** Konten, gib mit
         `SELECT count(*) FROM accounts;` die Anzahl aus und verwirf die Transaktion wieder.
         Führe sie mit `sqlite3 bank.db < test-loeschen.sql` aus – sie zeigt `0`, aber danach sind alle Konten noch da.
      2. Schreibe `umbuchung.sql`: In **einer** Transaktion werden 50.00 von Konto 1 auf Konto 2 umgebucht
         (zwei UPDATEs), dann wird sie bestätigt.
      3. Führe `umbuchung.sql` **genau einmal** aus.
    workdir: umbuchung
    setup: |
      sqlite3 bank.db <<'SQL'
      CREATE TABLE accounts (id INTEGER PRIMARY KEY, owner TEXT NOT NULL, balance REAL NOT NULL);
      INSERT INTO accounts (owner, balance) VALUES ('Ada', 100.00), ('Linus', 100.00), ('Grace', 100.00);
      SQL
    checks:
      - type: file_contains
        path: test-loeschen.sql
        pattern: "^\\s*(BEGIN|begin)"
        message: test-loeschen.sql soll mit BEGIN eine Transaktion starten.
      - type: file_contains
        path: test-loeschen.sql
        pattern: "(ROLLBACK|rollback)"
        message: In test-loeschen.sql fehlt das ROLLBACK am Ende.
      - type: command
        run: sqlite3 bank.db < test-loeschen.sql
        stdout_equals: "0"
        message: test-loeschen.sql soll innerhalb der Transaktion 0 Konten zählen und sonst nichts ausgeben.
      - type: command
        run: sqlite3 bank.db "SELECT count(*) FROM accounts;"
        stdout_equals: "3"
        message: Es müssen weiterhin drei Konten existieren. Hat test-loeschen.sql vielleicht COMMIT statt ROLLBACK?
      - type: file_contains
        path: umbuchung.sql
        pattern: "(COMMIT|commit|END|end)\\s*;"
        message: umbuchung.sql soll die Transaktion mit COMMIT bestätigen.
      - type: command
        run: sqlite3 bank.db "SELECT group_concat(printf('%.2f', balance), ' ') FROM (SELECT balance FROM accounts ORDER BY id);"
        stdout_equals: "50.00 150.00 100.00"
        message: "Die Kontostände sollen 50.00, 150.00 und 100.00 sein. Wurde umbuchung.sql genau einmal ausgeführt?"
      - type: command
        run: printf '%.2f' "$(sqlite3 bank.db 'SELECT sum(balance) FROM accounts;')"
        stdout_equals: "300.00"
        message: Die Summe aller Konten muss 300.00 bleiben – Geld darf weder entstehen noch verschwinden.
    hints:
      - "Gerüst: `BEGIN;` … Anweisungen … `ROLLBACK;` bzw. `COMMIT;`"
      - "`UPDATE accounts SET balance = balance - 50 WHERE id = 1;` und dasselbe mit `+ 50` für Konto 2."
      - "Hast du umbuchung.sql versehentlich zweimal ausgeführt? Klicke auf Aufgabe vorbereiten und mach es noch einmal."
    solution: |
      ```bash
      cat > test-loeschen.sql <<'SQL'
      BEGIN;
      DELETE FROM accounts;
      SELECT count(*) FROM accounts;
      ROLLBACK;
      SQL
      sqlite3 bank.db < test-loeschen.sql
      cat > umbuchung.sql <<'SQL'
      BEGIN;
      UPDATE accounts SET balance = balance - 50 WHERE id = 1;
      UPDATE accounts SET balance = balance + 50 WHERE id = 2;
      COMMIT;
      SQL
      sqlite3 bank.db < umbuchung.sql
      sqlite3 bank.db "SELECT * FROM accounts;"
      ```
---
Du buchst 50 € von Konto 1 auf Konto 2: ein `UPDATE` zieht ab, ein zweites schreibt gut. Zwischen den beiden
bricht die Verbindung ab. Ohne Schutz sind 50 € einfach verschwunden. Genau dafür gibt es
[[transaktion|Transaktionen]] – und in PhpStorm entscheidet ein kleiner Schalter in der Werkzeugleiste, ob
du dieses Sicherheitsnetz nutzt.

## Alles oder nichts

Eine Transaktion fasst mehrere Anweisungen zusammen. Entweder gelten **alle** – oder **keine**.

```sql title="Umbuchung"
BEGIN;
UPDATE accounts SET balance = balance - 50 WHERE id = 1;
UPDATE accounts SET balance = balance + 50 WHERE id = 2;
COMMIT;
```

- `BEGIN` startet die Transaktion.
- `COMMIT` macht alle Änderungen dauerhaft.
- `ROLLBACK` verwirft alle Änderungen seit `BEGIN` – der [[rollback|Rollback]].

Datenbanken geben dafür vier Garantien, kurz [[acid|ACID]]: **A**tomarität (alles oder nichts),
**C**onsistency (Regeln bleiben erfüllt), **I**solation (parallele Transaktionen stören sich nicht
unkontrolliert) und **D**auerhaftigkeit (nach dem Commit bleibt es gespeichert).

> [!MERKSATZ]
> Was zusammengehört, gehört in eine Transaktion. Bis zum `COMMIT` ist nichts endgültig.

## Auto-Commit und manueller Modus

Die meisten Datenbank-Werkzeuge arbeiten standardmäßig mit [[auto-commit|Auto-Commit]]: Jede Anweisung ist
sofort ihre eigene, abgeschlossene Transaktion. In PhpStorm siehst du den Modus in der Werkzeugleiste der
Query-Konsole und des Daten-Editors:

| Anzeige | Bedeutung | Commit / Roll back |
|---|---|---|
| **Tx: Auto** | jede Anweisung sofort gespeichert | ausgegraut |
| **Tx: Manual** | Anweisungen sammeln sich in einer offenen Transaktion | aktiv |

So schaltest du um:

1. Klicke in der Werkzeugleiste auf **Tx: Auto** (das Menü heißt *Transaction Mode and Transaction
   Isolation*).
2. Wähle **Manual**.
3. Im selben Menü stellst du die [[isolationsebene|Isolationsebene]] ein, z. B. *Read Committed*.

![Auto-Commit und manueller Modus im Vergleich](/assets/phpstorm-datenbank-tools/transaktion-ablauf.svg)

## Commit und Roll back im manuellen Modus

Im manuellen Modus erscheinen neben dem Schalter zwei Knöpfe:

- **Commit** (Häkchen) – bestätigt die offene Transaktion.
- **Roll back** (Pfeil zurück) – verwirft alles seit dem letzten Commit.

Ein typischer, sicherer Ablauf für eine Datenkorrektur:

```sql title="console [shop@localhost] – Tx: Manual"
UPDATE orders SET status = 'cancelled' WHERE id = 3;   -- Ausführen
SELECT id, status FROM orders WHERE id IN (3, 5);       -- Ergebnis prüfen
-- passt? → Commit   |   falsch? → Roll back
```

Im Daten-Editor gilt dasselbe: **Submit** schickt deine Änderungen an die Datenbank, im manuellen Modus aber
**innerhalb** der offenen Transaktion. Erst **Commit** macht sie dauerhaft.

> [!FEHLER]
> Im manuellen Modus arbeiten und das Committen vergessen. Die Änderungen sind dann für niemanden sonst
> sichtbar, und die geänderten Zeilen bleiben **gesperrt** – andere Programme, die sie ändern wollen,
> warten. Schließe jede Transaktion bewusst mit Commit oder Roll back ab.

## Sitzungen: wer sieht was?

Jede Query-Konsole und jede geöffnete Tabelle nutzt eine eigene [[datenbank-sitzung|Sitzung]] (Session).
Du siehst sie im **Services**-Tool-Fenster unter der Datenquelle; ein grüner Punkt heißt „verbunden“. Über
das Kontextmenü einer Sitzung stellst du mit **Tx Mode** ebenfalls den Transaktionsmodus ein.

Wichtig für das Verständnis:

- Konsole A ändert eine Zeile in einer offenen Transaktion.
- Konsole A sieht den neuen Wert.
- Konsole B (andere Sitzung) sieht noch den **alten** Wert – bei PostgreSQL mit der Standard-Ebene
  *Read Committed* bis zum Commit.

> [!PRAXIS]
> Viele Teams haben die Regel: Datenquellen für geteilte Umgebungen stehen auf **Tx: Manual**. Jede Änderung
> wird erst geprüft und dann bewusst committet. Den Standard-Modus für neue Konsolen legst du in den
> Optionen der Datenquelle fest (**Data Source Properties → Options**).

## Tastenkürzel dieser Lektion

| Aktion | Windows/Linux | macOS |
|---|---|---|
| Statement ausführen | Ctrl+Enter | ⌘↩ |
| Daten-Editor: Submit | Ctrl+Enter | ⌘↩ |
| Services-Tool-Fenster | Alt+8 | ⌘8 |
| Data Source Properties | Shift+Enter | ⌘; |

Commit und Roll back haben standardmäßig kein Tastenkürzel. Wenn du sie oft brauchst, vergibst du unter
**Settings | Keymap** eigene – suche dort nach „Commit“ im Bereich *Database*.

## Zusammenfassung

- Eine Transaktion bündelt Anweisungen: `COMMIT` speichert alles, `ROLLBACK` verwirft alles.
- ACID: Atomarität, Konsistenz, Isolation, Dauerhaftigkeit.
- **Tx: Auto** speichert jede Anweisung sofort; Roll back ist dann nicht möglich.
- **Tx: Manual** sammelt Änderungen; **Commit** und **Roll back** entscheiden.
- Offene Transaktionen sind nur in der eigenen Sitzung sichtbar und halten Sperren – nicht offen liegen lassen.
