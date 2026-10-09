---
title: Binaries – ausführbare Pakete
summary: Was Binaries sind, wie node_modules/.bin, vendor/bin, npx, bunx und PATH zusammenspielen und warum npm install manchmal einen Compiler startet.
duration: 25
sources:
  - title: npm Docs – package.json (bin)
    url: https://docs.npmjs.com/cli/v11/configuring-npm/package-json#bin
  - title: npm Docs – npx
    url: https://docs.npmjs.com/cli/v11/commands/npx
  - title: Bun Docs – bunx
    url: https://bun.com/docs/pm/bunx
  - title: Composer – Vendor binaries
    url: https://getcomposer.org/doc/articles/vendor-binaries.md
  - title: Node.js – C++ addons (node-gyp)
    url: https://nodejs.org/api/addons.html
  - title: npm Docs – npm install-scripts
    url: https://docs.npmjs.com/cli/v11/commands/npm-install-scripts
quiz:
  - type: single
    question: Du tippst `pint`, und die Shell startet eine globale Pint-Version statt der Projekt-Version. Wie startest du sicher die Version aus dem Projekt?
    options:
      - pint --local
      - vendor/bin/pint
      - composer pint
      - sudo pint
    answer: 1
    explanation: Ein Pfad mit / umgeht die PATH-Suche. vendor/bin/pint startet genau die Version, die im composer.lock steht.
  - type: match
    question: Ordne jedem Begriff die passende Erklärung zu.
    pairs:
      - { left: "node_modules/.bin", right: "Links auf die Befehle aller installierten npm-Pakete" }
      - { left: "vendor/bin", right: "Startskripte der Befehle aller Composer-Pakete" }
      - { left: "npx", right: "Startet einen Paketbefehl – lokal oder notfalls frisch heruntergeladen" }
      - { left: "PATH", right: "Liste von Ordnern, in denen die Shell nach Befehlen sucht" }
    explanation: "Diese vier Bausteine erklären, warum `npx eslint` funktioniert, `eslint` allein aber oft nicht."
  - type: multiple
    question: Warum kann `npm install` auf einem Rechner klappen und auf einem anderen scheitern, obwohl das Lockfile gleich ist?
    options:
      - Das Paket enthält nativen Code, der für Betriebssystem und CPU-Architektur passend vorhanden sein muss.
      - Für die Plattform gibt es kein vorgebautes Binary, und node-gyp findet keinen C++-Compiler oder kein Python.
      - JavaScript-Dateien laufen nur auf Linux.
      - Das Install-Skript, das das Binary baut oder lädt, wurde nicht freigegeben.
    answers: [0, 1, 3]
    explanation: Reines JavaScript läuft überall. Native Module brauchen aber eine passende Binärdatei – vorgebaut oder vor Ort kompiliert.
  - type: cloze
    text: Ein Paket nennt seine Befehle im Feld `___` der package.json. Ein Skript, das direkt ausführbar sein soll, beginnt mit einer ___-Zeile wie `#!/usr/bin/env node`.
    blanks:
      - [bin]
      - [Shebang]
    explanation: npm verlinkt jeden Eintrag aus bin nach node_modules/.bin. Die Shebang-Zeile sagt dem Betriebssystem, mit welchem Programm die Datei gestartet wird.
tasks:
  - id: binaries-starten
    type: terminal
    title: Werkzeuge aus dem Projekt starten
    description: |
      Im Ordner `werkzeuge` liegt ein leeres Projekt mit `package.json` und `composer.json`.

      1. Installiere den PHP-Formatter `laravel/pint` als **Dev-Abhängigkeit** mit Composer.
      2. Starte ihn über `vendor/bin` mit `--version` und schreibe die Ausgabe in `pint-version.txt`.
      3. Installiere den JavaScript-Bundler `esbuild` als **Dev-Abhängigkeit** mit npm.
      4. Sieh nach, welches plattformspezifische Paket npm unter `node_modules/@esbuild/` installiert hat,
         und schreibe seinen Namen (z. B. `linux-x64`) in `plattform.txt`.
      5. Starte esbuild mit `npx esbuild --version` und schreibe die Ausgabe in `esbuild-version.txt`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: werkzeuge
    setup: |
      npm init -y > /dev/null
      composer init -n -q --name=stacklab/werkzeuge
    checks:
      - type: command
        run: jq -r '."require-dev"["laravel/pint"] // empty' composer.json
        stdout_matches: "\\d"
        message: laravel/pint fehlt unter require-dev (composer require --dev laravel/pint).
      - type: command
        run: '[ "$(cat pint-version.txt 2>/dev/null)" = "$(./vendor/bin/pint --version)" ] && echo stimmt'
        stdout_equals: stimmt
        message: pint-version.txt soll genau die Ausgabe von vendor/bin/pint --version enthalten.
      - type: command
        run: jq -r '.devDependencies.esbuild // empty' package.json
        stdout_matches: "\\d"
        message: esbuild fehlt in den devDependencies (npm install -D esbuild).
      - type: command
        run: '[ "$(tr -d "[:space:]" < plattform.txt 2>/dev/null)" = "$(node -p "process.platform + \"-\" + process.arch")" ] && echo stimmt'
        stdout_equals: stimmt
        message: plattform.txt soll den Ordnernamen aus node_modules/@esbuild/ enthalten (z. B. linux-x64).
      - type: command
        run: '[ "$(tr -d "[:space:]" < esbuild-version.txt 2>/dev/null)" = "$(./node_modules/.bin/esbuild --version)" ] && echo stimmt'
        stdout_equals: stimmt
        message: esbuild-version.txt soll die Ausgabe von npx esbuild --version enthalten.
    hints:
      - "`composer require --dev laravel/pint` und `npm install -D esbuild` installieren die Werkzeuge."
      - "`ls node_modules/@esbuild/` zeigt den Plattform-Ordner."
      - "Mit `befehl > datei.txt` landet die Ausgabe in einer Datei, z. B. `vendor/bin/pint --version > pint-version.txt`."
    solution: |
      ```bash
      cd werkzeuge
      composer require --dev laravel/pint
      vendor/bin/pint --version > pint-version.txt
      npm install -D esbuild
      ls node_modules/@esbuild/ > plattform.txt
      npx esbuild --version > esbuild-version.txt
      ```
  - id: befehl-finden
    type: order
    title: Wie findet die Shell einen Befehl?
    description: Du tippst `eslint` ohne Pfad und drückst Enter. Bringe die Schritte in die richtige Reihenfolge.
    items:
      - Die Shell prüft, ob eslint ein eingebauter Befehl oder Alias ist.
      - Sie nimmt den ersten Ordner aus der Variable PATH.
      - Sie schaut, ob es dort eine ausführbare Datei namens eslint gibt.
      - Gibt es keine, geht sie zum nächsten Ordner in PATH.
      - Beim ersten Treffer startet sie diese Datei.
      - Findet sie in keinem Ordner etwas, meldet sie „command not found“.
---
Du installierst `laravel/pint` und tippst `pint` – „command not found“. Deine Kollegin tippt dasselbe und es
funktioniert, startet aber eine ganz andere Version. Und auf dem Build-Server bricht `npm install` plötzlich
mit einer Meldung über Python und einen C++-Compiler ab. Alles drei hat mit **Binaries** zu tun.

## Was ist ein Binary?

Im Paket-Alltag ist ein **Binary** jede [[ausfuehrbare-datei|ausführbare Datei]], die ein Paket als Befehl
mitbringt – egal, ob sie wirklich binär ist.

| Art | Beispiel | Läuft auf |
|---|---|---|
| **Skript** mit [[shebang\|Shebang]] | `pint` (PHP), `cowsay` (JavaScript) | überall, wo PHP bzw. Node installiert ist |
| **Kompiliertes Programm** | `esbuild` (Go), native Node-Module (C++) | nur auf dem Betriebssystem und der CPU, für die es gebaut wurde |

Ein Skript ist [[quellcode|Quellcode]], den ein [[interpreter|Interpreter]] Zeile für Zeile ausführt. Ein
kompiliertes Programm hat ein [[compiler|Compiler]] vorher in [[maschinencode|Maschinencode]] übersetzt – für
genau eine Plattform wie `linux-x64`, `darwin-arm64` oder `win32-x64`.

```bash
head -1 node_modules/cowsay/cli.js           # #!/usr/bin/env node
file node_modules/@esbuild/linux-x64/bin/esbuild   # ELF 64-bit … executable
```

## node_modules/.bin und vendor/bin

Ein npm-Paket nennt seine Befehle im Feld `bin` der package.json. Beim Installieren legt npm dafür in
[[node-modules-bin|node_modules/.bin]] einen Link an. Composer macht dasselbe mit dem Feld `bin` der
composer.json und legt Startskripte in [[vendor-bin|vendor/bin]] ab.

```json title="package.json eines Werkzeugs"
{ "name": "cowsay", "bin": { "cowsay": "./cli.js" } }
```

Diese Ordner stehen normalerweise **nicht** in der [[path-variable|PATH-Variable]]. Darum klappt `pint`
allein nicht – aber diese Wege schon:

| Weg | Beispiel |
|---|---|
| Pfad angeben | `vendor/bin/pint`, `./node_modules/.bin/esbuild` |
| npm-Skript | `"scripts": { "build": "esbuild src/app.js" }` – npm ergänzt `.bin` automatisch im PATH |
| Composer-Skript | `"scripts": { "format": "pint" }` – Composer ergänzt `vendor/bin` |
| [[npx]] / [[bunx]] | `npx esbuild --version`, `bunx esbuild --version` |

> [!TIPP]
> Im Stacklab-Übungsterminal stehen `./node_modules/.bin` und `./vendor/bin` zur Bequemlichkeit schon im
> PATH. Auf deinem eigenen Rechner ist das in der Regel nicht so – gewöhne dir die Wege aus der Tabelle an.

## npx, bunx und die PATH-Suche

`npx esbuild` sucht zuerst im lokalen `node_modules/.bin`. Gibt es den Befehl dort nicht, lädt npx das Paket
(nach Rückfrage) in einen Cache und startet es von dort. `bunx` arbeitet genauso, nur schneller.

![PATH-Suche: Die Shell prüft die Ordner der Reihe nach und nimmt den ersten Treffer](/assets/libraries-pakete-registries/bin-aufloesung.svg)

Tippst du einen Befehl **ohne** Schrägstrich, geht die Shell die Ordner in PATH von links nach rechts durch
und nimmt den **ersten** Treffer. Liegt eine alte globale Version weiter vorn, gewinnt sie.

> [!FEHLER]
> **Werkzeuge global installieren** (`npm install -g`, `composer global require`). Dann nutzt jede Person
> eine andere Version, und der Formatter formatiert bei allen unterschiedlich. Installiere Werkzeuge pro
> Projekt als Dev-Abhängigkeit – dann gilt die Version aus dem Lockfile.

## Plattform-Binaries und native Module

Pakete mit kompiliertem Code müssen für jede Plattform eine passende Datei liefern. Dafür gibt es zwei Wege:

1. **Vorgebaute Binaries:** Das Paket listet für jede Plattform ein Unterpaket als `optionalDependencies`,
   z. B. `@esbuild/linux-x64` und `@esbuild/darwin-arm64`. npm installiert nur das passende.
2. **Vor Ort kompilieren:** [[native-addon|Native Addons]] in C++ werden mit [[node-gyp]] beim Installieren
   gebaut. Dafür braucht der Rechner Python, `make` und einen C++-Compiler – fehlt etwas, bricht
   `npm install` mit langen Fehlermeldungen ab.

Beides läuft oft über ein `install`- oder `postinstall`-Skript. Aktuelle npm-Versionen führen solche
Skripte von Abhängigkeiten erst aus, wenn du sie mit `npm install-scripts approve <paket>` erlaubst.

> [!MERKSATZ]
> Reines JavaScript und PHP laufen überall. **Kompilierter** Code läuft nur auf der Plattform, für die er
> gebaut wurde – darum gibt es Plattform-Pakete und node-gyp.

> [!PRAXIS]
> Installierst du `node_modules` auf dem Mac und kopierst den Ordner in einen Linux-Container, fehlen dort
> die Linux-Binaries. Deshalb kopiert man in Docker nur `package.json` und Lockfile und führt `npm ci` im
> Container aus.

## Zusammenfassung

- Ein **Binary** ist ein Befehl, den ein Paket mitbringt – Skript mit Shebang oder kompiliertes Programm.
- npm verlinkt Befehle aus dem Feld `bin` nach **node_modules/.bin**, Composer nach **vendor/bin**.
- Starte Projekt-Werkzeuge mit Pfad, über Skripte oder mit **npx**/**bunx** – nicht global.
- Die Shell durchsucht **PATH** von links nach rechts und nimmt den ersten Treffer.
- Kompilierter Code ist plattformabhängig: vorgebaute Plattform-Pakete oder Kompilieren mit **node-gyp**.
