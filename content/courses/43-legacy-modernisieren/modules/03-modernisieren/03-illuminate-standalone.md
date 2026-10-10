---
title: Illuminate-Komponenten ohne Laravel
summary: Wie du Query Builder, Validierung und Service-Container aus Laravel einzeln in eine Altanwendung holst – ohne das ganze Framework.
duration: 25
sources:
  - title: illuminate/database – README (Capsule)
    url: https://github.com/illuminate/database
  - title: Laravel-Dokumentation – Query Builder
    url: https://laravel.com/docs/13.x/queries
  - title: Laravel-Dokumentation – Validation (Regeln)
    url: https://laravel.com/docs/13.x/validation#available-validation-rules
  - title: Laravel-Dokumentation – Service Container
    url: https://laravel.com/docs/13.x/container
quiz:
  - type: single
    question: Was ist `illuminate/database`?
    options:
      - Eine eigene Datenbank wie MySQL.
      - Die Datenbankschicht von Laravel als einzelnes Composer-Paket – mit Query Builder, Schema Builder und Eloquent.
      - Ein Laravel-Plugin, das nur innerhalb von Laravel funktioniert.
    answer: 1
    explanation: >
      Laravel besteht aus vielen Komponenten, die als eigene Pakete unter `illuminate/*` veröffentlicht werden. Die
      Datenbankschicht lässt sich mit dem Capsule Manager auch ohne Laravel nutzen.
  - type: match
    question: Ordne jedem Paket seine Aufgabe zu.
    pairs:
      - { left: "illuminate/database", right: "Query Builder, Schema Builder und Eloquent" }
      - { left: "illuminate/validation", right: "Eingaben gegen Regeln wie required|integer prüfen" }
      - { left: "illuminate/container", right: "Objekte samt Abhängigkeiten automatisch bauen" }
      - { left: "illuminate/translation", right: "Liefert die Texte für Fehlermeldungen" }
    explanation: Der Validator braucht einen Translator für seine Meldungen – deshalb kommt illuminate/translation automatisch mit.
  - type: find-bug
    question: Dieser Code soll Bestellungen eines Kunden mit dem Query Builder laden. Welche Zeile ist ein Rückschritt?
    language: php
    code: |
      use Illuminate\Database\Capsule\Manager as Capsule;

      function lade_bestellungen(string $kunde): array
      {
          return Capsule::table('bestellungen')
              ->whereRaw("kunde = '" . $kunde . "'")
              ->orderBy('id')
              ->get()
              ->all();
      }
    bug_line: 6
    explanation: >
      `whereRaw()` mit verkettetem Wert öffnet die SQL-Injection wieder. Richtig ist `->where('kunde', $kunde)` –
      der Query Builder bindet den Wert dann als Parameter.
  - type: cloze
    text: "Mit `$capsule->___()` machst du die Verbindung über statische Aufrufe wie `Capsule::table('bestellungen')` verfügbar. Für Eloquent-Models brauchst du zusätzlich `$capsule->___()`."
    blanks:
      - [setAsGlobal]
      - [bootEloquent]
    explanation: Beides ist optional. Für den Query Builder über statische Aufrufe reicht setAsGlobal().
tasks:
  - id: query-builder-einbauen
    type: terminal
    title: Lade Bestellungen mit dem Query Builder
    description: |
      Im Ordner `illuminate` liegt die Gemüsekiste mit Composer-Autoloading und Golden Master. `lade_bestellungen()`
      baut ihr SQL noch selbst.

      1. Installiere die Datenbankschicht: `timeout 170 composer require illuminate/database`.
      2. Lege `bootstrap/datenbank.php` an. Es richtet einen Capsule Manager mit dem Treiber `sqlite` und der Datei
         `data/app.db` ein und ruft `setAsGlobal()` auf.
      3. Binde `bootstrap/datenbank.php` in `index.php` direkt nach `vendor/autoload.php` ein.
      4. Schreib `lade_bestellungen()` in `inc/db.php` auf den Query Builder um: `Capsule::table('bestellungen')`,
         nach `id` sortiert, bei einem Kundennamen mit `where('kunde', …)` gefiltert. Aus jeder Zeile wird wie
         bisher ein `Bestellung`-Objekt (die Zeile ist ein Objekt – wandle sie mit `(array)` um).
      5. Der Golden Master muss grün bleiben, und in `inc/db.php` darf kein `SELECT` mehr stehen.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: illuminate
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
        run: jq -r '.packages[].name' composer.lock
        stdout_matches: "^illuminate/database$"
        message: illuminate/database ist noch nicht installiert (composer require illuminate/database).
      - type: file_exists
        path: bootstrap/datenbank.php
        message: Lege bootstrap/datenbank.php an.
      - type: file_contains
        path: bootstrap/datenbank.php
        pattern: "setAsGlobal\\(\\)"
        message: bootstrap/datenbank.php soll die Capsule mit setAsGlobal() global verfügbar machen.
      - type: file_contains
        path: index.php
        pattern: "bootstrap/datenbank\\.php"
        message: index.php soll bootstrap/datenbank.php einbinden.
      - type: file_contains
        path: inc/db.php
        pattern: "::table\\(\\s*'bestellungen'\\s*\\)"
        message: lade_bestellungen() soll Capsule::table('bestellungen') verwenden.
      - type: command
        run: grep -ci "select" inc/db.php || true
        stdout_equals: "0"
        message: In inc/db.php steht noch SQL. Der Query Builder erzeugt die Abfrage für dich.
      - type: command
        run: php tools/anfrage.php "/index.php?seite=bestellungen&kunde=x' OR '1'='1" | grep -c '<li>' || true
        stdout_equals: "0"
        message: Der SQL-Injection-Versuch liefert Bestellungen. Nutze where('kunde', $kunde) statt whereRaw mit Verkettung.
      - type: command
        run: php tests/golden.php | diff -q - tests/golden-master.txt
        message: Der Golden Master ist rot. Stimmen Sortierung, Filter und die Umwandlung der Zeilen mit (array)?
    hints:
      - "Die Vorlage für `bootstrap/datenbank.php` steht im Abschnitt „Die Datenbankschicht: Capsule“. Der Pfad zur Datei ist `__DIR__ . '/../data/app.db'`."
      - "In index.php: `require __DIR__ . '/bootstrap/datenbank.php';` direkt unter der Autoload-Zeile."
      - "`$abfrage = Capsule::table('bestellungen')->orderBy('id'); if ($kunde != '') { $abfrage->where('kunde', $kunde); } foreach ($abfrage->get() as $row) { $liste[] = new Bestellung((array) $row); }`"
    solution: |
      ```bash
      cd illuminate
      timeout 170 composer require illuminate/database
      mkdir -p bootstrap
      cat > bootstrap/datenbank.php <<'EOF'
      <?php
      use Illuminate\Database\Capsule\Manager as Capsule;

      $capsule = new Capsule();
      $capsule->addConnection([
          'driver' => 'sqlite',
          'database' => __DIR__ . '/../data/app.db',
      ]);
      $capsule->setAsGlobal();
      EOF
      sed -i "s#require __DIR__ . '/vendor/autoload.php';#&\nrequire __DIR__ . '/bootstrap/datenbank.php';#" index.php
      cat > inc/db.php <<'EOF'
      <?php
      use Illuminate\Database\Capsule\Manager as Capsule;

      function lade_bestellungen($kunde) {
          $abfrage = Capsule::table('bestellungen')->orderBy('id');
          if ($kunde != '') {
              $abfrage->where('kunde', $kunde);
          }
          $liste = array();
          foreach ($abfrage->get() as $row) {
              $liste[] = new Bestellung((array) $row);
          }
          return $liste;
      }
      EOF
      php tests/golden.php | diff - tests/golden-master.txt && echo "Golden Master grün"
      ```
  - id: komponente-waehlen
    type: dragdrop
    title: Welche Komponente löst das Problem?
    description: In der Gemüsekiste stehen weitere Umbauten an. Ordne jedes Problem der Illuminate-Komponente zu, die es löst.
    targets:
      - { id: database, label: illuminate/database }
      - { id: validation, label: illuminate/validation }
      - { id: container, label: illuminate/container }
    items:
      - { label: SQL wird in zwölf Dateien per Hand zusammengebaut, target: database }
      - { label: Eine neue Tabelle soll per Code angelegt werden, target: database }
      - { label: "`$_GET['menge']` wird nirgends geprüft – auch `-5` oder `abc` kommen durch", target: validation }
      - { label: Formular-Fehlermeldungen sollen einheitlich auf Deutsch erscheinen, target: validation }
      - { label: "Jede Seite baut `new Preisrechner(new Uhr(), …)` von Hand zusammen", target: container }
      - { label: Im Test soll eine feste Uhr statt der echten verwendet werden, target: container }
    hints:
      - Datenbank = Abfragen und Tabellen. Validierung = Eingaben prüfen. Container = Objekte bauen und austauschen.
---
Die Gemüsekiste soll irgendwann Laravel-Code bekommen. Aber das ganze Framework auf einmal einzuführen, wäre wieder ein
Big Bang. Die gute Nachricht: Laravel ist aus Einzelteilen gebaut, und viele davon funktionieren **ohne** Laravel. Du
kannst dir die besten Stücke heute schon holen – und später ist der Umzug ins Framework viel kleiner.

## Laravel in Einzelteilen

Laravel besteht aus [[illuminate-komponente|Illuminate-Komponenten]]. Jede wird als eigenes Composer-Paket
veröffentlicht, in derselben Version wie das Framework (Stand Oktober 2026: 13.x).

| Paket | Inhalt | Ohne Laravel nutzbar über |
|---|---|---|
| `illuminate/database` | Query Builder, Schema Builder, Eloquent | `Capsule\Manager` |
| `illuminate/validation` | Validierungsregeln | `Validation\Factory` + Translator |
| `illuminate/container` | Service-Container | `new Container()` |
| `illuminate/collections` | `collect()` und Collections | direkt |
| `illuminate/support` | Hilfsklassen wie `Str` | direkt |

Abhängigkeiten wie `illuminate/support` oder `illuminate/contracts` installiert Composer automatisch mit.

> [!MERKSATZ]
> Illuminate-Komponenten sind eine **Brücke**: Neuer Code schreibt sich schon wie Laravel-Code, obwohl die App noch
> keine Laravel-App ist. Später ziehst du ihn fast unverändert ins Framework um.

## Die Datenbankschicht: Capsule

`illuminate/database` richtest du mit dem [[capsule-manager|Capsule Manager]] ein. Er ersetzt, was Laravel sonst
über `config/database.php` erledigt.

```bash title="Terminal"
composer require illuminate/database
```

```php title="bootstrap/datenbank.php"
<?php
use Illuminate\Database\Capsule\Manager as Capsule;

$capsule = new Capsule();
$capsule->addConnection([
    'driver' => 'sqlite',
    'database' => __DIR__ . '/../data/app.db',
]);
$capsule->setAsGlobal();      // erlaubt Capsule::table(...)
// $capsule->bootEloquent();  // nur nötig, wenn du Eloquent-Models nutzt
```

`index.php` bindet die Datei direkt nach `vendor/autoload.php` ein. Ab dann steht die Verbindung überall zur Verfügung.

## Query Builder statt SQL-Strings

Der [[query-builder|Query Builder]] baut SQL aus Methodenaufrufen – und bindet Werte automatisch als Parameter:

```php title="inc/db.php"
use Illuminate\Database\Capsule\Manager as Capsule;

function lade_bestellungen($kunde) {
    $abfrage = Capsule::table('bestellungen')->orderBy('id');
    if ($kunde != '') {
        $abfrage->where('kunde', $kunde);
    }
    $liste = array();
    foreach ($abfrage->get() as $row) {
        $liste[] = new Bestellung((array) $row);
    }
    return $liste;
}
```

`get()` liefert eine Collection von `stdClass`-Objekten – daher `(array) $row` für die alte Klasse. Auch
`Capsule::schema()->create(...)` für Tabellen und [[eloquent|Eloquent]]-Models funktionieren so.

> [!FEHLER]
> `->whereRaw("kunde = '" . $kunde . "'")` – damit baust du die SQL-Injection, die du gerade geschlossen hast, wieder
> ein. `whereRaw()` ist für Sonderfälle mit Platzhaltern gedacht: `->whereRaw('kunde = ?', [$kunde])`.

## Validierung ohne Framework

`$_GET['menge']` wird in der Gemüsekiste nie geprüft. `illuminate/validation` bringt die bekannten Laravel-Regeln mit.
Ohne Framework braucht der Validator einen Translator für seine Meldungen:

```php title="Validierung einer Preisanfrage"
use Illuminate\Translation\ArrayLoader;
use Illuminate\Translation\Translator;
use Illuminate\Validation\Factory;

$loader = new ArrayLoader();
$loader->addMessages('de', 'validation', [
    'in' => ':attribute ist ungültig.',
    'min' => ['numeric' => ':attribute muss mindestens :min sein.'],
]);
$validierung = new Factory(new Translator($loader, 'de'));

$v = $validierung->make($_GET, [
    'kiste' => 'required|in:klein,mittel,gross',
    'menge' => 'required|integer|min:1',
]);
if ($v->fails()) {
    echo implode("\n", $v->errors()->all());   // "kiste ist ungültig." ...
}
```

Ohne eigene Meldungen gibt der Validator nur Schlüssel wie `validation.integer` aus – ein typischer Stolperstein.

## Der Service-Container

Der [[service-container|Service-Container]] baut Objekte samt Abhängigkeiten. Klassen mit typisierten
Konstruktor-Parametern löst er automatisch auf – die Objekt-Nähte aus Modul 2 werden so bequem:

```php
use Illuminate\Container\Container;

$app = new Container();
$app->singleton(Uhr::class, fn () => new SystemUhr());
$rechner = $app->make(Preisrechner::class);   // Uhr wird automatisch hineingegeben
```

Im Test registrierst du stattdessen eine feste Uhr – ohne eine Zeile im `Preisrechner` zu ändern.

> [!PRAXIS]
> Viele gewachsene PHP-Apps holen sich zuerst `illuminate/database` und `illuminate/validation`. Wenn später Laravel
> als Fassade davorgesetzt wird, funktionieren Query-Builder-Code und Validierungsregeln ohne Anpassung weiter.

## Grenzen ohne Framework

Ohne Laravel fehlt alles, was das Framework beim Start einrichtet. Das solltest du kennen, bevor du Code aus der
Laravel-Dokumentation kopierst:

| In Laravel selbstverständlich | Ohne Laravel |
|---|---|
| Facades wie `DB::` oder `Validator::` | gibt es nicht – du nutzt `Capsule::` oder eigene Objekte |
| Model-Events und Observer | brauchen zusätzlich `illuminate/events` und `setEventDispatcher()` |
| Übersetzte Fehlermeldungen | eigene Meldungen über einen Translator |
| Konfiguration aus `config/` | Werte direkt im Bootstrap-Code |

Achte außerdem darauf, dass alle `illuminate/*`-Pakete dieselbe Hauptversion haben. Composer erzwingt das über die
Abhängigkeiten – aber nur, wenn du nicht einzelne Pakete auf alte Versionen festnagelst.

## Zusammenfassung

- Laravel besteht aus **Illuminate-Komponenten**, die einzeln per Composer installierbar sind.
- `illuminate/database` richtest du mit dem **Capsule Manager** ein: `addConnection()`, `setAsGlobal()`, optional `bootEloquent()`.
- Der **Query Builder** ersetzt SQL-Strings und bindet Werte als Parameter – `whereRaw()` nur mit Platzhaltern.
- `illuminate/validation` braucht ohne Framework einen **Translator** mit eigenen Meldungen.
- Der **Service-Container** baut Objekte mit ihren Abhängigkeiten und macht Nähte austauschbar.
- Neuer Code im Laravel-Stil macht den späteren Umzug ins Framework klein.
