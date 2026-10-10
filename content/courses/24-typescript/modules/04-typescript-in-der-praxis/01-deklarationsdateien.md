---
title: Deklarationsdateien und fremder JavaScript-Code
summary: Was .d.ts-Dateien sind, woher TypeScript die Typen von npm-Paketen nimmt und wie du eine JavaScript-Bibliothek ohne Typen selbst typisierst.
duration: 20
sources:
  - title: TypeScript Handbook – Type Declarations
    url: https://www.typescriptlang.org/docs/handbook/2/type-declarations.html
  - title: Declaration Files – Introduction
    url: https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html
  - title: Declaration Files – Consumption
    url: https://www.typescriptlang.org/docs/handbook/declaration-files/consumption.html
  - title: TSConfig Reference – types
    url: https://www.typescriptlang.org/tsconfig/#types
quiz:
  - type: single
    question: Was steht in einer `.d.ts`-Datei?
    options:
      - Nur Typinformationen – Signaturen, aber keine ausführbare Logik.
      - Der kompilierte JavaScript-Code eines Pakets.
      - Die Testfälle eines Pakets.
    answer: 0
    explanation: Eine Deklarationsdatei beschreibt die Form von Code, der woanders steht. Zur Laufzeit wird sie nie ausgeführt.
  - type: cloze
    text: "Typen für Node.js installierst du mit `npm install --save-dev @___/node`. Sie stammen aus dem Projekt ___."
    blanks:
      - [types]
      - [DefinitelyTyped]
    explanation: Pakete ohne eigene Typen bekommen sie oft aus DefinitelyTyped, veröffentlicht unter dem Namensraum `@types`.
  - type: multiple
    question: "In TypeScript 7 ist `types` standardmäßig `[]`. Was bedeutet das?"
    options:
      - "Globale Typen wie `process` aus `@types/node` gibt es erst, wenn du `\"types\": [\"node\"]` einträgst."
      - Importierte Pakete wie `import { z } from "zod"` haben dann keine Typen mehr.
      - Installierte `@types`-Pakete werden nicht mehr automatisch global eingebunden.
      - Deklarationsdateien sind in TypeScript 7 verboten.
    answers: [0, 2]
    explanation: "`types` steuert nur, welche `@types`-Pakete **global** eingebunden werden. Typen für Module, die du importierst, findet TypeScript weiterhin über die Modulauflösung."
  - type: find-bug
    question: "Diese Deklarationsdatei beschreibt `export function sum(a, b) { return a + b; }`. Welche Zeile ist falsch?"
    language: ts
    code: |
      // math.d.ts
      export declare function sum(a: number, b: number): number;
      export declare function double(n: number): number {
        return n * 2;
      }
    bug_line: 3
    explanation: In einer `.d.ts`-Datei darf keine Implementierung stehen – nur Signaturen. Der Funktionskörper ist ein Fehler.
tasks:
  - id: typsuche-reihenfolge
    type: order
    title: Wo sucht TypeScript nach Typen?
    description: "Du schreibst `import { debounce } from \"some-lib\";`. Bringe die Orte in die Reihenfolge, in der TypeScript nach Typen sucht."
    items:
      - "Das Feld \"types\" bzw. die types-Bedingung in \"exports\" der package.json von some-lib"
      - "Eine index.d.ts direkt im Paket"
      - "Das Paket @types/some-lib in node_modules"
      - "Nichts gefunden: Fehler TS7016, das Modul hat implizit den Typ any"
  - id: fremdes-js-typisieren
    type: terminal
    title: Eine JavaScript-Bibliothek typisieren
    description: |
      Im Ordner `fremdes-js` liegt unter `vendor/textkit.js` eine kleine JavaScript-Bibliothek ohne Typen.
      `src/main.ts` importiert sie – und `tsc` meldet `TS7016: Could not find a declaration file`.

      1. Lies `vendor/textkit.js` und sieh dir an, welche Exporte es gibt und wie sie benutzt werden.
      2. Lege daneben die Datei `vendor/textkit.d.ts` an und beschreibe alle vier Exporte: `truncate`
         (Text, maximale Länge, optionales Suffix), `wordCount`, die Konstante `VERSION` und den
         Default-Export `capitalize`.
      3. Ändere weder `vendor/textkit.js` noch `src/main.ts`. `npx tsc --noEmit` muss fehlerfrei laufen,
         und `node src/main.ts` funktioniert weiter.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: fremdes-js
    setup: |
      npm init -y >/dev/null
      npm pkg set type=module
      npm install --save-dev --no-audit --no-fund typescript@7.0.2 >/dev/null
      cat > tsconfig.json <<'JSON'
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
      JSON
      mkdir -p src vendor
      cat > vendor/textkit.js <<'JS'
      export const VERSION = "2.1.0";

      export function truncate(text, maxLength, suffix = "…") {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength - suffix.length) + suffix;
      }

      export function wordCount(text) {
        const trimmed = text.trim();
        return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
      }

      export default function capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
      }
      JS
      cat > src/main.ts <<'TS'
      import capitalize, { truncate, VERSION, wordCount } from "../vendor/textkit.js";

      console.log(capitalize("typescript"));
      console.log(truncate("Ein sehr langer Satz", 10));
      console.log(truncate("Kurz", 10, "..."));
      console.log(wordCount("  drei kleine Wörter "));
      console.log(VERSION);

      // Wird nie aufgerufen – prüft nur, dass falsche Aufrufe als Fehler erkannt werden.
      export function typeChecks(): void {
        // @ts-expect-error – truncate braucht eine maximale Länge
        truncate("abc");
        // @ts-expect-error – wordCount liefert eine Zahl
        const words: string = wordCount("a b");
        // @ts-expect-error – capitalize erwartet einen Text
        capitalize(42);
        console.log(words);
      }
      TS
      sha256sum vendor/textkit.js src/main.ts > .original.sha256
    checks:
      - type: command
        run: sha256sum -c --quiet .original.sha256
        message: vendor/textkit.js oder src/main.ts wurde verändert. Lege nur vendor/textkit.d.ts neu an.
      - type: file_exists
        path: vendor/textkit.d.ts
        message: Die Deklarationsdatei vendor/textkit.d.ts fehlt noch.
      - type: command
        run: "! grep -nE '\\bany\\b|@ts-ignore' vendor/textkit.d.ts"
        message: In der Deklarationsdatei steht any. Beschreibe Parameter und Rückgaben genau.
      - type: command
        run: npx tsc --noEmit
        expect_exit: 0
        message: "`npx tsc --noEmit` meldet noch Fehler. Sind alle vier Exporte beschrieben, inklusive des Default-Exports?"
      - type: command
        run: node src/main.ts
        stdout_matches: "^Typescript\\nEin sehr …\\nKurz\\n3\\n2\\.1\\.0$"
        message: "`node src/main.ts` liefert nicht die erwartete Ausgabe. Hast du die JavaScript-Datei verändert?"
    hints:
      - "Eine Deklarationsdatei mit demselben Namen wie die `.js`-Datei (nur `.d.ts`) findet TypeScript automatisch."
      - "Funktionen ohne Körper: `export declare function wordCount(text: string): number;` – Konstanten: `export declare const VERSION: string;`."
      - "Der Default-Export: `export default function capitalize(text: string): string;` – ein optionaler Parameter bekommt ein `?`."
    solution: |
      `vendor/textkit.d.ts`:

      ```ts
      export declare const VERSION: string;
      export declare function truncate(text: string, maxLength: number, suffix?: string): string;
      export declare function wordCount(text: string): number;
      export default function capitalize(text: string): string;
      ```
---
Du installierst ein npm-Paket – und dein Editor kennt sofort jede Funktion samt Parametern. Woher, wenn
das Paket in JavaScript geschrieben ist? Und was tust du, wenn eine alte interne Bibliothek gar keine Typen
mitbringt? Die Antwort heißt [[typdeklaration|Deklarationsdatei]].

## Was ist eine .d.ts-Datei?

Eine Deklarationsdatei endet auf `.d.ts` und enthält **nur Typen**: Signaturen von Funktionen, Klassen,
Konstanten – ohne einen einzigen Funktionskörper. Sie ist wie die Speisekarte eines Restaurants: Sie
beschreibt, was es gibt, kocht aber nichts.

```ts title="math.d.ts beschreibt math.js"
export declare function sum(a: number, b: number): number;
export declare const PI_APPROX: number;
export interface Vector { x: number; y: number }
```

Das [[schluesselwort|Schlüsselwort]] `declare` sagt: „Das existiert zur Laufzeit woanders, ich beschreibe
es nur.“ Bibliotheken, die in TypeScript geschrieben sind, erzeugen ihre `.d.ts`-Dateien beim Build mit
`tsc --declaration` und liefern sie zusammen mit dem JavaScript aus.

> [!MERKSATZ]
> `.ts` = Code mit Typen. `.js` = nur Code. `.d.ts` = nur Typen. Zusammen ergeben `.js` und `.d.ts` ein
> vollständig typisiertes Paket.

## Woher kommen die Typen von npm-Paketen?

Importierst du ein [[paket|Paket]], sucht TypeScript in dieser Reihenfolge:

1. In der package.json des Pakets: das Feld `types` oder die `types`-Bedingung unter `exports`.
2. Eine `index.d.ts` direkt im Paket.
3. Ein separates Paket `@types/<name>` in `node_modules`.

Punkt 3 kommt aus [[definitelytyped|DefinitelyTyped]], einem riesigen Community-Projekt mit Typen für
Pakete, die selbst keine mitliefern:

```bash title="Terminal"
npm install --save-dev @types/node
```

Findet TypeScript gar nichts, meldet es mit `strict` den Fehler `TS7016: Could not find a declaration file
for module …`. Ohne `strict` wäre das Modul stillschweigend `any`.

## @types/node und die Option types

Manche Typen sind **global**: `process`, `Buffer` oder `__dirname` aus Node.js stehen nirgends im Import.
Solche globalen Typen bindet die Option `types` in der tsconfig.json ein.

```json title="tsconfig.json für ein Node.js-Projekt"
{
  "compilerOptions": {
    "types": ["node"]
  }
}
```

In TypeScript 7 ist `types` standardmäßig `[]`: Installierte `@types`-Pakete landen **nicht** mehr
automatisch global im Projekt. Das macht die Prüfung schneller und verhindert, dass Node-Typen
versehentlich in Browser-Code auftauchen. Typen für Module, die du **importierst**, findet TypeScript davon
unabhängig über die Modulauflösung.

> [!FEHLER]
> `Cannot find name 'process'` trotz installiertem `@types/node`? Dann fehlt `"types": ["node"]` in der
> tsconfig.json – in TypeScript 7 ein sehr häufiger Stolperstein.

## Eigene Deklarationen für fremdes JavaScript

Hat eine Bibliothek keine Typen, schreibst du sie selbst. Liegt die `.js`-Datei in deinem Projekt, legst
du direkt daneben eine gleichnamige `.d.ts` an – TypeScript findet sie automatisch:

```text title="Projektstruktur"
vendor/
├── textkit.js      ← fremder Code, bleibt unverändert
└── textkit.d.ts    ← deine Typen dafür
```

Für ein npm-Paket ohne Typen beschreibst du das Modul in einer eigenen Datei, etwa
`types/legacy-charts.d.ts`, die zu `include` gehört:

```ts title="Ein ganzes Modul deklarieren"
declare module "legacy-charts" {
  export interface ChartOptions { width: number; height: number; title?: string }
  export function render(el: HTMLElement, options: ChartOptions): void;
}
```

Die Notlösung `declare module "legacy-charts";` ohne Inhalt macht den Fehler weg – aber alles aus dem Modul
ist dann `any`. Nutze sie höchstens als Übergang.

> [!PRAXIS]
> Bei der Migration großer JavaScript-Projekte schreiben Teams zuerst `.d.ts`-Dateien für die
> meistgenutzten internen Module. So profitiert neuer TypeScript-Code sofort, ohne dass der alte Code
> umgeschrieben werden muss. Alternativ prüft TypeScript mit `allowJs` und `checkJs` auch
> JavaScript-Dateien, deren Typen in [[jsdoc|JSDoc]]-Kommentaren stehen.

## Zusammenfassung

- `.d.ts`-Dateien enthalten nur Typen und beschreiben Code, der woanders liegt.
- TypeScript sucht Typen im Paket selbst (`types`, `exports`, `index.d.ts`) und dann in `@types/<name>`.
- `@types`-Pakete stammen aus DefinitelyTyped und werden als Dev-Dependency installiert.
- In TypeScript 7 ist `types` standardmäßig leer – globale Typen wie `@types/node` trägst du ein.
- Für eigenes JavaScript legst du eine gleichnamige `.d.ts` daneben, für Pakete `declare module "name"`.
- `declare module "x";` ohne Inhalt ist nur eine Notlösung, weil alles `any` wird.
