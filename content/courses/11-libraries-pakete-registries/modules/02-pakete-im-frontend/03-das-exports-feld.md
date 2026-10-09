---
title: Eigene Library mit exports-Feld
summary: Mit dem exports-Feld bestimmst du, welche Dateien deiner Library öffentlich sind – und bindest sie lokal in eine App ein.
duration: 25
sources:
  - title: Node.js – Packages (exports, conditional exports)
    url: https://nodejs.org/api/packages.html
  - title: npm Docs – package.json (exports, main, files)
    url: https://docs.npmjs.com/cli/v11/configuring-npm/package-json
  - title: npm Docs – npm link
    url: https://docs.npmjs.com/cli/v11/commands/npm-link
  - title: TypeScript – Modules Reference (package.json exports)
    url: https://www.typescriptlang.org/docs/handbook/modules/reference.html#packagejson-exports
quiz:
  - type: single
    question: "Die package.json einer Library enthält nur `\"exports\": { \".\": \"./src/index.js\" }`. Was passiert bei `import x from \"lib/src/intern.js\"`?"
    options:
      - Die Datei wird ganz normal geladen.
      - Node bricht mit ERR_PACKAGE_PATH_NOT_EXPORTED ab.
      - Node lädt stattdessen src/index.js.
      - npm installiert die Datei nach.
    answer: 1
    explanation: Sobald es ein exports-Feld gibt, sind nur die dort genannten Pfade erreichbar. Alles andere ist privat.
  - type: find-bug
    question: TypeScript findet die Typen der Library nicht, obwohl die Datei existiert. Welche Zeile ist das Problem?
    language: json
    code: |
      {
        "name": "textkit",
        "type": "module",
        "exports": {
          ".": {
            "default": "./src/index.js",
            "types": "./src/index.d.ts"
          }
        }
      }
    bug_line: 6
    explanation: Bedingungen werden von oben nach unten geprüft, die erste passende gewinnt. default passt immer – deshalb muss types davor stehen.
  - type: match
    question: Was bewirkt welche Bedingung im exports-Feld?
    pairs:
      - { left: "types", right: "Datei für TypeScript" }
      - { left: "import", right: "Datei, wenn das Paket per import geladen wird" }
      - { left: "require", right: "Datei, wenn das Paket per require geladen wird" }
      - { left: "default", right: "Rückfall, wenn keine andere Bedingung passt" }
    explanation: Mit diesen Bedingungen liefert ein Paket für jede Umgebung die passende Datei aus.
  - type: cloze
    text: 'Mit `npm install ../textkit` landet in der package.json der App der Eintrag `"textkit": "___:../textkit"`. In node_modules liegt dann ein ___ auf den Ordner.'
    blanks:
      - [file]
      - [Symlink, symbolischer Link, Link]
    explanation: Eine file:-Abhängigkeit verweist auf einen lokalen Ordner. npm verlinkt ihn, statt ihn zu kopieren – Änderungen sind sofort sichtbar.
tasks:
  - id: eigene-library
    type: terminal
    title: Baue und verlinke deine Library
    description: |
      Im Ordner `bibliothek` liegen zwei Unterordner:

      - `textkit/` – deine Library mit `src/index.js` (Funktion `slugify`), `src/index.d.ts` (Typen) und
        `src/intern.js` (Hilfsfunktionen, die **privat** bleiben sollen). Die package.json hat noch kein `exports`.
      - `app/` – eine leere App (`"type": "module"`).

      1. Ergänze in `textkit/package.json` ein `exports`-Feld für den Pfad `"."` mit den Bedingungen
         `types` (→ `./src/index.d.ts`) und `default` (→ `./src/index.js`) – in dieser Reihenfolge.
      2. Installiere die Library in der App als lokale Abhängigkeit: `cd app && npm install ../textkit`.
      3. Schreibe `app/main.js`, das `slugify` aus `textkit` importiert und `slugify("Hallo Stacklab Welt")` ausgibt.
      4. Teste mit `node main.js` (Ausgabe: `hallo-stacklab-welt`).

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: bibliothek
    setup: |
      mkdir -p textkit/src app
      cat > textkit/package.json <<'EOF'
      {
        "name": "textkit",
        "version": "1.0.0",
        "type": "module",
        "license": "MIT"
      }
      EOF
      cat > textkit/src/index.js <<'EOF'
      import { normalize } from "./intern.js";

      export function slugify(text) {
        return normalize(text).split(" ").filter(Boolean).join("-");
      }
      EOF
      cat > textkit/src/intern.js <<'EOF'
      export function normalize(text) {
        return text.toLowerCase().trim();
      }
      EOF
      cat > textkit/src/index.d.ts <<'EOF'
      export declare function slugify(text: string): string;
      EOF
      cd app && npm init -y > /dev/null && npm pkg set type=module
    checks:
      - type: command
        run: jq -r '.exports["."] | keys_unsorted | join(",")' textkit/package.json
        stdout_equals: types,default
        message: 'textkit/package.json braucht exports["."] mit den Bedingungen types und default – types zuerst.'
      - type: command
        run: jq -r '.exports["."].types' textkit/package.json
        stdout_equals: ./src/index.d.ts
        message: Die Bedingung types soll auf ./src/index.d.ts zeigen.
      - type: command
        run: jq -r '.dependencies.textkit // empty' app/package.json
        stdout_matches: "^file:"
        message: Die App hat textkit noch nicht als lokale Abhängigkeit (cd app && npm install ../textkit).
      - type: command
        run: cd app && node main.js
        stdout_matches: "hallo-stacklab-welt"
        message: app/main.js soll slugify("Hallo Stacklab Welt") ausgeben.
      - type: command
        run: cd app && node -e 'import("textkit/src/intern.js").then(() => console.log("offen"), (e) => console.log(e.code))'
        stdout_equals: ERR_PACKAGE_PATH_NOT_EXPORTED
        message: src/intern.js ist noch von außen importierbar. Nenne im exports-Feld nur den Pfad ".".
    hints:
      - "Das Feld sieht so aus: `\"exports\": { \".\": { \"types\": \"./src/index.d.ts\", \"default\": \"./src/index.js\" } }`"
      - "Statt die JSON-Datei von Hand zu bearbeiten, geht auch `npm pkg set` im Ordner textkit: `npm pkg set 'exports[.].types=./src/index.d.ts'` und `npm pkg set 'exports[.].default=./src/index.js'`."
      - "In main.js: `import { slugify } from \"textkit\";`"
    solution: |
      ```bash
      cd bibliothek/textkit
      npm pkg set 'exports[.].types=./src/index.d.ts'
      npm pkg set 'exports[.].default=./src/index.js'
      cd ../app
      npm install ../textkit
      printf 'import { slugify } from "textkit";\nconsole.log(slugify("Hallo Stacklab Welt"));\n' > main.js
      node main.js
      ```
  - id: library-schritte
    type: order
    title: Von der Idee zur eingebundenen Library
    description: Bringe die Schritte in die richtige Reihenfolge.
    items:
      - Ordner und package.json mit name, version und type anlegen
      - Code in src/ schreiben und Funktionen exportieren
      - Typdeklarationen (.d.ts) ergänzen
      - Öffentliche Pfade im exports-Feld festlegen
      - Library in der App mit npm install ../library einbinden
      - In der App importieren und ausprobieren
---
Bisher hast du Pakete anderer Leute benutzt. Jetzt drehst du den Spieß um und baust selbst eine. Die
wichtigste Frage dabei: Was dürfen andere von deiner Library sehen – und was ist dein privates
Innenleben, das du jederzeit umbauen willst?

## Der Einstiegspunkt: main und exports

Wenn eine App `import { slugify } from "textkit"` schreibt, muss Node wissen, welche Datei gemeint ist.
Das steht in der package.json der Library:

| Feld | Seit | Wirkung |
|---|---|---|
| `main` | immer | Eine Einstiegsdatei. Alle anderen Dateien sind trotzdem per Pfad erreichbar. |
| `exports` | Node 12 | Legt **alle** öffentlichen Pfade fest. Alles andere ist gesperrt. |

```json title="textkit/package.json"
{
  "name": "textkit",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": "./src/index.js"
  }
}
```

Der Punkt `"."` steht für den Paketnamen selbst. `import … from "textkit"` lädt also `./src/index.js`.

> [!MERKSATZ]
> Das [[exports-feld|exports-Feld]] ist die **öffentliche API** deiner Library. Was dort nicht steht, kann
> niemand importieren – und du darfst es jederzeit umbauen, ohne jemanden zu brechen.

## Mehrere Türen: Subpath Exports

Eine Library kann mehrere Einstiegspunkte anbieten. Diese heißen [[subpath-export|Subpath Exports]]:

```json
"exports": {
  ".": "./src/index.js",
  "./format": "./src/format.js",
  "./package.json": "./package.json"
}
```

| Import in der App | Ergebnis |
|---|---|
| `import … from "textkit"` | lädt `src/index.js` |
| `import … from "textkit/format"` | lädt `src/format.js` |
| `import … from "textkit/src/intern.js"` | Fehler `ERR_PACKAGE_PATH_NOT_EXPORTED` |

So kannst du eine Datei umbenennen oder verschieben, ohne dass Apps kaputtgehen: Nur die Tür nach außen
muss gleich bleiben.

## Bedingte Exporte

Manchmal braucht jede Umgebung eine andere Datei: TypeScript die Typen, `import` die ESM-Fassung,
`require` die CommonJS-Fassung. Dafür gibt es [[bedingte-exporte|bedingte Exporte]]:

```json
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js",
    "require": "./dist/index.cjs",
    "default": "./dist/index.js"
  }
}
```

Node und TypeScript gehen die Bedingungen **von oben nach unten** durch und nehmen die erste passende.

> [!FEHLER]
> **`default` vor `types` schreiben.** `default` passt immer – TypeScript kommt dann nie bei `types` an und
> meldet fehlende Typen. Regel: `types` zuerst, `default` zuletzt.

## Die eigene Library lokal einbinden

Bevor du eine Library veröffentlichst, testest du sie in einer echten App. Dafür gibt es drei Wege:

| Weg | Befehl | Eintrag in der App |
|---|---|---|
| `file:`-Abhängigkeit | `npm install ../textkit` | `"textkit": "file:../textkit"` |
| Globaler Link | `npm link` in der Library, `npm link textkit` in der App | nichts (nur ein Link) |
| Workspaces | gemeinsame package.json im Wurzelordner | `"textkit": "workspace:*"` (Bun) |

Bei `file:` legt npm in `node_modules` einen [[symlink|Symlink]] auf deinen Ordner an. Änderst du die
Library, sieht die App das sofort – ohne neu zu installieren. Workspaces lernst du im Kurs zu Monorepos
genauer kennen.

> [!PRAXIS]
> In Teams entstehen so interne Libraries: ein gemeinsames Paket für Datumsformate oder UI-Bausteine, das
> mehrere Apps nutzen. Ein sauberes `exports`-Feld sorgt dafür, dass niemand von internen Dateien abhängt.

## Zusammenfassung

- `main` nennt nur eine Einstiegsdatei, `exports` legt **alle** öffentlichen Pfade fest.
- `"."` ist der Paketname selbst, `"./format"` ein zusätzlicher Subpath Export.
- Nicht exportierte Dateien führen zu `ERR_PACKAGE_PATH_NOT_EXPORTED` – sie sind privat.
- Bedingte Exporte liefern je Umgebung eine Datei; `types` steht zuerst, `default` zuletzt.
- Lokal bindest du eine Library mit `npm install ../pfad` (file:), `npm link` oder Workspaces ein.
