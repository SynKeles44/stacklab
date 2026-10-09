---
title: Mergen und Konflikte lösen
summary: Wie git merge zwei Entwicklungslinien zusammenführt – per Fast-Forward oder mit einem Merge-Commit – und wie du einen Merge-Konflikt liest, löst oder abbrichst.
duration: 25
sources:
  - title: Pro Git (deutsch) – Einfaches Branching und Merging
    url: https://git-scm.com/book/de/v2/Git-Branching-Einfaches-Branching-und-Merging
  - title: git-merge Dokumentation
    url: https://git-scm.com/docs/git-merge
  - title: git-restore Dokumentation (--ours / --theirs)
    url: https://git-scm.com/docs/git-restore
  - title: GitHub Docs – Merge-Konflikte über die Befehlszeile lösen
    url: https://docs.github.com/de/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/resolving-a-merge-conflict-using-the-command-line
quiz:
  - type: single
    question: Du stehst auf `main` und tippst `git merge feat/login`. Wohin werden die Änderungen übernommen?
    options:
      - In den Branch feat/login
      - In den Branch main – also dorthin, wo HEAD gerade steht
      - In einen neuen Branch namens merge
      - In beide Branches gleichzeitig
    answer: 1
    explanation: >
      git merge holt den genannten Branch immer in den **aktuellen** Branch. feat/login selbst bleibt
      unverändert. Deshalb wechselst du vor dem Mergen auf den Ziel-Branch.
  - type: multiple
    question: In welchen Situationen ist ein Fast-Forward möglich?
    options:
      - main hat seit dem Abzweigen von feature keinen neuen Commit bekommen.
      - Auf main und auf feature sind seit dem Abzweigen neue Commits entstanden.
      - feature enthält alle Commits von main plus eigene neue Commits.
      - feature wurde von einem älteren Commit abgezweigt und main ist seitdem weitergewachsen.
    answers: [0, 2]
    explanation: >
      Fast-Forward heißt: main liegt direkt auf der Linie von feature und muss nur nach vorne geschoben
      werden. Sobald main eigene neue Commits hat, laufen die Linien auseinander – dann braucht es einen
      Merge-Commit.
  - type: cloze
    text: "Ein Merge-Commit hat genau ___ Parents. Den letzten gemeinsamen Vorfahren zweier Branches nennt man ___."
    blanks:
      - ["2", zwei]
      - [Merge-Basis, Merge-Base, merge base, Mergebasis]
    explanation: >
      Der Merge-Commit verweist auf die Spitzen beider Branches. Die Merge-Basis ist der Commit, an dem sie
      sich getrennt haben – Git vergleicht beide Seiten mit ihr (Three-Way-Merge).
  - type: match
    question: Ordne jedem Befehl seine Wirkung zu.
    pairs:
      - { left: "git merge --no-ff feat/x", right: "Immer einen Merge-Commit erzeugen" }
      - { left: "git merge --ff-only feat/x", right: "Nur Fast-Forward, sonst abbrechen" }
      - { left: "git add preise.txt", right: "Markiert den Konflikt in der Datei als gelöst" }
      - { left: "git merge --abort", right: "Bricht den Merge ab und stellt den Stand davor wieder her" }
      - { left: "git restore --ours preise.txt", right: "Übernimmt komplett die Version des aktuellen Branches" }
    explanation: >
      --no-ff und --ff-only legen fest, wie gemergt wird. Im Konflikt markierst du gelöste Dateien mit
      git add; wenn alles schiefgeht, bringt --abort dich zurück an den Start.
  - type: find-bug
    question: Ada hat einen Konflikt in `style.css` „gelöst“ und committet. Danach ist die Seite kaputt. In welcher Zeile steckt der Fehler?
    language: css
    code: |
      .button {
        color: white;
        background: #22d3ee;
      =======
        border-radius: 8px;
      }
    bug_line: 4
    explanation: >
      Die Zeile `=======` ist ein übrig gebliebener Konfliktmarker. Beim Lösen müssen alle drei Markerzeilen
      (`<<<<<<<`, `=======`, `>>>>>>>`) verschwinden. Prüfe vor dem Commit mit `git diff` oder einer Suche
      nach `=======`, ob noch Marker übrig sind.
tasks:
  - id: konflikt-loesen
    type: terminal
    title: Den Rabatt-Konflikt lösen
    description: |
      Im Ordner `konflikt-loesen` liegt eine Preisliste `preise.txt`. Auf `main` wurde die Zeile
      `Rabatt: keiner` zu `Rabatt: 5 % am Montag` geändert, auf `feat/rabatt` zu
      `Rabatt: 10 % mit Kundenkarte`. Der Merge von `feat/rabatt` in `main` wurde schon gestartet –
      und steckt im Konflikt fest.

      1. Schau dir mit `git status` und `cat preise.txt` an, was los ist.
      2. Löse den Konflikt so, dass **beide** Rabatte erhalten bleiben – in dieser Reihenfolge:
         ```text
         Rabatt: 5 % am Montag
         Rabatt: 10 % mit Kundenkarte
         ```
         Alle anderen Zeilen bleiben unverändert, alle Konfliktmarker verschwinden.
      3. Markiere die Datei als gelöst und schließe den Merge mit einem Commit ab.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit das Repository samt Konflikt angelegt wird.
    workdir: konflikt-loesen
    setup: |
      git init -q
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      printf 'Preisliste\nKaffee: 3,00 EUR\nTee: 2,50 EUR\nRabatt: keiner\n' > preise.txt
      git add preise.txt
      git commit -q -m "feat: add price list"
      git switch -q -c feat/rabatt
      printf 'Preisliste\nKaffee: 3,00 EUR\nTee: 2,50 EUR\nRabatt: 10 %% mit Kundenkarte\n' > preise.txt
      git commit -q -am "feat: add loyalty card discount"
      git switch -q main
      printf 'Preisliste\nKaffee: 3,00 EUR\nTee: 2,50 EUR\nRabatt: 5 %% am Montag\n' > preise.txt
      git commit -q -am "feat: add monday discount"
      git merge feat/rabatt > /dev/null 2>&1 || true
    checks:
      - type: command
        run: grep -qE '^(<<<<<<<|=======|>>>>>>>)' preise.txt
        expect_exit: 1
        message: In preise.txt stehen noch Konfliktmarker (<<<<<<<, ======= oder >>>>>>>). Entferne alle drei Markerzeilen.
      - type: command
        run: "grep -qxF 'Rabatt: 5 % am Montag' preise.txt && grep -qxF 'Rabatt: 10 % mit Kundenkarte' preise.txt"
        message: "preise.txt muss beide Zeilen enthalten – „Rabatt: 5 % am Montag“ und „Rabatt: 10 % mit Kundenkarte“."
      - type: command
        run: grep -c '^Rabatt:' preise.txt
        stdout_matches: "^\\s*2\\s*$"
        message: "Es sollten genau zwei Rabatt-Zeilen übrig bleiben (die Zeile „Rabatt: keiner“ gehört nicht mehr dazu)."
      - type: command
        run: "grep -qxF 'Kaffee: 3,00 EUR' preise.txt && grep -qxF 'Tee: 2,50 EUR' preise.txt"
        message: Die Zeilen für Kaffee und Tee sollen unverändert bleiben.
      - type: command
        run: test ! -f .git/MERGE_HEAD
        message: Der Merge ist noch nicht abgeschlossen. Markiere die Datei mit git add als gelöst und committe.
      - type: command
        run: git rev-list --parents -n 1 HEAD | wc -w
        stdout_matches: "^\\s*3\\s*$"
        message: Der letzte Commit sollte ein Merge-Commit mit zwei Parents sein – hast du den Merge vielleicht abgebrochen? Dann klicke auf Aufgabe vorbereiten und starte neu.
      - type: command
        run: git status --porcelain | wc -l
        stdout_matches: "^\\s*0\\s*$"
        message: Es gibt noch nicht committete Änderungen. Ist der gelöste Stand vollständig im Merge-Commit?
    hints:
      - "`git status` zeigt preise.txt unter „Unmerged paths“ als „both modified“. Öffne die Datei mit `nano preise.txt`."
      - "Lösche die Zeilen `<<<<<<< HEAD`, `=======` und `>>>>>>> feat/rabatt` und lass beide Rabatt-Zeilen untereinander stehen."
      - "Danach: `git add preise.txt` und `git commit --no-edit` (übernimmt die vorbereitete Merge-Nachricht)."
    solution: |
      ```bash
      cd konflikt-loesen
      git status                 # both modified: preise.txt
      cat preise.txt             # Konfliktmarker ansehen
      # Datei im Editor bereinigen – oder direkt neu schreiben:
      printf 'Preisliste\nKaffee: 3,00 EUR\nTee: 2,50 EUR\nRabatt: 5 %% am Montag\nRabatt: 10 %% mit Kundenkarte\n' > preise.txt
      grep -nE '^(<<<<<<<|=======|>>>>>>>)' preise.txt   # keine Ausgabe = keine Marker mehr
      git add preise.txt
      git commit --no-edit
      git log --graph --oneline
      ```
  - id: ff-oder-merge
    type: dragdrop
    title: Fast-Forward oder Merge-Commit?
    description: >
      Du stehst jeweils auf `main` und tippst `git merge feature` (ohne weitere Optionen). Ordne jede
      Situation dem Ergebnis zu.
    targets:
      - { id: ff, label: Fast-Forward – nur der Zeiger wandert }
      - { id: merge, label: Merge-Commit mit zwei Parents }
      - { id: nichts, label: Nichts zu tun – „Already up to date.“ }
    items:
      - { label: "main hat keinen neuen Commit, feature hat drei neue", target: ff }
      - { label: "feature wurde gerade erst von main abgezweigt und hat einen Commit", target: ff }
      - { label: "main und feature haben beide neue Commits", target: merge }
      - { label: "Eine Kollegin hat main weiterentwickelt, während du auf feature gearbeitet hast", target: merge }
      - { label: "feature ist schon vollständig in main enthalten", target: nichts }
    hints:
      - Frag dich jedes Mal, ob main seit dem Abzweigen eigene neue Commits bekommen hat.
---

Dein Kontaktformular auf `feat/kontaktformular` ist fertig und getestet. Jetzt soll es nach `main`, damit
es live gehen kann. Dafür gibt es den [[merge|Merge]]: Git holt die Arbeit eines Branches in einen
anderen. Meist klappt das von allein. Nur wenn zwei Seiten dieselbe Stelle verschieden geändert haben,
fragt Git dich – das ist ein Merge-Konflikt.

## So funktioniert git merge

`git merge <branch>` holt den genannten Branch **in den Branch, auf dem du gerade stehst**. Das ist der
wichtigste Satz dieser Lektion. Willst du dein Feature nach `main` bringen, wechselst du zuerst dorthin:

```bash title="Ein Feature in main übernehmen"
git switch main
git merge feat/kontaktformular
git branch -d feat/kontaktformular   # danach aufräumen
```

Der gemergte Branch selbst bleibt unverändert. Wer auf dem Feature steht und `git merge main` tippt, holt
umgekehrt `main` ins Feature. Das ist manchmal gewollt, bringt das Feature aber nicht nach `main`.

Wie Git zusammenführt, hängt von einer Frage ab: **Ist main seit dem Abzweigen weitergewachsen?**

## Fast-Forward oder Merge-Commit

**Nein, main ist nicht gewachsen:** Alle Commits liegen auf einer Linie. Git schiebt den Zeiger `main`
einfach bis zur Spitze des Features vor. Das heißt [[fast-forward|Fast-Forward]] („vorspulen“) und
erzeugt keinen neuen Commit.

**Ja, beide Seiten sind gewachsen:** Die Linien laufen auseinander. Git sucht die
[[merge-basis|Merge-Basis]], den letzten gemeinsamen Commit, und vergleicht beide Seiten mit ihr. Das
Ergebnis landet in einem [[merge-commit|Merge-Commit]] mit **zwei Parents**. Mit `--no-edit` übernimmst
du die vorgeschlagene Nachricht, ohne dass ein [[editor|Editor]] aufgeht.

![Links: Fast-Forward verschiebt nur den Zeiger. Rechts: Beide Branches sind gewachsen, ein Merge-Commit mit zwei Parents entsteht.](/assets/git/fast-forward-vs-merge.svg)

| Befehl | Wirkung |
|---|---|
| `git merge feature` | Fast-Forward, wenn möglich – sonst Merge-Commit |
| `git merge --no-ff feature` | immer ein Merge-Commit, auch wenn Vorspulen ginge |
| `git merge --ff-only feature` | nur vorspulen, sonst abbrechen |

`--no-ff` nutzen Teams, die in der Historie sehen wollen, welche Commits zusammen als ein Feature kamen.
Die Linien zeigt dir `git log --graph --oneline`.

> [!MERKSATZ]
> Main nicht weitergewachsen → Fast-Forward, nur der Zeiger wandert. Beide Seiten gewachsen →
> Merge-Commit mit zwei Parents.

## Wie ein Konflikt entsteht

Beim Vergleich mit der Merge-Basis gibt es für jede Stelle drei Fälle:

| Fall | Was Git tut |
|---|---|
| Nur eine Seite hat die Stelle geändert | übernimmt die Änderung automatisch |
| Beide Seiten haben sie gleich geändert | übernimmt sie einmal |
| Beide haben dieselben Zeilen **unterschiedlich** geändert | [[merge-konflikt|Konflikt]] – du entscheidest |

Ein Konflikt ist kein Fehler. Git hält den Merge an, `git status` zeigt die Datei als
*both modified*, und in der Datei markieren [[konfliktmarker|Konfliktmarker]] die beiden Versionen:

```text title="preise.txt mit Konfliktmarkern"
Preisliste
<<<<<<< HEAD
Rabatt: 5 % am Montag
=======
Rabatt: 10 % mit Kundenkarte
>>>>>>> feat/rabatt
```

Oberhalb von `=======` steht deine Version (HEAD, der aktuelle Branch), darunter die des gemergten
Branches.

## Den Konflikt lösen oder abbrechen

Lösen heißt: Du bringst die Datei in den Zustand, der am Ende richtig ist – deine Version, die andere
oder eine Mischung.

1. Datei im Editor öffnen und den richtigen Inhalt herstellen.
2. **Alle** drei Markerzeilen löschen.
3. Mit `git add` die Datei als gelöst markieren.
4. Mit `git commit --no-edit` den Merge-Commit erstellen.

```bash title="Abkürzungen und Notausgang"
git restore --ours preise.txt     # Version des aktuellen Branches übernehmen
git restore --theirs preise.txt   # Version des gemergten Branches übernehmen
git merge --abort                 # alles zurück auf den Stand vor dem Merge
```

Auch nach `--ours` oder `--theirs` brauchst du noch `git add`. Bequemer geht es in einer [[ide|IDE]]:
VS Code oder PhpStorm zeigen beide Seiten nebeneinander mit Knöpfen wie „Accept Current“ und „Accept
Incoming“. Die Schritte dahinter bleiben dieselben.

> [!FEHLER]
> **Vergessene Marker committet.** `git add` prüft nicht, ob noch `=======` in der Datei steht. Übrig
> gebliebene Marker landen im Commit und brechen oft den Code. Vor dem Commit sollte
> `grep -n '^=======' preise.txt` nichts ausgeben.

> [!PRAXIS]
> In Teams mergst du selten lokal nach `main`, sondern über einen [[pull-request|Pull Request]]. Dahinter
> steckt dasselbe Prinzip. Konflikte hältst du klein: kurzlebige Branches, regelmäßig den neuesten Stand
> von `main` holen und Absprachen, bevor du große Dateien umformatierst.

## Zusammenfassung

- `git merge <branch>` holt den Branch **in den aktuellen** Branch. Wechsle vorher auf das Ziel.
- Ist das Ziel nicht weitergewachsen, gibt es einen Fast-Forward. Sonst entsteht ein Merge-Commit mit
  zwei Parents.
- `--no-ff` erzwingt einen Merge-Commit, `--ff-only` erlaubt nur Fast-Forward.
- Ein Konflikt entsteht, wenn beide Seiten dieselben Zeilen unterschiedlich geändert haben.
- Lösen: richtigen Inhalt herstellen, alle Marker entfernen, `git add`, `git commit`.
- `git restore --ours/--theirs` übernimmt eine Seite, `git merge --abort` bricht ab.
