---
title: Das Database-Tool-Fenster
summary: Wo die Datenbank-Werkzeuge in PhpStorm stecken, wie der Objektbaum aufgebaut ist und wie du darin navigierst.
duration: 20
sources:
  - title: PhpStorm-Hilfe – Database tool window
    url: https://www.jetbrains.com/help/phpstorm/database-tool-window.html
  - title: PhpStorm-Hilfe – Managing data sources
    url: https://www.jetbrains.com/help/phpstorm/managing-data-sources.html
  - title: PhpStorm-Hilfe – Connect to a database
    url: https://www.jetbrains.com/help/phpstorm/connecting-to-a-database.html
  - title: SQLite-Dokumentation – Command Line Shell
    url: https://sqlite.org/cli.html
quiz:
  - type: single
    question: Über welchen Menüpfad öffnest du das Database-Tool-Fenster?
    options:
      - File | Database
      - View | Tool Windows | Database
      - Tools | SQL | Open
      - Window | Database Explorer
    answer: 1
    explanation: Alle Tool-Fenster findest du unter View | Tool Windows. Alternativ klickst du auf das Database-Symbol am rechten Fensterrand.
  - type: match
    question: Ordne jeder Ebene im Database-Baum das passende Beispiel zu.
    pairs:
      - { left: "Datenquelle", right: "shop@localhost" }
      - { left: "Datenbank", right: "shop" }
      - { left: "Schema", right: "public" }
      - { left: "Tabelle", right: "orders" }
      - { left: "Spalte", right: "customer_id" }
    explanation: Der Baum geht immer vom Groben ins Feine – Verbindung, Datenbank, Schema, Tabelle und dann deren Bestandteile.
  - type: multiple
    question: Welche Aussagen über eine Datenquelle in PhpStorm stimmen?
    options:
      - Sie speichert, wie PhpStorm die Datenbank erreicht (Treiber, Host, Port, Benutzer …).
      - Sie ist eine Kopie aller Daten auf deinem Rechner.
      - Sie erscheint als oberster Knoten im Database-Tool-Fenster.
      - Löschst du die Datenquelle, wird die Datenbank auf dem Server gelöscht.
    answers: [0, 2]
    explanation: Eine Datenquelle ist nur der gespeicherte Weg zur Datenbank. Entfernst du sie, verschwindet die Verbindung aus der IDE – die Datenbank selbst bleibt unberührt.
  - type: cloze
    text: Das Plugin, das die Datenbank-Funktionen liefert, heißt „Database Tools and ___“. Ein Doppelklick auf eine Tabelle öffnet den ___.
    blanks:
      - [SQL]
      - [Daten-Editor, Dateneditor, Data Editor]
    explanation: Das Plugin „Database Tools and SQL“ ist standardmäßig aktiv. Der Doppelklick auf eine Tabelle zeigt ihre Zeilen im Daten-Editor.
tasks:
  - id: baum-beschriften
    type: diagram
    title: Beschrifte das Database-Tool-Fenster
    description: >
      Das Bild zeigt eine vereinfachte Nachbildung des Database-Tool-Fensters. Ziehe die passenden Begriffe
      in die fünf Kästen rechts. Die Linien zeigen, worauf sich jeder Kasten bezieht. Zwei Begriffe gehören
      nicht ins Bild.
    image: /assets/phpstorm-datenbank-tools/database-toolwindow-leer.svg
    slots:
      - { x: 82.5, y: 19, answer: "Neu (+)" }
      - { x: 82.5, y: 35, answer: Datenquelle }
      - { x: 82.5, y: 47, answer: Schema }
      - { x: 82.5, y: 59, answer: Tabelle }
      - { x: 82.5, y: 75, answer: Indizes }
    distractors: [Query-Konsole, Commit]
    hints:
      - Der oberste fett gedruckte Eintrag mit `@` ist die Verbindung.
      - "`public` ist das Standard-Schema von PostgreSQL."
  - id: schema-erkunden
    type: terminal
    title: Erkunde eine Datenbank wie im Objektbaum
    description: |
      PhpStorm zeigt dir Tabellen, Spalten und Indizes als Baum. Dieselben Informationen liefert auch das
      Kommandozeilenprogramm `sqlite3` – das übst du hier, denn PhpStorm läuft nicht im Übungs-Terminal.

      Vorbereitet ist die SQLite-Datenbank `shop.db` mit einem kleinen Online-Shop.

      1. Klicke auf **Aufgabe vorbereiten**.
      2. Öffne die Datenbank mit `sqlite3 shop.db` und lass dir mit `.tables` alle Tabellen zeigen.
      3. Sieh dir mit `.schema orders` die Struktur der Tabelle `orders` an. Mit `.indexes orders` siehst du ihre Indizes.
      4. Verlasse `sqlite3` mit `.quit`.
      5. Schreibe den **Namen des Index** auf der Tabelle `orders` in die Datei `antwort.txt`
         (nur den Namen, eine Zeile).
    workdir: schema-erkunden
    setup: |
      sqlite3 shop.db <<'SQL'
      CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, city TEXT);
      CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(id), status TEXT NOT NULL, total REAL NOT NULL, created_at TEXT NOT NULL);
      CREATE INDEX idx_orders_created_at ON orders (created_at);
      INSERT INTO customers (name, email, city) VALUES ('Ada', 'ada@example.com', 'Hamburg'), ('Linus', 'linus@example.com', 'Köln'), ('Grace', 'grace@example.com', 'Leipzig');
      INSERT INTO orders (customer_id, status, total, created_at) VALUES (1, 'paid', 49.90, '2026-09-01'), (1, 'open', 12.00, '2026-09-14'), (2, 'paid', 99.00, '2026-09-20'), (3, 'open', 5.50, '2026-10-02');
      SQL
    checks:
      - type: file_exists
        path: antwort.txt
        message: Lege die Datei antwort.txt an und schreibe den Indexnamen hinein.
      - type: command
        run: tr -d ' \r' < antwort.txt | grep -v '^$' | head -n 1
        stdout_equals: idx_orders_created_at
        message: In antwort.txt steht noch nicht der richtige Indexname. Schau mit `.indexes orders` in sqlite3 nach.
    hints:
      - "Starte mit `sqlite3 shop.db`; Befehle mit Punkt am Anfang (`.tables`) sind Befehle von sqlite3 selbst, kein SQL."
      - "`.indexes orders` listet nur Indizes, die du selbst angelegt hast – genau einer."
      - "Ohne interaktive Sitzung: `sqlite3 shop.db \".indexes orders\" > antwort.txt`"
    solution: |
      ```bash
      sqlite3 shop.db ".tables"
      sqlite3 shop.db ".schema orders"
      sqlite3 shop.db ".indexes orders" > antwort.txt
      cat antwort.txt
      ```
---
Deine Kollegin schreibt: „Kannst du kurz nachsehen, ob die Bestellung 4711 bezahlt ist?“ Du könntest ein
separates Datenbankprogramm starten, Passwörter suchen und dich durch fremde Oberflächen klicken. Oder du
bleibst in der [[ide|IDE]], in der du ohnehin arbeitest. PhpStorm bringt dafür ein vollständiges
Datenbank-Werkzeug mit – und alles beginnt im Database-[[tool-fenster|Tool-Fenster]].

## Warum Datenbank-Werkzeuge in der IDE?

Eine [[datenbank]] speichert die Daten deiner Anwendung in [[tabelle|Tabellen]]. Um sie anzusehen und zu
ändern, sprichst du [[sql|SQL]] mit ihr. Das geht auf drei Wegen:

| Weg | Beispiel | Stärke |
|---|---|---|
| Kommandozeile | `psql`, `mysql`, `sqlite3` | überall verfügbar, gut für Skripte |
| Eigenes Programm | pgAdmin, DBeaver | viele Spezialfunktionen |
| In der IDE | PhpStorm Database Tools | Code und Daten in einem Fenster |

Der große Vorteil der IDE: PhpStorm kennt die Struktur deiner Datenbank. Schreibst du in PHP-Code eine
SQL-Abfrage, bekommst du Autovervollständigung für Tabellen- und Spaltennamen und Warnungen bei Tippfehlern.

Die Funktionen stammen aus dem Plugin **Database Tools and SQL**. Es ist standardmäßig aktiv. Fehlt etwas,
prüfe unter **Settings | Plugins | Installed** (Ctrl+Alt+S, macOS ⌘,), ob der Haken gesetzt ist.

> [!PRAXIS]
> Im Team-Alltag nutzt du die IDE-Werkzeuge vor allem für die lokale Entwicklungs-Datenbank und für
> Test-Umgebungen. Auf Produktions-Datenbanken greifen viele Teams nur lesend oder gar nicht zu.

## Das Fenster öffnen

So öffnest du das Database-Tool-Fenster, Schritt für Schritt:

1. Klicke im Hauptmenü auf **View**.
2. Fahre auf **Tool Windows**.
3. Klicke auf **Database**.

Schneller geht es über das Datenbank-Symbol am rechten Fensterrand. Oder du drückst zweimal **Shift**
(Search Everywhere), tippst `Database` und wählst das Tool-Fenster aus.

Oben im Fenster liegt eine Werkzeugleiste. Die wichtigsten Knöpfe:

| Knopf | Funktion |
|---|---|
| **+** (New) | Neue Datenquelle, Konsole oder Ordner anlegen |
| ⟳ (Refresh) | Struktur neu aus der Datenbank laden |
| ⚙ (Data Source Properties) | Einstellungen der gewählten Datenquelle (Shift+Enter, macOS ⌘;) |
| ■ (Disconnect) | Verbindung trennen |
| QL (Jump to Query Console) | Query-Konsole öffnen |

![Schema des Database-Tool-Fensters mit Werkzeugleiste und Objektbaum](/assets/phpstorm-datenbank-tools/database-toolwindow.svg)

## Der Objektbaum

Der Baum geht vom Groben ins Feine. Ganz oben steht die [[datenquelle|Datenquelle]] – die gespeicherte
Verbindung, z. B. `shop@localhost`. Darunter folgen:

1. **Datenbank** – etwa `shop`. Ein Server kann viele Datenbanken haben.
2. **[[datenbank-schema|Schema]]** – ein Bereich innerhalb der Datenbank. In PostgreSQL heißt das
   Standard-Schema `public`.
3. **Tabellen** – etwa `orders` und `customers`.
4. **Bestandteile einer Tabelle**: `columns` ([[spalte|Spalten]]), `keys` (Schlüssel wie der
   [[fremdschluessel|Fremdschlüssel]] `customer_id`) und `indexes` ([[datenbank-index|Indizes]]).

Jede Zeile einer Tabelle ist ein [[datensatz|Datensatz]], zum Beispiel eine einzelne Bestellung.

Hinter der Datenquelle steht oft „1 of 3“. Das heißt: Der Server hat drei Datenbanken, PhpStorm zeigt aber
nur eine. Ein Klick darauf öffnet die Auswahl.

> [!MERKSATZ]
> Datenquelle → Datenbank → Schema → Tabelle → Spalten, Schlüssel, Indizes. Die Datenquelle ist nur der
> **Weg** zur Datenbank, nicht die Datenbank selbst.

> [!FEHLER]
> „Meine neue Tabelle fehlt im Baum!“ – PhpStorm liest die Struktur nicht ständig neu ein. Klicke auf
> **Refresh** (⟳) oder drücke Ctrl+F5 (macOS ⌘R), nachdem du Tabellen per Skript oder Migration angelegt hast.

## Navigieren und suchen

Große Datenbanken haben hunderte Tabellen. Klicken dauert zu lang – so findest du schneller hin:

- **Tippen im Baum**: Klicke in das Tool-Fenster und tippe einfach los, z. B. `ord`. PhpStorm springt
  zum ersten Treffer (Speed Search).
- **Search Everywhere**: zweimal Shift, dann den Tabellennamen tippen.
- **Doppelklick auf eine Tabelle** öffnet ihre Daten im Daten-Editor.
- **Ctrl+Q** (macOS F1) auf einer Tabelle zeigt eine Kurzinfo mit allen Spalten.
- **Ctrl+B** (macOS ⌘B) auf einem Tabellennamen in einer SQL-Abfrage springt zur Definition (DDL) dieser
  Tabelle.

Dieselben Infos bekommst du auf der Kommandozeile. Mit SQLite sieht das so aus:

```bash title="Terminal"
sqlite3 shop.db ".tables"
sqlite3 shop.db ".schema orders"
sqlite3 shop.db ".indexes orders"
```

`.tables` entspricht dem Knoten `tables`, `.schema` zeigt Spalten und Schlüssel, `.indexes` den Ordner
`indexes`.

## Tastenkürzel dieser Lektion

| Aktion | Windows/Linux | macOS |
|---|---|---|
| Settings öffnen | Ctrl+Alt+S | ⌘, |
| Search Everywhere | Shift Shift | ⇧⇧ |
| Eigenschaften der Datenquelle | Shift+Enter | ⌘; |
| Struktur neu laden | Ctrl+F5 | ⌘R |
| Kurzinfo zur Tabelle | Ctrl+Q | F1 |
| Zur Definition (DDL) springen | Ctrl+B | ⌘B |

Alle [[tastenkuerzel|Tastenkürzel]] kannst du unter **Settings | Keymap** nachschlagen und ändern. Wenn ein
Kürzel bei dir anders ist, liegt das meist an einer anderen Keymap-Einstellung.

## Zusammenfassung

- Die Datenbank-Funktionen kommen aus dem Plugin **Database Tools and SQL**.
- Du öffnest das Fenster über **View | Tool Windows | Database**.
- Der Baum zeigt Datenquelle → Datenbank → Schema → Tabelle → Spalten, Schlüssel, Indizes.
- Eine Datenquelle ist eine gespeicherte Verbindung, nicht die Datenbank selbst.
- Nach Strukturänderungen hilft **Refresh**, sonst fehlen neue Objekte im Baum.
- Tippen im Baum, Search Everywhere und Ctrl+B/⌘B bringen dich schnell zur richtigen Tabelle.
