---
title: Array-Methoden und Unveränderlichkeit
summary: Die passende Array-Methode für jede Aufgabe, reduce und Object.groupBy zum Gruppieren, die nicht verändernden Varianten toSorted & Co. und unveränderliche Updates von verschachtelten Daten.
duration: 25
sources:
  - title: MDN – Array
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
  - title: MDN – Array.prototype.toSorted()
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted
  - title: MDN – Object.groupBy()
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy
  - title: MDN – structuredClone()
    url: https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone
quiz:
  - type: match
    question: "Was liefern diese Aufrufe für `const n = [3, 8, 1, 8];`?"
    pairs:
      - { left: "n.find((x) => x > 2)", right: "3" }
      - { left: "n.findIndex((x) => x === 8)", right: "1" }
      - { left: "n.some((x) => x > 7)", right: "true" }
      - { left: "n.every((x) => x > 1)", right: "false" }
    explanation: find liefert das erste passende Element, findIndex dessen Position, some prüft „mindestens eins“, every „alle“.
  - type: single
    question: "`const a = [3, 1, 2]; const b = a.sort();` – welche Aussage stimmt danach?"
    options:
      - "a ist [3, 1, 2], b ist [1, 2, 3]"
      - "a und b sind beide [1, 2, 3] und zeigen auf dasselbe Array"
      - "b ist undefined"
    answer: 1
    explanation: "`sort` sortiert das Array an Ort und Stelle und gibt dasselbe Array zurück. Ohne Veränderung des Originals geht es mit `toSorted()`."
  - type: single
    question: "Was ergibt `[10, 9, 1].toSorted()`?"
    options: ["[1, 9, 10]", "[1, 10, 9]", "[10, 9, 1]"]
    answer: 1
    explanation: "Ohne Vergleichsfunktion wird als Text sortiert: \"1\" < \"10\" < \"9\". Für Zahlen brauchst du `toSorted((a, b) => a - b)`."
  - type: cloze
    text: "Eine Kopie, die auch verschachtelte Objekte neu anlegt, heißt ___ Kopie. Im Browser und in Node.js erzeugst du sie mit ___()."
    blanks:
      - [tiefe]
      - [structuredClone]
    explanation: Spread erzeugt nur eine flache Kopie. structuredClone kopiert die gesamte Struktur.
  - type: find-bug
    question: Die Funktion soll ein Array mit geänderter Aufgabe liefern, ohne das Original zu verändern. Welche Zeile verletzt das?
    language: js
    code: |
      function erledige(aufgaben, id) {
        const kopie = [...aufgaben];
        const aufgabe = kopie.find((a) => a.id === id);
        aufgabe.erledigt = true;
        return kopie;
      }
    bug_line: 4
    explanation: "Das Array ist kopiert, die Objekte darin aber nicht. Zeile 4 verändert das Objekt, das auch im Original steckt. Richtig: `aufgaben.map((a) => a.id === id ? { ...a, erledigt: true } : a)`."
tasks:
  - id: bestellungen-auswerten
    type: code
    language: js
    title: Bestellungen auswerten – ohne Mutation
    description: |
      Eine Bestellung ist ein Objekt wie `{ id: 1, kunde: "Ada", summe: 40, status: "offen" }`. Schreibe vier
      Funktionen, die das übergebene Array **niemals verändern**:

      1. `umsatzProKunde(bestellungen)` liefert ein Objekt wie `{ Ada: 70, Linus: 15 }` mit der Summe aller
         Bestellungen je Kunde.
      2. `teuerste(bestellungen, anzahl)` liefert die `anzahl` Bestellungen mit der höchsten Summe, absteigend sortiert.
      3. `markiereVersendet(bestellungen, id)` liefert ein **neues** Array, in dem die Bestellung mit der `id`
         den Status `"versendet"` hat. Alle anderen Objekte bleiben dieselben Objekte.
      4. `alleBezahlt(bestellungen)` liefert `true`, wenn keine Bestellung den Status `"offen"` hat. Für ein
         leeres Array ist das Ergebnis `true`.
    starter: |
      function umsatzProKunde(bestellungen) {
        return {};
      }

      function teuerste(bestellungen, anzahl) {
        return bestellungen.sort((a, b) => b.summe - a.summe).slice(0, anzahl);
      }

      function markiereVersendet(bestellungen, id) {
        const b = bestellungen.find((x) => x.id === id);
        b.status = "versendet";
        return bestellungen;
      }

      function alleBezahlt(bestellungen) {
        return false;
      }
    tests:
      - name: Umsatz je Kunde
        code: 'const d = [{ id: 1, kunde: "Ada", summe: 40, status: "offen" }, { id: 2, kunde: "Linus", summe: 15, status: "bezahlt" }, { id: 3, kunde: "Ada", summe: 30, status: "bezahlt" }]; assertDeepEqual(umsatzProKunde(d), { Ada: 70, Linus: 15 }); assertDeepEqual(umsatzProKunde([]), {})'
      - name: teuerste sortiert absteigend und lässt das Original in Ruhe
        code: 'const d = [{ id: 1, summe: 40 }, { id: 2, summe: 15 }, { id: 3, summe: 90 }]; assertDeepEqual(teuerste(d, 2).map((b) => b.id), [3, 1]); assertDeepEqual(d.map((b) => b.id), [1, 2, 3])'
      - name: markiereVersendet erzeugt ein neues Array
        code: 'const d = [{ id: 1, status: "offen" }, { id: 2, status: "offen" }]; const neu = markiereVersendet(d, 2); assertTrue(neu !== d); assertEqual(neu[1].status, "versendet"); assertEqual(d[1].status, "offen"); assertTrue(neu[0] === d[0])'
      - name: alleBezahlt mit Randfällen
        code: 'assertTrue(alleBezahlt([])); assertTrue(alleBezahlt([{ status: "bezahlt" }, { status: "versendet" }])); assertEqual(alleBezahlt([{ status: "bezahlt" }, { status: "offen" }]), false)'
    hints:
      - "`reduce` mit Startwert `{}`: `(acc, b) => ({ ...acc, [b.kunde]: (acc[b.kunde] ?? 0) + b.summe })`."
      - "`toSorted((a, b) => b.summe - a.summe).slice(0, anzahl)` – toSorted lässt das Original unverändert."
      - "`map` mit Bedingung: nur die passende Bestellung wird mit Spread kopiert, alle anderen gibst du unverändert zurück. Für alleBezahlt passt `every`."
    solution: |
      function umsatzProKunde(bestellungen) {
        return bestellungen.reduce(
          (umsatz, b) => ({ ...umsatz, [b.kunde]: (umsatz[b.kunde] ?? 0) + b.summe }),
          {},
        );
      }

      function teuerste(bestellungen, anzahl) {
        return bestellungen.toSorted((a, b) => b.summe - a.summe).slice(0, anzahl);
      }

      function markiereVersendet(bestellungen, id) {
        return bestellungen.map((b) => (b.id === id ? { ...b, status: "versendet" } : b));
      }

      function alleBezahlt(bestellungen) {
        return bestellungen.every((b) => b.status !== "offen");
      }
  - id: mutierend-oder-nicht
    type: dragdrop
    title: Verändert die Methode das Original?
    description: Ordne jede Array-Methode zu. Bei einigen gibt es ein Gegenstück aus der anderen Gruppe.
    targets:
      - { id: mutiert, label: "Verändert das Array selbst" }
      - { id: neu, label: "Lässt das Original unverändert" }
    items:
      - { label: "sort()", target: mutiert }
      - { label: "reverse()", target: mutiert }
      - { label: "splice()", target: mutiert }
      - { label: "push()", target: mutiert }
      - { label: "toSorted()", target: neu }
      - { label: "toReversed()", target: neu }
      - { label: "toSpliced()", target: neu }
      - { label: "with()", target: neu }
      - { label: "map()", target: neu }
    hints:
      - Die Methoden mit dem Präfix to… und with() wurden 2023 genau als nicht verändernde Gegenstücke eingeführt.
---
Du baust eine Aufgabenliste. Der Nutzer hakt eine Aufgabe ab, und du änderst `aufgabe.erledigt = true`. Die
Anzeige aktualisiert sich aber nicht, und an einer ganz anderen Stelle zeigt plötzlich eine „alte“ Liste
denselben Haken. Der Grund: Mehrere Teile des Programms teilen sich dasselbe Objekt. In dieser Lektion
lernst du, Daten umzuformen, ohne sie zu verändern.

## Die richtige Methode für jede Frage

[[map-filter-reduce|map, filter und reduce]] kennst du schon. Für viele Fragen gibt es aber eine passendere
Methode, die schneller lesbar ist und früher aufhört:

| Frage | Methode | Ergebnis |
|---|---|---|
| Jedes Element umwandeln | `map` | neues Array, gleiche Länge |
| Nur passende behalten | `filter` | neues Array |
| Das erste passende Element | `find` / `findLast` | Element oder `undefined` |
| Seine Position | `findIndex` / `findLastIndex` | Zahl oder `-1` |
| Gibt es mindestens eins? | `some` | `true` / `false` |
| Passen alle? | `every` | `true` / `false` (leeres Array: `true`) |
| Umwandeln und flach machen | `flatMap` | neues Array |
| Zu einem Wert zusammenfassen | `reduce` | beliebiger Wert |

```js run
const kurse = [
  { titel: "Git", tags: ["tools"], minuten: 300 },
  { titel: "JavaScript", tags: ["frontend", "sprache"], minuten: 290 },
];
console.log(kurse.some((k) => k.minuten > 295));    // true
console.log(kurse.flatMap((k) => k.tags));           // ["tools", "frontend", "sprache"]
console.log(kurse.find((k) => k.titel === "PHP"));   // undefined
```

`find`, `some` und `every` brechen ab, sobald das Ergebnis feststeht. Ein `filter(…).length > 0` prüft
dagegen immer alle Elemente.

## Gruppieren und Zählen

`reduce` fasst ein Array zu **einem** Wert zusammen – das kann auch ein Objekt sein. So zählst du etwa, wie
oft jedes Wort vorkommt:

```js run
const woerter = ["js", "css", "js", "html", "js"];
const anzahl = woerter.reduce((zaehler, wort) => {
  zaehler[wort] = (zaehler[wort] ?? 0) + 1;   // Akkumulator ist ein neues, eigenes Objekt
  return zaehler;
}, {});
console.log(anzahl);   // { js: 3, css: 1, html: 1 }
```

Für das häufige Gruppieren gibt es seit 2024 eine fertige Funktion: `Object.groupBy(array, fn)`. Die
Funktion liefert für jedes Element den Gruppennamen.

```js run
const aufgaben = [
  { titel: "Einkaufen", erledigt: true },
  { titel: "Lernen", erledigt: false },
  { titel: "Sport", erledigt: false },
];
const gruppen = Object.groupBy(aufgaben, (a) => (a.erledigt ? "fertig" : "offen"));
console.log(gruppen.offen.length, gruppen.fertig.length);   // 2 1
```

> [!MERKSATZ]
> Gib `reduce` immer einen Startwert mit. Ohne Startwert wirft `reduce` bei einem leeren Array einen Fehler.

## Verändernd oder nicht?

Einige Array-Methoden verändern das Array selbst – man sagt, sie [[mutation|mutieren]] es. Das ist
gefährlich, wenn andere Teile des Programms dasselbe Array benutzen. Seit ES2023 gibt es für die
wichtigsten Fälle ein nicht veränderndes Gegenstück:

| Verändert das Original | Liefert eine Kopie |
|---|---|
| `sort(fn)` | `toSorted(fn)` |
| `reverse()` | `toReversed()` |
| `splice(start, n, …neu)` | `toSpliced(start, n, …neu)` |
| `liste[i] = wert` | `liste.with(i, wert)` |
| `push(x)` | `[...liste, x]` |

```js run
const preise = [30, 5, 12];
const sortiert = preise.toSorted((a, b) => a - b);
console.log(sortiert, preise);   // [5, 12, 30] [30, 5, 12]
console.log(preise.with(1, 7));  // [30, 7, 12]
```

> [!FEHLER]
> `sort()` ohne Vergleichsfunktion sortiert **als Text**: `[10, 9, 1]` wird zu `[1, 10, 9]`. Für Zahlen
> schreibst du immer `(a, b) => a - b`.

## Unveränderliche Updates

[[immutabilitaet|Unveränderlichkeit]] (englisch *immutability*) heißt: Statt Daten zu ändern, erzeugst du eine
neue Version. Weil Arrays und Objekte als [[referenz|Referenz]] weitergegeben werden, musst du dabei jede Ebene
kopieren, die sich ändert:

```js run
const zustand = { nutzer: { name: "Ada", ort: "Berlin" }, aufgaben: [{ id: 1, erledigt: false }] };

const neu = {
  ...zustand,
  nutzer: { ...zustand.nutzer, ort: "Hamburg" },                     // geänderte Ebene kopieren
  aufgaben: zustand.aufgaben.map((a) => (a.id === 1 ? { ...a, erledigt: true } : a)),
};
console.log(zustand.nutzer.ort, neu.nutzer.ort);   // Berlin Hamburg
```

Spread erzeugt eine [[flache-kopie|flache Kopie]]: Nur die oberste Ebene ist neu. Brauchst du eine komplett
unabhängige [[tiefe-kopie|tiefe Kopie]], nutze `structuredClone(objekt)`. `Object.freeze(objekt)` verhindert
Änderungen – aber ebenfalls nur auf der obersten Ebene.

> [!PRAXIS]
> React und viele andere Bibliotheken erkennen Änderungen daran, dass ein **neues** Objekt entsteht.
> Wer `zustand.liste.push(x)` schreibt, wundert sich, warum die Oberfläche nicht neu zeichnet. Unveränderliche
> Updates sind deshalb im Frontend Pflicht.

## Zusammenfassung

- Wähle die Methode nach der Frage: `find`, `some`, `every`, `flatMap` sind oft klarer als `filter` oder Schleifen.
- `reduce` fasst zu einem Wert zusammen – immer mit Startwert; `Object.groupBy` gruppiert direkt.
- `sort`, `reverse`, `splice` und `push` verändern das Original; `toSorted`, `toReversed`, `toSpliced` und `with` nicht.
- `sort` ohne Vergleichsfunktion sortiert als Text.
- Unveränderliche Updates kopieren jede geänderte Ebene mit Spread; `structuredClone` erzeugt eine tiefe Kopie.
- `Object.freeze` und Spread wirken nur flach.
