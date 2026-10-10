---
title: Callbacks, Promises und die Event Loop
summary: Warum JavaScript asynchron arbeitet, wie aus verschachtelten Callbacks verkettete Promises werden und in welcher Reihenfolge die Event Loop synchronen Code, Microtasks und Tasks ausführt.
duration: 25
sources:
  - title: MDN – Using promises
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
  - title: MDN – Promise
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
  - title: MDN – The event loop
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model
  - title: MDN – Using microtasks
    url: https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide
quiz:
  - type: single
    question: "In welcher Reihenfolge erscheinen die Zahlen? `console.log(1); setTimeout(() => console.log(2), 0); Promise.resolve().then(() => console.log(3)); console.log(4);`"
    options: ["1 2 3 4", "1 4 3 2", "1 4 2 3", "1 3 4 2"]
    answer: 1
    explanation: Erst der komplette synchrone Code (1, 4). Dann leert die Event Loop die Microtask-Queue (3) und führt erst danach den Timer-Task aus (2).
  - type: multiple
    question: Welche Aussagen über Promises stimmen?
    options:
      - Ein Promise ist entweder pending, fulfilled oder rejected.
      - Ein erfülltes Promise kann später noch abgelehnt werden.
      - "`then` liefert immer ein neues Promise."
      - Wirft ein Callback in `then` einen Fehler, wird das nächste Promise der Kette abgelehnt.
    answers: [0, 2, 3]
    explanation: Ein Promise wechselt genau einmal von pending in einen Endzustand und bleibt dann dort. Genau deshalb lassen sich Promises zuverlässig verketten.
  - type: cloze
    text: "Callbacks aus then und catch kommen in die ___-Queue, Callbacks von setTimeout in die ___-Queue."
    blanks:
      - [Microtask, Microtasks]
      - [Task, Macrotask]
    explanation: Microtasks haben Vorrang – die Event Loop leert ihre Queue komplett, bevor der nächste Task läuft.
  - type: find-bug
    question: "`ergebnis` soll 30 sein, die Kette liefert aber `undefined`. Welche Zeile ist falsch?"
    language: js
    code: |
      ladeZahl()
        .then((zahl) => {
          zahl * 3;
        })
        .then((ergebnis) => console.log(ergebnis));
    bug_line: 3
    explanation: "Was ein then-Callback zurückgibt, wird zum Wert des nächsten Promise. Ohne `return` ist das `undefined`. Richtig: `return zahl * 3;` oder kurz `(zahl) => zahl * 3`."
tasks:
  - id: event-loop-reihenfolge
    type: steps
    title: Die Event Loop Schritt für Schritt
    description: |
      Verfolge diesen Code. Er läuft als Modul im Browser.

      ```js
      console.log("A");
      setTimeout(() => console.log("B"), 0);
      Promise.resolve()
        .then(() => console.log("C"))
        .then(() => console.log("D"));
      queueMicrotask(() => console.log("E"));
      console.log("F");
      ```
    steps:
      - situation: Der Code startet. Der Call Stack führt Zeile für Zeile aus.
        question: Welche Buchstaben erscheinen, bevor überhaupt ein Callback läuft?
        options: ["A, F", "A, B, F", "A, C, F", "A"]
        answer: 0
        explanation: Nur console.log("A") und console.log("F") sind synchron. setTimeout, then und queueMicrotask planen ihre Callbacks nur ein.
      - situation: "Der synchrone Code ist fertig. In der Microtask-Queue liegen die Callbacks für C und E, in der Task-Queue der Timer für B."
        question: Was läuft als Nächstes?
        options: ["B – der Timer hatte 0 ms", "C, dann E", "E, dann C"]
        answer: 1
        explanation: Microtasks kommen vor Tasks. Sie laufen in der Reihenfolge, in der sie eingereiht wurden – zuerst C, dann E.
      - situation: Als C fertig ist, wird das von then gelieferte Promise erfüllt – der Callback für D landet in der Microtask-Queue.
        question: Wann läuft D?
        options: ["Nach B", "Noch vor B, weil die Microtask-Queue komplett geleert wird", "Gar nicht"]
        answer: 1
        explanation: Die Event Loop leert die Microtask-Queue vollständig, auch neu hinzugekommene Microtasks. D läuft also nach E, aber vor B.
      - situation: Alle Microtasks sind abgearbeitet.
        question: Wie lautet die komplette Ausgabe?
        options: ["A F C E D B", "A F B C E D", "A C E D F B", "A F C D E B"]
        answer: 0
        explanation: Synchron A und F, dann die Microtasks C, E und D, zuletzt der Timer-Task B.
  - id: promise-helfer
    type: code
    language: js
    title: Eigene Promise-Helfer
    description: |
      Baue zwei Helfer, die Promises erzeugen bzw. verketten:

      1. `warte(ms, wert)` liefert ein Promise, das nach `ms` Millisekunden mit `wert` erfüllt wird.
         Bei einer negativen Zahl wird es sofort mit einem `RangeError` abgelehnt.
      2. `nacheinander(aufgaben)` bekommt ein Array von **Funktionen**, die jeweils ein Promise liefern. Es ruft sie
         **nacheinander** auf (die nächste erst, wenn die vorige erfüllt ist) und liefert ein Promise mit dem Array
         aller Ergebnisse in derselben Reihenfolge. Benutze hier nur `then` – `async/await` kommt in der nächsten Lektion.
    starter: |
      function warte(ms, wert) {
        setTimeout(() => wert, ms);
      }

      function nacheinander(aufgaben) {
        return Promise.resolve(aufgaben.map((aufgabe) => aufgabe()));
      }
    tests:
      - name: warte erfüllt nach der Zeit mit dem Wert
        code: 'const start = Date.now(); const w = await warte(30, "fertig"); assertEqual(w, "fertig"); assertTrue(Date.now() - start >= 25)'
      - name: warte lehnt negative Zeiten ab
        code: 'let fehler; try { await warte(-1, "x"); } catch (e) { fehler = e; } assertTrue(fehler instanceof RangeError)'
      - name: nacheinander liefert die Ergebnisse in Reihenfolge
        code: 'const r = await nacheinander([() => warte(30, "a"), () => warte(5, "b"), () => Promise.resolve("c")]); assertDeepEqual(r, ["a", "b", "c"])'
      - name: nacheinander startet die nächste Aufgabe erst nach der vorigen
        code: |
          const log = [];
          const aufgabe = (name, ms) => () => { log.push("start " + name); return warte(ms, name).then((x) => { log.push("ende " + name); return x; }); };
          await nacheinander([aufgabe("a", 20), aufgabe("b", 1)]);
          assertDeepEqual(log, ["start a", "ende a", "start b", "ende b"])
      - name: leeres Array ergibt leeres Ergebnis
        code: 'assertDeepEqual(await nacheinander([]), [])'
    hints:
      - "`return new Promise((resolve, reject) => { … });` – im Executor rufst du `setTimeout(() => resolve(wert), ms)` oder `reject(new RangeError(…))` auf."
      - "Für nacheinander baust du mit `reduce` eine Kette: Startwert ist `Promise.resolve([])`."
      - "`aufgaben.reduce((kette, aufgabe) => kette.then((ergebnisse) => aufgabe().then((x) => [...ergebnisse, x])), Promise.resolve([]))`"
    solution: |
      function warte(ms, wert) {
        return new Promise((resolve, reject) => {
          if (ms < 0) {
            reject(new RangeError("Die Wartezeit darf nicht negativ sein."));
            return;
          }
          setTimeout(() => resolve(wert), ms);
        });
      }

      function nacheinander(aufgaben) {
        return aufgaben.reduce(
          (kette, aufgabe) => kette.then((ergebnisse) => aufgabe().then((x) => [...ergebnisse, x])),
          Promise.resolve([]),
        );
      }
---
Du klickst auf „Laden“, und die Seite friert drei Sekunden ein: Kein Knopf reagiert, nicht einmal Scrollen
geht. Genau das passiert, wenn JavaScript auf etwas Langsames wartet und dabei alles andere blockiert.
Damit das nicht passiert, arbeitet JavaScript asynchron. In dieser Lektion lernst du die Werkzeuge dafür und
verstehst, in welcher Reihenfolge asynchroner Code wirklich läuft.

## Ein Thread, viele Aufgaben

JavaScript ist [[single-thread|single-threaded]]: Es führt immer nur **eine** Sache gleichzeitig aus. Was gerade
läuft, steht auf dem [[call-stack|Call Stack]]. Rechnet eine Funktion lange, kann der Browser in dieser Zeit
weder auf Klicks reagieren noch die Seite neu zeichnen.

Trotzdem kann JavaScript auf Netzwerk oder Timer warten, ohne zu blockieren. Der Trick: Das Warten erledigt
der Browser im Hintergrund. JavaScript sagt nur „Melde dich, wenn du fertig bist“ und macht sofort weiter.

```js
console.log("Start");
setTimeout(() => console.log("Timer fertig"), 1000);   // Browser zählt im Hintergrund
console.log("Ich warte nicht!");
// Ausgabe: Start → Ich warte nicht! → (1 Sekunde später) Timer fertig
```

Die Funktion, die später aufgerufen wird, ist ein [[callback|Callback]]. [[settimeout|`setTimeout`]],
Event-Listener und Netzwerkanfragen funktionieren alle nach diesem Prinzip.

> [!MERKSATZ]
> Asynchron heißt nicht „gleichzeitig in JavaScript“, sondern: Das Warten passiert außerhalb, und dein
> Callback läuft später, wenn der Call Stack frei ist.

## Von Callbacks zu Promises

Hängen mehrere asynchrone Schritte voneinander ab, verschachteln sich Callbacks immer tiefer. Jede Ebene
braucht eine eigene Fehlerbehandlung. Das nennt man [[callback-hoelle|Callback-Hölle]]:

```js
ladeNutzer(1, (fehler, nutzer) => {
  if (fehler) return zeigeFehler(fehler);
  ladeBestellungen(nutzer.id, (fehler, bestellungen) => {
    if (fehler) return zeigeFehler(fehler);
    ladeRechnung(bestellungen[0].id, (fehler, rechnung) => {
      if (fehler) return zeigeFehler(fehler);
      zeige(rechnung);
    });
  });
});
```

Ein [[promise|Promise]] löst das. Es ist ein Objekt für ein Ergebnis, das erst später feststeht – wie ein
Abholzettel beim Schuster. Ein Promise hat drei Zustände:

| Zustand | Bedeutung |
|---|---|
| `pending` | wartet noch |
| `fulfilled` | erfolgreich, mit einem Wert |
| `rejected` | gescheitert, mit einem Fehler |

Ein Promise wechselt genau **einmal** von `pending` in einen Endzustand.

## Promises erzeugen und verketten

Ältere Callback-Funktionen verpackst du mit `new Promise` in ein Promise. Der Executor bekommt zwei
Funktionen: `resolve` für Erfolg, `reject` für Fehler.

```js
function wuerfle() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const zahl = Math.ceil(Math.random() * 6);
      zahl === 1 ? reject(new Error("Eine 1 – verloren!")) : resolve(zahl);
    }, 300);
  });
}

wuerfle()
  .then((zahl) => zahl * 10)                  // Rückgabewert wird Wert des nächsten Promise
  .then((punkte) => console.log("Punkte:", punkte))
  .catch((fehler) => console.log("Fehler:", fehler.message))   // fängt Fehler der ganzen Kette
  .finally(() => console.log("Spiel vorbei"));
```

`then` liefert immer ein **neues** Promise. Gibst du im Callback einen Wert zurück, wird das nächste Promise
damit erfüllt. Gibst du ein Promise zurück, wartet die Kette darauf. Wirft der Callback, springt die Kette zum
nächsten `catch`. Die Callback-Hölle von oben wird so flach:
`ladeNutzer(1).then((n) => ladeBestellungen(n.id)).then((b) => ladeRechnung(b[0].id)).then(zeige).catch(zeigeFehler)`.

> [!FEHLER]
> Ein vergessenes `return` im `then`-Callback ist der häufigste Promise-Fehler. Die Kette läuft weiter, aber
> mit `undefined` – und wartet nicht auf das innere Promise.

## Die Event Loop

Wer entscheidet, wann ein Callback läuft? Die [[event-loop|Event Loop]]. Sie verwaltet zwei Warteschlangen:

- Die [[microtask|Microtask-Queue]] für Promise-Callbacks (`then`, `catch`, `finally`, Code nach `await`)
  und `queueMicrotask`.
- Die [[task-queue|Task-Queue]] für Timer, Events wie Klicks und Netzwerk-Callbacks.

![Die Event Loop: Der Call Stack führt Code aus, der Browser wartet im Hintergrund, fertige Callbacks landen in der Microtask- oder Task-Queue.](/assets/javascript/event-loop.svg)

Die Regel lautet: Wenn der Call Stack leer ist, führt die Event Loop **alle** Microtasks aus, dann **einen**
Task, dann zeichnet der Browser bei Bedarf neu – und von vorn.

```js
console.log("1 synchron");
setTimeout(() => console.log("4 Task"), 0);
Promise.resolve().then(() => console.log("3 Microtask"));
console.log("2 synchron");
```

`setTimeout(fn, 0)` heißt deshalb nicht „sofort“, sondern „frühestens in der nächsten Runde“.

> [!PRAXIS]
> Lange Berechnungen blockieren die Event Loop – die Oberfläche friert ein. In der Praxis teilt man sie in
> Stücke auf oder verlagert sie in einen [[web-worker|Web Worker]]. Asynchronität hilft nur beim **Warten**, nicht beim Rechnen.

## Zusammenfassung

- JavaScript führt immer nur eine Sache aus; gewartet wird im Hintergrund, Callbacks laufen später.
- Verschachtelte Callbacks führen zur Callback-Hölle; Promises machen daraus eine flache Kette.
- Ein Promise ist pending, fulfilled oder rejected – und wechselt genau einmal.
- `then` liefert ein neues Promise; der Rückgabewert des Callbacks wird dessen Wert, Fehler springen zu `catch`.
- Die Event Loop leert erst die Microtask-Queue komplett, dann führt sie einen Task aus.
- Reihenfolge: synchroner Code → Microtasks (Promises) → Tasks (Timer, Events).
