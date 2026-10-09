---
title: Variablen und Datentypen
summary: Werte mit let und const unter einem Namen speichern und die wichtigsten Datentypen kennen – von Text und Zahlen bis zu Arrays und Objekten.
duration: 25
sources:
  - title: MDN – Grammatik und Typen (Deklarationen)
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#declarations
  - title: MDN – let
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let
  - title: MDN – JavaScript-Datentypen und Datenstrukturen
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Data_structures
  - title: PHP-Handbuch – Variablen
    url: https://www.php.net/manual/de/language.variables.basics.php
quiz:
  - type: single
    question: "Welchen Wert hat `x` nach diesen Zeilen? `let x = 5; x = x + 3;`"
    options: ["5", "3", "8", "Fehler, weil x nicht gleich x + 3 sein kann"]
    answer: 2
    explanation: >
      `=` ist eine Zuweisung, kein Vergleich. Zuerst wird rechts `x + 3` ausgerechnet (5 + 3 = 8), dann wird das
      Ergebnis in `x` gespeichert.
  - type: multiple
    question: Welche Variablennamen sind in JavaScript gültig?
    options: [anzahlArtikel, 2teKundin, _intern, preis-netto, let, $total]
    answers: [0, 2, 5]
    explanation: >
      Namen dürfen Buchstaben, Ziffern, `_` und `$` enthalten, aber nicht mit einer Ziffer beginnen. Ein Bindestrich
      würde als Minus gelesen, und `let` ist ein reserviertes Schlüsselwort.
  - type: find-bug
    question: Dieses Programm bricht mit einem TypeError ab. In welcher Zeile?
    language: js
    code: |
      const vorname = "Ada";
      let punkte = 10;
      punkte = punkte + 5;
      vorname = "Grace";
      console.log(vorname, punkte);
    bug_line: 4
    explanation: "`vorname` wurde mit `const` angelegt und darf keinen neuen Wert bekommen. Soll sich der Wert ändern, nimm `let`."
  - type: match
    question: Welchen Typ liefert `typeof`?
    pairs:
      - { left: "typeof \"42\"", right: "\"string\"" }
      - { left: "typeof 42", right: "\"number\"" }
      - { left: "typeof false", right: "\"boolean\"" }
      - { left: "typeof undefined", right: "\"undefined\"" }
    explanation: Alles in Anführungszeichen ist ein String – auch "42". Ohne Anführungszeichen ist 42 eine Zahl.
  - type: single
    question: "Welchen Wert hat `farben[1]` bei `const farben = [\"rot\", \"grün\", \"blau\"];`?"
    options: ["\"rot\"", "\"grün\"", "\"blau\"", "undefined"]
    answer: 1
    explanation: Der Index beginnt bei 0. farben[0] ist "rot", farben[1] ist "grün".
tasks:
  - id: werte-verfolgen
    type: steps
    title: Was steht gerade in der Variablen?
    description: Verfolge Zeile für Zeile, welchen Wert die Variable `kontostand` hat.
    steps:
      - situation: "`let kontostand = 100;`"
        question: Welchen Wert hat kontostand jetzt?
        options: ["0", "100", "undefined"]
        answer: 1
        explanation: Die Variable wird angelegt und bekommt sofort den Wert 100.
      - situation: "`kontostand = kontostand - 30;`"
        question: Und jetzt?
        options: ["70", "100", "-30"]
        answer: 0
        explanation: Rechts wird 100 - 30 = 70 berechnet, dann in kontostand gespeichert.
      - situation: "`let einzahlung = 50;` und danach `kontostand = kontostand + einzahlung;`"
        question: Welchen Wert hat kontostand?
        options: ["50", "120", "170"]
        answer: 1
        explanation: 70 + 50 = 120. Der Wert von einzahlung wird gelesen und dazugerechnet.
      - situation: "`einzahlung = 0;`"
        question: Was passiert mit kontostand?
        options: [Er wird 0, Er bleibt 120, Er wird 70]
        answer: 1
        explanation: Die Zuweisung hat den Wert 50 kopiert. Spätere Änderungen an einzahlung wirken nicht rückwirkend.
  - id: werte-sortieren
    type: dragdrop
    title: Welcher Datentyp ist das?
    description: Ordne jeden Wert seinem Datentyp zu. Achte genau auf Anführungszeichen und Klammern.
    targets:
      - { id: string, label: string }
      - { id: number, label: number }
      - { id: boolean, label: boolean }
      - { id: array, label: Array }
      - { id: objekt, label: Objekt }
      - { id: leer, label: null / undefined }
    items:
      - { label: "\"Hallo\"", target: string }
      - { label: "\"42\"", target: string }
      - { label: "3.14", target: number }
      - { label: "-7", target: number }
      - { label: "true", target: boolean }
      - { label: "[1, 2, 3]", target: array }
      - { label: "{ name: \"Ada\" }", target: objekt }
      - { label: "null", target: leer }
      - { label: "undefined", target: leer }
    hints:
      - Anführungszeichen machen jeden Inhalt zu einem String.
      - Eckige Klammern bedeuten Array, geschweifte Klammern Objekt.
  - id: buch-objekt
    type: code
    language: js
    title: Ein Buch als Objekt
    description: |
      Beschreibe ein Buch mit einem Objekt `buch`, das diese Eigenschaften hat:

      - `titel`: der String `"Der kleine Prinz"`
      - `seiten`: die Zahl `96`
      - `ausgeliehen`: der Wahrheitswert `false`
      - `schlagworte`: ein Array mit den Strings `"Klassiker"`, `"Freundschaft"` und `"Reise"`

      Lies danach Werte aus dem Objekt aus (nicht abtippen!) und lege dafür Konstanten an:

      - `erstesSchlagwort` soll das erste Element von `schlagworte` enthalten,
      - `anzahlSchlagworte` soll die Länge des Arrays enthalten.
    starter: |
      const buch = {
        titel: "Der kleine Prinz",
        // weitere Eigenschaften …
      };

      const erstesSchlagwort = undefined;
      const anzahlSchlagworte = undefined;
    tests:
      - name: seiten ist die Zahl 96 (kein String)
        code: assertEqual(buch.seiten, 96)
      - name: ausgeliehen ist false
        code: assertEqual(buch.ausgeliehen, false)
      - name: schlagworte ist das richtige Array
        code: assertDeepEqual(buch.schlagworte, ["Klassiker", "Freundschaft", "Reise"])
      - name: erstesSchlagwort wird aus dem Array gelesen
        code: assertEqual(erstesSchlagwort, "Klassiker")
      - name: anzahlSchlagworte ist 3
        code: assertEqual(anzahlSchlagworte, 3)
      - name: erstesSchlagwort ist mit const angelegt
        code: assertThrows(() => { erstesSchlagwort = "X"; }, "erstesSchlagwort sollte mit const angelegt sein.")
    hints:
      - "Eigenschaften trennst du mit Kommas: `seiten: 96,`"
      - "Das erste Element: `buch.schlagworte[0]`, die Länge: `buch.schlagworte.length`."
    solution: |
      const buch = {
        titel: "Der kleine Prinz",
        seiten: 96,
        ausgeliehen: false,
        schlagworte: ["Klassiker", "Freundschaft", "Reise"],
      };

      const erstesSchlagwort = buch.schlagworte[0];
      const anzahlSchlagworte = buch.schlagworte.length;
---

Stell dir vor, du rechnest im Kopf einen Einkauf zusammen – und plötzlich weißt du nicht mehr, wie viel du
schon hattest. Menschen notieren sich Zwischenergebnisse. Programme legen Werte dafür in
[[variable|Variablen]] ab. Und jeder Wert hat eine Art, einen [[datentyp|Datentyp]]: Mit der Zahl 42 kannst du
rechnen, mit dem Wort „zweiundvierzig" nicht.

## Variablen: beschriftete Schachteln

Eine Variable hat einen **Namen** (das Etikett) und einen **Wert** (den Inhalt).

![Variablen als beschriftete Schachteln: let erlaubt neue Werte, const nicht](/assets/programmieren-grundlagen/m2-variable-schachtel.svg)

| | `let` | `const` |
|---|---|---|
| Neuer Wert später erlaubt? | ja | nein – sonst `TypeError` |
| Wofür? | Zähler, Zwischenstände | Werte, die gleich bleiben |

`let punkte = 10;` ist eine [[deklaration|Deklaration]] mit Startwert. Eine `const`-Variable heißt auch
[[konstante|Konstante]]. Profis nehmen standardmäßig `const` und nur dann `let`, wenn sich der Wert wirklich
ändert. Das alte `var` benutzt du in neuem Code nicht.

> [!MERKSATZ]
> Standardmäßig `const`. Nur wenn ein Wert neu zugewiesen werden muss, `let`. Niemals `var`.

## Zuweisung und gute Namen

Das `=` ist eine [[zuweisung|Zuweisung]], kein „ist gleich": Erst wird rechts gerechnet, dann links gespeichert.

```js run
let zaehler = 0;
zaehler = zaehler + 1;   // rechts: 0 + 1 → 1, dann speichern
console.log(zaehler);    // 1
```

Für Namen, sogenannte [[bezeichner|Bezeichner]], gelten Regeln:

- Buchstaben, Ziffern, `_` und `$` – aber keine Ziffer am Anfang,
- keine Leerzeichen, keine Bindestriche, keine [[schluesselwort|Schlüsselwörter]] wie `let` oder `if`,
- Groß- und Kleinschreibung zählt: `punkte` und `Punkte` sind verschieden.

Mehrteilige Namen schreibst du in [[camelcase|camelCase]]: `anzahlArtikel`. In diesem Einsteigerkurs nutzen
wir deutsche Namen; im Berufsalltag ist Code meist englisch (`totalPrice`).

> [!FEHLER]
> `const zaehler = 0;` und später `zaehler = zaehler + 1;` führt zu `TypeError: Assignment to constant
> variable.` Was sich ändern soll, legst du mit `let` an.

## Die einfachen Datentypen

| Typ | Beispiel | Wofür |
|---|---|---|
| [[string]] | `"Hallo"`, `'Ada'` | Text jeder Art |
| [[number]] | `42`, `-7`, `19.99` | ganze und Kommazahlen (Komma als Punkt) |
| [[boolean]] | `true`, `false` | Ja/Nein-Antworten |
| [[undefined]] | `undefined` | „hat noch keinen Wert" |
| [[null]] | `null` | „absichtlich leer" |

Diese [[primitiver-datentyp|primitiven Datentypen]] sind einfache Einzelwerte. Den Typ verrät `typeof`:

```js run
console.log(typeof "Hallo");   // "string"
console.log(typeof "42");      // "string" – Anführungszeichen!
console.log(typeof 42);        // "number"
console.log(typeof null);      // "object" – ein historischer Fehler
```

`undefined` **passiert** (eine Variable ohne Startwert), `null` **setzt man bewusst** („noch kein Gewinner").

## Arrays und Objekte

Für mehrere Werte gibt es zwei Behälter. Ein [[array|Array]] ist eine geordnete Liste in eckigen Klammern; jedes
Element hat einen [[index|Index]], der bei **0** beginnt. Ein [[objekt|Objekt]] bündelt Werte unter Namen.

```js run
const noten = [2, 1, 3];
console.log(noten[0], noten.length);   // 2 3

const user = { name: "Ada", alter: 36, hobbys: ["Mathe", "Musik"] };
console.log(user.name, user.hobbys[1]);   // Ada Musik
```

Das dritte Element ist `noten[2]`, das letzte `noten[noten.length - 1]`. Einen Index, den es nicht gibt, liest
JavaScript als `undefined`. Mehr zu Arrays und Objekten lernst du im nächsten Modul.

## Typen in JavaScript und PHP

In JavaScript gehört der Typ zum Wert, nicht zur Variablen: `let x = 5; x = "fünf";` ist erlaubt. Das heißt
[[dynamische-typisierung|dynamische Typisierung]]. PHP arbeitet genauso, unterscheidet aber `int` und `float`.
Variablen beginnen dort mit `$`, und Arrays können auch Schlüssel haben:

```php
<?php
$punkte = 10;
$punkte = $punkte + 5;              // 15
$user = ["name" => "Ada", "alter" => 36];
echo $user["name"], "\n";           // Ada
```

> [!PRAXIS]
> Daten aus dem Internet, etwa Antworten einer API, bestehen fast immer aus Objekten, Arrays, Strings, Zahlen
> und Booleans. Wer diese Typen sicher erkennt, kann jede solche Antwort lesen.

## Zusammenfassung

- Eine **Variable** speichert einen Wert unter einem Namen; `const` ist Standard, `let` für veränderliche Werte.
- `=` ist eine **Zuweisung**: erst rechts ausrechnen, dann links speichern.
- Gute Namen sind beschreibend und in **camelCase**; sie beginnen nicht mit einer Ziffer.
- Einfache Typen: **string**, **number**, **boolean**, **undefined**, **null** – `typeof` zeigt sie an.
- **Arrays** sind Listen mit Index ab 0, **Objekte** bündeln Werte unter Namen.
- JavaScript und PHP sind **dynamisch typisiert**; PHP-Variablen beginnen mit `$`.
