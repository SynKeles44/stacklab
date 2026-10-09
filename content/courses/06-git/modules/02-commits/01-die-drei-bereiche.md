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
Wer Git „nicht versteht“, hat meist ein einziges Bild nicht im Kopf: die **drei Bereiche**. Mit diesem
Bild ergeben fast alle Befehle plötzlich Sinn.

![Die drei Bereiche von Git: Arbeitsverzeichnis, Staging-Bereich und Repository](/assets/git/drei-bereiche.svg)

## 1. Das Arbeitsverzeichnis

Das [[arbeitsverzeichnis|Arbeitsverzeichnis]] (*working directory*) sind die Dateien, die du im Ordner siehst
und im Editor bearbeitest. Speicherst du `index.html`, änderst du nur das Arbeitsverzeichnis.

Git vergleicht es mit dem letzten Commit. Deshalb meldet `git status`: „Diese Datei ist *modified*.“

## 2. Der Staging-Bereich

Der [[staging-bereich|Staging-Bereich]] (auch *Index*) ist ein **Packtisch**: Darauf legst du genau das, was
ins nächste Paket soll. Alles andere bleibt im Regal.

```bash
git add index.html
```

Warum der Zwischenschritt? Oft arbeitest du an mehreren Dingen gleichzeitig – etwa an einer Fehlerbehebung
und nebenbei an einer Debug-Ausgabe. So committest du gezielt nur die Fehlerbehebung.

> [!MERKSATZ]
> Ein Commit enthält **genau das, was im Staging-Bereich liegt** – nicht automatisch alles, was du
> geändert hast.

## 3. Das Repository

Das [[repository|Repository]] ist das Archiv im Ordner `.git`. `git commit` nimmt alles vom Packtisch und
stellt es als Schnappschuss ins Archiv:

```bash
git commit -m "fix: correct typo in headline"
```

Danach entspricht der Staging-Bereich wieder genau dem letzten Commit.

## git status liest alle drei Bereiche

```text title="git status"
Changes to be committed:
        modified:   index.html
Changes not staged for commit:
        modified:   notizen.txt
Untracked files:
        bild.png
```

| Abschnitt | Bedeutung | Bereich |
|---|---|---|
| *Changes to be committed* | Kommt in den nächsten Commit | Staging-Bereich |
| *Changes not staged* | Geändert, aber nicht vorgemerkt | Arbeitsverzeichnis |
| *Untracked files* | Neue Datei, Git kennt sie noch nicht | Arbeitsverzeichnis |

> [!TIPP]
> `git status -s` zeigt eine Kurzfassung: `M ` = vorgemerkt, ` M` = geändert, `??` = unbekannt.

## Den Weg zurück gehen

```bash title="Vormerkung zurücknehmen – die Änderung bleibt in der Datei"
git restore --staged index.html
```

```bash title="Änderung verwerfen – Vorsicht!"
git restore index.html
```

> [!ACHTUNG]
> `git restore datei` setzt die Datei auf den letzten Commit zurück. Was du seitdem geändert hast, ist
> **unwiederbringlich weg**.

> [!FEHLER]
> **`git add .` aus Gewohnheit.** Der Punkt merkt *alles* vor – auch Log-Dateien oder `.env` mit
> Passwörtern. Lies vorher `git status` und nutze eine `.gitignore`.

> [!PRAXIS]
> Mit `git add -p` fragt Git dich bei jeder einzelnen Änderung, ob sie in den Commit soll. So entstehen
> kleine Commits, die im Code-Review leicht zu verstehen sind.

## Zusammenfassung

- **Arbeitsverzeichnis**: deine Dateien, wie du sie im Editor siehst.
- **Staging-Bereich / Index**: der Packtisch – gefüllt mit `git add`.
- **Repository**: das Archiv aller Commits in `.git`.
- `git restore --staged` und `git restore` gehen den Weg zurück.
- `git status` zeigt jederzeit, was wo liegt.
