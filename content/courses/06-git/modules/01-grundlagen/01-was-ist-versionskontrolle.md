---
title: Was ist Versionskontrolle?
summary: Warum es Git gibt, welches Problem es löst und wie du dir einen Commit vorstellen kannst.
duration: 15
sources:
  - title: Pro Git (deutsch), Kapitel 1 – Erste Schritte
    url: https://git-scm.com/book/de/v2/Erste-Schritte-Was-ist-Versionsverwaltung%3F
  - title: Offizielle Git-Dokumentation
    url: https://git-scm.com/doc
quiz:
  - type: single
    question: Welches Problem löst eine Versionskontrolle in erster Linie?
    options:
      - Sie macht Programme schneller.
      - Sie merkt sich jeden gespeicherten Stand eines Projekts, sodass du jederzeit zurückspringen und Änderungen nachvollziehen kannst.
      - Sie findet automatisch Fehler im Code.
      - Sie ersetzt das Speichern im Editor.
    answer: 1
    explanation: >
      Versionskontrolle ist ein Gedächtnis für dein Projekt. Sie speichert Stände (bei Git: Commits),
      damit du nachvollziehen kannst, wer was wann und warum geändert hat – und zu jedem Stand zurückkannst.
  - type: multiple
    question: Welche Aussagen über Git stimmen?
    options:
      - Git ist ein verteiltes System – jede Kopie enthält die komplette Historie.
      - Git funktioniert nur mit Internetverbindung.
      - Git und GitHub sind dasselbe.
      - Ein Commit ist ein vollständiger Schnappschuss des Projekts zu einem Zeitpunkt.
    answers: [0, 3]
    explanation: >
      Git ist verteilt: Jeder Klon hat die ganze Historie, du kannst komplett offline arbeiten.
      GitHub ist nur ein Dienst, der Git-Repositorys im Internet speichert. Und ein Commit ist ein
      Schnappschuss, kein Diff.
  - type: cloze
    text: Ein gespeicherter Stand in Git heißt ___. Der Ordner, dessen Geschichte Git verwaltet, heißt ___.
    blanks:
      - [Commit, Commits]
      - [Repository, Repo]
    explanation: Commit = gespeicherter Schnappschuss. Repository (kurz Repo) = Projektordner mit Git-Historie.
  - type: match
    question: Ordne jedem Begriff die passende Beschreibung zu.
    pairs:
      - { left: "Repository", right: "Projekt samt kompletter Änderungsgeschichte" }
      - { left: "Commit", right: "Gespeicherter Schnappschuss mit Nachricht" }
      - { left: "Git", right: "Programm auf deinem Rechner" }
      - { left: "GitHub", right: "Online-Dienst zum Teilen von Repositorys" }
    explanation: Git ist das Werkzeug, GitHub einer von mehreren Anbietern, bei denen du Repositorys online ablegen kannst.
tasks:
  - id: chaos-ordnen
    type: order
    title: Vom Dateichaos zum Commit
    description: >
      So arbeitet ein Mensch mit Versionskontrolle. Bring die Schritte in die Reihenfolge,
      in der sie bei einer typischen Änderung passieren.
    items:
      - Du änderst eine Datei im Projekt.
      - Du schaust nach, was sich geändert hat.
      - Du wählst aus, welche Änderungen in den nächsten Stand sollen.
      - Du speicherst den Stand mit einer Nachricht als Commit.
      - Du kannst diesen Stand später jederzeit wieder ansehen.
    hints:
      - Erst ändern, dann prüfen, dann auswählen, dann speichern.
  - id: ohne-git
    type: steps
    title: Was passiert als Nächstes – ohne Versionskontrolle?
    description: Spiel eine typische Situation aus dem Alltag durch und überlege, was passiert.
    steps:
      - situation: >
          Du arbeitest an einer Website. Am Montag funktioniert alles. Am Dienstag baust du ein neues
          Kontaktformular ein und speicherst die Dateien einfach im Editor.
        question: Am Mittwoch ist die Startseite kaputt. Was weißt du jetzt?
        options:
          - Genau, welche Zeile am Dienstag geändert wurde.
          - Nichts Genaues – der alte Stand vom Montag ist überschrieben.
          - Die Website repariert sich nach 24 Stunden selbst.
        answer: 1
        explanation: Ohne Versionskontrolle überschreibt jedes Speichern den alten Stand. Was vorher war, ist weg.
      - situation: >
          Du kopierst ab jetzt vor jeder Änderung den ganzen Ordner: `website-final`, `website-final-2`,
          `website-final-WIRKLICH`. Eine Kollegin arbeitet gleichzeitig an ihrer eigenen Kopie.
        question: Ihr wollt eure Arbeit zusammenführen. Was ist das Problem?
        options:
          - Es gibt keins, man kopiert einfach einen Ordner über den anderen.
          - Niemand weiß sicher, welche Dateien wer geändert hat – beim Zusammenkopieren gehen Änderungen verloren.
        answer: 1
        explanation: >
          Genau dieses Chaos löst Git: Jede Änderung ist ein Commit mit Autor, Zeit und Nachricht, und
          Git kann Änderungen von mehreren Personen kontrolliert zusammenführen.
---
Du schreibst an einer Hausarbeit, änderst ein Kapitel – und willst zurück zum Stand von gestern. Der ist
weg, weil du ihn überschrieben hast. Also legst du Kopien an: `arbeit-v2.docx`, `arbeit-final.docx`,
`arbeit-final-wirklich.docx`. Kommt dir bekannt vor? Genau dieses Problem löst eine **Versionskontrolle** –
und das bekannteste Werkzeug dafür ist [[git]].

## Das Problem: Speichern überschreibt

Drückst du im Editor auf „Speichern“, wird die [[datei]] ersetzt – der alte Inhalt ist verloren.
In der Softwareentwicklung ist das eine Katastrophe:

- Ein Projekt besteht aus hunderten Dateien, die voneinander abhängen.
- Mehrere Menschen ändern gleichzeitig denselben [[code]].
- Fehler fallen oft erst Tage später auf. Dann willst du wissen: **Was** wurde **wann**, von **wem**
  und **warum** geändert?

Ohne Hilfsmittel kann diese Fragen niemand beantworten.

## Die Lösung: ein Gedächtnis für dein Projekt

Git funktioniert wie ein Fotoalbum: Immer wenn du einen sinnvollen Zwischenstand erreicht hast, machst du
ein „Foto“ von allen Dateien. Dieses Foto heißt [[commit|Commit]]. Zu jedem Commit speichert Git:

| Was | Beispiel |
|---|---|
| Den Stand aller Dateien | So sah das Projekt am Dienstag um 14:03 aus |
| Wer | `Ada Lovelace <ada@example.com>` |
| Wann | `Tue Oct 7 14:03:12 2026` |
| Warum (Nachricht) | `fix: show error when email is missing` |
| Den Vorgänger-Commit | So entsteht eine lückenlose Kette |

Die Kette der Commits ist die **Historie** deines Projekts. Du kannst darin blättern und jeden alten
Stand wiederherstellen.

> [!MERKSATZ]
> Ein Commit ist ein **Schnappschuss** des ganzen Projekts mit Autor, Zeitpunkt und Nachricht.

## Repository: der Ordner mit Gedächtnis

Ein [[ordner|Ordner]], dessen Geschichte Git verwaltet, heißt [[repository|Repository]] (kurz „Repo“).
Er sieht aus wie ein normaler Ordner – zusätzlich liegt darin der versteckte Unterordner `.git`.
Dort speichert Git alle Commits.

```text title="Ein Repository von innen"
mein-projekt/
├── .git/            ← das Gedächtnis: alle Commits, Branches, Einstellungen
├── index.html
└── README.md
```

> [!ACHTUNG]
> Löschst du `.git`, ist die komplette Historie weg – übrig bleibt ein normaler Ordner.

## Verteilt – und nicht dasselbe wie GitHub

Git ist **verteilt**: Jede Kopie eines Repositorys enthält die komplette Historie. Du arbeitest offline,
fast alles ist blitzschnell, und jede Kopie ist automatisch ein Backup.

Ein häufiges Missverständnis: Git und [[github|GitHub]] sind nicht dasselbe.

- **Git** ist ein Programm auf deinem Rechner – es braucht kein Internet.
- **GitHub** ist ein Online-Dienst ([[server]]), auf dem du Repositorys teilst. Alternativen sind
  GitLab, Bitbucket oder Forgejo.

> [!FEHLER]
> „Ich habe meinen Code bei Git hochgeladen.“ – Gemeint ist meist GitHub. Git selbst lädt nichts hoch;
> erst `git push` schickt Commits auf einen anderen Rechner.

## Der Ablauf im Überblick

1. Du änderst Dateien im Editor.
2. Du fragst Git, was sich geändert hat: `git status`.
3. Du wählst aus, was in den nächsten Commit soll: `git add`.
4. Du speicherst den Schnappschuss mit einer Nachricht: `git commit`.

```bash title="Ein kompletter Durchlauf"
git status
git add index.html
git commit -m "feat: add contact section"
git log --oneline
```

Jeden dieser Befehle tippst du in den nächsten Lektionen selbst im Übungs-Terminal.

> [!PRAXIS]
> In professionellen Teams geht jede Änderung – vom Tippfehler bis zum großen Feature – als Commit in die
> Historie. Am ersten Arbeitstag bekommst du Zugriff auf das Repository, nicht auf einen Ordner mit Dateien.

## Zusammenfassung

- Versionskontrolle speichert Stände deines Projekts, damit nichts verloren geht.
- Ein **Commit** ist ein Schnappschuss mit Autor, Zeit, Nachricht und Vorgänger.
- Ein **Repository** speichert seine Historie im versteckten Ordner `.git`.
- Git ist **verteilt** – jede Kopie hat die ganze Geschichte.
- **Git ≠ GitHub**: Git ist das Werkzeug, GitHub ein Dienst zum Teilen.
