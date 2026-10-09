---
title: Commits und Commit-Messages
summary: Gezielt vormerken mit Pfaden und git add -p, die Falle von git commit -a, den letzten Commit mit --amend reparieren und Nachrichten nach Conventional Commits mit Ticket-Scope schreiben.
duration: 25
sources:
  - title: git-add Dokumentation
    url: https://git-scm.com/docs/git-add
  - title: git-commit Dokumentation
    url: https://git-scm.com/docs/git-commit
  - title: Conventional Commits 1.0.0 (deutsch)
    url: https://www.conventionalcommits.org/de/v1.0.0/
  - title: Pro Git (deutsch) – Richtlinien für Commit-Nachrichten
    url: https://git-scm.com/book/de/v2/Verteiltes-Git-An-einem-Projekt-mitwirken
quiz:
  - type: single
    question: "Du hast `app.js` geändert und die neue Datei `helper.js` angelegt. Du tippst `git commit -a -m \"feat: add helper\"`. Was landet im Commit?"
    options:
      - Beide Dateien
      - Nur die Änderung an `app.js` – `helper.js` ist untracked und wird von `-a` ignoriert.
      - Nur `helper.js`
      - Nichts, `-a` funktioniert nur zusammen mit `git add`.
    answer: 1
    explanation: >
      `-a` merkt automatisch alle Änderungen an Dateien vor, die Git **bereits kennt**. Neue, untracked
      Dateien musst du immer selbst mit `git add` vormerken.
  - type: multiple
    question: Welche Aussagen über `git commit --amend` stimmen?
    options:
      - Der korrigierte Commit bekommt eine neue Kennung (einen neuen Hash).
      - Du kannst damit die Nachricht des letzten Commits ändern.
      - Du kannst damit eine vergessene Datei in den letzten Commit aufnehmen.
      - Du solltest damit bedenkenlos Commits ändern, die Kolleg:innen schon geholt haben.
    answers: [0, 1, 2]
    explanation: >
      `--amend` ersetzt den letzten Commit durch einen neuen. Weil sich dabei die Kennung ändert, nutzt du
      es nur für Commits, die du noch nicht geteilt (gepusht) hast.
  - type: cloze
    text: "Mit `git add ___` merkst du interaktiv nur einzelne Abschnitte einer Datei vor. Einen solchen Abschnitt nennt man ___."
    blanks:
      - [-p, --patch]
      - [Hunk]
    explanation: "`-p` steht für *patch*. Git zeigt dir jeden Hunk einzeln und fragt, ob er in den Commit soll."
  - type: match
    question: Ordne jeder Änderung den passenden Typ nach Conventional Commits zu.
    pairs:
      - { left: "Neues Gutscheinfeld im Checkout", right: "feat" }
      - { left: "Rundungsfehler bei Preisen behoben", right: "fix" }
      - { left: "README um Installationsschritte ergänzt", right: "docs" }
      - { left: "Funktion umstrukturiert, Verhalten unverändert", right: "refactor" }
    explanation: "`feat` und `fix` definiert der Standard selbst, `docs` und `refactor` stammen aus der weit verbreiteten Angular-Konvention."
  - type: find-bug
    question: Diese Nachricht wurde im Editor geschrieben. Welche Zeile verstößt gegen den Aufbau Betreff – Leerzeile – Body?
    language: text
    code: |
      feat(SHOP-123): add voucher field to checkout
      Customers asked for a way to redeem vouchers.
      The field validates the code before payment.

      Refs: SHOP-123
    bug_line: 2
    explanation: >
      Zwischen Betreff und Body gehört eine Leerzeile. Fehlt sie, behandeln viele Werkzeuge die zweite Zeile
      als Teil des Betreffs.
tasks:
  - id: commit-message-pruefen
    type: code
    language: js
    title: Schreibe einen Commit-Message-Prüfer
    description: |
      Schreibe die Funktion `validateCommitMessage(message)`. Sie gibt `true` zurück, wenn die **erste Zeile**
      der Nachricht Conventional Commits folgt, sonst `false`.

      Regeln für die erste Zeile:

      - Aufbau `typ(scope)!: beschreibung` – Scope und `!` sind optional.
      - Erlaubte Typen: die Werte aus `ALLOWED_TYPES`.
      - Der Scope steht in runden Klammern und enthält keine Leerzeichen, z. B. `(cart)` oder `(SHOP-123)`.
      - Nach dem Doppelpunkt folgt genau ein Leerzeichen und eine nicht leere Beschreibung.
      - Die erste Zeile ist höchstens 72 Zeichen lang.

      Alle weiteren Zeilen (Body, Footer) ignorierst du.
    starter: |
      const ALLOWED_TYPES = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'];

      function validateCommitMessage(message) {
        // 1. Erste Zeile ermitteln
        // 2. Länge prüfen
        // 3. Aufbau mit einem regulären Ausdruck prüfen
        return false;
      }
    tests:
      - name: Ticket als Scope ist gültig
        code: |
          assertEqual(validateCommitMessage('feat(SHOP-123): add voucher field'), true)
      - name: Nachricht ohne Typ ist ungültig
        code: |
          assertEqual(validateCommitMessage('Added stuff'), false)
      - name: Leere Nachricht ist ungültig
        code: |
          assertEqual(validateCommitMessage(''), false)
      - name: Breaking Change mit ! ist gültig
        code: |
          assertEqual(validateCommitMessage('feat!: drop node 18 support'), true)
      - name: Scope und ! zusammen sind gültig
        code: |
          assertEqual(validateCommitMessage('fix(api)!: rename total field'), true)
      - name: Unbekannter Typ ist ungültig
        code: |
          assertEqual(validateCommitMessage('feature: add login'), false)
      - name: Betreff mit mehr als 72 Zeichen ist ungültig
        code: |
          assertEqual(validateCommitMessage('fix: ' + 'a'.repeat(68)), false)
      - name: Betreff mit genau 72 Zeichen ist gültig
        code: |
          assertEqual(validateCommitMessage('fix: ' + 'a'.repeat(67)), true)
      - name: Nur die erste Zeile zählt
        code: |
          assertEqual(validateCommitMessage('fix(cart): round totals\n\n' + 'Long body line. '.repeat(20) + '\n\nRefs: SHOP-123'), true)
          assertEqual(validateCommitMessage('wip\n\nfeat: add voucher field'), false)
      - name: Leerzeichen und Beschreibung nach dem Doppelpunkt sind Pflicht
        code: |
          assertEqual(validateCommitMessage('fix:missing space'), false)
          assertEqual(validateCommitMessage('docs(readme): '), false)
    hints:
      - "Die erste Zeile bekommst du mit `message.split('\\n')[0]`."
      - "Ein passender regulärer Ausdruck beginnt mit `/^([a-z]+)(\\([^()\\s]+\\))?(!)?: ` – danach muss ein Zeichen folgen, das kein Leerzeichen ist."
      - "Prüfe den gefundenen Typ zusätzlich mit `ALLOWED_TYPES.includes(typ)`."
    solution: |
      ```js
      const ALLOWED_TYPES = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'];

      function validateCommitMessage(message) {
        if (typeof message !== 'string') return false;
        const subject = message.split(/\r?\n/)[0];
        if (subject.length === 0 || subject.length > 72) return false;
        const match = subject.match(/^([a-z]+)(\([^()\s]+\))?(!)?: (\S.*)$/);
        if (!match) return false;
        return ALLOWED_TYPES.includes(match[1]);
      }
      ```
  - id: amend-korrigieren
    type: terminal
    title: Den letzten Commit reparieren
    description: |
      Im Ordner `amend-uebung` liegt ein Repository mit zwei Commits. Beim letzten Commit ist einiges schiefgegangen:

      - Die Nachricht lautet `feat: add contakt form` – ein Tippfehler.
      - Die Datei `contact.css` gehört eigentlich dazu, wurde aber vergessen und ist noch untracked.

      Repariere den letzten Commit, **ohne** einen zusätzlichen Commit zu erzeugen:

      1. Merke `contact.css` vor.
      2. Korrigiere mit `git commit --amend` den letzten Commit, sodass die Nachricht `contact` richtig schreibt.
      3. Prüfe mit `git log --oneline` und `git show --stat`, dass es weiterhin genau zwei Commits gibt und
         `contact.css` im letzten Commit steckt.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit das Repository angelegt wird.
    workdir: amend-uebung
    setup: |
      git init -q
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      printf '# Shop\n' > README.md
      git add README.md
      git commit -q -m "chore: initial commit"
      printf '<form id="contact">\n  <input type="email" name="email">\n</form>\n' > contact.html
      git add contact.html
      git commit -q -m "feat: add contakt form"
      printf '#contact {\n  max-width: 40rem;\n}\n' > contact.css
    checks:
      - type: command
        run: git log --oneline | wc -l
        stdout_matches: "^\\s*2\\s*$"
        message: Es sollen genau zwei Commits bleiben. Korrigiere den letzten Commit mit --amend statt einen neuen anzulegen.
      - type: command
        run: git log -1 --format=%s
        stdout_matches: "contact"
        message: Die Nachricht des letzten Commits enthält noch nicht das richtig geschriebene Wort "contact".
      - type: command
        run: git log -1 --format=%s | grep -q contakt && echo tippfehler || echo ok
        stdout_equals: ok
        message: In der Nachricht steht noch der Tippfehler "contakt".
      - type: command
        run: git show --name-only --format= HEAD | sort | tr '\n' ' '
        stdout_matches: "^contact\\.css contact\\.html$"
        message: Der letzte Commit soll genau contact.html und contact.css enthalten. Merke contact.css vor und amende den Commit.
      - type: command
        run: git status --porcelain | wc -l
        stdout_matches: "^\\s*0\\s*$"
        message: Es gibt noch offene Änderungen. Am Ende soll git status "working tree clean" melden.
    hints:
      - "`--amend` nimmt alles mit, was gerade im Staging-Bereich liegt. Merke deshalb zuerst die vergessene Datei vor."
      - "Mit `-m` kannst du beim Amend direkt die neue Nachricht angeben."
      - "`git add contact.css` und danach `git commit --amend -m \"feat: add contact form\"`."
    solution: |
      ```bash
      cd amend-uebung
      git status
      git add contact.css
      git commit --amend -m "feat: add contact form"
      git log --oneline
      git show --stat
      ```
---

Ein Commit ist schnell gemacht – ein **guter** Commit braucht etwas Sorgfalt. Er enthält genau ein Thema
und erklärt, warum es ihn gibt. In dieser Lektion lernst du, gezielt bis auf einzelne Zeilen
vorzumerken, den letzten Commit zu reparieren und Nachrichten zu schreiben, die dein Team in sechs
Monaten noch versteht.

## git add: genau auswählen

`git add` kopiert den aktuellen Stand von Dateien in den [[staging-bereich|Staging-Bereich]]:

| Befehl | Was wird vorgemerkt? |
|---|---|
| `git add index.html` | genau diese Datei (neu, geändert oder gelöscht) |
| `git add src/` | alle Änderungen in diesem Ordner und darunter |
| `git add .` | alle Änderungen ab dem aktuellen [[pfad|Pfad]] abwärts |
| `git add -A` | alle Änderungen im ganzen Repository |

Oft stecken in einer Datei ein Bugfix **und** Debug-Ausgaben. Mit `git add -p` (*patch*) zeigt Git jede
zusammenhängende Änderung einzeln – so ein Abschnitt heißt [[hunk|Hunk]]:

```text title="git add -p"
@@ -10,6 +10,7 @@ function checkout(cart) {
   const total = sum(cart);
+  console.log("DEBUG total", total);
   return pay(total);
 }
(1/2) Stage this hunk [y,n,q,a,d,s,e,?]?
```

Du antwortest mit `y` (vormerken), `n` (überspringen), `s` (in kleinere Teile zerlegen) oder `q`
(aufhören). `?` zeigt alle Antworten. Danach steht die Datei in `git status` zweimal: vorgemerkt (der
Bugfix) und nicht vorgemerkt (die Debug-Zeile).

> [!MERKSATZ]
> Je genauer du `git add` sagst, was es vormerken soll, desto sauberer wird dein Commit. Der Punkt nimmt
> alles mit – auch Dinge, die nicht hineingehören.

## git commit und die Falle -a

- `git commit -m "…"` übernimmt die Nachricht direkt.
- `git commit` ohne `-m` öffnet deinen [[editor|Editor]]. Zeilen mit `#` sind Kommentare, eine leere
  Nachricht bricht den Commit ab.
- `git commit -a -m "…"` merkt vorher alle Änderungen an **bekannten** Dateien vor und spart `git add`.

Der Editor lohnt sich, sobald eine Nachricht mehr als eine Zeile braucht. Schnell geht es auch mit
mehreren `-m`: `git commit -m "Betreff" -m "Body"` – jedes `-m` wird ein eigener Absatz.

> [!FEHLER]
> `git commit -a` ignoriert **neue** Dateien. Eine frische `helper.js` bleibt
> [[untracked-datei|untracked]] und fehlt im Commit, obwohl dein Code sie benutzt – die anderen bekommen
> einen kaputten Stand. Ein Blick auf `git status` vor dem Commit zeigt sie unter „Untracked files“.

## Den letzten Commit reparieren: --amend

Tippfehler in der Nachricht oder eine Datei vergessen? Statt „fix typo“ hinterherzuschieben, korrigierst
du den letzten Commit per [[amend|Amend]]:

```bash title="Datei nachreichen und Nachricht korrigieren"
git add contact.css
git commit --amend -m "feat: add contact form"
```

```bash title="Datei nachreichen, Nachricht behalten"
git add contact.css
git commit --amend --no-edit
```

`--amend` baut aus dem letzten Commit und dem aktuellen Staging-Bereich einen **neuen** Commit und setzt
ihn an die Stelle des alten. Deshalb ändert sich auch der [[commit-hash|Commit-Hash]]. Die Zahl der
Commits bleibt gleich – `git log --oneline` zeigt dir das sofort.

> [!ACHTUNG]
> Amende nur Commits, die du noch **nicht** gepusht hast. Wer den alten Commit schon geholt hat, arbeitet
> sonst mit einer anderen Geschichte weiter als du.

## Gute Nachrichten nach Conventional Commits

Der Code zeigt, **was** sich geändert hat. Die [[commit-message|Commit-Message]] erklärt, **warum**. Das
hilft im Code-Review, bei der Fehlersuche mit `git log --grep` und dir selbst in sechs Monaten. Viele
Teams folgen dabei dem Standard [[conventional-commits|Conventional Commits 1.0.0]]:

```text title="Aufbau einer Commit-Message"
fix(SHOP-123): round totals to two decimals

Prices like 19.999 were shown because the total was summed
before rounding. Round every line item first.

Refs: SHOP-123
```

| Teil | Regel |
|---|---|
| Betreff | `typ(scope): beschreibung`, ≈ 50 Zeichen, **Imperativ** (`add`, nicht `added`), kein Punkt |
| Leerzeile | trennt Betreff und Body – Pflicht |
| Body | optional, erklärt das Warum, Umbruch nach ~72 Zeichen |
| Footer | optional, `Schlüssel: Wert`, z. B. `Refs: SHOP-123` |

Wichtige Typen: `feat` (neue Funktion), `fix` (Fehlerbehebung), `docs` (nur Dokumentation),
`refactor` (Umbau ohne neues Verhalten), `test` und `chore` (Wartung). Der Standard selbst definiert nur
`feat` und `fix`, die übrigen stammen aus der Angular-Konvention. Der Imperativ vervollständigt den Satz
„Wenn du diesen Commit anwendest, wird er …“. Der **Scope** in Klammern nennt den Bereich (`cart`) oder die [[ticket|Ticket]]-Nummer
(`SHOP-123`). Body und Footer schreibst du im Editor oder mit einem zweiten `-m`.

> [!PRAXIS]
> In vielen Teams prüft ein [[linter|Linter]] wie commitlint jede Nachricht. Aus den Typen entstehen
> außerdem automatisch Release-Notes. Passt eine Nachricht nicht zum Schema, bleibt die Pipeline rot.
> In der Übung baust du so einen Prüfer als [[funktion|Funktion]] mit einem [[regex|regulären Ausdruck]].

## Breaking Changes und typische Fehler

Ein [[breaking-change|Breaking Change]] zwingt andere, ihren Code anzupassen – etwa ein umbenanntes Feld
in einer Schnittstelle. Du markierst ihn mit `!`
vor dem Doppelpunkt, mit dem Footer `BREAKING CHANGE:` – oder mit beidem:

```text title="Breaking Change"
feat(api)!: rename total to totalAmount

BREAKING CHANGE: clients must read totalAmount instead of total.
```

`BREAKING CHANGE` schreibst du immer groß. Einen Typ `breaking:` gibt es nicht.

| Schlecht | Gut |
|---|---|
| `changes` | `fix(cart): round totals to two decimals` |
| `Fixed bug.` | `fix(login): show error for empty password` |
| `WIP` | `feat(SHOP-123): add voucher field` |
| `update stuff and fix tests` | zwei getrennte Commits |

> [!FEHLER]
> **Mehrere Themen in einem Commit.** Steht im Betreff ein „and“, gehören die Änderungen meist in zwei
> Commits. Mit `git add -p` trennst du sie, bevor du committest.

## Zusammenfassung

- `git add <datei>` merkt gezielt vor, `git add -p` sogar einzelne Hunks.
- `git commit -a` spart `git add`, ignoriert aber neue, untracked Dateien.
- `git commit --amend` ersetzt den letzten Commit mit neuem Hash – nur für ungeteilte Commits.
- Conventional Commits: `typ(scope): beschreibung` im Imperativ, Leerzeile, Body mit dem Warum.
- Der Scope kann ein Bereich oder eine Ticket-Nummer sein: `feat(SHOP-123): …`.
- Breaking Changes markierst du mit `!` und/oder dem Footer `BREAKING CHANGE:`.
