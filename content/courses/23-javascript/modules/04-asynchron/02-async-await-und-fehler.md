---
title: async/await, Kombinatoren und Fehler
summary: Asynchronen Code mit async/await lesbar schreiben, Aufgaben parallel statt nacheinander starten, mit Promise.all, allSettled, race und any kombinieren und Fehler mit eigenen Fehlerklassen sauber behandeln.
duration: 25
sources:
  - title: MDN – async function
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
  - title: MDN – Promise.all()
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
  - title: MDN – Promise.allSettled()
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled
  - title: MDN – Error (custom error types und cause)
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
quiz:
  - type: single
    question: "Was liefert der Aufruf `hole()` bei `async function hole() { return 42; }`?"
    options: ["Die Zahl 42", "Ein Promise, das mit 42 erfüllt wird", "undefined", "Einen Fehler, weil await fehlt"]
    answer: 1
    explanation: Eine async-Funktion liefert immer ein Promise. Ein normaler Rückgabewert wird automatisch darin verpackt.
  - type: match
    question: Welcher Kombinator passt zu welchem Verhalten?
    pairs:
      - { left: "Promise.all", right: "alle müssen klappen, sonst sofort Fehler" }
      - { left: "Promise.allSettled", right: "wartet auf alle und meldet je Erfolg oder Fehler" }
      - { left: "Promise.race", right: "das erste fertige Promise gewinnt – egal ob Erfolg oder Fehler" }
      - { left: "Promise.any", right: "der erste Erfolg gewinnt, Fehler nur wenn alle scheitern" }
    explanation: Mit diesen vier Werkzeugen lassen sich fast alle Kombinationen paralleler Aufgaben ausdrücken.
  - type: single
    question: "Zwei unabhängige Anfragen dauern je 1 Sekunde. Wie lange dauert `const a = await ladeA(); const b = await ladeB();` ungefähr?"
    options: ["1 Sekunde", "2 Sekunden", "0 Sekunden"]
    answer: 1
    explanation: "Jedes await wartet, bevor die nächste Zeile startet – die Anfragen laufen nacheinander. Parallel geht es mit `const [a, b] = await Promise.all([ladeA(), ladeB()]);` in etwa 1 Sekunde."
  - type: find-bug
    question: Der Fehler beim Speichern soll im catch landen, stattdessen erscheint „Gespeichert!“ und später eine unbehandelte Ablehnung. Welche Zeile ist falsch?
    language: js
    code: |
      async function speichereProfil(profil) {
        try {
          sendeAnServer(profil);
          console.log("Gespeichert!");
        } catch (fehler) {
          console.error("Speichern fehlgeschlagen:", fehler.message);
        }
      }
    bug_line: 3
    explanation: "Ohne `await` wartet die Funktion nicht auf das Promise. Die Ablehnung passiert erst später, wenn der try-Block längst verlassen ist. Richtig: `await sendeAnServer(profil);`."
  - type: multiple
    question: Was gilt für eine eigene Fehlerklasse `class HttpError extends Error`?
    options:
      - "`fehler instanceof HttpError` und `fehler instanceof Error` sind beide true."
      - Mit `{ cause }` als zweitem Argument von `super` kannst du den ursprünglichen Fehler anhängen.
      - Sie kann eigene Felder wie `status` haben.
      - Eigene Fehlerklassen funktionieren nicht mit try/catch.
    answers: [0, 1, 2]
    explanation: Eigene Fehlerklassen verhalten sich wie normale Fehler, tragen aber zusätzliche Informationen und lassen sich gezielt mit instanceof unterscheiden.
tasks:
  - id: async-werkzeuge
    type: code
    language: js
    title: Laden mit Zeitlimit und Teilerfolgen
    description: |
      Die Hilfsfunktion `warte(ms, wert)` und die Klasse `ZeitlimitFehler` sind vorgegeben. Schreibe mit
      `async/await` und den Promise-Kombinatoren:

      1. `mitZeitlimit(promise, ms)` liefert das Ergebnis von `promise`. Dauert es länger als `ms`, wird
         stattdessen mit einem `ZeitlimitFehler` abgelehnt. (Tipp: `Promise.race`)
      2. `ladeAlle(lader)` bekommt ein Objekt aus Funktionen, z. B. `{ nutzer: () => …, posts: () => … }`. Alle
         Funktionen werden **gleichzeitig** gestartet. Ergebnis ist ein Objekt mit
         - `daten`: den Werten aller erfolgreichen Lader, z. B. `{ nutzer: {…} }`,
         - `fehler`: den Fehlermeldungen (`message`) aller gescheiterten Lader, z. B. `{ posts: "Server down" }`.
    starter: |
      const warte = (ms, wert) => new Promise((resolve) => setTimeout(() => resolve(wert), ms));

      class ZeitlimitFehler extends Error {
        constructor(ms) {
          super(`Zeitlimit von ${ms} ms überschritten`);
          this.name = "ZeitlimitFehler";
        }
      }

      async function mitZeitlimit(promise, ms) {
        return promise;
      }

      async function ladeAlle(lader) {
        const daten = {};
        for (const [name, laden] of Object.entries(lader)) {
          daten[name] = await laden();
        }
        return { daten, fehler: {} };
      }
    tests:
      - name: mitZeitlimit liefert schnelle Ergebnisse
        code: 'assertEqual(await mitZeitlimit(warte(5, "ok"), 100), "ok")'
      - name: mitZeitlimit bricht langsame Promises ab
        code: 'let fehler; try { await mitZeitlimit(warte(200, "zu spät"), 20); } catch (e) { fehler = e; } assertTrue(fehler instanceof ZeitlimitFehler); assertTrue(fehler instanceof Error)'
      - name: ladeAlle sammelt Daten und Fehler
        code: |
          const ergebnis = await ladeAlle({
            nutzer: () => warte(10, { name: "Ada" }),
            posts: () => Promise.reject(new Error("Server down")),
            likes: async () => 7,
          });
          assertDeepEqual(ergebnis, { daten: { nutzer: { name: "Ada" }, likes: 7 }, fehler: { posts: "Server down" } })
      - name: ladeAlle startet alle gleichzeitig
        code: 'const start = Date.now(); await ladeAlle({ a: () => warte(60, 1), b: () => warte(60, 2), c: () => warte(60, 3) }); assertTrue(Date.now() - start < 150, "Die Lader liefen nacheinander statt gleichzeitig.")'
      - name: leeres Objekt
        code: 'assertDeepEqual(await ladeAlle({}), { daten: {}, fehler: {} })'
    hints:
      - "Zeitlimit: `Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new ZeitlimitFehler(ms)), ms))])`."
      - "Starte alle mit `const namen = Object.keys(lader); const ergebnisse = await Promise.allSettled(namen.map((n) => lader[n]()));`"
      - "Jedes Ergebnis hat `status` (`\"fulfilled\"` oder `\"rejected\"`) und `value` bzw. `reason` – der Index passt zu `namen`."
    solution: |
      const warte = (ms, wert) => new Promise((resolve) => setTimeout(() => resolve(wert), ms));

      class ZeitlimitFehler extends Error {
        constructor(ms) {
          super(`Zeitlimit von ${ms} ms überschritten`);
          this.name = "ZeitlimitFehler";
        }
      }

      async function mitZeitlimit(promise, ms) {
        let timer;
        const zeitlimit = new Promise((_, reject) => {
          timer = setTimeout(() => reject(new ZeitlimitFehler(ms)), ms);
        });
        try {
          return await Promise.race([promise, zeitlimit]);
        } finally {
          clearTimeout(timer);
        }
      }

      async function ladeAlle(lader) {
        const namen = Object.keys(lader);
        const ergebnisse = await Promise.allSettled(namen.map((name) => lader[name]()));
        const daten = {};
        const fehler = {};
        ergebnisse.forEach((ergebnis, i) => {
          if (ergebnis.status === "fulfilled") {
            daten[namen[i]] = ergebnis.value;
          } else {
            fehler[namen[i]] = ergebnis.reason.message;
          }
        });
        return { daten, fehler };
      }
  - id: kombinator-waehlen
    type: dragdrop
    title: Welcher Kombinator passt?
    description: Ordne jede Situation aus dem Alltag dem passenden Promise-Kombinator zu.
    targets:
      - { id: all, label: "Promise.all" }
      - { id: allsettled, label: "Promise.allSettled" }
      - { id: race, label: "Promise.race" }
      - { id: any, label: "Promise.any" }
    items:
      - { label: "Profil und Einstellungen laden – ohne beide kann die Seite nicht starten", target: all }
      - { label: "Zehn Bilder hochladen und danach melden, welche geklappt haben", target: allsettled }
      - { label: "Eine Anfrage nach 5 Sekunden mit einem Zeitlimit-Fehler abbrechen", target: race }
      - { label: "Dieselbe Datei von drei Spiegelservern holen – der erste Erfolg reicht", target: any }
    hints:
      - Frag dich jeweils, ob ein einziger Fehler alles abbrechen soll und ob du auf alle Ergebnisse warten musst.
---
Promise-Ketten sind besser als Callback-Höllen – aber `.then(…).then(…).catch(…)` liest sich immer noch
anders als normaler Code. Mit `async/await` sieht asynchroner Code aus wie synchroner: von oben nach unten,
mit ganz normalem `try/catch`. In dieser Lektion lernst du außerdem, mehrere Aufgaben gleichzeitig zu
starten und Fehler so zu behandeln, dass du sie später gezielt auswerten kannst.

## async und await

Eine Funktion mit dem Schlüsselwort `async` liefert **immer** ein [[promise|Promise]]. In ihr darfst du
`await` benutzen: Es pausiert die Funktion, bis das Promise erfüllt ist, und liefert dessen Wert. Diese
Schreibweise heißt [[async-await|async/await]].

```js
const warte = (ms, wert) => new Promise((resolve) => setTimeout(() => resolve(wert), ms));

async function begruesse() {
  console.log("Lade Namen …");
  const name = await warte(500, "Ada");     // pausiert nur diese Funktion
  return `Hallo ${name}`;                    // wird zum Wert des Promise
}

begruesse().then(console.log);
console.log("Ich laufe sofort weiter");
// Ausgabe: Lade Namen … → Ich laufe sofort weiter → (0,5 s später) Hallo Ada
```

`await` blockiert **nicht** den Browser. Die Funktion gibt die Kontrolle ab, die Event Loop arbeitet weiter.
Der Rest der Funktion läuft später als Microtask. In [[es-module|ES-Modulen]] darfst du `await` sogar auf
oberster Ebene schreiben.

> [!MERKSATZ]
> `async` macht aus dem Rückgabewert ein Promise. `await` packt ein Promise wieder aus – aber nur innerhalb
> einer async-Funktion oder auf Modulebene.

## Nacheinander oder gleichzeitig?

Jedes `await` wartet, bevor die nächste Zeile beginnt. Sind Aufgaben voneinander unabhängig, verschenkst du
damit Zeit:

```js
const warte = (ms, wert) => new Promise((resolve) => setTimeout(() => resolve(wert), ms));

console.time("nacheinander");
const a = await warte(300, "Profil");
const b = await warte(300, "Einstellungen");
console.timeEnd("nacheinander");                     // ca. 600 ms

console.time("gleichzeitig");
const [c, d] = await Promise.all([warte(300, "Profil"), warte(300, "Einstellungen")]);
console.timeEnd("gleichzeitig");                     // ca. 300 ms
```

Die Faustregel: Hängt Schritt 2 vom Ergebnis von Schritt 1 ab (erst den Nutzer, dann **seine** Bestellungen),
musst du nacheinander warten. Sonst starte alles zuerst und warte dann gemeinsam.

> [!FEHLER]
> `await` in einer `for`-Schleife über unabhängige Anfragen ist der Klassiker für langsame Seiten. Und
> `array.forEach(async …)` wartet gar nicht – `forEach` ignoriert die zurückgegebenen Promises.

## Die Promise-Kombinatoren

Für mehrere Promises gibt es vier [[promise-kombinator|Kombinatoren]]. Alle nehmen ein Array von Promises:

| Kombinator | Erfüllt mit | Lehnt ab, wenn … |
|---|---|---|
| `Promise.all` | Array aller Werte | **ein** Promise scheitert (sofort) |
| `Promise.allSettled` | Array von `{ status, value }` bzw. `{ status, reason }` | nie |
| `Promise.race` | dem ersten fertigen Ergebnis | das erste fertige scheitert |
| `Promise.any` | dem ersten **Erfolg** | **alle** scheitern (`AggregateError`) |

```js
const ok = (ms, w) => new Promise((r) => setTimeout(() => r(w), ms));
const kaputt = (ms, text) => new Promise((_, r) => setTimeout(() => r(new Error(text)), ms));

const ergebnisse = await Promise.allSettled([ok(100, "Bild 1"), kaputt(50, "Bild 2 zu groß")]);
for (const e of ergebnisse) {
  console.log(e.status, e.status === "fulfilled" ? e.value : e.reason.message);
}
// fulfilled Bild 1
// rejected Bild 2 zu groß
console.log(await Promise.any([kaputt(10, "Server A"), ok(50, "Server B")]));   // Server B
```

## Fehler behandeln mit try/catch

Mit `await` fängst du abgelehnte Promises mit ganz normalem [[try-catch|try/catch]] ab. `finally` läuft in
jedem Fall – ideal, um etwa einen Ladezustand zu beenden:

```js
async function zeigeProfil(id) {
  ladeanzeige.hidden = false;
  try {
    const profil = await ladeProfil(id);
    zeige(profil);
  } catch (fehler) {
    zeigeMeldung(`Profil konnte nicht geladen werden: ${fehler.message}`);
  } finally {
    ladeanzeige.hidden = true;
  }
}
```

Wird ein abgelehntes Promise nirgends behandelt, meldet der Browser eine
[[unhandled-rejection|unbehandelte Ablehnung]] in der Konsole; Node.js beendet das Programm sogar. Jede
Promise-Kette braucht deshalb am Ende ein `catch` – oder ein `await` innerhalb eines `try`.

## Eigene Fehlerklassen

Nicht jeder Fehler ist gleich: Auf „nicht gefunden“ reagierst du anders als auf „keine Verbindung“. Mit einer
[[eigene-fehlerklasse|eigenen Fehlerklasse]] transportiert ein Fehler zusätzliche Informationen, und du
unterscheidest ihn mit [[instanceof|`instanceof`]]:

```js run
class HttpError extends Error {
  constructor(status, nachricht, optionen) {
    super(nachricht, optionen);      // optionen kann { cause } enthalten
    this.name = "HttpError";
    this.status = status;
  }
}

try {
  throw new HttpError(404, "Profil nicht gefunden", { cause: new Error("GET /profil/7") });
} catch (fehler) {
  if (fehler instanceof HttpError && fehler.status === 404) {
    console.log("Zeige Hinweis:", fehler.message, "– Ursache:", fehler.cause.message);
  } else {
    throw fehler;                    // unbekannte Fehler weiterwerfen, nicht verschlucken
  }
}
```

Mit der Option `cause` hängst du den ursprünglichen Fehler an, ohne ihn zu verlieren.

> [!PRAXIS]
> API-Clients in Frontend-Projekten werfen fast immer eine eigene Fehlerklasse mit HTTP-Status. Die Oberfläche
> entscheidet dann per `instanceof`, ob sie „Bitte erneut anmelden“, „Nicht gefunden“ oder „Später erneut
> versuchen“ anzeigt.

## Zusammenfassung

- `async`-Funktionen liefern immer ein Promise; `await` wartet auf ein Promise, ohne den Browser zu blockieren.
- Unabhängige Aufgaben startest du gleichzeitig und wartest gemeinsam mit `Promise.all`.
- `all` scheitert beim ersten Fehler, `allSettled` meldet alles, `race` nimmt das erste Ergebnis, `any` den ersten Erfolg.
- Mit `await` fängst du Fehler per `try/catch/finally`; ein vergessenes `await` lässt Fehler am `catch` vorbeilaufen.
- Unbehandelte Ablehnungen erscheinen als Fehler – jede Kette braucht eine Fehlerbehandlung.
- Eigene Fehlerklassen (`extends Error`) tragen Zusatzinfos wie `status` und mit `cause` die Ursache.
