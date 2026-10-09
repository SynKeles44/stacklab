---
title: Generiert oder committet? Die .gitignore
summary: Welche Dateien ins Repository gehören, welche nicht – und wie du mit .gitignore und git check-ignore dafür sorgst.
duration: 25
sources:
  - title: Git – gitignore
    url: https://git-scm.com/docs/gitignore
  - title: Git – git-check-ignore
    url: https://git-scm.com/docs/git-check-ignore
  - title: GitHub – gitignore-Vorlagen
    url: https://github.com/github/gitignore
quiz:
  - type: single
    question: Warum committet man `node_modules/` nicht?
    options:
      - Weil Git keine Ordner speichern kann.
      - Weil npm den Ordner aus package.json und Lockfile jederzeit exakt neu erzeugen kann.
      - Weil der Ordner Passwörter enthält.
      - Weil GitHub Ordner mit Unterstrich verbietet.
    answer: 1
    explanation: Was reproduzierbar erzeugt werden kann, gehört nicht ins Repository. Committet werden die Zutaten (package.json, Lockfile), nicht das Ergebnis.
  - type: find-bug
    question: Mit dieser .gitignore landet `.env` trotzdem im Repository. Welche Zeile ist schuld?
    language: bash
    code: |
      node_modules/
      vendor/
      dist/
      env
      *.log
    bug_line: 4
    explanation: Das Muster `env` passt nur auf Dateien oder Ordner, die genau „env“ heißen. Für die Datei `.env` muss der Punkt mit ins Muster.
  - type: cloze
    text: Mit `git check-___ -v .env` zeigt Git, welche Zeile welcher Datei `.env` ignoriert. Eine bereits committete Datei entfernst du mit `git rm ___ datei` aus dem Index, ohne sie zu löschen.
    blanks:
      - [ignore]
      - [--cached]
    explanation: check-ignore ist das Diagnosewerkzeug für .gitignore. rm --cached nimmt eine Datei aus der Versionskontrolle, lässt sie aber auf der Festplatte.
  - type: multiple
    question: Welche Muster ignorieren alle Log-Dateien in allen Unterordnern?
    options: ["*.log", "/*.log", "**/*.log", "log"]
    answers: [0, 2]
    explanation: "`*.log` ohne Schrägstrich gilt in jedem Ordner, `**/*.log` ebenso. `/*.log` gilt nur direkt in der Wurzel, `log` passt nur auf Dateien namens log."
tasks:
  - id: gitignore-schreiben
    type: terminal
    title: Eine .gitignore schreiben und prüfen
    description: |
      Im Ordner `ignorieren` liegt ein frisch angelegtes Repository ohne Commit. Darin gibt es
      Quellcode, aber auch `node_modules/`, `dist/`, eine `.env`, eine Log-Datei und eine `.env.example`.

      1. Schau dir mit `ls -a` und `git status` an, was Git gerade alles sieht.
      2. Lege eine `.gitignore` an, die `node_modules/`, `dist/`, `.env` und alle `*.log`-Dateien ignoriert.
         Die `.env.example` muss sichtbar bleiben.
      3. Prüfe mit `git check-ignore -v .env debug.log`, dass deine Regeln greifen.
      4. Committe alles, was übrig bleibt, mit `git add .` und einer Nachricht deiner Wahl.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit das Repository angelegt wird.
    workdir: ignorieren
    setup: |
      git init -q
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      mkdir -p src node_modules/left-pad dist
      echo 'console.log("Hallo")' > src/main.js
      echo '{ "name": "ignorieren", "version": "1.0.0" }' > package.json
      echo 'module.exports = () => {}' > node_modules/left-pad/index.js
      echo 'console.log("gebaut")' > dist/app.js
      printf 'API_KEY=<dein-token>\n' > .env
      printf 'API_KEY=\n' > .env.example
      echo 'Fehler um 10:00' > debug.log
    checks:
      - type: file_exists
        path: .gitignore
        message: Es gibt noch keine .gitignore in der Projektwurzel.
      - type: command
        run: git check-ignore -q node_modules/left-pad/index.js && git check-ignore -q dist/app.js
        message: node_modules/ und dist/ werden noch nicht ignoriert.
      - type: command
        run: git check-ignore -q .env
        message: Die Datei .env wird noch nicht ignoriert – denk an den Punkt im Muster.
      - type: command
        run: git check-ignore -q debug.log && git check-ignore -q logs/app.log
        message: Log-Dateien werden noch nicht überall ignoriert (Muster *.log).
      - type: command
        run: git check-ignore -q .env.example
        expect_exit: 1
        message: .env.example wird ignoriert, soll aber committet werden. Ist dein Muster zu breit (z. B. .env*)?
      - type: command
        run: git ls-files | LC_ALL=C sort | tr '\n' ' '
        stdout_matches: "^\\.env\\.example \\.gitignore package\\.json src/main\\.js\\s*$"
        message: Der Commit soll genau .env.example, .gitignore, package.json und src/main.js enthalten.
    hints:
      - Jede Zeile der .gitignore ist ein Muster. Ein Schrägstrich am Ende meint einen Ordner.
      - "`printf 'node_modules/\\ndist/\\n.env\\n*.log\\n' > .gitignore` schreibt alle vier Regeln auf einmal."
      - Hast du schon committet und es ist zu viel drin? `git rm -r --cached .` und dann neu `git add .`.
    solution: |
      ```bash
      cd ignorieren
      ls -a
      git status
      printf 'node_modules/\ndist/\n.env\n*.log\n' > .gitignore
      git check-ignore -v .env debug.log
      git add .
      git status      # nur .env.example, .gitignore, package.json, src/main.js
      git commit -m "chore: initial commit with gitignore"
      ```
  - id: versehentlich-committet
    type: order
    title: node_modules wurde versehentlich committet
    description: Im Repository liegt seit einem Commit der komplette Ordner `node_modules/`. Bringe die Schritte zur Reparatur in die richtige Reihenfolge.
    items:
      - "`node_modules/` in die .gitignore eintragen"
      - "`git rm -r --cached node_modules` ausführen"
      - Mit `git status` prüfen, dass nur Löschungen aus dem Index vorgemerkt sind
      - Die Reparatur committen
      - Mit `git check-ignore -v node_modules` die Regel kontrollieren
---
Du hast ein Projekt angelegt, `npm install` ausgeführt und willst committen. `git status` zeigt dir
plötzlich 30 000 neue Dateien. Was ist passiert? Git weiß noch nicht, welche Dateien es ignorieren
soll. Genau dafür gibt es die [[gitignore|.gitignore]].

## Die Grundregel: Zutaten statt Ergebnis

Stell dir einen Kuchen vor. Du gibst deiner Freundin das **Rezept** weiter, nicht den gebackenen
Kuchen. Mit dem Rezept kann sie ihn jederzeit selbst backen.

Bei Projekten ist es genauso:

| Committen (Rezept) | Ignorieren (Kuchen) |
|---|---|
| `package.json`, `package-lock.json` | `node_modules/` |
| `composer.json`, `composer.lock` | `vendor/` |
| `src/`, `tsconfig.json` | `dist/`, `build/` |
| `.env.example` | `.env` |

> [!MERKSATZ]
> Was ein Werkzeug reproduzierbar erzeugen kann, wird **nicht** committet. Committet werden die
> Zutaten, aus denen es entsteht.

Eine Ausnahme bestätigt die Regel: Die `.env` wird nicht ignoriert, weil sie generiert ist, sondern
weil sie [[secret|Geheimnisse]] enthält.

## So funktioniert die .gitignore

Die `.gitignore` liegt in der [[projektwurzel|Projektwurzel]]. Jede Zeile ist ein
[[glob-muster|Glob-Muster]]. Zeilen mit `#` sind Kommentare.

```bash title=".gitignore eines Full-Stack-Projekts"
# Abhängigkeiten
node_modules/
vendor/

# Build-Ergebnisse
dist/

# Lokale Einstellungen und Geheimnisse
.env

# Logs
*.log
```

| Muster | Bedeutung |
|---|---|
| `dist/` | Ordner namens dist, egal wo |
| `/dist/` | nur der Ordner dist direkt in der Wurzel |
| `*.log` | alle Dateien mit Endung .log, in allen Ordnern |
| `!keep.log` | Ausnahme: diese Datei doch nicht ignorieren |

Eine `.gitignore` darf auch in Unterordnern liegen. Ihre Regeln gelten dann nur für diesen Ordner und
alles darunter. Dateien, die nur **dein** Rechner erzeugt – etwa `.DS_Store` von macOS oder `.idea/`
von PhpStorm –, trägst du besser in deine persönliche, globale Ignore-Datei ein (Git-Einstellung
`core.excludesFile`). So bleibt die Projekt-`.gitignore` frei von Einträgen, die nur eine Person betreffen.

> [!FEHLER]
> **Zu breite Muster.** `.env*` ignoriert `.env`, aber auch `.env.example` – die Vorlage, die alle im
> Team brauchen. Schreibe Muster so genau wie nötig: `.env` reicht.

## Prüfen statt raten: git check-ignore

Ob eine Regel greift, musst du nicht raten. `git check-ignore` sagt es dir – sogar für Dateien, die
es noch gar nicht gibt:

```bash title="Welche Regel ignoriert diese Dateien?"
git check-ignore -v .env node_modules/react/index.js
# .gitignore:9:.env	.env
# .gitignore:2:node_modules/	node_modules/react/index.js
```

Die Ausgabe nennt Datei, Zeilennummer und Muster. Wird eine Datei **nicht** ignoriert, gibt der
Befehl nichts aus und endet mit [[exit-code|Exit-Code]] 1. Mit `-q` (*quiet*) siehst du nur den
Exit-Code – praktisch für Skripte.

```bash
git check-ignore -q .env.example && echo ignoriert || echo wird-committet
# wird-committet
```

## Wenn es schon zu spät ist

Die `.gitignore` wirkt nur auf [[untracked-datei|unversionierte Dateien]]. Wurde ein Ordner bereits
committet, ignoriert Git die neue Regel für ihn. Du musst ihn erst aus dem Index nehmen:

```bash title="node_modules nachträglich aus Git entfernen"
echo "node_modules/" >> .gitignore
git rm -r --cached node_modules
git commit -m "chore: stop tracking node_modules"
```

`--cached` entfernt die Dateien nur aus der Versionskontrolle. Auf deiner Festplatte bleiben sie.

> [!ACHTUNG]
> Wurde eine `.env` mit echten Passwörtern committet, reicht das **nicht**. Das Geheimnis steht weiter
> in der Historie. Ändere sofort Passwort oder Token und behandle den alten Wert als öffentlich.

> [!PRAXIS]
> Erfinde deine `.gitignore` nicht neu. Frameworks wie Laravel und Vite bringen eine passende Datei
> mit, und GitHub pflegt Vorlagen für viele Sprachen. Ergänze nur, was dein Projekt zusätzlich braucht.

## Zusammenfassung

- Committe die Zutaten (Manifeste, Lockfiles, Quellcode), nicht das Ergebnis.
- `node_modules/`, `vendor/`, `dist/`, `.env` und Logs gehören in die `.gitignore`.
- Jede Zeile ist ein Muster; ein `/` am Ende meint einen Ordner, `!` macht eine Ausnahme.
- `git check-ignore -v` zeigt, welche Regel eine Datei ignoriert.
- Bereits committete Dateien entfernst du mit `git rm --cached`.
- Ein committetes Geheimnis gilt als verraten und muss ausgetauscht werden.
