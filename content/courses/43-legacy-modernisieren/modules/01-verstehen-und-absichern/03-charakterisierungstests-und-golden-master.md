---
title: Charakterisierungstests und Golden Master
summary: Wie du das heutige Verhalten einer App festhältst – auch das falsche –, damit jeder spätere Umbau sofort auffällt.
duration: 24
sources:
  - title: Pest – Snapshot Testing
    url: https://pestphp.com/docs/snapshot-testing
  - title: PHP-Handbuch – shell_exec
    url: https://www.php.net/manual/de/function.shell-exec.php
  - title: GNU diffutils – diff
    url: https://www.gnu.org/software/diffutils/manual/diffutils.html
quiz:
  - type: single
    question: Was prüft ein Charakterisierungstest?
    options:
      - Ob der Code die fachlich richtigen Ergebnisse liefert.
      - Ob der Code sich heute noch genauso verhält wie zum Zeitpunkt, als der Test geschrieben wurde.
      - Ob der Code schnell genug ist.
      - Ob der Code den Coding-Standard einhält.
    answer: 1
    explanation: >
      Ein Charakterisierungstest beschreibt das **Ist-Verhalten**, nicht das Soll. Er hält auch Fehler fest.
      Sein Zweck ist, unbeabsichtigte Änderungen beim Umbauen sofort sichtbar zu machen.
  - type: single
    question: Dein Charakterisierungstest zeigt, dass `berechne_preis('riesig', 2, 'neu')` den Wert `0` liefert, weil es die Kiste nicht gibt. Was tust du?
    options:
      - Den Fehler sofort beheben, damit der Test schöner aussieht.
      - Das Verhalten so festhalten, den Fehler notieren und ihn später in einem eigenen Schritt bewusst ändern.
      - Den Fall aus dem Test entfernen.
    answer: 1
    explanation: >
      Vielleicht verlässt sich irgendwo jemand auf genau diese 0. Erst festhalten, dann mit dem Fachbereich
      klären, dann in einem eigenen, sichtbaren Commit ändern – inklusive angepasstem Golden Master.
  - type: multiple
    question: Welche Dinge machen einen Golden Master unzuverlässig?
    options:
      - Ausgaben mit dem aktuellen Datum oder der Uhrzeit
      - Zufallswerte wie IDs oder Tokens
      - Eine feste Liste von Eingaben
      - Abhängigkeit von Daten, die sich in der Datenbank ständig ändern
    answers: [0, 1, 3]
    explanation: >
      Alles, was sich zwischen zwei Läufen von selbst ändert, erzeugt Unterschiede, obwohl der Code gleich
      geblieben ist. Feste Eingaben sind dagegen genau das, was ein Golden Master braucht.
  - type: cloze
    text: Den gespeicherten Referenz-Ausgabestand nennt man ___ ___. Ob die aktuelle Ausgabe davon abweicht, zeigt der Befehl `___`.
    blanks:
      - [Golden]
      - [Master]
      - [diff]
    explanation: Die Ausgabe wird einmal gespeichert und danach bei jedem Lauf mit diff verglichen.
tasks:
  - id: golden-master-anlegen
    type: terminal
    title: Lege einen Golden Master für die Gemüsekiste an
    description: |
      Im Ordner `golden` liegt die Gemüsekiste – ohne einen einzigen Test. Bevor jemand sie umbaut, hältst du
      ihr Verhalten fest.

      1. Lege `tests/golden.php` an. Das Skript ruft für eine feste Liste von URLs
         `php tools/anfrage.php <url>` auf und gibt vor jeder Antwort eine Zeile `### <url>` aus
         (Vorlage in der Lektion).
      2. Nimm mindestens diese sieben URLs auf: die Startseite, die Bestellliste, die Bestellliste gefiltert
         auf `kunde=Ada`, drei verschiedene Preisanfragen (eine davon mit `typ=stamm`) und eine Seite, die es
         nicht gibt.
      3. Speichere die Ausgabe als `tests/golden-master.txt`.
      4. Mach die Probe: Ändere in `inc/functions.php` das Dezimalkomma in einen Punkt, vergleiche mit `diff`
         und sieh den Unterschied. Mach die Änderung danach wieder rückgängig.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: golden
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
        path: tests/golden.php
        message: Lege das Skript tests/golden.php an.
      - type: file_exists
        path: tests/golden-master.txt
        message: Speichere die Ausgabe mit php tests/golden.php > tests/golden-master.txt.
      - type: command
        run: grep -c '^### ' tests/golden-master.txt
        stdout_matches: "^([7-9]|[1-9][0-9]+)$"
        message: Der Golden Master braucht mindestens sieben URLs, jede mit einer Zeile "### <url>" davor.
      - type: file_contains
        path: tests/golden-master.txt
        pattern: "kunde=Ada"
        message: Die gefilterte Bestellliste (seite=bestellungen&kunde=Ada) fehlt im Golden Master.
      - type: file_contains
        path: tests/golden-master.txt
        pattern: "typ=stamm"
        message: Eine Preisanfrage mit typ=stamm fehlt im Golden Master.
      - type: file_contains
        path: tests/golden-master.txt
        pattern: "Seite nicht gefunden"
        message: Nimm auch eine Seite auf, die es nicht gibt – Fehlerverhalten gehört ins Sicherheitsnetz.
      - type: file_contains
        path: inc/functions.php
        pattern: "number_format\\(\\$preis, 2, ',', '\\.'\\)"
        message: inc/functions.php ist noch verändert. Mach deine Probe-Änderung rückgängig (Komma als Dezimalzeichen).
      - type: command
        run: php tests/golden.php | diff -q - tests/golden-master.txt
        message: Die aktuelle Ausgabe weicht vom Golden Master ab. Erzeuge den Master neu, nachdem du die Probe-Änderung rückgängig gemacht hast.
    hints:
      - "Die Vorlage für `tests/golden.php` steht im Abschnitt „Einen Golden Master bauen“. Schreib sie mit `cat > tests/golden.php <<'EOF' … EOF`."
      - "Erzeugen: `php tests/golden.php > tests/golden-master.txt`. Vergleichen: `php tests/golden.php | diff - tests/golden-master.txt`."
      - "Für die Probe: `sed -i \"s/2, ',', '.'/2, '.', '.'/\" inc/functions.php` – und zurück mit dem umgekehrten sed-Befehl."
    solution: |
      ```bash
      cd golden
      mkdir -p tests
      cat > tests/golden.php <<'EOF'
      <?php
      $urls = array(
          '/index.php',
          '/index.php?seite=bestellungen',
          '/index.php?seite=bestellungen&kunde=Ada',
          '/index.php?seite=preis&kiste=klein&menge=1',
          '/index.php?seite=preis&kiste=mittel&menge=6&typ=stamm',
          '/index.php?seite=preis&kiste=gross&menge=12',
          '/index.php?seite=gibtsnicht',
      );
      foreach ($urls as $url) {
          echo "### " . $url . "\n";
          echo shell_exec('php ' . escapeshellarg(__DIR__ . '/../tools/anfrage.php') . ' ' . escapeshellarg($url));
      }
      EOF
      php tests/golden.php > tests/golden-master.txt
      sed -i "s/2, ',', '.'/2, '.', '.'/" inc/functions.php
      php tests/golden.php | diff - tests/golden-master.txt || echo "Unterschied gefunden"
      sed -i "s/2, '.', '.'/2, ',', '.'/" inc/functions.php
      php tests/golden.php | diff - tests/golden-master.txt && echo "unverändert"
      ```
  - id: golden-ablauf
    type: order
    title: Der Golden-Master-Kreislauf
    description: Bring die Schritte eines Umbaus mit Golden Master in die richtige Reihenfolge.
    items:
      - Feste Liste von Eingaben festlegen
      - Ausgabe für alle Eingaben erzeugen und als Golden Master speichern
      - Prüfen, ob zwei Läufe hintereinander identisch sind
      - Einen kleinen Umbau-Schritt machen
      - Ausgabe neu erzeugen und mit dem Golden Master vergleichen
      - Bei Unterschied den Schritt rückgängig machen oder untersuchen
    hints:
      - Erst muss der Master stabil sein, dann darfst du umbauen.
---
Du sollst die Preisberechnung der Gemüsekiste umbauen. Woher weißt du hinterher, dass jede Bestellung noch
genau denselben Preis hat? Fachliche Tests kannst du nicht schreiben – niemand kennt alle Regeln. Aber du
kannst etwas viel Einfacheres tun: aufschreiben, was die App **heute** tut, und nach jedem Schritt vergleichen.

## Charakterisierungstests: das Ist festhalten

Ein normaler Test prüft, ob Code das **Richtige** tut. Ein [[charakterisierungstest|Charakterisierungstest]]
prüft, ob Code **dasselbe wie vorher** tut. Er beschreibt das Ist-Verhalten – inklusive aller Macken.

So entsteht einer:

1. Rufe den Code mit einer Eingabe auf.
2. Schreib einen Test mit einer Erwartung, von der du weißt, dass sie falsch ist (etwa `0`).
3. Der Test schlägt fehl und verrät dir den echten Wert.
4. Trag den echten Wert als Erwartung ein. Fertig.

```php title="tests/charakterisierung.php"
require __DIR__ . '/../inc/functions.php';

function pruefe($erwartet, $ist) {
    if ($erwartet !== $ist) {
        echo "FEHLER: erwartet " . var_export($erwartet, true) . ", ist " . var_export($ist, true) . "\n";
        exit(1);
    }
}

pruefe('14,90 EUR', formatiere_preis(14.9));
pruefe('1.234,50 EUR', formatiere_preis(1234.5));
pruefe('-3,00 EUR', formatiere_preis(-3));   // seltsam, aber heute so
echo "OK\n";
```

> [!MERKSATZ]
> Ein Charakterisierungstest sagt nicht „so ist es richtig“, sondern „so ist es heute“. Er macht jede
> **unbeabsichtigte** Änderung sichtbar.

## Der Golden Master: die ganze App als Test

Für jede Funktion einzeln Tests zu schreiben, dauert lange. Ein [[golden-master|Golden Master]] ist der
schnellere Weg: Du schickst eine feste Liste von Eingaben durch die **ganze App**, speicherst die komplette
Ausgabe in einer Datei und vergleichst später jede neue Ausgabe damit.

![Ablauf: feste Eingaben laufen durch die App, die Ausgabe wird einmal als Golden Master gespeichert und danach bei jedem Umbau per diff verglichen](/assets/legacy-modernisieren/golden-master.svg)

| | Charakterisierungstest | Golden Master |
|---|---|---|
| Ebene | Eine Funktion | Die ganze App oder ein großer Teil |
| Aufwand | Pro Fall eine Zeile | Einmal ein Skript |
| Fehlermeldung | Sehr genau | „Irgendwo ist ein Unterschied“ |
| Ideal für | Kern-Logik | Den ersten Schutz vor dem Umbau |

Im Alltag kombinierst du beides: erst ein grober Golden Master, dann gezielte Charakterisierungstests für die
Teile, die du umbaust. In Pest heißt die eingebaute Variante Snapshot-Test (`toMatchSnapshot()`).

## Einen Golden Master bauen

Für die Gemüsekiste reicht ein kleines Skript. Es ruft für jede URL das Hilfsskript `tools/anfrage.php` auf
– jede Anfrage läuft so in einem eigenen PHP-Prozess, genau wie im Webserver:

```php title="tests/golden.php"
<?php
$urls = array(
    '/index.php',
    '/index.php?seite=bestellungen',
    '/index.php?seite=bestellungen&kunde=Ada',
    '/index.php?seite=preis&kiste=klein&menge=1',
    '/index.php?seite=preis&kiste=mittel&menge=6&typ=stamm',
    '/index.php?seite=preis&kiste=gross&menge=12',
    '/index.php?seite=gibtsnicht',
);
foreach ($urls as $url) {
    echo "### " . $url . "\n";
    echo shell_exec('php ' . escapeshellarg(__DIR__ . '/../tools/anfrage.php') . ' ' . escapeshellarg($url));
}
```

Die Zeile `### <url>` vor jeder Antwort zeigt dir später sofort, **welche** Seite sich geändert hat.
Wähle die Eingaben bewusst: normale Fälle, Grenzen (Menge 5 und 6 wegen der Mengenregel) und Fehlerfälle.

## Speichern und vergleichen

```bash title="Terminal"
php tests/golden.php > tests/golden-master.txt        # einmal speichern
php tests/golden.php | diff - tests/golden-master.txt  # nach jedem Schritt
```

[[diff|`diff`]] liest mit `-` die Standardeingabe. Keine Ausgabe und Exit-Code 0 bedeuten: identisch.
Ändert sich etwas, siehst du die Zeilen:

```text title="Ausgabe von diff"
13c13
< 14.90 EUR
---
> 14,90 EUR
```

> [!PRAXIS]
> Den Golden Master committest du ins Repository. In der CI-Pipeline läuft der Vergleich bei jedem Pull
> Request. Ein absichtlich geänderter Master taucht dann sichtbar im Review auf.

## Stolperfallen: Zeit, Zufall, Daten

Ein Golden Master funktioniert nur, wenn er [[deterministisch]] ist – zwei Läufe ohne Codeänderung müssen
identisch sein. Typische Störenfriede:

| Störenfried | Abhilfe |
|---|---|
| Datum und Uhrzeit (`date()`) | Zeit von außen hereingeben (nächste Lektion: Nahtstellen) |
| Zufallswerte, IDs, Tokens | Seed festlegen oder vor dem Vergleich ersetzen |
| Wechselnde Datenbankinhalte | Feste Testdatenbank verwenden |
| Reihenfolge ohne `ORDER BY` | Sortierung erzwingen |

> [!FEHLER]
> Die Gemüsekiste berechnet samstags 1,50 Euro Zuschlag. Erzeugst du den Master am Freitag und vergleichst
> am Samstag, meldet `diff` Unterschiede, obwohl niemand etwas geändert hat. Erzeuge Master und Vergleich
> daher vorerst am selben Tag – und baue die Zeitabhängigkeit als Erstes aus.

Fehler im Ist-Verhalten, die du dabei findest, hältst du fest und notierst sie. Geändert werden sie später –
in einem eigenen Schritt, mit bewusst neu erzeugtem Master.

## Zusammenfassung

- Ein **Charakterisierungstest** hält das Ist-Verhalten fest – auch fehlerhaftes.
- Ein **Golden Master** speichert die komplette Ausgabe für feste Eingaben und vergleicht sie per `diff`.
- Wähle Eingaben bewusst: Normalfälle, Grenzen und Fehlerfälle.
- Der Master muss **deterministisch** sein: Zeit, Zufall und wechselnde Daten stören.
- Gefundene Fehler erst notieren, dann in einem eigenen Schritt ändern.
- Der Golden Master gehört ins Repository und in die CI-Pipeline.
