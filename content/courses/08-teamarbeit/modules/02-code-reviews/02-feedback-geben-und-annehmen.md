---
title: Feedback geben und annehmen
summary: Wie du Review-Kommentare freundlich, konkret und begründet schreibst, sie mit Präfixen einordnest und wie du selbst gut mit Kritik umgehst.
duration: 20
sources:
  - title: Conventional Comments
    url: https://conventionalcomments.org/
  - title: Google Engineering Practices – How to write code review comments
    url: https://google.github.io/eng-practices/review/reviewer/comments.html
  - title: Google Engineering Practices – Handling pushback in code reviews
    url: https://google.github.io/eng-practices/review/reviewer/pushback.html
quiz:
  - type: single
    question: Welcher Kommentar ist am hilfreichsten?
    options:
      - "Das ist falsch."
      - "Warum machst du das so kompliziert?"
      - "issue: Bei einem leeren Array liefert `max()` hier einen Fehler. Magst du vorher auf `[]` prüfen?"
    answer: 2
    explanation: Der dritte Kommentar ist konkret (wo und wann), begründet (was passiert) und schlägt freundlich eine Lösung vor.
  - type: match
    question: Ordne jedem Präfix seine Bedeutung zu.
    pairs:
      - { left: "nit:", right: "Kleinigkeit, blockiert den Merge nicht" }
      - { left: "issue:", right: "Ein echtes Problem, das gelöst werden sollte" }
      - { left: "question:", right: "Verständnisfrage an die Autorin" }
      - { left: "praise:", right: "Lob für eine gelungene Stelle" }
    explanation: Präfixe nach Conventional Comments machen sofort klar, wie wichtig ein Kommentar ist.
  - type: multiple
    question: Du bekommst zehn Review-Kommentare zu deinem Pull Request. Was ist eine gute Reaktion? (mehrere Antworten)
    options:
      - Jeden Kommentar beantworten oder umsetzen
      - Bei Unklarheit nachfragen, was gemeint ist
      - Kommentare, die dir nicht gefallen, ohne Antwort als erledigt markieren
      - Bei längerer Uneinigkeit kurz telefonieren statt endlos zu schreiben
    answers: [0, 1, 3]
    explanation: Jeder Kommentar verdient eine Reaktion. Uneinigkeit klärt man am besten im direkten Gespräch.
  - type: cloze
    text: Ein Kommentar mit dem Zusatz `(___)` darf den Merge nicht aufhalten, etwa `suggestion (non-blocking):`.
    blanks:
      - [non-blocking]
    explanation: "Conventional Comments erlauben Zusätze wie `(blocking)` oder `(non-blocking)`, um die Dringlichkeit klarzustellen."
tasks:
  - id: kommentare-einordnen
    type: dragdrop
    title: Welches Präfix passt?
    description: Ordne jedem Review-Kommentar das passende Präfix nach Conventional Comments zu.
    targets:
      - { id: nit, label: "nit:" }
      - { id: issue, label: "issue:" }
      - { id: question, label: "question:" }
      - { id: praise, label: "praise:" }
      - { id: suggestion, label: "suggestion:" }
    items:
      - { label: "Hier fehlt ein Leerzeichen im Text der Fehlermeldung", target: nit }
      - { label: "Gäste können über diese Route fremde Rechnungen herunterladen", target: issue }
      - { label: "Warum lädst du hier alle Bestellungen statt nur die des Monats?", target: question }
      - { label: "Sehr schön, dass du den Sonderfall mit einem eigenen Test abdeckst!", target: praise }
      - { label: "Wir könnten die doppelte Logik in eine gemeinsame Funktion auslagern", target: suggestion }
    hints:
      - "issue ist für echte Fehler, nit für Kleinigkeiten, suggestion für Verbesserungsideen."
  - id: kommentar-parsen
    type: code
    language: js
    title: Review-Kommentare automatisch einordnen
    description: |
      Schreibe `parseReviewComment(text)`. Ein Kommentar beginnt mit einem Label, optional einem Zusatz in
      Klammern, dann `: ` und dem Text – etwa `suggestion (non-blocking): extract a function`.

      Gib `{ label, blocking, text }` zurück:

      - `blocking` ist `true` für das Label `issue` und für jeden Kommentar mit dem Zusatz `(blocking)`.
      - Der Zusatz `(non-blocking)` macht einen Kommentar immer nicht-blockierend.
      - Kommentare ohne erkennbares Label ergeben `{ label: null, blocking: false, text }` mit dem ganzen Text.
    starter: |
      function parseReviewComment(text) {
        // Muster: label (zusatz): text
      }
    tests:
      - name: Kleinigkeit blockiert nicht
        code: |
          assertDeepEqual(parseReviewComment('nit: typo in message'), { label: 'nit', blocking: false, text: 'typo in message' })
      - name: Ein issue blockiert
        code: |
          assertDeepEqual(parseReviewComment('issue: guests can see invoices'), { label: 'issue', blocking: true, text: 'guests can see invoices' })
      - name: Zusätze steuern blocking
        code: |
          assertDeepEqual(parseReviewComment('suggestion (blocking): add a test'), { label: 'suggestion', blocking: true, text: 'add a test' })
          assertDeepEqual(parseReviewComment('issue (non-blocking): rename later'), { label: 'issue', blocking: false, text: 'rename later' })
      - name: Kommentar ohne Label
        code: |
          assertDeepEqual(parseReviewComment('Looks good to me'), { label: null, blocking: false, text: 'Looks good to me' })
          assertDeepEqual(parseReviewComment(''), { label: null, blocking: false, text: '' })
    hints:
      - "Ein regulärer Ausdruck wie `^(\\w+)(?: \\(([\\w-]+)\\))?: (.*)$` liefert Label, Zusatz und Text."
      - "Prüfe den Zusatz zuerst: `non-blocking` → false, `blocking` → true, sonst entscheidet das Label."
    solution: |
      function parseReviewComment(text) {
        const match = /^(\w+)(?: \(([\w-]+)\))?: (.*)$/.exec(text)
        if (!match) return { label: null, blocking: false, text }
        const [, label, decoration, body] = match
        let blocking = label === 'issue'
        if (decoration === 'blocking') blocking = true
        if (decoration === 'non-blocking') blocking = false
        return { label, blocking, text: body }
      }
---

„Das ist Quatsch.“ – Drei Wörter in einem Review-Kommentar, und die Stimmung im Team ist für den Tag
dahin. Dabei hatte die Reviewerin recht: Der Code hatte einen Fehler. Sie hat ihn nur so mitgeteilt, dass
niemand mehr zuhören wollte. Feedback ist ein Handwerk, das man lernen kann.

## Gutes Feedback ist konkret, begründet und freundlich

Ein hilfreicher [[review-kommentar|Review-Kommentar]] erfüllt drei Bedingungen:

1. **Konkret:** Er zeigt auf eine Stelle und beschreibt die Situation, in der etwas schiefgeht.
2. **Begründet:** Er erklärt, **warum** etwas ein Problem ist.
3. **Freundlich:** Er richtet sich an den Code, nicht an die Person, und bietet Hilfe an.

| Statt … | … besser |
|---|---|
| „Das ist falsch.“ | „Bei einem leeren Warenkorb wird hier durch 0 geteilt. Magst du vorher prüfen?“ |
| „Warum machst du das so?“ | „Ich verstehe noch nicht, warum hier zweimal geladen wird. Gibt es einen Grund?“ |
| „Du hast die Tests vergessen.“ | „Für den Fall ‚Gutschein abgelaufen‘ fehlt noch ein Test.“ |
| „Unlesbar.“ | „Ein Name wie `$netPriceInCents` statt `$x` würde mir beim Lesen helfen.“ |

Fragen wirken oft besser als Befehle. „Was hältst du davon, …?“ lädt zum Nachdenken ein. Und vergiss das
Lob nicht: Wer gute Stellen benennt, zeigt, dass er genau gelesen hat.

> [!MERKSATZ]
> Schreibe jeden Kommentar so, als würdest du ihn der Person direkt ins Gesicht sagen – mit Begründung und
> Lösungsvorschlag.

## Präfixe machen die Wichtigkeit klar

Nicht jeder Kommentar ist gleich wichtig. Ein falsches Komma ist kein Sicherheitsproblem. Damit die Autorin
das sofort erkennt, nutzen viele Teams [[conventional-comments|Conventional Comments]]: ein Präfix am Anfang
jedes Kommentars.

```text title="Kommentare mit Präfix"
praise: Schön, dass du den abgelaufenen Gutschein extra testest.
nit: Tippfehler in der Fehlermeldung ("Gutschien").
question: Brauchen wir hier wirklich alle Bestellungen oder nur die des Monats?
suggestion (non-blocking): Die Preislogik könnte in eine eigene Funktion.
issue: Gäste können über /invoices/{id} fremde Rechnungen laden.
```

Ein [[nitpick|Nitpick]] („nit“) ist eine Kleinigkeit, die den Merge nie blockiert. Ein `issue` dagegen
muss gelöst werden. Mit den Zusätzen `(blocking)` und `(non-blocking)` wird es noch eindeutiger.

> [!FEHLER]
> **Zwanzig Nitpicks, null Hinweise auf Wichtiges.** Wer sich in Kleinigkeiten verliert, übersieht die
> echten Probleme – und die Autorin fühlt sich zerpflückt. Konzentriere dich auf das, was zählt.

## Feedback annehmen

Kritik am eigenen Code fühlt sich manchmal persönlich an. Sie ist es aber nicht. Die Reviewerin investiert
Zeit, um **deinen** Code besser zu machen. Diese Haltung hilft dir:

- **Danke sagen** und jeden Kommentar beantworten – mit einer Änderung oder einer Begründung.
- **Nachfragen**, wenn du etwas nicht verstehst, statt zu raten.
- **Begründen**, wenn du anderer Meinung bist. Vielleicht kennst du einen Umstand, den die Reviewerin nicht
  kennt.
- **Schnell reagieren**, damit der Pull Request nicht tagelang liegt.

```text title="Antworten auf Kommentare"
> issue: Gäste können fremde Rechnungen laden.
Danke, sehr guter Fund! Behoben in a1b2c3d, inklusive Test.

> suggestion (non-blocking): Preislogik in eigene Funktion?
Gute Idee. Ich habe SHOP-131 angelegt, damit dieser PR klein bleibt.
```

## Wenn man sich nicht einig wird

Manchmal geht ein Kommentar fünfmal hin und her. Spätestens dann hilft Schreiben nicht mehr. Ein kurzer
Anruf oder ein Gespräch am Schreibtisch klärt in fünf Minuten, was schriftlich eine Stunde dauert. Das
Ergebnis schreibt ihr danach als Kommentar in den Pull Request, damit andere es nachlesen können.

> [!PRAXIS]
> In vielen Teams gilt: Wer einen Kommentar schreibt, markiert ihn erst als erledigt, wenn die Autorin
> reagiert hat. Und bei Geschmacksfragen ohne Teamregel entscheidet die Person, die den Code geschrieben
> hat.

## Zusammenfassung

- Gutes Feedback ist konkret, begründet und freundlich – es kritisiert Code, nicht Menschen.
- Fragen und Lösungsvorschläge wirken besser als Befehle; Lob gehört dazu.
- Präfixe wie `nit:`, `question:`, `suggestion:`, `issue:` und `praise:` zeigen die Wichtigkeit.
- Beim Annehmen: danken, jeden Kommentar beantworten, nachfragen, begründet widersprechen.
- Lange Diskussionen klärt ihr synchron und haltet das Ergebnis schriftlich fest.
