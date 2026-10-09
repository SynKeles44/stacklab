---
title: Ein lokales Repository mit GitHub verbinden
summary: Wie du ein bestehendes Projekt mit remote add und push -u zu GitHub bringst und wie clone den umgekehrten Weg geht.
duration: 25
sources:
  - title: GitHub Docs – Lokal gehosteten Code zu GitHub hinzufügen
    url: https://docs.github.com/de/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github
  - title: git-remote Dokumentation
    url: https://git-scm.com/docs/git-remote
  - title: git-push Dokumentation
    url: https://git-scm.com/docs/git-push
quiz:
  - type: single
    question: Was bewirkt das `-u` in `git push -u origin main`?
    options:
      - Es lädt nur ungepushte Commits hoch
      - Es merkt sich origin/main als Upstream, damit später ein einfaches git push reicht
      - Es überschreibt die Commits auf GitHub
    answer: 1
    explanation: -u (lang --set-upstream) verknüpft deinen lokalen Branch mit dem Remote-Branch. Danach wissen git push, git pull und git status, wohin sie schauen sollen.
  - type: cloze
    text: Mit `git remote ___ origin <adresse>` trägst du GitHub als Remote ein. Alle Remotes mit Adressen zeigt `git remote ___`.
    blanks:
      - [add]
      - [-v]
    explanation: remote add legt einen neuen Namen für eine Adresse an, remote -v listet sie auf.
  - type: find-bug
    question: Ada hat auf GitHub ein Repository MIT README angelegt und will ihr lokales Projekt hochladen. Welcher Befehl wird scheitern?
    language: bash
    code: |
      git init
      git add .
      git commit -m "chore: initial commit"
      git remote add origin git@github.com:ada/blog.git
      git push -u origin main
    bug_line: 5
    explanation: Das GitHub-Repository hat bereits einen eigenen ersten Commit (die README). Die beiden Historien haben nichts gemeinsam, deshalb lehnt GitHub den Push ab. Lösung – leeres Repository anlegen oder vorher git pull --rebase origin main.
  - type: match
    question: Welcher Befehl passt zu welcher Situation?
    pairs:
      - { left: "git clone <adresse>", right: "Projekt existiert nur auf GitHub" }
      - { left: "git remote add origin <adresse>", right: "Projekt existiert nur lokal" }
      - { left: "git pull", right: "Neue Commits der Kolleg:innen holen" }
    explanation: clone holt ein fremdes Repository erstmals, remote add verbindet ein vorhandenes, pull holt später neue Commits.
tasks:
  - id: remote-und-push
    type: terminal
    title: Verbinde dein Repository mit einem Remote
    description: |
      Weil das Übungs-Terminal GitHub nicht erreicht, spielt ein lokales **Bare-Repository** den Server.
      Im Ordner `verbinden` liegen:

      - `notizen/` – dein lokales Repository mit zwei Commits auf `main`
      - `server/notizen.git` – ein leeres Bare-Repository, das so tut, als wäre es GitHub

      1. Wechsle in `notizen`.
      2. Trage `../server/notizen.git` als Remote mit dem Namen `origin` ein.
      3. Pushe `main` und setze dabei den Upstream.
      4. Prüfe mit `git status`, dass dein Branch „up to date with 'origin/main'“ ist.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: verbinden
    setup: |
      git init -q --bare server/notizen.git
      git init -q -b main notizen
      cd notizen
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      echo "# Notizen" > README.md
      git add README.md
      git commit -q -m "docs: add readme"
      echo "- GitHub lernen" > ideen.md
      git add ideen.md
      git commit -q -m "docs: add ideas"
    checks:
      - type: command
        run: git -C notizen remote get-url origin
        stdout_matches: "server/notizen\\.git$"
        message: Im Repository notizen fehlt der Remote origin mit der Adresse ../server/notizen.git.
      - type: command
        run: git -C server/notizen.git log --oneline main 2>/dev/null | wc -l
        stdout_matches: "^\\s*2\\s*$"
        message: Auf dem „Server“ sind noch nicht beide Commits angekommen. Pushe main zu origin.
      - type: command
        run: git -C notizen rev-parse --abbrev-ref main@{upstream}
        stdout_equals: origin/main
        message: Für main ist noch kein Upstream gesetzt. Nutze git push -u origin main.
    hints:
      - "`git remote add <name> <adresse>` legt einen Remote an."
      - "Relative Pfade funktionieren als Adresse: `../server/notizen.git`."
      - "`git push -u origin main` lädt hoch und setzt den Upstream in einem Schritt."
    solution: |
      ```bash
      cd verbinden/notizen
      git remote add origin ../server/notizen.git
      git remote -v
      git push -u origin main
      git status    # Your branch is up to date with 'origin/main'.
      ```
  - id: erster-push-github
    type: simulated
    title: Der erste Push zu GitHub
    description: |
      Du hast auf GitHub ein **leeres** Repository `du/rezepte` angelegt. GitHub zeigt dir dazu drei
      Befehle an. Führe sie in deinem lokalen Projekt aus:

      1. Remote `origin` mit der SSH-Adresse `git@github.com:du/rezepte.git` anlegen.
      2. Den aktuellen Branch in `main` umbenennen: `git branch -M main`.
      3. `main` pushen und den Upstream setzen.
    prompt: "du@laptop:~/rezepte$"
    steps:
      - expect: "^git\\s+remote\\s+add\\s+origin\\s+git@github\\.com:du/rezepte\\.git$"
        output: ""
        hint: git remote add origin git@github.com:du/rezepte.git
      - expect: "^git\\s+branch\\s+-M\\s+main$"
        output: ""
        hint: git branch -M main
      - expect: "^git\\s+push\\s+(-u|--set-upstream)\\s+origin\\s+main$"
        output: |
          Enumerating objects: 9, done.
          Counting objects: 100% (9/9), done.
          Writing objects: 100% (9/9), 1.04 KiB | 1.04 MiB/s, done.
          Total 9 (delta 0), reused 0 (delta 0)
          To github.com:du/rezepte.git
           * [new branch]      main -> main
          branch 'main' set up to track 'origin/main'.
        hint: git push -u origin main
    responses:
      - match: "^git\\s+remote\\s+-v$"
        output: |
          origin  git@github.com:du/rezepte.git (fetch)
          origin  git@github.com:du/rezepte.git (push)
      - match: "^git\\s+status"
        output: "On branch main"
---

Du hast ein Projekt auf deinem Rechner, sauber mit Git verwaltet, und auf GitHub ein frisches Repository.
Jetzt fehlt die Brücke dazwischen. Git muss erfahren, **wohin** es Commits schicken soll und welcher
lokale Branch zu welchem Branch auf GitHub gehört.

## Der Remote: ein Name für eine Adresse

Ein [[remote|Remote]] ist ein Eintrag in deinem Repository: ein kurzer Name plus die Adresse eines anderen
Repositorys. Der Standardname ist [[origin|origin]]. Das ist wie ein Kontakt im Telefonbuch – statt der
langen Nummer tippst du nur „Mama“.

```bash title="Remote anlegen und anzeigen"
git remote add origin git@github.com:du/notizen.git
git remote -v
# origin  git@github.com:du/notizen.git (fetch)
# origin  git@github.com:du/notizen.git (push)
```

| Befehl | Wirkung |
|---|---|
| `git remote add <name> <adresse>` | neuen Remote eintragen |
| `git remote -v` | alle Remotes mit Adresse anzeigen |
| `git remote set-url <name> <adresse>` | Adresse ändern, z. B. HTTPS → SSH |
| `git remote rename <alt> <neu>` | Remote umbenennen |
| `git remote remove <name>` | Remote entfernen |

> [!MERKSATZ]
> `origin` ist nur ein Spitzname, kein Zauberwort. Git weiß nichts von GitHub – es kennt nur Namen und Adressen.

## Der erste Push mit -u

Ein [[push|Push]] überträgt deine Commits zum Remote. Beim allerersten Push setzt du zusätzlich den
[[upstream-branch|Upstream]]:

```bash title="Erster Push"
git push -u origin main
```

`-u` verknüpft dein lokales `main` dauerhaft mit `origin/main`. Danach reicht `git push` oder
`git pull` ohne weitere Angaben. Und `git status` sagt dir, ob du vor- oder hinterherhinkst:

```text title="git status nach einem neuen Commit"
On branch main
Your branch is ahead of 'origin/main' by 1 commit.
```

GitHub zeigt bei einem leeren Repository genau diese Befehle an, meist zusammen mit `git branch -M main`.
Das benennt deinen aktuellen Branch in `main` um – falls dein Git noch `master` als
[[standard-branch|Standard-Branch]] verwendet.

## Leeres Repository oder mit README?

Hier passiert der häufigste Anfängerfehler. Wählst du auf GitHub beim Anlegen „Add README“, erstellt
GitHub einen eigenen ersten Commit. Dein lokales Repository hat aber auch einen ersten Commit. Die beiden
Historien haben **keinen gemeinsamen Anfang**.

| Ausgangslage | Richtiger Weg |
|---|---|
| Projekt existiert nur lokal | **leeres** GitHub-Repository, dann `remote add` + `push -u` |
| Projekt existiert nur auf GitHub | `git clone <adresse>` |
| Beide haben schon Commits | einmalig `git pull --rebase origin main`, dann pushen |

> [!FEHLER]
> **`! [rejected] main -> main (fetch first)`** beim ersten Push. GitHub hat Commits, die du nicht hast –
> meist die automatisch erzeugte README. Nicht mit `--force` drüberbügeln, sondern erst die fremden
> Commits holen: `git pull --rebase origin main`.

## Der umgekehrte Weg: clone

Existiert das Projekt schon auf GitHub, holst du es mit [[clone|clone]]. Git lädt alle Commits, erzeugt
dein Arbeitsverzeichnis und richtet `origin` samt Upstream automatisch ein.

```bash title="Ein Repository klonen"
git clone git@github.com:beispiel-org/todo-app.git
cd todo-app
git remote -v      # origin ist schon eingetragen
```

Später holst du neue Commits deiner Kolleg:innen mit `git pull` (holen und einbauen) oder nur mit
`git fetch` (holen, ohne deine Dateien zu ändern).

> [!PRAXIS]
> Im Team klonst du ein Projekt meist nur einmal pro Rechner. Danach ist dein Rhythmus: `git pull` am
> Morgen, arbeiten, committen, `git push` – und für jede Aufgabe ein eigener Branch, den du mit
> `git push -u origin <branch>` zum ersten Mal hochlädst.

## Zusammenfassung

- Ein **Remote** ist ein Name für die Adresse eines anderen Repositorys, üblicherweise `origin`.
- `git remote add origin <adresse>` verbindet ein lokales Projekt mit GitHub.
- `git push -u origin main` lädt hoch und setzt den **Upstream** – danach reicht `git push`.
- Für ein vorhandenes lokales Projekt legst du auf GitHub ein **leeres** Repository an.
- Existiert das Projekt nur auf GitHub, nutzt du `git clone`; `origin` ist dann schon eingerichtet.
