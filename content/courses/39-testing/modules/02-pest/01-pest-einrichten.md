---
title: Pest einrichten und erste Tests
summary: Du installierst Pest, schreibst Tests mit test() und it() und prüfst Ergebnisse mit Expectations.
duration: 25
sources:
  - title: Pest – Installation
    url: https://pestphp.com/docs/installation
  - title: Pest – Writing Tests
    url: https://pestphp.com/docs/writing-tests
  - title: Pest – Expectations
    url: https://pestphp.com/docs/expectations
  - title: Pest – Exceptions
    url: https://pestphp.com/docs/exceptions
  - title: Composer – allow-plugins
    url: https://getcomposer.org/doc/06-config.md#allow-plugins
quiz:
  - type: single
    question: Warum wird Pest mit `composer require --dev` installiert?
    options:
      - Weil Pest nur in der Entwicklung und in der CI gebraucht wird, nicht auf dem Produktionsserver.
      - Weil Pest sonst nicht mit PHP 8.5 läuft.
      - Weil `--dev` schneller herunterlädt.
    answer: 0
    explanation: Unter `require-dev` stehen Werkzeuge für Entwicklung und Tests. Mit `composer install --no-dev` landen sie gar nicht erst auf dem Server.
  - type: match
    question: Ordne jeder Expectation zu, was sie prüft.
    pairs:
      - { left: "toBe(900)", right: "gleich und gleicher Typ (===)" }
      - { left: "toEqual(['a' => 1])", right: "gleicher Inhalt, auch bei verschiedenen Objekten" }
      - { left: "toHaveCount(3)", right: "Array oder Countable hat genau 3 Elemente" }
      - { left: "toContain('pest')", right: "String oder Array enthält den Wert" }
    explanation: "`toBe` vergleicht strikt wie `===`. `toEqual` vergleicht den Inhalt – praktisch für Arrays und zwei verschiedene Objekte mit gleichen Werten."
  - type: find-bug
    question: Der Test soll prüfen, dass bei leerem Text eine Exception fliegt – er ist aber immer rot. In welcher Zeile liegt der Fehler?
    language: php
    code: |
      <?php

      use App\Slug;

      it('lehnt leeren Text ab', function () {
          expect(Slug::from(''))->toThrow(InvalidArgumentException::class);
      });
    bug_line: 6
    explanation: "`Slug::from('')` wird sofort ausgeführt, die Exception fliegt, bevor `expect()` sie fangen kann. Richtig ist eine Closure: `expect(fn () => Slug::from(''))->toThrow(...)` – oder `->throws(...)` am Test."
  - type: cloze
    text: Pest findet Testdateien standardmäßig im Ordner `___` und nur, wenn ihr Name auf `___` endet.
    blanks:
      - [tests, tests/]
      - [Test.php]
    explanation: "Das legt die `phpunit.xml` fest: `<directory suffix=\"Test.php\">./tests</directory>`. Eine Datei `tests/Unit/slug.php` würde nie ausgeführt."
tasks:
  - id: pest-schritte
    type: order
    title: Pest in ein bestehendes Projekt bringen
    description: Bringe die Schritte in die richtige Reihenfolge, um Pest in ein vorhandenes Composer-Projekt einzubauen und die ersten Tests laufen zu lassen.
    items:
      - "composer config allow-plugins.pestphp/pest-plugin true"
      - "composer require pestphp/pest --dev --with-all-dependencies"
      - "./vendor/bin/pest --init"
      - "Testdatei tests/Unit/SlugTest.php schreiben"
      - "./vendor/bin/pest"
    hints:
      - Composer muss das Plugin erlauben, bevor die Installation es aktivieren kann.
  - id: erste-pest-tests
    type: terminal
    title: Teste die Slug-Klasse
    description: |
      Im Ordner `erste-tests` liegt ein kleines Composer-Projekt mit Pest. Die Klasse `App\Slug` macht
      aus einem Titel einen URL-tauglichen [[slug|Slug]]: `Slug::from('Hallo Welt!')` ergibt `hallo-welt`.
      Ergibt der Text keinen einzigen Buchstaben oder keine Ziffer, wirft sie eine
      `InvalidArgumentException`.

      1. Schau dir `src/Slug.php` an und starte `./vendor/bin/pest` – noch gibt es keine Tests.
      2. Lege `tests/Unit/SlugTest.php` an mit **mindestens drei** Tests:
         - ein Normalfall (z. B. `Hallo Welt!` → `hallo-welt`),
         - ein Fall mit mehreren Leerzeichen oder Sonderzeichen hintereinander,
         - ein Fehlerfall, der die Exception prüft (`->throws(...)` oder `toThrow`).
      3. Starte `./vendor/bin/pest`, bis alles grün ist.

      Klicke zuerst auf **Aufgabe vorbereiten** – dabei installiert Composer Pest (das dauert ein paar
      Sekunden).
    workdir: erste-tests
    setup: |
      cat > composer.json <<'EOF'
      {
          "name": "stacklab/erste-tests",
          "type": "project",
          "require": {
              "php": "^8.4"
          },
          "require-dev": {
              "pestphp/pest": "^5.3"
          },
          "autoload": {
              "psr-4": { "App\\": "src/" }
          },
          "config": {
              "allow-plugins": { "pestphp/pest-plugin": true }
          }
      }
      EOF
      cat > phpunit.xml <<'EOF'
      <?xml version="1.0" encoding="UTF-8"?>
      <phpunit bootstrap="vendor/autoload.php" colors="true">
          <testsuites>
              <testsuite name="Test Suite">
                  <directory suffix="Test.php">./tests</directory>
              </testsuite>
          </testsuites>
          <source>
              <include>
                  <directory>src</directory>
              </include>
          </source>
      </phpunit>
      EOF
      mkdir -p src tests/Unit
      printf '<?php\n' > tests/Pest.php
      cat > src/Slug.php <<'EOF'
      <?php

      declare(strict_types=1);

      namespace App;

      final class Slug
      {
          public static function from(string $text): string
          {
              $slug = strtolower(trim($text));
              $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
              $slug = trim($slug, '-');

              if ($slug === '') {
                  throw new \InvalidArgumentException('Text must contain at least one letter or digit.');
              }

              return $slug;
          }
      }
      EOF
      timeout 150 composer install -n -q </dev/null
    checks:
      - type: file_exists
        path: tests/Unit/SlugTest.php
        message: Lege die Datei tests/Unit/SlugTest.php an – der Name muss auf Test.php enden.
      - type: command
        run: ./vendor/bin/pest tests/Unit/SlugTest.php
        message: Deine Tests sind noch nicht grün. Starte ./vendor/bin/pest und lies die Fehlermeldung.
      - type: command
        run: ./vendor/bin/pest --list-tests tests/Unit/SlugTest.php 2>/dev/null | grep -c '^ - '
        stdout_matches: "^\\s*([3-9]|[1-9][0-9]+)\\s*$"
        message: In SlugTest.php sollten mindestens drei Tests stehen.
      - type: file_contains
        path: tests/Unit/SlugTest.php
        pattern: "(->throws\\(|toThrow\\()"
        message: Es fehlt ein Test für den Fehlerfall – prüfe die InvalidArgumentException mit ->throws(...) oder toThrow.
    hints:
      - "Eine Testdatei beginnt mit `<?php` und `use App\\Slug;`. Danach folgen Aufrufe wie `it('…', function () { … });`."
      - "Normalfall: `expect(Slug::from('Hallo Welt!'))->toBe('hallo-welt');`"
      - "Fehlerfall: `it('lehnt Text ohne Buchstaben ab', function () { Slug::from('!!!'); })->throws(InvalidArgumentException::class);`"
    solution: |
      ```bash
      cd erste-tests
      cat > tests/Unit/SlugTest.php <<'EOF'
      <?php

      use App\Slug;

      it('macht aus einem Titel einen Slug', function () {
          expect(Slug::from('Hallo Welt!'))->toBe('hallo-welt');
      });

      it('fasst mehrere Sonderzeichen zu einem Bindestrich zusammen', function () {
          expect(Slug::from('  PHP   &   Pest  '))->toBe('php-pest');
      });

      it('lehnt Text ohne Buchstaben und Ziffern ab', function () {
          Slug::from('!!!');
      })->throws(InvalidArgumentException::class);
      EOF
      ./vendor/bin/pest
      ```
---
PHP-Projekte haben seit Jahren [[phpunit|PHPUnit]] als Testframework. [[pest|Pest]] baut darauf auf, nimmt
dir aber die Klassen-Zeremonie ab: Ein Test ist eine Funktion mit einem Satz als Namen. Das liest sich
fast wie eine Spezifikation – und ist in modernen Laravel-Projekten der Standard.

## Pest installieren

Pest ist ein [[composer|Composer]]-Paket. Weil du es nur zum Entwickeln brauchst, gehört es in die
[[devdependency|Dev-Abhängigkeiten]]:

```bash title="Terminal"
composer require pestphp/pest --dev --with-all-dependencies
./vendor/bin/pest --init
./vendor/bin/pest
```

Pest bringt ein [[composer-plugin|Composer-Plugin]] mit. Composer führt Plugins aus Sicherheitsgründen nur
aus, wenn du sie erlaubst. Interaktiv fragt Composer nach; ohne Rückfrage (etwa in Skripten) erlaubst du
es vorher:

```bash
composer config allow-plugins.pestphp/pest-plugin true
```

`pest --init` legt das Grundgerüst an:

| Datei | Zweck |
|---|---|
| `phpunit.xml` | Wo liegen Tests, welcher Code zählt für die Abdeckung |
| `tests/Pest.php` | Zentrale Einstellungen und eigene Helfer |
| `tests/TestCase.php` | Basisklasse für Feature-Tests |
| `tests/Unit`, `tests/Feature` | Beispieltests |

> [!HINWEIS]
> Aktuell ist **Pest 5** – es braucht PHP 8.4 oder neuer und nutzt PHPUnit 13 unter der Haube.
> Architekturtests und Mutation Testing sind bereits eingebaut.

## Der erste Test: test() und it()

Eine Testdatei liegt unter `tests/` und endet auf `Test.php`. Darin rufst du `test()` oder `it()` auf:

```php title="tests/Unit/SlugTest.php"
<?php

use App\Slug;

test('ein Titel wird zum Slug', function () {
    expect(Slug::from('Hallo Welt!'))->toBe('hallo-welt');
});

it('entfernt Leerzeichen am Rand', function () {
    expect(Slug::from('  Pest  '))->toBe('pest');
});
```

Beide Funktionen bekommen eine Beschreibung und eine [[closure|Closure]]. `it()` setzt vor die
Beschreibung ein „it“ – so entsteht ein Satz: „it entfernt Leerzeichen am Rand“.

Die Datei `phpunit.xml` legt fest, welche Dateien Pest sucht:

```xml
<directory suffix="Test.php">./tests</directory>
```

> [!FEHLER]
> **Falscher Dateiname.** `tests/Unit/slug.php` oder `tests/Unit/SlugTests.php` werden still ignoriert.
> Pest meldet dann „No tests found“ oder zählt deine Tests einfach nicht mit.

## Expectations: das Ergebnis prüfen

`expect($wert)` gibt ein Objekt zurück, an das du eine [[expectation|Expectation]] hängst:

| Expectation | Prüft |
|---|---|
| `toBe(900)` | strikt gleich (`===`) |
| `toEqual([...])` | gleicher Inhalt (auch verschiedene Objekte) |
| `toBeTrue()`, `toBeNull()` | genau `true` bzw. `null` |
| `toContain('x')` | String oder Array enthält den Wert |
| `toHaveCount(3)` | Anzahl der Elemente |
| `toBeInstanceOf(Slug::class)` | Objekt einer Klasse |
| `toMatch('/^[a-z-]+$/')` | String passt zum regulären Ausdruck |

Expectations lassen sich verketten. `not` dreht die nächste um, `and()` startet eine neue:

```php
expect($slug)
    ->toBeString()
    ->not->toContain(' ')
    ->and(strlen($slug))->toBeLessThan(80);
```

> [!MERKSATZ]
> `toBe` vergleicht wie `===`: `expect('5')->toBe(5)` ist rot. Für Arrays mit gleichem Inhalt oder zwei
> gleich aufgebaute Objekte nimmst du `toEqual`.

## Exceptions testen

Auch ein Fehler ist Verhalten. Pest bietet zwei Wege:

```php
it('lehnt leeren Text ab', function () {
    Slug::from('');
})->throws(InvalidArgumentException::class);

it('nennt den Grund', function () {
    expect(fn () => Slug::from('!!!'))
        ->toThrow(InvalidArgumentException::class, 'at least one letter');
});
```

Bei `toThrow` muss der Aufruf in einer Closure stecken. Sonst fliegt die Exception, bevor `expect()`
überhaupt etwas prüfen kann.

## Tests starten und Ausgaben lesen

```bash
./vendor/bin/pest                       # alle Tests
./vendor/bin/pest tests/Unit/SlugTest.php   # nur eine Datei
./vendor/bin/pest --filter=Slug         # nur Tests, deren Name passt
```

Für größere Suiten gibt es nützliche Schalter:

| Schalter | Wirkung |
|---|---|
| `--bail` | stoppt beim ersten roten Test |
| `--parallel` | verteilt die Tests auf mehrere Prozesse |
| `--dirty` | nur Tests aus Dateien mit nicht committeten Änderungen |
| `--profile` | zeigt die zehn langsamsten Tests |

Ein roter Test zeigt Erwartung, tatsächlichen Wert und die Zeile:

```text
FAILED  Tests\Unit\SlugTest > it entfernt Leerzeichen am Rand
Failed asserting that two strings are identical.
-'pest'
+'-pest-'
```

> [!PRAXIS]
> Im Team startest du lokal oft nur die betroffene Datei oder nutzt `--filter`. Die komplette Suite läuft
> in der CI-Pipeline bei jedem Pull Request. Ein Composer-Skript wie `"test": "pest"` sorgt dafür,
> dass alle denselben Befehl nutzen: `composer test`.

## Zusammenfassung

- Pest installierst du mit `composer require pestphp/pest --dev` und richtest es mit `pest --init` ein.
- Das Composer-Plugin von Pest muss in `allow-plugins` erlaubt sein.
- Tests liegen unter `tests/`, enden auf `Test.php` und nutzen `test()` oder `it()`.
- `expect()` mit Expectations wie `toBe`, `toEqual`, `toContain` prüft Ergebnisse; `not` und `and` verketten.
- Exceptions testest du mit `->throws()` oder `expect(fn () => ...)->toThrow()`.
- `--filter` und Dateipfade beschränken den Lauf auf einzelne Tests.
