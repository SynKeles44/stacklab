---
title: CONTRIBUTING und CHANGELOG
summary: Wie du Mitwirkenden den Weg zeigst und Änderungen nach Keep a Changelog so festhältst, dass alle sie verstehen.
duration: 25
sources:
  - title: Keep a Changelog 1.1.0 (deutsch)
    url: https://keepachangelog.com/de/1.1.0/
  - title: Semantic Versioning 2.0.0 (deutsch)
    url: https://semver.org/lang/de/
  - title: GitHub Docs – Richtlinien für Mitwirkende festlegen
    url: https://docs.github.com/de/communities/setting-up-your-project-for-healthy-contributions/setting-guidelines-for-repository-contributors
quiz:
  - type: single
    question: Für wen schreibst du einen Changelog?
    options:
      - Für Maschinen – er wird automatisch aus allen Commits erzeugt.
      - Für Menschen, die wissen wollen, was sich zwischen zwei Versionen geändert hat.
      - Nur für das Entwicklungsteam als Ersatz für die Git-Historie.
    answer: 1
    explanation: >
      Ein Changelog ist für Menschen geschrieben: Nutzer:innen und Entwickler:innen, die vor einem Update wissen
      wollen, was neu, anders oder kaputt ist. Eine rohe Liste aller Commits hilft ihnen nicht.
  - type: match
    question: Ordne jeder Kategorie aus Keep a Changelog ihre Bedeutung zu.
    pairs:
      - { left: "Added", right: "Neue Funktionen" }
      - { left: "Changed", right: "Änderungen an bestehenden Funktionen" }
      - { left: "Deprecated", right: "Funktionen, die bald entfernt werden" }
      - { left: "Removed", right: "Entfernte Funktionen" }
      - { left: "Fixed", right: "Behobene Fehler" }
      - { left: "Security", right: "Behobene Sicherheitslücken" }
    explanation: Mit diesen sechs Überschriften findet jede Leserin sofort das, was sie betrifft.
  - type: cloze
    text: Änderungen, die noch in keiner Version veröffentlicht sind, sammelst du unter `## [___]`. Das Datum hinter einer Version wie `## [1.2.0] - …` steht im Format ___ (Jahr, Monat, Tag).
    blanks:
      - [Unreleased]
      - [JJJJ-MM-TT, YYYY-MM-DD, ISO 8601, ISO-8601]
    explanation: >
      Der Unreleased-Abschnitt wächst mit jedem Pull Request. Beim Release wird er zur neuen Version mit
      ISO-Datum, und darüber entsteht ein neuer, leerer Unreleased-Abschnitt.
  - type: multiple
    question: Was gehört typischerweise in eine CONTRIBUTING.md?
    options:
      - Wie man die Entwicklungsumgebung einrichtet und die Tests startet.
      - Welche Regeln für Branches, Commit-Messages und Pull Requests gelten.
      - Die Zugangsdaten zum Produktionsserver.
      - Wie man einen Fehler meldet.
    answers: [0, 1, 3]
    explanation: Zugangsdaten gehören niemals in eine Datei im Repository – weder in die CONTRIBUTING.md noch sonst wohin.
tasks:
  - id: changelog-kategorien
    type: dragdrop
    title: In welche Kategorie gehört die Änderung?
    description: Ordne jeden Changelog-Eintrag der passenden Kategorie nach Keep a Changelog zu.
    targets:
      - { id: added, label: Added }
      - { id: changed, label: Changed }
      - { id: deprecated, label: Deprecated }
      - { id: removed, label: Removed }
      - { id: fixed, label: Fixed }
      - { id: security, label: Security }
    items:
      - { label: Notizen lassen sich als CSV exportieren., target: added }
      - { label: Die Liste ist jetzt nach Datum statt nach Titel sortiert., target: changed }
      - { label: "Der Befehl `notes rm` wird in 3.0 entfernt – nutze `notes delete`.", target: deprecated }
      - { label: Die Unterstützung für Node.js 20 wurde entfernt., target: removed }
      - { label: Leere Notizen werden nicht mehr gespeichert., target: fixed }
      - { label: Eingaben werden jetzt maskiert und können kein HTML mehr einschleusen., target: security }
    hints:
      - "Deprecated heißt „gibt es noch, verschwindet aber bald“ – Removed heißt „ist schon weg“."
  - id: release-vorbereiten
    type: terminal
    title: Ein Release im Changelog vorbereiten
    description: |
      Im Ordner `changelog-release` liegt der `CHANGELOG.md` eines Notiz-Programms. Unter `[Unreleased]` stehen zwei
      Änderungen, die jetzt als Version **1.2.0** am **2026-10-01** erscheinen.

      1. Mach aus dem bisherigen Unreleased-Abschnitt die Version: Überschrift `## [1.2.0] - 2026-10-01`.
      2. Lege darüber einen neuen, **leeren** Abschnitt `## [Unreleased]` an.
      3. Ergänze in Version 1.2.0 die Kategorie `### Changed` mit dem Eintrag
         `- Die Liste ist jetzt nach Datum sortiert.`
      4. Pass die Links am Ende an: `[Unreleased]` vergleicht jetzt `v1.2.0...HEAD`, und es gibt einen neuen Link
         `[1.2.0]: https://github.com/example/notizen/compare/v1.1.0...v1.2.0`.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit die Datei angelegt wird.
    workdir: changelog-release
    setup: |
      cat > CHANGELOG.md <<'EOF'
      # Changelog

      Alle wichtigen Änderungen an diesem Projekt stehen in dieser Datei.

      Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
      und das Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

      ## [Unreleased]

      ### Added

      - Export der Notizen als CSV.

      ### Fixed

      - Leere Notizen werden nicht mehr gespeichert.

      ## [1.1.0] - 2026-09-14

      ### Added

      - Suche in Notizen.

      ## [1.0.0] - 2026-08-01

      ### Added

      - Erste Version mit Anlegen, Anzeigen und Löschen von Notizen.

      [Unreleased]: https://github.com/example/notizen/compare/v1.1.0...HEAD
      [1.1.0]: https://github.com/example/notizen/compare/v1.0.0...v1.1.0
      [1.0.0]: https://github.com/example/notizen/releases/tag/v1.0.0
      EOF
    checks:
      - type: command
        run: grep -nE '^## \[(Unreleased|1\.2\.0|1\.1\.0)\]' CHANGELOG.md | cut -d'[' -f2 | cut -d']' -f1 | tr '\n' ' '
        stdout_matches: "^Unreleased 1\\.2\\.0 1\\.1\\.0\\s*$"
        message: "Reihenfolge von oben nach unten: `## [Unreleased]`, dann `## [1.2.0] - …`, dann `## [1.1.0] - …` – jeweils genau einmal."
      - type: file_contains
        path: CHANGELOG.md
        pattern: "^## \\[1\\.2\\.0\\] - 2026-10-01\\s*$"
        message: "Die Überschrift der neuen Version muss genau `## [1.2.0] - 2026-10-01` lauten."
      - type: command
        run: awk '/^## \[Unreleased\]/{f=1;next} /^## /{f=0} f' CHANGELOG.md | grep -cE '^(- |### )' || true
        stdout_equals: "0"
        message: Der neue Abschnitt `## [Unreleased]` soll leer sein – die Einträge gehören jetzt zu 1.2.0.
      - type: command
        run: awk '/^## \[1\.2\.0\]/{f=1;next} /^## /{f=0} f' CHANGELOG.md | grep -cE '^- (Export der Notizen als CSV|Leere Notizen werden nicht mehr gespeichert|Die Liste ist jetzt nach Datum sortiert)'
        stdout_equals: "3"
        message: Version 1.2.0 soll drei Einträge enthalten – CSV-Export, die Fehlerbehebung zu leeren Notizen und die Sortierung nach Datum.
      - type: command
        run: awk '/^## \[1\.2\.0\]/{f=1;next} /^## /{f=0} f' CHANGELOG.md | grep -A2 '^### Changed' | grep -c 'nach Datum sortiert'
        stdout_equals: "1"
        message: "Der Eintrag zur Sortierung gehört unter `### Changed` in Version 1.2.0."
      - type: file_contains
        path: CHANGELOG.md
        pattern: "^\\[Unreleased\\]: https://github\\.com/example/notizen/compare/v1\\.2\\.0\\.\\.\\.HEAD\\s*$"
        message: "Der Link `[Unreleased]` soll jetzt `compare/v1.2.0...HEAD` vergleichen."
      - type: file_contains
        path: CHANGELOG.md
        pattern: "^\\[1\\.2\\.0\\]: https://github\\.com/example/notizen/compare/v1\\.1\\.0\\.\\.\\.v1\\.2\\.0\\s*$"
        message: "Es fehlt der Link `[1.2.0]: https://github.com/example/notizen/compare/v1.1.0...v1.2.0`."
    hints:
      - "Öffne die Datei mit `nano CHANGELOG.md`. Die alte Zeile `## [Unreleased]` wird zu `## [1.2.0] - 2026-10-01`."
      - "Darüber fügst du `## [Unreleased]` und eine Leerzeile ein – ohne Einträge."
      - "Die Kategorie `### Changed` mit ihrem Eintrag kommt in den 1.2.0-Abschnitt, z. B. nach `### Added`."
    solution: |
      ```bash
      cd changelog-release
      sed -i 's/^## \[Unreleased\]$/## [Unreleased]\n\n## [1.2.0] - 2026-10-01/' CHANGELOG.md
      sed -i 's/^### Fixed$/### Changed\n\n- Die Liste ist jetzt nach Datum sortiert.\n\n### Fixed/' CHANGELOG.md
      sed -i 's#^\[Unreleased\]: .*#[Unreleased]: https://github.com/example/notizen/compare/v1.2.0...HEAD\n[1.2.0]: https://github.com/example/notizen/compare/v1.1.0...v1.2.0#' CHANGELOG.md
      cat CHANGELOG.md
      ```

      Von Hand in `nano` geht es genauso: neue Überschriften einfügen, Eintrag ergänzen, Links anpassen.
---
Dein Projekt bekommt plötzlich Interesse: Jemand möchte einen Fehler beheben, weiß aber nicht, wie man die Tests
startet. Und eine Nutzerin fragt, ob das Update auf Version 2.0 gefahrlos ist. Zwei Dateien beantworten diese
Fragen, ohne dass du jedes Mal antworten musst: **CONTRIBUTING.md** und **CHANGELOG.md**.

## CONTRIBUTING.md: der Weg zum ersten Beitrag

Die [[contributing|CONTRIBUTING.md]] erklärt, **wie** man zu einem Projekt beiträgt. Die README sagt
„Wie benutze ich das?“, die CONTRIBUTING sagt „Wie ändere ich das?“.

GitHub verlinkt die Datei automatisch, wenn jemand ein Issue oder einen Pull Request anlegt. Sie liegt im
Hauptordner, in `docs/` oder in `.github/`.

Typische Abschnitte:

| Abschnitt | Inhalt |
|---|---|
| Entwicklungsumgebung | Klonen, Abhängigkeiten installieren, Tests starten |
| Fehler melden | Was ein gutes Issue enthält (Schritte, erwartetes und tatsächliches Verhalten) |
| Branches und Commits | Namensschema, [[conventional-commits|Conventional Commits]] |
| Pull Requests | Was vor dem Einreichen erledigt sein muss (Tests, Doku, Changelog) |
| Code-Stil | Welcher Formatter und Linter gilt |

## Ein Beispiel für CONTRIBUTING.md

```markdown title="CONTRIBUTING.md"
# Mitwirken

Danke, dass du helfen willst! So kommst du zu deinem ersten Pull Request.

## Entwicklungsumgebung

1. Repository klonen und `npm install` ausführen.
2. Tests starten mit `npm test`.

## Commits

Wir nutzen Conventional Commits, z. B. `fix: handle empty notes`.

## Pull Requests

- Ein Pull Request löst genau ein Problem.
- Tests und Doku sind aktualisiert.
- Unter `[Unreleased]` im CHANGELOG.md steht ein Eintrag.
```

> [!PRAXIS]
> Viele Teams schreiben in die CONTRIBUTING.md auch, wie lange ein Review dauert und wer es macht. Das nimmt
> Neuen die Unsicherheit, ob ihr Beitrag überhaupt gesehen wird.

## CHANGELOG.md: Änderungen für Menschen

Ein [[changelog|Changelog]] listet für jede Version auf, was sich geändert hat. Er ist für **Menschen**
geschrieben: Die Git-Historie enthält auch „typo“, „wip“ und „review fixes“ – das interessiert beim Update
niemanden.

Das verbreitetste Format ist [[keep-a-changelog|Keep a Changelog]]. Seine Regeln:

- Die neueste Version steht **oben**.
- Jede Version hat eine Überschrift mit Nummer und Datum im Format JJJJ-MM-TT.
- Änderungen sind in **sechs Kategorien** gruppiert.
- Ganz oben sammelt `## [Unreleased]` alles, was noch nicht veröffentlicht ist.

Versionsnummern folgen meist [[semantic-versioning|Semantic Versioning]]: `MAJOR.MINOR.PATCH`. Ein
[[breaking-change|Breaking Change]] erhöht MAJOR, eine neue Funktion MINOR, eine Fehlerbehebung PATCH.

## Die sechs Kategorien

| Kategorie | Bedeutung | Beispiel |
|---|---|---|
| `Added` | neue Funktionen | „Export als CSV“ |
| `Changed` | Änderungen an Bestehendem | „Liste nach Datum sortiert“ |
| `Deprecated` | wird bald entfernt | „`notes rm` verschwindet in 3.0“ |
| `Removed` | wurde entfernt | „Kein Support mehr für Node.js 20“ |
| `Fixed` | Fehler behoben | „Leere Notizen werden nicht gespeichert“ |
| `Security` | Sicherheitslücke behoben | „Eingaben werden maskiert“ |

Schreib Einträge aus Sicht der Nutzer:innen: **was** sich für sie ändert, nicht **welche Datei** du angefasst hast.

> [!FEHLER]
> Den Changelog aus `git log` kopieren. „refactor: extract helper“ und „chore: bump deps“ helfen niemandem
> beim Update. Ein Changelog ist eine **Auswahl**, keine Kopie der Historie.

## Unreleased und das Release

So sieht ein Changelog nach Keep a Changelog aus:

```markdown title="CHANGELOG.md"
# Changelog

## [Unreleased]

### Added

- Export der Notizen als CSV.

## [1.1.0] - 2026-09-14

### Fixed

- Suche findet jetzt auch Umlaute.

[Unreleased]: https://github.com/example/notizen/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/example/notizen/compare/v1.0.0...v1.1.0
```

Der Ablauf im Team:

1. Jeder Pull Request ergänzt einen Eintrag unter `[Unreleased]`.
2. Beim Release wird `[Unreleased]` zur neuen Version mit Datum.
3. Darüber entsteht ein neuer, leerer `[Unreleased]`-Abschnitt.
4. Die Links am Ende zeigen auf den Vergleich zweier Git-[[tag|Tags]].

> [!MERKSATZ]
> Wer Änderungen direkt im Pull Request unter `[Unreleased]` einträgt, hat beim Release keine Arbeit mehr –
> der Changelog ist schon fertig.

## Zusammenfassung

- **CONTRIBUTING.md** erklärt, wie man beiträgt: Umgebung, Commits, Pull Requests, Code-Stil.
- **CHANGELOG.md** listet Änderungen pro Version – für Menschen, nicht als Kopie von `git log`.
- **Keep a Changelog**: neueste Version oben, Datum JJJJ-MM-TT, sechs Kategorien.
- `## [Unreleased]` sammelt Änderungen bis zum nächsten Release.
- Versionsnummern folgen **Semantic Versioning**; Breaking Changes erhöhen MAJOR.
