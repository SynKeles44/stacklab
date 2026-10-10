---
title: Erst verstehen, dann ändern
summary: Wie du eine fremde Altanwendung systematisch erkundest – Einstiegspunkte, Abhängigkeiten, globaler Zustand und versteckte Zeitbomben.
duration: 22
sources:
  - title: PHP-Handbuch – Variablen-Gültigkeitsbereich (global)
    url: https://www.php.net/manual/de/language.variables.scope.php
  - title: PHP-Handbuch – require_once
    url: https://www.php.net/manual/de/function.require-once.php
  - title: SQLite – Kommandozeilen-Shell sqlite3
    url: https://sqlite.org/cli.html
quiz:
  - type: single
    question: Was ist der beste erste Schritt, wenn du eine unbekannte Altanwendung übernimmst?
    options:
      - Sofort alle Dateien mit einem Formatierer aufräumen.
      - Die App lokal zum Laufen bringen und ihre Einstiegspunkte finden.
      - Die Datenbank löschen und neu anlegen.
      - Alle globalen Variablen in Konstanten umwandeln.
    answer: 1
    explanation: >
      Bevor du etwas änderst, musst du sehen, wie die App sich verhält. Wer zuerst formatiert oder umbaut,
      zerstört genau die Spur, die er zum Verstehen bräuchte.
  - type: find-bug
    question: Diese Funktion stammt aus der Gemüsekiste. In welcher Zeile steckt die gefährlichste Stelle?
    language: php
    code: |
      function lade_bestellungen($kunde) {
          $sql = "SELECT * FROM bestellungen";
          if ($kunde != '') {
              $sql .= " WHERE kunde = '" . $kunde . "'";
          }
          return db()->query($sql);
      }
    bug_line: 4
    explanation: >
      Der Kundenname wird ungeprüft in das SQL geklebt. Ein Wert wie `x' OR '1'='1` liefert alle Bestellungen
      aller Kunden – eine klassische SQL-Injection. Notiere so etwas beim Erkunden, aber repariere es erst,
      wenn ein Sicherheitsnetz steht (Lektion „Sichere Refactoring-Schritte“).
  - type: multiple
    question: Welche Befehle helfen dir, versteckte Abhängigkeiten in einer PHP-Altanwendung zu finden?
    options:
      - "`grep -rn \"global \" .`"
      - "`grep -rn \"require\\|include\" .`"
      - "`grep -rn \"date(\\|rand(\\|time(\" .`"
      - "`rm -rf vendor`"
    answers: [0, 1, 2]
    explanation: >
      `global` zeigt geteilten Zustand, `require`/`include` die Ladereihenfolge und `date()`, `rand()` oder
      `time()` Stellen, deren Ergebnis von außen beeinflusst wird. Löschen hilft beim Verstehen nicht.
  - type: cloze
    text: Eine Funktion, die mit `___ $PREISE;` auf eine Variable außerhalb zugreift, hat eine versteckte Abhängigkeit. Ihr Ergebnis hängt außerdem vom Wochentag ab, wenn sie `___('N')` aufruft.
    blanks:
      - [global]
      - [date]
    explanation: Beides taucht nicht in der Parameterliste auf – genau deshalb ist es gefährlich.
tasks:
  - id: app-erkunden
    type: terminal
    title: Erkunde die Gemüsekiste
    description: |
      Im Ordner `erkunden` liegt das Bestellsystem der Gemüsekiste Grünfeld. Du sollst noch **nichts ändern**,
      nur verstehen. Halte deine Erkenntnisse in der Datei `notizen.txt` fest – eine Zeile pro Erkenntnis im
      Format `schluessel=wert`.

      1. Finde die Datei, über die jede Anfrage hereinkommt, und notiere sie als `einstieg=…`.
      2. Finde heraus, wo die SQLite-Datenbank liegt (Pfad relativ zum Projektordner): `datenbank=…`.
      3. Zähle die Bestellungen in der Tabelle `bestellungen` mit `sqlite3`: `anzahl_bestellungen=…`.
      4. Suche alle globalen Variablen, auf die Funktionen per `global` zugreifen, und schreibe sie ohne `$`
         mit Kommas getrennt auf: `globale_variablen=…`.
      5. Eine Funktion liefert je nach Wochentag ein anderes Ergebnis. Notiere ihren Namen: `zeitabhaengig=…`.

      Mit `php tools/anfrage.php "/index.php?seite=bestellungen"` kannst du die App ohne Webserver aufrufen.
      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: erkunden
    setup: |
      mkdir -p inc classes seiten tools data
      cat > config.php <<'EOF'
      <?php
      $DB_PFAD = dirname(__FILE__) . '/data/app.db';
      $SHOP_NAME = 'Gemüsekiste Grünfeld';
      $PREISE = array('klein' => 14.9, 'mittel' => 21.5, 'gross' => 29.9);
      EOF
      cat > inc/db.php <<'EOF'
      <?php
      function db() {
          global $DB_PFAD, $DB;
          if (!$DB) {
              $DB = new PDO('sqlite:' . $DB_PFAD);
          }
          return $DB;
      }

      function lade_bestellungen($kunde) {
          $sql = "SELECT * FROM bestellungen";
          if ($kunde != '') {
              $sql .= " WHERE kunde = '" . $kunde . "'";
          }
          $sql .= " ORDER BY id";
          $liste = array();
          foreach (db()->query($sql) as $row) {
              $liste[] = new Bestellung($row);
          }
          return $liste;
      }
      EOF
      cat > inc/functions.php <<'EOF'
      <?php
      function berechne_preis($kiste, $menge, $typ) {
          global $PREISE;
          $preis = $PREISE[$kiste] * $menge;
          if ($typ == 'stamm') {
              $preis = $preis * 0.9;
          }
          if ($menge > 5) {
              $preis = $preis - 2;
          }
          if (date('N') == 6) {
              $preis = $preis + 1.5;
          }
          return round($preis, 2);
      }

      function formatiere_preis($preis) {
          return number_format($preis, 2, ',', '.') . ' EUR';
      }
      EOF
      cat > classes/Bestellung.php <<'EOF'
      <?php
      class Bestellung {
          var $id;
          var $kunde;
          var $kiste;
          var $menge;
          var $typ;

          function __construct($row) {
              $this->id = $row['id'];
              $this->kunde = $row['kunde'];
              $this->kiste = $row['kiste'];
              $this->menge = $row['menge'];
              $this->typ = $row['typ'];
          }

          function preis() {
              return berechne_preis($this->kiste, $this->menge, $this->typ);
          }
      }
      EOF
      cat > index.php <<'EOF'
      <?php
      require_once 'config.php';
      require_once 'inc/db.php';
      require_once 'inc/functions.php';
      require_once 'classes/Bestellung.php';

      $seite = isset($_GET['seite']) ? $_GET['seite'] : 'start';

      if ($seite == 'start') {
          include 'seiten/start.php';
      } elseif ($seite == 'bestellungen') {
          include 'seiten/bestellungen.php';
      } elseif ($seite == 'preis') {
          include 'seiten/preis.php';
      } else {
          echo "<h1>Seite nicht gefunden</h1>\n";
      }
      EOF
      cat > seiten/start.php <<'EOF'
      <h1><?php echo $SHOP_NAME; ?></h1>
      <p>Willkommen! Frisches Gemüse jede Woche.</p>
      EOF
      cat > seiten/bestellungen.php <<'EOF'
      <?php
      $kunde = isset($_GET['kunde']) ? $_GET['kunde'] : '';
      echo "<h1>Bestellungen</h1>\n<ul>\n";
      foreach (lade_bestellungen($kunde) as $b) {
          echo "<li>" . $b->kunde . ": " . $b->menge . "x " . $b->kiste . " = " . formatiere_preis($b->preis()) . "</li>\n";
      }
      echo "</ul>\n";
      EOF
      cat > seiten/preis.php <<'EOF'
      <?php
      $typ = isset($_GET['typ']) ? $_GET['typ'] : 'neu';
      echo formatiere_preis(berechne_preis($_GET['kiste'], $_GET['menge'], $typ)) . "\n";
      EOF
      cat > tools/anfrage.php <<'EOF'
      <?php
      $url = $argv[1] ?? '/index.php';
      parse_str((string) parse_url($url, PHP_URL_QUERY), $_GET);
      $_SERVER['REQUEST_URI'] = $url;
      $_SERVER['REQUEST_METHOD'] = 'GET';
      chdir(dirname(__DIR__));
      require dirname(__DIR__) . '/index.php';
      EOF
      sqlite3 data/app.db "CREATE TABLE bestellungen (id INTEGER PRIMARY KEY, kunde TEXT, kiste TEXT, menge INTEGER, typ TEXT);
      INSERT INTO bestellungen (kunde, kiste, menge, typ) VALUES ('Ada', 'klein', 2, 'stamm'), ('Linus', 'gross', 1, 'neu'), ('Grace', 'mittel', 7, 'stamm'), ('Ada', 'mittel', 1, 'stamm'), ('Margaret', 'gross', 12, 'neu'), ('Alan', 'klein', 3, 'neu');"
    checks:
      - type: file_exists
        path: notizen.txt
        message: Lege die Datei notizen.txt im Ordner erkunden an.
      - type: file_contains
        path: notizen.txt
        pattern: "^einstieg=(\\./)?index\\.php\\s*$"
        message: "Der Einstiegspunkt fehlt oder stimmt nicht. Welche Datei bindet alle anderen ein? Format: einstieg=datei.php"
      - type: file_contains
        path: notizen.txt
        pattern: "^datenbank=(\\./)?data/app\\.db\\s*$"
        message: "Der Pfad zur Datenbank fehlt oder stimmt nicht. Schau in config.php nach $DB_PFAD."
      - type: file_contains
        path: notizen.txt
        pattern: "^anzahl_bestellungen=6\\s*$"
        message: "Die Anzahl der Bestellungen fehlt oder stimmt nicht. Zähle mit sqlite3 data/app.db \"SELECT COUNT(*) FROM bestellungen;\"."
      - type: file_contains
        path: notizen.txt
        pattern: "^globale_variablen=(?=.*PREISE)(?=.*DB_PFAD)(?=.*\\bDB\\b).*$"
        message: "Bei globale_variablen fehlt noch etwas. Suche mit grep -rn \"global \" . – es sind drei Variablen."
      - type: file_contains
        path: notizen.txt
        pattern: "^zeitabhaengig=berechne_preis(\\(\\))?\\s*$"
        message: "Die zeitabhängige Funktion fehlt oder stimmt nicht. Suche nach date( im Code."
    hints:
      - "Starte mit `tree` oder `ls -R`, dann `cat index.php`. Für die Suche ist `grep -rn` dein Freund."
      - "`grep -rn \"global \" .` zeigt alle global-Zeilen, `grep -rn \"date(\" .` die Zeitabhängigkeit."
      - "Notizen anlegen geht ohne Editor: `echo \"einstieg=index.php\" >> notizen.txt`"
    solution: |
      ```bash
      cd erkunden
      tree
      cat index.php
      grep -rn "global " .
      grep -rn "date(" .
      sqlite3 data/app.db "SELECT COUNT(*) FROM bestellungen;"
      echo "einstieg=index.php" > notizen.txt
      echo "datenbank=data/app.db" >> notizen.txt
      echo "anzahl_bestellungen=6" >> notizen.txt
      echo "globale_variablen=PREISE,DB_PFAD,DB" >> notizen.txt
      echo "zeitabhaengig=berechne_preis" >> notizen.txt
      cat notizen.txt
      ```
  - id: erkundungs-reihenfolge
    type: order
    title: In welcher Reihenfolge erkundest du?
    description: Bring die Schritte in eine sinnvolle Reihenfolge für die ersten Stunden mit einer fremden Altanwendung.
    items:
      - App lokal starten und ein paar Seiten aufrufen
      - Einstiegspunkte finden (index.php, Cronjobs, Kommandozeilen-Skripte)
      - Lade- und Aufrufketten verfolgen (require, include, Funktionsaufrufe)
      - Versteckte Abhängigkeiten notieren (global, Datenbank, Datum, Dateisystem)
      - Risiken und offene Fragen aufschreiben
      - Erst danach das Sicherheitsnetz aus Tests planen
    hints:
      - Vom Großen (läuft es überhaupt?) zum Kleinen (welche Funktion hängt woran?).
---
Stell dir vor, du ziehst in eine Altbauwohnung. Bevor du eine Wand einreißt, willst du wissen, ob darin eine
Wasserleitung verläuft. Bei Legacy-Code ist es genauso: Jede Zeile, die du änderst, kann an einer Stelle
wirken, die du nicht siehst. Deshalb kommt vor dem ersten Umbau immer die Erkundung.

## Die App zum Laufen bringen

Die wichtigste Regel: Erst **beobachten**, dann **ändern**. Bring die App lokal zum Laufen und ruf ein paar
Seiten auf. Unsere Gemüsekiste ist so aufgebaut:

```text title="Die Gemüsekiste Grünfeld"
erkunden/
├── index.php              ← jede Anfrage landet hier
├── config.php             ← globale Einstellungen und Preise
├── inc/db.php             ← Datenbankzugriff
├── inc/functions.php      ← Preislogik
├── classes/Bestellung.php ← eine Klasse im PHP-4-Stil
├── seiten/                ← start.php, bestellungen.php, preis.php
├── tools/anfrage.php      ← ruft die App ohne Webserver auf
└── data/app.db            ← SQLite-Datenbank
```

Statt eines Webservers nutzt du ein kleines Hilfsskript. Es setzt `$_GET` aus der URL und bindet
`index.php` ein:

```bash title="Terminal"
php tools/anfrage.php "/index.php?seite=preis&kiste=klein&menge=1"
# 14,90 EUR   (samstags: 16,40 EUR)
```

> [!PRAXIS]
> In echten Projekten ist „die App lokal starten“ oft schon ein halber Tag Arbeit. Schreib jeden Schritt
> in eine README – du bist nicht die letzte Person, die das braucht.

## Einstiegspunkte finden

Ein [[einstiegspunkt|Einstiegspunkt]] ist eine Stelle, an der Ausführung beginnt. In alten PHP-Apps gibt es
oft mehrere:

| Einstiegspunkt | Wie du ihn findest |
|---|---|
| Web-Anfragen | `index.php` oder einzelne PHP-Dateien im Webroot |
| Cronjobs | `crontab -l`, Server-Doku, Ordner wie `cron/` |
| Kommandozeilen-Skripte | Dateien mit `$argv` oder einer [[shebang|Shebang-Zeile]] |
| Formular-Ziele | `action="…"` in HTML-Formularen |

Bei der Gemüsekiste ist `index.php` ein einfacher [[front-controller|Front-Controller]]: Er liest
`$_GET['seite']` und bindet die passende Datei ein.

```php title="index.php"
require_once 'config.php';
require_once 'inc/db.php';
require_once 'inc/functions.php';
require_once 'classes/Bestellung.php';

$seite = isset($_GET['seite']) ? $_GET['seite'] : 'start';
if ($seite == 'start') {
    include 'seiten/start.php';
} elseif ($seite == 'bestellungen') {
    include 'seiten/bestellungen.php';
}
```

Die [[include-anweisung|`require_once`-Kette]] bestimmt, was überhaupt existiert. Vertauschst du zwei
Zeilen, kann eine Funktion plötzlich fehlen.

## Versteckte Abhängigkeiten aufspüren

Gefährlich ist alles, was nicht in der Parameterliste einer Funktion steht. Drei Suchbefehle decken das
Meiste auf:

```bash title="Terminal"
grep -rn "global " .                 # geteilter Zustand
grep -rn "date(\|time(\|rand(" .     # Zeit und Zufall
grep -rn "\$_GET\|\$_POST" .         # Eingaben von außen
```

In der Gemüsekiste findest du zum Beispiel:

```php title="inc/functions.php"
function berechne_preis($kiste, $menge, $typ) {
    global $PREISE;                 // versteckte Abhängigkeit 1
    $preis = $PREISE[$kiste] * $menge;
    // ...
    if (date('N') == 6) {           // versteckte Abhängigkeit 2: Samstag
        $preis = $preis + 1.5;
    }
    return round($preis, 2);
}
```

Eine [[globale-variable|globale Variable]] koppelt Funktionen unsichtbar aneinander. Und `date('N')`
macht das Ergebnis vom Wochentag abhängig – dieselbe Eingabe liefert samstags einen anderen Preis.

> [!FEHLER]
> „Ich habe den Preis zweimal berechnet und er war gleich, also ist die Funktion stabil.“ Getestet am
> Dienstag – und am Samstag wundert sich jemand. Notiere jede Zeit- und Zufallsabhängigkeit, bevor du
> Tests schreibst.

## Die Datenbank ansehen

Daten erzählen oft mehr als Code. Mit der [[sqlite3-shell]] schaust du direkt hinein:

```bash title="Terminal"
sqlite3 data/app.db ".tables"
sqlite3 data/app.db ".schema bestellungen"
sqlite3 data/app.db "SELECT kiste, COUNT(*) FROM bestellungen GROUP BY kiste;"
```

Achte auf Auffälligkeiten: Spalten ohne `NOT NULL`, Zahlen als Text, Werte, die nirgends im Code
vorkommen. All das notierst du.

> [!MERKSATZ]
> Notiere beim Erkunden **alles**, was dich überrascht – aber ändere noch nichts. Ein gefundener Fehler wird
> erst repariert, wenn ein Sicherheitsnetz steht.

## Eine Erkundungskarte schreiben

Am Ende der Erkundung steht eine kurze Karte – eine Textdatei im Repository reicht:

```text title="notizen.txt"
einstieg=index.php
datenbank=data/app.db
globale_variablen=PREISE,DB_PFAD,DB
zeitabhaengig=berechne_preis
risiko=SQL-Injection in lade_bestellungen()
```

Diese Karte ist die Grundlage für alles Weitere: Sie sagt dir, was du absichern musst (die Preislogik),
wo es brennt (SQL) und was Tests schwierig macht (der Wochentag). Mehr Techniken zum Lesen fremden Codes
findest du im Kurs „Fremden Code lesen“.

## Zusammenfassung

- Erst beobachten, dann ändern: Bring die App lokal zum Laufen und ruf Seiten auf.
- Finde alle **Einstiegspunkte** – Web, Cronjobs, Kommandozeile.
- Verfolge die `require`-Ketten, denn sie bestimmen, was existiert.
- Suche versteckte Abhängigkeiten: `global`, `date()`, `rand()`, `$_GET`, Datenbank.
- Schau dir die Daten an – sie verraten Regeln, die im Code fehlen.
- Halte alles in einer Erkundungskarte fest und repariere noch nichts.
