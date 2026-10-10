---
title: Klassen und Objekte in PHP
summary: Constructor Promotion, Sichtbarkeit, readonly, static und final – und die neuen Property Hooks und asymmetrische Sichtbarkeit aus PHP 8.4.
duration: 25
sources:
  - title: PHP-Handbuch – Klassen und Objekte
    url: https://www.php.net/manual/de/language.oop5.php
  - title: PHP-Handbuch – Konstruktor-Promotion
    url: https://www.php.net/manual/de/language.oop5.decon.php
  - title: PHP-Handbuch – Property Hooks
    url: https://www.php.net/manual/de/language.oop5.property-hooks.php
  - title: PHP-Handbuch – Sichtbarkeit (inkl. asymmetrischer Sichtbarkeit)
    url: https://www.php.net/manual/de/language.oop5.visibility.php
quiz:
  - type: single
    question: "Was gibt `$a = new Konto(); $b = $a; $b->einzahlen(10); echo $a->saldo;` aus, wenn das Konto mit 0 startet?"
    options: ["0", "10", "20", "Einen Fehler"]
    answer: 1
    explanation: >
      $a und $b zeigen auf dasselbe Objekt. Objekte werden nicht kopiert, sondern geteilt. Eine echte Kopie
      erzeugst du mit clone.
  - type: multiple
    question: Welche Aussagen über `readonly` stimmen?
    options:
      - Eine readonly-Eigenschaft kann genau einmal gesetzt werden – normalerweise im Konstruktor.
      - "`readonly class` macht alle Eigenschaften der Klasse readonly."
      - readonly-Eigenschaften brauchen einen Typ.
      - Ein readonly-Objekt kann man mit clone gar nicht verändern.
    answers: [0, 1, 2]
    explanation: >
      readonly verlangt typisierte Eigenschaften und erlaubt nur eine Zuweisung aus der Klasse heraus. Seit PHP 8.5
      kann eine Methode der Klasse mit `clone($this, ['wert' => …])` aber eine veränderte Kopie erzeugen.
  - type: match
    question: Wer darf eine Eigenschaft lesen oder ändern?
    pairs:
      - { left: "public", right: "überall" }
      - { left: "protected", right: "die Klasse und ihre Unterklassen" }
      - { left: "private", right: "nur die Klasse selbst" }
      - { left: "public private(set)", right: "überall lesen, nur die Klasse schreibt" }
    explanation: Mit asymmetrischer Sichtbarkeit (PHP 8.4) legst du Lesen und Schreiben getrennt fest.
  - type: cloze
    text: "Mit `public function __construct(private int $id) {}` nutzt du ___. Statische Elemente sprichst du in der Klasse mit `___::$zaehler` an."
    blanks:
      - [Constructor Promotion, Konstruktor-Promotion, Constructor-Promotion, Promotion]
      - [self, static]
    explanation: "Constructor Promotion deklariert und setzt die Eigenschaft in einem Schritt. self:: verweist auf die eigene Klasse."
tasks:
  - id: geld-value-object
    type: code
    language: php
    title: Ein Value Object für Geld
    description: |
      Schreibe eine `final readonly class Geld` mit den Eigenschaften `int $cent` und `string $waehrung`
      (per Constructor Promotion, beide `public`).

      - Der Konstruktor wirft eine `InvalidArgumentException`, wenn die Währung nicht aus genau drei
        Großbuchstaben besteht (z. B. `EUR`).
      - `static euro(int $cent): self` erzeugt Euro-Beträge.
      - `plus(Geld $anderes): self` liefert ein **neues** Objekt mit der Summe. Bei verschiedenen Währungen wirft
        sie eine `InvalidArgumentException`.
      - `format(): string` liefert z. B. `12,34 EUR`.
    starter: |
      <?php
      declare(strict_types=1);

      final readonly class Geld
      {
          public function __construct(
              public int $cent,
              public string $waehrung,
          ) {
          }
      }
    tests:
      - name: euro() und format()
        code: assert_same('12,34 EUR', Geld::euro(1234)->format()); assert_same('0,00 EUR', Geld::euro(0)->format());
      - name: plus liefert ein neues Objekt
        code: $a = Geld::euro(100); $b = $a->plus(Geld::euro(250)); assert_same(350, $b->cent); assert_same(100, $a->cent); assert_true($a !== $b);
      - name: Eigenschaften sind schreibgeschützt
        code: $g = Geld::euro(1); try { $g->cent = 5; assert_true(false, 'cent ließ sich ändern.'); } catch (Error $e) { assert_same(1, $g->cent); }
      - name: ungültige Währung
        code: try { new Geld(1, 'euro'); assert_true(false, 'Keine Exception bei "euro".'); } catch (InvalidArgumentException $e) { assert_true(true); }
      - name: verschiedene Währungen lassen sich nicht addieren
        code: try { Geld::euro(1)->plus(new Geld(1, 'USD')); assert_true(false, 'Keine Exception bei EUR + USD.'); } catch (InvalidArgumentException $e) { assert_true(true); }
    hints:
      - "Prüfe im Konstruktor-Rumpf: `if (preg_match('/^[A-Z]{3}$/', $waehrung) !== 1) { throw new InvalidArgumentException(…); }`"
      - "`public static function euro(int $cent): self { return new self($cent, 'EUR'); }`"
      - "Formatieren: `number_format($this->cent / 100, 2, ',', '.') . ' ' . $this->waehrung`"
    solution: |
      <?php
      declare(strict_types=1);

      final readonly class Geld
      {
          public function __construct(
              public int $cent,
              public string $waehrung,
          ) {
              if (preg_match('/^[A-Z]{3}$/', $waehrung) !== 1) {
                  throw new InvalidArgumentException("Ungültige Währung: {$waehrung}");
              }
          }

          public static function euro(int $cent): self
          {
              return new self($cent, 'EUR');
          }

          public function plus(Geld $anderes): self
          {
              if ($anderes->waehrung !== $this->waehrung) {
                  throw new InvalidArgumentException('Währungen passen nicht zusammen.');
              }

              return new self($this->cent + $anderes->cent, $this->waehrung);
          }

          public function format(): string
          {
              return number_format($this->cent / 100, 2, ',', '.') . ' ' . $this->waehrung;
          }
      }
  - id: objekte-verstehen
    type: steps
    title: Was passiert mit dem Objekt?
    description: Objekte verhalten sich anders als Arrays. Sag voraus, was passiert.
    steps:
      - situation: "`$liste = [1, 2]; $kopie = $liste; $kopie[] = 3; echo count($liste);`"
        question: Was erscheint?
        options: ["2", "3"]
        answer: 0
        explanation: Arrays sind Werte. $kopie ist eine eigene Kopie, $liste bleibt bei zwei Einträgen.
      - situation: "`$a = new Warenkorb(); $b = $a; $b->hinzufuegen('Buch'); echo $a->anzahl();`"
        question: Was erscheint?
        options: ["0", "1"]
        answer: 1
        explanation: Objekte werden geteilt. $a und $b sind zwei Namen für dasselbe Objekt.
      - situation: "`$c = clone $a; $c->hinzufuegen('Stift'); echo $a->anzahl();`"
        question: Was erscheint jetzt?
        options: ["1", "2"]
        answer: 0
        explanation: clone erzeugt ein neues Objekt. Änderungen an $c berühren $a nicht.
      - situation: "Die Klasse hat `public private(set) int $anzahl`. Außerhalb steht `$a->anzahl = 99;`."
        question: Was passiert?
        options: ["$anzahl wird 99", "PHP wirft einen Error", "Die Zeile wird ignoriert"]
        answer: 1
        explanation: Mit private(set) darf nur die Klasse selbst schreiben. Von außen gibt es einen Error.
---
Aus den Grundlagen kennst du [[klasse|Klassen]] als Baupläne und [[objekt|Objekte]] als die gebauten Dinge. PHP
hat dafür eine besonders ausdrucksstarke Syntax bekommen: Mit wenigen Zeilen beschreibst du Objekte, die sich
selbst prüfen und nicht versehentlich verändert werden können. Genau so sieht modernes PHP in Projekten aus.

## Eine Klasse in modernem PHP

```php
<?php
declare(strict_types=1);

final class Kunde
{
    public function __construct(
        public readonly int $id,
        private string $name,
    ) {
    }

    public function name(): string
    {
        return $this->name;
    }
}

$kunde = new Kunde(id: 7, name: 'Ada');
echo $kunde->id;       // 7
echo $kunde->name();   // Ada
```

Die Parameter des [[konstruktor|Konstruktors]] mit Sichtbarkeit davor werden automatisch zu Eigenschaften – das
heißt [[konstruktor-promotion|Constructor Promotion]]. Ohne sie müsstest du jede Eigenschaft doppelt schreiben:
einmal als Deklaration, einmal als Zuweisung `$this->name = $name;`.

## Sichtbarkeit

Jede Eigenschaft und Methode hat einen [[zugriffsmodifikator|Zugriffsmodifikator]]:

| Modifikator | Zugriff |
|---|---|
| `public` | von überall |
| `protected` | aus der Klasse und ihren Unterklassen |
| `private` | nur aus der Klasse selbst |

PHP 8.4 hat die [[asymmetrische-sichtbarkeit|asymmetrische Sichtbarkeit]] eingeführt: Lesen und Schreiben
bekommen getrennte Rechte.

```php
final class Konto
{
    public function __construct(public private(set) int $saldo = 0) {}

    public function einzahlen(int $cent): void
    {
        $this->saldo += $cent;   // innen erlaubt
    }
}

$konto = new Konto();
echo $konto->saldo;   // lesen: erlaubt
$konto->saldo = 5;    // Error: Cannot modify private(set) property
```

> [!MERKSATZ]
> Mach alles so privat wie möglich. Öffentlich ist nur, was andere wirklich brauchen.

## readonly und Value Objects

Eine `readonly`-Eigenschaft kann genau **einmal** gesetzt werden – im Konstruktor. Danach ist sie fest.
`readonly class` macht alle Eigenschaften readonly.

```php
final readonly class Email
{
    public function __construct(public string $adresse)
    {
        if (!filter_var($adresse, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException("Ungültige E-Mail: {$adresse}");
        }
    }

    public function withAdresse(string $neu): static
    {
        return clone($this, ['adresse' => $neu]);   // PHP 8.5: veränderte Kopie
    }
}
```

So entsteht ein [[value-object|Value Object]]: ein kleines, [[unveraenderlichkeit|unveränderliches]] Objekt, das
einen Wert darstellt und sich beim Erzeugen selbst prüft. Ein `Email`-Objekt ist **immer** gültig – kein Code
muss das später erneut kontrollieren. `clone` mit Array ist neu in PHP 8.5 und funktioniert für readonly-
Eigenschaften nur innerhalb der Klasse – ideal für „with“-Methoden.

## Objekte werden geteilt, Arrays kopiert

```php
$a = new Konto();
$b = $a;              // KEINE Kopie – beide zeigen auf dasselbe Objekt
$b->einzahlen(10);
echo $a->saldo;       // 10

$c = clone $a;        // echte Kopie
```

> [!FEHLER]
> Wer ein Objekt an eine Funktion übergibt und es dort ändert, ändert das Original. Bei Arrays passiert das nicht.
> Unveränderliche Value Objects vermeiden diese Überraschung komplett.

## static, Konstanten und final

```php
final class Zaehler
{
    public const int MAX = 3;            // Klassenkonstante (mit Typ seit PHP 8.3)
    private static int $stand = 0;       // gehört zur Klasse, nicht zum Objekt

    public static function weiter(): int
    {
        return ++self::$stand;
    }
}

Zaehler::weiter();     // Aufruf ohne Objekt
echo Zaehler::MAX;
```

- [[statisches-element|Statische]] Eigenschaften und Methoden gehören zur Klasse. In der Klasse sprichst du sie
  mit `self::` an. Typisch sind „benannte Konstruktoren“ wie `Geld::euro(500)`.
- `final` verbietet das Ableiten (bei Klassen) oder Überschreiben (bei Methoden). Viele Teams machen Klassen
  standardmäßig `final`.

## Property Hooks

Seit PHP 8.4 kann eine Eigenschaft eigene `get`- und `set`-Logik haben – ein [[property-hook|Property Hook]]:

```php
final class Person
{
    public string $name {
        set(string $wert) {
            if (trim($wert) === '') {
                throw new InvalidArgumentException('Name darf nicht leer sein.');
            }
            $this->name = trim($wert);
        }
    }

    public string $anrede {
        get => "Hallo {$this->name}";    // berechnet, ohne eigenen Speicher
    }
}
```

Früher schrieb man dafür [[getter-und-setter|Getter und Setter]] wie `getName()`/`setName()`. Hooks behalten die
einfache Schreibweise `$person->name` bei.

> [!PRAXIS]
> In großen Codebasen sind Value Objects wie `Email`, `Geld` oder `KundenId` Standard. Sie ersetzen lose Strings und
> Zahlen und machen falsche Werte schon beim Erzeugen unmöglich.

## Zusammenfassung

- Constructor Promotion deklariert und setzt Eigenschaften direkt im Konstruktor.
- `public`, `protected`, `private` regeln den Zugriff; `public private(set)` trennt Lesen und Schreiben.
- `readonly` erlaubt nur eine Zuweisung – die Basis für unveränderliche Value Objects.
- Objekte werden geteilt, Arrays kopiert; `clone` erzeugt eine Kopie, in PHP 8.5 auch mit geänderten Werten.
- `static` gehört zur Klasse (`self::`), `final` verhindert Ableiten und Überschreiben.
- Property Hooks (`get`/`set`) ersetzen klassische Getter und Setter.
