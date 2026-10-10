---
title: Architekturtests mit Pest
summary: Wie du Regeln deiner Codebasis – strict_types, keine Debug-Ausgaben, Namenskonventionen, Schichten – als automatische Tests absicherst.
duration: 20
sources:
  - title: Pest – Architecture Testing
    url: https://pestphp.com/docs/arch-testing
  - title: PHP – Strict Typing
    url: https://www.php.net/manual/de/language.types.declarations.php#language.types.declarations.strict
quiz:
  - type: single
    question: Was prüft ein Architekturtest – im Unterschied zu einem Unit-Test?
    options:
      - Ob eine Funktion für eine Eingabe das richtige Ergebnis liefert.
      - Ob der Code als Ganzes Strukturregeln einhält, z. B. welche Klassen welche benutzen dürfen.
      - Wie schnell die Anwendung startet.
    answer: 1
    explanation: Architekturtests führen keine Geschäftslogik aus. Sie lesen den Code und prüfen Regeln wie Namenskonventionen, verbotene Funktionen oder Abhängigkeiten zwischen Schichten.
  - type: match
    question: Ordne jeder Regel die passende Pest-Expectation zu.
    pairs:
      - { left: "Jede Datei beginnt mit declare(strict_types=1)", right: "toUseStrictTypes()" }
      - { left: "Kein var_dump im Code", right: "not->toBeUsed()" }
      - { left: "Klassen in App\\Http\\Controllers enden auf Controller", right: "toHaveSuffix('Controller')" }
      - { left: "Models werden nur in Repositories verwendet", right: "toOnlyBeUsedIn('App\\Repositories')" }
    explanation: "Alle Regeln beginnen mit `arch()->expect(...)`. Bei Funktionsnamen wie `var_dump` steht der Name im `expect`, bei Namespaces der Namespace."
  - type: find-bug
    question: Diese Regel soll Debug-Ausgaben verbieten, schlägt aber nie an – auch nicht, wenn `dd()` im Code steht. In welcher Zeile liegt der Fehler?
    language: php
    code: |
      <?php

      arch('keine Debug-Ausgaben')
          ->expect(['dd', 'dump', 'var_dump'])
          ->toBeUsed();
    bug_line: 5
    explanation: "Ohne `not` verlangt die Regel das Gegenteil: dass die Funktionen benutzt werden. Richtig ist `->not->toBeUsed()`. (Eine Regel, die nie rot wird, solltest du einmal absichtlich verletzen, um sie zu prüfen.)"
  - type: multiple
    question: Welche Presets bringt Pest für Architekturtests mit?
    options: ["php", "security", "strict", "laravel", "fast"]
    answers: [0, 1, 2, 3]
    explanation: "`arch()->preset()->php()` verbietet z. B. Debug- und veraltete Funktionen, `security()` riskante wie `eval` oder `md5`, `strict()` verlangt strenge Regeln wie final-Klassen, `laravel()` Laravel-Konventionen. Daneben gibt es `relaxed()` und eigene Presets."
tasks:
  - id: regeln-zuordnen
    type: dragdrop
    title: Unit-Test oder Architekturtest?
    description: Dein Team sammelt Anforderungen. Ordne jede einem Testtyp zu, mit dem du sie am besten absicherst.
    targets:
      - { id: arch, label: Architekturtest }
      - { id: unit, label: Unit-Test }
    items:
      - { label: Kein Code ruft dd() oder dump() auf, target: arch }
      - { label: Alle Klassen in App\Models sind final, target: arch }
      - { label: Die Domänenschicht importiert nichts aus App\Http, target: arch }
      - { label: Gutscheine über 100 Prozent werden abgelehnt, target: unit }
      - { label: Der Rabatt wird kaufmännisch gerundet, target: unit }
      - { label: "Jede Datei nutzt declare(strict_types=1)", target: arch }
    hints:
      - Architekturtests prüfen Struktur und Regeln für viele Dateien – Unit-Tests das Verhalten einer Einheit.
  - id: architektur-regeln
    type: terminal
    title: Architekturregeln einführen und einhalten
    description: |
      Im Ordner `architektur` liegt ein kleines Projekt mit Controllern, Models und Services – und ein paar
      Regelverstößen, die im Review durchgerutscht sind.

      1. Lege `tests/ArchTest.php` an mit diesen vier Regeln:
         - alles unter `App` nutzt `declare(strict_types=1)` (`toUseStrictTypes`),
         - `dd`, `dump` und `var_dump` werden nicht benutzt,
         - alle Klassen in `App\Http\Controllers` enden auf `Controller`,
         - `App\Services` benutzt nichts aus `App\Http` (`not->toUse`).
      2. Starte `./vendor/bin/pest` und lies, welche Dateien die Regeln verletzen.
      3. Behebe die Verstöße im Code:
         - Ergänze `declare(strict_types=1);` in der Datei ohne strikte Typen.
         - Entferne die Debug-Ausgabe.
         - Die Klasse `Helpers` ist kein Controller: Verschiebe sie nach `src/Support/Helpers.php` mit
           dem Namespace `App\Support`.
      4. Am Ende sind alle Architekturtests grün.

      Klicke zuerst auf **Aufgabe vorbereiten** (Composer installiert dabei Pest).
    workdir: architektur
    setup: |
      cat > composer.json <<'EOF'
      {
          "name": "stacklab/architektur",
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
      mkdir -p src/Http/Controllers src/Models src/Services tests
      printf '<?php\n' > tests/Pest.php
      cat > src/Models/User.php <<'EOF'
      <?php
      
      declare(strict_types=1);
      
      namespace App\Models;
      
      final class User
      {
          public function __construct(public readonly string $name)
          {
          }
      }
      EOF
      cat > src/Services/Greeter.php <<'EOF'
      <?php
      
      namespace App\Services;
      
      use App\Models\User;
      
      final class Greeter
      {
          public function greet(User $user): string
          {
              return 'Hallo ' . $user->name;
          }
      }
      EOF
      cat > src/Http/Controllers/UserController.php <<'EOF'
      <?php
      
      declare(strict_types=1);
      
      namespace App\Http\Controllers;
      
      use App\Models\User;
      use App\Services\Greeter;
      
      final class UserController
      {
          public function __construct(private Greeter $greeter)
          {
          }
      
          public function show(string $name): string
          {
              $user = new User($name);
              var_dump($user);
      
              return $this->greeter->greet($user);
          }
      }
      EOF
      cat > src/Http/Controllers/Helpers.php <<'EOF'
      <?php
      
      declare(strict_types=1);
      
      namespace App\Http\Controllers;
      
      final class Helpers
      {
          public static function title(string $text): string
          {
              return ucfirst($text);
          }
      }
      EOF
      timeout 150 composer install -n -q </dev/null

    checks:
      - type: file_exists
        path: tests/ArchTest.php
        message: Lege tests/ArchTest.php an.
      - type: file_contains
        path: tests/ArchTest.php
        pattern: "toUseStrictTypes\\("
        message: Es fehlt die Regel für strict_types (toUseStrictTypes).
      - type: file_contains
        path: tests/ArchTest.php
        pattern: "var_dump"
        message: Es fehlt die Regel gegen dd, dump und var_dump.
      - type: file_contains
        path: tests/ArchTest.php
        pattern: "toHaveSuffix\\("
        message: Es fehlt die Regel, dass Controller auf Controller enden (toHaveSuffix).
      - type: file_contains
        path: tests/ArchTest.php
        pattern: "not->toUse\\("
        message: Es fehlt die Regel, dass App\Services nichts aus App\Http benutzt (not->toUse).
      - type: command
        run: ./vendor/bin/pest --list-tests tests/ArchTest.php 2>/dev/null | grep -c '^ - '
        stdout_matches: "^\\s*([4-9]|[1-9][0-9]+)\\s*$"
        message: In tests/ArchTest.php sollten mindestens vier Regeln stehen.
      - type: command
        run: "grep -rnE 'var_dump|\\bdump\\(|\\bdd\\(' src"
        expect_exit: 1
        message: Im Ordner src steht noch eine Debug-Ausgabe.
      - type: file_absent
        path: src/Http/Controllers/Helpers.php
        message: Helpers liegt noch bei den Controllern. Verschiebe sie nach src/Support/Helpers.php.
      - type: file_contains
        path: src/Support/Helpers.php
        pattern: "namespace App\\\\Support;"
        message: Lege src/Support/Helpers.php mit dem Namespace App\Support an.
      - type: command
        run: ./vendor/bin/pest
        message: Noch sind nicht alle Tests grün. Lies die Meldungen von ./vendor/bin/pest – sie nennen Datei und Zeile.
    hints:
      - "Jede Regel beginnt mit `arch('Beschreibung')->expect(...)`, z. B. `arch('strict')->expect('App')->toUseStrictTypes();`."
      - "Für die Schichten-Regel: `arch()->expect('App\\Services')->not->toUse('App\\Http');`"
      - "Verschieben: `mkdir -p src/Support`, Datei kopieren, in der Kopie `namespace App\\Http\\Controllers;` durch `namespace App\\Support;` ersetzen und das Original löschen."
    solution: |
      ```bash
      cd architektur
      cat > tests/ArchTest.php <<'EOF'
      <?php

      arch('alle Dateien nutzen strict_types')
          ->expect('App')
          ->toUseStrictTypes();

      arch('keine Debug-Ausgaben')
          ->expect(['dd', 'dump', 'var_dump'])
          ->not->toBeUsed();

      arch('Controller heißen auch so')
          ->expect('App\Http\Controllers')
          ->toHaveSuffix('Controller');

      arch('Services kennen die HTTP-Schicht nicht')
          ->expect('App\Services')
          ->not->toUse('App\Http');
      EOF
      ./vendor/bin/pest || true
      sed -i 's/^<?php$/<?php\n\ndeclare(strict_types=1);/' src/Services/Greeter.php
      sed -i '/var_dump/d' src/Http/Controllers/UserController.php
      mkdir -p src/Support
      sed 's/^namespace App\\Http\\Controllers;$/namespace App\\Support;/' src/Http/Controllers/Helpers.php > src/Support/Helpers.php
      rm src/Http/Controllers/Helpers.php
      ./vendor/bin/pest
      ```
---
„Bei uns hat jede Datei `strict_types`“, „Controller enden auf Controller“, „Die Service-Schicht kennt keine
HTTP-Klassen“ – solche Regeln stehen in vielen Team-Wikis. Und sie werden trotzdem gebrochen, weil im Review
niemand jede Zeile darauf prüft. Architekturtests machen aus diesen Regeln Tests, die bei jedem Lauf
automatisch rot werden.

## Was ist ein Architekturtest?

Ein [[architekturtest|Architekturtest]] führt keinen Code aus, sondern **liest** ihn: Welche Klassen gibt es,
welche Funktionen werden aufgerufen, welche Namespaces importiert? Daraus prüft er Regeln über die Struktur
der ganzen [[codebasis|Codebasis]].

| Unit-Test | Architekturtest |
|---|---|
| Liefert `rabatt(1000, 10)` 900? | Nutzt jede Datei `strict_types`? |
| eine Einheit, ein Verhalten | viele Dateien, eine Regel |
| prüft Logik | prüft Struktur und Abhängigkeiten |

In Pest ist das Arch-Plugin schon eingebaut. Du schreibst Regeln mit `arch()`:

```php title="tests/ArchTest.php"
<?php

arch('alle Dateien nutzen strict_types')
    ->expect('App')
    ->toUseStrictTypes();
```

`expect('App')` meint alle Klassen im Namespace `App` (über das [[psr-4|PSR-4]]-Autoloading gefunden).

## Die wichtigsten Regeln

| Expectation | Regel |
|---|---|
| `toUseStrictTypes()` | Datei beginnt mit `declare(strict_types=1)` |
| `toBeFinal()` | Klassen sind `final` |
| `toHaveSuffix('Controller')` | Klassennamen enden so |
| `toExtend(Model::class)` | Klassen erben von dieser Basisklasse |
| `toImplement(Mailer::class)` | Klassen implementieren das Interface |
| `toUse('App\Http')` | Code benutzt diese Klassen/Namespaces |
| `toOnlyBeUsedIn('App\Repositories')` | darf nur dort benutzt werden |
| `toBeUsed()` (für Funktionen) | Funktion wird irgendwo aufgerufen |

Mit `not` drehst du jede Regel um – so verbietest du etwas:

```php
arch('keine Debug-Ausgaben')
    ->expect(['dd', 'dump', 'var_dump'])
    ->not->toBeUsed();

arch('Services kennen die HTTP-Schicht nicht')
    ->expect('App\Services')
    ->not->toUse('App\Http');
```

> [!MERKSATZ]
> Eine Regel, die nur im Wiki steht, ist ein Wunsch. Eine Regel als Architekturtest ist ein Gesetz – sie
> wird bei jedem Pull Request geprüft.

## Fehlermeldungen lesen und Ausnahmen

Verletzt Code eine Regel, nennt Pest Datei und Zeile:

```text
FAILED  Tests\ArchTest > keine Debug-Ausgaben
Expecting 'var_dump' not to be used on 'App\Http\Controllers\UserController'.
at src/Http/Controllers/UserController.php:19
```

Manchmal gibt es berechtigte Ausnahmen. Die nimmst du gezielt mit `ignoring()` heraus:

```php
arch('Models nur in Repositories')
    ->expect('App\Models')
    ->toOnlyBeUsedIn('App\Repositories')
    ->ignoring('App\Models\User');
```

> [!FEHLER]
> **Regel, die nie rot wird.** Ein vergessenes `not` oder ein falsch geschriebener Namespace
> (`'App\Service'` statt `'App\Services'`) macht eine Regel wirkungslos – sie findet einfach nichts.
> Verletze jede neue Regel einmal absichtlich und sieh zu, wie sie rot wird.

## Presets: fertige Regelsätze

Pest bringt Regelsammlungen mit, die du mit einer Zeile einschaltest:

```php
arch()->preset()->php();       // keine Debug- und veralteten PHP-Funktionen
arch()->preset()->security();  // keine riskanten Funktionen wie eval oder md5
arch()->preset()->strict();    // strenge Regeln, z. B. strict_types und final-Klassen
arch()->preset()->laravel();   // Laravel-Konventionen (Controller, Requests …)
```

Auch Presets kannst du mit `ignoring()` anpassen, etwa `->security()->ignoring('md5')`, wenn `md5` in einem
Altsystem nur für Prüfsummen benutzt wird.

## Architekturtests in ein bestehendes Projekt bringen

In einem Projekt mit jahrelanger Geschichte wird eine neue Regel oft sofort an hundert Stellen rot. So
führst du sie trotzdem ein:

1. **Eine Regel nach der anderen** – beginne mit einfachen Regeln wie „keine Debug-Ausgaben“.
2. **Altlasten ausklammern**: Bekannte Verstöße kommen per `ignoring()` auf eine Liste. Neuer Code muss
   die Regel sofort einhalten.
3. **Liste abbauen**: Jede behobene Altlast fliegt aus `ignoring()`. Die Liste wird nur kürzer, nie länger.
4. **In der CI ausführen**: Architekturtests sind schnell und laufen mit der normalen Testsuite.

So wird die Codebasis Schritt für Schritt besser, ohne dass ein riesiger Umbau nötig ist. Architekturtests
ersetzen dabei keine statische Analyse wie [[phpstan|PHPStan]] – sie ergänzen sie um Regeln, die nur dein
Team kennt.

> [!PRAXIS]
> In großen Laravel-Projekten liegt eine `ArchTest.php` mit Presets und eigenen Schichtenregeln im
> Repository. So bleibt die [[schichtenarchitektur|Schichtenarchitektur]] auch nach Jahren und vielen
> neuen Teammitgliedern sauber – ganz ohne endlose Review-Diskussionen.

## Zusammenfassung

- Architekturtests lesen den Code und prüfen Strukturregeln für viele Dateien auf einmal.
- In Pest schreibst du sie mit `arch()->expect('Namespace')->…`.
- Wichtige Regeln: `toUseStrictTypes`, `toBeFinal`, `toHaveSuffix`, `toUse`, `toOnlyBeUsedIn`, `toExtend`.
- `not` verbietet etwas, `ignoring()` erlaubt gezielte Ausnahmen.
- Presets (`php`, `security`, `strict`, `laravel`) liefern fertige Regelsätze.
- Prüfe neue Regeln, indem du sie einmal absichtlich verletzt.
