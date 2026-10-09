---
title: Zeichenklassen, Bereiche und Kurzschreibweisen
summary: "Mit eckigen Klammern, Bereichen wie [0-9] und Kurzschreibweisen wie \\d beschreibst du, welche Zeichen an einer Stelle erlaubt sind."
duration: 20
sources:
  - title: MDN – Zeichenklassen
    url: https://developer.mozilla.org/de/docs/Web/JavaScript/Guide/Regular_expressions/Character_classes
  - title: PHP-Handbuch – Zeichenklassen in PCRE
    url: https://www.php.net/manual/de/regexp.reference.character-classes.php
  - title: GNU grep Manual – Character Classes and Bracket Expressions
    url: https://www.gnu.org/software/grep/manual/grep.html#Character-Classes-and-Bracket-Expressions
quiz:
  - type: single
    question: "Auf wie viele Zeichen passt die Klasse `[abc]` an einer Stelle?"
    options:
      - Auf genau ein Zeichen – a, b oder c
      - Auf die Zeichenfolge „abc“
      - Auf beliebig viele der Zeichen a, b und c
    answer: 0
    explanation: Eine Zeichenklasse steht immer für **ein einziges** Zeichen. Sie zählt nur auf, welche Zeichen an dieser Stelle erlaubt sind.
  - type: match
    question: Ordne jeder Kurzschreibweise ihre Bedeutung zu.
    pairs:
      - { left: "\\d", right: "eine Ziffer 0–9" }
      - { left: "\\w", right: "Buchstabe, Ziffer oder Unterstrich" }
      - { left: "\\s", right: "Leerzeichen, Tab oder Zeilenumbruch" }
      - { left: "\\D", right: "alles außer einer Ziffer" }
      - { left: ".", right: "jedes Zeichen außer dem Zeilenumbruch" }
    explanation: "Kleinbuchstaben (`\\d \\w \\s`) beschreiben eine Gruppe von Zeichen, die Großbuchstaben (`\\D \\W \\S`) das Gegenteil. Der Punkt ist der Joker – nur Zeilenumbrüche lässt er standardmäßig aus."
  - type: multiple
    question: "Welche Texte enthalten einen Treffer für `gr[ae]y`?"
    options: [grey, gray, groy, "graey", "Grey"]
    answers: [0, 1]
    explanation: "Zwischen „gr“ und „y“ steht genau **ein** Zeichen aus der Klasse – a oder e. „graey“ hat zwei Zeichen dazwischen, „Grey“ ein großes G."
  - type: find-bug
    question: Die Regex soll alle Zeichen finden, die **keine** Ziffer sind. In welcher Zeile liegt der Fehler?
    language: php
    code: |
      $text = 'Tel. 0151-123';
      $ohneZiffern = preg_replace('/^[0-9]/', '', $text);
      echo $ohneZiffern;
    bug_line: 2
    explanation: "Das `^` steht **vor** der Klasse und ist damit ein Anker für den Textanfang. Für „keine Ziffer“ muss es **innen** stehen: `[^0-9]`."
  - type: cloze
    text: "Die Klasse ___ passt auf jeden Kleinbuchstaben von a bis z. Mit ___ verneinst du sie: alles außer Kleinbuchstaben."
    blanks:
      - ["[a-z]"]
      - ["[^a-z]"]
    explanation: Ein Bindestrich zwischen zwei Zeichen bildet einen Bereich. Ein `^` direkt nach der öffnenden Klammer kehrt die Klasse um.
tasks:
  - id: zeichen-zuordnen
    type: dragdrop
    title: Welche Klasse trifft das Zeichen?
    description: |
      Ziehe jedes Zeichen zu der Zeichenklasse, die es trifft. Jedes Zeichen passt zu **genau einer** der
      vier Klassen.
    targets:
      - { id: ziffer, label: "\\d" }
      - { id: leer, label: "\\s" }
      - { id: hex, label: "[a-f]" }
      - { id: sonder, label: "[^\\w\\s]" }
    items:
      - { label: "7", target: ziffer }
      - { label: "0", target: ziffer }
      - { label: "Leerzeichen", target: leer }
      - { label: "Tabulator", target: leer }
      - { label: "c", target: hex }
      - { label: "e", target: hex }
      - { label: "!", target: sonder }
      - { label: "#", target: sonder }
    hints:
      - "`[^\\w\\s]` heißt: weder Wortzeichen noch Leerraum – also Satz- und Sonderzeichen."
  - id: ziffern-maskieren
    type: code
    language: php
    title: Ziffern maskieren und Text säubern
    description: |
      `preg_replace($muster, $ersatz, $text)` ersetzt in PHP **jeden** Treffer eines Musters. Die Muster
      stehen zwischen zwei Schrägstrichen in einem String, z. B. `'/a/'`.

      1. `maskiereZiffern(string $text): string` ersetzt jede Ziffer durch `*`.
         Aus `Karte 1234` wird `Karte ****`.
      2. `nurBuchstabenUndZiffern(string $text): string` entfernt alles, was **kein** Buchstabe `A–Z`/`a–z`,
         **keine** Ziffer und **kein** Leerzeichen ist. Aus `Hallo, Welt! (2026)` wird `Hallo Welt 2026`.
    starter: |
      function maskiereZiffern(string $text): string
      {
          return preg_replace('/X/', '*', $text);
      }

      function nurBuchstabenUndZiffern(string $text): string
      {
          return preg_replace('/X/', '', $text);
      }
    tests:
      - name: Ziffern werden maskiert
        code: assert_same('Karte ****, PIN ****', maskiereZiffern('Karte 1234, PIN 9876'));
      - name: Text ohne Ziffern bleibt gleich
        code: |
          assert_same('keine Zahlen', maskiereZiffern('keine Zahlen'));
          assert_same('', maskiereZiffern(''));
      - name: Satzzeichen werden entfernt
        code: assert_same('Hallo Welt 2026', nurBuchstabenUndZiffern('Hallo, Welt! (2026)'));
      - name: Unterstrich und Bindestrich werden ebenfalls entfernt
        code: assert_same('ab12', nurBuchstabenUndZiffern('a_b-1#2'));
      - name: Leerer Text bleibt leer
        code: assert_same('', nurBuchstabenUndZiffern(''));
    hints:
      - "Für die Ziffern reicht eine Kurzschreibweise oder ein Bereich."
      - "Für die zweite Funktion brauchst du eine **verneinte** Klasse mit Bereichen und einem Leerzeichen."
      - "`'/\\d/'` und `'/[^A-Za-z0-9 ]/'`. `\\w` passt nicht, weil es den Unterstrich mitnimmt."
    solution: |
      ```php
      function maskiereZiffern(string $text): string
      {
          return preg_replace('/\d/', '*', $text);
      }

      function nurBuchstabenUndZiffern(string $text): string
      {
          return preg_replace('/[^A-Za-z0-9 ]/', '', $text);
      }
      ```
---
Postleitzahlen bestehen aus Ziffern, Benutzernamen aus Buchstaben, Hex-Farben aus 0–9 und a–f. Mit
Literalen allein kommst du hier nicht weiter: Du willst nicht „die 7“ finden, sondern „**irgendeine** Ziffer“.
Dafür gibt es Zeichenklassen.

## Zeichenklassen mit eckigen Klammern

Eine [[zeichenklasse|Zeichenklasse]] zählt in eckigen Klammern auf, welche Zeichen an **einer** Stelle
erlaubt sind. Stell dir einen Schlüsselbund vor: Für ein Schloss probierst du die Schlüssel durch – einer
davon muss passen.

```js run
const muster = /gr[ae]y/;
console.log(muster.test("grey"));    // true
console.log(muster.test("gray"));    // true
console.log(muster.test("groy"));    // false
console.log(muster.test("graey"));   // false – die Klasse steht für EIN Zeichen
```

Die Reihenfolge in der Klasse spielt keine Rolle: `[ae]` und `[ea]` bedeuten dasselbe.

> [!MERKSATZ]
> Eine Zeichenklasse – egal wie lang – passt immer auf **genau ein** Zeichen.

## Bereiche

Alle Ziffern aufzuzählen wäre mühsam: `[0123456789]`. Mit einem Bindestrich schreibst du einen
[[zeichenbereich|Bereich]]:

| Klasse | Passt auf |
|---|---|
| `[0-9]` | eine [[ziffer|Ziffer]] |
| `[a-z]` | einen Kleinbuchstaben (ohne ä, ö, ü, ß) |
| `[A-Z]` | einen Großbuchstaben |
| `[A-Za-z0-9]` | Buchstabe oder Ziffer |
| `[0-9a-fA-F]` | eine Hex-Ziffer |
| `[a-z_-]` | Kleinbuchstabe, Unterstrich oder Bindestrich |

Bereiche richten sich nach der Reihenfolge der Zeichen im [[unicode|Unicode]]-Zeichensatz. Deshalb liegen
Umlaute **nicht** in `[a-z]`.

Steht der Bindestrich ganz am Anfang oder Ende der Klasse, ist er ein normales Zeichen. Innerhalb einer
Klasse verlieren übrigens die meisten Metazeichen ihre Sonderbedeutung: `[.?]` passt auf einen Punkt oder
ein Fragezeichen.

## Verneinte Klassen

Ein `^` **direkt** nach der öffnenden Klammer kehrt die Klasse um: „alles **außer** diesen Zeichen“.

```js run
console.log("Tel. 0151-123".replace(/[^0-9]/g, ""));   // "0151123"
console.log("a1b2".replace(/[^a-z]/g, ""));            // "ab"
```

Das `g` am Ende sorgt dafür, dass **alle** Treffer ersetzt werden, nicht nur der erste. Flags lernst du
in Modul 2 genauer kennen.

> [!FEHLER]
> **Das `^` an der falschen Stelle.** `[^0-9]` heißt „keine Ziffer“. `^[0-9]` heißt dagegen „eine Ziffer
> am **Textanfang**“ – dort ist `^` ein Anker. Ein einziges Zeichen Abstand verändert die Bedeutung komplett.

## Kurzschreibweisen

Für häufige Klassen gibt es [[kurzschreibweise|Kurzschreibweisen]]:

| Kurz | Entspricht (vereinfacht) | Gegenteil |
|---|---|---|
| `\d` | `[0-9]` – digit | `\D` |
| `\w` | `[A-Za-z0-9_]` – word | `\W` |
| `\s` | Leerzeichen, Tab, Zeilenumbruch – space | `\S` |
| `.` | jedes Zeichen außer Zeilenumbruch | – |

```js run
const text = "Raum B12, 3. Stock";
console.log(text.replace(/\d/g, "#"));   // "Raum B##, #. Stock"
console.log(text.replace(/\W/g, "_"));   // "Raum_B12__3__Stock"
```

Kurzschreibweisen dürfen auch **in** Klassen stehen: `[\d.,]` passt auf eine Ziffer, einen Punkt oder ein
Komma.

> [!ACHTUNG]
> `\w` kennt nur englische Buchstaben. „Müller“ besteht für `\w` aus „M“, „ller“ und einem fremden Zeichen.
> Für alle Buchstaben aller Sprachen gibt es `\p{L}` – das braucht das Flag `u` (Modul 2).

## Zeichenklassen in Werkzeugen

Nicht jeder Dialekt kennt jede Kurzschreibweise. Besonders wichtig: **`grep -E` kennt `\d` nicht.**

```bash title="Terminal"
echo "Raum 42" | grep -oE '\d+'       # keine Ausgabe – \d ist hier ein normales d
echo "Raum 42" | grep -oE '[0-9]+'    # 42
```

| Dialekt | `\d` | `\w` und `\s` | `[0-9]` |
|---|---|---|---|
| JavaScript | ja | ja | ja |
| PHP (PCRE) | ja | ja | ja |
| `grep -E`, `sed -E` (GNU) | nein | ja | ja |

> [!PRAXIS]
> Wer Muster zwischen Code und Terminal hin- und herkopiert, schreibt Ziffern oft gleich als `[0-9]`.
> Das funktioniert überall und erspart die Fehlersuche, warum ein Muster in `grep` plötzlich nichts findet.

## Zusammenfassung

- `[abc]` passt auf **ein** Zeichen aus der Aufzählung, die Reihenfolge ist egal.
- Bereiche wie `[0-9]`, `[a-z]` und `[A-Za-z0-9]` sparen Tipparbeit; Umlaute liegen nicht in `[a-z]`.
- `[^…]` verneint eine Klasse; `^` außerhalb der Klammern ist ein Anker.
- `\d`, `\w`, `\s` und ihre Gegenteile `\D`, `\W`, `\S` sind Kurzschreibweisen, `.` ist der Joker.
- `grep -E` und `sed -E` kennen `\d` nicht – `[0-9]` funktioniert überall.
