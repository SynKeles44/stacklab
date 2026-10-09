---
title: Die Event Loop
summary: Wie Node.js mit einem einzigen Thread viele Aufgaben gleichzeitig erledigt – Call Stack, Task-Queue, Microtasks und nicht blockierendes I/O.
duration: 25
sources:
  - title: The Node.js Event Loop
    url: https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick
  - title: Overview of Blocking vs Non-Blocking
    url: https://nodejs.org/en/learn/asynchronous-work/overview-of-blocking-vs-non-blocking
  - title: Understanding process.nextTick()
    url: https://nodejs.org/en/learn/asynchronous-work/understanding-processnexttick
  - title: Don't Block the Event Loop
    url: https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop
quiz:
  - type: single
    question: "Welche Ausgabe erzeugt dieser Code? `setTimeout(() => console.log(\"B\"), 0); console.log(\"A\");`"
    options: ["B, dann A", "A, dann B", "Nur A", "Das ist zufällig"]
    answer: 1
    explanation: Der Timer-Callback wartet in der Task-Queue. Die Event Loop holt ihn erst, wenn der Call Stack leer ist – also nach console.log("A").
  - type: single
    question: "Was gibt dieser Code aus? `setTimeout(() => console.log(\"T\"), 0); Promise.resolve().then(() => console.log(\"P\")); console.log(\"S\");`"
    options: ["S, T, P", "S, P, T", "P, S, T", "T, P, S"]
    answer: 1
    explanation: Erst der synchrone Code (S), dann alle Microtasks (P), dann der nächste Task aus der Task-Queue (T).
  - type: multiple
    question: Welche Aussagen stimmen?
    options:
      - Die Event Loop nimmt nur dann einen neuen Callback, wenn der Call Stack leer ist.
      - Eine lange Berechnung in deinem Code blockiert auch alle Timer und Anfragen.
      - "`setTimeout(fn, 0)` führt fn sofort aus, noch vor dem restlichen Code."
      - Code nach `await` läuft als Microtask weiter.
    answers: [0, 1, 3]
    explanation: Ein Timer mit 0 ms bedeutet „so bald wie möglich, aber erst wenn der Stack leer ist“ – nie sofort.
  - type: find-bug
    question: Dieser Server antwortet manchmal sekundenlang gar nicht. Welche Zeile ist das Problem?
    language: js
    code: |
      import http from "node:http";
      import fs from "node:fs";
      http.createServer((req, res) => {
        const daten = fs.readFileSync("riesig.csv", "utf8");
        res.end(`Zeilen: ${daten.split("\n").length}`);
      }).listen(3000);
    bug_line: 4
    explanation: readFileSync blockiert den einzigen Thread, bis die große Datei gelesen ist. In der Zeit kann der Server keine andere Anfrage beantworten. Besser – await readFile aus node:fs/promises.
tasks:
  - id: event-loop-beschriften
    type: diagram
    title: Beschrifte das Event-Loop-Modell
    description: |
      Ordne den fünf Bereichen den richtigen Namen zu. Die Inhalte der Kästen und die Pfeile
      helfen dir dabei.
    image: /assets/node-runtimes-paketmanager/event-loop-leer.svg
    slots:
      - { x: 17, y: 16, answer: Call Stack }
      - { x: 50, y: 18, answer: libuv / Betriebssystem }
      - { x: 83, y: 16, answer: Microtask-Queue }
      - { x: 83, y: 55, answer: Task-Queue }
      - { x: 50, y: 70, answer: Event Loop }
    distractors: [V8-Compiler, npm-Registry]
    hints:
      - In den Kasten mit den gestapelten Funktionsaufrufen gehört der Call Stack.
      - Promise.then landet in einer anderen Warteschlange als ein setTimeout-Callback.
  - id: event-loop-simulieren
    type: code
    language: js
    title: Simuliere die Event Loop
    description: |
      Schreibe `reihenfolge(aufgaben)`. Die Funktion bekommt die Aufgaben eines Programms in der
      Reihenfolge, in der sie im Code stehen, und gibt die **Namen** in der Reihenfolge zurück, in
      der Node.js sie ausführt.

      | typ | entspricht | läuft … |
      |---|---|---|
      | `"sync"` | normaler Code | sofort, in Code-Reihenfolge |
      | `"tick"` | `process.nextTick` | nach dem synchronen Code, vor allen Microtasks |
      | `"micro"` | `Promise.then` | nach allen Ticks |
      | `"macro"` | `setTimeout(…, 0)` | danach, einer nach dem anderen |

      Eine `macro`-Aufgabe kann ein Feld `danach` haben: Namen von Microtasks, die **in diesem
      Timer-Callback** angelegt werden. Sie laufen direkt nach ihrem Timer – vor dem nächsten Timer.
    starter: |
      function reihenfolge(aufgaben) {
        const ergebnis = [];
        // 1. synchroner Code
        // 2. nextTick-Queue
        // 3. Microtask-Queue
        // 4. Timer – nach jedem Timer seine Microtasks
        return ergebnis;
      }
    tests:
      - name: Klassisches Beispiel
        code: |
          assertDeepEqual(reihenfolge([
            { typ: "sync", name: "A" },
            { typ: "macro", name: "Timer" },
            { typ: "micro", name: "Promise" },
            { typ: "tick", name: "Tick" },
            { typ: "sync", name: "B" }
          ]), ["A", "B", "Tick", "Promise", "Timer"])
      - name: Leeres Programm
        code: assertDeepEqual(reihenfolge([]), [])
      - name: Microtasks aus einem Timer laufen vor dem nächsten Timer
        code: |
          assertDeepEqual(reihenfolge([
            { typ: "macro", name: "T1", danach: ["P1"] },
            { typ: "macro", name: "T2" },
            { typ: "sync", name: "S" }
          ]), ["S", "T1", "P1", "T2"])
      - name: Mehrere Ticks und Microtasks behalten ihre Reihenfolge
        code: |
          assertDeepEqual(reihenfolge([
            { typ: "micro", name: "m1" },
            { typ: "tick", name: "t1" },
            { typ: "micro", name: "m2" },
            { typ: "tick", name: "t2" }
          ]), ["t1", "t2", "m1", "m2"])
    hints:
      - "Filtere die Liste viermal: `aufgaben.filter(a => a.typ === \"sync\")` usw. – filter behält die Reihenfolge."
      - "Bei jedem Timer: erst `ergebnis.push(t.name)`, dann `ergebnis.push(...(t.danach ?? []))`."
    solution: |
      ```js
      function reihenfolge(aufgaben) {
        const ergebnis = [];
        const nach = (typ) => aufgaben.filter((a) => a.typ === typ);
        for (const a of nach("sync")) ergebnis.push(a.name);
        for (const a of nach("tick")) ergebnis.push(a.name);
        for (const a of nach("micro")) ergebnis.push(a.name);
        for (const t of nach("macro")) {
          ergebnis.push(t.name);
          ergebnis.push(...(t.danach ?? []));
        }
        return ergebnis;
      }
      ```
---

Stell dir eine Bäckerei mit nur **einer** Verkäuferin vor. Würde sie bei jeder Bestellung vor dem
Ofen warten, stünde die Schlange bis auf die Straße. Also schiebt sie das Brot hinein, stellt einen
Wecker und bedient die nächste Kundin. Genau so arbeitet Node.js – mit der **Event Loop**.

## Ein Thread und der Call Stack

Dein JavaScript-Code läuft in Node.js auf einem einzigen [[thread|Thread]]: Es wird immer genau
**eine** Anweisung abgearbeitet. Lange Wartezeiten – auf Dateien, Datenbanken, das Netzwerk –
übernimmt dein Code nicht selbst, sondern gibt sie an [[libuv|libuv]] und das Betriebssystem ab.

Welche [[funktion|Funktion]] gerade läuft, merkt sich Node.js im [[call-stack|Call Stack]]. Jeder
Aufruf legt einen Rahmen oben auf den Stapel, jedes `return` nimmt ihn wieder herunter.

```js title="stapel.js"
function begruesse(name) {
  console.log(`Hallo, ${name}`);   // Stack: console.log, begruesse, main
}
function main() {
  begruesse("Ada");                // Stack: begruesse, main
}
main();                            // Stack: main
```

Tritt ein Fehler auf, zeigt dir Node.js genau diesen Stapel als [[stack-trace|Stack Trace]].

## setTimeout und die Task-Queue

`setTimeout` gehört nicht zu V8, sondern zu Node.js. Beim Aufruf passiert Folgendes:

1. Node.js übergibt den Timer an libuv und merkt sich deinen [[callback|Callback]].
2. `setTimeout` kehrt **sofort** zurück, dein Code läuft weiter.
3. Ist die Zeit abgelaufen, kommt der Callback in die [[task-queue|Task-Queue]].
4. Die [[event-loop|Event Loop]] holt ihn erst, wenn der Call Stack **leer** ist.

```js
console.log("A");
setTimeout(() => console.log("C"), 0);
console.log("B");
// Ausgabe: A, B, C
```

![Das Event-Loop-Modell: Call Stack, libuv, Microtask-Queue, Task-Queue und Event Loop](/assets/node-runtimes-paketmanager/event-loop.svg)

> [!FEHLER]
> **„setTimeout mit 0 läuft sofort.“** Nein: Die Zeit ist eine **Mindestwartezeit**. Der Callback
> läuft erst, wenn der gesamte synchrone Code durch ist – und später, wenn der Thread beschäftigt ist.

## Microtasks haben Vorfahrt

Callbacks eines [[promise|Promise]] (`.then()`), `queueMicrotask()` und Code nach `await`
([[async-await|async/await]]) landen in der [[microtask|Microtask-Queue]]. Nach dem synchronen
Code **und nach jedem einzelnen Task** arbeitet Node.js diese Queue komplett ab.

| Reihenfolge | Was? | Beispiel |
|---|---|---|
| 1 | Synchroner Code | `console.log()` |
| 2 | nextTick-Queue | `process.nextTick(fn)` |
| 3 | Microtasks | `Promise.then`, `await` |
| 4 | Ein Task, dann wieder 2 und 3 | `setTimeout`, I/O-Callbacks, `setImmediate` |

```js title="reihenfolge.mjs"
console.log("sync");
setTimeout(() => console.log("timeout"), 0);
Promise.resolve().then(() => console.log("promise"));
process.nextTick(() => console.log("tick"));
// sync → tick → promise → timeout
```

Achtung: Ob im Hauptskript zuerst `setTimeout(fn, 0)` oder `setImmediate(fn)` läuft, ist **nicht
garantiert**. Verlass dich nie auf diese Reihenfolge.

> [!MERKSATZ]
> **Synchroner Code → nextTick → Microtasks → nächster Task** – und nach jedem Task wieder alle
> Microtasks. Mit dieser Regel sagst du jede Ausgabe-Reihenfolge voraus.

## Nicht blockierendes I/O

Jetzt verstehst du, warum Node.js auf [[non-blocking-io|nicht blockierendes I/O]] setzt:

```js title="vergleich.mjs"
import fs from "node:fs";
import { readFile } from "node:fs/promises";

const a = fs.readFileSync("gross.log", "utf8");   // Thread steht still
const b = await readFile("gross.log", "utf8");    // Thread ist frei
```

Bei `readFile` übergibt Node.js das Lesen an libuv. Während gewartet wird, kann die Event Loop
andere Callbacks ausführen – etwa die nächste Anfrage an deinen Server.

> [!PRAXIS]
> Faustregel aus echten Projekten: In Skripten, die einmal laufen, sind synchrone Funktionen
> okay. In Servern nutzt du nur die asynchronen Varianten – eine einzige blockierende Zeile lässt
> sonst alle anderen Anfragen warten.

## Zusammenfassung

- Dein Code läuft auf **einem Thread**; der **Call Stack** zeigt, welche Funktion gerade läuft.
- Asynchrone Funktionen kehren sofort zurück; fertige Callbacks warten in der **Task-Queue**.
- Die **Event Loop** holt Callbacks nur, wenn der Call Stack leer ist.
- **Microtasks** (Promises, `await`) laufen vor dem nächsten Task, `nextTick` noch davor.
- Blockierender Code hält alles an – in Servern immer `node:fs/promises` und `await` nutzen.
