---
title: Prüfen vor dem Commit mit Git-Hooks
summary: Wie Git-Hooks Prüfungen automatisch vor jedem Commit starten, wie du eigene Hooks versionierst und warum Hook-Manager wie Lefthook oder Husky das im Team einfacher machen.
duration: 25
sources:
  - title: Pro Git – Git-Hooks
    url: https://git-scm.com/book/de/v2/Git-individuell-einrichten-Git-Hooks
  - title: Git – githooks
    url: https://git-scm.com/docs/githooks
  - title: Lefthook – Configuration
    url: https://lefthook.dev/configuration/
  - title: Lefthook auf GitHub
    url: https://github.com/evilmartians/lefthook
  - title: Husky – Get Started
    url: https://typicode.github.io/husky/get-started.html
quiz:
  - type: single
    question: Wann verhindert ein `pre-commit`-Hook einen Commit?
    options:
      - Wenn das Hook-Skript mit einem Exit-Code ungleich 0 endet.
      - Wenn das Skript etwas auf die Konsole schreibt.
      - Wenn mehr als zehn Dateien vorgemerkt sind.
      - Nie – Hooks zeigen nur Hinweise an.
    answer: 0
    explanation: Git startet das Skript vor dem Commit und schaut nur auf den Exit-Code. Alles ungleich 0 bricht den Commit ab.
  - type: multiple
    question: Warum reichen Dateien in `.git/hooks/` für ein Team nicht aus?
    options:
      - Der Ordner `.git/hooks/` wird nicht mit dem Repository geteilt.
      - Jede Person müsste die Skripte von Hand kopieren und ausführbar machen.
      - Git führt Hooks in `.git/hooks/` nur unter Linux aus.
      - Mit `core.hooksPath` oder einem Hook-Manager liegen die Hooks versioniert im Repository.
    answers: [0, 1, 3]
    explanation: "`.git/` gehört nicht zum versionierten Inhalt. Deshalb legt man Hooks in einen normalen Ordner und verweist mit `core.hooksPath` darauf – oder lässt einen Hook-Manager sie installieren."
  - type: cloze
    text: "In einer lefthook.yml steht der Platzhalter `{___}` für alle vorgemerkten Dateien, die zum glob-Muster passen."
    blanks:
      - [staged_files]
    explanation: "`{staged_files}` macht Hooks schnell: Geprüft werden nur die Dateien, die wirklich in den Commit kommen."
  - type: single
    question: Ein Kollege committet mit `git commit --no-verify`. Was folgt daraus?
    options:
      - Hooks sind eine Hilfe, keine Garantie – die CI-Pipeline muss dieselben Prüfungen noch einmal ausführen.
      - Git verweigert den Push.
      - Lefthook führt die Prüfung beim nächsten Commit doppelt aus.
    answer: 0
    explanation: Jeder kann Hooks umgehen (`--no-verify`, `LEFTHOOK=0`, `HUSKY=0`). Verbindlich ist erst die Prüfung in der CI.
tasks:
  - id: eigener-pre-commit
    type: terminal
    title: Einen versionierten Pre-Commit-Hook schreiben
    description: |
      Im Ordner `eigener-pre-commit` liegt ein Git-Repository mit PHP-Code. Baue einen Hook, der vor jedem Commit
      die **vorgemerkten** PHP-Dateien prüft – und lege ihn so ab, dass das ganze Team ihn bekommt.

      1. Lege die Datei `.githooks/pre-commit` an. Sie soll:
         - mit `git diff --cached --name-only --diff-filter=ACM -- '*.php'` die vorgemerkten PHP-Dateien ermitteln,
         - sofort mit `exit 0` enden, wenn keine dabei sind,
         - jede Datei mit `php -l` prüfen und danach `pint --test` für genau diese Dateien ausführen,
         - beim ersten Fehler mit einem Exit-Code ungleich 0 abbrechen.
      2. Mache die Datei ausführbar (`chmod +x`) und stelle Git mit `git config core.hooksPath .githooks` darauf um.
      3. Merke `src/Greeter.php` vor und versuche zu committen – der Hook muss den Commit stoppen.
      4. Repariere die Datei (Syntaxfehler und Stil), merke sie erneut vor und committe zusammen mit dem Hook,
         z. B. `feat: add greeter and pre-commit hook`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: eigener-pre-commit
    setup: |
      git init -q -b main
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      mkdir -p src
      cat > src/Clock.php <<'EOF'
      <?php

      declare(strict_types=1);

      namespace App;

      final class Clock
      {
          public function year(): int
          {
              return (int) date('Y');
          }
      }
      EOF
      git add src/Clock.php
      git commit -q -m "chore: initial commit"
      cat > src/Greeter.php <<'EOF'
      <?php

      declare(strict_types=1);

      namespace App;

      final class Greeter
      {
          public function greet( string $name ) : string
          {
              return 'Hallo ' . $name
          }
      }
      EOF
    checks:
      - type: file_exists
        path: .githooks/pre-commit
        message: Es fehlt die Datei .githooks/pre-commit.
      - type: command
        run: test -x .githooks/pre-commit
        message: Der Hook ist noch nicht ausführbar. Nutze chmod +x .githooks/pre-commit.
      - type: command
        run: git config --get core.hooksPath
        stdout_equals: .githooks
        message: Git nutzt den Ordner noch nicht. Führe git config core.hooksPath .githooks aus.
      - type: command
        run: git ls-files .githooks/pre-commit src/Greeter.php | wc -l
        stdout_matches: "^\\s*2\\s*$"
        message: Committe den Hook und src/Greeter.php, damit das Team den Hook bekommt.
      - type: command
        run: php -l src/Greeter.php && pint --test src/Greeter.php
        message: src/Greeter.php hat noch einen Syntaxfehler oder Stilprobleme.
      - type: command
        run: test -z "$(git status --porcelain -- src .githooks)"
        message: In src/ oder .githooks/ gibt es noch uncommittete Änderungen.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          git clone -q . "$d/repo" && cd "$d/repo"
          printf '<?php\nfunction kaputt( {\n' > src/Kaputt.php
          git add src/Kaputt.php
          ./.githooks/pre-commit >/dev/null 2>&1
          ec=$?
          cd / && rm -rf "$d"
          [ "$ec" -ne 0 ]
        message: Dein Hook lässt eine vorgemerkte Datei mit Syntaxfehler durch. Er muss mit einem Exit-Code ungleich 0 enden.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          git clone -q . "$d/repo" && cd "$d/repo"
          printf '<?php\n\nfunction schief( $a ){ return $a; }\n' > src/schief.php
          git add src/schief.php
          ./.githooks/pre-commit >/dev/null 2>&1
          ec=$?
          cd / && rm -rf "$d"
          [ "$ec" -ne 0 ]
        message: Dein Hook lässt eine falsch formatierte Datei durch. Führe pint --test für die vorgemerkten Dateien aus.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          git clone -q . "$d/repo" && cd "$d/repo"
          echo "Notiz" > notes.txt
          git add notes.txt
          ./.githooks/pre-commit >/dev/null 2>&1
          ec=$?
          cd / && rm -rf "$d"
          [ "$ec" -eq 0 ]
        message: Dein Hook schlägt fehl, obwohl keine PHP-Datei vorgemerkt ist. Beende ihn in diesem Fall mit exit 0.
    hints:
      - "Beginne die Datei mit `#!/bin/sh` und `set -e`. Speichere die Dateiliste in einer Variablen: `files=$(git diff --cached …)`."
      - "`[ -z \"$files\" ] && exit 0` beendet den Hook, wenn nichts zu prüfen ist."
      - "In `src/Greeter.php` fehlt das Semikolon nach `$name`; den Stil repariert `pint src/Greeter.php`."
    solution: |
      ```bash
      cd eigener-pre-commit
      mkdir -p .githooks
      cat > .githooks/pre-commit <<'EOF'
      #!/bin/sh
      set -e
      files=$(git diff --cached --name-only --diff-filter=ACM -- '*.php')
      [ -z "$files" ] && exit 0
      for f in $files; do
          php -l "$f"
      done
      pint --test $files
      EOF
      chmod +x .githooks/pre-commit
      git config core.hooksPath .githooks
      git add src/Greeter.php
      git commit -m "feat: add greeter" || echo "Hook hat den Commit gestoppt"
      sed -i "s/return 'Hallo ' . \$name$/return 'Hallo ' . \$name;/" src/Greeter.php
      pint src/Greeter.php
      git add src/Greeter.php .githooks/pre-commit
      git commit -m "feat: add greeter and pre-commit hook"
      ```
  - id: hook-ablauf
    type: steps
    title: Was passiert beim Commit?
    description: "In einem Projekt ist Lefthook mit Pint (`stage_fixed: true`) und Biome eingerichtet. Spiel durch, was passiert."
    steps:
      - situation: Du merkst nur `README.md` vor und committest.
        question: 'Was machen die Jobs mit `glob: "*.php"` und `glob: "*.{js,ts}"`?'
        options:
          - Sie werden übersprungen, weil keine passende Datei vorgemerkt ist.
          - Sie prüfen das ganze Projekt.
          - Sie brechen den Commit ab.
        answer: 0
        explanation: Lefthook filtert die vorgemerkten Dateien mit dem glob-Muster. Bleibt nichts übrig, wird der Job übersprungen.
      - situation: "Du merkst eine falsch eingerückte PHP-Datei vor. Der Job führt `pint {staged_files}` mit `stage_fixed: true` aus."
        question: Was landet im Commit?
        options:
          - Die von Pint korrigierte Fassung – Lefthook merkt sie nach dem Formatieren erneut vor.
          - Die falsch eingerückte Fassung.
          - Gar nichts, der Commit wird abgebrochen.
        answer: 0
        explanation: "`stage_fixed` fügt die vom Werkzeug geänderten Dateien wieder dem Staging-Bereich hinzu. So kommt die reparierte Version in den Commit."
      - situation: Eine TypeScript-Datei enthält `==`. Der Biome-Job läuft ohne `--write`.
        question: Was passiert?
        options:
          - Biome meldet den Fehler, endet mit Exit-Code 1, und der Commit wird abgebrochen.
          - Biome repariert still und committet.
        answer: 0
        explanation: Ohne `--write` prüft Biome nur. Der Exit-Code ungleich 0 stoppt den Commit – du behebst und committest erneut.
---
Die CI-Pipeline meldet nach fünf Minuten: „Pint: 1 Datei falsch formatiert.“ Du korrigierst, pushst, wartest
wieder fünf Minuten. Hätte dieselbe Prüfung **vor** dem Commit auf deinem Rechner gelaufen, hättest du es nach
zwei Sekunden gewusst. Dafür gibt es [[git-hook|Git-Hooks]].

## Wie Git-Hooks funktionieren

Ein Git-Hook ist ein Skript, das Git an einer bestimmten Stelle automatisch startet. Für Code-Qualität sind
diese wichtig:

| Hook | Wann | Typischer Einsatz |
|---|---|---|
| `pre-commit` | Vor dem Commit | Formatter, Linter auf vorgemerkte Dateien |
| `commit-msg` | Nach dem Schreiben der Nachricht | Format der Commit-Nachricht prüfen |
| `pre-push` | Vor dem Push | Langsamere Prüfungen, z. B. PHPStan oder Tests |

Die Regel ist einfach: Endet das Skript mit [[exit-code|Exit-Code]] `0`, macht Git weiter. Jeder andere Wert
bricht ab. Ein [[pre-commit-hook|Pre-Commit-Hook]] mit `exit 1` verhindert also den Commit.

> [!MERKSATZ]
> Ein Hook ist ein ganz normales Shell-Skript. Git interessiert nur sein Exit-Code.

## Eigene Hooks versionieren

Git sucht Hooks standardmäßig in `.git/hooks/`. Dieser Ordner wird aber **nicht** mit dem Repository
geteilt – jede Kollegin müsste die Skripte von Hand kopieren. Besser: Lege die Hooks in einen normalen,
versionierten Ordner und stelle Git mit [[core-hookspath|`core.hooksPath`]] darauf um.

```sh title=".githooks/pre-commit"
#!/bin/sh
set -e
files=$(git diff --cached --name-only --diff-filter=ACM -- '*.php')
[ -z "$files" ] && exit 0

for f in $files; do
    php -l "$f"
done
./vendor/bin/pint --test $files
```

```bash title="Terminal"
chmod +x .githooks/pre-commit
git config core.hooksPath .githooks
```

- `git diff --cached --name-only` listet die Dateien im [[staging-bereich|Staging-Bereich]].
- `--diff-filter=ACM` nimmt nur hinzugefügte, kopierte und geänderte Dateien – gelöschte kann man nicht prüfen.
- `set -e` sorgt dafür, dass der erste Fehler das Skript beendet.

> [!FEHLER]
> „Mein Hook läuft nicht.“ – Fast immer fehlt das Ausführungsrecht (`chmod +x`) oder `core.hooksPath` ist auf
> diesem Rechner nicht gesetzt. Diese Einstellung ist lokal und muss jede Person einmal ausführen – ein
> Grund für Hook-Manager.

## Lefthook: Hooks aus einer Konfigurationsdatei

Ein [[hook-manager|Hook-Manager]] erzeugt die Hook-Skripte aus einer versionierten Datei. [[lefthook|Lefthook]]
ist ein schnelles, sprachunabhängiges Programm und passt gut zu gemischten PHP- und JavaScript-Projekten:

```bash title="Terminal"
npm i -D lefthook
npx lefthook install      # schreibt .git/hooks/pre-commit
```

```yaml title="lefthook.yml"
pre-commit:
  parallel: true
  jobs:
    - name: pint
      glob: "*.php"
      run: ./vendor/bin/pint {staged_files}
      stage_fixed: true
    - name: biome
      glob: "*.{js,ts,json}"
      run: npx biome check --write --no-errors-on-unmatched {staged_files}
      stage_fixed: true

pre-push:
  jobs:
    - name: phpstan
      run: ./vendor/bin/phpstan analyse --no-progress
```

| Schlüssel | Bedeutung |
|---|---|
| `glob` | Nur Dateien mit passendem [[glob-muster\|Muster]]; ohne Treffer wird der Job übersprungen |
| `{staged_files}` | Platzhalter für die vorgemerkten Dateien |
| `stage_fixed` | Vom Werkzeug reparierte Dateien werden wieder vorgemerkt |
| `parallel` | Jobs laufen gleichzeitig |

## Husky und das Umgehen von Hooks

In reinen JavaScript-Projekten ist [[husky|Husky]] weit verbreitet. `npx husky init` legt `.husky/pre-commit`
an und trägt in der `package.json` das Skript `"prepare": "husky"` ein – so werden die Hooks bei jedem
`npm install` aktiviert. Die Hook-Datei ist ein Shell-Skript, z. B. mit `npx biome check --staged`.

Egal welches Werkzeug: Hooks lassen sich immer umgehen – mit `git commit --no-verify`, `LEFTHOOK=0` oder
`HUSKY=0`. Das ist gewollt, etwa für einen schnellen Zwischenstand.

> [!PRAXIS]
> Halte Pre-Commit-Hooks **schnell** (unter ein paar Sekunden): nur vorgemerkte Dateien, nur Formatter und
> Linter. Langsames wie PHPStan oder Tests gehört in `pre-push` oder in die CI. Ein Hook, der eine Minute
> braucht, wird irgendwann von allen mit `--no-verify` übersprungen.

## Zusammenfassung

- Git-Hooks sind Skripte, die Git automatisch startet; ein Exit-Code ungleich 0 bricht den Vorgang ab.
- `pre-commit` prüft die vorgemerkten Dateien, `pre-push` übernimmt langsamere Prüfungen.
- Eigene Hooks legst du versioniert ab und aktivierst sie mit `git config core.hooksPath`.
- **Lefthook** (oder **Husky**) erzeugt Hooks aus einer Konfigurationsdatei; `{staged_files}` und `stage_fixed` machen sie schnell und bequem.
- Hooks lassen sich umgehen – verbindlich ist erst die CI-Pipeline.
