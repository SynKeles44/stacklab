---
title: Listen, Keys und bedingtes Rendern
summary: Wie du Arrays mit map() als Listen renderst, warum jeder Eintrag einen stabilen key braucht und wie du Inhalte bedingt anzeigst.
duration: 20
sources:
  - title: react.dev – Rendering Lists
    url: https://react.dev/learn/rendering-lists
  - title: react.dev – Conditional Rendering
    url: https://react.dev/learn/conditional-rendering
  - title: react.dev – Keeping Components Pure
    url: https://react.dev/learn/keeping-components-pure
quiz:
  - type: single
    question: Welcher Wert eignet sich am besten als key für Einträge aus einer Datenbank?
    options:
      - Der Index aus map((eintrag, index) => …)
      - Math.random()
      - Die id des Datensatzes
      - Der angezeigte Text, auch wenn er doppelt vorkommen kann
    answer: 2
    explanation: >
      Ein key muss unter Geschwistern eindeutig und über die Zeit stabil sein. Eine Datenbank-id erfüllt beides.
      Math.random() ändert sich bei jedem Rendern, der Index verschiebt sich beim Einfügen oder Sortieren.
  - type: find-bug
    question: React meldet in der Konsole „Each child in a list should have a unique key prop“. In welcher Zeile fehlt etwas?
    language: jsx
    code: |
      function Liste({ aufgaben }) {
        return (
          <ul>
            {aufgaben.map((a) => (
              <li>{a.titel}</li>
            ))}
          </ul>
        )
      }
    bug_line: 5
    explanation: Das Element, das map() zurückgibt, braucht den key – also `<li key={a.id}>`.
  - type: single
    question: "Was zeigt `{anzahl && <p>Neue Nachrichten</p>}`, wenn anzahl gleich 0 ist?"
    options:
      - Nichts
      - Eine 0 auf der Seite
      - Den Text „Neue Nachrichten“
      - Einen Fehler
    answer: 1
    explanation: >
      `0 && …` ergibt 0, und React rendert die Zahl 0 sichtbar. Schreibe `{anzahl > 0 && …}`, damit links
      ein echter Boolean steht.
  - type: match
    question: Ordne jedem Muster seinen Einsatzzweck zu.
    pairs:
      - { left: "if (…) return …", right: "Ganz andere Ausgabe für einen Sonderfall" }
      - { left: "bedingung ? <A /> : <B />", right: "Eins von zwei Elementen anzeigen" }
      - { left: "bedingung && <A />", right: "Element anzeigen oder gar nichts" }
      - { left: "liste.filter(…).map(…)", right: "Nur passende Einträge als Liste rendern" }
    explanation: Alle vier Muster sind normales JavaScript – React erfindet für Bedingungen und Schleifen keine eigene Syntax.
tasks:
  - id: obstliste-filtern
    type: code
    language: jsx
    title: Eine filterbare Liste mit Keys
    description: |
      Rendere die Obstliste und filtere sie über ein Suchfeld. Der State für den Suchbegriff ist schon
      vorbereitet – um State geht es ausführlich im nächsten Modul.

      1. Filtere `obst` so, dass nur Einträge übrig bleiben, deren `name` den Suchbegriff enthält
         (Groß-/Kleinschreibung egal).
      2. Rendere die Treffer als `<li>` in der `<ul>` und gib jedem Eintrag seine `id` als `key`.
      3. Gibt es keine Treffer, rendere statt der Liste `<p className="leer">Keine Treffer</p>`.
    starter: |
      const obst = [
        { id: 1, name: 'Apfel' },
        { id: 2, name: 'Banane' },
        { id: 3, name: 'Aprikose' },
        { id: 4, name: 'Kirsche' },
      ]

      function App() {
        const [suche, setSuche] = React.useState('')
        const treffer = obst // TODO: filtern

        return (
          <div>
            <input value={suche} onChange={(e) => setSuche(e.target.value)} />
            <ul>
              {/* TODO: Treffer als li mit key rendern */}
            </ul>
          </div>
        )
      }
    tests:
      - name: zeigt zu Beginn alle vier Sorten
        code: |
          assertEqual(queryAll('li').length, 4)
          assertEqual(queryAll('li')[0].textContent, 'Apfel')
      - name: filtert ohne Rücksicht auf Groß-/Kleinschreibung
        code: |
          await type('input', 'AP')
          const namen = queryAll('li').map((li) => li.textContent).join(',')
          assertEqual(namen, 'Apfel,Aprikose')
      - name: zeigt einen Hinweis statt einer leeren Liste
        code: |
          await type('input', 'xyz')
          assertEqual(queryAll('li').length, 0)
          assertEqual(query('p.leer') && query('p.leer').textContent, 'Keine Treffer')
      - name: zeigt nach dem Leeren wieder alles und keinen Hinweis
        code: |
          await type('input', '')
          assertEqual(queryAll('li').length, 4)
          assertEqual(query('p.leer'), null)
    hints:
      - "Filtern: `obst.filter((o) => o.name.toLowerCase().includes(suche.toLowerCase()))`."
      - "Rendern: `treffer.map((o) => <li key={o.id}>{o.name}</li>)`."
      - "Für den Hinweis eignet sich ein ternärer Operator: `{treffer.length === 0 ? <p className=\"leer\">…</p> : <ul>…</ul>}`."
    solution: |
      const obst = [
        { id: 1, name: 'Apfel' },
        { id: 2, name: 'Banane' },
        { id: 3, name: 'Aprikose' },
        { id: 4, name: 'Kirsche' },
      ]

      function App() {
        const [suche, setSuche] = React.useState('')
        const treffer = obst.filter((o) => o.name.toLowerCase().includes(suche.toLowerCase()))

        return (
          <div>
            <input value={suche} onChange={(e) => setSuche(e.target.value)} />
            {treffer.length === 0 ? (
              <p className="leer">Keine Treffer</p>
            ) : (
              <ul>
                {treffer.map((o) => (
                  <li key={o.id}>{o.name}</li>
                ))}
              </ul>
            )}
          </div>
        )
      }
  - id: index-als-key
    type: steps
    title: Was passiert mit dem Index als key?
    description: Spiel durch, was React macht, wenn eine Liste den Index als key benutzt.
    steps:
      - situation: >
          Eine Liste rendert `aufgaben.map((a, i) => <li key={i}><input defaultValue={a.titel} /></li>)`.
          Sie zeigt „Einkaufen“ (key 0) und „Sport“ (key 1). Du tippst im zweiten Feld „ am Abend“ dazu.
        question: Jetzt wird oben eine neue Aufgabe „Lesen“ eingefügt. Welchen key bekommt sie?
        options: [Den key 0, Den key 2, Einen zufälligen key]
        answer: 0
        explanation: Der Index der ersten Position ist 0 – die neue Aufgabe übernimmt den key, den vorher „Einkaufen“ hatte.
      - situation: React vergleicht die alte und die neue Liste anhand der keys.
        question: Was denkt React über die Elemente mit key 0 und key 1?
        options:
          - Es sind neue Elemente, die komplett neu angelegt werden.
          - Es sind dieselben Elemente wie vorher, nur mit neuen Props.
        answer: 1
        explanation: Gleicher key heißt für React „gleiches Element“. Es behält die DOM-Knoten und deren internen Zustand.
      - situation: Das Eingabefeld mit key 1 enthielt deinen getippten Text „Sport am Abend“.
        question: Wo steht dein getippter Text nach dem Einfügen?
        options:
          - Weiterhin bei „Sport“, jetzt an Position 3
          - Im Feld an Position 2, das jetzt zu „Einkaufen“ gehört
        answer: 1
        explanation: >
          Der DOM-Knoten mit key 1 wurde wiederverwendet – samt Eingabe. Dein Text hängt jetzt an der falschen
          Aufgabe. Mit `key={a.id}` wandert jedes Feld mit seinem Datensatz.
---
Deine App lädt 50 Bestellungen aus einer [[api|API]]. Du willst nicht 50 Mal `<li>` schreiben, und wenn die
Liste leer ist, soll ein Hinweis erscheinen statt einer leeren Fläche. React hat dafür keine eigene
Schleifen- oder Bedingungssyntax – du benutzt einfach JavaScript.

## Listen mit map() rendern

Ein [[array|Array]] von Daten wird mit `map()` zu einem Array von JSX-Elementen. React kann Arrays direkt
anzeigen.

```jsx title="Daten zu Elementen"
const aufgaben = [
  { id: 'a1', titel: 'Einkaufen', erledigt: false },
  { id: 'a2', titel: 'Sport', erledigt: true },
]

function Aufgabenliste() {
  return (
    <ul>
      {aufgaben.map((a) => (
        <li key={a.id}>{a.titel}</li>
      ))}
    </ul>
  )
}
```

Willst du nur einen Teil zeigen, kombinierst du `filter()` und `map()`:

```jsx title="Nur offene Aufgaben"
const offen = aufgaben.filter((a) => !a.erledigt)
return <ul>{offen.map((a) => <li key={a.id}>{a.titel}</li>)}</ul>
```

Achte bei Pfeilfunktionen mit geschweiften Klammern auf das `return`: `map((a) => { <li>…</li> })` gibt
`undefined` zurück und rendert nichts.

## Keys: der Ausweis jedes Eintrags

Jedes Element in einer Liste braucht ein [[key-prop|key]]. React nutzt es, um beim nächsten Rendern zu
erkennen, welcher Eintrag welcher ist – auch wenn sich die Reihenfolge ändert, etwas eingefügt oder
gelöscht wurde. Dieser Vergleich zwischen altem und neuem Ergebnis heißt [[reconciliation|Reconciliation]].

| key | Bewertung |
|---|---|
| `id` aus der Datenbank | ideal: eindeutig und stabil |
| `crypto.randomUUID()` beim **Anlegen** der Daten gespeichert | gut |
| Index aus `map((x, i) => …)` | nur, wenn die Liste sich nie umsortiert |
| `Math.random()` beim Rendern | falsch: jedes Rendern ein neuer key |

> [!FEHLER]
> `key={index}` wirkt harmlos, bis jemand sortiert oder oben einfügt. Dann „wandern“ Eingaben und Zustände
> zum falschen Eintrag, weil React die Elemente am key wiedererkennt, nicht am Inhalt.

> [!MERKSATZ]
> Der key gehört an das äußerste Element, das `map()` zurückgibt. Er muss unter Geschwistern eindeutig und
> über die Zeit stabil sein.

## Bedingt rendern

Für Bedingungen nutzt du die Werkzeuge aus JavaScript:

```jsx title="Drei Muster"
function Postfach({ nachrichten, laedt }) {
  if (laedt) {
    return <p>Lädt …</p>          // 1. früher Ausstieg
  }

  return (
    <section>
      {nachrichten.length > 0 && <p>{nachrichten.length} neu</p>}   {/* 2. && */}
      {nachrichten.length === 0
        ? <p>Alles gelesen.</p>                                      // 3. ternär
        : <ul>{nachrichten.map((n) => <li key={n.id}>{n.betreff}</li>)}</ul>}
    </section>
  )
}
```

- `if` mit eigenem `return`: für komplett andere Ausgaben (Laden, Fehler).
- `bedingung && <A />`: zeigt A oder nichts.
- `bedingung ? <A /> : <B />`: zeigt eins von beiden.
- `return null` lässt eine Komponente gar nichts rendern.

> [!ACHTUNG]
> Links von `&&` muss ein echter [[boolean|Boolean]] stehen. `{liste.length && …}` zeigt bei leerer Liste
> eine sichtbare **0**. Schreibe `liste.length > 0 && …`.

## Komponenten bleiben rein

Beim Rendern ruft React deine Komponente auf – möglicherweise öfter, als du denkst. Deshalb soll eine
Komponente wie eine [[reine-funktion|reine Funktion]] arbeiten: Gleiche Props ergeben gleiches JSX, und
beim Rendern wird nichts außerhalb verändert.

```jsx title="Unrein: verändert eine äußere Variable"
let zaehler = 0
function Eintrag() {
  zaehler++                 // Seiteneffekt beim Rendern!
  return <li>Nr. {zaehler}</li>
}
```

Im StrictMode ruft React Komponenten in der Entwicklung doppelt auf – solche Fehler fallen dann sofort auf.
Sortieren oder Filtern mit `filter`, `map`, `toSorted` ist in Ordnung, weil dabei neue Arrays entstehen.

> [!PRAXIS]
> Tabellen und Listen sind in Business-Anwendungen überall: Bestellungen, Nutzer, Tickets. Die Kombination
> aus `filter`, `map`, stabilem key und einer „Keine Einträge“-Meldung schreibst du dort täglich.

## Zusammenfassung

- Listen renderst du mit `array.map()`, Teilmengen mit `filter()` davor.
- Jedes Listenelement braucht ein **eindeutiges, stabiles** `key` – am besten eine id.
- Der Index als key führt beim Einfügen oder Sortieren zu vertauschten Zuständen.
- Bedingungen: frühes `return`, `&&` oder der ternäre Operator; `null` rendert nichts.
- Links von `&&` gehört ein Boolean, sonst erscheint eine 0.
- Komponenten sind beim Rendern rein und verändern nichts außerhalb.
