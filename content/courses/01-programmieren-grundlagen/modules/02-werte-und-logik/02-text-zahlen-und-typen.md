---
title: Rechnen, Text und Typumwandlung
summary: Mit Operatoren rechnen, Texte mit Template-Literals bauen, Zahlen runden – und verstehen, warum "5" + 1 den Text "51" ergibt.
duration: 25
sources:
  - title: MDN – Ausdrücke und Operatoren
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_operators
  - title: MDN – Template literals
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
  - title: MDN – String
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
  - title: MDN – Type coercion (Glossar)
    url: https://developer.mozilla.org/en-US/docs/Glossary/Type_coercion
  - title: PHP-Handbuch – Typumwandlung (Type Juggling)
    url: https://www.php.net/manual/de/language.types.type-juggling.php
quiz:
  - type: single
    question: Welchen Wert hat `2 + 3 * 4`?
    options: ["20", "14", "24"]
    answer: 1
    explanation: Punkt vor Strich – erst 3 * 4 = 12, dann 2 + 12 = 14. Mit Klammern (2 + 3) * 4 wären es 20.
  - type: match
    question: Was ergeben diese Ausdrücke?
    pairs:
      - { left: "17 % 5", right: "2" }
      - { left: "\"5\" + 1", right: "\"51\"" }
      - { left: "\"5\" - 1", right: "4" }
      - { left: "Number(\"5\") + 1", right: "6" }
    explanation: "% liefert den Rest der Division. + mit einem String verkettet, - gibt es nur für Zahlen, deshalb wird dort umgewandelt."
  - type: find-bug
    question: Statt „Hallo Ada" erscheint „Hallo ${name}". Welche Zeile ist schuld?
    language: js
    code: |
      const name = "Ada";
      const gruss = "Hallo ${name}";
      console.log(gruss);
    bug_line: 2
    explanation: Platzhalter mit `${…}` funktionieren nur in Backticks. Richtig ist `` `Hallo ${name}` ``.
  - type: single
    question: Welcher Vergleich ist `true`?
    options: ["5 === \"5\"", "0 === false", "5 === 5", "0.1 + 0.2 === 0.3"]
    answer: 2
    explanation: === prüft Typ und Wert. 0.1 + 0.2 ergibt wegen der Gleitkomma-Darstellung 0.30000000000000004.
  - type: cloze
    text: "Nach `let a = 5; a += 3; a++;` hat a den Wert ___. Benutzereingaben sind immer vom Typ ___."
    blanks:
      - ["9"]
      - [string, String]
    explanation: a += 3 macht aus 5 eine 8, a++ erhöht auf 9. Eingaben kommen als Text an und müssen erst umgewandelt werden.
tasks:
  - id: ausgaben-vorhersagen
    type: steps
    title: Was kommt heraus?
    description: Sag voraus, was JavaScript bei diesen Ausdrücken liefert.
    steps:
      - situation: "`\"Preis: \" + 2 + 3`"
        question: Was ist das Ergebnis?
        options: ["\"Preis: 5\"", "\"Preis: 23\"", "5"]
        answer: 1
        explanation: >
          Von links nach rechts – erst wird "Preis: " + 2 zu "Preis: 2", dann + 3 zu "Preis: 23".
          Mit Klammern (2 + 3) käme 5 heraus.
      - situation: "`Math.round(2.5)` und `Math.floor(2.9)`"
        question: Welche Ergebnisse kommen heraus?
        options: ["3 und 2", "2 und 3", "3 und 3"]
        answer: 0
        explanation: Math.round rundet kaufmännisch, Math.floor rundet immer ab.
      - situation: "`10 / 0` und `\"abc\" * 2`"
        question: Was liefern die beiden Rechnungen?
        options: ["Fehler und Fehler", "Infinity und NaN", "0 und 0"]
        answer: 1
        explanation: JavaScript wirft hier keinen Fehler. Division durch 0 ergibt Infinity, eine unsinnige Rechnung ergibt NaN.
      - situation: "`5 == \"5\"` und `5 === \"5\"`"
        question: Was ergeben die beiden Vergleiche?
        options: ["true und true", "true und false", "false und false"]
        answer: 1
        explanation: == wandelt vorher um, === vergleicht Typ und Wert ohne Umwandlung.
  - id: preisschild
    type: code
    language: js
    title: Ein Preisschild aus Eingaben bauen
    description: |
      Ein Formular liefert alle Werte als **Text**: `produkt` (mit überflüssigen Leerzeichen), `mengeText` und `preisInCentText`.

      1. `name`: Produktname ohne Leerzeichen am Rand und in Großbuchstaben.
      2. `gesamtInCent`: Menge mal Preis als **Zahl** (vorher umwandeln!).
      3. `euro`: der Gesamtpreis in Euro als Text mit genau zwei Nachkommastellen (aus `2598` wird `"25.98"`).
      4. `schild`: mit einem Template-Literal der Text `"2 x KAFFEE: 25.98 €"`.
      5. `istTeuer`: `true`, wenn `gesamtInCent` größer als 2000 ist.
    starter: |
      const produkt = "  Kaffee  ";
      const mengeText = "2";
      const preisInCentText = "1299";

      const name = produkt;
      const gesamtInCent = mengeText * preisInCentText;
      const euro = gesamtInCent;
      const schild = "";
      const istTeuer = false;
    tests:
      - name: name ist bereinigt und großgeschrieben
        code: assertEqual(name, "KAFFEE")
      - name: gesamtInCent ist die Zahl 2598
        code: assertEqual(gesamtInCent, 2598)
      - name: euro hat zwei Nachkommastellen
        code: assertEqual(euro, "25.98")
      - name: schild ist korrekt zusammengesetzt
        code: 'assertEqual(schild, "2 x KAFFEE: 25.98 €")'
      - name: istTeuer ist true
        code: assertEqual(istTeuer, true)
    hints:
      - "Methoden kannst du verketten: `produkt.trim().toUpperCase()`."
      - "Umwandeln mit `Number(mengeText)`; von Cent zu Euro: `(gesamtInCent / 100).toFixed(2)`."
      - "Template-Literal: `` `${mengeText} x ${name}: ${euro} €` ``"
    solution: |
      const produkt = "  Kaffee  ";
      const mengeText = "2";
      const preisInCentText = "1299";

      const name = produkt.trim().toUpperCase();
      const gesamtInCent = Number(mengeText) * Number(preisInCentText);
      const euro = (gesamtInCent / 100).toFixed(2);
      const schild = `${mengeText} x ${name}: ${euro} €`;
      const istTeuer = gesamtInCent > 2000;
  - id: php-als-zahl
    type: code
    language: php
    title: Typumwandlung in PHP
    description: |
      In PHP bekommst du Formularwerte ebenfalls als Strings. Der Rahmen einer **Funktion** ist vorbereitet:
      Sie bekommt einen Text `$eingabe` und gibt mit `return` ein Ergebnis zurück. Funktionen lernst du im
      nächsten Modul genauer kennen – hier füllst du nur die `return`-Zeile aus.

      Ergänze `menge()` so, dass sie den Text ohne Leerzeichen am Rand (`trim`) in eine ganze Zahl (`int`)
      umwandelt. Aus `" 7 "` wird `7`, aus `""` wird `0`.
    starter: |
      <?php
      function menge(string $eingabe): int
      {
          return 0;
      }
    tests:
      - name: wandelt "7" in 7 um
        code: assert_same(7, menge("7"));
      - name: entfernt Leerzeichen
        code: assert_same(12, menge("  12 "));
      - name: leerer Text wird 0
        code: assert_same(0, menge(""));
    hints:
      - "PHP wandelt mit `(int)` um: `(int) \"7\"` ergibt `7`."
      - "Kombiniere beides: `(int) trim($eingabe)`."
    solution: |
      <?php
      function menge(string $eingabe): int
      {
          return (int) trim($eingabe);
      }
---

Du baust einen Taschenrechner. Die Nutzerin tippt 12 und 30 ein – und das Programm zeigt stolz **1230** an.
Der Grund: Eingaben kommen als Text an, und `"12" + "30"` verbindet zwei Texte. In dieser Lektion lernst du,
wie Programme rechnen, Texte bauen und Werte von einem Typ in einen anderen umwandeln.

## Rechnen mit Operatoren

Ein [[operator|Operator]] verbindet Werte zu einem neuen Wert. Code, der zu einem Wert ausgerechnet wird, heißt
[[ausdruck|Ausdruck]].

| Operator | Bedeutung | Beispiel | Ergebnis |
|---|---|---|---|
| `+ - * /` | Grundrechenarten | `7 / 2` | `3.5` |
| `%` | Rest ([[modulo]]) | `7 % 2` | `1` |
| `**` | Potenz | `2 ** 3` | `8` |
| `+=`, `-=` | ändern und speichern | `x += 5` | wie `x = x + 5` |
| `++`, `--` | um 1 erhöhen / verringern | `x++` | wie `x = x + 1` |

Es gilt „Punkt vor Strich"; Klammern gehen vor. `zahl % 2 === 0` prüft, ob eine Zahl gerade ist. Das Erhöhen
um eins heißt [[inkrement|Inkrement]].

> [!FEHLER]
> `const durchschnitt = a + b / 2;` rechnet `a + (b / 2)`. Setze Klammern, sobald du bei der Rangfolge
> unsicher bist: `(a + b) / 2`.

## Texte bauen und bearbeiten

Ein [[string|String]] steht in `"…"`, `'…'` oder Backticks. Mit `+` verbindest du Strings. Lesbarer sind
[[template-literal|Template-Literals]] in Backticks: `${…}` setzt Werte und sogar Rechnungen ein.

```js run
const artikel = 3;
const preis = 4.5;
console.log(`Du kaufst ${artikel} Artikel für ${artikel * preis} €.`);
```

Strings bringen [[methode|Methoden]] mit – Werkzeuge, die du mit einem Punkt aufrufst. Sie verändern das
Original nicht, sondern liefern einen neuen Wert:

| Methode | Beispiel | Ergebnis |
|---|---|---|
| `length` | `"Hallo".length` | `5` |
| `toUpperCase()` | `"Hallo".toUpperCase()` | `"HALLO"` |
| `trim()` | `"  Hi  ".trim()` | `"Hi"` |
| `includes(t)` | `"Hallo".includes("all")` | `true` |
| `slice(a, b)` | `"Hallo".slice(1, 3)` | `"al"` |
| `split(t)` | `"a,b".split(",")` | `["a", "b"]` |

## Zahlen runden – und die Kommazahl-Falle

`Math.round(2.5)` rundet kaufmännisch (3), `Math.floor` immer ab, `Math.ceil` immer auf. `(3.14159).toFixed(2)`
liefert den Text `"3.14"`. Ungültige Rechnungen stürzen nicht ab: `10 / 0` ergibt `Infinity`, `"abc" * 2` ergibt
[[nan|NaN]] („Not a Number").

```js run
console.log(0.1 + 0.2);   // 0.30000000000000004
```

Computer speichern Kommazahlen als [[gleitkommazahl|Gleitkommazahlen]] im Binärsystem, und 0,1 lässt sich dort
nicht exakt darstellen – wie 1/3 im Dezimalsystem. Deshalb rechnet man Geld in **Cent** als ganze Zahlen.

## Typumwandlung

Bei der [[typumwandlung|Typumwandlung]] wird ein Wert in einen anderen Typ verwandelt. Explizit machst du das
selbst, implizit tut es JavaScript automatisch:

| Ausdruck | Ergebnis | Warum |
|---|---|---|
| `Number("42")` | `42` | explizit in Zahl |
| `Number("4,2")` | `NaN` | Komma ist kein Dezimalpunkt |
| `parseInt("12px")` | `12` | liest Ziffern, solange es geht |
| `String(42)` | `"42"` | explizit in Text |
| `"5" + 1` | `"51"` | `+` mit String verkettet |
| `"5" - 1` | `4` | `-` gibt es nur für Zahlen |

Beim Vergleichen gilt dasselbe: `==` wandelt vorher um (`5 == "5"` ist `true`, `0 == ""` auch). Die
[[strikte-gleichheit|strikte Gleichheit]] `===` vergleicht Typ **und** Wert ohne Umwandlung.

> [!MERKSATZ]
> Eingaben von außen sind Strings – wandle sie mit `Number()` um, bevor du rechnest. Und vergleiche immer mit
> `===` und `!==`, nie mit `==`.

In PHP verkettest du mit `.` statt `+` und wandelst mit `(int)`, `(float)` oder `(string)` um:
`$menge = (int) trim(" 12 ");`. Auch dort gilt: `===` statt `==`.

> [!PRAXIS]
> Shops speichern Beträge fast immer als ganze Cent-Werte, und Typfehler gehören zu den häufigsten Bugs in
> Formularen – vom Warenkorb mit „1230 €" bis zur Prüfung mit `==`, die sich austricksen lässt.

## Zusammenfassung

- Operatoren: `+ - * / % **`, Kurzformen `+=` und `++`; Klammern machen die Rangfolge eindeutig.
- **Template-Literals** setzen mit `${…}` Werte in Text ein; String-**Methoden** liefern neue Werte.
- `Math.round/floor/ceil` und `toFixed` runden; ungültige Rechnungen ergeben `NaN` oder `Infinity`.
- Kommazahlen sind ungenau – Geld in Cent rechnen.
- Eingaben sind Strings: mit `Number()` umwandeln; `"5" + 1` ergibt `"51"`.
- Immer `===` statt `==` – in JavaScript und PHP.
