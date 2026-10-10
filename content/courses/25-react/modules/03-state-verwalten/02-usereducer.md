---
title: Logik bündeln mit useReducer
summary: Wie du verstreute State-Updates in eine Reducer-Funktion auslagerst und mit dispatch und Actions beschreibst, was passiert ist.
duration: 20
sources:
  - title: react.dev – Extracting State Logic into a Reducer
    url: https://react.dev/learn/extracting-state-logic-into-a-reducer
  - title: react.dev – useReducer
    url: https://react.dev/reference/react/useReducer
quiz:
  - type: match
    question: Ordne jedem Begriff seine Rolle zu.
    pairs:
      - { left: "Reducer", right: "Reine Funktion (state, action) => neuer State" }
      - { left: "Action", right: "Objekt, das beschreibt, was passiert ist" }
      - { left: "dispatch", right: "Funktion, die eine Action an den Reducer schickt" }
      - { left: "useReducer", right: "Hook, der State und dispatch liefert" }
    explanation: "Die Komponente schickt mit dispatch eine Action, React ruft den Reducer mit dem aktuellen State und der Action auf und rendert mit dem Ergebnis."
  - type: find-bug
    question: Nach dem Hinzufügen erscheint die neue Aufgabe nicht. In welcher Zeile liegt der Fehler?
    language: js
    code: |
      function aufgabenReducer(aufgaben, action) {
        switch (action.type) {
          case 'hinzugefuegt': {
            aufgaben.push({ id: action.id, titel: action.titel, fertig: false })
            return aufgaben
          }
          default:
            throw new Error('Unbekannte Action: ' + action.type)
        }
      }
    bug_line: 4
    explanation: >
      Auch ein Reducer darf den State nicht verändern. `push` mutiert das Array, danach wird dieselbe Referenz
      zurückgegeben. Richtig: `return [...aufgaben, { id: action.id, titel: action.titel, fertig: false }]`.
  - type: multiple
    question: Welche Aussagen über Reducer stimmen?
    options:
      - Ein Reducer muss rein sein – kein fetch, keine Timer, keine Zufallszahlen.
      - "Actions beschreiben, was der Nutzer getan hat, z. B. { type: 'geloescht', id: 3 }."
      - Ein Reducer darf direkt setState anderer Komponenten aufrufen.
      - Reducer lassen sich ohne React mit normalen Funktionsaufrufen testen.
    answers: [0, 1, 3]
    explanation: >
      Reducer sind reine Funktionen: Sie bekommen State und Action und liefern den nächsten State. Dadurch sind
      sie vorhersagbar und leicht testbar. Seiteneffekte gehören in Event-Handler oder Effekte.
  - type: cloze
    text: "`const [state, ___] = useReducer(reducer, startwert)` – eine Action ist meist ein Objekt mit dem Feld ___."
    blanks:
      - [dispatch]
      - [type]
    explanation: Der zweite Wert heißt per Konvention dispatch. Das Feld type sagt dem Reducer, welcher Fall gemeint ist.
tasks:
  - id: reducer-todo
    type: code
    language: jsx
    title: Eine Aufgabenliste mit useReducer
    description: |
      Baue eine Aufgabenliste, deren gesamte Logik in einem Reducer steckt.

      1. Vervollständige `aufgabenReducer` für die Actions `hinzugefuegt` (mit `id` und `titel`),
         `umgeschaltet` (mit `id`), `geloescht` (mit `id`) und `erledigteEntfernt`. Unbekannte Actions werfen einen Fehler.
      2. `App` nutzt `React.useReducer(aufgabenReducer, startAufgaben)`.
      3. Das Formular `.neu` fügt beim Absenden die Aufgabe aus dem Eingabefeld hinzu (leere ignorieren) und
         leert das Feld. Jede Aufgabe ist ein `<li>` mit `<span>`, einem Button `.umschalten` und `.loeschen`;
         erledigte haben die Klasse `fertig`.
      4. `<p className="offen">` zeigt „2 offen“ (berechnet, kein eigener State), der Button `.aufraeumen`
         entfernt alle erledigten.
    starter: |
      const startAufgaben = [
        { id: 1, titel: 'Reducer verstehen', fertig: false },
        { id: 2, titel: 'Tests schreiben', fertig: false },
      ]
      let naechsteId = 3

      function aufgabenReducer(aufgaben, action) {
        switch (action.type) {
          case 'hinzugefuegt':
            return aufgaben
          default:
            throw new Error('Unbekannte Action: ' + action.type)
        }
      }

      function App() {
        const [aufgaben, dispatch] = React.useReducer(aufgabenReducer, startAufgaben)
        const [titel, setTitel] = React.useState('')

        function absenden(e) {
          e.preventDefault()
          // dispatch …
        }

        return (
          <div>
            <form className="neu" onSubmit={absenden}>
              <input value={titel} onChange={(e) => setTitel(e.target.value)} />
              <button type="submit">Hinzufügen</button>
            </form>
            <ul>
              {aufgaben.map((a) => (
                <li key={a.id}>
                  <span>{a.titel}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      }
    tests:
      - name: zeigt zwei offene Aufgaben
        code: |
          assertEqual(queryAll('li').length, 2)
          assertEqual(query('.offen').textContent, '2 offen')
      - name: fügt per Formular hinzu und leert das Feld
        code: |
          await type('.neu input', 'Context lernen')
          await click('.neu button')
          assertEqual(queryAll('li').length, 3)
          assertEqual(queryAll('li span')[2].textContent, 'Context lernen')
          assertEqual(query('.neu input').value, '')
          assertEqual(query('.offen').textContent, '3 offen')
      - name: ignoriert leere Aufgaben
        code: |
          await click('.neu button')
          assertEqual(queryAll('li').length, 3)
      - name: schaltet um und zählt offene neu
        code: |
          await click('li:nth-child(1) .umschalten')
          assertTrue(query('li:nth-child(1)').classList.contains('fertig'))
          assertEqual(query('.offen').textContent, '2 offen')
      - name: löscht einzeln und räumt erledigte auf
        code: |
          await click('li:nth-child(3) .loeschen')
          assertEqual(queryAll('li').length, 2)
          await click('.aufraeumen')
          assertEqual(queryAll('li span').map((s) => s.textContent).join(','), 'Tests schreiben')
    hints:
      - "Jeder Fall gibt einen neuen State zurück, z. B. `case 'geloescht': return aufgaben.filter((a) => a.id !== action.id)`."
      - "Absenden: `if (titel.trim() === '') return; dispatch({ type: 'hinzugefuegt', id: naechsteId++, titel: titel.trim() }); setTitel('')`."
      - "Offene zählen beim Rendern: `aufgaben.filter((a) => !a.fertig).length`."
    solution: |
      const startAufgaben = [
        { id: 1, titel: 'Reducer verstehen', fertig: false },
        { id: 2, titel: 'Tests schreiben', fertig: false },
      ]
      let naechsteId = 3

      function aufgabenReducer(aufgaben, action) {
        switch (action.type) {
          case 'hinzugefuegt':
            return [...aufgaben, { id: action.id, titel: action.titel, fertig: false }]
          case 'umgeschaltet':
            return aufgaben.map((a) => (a.id === action.id ? { ...a, fertig: !a.fertig } : a))
          case 'geloescht':
            return aufgaben.filter((a) => a.id !== action.id)
          case 'erledigteEntfernt':
            return aufgaben.filter((a) => !a.fertig)
          default:
            throw new Error('Unbekannte Action: ' + action.type)
        }
      }

      function App() {
        const [aufgaben, dispatch] = React.useReducer(aufgabenReducer, startAufgaben)
        const [titel, setTitel] = React.useState('')
        const offen = aufgaben.filter((a) => !a.fertig).length

        function absenden(e) {
          e.preventDefault()
          if (titel.trim() === '') return
          dispatch({ type: 'hinzugefuegt', id: naechsteId++, titel: titel.trim() })
          setTitel('')
        }

        return (
          <div>
            <form className="neu" onSubmit={absenden}>
              <input value={titel} onChange={(e) => setTitel(e.target.value)} />
              <button type="submit">Hinzufügen</button>
            </form>
            <ul>
              {aufgaben.map((a) => (
                <li key={a.id} className={a.fertig ? 'fertig' : ''}>
                  <span>{a.titel}</span>
                  <button className="umschalten" onClick={() => dispatch({ type: 'umgeschaltet', id: a.id })}>✓</button>
                  <button className="loeschen" onClick={() => dispatch({ type: 'geloescht', id: a.id })}>×</button>
                </li>
              ))}
            </ul>
            <p className="offen">{offen} offen</p>
            <button className="aufraeumen" onClick={() => dispatch({ type: 'erledigteEntfernt' })}>Erledigte entfernen</button>
          </div>
        )
      }
  - id: dispatch-ablauf
    type: order
    title: Der Weg einer Action
    description: Bring die Schritte in die richtige Reihenfolge – vom Klick bis zur neuen Anzeige.
    items:
      - Die Nutzerin klickt auf „Löschen“.
      - "Der Event-Handler ruft dispatch({ type: 'geloescht', id: 7 }) auf."
      - React ruft den Reducer mit dem aktuellen State und der Action auf.
      - Der Reducer gibt ein neues Array ohne die Aufgabe 7 zurück.
      - React rendert die Komponente mit dem neuen State.
      - Im Commit entfernt React das li aus dem DOM.
    hints:
      - dispatch ist nur der Bote – gerechnet wird im Reducer, angezeigt erst nach dem Render.
---
Deine Aufgabenliste kann hinzufügen, umbenennen, abhaken, löschen, sortieren und „alle erledigten
entfernen“. Jeder Handler ruft `setAufgaben` mit eigener Logik auf – sechs Stellen, die alle auf
dasselbe Array zugreifen. Wo genau passiert was? Mit [[usereducer|useReducer]] sammelst du diese Logik
an **einer** Stelle.

## Die Idee: beschreiben statt anweisen

Statt in jedem Handler „setze den State auf …“ zu schreiben, meldest du nur noch, **was passiert ist**.
Diese Meldung ist eine [[react-action|Action]] – ein einfaches Objekt mit einem `type`.

```jsx title="Vorher: Logik in jedem Handler"
function handleLoeschen(id) {
  setAufgaben(aufgaben.filter((a) => a.id !== id))
}
```

```jsx title="Nachher: nur noch melden"
function handleLoeschen(id) {
  dispatch({ type: 'geloescht', id })
}
```

Die Funktion `dispatch` schickt die Action an den [[reducer|Reducer]]. Der entscheidet, wie aus dem alten
State der neue wird. Der Name stammt von `Array.prototype.reduce`: Auch dort wird aus einem bisherigen
Wert und einem neuen Element ein Ergebnis.

> [!MERKSATZ]
> Event-Handler sagen, **was passiert ist** (`dispatch(action)`). Der Reducer entscheidet, **wie sich der
> State dadurch ändert**.

## Einen Reducer schreiben

Ein Reducer ist eine [[reine-funktion|reine Funktion]] mit zwei Parametern: dem aktuellen State und der
Action. Er gibt den nächsten State zurück. Meist enthält er eine
[[switch-anweisung|switch-Anweisung]] über `action.type`.

```jsx title="aufgabenReducer"
function aufgabenReducer(aufgaben, action) {
  switch (action.type) {
    case 'hinzugefuegt':
      return [...aufgaben, { id: action.id, titel: action.titel, fertig: false }]
    case 'umgeschaltet':
      return aufgaben.map((a) => (a.id === action.id ? { ...a, fertig: !a.fertig } : a))
    case 'geloescht':
      return aufgaben.filter((a) => a.id !== action.id)
    default:
      throw new Error('Unbekannte Action: ' + action.type)
  }
}
```

Für Reducer gelten dieselben Regeln wie für State-Updates:

- **Nichts verändern**, immer ein neues Objekt oder Array zurückgeben.
- **Keine Seiteneffekte:** kein `fetch`, keine Timer, kein `Math.random()` – IDs erzeugst du vorher im
  Handler und gibst sie in der Action mit.
- Unbekannte Actions mit einem Fehler quittieren, damit Tippfehler auffallen.

> [!FEHLER]
> `case 'geloescht': aufgaben.splice(index, 1); return aufgaben` – das mutiert den State und gibt dieselbe
> Referenz zurück. React rendert nicht neu, und im StrictMode wird der Fehler oft doppelt sichtbar.

## useReducer in der Komponente

```jsx title="Reducer einbinden"
import { useReducer } from 'react'

function Aufgaben() {
  const [aufgaben, dispatch] = useReducer(aufgabenReducer, startAufgaben)
  const offen = aufgaben.filter((a) => !a.fertig).length   // abgeleitet

  return (
    <>
      <p>{offen} offen</p>
      {aufgaben.map((a) => (
        <button key={a.id} onClick={() => dispatch({ type: 'umgeschaltet', id: a.id })}>
          {a.titel}
        </button>
      ))}
    </>
  )
}
```

Mit TypeScript beschreibst du Actions als Union-Typ, z. B.
`type Action = { type: 'hinzugefuegt'; id: number; titel: string } | { type: 'geloescht'; id: number }`.
Dann prüft der Compiler in jedem `case`, welche Felder vorhanden sind.

## useState oder useReducer?

| Kriterium | useState | useReducer |
|---|---|---|
| Wenige, unabhängige Werte | ideal | zu viel Aufwand |
| Viele Updates auf denselben Daten | wird unübersichtlich | übersichtlich an einer Stelle |
| Testen der Logik | nur über die Komponente | Reducer direkt aufrufen |
| Fehlersuche | Logik verstreut | `console.log(action)` im Reducer |

Ein Reducer ist ohne React testbar: `aufgabenReducer([], { type: 'hinzugefuegt', id: 1, titel: 'A' })` liefert
direkt das Ergebnis.

> [!PRAXIS]
> Mehrstufige Formulare, Warenkörbe oder Editoren mit Rückgängig-Funktion werden in Projekten oft mit
> Reducern gebaut. Bibliotheken wie Redux Toolkit beruhen auf genau diesem Prinzip – sie sind Thema
> eines eigenen Kurses.

## Zusammenfassung

- `useReducer(reducer, startwert)` liefert `[state, dispatch]`.
- Eine **Action** beschreibt, was passiert ist: `{ type: 'geloescht', id }`.
- Der **Reducer** `(state, action) => neuerState` ist rein und verändert nichts.
- Handler rufen nur noch `dispatch` auf – die Logik steht gesammelt im Reducer.
- Reducer lohnen sich bei vielen zusammenhängenden Updates und lassen sich einzeln testen.
