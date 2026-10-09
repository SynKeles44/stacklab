---
title: Mergen und main schützen
summary: Merge-Commit, Squash oder Rebase – was die Knöpfe mit deiner Historie machen, wie du Konflikte löst und wie Branch-Schutz, Pflicht-Checks und CODEOWNERS main absichern.
duration: 25
sources:
  - title: GitHub Docs – Informationen zu Pull-Request-Merges
    url: https://docs.github.com/de/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/about-pull-request-merges
  - title: GitHub Docs – Informationen zu geschützten Branches
    url: https://docs.github.com/de/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
  - title: GitHub Docs – Informationen zu Rulesets
    url: https://docs.github.com/de/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets
  - title: GitHub Docs – Informationen zu Codebesitzern
    url: https://docs.github.com/de/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners
quiz:
  - type: single
    question: "Ein PR enthält die Commits „wip“, „fix typo“, „wip 2“ und „feat: add search“. Das Team will auf main einen sauberen Commit pro Feature. Welche Strategie passt?"
    options:
      - Create a merge commit
      - Squash and merge
      - Rebase and merge
    answer: 1
    explanation: Squash fasst alle Commits des PRs zu einem einzigen neuen Commit zusammen. Die Zwischenschritte verschwinden aus der Historie von main.
  - type: match
    question: Was landet nach dem Merge auf main?
    pairs:
      - { left: "Create a merge commit", right: "Alle PR-Commits plus ein zusätzlicher Merge-Commit" }
      - { left: "Squash and merge", right: "Genau ein neuer Commit mit allen Änderungen" }
      - { left: "Rebase and merge", right: "Alle PR-Commits einzeln, neu auf main aufgesetzt, kein Merge-Commit" }
    explanation: Alle drei bringen denselben Code nach main – sie unterscheiden sich nur in der Form der Historie.
  - type: cloze
    text: Lokal simulierst du Squash and merge mit `git merge ___ feature`, gefolgt von `git ___`.
    blanks:
      - [--squash]
      - [commit]
    explanation: git merge --squash übernimmt alle Änderungen in den Staging-Bereich, erstellt aber noch keinen Commit.
  - type: multiple
    question: Welche Regeln kannst du für einen geschützten Branch festlegen?
    options:
      - Änderungen nur über Pull Requests
      - Mindestens eine Freigabe (Approval) vor dem Merge
      - Status-Checks wie Tests müssen grün sein
      - Commits müssen mindestens 100 Zeilen haben
      - Force-Pushes verbieten
    answers: [0, 1, 2, 4]
    explanation: Branch-Schutz regelt den Weg der Änderungen – PR-Pflicht, Reviews, Checks, kein Force-Push. Die Größe von Commits gehört nicht dazu.
  - type: find-bug
    question: "Das Team möchte: Alle Dateien gehören @beispiel-org/web, aber SQL-Dateien prüft @beispiel-org/db. Warum fragt GitHub bei SQL-Dateien trotzdem nur das Web-Team an?"
    language: text
    code: |
      # .github/CODEOWNERS
      *.sql   @beispiel-org/db
      /docs/  @ada
      *       @beispiel-org/web
    bug_line: 4
    explanation: Die letzte passende Zeile gewinnt. Die allgemeine Regel * muss deshalb ganz oben stehen, die speziellen Regeln darunter.
tasks:
  - id: strategie-eigenschaften
    type: dragdrop
    title: Welche Strategie hat welche Eigenschaft?
    description: Ordne jede Eigenschaft der Merge-Strategie zu, auf die sie zutrifft.
    targets:
      - { id: merge, label: Create a merge commit }
      - { id: squash, label: Squash and merge }
      - { id: rebase, label: Rebase and merge }
    items:
      - { label: Die Verzweigung bleibt in der Historie sichtbar, target: merge }
      - { label: Erzeugt einen Commit mit zwei Eltern, target: merge }
      - { label: Ein PR wird zu genau einem Commit auf main, target: squash }
      - { label: Zwischen-Commits wie „wip“ verschwinden, target: squash }
      - { label: "Lineare Historie, jeder PR-Commit bleibt einzeln", target: rebase }
      - { label: PR-Commits bekommen neue Hashes und es gibt keinen Merge-Commit, target: rebase }
    hints:
      - Schau dir das Diagramm in der Lektion an – wie sieht main jeweils danach aus?
  - id: codeowners-anlegen
    type: terminal
    title: Lege eine CODEOWNERS-Datei an
    description: |
      Im Ordner `codeowners` liegt ein Repository mit den Ordnern `frontend/`, `backend/` und `docs/`.
      Lege die Datei `.github/CODEOWNERS` mit diesen Regeln an – in sinnvoller Reihenfolge:

      1. Standard für **alle** Dateien: `@beispiel-org/team-web`
      2. Alles in `/backend/`: `@beispiel-org/team-api`
      3. Alles in `/docs/`: `@ada`
      4. Alle `*.sql`-Dateien (egal wo): `@beispiel-org/team-db`

      Committe die Datei. Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: codeowners
    setup: |
      git init -q -b main
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      mkdir -p frontend backend/migrations docs
      echo "export const App = () => null" > frontend/app.js
      echo "<?php" > backend/index.php
      echo "CREATE TABLE users (id int);" > backend/migrations/001.sql
      echo "# Doku" > docs/README.md
      git add .
      git commit -q -m "chore: initial structure"
    checks:
      - type: file_contains
        path: .github/CODEOWNERS
        pattern: "^\\*\\s+@beispiel-org/team-web\\s*$"
        message: Es fehlt die Standardregel "* @beispiel-org/team-web".
      - type: file_contains
        path: .github/CODEOWNERS
        pattern: "^/?backend/\\S*\\s+@beispiel-org/team-api"
        message: Es fehlt die Regel für /backend/ mit @beispiel-org/team-api.
      - type: file_contains
        path: .github/CODEOWNERS
        pattern: "^/?docs/\\S*\\s+@ada"
        message: Es fehlt die Regel für /docs/ mit @ada.
      - type: file_contains
        path: .github/CODEOWNERS
        pattern: "^\\*\\.sql\\s+@beispiel-org/team-db"
        message: Es fehlt die Regel "*.sql @beispiel-org/team-db".
      - type: command
        run: "a=$(grep -nE '^\\*\\s' .github/CODEOWNERS | head -1 | cut -d: -f1); b=$(grep -nE '^\\*\\.sql' .github/CODEOWNERS | tail -1 | cut -d: -f1); [ -n \"$a\" ] && [ -n \"$b\" ] && [ \"$a\" -lt \"$b\" ]"
        message: Die allgemeine Regel * muss VOR der *.sql-Regel stehen – sonst überschreibt sie alles darüber.
      - type: command
        run: git ls-files .github/CODEOWNERS
        stdout_equals: .github/CODEOWNERS
        message: .github/CODEOWNERS ist noch nicht committet.
    hints:
      - "Die letzte passende Zeile gewinnt – also die allgemeinste Regel nach oben."
      - "Jede Zeile: Muster, Leerzeichen, ein oder mehrere @Besitzer."
    solution: |
      ```bash
      cd codeowners
      mkdir -p .github
      cat > .github/CODEOWNERS <<'EOF'
      *          @beispiel-org/team-web
      /backend/  @beispiel-org/team-api
      /docs/     @ada
      *.sql      @beispiel-org/team-db
      EOF
      git add .github/CODEOWNERS
      git commit -m "chore: add code owners"
      ```
---

Der Pull Request ist approved, alle Checks sind grün. Unten wartet der grüne Knopf – mit einem kleinen
Pfeil daneben. Dahinter stecken drei Arten zu mergen. Und davor stehen Regeln, die dafür sorgen,
dass nichts Ungeprüftes auf `main` landet.

![Merge-Commit, Squash und Rebase im Vergleich](/assets/github/merge-strategien.svg)

## Drei Merge-Strategien

Der Code auf `main` ist danach immer derselbe – nur die **Historie** sieht anders aus:

| Strategie | Was auf main landet | Gut für |
|---|---|---|
| **Create a merge commit** | alle PR-Commits plus ein [[merge-commit|Merge-Commit]] | vollständige Geschichte |
| **[[squash-merge|Squash and merge]]** | genau **ein** neuer Commit mit allen Änderungen | kurze, lesbare Historie |
| **Rebase and merge** | alle PR-Commits einzeln, neu aufgesetzt, ohne Merge-Commit | lineare Historie mit sauberen Commits |

Lokal entspricht Squash dem Befehl `git merge --squash <branch>` plus `git commit`. Welche Strategien
erlaubt sind, legen Admins unter **Settings → General** fest.

> [!FEHLER]
> **Nach einem Squash auf dem alten Branch weiterarbeiten.** Auf `main` liegt nur der neue
> Squash-Commit, nicht deine Original-Commits. Ein zweiter PR vom selben Branch zeigt alte Änderungen
> erneut. Nach dem Squash: Branch löschen, neuen von `main` anlegen.

## Konflikte im Pull Request

Hat jemand dieselben Zeilen auf `main` geändert, meldet GitHub „This branch has conflicts“. Einfache
Fälle löst du im Webeditor über **Resolve conflicts**: [[konfliktmarker|Konfliktmarker]] entfernen,
„Mark as resolved“. Alles Größere löst du lokal:

```bash title="Konflikt lokal lösen"
git switch fix/warenkorb
git fetch origin
git merge origin/main      # Konflikt erscheint lokal
# Dateien bereinigen, testen
git add warenkorb.js
git commit
git push                   # der PR ist wieder mergebar
```

## Branch-Schutz und Pflicht-Checks

Ein [[geschuetzter-branch|geschützter Branch]] hat Regeln, die GitHub technisch erzwingt – unter
**Settings → Rules → Rulesets** oder **Settings → Branches**:

| Regel | Wirkung |
|---|---|
| Require a pull request | kein direkter Push, nur über PRs |
| Required approvals | mindestens N Freigaben |
| Dismiss stale approvals | neue Commits machen Freigaben ungültig |
| Require status checks | bestimmte Checks müssen grün sein |
| Block force pushes | Historie darf nicht überschrieben werden |

Ein [[status-check|Status-Check]] ist ein automatisches Prüfergebnis, meist aus
[[github-actions|GitHub Actions]] (z. B. der Job `test`). Als „required“ markiert, bleibt der Merge-Knopf
grau, bis er grün ist. Achtung: Pflicht-Checks werden über ihren **Namen** gefunden – benennst du den
Job um, wartet der PR für immer.

> [!MERKSATZ]
> Branch-Schutz gilt für **alle**, auch für Admins – sofern keine Ausnahme eingetragen ist.

## CODEOWNERS

Die Datei [[codeowners|CODEOWNERS]] (meist in `.github/`) legt fest, wer für welche Dateien zuständig ist.
Ändert ein PR solche Dateien, werden diese Personen automatisch als Reviewer angefragt; mit „Require
review from Code Owners“ wird ihre Freigabe Pflicht.

```text title=".github/CODEOWNERS"
*          @beispiel-org/team-web
/backend/  @beispiel-org/team-api
*.sql      @beispiel-org/team-db
```

Die Muster funktionieren wie in der `.gitignore`, und die **letzte passende Zeile gewinnt** – die
allgemeine Regel `*` gehört also nach oben.

> [!PRAXIS]
> Ein typisches Setup: `main` geschützt, ein Approval, Pflicht-Checks für Linter und Tests, keine
> Force-Pushes, nur Squash erlaubt. Große Teams ergänzen eine **Merge Queue**, die PRs vor dem Merge
> gemeinsam mit dem aktuellen `main` testet.

## Zusammenfassung

- **Merge-Commit** bewahrt alles, **Squash** macht aus einem PR einen Commit, **Rebase** reiht Commits linear auf.
- Einfache Konflikte löst der Webeditor, alles andere lokal mit `git merge origin/main` und Push.
- **Rulesets/Branch-Schutz** erzwingen PR-Pflicht, Freigaben, Pflicht-Checks und verbieten Force-Pushes.
- **Status-Checks** kommen meist aus GitHub Actions und werden über ihren Namen zur Pflicht.
- **CODEOWNERS** fragt Zuständige automatisch an; die letzte passende Zeile gewinnt.
