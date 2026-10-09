---
title: Remotes, Push und Pull
summary: Was ein Remote ist, was beim Klonen passiert und wie du Commits mit push, fetch und pull austauschst – auch wenn ein Push abgelehnt wird.
duration: 25
sources:
  - title: Pro Git – Mit Remotes arbeiten
    url: https://git-scm.com/book/de/v2/Git-Grundlagen-Mit-Remotes-arbeiten
  - title: Pro Git – Remote-Branches
    url: https://git-scm.com/book/de/v2/Git-Branching-Remote-Branches
  - title: git-push Dokumentation
    url: https://git-scm.com/docs/git-push
  - title: git-pull Dokumentation
    url: https://git-scm.com/docs/git-pull
quiz:
  - type: multiple
    question: Was erledigt `git clone server.git app` alles auf einmal?
    options:
      - Es kopiert die komplette Historie mit allen Commits.
      - Es legt ein Remote namens `origin` an, das auf `server.git` zeigt.
      - Es legt Remote-Tracking-Branches wie `origin/main` an.
      - Es checkt den Standard-Branch im Arbeitsverzeichnis aus.
      - Es lädt nur den neuesten Stand ohne Historie herunter.
    answers: [0, 1, 2, 3]
    explanation: >
      Ein Klon ist eine vollständige Kopie samt Historie. Git richtet `origin` ein, legt für jeden Branch des
      Remotes einen Remote-Tracking-Branch an und checkt den Standard-Branch aus. Nur mit Sonderoptionen wie
      `--depth 1` bekommst du eine gekürzte Historie.
  - type: single
    question: Was verändert `git fetch` in deinem Repository?
    options:
      - Es ändert deine Dateien im Arbeitsverzeichnis.
      - Es verschiebt deinen lokalen Branch `main` auf den neuesten Stand.
      - Es aktualisiert nur die Remote-Tracking-Branches wie `origin/main`.
      - Es schickt deine Commits zum Server.
    answer: 2
    explanation: >
      `fetch` ist der „Nur mal nachsehen“-Befehl. Er lädt neue Commits herunter und verschiebt `origin/main`,
      lässt aber deinen Branch `main` und deine Dateien in Ruhe. Erst `merge` oder `rebase` bringt die
      Änderungen in deinen Branch.
  - type: cloze
    text: "`git pull` ist eine Abkürzung für `git ___` und danach `git merge`. Mit `git pull ___` wird statt des Merges ein Rebase ausgeführt."
    blanks:
      - [fetch]
      - ["--rebase"]
    explanation: >
      Pull holt ab (fetch) und integriert dann. Standardmäßig per Merge, mit `--rebase` oder der Einstellung
      `pull.rebase true` per Rebase.
  - type: match
    question: "Was bedeutet die erste Zeile von `git status -sb`?"
    pairs:
      - { left: "## main...origin/main", right: "Lokal und Remote-Stand sind gleich" }
      - { left: "## main...origin/main [ahead 2]", right: "Du hast 2 Commits, die noch nicht gepusht sind" }
      - { left: "## main...origin/main [behind 3]", right: "Auf dem Remote liegen 3 Commits, die du noch nicht integriert hast" }
      - { left: "## main...origin/main [ahead 1, behind 1]", right: "Die Branches sind auseinandergelaufen" }
      - { left: "## main", right: "Für den Branch ist kein Upstream eingestellt" }
    explanation: >
      Git vergleicht deinen Branch mit seinem Upstream – und zwar mit dem Stand vom letzten fetch. Nach einem
      `git fetch` sind die Zahlen aktuell.
  - type: find-bug
    question: Linus hat einen neuen Branch angelegt und will ihn erstmals pushen, sodass später ein einfaches `git push` reicht. In welcher Zeile liegt der Fehler?
    language: bash
    code: |
      git switch -c feat/login
      git commit -am "feat: add login form"
      git push origin
      git status -sb
    bug_line: 3
    explanation: >
      Für einen neuen Branch gibt es noch keinen Upstream – `git push origin` bricht ab und schlägt
      `--set-upstream` vor. Richtig ist `git push -u origin feat/login`. Das `-u` merkt sich die Verbindung,
      danach genügen `git push` und `git pull`.
tasks:
  - id: remote-ablauf-beschriften
    type: diagram
    title: Beschrifte den Weg zwischen lokal und Remote
    description: >
      Links siehst du deinen Rechner mit zwei Bereichen, rechts das Remote. Ordne die Kästen und die
      Pfeil-Beschriftungen richtig zu. Achte auf die Pfeilrichtung: Was geht hin, was kommt zurück?
    image: /assets/git/remote-ablauf-leer.svg
    slots:
      - { x: 14, y: 45, answer: Arbeitsverzeichnis }
      - { x: 40, y: 45, answer: Lokales Repository }
      - { x: 84, y: 45, answer: Remote }
      - { x: 60, y: 30, answer: git push }
      - { x: 60, y: 44, answer: git fetch }
      - { x: 50, y: 81, answer: git pull }
    distractors: [git commit, Staging-Bereich]
    hints:
      - Nur ein Pfeil zeigt vom Rechner weg – das ist der, mit dem du etwas hochlädst.
      - "`fetch` holt nur ins lokale Repository, `pull` geht bis ins Arbeitsverzeichnis durch."
  - id: push-abgelehnt
    type: terminal
    title: Abgelehnter Push – und wie du ihn löst
    description: |
      Im Ordner `push-pull` spielt `server.git` das Team-Repository. Daneben liegen zwei Klone:
      `ich` (deiner, Identität „Ada Lovelace“ ist schon eingerichtet) und `kollegin`. Die Kollegin hat
      nach deinem Klonen bereits einen Commit gepusht – davon weißt du noch nichts. Außerdem ist in
      `ich` für `main` (absichtlich) **kein** Upstream eingestellt.

      1. Wechsle in `ich`, lege eine Datei `TODO.md` mit einer Zeile Text an und committe sie.
      2. Versuche `git push origin main` und lies die Fehlermeldung.
      3. Hole die Commits der Kollegin und integriere sie, z. B. mit `git pull --rebase origin main`.
      4. Pushe erneut und setze dabei den Upstream: `git push -u origin main`.
      5. Prüfe mit `git status -sb`, dass dein Branch weder ahead noch behind ist.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: push-pull
    setup: |
      git init -q --bare server.git
      git init -q vorlage
      cd vorlage
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      printf '# Team-App\n' > README.md
      git add README.md
      git commit -q -m "docs: add readme"
      printf 'console.log("Hallo");\n' > app.js
      git add app.js
      git commit -q -m "feat: add app entry point"
      git push -q ../server.git main
      cd ..
      rm -rf vorlage
      git clone -q server.git ich
      git -C ich config user.name "Ada Lovelace"
      git -C ich config user.email "ada@example.com"
      git -C ich branch -q --unset-upstream main
      git clone -q server.git kollegin
      cd kollegin
      git config user.name "Grace Hopper"
      git config user.email "grace@example.com"
      printf '# Changelog\n\n- Erste Version\n' > CHANGELOG.md
      git add CHANGELOG.md
      git commit -q -m "docs: add changelog"
      git push -q origin main
    checks:
      - type: command
        run: git -C server.git log --format=%an main | grep -c "Ada Lovelace"
        stdout_matches: "^\\s*[1-9][0-9]*\\s*$"
        message: Auf dem Server fehlt noch ein Commit von dir (Ada Lovelace) – committe in ich und pushe.
      - type: command
        run: 'git -C server.git log --format=%s main | grep -c "docs: add changelog"'
        stdout_matches: "^\\s*1\\s*$"
        message: Der Commit der Kollegin (docs add changelog) muss auf dem Server erhalten bleiben.
      - type: command
        run: test "$(git -C ich rev-parse main)" = "$(git -C server.git rev-parse main)" && echo gleich
        stdout_equals: gleich
        message: Dein lokales main und main auf dem Server sind noch nicht gleich – hole ab, integriere und pushe.
      - type: command
        run: git -C ich rev-parse --abbrev-ref main@{upstream}
        stdout_equals: origin/main
        message: Für main ist noch kein Upstream gesetzt – pushe mit git push -u origin main.
      - type: command
        run: git -C ich status --porcelain | wc -l
        stdout_matches: "^\\s*0\\s*$"
        message: In ich gibt es noch uncommittete Änderungen.
    hints:
      - Die Ablehnung bedeutet nicht, dass etwas kaputt ist – auf dem Server liegt nur ein Commit, den du noch nicht hast.
      - "`git pull --rebase origin main` holt den Commit der Kollegin und setzt deinen Commit obendrauf."
      - "Ohne `-u` merkt sich Git die Verbindung nicht. Prüfe danach mit `git status -sb`: Dort sollte `## main...origin/main` stehen."
    solution: |
      ```bash
      cd push-pull
      cd ich
      echo "- Tests schreiben" > TODO.md
      git add TODO.md
      git commit -m "docs: add todo list"
      git push origin main            # wird abgelehnt (fetch first)
      git pull --rebase origin main   # Commit der Kollegin holen, eigenen obendrauf
      git push -u origin main         # klappt jetzt und setzt den Upstream
      git status -sb
      ```
---

Bisher hast du allein in einem Repository gearbeitet. Sobald eine Kollegin mitmacht, stellt sich die
Frage: Wie kommen deine Commits zu ihr – und ihre zu dir? Die Antwort heißt **Remote**, und die drei
Befehle dazu sind `push`, `fetch` und `pull`.

## Remotes und git clone

Stell dir dein Smartphone-Adressbuch vor: Du tippst auf „Mama“, nicht auf die lange Nummer. Ein
[[remote|Remote]] funktioniert genauso. Es ist ein **Kurzname** für die Adresse eines anderen
[[repository|Repositorys]] – auf GitHub, einem Firmen-[[server|Server]] oder in einem Nachbarordner.

Ein Remote ist keine offene Verbindung. Git arbeitet offline und nimmt nur Kontakt auf, wenn du Daten
austauschst. Den Rest der Zeit ist das Remote nur ein Eintrag in `.git/config`. Die Adresse gibt es in
drei Formen:

| Art | Beispiel |
|---|---|
| [[https|HTTPS]] | `https://github.com/dein-name/app.git` |
| [[ssh|SSH]] | `git@github.com:dein-name/app.git` |
| Lokaler [[pfad|Pfad]] | `../server.git` – ideal zum Üben |

Mit `git remote -v` siehst du alle Remotes, mit `git remote add <name> <adresse>` legst du ein weiteres
an. Beides ändert nur deine lokale Konfiguration, auf dem Server passiert nichts.

Mit [[clone|`git clone`]] holst du ein bestehendes Projekt auf deinen Rechner. Dabei passiert mehr als
ein Download:

| Schritt | Was passiert |
|---|---|
| Historie kopieren | Alle Commits, Branches und Tags landen in deinem `.git`-Ordner. |
| Remote anlegen | Die Quelle wird als [[origin]] eingetragen (`git remote -v`). |
| Remote-Tracking-Branches | Für jeden Server-Branch entsteht ein Lesezeichen wie `origin/main`. |
| Auschecken | Der [[standard-branch|Standard-Branch]] landet in deinem [[arbeitsverzeichnis|Arbeitsverzeichnis]]. |

Ein [[remote-tracking-branch|Remote-Tracking-Branch]] wie `origin/main` ist Gits Erinnerung daran, wo
`main` auf dem Server stand, als du zuletzt nachgesehen hast. Auf dem Server selbst liegt meist ein
[[bare-repository|Bare Repository]] (`git init --bare`): ein Repository ohne Arbeitsverzeichnis, weil
dort niemand Dateien bearbeitet.

![Lokales Repository und Remote: push, fetch, clone und pull](/assets/git/remote-ablauf.svg)

> [!MERKSATZ]
> Ein Remote ist ein Name für eine Adresse – mehr nicht. Daten fließen nur, wenn du `push`, `fetch`
> oder `pull` aufrufst.

## push – und warum er abgelehnt wird

Mit [[push|`git push`]] schickst du Commits zu einem Remote:

```bash title="Terminal"
git push origin main
```

Lies das als: „Schicke meinen Branch `main` zu `origin` und setze dort `main` auf denselben Commit.“
Übertragen werden nur Commits – keine uncommitteten Änderungen.

Manchmal antwortet Git so:

```text title="Abgelehnter Push"
 ! [rejected]        main -> main (fetch first)
error: failed to push some refs to 'github.com:dein-name/team-app.git'
hint: Updates were rejected because the remote contains work that you do not
hint: have locally. ...
```

Ein Push wird nur angenommen, wenn er ein [[fast-forward|Fast-Forward]] ist: Dein Stand muss auf dem
Stand des Servers aufbauen. Hat die Kollegin inzwischen gepusht, würde dein Push ihren Commit
verdrängen – also lehnt Git ab.

> [!FEHLER]
> **Ein abgelehnter Push mit `git push --force` „lösen“.** Damit löschst du die Commits der anderen vom
> Server. Richtig ist: erst abholen und integrieren (z. B. `git pull --rebase`), dann erneut pushen.

## Upstream: die feste Verbindung

Immer `origin main` zu tippen ist mühsam. Ein lokaler Branch kann sich merken, zu welchem Branch auf dem
Remote er gehört – das ist sein [[upstream-branch|Upstream-Branch]]. Beim ersten Push setzt du ihn mit
`-u` (lang: `--set-upstream`):

```bash title="Neuen Branch zum ersten Mal pushen"
git switch -c feat/suche
git push -u origin feat/suche
```

Die letzte Zeile der Ausgabe bestätigt es: `branch 'feat/suche' set up to track 'origin/feat/suche'`.
Danach genügen `git push` und `git pull`. Nach einem Klon ist der Upstream für `main` schon gesetzt.
Den Zustand zeigt dir `git status -sb`:

| Erste Zeile | Bedeutung |
|---|---|
| `## main...origin/main` | Gleichstand |
| `## main...origin/main [ahead 2]` | Zwei eigene Commits sind noch nicht gepusht |
| `## main...origin/main [behind 3]` | Drei Commits vom Remote fehlen dir |
| `## main...origin/main [ahead 1, behind 1]` | Beide Seiten haben Neues |
| `## main` | Kein Upstream eingestellt |

> [!ACHTUNG]
> Die Zahlen vergleichen mit `origin/main` – also mit dem Stand vom **letzten fetch**. Erst `git fetch`
> macht die Anzeige aktuell.

## fetch und pull

[[fetch|`git fetch`]] ist wie Post aus dem Briefkasten holen, ohne sie zu öffnen. Git lädt neue Commits
und verschiebt `origin/main`. Dein Branch und deine Dateien bleiben unverändert – fetch ist immer
gefahrlos.

```bash title="Abholen und anschauen"
git fetch
git log --oneline main..origin/main   # Was ist neu auf dem Server?
```

[[pull|`git pull`]] macht zwei Schritte: `fetch` und dann Integrieren. Hast du selbst nichts Neues,
spult Git per Fast-Forward vor. Haben beide Seiten neue Commits, entscheidet Git 2.47 nicht heimlich:

```text title="git pull bei auseinandergelaufenen Branches"
hint: You have divergent branches and need to specify how to reconcile them.
fatal: Need to specify how to reconcile divergent branches.
```

Du wählst pro Aufruf oder dauerhaft:

| Befehl | Wirkung |
|---|---|
| `git pull --rebase` | Eigene Commits auf die neuen setzen ([[rebase]]) |
| `git pull --no-rebase` | Einen [[merge|Merge]]-Commit erzeugen |
| `git pull --ff-only` | Nur vorspulen, sonst abbrechen |
| `git config --global pull.rebase true` | Rebase als Standard für alle Pulls |

> [!PRAXIS]
> Viele Teams setzen `pull.rebase true`, damit keine „Merge branch 'main'“-Commits entstehen. Und in
> vielen Teams ist `main` geschützt: Du pushst nur eigene Branches und bringst sie per
> [[pull-request|Pull Request]] ein.

## Zusammenfassung

- Ein **Remote** ist ein Kurzname für eine Adresse; `git clone` kopiert die Historie, legt `origin` und
  `origin/main` an und checkt den Standard-Branch aus.
- `git push` klappt nur als Fast-Forward. Abgelehnt heißt: erst holen und integrieren, dann pushen.
- `git push -u origin <branch>` setzt den **Upstream**; danach reichen `git push` und `git pull`.
- `git fetch` aktualisiert nur `origin/...` und ist immer sicher.
- `git pull` = fetch + Integrieren. Bei auseinandergelaufenen Branches wählst du `--rebase`,
  `--no-rebase` oder `--ff-only`.
