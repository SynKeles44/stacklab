---
title: Interne Pakete versionieren mit Changesets
summary: Wie Changesets im Monorepo festhält, welches Paket sich wie geändert hat, daraus Versionen und Changelogs erzeugt und abhängige Pakete mitzieht.
duration: 25
sources:
  - title: Changesets – Getting started
    url: https://changesets.dev/guide/getting-started
  - title: Changesets – Repository und Dokumentation
    url: https://github.com/changesets/changesets
  - title: Semantic Versioning 2.0.0
    url: https://semver.org/lang/de/
  - title: Bun Docs – bun publish
    url: https://bun.com/docs/pm/cli/publish
quiz:
  - type: single
    question: Was ist ein Changeset?
    options:
      - Ein Git-Commit mit besonderem Präfix
      - Eine kleine Markdown-Datei, die festhält, welche Pakete sich wie (patch, minor, major) ändern und warum
      - Die fertige CHANGELOG.md eines Pakets
      - Ein Branch, auf dem Releases vorbereitet werden
    answer: 1
    explanation: Changesets sammeln sich im Ordner .changeset. Erst changeset version verarbeitet sie zu Versionen und Changelogs.
  - type: match
    question: Was macht welcher Befehl?
    pairs:
      - { left: "changeset (oder changeset add)", right: "Neues Changeset anlegen" }
      - { left: "changeset status", right: "Zeigt, welche Pakete wie erhöht würden" }
      - { left: "changeset version", right: "Versionen erhöhen, Changelogs schreiben, Changesets verbrauchen" }
      - { left: "changeset publish", right: "Neue Versionen veröffentlichen und Git-Tags anlegen" }
    explanation: Anlegen passiert bei jeder Änderung, version und publish nur beim Release.
  - type: single
    question: '@kiosk/kasse hängt mit "workspace:*" von @kiosk/preise ab. Ein Changeset erhöht preise als minor. Was passiert mit der Kasse bei changeset version?'
    options:
      - Nichts, sie ist nicht im Changeset erwähnt.
      - Sie bekommt automatisch einen patch-Sprung mit dem Changelog-Eintrag „Updated dependencies“.
      - Sie bekommt ebenfalls einen minor-Sprung.
      - changeset version bricht ab.
    answer: 1
    explanation: Changesets kennt die internen Abhängigkeiten und erhöht abhängige Pakete mindestens als patch, damit sie die neue Version mitbringen.
  - type: cloze
    text: 'Im Kopf eines Changesets steht pro Paket die Art des Sprungs, z. B. `"@kiosk/preise": ___`. Die Konfiguration liegt in `.changeset/___`.'
    blanks:
      - [minor, patch, major]
      - [config.json]
    explanation: Jede der drei Stufen nach Semantic Versioning ist erlaubt. config.json legt u. a. den Basis-Branch fest.
tasks:
  - id: changeset-release
    type: terminal
    title: Ein Release mit Changesets
    description: |
      Im Monorepo `changesets-release` ist Changesets schon eingerichtet (`.changeset/config.json`).
      Es gibt `@kiosk/preise` (1.0.0), `@kiosk/kasse` (0.1.0, nutzt preise) und `@kiosk/web` (0.1.0, nutzt
      preise **nicht**). In `packages/preise` ist eine neue Funktion `formatRabatt` dazugekommen.

      1. Lege ein Changeset an: `@kiosk/preise` bekommt einen **minor**-Sprung, Beschreibung z. B.
         „Neue Funktion formatRabatt“. Du kannst den interaktiven Assistenten `bunx changeset` nutzen oder
         `bunx changeset --minor @kiosk/preise -m "…"`.
      2. Schau dir mit `bunx changeset status` an, was passieren wird.
      3. Erzeuge die neuen Versionen mit `bunx changeset version`.
      4. Lies die neuen `CHANGELOG.md`-Dateien.

      Klicke zuerst auf **Aufgabe vorbereiten** (das dauert ein paar Sekunden).
    workdir: changesets-release
    setup: |
      git init -q -b main
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      mkdir -p packages/preise/src apps/kasse apps/web .changeset
      cat > package.json <<'EOF'
      {
        "name": "kiosk",
        "private": true,
        "workspaces": ["apps/*", "packages/*"],
        "devDependencies": { "@changesets/cli": "^3.0.0" }
      }
      EOF
      printf '{\n  "baseBranch": "main",\n  "access": "restricted"\n}\n' > .changeset/config.json
      printf 'node_modules\n' > .gitignore
      printf '{\n  "name": "@kiosk/preise",\n  "version": "1.0.0"\n}\n' > packages/preise/package.json
      printf 'export const formatPreis = (cent: number) => (cent / 100).toFixed(2) + " EUR";\n' > packages/preise/src/index.ts
      printf '{\n  "name": "@kiosk/kasse",\n  "version": "0.1.0",\n  "dependencies": { "@kiosk/preise": "workspace:*" }\n}\n' > apps/kasse/package.json
      printf '{\n  "name": "@kiosk/web",\n  "version": "0.1.0"\n}\n' > apps/web/package.json
      bun install > /dev/null 2>&1
      git add -A
      git commit -q -m "chore: initial monorepo"
      printf 'export const formatRabatt = (prozent: number) => "-" + prozent + " %%";\n' >> packages/preise/src/index.ts
    checks:
      - type: command
        run: jq -r '.version' packages/preise/package.json
        stdout_equals: "1.1.0"
        message: '@kiosk/preise steht noch nicht auf 1.1.0. Lege ein minor-Changeset an und führe `bunx changeset version` aus.'
      - type: command
        run: jq -r '.version' apps/kasse/package.json
        stdout_equals: "0.1.1"
        message: '@kiosk/kasse sollte als abhängiges Paket automatisch auf 0.1.1 springen – lief changeset version?'
      - type: command
        run: jq -r '.version' apps/web/package.json
        stdout_equals: "0.1.0"
        message: '@kiosk/web nutzt preise nicht und muss auf 0.1.0 bleiben. Erwähne im Changeset nur @kiosk/preise.'
      - type: file_contains
        path: packages/preise/CHANGELOG.md
        pattern: "## 1\\.1\\.0"
        message: In packages/preise fehlt eine CHANGELOG.md mit dem Abschnitt „## 1.1.0“.
      - type: command
        run: find .changeset -name '*.md' ! -name 'README.md' | wc -l
        stdout_matches: "^\\s*0\\s*$"
        message: Im Ordner .changeset liegen noch unverarbeitete Changesets. `bunx changeset version` verbraucht sie.
    hints:
      - '`bunx changeset --minor @kiosk/preise -m "Neue Funktion formatRabatt"` legt das Changeset ohne Rückfragen an.'
      - Mit `ls .changeset` und `cat .changeset/*.md` siehst du die erzeugte Datei.
      - Danach `bunx changeset status` und `bunx changeset version`.
    solution: |
      ```bash
      cd changesets-release
      bunx changeset --minor @kiosk/preise -m "Neue Funktion formatRabatt"
      cat .changeset/*.md
      bunx changeset status
      bunx changeset version
      cat packages/preise/CHANGELOG.md apps/kasse/CHANGELOG.md
      ```
  - id: semver-sprung
    type: dragdrop
    title: patch, minor oder major?
    description: Du legst Changesets für `@kiosk/preise` an. Ordne jede Änderung der passenden Sprungart zu.
    targets:
      - { id: patch, label: patch }
      - { id: minor, label: minor }
      - { id: major, label: major }
    items:
      - { label: Rundungsfehler in formatPreis behoben, target: patch }
      - { label: Neue Funktion formatRabatt hinzugefügt, target: minor }
      - { label: formatPreis erwartet jetzt Euro statt Cent, target: major }
      - { label: Optionaler zweiter Parameter für die Währung, target: minor }
      - { label: Funktion formatAlt entfernt, target: major }
      - { label: Tippfehler in einer Fehlermeldung korrigiert, target: patch }
    hints:
      - Muss Code, der das Paket nutzt, angepasst werden? Dann ist es major.
---
Deine Bibliothek `@kiosk/preise` hat eine neue Funktion bekommen. Welche Versionsnummer bekommt sie jetzt?
Und was ist mit der Kasse, die sie nutzt? Bei drei Paketen behältst du das im Kopf – bei dreißig nicht
mehr. Changesets nimmt dir diese Buchhaltung ab.

## Versionen im Monorepo

Jedes Paket hat seine eigene Version nach [[semantic-versioning|Semantic Versioning]]:

| Sprung | Bedeutung | Beispiel |
|---|---|---|
| patch | Fehlerbehebung, nichts Neues | 1.0.0 → 1.0.1 |
| minor | neue Funktion, rückwärtskompatibel | 1.0.0 → 1.1.0 |
| major | [[breaking-change\|Breaking Change]] | 1.0.0 → 2.0.0 |

Im Monorepo kommt eine Schwierigkeit dazu: Ändert sich `preise`, sollte auch jedes Paket, das `preise`
nutzt, eine neue Version bekommen – sonst bringt es die Änderung nicht mit. Außerdem braucht jedes Paket
einen eigenen [[changelog|Changelog]].

[[changesets|Changesets]] löst das mit einer einfachen Idee: Wer etwas ändert, beschreibt **sofort** in
einer kleinen Datei, welches Paket sich wie ändert. Beim Release werden alle diese Dateien gesammelt
verarbeitet.

## Ein Changeset anlegen

Ein Changeset ist eine Markdown-Datei im Ordner `.changeset`:

```markdown title=".changeset/smooth-actors-feel.md"
---
"@kiosk/preise": minor
---

Neue Funktion formatRabatt
```

Oben steht pro Paket die Sprungart, darunter der Text für den Changelog. Du legst sie mit dem Assistenten
an – interaktiv oder in einer Zeile:

```bash title="Terminal"
bunx changeset                                              # Assistent fragt nach Paketen und Sprung
bunx changeset --minor @kiosk/preise -m "Neue Funktion formatRabatt"
```

Das Changeset wird zusammen mit dem Code committet und landet im selben Pull Request. So sehen Reviewer
direkt, welche Versionswirkung die Änderung hat.

> [!MERKSATZ]
> Ein Changeset beschreibt die **Absicht** („preise bekommt ein minor-Update, weil …“). Die eigentliche
> Versionsnummer entsteht erst beim Release.

## Das Release: version und publish

![Ablauf mit Changesets: von der Änderung bis zur Veröffentlichung](/assets/monorepos-workspaces/changesets-ablauf.svg)

```text title="bunx changeset status"
Packages to be bumped:
- minor
  - @kiosk/preise
- patch
  - @kiosk/kasse
```

`bunx changeset version` erledigt dann alles auf einmal:

- erhöht die Versionen in den package.json-Dateien,
- erhöht **abhängige** Pakete mindestens als patch (hier `@kiosk/kasse`),
- schreibt oder ergänzt `CHANGELOG.md` in jedem betroffenen Paket,
- löscht die verarbeiteten Changesets.

```markdown title="apps/kasse/CHANGELOG.md"
## 0.1.1

### Patch Changes

- Updated dependencies
  - @kiosk/preise@1.1.0
```

`bunx changeset publish` veröffentlicht anschließend jedes Paket, dessen Version neuer ist als in der
Registry, und legt Git-Tags an. Interne Pakete mit `"private": true` werden dabei übersprungen.

> [!FEHLER]
> **Versionen von Hand ändern.** Wer `"version"` direkt in der package.json erhöht, vergisst schnell die
> abhängigen Pakete und den Changelog. Im Monorepo mit Changesets änderst du Versionen nur über
> `changeset version`.

## Konfiguration und Praxis

`.changeset/config.json` steuert das Verhalten. Die wichtigsten Felder:

| Feld | Bedeutung |
|---|---|
| `baseBranch` | Vergleichs-Branch, meist `main` |
| `access` | `restricted` (Standard) oder `public` für öffentliche Pakete mit Scope |
| `fixed` | Gruppen von Paketen, die immer **dieselbe** Version tragen |
| `linked` | Gruppen, deren Versionen gemeinsam steigen |
| `ignore` | Pakete, die nie versioniert werden, z. B. Beispiel-Apps |

> [!PRAXIS]
> In vielen Teams prüft die CI, ob ein Pull Request ein Changeset enthält (`changeset status`). Nach dem
> Merge öffnet ein Bot einen „Version Packages“-Pull-Request mit allen gesammelten Versionen und
> Changelogs. Wird dieser gemergt, startet die Veröffentlichung.

Nicht jedes Monorepo braucht Versionen: Pakete, die nur intern mit `workspace:*` genutzt und nie
veröffentlicht werden, kommen auch ganz ohne Changesets aus.

## Zusammenfassung

- Jedes Paket hat eine eigene Version; abhängige Pakete müssen bei Änderungen mitziehen.
- Ein Changeset ist eine Markdown-Datei in `.changeset/` mit Paket, Sprungart und Beschreibung.
- `changeset status` zeigt die geplanten Sprünge, `changeset version` erhöht Versionen, schreibt Changelogs und verbraucht die Changesets.
- Abhängige Pakete bekommen automatisch einen patch-Sprung mit „Updated dependencies“.
- `changeset publish` veröffentlicht neue Versionen, `config.json` regelt Basis-Branch, Zugriff und Paketgruppen.
