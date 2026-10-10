---
title: Objekte und Arrays im State
summary: Warum du State nie direkt veränderst und wie du Objekte und Arrays mit Spread, map und filter unveränderlich aktualisierst.
duration: 25
sources:
  - title: react.dev – Updating Objects in State
    url: https://react.dev/learn/updating-objects-in-state
  - title: react.dev – Updating Arrays in State
    url: https://react.dev/learn/updating-arrays-in-state
  - title: MDN – Spread syntax
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
quiz:
  - type: find-bug
    question: Der Button fügt nichts sichtbar hinzu. In welcher Zeile steckt der Fehler?
    language: jsx
    code: |
      function Liste() {
        const [namen, setNamen] = React.useState(['Ada'])
        function hinzufuegen() {
          namen.push('Linus')
          setNamen(namen)
        }
        return <button onClick={hinzufuegen}>{namen.length}</button>
      }
    bug_line: 4
    explanation: >
      `push` verändert das bestehende Array. Danach wird **dasselbe** Array an den Setter übergeben – React
      vergleicht mit Object.is, sieht keinen Unterschied und rendert nicht neu. Richtig:
      `setNamen([...namen, 'Linus'])`.
  - type: match
    question: Ordne jeder Änderung die unveränderliche Schreibweise zu.
    pairs:
      - { left: "Eintrag hinzufügen", right: "[...liste, neu]" }
      - { left: "Eintrag entfernen", right: "liste.filter((x) => x.id !== id)" }
      - { left: "Eintrag ändern", right: "liste.map((x) => x.id === id ? { ...x, fertig: true } : x)" }
      - { left: "Sortieren", right: "liste.toSorted(vergleich)" }
    explanation: Alle vier Varianten erzeugen ein neues Array; das alte bleibt unberührt.
  - type: single
    question: "State ist `{ name: 'Ada', adresse: { stadt: 'Köln' } }`. Wie änderst du nur die Stadt richtig?"
    options:
      - "person.adresse.stadt = 'Bonn'; setPerson(person)"
      - "setPerson({ ...person, adresse: { ...person.adresse, stadt: 'Bonn' } })"
      - "setPerson({ adresse: { stadt: 'Bonn' } })"
      - "setPerson({ ...person, stadt: 'Bonn' })"
    answer: 1
    explanation: >
      Jede Ebene, die sich ändert, wird kopiert. Ohne `...person` ginge der Name verloren, und `stadt` auf
      oberster Ebene wäre ein neues, falsches Feld.
  - type: cloze
    text: "React vergleicht alten und neuen State mit ___. Erzeugst du statt einer Änderung ein neues Objekt, nennt man das ___ Update."
    blanks:
      - ["Object.is", "Object.is()"]
      - [unveränderliches, unveraenderliches, immutables]
    explanation: Nur eine neue Referenz signalisiert React „hier hat sich etwas geändert“.
tasks:
  - id: einkaufsliste-state
    type: code
    language: jsx
    title: Eine Einkaufsliste ohne Mutation
    description: |
      Die Einkaufsliste soll Einträge hinzufügen, abhaken und löschen – der Starter-Code verändert den State
      aber direkt, deshalb aktualisiert sich nichts.

      1. **Hinzufügen:** Der Button `.hinzufuegen` legt einen Eintrag `{ id, name, gekauft: false }` mit dem
         Text aus dem Eingabefeld an und leert das Feld. Leere Eingaben werden ignoriert.
      2. **Abhaken:** Klick auf den Button `.umschalten` eines Eintrags kehrt `gekauft` um. Gekaufte Einträge
         bekommen die Klasse `gekauft` am `<li>`.
      3. **Löschen:** Der Button `.loeschen` entfernt den Eintrag.

      Arbeite ausschließlich mit neuen Arrays und Objekten (`[...]`, `map`, `filter`, `{ ...x }`).
    starter: |
      let naechsteId = 3

      function App() {
        const [eintraege, setEintraege] = React.useState([
          { id: 1, name: 'Brot', gekauft: false },
          { id: 2, name: 'Milch', gekauft: false },
        ])
        const [text, setText] = React.useState('')

        function hinzufuegen() {
          eintraege.push({ id: naechsteId++, name: text, gekauft: false })
          setEintraege(eintraege)
        }

        function umschalten(id) {
          const e = eintraege.find((x) => x.id === id)
          e.gekauft = !e.gekauft
          setEintraege(eintraege)
        }

        function loeschen(id) {
          // TODO
        }

        return (
          <div>
            <input className="neu" value={text} onChange={(e) => setText(e.target.value)} />
            <button className="hinzufuegen" onClick={hinzufuegen}>Hinzufügen</button>
            <ul>
              {eintraege.map((e) => (
                <li key={e.id} className={e.gekauft ? 'gekauft' : ''}>
                  <span>{e.name}</span>
                  <button className="umschalten" onClick={() => umschalten(e.id)}>✓</button>
                  <button className="loeschen" onClick={() => loeschen(e.id)}>×</button>
                </li>
              ))}
            </ul>
          </div>
        )
      }
    tests:
      - name: zeigt die zwei Start-Einträge
        code: assertEqual(queryAll('li').length, 2)
      - name: fügt einen Eintrag hinzu und leert das Feld
        code: |
          await type('.neu', 'Käse')
          await click('.hinzufuegen')
          assertEqual(queryAll('li').length, 3)
          assertEqual(queryAll('li span')[2].textContent, 'Käse')
          assertEqual(query('.neu').value, '')
      - name: ignoriert leere Eingaben
        code: |
          await type('.neu', '   ')
          await click('.hinzufuegen')
          assertEqual(queryAll('li').length, 3)
      - name: hakt einen Eintrag ab und wieder auf
        code: |
          await click('li:nth-child(2) .umschalten')
          assertEqual(queryAll('li.gekauft').length, 1)
          assertTrue(query('li:nth-child(2)').classList.contains('gekauft'))
          await click('li:nth-child(2) .umschalten')
          assertEqual(queryAll('li.gekauft').length, 0)
      - name: löscht einen Eintrag
        code: |
          await click('li:nth-child(1) .loeschen')
          const namen = queryAll('li span').map((s) => s.textContent).join(',')
          assertEqual(namen, 'Milch,Käse')
    hints:
      - "Hinzufügen: `setEintraege([...eintraege, { id: naechsteId++, name: text.trim(), gekauft: false }])` – vorher mit `if (text.trim() === '') return` abbrechen."
      - "Umschalten: `eintraege.map((x) => x.id === id ? { ...x, gekauft: !x.gekauft } : x)`."
      - "Löschen: `eintraege.filter((x) => x.id !== id)`."
    solution: |
      let naechsteId = 3

      function App() {
        const [eintraege, setEintraege] = React.useState([
          { id: 1, name: 'Brot', gekauft: false },
          { id: 2, name: 'Milch', gekauft: false },
        ])
        const [text, setText] = React.useState('')

        function hinzufuegen() {
          const name = text.trim()
          if (name === '') return
          setEintraege([...eintraege, { id: naechsteId++, name, gekauft: false }])
          setText('')
        }

        function umschalten(id) {
          setEintraege(eintraege.map((x) => (x.id === id ? { ...x, gekauft: !x.gekauft } : x)))
        }

        function loeschen(id) {
          setEintraege(eintraege.filter((x) => x.id !== id))
        }

        return (
          <div>
            <input className="neu" value={text} onChange={(e) => setText(e.target.value)} />
            <button className="hinzufuegen" onClick={hinzufuegen}>Hinzufügen</button>
            <ul>
              {eintraege.map((e) => (
                <li key={e.id} className={e.gekauft ? 'gekauft' : ''}>
                  <span>{e.name}</span>
                  <button className="umschalten" onClick={() => umschalten(e.id)}>✓</button>
                  <button className="loeschen" onClick={() => loeschen(e.id)}>×</button>
                </li>
              ))}
            </ul>
          </div>
        )
      }
  - id: mutierend-oder-nicht
    type: dragdrop
    title: Verändert die Methode das Array?
    description: Ordne jede Array-Methode zu. Methoden, die das Original verändern, gehören nicht direkt auf State.
    targets:
      - { id: mutiert, label: "Verändert das Original – im State vermeiden" }
      - { id: neu, label: "Liefert ein neues Array – im State verwenden" }
    items:
      - { label: push, target: mutiert }
      - { label: splice, target: mutiert }
      - { label: sort, target: mutiert }
      - { label: reverse, target: mutiert }
      - { label: map, target: neu }
      - { label: filter, target: neu }
      - { label: "[...arr, x]", target: neu }
      - { label: toSorted, target: neu }
    hints:
      - "Faustregel: Alles, was „in“ das Array greift (einfügen, umsortieren, ausschneiden), verändert es. toSorted und toReversed sind die neuen, nicht verändernden Geschwister."
---
Dein Warenkorb ist ein Array im State. Du rufst `warenkorb.push(artikel)` auf, dann den Setter – und die
Anzeige bleibt gleich. In der Konsole siehst du den neuen Artikel im Array, auf dem Bildschirm nicht.
Der Grund: React erkennt Änderungen an **neuen** Objekten, nicht an veränderten.

## Warum React neue Objekte braucht

Ruft du einen Setter auf, vergleicht React den alten mit dem neuen Wert per `Object.is`. Bei Objekten und
Arrays prüft das nur, ob es **dieselbe** [[referenz|Referenz]] ist – nicht, ob der Inhalt gleich ist.

```jsx title="Mutation: React sieht nichts"
const [person, setPerson] = useState({ name: 'Ada', alter: 36 })

function geburtstag() {
  person.alter++          // Mutation: dasselbe Objekt
  setPerson(person)       // gleiche Referenz → kein Render
}
```

Deshalb behandelst du State als **schreibgeschützt**. Willst du etwas ändern, erzeugst du eine Kopie mit
der Änderung. Dieses Prinzip heißt [[immutabilitaet|Immutabilität]] (Unveränderlichkeit). Als Bonus
bleiben alte Schnappschüsse intakt – nützlich für „Rückgängig“ oder Vergleiche.

> [!MERKSATZ]
> Verändere State nie direkt. Erzeuge ein **neues** Objekt oder Array und übergib es dem Setter.

## Objekte kopieren mit Spread

Der [[spread-operator|Spread-Operator]] `...` kopiert alle Eigenschaften in ein neues Objekt. Danach
überschreibst du, was sich ändert.

```jsx title="Ein Feld ändern"
setPerson({ ...person, alter: person.alter + 1 })
```

Bei verschachtelten Objekten kopierst du **jede Ebene**, die sich ändert. Spread kopiert nur eine Ebene
tief – eine [[flache-kopie|flache Kopie]].

```jsx title="Verschachtelt ändern"
const [person, setPerson] = useState({
  name: 'Ada',
  adresse: { stadt: 'Köln', plz: '50667' },
})

setPerson({
  ...person,
  adresse: { ...person.adresse, stadt: 'Bonn' },
})
```

Ein praktisches Muster für Formulare: ein Handler für alle Felder über den Feldnamen.

```jsx title="Ein Handler für viele Felder"
function handleChange(e) {
  setPerson({ ...person, [e.target.name]: e.target.value })
}
```

## Arrays: map, filter und Spread

Für Arrays gibt es zu jeder Änderung eine Methode, die ein neues Array liefert:

| Vorhaben | Vermeiden (mutiert) | Verwenden (neues Array) |
|---|---|---|
| Hinzufügen | `push`, `unshift` | `[...arr, x]`, `[x, ...arr]` |
| Entfernen | `splice`, `pop` | `filter` |
| Ändern | `arr[i] = x` | `map` |
| Sortieren | `sort`, `reverse` | `toSorted`, `toReversed` |

```jsx title="Die drei häufigsten Updates"
// hinzufügen
setAufgaben([...aufgaben, { id: crypto.randomUUID(), titel, fertig: false }])

// entfernen
setAufgaben(aufgaben.filter((a) => a.id !== id))

// ein Element ändern
setAufgaben(aufgaben.map((a) => (a.id === id ? { ...a, fertig: !a.fertig } : a)))
```

> [!FEHLER]
> `const kopie = [...aufgaben]; kopie[0].fertig = true` verändert trotzdem den State: Das Array ist neu,
> aber die **Objekte darin** sind dieselben. Ändere Elemente mit `map` und `{ ...a, … }`.

## Nur speichern, was nötig ist

Unveränderliche Updates bleiben einfach, wenn der State schlank ist. Zwei Faustregeln aus der React-Doku:

- **Nichts doppelt speichern.** Statt eines zweiten States `ausgewaehlt` (eine Kopie des Objekts) speicherst
  du nur `ausgewaehltId` und suchst das Objekt beim Rendern.
- **Nichts speichern, was sich berechnen lässt.** `anzahlOffen` ist kein eigener State, sondern
  `aufgaben.filter((a) => !a.fertig).length` direkt beim Rendern.

```jsx title="Abgeleitete Werte beim Rendern"
const [aufgaben, setAufgaben] = useState([])
const offen = aufgaben.filter((a) => !a.fertig)     // kein extra State
```

Für sehr tief verschachtelte Daten gibt es die Bibliothek Immer, mit der du scheinbar „mutierend“
schreibst und trotzdem neue Objekte bekommst ([react.dev: Immer](https://react.dev/learn/updating-objects-in-state#write-concise-update-logic-with-immer)).

> [!PRAXIS]
> Code-Reviews in React-Projekten finden regelmäßig versteckte Mutationen – etwa `sort()` direkt auf einer
> Prop. Solche Fehler zeigen sich oft erst, wenn eine Liste „manchmal“ nicht aktualisiert.

## Zusammenfassung

- React erkennt Änderungen an einer **neuen Referenz** (`Object.is`), nicht an verändertem Inhalt.
- Objekte änderst du mit `{ ...alt, feld: neu }`, verschachtelt auf jeder betroffenen Ebene.
- Arrays: hinzufügen mit `[...arr, x]`, entfernen mit `filter`, ändern mit `map`, sortieren mit `toSorted`.
- `push`, `splice`, `sort` und Zuweisungen wie `arr[i] = x` verändern das Original – nicht auf State.
- Speichere keine doppelten oder berechenbaren Werte im State.
