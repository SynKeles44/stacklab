---
title: State anheben und gezielt zurücksetzen
summary: Wie sich Komponenten State teilen, warum es eine einzige Quelle der Wahrheit gibt und wie React State an der Position im Baum festhält.
duration: 25
sources:
  - title: react.dev – Sharing State Between Components
    url: https://react.dev/learn/sharing-state-between-components
  - title: react.dev – Preserving and Resetting State
    url: https://react.dev/learn/preserving-and-resetting-state
  - title: react.dev – Reacting to Input with State
    url: https://react.dev/learn/reacting-to-input-with-state
quiz:
  - type: single
    question: Zwei Geschwister-Komponenten sollen denselben Wert anzeigen und ändern. Wo gehört der State hin?
    options:
      - In beide Komponenten, jeweils als Kopie.
      - In die nächste gemeinsame Eltern-Komponente; die Kinder bekommen Wert und Setter-Funktion als Props.
      - In eine globale Variable außerhalb von React.
      - In das Kind, das zuerst gerendert wird.
    answer: 1
    explanation: >
      Das ist „State anheben“: Der gemeinsame Elternteil besitzt den State, gibt ihn als Prop nach unten und
      bekommt Änderungen über Funktions-Props zurück. So gibt es eine einzige Quelle der Wahrheit.
  - type: multiple
    question: "Wann setzt React den State einer Komponente zurück?"
    options:
      - Wenn an derselben Stelle im Baum ein Element eines anderen Typs gerendert wird.
      - Wenn sich ihre Props ändern.
      - Wenn sich ihr key ändert.
      - Wenn die Komponente aus dem Baum entfernt wird.
    answers: [0, 2, 3]
    explanation: >
      React verknüpft State mit der Position im Baum. Andere Props allein ändern daran nichts – ein anderer
      Typ, ein anderer key oder das Entfernen schon.
  - type: cloze
    text: "Ein Eingabefeld, dessen Wert aus State kommt (`value={text}`) und über `onChange` aktualisiert wird, heißt ___ Komponente. Mit einem anderen ___ erzwingst du, dass React eine Komponente neu anlegt."
    blanks:
      - [kontrollierte, kontrollierter, controlled]
      - [key]
    explanation: Bei kontrollierten Eingaben ist der State die Quelle der Wahrheit. Ein neuer key heißt für React „das ist eine andere Komponente“.
  - type: find-bug
    question: "Beim Wechsel des Chat-Partners bleibt der getippte Entwurf stehen. Welche Zeile solltest du ändern?"
    language: jsx
    code: |
      function Messenger({ kontakte }) {
        const [aktiv, setAktiv] = React.useState(kontakte[0])
        return (
          <div>
            <Kontaktliste kontakte={kontakte} onWaehlen={setAktiv} />
            <Chat kontakt={aktiv} />
          </div>
        )
      }
    bug_line: 6
    explanation: >
      `Chat` steht immer an derselben Stelle mit demselben Typ – React behält seinen State. Mit
      `<Chat key={aktiv.id} kontakt={aktiv} />` bekommt jeder Kontakt eine eigene Chat-Instanz mit leerem Entwurf.
tasks:
  - id: baum-beschriften
    type: diagram
    title: Wo lebt der State?
    description: |
      Ein Akkordeon zeigt zwei Panels, von denen immer nur eines offen ist. Beschrifte den Komponentenbaum:
      Wer besitzt den State, was fließt nach unten, was nach oben?
    image: /assets/react/komponentenbaum-leer.svg
    slots:
      - { x: 50, y: 17, answer: "Akkordeon – besitzt den State" }
      - { x: 28, y: 50, answer: "Props: istAktiv" }
      - { x: 72, y: 50, answer: "Funktion: onAnzeigen" }
      - { x: 50, y: 84, answer: "Panel – ohne eigenen State" }
    distractors: ["Panel – besitzt den State", "useEffect"]
    hints:
      - Daten fließen in React immer von oben nach unten. Nach oben gelangt nur ein Funktionsaufruf.
  - id: akkordeon
    type: code
    language: jsx
    title: Ein Akkordeon mit angehobenem State
    description: |
      Im Moment hat jedes `Panel` seinen eigenen State – deshalb können beide gleichzeitig offen sein. Hebe den
      State an, sodass immer genau ein Panel offen ist.

      1. Entferne den State aus `Panel`. Es bekommt stattdessen die Props `istAktiv` und `onAnzeigen`.
      2. `App` speichert in `aktiverIndex` (Start: `0`), welches Panel offen ist.
      3. Ein offenes Panel zeigt `<p className="inhalt">`, ein geschlossenes einen `<button className="anzeigen">`.
    starter: |
      function Panel({ titel, children }) {
        const [offen, setOffen] = React.useState(false)
        return (
          <section className="panel">
            <h3>{titel}</h3>
            {offen ? (
              <p className="inhalt">{children}</p>
            ) : (
              <button className="anzeigen" onClick={() => setOffen(true)}>Anzeigen</button>
            )}
          </section>
        )
      }

      function App() {
        return (
          <div>
            <Panel titel="Über uns">Wir bauen Lernsoftware.</Panel>
            <Panel titel="Kontakt">Schreib an kontakt@example.com.</Panel>
          </div>
        )
      }
    tests:
      - name: zu Beginn ist nur das erste Panel offen
        code: |
          assertEqual(queryAll('.inhalt').length, 1)
          assertEqual(query('.inhalt').textContent, 'Wir bauen Lernsoftware.')
      - name: Klick öffnet das zweite und schließt das erste
        code: |
          await click('.panel:nth-child(2) .anzeigen')
          assertEqual(queryAll('.inhalt').length, 1)
          assertEqual(query('.inhalt').textContent, 'Schreib an kontakt@example.com.')
          assertTrue(query('.panel:nth-child(1) .anzeigen') !== null)
      - name: das erste lässt sich wieder öffnen
        code: |
          await click('.panel:nth-child(1) .anzeigen')
          assertEqual(query('.inhalt').textContent, 'Wir bauen Lernsoftware.')
          assertEqual(queryAll('.anzeigen').length, 1)
    hints:
      - "In App: `const [aktiverIndex, setAktiverIndex] = React.useState(0)`."
      - "Panel-Signatur: `function Panel({ titel, children, istAktiv, onAnzeigen })` – statt `offen` prüfst du `istAktiv`."
      - "Aufruf: `<Panel titel=\"Kontakt\" istAktiv={aktiverIndex === 1} onAnzeigen={() => setAktiverIndex(1)}>`."
    solution: |
      function Panel({ titel, children, istAktiv, onAnzeigen }) {
        return (
          <section className="panel">
            <h3>{titel}</h3>
            {istAktiv ? (
              <p className="inhalt">{children}</p>
            ) : (
              <button className="anzeigen" onClick={onAnzeigen}>Anzeigen</button>
            )}
          </section>
        )
      }

      function App() {
        const [aktiverIndex, setAktiverIndex] = React.useState(0)
        return (
          <div>
            <Panel titel="Über uns" istAktiv={aktiverIndex === 0} onAnzeigen={() => setAktiverIndex(0)}>
              Wir bauen Lernsoftware.
            </Panel>
            <Panel titel="Kontakt" istAktiv={aktiverIndex === 1} onAnzeigen={() => setAktiverIndex(1)}>
              Schreib an kontakt@example.com.
            </Panel>
          </div>
        )
      }
---
Auf einer Hilfeseite gibt es mehrere aufklappbare Abschnitte. Jeder merkt sich selbst, ob er offen ist –
und plötzlich sind alle gleichzeitig aufgeklappt, obwohl immer nur einer offen sein soll. Die Abschnitte
müssten voneinander wissen. In React löst du das, indem du den State dorthin verschiebst, wo **beide** ihn
sehen: eine Ebene höher.

## State anheben

Wenn zwei Komponenten denselben Zustand brauchen, gehört er in ihre nächste gemeinsame
Eltern-Komponente. Das nennt man [[state-anheben|State anheben]] (*lifting state up*). Der Ablauf hat
immer drei Schritte:

1. Den State aus den Kindern **entfernen**.
2. Den Wert von oben als **Prop** übergeben (`istAktiv`).
3. Änderungen über eine **Funktions-Prop** nach oben melden (`onAnzeigen`).

```jsx title="Der Elternteil besitzt den State"
function Akkordeon() {
  const [aktiverIndex, setAktiverIndex] = useState(0)
  return (
    <>
      <Panel titel="Über uns" istAktiv={aktiverIndex === 0} onAnzeigen={() => setAktiverIndex(0)} />
      <Panel titel="Kontakt" istAktiv={aktiverIndex === 1} onAnzeigen={() => setAktiverIndex(1)} />
    </>
  )
}
```

![Der Akkordeon-Elternteil gibt istAktiv nach unten, die Panels melden onAnzeigen nach oben](/assets/react/komponentenbaum.svg)

## Eine Quelle der Wahrheit

Nach dem Anheben gibt es für jeden Zustand genau **eine** Komponente, die ihn besitzt. Das ist die
[[single-source-of-truth|einzige Quelle der Wahrheit]]. Kinder, die nur noch Props anzeigen, nennt man
*kontrolliert* – der Elternteil bestimmt, was sie zeigen.

Dasselbe Muster kennst du schon von Eingabefeldern: Eine [[kontrollierte-komponente|kontrollierte]]
Eingabe bekommt ihren Wert aus State und meldet jede Änderung über `onChange`.

```jsx title="Kontrolliertes Eingabefeld"
const [suche, setSuche] = useState('')
<input value={suche} onChange={(e) => setSuche(e.target.value)} />
```

| | kontrolliert | unkontrolliert |
|---|---|---|
| Wert kommt aus | State/Props | dem DOM selbst |
| Beispiel | `value={suche}` | `defaultValue="…"` |
| Vorteil | jederzeit bekannt, prüfbar | weniger Code |

> [!MERKSATZ]
> Daten fließen **nach unten** (Props), Ereignisse **nach oben** (Funktions-Props). Den State besitzt die
> nächste gemeinsame Eltern-Komponente.

## State hängt an der Position im Baum

React speichert State nicht „in der Funktion“, sondern an der **Stelle im Komponentenbaum**, an der die
Komponente gerendert wird. Daraus folgen klare Regeln:

| Situation | State |
|---|---|
| Gleiche Komponente an gleicher Stelle, neue Props | bleibt erhalten |
| Anderer Komponententyp an dieser Stelle | wird zurückgesetzt |
| Komponente wird nicht mehr gerendert | geht verloren |
| Gleiche Komponente, aber anderer `key` | wird zurückgesetzt |

```jsx title="Beide Zweige: gleiche Stelle, gleicher Typ"
{istVip ? <Zaehler farbe="gold" /> : <Zaehler farbe="grau" />}
```

Beim Umschalten behält der Zähler seinen Stand – für React ist es dieselbe Komponente mit neuen Props.

> [!FEHLER]
> Komponenten **innerhalb** einer anderen Komponente definieren (`function App() { function Feld() {…} }`)
> erzeugt bei jedem Render einen neuen Typ. React wirft den State von `Feld` jedes Mal weg – Eingaben
> verlieren den Fokus. Definiere Komponenten immer auf oberster Ebene.

## Mit key gezielt zurücksetzen

Manchmal **willst** du einen frischen State, etwa wenn ein Chat-Fenster den Kontakt wechselt und der
getippte Entwurf verschwinden soll. Dann gibst du der Komponente einen [[key-prop|key]], der sich mit dem
Kontakt ändert.

```jsx title="Ein Chat pro Kontakt"
<Chat key={kontakt.id} kontakt={kontakt} />
```

Ein neuer key bedeutet für React: „Das ist eine andere Komponente.“ Es baut sie neu auf, inklusive
leerem State. Keys funktionieren also nicht nur in Listen.

> [!PRAXIS]
> Formulare zum Bearbeiten eines Datensatzes bekommen in der Praxis oft `key={datensatz.id}`. Wechselt
> man den Datensatz, starten alle Felder sauber mit den neuen Werten – ohne Effekt, der den State nachträglich
> anpasst.

## Zusammenfassung

- Brauchen mehrere Komponenten denselben State, hebst du ihn zum **nächsten gemeinsamen Elternteil** an.
- Werte gehen als Props nach unten, Änderungen als Funktions-Props nach oben.
- Jeder Zustand hat **eine** Quelle der Wahrheit; kontrollierte Eingaben folgen demselben Prinzip.
- React hält State an der **Position im Baum** fest – nicht an der Funktion.
- Anderer Typ, anderer `key` oder Entfernen setzt State zurück.
- Komponenten nie innerhalb anderer Komponenten definieren.
