---
title: Hinweise, Diagramme und Anker auf GitHub
summary: GitHub-Alerts für Warnungen, Mermaid-Diagramme direkt im Markdown und Sprungmarken für ein Inhaltsverzeichnis.
duration: 25
sources:
  - title: GitHub Docs – Basic writing and formatting syntax (Alerts)
    url: https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts
  - title: GitHub Docs – Creating diagrams
    url: https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams
  - title: Mermaid – Flowchart-Syntax
    url: https://mermaid.js.org/syntax/flowchart.html
quiz:
  - type: match
    question: Welcher GitHub-Hinweis passt zu welcher Situation?
    pairs:
      - { left: "[!NOTE]", right: "Nützliche Zusatzinfo, auch beim Überfliegen wichtig" }
      - { left: "[!TIP]", right: "Ein Kniff, der die Arbeit leichter macht" }
      - { left: "[!IMPORTANT]", right: "Etwas, das man wissen muss, um ans Ziel zu kommen" }
      - { left: "[!WARNING]", right: "Dringend beachten, sonst gibt es Probleme" }
      - { left: "[!CAUTION]", right: "Riskante Aktion mit möglichen negativen Folgen" }
    explanation: >
      GitHub kennt genau diese fünf Typen. Nutze sie sparsam – wenn jeder zweite Absatz eine Warnung ist,
      überliest man die wirklich wichtige.
  - type: find-bug
    question: Der Hinweis wird auf GitHub nur als normales Zitat angezeigt. In welcher Zeile liegt der Fehler?
    language: markdown
    code: |
      ## Datenbank zurücksetzen

      > [!DANGER]
      > Dieser Befehl löscht alle Daten unwiderruflich.

      npm run db:reset
    bug_line: 3
    explanation: >
      `DANGER` ist kein gültiger Typ. Für riskante Aktionen heißt er `[!CAUTION]`. Bei unbekannten Typen
      zeigt GitHub ein gewöhnliches Zitat.
  - type: single
    question: Wie lautet der Anker-Link auf die Überschrift `## Häufige Fehler & Lösungen`?
    options:
      - "#Häufige Fehler & Lösungen"
      - "#häufige-fehler--lösungen"
      - "#haeufige-fehler-loesungen"
      - "#häufige_fehler_&_lösungen"
    answer: 1
    explanation: >
      GitHub schreibt klein, entfernt Satzzeichen wie `&` und ersetzt jedes Leerzeichen durch einen Bindestrich.
      Weil um das `&` zwei Leerzeichen standen, entstehen zwei Bindestriche. Umlaute bleiben erhalten.
  - type: cloze
    text: Ein Diagramm schreibst du auf GitHub in einen Codeblock mit der Sprache ___. Ein Ablaufdiagramm beginnt mit dem Schlüsselwort ___.
    blanks:
      - [mermaid]
      - [flowchart, graph]
    explanation: GitHub rendert Codeblöcke mit der Sprache `mermaid` als Diagramm. `flowchart LR` zeichnet von links nach rechts.
tasks:
  - id: deployment-doku
    type: terminal
    title: Hinweis, Diagramm und Inhaltsverzeichnis
    description: |
      Im Ordner `github-extras` liegt `DEPLOYMENT.md`, eine Anleitung für das Ausrollen einer App. Mach sie
      übersichtlicher:

      1. Füge direkt unter die Überschrift `## Datenbank migrieren` einen GitHub-Hinweis vom Typ **WARNING** ein,
         der vor einem fehlenden Backup warnt (Zeile 1: `> [!WARNING]`, Zeile 2: `> …` mit deinem Text).
      2. Füge unter `## Ablauf` ein Mermaid-Diagramm ein: einen Codeblock mit der Sprache `mermaid`, der mit
         `flowchart LR` beginnt und mindestens zwei Pfeile (`-->`) enthält, z. B. Build → Tests → Deployment.
      3. Ergänze unter dem Titel ein Inhaltsverzeichnis mit Anker-Links auf alle drei `##`-Abschnitte, z. B.
         `- [Ablauf](#ablauf)`.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit die Datei angelegt wird.
    workdir: github-extras
    setup: |
      cat > DEPLOYMENT.md <<'EOF'
      # Deployment

      So bringst du eine neue Version auf den Server.

      ## Ablauf

      Jede Änderung wird gebaut, getestet und dann ausgerollt.

      ## Datenbank migrieren

      Führe nach dem Ausrollen `npm run migrate` aus.

      ## Zurückrollen

      Mit `npm run rollback` stellst du die vorherige Version wieder her.
      EOF
    checks:
      - type: command
        run: awk '/^## Datenbank migrieren/{f=1;next} /^## /{f=0} f' DEPLOYMENT.md | grep -cE '^> \[!WARNING\]\s*$'
        stdout_equals: "1"
        message: "Unter `## Datenbank migrieren` fehlt der Hinweis. Er beginnt mit einer eigenen Zeile `> [!WARNING]`."
      - type: command
        run: awk '/^## Datenbank migrieren/{f=1;next} /^## /{f=0} f' DEPLOYMENT.md | grep -A1 -E '^> \[!WARNING\]' | tail -n 1
        stdout_matches: "^> \\S"
        message: "Direkt unter `> [!WARNING]` braucht der Hinweis eine Textzeile, die mit `> ` beginnt."
      - type: command
        run: awk '/^## Ablauf/{f=1;next} /^## /{f=0} f' DEPLOYMENT.md | grep -cE '^```mermaid\s*$'
        stdout_equals: "1"
        message: "Unter `## Ablauf` fehlt ein Codeblock, der mit ```mermaid beginnt."
      - type: command
        run: awk '/^```mermaid/{f=1;next} /^```/{f=0} f' DEPLOYMENT.md | head -n 1
        stdout_matches: "^\\s*flowchart\\s+(LR|RL|TD|TB|BT)"
        message: "Die erste Zeile im Mermaid-Block soll `flowchart LR` sein."
      - type: command
        run: awk '/^```mermaid/{f=1;next} /^```/{f=0} f' DEPLOYMENT.md | grep -o -- '-->' | wc -l
        stdout_matches: "^\\s*([2-9]|[1-9][0-9])\\s*$"
        message: "Das Diagramm braucht mindestens zwei Pfeile `-->`, z. B. `A[Build] --> B[Tests] --> C[Deployment]`."
      - type: command
        run: |
          for a in ablauf datenbank-migrieren zurückrollen; do grep -q "](#$a)" DEPLOYMENT.md || echo "fehlt: #$a"; done
        stdout_equals: ""
        message: "Im Inhaltsverzeichnis fehlen Anker-Links. Nötig sind `(#ablauf)`, `(#datenbank-migrieren)` und `(#zurückrollen)`."
    hints:
      - "Ein Hinweis ist ein Zitat: `> [!WARNING]` und darunter `> Erstelle vorher ein Backup der Datenbank.`"
      - "Der Mermaid-Block: ```mermaid, dann `flowchart LR`, dann `  A[Build] --> B[Tests] --> C[Deployment]`, dann ```."
      - "Anker: klein schreiben, Leerzeichen werden zu Bindestrichen, Umlaute bleiben – `## Zurückrollen` wird zu `#zurückrollen`."
    solution: |
      ~~~bash
      cd github-extras
      cat > DEPLOYMENT.md <<'EOF'
      # Deployment

      So bringst du eine neue Version auf den Server.

      - [Ablauf](#ablauf)
      - [Datenbank migrieren](#datenbank-migrieren)
      - [Zurückrollen](#zurückrollen)

      ## Ablauf

      Jede Änderung wird gebaut, getestet und dann ausgerollt.

      ```mermaid
      flowchart LR
        A[Build] --> B[Tests] --> C[Deployment]
      ```

      ## Datenbank migrieren

      > [!WARNING]
      > Erstelle vor der Migration ein Backup der Datenbank.

      Führe nach dem Ausrollen `npm run migrate` aus.

      ## Zurückrollen

      Mit `npm run rollback` stellst du die vorherige Version wieder her.
      EOF
      ~~~
  - id: anker-erzeugen
    type: code
    language: js
    title: Anker-Links wie GitHub erzeugen
    description: |
      Für ein Inhaltsverzeichnis brauchst du zu jeder Überschrift ihren Anker. Schreibe `headingToAnchor(heading)`.
      Die Funktion bekommt eine Überschriftenzeile wie `## Schnell starten!` und gibt den Anker **mit** `#` zurück.
      Vereinfachte GitHub-Regeln:

      1. Führende Rauten und Leerzeichen entfernen, Leerzeichen am Ende ebenfalls.
      2. Alles kleinschreiben.
      3. Alle Zeichen entfernen, die kein Buchstabe, keine Ziffer, kein Leerzeichen, kein `-` und kein `_` sind.
         Umlaute sind Buchstaben und bleiben.
      4. Jedes Leerzeichen durch einen Bindestrich ersetzen.
    starter: |
      function headingToAnchor(heading) {
        return '#'
      }
    tests:
      - name: Einfache Überschrift
        code: assertEqual(headingToAnchor('## Schnellstart'), '#schnellstart')
      - name: Satzzeichen fallen weg
        code: assertEqual(headingToAnchor('## Schnell starten!'), '#schnell-starten')
      - name: Umlaute bleiben, Sonderzeichen erzeugen doppelte Bindestriche
        code: assertEqual(headingToAnchor('### Häufige Fehler & Lösungen'), '#häufige-fehler--lösungen')
      - name: Ziffern und Bindestriche bleiben
        code: assertEqual(headingToAnchor('# Version 2.0 – Was ist neu?'), '#version-20--was-ist-neu')
      - name: Nur Rauten ergeben nur das Rautezeichen
        code: assertEqual(headingToAnchor('##'), '#')
    hints:
      - "Führende Rauten: `heading.replace(/^#+/, '').trim()`."
      - "Für Buchstaben aller Sprachen gibt es in regulären Ausdrücken `\\p{L}` – dafür brauchst du das Flag `u`."
      - "Zum Schluss: `.replace(/ /g, '-')` und `'#'` davorsetzen."
    solution: |
      function headingToAnchor(heading) {
        const text = heading.replace(/^#+/, '').trim().toLowerCase()
        const cleaned = text.replace(/[^\p{L}\p{N} _-]/gu, '')
        return '#' + cleaned.replace(/ /g, '-')
      }
---
Du hast eine lange Deployment-Anleitung geschrieben. Ganz unten, im fünften Absatz, steht der wichtigste Satz:
„Vorher unbedingt ein Backup machen!“ Natürlich liest ihn niemand. GitHub bietet drei Werkzeuge, damit das
Wichtige auffällt und lange Seiten navigierbar bleiben: **Hinweise**, **Diagramme** und **Anker-Links**.

## GitHub-Alerts: Hinweise, die auffallen

Ein [[github-alert|GitHub-Alert]] ist ein Zitat (`>`), dessen erste Zeile einen Typ in eckigen Klammern trägt.
GitHub zeigt es als farbigen Kasten mit Symbol:

```markdown
> [!WARNING]
> Erstelle vor der Migration ein Backup der Datenbank.
```

Es gibt genau fünf Typen:

| Typ | Wofür |
|---|---|
| `[!NOTE]` | Zusatzinfo, die man auch beim Überfliegen sehen soll |
| `[!TIP]` | Ein Kniff, der Zeit spart |
| `[!IMPORTANT]` | Etwas, das man wissen muss, um ans Ziel zu kommen |
| `[!WARNING]` | Dringend beachten, sonst gibt es Probleme |
| `[!CAUTION]` | Riskante Aktion mit möglichen negativen Folgen |

Ein unbekannter Typ wie `[!DANGER]` funktioniert nicht – dann erscheint nur ein normales Zitat. Andere Plattformen
wie GitLab haben eigene Schreibweisen; GitHub-Alerts sind eine GitHub-Erweiterung.

> [!FEHLER]
> Fünf Warnkästen auf einer Seite. Wenn alles wichtig ist, ist nichts mehr wichtig. Ein bis zwei Alerts pro
> Seite sind ein guter Richtwert.

## Mermaid: Diagramme als Text

Ein Diagramm als Bild hat ein Problem: Ändert sich der Ablauf, muss jemand das Bild neu zeichnen – und das
passiert selten. [[mermaid|Mermaid]] löst das: Du beschreibst das Diagramm als **Text**, und GitHub zeichnet es.

~~~markdown
```mermaid
flowchart LR
  A[Push auf main] --> B[Tests]
  B -->|grün| C[Deployment]
  B -->|rot| D[Benachrichtigung]
```
~~~

So liest du den Text:

- `flowchart LR` – ein Ablaufdiagramm von **l**inks nach **r**echts (`TD` wäre von oben nach unten).
- `A[Push auf main]` – ein Kasten mit der Kennung `A` und einer Beschriftung.
- `-->` – ein Pfeil, `-->|grün|` ein beschrifteter Pfeil.

Weil das Diagramm Text ist, siehst du Änderungen im [[diff|Diff]] eines Pull Requests genau wie Code-Änderungen.

> [!MERKSATZ]
> Ein Diagramm als Mermaid-Text wird mit dem Code gepflegt. Ein Diagramm als Bild veraltet.

## Weitere Mermaid-Diagramme

Mermaid kann mehr als Abläufe. Zwei Typen begegnen dir oft:

| Typ | Schlüsselwort | Gut für |
|---|---|---|
| Ablaufdiagramm | `flowchart` | Prozesse, Entscheidungen, Architektur-Überblick |
| Sequenzdiagramm | `sequenceDiagram` | Wer ruft wen in welcher Reihenfolge auf |

```text title="Ein Sequenzdiagramm in Mermaid"
sequenceDiagram
  Browser->>API: POST /login
  API->>Datenbank: Nutzer suchen
  Datenbank-->>API: Treffer
  API-->>Browser: 200 OK mit Token
```

Weitere Typen (Zustandsdiagramme, Gantt-Diagramme, ER-Diagramme) findest du in der
[Mermaid-Dokumentation](https://mermaid.js.org/intro/). Halte Diagramme klein: lieber zwei übersichtliche als
ein Riesendiagramm.

## Anker-Links und Inhaltsverzeichnis

GitHub gibt jeder Überschrift automatisch einen [[anker-link|Anker]]. Mit `#anker` springst du direkt dorthin –
innerhalb der Seite oder von einer anderen Datei aus:

```markdown
- [Installation](#installation)
- [Häufige Fehler](#häufige-fehler)
- [Konfiguration der Datenbank](docs/konfiguration.md#datenbank)
```

So entsteht der Anker aus der Überschrift:

1. Alles kleinschreiben.
2. Satzzeichen wie `!`, `?`, `&`, `.` entfernen. Buchstaben (auch Umlaute), Ziffern, `-` und `_` bleiben.
3. Jedes Leerzeichen durch `-` ersetzen.

| Überschrift | Anker |
|---|---|
| `## Installation` | `#installation` |
| `## Schnell starten!` | `#schnell-starten` |
| `## Fragen & Antworten` | `#fragen--antworten` |

> [!PRAXIS]
> GitHub zeigt über jeder Markdown-Datei ein automatisches Inhaltsverzeichnis an (Symbol oben rechts). Ein
> eigenes am Anfang lohnt sich trotzdem bei langen Seiten – es funktioniert auch außerhalb von GitHub.

## Zusammenfassung

- **GitHub-Alerts**: `> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]` – sparsam einsetzen.
- **Mermaid**: Diagramme als Text in einem Codeblock mit der Sprache `mermaid`.
- `flowchart LR` mit `-->` zeichnet Abläufe; `sequenceDiagram` zeigt Aufrufe.
- Jede Überschrift hat einen **Anker**: klein, ohne Satzzeichen, Leerzeichen werden zu `-`.
- Ein Inhaltsverzeichnis aus Anker-Links macht lange Seiten navigierbar.
