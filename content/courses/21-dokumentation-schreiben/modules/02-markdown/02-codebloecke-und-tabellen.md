---
title: Codeblöcke, Tabellen und Aufgabenlisten
summary: Code mit Sprachangabe, übersichtliche Tabellen und abhakbare Aufgabenlisten – die Werkzeuge für technische Doku.
duration: 25
sources:
  - title: GitHub Docs – Codeblöcke erstellen und hervorheben
    url: https://docs.github.com/de/get-started/writing-on-github/working-with-advanced-formatting/creating-and-highlighting-code-blocks
  - title: GitHub Docs – Organisieren von Informationen mit Tabellen
    url: https://docs.github.com/de/get-started/writing-on-github/working-with-advanced-formatting/organizing-information-with-tables
  - title: GitHub Flavored Markdown – Spezifikation
    url: https://github.github.com/gfm/
quiz:
  - type: single
    question: Warum schreibst du hinter die öffnenden Backticks eines Codeblocks eine Sprache wie `bash` oder `json`?
    options:
      - Damit der Code ausgeführt wird.
      - Damit der Code farbig hervorgehoben wird und klar ist, in welcher Sprache er geschrieben ist.
      - Weil Markdown sonst einen Fehler meldet.
      - Damit der Codeblock auf GitHub ausgeblendet wird.
    answer: 1
    explanation: >
      Die Sprachangabe schaltet die Syntax-Hervorhebung ein und dokumentiert, was im Block steht. Linter wie
      markdownlint melden Codeblöcke ohne Sprache sogar als Fehler (Regel MD040).
  - type: find-bug
    question: Die Tabelle wird auf GitHub nicht als Tabelle angezeigt. In welcher Zeile liegt der Fehler?
    language: markdown
    code: |
      Die wichtigsten Befehle:

      | Befehl | Wirkung |
      | `npm install` | Abhängigkeiten installieren |
      | `npm test` | Tests ausführen |
    bug_line: 4
    explanation: >
      Unter der Kopfzeile fehlt die Trennzeile `|---|---|`. Erst sie macht aus den Zeilen eine Tabelle.
      Zeile 4 müsste die Trennzeile sein.
  - type: cloze
    text: In einer Tabelle richtest du eine Spalte mit `|---___|` rechtsbündig aus. Eine Aufgabenliste schreibst du mit `- [ ]` für offen und `- [___]` für erledigt.
    blanks:
      - [":"]
      - [x, X]
    explanation: Ein Doppelpunkt rechts in der Trennzeile richtet rechts aus, links links, auf beiden Seiten zentriert. `[x]` hakt einen Punkt ab.
  - type: multiple
    question: Wann ist eine Tabelle die richtige Wahl?
    options:
      - Wenn mehrere Einträge dieselben Eigenschaften haben, z. B. Variable, Standardwert und Bedeutung.
      - Für eine Anleitung mit fünf Schritten.
      - Für einen Vergleich von zwei Werkzeugen nach denselben Kriterien.
      - Für einen langen erklärenden Absatz.
    answers: [0, 2]
    explanation: Tabellen glänzen bei gleich aufgebauten Daten und Vergleichen. Schritte gehören in nummerierte Listen, Erklärungen in Absätze.
tasks:
  - id: befehlsuebersicht
    type: terminal
    title: Schreibe eine Befehlsübersicht
    description: |
      Im Ordner `befehle` liegt ein kleines Node-Projekt mit einer `package.json`. Schreibe die Datei
      `BEFEHLE.md`, die neuen Kolleg:innen zeigt, wie sie damit arbeiten:

      1. Erste Zeile: `# Befehle`.
      2. Ein Codeblock mit der Sprache `bash`, der zeigt, wie man die Abhängigkeiten installiert (`npm install`).
      3. Eine Tabelle mit den Spalten `Befehl` und `Wirkung` und je einer Zeile für **jedes** Skript aus der
         `package.json` (schau mit `cat package.json` nach). Schreib die Befehle als `npm run <name>`.
      4. Ein Abschnitt `## Checkliste für den ersten Tag` mit einer Aufgabenliste aus mindestens zwei Punkten
         (`- [ ] …`).

      Klicke zuerst auf **Aufgabe vorbereiten**, damit das Projekt angelegt wird.
    workdir: befehle
    setup: |
      cat > package.json <<'EOF'
      {
        "name": "notizen",
        "private": true,
        "scripts": {
          "dev": "node --watch src/server.js",
          "test": "node --test",
          "lint": "eslint ."
        }
      }
      EOF
    checks:
      - type: command
        run: head -n 1 BEFEHLE.md
        stdout_matches: "^# Befehle\\s*$"
        message: "BEFEHLE.md fehlt oder beginnt nicht mit `# Befehle`."
      - type: file_contains
        path: BEFEHLE.md
        pattern: "^```bash\\s*$"
        message: "Es fehlt ein Codeblock mit Sprachangabe: Er beginnt mit einer Zeile ```bash."
      - type: command
        run: awk '/^```bash/{f=1;next} /^```/{f=0} f' BEFEHLE.md | grep -c 'npm install'
        stdout_matches: "^[1-9]"
        message: Im bash-Codeblock soll `npm install` stehen.
      - type: file_contains
        path: BEFEHLE.md
        pattern: "^\\|\\s*Befehl\\s*\\|\\s*Wirkung\\s*\\|\\s*$"
        message: "Die Tabelle braucht die Kopfzeile `| Befehl | Wirkung |`."
      - type: file_contains
        path: BEFEHLE.md
        pattern: "^\\|\\s*:?-{3,}:?\\s*\\|\\s*:?-{3,}:?\\s*\\|\\s*$"
        message: "Unter der Kopfzeile fehlt die Trennzeile `|---|---|`."
      - type: command
        run: |
          for s in dev test lint; do grep -qE "^\|.*npm run $s" BEFEHLE.md || echo "fehlt: $s"; done
        stdout_equals: ""
        message: Die Tabelle soll für jedes Skript (dev, test, lint) eine Zeile mit `npm run …` haben.
      - type: file_contains
        path: BEFEHLE.md
        pattern: "^## Checkliste für den ersten Tag"
        message: "Es fehlt der Abschnitt `## Checkliste für den ersten Tag`."
      - type: command
        run: grep -cE '^- \[[ xX]\] \S' BEFEHLE.md
        stdout_matches: "^([2-9]|[1-9][0-9])$"
        message: "Die Checkliste braucht mindestens zwei Punkte im Format `- [ ] Text`."
    hints:
      - "Ein Codeblock beginnt mit einer Zeile ```bash und endet mit einer Zeile ```."
      - "Eine Tabelle: Kopfzeile `| Befehl | Wirkung |`, darunter `|---|---|`, dann je Zeile `| `npm run dev` | Startet den Server |`."
      - "Mit `cat > BEFEHLE.md <<'EOF'` schreibst du mehrere Zeilen am Stück. Die Datei endet mit einer Zeile `EOF`."
    solution: |
      ~~~bash
      cd befehle
      cat package.json
      cat > BEFEHLE.md <<'EOF'
      # Befehle

      Installiere zuerst die Abhängigkeiten:

      ```bash
      npm install
      ```

      | Befehl | Wirkung |
      |---|---|
      | `npm run dev` | Startet den Server und lädt bei Änderungen neu |
      | `npm run test` | Führt alle Tests aus |
      | `npm run lint` | Prüft den Code mit ESLint |

      ## Checkliste für den ersten Tag

      - [ ] Abhängigkeiten installiert
      - [ ] Server lokal gestartet
      - [ ] Tests einmal grün gesehen
      EOF
      ~~~
  - id: tabelle-generieren
    type: code
    language: js
    title: Eine Markdown-Tabelle erzeugen
    description: |
      Schreibe die Funktion `toMarkdownTable(headers, rows)`. Sie bekommt die Spaltenüberschriften als Array und
      die Zeilen als Array von Arrays und gibt eine Markdown-Tabelle als String zurück:

      - Kopfzeile: `| A | B |`
      - Trennzeile: `|---|---|` (für jede Spalte `---`)
      - Je Datenzeile: `| 1 | 2 |`
      - Die Zeilen werden mit `\n` verbunden, ohne Zeilenumbruch am Ende.
      - Enthält ein Wert ein `|`, muss es als `\|` maskiert werden – sonst zerfällt die Spalte.
    starter: |
      function toMarkdownTable(headers, rows) {
        // Baue hier die Zeilen der Tabelle zusammen.
      }
    tests:
      - name: Normalfall mit zwei Spalten
        code: |
          assertEqual(
            toMarkdownTable(['Befehl', 'Wirkung'], [['npm test', 'Tests ausführen']]),
            '| Befehl | Wirkung |\n|---|---|\n| npm test | Tests ausführen |'
          )
      - name: Ohne Datenzeilen bleiben Kopf- und Trennzeile
        code: assertEqual(toMarkdownTable(['A', 'B', 'C'], []), '| A | B | C |\n|---|---|---|')
      - name: Zahlen werden zu Text
        code: assertEqual(toMarkdownTable(['Port'], [[3000], [8080]]), '| Port |\n|---|\n| 3000 |\n| 8080 |')
      - name: Senkrechte Striche werden maskiert
        code: assertEqual(toMarkdownTable(['Befehl'], [['ls | wc -l']]), '| Befehl |\n|---|\n| ls \\| wc -l |')
    hints:
      - "Eine Zeile baust du mit `'| ' + zellen.join(' | ') + ' |'`."
      - "Für die Trennzeile: `'|' + headers.map(() => '---').join('|') + '|'`."
      - "Maskieren: `String(wert).replaceAll('|', '\\\\|')`."
    solution: |
      function toMarkdownTable(headers, rows) {
        const escape = (value) => String(value).replaceAll('|', '\\|')
        const line = (cells) => '| ' + cells.map(escape).join(' | ') + ' |'
        const separator = '|' + headers.map(() => '---').join('|') + '|'
        return [line(headers), separator, ...rows.map(line)].join('\n')
      }
---
Eine Doku, in der Befehle mitten im Fließtext stehen, Optionen in langen Absätzen beschrieben werden und
To-dos in einer losen Notiz liegen, ist mühsam zu lesen. Drei Markdown-Werkzeuge ändern das: **Codeblöcke**
für alles, was man abtippt, **Tabellen** für gleich aufgebaute Informationen und **Aufgabenlisten** für Dinge,
die man abhaken will.

## Codeblöcke mit Sprachangabe

Ein [[code-fence|Codeblock]] steht zwischen zwei Zeilen mit drei Backticks. Direkt hinter die öffnenden
Backticks schreibst du die Sprache:

~~~markdown
```bash
npm install
npm run dev
```
~~~

Die Sprachangabe hat zwei Vorteile:

1. GitHub und die meisten Editoren schalten [[syntax-hervorhebung|Syntax-Hervorhebung]] ein – Schlüsselwörter,
   Strings und Kommentare bekommen Farben.
2. Leser:innen sehen sofort, ob das ein Terminalbefehl (`bash`), eine Konfiguration ([[json|JSON]], [[yaml|YAML]]) oder
   Programmcode (`js`, `php`) ist.

Häufige Sprachangaben: `bash`, `json`, `yaml`, `js`, `ts`, `php`, `sql`, `diff` und `text` für Ausgaben ohne
Hervorhebung.

> [!MERKSATZ]
> Jeder Codeblock bekommt eine Sprache. Wenn es keine passt, schreib `text`.

## Gute Code-Beispiele

Ein Codeblock ist ein Versprechen: „Das kannst du so abtippen.“ Halte es ein.

- **Lauffähig:** Teste jeden Befehl, bevor du ihn dokumentierst.
- **Kein Prompt-Zeichen:** Schreib `npm install`, nicht `$ npm install`. Sonst kopieren Leute das `$` mit.
- **Befehl und Ausgabe trennen:** Zwei Blöcke – einer mit `bash`, einer mit `text` für die Ausgabe.
- **Platzhalter klar markieren:** `<dein-token>` statt eines echten Werts.

~~~markdown
```bash
curl https://api.example.com/health
```

```text
{"status":"ok"}
```
~~~

> [!FEHLER]
> Ein Codeblock mit echtem Passwort oder API-Token. Was in einer README steht, landet in der Git-Historie –
> und bleibt dort, auch wenn du es später löschst. Nutze immer Platzhalter.

## Tabellen

[[gfm|GitHub Flavored Markdown]] kennt Tabellen. Eine Tabelle besteht aus Kopfzeile, Trennzeile und
Datenzeilen. Die Spalten trennst du mit `|`:

```markdown
| Variable | Standardwert | Bedeutung |
|---|---:|---|
| PORT | 3000 | Port des Servers |
| LOG_LEVEL | info | Wie viel ins Log geschrieben wird |
```

Die Doppelpunkte in der Trennzeile steuern die Ausrichtung:

| Trennzeile | Ausrichtung |
|---|---|
| `---` oder `:---` | linksbündig |
| `---:` | rechtsbündig (gut für Zahlen) |
| `:---:` | zentriert |

Die Spalten müssen im Quelltext nicht bündig untereinanderstehen. Steht in einer Zelle ein `|`, schreibst du
`\|`, sonst entsteht eine zusätzliche Spalte.

## Wann Tabelle, wann Liste?

| Inhalt | Beste Form |
|---|---|
| Schritte, bei denen die Reihenfolge zählt | Nummerierte Liste |
| Viele Einträge mit denselben Eigenschaften | Tabelle |
| Vergleich nach festen Kriterien | Tabelle |
| Lose Stichpunkte ohne Reihenfolge | Aufzählung |
| Zusammenhänge und Begründungen | Absatz |

Tabellen eignen sich nicht für lange Texte. Passt eine Zelle nicht mehr in eine Zeile, ist ein Absatz oder
eine Überschrift pro Eintrag meist besser.

## Aufgabenlisten

Eine [[aufgabenliste|Aufgabenliste]] ist eine Aufzählung mit Kästchen:

```markdown
- [x] Repository geklont
- [x] Abhängigkeiten installiert
- [ ] Datenbank eingerichtet
- [ ] Ersten Test geschrieben
```

GitHub zeigt daraus anklickbare Checkboxen. In Issues und [[pull-request|Pull Requests]] zählt GitHub sogar
mit, wie viele Punkte erledigt sind.

> [!PRAXIS]
> Viele Teams legen im Pull-Request-Template eine Aufgabenliste an: „Tests ergänzt“, „Doku aktualisiert“,
> „Changelog-Eintrag geschrieben“. So vergisst niemand die Doku.

## Zusammenfassung

- Codeblöcke stehen zwischen drei Backticks und bekommen **immer** eine Sprachangabe.
- Gute Beispiele sind lauffähig, ohne `$`-Prompt und mit Platzhaltern statt echter Geheimnisse.
- Tabellen: Kopfzeile, Trennzeile `|---|`, Datenzeilen; Doppelpunkte steuern die Ausrichtung.
- Tabellen für gleich aufgebaute Daten, nummerierte Listen für Schritte.
- Aufgabenlisten mit `- [ ]` und `- [x]` werden auf GitHub zu Checkboxen.
