---
title: Tickets, Sprints und Schätzungen
summary: Wie Teams Arbeit in Tickets organisieren – Backlog, Sprint oder Kanban, Status, User Stories, Definition of Ready und Done – und wie sie schätzen und große Aufgaben aufteilen.
duration: 25
sources:
  - title: Der Scrum Guide (deutsch)
    url: https://scrumguides.org/docs/scrumguide/v2020/2020-Scrum-Guide-German.pdf
  - title: Atlassian – Kanban
    url: https://www.atlassian.com/de/agile/kanban
  - title: Atlassian – User Stories
    url: https://www.atlassian.com/de/agile/project-management/user-stories
  - title: Atlassian – Story Points und Schätzung
    url: https://www.atlassian.com/de/agile/project-management/estimation
quiz:
  - type: single
    question: Was ist das Backlog?
    options:
      - Die priorisierte Liste aller Aufgaben, die noch erledigt werden sollen
      - Die Liste aller Fehler, die schon behoben wurden
      - Ein Protokoll aller Git-Commits
    answer: 0
    explanation: Im Backlog sammelt das Team alles, was noch zu tun ist – das Wichtigste steht oben.
  - type: match
    question: Ordne jedem Begriff seine Bedeutung zu.
    pairs:
      - { left: "Sprint", right: "Fester Zeitraum, meist 1–4 Wochen, mit geplanten Aufgaben" }
      - { left: "Kanban", right: "Kontinuierlicher Fluss mit Begrenzung paralleler Arbeit" }
      - { left: "Definition of Ready", right: "Wann ein Ticket bereit ist, bearbeitet zu werden" }
      - { left: "Definition of Done", right: "Wann ein Ticket wirklich fertig ist" }
    explanation: Sprint und Kanban sind zwei Arten, Arbeit zu planen; DoR und DoD sind die Qualitätsgrenzen davor und danach.
  - type: multiple
    question: Welche Akzeptanzkriterien sind gut formuliert? (mehrere Antworten)
    options:
      - Ein Gutschein-Code kann im Warenkorb eingegeben werden
      - Ein abgelaufener Gutschein zeigt die Meldung „Gutschein abgelaufen“
      - Die Funktion soll schön sein
      - Der Rabatt wird in der Bestellbestätigung ausgewiesen
    answers: [0, 1, 3]
    explanation: Gute Akzeptanzkriterien sind überprüfbar. „Schön“ kann niemand eindeutig testen.
  - type: single
    question: Was messen Story Points?
    options:
      - Den relativen Aufwand inklusive Komplexität und Unsicherheit
      - Die exakte Anzahl an Arbeitsstunden
      - Wie viele Zeilen Code entstehen
    answer: 0
    explanation: Story Points vergleichen Aufgaben miteinander. Eine 8 ist deutlich größer und unsicherer als eine 2 – ohne Stundenversprechen.
  - type: single
    question: Was ist ein vertikaler Schnitt?
    options:
      - Ein kleines Stück Funktion, das durch alle Schichten geht und für Nutzer:innen schon Wert hat
      - Erst die gesamte Datenbank, dann die gesamte API, dann die gesamte Oberfläche
      - Eine Aufgabe, die nur eine Person bearbeitet
    answer: 0
    explanation: Ein vertikaler Schnitt liefert früh etwas Benutzbares und zeigt Probleme in allen Schichten sofort.
tasks:
  - id: ticket-lebenszyklus
    type: order
    title: Der Weg eines Tickets
    description: Bringe die Stationen eines Tickets in eine typische Reihenfolge.
    items:
      - Idee wird als Ticket im Backlog erfasst
      - Ticket wird verfeinert, bis die Definition of Ready erfüllt ist
      - Ticket wird für den Sprint eingeplant (To Do)
      - Jemand übernimmt es und legt einen Branch an (In Progress)
      - Pull Request ist offen (In Review)
      - Definition of Done ist erfüllt (Done)
  - id: dor-oder-dod
    type: dragdrop
    title: Ready oder Done?
    description: Gehört die Aussage zur Definition of Ready (vor der Arbeit) oder zur Definition of Done (nach der Arbeit)?
    targets:
      - { id: dor, label: Definition of Ready }
      - { id: dod, label: Definition of Done }
    items:
      - { label: "Akzeptanzkriterien sind formuliert", target: dor }
      - { label: "Das Team hat das Ticket geschätzt", target: dor }
      - { label: "Designs und offene Fragen sind geklärt", target: dor }
      - { label: "Code ist reviewt und gemergt", target: dod }
      - { label: "Automatische Tests sind grün", target: dod }
      - { label: "Dokumentation und Changelog sind aktualisiert", target: dod }
  - id: ticket-aufteilen
    type: steps
    title: Ein großes Ticket zerlegen
    description: Im Planning liegt das Ticket „SHOP-200 Bewertungssystem für Produkte“ auf dem Tisch.
    steps:
      - situation: Beim Planning Poker zeigen zwei Personen eine 3, zwei eine 13.
        question: Was passiert als Nächstes?
        options:
          - Die Personen mit der höchsten und niedrigsten Schätzung erklären ihre Gründe, dann wird neu geschätzt
          - Man nimmt den Durchschnitt, also 8
          - Die erfahrenste Person entscheidet allein
        answer: 0
        explanation: Große Unterschiede zeigen, dass jemand etwas weiß oder sieht, was andere nicht wissen. Genau darüber lohnt sich das Gespräch.
      - situation: Nach dem Gespräch sind sich alle einig, dass das Ticket größer als 13 ist.
        question: Was tut das Team?
        options:
          - Es teilt das Ticket in kleinere Stories auf
          - Es schätzt 40 Punkte und plant es trotzdem in einen Sprint
          - Es lässt das Ticket ungeschätzt liegen
        answer: 0
        explanation: Zu große Tickets sind zu unsicher. Aufteilen macht sie planbar und reviewbar.
      - situation: Wie wird zerlegt?
        question: Welcher Schnitt liefert am frühesten Wert?
        options:
          - "Story 1: Sterne vergeben und anzeigen (einfach). Story 2: Kommentare. Story 3: Moderation"
          - "Story 1: komplette Datenbank. Story 2: komplette API. Story 3: komplette Oberfläche"
          - Ein Ticket pro beteiligter Person
        answer: 0
        explanation: Vertikale Schnitte gehen durch alle Schichten. Schon nach Story 1 können Kund:innen Sterne vergeben.
      - situation: Niemand weiß, ob der vorhandene Bewertungsdienst eines Anbieters genutzt werden kann.
        question: Wie geht ihr mit dieser Unsicherheit um?
        options:
          - Ein zeitlich begrenzter Spike (z. B. 1 Tag) untersucht die Frage, danach wird geschätzt
          - Man schätzt einfach sehr hoch
          - Man fängt sofort mit der Umsetzung an
        answer: 0
        explanation: Ein Spike ist eine kurze, begrenzte Untersuchung, die Unsicherheit abbaut, bevor das Team sich festlegt.
---

Montagmorgen. Anna fragt: „Was mache ich heute?“ Ben weiß nicht, ob jemand schon am Gutschein-Fehler
arbeitet. Und die Wunschliste ist seit drei Wochen „fast fertig“. Teams lösen das mit Tickets, einem
gemeinsamen Workflow in Werkzeugen wie Jira oder Linear und ehrlichen Schätzungen.

## Tickets, Backlog und Board

Ein [[ticket]] beschreibt eine Aufgabe und hat eine eindeutige [[ticket-id|Ticket-ID]] wie `SHOP-123`. Alle
offenen Tickets bilden das [[backlog|Backlog]] – eine priorisierte Liste, das Wichtigste oben. Den
Fortschritt zeigt ein Board, dessen Spalten die Status sind:

```text
Backlog → To Do → In Progress → In Review → Done
```

Werkzeuge koppeln den Status oft an Git: Ein Branch mit Ticket-ID setzt „In Progress“, ein Pull Request
„In Review“, der Merge „Done“.

| | [[sprint|Sprint]] ([[scrum|Scrum]]) | [[kanban|Kanban]] |
|---|---|---|
| Rhythmus | feste Zeiträume, meist 1–4 Wochen | kontinuierlicher Fluss |
| Planung | zu Beginn jedes Sprints | sobald Kapazität frei ist |
| Steuerung | Sprint-Ziel | Begrenzung paralleler Arbeit (WIP-Limit) |

> [!FEHLER]
> **Zehn Tickets gleichzeitig „In Progress“.** Wer an allem ein bisschen arbeitet, wird mit nichts fertig.
> Bringt Angefangenes zu Ende, bevor ihr Neues beginnt.

## User Stories, Ready und Done

Feature-Tickets werden oft als [[user-story|User Story]] formuliert, ergänzt um
[[akzeptanzkriterien|Akzeptanzkriterien]], die „fertig“ überprüfbar machen:

```text title="SHOP-123: Gutschein im Warenkorb"
Als Kundin möchte ich einen Gutschein-Code im Warenkorb eingeben,
damit ich den Rabatt sofort sehe.

Akzeptanzkriterien:
- Ein gültiger Code reduziert die Summe um den Gutscheinwert.
- Ein abgelaufener Code zeigt „Gutschein abgelaufen“.
```

Zwei Vereinbarungen sichern die Qualität: Die [[definition-of-ready|Definition of Ready]] sagt, wann ein
Ticket bearbeitet werden darf (Kriterien klar, Fragen geklärt, geschätzt). Die
[[definition-of-done|Definition of Done]] sagt, wann es fertig ist (reviewt, Tests grün, gemergt,
dokumentiert).

> [!MERKSATZ]
> Eine Story sagt, **wer was warum** will. Akzeptanzkriterien sagen, **woran** man erkennt, dass es klappt.

## Relativ schätzen mit Story Points

Menschen schätzen schlecht in Stunden, aber gut im Vergleich. [[story-points|Story Points]] messen den
**relativen** Aufwand inklusive Komplexität und Unsicherheit, meist auf einer Fibonacci-Skala: 1, 2, 3, 5,
8, 13. Die wachsenden Abstände spiegeln die wachsende Unsicherheit großer Aufgaben.

Beim **Planning Poker** wählen alle verdeckt eine Karte und decken gleichzeitig auf. Liegen die Werte weit
auseinander, erklären die höchste und die niedrigste Schätzung ihre Gründe – dabei kommt oft vergessenes
Wissen ans Licht. Dann wird neu geschätzt.

## Große Aufgaben aufteilen

Große Vorhaben werden als [[epic|Epic]] angelegt und in Stories zerlegt – am besten als
[[vertikaler-schnitt|vertikaler Schnitt]]: Jede Story geht durch alle Schichten und liefert schon Nutzen.

```text title="Epic SHOP-200: Bewertungen"
vertikal (gut)                         horizontal (schlecht)
SHOP-201 Sterne vergeben und anzeigen  SHOP-201 komplette Datenbank
SHOP-202 Text-Kommentare               SHOP-202 komplette API
SHOP-203 Moderation                    SHOP-203 komplette Oberfläche
```

Nach SHOP-201 können Kund:innen bereits bewerten. Beim horizontalen Schnitt gibt es erst nach dem dritten Ticket etwas zu sehen – und Fehler im Zusammenspiel der Schichten fallen spät auf.

Ist eine wichtige Frage offen, klärt ein **Spike** sie vorab: eine kurze, zeitlich begrenzte Untersuchung,
die Wissen liefert statt fertigem Code.

> [!PRAXIS]
> Viele Teams teilen alles über 8 Punkte vor dem Sprint auf. Kleine Tickets führen zu kleinen Pull
> Requests – und die werden schneller und gründlicher reviewt. Schätzungen sind Planungshilfen, nie
> Leistungsbewertung.

## Zusammenfassung

- Tickets beschreiben Aufgaben; das Backlog ist ihre priorisierte Liste, ein Board zeigt den Status.
- Scrum plant in Sprints, Kanban arbeitet im Fluss mit WIP-Limits.
- User Stories und Akzeptanzkriterien beschreiben das Ziel; DoR und DoD sichern Qualität davor und danach.
- Story Points schätzen relativ; Planning Poker deckt unterschiedliches Wissen auf.
- Große Aufgaben werden in vertikale Stories zerlegt, offene Fragen klärt ein Spike.
