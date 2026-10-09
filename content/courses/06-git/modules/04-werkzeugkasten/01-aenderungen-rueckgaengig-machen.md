---
title: Änderungen rückgängig machen
summary: Ein Entscheidungsleitfaden – welcher Befehl macht welchen Fehler rückgängig, und wie du sogar „verlorene“ Commits zurückholst.
duration: 25
sources:
  - title: Pro Git – Ungewollte Änderungen rückgängig machen
    url: https://git-scm.com/book/de/v2/Git-Grundlagen-Ungewollte-%C3%84nderungen-r%C3%BCckg%C3%A4ngig-machen
  - title: Pro Git – Reset entzaubert
    url: https://git-scm.com/book/de/v2/Git-Tools-Reset-entzaubert
  - title: git-reset Dokumentation
    url: https://git-scm.com/docs/git-reset
  - title: git-revert Dokumentation
    url: https://git-scm.com/docs/git-revert
quiz:
  - type: single
    question: Ein fehlerhafter Commit liegt schon auf GitHub, und dein Team hat ihn bereits gepullt. Wie machst du ihn rückgängig?
    options:
      - "`git reset --hard HEAD~1` und danach `git push --force`"
      - "`git revert <hash>` und danach ein normales `git push`"
      - "`git commit --amend`"
      - "`git restore .`"
    answer: 1
    explanation: >
      Geteilte Historie schreibst du nicht um. `git revert` erzeugt einen neuen Commit, der die Änderung
      umkehrt – alle anderen bekommen ihn mit einem normalen Pull. Ein Reset mit Force-Push würde die
      Historie deiner Kolleg:innen durcheinanderbringen.
  - type: match
    question: Ordne jedem Reset-Modus zu, was nach `git reset <modus> HEAD~1` mit den Änderungen des entfernten Commits passiert.
    pairs:
      - { left: "--soft", right: "Sie liegen weiter im Staging-Bereich." }
      - { left: "--mixed", right: "Sie stehen nur noch in den Dateien, nicht mehr vorgemerkt." }
      - { left: "--hard", right: "Sie sind aus Staging-Bereich und Dateien verschwunden." }
    explanation: >
      Alle drei Modi verschieben den Branch-Zeiger. `--soft` hört danach auf, `--mixed` setzt zusätzlich
      den Staging-Bereich zurück, `--hard` außerdem das Arbeitsverzeichnis.
  - type: cloze
    text: Commits, die nach einem Reset in keinem Branch mehr auftauchen, findest du mit `git ___` wieder. Mit `git ___ rettung <hash>` hängst du ihnen einen neuen Branch an.
    blanks:
      - [reflog]
      - [branch]
    explanation: >
      Der Reflog protokolliert jede Bewegung von HEAD. Mit dem Hash daraus legst du per `git branch rettung <hash>`
      einen Branch an – damit ist der Commit wieder sicher erreichbar.
  - type: find-bug
    question: Ada wollte nur die Datei `config.php` aus dem Staging-Bereich nehmen, ihre Änderung aber behalten. Danach ist die Änderung weg. In welcher Zeile liegt der Fehler?
    language: bash
    code: |
      git status
      git add config.php
      git restore config.php
      git status
    bug_line: 3
    explanation: >
      `git restore config.php` ohne `--staged` überschreibt die Datei im Arbeitsverzeichnis. Richtig wäre
      `git restore --staged config.php`: Das nimmt nur die Vormerkung zurück und lässt die Datei in Ruhe.
  - type: multiple
    question: Welche Befehle verändern **keine** bestehenden Commits, sind also auch nach einem Push unbedenklich?
    options:
      - "`git revert <hash>`"
      - "`git commit --amend`"
      - "`git restore --staged datei.txt`"
      - "`git reset --hard HEAD~2`"
    answers: [0, 2]
    explanation: >
      `revert` fügt einen neuen Commit hinzu, `restore --staged` arbeitet nur im Staging-Bereich. `--amend`
      ersetzt den letzten Commit durch einen neuen, und `reset` verschiebt den Branch – beides schreibt Historie um.
tasks:
  - id: werkzeug-waehlen
    type: dragdrop
    title: Welcher Befehl passt zu welcher Situation?
    description: >
      Für jede Panne gibt es genau ein passendes Werkzeug. Ziehe jede Situation auf den Befehl, mit dem du sie
      am sichersten löst.
    targets:
      - { id: restore, label: "git restore <datei>" }
      - { id: unstage, label: "git restore --staged <datei>" }
      - { id: amend, label: "git commit --amend" }
      - { id: soft, label: "git reset --soft HEAD~1" }
      - { id: revert, label: "git revert <hash>" }
      - { id: reflog, label: "git reflog" }
    items:
      - { label: "Du hast in style.css herumprobiert und willst zurück zum letzten Commit.", target: restore }
      - { label: "Du hast versehentlich debug.log mit git add vorgemerkt.", target: unstage }
      - { label: "Im letzten, noch nicht gepushten Commit fehlt eine Datei.", target: amend }
      - { label: "Du willst die letzten beiden lokalen Commits zu einem neuen Commit zusammenfassen – die Änderungen sollen vorgemerkt bleiben.", target: soft }
      - { label: "Ein Bug-Commit ist schon auf GitHub und bei allen im Team angekommen.", target: revert }
      - { label: "Nach einem git reset --hard fehlt ein Commit, und du suchst seinen Hash.", target: reflog }
    hints:
      - Frag dich zuerst, ob schon ein Commit existiert und ob er bereits geteilt wurde.
      - Für zwei Commits brauchst du `HEAD~2` – das Werkzeug bleibt aber dasselbe.
  - id: rueckgaengig-im-team
    type: terminal
    title: Revert im Team und ein geretteter Commit
    description: |
      Im Ordner `rueckgaengig` liegt ein Shop-Projekt. Zwei Dinge sind schiefgelaufen:

      - Der Commit **„feat: add debug output“** wurde schon gepusht und von allen gepullt. Er hat eine
        Datei `debug.js` und eine Debug-Zeile in `app.js` eingebaut, die wieder weg sollen.
      - Du hast gerade aus Versehen `git reset --hard HEAD~1` ausgeführt. Dabei ist dein neuester Commit
        **„docs: add faq“** (mit der Datei `FAQ.md`) aus `main` verschwunden.

      So gehst du vor:

      1. Finde den verlorenen Commit mit `git reflog` und hole ihn nach `main` zurück.
      2. Mache „feat: add debug output“ mit `git revert` rückgängig – **ohne** die Historie umzuschreiben.
      3. Am Ende ist das Arbeitsverzeichnis sauber (`git status` meldet nichts mehr).

      Klicke zuerst auf **Aufgabe vorbereiten**, damit das Repository angelegt wird.
    workdir: rueckgaengig
    setup: |
      git init -q
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      printf '# Mini-Shop\n' > README.md
      git add README.md
      git commit -q -m "chore: initial commit"
      printf 'function start() {\n  return "Shop gestartet";\n}\n' > app.js
      git add app.js
      git commit -q -m "feat: add start function"
      printf 'console.log("DEBUG", new Date());\n' > debug.js
      printf 'console.log("DEBUG start");\n' >> app.js
      git add debug.js app.js
      git commit -q -m "feat: add debug output"
      printf '<footer>Mini-Shop</footer>\n' > footer.html
      git add footer.html
      git commit -q -m "feat: add footer"
      printf '# FAQ\n\nWie lange dauert der Versand? Zwei Werktage.\n' > FAQ.md
      git add FAQ.md
      git commit -q -m "docs: add faq"
      git reset -q --hard HEAD~1
    checks:
      - type: command
        run: |-
          git log main --format=%s | grep -c "^docs: add faq$"
        stdout_matches: "^\\s*1\\s*$"
        message: "Der Commit „docs: add faq“ ist noch nicht wieder in main. Such ihn mit git reflog."
      - type: file_exists
        path: FAQ.md
        message: FAQ.md fehlt noch im Arbeitsverzeichnis.
      - type: command
        run: |-
          git log main --format=%s | grep -q '^Revert "feat: add debug output"'
        message: "Es gibt noch keinen Revert-Commit für „feat: add debug output“."
      - type: file_absent
        path: debug.js
        message: debug.js ist noch da – der Revert ist noch nicht vollständig.
      - type: command
        run: grep -c DEBUG app.js
        expect_exit: 1
        message: In app.js steht noch die Debug-Zeile.
      - type: command
        run: |-
          git log main --format=%s | grep -c "^feat: add debug output$"
        stdout_matches: "^\\s*1\\s*$"
        message: Der ursprüngliche Debug-Commit muss in der Historie bleiben – nutze revert statt reset.
      - type: command
        run: git status --porcelain
        stdout_equals: ""
        message: Im Arbeitsverzeichnis gibt es noch ungespeicherte Änderungen.
    hints:
      - "`git reflog` listet jede Bewegung von HEAD. Der Eintrag „commit: docs: add faq“ verrät dir den Hash."
      - "Mach die Rettung zuerst: Solange du noch nichts Neues committet hast, bringt `git reset --hard <hash>` main zurück auf den FAQ-Commit. Hast du schon revertiert, nimm stattdessen `git merge <hash>` oder `git cherry-pick <hash>`."
      - "Den Hash des Debug-Commits zeigt `git log --oneline`. `git revert --no-edit <hash>` übernimmt die vorgeschlagene Nachricht ohne Editor."
    solution: |
      ```bash
      cd rueckgaengig
      git reflog                    # Eintrag "commit: docs: add faq" suchen
      git reset --hard <faq-hash>   # main zeigt wieder auf den FAQ-Commit
      git log --oneline             # Hash von "feat: add debug output" ablesen
      git revert --no-edit <debug-hash>
      git log --oneline             # Revert-Commit steht oben
      git status                    # nothing to commit, working tree clean
      ```
---

Jeder macht Fehler – auch mit Git. Mal hast du eine Datei kaputtgespielt, mal das Falsche vorgemerkt,
mal einen Commit mit Tippfehler abgeschickt oder sogar einen fehlerhaften Commit schon mit dem Team geteilt.
Git kann fast alles rückgängig machen – aber der falsche Befehl richtet mehr Schaden an als der Fehler selbst.
Diese Lektion ist deshalb ein **Entscheidungsleitfaden**.

## Die wichtigste Frage zuerst: Wo steckt der Fehler?

Erinnere dich an die drei Bereiche: [[arbeitsverzeichnis|Arbeitsverzeichnis]], [[staging-bereich|Staging-Bereich]]
und [[repository|Repository]]. Bevor du irgendetwas rückgängig machst, beantwortest du zwei Fragen:

1. **In welchem Bereich** liegt der Fehler? Nur in einer Datei, schon vorgemerkt oder schon in einem [[commit]]?
2. **Ist der Commit schon geteilt?** Also per [[push]] auf einem Server wie [[github|GitHub]], von dem andere ihn bereits geholt haben?

Daraus ergibt sich das passende Werkzeug:

| Situation | Befehl | Verändert Historie? |
|---|---|---|
| Datei geändert, Änderung soll weg | `git restore datei` | nein |
| Datei vorgemerkt, soll nicht in den Commit | `git restore --staged datei` | nein |
| Letzter Commit falsch, noch nicht gepusht | `git commit --amend` | ja |
| Lokale Commits wieder auflösen | `git reset --soft/--mixed/--hard HEAD~1` | ja |
| Commit schon geteilt | `git revert <hash>` | nein (neuer Commit) |
| Commit „verloren“ | `git reflog` + `git branch` oder `git reset` | – |

Stell dir die Historie wie ein gemeinsames Klassenbuch vor. Solange die Seite nur bei dir liegt, darfst du
radieren. Sobald alle sie abgeschrieben haben, radierst du nicht mehr – du schreibst eine Korrektur darunter.

## Dateien und Vormerkungen zurücknehmen

Der harmloseste Fall: Du hast in einer [[datei]] herumprobiert und willst zurück zum letzten gespeicherten Stand.

```bash title="Änderung im Arbeitsverzeichnis verwerfen"
git restore style.css
```

Git holt die Datei aus dem Staging-Bereich zurück, der normalerweise dem letzten Commit entspricht. Hast du
die Datei schon mit `git add` vorgemerkt, nimmst du erst die Vormerkung zurück:

```bash title="Vormerkung zurücknehmen – die Datei bleibt, wie sie ist"
git restore --staged style.css
```

Ältere Anleitungen nutzen dafür `git checkout -- datei` oder `git reset HEAD datei` – das funktioniert
noch, `git restore` ist aber eindeutiger.

> [!ACHTUNG]
> `git restore datei` (ohne `--staged`) löscht deine ungespeicherten Änderungen endgültig. Was nie
> vorgemerkt oder committet war, kennt Git nicht – auch der Reflog hilft hier nicht.

### Den letzten Commit reparieren: amend

Du hast committet und merkst sofort: Tippfehler in der Nachricht, oder eine Datei fehlt. Solange der Commit
**nur bei dir** liegt, reparierst du ihn mit [[amend|`--amend`]]:

```bash title="Vergessene Datei nachreichen"
git add vergessen.css
git commit --amend --no-edit
```

```bash title="Nur die Nachricht korrigieren"
git commit --amend -m "fix: correct price rounding"
```

Wichtig zu verstehen: `--amend` ändert den alten Commit nicht, sondern **ersetzt** ihn durch einen neuen mit
anderem [[commit-hash|Hash]]. Für dich sieht es aus wie eine Reparatur, für Git ist es ein Austausch.

## Commits lokal auflösen: reset und seine drei Modi

Mit [[reset|`git reset`]] schiebst du den aktuellen [[branch|Branch]] auf einen älteren Commit zurück. Die
Commits danach gehören dann nicht mehr zum Branch. Die drei Modi unterscheiden sich darin, wie viele der drei
Bereiche Git zusätzlich zurücksetzt:

![Was die Reset-Modi soft, mixed und hard jeweils zurücksetzen](/assets/git/reset-modi.svg)

| Modus | Branch-Zeiger | Staging-Bereich | Arbeitsverzeichnis | Typischer Einsatz |
|---|---|---|---|---|
| `--soft` | zurück | bleibt | bleibt | Commits neu zusammenfassen |
| `--mixed` (Standard) | zurück | zurück | bleibt | Neu vormerken und sauberer committen |
| `--hard` | zurück | zurück | zurück | Alles wegwerfen |

```bash title="Letzten Commit auflösen, Änderungen bleiben vorgemerkt"
git reset --soft HEAD~1
```

```bash title="Letzten Commit samt Änderungen wegwerfen"
git reset --hard HEAD~1
```

Mit `git reset --soft HEAD~3` machst du so aus drei „wip“-Commits einen einzigen sauberen Commit.

> [!MERKSATZ]
> `reset` schreibt Historie um. Nutze es nur für Commits, die **noch nicht gepusht** sind. Für alles, was
> andere schon haben, ist `revert` das richtige Werkzeug.

## Geteilte Commits umkehren: revert

Angenommen, der Commit „feat: add debug output“ ist längst auf GitHub, und drei Kolleg:innen haben ihn
gepullt. Würdest du ihn per Reset entfernen, müsstest du per [[force-push|Force-Push]] die Historie auf dem
Server überschreiben. Bei allen anderen passt die eigene Historie dann nicht mehr zum Server – Chaos.

[[revert|`git revert`]] löst das elegant: Es erzeugt einen **neuen** Commit, der genau das Gegenteil des
alten tut. Hinzugefügte Zeilen werden entfernt, entfernte Zeilen kommen zurück.

```bash title="Einen geteilten Commit rückgängig machen"
git log --oneline
git revert --no-edit 3f2a9c1
git push
```

Ohne `--no-edit` öffnet Git deinen [[editor|Editor]] mit der Nachricht `Revert "feat: add debug output"`.
Die Historie wird länger, nicht kürzer – jeder sieht, dass etwas ein- und wieder ausgebaut wurde.

> [!PRAXIS]
> In Teams mit geschützten Branches ist `revert` oft der einzige erlaubte Weg, Fehler auf `main` zu
> beheben, denn Force-Pushes sind dort gesperrt. Wenn ein Deployment kaputtgeht, ist ein Revert-Commit per
> [[pull-request|Pull Request]] meist die schnellste saubere Rückabwicklung.

## Verlorene Commits zurückholen: der Reflog

Was passiert mit einem Commit, den du per `git reset --hard` „weggeworfen“ hast? Er ist nicht sofort gelöscht.
Git führt ein lokales Tagebuch, den [[reflog|Reflog]]. Dort steht jede Bewegung von [[head|HEAD]]: jeder
Commit, jeder Branch-Wechsel, jeder Reset.

```text title="git reflog"
a1b2c3d HEAD@{0}: reset: moving to HEAD~1
9f8e7d6 HEAD@{1}: commit: docs: add faq
a1b2c3d HEAD@{2}: commit: feat: add footer
```

Der Commit `9f8e7d6` ist noch da – nur zeigt kein Branch mehr auf ihn. Du hast zwei Möglichkeiten, ihn zu retten:

```bash title="Variante 1: Branch zurück auf den Commit setzen"
git reset --hard 9f8e7d6
```

```bash title="Variante 2: Einen neuen Branch daran hängen – nichts geht verloren"
git branch rettung 9f8e7d6
```

Variante 2 ist vorsichtiger: Sie lässt deinen Branch in Ruhe und macht den Commit nur wieder erreichbar.

> [!FEHLER]
> **„Ich mache erst noch schnell einen Revert und rette den Commit danach per `reset --hard`.“** Ein
> `reset --hard` auf den alten Hash wirft dann alles weg, was du seitdem committet hast – also auch deinen
> Revert. Rette zuerst, oder übernimm den geretteten Commit mit `git merge` beziehungsweise `git cherry-pick`.

Zwei Grenzen: Der Reflog ist **nur lokal**, und Git räumt nicht erreichbare Commits standardmäßig nach
etwa 30 Tagen auf. Für „gestern“ ist er ein zuverlässiges Sicherheitsnetz, für „letztes Jahr“ nicht.

## Zusammenfassung

- Erst fragen: In welchem Bereich liegt der Fehler, und ist der Commit schon geteilt?
- `git restore datei` verwirft Änderungen, `git restore --staged datei` nimmt nur die Vormerkung zurück.
- `git commit --amend` ersetzt den letzten, noch nicht gepushten Commit.
- `git reset --soft/--mixed/--hard` schiebt den Branch zurück und setzt dabei einen, zwei oder alle drei Bereiche zurück.
- Geteilte Commits kehrst du mit `git revert` um – das fügt einen neuen Commit hinzu, statt Historie umzuschreiben.
- Scheinbar verlorene Commits findest du mit `git reflog` und rettest sie mit `git branch rettung <hash>` oder `git reset --hard <hash>`.
