---
title: Die Historie lesen
summary: Mit git log, git show und git diff die Geschichte eines Projekts durchsuchen, Commits über Hashes und HEAD~1 ansprechen und Änderungen vergleichen.
duration: 25
sources:
  - title: Pro Git (deutsch) – Anzeigen der Commit-Historie
    url: https://git-scm.com/book/de/v2/Git-Grundlagen-Anzeigen-der-Commit-Historie
  - title: git-log Dokumentation
    url: https://git-scm.com/docs/git-log
  - title: git-show Dokumentation
    url: https://git-scm.com/docs/git-show
  - title: git-diff Dokumentation
    url: https://git-scm.com/docs/git-diff
  - title: gitrevisions – Commits benennen (HEAD~1, HEAD^)
    url: https://git-scm.com/docs/gitrevisions
quiz:
  - type: single
    question: Du hast `index.html` geändert und mit `git add` vorgemerkt. Welcher Befehl zeigt dir genau diese vorgemerkte Änderung?
    options:
      - "`git diff`"
      - "`git diff --staged`"
      - "`git log -p`"
      - "`git show`"
    answer: 1
    explanation: >
      `git diff` ohne Optionen vergleicht Arbeitsverzeichnis und Staging-Bereich – nach `git add` zeigt es
      also nichts mehr an. `--staged` vergleicht Staging-Bereich und letzten Commit.
  - type: multiple
    question: Welche Angaben zeigen auf den Commit **vor** dem aktuellen?
    options:
      - "`HEAD~1`"
      - "`HEAD^`"
      - "`HEAD`"
      - "`HEAD~0`"
    answers: [0, 1]
    explanation: >
      `HEAD~1` und `HEAD^` meinen beide den direkten Vorgänger von HEAD. `HEAD~2` wäre der Vor-Vorgänger.
  - type: match
    question: Welche Option von `git log` erfüllt welchen Wunsch?
    pairs:
      - { left: "--oneline", right: "Jeder Commit in einer Zeile" }
      - { left: "--stat", right: "Welche Dateien wie stark geändert wurden" }
      - { left: "-p", right: "Die komplette Änderung jedes Commits" }
      - { left: "--grep=discount", right: "Nur Commits mit diesem Wort in der Nachricht" }
      - { left: "-n 3", right: "Nur die letzten drei Commits" }
    explanation: Die Optionen lassen sich kombinieren, etwa `git log --oneline --author=Ada -n 5`.
  - type: cloze
    text: "Die eindeutige Kennung eines Commits heißt ___. Statt aller 40 Zeichen reichen meist die ersten ___ Zeichen."
    blanks:
      - [Hash, Commit-Hash, SHA-1, SHA]
      - ["7", sieben]
    explanation: Git zeigt in Kurzansichten wie `--oneline` standardmäßig 7 Zeichen. Werden die irgendwann mehrdeutig, nimmt Git automatisch mehr.
  - type: find-bug
    question: Ada will sehen, was sich zwischen dem vorletzten und dem letzten Commit geändert hat. Welche Zeile liefert das nicht?
    language: bash
    code: |
      git show HEAD
      git diff HEAD~1 HEAD
      git diff HEAD HEAD
      git log -p -n 1
    bug_line: 3
    explanation: >
      `git diff HEAD HEAD` vergleicht einen Commit mit sich selbst – die Ausgabe ist immer leer. Die anderen drei
      Zeilen zeigen die Änderung des letzten Commits.
tasks:
  - id: historie-durchsuchen
    type: terminal
    title: Detektivarbeit in der Historie
    description: |
      Im Ordner `historie-lesen` liegt das Repository eines kleinen Online-Shops mit fünf Commits von
      verschiedenen Personen. Finde mit `git log` und `git show` heraus:

      1. Welcher Commit hat den Rabatt korrigiert? In seiner Nachricht steht das Wort `discount`.
         Schreibe seinen **kurzen Hash** in die Datei `antwort.txt`, z. B. mit `echo 1a2b3c4 > antwort.txt`.
      2. Wer hat die Datei `preise.txt` **angelegt**? Schreibe den vollständigen Namen dieser Person in die
         Datei `autor.txt`.
      3. Ergänze in `preise.txt` eine neue Zeile `Tasse: 9.90` und merke die Änderung vor, sodass sie in
         `git diff --staged` erscheint. **Nicht** committen.

      `antwort.txt` und `autor.txt` sind nur Notizzettel – sie werden weder vorgemerkt noch committet.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit das Repository angelegt wird.
    workdir: historie-lesen
    setup: |
      git init -q
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      c() { GIT_AUTHOR_NAME="$1" GIT_AUTHOR_EMAIL="$2" GIT_AUTHOR_DATE="$3" GIT_COMMITTER_DATE="$3" git commit -q -m "$4"; }
      printf '# Shop\n' > README.md
      git add README.md
      c "Ada Lovelace" "ada@example.com" "2026-09-01T09:00:00" "chore: initial commit"
      printf 'T-Shirt\nHoodie\nTasse\n' > produkte.txt
      git add produkte.txt
      c "Ada Lovelace" "ada@example.com" "2026-09-02T10:15:00" "feat: add product list"
      printf 'T-Shirt: 19.90\nHoodie: 39.90\n' > preise.txt
      git add preise.txt
      c "Grace Hopper" "grace@example.com" "2026-09-03T14:30:00" "feat: add price list"
      printf 'T-Shirt: 17.90\nHoodie: 39.90\n' > preise.txt
      git add preise.txt
      c "Linus" "linus@example.com" "2026-09-05T16:45:00" "fix: correct discount for t-shirts"
      printf '# Shop\n\nA small demo shop for t-shirts, hoodies and mugs.\n' > README.md
      git add README.md
      c "Ada Lovelace" "ada@example.com" "2026-09-08T08:20:00" "docs: describe shop in readme"
    checks:
      - type: command
        run: git log --oneline | wc -l
        stdout_matches: "^\\s*5\\s*$"
        message: Es sollen weiterhin genau fünf Commits existieren. Du sollst in dieser Aufgabe nichts committen.
      - type: file_exists
        path: antwort.txt
        message: Die Datei antwort.txt fehlt noch.
      - type: command
        run: |
          h=$(head -n 1 antwort.txt | tr -d '[:space:]')
          test -n "$h" && test "$(git rev-parse --verify -q "$h^{commit}")" = "$(git log --grep=discount --format=%H)" && echo ok
        stdout_equals: ok
        message: In antwort.txt steht noch nicht der Hash des Commits mit "discount" in der Nachricht. Tipp – git log --oneline --grep=discount.
      - type: file_contains
        path: autor.txt
        pattern: "[Gg]race\\s+[Hh]opper"
        message: In autor.txt steht noch nicht der Name der Person, die preise.txt angelegt hat. Tipp – git log -- preise.txt.
      - type: command
        run: git diff --staged --name-only
        stdout_equals: preise.txt
        message: Im Staging-Bereich soll genau preise.txt liegen (git add preise.txt) – nichts anderes.
      - type: command
        run: git diff --staged preise.txt
        stdout_matches: "^\\+Tasse:\\s*9\\.90"
        message: 'Die vorgemerkte Änderung an preise.txt enthält noch keine neue Zeile "Tasse: 9.90".'
    hints:
      - "`git log --oneline` zeigt dir alle Commits mit kurzem Hash. Mit `--grep=<wort>` filterst du nach der Nachricht."
      - "`git log -- preise.txt` zeigt nur Commits, die diese Datei geändert haben. Der älteste davon hat sie angelegt; seinen Autor siehst du in der normalen `git log`-Ausgabe."
      - "Für Schritt 3: `echo \"Tasse: 9.90\" >> preise.txt`, dann `git add preise.txt` und mit `git diff --staged` kontrollieren."
    solution: |
      ```bash
      cd historie-lesen
      git log --oneline --grep=discount
      git log --format=%h --grep=discount > antwort.txt
      git log -- preise.txt
      echo "Grace Hopper" > autor.txt
      echo "Tasse: 9.90" >> preise.txt
      git add preise.txt
      git diff --staged
      ```
  - id: ausgaben-deuten
    type: steps
    title: Was zeigt Git als Nächstes?
    description: Du arbeitest an einer Datei und schaust dir zwischendurch die Unterschiede an. Überlege bei jedem Schritt, was Git ausgibt.
    steps:
      - situation: >
          Dein Arbeitsverzeichnis ist sauber. Du änderst in `index.html` eine Überschrift und speicherst.
        question: Was zeigt `git diff`?
        options:
          - Nichts, weil noch nichts committet ist.
          - Die geänderte Überschrift – alte Zeile mit `-`, neue Zeile mit `+`.
          - Nur den Dateinamen `index.html`.
        answer: 1
        explanation: "`git diff` vergleicht Arbeitsverzeichnis und Staging-Bereich und zeigt jede geänderte Zeile."
      - situation: Jetzt führst du `git add index.html` aus.
        question: Was zeigt `git diff` jetzt – ohne weitere Optionen?
        options:
          - Wieder die Überschrift.
          - Nichts, denn Arbeitsverzeichnis und Staging-Bereich sind jetzt gleich.
          - Eine Fehlermeldung.
        answer: 1
        explanation: Die Änderung liegt jetzt im Staging-Bereich. Um sie zu sehen, brauchst du `git diff --staged`.
      - situation: 'Du committest mit `git commit -m "fix: correct headline"`.'
        question: Mit welchem Befehl siehst du die Änderung dieses Commits noch einmal?
        options:
          - "`git diff --staged`"
          - "`git show`"
          - "`git status`"
        answer: 1
        explanation: >
          `git show` ohne Argument zeigt den aktuellen Commit (HEAD) samt Änderung. `git diff --staged` ist nach
          dem Commit leer.
---

Ein Repository ist ein Tagebuch deines Projekts – aber nur, wenn du darin lesen kannst. Wann kam das neue
Feature? Wer hat den Preis geändert? Was genau steht in der Änderung von gestern? Für diese Fragen hat Git
drei Werkzeuge: `git log`, `git show` und `git diff`.

## git log: durch die Historie blättern

`git log` listet alle Commits, die neuesten zuerst. Mit Optionen machst du die Liste kürzer oder gezielter:

```bash title="Nützliche Varianten"
git log --oneline
git log --oneline --graph
git log --stat -n 3
git log -p -n 1
git log --author="Ada" --since="2 weeks ago"
git log --grep="discount"
git log -- preise.txt
```

| Option | Wirkung |
|---|---|
| `--oneline` | ein Commit pro Zeile: kurzer Hash und Betreff |
| `--graph` | Branches und Zusammenführungen als Linien |
| `--stat` | welche Dateien wie viele Zeilen geändert haben |
| `-p` | die komplette Änderung jedes Commits |
| `-n 3` | nur die letzten drei Commits |
| `--author`, `--since` | nach Person oder Zeitraum filtern |
| `--grep` | nach einem Wort in der Nachricht suchen |
| `-- <datei>` | nur Commits, die diese [[datei|Datei]] betreffen |

```text title="git log --oneline"
e4a1c2f (HEAD -> main) docs: describe shop in readme
9b07d3a fix: correct discount for t-shirts
51c8e90 feat: add price list
2f6a0b1 feat: add product list
c7252ca chore: initial commit
```

Ist die Liste länger als dein Fenster, öffnet Git sie seitenweise. Mit `q` kommst du wieder heraus.

## Commits benennen: Hashes und HEAD~1

Jeder Commit hat eine eindeutige Kennung, den [[commit-hash|Commit-Hash]]: 40 Zeichen aus Ziffern und
Buchstaben a–f. Er wird aus dem Inhalt berechnet, deshalb ändert ihn jede noch so kleine Änderung.

| Schreibweise | Bedeutung |
|---|---|
| `9b07d3a8f…` (40 Zeichen) | voller Hash, immer eindeutig |
| `9b07d3a` | kurzer Hash – reicht, solange er eindeutig ist |
| `HEAD` | der Commit, auf dem du gerade stehst |
| `HEAD~1` oder `HEAD^` | sein Vorgänger |
| `HEAD~3` | drei Commits zurück |

[[head|HEAD]] ist wie ein Lesezeichen im Tagebuch. Die Tilde zählt von dort aus Seiten zurück.

> [!MERKSATZ]
> Wo Git einen Commit erwartet, darfst du einen Hash, einen gekürzten Hash, einen Branch-Namen oder
> `HEAD~n` schreiben. Alles meint am Ende denselben Commit.

## git show: einen Commit ansehen

`git show` zeigt einen einzelnen Commit: Autor, Datum, Nachricht und die Änderung. Ohne Argument nimmt es
`HEAD`.

```bash title="Einzelne Commits"
git show
git show 9b07d3a
git show HEAD~2 --stat
```

```text title="git show 9b07d3a"
commit 9b07d3a8f2c41e6b0d5a7c9e1f3b2a4d6c8e0f12
Author: Linus <linus@example.com>
Date:   Sat Sep 5 16:45:00 2026 +0000

    fix: correct discount for t-shirts

diff --git a/preise.txt b/preise.txt
@@ -1,2 +1,2 @@
-T-Shirt: 19.90
+T-Shirt: 17.90
 Hoodie: 39.90
```

Zeilen mit `-` wurden entfernt, Zeilen mit `+` hinzugefügt, alle anderen sind Kontext. Diese Darstellung
heißt [[diff|Diff]].

## git diff: Bereiche und Commits vergleichen

`git diff` vergleicht zwei Stände. Welche, hängt von den Argumenten ab – und genau hier verwechseln
Einsteiger:innen am meisten:

| Befehl | Vergleicht | Zeigt |
|---|---|---|
| `git diff` | [[staging-bereich|Staging-Bereich]] ↔ Arbeitsverzeichnis | noch nicht vorgemerkte Änderungen |
| `git diff --staged` | letzter Commit ↔ Staging-Bereich | was in den nächsten Commit kommt |
| `git diff HEAD~1 HEAD` | zwei Commits | was der letzte Commit geändert hat |
| `git diff HEAD~3 -- preise.txt` | Commit ↔ Arbeitsverzeichnis, eine Datei | Änderungen an `preise.txt` seit drei Commits |

> [!FEHLER]
> **„`git diff` zeigt nichts, aber ich habe doch etwas geändert!“** – Du hast die Änderung schon mit
> `git add` vorgemerkt. `git diff` ohne Optionen sieht nur, was noch **nicht** vorgemerkt ist. Nimm
> `git diff --staged`. `--cached` ist übrigens ein älterer Name für dieselbe Option.

Wer eine einzelne Zeile verstehen will, nutzt `git blame datei` ([[git-blame]]). Es zeigt neben jeder Zeile, in welchem
Commit und von wem sie zuletzt geändert wurde.

> [!PRAXIS]
> Vor jedem Commit lohnt ein `git diff --staged`: Du siehst genau, was gleich gespeichert wird, und
> entdeckst vergessene Debug-Ausgaben, bevor sie ins Code-Review gehen. Bei Fehlern im Live-Betrieb
> beginnt die Suche oft mit `git log --since="yesterday" --stat`.

## Zusammenfassung

- `git log` listet Commits; `--oneline`, `--stat`, `-p`, `-n`, `--author`, `--since`, `--grep` und
  `-- <datei>` machen die Liste gezielt.
- Commits sprichst du über den vollen oder kurzen Hash, `HEAD`, `HEAD~1` bzw. `HEAD^` an.
- `git show` zeigt einen Commit mit Nachricht und Diff.
- `git diff` zeigt nicht vorgemerkte Änderungen, `git diff --staged` vorgemerkte,
  `git diff HEAD~1 HEAD` die Änderung des letzten Commits.
- `git blame` verrät, wer eine Zeile zuletzt geändert hat.
