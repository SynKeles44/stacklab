---
title: Die GitHub CLI gh
summary: Mit dem Kommandozeilenwerkzeug gh legst du Repositorys an, öffnest Issues und Pull Requests, ohne den Browser zu verlassen.
duration: 25
sources:
  - title: GitHub CLI – Handbuch
    url: https://cli.github.com/manual/
  - title: GitHub Docs – Informationen zu GitHub CLI
    url: https://docs.github.com/de/github-cli/github-cli/about-github-cli
  - title: gh repo create
    url: https://cli.github.com/manual/gh_repo_create
quiz:
  - type: single
    question: Was ist der Unterschied zwischen git und gh?
    options:
      - Es gibt keinen, gh ist nur eine Abkürzung
      - git verwaltet Commits und Branches, gh spricht mit der Plattform GitHub (Issues, PRs, Repos)
      - gh ersetzt git vollständig
    answer: 1
    explanation: git arbeitet mit deinem Repository. gh ruft die GitHub-API auf – für alles, was es nur auf GitHub gibt.
  - type: match
    question: Ordne jedem gh-Befehl seine Wirkung zu.
    pairs:
      - { left: "gh auth login", right: "Bei GitHub anmelden und Git-Zugang einrichten" }
      - { left: "gh repo clone du/app", right: "Repository klonen" }
      - { left: "gh pr checkout 42", right: "Branch von Pull Request 42 lokal auschecken" }
      - { left: "gh issue list", right: "Offene Issues anzeigen" }
    explanation: Die Befehle folgen immer dem Muster gh <bereich> <aktion>.
  - type: cloze
    text: "Die gh-Befehle folgen dem Muster `gh <bereich> <aktion>`, zum Beispiel `gh ___ create` für einen neuen Pull Request."
    blanks:
      - [pr]
    explanation: Bereiche sind etwa repo, issue, pr, release, run und workflow.
  - type: multiple
    question: Welche Aussagen über `gh repo create notizen --private --source=. --push` stimmen?
    options:
      - Es legt auf GitHub ein privates Repository notizen an
      - Es trägt das neue Repository als Remote origin ein
      - Es pusht die vorhandenen lokalen Commits
      - Es löscht dein lokales Repository
    answers: [0, 1, 2]
    explanation: --source=. verbindet das aktuelle Verzeichnis, --push lädt die Commits gleich hoch. Lokal wird nichts gelöscht.
tasks:
  - id: gh-workflow
    type: simulated
    title: Projekt mit gh veröffentlichen
    description: |
      Du bist in deinem lokalen Repository `notizen` (mit Commits) und hast gh schon mit
      `gh auth login` eingerichtet.

      1. Prüfe deine Anmeldung: `gh auth status`.
      2. Lege auf GitHub ein **privates** Repository aus dem aktuellen Ordner an und pushe gleich:
         `gh repo create notizen --private --source=. --push`.
      3. Lege ein Issue mit dem Titel `README ergänzen` an: `gh issue create --title "README ergänzen" --body "Installation fehlt"`.
      4. Zeige alle offenen Issues: `gh issue list`.
    prompt: "du@laptop:~/notizen$"
    steps:
      - expect: "^gh\\s+auth\\s+status$"
        output: |
          github.com
            ✓ Logged in to github.com account du (keyring)
            - Active account: true
            - Git operations protocol: https
            - Token: gho_************************************
        hint: gh auth status
      - expect: "^gh\\s+repo\\s+create\\s+notizen\\s+(?=.*--private)(?=.*--source[= ]\\.)(?=.*--push).*$"
        output: |
          ✓ Created repository du/notizen on github.com
            https://github.com/du/notizen
          ✓ Added remote https://github.com/du/notizen.git
          ✓ Pushed commits to https://github.com/du/notizen.git
        hint: gh repo create notizen --private --source=. --push
      - expect: "^gh\\s+issue\\s+create\\s+(?=.*--title\\s+[\"']README ergänzen[\"']).*$"
        output: |
          Creating issue in du/notizen

          https://github.com/du/notizen/issues/1
        hint: gh issue create --title "README ergänzen" --body "Installation fehlt"
      - expect: "^gh\\s+issue\\s+list$"
        output: |
          Showing 1 of 1 open issue in du/notizen

          ID  TITLE             LABELS  UPDATED
          #1  README ergänzen           less than a minute ago
        hint: gh issue list
    responses:
      - match: "^git\\s+remote\\s+-v$"
        output: |
          origin  https://github.com/du/notizen.git (fetch)
          origin  https://github.com/du/notizen.git (push)
      - match: "^gh\\s+--help$"
        output: "Work seamlessly with GitHub from the command line. USAGE: gh <command> <subcommand> [flags]"
  - id: gh-reihenfolge
    type: order
    title: Vom neuen Rechner zum ersten Pull Request
    description: Bring die Schritte in die richtige Reihenfolge, mit denen du auf einem frischen Rechner mit gh an einem Team-Projekt arbeitest.
    items:
      - "gh auth login – anmelden"
      - "gh repo clone beispiel-org/shop – Projekt holen"
      - "git switch -c fix/warenkorb – Branch anlegen"
      - "Code ändern und git commit"
      - "git push -u origin fix/warenkorb"
      - "gh pr create – Pull Request öffnen"
    hints:
      - Ohne Anmeldung kann gh nichts klonen, ohne Push gibt es nichts für einen Pull Request.
---

Ein Bug fällt dir beim Programmieren auf. Du müsstest jetzt den Browser öffnen, das Repository suchen,
auf „New issue“ klicken, Text eingeben. Mit der GitHub CLI tippst du stattdessen eine Zeile im Terminal
und arbeitest weiter. Gerade bei wiederkehrenden Aufgaben spart das viel Zeit.

## Was gh ist – und was nicht

Die [[github-cli|GitHub CLI]] heißt als Befehl `gh`. Sie ist ein eigenes Programm neben Git:

| Werkzeug | Spricht mit | Beispiele |
|---|---|---|
| `git` | deinem Repository (und Remotes) | commit, branch, push |
| `gh` | der GitHub-Plattform über deren [[api|API]] | Repositorys, Issues, Pull Requests, Actions |

gh ersetzt Git also nicht, sondern ergänzt es um alles, was es nur auf GitHub gibt. Du installierst es
über den [[paketmanager|Paketmanager]] deines Systems, z. B. `brew install gh` oder `winget install GitHub.cli`.

## Anmelden mit gh auth login

```bash title="Einmalig anmelden"
gh auth login
```

gh fragt dich interaktiv: GitHub.com oder ein Firmen-Server? HTTPS oder SSH? Danach öffnet sich der
Browser, und du bestätigst einen einmaligen Code. gh speichert sein Token im Schlüsselbund und richtet
auf Wunsch Git gleich mit ein. Damit funktionieren auch `git push` über HTTPS ohne weiteres Token.

`gh auth status` zeigt dir jederzeit, mit welchem Konto du angemeldet bist. Arbeitest du mit mehreren
Konten, etwa privat und für die Firma, wechselst du mit `gh auth switch` zwischen ihnen.

> [!MERKSATZ]
> `gh auth login` ist der bequemste Weg, Git und GitHub auf einem neuen Rechner zu verbinden.

## Das Befehlsmuster

Alle Befehle folgen dem Muster `gh <bereich> <aktion> [optionen]`:

```bash title="Häufige gh-Befehle"
gh repo create notizen --private --source=. --push   # lokales Projekt veröffentlichen
gh repo clone beispiel-org/shop                      # klonen
gh issue create --title "Login-Fehler" --label bug   # Issue anlegen
gh issue list --label bug                            # Issues filtern
gh pr create --title "fix: Warenkorb" --draft        # Pull Request als Entwurf
gh pr list                                           # offene Pull Requests
gh pr checkout 42                                    # Branch von PR 42 auschecken
gh pr merge 42 --squash                              # PR mergen
gh run list                                          # letzte Actions-Läufe
```

Ohne Optionen fragen viele Befehle interaktiv nach, etwa `gh pr create` nach Titel und Beschreibung.
In Skripten gibst du alles als Optionen an. Mit `--web` öffnet fast jeder Befehl die passende Seite
im Browser.

> [!PRAXIS]
> `gh pr checkout 42` ist im Review-Alltag Gold wert. Statt herauszufinden, wie der Branch einer
> Kollegin heißt, holst du ihren Pull Request mit einer Zeile auf deinen Rechner und testest ihn lokal.

## Wenn gh nicht reicht: gh api

Für alles ohne eigenen Befehl gibt es `gh api`. Es schickt einen Request an die
[[rest-api|REST-API]] und kümmert sich um Anmeldung und Header:

```bash title="Labels eines Issues per API setzen"
gh api repos/du/notizen/issues/1/labels -f "labels[]=docs"
```

> [!FEHLER]
> **gh im falschen Ordner.** gh erkennt das Repository am Remote des aktuellen Ordners. Bist du
> außerhalb eines Repositorys, fragt es nach oder meldet einen Fehler. Mit `-R besitzer/repo` gibst du
> das Ziel ausdrücklich an: `gh issue list -R beispiel-org/shop`.

## Zusammenfassung

- `gh` ist die **GitHub CLI** und ergänzt Git um Plattform-Funktionen wie Issues und Pull Requests.
- `gh auth login` meldet dich an und richtet den Git-Zugang ein; `gh auth status` prüft ihn.
- Alle Befehle folgen `gh <bereich> <aktion>`: `repo`, `issue`, `pr`, `run`, `release` …
- `gh repo create … --source=. --push` veröffentlicht ein lokales Projekt in einem Schritt.
- `gh pr checkout <nummer>` holt einen Pull Request zum Testen auf deinen Rechner.
- `gh api` erreicht jeden REST-Endpunkt, für den es keinen eigenen Befehl gibt.
