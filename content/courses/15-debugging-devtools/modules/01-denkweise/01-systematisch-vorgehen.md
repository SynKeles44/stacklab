---
title: Systematisch statt zufällig debuggen
summary: Der Debugging-Kreislauf aus Reproduzieren, Eingrenzen, Hypothese und Prüfen – und warum Raten so teuer ist.
duration: 20
sources:
  - title: MDN – What went wrong? Troubleshooting JavaScript
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/What_went_wrong
  - title: Stack Overflow – How to create a Minimal, Reproducible Example
    url: https://stackoverflow.com/help/minimal-reproducible-example
quiz:
  - type: single
    question: Eine Nutzerin meldet „Der Login geht manchmal nicht“. Was ist dein erster sinnvoller Schritt?
    options:
      - Den Login-Code neu schreiben, dann ist der Fehler sicher weg.
      - Herausfinden, unter welchen Bedingungen der Fehler zuverlässig auftritt.
      - Überall `console.log` einbauen und hoffen, dass etwas Auffälliges erscheint.
      - Den Server neu starten.
    answer: 1
    explanation: >
      Ohne Reproduktion kannst du weder die Ursache suchen noch prüfen, ob deine Lösung wirkt. Zuerst brauchst du
      die genauen Schritte, Daten und Umgebung, mit denen der Fehler jedes Mal auftritt.
  - type: multiple
    question: Welche Sätze sind gute, prüfbare Hypothesen?
    options:
      - „Irgendwas mit dem Datum ist kaputt.“
      - „Bei E-Mail-Adressen mit Großbuchstaben findet die Suche den Nutzer nicht, weil der Vergleich Groß-/Kleinschreibung beachtet.“
      - „Der Code ist halt alt.“
      - „Die Summe ist falsch, weil die Schleife das erste Element überspringt – mit einer Liste aus nur einem Element müsste 0 herauskommen.“
    answers: [1, 3]
    explanation: >
      Eine gute Hypothese nennt eine konkrete Ursache und sagt ein Ergebnis voraus, das du mit einem kleinen
      Experiment bestätigen oder widerlegen kannst. „Irgendwas“ und „ist halt alt“ kannst du nicht prüfen.
  - type: cloze
    text: Beim ___-Debugging erklärst du einer Gummiente Zeile für Zeile deinen Code. Ein Fehler, der nach einer Änderung zurückkehrt, obwohl er schon behoben war, heißt ___.
    blanks:
      - [Rubber-Duck, Rubber Duck, Quietscheentchen, Gummienten]
      - [Regression]
    explanation: >
      Beim Erklären merkst du oft selbst, wo Annahme und Code auseinanderlaufen. Gegen Regressionen hilft ein
      automatisierter Test, der den Fehler nachstellt.
  - type: match
    question: Ordne jedem Schritt des Kreislaufs die passende Frage zu.
    pairs:
      - { left: "Reproduzieren", right: "Wie löse ich den Fehler jedes Mal aus?" }
      - { left: "Eingrenzen", right: "In welchem Teil des Programms passiert es?" }
      - { left: "Hypothese", right: "Was genau könnte die Ursache sein?" }
      - { left: "Prüfen", right: "Bestätigt mein Experiment die Vermutung?" }
    explanation: >
      Die vier Fragen geben dir in jeder Situation einen nächsten Schritt – auch wenn du das Programm nicht
      geschrieben hast.
tasks:
  - id: beobachtung-oder-vermutung
    type: dragdrop
    title: Beobachtung, Hypothese oder Raten?
    description: >
      Beim Debuggen hilft es, sauber zu trennen, was du **gesehen** hast, was du **vermutest** und was nur
      **ungezieltes Herumprobieren** ist. Ordne jede Aussage zu.
    targets:
      - { id: beobachtung, label: Beobachtung (Fakt) }
      - { id: hypothese, label: Hypothese (prüfbar) }
      - { id: raten, label: Raten (kein System) }
    items:
      - { label: "Die Konsole meldet TypeError in warenkorb.js Zeile 42.", target: beobachtung }
      - { label: "Der Fehler tritt nur bei leerem Warenkorb auf – getestet mit 0, 1 und 3 Artikeln.", target: beobachtung }
      - { label: "Vermutlich ist `artikel` bei leerem Korb undefined, weil die API dann null liefert.", target: hypothese }
      - { label: "Wenn ich den Rabatt-Code entferne, müsste die Summe wieder stimmen.", target: hypothese }
      - { label: "Ich ändere mal ein paar Zeilen und schaue, ob es dann geht.", target: raten }
      - { label: "Ich lösche den Cache, starte alles neu und probiere es noch zehnmal.", target: raten }
    hints:
      - Eine Beobachtung hast du mit eigenen Augen gesehen. Eine Hypothese sagt ein Ergebnis voraus.
  - id: debug-sitzung
    type: steps
    title: Eine Debugging-Sitzung durchspielen
    description: >
      Ein Online-Shop berechnet bei manchen Bestellungen falsche Versandkosten. Spiel durch, wie du
      systematisch vorgehst.
    steps:
      - situation: >
          Ein Kunde schreibt: „Bei meiner Bestellung über 50,00 € musste ich Versand zahlen, obwohl ab 50 €
          versandkostenfrei angekündigt ist.“
        question: Was tust du zuerst?
        options:
          - Sofort im Code nach dem Wort „Versand“ suchen und etwas ändern.
          - Den Fall nachstellen – einen Warenkorb mit genau 50,00 € anlegen und die Versandkosten ansehen.
          - Dem Kunden schreiben, dass bei dir alles funktioniert.
        answer: 1
        explanation: Erst reproduzieren. Mit genau 50,00 € tritt der Fehler auf, mit 50,01 € nicht – das ist schon ein wichtiger Hinweis.
      - situation: >
          Bei 50,00 € kostet der Versand 4,95 €, bei 50,01 € ist er gratis. Bei 49,99 € kostet er korrekt 4,95 €.
        question: Welche Hypothese passt am besten?
        options:
          - Der Server ist überlastet.
          - Die Bedingung vergleicht mit `> 50` statt mit `>= 50` – genau der Grenzwert wird falsch behandelt.
          - Der Browser rundet Beträge falsch.
        answer: 1
        explanation: Ein Fehler, der genau an einer Grenze auftritt, ist fast immer ein Vergleich mit dem falschen Operator.
      - situation: Du findest `if (warenwert > 50) { return 0; }` und änderst es zu `>=`.
        question: Wann bist du fertig?
        options:
          - Sofort, die Änderung ist ja offensichtlich richtig.
          - Wenn du 49,99 €, 50,00 € und 50,01 € erneut geprüft und einen Test für den Grenzwert geschrieben hast.
        answer: 1
        explanation: Prüfen gehört dazu. Ein Test für genau 50,00 € verhindert, dass der Fehler als Regression zurückkommt.
---
Dein Programm liefert ein falsches Ergebnis. Der erste Impuls: hier eine Zeile ändern, dort etwas
auskommentieren, neu starten, hoffen. Nach einer Stunde weißt du nicht mehr, was du alles geändert hast –
und der Fehler ist immer noch da. **Debugging** ist kein Glücksspiel. Mit einem festen Vorgehen findest du
auch Fehler in Code, den du nie gesehen hast.

## Was ein Bug eigentlich ist

Ein [[bug|Bug]] ist eine Abweichung zwischen dem, was ein Programm tun **soll**, und dem, was es
**tatsächlich** tut. [[debugging|Debugging]] heißt, die Ursache dieser Abweichung zu finden und zu beheben.

Bugs gibt es grob in zwei Sorten: [[laufzeitfehler|Laufzeitfehler]] und [[logischer-fehler|logische Fehler]].

| Sorte | Merkmal | Beispiel |
|---|---|---|
| Laufzeitfehler | Das Programm bricht ab und meldet sich | `TypeError: Cannot read properties of undefined` |
| Logischer Fehler | Das Programm läuft, rechnet aber falsch | Summe ist 29 statt 46 |

Logische Fehler sind tückischer: Es gibt keine Meldung, die dich zur richtigen Stelle führt. Gerade dann
brauchst du ein System.

> [!MERKSATZ]
> Ein Bug ist immer eine **falsche Annahme**: Irgendwo glaubst du, ein Wert oder Ablauf sei anders, als er
> wirklich ist. Debugging heißt, diese Annahme zu finden.

## Der Debugging-Kreislauf

Erfahrene Entwickler:innen gehen – bewusst oder unbewusst – immer gleich vor. Wie bei einer Ärztin:
erst untersuchen, dann eine Diagnose stellen, dann behandeln.

![Der Debugging-Kreislauf: Reproduzieren, Eingrenzen, Hypothese, Prüfen](/assets/debugging-devtools/debug-kreislauf.svg)

1. **[[reproduktion|Reproduzieren]]:** Finde Schritte, mit denen der Fehler jedes Mal auftritt.
2. **Eingrenzen:** Finde heraus, in welchem Teil des Programms er entsteht.
3. **[[hypothese|Hypothese]]:** Formuliere eine konkrete, prüfbare Vermutung über die Ursache.
4. **Prüfen:** Mach ein kleines Experiment. Bestätigt es die Vermutung, behebst du den Fehler. Widerlegt es
   sie, formulierst du eine neue.

Wichtig: Ändere pro Experiment **nur eine Sache**. Sonst weißt du hinterher nicht, welche Änderung gewirkt hat.

## Schritt 1: Reproduzieren

Ein Fehler, den du nicht auslösen kannst, kannst du auch nicht sicher beheben. Sammle deshalb:

- **Schritte:** Was genau wurde geklickt oder aufgerufen?
- **Daten:** Mit welcher Eingabe? Leere Liste, Umlaute, sehr große Zahl?
- **Umgebung:** Welcher Browser, welche Node- oder PHP-Version, welches Betriebssystem?
- **Erwartet vs. tatsächlich:** Was sollte passieren, was passiert stattdessen?

Ziel ist eine [[minimales-beispiel|minimale Reproduktion]]: so wenig Code und Daten wie möglich, bei denen der
Fehler noch auftritt. Oft findest du die Ursache schon beim Verkleinern.

> [!FEHLER]
> **„Bei mir geht's.“** Funktioniert etwas bei dir, aber nicht bei anderen, ist das kein Beweis, dass alles
> stimmt – sondern ein Hinweis: Irgendetwas an Daten oder Umgebung ist anders. Genau dieser Unterschied ist
> deine erste Spur.

## Schritt 2 bis 4: Eingrenzen, vermuten, prüfen

**Eingrenzen** bedeutet, den Suchraum zu verkleinern. Stimmt der Wert direkt nach dem Laden der Daten?
Stimmt er nach der Berechnung? Irgendwo dazwischen kippt „richtig“ in „falsch“ – dort suchst du weiter.

Eine gute **Hypothese** ist konkret und sagt ein Ergebnis voraus:

```text
Schlecht: "Irgendwas mit der Summe ist kaputt."
Gut:      "Die Schleife beginnt bei i = 1 und überspringt das erste Element.
           Mit der Liste [5] müsste dann 0 herauskommen."
```

Das **Experiment** prüft genau diese Vorhersage – mit einer Ausgabe, einem [[breakpoint|Breakpoint]] oder
einem kleinen Test. Kommt 0 heraus, ist die Hypothese bestätigt. Kommt 5 heraus, ist sie widerlegt, und du
hast trotzdem etwas gelernt: Die Schleife ist es nicht.

Nach der Korrektur prüfst du erneut – am besten mit einem [[automatisierter-test|automatisierten Test]], der den
Fehler nachstellt. So bemerkst du sofort, wenn er als [[regression|Regression]] zurückkommt.

## Rubber-Duck-Debugging

Manchmal steckst du fest. Dann hilft ein erstaunlich simpler Trick: [[rubber-duck-debugging|Rubber-Duck-Debugging]].
Du erklärst einer Gummiente – oder einer Kollegin, oder einem leeren Textdokument – **Zeile für Zeile**, was
dein Code tut.

Warum das funktioniert: Beim Lesen im Kopf überspringst du Stellen, die „sowieso klar“ sind. Beim lauten
Erklären musst du jede Annahme aussprechen. Spätestens bei „… und hier ist `liste` natürlich nie leer“ fällt
dir auf, dass du das nie geprüft hast.

> [!PRAXIS]
> In Teams gilt: Wer länger als etwa 30 Minuten ohne neue Erkenntnis an einem Fehler sitzt, holt sich Hilfe.
> Schreib dafür kurz auf, was du beobachtet, vermutet und schon ausgeschlossen hast. Oft löst du das Problem
> beim Aufschreiben selbst – und sonst kann dir jemand viel schneller helfen.

## Zusammenfassung

- Ein Bug ist eine Abweichung zwischen erwartetem und tatsächlichem Verhalten – meist eine falsche Annahme.
- Laufzeitfehler melden sich, logische Fehler rechnen still falsch.
- Der Kreislauf: **reproduzieren → eingrenzen → Hypothese → prüfen**, pro Experiment nur eine Änderung.
- Eine minimale Reproduktion ist das stärkste Werkzeug zum Eingrenzen.
- Gute Hypothesen sind konkret und sagen ein Ergebnis voraus.
- Nach der Korrektur erneut prüfen und mit einem Test vor Regressionen schützen.
- Steckst du fest, erklär den Code einer Gummiente – oder hol dir mit Notizen Hilfe.
