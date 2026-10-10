---
title: Eigene Hooks und Formulare
summary: Wie du wiederkehrende Logik in eigene Hooks auslagerst und Formulare kontrolliert oder mit React-19-Actions und useActionState baust.
duration: 25
sources:
  - title: react.dev – Reusing Logic with Custom Hooks
    url: https://react.dev/learn/reusing-logic-with-custom-hooks
  - title: react.dev – <form> (Actions)
    url: https://react.dev/reference/react-dom/components/form
  - title: react.dev – useActionState
    url: https://react.dev/reference/react/useActionState
  - title: react.dev – <input>
    url: https://react.dev/reference/react-dom/components/input
quiz:
  - type: single
    question: Zwei Komponenten rufen denselben eigenen Hook `useZaehler()` auf. Was teilen sie sich?
    options:
      - Den State – ändert eine den Zähler, ändert er sich auch bei der anderen.
      - Nur die Logik – jede Komponente hat ihren eigenen, unabhängigen State.
      - Nichts, ein Hook darf nur in einer Komponente verwendet werden.
      - Den State, aber nur, wenn sie Geschwister sind.
    answer: 1
    explanation: >
      Ein eigener Hook ist wiederverwendbare Logik. Jeder Aufruf erzeugt eigenen State. Willst du Daten
      teilen, hebst du State an oder nutzt Context.
  - type: multiple
    question: Welche Aussagen über eigene Hooks stimmen?
    options:
      - Ihr Name beginnt mit use, gefolgt von einem Großbuchstaben, z. B. useOnline.
      - Sie dürfen andere Hooks wie useState und useEffect aufrufen.
      - Sie müssen JSX zurückgeben.
      - Eine Funktion, die keine Hooks aufruft, sollte auch nicht mit use beginnen.
    answers: [0, 1, 3]
    explanation: >
      Eigene Hooks geben zurück, was sie wollen (Werte, Funktionen, Objekte). Das Präfix use signalisiert,
      dass darin Hooks stecken und die Hook-Regeln gelten.
  - type: cloze
    text: "In React 19 übergibst du einem Formular eine Funktion über das Attribut ___. Sie bekommt die Eingaben als ___-Objekt."
    blanks:
      - [action]
      - [FormData]
    explanation: "`<form action={funktion}>` ruft die Funktion mit einem FormData-Objekt auf; Werte liest du mit formData.get('name')."
  - type: match
    question: Ordne die Rückgabewerte von `useActionState` zu.
    pairs:
      - { left: "1. Wert", right: "Aktueller State, z. B. eine Fehlermeldung" }
      - { left: "2. Wert", right: "Funktion für action={…} am Formular" }
      - { left: "3. Wert", right: "isPending – läuft die Aktion gerade?" }
    explanation: "`const [state, formAction, isPending] = useActionState(aktion, startState)`."
tasks:
  - id: eigener-hook
    type: code
    language: jsx
    title: Der Hook useZaehler
    description: |
      Zwei Komponenten enthalten denselben Zähler-Code. Lagere ihn in einen eigenen Hook aus.

      1. Schreibe `useZaehler(start, schritt)`. Er verwaltet einen Zähler-State und gibt ein Objekt
         `{ wert, erhoehen, zuruecksetzen }` zurück. `erhoehen` addiert `schritt`, `zuruecksetzen` springt auf `start`.
      2. `Wasser` nutzt `useZaehler(0, 1)`, `Schritte` nutzt `useZaehler(100, 500)`.
      3. Beide zeigen `<output>` mit dem Wert, einen Button `.plus` und einen Button `.reset`.
    starter: |
      function Wasser() {
        const [wert, setWert] = React.useState(0)
        return (
          <section className="wasser">
            <output>{wert}</output>
            <button className="plus" onClick={() => setWert((w) => w + 1)}>+</button>
            <button className="reset" onClick={() => setWert(0)}>Reset</button>
          </section>
        )
      }

      function Schritte() {
        return (
          <section className="schritte">
            <output>100</output>
            <button className="plus">+</button>
            <button className="reset">Reset</button>
          </section>
        )
      }

      function App() {
        return (
          <div>
            <Wasser />
            <Schritte />
          </div>
        )
      }
    tests:
      - name: beide starten mit ihrem Startwert
        code: |
          assertEqual(query('.wasser output').textContent, '0')
          assertEqual(query('.schritte output').textContent, '100')
      - name: jede Komponente zählt mit eigenem Schritt und eigenem State
        code: |
          await click('.wasser .plus')
          await click('.wasser .plus')
          await click('.schritte .plus')
          assertEqual(query('.wasser output').textContent, '2')
          assertEqual(query('.schritte output').textContent, '600')
      - name: zuruecksetzen springt auf den Startwert
        code: |
          await click('.schritte .reset')
          assertEqual(query('.schritte output').textContent, '100')
          assertEqual(query('.wasser output').textContent, '2')
    hints:
      - "Im Hook: `const [wert, setWert] = React.useState(start)` und `return { wert, erhoehen: () => setWert((w) => w + schritt), zuruecksetzen: () => setWert(start) }`."
      - "In der Komponente: `const { wert, erhoehen, zuruecksetzen } = useZaehler(0, 1)`."
    solution: |
      function useZaehler(start, schritt) {
        const [wert, setWert] = React.useState(start)
        return {
          wert,
          erhoehen: () => setWert((w) => w + schritt),
          zuruecksetzen: () => setWert(start),
        }
      }

      function Wasser() {
        const { wert, erhoehen, zuruecksetzen } = useZaehler(0, 1)
        return (
          <section className="wasser">
            <output>{wert}</output>
            <button className="plus" onClick={erhoehen}>+</button>
            <button className="reset" onClick={zuruecksetzen}>Reset</button>
          </section>
        )
      }

      function Schritte() {
        const { wert, erhoehen, zuruecksetzen } = useZaehler(100, 500)
        return (
          <section className="schritte">
            <output>{wert}</output>
            <button className="plus" onClick={erhoehen}>+</button>
            <button className="reset" onClick={zuruecksetzen}>Reset</button>
          </section>
        )
      }

      function App() {
        return (
          <div>
            <Wasser />
            <Schritte />
          </div>
        )
      }
  - id: formular-action
    type: code
    language: jsx
    title: Newsletter-Formular mit useActionState
    description: |
      Baue ein Newsletter-Formular mit einer React-19-Action.

      1. Die Funktion `anmelden(vorher, formData)` liest das Feld `email`. Enthält es kein `@`, gibt sie
         `{ fehler: 'Bitte gib eine gültige E-Mail ein.' }` zurück, sonst `{ email }`.
      2. `App` nutzt `React.useActionState(anmelden, {})` und übergibt die zweite Rückgabe an `<form action={…}>`.
      3. Gibt es einen Fehler, zeigt das Formular `<p className="fehler">` mit der Meldung.
      4. Nach Erfolg wird statt des Formulars `<p className="erfolg">Danke, ada@example.com!</p>` (mit der
         eingegebenen Adresse) angezeigt.
    starter: |
      function anmelden(vorher, formData) {
        return vorher
      }

      function App() {
        return (
          <form>
            <input name="email" placeholder="E-Mail" />
            <button type="submit">Anmelden</button>
          </form>
        )
      }
    tests:
      - name: zeigt anfangs das Formular ohne Fehler
        code: |
          assertTrue(query('form') !== null)
          assertEqual(query('.fehler'), null)
      - name: meldet eine ungültige Adresse
        code: |
          await type('input[name="email"]', 'ada.example.com')
          await click('button[type="submit"]')
          await new Promise((r) => setTimeout(r, 60))
          assertEqual(query('.fehler') && query('.fehler').textContent, 'Bitte gib eine gültige E-Mail ein.')
      - name: bedankt sich nach einer gültigen Adresse
        code: |
          await type('input[name="email"]', 'ada@example.com')
          await click('button[type="submit"]')
          await new Promise((r) => setTimeout(r, 60))
          assertEqual(query('.erfolg') && query('.erfolg').textContent, 'Danke, ada@example.com!')
          assertEqual(query('form'), null)
    hints:
      - "Wert lesen: `const email = String(formData.get('email') ?? '')`."
      - "`const [state, formAction] = React.useActionState(anmelden, {})` und `<form action={formAction}>`."
      - "Erfolg prüfen mit `if (state.email) return <p className=\"erfolg\">Danke, {state.email}!</p>`."
    solution: |
      function anmelden(vorher, formData) {
        const email = String(formData.get('email') ?? '')
        if (!email.includes('@')) {
          return { fehler: 'Bitte gib eine gültige E-Mail ein.' }
        }
        return { email }
      }

      function App() {
        const [state, formAction, isPending] = React.useActionState(anmelden, {})

        if (state.email) {
          return <p className="erfolg">Danke, {state.email}!</p>
        }

        return (
          <form action={formAction}>
            <input name="email" placeholder="E-Mail" />
            <button type="submit" disabled={isPending}>Anmelden</button>
            {state.fehler && <p className="fehler">{state.fehler}</p>}
          </form>
        )
      }
  - id: hook-oder-nicht
    type: dragdrop
    title: Hook, Funktion oder Komponente?
    description: Ordne jedes Stück Code der passenden Art zu.
    targets:
      - { id: hook, label: Eigener Hook }
      - { id: funktion, label: Normale Hilfsfunktion }
      - { id: komponente, label: Komponente }
    items:
      - { label: "useOnline() – liest navigator.onLine und abonniert online/offline-Events", target: hook }
      - { label: "useFormularFeld(start) – liefert value und onChange für ein Eingabefeld", target: hook }
      - { label: "formatierePreis(4.5) – liefert den String 4,50 €", target: funktion }
      - { label: "summe(positionen) – addiert Mengen eines Arrays", target: funktion }
      - { label: "Preisschild({ betrag }) – gibt ein span mit dem Preis zurück", target: komponente }
    hints:
      - Ein Hook ruft selbst Hooks auf. Eine Komponente gibt JSX zurück. Alles andere ist eine normale Funktion.
---
In deiner App gibt es drei Stellen, die prüfen, ob der Browser online ist: jeweils ein State, ein Effekt mit
zwei Event-Listenern und ein Cleanup. Dreimal derselbe Code – und dreimal dieselbe Fehlerquelle. Mit einem
[[eigener-hook|eigenen Hook]] schreibst du diese Logik einmal. Danach geht es um den häufigsten Ort für
State überhaupt: Formulare.

## Eigene Hooks: Logik wiederverwenden

Ein eigener Hook ist eine Funktion, deren Name mit `use` beginnt und die selbst Hooks aufruft.

```jsx title="useOnline.js"
import { useState, useEffect } from 'react'

export function useOnline() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const an = () => setOnline(true)
    const aus = () => setOnline(false)
    window.addEventListener('online', an)
    window.addEventListener('offline', aus)
    return () => {
      window.removeEventListener('online', an)
      window.removeEventListener('offline', aus)
    }
  }, [])

  return online
}
```

```jsx title="Verwendung"
function Statusleiste() {
  const online = useOnline()
  return <p>{online ? '✅ Online' : '❌ Offline'}</p>
}
```

> [!MERKSATZ]
> Eigene Hooks teilen **Logik**, nicht **State**. Jede Komponente, die `useOnline()` aufruft, bekommt ihren
> eigenen State und ihren eigenen Effekt.

## Gute Hooks schneiden

Ein Hook lohnt sich, wenn er einen klaren Zweck mit Namen hat: `useOnline`, `useFormularFeld`,
`useLocalStorage`. Er darf beliebige Werte zurückgeben – einen Wert, ein Array wie `useState` oder ein
Objekt.

```jsx title="useFormularFeld"
function useFormularFeld(start) {
  const [value, setValue] = useState(start)
  return { value, onChange: (e) => setValue(e.target.value) }
}

function Anmeldung() {
  const vorname = useFormularFeld('')
  const nachname = useFormularFeld('')
  return (
    <>
      <input {...vorname} />
      <input {...nachname} />
      <p>Hallo {vorname.value} {nachname.value}</p>
    </>
  )
}
```

> [!FEHLER]
> `useFormatierung(betrag)`, das nur rechnet und keine Hooks aufruft, ist kein Hook. Das `use`-Präfix
> verpflichtet zu den Hook-Regeln – nenne reine Hilfsfunktionen einfach `formatiereBetrag`.

## Formulare: kontrolliert

Bei einem kontrollierten Formular steckt jeder Wert in State. Du kannst live validieren, Felder
voneinander abhängig machen und beim Absenden alles direkt lesen.

```jsx title="Kontrolliertes Formular"
function Kontakt() {
  const [email, setEmail] = useState('')
  const gueltig = email.includes('@')

  function absenden(e) {
    e.preventDefault()                 // kein Neuladen der Seite
    senden({ email })
  }

  return (
    <form onSubmit={absenden}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button disabled={!gueltig}>Senden</button>
    </form>
  )
}
```

Bei Checkboxen liest du `e.target.checked` und setzt `checked={…}` statt `value`.

## Formulare mit React-19-Actions

React 19 erlaubt eine Funktion als `action` eines Formulars. React ruft sie beim Absenden mit einem
[[formdata|FormData]]-Objekt auf – ohne `preventDefault`, ohne State pro Feld. Die Felder brauchen
nur ein `name`.

[[useactionstate|useActionState]] ergänzt das um ein Ergebnis und einen Ladezustand:

```jsx title="Newsletter mit useActionState"
async function anmelden(vorher, formData) {
  const email = formData.get('email')
  if (!String(email).includes('@')) return { fehler: 'Ungültige E-Mail' }
  await fetch('/api/newsletter', { method: 'POST', body: formData })
  return { erfolg: true }
}

function Newsletter() {
  const [state, formAction, isPending] = useActionState(anmelden, {})
  return (
    <form action={formAction}>
      <input name="email" />
      <button disabled={isPending}>{isPending ? 'Sende …' : 'Anmelden'}</button>
      {state.fehler && <p>{state.fehler}</p>}
    </form>
  )
}
```

| | kontrolliert | Action + useActionState |
|---|---|---|
| Werte | State pro Feld | `FormData` beim Absenden |
| Live-Validierung | einfach | aufwendiger |
| Ladezustand | selbst bauen | `isPending` inklusive |

Nach einer erfolgreichen Action setzt React unkontrollierte Felder automatisch zurück.

> [!PRAXIS]
> Für große Formulare mit vielen Regeln nutzen Teams oft Bibliotheken wie React Hook Form zusammen mit
> einem Schema (z. B. Zod). Die Grundlagen – kontrollierte Felder, `name`, `FormData` – brauchst du dort trotzdem.

## Zusammenfassung

- Ein **eigener Hook** ist eine `use…`-Funktion, die Hooks aufruft und Logik wiederverwendbar macht.
- Hooks teilen Logik, nicht State – jeder Aufruf hat eigenen State.
- Kontrollierte Formulare halten jeden Wert in State und eignen sich für Live-Validierung.
- In React 19 nimmt `<form action={fn}>` eine Funktion, die `FormData` bekommt.
- `useActionState(aktion, start)` liefert `[state, formAction, isPending]`.
