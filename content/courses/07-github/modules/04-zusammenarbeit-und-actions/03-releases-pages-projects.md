---
title: Releases, Pages und Projects
summary: Fertige Versionen mit Releases veröffentlichen, mit GitHub Pages eine Projektseite ins Netz stellen und mit Projects und Discussions den Überblick behalten.
duration: 20
sources:
  - title: GitHub Docs – Informationen zu Releases
    url: https://docs.github.com/de/repositories/releasing-projects-on-github/about-releases
  - title: GitHub REST API – Releases
    url: https://docs.github.com/de/rest/releases/releases
  - title: GitHub Docs – Was ist GitHub Pages?
    url: https://docs.github.com/de/pages/getting-started-with-github-pages/what-is-github-pages
  - title: GitHub Docs – Informationen zu Projects
    url: https://docs.github.com/de/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects
  - title: GitHub Docs – Informationen zu Diskussionen
    url: https://docs.github.com/de/discussions/collaborating-with-your-community-using-discussions/about-discussions
quiz:
  - type: single
    question: Was ist der Unterschied zwischen einem Git-Tag und einem GitHub-Release?
    options:
      - Es gibt keinen
      - Ein Tag markiert einen Commit in Git; ein Release ist eine GitHub-Seite zu einem Tag mit Notizen und Dateien zum Download
      - Ein Release ersetzt den Tag und löscht ihn
    answer: 1
    explanation: Jedes Release gehört zu einem Tag. GitHub ergänzt Beschreibung, Release Notes und angehängte Dateien.
  - type: match
    question: Welche Versionsnummer passt nach Semantic Versioning, ausgehend von 2.3.1?
    pairs:
      - { left: "Fehlerbehebung ohne neue Funktion", right: "2.3.2" }
      - { left: "Neue Funktion, alles bleibt kompatibel", right: "2.4.0" }
      - { left: "Inkompatible Änderung (Breaking Change)", right: "3.0.0" }
    explanation: MAJOR.MINOR.PATCH – Breaking Change erhöht MAJOR, neue Funktion MINOR, Fehlerbehebung PATCH.
  - type: cloze
    text: Mit `gh release create v1.2.0 --___-notes` erzeugt GitHub die Release Notes aus den gemergten Pull Requests. Eine Pages-Seite für das Repository `du/doku` liegt unter `du.github.___/doku`.
    blanks:
      - [generate]
      - [io]
    explanation: Projektseiten liegen unter <benutzer>.github.io/<repository>.
  - type: single
    question: Jemand fragt „Wie konfiguriere ich das Plugin für mehrere Sprachen?“. Es ist kein Fehler im Projekt. Wo gehört die Frage hin?
    options:
      - In ein Issue mit Label bug
      - In GitHub Discussions, Kategorie Q&A
      - In einen Pull Request
    answer: 1
    explanation: Discussions sind für Fragen, Ideen und Austausch gedacht. Issues bleiben so eine Liste konkreter, erledigbarer Aufgaben.
  - type: multiple
    question: Was kann ein GitHub Project?
    options:
      - Issues und Pull Requests aus mehreren Repositorys sammeln
      - Eigene Felder wie Priorität oder Schätzung anlegen
      - Dieselben Einträge als Tabelle, Board oder Roadmap anzeigen
      - Code kompilieren
    answers: [0, 1, 2]
    explanation: Projects sind Planungswerkzeuge über Issues und PRs. Bauen und Testen übernimmt GitHub Actions.
tasks:
  - id: release-per-api
    type: request
    title: Veröffentliche ein Release per API
    description: |
      Für `du/wetter-cli` gibt es den Tag `v1.2.0`. Lege dazu ein Release an:

      - `tag_name`: `v1.2.0`
      - `name`: `Version 1.2.0`
      - `generate_release_notes`: `true`
      - es ist weder Entwurf noch Vorabversion

      Denk an Accept-, Authorization- und Content-Type-Header.
    base_url: https://api.github.com
    expected:
      method: POST
      path: "^/repos/du/wetter-cli/releases$"
      headers:
        Accept: "application/vnd\\.github\\+json"
        Authorization: "^Bearer\\s+\\S+"
        Content-Type: "application/json"
      body_contains: ['"tag_name"', '"v1.2.0"', '"name"', '"generate_release_notes"', 'true']
    response:
      status: 201
      body: '{"id": 1001, "tag_name": "v1.2.0", "name": "Version 1.2.0", "draft": false, "prerelease": false, "html_url": "https://github.com/du/wetter-cli/releases/tag/v1.2.0"}'
    hints:
      - "Pfad: /repos/{owner}/{repo}/releases"
      - "`{\"tag_name\": \"v1.2.0\", \"name\": \"Version 1.2.0\", \"generate_release_notes\": true}`"
    solution: |
      ```http
      POST /repos/du/wetter-cli/releases HTTP/1.1
      Accept: application/vnd.github+json
      Authorization: Bearer <dein-token>
      Content-Type: application/json

      {"tag_name": "v1.2.0", "name": "Version 1.2.0",
       "generate_release_notes": true, "draft": false, "prerelease": false}
      ```
  - id: welches-werkzeug
    type: dragdrop
    title: Welches Werkzeug passt?
    description: Ordne jede Situation dem GitHub-Werkzeug zu, das am besten passt.
    targets:
      - { id: issue, label: Issue }
      - { id: discussion, label: Discussion }
      - { id: project, label: Project }
      - { id: pr, label: Pull Request }
    items:
      - { label: Der Login-Button funktioniert in Firefox nicht, target: issue }
      - { label: Ideensammlung für die Version 3.0, target: discussion }
      - { label: Frage zur Konfiguration ohne Fehler im Code, target: discussion }
      - { label: Sprint-Board mit Spalten Todo / In Arbeit / Fertig, target: project }
      - { label: Überblick über Aufgaben aus drei Repositorys mit Priorität, target: project }
      - { label: Fertige Änderung soll in main übernommen werden, target: pr }
---

Dein Tool ist fertig, die Tests sind grün. Jetzt sollen andere es in einer festen Version benutzen,
vielleicht mit einer kleinen Webseite dazu. Und während das Projekt wächst, brauchst du einen Ort für
Planung und Fragen. Für all das hat GitHub eigene Werkzeuge.

## Vom Tag zum Release

Ein [[tag|Tag]] ist ein fester Name für einen Commit, etwa `v1.2.0`. Ein [[release|Release]] ist die
GitHub-Seite zu so einem Tag – mit Titel, Release Notes und optional angehängten Dateien.

| | Git-Tag | GitHub-Release |
|---|---|---|
| Wo? | im Repository | auf GitHub unter „Releases“ |
| Inhalt | Name + Commit | Tag + Titel + Notizen + Dateien |

Die Nummer folgt meist [[semantic-versioning|Semantic Versioning]] (MAJOR.MINOR.PATCH): ein
[[breaking-change|Breaking Change]] erhöht MAJOR, eine neue Funktion MINOR, ein Bugfix PATCH.

```bash title="Release mit der GitHub CLI"
git tag -a v1.3.0 -m "Version 1.3.0"
git push origin v1.3.0
gh release create v1.3.0 --generate-notes
```

`--generate-notes` erzeugt die Notizen aus den gemergten Pull Requests seit dem letzten Release. Mit
`--draft` legst du zuerst einen Entwurf an, den du in Ruhe prüfst, `--prerelease` markiert eine Beta,
und Dateinamen am Ende des Befehls hängen fertige Dateien wie `dist/app.zip` zum Download an. Per
API geht das mit `POST /repos/{owner}/{repo}/releases` und `"generate_release_notes": true`.

> [!MERKSATZ]
> Tags werden **nicht** automatisch gepusht. Nach `git tag` folgt `git push origin <tag>`.

## GitHub Pages

[[github-pages|GitHub Pages]] stellt **statische** Webseiten (HTML, CSS, JavaScript) direkt aus einem
Repository ins Netz. Das Repository `du/doku` erscheint unter `https://du.github.io/doku`. Unter
**Settings → Pages** wählst du die Quelle: einen Branch und Ordner (z. B. `main` und `/docs`) oder
einen Actions-Workflow, der die Seite baut. Typische Inhalte sind Projektdokumentation, ein Portfolio
oder eine mit Vite gebaute Single-Page-App. Eine eigene Domain trägst du in denselben Einstellungen ein.

> [!FEHLER]
> **Eine PHP- oder Node-Anwendung auf Pages betreiben wollen.** Pages liefert nur fertige Dateien aus.
> Serverseitiger Code und Datenbanken brauchen ein echtes Hosting.

## Projects und Discussions

[[github-projects|GitHub Projects]] ist eine Planungstabelle über Issues und Pull Requests, auch aus
mehreren Repositorys. Eigene Felder wie Status, Priorität oder Sprint ergänzen die Einträge; dieselben
Daten zeigst du als Tabelle, Board (Kanban) oder Roadmap. Automatisierungen setzen z. B. den Status auf
„Done“, sobald ein Issue geschlossen wird.

[[github-discussions|GitHub Discussions]] ist ein Forum im Repository – für Fragen und Ideen, die keine
konkrete Aufgabe sind:

| | Issue | Discussion |
|---|---|---|
| Zweck | erledigbare Aufgabe | Frage, Idee, Austausch |
| Beispiel | „Export bricht bei Umlauten ab“ | „Welche Formate wünscht ihr euch?“ |

> [!PRAXIS]
> Mit **Watch → Participating and @mentions** bekommst du nur Benachrichtigungen, wenn du beteiligt
> bist oder erwähnt wirst. Für Bibliotheken, die du nur nutzt, reicht **Custom → Releases**.

## Zusammenfassung

- Ein **Tag** markiert einen Commit, ein **Release** ist die GitHub-Seite dazu mit Notizen und Dateien.
- `gh release create <tag> --generate-notes` erzeugt Release Notes aus gemergten PRs.
- **GitHub Pages** veröffentlicht statische Seiten aus einem Branch oder per Workflow.
- **Projects** planen Issues und PRs als Tabelle, Board oder Roadmap.
- **Discussions** sind für Fragen und Ideen, **Issues** für konkrete Aufgaben.
