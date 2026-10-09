---
title: Datenquellen anlegen
summary: PostgreSQL, MySQL und SQLite Schritt für Schritt verbinden – mit Treiber, Test Connection und den typischen Fehlermeldungen.
duration: 25
sources:
  - title: PhpStorm-Hilfe – PostgreSQL
    url: https://www.jetbrains.com/help/phpstorm/postgresql.html
  - title: PhpStorm-Hilfe – MySQL
    url: https://www.jetbrains.com/help/phpstorm/mysql.html
  - title: PhpStorm-Hilfe – SQLite
    url: https://www.jetbrains.com/help/phpstorm/sqlite.html
  - title: PhpStorm-Hilfe – Managing data sources
    url: https://www.jetbrains.com/help/phpstorm/managing-data-sources.html
  - title: PostgreSQL-Dokumentation – Connection Settings
    url: https://www.postgresql.org/docs/current/runtime-config-connection.html
quiz:
  - type: single
    question: Welchen Port nutzt PostgreSQL standardmäßig?
    options: ["3306", "5432", "22", "8080"]
    answer: 1
    explanation: PostgreSQL lauscht standardmäßig auf 5432, MySQL auf 3306. Port 22 ist SSH.
  - type: multiple
    question: Welche Angaben brauchst du für eine PostgreSQL-Datenquelle (Connection type „default“)?
    options:
      - Host und Port
      - Benutzer und Passwort
      - Name der Datenbank
      - Pfad zu einer .db-Datei
    answers: [0, 1, 2]
    explanation: Server-Datenbanken erreichst du über Host und Port und meldest dich mit Benutzer und Passwort an. Einen Dateipfad braucht nur SQLite.
  - type: cloze
    text: Fehlt der JDBC-Treiber, zeigt PhpStorm den Link „Download missing ___ files“. Ob alles stimmt, prüfst du mit dem Link „Test ___“.
    blanks:
      - [driver]
      - [Connection]
    explanation: Der Treiber wird einmalig heruntergeladen. Test Connection baut probehalber eine Verbindung auf, bevor du speicherst.
  - type: match
    question: Ordne jede Fehlermeldung ihrer wahrscheinlichsten Ursache zu.
    pairs:
      - { left: "Connection refused", right: "Kein Server auf diesem Host/Port" }
      - { left: "password authentication failed", right: "Benutzer oder Passwort falsch" }
      - { left: "database \"shopp\" does not exist", right: "Tippfehler im Datenbanknamen" }
      - { left: "Download missing driver files", right: "JDBC-Treiber noch nicht installiert" }
    explanation: Lies Fehlermeldungen genau – sie verraten fast immer, welches Feld im Dialog falsch ist.
  - type: single
    question: Wie sieht eine korrekte JDBC-URL für eine SQLite-Datei aus?
    options:
      - "jdbc:sqlite://localhost:5432/lager.db"
      - "jdbc:sqlite:/workspace/phpstorm/lager.db"
      - "sqlite:lager.db@localhost"
    answer: 1
    explanation: SQLite hat keinen Server, also auch keinen Host und Port. Die URL enthält nur den Pfad zur Datei.
tasks:
  - id: klickpfad-postgres
    type: order
    title: Klickpfad für eine PostgreSQL-Datenquelle
    description: >
      Du willst die lokale PostgreSQL-Datenbank `shop` in PhpStorm verbinden. Bring die Schritte in die
      richtige Reihenfolge.
    items:
      - "View | Tool Windows | Database öffnen"
      - "Auf + (New) klicken"
      - "Data Source | PostgreSQL wählen"
      - "Host, Port, User, Password und Database ausfüllen"
      - "Download missing driver files klicken, falls angezeigt"
      - "Test Connection klicken und auf „Succeeded“ warten"
      - "Mit OK speichern"
    hints:
      - Erst das Fenster, dann der Plus-Knopf, dann der Datenbanktyp.
      - Ohne Treiber schlägt der Verbindungstest fehl – also vorher herunterladen.
  - id: sqlite-datei
    type: terminal
    title: Eine SQLite-Datenbank für PhpStorm vorbereiten
    description: |
      Eine SQLite-Datenquelle in PhpStorm zeigt einfach auf eine Datei. Diese Datei legst du jetzt selbst an.
      Der Ordner `sqlite-datei` ist leer.

      1. Lege mit `sqlite3` die Datei `lager.db` an und erstelle darin die Tabelle `products` mit den
         Spalten `id INTEGER PRIMARY KEY`, `name TEXT NOT NULL` und `stock INTEGER NOT NULL`.
      2. Füge **mindestens drei** Produkte ein.
      3. Schreibe die JDBC-URL, die PhpStorm für diese Datei benutzen würde, in die Datei `verbindung.txt`.
         Der vollständige Pfad deines Ordners ist `/workspace/phpstorm/sqlite-datei` – prüfe ihn mit `pwd`.
    workdir: sqlite-datei
    checks:
      - type: file_exists
        path: lager.db
        message: Die Datei lager.db existiert noch nicht. Starte sqlite3 mit dem Dateinamen.
      - type: command
        run: sqlite3 lager.db "SELECT group_concat(name, ',') FROM pragma_table_info('products');"
        stdout_equals: "id,name,stock"
        message: Die Tabelle products braucht genau die Spalten id, name und stock (in dieser Reihenfolge).
      - type: command
        run: sqlite3 lager.db "SELECT count(*) FROM products;"
        stdout_matches: "^([3-9]|[1-9][0-9]+)$"
        message: In products sollen mindestens drei Zeilen stehen.
      - type: command
        run: head -n 1 verbindung.txt
        stdout_matches: "^jdbc:sqlite:/workspace/phpstorm/sqlite-datei/lager\\.db\\s*$"
        message: "In verbindung.txt fehlt die JDBC-URL. Sie beginnt mit jdbc:sqlite: und enthält den absoluten Pfad zu lager.db."
    hints:
      - "`sqlite3 lager.db \"CREATE TABLE products (...);\"` legt Datei und Tabelle in einem Schritt an."
      - "Mehrere Zeilen auf einmal: `INSERT INTO products (name, stock) VALUES ('Schraube', 100), ('Mutter', 80), ('Dübel', 40);`"
      - "Die URL ist `jdbc:sqlite:` direkt gefolgt vom absoluten Pfad: `echo \"jdbc:sqlite:$PWD/lager.db\" > verbindung.txt`"
    solution: |
      ```bash
      sqlite3 lager.db "CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, stock INTEGER NOT NULL);"
      sqlite3 lager.db "INSERT INTO products (name, stock) VALUES ('Schraube', 100), ('Mutter', 80), ('Dübel', 40);"
      echo "jdbc:sqlite:$PWD/lager.db" > verbindung.txt
      cat verbindung.txt
      ```
---
Ein neues Projekt, eine neue Datenbank: Bevor du auch nur eine Zeile sehen kannst, muss PhpStorm wissen,
**wo** die Datenbank läuft und **wie** es sich anmeldet. Diese Angaben speicherst du einmal als
[[datenquelle|Datenquelle]]. In dieser Lektion legst du Datenquellen für die drei häufigsten Systeme an:
[[postgresql|PostgreSQL]], [[mysql|MySQL]] und [[sqlite|SQLite]].

## Was eine Verbindung braucht

PostgreSQL und MySQL laufen als [[server|Server]]-Programm. PhpStorm verbindet sich über das Netzwerk
mit ihnen – auch wenn sie auf deinem eigenen Rechner laufen ([[localhost]]). SQLite ist anders: Die
ganze Datenbank ist eine einzige Datei, es gibt keinen Server.

| Angabe | PostgreSQL | MySQL | SQLite |
|---|---|---|---|
| Host | `localhost` | `localhost` | – |
| [[port|Port]] | 5432 | 3306 | – |
| Benutzer/Passwort | ja | ja | – |
| Datenbank | `shop` | `shop` | – |
| Datei | – | – | `/pfad/zu/lager.db` |

Gesprochen wird über einen [[jdbc-treiber|JDBC-Treiber]]. PhpStorm ist in Java geschrieben und braucht
für jedes Datenbanksystem einen passenden Treiber. Den lädt die IDE beim ersten Mal selbst herunter.

Alle Felder zusammen ergeben die [[jdbc-url|JDBC-URL]], eine Adresse in einer Zeile:

```text title="JDBC-URLs"
jdbc:postgresql://localhost:5432/shop
jdbc:mysql://localhost:3306/shop
jdbc:sqlite:/workspace/phpstorm/sqlite-datei/lager.db
```

## PostgreSQL Schritt für Schritt

1. Öffne **View | Tool Windows | Database**.
2. Klicke auf **+** (New) → **Data Source** → **PostgreSQL**.
   Alternativ: **File | New | Data Source | PostgreSQL**.
3. Im Reiter **General** bleibt **Connection type** auf `default` und **Driver** auf `PostgreSQL`.
4. Erscheint unten **Download missing driver files**, klicke darauf und warte kurz.
5. Fülle aus: **Host** `localhost`, **Port** `5432`, **Authentication** `User & Password`,
   **User**, **Password** und **Database** `shop`.
6. Klicke auf **Test Connection**. Bei Erfolg steht dort „Succeeded“ mit der Serverversion.
7. Bestätige mit **OK**.

![Schema des Dialogs Data Sources and Drivers mit den wichtigsten Feldern](/assets/phpstorm-datenbank-tools/datenquelle-dialog.svg)

Danach erscheint `shop@localhost` im Database-Tool-Fenster. Mit **F4** auf der Datenquelle öffnest du
sofort eine Query-Konsole.

> [!TIPP]
> Im Reiter **Schemas** legst du fest, welche Schemas PhpStorm lädt. Standardmäßig ist es nur das
> Standard-Schema. Fehlen dir Tabellen aus einem anderen Schema, setze dort den Haken.

## MySQL und SQLite

**MySQL** funktioniert genauso: **+ → Data Source → MySQL**, Port `3306`, sonst dieselben Felder. Der
Treiber heißt hier „MySQL“; für MariaDB gibt es einen eigenen Eintrag.

**SQLite** ist einfacher, weil es keinen Server gibt:

1. **+ → Data Source → SQLite**.
2. Im Feld **File** wählst du die Datenbankdatei aus, z. B. `lager.db` in deinem Projekt.
3. Treiber herunterladen, **Test Connection**, **OK**.

Existiert die Datei noch nicht, legt SQLite sie beim ersten Schreiben an. Auf der Kommandozeile reicht dafür
ein einziger Befehl:

```bash title="Terminal"
sqlite3 lager.db "CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, stock INTEGER NOT NULL);"
```

> [!MERKSATZ]
> Server-Datenbanken erreichst du über **Host + Port + Login**, SQLite über einen **Dateipfad**. Das spiegelt
> sich direkt in der JDBC-URL wider.

## Wenn „Test Connection“ fehlschlägt

Die Fehlermeldung verrät fast immer, welches Feld falsch ist:

| Meldung (gekürzt) | Bedeutung | Prüfen |
|---|---|---|
| `Connection refused` | Auf Host/Port läuft kein Server | Läuft die Datenbank? Stimmt der Port? |
| `password authentication failed` | Login abgelehnt | User und Password |
| `database "shopp" does not exist` | Datenbank unbekannt | Feld Database |
| `Download missing driver files` | Treiber fehlt | Link anklicken |

> [!FEHLER]
> Viele speichern die Datenquelle trotz Fehler mit **OK** und wundern sich später über leere Bäume. Klicke
> immer zuerst **Test Connection** und speichere erst bei „Succeeded“.

Passwörter speichert PhpStorm im sicheren Passwortspeicher deines Betriebssystems, nicht im Projektordner.
Über **Save** legst du fest, wie lange: dauerhaft, bis zum Neustart oder gar nicht.

> [!PRAXIS]
> Nutze für jede Umgebung eine eigene Datenquelle mit sprechendem Namen, z. B. `shop (lokal)` und
> `shop (staging)`. Über **Data Source Properties → Options** kannst du eine Verbindung als **Read-only**
> markieren – ein guter Schutz für alles außer deiner lokalen Datenbank.

## Tastenkürzel dieser Lektion

| Aktion | Windows/Linux | macOS |
|---|---|---|
| Neues Element im Tool-Fenster | Alt+Insert | ⌘N |
| Data Sources and Drivers öffnen | Shift+Enter | ⌘; |
| Query-Konsole der Datenquelle | F4 | F4 |
| Datenquelle duplizieren | Ctrl+D | ⌘D |

## Zusammenfassung

- Eine Datenquelle speichert Treiber, Host, Port, Login und Datenbank – oder bei SQLite den Dateipfad.
- Klickpfad: **Database-Fenster → + → Data Source → System wählen → Felder → Test Connection → OK**.
- Fehlende Treiber lädst du über **Download missing driver files**.
- Standard-Ports: PostgreSQL 5432, MySQL 3306; SQLite braucht keinen Port.
- Fehlermeldungen beim Verbindungstest zeigen direkt auf das falsche Feld.
- Fremde Umgebungen bekommen eigene, klar benannte und am besten schreibgeschützte Datenquellen.
