---
title: Daten tief weitergeben mit Context
summary: Wie Context Prop-Drilling vermeidet, wie du in React 19 einen Context bereitstellst und mit useContext liest – und wann Props die bessere Wahl bleiben.
duration: 20
sources:
  - title: react.dev – Passing Data Deeply with Context
    url: https://react.dev/learn/passing-data-deeply-with-context
  - title: react.dev – createContext
    url: https://react.dev/reference/react/createContext
  - title: react.dev – Scaling Up with Reducer and Context
    url: https://react.dev/learn/scaling-up-with-reducer-and-context
quiz:
  - type: single
    question: Wie stellst du in React 19 einen Context-Wert für alle Kinder bereit?
    options:
      - "<ThemeContext value={theme}>…</ThemeContext>"
      - "ThemeContext.set(theme)"
      - "<Provider context={ThemeContext} />"
      - "useContext(ThemeContext, theme)"
    answer: 0
    explanation: >
      Seit React 19 rendest du den Context selbst als Provider und gibst den Wert über `value` mit. Die ältere
      Schreibweise `<ThemeContext.Provider value={…}>` funktioniert noch, gilt aber als veraltet.
  - type: multiple
    question: Welche Aussagen über Context stimmen?
    options:
      - useContext liest den Wert des nächsten Providers oberhalb im Baum.
      - Ohne Provider liefert useContext den Standardwert aus createContext.
      - Ändert sich der Provider-Wert, rendern alle Komponenten neu, die diesen Context lesen.
      - Context ersetzt State – man braucht danach kein useState mehr.
    answers: [0, 1, 2]
    explanation: >
      Context transportiert Werte, er speichert nichts selbst. Der Wert kommt meist aus State oder einem
      Reducer in der Komponente, die den Provider rendert.
  - type: cloze
    text: "Einen Context legst du mit ___ an und liest ihn in einer Komponente mit ___."
    blanks:
      - [createContext, "createContext()"]
      - [useContext, "useContext()"]
    explanation: createContext erzeugt das Context-Objekt (meist in einer eigenen Datei), useContext liest den aktuellen Wert.
  - type: find-bug
    question: Der Button zeigt immer „hell“, obwohl App „dunkel“ bereitstellt. Welche Zeile ist falsch?
    language: jsx
    code: |
      const ThemeContext = React.createContext('hell')
      function Knopf() {
        const theme = React.useContext(ThemeContext)
        return <button className={theme}>OK</button>
      }
      function App() {
        return (
          <>
            <ThemeContext value="dunkel" />
            <Knopf />
          </>
        )
      }
    bug_line: 9
    explanation: >
      Ein Provider gilt nur für Komponenten **innerhalb** seines Tags. Hier ist er leer geschlossen, Knopf steht
      daneben. Richtig: `<ThemeContext value="dunkel"><Knopf /></ThemeContext>`.
tasks:
  - id: theme-context
    type: code
    language: jsx
    title: Ein Farbschema per Context
    description: |
      Der Button tief unten im Baum soll das Farbschema kennen, ohne dass `Seite` und `Werkzeugleiste` es als
      Prop weiterreichen.

      1. Lege mit `React.createContext('hell')` einen `ThemeContext` an.
      2. `App` speichert das Schema in State (Start `'hell'`) und stellt es mit `<ThemeContext value={…}>` bereit.
      3. `Knopf` liest das Schema mit `React.useContext` und setzt es als `className` seines Buttons (`<button className={theme}>`).
      4. Der Button `.umschalten` in `App` wechselt zwischen `'hell'` und `'dunkel'`.
      5. `Seite` und `Werkzeugleiste` bekommen **keine** Theme-Props.
    starter: |
      function Knopf() {
        return <button>Speichern</button>
      }

      function Werkzeugleiste() {
        return <nav><Knopf /></nav>
      }

      function Seite() {
        return <main><Werkzeugleiste /></main>
      }

      function App() {
        return (
          <div>
            <button className="umschalten">Schema wechseln</button>
            <Seite />
          </div>
        )
      }
    tests:
      - name: startet mit dem hellen Schema
        code: assertEqual(query('nav button').className, 'hell')
      - name: wechselt auf dunkel
        code: |
          await click('.umschalten')
          assertEqual(query('nav button').className, 'dunkel')
      - name: wechselt zurück auf hell
        code: |
          await click('.umschalten')
          assertEqual(query('nav button').className, 'hell')
    hints:
      - "Außerhalb aller Komponenten: `const ThemeContext = React.createContext('hell')`."
      - "In App: `const [theme, setTheme] = React.useState('hell')` und `<ThemeContext value={theme}><Seite /></ThemeContext>`."
      - "Umschalten: `setTheme((t) => (t === 'hell' ? 'dunkel' : 'hell'))`; in Knopf `const theme = React.useContext(ThemeContext)`."
    solution: |
      const ThemeContext = React.createContext('hell')

      function Knopf() {
        const theme = React.useContext(ThemeContext)
        return <button className={theme}>Speichern</button>
      }

      function Werkzeugleiste() {
        return <nav><Knopf /></nav>
      }

      function Seite() {
        return <main><Werkzeugleiste /></main>
      }

      function App() {
        const [theme, setTheme] = React.useState('hell')
        return (
          <div>
            <button className="umschalten" onClick={() => setTheme((t) => (t === 'hell' ? 'dunkel' : 'hell'))}>
              Schema wechseln
            </button>
            <ThemeContext value={theme}>
              <Seite />
            </ThemeContext>
          </div>
        )
      }
  - id: props-state-context
    type: dragdrop
    title: Props, State oder Context?
    description: Ordne jede Situation dem passenden Werkzeug zu.
    targets:
      - { id: props, label: Props }
      - { id: state, label: Lokaler State }
      - { id: context, label: Context }
    items:
      - { label: "Eine Karte bekommt Titel und Preis von der Liste darüber", target: props }
      - { label: "Ein Dropdown merkt sich, ob es gerade offen ist", target: state }
      - { label: "Das Farbschema wird in 40 Komponenten auf allen Ebenen gebraucht", target: context }
      - { label: "Der angemeldete Nutzer soll in Kopfzeile, Menü und Profilseite sichtbar sein", target: context }
      - { label: "Ein Suchfeld speichert den getippten Text", target: state }
      - { label: "Ein Button erfährt über onClick, was beim Klick passieren soll", target: props }
    hints:
      - Context lohnt sich für Werte, die viele Komponenten auf ganz unterschiedlichen Ebenen brauchen.
---
Dein Farbschema „hell/dunkel“ steht in `App`. Gebraucht wird es aber in einem Button, der in `Seite` →
`Inhalt` → `Werkzeugleiste` → `Knopf` steckt. Also reichst du `theme` durch drei Komponenten durch, die es
selbst gar nicht benutzen. Das nennt man [[prop-drilling|Prop-Drilling]] – und [[react-context|Context]]
ist die Antwort darauf.

## Das Problem: Prop-Drilling

```jsx title="theme wird nur durchgereicht"
function App() {
  const [theme, setTheme] = useState('hell')
  return <Seite theme={theme} />
}
function Seite({ theme }) { return <Inhalt theme={theme} /> }
function Inhalt({ theme }) { return <Werkzeugleiste theme={theme} /> }
function Werkzeugleiste({ theme }) { return <Knopf theme={theme} /> }
```

Jede Zwischenstufe muss die Prop kennen. Benennst du sie um oder kommt ein zweiter Wert dazu, änderst du
vier Dateien. Context lässt eine Komponente einen Wert für **alle** Komponenten darunter bereitstellen –
egal wie tief.

## Context in drei Schritten

**1. Anlegen** – meist in einer eigenen Datei, mit einem Standardwert:

```jsx title="ThemeContext.js"
import { createContext } from 'react'
export const ThemeContext = createContext('hell')
```

**2. Bereitstellen** – seit React 19 renderst du den Context direkt als [[context-provider|Provider]]:

```jsx title="App.jsx"
function App() {
  const [theme, setTheme] = useState('hell')
  return (
    <ThemeContext value={theme}>
      <Seite />
    </ThemeContext>
  )
}
```

**3. Lesen** – mit dem Hook [[usecontext|useContext]], an beliebiger Stelle darunter:

```jsx title="Knopf.jsx"
function Knopf() {
  const theme = useContext(ThemeContext)
  return <button className={theme}>Speichern</button>
}
```

![Prop-Drilling im Vergleich zu Context: der Wert springt direkt zu den lesenden Komponenten](/assets/react/context-vs-props.svg)

> [!MERKSATZ]
> `createContext` legt an, `<MeinContext value={…}>` stellt bereit, `useContext(MeinContext)` liest den
> Wert des **nächsten** Providers darüber.

## Wie sich Werte ändern

Context selbst speichert nichts. Der Wert kommt fast immer aus State in der Komponente, die den Provider
rendert. Ändert sich dieser State, rendern alle Komponenten neu, die den Context lesen.

- Ohne passenden Provider liefert `useContext` den **Standardwert** aus `createContext`.
- Provider lassen sich verschachteln: Ein innerer Provider überschreibt den Wert für seinen Teilbaum.
- In Projekten vor React 19 siehst du noch `<ThemeContext.Provider value={…}>` – das ist die ältere
  Schreibweise mit derselben Wirkung.

> [!FEHLER]
> `useContext` in derselben Komponente aufrufen, die den Provider rendert: Sie liest den Wert von **oberhalb**
> ihrer selbst, nicht den eigenen Provider. Der Provider wirkt nur auf Kinder.

## Reducer und Context kombinieren

Ein häufiges Muster: Ein Reducer verwaltet die Daten, zwei Contexts verteilen State und `dispatch`. So
kann jede Komponente lesen und Actions schicken – ohne Durchreichen.

```jsx title="AufgabenProvider"
const AufgabenContext = createContext([])
const DispatchContext = createContext(() => {})

function AufgabenProvider({ children }) {
  const [aufgaben, dispatch] = useReducer(aufgabenReducer, [])
  return (
    <AufgabenContext value={aufgaben}>
      <DispatchContext value={dispatch}>{children}</DispatchContext>
    </AufgabenContext>
  )
}
```

## Wann Context – und wann nicht?

Context ist praktisch, macht Datenflüsse aber weniger sichtbar. Prüfe zuerst die einfachen Wege:

| Situation | Empfehlung |
|---|---|
| Wert geht ein bis zwei Ebenen tief | Props |
| Zwischenkomponenten reichen nur `children` weiter | Komposition mit `children` |
| Theme, angemeldeter Nutzer, Sprache, Routing-Daten | Context |
| Server-Daten mit Caching | eigene Bibliothek (TanStack Query) |

> [!PRAXIS]
> In echten Apps stellen Provider ganz oben in `main.tsx` oder `App.tsx` Dinge wie Theme, Übersetzungen,
> den angemeldeten Nutzer und den Daten-Client bereit. Für globalen Client-State nutzen Teams oft
> Bibliotheken wie Zustand oder Redux Toolkit – dafür gibt es eigene Kurse.

## Zusammenfassung

- **Prop-Drilling**: Werte werden durch Komponenten gereicht, die sie nicht brauchen.
- `createContext(standard)` legt einen Context an, `<Ctx value={…}>` stellt ihn bereit (React 19).
- `useContext(Ctx)` liest den Wert des nächsten Providers oberhalb.
- Der Wert kommt meist aus State oder einem Reducer; Änderungen rendern alle Leser neu.
- Reducer + Context ergeben eine kleine, app-weite Datenverwaltung.
- Erst Props und Komposition prüfen – Context für wirklich breit genutzte Werte.
