---
title: Collections und Clients aus der Spezifikation
summary: Aus derselben OpenAPI-Datei entstehen Postman- und Bruno-Collections zum Ausprobieren und typisierte API-Clients für das Frontend.
duration: 20
sources:
  - title: Postman – Import an OpenAPI definition
    url: https://learning.postman.com/docs/getting-started/importing-and-exporting/importing-from-swagger/
  - title: Bruno CLI (npm @usebruno/cli)
    url: https://www.npmjs.com/package/@usebruno/cli
  - title: Hey API – openapi-ts
    url: https://heyapi.dev/
  - title: OpenAPI Generator
    url: https://openapi-generator.tech/
quiz:
  - type: match
    question: Ordne jedes Werkzeug seinem Zweck zu.
    pairs:
      - { left: "Postman / Bruno", right: "Anfragen von Hand ausprobieren und als Collection teilen" }
      - { left: "@hey-api/openapi-ts", right: "TypeScript-Client mit Typen, optional mit TanStack-Query-Hooks" }
      - { left: "OpenAPI Generator", right: "Clients und Server-Gerüste für viele Sprachen" }
      - { left: "Redocly CLI", right: "Spezifikation prüfen und als Doku-Seite bauen" }
    explanation: Alle lesen dieselbe OpenAPI-Datei. Je besser die Spezifikation, desto besser das Ergebnis.
  - type: single
    question: Warum ist die operationId für Client-Generatoren so wichtig?
    options:
      - Sie bestimmt die URL der Operation.
      - Aus ihr werden Funktionsnamen wie getBook() im erzeugten Client.
      - Ohne sie kann man die API nicht aufrufen.
      - Sie wird als Passwort verwendet.
    answer: 1
    explanation: >
      Generatoren machen aus `operationId: getBook` eine Funktion `getBook()`. Fehlt sie, erfinden sie
      Namen aus Pfad und Methode – oft unschön und instabil.
  - type: multiple
    question: Welche Vorteile hat ein generierter Client gegenüber handgeschriebenen fetch-Aufrufen?
    options:
      - Typen für Parameter und Antworten kommen direkt aus der Spezifikation.
      - Ändert sich die API, zeigt der TypeScript-Compiler nach dem Neu-Erzeugen die betroffenen Stellen.
      - Die API wird dadurch schneller.
      - Pfade und Parameternamen werden nicht mehr von Hand getippt.
    answers: [0, 1, 3]
    explanation: Ein generierter Client ändert nichts an der API selbst – er macht ihre Nutzung sicherer.
  - type: cloze
    text: "Mit bru import ___ --source openapi.yaml --output collection erzeugt die Bruno CLI eine Collection."
    blanks:
      - [openapi]
    explanation: Der Unterbefehl nennt das Quellformat. Die Collection kannst du in der Bruno-App öffnen und ins Repository legen.
tasks:
  - id: werkzeugkette
    type: dragdrop
    title: Was entsteht womit?
    description: Ordne jedes Ergebnis dem Werkzeug zu, das es aus der OpenAPI-Datei erzeugt.
    targets:
      - { id: collection, label: "Collection zum Ausprobieren" }
      - { id: client, label: "Typisierter Client" }
      - { id: doku, label: "Doku und Prüfung" }
    items:
      - { label: Import in Postman über „Import“ → Datei, target: collection }
      - { label: bru import openapi -s openapi.yaml -o api-collection, target: collection }
      - { label: npx @hey-api/openapi-ts -i openapi.yaml -o src/client, target: client }
      - { label: openapi-generator-cli generate -g typescript-fetch, target: client }
      - { label: npx redocly build-docs openapi.yaml, target: doku }
      - { label: npx redocly lint openapi.yaml, target: doku }
  - id: url-bauen
    type: code
    language: ts
    title: Was ein generierter Client für dich tut
    description: |
      Ein generierter Client baut aus dem Pfad der Spezifikation (`/books/{id}`) und deinen Parametern
      die fertige URL. Schreib diese Kernfunktion selbst:

      `buildUrl(path, pathParams, query)`

      - Ersetzt jeden Platzhalter `{name}` durch den passenden Wert aus `pathParams` – mit
        `encodeURIComponent`, damit Sonderzeichen sicher sind.
      - Hängt alle Query-Werte als `?key=value&…` an, in der Reihenfolge der Schlüssel. Werte, die
        `undefined` sind, werden weggelassen. Auch hier mit `encodeURIComponent`.
      - Ohne Query-Werte gibt es kein `?`.
      - Fehlt ein Pfadparameter, wirf einen `Error`.
    starter: |
      type Params = Record<string, string | number>
      type Query = Record<string, string | number | boolean | undefined>

      function buildUrl(path: string, pathParams: Params = {}, query: Query = {}): string {
        // 1. Platzhalter {name} ersetzen
        // 2. Query-String anhängen
        return path
      }
    tests:
      - name: ersetzt einen Pfadparameter
        code: "assertEqual(buildUrl('/books/{id}', { id: 42 }), '/books/42')"
      - name: hängt Query-Werte an und lässt undefined weg
        code: "assertEqual(buildUrl('/books', {}, { limit: 20, author: undefined, sort: 'title' }), '/books?limit=20&sort=title')"
      - name: ohne Parameter bleibt der Pfad unverändert
        code: assertEqual(buildUrl('/health'), '/health')
      - name: kodiert Sonderzeichen
        code: "assertEqual(buildUrl('/authors/{name}/books', { name: 'Ada Lovelace' }, { q: 'a&b' }), '/authors/Ada%20Lovelace/books?q=a%26b')"
      - name: wirft bei fehlendem Pfadparameter
        code: "assertThrows(() => buildUrl('/books/{id}', {}))"
    solution: |
      type Params = Record<string, string | number>
      type Query = Record<string, string | number | boolean | undefined>

      function buildUrl(path: string, pathParams: Params = {}, query: Query = {}): string {
        const filled = path.replace(/\{(\w+)\}/g, (_match: string, name: string) => {
          const value = pathParams[name]
          if (value === undefined) {
            throw new Error(`Pfadparameter ${name} fehlt`)
          }
          return encodeURIComponent(String(value))
        })

        const parts = Object.entries(query)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)

        return parts.length > 0 ? `${filled}?${parts.join('&')}` : filled
      }
    hints:
      - "`path.replace(/\\{(\\w+)\\}/g, (match, name) => …)` ruft deine Funktion für jeden Platzhalter auf."
      - "`Object.entries(query)` liefert Paare `[key, value]` – filtere die undefined-Werte heraus."
---
Das Frontend-Team will deine Buch-API nutzen. Sie könnten jeden Aufruf von Hand schreiben:
`fetch('/books/' + id)`, die Antwort-Typen abtippen, die Parameter raten. Oder sie lassen sich aus
deiner OpenAPI-Datei alles erzeugen – eine Collection zum Ausprobieren und einen Client mit Typen.

## Collections: Ausprobieren ohne Code

Eine [[api-collection|Collection]] ist eine gespeicherte Sammlung von Anfragen mit Methode, URL, Headern und Body.
Die zwei bekanntesten Werkzeuge:

| | [[postman|Postman]] | [[bruno|Bruno]] |
|---|---|---|
| Ablage | In der Cloud des Anbieters (Workspace) | Als Textdateien in einem Ordner – passt ins Git-Repository |
| Import aus OpenAPI | Menü „Import“, Datei oder URL wählen | App oder CLI: `bru import openapi` |
| Typischer Einsatz | Teams, die Postman schon nutzen | Teams, die alles im Repository haben wollen |

```bash title="Bruno-Collection aus der Spezifikation"
npx @usebruno/cli import openapi --source docs/v1/openapi.yaml \
  --output api-collection --collection-name "Buch-API v1"
```

Aus jeder Operation wird eine Anfrage, sortiert nach `tags`. Die Werte aus `example` füllen die Bodies vor.

> [!PRAXIS]
> Weil Bruno-Collections einfache Dateien sind, kann die CI sie bei jeder Änderung der Spezifikation
> neu erzeugen – genau wie die Doku. So ist auch die Collection nie veraltet.

## Generierte Clients: Typen aus der Spezifikation

Ein [[api-client|API-Client]] ist Code, der die Aufrufe einer API kapselt. Statt ihn zu schreiben, lässt
du ihn per [[code-generierung|Code-Generierung]] erzeugen:

```bash title="TypeScript-Client mit Hey API"
npx @hey-api/openapi-ts -i docs/v1/openapi.yaml -o src/client
```

Das Ergebnis enthält Typen für jedes Schema und eine Funktion pro Operation. Aus `operationId: getBook`
wird `getBook()`:

```ts title="Nutzung im Frontend"
import { getBook } from './client'

const { data } = await getBook({ path: { id: 42 } })
console.log(data?.title)   // TypeScript kennt den Typ von data
```

Ändert sich die API, erzeugst du den Client neu – und der TypeScript-Compiler zeigt jede Stelle, die
nicht mehr passt. Das ist das Gegenteil von Drift.

Im Kern macht ein solcher Client nichts Magisches: Er setzt Pfadparameter in den Pfad ein, hängt
Query-Parameter an, schickt den Body als JSON und gibt die Antwort typisiert zurück. Genau diesen Kern
baust du in der Aufgabe dieser Lektion selbst. Der Gewinn liegt darin, dass niemand Pfade, Namen und
Typen von Hand abtippen muss.

> [!MERKSATZ]
> Gute `operationId`s, vollständige Schemas und dokumentierte Fehlerantworten machen generierte
> Clients gut. Eine schlampige Spezifikation erzeugt einen schlampigen Client.

## Mit TanStack Query

Viele React-Projekte laden Server-Daten mit [[tanstack-query|TanStack Query]]. Hey API bringt dafür
ein Plugin mit, das fertige Query-Optionen erzeugt. Konfiguriert wird es in `openapi-ts.config.ts`:

```ts title="openapi-ts.config.ts"
export default {
  input: 'docs/v1/openapi.yaml',
  output: 'src/client',
  plugins: ['@tanstack/react-query'],
}
```

```tsx title="In einer Komponente"
const { data, isPending } = useQuery({
  ...getBookOptions({ path: { id: 42 } }),
})
```

`getBookOptions()` liefert Query-Key und Abruf-Funktion in einem – niemand muss Keys von Hand pflegen.

## Andere Sprachen und Mock-Server

Für viele Sprachen gibt es den [OpenAPI Generator](https://openapi-generator.tech/). Er erzeugt
Clients (z. B. `typescript-fetch`, `php`, `kotlin`) und Server-Gerüste. Er läuft auf Java – die npm-Hülle
`@openapitools/openapi-generator-cli` lädt die passende Version herunter:

```bash title="Terminal"
npx @openapitools/openapi-generator-cli generate -i openapi.yaml -g typescript-fetch -o client
```

Beim Design-first-Ansatz kann das Frontend sogar starten, bevor das Backend fertig ist: Ein
[[mock-api|Mock-Server]] wie [Prism](https://github.com/stoplightio/prism) beantwortet Anfragen mit den Beispielen
aus der Spezifikation.

> [!FEHLER]
> Generierten Code von Hand ändern. Beim nächsten Erzeugen ist die Änderung weg. Generierter Code
> wird nur neu erzeugt – Anpassungen gehören in die Spezifikation oder in die Generator-Konfiguration.

## Zusammenfassung

- Aus der OpenAPI-Datei entstehen **Collections** (Postman, Bruno) zum Ausprobieren und Teilen.
- Bruno speichert Collections als Dateien; `bru import openapi` erzeugt sie aus der Spezifikation.
- **Generierte Clients** (z. B. `@hey-api/openapi-ts`) liefern Typen und eine Funktion pro `operationId`.
- Das TanStack-Query-Plugin erzeugt fertige Query-Optionen wie `getBookOptions()`.
- OpenAPI Generator deckt viele Sprachen ab; Mock-Server antworten mit den Beispielen der Spezifikation.
- Generierten Code nie von Hand ändern – immer die Spezifikation verbessern und neu erzeugen.
