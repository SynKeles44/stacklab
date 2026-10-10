---
title: Optimistische Updates
summary: Die Oberfläche sofort ändern, bevor der Server antwortet – und bei einem Fehler sauber zurückrollen.
duration: 25
sources:
  - title: TanStack Query – Optimistic Updates
    url: https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
  - title: TanStack Query – useMutation Referenz
    url: https://tanstack.com/query/latest/docs/framework/react/reference/useMutation
  - title: TanStack Query – useMutationState Referenz
    url: https://tanstack.com/query/latest/docs/framework/react/reference/useMutationState
quiz:
  - type: single
    question: Was ist ein optimistisches Update?
    options:
      - Ein Request, der garantiert nie fehlschlägt.
      - Die Oberfläche zeigt das erwartete Ergebnis sofort an und gleicht es danach mit dem Server ab.
      - Ein Update, das erst nach dem Neuladen der Seite sichtbar wird.
      - Ein Cache, der nie veraltet.
    answer: 1
    explanation: Du nimmst den Erfolg vorweg, damit sich die App sofort anfühlt. Schlägt der Request fehl, rollst du die Anzeige zurück.
  - type: find-bug
    question: Kommt eine alte Antwort der Liste nach dem optimistischen Update an, springt der Haken kurz zurück. Welche Zeile fehlt sinngemäß in `onMutate` – bzw. welche Zeile steht an der falschen Stelle?
    language: ts
    code: |
      onMutate: async (aufgabe) => {
        const vorher = queryClient.getQueryData<Aufgabe[]>(aufgabenKeys.all)
        queryClient.setQueryData<Aufgabe[]>(aufgabenKeys.all, (alt) =>
          alt?.map((a) => (a.id === aufgabe.id ? { ...a, erledigt: !a.erledigt } : a)),
        )
        await queryClient.cancelQueries({ queryKey: aufgabenKeys.all })
        return { vorher }
      },
    bug_line: 6
    explanation: "`cancelQueries` muss **vor** dem Schreiben in den Cache stehen. Sonst kann ein bereits laufender Refetch nach deinem optimistischen Update ankommen und es mit alten Daten überschreiben."
  - type: multiple
    question: Welche Aufgaben übernimmt `onError` bei einem optimistischen Update?
    options:
      - Den Cache auf den Schnappschuss aus onMutate zurücksetzen
      - Dem Nutzer zeigen, dass das Speichern nicht geklappt hat
      - Den Request automatisch erneut senden
      - Die Seite neu laden
    answers: [0, 1]
    explanation: Der Rollback stellt den alten Stand wieder her, und der Nutzer muss erfahren, dass seine Aktion nicht gespeichert wurde. Ein automatischer Retry ist bei Mutationen bewusst nicht Standard.
  - type: cloze
    text: "Den Schnappschuss aus `onMutate` bekommt `onError` als dritten Parameter, in der aktuellen Version heißt er `___`. Zum Schluss sorgt `___` (egal ob Erfolg oder Fehler) per Invalidierung dafür, dass der Cache wieder dem Server entspricht."
    blanks:
      - [onMutateResult]
      - [onSettled]
    explanation: Ältere Beispiele nennen den dritten Parameter noch `context`. Gemeint ist immer der Rückgabewert von onMutate.
tasks:
  - id: optimistisch-umschalten
    type: code
    language: ts
    title: Optimistisch abhaken mit Rollback
    description: |
      Du schreibst die drei Callbacks einer Mutation, die eine Aufgabe abhakt. Statt eines echten QueryClient
      bekommst du einen kleinen Nachbau `client` mit denselben Methoden (`getQueryData`, `setQueryData`,
      `cancelQueries`, `invalidateQueries`). Die Liste liegt unter dem Key `['aufgaben']`.

      1. `onMutate(aufgabe, client)`: Rufe zuerst `await client.cancelQueries(...)` auf. Merke dir dann den
         aktuellen Cache-Inhalt als `vorher`, schreibe eine **neue** Liste in den Cache, in der bei der Aufgabe mit
         gleicher `id` `erledigt` umgedreht ist, und gib `{ vorher }` zurück.
      2. `onError(fehler, aufgabe, ergebnis, client)`: Schreibe `ergebnis.vorher` zurück in den Cache.
      3. `onSettled(client)`: Invalidiere `['aufgaben']`.

      Verändere die alte Liste nicht direkt – erzeuge mit `map` und dem Spread-Operator neue Objekte.
    starter: |
      type Aufgabe = { id: number; titel: string; erledigt: boolean }
      type Client = {
        getQueryData: (key: unknown[]) => Aufgabe[] | undefined
        setQueryData: (key: unknown[], daten: Aufgabe[] | undefined) => void
        cancelQueries: (filter: { queryKey: unknown[] }) => Promise<void>
        invalidateQueries: (filter: { queryKey: unknown[] }) => Promise<void>
      }

      const KEY = ['aufgaben']

      async function onMutate(aufgabe: Aufgabe, client: Client) {
        return { vorher: undefined as Aufgabe[] | undefined }
      }

      function onError(fehler: Error, aufgabe: Aufgabe, ergebnis: { vorher?: Aufgabe[] } | undefined, client: Client) {
      }

      function onSettled(client: Client) {
      }

      function testClient(start: Aufgabe[]) {
        const protokoll: string[] = []
        let daten: Aufgabe[] | undefined = start
        const client: Client = {
          getQueryData: () => daten,
          setQueryData: (_key, neu) => { protokoll.push('set'); daten = neu },
          cancelQueries: async () => { protokoll.push('cancel') },
          invalidateQueries: async (filter) => { protokoll.push('invalidate:' + JSON.stringify(filter.queryKey)) },
        }
        return { client, protokoll, aktuell: () => daten }
      }
    tests:
      - name: onMutate hakt die richtige Aufgabe ab
        code: |
          const start = [{ id: 1, titel: 'A', erledigt: false }, { id: 2, titel: 'B', erledigt: false }]
          const t = testClient(start)
          await onMutate(start[0], t.client)
          assertEqual(t.aktuell()[0].erledigt, true)
          assertEqual(t.aktuell()[1].erledigt, false)
      - name: onMutate bricht zuerst laufende Queries ab
        code: |
          const start = [{ id: 1, titel: 'A', erledigt: false }]
          const t = testClient(start)
          await onMutate(start[0], t.client)
          assertEqual(t.protokoll[0], 'cancel', 'cancelQueries muss vor setQueryData aufgerufen werden.')
      - name: onMutate verändert die alte Liste nicht
        code: |
          const start = [{ id: 1, titel: 'A', erledigt: false }]
          const t = testClient(start)
          const ergebnis = await onMutate(start[0], t.client)
          assertEqual(start[0].erledigt, false, 'Die alte Liste wurde direkt verändert.')
          assertTrue(ergebnis.vorher === start, 'onMutate soll den alten Stand als vorher zurückgeben.')
      - name: onError rollt zurück
        code: |
          const start = [{ id: 1, titel: 'A', erledigt: true }]
          const t = testClient(start)
          const ergebnis = await onMutate(start[0], t.client)
          assertEqual(t.aktuell()[0].erledigt, false)
          onError(new Error('500'), start[0], ergebnis, t.client)
          assertEqual(t.aktuell()[0].erledigt, true)
      - name: onSettled invalidiert die Liste
        code: |
          const t = testClient([])
          await onSettled(t.client)
          assertEqual(t.protokoll[t.protokoll.length - 1], 'invalidate:["aufgaben"]')
    hints:
      - "Reihenfolge in onMutate: `await client.cancelQueries({ queryKey: KEY })`, dann `const vorher = client.getQueryData(KEY)`."
      - "Die neue Liste: `vorher?.map((a) => (a.id === aufgabe.id ? { ...a, erledigt: !a.erledigt } : a))`."
      - "onError: `client.setQueryData(KEY, ergebnis?.vorher)`. onSettled: `return client.invalidateQueries({ queryKey: KEY })`."
    solution: |
      type Aufgabe = { id: number; titel: string; erledigt: boolean }
      type Client = {
        getQueryData: (key: unknown[]) => Aufgabe[] | undefined
        setQueryData: (key: unknown[], daten: Aufgabe[] | undefined) => void
        cancelQueries: (filter: { queryKey: unknown[] }) => Promise<void>
        invalidateQueries: (filter: { queryKey: unknown[] }) => Promise<void>
      }

      const KEY = ['aufgaben']

      async function onMutate(aufgabe: Aufgabe, client: Client) {
        await client.cancelQueries({ queryKey: KEY })
        const vorher = client.getQueryData(KEY)
        client.setQueryData(
          KEY,
          vorher?.map((a) => (a.id === aufgabe.id ? { ...a, erledigt: !a.erledigt } : a)),
        )
        return { vorher }
      }

      function onError(fehler: Error, aufgabe: Aufgabe, ergebnis: { vorher?: Aufgabe[] } | undefined, client: Client) {
        client.setQueryData(KEY, ergebnis?.vorher)
      }

      function onSettled(client: Client) {
        return client.invalidateQueries({ queryKey: KEY })
      }

      function testClient(start: Aufgabe[]) {
        const protokoll: string[] = []
        let daten: Aufgabe[] | undefined = start
        const client: Client = {
          getQueryData: () => daten,
          setQueryData: (_key, neu) => { protokoll.push('set'); daten = neu },
          cancelQueries: async () => { protokoll.push('cancel') },
          invalidateQueries: async (filter) => { protokoll.push('invalidate:' + JSON.stringify(filter.queryKey)) },
        }
        return { client, protokoll, aktuell: () => daten }
      }
  - id: optimistisch-ablauf
    type: steps
    title: Was passiert als Nächstes?
    description: Eine Aufgabe wird optimistisch abgehakt. Verfolge, was Cache und Oberfläche tun.
    steps:
      - situation: Der Nutzer klickt auf die Checkbox von „Einkaufen“. onMutate hat laufende Queries abgebrochen und einen Schnappschuss gemacht.
        question: Was zeigt die Liste, während der Request noch unterwegs ist?
        options: [Einen Spinner statt der Liste, „Einkaufen“ bereits abgehakt, „Einkaufen“ noch nicht abgehakt]
        answer: 1
        explanation: onMutate hat die neue Liste schon in den Cache geschrieben. Die Komponente rendert sofort den erwarteten Endzustand.
      - situation: Der Server antwortet mit 500 Internal Server Error.
        question: Was passiert jetzt?
        options: [Der Haken bleibt einfach stehen, onError schreibt den Schnappschuss zurück – der Haken verschwindet, TanStack Query wiederholt die Mutation dreimal]
        answer: 1
        explanation: Der Rollback stellt den Stand vor dem Klick wieder her. Zeig dem Nutzer zusätzlich eine Meldung, sonst wundert er sich, warum der Haken verschwindet.
      - situation: onError ist fertig. Als Nächstes läuft onSettled.
        question: Warum invalidiert onSettled die Liste trotz Rollback?
        options: [Damit der Cache garantiert dem echten Stand des Servers entspricht, Weil sonst gcTime nicht abläuft, Das ist überflüssig]
        answer: 0
        explanation: Vielleicht hat in der Zwischenzeit jemand anderes die Liste geändert. Ein Refetch nach jeder Mutation bringt den Cache sicher wieder auf den Server-Stand.
---
Du klickst auf eine Checkbox, und es dauert eine halbe Sekunde, bis der Haken erscheint. Fühlt sich kaputt an,
obwohl alles richtig läuft. Apps wie Messenger oder To-do-Listen zeigen das Ergebnis deshalb **sofort** an und
fragen den Server erst danach. Das nennt man ein optimistisches Update.

## Die Idee

Bei einem [[optimistisches-update|optimistischen Update]] gehst du davon aus, dass der Server die Änderung
annehmen wird – meistens stimmt das ja. Du änderst also zuerst den Cache, dann schickst du den Request:

![Ablauf eines optimistischen Updates zwischen Oberfläche, Cache und Server](/assets/server-state-tanstack/optimistisches-update.svg)

| Phase | Callback | Was passiert |
|---|---|---|
| Vorher | `onMutate` | Laufende Queries abbrechen, Schnappschuss merken, Cache optimistisch ändern |
| Fehler | `onError` | Schnappschuss zurückschreiben ([[rollback|Rollback]]) |
| Immer | `onSettled` | Invalidieren, damit der Cache wieder dem Server entspricht |

Ein Alltagsbild: Du trägst einen Termin schon mit Bleistift in den Kalender ein, bevor die Zusage kommt.
Kommt eine Absage, radierst du ihn wieder aus.

## Schritt 1: onMutate

```tsx title="useAufgabeUmschalten.ts"
const queryClient = useQueryClient()

return useMutation({
  mutationFn: (aufgabe: Aufgabe) => aufgabeSpeichern({ ...aufgabe, erledigt: !aufgabe.erledigt }),
  onMutate: async (aufgabe) => {
    await queryClient.cancelQueries({ queryKey: aufgabenKeys.all })
    const vorher = queryClient.getQueryData<Aufgabe[]>(aufgabenKeys.all)
    queryClient.setQueryData<Aufgabe[]>(aufgabenKeys.all, (alt) =>
      alt?.map((a) => (a.id === aufgabe.id ? { ...a, erledigt: !a.erledigt } : a)),
    )
    return { vorher }
  },
  // ...
})
```

Drei Zeilen, drei Gründe:

1. `cancelQueries` bricht einen eventuell laufenden Refetch ab. Sonst könnte dessen alte Antwort dein
   optimistisches Update überschreiben.
2. `getQueryData` liest den aktuellen Stand – den Schnappschuss für den Rollback.
3. `setQueryData` mit einer [[updater-funktion|Updater-Funktion]] schreibt mit `map` und dem [[spread-operator|Spread-Operator]] eine **neue** Liste in den Cache.

Was `onMutate` zurückgibt, reicht TanStack Query an die anderen Callbacks weiter.

## Schritt 2 und 3: onError und onSettled

```tsx
  onError: (_fehler, _aufgabe, onMutateResult) => {
    queryClient.setQueryData(aufgabenKeys.all, onMutateResult?.vorher)
    zeigeMeldung('Speichern fehlgeschlagen')
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: aufgabenKeys.all }),
```

Der dritte Parameter heißt in der aktuellen Version `onMutateResult`; in älteren Beispielen findest du dafür
noch den Namen `context`. Zusätzlich bekommt jeder Callback als letzten Parameter ein Kontext-Objekt, in dem
unter anderem `client` steckt – der QueryClient. So kannst du Mutationen auch außerhalb von Komponenten
definieren, ohne `useQueryClient`.

> [!FEHLER]
> **Den Cache direkt verändern.** `alt.find((a) => a.id === id).erledigt = true` ändert das bestehende Objekt.
> React vergleicht aber Referenzen – für React hat sich nichts geändert, und dein Schnappschuss ist gleich mit
> kaputt. Erzeuge immer neue Arrays und Objekte mit `map` und Spread-Operator.

## Die einfache Variante: über die Variablen

Nicht jedes optimistische Update braucht einen Cache-Umbau. Wird die Änderung nur an **einer** Stelle
angezeigt, reicht es, während der Mutation die gesendeten `variables` zu rendern:

```tsx
const anlegen = useMutation({
  mutationFn: aufgabeAnlegen,
  onSettled: () => queryClient.invalidateQueries({ queryKey: aufgabenKeys.all }),
})

return (
  <ul>
    {aufgaben.map((a) => <li key={a.id}>{a.titel}</li>)}
    {anlegen.isPending && <li style={{ opacity: 0.5 }}>{anlegen.variables.titel}</li>}
  </ul>
)
```

Kein Schnappschuss, kein Rollback: Schlägt die Mutation fehl, verschwindet der halbtransparente Eintrag von
selbst. Braucht eine **andere** Komponente die laufenden Variablen, gibst du der Mutation einen `mutationKey`
und liest sie dort mit `useMutationState` aus.

> [!MERKSATZ]
> Wird die Änderung an einer Stelle gezeigt: **Variablen rendern**. Betrifft sie mehrere Stellen im Cache (Liste,
> Zähler, Detailseite): **Cache optimistisch ändern** mit Schnappschuss und Rollback.

> [!PRAXIS]
> Optimistisch arbeiten lohnt sich bei kleinen, fast immer erfolgreichen Aktionen: abhaken, liken, umbenennen.
> Bei Zahlungen oder Bestellungen wartest du lieber auf die Bestätigung des Servers – dort wäre ein Rollback
> für Nutzer verwirrend.

## Zusammenfassung

- Ein **optimistisches Update** zeigt das erwartete Ergebnis sofort an und gleicht danach mit dem Server ab.
- `onMutate`: erst `cancelQueries`, dann Schnappschuss mit `getQueryData`, dann `setQueryData` mit neuem Objekt.
- `onError`: Schnappschuss zurückschreiben und den Nutzer informieren.
- `onSettled`: invalidieren, damit der Cache wieder dem Server entspricht.
- Für Anzeigen an nur einer Stelle reicht es, `mutation.variables` während `isPending` zu rendern.
- Nicht jede Aktion eignet sich: Bei Geld und Bestellungen auf die Server-Bestätigung warten.
