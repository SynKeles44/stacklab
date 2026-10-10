---
title: JSX und Props
summary: Wie JSX funktioniert, wie du JavaScript in Markup einbettest und Daten über Props an Komponenten weitergibst.
duration: 20
sources:
  - title: react.dev – Writing Markup with JSX
    url: https://react.dev/learn/writing-markup-with-jsx
  - title: react.dev – JavaScript in JSX with Curly Braces
    url: https://react.dev/learn/javascript-in-jsx-with-curly-braces
  - title: react.dev – Passing Props to a Component
    url: https://react.dev/learn/passing-props-to-a-component
quiz:
  - type: single
    question: Welches Attribut schreibst du in JSX für eine CSS-Klasse?
    options: [class, className, cssClass, styleClass]
    answer: 1
    explanation: >
      JSX wird zu JavaScript, und `class` ist dort ein reserviertes Wort. Deshalb heißt das Attribut wie die
      DOM-Eigenschaft `className`. Analog wird aus `for` bei Labels `htmlFor`.
  - type: find-bug
    question: Diese Komponente lässt sich nicht kompilieren. In welcher Zeile steckt der Fehler?
    language: jsx
    code: |
      function Karte({ titel }) {
        return (
          <h2>{titel}</h2>
          <p>Mehr erfährst du unten.</p>
        )
      }
    bug_line: 4
    explanation: >
      Eine Komponente darf nur **ein** Wurzelelement zurückgeben. Ab Zeile 4 folgt ein zweites Element ohne
      gemeinsame Hülle. Lösung: beide in ein `<div>` oder ein Fragment `<>…</>` packen.
  - type: multiple
    question: Welche Aussagen über Props stimmen?
    options:
      - Props sind die Eingaben einer Komponente, vergleichbar mit Funktionsparametern.
      - Eine Komponente darf ihre Props verändern, z. B. props.name = 'Neu'.
      - Props können Strings, Zahlen, Arrays, Objekte, Funktionen und JSX sein.
      - Mit Destrukturierung kannst du Standardwerte setzen, z. B. { rolle = 'Gast' }.
    answers: [0, 2, 3]
    explanation: >
      Props sind schreibgeschützt – eine Komponente liest sie nur. Wenn sich etwas ändern soll, brauchst du
      State (nächstes Modul). Standardwerte setzt du direkt in der Destrukturierung.
  - type: cloze
    text: "JavaScript-Ausdrücke bettest du in JSX mit ___ ein. Inhalt zwischen öffnendem und schließendem Tag kommt in der Komponente als Prop ___ an."
    blanks:
      - ["{}", "geschweiften Klammern", "geschweifte Klammern", "{ }"]
      - [children]
    explanation: "`{ausdruck}` wechselt von JSX nach JavaScript. Verschachtelter Inhalt landet in `props.children`."
tasks:
  - id: profilkarten
    type: code
    language: jsx
    title: Profilkarten mit Props
    description: |
      Baue eine wiederverwendbare Komponente `Profilkarte` und verwende sie in `App` zweimal.

      1. `Profilkarte` bekommt die Props `name` und `rolle`. Fehlt `rolle`, soll **Gast** angezeigt werden.
      2. Sie rendert ein `<article className="karte">` mit einem `<h2>` für den Namen und einem
         `<p className="rolle">` für die Rolle.
      3. `App` rendert zwei Karten: **Ada** mit der Rolle **Entwicklerin** und **Linus** ohne Rolle.
    starter: |
      function Profilkarte(props) {
        // Lies name und rolle aus den Props und gib die Karte zurück
        return null
      }

      function App() {
        return (
          <section>
            {/* Zwei Profilkarten */}
          </section>
        )
      }
    tests:
      - name: rendert genau zwei Karten
        code: assertEqual(queryAll('article.karte').length, 2)
      - name: zeigt beide Namen in h2-Überschriften
        code: |
          const namen = queryAll('article.karte h2').map((h) => h.textContent)
          assertEqual(namen.join(','), 'Ada,Linus')
      - name: zeigt die übergebene Rolle
        code: assertEqual(queryAll('.rolle')[0].textContent, 'Entwicklerin')
      - name: nutzt Gast als Standardrolle
        code: assertEqual(queryAll('.rolle')[1].textContent, 'Gast')
    hints:
      - "Destrukturiere die Props direkt in der Parameterliste: `function Profilkarte({ name, rolle = 'Gast' })`."
      - "Werte bettest du mit geschweiften Klammern ein: `<h2>{name}</h2>`."
      - "In App: `<Profilkarte name=\"Ada\" rolle=\"Entwicklerin\" />` und `<Profilkarte name=\"Linus\" />`."
    solution: |
      function Profilkarte({ name, rolle = 'Gast' }) {
        return (
          <article className="karte">
            <h2>{name}</h2>
            <p className="rolle">{rolle}</p>
          </article>
        )
      }

      function App() {
        return (
          <section>
            <Profilkarte name="Ada" rolle="Entwicklerin" />
            <Profilkarte name="Linus" />
          </section>
        )
      }
  - id: html-zu-jsx
    type: dragdrop
    title: Aus HTML wird JSX
    description: Ordne jeder HTML-Schreibweise die korrekte JSX-Schreibweise zu.
    targets:
      - { id: classname, label: 'className="box"' }
      - { id: htmlfor, label: 'htmlFor="email"' }
      - { id: onclick, label: "onClick={handleClick}" }
      - { id: style, label: "style={{ color: 'red' }}" }
      - { id: selfclose, label: "<img src={bild} />" }
    items:
      - { label: 'class="box"', target: classname }
      - { label: 'for="email"', target: htmlfor }
      - { label: 'onclick="handleClick()"', target: onclick }
      - { label: 'style="color: red"', target: style }
      - { label: '<img src="bild.png">', target: selfclose }
    hints:
      - In JSX sind Attribute camelCase, style ist ein Objekt und jedes Tag muss geschlossen werden.
---
Du hast eine Komponente `Profilkarte` gebaut – und brauchst sie jetzt für 30 Teammitglieder, jedes mit
anderem Namen. 30 Kopien wären absurd. Du willst **eine** Komponente, der du sagst, *wen* sie anzeigen
soll. Genau dafür gibt es [[props|Props]]. Vorher schauen wir genauer auf das Markup selbst: [[jsx|JSX]].

## JSX: Markup in JavaScript

JSX sieht aus wie HTML, ist aber eine Syntax-Erweiterung von JavaScript. Ein Build-Werkzeug wie Vite
übersetzt jedes Tag in einen Funktionsaufruf, der ein Objekt beschreibt („hier soll ein h1 mit diesem
Text stehen“).

```jsx title="Aus JSX wird JavaScript"
const element = <h1 className="titel">Hallo</h1>
// wird ungefähr zu:
const element2 = React.createElement('h1', { className: 'titel' }, 'Hallo')
```

Weil JSX JavaScript ist, gelten strengere Regeln als in HTML:

| Regel | Beispiel |
|---|---|
| Genau **ein** Wurzelelement pro `return` | `<div>…</div>` oder Fragment `<>…</>` |
| Jedes Tag wird geschlossen | `<img />`, `<br />`, `<input />` |
| Attribute in camelCase | `className`, `htmlFor`, `onClick`, `tabIndex` |
| `style` ist ein Objekt | `style={{ fontSize: 20 }}` |

Das leere Tag `<>…</>` heißt [[react-fragment|Fragment]]: Es gruppiert Elemente, ohne ein zusätzliches
`div` in den DOM zu schreiben.

## Geschweifte Klammern: das Fenster zu JavaScript

Mit `{…}` wechselst du mitten im JSX zurück nach JavaScript. Hinein darf jeder **Ausdruck** – also alles,
was einen Wert ergibt.

```jsx title="Ausdrücke in JSX"
const nutzer = { name: 'Ada', punkte: 41 }

function Anzeige() {
  return (
    <p title={nutzer.name}>
      {nutzer.name} hat {nutzer.punkte + 1} Punkte – Stand {new Date().getFullYear()}
    </p>
  )
}
```

- Erlaubt: Variablen, Rechnungen, Funktionsaufrufe, [[ternaerer-operator|ternäre Operatoren]].
- Nicht erlaubt: Anweisungen wie `if` oder `for` direkt im JSX. Die schreibst du **vor** dem `return`.
- `style={{ … }}` sind keine Spezialklammern: außen „JavaScript beginnt“, innen ein Objekt.

> [!FEHLER]
> `<p>Hallo {nutzer}</p>` mit einem Objekt wirft „Objects are not valid as a React child“. React kann
> Strings, Zahlen und JSX anzeigen – bei einem Objekt musst du sagen, welche Eigenschaft gemeint ist.

## Props: Eingaben für Komponenten

[[props|Props]] (kurz für *properties*) sind für Komponenten, was [[parameter]] für Funktionen sind. Du
übergibst sie wie Attribute, die Komponente bekommt sie als **ein** Objekt.

```jsx title="Props übergeben und lesen"
function Profilkarte({ name, rolle = 'Gast' }) {
  return (
    <article className="karte">
      <h2>{name}</h2>
      <p>{rolle}</p>
    </article>
  )
}

function Team() {
  return (
    <>
      <Profilkarte name="Ada" rolle="Entwicklerin" />
      <Profilkarte name="Linus" />
    </>
  )
}
```

Die [[destrukturierung|Destrukturierung]] `{ name, rolle = 'Gast' }` holt die Werte aus dem Props-Objekt
und setzt gleich einen Standardwert. Strings übergibst du in Anführungszeichen, alles andere in
geschweiften Klammern: `alter={36}`, `aktiv={true}`, `tags={['a', 'b']}`.

> [!MERKSATZ]
> Props fließen von oben nach unten und sind **schreibgeschützt**. Eine Komponente liest ihre Props, sie
> ändert sie nie.

## children: Komponenten als Hülle

Alles, was du **zwischen** öffnendes und schließendes Tag schreibst, kommt als Prop
[[children-prop|children]] an. So baust du Rahmen-Komponenten, die beliebigen Inhalt umschließen.

```jsx title="Eine Karte als Hülle"
function Rahmen({ titel, children }) {
  return (
    <section className="rahmen">
      <h2>{titel}</h2>
      {children}
    </section>
  )
}

<Rahmen titel="Hinweis">
  <p>Morgen ist Wartung.</p>
</Rahmen>
```

Mit TypeScript beschreibst du die Props als Typ, z. B. `type Props = { titel: string; children: React.ReactNode }`.
So meldet der Editor sofort, wenn eine Prop fehlt.

> [!PRAXIS]
> In Teamprojekten gibt es fast immer eine Sammlung solcher Hüllen: `Card`, `Dialog`, `Layout`. Sie legen
> Abstände und Rahmen fest, der Inhalt kommt per `children` – so sieht die ganze App einheitlich aus.

## Zusammenfassung

- JSX ist JavaScript-Syntax für Markup und wird zu Funktionsaufrufen übersetzt.
- Ein `return` hat genau ein Wurzelelement; Fragments `<>…</>` gruppieren ohne Extra-`div`.
- Attribute sind camelCase (`className`, `htmlFor`, `onClick`), `style` ist ein Objekt.
- `{…}` bettet JavaScript-Ausdrücke ein – keine Anweisungen wie `if`.
- Props sind die schreibgeschützten Eingaben einer Komponente; Standardwerte per Destrukturierung.
- `children` enthält den Inhalt zwischen den Tags.
