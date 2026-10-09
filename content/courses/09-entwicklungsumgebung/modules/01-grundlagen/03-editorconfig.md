---
title: EditorConfig – gemeinsame Regeln für jeden Editor
summary: Mit einer .editorconfig legst du Einrückung, Zeichensatz, Zeilenenden und Leerzeilen für das ganze Team fest – egal welcher Editor.
duration: 20
sources:
  - title: EditorConfig – offizielle Seite
    url: https://editorconfig.org/
  - title: EditorConfig – Spezifikation
    url: https://spec.editorconfig.org/
  - title: Git – gitattributes (Zeilenenden)
    url: https://git-scm.com/docs/gitattributes
quiz:
  - type: single
    question: Was bewirkt `root = true` ganz oben in einer `.editorconfig`?
    options:
      - Die Datei gilt nur für Administratoren.
      - Der Editor sucht in übergeordneten Ordnern nicht nach weiteren `.editorconfig`-Dateien.
      - Alle Dateien werden mit Root-Rechten gespeichert.
    answer: 1
    explanation: Editoren suchen vom Ordner der Datei aus nach oben. Bei `root = true` hören sie auf – so wirken keine `.editorconfig`-Dateien aus deinem Home-Ordner ins Projekt hinein.
  - type: match
    question: Ordne jede Eigenschaft ihrer Wirkung zu.
    pairs:
      - { left: "indent_style = space", right: "Mit Leerzeichen statt Tabs einrücken" }
      - { left: "end_of_line = lf", right: "Zeilen mit \\n beenden (Linux/macOS-Stil)" }
      - { left: "insert_final_newline = true", right: "Am Dateiende steht immer ein Zeilenumbruch" }
      - { left: "charset = utf-8", right: "Datei als UTF-8 speichern" }
    explanation: Diese vier Eigenschaften gehören in fast jede `.editorconfig`.
  - type: find-bug
    question: Das Team wundert sich, warum `make` mit „missing separator“ abbricht, obwohl die `.editorconfig` gepflegt ist. In welcher Zeile liegt das Problem?
    language: ini
    code: |
      root = true

      [*]
      indent_style = space
      indent_size = 4

      [Makefile]
      indent_style = space
    bug_line: 8
    explanation: Makefiles verlangen echte Tab-Zeichen vor jedem Befehl. Im Abschnitt `[Makefile]` muss `indent_style = tab` stehen.
  - type: cloze
    text: Der Abschnitt `[*.{js,___}]` gilt für alle JavaScript- und TypeScript-Dateien mit den Endungen .js und .ts.
    blanks:
      - [ts]
    explanation: In geschweiften Klammern zählst du mehrere Muster mit Komma auf – ohne Leerzeichen.
tasks:
  - id: editorconfig-anlegen
    type: terminal
    title: Eine .editorconfig für ein gemischtes Projekt
    description: |
      Im Ordner `editorconfig` liegt ein kleines Projekt mit JavaScript, PHP, Markdown und einem Makefile.
      Außerdem gibt es eine Datei `notizen.txt`, die mit Windows-Zeilenenden (CRLF) gespeichert wurde
      und keinen Zeilenumbruch am Ende hat.

      1. Lege eine `.editorconfig` an mit `root = true`.
      2. Für **alle** Dateien (`[*]`): `charset = utf-8`, `end_of_line = lf`, `insert_final_newline = true`,
         `trim_trailing_whitespace = true`, `indent_style = space`, `indent_size = 2`.
      3. Für PHP-Dateien (`[*.php]`): `indent_size = 4`.
      4. Für das Makefile (`[Makefile]`): `indent_style = tab`.
      5. Für Markdown (`[*.md]`): `trim_trailing_whitespace = false`.
      6. Repariere `notizen.txt`: Entferne alle `\r` und sorge für einen Zeilenumbruch am Ende.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: editorconfig
    setup: |
      printf 'console.log("hallo")\n' > app.js
      printf '<?php\n\necho "hallo";\n' > index.php
      printf '# Projekt\n' > README.md
      printf 'test:\n\techo ok\n' > Makefile
      printf 'Zeile eins\r\nZeile zwei' > notizen.txt
    checks:
      - type: file_contains
        path: .editorconfig
        pattern: "^root\\s*=\\s*true"
        message: Die .editorconfig braucht ganz oben root = true.
      - type: file_contains
        path: .editorconfig
        pattern: "^\\[\\*\\]"
        message: Es fehlt der Abschnitt [*] für alle Dateien.
      - type: command
        run: awk '/^\[/{s=$0} s=="[*]"' .editorconfig | tr -d ' ' | sort | tr '\n' ' '
        stdout_matches: "charset=utf-8.*end_of_line=lf.*indent_size=2.*indent_style=space.*insert_final_newline=true.*trim_trailing_whitespace=true"
        message: "Im Abschnitt [*] fehlen Regeln: charset, end_of_line, indent_style, indent_size, insert_final_newline, trim_trailing_whitespace."
      - type: command
        run: awk '/^\[/{s=$0} s=="[*.php]"' .editorconfig | tr -d ' '
        stdout_matches: "indent_size=4"
        message: Im Abschnitt [*.php] fehlt indent_size = 4.
      - type: command
        run: awk '/^\[/{s=$0} s=="[Makefile]"' .editorconfig | tr -d ' '
        stdout_matches: "indent_style=tab"
        message: Im Abschnitt [Makefile] fehlt indent_style = tab.
      - type: command
        run: awk '/^\[/{s=$0} s=="[*.md]"' .editorconfig | tr -d ' '
        stdout_matches: "trim_trailing_whitespace=false"
        message: Im Abschnitt [*.md] fehlt trim_trailing_whitespace = false.
      - type: command
        run: grep -c $'\r' notizen.txt
        expect_exit: 1
        message: notizen.txt enthält noch Windows-Zeilenenden (\r).
      - type: command
        run: tail -c 1 notizen.txt | od -An -c | tr -d ' '
        stdout_equals: "\\n"
        message: notizen.txt endet noch nicht mit einem Zeilenumbruch.
    hints:
      - Schreib die Datei mit `nano .editorconfig` oder einem Heredoc (`cat > .editorconfig <<'EOF' … EOF`).
      - "Windows-Zeilenenden entfernst du mit `sed -i 's/\\r$//' notizen.txt`."
      - "Einen fehlenden Zeilenumbruch am Ende hängst du mit `echo >> notizen.txt` an."
    solution: |
      ```bash
      cd editorconfig
      cat > .editorconfig <<'EOF'
      root = true

      [*]
      charset = utf-8
      end_of_line = lf
      insert_final_newline = true
      trim_trailing_whitespace = true
      indent_style = space
      indent_size = 2

      [*.php]
      indent_size = 4

      [Makefile]
      indent_style = tab

      [*.md]
      trim_trailing_whitespace = false
      EOF
      sed -i 's/\r$//' notizen.txt
      echo >> notizen.txt
      od -c notizen.txt   # kein \r mehr, \n am Ende
      ```
  - id: eigenschaften-zuordnen
    type: dragdrop
    title: Welches Problem löst welche Eigenschaft?
    description: Ordne jedes Problem aus dem Teamalltag der EditorConfig-Eigenschaft zu, die es verhindert.
    targets:
      - { id: indent, label: indent_style / indent_size }
      - { id: eol, label: end_of_line }
      - { id: final, label: insert_final_newline }
      - { id: trim, label: trim_trailing_whitespace }
    items:
      - { label: "Im Diff ändert sich jede Zeile, obwohl nur ein Wort neu ist (CRLF vs. LF)", target: eol }
      - { label: "Git zeigt „No newline at end of file“", target: final }
      - { label: "Die eine rückt mit Tabs ein, der andere mit vier Leerzeichen", target: indent }
      - { label: Unsichtbare Leerzeichen am Zeilenende erzeugen Rauschen im Diff, target: trim }
---

Stell dir vor, drei Personen arbeiten an derselben Datei: Die eine rückt mit Tabs ein, der zweite mit
zwei Leerzeichen, die dritte nutzt Windows und speichert andere Zeilenenden. Nach einer Woche ist jede
zweite Zeile im [[diff|Diff]] rot und grün, obwohl inhaltlich kaum etwas passiert ist. Code-Reviews
werden zur Qual. Die Lösung ist eine winzige Datei namens `.editorconfig`.

## Was EditorConfig ist

[[editorconfig|EditorConfig]] ist ein offenes Dateiformat, mit dem du festlegst, **wie** Dateien
gespeichert werden: Einrückung, Zeichensatz, Zeilenenden, Leerzeichen am Zeilenende. Die Datei
`.editorconfig` liegt im Wurzelordner des Repositorys und wird committet. Jeder unterstützte Editor liest
sie und hält sich an die Regeln – egal, was die Person persönlich eingestellt hat.

Das Besondere: EditorConfig ist **editorunabhängig**. PhpStorm und andere JetBrains-IDEs sowie Zed
unterstützen das Format von Haus aus. VS Code braucht dafür die Erweiterung „EditorConfig for VS Code“
– deshalb steht sie in vielen `.vscode/extensions.json` als Empfehlung.

> [!MERKSATZ]
> Die `.editorconfig` beschreibt, wie Dateien **gespeichert** werden. Sie ist der kleinste gemeinsame
> Nenner, auf den sich alle Editoren im Team einigen.

## Aufbau der Datei

Eine `.editorconfig` hat das INI-Format: Abschnitte in eckigen Klammern, darunter Paare aus
`eigenschaft = wert`. Der Abschnittsname ist ein Dateimuster (ein [[glob-muster|Glob-Muster]]):

```ini title=".editorconfig"
# Ganz oben: Hier ist Schluss mit der Suche nach weiteren Dateien.
root = true

# Regeln für alle Dateien
[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

# PHP rückt nach PSR-12 mit vier Leerzeichen ein
[*.php]
indent_size = 4

# make verlangt Tabs
[Makefile]
indent_style = tab

# In Markdown sind zwei Leerzeichen am Zeilenende ein Zeilenumbruch
[*.md]
trim_trailing_whitespace = false
```

Kommentare beginnen mit `#` oder `;`. Die Abschnitte werden von oben nach unten gelesen; spätere,
spezifischere Abschnitte überschreiben frühere. Eine PHP-Datei bekommt hier also alles aus `[*]`, aber
`indent_size = 4`.

### Die Muster

| Muster | Passt auf |
|---|---|
| `[*]` | Alle Dateien |
| `[*.js]` | Alle Dateien mit Endung `.js`, in jedem Unterordner |
| `[*.{js,ts,tsx}]` | Dateien mit einer der drei Endungen |
| `[Makefile]` | Dateien mit genau diesem Namen |
| `[src/**.vue]` | `.vue`-Dateien irgendwo unterhalb von `src` |
| `[{package.json,*.yml}]` | `package.json` und alle `.yml`-Dateien |

> [!FEHLER]
> **Leerzeichen in den Klammern.** `[*.{js, ts}]` mit Leerzeichen nach dem Komma passt nicht auf
> `.ts`-Dateien, weil das Leerzeichen Teil des Musters wird. Schreib `[*.{js,ts}]` ohne Leerzeichen.

## Die wichtigsten Eigenschaften

| Eigenschaft | Werte | Bedeutung |
|---|---|---|
| `root` | `true` | Steht ganz oben (außerhalb jedes Abschnitts) und beendet die Suche nach weiteren `.editorconfig`-Dateien |
| `indent_style` | `space`, `tab` | Womit eingerückt wird |
| `indent_size` | Zahl, z. B. `2` oder `4` | Breite einer [[einrueckung|Einrückungsebene]] |
| `tab_width` | Zahl | Wie breit ein Tab dargestellt wird (Standard: wie `indent_size`) |
| `end_of_line` | `lf`, `crlf`, `cr` | Welche [[zeilenende|Zeilenenden]] beim Speichern geschrieben werden |
| `charset` | `utf-8`, `utf-8-bom`, `latin1`, … | [[zeichenkodierung|Zeichenkodierung]] der Datei |
| `trim_trailing_whitespace` | `true`, `false` | Leerzeichen am Zeilenende beim Speichern entfernen |
| `insert_final_newline` | `true`, `false` | Am Dateiende einen Zeilenumbruch sicherstellen |

### Zeilenenden: LF und CRLF

Ein Zeilenende ist ein unsichtbares Zeichen. Linux und macOS nutzen **LF** (`\n`, *line feed*), Windows
traditionell **CRLF** (`\r\n`, *carriage return + line feed*). Das Problem: Speichert jemand eine Datei
mit CRLF, ändert sich aus Sicht von Git **jede Zeile** – der Diff wird unlesbar. Shell-Skripte mit CRLF
brechen sogar mit seltsamen Fehlern wie `bad interpreter: /bin/bash^M` ab, weil das `\r` als Teil des
Befehls gelesen wird.

Mit `end_of_line = lf` speichern alle Editoren im Team einheitlich LF – auch unter Windows. Prüfen
kannst du Zeilenenden mit `od -c` oder `file`:

```bash title="Zeilenenden sichtbar machen"
printf 'eins\r\nzwei\n' > test.txt
od -c test.txt
# 0000000   e   i   n   s  \r  \n   z   w   e   i  \n
sed -i 's/\r$//' test.txt   # \r am Zeilenende entfernen
```

> [!TIPP]
> EditorConfig wirkt nur beim **Speichern im Editor**. Zusätzlich kannst du Git sagen, wie es
> Zeilenenden behandeln soll – mit einer `.gitattributes`-Datei und der Zeile `* text=auto eol=lf`.
> Beides zusammen schützt dein Repository doppelt.

### Der Zeilenumbruch am Dateiende

Viele Werkzeuge erwarten, dass jede Textdatei mit einem Zeilenumbruch endet. Fehlt er, zeigt Git im
Diff `\ No newline at end of file`, und `cat datei1 datei2` klebt die letzte Zeile der ersten Datei an
die erste Zeile der zweiten. `insert_final_newline = true` sorgt dafür, dass das nie passiert.

## Wie Editoren die Datei finden

Wenn du `src/components/Button.tsx` öffnest, sucht der Editor nach `.editorconfig`-Dateien: zuerst in
`src/components/`, dann in `src/`, dann im Projektordner und so weiter nach oben – bis er eine Datei mit
`root = true` findet. Näher liegende Dateien haben Vorrang. So könnte ein Unterordner mit generiertem
Code eigene Regeln bekommen.

Ohne `root = true` würde die Suche bis in deinen Home-Ordner weiterlaufen. Hat dort jemand eine private
`.editorconfig` mit Tabs liegen, mischt die sich ins Projekt. Deshalb gehört `root = true` in die
`.editorconfig` im Wurzelordner jedes Projekts.

## EditorConfig und Formatter

EditorConfig regelt nur die Grundlagen. Ein [[formatter|Formatter]] wie Prettier (JavaScript) oder Pint
(PHP) geht viel weiter: Er formatiert den ganzen Code neu – Anführungszeichen, Zeilenlänge, Klammern.
Beide ergänzen sich. Prettier liest übrigens Teile der `.editorconfig` (zum Beispiel `indent_style` und
`end_of_line`) und übernimmt sie, damit sich die Regeln nicht widersprechen.

> [!PRAXIS]
> In professionellen Repositorys ist die `.editorconfig` eine der ersten Dateien, die angelegt werden –
> oft schon im ersten Commit. Sie ist klein, macht nie Ärger und verhindert eine ganze Klasse von
> Diskussionen im Code-Review („Tabs oder Leerzeichen?“). Die Entscheidung wird einmal getroffen,
> aufgeschrieben und gilt dann für alle.

## Zusammenfassung

- `.editorconfig` legt im Repository fest, wie Dateien gespeichert werden – für jeden Editor gleich.
- `root = true` oben verhindert, dass Dateien aus übergeordneten Ordnern hineinwirken.
- Abschnitte wie `[*]`, `[*.php]` oder `[Makefile]` sind Glob-Muster; spätere Abschnitte überschreiben frühere.
- Kerneigenschaften: `indent_style`, `indent_size`, `end_of_line`, `charset`, `trim_trailing_whitespace`,
  `insert_final_newline`.
- Makefiles brauchen `indent_style = tab`, Markdown oft `trim_trailing_whitespace = false`.
- CRLF-Zeilenenden machen Diffs unlesbar und Shell-Skripte kaputt – `end_of_line = lf` beugt vor.
