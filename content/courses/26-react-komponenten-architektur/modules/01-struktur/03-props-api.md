---
title: Die Props-API einer Komponente
summary: Wie Bibliothekskomponenten alle HTML-Attribute durchreichen, Klassen zusammenführen, sich mit data-slot kennzeichnen und in React 19 Refs als normale Prop annehmen.
duration: 25
sources:
  - title: react.dev – Passing Props to a Component
    url: https://react.dev/learn/passing-props-to-a-component
  - title: react.dev – ref as a prop (React 19)
    url: https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop
  - title: React TypeScript Cheatsheet – ComponentProps
    url: https://react-typescript-cheatsheet.netlify.app/docs/react-types/componentprops/
  - title: shadcn/ui – Button (Quellcode-Aufbau mit data-slot)
    url: https://ui.shadcn.com/docs/components/button
quiz:
  - type: single
    question: Was bewirkt der Typ `React.ComponentProps<'button'>` an den Props einer eigenen Button-Komponente?
    options:
      - Die Komponente akzeptiert nur noch `onClick` und `children`.
      - Die Komponente akzeptiert alle Attribute, die ein echtes `<button>` versteht – mit korrekten Typen.
      - Die Komponente wird automatisch zu einem Link.
    answer: 1
    explanation: >
      ComponentProps liefert den Prop-Typ des HTML-Elements. Damit sind `type`, `disabled`, `aria-*`,
      `onClick` und alle anderen Attribute erlaubt und geprüft – inklusive `ref` in React 19.
  - type: find-bug
    question: Der Aufruf `<Button className="w-full">Senden</Button>` ergibt einen Button **ohne** die Basisklassen. In welcher Zeile steckt der Fehler?
    language: tsx
    code: |
      function Button(props: React.ComponentProps<'button'>) {
        return (
          <button
            data-slot="button"
            className="rounded px-4 py-2"
            {...props}
          />
        )
      }
    bug_line: 6
    explanation: >
      `{...props}` steht nach `className` und überschreibt sie mit `"w-full"`. Richtig ist, `className` aus den
      Props herauszuholen und zusammenzuführen: `className={cn('rounded px-4 py-2', className)}`.
  - type: multiple
    question: Welche Aussagen über Refs in React 19 stimmen?
    options:
      - Funktionskomponenten bekommen `ref` als ganz normale Prop.
      - Für neue Komponenten brauchst du `forwardRef` nicht mehr.
      - Mit `{...props}` wird ein übergebener `ref` an das innere Element weitergereicht.
      - Refs funktionieren nur noch in Klassenkomponenten.
    answers: [0, 1, 2]
    explanation: >
      Seit React 19 ist `ref` eine gewöhnliche Prop für Funktionskomponenten. `forwardRef` funktioniert noch,
      wird aber für neuen Code nicht mehr gebraucht.
  - type: cloze
    text: "Das Attribut `data-___=\"button\"` kennzeichnet, welcher Baustein ein DOM-Element ist. Eigene Attribute mit diesem Präfix heißen ___-Attribute."
    blanks:
      - [slot]
      - [data, Data]
    explanation: data-slot ist eine Konvention aus shadcn/ui. Eltern-Komponenten und CSS können damit gezielt Bausteine ansprechen.
tasks:
  - id: eingabe-durchreichen
    type: code
    language: tsx
    title: Ein Input, das alles durchreicht
    description: |
      Baue die Bibliothekskomponente `Input`.

      1. Sie nimmt alle Props eines `<input>` entgegen (`React.ComponentProps<'input'>`).
      2. Sie rendert ein `<input>` mit `data-slot="input"`.
      3. Die Klasse `eingabe` ist immer gesetzt; eine übergebene `className` wird **dahinter angehängt**
         (`"eingabe breit"`), ohne doppelte Leerzeichen, wenn keine übergeben wird.
      4. Alle übrigen Props – auch `ref` – landen am `<input>`.

      `App` ist schon fertig: Sie übergibt eine Klasse, einen Platzhalter, ein `aria-label` und einen Ref.
      Ein Klick auf „Fokus“ soll das Eingabefeld fokussieren.
    starter: |
      function Input() {
        return <input className="eingabe" />
      }

      function App() {
        const ref = React.useRef<HTMLInputElement>(null)
        return (
          <div>
            <Input className="breit" placeholder="Name" aria-label="Name" ref={ref} />
            <Input placeholder="Ohne Klasse" />
            <button className="fokus" onClick={() => ref.current?.focus()}>Fokus</button>
          </div>
        )
      }
    tests:
      - name: setzt data-slot und führt Klassen zusammen
        code: |
          const input = queryAll('input')[0]
          assertEqual(input.getAttribute('data-slot'), 'input')
          assertEqual(input.className, 'eingabe breit')
      - name: ohne className bleibt nur die Basisklasse
        code: |
          assertEqual(queryAll('input')[1].className, 'eingabe')
      - name: reicht Attribute durch
        code: |
          const input = queryAll('input')[0]
          assertEqual(input.getAttribute('placeholder'), 'Name')
          assertEqual(input.getAttribute('aria-label'), 'Name')
      - name: reicht den Ref durch
        code: |
          await click('.fokus')
          assertTrue(document.activeElement === queryAll('input')[0], 'Das erste Eingabefeld sollte fokussiert sein.')
    hints:
      - "Hol `className` aus den Props heraus: `function Input({ className, ...props }: React.ComponentProps<'input'>)`."
      - "Klassen zusammenführen ohne Extra-Leerzeichen: `['eingabe', className].filter(Boolean).join(' ')`."
      - "`{...props}` reicht auch `ref` weiter – in React 19 ist ref eine normale Prop."
    solution: |
      function Input({ className, ...props }: React.ComponentProps<'input'>) {
        return (
          <input
            data-slot="input"
            className={['eingabe', className].filter(Boolean).join(' ')}
            {...props}
          />
        )
      }

      function App() {
        const ref = React.useRef<HTMLInputElement>(null)
        return (
          <div>
            <Input className="breit" placeholder="Name" aria-label="Name" ref={ref} />
            <Input placeholder="Ohne Klasse" />
            <button className="fokus" onClick={() => ref.current?.focus()}>Fokus</button>
          </div>
        )
      }
  - id: reihenfolge-der-props
    type: steps
    title: Wer gewinnt?
    description: In JSX gilt bei gleichen Attributen das zuletzt geschriebene. Sag voraus, was im DOM landet.
    steps:
      - situation: "`function Button(props) { return <button type=\"button\" {...props} /> }` – aufgerufen als `<Button type=\"submit\">Senden</Button>`."
        question: Welchen type hat der gerenderte Button?
        options: [button, submit, Beide]
        answer: 1
        explanation: "`{...props}` steht hinten und überschreibt den Standardwert. So ist `type=\"button\"` ein sinnvoller Standard, den Aufrufer ändern können."
      - situation: "Jetzt steht es andersherum: `<button {...props} type=\"button\" />` – aufgerufen mit `type=\"submit\"`."
        question: Welchen type hat der Button jetzt?
        options: [button, submit]
        answer: 0
        explanation: Was nach dem Spread steht, ist fest verdrahtet. Das ist nur sinnvoll, wenn Aufrufer den Wert wirklich nie ändern dürfen.
      - situation: "`<button className=\"basis\" {...props} />` – aufgerufen mit `className=\"gross\"`."
        question: Welche Klasse hat der Button?
        options: ["basis gross", gross, basis]
        answer: 1
        explanation: Auch className wird einfach überschrieben, nicht zusammengeführt. Deshalb holst du className heraus und führst die Klassen selbst zusammen.
---
Dein `Button` aus der Bibliothek funktioniert – bis jemand `disabled`, `aria-label` oder einen `ref`
übergeben will. Plötzlich passiert nichts, weil deine Komponente nur `children` und `onClick` kennt. Eine
gute Bibliothekskomponente verhält sich wie das HTML-Element, das sie umhüllt – nur schöner.

## Alle HTML-Attribute annehmen

Mit [[typescript|TypeScript]] beschreibst du die Props in einem Satz: „Alles, was ein `<button>` kann.“

```tsx
function Button(props: React.ComponentProps<'button'>) {
  return <button {...props} />
}
```

`React.ComponentProps<'button'>` enthält `type`, `disabled`, `onClick`, alle `aria-*`-Attribute,
`children` und mehr – jeweils mit dem richtigen Typ. Eigene Props ergänzt du per `&`:

```tsx
type ButtonProps = React.ComponentProps<'button'> & {
  variant?: 'primary' | 'ghost'
}
```

Der [[spread-operator|Spread-Operator]] `{...props}` reicht alles an das echte Element weiter. Dieses
Muster heißt [[prop-spreading|Prop-Spreading]].

> [!MERKSATZ]
> Eine Bibliothekskomponente nimmt **alle** Attribute ihres HTML-Elements an und reicht sie durch. So
> muss niemand auf die Bibliothek warten, nur weil ein Attribut fehlt.

## className zusammenführen

Beim Spreading gilt: Was in JSX **später** steht, gewinnt. Ein mitgegebenes `className` würde deine
Basisklassen also komplett ersetzen. Deshalb holst du `className` per
[[destrukturierung|Destrukturierung]] heraus und hängst es an:

```tsx
function Button({ className, ...props }: React.ComponentProps<'button'>) {
  return (
    <button
      className={['rounded px-4 py-2', className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}
```

`filter(Boolean)` wirft `undefined` heraus, damit kein überflüssiges Leerzeichen entsteht. In Modul 3
ersetzt du diese Zeile durch die Hilfsfunktion `cn()`, die auch widersprüchliche Tailwind-Klassen
auflöst.

> [!FEHLER]
> **`className` vor `{...props}` schreiben und hoffen.** Der Aufrufer überschreibt damit alle
> Basisklassen. Hol `className` immer heraus und führe sie zusammen.

## data-slot: Bausteine kennzeichnen

shadcn/ui setzt an jedem Baustein ein [[data-attribut|Data-Attribut]] `data-slot`:

```tsx
<button data-slot="button" … />
<div data-slot="card-header" … />
```

Ein [[data-slot]] verrät, **welcher Baustein** ein Element ist – unabhängig von Klassen. Das nutzt du an
drei Stellen:

| Wer | Beispiel |
|---|---|
| CSS / Tailwind | Eine Card gibt allen `[data-slot=button]` darin einen Abstand |
| Tests | `container.querySelector('[data-slot=card-title]')` |
| DevTools | Du erkennst im DOM sofort, welche Komponente was gerendert hat |

Data-Attribute sind gültiges HTML und beeinflussen weder Aussehen noch Barrierefreiheit.

## Refs als normale Prop in React 19

Manchmal braucht der Aufrufer das echte DOM-Element, zum Beispiel um ein Feld zu fokussieren. Dafür
gibt es [[react-ref|Refs]] über `useRef`. Früher musstest du deine Komponente dafür in `forwardRef`
einwickeln. Seit React 19 ist `ref` für Funktionskomponenten eine **ganz normale Prop**:

```tsx
function Input(props: React.ComponentProps<'input'>) {
  return <input data-slot="input" {...props} />
}

// Aufruf
const feld = useRef<HTMLInputElement>(null)
<Input ref={feld} />
```

Weil `ref` in `props` steckt, landet er mit `{...props}` automatisch am `<input>`. Diese
[[ref-weiterleitung|Ref-Weiterleitung]] kostet dich also keine Zeile mehr.

> [!PRAXIS]
> In bestehenden Codebasen findest du noch viele `forwardRef`-Komponenten. Sie funktionieren weiter.
> Beim nächsten Umbau ersetzt du sie durch die einfache Form – shadcn/ui hat das in seinen Vorlagen
> bereits getan.

## Namen, die jeder sofort versteht

Neben den HTML-Attributen bekommt eine Bibliothekskomponente meist ein paar **eigene** [[props|Props]].
Für deren Namen haben sich Konventionen durchgesetzt. Wer sie einhält, macht die Bibliothek ohne Doku
bedienbar:

| Zweck | Name | Nicht so |
|---|---|---|
| Aussehen aus fester Liste | `variant`, `size` | `type="primary"` (kollidiert mit HTML) |
| Ja/Nein-Zustand | `disabled`, `open` | `isDisabled`, `showMenu` |
| Inhalt | `children` | `text`, `label` für freien Inhalt |
| Änderung melden | `onValueChange`, `onOpenChange` | `handleChange`, `callback` |

Zwei Regeln dazu: Überschreibe nie ein HTML-Attribut mit anderer Bedeutung (ein eigenes `type` am Button
würde `type="submit"` unmöglich machen). Und gib eigenen Props sinnvolle **Standardwerte**, damit
`<Button>Speichern</Button>` ohne weitere Angaben gut aussieht.

## Zusammenfassung

- `React.ComponentProps<'button'>` beschreibt alle Props eines HTML-Elements.
- `{...props}` reicht sie durch (**Prop-Spreading**); später Geschriebenes gewinnt.
- `className` holst du heraus und führst sie mit den Basisklassen zusammen.
- `data-slot` kennzeichnet Bausteine für CSS, Tests und DevTools.
- In React 19 ist `ref` eine normale Prop – `forwardRef` brauchst du für neuen Code nicht.
- Eigene Props folgen Konventionen: `variant`, `size`, `disabled`, `onValueChange` – mit sinnvollen Standardwerten.
