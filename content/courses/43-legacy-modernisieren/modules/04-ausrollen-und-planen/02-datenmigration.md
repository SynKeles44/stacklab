---
title: Datenmigration ohne Ausfall
summary: Warum Datenmigrationen der riskanteste Teil einer Modernisierung sind und wie du sie mit Backup, Transaktion, Expand-and-Contract und Prüfabfragen sicher machst.
duration: 24
sources:
  - title: SQLite – ALTER TABLE
    url: https://sqlite.org/lang_altertable.html
  - title: SQLite – Transaktionen
    url: https://sqlite.org/lang_transaction.html
  - title: Martin Fowler – Parallel Change (Expand and Contract)
    url: https://martinfowler.com/bliki/ParallelChange.html
quiz:
  - type: single
    question: Warum sind Datenmigrationen riskanter als Code-Änderungen?
    options:
      - Weil SQL schwerer zu lesen ist als PHP.
      - Weil Code sich per Deployment zurücksetzen lässt, veränderte oder gelöschte Daten aber nicht ohne Weiteres.
      - Weil Datenbanken keine Transaktionen kennen.
    answer: 1
    explanation: >
      Einen fehlerhaften Commit nimmst du in Minuten zurück. Daten, die eine Migration überschrieben oder gelöscht hat,
      bekommst du nur aus einem Backup zurück – und alles, was danach geschrieben wurde, fehlt dann.
  - type: multiple
    question: Welche Auffälligkeiten in Altdaten solltest du vor einer Migration prüfen?
    options:
      - Unterschiedliche Schreibweisen wie `klein`, `Klein` und ` klein`
      - NULL-Werte in Spalten, die eigentlich immer gefüllt sein müssten
      - Werte, die zu keinem bekannten Eintrag passen
      - Die Farbe des Datenbank-Logos
    answers: [0, 1, 2]
    explanation: >
      Alte Systeme ohne Constraints sammeln über Jahre inkonsistente Daten. Eine Migration, die nur den Idealfall
      erwartet, lässt solche Zeilen verwaist oder bricht ab.
  - type: cloze
    text: "Beim Muster ___ and ___ fügst du zuerst die neue Spalte hinzu, füllst sie und entfernst die alte erst, wenn kein Code sie mehr benutzt."
    blanks:
      - [Expand]
      - [Contract]
    explanation: Auch Parallel Change genannt. Jede Phase ist ein eigenes, einzeln zurücknehmbares Deployment.
  - type: find-bug
    question: Diese Migration soll Kistennamen vereinheitlichen. Welche Zeile ist für Altdaten zu optimistisch?
    language: sql
    code: |
      BEGIN;
      ALTER TABLE bestellungen ADD COLUMN kiste_id INTEGER REFERENCES kisten(id);
      UPDATE bestellungen
         SET kiste_id = (SELECT id FROM kisten WHERE name = bestellungen.kiste);
      COMMIT;
    bug_line: 4
    explanation: >
      Ein exakter Vergleich trifft `Klein` oder ` mittel` mit Leerzeichen nicht – diese Zeilen bekommen NULL. Normalisiere
      mit `lower(trim(kiste))` und prüfe danach, ob noch NULL-Werte übrig sind.
tasks:
  - id: kisten-migrieren
    type: terminal
    title: Migriere die Kisten in eine eigene Tabelle
    description: |
      Im Ordner `datenmigration` liegt `data/app.db` mit acht Bestellungen. Die Kiste steht dort als freier Text – mit
      unterschiedlichen Schreibweisen. Ziel ist eine Tabelle `kisten` und eine Spalte `bestellungen.kiste_id`
      (Phase **Expand**, die alte Spalte `kiste` bleibt).

      1. Sieh dir die Daten an: `sqlite3 data/app.db "SELECT kiste, COUNT(*) FROM bestellungen GROUP BY kiste;"`
      2. Lege ein Backup an: `data/app.db.bak` (vor der Migration!).
      3. Schreib `migrationen/001_kisten.sql` – alles zwischen `BEGIN;` und `COMMIT;`:
         Tabelle `kisten` (`id INTEGER PRIMARY KEY`, `name TEXT NOT NULL UNIQUE`, `preis REAL NOT NULL`) mit
         `klein` 14.9, `mittel` 21.5, `gross` 29.9; neue Spalte `kiste_id INTEGER REFERENCES kisten(id)`; Backfill
         mit normalisierten Namen.
      4. Führe die Migration aus: `sqlite3 data/app.db < migrationen/001_kisten.sql`
      5. Prüfe: Keine Bestellung darf `kiste_id` NULL haben, und es müssen weiterhin acht Bestellungen sein.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: datenmigration
    setup: |
      mkdir -p data migrationen
      sqlite3 data/app.db "CREATE TABLE bestellungen (id INTEGER PRIMARY KEY, kunde TEXT, kiste TEXT, menge INTEGER, typ TEXT);
      INSERT INTO bestellungen (kunde, kiste, menge, typ) VALUES ('Ada', 'klein', 2, 'stamm'), ('Linus', 'Gross', 1, 'neu'), ('Grace', ' mittel', 7, 'stamm'), ('Ada', 'mittel ', 1, 'stamm'), ('Margaret', 'GROSS', 12, 'neu'), ('Alan', 'klein', 3, 'neu'), ('Grace', 'Klein', 4, 'stamm'), ('Linus', 'gross', 2, 'neu');"
    checks:
      - type: file_exists
        path: data/app.db.bak
        message: Das Backup data/app.db.bak fehlt. Kopiere die Datenbank vor der Migration.
      - type: command
        run: test -s data/app.db.bak && sqlite3 -readonly data/app.db.bak "SELECT COUNT(*) FROM sqlite_master WHERE name = 'kisten';"
        stdout_equals: "0"
        message: Das Backup enthält schon die Tabelle kisten – es wurde nach der Migration angelegt. Setze die Aufgabe zurück und sichere zuerst.
      - type: file_contains
        path: migrationen/001_kisten.sql
        pattern: "^\\s*(BEGIN|begin)"
        message: Die Migration soll mit BEGIN; in einer Transaktion starten.
      - type: file_contains
        path: migrationen/001_kisten.sql
        pattern: "(COMMIT|commit)\\s*;"
        message: Die Migration soll mit COMMIT; enden.
      - type: command
        run: sqlite3 data/app.db "SELECT name || '=' || preis FROM kisten ORDER BY name;" | tr '\n' ' '
        stdout_matches: "^gross=29\\.9 klein=14\\.9 mittel=21\\.5\\s*$"
        message: Die Tabelle kisten soll genau gross (29.9), klein (14.9) und mittel (21.5) enthalten.
      - type: command
        run: sqlite3 data/app.db "SELECT COUNT(*) FROM bestellungen;"
        stdout_equals: "8"
        message: Es müssen weiterhin genau acht Bestellungen existieren.
      - type: command
        run: sqlite3 data/app.db "SELECT COUNT(*) FROM bestellungen WHERE kiste_id IS NULL;"
        stdout_equals: "0"
        message: Einige Bestellungen haben noch keine kiste_id. Normalisiere beim Backfill mit lower(trim(kiste)).
      - type: command
        run: sqlite3 data/app.db "SELECT COUNT(*) FROM bestellungen b JOIN kisten k ON k.id = b.kiste_id WHERE k.name = lower(trim(b.kiste));"
        stdout_equals: "8"
        message: Mindestens eine Bestellung zeigt auf die falsche Kiste.
      - type: command
        run: sqlite3 data/app.db "SELECT COUNT(*) FROM pragma_table_info('bestellungen') WHERE name = 'kiste';"
        stdout_equals: "1"
        message: Die alte Spalte kiste soll in der Expand-Phase erhalten bleiben – alter Code liest sie noch.
    hints:
      - "Backup: `cp data/app.db data/app.db.bak` – oder `sqlite3 data/app.db \".backup data/app.db.bak\"`."
      - "Backfill: `UPDATE bestellungen SET kiste_id = (SELECT id FROM kisten WHERE kisten.name = lower(trim(bestellungen.kiste)));`"
      - "Danach prüfen: `sqlite3 data/app.db \"SELECT kiste, kiste_id FROM bestellungen;\"`"
    solution: |
      ```bash
      cd datenmigration
      sqlite3 data/app.db "SELECT kiste, COUNT(*) FROM bestellungen GROUP BY kiste;"
      cp data/app.db data/app.db.bak
      cat > migrationen/001_kisten.sql <<'EOF'
      BEGIN;

      CREATE TABLE kisten (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          preis REAL NOT NULL
      );
      INSERT INTO kisten (name, preis) VALUES ('klein', 14.9), ('mittel', 21.5), ('gross', 29.9);

      ALTER TABLE bestellungen ADD COLUMN kiste_id INTEGER REFERENCES kisten(id);

      UPDATE bestellungen
         SET kiste_id = (SELECT id FROM kisten WHERE kisten.name = lower(trim(bestellungen.kiste)));

      COMMIT;
      EOF
      sqlite3 data/app.db < migrationen/001_kisten.sql
      sqlite3 data/app.db "SELECT COUNT(*) FROM bestellungen WHERE kiste_id IS NULL;"
      sqlite3 data/app.db "SELECT b.kiste, k.name FROM bestellungen b JOIN kisten k ON k.id = b.kiste_id;"
      ```
  - id: expand-contract-reihenfolge
    type: order
    title: Expand and Contract in der richtigen Reihenfolge
    description: Die Spalte `kiste` (Text) soll durch `kiste_id` ersetzt werden, ohne dass die Gemüsekiste ausfällt. Bring die Schritte in die richtige Reihenfolge.
    items:
      - Backup anlegen und Altdaten auf Auffälligkeiten prüfen
      - Neue Tabelle und neue Spalte anlegen (Expand)
      - Code ausrollen, der beide Spalten schreibt
      - Altdaten per Backfill in die neue Spalte übertragen und mit Prüfabfragen kontrollieren
      - Code ausrollen, der nur noch die neue Spalte liest
      - Alte Spalte entfernen und NOT NULL setzen (Contract)
    hints:
      - Gelöscht wird ganz zum Schluss – erst, wenn kein Code die alte Spalte mehr braucht.
---
Die Gemüsekiste speichert die Kistengröße als freien Text. Über die Jahre sind `klein`, `Klein` und ` klein` mit
Leerzeichen entstanden. Der neue Code soll mit einer sauberen Tabelle `kisten` arbeiten. Klingt nach einem
`UPDATE`-Befehl – ist aber der gefährlichste Schritt der ganzen Modernisierung.

## Warum Daten anders sind als Code

| | Code | Daten |
|---|---|---|
| Zurücksetzen | Deployment des alten Stands | Nur aus einem Backup |
| Was danach passiert | Nichts geht verloren | Neue Bestellungen seit dem Backup fehlen |
| Testen | Golden Master, Tests | Hängt von echten, oft unsauberen Daten ab |
| Fehler sichtbar | Meist sofort | Oft erst Wochen später |

Dazu kommt: Altdaten halten sich selten an die Regeln, die der Code annimmt. Ohne Constraints hat die Datenbank
über Jahre alles angenommen, was jemand eingetippt hat.

> [!MERKSATZ]
> Eine Datenmigration ist erst sicher, wenn du sie **zurücknehmen** kannst und ihr Ergebnis mit **Prüfabfragen**
> kontrolliert hast.

## Erst die Daten verstehen

Bevor du eine Zeile Migration schreibst, schaust du in die echten Daten:

```bash title="Terminal"
sqlite3 data/app.db "SELECT kiste, COUNT(*) FROM bestellungen GROUP BY kiste;"
```

```text title="Ausgabe"
 mittel|1
GROSS|1
Gross|1
Klein|1
gross|1
klein|2
mittel |1
```

Typische Funde in Altdaten:

- Unterschiedliche Groß- und Kleinschreibung, Leerzeichen am Rand
- `NULL` oder leere Strings, wo immer ein Wert stehen sollte
- Werte, die es fachlich gar nicht gibt (`riesig`, `test`)
- Zahlen als Text, unterschiedliche Datums- und Zeichenformate

Für jeden Fund entscheidest du **vorher**, was passiert: normalisieren, einem Standardwert zuordnen oder in eine
Klärungsliste schreiben.

## Backup und Transaktion

Zwei Sicherheitsgurte gehören zu jeder Migration:

```bash title="1. Backup"
cp data/app.db data/app.db.bak            # bei SQLite reicht eine Kopie, wenn niemand schreibt
sqlite3 data/app.db ".backup data/app.db.bak"   # sicher auch bei laufender App
```

```sql title="2. Transaktion"
BEGIN;
-- alle Änderungen
COMMIT;
```

In einer [[transaktion|Transaktion]] gilt: alles oder nichts. Bricht ein Befehl ab, bleibt die Datenbank im alten
Zustand. Probiere die Migration außerdem vorher auf einer **Kopie** der Produktionsdaten aus – nie zum ersten Mal
auf dem echten System.

> [!FEHLER]
> Das Backup **nach** der Migration anlegen, „sicherheitshalber“. Dann sichert es genau den Zustand, den du im
> Fehlerfall loswerden willst.

## Expand and Contract

Spalten umbenennen oder ersetzen geht nicht in einem Schritt, solange alter Code läuft. Das Muster
[[expand-contract|Expand and Contract]] teilt die Änderung in Phasen:

![Expand and Contract: erst neue Spalte hinzufügen, dann Daten füllen und Code umstellen, zuletzt die alte Spalte entfernen](/assets/legacy-modernisieren/expand-contract.svg)

```sql title="migrationen/001_kisten.sql – Phase Expand"
BEGIN;
CREATE TABLE kisten (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, preis REAL NOT NULL);
INSERT INTO kisten (name, preis) VALUES ('klein', 14.9), ('mittel', 21.5), ('gross', 29.9);
ALTER TABLE bestellungen ADD COLUMN kiste_id INTEGER REFERENCES kisten(id);
UPDATE bestellungen
   SET kiste_id = (SELECT id FROM kisten WHERE kisten.name = lower(trim(bestellungen.kiste)));
COMMIT;
```

Das Nachfüllen alter Zeilen heißt [[backfill|Backfill]]. Bei Millionen Zeilen läuft es in kleinen Portionen, damit
die Tabelle nicht lange gesperrt ist.

## Prüfen, dann erst weitermachen

Nach jeder Phase beweisen Prüfabfragen, dass nichts verloren ging:

```sql title="Prüfabfragen"
SELECT COUNT(*) FROM bestellungen;                        -- gleich viele wie vorher?
SELECT COUNT(*) FROM bestellungen WHERE kiste_id IS NULL; -- muss 0 sein
SELECT kiste, kiste_id FROM bestellungen;                 -- Stichprobe
```

Erst wenn alle Zahlen stimmen und der neue Code eine Weile nur `kiste_id` liest, folgt **Contract**: alte Spalte
entfernen, `NOT NULL` erzwingen. In SQLite heißt das je nach Fall Tabelle neu anlegen und umkopieren – lies dazu die
Seite zu `ALTER TABLE` in der SQLite-Dokumentation.

> [!PRAXIS]
> In Laravel-Projekten ist jede Phase eine eigene [[migration|Migration]] mit eigener `down()`-Methode. Phase 1 und 2
> landen oft in derselben Woche, Contract erst Wochen später – wenn alle Server, Jobs und Berichte umgestellt sind.

## Zusammenfassung

- Datenmigrationen sind riskanter als Code, weil sich Daten nicht per Deployment zurücksetzen lassen.
- Schau dir die **echten Daten** an und entscheide vorher, was mit Ausreißern passiert.
- **Backup vorher**, Migration in einer **Transaktion**, erst auf einer Kopie testen.
- **Expand and Contract:** neu hinzufügen → befüllen und Code umstellen → Altes entfernen.
- Der **Backfill** normalisiert Altdaten, z. B. mit `lower(trim(...))`.
- **Prüfabfragen** nach jeder Phase: Anzahl, NULL-Werte, Stichproben.
