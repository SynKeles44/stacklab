---
title: Locks und Deadlocks
summary: Warum Datenbanken Zeilen sperren, wie du Wartesituationen und Deadlocks mit zwei Konsolen nachstellst und wie PostgreSQL sie meldet.
duration: 25
sources:
  - title: PostgreSQL-Dokumentation – Explicit Locking (Row-Level Locks, Deadlocks)
    url: https://www.postgresql.org/docs/current/explicit-locking.html
  - title: PostgreSQL-Dokumentation – deadlock_timeout und lock_timeout
    url: https://www.postgresql.org/docs/current/runtime-config-locks.html
  - title: PostgreSQL-Dokumentation – pg_stat_activity und pg_blocking_pids
    url: https://www.postgresql.org/docs/current/monitoring-stats.html#MONITORING-PG-STAT-ACTIVITY-VIEW
  - title: SQLite-Dokumentation – File Locking And Concurrency
    url: https://sqlite.org/lockingv3.html
  - title: PhpStorm-Hilfe – Sessions
    url: https://www.jetbrains.com/help/phpstorm/managing-connection-sessions.html
quiz:
  - type: single
    question: Konsole A hat Zeile 1 geändert, aber noch nicht committet. Konsole B will dieselbe Zeile ändern. Was passiert?
    options:
      - B überschreibt die Änderung von A sofort.
      - B wartet, bis A committet oder zurückrollt.
      - Beide Änderungen werden addiert.
    answer: 1
    explanation: A hält eine Zeilensperre. B muss warten – im Zweifel bis lock_timeout greift.
  - type: multiple
    question: Welche Maßnahmen beugen Deadlocks vor?
    options:
      - Zeilen in allen Transaktionen in derselben Reihenfolge sperren (z. B. aufsteigend nach id)
      - Transaktionen kurz halten
      - Transaktionen offen lassen, bis der Benutzer auf „Speichern“ klickt
      - In der Anwendung eine abgebrochene Transaktion kontrolliert wiederholen
    answers: [0, 1, 3]
    explanation: Gleiche Reihenfolge verhindert den Kreis, kurze Transaktionen verkleinern das Zeitfenster, und ein Wiederholungsversuch fängt die seltenen Fälle ab. Auf Benutzer zu warten verlängert Sperren unnötig.
  - type: cloze
    text: "PostgreSQL meldet einen Deadlock mit `ERROR: deadlock ___`. Wie lange es wartet, bevor es nach Deadlocks sucht, steuert der Parameter `___` (Standard 1 s)."
    blanks:
      - [detected]
      - [deadlock_timeout]
    explanation: Nach deadlock_timeout prüft PostgreSQL, ob ein Kreis vorliegt, und bricht eine der Transaktionen ab.
  - type: single
    question: Was musst du in der Konsole tun, deren Transaktion wegen eines Deadlocks abgebrochen wurde?
    options:
      - Einfach weiterarbeiten, die Transaktion läuft weiter.
      - ROLLBACK ausführen (bzw. Roll back klicken) und die Arbeit neu beginnen.
      - PhpStorm neu starten.
    answer: 1
    explanation: Die Transaktion ist abgebrochen; PostgreSQL ignoriert weitere Befehle bis zum Ende des Transaktionsblocks. Erst nach ROLLBACK geht es weiter.
tasks:
  - id: deadlock-beschriften
    type: diagram
    title: Beschrifte den Deadlock
    description: >
      Zwei Konsolen buchen gleichzeitig zwischen zwei Konten um. Die grünen Pfeile zeigen gehaltene Sperren,
      die roten gestrichelten Pfeile das Warten. Konsole A hat zuerst Konto 1 gesperrt. Ziehe die Begriffe
      in die vier Kästen.
    image: /assets/phpstorm-datenbank-tools/deadlock-leer.svg
    slots:
      - { x: 15.6, y: 46.6, answer: Konsole A }
      - { x: 84.4, y: 46.6, answer: Konsole B }
      - { x: 50, y: 25, answer: Konto 1 }
      - { x: 50, y: 68.2, answer: Konto 2 }
    distractors: [Index, Commit]
    hints:
      - Pfeil ① führt von Konsole A zu der Zeile, die A zuerst gesperrt hat.
  - id: deadlock-nachstellen
    type: simulated
    title: Einen Deadlock mit zwei Konsolen nachstellen
    description: |
      Du simulierst zwei PostgreSQL-Konsolen in PhpStorm, beide im Modus **Tx: Manual**. Der Prompt zeigt dir,
      in welcher Konsole du gerade tippst. Tabelle `accounts` hat die Konten 1 und 2. Tippe nacheinander:

      1. Konsole A: `BEGIN;`
      2. Konsole B: `BEGIN;`
      3. Konsole A: `UPDATE accounts SET balance = balance - 10 WHERE id = 1;`
      4. Konsole B: `UPDATE accounts SET balance = balance - 10 WHERE id = 2;`
      5. Konsole A: `UPDATE accounts SET balance = balance + 10 WHERE id = 2;` (A muss warten)
      6. Konsole B: `UPDATE accounts SET balance = balance + 10 WHERE id = 1;` (Deadlock!)
      7. Konsole B: `ROLLBACK;`
      8. Konsole A: `COMMIT;`
    prompt: "konsole-A=#"
    steps:
      - expect: "^(BEGIN|begin)\\s*;?$"
        output: "BEGIN"
        prompt: "konsole-B=#"
        hint: "Tippe BEGIN;"
      - expect: "^(BEGIN|begin)\\s*;?$"
        output: "BEGIN"
        prompt: "konsole-A=#"
        hint: "Auch Konsole B startet mit BEGIN;"
      - expect: "^UPDATE\\s+accounts\\s+SET\\s+balance\\s*=\\s*balance\\s*-\\s*10\\s+WHERE\\s+id\\s*=\\s*1\\s*;?$"
        output: "UPDATE 1"
        prompt: "konsole-B=#"
        hint: "UPDATE accounts SET balance = balance - 10 WHERE id = 1;"
      - expect: "^UPDATE\\s+accounts\\s+SET\\s+balance\\s*=\\s*balance\\s*-\\s*10\\s+WHERE\\s+id\\s*=\\s*2\\s*;?$"
        output: "UPDATE 1"
        prompt: "konsole-A=#"
        hint: "UPDATE accounts SET balance = balance - 10 WHERE id = 2;"
      - expect: "^UPDATE\\s+accounts\\s+SET\\s+balance\\s*=\\s*balance\\s*\\+\\s*10\\s+WHERE\\s+id\\s*=\\s*2\\s*;?$"
        output: |
          … (Konsole A wartet – Zeile 2 ist von Konsole B gesperrt. In PhpStorm dreht sich der Ausführen-Indikator.)
        prompt: "konsole-B=#"
        hint: "UPDATE accounts SET balance = balance + 10 WHERE id = 2;"
      - expect: "^UPDATE\\s+accounts\\s+SET\\s+balance\\s*=\\s*balance\\s*\\+\\s*10\\s+WHERE\\s+id\\s*=\\s*1\\s*;?$"
        output: |
          ERROR:  deadlock detected
          DETAIL:  Process 4712 waits for ShareLock on transaction 1235; blocked by process 4711.
          Process 4711 waits for ShareLock on transaction 1236; blocked by process 4712.
          HINT:  See server log for query details.
          CONTEXT:  while updating tuple (0,1) in relation "accounts"

          (Gleichzeitig in Konsole A: UPDATE 1 – A darf weiterarbeiten.)
        prompt: "konsole-B=#"
        hint: "UPDATE accounts SET balance = balance + 10 WHERE id = 1;"
      - expect: "^(ROLLBACK|rollback)\\s*;?$"
        output: "ROLLBACK"
        prompt: "konsole-A=#"
        hint: "Die abgebrochene Transaktion in B beendest du mit ROLLBACK;"
      - expect: "^(COMMIT|commit)\\s*;?$"
        output: |
          COMMIT
          (Die Umbuchung von A ist gespeichert, die von B muss neu gestartet werden.)
        hint: "Konsole A bestätigt mit COMMIT;"
    responses:
      - match: "^(SELECT|select)"
        output: "Für diese Übung bitte die Schritte aus der Beschreibung tippen."
  - id: sqlite-gesperrt
    type: terminal
    title: Eine gesperrte SQLite-Datenbank erleben
    description: |
      SQLite sperrt beim Schreiben nicht einzelne Zeilen, sondern die ganze Datenbankdatei. Das kannst du
      hier echt ausprobieren. Vorbereitet sind `lager.db` und das Skript `blockieren.sh`. Es startet eine
      Schreib-Transaktion, hält sie **30 Sekunden** offen und rollt sie dann zurück – wie eine vergessene
      Konsole im Modus Tx: Manual.

      Klicke auf **Aufgabe vorbereiten** und arbeite dann zügig:

      1. Starte den Blockierer im Hintergrund: `bash blockieren.sh &`
      2. Warte etwa eine Sekunde und versuche dann, den Bestand von Produkt 2 auf 50 zu setzen, und leite die Fehlermeldung in
         `fehler.txt` um:
         `sqlite3 lager.db "UPDATE products SET stock = 50 WHERE id = 2;" 2> fehler.txt`
      3. Sieh dir `fehler.txt` an.
      4. Wiederhole das UPDATE, diesmal mit Wartezeit (Busy-Timeout) von 40 Sekunden:
         `sqlite3 -cmd ".timeout 40000" lager.db "UPDATE products SET stock = 50 WHERE id = 2;"`
         Der Befehl wartet, bis der Blockierer fertig ist, und läuft dann durch.

      Warst du zu langsam und Schritt 2 hat keinen Fehler erzeugt? Starte einfach wieder bei Schritt 1.
    workdir: sqlite-gesperrt
    setup: |
      sqlite3 lager.db <<'SQL'
      CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, stock INTEGER NOT NULL);
      INSERT INTO products (name, stock) VALUES ('Schraube', 10), ('Mutter', 20), ('Dübel', 30);
      SQL
      cat > blockieren.sh <<'EOF'
      #!/usr/bin/env bash
      cd "$(dirname "$0")"
      { printf 'BEGIN IMMEDIATE;\nUPDATE products SET stock = stock - 1 WHERE id = 1;\n'; sleep 30; printf 'ROLLBACK;\n'; } | sqlite3 lager.db
      echo "blockieren.sh: Transaktion zurückgerollt, Sperre freigegeben."
      EOF
    checks:
      - type: file_contains
        path: fehler.txt
        pattern: "database is locked"
        message: fehler.txt enthält noch nicht die Meldung „database is locked“. Starte blockieren.sh und führe das UPDATE sofort danach aus.
      - type: command
        run: sqlite3 lager.db "SELECT stock FROM products WHERE id = 2;"
        stdout_equals: "50"
        message: Produkt 2 hat noch nicht den Bestand 50. Führe das UPDATE mit .timeout aus.
      - type: command
        run: sqlite3 -cmd ".timeout 40000" lager.db "SELECT stock FROM products WHERE id = 1;"
        stdout_equals: "10"
        message: Produkt 1 sollte unverändert 10 haben – die blockierende Transaktion wird zurückgerollt.
    hints:
      - "Das `&` am Ende startet den Blockierer im Hintergrund, damit du weitertippen kannst."
      - "`2> fehler.txt` leitet nur die Fehlerausgabe in die Datei."
      - "`.timeout 40000` heißt: bis zu 40 000 Millisekunden auf die Sperre warten statt sofort aufzugeben."
    solution: |
      ```bash
      bash blockieren.sh &
      sleep 1
      sqlite3 lager.db "UPDATE products SET stock = 50 WHERE id = 2;" 2> fehler.txt
      cat fehler.txt
      sqlite3 -cmd ".timeout 40000" lager.db "UPDATE products SET stock = 50 WHERE id = 2;"
      sqlite3 lager.db "SELECT * FROM products;"
      ```
---
Ein Kollege korrigiert in PhpStorm eine Bestellung im Modus **Tx: Manual** – und geht in die Mittagspause,
ohne zu committen. Zehn Minuten später meldet der Support, dass sich genau diese Bestellung im Shop nicht
mehr bearbeiten lässt. Die Ursache ist eine [[sperre|Sperre]]. Und wenn zwei Transaktionen sich gegenseitig
sperren, entsteht der berüchtigte [[deadlock|Deadlock]].

## Warum Datenbanken sperren

Ändern zwei [[transaktion|Transaktionen]] gleichzeitig dieselbe Zeile, könnte eine Änderung die andere
überschreiben. Deshalb sperrt die Datenbank jede geänderte Zeile bis zum Ende der Transaktion:

| Situation | Was passiert? |
|---|---|
| A ändert Zeile 1, B **liest** Zeile 1 | B liest den alten, bestätigten Wert (PostgreSQL) – kein Warten |
| A ändert Zeile 1, B **ändert** Zeile 1 | B **wartet**, bis A committet oder zurückrollt |
| A ändert Zeile 1, B ändert Zeile 2 | beide arbeiten parallel |

PostgreSQL sperrt also **Zeilen**. [[sqlite|SQLite]] ist gröber: Während einer schreibenden Transaktion ist
die **ganze Datei** für andere Schreiber gesperrt. Wer nicht warten will, bekommt `database is locked`.

> [!MERKSATZ]
> Sperren entstehen beim Schreiben und halten bis `COMMIT` oder `ROLLBACK`. Je länger eine Transaktion offen
> ist, desto länger warten alle anderen.

## Warten sichtbar machen

Mit zwei Query-Konsolen kannst du Sperren in PhpStorm selbst beobachten:

1. Öffne zwei Konsolen auf derselben Datenquelle (F4 und **Jump to Query Console → New Query Console**).
   Jede ist eine eigene [[datenbank-sitzung|Sitzung]].
2. Stelle beide auf **Tx: Manual**.
3. Konsole A: `UPDATE accounts SET balance = balance - 10 WHERE id = 1;`
4. Konsole B: dieselbe Zeile ändern – die Ausführung dreht sich und wartet.
5. Konsole A: **Commit** – sofort läuft B weiter.

Wer gerade wen blockiert, fragst du PostgreSQL direkt aus einer dritten Konsole:

```sql title="Wer blockiert wen?"
SELECT pid, state, pg_blocking_pids(pid) AS blockiert_von, query
FROM pg_stat_activity
WHERE datname = current_database();
```

Eine Sitzung mit `state = 'idle in transaction'` ist der typische Übeltäter: offen, aber untätig.

> [!TIPP]
> Mit `SET lock_timeout = '5s';` bricht eine Anweisung nach fünf Sekunden Warten ab, statt ewig zu hängen.
> Das [[lock-timeout|Lock-Timeout]] heißt bei SQLite Busy-Timeout (`.timeout 5000` im Programm `sqlite3`).

## Der Deadlock

Ein Deadlock ist ein Kreis aus Warten:

| Schritt | Konsole A | Konsole B |
|---|---|---|
| 1 | sperrt Konto 1 | |
| 2 | | sperrt Konto 2 |
| 3 | will Konto 2 → **wartet auf B** | |
| 4 | | will Konto 1 → **wartet auf A** |

Keiner kann je weitermachen. PostgreSQL bemerkt das nach `deadlock_timeout` (Standard: 1 Sekunde), bricht
**eine** der beiden Transaktionen ab und lässt die andere weiterlaufen.

![Deadlock zwischen zwei Konsolen und zwei Konten](/assets/phpstorm-datenbank-tools/deadlock.svg)

## So meldet PostgreSQL einen Deadlock

In der abgebrochenen Konsole erscheint im Reiter **Output** etwa:

```text title="Output"
ERROR:  deadlock detected
DETAIL:  Process 4712 waits for ShareLock on transaction 1235; blocked by process 4711.
Process 4711 waits for ShareLock on transaction 1236; blocked by process 4712.
HINT:  See server log for query details.
```

Lies das so: Prozess 4712 (Konsole B) wartet auf eine Transaktion von 4711 (Konsole A) – und umgekehrt. Die
Transaktion von B ist jetzt abgebrochen. Jeder weitere Befehl dort endet mit
`current transaction is aborted`, bis du **Roll back** klickst bzw. `ROLLBACK;` ausführst.

> [!FEHLER]
> Nach dem Deadlock in der abgebrochenen Konsole einfach weitertippen oder Commit drücken. Die Arbeit dieser
> Transaktion ist verloren; du musst sie nach dem Rollback komplett neu ausführen.

## Deadlocks vermeiden

- **Feste Reihenfolge**: Sperre Zeilen immer in derselben Reihenfolge, z. B. aufsteigend nach `id`. Dann
  kann kein Kreis entstehen.
- **Kurze Transaktionen**: Erst alles vorbereiten, dann schnell schreiben und committen.
- **Nie auf Menschen warten**: Keine Transaktion offen lassen, während jemand überlegt oder Mittag macht.
- **Wiederholen**: Anwendungen fangen den Fehler ab und führen die Transaktion erneut aus.

> [!PRAXIS]
> In Produktiv-Logs taucht `deadlock detected` meist bei Jobs auf, die parallel dieselben Datensätze
> bearbeiten. Die Lösung ist fast immer eine feste Sortierung vor dem Update – nicht ein längerer Timeout.

## Tastenkürzel dieser Lektion

| Aktion | Windows/Linux | macOS |
|---|---|---|
| Standard-Konsole öffnen | F4 | F4 |
| Weitere Konsole (Jump to Query Console) | Ctrl+Shift+F10 | ⇧⌘L |
| Statement ausführen | Ctrl+Enter | ⌘↩ |
| Wartende Anweisung abbrechen | Ctrl+F2 | ⌘F2 |
| Services-Fenster (Sitzungen) | Alt+8 | ⌘8 |

## Zusammenfassung

- Schreibende Transaktionen sperren Zeilen (PostgreSQL) bzw. die ganze Datei (SQLite) bis zum Commit.
- Zwei Konsolen im Modus **Tx: Manual** machen Warten und Deadlocks sichtbar.
- `pg_stat_activity` und `pg_blocking_pids()` zeigen, wer wen blockiert; `idle in transaction` ist verdächtig.
- PostgreSQL bricht bei einem Deadlock eine Transaktion mit `ERROR: deadlock detected` ab – danach `ROLLBACK`.
- Vorbeugen: feste Sperr-Reihenfolge, kurze Transaktionen, Timeouts und Wiederholungen.
