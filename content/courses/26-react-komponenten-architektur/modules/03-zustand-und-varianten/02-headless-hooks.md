---
title: Headless – Verhalten ohne Aussehen
summary: Wie du Logik, Tastaturbedienung und ARIA-Attribute in einen Hook mit Prop-Gettern auslagerst, damit verschiedene Oberflächen dasselbe Verhalten teilen.
duration: 25
sources:
  - title: react.dev – Reusing Logic with Custom Hooks
    url: https://react.dev/learn/reusing-logic-with-custom-hooks
  - title: WAI-ARIA Authoring Practices – Disclosure Pattern
    url: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
  - title: WAI-ARIA Authoring Practices – Keyboard Interface (Roving tabindex)
    url: https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/
  - title: React Aria – Hooks
    url: https://react-spectrum.adobe.com/react-aria/hooks.html
quiz:
  - type: single
    question: Was liefert eine **headless** Komponente bzw. ein headless Hook?
    options:
      - Fertig gestaltete Komponenten mit festem Design
      - Zustand, Verhalten, Tastaturbedienung und ARIA-Attribute – aber kein Aussehen
      - Nur CSS-Klassen ohne JavaScript
    answer: 1
    explanation: >
      „Headless“ heißt ohne Kopf, also ohne Oberfläche. Du bekommst die schwierige Logik und gestaltest das
      Markup komplett selbst.
  - type: multiple
    question: Warum geben Headless Hooks oft **Prop-Getter** wie `getTriggerProps()` zurück statt einzelner Werte?
    options:
      - Der Aufrufer kann alle nötigen Attribute und Handler mit einem Spread anbringen.
      - Eigene Handler des Aufrufers lassen sich mit denen des Hooks zusammenführen.
      - Der Hook kann später neue ARIA-Attribute ergänzen, ohne dass Aufrufer ihren Code ändern.
      - Prop-Getter machen Komponenten automatisch schneller.
    answers: [0, 1, 2]
    explanation: >
      Ein Prop-Getter bündelt alles, was ein Element braucht. Ändert sich das Verhalten im Hook, profitieren alle
      Aufrufer automatisch.
  - type: cloze
    text: "Bei einer Tab-Liste ist nur der aktive Tab mit Tab-Taste erreichbar (`tabIndex={0}`), alle anderen haben `tabIndex={___}`. Zwischen ihnen wechselst du mit den ___tasten."
    blanks:
      - ["-1"]
      - [Pfeil, pfeil]
    explanation: Diese Technik heißt „Roving tabindex“. Die Tab-Taste springt zur ganzen Gruppe, die Pfeiltasten bewegen sich darin.
  - type: find-bug
    question: "Der Aufrufer schreibt `<button {...getTriggerProps({ onClick: logge })}>`. Sein `logge` wird nie aufgerufen. Welche Zeile ist schuld?"
    language: tsx
    code: |
      function getTriggerProps(eigene: React.ComponentProps<'button'> = {}) {
        return {
          ...eigene,
          'aria-expanded': open,
          'aria-controls': contentId,
          onClick: () => setOpen(!open),
        }
      }
    bug_line: 6
    explanation: >
      Das `onClick` des Hooks überschreibt das des Aufrufers. Richtig ist, beide aufzurufen:
      `onClick: (e) => { eigene.onClick?.(e); setOpen(!open) }`.
tasks:
  - id: use-disclosure
    type: code
    language: tsx
    title: Ein Headless Hook mit Prop-Gettern
    description: |
      Baue den Hook `useDisclosure()` für etwas, das sich auf- und zuklappen lässt (Menü, FAQ, Filterleiste).

      1. Er hält `open` (Start `false`) und erzeugt mit `React.useId()` eine ID für den Inhalt.
      2. `getTriggerProps(eigene = {})` liefert: alle `eigene` Props, `aria-expanded`, `aria-controls` mit der ID
         und ein `onClick`, das **zuerst** `eigene.onClick` aufruft und dann umschaltet.
      3. `getContentProps(eigene = {})` liefert: alle `eigene` Props, die `id` und `hidden: !open`.
      4. Drückt jemand im Inhalt `Escape` (`onKeyDown`), schließt sich der Inhalt.
      5. Der Hook gibt `{ open, getTriggerProps, getContentProps }` zurück.

      `App` nutzt den Hook für zwei **völlig unterschiedlich** aussehende Komponenten – das ist der Sinn von headless.
    starter: |
      function useDisclosure() {
        const [open, setOpen] = React.useState(false)
        return {
          open,
          getTriggerProps: (eigene: React.ComponentProps<'button'> = {}) => eigene,
          getContentProps: (eigene: React.ComponentProps<'div'> = {}) => eigene,
        }
      }

      function FaqEintrag() {
        const { getTriggerProps, getContentProps } = useDisclosure()
        return (
          <section>
            <button {...getTriggerProps({ className: 'faq-frage' })}>Wie lange dauert der Versand?</button>
            <div {...getContentProps({ className: 'faq-antwort' })}>Zwei Werktage.</div>
          </section>
        )
      }

      function Filterleiste({ onOeffnen }: { onOeffnen: () => void }) {
        const { open, getTriggerProps, getContentProps } = useDisclosure()
        return (
          <aside>
            <button {...getTriggerProps({ className: 'filter-knopf', onClick: onOeffnen })}>
              Filter {open ? 'ausblenden' : 'anzeigen'}
            </button>
            <div {...getContentProps({ className: 'filter-inhalt' })}>
              <input aria-label="Preis bis" />
            </div>
          </aside>
        )
      }

      function App() {
        const [klicks, setKlicks] = React.useState(0)
        return (
          <div>
            <FaqEintrag />
            <Filterleiste onOeffnen={() => setKlicks((n) => n + 1)} />
            <output>{klicks}</output>
          </div>
        )
      }
    tests:
      - name: am Anfang ist der Inhalt versteckt und verknüpft
        code: |
          const frage = query('.faq-frage')
          const antwort = query('.faq-antwort')
          assertEqual(frage.getAttribute('aria-expanded'), 'false')
          assertTrue(antwort.hidden, 'Die Antwort sollte am Anfang hidden sein.')
          assertTrue(Boolean(antwort.id), 'Der Inhalt braucht eine id.')
          assertEqual(frage.getAttribute('aria-controls'), antwort.id)
      - name: ein Klick öffnet den Inhalt
        code: |
          await click('.faq-frage')
          assertEqual(query('.faq-frage').getAttribute('aria-expanded'), 'true')
          assertEqual(query('.faq-antwort').hidden, false)
      - name: eigene Handler des Aufrufers laufen mit
        code: |
          await click('.filter-knopf')
          assertEqual(query('output').textContent, '1')
          assertEqual(query('.filter-knopf').textContent, 'Filter ausblenden')
      - name: Escape im Inhalt schließt ihn
        code: |
          query('.filter-inhalt input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
          await new Promise((fertig) => setTimeout(fertig, 0))
          assertEqual(query('.filter-knopf').getAttribute('aria-expanded'), 'false')
          assertTrue(query('.filter-inhalt').hidden, 'Nach Escape sollte der Inhalt wieder versteckt sein.')
    hints:
      - "`const id = React.useId()` liefert eine eindeutige ID, die sich zwischen Renderings nicht ändert."
      - "Handler zusammenführen: `onClick: (e) => { eigene.onClick?.(e); setOpen(!open) }`."
      - "Für den Inhalt: `onKeyDown: (e) => { eigene.onKeyDown?.(e); if (e.key === 'Escape') setOpen(false) }`."
    solution: |
      function useDisclosure() {
        const [open, setOpen] = React.useState(false)
        const id = React.useId()
        return {
          open,
          getTriggerProps: (eigene: React.ComponentProps<'button'> = {}) => ({
            ...eigene,
            'aria-expanded': open,
            'aria-controls': id,
            onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
              eigene.onClick?.(e)
              setOpen(!open)
            },
          }),
          getContentProps: (eigene: React.ComponentProps<'div'> = {}) => ({
            ...eigene,
            id,
            hidden: !open,
            onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
              eigene.onKeyDown?.(e)
              if (e.key === 'Escape') setOpen(false)
            },
          }),
        }
      }

      function FaqEintrag() {
        const { getTriggerProps, getContentProps } = useDisclosure()
        return (
          <section>
            <button {...getTriggerProps({ className: 'faq-frage' })}>Wie lange dauert der Versand?</button>
            <div {...getContentProps({ className: 'faq-antwort' })}>Zwei Werktage.</div>
          </section>
        )
      }

      function Filterleiste({ onOeffnen }: { onOeffnen: () => void }) {
        const { open, getTriggerProps, getContentProps } = useDisclosure()
        return (
          <aside>
            <button {...getTriggerProps({ className: 'filter-knopf', onClick: onOeffnen })}>
              Filter {open ? 'ausblenden' : 'anzeigen'}
            </button>
            <div {...getContentProps({ className: 'filter-inhalt' })}>
              <input aria-label="Preis bis" />
            </div>
          </aside>
        )
      }

      function App() {
        const [klicks, setKlicks] = React.useState(0)
        return (
          <div>
            <FaqEintrag />
            <Filterleiste onOeffnen={() => setKlicks((n) => n + 1)} />
            <output>{klicks}</output>
          </div>
        )
      }
  - id: verhalten-oder-aussehen
    type: dragdrop
    title: Hook oder Oberfläche?
    description: Ein Team trennt seine Komponenten in einen Headless Hook und eine gestaltete Komponente. Ordne jede Aufgabe dem richtigen Teil zu.
    targets:
      - { id: hook, label: "Headless Hook (Verhalten)" }
      - { id: ui, label: "Gestaltete Komponente (Aussehen)" }
    items:
      - { label: "Merken, ob das Menü offen ist", target: hook }
      - { label: "aria-expanded und aria-controls setzen", target: hook }
      - { label: "Mit Escape schließen", target: hook }
      - { label: "Pfeiltasten zwischen Einträgen", target: hook }
      - { label: "Abgerundete Ecken und Schatten", target: ui }
      - { label: "Icon neben dem Text", target: ui }
      - { label: "Animation beim Aufklappen", target: ui }
    hints:
      - Würde sich die Aufgabe ändern, wenn die Firma ein neues Design bekommt? Dann gehört sie zum Aussehen.
---
Zwei Apps deiner Firma brauchen ein aufklappbares Menü. Die eine im verspielten Shop-Design, die andere
nüchtern im Admin-Portal. Das Aussehen ist völlig verschieden – aber das **Verhalten** ist identisch:
öffnen, schließen, Escape, Tastatur, ARIA-Attribute. Dieses Verhalten zweimal zu schreiben, ist doppelte
Arbeit und doppelte Fehlerquelle.

## Verhalten und Aussehen trennen

Jede interaktive Komponente besteht aus zwei Schichten:

| Schicht | Inhalt | Ändert sich bei neuem Design? |
|---|---|---|
| **Verhalten** | Zustand, Klick- und Tastaturlogik, Fokus, ARIA-Attribute | nein |
| **Aussehen** | Markup, Klassen, Icons, Animationen | ja |

Eine [[headless-komponente|headless Komponente]] liefert nur die erste Schicht. „Headless“ heißt
wörtlich „ohne Kopf“ – ohne sichtbare Oberfläche. Du bekommst die schwierige Logik geschenkt und
gestaltest jedes Pixel selbst.

Bekannte headless Bibliotheken sind Radix Primitives, Base UI und React Aria. shadcn/ui setzt darauf
nur noch Tailwind-Klassen – deshalb kannst du das Aussehen dort so frei ändern.

> [!MERKSATZ]
> Headless heißt: **Verhalten wiederverwenden, Aussehen frei wählen.** Die Logik steckt in einem Hook
> oder einer ungestylten Komponente, das Design in deinem Code.

## Ein Headless Hook

Die einfachste Form ist ein [[eigener-hook|eigener Hook]]. Er kennt kein Markup, sondern liefert alles,
was das Markup braucht:

```tsx title="use-disclosure.ts"
function useDisclosure() {
  const [open, setOpen] = React.useState(false)
  const id = React.useId()
  return {
    open,
    getTriggerProps: () => ({
      'aria-expanded': open,
      'aria-controls': id,
      onClick: () => setOpen(!open),
    }),
    getContentProps: () => ({ id, hidden: !open }),
  }
}
```

`React.useId()` erzeugt eine eindeutige ID, damit der Trigger per `aria-controls` auf seinen Inhalt
zeigen kann. Zwei völlig verschiedene Komponenten nutzen denselben Hook:

```tsx
function FaqEintrag() {
  const { getTriggerProps, getContentProps } = useDisclosure()
  return (
    <section className="border-b py-4">
      <button {...getTriggerProps()} className="font-semibold">Versand?</button>
      <p {...getContentProps()}>Zwei Werktage.</p>
    </section>
  )
}
```

## Prop-Getter

Die Funktionen `getTriggerProps` und `getContentProps` heißen [[prop-getter|Prop-Getter]]. Sie liefern
ein Objekt, das du per Spread an ein Element hängst. Das hat zwei Vorteile:

- **Alles auf einmal:** Der Aufrufer muss nicht wissen, welche ARIA-Attribute nötig sind.
- **Erweiterbar:** Ergänzt der Hook später `onKeyDown`, profitieren alle Aufrufer ohne Änderung.

Wichtig ist, dass der Aufrufer **eigene** Props mitgeben kann, ohne die des Hooks zu zerstören:

```tsx
getTriggerProps: (eigene: React.ComponentProps<'button'> = {}) => ({
  ...eigene,
  'aria-expanded': open,
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
    eigene.onClick?.(e) // zuerst der Handler des Aufrufers
    setOpen(!open)      // dann das eigene Verhalten
  },
})
```

> [!FEHLER]
> **Handler einfach überschreiben.** Steht `onClick` des Hooks einfach hinter `...eigene`, geht der Handler
> des Aufrufers verloren – und niemand merkt es, bis ein Tracking-Klick fehlt. Handler werden immer
> **verkettet**.

## Tastatur: Roving tabindex

Zum Verhalten gehört auch die Tastatur. Für Gruppen wie Tabs oder Menüs gilt das Muster
[[roving-tabindex|Roving tabindex]]: Nur das aktive Element hat `tabIndex={0}` und ist mit der Tab-Taste
erreichbar, alle anderen haben `tabIndex={-1}`. Mit den Pfeiltasten wanderst du innerhalb der Gruppe.
Für Menschen, die keine Maus nutzen, ist das der Unterschied zwischen „bedienbar“ und „nach zehn
Tab-Drücken frustriert aufgegeben“ – [[barrierefreiheit|Barrierefreiheit]] ist also Teil des Verhaltens:

```tsx
function onKeyDown(e: React.KeyboardEvent) {
  const i = werte.indexOf(aktiv)
  if (e.key === 'ArrowRight') setAktiv(werte[(i + 1) % werte.length])
  if (e.key === 'ArrowLeft') setAktiv(werte[(i - 1 + werte.length) % werte.length])
}
```

Solche Details sind der Grund, warum Teams für komplexe Bausteine wie Dialoge, Menüs oder Comboboxen
fast immer eine erprobte headless Bibliothek nutzen: Fokus-Falle, Scroll-Sperre und Screenreader-Ansagen
korrekt hinzubekommen, kostet Wochen.

> [!PRAXIS]
> Faustregel im Team: Einfache Bausteine (Disclosure, Tabs) dürft ihr selbst bauen. Für Dialog, Popover,
> Select und Combobox nehmt ihr die headless Bibliothek, die eure Komponentenbibliothek schon nutzt.

## Zusammenfassung

- Interaktive Komponenten haben zwei Schichten: **Verhalten** und **Aussehen**.
- **Headless** Hooks und Komponenten liefern nur das Verhalten – das Design gestaltest du selbst.
- **Prop-Getter** wie `getTriggerProps()` bündeln Attribute und Handler für ein Element.
- Eigene Handler des Aufrufers werden **verkettet**, nie überschrieben.
- **Roving tabindex** macht Gruppen wie Tabs mit Tab- und Pfeiltasten bedienbar.
- Für komplexe Bausteine nutzt du eine erprobte headless Bibliothek wie Radix, Base UI oder React Aria.
