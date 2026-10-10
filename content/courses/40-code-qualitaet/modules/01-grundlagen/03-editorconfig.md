---
title: Gemeinsame Grundregeln mit EditorConfig
summary: Wie eine einzige .editorconfig-Datei dafür sorgt, dass jeder Editor im Team gleich einrückt, gleiche Zeilenenden schreibt und keine Leerzeichen am Zeilenende hinterlässt.
duration: 20
sources:
  - title: EditorConfig – Projektseite
    url: https://editorconfig.org/
  - title: EditorConfig – Specification
    url: https://spec.editorconfig.org/
  - title: Biome – Konfiguration (formatter.useEditorconfig)
    url: https://biomejs.dev/reference/configuration/
quiz:
  - type: single
    question: Was bewirkt `root = true` ganz oben in einer `.editorconfig`?
    options:
      - Der Editor sucht in übergeordneten Ordnern nicht nach weiteren `.editorconfig`-Dateien.
      - Die Regeln gelten nur für den Benutzer root.
      - Die Datei überschreibt die Einstellungen des Formatters.
      - Alle Dateien werden beim Öffnen sofort umformatiert.
    answer: 0
    explanation: >
      Editoren suchen `.editorconfig`-Dateien vom Ordner der geöffneten Datei aufwärts. `root = true` beendet diese
      Suche – so wirken keine zufälligen Dateien aus deinem Home-Verzeichnis in das Projekt hinein.
  - type: match
    question: Ordne jede Einstellung ihrer Wirkung zu.
    pairs:
      - { left: "indent_style = space", right: "Einrücken mit Leerzeichen statt Tabs" }
      - { left: "end_of_line = lf", right: "Zeilenende im Unix-Stil" }
      - { left: "insert_final_newline = true", right: "Leere Zeile am Dateiende" }
      - { left: "trim_trailing_whitespace = true", right: "Keine Leerzeichen am Zeilenende" }
    explanation: Diese vier Einstellungen verhindern die meisten unnötigen Diffs in einem Team mit verschiedenen Editoren und Betriebssystemen.
  - type: multiple
    question: Welche Aussagen über EditorConfig stimmen?
    options:
      - Der Editor wendet die Regeln beim Bearbeiten und Speichern an.
      - EditorConfig formatiert bestehende Dateien im ganzen Projekt automatisch um.
      - Spätere Abschnitte überschreiben frühere, wenn beide auf eine Datei passen.
      - Die Datei gehört ins Repository.
    answers: [0, 2, 3]
    explanation: >
      EditorConfig ist eine Anweisung an den Editor, keine Prüfung. Bestehende Dateien bleiben unverändert, bis
      jemand sie bearbeitet – fürs Aufräumen und Prüfen brauchst du einen Formatter.
  - type: cloze
    text: "Damit `Makefile` mit Tabs eingerückt wird, schreibst du einen Abschnitt `[Makefile]` mit `indent_style = ___`."
    blanks:
      - [tab]
    explanation: Make verlangt echte Tabs vor Befehlen. Ein eigener Abschnitt überschreibt die allgemeine Regel aus `[*]`.
tasks:
  - id: editorconfig-anlegen
    type: terminal
    title: EditorConfig anlegen und Zeilenenden reparieren
    description: |
      Im Ordner `editorconfig-anlegen` liegt ein kleines Projekt. Die Datei `docs/notes.txt` wurde unter Windows
      gespeichert: Jede Zeile endet mit `\r\n` (CRLF), und die letzte Zeile hat keinen Zeilenumbruch.

      1. Lege im Ordner eine `.editorconfig` an mit:
         - `root = true`
         - einem Abschnitt `[*]` mit `charset = utf-8`, `end_of_line = lf`, `indent_style = space`,
           `indent_size = 4`, `insert_final_newline = true` und `trim_trailing_whitespace = true`
         - einem Abschnitt `[*.{yml,yaml,json}]` mit `indent_size = 2`
         - einem Abschnitt `[*.md]` mit `trim_trailing_whitespace = false`
      2. EditorConfig ändert bestehende Dateien nicht. Repariere `docs/notes.txt` deshalb selbst: Entferne die
         `\r`-Zeichen (`sed -i 's/\r$//' docs/notes.txt`) und hänge einen Zeilenumbruch an das Dateiende an.
      3. Kontrolliere mit `cat -A docs/notes.txt`: Jede Zeile endet mit `$`, nirgends steht `^M`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: editorconfig-anlegen
    setup: |
      mkdir -p docs src
      printf 'Notizen zum Projekt\r\nZeile zwei\r\nLetzte Zeile' > docs/notes.txt
      printf '<?php\n\ndeclare(strict_types=1);\n\necho "Hallo";\n' > src/index.php
    checks:
      - type: file_contains
        path: .editorconfig
        pattern: "^root\\s*=\\s*true"
        message: In der .editorconfig fehlt ganz oben `root = true`.
      - type: file_contains
        path: .editorconfig
        pattern: "^\\[\\*\\]"
        message: Es fehlt der Abschnitt `[*]` für alle Dateien.
      - type: file_contains
        path: .editorconfig
        pattern: "^end_of_line\\s*=\\s*lf"
        message: Setze im Abschnitt `[*]` `end_of_line = lf`.
      - type: file_contains
        path: .editorconfig
        pattern: "^indent_style\\s*=\\s*space"
        message: Setze `indent_style = space`.
      - type: file_contains
        path: .editorconfig
        pattern: "^insert_final_newline\\s*=\\s*true"
        message: Setze `insert_final_newline = true`.
      - type: file_contains
        path: .editorconfig
        pattern: "^\\[\\*\\.\\{yml,yaml,json\\}\\]"
        message: Es fehlt der Abschnitt `[*.{yml,yaml,json}]` mit `indent_size = 2`.
      - type: file_contains
        path: .editorconfig
        pattern: "^\\[\\*\\.md\\]"
        message: Es fehlt der Abschnitt `[*.md]` mit `trim_trailing_whitespace = false`.
      - type: command
        run: "! grep -q $'\\r' docs/notes.txt"
        message: In docs/notes.txt stehen noch Windows-Zeilenenden (\r). Entferne sie mit sed -i 's/\r$//' docs/notes.txt.
      - type: command
        run: tail -c 1 docs/notes.txt | od -An -c | tr -d ' '
        stdout_equals: "\\n"
        message: docs/notes.txt endet noch nicht mit einem Zeilenumbruch. Hänge einen an, z. B. mit echo >> docs/notes.txt.
    hints:
      - "Am einfachsten schreibst du die Datei mit `nano .editorconfig` oder mit `cat > .editorconfig <<'EOF' … EOF`."
      - "Abschnitte stehen in eckigen Klammern, Einstellungen als `schluessel = wert` darunter."
      - "`echo >> docs/notes.txt` hängt genau einen Zeilenumbruch an."
    solution: |
      ```bash
      cd editorconfig-anlegen
      cat > .editorconfig <<'EOF'
      root = true

      [*]
      charset = utf-8
      end_of_line = lf
      indent_style = space
      indent_size = 4
      insert_final_newline = true
      trim_trailing_whitespace = true

      [*.{yml,yaml,json}]
      indent_size = 2

      [*.md]
      trim_trailing_whitespace = false
      EOF
      sed -i 's/\r$//' docs/notes.txt
      echo >> docs/notes.txt
      cat -A docs/notes.txt
      ```
  - id: abschnitte-zuordnen
    type: dragdrop
    title: Welcher Abschnitt gilt?
    description: >
      Gegeben ist eine `.editorconfig` mit den Abschnitten `[*]` (4 Leerzeichen), `[*.{yml,yaml}]` (2 Leerzeichen),
      `[*.md]` (Leerzeichen am Zeilenende erlaubt) und `[Makefile]` (Tabs). Ziehe jede Datei zu dem Abschnitt,
      der für sie **zuletzt** passt und damit das Einrücken bestimmt.
    targets:
      - { id: alle, label: "[*] – 4 Leerzeichen" }
      - { id: yaml, label: "[*.{yml,yaml}] – 2 Leerzeichen" }
      - { id: md, label: "[*.md]" }
      - { id: make, label: "[Makefile] – Tabs" }
    items:
      - { label: "src/Order.php", target: alle }
      - { label: "web/app.ts", target: alle }
      - { label: ".github/workflows/ci.yml", target: yaml }
      - { label: "lefthook.yml", target: yaml }
      - { label: "README.md", target: md }
      - { label: "Makefile", target: make }
    hints:
      - Ein Muster ohne Schrägstrich passt auf den Dateinamen in jedem Unterordner.
      - Dateien, für die es keinen eigenen Abschnitt gibt, bekommen nur die Regeln aus `[*]`.
---
Deine Kollegin arbeitet unter Windows mit Tabs, du unter macOS mit vier Leerzeichen. Jeder Commit von euch
beiden verändert hunderte Zeilen, obwohl inhaltlich nur eine Zeile neu ist. Im Diff sieht niemand mehr, was
wirklich passiert ist. Die kleinste und älteste Lösung für dieses Problem ist eine einzige Textdatei:
[[editorconfig|`.editorconfig`]].

## Das Problem: unsichtbare Unterschiede

Viele Unterschiede zwischen Editoren siehst du gar nicht, Git aber schon:

| Unterschied | Was passiert |
|---|---|
| [[einrueckung\|Einrückung]] mit Tabs oder Leerzeichen | Jede eingerückte Zeile ändert sich |
| [[zeilenende\|Zeilenende]] `\n` (LF) oder `\r\n` (CRLF) | Jede Zeile der Datei ändert sich |
| Leerzeichen am Zeilenende | Zeilen ändern sich ohne sichtbaren Grund |
| Fehlender Zeilenumbruch am Dateiende | Git meldet „No newline at end of file“ |
| [[zeichenkodierung\|Zeichenkodierung]] | Umlaute werden zu `Ã¤` |

Solche Änderungen nennt man **Rauschen**. Sie machen Diffs unlesbar, erzeugen Merge-Konflikte und lassen
Reviews länger dauern.

> [!MERKSATZ]
> Ein guter Diff zeigt nur, was sich **inhaltlich** geändert hat. Alles andere ist Rauschen – und Rauschen
> verhindert man am besten, bevor es entsteht.

## Die Datei .editorconfig

[[editorconfig|EditorConfig]] ist ein einfaches Dateiformat, das fast jeder Editor versteht – PhpStorm und
VS Code ohne Erweiterung, andere mit einem kleinen Plugin. Die Datei liegt im Wurzelverzeichnis des
Repositorys:

```ini title=".editorconfig"
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 4
insert_final_newline = true
trim_trailing_whitespace = true

[*.{yml,yaml,json}]
indent_size = 2

[*.md]
trim_trailing_whitespace = false

[Makefile]
indent_style = tab
```

So liest du sie:

- **`root = true`** – hier hört der Editor auf, in Elternordnern nach weiteren `.editorconfig`-Dateien zu suchen.
- **`[*]`** – ein Abschnitt mit einem [[glob-muster|Glob-Muster]]: Er gilt für alle Dateien.
- **`[*.{yml,yaml,json}]`** – gilt für drei Dateiendungen. Weil er weiter unten steht, gewinnt er gegen `[*]`.
- **`[*.md]`** – in Markdown sind zwei Leerzeichen am Zeilenende ein Zeilenumbruch, also nicht entfernen.

## Die wichtigsten Einstellungen

| Einstellung | Werte | Wofür |
|---|---|---|
| `indent_style` | `space`, `tab` | Womit eingerückt wird |
| `indent_size` | Zahl | Wie breit eine Einrückungsstufe ist |
| `end_of_line` | `lf`, `crlf`, `cr` | Welches Zeilenende geschrieben wird |
| `charset` | `utf-8`, `latin1` … | Die Zeichenkodierung |
| `insert_final_newline` | `true`, `false` | Zeilenumbruch am Dateiende |
| `trim_trailing_whitespace` | `true`, `false` | Leerzeichen am Zeilenende entfernen |

Für fast alle Web-Projekte ist die Antwort gleich: UTF-8, LF, Leerzeichen, Zeilenumbruch am Ende. PHP-Code
folgt mit vier Leerzeichen dem [[per-coding-style|PER Coding Style]], YAML und JSON nutzen üblicherweise zwei.

> [!FEHLER]
> „Ich habe eine `.editorconfig` angelegt, aber die alten Dateien haben immer noch CRLF.“ – EditorConfig ist
> eine **Anweisung an den Editor** für die Datei, die du gerade bearbeitest. Es formatiert nichts im Hintergrund
> um und prüft nichts. Bestehende Dateien bereinigst du einmalig mit einem Werkzeug.

## EditorConfig und Formatter arbeiten zusammen

EditorConfig ist die **unterste Schicht** der Code-Qualität. Sie sorgt dafür, dass beim Tippen nichts
Falsches entsteht. Der [[formatter|Formatter]] aus den nächsten Lektionen ist die zweite Schicht: Er bringt
ganze Dateien in Form und kann in der [[ci-pipeline|CI-Pipeline]] prüfen.

| | EditorConfig | Formatter (Pint, Biome) |
|---|---|---|
| Wann? | Beim Tippen und Speichern | Auf Befehl, im Hook, in der CI |
| Was? | Einrückung, Zeilenende, Leerzeichen | Der komplette Code-Stil |
| Prüft? | Nein | Ja (`--test`, `ci`) |
| Sprache | Egal – jede Textdatei | Nur die unterstützten Sprachen |

Wichtig ist, dass beide **dasselbe** wollen. Biome kann seine Einrückung sogar direkt aus der `.editorconfig`
lesen, wenn du in der `biome.json` `formatter.useEditorconfig` einschaltest. Bei Pint gibt das gewählte
Preset die Einrückung vor – vier Leerzeichen, passend zu `[*]` oben.

> [!PRAXIS]
> Lege die `.editorconfig` als **ersten Commit** eines neuen Projekts an. Bei bestehenden Projekten gilt:
> Datei anlegen, dann alle Dateien in einem eigenen Commit bereinigen (z. B. mit dem Formatter). So bleibt der
> Aufräum-Commit vom echten Code getrennt – wie das geht, lernst du in der letzten Lektion des Kurses.

## Zeilenenden prüfen und reparieren

Ob eine Datei CRLF-Zeilenenden hat, siehst du im Terminal mit `cat -A`: Windows-Zeilenenden erscheinen als `^M$`.

```bash title="Terminal"
cat -A docs/notes.txt
# Notizen zum Projekt^M$
# Zeile zwei^M$
# Letzte Zeile            ← kein $ am Ende: Zeilenumbruch fehlt

sed -i 's/\r$//' docs/notes.txt   # \r am Zeilenende entfernen
echo >> docs/notes.txt            # Zeilenumbruch anhängen
```

Damit Git selbst keine falschen Zeilenenden ins Repository lässt, kannst du ergänzend in `.gitattributes` die
Zeile `* text=auto eol=lf` eintragen – Details stehen in der [Git-Dokumentation](https://git-scm.com/docs/gitattributes).

## Zusammenfassung

- Unterschiede bei Einrückung, Zeilenende und Leerzeichen erzeugen **Rauschen** in Diffs.
- Eine `.editorconfig` im Wurzelverzeichnis gibt allen Editoren dieselben Grundregeln vor.
- `root = true` stoppt die Suche nach weiteren Dateien; spätere Abschnitte überschreiben frühere.
- Übliche Werte: UTF-8, LF, Leerzeichen, Zeilenumbruch am Dateiende; YAML/JSON mit zwei Leerzeichen.
- EditorConfig wirkt nur beim Bearbeiten – Aufräumen und Prüfen übernimmt der Formatter.
