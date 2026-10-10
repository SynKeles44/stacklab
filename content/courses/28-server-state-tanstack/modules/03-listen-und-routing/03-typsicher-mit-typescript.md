---
title: TanStack Query typsicher mit TypeScript
summary: Typen aus der Query-Funktion ableiten lassen, Keys mit queryOptions typisieren, einen eigenen Fehlertyp registrieren und API-Antworten zur Laufzeit prüfen.
duration: 20
sources:
  - title: TanStack Query – TypeScript
    url: https://tanstack.com/query/latest/docs/framework/react/typescript
  - title: TanStack Query – Query Options
    url: https://tanstack.com/query/latest/docs/framework/react/guides/query-options
  - title: TanStack Query – Disabling/Pausing Queries (skipToken)
    url: https://tanstack.com/query/latest/docs/framework/react/guides/disabling-queries
  - title: TypeScript Handbook – Declaration Merging
    url: https://www.typescriptlang.org/docs/handbook/declaration-merging.html
quiz:
  - type: single
    question: Wie bekommt `data` bei useQuery am besten seinen Typ?
    options:
      - "Mit `useQuery<any>(…)`"
      - Durch Inferenz aus dem Rückgabetyp der Query-Funktion, z. B. `Promise<Aufgabe[]>`
      - "Mit `data as Aufgabe[]` in jeder Komponente"
      - Gar nicht, data ist immer unknown
    answer: 1
    explanation: Typisiere die Funktion, die die Daten holt – den Rest leitet TanStack Query ab. Generics von Hand an useQuery zu übergeben, ist fehleranfällig und hebelt die Inferenz aus.
  - type: match
    question: Welches Werkzeug löst welches Typ-Problem?
    pairs:
      - { left: "queryOptions(...)", right: "getQueryData kennt den Datentyp eines Keys" }
      - { left: "interface Register { defaultError }", right: "Ein eigener Fehlertyp für alle Queries" }
      - { left: "Zod-Schema in der queryFn", right: "Die Antwort wird zur Laufzeit geprüft" }
      - { left: "skipToken", right: "Typsicher eine Query aussetzen, solange ein Wert fehlt" }
    explanation: TypeScript prüft nur zur Build-Zeit. Ob der Server wirklich liefert, was der Typ verspricht, kann nur eine Prüfung zur Laufzeit sicherstellen.
  - type: find-bug
    question: TypeScript meldet in Zeile 5 „`id` is possibly undefined“. Welche Zeile solltest du ändern?
    language: ts
    code: |
      function useAufgabe(id: number | undefined) {
        return useQuery({
          queryKey: ['aufgaben', 'detail', id],
          enabled: id !== undefined,
          queryFn: () => ladeAufgabe(id),
        })
      }
    bug_line: 5
    explanation: "`enabled` hilft TypeScript nicht beim Narrowing. Mit `queryFn: id === undefined ? skipToken : () => ladeAufgabe(id)` ist die Query ausgesetzt, solange id fehlt – und TypeScript weiß, dass id im zweiten Zweig eine Zahl ist."
  - type: cloze
    text: "Damit `error` überall den Typ `HttpFehler` hat, erweiterst du per Declaration Merging das Interface `___` von `@tanstack/react-query` um das Feld `___`."
    blanks:
      - [Register]
      - [defaultError]
    explanation: Ohne Registrierung ist error vom Typ Error. Mit Register gilt der eigene Typ für alle Queries und Mutationen.
tasks:
  - id: typen-registrieren
    type: terminal
    title: Keys und Fehler typsicher machen
    description: |
      Im Ordner `typsicher` liegt ein TypeScript-Projekt mit TanStack Query. `src/api.ts` lädt eine Aufgabe und wirft
      bei HTTP-Fehlern einen `HttpFehler` (aus `src/fehler.ts`). Die Datei `src/pruefung.ts` liest den Cache und
      erwartet, dass TypeScript den Datentyp **und** den Fehlertyp kennt – im Moment kompiliert sie nicht.

      Klicke zuerst auf **Aufgabe vorbereiten** – das legt das Projekt an und installiert die Pakete.

      1. Führe `npx tsc -p .` aus und lies die beiden Fehlermeldungen.
      2. Baue `aufgabeQuery` in `src/queries.ts` mit `queryOptions(...)` aus `@tanstack/react-query` und ergänze
         `staleTime: 30_000`.
      3. Registriere in `src/queries.ts` den Fehlertyp: Erweitere per `declare module '@tanstack/react-query'` das
         Interface `Register` um `defaultError: HttpFehler`. Importiere `HttpFehler` dafür mit `import type`.
      4. `npx tsc -p .` muss ohne Fehler durchlaufen. `src/pruefung.ts` darfst du nicht ändern.
    workdir: typsicher
    setup: |
      npm init -y >/dev/null
      npm pkg set type=module
      npm install --no-audit --no-fund react @tanstack/react-query >/dev/null 2>&1
      npm install --no-audit --no-fund -D typescript @types/react >/dev/null 2>&1
      cat > tsconfig.json <<'EOF'
      {
        "compilerOptions": {
          "target": "es2023",
          "module": "esnext",
          "moduleResolution": "bundler",
          "allowImportingTsExtensions": true,
          "verbatimModuleSyntax": true,
          "noEmit": true,
          "strict": true,
          "skipLibCheck": true,
          "types": []
        },
        "include": ["src"]
      }
      EOF
      mkdir -p src
      cat > src/fehler.ts <<'EOF'
      export class HttpFehler extends Error {
        status: number
        constructor(status: number) {
          super(`HTTP ${status}`)
          this.status = status
        }
      }
      EOF
      cat > src/api.ts <<'EOF'
      import { HttpFehler } from './fehler.ts'

      export type Aufgabe = { id: number; titel: string; erledigt: boolean }

      export async function ladeAufgabe(id: number): Promise<Aufgabe> {
        const res = await fetch(`https://api.example.com/aufgaben/${id}`)
        if (!res.ok) throw new HttpFehler(res.status)
        return (await res.json()) as Aufgabe
      }
      EOF
      cat > src/pruefung.ts <<'EOF'
      import { QueryClient } from '@tanstack/react-query'
      import { aufgabeQuery } from './queries.ts'

      const queryClient = new QueryClient()

      const daten = queryClient.getQueryData(aufgabeQuery(1).queryKey)
      export const titel: string | undefined = daten?.titel

      const zustand = queryClient.getQueryState(aufgabeQuery(1).queryKey)
      export const status: number | undefined = zustand?.error?.status
      EOF
      cp src/pruefung.ts .pruefung-original.ts
      cat > src/queries.ts <<'EOF'
      import { ladeAufgabe } from './api.ts'

      export const aufgabeQuery = (id: number) => ({
        queryKey: ['aufgaben', 'detail', id],
        queryFn: () => ladeAufgabe(id),
      })
      EOF
    checks:
      - type: file_contains
        path: src/queries.ts
        pattern: "queryOptions\\("
        message: aufgabeQuery soll mit queryOptions(...) gebaut werden.
      - type: file_contains
        path: src/queries.ts
        pattern: "staleTime:\\s*30_?000"
        message: "In aufgabeQuery fehlt staleTime: 30_000."
      - type: file_contains
        path: src/queries.ts
        pattern: "interface\\s+Register"
        message: Registriere den Fehlertyp mit declare module '@tanstack/react-query' und interface Register.
      - type: command
        run: cmp -s src/pruefung.ts .pruefung-original.ts
        message: src/pruefung.ts wurde verändert. Stelle den Originalinhalt wieder her (Aufgabe vorbereiten setzt alles zurück).
      - type: command
        run: npx tsc -p . >/dev/null 2>&1
        message: npx tsc -p . meldet noch Fehler. Führe den Befehl aus und lies, welcher Typ fehlt – Datentyp (queryOptions) oder Fehlertyp (Register)?
    hints:
      - "`import { queryOptions } from '@tanstack/react-query'` und dann `export const aufgabeQuery = (id: number) => queryOptions({ queryKey: …, queryFn: …, staleTime: 30_000 })`."
      - "Für den Fehlertyp: `declare module '@tanstack/react-query' { interface Register { defaultError: HttpFehler } }` – mit `import type { HttpFehler } from './fehler.ts'` oben in der Datei."
    solution: |
      ```ts title="src/queries.ts"
      import { queryOptions } from '@tanstack/react-query'
      import { ladeAufgabe } from './api.ts'
      import type { HttpFehler } from './fehler.ts'

      declare module '@tanstack/react-query' {
        interface Register {
          defaultError: HttpFehler
        }
      }

      export const aufgabeQuery = (id: number) =>
        queryOptions({
          queryKey: ['aufgaben', 'detail', id],
          queryFn: () => ladeAufgabe(id),
          staleTime: 30_000,
        })
      ```

      Danach meldet `npx tsc -p .` keine Fehler mehr.
  - id: antwort-pruefen
    type: code
    language: ts
    title: Die API-Antwort zur Laufzeit prüfen
    description: |
      Der Typ `Promise<Aufgabe[]>` ist nur ein Versprechen – liefert der Server etwas anderes, merkt TypeScript das
      nicht. In echten Projekten nimmst du dafür ein Zod-Schema. Hier baust du die Prüfung von Hand:

      1. `istAufgabe(wert: unknown): wert is Aufgabe` ist ein Type Guard. Er gibt `true` zurück, wenn `wert` ein
         Objekt (nicht `null`) mit einer Zahl `id`, einem String `titel` und einem Boolean `erledigt` ist.
      2. `parseAufgaben(json: unknown): Aufgabe[]` gibt das Array zurück, wenn `json` ein Array ist und **jedes**
         Element `istAufgabe` erfüllt. Sonst wirft sie `new Error('Ungültige Antwort vom Server')` – so landet die
         Query im Fehlerzustand statt mit kaputten Daten weiterzumachen.
      3. `nurOffene(aufgaben)` liefert nur die nicht erledigten Aufgaben. Diese Funktion könntest du als
         `select`-Option an useQuery übergeben.
    starter: |
      type Aufgabe = { id: number; titel: string; erledigt: boolean }

      function istAufgabe(wert: unknown): wert is Aufgabe {
        return false
      }

      function parseAufgaben(json: unknown): Aufgabe[] {
        return []
      }

      function nurOffene(aufgaben: Aufgabe[]): Aufgabe[] {
        return aufgaben
      }
    tests:
      - name: istAufgabe erkennt gültige Objekte
        code: |
          assertTrue(istAufgabe({ id: 1, titel: 'A', erledigt: false }))
          assertTrue(!istAufgabe({ id: '1', titel: 'A', erledigt: false }), 'id muss eine Zahl sein.')
          assertTrue(!istAufgabe({ id: 1, titel: 'A' }), 'erledigt fehlt.')
          assertTrue(!istAufgabe(null), 'null ist keine Aufgabe.')
      - name: parseAufgaben akzeptiert gültige Arrays
        code: |
          const json = [{ id: 1, titel: 'A', erledigt: false }, { id: 2, titel: 'B', erledigt: true }]
          assertEqual(parseAufgaben(json).length, 2)
          assertDeepEqual(parseAufgaben([]), [])
      - name: parseAufgaben wirft bei falschen Daten
        code: |
          assertThrows(() => parseAufgaben({ daten: [] }), 'Ein Objekt statt Array muss einen Fehler werfen.')
          assertThrows(() => parseAufgaben([{ id: 1, titel: 'A', erledigt: 'nein' }]), 'Ein ungültiges Element muss einen Fehler werfen.')
      - name: nurOffene filtert
        code: |
          const liste = [{ id: 1, titel: 'A', erledigt: false }, { id: 2, titel: 'B', erledigt: true }]
          assertDeepEqual(nurOffene(liste).map((a) => a.id), [1])
          assertEqual(liste.length, 2, 'nurOffene darf die Eingabe nicht verändern.')
    hints:
      - "Ein Objekt prüfst du mit `typeof wert === 'object' && wert !== null`. Danach kannst du mit `'id' in wert` und `typeof wert.id === 'number'` weitermachen."
      - "`if (!Array.isArray(json) || !json.every(istAufgabe)) throw new Error('Ungültige Antwort vom Server')`"
    solution: |
      type Aufgabe = { id: number; titel: string; erledigt: boolean }

      function istAufgabe(wert: unknown): wert is Aufgabe {
        if (typeof wert !== 'object' || wert === null) return false
        const w = wert as Record<string, unknown>
        return typeof w.id === 'number' && typeof w.titel === 'string' && typeof w.erledigt === 'boolean'
      }

      function parseAufgaben(json: unknown): Aufgabe[] {
        if (!Array.isArray(json) || !json.every(istAufgabe)) {
          throw new Error('Ungültige Antwort vom Server')
        }
        return json
      }

      function nurOffene(aufgaben: Aufgabe[]): Aufgabe[] {
        return aufgaben.filter((a) => !a.erledigt)
      }
---
TanStack Query ist in TypeScript geschrieben und leitet fast alle Typen selbst ab. Trotzdem gibt es vier
Stellen, an denen du nachhelfen musst: die Query-Funktion, die Keys, den Fehlertyp und die Frage, ob der Server
überhaupt liefert, was der Typ verspricht.

## Typisiere die Funktion, nicht den Hook

Der Typ von `data` kommt aus dem Rückgabetyp der `queryFn`. Typisiere also die Funktion, die lädt – nicht den
Hook:

```ts
async function ladeAufgaben(): Promise<Aufgabe[]> {
  const res = await fetch('/api/aufgaben')
  if (!res.ok) throw new HttpFehler(res.status)
  return res.json()
}

const { data } = useQuery({ queryKey: ['aufgaben'], queryFn: ladeAufgaben })
//      ^? Aufgabe[] | undefined
```

Nach `if (isPending)` und `if (isError)` weiß TypeScript durch [[narrowing|Narrowing]], dass `data` vom Typ
`Aufgabe[]` ist.

> [!FEHLER]
> **Generics von Hand übergeben.** `useQuery<Aufgabe[]>(…)` sieht ordentlich aus, setzt aber nur den **ersten**
> von vier Typparametern. Der Fehler- und der Key-Typ fallen dabei auf Standardwerte zurück, und die
> [[typinferenz|Inferenz]] für `select` funktioniert nicht mehr. Lass TypeScript die Typen ableiten.

## Typisierte Keys mit queryOptions

`queryOptions` aus der vorigen Lektion hat noch einen Trick: Es versieht den Key mit dem Datentyp. Dadurch wissen
auch Funktionen, die nur den Key bekommen, was darunter liegt:

```ts
const daten = queryClient.getQueryData(aufgabeQuery(7).queryKey)
//    ^? Aufgabe | undefined   (ohne queryOptions: unknown)

queryClient.setQueryData(aufgabeQuery(7).queryKey, (alt) =>
  alt ? { ...alt, erledigt: true } : alt,          // alt ist Aufgabe | undefined
)
```

Für Endlos-Listen gibt es dasselbe als `infiniteQueryOptions`, für Mutationen `mutationOptions`.

## Ein Fehlertyp für die ganze App

Der Fehler ist standardmäßig vom Typ `Error`. Wirft deine API-Schicht immer einen eigenen `HttpFehler`, trägst
du ihn einmal zentral ein. Das geht über [[declaration-merging|Declaration Merging]]: Du erweiterst das
Interface `Register` der Bibliothek.

```ts title="src/queries.ts (oder eine eigene .d.ts-Datei)"
import type { HttpFehler } from './fehler.ts'

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: HttpFehler
  }
}
```

Ab jetzt ist `error` in jedem `useQuery` und `useMutation` ein `HttpFehler` – `error.status` ist typsicher.
Auch `retry: (anzahl, fehler) => …` bekommt den richtigen Typ.

Wohin mit dem Block? Er muss in einer Datei stehen, die TypeScript beim Kompilieren sieht – also in einer Datei
innerhalb von `include` der `tsconfig.json`. Viele Teams legen dafür eine eigene Datei wie
`src/query-register.d.ts` an. Wichtig: Das Versprechen gilt nur, wenn deine API-Schicht auch wirklich nur
`HttpFehler` wirft. Ein Netzwerkabbruch erzeugt in `fetch` einen `TypeError` – fange ihn ab und verpacke ihn,
sonst stimmt der registrierte Typ nicht mit der Wirklichkeit überein.

## Zur Laufzeit prüfen

TypeScript glaubt dir, dass `res.json()` ein `Aufgabe[]` ist. Liefert der Server nach einem Update plötzlich
`{ daten: [...] }`, stürzt die App erst beim Rendern ab – weit weg von der Ursache. Prüfe die Antwort deshalb in
der Query-Funktion, z. B. mit [[zod|Zod]] ([[laufzeitvalidierung|Laufzeitvalidierung]]):

```ts
import { z } from 'zod'

const AufgabeSchema = z.object({ id: z.number(), titel: z.string(), erledigt: z.boolean() })
type Aufgabe = z.infer<typeof AufgabeSchema>

async function ladeAufgaben(): Promise<Aufgabe[]> {
  const res = await fetch('/api/aufgaben')
  if (!res.ok) throw new HttpFehler(res.status)
  return z.array(AufgabeSchema).parse(await res.json())
}
```

`parse` wirft bei falschen Daten – die Query landet sauber im Fehlerzustand. Der Typ `Aufgabe` kommt dabei aus
dem Schema; es gibt nur noch eine Quelle.

> [!MERKSATZ]
> Typen schützen dich beim Programmieren, Schemas schützen dich zur Laufzeit. An der Grenze zur API brauchst du
> beides.

## select und skipToken

Zwei Optionen, die TypeScript besonders gut unterstützt:

- **`select`** formt die Daten für eine Komponente um, ohne den Cache zu ändern. Der Typ von `data` folgt
  automatisch: `select: (aufgaben) => aufgaben.filter((a) => !a.erledigt).length` ergibt `data: number`.
- **`skipToken`** setzt eine Query aus, solange ein Wert fehlt. Anders als `enabled: false` hilft es TypeScript
  beim Narrowing:

```ts
import { skipToken, useQuery } from '@tanstack/react-query'

useQuery({
  queryKey: ['aufgaben', 'detail', id],
  queryFn: id === undefined ? skipToken : () => ladeAufgabe(id),
})
```

> [!PRAXIS]
> In größeren Projekten liegen pro Fachbereich eine Key-Fabrik, die `queryOptions`-Funktionen und die
> Zod-Schemas zusammen in einem Ordner wie `src/features/aufgaben/api`. Komponenten importieren nur die Optionen –
> und bekommen Typen, Keys und Validierung gratis mit.

## Zusammenfassung

- Typisiere den Rückgabetyp der **Query-Funktion**; `data` und alles Weitere leitet TanStack Query ab.
- Übergib `useQuery` keine Generics von Hand.
- `queryOptions` macht Keys typsicher – auch für `getQueryData` und `setQueryData`.
- Mit `interface Register { defaultError: … }` gilt ein eigener Fehlertyp für die ganze App.
- Prüfe API-Antworten zur Laufzeit, z. B. mit Zod – ein Fehler landet dann sauber in `error`.
- `select` formt Daten typsicher um, `skipToken` setzt Queries typsicher aus.
