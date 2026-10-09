---
title: Git-Hooks im Team teilen
summary: Warum Hooks in .git/hooks nicht geteilt werden, wie ein versionierter .githooks-Ordner mit core.hooksPath funktioniert und wann Hook-Manager wie lefthook oder husky helfen.
duration: 25
sources:
  - title: Git – githooks
    url: https://git-scm.com/docs/githooks
  - title: Git – git-config (core.hooksPath)
    url: https://git-scm.com/docs/git-config#Documentation/git-config.txt-corehooksPath
  - title: Pro Git – Git-Hooks
    url: https://git-scm.com/book/de/v2/Git-anpassen-Git-Hooks
  - title: lefthook – Dokumentation
    url: https://lefthook.dev/
  - title: husky – Get started
    url: https://typicode.github.io/husky/get-started.html
quiz:
  - type: single
    question: Warum landen Hooks aus `.git/hooks` nicht bei deinen Kolleg:innen?
    options:
      - Weil Git Hooks beim Push verschlüsselt.
      - Weil der Ordner `.git` selbst nicht versioniert wird – er wird beim Klonen neu angelegt.
      - Weil Hooks nur unter Windows funktionieren.
    answer: 1
    explanation: Alles in `.git/` ist lokale Verwaltung. Ein Klon bekommt nur die Beispiel-Hooks. Deshalb legt man Hooks in einen normalen, versionierten Ordner und zeigt mit `core.hooksPath` darauf.
  - type: match
    question: Welcher Hook läuft wann?
    pairs:
      - { left: "pre-commit", right: "Bevor der Commit angelegt wird" }
      - { left: "commit-msg", right: "Nachdem die Commit-Nachricht geschrieben wurde" }
      - { left: "pre-push", right: "Bevor Daten zum Remote übertragen werden" }
      - { left: "post-checkout", right: "Nach einem Branch-Wechsel" }
    explanation: Hooks mit `pre-` können die Aktion durch einen Exit-Code ungleich 0 abbrechen, `post-`-Hooks laufen danach und können nichts mehr verhindern.
  - type: find-bug
    question: Der Hook liegt in `.githooks/pre-commit`, `core.hooksPath` ist gesetzt – trotzdem läuft er nie. Was ist falsch?
    language: bash
    code: |
      git config core.hooksPath .githooks
      cat > .githooks/pre-commit <<'EOF'
      #!/usr/bin/env bash
      npm test
      EOF
      chmod 644 .githooks/pre-commit
      git add .githooks/pre-commit
    bug_line: 6
    explanation: "`chmod 644` nimmt das Ausführungsrecht. Richtig ist `chmod +x .githooks/pre-commit` – Git ignoriert Hooks, die nicht ausführbar sind (und speichert das Recht mit dem Commit)."
  - type: cloze
    text: Mit `git commit --___` überspringst du die Hooks pre-commit und commit-msg.
    blanks:
      - [no-verify]
    explanation: "`--no-verify` (kurz `-n`) ist ein Notausgang. Hooks sind deshalb eine Hilfe, keine Sicherheitsgarantie – die echte Prüfung passiert in der CI."
  - type: single
    question: Was setzt lefthook für `{staged_files}` in einen Befehl ein?
    options:
      - Alle Dateien im Repository
      - Die vorgemerkten Dateien, die zum glob-Filter des Jobs passen
      - Die Dateien des letzten Commits
    answer: 1
    explanation: So prüft der Hook nur, was gerade committet wird – das hält ihn auch in großen Projekten schnell.
tasks:
  - id: pre-commit-hook
    type: terminal
    title: Ein pre-commit-Hook gegen console.log
    description: |
      Im Ordner `hooks` liegt ein Repository mit einem ersten Commit. Das Team will verhindern, dass
      `console.log`-Ausgaben versehentlich committet werden.

      1. Lege den Ordner `.githooks` an und darin das Skript `pre-commit` (Shebang `#!/usr/bin/env bash`).
      2. Das Skript prüft die **vorgemerkten** Änderungen an `.js`-Dateien (`git diff --cached -- '*.js'`).
         Enthält eine hinzugefügte Zeile `console.log`, gibt es eine Meldung aus und endet mit `exit 1`.
      3. Mach das Skript ausführbar und aktiviere den Ordner: `git config core.hooksPath .githooks`.
      4. Teste: Eine Datei mit `console.log` darf sich nicht committen lassen, eine saubere schon.
      5. Committe den Hook selbst, damit das Team ihn bekommt (Nachricht frei wählbar).

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: hooks
    setup: |
      git init -q
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      printf 'export const add = (a, b) => a + b;\n' > app.js
      git add app.js
      git commit -q -m "chore: initial commit"
    checks:
      - type: command
        run: git config core.hooksPath
        stdout_equals: .githooks
        message: core.hooksPath ist noch nicht auf .githooks gesetzt.
      - type: command
        run: git ls-files -s .githooks/pre-commit
        stdout_matches: "^100755 "
        message: .githooks/pre-commit ist nicht committet oder nicht ausführbar (chmod +x vor git add).
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          git clone -q . "$d/r" && cd "$d/r" && git config core.hooksPath .githooks && git config user.name t && git config user.email t@example.com
          echo 'console.log("debug")' > schlecht.js && git add schlecht.js
          git commit -q -m "test: bad" > /dev/null 2>&1; rc=$?
          cd / && rm -rf "$d"
          [ "$rc" -ne 0 ]
        message: Ein Commit mit console.log in einer .js-Datei wurde nicht blockiert.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          git clone -q . "$d/r" && cd "$d/r" && git config core.hooksPath .githooks && git config user.name t && git config user.email t@example.com
          echo 'export const sub = (a, b) => a - b;' > sauber.js && git add sauber.js
          git commit -q -m "feat: add sub" > /dev/null 2>&1; rc=$?
          cd / && rm -rf "$d"
          exit $rc
        message: Ein sauberer Commit ohne console.log wird fälschlich blockiert.
    hints:
      - "`git diff --cached -- '*.js'` zeigt die vorgemerkten Änderungen; hinzugefügte Zeilen beginnen mit `+`."
      - "`if git diff --cached -- '*.js' | grep -qE '^\\+.*console\\.log'; then … exit 1; fi`"
      - "Danach: `chmod +x .githooks/pre-commit`, `git add .githooks/pre-commit`, `git commit -m \"chore: add pre-commit hook\"`"
    solution: |
      ```bash
      cd hooks
      mkdir -p .githooks
      cat > .githooks/pre-commit <<'EOF'
      #!/usr/bin/env bash
      if git diff --cached -- '*.js' | grep -qE '^\+.*console\.log'; then
        echo "Commit abgelehnt: Entferne console.log aus den vorgemerkten .js-Dateien."
        exit 1
      fi
      EOF
      chmod +x .githooks/pre-commit
      git config core.hooksPath .githooks
      git add .githooks/pre-commit
      git commit -m "chore: add pre-commit hook"
      ```
  - id: hook-zweck
    type: dragdrop
    title: Welche Prüfung passt in welchen Hook?
    description: Ordne jede Prüfung dem Hook zu, in dem sie am sinnvollsten läuft.
    targets:
      - { id: precommit, label: pre-commit }
      - { id: commitmsg, label: commit-msg }
      - { id: prepush, label: pre-push }
      - { id: postcheckout, label: post-checkout }
    items:
      - { label: Formatter auf die vorgemerkten Dateien anwenden, target: precommit }
      - { label: Nach debugger-Anweisungen suchen, target: precommit }
      - { label: Prüfen ob die Nachricht dem Conventional-Commits-Format folgt, target: commitmsg }
      - { label: Die komplette Testsuite ausführen, target: prepush }
      - { label: Abhängigkeiten installieren wenn sich das Lockfile geändert hat, target: postcheckout }
---

Im Git-Kurs hast du [[git-hook|Git-Hooks]] kennengelernt: Skripte, die Git an bestimmten Stellen
automatisch ausführt. Ein Hook, der vor jedem Commit den Linter startet, ist großartig – aber nur, wenn
**alle** im Team ihn haben. Und genau da gibt es einen Haken.

## Das Problem mit .git/hooks

Git sucht Hooks standardmäßig im Ordner `.git/hooks`. Dieser Ordner gehört zur internen Verwaltung des
[[repository|Repositorys]] und wird **nicht** versioniert. Wer das Projekt klont, bekommt dort nur die
Beispieldateien (`pre-commit.sample` und Co.).

| Ort des Hooks | Wird geteilt? | Folge |
|---|---|---|
| `.git/hooks/pre-commit` | Nein | Jede Person müsste ihn selbst anlegen – und vergisst es |
| `.githooks/pre-commit` (im Projekt) | Ja, wie jede andere Datei | Alle bekommen dieselbe Version |

Das ist Absicht: Ein Hook ist ausführbarer Code. Würde Git Hooks beim Klonen automatisch aktivieren,
könnte jedes fremde Repository beim ersten Commit beliebige Befehle auf deinem Rechner ausführen. Du
entscheidest also bewusst, ob du die Hooks eines Projekts einschaltest.

## Die Lösung: core.hooksPath

Seit Git 2.9 gibt es die Einstellung [[core-hookspath|`core.hooksPath`]]. Sie sagt Git: „Suche Hooks
nicht in `.git/hooks`, sondern in diesem Ordner.“ Ein relativer Pfad bezieht sich auf das Hauptverzeichnis
des Repositorys.

```bash title="Einmal pro Klon"
git config core.hooksPath .githooks
```

Die Einstellung selbst landet in `.git/config` und wird nicht geteilt – deshalb steht dieser Befehl im
`setup`-Target des Makefiles:

```makefile title="Makefile"
hooks: ## Aktiviert die Git-Hooks
	git config core.hooksPath .githooks
```

> [!MERKSATZ]
> Die Hook-Skripte werden versioniert (`.githooks/`), die Aktivierung (`core.hooksPath`) macht jede Person
> einmal – am besten automatisch über `make setup`.

## Einen pre-commit-Hook schreiben

Ein Hook ist ein ausführbares Skript mit dem genauen Namen des Hooks, ohne Dateiendung. Entscheidend ist
der [[exit-code|Exit-Code]]: `0` erlaubt den Commit, alles andere bricht ihn ab.

```bash title=".githooks/pre-commit"
#!/usr/bin/env bash
if git diff --cached -- '*.js' | grep -qE '^\+.*console\.log'; then
  echo "Commit abgelehnt: Entferne console.log aus den vorgemerkten .js-Dateien."
  exit 1
fi
```

`git diff --cached` zeigt nur das, was im [[staging-bereich|Staging-Bereich]] liegt – also genau das,
was in den Commit kommt. Zeilen, die mit `+` beginnen, sind hinzugefügt.

```bash title="Ausführbar machen und committen"
chmod +x .githooks/pre-commit
git add .githooks/pre-commit
git commit -m "chore: add pre-commit hook"
```

> [!FEHLER]
> **Hook ohne Ausführungsrecht.** Fehlt `chmod +x`, ignoriert Git den Hook stillschweigend. Git speichert
> das Ausführungsrecht mit: In `git ls-files -s` steht dann `100755` statt `100644`.

## Grenzen von Hooks

Hooks laufen auf dem Rechner der Entwickler:innen. Sie sind eine **Hilfe**, keine Garantie:

- `git commit --no-verify` überspringt pre-commit und commit-msg.
- Wer `core.hooksPath` nicht setzt, hat gar keine Hooks.
- Langsame Hooks nerven – dann werden sie umgangen.

Deshalb laufen dieselben Prüfungen zusätzlich in der CI-Pipeline auf dem Server. Hooks geben schnelles
Feedback, die CI ist die verbindliche Kontrolle.

> [!PRAXIS]
> Halte pre-commit-Hooks schnell (unter ein paar Sekunden): Formatter und Linter nur auf die vorgemerkten
> Dateien. Die komplette Testsuite gehört in `pre-push` oder in die CI.

## Hook-Manager: lefthook und husky

Werden die Hook-Skripte lang (Linter für JavaScript, Formatter für PHP, Secret-Prüfung …), helfen
[[hook-manager|Hook-Manager]]. Sie erzeugen Hooks aus einer Konfigurationsdatei:

| Ansatz | Datei | Passt zu |
|---|---|---|
| Eigener Ordner + `core.hooksPath` | `.githooks/` | Wenige, einfache Prüfungen – keine Abhängigkeit |
| [[lefthook]] | `lefthook.yml` | Gemischte Projekte (PHP + JS), viele Prüfungen |
| [[husky]] | `.husky/` + `"prepare": "husky"` | Reine JavaScript-Projekte |

```yaml title="lefthook.yml"
pre-commit:
  parallel: true
  jobs:
    - name: lint
      glob: "*.{js,ts,tsx}"
      run: npx eslint {staged_files}
    - name: format
      glob: "*.php"
      run: vendor/bin/pint {staged_files}
      stage_fixed: true
```

`{staged_files}` setzt nur die vorgemerkten, zum `glob` passenden Dateien ein. Aktiviert wird mit
`lefthook install`. Bei husky erledigen `npm install --save-dev husky` und `npx husky init` die
Einrichtung. Nutze **einen** Weg pro Projekt – mehrere Hook-Manager überschreiben sich gegenseitig.

## Zusammenfassung

- `.git/hooks` wird nicht versioniert – dort abgelegte Hooks bekommt niemand sonst.
- Versionierte Hooks liegen in einem Ordner wie `.githooks/`; `git config core.hooksPath .githooks` aktiviert ihn.
- Ein Hook ist ein ausführbares Skript; Exit-Code ungleich 0 bricht die Aktion ab.
- `git diff --cached` zeigt genau das, was committet wird.
- Hooks lassen sich mit `--no-verify` umgehen – die CI bleibt die verbindliche Prüfung.
- Hook-Manager wie lefthook (`lefthook.yml`) oder husky (`.husky/`) bündeln viele Prüfungen mit Dateifiltern.
