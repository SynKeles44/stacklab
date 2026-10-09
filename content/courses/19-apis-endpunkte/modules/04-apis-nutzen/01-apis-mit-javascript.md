---
title: APIs mit JavaScript nutzen
summary: Requests mit fetch und async/await schicken, HTTP-Fehler richtig erkennen, Timeouts mit AbortController setzen und API-Code testbar halten.
duration: 25
sources:
  - title: MDN – Using the Fetch API
    url: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
  - title: MDN – Response.ok
    url: https://developer.mozilla.org/en-US/docs/Web/API/Response/ok
  - title: MDN – AbortSignal.timeout()
    url: https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static
  - title: MDN – async function
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
quiz:
  - type: single
    question: "`fetch('/books/99')` bekommt die Antwort `404 Not Found`. Was passiert?"
    options:
      - Das Promise wird abgelehnt (rejected), `catch` greift.
      - Das Promise wird erfüllt; `response.ok` ist `false` und `response.status` ist `404`.
      - fetch wiederholt den Request automatisch.
      - Der Browser zeigt eine Fehlerseite.
    answer: 1
    explanation: >
      fetch lehnt nur bei Netzwerkfehlern ab (kein Server, abgebrochene Verbindung, Timeout). Jede HTTP-Antwort –
      auch 404 oder 500 – ist für fetch ein Erfolg. Deshalb musst du `response.ok` selbst prüfen.
  - type: find-bug
    question: Diese Funktion soll ein Buch als JSON anlegen. In welcher Zeile steckt der Fehler?
    language: js
    code: |
      async function createBook(book) {
        const response = await fetch('https://api.example.com/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: book,
        })
        return response.json()
      }
    bug_line: 5
    explanation: >
      Der Body muss ein String sein. Ein Objekt wird zu `"[object Object]"`. Richtig ist
      `body: JSON.stringify(book)`.
  - type: cloze
    text: "Mit `signal: AbortSignal.___(5000)` bricht fetch den Request ab, wenn nach 5 Sekunden keine Antwort da ist."
    blanks:
      - [timeout]
    explanation: Ohne Timeout kann ein hängender Server deine App beliebig lange warten lassen.
  - type: multiple
    question: Warum bekommt eine Funktion wie `getJson(url, fetchFn = fetch)` die fetch-Funktion als Parameter?
    options:
      - Damit Tests eine Fake-Funktion übergeben können, die ohne Netzwerk antwortet.
      - Weil fetch sonst nicht funktioniert.
      - Damit die Tests immer gleich und schnell ablaufen.
      - Damit man später z. B. eine Variante mit Logging einsetzen kann.
    answers: [0, 2, 3]
    explanation: Im echten Code gilt der Standardwert `fetch`. Tests reichen eine Fälschung herein – so bleibt der Code testbar, ohne echte Server.
tasks:
  - id: get-json
    type: code
    language: js
    title: Schreibe einen robusten getJson-Helfer
    description: |
      Schreibe `async function getJson(url, fetchFn = fetch)` und die Klasse `ApiError`.

      1. Rufe `fetchFn(url, { headers: { Accept: 'application/json' } })` auf.
      2. Ist `response.ok` falsch, versuche den Body als JSON zu lesen (Problem Details). Klappt das nicht,
         ist das Problem `null`. Wirf dann `new ApiError(response.status, problem)`.
      3. Bei Status `204` gib `null` zurück, sonst das gelesene JSON.

      `ApiError` erbt von `Error`, hat die Eigenschaften `status` und `problem`, den `name` `'ApiError'` und als
      `message` den `title` aus dem Problem – oder `HTTP <status>`, wenn es keinen gibt.

      Die Tests übergeben eine **Fake-Funktion** statt des echten `fetch` – es gibt hier kein Netzwerk.
    starter: |
      class ApiError extends Error {
        constructor(status, problem) {
          super('TODO')
          this.name = 'ApiError'
        }
      }

      async function getJson(url, fetchFn = fetch) {
        const response = await fetchFn(url, { headers: { Accept: 'application/json' } })
        return response.json()
      }
    tests:
      - name: liefert die Daten bei 200
        code: |
          const fake = async () => ({ ok: true, status: 200, json: async () => ({ data: { id: 2 } }) })
          assertDeepEqual(await getJson('/books/2', fake), { data: { id: 2 } })
      - name: schickt den Accept-Header mit
        code: |
          let seen
          const fake = async (url, init) => { seen = { url, init }; return { ok: true, status: 200, json: async () => ({}) } }
          await getJson('https://api.example.com/books', fake)
          assertEqual(seen.url, 'https://api.example.com/books')
          assertEqual(seen.init.headers.Accept, 'application/json')
      - name: wirft ApiError mit Problem Details bei 404
        code: |
          const problem = { title: 'Nicht gefunden', status: 404 }
          const fake = async () => ({ ok: false, status: 404, json: async () => problem })
          let error
          try { await getJson('/books/99', fake) } catch (e) { error = e }
          assertTrue(error instanceof ApiError, 'Erwartet einen ApiError')
          assertTrue(error instanceof Error, 'ApiError soll von Error erben')
          assertEqual(error.status, 404)
          assertEqual(error.message, 'Nicht gefunden')
          assertDeepEqual(error.problem, problem)
      - name: kommt mit einem 500 ohne JSON-Body klar
        code: |
          const fake = async () => ({ ok: false, status: 500, json: async () => { throw new SyntaxError('Unexpected end of JSON input') } })
          let error
          try { await getJson('/books', fake) } catch (e) { error = e }
          assertEqual(error && error.name, 'ApiError')
          assertEqual(error.message, 'HTTP 500')
          assertEqual(error.problem, null)
      - name: gibt bei 204 null zurück
        code: |
          const fake = async () => ({ ok: true, status: 204, json: async () => { throw new SyntaxError('no body') } })
          assertEqual(await getJson('/books/6', fake), null)
    hints:
      - "Im Konstruktor: `super(problem?.title ?? 'HTTP ' + status)`, dann `this.status = status` und `this.problem = problem`."
      - "Den Fehler-Body liest du vorsichtig: `let problem = null; try { problem = await response.json() } catch {}`."
      - "Reihenfolge: erst `!response.ok` prüfen, dann `204`, dann `return response.json()`."
    solution: |
      ```js
      class ApiError extends Error {
        constructor(status, problem) {
          super(problem?.title ?? `HTTP ${status}`)
          this.name = 'ApiError'
          this.status = status
          this.problem = problem
        }
      }

      async function getJson(url, fetchFn = fetch) {
        const response = await fetchFn(url, { headers: { Accept: 'application/json' } })
        if (!response.ok) {
          let problem = null
          try {
            problem = await response.json()
          } catch {
            problem = null
          }
          throw new ApiError(response.status, problem)
        }
        if (response.status === 204) return null
        return response.json()
      }
      ```
  - id: fetch-ablauf
    type: steps
    title: Was passiert als Nächstes?
    description: Verfolge einen fetch-Aufruf in verschiedenen Situationen.
    steps:
      - situation: "`const response = await fetch('https://api.example.com/books')` – der Server antwortet mit `500 Internal Server Error`."
        question: Was steht danach in `response.ok`?
        options: ["true", "false", "Die Zeile wirft einen Fehler, response wird nie gesetzt."]
        answer: 1
        explanation: 500 ist eine gültige HTTP-Antwort. fetch erfüllt das Promise, `ok` ist nur bei 200–299 `true`.
      - situation: "Der Server ist gar nicht erreichbar (falsche Adresse, kein Netz)."
        question: Was passiert mit `await fetch(...)`?
        options:
          - Es liefert eine Response mit Status 0.
          - Es wirft einen TypeError – ohne try/catch bricht die Funktion ab.
          - Es wartet für immer.
        answer: 1
        explanation: Netzwerkfehler lehnen das Promise ab. Fang sie mit try/catch ab und zeige eine verständliche Meldung.
      - situation: "Du rufst `fetch(url, { signal: AbortSignal.timeout(3000) })` auf, der Server braucht 10 Sekunden."
        question: Was passiert nach 3 Sekunden?
        options:
          - Nichts, der Timeout gilt nur für den Upload.
          - fetch bricht ab und wirft einen Fehler mit dem Namen TimeoutError.
          - fetch liefert eine leere Response mit Status 408.
        answer: 1
        explanation: Das Signal bricht den Request ab. Am `name` des Fehlers (`TimeoutError` bzw. `AbortError` bei manuellem Abbruch) erkennst du den Grund.
---
Deine React-App zeigt eine Liste von Büchern. Die Daten kommen per API – aber was, wenn der Server langsam
ist, ein Buch nicht existiert oder das WLAN im Zug weg ist? Ein `fetch` ist schnell geschrieben. Ein
`fetch`, der in **allen** diesen Fällen sinnvoll reagiert, braucht ein paar Zeilen mehr. Genau die lernst
du hier.

## fetch und async/await

Die [[fetch-api|Fetch API]] ist im Browser, in Node.js, Bun und Deno eingebaut. `fetch()` gibt ein
[[promise|Promise]] zurück – ein Versprechen auf ein Ergebnis, das später eintrifft. Mit
[[async-await|async/await]] wartest du lesbar darauf:

```js run
async function loadBook(id) {
  const response = await fetch(`https://api.example.com/books/${id}`, {
    headers: { Accept: 'application/json' },
  })
  const body = await response.json()
  return body.data
}
```

Zwei Mal `await`: einmal auf die Antwort (Statuszeile und Header), einmal auf den Body, denn der kann
noch unterwegs sein. (Im Übungsfenster gibt es kein Netzwerk – der Code zeigt hier nur die Form.)

Das Response-Objekt bietet dir alles, was die Antwort enthält:

| Eigenschaft | Inhalt |
|---|---|
| `response.status` | Statuscode, z. B. `201` |
| `response.ok` | `true` bei 200–299 |
| `response.headers.get('Location')` | einzelner Header |
| `await response.json()` | Body als Objekt |
| `await response.text()` | Body als Text, z. B. bei Fehlern ohne JSON |

Den Body kannst du nur **einmal** lesen – entscheide dich für `json()` oder `text()`.

## Daten senden

Für POST, PATCH und DELETE übergibst du ein Options-Objekt:

```js
const response = await fetch('https://api.example.com/books', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer <dein-token>',
  },
  body: JSON.stringify({ title: 'Die Kunst der Pause', genre: 'sachbuch', year: 2025 }),
})
```

| Option | Inhalt |
|---|---|
| `method` | HTTP-Methode, Standard ist `GET` |
| `headers` | Objekt mit Headern |
| `body` | **String** – Objekte vorher mit `JSON.stringify` umwandeln |
| `signal` | zum Abbrechen (Timeout) |

## Die wichtigste Falle: HTTP-Fehler

> [!FEHLER]
> fetch wirft bei `404` oder `500` **keinen** Fehler. Wer nur `try/catch` schreibt, behandelt
> Fehlerantworten wie Erfolge – und liest dann z. B. `body.data` aus einer Fehlermeldung.

fetch lehnt das Promise nur bei **Netzwerkfehlern** ab. Für HTTP-Fehler prüfst du `response.ok` (wahr bei
200–299) selbst und wirfst einen eigenen Fehler:

```js
class ApiError extends Error {
  constructor(status, problem) {
    super(problem?.title ?? `HTTP ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }
}

if (!response.ok) {
  throw new ApiError(response.status, await response.json().catch(() => null))
}
```

So landen beide Fehlerarten im selben [[try-catch|try/catch]] – und dein Code unterscheidet sie am
Typ: `error instanceof ApiError` (Server hat geantwortet) oder ein `TypeError` (Netzwerk).

> [!MERKSATZ]
> Nach jedem `fetch`: erst `response.ok` prüfen, dann den Body verwenden.

## Timeouts mit AbortController

Antwortet ein Server nie, wartet fetch sehr lange. Mit einem Signal brichst du ab:

```js
const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
```

Für einen Abbruch per Knopf – etwa wenn Nutzer die Seite verlassen – nutzt du einen
[[abort-controller|AbortController]]:

```js
const controller = new AbortController()
fetch(url, { signal: controller.signal })
controller.abort()   // bricht den laufenden Request ab
```

Der abgebrochene Request wirft einen Fehler mit dem Namen `TimeoutError` bzw. `AbortError`. Einen
[[timeout|Timeout]] sollte jeder Request zu einem fremden Dienst haben.

## Testbar bleiben

Code, der direkt `fetch` aufruft, lässt sich ohne Server schwer testen. Gib die Funktion deshalb als
Parameter mit Standardwert herein:

```js
async function getJson(url, fetchFn = fetch) {
  const response = await fetchFn(url, { headers: { Accept: 'application/json' } })
  // …
}

// im Test: eine Fälschung, die sofort antwortet
const fake = async () => ({ ok: false, status: 404, json: async () => ({ title: 'Nicht gefunden' }) })
```

Im echten Code gilt `fetch`, im Test ein [[test-double|Test-Double]]. Die Tests laufen ohne Netzwerk,
schnell und immer gleich.

> [!PRAXIS]
> In Projekten gibt es meist **einen** zentralen API-Client: Er setzt Basis-URL, Token und Timeout,
> wandelt Fehler in `ApiError` um und wird überall wiederverwendet. Bibliotheken wie TanStack Query bauen
> Caching und Wiederholungen darauf auf.

## Zusammenfassung

- `fetch()` liefert ein Promise; mit `await` wartest du auf Response und Body.
- Beim Senden: `method`, `headers` und `body: JSON.stringify(...)`.
- fetch wirft nur bei **Netzwerkfehlern** – HTTP-Fehler erkennst du an `response.ok`.
- Ein eigener `ApiError` mit `status` und Problem Details vereinheitlicht die Fehlerbehandlung.
- `AbortSignal.timeout(ms)` oder ein `AbortController` verhindern endloses Warten.
- `fetchFn` als Parameter macht API-Code ohne Server testbar.
