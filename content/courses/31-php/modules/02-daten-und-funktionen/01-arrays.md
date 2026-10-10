---
title: Arrays in der Tiefe
summary: Ein Datentyp für Listen und Wörterbücher – Schlüssel, Array-Funktionen, Destrukturierung und die Fallen beim Umnummerieren.
duration: 25
sources:
  - title: PHP-Handbuch – Arrays
    url: https://www.php.net/manual/de/language.types.array.php
  - title: PHP-Handbuch – Array-Funktionen
    url: https://www.php.net/manual/de/ref.array.php
  - title: PHP-Handbuch – Destrukturierung mit list() und []
    url: https://www.php.net/manual/de/function.list.php
quiz:
  - type: single
    question: "Was enthält `$z` nach `$z = array_filter([3, 1, 2], fn($n) => $n > 1);`?"
    options: ["[3, 2] mit den Schlüsseln 0 und 1", "[3, 2] mit den Schlüsseln 0 und 2", "[1]", "[true, false, true]"]
    answer: 1
    explanation: >
      array_filter behält die ursprünglichen Schlüssel. Die 2 stand an Position 2 und bleibt dort. Brauchst du
      wieder eine Liste ohne Lücken, rufst du array_values() auf.
  - type: find-bug
    question: Die Funktion soll prüfen, ob eine Rolle erlaubt ist. `istErlaubt('1e1')` liefert aber true. In welcher Zeile steckt der Fehler?
    language: php
    code: |
      <?php
      function istErlaubt(string $rolle): bool
      {
          $erlaubt = ['admin', 'editor', '10'];
          return in_array($rolle, $erlaubt);
      }
    bug_line: 5
    explanation: >
      in_array vergleicht standardmäßig mit ==. "1e1" und "10" gelten dann als gleich. Mit
      `in_array($rolle, $erlaubt, true)` wird strikt verglichen.
  - type: multiple
    question: Welche Aussagen über PHP-Arrays stimmen?
    options:
      - Ein Array kann gleichzeitig wie eine Liste und wie ein Wörterbuch genutzt werden.
      - Schlüssel dürfen nur int oder string sein.
      - "Der Schlüssel \"5\" wird automatisch zur Ganzzahl 5."
      - Arrays werden bei der Übergabe an eine Funktion als Referenz übergeben.
    answers: [0, 1, 2]
    explanation: >
      Arrays sind geordnete Schlüssel-Wert-Sammlungen mit int- oder string-Schlüsseln; numerische Strings werden zu
      int. Bei der Übergabe wird ein Array kopiert (genauer: erst bei einer Änderung) – anders als Objekte.
  - type: cloze
    text: "Nach array_filter liefert ___() wieder eine lückenlose Liste. Das Entpacken mit `['name' => $n] = $user;` heißt ___."
    blanks:
      - [array_values]
      - [Destrukturierung, Destructuring]
    explanation: array_values nummeriert neu ab 0. Destrukturierung entpackt Listen und assoziative Arrays in einzelne Variablen.
tasks:
  - id: umsatz-pro-kategorie
    type: code
    language: php
    title: Umsatz pro Kategorie
    description: |
      Ein Shop liefert eine Liste von Bestellungen. Jede Bestellung ist ein assoziatives Array mit den
      Schlüsseln `kategorie` (string) und `cent` (int).

      Schreibe `umsatzProKategorie(array $bestellungen): array`. Sie liefert ein assoziatives Array
      `Kategorie => Summe in Cent`, **absteigend nach Umsatz sortiert**. Eine leere Liste ergibt `[]`.
    starter: |
      <?php
      declare(strict_types=1);

      function umsatzProKategorie(array $bestellungen): array
      {
          $summen = [];
          // 1. Summen bilden  2. absteigend nach Wert sortieren (Schlüssel behalten!)
          return $summen;
      }
    tests:
      - name: Summen werden gebildet
        code: |
          $r = umsatzProKategorie([
              ['kategorie' => 'Buch', 'cent' => 1500],
              ['kategorie' => 'Spiel', 'cent' => 4000],
              ['kategorie' => 'Buch', 'cent' => 1200],
          ]);
          assert_same(4000, $r['Spiel']); assert_same(2700, $r['Buch']);
      - name: absteigend sortiert, Schlüssel bleiben erhalten
        code: |
          $r = umsatzProKategorie([
              ['kategorie' => 'Buch', 'cent' => 100],
              ['kategorie' => 'Spiel', 'cent' => 300],
              ['kategorie' => 'Film', 'cent' => 200],
          ]);
          assert_same(['Spiel', 'Film', 'Buch'], array_keys($r));
      - name: leere Liste
        code: assert_same([], umsatzProKategorie([]));
    hints:
      - "Mit `foreach ($bestellungen as ['kategorie' => $k, 'cent' => $c])` entpackst du jede Bestellung direkt."
      - "`$summen[$k] = ($summen[$k] ?? 0) + $c;` addiert auch beim ersten Mal ohne Warnung."
      - "`arsort($summen);` sortiert absteigend nach Wert und behält die Schlüssel. `rsort` würde sie wegwerfen."
    solution: |
      <?php
      declare(strict_types=1);

      function umsatzProKategorie(array $bestellungen): array
      {
          $summen = [];
          foreach ($bestellungen as ['kategorie' => $kategorie, 'cent' => $cent]) {
              $summen[$kategorie] = ($summen[$kategorie] ?? 0) + $cent;
          }
          arsort($summen);

          return $summen;
      }
  - id: schluessel-behalten
    type: dragdrop
    title: Bleiben die Schlüssel erhalten?
    description: Manche Array-Funktionen behalten die Schlüssel, andere nummerieren neu ab 0. Ordne zu.
    targets:
      - { id: behalten, label: Schlüssel bleiben erhalten }
      - { id: neu, label: Neu nummeriert ab 0 }
    items:
      - { label: array_filter, target: behalten }
      - { label: asort / arsort, target: behalten }
      - { label: "array_map (ein Array)", target: behalten }
      - { label: array_values, target: neu }
      - { label: sort / rsort, target: neu }
      - { label: "array_merge (Zahl-Schlüssel)", target: neu }
---
In JavaScript gibt es Arrays für Listen und Objekte für Wörterbücher. PHP hat für beides **einen** Typ:
das [[array]]. Es ist das wichtigste Werkzeug der Sprache – Formulardaten, Datenbankzeilen, JSON und
Konfigurationen landen alle in Arrays. Wer die Regeln für Schlüssel kennt, vermeidet viele Fehler.

## Ein Typ für Listen und Wörterbücher

Ein PHP-Array ist eine **geordnete** Sammlung von Schlüssel-Wert-Paaren.

```php
$farben = ['rot', 'grün', 'blau'];          // Liste: Schlüssel 0, 1, 2
$farben[] = 'gelb';                          // anhängen → Schlüssel 3

$user = [                                    // assoziatives Array
    'name' => 'Ada',
    'alter' => 36,
    'rollen' => ['admin', 'editor'],         // verschachtelt
];
echo $user['rollen'][0];                     // admin
```

Arrays mit Text-Schlüsseln heißen [[assoziatives-array|assoziative Arrays]]. Regeln für Schlüssel:

- Erlaubt sind nur `int` und `string`.
- Ein numerischer String wird zur Zahl: `'5'` wird zu `5`, `true` zu `1`.
- Gleiche Schlüssel überschreiben sich – der letzte gewinnt.

`array_is_list($a)` prüft, ob die Schlüssel lückenlos `0, 1, 2 …` sind – genau dann wird ein Array zu einer
JSON-Liste statt zu einem JSON-Objekt.

## Lesen, prüfen, durchlaufen

```php
foreach ($user as $schluessel => $wert) {
    echo "$schluessel: " . json_encode($wert) . PHP_EOL;
}

$name = $user['email'] ?? 'unbekannt';     // fehlender Schlüssel ohne Warnung
isset($user['name']);                      // true – aber false, wenn der Wert null ist!
array_key_exists('name', $user);           // true – auch bei null-Wert
count($user);                              // 3
in_array('admin', $user['rollen'], true);  // true – drittes Argument: strikt!
```

> [!FEHLER]
> `in_array($wert, $liste)` vergleicht mit `==`. Dann gilt `'1e1'` als enthalten, wenn `'10'` in der Liste
> steht. Gib als drittes Argument `true` an – das ist der strikte Vergleich.

Arrays sind **Werte**: Übergibst du ein Array an eine Funktion, arbeitet sie mit einer Kopie. Objekte dagegen
werden geteilt. Das lernst du im OOP-Modul genauer kennen.

## Die wichtigsten Array-Funktionen

| Funktion | Wirkung | Schlüssel |
|---|---|---|
| `array_map(fn, $a)` | jeden Wert umwandeln | bleiben |
| `array_filter($a, fn)` | Werte auswählen | bleiben (Lücken!) |
| `array_reduce($a, fn, start)` | zu einem Wert zusammenfassen | – |
| `array_values($a)` | neu nummerieren | 0, 1, 2 … |
| `array_keys($a)` / `array_column($zeilen, 'name')` | Schlüssel / eine Spalte holen | neu |
| `array_sum($a)` | summieren | – |
| `sort` / `rsort` | nach Wert sortieren | neu |
| `asort` / `arsort` / `ksort` | nach Wert / Schlüssel sortieren | bleiben |
| `usort($a, fn)` | mit eigener Vergleichsfunktion | neu |
| `array_first($a)` / `array_last($a)` | erster / letzter Wert (neu in PHP 8.5) | – |

Die Sortierfunktionen ändern das Array **direkt** und geben nur `true` zurück. Für `usort` vergleichst du am
einfachsten mit dem Raumschiff-Operator: `usort($bücher, fn($a, $b) => $a['jahr'] <=> $b['jahr']);`

> [!MERKSATZ]
> Nach `array_filter` hat ein Array Lücken in den Schlüsseln. Brauchst du wieder eine Liste, hilft `array_values()`.

## Zusammenführen und Destrukturierung

```php
$a = ['x' => 1, 'y' => 2];
$b = ['y' => 9, 'z' => 3];
array_merge($a, $b);   // ['x' => 1, 'y' => 9, 'z' => 3] – rechts gewinnt
$a + $b;               // ['x' => 1, 'y' => 2, 'z' => 3] – links gewinnt
[...$a, ...$b];        // wie array_merge (Spread-Operator)
```

Mit [[destrukturierung|Destrukturierung]] entpackst du Werte direkt in Variablen:

```php
[$erster, $zweiter] = ['Ada', 'Bob'];
['name' => $name, 'alter' => $alter] = $user;
[$a, $b] = [$b, $a];                               // Werte tauschen

foreach ($zeilen as ['name' => $name, 'cent' => $cent]) {
    echo "$name: $cent" . PHP_EOL;
}
```

> [!PRAXIS]
> Datenbank-Ergebnisse kommen oft als Liste assoziativer Arrays. Mit `array_column($zeilen, 'email')` holst du
> eine Spalte, mit `array_column($zeilen, null, 'id')` baust du ein Array „id → Zeile“ für schnelles Nachschlagen.

## Zusammenfassung

- Ein PHP-Array ist eine geordnete Sammlung mit `int`- oder `string`-Schlüsseln – Liste und Wörterbuch zugleich.
- `??` liest fehlende Schlüssel ohne Warnung, `in_array` braucht `true` als drittes Argument.
- `array_map`, `array_filter`, `array_reduce` und die Sortierfunktionen sind dein tägliches Werkzeug.
- `array_filter` und `asort` behalten Schlüssel, `sort` und `array_values` nummerieren neu.
- Destrukturierung entpackt Listen und assoziative Arrays – auch direkt im `foreach`.
