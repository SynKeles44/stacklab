---
title: Sichere Refactoring-Schritte
summary: Wie du Altcode in winzigen, jederzeit lauffähigen Schritten umbaust, Umbau und Verhaltensänderung trennst und eine SQL-Injection gezielt schließt.
duration: 22
sources:
  - title: Martin Fowler – Refactoring (Katalog)
    url: https://refactoring.com/catalog/
  - title: PHP-Handbuch – PDO::prepare
    url: https://www.php.net/manual/de/pdo.prepare.php
  - title: OWASP – SQL Injection Prevention Cheat Sheet
    url: https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
quiz:
  - type: single
    question: Wie groß sollte ein einzelner Refactoring-Schritt in Altcode sein?
    options:
      - So groß, dass am Ende des Tages ein Feature fertig ist.
      - So klein, dass der Code danach sofort wieder läuft und der Golden Master grün ist.
      - Eine ganze Datei pro Schritt.
    answer: 1
    explanation: >
      Kleine Schritte bedeuten: Geht etwas schief, weißt du sofort, welcher Schritt schuld war, und kannst ihn
      in Sekunden zurücknehmen. Große Schritte machen die Fehlersuche teuer.
  - type: multiple
    question: Welche Änderungen sind reine Refactorings (Verhalten bleibt gleich)?
    options:
      - Eine Funktion umbenennen und alle Aufrufer anpassen
      - Einen Codeblock in eine eigene Funktion auslagern
      - Den Stammkundenrabatt von 10 auf 12 Prozent ändern
      - Eine magische Zahl `0.9` in eine Konstante `STAMMKUNDEN_FAKTOR` verschieben
    answers: [0, 1, 3]
    explanation: >
      Umbenennen, Auslagern und Konstanten einführen ändern nur die Struktur. Ein neuer Rabatt ist eine
      Verhaltensänderung und gehört in einen eigenen Commit.
  - type: find-bug
    question: Hier wurde die SQL-Injection „repariert“. Welche Zeile ist immer noch gefährlich?
    language: php
    code: |
      function lade_bestellungen($kunde) {
          $kunde = str_replace("'", "", $kunde);
          $sql = "SELECT * FROM bestellungen";
          if ($kunde != '') {
              $sql .= " WHERE kunde = '" . $kunde . "'";
          }
          return db()->query($sql);
      }
    bug_line: 5
    explanation: >
      Zeichen herauszufiltern ist kein Schutz – es gibt Kodierungstricks und andere Kontexte. Solange der Wert in
      das SQL geklebt wird, bleibt das Risiko. Richtig ist ein Prepared Statement mit Platzhalter.
  - type: cloze
    text: "Statt den Wert ins SQL zu kleben, nutzt du einen Platzhalter: `db()->___('SELECT * FROM bestellungen WHERE kunde = ?')` und danach `$stmt->___([$kunde])`."
    blanks:
      - [prepare]
      - [execute]
    explanation: prepare() schickt das SQL ohne Wert an die Datenbank, execute() liefert den Wert getrennt nach.
tasks:
  - id: sql-injection-schliessen
    type: terminal
    title: Schließe die SQL-Injection in kleinen Schritten
    description: |
      Im Ordner `sql-schutz` liegt die Gemüsekiste als Git-Repository – mit Golden Master in
      `tests/golden-master.txt` und einem ersten Commit.

      1. Probiere den Angriff aus:
         `php tools/anfrage.php "/index.php?seite=bestellungen&kunde=x' OR '1'='1"` – du siehst alle Bestellungen.
      2. Baue `lade_bestellungen()` in `inc/db.php` auf ein Prepared Statement mit Platzhalter um
         (`prepare()` und `execute()`). Der Kundenname darf nicht mehr per `.` in das SQL geklebt werden.
      3. Prüfe, dass der Golden Master unverändert grün ist und der Angriff keine Bestellung mehr liefert.
      4. Committe die Änderung als eigenen Commit vom Typ `fix`, z. B. `fix: use prepared statement for orders`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: sql-schutz
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
      git init -q
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      git add -A
      git commit -q -m "chore: import legacy app with golden master"
    checks:
      - type: command
        run: grep -F '. $kunde .' inc/db.php
        expect_exit: 1
        message: In inc/db.php wird $kunde noch per Verkettung in das SQL geklebt. Nutze einen Platzhalter (?) statt der Verkettung.
      - type: file_contains
        path: inc/db.php
        pattern: "->prepare\\("
        message: lade_bestellungen() soll ein Prepared Statement mit ->prepare() verwenden.
      - type: command
        run: php tools/anfrage.php "/index.php?seite=bestellungen&kunde=x' OR '1'='1" | grep -c '<li>' || true
        stdout_equals: "0"
        message: Der Angriff liefert noch Bestellungen. Der Kundenname muss als Parameter an execute() gehen.
      - type: command
        run: php tests/golden.php | diff -q - tests/golden-master.txt
        message: Der Golden Master ist rot – dein Umbau hat das normale Verhalten verändert. Prüfe mit diff, welche Seite betroffen ist (auch die Sortierung nach id muss bleiben).
      - type: command
        run: git log --oneline | wc -l
        stdout_matches: "^\\s*([2-9]|[1-9][0-9]+)\\s*$"
        message: Committe deine Änderung – es soll mindestens einen Commit nach dem Import geben.
      - type: command
        run: git log -1 --format=%s
        stdout_matches: "^fix(\\([^()\\s]+\\))?!?: \\S"
        message: 'Der letzte Commit soll vom Typ fix sein, z. B. "fix: use prepared statement for orders".'
      - type: command
        run: git status --porcelain -- inc
        stdout_equals: ""
        message: In inc/ gibt es noch nicht committete Änderungen.
    hints:
      - "Baue das SQL weiter Stück für Stück, aber mit `?` statt dem Wert, und sammle die Werte in einem Array `$werte`."
      - "`$stmt = db()->prepare($sql); $stmt->execute($werte); foreach ($stmt as $row) { … }` – ein PDOStatement lässt sich direkt durchlaufen."
      - "Vergleichen: `php tests/golden.php | diff - tests/golden-master.txt`, dann `git add inc/db.php && git commit -m \"fix: use prepared statement for orders\"`."
    solution: |
      ```bash
      cd sql-schutz
      php tools/anfrage.php "/index.php?seite=bestellungen&kunde=x' OR '1'='1"
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
          $werte = array();
          if ($kunde != '') {
              $sql .= " WHERE kunde = ?";
              $werte[] = $kunde;
          }
          $sql .= " ORDER BY id";
          $stmt = db()->prepare($sql);
          $stmt->execute($werte);
          $liste = array();
          foreach ($stmt as $row) {
              $liste[] = new Bestellung($row);
          }
          return $liste;
      }
      EOF
      php tests/golden.php | diff - tests/golden-master.txt && echo "Golden Master grün"
      php tools/anfrage.php "/index.php?seite=bestellungen&kunde=x' OR '1'='1"
      git add inc/db.php
      git commit -m "fix: use prepared statement for orders"
      ```
  - id: roter-golden-master
    type: steps
    title: Der Golden Master wird rot – was jetzt?
    description: Spiel einen typischen Moment beim Umbauen durch.
    steps:
      - situation: >
          Du lagerst in `berechne_preis()` die Rabattberechnung in eine neue Funktion `rabatt()` aus. Danach meldet
          der Golden Master eine Abweichung bei `seite=preis&kiste=mittel&menge=6&typ=stamm`: 114,10 statt 116,10.
        question: Was ist der beste nächste Schritt?
        options:
          - Den Golden Master neu erzeugen, damit er wieder grün ist.
          - Den letzten Schritt rückgängig machen (`git restore`) und kleiner neu ansetzen.
          - Weiter umbauen und am Ende alles zusammen prüfen.
        answer: 1
        explanation: >
          Ein Refactoring darf das Verhalten nicht ändern. Der Master hat einen echten Fehler gefunden. Der letzte
          Schritt war klein, also kostet das Zurücknehmen fast nichts.
      - situation: >
          Beim zweiten Versuch siehst du den Grund: Du hast die Reihenfolge von „10 Prozent Rabatt“ und „2 Euro
          Mengenrabatt“ vertauscht. Mathematisch macht das einen Unterschied.
        question: Wie gehst du jetzt vor?
        options:
          - Die alte Reihenfolge beibehalten, auch wenn die neue fachlich sinnvoller wirkt.
          - Die neue Reihenfolge behalten und den Fachbereich nicht fragen.
        answer: 0
        explanation: >
          Im Refactoring-Schritt bleibt das Verhalten exakt gleich. Ob die neue Reihenfolge besser wäre, klärst du
          mit dem Fachbereich – und änderst es dann in einem eigenen, sichtbaren Commit.
---
Du hast jetzt ein Sicherheitsnetz und kennst die Nahtstellen. Trotzdem kannst du Altcode kaputt machen – nämlich
dann, wenn du zu viel auf einmal änderst. Ein roter Golden Master nach drei Stunden Umbau sagt dir nur: „Irgendwo
ist ein Fehler.“ Ein roter Golden Master nach drei Minuten sagt dir genau, wo.

## Winzige Schritte, immer lauffähig

Sicheres [[refactoring|Refactoring]] in Altcode folgt einem festen Kreislauf:

1. Einen **winzigen** Umbau machen (eine Funktion auslagern, eine Variable umbenennen).
2. Golden Master und Charakterisierungstests laufen lassen.
3. Grün? Committen. Rot? Den Schritt zurücknehmen und kleiner neu ansetzen.

```bash title="Der Kreislauf im Terminal"
php tests/golden.php | diff - tests/golden-master.txt && git commit -am "refactor: extract rabatt()"
git restore .   # wenn der Vergleich rot war
```

> [!MERKSATZ]
> Nach jedem Schritt läuft der Code und das Sicherheitsnetz ist grün. Ein Schritt, der länger als ein paar
> Minuten rot bleibt, war zu groß.

Größere Umbauten planst du mit der Mikado-Methode: Du probierst das Ziel, notierst, was dafür zuerst fehlt,
nimmst alles zurück und arbeitest die Voraussetzungen von unten nach oben ab.

## Umbau und Verhaltensänderung trennen

Kent Beck hat das Bild der **zwei Hüte** geprägt: Entweder trägst du den Refactoring-Hut (Struktur ändern,
Verhalten bleibt) oder den Feature-Hut (Verhalten ändern). Nie beide gleichzeitig.

| Refactoring-Hut | Feature- oder Fix-Hut |
|---|---|
| Golden Master bleibt **unverändert** grün | Golden Master ändert sich **bewusst** |
| Commit-Typ `refactor:` | Commit-Typ `feat:` oder `fix:` |
| Reviewer prüft: gleiches Verhalten? | Reviewer prüft: richtiges neues Verhalten? |

> [!FEHLER]
> „Ich räume nur kurz auf und baue dabei den neuen Rabatt ein.“ Im Review sieht niemand mehr, welche Zeile
> Umbau und welche neue Regel ist – und ein Fehler versteckt sich zwischen 200 harmlosen Änderungen.

## Die wichtigsten Handgriffe

Die meisten Umbauten in Altcode bestehen aus wenigen Grundbewegungen aus Martin Fowlers Refactoring-Katalog:

| Refactoring | Beispiel in der Gemüsekiste |
|---|---|
| Funktion extrahieren | Rabattregeln aus `berechne_preis()` in `rabatt()` auslagern |
| Umbenennen | `$typ` → `$kundentyp` |
| Konstante einführen | `0.9` → `STAMMKUNDEN_FAKTOR` |
| Parameter einführen | `$wochentag` statt `date('N')` (Parameter-Naht) |
| Funktion verschieben | `formatiere_preis()` in eine Klasse `Geld` |

Moderne IDEs wie PhpStorm führen viele davon automatisch und sicher aus. In Altcode ohne Typen findet die
IDE aber nicht jeden Aufrufer – prüf mit `grep -rn`, ob wirklich alle erwischt wurden.

## Beispiel: SQL-Injection schließen

Jetzt kommt eine echte, bewusste Verhaltensänderung: die [[sql-injection|SQL-Injection]] aus der
Erkundung. Der alte Code klebt die Nutzereingabe in das SQL:

```php title="inc/db.php – vorher"
$sql .= " WHERE kunde = '" . $kunde . "'";
foreach (db()->query($sql) as $row) {
```

Mit `kunde=x' OR '1'='1` wird daraus `WHERE kunde = 'x' OR '1'='1'` – und jede Bestellung ist sichtbar. Die
Lösung ist ein [[prepared-statement|Prepared Statement]]: SQL und Werte reisen getrennt zur Datenbank.

```php title="inc/db.php – nachher"
$sql = "SELECT * FROM bestellungen";
$werte = array();
if ($kunde != '') {
    $sql .= " WHERE kunde = ?";
    $werte[] = $kunde;
}
$sql .= " ORDER BY id";
$stmt = db()->prepare($sql);
$stmt->execute($werte);
```

Der Golden Master bleibt grün, denn normale Namen verhalten sich wie vorher. Nur der Angriff funktioniert nicht
mehr – genau die eine Verhaltensänderung, die du wolltest.

> [!PRAXIS]
> Sicherheitslücken schließt du sofort, auch wenn das Refactoring drumherum noch nicht fertig ist. Aber als
> eigener `fix:`-Commit, damit er sich notfalls einzeln auf den Produktionsstand übertragen lässt.

## Zusammenfassung

- Refaktoriere in **winzigen** Schritten, nach jedem Schritt Golden Master prüfen und committen.
- Rot nach einem Schritt? Zurücknehmen und kleiner neu ansetzen – nicht weiterbauen.
- Trenne **Refactoring** (`refactor:`) und **Verhaltensänderung** (`feat:`/`fix:`) in eigene Commits.
- Grundbewegungen: extrahieren, umbenennen, Konstante einführen, Parameter einführen, verschieben.
- SQL-Injection schließt du mit **Prepared Statements** – nicht mit Zeichenfiltern.
