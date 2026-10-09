---
title: Markdown-Grundlagen
summary: Überschriften, Absätze, Hervorhebungen, Listen, Links und Bilder – das Handwerkszeug für jede Doku-Datei.
duration: 25
sources:
  - title: CommonMark – Spezifikation und Kurzreferenz
    url: https://commonmark.org/help/
  - title: GitHub Docs – Grundlegende Schreib- und Formatierungssyntax
    url: https://docs.github.com/de/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax
quiz:
  - type: single
    question: Welche Zeile wird zu einer Überschrift der zweiten Ebene?
    options:
      - "##Installation"
      - "## Installation"
      - "Installation ##"
      - "# # Installation"
    answer: 1
    explanation: >
      Eine Überschrift braucht nach den Rauten ein Leerzeichen. `##Installation` ohne Leerzeichen erkennen
      viele Markdown-Programme nicht als Überschrift.
  - type: find-bug
    question: In welcher Zeile ist der Link kaputt?
    language: markdown
    code: |
      # Hilfe

      Mehr steht in der [Installationsanleitung](docs/installation.md).
      Fragen stellst du im [Forum] (https://forum.example.com).
      Den Quellcode findest du auf [GitHub](https://github.com/example/app).
    bug_line: 4
    explanation: >
      Zwischen `]` und `(` darf kein Leerzeichen stehen. Sonst zeigt Markdown den Text einfach so an,
      inklusive Klammern, statt einen Link zu bauen.
  - type: match
    question: Ordne jede Markdown-Schreibweise ihrer Wirkung zu.
    pairs:
      - { left: "**wichtig**", right: "Fett" }
      - { left: "*betont*", right: "Kursiv" }
      - { left: "`npm install`", right: "Code im Fließtext" }
      - { left: "1. Schritt", right: "Nummerierte Liste" }
      - { left: "![Logo](logo.png)", right: "Bild" }
    explanation: Mit diesen fünf Schreibweisen kommst du in fast jeder README aus.
  - type: cloze
    text: Ein Bild schreibst du als `![___](pfad.png)`. Der Text in den eckigen Klammern heißt ___ und wird von Screenreadern vorgelesen.
    blanks:
      - [Beschreibung, Alt-Text, Alternativtext, alt]
      - [Alt-Text, Alternativtext, alt, Alttext]
    explanation: Der Alt-Text beschreibt das Bild für Menschen, die es nicht sehen können – und erscheint, wenn das Bild nicht lädt.
tasks:
  - id: markdown-reparieren
    type: terminal
    title: Repariere eine kaputte Markdown-Datei
    description: |
      Im Ordner `markdown-reparieren` liegt `hilfe.md`. Jemand hat sie hastig geschrieben – auf GitHub sieht sie
      kaputt aus. Repariere sie:

      1. Die Überschriften brauchen ein Leerzeichen nach den Rauten (`# Hilfe`, `## Installation`, `## Kontakt`).
      2. Der Link zur Doku ist kaputt: Zwischen `]` und `(` steht ein Leerzeichen.
      3. Das Bild `screenshot.png` hat keinen Alt-Text. Gib ihm eine Beschreibung in den eckigen Klammern.
      4. Die Aufzählung unter „Installation“ soll eine **nummerierte** Liste (`1.`, `2.`, `3.`) werden.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit die Datei angelegt wird.
    workdir: markdown-reparieren
    setup: |
      cat > hilfe.md <<'EOF'
      #Hilfe

      Diese App verwaltet deine Notizen.

      ![](screenshot.png)

      ##Installation

      - App herunterladen
      - Datei entpacken
      - `notes` im Terminal starten

      Mehr steht in der [Doku] (https://example.com/docs).

      ##Kontakt

      Schreib an user@example.com.
      EOF
    checks:
      - type: command
        run: grep -cE '^#{1,6}[^# ]' hilfe.md || true
        stdout_equals: "0"
        message: Mindestens eine Überschrift hat noch kein Leerzeichen nach den Rauten (z. B. `##Installation`).
      - type: command
        run: grep -cE '^(# Hilfe|## Installation|## Kontakt)\s*$' hilfe.md
        stdout_equals: "3"
        message: "Es sollen die drei Überschriften `# Hilfe`, `## Installation` und `## Kontakt` vorkommen."
      - type: file_contains
        path: hilfe.md
        pattern: "\\[Doku\\]\\(https://example\\.com/docs\\)"
        message: "Der Link ist noch kaputt. Richtig ist `[Doku](https://example.com/docs)` – ohne Leerzeichen zwischen ] und (."
      - type: file_contains
        path: hilfe.md
        pattern: "!\\[[^\\]]*\\S[^\\]]*\\]\\(screenshot\\.png\\)"
        message: Das Bild braucht einen Alt-Text, z. B. `![Hauptansicht der App mit drei Notizen](screenshot.png)`.
      - type: command
        run: grep -cE '^[1-3]\. ' hilfe.md
        stdout_equals: "3"
        message: Die drei Installationsschritte sollen eine nummerierte Liste mit 1., 2. und 3. sein.
    hints:
      - Öffne die Datei mit `nano hilfe.md`. Eine Überschrift ist `#`, dann ein Leerzeichen, dann der Text.
      - "Ein Link hat die Form `[Text](Adresse)` – ohne Leerzeichen dazwischen. Ein Bild sieht genauso aus, nur mit `!` davor."
      - "Aus `- App herunterladen` wird `1. App herunterladen`, dann `2. …` und `3. …`."
    solution: |
      ```bash
      cd markdown-reparieren
      cat > hilfe.md <<'EOF'
      # Hilfe

      Diese App verwaltet deine Notizen.

      ![Hauptansicht der App mit drei Notizen](screenshot.png)

      ## Installation

      1. App herunterladen
      2. Datei entpacken
      3. `notes` im Terminal starten

      Mehr steht in der [Doku](https://example.com/docs).

      ## Kontakt

      Schreib an user@example.com.
      EOF
      ```
  - id: syntax-zuordnen
    type: dragdrop
    title: Was wird daraus?
    description: Ordne jede Markdown-Zeile dem Element zu, das daraus wird.
    targets:
      - { id: ueberschrift, label: Überschrift }
      - { id: liste, label: Liste }
      - { id: link, label: Link }
      - { id: bild, label: Bild }
      - { id: hervorhebung, label: Hervorhebung }
    items:
      - { label: "### Konfiguration", target: ueberschrift }
      - { label: "# Mein Projekt", target: ueberschrift }
      - { label: "- Node.js 24", target: liste }
      - { label: "2. Server starten", target: liste }
      - { label: "[Doku](docs/README.md)", target: link }
      - { label: "<https://example.com>", target: link }
      - { label: "![Architektur](docs/architektur.svg)", target: bild }
      - { label: "**Achtung:** nicht löschen", target: hervorhebung }
    hints:
      - Ein Ausrufezeichen vor eckigen Klammern macht aus einem Link ein Bild.
---
Du hast eine README im Editor geschrieben – mit Überschriften, die du fett gemacht hast, und Listen mit
Bindestrichen. Auf GitHub erscheint aber nur Text mit Sternchen und Rauten. Der Grund: Du hast fast
[[markdown|Markdown]] geschrieben. Ein Leerzeichen hier, eine Leerzeile dort entscheiden, ob es klappt.

## Was ist Markdown?

Markdown ist eine **Auszeichnungssprache**: Du schreibst normalen Text und markierst Struktur mit wenigen
Sonderzeichen. Ein Programm macht daraus formatierten Text, meist [[html|HTML]]. Diesen Vorgang nennt man
[[rendern|Rendern]].

```markdown title="Quelltext"
# Notizen-App

Diese App speichert deine Notizen **lokal**.
```

Gerendert siehst du eine große Überschrift und einen Satz, in dem „lokal“ fett ist. Der Clou: Auch der
Quelltext bleibt gut lesbar – im Terminal, im Editor und im Diff eines Pull Requests.

Es gibt mehrere Varianten. Die Grundlage ist [[commonmark|CommonMark]], eine genaue Spezifikation. GitHub
erweitert sie zu [[gfm|GitHub Flavored Markdown]] (GFM) mit Tabellen, Aufgabenlisten und mehr.

> [!MERKSATZ]
> Markdown-Dateien enden auf `.md`. Sie sind reiner Text – du kannst sie mit jedem Editor schreiben und mit
> Git versionieren.

## Überschriften und Absätze

Überschriften beginnen mit einer bis sechs Rauten **und einem Leerzeichen**:

```markdown
# Titel des Dokuments (Ebene 1)
## Abschnitt (Ebene 2)
### Unterabschnitt (Ebene 3)
```

Regeln, die sich bewährt haben:

- Genau **eine** `#`-Überschrift pro Datei – den Titel.
- Keine Ebene überspringen: Nach `##` kommt `###`, nicht `####`.
- Leerzeile vor und nach jeder Überschrift.

Ein **Absatz** ist Text zwischen Leerzeilen. Ein einfacher Zeilenumbruch im Quelltext erzeugt keinen neuen
Absatz – die Zeilen werden zusammengezogen. Für einen neuen Absatz brauchst du eine Leerzeile.

> [!FEHLER]
> `##Installation` ohne Leerzeichen ist nach CommonMark **keine** Überschrift. GitHub zeigt dann wörtlich
> „##Installation“ an.

## Hervorhebungen und Code im Text

| Quelltext | Ergebnis | Wofür |
|---|---|---|
| `**fett**` | **fett** | Wichtige Warnungen, Begriffe beim ersten Auftreten |
| `*kursiv*` | *kursiv* | Leichte Betonung, Fremdwörter |
| `` `npm install` `` | `npm install` | Befehle, Dateinamen, Code |
| `~~alt~~` | ~~alt~~ | Durchgestrichen (GFM) |

Nutze Hervorhebungen sparsam. Ist alles fett, ist nichts mehr wichtig.

Alles, was jemand **abtippen** könnte, gehört in Backticks: Dateinamen (`package.json`), Befehle
(`git status`), Variablen (`PORT`). So erkennen Leser:innen sofort, was wörtlich gemeint ist.

## Listen

Aufzählungen beginnen mit `-` (oder `*`), nummerierte Listen mit `1.`:

```markdown
- Node.js 24
- npm 11
  - wird mit Node.js installiert

1. Repository klonen
2. Abhängigkeiten installieren
3. Server starten
```

Eingerückte Zeilen (zwei Leerzeichen) bilden eine **verschachtelte** Liste.

Faustregel: Kommt es auf die **Reihenfolge** an (Anleitungen!), nimm eine nummerierte Liste. Sonst eine
Aufzählung. Bleib in einer Datei bei einem Zeichen – also immer `-`, nicht mal `-` und mal `*`.

## Links und Bilder

Ein [[hyperlink|Link]] besteht aus Text in eckigen und Ziel in runden Klammern – **ohne** Leerzeichen dazwischen:

```markdown
Mehr in der [offiziellen Doku](https://example.com/docs).
Siehe auch die [Installationsanleitung](docs/installation.md).
<https://example.com> wird direkt als Link angezeigt.
```

Der zweite Link ist ein [[relativer-link|relativer Link]]: Er zeigt auf eine Datei im selben Repository,
ausgehend vom Ordner der aktuellen Datei. Relative Links funktionieren auf GitHub, im Editor und in jeder
Kopie des Repositorys – nutze sie für alles, was im Repo liegt.

Ein **Bild** ist ein Link mit `!` davor:

```markdown
![Hauptansicht der App mit drei Notizen](docs/screenshot.png)
```

Der Text in den eckigen Klammern ist der [[alt-text|Alt-Text]]. Screenreader lesen ihn vor, und er erscheint,
wenn das Bild nicht lädt. Beschreibe, **was** zu sehen ist – nicht nur „Bild“ oder „Screenshot“.

> [!PRAXIS]
> Schreib bei Links einen sprechenden Text. „Hier klicken“ verrät nichts. „Installationsanleitung“ sagt
> sofort, wohin der Link führt.

## Zusammenfassung

- Markdown ist reiner Text mit wenigen Sonderzeichen, der zu HTML **gerendert** wird.
- Überschriften: Rauten **plus Leerzeichen**, eine `#`-Überschrift pro Datei, keine Ebene überspringen.
- Absätze trennst du mit einer Leerzeile.
- `**fett**`, `*kursiv*`, `` `Code` `` – alles Abtippbare in Backticks.
- Listen mit `-` oder `1.`; für Schritte immer nummeriert.
- Links `[Text](Ziel)`, Bilder `![Alt-Text](Pfad)` – mit sprechendem Text.
