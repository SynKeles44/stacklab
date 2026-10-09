---
title: Branches verstehen
summary: Ein Branch ist nur ein beweglicher Zeiger auf einen Commit. Wie HEAD dazu passt und wie du Branches mit git switch anlegst, wechselst, löschst und sinnvoll benennst.
duration: 20
sources:
  - title: Pro Git (deutsch) – Branches auf einen Blick
    url: https://git-scm.com/book/de/v2/Git-Branching-Branches-auf-einen-Blick
  - title: Pro Git (deutsch) – Branch-Management
    url: https://git-scm.com/book/de/v2/Git-Branching-Branch-Management
  - title: git-switch Dokumentation
    url: https://git-scm.com/docs/git-switch
  - title: git-branch Dokumentation
    url: https://git-scm.com/docs/git-branch
quiz:
  - type: single
    question: Welcher Befehl legt den Branch `feat/login` an **und** wechselt sofort dorthin?
    options:
      - git branch feat/login
      - git switch feat/login
      - git switch -c feat/login
      - git branch -m feat/login
    answer: 2
    explanation: >
      `git branch feat/login` legt den Branch nur an, du bleibst aber, wo du bist. `git switch feat/login`
      wechselt nur zu einem Branch, der schon existiert. `-c` (create) kombiniert beides. `-m` benennt um.
  - type: multiple
    question: Du stehst auf dem Branch `feature` und erstellst einen neuen Commit. Was passiert?
    options:
      - Der Zeiger `feature` wandert auf den neuen Commit.
      - Der Zeiger `main` wandert ebenfalls mit.
      - HEAD zeigt weiterhin auf `feature`.
      - Der neue Commit merkt sich den bisherigen Commit von `feature` als Parent.
    answers: [0, 2, 3]
    explanation: >
      Nur der Branch, auf dem du stehst, bewegt sich. HEAD zeigt weiter auf diesen Branch, und der neue
      Commit verweist auf seinen Vorgänger. Alle anderen Branches bleiben, wo sie sind.
  - type: match
    question: Ordne jedem Begriff die passende Beschreibung zu.
    pairs:
      - { left: "Branch", right: "Beweglicher Name, der auf einen Commit zeigt" }
      - { left: "HEAD", right: "Markiert, wo du gerade stehst – meist ein Branch" }
      - { left: "Parent", right: "Der Vorgänger-Commit, auf den ein Commit verweist" }
      - { left: "Detached HEAD", right: "HEAD zeigt direkt auf einen Commit statt auf einen Branch" }
    explanation: >
      Commits bilden über ihre Parents eine Kette. Branches sind Namensschilder an dieser Kette, und
      HEAD sagt, welches Schild gerade deins ist.
  - type: cloze
    text: "Einen fertig gemergten Branch löschst du mit `git branch ___ alt`. Willst du einen Branch mit ungemergten Commits trotzdem löschen, brauchst du `git branch ___ alt`."
    blanks:
      - [-d, --delete]
      - [-D]
    explanation: >
      `-d` ist die sichere Variante: Git weigert sich, wenn dabei Commits verloren gingen. `-D` löscht ohne
      Rückfrage – die Commits sind danach nur noch über das Reflog auffindbar.
  - type: find-bug
    question: Ada will für das Ticket SHOP-123 einen Feature-Branch anlegen. Welche Zeile führt zu einem Fehler?
    language: bash
    code: |
      git switch main
      git status
      git switch -c "feat/SHOP-123 Gutschein Feld"
      git add gutschein.js
      git commit -m "feat(SHOP-123): add voucher field"
    bug_line: 3
    explanation: >
      Branch-Namen dürfen keine Leerzeichen enthalten. Git bricht mit „is not a valid branch name“ ab. Richtig
      wäre zum Beispiel `git switch -c feat/SHOP-123-voucher-field` – kleingeschrieben, mit Bindestrichen.
tasks:
  - id: zeiger-beschriften
    type: diagram
    title: Beschrifte die Zeiger
    description: >
      Im Bild siehst du vier Commits. C4 ist auf einem eigenen Branch entstanden, du arbeitest gerade
      genau dort. Ziehe die richtigen Namen in die drei Kästen. Achtung: Zwei Begriffe gehören nicht
      in dieses Bild.
    image: /assets/git/branches-zeiger-leer.svg
    slots:
      - { x: 73.75, y: 19.4, answer: HEAD }
      - { x: 73.75, y: 42.2, answer: feature }
      - { x: 73.75, y: 72.8, answer: main }
    distractors: [origin/main, v1.0.0]
    hints:
      - Nur ein Kasten zeigt nicht auf einen Commit, sondern auf einen anderen Kasten.
      - "Der Name, der auf einen Branch zeigt, ist HEAD. Du arbeitest auf dem Branch mit dem neuesten Commit C4."
  - id: branch-wechseln
    type: terminal
    title: Feature-Branch anlegen und aufräumen
    description: |
      Im Ordner `branch-wechseln` liegt ein Repository mit zwei Commits auf `main`. Außerdem gibt es
      einen alten Branch `alt/experiment`, dessen Arbeit längst in `main` steckt.

      1. Lege den Branch `feat/kontaktformular` an und wechsle dorthin.
      2. Erstelle die Datei `kontakt.html` (Inhalt egal, z. B. `<form></form>`) und committe sie.
      3. Wechsle zurück auf `main`. Die Datei `kontakt.html` muss dort verschwinden.
      4. Lösche den Branch `alt/experiment` – mit der **sicheren** Variante.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit das Repository angelegt wird.
    workdir: branch-wechseln
    setup: |
      git init -q
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      printf '<h1>Willkommen</h1>\n' > index.html
      git add index.html
      git commit -q -m "feat: add start page"
      git branch alt/experiment
      printf '# Website\n' > README.md
      git add README.md
      git commit -q -m "docs: add readme"
    checks:
      - type: command
        run: git rev-parse --verify -q refs/heads/feat/kontaktformular
        message: Der Branch feat/kontaktformular existiert noch nicht.
      - type: command
        run: git rev-list --count main..feat/kontaktformular
        stdout_matches: "^\\s*[1-9][0-9]*\\s*$"
        message: Auf feat/kontaktformular fehlt noch ein eigener Commit, der nicht auf main liegt.
      - type: command
        run: git ls-tree --name-only feat/kontaktformular -- kontakt.html
        stdout_equals: kontakt.html
        message: kontakt.html ist auf feat/kontaktformular noch nicht committet.
      - type: command
        run: git ls-tree --name-only main -- kontakt.html | wc -l
        stdout_matches: "^\\s*0\\s*$"
        message: kontakt.html darf nicht auf main committet sein.
      - type: command
        run: git rev-parse --abbrev-ref HEAD
        stdout_equals: main
        message: Wechsle am Ende zurück auf main.
      - type: file_absent
        path: kontakt.html
        message: Auf main sollte kontakt.html nicht im Ordner liegen – hast du die Datei committet, bevor du gewechselt hast?
      - type: command
        run: git rev-parse --verify -q refs/heads/alt/experiment
        expect_exit: 1
        message: Der Branch alt/experiment existiert noch.
    hints:
      - "Ein Befehl legt den Branch an und wechselt gleich dorthin: `git switch` mit der richtigen Option."
      - "Nach dem Commit bringt dich `git switch main` zurück. Mit `git branch -v` siehst du alle Branches."
      - "Die sichere Lösch-Variante ist `git branch -d alt/experiment`."
    solution: |
      ```bash
      cd branch-wechseln
      git switch -c feat/kontaktformular
      echo '<form></form>' > kontakt.html
      git add kontakt.html
      git commit -m "feat: add contact form"
      git switch main
      ls                      # kontakt.html ist weg – sie liegt nur auf dem Feature-Branch
      git branch -d alt/experiment
      git branch -v
      ```
---

Du baust gerade ein neues Kontaktformular, da meldet sich deine Teamleiterin: Auf der Live-Seite ist ein
Tippfehler, der muss **sofort** weg. Dein Formular ist halb fertig. Mit Branches ist das kein Problem: Du
wechselst in Sekunden auf den sauberen Stand, behebst den Fehler und kehrst danach zu deinem Formular
zurück – als wäre nichts gewesen.

## Ein Branch ist nur ein Zeiger

Ein [[branch|Branch]] (deutsch *Zweig*) ist eine eigene Entwicklungslinie in deinem
[[repository|Repository]]. Was steckt technisch dahinter? Weniger, als du denkst.

Jeder [[commit|Commit]] kennt den Hash seines Vorgängers, seines [[parent-commit|Parents]]. So entsteht
eine Kette, an der sich `git log` rückwärts entlanghangelt. Ein Branch ist **keine Kopie** deiner Dateien,
sondern eine winzige Datei, in der genau ein Commit-Hash steht:

```bash title="Was ein Branch wirklich ist"
cat .git/refs/heads/main
# c94e1a2d7f0b3e6a9c1d4f8b2e5a7c0d3f6b9e12
```

Solche Namen für Commits heißen [[git-referenz|Referenzen]]. Stell dir einen Branch wie ein
**Lesezeichen** vor: Es enthält keinen Text, es markiert nur eine Seite. Deshalb sind Branches in Git
billig – ein neuer Branch kopiert nichts und kostet praktisch keinen Speicher.

![Commits C1 bis C4, die Branches main und feature zeigen auf C3 und C4, HEAD zeigt auf feature](/assets/git/branches-zeiger.svg)

Im Bild gehören C1 und C2 zu **beiden** Branches: Von C3 und von C4 aus erreichst du sie über die
Parent-Pfeile.

> [!MERKSATZ]
> Ein Branch ist ein beweglicher Zeiger auf einen Commit. Seine Historie ergibt sich daraus, dass jeder
> Commit auf seinen Parent zeigt.

## HEAD: Wo stehe ich gerade?

Bei mehreren Branches muss Git wissen, auf welchem du arbeitest. Dafür gibt es [[head|HEAD]]. HEAD zeigt
normalerweise nicht auf einen Commit, sondern auf einen Branch: HEAD → Branch → Commit.

| Aktion | HEAD | Aktueller Branch | Andere Branches |
|---|---|---|---|
| `git commit` | bleibt beim Branch | wandert zum neuen Commit | bleiben stehen |
| `git switch main` | zeigt jetzt auf `main` | – | bleiben stehen |
| `git branch neu` | bleibt, wo er ist | bleibt stehen | neuer Zeiger auf denselben Commit |

Willst du einen alten Stand ansehen, kannst du HEAD mit `git switch --detach a1f3c9e` direkt auf einen
Commit setzen. Das heißt [[detached-head|Detached HEAD]]. Du darfst dich umsehen und sogar committen –
aber kein Branch wandert mit. Wechselst du weg, zeigt nichts mehr auf diese Commits. Willst du sie
behalten, gib ihnen vorher mit `git switch -c rettung` einen Namen.

## Anlegen, wechseln, löschen

Für den Alltag reichen eine Handvoll Befehle:

```bash title="Die wichtigsten Branch-Befehle"
git branch -v                       # alle Branches mit ihrem Commit, * = aktueller
git switch -c feat/kontaktformular  # anlegen UND wechseln
git switch main                     # zu bestehendem Branch wechseln
git switch -                        # zurück zum vorherigen Branch
git branch -m alter-name neuer-name # umbenennen
git branch -d alt/experiment        # löschen, nur wenn gemergt
git branch -D alt/experiment        # löschen, auch ungemergte Arbeit
```

Beim Wechseln setzt Git HEAD um und tauscht die Dateien im [[arbeitsverzeichnis|Arbeitsverzeichnis]]
gegen den Stand des Ziel-Commits. Ein neuer Branch startet immer dort, wo du gerade stehst.

`-d` ist die sichere Variante: Git verweigert das Löschen, wenn Commits sonst verloren gingen. `-D`
ignoriert diese Prüfung. Vor `git switch` nutzte man `git checkout name` und `git checkout -b name` –
das funktioniert bis heute und steht in vielen Anleitungen.

> [!FEHLER]
> **„Ich habe einen Branch angelegt und trotzdem auf main committet.“** `git branch name` legt den Branch
> nur an, wechselt aber nicht. Prüfe mit `git status`, wo du stehst – oder nutze gleich `git switch -c`.

## Uncommittete Änderungen beim Wechsel

Eine noch nicht committete Änderung gehört zu **keinem** Branch. Beim Wechsel gibt es zwei Fälle:

- **Mitnehmen:** Ist die Datei auf beiden Branches gleich, wechselt Git einfach und lässt deine Änderung
  liegen. Sie taucht dann auf dem anderen Branch auf – committet ist sie trotzdem nirgends.
- **Abbrechen:** Würde der Wechsel deine Änderung überschreiben, verweigert Git ihn mit
  `Your local changes … would be overwritten`.

Dann committest du die Änderung zuerst oder legst sie mit [[stash|git stash]] kurz beiseite. Ein Blick auf
`git status` vor jedem Wechsel erspart dir Verwirrung.

## Branches sinnvoll benennen

Leerzeichen sowie `~`, `^`, `:`, `?`, `*`, `[` und `..` sind in Branch-Namen verboten. Darüber hinaus
haben sich Präfixe eingebürgert, angelehnt an [[conventional-commits|Conventional Commits]]:

| Präfix | Wofür | Beispiel |
|---|---|---|
| `feat/` | neues Feature | `feat/SHOP-123-voucher-field` |
| `fix/` | Fehlerbehebung | `fix/SHOP-207-cart-total` |
| `chore/` | Wartung, Abhängigkeiten | `chore/update-dependencies` |
| `docs/` | nur Dokumentation | `docs/install-guide` |

Die Regeln: **kleinschreiben**, Wörter mit **Bindestrichen** trennen, kurz halten und den
[[ticket|Ticket]]-Schlüssel nach dem Präfix nennen.

> [!PRAXIS]
> In Teams wird fast nie direkt auf `main` gearbeitet. Für jedes Ticket entsteht ein eigener Branch von
> einem aktuellen `main` aus. Tools wie Jira oder GitHub verknüpfen ihn automatisch mit dem Ticket, sobald
> `SHOP-123` im Namen steht. Ist die Arbeit gemergt, wird der Branch gelöscht.

## Zusammenfassung

- Ein Branch ist eine kleine Datei mit einem Commit-Hash – ein beweglicher Zeiger, keine Kopie.
- HEAD zeigt auf den aktuellen Branch. Beim Committen wandert nur dieser Branch weiter.
- Im Detached HEAD zeigt HEAD direkt auf einen Commit; neue Commits sicherst du mit `git switch -c`.
- `git switch -c` legt an und wechselt, `git switch` wechselt, `git branch -d` löscht sicher, `-D` hart.
- Uncommittete Änderungen nimmt Git beim Wechsel mit, wenn das gefahrlos geht – sonst bricht es ab.
- Gute Namen: Präfix wie `feat/`, Ticket-Schlüssel, kleingeschrieben, Bindestriche.
