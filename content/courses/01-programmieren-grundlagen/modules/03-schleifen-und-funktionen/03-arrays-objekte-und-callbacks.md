---
title: Arrays, Objekte und Callbacks
summary: Mit Arrays und Objekten sicher arbeiten, Arrow Functions als Callbacks übergeben und Daten mit map, filter und reduce umformen – plus Destrukturierung und Spread.
duration: 25
sources:
  - title: MDN – Arrow function expressions
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions
  - title: MDN – Array (map, filter, reduce)
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
  - title: MDN – Destructuring
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring
  - title: MDN – Spread syntax
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
quiz:
  - type: match
    question: Was liefern diese Aufrufe für `const z = [1, 2, 3, 4];`?
    pairs:
      - { left: "z.map((x) => x * 10)", right: "[10, 20, 30, 40]" }
      - { left: "z.filter((x) => x % 2 === 0)", right: "[2, 4]" }
      - { left: "z.reduce((summe, x) => summe + x, 0)", right: "10" }
      - { left: "z.find((x) => x > 2)", right: "3" }
    explanation: map wandelt jedes Element um, filter siebt aus, reduce fasst zusammen, find liefert das erste passende Element.
  - type: single
    question: "Was gibt der Code aus? `const a = [1, 2]; const b = a; b.push(3); console.log(a);`"
    options: ["[1, 2]", "[1, 2, 3]", "Einen Fehler, weil a mit const angelegt ist"]
    answer: 1
    explanation: b ist keine Kopie, sondern eine zweite Referenz auf dasselbe Array. const verhindert nur eine neue Zuweisung, nicht das Verändern des Inhalts.
  - type: cloze
    text: "Mit `const { name, alter } = user;` ___ du ein Objekt. Mit `[...liste, 4]` erzeugt der ___-Operator ein neues Array."
    blanks:
      - [destrukturierst, destrukturiert, entpackst]
      - [Spread, spread]
    explanation: Destrukturierung entpackt Werte in Variablen, Spread faltet ein Array oder Objekt in ein neues auf.
  - type: find-bug
    question: "`verdoppelt` soll `[2, 4, 6]` sein, ist aber `[undefined, undefined, undefined]`. Welche Zeile ist falsch?"
    language: js
    code: |
      const zahlen = [1, 2, 3];
      const verdoppelt = zahlen.map((x) => {
        x * 2;
      });
      console.log(verdoppelt);
    bug_line: 3
    explanation: Mit geschweiften Klammern braucht eine Arrow Function ein return. Richtig ist `return x * 2;` oder die Kurzform `(x) => x * 2`.
tasks:
  - id: reduce-schritte
    type: order
    title: reduce Schritt für Schritt
    description: >
      `[5, 10, 20].reduce((summe, preis) => summe + preis, 0)` berechnet eine Summe. Bring die Schritte in die
      richtige Reihenfolge.
    items:
      - "Start: summe ist der Startwert 0"
      - "Erster Aufruf: 0 + 5 → summe ist 5"
      - "Zweiter Aufruf: 5 + 10 → summe ist 15"
      - "Dritter Aufruf: 15 + 20 → summe ist 35"
      - "Ergebnis: reduce gibt 35 zurück"
    hints:
      - Der zweite Parameter von reduce ist der Startwert des Akkumulators.
  - id: warenkorb-auswerten
    type: code
    language: js
    title: Einen Warenkorb auswerten
    description: |
      Ein Warenkorb ist ein Array von Objekten mit `name`, `preis` (in Euro) und `menge`. Schreibe die Funktionen
      mit `map`, `filter` und `reduce` (keine Schleifen nötig) und verändere den übergebenen Warenkorb **nicht**:

      1. `namen(korb)` liefert ein Array aller Namen.
      2. `teure(korb)` liefert nur die Artikel mit einem Preis über 10 €.
      3. `summe(korb)` liefert die Gesamtsumme aller `preis * menge`. Ein leerer Korb ergibt 0.
      4. `mitRabatt(artikel)` liefert eine **Kopie** des Artikels (Spread!), deren Preis um 10 % reduziert ist.
    starter: |
      function namen(korb) {
        return [];
      }

      function teure(korb) {
        return korb;
      }

      function summe(korb) {
        return 0;
      }

      function mitRabatt(artikel) {
        artikel.preis = artikel.preis * 0.9;
        return artikel;
      }
    tests:
      - name: namen liefert alle Namen
        code: 'assertDeepEqual(namen([{ name: "Tee", preis: 4, menge: 2 }, { name: "Kanne", preis: 25, menge: 1 }]), ["Tee", "Kanne"])'
      - name: teure filtert nach Preis über 10
        code: 'assertDeepEqual(teure([{ name: "Tee", preis: 4, menge: 2 }, { name: "Kanne", preis: 25, menge: 1 }]), [{ name: "Kanne", preis: 25, menge: 1 }])'
      - name: summe rechnet preis mal menge
        code: 'assertEqual(summe([{ name: "Tee", preis: 4, menge: 2 }, { name: "Kanne", preis: 25, menge: 1 }]), 33)'
      - name: leerer Korb ergibt 0
        code: assertEqual(summe([]), 0)
      - name: mitRabatt verändert das Original nicht
        code: 'const a = { name: "Kanne", preis: 20, menge: 1 }; const b = mitRabatt(a); assertTrue(b.preis === 18 && a.preis === 20 && b.name === "Kanne")'
    hints:
      - "`korb.map((artikel) => artikel.name)`"
      - "`korb.reduce((s, a) => s + a.preis * a.menge, 0)` – der Startwert 0 ist für den leeren Korb wichtig."
      - "Kopie mit geändertem Preis: `{ ...artikel, preis: artikel.preis * 0.9 }`"
    solution: |
      function namen(korb) {
        return korb.map((artikel) => artikel.name);
      }

      function teure(korb) {
        return korb.filter((artikel) => artikel.preis > 10);
      }

      function summe(korb) {
        return korb.reduce((s, artikel) => s + artikel.preis * artikel.menge, 0);
      }

      function mitRabatt(artikel) {
        return { ...artikel, preis: artikel.preis * 0.9 };
      }
---

Ein Online-Shop zeigt eine Produktliste: nur die verfügbaren Artikel, mit Preis inklusive Steuer, und darunter
die Gesamtsumme. Mit Schleifen geht das, aber JavaScript hat dafür elegantere Werkzeuge. Sie beruhen auf einer
überraschenden Idee: Funktionen sind Werte, die man weitergeben kann.

## Arrays und Objekte im Alltag

Die wichtigsten Array-Methoden auf einen Blick:

| Methode | Wirkung | Verändert das Array? |
|---|---|---|
| `push(x)` / `pop()` | hinten anhängen / entfernen | ja |
| `includes(x)` | enthält das Array `x`? | nein |
| `indexOf(x)` | Index von `x` oder `-1` | nein |
| `slice(a, b)` | Ausschnitt als neues Array | nein |

Objekte liest du mit Punkt- oder Klammernotation. Die Klammer brauchst du, wenn der Schlüssel in einer Variablen
steht. Jeder Eintrag ist eine [[eigenschaft|Eigenschaft]]:

```js run
const user = { name: "Ada", adresse: { stadt: "Berlin" } };
const feld = "name";
console.log(user.adresse.stadt, user[feld]);   // Berlin Ada
console.log(Object.keys(user));                 // ["name", "adresse"]
```

## Kopie oder Referenz?

Zahlen und Strings werden beim Zuweisen kopiert. Arrays und Objekte nicht: Eine zweite Variable ist nur eine
weitere [[referenz|Referenz]] auf **dasselbe** Objekt.

```js run
const a = [1, 2];
const b = a;        // keine Kopie!
b.push(3);
console.log(a);     // [1, 2, 3]
const c = [...a];   // echte (flache) Kopie mit Spread
c.push(4);
console.log(a, c);  // [1, 2, 3] [1, 2, 3, 4]
```

> [!FEHLER]
> „`const` macht mein Array unveränderlich." Falsch: `const` verhindert nur, dass die Variable auf etwas anderes
> zeigt. Der Inhalt eines Arrays oder Objekts lässt sich trotzdem ändern.

## Arrow Functions und Callbacks

Eine [[arrow-function|Arrow Function]] ist eine Kurzschreibweise für Funktionen. Besteht der Körper nur aus einem
Ausdruck, wird er automatisch zurückgegeben:

```js run
const quadrat = (x) => x * x;
console.log(quadrat(5));   // 25
```

Sie ist gleichwertig zu `function quadrat(x) { return x * x; }`. Brauchst du mehrere Anweisungen, setzt du
geschweifte Klammern – dann musst du `return` aber wieder selbst schreiben.

Funktionen sind Werte – du kannst sie anderen Funktionen übergeben. Eine so übergebene Funktion heißt
[[callback|Callback]]; die empfangende Funktion ist eine [[higher-order-funktion|Higher-Order-Funktion]]. Sie
entscheidet, wann und wie oft sie den Callback aufruft. Stell dir einen Fotografen vor, dem du eine Anleitung
gibst: „Bei jedem Gast: lächeln lassen und abdrücken." Er kümmert sich um die Gästeliste, deine Anleitung
um das Detail. Genau so arbeitet `forEach` – es ruft deinen Callback für jedes Element einmal auf:

```js run
const namen = ["Ada", "Grace"];
namen.forEach((name) => console.log(`Hallo ${name}`));
setTimeout(() => console.log("eine Sekunde später"), 1000);
```

## map, filter und reduce

Diese drei Methoden ([[map-filter-reduce]]) ersetzen viele Schleifen. Keine von ihnen verändert das Original.

```js run
const preise = [8, 25, 12, 4];

const brutto = preise.map((p) => p * 1.19);        // jedes Element umwandeln
const teure = preise.filter((p) => p > 10);        // nur passende behalten
const summe = preise.reduce((s, p) => s + p, 0);   // zu einem Wert zusammenfassen

console.log(brutto, teure, summe);
```

Bei `reduce` bekommt der Callback den bisherigen Zwischenstand (Akkumulator) und das nächste Element. Der zweite
Parameter, hier `0`, ist der Startwert. Verwandte Methoden: `find` (erstes passendes Element), `some` und `every`
(trifft es auf eins bzw. alle zu?). In PHP heißen die Gegenstücke `array_map` und `array_filter`.

> [!MERKSATZ]
> `map` → gleich viele Elemente, umgewandelt. `filter` → weniger Elemente, unverändert. `reduce` → ein einziger Wert.

## Destrukturierung und Spread

[[destrukturierung|Destrukturierung]] entpackt Werte direkt in Variablen. Der [[spread-operator|Spread-Operator]]
`...` faltet Arrays und Objekte in neue auf:

```js run
const user = { name: "Ada", alter: 36, stadt: "Berlin" };
const { name, alter } = user;                     // Objekt entpacken
const [erstes, zweites] = ["rot", "grün", "blau"]; // Array nach Position
const aelter = { ...user, alter: 37 };            // Kopie mit Änderung
console.log(name, alter, erstes, aelter.alter, user.alter);
```

> [!PRAXIS]
> In modernem JavaScript – besonders in React – sind `map`, `filter`, Destrukturierung und Spread allgegenwärtig.
> Daten werden dort fast nie verändert, sondern immer als neue Kopie erzeugt.

## Zusammenfassung

- Array-Methoden wie `push` verändern das Array, `includes`, `slice` und Co. nicht.
- Arrays und Objekte werden als **Referenz** weitergegeben; Kopien erzeugst du mit Spread.
- **Arrow Functions** sind kurze Funktionen; übergebene Funktionen heißen **Callbacks**.
- `map` wandelt um, `filter` siebt aus, `reduce` fasst zusammen – ohne das Original zu ändern.
- **Destrukturierung** entpackt Werte, **Spread** `...` erzeugt neue Arrays und Objekte.
