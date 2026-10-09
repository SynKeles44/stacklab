---
title: Die drei Bereiche von Git
summary: Arbeitsverzeichnis, Staging-Bereich und Repository – das wichtigste Bild, um Git wirklich zu verstehen.
duration: 20
sources:
  - title: Pro Git – Die drei Zustände
    url: https://git-scm.com/book/de/v2/Erste-Schritte-Was-ist-Git%3F
  - title: git-add Dokumentation
    url: https://git-scm.com/docs/git-add
quiz:
  - type: single
    question: Du hast `index.html` geändert und gespeichert, aber noch kein Git-Kommando ausgeführt. Wo steckt die Änderung?
    options:
      - Im Repository
      - Im Staging-Bereich
      - Nur im Arbeitsverzeichnis
    answer: 2
    explanation: Speichern im Editor ändert nur das Arbeitsverzeichnis. Git weiß zwar, dass sich etwas geändert hat, vorgemerkt ist aber noch nichts.
  - type: match
    question: Welcher Befehl bewegt eine Änderung wohin?
    pairs:
      - { left: "git add datei.txt", right: "Arbeitsverzeichnis → Staging-Bereich" }
      - { left: "git commit -m \"…\"", right: "Staging-Bereich → Repository" }
      - { left: "git restore --staged datei.txt", right: "Staging-Bereich → zurück (nicht mehr vorgemerkt)" }
    explanation: add merkt vor, commit speichert das Vorgemerkte, restore --staged nimmt eine Vormerkung zurück, ohne die Datei zu verändern.
  - type: find-bug
    question: Ada will nur `login.js` committen, aber nach dem Commit ist auch `debug.log` in der Historie. In welcher Zeile liegt der Fehler?
    language: bash
    code: |
      git status
      git add .
      git commit -m "feat: add login form"
      git log --oneline
    bug_line: 2
    explanation: "`git add .` merkt alle geänderten Dateien im aktuellen Ordner vor – auch debug.log. Richtig wäre `git add login.js`."
  - type: cloze
    text: Der Staging-Bereich heißt intern auch ___. Mit `git ___` siehst du, welche Dateien vorgemerkt sind.
    blanks:
      - [Index]
      - [status]
    explanation: Staging-Bereich und Index sind zwei Namen für dasselbe. git status zeigt alle drei Bereiche im Überblick.
tasks:
  - id: bereiche-beschriften
    type: diagram
    title: Beschrifte die drei Bereiche
    description: Ordne jedem Kasten den richtigen Bereich zu. Die Pfeile zeigen dir, welcher Befehl Änderungen weiterreicht.
    image: /assets/git/drei-bereiche-leer.svg
    slots:
      - { x: 16, y: 36, answer: Arbeitsverzeichnis }
      - { x: 50, y: 36, answer: Staging-Bereich }
      - { x: 84, y: 36, answer: Repository }
    distractors: [Remote, Branch]
    hints:
      - "`git add` schiebt Änderungen in die Mitte, `git commit` nach rechts."
  - id: gezielt-committen
    type: terminal
    title: Nur das Richtige committen
    description: |
      Im Ordner `drei-bereiche` liegt schon ein Repository mit einem ersten Commit. Zwei Dateien
      wurden geändert: `index.html` (eine neue Überschrift) und `notizen.txt` (private Notizen).

      1. Schau dir mit `git status` an, was sich geändert hat.
      2. Committe **nur** `index.html` mit einer Nachricht deiner Wahl.
      3. `notizen.txt` soll geändert bleiben, aber **nicht** committet werden.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit das Repository angelegt wird.
    workdir: drei-bereiche
    setup: |
      git init -q
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      printf '<h1>Hallo</h1>\n' > index.html
      printf 'Einkaufsliste\n' > notizen.txt
      git add index.html notizen.txt
      git commit -q -m "chore: initial commit"
      printf '<h1>Hallo Stacklab</h1>\n<p>Neu!</p>\n' > index.html
      printf 'Einkaufsliste\n- Milch\n' > notizen.txt
    checks:
      - type: command
        run: git log --oneline | wc -l
        stdout_matches: "^\\s*2\\s*$"
        message: Es sollte genau einen neuen Commit geben (insgesamt 2).
      - type: command
        run: git show --name-only --format= HEAD
        stdout_equals: index.html
        message: Der neue Commit darf nur index.html enthalten.
      - type: command
        run: git status --porcelain notizen.txt
        stdout_matches: "^ M notizen\\.txt"
        message: notizen.txt soll geändert, aber nicht vorgemerkt oder committet sein.
    hints:
      - "`git add index.html` merkt nur diese eine Datei vor."
      - "Prüfe mit `git status`, bevor du committest: Unter „Changes to be committed“ darf nur index.html stehen."
    solution: |
      ```bash
      cd drei-bereiche
      git status
      git add index.html
      git commit -m "feat: update headline"
      git status   # notizen.txt bleibt als "modified" stehen
      ```
---

Die meisten Menschen, die Git „nicht verstehen“, haben ein einziges Bild nicht im Kopf: die
**drei Bereiche**. Wenn du dieses Bild einmal verinnerlicht hast, ergeben fast alle Befehle plötzlich Sinn.

![Die drei Bereiche von Git: Arbeitsverzeichnis, Staging-Bereich und Repository](/assets/git/drei-bereiche.svg)

## 1. Das Arbeitsverzeichnis

Das [[arbeitsverzeichnis|Arbeitsverzeichnis]] (englisch *working directory*) sind ganz einfach die Dateien,
die du im Ordner siehst und im Editor bearbeitest. Wenn du `index.html` öffnest, etwas tippst und
speicherst, änderst du das Arbeitsverzeichnis – und sonst nichts.

Git beobachtet das Arbeitsverzeichnis und vergleicht es mit dem letzten Commit. Deshalb kann
`git status` dir sagen: „Diese Datei ist *modified*.“

## 2. Der Staging-Bereich

Der [[staging-bereich|Staging-Bereich]] (auch *Index* genannt) ist eine Art **Packtisch**. Bevor du ein
Paket verschickst, legst du genau die Dinge darauf, die hinein sollen. Alles andere bleibt im Regal.

Mit `git add` legst du eine Änderung auf den Packtisch:

```bash
git add index.html
```

Warum gibt es diesen Zwischenschritt überhaupt? Weil du oft an mehreren Dingen gleichzeitig
arbeitest. Vielleicht hast du einen Fehler behoben **und** nebenbei eine Debug-Ausgabe eingebaut.
Mit dem Staging-Bereich kannst du gezielt nur die Fehlerbehebung committen – sauber und nachvollziehbar.

> [!MERKSATZ]
> Ein Commit enthält **genau das, was im Staging-Bereich liegt** – nicht automatisch alles, was du
> geändert hast.

## 3. Das Repository

Das [[repository|Repository]] ist das Archiv: der Ordner `.git` mit allen Commits. Mit `git commit`
nimmst du alles vom Packtisch, verpackst es als Schnappschuss und stellst es ins Archiv:

```bash
git commit -m "fix: correct typo in headline"
```

Danach ist der Staging-Bereich wieder „leer“ in dem Sinne, dass er genau dem letzten Commit entspricht.

## git status liest alle drei Bereiche

`git status` ist dein wichtigster Befehl. Er vergleicht die drei Bereiche und erzählt dir,
was wo liegt. Eine typische Ausgabe sieht so aus:

```text title="git status"
On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
        modified:   index.html

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
        modified:   notizen.txt

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        bild.png
```

So liest du sie:

| Abschnitt | Bedeutung | Bereich |
|---|---|---|
| *Changes to be committed* | Liegt auf dem Packtisch, kommt in den nächsten Commit | Staging-Bereich |
| *Changes not staged for commit* | Geändert, aber noch nicht vorgemerkt | Arbeitsverzeichnis |
| *Untracked files* | Neue Datei, die Git noch nie gesehen hat | Arbeitsverzeichnis |

> [!TIPP]
> Mit `git status -s` bekommst du eine Kurzfassung. Die erste Spalte zeigt den Staging-Bereich,
> die zweite das Arbeitsverzeichnis: `M ` = vorgemerkt, ` M` = geändert, aber nicht vorgemerkt,
> `??` = unbekannt (untracked).

## Den Weg zurück gehen

Jeder Schritt nach rechts hat ein Gegenstück nach links:

```bash title="Vormerkung zurücknehmen – die Änderung bleibt in der Datei"
git restore --staged index.html
```

```bash title="Änderung im Arbeitsverzeichnis verwerfen – Vorsicht!"
git restore index.html
```

> [!ACHTUNG]
> `git restore datei` (ohne `--staged`) setzt die Datei auf den letzten Commit zurück. Was du seit
> dem letzten Commit in dieser Datei geändert hast, ist danach **unwiederbringlich weg** – Git hatte
> diese Änderung nie gespeichert.

## Typische Fehler

> [!FEHLER]
> **„Ich habe committet, aber meine Änderung fehlt!“** – Du hast die Datei nach `git add` noch
> einmal geändert. Git hat beim `add` den damaligen Stand vorgemerkt. Die spätere Änderung liegt nur
> im Arbeitsverzeichnis. Lösung: erneut `git add`, dann committen.

> [!FEHLER]
> **`git add .` aus Gewohnheit.** Der Punkt steht für „alles im aktuellen Ordner“. So landen schnell
> Log-Dateien, Passwörter in `.env`-Dateien oder riesige Build-Ordner im Repository. Gewöhne dir an,
> vorher `git status` zu lesen – und nutze eine `.gitignore` (dazu später mehr).

> [!PRAXIS]
> Viele Entwicklerinnen nutzen `git add -p` („patch“). Git zeigt jede einzelne Änderung und fragt,
> ob sie in den Commit soll. So entstehen kleine, saubere Commits, die im Code-Review leicht zu
> verstehen sind.

## Zusammenfassung

- **Arbeitsverzeichnis**: deine Dateien, wie du sie im Editor siehst.
- **Staging-Bereich / Index**: der Packtisch – was du mit `git add` vormerkst.
- **Repository**: das Archiv aller Commits im Ordner `.git`.
- `git add` → nach rechts in den Staging-Bereich, `git commit` → ins Repository,
  `git restore --staged` und `git restore` → zurück nach links.
- `git status` zeigt dir jederzeit, was in welchem Bereich liegt.
