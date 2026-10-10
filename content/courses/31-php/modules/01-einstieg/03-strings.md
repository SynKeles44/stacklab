---
title: Strings in PHP
summary: Einfache und doppelte Anführungszeichen, Interpolation, Heredoc, sprintf und warum Umlaute die mb_*-Funktionen brauchen.
duration: 20
sources:
  - title: PHP-Handbuch – Strings
    url: https://www.php.net/manual/de/language.types.string.php
  - title: PHP-Handbuch – sprintf
    url: https://www.php.net/manual/de/function.sprintf.php
  - title: PHP-Handbuch – Multibyte-String-Funktionen
    url: https://www.php.net/manual/de/ref.mbstring.php
quiz:
  - type: single
    question: "Was gibt `$name = 'Ada'; echo 'Hallo $name';` aus?"
    options: ["Hallo Ada", "Hallo $name", "Hallo", "Einen Fehler"]
    answer: 1
    explanation: In einfachen Anführungszeichen setzt PHP keine Variablen ein. Nur doppelte Anführungszeichen und Heredoc interpolieren.
  - type: single
    question: "Warum liefert `strlen('Größe')` den Wert 7 statt 5?"
    options:
      - Weil strlen Leerzeichen mitzählt.
      - Weil strlen Bytes zählt und ö und ß in UTF-8 je zwei Bytes belegen.
      - Weil PHP Umlaute nicht unterstützt.
      - Weil strlen das Stringende mitzählt.
    answer: 1
    explanation: PHP-Strings sind Byte-Folgen. Für Zeichen brauchst du `mb_strlen('Größe')`, das 5 liefert.
  - type: cloze
    text: "`sprintf('%___d', 7)` ergibt `007`. Mit `number_format(1234.5, 2, ',', '___')` erhältst du `1.234,50`."
    blanks:
      - ["03"]
      - ["."]
    explanation: "`%03d` füllt mit Nullen auf drei Stellen auf. number_format nimmt Dezimal- und Tausender-Trennzeichen als Argumente."
  - type: match
    question: Ordne jeder Funktion ihr Ergebnis zu.
    pairs:
      - { left: "str_contains('Stacklab', 'lab')", right: "true" }
      - { left: "explode(',', 'a,b')", right: "['a', 'b']" }
      - { left: "implode('-', [1, 2])", right: "'1-2'" }
      - { left: "trim('  hi ')", right: "'hi'" }
      - { left: "mb_strtoupper('über')", right: "'ÜBER'" }
    explanation: explode teilt einen String in ein Array, implode setzt ein Array zu einem String zusammen.
tasks:
  - id: kassenzeile
    type: code
    language: php
    title: Eine Kassenzeile formatieren
    description: |
      Schreibe `kassenzeile(string $artikel, int $menge, float $preis): string`. Die Zeile soll auf jedem Kassenbon
      exakt gleich breit sein:

      1. Der Artikelname wird auf **12 Zeichen** gekürzt (falls länger) und mit Leerzeichen auf 12 Zeichen
         aufgefüllt – Umlaute zählen als **ein** Zeichen.
      2. Danach ein Leerzeichen, die Menge rechtsbündig in 3 Stellen, dann ` x `.
      3. Der Preis deutsch formatiert (`1.234,50`) und rechtsbündig in 8 Stellen, dann ` €`.

      Beispiel: `kassenzeile("Brot", 2, 3.5)` ergibt `"Brot           2 x     3,50 €"`.
    starter: |
      <?php
      declare(strict_types=1);

      function kassenzeile(string $artikel, int $menge, float $preis): string
      {
          // Tipp: mb_substr, mb_str_pad, number_format, sprintf
          return '';
      }
    tests:
      - name: Normalfall
        code: assert_same('Brot           2 x     3,50 €', kassenzeile('Brot', 2, 3.5));
      - name: Umlaute zählen als ein Zeichen
        code: assert_same('Käse           1 x    12,99 €', kassenzeile('Käse', 1, 12.99));
      - name: Lange Namen werden gekürzt, Tausender bekommen einen Punkt
        code: assert_same('Schokoladenk  10 x 1.234,50 €', kassenzeile('Schokoladenkuchen', 10, 1234.5));
      - name: Leerer Name und 0
        code: assert_same('               0 x     0,00 €', kassenzeile('', 0, 0.0));
    hints:
      - "`mb_substr($artikel, 0, 12)` kürzt, `mb_str_pad($text, 12)` füllt mit Leerzeichen auf – beide zählen Zeichen statt Bytes."
      - "`number_format($preis, 2, ',', '.')` liefert `1.234,50`."
      - "`sprintf('%s %3d x %8s €', $name, $menge, $preisText)` setzt alles zusammen."
    solution: |
      <?php
      declare(strict_types=1);

      function kassenzeile(string $artikel, int $menge, float $preis): string
      {
          $name = mb_str_pad(mb_substr($artikel, 0, 12), 12);
          $preisText = number_format($preis, 2, ',', '.');

          return sprintf('%s %3d x %8s €', $name, $menge, $preisText);
      }
  - id: string-ausgaben
    type: steps
    title: Was gibt PHP aus?
    description: Sag für jedes Code-Stück voraus, was auf dem Bildschirm erscheint.
    steps:
      - situation: "`$user = ['name' => 'Ada']; echo \"Hallo {$user['name']}!\";`"
        question: Was erscheint?
        options: ["Hallo Ada!", "Hallo {Ada}!", "Hallo Array!"]
        answer: 0
        explanation: Geschweifte Klammern in doppelten Anführungszeichen setzen auch Array-Einträge und Eigenschaften sauber ein.
      - situation: "`echo strtoupper('über');`"
        question: Was erscheint?
        options: ["ÜBER", "üBER", "UBER"]
        answer: 1
        explanation: strtoupper ändert nur ASCII-Buchstaben. Für Umlaute brauchst du mb_strtoupper.
      - situation: "`printf('%.1f', 2.25 + 0.1);`"
        question: Was erscheint?
        options: ["2.35", "2.4", "2,4"]
        answer: 1
        explanation: "`%.1f` rundet auf eine Nachkommastelle und nutzt immer den Punkt. Für deutsche Zahlen nimmst du number_format."
      - situation: "Ein Nowdoc: `echo <<<'TXT'` mit der Zeile `Preis: $preis` und dem Abschluss `TXT;`"
        question: Was erscheint?
        options: ["Preis: $preis", "Preis: 19.99", "Ein Syntaxfehler"]
        answer: 0
        explanation: Ein Nowdoc (Bezeichner in einfachen Anführungszeichen) setzt wie '…' keine Variablen ein.
---
Fast jedes PHP-Programm baut Texte: HTML, E-Mails, Log-Zeilen, Ausgaben im Terminal. PHP bietet dafür viele
Werkzeuge – und eine Stolperfalle, die du kennen musst: Ein PHP-[[string|String]] ist eine Folge von **Bytes**,
nicht von Buchstaben. Sobald Umlaute ins Spiel kommen, macht das einen Unterschied.

## Einfache und doppelte Anführungszeichen

```php
$name = 'Ada';
echo 'Hallo $name\n';   // Hallo $name\n   – alles wörtlich
echo "Hallo $name\n";   // Hallo Ada        + Zeilenumbruch
```

| Schreibweise | Variablen einsetzen? | Escape-Sequenzen wie `\n` |
|---|---|---|
| `'einfach'` | nein | nur `\'` und `\\` |
| `"doppelt"` | ja | ja: `\n`, `\t`, `\"`, `\$` … |

Das Einsetzen von Variablen heißt [[string-interpolation|String-Interpolation]]. Bei Arrays, Eigenschaften und
Methoden-Ergebnissen setzt du geschweifte Klammern, damit PHP weiß, wo der Ausdruck endet:

```php
echo "Hallo {$user['name']}, du hast {$warenkorb->anzahl()} Artikel.";
```

> [!MERKSATZ]
> Einfache Anführungszeichen für festen Text, doppelte (mit `{$…}`) zum Einsetzen von Werten.

## Mehrzeilige Texte: Heredoc und Nowdoc

Für längere Texte gibt es [[heredoc|Heredoc]] – wie doppelte Anführungszeichen, nur über mehrere Zeilen:

```php
$text = <<<MAIL
    Hallo {$kunde['name']},

    deine Bestellung {$nummer} ist unterwegs.
    MAIL;
```

- Nach `<<<` folgt ein frei wählbarer Bezeichner, der Text endet mit demselben Bezeichner.
- Die Einrückung der Schlusszeile wird aus allen Zeilen entfernt – du darfst den Text also sauber einrücken.
- Schreibst du den Bezeichner in einfache Anführungszeichen (`<<<'MAIL'`), entsteht ein [[nowdoc|Nowdoc]]:
  Es wird nichts eingesetzt, wie bei `'…'`.

## Formatieren mit sprintf und number_format

[[sprintf]] baut einen String nach einer Vorlage. Platzhalter beginnen mit `%`:

```php
sprintf('%s ist %d Jahre alt', 'Ada', 36);   // Ada ist 36 Jahre alt
sprintf('%05d', 42);          // 00042   – mit Nullen auffüllen
sprintf('%.2f', 3.14159);     // 3.14    – zwei Nachkommastellen
sprintf('%-8s|', 'ab');       // "ab      |" – linksbündig auf 8
sprintf('%8s|', 'ab');        // "      ab|" – rechtsbündig auf 8
number_format(1234.5, 2, ',', '.');   // 1.234,50
```

`printf()` gibt direkt aus, `sprintf()` liefert den String zurück. Für deutsche Zahlen nimmst du
`number_format()`, denn `%f` nutzt immer den Punkt.

> [!PRAXIS]
> Geldbeträge rechnet man in Projekten meist in Cent als `int`, um Rundungsfehler von [[gleitkommazahl|Gleitkommazahlen]]
> zu vermeiden. Erst bei der Ausgabe wird formatiert.

## Die wichtigsten String-Funktionen

| Funktion | Ergebnis |
|---|---|
| `strlen('Hallo')` | `5` (Bytes) |
| `str_contains($s, 'x')` | enthält `$s` den Teilstring? |
| `str_starts_with($s, 'http')` / `str_ends_with($s, '.php')` | Anfang / Ende prüfen |
| `str_replace('a', 'b', $s)` | ersetzen |
| `trim($s)` | Leerzeichen am Rand entfernen |
| `explode(',', 'a,b,c')` | `['a', 'b', 'c']` |
| `implode(', ', ['a', 'b'])` | `'a, b'` |
| `substr($s, 0, 3)` | Ausschnitt (in Bytes) |

## Bytes gegen Zeichen: die mb_*-Funktionen

PHP speichert Texte als [[byte|Bytes]]. In [[unicode|UTF-8]] belegen `ä`, `ö`, `ß` oder `€` mehr als ein Byte.
Die klassischen Funktionen zählen Bytes – und zerschneiden Umlaute:

```php
strlen('Größe');            // 7
mb_strlen('Größe');         // 5
substr('Äpfel', 0, 1);      // "\xC3" – ein halbes Ä!
mb_substr('Äpfel', 0, 1);   // "Ä"
strtoupper('über');         // "üBER"
mb_strtoupper('über');      // "ÜBER"
mb_str_pad('Käse', 6, '.'); // "Käse.."
```

Die [[multibyte-funktion|Multibyte-Funktionen]] mit Präfix `mb_` zählen **Zeichen** statt Bytes.

> [!FEHLER]
> `str_pad('Käse', 12)` füllt nur auf 12 **Bytes** auf – die Spalte ist dann ein Zeichen zu kurz. Bei
> Text, den Menschen lesen, nimm immer `mb_strlen`, `mb_substr`, `mb_str_pad` und `mb_strtoupper`.

## Zusammenfassung

- `'…'` nimmt Text wörtlich, `"…"` und Heredoc setzen Variablen ein – mit `{$…}` auch Arrays und Methoden.
- Nowdoc (`<<<'X'`) ist die mehrzeilige Variante ohne Einsetzen.
- `sprintf` formatiert nach Vorlage, `number_format` liefert deutsche Zahlen.
- `str_contains`, `explode`, `implode` und `trim` brauchst du ständig.
- PHP-Strings sind Bytes: Für Umlaute nutzt du die `mb_*`-Funktionen.
