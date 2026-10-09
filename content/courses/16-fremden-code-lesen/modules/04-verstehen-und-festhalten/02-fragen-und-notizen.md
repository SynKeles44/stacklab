---
title: Gute Fragen stellen und Wissen festhalten
summary: Wann und wie du im Team fragst, wie du beim Lesen Notizen führst und wie du Entscheidungen in einem ADR festhältst.
duration: 20
sources:
  - title: Architectural Decision Records (adr.github.io)
    url: https://adr.github.io/
  - title: Michael Nygard – Documenting Architecture Decisions
    url: https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
  - title: GitHub Docs – Basic writing and formatting syntax
    url: https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax
quiz:
  - type: single
    question: Welche Frage an eine Kollegin ist am hilfreichsten?
    options:
      - „Der Checkout geht nicht, kannst du mal schauen?“
      - „Ich verstehe den Code nicht.“
      - „Bei genau 5000 Cent kostet der Versand 495. Seit 862c991 steht im PriceCalculator > statt >=. War das Absicht, oder darf ich es auf >= zurückstellen?“
      - „Wer hat den PriceCalculator kaputt gemacht?“
    answer: 2
    explanation: >
      Die gute Frage nennt Beobachtung, Fundstelle, Vermutung und eine konkrete Ja-Nein-Entscheidung. Die
      Kollegin kann in einer Minute antworten.
  - type: match
    question: Ordne jedem Abschnitt eines ADR seinen Inhalt zu.
    pairs:
      - { left: "Status", right: "Vorgeschlagen, angenommen oder abgelöst" }
      - { left: "Kontext", right: "Welches Problem und welche Rahmenbedingungen gab es?" }
      - { left: "Entscheidung", right: "Was wurde beschlossen?" }
      - { left: "Konsequenzen", right: "Was folgt daraus, positiv wie negativ?" }
    explanation: >
      Ein ADR ist kurz. Der Kontext ist der wichtigste Teil: Er erklärt späteren Leser:innen, warum die Entscheidung
      damals sinnvoll war.
  - type: multiple
    question: Was gehört in deine Notizen beim Einarbeiten?
    options:
      - Befehle für Setup und Tests.
      - Einstiegspunkte und ein verfolgter Request-Ablauf.
      - Offene Fragen, die du noch klären willst.
      - Eine Kopie jeder gelesenen Datei.
    answers: [0, 1, 2]
    explanation: >
      Notizen halten Erkenntnisse fest, keine Kopien. Was im Code steht, kannst du jederzeit nachlesen – das
      Warum und Wo vergisst du schnell.
  - type: cloze
    text: Ein kurzes Dokument, das eine wichtige technische Entscheidung samt Begründung festhält, heißt Architecture Decision ___ (kurz ADR).
    blanks:
      - [Record]
    explanation: ADRs liegen oft als nummerierte Markdown-Dateien im Repository, z. B. in `docs/adr/`.
tasks:
  - id: fragen-oder-weitersuchen
    type: steps
    title: Fragen oder weitersuchen?
    description: Entscheide in jeder Situation, was der beste nächste Schritt ist.
    steps:
      - situation: >
          Du suchst seit fünf Minuten, wo die Versandkosten berechnet werden. grep hast du noch nicht benutzt.
        question: Was tust du?
        options:
          - Sofort im Team-Chat fragen.
          - Erst selbst suchen, z. B. mit grep nach „495“ oder „shipping“.
        answer: 1
        explanation: >
          Was du mit einer Suche in einer Minute selbst herausfindest, solltest du nicht fragen. Das spart Zeit
          für euch beide und du lernst die Codebasis kennen.
      - situation: >
          Du hast den Fehler gefunden: Seit einem Refactoring steht `>` statt `>=`. Im Ticket steht aber nichts
          dazu, ob sich die Regel vielleicht absichtlich geändert hat.
        question: Was tust du?
        options:
          - Den Operator ohne Rückfrage ändern – der Test sagt ja, was richtig ist.
          - Kurz bei der Person aus dem Commit oder im Team nachfragen und dabei Fundstelle und Vermutung nennen.
          - Ein neues Ticket schreiben und eine Woche warten.
        answer: 1
        explanation: >
          Hier fehlt fachliches Wissen, das nicht im Code steht. Eine kurze, präzise Frage klärt es in Minuten.
          Der rote Test ist ein starker Hinweis, aber die Bestätigung kostet fast nichts.
      - situation: >
          Nach der Antwort kennst du den Grund: Die Regel lautet „ab 50 €“, das Refactoring war ein Versehen.
        question: Was machst du mit dieser Erkenntnis?
        options:
          - Nichts, ich weiß es ja jetzt.
          - Ich halte sie in meinen Notizen fest und erwähne sie im Pull Request zum Fix.
        answer: 1
        explanation: >
          Wissen, das nur in deinem Kopf oder in einem Chat steht, geht verloren. Notizen und Pull-Request-
          Beschreibungen machen es für alle auffindbar.
  - id: frage-zusammenbauen
    type: order
    title: Eine gute Frage aufbauen
    description: Bring die Bausteine einer guten Frage im Team-Chat in eine sinnvolle Reihenfolge.
    items:
      - "Ziel: Ich arbeite an KIEZ-23, Versand bei genau 50 €."
      - "Beobachtung: Der Test für 5000 Cent ist rot, es werden 495 Cent Versand berechnet."
      - "Was ich herausgefunden habe: Seit Commit 862c991 steht im PriceCalculator > statt >=."
      - "Meine Vermutung: Das war beim Auslagern der Konstanten ein Versehen."
      - "Konkrete Frage: Darf ich den Vergleich auf >= zurückstellen?"
    hints:
      - Erst der Zusammenhang, dann die Fakten, dann deine Vermutung – und am Schluss eine Frage, die man schnell beantworten kann.
---
Irgendwann kommst du allein nicht weiter. Vielleicht fehlt fachliches Wissen, das nirgends im Code steht.
Vielleicht ist ein Teil einfach zu verworren. Dann fragst du – und zwar so, dass die Antwort schnell kommt.
Und alles, was du herausfindest, hältst du so fest, dass du (und die nächste neue Person) es wiederfindest.

## Wann du fragen solltest

Zu früh fragen kostet die Zeit anderer. Zu spät fragen kostet deine. Eine einfache Faustregel hilft:

| Situation | Besser … |
|---|---|
| Du hast noch nicht gesucht (README, grep, Tests, Historie) | erst selbst suchen |
| Du steckst seit 20–30 Minuten an derselben Stelle fest | fragen |
| Das Wissen steht nicht im Code (Fachregeln, Absprachen) | früh fragen |
| Eine Änderung könnte Daten oder Geld betreffen | vorher fragen |

Oft hilft schon, das Problem laut zu erklären – einer Kollegin oder einer Quietscheente. Das nennt man
[[rubber-duck-debugging|Rubber-Duck-Debugging]]: Beim Formulieren merkst du selbst, wo die Lücke ist.

## Gute Fragen stellen

Eine gute Frage enthält alles, was die andere Person braucht, um ohne Rückfrage zu antworten:

1. **Ziel:** Woran arbeitest du?
2. **Beobachtung:** Was passiert genau?
3. **Bisherige Suche:** Was hast du schon herausgefunden, mit Fundstelle?
4. **Vermutung:** Was glaubst du?
5. **Konkrete Frage:** Am besten mit Ja oder Nein beantwortbar.

```text title="Schlecht und gut"
Schlecht: Der Checkout geht nicht, kannst du mal schauen?

Gut:      Ich arbeite an KIEZ-23. Bei 5000 Cent werden 495 Cent Versand berechnet.
          Seit 862c991 steht im PriceCalculator ">" statt ">=". War das Absicht,
          oder darf ich es auf ">=" zurückstellen?
```

> [!FEHLER]
> „Wer hat das kaputt gemacht?“ Diese Frage schafft schlechte Stimmung und bringt dich nicht weiter. Frag nach
> dem Warum und nach der richtigen Regel, nicht nach dem Schuldigen.

## Notizen beim Lesen

Dein [[mentales-modell|mentales Modell]] ist flüchtig. Halte deshalb fest, was du herausfindest – am besten
in einer [[markdown|Markdown]]-Datei wie `NOTES.md`, die du außerhalb des Repositorys oder in deinem eigenen
Branch pflegst:

```markdown title="NOTES.md – eine bewährte Gliederung"
# Onboarding-Notizen Kiezladen

## Setup
- Tests: make test (php tests/run.php)

## Einstiegspunkte
- public/index.php (Front Controller), Routen in src/routes.php

## Request-Ablauf: POST /checkout
index.php → Router → CheckoutController::store → PriceCalculator → EventDispatcher

## Offene Fragen
- Gilt „versandkostenfrei ab 50 €“ vor oder nach Gutschein-Rabatt?
```

> [!MERKSATZ]
> Notiere Erkenntnisse und Fragen, keine Kopien von Code. Den Code kannst du nachlesen – das Warum und das Wo
> vergisst du.

## Entscheidungen festhalten: ADRs

Manche Erkenntnisse sind wichtiger als eine persönliche Notiz, weil sie eine Entscheidung erklären. Dafür gibt
es das [[adr|Architecture Decision Record]] (ADR): ein kurzes, nummeriertes Dokument im Repository.

```markdown title="docs/adr/0001-preise-in-cent.md"
# 1. Preise werden in Cent gespeichert

Status: angenommen

## Kontext
Mit Kommazahlen entstehen Rundungsfehler, z. B. 0.1 + 0.2 = 0.30000000000000004.

## Entscheidung
Alle Preise sind ganze Zahlen in Cent (int). Formatiert wird erst bei der Ausgabe.

## Konsequenzen
Rechnungen sind exakt. Wer Preise ausgibt, muss durch 100 teilen.
```

Wer in einem Jahr fragt „Warum eigentlich Cent?“, findet die Antwort, ohne die Historie zu durchsuchen.

## Wissen zurückgeben

Deine Notizen sind zunächst für dich. Vieles darin ist aber auch für andere wertvoll. Bevor du sie in einer
Schublade verschwinden lässt, prüfe, was davon ins Projekt gehört:

| Erkenntnis | Wohin damit? |
|---|---|
| Startanleitung war veraltet | README korrigieren |
| Ablauf eines wichtigen Requests | Skizze in `docs/` oder ins Wiki |
| Grund für eine Entscheidung | ADR in `docs/adr/` |
| Antwort auf eine Fachfrage | Ticket, Pull-Request-Beschreibung oder Kommentar im Code |

So muss die nächste neue Person dieselbe Frage nicht noch einmal stellen – und das Team merkt schnell, dass du
mitdenkst.

> [!PRAXIS]
> Neue Teammitglieder sehen Lücken, die alle anderen übersehen. Ein verbessertes README, eine ergänzte
> Startanleitung oder ein erstes ADR sind wertvolle Beiträge in deiner ersten Woche.

## Zusammenfassung

- Erst selbst suchen, aber nicht stundenlang feststecken. Fachwissen erfragst du früh.
- Eine gute Frage nennt Ziel, Beobachtung, Fundstelle, Vermutung und eine konkrete Frage.
- Halte Erkenntnisse in einer `NOTES.md` fest: Setup, Einstiegspunkte, Abläufe, offene Fragen.
- Wichtige Entscheidungen gehören als ADR ins Repository: Status, Kontext, Entscheidung, Konsequenzen.
- Gib dein Wissen zurück, zum Beispiel durch ein besseres README.
