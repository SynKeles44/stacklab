---
title: Composer und Autoloading nachrüsten
summary: Wie du in ein Projekt ohne Composer ein composer.json einführst und alte Klassen, Funktionsdateien und neuen Code mit classmap, files und PSR-4 automatisch lädst.
duration: 22
sources:
  - title: Composer – Autoload (classmap, files, PSR-4)
    url: https://getcomposer.org/doc/04-schema.md#autoload
  - title: Composer – dump-autoload
    url: https://getcomposer.org/doc/03-cli.md#dump-autoload-dumpautoload
  - title: PHP-FIG – PSR-4 Autoloader
    url: https://www.php-fig.org/psr/psr-4/
quiz:
  - type: match
    question: Welche Autoload-Art passt zu welchem Teil der Gemüsekiste?
    pairs:
      - { left: "classmap", right: "Alte Klassen ohne Namespace in classes/" }
      - { left: "files", right: "inc/functions.php mit globalen Funktionen" }
      - { left: "psr-4", right: "Neue Klassen unter src/ mit Namespace Gruenfeld\\" }
    explanation: >
      PSR-4 braucht Namespaces und eine passende Ordnerstruktur. Alte Klassen ohne Namespace lädt die classmap,
      Dateien mit Funktionen bindet files bei jedem Start ein.
  - type: single
    question: Du legst eine neue Datei in `classes/` an, aber PHP findet die Klasse nicht. Was fehlt?
    options:
      - Ein Neustart des Rechners.
      - "`composer dump-autoload`, weil die classmap eine fest erzeugte Liste ist."
      - Ein `require_once` in jeder Datei.
    answer: 1
    explanation: >
      Die classmap durchsucht die Ordner nur beim Erzeugen. Neue Dateien kennt sie erst nach einem erneuten
      `composer dump-autoload`. PSR-4 findet neue Klassen dagegen ohne neuen Lauf.
  - type: single
    question: Warum bleibt `require_once 'config.php';` in der Gemüsekiste erst einmal stehen, statt config.php über `files` zu laden?
    options:
      - Weil Composer keine Dateien mit dem Namen config.php laden darf.
      - Weil Composer files innerhalb einer Funktion einbindet – Variablen wie `$PREISE` wären dann nicht mehr global.
      - Weil config.php zu groß ist.
    answer: 1
    explanation: >
      Composer bindet files aus einer Funktion heraus ein. Variablen, die dort angelegt werden, landen im
      Gültigkeitsbereich dieser Funktion und sind danach weg. Funktionen und Klassen sind dagegen global.
  - type: cloze
    text: "Nach jeder Änderung am Abschnitt `autoload` in composer.json führst du `composer ___` aus. Danach reicht in index.php eine einzige Zeile: `require __DIR__ . '/___/autoload.php';`"
    blanks:
      - [dump-autoload, dumpautoload, dump]
      - [vendor]
    explanation: dump-autoload erzeugt vendor/autoload.php neu – die einzige Datei, die du noch selbst einbindest.
tasks:
  - id: composer-nachruesten
    type: terminal
    title: Rüste Composer in der Gemüsekiste nach
    description: |
      Im Ordner `composer-einfuehren` liegt die Gemüsekiste mit Golden Master. Sie lädt alles per
      `require_once`. Stelle auf Composer-Autoloading um:

      1. Lege `composer.json` an (Name `gruenfeld/gemuesekiste`) mit drei Autoload-Regeln:
         `psr-4` für `Gruenfeld\` → `src/`, `classmap` für `classes/` und `files` für `inc/db.php` und
         `inc/functions.php`.
      2. Lege `src/Geld.php` an: Klasse `Gruenfeld\Geld` mit der statischen Methode
         `formatiere(float $betrag): string`, die genau wie `formatiere_preis()` formatiert. Lass
         `formatiere_preis()` danach an `\Gruenfeld\Geld::formatiere()` weiterreichen (Sprout).
      3. Erzeuge den Autoloader mit `composer dump-autoload`.
      4. Ersetze in `index.php` die drei `require_once` für `inc/` und `classes/` durch
         `require __DIR__ . '/vendor/autoload.php';`. `config.php` bleibt.
      5. Trag `/vendor/` in `.gitignore` ein. Der Golden Master muss grün bleiben.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: composer-einfuehren
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
    checks:
      - type: command
        run: jq -r '.autoload["psr-4"]["Gruenfeld\\"] // empty' composer.json
        stdout_matches: "^src/?$"
        message: composer.json braucht autoload.psr-4 mit "Gruenfeld\\" → "src/".
      - type: command
        run: jq -r '.autoload.classmap // [] | join(" ")' composer.json
        stdout_matches: "classes"
        message: composer.json braucht autoload.classmap mit dem Ordner classes/.
      - type: command
        run: jq -r '.autoload.files // [] | join(" ")' composer.json
        stdout_matches: "(?=.*inc/db\\.php)(?=.*inc/functions\\.php)"
        message: composer.json braucht autoload.files mit inc/db.php und inc/functions.php.
      - type: file_exists
        path: vendor/autoload.php
        message: vendor/autoload.php fehlt. Führe composer dump-autoload aus.
      - type: command
        run: php -r 'require "vendor/autoload.php"; echo Gruenfeld\Geld::formatiere(1234.5);'
        stdout_equals: "1.234,50 EUR"
        message: Gruenfeld\Geld::formatiere(1234.5) soll "1.234,50 EUR" liefern. Liegt die Klasse in src/Geld.php mit namespace Gruenfeld?
      - type: file_contains
        path: inc/functions.php
        pattern: "Geld::formatiere\\("
        message: formatiere_preis() soll an \Gruenfeld\Geld::formatiere() weiterreichen.
      - type: file_contains
        path: index.php
        pattern: "vendor/autoload\\.php"
        message: index.php soll vendor/autoload.php einbinden.
      - type: command
        run: grep -E "require(_once)?[ (]*'(inc|classes)/" index.php
        expect_exit: 1
        message: index.php bindet inc/ oder classes/ noch per require ein. Das übernimmt jetzt der Autoloader.
      - type: file_contains
        path: .gitignore
        pattern: "^/?vendor/?\\s*$"
        message: Trag /vendor/ in .gitignore ein – erzeugte Abhängigkeiten gehören nicht ins Repository.
      - type: command
        run: php tests/golden.php | diff -q - tests/golden-master.txt
        message: Der Golden Master ist rot. Prüfe mit php tests/golden.php | diff - tests/golden-master.txt, was sich geändert hat.
    hints:
      - "Die composer.json aus der Lektion kannst du mit `cat > composer.json <<'EOF' … EOF` anlegen. Danach `composer validate`."
      - "In `formatiere_preis()` reicht: `return \\Gruenfeld\\Geld::formatiere((float) $preis);`"
      - "Für index.php ohne Editor: `sed -i \"/require_once 'inc\\//d; s#require_once 'classes/Bestellung.php';#require __DIR__ . '/vendor/autoload.php';#\" index.php`"
    solution: |
      ```bash
      cd composer-einfuehren
      cat > composer.json <<'EOF'
      {
          "name": "gruenfeld/gemuesekiste",
          "type": "project",
          "require": {
              "php": "^8.4"
          },
          "autoload": {
              "psr-4": { "Gruenfeld\\": "src/" },
              "classmap": ["classes/"],
              "files": ["inc/db.php", "inc/functions.php"]
          }
      }
      EOF
      mkdir -p src
      cat > src/Geld.php <<'EOF'
      <?php
      declare(strict_types=1);

      namespace Gruenfeld;

      final class Geld
      {
          public static function formatiere(float $betrag): string
          {
              return number_format($betrag, 2, ',', '.') . ' EUR';
          }
      }
      EOF
      sed -i "s/return number_format(\$preis, 2, ',', '.') . ' EUR';/return \\\\Gruenfeld\\\\Geld::formatiere((float) \$preis);/" inc/functions.php
      composer dump-autoload
      sed -i "/require_once 'inc\//d; s#require_once 'classes/Bestellung.php';#require __DIR__ . '/vendor/autoload.php';#" index.php
      echo "/vendor/" >> .gitignore
      php tests/golden.php | diff - tests/golden-master.txt && echo "Golden Master grün"
      ```
  - id: autoload-art-zuordnen
    type: dragdrop
    title: Welche Autoload-Art lädt diese Datei?
    description: Ordne jede Datei aus einem gewachsenen Projekt der Composer-Autoload-Art zu, die du für sie wählen würdest.
    targets:
      - { id: psr4, label: psr-4 }
      - { id: classmap, label: classmap }
      - { id: files, label: files }
    items:
      - { label: "`src/Preis/Preisrechner.php` mit `namespace Gruenfeld\\Preis`", target: psr4 }
      - { label: "`classes/Bestellung.php` – Klasse ohne Namespace", target: classmap }
      - { label: "`lib/class.mailer.inc` – zwei Klassen in einer Datei", target: classmap }
      - { label: "`inc/functions.php` – nur globale Funktionen", target: files }
      - { label: "`inc/helpers.php` – Funktionen wie `e()` und `geld()`", target: files }
    hints:
      - Funktionen kann kein Autoloader „bei Bedarf“ laden – nur Klassen.
---
Die Gemüsekiste beginnt jede Anfrage mit vier `require_once`-Zeilen. Jede neue Datei braucht eine weitere Zeile,
und die Reihenfolge muss stimmen. Bibliotheken von außen kannst du gar nicht sauber einbinden. Bevor du modernisierst,
braucht das Projekt ein Fundament: [[composer|Composer]] und [[autoloading|Autoloading]].

## Warum zuerst Composer?

Fast alle Werkzeuge der Modernisierung kommen über Composer: Rector, PHPStan, Pest und die Illuminate-Komponenten.
Und erst mit einem [[autoloader|Autoloader]] kannst du neue Klassen anlegen, ohne an fünf Stellen `require` zu
ergänzen.

| Ohne Composer | Mit Composer |
|---|---|
| `require_once` in jeder Datei | eine Zeile `require 'vendor/autoload.php'` |
| Bibliotheken als kopierte ZIP-Dateien | Versionen in `composer.json` und `composer.lock` |
| Ladereihenfolge muss stimmen | Klassen werden bei Bedarf geladen |
| Werkzeuge global installiert | Werkzeuge als Dev-Abhängigkeit pro Projekt |

Das Schöne: Du musst dafür **keine einzige Klasse umschreiben**. Composer bietet drei Autoload-Arten, und eine
davon passt auch auf uralten Code.

## Drei Autoload-Arten für drei Generationen Code

```json title="composer.json"
{
    "name": "gruenfeld/gemuesekiste",
    "type": "project",
    "require": {
        "php": "^8.4"
    },
    "autoload": {
        "psr-4": { "Gruenfeld\\": "src/" },
        "classmap": ["classes/"],
        "files": ["inc/db.php", "inc/functions.php"]
    }
}
```

| Art | Für | Wie es funktioniert |
|---|---|---|
| `psr-4` | Neuen Code mit [[namespace|Namespaces]] | Klassenname ergibt den Dateipfad |
| [[classmap]] | Alte Klassen ohne Namespace, beliebige Dateinamen | Composer durchsucht Ordner und erzeugt eine Liste |
| `files` | Dateien mit globalen Funktionen | Werden bei **jedem** Start eingebunden |

> [!MERKSATZ]
> **psr-4** für alles Neue, **classmap** für alte Klassen, **files** für Funktionen. So lebt Altcode und neuer
> Code im selben Projekt – das ist die Grundlage für alles Weitere.

## Umstellen in kleinen Schritten

```bash title="Terminal"
composer validate          # composer.json prüfen
composer dump-autoload     # vendor/autoload.php erzeugen
echo "/vendor/" >> .gitignore
```

Dann ersetzt du in `index.php` die Lade-Zeilen:

```php title="index.php"
require_once 'config.php';
require __DIR__ . '/vendor/autoload.php';
```

Nach dem Umstellen läuft der Golden Master. Grün? Commit. Erst danach kommt der nächste Schritt.

> [!FEHLER]
> `config.php` mit in `files` packen. Composer bindet `files` innerhalb einer Funktion ein. Die Variablen
> `$PREISE` und `$DB_PFAD` wären danach nicht mehr global – `global $PREISE` fände nur `null`. Globale
> Variablen bleiben vorerst beim `require_once`, bis sie durch Nahtstellen ersetzt sind.

Hast du später neue Dateien in `classes/`, musst du `composer dump-autoload` erneut ausführen – die classmap ist
eine fest erzeugte Liste. Für den Produktionsserver erzeugst du mit `composer dump-autoload --optimize` eine
schnellere Variante.

## Der erste neue Code unter src/

Jetzt kannst du neuen Code modern schreiben und ihn aus dem Altcode heraus benutzen – eine
[[sprout-methode|Sprout-Methode]] auf Klassenebene:

```php title="src/Geld.php"
<?php
declare(strict_types=1);

namespace Gruenfeld;

final class Geld
{
    public static function formatiere(float $betrag): string
    {
        return number_format($betrag, 2, ',', '.') . ' EUR';
    }
}
```

```php title="inc/functions.php"
function formatiere_preis($preis) {
    return \Gruenfeld\Geld::formatiere((float) $preis);
}
```

Die alte Funktion bleibt als dünne Hülle bestehen. Alle bisherigen Aufrufer funktionieren weiter, neuer Code ruft
direkt `Geld::formatiere()` auf. Irgendwann gibt es keinen alten Aufrufer mehr – dann löschst du die Hülle.

> [!PRAXIS]
> Diese Hüllen-Funktionen markierst du mit einem `@deprecated`-Hinweis im Docblock. IDEs streichen ihre Aufrufe
> dann durch, und PHPStan kann sie melden. So sieht jedes Teammitglied, welcher Weg der neue ist.

## Zusammenfassung

- Composer ist das Fundament jeder PHP-Modernisierung – für Werkzeuge, Bibliotheken und Autoloading.
- **psr-4** lädt neuen Code mit Namespaces, **classmap** alte Klassen, **files** Funktionsdateien.
- Nach jeder Änderung an `autoload` (und neuen Dateien in der classmap) `composer dump-autoload` ausführen.
- `index.php` bindet nur noch `vendor/autoload.php` ein; globale Konfiguration bleibt vorerst beim `require_once`.
- Neuer Code entsteht unter `src/`, alte Funktionen reichen als Hülle an ihn weiter.
- `vendor/` gehört in die `.gitignore`.
