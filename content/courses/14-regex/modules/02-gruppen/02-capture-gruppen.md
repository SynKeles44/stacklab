---
title: Capture-Gruppen, benannte Gruppen und Rückverweise
summary: Gruppen merken sich ihren Treffer. So holst du Jahr, Monat und Tag aus einem Datum, gibst Gruppen sprechende Namen und findest doppelte Wörter mit Rückverweisen.
duration: 25
sources:
  - title: MDN – Gruppen und Rückverweise
    url: https://developer.mozilla.org/de/docs/Web/JavaScript/Guide/Regular_expressions/Groups_and_backreferences
  - title: MDN – Benannte Capture-Gruppen
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Named_capturing_group
  - title: PHP-Handbuch – Rückverweise
    url: https://www.php.net/manual/de/regexp.reference.back-references.php
quiz:
  - type: single
    question: "Welche Nummer hat die Gruppe `(\\d{2})` im Muster `(\\d{4})-(?:Q)(\\d)-(\\d{2})`?"
    options: ["1", "2", "3", "4"]
    answer: 2
    explanation: "Gezählt werden nur erfassende Gruppen, in der Reihenfolge ihrer öffnenden Klammern: `(\\d{4})` ist 1, `(\\d)` ist 2, `(\\d{2})` ist 3. `(?:Q)` zählt nicht mit."
  - type: match
    question: "Das Muster `/^(\\d{4})-(\\d{2})-(\\d{2})$/` wird auf `2026-10-09` angewendet. Was steckt wo?"
    pairs:
      - { left: "match[0]", right: "2026-10-09" }
      - { left: "match[1]", right: "2026" }
      - { left: "match[2]", right: "10" }
      - { left: "match[3]", right: "09" }
    explanation: Index 0 ist immer der gesamte Treffer, ab Index 1 folgen die Gruppen in der Reihenfolge ihrer öffnenden Klammern.
  - type: multiple
    question: "Wo findet `/\\b(\\w+) \\1\\b/` einen Treffer?"
    options: ["das das", "der Ball ball", "nein nein!", "so so so", "ja, ja"]
    answers: [0, 2, 3]
    explanation: "`\\1` verlangt **denselben Text** wie Gruppe 1. „Ball ball“ unterscheidet sich in der Groß-/Kleinschreibung, „ja, ja“ hat ein Komma zwischen den Wörtern."
  - type: cloze
    text: "Eine benannte Gruppe schreibst du in JavaScript und PHP als `(?___jahr>\\d{4})`. In JavaScript liest du sie über `match.___.jahr`."
    blanks:
      - ["<"]
      - [groups]
    explanation: "`(?<name>…)` vergibt den Namen, `match.groups.name` liefert den Text. In PHP steht er in `$matches['name']`."
tasks:
  - id: anatomie-beschriften
    type: diagram
    title: Beschrifte die Bausteine eines Musters
    description: |
      Das Muster `^(?<jahr>\d{4})-[01]\d$` prüft Jahr und Monat wie `2026-07`. Ordne jedem leeren Feld den
      richtigen Fachbegriff zu. Das zweite „Anker“-Feld ist schon beschriftet.
    image: /assets/regex/anatomie-leer.svg
    slots:
      - { x: 37.7, y: 7.6, answer: benannte Gruppe }
      - { x: 12.7, y: 58.2, answer: Anker }
      - { x: 42, y: 58.2, answer: Kurzschreibweise }
      - { x: 62.7, y: 58.2, answer: Literal }
      - { x: 50.7, y: 81.8, answer: Quantor }
      - { x: 71.3, y: 81.8, answer: Zeichenklasse }
    distractors: [Alternation, Rückverweis, Flag]
    hints:
      - "`{4}` sagt, wie oft – `[01]` sagt, welche Zeichen erlaubt sind."
  - id: datum-zerlegen
    type: code
    language: js
    title: Ein Datum mit benannten Gruppen zerlegen
    description: |
      Schreibe `parseDatum(text)`. Die Funktion erwartet ein deutsches Datum im Format `TT.MM.JJJJ` – der
      ganze Text muss passen. Tag und Monat haben genau zwei Ziffern, das Jahr genau vier.

      - Passt der Text, gibt sie ein Objekt mit **Zahlen** zurück: `{ tag: 9, monat: 10, jahr: 2026 }`.
      - Passt er nicht, gibt sie `null` zurück.

      Nutze **benannte Gruppen** und `text.match(muster)`. Ob es den 31.02. gibt, musst du hier nicht prüfen.
    starter: |
      function parseDatum(text) {
        const muster = /^(\d{2})\.(\d{2})\.(\d{4})$/;
        const treffer = text.match(muster);
        // Tipp: treffer.groups gibt es nur bei benannten Gruppen
        return null;
      }
    tests:
      - name: Ein gültiges Datum wird zerlegt
        code: |
          assertDeepEqual(parseDatum("09.10.2026"), { tag: 9, monat: 10, jahr: 2026 })
      - name: Die Werte sind Zahlen, keine Strings
        code: assertEqual(typeof parseDatum("01.01.1999").tag, "number")
      - name: Falsches Format liefert null
        code: |
          assertEqual(parseDatum("2026-10-09"), null)
          assertEqual(parseDatum("9.10.2026"), null)
          assertEqual(parseDatum("09.10.26"), null)
      - name: Leerer Text und Zusatztext liefern null
        code: |
          assertEqual(parseDatum(""), null)
          assertEqual(parseDatum("am 09.10.2026"), null)
    hints:
      - "Gib den Gruppen Namen: `(?<tag>\\d{2})`, `(?<monat>\\d{2})`, `(?<jahr>\\d{4})`."
      - "Prüfe zuerst `if (!treffer) return null;` – `match()` liefert ohne Treffer `null`."
      - "Aus `\"09\"` wird mit `Number(\"09\")` die Zahl 9."
    solution: |
      ```js
      function parseDatum(text) {
        const muster = /^(?<tag>\d{2})\.(?<monat>\d{2})\.(?<jahr>\d{4})$/;
        const treffer = text.match(muster);
        if (!treffer) return null;
        const { tag, monat, jahr } = treffer.groups;
        return { tag: Number(tag), monat: Number(monat), jahr: Number(jahr) };
      }
      ```
---
Ein Text sagt `Lieferung am 2026-10-09`. Du willst nicht nur wissen, **ob** dort ein Datum steht, sondern auch
**welches** – Jahr, Monat und Tag einzeln, um daraus „9. Oktober 2026“ zu machen. Dafür merken sich Gruppen
ihren Treffer.

## Capture-Gruppen: Gruppen mit Gedächtnis

Jede normale runde Klammer ist eine [[capture-gruppe|Capture-Gruppe]] (erfassende Gruppe). Passt das
Muster, speichert die Engine für jede Gruppe den Text, den sie getroffen hat.

```js run
const muster = /(\d{4})-(\d{2})-(\d{2})/;
const treffer = "Lieferung am 2026-10-09".match(muster);
console.log(treffer[0]);   // "2026-10-09" – der gesamte Treffer
console.log(treffer[1]);   // "2026"
console.log(treffer[2]);   // "10"
console.log(treffer[3]);   // "09"
```

Ohne Treffer liefert `match()` den Wert `null`. Prüfe das immer, bevor du auf `treffer[1]` zugreifst.

> [!MERKSATZ]
> Index 0 ist der **gesamte** Treffer. Ab Index 1 kommen die Gruppen – nummeriert nach der Reihenfolge
> ihrer **öffnenden** Klammern.

## Nummerierung bei verschachtelten Gruppen

Bei verschachtelten Klammern zählst du einfach die öffnenden Klammern von links:

```text
 ( ( \d{4} ) - ( \d{2} ) )
 1   2           3
```

| Muster | Gruppe 1 | Gruppe 2 | Gruppe 3 |
|---|---|---|---|
| `((\d{4})-(\d{2}))` | `2026-10` | `2026` | `10` |
| `(?:\d{4})-(\d{2})` | `10` | – | – |

Nicht-erfassende Gruppen `(?:…)` bekommen **keine** Nummer. Wird eine Gruppe übersprungen – etwa eine
optionale `(\d)?` ohne Treffer –, steht an ihrer Stelle `undefined`.

## Benannte Gruppen

Nummern sind fehleranfällig: Fügst du vorn eine Gruppe ein, verschieben sich alle anderen. Besser sind
[[benannte-gruppe|benannte Gruppen]]:

```js run
const muster = /(?<jahr>\d{4})-(?<monat>\d{2})-(?<tag>\d{2})/;
const { groups } = "Lieferung am 2026-10-09".match(muster);
console.log(groups.jahr, groups.monat, groups.tag);   // 2026 10 09
```

![Aufbau eines Musters mit benannter Gruppe, Kurzschreibweise, Quantor, Literal, Zeichenklasse und Ankern](/assets/regex/anatomie.svg)

Die Schreibweise `(?<name>…)` funktioniert in JavaScript und PHP gleich. In PHP landet der Name als
Schlüssel im Treffer-Array, also `$matches['jahr']`.

> [!PRAXIS]
> In gewachsenen Projekten findest du oft Code wie `$m[4]` – niemand weiß mehr, was Gruppe 4 war.
> Benannte Gruppen dokumentieren das Muster gleich mit und überleben Umbauten.

## Rückverweise: denselben Text noch einmal

Ein [[rueckverweis|Rückverweis]] verlangt, dass an einer späteren Stelle **genau derselbe Text** steht, den
eine Gruppe vorher getroffen hat. `\1` verweist auf Gruppe 1, `\k<name>` auf eine benannte Gruppe.

```js run
const doppelt = /\b(\w+) \1\b/;
console.log("Das ist ist falsch".match(doppelt)[0]);   // "ist ist"
console.log(doppelt.test("Das ist richtig"));          // false
```

Typische Einsätze:

| Aufgabe | Muster |
|---|---|
| doppelte Wörter | `\b(\w+) \1\b` |
| gleiches Anführungszeichen vorn und hinten | `(["'])(.*?)\1` |
| HTML-artiges Paar wie `<b>…</b>` | `<(\w+)>.*?</\1>` |

> [!FEHLER]
> **Rückverweis mit Gruppe verwechseln.** `(\d)\1` passt auf „77“, aber nicht auf „78“: Der Rückverweis
> wiederholt den **getroffenen Text**, nicht das Muster. Willst du zwei beliebige Ziffern, schreibst du
> `\d{2}` oder `(\d)\d`.

## Wenn eine Gruppe nichts trifft

Gruppen können optional sein. Dann passt das Muster, obwohl eine Gruppe **keinen** Text getroffen hat:

```js run
const tel = /^(\+49 )?(\d+)$/;
console.log("+49 1512345".match(tel));   // [ '+49 1512345', '+49 ', '1512345' ]
console.log("1512345".match(tel));       // [ '1512345', undefined, '1512345' ]
```

In JavaScript steht für die leere Gruppe `undefined`. PHP liefert standardmäßig einen leeren String – mit
dem Flag `PREG_UNMATCHED_AS_NULL` stattdessen `null`. Prüfe optionale Gruppen deshalb immer, bevor du
mit ihrem Inhalt rechnest, zum Beispiel mit `treffer[1] ?? ""`.

| Gruppe hat getroffen | JavaScript | PHP |
|---|---|---|
| ja | der Text | der Text |
| nein (optional) | `undefined` | `""` bzw. `null` mit Flag |

## Gruppen beim Ersetzen nutzen

Richtig stark werden Gruppen beim Ersetzen: Du baust den Text aus seinen eigenen Teilen neu zusammen.
`$1` steht für Gruppe 1, `$<name>` für eine benannte Gruppe.

```js run
const iso = "2026-10-09";
console.log(iso.replace(/(\d{4})-(\d{2})-(\d{2})/, "$3.$2.$1"));   // "09.10.2026"
console.log(iso.replace(/(?<j>\d{4})-(?<m>\d{2})-(?<t>\d{2})/, "$<t>.$<m>.$<j>"));
```

Wie `replace()` in JavaScript und `preg_replace()` in PHP im Detail funktionieren, lernst du in Modul 3.

## Zusammenfassung

- Jede normale Klammer ist eine **Capture-Gruppe** und merkt sich ihren Treffer.
- `match[0]` ist der gesamte Treffer, `match[1]` usw. sind die Gruppen nach öffnender Klammer.
- `(?<name>…)` vergibt Namen; du liest sie über `match.groups.name` bzw. `$matches['name']`.
- `\1` und `\k<name>` sind **Rückverweise** – sie verlangen denselben Text noch einmal.
- Beim Ersetzen baust du mit `$1` oder `$<name>` Texte aus ihren eigenen Teilen neu.
