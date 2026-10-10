---
title: Daten laden mit fetch und AbortController
summary: HTTP-Anfragen mit fetch senden, JSON lesen und schicken, HTTP-Fehler richtig erkennen und laufende Anfragen mit AbortController und Zeitlimits abbrechen.
duration: 25
sources:
  - title: MDN – Using the Fetch API
    url: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
  - title: MDN – Response.ok
    url: https://developer.mozilla.org/en-US/docs/Web/API/Response/ok
  - title: MDN – AbortController
    url: https://developer.mozilla.org/en-US/docs/Web/API/AbortController
  - title: MDN – AbortSignal.timeout()
    url: https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static
quiz:
  - type: single
    question: "Der Server antwortet auf `await fetch(\"/api/profil/99\")` mit Status 404. Was passiert?"
    options:
      - fetch wirft einen Fehler.
      - fetch liefert eine Response mit `ok === false` und `status === 404`.
      - fetch liefert `null`.
      - Der Browser lädt die Seite neu.
    answer: 1
    explanation: fetch lehnt nur bei Netzwerkproblemen (keine Verbindung, Abbruch, blockierte Anfrage) ab. Jede Antwort des Servers – auch 404 oder 500 – ist ein erfolgreiches fetch. Du musst `response.ok` selbst prüfen.
  - type: multiple
    question: Was brauchst du, um ein Objekt als JSON per POST zu senden?
    options:
      - "`method: \"POST\"`"
      - "Den Header `Content-Type: application/json`"
      - "`body: JSON.stringify(objekt)`"
      - "`body: objekt` – fetch wandelt Objekte automatisch um"
    answers: [0, 1, 2]
    explanation: fetch wandelt Objekte nicht automatisch in JSON um. Ohne JSON.stringify käme der Text „[object Object]“ beim Server an.
  - type: cloze
    text: "Eine laufende Anfrage brichst du ab, indem du `controller.___()` aufrufst. fetch lehnt dann mit einem Fehler namens ___ ab."
    blanks:
      - [abort]
      - [AbortError]
    explanation: Das Signal des AbortControllers wird an fetch übergeben. abort() bricht ab, der Fehler hat den Namen AbortError.
  - type: find-bug
    question: Die Funktion soll bei HTTP-Fehlern einen Fehler werfen, liefert bei 500 aber die Fehlerseite des Servers als Daten zurück. Welche Zeile fehlt bzw. ist falsch?
    language: js
    code: |
      async function ladeKurse() {
        const response = await fetch("/api/kurse");
        if (!response) {
          throw new Error("Laden fehlgeschlagen");
        }
        return response.json();
      }
    bug_line: 3
    explanation: "Eine Response ist immer ein Objekt, `!response` ist also nie true. Prüfen musst du `!response.ok` – das ist false bei allen Statuscodes außerhalb von 200–299."
tasks:
  - id: aufgabe-anlegen
    type: request
    title: Eine Aufgabe per POST anlegen
    description: |
      Die API unter `https://api.example.com` verwaltet Aufgaben. Baue die Anfrage, die dieser Code abschicken
      würde:

      ```js
      await fetch("https://api.example.com/aufgaben", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titel: "fetch lernen", erledigt: false }),
      });
      ```
    base_url: https://api.example.com
    expected:
      method: POST
      path: "^/aufgaben/?$"
      headers: { Content-Type: "application/json" }
      body_contains: ['"titel"', '"erledigt"']
    response:
      status: 201
      body: '{"id": 42, "titel": "fetch lernen", "erledigt": false}'
    hints:
      - Methode POST, Pfad /aufgaben, Header Content-Type mit application/json.
      - 'Der Body ist JSON: {"titel": "fetch lernen", "erledigt": false}'
  - id: api-client
    type: code
    language: js
    title: Ein kleiner API-Client mit Abbruch
    description: |
      Damit der Code ohne Netzwerk testbar ist, bekommt er die fetch-Funktion als Parameter (`fetchFn`).
      Die Tests übergeben eine nachgebaute Funktion, die echte `Response`-Objekte liefert.

      1. `class HttpFehler extends Error` – der Konstruktor bekommt `status` und speichert ihn als Eigenschaft.
         Die Nachricht lautet `` `HTTP ${status}` ``, `name` ist `"HttpFehler"`.
      2. `holeJson(url, { fetchFn, signal } = {})` ruft `fetchFn(url, { signal })` auf. Ist die Antwort nicht `ok`,
         wirft die Funktion einen `HttpFehler` mit dem Status. Sonst liefert sie die gelesenen JSON-Daten.
      3. `erstelleSuche(fetchFn)` liefert eine Funktion `suche(begriff)`. Sie lädt
         `/api/suche?q=<begriff>` (Begriff mit `encodeURIComponent` kodiert) über `holeJson`. Startet eine neue
         Suche, während die vorige noch läuft, wird die vorige mit einem `AbortController` **abgebrochen**.
    starter: |
      class HttpFehler extends Error {}

      async function holeJson(url, { fetchFn, signal } = {}) {
        const response = await fetchFn(url, { signal });
        return response.json();
      }

      function erstelleSuche(fetchFn) {
        return (begriff) => holeJson("/api/suche?q=" + begriff, { fetchFn });
      }
    tests:
      - name: holeJson liefert die Daten
        code: |
          const fetchFn = async (url) => new Response(JSON.stringify({ url, ok: true }), { status: 200 });
          assertDeepEqual(await holeJson("/api/kurse", { fetchFn }), { url: "/api/kurse", ok: true })
      - name: holeJson wirft HttpFehler bei 404
        code: |
          const fetchFn = async () => new Response("nicht da", { status: 404 });
          let fehler;
          try { await holeJson("/api/x", { fetchFn }); } catch (e) { fehler = e; }
          assertTrue(fehler instanceof HttpFehler, "Es wurde kein HttpFehler geworfen.");
          assertTrue(fehler instanceof Error);
          assertEqual(fehler.status, 404);
          assertEqual(fehler.message, "HTTP 404");
          assertEqual(fehler.name, "HttpFehler")
      - name: Suchbegriff wird kodiert
        code: |
          let gerufen;
          const fetchFn = async (url) => { gerufen = url; return new Response("[]"); };
          await erstelleSuche(fetchFn)("C# & JS");
          assertEqual(gerufen, "/api/suche?q=C%23%20%26%20JS")
      - name: neue Suche bricht die alte ab
        code: |
          const fetchFn = (url, { signal } = {}) => new Promise((resolve, reject) => {
            const timer = setTimeout(() => resolve(new Response(JSON.stringify([url]))), 50);
            signal?.addEventListener("abort", () => { clearTimeout(timer); reject(new DOMException("abgebrochen", "AbortError")); });
          });
          const suche = erstelleSuche(fetchFn);
          const erste = suche("ja");
          const zweite = suche("java");
          let fehler;
          try { await erste; } catch (e) { fehler = e; }
          assertEqual(fehler?.name, "AbortError", "Die erste Suche wurde nicht abgebrochen.");
          assertDeepEqual(await zweite, ["/api/suche?q=java"])
    hints:
      - "Im Konstruktor rufst du zuerst `super(...)` mit der Nachricht auf und setzt danach `this.name` und `this.status`."
      - "In holeJson: `if (!response.ok) throw new HttpFehler(response.status);` und danach `return response.json();`"
      - "In erstelleSuche merkst du dir den letzten Controller in einer Variablen (Closure!): `let controller; return (begriff) => { controller?.abort(); controller = new AbortController(); return holeJson(…, { fetchFn, signal: controller.signal }); };`"
    solution: |
      class HttpFehler extends Error {
        constructor(status) {
          super(`HTTP ${status}`);
          this.name = "HttpFehler";
          this.status = status;
        }
      }

      async function holeJson(url, { fetchFn = fetch, signal } = {}) {
        const response = await fetchFn(url, { signal });
        if (!response.ok) {
          throw new HttpFehler(response.status);
        }
        return response.json();
      }

      function erstelleSuche(fetchFn) {
        let controller;
        return (begriff) => {
          controller?.abort();
          controller = new AbortController();
          const url = `/api/suche?q=${encodeURIComponent(begriff)}`;
          return holeJson(url, { fetchFn, signal: controller.signal });
        };
      }
---
Deine Aufgabenliste lebt bisher nur im Browser – lädst du die Seite neu, ist alles weg. Echte Anwendungen
holen ihre Daten von einem Server und schicken Änderungen dorthin zurück. Im Browser (und in Node.js) gibt
es dafür eine eingebaute Funktion: `fetch`. Sie ist einfach zu benutzen, hat aber ein paar Eigenheiten, die
Anfänger regelmäßig stolpern lassen.

## Die erste Anfrage

Die [[fetch-api|Fetch-API]] schickt einen [[http-request|HTTP-Request]] und liefert ein Promise für die
[[response|Response]]. Die Antwort kommt in zwei Schritten: Erst Statuszeile und Header, dann der Inhalt. Darum
brauchst du zweimal `await`:

```js
const response = await fetch("https://api.example.com/kurse");
console.log(response.status, response.ok);           // 200 true
console.log(response.headers.get("Content-Type"));   // application/json

const kurse = await response.json();   // Inhalt lesen und als JSON parsen
console.log(kurse.length);
```

| Methode der Response | Liefert |
|---|---|
| `response.json()` | Promise mit geparsten JSON-Daten |
| `response.text()` | Promise mit dem Text |
| `response.blob()` | Promise mit Binärdaten (Bilder, Dateien) |

Den Inhalt kannst du nur **einmal** lesen. Wer erst `text()` und dann `json()` aufruft, bekommt einen Fehler.

> [!MERKSATZ]
> `fetch` → Response (Status und Header), `response.json()` → Daten. Zwei Schritte, zwei `await`.

## HTTP-Fehler sind kein fetch-Fehler

Der wichtigste Stolperstein: `fetch` lehnt **nur** ab, wenn gar keine Antwort ankommt – keine Verbindung,
Abbruch, vom Browser blockiert. Antwortet der Server mit 404 oder 500, ist das für `fetch` ein Erfolg.
Den [[statuscode|Statuscode]] prüfst du selbst über `response.ok` (true bei 200–299):

```js
class HttpError extends Error {
  constructor(status) {
    super(`HTTP ${status}`);
    this.name = "HttpError";
    this.status = status;
  }
}

async function holeJson(url, optionen = {}) {
  const response = await fetch(url, optionen);
  if (!response.ok) {
    throw new HttpError(response.status);    // aus 404/500 wird ein echter Fehler
  }
  return response.json();
}
```

Mit so einem Helfer behandelt dein restlicher Code Netzwerk- und HTTP-Fehler gleich: in einem `try/catch`.
Die eigene Fehlerklasse kennst du aus der letzten Lektion.

> [!FEHLER]
> `const daten = await (await fetch(url)).json();` ohne Prüfung von `response.ok` liest bei einem 500 die
> Fehlerseite des Servers – oft HTML. Das endet in einem rätselhaften `SyntaxError: Unexpected token '<'`.

## Daten senden

Für andere [[http-methode|HTTP-Methoden]] übergibst du ein Optionen-Objekt. JSON musst du selbst mit
`JSON.stringify` umwandeln und den passenden [[http-header|Header]] setzen:

```js
const neu = await holeJson("https://api.example.com/aufgaben", {
  method: "POST",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  body: JSON.stringify({ titel: "fetch lernen", erledigt: false }),
});
console.log(neu.id);   // vom Server vergebene id
```

Parameter für die Adresse baust du mit `URLSearchParams` oder kodierst sie mit `encodeURIComponent`, damit
Zeichen wie `&` oder `#` den [[query-string|Query-String]] nicht zerstören:

```js
const parameter = new URLSearchParams({ q: "C# & JS", seite: "2" });
console.log(`/api/suche?${parameter}`);   // /api/suche?q=C%23+%26+JS&seite=2
```

Fragt deine Seite eine API auf einer **anderen** Domain an, muss der Server das ausdrücklich erlauben. Diese
Regel heißt [[cors|CORS]]; Details erklärt die [MDN-Seite zu CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS).

## Anfragen abbrechen mit AbortController

Ein Suchfeld sucht bei jedem Tastendruck. Tippt jemand schnell „java“, laufen vier Anfragen – und die
Antwort für „ja“ kann **nach** der für „java“ ankommen und das richtige Ergebnis überschreiben. Die Lösung:
Alte Anfragen abbrechen. Dafür gibt es den [[abort-controller|AbortController]]:

```js
let controller;

async function suche(begriff) {
  controller?.abort();                         // vorige Anfrage abbrechen
  controller = new AbortController();
  try {
    const treffer = await holeJson(`/api/suche?q=${encodeURIComponent(begriff)}`, {
      signal: controller.signal,               // Signal an fetch übergeben
    });
    zeigeTreffer(treffer);
  } catch (fehler) {
    if (fehler.name === "AbortError") return;  // gewollter Abbruch – kein echter Fehler
    zeigeMeldung(fehler.message);
  }
}
```

Für ein Zeitlimit brauchst du keinen eigenen Controller: `AbortSignal.timeout(5000)` liefert ein Signal, das
nach fünf Sekunden abbricht. Der Fehler heißt dann `TimeoutError`.

```js
const daten = await holeJson("/api/bericht", { signal: AbortSignal.timeout(5000) });
```

> [!PRAXIS]
> Abbrechen gehört in jede Suche mit Live-Ergebnissen und in jede Ansicht, die Daten lädt und vorher wieder
> verlassen werden kann. Bibliotheken wie [[tanstack-query|TanStack Query]] erledigen das automatisch – sie benutzen intern
> genau dieses Signal.

## Zusammenfassung

- `fetch(url)` liefert ein Promise für die Response; den Inhalt liest du mit `await response.json()`.
- `fetch` lehnt nur bei Netzwerkproblemen ab – HTTP-Fehler erkennst du an `response.ok` und `response.status`.
- Ein Helfer wie `holeJson` verwandelt HTTP-Fehler in eigene Fehlerobjekte.
- Zum Senden: `method`, `headers` mit `Content-Type: application/json` und `body: JSON.stringify(…)`.
- Parameter immer kodieren – mit `URLSearchParams` oder `encodeURIComponent`.
- `AbortController` bricht Anfragen ab (`AbortError`), `AbortSignal.timeout(ms)` setzt ein Zeitlimit (`TimeoutError`).
