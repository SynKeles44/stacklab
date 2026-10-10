---
title: Komposition statt Konfiguration
summary: Warum Komponenten mit immer mehr Props unwartbar werden und wie du sie mit children und kleinen Teil-Komponenten zusammensetzt.
duration: 20
sources:
  - title: react.dev – Passing JSX as children
    url: https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children
  - title: shadcn/ui – Card
    url: https://ui.shadcn.com/docs/components/card
  - title: react.dev – Thinking in React
    url: https://react.dev/learn/thinking-in-react
quiz:
  - type: single
    question: Eine `Card` hat inzwischen die Props `title`, `subtitle`, `icon`, `footerText`, `showFooter`, `footerAlign` und `headerAction`. Wie nennt man dieses Problem?
    options:
      - Prop-Drilling
      - Prop-Explosion
      - Tree-Shaking
    answer: 1
    explanation: >
      Jeder neue Sonderfall bekommt eine neue Prop. Die Komponente wird zur Konfigurations-Maschine. Prop-Drilling
      ist etwas anderes: Daten werden durch viele Ebenen nach unten gereicht.
  - type: multiple
    question: Welche Dinge regelst du typischerweise besser über **Props** als über Komposition?
    options:
      - Die Variante eines Buttons (`primary`, `ghost`)
      - Die Größe (`sm`, `md`, `lg`)
      - Ob in der Kopfzeile einer Card ein Icon, ein Bild oder ein Menü steht
      - Ob ein Feld deaktiviert ist
    answers: [0, 1, 3]
    explanation: >
      Props eignen sich für Werte aus einer kleinen, festen Menge. Frei wählbare Inhalte – was in einem Bereich
      steht – gibst du als children oder als Teil-Komponente hinein.
  - type: cloze
    text: "Alles, was zwischen dem öffnenden und dem schließenden Tag steht, bekommt eine Komponente in der Prop `___`."
    blanks:
      - [children]
    explanation: React sammelt den Inhalt zwischen den Tags automatisch in `props.children`.
  - type: find-bug
    question: "Der Aufruf `<CardContent>3 Artikel</CardContent>` zeigt immer nur „Inhalt folgt“ an. In welcher Zeile steckt der Fehler?"
    language: tsx
    code: |
      function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
        return (
          <div data-slot="card-content" className={cn('px-6', className)} {...props}>
            Inhalt folgt
          </div>
        )
      }
    bug_line: 4
    explanation: >
      Inhalt zwischen den Tags ist ebenfalls `children` – und er steht nach dem Spread, gewinnt also. Eine
      Teil-Komponente setzt keinen eigenen Inhalt, sondern reicht `children` einfach mit `{...props}` durch.
tasks:
  - id: card-zusammensetzen
    type: code
    language: tsx
    title: Eine Card aus Teil-Komponenten
    description: |
      Ersetze die überladene Card durch Teil-Komponenten im Stil von shadcn/ui.

      1. Baue `Card`, `CardHeader`, `CardTitle` und `CardContent`. Jede nimmt die Props ihres
         HTML-Elements an (`div`, nur `CardTitle` ist ein `h3`) und reicht sie inklusive `children` durch.
      2. Jede setzt ihr `data-slot`: `card`, `card-header`, `card-title`, `card-content`.
      3. Jede hat eine Basisklasse mit gleichem Namen (`card`, `card-header` …) und hängt eine übergebene
         `className` an. Die Hilfsfunktion `cn` ist schon da.
      4. Baue `App` so um, dass sie die neuen Teile benutzt – mit dem Titel „Bestellung“, einem `<button>` mit
         dem Text „Menü“ im Kopfbereich und dem Inhalt „3 Artikel“.
    starter: |
      function cn(...klassen: Array<string | undefined>) {
        return klassen.filter(Boolean).join(' ')
      }

      function Card() {
        return <div />
      }

      function CardHeader() {
        return <div />
      }

      function CardTitle() {
        return <h3 />
      }

      function CardContent() {
        return <div />
      }

      function App() {
        // Vorher: <OldCard title="Bestellung" headerAction="menu" body="3 Artikel" />
        return <div />
      }
    tests:
      - name: alle Teile tragen ihr data-slot
        code: |
          for (const slot of ['card', 'card-header', 'card-title', 'card-content']) {
            assertTrue(query(`[data-slot="${slot}"]`) !== null, `Es fehlt ein Element mit data-slot="${slot}".`)
          }
      - name: der Titel ist ein h3 mit Text
        code: |
          const titel = query('[data-slot="card-title"]')
          assertEqual(titel.tagName, 'H3')
          assertEqual(titel.textContent, 'Bestellung')
      - name: der Kopfbereich enthält Titel und Menü-Button
        code: |
          const kopf = query('[data-slot="card-header"]')
          assertTrue(kopf.querySelector('[data-slot="card-title"]') !== null, 'Der Titel gehört in den CardHeader.')
          assertEqual(kopf.querySelector('button')?.textContent, 'Menü')
          assertEqual(query('[data-slot="card-content"]').textContent, '3 Artikel')
      - name: Basisklasse plus übergebene Klasse
        code: |
          assertTrue(query('[data-slot="card"]').classList.contains('card'), 'Card braucht die Basisklasse card.')
          assertTrue(query('[data-slot="card-content"]').className.startsWith('card-content'), 'CardContent braucht die Basisklasse card-content.')
    hints:
      - "Jede Teil-Komponente sieht gleich aus: `function Card({ className, ...props }: React.ComponentProps<'div'>) { return <div data-slot=\"card\" className={cn('card', className)} {...props} /> }`."
      - "`children` steckt in `props` und wird durch `{...props}` mitgegeben – du musst es nicht einzeln anfassen."
      - "In `App`: `<Card><CardHeader><CardTitle>Bestellung</CardTitle><button>Menü</button></CardHeader><CardContent>3 Artikel</CardContent></Card>`."
    solution: |
      function cn(...klassen: Array<string | undefined>) {
        return klassen.filter(Boolean).join(' ')
      }

      function Card({ className, ...props }: React.ComponentProps<'div'>) {
        return <div data-slot="card" className={cn('card', className)} {...props} />
      }

      function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
        return <div data-slot="card-header" className={cn('card-header', className)} {...props} />
      }

      function CardTitle({ className, ...props }: React.ComponentProps<'h3'>) {
        return <h3 data-slot="card-title" className={cn('card-title', className)} {...props} />
      }

      function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
        return <div data-slot="card-content" className={cn('card-content', className)} {...props} />
      }

      function App() {
        return (
          <Card className="schatten">
            <CardHeader>
              <CardTitle>Bestellung</CardTitle>
              <button>Menü</button>
            </CardHeader>
            <CardContent>3 Artikel</CardContent>
          </Card>
        )
      }
  - id: prop-oder-komposition
    type: dragdrop
    title: Prop oder Komposition?
    description: Entscheide für jede Anforderung, ob sie besser als Prop mit festen Werten oder über children bzw. eine Teil-Komponente gelöst wird.
    targets:
      - { id: prop, label: "Prop mit festen Werten" }
      - { id: komposition, label: "children / Teil-Komponente" }
    items:
      - { label: "Button in drei Größen", target: prop }
      - { label: "Alert in den Farben info, warnung, fehler", target: prop }
      - { label: "Input ist deaktiviert", target: prop }
      - { label: "Card-Kopf mal mit Icon, mal mit Menü", target: komposition }
      - { label: "Dialog mit beliebigem Formular als Inhalt", target: komposition }
      - { label: "Fußzeile einer Card mit zwei Buttons", target: komposition }
    hints:
      - Gibt es eine kleine, feste Liste von Werten? Dann ist eine Prop richtig. Ist der Inhalt frei? Dann Komposition.
---
Die `Card` deines Teams hatte anfangs drei Props. Dann wollte jemand ein Icon im Titel, jemand anderes
einen Button in der Fußzeile, ein Dritter die Fußzeile rechtsbündig. Heute hat sie 14 Props, und
niemand traut sich mehr, sie anzufassen. Dieses Muster ist so häufig, dass es einen Namen hat.

## Das Problem: Prop-Explosion

Eine Komponente, die jeden Sonderfall über eine eigene Prop regelt, nennt man **konfigurationsgetrieben**.
Das Ergebnis ist die [[prop-explosion|Prop-Explosion]]:

```tsx title="So wächst eine Card ins Unwartbare"
<Card
  title="Bestellung"
  subtitle="vom 3. März"
  icon="cart"
  headerAction="menu"
  footerText="Gesamt: 42 €"
  showFooter
  footerAlign="right"
/>
```

Die Probleme:

- **Jede Idee braucht eine neue Prop.** Ein Bild statt Icon? Neue Prop. Zwei Buttons? Neue Prop.
- **Props hängen voneinander ab.** `footerAlign` ist sinnlos ohne `showFooter`.
- **Die Komponente wird riesig**, weil sie alle Kombinationen kennen muss.

Die Lösung heißt [[komposition|Komposition]]: Statt der Komponente zu *sagen*, was sie anzeigen soll,
*gibst* du ihr die fertigen Teile.

> [!MERKSATZ]
> Konfiguration beschreibt, **was** eine Komponente zeigen soll. Komposition übergibt ihr das, was sie
> zeigen soll. Komposition wächst mit, Konfiguration explodiert.

## children: die einfachste Komposition

Alles zwischen öffnendem und schließendem Tag bekommt eine Komponente als [[children-prop|children]]:

```tsx
function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border p-6">{children}</div>
}

<Card>
  <h3>Bestellung</h3>
  <p>3 Artikel</p>
  <button>Details</button>
</Card>
```

Die Card weiß nichts über Bestellungen, Icons oder Buttons. Sie ist nur ein **Rahmen**. Ob darin ein
Bild, ein Formular oder eine Tabelle steht, entscheidet der Aufrufer. Der Typ `React.ReactNode` erlaubt
alles, was React rendern kann: Text, Zahlen, Elemente, Listen und `null`.

Ein Rahmen allein genügt aber oft nicht. Der Titel soll immer gleich aussehen, die Fußzeile immer
unten stehen. Dafür brauchst du benannte Bereiche.

## Benannte Bereiche: Teil-Komponenten

shadcn/ui löst das mit kleinen **Teil-Komponenten**, die jeweils einen Bereich darstellen:

```tsx title="card.tsx (vereinfacht)"
function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card" className={cn('rounded-xl border', className)} {...props} />
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-header" className={cn('grid gap-1 px-6', className)} {...props} />
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-title" className={cn('font-semibold', className)} {...props} />
}

export { Card, CardHeader, CardTitle }
```

Jeder Teil ist winzig, folgt der Props-API aus Modul 1 und kümmert sich nur um **sein** Aussehen. Die
Aufrufer setzen daraus zusammen, was sie brauchen:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Bestellung</CardTitle>
    <OrderMenu />
  </CardHeader>
  <CardContent>3 Artikel</CardContent>
</Card>
```

Diese Bereiche nennt man auch [[slot-muster|Slots]]. Ein neuer Wunsch – ein Menü im Kopf – braucht
keine einzige neue Prop.

> [!FEHLER]
> **Teil-Komponenten mit eigener Logik vollstopfen.** `CardHeader` soll nicht prüfen, ob ein Titel
> vorhanden ist, oder Inhalte umsortieren. Bleib bei: Element, `data-slot`, Klassen, Props durchreichen.

## Wann Props doch richtig sind

Komposition ist kein Allheilmittel. Für Werte aus einer **kleinen, festen Menge** ist eine Prop klarer:

| Anforderung | Besser als | Warum |
|---|---|---|
| Button-Variante `primary` / `ghost` | Prop `variant` | Feste Liste, Aussehen gehört zur Komponente |
| Größe `sm` / `md` / `lg` | Prop `size` | Feste Liste |
| Feld deaktiviert | Prop `disabled` | Ein Ja/Nein-Wert |
| Was im Kopf einer Card steht | Teil-Komponente | Inhalt ist frei |
| Inhalt eines Dialogs | `children` | Inhalt ist frei |

Faustregel: **Werte** über Props, **Inhalte** über Komposition. Wie du Varianten sauber definierst,
lernst du in Modul 3.

> [!PRAXIS]
> In Code-Reviews ist „Brauchen wir dafür wirklich eine neue Prop?“ eine der häufigsten Fragen an
> Bibliothekskomponenten. Oft ist die Antwort: Nein – der Aufrufer kann den Inhalt als `children`
> übergeben.

## Zusammenfassung

- Jede neue Prop für einen Sonderfall führt langfristig zur **Prop-Explosion**.
- **Komposition** übergibt fertige Teile, statt die Komponente zu konfigurieren.
- `children` macht eine Komponente zum Rahmen für beliebigen Inhalt.
- **Teil-Komponenten** wie `CardHeader` und `CardTitle` bilden benannte Bereiche (Slots).
- Jede Teil-Komponente ist winzig: Element, `data-slot`, Klassen, Props durchreichen.
- **Werte** aus einer festen Menge über Props, **Inhalte** über Komposition.
