---
title: Das Strangler-Fig-Pattern
summary: Wie du eine Anwendung Route für Route ersetzt, statt sie neu zu schreiben – mit einer Routing-Fassade, die zwischen altem und neuem Code verteilt.
duration: 22
sources:
  - title: Martin Fowler – StranglerFigApplication
    url: https://martinfowler.com/bliki/StranglerFigApplication.html
  - title: Microsoft Learn – Strangler Fig pattern
    url: https://learn.microsoft.com/en-us/azure/architecture/patterns/strangler-fig
  - title: Martin Fowler – Branch By Abstraction
    url: https://martinfowler.com/bliki/BranchByAbstraction.html
quiz:
  - type: single
    question: Was ist die Kernidee des Strangler-Fig-Patterns?
    options:
      - Die alte App wird an einem Stichtag komplett durch die neue ersetzt.
      - Eine Fassade leitet Anfrage für Anfrage entweder an alten oder an neuen Code – der neue Teil wächst, der alte schrumpft.
      - Alter Code wird automatisch in neuen übersetzt.
      - Alte und neue App laufen auf getrennten Domains, und die Nutzer wählen.
    answer: 1
    explanation: >
      Wie die Würgefeige, die einen Baum langsam umwächst: Neue Funktionen übernehmen Stück für Stück, bis vom
      Altsystem nichts mehr übrig ist. Jederzeit läuft eine vollständige, funktionierende App.
  - type: multiple
    question: Welche Stellen eignen sich als Routing-Fassade?
    options:
      - Ein Front-Controller wie `index.php`
      - Ein Reverse Proxy wie nginx, der nach Pfaden verteilt
      - Ein Router in einem neuen Framework, der unbekannte Routen an den Altcode weiterreicht
      - Ein Kommentar in jeder alten Datei
    answers: [0, 1, 2]
    explanation: >
      Jede Stelle, an der alle Anfragen vorbeikommen, kann verteilen. Bei Web-Apps ist das ein Front-Controller,
      ein Reverse Proxy oder der Router eines neuen Frameworks mit einer Fallback-Route.
  - type: single
    question: Womit fängst du bei einem Strangler sinnvollerweise an?
    options:
      - Mit dem kompliziertesten, geschäftskritischsten Teil.
      - Mit einem kleinen, gut abgrenzbaren Teil, an dem du den Weg einmal komplett durchspielst.
      - Mit dem Löschen des Altcodes.
    answer: 1
    explanation: >
      Der erste Durchstich zeigt, ob Fassade, Tests und Deployment funktionieren. Danach kommen die wertvollen
      und schwierigen Teile – mit erprobtem Werkzeug.
  - type: cloze
    text: "Läuft eine Route vollständig über den neuen Code und ist der Golden Master grün, wird die alte Datei ___. Sonst hast du zwei Versionen derselben Seite zu pflegen."
    blanks:
      - [gelöscht, entfernt]
    explanation: Ein Strangler ist erst fertig, wenn alter Code wirklich verschwindet. Zurückgelassene Leichen sind neue technische Schulden.
tasks:
  - id: preisseite-erwuergen
    type: terminal
    title: Löse die Preisseite aus dem Altcode
    description: |
      Im Ordner `strangler` liegt die Gemüsekiste mit Composer-Autoloading (`Gruenfeld\` → `src/`) und Golden
      Master. `index.php` ist deine Routing-Fassade.

      1. Lege `src/Seiten/PreisSeite.php` an: Klasse `Gruenfeld\Seiten\PreisSeite` mit der Methode
         `antwort(array $query): string`. Sie liefert **genau** dieselbe Ausgabe wie `seiten/preis.php`
         (inklusive Zeilenumbruch am Ende). Intern darf sie noch `berechne_preis()` und `formatiere_preis()`
         benutzen.
      2. Lass `index.php` die Route `seite=preis` an die neue Klasse geben:
         `echo (new \Gruenfeld\Seiten\PreisSeite())->antwort($_GET);`
      3. Prüfe den Golden Master. Grün? Dann lösche `seiten/preis.php`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: strangler
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
      - type: file_exists
        path: src/Seiten/PreisSeite.php
        message: Lege src/Seiten/PreisSeite.php an – PSR-4 erwartet Gruenfeld\Seiten\PreisSeite genau dort.
      - type: file_contains
        path: src/Seiten/PreisSeite.php
        pattern: "namespace\\s+Gruenfeld\\\\Seiten\\s*;"
        message: PreisSeite.php braucht den Namespace Gruenfeld\Seiten.
      - type: command
        run: php -r 'require "config.php"; require "vendor/autoload.php"; echo (new Gruenfeld\Seiten\PreisSeite())->antwort(["kiste" => "gross", "menge" => "1"]);'
        stdout_matches: "^\\d+,\\d{2} EUR$"
        message: PreisSeite::antwort() soll einen formatierten Preis wie "29,90 EUR" liefern.
      - type: file_contains
        path: index.php
        pattern: "PreisSeite"
        message: index.php soll die Route seite=preis an Gruenfeld\Seiten\PreisSeite weitergeben.
      - type: file_absent
        path: seiten/preis.php
        message: seiten/preis.php existiert noch. Lösche die alte Datei, sobald der Golden Master grün ist.
      - type: command
        run: grep -n "seiten/preis.php" index.php
        expect_exit: 1
        message: index.php bindet noch seiten/preis.php ein.
      - type: command
        run: php tests/golden.php | diff -q - tests/golden-master.txt
        message: Der Golden Master ist rot. Vergleiche die Ausgabe der Preisseite – fehlt der Zeilenumbruch am Ende?
    hints:
      - "Schau dir `seiten/preis.php` genau an: Woher kommt `$typ`, wenn er fehlt? Was steht am Ende der Ausgabe?"
      - "`return formatiere_preis(berechne_preis($query['kiste'], $query['menge'], $query['typ'] ?? 'neu')) . \"\\n\";`"
      - "Öffne `index.php` mit `nano` und ersetze die Zeile `include 'seiten/preis.php';` durch den Aufruf der neuen Klasse. Danach `php tests/golden.php | diff - tests/golden-master.txt`."
    solution: |
      ```bash
      cd strangler
      mkdir -p src/Seiten
      cat > src/Seiten/PreisSeite.php <<'EOF'
      <?php
      declare(strict_types=1);

      namespace Gruenfeld\Seiten;

      final class PreisSeite
      {
          public function antwort(array $query): string
          {
              $typ = $query['typ'] ?? 'neu';

              return formatiere_preis(berechne_preis($query['kiste'], $query['menge'], $typ)) . "\n";
          }
      }
      EOF
      sed -i "s#include 'seiten/preis.php';#echo (new \\\\Gruenfeld\\\\Seiten\\\\PreisSeite())->antwort(\$_GET);#" index.php
      cat index.php
      php tests/golden.php | diff - tests/golden-master.txt && rm seiten/preis.php
      php tests/golden.php | diff - tests/golden-master.txt && echo "Golden Master grün"
      ```
  - id: strangler-diagramm
    type: diagram
    title: Beschrifte das Strangler-Diagramm
    description: Ziehe die Begriffe an die richtige Stelle im Diagramm.
    image: /assets/legacy-modernisieren/strangler-fig-leer.svg
    slots:
      - { x: 12, y: 49, answer: Anfrage }
      - { x: 40, y: 47, answer: Routing-Fassade }
      - { x: 79, y: 25, answer: Neuer Code }
      - { x: 79, y: 71, answer: Altcode }
    distractors: [Datenbank, Golden Master]
---
Ein Neuschreiben auf einen Schlag scheitert meistens – das weißt du seit der ersten Lektion. Aber irgendwann soll die
Gemüsekiste ja wirklich modern sein: neue Klassen, sauberes Routing, vielleicht Laravel. Wie kommst du dahin, ohne
dass es je einen gefährlichen Umschalttag gibt?

## Die Würgefeige als Vorbild

Die Würgefeige keimt in der Krone eines Baumes. Sie schickt Wurzeln nach unten, umwächst den Stamm und übernimmt
nach Jahren seine Rolle. Der alte Baum stirbt ab – aber zu keinem Zeitpunkt steht dort „kein Baum“.

Martin Fowler hat daraus das [[strangler-fig-pattern|Strangler-Fig-Pattern]] gemacht:

1. Vor die alte App kommt eine **Fassade**, an der jede Anfrage vorbeigeht.
2. Für ein kleines Stück Funktionalität baust du neuen Code.
3. Die Fassade schickt die passenden Anfragen an den neuen Code, alles andere weiter an den alten.
4. Ist das Stück stabil, löschst du den alten Teil – und nimmst dir das nächste vor.

![Eine Routing-Fassade verteilt Anfragen: seite=preis geht an den neuen Code unter src/, alles andere an den Altcode unter seiten/](/assets/legacy-modernisieren/strangler-fig.svg)

> [!MERKSATZ]
> Beim Strangler-Fig-Pattern gibt es zu **jedem** Zeitpunkt eine vollständige, lauffähige App. Jeder Schritt ist
> klein, einzeln auslieferbar und einzeln zurücknehmbar.

## Die Fassade finden

Die Fassade ist die Stelle, an der alle Anfragen zusammenlaufen. In der Gemüsekiste ist das der
[[front-controller|Front-Controller]] `index.php`:

```php title="index.php – die Fassade"
require_once 'config.php';
require __DIR__ . '/vendor/autoload.php';

$seite = $_GET['seite'] ?? 'start';

if ($seite == 'start') {
    include 'seiten/start.php';
} elseif ($seite == 'bestellungen') {
    include 'seiten/bestellungen.php';
} elseif ($seite == 'preis') {
    echo (new \Gruenfeld\Seiten\PreisSeite())->antwort($_GET);   // neu
} else {
    echo "<h1>Seite nicht gefunden</h1>\n";
}
```

| Fassade | Wann sinnvoll |
|---|---|
| Front-Controller (`index.php`) | Eine App, ein Einstiegspunkt – wie hier |
| [[reverse-proxy|Reverse Proxy]] (nginx) | Altes und neues System laufen als getrennte Anwendungen |
| Router des neuen Frameworks | Neue App vorne, unbekannte Routen fallen an den Altcode durch |

## Der erste Durchstich

Fang mit etwas Kleinem an, das wenige Abhängigkeiten hat. Die Preisseite ist ideal: eine Eingabe, eine Zeile Ausgabe.

```php title="src/Seiten/PreisSeite.php"
<?php
declare(strict_types=1);

namespace Gruenfeld\Seiten;

final class PreisSeite
{
    public function antwort(array $query): string
    {
        $typ = $query['typ'] ?? 'neu';

        return formatiere_preis(berechne_preis($query['kiste'], $query['menge'], $typ)) . "\n";
    }
}
```

Die neue Klasse ruft intern noch die alten Funktionen auf – das ist gewollt. Erst steht der neue **Rahmen**
(Klasse, Route, Test), danach ersetzt du die **Innereien** Schritt für Schritt, etwa durch den `Preisrechner`.

> [!FEHLER]
> Den ersten Durchstich gleich „richtig“ machen wollen: neue Klasse, neue Preislogik, neues Ausgabeformat. Dann
> meldet der Golden Master zehn Unterschiede, und du weißt nicht, welcher gewollt ist. Erst identisch umziehen,
> dann verbessern.

## Aufräumen gehört dazu

Ist der Golden Master grün und läuft die neue Route eine Weile ohne Probleme, löschst du die alte Datei:

```bash title="Terminal"
php tests/golden.php | diff - tests/golden-master.txt && git rm seiten/preis.php
```

Ein Strangler, der nie aufräumt, hinterlässt **zwei** Versionen jeder Seite – die schlimmste Form technischer
Schulden. Führe eine Liste aller Routen mit ihrem Status:

| Route | Status |
|---|---|
| `seite=preis` | neu, alte Datei gelöscht |
| `seite=bestellungen` | in Arbeit |
| `seite=start` | alt |

Innerhalb des Codes hilft dir dieselbe Idee im Kleinen: Bei Branch by Abstraction legst du eine Schnittstelle vor
die alte Implementierung, baust eine neue dahinter und schaltest um – ganz ohne langlebigen Git-Branch.

> [!PRAXIS]
> Viele Teams stülpen Laravel als neue Fassade über eine alte App: Bekannte Routen landen in Controllern, eine
> Fallback-Route bindet für alles andere die alte `index.php` ein. So zieht die App Route für Route ins Framework.

## Zusammenfassung

- Das **Strangler-Fig-Pattern** ersetzt eine App Stück für Stück statt auf einen Schlag.
- Eine **Fassade** (Front-Controller, Reverse Proxy, neuer Router) verteilt Anfragen auf alten und neuen Code.
- Beginne mit einem **kleinen Durchstich**, der den ganzen Weg einmal zeigt.
- Erst identisch umziehen (Golden Master grün), dann die Innereien verbessern.
- Alten Code **löschen**, sobald die neue Route stabil läuft – sonst pflegst du alles doppelt.
