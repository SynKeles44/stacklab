---
title: Forks und Open Source
summary: Wie du mit einem Fork an fremden Projekten mitarbeitest, deinen Fork aktuell hältst und einen Beitrag so einreichst, dass er angenommen wird.
duration: 25
sources:
  - title: GitHub Docs – Informationen zu Forks
    url: https://docs.github.com/de/pull-requests/collaborating-with-pull-requests/working-with-forks/about-forks
  - title: GitHub Docs – Einen Fork synchronisieren
    url: https://docs.github.com/de/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork
  - title: GitHub Docs – Zu Open-Source-Projekten beitragen
    url: https://docs.github.com/de/get-started/exploring-projects-on-github/contributing-to-open-source
  - title: Open Source Guides – How to Contribute
    url: https://opensource.guide/how-to-contribute/
quiz:
  - type: match
    question: Welcher Remote zeigt wohin?
    pairs:
      - { left: "origin", right: "Dein Fork, in den du pushen darfst" }
      - { left: "upstream", right: "Das Original-Projekt, aus dem du Neuerungen holst" }
    explanation: Die Namen sind Konvention. origin entsteht beim Klonen deines Forks, upstream trägst du selbst ein.
  - type: cloze
    text: Neue Commits des Originals holst du mit `git ___ upstream` und baust sie mit `git merge upstream/main` ein. Danach aktualisiert `git push ___ main` deinen Fork.
    blanks:
      - [fetch]
      - [origin]
    explanation: fetch lädt die Commits nur herunter, merge baut sie in deinen Branch ein, push bringt sie in deinen Fork.
  - type: find-bug
    question: Ein Fork soll aktualisiert werden. Welche Zeile ist falsch?
    language: bash
    code: |
      git remote add upstream https://github.com/projekt/app.git
      git fetch upstream
      git switch main
      git merge origin/main
      git push origin main
    bug_line: 4
    explanation: Die Neuerungen liegen in upstream/main, nicht in origin/main. origin ist dein eigener, veralteter Fork.
  - type: cloze
    text: Mit `git commit ___` fügst du eine Zeile `Signed-off-by:` an deine Commit-Message an. Issues für Neulinge tragen oft das Label `good ___ issue`.
    blanks:
      - [-s, --signoff]
      - [first]
    explanation: Manche Projekte verlangen das Sign-off (DCO). Das Label good first issue markiert einsteigerfreundliche Aufgaben.
  - type: single
    question: Du findest eine Sicherheitslücke in einer beliebten Bibliothek. Wie meldest du sie?
    options:
      - In einem öffentlichen Issue mit genauer Anleitung
      - Vertraulich über den Weg, den SECURITY.md beschreibt (z. B. private Sicherheitsmeldung)
      - Auf Social Media, damit alle gewarnt sind
    answer: 1
    explanation: Öffentliche Details würden Angreifern helfen, bevor es einen Fix gibt. SECURITY.md nennt den vertraulichen Meldeweg.
tasks:
  - id: fork-diagramm
    type: diagram
    title: Beschrifte die drei Repositorys
    description: Im Fork-Workflow gibt es drei Repositorys. Ordne die Namen den Kästen zu.
    image: /assets/github/fork-workflow-leer.svg
    slots:
      - { x: 22, y: 21, answer: upstream (Original) }
      - { x: 78, y: 21, answer: origin (dein Fork) }
      - { x: 50, y: 77, answer: lokales Repository }
    distractors: [Staging-Bereich, GitHub Actions]
    hints:
      - Der Pull Request geht vom Fork zurück zum Original.
  - id: fork-synchronisieren
    type: terminal
    title: Halte deinen Fork aktuell
    description: |
      Im Ordner `fork-sync` liegen drei Repositorys, die den Fork-Workflow nachspielen:

      - `upstream.git` – das Original-Projekt (es hat inzwischen einen neuen Commit)
      - `origin.git` – dein Fork, der noch auf dem alten Stand ist
      - `lokal/` – dein Klon des Forks (`origin` ist schon eingerichtet)

      1. Wechsle in `lokal` und trage `../upstream.git` als Remote `upstream` ein.
      2. Hole die Neuerungen aus `upstream`.
      3. Baue `upstream/main` in deinen lokalen `main` ein.
      4. Pushe `main` zu `origin`, damit auch dein Fork aktuell ist.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: fork-sync
    setup: |
      git init -q --bare -b main upstream.git
      git clone -q upstream.git arbeit 2>/dev/null
      cd arbeit
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      echo "# App" > README.md
      git add README.md
      git commit -q -m "docs: add readme"
      git push -q origin main
      cd ..
      git clone -q --bare upstream.git origin.git
      cd arbeit
      echo "console.log('v2')" > app.js
      git add app.js
      git commit -q -m "feat: add app"
      git push -q origin main
      cd ..
      rm -rf arbeit
      git clone -q origin.git lokal
      git -C lokal config user.name "Stacklab"
      git -C lokal config user.email "stacklab@example.com"
    checks:
      - type: command
        run: git -C lokal remote get-url upstream
        stdout_matches: "upstream\\.git$"
        message: Im lokalen Repository fehlt der Remote upstream mit der Adresse ../upstream.git.
      - type: command
        run: git -C lokal ls-tree --name-only main app.js
        stdout_equals: app.js
        message: Dein lokaler main enthält den neuen Commit aus upstream noch nicht (app.js fehlt).
      - type: command
        run: test "$(git -C origin.git rev-parse main)" = "$(git -C upstream.git rev-parse main)"
        message: Dein Fork (origin.git) ist noch nicht auf dem Stand des Originals. Pushe main zu origin.
    hints:
      - "`git remote add upstream ../upstream.git`"
      - "`git fetch upstream` lädt die Commits, `git merge upstream/main` baut sie ein."
      - "Zum Schluss `git push origin main`."
    solution: |
      ```bash
      cd fork-sync/lokal
      git remote add upstream ../upstream.git
      git fetch upstream
      git switch main
      git merge upstream/main     # Fast-Forward
      git push origin main
      ```
---

Du findest in einem [[open-source|Open-Source]]-Projekt einen Fehler und willst ihn beheben. Pushen
darfst du dort nicht – sonst könnte jeder fremde Projekte verändern. Die Lösung heißt **Fork**.

![Der Fork-Workflow: upstream, origin und dein lokales Repository](/assets/github/fork-workflow.svg)

## Fork, origin und upstream

Ein [[fork|Fork]] ist deine eigene Kopie eines fremden Repositorys **auf GitHub**, in die du pushen
darfst. GitHub merkt sich die Verwandtschaft – deshalb kannst du später einen Pull Request an das
Original stellen. Du forkst auf GitHub und klonst dann deinen Fork. Lokal kennst du zwei Remotes:

| Remote | Zeigt auf | Du … |
|---|---|---|
| `origin` | deinen Fork `github.com/du/app` | pushst hierhin |
| `upstream` | das Original `github.com/projekt/app` | holst von hier Neuerungen |

```bash title="Fork einrichten"
git clone git@github.com:du/app.git
cd app
git remote add upstream https://github.com/projekt/app.git
```

`gh repo fork projekt/app --clone` erledigt Fork, Klon und beide Remotes in einem Schritt. Prüfen kannst du das
Ergebnis jederzeit mit `git remote -v` – dort müssen beide Namen mit ihren Adressen stehen.

> [!MERKSATZ]
> Pushen nach **origin**, holen von **upstream**. Der Pull Request geht vom Fork zum Original.

## Den Fork aktuell halten

Dein Fork bleibt auf dem Stand des Forkens stehen. Vor jeder neuen Arbeit holst du die Neuerungen:

```bash title="Fork synchronisieren"
git switch main
git fetch upstream
git merge upstream/main
git push origin main
```

Alternativ: Knopf **Sync fork** auf GitHub oder `gh repo sync du/app`. Danach legst du deinen
Feature-Branch von diesem aktuellen `main` an und pushst ihn zu `origin`.

> [!FEHLER]
> **Auf dem main deines Forks entwickeln.** Dann weicht er vom Original ab, und jedes Synchronisieren
> erzeugt Konflikte. Halte `main` sauber und arbeite immer auf eigenen Branches.

## Die Spielregeln eines Projekts

Bevor du programmierst, liest du die **Community Health Files**:

| Datei | Inhalt |
|---|---|
| [[contributing|CONTRIBUTING.md]] | Entwicklungsumgebung, Code-Stil, PR-Ablauf |
| `CODE_OF_CONDUCT.md` | Verhaltensregeln für den Umgang miteinander |
| `SECURITY.md` | wie Sicherheitslücken **vertraulich** gemeldet werden |
| `LICENSE` | was du mit dem Code tun darfst |

Einsteigerfreundliche Aufgaben tragen das Label `good first issue`. Mit deinem Beitrag stellst du
deinen Code unter die [[lizenz|Lizenz]] des Projekts – permissiv (MIT, Apache 2.0) oder Copyleft
(GPL, die veränderte Versionen offen hält). Manche Projekte verlangen ein **Sign-off** per
`git commit -s`, das eine Zeile `Signed-off-by:` anhängt.

## Ein Beitrag, der angenommen wird

1. Im Issue kurz Bescheid geben – bei großen Änderungen vorher abstimmen.
2. Fork synchronisieren, Branch anlegen, klein bleiben: ein Thema, Tests dazu.
3. Branch zu `origin` pushen und den PR an das Original stellen (`gh pr create --repo projekt/app`).
4. Vorlage ausfüllen, `Closes #…` verknüpfen, freundlich auf Reviews reagieren.

> [!PRAXIS]
> Betreuer:innen arbeiten oft ehrenamtlich. Ein kleiner, begründeter PR mit Tests wird meist in wenigen
> Tagen gemergt. Und: Sicherheitslücken meldest du nie in einem öffentlichen Issue, sondern über den Weg
> aus `SECURITY.md`.

## Zusammenfassung

- Ein **Fork** ist deine Kopie eines fremden Repositorys auf GitHub, in die du pushen darfst.
- Lokal: **origin** = dein Fork, **upstream** = das Original.
- Synchronisieren: `git fetch upstream`, `git merge upstream/main`, `git push origin main`.
- Erst **CONTRIBUTING.md** und Lizenz lesen, dann klein und abgestimmt beitragen.
- Manche Projekte verlangen ein **Sign-off** (`git commit -s`).
