---
title: package.json und Abhängigkeiten
summary: Was npm ist, wie die package.json ein Projekt beschreibt und wie du Pakete als dependencies, devDependencies oder peerDependencies installierst.
duration: 25
sources:
  - title: npm Docs – package.json
    url: https://docs.npmjs.com/cli/v11/configuring-npm/package-json
  - title: npm Docs – npm install
    url: https://docs.npmjs.com/cli/v11/commands/npm-install
  - title: npm Docs – npm pkg
    url: https://docs.npmjs.com/cli/v11/commands/npm-pkg
  - title: npm Docs – Specifying dependencies and devDependencies
    url: https://docs.npmjs.com/specifying-dependencies-and-devdependencies-in-a-package-json-file
quiz:
  - type: match
    question: Wofür steht welches Feld der package.json?
    pairs:
      - { left: "scripts", right: "Kurzbefehle wie start, test oder build" }
      - { left: "engines", right: "Welche Node-Version das Projekt braucht" }
      - { left: "type", right: "Ob .js-Dateien ES-Module oder CommonJS sind" }
      - { left: "private", right: "Verhindert versehentliches Veröffentlichen" }
      - { left: "bin", right: "Kommandozeilen-Befehle, die das Paket mitbringt" }
    explanation: Diese Felder begegnen dir in fast jedem Projekt. engines und private schützen, bin macht aus einem Paket ein Werkzeug.
  - type: single
    question: In welche Liste gehört ein Test-Framework wie Vitest?
    options: ["dependencies", "devDependencies", "peerDependencies", "engines"]
    answer: 1
    explanation: Tests laufen nur während der Entwicklung. In Produktion wird das Test-Framework nicht gebraucht.
  - type: multiple
    question: Welche Aussagen über `node_modules` stimmen?
    options:
      - Der Ordner enthält die installierten Pakete und ihre eigenen Abhängigkeiten.
      - Er gehört in die .gitignore und wird nicht committet.
      - Du kannst ihn jederzeit löschen und mit npm install neu erzeugen.
      - Änderungen an Paketen nimmst du am besten direkt in node_modules vor.
    answers: [0, 1, 2]
    explanation: node_modules ist aus package.json und Lockfile reproduzierbar. Änderungen darin gehen beim nächsten Installieren verloren.
  - type: find-bug
    question: npm meldet beim Installieren `Invalid name`. Welche Zeile ist falsch?
    language: json
    code: |
      {
        "name": "Mein Wetter Tool",
        "version": "1.0.0",
        "type": "module"
      }
    bug_line: 2
    explanation: Paketnamen sind klein geschrieben und ohne Leerzeichen, z. B. "mein-wetter-tool".
  - type: cloze
    text: Eine Abhängigkeit deiner Abhängigkeit heißt ___ Abhängigkeit. Ein Paket fügst du mit `npm install ___ vitest` zu den devDependencies hinzu.
    blanks:
      - [transitive, transitiv]
      - ["-D", "--save-dev"]
    explanation: Transitive Abhängigkeiten installiert npm automatisch mit. -D ist die Kurzform von --save-dev.
tasks:
  - id: pakete-verwalten
    type: terminal
    title: Ein Projekt anlegen und Pakete verwalten
    description: |
      Im Ordner `farbige-ausgabe` liegt ein Projekt, das noch das veraltete Paket `left-pad` nutzt.
      Klicke zuerst auf **Aufgabe vorbereiten** (das installiert `left-pad`).

      1. Setze in der package.json den Namen auf `farbige-ausgabe` und `"type"` auf `"module"`
         (Tipp: `npm pkg set`).
      2. Entferne `left-pad` mit `npm uninstall` – JavaScript kann das längst selbst (`"7".padStart(3, "0")`).
      3. Installiere `picocolors` als normale Abhängigkeit.
      4. Installiere `@types/node` als **devDependency**.
      5. Schreibe `farbe.js`, das `picocolors` importiert und das Wort `Erfolg` grün ausgibt.
      6. Sieh dir mit `npm ls` an, was installiert ist.
    workdir: farbige-ausgabe
    setup: |
      npm init -y >/dev/null
      npm pkg set name=altes-projekt
      npm install left-pad --no-audit --no-fund >/dev/null 2>&1
    checks:
      - type: command
        run: jq -r '"\(.name) \(.type)"' package.json
        stdout_equals: farbige-ausgabe module
        message: Setze name auf farbige-ausgabe und type auf module.
      - type: command
        run: jq -r '.dependencies["left-pad"] // "weg"' package.json
        stdout_equals: weg
        message: left-pad steht noch in den dependencies. Entferne es mit npm uninstall left-pad.
      - type: file_absent
        path: node_modules/left-pad
        message: left-pad liegt noch in node_modules. Nutze npm uninstall statt die package.json von Hand zu ändern.
      - type: command
        run: jq -r '.dependencies.picocolors // "fehlt"' package.json
        stdout_matches: "^\\^?\\d"
        message: picocolors fehlt in den dependencies.
      - type: command
        run: jq -r '.devDependencies["@types/node"] // "fehlt"' package.json
        stdout_matches: "^\\^?\\d"
        message: "@types/node soll in den devDependencies stehen (npm install -D …)."
      - type: command
        run: node farbe.js
        stdout_matches: "Erfolg"
        message: node farbe.js soll das Wort Erfolg ausgeben.
      - type: file_contains
        path: farbe.js
        pattern: "picocolors"
        message: farbe.js soll picocolors importieren.
    hints:
      - "`npm pkg set name=farbige-ausgabe type=module` setzt beide Felder auf einmal."
      - "`npm uninstall left-pad`, dann `npm install picocolors` und `npm install -D @types/node`."
      - "`import pc from \"picocolors\"; console.log(pc.green(\"Erfolg\"));`"
    solution: |
      ```bash
      cd farbige-ausgabe
      npm pkg set name=farbige-ausgabe type=module
      npm uninstall left-pad
      npm install picocolors
      npm install -D @types/node
      cat > farbe.js <<'EOF'
      import pc from "picocolors";
      console.log(pc.green("Erfolg"));
      EOF
      node farbe.js
      npm ls
      ```
  - id: abhaengigkeitsarten
    type: dragdrop
    title: dependencies, devDependencies oder peerDependencies?
    description: |
      Du entwickelst eine Web-App mit React. Ordne jedes Paket der Liste zu, in die es gehört.
      Beim letzten Paket bist du selbst die Autorin eines Plugins.
    targets:
      - { id: dep, label: "dependencies (App)" }
      - { id: dev, label: "devDependencies (App)" }
      - { id: peer, label: "peerDependencies (dein Plugin)" }
    items:
      - { label: "react – die App rendert damit", target: dep }
      - { label: "zod – prüft Formulardaten zur Laufzeit", target: dep }
      - { label: "vitest – führt Tests aus", target: dev }
      - { label: "typescript – prüft Typen beim Entwickeln", target: dev }
      - { label: "eslint – Linter", target: dev }
      - { label: "react – dein Komponenten-Plugin braucht es, die App bringt es mit", target: peer }
    hints:
      - Wird das Paket ausgeführt, wenn Nutzer die fertige App benutzen? Dann dependencies.
      - Ein Plugin soll keine eigene zweite React-Kopie mitbringen.
---

Fast kein Projekt fängt bei null an: Für Datumsangaben, Validierung oder Tests gibt es fertige
Pakete. Welche ein Projekt nutzt, wie man es startet und welche Node-Version es braucht, steht in
einer einzigen Datei – der `package.json`. Gepflegt wird sie von **npm**.

## npm und die Registry

[[npm|npm]] (*Node Package Manager*) ist der [[paketmanager|Paketmanager]], der mit Node.js
mitkommt. Er besteht aus zwei Teilen: dem Kommandozeilen-Programm `npm` und der
[[npm-registry|npm-Registry]] unter `registry.npmjs.org` mit Millionen Paketen.

Ein [[paket|Paket]] ist ein Ordner mit Code und einer package.json, den jemand zur
Wiederverwendung veröffentlicht hat. Statt selbst farbige Terminal-Ausgaben zu programmieren,
installierst du zum Beispiel `picocolors`.

## Die package.json

Die [[package-json|package.json]] liegt im Hauptordner jedes Projekts. `npm init -y` legt sie mit
Standardwerten an, `npm pkg set` ändert einzelne Felder, ohne dass du das [[json|JSON]] von Hand
bearbeitest.

```json title="package.json"
{
  "name": "wetter-cli",
  "version": "0.1.0",
  "type": "module",
  "scripts": { "start": "node index.js", "test": "node --test" },
  "engines": { "node": ">=24" },
  "dependencies": { "picocolors": "^1.1.1" },
  "devDependencies": { "@types/node": "^24.0.0" }
}
```

| Feld | Bedeutung |
|---|---|
| `name`, `version` | Wer bin ich? Name klein und ohne Leerzeichen, Version nach SemVer |
| `type` | `"module"` = `.js`-Dateien sind ES-Module |
| `scripts` | Kurzbefehle für `npm run <name>` |
| `dependencies` / `devDependencies` | Was brauche ich zur Laufzeit / zum Entwickeln? |
| `engines` | Unterstützte Node-Versionen |
| `private`, `bin`, `files` | Schutz vor Veröffentlichung, CLI-Befehle, Paketinhalt |

> [!MERKSATZ]
> Die package.json ist der **Steckbrief** deines Projekts. In einem fremden Projekt liest du sie
> zuerst: `scripts` verrät, wie man es startet, `dependencies` zeigen den Technik-Stack.

## npm install und node_modules

`npm install <paket>` lädt ein Paket aus der Registry in den Ordner
[[node-modules|`node_modules`]] und trägt es in package.json und Lockfile ein.

| Befehl | Wirkung |
|---|---|
| `npm install` | Installiert alles aus der package.json |
| `npm install zod` | Fügt ein Paket zu `dependencies` hinzu |
| `npm install -D vitest` | Fügt ein Paket zu `devDependencies` hinzu |
| `npm uninstall zod` | Entfernt es aus package.json, Lockfile und node_modules |
| `npm ls --all` | Zeigt alle installierten Pakete als Baum |

Ein Import **ohne** `./` – etwa `import pc from "picocolors"` – sucht in `node_modules`. Pakete
haben selbst Abhängigkeiten: `debug` bringt zum Beispiel `ms` mit. Solche
[[transitive-abhaengigkeit|transitiven Abhängigkeiten]] installiert npm automatisch. Darum wird
`node_modules` oft riesig – und darum gehört er in die [[gitignore|.gitignore]].

> [!FEHLER]
> **Dateien in `node_modules` ändern.** Beim nächsten `npm install` sind die Änderungen weg.
> Ist `node_modules` kaputt, hilft `rm -rf node_modules && npm install`.

## Drei Sorten von Abhängigkeiten

| Liste | Wofür? | Beispiele |
|---|---|---|
| `dependencies` | Code, der zur **Laufzeit** gebraucht wird | `react`, `zod`, `picocolors` |
| `devDependencies` | Nur zum **Entwickeln**, Testen, Bauen | `vitest`, `typescript`, `eslint` |
| `peerDependencies` | „Ich brauche X, aber das **Projekt** bringt es mit“ | ein React-Plugin erwartet `react` |

[[devdependency|devDependencies]] überspringst du in Produktion mit `npm install --omit=dev`.
[[peerdependency|peerDependencies]] brauchst du, wenn du Plugins oder Bibliotheken schreibst: Sie
verhindern, dass ein Projekt zwei Kopien von React enthält.

> [!PRAXIS]
> Prüfe vor jedem neuen Paket: Wird es gepflegt? Wie viele Abhängigkeiten zieht es nach sich?
> Kann die Plattform das schon selbst? `left-pad` zum Beispiel ist überflüssig, seit JavaScript
> `padStart()` kennt. Jede Abhängigkeit ist fremder Code, den du ausführst.

## Zusammenfassung

- **npm** ist Kommandozeilen-Programm und Registry; ein **Paket** ist veröffentlichter, wiederverwendbarer Code.
- Die **package.json** beschreibt ein Projekt; `npm init -y` legt sie an, `npm pkg set` ändert sie.
- `npm install <paket>` lädt nach `node_modules`; `npm uninstall` entfernt sauber.
- **Transitive** Abhängigkeiten kommen automatisch mit; `node_modules` wird nie committet.
- `dependencies` = Laufzeit, `devDependencies` (`-D`) = Entwicklung, `peerDependencies` = bringt das Projekt mit.
