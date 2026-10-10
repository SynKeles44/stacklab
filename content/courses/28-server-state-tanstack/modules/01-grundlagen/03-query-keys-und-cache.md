---
title: Query Keys, staleTime und gcTime
summary: Wie TanStack Query Daten im Cache benennt, wann es sie für veraltet hält, wann es nachlädt und wann es sie wegwirft.
duration: 25
sources:
  - title: TanStack Query – Query Keys
    url: https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
  - title: TanStack Query – Important Defaults
    url: https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults
  - title: TanStack Query – Caching Examples
    url: https://tanstack.com/query/latest/docs/framework/react/guides/caching
  - title: TanStack Query – Window Focus Refetching
    url: https://tanstack.com/query/latest/docs/framework/react/guides/window-focus-refetching
quiz:
  - type: single
    question: Welche Standardeinstellung hat `staleTime` in TanStack Query?
    options:
      - 0 – Daten gelten sofort nach dem Laden als veraltet.
      - 5 Minuten
      - Unendlich – Daten veralten nie.
      - 30 Sekunden
    answer: 0
    explanation: "Standard ist `staleTime: 0`. Die Daten bleiben im Cache und werden sofort angezeigt, aber bei der nächsten Gelegenheit (Mount, Fensterfokus, Reconnect) im Hintergrund neu geladen."
  - type: match
    question: Ordne jedem Begriff seine Bedeutung zu.
    pairs:
      - { left: "staleTime", right: "Wie lange gelten Daten als frisch?" }
      - { left: "gcTime", right: "Wie lange bleiben ungenutzte Daten im Cache?" }
      - { left: "Query Key", right: "Unter welchem Namen liegen die Daten im Cache?" }
      - { left: "refetchOnWindowFocus", right: "Soll beim Zurückkehren in den Tab nachgeladen werden?" }
    explanation: staleTime steuert das Nachladen, gcTime das Aufräumen. Beides ist unabhängig voneinander.
  - type: multiple
    question: "Welche Query Keys landen im **selben** Cache-Eintrag wie `['aufgaben', { status: 'offen', seite: 1 }]`?"
    options:
      - "['aufgaben', { seite: 1, status: 'offen' }]"
      - "['aufgaben', { status: 'offen', seite: 2 }]"
      - "[{ status: 'offen', seite: 1 }, 'aufgaben']"
      - "['aufgaben', { status: 'offen', seite: 1 }]"
    answers: [0, 3]
    explanation: Bei Objekten im Key spielt die Reihenfolge der Eigenschaften keine Rolle, die Reihenfolge der Array-Elemente aber schon. Eine andere Seite ist ein anderer Eintrag.
  - type: find-bug
    question: Wählt man einen anderen Status im Filter, zeigt die Liste weiter die alten Treffer. In welcher Zeile liegt der Fehler?
    language: tsx
    code: |
      function Liste({ status }: { status: string }) {
        const { data } = useQuery({
          queryKey: ['aufgaben'],
          queryFn: () => ladeAufgaben({ status }),
        })
        return <Tabelle zeilen={data ?? []} />
      }
    bug_line: 3
    explanation: "Alles, wovon die Query-Funktion abhängt, gehört in den Key – hier `status`. Richtig wäre `queryKey: ['aufgaben', { status }]`. Sonst hält TanStack Query beide Filter für dieselben Daten."
  - type: cloze
    text: "Ungenutzte Daten bleiben standardmäßig ___ Minuten im Cache, bevor die Garbage Collection sie entfernt. Gilt ein Eintrag als veraltet, heißt er auf Englisch ___."
    blanks:
      - ["5", fünf]
      - [stale]
    explanation: "gcTime ist standardmäßig 5 Minuten. „Stale“ heißt veraltet – die Daten werden trotzdem angezeigt, aber bei Gelegenheit neu geladen."
tasks:
  - id: lebenszyklus-beschriften
    type: diagram
    title: Beschrifte den Lebenszyklus eines Cache-Eintrags
    description: Ordne die Zustände eines Query-Eintrags den Kästen zu. Die Pfeile zeigen, welches Ereignis den Übergang auslöst.
    image: /assets/server-state-tanstack/query-lebenszyklus-leer.svg
    slots:
      - { x: 14, y: 38, answer: Lädt (fetching) }
      - { x: 39, y: 38, answer: Frisch (fresh) }
      - { x: 64, y: 38, answer: Veraltet (stale) }
      - { x: 89, y: 38, answer: Inaktiv (inactive) }
    distractors: [Fehlerhaft (error), Pausiert (paused)]
    hints:
      - Nach dem Laden sind die Daten zuerst frisch. Erst nach Ablauf der staleTime werden sie veraltet.
      - Inaktiv wird ein Eintrag, wenn keine Komponente ihn mehr nutzt – danach läuft die gcTime.
  - id: key-fabrik
    type: code
    language: ts
    title: Baue eine Query-Key-Fabrik
    description: |
      In größeren Projekten schreibt niemand Query Keys von Hand an zehn Stellen. Stattdessen gibt es pro
      Fachbereich eine **Key-Fabrik** – ein Objekt mit Funktionen, die Keys hierarchisch zusammensetzen.

      Ergänze `aufgabenKeys`:

      1. `all` ist `['aufgaben']`.
      2. `listen()` liefert `['aufgaben', 'liste']` – baue es aus `all` auf.
      3. `liste(filter)` liefert `['aufgaben', 'liste', filter]` (das Filter-Objekt als letztes Element).
      4. `details()` liefert `['aufgaben', 'detail']`, `detail(id)` liefert `['aufgaben', 'detail', id]`.
      5. Schreibe `passtZu(key, praefix)`: Sie gibt `true` zurück, wenn `key` mit allen Elementen von `praefix`
         beginnt. Genau so entscheidet TanStack Query beim Invalidieren, welche Einträge betroffen sind.
         Vergleiche Elemente mit `JSON.stringify`.
    starter: |
      type Filter = { status?: 'offen' | 'erledigt'; suche?: string }

      const aufgabenKeys = {
        all: ['aufgaben'] as const,
        listen: () => [],
        liste: (filter: Filter) => [],
        details: () => [],
        detail: (id: number) => [],
      }

      function passtZu(key: readonly unknown[], praefix: readonly unknown[]): boolean {
        return false
      }
    tests:
      - name: Basis-Keys
        code: |
          assertDeepEqual(aufgabenKeys.all, ['aufgaben'])
          assertDeepEqual(aufgabenKeys.listen(), ['aufgaben', 'liste'])
          assertDeepEqual(aufgabenKeys.details(), ['aufgaben', 'detail'])
      - name: Keys mit Parametern
        code: |
          assertDeepEqual(aufgabenKeys.liste({ status: 'offen' }), ['aufgaben', 'liste', { status: 'offen' }])
          assertDeepEqual(aufgabenKeys.detail(7), ['aufgaben', 'detail', 7])
      - name: passtZu erkennt Präfixe
        code: |
          assertTrue(passtZu(aufgabenKeys.liste({ suche: 'a' }), aufgabenKeys.all))
          assertTrue(passtZu(aufgabenKeys.liste({ suche: 'a' }), aufgabenKeys.listen()))
          assertTrue(passtZu(aufgabenKeys.detail(3), aufgabenKeys.detail(3)))
      - name: passtZu lehnt Fremdes ab
        code: |
          assertTrue(!passtZu(aufgabenKeys.detail(3), aufgabenKeys.listen()), 'Ein Detail-Key ist kein Listen-Key.')
          assertTrue(!passtZu(aufgabenKeys.all, aufgabenKeys.listen()), 'Ein kürzerer Key kann nicht zu einem längeren Präfix passen.')
          assertTrue(!passtZu(['projekte', 'liste'], aufgabenKeys.all))
          assertTrue(passtZu(['aufgaben'], []), 'Ein leerer Präfix passt auf alles.')
    hints:
      - "`listen: () => [...aufgabenKeys.all, 'liste'] as const` – der Spread-Operator kopiert die Elemente von `all`."
      - "Für `passtZu`: Ist `praefix` länger als `key`, ist die Antwort `false`. Sonst prüfst du mit `praefix.every((teil, i) => …)` jedes Element."
    solution: |
      type Filter = { status?: 'offen' | 'erledigt'; suche?: string }

      const aufgabenKeys = {
        all: ['aufgaben'] as const,
        listen: () => [...aufgabenKeys.all, 'liste'] as const,
        liste: (filter: Filter) => [...aufgabenKeys.listen(), filter] as const,
        details: () => [...aufgabenKeys.all, 'detail'] as const,
        detail: (id: number) => [...aufgabenKeys.details(), id] as const,
      }

      function passtZu(key: readonly unknown[], praefix: readonly unknown[]): boolean {
        if (praefix.length > key.length) return false
        return praefix.every((teil, i) => JSON.stringify(teil) === JSON.stringify(key[i]))
      }
---
Du hast eine Aufgabenliste geladen. Jetzt wechselst du auf eine andere Seite und wieder zurück – erscheint die
Liste sofort oder mit Spinner? Wird nachgeladen oder nicht? Die Antwort hängt von drei Dingen ab: dem
**Query Key**, der **staleTime** und der **gcTime**. Wer diese drei versteht, versteht TanStack Query.

## Der Query Key benennt den Cache-Eintrag

Der Cache ist ein großes Nachschlagewerk. Der [[query-key|Query Key]] ist das Stichwort. Er ist immer ein
[[array|Array]] und darf Strings, Zahlen und Objekte enthalten:

```ts
['aufgaben']                                  // alle Aufgaben
['aufgaben', 5]                               // Aufgabe mit der ID 5
['aufgaben', { status: 'offen', seite: 2 }]   // gefilterte Liste, Seite 2
```

TanStack Query wandelt den Key in einen eindeutigen Text um (Hashing). Bei Objekten spielt die Reihenfolge der
Eigenschaften dabei keine Rolle, bei Array-Elementen schon.

Wichtigste Regel: **Alles, wovon die Query-Funktion abhängt, gehört in den Key.** Das ist wie das
[[abhaengigkeitsarray|Abhängigkeitsarray]] bei `useEffect`. Ändert sich ein Wert im Key, ist es ein anderer
Cache-Eintrag, und TanStack Query lädt automatisch.

```tsx
const { data } = useQuery({
  queryKey: ['aufgaben', { status }],
  queryFn: () => ladeAufgaben({ status }),
})
```

Das löst nebenbei das [[race-condition|Race-Condition]]-Problem aus der ersten Lektion: Jede Antwort landet
unter ihrem eigenen Key, eine späte Antwort kann keine fremde Liste überschreiben.

## staleTime: Wie lange sind Daten frisch?

Nach dem Laden sind Daten **frisch** (*fresh*). Nach Ablauf der [[stale-time|staleTime]] gelten sie als
**veraltet** (*stale*). Veraltete Daten werden weiter angezeigt – TanStack Query lädt sie aber bei der nächsten
Gelegenheit im Hintergrund neu.

Standard ist `staleTime: 0`: Daten sind sofort nach dem Laden veraltet. Das ist vorsichtig, erzeugt aber viele
Requests. Für Daten, die sich selten ändern, setzt du einen höheren Wert:

| Daten | sinnvolle staleTime |
|---|---|
| Börsenkurse, Chat-Nachrichten | `0` |
| Aufgabenliste im Team | `30_000` (30 Sekunden) |
| Länderliste, Kategorien | `Infinity` oder `'static'` |

Mit `staleTime: 'static'` sagst du: Diese Daten veralten nie, auch eine Invalidierung soll sie nicht neu laden.

## Wann lädt TanStack Query nach?

Veraltete Daten werden bei diesen Ereignissen automatisch im Hintergrund neu geladen
([[refetch|Refetch]]):

| Auslöser | Option | Standard |
|---|---|---|
| Eine neue Komponente mit diesem Key wird gemountet | `refetchOnMount` | an |
| Das Browserfenster bekommt wieder den Fokus | `refetchOnWindowFocus` | an |
| Die Netzwerkverbindung kommt zurück | `refetchOnReconnect` | an |
| Ein festes Intervall läuft ab | `refetchInterval` | aus |

Frische Daten werden bei diesen Ereignissen **nicht** neu geladen. Deshalb ist die staleTime der wichtigste
Regler gegen zu viele Requests.

> [!FEHLER]
> **Den Fensterfokus-Refetch für einen Bug halten.** In der Entwicklung wechselst du ständig zwischen Editor und
> Browser – und siehst bei jedem Wechsel Requests im Netzwerk-Tab. Das ist Absicht. Setze lieber eine passende
> `staleTime`, statt `refetchOnWindowFocus` überall abzuschalten.

## gcTime: Wann wird aufgeräumt?

Nutzt keine Komponente mehr einen Eintrag, wird er **inaktiv**. Er bleibt aber im Cache – falls der Nutzer
gleich zurückkommt. Erst nach Ablauf der [[gc-time|gcTime]] (Standard: 5 Minuten) entfernt die
[[garbage-collection|Garbage Collection]] ihn. In älteren Versionen hieß die Option `cacheTime`.

![Lebenszyklus eines Query-Eintrags: lädt, frisch, veraltet, inaktiv, entfernt](/assets/server-state-tanstack/query-lebenszyklus.svg)

Zurück zur Frage vom Anfang: Wechselst du nach zwei Minuten zurück, ist der Eintrag noch im Cache. Die Liste
erscheint **sofort**. Ist sie veraltet, lädt TanStack Query im Hintergrund nach und tauscht die Daten
unbemerkt aus.

> [!MERKSATZ]
> **staleTime** entscheidet, *ob nachgeladen wird*. **gcTime** entscheidet, *wie lange ungenutzte Daten
> aufgehoben werden*. Die beiden haben nichts miteinander zu tun.

## Retry und Deduplizierung

Zwei weitere Standards solltest du kennen:

- **Retry:** Scheitert eine Query, versucht TanStack Query es im Browser noch **dreimal**, mit wachsenden
  Pausen dazwischen ([[exponential-backoff|Exponential Backoff]]). Erst danach wird `status` zu `error`.
- **[[request-deduplizierung|Deduplizierung]]:** Fordern zehn Komponenten gleichzeitig denselben Key an, geht
  nur **ein** Request raus.

> [!PRAXIS]
> Teams legen Query Keys in einer **[[query-key-fabrik|Key-Fabrik]]** pro Fachbereich ab, etwa `aufgabenKeys.detail(5)`. So gibt es
> keine Tippfehler, und du kannst mit `aufgabenKeys.all` alle Aufgaben-Einträge auf einmal ansprechen. Das
> brauchst du in Modul 2 zum Invalidieren.

## Zusammenfassung

- Der **Query Key** ist ein Array und benennt den Cache-Eintrag; alles, was die Query-Funktion braucht, gehört hinein.
- Ändert sich der Key, ist es ein neuer Eintrag – TanStack Query lädt automatisch.
- **staleTime** (Standard 0) bestimmt, wie lange Daten frisch sind; nur veraltete Daten werden nachgeladen.
- Nachgeladen wird bei Mount, Fensterfokus, Reconnect und optional im Intervall.
- **gcTime** (Standard 5 Minuten) bestimmt, wie lange ungenutzte Einträge im Cache bleiben.
- Fehlgeschlagene Queries werden standardmäßig dreimal wiederholt; gleiche Requests werden zusammengefasst.
