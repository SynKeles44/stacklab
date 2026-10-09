---
title: Branch- und Commit-Konventionen
summary: Branches nach dem Muster typ/TICKET-slug benennen, Commit-Messages nach Conventional Commits mit Ticket-Scope schreiben und daraus Changelogs ableiten.
duration: 25
sources:
  - title: Conventional Commits 1.0.0
    url: https://www.conventionalcommits.org/de/v1.0.0/
  - title: Keep a Changelog 1.1.0
    url: https://keepachangelog.com/de/1.1.0/
  - title: git-check-ref-format Dokumentation
    url: https://git-scm.com/docs/git-check-ref-format
  - title: git-branch Dokumentation
    url: https://git-scm.com/docs/git-branch
quiz:
  - type: single
    question: Welcher Branch-Name folgt dem Muster `<typ>/<ticket>-<kurzer-slug>`?
    options:
      - Feature Warenkorb Rabatt
      - feat/SHOP-123-warenkorb-rabatt
      - annas-branch-2
      - FEAT/shop123/WarenkorbRabatt
    answer: 1
    explanation: Typ, Schrägstrich, Ticket-ID, dann ein kurzer Slug in Kleinbuchstaben mit Bindestrichen – so ist der Name lesbar und eindeutig.
  - type: find-bug
    question: Ben will einen Branch für Ticket SHOP-88 anlegen. Welche Zeile verstößt gegen die Team-Konvention?
    language: bash
    code: |
      git switch main
      git pull
      git switch -c fix/SHOP-88-Login_Fehler
      git push -u origin HEAD
    bug_line: 3
    explanation: Der Slug enthält Großbuchstaben und einen Unterstrich. Richtig wäre `fix/SHOP-88-login-fehler`.
  - type: match
    question: "Ordne jedem Teil der Commit-Message `feat(SHOP-123)!: remove legacy coupons` seine Rolle zu."
    pairs:
      - { left: "feat", right: "Commit-Typ" }
      - { left: "SHOP-123", right: "Scope (hier die Ticket-ID)" }
      - { left: "!", right: "Kennzeichnung einer Breaking Change" }
      - { left: "remove legacy coupons", right: "Kurzbeschreibung" }
    explanation: Typ, optionaler Scope in Klammern, optionales Ausrufezeichen und nach Doppelpunkt plus Leerzeichen die Beschreibung.
  - type: find-bug
    question: Welche Commit-Message verstößt gegen Conventional Commits?
    language: text
    code: |
      feat(SHOP-12): add wishlist button
      fix(SHOP-15): handle empty cart
      Fixed the bug in checkout
      docs: explain release process
    bug_line: 3
    explanation: "Zeile 3 hat keinen Typ und keinen Doppelpunkt. Richtig wäre etwa `fix(SHOP-16): handle missing address in checkout`."
  - type: cloze
    text: Ändert ein Commit eine öffentliche Schnittstelle inkompatibel, ergänzt man ein `!` nach dem Typ oder einen Footer `___ CHANGE:`.
    blanks:
      - [BREAKING]
    explanation: "Beide Varianten markieren eine Breaking Change. Werkzeuge erhöhen dann automatisch die MAJOR-Version."
tasks:
  - id: branchname-pruefen
    type: code
    language: js
    title: Branch-Namen automatisch prüfen
    description: |
      Schreibe `isValidBranchName(name)`. Die Team-Regel lautet:

      - Typ ist einer von `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
      - danach `/`, dann eine Ticket-ID aus Großbuchstaben, Bindestrich und Zahl (z. B. `SHOP-123`)
      - danach `-` und ein Slug aus Kleinbuchstaben, Ziffern und einzelnen Bindestrichen

      Gültig ist also `feat/SHOP-123-warenkorb-rabatt`. Die Funktion gibt `true` oder `false` zurück.
    starter: |
      function isValidBranchName(name) {
        // Tipp: ein regulärer Ausdruck mit ^ und $
      }
    tests:
      - name: Gültiger Name
        code: |
          assertEqual(isValidBranchName('feat/SHOP-123-warenkorb-rabatt'), true)
      - name: Leerer String ist ungültig
        code: |
          assertEqual(isValidBranchName(''), false)
      - name: Unbekannter Typ
        code: |
          assertEqual(isValidBranchName('feature/SHOP-1-suche'), false)
      - name: Großbuchstaben und Unterstrich im Slug
        code: |
          assertEqual(isValidBranchName('fix/SHOP-88-Login_Fehler'), false)
      - name: Ticket-ID fehlt oder Bindestriche doppelt
        code: |
          assertEqual(isValidBranchName('fix/login-fehler'), false)
          assertEqual(isValidBranchName('fix/SHOP-88--login'), false)
          assertEqual(isValidBranchName('chore/OPS-7-ci-cache'), true)
    hints:
      - "Ein Muster für den Typ: `(feat|fix|docs|refactor|test|chore)`."
      - "Ticket-ID: `[A-Z]+-\\d+`. Slug: `[a-z0-9]+(-[a-z0-9]+)*`."
    solution: |
      function isValidBranchName(name) {
        return /^(feat|fix|docs|refactor|test|chore)\/[A-Z]+-\d+-[a-z0-9]+(-[a-z0-9]+)*$/.test(name)
      }
  - id: commit-messages-reparieren
    type: terminal
    title: Eine schlechte Commit-Message reparieren
    description: |
      Im Ordner `m1-commits` liegt ein Repository. Der letzte Commit für Ticket SHOP-7 heißt nur
      „fixed stuff“ und ist noch **nicht** gepusht.

      1. Ändere die Message des letzten Commits mit `git commit --amend` in eine Conventional-Commit-Message
         mit Ticket-Scope, z. B. `fix(SHOP-7): correct shipping costs for parcels`.
      2. Ergänze in `README.md` eine Zeile zur Versandregel und committe das als
         `docs(SHOP-7): …` mit einer passenden Beschreibung.

      Am Ende soll **jede** Commit-Message der Historie dem Muster `typ(scope): beschreibung` oder
      `typ: beschreibung` folgen. Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: m1-commits
    setup: |
      git init -q -b main
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      printf '# Shop\n' > README.md
      printf 'const shipping = 3\n' > shipping.js
      git add . && git commit -q -m "chore: initial commit"
      printf 'const shipping = 4.99\n' > shipping.js
      git commit -q -am "fixed stuff"
    checks:
      - type: command
        run: git log --format=%s | wc -l
        stdout_matches: "^\\s*3\\s*$"
        message: Es sollten genau drei Commits existieren (Startcommit, reparierter Fix, neuer docs-Commit). Nutze für den Fix `--amend` statt eines neuen Commits.
      - type: command
        run: git log --format=%s | grep -c "fixed stuff"
        expect_exit: 1
        message: Die Message „fixed stuff“ ist noch in der Historie. Ändere sie mit `git commit --amend -m "…"`.
      - type: command
        run: git log -1 --skip=1 --format=%s
        stdout_matches: "^fix\\(SHOP-7\\): \\S"
        message: "Der Versandkosten-Commit soll mit `fix(SHOP-7): ` beginnen."
      - type: command
        run: git log -1 --format=%s
        stdout_matches: "^docs\\(SHOP-7\\): \\S"
        message: "Der neueste Commit soll mit `docs(SHOP-7): ` beginnen."
      - type: command
        run: git show --name-only --format= HEAD
        stdout_equals: README.md
        message: Der docs-Commit soll nur README.md enthalten.
    hints:
      - "`git commit --amend -m \"fix(SHOP-7): correct shipping costs for parcels\"` ersetzt die letzte Message."
      - "Danach: Zeile an README.md anhängen (`echo \"Versand: 4,99 Euro\" >> README.md`), `git add README.md`, `git commit -m \"docs(SHOP-7): …\"`."
    solution: |
      ```bash
      cd m1-commits
      git commit --amend -m "fix(SHOP-7): correct shipping costs for parcels"
      echo "Versand: 4,99 Euro pro Paket" >> README.md
      git add README.md
      git commit -m "docs(SHOP-7): document shipping costs"
      git log --oneline
      ```
---

Ein Blick in die Branch-Liste eines Teams ohne Regeln: `test`, `anna2`, `fix-final`, `fix-final-wirklich`.
Und `git log` zeigt „update“, „wip“, „asdf“. Welcher Branch gehört zu welcher Aufgabe? Wann wurde der Rabatt
geändert? Einheitliche Namen machen Branches und Historie lesbar.

## Branch-Namen: `<typ>/<ticket>-<kurzer-slug>`

Viele Teams nutzen eine [[branch-namenskonvention|Branch-Namenskonvention]] aus drei Teilen:

```text
feat/SHOP-123-warenkorb-rabatt
│    │        └── kurzer Slug: worum geht es?
│    └── Ticket-ID: welche Aufgabe?
└── Typ: welche Art von Änderung?
```

- Der **Typ** ist derselbe wie bei Commits: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.
- Die [[ticket-id|Ticket-ID]] wie `SHOP-123` verknüpft Branch, Commits und Pull Request automatisch mit
  dem [[ticket]] in Jira, Linear oder GitHub.
- Der [[slug|Slug]] besteht nur aus Kleinbuchstaben, Ziffern und Bindestrichen – keine Umlaute, keine
  Leerzeichen.

Git selbst erlaubt mehr (prüfbar mit `git check-ref-format --branch name`). Die strengere Team-Regel sorgt
dafür, dass Namen überall gleich aussehen. Viele Teams prüfen sie per [[git-hook|Git-Hook]] oder CI mit
einem [[regex|regulären Ausdruck]].

```bash title="Falschen Namen korrigieren und aufräumen"
git branch -m Warenkorb_Rabatt feat/SHOP-123-warenkorb-rabatt
git branch -d feat/SHOP-100-alte-aufgabe   # gemergte Branches löschen
git fetch --prune                          # veraltete Remote-Branches entfernen
```

> [!FEHLER]
> **Groß- und Kleinschreibung mischen.** `feat/Login` und `feat/login` sind für Git zwei Branches. Auf
> macOS und Windows führt das zu seltsamen Fehlern, weil das Dateisystem beide gleich behandelt.

## Conventional Commits mit Ticket-Scope

[[conventional-commits|Conventional Commits]] geben jeder ersten Zeile einer
[[commit-message|Commit-Message]] eine feste Form: `<typ>(<scope>): <beschreibung>`.

```text
feat(SHOP-123): add wishlist button
fix(SHOP-124): round shipping costs to cents
docs: explain release process
```

Der [[commit-typ|Commit-Typ]] sagt, **welche Art** Änderung es ist. Der [[commit-scope|Scope]] sagt,
**worauf** sie sich bezieht – oft die Ticket-ID. Die Beschreibung ist kurz, im Imperativ („add“, nicht
„added“) und meist englisch.

Eine [[breaking-change|Breaking Change]] markierst du mit `!` (`feat(API-4)!: drop v1 endpoints`) oder einem
Footer `BREAKING CHANGE: …`. Nach einer Leerzeile darf ein Text mit dem **Warum** folgen – oft der
wertvollste Teil, denn der Code zeigt das Warum nicht.

> [!MERKSATZ]
> Die erste Zeile beantwortet: Was für eine Änderung, zu welchem Ticket, und was tut sie?

## Warum eine einheitliche Historie zählt

| Möglichkeit | Beispiel |
|---|---|
| Suchen | `git log --grep "SHOP-123"` zeigt alle Commits eines Tickets |
| Überblicken | `git log --oneline` liest sich wie eine Änderungsliste |
| Versionieren | aus `fix`, `feat` und `!` ergibt sich die nächste [[semantic-versioning|SemVer]]-Version |
| Dokumentieren | aus Commits entsteht automatisch ein Changelog |

Zwischenstände wie „wip“ räumst du **vor** dem Push auf – mit `git commit --amend` für den letzten Commit
oder einem [[interaktiver-rebase|interaktiven Rebase]]. Nach dem Push wird nicht mehr umgeschrieben. Stell dir beim Schreiben jeder Message vor, jemand liest sie in zwei Jahren – ohne dich fragen zu können. Was müsste dort stehen, damit diese Person versteht, was passiert ist und warum?

## Vom Commit zum Changelog

Ein [[changelog|Changelog]] (`CHANGELOG.md`) beschreibt für Menschen, was sich in jeder Version geändert hat.
Im Format „Keep a Changelog“ sieht das so aus:

```markdown title="CHANGELOG.md"
## [1.5.0] - 2026-10-09

### Features
- **SHOP-123:** add wishlist button

### Bugfixes
- **SHOP-124:** round shipping costs to cents
```

Aus `feat` werden Features, aus `fix` Bugfixes; `chore` oder `test` fehlen, weil sie Nutzer:innen nicht
betreffen. Genau diese Logik baust du in der Modul-Übung.

> [!PRAXIS]
> Viele Teams lehnen falsche Messages automatisch ab – per `commit-msg`-Hook oder in der CI. Ein Commit
> „fixed stuff“ kommt dann gar nicht erst in den gemeinsamen Branch.

## Zusammenfassung

- Branch-Namen folgen `<typ>/<ticket>-<kurzer-slug>`, z. B. `feat/SHOP-123-warenkorb-rabatt`.
- Die Ticket-ID verknüpft Branch, Commits, Pull Request und Ticket.
- Commits folgen `typ(scope): beschreibung`; Breaking Changes bekommen `!` oder `BREAKING CHANGE:`.
- Eine einheitliche Historie ermöglicht Suche, automatische Versionen und Changelogs.
- Unsaubere Commits räumst du vor dem Push auf, z. B. mit `git commit --amend`.
