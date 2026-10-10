---
title: PHP Schritt für Schritt upgraden mit Rector
summary: Wie du eine alte Codebasis Version für Version auf aktuelles PHP hebst – mit Deprecations, php -l, PHPStan und automatischen Umbauten durch Rector.
duration: 25
sources:
  - title: PHP – Unterstützte Versionen
    url: https://www.php.net/supported-versions.php
  - title: PHP-Handbuch – Migrationsanleitungen
    url: https://www.php.net/manual/de/appendices.php
  - title: Rector – Dokumentation
    url: https://getrector.com/documentation
  - title: Rector – Levels und schrittweises Vorgehen
    url: https://getrector.com/documentation/levels
quiz:
  - type: single
    question: Ein Projekt läuft auf PHP 7.4 und soll auf PHP 8.5. Wie gehst du vor?
    options:
      - Server direkt auf 8.5 umstellen und schauen, was passiert.
      - Version für Version vorgehen, bei jeder Stufe Deprecations beheben und das Sicherheitsnetz laufen lassen.
      - Den Code komplett neu in PHP 8.5 schreiben.
    answer: 1
    explanation: >
      Jede PHP-Version kündigt Änderungen erst als Deprecation an und entfernt sie später. Wer Stufe für Stufe
      geht, hat bei jedem Schritt eine überschaubare Liste – und der Golden Master zeigt sofort, ob sich Verhalten
      geändert hat.
  - type: match
    question: Ordne jedes Werkzeug seiner Aufgabe beim Upgrade zu.
    pairs:
      - { left: "php -l", right: "Prüft eine Datei auf Syntaxfehler" }
      - { left: "PHPStan", right: "Findet Typfehler und Aufrufe entfernter Funktionen, ohne den Code auszuführen" }
      - { left: "Rector", right: "Schreibt Code automatisch auf neuere Sprachmittel um" }
      - { left: "Golden Master", right: "Zeigt, ob sich das Verhalten der App verändert hat" }
    explanation: Erst die Kombination macht das Upgrade sicher – Rector ändert Code, die anderen Werkzeuge prüfen ihn.
  - type: cloze
    text: "Mit `vendor/bin/rector process ___` siehst du nur, was Rector ändern würde. Hat Rector nichts mehr zu tun, endet dieser Befehl mit Exit-Code ___."
    blanks:
      - ["--dry-run"]
      - ["0"]
    explanation: Bei geplanten Änderungen endet der Probelauf mit Exit-Code 2 – praktisch als Prüfung in der CI-Pipeline.
  - type: multiple
    question: Welche dieser Änderungen kamen mit PHP 8.0 bis 8.4?
    options:
      - Dynamische Eigenschaften (nicht deklarierte Properties) sind seit 8.2 veraltet.
      - "`0 == 'abc'` ist seit 8.0 `false` statt `true`."
      - Implizit nullbare Parameter (`string $x = null`) sind seit 8.4 veraltet.
      - "`array()` wurde in 8.0 entfernt."
    answers: [0, 1, 2]
    explanation: >
      `array()` funktioniert bis heute – Rector schreibt es nur aus Stilgründen zu `[]` um. Die anderen drei
      Änderungen können altes Verhalten tatsächlich brechen oder Warnungen erzeugen.
tasks:
  - id: rector-upgrade
    type: terminal
    title: Hebe die Gemüsekiste mit Rector auf modernes PHP
    description: |
      Im Ordner `rector-upgrade` liegt die Gemüsekiste mit Composer-Autoloading und Golden Master. Der Code ist
      im Stil von PHP 5 geschrieben: `var`, `array()`, `dirname(__FILE__)` und `isset() ? … : …`.

      1. Installiere Rector als Dev-Abhängigkeit:
         `timeout 170 composer require --dev rector/rector` (das kann eine Minute dauern).
      2. Lege `rector.php` an. Es bearbeitet `classes`, `inc`, `seiten`, `src`, `config.php` und `index.php` –
         aber **nicht** `vendor` – und nutzt `withPhpSets(php74: true)`.
      3. Sieh dir zuerst mit `vendor/bin/rector process --dry-run` an, was passieren würde, und wende es dann an.
      4. Prüfe alle geänderten Dateien mit `php -l` und lass den Golden Master laufen – er muss grün bleiben.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: rector-upgrade
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
      cat > composer.json <<'EOF'
      {
          "name": "gruenfeld/gemuesekiste",
          "description": "Bestellsystem der Gemüsekiste Grünfeld",
          "type": "project",
          "require": {
              "php": "^8.4"
          },
          "autoload": {
              "psr-4": {
                  "Gruenfeld\\": "src/"
              },
              "classmap": ["classes/"],
              "files": ["inc/db.php", "inc/functions.php"]
          }
      }
      EOF
      mkdir -p src
      composer dump-autoload -q
      sed -i "/require_once 'inc\/db.php';/d; /require_once 'inc\/functions.php';/d; s#require_once 'classes/Bestellung.php';#require __DIR__ . '/vendor/autoload.php';#" index.php
    checks:
      - type: command
        run: jq -r '."require-dev"["rector/rector"] // empty' composer.json
        stdout_matches: "\\S"
        message: rector/rector steht noch nicht in require-dev. Installiere es mit composer require --dev rector/rector.
      - type: file_exists
        path: vendor/bin/rector
        message: vendor/bin/rector fehlt – ist die Installation durchgelaufen?
      - type: file_contains
        path: rector.php
        pattern: "withPhpSets\\(\\s*php74:\\s*true"
        message: "rector.php soll ->withPhpSets(php74: true) verwenden."
      - type: command
        run: grep -E "__DIR__ ?\. ?'/vendor" rector.php
        expect_exit: 1
        message: Rector soll vendor nicht bearbeiten. Liste nur die eigenen Ordner und Dateien in withPaths() auf.
      - type: command
        run: timeout 150 vendor/bin/rector process --dry-run --no-progress-bar
        message: Rector würde noch Dateien ändern. Wende die Änderungen mit vendor/bin/rector process an.
      - type: command
        run: grep -rnE '^\s*var \$|array\(|dirname\(__FILE__\)' classes inc seiten config.php index.php || true
        stdout_equals: ""
        message: Es gibt noch altes PHP (var, array() oder dirname(__FILE__)). Sind classes, inc, seiten, config.php und index.php in withPaths()?
      - type: command
        run: php tests/golden.php | diff -q - tests/golden-master.txt
        message: Der Golden Master ist rot. Rector hat Verhalten verändert – prüfe mit diff, welche Seite betroffen ist.
    hints:
      - "Schreib `rector.php` mit `RectorConfig::configure()->withPaths([...])->withPhpSets(php74: true)` selbst."
      - "Pfade gibst du als `__DIR__ . '/classes'` usw. an, Dateien genauso: `__DIR__ . '/index.php'`."
      - "Syntax prüfen: `for f in classes/*.php inc/*.php seiten/*.php config.php index.php; do php -l \"$f\"; done`"
    solution: |
      ```bash
      cd rector-upgrade
      timeout 170 composer require --dev rector/rector
      cat > rector.php <<'EOF'
      <?php

      declare(strict_types=1);

      use Rector\Config\RectorConfig;

      return RectorConfig::configure()
          ->withPaths([
              __DIR__ . '/classes',
              __DIR__ . '/inc',
              __DIR__ . '/seiten',
              __DIR__ . '/src',
              __DIR__ . '/config.php',
              __DIR__ . '/index.php',
          ])
          ->withPhpSets(php74: true);
      EOF
      vendor/bin/rector process --dry-run || true
      vendor/bin/rector process
      for f in classes/*.php inc/*.php seiten/*.php config.php index.php; do php -l "$f"; done
      php tests/golden.php | diff - tests/golden-master.txt && echo "Golden Master grün"
      ```
  - id: deprecation-entscheiden
    type: steps
    title: Rector schlägt etwas vor – übernehmen?
    description: Nicht jeder Vorschlag eines Werkzeugs ist automatisch harmlos. Entscheide Schritt für Schritt.
    steps:
      - situation: >
          Rector will `$preis = isset($_GET['preis']) ? $_GET['preis'] : 0;` zu `$preis = $_GET['preis'] ?? 0;`
          umschreiben.
        question: Ändert sich dadurch das Verhalten?
        options:
          - Nein – beide Schreibweisen liefern 0, wenn der Schlüssel fehlt oder null ist.
          - Ja – `??` wirft eine Exception, wenn der Schlüssel fehlt.
        answer: 0
        explanation: Der Null-Coalescing-Operator ist genau die Kurzform der isset()-Abfrage mit Fragezeichen-Operator. Ein sicherer Umbau.
      - situation: >
          Nach dem Upgrade auf PHP 8.2 erscheinen im Log Meldungen „Creation of dynamic property Bestellung::$rabatt
          is deprecated“. Irgendwo schreibt Code `$b->rabatt = 5;`, obwohl die Klasse `$rabatt` nicht deklariert.
        question: Was ist die sauberste Lösung?
        options:
          - Die Eigenschaft `public $rabatt;` in der Klasse deklarieren.
          - Alle Deprecation-Meldungen in der php.ini abschalten.
          - Das Attribut `#[AllowDynamicProperties]` an jede Klasse im Projekt schreiben.
        answer: 0
        explanation: >
          Die Deklaration macht sichtbar, was die Klasse wirklich hat. Abschalten versteckt das Problem, und das
          Attribut ist nur eine Übergangslösung für Fälle, die du nicht sofort beheben kannst.
      - situation: >
          In PHP 8.0 hat sich der Vergleich zwischen Zahlen und Strings geändert. Im Code steht
          `if ($rabattcode == 0) { … }`, und `$rabattcode` ist manchmal ein Text wie `"SOMMER"`.
        question: Was bedeutet das für dein Upgrade?
        options:
          - Nichts – Vergleiche ändern sich nie.
          - Unter PHP 7 war `"SOMMER" == 0` wahr, unter PHP 8 ist es falsch. Der Golden Master oder ein Charakterisierungstest muss genau diesen Fall abdecken.
        answer: 1
        explanation: >
          Solche stillen Verhaltensänderungen findet kein Werkzeug automatisch. Deshalb gehört vor jedes Upgrade ein
          Sicherheitsnetz mit genau den Grenzfällen, die dich betreffen.
---
Auf dem Server der Gemüsekiste läuft eine PHP-Version, die seit Jahren keine Sicherheitsupdates mehr bekommt. Der
Hoster schickt Warn-Mails, und neue Bibliotheken lassen sich nicht installieren, weil sie mindestens PHP 8.3
verlangen. Ein PHP-Upgrade ist fällig – aber wie, ohne die Bestellungen zu gefährden?

## Warum alte PHP-Versionen gefährlich sind

Jede PHP-Version bekommt zwei Jahre aktive Unterstützung und danach zwei Jahre nur noch Sicherheitsupdates.
Danach ist Schluss. Stand Oktober 2026:

| Version | Sicherheitsupdates bis |
|---|---|
| 8.2 | 31.12.2026 |
| 8.3 | 31.12.2027 |
| 8.4 | 31.12.2028 |
| 8.5 | 31.12.2029 |

Alles unter 8.2 ist ohne Sicherheitsupdates. Dazu kommt: Aktuelle Bibliotheken setzen neue Versionen voraus. Wer
stehen bleibt, kann irgendwann **gar nichts** mehr aktualisieren.

> [!MERKSATZ]
> Ein PHP-Upgrade ist kein Luxus, sondern Wartung – wie der TÜV beim Auto. Je länger du wartest, desto größer
> und riskanter wird der Sprung.

## Deprecations: die Vorwarnung

PHP entfernt Funktionen fast nie überraschend. Zuerst kommt eine [[deprecation|Deprecation]] – eine
Warnung „das verschwindet bald“ – und erst eine spätere Version entfernt es. Das macht den Weg planbar:

| Version | Typische Stolpersteine |
|---|---|
| 8.0 | `0 == "abc"` ist jetzt `false`, `each()` und `create_function()` entfernt |
| 8.1 | `null` an Parameter interner Funktionen übergeben ist veraltet |
| 8.2 | Dynamische Eigenschaften veraltet, `"${var}"` in Strings veraltet |
| 8.4 | Implizit nullbare Parameter (`string $x = null`) veraltet |

Schalte in der Entwicklung alle Meldungen ein (`error_reporting(E_ALL)`) und lies die Migrationsanleitungen im
PHP-Handbuch für jede Version, die du überspringst.

## Der Weg: Version für Version

1. **Sicherheitsnetz** steht (Golden Master, Charakterisierungstests).
2. **Syntax prüfen** auf der Zielversion: `php -l datei.php` für jede Datei.
3. **Statische Analyse** mit [[phpstan|PHPStan]] – sie findet Aufrufe entfernter Funktionen, ohne den Code auszuführen.
4. **Automatisch umbauen** mit Rector, eine Stufe nach der anderen.
5. **Testen** auf der neuen Version, Deprecation-Log auswerten.
6. **Ausrollen**, dann die nächste Stufe.

> [!FEHLER]
> „Wir springen direkt von 7.2 auf 8.5.“ Dann prasseln Hunderte Meldungen aus fünf Versionen gleichzeitig auf dich
> ein, und niemand weiß, welche Änderung welchen Fehler verursacht. In Stufen geht es schneller, nicht langsamer.

## Rector: Umbauten automatisch

[[rector|Rector]] liest deinen PHP-Code, versteht ihn als Baum und wendet **Regeln** an – etwa „ersetze
`array()` durch `[]`“. Regeln sind in Sets nach PHP-Versionen gebündelt.

```bash title="Terminal"
composer require --dev rector/rector
```

```php title="rector.php"
<?php

declare(strict_types=1);

use Rector\Config\RectorConfig;

return RectorConfig::configure()
    ->withPaths([
        __DIR__ . '/classes',
        __DIR__ . '/inc',
        __DIR__ . '/seiten',
        __DIR__ . '/src',
        __DIR__ . '/config.php',
        __DIR__ . '/index.php',
    ])
    ->withPhpSets(php74: true);
```

`withPhpSets(php74: true)` aktiviert alle Regeln bis einschließlich PHP 7.4. Später erhöhst du auf `php80: true`,
dann `php81: true` und so weiter. Ohne Argument liest Rector die PHP-Version aus der `composer.json`.

## Probelauf, anwenden, prüfen

```bash title="Terminal"
vendor/bin/rector process --dry-run   # nur anzeigen (Exit-Code 2 bei Änderungen)
vendor/bin/rector process             # wirklich ändern
php tests/golden.php | diff - tests/golden-master.txt
```

Der Probelauf zeigt einen Diff und die angewendeten Regeln:

```diff title="Ausschnitt aus dem Probelauf"
-    var $kunde;
+    public $kunde;
-$kunde = isset($_GET['kunde']) ? $_GET['kunde'] : '';
+$kunde = $_GET['kunde'] ?? '';
```

Bei großen Projekten startest du mit `withPhpLevel(0)` und erhöhst die Zahl in kleinen Schritten – jede Stufe ist
ein eigener, überschaubarer Pull Request.

> [!PRAXIS]
> In vielen Teams läuft `rector process --dry-run` in der CI-Pipeline. Schreibt jemand neuen Code im alten Stil,
> schlägt die Pipeline fehl. So rutscht die Codebasis nach dem Upgrade nicht wieder zurück.

## Zusammenfassung

- PHP-Versionen haben ein festes Supportende – alles unter 8.2 bekommt keine Sicherheitsupdates mehr.
- **Deprecations** kündigen Änderungen an; lies die Migrationsanleitungen für jede übersprungene Version.
- Gehe **Version für Version** vor: `php -l`, PHPStan, Rector, Tests, Ausrollen.
- **Rector** baut Code automatisch um; `withPhpSets(php74: true)` aktiviert alle Regeln bis 7.4.
- Immer erst `--dry-run`, dann anwenden, dann Golden Master prüfen.
- Stille Verhaltensänderungen (z. B. Vergleiche in PHP 8) findet nur dein Sicherheitsnetz.
