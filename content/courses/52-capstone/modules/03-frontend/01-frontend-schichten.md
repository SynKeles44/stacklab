---
title: Das Frontend in Schichten
summary: Wie Vertrag, API-Client, Queries, Routen und Komponenten zusammenspielen – und warum React Router und TanStack Query sich die Arbeit teilen.
duration: 20
sources:
  - title: React Router – Data Mode (Installation und Routing)
    url: https://reactrouter.com/start/data/installation
  - title: TanStack Query – Query Options
    url: https://tanstack.com/query/latest/docs/framework/react/guides/query-options
  - title: TanStack Query – ensureQueryData
    url: https://tanstack.com/query/latest/docs/reference/QueryClient#queryclientensurequerydata
  - title: Zod – Basic usage
    url: https://zod.dev/basics
quiz:
  - type: single
    question: Wozu dient `queryClient.ensureQueryData(...)` in einem Loader?
    options:
      - Es lädt die Daten immer neu vom Server.
      - Es gibt vorhandene Daten aus dem Cache zurück oder lädt sie, bevor die Seite gerendert wird.
      - Es löscht den Cache.
    answer: 1
    explanation: >
      So ist die Seite beim Rendern nie leer: Sind die Daten im Cache, kommen sie sofort, sonst wartet der Loader
      auf den Server. Die Komponente liest sie danach mit `useSuspenseQuery` aus demselben Cache.
  - type: match
    question: Ordne jeder Datei ihre Aufgabe zu.
    pairs:
      - { left: "schema.ts", right: "Zod-Schemas und Typen – der Vertrag" }
      - { left: "api.ts", right: "fetch, Header, Token, Fehler als ApiError" }
      - { left: "queries.ts", right: "Query-Keys und queryOptions" }
      - { left: "router.tsx", right: "Routen mit Loadern und Actions" }
      - { left: "pages.tsx", right: "Komponenten, die nur anzeigen" }
    explanation: Jede Schicht kennt nur die darunter. Komponenten rufen nie selbst `fetch` auf.
  - type: multiple
    question: Warum prüft das Frontend API-Antworten mit Zod, obwohl es TypeScript gibt?
    options:
      - TypeScript-Typen existieren zur Laufzeit nicht mehr.
      - Weicht die API vom Vertrag ab, gibt es einen klaren Fehler an der Grenze statt eines rätselhaften Absturzes tief in einer Komponente.
      - Zod macht Anfragen schneller.
      - Aus dem Schema lässt sich der TypeScript-Typ ableiten.
    answers: [0, 1, 3]
    explanation: Typen sind ein Versprechen zur Entwicklungszeit, Zod prüft zur Laufzeit. `z.infer` verbindet beides.
  - type: cloze
    text: Komponenten lesen gecachte Daten, die ein Loader vorab geladen hat, mit dem Hook ___.
    blanks:
      - [useSuspenseQuery]
    explanation: "`useSuspenseQuery` liefert `data` garantiert gefüllt – passend zu einem Loader, der die Daten vorher sicherstellt."
tasks:
  - id: navigation-ablauf
    type: order
    title: Was passiert beim Klick auf einen Workshop?
    description: Ein Mitglied klickt in der Liste auf „Erste Hilfe“. Bringe die Schritte in die richtige Reihenfolge.
    items:
      - Der Link ändert die URL auf /workshops/3.
      - React Router findet die Route workshops/:id und ruft ihren Loader auf.
      - Der Loader ruft queryClient.ensureQueryData(workshopQuery(3)) auf.
      - Nichts im Cache – fetchWorkshop(3) fragt die API.
      - Zod prüft die Antwort und gibt einen typisierten Workshop zurück.
      - Die Komponente rendert und liest die Daten mit useSuspenseQuery aus dem Cache.
    hints:
      - Erst die URL, dann der Router, dann der Loader – und gerendert wird ganz zum Schluss.
  - id: query-keys
    type: code
    language: ts
    title: Query-Keys und eine Anzeige-Hilfe
    description: |
      Schreibe zwei kleine Bausteine der Datenschicht:

      1. `workshopKeys` – ein Objekt mit `all` (der Key `['workshops']`) und der Funktion `detail(id)`, die
         `['workshops', id]` zurückgibt. Weil der Detail-Key mit `'workshops'` beginnt, trifft ein
         `invalidateQueries({ queryKey: workshopKeys.all })` auch alle Details.
      2. `seatsLabel(seatsLeft, capacity)` – der Text für die Liste:
         - `0` freie Plätze → `"Ausgebucht"`
         - genau `1` → `"Noch 1 Platz frei"`
         - sonst → `"Noch 5 von 12 Plätzen frei"` (mit den echten Zahlen)
    starter: |
      const workshopKeys = {
        all: [] as string[],
        detail: (id: number) => [] as (string | number)[],
      }

      function seatsLabel(seatsLeft: number, capacity: number): string {
        return ''
      }
    tests:
      - name: all ist ['workshops']
        code: assertDeepEqual(workshopKeys.all, ['workshops'])
      - name: detail(3) ist ['workshops', 3]
        code: assertDeepEqual(workshopKeys.detail(3), ['workshops', 3])
      - name: Detail-Key beginnt mit dem all-Key
        code: assertEqual(workshopKeys.detail(7)[0], workshopKeys.all[0])
      - name: Ausgebucht
        code: assertEqual(seatsLabel(0, 12), 'Ausgebucht')
      - name: Ein Platz in der Einzahl
        code: assertEqual(seatsLabel(1, 12), 'Noch 1 Platz frei')
      - name: Mehrere Plätze
        code: assertEqual(seatsLabel(5, 12), 'Noch 5 von 12 Plätzen frei')
    solution: |
      const workshopKeys = {
        all: ['workshops'] as const,
        detail: (id: number) => ['workshops', id] as const,
      }

      function seatsLabel(seatsLeft: number, capacity: number): string {
        if (seatsLeft <= 0) return 'Ausgebucht'
        if (seatsLeft === 1) return 'Noch 1 Platz frei'
        return `Noch ${seatsLeft} von ${capacity} Plätzen frei`
      }
    hints:
      - "`detail: (id: number) => ['workshops', id] as const` – das `as const` macht daraus ein Tupel."
      - Prüfe in seatsLabel zuerst auf 0, dann auf 1, sonst der allgemeine Text mit Template-String.
---
Die API steht und ist getestet. Jetzt baust du die Oberfläche. Der größte Fehler an dieser Stelle: in jeder
Komponente selbst `fetch` aufrufen, JSON auspacken und Ladezustände verwalten. Nach zehn Komponenten gibt es
zehn leicht unterschiedliche Varianten davon. Deshalb bekommt das Frontend von Vereinskurse **Schichten** –
jede mit genau einer Aufgabe.

## Fünf Schichten, eine Richtung

| Schicht | Datei | Aufgabe | Kennt |
|---|---|---|---|
| Vertrag | `schema.ts` | Zod-Schemas und Typen | nur Zod |
| API-Client | `api.ts` | `fetch`, Header, Token, Fehler | Vertrag |
| Queries | `queries.ts` | Query-Keys, `queryOptions` | API-Client |
| Routen | `router.tsx`, `actions.ts` | Loader, Actions, Weiterleitungen | Queries, API-Client |
| Komponenten | `pages.tsx` | anzeigen, Formulare | Queries, Router-Hooks |

Abhängigkeiten zeigen nur **nach unten**. Eine Komponente weiß nicht, wie die URL der API lautet. Ändert sich
der Server, passt du eine Datei an, nicht zwanzig. Das kennst du als
[[schichtenarchitektur|Schichtenarchitektur]] aus dem Backend.

> [!MERKSATZ]
> Komponenten zeigen an. Wo Daten herkommen und wie sie geprüft werden, entscheiden die Schichten darunter.

## Der Vertrag zur Laufzeit

TypeScript-Typen verschwinden beim Build. Ob die API wirklich liefert, was sie verspricht, merkst du ohne
Prüfung erst, wenn tief in einer Komponente `undefined` auftaucht. [[zod|Zod]] prüft die Antwort deshalb an
der Grenze – [[laufzeitvalidierung|Laufzeitvalidierung]]:

```ts title="src/schema.ts (Auszug)"
export const workshopSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  description: z.string().nullable(),
  location: z.string(),
  starts_at: z.iso.datetime({ offset: true }),
  capacity: z.number().int().min(0),
  seats_left: z.number().int().min(0),
})

export type Workshop = z.infer<typeof workshopSchema>
```

Der Typ `Workshop` entsteht per [[z-infer|z.infer]] aus dem Schema. So beschreibst du jedes Feld nur
**einmal**. Das Schema spiegelt die `WorkshopResource` der API – beide zusammen sind dein Vertrag.

> [!FEHLER]
> `response.json() as Workshop[]` schreiben. Das ist eine Behauptung, keine Prüfung. Stimmt sie nicht, bricht
> die App an einer ganz anderen Stelle mit einer unverständlichen Meldung.

## Wer lädt, wer cached?

React Router und TanStack Query können beide Daten laden. In Vereinskurse teilen sie sich die Arbeit:

- **[[route-loader|Loader]]** (React Router, [[data-mode|Data Mode]]): entscheidet, **wann** geladen wird –
  vor dem Rendern einer Route.
- **[[tanstack-query|TanStack Query]]**: entscheidet, **ob** geladen werden muss – über seinen Cache mit
  [[query-key|Query-Keys]] und [[stale-time|staleTime]].

```tsx title="src/router.tsx (Auszug)"
{
  path: 'workshops/:id',
  Component: WorkshopDetail,
  loader: ({ params }) => queryClient.ensureQueryData(workshopQuery(Number(params.id))),
  action: bookAction,
}
```

`ensureQueryData` gibt Daten aus dem Cache zurück oder lädt sie. Die Komponente liest sie mit
`useSuspenseQuery(workshopQuery(id))` – `data` ist dort immer gefüllt, kein Ladezustand im JSX nötig.

## Query-Keys aus einer Fabrik

Query-Keys sind Arrays. Damit sie überall gleich geschrieben werden, erzeugt sie eine
[[query-key-fabrik|Query-Key-Fabrik]], und [[query-options|queryOptions]] bündelt Key und Ladefunktion:

```ts title="src/queries.ts"
export const workshopKeys = {
  all: ['workshops'] as const,
  detail: (id: number) => ['workshops', id] as const,
}

export function workshopQuery(id: number) {
  return queryOptions({ queryKey: workshopKeys.detail(id), queryFn: () => fetchWorkshop(id) })
}
```

Weil jeder Detail-Key mit `'workshops'` beginnt, erneuert `invalidateQueries({ queryKey: workshopKeys.all })`
nach einer Buchung Liste **und** Details auf einen Schlag.

> [!PRAXIS]
> Importe eigener Dateien schreibst du im Projekt mit Endung (`./api.ts`). Das erlaubt die Option
> `allowImportingTsExtensions` im Vite-Template – und Node.js kann die Dateien dadurch direkt ausführen. Die
> Projektprüfungen nutzen genau das.

## Checkliste für die Frontend-Struktur

1. Kein `fetch` außerhalb von `api.ts`.
2. Jede Antwort läuft durch ein Zod-Schema.
3. Query-Keys kommen aus einer Fabrik, nie als Tippfehler-anfällige Literale.
4. Datenrouten haben einen Loader mit `ensureQueryData`.
5. Komponenten lesen mit `useSuspenseQuery` und zeigen nur an.

## Zusammenfassung

- Das Frontend hat fünf Schichten: **Vertrag, API-Client, Queries, Routen, Komponenten**.
- **Zod** prüft API-Antworten zur Laufzeit, `z.infer` leitet die Typen ab.
- **Loader** bestimmen, wann geladen wird, **TanStack Query** cached und entscheidet, ob.
- `ensureQueryData` im Loader und `useSuspenseQuery` in der Komponente arbeiten mit demselben Cache.
- Eine **Query-Key-Fabrik** macht Invalidierung zuverlässig.
