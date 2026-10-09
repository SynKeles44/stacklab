---
title: Kommunikation im Team
summary: Wann ein Chat-Thread und wann ein Gespräch besser ist, wie du gute Fragen stellst, wann du nach einer Timebox um Hilfe bittest und wozu Standup und Retrospektive dienen.
duration: 25
sources:
  - title: GitLab Handbook – Asynchronous communication
    url: https://handbook.gitlab.com/handbook/company/culture/all-remote/asynchronous/
  - title: Stack Overflow – How do I ask a good question?
    url: https://stackoverflow.com/help/how-to-ask
  - title: Der Scrum Guide (deutsch)
    url: https://scrumguides.org/docs/scrumguide/v2020/2020-Scrum-Guide-German.pdf
  - title: Atlassian – Sprint-Retrospektive
    url: https://www.atlassian.com/de/agile/scrum/retrospectives
quiz:
  - type: single
    question: Du hängst seit 20 Minuten an einem Fehler. Euer Team hat eine Timebox von 45 Minuten vereinbart. Was tust du?
    options:
      - Noch weiter selbst suchen und notieren, was du schon probiert hast
      - Sofort die erfahrenste Kollegin anrufen
      - Den ganzen Tag allein weitersuchen, um niemanden zu stören
    answer: 0
    explanation: Innerhalb der Timebox lernst du am meisten durch eigenes Suchen. Deine Notizen machen die spätere Frage viel besser.
  - type: multiple
    question: Was gehört in eine gute Frage im Team-Chat? (mehrere Antworten)
    options:
      - Was du erreichen willst
      - Die Fehlermeldung als kopierter Text
      - Was du schon ausprobiert hast
      - Nur „Hallo, hast du kurz Zeit?“ und dann warten
    answers: [0, 1, 2]
    explanation: Eine vollständige Frage kann jemand beantworten, ohne nachzufragen. Ein nacktes „Hallo“ blockiert beide.
  - type: match
    question: Ordne jeder Situation den passenden Kanal zu.
    pairs:
      - { left: "Rückfrage zu einer Code-Zeile", right: "Kommentar im Pull Request" }
      - { left: "Produktion ist ausgefallen", right: "Sofortiger Anruf oder Incident-Kanal" }
      - { left: "Entscheidung, die später nachvollziehbar sein soll", right: "Ticket oder Dokument" }
      - { left: "Fünfte Runde Missverständnisse im Thread", right: "Kurzer Call" }
    explanation: Asynchron für Nachvollziehbares und Nicht-Dringendes, synchron für Dringendes und festgefahrene Diskussionen.
  - type: single
    question: Wozu dient das Daily Standup in erster Linie?
    options:
      - Das Team stimmt sich ab und macht Blocker sichtbar
      - Jede Person berichtet der Führungskraft ausführlich über ihre Arbeit
      - Technische Probleme werden im Detail gelöst
    answer: 0
    explanation: Das Standup ist kurz und dient der Abstimmung. Details klären die Beteiligten direkt danach.
  - type: cloze
    text: Etwas, das dich an der Weiterarbeit hindert und das du nicht allein lösen kannst, nennt man einen ___.
    blanks:
      - [Blocker, Blocker-Punkt, Impediment]
    explanation: Blocker gehören ins Standup – je früher sie bekannt sind, desto schneller kann jemand helfen.
  - type: multiple
    question: Was macht eine gute Retrospektive aus? (mehrere Antworten)
    options:
      - Es werden konkrete Maßnahmen mit Verantwortlichen beschlossen
      - Alle können offen sprechen, ohne Schuldzuweisungen
      - Es wird gesucht, wer am Fehler schuld ist
      - Die Maßnahmen der letzten Retro werden überprüft
    answers: [0, 1, 3]
    explanation: Retros verbessern die Arbeitsweise des Teams. Schuldzuweisungen zerstören die Offenheit, die dafür nötig ist.
tasks:
  - id: kanal-waehlen
    type: dragdrop
    title: Asynchron oder synchron?
    description: Entscheide für jede Situation, ob sie besser asynchron (Chat, Ticket, PR-Kommentar) oder synchron (Call, Gespräch, Pairing) gelöst wird.
    targets:
      - { id: async, label: Asynchron }
      - { id: sync, label: Synchron }
    items:
      - { label: "Du willst wissen, warum eine Funktion so benannt ist", target: async }
      - { label: "Du informierst das Team, dass du morgen später anfängst", target: async }
      - { label: "Eine Architekturentscheidung soll für später festgehalten werden", target: async }
      - { label: "Die Bezahlseite ist seit fünf Minuten für alle Kund:innen kaputt", target: sync }
      - { label: "Eine Review-Diskussion dreht sich seit acht Kommentaren im Kreis", target: sync }
      - { label: "Du willst einer neuen Kollegin ein komplexes Modul erklären", target: sync }
  - id: gute-frage
    type: steps
    title: Gut um Hilfe bitten
    description: Du bist neu im Team. Deine Tests schlagen lokal mit einem Datenbankfehler fehl.
    steps:
      - situation: Du hast den Fehler gerade zum ersten Mal gesehen.
        question: Was machst du zuerst?
        options:
          - Fehlermeldung genau lesen, README und Doku durchsuchen, eine Timebox setzen
          - Sofort im Team-Chat „Tests gehen nicht“ schreiben
          - Die Tests auskommentieren
        answer: 0
        explanation: Erst selbst suchen – mit klarer Zeitgrenze. So lernst du und kommst mit einer besseren Frage zurück.
      - situation: Die Timebox ist abgelaufen, du kommst nicht weiter.
        question: Welche Nachricht schickst du in den Team-Kanal?
        options:
          - "„Hallo“ – und auf eine Antwort warten"
          - Ziel, vollständige Fehlermeldung als Text, Befehl, was du versucht hast und deine Vermutung
          - Einen Screenshot vom ganzen Bildschirm ohne Text
        answer: 1
        explanation: Mit allen Infos in einer Nachricht kann dir jemand direkt helfen – auch Stunden später, wenn du offline bist.
      - situation: Ben antwortet mit der Lösung. Ein fehlender Schritt im README war schuld.
        question: Was tust du danach?
        options:
          - Das README ergänzen und einen kleinen Pull Request öffnen
          - Nichts, Hauptsache es läuft
          - Ben bitten, das README zu ändern
        answer: 0
        explanation: So hilfst du der nächsten neuen Person – und lernst gleich den Ablauf eines Pull Requests kennen.
  - id: retro-phasen
    type: order
    title: Die Phasen einer Retrospektive
    description: Bringe die fünf Phasen einer klassischen Retrospektive in die richtige Reihenfolge.
    items:
      - "Rahmen setzen: Ziel klären, für eine offene Atmosphäre sorgen"
      - "Daten sammeln: Was ist im Sprint passiert?"
      - "Einsichten gewinnen: Warum ist es so gelaufen?"
      - "Maßnahmen beschließen: Was probieren wir konkret aus?"
      - "Abschließen: Ergebnisse festhalten und Retro bewerten"
---

„Hallo“ – mehr steht nicht in der Nachricht. Ben antwortet „Hallo?“ und wartet. Zwanzig Minuten später
kommt die eigentliche Frage, doch Ben ist schon im Meeting. Und erst am Freitag stellt sich heraus, dass
Anna seit Dienstag auf eine Antwort wartet. Gute Kommunikation ist kein Talent, sondern eine Reihe
einfacher Gewohnheiten.

## Asynchron oder synchron?

Bei [[asynchrone-kommunikation|asynchroner Kommunikation]] antwortet die andere Person, wann es ihr passt:
Chat-Threads, Tickets, Pull-Request-Kommentare. Bei [[synchrone-kommunikation|synchroner Kommunikation]]
seid ihr gleichzeitig da: Call, Gespräch, Pairing.

| | Asynchron | Synchron |
|---|---|---|
| Vorteil | niemand wird unterbrochen, alles nachlesbar | schnell, wenig Missverständnisse |
| Nachteil | Antworten dauern | unterbricht konzentrierte Arbeit |
| Gut für | Fragen, Entscheidungen, Code-Feedback | Notfälle, festgefahrene Diskussionen |

Viele Teams arbeiten „async first“: schriftlich als Standard, der Call als bewusste Ausnahme. Antworten
gehören in Threads, damit Kanäle übersichtlich bleiben.

> [!MERKSATZ]
> Ergebnisse eines Gesprächs gehören danach schriftlich ins Ticket oder in den Pull Request.

## Gute Fragen und Timeboxing

Eine gute Frage kann jemand beantworten, ohne zurückzufragen. Sie enthält Ziel, Fehlermeldung als
**Text**, Kontext (Branch, Befehl, Ticket), bisherige Versuche und deine Vermutung – alles in **einer**
Nachricht:

```text title="Eine gute Frage im Team-Kanal"
Ich will für SHOP-88 lokal die Tests laufen lassen (Branch fix/SHOP-88-login-fehler).
`php artisan test` bricht ab mit:
  SQLSTATE[HY000] [2002] Connection refused
Versucht: Container neu gestartet, .env mit .env.example verglichen.
Vermutung: Mir fehlt ein Datenbank-Container. Hat jemand einen Tipp?
```

Zu früh fragen heißt: Du lernst wenig und unterbrichst andere. Zu spät fragen heißt: Du verlierst einen Tag an etwas, das eine Kollegin in zwei Minuten gelöst hätte. Wann also fragen? Mit [[timeboxing|Timeboxing]] legst du vorher fest, wie lange du es allein versuchst – oft 30
bis 60 Minuten. Währenddessen notierst du deine Versuche; danach fragst du ohne schlechtes Gewissen.

> [!FEHLER]
> **Screenshot statt Text.** Eine Fehlermeldung als Bild kann niemand kopieren oder durchsuchen. Kopiere
> den Text in einen Code-Block.

## Das Daily Standup

Das [[daily-standup|Daily Standup]] ist eine kurze tägliche Abstimmung, höchstens 15 Minuten. Jede Person
sagt sinngemäß: Woran habe ich gearbeitet? Was kommt als Nächstes? Was blockiert mich?

Ein [[blocker|Blocker]] ist alles, was du nicht allein lösen kannst – ein fehlendes Review, eine unklare
Anforderung, ein fehlender Zugang. Je früher er genannt wird, desto schneller hilft jemand. Detailfragen
klären die Beteiligten direkt nach dem Standup, nicht währenddessen.

## Die Retrospektive

In der [[retrospektive|Retrospektive]] schaut das Team regelmäßig, oft am Sprint-Ende, auf seine
**Zusammenarbeit**. Bewährt sind fünf Phasen: Rahmen setzen, Daten sammeln, Einsichten gewinnen,
Maßnahmen beschließen, abschließen. Ein einfaches Format ist **Start / Stop / Continue**.

Retros funktionieren nur ohne Schuldzuweisungen. Gefragt wird nicht „Wer war es?“, sondern „Wie hat
unser Ablauf das möglich gemacht?“ – und am Ende stehen ein bis drei konkrete Maßnahmen mit
verantwortlicher Person.

> [!PRAXIS]
> Gute Teams beginnen jede Retro mit den Maßnahmen der letzten. Wurde nichts umgesetzt, ist genau das das
> wichtigste Thema.

## Zusammenfassung

- Asynchron für Nachvollziehbares, synchron für Dringendes und Festgefahrenes; Ergebnisse schriftlich festhalten.
- Gute Fragen enthalten Ziel, Fehlermeldung als Text, Kontext, Versuche und Vermutung – in einer Nachricht.
- Timeboxing: erst eine feste Zeit selbst suchen, dann fragen.
- Das Daily Standup ist eine kurze Abstimmung; Blocker werden früh genannt.
- Die Retrospektive verbessert die Zusammenarbeit mit konkreten Maßnahmen statt Schuldzuweisungen.
