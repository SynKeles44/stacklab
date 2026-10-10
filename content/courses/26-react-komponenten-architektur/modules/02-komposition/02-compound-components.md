---
title: Compound Components mit Context
summary: Wie mehrere Komponenten wie Tabs, TabsList, TabsTrigger und TabsContent über einen gemeinsamen Context zu einem Bauteil werden.
duration: 25
sources:
  - title: react.dev – Passing Data Deeply with Context
    url: https://react.dev/learn/passing-data-deeply-with-context
  - title: react.dev – useContext
    url: https://react.dev/reference/react/useContext
  - title: WAI-ARIA Authoring Practices – Tabs Pattern
    url: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
  - title: shadcn/ui – Tabs
    url: https://ui.shadcn.com/docs/components/tabs
quiz:
  - type: single
    question: Wie erfahren `TabsTrigger` und `TabsContent`, welcher Tab gerade aktiv ist?
    options:
      - Der Aufrufer übergibt jedem Teil die Prop `activeValue`.
      - Sie lesen den Wert mit `useContext` aus dem Context, den `Tabs` bereitstellt.
      - Sie lesen ihn aus einer globalen Variable.
    answer: 1
    explanation: >
      Die Wurzel `Tabs` hält den Zustand und stellt ihn über einen Provider bereit. Jeder Teil darunter liest ihn
      mit `useContext` – egal wie tief er verschachtelt ist.
  - type: multiple
    question: Welche Vorteile hat eine Compound Component gegenüber einer Tabs-Komponente mit einer Prop `items=[{ label, content }]`?
    options:
      - Aufrufer können beliebigen Inhalt in Trigger und Panels setzen, etwa Icons oder Badges.
      - Aufrufer können zusätzliche Elemente zwischen die Teile stellen.
      - Sie braucht keinerlei Zustand.
      - Jeder Teil kann eigene Props wie `className` oder `disabled` bekommen.
    answers: [0, 1, 3]
    explanation: >
      Die Teile sind echte Komponenten mit eigener Props-API. Zustand gibt es trotzdem – er liegt nur zentral in
      der Wurzel.
  - type: cloze
    text: "Einen Context legst du mit `React.___Context()` an. Die Wurzel umschließt ihre Kinder mit `<TabsContext.___ value={…}>`."
    blanks:
      - [create]
      - [Provider]
    explanation: Seit React 19 kannst du auch direkt `<TabsContext value={…}>` schreiben. `.Provider` funktioniert weiterhin.
  - type: match
    question: Ordne jedem Teil der Tabs seine ARIA-Rolle zu.
    pairs:
      - { left: "TabsList", right: "tablist" }
      - { left: "TabsTrigger", right: "tab" }
      - { left: "TabsContent", right: "tabpanel" }
    explanation: Diese Rollen beschreiben das Tabs-Muster der WAI-ARIA Authoring Practices. Screenreader kündigen damit „Tab 1 von 3“ an.
tasks:
  - id: compound-diagramm
    type: diagram
    title: Beschrifte den Aufbau
    description: Ziehe die Namen an die richtigen Stellen. Wer hält den Zustand, wer stellt ihn bereit, und welche Teile lesen ihn?
    image: /assets/react-komponenten-architektur/compound-components-leer.svg
    slots:
      - { x: 50, y: 22, answer: "Tabs (Wurzel)" }
      - { x: 50, y: 49, answer: "TabsContext.Provider" }
      - { x: 18, y: 76, answer: "TabsList" }
      - { x: 50, y: 76, answer: "TabsTrigger" }
      - { x: 82, y: 76, answer: "TabsContent" }
    distractors: ["Redux-Store", "props.items"]
  - id: tabs-bauen
    type: code
    language: tsx
    title: Tabs als Compound Component
    description: |
      Baue Tabs, deren Teile sich über Context verständigen.

      1. `Tabs` bekommt `defaultValue`, hält den aktiven Wert in `useState` und stellt `{ value, setValue }` über
         `TabsContext` bereit. Er rendert `<div data-slot="tabs">`.
      2. `TabsList` rendert `<div role="tablist">` mit seinen children.
      3. `TabsTrigger` bekommt `value`, rendert `<button role="tab">` mit `aria-selected` (`true`, wenn er aktiv ist)
         und setzt beim Klick den aktiven Wert.
      4. `TabsContent` bekommt `value` und rendert `<div role="tabpanel">` mit seinen children – nur wenn er aktiv ist.
      5. `useTabs()` liest den Context und wirft einen Fehler, wenn er fehlt.

      `App` ist fertig.
    starter: |
      type TabsContextValue = { value: string; setValue: (value: string) => void }
      const TabsContext = React.createContext<TabsContextValue | null>(null)

      function useTabs() {
        // Context lesen, bei null einen Fehler werfen
      }

      function Tabs({ defaultValue, children }: { defaultValue: string; children: React.ReactNode }) {
        return <div data-slot="tabs">{children}</div>
      }

      function TabsList({ children }: { children: React.ReactNode }) {
        return <div>{children}</div>
      }

      function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
        return <button>{children}</button>
      }

      function TabsContent({ value, children }: { value: string; children: React.ReactNode }) {
        return <div>{children}</div>
      }

      function App() {
        return (
          <Tabs defaultValue="konto">
            <TabsList>
              <TabsTrigger value="konto">Konto</TabsTrigger>
              <TabsTrigger value="passwort">Passwort</TabsTrigger>
            </TabsList>
            <TabsContent value="konto">Deine Kontodaten</TabsContent>
            <TabsContent value="passwort">Passwort ändern</TabsContent>
          </Tabs>
        )
      }
    tests:
      - name: Rollen sind gesetzt
        code: |
          assertTrue(query('[role="tablist"]') !== null, 'TabsList braucht role="tablist".')
          assertEqual(queryAll('[role="tab"]').length, 2)
      - name: am Anfang ist nur der Standard-Tab sichtbar
        code: |
          const panels = queryAll('[role="tabpanel"]')
          assertEqual(panels.length, 1)
          assertEqual(panels[0].textContent, 'Deine Kontodaten')
          assertEqual(queryAll('[role="tab"]')[0].getAttribute('aria-selected'), 'true')
          assertEqual(queryAll('[role="tab"]')[1].getAttribute('aria-selected'), 'false')
      - name: ein Klick wechselt den Tab
        code: |
          await click('[role="tab"]:nth-child(2)')
          const panels = queryAll('[role="tabpanel"]')
          assertEqual(panels.length, 1)
          assertEqual(panels[0].textContent, 'Passwort ändern')
          assertEqual(queryAll('[role="tab"]')[1].getAttribute('aria-selected'), 'true')
    hints:
      - "In `Tabs`: `const [value, setValue] = React.useState(defaultValue)` und dann `<TabsContext.Provider value={{ value, setValue }}>…</TabsContext.Provider>`."
      - "`useTabs`: `const ctx = React.useContext(TabsContext); if (!ctx) throw new Error('…'); return ctx`."
      - "Im Trigger: `const { value: aktiv, setValue } = useTabs()` – dann `aria-selected={aktiv === value}` und `onClick={() => setValue(value)}`."
    solution: |
      type TabsContextValue = { value: string; setValue: (value: string) => void }
      const TabsContext = React.createContext<TabsContextValue | null>(null)

      function useTabs() {
        const ctx = React.useContext(TabsContext)
        if (!ctx) throw new Error('Tabs-Teile müssen innerhalb von <Tabs> stehen.')
        return ctx
      }

      function Tabs({ defaultValue, children }: { defaultValue: string; children: React.ReactNode }) {
        const [value, setValue] = React.useState(defaultValue)
        return (
          <TabsContext.Provider value={{ value, setValue }}>
            <div data-slot="tabs">{children}</div>
          </TabsContext.Provider>
        )
      }

      function TabsList({ children }: { children: React.ReactNode }) {
        return <div role="tablist">{children}</div>
      }

      function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
        const { value: aktiv, setValue } = useTabs()
        return (
          <button role="tab" aria-selected={aktiv === value} onClick={() => setValue(value)}>
            {children}
          </button>
        )
      }

      function TabsContent({ value, children }: { value: string; children: React.ReactNode }) {
        const { value: aktiv } = useTabs()
        if (aktiv !== value) return null
        return <div role="tabpanel">{children}</div>
      }

      function App() {
        return (
          <Tabs defaultValue="konto">
            <TabsList>
              <TabsTrigger value="konto">Konto</TabsTrigger>
              <TabsTrigger value="passwort">Passwort</TabsTrigger>
            </TabsList>
            <TabsContent value="konto">Deine Kontodaten</TabsContent>
            <TabsContent value="passwort">Passwort ändern</TabsContent>
          </Tabs>
        )
      }
---
Ein `<select>` mit seinen `<option>`-Elementen funktioniert nur zusammen: Die Optionen allein sind
sinnlos, das Select ohne Optionen leer. Trotzdem schreibst du sie als einzelne Tags. Genau dieses Prinzip
überträgst du jetzt auf eigene React-Komponenten.

## Was eine Compound Component ist

Eine [[compound-component|Compound Component]] besteht aus mehreren Komponenten, die **gemeinsam** ein
Bauteil bilden und sich still einen Zustand teilen. Der Aufrufer setzt sie wie HTML zusammen:

```tsx
<Tabs defaultValue="konto">
  <TabsList>
    <TabsTrigger value="konto">Konto</TabsTrigger>
    <TabsTrigger value="passwort">Passwort</TabsTrigger>
  </TabsList>
  <TabsContent value="konto">Deine Kontodaten …</TabsContent>
  <TabsContent value="passwort">Passwort ändern …</TabsContent>
</Tabs>
```

Vergleiche das mit der konfigurationsgetriebenen Variante `<Tabs items={[{ label, content }]} />`:

| | `items`-Prop | Compound Component |
|---|---|---|
| Icon oder Badge im Tab | neue Prop nötig | einfach in `TabsTrigger` schreiben |
| Extra-Button neben den Tabs | unmöglich | einfach in `TabsList` stellen |
| `className` für einen einzelnen Tab | neue Prop nötig | direkt am Teil |

Das ist die Komposition aus der letzten Lektion – plus **gemeinsamer Zustand**.

## Gemeinsamer Zustand über Context

Woher weiß `TabsTrigger`, ob er aktiv ist? Die Wurzel hält den Zustand und stellt ihn über
[[react-context|Context]] bereit. Jeder Teil liest ihn mit `useContext` – ohne dass der Aufrufer
etwas durchreichen muss.

![Tabs hält den Zustand, der Provider verteilt ihn, die Teile lesen ihn mit useContext](/assets/react-komponenten-architektur/compound-components.svg)

```tsx title="tabs.tsx (Kern)"
type TabsContextValue = { value: string; setValue: (v: string) => void }
const TabsContext = React.createContext<TabsContextValue | null>(null)

function Tabs({ defaultValue, children }: { defaultValue: string; children: React.ReactNode }) {
  const [value, setValue] = React.useState(defaultValue)
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div data-slot="tabs">{children}</div>
    </TabsContext.Provider>
  )
}

function TabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  const { value: aktiv } = useTabs()
  return aktiv === value ? <div role="tabpanel">{children}</div> : null
}
```

Der Context ist **privat**: Er wird nicht exportiert. Nur die Teile kennen ihn. Seit React 19 darfst du
statt `<TabsContext.Provider>` auch kurz `<TabsContext>` schreiben.

> [!MERKSATZ]
> Die Wurzel **besitzt** den Zustand, der Context **verteilt** ihn, die Teile **lesen** ihn. Der Aufrufer
> sieht davon nichts.

## Ein Hook mit klarer Fehlermeldung

Was passiert, wenn jemand `<TabsTrigger>` außerhalb von `<Tabs>` benutzt? `useContext` liefert dann den
Standardwert `null`, und der Code stürzt irgendwo mit „Cannot read properties of null“ ab. Besser ist
ein kleiner [[eigener-hook|eigener Hook]], der das prüft:

```tsx
function useTabs() {
  const ctx = React.useContext(TabsContext)
  if (!ctx) {
    throw new Error('TabsTrigger und TabsContent müssen innerhalb von <Tabs> stehen.')
  }
  return ctx
}
```

Jetzt sagt die Fehlermeldung genau, was falsch ist. Nebenbei kennt [[typescript|TypeScript]] nach dem
`if` den Typ ohne `null` – kein `ctx?.value` mehr nötig.

> [!FEHLER]
> **Den Context mit einem halbwegs sinnvollen Standardwert anlegen**, etwa
> `createContext({ value: '', setValue: () => {} })`. Dann funktioniert ein falsch platzierter Teil
> scheinbar – er tut nur nichts. Solche Fehler sucht man stundenlang. Lieber `null` und eine laute
> Fehlermeldung.

## Barrierefreiheit gehört dazu

Tabs sind mehr als Buttons, die etwas ein- und ausblenden. [[screenreader|Screenreader]] brauchen
Rollen und Zustände, damit sie „Tab 2 von 3, ausgewählt“ vorlesen können:

| Teil | Rolle | Wichtige Attribute |
|---|---|---|
| `TabsList` | `tablist` | – |
| `TabsTrigger` | `tab` | `aria-selected`, `aria-controls` |
| `TabsContent` | `tabpanel` | `aria-labelledby` |

Dazu kommt die Tastatur: Pfeiltasten wechseln zwischen den Tabs. Weil die Teile den Context teilen,
kann jeder Trigger diese Logik übernehmen – mehr dazu in Modul 3. Die genauen Regeln stehen im
[Tabs-Muster der WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

> [!PRAXIS]
> Bibliotheken wie Radix UI oder Base UI exportieren die Teile oft als Namensraum (`Tabs.Root`,
> `Tabs.Trigger`), shadcn/ui als flache Namen (`Tabs`, `TabsTrigger`). Beides ist dasselbe Muster.
> Wichtig ist nur, dass alle Teile **aus einer Datei** kommen.

## Zusammenfassung

- Eine **Compound Component** besteht aus Teilen, die gemeinsam ein Bauteil bilden.
- Die Wurzel hält den **Zustand**, ein privater **Context** verteilt ihn an die Teile.
- Aufrufer setzen die Teile frei zusammen – ohne Props durchzureichen.
- Ein eigener Hook wie `useTabs()` wirft eine **klare Fehlermeldung**, wenn ein Teil falsch platziert ist.
- Rollen wie `tablist`, `tab` und `tabpanel` plus Tastaturbedienung machen das Bauteil barrierefrei.
- Alle Teile einer Compound Component liegen und exportieren sich aus **einer** Datei.
