---
title: Versionen und Releases
summary: Versionsnummern aus Commits ableiten, Releases mit annotierten Tags markieren und automatisch einen GitHub-Release mit Release Notes erzeugen.
duration: 22
sources:
  - title: Semantic Versioning 2.0.0
    url: https://semver.org/lang/de/
  - title: Conventional Commits 1.0.0
    url: https://www.conventionalcommits.org/de/v1.0.0/
  - title: Keep a Changelog
    url: https://keepachangelog.com/de/1.1.0/
  - title: GitHub CLI – gh release create
    url: https://cli.github.com/manual/gh_release_create
  - title: GitHub Docs – Automatically generated release notes
    url: https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes
quiz:
  - type: single
    question: "Aktuelle Version 2.4.1. Seitdem: `fix: round prices`, `feat: add coupons`, `docs: update readme`. Welche Version kommt als Nächstes?"
    options: ["2.4.2", "2.5.0", "3.0.0", "2.5.1"]
    answer: 1
    explanation: >
      Der höchste Änderungstyp entscheidet. Ein `feat` erhöht MINOR und setzt PATCH auf 0 – also 2.5.0.
  - type: match
    question: Ordne jeder Commit-Art die Versionsstelle zu, die sie erhöht.
    pairs:
      - { left: "fix: …", right: "PATCH" }
      - { left: "feat: …", right: "MINOR" }
      - { left: "feat!: … oder BREAKING CHANGE im Text", right: "MAJOR" }
      - { left: "docs: … oder chore: …", right: "keine eigene Erhöhung" }
    explanation: So hängen Conventional Commits und Semantic Versioning zusammen.
  - type: multiple
    question: Warum markiert man ein Release mit einem annotierten Tag statt mit einem leichten Tag?
    options:
      - Er speichert Autor, Datum und eine Nachricht.
      - Er kann signiert werden.
      - git describe und viele Release-Werkzeuge nutzen standardmäßig annotierte Tags.
      - Er macht den Code schneller.
    answers: [0, 1, 2]
    explanation: Ein annotierter Tag ist ein eigenes Git-Objekt mit Metadaten – genau das, was ein Release braucht.
  - type: cloze
    text: "Ein Release-Workflow startet bei `push` mit dem Filter `tags: ['___*']`. Damit er einen GitHub-Release anlegen darf, braucht er `contents: ___`."
    blanks:
      - [v]
      - [write]
    explanation: "Releases schreiben ins Repository, deshalb reicht `contents: read` hier nicht."
tasks:
  - id: naechste-version
    type: code
    language: js
    title: Die nächste Version aus Commits berechnen
    description: |
      Schreib `nextVersion(current, commits)`. `current` ist eine Version wie `'1.4.2'`, `commits` ein Array von
      Commit-Betreffzeilen nach Conventional Commits.

      - Gibt es einen Breaking Change (`!` vor dem Doppelpunkt, z. B. `feat!:` oder `fix(api)!:`), steigt MAJOR,
        MINOR und PATCH werden 0.
      - Sonst: mindestens ein `feat` → MINOR steigt, PATCH wird 0.
      - Sonst: mindestens ein `fix` → PATCH steigt.
      - Sonst (nur `docs`, `chore` … oder gar keine Commits) bleibt die Version gleich.
      - Ein Scope in Klammern (`feat(cart): …`) ändert nichts an der Regel.
    starter: |
      function nextVersion(current, commits) {
        const [major, minor, patch] = current.split('.').map(Number)
        // Typ und Breaking-Markierung aus jeder Zeile lesen
        return current
      }
    tests:
      - name: feat erhöht MINOR
        code: "assertEqual(nextVersion('1.4.2', ['fix: round prices', 'feat: add coupons']), '1.5.0')"
      - name: nur fix erhöht PATCH
        code: "assertEqual(nextVersion('1.4.2', ['fix(cart): empty cart crash']), '1.4.3')"
      - name: Breaking Change erhöht MAJOR
        code: "assertEqual(nextVersion('1.4.2', ['feat(api)!: drop v1 endpoints', 'fix: typo']), '2.0.0')"
      - name: docs und chore ändern nichts
        code: "assertEqual(nextVersion('0.9.0', ['docs: readme', 'chore: bump deps']), '0.9.0')"
      - name: keine Commits
        code: "assertEqual(nextVersion('3.0.0', []), '3.0.0')"
    solution: |
      function nextVersion(current, commits) {
        const [major, minor, patch] = current.split('.').map(Number)
        const parsed = commits
          .map((line) => line.match(/^(\w+)(\([^)]*\))?(!)?:/))
          .filter(Boolean)
        if (parsed.some((m) => m[3] === '!')) return `${major + 1}.0.0`
        if (parsed.some((m) => m[1] === 'feat')) return `${major}.${minor + 1}.0`
        if (parsed.some((m) => m[1] === 'fix')) return `${major}.${minor}.${patch + 1}`
        return current
      }
  - id: release-taggen
    type: terminal
    title: Ein Release vorbereiten und taggen
    description: |
      Im Ordner `release` liegt ein Repository. Die letzte Version ist der Tag `v1.2.0`, seitdem gab es drei
      Commits (`git log --oneline v1.2.0..HEAD`).

      1. Bestimme die nächste Version nach Semantic Versioning.
      2. Ergänze in `CHANGELOG.md` **oberhalb** von `## [1.2.0]` einen Abschnitt `## [1.3.0]` mit den
         Unterüberschriften `### Added` und `### Fixed` und je einem Eintrag dazu.
      3. Schreib `.github/workflows/release.yml`: Trigger `push` von Tags `v*`, `permissions` mit
         `contents: write`, ein Job `release` auf `ubuntu-latest` mit `actions/checkout@v7` und einem Step,
         der `gh release create` mit `--generate-notes` aufruft und als Umgebungsvariable
         `GH_TOKEN: ${{ github.token }}` bekommt.
      4. Committe beides und setze auf diesen Commit den **annotierten** Tag `v1.3.0` mit einer Nachricht.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: release
    setup: |
      git init -q -b main
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      cat > CHANGELOG.md <<'EOF'
      # Changelog

      ## [1.2.0] - 2026-09-01

      ### Added

      - Suche nach Produkten.
      EOF
      printf 'Shop\n' > README.md
      git add . && git commit -q -m "feat: add product search"
      git tag -a v1.2.0 -m "Release 1.2.0"
      printf 'Shop mit Wunschliste\n' > README.md
      git commit -qam "feat: add wishlist"
      printf 'Shop mit Wunschliste.\n' > README.md
      git commit -qam "fix: round prices in cart"
      printf 'Shop mit Wunschliste!\n' > README.md
      git commit -qam "docs: describe wishlist"
    checks:
      - type: file_contains
        path: CHANGELOG.md
        pattern: "## \\[1\\.3\\.0\\][\\s\\S]*### Added[\\s\\S]*### Fixed[\\s\\S]*## \\[1\\.2\\.0\\]"
        message: In CHANGELOG.md fehlt oberhalb von 1.2.0 ein Abschnitt "## [1.3.0]" mit "### Added" und "### Fixed".
      - type: command
        run: |
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/release.yml").text())))' | jq -e '(.on.push.tags | map(test("^v")) | any) and .permissions.contents == "write"'
        message: "release.yml braucht den Trigger push mit tags ['v*'] und permissions contents: write."
      - type: command
        run: |
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/release.yml").text())))' | jq -e '.jobs.release.steps | (map(.uses // "") | index("actions/checkout@v7") != null) and (map(select((.run // "") | test("gh release create.*--generate-notes"))) | .[0].env.GH_TOKEN | test("github\\.token|secrets\\.GITHUB_TOKEN"))'
        message: Im Job release fehlen der Checkout oder ein Step mit gh release create … --generate-notes und env GH_TOKEN.
      - type: command
        run: test -z "$(git status --porcelain)"
        message: Es gibt noch nicht committete Änderungen – committe CHANGELOG.md und den Workflow.
      - type: command
        run: git cat-file -t v1.3.0
        stdout_equals: tag
        message: Es gibt keinen annotierten Tag v1.3.0. Nutze git tag -a v1.3.0 -m "…".
      - type: command
        run: test "$(git rev-parse v1.3.0^{commit})" = "$(git rev-parse HEAD)"
        message: Der Tag v1.3.0 zeigt nicht auf den aktuellen Commit mit Changelog und Workflow.
      - type: command
        run: git show v1.3.0^{commit} --name-only --format= | sort | tr '\n' ' '
        stdout_matches: "\\.github/workflows/release\\.yml.*CHANGELOG\\.md|CHANGELOG\\.md.*release\\.yml"
        message: Der getaggte Commit soll CHANGELOG.md und .github/workflows/release.yml enthalten.
    hints:
      - "Commits seit dem letzten Release: `git log --oneline v1.2.0..HEAD`. Ein `feat` ist dabei – also steigt MINOR."
      - "Ein `gh release create`-Step: `run: gh release create \"${{ github.ref_name }}\" --generate-notes` mit `env:` → `GH_TOKEN: ${{ github.token }}`."
      - "Zum Schluss: `git add . && git commit -m \"chore(release): 1.3.0\"` und `git tag -a v1.3.0 -m \"Release 1.3.0\"`."
    solution: |
      ```bash
      cd release
      git log --oneline v1.2.0..HEAD
      cat > CHANGELOG.md <<'EOF'
      # Changelog

      ## [1.3.0] - 2026-10-10

      ### Added

      - Wunschliste.

      ### Fixed

      - Preise im Warenkorb werden korrekt gerundet.

      ## [1.2.0] - 2026-09-01

      ### Added

      - Suche nach Produkten.
      EOF
      mkdir -p .github/workflows
      cat > .github/workflows/release.yml <<'EOF'
      name: Release

      on:
        push:
          tags: ['v*']

      permissions:
        contents: write

      jobs:
        release:
          runs-on: ubuntu-latest
          steps:
            - uses: actions/checkout@v7
            - run: gh release create "${{ github.ref_name }}" --generate-notes
              env:
                GH_TOKEN: ${{ github.token }}
      EOF
      git add .
      git commit -m "chore(release): 1.3.0"
      git tag -a v1.3.0 -m "Release 1.3.0"
      ```
---

„Welche Version läuft eigentlich gerade in Produktion?“ – Wenn auf diese Frage jemand „die von letzter
Woche, glaube ich“ antwortet, fehlt ein sauberer Release-Prozess. Versionen geben jedem ausgelieferten Stand
einen Namen, den Menschen und Maschinen verstehen.

## Versionsnummern mit Bedeutung

Du kennst [[semantic-versioning|Semantic Versioning]] aus dem Git-Kurs: `MAJOR.MINOR.PATCH`. Zur Erinnerung:

| Stelle | steigt bei … | Beispiel |
|---|---|---|
| MAJOR | inkompatiblen Änderungen | 1.4.2 → 2.0.0 |
| MINOR | neuen, kompatiblen Funktionen | 1.4.2 → 1.5.0 |
| PATCH | kompatiblen Fehlerbehebungen | 1.4.2 → 1.4.3 |

Mit [[conventional-commits|Conventional Commits]] lässt sich die nächste Version sogar **ausrechnen**:
`fix` → PATCH, `feat` → MINOR, ein `!` oder `BREAKING CHANGE` → MAJOR. Der höchste Typ seit dem letzten
Release gewinnt. `docs`, `chore` oder `test` allein lösen kein neues Release aus.

Vor einem großen Release gibt es oft Vorabversionen wie `2.0.0-rc.1` (Release Candidate). Sie sind nach
Semantic Versioning **kleiner** als `2.0.0` und landen typischerweise nur auf Staging oder bei
Testkundinnen und -kunden. Wer wissen will, wie weit ein Commit vom letzten Release entfernt ist, fragt
Git mit `git describe`: Die Ausgabe `v1.2.0-3-g8be41d0` heißt „drei Commits nach v1.2.0, Commit 8be41d0“.

> [!MERKSATZ]
> Die Versionsnummer ist ein Versprechen an alle, die deine Software nutzen: Was ändert sich für mich,
> wenn ich aktualisiere?

## Ein Release markieren

Ein [[release|Release]] braucht drei Dinge:

1. **Changelog** – ein [[changelog|Changelog]] für Menschen, was neu ist.
2. **Tag** – ein [[annotierter-tag|annotierter Tag]] auf genau dem Commit, der ausgeliefert wird.
3. **Artefakt** – das gebaute Paket oder Image mit derselben Versionsnummer.

```bash title="Release 1.3.0 vorbereiten"
git log --oneline v1.2.0..HEAD
git add CHANGELOG.md
git commit -m "chore(release): 1.3.0"
git tag -a v1.3.0 -m "Release 1.3.0"
git push origin main --follow-tags
```

`git log v1.2.0..HEAD` zeigt alle Commits seit dem letzten Release – die Grundlage für Version und
Changelog. `--follow-tags` schiebt annotierte Tags gleich mit.

> [!FEHLER]
> **Einen veröffentlichten Tag verschieben.** Wurde `v1.3.0` schon gepusht und ist falsch, erstellst du
> `v1.3.1`. Ein verschobener Tag bedeutet: Zwei Leute meinen mit „1.3.0“ unterschiedlichen Code.

## Der Release-Workflow

Den Rest erledigt die Pipeline. Ein Workflow, der auf Tags reagiert, baut das Artefakt mit Versionsnummer
und legt einen GitHub-Release an:

```yaml title=".github/workflows/release.yml"
name: Release

on:
  push:
    tags: ['v*']

permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - run: ./build.sh "${{ github.ref_name }}"
      - run: gh release create "${{ github.ref_name }}" dist/*.tar.gz --generate-notes
        env:
          GH_TOKEN: ${{ github.token }}
```

`--generate-notes` erstellt [[release-notes|Release Notes]] aus den Pull Requests seit dem letzten Release.
`github.ref_name` ist hier der Tag, also `v1.3.0`. Weil der Workflow einen Release **anlegt**, braucht er
`contents: write`.

## Versionen in Images und Anwendung

Dieselbe Version taucht überall auf:

- als [[image-tag|Image-Tag]] (`shop:1.3.0`) neben dem Commit-Tag,
- als Name des Build-Artefakts (`app-1.3.0.tar.gz`),
- in der Anwendung selbst, etwa in einer Umgebungsvariable `APP_VERSION`, die im Footer oder in
  Fehlerberichten erscheint.

> [!PRAXIS]
> Viele Teams lassen Werkzeuge wie release-please oder semantic-release die Version aus den Commits
> berechnen, den Changelog schreiben und den Tag setzen. Das funktioniert nur, wenn die Commit-Messages
> sauber sind – ein guter Grund für Conventional Commits.

## Zusammenfassung

- Semantic Versioning: MAJOR für Inkompatibles, MINOR für Neues, PATCH für Fehlerbehebungen.
- Aus Conventional Commits lässt sich die nächste Version berechnen.
- Ein Release = Changelog + annotierter Tag + Artefakt mit derselben Version.
- Veröffentlichte Tags verschiebst du nie – lieber eine neue Patch-Version.
- Ein Workflow mit `tags: ['v*']` und `contents: write` legt den GitHub-Release automatisch an.
