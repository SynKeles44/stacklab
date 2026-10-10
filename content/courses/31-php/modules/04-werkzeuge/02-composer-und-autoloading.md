---
title: Namespaces, Composer und PSR-4
summary: Code mit Namespaces ordnen, Pakete mit Composer verwalten und Klassen per PSR-4-Autoloading laden – ohne ein einziges require pro Klasse.
duration: 25
sources:
  - title: PHP-Handbuch – Namespaces
    url: https://www.php.net/manual/de/language.namespaces.php
  - title: Composer – Basic usage
    url: https://getcomposer.org/doc/01-basic-usage.md
  - title: Composer – Das composer.json-Schema (autoload)
    url: https://getcomposer.org/doc/04-schema.md#autoload
  - title: PHP-FIG – PSR-4 Autoloader
    url: https://www.php-fig.org/psr/psr-4/
  - title: Composer – Versionsangaben
    url: https://getcomposer.org/doc/articles/versions.md
quiz:
  - type: single
    question: "In `composer.json` steht `\"App\\\\\": \"src/\"` unter `autoload.psr-4`. In welcher Datei sucht der Autoloader die Klasse `App\\Bestellung\\Rechnung`?"
    options:
      - src/Bestellung/Rechnung.php
      - src/App/Bestellung/Rechnung.php
      - App/Bestellung/Rechnung.php
      - vendor/App/Bestellung/Rechnung.php
    answer: 0
    explanation: >
      Das Präfix `App\` wird durch den Basisordner `src/` ersetzt. Aus dem Rest `Bestellung\Rechnung` wird der
      Pfad `Bestellung/Rechnung.php`.
  - type: match
    question: Ordne jedem Composer-Befehl seine Wirkung zu.
    pairs:
      - { left: "composer require vendor/paket", right: "Paket hinzufügen und installieren" }
      - { left: "composer install", right: "Genau die Versionen aus composer.lock installieren" }
      - { left: "composer update", right: "Neuere passende Versionen holen und composer.lock neu schreiben" }
      - { left: "composer dump-autoload", right: "Nur den Autoloader neu erzeugen" }
    explanation: >
      `install` ist reproduzierbar und gehört auf Server und in die CI. `update` ändert bewusst Versionen und
      ist eine Entscheidung, die du committest.
  - type: find-bug
    question: "Die Datei liegt in `src/Service/Rechner.php`. Beim Aufruf von `berechne()` erscheint `Class \"App\\Service\\DateTimeImmutable\" not found`. Welche Zeile ist schuld?"
    language: php
    code: |
      <?php
      declare(strict_types=1);

      namespace App\Service;

      final class Rechner
      {
          public function berechne(): string
          {
              return (new DateTimeImmutable())->format('Y');
          }
      }
    bug_line: 10
    explanation: >
      Innerhalb eines Namespace werden Klassennamen relativ aufgelöst. Schreibe `new \DateTimeImmutable()` oder
      ergänze oben `use DateTimeImmutable;`.
  - type: cloze
    text: "Der Versionsbereich `^2.4` erlaubt alle Versionen ab 2.4.0 und unter ___. Die genau installierten Versionen stehen in der Datei ___."
    blanks:
      - ["3.0.0", "3.0", "3"]
      - [composer.lock]
    explanation: >
      Das Caret `^` erlaubt alle Updates, die laut Semantic Versioning nichts kaputt machen sollen – also keine
      neue Hauptversion. composer.lock hält die exakten Versionen fest.
  - type: multiple
    question: Was gehört ins Git-Repository einer PHP-Anwendung?
    options: ["composer.json", "composer.lock", "vendor/", "src/"]
    answers: [0, 1, 3]
    explanation: >
      `vendor/` erzeugt Composer jederzeit neu aus composer.lock. Er steht deshalb in `.gitignore`.
tasks:
  - id: initialen
    type: terminal
    title: Dein erstes Composer-Projekt mit PSR-4
    description: |
      Du richtest ein kleines Projekt ein, dessen Klassen automatisch geladen werden.

      Klicke zuerst auf **Aufgabe vorbereiten**. Im Ordner `initialen` liegt dann die Datei `main.php`.
      Sie lädt `vendor/autoload.php` und ruft `App\Text\Initialen::aus($argv[1])` auf – beides gibt es noch nicht.

      1. Lege eine `composer.json` an. Der Paketname ist `stacklab/initialen`, und der Namespace `App\`
         zeigt per PSR-4 auf den Ordner `src/`. (Du kannst `composer init` nutzen oder die Datei selbst schreiben.)
      2. Lege `src/Text/Initialen.php` an: Namespace `App\Text`, Klasse `Initialen` mit der statischen Methode
         `aus(string $name): string`. Sie liefert die großgeschriebenen Anfangsbuchstaben aller Wörter –
         `Ada Lovelace` wird zu `AL`. Denk an Umlaute: `özlem yılmaz` wird zu `ÖY`.
      3. Erzeuge den Autoloader mit `composer dump-autoload`.
      4. Teste: `php main.php "Ada Lovelace"` gibt `AL` aus.
    workdir: initialen
    setup: |
      cat > main.php <<'PHP'
      <?php
      declare(strict_types=1);

      require __DIR__ . '/vendor/autoload.php';

      use App\Text\Initialen;

      echo Initialen::aus($argv[1] ?? '') . PHP_EOL;
      PHP
    checks:
      - type: file_exists
        path: composer.json
        message: Im Ordner initialen fehlt noch die composer.json.
      - type: command
        run: jq -r '.name' composer.json
        stdout_equals: "stacklab/initialen"
        message: 'In composer.json soll "name": "stacklab/initialen" stehen.'
      - type: command
        run: jq -r '.autoload."psr-4" | to_entries[] | .key + "=" + .value' composer.json
        stdout_matches: "^App\\\\=src/?$"
        message: 'Unter autoload.psr-4 soll genau der Eintrag "App\\": "src/" stehen.'
      - type: file_contains
        path: src/Text/Initialen.php
        pattern: "namespace App\\\\Text;"
        message: Die Datei src/Text/Initialen.php braucht die Zeile namespace App\Text;
      - type: file_exists
        path: vendor/autoload.php
        message: Es gibt noch keinen Autoloader – führe composer dump-autoload aus.
      - type: command
        run: php main.php "Ada Lovelace"
        stdout_equals: "AL"
        message: php main.php "Ada Lovelace" soll AL ausgeben.
      - type: command
        run: php main.php "grace brewster hopper"
        stdout_equals: "GBH"
        message: Kleingeschriebene Wörter sollen ebenfalls groß werden – "grace brewster hopper" ergibt GBH.
      - type: command
        run: php main.php "özlem yılmaz"
        stdout_equals: "ÖY"
        message: Umlaute brauchen die mb_*-Funktionen – "özlem yılmaz" soll ÖY ergeben.
    hints:
      - "`composer init --name=stacklab/initialen --autoload=src/ -n` legt composer.json mit dem PSR-4-Eintrag für einen Namespace an. Prüfe danach, ob der Namespace `App\\` heißt – sonst trage ihn selbst ein."
      - "In composer.json schreibst du den Backslash doppelt: `\"autoload\": {\"psr-4\": {\"App\\\\\": \"src/\"}}`."
      - "In der Methode: `preg_split('/\\s+/', trim($name), -1, PREG_SPLIT_NO_EMPTY)` zerlegt den Namen, `mb_strtoupper(mb_substr($wort, 0, 1))` holt den ersten Buchstaben."
    solution: |
      ```json
      {
          "name": "stacklab/initialen",
          "autoload": {
              "psr-4": {
                  "App\\": "src/"
              }
          },
          "require": {}
      }
      ```

      ```php
      <?php
      // src/Text/Initialen.php
      declare(strict_types=1);

      namespace App\Text;

      final class Initialen
      {
          public static function aus(string $name): string
          {
              $woerter = preg_split('/\s+/', trim($name), -1, PREG_SPLIT_NO_EMPTY);

              return implode('', array_map(
                  fn(string $wort): string => mb_strtoupper(mb_substr($wort, 0, 1)),
                  $woerter,
              ));
          }
      }
      ```

      ```bash
      composer dump-autoload
      php main.php "Ada Lovelace"
      ```
  - id: psr4-beschriften
    type: diagram
    title: Vom Klassennamen zur Datei
    description: |
      Die composer.json enthält `"App\\": "src/"`. Beschrifte, wie der Autoloader aus dem Klassennamen
      `App\Text\Slug` den Dateipfad baut: Welche Teile des Namens werden zu welchen Teilen des Pfads?
    image: /assets/php/psr4-autoloading-leer.svg
    slots:
      - { x: 35, y: 31, answer: "App\\" }
      - { x: 61, y: 31, answer: "Text\\Slug" }
      - { x: 35, y: 78, answer: "src/" }
      - { x: 61, y: 78, answer: "Text/Slug.php" }
    distractors: ["vendor/", "App/Text/Slug.php"]
---
Bisher lag dein Code in einer einzigen Datei. Echte Projekte haben Hunderte [[klasse|Klassen]] in vielen Dateien –
und nutzen fremde [[paket|Pakete]], etwa für E-Mails oder PDFs. Wer jede Datei per `require` einbindet, verliert
schnell den Überblick. Und was, wenn zwei Pakete eine Klasse `Logger` mitbringen? Drei Werkzeuge lösen das:
Namespaces, Composer und Autoloading.

## Namespaces: Nachnamen für Klassen

Ein [[namespace|Namespace]] ist wie ein Nachname. Zwei Klassen dürfen `Logger` heißen, solange ihre Namespaces
verschieden sind: `App\Logger` und `Monolog\Logger`.

```php
<?php
declare(strict_types=1);

namespace App\Text;          // gleich nach declare – gilt für die ganze Datei

final class Initialen { /* … */ }
```

Der volle Name der Klasse ist jetzt `App\Text\Initialen`. In anderen Dateien holst du sie mit `use`:

```php
use App\Text\Initialen;
use App\Text\Initialen as Kuerzel;   // mit Alias

echo Initialen::aus('Ada Lovelace');
```

`use` lädt nichts. Es ist nur eine Abkürzung, damit du nicht jedes Mal den vollen Namen schreiben musst.

> [!FEHLER]
> Innerhalb eines Namespace sucht PHP Klassen relativ: `new DateTimeImmutable()` in `namespace App;` wird zu
> `App\DateTimeImmutable` – und die gibt es nicht. Schreibe `new \DateTimeImmutable()` oder oben
> `use DateTimeImmutable;`. Eingebaute **Funktionen** wie `strlen` findet PHP dagegen auch ohne Backslash.

## Composer: der Paketmanager für PHP

[[composer|Composer]] ist der [[paketmanager|Paketmanager]] von PHP. Er lädt Pakete von
[[packagist|Packagist]], der zentralen [[registry|Registry]], und legt sie in den Ordner `vendor/`.

```bash title="Terminal"
composer init                        # composer.json interaktiv anlegen
composer require brick/money         # Paket hinzufügen und installieren
composer require --dev phpunit/phpunit   # nur für die Entwicklung
composer install                     # alles aus composer.lock installieren
composer update                      # passende neuere Versionen holen
```

| Datei/Ordner | Inhalt | Ins Git? |
|---|---|---|
| [[composer-json\|composer.json]] | deine Wünsche: Pakete, Versionsbereiche, Autoloading | ja |
| [[composer-lock\|composer.lock]] | die exakt installierten Versionen | ja (bei Anwendungen) |
| [[vendor-ordner\|vendor/]] | der heruntergeladene Code | nein, `.gitignore` |

Versionsbereiche folgen [[semantic-versioning|Semantic Versioning]]: `^2.4` heißt „ab 2.4.0, aber unter 3.0.0“.
Eine neue Hauptversion darf Dinge kaputt machen, deshalb holt Composer sie nicht automatisch.

> [!MERKSATZ]
> `composer install` installiert, was in composer.lock steht – reproduzierbar auf jedem Rechner. `composer update`
> ändert Versionen und ist eine bewusste Entscheidung.

## Autoloading nach PSR-4

[[autoloading|Autoloading]] heißt: PHP lädt die Datei einer Klasse erst, wenn du die Klasse zum ersten Mal
benutzt. Composer erzeugt dafür einen [[autoloader|Autoloader]] in `vendor/autoload.php`. Du bindest nur diese
eine Datei ein:

```php
require __DIR__ . '/vendor/autoload.php';
```

Woher weiß der Autoloader, wo eine Klasse liegt? Durch eine Regel aus [[psr-4|PSR-4]], einem Standard der PHP-FIG.
Du trägst sie in composer.json ein:

```json
{
    "name": "stacklab/initialen",
    "autoload": {
        "psr-4": { "App\\": "src/" }
    }
}
```

![PSR-4: Das Namespace-Präfix wird zum Basisordner, der Rest des Namens zum Pfad](/assets/php/psr4-autoloading.svg)

1. Das Präfix `App\` wird durch den Ordner `src/` ersetzt.
2. Jeder weitere Namespace-Teil wird ein Unterordner.
3. Der Klassenname wird zum Dateinamen plus `.php` – Groß- und Kleinschreibung zählt!

Den Backslash schreibst du in JSON doppelt (`"App\\"`), weil er dort ein Escape-Zeichen ist.

## Den Autoloader aktuell halten

Nach einer Änderung im `autoload`-Abschnitt erzeugst du den Autoloader neu:

```bash title="Terminal"
composer dump-autoload        # Autoloader neu schreiben
composer dump-autoload -o     # optimiert: feste Klassenliste, schneller in Produktion
```

Neue Klassen in `src/` brauchen dagegen **keinen** neuen Lauf. Die PSR-4-Regel findet sie automatisch.

Typische Fehlerquellen bei „Class not found“:

| Ursache | Lösung |
|---|---|
| Dateiname passt nicht (`initialen.php` statt `Initialen.php`) | Dateiname exakt wie die Klasse |
| Namespace passt nicht zum Ordner | `namespace App\Text;` für `src/Text/` |
| `vendor/autoload.php` nicht eingebunden | `require` am Anfang des Skripts |
| Autoload-Regel geändert, aber nicht neu erzeugt | `composer dump-autoload` |

> [!PRAXIS]
> Laravel-Projekte nutzen genau diese Regel: `"App\\": "app/"`. Deshalb liegt `App\Models\User` in
> `app/Models/User.php`. Wer PSR-4 verstanden hat, findet sich in jedem modernen PHP-Projekt zurecht.

## Zusammenfassung

- Namespaces geben Klassen einen Nachnamen; `use` ist nur eine Abkürzung und lädt nichts.
- In einem Namespace brauchen globale Klassen einen führenden Backslash oder ein `use`.
- Composer verwaltet Pakete: composer.json beschreibt Wünsche, composer.lock die exakten Versionen, `vendor/`
  gehört nicht ins Git.
- `composer install` ist reproduzierbar, `composer update` ändert Versionen bewusst.
- PSR-4 bildet das Namespace-Präfix auf einen Ordner ab; der Rest des Namens wird zum Pfad.
- Ein einziges `require __DIR__ . '/vendor/autoload.php';` lädt alle Klassen bei Bedarf.
