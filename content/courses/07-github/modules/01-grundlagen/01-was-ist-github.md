---
title: Was ist GitHub?
summary: GitHub ist kein zweites Git, sondern ein Treffpunkt im Netz, an dem Teams ihre Git-Repositorys teilen, besprechen und automatisieren.
duration: 20
sources:
  - title: GitHub Docs – Über GitHub und Git
    url: https://docs.github.com/de/get-started/start-your-journey/about-github-and-git
  - title: Pro Git – Kapitel 6, GitHub
    url: https://git-scm.com/book/de/v2/GitHub-Einrichten-und-Konfigurieren-eines-Kontos
  - title: Forgejo – Projektseite
    url: https://forgejo.org/
quiz:
  - type: single
    question: Du hast Git installiert, aber kein GitHub-Konto. Was kannst du trotzdem tun?
    options:
      - Nichts, Git funktioniert nur zusammen mit GitHub
      - Repositorys anlegen, committen und Branches erstellen – alles lokal
      - Nur Dateien lesen, aber keine Commits erstellen
    answer: 1
    explanation: Git ist ein eigenständiges Programm auf deinem Rechner. GitHub ist nur eine von mehreren Plattformen, auf die du Repositorys hochladen kannst.
  - type: multiple
    question: Welche Funktionen gehören zu GitHub und NICHT zu Git selbst?
    options:
      - Issues
      - Commits
      - Pull Requests
      - GitHub Actions
      - Branches
    answers: [0, 2, 3]
    explanation: Commits und Branches sind Git-Konzepte und funktionieren auch offline. Issues, Pull Requests und Actions stellt erst die Plattform GitHub bereit.
  - type: match
    question: Ordne jeder Plattform eine passende Beschreibung zu.
    pairs:
      - { left: "GitHub", right: "Größte Plattform, gehört zu Microsoft, Actions für CI" }
      - { left: "GitLab", right: "Plattform mit eingebauter CI/CD, auch selbst betreibbar" }
      - { left: "Bitbucket", right: "Atlassian-Plattform, eng mit Jira verbunden" }
      - { left: "Forgejo", right: "Freie Software, die du auf deinem eigenen Server betreibst" }
    explanation: Alle vier hosten Git-Repositorys. Sie unterscheiden sich bei Zusatzfunktionen, Betreiber und Lizenz – Git bleibt überall gleich.
  - type: cloze
    text: GitHub speichert eine Kopie deines Repositorys als ___. Mit `git ___` lädst du deine Commits dorthin hoch.
    blanks:
      - [Remote, Remote-Repository, remote]
      - [push]
    explanation: Aus Sicht von Git ist das Repository auf GitHub ein Remote. git push überträgt deine lokalen Commits dorthin.
tasks:
  - id: git-oder-github
    type: dragdrop
    title: Git oder GitHub?
    description: |
      Ordne jede Fähigkeit dem Werkzeug zu, das sie bereitstellt. Frage dich jeweils:
      Funktioniert das auch ohne Internet und ohne Konto?
    targets:
      - { id: git, label: "Git (Programm auf deinem Rechner)" }
      - { id: github, label: "GitHub (Plattform im Netz)" }
    items:
      - { label: "Einen Commit erstellen", target: git }
      - { label: "Einen Branch anlegen und mergen", target: git }
      - { label: "Die Historie mit git log lesen", target: git }
      - { label: "Ein Issue für einen Fehler eröffnen", target: github }
      - { label: "Einen Pull Request reviewen", target: github }
      - { label: "Tests automatisch mit Actions ausführen", target: github }
      - { label: "Eine Projektseite mit Pages veröffentlichen", target: github }
    hints:
      - Alles, was mit Commits, Branches und Historie zu tun hat, kann Git allein.
  - id: erster-tag-im-team
    type: steps
    title: Dein erster Tag im Team
    description: Du startest als Junior-Entwickler:in in einem Team, das GitHub nutzt. Was passiert als Nächstes?
    steps:
      - situation: Deine Teamleiterin schickt dir einen Link zu `github.com/beispiel-firma/shop`. Du willst den Code auf deinem Rechner haben.
        question: Was machst du?
        options:
          - Ich lade jede Datei einzeln im Browser herunter
          - Ich klone das Repository mit git clone
          - Ich schreibe die Dateien ab
        answer: 1
        explanation: git clone kopiert das komplette Repository samt Historie auf deinen Rechner und richtet GitHub automatisch als Remote ein.
      - situation: Du findest beim Ausprobieren einen Fehler im Warenkorb, hast aber noch keine Zeit, ihn zu beheben.
        question: Wo hältst du ihn fest, damit er nicht vergessen wird?
        options:
          - In einem Issue auf GitHub
          - In einem Commit
          - In einer privaten Notiz auf dem Desktop
        answer: 0
        explanation: Issues sind die gemeinsame Aufgabenliste des Teams. Alle sehen sie, können kommentieren und sie später einem Pull Request zuordnen.
      - situation: Du hast den Fehler auf einem eigenen Branch behoben und die Commits zu GitHub hochgeladen.
        question: Wie kommt deine Änderung in den Hauptbranch?
        options:
          - Ich pushe direkt auf main, ohne jemanden zu fragen
          - Ich öffne einen Pull Request und bitte um ein Review
          - Ich schicke die Dateien per E-Mail
        answer: 1
        explanation: Ein Pull Request ist der Vorschlag, deinen Branch in main zu übernehmen. Kolleg:innen prüfen ihn, bevor er gemergt wird.
---

Stell dir vor, du hast mit Git ein sauberes Repository auf deinem Laptop. Jeder Commit ist gespeichert,
du kannst jederzeit zurückspringen. Dann geht dein Laptop kaputt – oder eine Kollegin soll mitarbeiten.
Plötzlich merkst du: Git allein lebt auf **einem** Rechner. Du brauchst einen gemeinsamen Ort im Netz.
Genau dieser Ort ist [[github|GitHub]].

![Git läuft lokal auf deinem Rechner, GitHub speichert eine Kopie und bietet Zusatzfunktionen](/assets/github/git-und-github.svg)

## Git und GitHub sind zwei verschiedene Dinge

Diese Verwechslung ist so häufig, dass sie ganz am Anfang stehen muss. [[git|Git]] ist ein
[[programm|Programm]], das auf deinem [[computer|Computer]] läuft. Es verwaltet die Geschichte deines Projekts
in einem [[repository|Repository]]. Git braucht dafür weder Internet noch ein Konto.

GitHub ist ein **Online-Dienst**. Er speichert Kopien von Git-Repositorys auf [[server|Servern]] im
Internet und baut viele Funktionen darum herum: Aufgabenlisten, Diskussionen, Code-Reviews und
Automatisierung. Man nennt so einen Dienst eine [[code-hosting|Code-Hosting-Plattform]].

Eine Analogie: Git ist wie dein Fotoalbum zu Hause. Du klebst Bilder ein, sortierst sie, blätterst
zurück. GitHub ist wie ein gemeinsames Online-Album, in das die ganze Familie Bilder hochladen,
kommentieren und Verbesserungen vorschlagen kann. Das Album zu Hause funktioniert auch ohne das
Online-Album – aber teilen kannst du es erst mit dem Online-Album.

| | Git | GitHub |
|---|---|---|
| Was ist es? | Programm auf deinem Rechner | Plattform im Internet |
| Braucht Internet? | Nein | Ja |
| Braucht ein Konto? | Nein | Ja (zum Schreiben) |
| Kernaufgabe | Versionen speichern | Repositorys teilen und gemeinsam bearbeiten |
| Beispiele | `git commit`, `git branch`, `git log` | Issues, Pull Requests, Actions, Pages |

> [!MERKSATZ]
> Git speichert die Geschichte, GitHub teilt sie. Alles, was du mit Commits und Branches machst, ist
> Git. Alles rund um Zusammenarbeit im Browser ist GitHub.

## Was GitHub zusätzlich bietet

Aus Sicht von Git ist ein Repository auf GitHub einfach ein [[remote|Remote]]: eine weitere Kopie, mit
der du über [[push|push]] und [[pull|pull]] Commits austauschst. Die Commits darin sind exakt dieselben wie auf
deinem Rechner. Spannend wird GitHub durch alles, was **neben** den Commits passiert:

- **[[issue|Issues]]** – die Aufgabenliste eines Projekts: Fehlerberichte, Ideen, Fragen.
- **[[pull-request|Pull Requests]]** – Vorschläge, einen Branch in einen anderen zu übernehmen, mit
  Diskussion und [[code-review|Code-Review]].
- **[[github-actions|GitHub Actions]]** – Automatisierung: Bei jedem Push laufen zum Beispiel deine Tests
  auf GitHubs Servern.
- **[[github-pages|GitHub Pages]]** und **[[release|Releases]]** – Webseiten und fertige Versionen veröffentlichen.
- **Projects und Discussions** – Planungstafeln und Foren für ein Projekt.

Das alles zusammen nennt man oft **Social Coding**: Code wird nicht nur gespeichert, sondern öffentlich
oder im Team besprochen. Du siehst, wer was geändert hat, kannst Personen mit `@name` erwähnen und
Projekten folgen. Für [[open-source|Open-Source-Projekte]] ist GitHub so etwas wie der Marktplatz, auf dem
Menschen aus aller Welt gemeinsam an Software arbeiten.

## Wie ein Repository auf GitHub aussieht

Jedes Repository hat eine Adresse nach dem Muster `github.com/<besitzer>/<repository>`. Der Besitzer
ist entweder eine Person (dein Benutzername) oder eine **Organisation** – ein gemeinsames Konto für ein
Team oder eine Firma. Ein Beispiel:

```text title="Aufbau einer Repository-Adresse"
https://github.com/beispiel-org/todo-app
                   └─ Besitzer ─┘ └ Name ┘
```

Auf der Startseite eines Repositorys siehst du oben eine Leiste mit Reitern:

| Reiter | Inhalt |
|---|---|
| **Code** | Dateien, Branches, Commits und die `README.md` als Startseite |
| **Issues** | offene und geschlossene Aufgaben |
| **Pull requests** | Änderungsvorschläge und Reviews |
| **Actions** | Läufe der automatischen Workflows |
| **Projects** | Planungstafeln |
| **Settings** | Einstellungen (nur mit Admin-Rechten sichtbar) |

Die Datei `README.md` aus dem obersten Ordner zeigt GitHub automatisch unter der Dateiliste an. Sie ist
die Visitenkarte deines Projekts – mehr dazu im nächsten Modul.

## Alternativen zu GitHub

GitHub ist die größte Plattform, aber nicht die einzige. Weil alle mit normalen Git-Repositorys arbeiten,
kannst du ein Projekt jederzeit von einer Plattform zur anderen umziehen – die Commits gehen mit.
Was nicht automatisch mitkommt, sind die Zusatzdaten wie Issues oder Pull-Request-Diskussionen.

| Plattform | Besonderheit |
|---|---|
| **GitHub** | Größte Community, gehört zu Microsoft, GitHub Actions für Automatisierung |
| **[[gitlab|GitLab]]** | Sehr starke eingebaute CI/CD, kann auch selbst betrieben werden |
| **[[bitbucket|Bitbucket]]** | Von Atlassian, eng mit Jira verbunden, oft in Firmen im Einsatz |
| **[[forgejo|Forgejo]]** | Freie, schlanke Software, die du selbst hostest; Codeberg nutzt sie öffentlich |

Viele Begriffe heißen anderswo leicht anders: Bei GitLab spricht man von **Merge Requests** statt Pull
Requests. Das Prinzip ist identisch. Wenn du GitHub verstanden hast, findest du dich auf den anderen
Plattformen schnell zurecht.

> [!PRAXIS]
> Firmen wählen ihre Plattform oft nach Datenschutz und vorhandenen Werkzeugen. Wer schon Jira nutzt,
> landet gern bei Bitbucket, wer alles im eigenen Rechenzentrum betreiben will, bei GitLab oder Forgejo.
> In Bewerbungsgesprächen hilft es, wenn du sagen kannst: „Git kann ich, die Plattform ist für mich
> austauschbar.“

## Kostenlos, aber mit Grenzen

Ein persönliches GitHub-Konto ist kostenlos. Du kannst unbegrenzt öffentliche und private Repositorys
anlegen. Für GitHub Actions gibt es ein monatliches Kontingent an kostenlosen Minuten für private
Repositorys; für öffentliche Repositorys sind die Standard-Runner kostenlos. Bezahlte Pläne richten
sich an Teams und Firmen, die zum Beispiel feinere Rechte oder mehr Automatisierungsminuten brauchen.

> [!FEHLER]
> **„Ich habe GitHub gelöscht, jetzt ist mein Projekt weg!“** – Nein. Wenn du ein Repository auf GitHub
> löschst, bleibt dein lokales Repository unverändert, denn es ist eine eigenständige Kopie. Umgekehrt
> gilt aber auch: Commits, die du nie gepusht hast, existieren **nur** auf deinem Rechner. Pushe regelmäßig,
> wenn GitHub dein Backup sein soll.

> [!FEHLER]
> **Git und GitHub in einem Satz verwechseln.** „Ich habe es auf Git hochgeladen“ ist falsch – hochladen
> kannst du nur auf eine Plattform wie GitHub. Richtig ist: „Ich habe meine Commits zu GitHub gepusht.“
> Klingt pingelig, zeigt im Team aber, dass du das Modell verstanden hast.

## Zusammenfassung

- **Git** ist ein Programm auf deinem Rechner und speichert die Geschichte deines Projekts – ganz ohne Internet.
- **GitHub** ist eine Plattform im Netz, die Kopien von Git-Repositorys speichert und teilt.
- Für Git ist ein GitHub-Repository einfach ein **Remote**, mit dem du per push und pull Commits austauschst.
- GitHub ergänzt Git um **Issues, Pull Requests, Code-Reviews, Actions, Pages und Releases**.
- Alternativen sind **GitLab, Bitbucket und Forgejo** – die Commits sind überall dieselben.
- Ungepushte Commits gibt es nur lokal; ein gelöschtes GitHub-Repository löscht nichts auf deinem Rechner.
