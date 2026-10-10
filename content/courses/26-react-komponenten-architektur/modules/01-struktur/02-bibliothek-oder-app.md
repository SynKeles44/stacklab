---
title: Bibliothek oder App? Wo eine Komponente hingehört
summary: Ein Entscheidungsbaum für die Frage, ob eine Komponente in die gemeinsame Komponentenbibliothek gehört oder in der App bleibt – und wann du sie hochstufst.
duration: 20
sources:
  - title: react.dev – Thinking in React
    url: https://react.dev/learn/thinking-in-react
  - title: Storybook – Why Storybook?
    url: https://storybook.js.org/docs/get-started/why-storybook
  - title: npm Docs – Workspaces
    url: https://docs.npmjs.com/cli/using-npm/workspaces
quiz:
  - type: single
    question: Du baust ein `OrderStatusBadge`, das aus einem Bestellstatus wie `shipped` eine Farbe und einen deutschen Text macht. Es gibt nur eine App, die es braucht. Wohin gehört es?
    options:
      - In die gemeinsame Komponentenbibliothek, damit es wiederverwendet werden kann.
      - In die App, denn es kennt fachliche Begriffe und hat nur einen Nutzer.
      - In beide, als Kopie.
    answer: 1
    explanation: >
      Die Komponente kennt die Domäne „Bestellung“ und hat genau einen Nutzer. Sie bleibt in der App. Der
      allgemeine Teil – ein farbiges Badge – kann in der Bibliothek liegen und von ihr benutzt werden.
  - type: multiple
    question: Was erwartest du von einer Komponente in der gemeinsamen Bibliothek?
    options:
      - Sie hat mindestens eine Story.
      - Sie importiert Code aus einer App, um an Daten zu kommen.
      - Sie kennt keine fachlichen Begriffe wie Bestellung oder Kunde.
      - Ihre Props sind stabil und dokumentiert, weil mehrere Teams sie nutzen.
    answers: [0, 2, 3]
    explanation: >
      Bibliothekskomponenten sind allgemein, dokumentiert und gut getestet. Die Abhängigkeit zeigt immer von
      der App zur Bibliothek – nie umgekehrt.
  - type: cloze
    text: "Eine App-Komponente wird in die Bibliothek hochgestuft, sobald es einen ___ Nutzer gibt. Abhängigkeiten zeigen immer von der ___ zur Bibliothek."
    blanks:
      - [zweiten, 2., weiteren]
      - [App, Anwendung]
    explanation: Erst der zweite Nutzer beweist, dass sich eine allgemeine Version lohnt. Die Bibliothek darf die Apps nie kennen.
  - type: find-bug
    question: Diese Datei liegt in der gemeinsamen Bibliothek `packages/ui`. Welche Zeile verletzt die Architekturregel?
    language: tsx
    code: |
      import { cn } from '../lib/cn'
      import { useCurrentUser } from '../../../apps/shop/src/auth/use-current-user'

      export function Avatar({ className, ...props }: React.ComponentProps<'img'>) {
        return <img data-slot="avatar" className={cn('rounded-full', className)} {...props} />
      }
    bug_line: 2
    explanation: >
      Die Bibliothek importiert Code aus einer App. Damit zeigt die Abhängigkeit in die falsche Richtung, und
      keine andere App könnte das Avatar noch nutzen. Die Daten gehören als Prop hinein.
tasks:
  - id: entscheidungsbaum
    type: steps
    title: Den Entscheidungsbaum durchlaufen
    description: Ein Team baut einen Shop und ein Admin-Portal in einem Monorepo. Entscheide bei jeder Komponente, wo sie hingehört.
    steps:
      - situation: Du brauchst einen `DatePicker`. Er kennt keine fachlichen Begriffe, und bisher braucht ihn nur der Shop.
        question: Wohin legst du ihn zuerst?
        options:
          - Direkt in die Bibliothek, mit Story.
          - In den Shop, nah an der Funktion, die ihn braucht.
          - In beide Apps als Kopie.
        answer: 1
        explanation: Ohne zweiten Nutzer bleibt die Komponente in der App. So musst du keine allgemeine API raten, die vielleicht nie gebraucht wird.
      - situation: Ein halbes Jahr später braucht auch das Admin-Portal den DatePicker.
        question: Was ist jetzt der richtige Schritt?
        options:
          - Die Datei in das Admin-Portal kopieren.
          - Den DatePicker in die Bibliothek hochstufen, eine Story schreiben und beide Apps umstellen.
          - Das Admin-Portal aus dem Shop importieren lassen.
        answer: 1
        explanation: Der zweite Nutzer ist das Signal zum Hochstufen. Apps importieren nie voneinander – nur aus der Bibliothek.
      - situation: Der `CustomerCard` zeigt Name, Kundennummer und offene Rechnungen. Beide Apps brauchen sie.
        question: Wohin gehört die fachliche Komponente?
        options:
          - In die Bibliothek, so wie sie ist.
          - Der allgemeine Rahmen (Card) kommt in die Bibliothek, die fachliche CustomerCard in ein gemeinsames Fach-Paket oder in die Apps.
          - Sie wird zweimal neu geschrieben.
        answer: 1
        explanation: Die UI-Bibliothek bleibt frei von Fachbegriffen. Fachliches, das mehrere Apps teilen, bekommt ein eigenes Paket, das die Bibliothek benutzt.
  - id: bibliothek-oder-app
    type: dragdrop
    title: Bibliothek oder App?
    description: Ziehe jede Komponente an den Ort, an den sie gehört. Gehe davon aus, dass alle allgemeinen Komponenten bereits mehrere Nutzer haben.
    targets:
      - { id: bibliothek, label: "Gemeinsame Bibliothek (packages/ui)" }
      - { id: app, label: "In der App (apps/shop)" }
    items:
      - { label: "Button mit Varianten", target: bibliothek }
      - { label: "Tabs als Compound Component", target: bibliothek }
      - { label: "Dialog mit Fokus-Falle", target: bibliothek }
      - { label: "Checkout-Formular mit Versandarten", target: app }
      - { label: "Warenkorb-Organismus mit Preisberechnung", target: app }
      - { label: "Badge, das einen Bestellstatus übersetzt", target: app }
    hints:
      - Kennt die Komponente Begriffe wie Bestellung, Warenkorb oder Versand? Dann ist sie fachlich.
---
Du baust ein schönes `DatePicker`-Feld. Gehört es in die gemeinsame Komponentenbibliothek, damit alle Teams
es nutzen können? Oder bleibt es in deiner App? Wer hier falsch entscheidet, bekommt entweder eine
Bibliothek voller Sonderfälle – oder fünf Kopien desselben Feldes.

![Entscheidungsbaum: Fachlich? Zweiter Nutzer? Allgemein formulierbar?](/assets/react-komponenten-architektur/bibliothek-oder-app.svg)

## Zwei Orte für Komponenten

In größeren Projekten gibt es zwei Arten von Komponenten:

| | Gemeinsame Bibliothek | App-lokal |
|---|---|---|
| Ort | z. B. `packages/ui` in einem [[monorepo\|Monorepo]] | z. B. `apps/shop/src/features/checkout` |
| Inhalt | Allgemeine Bausteine: Button, Tabs, Dialog | [[domaenen-komponente\|Fachliche Komponenten]]: Warenkorb, Checkout |
| Nutzer | Mehrere Apps und Teams | Eine App |
| Pflichten | Story, Tests, stabile Props, Barrierefreiheit | Tests nach Bedarf |

Die [[komponentenbibliothek|Komponentenbibliothek]] ist ein Versprechen: Wer sie benutzt, verlässt sich
darauf, dass `Button` morgen noch dieselben Props hat. Jede Komponente dort kostet also Pflege.

> [!MERKSATZ]
> Abhängigkeiten zeigen **immer von der App zur Bibliothek**. Die Bibliothek kennt keine App und keine
> fachlichen Begriffe.

## Der Entscheidungsbaum

Stell dir für jede neue Komponente drei Fragen – in dieser Reihenfolge:

1. **Ist sie fachlich?** Kennt sie Begriffe wie Bestellung, Kunde oder Rechnung, oder ruft sie eine
   [[api|API]] auf? → Sie bleibt in der App.
2. **Gibt es schon einen zweiten Nutzer?** Nein → Sie bleibt vorerst in der App, nah am Feature.
3. **Lässt sie sich allgemein formulieren**, ohne fachliche Props wie `orderStatus`? Ja → ab in die
   Bibliothek, **mit Story**. Nein → teile sie: Der allgemeine Teil wandert in die Bibliothek, der
   fachliche bleibt in der App.

Diesen Ablauf nennt man einen [[entscheidungsbaum|Entscheidungsbaum]]: Jede Antwort führt zu genau
einer nächsten Frage oder zu einem Ergebnis.

> [!FEHLER]
> **„Das brauchen wir bestimmt mal wieder.“** Wer Komponenten auf Vorrat in die Bibliothek legt, rät
> eine API, die der zweite Nutzer dann doch anders braucht. Warte auf den echten zweiten Nutzer.

## Hochstufen, wenn der zweite Nutzer kommt

Das Hochstufen (englisch *promote*) läuft immer gleich ab:

1. Datei nach `packages/ui/src/atoms|molecules|organisms/` verschieben.
2. Fachliche Reste entfernen: Statt `orderStatus` bekommt das Badge `variant` und `children`.
3. Eine **Story** schreiben – sie ist Dokumentation und Test zugleich.
4. Beide Apps auf den neuen Import umstellen und die alte Datei löschen.

```tsx title="apps/shop/src/features/orders/order-status-badge.tsx"
import { Badge } from '@example/ui/atoms/badge'

const labels = { shipped: 'Versandt', open: 'Offen' } as const

export function OrderStatusBadge({ status }: { status: keyof typeof labels }) {
  return <Badge variant={status === 'shipped' ? 'success' : 'neutral'}>{labels[status]}</Badge>
}
```

Die fachliche Komponente bleibt in der App und **benutzt** die allgemeine aus der Bibliothek. So
entsteht eine saubere Schichtung.

## Wie die Bibliothek eingebunden wird

In einem Monorepo ist die Bibliothek ein eigenes [[paket|Paket]] mit eigener `package.json`. Die Apps
binden sie über [[workspace|Workspaces]] ein – ohne Umweg über die [[npm-registry|npm-Registry]]:

```json title="apps/shop/package.json (Ausschnitt)"
{
  "dependencies": {
    "@example/ui": "workspace:*"
  }
}
```

Der Platzhalter `workspace:*` wird von pnpm, Yarn und Bun verstanden. npm verlinkt Workspaces
automatisch, dort reicht ein normaler Versionsbereich. Details zu Monorepos lernst du im Kurs
*Monorepos und Workspaces*.

> [!PRAXIS]
> Teams legen die Regel oft schriftlich fest: „Allgemeine Komponenten → Bibliothek mit Story. Fachliche
> Komponenten → App. Hochstufen beim zweiten Nutzer.“ Im Code-Review genügt dann ein Verweis auf diese
> Regel statt einer langen Diskussion.

## Zusammenfassung

- Es gibt die **gemeinsame Bibliothek** (allgemein) und **App-lokale** Komponenten (fachlich).
- Fachliche Komponenten bleiben in der App – auch wenn sie groß und schön sind.
- Allgemeine Komponenten wandern erst beim **zweiten Nutzer** in die Bibliothek.
- Jede Bibliothekskomponente bekommt eine **Story** und stabile Props.
- Abhängigkeiten zeigen von der App zur Bibliothek, Apps importieren nie voneinander.
- Ist eine Komponente halb fachlich, halb allgemein: teilen statt kopieren.
