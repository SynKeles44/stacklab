---
title: State und Events
summary: Wie Komponenten mit useState ein Gedächtnis bekommen und mit Event-Handlern auf Klicks und Eingaben reagieren.
duration: 20
sources:
  - title: react.dev – Responding to Events
    url: https://react.dev/learn/responding-to-events
  - title: react.dev – State, a Component's Memory
    url: https://react.dev/learn/state-a-components-memory
  - title: react.dev – useState
    url: https://react.dev/reference/react/useState
quiz:
  - type: single
    question: Warum ändert sich die Anzeige nicht, wenn du in einer Komponente `let zaehler = 0` deklarierst und im Klick-Handler `zaehler++` ausführst?
    options:
      - Weil let in React verboten ist.
      - Weil eine normale Variable keinen neuen Render auslöst und beim nächsten Render wieder bei 0 beginnt.
      - Weil Klick-Handler in React nicht ausgeführt werden.
      - Weil zaehler++ nur mit const funktioniert.
    answer: 1
    explanation: >
      Lokale Variablen leben nur während eines Funktionsaufrufs. React merkt nichts von der Änderung und ruft
      die Komponente nicht neu auf. State dagegen bleibt zwischen Renders erhalten, und die Setter-Funktion
      stößt einen neuen Render an.
  - type: find-bug
    question: Diese Komponente wirft „Too many re-renders“. In welcher Zeile steckt der Fehler?
    language: jsx
    code: |
      function Zaehler() {
        const [anzahl, setAnzahl] = React.useState(0)
        return (
          <button onClick={setAnzahl(anzahl + 1)}>
            {anzahl}
          </button>
        )
      }
    bug_line: 4
    explanation: >
      `onClick={setAnzahl(anzahl + 1)}` ruft den Setter **sofort beim Rendern** auf – das löst einen neuen
      Render aus, der ihn wieder aufruft. Richtig ist eine Funktion: `onClick={() => setAnzahl(anzahl + 1)}`.
  - type: multiple
    question: Welche Regeln gelten für Hooks wie useState?
    options:
      - Sie werden nur auf oberster Ebene einer Komponente oder eines eigenen Hooks aufgerufen.
      - Sie dürfen in if-Blöcken stehen, wenn die Bedingung meistens wahr ist.
      - Ihr Name beginnt mit use.
      - Jede Komponenten-Instanz hat ihren eigenen, unabhängigen State.
    answers: [0, 2, 3]
    explanation: >
      React ordnet State über die Aufrufreihenfolge der Hooks zu. Steht ein Hook in einer Bedingung oder
      Schleife, verschiebt sich die Reihenfolge – deshalb nur auf oberster Ebene. Zwei `<Zaehler />` haben
      zwei getrennte Zähler.
  - type: cloze
    text: "`const [wert, setWert] = useState(0)` – das Array enthält den aktuellen ___ und eine ___-Funktion. Event-Handler-Props beginnen per Konvention mit ___."
    blanks:
      - [Wert, State, Zustand]
      - [Setter, set, Setz]
      - ["on"]
    explanation: useState liefert Wert und Setter. Props für Ereignisse heißen onClick, onChange, onSubmit oder eigene wie onLoeschen.
tasks:
  - id: zaehler-mit-grenzen
    type: code
    language: jsx
    title: Ein Zähler mit Untergrenze
    description: |
      Baue einen Zähler für Kaffeetassen.

      1. Lege mit `React.useState` einen State `tassen` mit Startwert `0` an.
      2. Zeige den Wert in `<output className="stand">` an.
      3. Ein `<button className="plus">` erhöht um 1, ein `<button className="minus">` verringert um 1,
         ein `<button className="reset">` setzt auf 0 zurück.
      4. Der Wert darf nie negativ werden: Ist er 0, ist der Minus-Button `disabled`.
    starter: |
      function App() {
        // State anlegen

        return (
          <div>
            <output className="stand">0</output>
            <button className="minus">−</button>
            <button className="plus">+</button>
            <button className="reset">Zurücksetzen</button>
          </div>
        )
      }
    tests:
      - name: startet bei 0 und Minus ist deaktiviert
        code: |
          assertEqual(query('.stand').textContent, '0')
          assertEqual(query('.minus').disabled, true)
      - name: Plus erhöht den Wert
        code: |
          await click('.plus')
          await click('.plus')
          await click('.plus')
          assertEqual(query('.stand').textContent, '3')
          assertEqual(query('.minus').disabled, false)
      - name: Minus verringert den Wert
        code: |
          await click('.minus')
          assertEqual(query('.stand').textContent, '2')
      - name: Zurücksetzen springt auf 0
        code: |
          await click('.reset')
          assertEqual(query('.stand').textContent, '0')
          await click('.minus')
          assertEqual(query('.stand').textContent, '0')
    hints:
      - "`const [tassen, setTassen] = React.useState(0)` ganz oben in App."
      - "Handler als Funktion übergeben: `onClick={() => setTassen(tassen + 1)}`."
      - "Für die Untergrenze reicht `disabled={tassen === 0}` am Minus-Button."
    solution: |
      function App() {
        const [tassen, setTassen] = React.useState(0)

        return (
          <div>
            <output className="stand">{tassen}</output>
            <button className="minus" disabled={tassen === 0} onClick={() => setTassen(tassen - 1)}>−</button>
            <button className="plus" onClick={() => setTassen(tassen + 1)}>+</button>
            <button className="reset" onClick={() => setTassen(0)}>Zurücksetzen</button>
          </div>
        )
      }
  - id: zwei-zaehler
    type: steps
    title: Was passiert als Nächstes?
    description: Eine App rendert zweimal dieselbe Komponente `<Zaehler />`, die intern `useState(0)` nutzt.
    steps:
      - situation: Beide Zähler zeigen 0. Du klickst dreimal auf den Button des **ersten** Zählers.
        question: Was zeigen die beiden Zähler?
        options: ["3 und 3", "3 und 0", "0 und 0"]
        answer: 1
        explanation: State gehört zu genau einer Stelle im Komponentenbaum. Jede Instanz hat ihren eigenen Zähler.
      - situation: Der Setter setAnzahl(1) wird im Klick-Handler aufgerufen.
        question: Was macht React daraufhin?
        options:
          - Es ändert sofort den Text im DOM und ruft die Komponente nicht auf.
          - Es merkt sich den neuen Wert und plant einen neuen Render der Komponente.
          - Es lädt die Seite neu.
        answer: 1
        explanation: Ein Setter löst einen Render aus. React ruft die Komponente erneut auf, useState liefert dann den neuen Wert, und React passt den DOM an.
      - situation: Ein Kind-Button bekommt die Prop `onKlick={erhoehen}` und ruft sie in seinem eigenen onClick auf.
        question: Wessen State ändert sich beim Klick?
        options: [Der State des Kindes, Der State der Eltern-Komponente, der erhoehen definiert hat]
        answer: 1
        explanation: Funktionen als Props sind der Weg, wie Kinder Eltern über Ereignisse informieren. Der State bleibt dort, wo die Funktion definiert ist.
---
Ein Button „Gefällt mir“ soll bei jedem Klick hochzählen. Mit dem Wissen aus Modul 1 kannst du ihn
zeichnen – aber nicht reagieren lassen. Dafür braucht eine Komponente zwei Dinge: einen
[[event-handler|Event-Handler]], der auf den Klick reagiert, und ein Gedächtnis, das den Zählerstand
behält. Dieses Gedächtnis heißt [[react-state|State]].

## Auf Ereignisse reagieren

Ein Event-Handler ist eine Funktion, die React aufruft, wenn etwas passiert: Klick, Eingabe, Absenden.
Du übergibst sie als Prop – nicht aufrufen, nur übergeben.

```jsx title="Event-Handler übergeben"
function LikeButton() {
  function handleClick() {
    alert('Danke!')
  }

  return <button onClick={handleClick}>Gefällt mir</button>
}
```

| Schreibweise | Wirkung |
|---|---|
| `onClick={handleClick}` | richtig: Funktion wird übergeben |
| `onClick={() => loeschen(id)}` | richtig: Pfeilfunktion mit Argument |
| `onClick={handleClick()}` | falsch: wird **beim Rendern** aufgerufen |

Der Handler bekommt ein Ereignisobjekt `e`. Bei Eingaben liest du `e.target.value`, bei Formularen
verhinderst du mit `e.preventDefault()` das Neuladen der Seite.

Eigene Komponenten können Ereignisse weitergeben, indem sie Funktionen als Props annehmen. Per
[[konvention|Konvention]] heißen solche Props `onIrgendwas`: `<Eintrag onLoeschen={() => …} />`.

## useState: das Gedächtnis einer Komponente

Eine normale Variable reicht nicht: Sie beginnt bei jedem Aufruf der Komponente von vorn, und ihre
Änderung löst keinen neuen Render aus. Der [[react-hook|Hook]] [[usestate|useState]] löst beides.

```jsx title="Ein Zähler mit State"
import { useState } from 'react'

function LikeButton() {
  const [likes, setLikes] = useState(0)

  return (
    <button onClick={() => setLikes(likes + 1)}>
      Gefällt mir ({likes})
    </button>
  )
}
```

- `useState(0)` legt den State mit dem Startwert 0 an.
- Du bekommst ein Array mit zwei Elementen, das du destrukturierst: den aktuellen Wert und eine
  **Setter-Funktion**.
- Der Setter speichert den neuen Wert **und** löst einen neuen Render aus.

> [!MERKSATZ]
> State ist das Gedächtnis einer Komponente. Ändern darfst du ihn nur über den Setter – der sorgt dafür,
> dass React die Komponente neu rendert.

## Der Ablauf: Trigger, Render, Commit

Was passiert nach `setLikes(1)`? React arbeitet in drei Schritten:

1. **Trigger:** Der Setter meldet „Diese Komponente braucht einen neuen Render“.
2. **Render:** React ruft deine Komponente erneut auf. Diesmal liefert `useState` den Wert 1.
3. **Commit:** React vergleicht das neue JSX mit dem alten und ändert im DOM nur die Stellen, die anders
   sind – hier nur den Text im Button.

![Trigger, Render, Commit: der Weg vom Klick bis zum geänderten DOM](/assets/react/render-zyklus.svg)

Der erste Durchlauf beim Start (`root.render(<App />)`) folgt demselben Muster – nur dass React dabei
alle DOM-Knoten neu anlegt.

## Regeln für Hooks

Alle Funktionen, die mit `use` beginnen, sind Hooks. Für sie gelten zwei Regeln:

- Rufe sie nur auf der **obersten Ebene** einer Komponente auf – nie in `if`, Schleifen oder
  verschachtelten Funktionen.
- Rufe sie nur in **Komponenten** oder in **eigenen Hooks** auf, nicht in normalen Funktionen.

React erkennt die States einer Komponente an der **Reihenfolge** der Hook-Aufrufe. Mehrere States sind
kein Problem:

```jsx title="Mehrere State-Variablen"
const [name, setName] = useState('')
const [alter, setAlter] = useState(0)
const [offen, setOffen] = useState(false)
```

Jede Instanz einer Komponente hat ihren **eigenen** State. Zwei `<LikeButton />` zählen unabhängig.

> [!FEHLER]
> `if (eingeloggt) { const [x, setX] = useState(0) }` bricht die Hook-Reihenfolge. Lege den State immer an
> und entscheide erst danach, was du anzeigst.

> [!PRAXIS]
> Ob ein Menü offen ist, welcher Tab aktiv ist oder was im Suchfeld steht – solcher UI-Zustand lebt in
> echten Projekten fast immer in `useState` direkt in der Komponente, die ihn braucht.

## Zusammenfassung

- Event-Handler übergibst du als Funktion: `onClick={handleClick}` oder `onClick={() => …}`.
- `useState(start)` liefert `[wert, setWert]`; der Setter speichert und löst einen Render aus.
- Ein State-Update läuft in drei Schritten: **Trigger → Render → Commit**.
- Hooks nur auf oberster Ebene und nur in Komponenten oder eigenen Hooks.
- Jede Komponenten-Instanz hat ihren eigenen State.
- Kinder melden Ereignisse an Eltern über Funktionen als Props (`onLoeschen`).
