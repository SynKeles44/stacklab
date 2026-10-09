---
title: Tags und Hooks
summary: Versionen dauerhaft mit Tags markieren und wiederkehrende Prüfungen mit Git-Hooks automatisieren.
duration: 25
sources:
  - title: Pro Git – Tagging
    url: https://git-scm.com/book/de/v2/Git-Grundlagen-Tagging
  - title: Semantic Versioning 2.0.0
    url: https://semver.org/lang/de/
  - title: githooks Dokumentation
    url: https://git-scm.com/docs/githooks
  - title: Pro Git – Git Hooks
    url: https://git-scm.com/book/de/v2/Git-Anpassen-Git-Hooks
quiz:
  - type: single
    question: Worin unterscheidet sich ein Tag von einem Branch?
    options:
      - Ein Tag wandert mit jedem neuen Commit weiter, ein Branch nicht.
      - Ein Tag bleibt fest auf seinem Commit stehen, ein Branch wandert mit neuen Commits weiter.
      - Tags gibt es nur auf GitHub, nicht im lokalen Repository.
    answer: 1
    explanation: >
      Ein Branch ist ein beweglicher Zeiger, der beim Committen mitwandert. Ein Tag ist ein fester Name für
      genau einen Commit – deshalb eignet er sich zum Markieren von Versionen.
  - type: match
    question: Die aktuelle Version ist 2.3.1. Welche neue Versionsnummer passt nach Semantic Versioning?
    pairs:
      - { left: "Ein Fehler in der Preisberechnung wird behoben", right: "2.3.2" }
      - { left: "Eine neue, optionale Suchfunktion kommt dazu", right: "2.4.0" }
      - { left: "Ein API-Endpunkt wird entfernt", right: "3.0.0" }
      - { left: "Erster Testkandidat für die nächste große Version", right: "3.0.0-rc.1" }
    explanation: >
      PATCH für Fehlerbehebungen, MINOR für neue, abwärtskompatible Funktionen (PATCH springt auf 0), MAJOR
      für inkompatible Änderungen (MINOR und PATCH springen auf 0). Vorabversionen bekommen einen Zusatz wie
      `-rc.1`. Mit Conventional Commits gilt als Faustregel: `fix:` → PATCH, `feat:` → MINOR, `!` oder
      `BREAKING CHANGE` → MAJOR.
  - type: cloze
    text: Einen annotierten Tag legst du mit `git tag ___ v1.0.0 -m "Erste Version"` an. Tags werden nicht automatisch gepusht – mit `git push origin ___` schickst du alle auf einmal.
    blanks:
      - [-a, --annotate]
      - [--tags]
    explanation: >
      `-a` macht den Tag zu einem eigenen Objekt mit Autor, Datum und Nachricht. `git push origin --tags`
      überträgt alle lokalen Tags, `--follow-tags` nur die annotierten, die zu gepushten Commits gehören.
  - type: find-bug
    question: Dieser `post-checkout`-Hook soll nach einem Branch-Wechsel nur dann `composer install` ausführen, wenn sich `composer.lock` geändert hat. Er installiert aber nach **jedem** Wechsel. In welcher Zeile liegt der Fehler?
    language: bash
    code: |
      #!/bin/sh
      # $1 = alter HEAD, $2 = neuer HEAD, $3 = 1 bei Branch-Wechsel
      [ "$3" = "1" ] || exit 0
      git diff --quiet "$1" "$2" -- composer.lock && composer install
    bug_line: 4
    explanation: >
      `git diff --quiet` endet mit 0, wenn es **keine** Unterschiede gibt. Mit `&&` wird also genau dann
      installiert, wenn sich nichts geändert hat. Richtig ist `|| composer install`.
  - type: multiple
    question: Welche Aussagen über Hooks stimmen?
    options:
      - Dateien in `.git/hooks` werden beim Klonen nicht mitkopiert.
      - "`git commit --no-verify` überspringt `pre-commit` und `commit-msg`."
      - Ein `pre-commit`-Hook mit Exit-Code 1 bricht den Commit ab.
      - Hooks ersetzen die Prüfungen in der CI-Pipeline vollständig.
    answers: [0, 1, 2]
    explanation: >
      Hooks vor einer Aktion brechen sie mit einem Exit-Code ungleich 0 ab. Sie sind aber lokal und lassen
      sich überspringen – deshalb ersetzen sie keine Prüfung auf dem Server.
tasks:
  - id: branchname-pruefen
    type: code
    language: php
    title: Branch-Namen prüfen
    description: |
      Ein `pre-push`-Hook soll verhindern, dass Branches mit unpassendem Namen gepusht werden. Schreibe die
      Funktion `isValidBranchName(string $name): bool` nach diesen Regeln:

      - `main` und `develop` sind immer erlaubt.
      - Alle anderen Namen haben die Form `typ/beschreibung`.
      - Erlaubte Typen: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `hotfix`.
      - Die Beschreibung besteht aus Wörtern aus Kleinbuchstaben `a-z` und Ziffern, getrennt durch **einzelne**
        Bindestriche – kein Bindestrich am Anfang oder Ende, keine zwei hintereinander.
      - Optional darf vor der Beschreibung ein Ticket-Schlüssel stehen: Großbuchstaben, Bindestrich, Zahl,
        Bindestrich – zum Beispiel `feat/SHOP-123-voucher-field`. Ein Ticket allein (`feat/SHOP-123`) reicht nicht.
      - Nichts darf vor oder nach dem Namen stehen, auch kein Zeilenumbruch.
    starter: |
      function isValidBranchName(string $name): bool
      {
          // Tipp: preg_match() mit einem regulären Ausdruck
          return false;
      }
    tests:
      - name: Normaler Feature-Branch ist gültig
        code: assert_true(isValidBranchName('feat/voucher-field'));
      - name: main und develop sind gültig
        code: |
          assert_true(isValidBranchName('main'));
          assert_true(isValidBranchName('develop'));
      - name: Ticket-Schlüssel vor der Beschreibung ist gültig
        code: assert_true(isValidBranchName('feat/SHOP-123-voucher-field'));
      - name: Leerer Name ist ungültig
        code: assert_same(false, isValidBranchName(''));
      - name: Großbuchstaben in der Beschreibung sind ungültig
        code: assert_same(false, isValidBranchName('fix/Login-Bug'));
      - name: Ohne Typ und Schrägstrich ist der Name ungültig
        code: assert_same(false, isValidBranchName('voucher-field'));
      - name: Unbekannter Typ ist ungültig
        code: assert_same(false, isValidBranchName('feature/voucher-field'));
      - name: Bindestriche am Rand oder doppelt sind ungültig
        code: |
          assert_same(false, isValidBranchName('fix/-login'));
          assert_same(false, isValidBranchName('fix/login-'));
          assert_same(false, isValidBranchName('fix/login--bug'));
      - name: Ticket ohne Beschreibung und angehängter Zeilenumbruch sind ungültig
        code: |
          assert_same(false, isValidBranchName('feat/SHOP-123'));
          assert_same(false, isValidBranchName("fix/login\n"));
    hints:
      - Behandle `main` und `develop` zuerst mit `in_array(..., true)`.
      - "Der Rest passt in einen regulären Ausdruck: Typ-Auswahl mit `(feat|fix|…)`, dann `\\/`, dann ein optionaler Ticket-Teil `([A-Z][A-Z0-9]*-[0-9]+-)?`."
      - "Wörter mit einzelnen Bindestrichen: `[a-z0-9]+(-[a-z0-9]+)*`. Beende das Muster mit `\\z` statt `$` – `$` erlaubt noch einen Zeilenumbruch am Ende."
    solution: |
      function isValidBranchName(string $name): bool
      {
          if (in_array($name, ['main', 'develop'], true)) {
              return true;
          }

          return preg_match(
              '/^(feat|fix|chore|docs|refactor|test|hotfix)\/([A-Z][A-Z0-9]*-[0-9]+-)?[a-z0-9]+(-[a-z0-9]+)*\z/',
              $name
          ) === 1;
      }
  - id: commit-msg-hook
    type: terminal
    title: Ein geteilter commit-msg-Hook
    description: |
      Im Ordner `hooks-uebung` liegt ein Repository mit einem ersten Commit. Dein Team will sicherstellen,
      dass alle Commit-Messages Conventional Commits folgen – und zwar mit einem Hook, der im Repository
      liegt und mit allen geteilt wird.

      1. Lege die Datei `.githooks/commit-msg` an. Sie soll mit Exit-Code 1 abbrechen, wenn die Nachricht nicht
         dem Muster `typ: beschreibung` (Typen `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, optional
         mit Scope wie `feat(cart):` und `!`) entspricht, sonst mit 0 enden.
      2. Mache das Skript ausführbar.
      3. Stelle Git so ein, dass es Hooks aus `.githooks` verwendet.
      4. Committe den Hook mit einer gültigen Nachricht – dabei läuft er schon zum ersten Mal.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit das Repository angelegt wird.
    workdir: hooks-uebung
    setup: |
      git init -q
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      printf '# Mini-Shop\n' > README.md
      git add README.md
      git commit -q -m "chore: initial commit"
    checks:
      - type: file_exists
        path: .githooks/commit-msg
        message: Die Datei .githooks/commit-msg fehlt noch.
      - type: command
        run: test -x .githooks/commit-msg
        message: Das Hook-Skript ist noch nicht ausführbar (chmod +x).
      - type: command
        run: git config --get core.hooksPath
        stdout_equals: .githooks
        message: core.hooksPath zeigt noch nicht auf .githooks.
      - type: command
        run: |-
          test -x .githooks/commit-msg || exit 1
          f=$(mktemp) && printf 'bad message\n' > "$f" && ./.githooks/commit-msg "$f" >/dev/null 2>&1; rc=$?; rm -f "$f"; test "$rc" -ne 0
        message: "Der Hook lässt die ungültige Nachricht „bad message“ noch durch – er muss mit einem Exit-Code ungleich 0 enden."
      - type: command
        run: |-
          f=$(mktemp) && printf 'feat(cart): add voucher field\n' > "$f" && ./.githooks/commit-msg "$f"; rc=$?; rm -f "$f"; test "$rc" -eq 0
        message: "Der Hook lehnt die gültige Nachricht „feat(cart): add voucher field“ ab."
      - type: command
        run: git ls-files .githooks/commit-msg
        stdout_equals: .githooks/commit-msg
        message: Der Hook ist noch nicht committet – nur so bekommt ihn dein Team.
      - type: command
        run: git log --oneline | wc -l
        stdout_matches: "^\\s*2\\s*$"
        message: Es sollte genau einen neuen Commit geben (insgesamt 2).
    hints:
      - Ein Hook ist ein Shell-Skript mit Shebang-Zeile. Git übergibt ihm als erstes Argument den Pfad zur Datei mit der Commit-Message.
      - "`grep -Eq 'muster' \"$1\"` prüft die Nachricht. Passt sie nicht, gibst du eine Meldung aus und beendest mit `exit 1`."
      - "Danach: `chmod +x .githooks/commit-msg`, `git config core.hooksPath .githooks`, `git add .githooks` und committen."
    solution: |
      ```bash
      cd hooks-uebung
      mkdir -p .githooks
      cat > .githooks/commit-msg <<'EOF'
      #!/bin/sh
      if ! grep -Eq '^(feat|fix|docs|chore|refactor|test)(\([A-Za-z0-9-]+\))?!?: .+' "$1"; then
        echo "Commit-Message folgt nicht Conventional Commits, z. B. 'feat: add search'" >&2
        exit 1
      fi
      EOF
      chmod +x .githooks/commit-msg
      git config core.hooksPath .githooks
      git add .githooks/commit-msg
      git commit -m "chore: add commit-msg hook"
      git commit --allow-empty -m "kaputt"   # Test: wird abgelehnt
      ```
---

Ein Kunde meldet: „In Version 1.4 funktionierte der Export noch!“ Jetzt brauchst du genau den Stand, der
damals ausgeliefert wurde – Hashes wie `3f2a9c1` merkt sich niemand. Dafür gibt es [[tag|Tags]]. Und weil
man im Alltag vieles vergisst, etwa den [[linter|Linter]] vor dem Commit, kann Git mit
[[git-hook|Git-Hooks]] solche Aufgaben selbst erledigen.

## Tags: Lesezeichen für Versionen

Ein Tag ist wie ein Lesezeichen im Buch: Es bleibt an seiner Seite, egal wie viele Seiten dazukommen. Genau
das unterscheidet ihn vom [[branch|Branch]], der mit jedem neuen [[commit|Commit]] weiterwandert.

| Art | Befehl | Was wird gespeichert? | Einsatz |
|---|---|---|---|
| [[lightweight-tag|Lightweight Tag]] | `git tag v1.0.0` | nur ein Name für den Commit | private, schnelle Markierung |
| [[annotierter-tag|Annotierter Tag]] | `git tag -a v1.0.0 -m "…"` | eigenes Objekt mit Autor, Datum, Nachricht | Releases |

> [!MERKSATZ]
> Für Versionen, die du veröffentlichst, nimmst du **immer annotierte Tags**. Sie dokumentieren, wer die
> Version wann und warum freigegeben hat.

Die Namen folgen meist [[semantic-versioning|Semantic Versioning]]: **MAJOR.MINOR.PATCH**. PATCH steigt bei
Fehlerbehebungen, MINOR bei neuen Funktionen, MAJOR bei einem [[breaking-change|Breaking Change]].

## Tags anlegen und teilen

Ohne Hash markiert Git den Commit, auf dem du stehst. Eine vergessene Version setzt du nachträglich mit
dem [[commit-hash|Hash]]:

```bash title="Tags anlegen und ansehen"
git tag -a v1.1.0 -m "Suche und Rundungsfix"
git tag -a v1.0.0 9f8e7d6 -m "Erste stabile Version"
git tag -l "v1.*"
git show v1.0.0
```

Ein häufiger Stolperstein: `git push` überträgt **keine** Tags. Du schickst sie ausdrücklich zum
[[remote|Remote]]:

```bash title="Tags pushen"
git push origin v1.1.0     # einen bestimmten Tag
git push --follow-tags     # Commits plus die passenden annotierten Tags
```

Auf [[github|GitHub]] wird aus einem Tag mit Beschreibung und Downloads ein [[release|Release]].

> [!FEHLER]
> **„Ich habe den Tag nachträglich verschoben und neu gepusht.“** Andere haben den alten Tag womöglich schon
> geholt, und Pipelines haben ihn vielleicht ausgeliefert. Ist eine Version veröffentlicht, korrigierst du
> Fehler mit einer **neuen** Version wie `v1.1.1`.

## Git-Hooks: Automatik an festen Stellen

Ein Hook ist wie ein Bewegungsmelder: Ein Ereignis wie „gleich wird committet“ löst ein [[skript|Skript]]
aus. Hooks liegen standardmäßig in `.git/hooks`. Aktiv ist eine Datei, wenn sie genau wie das Ereignis
heißt (ohne Endung), [[dateirechte|ausführbar]] ist und in Zeile 1 eine [[shebang|Shebang-Zeile]] wie
`#!/bin/sh` trägt.

| Hook | Läuft … | Typischer Einsatz |
|---|---|---|
| `pre-commit` | vor dem Commit | vorgemerkte Dateien formatieren und prüfen |
| `commit-msg` | nach dem Schreiben der Nachricht | [[conventional-commits|Conventional Commits]] prüfen |
| `post-checkout` | nach `git switch` | Abhängigkeiten nachinstallieren |
| `pre-push` | vor der Übertragung | Tests und Linter |

Über den [[exit-code|Exit-Code]] meldet ein Hook sein Ergebnis. Bei `pre-`-Hooks und `commit-msg` heißt 0
„weiter“, alles andere bricht die Aktion ab. `post-`-Hooks können nur noch reagieren.

```bash title=".githooks/post-checkout – composer install nach Branch-Wechsel"
#!/bin/sh
[ "$3" = "1" ] || exit 0                                   # nur bei Branch-Wechsel
git diff --quiet "$1" "$2" -- composer.lock || composer install
```

`git diff --quiet` endet mit 0, wenn sich das [[lockfile|Lockfile]] nicht unterscheidet – dann passiert
nichts. Sonst installiert [[composer|Composer]] die neuen [[abhaengigkeit|Abhängigkeiten]].

## Beispiele: commit-msg und pre-push

Ein `commit-msg`-Hook bekommt als erstes Argument den Pfad zur Datei mit der Nachricht. Ein
[[regex|regulärer Ausdruck]] entscheidet, ob sie passt:

```bash title=".githooks/commit-msg"
#!/bin/sh
if ! grep -Eq '^(feat|fix|docs|chore|refactor|test)(\([A-Za-z0-9-]+\))?!?: .+' "$1"; then
  echo "Bitte Conventional Commits nutzen, z. B. 'feat(cart): add voucher field'" >&2
  exit 1
fi
```

Ein `pre-push`-Hook prüft das Projekt, bevor etwas deinen Rechner verlässt. Dank `set -e` bricht er beim
ersten Fehler ab – und mit ihm der Push:

```bash title=".githooks/pre-push"
#!/bin/sh
set -e
vendor/bin/pint --test
vendor/bin/phpstan analyse
```

> [!PRAXIS]
> In Laravel-Projekten prüft ein `pre-commit`-Hook oft nur die geänderten Dateien mit Pint, ein `pre-push`-Hook
> führt PHPStan und Tests aus. So bekommst du Feedback in Sekunden statt erst im [[pull-request|Pull Request]].

## Hooks im Team teilen

`.git/hooks` wird weder committet noch geklont. Für das Team legst du einen Ordner `.githooks/` ins
Repository und stellst Git per [[git-konfiguration|Konfiguration]] darauf um:

```bash title="Versionierten Hook-Ordner einrichten"
chmod +x .githooks/*
git config core.hooksPath .githooks
git add .githooks
git commit -m "chore: add shared git hooks"
```

`core.hooksPath` ist lokal: Jede Person setzt es nach dem Klonen einmal, oft per Setup-Skript. Werkzeuge wie
Husky oder CaptainHook übernehmen das automatisch.

Mit `git commit --no-verify` und `git push --no-verify` lassen sich Hooks überspringen. Sie sind deshalb
**keine** Sicherheitsgrenze – die verbindliche Prüfung läuft in der [[ci-pipeline|CI-Pipeline]].

## Zusammenfassung

- Ein Tag ist ein fester Name für einen Commit; für Releases nutzt du annotierte Tags (`git tag -a`).
- Tags pushst du ausdrücklich: `git push origin v1.0.0` oder `--follow-tags`. Veröffentlichte Tags verschiebst du nie.
- Semantic Versioning: PATCH für Fixes, MINOR für neue Funktionen, MAJOR für Breaking Changes.
- Hooks sind Skripte, die Git bei Ereignissen startet; Name = Ereignis, ausführbar, Shebang in Zeile 1.
- Ein Exit-Code ungleich 0 bricht `pre-commit`, `commit-msg` oder `pre-push` ab.
- Geteilt werden Hooks über `.githooks/` und `git config core.hooksPath .githooks` – die CI prüft trotzdem.
