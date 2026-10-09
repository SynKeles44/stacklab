---
title: Issues, Labels und Meilensteine
summary: Wie ein Team mit Issues Aufgaben sammelt, sortiert, zuweist – und wie Commits und Pull Requests Issues automatisch schließen.
duration: 25
sources:
  - title: GitHub Docs – Informationen zu Issues
    url: https://docs.github.com/de/issues/tracking-your-work-with-issues/about-issues
  - title: GitHub Docs – Pull Request mit einem Issue verknüpfen
    url: https://docs.github.com/de/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue
  - title: GitHub Docs – Issuevorlagen konfigurieren
    url: https://docs.github.com/de/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository
  - title: GitHub REST API – Issues
    url: https://docs.github.com/de/rest/issues/issues
quiz:
  - type: match
    question: Wofür nutzt du welches Werkzeug?
    pairs:
      - { left: "Label", right: "Art oder Bereich markieren, z. B. bug oder frontend" }
      - { left: "Milestone", right: "Issues für ein Ziel oder eine Version bündeln" }
      - { left: "Assignee", right: "Festlegen, wer sich kümmert" }
    explanation: Labels sortieren, Meilensteine bündeln zeitlich, Assignees regeln die Zuständigkeit.
  - type: multiple
    question: Welche Formulierungen in einer Pull-Request-Beschreibung schließen Issue 12 beim Merge in den Standard-Branch?
    options:
      - "Closes #12"
      - "fixes #12"
      - "Siehe #12"
      - "Resolved #12"
      - "Issue 12 erledigt"
    answers: [0, 1, 3]
    explanation: GitHub erkennt close/closes/closed, fix/fixes/fixed und resolve/resolves/resolved vor #Nummer – Groß- und Kleinschreibung egal. "Siehe #12" verlinkt nur.
  - type: single
    question: Wo muss eine Markdown-Issue-Vorlage liegen, damit GitHub sie anbietet?
    options:
      - "Im Ordner .github/ISSUE_TEMPLATE/ im Standard-Branch"
      - Im Ordner docs/ in einem beliebigen Branch
      - In der README.md
    answer: 0
    explanation: Vorlagen liegen in .github/ISSUE_TEMPLATE/ und müssen im Standard-Branch (meist main) committet sein.
  - type: cloze
    text: "Ein Issue legst du per API mit einem POST an `/repos/{owner}/{repo}/___` an. Pflichtfeld im Body ist `___`."
    blanks:
      - [issues]
      - [title]
    explanation: Nur der Titel ist Pflicht. body, labels, assignees und milestone sind optional.
tasks:
  - id: issue-per-api
    type: request
    title: Melde einen Fehler per API
    description: |
      Im Repository `beispiel-org/shop` funktioniert der Warenkorb-Button auf dem Handy nicht. Lege per
      REST-API ein Issue an:

      - Titel: `Warenkorb-Button reagiert nicht auf Mobilgeräten`
      - eine kurze Beschreibung im Feld `body`
      - Label `bug` und Assignee `du`

      Denk an die Header `Accept: application/vnd.github+json`, `Authorization: Bearer <dein-token>`
      und `Content-Type: application/json`.
    base_url: https://api.github.com
    expected:
      method: POST
      path: "^/repos/beispiel-org/shop/issues$"
      headers:
        Accept: "application/vnd\\.github\\+json"
        Authorization: "^Bearer\\s+\\S+"
        Content-Type: "application/json"
      body_contains: ['"title"', 'Warenkorb', '"body"', '"labels"', '"bug"', '"assignees"', '"du"']
    response:
      status: 201
      body: '{"number": 12, "title": "Warenkorb-Button reagiert nicht auf Mobilgeräten", "state": "open", "labels": [{"name": "bug"}], "assignees": [{"login": "du"}], "html_url": "https://github.com/beispiel-org/shop/issues/12"}'
    hints:
      - "Pfadmuster: /repos/{owner}/{repo}/issues"
      - "labels und assignees sind Listen: `\"labels\": [\"bug\"]`."
    solution: |
      ```http
      POST /repos/beispiel-org/shop/issues HTTP/1.1
      Accept: application/vnd.github+json
      Authorization: Bearer <dein-token>
      Content-Type: application/json

      {"title": "Warenkorb-Button reagiert nicht auf Mobilgeräten",
       "body": "Auf iOS passiert beim Tippen nichts.",
       "labels": ["bug"], "assignees": ["du"]}
      ```
  - id: bug-vorlage
    type: terminal
    title: Schreib eine Vorlage für Fehlerberichte
    description: |
      Im Ordner `vorlagen` liegt ein Repository. Lege eine Markdown-Issue-Vorlage an, damit Fehlerberichte
      immer dieselben Informationen enthalten.

      1. Lege die Datei `.github/ISSUE_TEMPLATE/bug.md` an.
      2. Sie beginnt mit einem YAML-Frontmatter zwischen `---`-Zeilen mit den Feldern `name`, `about`,
         `title` (z. B. `"[Bug] "`) und `labels: bug`.
      3. Darunter folgen die Abschnitte `## Was ist passiert?`, `## Schritte zum Nachstellen` und `## Erwartetes Verhalten`.
      4. Committe die Vorlage.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: vorlagen
    setup: |
      git init -q -b main
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      echo "# Shop" > README.md
      git add README.md
      git commit -q -m "docs: add readme"
    checks:
      - type: file_exists
        path: .github/ISSUE_TEMPLATE/bug.md
        message: Die Datei .github/ISSUE_TEMPLATE/bug.md fehlt (Groß-/Kleinschreibung beachten).
      - type: file_contains
        path: .github/ISSUE_TEMPLATE/bug.md
        pattern: "^---\\s*\\n(?:.*\\n)*?name:\\s*\\S+[\\s\\S]*?\\n---"
        message: Die Vorlage muss mit einem Frontmatter zwischen zwei ---Zeilen beginnen, das name enthält.
      - type: file_contains
        path: .github/ISSUE_TEMPLATE/bug.md
        pattern: "^about:\\s*\\S+"
        message: Im Frontmatter fehlt das Feld about.
      - type: file_contains
        path: .github/ISSUE_TEMPLATE/bug.md
        pattern: "^labels:\\s*\\[?\\s*[\"']?bug"
        message: Im Frontmatter fehlt labels mit dem Label bug.
      - type: file_contains
        path: .github/ISSUE_TEMPLATE/bug.md
        pattern: "^##\\s+Schritte zum Nachstellen"
        message: Der Abschnitt "## Schritte zum Nachstellen" fehlt.
      - type: file_contains
        path: .github/ISSUE_TEMPLATE/bug.md
        pattern: "^##\\s+Erwartetes Verhalten"
        message: Der Abschnitt "## Erwartetes Verhalten" fehlt.
      - type: command
        run: git ls-files .github/ISSUE_TEMPLATE/bug.md
        stdout_equals: .github/ISSUE_TEMPLATE/bug.md
        message: Die Vorlage ist noch nicht committet.
    hints:
      - "`mkdir -p .github/ISSUE_TEMPLATE` legt beide Ordner auf einmal an."
      - "Das Frontmatter beginnt und endet mit einer Zeile, die nur `---` enthält."
      - "Mit `cat > .github/ISSUE_TEMPLATE/bug.md <<'EOF'` kannst du mehrere Zeilen auf einmal schreiben."
    solution: |
      ```bash
      cd vorlagen
      mkdir -p .github/ISSUE_TEMPLATE
      cat > .github/ISSUE_TEMPLATE/bug.md <<'EOF'
      ---
      name: Fehlerbericht
      about: Melde einen Fehler, damit wir ihn beheben können
      title: "[Bug] "
      labels: bug
      ---

      ## Was ist passiert?

      ## Schritte zum Nachstellen
      1.
      2.

      ## Erwartetes Verhalten
      EOF
      git add .github
      git commit -m "chore: add bug report template"
      ```
  - id: closing-keywords
    type: code
    language: js
    title: Welche Issues schließt dieser Text?
    description: |
      Schreib eine Funktion `closedIssues(text)`, die alle Issue-Nummern zurückgibt, die GitHub beim
      Merge schließen würde. Ein Issue wird geschlossen, wenn vor `#Nummer` eines dieser Schlüsselwörter
      steht: `close`, `closes`, `closed`, `fix`, `fixes`, `fixed`, `resolve`, `resolves`, `resolved`
      (Groß-/Kleinschreibung egal, optional mit Doppelpunkt, z. B. `Fixes: #3`).

      Gib die Nummern als **Zahlen**, **aufsteigend sortiert** und **ohne Doppelte** zurück.
      Ein bloßes `#7` ohne Schlüsselwort zählt nicht.
    starter: |
      function closedIssues(text) {
        // Tipp: ein regulärer Ausdruck mit den Flags g und i
        return []
      }
    tests:
      - name: erkennt ein einzelnes Schlüsselwort
        code: 'assertDeepEqual(closedIssues("feat: add cart\n\nCloses #12"), [12])'
      - name: mehrere Schlüsselwörter, sortiert und ohne Doppelte
        code: 'assertDeepEqual(closedIssues("fixes #8, resolves #3 and FIXED #8"), [3, 8])'
      - name: bloße Verweise zählen nicht
        code: 'assertDeepEqual(closedIssues("Siehe #7 und #9"), [])'
      - name: leerer Text
        code: 'assertDeepEqual(closedIssues(""), [])'
      - name: Doppelpunkt nach dem Schlüsselwort
        code: 'assertDeepEqual(closedIssues("Fixes: #5"), [5])'
    solution: |
      function closedIssues(text) {
        const pattern = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?):?\s+#(\d+)/gi
        const numbers = [...text.matchAll(pattern)].map((match) => Number(match[1]))
        return [...new Set(numbers)].sort((a, b) => a - b)
      }
---

Ein Kunde meldet per Mail einen Fehler, ein Kollege hat im Meeting eine Idee, du selbst stolperst über
einen Tippfehler. Ohne gemeinsamen Ort gehen solche Dinge verloren. Auf GitHub landet all das in
**Issues** – der Aufgabenliste eines Repositorys.

## Was ein Issue ist

Ein [[issue|Issue]] ist ein Eintrag mit Titel, Beschreibung in Markdown und einem Kommentar-Verlauf.
Jedes Issue bekommt eine fortlaufende **Nummer** (`#12`), über die man es überall verlinkt. Issues sind
**offen** oder **geschlossen** – geschlossen heißt erledigt oder verworfen, gelöscht wird nichts.

Ein gutes Issue beantwortet:

| Frage | Beispiel |
|---|---|
| Was ist passiert? | Der Warenkorb-Button reagiert nicht. |
| Wie stelle ich es nach? | iPhone, Safari, Produkt öffnen, Button tippen. |
| Was sollte passieren? | Das Produkt landet im Warenkorb. |
| Was weißt du noch? | Screenshot, Fehlermeldung, Version |

> [!MERKSATZ]
> Ein Issue beschreibt das **Problem**, nicht sofort die Lösung. Die Lösung entsteht später im Pull Request.

## Ordnung: Labels, Meilensteine, Assignees

Bei hundert offenen Issues brauchst du Werkzeuge zum Sortieren:

| Werkzeug | Zweck | Beispiel |
|---|---|---|
| [[label|Label]] | Art, Bereich oder Priorität | `bug`, `enhancement`, `good first issue` |
| [[milestone|Milestone]] | Issues für ein Ziel bündeln, mit Fälligkeitsdatum | `Version 2.0`, `Sprint 14` |
| **Assignee** | wer sich kümmert (bis zu zehn Personen) | `@ada` |
| **Issue-Typ / Sub-Issues** | Hierarchie: großes Thema mit Teilaufgaben | Epic „Checkout“ mit 5 Unteraufgaben |

Die Suche versteht Filter wie `is:open label:bug assignee:@me`. So findest du schnell alles, was dir
zugeordnet ist.

## Vorlagen für Issues

Damit Berichte vollständig sind, legst du [[issue-template|Issue-Vorlagen]] im Ordner
`.github/ISSUE_TEMPLATE/` an. Beim Klick auf „New issue“ wählt man dann zwischen „Fehlerbericht“,
„Feature-Wunsch“ usw.

```markdown title=".github/ISSUE_TEMPLATE/bug.md"
---
name: Fehlerbericht
about: Melde einen Fehler, damit wir ihn beheben können
title: "[Bug] "
labels: bug
---

## Was ist passiert?

## Schritte zum Nachstellen

## Erwartetes Verhalten
```

Der Teil zwischen den `---` ist [[yaml|YAML]]-Frontmatter: Er steuert Name, Titel-Vorgabe und
automatische Labels. Alternativ gibt es **Issue-Formulare** als `.yml`-Datei mit echten Eingabefeldern
und Pflichtfeldern. Eine `config.yml` im selben Ordner kann leere Issues abschalten.

> [!FEHLER]
> **Vorlage liegt im falschen Branch oder Ordner.** GitHub liest Vorlagen nur aus dem Standard-Branch
> und nur aus `.github/ISSUE_TEMPLATE/` – exakt so geschrieben. `issue_template` klein oder ein
> Feature-Branch: Die Vorlage taucht nicht auf.

## Issues automatisch schließen

GitHub verknüpft Issues mit Commits und Pull Requests. Ein bloßes `#12` in einem Kommentar oder einer
[[commit-message|Commit-Message]] erzeugt einen Verweis. Steht davor ein **Schlüsselwort**, wird das Issue
beim Merge geschlossen:

```text title="Pull-Request-Beschreibung"
Behebt das Tippen auf Mobilgeräten.

Closes #12
Fixes #15
```

Die Schlüsselwörter sind `close`, `fix` und `resolve` mit ihren Formen (`closes`, `fixed` …). Das wirkt,
wenn der Pull Request in den **Standard-Branch** gemergt wird – oder wenn ein Commit mit dem
Schlüsselwort direkt dort landet.

> [!PRAXIS]
> Viele Teams verlangen in jeder PR-Beschreibung ein „Closes #…“. So sieht man im Issue, welcher Code
> es gelöst hat, und das Board aktualisiert sich ohne Handarbeit.

## Zusammenfassung

- **Issues** sind die nummerierte Aufgabenliste eines Repositorys: Fehler, Ideen, Fragen.
- **Labels** sortieren, **Milestones** bündeln für ein Ziel, **Assignees** regeln Zuständigkeit.
- **Vorlagen** in `.github/ISSUE_TEMPLATE/` sorgen für vollständige Berichte.
- `#12` verlinkt, `Closes #12` schließt das Issue beim Merge in den Standard-Branch.
- Per API legst du Issues mit `POST /repos/{owner}/{repo}/issues` an.
