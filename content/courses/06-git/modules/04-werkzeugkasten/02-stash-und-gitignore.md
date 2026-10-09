---
title: Stash und .gitignore
summary: Halbfertige Arbeit kurz beiseitelegen und festlegen, welche Dateien gar nicht erst ins Repository gehören.
duration: 25
sources:
  - title: Pro Git – Stashen und Bereinigen
    url: https://git-scm.com/book/de/v2/Git-Tools-Stashen-und-Bereinigen
  - title: git-stash Dokumentation
    url: https://git-scm.com/docs/git-stash
  - title: gitignore Dokumentation
    url: https://git-scm.com/docs/gitignore
  - title: GitHub Docs – Ignoring files
    url: https://docs.github.com/en/get-started/git-basics/ignoring-files
quiz:
  - type: single
    question: Du hast `form.html` geändert und eine neue Datei `validation.js` angelegt, die Git noch nie gesehen hat. Du tippst nur `git stash`. Was passiert mit `validation.js`?
    options:
      - Sie landet ebenfalls im Stash.
      - Sie bleibt im Arbeitsverzeichnis liegen, weil sie untracked ist.
      - Git löscht sie.
      - Git bricht mit einer Fehlermeldung ab.
    answer: 1
    explanation: >
      Ohne Option stasht Git nur Änderungen an Dateien, die es schon kennt. Untracked-Dateien bleiben
      liegen. Erst mit `git stash -u` (`--include-untracked`) wandern sie mit ins Zwischenlager.
  - type: match
    question: Ordne jedem Befehl seine Wirkung zu.
    pairs:
      - { left: "git stash pop", right: "Neuesten Stash anwenden und aus der Liste entfernen" }
      - { left: "git stash apply", right: "Neuesten Stash anwenden, Eintrag bleibt in der Liste" }
      - { left: "git stash drop", right: "Einen Stash löschen, ohne ihn anzuwenden" }
      - { left: "git stash list", right: "Alle gespeicherten Stashes anzeigen" }
    explanation: >
      `pop` ist „anwenden und wegwerfen“, `apply` nur „anwenden“. `drop` entfernt einen Eintrag,
      `list` zeigt dir den Stapel.
  - type: find-bug
    question: Diese `.gitignore` soll alle Logdateien ignorieren, außer `deploy.log`. Trotzdem wird `deploy.log` ignoriert. Welche Zeile ist schuld?
    language: bash
    code: |
      # Abhängigkeiten
      node_modules/
      !deploy.log
      *.log
      .env
    bug_line: 3
    explanation: >
      Muster werden von oben nach unten gelesen, das letzte passende gewinnt. Hier hebt `!deploy.log` zuerst
      etwas auf, das noch gar nicht ignoriert ist, und danach ignoriert `*.log` die Datei wieder. Die Ausnahme
      muss **nach** `*.log` stehen.
  - type: cloze
    text: Warum eine Datei ignoriert wird, zeigt `git check-ignore ___ debug.log`. Eine schon committete Datei nimmst du mit `git rm ___ debug.log` aus dem Index, ohne sie zu löschen.
    blanks:
      - [-v, --verbose]
      - [--cached]
    explanation: >
      `-v` nennt Datei, Zeilennummer und Muster, die zum Ignorieren geführt haben. `--cached` entfernt nur
      den Eintrag im Index – die Datei auf deiner Festplatte bleibt erhalten.
  - type: multiple
    question: Du hast versehentlich eine `.env` mit einem echten API-Schlüssel auf GitHub gepusht. Was musst du tun?
    options:
      - Den Schlüssel beim Anbieter sofort ungültig machen und einen neuen erzeugen.
      - "`git rm --cached .env`, `.env` in die `.gitignore` eintragen und committen."
      - Es reicht, die Datei im nächsten Commit zu löschen – dann ist der Schlüssel weg.
      - Den neuen Schlüssel nur noch lokal in `.env` speichern.
    answers: [0, 1, 3]
    explanation: >
      Was einmal gepusht ist, steht in der Historie und kann längst kopiert worden sein. Löschen hilft nicht –
      der Schlüssel muss rotiert werden. Danach sorgst du mit `.gitignore` und `git rm --cached` dafür, dass
      es nicht wieder passiert.
tasks:
  - id: ignorieren-aufraeumen
    type: terminal
    title: Ein verunglücktes Repository aufräumen
    description: |
      Im Ordner `gitignore-uebung` liegt ein kleines Node-Projekt. Beim ersten Commit wurde zu viel
      eingepackt: Die geheime `.env` und die Logdatei `debug.log` sind im Repository gelandet. Außerdem liegt
      ein Ordner `node_modules/` herum, der nie ins Repository soll.

      1. Lege eine `.gitignore` an, die `node_modules/`, `.env` und alle `*.log`-Dateien ignoriert.
      2. Nimm `.env` und `debug.log` aus dem Index – die Dateien sollen auf der Festplatte **bleiben**.
      3. Committe die `.gitignore` zusammen mit dem Entfernen. Danach meldet `git status` nichts mehr.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit das Repository angelegt wird.
    workdir: gitignore-uebung
    setup: |
      git init -q
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      printf '# Mini-Shop\n' > README.md
      printf 'console.log("Shop startet");\n' > app.js
      printf 'DB_PASSWORD=nur-ein-beispiel\nAPI_KEY=<dein-token>\n' > .env
      printf 'Server gestartet\n' > debug.log
      git add README.md app.js .env debug.log
      git commit -q -m "chore: initial commit"
      mkdir -p node_modules/left-pad
      printf 'module.exports = () => "";\n' > node_modules/left-pad/index.js
    checks:
      - type: file_exists
        path: .gitignore
        message: Es gibt noch keine .gitignore im Projektordner.
      - type: command
        run: git check-ignore -q node_modules/left-pad/index.js
        message: node_modules/ wird noch nicht ignoriert.
      - type: command
        run: git check-ignore -q --no-index .env
        message: .env steht noch nicht in der .gitignore.
      - type: command
        run: git check-ignore -q --no-index debug.log && git check-ignore -q --no-index logs/error.log
        message: Nicht alle .log-Dateien werden ignoriert – nutze ein Muster mit *.
      - type: command
        run: git ls-files .env debug.log | wc -l
        stdout_matches: "^\\s*0\\s*$"
        message: .env oder debug.log stehen noch im Index. Nimm sie mit git rm --cached heraus und committe.
      - type: file_exists
        path: .env
        message: .env wurde von der Festplatte gelöscht – sie soll nur aus dem Repository verschwinden.
      - type: file_exists
        path: debug.log
        message: debug.log wurde von der Festplatte gelöscht – sie soll nur aus dem Repository verschwinden.
      - type: command
        run: git ls-files .gitignore
        stdout_equals: .gitignore
        message: Die .gitignore ist noch nicht committet.
      - type: command
        run: git status --porcelain
        stdout_equals: ""
        message: git status meldet noch offene Änderungen – committe alles.
    hints:
      - Die `.gitignore` ist eine ganz normale Textdatei mit einem Muster pro Zeile.
      - "`git rm --cached .env debug.log` nimmt beide Dateien aus dem Index, ohne sie zu löschen."
      - "Danach `git add .gitignore` und ein Commit wie `chore: ignore env, logs and node_modules`."
    solution: |
      ```bash
      cd gitignore-uebung
      printf 'node_modules/\n.env\n*.log\n' > .gitignore
      git rm --cached .env debug.log
      git add .gitignore
      git commit -m "chore: ignore env, logs and node_modules"
      git status   # nothing to commit, working tree clean
      git check-ignore -v .env node_modules/left-pad/index.js
      ```
  - id: stash-szenario
    type: steps
    title: Was passiert als Nächstes?
    description: Spiel einen typischen Arbeitstag mit dem Stash durch.
    steps:
      - situation: >
          Du hast auf `feat/suche` drei Dateien geändert. Ein Kollege bittet dich, kurz seinen Branch
          `fix/login` auszuprobieren. Deine Änderungen kollidieren mit Dateien auf seinem Branch.
        question: Was passiert bei `git switch fix/login`?
        options:
          - Git wechselt und verwirft deine Änderungen.
          - Git bricht ab und meldet, dass deine lokalen Änderungen überschrieben würden.
          - Git committet deine Änderungen automatisch.
        answer: 1
        explanation: >
          Git schützt ungespeicherte Arbeit. Würde der Wechsel deine Änderungen überschreiben, bricht er ab.
          Genau hier hilft `git stash`.
      - situation: Du führst `git stash push -m "suche halbfertig"` aus und wechselst danach erfolgreich.
        question: Wo sind deine Änderungen jetzt?
        options:
          - Als Eintrag `stash@{0}` im lokalen Stash-Stapel.
          - Auf GitHub, damit sie nicht verloren gehen.
          - Als neuer Commit auf `feat/suche`.
        answer: 0
        explanation: >
          Der Stash ist ein lokaler Stapel. Der neueste Eintrag heißt `stash@{0}`. Er wird nie gepusht.
      - situation: >
          Zurück auf `feat/suche` führst du `git stash pop` aus. Git meldet einen Konflikt in `search.js`,
          weil du in der Zwischenzeit einen Commit gepullt hast, der dieselbe Zeile ändert.
        question: Was ist mit dem Stash-Eintrag passiert?
        options:
          - Er ist gelöscht, die Änderungen sind verloren.
          - Er bleibt in der Liste, bis du den Konflikt gelöst hast und ihn selbst mit `git stash drop` entfernst.
          - Git hat ihn in einen Branch umgewandelt.
        answer: 1
        explanation: >
          Bei einem Konflikt entfernt `pop` den Eintrag bewusst nicht – zur Sicherheit. Du löst den Konflikt,
          prüfst das Ergebnis und räumst dann mit `git stash drop` auf.
      - situation: Zwei Wochen später zeigt `git stash list` sieben Einträge namens „WIP on main“.
        question: Was ist der beste nächste Schritt?
        options:
          - Alle blind mit `git stash clear` löschen.
          - Mit `git stash show -p stash@{n}` reinschauen, Wichtiges in einen Branch retten, den Rest gezielt droppen.
          - Alle nacheinander mit `pop` anwenden.
        answer: 1
        explanation: >
          Vergessene Stashes sind ein typisches Problem. Erst ansehen, dann entscheiden. Wichtige Arbeit gehört
          in einen Branch (`git stash branch <name> stash@{n}`), nicht dauerhaft in den Stash.
---

Zwei Alltagsprobleme, ein gemeinsames Thema: Was soll gerade **nicht** in einen Commit? Manchmal ist es
halbfertige Arbeit, die du nur kurz beiseitelegen willst – dafür gibt es den [[stash|Stash]]. Manchmal sind
es Dateien, die nie ins Repository gehören, etwa Logs oder Passwörter – dafür gibt es die
[[gitignore|.gitignore]].

## Arbeit parken mit git stash

Du baust gerade ein Formular um, nichts ist fertig. Da kommt die Bitte: Auf `main` ist ein Tippfehler, bitte
sofort beheben. Committen willst du den halben Zustand nicht, wegwerfen erst recht nicht.

Stell dir einen Schreibtisch vor: Du räumst das halb gebaute Modell in eine Kiste, stellst sie ins Regal und
hast den Tisch frei. Genau das macht `git stash`. Es nimmt alle Änderungen aus
[[arbeitsverzeichnis|Arbeitsverzeichnis]] und [[staging-bereich|Staging-Bereich]], legt sie auf einen
Stapel und setzt die Dateien auf den letzten [[commit]] zurück. Danach kannst du gefahrlos den
[[branch]] wechseln.

```bash title="Hotfix zwischendurch"
git stash push -m "formular halbfertig"   # alles parken
git switch main                           # Arbeitsverzeichnis ist sauber
git commit -am "fix: correct typo in welcome headline"
git switch feat/formular                  # zurück zur eigentlichen Arbeit
git stash pop                             # weitermachen, wo du warst
```

| Befehl | Wirkung |
|---|---|
| `git stash push -m "…"` | Änderungen parken, mit Beschreibung |
| `git stash list` | Stapel anzeigen, neuester Eintrag ist `stash@{0}` |
| `git stash pop` | neuesten Eintrag anwenden **und** entfernen |
| `git stash apply` | Eintrag anwenden, er bleibt aber liegen |
| `git stash drop` | Eintrag löschen |

> [!MERKSATZ]
> `pop` heißt „anwenden und wegwerfen“, `apply` heißt „nur anwenden“. Im Zweifel nimmst du `apply` und
> löschst den Eintrag erst mit `drop`, wenn alles passt.

## Neue Dateien, Konflikte und Grenzen

Standardmäßig stasht Git nur Dateien, die es schon verfolgt. Eine brandneue
[[untracked-datei|untracked Datei]] bleibt liegen und wandert beim Branch-Wechsel einfach mit.

```bash title="Auch neue Dateien parken"
git stash push -u -m "formular inkl. validation.js"
```

> [!FEHLER]
> **„Ich habe gestasht, aber meine neue Datei ist auf `main` gelandet!“** Du hast `git stash` ohne `-u`
> benutzt. Prüfe nach dem Stashen mit `git status`, ob wirklich alles sauber ist.

Hat sich eine Datei inzwischen an derselben Stelle geändert, entsteht beim `pop` ein
[[merge-konflikt|Merge-Konflikt]]. Dann **entfernt `pop` den Eintrag nicht** – zur Sicherheit. Du löst den
Konflikt und räumst danach selbst mit `git stash drop` auf.

Zwei Grenzen solltest du kennen:

- Der Stash ist **nur lokal** und wird nie gepusht.
- Er ist für **kurze** Pausen gedacht. Arbeit, die länger als einen Tag liegt, gehört in einen Branch mit
  Commit – sonst sammeln sich namenlose Einträge wie „WIP on main“.

## Was nicht ins Repository gehört

Ein [[repository|Repository]] enthält den Quelltext – alles, was Menschen geschrieben haben und was andere
brauchen, um das Projekt nachzubauen. Vieles im Projektordner gehört nicht dazu:

| Art | Beispiele | Warum nicht? |
|---|---|---|
| [[abhaengigkeit|Abhängigkeiten]] | `node_modules/`, `vendor/` | riesig, `npm install` / `composer install` erzeugt sie neu |
| Build-Ergebnisse und Logs | `public/build/`, `*.log` | entstehen automatisch, ändern sich ständig |
| Geheimnisse | `.env` ([[env-datei]]) | Passwörter haben im Repository nichts verloren |
| Persönliches | `.idea/`, `.DS_Store` | gehört zu deinem Rechner, nicht zum Projekt |

[[lockfile|Lockfiles]] wie `composer.lock` gehören dagegen **ins** Repository, damit alle dieselben Versionen
installieren.

Die `.gitignore` ist eine Textdatei mit einem [[glob-muster|Glob-Muster]] pro Zeile:

| Muster | Bedeutung |
|---|---|
| `*.log` | alle `.log`-Dateien, in jedem Ordner |
| `build/` | nur Ordner namens `build` |
| `/todo.txt` | nur im Ordner der `.gitignore`, nicht in Unterordnern |
| `docs/**/*.pdf` | `**` steht für beliebig viele Ordnerebenen |
| `!.env.example` | Ausnahme: wieder **nicht** ignorieren |

```gitignore title=".gitignore für ein Laravel-Projekt"
/vendor/
node_modules/
.env
.env.*
!.env.example
*.log
```

Die Regeln werden von oben nach unten gelesen, **das letzte passende Muster gewinnt**. Ausnahmen mit `!`
stehen deshalb unter dem Muster, das sie aufheben.

> [!PRAXIS]
> Fast jedes Framework bringt eine passende `.gitignore` mit, und GitHub bietet Vorlagen beim Anlegen eines
> Repositorys. Welche Regel eine Datei ignoriert, verrät `git check-ignore -v datei`.

## Schon committet? Wieder herausholen

Die `.gitignore` wirkt nur auf Dateien, die Git **noch nicht verfolgt**. Ist `.env` schon in einem Commit,
ändert ein neuer Eintrag nichts. Du nimmst die Datei erst aus dem Index:

```bash title="Aus dem Repository entfernen, aber auf der Festplatte behalten"
printf '.env\n*.log\n' >> .gitignore
git rm --cached .env debug.log
git add .gitignore
git commit -m "chore: stop tracking env and log files"
```

`--cached` ist entscheidend: Ohne die Option löscht `git rm` die Dateien auch von der Festplatte. Für Ordner
brauchst du zusätzlich `-r`.

> [!ACHTUNG]
> War ein Passwort oder Token in einem gepushten Commit, ist es **kompromittiert**. Löschen hilft nicht, denn
> der alte Commit steht weiter in der Historie. Mache den Schlüssel beim Anbieter sofort ungültig, erzeuge
> einen neuen – und räume erst danach das Repository auf.

## Zusammenfassung

- `git stash push -m "…"` parkt Änderungen, `-u` nimmt auch untracked Dateien mit.
- `pop` wendet an und entfernt, `apply` wendet nur an, `drop` löscht; bei Konflikten bleibt der Eintrag erhalten.
- Der Stash ist lokal und für kurze Pausen gedacht.
- In die `.gitignore` gehören Abhängigkeiten, Build-Ergebnisse, Logs, Geheimnisse und persönliche Dateien.
- Muster: `*`, `**`, `/` am Ende für Ordner, `/` am Anfang für den Stamm, `!` für Ausnahmen – das letzte passende gewinnt.
- Schon getrackte Dateien entfernst du mit `git rm --cached`; ein geleaktes Geheimnis musst du rotieren.
