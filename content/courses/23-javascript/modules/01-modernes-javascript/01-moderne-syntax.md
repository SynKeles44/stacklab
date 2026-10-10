---
title: Moderne Syntax im Alltag
summary: Destrukturierung mit Standardwerten, Spread und Rest, Optional Chaining, Nullish Coalescing und logische Zuweisung – die Werkzeuge, die in jedem modernen JavaScript-Projekt stecken.
duration: 20
sources:
  - title: MDN – Destructuring
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring
  - title: MDN – Spread syntax
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
  - title: MDN – Rest parameters
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters
  - title: MDN – Optional chaining (?.)
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
  - title: MDN – Nullish coalescing operator (??)
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing
quiz:
  - type: single
    question: "Was gibt `const { port = 80 } = { port: null }; console.log(port);` aus?"
    options: ["80", "null", "undefined", "Einen Fehler"]
    answer: 1
    explanation: Standardwerte bei der Destrukturierung greifen nur bei `undefined`. `null` ist ein echter Wert und wird übernommen.
  - type: match
    question: "Was liefern diese Ausdrücke für `const cfg = { anzahl: 0, user: null };`?"
    pairs:
      - { left: "cfg.anzahl || 10", right: "10" }
      - { left: "cfg.anzahl ?? 10", right: "0" }
      - { left: "cfg.user?.name", right: "undefined" }
      - { left: "cfg.user ?? \"Gast\"", right: "\"Gast\"" }
    explanation: "`||` ersetzt jeden falsy-Wert (auch 0), `??` nur `null` und `undefined`. `?.` bricht bei `null` ab und liefert `undefined`."
  - type: cloze
    text: "In `function summe(...zahlen)` sammelt der ___-Parameter alle Argumente in einem Array. In `[...a, ...b]` faltet der ___-Operator Arrays auf."
    blanks:
      - [Rest, rest]
      - [Spread, spread]
    explanation: Gleiche drei Punkte, entgegengesetzte Richtung – Rest sammelt ein, Spread packt aus.
  - type: find-bug
    question: "`nutzer[0]` soll ein Objekt mit `id` und `name` sein, ist aber `undefined`. Welche Zeile ist falsch?"
    language: js
    code: |
      const namen = ["Ada", "Linus"];
      const nutzer = namen.map((name, i) => { id: i, name });
      console.log(nutzer[0]);
    bug_line: 2
    explanation: "Geschweifte Klammern nach `=>` gelten als Funktionskörper, nicht als Objekt. Ein Objekt gibst du mit runden Klammern zurück: `(name, i) => ({ id: i, name })`."
  - type: multiple
    question: Welche Aussagen über `??=` und `||=` stimmen?
    options:
      - "`a ??= 5` weist nur zu, wenn `a` null oder undefined ist."
      - "`a ||= 5` überschreibt auch den Wert 0."
      - "`a ??= 5` überschreibt auch einen leeren String."
      - Beide Operatoren werten die rechte Seite immer aus.
    answers: [0, 1]
    explanation: "Logische Zuweisungen sind kurzschließend: Die rechte Seite wird nur ausgewertet, wenn wirklich zugewiesen wird. `??=` lässt `\"\"` und 0 in Ruhe, `||=` nicht."
tasks:
  - id: optionen-normalisieren
    type: code
    language: js
    title: Optionen mit Standardwerten
    description: |
      Eine Funktion bekommt ein Optionen-Objekt, in dem Werte fehlen dürfen. Schreibe
      `normalisiere(optionen)` so, dass sie ein **neues** Objekt zurückgibt:

      1. `titel`: der übergebene Titel, sonst `"Ohne Titel"`.
      2. `seiten`: die übergebene Zahl – **auch 0 ist gültig** –, sonst `1`.
      3. `autor`: der Wert aus `optionen.meta.autor`, sonst `"unbekannt"`. `meta` darf fehlen.
      4. Alle übrigen Eigenschaften werden unverändert übernommen.
      5. Wird gar nichts übergeben, kommt `{ titel: "Ohne Titel", seiten: 1, autor: "unbekannt" }` heraus.

      Die Eigenschaft `meta` selbst soll im Ergebnis nicht mehr vorkommen. Verändere das übergebene Objekt nicht.
    starter: |
      function normalisiere(optionen) {
        return {
          titel: optionen.titel || "Ohne Titel",
          seiten: optionen.seiten || 1,
          autor: optionen.meta.autor,
        };
      }
    tests:
      - name: fehlende Werte bekommen Standardwerte
        code: 'assertDeepEqual(normalisiere({}), { titel: "Ohne Titel", seiten: 1, autor: "unbekannt" })'
      - name: ohne Argument aufrufbar
        code: 'assertDeepEqual(normalisiere(), { titel: "Ohne Titel", seiten: 1, autor: "unbekannt" })'
      - name: 0 Seiten bleiben 0
        code: 'assertEqual(normalisiere({ seiten: 0 }).seiten, 0)'
      - name: Autor aus meta und weitere Felder bleiben erhalten
        code: 'assertDeepEqual(normalisiere({ titel: "JS", meta: { autor: "Ada" }, farbe: "gelb" }), { titel: "JS", seiten: 1, autor: "Ada", farbe: "gelb" })'
      - name: Original bleibt unverändert
        code: 'const o = { titel: "X", meta: { autor: "Linus" } }; normalisiere(o); assertDeepEqual(o, { titel: "X", meta: { autor: "Linus" } })'
    hints:
      - "Ein Standardparameter `optionen = {}` macht den Aufruf ohne Argument möglich."
      - "Mit Rest in der Destrukturierung trennst du `meta` ab: `const { meta, ...rest } = optionen;`"
      - "`seiten ?? 1` behält die 0, `meta?.autor ?? \"unbekannt\"` übersteht ein fehlendes meta."
    solution: |
      function normalisiere(optionen = {}) {
        const { meta, titel, seiten, ...rest } = optionen;
        return {
          ...rest,
          titel: titel || "Ohne Titel",
          seiten: seiten ?? 1,
          autor: meta?.autor ?? "unbekannt",
        };
      }
  - id: operatoren-vorhersagen
    type: steps
    title: Was kommt heraus?
    description: Sag für jeden Schnipsel die Ausgabe voraus. Denk an den Unterschied zwischen falsy und „nullish“.
    steps:
      - situation: "`const menge = 0; console.log(menge || 1, menge ?? 1);`"
        question: Was erscheint in der Konsole?
        options: ["1 1", "0 0", "1 0", "0 1"]
        answer: 2
        explanation: "`||` ersetzt die falsy 0 durch 1, `??` behält 0, weil 0 weder null noch undefined ist."
      - situation: "`const user = { adresse: null }; console.log(user.adresse?.ort);`"
        question: Was passiert?
        options: ["TypeError: Cannot read properties of null", "undefined", "null"]
        answer: 1
        explanation: "`?.` prüft, ob links `null` oder `undefined` steht. Dann bricht die ganze Kette ab und liefert `undefined` – ohne Fehler."
      - situation: "`const [a, , b = 9] = [1, 2]; console.log(a, b);`"
        question: Welche Werte haben a und b?
        options: ["1 2", "1 9", "1 undefined", "2 9"]
        answer: 1
        explanation: Die Lücke überspringt die 2. An Position 2 gibt es nichts (undefined), also greift der Standardwert 9.
      - situation: "`const basis = { farbe: \"rot\", groesse: \"M\" }; const neu = { ...basis, farbe: \"blau\" }; console.log(neu.farbe, basis.farbe);`"
        question: Was wird ausgegeben?
        options: ["blau blau", "rot rot", "blau rot", "rot blau"]
        answer: 2
        explanation: Spread kopiert die Eigenschaften in ein neues Objekt, spätere Angaben überschreiben frühere. Das Original bleibt rot.
---
Du öffnest ein bestehendes Projekt und liest: `const { data: { items = [] } = {} } = res ?? {};`. In den
Programmier-Grundlagen hast du Destrukturierung und Spread kennengelernt – aber so? Moderner
[[javascript|JavaScript]]-Code ist kompakt. Diese Lektion zeigt dir die Werkzeuge, die du dafür brauchst,
und vor allem ihre Fallstricke.

## Woher die neue Syntax kommt

JavaScript wird jedes Jahr erweitert. Die Spezifikation heißt [[ecmascript|ECMAScript]]; seit 2015 (ES2015,
früher „ES6“) erscheint jährlich eine neue Version. Alles in diesem Kurs läuft in aktuellen Browsern und in
[[nodejs|Node.js]] 24 ohne Zusatzwerkzeuge.

Kurz zur Erinnerung, was du schon kennst:

| Werkzeug | Beispiel |
|---|---|
| `const` / `let` | `const preis = 9;` – `var` brauchst du nicht mehr |
| [[template-literal\|Template-Literal]] | `` `Hallo ${name}` `` |
| [[arrow-function\|Arrow Function]] | `(x) => x * 2` |
| [[destrukturierung\|Destrukturierung]] | `const { name } = user;` |
| [[spread-operator\|Spread]] | `[...liste, 4]` |

Die Faustregel für Variablen lautet: Standardmäßig `const`, nur wenn du wirklich neu zuweisen musst, `let`.

> [!MERKSATZ]
> `const` schützt die **Variable** vor neuer Zuweisung – nicht den **Inhalt** eines Objekts oder Arrays.

## Destrukturierung für Fortgeschrittene

Beim Destrukturieren kannst du umbenennen, Standardwerte setzen und verschachtelt auspacken:

```js run
const antwort = { status: 200, daten: { nutzer: { name: "Ada" } } };

const {
  status: code,                    // umbenennen: status → code
  daten: { nutzer: { name } },     // verschachtelt
  fehler = "keiner",               // Standardwert
} = antwort;

console.log(code, name, fehler);   // 200 Ada keiner
```

Besonders praktisch ist Destrukturierung direkt in der Parameterliste. Zusammen mit einem
[[standardparameter|Standardparameter]] wird die Funktion auch ohne Argument aufrufbar:

```js run
function verbinde({ host = "localhost", port = 3000 } = {}) {
  return `${host}:${port}`;
}
console.log(verbinde());               // localhost:3000
console.log(verbinde({ port: 8080 }));  // localhost:8080
```

Bei Arrays zählt die Position. Mit Destrukturierung tauschst du sogar zwei Variablen ohne Hilfsvariable:
`[a, b] = [b, a];`.

> [!FEHLER]
> Standardwerte greifen **nur bei `undefined`**. Steht dort `null`, bleibt es `null`.

## Spread und Rest: dieselben drei Punkte

Die drei Punkte `...` haben zwei Gesichter. **Spread** packt ein Array oder Objekt aus. **Rest** sammelt
übrig gebliebene Werte ein.

| Wo | Name | Wirkung |
|---|---|---|
| `[...a, ...b]`, `{ ...o, x: 1 }`, `f(...args)` | Spread | Werte auspacken |
| `function f(...args)` | [[rest-parameter\|Rest-Parameter]] | alle Argumente als Array |
| `const { id, ...rest } = o` | Rest | „alles andere“ einsammeln |

```js run
function protokolliere(stufe, ...nachrichten) {
  console.log(`[${stufe}]`, nachrichten.join(" | "));
}
protokolliere("INFO", "Start", "Port 3000");

const user = { id: 7, name: "Ada", passwort: "geheim" };
const { passwort, ...oeffentlich } = user;   // passwort abtrennen
console.log(oeffentlich);                     // { id: 7, name: "Ada" }
```

Beim Objekt-Spread gewinnt die **letzte** Angabe. `{ ...standard, ...eingabe }` ist deshalb das übliche
Muster, um Standardwerte mit Nutzereingaben zu überschreiben. Spread kopiert nur **flach**: Verschachtelte
Objekte werden weiterhin geteilt. Mehr dazu in der Lektion über Unveränderlichkeit.

## Optional Chaining und Nullish Coalescing

Daten aus einer Schnittstelle sind selten vollständig. Ohne Schutz endet `user.adresse.ort` mit einem Fehler,
wenn `adresse` fehlt. [[optional-chaining|Optional Chaining]] `?.` bricht stattdessen ab und liefert
`undefined`:

```js run
const user = { name: "Ada", adresse: null, gruesse: undefined };
console.log(user.adresse?.ort);      // undefined
console.log(user.tags?.[0]);         // undefined – auch mit Klammern
console.log(user.gruesse?.());       // undefined – Funktion nur aufrufen, wenn vorhanden
```

Für Ersatzwerte gibt es [[nullish-coalescing|Nullish Coalescing]] `??`. Es ersetzt **nur** `null` und
`undefined` – anders als `||`, das jeden [[truthy-und-falsy|falsy]]-Wert ersetzt:

```js run
const einstellungen = { lautstaerke: 0, name: "" };
console.log(einstellungen.lautstaerke || 50);  // 50  – die 0 geht verloren!
console.log(einstellungen.lautstaerke ?? 50);  // 0
console.log(einstellungen.name ?? "Gast");      // "" – leerer String bleibt
```

> [!FEHLER]
> `seite || 1` macht aus Seite 0 heimlich Seite 1. Nimm `??`, sobald 0, `""` oder `false` gültige Werte sind.

## Logische Zuweisung und saubere Arrow Functions

Die [[logische-zuweisung|logischen Zuweisungen]] kombinieren Prüfung und Zuweisung:

```js run
const cache = {};
cache.nutzer ??= [];          // nur zuweisen, wenn null/undefined
cache.nutzer.push("Ada");
let titel = "";
titel ||= "Ohne Titel";       // zuweisen, wenn falsy
console.log(cache, titel);
```

Bei Arrow Functions gibt es eine Falle: Willst du ein Objekt direkt zurückgeben, musst du es in runde
Klammern setzen. Sonst hält JavaScript die geschweiften Klammern für den Funktionskörper.

```js run
const alsObjekt = (name) => ({ name, laenge: name.length });
console.log(alsObjekt("Ada"));   // { name: "Ada", laenge: 3 }
```

Wie sich Arrow Functions bei `this` verhalten, lernst du in der Lektion über Closures.

> [!PRAXIS]
> In Code-Reviews wird `||` für Standardwerte oft angemerkt, wenn 0 oder `""` gültig sind. Viele Teams
> lassen das sogar von einem [[linter|Linter]] prüfen und schreiben grundsätzlich `??`.

## Zusammenfassung

- Destrukturierung kann umbenennen (`status: code`), verschachteln und Standardwerte setzen – Standardwerte greifen nur bei `undefined`.
- `...` ist **Spread** (auspacken) oder **Rest** (einsammeln), je nachdem, wo es steht.
- Beim Objekt-Spread gewinnt die letzte Angabe; Spread kopiert nur flach.
- `?.` liefert `undefined` statt eines Fehlers, wenn links `null` oder `undefined` steht.
- `??` ersetzt nur `null`/`undefined`, `||` jeden falsy-Wert – also auch 0 und `""`.
- `??=` und `||=` weisen nur bei Bedarf zu; Objekte gibst du aus Arrow Functions mit `({ … })` zurück.
