---
title: Checklisten und Selbst-Review
summary: Wie du mit einer Review-Checkliste gründlich prüfst, deinen eigenen Code vor dem Review durchsiehst und warum kleine Änderungen besser reviewt werden.
duration: 25
sources:
  - title: git-diff Dokumentation
    url: https://git-scm.com/docs/git-diff
  - title: Google Engineering Practices – Small CLs
    url: https://google.github.io/eng-practices/review/developer/small-cls.html
  - title: GitHub Docs – Removing sensitive data from a repository
    url: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
quiz:
  - type: single
    question: Was zeigt `git diff main...HEAD`?
    options:
      - Alle Änderungen deines Branches seit dem Abzweigen von main
      - Alle Unterschiede zwischen deinem Arbeitsverzeichnis und dem Remote
      - Nur die Änderungen, die noch nicht committet sind
    answer: 0
    explanation: Mit drei Punkten vergleicht Git den Stand deines Branches mit dem gemeinsamen Vorfahren – genau das, was Reviewer:innen im Pull Request sehen.
  - type: multiple
    question: Was gehört zu einem Selbst-Review, bevor du ein Review anforderst? (mehrere Antworten)
    options:
      - Debug-Ausgaben wie console.log oder var_dump entfernen
      - Prüfen, dass keine Passwörter oder Tokens im Diff stehen
      - Den Pull Request möglichst groß machen, damit alles auf einmal geprüft wird
      - Tests und Linter lokal laufen lassen
    answers: [0, 1, 3]
    explanation: Ein Selbst-Review spart allen Zeit. Große Pull Requests dagegen werden schlechter geprüft.
  - type: find-bug
    question: Diese Datei soll in einen Pull Request. Welche Zeile solltest du beim Selbst-Review entfernen?
    language: js
    code: |
      export function totalWithDiscount(total, discount) {
        const capped = Math.min(discount, total)
        console.log('DEBUG capped', capped)
        return total - capped
      }
    bug_line: 3
    explanation: Debug-Ausgaben gehören nicht in den gemeinsamen Code. Sie verschmutzen Logs und verraten manchmal sogar Daten.
  - type: cloze
    text: Ein Branch ist noch nicht gepusht und sein letzter Commit enthält aus Versehen eine `.env`-Datei. Mit `git rm --cached .env` und `git commit ___` korrigierst du den Commit, sodass das Geheimnis nie in die gemeinsame Historie gelangt.
    blanks:
      - [--amend]
    explanation: "`--amend` ersetzt den letzten Commit. Das ist nur in Ordnung, solange er noch nicht gepusht wurde."
tasks:
  - id: selbst-review
    type: terminal
    title: Selbst-Review vor dem Pull Request
    description: |
      Im Ordner `m2-selbst-review` liegt ein Repository. Du stehst auf deinem Branch
      `feat/SHOP-50-rabatt` mit **einem** Commit, der noch nicht gepusht ist. Bevor du ein Review
      anforderst, siehst du dir den Diff selbst an.

      1. Schau dir mit `git diff main...HEAD` an, was dein Branch ändert.
      2. Entferne aus `rabatt.js` die Debug-Ausgabe (`console.log`) und den auskommentierten alten Code.
      3. Die Datei `.env` mit einem Zugangsschlüssel darf nicht ins Repository: Nimm sie aus Git heraus
         (`git rm --cached .env`) und trage `.env` in eine `.gitignore` ein.
      4. Korrigiere den bestehenden Commit mit `git commit --amend`, damit der Schlüssel **nie** in der
         Historie des Branches steht. Am Ende hat der Branch weiterhin genau einen eigenen Commit.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: m2-selbst-review
    setup: |
      git init -q -b main
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      printf 'export const shopName = "Pflanzenshop"\n' > shop.js
      git add . && git commit -q -m "chore: initial commit"
      git switch -q -c feat/SHOP-50-rabatt
      cat > rabatt.js <<'JS'
      export function applyDiscount(total, percent) {
        // const result = total - percent
        // return result
        const result = Math.round(total * (100 - percent)) / 100
        console.log('DEBUG result', result)
        return result
      }
      JS
      printf 'PAYMENT_API_KEY=test_key_do_not_commit\n' > .env
      git add rabatt.js .env
      git commit -q -m "feat(SHOP-50): add percentage discount"
    checks:
      - type: command
        run: git branch --show-current
        stdout_equals: feat/SHOP-50-rabatt
        message: Du solltest auf dem Branch feat/SHOP-50-rabatt stehen.
      - type: command
        run: git rev-list --count main..HEAD
        stdout_equals: "1"
        message: Dein Branch soll genau einen eigenen Commit haben. Korrigiere den bestehenden Commit mit `git commit --amend`, statt einen neuen anzulegen.
      - type: command
        run: git log --format=%h main..HEAD -- .env | wc -l
        stdout_matches: "^\\s*0\\s*$"
        message: Die Datei .env steht noch in einem Commit deines Branches. Nimm sie mit `git rm --cached .env` heraus und korrigiere den Commit mit `--amend`.
      - type: command
        run: git show HEAD:rabatt.js | grep -cE "console\.log|^\s*//"
        expect_exit: 1
        message: rabatt.js enthält im Commit noch eine Debug-Ausgabe oder auskommentierten Code.
      - type: command
        run: git show HEAD:rabatt.js | grep -c "Math.round"
        stdout_matches: "^\\s*1\\s*$"
        message: Die eigentliche Rabattberechnung fehlt in rabatt.js – entferne nur Debug-Ausgabe und alten Code.
      - type: command
        run: git show HEAD:.gitignore
        stdout_matches: "^\\.env$"
        message: Im Commit fehlt eine .gitignore mit der Zeile `.env`.
      - type: file_exists
        path: .env
        message: Die Datei .env soll lokal erhalten bleiben – nur nicht in Git. Nutze `git rm --cached`.
    hints:
      - "`git diff main...HEAD` zeigt dir alles, was Reviewer:innen sehen würden."
      - "Lösche die drei Zeilen in rabatt.js, z. B. mit nano, oder mit `sed -i '/console.log/d; /^\\s*\\/\\//d' rabatt.js`."
      - "Danach: `echo .env > .gitignore`, `git rm --cached .env`, `git add rabatt.js .gitignore`, `git commit --amend --no-edit`."
    solution: |
      ```bash
      cd m2-selbst-review
      git diff main...HEAD
      sed -i '/console.log/d; /^\s*\/\//d' rabatt.js
      echo ".env" > .gitignore
      git rm --cached .env
      git add rabatt.js .gitignore
      git commit --amend --no-edit
      git show --stat HEAD
      ```
  - id: selbst-review-reihenfolge
    type: order
    title: Der Weg zum Review
    description: Bringe die Schritte vom fertigen Code bis zur Review-Anfrage in eine sinnvolle Reihenfolge.
    items:
      - Tests und Linter lokal ausführen
      - Den eigenen Diff mit git diff main...HEAD lesen
      - Debug-Ausgaben, alten Code und Geheimnisse entfernen
      - Commits aufräumen und konventionell benennen
      - Branch pushen und Pull Request mit Beschreibung öffnen
      - Reviewer:innen anfordern
---

Du hast den Pull Request gerade geöffnet, da kommt schon der erste Kommentar: „Hier ist noch ein
`console.log` drin.“ Dann: „Ist die `.env` Absicht?“ Peinlich – und unnötig. Fünf Minuten Selbst-Review
hätten beides verhindert, und die Reviewerin hätte sich auf die wichtigen Dinge konzentrieren können.

## Review-Checklisten

Eine [[review-checkliste|Review-Checkliste]] sorgt dafür, dass nichts Wichtiges vergessen wird. Viele Teams
legen sie als Markdown-Datei ins Repository oder in das Pull-Request-Template:

```markdown title="Beispiel: Review-Checkliste"
- [ ] Das Ticket ist verlinkt und die Akzeptanzkriterien sind erfüllt
- [ ] Sonderfälle (leer, null, sehr groß, doppelt) sind behandelt
- [ ] Eingaben werden geprüft, Berechtigungen sind korrekt
- [ ] Keine Passwörter, Tokens oder persönlichen Daten im Code
- [ ] Tests decken Normal- und Fehlerfall ab
- [ ] Namen sind verständlich, Funktionen überschaubar
- [ ] Dokumentation und Changelog sind aktualisiert
```

Eine Checkliste ersetzt nicht das Nachdenken. Sie ist ein Geländer, das dich bei Müdigkeit und Zeitdruck
auf dem richtigen Weg hält – wie die Checkliste im Flugzeugcockpit.

## Das Selbst-Review

Beim [[selbst-review|Selbst-Review]] liest du deinen eigenen [[diff]] so, als hätte ihn jemand anderes
geschrieben. Am besten nicht im Editor, sondern genau so, wie ihn das Team sieht:

```bash title="Den eigenen Branch prüfen"
git diff --stat main...HEAD   # welche Dateien, wie viele Zeilen?
git diff main...HEAD          # jede einzelne Änderung
git log --oneline main..HEAD  # sind die Commit-Messages sauber?
```

Typische Funde beim Selbst-Review:

| Fund | Warum er raus muss |
|---|---|
| `console.log`, `var_dump`, `dd()` | verschmutzt Logs, verrät manchmal Daten |
| auskommentierter alter Code | Git merkt sich die Historie ohnehin |
| `.env`, Schlüssel, Passwörter | Geheimnisse gehören nie in ein Repository |
| unnötige Dateien (Logs, Build-Ordner) | gehören in die [[gitignore|.gitignore]] |
| `TODO` ohne Ticket | wird sonst vergessen |

> [!MERKSATZ]
> Was du selbst finden kannst, sollte die Reviewerin nicht finden müssen.

## Geheimnisse rechtzeitig entfernen

Ein Zugangsschlüssel, der einmal gepusht wurde, gilt als verraten – auch wenn du ihn sofort wieder löschst.
Er steht in der Historie, und jeder Klon hat ihn. Dann hilft nur noch, den Schlüssel beim Anbieter zu
sperren und einen neuen zu erzeugen.

Solange der Commit nur lokal existiert, kannst du ihn noch reparieren:

```bash title="Geheimnis aus dem letzten, ungepushten Commit entfernen"
echo ".env" >> .gitignore
git rm --cached .env          # aus Git entfernen, Datei bleibt lokal
git add .gitignore
git commit --amend --no-edit  # letzten Commit ersetzen
```

> [!FEHLER]
> **Den Schlüssel in einem neuen Commit löschen.** Dann verschwindet er zwar aus dem aktuellen Stand,
> steht aber weiterhin im vorherigen Commit. Nach dem Push ist er öffentlich in der Historie.

## Kleine Änderungen werden besser geprüft

Je größer ein Diff, desto oberflächlicher wird er gelesen. Bei zehn Zeilen findet man jeden Fehler, bei
tausend Zeilen klickt man irgendwann nur noch auf „Approve“. Als grobe Faustregel gilt: Bis etwa 200 bis
400 geänderte Zeilen kann ein Mensch konzentriert prüfen.

Teile große Aufgaben deshalb auf: erst ein Umbau ohne neues Verhalten, dann das eigentliche Feature. Ein kleiner Pull Request ist außerdem schneller gemergt, verursacht weniger Konflikte und lässt sich bei einem Fehler leichter zurücknehmen. Wenn du merkst, dass dein Diff wächst und wächst, halte kurz inne und frag dich: Welcher Teil davon könnte schon heute allein in einen eigenen Pull Request?
Mehr dazu lernst du im Modul über Pull Requests.

> [!PRAXIS]
> Viele Teams erwarten eine erste Rückmeldung auf ein Review-Gesuch innerhalb eines Arbeitstags. Kleine,
> vorab selbst geprüfte Pull Requests machen diese Zusage überhaupt erst möglich.

## Zusammenfassung

- Eine Review-Checkliste macht Reviews gründlicher und gleichmäßiger.
- Beim Selbst-Review liest du deinen Diff mit `git diff main...HEAD` wie ein fremder Reviewer.
- Debug-Ausgaben, auskommentierter Code, Geheimnisse und unnötige Dateien fliegen vorher raus.
- Ungepushte Geheimnisse entfernst du mit `git rm --cached` und `git commit --amend`; gepushte Schlüssel
  musst du sperren lassen.
- Kleine Änderungen werden gründlicher geprüft als große.
