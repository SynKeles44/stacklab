---
title: Vom Ziel zum MVP
summary: Wie du aus einer vagen Idee einen machbaren ersten Umfang schneidest – mit User Stories, MoSCoW und nicht-funktionalen Anforderungen.
duration: 20
sources:
  - title: Atlassian – User Stories mit Beispielen
    url: https://www.atlassian.com/agile/project-management/user-stories
  - title: Scrum Guide 2020 (deutsch)
    url: https://scrumguides.org/docs/scrumguide/v2020/2020-Scrum-Guide-German.pdf
  - title: Agile Business Consortium – MoSCoW Prioritisation
    url: https://www.agilebusiness.org/dsdm-project-framework/moscow-prioririsation.html
quiz:
  - type: single
    question: Was ist ein MVP?
    options:
      - Die vollständige App mit allen Wunschfunktionen.
      - Die kleinste Version, die echten Nutzen stiftet und sich ausprobieren lässt.
      - Ein Klick-Prototyp ohne Code.
      - Die wichtigste Datei im Projekt.
    answer: 1
    explanation: >
      Ein Minimum Viable Product ist klein, aber **brauchbar**: Es löst das Kernproblem so weit, dass echte
      Menschen es nutzen und dir Rückmeldung geben können.
  - type: cloze
    text: "Eine User Story folgt dem Muster: Als ___ möchte ich ___, damit ___."
    blanks:
      - [Rolle, Nutzer, Nutzerin, Person]
      - [Ziel, Funktion, Aktion]
      - [Nutzen, Grund, Mehrwert]
    explanation: Rolle, Ziel und Nutzen. Der Nutzen ist der wichtigste Teil – er erklärt, **warum** sich die Arbeit lohnt.
  - type: multiple
    question: Welche Punkte sind nicht-funktionale Anforderungen?
    options:
      - Die Workshop-Liste lädt in unter einer Sekunde.
      - Mitglieder können einen Platz buchen.
      - Passwörter werden nur als Hash gespeichert.
      - Die Seite ist per Tastatur bedienbar.
    answers: [0, 2, 3]
    explanation: >
      „Platz buchen“ beschreibt **was** die App tut (funktional). Geschwindigkeit, Sicherheit und
      Barrierefreiheit beschreiben, **wie gut** sie es tut (nicht-funktional).
  - type: match
    question: Ordne die MoSCoW-Kategorien zu.
    pairs:
      - { left: "Muss", right: "Ohne das ist Version 1 wertlos" }
      - { left: "Soll", right: "Wichtig, aber es gibt eine Notlösung" }
      - { left: "Kann", right: "Schön, wenn Zeit übrig ist" }
      - { left: "Nicht jetzt", right: "Bewusst für später geparkt" }
    explanation: MoSCoW zwingt dich, Wünsche nach ihrem Wert für Version 1 zu sortieren – nicht nach Begeisterung.
tasks:
  - id: moscow-sortieren
    type: dragdrop
    title: Sortiere die Wünsche für Version 1
    description: >
      Der Vorstand des Sportvereins hat eine lange Wunschliste geschickt. Dein Zeitbudget für Version 1 sind
      etwa vier Tage. Ordne jeden Wunsch der passenden MoSCoW-Kategorie zu.
    targets:
      - { id: muss, label: Muss }
      - { id: soll, label: Soll }
      - { id: kann, label: Kann }
      - { id: nicht, label: Nicht jetzt }
    items:
      - { label: Kommende Workshops ansehen, target: muss }
      - { label: Einen Platz buchen, target: muss }
      - { label: Nie mehr Buchungen als Plätze, target: muss }
      - { label: Freie Plätze in der Liste anzeigen, target: soll }
      - { label: Buchung stornieren, target: soll }
      - { label: Erinnerungs-Mail am Vortag, target: kann }
      - { label: Dunkles Farbschema, target: kann }
      - { label: Online-Bezahlung der Kursgebühr, target: nicht }
      - { label: Eigene Smartphone-App, target: nicht }
    hints:
      - Frag bei jedem Punkt, ob Version 1 ohne ihn noch einen echten Nutzen hätte.
      - Bezahlung und eine eigene App kosten jeweils mehr Zeit als das ganze MVP.
  - id: scope-creep-erkennen
    type: steps
    title: Scope Creep im Alltag
    description: Spiel durch, wie ein Projekt unbemerkt wächst – und wie du gegensteuerst.
    steps:
      - situation: >
          Tag 2: Die API steht halb. Die Kassenwartin fragt, ob man „nicht schnell noch“ eine Bezahlfunktion
          einbauen kann. Sie steht in deiner Liste unter „Nicht jetzt“.
        question: Was ist die beste Reaktion?
        options:
          - Sofort einbauen, sie hat ja gefragt.
          - Den Wunsch notieren, auf die MoSCoW-Liste verweisen und für Version 2 vormerken.
          - Den Wunsch ignorieren und nicht antworten.
        answer: 1
        explanation: >
          Die Liste ist eure gemeinsame Absprache. Neue Wünsche sind willkommen – aber sie landen erst in der
          Planung, nicht direkt im Code.
      - situation: >
          Tag 3: Du merkst, dass „Buchung stornieren“ (Soll) mehr Arbeit macht als gedacht. Der Termin für die
          Vorführung steht.
        question: Was tust du?
        options:
          - Die Vorführung verschieben, bis alles fertig ist.
          - Erst alle Muss-Punkte fertig und getestet machen, Soll-Punkte danach – oder offen kommunizieren, dass sie in Version 1.1 kommen.
          - Die Tests weglassen, um Zeit zu sparen.
        answer: 1
        explanation: >
          Genau dafür gibt es die Kategorien: Muss-Punkte haben Vorrang, Soll-Punkte dürfen rutschen. Tests
          wegzulassen spart nur scheinbar Zeit.
---
Die Idee klingt einfach: „Eine App, mit der unsere Vereinsmitglieder Workshops buchen.“ Fragst du drei
Menschen, was das genau heißt, bekommst du drei verschiedene Apps beschrieben – mit Bezahlung, Wartelisten,
Chat und Smartphone-App. Bevor du die erste Zeile Code schreibst, legst du deshalb fest, **was Version 1
wirklich können muss**. Das ist die erste Phase deines Capstone-Projekts.

## Warum zuerst schneiden?

Ein Projekt scheitert selten an Technik, sondern fast immer am **Umfang**. Wer alles auf einmal bauen will,
hat nach zwei Wochen zehn halbe Funktionen und keine einzige, die man zeigen kann.

Die Antwort ist ein [[mvp|MVP]] (Minimum Viable Product): die kleinste Version, die echten Nutzen stiftet.
Für Vereinskurse heißt das: Workshops ansehen, einen Platz buchen, und es gibt nie mehr Buchungen als Plätze.
Alles andere kommt später.

| Ohne Schnitt | Mit MVP |
|---|---|
| Zehn Funktionen zu je 50 % | Drei Funktionen zu 100 % |
| Nichts lässt sich vorführen | Nach wenigen Tagen benutzbar |
| Rückmeldung erst ganz am Ende | Rückmeldung nach Version 1 |

> [!MERKSATZ]
> Ein MVP ist **klein, aber fertig**. Lieber drei Funktionen, die zuverlässig laufen, als zehn, die halb gehen.

## Anforderungen als User Stories

Eine [[funktionale-anforderung|funktionale Anforderung]] beschreibt, **was** die App tut. Damit sie
verständlich bleibt, formulierst du sie als [[user-story|User Story]] aus Sicht der Menschen, die sie nutzen:

```text title="Muster und Beispiele"
Als <Rolle> möchte ich <Ziel>, damit <Nutzen>.

- Als Mitglied möchte ich die kommenden Workshops sehen, damit ich einen passenden finde.
- Als Mitglied möchte ich einen Platz buchen, damit er für mich reserviert ist.
- Als Organisatorin möchte ich einen Workshop anlegen, damit Mitglieder ihn buchen können.
```

Der **Nutzen** ist der wichtigste Teil. Fällt dir keiner ein, ist die Story vermutlich überflüssig. Zu jeder
Story gehören [[akzeptanzkriterien|Akzeptanzkriterien]] – überprüfbare Sätze wie „Ist der Workshop voll,
wird die Buchung mit einer verständlichen Meldung abgelehnt“. Aus ihnen werden später deine Tests.

> [!PRAXIS]
> In Teams stehen User Stories als Tickets im Backlog. Gute Akzeptanzkriterien sparen Diskussionen im
> Code-Review, weil klar ist, wann eine Story „fertig“ ist.

## Prioritäten mit MoSCoW

Hast du alle Wünsche gesammelt, sortierst du sie mit der [[moscow-priorisierung|MoSCoW-Methode]]. Der Name
kommt von den englischen Kategorien Must, Should, Could, Won't:

| Kategorie | Bedeutung | Beispiel Vereinskurse |
|---|---|---|
| Muss | Ohne das ist Version 1 wertlos | Workshops ansehen, buchen |
| Soll | Wichtig, aber es gibt eine Notlösung | Buchung stornieren |
| Kann | Schön, wenn Zeit übrig ist | Erinnerungs-Mail |
| Nicht jetzt | Bewusst geparkt | Bezahlung, Warteliste |

Die Kategorie „Nicht jetzt“ ist die wertvollste. Sie schützt dich vor [[scope-creep|Scope Creep]] – dem
schleichenden Wachsen eines Projekts durch „nur noch schnell“-Wünsche.

> [!FEHLER]
> Die Liste „Nicht jetzt“ leer lassen. Dann hast du nichts, worauf du bei neuen Wünschen verweisen kannst –
> und jede Idee landet direkt im Code.

## Nicht-funktionale Anforderungen

Neben dem **Was** gibt es das **Wie gut**. [[nicht-funktionale-anforderung|Nicht-funktionale Anforderungen]]
beschreiben Qualität: Geschwindigkeit, Sicherheit, Barrierefreiheit, Zuverlässigkeit. Sie werden gern
vergessen, weil sie in keiner Story auftauchen.

- **Korrektheit:** Es gibt nie mehr Buchungen als Plätze – auch wenn zwei Menschen gleichzeitig klicken.
- **Geschwindigkeit:** Die Workshop-Liste antwortet in unter einer Sekunde.
- **Sicherheit:** Passwörter liegen nur als Hash in der Datenbank, der Login ist gegen Rateversuche gedrosselt.
- **Bedienbarkeit:** Alle Formulare funktionieren per Tastatur.

Schreib sie so, dass man sie **prüfen** kann. „Die App ist schnell“ lässt sich nicht testen, „unter einer
Sekunde“ schon. Mehrere dieser Punkte wirst du später als Test, als Datenbank-Constraint oder als
Middleware wiederfinden.

## Die Checkliste für Phase 1

Bevor du weitermachst, sollte `docs/anforderungen.md` diese Fragen beantworten:

1. Wer nutzt die App (Rollen)?
2. Welche drei bis fünf User Stories sind **Muss**?
3. Was ist ausdrücklich **Nicht jetzt**?
4. Welche Qualitätsziele gelten, und wie prüfst du sie?
5. Woran erkennst du, dass Version 1 fertig ist? (deine [[definition-of-done|Definition of Done]])

Plane für diese Phase höchstens eine Stunde ein. Du wirst unterwegs Neues lernen – das Dokument darf
wachsen. Wichtig ist nur, dass Änderungen **bewusst** passieren.

## Zusammenfassung

- Ein **MVP** ist die kleinste Version mit echtem Nutzen – klein, aber fertig.
- **User Stories** beschreiben Funktionen aus Sicht der Nutzenden: Rolle, Ziel, Nutzen.
- **Akzeptanzkriterien** machen Stories überprüfbar und werden später zu Tests.
- **MoSCoW** sortiert Wünsche in Muss, Soll, Kann und Nicht jetzt.
- Die Liste **Nicht jetzt** schützt vor Scope Creep.
- **Nicht-funktionale Anforderungen** beschreiben Qualität und müssen messbar sein.
