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

Stell dir vor, du schreibst an einer wichtigen Hausarbeit. Du speicherst sie als `hausarbeit.docx`.
Dann änderst du ein Kapitel, bist unzufrieden und willst zurück zum Stand von gestern – aber der ist
weg, weil du ihn überschrieben hast. Also fängst du an, Kopien anzulegen: `hausarbeit-v2.docx`,
`hausarbeit-final.docx`, `hausarbeit-final-wirklich.docx`. Kommt dir bekannt vor?

Genau dieses Problem löst eine **Versionskontrolle**. Und das bekannteste Werkzeug dafür ist [[git]].

## Das Problem: Speichern überschreibt

Wenn du in einem Editor auf „Speichern“ drückst, wird die [[datei]] auf der Festplatte ersetzt.
Der vorherige Inhalt ist verloren. Bei einem Text mag das verschmerzbar sein. In der
Softwareentwicklung ist es eine Katastrophe:

- Ein Projekt besteht aus hunderten Dateien, die voneinander abhängen.
- Mehrere Menschen arbeiten gleichzeitig am selben [[code]].
- Ein Fehler fällt oft erst Tage später auf – und dann willst du wissen: **Was** wurde **wann**,
  von **wem** und **warum** geändert?

Ohne Hilfsmittel kann diese Fragen niemand beantworten.

## Die Lösung: ein Gedächtnis für dein Projekt

Eine Versionskontrolle ist wie ein Fotoalbum für dein Projekt. Immer wenn du einen sinnvollen
Zwischenstand erreicht hast, machst du ein „Foto“ von allen Dateien. Dieses Foto heißt in Git
[[commit|Commit]]. Zu jedem Commit speichert Git:

| Was | Beispiel |
|---|---|
| Den kompletten Stand aller Dateien | So sah das Projekt am Dienstag um 14:03 aus |
| Wer den Commit gemacht hat | `Ada Lovelace <ada@example.com>` |
| Wann | `Tue Oct 7 14:03:12 2026` |
| Eine Nachricht, **warum** | `fix: show error when email is missing` |
| Den Vorgänger-Commit | So entsteht eine lückenlose Kette |

Weil jeder Commit auf seinen Vorgänger zeigt, entsteht eine Kette – die **Historie** deines Projekts.
Du kannst durch diese Kette blättern wie durch ein Album und jeden alten Stand wiederherstellen.

> [!MERKSATZ]
> Ein Commit ist ein **Schnappschuss** des ganzen Projekts mit Autor, Zeitpunkt und Nachricht –
> kein bloßes „Speichern“. Die Kette der Commits ist die Geschichte deines Projekts.

## Repository: der Ordner mit Gedächtnis

Ein Ordner, dessen Geschichte Git verwaltet, heißt [[repository|Repository]] (oft kurz „Repo“).
Von außen sieht er aus wie ein ganz normaler [[ordner|Ordner]] mit deinen Dateien. Zusätzlich liegt darin
ein versteckter Unterordner `.git`. Dort speichert Git alle Commits – sozusagen das Fotoalbum.

```text title="Ein Repository von innen"
mein-projekt/
├── .git/            ← das Gedächtnis: alle Commits, Branches, Einstellungen
├── index.html
├── style.css
└── README.md
```

> [!ACHTUNG]
> Lösche niemals den Ordner `.git`, wenn dir die Historie wichtig ist. Ohne ihn ist dein Projekt
> wieder ein ganz normaler Ordner – alle Commits wären weg.

## Git ist verteilt

Ältere Systeme hatten einen zentralen [[server]]: Die Historie lag nur dort, und ohne Verbindung
konntest du nichts speichern. Git ist **verteilt**: Jede Kopie eines Repositorys enthält die
komplette Historie. Das hat drei große Vorteile:

1. Du kannst **offline** arbeiten – im Zug, im Flugzeug, überall.
2. Fast alles ist **blitzschnell**, weil nichts über das Netzwerk muss.
3. Jede Kopie ist automatisch ein **Backup** der ganzen Geschichte.

## Git ist nicht GitHub

Ein häufiges Missverständnis: Git und [[github|GitHub]] sind nicht dasselbe.

- **Git** ist ein Programm auf deinem Rechner. Es verwaltet die Historie – komplett ohne Internet.
- **GitHub** ist ein Online-Dienst, bei dem du Repositorys ablegen, teilen und gemeinsam bearbeiten
  kannst. Alternativen sind zum Beispiel GitLab, Bitbucket oder Forgejo.

Du kannst Git also nutzen, ohne jemals ein GitHub-Konto zu haben. In diesem Kurs arbeitest du
zuerst nur lokal. Wie du Repositorys online teilst, lernst du im Modul „Zusammenarbeiten“ und im
GitHub-Kurs.

> [!FEHLER]
> „Ich habe meinen Code bei Git hochgeladen.“ – Gemeint ist meistens GitHub. Git selbst lädt
> nichts hoch. Erst wenn du einen Remote einrichtest und `git push` ausführst, wandern Commits auf
> einen anderen Rechner.

## Wie du mit Git arbeitest – der grobe Ablauf

Den genauen Ablauf lernst du in den nächsten Lektionen Schritt für Schritt. Hier schon mal das Bild,
damit du weißt, wohin die Reise geht:

1. Du änderst Dateien wie gewohnt in deinem Editor.
2. Du fragst Git: „Was hat sich geändert?“ (`git status`).
3. Du wählst aus, welche Änderungen in den nächsten Commit sollen (`git add`).
4. Du speicherst den Schnappschuss mit einer Nachricht (`git commit`).

```bash title="Ein kompletter Durchlauf im Terminal"
git status
git add index.html
git commit -m "feat: add contact section"
git log --oneline
```

Keine Sorge, wenn dir diese Befehle noch nichts sagen. Du wirst jeden davon gleich selbst im
Übungs-Terminal tippen.

> [!PRAXIS]
> In professionellen Teams ist Git nicht optional. Jede Code-Änderung – vom kleinen Tippfehler bis
> zum großen Feature – geht als Commit in die Historie. Wer in einem Team anfängt, bekommt am
> ersten Tag Zugriff auf das Repository, nicht auf einen Ordner mit Dateien.

## Zusammenfassung

- Versionskontrolle speichert Stände deines Projekts, damit nichts verloren geht und Änderungen
  nachvollziehbar bleiben.
- In Git heißt ein solcher Stand **Commit**: ein Schnappschuss mit Autor, Zeit, Nachricht und Vorgänger.
- Ein **Repository** ist ein Ordner, dessen Historie Git im versteckten Ordner `.git` speichert.
- Git ist **verteilt**: Jede Kopie hat die ganze Geschichte, du arbeitest auch offline.
- **Git ≠ GitHub**: Git ist das Werkzeug, GitHub ein Dienst zum Teilen.
