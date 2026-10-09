---
title: Bun – Runtime und Paketmanager in einem
summary: Was Bun von Node.js unterscheidet, wie du TypeScript direkt ausführst und wie bun install, bun add, bun.lock und bunx funktionieren.
duration: 25
sources:
  - title: Bun Docs – Welcome to Bun
    url: https://bun.com/docs
  - title: Bun Docs – bun run
    url: https://bun.com/docs/runtime
  - title: Bun Docs – bun install
    url: https://bun.com/docs/pm/cli/install
  - title: Bun Docs – Node.js compatibility
    url: https://bun.com/docs/runtime/nodejs-compat
  - title: Bun Docs – bunx
    url: https://bun.com/docs/pm/bunx
quiz:
  - type: match
    question: Welcher Bun-Befehl ersetzt welches Werkzeug?
    pairs:
      - { left: "bun index.ts", right: "node index.js (plus TypeScript-Compiler)" }
      - { left: "bun install", right: "npm install" }
      - { left: "bunx eslint .", right: "npx eslint ." }
      - { left: "bun test", right: "Jest oder Vitest" }
      - { left: "bun build", right: "Bundler wie esbuild oder webpack" }
    explanation: Bun bündelt Runtime, Paketmanager, Test-Runner und Bundler in einem einzigen Programm.
  - type: single
    question: Wie heißt das Lockfile von Bun, und in welchem Format ist es?
    options: ["bun.lockb, binär", "bun.lock, Text (JSONC)", "package-lock.json, JSON", "bun.yaml, YAML"]
    answer: 1
    explanation: Seit Bun 1.2 ist bun.lock eine lesbare Textdatei. Das alte binäre bun.lockb lässt sich migrieren.
  - type: multiple
    question: Welche Aussagen über Bun stimmen?
    options:
      - Bun führt TypeScript-Dateien ohne Zwischenschritt aus.
      - Bun nutzt die Engine JavaScriptCore aus Safari.
      - Bun unterstützt große Teile der Node.js-APIs wie node:fs und node:http.
      - Bun führt postinstall-Skripte aller Pakete automatisch aus.
    answers: [0, 1, 2]
    explanation: Bun führt Lifecycle-Skripte von Abhängigkeiten nur aus, wenn das Paket in trustedDependencies steht – ein Sicherheitsgewinn.
  - type: cloze
    text: Mit `bun add ___ vitest` landet ein Paket in den devDependencies. Einen Paket-Befehl ohne Installation startest du mit `___`.
    blanks:
      - ["-d", "--dev", "-D"]
      - [bunx]
    explanation: bun add -d entspricht npm install -D, bunx entspricht npx.
tasks:
  - id: bun-start
    type: terminal
    title: Dein erstes Bun-Projekt
    description: |
      Der Ordner `bun-start` ist leer. Lege ein Bun-Projekt an und führe TypeScript direkt aus.

      1. Erzeuge das Projekt mit `bun init -y` und sieh dir die angelegten Dateien an.
      2. Installiere `picocolors` mit `bun add`.
      3. Lege `gruss.ts` an mit einer Funktion `gruesse(name: string): string`, die `Hallo, <name>!`
         zurückgibt, und gib `gruesse("Bun")` grün mit `picocolors` aus.
      4. Lege in der package.json das Skript `start` an, das `bun gruss.ts` ausführt.
      5. Teste mit `bun run start`.
    workdir: bun-start
    checks:
      - type: file_exists
        path: bun.lock
        message: Es gibt noch kein bun.lock. Starte mit bun init -y oder bun install.
      - type: command
        run: jq -r '.dependencies.picocolors // "fehlt"' package.json
        stdout_matches: "^\\^?\\d"
        message: picocolors fehlt in den dependencies. Nutze bun add picocolors.
      - type: file_contains
        path: bun.lock
        pattern: "\"picocolors\""
        message: picocolors steht noch nicht im bun.lock.
      - type: file_contains
        path: gruss.ts
        pattern: "name\\s*:\\s*string"
        message: 'Die Funktion in gruss.ts soll den Parameter mit einem Typ versehen (name: string).'
      - type: command
        run: jq -r '.scripts.start' package.json
        stdout_equals: bun gruss.ts
        message: Das Skript start soll "bun gruss.ts" ausführen.
      - type: command
        run: bun run start 2>&1
        stdout_matches: "Hallo, Bun!"
        message: bun run start soll "Hallo, Bun!" ausgeben.
    hints:
      - "`bun init -y` legt package.json, tsconfig.json, index.ts und bun.lock an."
      - "Skript anlegen: `npm pkg set scripts.start=\"bun gruss.ts\"` funktioniert auch in Bun-Projekten."
      - "`import pc from \"picocolors\"; console.log(pc.green(gruesse(\"Bun\")));`"
    solution: |
      ```bash
      cd bun-start
      bun init -y
      bun add picocolors
      cat > gruss.ts <<'EOF'
      import pc from "picocolors";

      export function gruesse(name: string): string {
        return `Hallo, ${name}!`;
      }

      console.log(pc.green(gruesse("Bun")));
      EOF
      npm pkg set scripts.start="bun gruss.ts"
      bun run start
      ```
  - id: node-zu-bun
    type: dragdrop
    title: Von npm und Node.js zu Bun
    description: Ordne jedem Bun-Befehl den npm- oder Node-Befehl zu, den er ersetzt.
    targets:
      - { id: install, label: "npm install" }
      - { id: add, label: "npm install zod" }
      - { id: adddev, label: "npm install -D vitest" }
      - { id: remove, label: "npm uninstall zod" }
      - { id: run, label: "npm run build" }
      - { id: x, label: "npx create-vite" }
    items:
      - { label: "bun install", target: install }
      - { label: "bun add zod", target: add }
      - { label: "bun add -d vitest", target: adddev }
      - { label: "bun remove zod", target: remove }
      - { label: "bun run build", target: run }
      - { label: "bunx create-vite", target: x }
    hints:
      - Bun nennt das Hinzufügen add und das Entfernen remove.
---

Du kennst jetzt Node.js, npm und nvm – drei Werkzeuge, dazu kommen in echten Projekten noch
TypeScript-Compiler, Test-Framework und Bundler. [[bun|Bun]] verfolgt eine andere Idee: **ein**
schnelles Programm, das all das kann.

## Was ist Bun?

Bun ist eine JavaScript-[[laufzeitumgebung|Runtime]] wie Node.js. Statt V8 nutzt sie die Engine
*JavaScriptCore* aus Safari und ist in der Sprache Zig geschrieben. Bun ist auf Geschwindigkeit
optimiert: Start, Installation und Tests sind oft deutlich schneller als mit den klassischen
Werkzeugen.

| Aufgabe | Klassisch | Bun |
|---|---|---|
| Code ausführen | `node index.js` | `bun index.ts` |
| TypeScript ausführen | Compiler oder Type Stripping | direkt, ohne Konfiguration |
| Pakete installieren | `npm install` | `bun install` |
| Paket-Befehl ausführen | `npx` | `bunx` |
| Testen | Jest, Vitest | `bun test` |
| Bündeln | esbuild, webpack | `bun build` |

Bun hält sich an die Node.js-APIs: `node:fs`, `node:http`, `process` und die meisten
npm-Pakete funktionieren unverändert. Dazu bringt Bun eigene APIs wie `Bun.file()` oder
`Bun.serve()` mit.

> [!MERKSATZ]
> Bun ist **Runtime, Paketmanager, Test-Runner und Bundler** in einem Programm – kompatibel zu
> Node.js und npm, aber schneller und mit eingebautem TypeScript.

## Bun als Runtime

Bun führt JavaScript **und** [[typescript|TypeScript]] direkt aus. Die Typen werden dabei
entfernt, aber nicht geprüft – dafür brauchst du weiterhin `tsc` oder deinen Editor.

```ts title="hallo.ts"
function gruesse(name: string): string {
  return `Hallo, ${name}!`;
}
console.log(gruesse("Bun"), Bun.version);
```

```bash title="Terminal"
bun hallo.ts           # Datei ausführen
bun --watch hallo.ts   # bei Änderungen neu starten
bun run dev            # Skript "dev" aus package.json starten
bun init -y            # neues Projekt mit package.json, tsconfig.json, index.ts
```

`bun init` setzt `"type": "module"` automatisch – Bun denkt in ES-Modulen.

## Bun als Paketmanager

`bun install` liest dieselbe package.json wie npm und installiert nach `node_modules`. Du kannst
Bun also auch nur als schnellen Paketmanager in einem Node-Projekt verwenden. Statt `npx` nutzt
du [[bunx|`bunx`]], etwa `bunx create-vite`.

| Befehl | Wirkung |
|---|---|
| `bun install` | Alles aus package.json installieren |
| `bun add zod` | Paket zu `dependencies` hinzufügen |
| `bun add -d vitest` | Paket zu `devDependencies` hinzufügen |
| `bun add -E zod` | Exakte Version statt `^`-Bereich |
| `bun remove zod` | Paket entfernen |
| `bun install --frozen-lockfile` | Wie `npm ci`: Abbruch, wenn Lockfile nicht passt |

Das Lockfile heißt [[bun-lock|`bun.lock`]]. Es ist seit Bun 1.2 eine lesbare Textdatei, wird
committet und lässt sich im Code-Review prüfen. Ältere Projekte haben noch ein binäres
`bun.lockb`, das du migrieren kannst.

> [!FEHLER]
> **Zwei Lockfiles im Repository.** Wer im selben Projekt mal `npm install` und mal `bun install`
> nutzt, erzeugt `package-lock.json` **und** `bun.lock`, die auseinanderlaufen. Entscheidet euch
> pro Projekt für einen Paketmanager und löscht das andere Lockfile.

## Sicherheit: trustedDependencies

npm führt Installationsskripte (`postinstall`) aller Pakete automatisch aus – ein beliebtes
Einfallstor für Schadcode. Bun tut das nur für Pakete, die in `trustedDependencies` der
package.json stehen. Braucht ein Paket sein Skript wirklich, erlaubst du es gezielt mit
`bun add --trust <paket>`.

> [!PRAXIS]
> Viele Teams steigen schrittweise um: Erst ersetzt `bun install` das langsamere `npm install` in
> der CI, später kommen `bun test` und `bun run` dazu. Weil Bun die package.json versteht, ist
> der Wechsel klein und jederzeit umkehrbar.

## Zusammenfassung

- **Bun** ist Runtime (JavaScriptCore, Zig), Paketmanager, Test-Runner und Bundler in einem.
- `bun datei.ts` führt TypeScript direkt aus; Typen werden nicht geprüft.
- `bun install`, `bun add`, `bun add -d`, `bun remove` ersetzen die npm-Befehle; `bunx` ersetzt `npx`.
- Das Lockfile `bun.lock` ist Text und wird committet – nur **ein** Paketmanager pro Projekt.
- Installationsskripte laufen nur für Pakete in `trustedDependencies`.
