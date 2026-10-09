---
title: Skripte, npx und eigene Pakete veröffentlichen
summary: Wie du mit npm-Skripten Abläufe automatisierst, Werkzeuge mit npx startest und ein eigenes Paket versionierst, packst und veröffentlichst.
duration: 25
sources:
  - title: npm Docs – scripts
    url: https://docs.npmjs.com/cli/v11/using-npm/scripts
  - title: npm Docs – npm exec / npx
    url: https://docs.npmjs.com/cli/v11/commands/npx
  - title: npm Docs – npm version
    url: https://docs.npmjs.com/cli/v11/commands/npm-version
  - title: npm Docs – npm pack
    url: https://docs.npmjs.com/cli/v11/commands/npm-pack
  - title: npm Docs – Creating and publishing unscoped public packages
    url: https://docs.npmjs.com/creating-and-publishing-unscoped-public-packages
quiz:
  - type: single
    question: "In package.json steht `\"lint\": \"eslint .\"`, eslint ist nur lokal als devDependency installiert. Warum funktioniert `npm run lint`, obwohl `eslint` direkt im Terminal „command not found“ meldet?"
    options:
      - npm installiert eslint bei jedem Aufruf neu.
      - npm ergänzt beim Ausführen von Skripten node_modules/.bin im PATH.
      - eslint ist ein Kernmodul von Node.js.
      - npm run startet eslint im Browser.
    answer: 1
    explanation: Lokal installierte Werkzeuge legen ihre Befehle in node_modules/.bin ab. npm-Skripte finden sie dort automatisch.
  - type: match
    question: Welcher Befehl tut was?
    pairs:
      - { left: "npm run build", right: "Startet das Skript build" }
      - { left: "npm test", right: "Kurzform für npm run test" }
      - { left: "npx cowsay hallo", right: "Führt ein Paket aus, ohne es dauerhaft zu installieren" }
      - { left: "npm version minor", right: "Erhöht 1.4.2 auf 1.5.0" }
      - { left: "npm pack", right: "Erzeugt die .tgz-Datei, die veröffentlicht würde" }
    explanation: start und test haben Kurzformen, alle anderen Skripte startest du mit npm run. npx führt Paket-Befehle aus, version und pack bereiten eine Veröffentlichung vor.
  - type: cloze
    text: Ein Skript namens `___build` läuft automatisch vor `build`. Argumente gibst du nach zwei Strichen weiter, z. B. `npm test ___ --watch`.
    blanks:
      - [pre]
      - ["--"]
    explanation: pre- und post-Skripte laufen automatisch vor und nach dem gleichnamigen Skript. Nach -- landen Argumente beim Skript statt bei npm.
  - type: find-bug
    question: Nach dem Veröffentlichen fehlt im Paket die Datei `index.js`. Welche Zeile ist schuld?
    language: json
    code: |
      {
        "name": "textwerkzeug",
        "version": "1.1.0",
        "main": "index.js",
        "files": ["src/", "README.md"]
      }
    bug_line: 5
    explanation: Das Feld files ist eine Positivliste. Steht index.js nicht darin (oder liegt nicht in src/), wird es nicht ins Paket gepackt. npm pack --dry-run zeigt vorher, was drin ist.
tasks:
  - id: paket-packen
    type: terminal
    title: Ein eigenes Paket testen, versionieren und packen
    description: |
      Im Ordner `mein-paket` liegt das kleine Paket `textwerkzeug` mit `index.js` und einem Test in
      `test/index.test.js`. Klicke zuerst auf **Aufgabe vorbereiten**.

      1. Ersetze das Skript `test` durch `node --test` und prüfe mit `npm test`, dass die Tests grün sind.
      2. Lege das Feld `files` an, sodass nur `index.js` und `README.md` ins Paket kommen – die Tests nicht.
      3. Erhöhe die Version mit `npm version minor --no-git-tag-version` (ohne Git-Commit).
      4. Prüfe mit `npm pack --dry-run`, welche Dateien im Paket landen würden.
      5. Erzeuge das Paket mit `npm pack`.
    workdir: mein-paket
    setup: |
      cat > package.json <<'EOF'
      {
        "name": "textwerkzeug",
        "version": "1.0.0",
        "description": "Kleine Helfer für Texte",
        "type": "module",
        "main": "index.js",
        "scripts": {
          "test": "echo \"Error: no test specified\" && exit 1"
        },
        "license": "MIT"
      }
      EOF
      cat > index.js <<'EOF'
      export function woerter(text) {
        return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
      }
      EOF
      mkdir -p test
      cat > test/index.test.js <<'EOF'
      import { test } from "node:test";
      import assert from "node:assert/strict";
      import { woerter } from "../index.js";

      test("zählt Wörter", () => {
        assert.equal(woerter("Hallo liebe Welt"), 3);
      });

      test("leerer Text hat null Wörter", () => {
        assert.equal(woerter("   "), 0);
      });
      EOF
      echo "# textwerkzeug" > README.md
    checks:
      - type: command
        run: jq -r '.scripts.test' package.json
        stdout_equals: node --test
        message: Das Skript test soll "node --test" ausführen.
      - type: command
        run: npm test --silent >/dev/null 2>&1; echo $?
        stdout_equals: "0"
        message: npm test schlägt noch fehl.
      - type: command
        run: jq -r '.version' package.json
        stdout_equals: 1.1.0
        message: Die Version soll mit npm version minor auf 1.1.0 erhöht werden.
      - type: file_exists
        path: textwerkzeug-1.1.0.tgz
        message: Die Datei textwerkzeug-1.1.0.tgz fehlt. Führe npm pack aus (nach dem Versionssprung).
      - type: command
        run: tar -tzf textwerkzeug-1.1.0.tgz | sort | tr '\n' ' '
        stdout_matches: "package/README\\.md package/index\\.js package/package\\.json"
        message: Im Paket sollen index.js, README.md und package.json liegen.
      - type: command
        run: tar -tzf textwerkzeug-1.1.0.tgz | grep -c '^package/test/' || true
        stdout_equals: "0"
        message: Die Tests sollen nicht im Paket landen. Prüfe das Feld files.
    hints:
      - "`npm pkg set scripts.test=\"node --test\"` ersetzt das Test-Skript."
      - "Das Feld files ist ein Array: `npm pkg set 'files[]=index.js' 'files[]=README.md'` oder per Editor."
      - Führe npm pack erst nach npm version aus, sonst heißt die Datei noch textwerkzeug-1.0.0.tgz.
    solution: |
      ```bash
      cd mein-paket
      npm pkg set scripts.test="node --test"
      npm test
      npm pkg set 'files[]=index.js' 'files[]=README.md'
      npm version minor --no-git-tag-version
      npm pack --dry-run
      npm pack
      ```
  - id: veroeffentlichen-ablauf
    type: order
    title: Der Weg zur Veröffentlichung
    description: Bringe die Schritte in eine sinnvolle Reihenfolge, um eine neue Version eines Pakets zu veröffentlichen.
    items:
      - Tests mit npm test laufen lassen
      - Version mit npm version patch erhöhen
      - Paketinhalt mit npm pack --dry-run prüfen
      - Bei der Registry anmelden mit npm login
      - Paket hochladen mit npm publish
      - Änderungen und neue Version im Changelog bekanntgeben
    hints:
      - Erst prüfen, ob alles funktioniert, dann die Nummer ändern, dann hochladen.
---

Ein Projekt hat schnell ein Dutzend Befehle: starten, testen, bauen, formatieren. Niemand will sie
auswendig lernen. npm gibt dir dafür **Skripte**. Und wenn du später selbst ein nützliches Werkzeug
geschrieben hast, kannst du es als Paket veröffentlichen – genau wie die Pakete, die du installierst.

## npm-Skripte

Im Feld `scripts` der package.json legst du [[npm-script|npm-Skripte]] an: Namen für
Shell-Befehle.

```json title="package.json"
{
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js",
    "test": "node --test",
    "lint": "eslint .",
    "prebuild": "rm -rf dist",
    "build": "vite build"
  }
}
```

| Aufruf | Wirkung |
|---|---|
| `npm start`, `npm test` | Kurzformen für die Skripte `start` und `test` |
| `npm run dev` | Jedes andere Skript startest du mit `npm run <name>` |
| `npm run` | Listet alle Skripte auf |
| `npm test -- --watch` | Argumente nach `--` gehen an das Skript |
| `node --run dev` | Startet das Skript direkt mit Node.js – schneller, aber ohne pre/post |

Zwei Besonderheiten: Ein Skript `prebuild` läuft automatisch **vor** `build`, `postbuild`
danach. Und während ein Skript läuft, liegt `node_modules/.bin` im Suchpfad. Darum funktioniert
`eslint .` im Skript, obwohl eslint nur lokal installiert ist.

> [!MERKSATZ]
> Die `scripts` sind die Bedienungsanleitung eines Projekts. `npm run` zeigt sie alle – das ist
> oft der erste Befehl in einem fremden Projekt.

## npx – Pakete ausführen

[[npx|`npx`]] (eigentlich `npm exec`) führt den Befehl eines Pakets aus. Ist das Paket lokal
installiert, nimmt npx diese Version. Sonst lädt es das Paket in einen Zwischenspeicher, fragt
kurz nach und führt es aus – ohne es dauerhaft zu installieren.

```bash title="Terminal"
npx eslint .                       # lokales eslint aus node_modules/.bin
npx create-vite@latest meine-app   # Projekt-Generator einmalig ausführen
npx --yes cowsay "Hallo"           # ohne Rückfrage
```

Das ist ideal für Generatoren, die du nur einmal pro Projekt brauchst.

> [!FEHLER]
> **Werkzeuge global installieren.** `npm install -g eslint` macht eslint überall verfügbar – aber
> in einer Version, die zu keinem Projekt passen muss. Installiere Werkzeuge lieber als
> devDependency pro Projekt und starte sie über Skripte oder npx.

## Versionieren und packen

Bevor ein Paket veröffentlicht wird, bekommt es eine neue Version und wird zu einer Datei
gepackt – einem [[tarball|Tarball]] (`.tgz`).

```bash title="Terminal"
npm version patch     # 1.0.0 → 1.0.1  (minor → 1.1.0, major → 2.0.0)
npm pack --dry-run    # zeigt, welche Dateien im Paket landen würden
npm pack              # erzeugt textwerkzeug-1.0.1.tgz
```

`npm version` ändert die package.json und legt in einem Git-Repository zusätzlich einen Commit und
einen Tag an. Mit `--no-git-tag-version` passiert nur die Änderung der Datei. Welche Dateien ins
Paket kommen, steuerst du mit dem Feld `files` (Positivliste). `package.json`, `README` und
`LICENSE` sind immer dabei.

## Veröffentlichen

Mit einem kostenlosen Konto auf npmjs.com kannst du Pakete veröffentlichen:

```bash title="Terminal"
npm login                      # einmalig anmelden
npm publish                    # Paket hochladen
npm publish --access public    # nötig für öffentliche Pakete mit Scope wie @dein-name/tool
```

Danach kann die ganze Welt `npm install textwerkzeug` tippen. Eine veröffentlichte Version lässt
sich **nicht** überschreiben – für jede Änderung brauchst du eine neue Versionsnummer.

> [!PRAXIS]
> Firmen veröffentlichen interne Pakete oft in einer privaten Registry oder als Scoped Packages
> mit eingeschränktem Zugriff. Der Ablauf ist derselbe; nur die Registry-Adresse in der `.npmrc`
> ist eine andere. In diesem Kurs veröffentlichst du nichts wirklich – `npm pack` zeigt dir genau,
> was hochgeladen würde.

## Zusammenfassung

- `scripts` in der package.json sind benannte Befehle: `npm start`, `npm test`, `npm run <name>`.
- `pre`- und `post`-Skripte laufen automatisch; in Skripten liegt `node_modules/.bin` im Pfad.
- `npx` führt Paket-Befehle aus – lokal installierte oder einmalig heruntergeladene.
- `npm version patch|minor|major` erhöht die Version nach SemVer.
- `npm pack` erzeugt den Tarball; das Feld `files` bestimmt seinen Inhalt.
- `npm publish` lädt das Paket in die Registry; veröffentlichte Versionen sind unveränderlich.
