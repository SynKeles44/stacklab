---
title: Docs as Code
summary: Doku im Repository, im Pull Request reviewt und automatisch mit markdownlint und Link-Checks geprüft.
duration: 25
sources:
  - title: Write the Docs – Docs as Code
    url: https://www.writethedocs.org/guide/docs-as-code/
  - title: markdownlint-cli2 (npm)
    url: https://www.npmjs.com/package/markdownlint-cli2
  - title: markdownlint – Regeln
    url: https://github.com/DavidAnson/markdownlint/blob/main/doc/Rules.md
  - title: lychee – Link-Checker
    url: https://lychee.cli.rs/
quiz:
  - type: multiple
    question: Was bedeutet „Docs as Code“?
    options:
      - Doku liegt als Textdatei im selben Repository wie der Code.
      - Doku-Änderungen laufen durch Pull Requests und Reviews.
      - Doku wird automatisch geprüft, z. B. mit einem Linter.
      - Doku wird nur im Wiki gepflegt, damit sie den Code nicht stört.
    answers: [0, 1, 2]
    explanation: >
      Docs as Code heißt: Doku wird mit denselben Werkzeugen und Abläufen behandelt wie Code – Versionskontrolle,
      Review und automatische Prüfungen.
  - type: single
    question: Warum veraltet Doku im Repository seltener als in einem separaten Wiki?
    options:
      - Weil Markdown nicht veralten kann.
      - Weil Code und Doku im selben Pull Request geändert und gemeinsam reviewt werden.
      - Weil GitHub alte Dateien automatisch löscht.
    answer: 1
    explanation: >
      Ändert jemand ein Verhalten, sieht das Review sofort, ob die passende Doku mitgeändert wurde. Ein Wiki
      liegt außerhalb dieses Ablaufs und wird leicht vergessen.
  - type: match
    question: Ordne jede markdownlint-Meldung ihrer Ursache zu.
    pairs:
      - { left: "MD022 blanks-around-headings", right: "Vor oder nach einer Überschrift fehlt eine Leerzeile" }
      - { left: "MD040 fenced-code-language", right: "Codeblock ohne Sprachangabe" }
      - { left: "MD034 no-bare-urls", right: "Adresse ohne Link-Klammern im Text" }
      - { left: "MD009 no-trailing-spaces", right: "Leerzeichen am Zeilenende" }
    explanation: Jede Meldung nennt Datei, Zeile und Regel. Der Name der Regel verrät meistens schon die Lösung.
  - type: cloze
    text: Die Einstellungen für markdownlint-cli2 stehen in der Datei `.markdownlint-cli2.___`. Mit `"MD013"___ false` schaltest du die Regel für die Zeilenlänge aus.
    blanks:
      - [jsonc]
      - [":"]
    explanation: Die Datei ist JSON mit erlaubten Kommentaren (JSONC). Jede Regel lässt sich per Name ein- und ausschalten.
tasks:
  - id: markdownlint-einrichten
    type: terminal
    title: markdownlint im Projekt einrichten
    description: |
      Im Ordner `lint-einrichten` liegt ein Projekt mit `README.md` und `docs/faq.md`. Richte eine automatische
      Prüfung ein und mach die Doku sauber.

      1. Installiere den Linter als Entwicklungsabhängigkeit:
         `npm install --save-dev markdownlint-cli2@0.23.3`
      2. Lege `.markdownlint-cli2.jsonc` mit diesem Inhalt an:

         ```json
         {
           "config": { "MD013": false, "MD060": false },
           "ignores": ["node_modules/**"]
         }
         ```

      3. Lege das npm-Skript `lint:docs` an, das `markdownlint-cli2 "**/*.md"` ausführt:
         `npm pkg set 'scripts.lint:docs=markdownlint-cli2 "**/*.md"'`
      4. Führe `npm run lint:docs` aus und behebe alle Meldungen in `README.md` und `docs/faq.md`, bis das Skript
         ohne Fehler endet. Lösche dabei keine Inhalte.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit das Projekt angelegt wird.
    workdir: lint-einrichten
    setup: |
      printf '{\n  "name": "notizen",\n  "private": true\n}\n' > package.json
      mkdir -p docs
      cat > README.md <<'EOF'
      # notizen
      Eine kleine App für Notizen im Terminal.

      ## Schnellstart

      ```
      npm install
      npm start
      ```

      Mehr Fragen und Antworten in der [FAQ](docs/faq.md).
      Quellcode: https://github.com/example/notizen
      EOF
      cat > docs/faq.md <<'EOF'
      # FAQ

      ## Wo liegen meine Notizen?   

      In der Datei `notes.json` im Projektordner.
      ### Kann ich sie exportieren?

      Ja, mit `npm run export`.
      EOF
    checks:
      - type: command
        run: jq -r '.devDependencies["markdownlint-cli2"] // empty' package.json
        stdout_matches: "\\d"
        message: markdownlint-cli2 fehlt in den devDependencies. Installiere es mit `npm install --save-dev markdownlint-cli2@0.23.3`.
      - type: file_contains
        path: .markdownlint-cli2.jsonc
        pattern: "\"MD013\"\\s*:\\s*false"
        message: "Lege `.markdownlint-cli2.jsonc` an und schalte darin die Regel MD013 aus (`\"MD013\": false`)."
      - type: command
        run: jq -r '.scripts["lint:docs"] // empty' package.json
        stdout_matches: "^markdownlint-cli2\\s"
        message: Es fehlt das npm-Skript `lint:docs`, das `markdownlint-cli2 "**/*.md"` ausführt.
      - type: command
        run: npm run --silent lint:docs
        message: "`npm run lint:docs` meldet noch Fehler. Lies die Meldungen und behebe sie in README.md und docs/faq.md."
      - type: command
        run: npx --no-install markdownlint-cli2 README.md docs/faq.md
        message: README.md oder docs/faq.md enthalten noch Fehler – sie dürfen nicht über `ignores` ausgeschlossen werden.
      - type: command
        run: grep -c 'npm start' README.md; grep -c 'notes.json' docs/faq.md
        stdout_matches: "^1\\n1$"
        message: Lösche keine Inhalte – der Schnellstart in README.md und die Antwort in docs/faq.md sollen erhalten bleiben.
    hints:
      - "Die Konfigurationsdatei schreibst du am einfachsten mit `cat > .markdownlint-cli2.jsonc <<'EOF'` … `EOF`."
      - "Typische Korrekturen: Leerzeile nach jeder Überschrift, ```bash statt ``` am Codeblock, `<https://…>` statt nackter Adresse, Leerzeichen am Zeilenende löschen."
      - "Nach `# FAQ` und `## …` darf keine `###`-Überschrift ohne Leerzeile davor folgen – und die Leerzeichen hinter „Notizen?“ müssen weg."
    solution: |
      ~~~bash
      cd lint-einrichten
      npm install --save-dev markdownlint-cli2@0.23.3
      cat > .markdownlint-cli2.jsonc <<'EOF'
      {
        "config": { "MD013": false, "MD060": false },
        "ignores": ["node_modules/**"]
      }
      EOF
      npm pkg set 'scripts.lint:docs=markdownlint-cli2 "**/*.md"'
      cat > README.md <<'EOF'
      # notizen

      Eine kleine App für Notizen im Terminal.

      ## Schnellstart

      ```bash
      npm install
      npm start
      ```

      Mehr Fragen und Antworten in der [FAQ](docs/faq.md).
      Quellcode: <https://github.com/example/notizen>
      EOF
      cat > docs/faq.md <<'EOF'
      # FAQ

      ## Wo liegen meine Notizen?

      In der Datei `notes.json` im Projektordner.

      ### Kann ich sie exportieren?

      Ja, mit `npm run export`.
      EOF
      npm run lint:docs
      ~~~
  - id: doku-review
    type: steps
    title: Doku im Pull Request reviewen
    description: Du reviewst einen Pull Request, der eine neue Kommandozeilen-Option einführt. Entscheide Schritt für Schritt.
    steps:
      - situation: Der Pull Request fügt die Option `--format csv` hinzu. Geändert wurden nur `src/export.js` und ein Test.
        question: Was merkst du im Review an?
        options:
          - Nichts – Code und Test sind da, das reicht.
          - Die neue Option fehlt in der Doku (README oder Referenz) und im CHANGELOG unter Unreleased.
          - Der Pull Request sollte abgelehnt werden.
        answer: 1
        explanation: Eine neue Option, die nirgends beschrieben ist, existiert für Nutzer:innen nicht. Doku gehört in denselben Pull Request.
      - situation: Die Autorin ergänzt die README. Darin steht `report --format=csv`, im Code heißt der Aufruf aber `report --format csv`.
        question: Wie gehst du vor?
        options:
          - Du probierst den Befehl aus der Doku selbst aus und meldest die Abweichung.
          - Du gehst davon aus, dass beides funktioniert.
        answer: 0
        explanation: Beispiele in der Doku sind ein Versprechen. Im Review lohnt es sich, sie wirklich auszuführen.
      - situation: Die CI meldet `MD040/fenced-code-language` in der README.
        question: Was bedeutet das?
        options:
          - Ein Codeblock hat keine Sprachangabe – z. B. ```bash fehlt.
          - Die README ist zu lang.
          - Ein Link ist kaputt.
        answer: 0
        explanation: Der Linter nennt Regel und Zeile. Die Korrektur dauert Sekunden und hält die Doku einheitlich.
      - situation: Alles ist grün, die Doku ist korrekt. Ein Satz lautet aber „Es wird empfohlen, dass die Option eventuell genutzt werden sollte.“
        question: Was ist ein hilfreicher Review-Kommentar?
        options:
          - „Unverständlich.“
          - „Vorschlag – kürzer und aktiv: Nutze `--format csv`, um die Daten in Excel zu öffnen.“
        answer: 1
        explanation: Ein guter Review-Kommentar macht einen konkreten Vorschlag. So lernt die Autorin, und die Doku wird sofort besser.
---
Dein Team hat ein [[wiki|Wiki]]. Vor einem Jahr war es aktuell. Heute stimmen die Installationsschritte nicht mehr, zwei
Seiten widersprechen sich, und niemand weiß, welche richtig ist. Das liegt nicht an faulen Menschen, sondern am
Ablauf: Code und Doku leben getrennt. **Docs as Code** führt beides zusammen.

## Die Idee: Doku wie Code behandeln

[[docs-as-code|Docs as Code]] heißt: Für Doku gelten dieselben Werkzeuge und Abläufe wie für Code.

| Bei Code | Bei Doku |
|---|---|
| Liegt im Git-Repository | Markdown-Dateien im selben Repository |
| Änderungen per Pull Request | Doku-Änderung im **selben** Pull Request wie der Code |
| Code-Review | Review prüft auch die Doku |
| Linter und Tests in der [[continuous-integration|CI]] | markdownlint und Link-Checks in der CI |
| Versionen und Tags | Doku passt immer zur Version des Codes |

![Docs as Code: Ändern, Pull Request, automatische Prüfung, Review, Merge, Veröffentlichung](/assets/dokumentation-schreiben/docs-as-code.svg)

Der größte Vorteil: Wer ein Verhalten ändert, ändert die Doku im selben Schritt. Im Review fällt sofort auf, wenn
sie fehlt.

> [!MERKSATZ]
> Ein Feature ist erst fertig, wenn seine Doku im selben Pull Request steckt.

## markdownlint: der Linter für Markdown

Ein [[linter|Linter]] prüft Dateien automatisch auf Fehler und Stilprobleme. Für Markdown ist
[[markdownlint|markdownlint]] verbreitet. Am bequemsten nutzt du es über das npm-Paket `markdownlint-cli2`:

```bash
npm install --save-dev markdownlint-cli2@0.23.3
npx markdownlint-cli2 "**/*.md"
```

```text
README.md:1 error MD022/blanks-around-headings Headings should be surrounded by blank lines
README.md:6 error MD040/fenced-code-language Fenced code blocks should have a language specified
```

Installiert als [[devdependency|Entwicklungsabhängigkeit]] steht der Linter allen im Team in derselben Version zur Verfügung.

Jede Meldung nennt **Datei**, **Zeile** und **Regel**. Der Rückgabewert ist ungleich 0, sobald es Fehler gibt –
genau das braucht eine CI, um rot zu werden.

> [!FEHLER]
> Regeln abschalten, bis der Linter still ist. Schalte nur Regeln aus, die zu deinem Projekt nicht passen, und
> behebe den Rest. Sonst prüft der Linter am Ende nichts mehr.

## Konfiguration und npm-Skript

Die Einstellungen stehen in `.markdownlint-cli2.jsonc` im Hauptordner:

```json title=".markdownlint-cli2.jsonc"
{
  "config": {
    "MD013": false,
    "MD024": { "siblings_only": true },
    "MD060": false
  },
  "ignores": ["node_modules/**"]
}
```

| Einstellung | Warum |
|---|---|
| `"MD013": false` | Keine feste Zeilenlänge – Absätze dürfen lang sein |
| `"MD024": { "siblings_only": true }` | Gleiche Überschriften wie `### Added` sind in verschiedenen Abschnitten erlaubt (wichtig für Changelogs) |
| `"MD060": false` | Die Kurzform `\|---\|` für Tabellen ist erlaubt |
| `ignores` | Fremde Dateien in `node_modules` nicht prüfen |

Ein [[npm-script|npm-Skript]] macht den Aufruf für alle gleich: `"lint:docs": "markdownlint-cli2 \"**/*.md\""`
in der `package.json`, dann reicht `npm run lint:docs`.

## In der CI prüfen

Lokal vergisst man den Linter. Deshalb läuft er bei jedem Pull Request automatisch, z. B. mit
[[github-actions|GitHub Actions]]:

```yaml title=".github/workflows/docs.yml"
name: Docs
on: pull_request
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
      - run: npm ci
      - run: npm run lint:docs
```

Zusätzlich lohnt ein [[link-checker|Link-Checker]]. Er findet Links auf gelöschte Dateien oder Seiten, die es nicht
mehr gibt. Ein verbreitetes Werkzeug ist [lychee](https://lychee.cli.rs/), das es auch als GitHub Action gibt.

> [!PRAXIS]
> Viele Teams prüfen in jedem Pull Request nur interne Links (schnell und zuverlässig) und externe Links einmal pro
> Woche in einem eigenen Lauf – fremde Websites sind manchmal kurz nicht erreichbar.

## Doku reviewen

Ein Linter prüft die Form, nicht den Inhalt. Den prüfen Menschen im Review:

1. **Fehlt Doku?** Neue Option, neuer Befehl, geändertes Verhalten – steht es in README, Referenz und Changelog?
2. **Stimmt sie?** Beispiele kurz selbst ausführen.
3. **Versteht man sie?** Kurze Sätze, aktive Sprache, einheitliche Begriffe.
4. **Passt sie an die Stelle?** Tutorial, How-to, Referenz oder Erklärung?

Schreib Review-Kommentare als konkreten Vorschlag, nicht als Urteil.

## Zusammenfassung

- **Docs as Code**: Doku liegt im Repository und läuft durch Pull Request, Review und CI.
- Code und Doku werden im **selben** Pull Request geändert.
- **markdownlint-cli2** prüft Markdown; Meldungen nennen Datei, Zeile und Regel.
- Einstellungen in `.markdownlint-cli2.jsonc`, Aufruf über ein npm-Skript wie `lint:docs`.
- In der CI laufen Linter und **Link-Checker** bei jedem Pull Request.
- Menschen prüfen im Review, ob die Doku vollständig, richtig und verständlich ist.
