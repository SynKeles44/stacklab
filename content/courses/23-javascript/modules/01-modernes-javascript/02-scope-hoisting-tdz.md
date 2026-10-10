---
title: Scope, Hoisting und die Temporal Dead Zone
summary: Wie JavaScript entscheidet, welche Variable an welcher Stelle sichtbar ist – und warum manche Variablen vor ihrer Zeile schon existieren, andere aber einen Fehler werfen.
duration: 20
sources:
  - title: MDN – Scope
    url: https://developer.mozilla.org/en-US/docs/Glossary/Scope
  - title: MDN – Hoisting
    url: https://developer.mozilla.org/en-US/docs/Glossary/Hoisting
  - title: MDN – let (Temporal dead zone)
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let#temporal_dead_zone_tdz
  - title: MDN – var
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/var
quiz:
  - type: single
    question: "Was gibt `console.log(x); var x = 5;` aus?"
    options: ["5", "undefined", "ReferenceError", "null"]
    answer: 1
    explanation: Die Deklaration von `var x` wird an den Anfang gehoben und mit `undefined` belegt. Die Zuweisung `= 5` bleibt an ihrer Stelle.
  - type: single
    question: "Was passiert bei `console.log(y); let y = 5;`?"
    options: ["Ausgabe 5", "Ausgabe undefined", "ReferenceError, weil y in der Temporal Dead Zone ist", "Nichts"]
    answer: 2
    explanation: Auch `let` wird registriert, aber nicht initialisiert. Bis zur Deklarationszeile liegt die Variable in der Temporal Dead Zone; jeder Zugriff wirft einen ReferenceError.
  - type: match
    question: Ordne jeder Deklaration ihren Gültigkeitsbereich zu.
    pairs:
      - { left: "var", right: "die umgebende Funktion" }
      - { left: "let / const", right: "der umgebende Block { }" }
      - { left: "function-Deklaration im Modul", right: "das ganze Modul, schon vor ihrer Zeile nutzbar" }
      - { left: "Parameter", right: "der Funktionskörper" }
    explanation: "`var` kennt nur Funktionen als Grenze, `let` und `const` jeden Block. Funktionsdeklarationen werden komplett gehoben."
  - type: find-bug
    question: Die Funktion soll den Rabatt berechnen, wirft aber einen ReferenceError. Welche Zeile ist schuld?
    language: js
    code: |
      const satz = 0.1;
      function rabatt(preis) {
        const ergebnis = preis * satz;
        const satz = 0.2;
        return ergebnis;
      }
      console.log(rabatt(100));
    bug_line: 3
    explanation: "Das innere `const satz` verdeckt das äußere für die ganze Funktion. In Zeile 3 liegt das innere `satz` noch in der Temporal Dead Zone – der Zugriff wirft. Lösung: das innere `satz` umbenennen oder vor der Nutzung deklarieren."
  - type: cloze
    text: "Sucht JavaScript eine Variable, schaut es erst im eigenen Gültigkeitsbereich und dann Schritt für Schritt nach außen. Diese Suche entlang der ___ endet beim globalen Gültigkeitsbereich."
    blanks:
      - [Scope-Kette, Scopekette, Scope Chain, Gültigkeitsbereichskette]
    explanation: Die Scope-Kette führt von innen nach außen. Wird die Variable nirgends gefunden, gibt es einen ReferenceError.
tasks:
  - id: hoisting-vorhersagen
    type: steps
    title: Hoisting live – was gibt der Code aus?
    description: Sag für jeden Schnipsel voraus, was passiert. Überlege, was JavaScript vor der Ausführung schon über die Variablen weiß.
    steps:
      - situation: "`gruss(); function gruss() { console.log(\"Hallo\"); }`"
        question: Was passiert?
        options: ["Ausgabe Hallo", "TypeError: gruss is not a function", "ReferenceError"]
        answer: 0
        explanation: Funktionsdeklarationen werden komplett gehoben – Name und Körper. Du kannst sie vor ihrer Zeile aufrufen.
      - situation: "`gruss(); var gruss = function () { console.log(\"Hallo\"); };`"
        question: Und jetzt?
        options: ["Ausgabe Hallo", "TypeError: gruss is not a function", "ReferenceError"]
        answer: 1
        explanation: Gehoben wird nur `var gruss` mit dem Wert `undefined`. `undefined()` aufzurufen ergibt einen TypeError.
      - situation: "`for (var i = 0; i < 3; i++) {} console.log(i);`"
        question: Was erscheint?
        options: ["3", "2", "ReferenceError: i is not defined"]
        answer: 0
        explanation: "`var` ist nicht an den Block gebunden. `i` existiert nach der Schleife weiter und hat den Wert 3."
      - situation: "`for (let j = 0; j < 3; j++) {} console.log(j);`"
        question: Und mit let?
        options: ["3", "undefined", "ReferenceError: j is not defined"]
        answer: 2
        explanation: "`let` lebt nur im Block der Schleife. Außerhalb gibt es kein `j`."
      - situation: "`let wert = \"außen\"; { console.log(wert); let wert = \"innen\"; }`"
        question: Was passiert?
        options: ["Ausgabe außen", "Ausgabe innen", "ReferenceError"]
        answer: 2
        explanation: "Das innere `let wert` gilt für den ganzen Block und verdeckt das äußere. Vor seiner Zeile liegt es in der Temporal Dead Zone."
  - id: deklarationen-sortieren
    type: dragdrop
    title: Welche Eigenschaft passt?
    description: Ordne jede Aussage der Deklaration zu, auf die sie zutrifft.
    targets:
      - { id: var, label: "var" }
      - { id: let, label: "let" }
      - { id: const, label: "const" }
      - { id: funktion, label: "function-Deklaration" }
    items:
      - { label: "Gilt in der ganzen Funktion, auch außerhalb von if-Blöcken", target: var }
      - { label: "Vor der Deklaration gelesen: undefined", target: var }
      - { label: "Darf später neu zugewiesen werden und gilt nur im Block", target: let }
      - { label: "Muss sofort einen Wert bekommen und ist nicht neu zuweisbar", target: const }
      - { label: "Kann vor ihrer Zeile aufgerufen werden", target: funktion }
    hints:
      - Überlege für jede Deklaration – Block oder Funktion? Gehoben mit Wert, mit undefined oder gar nicht nutzbar?
---
Du verschiebst eine Zeile ein Stück nach unten, und plötzlich wirft das Programm `ReferenceError: Cannot
access 'satz' before initialization`. Eine Zeile höher lief alles. Solche Fehler wirken zufällig, folgen aber
klaren Regeln: Gültigkeitsbereiche, Hoisting und die Temporal Dead Zone. Wer sie kennt, findet solche
Fehler in Sekunden.

## Gültigkeitsbereiche: wer sieht was?

Ein [[gueltigkeitsbereich|Gültigkeitsbereich]] (englisch *Scope*) legt fest, wo eine Variable sichtbar ist.
JavaScript kennt drei Arten:

| Art | Entsteht durch | Beispiel |
|---|---|---|
| Global / Modul | die Datei selbst | `const API = "/api";` ganz oben |
| Funktion | jede Funktion | Parameter und Variablen in `function f() { … }` |
| Block | jedes `{ … }` von `if`, `for`, `while` … | `let i` im Schleifenkopf |

Entscheidend ist, **wo der Code steht**, nicht wo er aufgerufen wird. Das nennt man
[[lexikalischer-scope|lexikalischen Scope]]. Sucht JavaScript eine Variable, schaut es erst im eigenen
Bereich, dann im umgebenden, dann im nächsten – bis zum globalen. Diese Suche heißt
[[scope-kette|Scope-Kette]]. Findet es nichts, wirft es einen [[referenceerror|ReferenceError]].

![Drei ineinander liegende Gültigkeitsbereiche: Modul, Funktion und Block. Pfeile zeigen die Suche von innen nach außen.](/assets/javascript/gueltigkeitsbereiche.svg)

Innen sieht nach außen, außen nie nach innen. Wie bei Zimmern mit Fenstern nur nach draußen.

## var, let und const im Vergleich

Vor 2015 gab es nur [[var-schluesselwort|`var`]]. Es kennt keine Blöcke, nur Funktionen. Das führt zu
Überraschungen:

```js run
function zeige() {
  if (true) {
    var a = "var";
    let b = "let";
  }
  console.log(a);          // "var" – var ist aus dem if-Block entkommen
  console.log(typeof b);   // "undefined" – b existiert hier nicht
}
zeige();
```

| | `var` | `let` | `const` |
|---|---|---|---|
| Gültig in | Funktion | Block | Block |
| Neu zuweisen | ja | ja | nein |
| Doppelt deklarieren | erlaubt (!) | Fehler | Fehler |
| Vor der Zeile lesen | `undefined` | ReferenceError | ReferenceError |

> [!MERKSATZ]
> Nutze `const` als Standard und `let`, wenn du neu zuweisen musst. `var` liest du nur noch in altem Code.

## Hoisting: Deklarationen zuerst

Bevor JavaScript eine Funktion oder ein Modul ausführt, geht es einmal durch und registriert alle
Deklarationen. Es wirkt, als würden sie nach oben „gehoben“ – daher der Name [[hoisting|Hoisting]].
Was dabei passiert, hängt von der Art der Deklaration ab:

- **Funktionsdeklarationen** werden komplett gehoben – Name und Körper. Du kannst sie vor ihrer Zeile aufrufen.
- **`var`** wird gehoben und sofort mit `undefined` belegt. Die Zuweisung bleibt, wo sie steht.
- **`let`, `const` und `class`** werden registriert, aber **nicht** initialisiert.

```js run
console.log(begruesse("Ada"));    // klappt: Deklaration ist gehoben
console.log(zaehler);             // undefined – nur var zaehler ist gehoben

function begruesse(name) {
  return `Hallo ${name}`;
}
var zaehler = 1;
```

Eine Funktion, die in einer Variablen steckt (`const f = function () {}` oder eine Arrow Function), folgt
den Regeln der Variablen – nicht denen der Funktionsdeklaration.

## Die Temporal Dead Zone

Zwischen dem Beginn des Blocks und der Zeile, in der `let` oder `const` steht, existiert die Variable schon,
darf aber nicht benutzt werden. Diesen Abschnitt nennt man [[temporal-dead-zone|Temporal Dead Zone]] (TDZ).
Jeder Zugriff darin wirft einen ReferenceError – sogar `typeof`.

```js run
try {
  console.log(preis);       // TDZ!
  const preis = 10;
} catch (fehler) {
  console.log(fehler.name, fehler.message);
}
```

Die TDZ ist kein Ärgernis, sondern ein Schutz: Statt still mit `undefined` weiterzurechnen wie bei `var`,
fällt der Fehler sofort auf.

> [!FEHLER]
> Eine innere Variable mit dem gleichen Namen wie eine äußere verdeckt die äußere im **ganzen** Block – auch
> in den Zeilen davor. Liest du dort, landest du in der TDZ statt bei der äußeren Variablen.

## Verdecken und der strikte Modus

Deklarierst du innen eine Variable mit demselben Namen wie außen, verdeckt die innere die äußere. Das heißt
[[shadowing|Shadowing]]. Erlaubt ist es, verwirrend auch:

```js run
const name = "Modul";
function test() {
  const name = "Funktion";   // verdeckt das äußere name
  console.log(name);          // "Funktion"
}
test();
console.log(name);            // "Modul"
```

Noch eine Altlast: Ohne Deklaration (`summe = 5`) legte JavaScript früher heimlich eine globale Variable an.
Der [[js-strict-mode|strikte Modus]] verbietet das und wirft einen Fehler. In [[es-module|ES-Modulen]] und
Klassen ist er automatisch aktiv – in modernem Code musst du `"use strict"` also kaum noch schreiben.

> [!PRAXIS]
> Linter wie ESLint melden Shadowing und `var` als Warnung. In Teams sorgt das dafür, dass solche Fehler
> gar nicht erst im Code-Review landen.

## Zusammenfassung

- Gültigkeitsbereiche gibt es für Modul, Funktion und Block; gesucht wird entlang der Scope-Kette von innen nach außen.
- Der Scope ergibt sich aus der Stelle im Quelltext (lexikalischer Scope), nicht aus dem Aufruf.
- `var` ist funktionsweit und vor seiner Zeile `undefined`; `let`/`const` sind blockweit.
- Hoisting registriert alle Deklarationen vorab; Funktionsdeklarationen sind sofort komplett nutzbar.
- In der Temporal Dead Zone wirft jeder Zugriff auf `let`/`const` einen ReferenceError.
- In ES-Modulen gilt automatisch der strikte Modus – undeklarierte Variablen sind dann Fehler.
