---
title: Formulare, Actions und Fehler
summary: Eingaben im Browser mit Zod prüfen, Serverfehler aus Laravel an die richtigen Felder hängen und den Cache nach einer Änderung erneuern.
duration: 25
sources:
  - title: React Router – Actions
    url: https://reactrouter.com/start/data/actions
  - title: React Router – useFetcher
    url: https://reactrouter.com/api/hooks/useFetcher
  - title: TanStack Query – Query Invalidation
    url: https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation
  - title: Zod – Formatting errors
    url: https://zod.dev/error-formatting
quiz:
  - type: single
    question: Warum validiert Vereinskurse Eingaben im Browser **und** auf dem Server?
    options:
      - Doppelt hält besser, beides ist austauschbar.
      - Der Browser gibt schnelle Rückmeldung, der Server ist die einzige Prüfung, auf die man sich verlassen kann.
      - Der Server prüft nur, wenn der Browser es vergessen hat.
    answer: 1
    explanation: >
      Client-Validierung ist Komfort – sie lässt sich umgehen. Die Serverprüfung im Form Request ist
      verbindlich. Das Frontend muss deshalb auch mit Serverfehlern umgehen können.
  - type: multiple
    question: Was gehört in eine Action, die einen Workshop anlegt?
    options:
      - Formulardaten lesen und mit `safeParse` prüfen
      - Bei Fehlern `{ errors }` zurückgeben, damit das Formular stehen bleibt
      - Nach Erfolg den Cache invalidieren und weiterleiten
      - Direkt in der Datenbank speichern
    answers: [0, 1, 2]
    explanation: Die Action redet über den API-Client mit dem Server – nie direkt mit der Datenbank.
  - type: match
    question: Was zeigt das Frontend bei welcher Antwort?
    pairs:
      - { left: "201", right: "Weiterleitung zur Detailseite" }
      - { left: "422", right: "Fehlertexte an den Formularfeldern" }
      - { left: "409", right: "Allgemeine Meldung, z. B. ausgebucht" }
      - { left: "401", right: "Weiterleitung zur Anmeldung" }
    explanation: Jeder Statuscode bekommt eine eigene, passende Reaktion.
  - type: find-bug
    question: Nach einer Buchung zeigt die Liste weiter die alte Zahl freier Plätze. Welche Zeile ist schuld?
    language: ts
    code: |
      export async function bookAction({ params }: ActionFunctionArgs) {
        await bookWorkshop(Number(params.id))
        await queryClient.invalidateQueries({ queryKey: ['workshop'] })
        return { ok: true, error: null }
      }
    bug_line: 3
    explanation: >
      Der Key heißt `['workshops']` – mit s. `['workshop']` trifft keine Query, nichts wird erneuert. Genau
      diesen Tippfehler verhindert eine Query-Key-Fabrik: `workshopKeys.all`.
tasks:
  - id: laravel-fehler-abbilden
    type: code
    language: ts
    title: Laravel-Fehler an Formularfelder hängen
    description: |
      Laravel antwortet bei ungültigen Eingaben mit 422 und diesem Body:

      ```json
      { "message": "The title field is required. (and 1 more error)", "errors": { "title": ["The title field is required."], "capacity": ["The capacity field must be at least 1."] } }
      ```

      Schreibe `toFieldErrors(status, body)`. Sie gibt ein Objekt zurück, das pro Feld die **erste** Meldung
      enthält, z. B. `{ title: 'The title field is required.', capacity: '…' }`.

      - Bei Status `422` mit einem `errors`-Objekt: pro Feld den ersten Eintrag übernehmen. Leere Listen auslassen.
      - Bei jedem anderen Status oder ohne `errors`: ein leeres Objekt `{}`.
    starter: |
      type LaravelErrorBody = { message?: string; errors?: Record<string, string[]> }

      function toFieldErrors(status: number, body: LaravelErrorBody): Record<string, string> {
        return {}
      }
    tests:
      - name: Erste Meldung pro Feld
        code: |
          const result = toFieldErrors(422, { message: 'x', errors: { title: ['A', 'B'], capacity: ['C'] } })
          assertDeepEqual(result, { title: 'A', capacity: 'C' })
      - name: Andere Statuscodes ergeben nichts
        code: |
          assertDeepEqual(toFieldErrors(409, { message: 'Ausgebucht', errors: { title: ['A'] } }), {})
      - name: Fehlendes errors-Objekt
        code: |
          assertDeepEqual(toFieldErrors(422, { message: 'kaputt' }), {})
      - name: Leere Listen werden ausgelassen
        code: |
          assertDeepEqual(toFieldErrors(422, { errors: { title: [], location: ['L'] } }), { location: 'L' })
    solution: |
      type LaravelErrorBody = { message?: string; errors?: Record<string, string[]> }

      function toFieldErrors(status: number, body: LaravelErrorBody): Record<string, string> {
        if (status !== 422 || !body.errors) return {}
        const result: Record<string, string> = {}
        for (const [field, messages] of Object.entries(body.errors)) {
          if (messages.length > 0) result[field] = messages[0]
        }
        return result
      }
    hints:
      - "`Object.entries(body.errors)` liefert Paare aus Feldname und Meldungsliste."
      - Prüfe zuerst `status !== 422 || !body.errors` und gib dann `{}` zurück.
  - id: formular-mit-pruefung
    type: code
    language: tsx
    title: Ein Formular mit Client- und Serverfehlern
    description: |
      Baue das Formular „Workshop anlegen“ als Komponente `App`. Die Funktion `saveWorkshop` im Starter spielt
      den Server: Sie antwortet mit `{ status: 422, errors: … }`, wenn es den Titel schon gibt, sonst mit
      `{ status: 201 }`.

      1. Das Formular hat die Felder `<input name="title">` und `<input name="capacity">` und einen
         `<button type="submit">`.
      2. Beim Absenden prüfst du **zuerst im Browser**: Titel (ohne Leerzeichen am Rand) kürzer als 3 Zeichen →
         Fehler `Mindestens 3 Zeichen.` in `<p class="fehler-title">`. Kapazität keine ganze Zahl von 1 bis 500 →
         `1 bis 500 Plätze.` in `<p class="fehler-capacity">`. Dann **nicht** speichern.
      3. Ist alles gültig, rufe `saveWorkshop({ title, capacity })` auf. Bei 422 zeigst du die **erste**
         Servermeldung je Feld im passenden Fehler-Absatz an.
      4. Bei 201 verschwinden alle Fehler und `<p class="erfolg">` zeigt `Gespeichert: <Titel>`.

      Fehler-Absätze erscheinen nur, wenn es für das Feld einen Fehler gibt.
    starter: |
      type Result = { status: 201 } | { status: 422; errors: Record<string, string[]> }

      function saveWorkshop(data: { title: string; capacity: number }): Result {
        if (data.title === 'Yoga') {
          return { status: 422, errors: { title: ['Diesen Titel gibt es schon.'] } }
        }
        return { status: 201 }
      }

      function App() {
        const [errors, setErrors] = React.useState<Record<string, string>>({})
        const [saved, setSaved] = React.useState<string | null>(null)

        function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          // Hier prüfen und speichern
        }

        return (
          <form onSubmit={handleSubmit}>
            <input name="title" />
            <input name="capacity" />
            <button type="submit">Speichern</button>
          </form>
        )
      }
    tests:
      - name: Am Anfang keine Fehler
        code: |
          assertEqual(query('.fehler-title'), null)
          assertEqual(query('.fehler-capacity'), null)
          assertTrue(query('button[type="submit"]') !== null)
      - name: Ungültige Eingaben werden im Browser abgefangen
        code: |
          await type('input[name="title"]', ' x ')
          await type('input[name="capacity"]', '0')
          await click('button[type="submit"]')
          assertEqual(query('.fehler-title') && query('.fehler-title').textContent, 'Mindestens 3 Zeichen.')
          assertEqual(query('.fehler-capacity') && query('.fehler-capacity').textContent, '1 bis 500 Plätze.')
          assertEqual(query('.erfolg'), null)
      - name: Kommazahlen sind keine gültige Kapazität
        code: |
          await type('input[name="title"]', 'Kochabend')
          await type('input[name="capacity"]', '2.5')
          await click('button[type="submit"]')
          assertEqual(query('.fehler-title'), null)
          assertTrue(query('.fehler-capacity') !== null)
      - name: Serverfehler landet am Feld
        code: |
          await type('input[name="title"]', 'Yoga')
          await type('input[name="capacity"]', '10')
          await click('button[type="submit"]')
          assertEqual(query('.fehler-title') && query('.fehler-title').textContent, 'Diesen Titel gibt es schon.')
          assertEqual(query('.fehler-capacity'), null)
          assertEqual(query('.erfolg'), null)
      - name: Erfolg zeigt die Bestätigung
        code: |
          await type('input[name="title"]', '  Kochabend  ')
          await type('input[name="capacity"]', '12')
          await click('button[type="submit"]')
          assertEqual(query('.erfolg') && query('.erfolg').textContent, 'Gespeichert: Kochabend')
          assertEqual(query('.fehler-title'), null)
    solution: |
      type Result = { status: 201 } | { status: 422; errors: Record<string, string[]> }

      function saveWorkshop(data: { title: string; capacity: number }): Result {
        if (data.title === 'Yoga') {
          return { status: 422, errors: { title: ['Diesen Titel gibt es schon.'] } }
        }
        return { status: 201 }
      }

      function App() {
        const [errors, setErrors] = React.useState<Record<string, string>>({})
        const [saved, setSaved] = React.useState<string | null>(null)

        function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          const title = String(form.get('title') ?? '').trim()
          const capacity = Number(form.get('capacity'))

          const clientErrors: Record<string, string> = {}
          if (title.length < 3) clientErrors.title = 'Mindestens 3 Zeichen.'
          if (!Number.isInteger(capacity) || capacity < 1 || capacity > 500) clientErrors.capacity = '1 bis 500 Plätze.'
          if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors)
            setSaved(null)
            return
          }

          const result = saveWorkshop({ title, capacity })
          if (result.status === 422) {
            const serverErrors: Record<string, string> = {}
            for (const [field, messages] of Object.entries(result.errors)) {
              if (messages.length > 0) serverErrors[field] = messages[0]
            }
            setErrors(serverErrors)
            setSaved(null)
            return
          }

          setErrors({})
          setSaved(title)
        }

        return (
          <form onSubmit={handleSubmit}>
            <input name="title" />
            {errors.title && <p className="fehler-title">{errors.title}</p>}
            <input name="capacity" />
            {errors.capacity && <p className="fehler-capacity">{errors.capacity}</p>}
            <button type="submit">Speichern</button>
            {saved && <p className="erfolg">Gespeichert: {saved}</p>}
          </form>
        )
      }
    hints:
      - "`Number('2.5')` ist `2.5` – mit `Number.isInteger` erkennst du Kommazahlen."
      - Sammle die Client-Fehler in einem Objekt. Ist es nicht leer, setze es als State und brich ab.
      - Bei 422 nimmst du pro Feld `messages[0]` – wie in der Aufgabe davor.
---
Ein Mitglied tippt „Yo“ als Titel und 0 als Kapazität, klickt auf „Speichern“ – und dann? Gute Formulare
sagen sofort und **am richtigen Feld**, was nicht stimmt. Kommt ein Fehler erst vom Server, gehört er
genauso ans Feld. Und nach dem Speichern muss die Liste den neuen Workshop zeigen, ohne dass jemand die Seite
neu lädt.

## Zwei Prüfungen, zwei Aufgaben

| | Im Browser (Zod) | Auf dem Server (Form Request) |
|---|---|---|
| Zweck | schnelle Rückmeldung | verbindliche Prüfung |
| Umgehbar? | ja, mit jedem HTTP-Client | nein |
| Kennt den Datenbestand? | nein | ja (z. B. „Titel schon vergeben“) |

Das Frontend braucht deshalb **beides**: eigene Prüfungen für die schnellen Fälle und eine saubere
Darstellung der Serverfehler. Die Regeln sollen übereinstimmen – `newWorkshopSchema` spiegelt den
`StoreWorkshopRequest`.

> [!MERKSATZ]
> Client-Validierung ist Komfort, Server-Validierung ist Sicherheit. Das Formular muss mit beiden Fehlerarten
> umgehen.

## Die Action als zentrale Stelle

Im [[data-mode|Data Mode]] schickt ein `<Form method="post">` seine Daten an die [[route-action|Action]] der
Route. Dort läuft der ganze Ablauf an einem Ort:

```ts title="src/actions.ts"
export async function createWorkshopAction({ request }: ActionFunctionArgs) {
  const parsed = newWorkshopSchema.safeParse(Object.fromEntries(await request.formData()))
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors as FieldErrors }
  }
  try {
    const workshop = await createWorkshop(parsed.data)
    await queryClient.invalidateQueries({ queryKey: workshopKeys.all })
    return redirect(`/workshops/${workshop.id}`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 422) return { errors: error.errors as FieldErrors }
    throw error
  }
}
```

Zurückgegebene `{ errors }` lassen das Formular stehen; die Komponente liest sie mit `useActionData`.
[[safe-parse|safeParse]] wirft nicht, sondern liefert `success` und die Fehler. `z.flattenError` macht daraus
ein Objekt pro Feld – dasselbe Format wie Laravels `errors`. So zeigt **eine** Darstellung beide Fehlerarten.

> [!FEHLER]
> Nach einem Serverfehler einfach `throw` – dann landet ein harmloser Tippfehler in der Error-Boundary, und
> das Mitglied verliert alle Eingaben. Erwartbare Fehler (422, 409) werden zurückgegeben, nur unerwartete
> geworfen.

## Den Cache nach Änderungen erneuern

Nach dem Anlegen oder Buchen sind gecachte Daten veraltet. `invalidateQueries` markiert sie als alt und lädt
aktive Queries neu ([[invalidierung|Invalidierung]]). Mit dem Key aus der Fabrik trifft ein Aufruf Liste und
Details.

Für das Buchen eignet sich `useFetcher`: Die Action läuft, ohne dass die Seite wechselt.

```tsx title="src/pages.tsx (Auszug)"
const fetcher = useFetcher<typeof bookAction>()

<fetcher.Form method="post">
  <button type="submit" disabled={ausgebucht || fetcher.state !== 'idle'}>Platz buchen</button>
</fetcher.Form>
{fetcher.data?.error && <p role="alert">{fetcher.data.error}</p>}
```

`fetcher.state` ist während der Anfrage nicht `idle` – der Button ist dann gesperrt, Doppelklicks erzeugen
keine zweite Anfrage. Das ist [[pending-ui|Pending-UI]] ohne eigenen State.

## Fehlerbilder im Überblick

| Antwort | Reaktion im Frontend |
|---|---|
| 201 | weiterleiten oder Erfolg anzeigen, Cache invalidieren |
| 422 | Meldungen an die Felder (`useActionData`) |
| 409 | allgemeine Meldung, z. B. „ausgebucht“ |
| 401 | weiterleiten zu `/login` |
| 5xx, Netzwerk | Error-Boundary mit Hinweis |

> [!PRAXIS]
> Fehlermeldungen in einem `<p role="alert">` werden von Screenreadern sofort vorgelesen. Das kostet eine
> Eigenschaft und macht Formulare für alle bedienbar.

## Checkliste für Formulare

1. Jedes Feld hat ein sichtbares `<label>` und einen Platz für seine Fehlermeldung.
2. Die Zod-Regeln im Browser entsprechen den Regeln im Form Request.
3. Serverfehler (422) landen an denselben Stellen wie Browserfehler.
4. Nach jeder Änderung wird der passende Query-Key invalidiert.
5. Während einer Anfrage ist der Absenden-Button gesperrt, damit niemand doppelt bucht.

## Zusammenfassung

- Der Browser prüft für **schnelle Rückmeldung**, der Server **verbindlich**.
- Die **Action** liest Formulardaten, prüft mit `safeParse`, ruft den API-Client und leitet weiter.
- Erwartbare Fehler (422, 409) werden **zurückgegeben**, unerwartete geworfen.
- `z.flattenError` und Laravels `errors` haben dieselbe Form – eine Darstellung für beide.
- Nach Änderungen **invalidierst** du den Cache über die Query-Key-Fabrik.
- `useFetcher` erlaubt Aktionen ohne Seitenwechsel und sperrt den Button während der Anfrage.
