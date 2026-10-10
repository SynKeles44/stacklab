---
title: Syntax und Typsystem
summary: Was PHP-Code von JavaScript unterscheidet, warum == gefährlich ist und wie strict_types, Union-Types, nullable Typen und never dich schützen.
duration: 25
sources:
  - title: PHP-Handbuch – Typen
    url: https://www.php.net/manual/de/language.types.php
  - title: PHP-Handbuch – Typdeklarationen und strict_types
    url: https://www.php.net/manual/de/language.types.declarations.php
  - title: PHP-Handbuch – Vergleichsoperatoren
    url: https://www.php.net/manual/de/language.operators.comparison.php
quiz:
  - type: find-bug
    question: Die Funktion soll true liefern, wenn der Text mit "PHP" beginnt oder es irgendwo enthält. Für "PHP ist toll" liefert sie aber false. In welcher Zeile steckt der Fehler?
    language: php
    code: |
      <?php
      function enthaeltPhp(string $text): bool
      {
          if (strpos($text, 'PHP') == false) {
              return false;
          }
          return true;
      }
    bug_line: 4
    explanation: >
      `strpos()` liefert die Position 0, wenn "PHP" ganz am Anfang steht. Mit `==` wird 0 zu false umgewandelt.
      Richtig ist `=== false` – oder gleich `str_contains($text, 'PHP')`.
  - type: single
    question: "Was ergibt `var_dump(\"1\" == \"01\");` in PHP 8.5?"
    options: ["bool(true)", "bool(false)", "Einen TypeError", "int(1)"]
    answer: 0
    explanation: >
      Beide Strings sehen wie Zahlen aus, also vergleicht `==` sie numerisch: 1 == 1. Mit `===` wäre das Ergebnis
      false, weil die Zeichenketten verschieden sind.
  - type: multiple
    question: Welche Aussagen über `declare(strict_types=1);` stimmen?
    options:
      - Es muss die erste Anweisung der Datei sein.
      - Es gilt für Funktionsaufrufe, die in dieser Datei stehen.
      - Es schaltet die automatische Umwandlung bei == ab.
      - "Mit strict_types führt `strlen(42)` zu einem TypeError."
    answers: [0, 1, 3]
    explanation: >
      strict_types steht ganz oben und wirkt auf alle Aufrufe in derselben Datei – auch auf eingebaute Funktionen.
      Vergleiche mit == betrifft es nicht; dafür nimmst du ===.
  - type: match
    question: Ordne jeder Typangabe ihre Bedeutung zu.
    pairs:
      - { left: "?string", right: "string oder null" }
      - { left: "int|float", right: "eine Ganzzahl oder eine Kommazahl" }
      - { left: "void", right: "die Funktion gibt nichts zurück" }
      - { left: "never", right: "die Funktion kehrt nie normal zurück" }
      - { left: "mixed", right: "ein beliebiger Wert" }
    explanation: Union-Types verbinden Typen mit `|`, das Fragezeichen ist die Kurzform für `|null`.
tasks:
  - id: alter-parsen
    type: code
    language: php
    title: Eine Eingabe sicher in ein Alter umwandeln
    description: |
      Formulare und Kommandozeilen liefern immer **Strings**. Schreibe die Funktion
      `parseAlter(string $eingabe): ?int`:

      - Besteht die Eingabe (nach `trim()`) nur aus Ziffern und ist der Wert höchstens 150, gib ihn als `int` zurück.
      - In allen anderen Fällen (leer, Buchstaben, Minus, zu groß) gib `null` zurück.
      - Achtung: `"0"` ist ein gültiges Alter und muss `0` liefern – nicht `null`!
    starter: |
      <?php
      declare(strict_types=1);

      function parseAlter(string $eingabe): ?int
      {
          // Dein Code
      }
    tests:
      - name: "\"42\" wird zu 42"
        code: assert_same(42, parseAlter("42"));
      - name: Leerzeichen werden ignoriert
        code: assert_same(7, parseAlter("  7 "));
      - name: "\"0\" ist gültig"
        code: assert_same(0, parseAlter("0"));
      - name: leere Eingabe ergibt null
        code: assert_same(null, parseAlter(""));
      - name: Buchstaben und Minus ergeben null
        code: assert_same(null, parseAlter("4x")); assert_same(null, parseAlter("-5"));
      - name: mehr als 150 ergibt null
        code: assert_same(null, parseAlter("151")); assert_same(150, parseAlter("150"));
    hints:
      - "`ctype_digit($s)` prüft, ob ein String nur aus Ziffern besteht – für `\"\"` liefert es false."
      - "Wandle erst nach der Prüfung um: `$zahl = (int) $s;`"
      - "Vorsicht mit `if (!$zahl)` – das wäre auch bei 0 wahr. Vergleiche gezielt mit `> 150`."
    solution: |
      <?php
      declare(strict_types=1);

      function parseAlter(string $eingabe): ?int
      {
          $s = trim($eingabe);
          if (!ctype_digit($s)) {
              return null;
          }
          $zahl = (int) $s;
          return $zahl > 150 ? null : $zahl;
      }
  - id: typen-zuordnen
    type: dragdrop
    title: Welcher Typ passt?
    description: Ordne jeden Wert dem Typ zu, den `get_debug_type()` dafür liefert.
    targets:
      - { id: int, label: int }
      - { id: float, label: float }
      - { id: string, label: string }
      - { id: bool, label: bool }
      - { id: "null", label: "null" }
    items:
      - { label: "42", target: int }
      - { label: "-7", target: int }
      - { label: "3.14", target: float }
      - { label: "1e3", target: float }
      - { label: "'42'", target: string }
      - { label: "\"\"", target: string }
      - { label: "false", target: bool }
      - { label: "null", target: "null" }
---
Du kennst Variablen, Bedingungen und Funktionen schon aus den Grundlagen. PHP sieht auf den ersten Blick
ähnlich aus wie JavaScript – hat aber eigene Regeln. Und es hat eine berüchtigte Falle: Es wandelt Werte gern
stillschweigend um. In dieser Lektion lernst du, wie du diese Falle mit dem Typsystem zuverlässig abschaltest.

## Die wichtigsten Syntax-Regeln

```php
<?php
$preis = 19.99;                 // Variablen beginnen immer mit $
$anzahl = 3;
$summe = $preis * $anzahl;      // jede Anweisung endet mit ;
echo 'Summe: ' . $summe . PHP_EOL;   // . verkettet Strings, nicht +
const MWST = 19;                // Konstante ohne $
```

| Thema | PHP | JavaScript |
|---|---|---|
| Variable | `$name = 'Ada';` | `let name = 'Ada';` |
| Strings verketten | `'a' . 'b'` | `'a' + 'b'` |
| Ausgabe | `echo` | `console.log` |
| Methode aufrufen | `$obj->methode()` | `obj.methode()` |
| Statisch / Konstante | `Klasse::wert` | `Klasse.wert` |

Groß- und Kleinschreibung zählt bei [[variable|Variablen]] (`$Name` ≠ `$name`), bei Funktionsnamen dagegen nicht.
Halte dich trotzdem immer an eine Schreibweise – meist [[camelcase]].

> [!FEHLER]
> `echo 'Summe: ' + $summe;` – das `+` addiert in PHP immer. Ein nicht-numerischer String führt dabei zu einem
> Fehler. Strings verbindest du mit dem Punkt.

## Typen in PHP

PHP kennt vier [[skalar|skalare]] Grundtypen und einige zusammengesetzte:

| Typ | Beispiel | Bemerkung |
|---|---|---|
| `int` | `42`, `-7`, `1_000_000` | Ganzzahl, Unterstriche nur zur Lesbarkeit |
| `float` | `3.14`, `1e3` | Kommazahl (Gleitkommazahl) |
| `string` | `'Ada'`, `"Hallo"` | Zeichenkette (Bytes!) |
| `bool` | `true`, `false` | Wahrheitswert |
| `array` | `[1, 2]`, `['a' => 1]` | Liste und Wörterbuch zugleich |
| `null` | `null` | „kein Wert“ |
| `object` | `new DateTimeImmutable()` | Instanz einer Klasse |

`var_dump($x)` zeigt Typ und Wert, `get_debug_type($x)` liefert den Typnamen als String.

## Die Falle: == und Type Juggling

Beim Vergleich mit `==` passt PHP die Typen vorher an – das heißt [[type-juggling|Type Juggling]]:

```php
var_dump("1" == "01");     // true  – beide sehen wie Zahlen aus
var_dump("10" == "1e1");   // true  – 10 == 10
var_dump(null == false);   // true
var_dump(0 == "a");        // false (seit PHP 8; früher true!)
var_dump("1" === "01");    // false – anderer Inhalt
var_dump(1 === 1.0);       // false – int ist nicht float
```

`===` ist die [[strikte-gleichheit|strikte Gleichheit]]: gleicher Typ **und** gleicher Wert, ohne Umwandlung.

> [!MERKSATZ]
> Vergleiche in PHP immer mit `===` und `!==`. Das lose `==` nur, wenn du die Umwandlung bewusst willst.

Ein Klassiker: `strpos()` liefert die Position eines Teilstrings – und das kann `0` sein. `strpos(...) == false`
ist dann wahr, obwohl der Text gefunden wurde. Für „ist enthalten?“ gibt es `str_contains()`.

## Typdeklarationen und strict_types

Du kannst Parameter, Rückgabewerte und Eigenschaften mit Typen versehen:

```php
<?php
declare(strict_types=1);

function brutto(float $netto, int $prozent = 19): float
{
    return $netto * (1 + $prozent / 100);
}

echo brutto(100.0);   // 119
echo brutto("100");   // TypeError: Argument #1 must be of type float, string given
```

Ohne `declare(strict_types=1);` würde PHP `"100"` stillschweigend in `100.0` umwandeln. Mit
[[strict-types|strict_types]] wirft PHP einen `TypeError`. Zwei Regeln:

- Die Zeile muss die **erste Anweisung** der Datei sein.
- Sie gilt für alle Aufrufe, die **in dieser Datei** stehen – auch für eingebaute Funktionen wie `strlen()`.

Eine Ausnahme ist erlaubt: Ein `int` darf dort stehen, wo `float` erwartet wird.

> [!PRAXIS]
> In professionellen Projekten steht `declare(strict_types=1);` in **jeder** Datei. Werkzeuge wie
> [[phpstan|PHPStan]] und Code-Stil-Regeln prüfen das automatisch.

## Union, nullable, mixed, void und never

Moderne Typangaben beschreiben genau, was erlaubt ist:

```php
function finde(int $id): ?string { /* string oder null */ }
function formatiere(int|float $zahl): string { /* Union-Type */ }
function logge(string $text): void { /* gibt nichts zurück */ }
function abbrechen(string $grund): never
{
    throw new RuntimeException($grund);   // kehrt nie zurück
}
function zeige(mixed $wert): string { return get_debug_type($wert); }
```

| Angabe | Bedeutung |
|---|---|
| `?string` | [[nullable-typ|Nullable]]: `string` oder `null` |
| `int\|float` | [[union-type|Union-Type]]: einer der Typen |
| `A&B` | Intersection-Type: Objekt muss beide Interfaces erfüllen |
| `void` | kein Rückgabewert |
| `never` | [[never-typ|never]]: Funktion wirft immer oder beendet das Programm |
| `mixed` | beliebiger Wert – sparsam einsetzen |

> [!TIPP]
> Je genauer der Typ, desto früher fällt ein Fehler auf. `mixed` sagt dem Leser nichts – nutze es nur, wenn
> wirklich alles erlaubt ist.

## Zusammenfassung

- Variablen beginnen mit `$`, Anweisungen enden mit `;`, Strings verkettest du mit `.`.
- `==` wandelt Typen um (Type Juggling) – nutze `===` und `!==`.
- `declare(strict_types=1);` steht als erste Zeile und verbietet stille Umwandlungen bei Funktionsaufrufen.
- Typen gibt es für Parameter, Rückgabewerte und Eigenschaften.
- `?T` erlaubt null, `A|B` mehrere Typen, `void` heißt „nichts zurück“, `never` heißt „kehrt nie zurück“.
