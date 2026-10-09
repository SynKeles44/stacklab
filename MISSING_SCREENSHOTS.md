# Fehlende Screenshots

Für die PhpStorm-Hilfeseiten von JetBrains gibt es keine Lizenz, die eine Weiterverwendung der Screenshots
erlaubt (siehe [SOURCES.md](SOURCES.md)). Die Lektionen nutzen deshalb nachgebaute, schematische SVGs
und verlinken die offizielle Dokumentation. An den folgenden Stellen würde ein **eigener** Screenshot aus
einer echten PhpStorm-Installation die Lektion verbessern.

Regeln für eigene Screenshots:

- Nur Beispieldaten verwenden (Datenbank `shop`, Benutzer `app`, Hosts `localhost`, `203.0.113.10`,
  `198.51.100.20`, E-Mails `@example.com`). Keine echten Projektnamen, Hostnamen, Pfade mit echtem
  Benutzernamen oder Passwörter.
- Helles Standard-Theme, Fenster auf den relevanten Bereich zuschneiden, PNG.
- Ablage unter `content/screenshots/phpstorm-datenbank-tools/` und Eintrag in der Tabelle in
  [SOURCES.md](SOURCES.md).

## Kurs `phpstorm-datenbank-tools`

| Lektionsdatei | Abschnitt | Was aufnehmen | Vorgeschlagener Dateiname |
|---|---|---|---|
| `modules/01-verbinden-und-navigieren/01-das-database-tool-fenster.md` | Das Fenster öffnen | Menü **View \| Tool Windows** aufgeklappt, Eintrag **Database** markiert | `view-tool-windows-database.png` |
| `modules/01-verbinden-und-navigieren/01-das-database-tool-fenster.md` | Der Objektbaum | Database-Tool-Fenster mit aufgeklapptem Baum `shop@localhost` → `shop` → `public` → `tables` → `orders` mit `columns`, `keys`, `indexes` | `database-toolwindow-baum.png` |
| `modules/01-verbinden-und-navigieren/01-das-database-tool-fenster.md` | Navigieren und suchen | Quick Documentation (Ctrl+Q / F1) auf der Tabelle `orders` | `quick-doc-tabelle.png` |
| `modules/01-verbinden-und-navigieren/02-datenquellen-anlegen.md` | PostgreSQL Schritt für Schritt | Menü **+ → Data Source** mit Untermenü und markiertem Eintrag **PostgreSQL** | `new-data-source-menue.png` |
| `modules/01-verbinden-und-navigieren/02-datenquellen-anlegen.md` | PostgreSQL Schritt für Schritt | Dialog **Data Sources and Drivers**, Reiter **General**, ausgefüllt mit `localhost`, `5432`, `app`, `shop`, inklusive Link **Download missing driver files** | `datenquelle-postgresql-general.png` |
| `modules/01-verbinden-und-navigieren/02-datenquellen-anlegen.md` | PostgreSQL Schritt für Schritt | Ergebnis von **Test Connection** mit „Succeeded“ | `test-connection-succeeded.png` |
| `modules/01-verbinden-und-navigieren/02-datenquellen-anlegen.md` | MySQL und SQLite | SQLite-Datenquelle mit ausgefülltem Feld **File** (`lager.db`) | `datenquelle-sqlite-file.png` |
| `modules/01-verbinden-und-navigieren/02-datenquellen-anlegen.md` | Wenn „Test Connection“ fehlschlägt | Fehlermeldung „Connection refused“ im Verbindungsdialog | `test-connection-refused.png` |
| `modules/01-verbinden-und-navigieren/02-datenquellen-anlegen.md` | Wenn „Test Connection“ fehlschlägt | Reiter **Options** mit angehaktem **Read-only** | `datenquelle-read-only.png` |
| `modules/01-verbinden-und-navigieren/03-docker-und-ssh-tunnel.md` | Den Tunnel in PhpStorm einrichten | Reiter **SSH/SSL** mit angehaktem **Use SSH tunnel** | `ssh-ssl-use-tunnel.png` |
| `modules/01-verbinden-und-navigieren/03-docker-und-ssh-tunnel.md` | Den Tunnel in PhpStorm einrichten | Dialog **SSH Configurations** mit Host `203.0.113.10`, Port `22`, Username `deploy`, Authentication type **Key pair** | `ssh-configuration-dialog.png` |
| `modules/02-daten-und-abfragen/01-der-daten-editor.md` | Filtern und sortieren | Daten-Editor von `orders` mit ausgefülltem **WHERE** (`status = 'open'`) und **ORDER BY** (`total DESC`) | `daten-editor-where-order-by.png` |
| `modules/02-daten-und-abfragen/01-der-daten-editor.md` | Daten bearbeiten | Daten-Editor mit einer geänderten (blau), einer neuen (grün) und einer gelöschten (rot) Zeile | `daten-editor-ausstehende-aenderungen.png` |
| `modules/02-daten-und-abfragen/01-der-daten-editor.md` | Daten bearbeiten | Popup **Preview Pending Changes** mit den erzeugten DML-Anweisungen | `daten-editor-dml-vorschau.png` |
| `modules/02-daten-und-abfragen/02-query-konsolen.md` | Statements ausführen | Query-Konsole mit zwei Statements und der Auswahlliste nach Ctrl+Enter (inkl. Eintrag zum Ausführen aller Statements) | `konsole-statement-auswahl.png` |
| `modules/02-daten-und-abfragen/02-query-konsolen.md` | Parameter statt fester Werte | Dialog zur Eingabe des Werts für `:kunde` | `konsole-parameter-dialog.png` |
| `modules/02-daten-und-abfragen/02-query-konsolen.md` | Die Query-Historie | Dialog **Query History** mit Suchfeld und mehreren Einträgen | `query-history.png` |
| `modules/02-daten-und-abfragen/03-ergebnisse-exportieren-und-vergleichen.md` | Exportieren mit Data Extractors | Dialog **Export Data** mit Extractor `CSV`, **Add column header** und **Output file** | `export-data-dialog.png` |
| `modules/02-daten-und-abfragen/03-ergebnisse-exportieren-und-vergleichen.md` | Exportieren mit Data Extractors | Aufgeklappte Liste der Data Extractors neben dem Export-Knopf | `data-extractors-liste.png` |
| `modules/02-daten-und-abfragen/03-ergebnisse-exportieren-und-vergleichen.md` | Ergebnisse vergleichen | Diff-Viewer nach **Compare Data** mit zwei Ergebnismengen | `compare-data-diff.png` |
| `modules/02-daten-und-abfragen/04-schema-vergleich-und-ddl.md` | DDL ansehen und erzeugen | Fenster **SQL Generator** für die Tabelle `orders` | `sql-generator.png` |
| `modules/02-daten-und-abfragen/04-schema-vergleich-und-ddl.md` | Zwei Strukturen vergleichen | Migrationsdialog mit Origin/Target, Reiter **DDL Diff** und **Script Preview** | `compare-structure-migration.png` |
| `modules/03-abfragen-analysieren/01-ausfuehrungsplaene-lesen.md` | Pläne in PhpStorm | Kontextmenü **Explain Plan** mit **Explain Plan** und **Explain Analyse** | `explain-plan-menue.png` |
| `modules/03-abfragen-analysieren/01-ausfuehrungsplaene-lesen.md` | Pläne in PhpStorm | Reiter **Query Plan** im Services-Fenster mit Plan-Baum (Seq Scan auf `orders`) | `query-plan-baum.png` |
| `modules/03-abfragen-analysieren/01-ausfuehrungsplaene-lesen.md` | Pläne in PhpStorm | **Flame Graph** (Total Cost) desselben Plans | `query-plan-flame-graph.png` |
| `modules/03-abfragen-analysieren/02-mit-indizes-beschleunigen.md` | Wie ein Index hilft | Dialog **New → Index** für `orders` mit Spalten `customer_id`, `status` und SQL-Vorschau | `neuer-index-dialog.png` |
| `modules/03-abfragen-analysieren/02-mit-indizes-beschleunigen.md` | Messen: vorher und nachher | Zwei angeheftete Query-Plan-Tabs nebeneinander (vorher Seq Scan, nachher Index Scan) | `plan-vorher-nachher.png` |
| `modules/04-transaktionen-und-locks/01-transaktionen-in-der-ide.md` | Auto-Commit und manueller Modus | Aufgeklapptes Menü **Tx: Auto** (Transaction Mode and Transaction Isolation) mit Auto/Manual und Isolationsebenen | `tx-modus-menue.png` |
| `modules/04-transaktionen-und-locks/01-transaktionen-in-der-ide.md` | Commit und Roll back im manuellen Modus | Konsolen-Werkzeugleiste im Modus **Tx: Manual** mit aktiven Knöpfen Commit und Roll back | `tx-manual-commit-rollback.png` |
| `modules/04-transaktionen-und-locks/01-transaktionen-in-der-ide.md` | Sitzungen: wer sieht was? | Services-Fenster mit zwei Sitzungen unter `shop@localhost` und Kontextmenü **Tx Mode** | `services-sitzungen.png` |
| `modules/04-transaktionen-und-locks/02-locks-und-deadlocks.md` | Warten sichtbar machen | Zwei Konsolen nebeneinander, die zweite mit drehendem Ausführungs-Indikator (wartet auf Sperre) | `zwei-konsolen-warten.png` |
| `modules/04-transaktionen-und-locks/02-locks-und-deadlocks.md` | So meldet PostgreSQL einen Deadlock | Reiter **Output** mit `ERROR: deadlock detected` und DETAIL-Zeilen | `output-deadlock-detected.png` |
