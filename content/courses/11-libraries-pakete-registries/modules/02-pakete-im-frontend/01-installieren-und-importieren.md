---
title: Pakete installieren und importieren
summary: Mit npm und Bun Pakete holen, mit import und export nutzen – und verstehen, warum es ES-Module und CommonJS gibt.
duration: 25
sources:
  - title: npm Docs – npm install
    url: https://docs.npmjs.com/cli/v11/commands/npm-install
  - title: Bun Docs – bun add
    url: https://bun.com/docs/pm/cli/add
  - title: Node.js – Modules – ECMAScript modules
    url: https://nodejs.org/api/esm.html
  - title: Node.js – Modules – CommonJS (require von ES-Modulen)
    url: https://nodejs.org/api/modules.html
quiz:
  - type: match
    question: Ordne jede Zeile dem passenden Modulsystem zu.
    pairs:
      - { left: "import pc from \"picocolors\"", right: "ES-Modul – Standard-Import" }
      - { left: "export function add() {}", right: "ES-Modul – benannter Export" }
      - { left: "const pc = require(\"picocolors\")", right: "CommonJS – Import" }
      - { left: "module.exports = { add }", right: "CommonJS – Export" }
    explanation: ES-Module (ESM) nutzen import und export, CommonJS nutzt require und module.exports.
  - type: find-bug
    question: "Node meldet: Named export 'green' not found. The requested module 'picocolors' is a CommonJS module. In welcher Zeile liegt das Problem?"
    language: js
    code: |
      // gruss.mjs
      import { green } from "picocolors";
      console.log(green("Hallo"));
    bug_line: 2
    explanation: picocolors ist ein CommonJS-Paket, dessen Exporte Node nicht statisch erkennen kann. Importiere den Standard-Export (`import pc from "picocolors"`) und nutze `pc.green`.
  - type: single
    question: Woran erkennt Node.js, ob eine Datei `app.js` als ES-Modul oder als CommonJS gelesen wird?
    options:
      - Am Dateinamen app.js – .js ist immer CommonJS.
      - Am Feld "type" der nächstgelegenen package.json.
      - Daran, ob in der Datei ein Kommentar steht.
      - Das entscheidet der Browser.
    answer: 1
    explanation: "\"type\": \"module\" macht .js-Dateien zu ES-Modulen. Ohne das Feld gilt CommonJS. Mit .mjs und .cjs legst du es pro Datei fest."
  - type: cloze
    text: Mit `npm install ___ picocolors` landet das Paket in den devDependencies. Bei Bun heißt der Befehl zum Hinzufügen `bun ___ picocolors`.
    blanks:
      - [-D, --save-dev]
      - [add]
    explanation: -D steht für --save-dev. bun add ist das Gegenstück zu npm install <paket>.
tasks:
  - id: zwei-modulsysteme
    type: terminal
    title: Ein Paket – zwei Modulsysteme
    description: |
      Im Ordner `farben` liegt ein leeres Projekt mit einer `package.json`.

      1. Füge das Paket `picocolors` mit **Bun** hinzu (`bun add`).
      2. Schreibe `gruss.mjs` (ES-Modul): Importiere picocolors per **Standard-Import** und gib
         `pc.green("Hallo aus ESM")` aus.
      3. Schreibe `gruss.cjs` (CommonJS): Lade picocolors mit `require` und gib
         `pc.green("Hallo aus CommonJS")` aus.
      4. Teste beide Dateien mit `node gruss.mjs` und `node gruss.cjs`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: farben
    setup: |
      npm init -y > /dev/null
    checks:
      - type: file_exists
        path: bun.lock
        message: Es gibt noch keine bun.lock – füge picocolors mit bun add hinzu.
      - type: command
        run: jq -r '.dependencies.picocolors // empty' package.json
        stdout_matches: "\\d"
        message: picocolors steht noch nicht in den dependencies.
      - type: file_contains
        path: gruss.mjs
        pattern: "import\\s+\\w+\\s+from\\s+['\"]picocolors['\"]"
        message: gruss.mjs soll picocolors per Standard-Import laden, z. B. import pc from "picocolors".
      - type: command
        run: node gruss.mjs
        stdout_matches: "Hallo aus ESM"
        message: node gruss.mjs soll "Hallo aus ESM" ausgeben.
      - type: file_contains
        path: gruss.cjs
        pattern: "require\\(\\s*['\"]picocolors['\"]\\s*\\)"
        message: gruss.cjs soll picocolors mit require("picocolors") laden.
      - type: command
        run: node gruss.cjs
        stdout_matches: "Hallo aus CommonJS"
        message: node gruss.cjs soll "Hallo aus CommonJS" ausgeben.
    hints:
      - "Die Dateiendung entscheidet: `.mjs` ist immer ESM, `.cjs` immer CommonJS."
      - "ESM: `import pc from \"picocolors\";` – CommonJS: `const pc = require(\"picocolors\");`"
    solution: |
      ```bash
      cd farben
      bun add picocolors
      printf 'import pc from "picocolors";\nconsole.log(pc.green("Hallo aus ESM"));\n' > gruss.mjs
      printf 'const pc = require("picocolors");\nconsole.log(pc.green("Hallo aus CommonJS"));\n' > gruss.cjs
      node gruss.mjs
      node gruss.cjs
      ```
  - id: esm-oder-cjs
    type: dragdrop
    title: ES-Modul oder CommonJS?
    description: Ordne jedes Merkmal dem richtigen Modulsystem zu.
    targets:
      - { id: esm, label: ES-Module (ESM) }
      - { id: cjs, label: CommonJS }
    items:
      - { label: "import / export", target: esm }
      - { label: "require() / module.exports", target: cjs }
      - { label: "Standard im Browser", target: esm }
      - { label: "Dateiendung .mjs", target: esm }
      - { label: "Dateiendung .cjs", target: cjs }
      - { label: "Ursprüngliches Modulsystem von Node.js", target: cjs }
      - { label: "Importe sind statisch analysierbar", target: esm }
    hints:
      - ESM ist der offizielle JavaScript-Standard, CommonJS wurde von Node.js erfunden, bevor es diesen Standard gab.
---
Du hast im Kurs zu Node.js schon Pakete installiert. Jetzt schaust du genauer hin: Wie gelangt der Code
eines Pakets in deine Datei? Und warum funktioniert `import { green } from "picocolors"` nicht, obwohl
`green` ganz sicher existiert?

## Installieren mit npm und Bun

[[npm]] und [[bun|Bun]] laden Pakete aus der [[npm-registry|npm-Registry]] und legen sie in
[[node-modules|node_modules]] ab. Beide tragen das Paket in die [[package-json|package.json]] ein und
schreiben ein [[lockfile|Lockfile]].

| Aufgabe | npm | Bun |
|---|---|---|
| Paket hinzufügen | `npm install picocolors` | `bun add picocolors` |
| Als Dev-Abhängigkeit | `npm install -D vitest` | `bun add -d vitest` |
| Alles aus package.json installieren | `npm install` | `bun install` |
| Lockfile | `package-lock.json` | `bun.lock` |

Beide nutzen dieselbe Registry und dasselbe Format der package.json. Ein Projekt sollte trotzdem **einen**
Paketmanager verwenden – sonst gibt es zwei Lockfiles, die sich widersprechen.

> [!PRAXIS]
> Schau bei einem neuen Projekt zuerst nach dem Lockfile. Liegt eine `bun.lock` daneben, nutzt das Team Bun;
> eine `package-lock.json` heißt npm. Halte dich daran.

## Exportieren und importieren

Ein [[modul|Modul]] macht Dinge mit `export` nach außen sichtbar. Ein anderes Modul holt sie mit `import`.

```js title="mathe.js"
export function add(a, b) { return a + b; }     // benannter Export
export default function mul(a, b) { return a * b; } // Standard-Export
```

```js title="app.js"
import mul, { add } from "./mathe.js";
console.log(add(2, 3), mul(2, 3));
```

| Art | Export | Import |
|---|---|---|
| [[benannter-export\|Benannter Export]] | `export function add` | `import { add } from …` |
| [[standard-export\|Standard-Export]] | `export default …` | `import beliebigerName from …` |

Steht im Import ein **Pfad** (`./mathe.js`), lädt Node eine Datei. Steht dort ein **Name** (`"picocolors"`),
sucht Node in `node_modules` nach diesem Paket.

## Zwei Modulsysteme: ESM und CommonJS

JavaScript hatte lange kein eigenes Modulsystem. Node.js erfand deshalb [[commonjs|CommonJS]] mit
`require()` und `module.exports`. Später kam der offizielle Standard: [[es-module|ES-Module]] (ESM) mit
`import` und `export` – heute Standard im Browser und in neuem Code.

```js title="CommonJS"
const pc = require("picocolors");
module.exports = { gruss: () => pc.green("Hallo") };
```

Welches System gilt, entscheidet Node so:

| Signal | Bedeutung |
|---|---|
| Endung `.mjs` | immer ESM |
| Endung `.cjs` | immer CommonJS |
| Endung `.js` + `"type": "module"` in package.json | ESM |
| Endung `.js` ohne `type` | CommonJS |

> [!MERKSATZ]
> ESM ist **statisch**: Importe stehen oben und sind schon vor dem Ausführen bekannt. CommonJS ist
> **dynamisch**: `require()` ist ein normaler Funktionsaufruf. Diese Eigenschaft macht ESM für Werkzeuge
> wie Bundler so wertvoll.

## Wenn beide Welten sich treffen

Viele ältere Pakete sind CommonJS, dein Code ist ESM. Node.js baut dafür Brücken:

- **ESM importiert CommonJS:** Der Standard-Import funktioniert immer – er liefert `module.exports`.
  Benannte Importe klappen nur, wenn Node die Namen statisch erkennen kann.
- **CommonJS lädt ESM:** Seit Node 22 geht auch `require()` von ES-Modulen, solange das Modul kein
  Top-Level-`await` nutzt.

```js title="gruss.mjs – so klappt es mit picocolors"
import pc from "picocolors";       // Standard-Import = module.exports
console.log(pc.green("Hallo"));
```

> [!FEHLER]
> **`import { green } from "picocolors"`** bricht mit „Named export 'green' not found“ ab. picocolors
> baut sein Exportobjekt erst zur Laufzeit – Node kann die Namen nicht vorher sehen. Nutze den
> Standard-Import und greife mit `pc.green` zu.

## Zusammenfassung

- `npm install` und `bun add` holen Pakete aus derselben Registry; pro Projekt nutzt du **einen** Paketmanager.
- `export` macht Dinge sichtbar, `import` holt sie – benannt (`{ add }`) oder als Standard-Export.
- Ein Name im Import (`"picocolors"`) wird in `node_modules` gesucht, ein Pfad (`./x.js`) als Datei geladen.
- **ESM** (`import`/`export`) ist der Standard, **CommonJS** (`require`/`module.exports`) das alte Node-System.
- `.mjs`, `.cjs` und das Feld `"type"` entscheiden, welches System gilt.
- Aus CommonJS-Paketen importierst du sicher per Standard-Import.
