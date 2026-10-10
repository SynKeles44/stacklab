---
title: Refs und Effekte
summary: Wie du mit useRef Werte ohne Render speicherst und DOM-Elemente ansprichst, wie useEffect mit externen Systemen synchronisiert – und wann du keinen Effekt brauchst.
duration: 25
sources:
  - title: react.dev – Referencing Values with Refs
    url: https://react.dev/learn/referencing-values-with-refs
  - title: react.dev – Manipulating the DOM with Refs
    url: https://react.dev/learn/manipulating-the-dom-with-refs
  - title: react.dev – Synchronizing with Effects
    url: https://react.dev/learn/synchronizing-with-effects
  - title: react.dev – You Might Not Need an Effect
    url: https://react.dev/learn/you-might-not-need-an-effect
quiz:
  - type: match
    question: Ordne jedem Abhängigkeits-Array zu, wann der Effekt läuft.
    pairs:
      - { left: "useEffect(fn)", right: "Nach jedem Render" }
      - { left: "useEffect(fn, [])", right: "Nur nach dem ersten Render (Mount)" }
      - { left: "useEffect(fn, [raumId])", right: "Beim Mount und wenn sich raumId ändert" }
    explanation: Ohne Array läuft der Effekt nach jedem Render, mit leerem Array einmal, mit Werten immer dann, wenn sich einer davon geändert hat.
  - type: find-bug
    question: Diese Komponente öffnet bei jedem Raumwechsel eine weitere Verbindung, ohne die alte zu schließen. Welche Zeile fehlt sinngemäß?
    language: jsx
    code: |
      function ChatRaum({ raumId }) {
        React.useEffect(() => {
          const verbindung = verbinden(raumId)
          verbindung.oeffnen()
        }, [raumId])
        return <h1>Raum {raumId}</h1>
      }
    bug_line: 4
    explanation: >
      Nach Zeile 4 fehlt die Cleanup-Funktion `return () => verbindung.schliessen()`. React ruft sie vor dem
      nächsten Effekt-Durchlauf und beim Entfernen der Komponente auf.
  - type: multiple
    question: In welchen Fällen brauchst du KEINEN Effekt?
    options:
      - Einen Vollnamen aus vorname und nachname berechnen.
      - Beim Klick auf „Kaufen“ eine Bestellung an den Server schicken.
      - Eine Verbindung zu einem Chat-Server halten, solange die Komponente sichtbar ist.
      - Eine gefilterte Liste aus Props und Suchbegriff erzeugen.
    answers: [0, 1, 3]
    explanation: >
      Abgeleitete Werte berechnest du beim Rendern, und was durch ein bestimmtes Ereignis passiert, gehört in
      den Event-Handler. Effekte sind für die Synchronisation mit externen Systemen – wie die Chat-Verbindung.
  - type: single
    question: Was passiert, wenn du ref.current änderst?
    options:
      - React rendert die Komponente sofort neu.
      - Der Wert wird gespeichert, aber es gibt keinen neuen Render.
      - Der Wert geht beim nächsten Render verloren.
      - React wirft einen Fehler, refs sind schreibgeschützt.
    answer: 1
    explanation: Refs sind ein „Fach“, das zwischen Renders erhalten bleibt, aber keinen Render auslöst. Deshalb solltest du ref.current nicht beim Rendern lesen, um etwas anzuzeigen.
tasks:
  - id: fokus-und-titel
    type: code
    language: jsx
    title: Fokus per Ref, Titel per Effekt
    description: |
      Baue ein kleines Notizfeld.

      1. Ein `useRef` zeigt auf das `<input className="notiz">`. Der Button `.fokus` setzt den Fokus mit
         `ref.current.focus()` in das Feld.
      2. Der Button `.plus` zählt gespeicherte Notizen in State hoch (Start 0).
      3. Ein `useEffect` synchronisiert den Seitentitel: `document.title` soll immer `Notizen: 0`, `Notizen: 1` …
         lauten. Gib das passende Abhängigkeits-Array an.
    starter: |
      function App() {
        const [anzahl, setAnzahl] = React.useState(0)

        return (
          <div>
            <input className="notiz" placeholder="Notiz …" />
            <button className="fokus">Schreiben</button>
            <button className="plus" onClick={() => setAnzahl(anzahl + 1)}>Speichern</button>
            <p>{anzahl} gespeichert</p>
          </div>
        )
      }
    tests:
      - name: setzt den Titel beim ersten Render
        code: |
          await new Promise((r) => setTimeout(r, 30))
          assertEqual(document.title, 'Notizen: 0')
      - name: der Button setzt den Fokus ins Eingabefeld
        code: |
          await click('.fokus')
          assertTrue(document.activeElement === query('.notiz'), 'Das Eingabefeld hat noch keinen Fokus.')
      - name: der Titel folgt dem State
        code: |
          await click('.plus')
          await click('.plus')
          await new Promise((r) => setTimeout(r, 30))
          assertEqual(document.title, 'Notizen: 2')
    hints:
      - "`const eingabe = React.useRef(null)` und am Feld `ref={eingabe}`."
      - "Fokus: `onClick={() => eingabe.current.focus()}`."
      - "Effekt: `React.useEffect(() => { document.title = 'Notizen: ' + anzahl }, [anzahl])`."
    solution: |
      function App() {
        const [anzahl, setAnzahl] = React.useState(0)
        const eingabe = React.useRef(null)

        React.useEffect(() => {
          document.title = 'Notizen: ' + anzahl
        }, [anzahl])

        return (
          <div>
            <input className="notiz" placeholder="Notiz …" ref={eingabe} />
            <button className="fokus" onClick={() => eingabe.current.focus()}>Schreiben</button>
            <button className="plus" onClick={() => setAnzahl(anzahl + 1)}>Speichern</button>
            <p>{anzahl} gespeichert</p>
          </div>
        )
      }
  - id: effekt-lebenszyklus
    type: steps
    title: Wann läuft welcher Effekt?
    description: |
      Die Komponente `<ChatRaum raumId={id} />` verbindet sich in
      `useEffect(() => { verbinden(raumId); return () => trennen(raumId) }, [raumId])`. Die App läuft **ohne** StrictMode.
    steps:
      - situation: ChatRaum wird zum ersten Mal mit raumId „allgemein“ angezeigt.
        question: Was passiert nach dem Commit?
        options: ["verbinden('allgemein')", "trennen('allgemein')", "Nichts"]
        answer: 0
        explanation: Effekte laufen nach dem Commit, also wenn die Oberfläche schon auf dem Bildschirm ist.
      - situation: Die Eltern-Komponente rendert neu, raumId bleibt „allgemein“.
        question: Läuft der Effekt erneut?
        options: [Ja, "Nein, die Abhängigkeit hat sich nicht geändert"]
        answer: 1
        explanation: "React vergleicht jede Abhängigkeit mit Object.is. Unverändert heißt: Effekt überspringen."
      - situation: raumId wechselt auf „reisen“.
        question: In welcher Reihenfolge ruft React die Funktionen auf?
        options:
          - "verbinden('reisen'), dann trennen('allgemein')"
          - "trennen('allgemein'), dann verbinden('reisen')"
          - "Nur verbinden('reisen')"
        answer: 1
        explanation: Erst räumt die Cleanup-Funktion des alten Durchlaufs auf (sie kennt noch die alte raumId), dann läuft der neue Effekt.
      - situation: Der Nutzer verlässt die Seite, ChatRaum wird aus dem Baum entfernt.
        question: Was passiert?
        options: ["trennen('reisen')", "verbinden('reisen')", "Nichts – Effekte enden automatisch"]
        answer: 0
        explanation: Beim Unmount läuft die letzte Cleanup-Funktion. Im StrictMode simuliert React in der Entwicklung genau das zusätzlich direkt nach dem ersten Mount.
---
Ein Videoplayer soll abspielen, sobald `istAktiv` wahr ist. Ein Chat soll eine Verbindung öffnen, solange
er sichtbar ist. Ein Button soll den Cursor ins Suchfeld setzen. Mit State und JSX allein geht das nicht –
du musst aus React „heraustreten“ und mit dem Browser oder einem Server sprechen. Dafür gibt es zwei
Notausgänge: [[react-ref|Refs]] und [[react-effekt|Effekte]].

## useRef: ein Fach, das nicht rendert

`useRef(startwert)` liefert ein Objekt `{ current: startwert }`, das zwischen Renders erhalten bleibt.
Anders als State löst eine Änderung **keinen** Render aus.

```jsx title="Eine Timer-ID merken"
function Stoppuhr() {
  const [laeuft, setLaeuft] = useState(false)
  const intervall = useRef(null)

  function start() {
    setLaeuft(true)
    intervall.current = setInterval(() => console.log('tick'), 1000)
  }
  function stopp() {
    setLaeuft(false)
    clearInterval(intervall.current)
  }
  return <button onClick={laeuft ? stopp : start}>{laeuft ? 'Stopp' : 'Start'}</button>
}
```

| | State | Ref |
|---|---|---|
| Änderung löst Render aus | ja | nein |
| Wert beim Rendern anzeigen | ja | nein (nicht lesen beim Rendern) |
| Typische Inhalte | Anzeige-Daten | Timer-IDs, DOM-Elemente |

## Refs auf DOM-Elemente

Am häufigsten zeigt ein Ref auf ein DOM-Element. Du übergibst es mit dem Attribut `ref`, React trägt nach
dem Commit das Element in `ref.current` ein.

```jsx title="Fokus setzen"
function Suche() {
  const feld = useRef(null)
  return (
    <>
      <input ref={feld} />
      <button onClick={() => feld.current.focus()}>Suchen</button>
    </>
  )
}
```

So steuerst du, was React nicht deklarativ abbildet: Fokus, Scrollen (`scrollIntoView`), Abspielen von
Videos, Größe messen. Seit React 19 kann auch eine **eigene** Komponente `ref` einfach als Prop annehmen
und weiterreichen – `forwardRef` ist dafür nicht mehr nötig.

> [!ACHTUNG]
> Verändere den DOM, den React verwaltet, nicht selbst (z. B. Elemente per Ref entfernen). Lesen, Fokus und
> Scrollen sind unproblematisch.

## useEffect: mit externen Systemen synchronisieren

Ein Effekt ist Code, der **nach dem Commit** läuft – weil die Komponente angezeigt wird, nicht weil
jemand geklickt hat. Er synchronisiert deine Komponente mit etwas außerhalb von React: einer
Netzwerkverbindung, einem Browser-API, einem Widget.

```jsx title="Verbinden und aufräumen"
function ChatRaum({ raumId }) {
  useEffect(() => {
    const verbindung = verbinden(raumId)
    verbindung.oeffnen()
    return () => verbindung.schliessen()     // Cleanup
  }, [raumId])                                // Abhängigkeiten

  return <h1>Raum {raumId}</h1>
}
```

- Das [[abhaengigkeitsarray|Abhängigkeits-Array]] listet alle Werte aus der Komponente, die der Effekt nutzt.
  Ändert sich einer, läuft der Effekt erneut. `[]` heißt: nur beim ersten Anzeigen.
- Die [[cleanup-funktion|Cleanup-Funktion]] räumt auf – vor dem nächsten Durchlauf und beim Entfernen.
- Im StrictMode führt React in der Entwicklung Effekt, Cleanup und Effekt direkt nacheinander aus. Fehlt
  das Aufräumen, fällt es so sofort auf.

> [!FEHLER]
> `useEffect(() => { setAnzahl(anzahl + 1) })` ohne Abhängigkeits-Array: Der Effekt ändert State, das
> löst einen Render aus, danach läuft der Effekt wieder – eine Endlosschleife.

## Du brauchst oft keinen Effekt

Effekte sind ein Notausgang, kein Werkzeug für alles. Die React-Doku nennt typische Fälle, in denen sie
überflüssig sind:

| Statt Effekt … | … besser |
|---|---|
| State `vollerName` per Effekt aus vorname/nachname setzen | beim Rendern berechnen: `const vollerName = vorname + ' ' + nachname` |
| Gefilterte Liste per Effekt in State kopieren | beim Rendern filtern (bei Bedarf `useMemo`) |
| Auf Klick per Effekt reagieren („wenn gekauft, dann POST“) | direkt im Event-Handler senden |
| State per Effekt zurücksetzen, wenn eine Prop wechselt | Komponente mit `key` neu anlegen |

> [!MERKSATZ]
> Frage dich: **Warum** soll der Code laufen? „Weil die Komponente angezeigt wird“ → Effekt. „Weil der Nutzer
> etwas getan hat“ → Event-Handler. „Weil sich ein Wert aus anderen ergibt“ → beim Rendern berechnen.

> [!PRAXIS]
> Daten laden per `useEffect` funktioniert, bringt aber Probleme mit Race Conditions, Caching und
> Ladezuständen. In Projekten übernimmt das meist ein Framework oder eine Bibliothek wie TanStack Query –
> mehr dazu im Kurs „Server-State mit TanStack Query“.

## Zusammenfassung

- `useRef` speichert einen Wert in `ref.current`, ohne neu zu rendern – ideal für Timer-IDs und DOM-Elemente.
- Mit `ref={meinRef}` greifst du nach dem Commit auf ein DOM-Element zu (Fokus, Scrollen, Messen).
- `useEffect(fn, deps)` läuft nach dem Commit und synchronisiert mit externen Systemen.
- Die **Cleanup-Funktion** räumt vor dem nächsten Durchlauf und beim Entfernen auf.
- Abgeleitete Werte berechnest du beim Rendern, Reaktionen auf Klicks gehören in Event-Handler.
