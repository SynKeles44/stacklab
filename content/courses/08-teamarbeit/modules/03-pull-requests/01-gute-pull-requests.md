---
title: Gute Pull Requests schreiben
summary: Was in eine Pull-Request-Beschreibung gehört, wie Templates und Draft-PRs helfen, warum kleine und gestapelte PRs besser sind und welche Regeln Branch-Schutz durchsetzt.
duration: 25
sources:
  - title: GitHub Docs – Creating a pull request template
    url: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository
  - title: GitHub Docs – Linking a pull request to an issue
    url: https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue
  - title: GitHub Docs – About protected branches
    url: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
  - title: GitHub Docs – About merge methods on GitHub
    url: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/about-merge-methods-on-github
quiz:
  - type: multiple
    question: Was gehört in eine gute Pull-Request-Beschreibung? (mehrere Antworten)
    options:
      - Was sich ändert und warum
      - Wie man die Änderung testen kann
      - Ein Link zum Ticket
      - Der komplette Quellcode noch einmal als Text
    answers: [0, 1, 2]
    explanation: Die Beschreibung erklärt Ziel, Hintergrund und Test. Den Code sehen Reviewer:innen ohnehin im Diff.
  - type: cloze
    text: "Schreibst du `___ #12` in die Beschreibung, schließt GitHub das Issue 12 automatisch, sobald der Pull Request in den Standard-Branch gemergt wird."
    blanks:
      - [Closes, Fixes, Resolves, closes, fixes, resolves]
    explanation: Schlüsselwörter wie Closes, Fixes oder Resolves verknüpfen Pull Request und Issue.
  - type: single
    question: Wann öffnest du einen Draft-Pull-Request?
    options:
      - Wenn du früh Feedback zu einer halbfertigen Lösung möchtest
      - Wenn der Code fertig ist und sofort gemergt werden soll
      - Wenn du keine Beschreibung schreiben willst
    answer: 0
    explanation: Ein Draft zeigt allen, dass noch gearbeitet wird. Er kann nicht gemergt werden, bis du ihn als „Ready for review“ markierst.
  - type: single
    question: PR 2 baut auf dem Branch von PR 1 auf. Welchen Base-Branch stellst du für PR 2 ein, solange PR 1 noch offen ist?
    options:
      - main
      - Den Branch von PR 1
      - Den Branch von PR 2 selbst
    answer: 1
    explanation: So zeigt PR 2 nur seine eigenen Änderungen. Nach dem Merge von PR 1 stellst du die Basis auf main um.
  - type: match
    question: Ordne jeder Merge-Art ihr Ergebnis in main zu.
    pairs:
      - { left: "Merge-Commit", right: "Alle Commits bleiben erhalten, dazu ein Merge-Commit" }
      - { left: "Squash-Merge", right: "Alle Commits werden zu einem einzigen Commit zusammengefasst" }
      - { left: "Rebase-Merge", right: "Die Commits werden einzeln ohne Merge-Commit auf main gesetzt" }
    explanation: Welche Art ein Team nutzt, ist eine Vereinbarung. Viele Teams wählen Squash, weil dann jeder PR genau ein Commit in main ist.
tasks:
  - id: pr-lebenszyklus
    type: order
    title: Der Lebenszyklus eines Pull Requests
    description: Bringe die Stationen eines Pull Requests in die richtige Reihenfolge – vom Ticket bis zum Merge.
    items:
      - Ticket lesen und verstehen
      - Feature-Branch anlegen
      - In kleinen Commits arbeiten
      - Selbst-Review des eigenen Diffs
      - Pull Request mit Beschreibung öffnen
      - Automatische Checks und Review-Umgebung laufen
      - Code-Review und Änderungen einarbeiten
      - Freigabe (Approval) erhalten
      - Mergen und Branch löschen
  - id: pr-template
    type: terminal
    title: Ein PR-Template für das Team anlegen
    description: |
      Im Ordner `m3-pr-template` liegt das Repository eures Teams. Damit jede Beschreibung dieselben
      Informationen enthält, legst du ein Template an, das GitHub beim Öffnen eines Pull Requests
      automatisch vorausfüllt.

      1. Lege die Datei `.github/pull_request_template.md` an (der Ordner `.github` existiert noch nicht).
      2. Sie braucht die Überschriften `## Was`, `## Warum`, `## Wie testen` und `## Ticket`.
      3. Ergänze darunter eine Checkliste mit mindestens zwei Punkten im Format `- [ ] …`.
      4. Committe die Datei mit einer Conventional-Commit-Message vom Typ `docs` oder `chore`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: m3-pr-template
    setup: |
      git init -q -b main
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      printf '# Shop\n' > README.md
      git add . && git commit -q -m "chore: initial commit"
    checks:
      - type: file_exists
        path: .github/pull_request_template.md
        message: Die Datei .github/pull_request_template.md fehlt noch (mkdir -p .github).
      - type: command
        run: for h in "Was" "Warum" "Wie testen" "Ticket"; do grep -qx "## $h" .github/pull_request_template.md || { echo "fehlt $h"; exit 1; }; done
        message: Im Template fehlt mindestens eine der Überschriften `## Was`, `## Warum`, `## Wie testen`, `## Ticket` (jeweils als eigene Zeile).
      - type: command
        run: grep -c "^- \[ \] " .github/pull_request_template.md
        stdout_matches: "^\\s*([2-9]|[1-9][0-9])\\s*$"
        message: Im Template fehlt eine Checkliste mit mindestens zwei Punkten im Format `- [ ] …`.
      - type: command
        run: git ls-files .github/pull_request_template.md
        stdout_equals: .github/pull_request_template.md
        message: Das Template ist noch nicht committet.
      - type: command
        run: git log -1 --format=%s
        stdout_matches: "^(docs|chore)(\\([^)]+\\))?: \\S"
        message: Die Commit-Message soll mit `docs:` oder `chore:` beginnen (Scope erlaubt).
    hints:
      - "`mkdir -p .github` legt den Ordner an, danach kannst du die Datei mit nano schreiben."
      - "Mit `printf '## Was\\n\\n## Warum\\n…' > .github/pull_request_template.md` geht es auch ohne Editor."
    solution: |
      ```bash
      cd m3-pr-template
      mkdir -p .github
      printf '## Was\n\n## Warum\n\n## Wie testen\n\n## Ticket\n\n- [ ] Selbst-Review gemacht\n- [ ] Tests ergänzt\n' > .github/pull_request_template.md
      git add .github/pull_request_template.md
      git commit -m "docs: add pull request template"
      ```
  - id: gestapelte-branches
    type: terminal
    title: Gestapelte Branches anlegen
    description: |
      Im Ordner `m3-stacked` liegt ein Repository. Für Ticket SHOP-7 baust du eine Bewertungsfunktion in
      zwei kleinen Pull Requests: zuerst die Schnittstelle, darauf aufbauend die Oberfläche.

      1. Lege von `main` den Branch `feat/SHOP-7-api` an, erstelle `api.js` und committe sie.
      2. Lege **von `feat/SHOP-7-api` aus** den Branch `feat/SHOP-7-ui` an, erstelle `ui.js` und committe sie.

      Danach würde PR 1 `feat/SHOP-7-api` → `main` zeigen und PR 2 `feat/SHOP-7-ui` →
      `feat/SHOP-7-api`. Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: m3-stacked
    setup: |
      git init -q -b main
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      printf '# Shop\n' > README.md
      git add . && git commit -q -m "chore: initial commit"
    checks:
      - type: command
        run: git rev-list --count main..feat/SHOP-7-api
        stdout_equals: "1"
        message: Der Branch feat/SHOP-7-api fehlt oder hat nicht genau einen eigenen Commit.
      - type: command
        run: git ls-tree --name-only feat/SHOP-7-api | grep -c "^api\.js$"
        stdout_matches: "^\\s*1\\s*$"
        message: api.js ist im Branch feat/SHOP-7-api nicht committet.
      - type: command
        run: git ls-tree --name-only feat/SHOP-7-api | grep -c "^ui\.js$"
        expect_exit: 1
        message: ui.js gehört nicht in feat/SHOP-7-api, sondern nur in feat/SHOP-7-ui.
      - type: command
        run: test "$(git merge-base feat/SHOP-7-ui feat/SHOP-7-api)" = "$(git rev-parse feat/SHOP-7-api)" && git rev-list --count feat/SHOP-7-api..feat/SHOP-7-ui
        stdout_equals: "1"
        message: feat/SHOP-7-ui muss auf feat/SHOP-7-api aufbauen und genau einen weiteren Commit haben.
      - type: command
        run: git ls-tree --name-only feat/SHOP-7-ui | grep -c "^ui\.js$"
        stdout_matches: "^\\s*1\\s*$"
        message: ui.js ist im Branch feat/SHOP-7-ui nicht committet.
    hints:
      - "`git switch -c feat/SHOP-7-api main` legt den ersten Branch an."
      - "Für den zweiten Branch stehst du auf feat/SHOP-7-api und führst `git switch -c feat/SHOP-7-ui` aus."
    solution: |
      ```bash
      cd m3-stacked
      git switch -c feat/SHOP-7-api main
      echo 'export function getRatings() { return [] }' > api.js
      git add api.js
      git commit -m "feat(SHOP-7): add ratings api"
      git switch -c feat/SHOP-7-ui
      echo 'export function renderRatings() {}' > ui.js
      git add ui.js
      git commit -m "feat(SHOP-7): add ratings ui"
      git log --oneline --graph --all
      ```
---

„Fix“ – das ist der Titel. Die Beschreibung ist leer, der Diff hat 18 Dateien. Die Reviewerin muss jetzt
erst herausfinden, worum es überhaupt geht. Ein guter [[pull-request|Pull Request]] dagegen erzählt in zwei
Minuten, was passiert und warum. Danach ist das Review halb so schwer.

![Der Lebenszyklus eines Pull Requests vom Ticket bis zum Merge](/assets/teamarbeit/pr-lebenszyklus.svg)

## Titel und Beschreibung

Der Titel folgt meist derselben Konvention wie Commits: `feat(SHOP-123): add wishlist button`. Wird mit
Squash gemergt, wird er sogar zur Commit-Message in `main`.

Eine gute [[pr-beschreibung|PR-Beschreibung]] beantwortet vier Fragen:

| Frage | Beispiel |
|---|---|
| **Was** ändert sich? | „Kund:innen können Produkte auf eine Wunschliste setzen.“ |
| **Warum**? | „Viele Anfragen im Support, siehe SHOP-123.“ |
| **Wie testen**? | „Als Gast einloggen, Produkt öffnen, Herz anklicken, /wishlist aufrufen.“ |
| **Was ist offen**? | „E-Mail-Benachrichtigung folgt in SHOP-124.“ |

Bei Änderungen an der Oberfläche gehören **Screenshots** dazu, am besten vorher und nachher. Ein Bild
erklärt in einer Sekunde, wofür man sonst einen Absatz braucht.

> [!MERKSATZ]
> Die Beschreibung erklärt das **Warum**. Das **Was** steht im Diff, das Warum steht nirgendwo sonst.

Ein Link zum [[ticket]] führt Reviewer:innen direkt zu den Anforderungen. Auf GitHub verknüpfen
Schlüsselwörter Pull Request und Issue:

```markdown title="Ausschnitt einer PR-Beschreibung"
Closes #12
Refs SHOP-123
```

`Closes #12` schließt das GitHub-Issue 12 automatisch, sobald der Pull Request in den Standard-Branch
gemergt wird. Jira und Linear erkennen Ticket-IDs wie `SHOP-123` im Titel, Branch-Namen oder Text.

## PR-Templates und Draft-PRs

Damit niemand etwas vergisst, legen Teams ein [[pull-request-template|PR-Template]] an. Liegt die Datei
`.github/pull_request_template.md` im Standard-Branch, füllt GitHub jede neue Beschreibung damit vor:

```markdown title=".github/pull_request_template.md"
## Was

## Warum

## Wie testen

## Ticket

- [ ] Selbst-Review gemacht
- [ ] Tests ergänzt oder angepasst
- [ ] Screenshots bei UI-Änderungen
```

Möchtest du früh Feedback zu einer halbfertigen Idee, öffnest du einen
[[draft-pull-request|Draft-Pull-Request]]. Er ist für alle sichtbar, kann aber nicht gemergt werden. Erst
mit „Ready for review“ bittest du offiziell um ein Review.

> [!FEHLER]
> **Den PR öffnen und sofort „Bitte reviewen!“ rufen, obwohl die Tests rot sind.** Reviewer:innen sollten
> erst gefragt werden, wenn die automatischen Checks grün sind. Bis dahin ist ein Draft der richtige Zustand.

## Klein halten und stapeln

Je größer ein Diff, desto oberflächlicher wird er gelesen. Zehn Zeilen prüft man genau, tausend nur noch
flüchtig. Ein guter Pull Request erzählt deshalb **eine** Geschichte. Große Aufgaben schneidest du: erst
Vorbereitung ohne neues Verhalten, dann Datenbank und API, dann Oberfläche – jeder Teil lauffähig.

Baut PR 2 auf PR 1 auf, nutzt du [[stacked-prs|gestapelte Pull Requests]]: Der Branch für PR 2 zweigt vom
Branch von PR 1 ab und zeigt im Pull Request auch auf ihn als Basis.

```text
main ── A
          └── B  feat/SHOP-7-api   ← PR 1, Basis: main
                 └── C  feat/SHOP-7-ui   ← PR 2, Basis: feat/SHOP-7-api
```

Ist PR 1 gemergt, stellst du die Basis von PR 2 auf `main` um. Ändert sich PR 1 noch, aktualisiert
`git rebase --update-refs main` den ganzen Stapel. Mehr als zwei, drei Ebenen werden unübersichtlich.

## Branch-Schutz und Merge-Arten

Absprachen wie „niemand pusht direkt nach `main`“ setzt GitHub mit einer
[[geschuetzter-branch|Branch-Schutzregel]] technisch durch. Typische Einstellungen:

- Änderungen nur über Pull Requests
- mindestens eine Freigabe durch eine andere Person
- alle [[status-check|Status-Checks]] müssen grün sein
- kein [[force-push|Force-Push]] und kein Löschen des Branches

Beim Mergen gibt es drei Varianten: **Merge-Commit** (alle Commits plus ein [[merge-commit|Merge-Commit]]),
[[squash-merge|Squash-Merge]] (alles wird ein Commit mit dem PR-Titel als Message) und **Rebase-Merge**
(Commits einzeln ohne Merge-Commit). Welche gilt, entscheidet das Team.

> [!PRAXIS]
> In professionellen Teams ist `main` praktisch immer geschützt. Selbst Admins mergen über Pull Requests.
> So bleibt jede Änderung nachvollziehbar und geprüft.

## Zusammenfassung

- Titel nach Conventional Commits, Beschreibung mit Was, Warum, Wie testen und offenen Punkten.
- Screenshots bei UI-Änderungen, Ticket-Link oder `Closes #12` in jeder Beschreibung.
- Ein PR-Template unter `.github/pull_request_template.md` sorgt für einheitliche Beschreibungen.
- Draft-PRs zeigen unfertige Arbeit und holen frühes Feedback.
- Kleine PRs erzählen eine Geschichte; gestapelte PRs bauen auf dem Branch des vorherigen auf.
- Branch-Schutzregeln erzwingen Pull Requests, Freigaben und grüne Checks.
