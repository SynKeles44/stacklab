---
title: Mutationen und Invalidierung
summary: Daten mit useMutation ändern und danach genau die Queries aktualisieren, die davon betroffen sind.
duration: 25
sources:
  - title: TanStack Query – Mutations
    url: https://tanstack.com/query/latest/docs/framework/react/guides/mutations
  - title: TanStack Query – Query Invalidation
    url: https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation
  - title: TanStack Query – Invalidations from Mutations
    url: https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations
  - title: TanStack Query – Updates from Mutation Responses
    url: https://tanstack.com/query/latest/docs/framework/react/guides/updates-from-mutation-responses
quiz:
  - type: single
    question: Was ist der wichtigste Unterschied zwischen useQuery und useMutation?
    options:
      - useMutation lädt Daten schneller.
      - useQuery läuft automatisch los; eine Mutation startet erst, wenn du `mutate` aufrufst.
      - useMutation braucht keinen QueryClient.
      - useQuery kann keine POST-Requests senden.
    answer: 1
    explanation: Queries laufen deklarativ, sobald eine Komponente sie braucht. Mutationen ändern Daten auf dem Server und laufen deshalb nur auf ausdrücklichen Befehl – meist nach einem Klick oder Formular-Absenden.
  - type: multiple
    question: "Was passiert bei `queryClient.invalidateQueries({ queryKey: ['aufgaben'] })`?"
    options:
      - Alle Einträge, deren Key mit 'aufgaben' beginnt, werden als veraltet markiert.
      - Gerade angezeigte (aktive) betroffene Queries werden im Hintergrund neu geladen.
      - Die Daten werden sofort aus dem Cache gelöscht, die Liste wird leer.
      - "Auch ['aufgaben', 'detail', 5] ist betroffen."
    answers: [0, 1, 3]
    explanation: Invalidieren löscht nichts. Es markiert passende Einträge als stale und lädt die aktiven neu – die alten Daten bleiben bis dahin sichtbar.
  - type: cloze
    text: "Willst du in einer async-Funktion auf das Ergebnis der Mutation warten, nutzt du `await mutation.___(daten)`. Die normale Variante `mutation.___(daten)` gibt nichts zurück und fängt Fehler selbst ab."
    blanks:
      - [mutateAsync]
      - [mutate]
    explanation: mutate ist für Event-Handler gedacht. mutateAsync liefert ein Promise – dann musst du Fehler selbst mit try/catch behandeln.
  - type: find-bug
    question: Nach dem Anlegen einer Aufgabe bleibt die Liste unverändert, bis man die Seite neu lädt. Welche Zeile ist falsch?
    language: ts
    code: |
      const queryClient = useQueryClient()
      const anlegen = useMutation({
        mutationFn: neueAufgabeSenden,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['aufgabe'] })
        },
      })
    bug_line: 5
    explanation: "Der Key heißt `['aufgabe']` statt `['aufgaben']` – damit passt die Invalidierung auf keinen Eintrag. Genau solche Tippfehler verhindert eine Key-Fabrik wie `aufgabenKeys.all`."
  - type: match
    question: Wann ruft TanStack Query welchen Callback einer Mutation auf?
    pairs:
      - { left: "onMutate", right: "Bevor die mutationFn startet" }
      - { left: "onSuccess", right: "Nachdem der Server erfolgreich geantwortet hat" }
      - { left: "onError", right: "Nachdem die mutationFn fehlgeschlagen ist" }
      - { left: "onSettled", right: "Immer am Ende – egal ob Erfolg oder Fehler" }
    explanation: onSettled ist wie ein finally. Dort invalidierst du gern, weil es in beiden Fällen sinnvoll ist, den Server-Stand neu zu holen.
tasks:
  - id: post-zusammenbauen
    type: request
    title: Die Mutation als HTTP-Request
    description: |
      Die `mutationFn` deiner Aufgaben-App schickt eine neue Aufgabe an die API. Baue den Request zusammen, den
      sie senden muss: Lege die Aufgabe mit dem Titel `Steuererklärung` an. Neue Aufgaben schickt man per
      `POST` an die Sammlung `/aufgaben`, der Body ist JSON.
    base_url: https://api.example.com
    expected:
      method: POST
      path: "^/aufgaben$"
      headers: { Content-Type: "application/json" }
      body_contains: ['"titel"', 'Steuererklärung']
    response:
      status: 201
      body: '{"id": 42, "titel": "Steuererklärung", "erledigt": false}'
    hints:
      - Neue Einträge legt man mit POST auf der Sammlung an – ohne ID im Pfad.
      - "Der Body könnte so aussehen: `{\"titel\": \"Steuererklärung\"}`. Vergiss den Header `Content-Type: application/json` nicht."
    solution: |
      ```http
      POST /aufgaben HTTP/1.1
      Host: api.example.com
      Content-Type: application/json

      {"titel": "Steuererklärung"}
      ```
  - id: mutation-ablauf
    type: order
    title: Der Ablauf einer Mutation mit Invalidierung
    description: Bringe die Schritte in die Reihenfolge, in der sie passieren, wenn jemand im Formular auf „Anlegen“ klickt und die Mutation erfolgreich ist.
    items:
      - "Der Klick-Handler ruft mutation.mutate({ titel }) auf"
      - "onMutate läuft, isPending wird true"
      - "Die mutationFn sendet den POST-Request"
      - "Der Server antwortet mit 201 Created"
      - "onSuccess gibt das Promise von invalidateQueries(['aufgaben']) zurück"
      - "Die aktive Aufgabenliste lädt im Hintergrund neu, TanStack Query wartet darauf"
      - "onSettled läuft, isPending wird false"
    hints:
      - Callbacks, die ein Promise zurückgeben, werden abgewartet – erst danach geht es weiter.
---
Bisher hast du Daten nur gelesen. Aber eine Aufgaben-App will Aufgaben anlegen, abhaken und löschen. Dafür
gibt es in TanStack Query **Mutationen**. Die spannende Frage ist dabei nicht das Senden – das kann `fetch` –,
sondern: Wie erfährt die Liste davon, dass sich etwas geändert hat?

## useMutation

Eine [[query-mutation|Mutation]] ist jede Operation, die Daten auf dem Server **ändert**: anlegen, bearbeiten,
löschen. Du beschreibst sie mit `useMutation`:

```tsx title="NeueAufgabe.tsx"
import { useMutation } from '@tanstack/react-query'

async function aufgabeAnlegen(neu: { titel: string }): Promise<Aufgabe> {
  const res = await fetch('/api/aufgaben', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(neu),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export function NeueAufgabe() {
  const anlegen = useMutation({ mutationFn: aufgabeAnlegen })

  return (
    <button disabled={anlegen.isPending} onClick={() => anlegen.mutate({ titel: 'Steuern' })}>
      {anlegen.isPending ? 'Speichert …' : 'Anlegen'}
    </button>
  )
}
```

Der Unterschied zu `useQuery`: Eine Mutation läuft **nicht** von selbst. Sie startet erst, wenn du `mutate`
aufrufst – typischerweise in einem [[event-handler|Event-Handler]].

## Was das Ergebnis enthält

| Feld | Bedeutung |
|---|---|
| `mutate(variablen)` | Startet die Mutation, gibt nichts zurück, fängt Fehler selbst ab |
| `mutateAsync(variablen)` | Startet die Mutation und liefert ein Promise (Fehler selbst mit `try/catch` behandeln) |
| `isPending` | Die Mutation läuft gerade |
| `isError`, `error` | Die letzte Ausführung ist gescheitert |
| `isSuccess`, `data` | Erfolg, `data` ist die Antwort des Servers |
| `variables` | Die Werte, mit denen `mutate` zuletzt aufgerufen wurde |
| `reset()` | Setzt den Zustand zurück, z. B. um eine Fehlermeldung auszublenden |

> [!TIPP]
> Mutationen werden standardmäßig **nicht** wiederholt (`retry: 0`). Das ist Absicht: Ein doppelt gesendeter
> [[http-post|POST]] könnte zwei Aufgaben anlegen.

## Invalidierung: die Liste neu laden

Nach dem Anlegen ist die Aufgabenliste im Cache veraltet. Du sagst TanStack Query das ausdrücklich mit
[[invalidierung|Invalidierung]]:

```tsx
const queryClient = useQueryClient()

const anlegen = useMutation({
  mutationFn: aufgabeAnlegen,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: aufgabenKeys.all }),
})
```

`invalidateQueries` macht zwei Dinge:

1. Es markiert **alle** Einträge, deren Key mit dem Präfix beginnt, als veraltet – hier also Listen und Details.
2. Es lädt die gerade **aktiven** Einträge (die eine Komponente anzeigt) sofort im Hintergrund neu.

Inaktive Einträge werden erst neu geladen, wenn sie wieder gebraucht werden. Mit `exact: true` triffst du nur
genau einen Key.

> [!MERKSATZ]
> Nach einer Mutation fragst du nicht „welche Komponente muss sich ändern?“, sondern „welche **Daten** sind
> jetzt veraltet?“. Die Komponenten folgen dem Cache automatisch.

## Callbacks und ihre Reihenfolge

`useMutation` kennt vier Callbacks: `onMutate` (vor dem Request), `onSuccess`, `onError` und `onSettled`
(immer zum Schluss, wie `finally`). Liefert ein Callback ein Promise, wartet TanStack Query darauf. Gibst du
in `onSuccess` das Promise von `invalidateQueries` zurück, bleibt `isPending` also `true`, bis die Liste
neu geladen ist – der Button zeigt so lange „Speichert …“.

Du kannst Callbacks auch direkt an `mutate` übergeben. Die laufen **nach** denen des Hooks und nur, solange die
Komponente noch gemountet ist – gut für UI-Dinge wie „Formular leeren“:

```tsx
anlegen.mutate({ titel }, { onSuccess: () => setTitel('') })
```

> [!FEHLER]
> **Logik in die `mutate`-Callbacks legen.** Navigiert der Nutzer weg, bevor der Server antwortet, laufen die
> Callbacks an `mutate` nicht mehr. Die Invalidierung gehört deshalb in den Hook, das Leeren des Formulars an
> `mutate`.

## Antwort direkt in den Cache schreiben

Liefert der Server das geänderte Objekt zurück, kannst du dir einen Request sparen und es direkt in den Cache
schreiben:

```tsx
const umbenennen = useMutation({
  mutationFn: aufgabeAktualisieren,
  onSuccess: (aktualisiert) => {
    queryClient.setQueryData(aufgabenKeys.detail(aktualisiert.id), aktualisiert)
  },
})
```

Wichtig: `setQueryData` erwartet neue Objekte. Verändere die alten Daten nie direkt, sondern erzeuge Kopien
([[immutabilitaet|Immutabilität]]) – sonst merkt React die Änderung nicht.

> [!PRAXIS]
> Im Alltag ist **Invalidieren** der sichere Standard: Die Daten kommen garantiert so vom Server, wie er sie
> gespeichert hat – inklusive serverseitig berechneter Felder wie Zeitstempeln. `setQueryData` lohnt sich, wenn
> du einen zusätzlichen Request sparen willst und die Antwort vollständig ist.

## Zusammenfassung

- **Mutationen** ändern Server-Daten und laufen erst, wenn du `mutate` oder `mutateAsync` aufrufst.
- `isPending`, `isError`, `data` und `variables` beschreiben den Zustand der letzten Ausführung.
- Nach einer Änderung **invalidierst** du die betroffenen Keys; aktive Queries laden dann neu.
- Invalidierung trifft alle Keys mit passendem Präfix – eine Key-Fabrik verhindert Tippfehler.
- Gib das Promise von `invalidateQueries` zurück, damit `isPending` bis zum Neuladen gilt.
- Mit `setQueryData` schreibst du eine vollständige Server-Antwort direkt in den Cache – immer als neues Objekt.
