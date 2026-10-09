---
title: Pull Requests und Code-Review
summary: Der komplette Weg einer Änderung – Branch, Pull Request, Review, Merge – mit Entwürfen, PR-Vorlagen und gutem Review-Feedback.
duration: 25
sources:
  - title: GitHub Docs – Informationen zu Pull Requests
    url: https://docs.github.com/de/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests
  - title: GitHub Docs – Pull-Request-Vorlage erstellen
    url: https://docs.github.com/de/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository
  - title: GitHub Docs – Informationen zu Pull-Request-Reviews
    url: https://docs.github.com/de/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews
  - title: GitHub REST API – Reviews für Pull Requests
    url: https://docs.github.com/de/rest/pulls/reviews
quiz:
  - type: single
    question: Du hast nach dem Öffnen eines Pull Requests noch einen Fehler gefunden. Was tust du?
    options:
      - Den Pull Request schließen und einen neuen öffnen
      - Den Fehler auf demselben Branch committen und pushen – der PR aktualisiert sich automatisch
      - Den Fehler direkt auf main committen
    answer: 1
    explanation: Ein Pull Request zeigt immer den aktuellen Stand seines Branches. Neue Commits erscheinen automatisch im PR.
  - type: match
    question: Ordne die Begriffe zu.
    pairs:
      - { left: "base", right: "Branch, in den gemergt werden soll (z. B. main)" }
      - { left: "head / compare", right: "Branch mit deinen Änderungen" }
      - { left: "Draft", right: "Entwurf, noch nicht bereit zum Mergen" }
    explanation: Ein Pull Request vergleicht head mit base. Ein Draft signalisiert Work in Progress.
  - type: match
    question: Welche Review-Entscheidung passt?
    pairs:
      - { left: "Comment", right: "Feedback geben, ohne zu entscheiden" }
      - { left: "Approve", right: "Die Änderung ist aus deiner Sicht bereit zum Mergen" }
      - { left: "Request changes", right: "Vor dem Merge muss noch etwas geändert werden" }
    explanation: Request changes blockiert bei passendem Branch-Schutz den Merge, bis die Person erneut reviewt.
  - type: single
    question: Wie schlägst du in einem Review-Kommentar eine konkrete Code-Änderung vor, die die Autorin per Klick übernehmen kann?
    options:
      - "Mit einem Code-Block, der mit ```suggestion beginnt"
      - Mit dem Wort „Vorschlag:“ am Anfang
      - Mit einem eigenen Commit auf ihrem Branch ohne Absprache
    answer: 0
    explanation: Ein suggestion-Block ersetzt die kommentierten Zeilen. Die Autorin übernimmt ihn mit „Commit suggestion“.
  - type: multiple
    question: Welche Kommentare sind gutes Review-Feedback?
    options:
      - "Diese Schleife lädt für jeden Nutzer die Bestellungen einzeln – können wir sie vorab gemeinsam laden?"
      - "Das ist schlecht."
      - "nit: Hier fehlt ein Leerzeichen (kein Blocker)."
      - "Warum hast du das nicht so gemacht, wie ich es gemacht hätte?"
    answers: [0, 2]
    explanation: Gutes Feedback ist konkret, begründet und zeigt, wie wichtig es ist. Wertungen ohne Begründung helfen niemandem.
  - type: cloze
    text: Eine PR-Vorlage liegt in der Datei `.github/___`. Einen Entwurf öffnest du mit `gh pr create --___`.
    blanks:
      - [pull_request_template.md]
      - [draft]
    explanation: GitHub füllt neue Pull Requests automatisch mit dem Inhalt von .github/pull_request_template.md.
tasks:
  - id: pr-ablauf-beschriften
    type: diagram
    title: Beschrifte den Pull-Request-Ablauf
    description: Bring die sechs Stationen einer Änderung in die richtigen Kästen. Der gestrichelte Pfeil zeigt, was bei gewünschten Änderungen passiert.
    image: /assets/github/pr-ablauf-leer.svg
    slots:
      - { x: 9, y: 50, answer: Branch anlegen }
      - { x: 25, y: 50, answer: Commits pushen }
      - { x: 41, y: 50, answer: PR öffnen }
      - { x: 57, y: 50, answer: Review + Checks }
      - { x: 73, y: 50, answer: Merge }
      - { x: 89, y: 50, answer: Branch löschen }
    distractors: [Force-Push auf main, Repository forken]
    hints:
      - Erst wenn Commits auf GitHub liegen, kann ein Pull Request sie zeigen.
  - id: pr-vorlage-und-branch
    type: terminal
    title: PR-Vorlage und ein PR-fertiger Branch
    description: |
      Im Ordner `pr-vorbereiten` liegt ein Repository mit einem Commit auf `main`.

      1. Lege auf `main` die Datei `.github/pull_request_template.md` an. Sie enthält die Abschnitte
         `## Was ändert sich?` und `## Wie wurde getestet?` sowie eine Checkliste mit mindestens einem
         Punkt `- [ ] …`. Committe sie auf `main`.
      2. Lege danach den Branch `feature/suche` an.
      3. Erstelle dort eine Datei `suche.js` (Inhalt egal) und committe sie mit einer Nachricht, die
         Issue 7 beim Merge schließt (z. B. `feat: add search` mit `Closes #7` im Text).

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: pr-vorbereiten
    setup: |
      git init -q -b main
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      echo "# Blog" > README.md
      git add README.md
      git commit -q -m "docs: add readme"
    checks:
      - type: command
        run: git show main:.github/pull_request_template.md
        stdout_matches: "^##\\s+Was ändert sich\\?"
        message: Auf main fehlt .github/pull_request_template.md mit dem Abschnitt "## Was ändert sich?".
      - type: command
        run: git show main:.github/pull_request_template.md
        stdout_matches: "^##\\s+Wie wurde getestet\\?"
        message: In der Vorlage fehlt der Abschnitt "## Wie wurde getestet?".
      - type: command
        run: git show main:.github/pull_request_template.md
        stdout_matches: "^- \\[ \\] \\S"
        message: In der Vorlage fehlt eine Checkliste mit "- [ ] …".
      - type: command
        run: git rev-parse --abbrev-ref HEAD
        stdout_equals: feature/suche
        message: Du bist nicht auf dem Branch feature/suche.
      - type: command
        run: git ls-tree --name-only feature/suche suche.js
        stdout_equals: suche.js
        message: Auf feature/suche fehlt der Commit mit suche.js.
      - type: command
        run: git log -1 --format=%B feature/suche
        stdout_matches: "(?:[Cc]lose[sd]?|[Ff]ix(?:e[sd])?|[Rr]esolve[sd]?):?\\s+#7\\b"
        message: Die letzte Commit-Message auf feature/suche schließt Issue 7 noch nicht (z. B. "Closes #7").
      - type: command
        run: git ls-tree --name-only main suche.js
        stdout_equals: ""
        message: suche.js darf nicht auf main liegen – sie gehört nur auf den Feature-Branch.
    hints:
      - "Mehrzeilige Commit-Messages: `git commit -m \"feat: add search\" -m \"Closes #7\"` – jedes -m wird ein Absatz."
      - "Reihenfolge: Vorlage auf main committen, dann `git switch -c feature/suche`."
    solution: |
      ```bash
      cd pr-vorbereiten
      mkdir -p .github
      cat > .github/pull_request_template.md <<'EOF'
      ## Was ändert sich?

      ## Wie wurde getestet?

      ## Checkliste
      - [ ] Tests ergänzt
      - [ ] Issue verknüpft (Closes #…)
      EOF
      git add .github
      git commit -m "chore: add pull request template"
      git switch -c feature/suche
      echo "export function search() {}" > suche.js
      git add suche.js
      git commit -m "feat: add search" -m "Closes #7"
      ```
  - id: review-per-api
    type: request
    title: Fordere per API Änderungen an
    description: |
      Du reviewst Pull Request **#42** in `beispiel-org/shop`. In `src/cart.js` Zeile 18 fehlt eine
      Prüfung auf eine leere Menge. Schicke ein Review mit der Entscheidung **Änderungen anfordern**:

      - Endpunkt für Reviews von PR 42
      - `event`: `REQUEST_CHANGES`
      - `body`: eine kurze Zusammenfassung
      - `comments`: ein Kommentar mit `path` (`src/cart.js`), `line` (18) und `body`
    base_url: https://api.github.com
    expected:
      method: POST
      path: "^/repos/beispiel-org/shop/pulls/42/reviews$"
      headers:
        Authorization: "^Bearer\\s+\\S+"
        Content-Type: "application/json"
      body_contains: ['"event"', '"REQUEST_CHANGES"', '"body"', '"comments"', '"path"', 'src/cart.js', '"line"', '18']
    response:
      status: 200
      body: '{"id": 80, "state": "CHANGES_REQUESTED", "user": {"login": "du"}, "html_url": "https://github.com/beispiel-org/shop/pull/42#pullrequestreview-80"}'
    hints:
      - "Pfad: /repos/{owner}/{repo}/pulls/{pull_number}/reviews"
      - "comments ist eine Liste von Objekten: `[{\"path\": \"src/cart.js\", \"line\": 18, \"body\": \"…\"}]`"
    solution: |
      ```http
      POST /repos/beispiel-org/shop/pulls/42/reviews HTTP/1.1
      Accept: application/vnd.github+json
      Authorization: Bearer <dein-token>
      Content-Type: application/json

      {"event": "REQUEST_CHANGES",
       "body": "Fast fertig – bitte noch den Leerfall abfangen.",
       "comments": [{"path": "src/cart.js", "line": 18,
                     "body": "Was passiert bei quantity = 0? Bitte vorher prüfen."}]}
      ```
---

Du hast einen Fehler behoben, alles läuft. Jetzt einfach auf `main` pushen? In fast jedem Team: nein.
Änderungen kommen über einen **Pull Request** – einen Vorschlag, den andere ansehen und kommentieren,
bevor er Teil des Hauptcodes wird.

![Der Ablauf einer Änderung: Branch, Commits, Pull Request, Review und Checks, Merge, Branch löschen](/assets/github/pr-ablauf.svg)

## Was ein Pull Request ist

Ein [[pull-request|Pull Request]] (PR) sagt: „Bitte übernehmt die Commits aus meinem Branch.“ Er
vergleicht zwei [[branch|Branches]]:

| Begriff | Bedeutung | Beispiel |
|---|---|---|
| **base** | Ziel, in das gemergt wird | `main` |
| **head** | dein Branch mit den Änderungen | `fix/warenkorb` |

Ein PR zeigt **live** den Unterschied der beiden Branches. Pushst du neue Commits auf den head-Branch,
erscheinen sie sofort im PR. Die Reiter heißen **Conversation**, **Commits**, **Checks** und
**Files changed** (der [[diff|Diff]]).

> [!MERKSATZ]
> Ein Pull Request gehört zu einem **Branch**. Neue Commits auf denselben Branch aktualisieren ihn automatisch.

## Der Ablauf und Entwürfe

```bash title="Vom Branch zum Pull Request"
git switch -c fix/warenkorb
git commit -am "fix: make cart button work on mobile"
git push -u origin fix/warenkorb
gh pr create --title "fix: Warenkorb auf Mobilgeräten" --body "Closes #12"
```

Willst du früh Feedback, obwohl du noch nicht fertig bist, öffnest du einen
[[draft-pull-request|Draft Pull Request]] (`gh pr create --draft`). Er ist sichtbar und kommentierbar,
kann aber nicht gemergt werden. Mit `gh pr ready` gibst du ihn frei.

Eine [[pull-request-template|PR-Vorlage]] in `.github/pull_request_template.md` füllt jedes neue
PR-Formular vor:

```markdown title=".github/pull_request_template.md"
## Was ändert sich?

## Wie wurde getestet?

## Checkliste
- [ ] Tests ergänzt
- [ ] Issue verknüpft (Closes #…)
```

> [!FEHLER]
> **Riesen-PRs.** 40 Dateien, drei Features und ein Refactoring in einem PR kann niemand sorgfältig
> reviewen. Ein PR, ein Zweck – was sich nicht in 15 Minuten verstehen lässt, sollte geteilt werden.

## Ein Review geben

Ein [[code-review|Code-Review]] findet Fehler, bevor sie Nutzer:innen treffen, und verteilt Wissen im
Team. Im Reiter **Files changed** klickst du auf das **+** neben einer Zeile und kommentierst. Mit
**Start a review** sammelt GitHub deine Kommentare und schickt sie gemeinsam ab.

Statt „Hier fehlt `const`“ kannst du die Zeile direkt verbessern – mit einem
[[aenderungsvorschlag|Änderungsvorschlag]]. Die Autorin übernimmt ihn per Klick auf **Commit suggestion**:

````markdown title="Review-Kommentar mit Vorschlag"
```suggestion
const total = items.reduce((sum, item) => sum + item.price, 0)
```
````

Beim Abschicken wählst du eine Entscheidung:

| Entscheidung | Bedeutung |
|---|---|
| **Comment** | Feedback ohne Urteil |
| **Approve** | bereit zum Mergen |
| **Request changes** | bitte erst ändern; blockiert je nach Regeln den Merge |

## Gutes Feedback geben und annehmen

Ein Review bewertet den **Code**, nicht die Person. Formuliere als Frage oder Vorschlag und begründe:
„Was passiert, wenn die Liste leer ist?“ statt „Das ist falsch.“ Markiere die Wichtigkeit, z. B.
`nit:` für Kleinigkeiten und `blocker:` für Dinge, die vor dem Merge geklärt sein müssen.

Als Autor:in antwortest du im Thread, pushst Korrekturen auf denselben Branch und forderst ein
**Re-Review** an. Zum Testen holst du einen fremden PR mit `gh pr checkout 42` auf deinen Rechner.

> [!PRAXIS]
> Per API geht ein Review mit `POST /repos/{owner}/{repo}/pulls/{nummer}/reviews` – mit `event`
> (`APPROVE`, `REQUEST_CHANGES`, `COMMENT`), `body` und Zeilenkommentaren in `comments`. So arbeiten
> auch Review-Bots.

## Zusammenfassung

- Ein **Pull Request** schlägt vor, einen head-Branch in einen base-Branch zu mergen.
- Ablauf: Branch → Commits pushen → PR öffnen → Review und Checks → Merge → Branch löschen.
- **Draft PRs** holen früh Feedback, **PR-Vorlagen** sorgen für vollständige Beschreibungen.
- Reviews passieren in **Files changed**; **suggestion**-Blöcke machen Korrekturen zu einem Klick.
- Entscheidungen: **Comment**, **Approve**, **Request changes** – Feedback konkret und freundlich.
