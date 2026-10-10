---
title: tsc und die tsconfig.json
summary: Wie du TypeScript installierst, den Compiler startest und mit einer strengen tsconfig.json festlegst, wie geprüft wird.
duration: 25
sources:
  - title: TSConfig Reference
    url: https://www.typescriptlang.org/tsconfig/
  - title: TypeScript Handbook – What is a tsconfig.json
    url: https://www.typescriptlang.org/docs/handbook/tsconfig-json.html
  - title: Choosing Compiler Options (Modules Reference)
    url: https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html
  - title: Announcing TypeScript 7.0
    url: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
quiz:
  - type: match
    question: Ordne jeder Option ihre Wirkung zu.
    pairs:
      - { left: "strict", right: "Schaltet die strengen Prüfungen ein, z. B. für null und undefined" }
      - { left: "noEmit", right: "Nur prüfen, keine .js-Dateien schreiben" }
      - { left: "noUncheckedIndexedAccess", right: "arr[0] hat zusätzlich den Typ undefined" }
      - { left: "verbatimModuleSyntax", right: "Reine Typ-Importe müssen mit import type markiert sein" }
    explanation: Diese vier Optionen begegnen dir in fast jedem modernen Projekt. `strict` ist in TypeScript 7 sogar die Voreinstellung.
  - type: single
    question: Du baust eine React-App mit Vite. Welche Einstellung für `moduleResolution` passt?
    options:
      - '"bundler"'
      - '"nodenext"'
      - '"node10"'
    answer: 0
    explanation: Ein Bundler wie Vite löst Importe selbst auf und erlaubt z. B. Importe ohne Dateiendung. Dafür gibt es `bundler`. `node10` existiert in TypeScript 7 nicht mehr.
  - type: single
    question: "`erasableSyntaxOnly` ist an. Welche Zeile meldet `tsc` als Fehler?"
    options:
      - "type Role = \"admin\" | \"user\";"
      - "enum Role { Admin, User }"
      - "const role: string = \"admin\";"
    answer: 1
    explanation: Ein `enum` erzeugt echten JavaScript-Code. Er lässt sich nicht einfach wegschneiden – genau das verbietet `erasableSyntaxOnly`. Ein Union-Typ verschwindet dagegen spurlos.
  - type: cloze
    text: "Mit `npx tsc --___` erzeugst du eine neue tsconfig.json. Mit `npx tsc --___` siehst du die endgültige, aufgelöste Konfiguration."
    blanks:
      - [init]
      - [showConfig, showconfig]
    explanation: "`--init` legt eine kommentierte Startdatei an, `--showConfig` gibt die wirksame Konfiguration als JSON aus."
tasks:
  - id: optionen-zuordnen
    type: dragdrop
    title: Welche Option löst welches Problem?
    description: Ziehe jede Option zu der Situation, in der du sie brauchst.
    targets:
      - { id: prozess, label: Ein Bundler oder Node.js erzeugt das JavaScript – tsc soll nur prüfen }
      - { id: index, label: "users[0].name stürzt ab, wenn die Liste leer ist" }
      - { id: entfernen, label: "Node.js soll die .ts-Dateien direkt ausführen können" }
      - { id: aufloesung, label: "Vite löst die Importe auf" }
    items:
      - { label: '"noEmit": true', target: prozess }
      - { label: '"noUncheckedIndexedAccess": true', target: index }
      - { label: '"erasableSyntaxOnly": true', target: entfernen }
      - { label: '"moduleResolution": "bundler"', target: aufloesung }
  - id: tsconfig-anlegen
    type: terminal
    title: Eine strenge tsconfig.json schreiben
    description: |
      Im Ordner `tsconfig-anlegen` liegt ein Projekt mit installiertem TypeScript, aber **ohne**
      `tsconfig.json`. Der echte Code liegt in `src/`, im Ordner `playground/` liegen alte Experimente
      voller Fehler, die nicht geprüft werden sollen.

      1. Lege `tsconfig.json` an (z. B. mit `nano tsconfig.json`).
      2. Setze unter `compilerOptions`: `strict`, `noEmit`, `verbatimModuleSyntax`, `erasableSyntaxOnly`,
         `noUncheckedIndexedAccess` und `allowImportingTsExtensions` auf `true`, `target` auf `"es2024"`
         und `module` auf `"nodenext"`.
      3. Sorge mit `include` dafür, dass nur `src` geprüft wird.
      4. `npx tsc --noEmit` muss ohne Fehler durchlaufen, und `node src/main.ts` begrüßt Ada.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: tsconfig-anlegen
    setup: |
      npm init -y >/dev/null
      npm pkg set type=module
      npm install --save-dev --no-audit --no-fund typescript@7.0.2 >/dev/null
      mkdir -p src playground
      cat > src/greeting.ts <<'TS'
      export type Language = "de" | "en";

      export function greet(name: string, language: Language): string {
        return language === "de" ? `Hallo ${name}!` : `Hello ${name}!`;
      }
      TS
      cat > src/main.ts <<'TS'
      import { greet } from "./greeting.ts";
      import type { Language } from "./greeting.ts";

      const languages: Language[] = ["de", "en"];
      for (const language of languages) {
        console.log(greet("Ada", language));
      }
      TS
      cat > playground/scratch.ts <<'TS'
      const answer: number = "zweiundvierzig";
      console.log(answer.toUpperCase());
      TS
    checks:
      - type: file_exists
        path: tsconfig.json
        message: Es gibt noch keine tsconfig.json im Ordner.
      - type: command
        run: npx tsc --showConfig | jq -r '[.compilerOptions.strict, .compilerOptions.noEmit, .compilerOptions.verbatimModuleSyntax, .compilerOptions.erasableSyntaxOnly, .compilerOptions.noUncheckedIndexedAccess, .compilerOptions.allowImportingTsExtensions] | map(tostring) | join(",")'
        stdout_equals: "true,true,true,true,true,true"
        message: Setze strict, noEmit, verbatimModuleSyntax, erasableSyntaxOnly, noUncheckedIndexedAccess und allowImportingTsExtensions ausdrücklich auf true.
      - type: command
        run: npx tsc --showConfig | jq -r '.compilerOptions.target + " " + .compilerOptions.module'
        stdout_equals: "es2024 nodenext"
        message: 'Setze "target": "es2024" und "module": "nodenext".'
      - type: command
        run: npx tsc --noEmit
        expect_exit: 0
        message: "`npx tsc --noEmit` meldet Fehler. Prüfst du vielleicht noch den Ordner playground? Nutze \"include\": [\"src\"]."
      - type: command
        run: node src/main.ts
        stdout_matches: "^Hallo Ada!$"
        message: "`node src/main.ts` soll „Hallo Ada!“ ausgeben. Ist package.json noch auf \"type\": \"module\" gesetzt?"
    hints:
      - Eine tsconfig.json ist reines JSON mit den Schlüsseln `compilerOptions` und `include`.
      - "Ohne `allowImportingTsExtensions` meckert tsc über `./greeting.ts` – mit `noEmit` darfst du die Option setzen."
      - "Gerüst: `{ \"compilerOptions\": { \"strict\": true, … }, \"include\": [\"src\"] }`"
    solution: |
      ```json
      {
        "compilerOptions": {
          "target": "es2024",
          "module": "nodenext",
          "strict": true,
          "noEmit": true,
          "allowImportingTsExtensions": true,
          "verbatimModuleSyntax": true,
          "erasableSyntaxOnly": true,
          "noUncheckedIndexedAccess": true,
          "skipLibCheck": true
        },
        "include": ["src"]
      }
      ```
---
Du willst ein Projekt mit TypeScript starten. Welche Version installierst du? Wie startest du die Prüfung?
Und wie streng soll sie sein? Die Antworten stehen in einer einzigen Datei: der
[[tsconfig|tsconfig.json]]. Sie ist die Hausordnung deines Projekts.

## TypeScript installieren und starten

TypeScript ist ein [[paket|npm-Paket]]. Du installierst es pro Projekt als
[[devdependency|Dev-Dependency]], weil es nur beim Entwickeln gebraucht wird, nicht im fertigen Programm.

```bash title="Terminal"
npm install --save-dev typescript
npx tsc --version        # Version 7.0.2
npx tsc --init           # legt eine kommentierte tsconfig.json an
npx tsc --noEmit         # prüft das Projekt, schreibt nichts
```

[[npx]] startet das lokal installierte `tsc` aus `node_modules`. So nutzt jedes Projekt genau die Version
aus seiner [[package-json|package.json]] – nicht irgendeine globale.

Findet `tsc` keine Fehler, endet es **ohne Ausgabe** mit [[exit-code|Exit-Code]] 0. Bei Fehlern listet es
jede Stelle als `datei.ts(zeile,spalte): error TS2322: …` auf und endet mit Exit-Code 1. Darauf
verlassen sich Skripte und [[ci-pipeline|CI-Pipelines]].

> [!PRAXIS]
> In Teams steht die Prüfung als Skript in der package.json, z. B. `"typecheck": "tsc --noEmit"`.
> Die CI-Pipeline lässt jeden Pull Request durchfallen, der Typfehler enthält.

## Aufbau der tsconfig.json

Die Datei liegt im Projektwurzelordner. Sie hat zwei wichtige Teile: **welche Dateien** geprüft werden
und **wie** geprüft wird.

```json title="tsconfig.json"
{
  "compilerOptions": {
    "target": "es2024",
    "module": "nodenext",
    "strict": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

| Schlüssel | Bedeutung |
|---|---|
| `include` | Ordner oder Muster, deren `.ts`-Dateien zum Projekt gehören |
| `compilerOptions` | Alle Einstellungen für Prüfung und Ausgabe |
| `target` | Für welche JavaScript-Version Code erzeugt wird (z. B. `es2024`) |
| `module` | Welches Modulsystem gilt, z. B. `nodenext` oder `esnext` |

Mit `npx tsc --showConfig` siehst du die endgültige Konfiguration – inklusive der Werte, die TypeScript
selbst ergänzt.

## Die wichtigsten Optionen für neue Projekte

- **`strict`** schaltet eine ganze Familie strenger Prüfungen ein. Die wichtigste: `null` und
  [[undefined]] sind eigene Typen und müssen behandelt werden.
- **`noEmit`**: `tsc` prüft nur. Das JavaScript erzeugt ein [[bundler|Bundler]] oder Node.js.
- **`noUncheckedIndexedAccess`**: `list[0]` hat den Typ `T | undefined`, denn die Liste könnte leer sein.
- **`verbatimModuleSyntax`**: Importe, die nur Typen holen, müssen `import type` heißen ([[type-only-import|Type-only-Import]]). So weiß jedes
  Werkzeug, welche Importe es beim Entfernen der Typen löschen darf.
- **`erasableSyntaxOnly`**: Verbietet TypeScript-Syntax, die echten JavaScript-Code erzeugt, etwa
  ein [[enum|Enum]] oder `namespace`. Übrig bleibt Code, den Node.js per [[type-stripping|Type Stripping]] direkt
  ausführen kann.

```ts title="verbatimModuleSyntax in Aktion"
import { greet } from "./greeting.ts";        // Wert – bleibt im JavaScript
import type { Language } from "./greeting.ts"; // nur Typ – wird komplett entfernt
```

> [!FEHLER]
> `enum Role { Admin, User }` mit `erasableSyntaxOnly` ergibt `error TS1294`. Nimm stattdessen einen
> Union-Typ: `type Role = "admin" | "user"`. Den lernst du in Modul 2 kennen.

## moduleResolution: Wer findet die Importe?

Die Option `moduleResolution` steuert die [[modulaufloesung|Modulauflösung]]: Sie sagt TypeScript, wie aus `import … from "./x"` eine Datei wird. Sie muss zu
dem Werkzeug passen, das deinen Code später wirklich ausführt.

| Projektart | `module` | `moduleResolution` | Besonderheit |
|---|---|---|---|
| Frontend mit [[vite]] | `esnext` | `bundler` | Importe ohne Dateiendung erlaubt |
| Node.js-Programm | `nodenext` | `nodenext` (automatisch) | Relative Importe brauchen eine Endung |

Führt Node.js `.ts`-Dateien direkt aus, importierst du mit Endung `./greeting.ts`. Dafür brauchst du
zusätzlich `allowImportingTsExtensions` – erlaubt nur zusammen mit `noEmit`, weil `tsc` sonst Importe auf
Dateien erzeugen würde, die es danach nicht mehr gibt.

> [!MERKSATZ]
> `bundler` für Vite & Co., `nodenext` für Node.js. Die alten Werte `node`/`node10` und `classic` gibt es
> in TypeScript 7 nicht mehr.

## Was sich mit TypeScript 7 geändert hat

TypeScript 7 hat Optionen entfernt, die schon in Version 6 als veraltet galten, und strengere
Voreinstellungen eingeführt:

| Thema | TypeScript 7 |
|---|---|
| `strict` | standardmäßig `true` |
| `module` | standardmäßig `esnext` |
| `types` | standardmäßig `[]` – `@types`-Pakete wie `@types/node` trägst du ausdrücklich ein |
| `target: "es5"` | entfernt |
| `moduleResolution: "node10"`/`"classic"` | entfernt – nimm `bundler` oder `nodenext` |
| `baseUrl` | entfernt – `paths` funktioniert relativ zur tsconfig.json |

Schreib die wichtigen Optionen trotzdem ausdrücklich in die Datei. Wer sie liest, sieht sofort, wie
streng das Projekt ist – egal, welche Version gerade installiert ist. Alle Optionen erklärt die
[TSConfig-Referenz](https://www.typescriptlang.org/tsconfig/).

## Zusammenfassung

- TypeScript wird pro Projekt als Dev-Dependency installiert und mit `npx tsc` gestartet.
- `tsc --noEmit` prüft nur; Exit-Code 0 heißt: keine Fehler.
- Die tsconfig.json legt fest, **welche** Dateien (`include`) und **wie** (`compilerOptions`) geprüft werden.
- Für neue Projekte: `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `erasableSyntaxOnly`.
- `moduleResolution`: `bundler` für Vite, `nodenext` für Node.js.
- TypeScript 7 hat `strict` als Standard und alte Optionen wie `es5`, `node10` und `baseUrl` entfernt.
