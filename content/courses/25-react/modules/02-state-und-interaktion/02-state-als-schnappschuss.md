---
title: State als Schnappschuss
summary: Warum State innerhalb eines Renders fest steht, wie React Updates bündelt und wann du eine Updater-Funktion brauchst.
duration: 20
sources:
  - title: react.dev – Render and Commit
    url: https://react.dev/learn/render-and-commit
  - title: react.dev – State as a Snapshot
    url: https://react.dev/learn/state-as-a-snapshot
  - title: react.dev – Queueing a Series of State Updates
    url: https://react.dev/learn/queueing-a-series-of-state-updates
quiz:
  - type: single
    question: "`anzahl` ist 0. Der Handler ruft `setAnzahl(anzahl + 1)` dreimal hintereinander auf. Welchen Wert hat anzahl nach dem nächsten Render?"
    options: ["1", "3", "0", "Es gibt einen Fehler"]
    answer: 0
    explanation: >
      In diesem Render ist anzahl fest 0. Dreimal wird also „setze auf 0 + 1“ angefordert. Das Ergebnis ist 1.
  - type: single
    question: "Wie lautet der Aufruf, damit drei Aufrufe hintereinander wirklich um 3 erhöhen?"
    options:
      - "setAnzahl(anzahl++)"
      - "setAnzahl((a) => a + 1)"
      - "setAnzahl(anzahl + 1); anzahl = anzahl + 1"
      - "setAnzahl(anzahl + 3) dreimal"
    answer: 1
    explanation: >
      Eine Updater-Funktion bekommt den jeweils aktuellsten Wert aus der Warteschlange. Drei Updater machen
      aus 0 nacheinander 1, 2 und 3.
  - type: multiple
    question: Welche Aussagen zum Rendern stimmen?
    options:
      - React bündelt mehrere setState-Aufrufe in einem Event-Handler zu einem Render.
      - Nach setState hat die Variable im selben Handler schon den neuen Wert.
      - Ein Event-Handler sieht immer den State des Renders, in dem er erstellt wurde.
      - Im Commit ändert React nur die DOM-Knoten, die sich unterscheiden.
    answers: [0, 2, 3]
    explanation: >
      Der State ist pro Render ein fester Schnappschuss. Neue Werte gibt es erst im nächsten Render. Das
      Bündeln (Batching) spart unnötige Zwischen-Renders.
  - type: match
    question: Ordne jedem Aufruf (Startwert 0, alle drei hintereinander im selben Handler) das Ergebnis zu.
    pairs:
      - { left: "setN(n + 5); setN(n + 1)", right: "1" }
      - { left: "setN(n + 5); setN((x) => x + 1)", right: "6" }
      - { left: "setN((x) => x + 2); setN(10)", right: "10" }
      - { left: "setN((x) => x + 2); setN((x) => x * 4)", right: "8" }
    explanation: >
      React arbeitet die Warteschlange der Reihe nach ab: Ein fester Wert ersetzt, eine Updater-Funktion
      rechnet mit dem bisherigen Ergebnis weiter.
tasks:
  - id: render-vorhersagen
    type: steps
    title: Sag den nächsten Render voraus
    description: |
      Eine Komponente hat `const [punkte, setPunkte] = useState(0)` und zeigt `<p>{punkte}</p>`. Sag für
      jeden Klick voraus, was passiert.
    steps:
      - situation: "Klick auf einen Button mit `onClick={() => { setPunkte(punkte + 1); setPunkte(punkte + 1) }}`."
        question: Was zeigt der Absatz danach?
        options: ["1", "2", "0"]
        answer: 0
        explanation: Beide Aufrufe sehen punkte = 0 und fordern 1 an.
      - situation: "Neuer Stand: 1. Klick auf `onClick={() => { setPunkte(punkte + 1); alert(punkte) }}`."
        question: Welche Zahl zeigt das alert-Fenster?
        options: ["1", "2", "undefined"]
        answer: 0
        explanation: Der Handler stammt aus dem Render mit punkte = 1. Der Setter ändert diesen Schnappschuss nicht.
      - situation: "Stand: 2. Klick auf `onClick={() => { setTimeout(() => alert(punkte), 3000); setPunkte(10) }}`. Nach einer Sekunde ist schon 10 zu sehen."
        question: Was zeigt das alert nach drei Sekunden?
        options: ["10", "2", "3"]
        answer: 1
        explanation: Auch eine spätere Funktion „erinnert“ sich an den State ihres Renders. Das ist ein Closure über den Schnappschuss.
      - situation: "Stand: 10. Klick auf `onClick={() => { setPunkte((p) => p + 1); setPunkte((p) => p + 1) }}`."
        question: Was zeigt der Absatz danach?
        options: ["11", "12", "20"]
        answer: 1
        explanation: Updater-Funktionen werden nacheinander auf den jeweils neuesten Wert angewendet – 10 → 11 → 12.
  - id: plus-drei
    type: code
    language: jsx
    title: Der Plus-3-Button
    description: |
      Der Button soll den Punktestand um **3** erhöhen, indem er dreimal hintereinander eine Erhöhung um 1
      anfordert (so wie es später z. B. drei einzelne Ereignisse tun würden). Im Moment springt er aber nur um 1.

      1. Lass die drei Aufrufe stehen, aber stelle sie auf Updater-Funktionen um.
      2. Der Button `.reset` setzt auf 0 zurück.
    starter: |
      function App() {
        const [punkte, setPunkte] = React.useState(0)

        function plusDrei() {
          setPunkte(punkte + 1)
          setPunkte(punkte + 1)
          setPunkte(punkte + 1)
        }

        return (
          <div>
            <p className="punkte">{punkte}</p>
            <button className="plus3" onClick={plusDrei}>+3</button>
            <button className="reset">Reset</button>
          </div>
        )
      }
    tests:
      - name: startet bei 0
        code: assertEqual(query('.punkte').textContent, '0')
      - name: ein Klick erhöht um 3
        code: |
          await click('.plus3')
          assertEqual(query('.punkte').textContent, '3')
      - name: zwei weitere Klicks ergeben 9
        code: |
          await click('.plus3')
          await click('.plus3')
          assertEqual(query('.punkte').textContent, '9')
      - name: Reset setzt auf 0
        code: |
          await click('.reset')
          assertEqual(query('.punkte').textContent, '0')
    hints:
      - Alle drei Aufrufe lesen denselben Schnappschuss von punkte.
      - "Eine Updater-Funktion sieht so aus: `setPunkte((p) => p + 1)`."
      - "Für den Reset: `onClick={() => setPunkte(0)}`."
    solution: |
      function App() {
        const [punkte, setPunkte] = React.useState(0)

        function plusDrei() {
          setPunkte((p) => p + 1)
          setPunkte((p) => p + 1)
          setPunkte((p) => p + 1)
        }

        return (
          <div>
            <p className="punkte">{punkte}</p>
            <button className="plus3" onClick={plusDrei}>+3</button>
            <button className="reset" onClick={() => setPunkte(0)}>Reset</button>
          </div>
        )
      }
---
Du klickst auf „+3“, der Code ruft dreimal `setPunkte(punkte + 1)` auf – und der Zähler springt nur um 1.
Kein Bug in React, sondern eine bewusste Eigenschaft: State verhält sich wie ein **Schnappschuss**. Wer
das verstanden hat, versteht die meisten „komischen“ React-Effekte.

## Rendern heißt: die Funktion erneut aufrufen

[[rendern|Rendern]] bedeutet, dass React deine Komponentenfunktion aufruft. Alles darin – Props, State,
lokale Variablen, Event-Handler – wird für **diesen einen Aufruf** neu erzeugt.

```jsx title="Jeder Render hat eigene Werte"
function Anzeige() {
  const [punkte, setPunkte] = useState(0)
  const doppelt = punkte * 2          // neu berechnet pro Render

  function zeigen() {                 // neu erstellt pro Render
    alert(punkte)
  }

  return <button onClick={zeigen}>{punkte} / {doppelt}</button>
}
```

Stell dir jeden Render wie ein Foto vor: Auf dem Foto vom ersten Render steht `punkte = 0`, und der Handler
`zeigen` auf diesem Foto kennt nur die 0. Ein späterer Render macht ein neues Foto, das alte bleibt, wie
es war.

## Setter ändern den Schnappschuss nicht

Ein Setter **verändert die Variable nicht**. Er bittet React um einen neuen Render mit einem neuen Wert.
Im laufenden Handler bleibt der alte Wert.

```jsx title="Was zeigt alert?"
function handleClick() {
  setPunkte(punkte + 1)
  console.log(punkte)        // immer noch der alte Wert!
  setTimeout(() => alert(punkte), 3000)   // auch nach 3 Sekunden: alter Wert
}
```

Das liegt an [[closure|Closures]]: Der Handler „schließt“ die Werte des Renders ein, in dem er entstanden
ist. Das ist gewollt – ein Handler arbeitet mit einem in sich stimmigen Satz von Werten, statt mitten im
Ablauf andere Daten zu sehen.

> [!MERKSATZ]
> State ist pro Render ein fester Wert. Ein Setter plant einen **neuen** Render – der aktuelle Code sieht
> weiterhin den alten Schnappschuss.

## Batching: viele Updates, ein Render

React wartet, bis dein Event-Handler fertig ist, und verarbeitet erst dann alle angeforderten Updates
gemeinsam. Das heißt [[batching|Batching]]. So entstehen keine halbfertigen Zwischenzustände und keine
überflüssigen Renders.

```jsx title="Drei Aufrufe, ein Render, Ergebnis 1"
setPunkte(punkte + 1)   // setze auf 0 + 1
setPunkte(punkte + 1)   // setze auf 0 + 1
setPunkte(punkte + 1)   // setze auf 0 + 1
```

Alle drei Zeilen sehen `punkte = 0`. In die Warteschlange kommt dreimal „ersetze durch 1“.

> [!FEHLER]
> „Ich rufe den Setter dreimal auf, also +3.“ – Nein: Mit `wert + 1` liest jeder Aufruf denselben
> Schnappschuss. Brauchst du den vorherigen **Ergebniswert**, nimm eine Updater-Funktion.

## Updater-Funktionen

Statt eines Wertes kannst du dem Setter eine Funktion übergeben. React ruft sie beim Abarbeiten der
Warteschlange mit dem **jeweils neuesten** Wert auf. Das ist eine [[updater-funktion|Updater-Funktion]].

```jsx title="So wird es +3"
setPunkte((p) => p + 1)   // 0 → 1
setPunkte((p) => p + 1)   // 1 → 2
setPunkte((p) => p + 1)   // 2 → 3
```

| In der Warteschlange | Ergebnis bei Start 0 |
|---|---|
| `5`, dann `(n) => n + 1` | 6 |
| `(n) => n + 1`, dann `42` | 42 |
| `(n) => n * 2`, dann `(n) => n + 1` | 1 |

Ein fester Wert ersetzt, eine Funktion rechnet weiter. Per Konvention nennt man den Parameter nach dem
ersten Buchstaben des States (`p` für punkte) oder `prev`.

> [!PRAXIS]
> Updater-Funktionen sind immer dann sinnvoll, wenn der neue Wert vom alten abhängt **und** mehrere
> Updates zusammenkommen können – etwa bei Zählern, Warenkorb-Mengen oder Toggles, die von mehreren
> Stellen ausgelöst werden.

## Zusammenfassung

- Rendern heißt: React ruft die Komponente auf; jeder Render hat eigene Props, State und Handler.
- State ist ein **Schnappschuss** – Setter ändern ihn im laufenden Code nicht.
- Handler und Timer sehen den State des Renders, in dem sie entstanden sind (Closure).
- React bündelt Updates eines Handlers zu einem Render (**Batching**).
- `setX(x + 1)` mehrfach hintereinander erhöht nur einmal.
- Die **Updater-Funktion** `setX((prev) => prev + 1)` rechnet mit dem neuesten Wert weiter.
