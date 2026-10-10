---
title: Kontrolliert und unkontrolliert
summary: Wie eine Bibliothekskomponente ihren Zustand selbst verwaltet oder ihn dem Aufrufer überlässt – mit value, defaultValue und onValueChange.
duration: 25
sources:
  - title: react.dev – Controlled and uncontrolled components
    url: https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components
  - title: react.dev – input (controlled vs. uncontrolled)
    url: https://react.dev/reference/react-dom/components/input#controlling-an-input-with-a-state-variable
  - title: Radix UI – Tabs API (value, defaultValue, onValueChange)
    url: https://www.radix-ui.com/primitives/docs/components/tabs
quiz:
  - type: single
    question: "`<Tabs value=\"konto\">` – ohne `onValueChange`. Was passiert, wenn du auf den Tab „Passwort“ klickst?"
    options:
      - Der Tab wechselt ganz normal.
      - Nichts – die Komponente ist kontrolliert, und niemand ändert den Wert von außen.
      - React wirft sofort einen Fehler.
    answer: 1
    explanation: >
      Wer `value` übergibt, übernimmt die Kontrolle. Die Komponente meldet den Wunsch über `onValueChange`; fehlt
      der Handler, bleibt der Wert für immer „konto“. Für einen Startwert ist `defaultValue` gedacht.
  - type: match
    question: Ordne jeder Prop ihre Aufgabe zu.
    pairs:
      - { left: "defaultValue", right: "Startwert, danach verwaltet die Komponente den Zustand selbst" }
      - { left: "value", right: "Aktueller Wert, den der Aufrufer bestimmt" }
      - { left: "onValueChange", right: "Meldet, dass sich der Wert ändern soll" }
    explanation: Das Muster stammt von HTML-Formularfeldern (`value`, `defaultValue`, `onChange`) und wird in Radix UI und shadcn/ui für alle Komponenten mit Zustand genutzt.
  - type: multiple
    question: Wann brauchst du eine Komponente im **kontrollierten** Modus?
    options:
      - Der aktive Tab soll in der URL stehen.
      - Ein Dialog soll sich nach dem Speichern von außen schließen.
      - Ein Accordion soll einfach auf- und zuklappen.
      - Zwei Komponenten sollen immer denselben Wert anzeigen.
    answers: [0, 1, 3]
    explanation: >
      Sobald jemand außerhalb der Komponente den Wert kennen oder ändern muss, liegt der Zustand beim Aufrufer.
      Für reines Auf- und Zuklappen genügt der unkontrollierte Modus.
  - type: find-bug
    question: Dieser Hook soll beide Modi unterstützen. Welche Zeile ist falsch?
    language: tsx
    code: |
      function useControllableState<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void) {
        const [intern, setIntern] = React.useState(defaultValue)
        const kontrolliert = value !== undefined
        const aktuell = kontrolliert ? value : intern
        const setze = (neu: T) => {
          setIntern(neu)
          onChange?.(neu)
        }
        return [aktuell, setze] as const
      }
    bug_line: 6
    explanation: >
      Im kontrollierten Modus darf die Komponente ihren internen Zustand nicht ändern – das bestimmt allein der
      Aufrufer. Richtig ist `if (!kontrolliert) setIntern(neu)`.
tasks:
  - id: controllable-switch
    type: code
    language: tsx
    title: Ein Switch, der beides kann
    description: |
      Baue einen `Switch` (Ein/Aus-Schalter), der kontrolliert **und** unkontrolliert funktioniert.

      1. Schreibe den Hook `useControllableState(value, defaultValue, onChange)`. Er gibt `[aktuellerWert, setze]`
         zurück. Ist `value` nicht `undefined`, gilt der kontrollierte Modus: `setze` ruft nur `onChange` auf.
         Sonst ändert `setze` den internen Zustand **und** ruft `onChange` auf.
      2. `Switch` bekommt `checked`, `defaultChecked` (Standard `false`) und `onCheckedChange`. Er rendert
         `<button role="switch" aria-checked={…}>` und schaltet beim Klick um.

      In `App` steht oben ein unkontrollierter Switch, darunter ein kontrollierter, dessen Zustand `App` hält,
      und ein Button „Alle aus“, der den kontrollierten Switch von außen ausschaltet.
    starter: |
      function useControllableState<T>(value: T | undefined, defaultValue: T, onChange?: (wert: T) => void) {
        const [intern, setIntern] = React.useState(defaultValue)
        return [intern, setIntern] as const
      }

      type SwitchProps = {
        checked?: boolean
        defaultChecked?: boolean
        onCheckedChange?: (checked: boolean) => void
        id?: string
      }

      function Switch({ checked, defaultChecked = false, onCheckedChange, id }: SwitchProps) {
        return <button role="switch" id={id}>Schalter</button>
      }

      function App() {
        const [an, setAn] = React.useState(true)
        const [meldungen, setMeldungen] = React.useState(0)
        return (
          <div>
            <Switch id="frei" onCheckedChange={() => setMeldungen((n) => n + 1)} />
            <Switch id="gesteuert" checked={an} onCheckedChange={setAn} />
            <button className="aus" onClick={() => setAn(false)}>Alle aus</button>
            <output>{meldungen}</output>
          </div>
        )
      }
    tests:
      - name: unkontrolliert schaltet der Switch selbst um und meldet es
        code: |
          assertEqual(query('#frei').getAttribute('aria-checked'), 'false')
          await click('#frei')
          assertEqual(query('#frei').getAttribute('aria-checked'), 'true')
          assertEqual(query('output').textContent, '1')
      - name: kontrolliert zeigt er den Wert von außen
        code: |
          assertEqual(query('#gesteuert').getAttribute('aria-checked'), 'true')
          await click('.aus')
          assertEqual(query('#gesteuert').getAttribute('aria-checked'), 'false')
      - name: kontrolliert meldet ein Klick die Änderung an App
        code: |
          await click('#gesteuert')
          assertEqual(query('#gesteuert').getAttribute('aria-checked'), 'true')
          await click('#gesteuert')
          assertEqual(query('#gesteuert').getAttribute('aria-checked'), 'false')
    hints:
      - "`const kontrolliert = value !== undefined` und `const aktuell = kontrolliert ? value : intern`."
      - "`setze` als Funktion: `(neu: T) => { if (!kontrolliert) setIntern(neu); onChange?.(neu) }`."
      - "Im Switch: `const [an, setAn] = useControllableState(checked, defaultChecked, onCheckedChange)` und `onClick={() => setAn(!an)}`."
    solution: |
      function useControllableState<T>(value: T | undefined, defaultValue: T, onChange?: (wert: T) => void) {
        const [intern, setIntern] = React.useState(defaultValue)
        const kontrolliert = value !== undefined
        const aktuell = kontrolliert ? (value as T) : intern
        const setze = (neu: T) => {
          if (!kontrolliert) setIntern(neu)
          onChange?.(neu)
        }
        return [aktuell, setze] as const
      }

      type SwitchProps = {
        checked?: boolean
        defaultChecked?: boolean
        onCheckedChange?: (checked: boolean) => void
        id?: string
      }

      function Switch({ checked, defaultChecked = false, onCheckedChange, id }: SwitchProps) {
        const [an, setAn] = useControllableState(checked, defaultChecked, onCheckedChange)
        return (
          <button role="switch" id={id} aria-checked={an} onClick={() => setAn(!an)}>
            Schalter
          </button>
        )
      }

      function App() {
        const [an, setAn] = React.useState(true)
        const [meldungen, setMeldungen] = React.useState(0)
        return (
          <div>
            <Switch id="frei" onCheckedChange={() => setMeldungen((n) => n + 1)} />
            <Switch id="gesteuert" checked={an} onCheckedChange={setAn} />
            <button className="aus" onClick={() => setAn(false)}>Alle aus</button>
            <output>{meldungen}</output>
          </div>
        )
      }
  - id: klick-ablauf
    type: order
    title: Ein Klick auf einen kontrollierten Tab
    description: "`App` hält `const [tab, setTab] = useState('a')` und rendert `<Tabs value={tab} onValueChange={setTab}>`. Bringe die Schritte nach einem Klick auf Tab „b“ in die richtige Reihenfolge."
    items:
      - Der TabsTrigger für „b“ ruft beim Klick die Setter-Funktion aus dem Context auf.
      - Die Komponente erkennt den kontrollierten Modus und ruft nur onValueChange("b") auf.
      - setTab("b") in App ändert den State der Eltern-Komponente.
      - App rendert neu und übergibt value="b" an Tabs.
      - Tabs stellt den neuen Wert über den Context bereit, und das Panel „b“ erscheint.
---
Deine `Tabs` aus Modul 2 verwalten ihren aktiven Tab selbst. Jetzt kommt eine neue Anforderung: Nach dem
Speichern soll die App automatisch zum Tab „Übersicht“ springen, und der aktive Tab soll in der
Adresszeile stehen. Dafür muss jemand **außerhalb** der Tabs den Wert bestimmen können.

## Wem gehört der Zustand?

Eine Komponente mit Zustand kann auf zwei Arten benutzt werden:

![Unkontrolliert lebt der Zustand in der Komponente, kontrolliert in der Eltern-Komponente](/assets/react-komponenten-architektur/kontrolliert-unkontrolliert.svg)

| | Unkontrolliert | Kontrolliert |
|---|---|---|
| Wo lebt der Zustand? | in der Komponente | beim Aufrufer |
| Aufruf | `<Tabs defaultValue="a">` | `<Tabs value={tab} onValueChange={setTab}>` |
| Aufwand für den Aufrufer | keiner | eigener `useState` |
| Wert von außen ändern | nicht möglich | jederzeit |

Eine [[unkontrollierte-komponente|unkontrollierte Komponente]] ist bequem: Startwert rein, fertig. Eine
[[kontrollierte-komponente|kontrollierte Komponente]] gibt dem Aufrufer die volle Macht. Das kennst du
schon von `<input>`: `defaultValue` gegen `value` plus `onChange`.

> [!MERKSATZ]
> Für jeden Wert gibt es genau **eine** Quelle der Wahrheit. Unkontrolliert ist es die Komponente,
> kontrolliert der Aufrufer – nie beide gleichzeitig.

## Die Namenskonvention

Gute Bibliotheken benennen die Props für jeden Zustand nach demselben Schema. Radix UI und shadcn/ui
machen es so:

| Zustand | Kontrolliert | Startwert | Änderung melden |
|---|---|---|---|
| aktiver Tab | `value` | `defaultValue` | `onValueChange` |
| Dialog offen | `open` | `defaultOpen` | `onOpenChange` |
| Checkbox, Switch | `checked` | `defaultChecked` | `onCheckedChange` |

Das Schema lautet: `x`, `defaultX`, `onXChange`. Wer es einmal kennt, kann jede Komponente der
Bibliothek bedienen, ohne die Dokumentation zu lesen.

> [!PRAXIS]
> Weil die Namen überall gleich sind, lassen sich Komponenten leicht mit anderen Werkzeugen verbinden –
> etwa einen Dialog mit `open` und `onOpenChange` an einen Wert aus der URL oder aus einem Formular-State.

## Beides unterstützen: ein eigener Hook

Damit nicht jede Komponente die Fallunterscheidung neu schreibt, steckt sie in einem
[[eigener-hook|eigenen Hook]]:

```tsx title="use-controllable-state.ts"
function useControllableState<T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: (wert: T) => void,
) {
  const [intern, setIntern] = React.useState(defaultValue)
  const kontrolliert = value !== undefined
  const aktuell = kontrolliert ? value : intern

  const setze = (neu: T) => {
    if (!kontrolliert) setIntern(neu) // nur unkontrolliert selbst speichern
    onChange?.(neu)                    // Änderung immer melden
  }
  return [aktuell, setze] as const
}
```

In `Tabs` ersetzt er den bisherigen `useState`:

```tsx
function Tabs({ value, defaultValue, onValueChange, children }: TabsProps) {
  const [aktiv, setAktiv] = useControllableState(value, defaultValue, onValueChange)
  return <TabsContext value={{ value: aktiv, setValue: setAktiv }}>{children}</TabsContext>
}
```

Die Teile (`TabsTrigger`, `TabsContent`) merken davon nichts – sie rufen weiter nur `setValue` auf.

## Typische Stolperfallen

> [!FEHLER]
> **`value` ohne `onValueChange` übergeben.** Die Komponente ist dann kontrolliert, aber niemand ändert den
> Wert: Sie wirkt eingefroren. Willst du nur einen Startwert setzen, nimm `defaultValue`.

Zwei weitere Fallen:

- **Zwischen den Modi wechseln.** Ist `value` erst `undefined` und später gesetzt, springt die
  Komponente vom einen in den anderen Modus. Bei `<input>` warnt React deshalb in der Konsole. Entscheide
  dich beim ersten Rendern für einen Modus.
- **`defaultValue` später ändern.** Er wird nur beim ersten Rendern gelesen, genau wie der Startwert von
  `useState`. Eine Änderung danach hat keine Wirkung.

## Zusammenfassung

- **Unkontrolliert**: Die Komponente hält ihren Zustand selbst, der Aufrufer gibt nur `defaultValue`.
- **Kontrolliert**: Der Aufrufer hält den Zustand und übergibt `value` plus `onValueChange`.
- Gute Bibliotheken unterstützen **beide** Modi und nutzen das Schema `x`, `defaultX`, `onXChange`.
- Ein Hook wie `useControllableState` kapselt die Fallunterscheidung für alle Komponenten.
- `value` ohne Änderungs-Handler friert die Komponente ein.
- Wechsle nicht zwischen den Modi und ändere `defaultValue` nicht nachträglich.
