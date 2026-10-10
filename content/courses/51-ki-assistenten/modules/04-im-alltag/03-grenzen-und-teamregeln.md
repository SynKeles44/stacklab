---
title: Grenzen kennen, Teamregeln vereinbaren
summary: Wann KI-Assistenten nicht helfen, wie du deine eigenen Fähigkeiten schützt und welche Regeln ein Team gemeinsam festlegt.
duration: 20
sources:
  - title: OWASP Top 10 for LLM Applications – Overreliance / Misinformation
    url: https://genai.owasp.org/llm-top-10/
  - title: AGENTS.md – offenes Format für Anweisungen an Coding-Agenten
    url: https://agents.md/
  - title: GitHub Docs – Responsible use of GitHub Copilot features
    url: https://docs.github.com/en/copilot/responsible-use
quiz:
  - type: multiple
    question: In welchen Situationen ist ein KI-Assistent eher **keine** gute Wahl?
    options:
      - Du kannst das Ergebnis weder lesen noch prüfen, weil dir das Fachwissen fehlt.
      - Die Aufgabe braucht Kundendaten, die euer Werkzeug nicht verarbeiten darf.
      - Du willst Testfälle für eine gut verstandene Funktion ergänzen.
      - Es geht um eine sicherheitskritische Entscheidung, die niemand reviewen wird.
    answers: [0, 1, 3]
    explanation: >
      KI lohnt sich, wo du das Ergebnis prüfen kannst und darfst. Ohne Prüfmöglichkeit, ohne Erlaubnis oder ohne
      Review wird aus Geschwindigkeit Risiko.
  - type: single
    question: Eine Junior-Entwicklerin lässt jede Aufgabe vollständig vom Agenten lösen und versteht die Ergebnisse kaum. Was ist das größte Problem?
    options:
      - Es kostet zu viele Tokens.
      - Sie baut die Fähigkeiten nicht auf, mit denen sie KI-Ergebnisse überhaupt beurteilen kann.
      - Der Code ist automatisch schlechter als handgeschriebener.
      - Es verstößt gegen die Lizenz des Werkzeugs.
    answer: 1
    explanation: >
      Prüfen kann nur, wer versteht. Wer Grundlagen nie selbst erarbeitet, kann Fehler nicht erkennen – genau
      dann, wenn es darauf ankommt.
  - type: match
    question: Ordne jede Teamregel dem Risiko zu, das sie begrenzt.
    pairs:
      - { left: "Nur freigegebene Werkzeuge und Tarife nutzen", right: "Datenabfluss an unbekannte Anbieter" }
      - { left: "Jede KI-Änderung geht durch dasselbe Code-Review", right: "unentdeckte Fehler im Hauptbranch" }
      - { left: "Neue Abhängigkeiten nur nach Prüfung und Begründung", right: "erfundene oder bösartige Pakete" }
      - { left: "Agenten arbeiten ohne Produktionszugänge", right: "Schaden durch Prompt Injection oder Fehlbedienung" }
    explanation: Gute Teamregeln sind kurz und benennen konkrete Risiken – keine allgemeinen Appelle.
  - type: cloze
    text: "Das Risiko, Ausgaben eines Modells ungeprüft zu vertrauen, nennt man ___ (englisch overreliance). Eine Teamregel dagegen lautet: Jede Änderung braucht einen menschlichen ___."
    blanks:
      - [Übervertrauen, Overreliance, übermäßiges Vertrauen]
      - [Review, Reviewer, Reviewerin]
    explanation: Überprüfung ist kein Misstrauen gegen eine Person, sondern ein fester Schritt im Ablauf.
tasks:
  - id: einsatz-einschaetzen
    type: dragdrop
    title: KI einsetzen – ja, mit Vorsicht oder lieber nicht?
    description: Ordne jede Situation ein. Denke an Prüfbarkeit, Daten und Verantwortung.
    targets:
      - { id: ja, label: Gut geeignet }
      - { id: vorsicht, label: Mit Vorsicht – nur mit gründlicher Prüfung }
      - { id: nein, label: Lieber nicht }
    items:
      - { label: "Testfälle für eine Funktion ergänzen, die du gut verstehst", target: ja }
      - { label: "Einen unbekannten regulären Ausdruck erklären lassen und mit Beispielen prüfen", target: ja }
      - { label: "Eine Datenbank-Migration für eine Tabelle mit Millionen Zeilen schreiben lassen", target: vorsicht }
      - { label: "Code für die Passwort-Prüfung im Login entwerfen lassen", target: vorsicht }
      - { label: "Ein Support-Ticket mit echten Kundendaten in einen privaten Chat-Account kopieren", target: nein }
      - { label: "Eine Übungsaufgabe lösen lassen, deren Thema du gerade lernen willst – ohne sie danach zu verstehen", target: nein }
  - id: teamregeln-entscheiden
    type: steps
    title: Ein Team führt KI-Assistenten ein
    description: Dein Team möchte KI-Assistenten offiziell nutzen. Du hilfst, die Regeln festzulegen.
    steps:
      - situation: Jeder im Team nutzt bisher ein anderes Werkzeug mit privaten Accounts.
        question: Was regelt ihr zuerst?
        options:
          - Wer das beste Werkzeug hat
          - Welche Werkzeuge und Tarife erlaubt sind und welche Daten sie verarbeiten dürfen
          - Wie viele Zeilen Code pro Tag mit KI entstehen sollen
        answer: 1
        explanation: Zuerst geht es um Datenschutz und Verträge. Private Accounts haben oft andere Bedingungen als Firmenverträge.
      - situation: Ein Kollege schlägt vor, KI-generierten Code ohne Review zu mergen, „weil die Tests ja laufen“.
        question: Wie lautet eine sinnvolle Regel?
        options:
          - KI-Code wird genauso reviewt wie jeder andere Code; verantwortlich ist, wer ihn einreicht.
          - KI-Code braucht nie ein Review.
          - KI-Code wird verboten.
        answer: 0
        explanation: Die Herkunft ändert nichts an den Qualitätsansprüchen. Gleiche Regeln für alle Änderungen sind einfach und fair.
      - situation: Ihr wollt, dass Agenten eure Konventionen und Verbote kennen.
        question: Wo haltet ihr sie fest?
        options:
          - In einer versionierten Projekt-Anweisungsdatei wie AGENTS.md, die per Review geändert wird
          - In den privaten Einstellungen jeder Person
          - Gar nicht, die Agenten lernen es von selbst
        answer: 0
        explanation: Eine Datei im Repository gilt für alle Werkzeuge und alle Personen gleich und hat eine nachvollziehbare Historie.
---
Ein Team hat KI-Assistenten eingeführt und liefert plötzlich doppelt so viele Pull Requests. Drei Monate
später ist die Fehlerquote gestiegen, die Reviews dauern ewig, und zwei Junior-Entwickler können ohne
Assistent kaum noch debuggen. Werkzeuge waren nicht das Problem – fehlende Grenzen und Regeln schon.

## Wo KI-Assistenten an Grenzen stoßen

Aus den bisherigen Lektionen kennst du die technischen Gründe. Hier die Situationen, in denen sie
besonders spürbar werden:

| Grenze | Beispiel |
|---|---|
| Wissen, das nirgends steht | Absprachen mit dem Kunden, Gründe für alte Entscheidungen |
| aktuelle oder seltene Technik | brandneue Versionen, interne Bibliotheken |
| große Zusammenhänge | Architekturentscheidungen über viele Systeme |
| Verantwortung | rechtliche, ethische und geschäftliche Abwägungen |
| exakte Arbeit | Zählen, präzise Berechnungen ohne Werkzeug |

Ein Assistent kann bei all dem helfen – Optionen sammeln, Fragen stellen, Entwürfe schreiben. Die
Entscheidung und das Wissen über euren Kontext liegen bei Menschen.

> [!MERKSATZ]
> Setze KI dort ein, wo du das Ergebnis **prüfen kannst**, **prüfen darfst** und **prüfen wirst**.
> Fehlt eins davon, wird aus Geschwindigkeit Risiko.

## Wann du lieber selbst arbeitest

Manchmal ist der Assistent schlicht nicht der schnellste Weg:

- **Die Aufgabe ist kleiner als ihre Beschreibung.** Eine Zeile ändern geht schneller als erklären.
- **Du kannst das Ergebnis nicht beurteilen.** Ohne Fachwissen siehst du die Fehler nicht.
- **Die Daten dürfen nicht raus.** Kundendaten, Geheimnisse, vertrauliche Verträge.
- **Du lernst gerade das Thema.** Wer sich die Lösung nur geben lässt, lernt sie nicht.
- **Es läuft im Kreis.** Nach drei gescheiterten Versuchen ist Nachdenken schneller als Nachfragen.

> [!FEHLER]
> **Verlernen durch Abgeben.** Wer jede Fehlersuche und jeden Test abgibt, verliert genau die Fähigkeiten,
> die man braucht, um KI-Ergebnisse zu prüfen. Löse Grundlagen bewusst auch selbst – besonders am Anfang
> deiner Laufbahn.

## Übervertrauen erkennen

Je öfter ein Assistent richtig liegt, desto weniger prüfen wir. Dieses
[[uebervertrauen|Übervertrauen]] ist eines der größten Risiken – nicht weil das Modell schlechter wird,
sondern weil wir nachlässiger werden.

Warnzeichen bei dir selbst:

- Du übernimmst Vorschläge, ohne den Diff zu lesen.
- Du kannst im Review nicht erklären, warum eine Zeile so ist.
- Du suchst Fehler nur noch, indem du den Assistenten fragst.

Gegenmittel: feste Prüfschritte, die nicht von der Laune abhängen – Tests, Review, Checklisten.

## Teamregeln festlegen

Ein Team braucht wenige, klare Regeln. Bewährt haben sich diese Bausteine:

1. **Werkzeuge und Daten** – Welche Werkzeuge und Tarife sind erlaubt? Welche Daten dürfen hinein?
2. **Verantwortung** – Wer einreicht, versteht und verantwortet den Code. KI-Code geht durch dasselbe
   [[code-review|Code-Review]].
3. **Abhängigkeiten** – Neue Pakete nur nach Prüfung und mit Begründung im Pull Request.
4. **Agenten-Rechte** – Agenten arbeiten auf Branches, ohne Produktionszugänge; Push und Merge macht ein
   Mensch.
5. **Kennzeichnung** – ob und wie KI-Beteiligung vermerkt wird.
6. **Projektwissen** – Konventionen und Verbote stehen in einer versionierten
   [[projekt-anweisungsdatei|Projekt-Anweisungsdatei]].

```markdown title="Ausschnitt aus einer Team-Richtlinie"
## KI-Assistenten
- Erlaubt: die Werkzeuge aus dem Firmenvertrag. Keine privaten Accounts.
- Keine Kundendaten, Secrets oder Logs mit personenbezogenen Daten in Prompts.
- Jede Änderung braucht ein menschliches Review – unabhängig von der Herkunft.
- Neue Abhängigkeiten werden im PR begründet.
- Agenten: kein Push, kein Merge, keine Produktionszugänge.
```

> [!PRAXIS]
> Überprüft die Regeln regelmäßig, etwa in der [[retrospektive|Retrospektive]]: Werkzeuge ändern sich
> schnell, und eine Regel, die niemand befolgt, ist schlechter als keine.

## Zusammenfassung

- KI hilft dort, wo du Ergebnisse prüfen kannst, darfst und wirst.
- Grenzen: fehlender Kontext, neue oder seltene Technik, große Zusammenhänge, Verantwortung.
- Arbeite selbst, wenn die Aufgabe winzig ist, Daten tabu sind oder du gerade lernst.
- Übervertrauen ist ein Risiko – feste Prüfschritte sind das Gegenmittel.
- Teams regeln Werkzeuge, Daten, Verantwortung, Abhängigkeiten, Agenten-Rechte und Kennzeichnung.
