---
title: Client-State und Server-State
summary: Warum Daten vom Server anders behandelt werden müssen als ein offenes Menü – und welche Probleme ein selbstgebautes Laden mit useEffect mitbringt.
duration: 20
sources:
  - title: TanStack Query – Overview
    url: https://tanstack.com/query/latest/docs/framework/react/overview
  - title: TanStack Query – Does TanStack Query replace Redux, MobX or other global state managers?
    url: https://tanstack.com/query/latest/docs/framework/react/guides/does-this-replace-client-state
  - title: React – You Might Not Need an Effect (Fetching data)
    url: https://react.dev/learn/you-might-not-need-an-effect#fetching-data
quiz:
  - type: single
    question: Was unterscheidet Server-State grundlegend von Client-State?
    options:
      - Server-State ist immer größer als Client-State.
      - Server-State gehört dem Server – deine App hält nur eine Kopie, die jederzeit veraltet sein kann.
      - Server-State darf nur mit TypeScript verwendet werden.
      - Client-State wird nie gerendert.
    answer: 1
    explanation: Die „Wahrheit“ liegt in der Datenbank hinter der API. Andere Nutzer können sie ändern, ohne dass deine App davon erfährt. Deshalb ist jede geladene Kopie ein Schnappschuss mit Ablaufdatum.
  - type: multiple
    question: Welche Probleme musst du lösen, wenn du Server-Daten selbst mit `fetch` in `useEffect` lädst?
    options:
      - Lade- und Fehlerzustand verwalten
      - Doppelte Requests vermeiden, wenn zwei Komponenten dieselben Daten brauchen
      - Antworten in falscher Reihenfolge (Race Conditions) abfangen
      - JSX in HTML übersetzen
    answers: [0, 1, 2]
    explanation: JSX übersetzt der Build. Die anderen drei Punkte sind typische Aufgaben eines Daten-Caches – genau das nimmt dir TanStack Query ab.
  - type: match
    question: Ordne jedem Wert die passende Art von State zu.
    pairs:
      - { left: "Ist das Seitenmenü aufgeklappt?", right: "Client-State" }
      - { left: "Die Liste der offenen Bestellungen", right: "Server-State" }
      - { left: "Text im noch nicht abgeschickten Suchfeld", right: "Client-State" }
      - { left: "Profil des angemeldeten Nutzers aus der API", right: "Server-State" }
    explanation: Alles, was nur im Browser existiert und dir allein gehört, ist Client-State. Alles, was du von einer API holst und das andere ändern können, ist Server-State.
  - type: find-bug
    question: Tippt jemand schnell „a“ und dann „ab“, zeigt die Liste manchmal die Treffer für „a“. Welche Zeile fehlt sinngemäß, bzw. wo entsteht das Problem?
    language: tsx
    code: |
      function Suche({ begriff }: { begriff: string }) {
        const [treffer, setTreffer] = useState<string[]>([])
        useEffect(() => {
          fetch(`/api/suche?q=${begriff}`)
            .then((res) => res.json())
            .then((daten) => setTreffer(daten))
        }, [begriff])
        return <ul>{treffer.map((t) => <li key={t}>{t}</li>)}</ul>
      }
    bug_line: 6
    explanation: Kommt die Antwort für „a“ nach der für „ab“ an, überschreibt Zeile 6 das neuere Ergebnis. Es fehlt eine Aufräumfunktion, die veraltete Antworten ignoriert – ein klassischer Race-Condition-Fehler, den TanStack Query über den Query Key automatisch verhindert.
tasks:
  - id: state-sortieren
    type: dragdrop
    title: Client-State oder Server-State?
    description: Ordne jeden Wert aus einer Shop-App der richtigen Art von State zu. Frage dich jeweils, wem die Daten gehören und ob jemand anderes sie ändern kann.
    targets:
      - { id: client, label: Client-State (gehört nur dem Browser) }
      - { id: server, label: Server-State (Kopie von Daten auf dem Server) }
    items:
      - { label: "Gewählte Sortierung im Dropdown", target: client }
      - { label: "Ist der Dialog „Warenkorb leeren?“ offen", target: client }
      - { label: "Dunkles oder helles Design", target: client }
      - { label: "Produktliste aus /api/products", target: server }
      - { label: "Lagerbestand eines Artikels", target: server }
      - { label: "Bestellhistorie des Kunden", target: server }
    hints:
      - Könnte ein anderer Nutzer oder ein Hintergrundprozess den Wert ändern, während du die Seite offen hast? Dann ist es Server-State.
  - id: fetch-probleme
    type: steps
    title: Was passiert als Nächstes?
    description: Du verfolgst eine Komponente, die ihre Daten selbst mit `fetch` in `useEffect` lädt – ohne Cache. Entscheide jeweils, was passiert.
    steps:
      - situation: Die Seite zeigt die Komponente `<Profil />` zweimal – einmal im Header, einmal in der Seitenleiste. Beide laden in `useEffect` dieselbe URL.
        question: Wie viele Requests gehen an den Server?
        options: [Einer – der Browser merkt sich die Antwort automatisch, Zwei – jede Komponente startet ihren eigenen Request, Keiner – React lädt beim ersten Rendern nichts]
        answer: 1
        explanation: Ohne gemeinsamen Cache weiß keine Komponente von der anderen. Jede startet ihren eigenen Request – das nennt man fehlende Deduplizierung.
      - situation: Du wechselst auf eine andere Seite und nach zwei Sekunden zurück.
        question: Was sieht der Nutzer zuerst?
        options: [Sofort die alten Daten, Einen Lade-Spinner, weil der State beim Verlassen weggeworfen wurde, Eine Fehlermeldung]
        answer: 1
        explanation: Der State einer Komponente verschwindet beim Unmounten. Ohne Cache beginnt alles von vorn – mit Spinner.
      - situation: Ein Kollege ändert den Namen im Profil. Dein Browser-Tab war die ganze Zeit offen.
        question: Was zeigt deine App?
        options: [Automatisch den neuen Namen, Weiter den alten Namen, bis jemand die Seite neu lädt, Eine Warnung, dass die Daten veraltet sind]
        answer: 1
        explanation: Deine Kopie ist veraltet, aber niemand sagt es ihr. Ein Server-State-Cache prüft deshalb bei Gelegenheit (z. B. beim Zurückkehren in den Tab) im Hintergrund nach.
---
Du baust eine Aufgaben-App. Die Liste kommt von einer [[api|API]], ein Klick auf „Erledigt“ schickt eine Änderung
zurück, und oben rechts zeigt ein Zähler die offenen Aufgaben. Nach einer Woche hast du drei `useEffect`, fünf
`useState` für Laden und Fehler – und trotzdem zeigt der Zähler manchmal etwas anderes als die Liste. Das liegt
nicht an dir, sondern daran, dass Server-Daten eine eigene Art von Zustand sind.

## Zwei Arten von Zustand

In React heißt alles, was sich ändern und neu gerendert werden kann, [[react-state|State]]. Für Daten gibt es
aber zwei sehr verschiedene Sorten:

| | [[client-state|Client-State]] | [[server-state|Server-State]] |
|---|---|---|
| Wem gehört er? | Nur deinem Browser-Tab | Dem Server (meist einer [[datenbank|Datenbank]]) |
| Wer ändert ihn? | Nur deine App | Deine App, andere Nutzer, Hintergrundjobs |
| Ist er aktuell? | Immer | Nur zum Zeitpunkt des Ladens |
| Wie kommst du ran? | Synchron, sofort | Asynchron über das Netzwerk |
| Beispiel | Ist das Menü offen? | Liste der Bestellungen |

Ein Bild aus dem Alltag: Client-State ist dein eigener Notizzettel. Server-State ist ein **Foto vom
Fahrplan am Bahnhof**. Das Foto zeigt, was beim Fotografieren galt. Fällt danach ein Zug aus, steht das nicht
auf deinem Foto.

> [!MERKSATZ]
> Server-State ist immer nur eine **Kopie** mit Zeitstempel. Die Wahrheit liegt auf dem Server – deine App
> muss entscheiden, wann sie ihrer Kopie noch traut.

## Laden mit useEffect – und seine Fallstricke

So laden viele ihre Daten im ersten React-Projekt:

```tsx title="TodoListe.tsx – selbstgebaut"
function TodoListe() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [laedt, setLaedt] = useState(true)
  const [fehler, setFehler] = useState<Error | null>(null)

  useEffect(() => {
    let abgebrochen = false
    fetch('/api/todos')
      .then((res) => res.json())
      .then((daten) => { if (!abgebrochen) setTodos(daten) })
      .catch((e) => { if (!abgebrochen) setFehler(e) })
      .finally(() => { if (!abgebrochen) setLaedt(false) })
    return () => { abgebrochen = true }
  }, [])
  // ... Rendering mit laedt, fehler, todos
}
```

Das funktioniert – für **eine** Komponente. Sobald eine zweite dieselben Daten braucht, kopierst du alles. Und
viele Fragen beantwortet der Code gar nicht: Wann lade ich neu? Was passiert nach einer Änderung? Was, wenn der
Server kurz nicht antwortet?

Selbst die React-Dokumentation rät davon ab, Daten im Effekt selbst zu laden, und empfiehlt eine Bibliothek
mit eingebautem [[cache|Cache]].

## Was ein Server-State-Cache leisten muss

Schreib auf, was die Aufgaben-App eigentlich bräuchte, und du landest bei dieser Liste:

| Aufgabe | Ohne Cache |
|---|---|
| Lade- und Fehlerzustand | Drei `useState` pro Komponente |
| [[request-deduplizierung|Deduplizierung]] | Zwei Komponenten → zwei Requests |
| Zwischenspeichern | Seitenwechsel → alles neu laden, Spinner |
| Veraltete Daten erkennen | Gar nicht, bis zum Neuladen der Seite |
| Nach Änderungen aktualisieren | Von Hand in jeder betroffenen Komponente |
| [[race-condition|Race Conditions]] | Eigene `abgebrochen`-Flags |
| Wiederholen bei Netzfehlern | Gar nicht |
| Paginierung, Endlos-Listen | Viel eigener Code |

> [!FEHLER]
> **Server-Daten in einen globalen Store kopieren.** Viele Teams laden die API-Antwort in einen globalen Store
> (Context, Redux, Zustand) und pflegen sie dort von Hand. Damit hast du zwei Wahrheiten, die auseinanderlaufen.
> Server-State gehört in einen Cache, der weiß, wie alt seine Daten sind.

## TanStack Query: der Cache für Server-State

[[tanstack-query|TanStack Query]] (früher „React Query“) ist genau dieser Cache. Aktuell ist Version 5. Du
sagst ihm nur zwei Dinge:

1. **Wie heißen die Daten?** – ein [[query-key|Query Key]], z. B. `['todos']`.
2. **Wie lädt man sie?** – eine [[query-function|Query-Funktion]], die ein [[promise|Promise]] zurückgibt.

```tsx title="Dieselbe Liste mit TanStack Query"
function TodoListe() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['todos'],
    queryFn: () => fetch('/api/todos').then((res) => res.json()),
  })
  // ... Rendering
}
```

Alles andere – Zwischenspeichern, Deduplizieren, Hintergrund-Aktualisieren, Wiederholen – erledigt die
Bibliothek. Zwei Komponenten mit demselben Key teilen sich einen Request und einen Cache-Eintrag.

> [!PRAXIS]
> In Projekten mit TanStack Query schrumpft der globale Client-State oft auf wenige Werte: angemeldeter Nutzer,
> Theme, offene Dialoge. Der große Rest war in Wahrheit Server-State und wandert in den Query-Cache.

## Und TanStack Table?

Im letzten Modul lernst du die Schwester-Bibliothek [[tanstack-table|TanStack Table]] kennen. Sie lädt keine
Daten, sondern rechnet aus Zeilen und Spalten eine sortierte, gefilterte und geblätterte Tabelle. Zusammen mit
Query bekommst du so Admin-Tabellen, die Daten vom Server holen und trotzdem schnell reagieren.

## Zusammenfassung

- **Client-State** gehört nur dem Browser und ist immer aktuell (Menü offen, Eingabetext).
- **Server-State** gehört dem Server; deine App hält nur eine Kopie, die veralten kann.
- Daten selbst in `useEffect` zu laden, führt zu doppeltem Code, doppelten Requests und Race Conditions.
- Ein Server-State-Cache kümmert sich um Laden, Fehler, Deduplizierung, Aktualität und Wiederholungen.
- TanStack Query braucht dafür nur einen **Query Key** und eine **Query-Funktion**.
- TanStack Table ergänzt das um sortier- und filterbare Tabellen.
