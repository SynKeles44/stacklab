---
title: Zielgruppen und die vier Doku-Arten
summary: Für wen du schreibst und warum Tutorial, How-to-Anleitung, Referenz und Erklärung getrennt gehören (Diátaxis).
duration: 20
sources:
  - title: Diátaxis – A systematic approach to technical documentation
    url: https://diataxis.fr/
  - title: Diátaxis – The compass
    url: https://diataxis.fr/compass/
quiz:
  - type: single
    question: Eine Seite erklärt Schritt für Schritt, wie man den Port des Servers von 3000 auf 8080 ändert. Welche Doku-Art ist das?
    options:
      - Tutorial
      - How-to-Anleitung
      - Referenz
      - Erklärung
    answer: 1
    explanation: >
      Die Leserin kann schon mit dem Projekt arbeiten und hat ein konkretes Ziel. Das ist eine How-to-Anleitung.
      Ein Tutorial würde jemanden an die Hand nehmen, der das Projekt zum ersten Mal sieht.
  - type: match
    question: Ordne jeder Doku-Art die Frage zu, die sie beantwortet.
    pairs:
      - { left: "Tutorial", right: "Kannst du mir das beibringen?" }
      - { left: "How-to-Anleitung", right: "Wie erledige ich genau diese Aufgabe?" }
      - { left: "Referenz", right: "Was genau bedeutet diese Option?" }
      - { left: "Erklärung", right: "Warum ist das so gebaut?" }
    explanation: Jede Doku-Art bedient ein anderes Bedürfnis. Mischst du sie, wird jede Seite für alle schlechter.
  - type: multiple
    question: Was gehört in eine gute Referenz?
    options:
      - Vollständige, genaue Angaben – zum Beispiel jede Option mit Typ und Standardwert.
      - Eine lange Geschichte, wie das Team auf die Idee kam.
      - Eine einheitliche Struktur, sodass man schnell nachschlagen kann.
      - Möglichst viele persönliche Meinungen.
    answers: [0, 2]
    explanation: >
      Eine Referenz ist wie ein Wörterbuch: nüchtern, vollständig, gleich aufgebaut. Hintergründe und Meinungen
      gehören in eine Erklärung.
  - type: cloze
    text: Das Modell mit den vier Doku-Arten heißt ___. Eine Doku-Art, die das Warum hinter einer Entscheidung beschreibt, heißt ___.
    blanks:
      - [Diátaxis, Diataxis]
      - [Erklärung, Erklaerung, Explanation]
    explanation: Diátaxis unterscheidet Tutorials, How-to-Anleitungen, Referenz und Erklärung.
tasks:
  - id: kompass-beschriften
    type: diagram
    title: Beschrifte den Diátaxis-Kompass
    description: >
      Die vier Felder zeigen die Doku-Arten nach Diátaxis. Ordne jedem Feld seinen Namen zu. Achte auf die
      Achsen: oben geht es ums Tun, unten ums Verstehen; links liest jemand beim Lernen, rechts beim Arbeiten.
    image: /assets/dokumentation-schreiben/diataxis-leer.svg
    slots:
      - { x: 37, y: 25, answer: Tutorial }
      - { x: 78, y: 25, answer: How-to-Anleitung }
      - { x: 37, y: 61, answer: Erklärung }
      - { x: 78, y: 61, answer: Referenz }
    distractors: [Changelog, README]
    hints:
      - Die kleinen Beispiele in den Feldern verraten viel – „Alle Optionen der CLI“ schlägt man nach.
  - id: doku-sortieren
    type: dragdrop
    title: Welche Doku-Art ist das?
    description: Ordne jede Seite der Doku-Art zu, zu der sie gehört.
    targets:
      - { id: tutorial, label: Tutorial }
      - { id: howto, label: How-to-Anleitung }
      - { id: referenz, label: Referenz }
      - { id: erklaerung, label: Erklärung }
    items:
      - { label: "Dein erstes Projekt in 15 Minuten – Schritt für Schritt", target: tutorial }
      - { label: Einsteigerkurs mit Übungsprojekt für neue Kolleg:innen, target: tutorial }
      - { label: So stellst du die Datenbank auf PostgreSQL um, target: howto }
      - { label: So setzt du ein vergessenes Admin-Passwort zurück, target: howto }
      - { label: Liste aller Umgebungsvariablen mit Standardwert, target: referenz }
      - { label: Alle API-Endpunkte mit Parametern und Antworten, target: referenz }
      - { label: Warum wir Events statt direkter Aufrufe verwenden, target: erklaerung }
      - { label: Wie das Caching im Hintergrund funktioniert, target: erklaerung }
    hints:
      - "Frag dich bei jeder Seite: Will die Person etwas lernen, etwas erledigen, etwas nachschlagen oder etwas verstehen?"
---
Stell dir ein Kochbuch vor, in dem mitten im Rezept für Lasagne drei Seiten über die Geschichte der Nudel
stehen – und die Liste aller Zutaten über das ganze Buch verstreut ist. Unbenutzbar. Viele Projekt-Dokus
sehen genau so aus. Die Lösung: Überlege zuerst, **wer** liest und **was** diese Person gerade will.

## Wer liest deine Doku?

Die [[zielgruppe|Zielgruppe]] ist die Gruppe von Menschen, für die du schreibst. Bei Software-Doku sind es
meistens diese:

| Zielgruppe | Will vor allem … | Typische Frage |
|---|---|---|
| Nutzer:innen | das Programm benutzen | „Wie exportiere ich meine Daten?“ |
| Neue Teammitglieder | das Projekt starten und verstehen | „Wie läuft das lokal?“ |
| Erfahrene Entwickler:innen | Details nachschlagen | „Welche Optionen hat diese Funktion?“ |
| Betrieb (Ops) | die Software installieren und überwachen | „Welche Ports braucht der Dienst?“ |

Eine Seite für alle funktioniert nicht. Für Einsteiger:innen ist sie zu knapp, für Profis zu langatmig.
Schreib deshalb jede Seite für **eine** Zielgruppe und sag am Anfang, für wen sie gedacht ist.

> [!MERKSATZ]
> Bevor du schreibst, beantworte zwei Fragen: **Wer** liest das? Und **was** will diese Person gerade tun?

## Diátaxis: vier Arten von Doku

[[diataxis|Diátaxis]] ist ein bekanntes Modell, das Dokumentation in **vier Arten** einteilt. Es geht nicht um
Dateiformate, sondern um das Bedürfnis der Leser:innen.

![Der Diátaxis-Kompass: Tutorial, How-to-Anleitung, Erklärung und Referenz](/assets/dokumentation-schreiben/diataxis.svg)

Zwei Fragen ordnen jede Seite ein:

1. Geht es ums **Tun** (Praxis) oder ums **Verstehen** (Theorie)?
2. Liest die Person **beim Lernen** oder **beim Arbeiten** an einer echten Aufgabe?

Aus den Kombinationen entstehen die vier Arten.

## Tutorial und How-to-Anleitung

Beide sind praktisch, aber sie haben verschiedene Leser:innen.

Ein [[tutorial|Tutorial]] nimmt Anfänger:innen an die Hand. Es führt durch ein kleines, garantiert
funktionierendes Beispiel. Ziel ist ein Erfolgserlebnis und Lernen – nicht Vollständigkeit.

Eine [[how-to-anleitung|How-to-Anleitung]] richtet sich an Leute, die schon arbeiten können. Sie löst **ein**
konkretes Problem in nummerierten Schritten – ohne Grundlagen zu erklären.

| | Tutorial | How-to-Anleitung |
|---|---|---|
| Leser:in | Anfänger:in | Kann schon arbeiten |
| Ziel | Lernen durch Tun | Eine Aufgabe erledigen |
| Titel-Beispiel | „Deine erste App in 15 Minuten“ | „So änderst du den Port“ |
| Darf fehlen | Sonderfälle, Alternativen | Erklärungen, Grundlagen |

> [!FEHLER]
> Ein Tutorial, das in Schritt 3 erst fünf Varianten der Installation vergleicht. Anfänger:innen brauchen
> **einen** sicheren Weg. Die Varianten gehören in eine How-to-Anleitung.

## Referenz und Erklärung

[[referenzdokumentation|Referenz]] ist zum **Nachschlagen**: nüchtern, vollständig und immer gleich
aufgebaut – wie ein Wörterbuch. Typisch sind Listen aller Optionen, Befehle oder API-Endpunkte.

```markdown title="Ein Eintrag in einer Referenz"
### PORT

Port, auf dem der Server lauscht.

- Typ: Zahl
- Standardwert: 3000
- Beispiel: PORT=8080
```

Eine [[erklaerung-doku|Erklärung]] beantwortet das **Warum**. Sie beschreibt Hintergründe, Entscheidungen und
Zusammenhänge: „Warum nutzen wir eine Warteschlange?“ Sie darf Meinungen und Alternativen enthalten – eine
Referenz nicht.

## Diátaxis im Repository

In echten Projekten spiegelt sich das Modell oft in der Ordnerstruktur:

```text title="Ein docs-Ordner nach Diátaxis"
docs/
├── tutorials/
│   └── erste-schritte.md
├── how-to/
│   ├── port-aendern.md
│   └── datenbank-wechseln.md
├── reference/
│   └── konfiguration.md
└── explanation/
    └── architektur.md
```

Du musst nicht mit vier Ordnern starten. Ein kleines Projekt kommt mit einer [[readme|README]] aus. Wächst die
Doku, hilft dir die Frage „Welche Art ist diese Seite?“, sie sauber einzusortieren.

> [!PRAXIS]
> Wenn sich jemand über „unübersichtliche Doku“ beschwert, liegt es fast immer an vermischten Arten: eine
> Anleitung, die nebenbei alles erklärt, oder eine Referenz voller Geschichten. Trennen hilft sofort.

## Zusammenfassung

- Schreib jede Seite für **eine Zielgruppe** mit **einem Ziel**.
- **Diátaxis** teilt Doku in vier Arten: Tutorial, How-to-Anleitung, Referenz, Erklärung.
- **Tutorial**: Anfänger:innen lernen an einem sicheren Beispiel.
- **How-to-Anleitung**: Eine konkrete Aufgabe in nummerierten Schritten.
- **Referenz**: vollständig, nüchtern, zum Nachschlagen.
- **Erklärung**: das Warum hinter Entscheidungen und Konzepten.
