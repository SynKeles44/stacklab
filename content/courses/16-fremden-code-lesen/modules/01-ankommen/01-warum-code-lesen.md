---
title: Warum Code lesen eine Kernkompetenz ist
summary: Warum du viel mehr Code liest als schreibst, welche Lesestrategien es gibt und mit welcher Haltung du an fremden Code herangehst.
duration: 15
sources:
  - title: Pro Git (deutsch), Kapitel 2.3 – Anzeigen der Commit-Historie
    url: https://git-scm.com/book/de/v2/Git-Grundlagen-Anzeigen-der-Commit-Historie
  - title: PHP-Handbuch – Sprachreferenz
    url: https://www.php.net/manual/de/langref.php
quiz:
  - type: single
    question: Warum lohnt es sich, Code lesen bewusst zu üben?
    options:
      - Weil Code lesen nur am ersten Arbeitstag vorkommt.
      - Weil du im Berufsalltag deutlich mehr Zeit mit Lesen als mit Schreiben verbringst.
      - Weil gut geschriebener Code nie gelesen werden muss.
      - Weil Lesen schneller geht, wenn man alle Dateien von oben nach unten durchgeht.
    answer: 1
    explanation: >
      Vor jeder Änderung musst du verstehen, was schon da ist. Deshalb überwiegt Lesen das Schreiben deutlich –
      und wer gezielt lesen kann, arbeitet schneller und macht weniger Fehler.
  - type: match
    question: Ordne jeder Lesestrategie die passende Beschreibung zu.
    pairs:
      - { left: "Top-down", right: "Vom Großen ins Kleine: erst Ordner und Ablauf, dann Details" }
      - { left: "Bottom-up", right: "Von einer konkreten Zeile aus nach außen arbeiten" }
      - { left: "Bedarfsgesteuert", right: "Nur so tief lesen, wie die aktuelle Aufgabe es verlangt" }
    explanation: >
      In der Praxis wechselst du ständig: Du verschaffst dir top-down einen Überblick, springst bottom-up zu
      einer Fehlermeldung und hörst auf, sobald du genug weißt.
  - type: multiple
    question: Welche Haltungen helfen dir beim Lesen fremden Codes?
    options:
      - Du formulierst Vermutungen und prüfst sie gezielt.
      - Du verstehst erst jede Datei vollständig, bevor du etwas änderst.
      - Du gehst davon aus, dass seltsamer Code oft einen Grund hat, den du noch nicht kennst.
      - Du schreibst unverständliche Stellen sofort neu.
    answers: [0, 2]
    explanation: >
      Niemand versteht eine Codebasis vollständig. Arbeite mit Hypothesen und finde erst den Grund für
      seltsamen Code heraus, bevor du ihn änderst – oft steckt eine Anforderung dahinter.
  - type: cloze
    text: Code, den andere geschrieben haben und den niemand mehr genau kennt, nennt man oft ___-Code. Die Vorstellung im Kopf, wie ein System funktioniert, heißt ___ Modell.
    blanks:
      - [Legacy]
      - [mentales, mentale]
    explanation: Legacy-Code ist gewachsener, oft schlecht dokumentierter Code. Dein mentales Modell ist die Landkarte, die du dir beim Lesen aufbaust.
tasks:
  - id: strategie-waehlen
    type: dragdrop
    title: Welche Strategie passt?
    description: >
      Ordne jede Situation der Lesestrategie zu, mit der du am schnellsten ans Ziel kommst.
    targets:
      - { id: top-down, label: "Top-down: erst der Überblick" }
      - { id: bottom-up, label: "Bottom-up: von einer konkreten Stelle aus" }
    items:
      - { label: "Erster Tag im neuen Projekt, noch keine Aufgabe", target: top-down }
      - { label: "Ein Stack Trace zeigt auf Zeile 42 einer Datei", target: bottom-up }
      - { label: "Du sollst erklären, welche Module das System hat", target: top-down }
      - { label: "Ein Kunde meldet einen bestimmten Fehlertext", target: bottom-up }
      - { label: "Du planst, wo ein neues Feature hingehört", target: top-down }
      - { label: "Ein Test schlägt mit einer konkreten Meldung fehl", target: bottom-up }
    hints:
      - Hast du einen konkreten Anker (Zeile, Text, Meldung)? Dann startest du dort.
  - id: erster-tag
    type: steps
    title: Dein erster Tag im Kiezladen-Team
    description: Spiel durch, wie du an eine unbekannte Codebasis herangehst.
    steps:
      - situation: >
          Du bekommst Zugriff auf das Repository des Kiezladens und das Ticket „Versandkosten bei 50 € falsch“.
          Das Projekt hat 19 Dateien, die du alle noch nie gesehen hast.
        question: Womit beginnst du?
        options:
          - Ich lese alle Dateien alphabetisch von oben nach unten.
          - Ich lese das README und schaue mir die Ordnerstruktur an.
          - Ich ändere sofort die Zahl 5000 in eine andere Zahl und schaue, was passiert.
        answer: 1
        explanation: >
          Das README und die Ordnerstruktur geben dir in wenigen Minuten den Überblick. Alles von vorne zu lesen
          dauert zu lange, blindes Ändern ist Raten.
      - situation: >
          Im Code findest du eine Zeile, die dir umständlich vorkommt. Du würdest sie ganz anders schreiben.
        question: Was tust du?
        options:
          - Ich schreibe sie sofort um, denn mein Weg ist besser.
          - Ich finde zuerst heraus, warum sie so geschrieben wurde – zum Beispiel mit der Git-Historie.
        answer: 1
        explanation: >
          Seltsamer Code hat oft einen Grund: eine Anforderung, ein alter Fehler, eine Abhängigkeit. Erst
          verstehen, dann ändern.
      - situation: Nach einer Stunde verstehst du den Bestellablauf grob, aber nicht jede Hilfsfunktion.
        question: Reicht das, um mit dem Ticket anzufangen?
        options:
          - Ja – ich verstehe genug für meine Aufgabe und vertiefe nur, wo es nötig wird.
          - Nein – erst wenn ich jede Zeile verstanden habe.
        answer: 0
        explanation: >
          Bedarfsgesteuertes Lesen ist der Normalfall. Kein Mensch kennt eine große Codebasis vollständig.
---
Dein erster Tag im neuen Team: Du bekommst Zugriff auf ein [[repository|Repository]] mit tausenden Zeilen
und ein [[ticket|Ticket]]: „Kund:innen zahlen bei genau 50 € Versand, obwohl der Versand ab 50 € gratis ist.“
Niemand hat Zeit, dir alles zu erklären. Wo fängst du an? Genau darum geht es in diesem Kurs.

## Du liest viel mehr, als du schreibst

Bevor du eine Zeile änderst, musst du verstehen, was schon da ist. Deshalb besteht ein großer Teil deiner
Arbeitszeit aus Lesen. Der Softwareautor Robert C. Martin schätzt das Verhältnis von Lesen zu Schreiben auf
deutlich mehr als zehn zu eins.

| Tätigkeit | Wie viel Lesen steckt drin? |
|---|---|
| Einen [[bug|Bug]] beheben | Fehler finden, Ursache verstehen, Nebenwirkungen prüfen |
| Ein Feature ergänzen | Passende Stelle finden, vorhandene Muster übernehmen |
| [[code-review|Code-Review]] | Fremde Änderungen nachvollziehen und bewerten |
| Eine [[abhaengigkeit|Abhängigkeit]] aktualisieren | Prüfen, welcher eigene Code sie nutzt |

Die Gesamtheit allen Codes eines Projekts heißt [[codebasis|Codebasis]]. In echten Projekten ist sie über
Jahre gewachsen und von vielen Menschen geschrieben. Solchen gewachsenen, oft schlecht dokumentierten Code
nennt man [[legacy-code|Legacy-Code]].

> [!MERKSATZ]
> Wer schnell und sicher Code lesen kann, ist im Team schneller produktiv als jemand, der nur schnell tippt.

## Code ist kein Roman

Ein Buch liest du von vorne nach hinten. Code nicht. Er ist eher wie ein Stadtplan: Du lernst nicht jede
Straße auswendig, sondern die Hauptstraßen und den Weg zu deinem Ziel.

Beim Lesen baust du dir ein [[mentales-modell|mentales Modell]] auf – eine Vorstellung im Kopf, welche
Teile es gibt und wie sie zusammenspielen. Dieses Modell ist am Anfang grob und wird mit jeder Aufgabe
genauer.

> [!FEHLER]
> „Ich muss erst alles verstehen, bevor ich anfange.“ – Das schafft niemand, auch nicht die Leute, die den
> Code geschrieben haben. Wer so startet, liest tagelang und vergisst die Hälfte wieder.

## Drei Lesestrategien

| Strategie | So gehst du vor | Gut für |
|---|---|---|
| [[top-down|Top-down]] | Erst Ordner, Einstiegspunkte und grober Ablauf, dann Details | Ersten Überblick, Feature-Planung |
| [[bottom-up|Bottom-up]] | Von einer konkreten Zeile, Meldung oder Funktion nach außen | Fehlersuche, Stack Traces |
| Bedarfsgesteuert | Nur so tief lesen, wie die Aufgabe verlangt | Fast immer |

Im Alltag kombinierst du die Strategien. Ein Beispiel: Du verschaffst dir top-down einen Überblick, suchst
dann bottom-up nach dem Fehlertext aus dem Ticket und hörst auf, sobald du die Ursache sicher kennst.

## Mit Vermutungen arbeiten

Gutes Code-Lesen ist wie Detektivarbeit. Du stellst eine Vermutung auf und prüfst sie gezielt:

1. **Vermutung:** „Die Versandkosten werden vermutlich in einer Klasse mit ‚Price‘ im Namen berechnet.“
2. **Prüfen:** Du suchst nach Dateien mit diesem Namen und schaust hinein.
3. **Ergebnis:** Bestätigt – oder du verwirfst die Vermutung und stellst eine neue auf.

Wichtig ist auch Respekt vor dem Bestehenden. Wenn dir Code seltsam vorkommt, hatte die Person dahinter oft
einen Grund: eine Sonderregel, einen alten Fehler, einen Termin. Finde den Grund heraus, bevor du etwas
„aufräumst“ – sonst baust du denselben Fehler ein zweites Mal ein.

> [!PRAXIS]
> Erfahrene Entwickler:innen erkennt man oft daran, dass sie bei fremdem Code zuerst fragen „Warum ist das
> so?“ und erst danach „Wie mache ich das schöner?“.

## Dein Übungsprojekt: der Kiezladen

Damit du nicht nur liest, sondern übst, gibt es in diesem Kurs ein Beispielprojekt: den **Kiezladen**,
einen kleinen Online-Shop in [[php|PHP]]. Die Aufgaben legen ihn per **Aufgabe vorbereiten** in deinem
Übungs-Terminal an – samt einer Git-Historie aus zehn [[commit|Commits]] von zwei Personen.

```text title="Der Kiezladen im Überblick"
kiezladen/
├── README.md        Beschreibung und Startanleitung
├── Makefile         Kurzbefehle wie „make test“
├── public/          Was der Webserver ausliefert
├── src/             Der eigentliche Code
└── tests/           Automatische Tests
```

Im Shop steckt ein echter Fehler. Im Laufe des Kurses findest du heraus, wo er sitzt, wann er entstanden ist
und warum – und im Abschlussprojekt behebst du ihn.

## Zusammenfassung

- Du liest im Berufsalltag ein Vielfaches dessen, was du schreibst.
- Code liest man nicht von vorne nach hinten, sondern wie einen Stadtplan.
- **Top-down** gibt dir den Überblick, **bottom-up** führt dich von einer konkreten Stelle aus weiter.
- Du musst nicht alles verstehen – nur genug für deine aktuelle Aufgabe.
- Arbeite mit Vermutungen, prüfe sie gezielt und frag bei seltsamem Code erst nach dem Warum.
