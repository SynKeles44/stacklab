---
title: Bedingungen und Logik
summary: Programme treffen Entscheidungen – mit Vergleichen, if/else, UND/ODER/NICHT, truthy und falsy, dem ternären Operator und switch.
duration: 25
sources:
  - title: MDN – if...else
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/if...else
  - title: MDN – Falsy (Glossar)
    url: https://developer.mozilla.org/en-US/docs/Glossary/Falsy
  - title: MDN – Nullish coalescing operator (??)
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing
  - title: MDN – switch
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch
  - title: PHP-Handbuch – match
    url: https://www.php.net/manual/de/control-structures.match.php
quiz:
  - type: single
    question: "Was gibt der Code bei `temperatur = 25` aus? `if (temperatur > 30) { console.log(\"heiß\"); } else if (temperatur > 20) { console.log(\"warm\"); } else { console.log(\"kühl\"); }`"
    options: [heiß, warm, kühl, "warm und kühl"]
    answer: 1
    explanation: 25 > 30 ist falsch, 25 > 20 ist wahr – also "warm". Danach werden keine weiteren Zweige mehr geprüft.
  - type: find-bug
    question: Bei 100 Punkten erscheint „Gut" statt „Perfekt". In welcher Zeile liegt der Denkfehler?
    language: js
    code: |
      const punkte = 100;
      if (punkte >= 50) {
        console.log("Gut");
      } else if (punkte === 100) {
        console.log("Perfekt");
      }
    bug_line: 2
    explanation: Die erste passende Bedingung gewinnt. 100 >= 50 ist schon wahr, der Perfekt-Zweig wird nie erreicht. Die strengere Bedingung muss zuerst geprüft werden.
  - type: multiple
    question: Welche Werte sind in JavaScript falsy?
    options: ["0", "\"0\"", "\"\"", "null", "[]", "NaN"]
    answers: [0, 2, 3, 5]
    explanation: Falsy sind false, 0, -0, 0n, "", null, undefined und NaN. Der String "0" und das leere Array [] sind truthy.
  - type: match
    question: Was ergeben diese Ausdrücke?
    pairs:
      - { left: "true && false", right: "false" }
      - { left: "true || false", right: "true" }
      - { left: "0 ?? 10", right: "0" }
      - { left: "0 || 10", right: "10" }
    explanation: "&& braucht zwei wahre Seiten, || eine. ?? ersetzt nur null und undefined, || jeden falsy-Wert – auch die 0."
  - type: find-bug
    question: Bei `farbe = "rot"` erscheint „Stopp" UND „Achtung". In welcher Zeile fehlt etwas?
    language: js
    code: |
      switch (farbe) {
        case "rot":
          console.log("Stopp");
        case "gelb":
          console.log("Achtung");
          break;
      }
    bug_line: 3
    explanation: Nach `console.log("Stopp");` fehlt `break;`. Ohne break läuft das Programm in den nächsten case weiter (Fall-through).
tasks:
  - id: ablauf-beschriften
    type: diagram
    title: Beschrifte das Flussdiagramm
    description: >
      Das Diagramm zeigt `if (alter >= 18) { … } else { … }`. Setze die Bedingung in die Raute und die
      beiden Ergebnisse in die passenden Kästen.
    image: /assets/programmieren-grundlagen/m2-if-else-ablauf-leer.svg
    slots:
      - { x: 50, y: 41, answer: "alter >= 18 ?" }
      - { x: 80, y: 67, answer: Zutritt erlaubt }
      - { x: 20, y: 67, answer: Zutritt verweigert }
    distractors: [alter = 18, Schleife]
    hints:
      - Der true-Pfad führt zum if-Block, der false-Pfad zum else-Block.
  - id: eintrittspreis
    type: code
    language: js
    title: Eintrittspreise im Zoo
    description: |
      Der Rahmen `function eintrittspreis(alter) { … }` ist vorbereitet. Du musst nur wissen: `alter` ist die
      **Eingabe**, und mit `return wert;` gibst du das **Ergebnis** zurück. (Wie Funktionen genau funktionieren,
      lernst du im nächsten Modul.)

      Ergänze die Preisregeln mit `if`, `else if` und `else`:

      | Alter | Preis |
      |---|---|
      | unter 4 Jahren | 0 |
      | 4 bis 17 Jahre | 8 |
      | 18 bis 64 Jahre | 15 |
      | ab 65 Jahren | 10 |
    starter: |
      function eintrittspreis(alter) {
        // Deine Regeln hier
        return 15;
      }
    tests:
      - name: Baby (2) zahlt nichts
        code: assertEqual(eintrittspreis(2), 0)
      - name: Grenze – genau 4 Jahre zahlt 8
        code: assertEqual(eintrittspreis(4), 8)
      - name: Jugendliche (17) zahlt 8
        code: assertEqual(eintrittspreis(17), 8)
      - name: Erwachsene (18 und 40) zahlen 15
        code: assertTrue(eintrittspreis(18) === 15 && eintrittspreis(40) === 15)
      - name: Grenze – genau 65 zahlt 10
        code: assertEqual(eintrittspreis(65), 10)
    hints:
      - Prüfe die Fälle der Reihe nach vom jüngsten zum ältesten Alter.
      - "`if (alter < 4) { return 0; } else if (alter < 18) { return 8; } …`"
    solution: |
      function eintrittspreis(alter) {
        if (alter < 4) {
          return 0;
        } else if (alter < 18) {
          return 8;
        } else if (alter < 65) {
          return 15;
        } else {
          return 10;
        }
      }
  - id: kino-regeln
    type: code
    language: js
    title: Darf ich ins Kino?
    description: |
      Ergänze in jedem vorbereiteten Funktionsrahmen **eine** `return`-Zeile:

      1. `darfRein(alter, inBegleitung)`: Ab 16 darf man allein rein, darunter nur in Begleitung. Gib `true` oder `false` zurück.
      2. `brauchtTicket(alter, hatGutschein)`: Kinder unter 6 und Leute mit Gutschein brauchen kein Ticket. Gib zurück, ob ein Ticket **gebraucht** wird.
      3. `anzeigeName(name)`: Gib den Namen zurück – oder `"Gast"`, wenn `name` `null` oder `undefined` ist. Ein leerer String `""` soll erhalten bleiben (nutze `??`).
      4. `status(alter)`: Gib mit dem ternären Operator `"erwachsen"` (ab 18) oder `"minderjährig"` zurück.
    starter: |
      function darfRein(alter, inBegleitung) {
        return false;
      }

      function brauchtTicket(alter, hatGutschein) {
        return true;
      }

      function anzeigeName(name) {
        return name;
      }

      function status(alter) {
        return "erwachsen";
      }
    tests:
      - name: darfRein – 16 allein, 12 nur begleitet
        code: assertTrue(darfRein(16, false) === true && darfRein(12, true) === true && darfRein(12, false) === false)
      - name: brauchtTicket – Kind, Gutschein, Normalfall
        code: assertTrue(brauchtTicket(5, false) === false && brauchtTicket(30, true) === false && brauchtTicket(30, false) === true)
      - name: anzeigeName – null wird Gast, leerer String bleibt
        code: assertTrue(anzeigeName(null) === "Gast" && anzeigeName(undefined) === "Gast" && anzeigeName("") === "" && anzeigeName("Ada") === "Ada")
      - name: status – Grenze bei 18
        code: assertTrue(status(18) === "erwachsen" && status(17) === "minderjährig")
    hints:
      - "darfRein: `alter >= 16 || inBegleitung`"
      - "brauchtTicket: Ein Ticket braucht, wer NICHT (unter 6 ODER mit Gutschein) ist – also `!(alter < 6 || hatGutschein)`."
      - "anzeigeName: `name ?? \"Gast\"`"
    solution: |
      function darfRein(alter, inBegleitung) {
        return alter >= 16 || inBegleitung;
      }

      function brauchtTicket(alter, hatGutschein) {
        return !(alter < 6 || hatGutschein);
      }

      function anzeigeName(name) {
        return name ?? "Gast";
      }

      function status(alter) {
        return alter >= 18 ? "erwachsen" : "minderjährig";
      }
---

Eine Ampel zeigt Rot – du bleibst stehen. Sie zeigt Grün – du gehst. Unser Alltag ist voller Entscheidungen
nach dem Muster „wenn …, dann …, sonst …". Bisher liefen deine Programme stur von oben nach unten. Mit
[[bedingung|Bedingungen]] reagieren sie auf die Situation.

## Vergleiche liefern true oder false

[[vergleichsoperator|Vergleichsoperatoren]] vergleichen zwei Werte und liefern immer einen [[boolean|Boolean]]:

| Operator | Bedeutung | Beispiel | Ergebnis |
|---|---|---|---|
| `===` / `!==` | gleich / ungleich | `3 !== 4` | `true` |
| `>` / `<` | größer / kleiner | `5 > 7` | `false` |
| `>=` / `<=` | größer gleich / kleiner gleich | `18 >= 18` | `true` |

Genau solche Ausdrücke setzt du als Bedingung ein. Tipp: Lies sie laut als deutschen Satz –
`kontostand >= preis` heißt „der Kontostand ist mindestens so groß wie der Preis".

## if, else if und else

![Ablauf einer if/else-Verzweigung](/assets/programmieren-grundlagen/m2-if-else-ablauf.svg)

```js run
const note = 2;

if (note === 1) {
  console.log("sehr gut");
} else if (note <= 4) {
  console.log("bestanden");
} else {
  console.log("nicht bestanden");
}
```

Nach `if` steht die Bedingung in **runden** Klammern, danach ein [[codeblock|Codeblock]] in **geschweiften**
Klammern. JavaScript prüft die Bedingungen von oben nach unten. Der erste Zweig mit wahrer Bedingung läuft – alle
weiteren werden übersprungen. `else` fängt alles Übrige ab und ist optional.

> [!MERKSATZ]
> In einer if/else-if/else-Kette läuft **höchstens ein** Zweig: der erste mit wahrer Bedingung. Ordne die
> Bedingungen vom speziellsten zum allgemeinsten Fall.

> [!FEHLER]
> `if (alter = 18)` statt `if (alter === 18)`. Ein einzelnes `=` weist zu und macht die Bedingung immer wahr.

## UND, ODER, NICHT

Mit [[boolesche-logik|boolescher Logik]] verbindest du mehrere Bedingungen:

| Operator | Name | `true`, wenn … |
|---|---|---|
| `a && b` | UND | beide wahr sind |
| `a \|\| b` | ODER | mindestens einer wahr ist |
| `!a` | NICHT | `a` falsch ist |

```js run
const alter = 14;
const mitErwachsenem = true;
const istKrank = false;
console.log((alter > 12 || mitErwachsenem) && !istKrank);   // true
```

Setze Klammern, wenn du `&&` und `||` mischst – dann ist die Reihenfolge eindeutig.

## Truthy, falsy und Standardwerte

In einer Bedingung muss kein echter Boolean stehen – JavaScript wandelt um. Das Prinzip heißt
[[truthy-und-falsy|truthy und falsy]]. **Falsy** sind nur `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined` und
`NaN`. Alles andere ist truthy, auch `"0"` und `[]`.

`&&` und `||` arbeiten mit [[kurzschlussauswertung|Kurzschlussauswertung]]: Steht das Ergebnis nach der linken
Seite fest, wird die rechte gar nicht mehr angeschaut, und zurück kommt einer der beiden Werte. Deshalb liefern
`||` und `??` Standardwerte – mit einem wichtigen Unterschied. Der
[[nullish-coalescing|Nullish-Coalescing-Operator]] `??` ersetzt nur `null` und `undefined`:

```js run
const menge = 0;
console.log(menge || 1);   // 1 – die 0 geht verloren!
console.log(menge ?? 1);   // 0
const text = 63 >= 50 ? "bestanden" : "nicht bestanden";
console.log(text);
```

Die letzte Zeile zeigt den [[ternaerer-operator|ternären Operator]]: `bedingung ? wennWahr : wennFalsch` – eine
kompakte Entscheidung zwischen zwei Werten.

## switch: ein Wert, viele Fälle

Vergleichst du immer dieselbe Variable mit festen Werten, ist die [[switch-anweisung|switch-Anweisung]]
übersichtlicher:

```js run
const taste = 2;
switch (taste) {
  case 1:
    console.log("Wasser");
    break;
  case 2:
  case 3:
    console.log("Saft");   // 2 und 3 teilen sich diesen Block
    break;
  default:
    console.log("Ungültige Taste");
}
```

`switch` vergleicht strikt. Ohne `break` läuft der Code in den nächsten `case` weiter (*Fall-through*) – ein
häufiger Fehler. PHP kennt dafür seit Version 8 den eleganteren `match`-Ausdruck ohne `break`:
`$getraenk = match ($taste) { 1 => "Wasser", 2, 3 => "Saft", default => "Ungültig" };`

> [!PRAXIS]
> Fast jede Geschäftsregel landet als Bedingung im Code: Versandkosten ab einem Bestellwert, Rabatte, Rechte
> nach Rolle. Die häufigste Fehlerquelle sind Grenzwerte – frag nach, was bei genau 50 € gelten soll.

## Zusammenfassung

- Vergleiche (`=== !== < > <= >=`) liefern `true` oder `false`.
- `if`/`else if`/`else`: Der erste wahre Zweig läuft, `else` fängt den Rest ab.
- `&&` (UND), `||` (ODER) und `!` (NICHT) verknüpfen Bedingungen; Klammern schaffen Klarheit.
- **Falsy**: `false`, `0`, `""`, `null`, `undefined`, `NaN` (und `-0`, `0n`) – alles andere ist truthy.
- `??` ersetzt nur `null`/`undefined`; `a ? b : c` wählt kompakt zwischen zwei Werten.
- `switch` prüft einen Wert gegen feste Fälle – `break` nicht vergessen; PHP hat zusätzlich `match`.
