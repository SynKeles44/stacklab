---
title: Closures und this
summary: Warum eine Funktion sich ihre Umgebung merkt, welche Muster du damit baust – und nach welchen vier Regeln JavaScript entscheidet, worauf this zeigt.
duration: 25
sources:
  - title: MDN – Closures
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures
  - title: MDN – this
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this
  - title: MDN – Function.prototype.bind()
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
quiz:
  - type: single
    question: "Was gibt der Code aus? `function mach() { let n = 0; return () => ++n; } const a = mach(); const b = mach(); a(); a(); console.log(a(), b());`"
    options: ["3 1", "1 1", "3 3", "4 1"]
    answer: 0
    explanation: Jeder Aufruf von `mach()` erzeugt eine neue Umgebung mit eigenem `n`. `a` zählt auf 3, `b` startet bei 0 und liefert 1.
  - type: multiple
    question: Welche Aussagen über Closures stimmen?
    options:
      - Eine Closure merkt sich Variablen, nicht nur deren Wert zum Zeitpunkt der Erzeugung.
      - Closures entstehen nur, wenn man das Schlüsselwort closure benutzt.
      - Mit Closures lassen sich private Daten ohne Klasse bauen.
      - Jede Funktion in JavaScript hat Zugriff auf die Variablen ihrer Entstehungsumgebung.
    answers: [0, 2, 3]
    explanation: Ein Schlüsselwort gibt es nicht – jede Funktion ist automatisch eine Closure über ihre Umgebung. Sie sieht die Variable selbst, also auch spätere Änderungen.
  - type: match
    question: Worauf zeigt this bei diesen Aufrufen (Modul-Code, strikter Modus)?
    pairs:
      - { left: "user.sag()", right: "user" }
      - { left: "const f = user.sag; f()", right: "undefined" }
      - { left: "new Konto()", right: "das neue Objekt" }
      - { left: "user.sag.call(admin)", right: "admin" }
    explanation: Entscheidend ist der Aufruf, nicht die Definition. Ohne Objekt vor dem Punkt ist this im strikten Modus undefined.
  - type: find-bug
    question: Nach einer Sekunde soll „Ada ist bereit“ erscheinen, stattdessen fehlt der Name. Welche Zeile ist die Ursache?
    language: js
    code: |
      const spieler = {
        name: "Ada",
        starte() {
          setTimeout(function () {
            console.log(`${this.name} ist bereit`);
          }, 1000);
        },
      };
      spieler.starte();
    bug_line: 4
    explanation: "Die normale Funktion wird von setTimeout aufgerufen, nicht von `spieler` – ihr `this` ist deshalb nicht `spieler` (im Browser das globale Objekt). Mit einer Arrow Function `setTimeout(() => …)` übernimmt sie das `this` von `starte`."
tasks:
  - id: closure-werkzeuge
    type: code
    language: js
    title: Drei Werkzeuge aus Closures
    description: |
      Baue drei kleine Helfer, die alle auf Closures beruhen:

      1. `erstelleZaehler(start = 0)` liefert ein Objekt mit den Methoden `erhoehe()` (zählt um 1 hoch und gibt
         den neuen Stand zurück), `zuruecksetzen()` (zurück auf `start`) und `stand()`. Der Zählerstand darf
         **nicht** als Eigenschaft von außen erreichbar sein.
      2. `einmal(fn)` liefert eine Funktion, die `fn` nur beim **ersten** Aufruf ausführt und dessen Ergebnis
         zurückgibt. Spätere Aufrufe geben dasselbe Ergebnis zurück, ohne `fn` erneut aufzurufen.
      3. `mitPrefix(prefix)` liefert eine Funktion, die einen Text mit dem Präfix versieht:
         `mitPrefix("[INFO]")("Start")` ergibt `"[INFO] Start"`.
    starter: |
      function erstelleZaehler(start = 0) {
        return {
          wert: start,
          erhoehe() {},
          zuruecksetzen() {},
          stand() {},
        };
      }

      function einmal(fn) {
        return fn;
      }

      function mitPrefix(prefix) {
        return (text) => text;
      }
    tests:
      - name: Zähler zählt und setzt zurück
        code: 'const z = erstelleZaehler(5); z.erhoehe(); assertEqual(z.erhoehe(), 7); z.zuruecksetzen(); assertEqual(z.stand(), 5)'
      - name: Zähler sind unabhängig und privat
        code: 'const a = erstelleZaehler(); const b = erstelleZaehler(); a.erhoehe(); assertEqual(b.stand(), 0); assertDeepEqual(Object.keys(a).sort(), ["erhoehe", "stand", "zuruecksetzen"])'
      - name: einmal ruft fn nur einmal auf
        code: 'let aufrufe = 0; const init = einmal(() => { aufrufe++; return "fertig"; }); init(); assertEqual(init(), "fertig"); assertEqual(aufrufe, 1)'
      - name: einmal reicht Argumente durch
        code: 'const dbl = einmal((x) => x * 2); assertEqual(dbl(21), 42); assertEqual(dbl(100), 42)'
      - name: mitPrefix baut Texte
        code: 'const info = mitPrefix("[INFO]"); assertEqual(info("Start"), "[INFO] Start"); assertEqual(mitPrefix("")("x"), " x")'
    hints:
      - "Lege den Stand in einer Variablen **innerhalb** von `erstelleZaehler` an: `let wert = start;` – die Methoden sehen sie, von außen ist sie unsichtbar."
      - "Für `einmal` brauchst du zwei Variablen in der äußeren Funktion: ob schon aufgerufen wurde und das gespeicherte Ergebnis."
      - "`return (...args) => { if (!aufgerufen) { aufgerufen = true; ergebnis = fn(...args); } return ergebnis; };`"
    solution: |
      function erstelleZaehler(start = 0) {
        let wert = start;
        return {
          erhoehe() {
            wert += 1;
            return wert;
          },
          zuruecksetzen() {
            wert = start;
          },
          stand() {
            return wert;
          },
        };
      }

      function einmal(fn) {
        let aufgerufen = false;
        let ergebnis;
        return (...args) => {
          if (!aufgerufen) {
            aufgerufen = true;
            ergebnis = fn(...args);
          }
          return ergebnis;
        };
      }

      function mitPrefix(prefix) {
        return (text) => `${prefix} ${text}`;
      }
  - id: this-vorhersagen
    type: steps
    title: Worauf zeigt this?
    description: "Der Code läuft als ES-Modul (strikter Modus). Gegeben ist `const user = { name: \"Ada\", sag() { return this?.name; }, pfeil: () => this?.name };`"
    steps:
      - situation: "`console.log(user.sag());`"
        question: Was erscheint?
        options: ["Ada", "undefined", "TypeError"]
        answer: 0
        explanation: "Aufruf mit `user.` davor – `this` ist `user`."
      - situation: "`const sag = user.sag; console.log(sag());`"
        question: Was erscheint jetzt?
        options: ["Ada", "undefined", "TypeError"]
        answer: 1
        explanation: "Die Funktion wurde vom Objekt gelöst. Ohne Objekt vor dem Punkt ist `this` undefined; `this?.name` liefert deshalb undefined statt eines Fehlers."
      - situation: "`console.log(user.pfeil());`"
        question: Und bei der Arrow Function?
        options: ["Ada", "undefined", "Der Name des Moduls"]
        answer: 1
        explanation: "Arrow Functions haben kein eigenes `this`. Sie übernehmen das `this` der Umgebung, in der sie stehen – auf Modulebene ist das undefined."
      - situation: "`const gebunden = user.sag.bind({ name: \"Linus\" }); console.log(gebunden());`"
        question: Was erscheint?
        options: ["Ada", "Linus", "undefined"]
        answer: 1
        explanation: "`bind` erzeugt eine neue Funktion, deren `this` fest auf das übergebene Objekt zeigt."
---
Ein Button soll zählen, wie oft er geklickt wurde. Eine globale Variable `klicks` würde funktionieren – bis
ein zweiter Button dazukommt oder ein anderes Skript zufällig dieselbe Variable benutzt. JavaScript hat eine
elegantere Lösung: Funktionen, die sich ihre Umgebung merken. Und weil Funktionen in JavaScript so
wichtig sind, schauen wir uns gleich auch an, worauf `this` darin zeigt.

## Was eine Closure ist

Eine [[closure|Closure]] ist eine Funktion zusammen mit der Umgebung, in der sie entstanden ist. Wird eine
innere Funktion zurückgegeben, nimmt sie den Zugriff auf die Variablen der äußeren Funktion mit – auch wenn
die äußere Funktion längst beendet ist.

```js run
function erstelleKlickZaehler() {
  let klicks = 0;                  // lebt in der Umgebung
  return () => {
    klicks += 1;
    return klicks;
  };
}

const zaehleA = erstelleKlickZaehler();
const zaehleB = erstelleKlickZaehler();
zaehleA(); zaehleA();
console.log(zaehleA(), zaehleB());   // 3 1
```

Jeder Aufruf von `erstelleKlickZaehler` erzeugt eine **neue** Umgebung mit eigenem `klicks`. Stell es dir wie
einen Rucksack vor: Die Funktion trägt ihre Variablen mit sich herum, egal wohin du sie weitergibst.

> [!MERKSATZ]
> Eine Closure merkt sich die **Variable**, nicht ihren Wert von damals. Ändert sich die Variable, sieht die
> Funktion den neuen Wert.

## Praktische Muster mit Closures

Closures stecken in vielen Alltagswerkzeugen:

| Muster | Idee | Beispiel |
|---|---|---|
| Private Daten | Variable nur über Funktionen erreichbar | Zähler, Store |
| [[fabrikfunktion\|Fabrikfunktion]] | Funktion, die konfigurierte Funktionen erzeugt | `mitPrefix("[INFO]")` |
| Einmal ausführen | Merker in der Umgebung | Initialisierung, `einmal(fn)` |
| Zwischenspeicher | Ergebnisse in einer `Map` merken | teure Berechnungen |

```js run
function multiplikator(faktor) {
  return (zahl) => zahl * faktor;   // faktor kommt aus der Umgebung
}
const verdopple = multiplikator(2);
const verdreifache = multiplikator(3);
console.log(verdopple(5), verdreifache(5));   // 10 15
```

Jede Funktion, die du als [[callback|Callback]] an `map`, `addEventListener` oder `setTimeout` gibst, nutzt
diese Fähigkeit – sie sieht die Variablen um sich herum.

## Die klassische Schleifenfalle

Diese Falle gehört zu den bekanntesten JavaScript-Rätseln:

```js
for (var i = 1; i <= 3; i++) {
  setTimeout(() => console.log("var:", i), 0);   // 4, 4, 4
}
for (let j = 1; j <= 3; j++) {
  setTimeout(() => console.log("let:", j), 0);   // 1, 2, 3
}
```

Mit `var` gibt es nur **ein** `i` für die ganze Funktion. Wenn die Callbacks später laufen, ist die Schleife
fertig und `i` steht auf 4. Alle drei Closures sehen dieselbe Variable. `let` erzeugt dagegen in jedem
Schleifendurchlauf eine **neue** Variable – jede Closure bekommt ihre eigene.

> [!FEHLER]
> Wer in alten Codebasen `var` in Schleifen mit Callbacks findet, hat oft genau diesen Fehler. Die Lösung
> ist fast immer: `var` durch `let` ersetzen.

## this: entscheidend ist der Aufruf

[[this|`this`]] wird nicht beim Schreiben der Funktion festgelegt, sondern bei jedem **Aufruf**. Es gibt vier
Regeln:

| Aufruf | `this` ist | Beispiel |
|---|---|---|
| Als Methode | das Objekt vor dem Punkt | `user.sag()` |
| Einfacher Aufruf | `undefined` (strikter Modus) | `sag()` |
| Mit `new` | das neu erzeugte Objekt | `new Konto()` |
| Explizit | das übergebene Objekt | `sag.call(admin)` |

```js run
const user = {
  name: "Ada",
  sag() { return `Ich bin ${this?.name}`; },
};
const losgeloest = user.sag;
console.log(user.sag());      // Ich bin Ada
console.log(losgeloest());    // Ich bin undefined – kein Objekt vor dem Punkt
```

Mit [[bind-call-apply|`call`, `apply` und `bind`]] legst du `this` selbst fest. `call` und `apply` rufen
sofort auf, `bind` liefert eine neue Funktion mit fest eingebautem `this`.

## Arrow Functions und verlorenes this

[[arrow-function|Arrow Functions]] haben **kein eigenes** `this`. Sie übernehmen es aus der Umgebung, in der sie
stehen – genau wie jede andere Variable. Das macht sie ideal für Callbacks innerhalb von Methoden:

```js
const timer = {
  sekunden: 0,
  start() {
    setTimeout(() => {
      this.sekunden += 1;           // this ist timer – von start() geerbt
      console.log(this.sekunden);
    }, 0);
  },
};
timer.start();
```

Umgekehrt eignen sich Arrow Functions **nicht** als Methoden eines Objekts: `{ sag: () => this.name }` sieht
das `this` der Umgebung, nicht das Objekt.

> [!PRAXIS]
> Übergibst du eine Methode als Callback, etwa `button.addEventListener("click", spiel.starte)`, geht das
> `this` verloren. Üblich sind zwei Lösungen: eine Arrow Function drumherum (`() => spiel.starte()`) oder
> `spiel.starte.bind(spiel)`.

## Zusammenfassung

- Eine Closure ist eine Funktion samt Entstehungsumgebung – sie behält Zugriff auf deren Variablen.
- Jeder Aufruf der äußeren Funktion erzeugt eine neue, unabhängige Umgebung.
- Mit Closures baust du private Daten, Fabrikfunktionen und Helfer wie `einmal(fn)`.
- `var` in Schleifen teilt eine Variable über alle Callbacks; `let` erzeugt pro Durchlauf eine neue.
- `this` hängt vom Aufruf ab: Methode, einfacher Aufruf, `new` oder `call`/`apply`/`bind`.
- Arrow Functions haben kein eigenes `this` – ideal als Callback, ungeeignet als Objektmethode.
