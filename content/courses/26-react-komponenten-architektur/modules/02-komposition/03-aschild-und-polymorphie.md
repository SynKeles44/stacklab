---
title: asChild – Aussehen auf ein anderes Element übertragen
summary: Wie ein Button wie ein Button aussieht, aber als Link gerendert wird – mit der as-Prop oder dem asChild-Muster samt Slot.
duration: 20
sources:
  - title: Radix UI – Composition (asChild)
    url: https://www.radix-ui.com/primitives/docs/guides/composition
  - title: react.dev – cloneElement
    url: https://react.dev/reference/react/cloneElement
  - title: shadcn/ui – Button (Link-Beispiel mit asChild)
    url: https://ui.shadcn.com/docs/components/button
  - title: Base UI – Composition (render-Prop)
    url: https://base-ui.com/react/handbook/composition
quiz:
  - type: single
    question: Warum ist `<Button><a href="/kasse">Zur Kasse</a></Button>` problematisch?
    options:
      - Ein Link darf keinen Text enthalten.
      - Es entsteht ein Link innerhalb eines `<button>` – zwei verschachtelte interaktive Elemente sind ungültiges HTML und verwirren Tastatur und Screenreader.
      - React verbietet `<a>` in Komponenten.
    answer: 1
    explanation: >
      Interaktive Elemente dürfen nicht ineinander stecken. Welches Element reagiert auf Enter? Was liest der
      Screenreader vor? Richtig ist ein einziges `<a>`, das wie ein Button aussieht.
  - type: multiple
    question: Was macht `<Button asChild><a href="/kasse">Zur Kasse</a></Button>`?
    options:
      - Es rendert ein einziges `<a>`-Element.
      - Das `<a>` bekommt die Klassen und das `data-slot` des Buttons.
      - Es rendert ein `<button>` und darin ein `<a>`.
      - Das `href` des Links bleibt erhalten.
    answers: [0, 1, 3]
    explanation: >
      Mit asChild rendert der Button kein eigenes Element. Er überträgt seine Props auf das einzige Kind – das
      `<a>` behält dabei seine eigenen Attribute.
  - type: cloze
    text: "Die Hilfskomponente, die ihre Props auf ihr einziges Kind überträgt, heißt ___. Intern nutzt sie `React.___Element()`."
    blanks:
      - [Slot]
      - [clone]
    explanation: Der Slot kopiert das Kind-Element mit `cloneElement` und mischt dabei seine eigenen Props hinein.
  - type: match
    question: Ordne jeder Technik ihre typische Bibliothek bzw. Schreibweise zu.
    pairs:
      - { left: "asChild", right: "Radix UI und shadcn/ui" }
      - { left: "render-Prop", right: "Base UI" }
      - { left: "as-Prop", right: "<Button as=\"a\" href=\"…\">" }
    explanation: Alle drei lösen dasselbe Problem – Verhalten und Aussehen einer Komponente auf ein anderes Element zu übertragen.
tasks:
  - id: slot-bauen
    type: code
    language: tsx
    title: Slot und Button mit asChild
    description: |
      Baue einen vereinfachten `Slot` und nutze ihn im `Button`.

      1. `Slot` nimmt beliebige Props und genau ein Kind-Element. Er gibt
         `React.cloneElement(kind, gemischteProps)` zurück. Dabei gilt:
         - Props des Slots und des Kindes werden zusammengeführt, **Props des Kindes gewinnen**.
         - `className` wird **verbunden**: zuerst die des Slots, dann die des Kindes, mit Leerzeichen.
         - Ist `children` kein gültiges Element (`React.isValidElement`), gibt der Slot `null` zurück.
      2. `Button` bekommt die Prop `asChild`. Ist sie gesetzt, rendert er `Slot`, sonst ein `<button>`.
         Beide bekommen `data-slot="button"` und die Klasse `btn` (plus übergebene `className`).

      `App` ist fertig: ein normaler Button und ein Link, der wie ein Button aussieht.
    starter: |
      function Slot({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) {
        return <>{children}</>
      }

      type ButtonProps = React.ComponentProps<'button'> & { asChild?: boolean }

      function Button({ asChild = false, className, ...props }: ButtonProps) {
        return <button data-slot="button" className={['btn', className].filter(Boolean).join(' ')} {...props} />
      }

      function App() {
        return (
          <div>
            <Button type="button" className="gross">Speichern</Button>
            <Button asChild className="breit">
              <a href="/kasse" className="link">Zur Kasse</a>
            </Button>
          </div>
        )
      }
    tests:
      - name: der normale Button bleibt ein button
        code: |
          const btn = query('button')
          assertTrue(btn !== null, 'Der erste Button fehlt.')
          assertEqual(btn.className, 'btn gross')
      - name: asChild rendert genau ein a ohne button drumherum
        code: |
          assertEqual(queryAll('button').length, 1)
          const link = query('a')
          assertTrue(link !== null, 'Es gibt kein <a>.')
          assertEqual(link.getAttribute('href'), '/kasse')
          assertEqual(link.textContent, 'Zur Kasse')
      - name: der Link bekommt data-slot und alle Klassen
        code: |
          const link = query('a')
          assertEqual(link.getAttribute('data-slot'), 'button')
          assertEqual(link.className, 'btn breit link')
    hints:
      - "`if (!React.isValidElement(children)) return null` – danach ist `children` ein Element mit `children.props`."
      - "Props mischen: `{ ...props, ...kind.props, className: [props.className, kind.props.className].filter(Boolean).join(' ') }`."
      - "Im Button: `const Comp = asChild ? Slot : 'button'` und dann `<Comp data-slot=\"button\" … />`."
    solution: |
      function Slot({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) {
        if (!React.isValidElement(children)) return null
        const kind = children as React.ReactElement<any>
        return React.cloneElement(kind, {
          ...props,
          ...kind.props,
          className: [props.className, kind.props.className].filter(Boolean).join(' '),
        })
      }

      type ButtonProps = React.ComponentProps<'button'> & { asChild?: boolean }

      function Button({ asChild = false, className, ...props }: ButtonProps) {
        const Comp: any = asChild ? Slot : 'button'
        return <Comp data-slot="button" className={['btn', className].filter(Boolean).join(' ')} {...props} />
      }

      function App() {
        return (
          <div>
            <Button type="button" className="gross">Speichern</Button>
            <Button asChild className="breit">
              <a href="/kasse" className="link">Zur Kasse</a>
            </Button>
          </div>
        )
      }
  - id: was-wird-gerendert
    type: steps
    title: Was landet im DOM?
    description: Sag voraus, welches HTML die Komponenten erzeugen. Der Button setzt `data-slot="button"` und die Klasse `btn`.
    steps:
      - situation: "`<Button>Senden</Button>`"
        question: Was wird gerendert?
        options:
          - "<button data-slot=\"button\" class=\"btn\">Senden</button>"
          - "<a class=\"btn\">Senden</a>"
          - "<span>Senden</span>"
        answer: 0
        explanation: Ohne asChild rendert der Button sein eigenes `<button>`-Element.
      - situation: "`<Button asChild><a href=\"/hilfe\">Hilfe</a></Button>`"
        question: Was wird gerendert?
        options:
          - "<button class=\"btn\"><a href=\"/hilfe\">Hilfe</a></button>"
          - "<a href=\"/hilfe\" data-slot=\"button\" class=\"btn\">Hilfe</a>"
          - "<a href=\"/hilfe\">Hilfe</a>"
        answer: 1
        explanation: Der Slot überträgt data-slot und Klasse auf das Kind. Es bleibt ein einziges Element.
      - situation: "`<Button asChild>Hilfe</Button>` – das Kind ist nur Text."
        question: Was passiert mit dem vereinfachten Slot aus dieser Lektion?
        options:
          - Er rendert einen Button mit „Hilfe“.
          - Er rendert nichts, weil Text kein Element ist, auf das er Props übertragen kann.
          - Er rendert ein `<a>`.
        answer: 1
        explanation: asChild braucht genau ein Element als Kind. Echte Bibliotheken werfen hier oft sogar einen Fehler.
---
Dein `Button` sieht perfekt aus. Jetzt soll „Zur Kasse“ genauso aussehen – aber es ist ein **Link** zu
einer anderen Seite, kein Knopf, der etwas auslöst. Kopierst du die Klassen? Steckst du ein `<a>` in den
Button? Beides geht schief. Diese Lektion zeigt, wie Bibliotheken das sauber lösen.

## Das Problem: Aussehen hängt am Element

Ein Button und ein Link sehen im Design oft gleich aus, sind in HTML aber verschieden:

| Element | Bedeutung | Tastatur |
|---|---|---|
| `<button>` | löst eine Aktion aus (speichern, öffnen) | Enter **und** Leertaste |
| `<a href>` | führt zu einer anderen Adresse | nur Enter, Rechtsklick „In neuem Tab öffnen“ |

Die naheliegenden Lösungen sind falsch:

```tsx
// Falsch – Verschachtelt: ein Link in einem Button – ungültiges HTML
<Button><a href="/kasse">Zur Kasse</a></Button>

// Falsch – Kopiert: die Klassen des Buttons von Hand übernommen
<a href="/kasse" className="inline-flex rounded-md bg-primary px-4 py-2 …">Zur Kasse</a>
```

Die erste Variante verschachtelt zwei [[interaktives-element|interaktive Elemente]]. Die zweite
kopiert das Aussehen – ändert sich der Button, sieht der Link anders aus.

## Lösung 1: die as-Prop

Eine [[polymorphe-komponente|polymorphe Komponente]] lässt sich sagen, **welches Element** sie rendern soll:

```tsx
function Button({ as: Comp = 'button', className, ...props }) {
  return <Comp data-slot="button" className={cn('btn', className)} {...props} />
}

<Button as="a" href="/kasse">Zur Kasse</Button>
```

Das funktioniert, weil JSX auch eine Variable mit einem String wie `'a'` als Element akzeptiert – sie muss
nur mit Großbuchstaben beginnen. Der Haken liegt beim Typ: Welche Props sind erlaubt? Mit `as="a"` gehört
`href` dazu, mit `as="button"` nicht. Das sauber zu typisieren ist mit [[generics|Generics]] möglich, aber
aufwendig. Deshalb nutzen viele moderne Bibliotheken einen anderen Weg.

## Lösung 2: asChild und Slot

Radix UI und shadcn/ui drehen den Spieß um. Der Aufrufer schreibt das gewünschte Element **selbst** und
sagt dem Button mit [[as-child|asChild]]: „Rendere kein eigenes Element, sondern gib deine Props an mein
Kind weiter.“

```tsx
<Button asChild>
  <a href="/kasse">Zur Kasse</a>
</Button>
// DOM: <a href="/kasse" data-slot="button" class="btn">Zur Kasse</a>
```

Die Arbeit erledigt eine kleine Hilfskomponente, der **Slot**. Vereinfacht sieht er so aus:

```tsx
function Slot({ children, ...props }) {
  if (!React.isValidElement(children)) return null
  return React.cloneElement(children, {
    ...props,
    ...children.props,
    className: cn(props.className, children.props.className),
  })
}

function Button({ asChild = false, className, ...props }) {
  const Comp = asChild ? Slot : 'button'
  return <Comp data-slot="button" className={cn('btn', className)} {...props} />
}
```

`React.cloneElement` erzeugt eine Kopie des Kind-Elements mit zusätzlichen Props. Klassen werden
verbunden, Event-Handler werden in echten Bibliotheken sogar **beide** aufgerufen.

> [!MERKSATZ]
> `asChild` heißt: „Ich bringe mein eigenes Element mit, du lieferst Aussehen und Verhalten.“ Am Ende
> steht genau **ein** Element im DOM.

## Welche Lösung wann?

| Technik | Wer nutzt sie | Stärke | Schwäche |
|---|---|---|---|
| `as`-Prop | ältere Bibliotheken, eigene Komponenten | kurz zu schreiben | Typen schwierig |
| `asChild` + Slot | Radix UI, shadcn/ui | Kind behält eigene Props und Typen | genau ein Kind-Element nötig |
| `render`-Prop | Base UI | sehr explizit, auch als Funktion | etwas mehr Schreibarbeit |

In einem Projekt mit shadcn/ui benutzt du einfach das vorhandene `asChild` – zum Beispiel, um einen
Router-Link wie einen Button aussehen zu lassen. Wie der Slot intern Refs und Event-Handler
zusammenführt, beschreibt die [Radix-Dokumentation zur Komposition](https://www.radix-ui.com/primitives/docs/guides/composition).

> [!FEHLER]
> **Mehrere Kinder an `asChild` übergeben**, etwa `<Button asChild><Icon /><a>…</a></Button>`. Der Slot
> kann seine Props nur auf **ein** Element übertragen. Das Icon gehört in den Link hinein.

> [!PRAXIS]
> Der häufigste Einsatz im Alltag: `<Button asChild><Link to="/kasse">Zur Kasse</Link></Button>` mit dem
> Link-Element deines Routers. So bekommt der Link das Button-Design, bleibt aber ein echter Link mit
> Rechtsklick-Menü und Browser-Verlauf.

## Zusammenfassung

- Aussehen und HTML-Element sind zwei verschiedene Dinge – ein Link kann wie ein Button aussehen.
- Interaktive Elemente nie verschachteln, Klassen nie kopieren.
- Die **as-Prop** wählt das Element, ist aber schwer zu typisieren.
- **asChild** überträgt Props, Klassen und `data-slot` auf das einzige Kind-Element.
- Der **Slot** erledigt das mit `React.cloneElement`; Props des Kindes gewinnen, Klassen werden verbunden.
- Base UI löst dasselbe Problem mit einer `render`-Prop.
