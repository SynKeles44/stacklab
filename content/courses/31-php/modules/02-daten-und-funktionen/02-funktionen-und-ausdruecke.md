---
title: Funktionen und moderne Ausdrücke
summary: Named Arguments, variadische Funktionen, Closures, First-Class Callables, der Pipe-Operator aus PHP 8.5, match und der Nullsafe-Operator.
duration: 25
sources:
  - title: PHP-Handbuch – Funktionsargumente (benannte und variadische Argumente)
    url: https://www.php.net/manual/de/functions.arguments.php
  - title: PHP-Handbuch – Pfeilfunktionen und anonyme Funktionen
    url: https://www.php.net/manual/de/functions.arrow.php
  - title: PHP-Handbuch – First-Class-Callable-Syntax
    url: https://www.php.net/manual/de/functions.first_class_callable_syntax.php
  - title: PHP-Handbuch – match
    url: https://www.php.net/manual/de/control-structures.match.php
  - title: PHP 8.5 Release – Pipe-Operator
    url: https://www.php.net/releases/8.5/de.php
quiz:
  - type: single
    question: "Was passiert bei `echo match('1') { 1 => 'eins', 2 => 'zwei' };`?"
    options:
      - Es wird "eins" ausgegeben.
      - Es wird nichts ausgegeben.
      - Es wird ein UnhandledMatchError geworfen.
      - Es wird "1" ausgegeben.
    answer: 2
    explanation: >
      match vergleicht strikt wie ===. Der String '1' ist nicht die Zahl 1, und es gibt keinen default-Zweig –
      also wirft PHP einen UnhandledMatchError.
  - type: multiple
    question: Welche Aussagen über Pfeilfunktionen (`fn`) und Closures (`function () use (...)`) stimmen?
    options:
      - Eine Pfeilfunktion sieht Variablen aus der Umgebung automatisch.
      - Eine anonyme function sieht äußere Variablen nur über use.
      - Eine Pfeilfunktion kann beliebig viele Anweisungen enthalten.
      - Beide kann man in einer Variable speichern und an array_map übergeben.
    answers: [0, 1, 3]
    explanation: fn besteht aus genau einem Ausdruck und übernimmt äußere Variablen automatisch (als Kopie). function braucht use.
  - type: cloze
    text: "`$len = strlen___;` erzeugt eine Closure aus einer vorhandenen Funktion. Der Pipe-Operator `___` reicht ein Ergebnis an die nächste Funktion weiter."
    blanks:
      - ["(...)"]
      - ["|>"]
    explanation: Die First-Class-Callable-Syntax `name(...)` und der Pipe-Operator `|>` (neu in PHP 8.5) passen perfekt zusammen.
  - type: match
    question: Ordne jedem Ausdruck sein Ergebnis zu.
    pairs:
      - { left: "str_pad(string: 'a', length: 3, pad_string: '*')", right: "'a**'" }
      - { left: "$user?->profil?->name (wenn $user null ist)", right: "null" }
      - { left: "array_sum(...[1, 2, 3])", right: "6" }
      - { left: "' Hi ' |> trim(...) |> strtoupper(...)", right: "'HI'" }
    explanation: Named Arguments, Nullsafe-Operator, Spread-Operator und Pipe-Operator machen Code kürzer und lesbarer.
tasks:
  - id: slugify
    type: code
    language: php
    title: Aus einem Titel einen URL-Slug machen
    description: |
      Für Blog-Adressen braucht man aus Titeln wie `"PHP 8.5 – Größer & schöner!"` einen Slug wie
      `php-8-5-groesser-schoener`. Schreibe `slugify(string $titel): string`:

      1. Leerzeichen am Rand entfernen und alles kleinschreiben (Umlaute auch!).
      2. `ä`, `ö`, `ü`, `ß` durch `ae`, `oe`, `ue`, `ss` ersetzen.
      3. Jede Folge von Zeichen, die nicht `a–z` oder `0–9` sind, wird zu **einem** `-`.
      4. Bindestriche am Anfang und Ende entfernen.

      Bonus: Schreibe die Schritte als Kette mit dem Pipe-Operator `|>`.
    starter: |
      <?php
      declare(strict_types=1);

      function slugify(string $titel): string
      {
          return $titel;
      }
    tests:
      - name: Normalfall mit Umlauten und Sonderzeichen
        code: assert_same('php-8-5-groesser-schoener', slugify('  PHP 8.5 – Größer & schöner! '));
      - name: Großgeschriebene Umlaute
        code: assert_same('ueber-aepfel', slugify('Über Äpfel'));
      - name: leerer Titel
        code: assert_same('', slugify(''));
      - name: nur Sonderzeichen
        code: assert_same('', slugify('!!! ???'));
    hints:
      - "`mb_strtolower()` macht auch aus `Ü` ein `ü`. Danach ersetzt `strtr($s, ['ä' => 'ae', …])` die Umlaute."
      - "`preg_replace('/[^a-z0-9]+/', '-', $s)` fasst alle anderen Zeichen zu einem Bindestrich zusammen."
      - "Pipe-Version: `$titel |> trim(...) |> mb_strtolower(...) |> (fn($s) => …)` – Pfeilfunktionen gehören in Klammern."
    solution: |
      <?php
      declare(strict_types=1);

      function slugify(string $titel): string
      {
          return $titel
              |> trim(...)
              |> mb_strtolower(...)
              |> (fn(string $s) => strtr($s, ['ä' => 'ae', 'ö' => 'oe', 'ü' => 'ue', 'ß' => 'ss']))
              |> (fn(string $s) => preg_replace('/[^a-z0-9]+/', '-', $s))
              |> (fn(string $s) => trim($s, '-'));
      }
  - id: was-passiert
    type: steps
    title: Was passiert als Nächstes?
    description: Spiel kleine Code-Stücke durch und sag voraus, was PHP tut.
    steps:
      - situation: "`function rabatt(int $preis, int $prozent = 10, bool $runden = true) {…}` wird mit `rabatt(200, runden: false)` aufgerufen."
        question: Welchen Wert hat $prozent?
        options: ["10", "false", "0", "Fehler: Argument fehlt"]
        answer: 0
        explanation: Mit Named Arguments überspringst du optionale Parameter. $prozent behält seinen Standardwert 10.
      - situation: "`$faktor = 3; $mal = fn(int $x) => $x * $faktor; $faktor = 5; echo $mal(2);`"
        question: Was erscheint?
        options: ["6", "10", "Ein Fehler, weil $faktor unbekannt ist"]
        answer: 0
        explanation: Eine Pfeilfunktion übernimmt äußere Variablen beim Erzeugen als Kopie – damals war $faktor noch 3.
      - situation: "`$status = 404; echo match(true) { $status >= 500 => 'Server', $status >= 400 => 'Client', default => 'OK' };`"
        question: Was erscheint?
        options: ["Server", "Client", "OK"]
        answer: 1
        explanation: Mit match(true) wird der erste Zweig gewählt, dessen Bedingung true ist. Es gibt kein Durchfallen wie bei switch.
      - situation: "`$bestellung = null; echo $bestellung?->kunde()?->name ?? 'Gast';`"
        question: Was erscheint?
        options: ["Gast", "Ein Fehler: Aufruf auf null", "Nichts"]
        answer: 0
        explanation: Der Nullsafe-Operator bricht die Kette bei null ab und liefert null. ?? setzt dann 'Gast' ein.
---
Funktionen kennst du aus den Grundlagen. PHP hat in den letzten Versionen viele Werkzeuge bekommen, mit denen
Aufrufe lesbarer und sicherer werden: benannte Argumente, kurze Pfeilfunktionen, `match` statt langer
`switch`-Blöcke – und mit PHP 8.5 den Pipe-Operator. Diese Lektion zeigt dir, wann du was einsetzt.

## Parameter: Standardwerte, Named Arguments, variadisch

```php
function rabatt(int $preisCent, int $prozent = 10, bool $runden = true): int
{
    $wert = $preisCent * (100 - $prozent) / 100;
    return $runden ? (int) round($wert) : (int) $wert;
}

rabatt(1999);                         // Standardwerte greifen
rabatt(1999, runden: false);          // Named Argument – $prozent bleibt 10
rabatt(prozent: 25, preisCent: 400);  // Reihenfolge egal
```

Mit [[benanntes-argument|Named Arguments]] schreibst du den Parameternamen vor den Wert. Das macht Aufrufe mit
vielen `true`/`false`-Werten verständlich und lässt dich optionale Parameter überspringen.

Eine [[variadische-funktion|variadische Funktion]] nimmt beliebig viele Argumente als Array entgegen:

```php
function summe(int ...$zahlen): int
{
    return array_sum($zahlen);
}
summe(1, 2, 3);         // 6
summe(...[4, 5]);       // 9 – Spread-Operator entpackt ein Array
```

> [!FEHLER]
> Named Arguments machen Parameternamen zu einem Teil der öffentlichen Schnittstelle. Benennst du einen
> Parameter um, brechen Aufrufe wie `rabatt(runden: false)` – in Bibliotheken ist das ein Breaking Change.

## Closures und Pfeilfunktionen

Funktionen sind in PHP Werte. Du kannst sie in Variablen speichern und weitergeben – zum Beispiel an
`array_map` oder `usort`.

```php
$mwst = 19;

$brutto = function (int $netto) use ($mwst): int {   // use übernimmt $mwst
    return $netto + intdiv($netto * $mwst, 100);
};

$bruttoKurz = fn(int $netto): int => $netto + intdiv($netto * $mwst, 100);

array_map($bruttoKurz, [100, 200]);   // [119, 238]
```

| | `function () use (…) {}` | `fn() => …` |
|---|---|---|
| Äußere Variablen | nur über `use` | automatisch (als Kopie) |
| Inhalt | beliebig viele Anweisungen | genau ein Ausdruck |

Beide sind [[closure|Closures]]. Als Typ für Parameter schreibst du `callable` oder genauer `Closure`.

## First-Class Callables und der Pipe-Operator

Mit `name(...)` machst du aus einer vorhandenen Funktion oder Methode eine Closure – das ist die
[[first-class-callable|First-Class-Callable-Syntax]]:

```php
$laenge = strlen(...);
$laenge('Hallo');                      // 5
array_map(trim(...), [' a ', 'b ']);   // ['a', 'b']
$pruefer = $validator->pruefe(...);    // geht auch mit Methoden
```

PHP 8.5 bringt den [[pipe-operator|Pipe-Operator]] `|>`. Er reicht das Ergebnis links als einziges Argument an
die Funktion rechts weiter – von links nach rechts gelesen, ohne Zwischenvariablen:

```php
$slug = '  Hallo Welt  '
    |> trim(...)
    |> strtolower(...)
    |> (fn(string $s) => str_replace(' ', '-', $s));   // "hallo-welt"
```

- Rechts steht ein Callable, das **einen** Parameter erwartet.
- Pfeilfunktionen setzt du in Klammern.
- Ohne Pipe müsstest du von innen nach außen lesen: `str_replace(' ', '-', strtolower(trim($x)))`.

## match statt switch

Ein [[match-ausdruck|match-Ausdruck]] liefert einen Wert und vergleicht **strikt** wie `===`:

```php
$text = match ($statusCode) {
    200, 201 => 'Erfolg',
    404 => 'Nicht gefunden',
    500 => 'Serverfehler',
    default => 'Unbekannt',
};

$klasse = match (true) {            // Bedingungen prüfen
    $alter < 13 => 'Kind',
    $alter < 18 => 'Jugendlich',
    default => 'Erwachsen',
};
```

| `switch` | `match` |
|---|---|
| vergleicht lose (`==`) | vergleicht strikt (`===`) |
| braucht `break`, sonst fällt es durch | kein Durchfallen |
| ist eine Anweisung | ist ein Ausdruck mit Ergebnis |
| ohne Treffer passiert nichts | ohne Treffer: `UnhandledMatchError` |

> [!MERKSATZ]
> `match` ist streng, kurz und vollständig: Fehlt ein Fall, merkst du es sofort an der Exception.

## Der Nullsafe-Operator

Ketten wie `$bestellung->kunde()->adresse()->stadt` brechen, sobald ein Glied `null` ist. Der
[[nullsafe-operator|Nullsafe-Operator]] `?->` bricht die Kette dann ab und liefert `null`:

```php
$stadt = $bestellung?->kunde()?->adresse()?->stadt ?? 'unbekannt';
```

Kombiniert mit `??` bekommst du einen Standardwert. Er funktioniert nur für Objekte – für Array-Schlüssel nimmst
du weiterhin `??`.

> [!PRAXIS]
> In modernen Codebasen siehst du `match` statt `switch`, Named Arguments bei Konstruktoren mit vielen
> Parametern und First-Class Callables wie `array_map($this->formatiere(...), $zeilen)`.

## Zusammenfassung

- Named Arguments (`runden: false`) machen Aufrufe lesbar und überspringen optionale Parameter.
- `...$zahlen` sammelt beliebig viele Argumente, `...$array` entpackt ein Array.
- `fn` übernimmt äußere Variablen automatisch, `function` braucht `use`.
- `strlen(...)` erzeugt eine Closure, `|>` (PHP 8.5) verkettet Aufrufe von links nach rechts.
- `match` vergleicht strikt, liefert einen Wert und wirft ohne Treffer einen `UnhandledMatchError`.
- `?->` bricht eine Kette bei `null` ab.
