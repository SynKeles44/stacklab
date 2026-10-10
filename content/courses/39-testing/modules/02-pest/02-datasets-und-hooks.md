---
title: Datasets, Hooks und Gruppen
summary: Mit Datasets prüfst du viele Fälle ohne Copy-and-paste, mit Hooks und describe() hältst du Tests kurz und geordnet.
duration: 20
sources:
  - title: Pest – Datasets
    url: https://pestphp.com/docs/datasets
  - title: Pest – Hooks
    url: https://pestphp.com/docs/hooks
  - title: Pest – Filtering Tests
    url: https://pestphp.com/docs/filtering-tests
quiz:
  - type: single
    question: "Ein Test hat `->with([1, 2])->with(['a', 'b', 'c'])`. Wie oft läuft er?"
    options: ["2-mal", "3-mal", "5-mal", "6-mal"]
    answer: 3
    explanation: Mehrere `with()` hintereinander bilden alle Kombinationen (kartesisches Produkt) – 2 × 3 = 6 Durchläufe.
  - type: find-bug
    question: Der Test soll für jede E-Mail-Adresse einmal laufen, bricht aber mit „Too few arguments“ ab. In welcher Zeile liegt der Fehler?
    language: php
    code: |
      <?php

      it('erkennt gültige Adressen', function () {
          expect(filter_var($email, FILTER_VALIDATE_EMAIL))->not->toBeFalse();
      })->with([
          'user@example.com',
          'team@example.org',
      ]);
    bug_line: 3
    explanation: "Die Closure braucht einen Parameter, in den Pest den Wert aus dem Dataset legt: `function (string $email) { … }`."
  - type: match
    question: Welcher Hook läuft wann?
    pairs:
      - { left: "beforeEach()", right: vor jedem Test der Datei bzw. Gruppe }
      - { left: "afterEach()", right: nach jedem Test – zum Aufräumen }
      - { left: "beforeAll()", right: einmal vor allen Tests der Datei }
      - { left: "afterAll()", right: einmal nach allen Tests der Datei }
    explanation: "`beforeEach` ist der Arbeitstier-Hook. In `beforeAll` und `afterAll` gibt es kein `$this`, weil dort noch kein einzelner Test existiert."
  - type: multiple
    question: Welche Aussagen über Datasets stimmen?
    options:
      - Mit String-Schlüsseln im Array bekommt jeder Fall einen lesbaren Namen in der Ausgabe.
      - Ein Dataset mit `dataset('name', [...])` kann von mehreren Testdateien genutzt werden.
      - Datasets funktionieren nur mit Zahlen.
      - Jeder Fall erscheint in der Ausgabe als eigener Test.
    answers: [0, 1, 3]
    explanation: Datasets sind beliebige Werte – auch Arrays, Objekte oder Closures. Jeder Fall ist ein eigener Testlauf mit eigenem Namen.
tasks:
  - id: datasets-vorhersagen
    type: steps
    title: Was zeigt Pest an?
    description: Sag voraus, wie Pest die folgenden Tests ausführt. So lernst du, wie Datasets und Hooks zusammenspielen.
    steps:
      - situation: "`it('rundet', fn ($n, $e) => expect(round($n))->toBe($e))->with([[1.4, 1.0], [1.5, 2.0], [2.5, 3.0]]);`"
        question: Wie viele Tests meldet Pest?
        options: ["1", "3", "6"]
        answer: 1
        explanation: Jede Zeile des Datasets ist ein eigener Durchlauf – drei Tests.
      - situation: "Das Dataset ist `->with(['leer' => '', 'nur Leerzeichen' => '   '])`."
        question: Wie heißt der zweite Durchlauf in der Ausgabe?
        options: ['with dataset "nur Leerzeichen"', 'with dataset #1', 'with data ("   ")']
        answer: 0
        explanation: String-Schlüssel werden zum Namen. So erkennst du im Fehlerfall sofort, welcher Fall rot ist.
      - situation: "`beforeEach(fn () => $this->cart = new Cart());` steht oben in der Datei. Test A legt ein Produkt in `$this->cart`, danach läuft Test B."
        question: Wie viele Produkte liegen zu Beginn von Test B im Warenkorb?
        options: ["0 – jeder Test bekommt einen frischen Warenkorb", "1 – Test A hat eins hineingelegt", "Das hängt von der Reihenfolge ab"]
        answer: 0
        explanation: "`beforeEach` läuft vor jedem Test neu. Tests teilen keinen Zustand – genau das macht sie unabhängig."
      - situation: "In einem `describe('mit Gutschein', ...)`-Block steht ein zweites `beforeEach`, das einen Gutschein anwendet."
        question: Gilt dieser zweite Hook auch für Tests außerhalb des Blocks?
        options: ["Ja, für alle Tests der Datei", "Nein, nur für die Tests im describe-Block"]
        answer: 1
        explanation: Hooks in `describe()` gelten nur für die Tests dieser Gruppe – zusätzlich zu den Hooks der Datei.
  - id: passwort-dataset
    type: terminal
    title: Passwortregeln mit einem Dataset testen
    description: |
      Im Ordner `datasets` liegt ein Pest-Projekt mit der Klasse `App\PasswordPolicy`. Ihre Methode
      `isStrong(string $password): bool` liefert `true`, wenn das Passwort **mindestens 12 Zeichen**,
      **einen Großbuchstaben** und **eine Ziffer** enthält.

      1. Lege `tests/Unit/PasswordPolicyTest.php` an.
      2. Erzeuge die Policy in einem `beforeEach`-Hook und speichere sie in `$this->policy`.
      3. Schreibe **einen** Test, der per `->with([...])` mindestens **fünf** Passwörter samt erwartetem
         Ergebnis prüft – mit Schlüsseln als Namen, z. B. `'zu kurz' => ['Abc1', false]`. Denk an die
         Grenze bei genau 12 Zeichen.
      4. Starte `./vendor/bin/pest` – du solltest jeden Fall als eigenen Test sehen.

      Klicke zuerst auf **Aufgabe vorbereiten** (Composer installiert dabei Pest).
    workdir: datasets
    setup: |
      cat > composer.json <<'EOF'
      {
          "name": "stacklab/datasets",
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
      cat > src/PasswordPolicy.php <<'EOF'
      <?php

      declare(strict_types=1);

      namespace App;

      final class PasswordPolicy
      {
          public function isStrong(string $password): bool
          {
              return mb_strlen($password) >= 12
                  && preg_match('/[A-Z]/', $password) === 1
                  && preg_match('/\d/', $password) === 1;
          }
      }
      EOF
      timeout 150 composer install -n -q </dev/null
    checks:
      - type: file_exists
        path: tests/Unit/PasswordPolicyTest.php
        message: Lege tests/Unit/PasswordPolicyTest.php an.
      - type: file_contains
        path: tests/Unit/PasswordPolicyTest.php
        pattern: "beforeEach\\("
        message: Erzeuge die Policy in einem beforeEach-Hook.
      - type: file_contains
        path: tests/Unit/PasswordPolicyTest.php
        pattern: "->with\\("
        message: Nutze ein Dataset mit ->with([...]).
      - type: command
        run: ./vendor/bin/pest tests/Unit/PasswordPolicyTest.php
        message: Die Tests sind noch nicht grün. Prüfe die erwarteten Ergebnisse in deinem Dataset.
      - type: command
        run: ./vendor/bin/pest --list-tests tests/Unit/PasswordPolicyTest.php 2>/dev/null | grep -c '^ - '
        stdout_matches: "^\\s*([5-9]|[1-9][0-9]+)\\s*$"
        message: Dein Dataset sollte mindestens fünf Fälle enthalten.
    hints:
      - "Der Hook: `beforeEach(function () { $this->policy = new PasswordPolicy(); });`"
      - "Die Closure des Tests bekommt zwei Parameter: `function (string $password, bool $expected) { … }`."
      - "Für die Grenze: `'genau 12 Zeichen' => ['Abcdefghij12', true]` und `'11 Zeichen' => ['Abcdefghi12', false]`."
    solution: |
      ```bash
      cd datasets
      cat > tests/Unit/PasswordPolicyTest.php <<'EOF'
      <?php

      use App\PasswordPolicy;

      beforeEach(function () {
          $this->policy = new PasswordPolicy();
      });

      it('bewertet Passwörter', function (string $password, bool $expected) {
          expect($this->policy->isStrong($password))->toBe($expected);
      })->with([
          'zu kurz' => ['Abc1', false],
          '11 Zeichen' => ['Abcdefghi12', false],
          'genau 12 Zeichen' => ['Abcdefghij12', true],
          'ohne Großbuchstaben' => ['abcdefghij12', false],
          'ohne Ziffer' => ['Abcdefghijkl', false],
          'lang und gemischt' => ['KorrektesPferd42', true],
      ]);
      EOF
      ./vendor/bin/pest
      ```
---
Du willst eine Passwortregel mit zehn verschiedenen Eingaben prüfen. Zehnmal fast denselben Test zu kopieren
ist mühsam, und beim nächsten Umbau musst du zehn Stellen ändern. Pest löst das mit **Datasets** – und mit
**Hooks** sparst du dir den immer gleichen Vorbereitungscode.

## Datasets: ein Test, viele Fälle

Ein [[pest-dataset|Dataset]] hängst du mit `->with()` an einen Test. Pest ruft die Closure für jeden Eintrag
einmal auf und übergibt die Werte als Parameter:

```php title="tests/Unit/EmailTest.php"
it('erkennt gültige Adressen', function (string $email) {
    expect(filter_var($email, FILTER_VALIDATE_EMAIL))->not->toBeFalse();
})->with([
    'user@example.com',
    'team@example.org',
]);
```

Brauchst du mehrere Werte pro Fall, wird jeder Eintrag ein Array:

```php
it('rechnet Rabatte', function (int $cent, int $prozent, int $erwartet) {
    expect(rabatt($cent, $prozent))->toBe($erwartet);
})->with([
    'zehn Prozent' => [1000, 10, 900],
    'kein Rabatt'  => [1000, 0, 1000],
    'alles gratis' => [1000, 100, 0],
]);
```

Die Schlüssel sind die Namen der Fälle. In der Ausgabe steht dann `with dataset "kein Rabatt"` – du siehst
sofort, welcher Fall rot ist.

> [!MERKSATZ]
> Jeder Eintrag eines Datasets ist ein eigener Testlauf. Gib den Fällen sprechende Namen – sie sind deine
> Fehlermeldung.

## Gemeinsame und kombinierte Datasets

Werte, die du in mehreren Dateien brauchst, legst du einmal zentral an – üblich ist `tests/Datasets/`:

```php title="tests/Datasets/Emails.php"
dataset('gueltige_emails', [
    'user@example.com',
    'team@example.org',
]);
```

```php
it('akzeptiert die Adresse', function (string $email) {
    // ...
})->with('gueltige_emails');
```

Hängst du zwei `with()` hintereinander, bildet Pest **alle Kombinationen**:

```php
it('berechnet Versand', function (string $land, int $gewicht) {
    // ...
})->with(['DE', 'AT'])->with([100, 5000]);   // 2 × 2 = 4 Läufe
```

> [!ACHTUNG]
> Kombinationen wachsen schnell: 5 × 5 × 5 sind schon 125 Tests. Kombiniere nur, wenn wirklich jede
> Kombination ein anderes Verhalten haben kann.

## Datasets mit Bedacht einsetzen

Datasets sind stark, solange alle Fälle **dasselbe Verhalten** prüfen – nur mit anderen Werten. Sobald
die Closure `if`-Abfragen braucht („bei diesem Fall erwarte eine Exception, sonst …“), sind es in Wahrheit
verschiedene Verhaltensweisen. Dann schreibst du lieber getrennte Tests mit eigenen Namen.

Große oder berechnete Datenmengen erzeugst du mit einer Closure oder einem Generator. Pest ruft sie erst
auf, wenn der Test läuft:

```php
it('akzeptiert alle Prozentsätze von 0 bis 100', function (int $prozent) {
    expect(rabatt(1000, $prozent))->toBeGreaterThanOrEqual(0);
})->with(fn () => range(0, 100));
```

Für Werte, die erst nach `beforeEach` existieren (etwa Datenbankeinträge in Laravel), packst du jeden
Eintrag in eine Closure – Pest nennt das „Bound Datasets“.

> [!TIPP]
> Wähle die Fälle eines Datasets nach Äquivalenzklassen und Grenzwerten aus der ersten Lektion. Zehn
> zufällige Werte aus derselben Klasse prüfen kaum mehr als einer.

## Hooks: Vorbereiten und Aufräumen

Ein [[test-hook|Hook]] ist Code, der automatisch vor oder nach Tests läuft:

| Hook | Wann? |
|---|---|
| `beforeEach()` | vor **jedem** Test |
| `afterEach()` | nach jedem Test |
| `beforeAll()` | einmal vor allen Tests der Datei |
| `afterAll()` | einmal nach allen Tests der Datei |

In `beforeEach` legst du Werte auf `$this` ab – jeder Test liest sie von dort:

```php
beforeEach(function () {
    $this->policy = new PasswordPolicy();
});

it('lehnt kurze Passwörter ab', function () {
    expect($this->policy->isStrong('Abc1'))->toBeFalse();
});
```

Weil `beforeEach` vor jedem Test neu läuft, bekommt jeder Test ein frisches Objekt. Kein Test kann den
nächsten beeinflussen.

> [!FEHLER]
> **Zustand in `beforeAll` teilen.** Ein Objekt, das einmal für alle Tests erzeugt wird, schleppt
> Änderungen von Test zu Test. Das führt zu Tests, die nur in einer bestimmten Reihenfolge grün sind.
> Nimm `beforeEach`, solange es keinen triftigen Grund (z. B. sehr teure Vorbereitung) gibt.

## Tests gruppieren mit describe()

Mit `describe()` fasst du zusammengehörige Tests zu einer [[testgruppe|Gruppe]] zusammen. Hooks im Block gelten
nur für diese Gruppe:

```php
describe('Warenkorb mit Gutschein', function () {
    beforeEach(function () {
        $this->cart = new Cart();
        $this->cart->applyVoucher('SOMMER10');
    });

    it('zeigt den Rabatt an', function () {
        expect($this->cart->discount())->toBe(10);
    });
});
```

In der Ausgabe erscheinen die Tests als `Warenkorb mit Gutschein → it zeigt den Rabatt an`.

> [!PRAXIS]
> In Laravel-Projekten liegen globale Einstellungen in `tests/Pest.php`, zum Beispiel
> `pest()->extend(TestCase::class)->in('Feature');`. Damit nutzen alle Feature-Tests dieselbe Basisklasse
> und dieselben Hooks, etwa zum Zurücksetzen der Testdatenbank.

## Zusammenfassung

- `->with([...])` führt einen Test für jeden Eintrag eines Datasets aus; Schlüssel werden zu Namen.
- `dataset('name', [...])` legt wiederverwendbare Datasets an, mehrere `with()` bilden alle Kombinationen.
- `beforeEach` und `afterEach` laufen um jeden Test, `beforeAll` und `afterAll` einmal pro Datei.
- Über `$this` teilst du Vorbereitetes aus `beforeEach` mit dem Test – frisch für jeden Test.
- `describe()` gruppiert Tests; Hooks darin gelten nur für die Gruppe.
