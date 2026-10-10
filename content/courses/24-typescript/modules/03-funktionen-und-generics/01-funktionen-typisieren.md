---
title: Funktionen typisieren
summary: Parameter, optionale und Rest-Parameter, Rückgabetypen, Funktionstypen für Callbacks und ein kurzer Blick auf Überladungen.
duration: 20
sources:
  - title: TypeScript Handbook – More on Functions
    url: https://www.typescriptlang.org/docs/handbook/2/functions.html
  - title: TypeScript Handbook – Function Overloads
    url: https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads
quiz:
  - type: single
    question: "Was bedeutet `(item: string, index: number) => void` als Typ eines Parameters?"
    options:
      - Eine Funktion, die einen Text und eine Zahl bekommt und deren Rückgabewert egal ist.
      - Eine Funktion, die `undefined` zurückgeben muss, sonst gibt es einen Fehler.
      - Ein Objekt mit den Eigenschaften item und index.
    answer: 0
    explanation: Das ist ein Funktionstyp. `void` als Rückgabe eines Callbacks heißt „wird nicht benutzt“ – du darfst also auch eine Funktion übergeben, die etwas zurückgibt.
  - type: cloze
    text: "`function greet(name: string, greeting___: string)` macht den zweiten Parameter optional. Mit `...values: ___[]` nimmst du beliebig viele Zahlen entgegen."
    blanks:
      - ["?"]
      - [number]
    explanation: Ein `?` hinter dem Namen macht den Parameter optional (Typ dann `string | undefined`). Rest-Parameter sind immer Arrays.
  - type: find-bug
    question: In welcher Zeile meldet TypeScript einen Fehler?
    language: ts
    code: |
      function formatPrice(cents: number, currency = "EUR"): string {
        return `${(cents / 100).toFixed(2)} ${currency}`;
      }
      formatPrice(1999);
      formatPrice(1999, "USD");
      formatPrice("1999");
    bug_line: 6
    explanation: "`cents` muss eine Zahl sein. `currency` hat einen Standardwert und ist deshalb optional; sein Typ `string` wird daraus inferiert."
  - type: multiple
    question: Welche Aussagen über Funktionsüberladungen (Overloads) stimmen?
    options:
      - Mehrere Signaturen beschreiben verschiedene erlaubte Aufrufformen.
      - Es gibt nur eine einzige Implementierung.
      - Jede Überladung bekommt ihren eigenen Funktionskörper.
      - Oft reicht statt Überladungen ein Union-Typ.
    answers: [0, 1, 3]
    explanation: Überladungen sind nur Signaturen ohne Körper, gefolgt von genau einer Implementierung. Wenn der Rückgabetyp nicht vom Eingabetyp abhängt, ist ein Union-Parameter einfacher.
tasks:
  - id: signaturen-nachruesten
    type: terminal
    title: Signaturen nachrüsten
    description: |
      Im Ordner `signaturen-nachruesten` liegt `src/utils.ts` mit vier Hilfsfunktionen – noch ganz ohne
      Typen. Mit `strict` meldet `tsc` deshalb lauter implizite `any`. `src/usage.ts` zeigt, wie die
      Funktionen benutzt werden sollen. Die Zeilen mit `// @ts-expect-error` **müssen** Fehler auslösen.

      1. Gib allen Parametern in `src/utils.ts` passende Typen. `separator` von `slugify` bleibt optional
         (Standard `"-"`), `average` nimmt beliebig viele Zahlen.
      2. `onEach` bekommt eine Liste von Texten und einen Callback `(item, index)`. Beschreibe den Callback
         mit einem Funktionstyp.
      3. Ergänze Rückgabetypen. `average` liefert bei keiner Zahl `undefined`.
      4. Verändere weder das Verhalten der Funktionen noch `src/usage.ts`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: signaturen-nachruesten
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
      mkdir -p src
      cat > src/utils.ts <<'TS'
      export function slugify(text, separator = "-") {
        return text.trim().toLowerCase().split(/\s+/).join(separator);
      }

      export function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
      }

      export function onEach(items, callback) {
        items.forEach((item, index) => callback(item, index));
      }

      export function average(...values) {
        if (values.length === 0) return undefined;
        return values.reduce((sum, value) => sum + value, 0) / values.length;
      }
      TS
      cat > src/usage.ts <<'TS'
      import { average, clamp, onEach, slugify } from "./utils.ts";

      const slug: string = slugify("Hallo Welt");
      const underscored: string = slugify("Hallo Welt", "_");
      const limited: number = clamp(15, 0, 10);
      const mean: number | undefined = average(1, 2, 3);
      onEach(["a", "b"], (item, index) => console.log(item.toUpperCase(), index.toFixed(0)));

      // @ts-expect-error – clamp braucht drei Zahlen
      clamp(5, 0);
      // @ts-expect-error – slugify erwartet einen Text
      slugify(42);
      // @ts-expect-error – average kann undefined liefern
      const sure: number = average(1, 2);
      // @ts-expect-error – der Callback bekommt Texte, keine Zahlen
      onEach(["a"], (item: number) => item);

      export { slug, underscored, limited, mean, sure };
      TS
      sha256sum src/usage.ts > .usage.sha256
    checks:
      - type: command
        run: sha256sum -c --quiet .usage.sha256
        message: src/usage.ts wurde verändert. Ändere nur src/utils.ts.
      - type: command
        run: "! grep -nE '\\bany\\b|@ts-ignore' src/utils.ts"
        message: In src/utils.ts steht noch any oder @ts-ignore. Gib echte Typen an.
      - type: command
        run: npx tsc --noEmit
        expect_exit: 0
        message: "`npx tsc --noEmit` meldet noch Fehler. Fehlen Parametertypen, oder ist ein Typ zu großzügig (Unused '@ts-expect-error')?"
      - type: command
        run: |
          node --input-type=module -e 'const m = await import("./src/utils.ts"); console.log(m.slugify("  Hallo Welt "), m.slugify("a b", "_"), m.clamp(15, 0, 10), m.average(2, 4), m.average());'
        stdout_equals: "hallo-welt a_b 10 3 undefined"
        message: Das Verhalten der Funktionen hat sich verändert. Ergänze nur Typen, ändere die Logik nicht.
    hints:
      - "Ein optionaler Parameter mit Standardwert braucht kein `?`: `separator: string = \"-\"` oder einfach `separator = \"-\"`."
      - "Rest-Parameter sind Arrays: `...values: number[]`. Der Rückgabetyp lautet `number | undefined`."
      - "Der Callback-Typ: `callback: (item: string, index: number) => void`."
    solution: |
      ```ts
      export function slugify(text: string, separator: string = "-"): string {
        return text.trim().toLowerCase().split(/\s+/).join(separator);
      }

      export function clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
      }

      export function onEach(items: string[], callback: (item: string, index: number) => void): void {
        items.forEach((item, index) => callback(item, index));
      }

      export function average(...values: number[]): number | undefined {
        if (values.length === 0) return undefined;
        return values.reduce((sum, value) => sum + value, 0) / values.length;
      }
      ```
  - id: funktionen-bauen
    type: code
    language: ts
    title: Funktionen mit Rest-Parametern und Callbacks
    description: |
      Schreibe drei kleine Funktionen mit vollständigen Typen:

      1. `sum(...numbers)` addiert beliebig viele Zahlen (ohne Zahl: `0`).
      2. `greet(name, greeting?)` liefert `"Hallo, Ada!"` – oder mit eigenem Gruß `"Moin, Ada!"`.
      3. `mapValues(record, fn)` wendet `fn(value, key)` auf jeden Wert eines `Record<string, number>` an
         und liefert ein neues Objekt mit denselben Schlüsseln.
    starter: |
      function sum(...numbers: number[]): number {
        return 0;
      }

      function greet(name: string, greeting?: string): string {
        return "";
      }

      function mapValues(
        record: Record<string, number>,
        fn: (value: number, key: string) => number,
      ): Record<string, number> {
        return {};
      }
    tests:
      - name: sum addiert beliebig viele Zahlen
        code: assertEqual(sum(1, 2, 3, 4), 10)
      - name: sum ohne Argumente ist 0
        code: assertEqual(sum(), 0)
      - name: greet mit und ohne Gruß
        code: assertDeepEqual([greet("Ada"), greet("Ada", "Moin")], ["Hallo, Ada!", "Moin, Ada!"])
      - name: mapValues verdoppelt alle Werte
        code: |
          assertDeepEqual(mapValues({ a: 1, b: 2 }, (v) => v * 2), { a: 2, b: 4 })
      - name: mapValues reicht den Schlüssel durch und lässt das Original unverändert
        code: |
          const original = { x: 1 };
          assertDeepEqual(mapValues(original, (v, k) => v + k.length), { x: 2 });
          assertDeepEqual(original, { x: 1 });
    solution: |
      function sum(...numbers: number[]): number {
        return numbers.reduce((total, n) => total + n, 0);
      }

      function greet(name: string, greeting: string = "Hallo"): string {
        return `${greeting}, ${name}!`;
      }

      function mapValues(
        record: Record<string, number>,
        fn: (value: number, key: string) => number,
      ): Record<string, number> {
        const result: Record<string, number> = {};
        for (const [key, value] of Object.entries(record)) {
          result[key] = fn(value, key);
        }
        return result;
      }
    hints:
      - "`numbers.reduce((total, n) => total + n, 0)` liefert bei einem leeren Array 0."
      - "`Object.entries(record)` liefert Paare `[key, value]`, die du in ein neues Objekt schreibst."
---
Eine Funktion ist ein Vertrag: „Gib mir das, dann bekommst du jenes.“ In JavaScript steht dieser Vertrag
höchstens in einem Kommentar. In TypeScript steht er in der **Signatur** – und `tsc` prüft jeden einzelnen
Aufruf im Projekt dagegen.

## Parameter und Rückgabetypen

Jeder [[parameter|Parameter]] bekommt einen Typ, der [[rueckgabewert|Rückgabewert]] steht hinter der
Klammer:

```ts title="Eine vollständig typisierte Funktion"
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

const discount = (price: number): number => price * 0.9;   // Arrow Function
```

Den Rückgabetyp könnte TypeScript inferieren. Schreibst du ihn hin, wird er zur Absicherung: Gibst du in
einem Zweig versehentlich `undefined` zurück, meldet `tsc` das an der Funktion – nicht erst beim Aufrufer.

Gibt eine Funktion nichts zurück, ist ihr Rückgabetyp [[void-typ|void]]. Endet sie nie normal (wirft immer), ist er
`never` – das kennst du von `assertNever`.

> [!MERKSATZ]
> Exportierte Funktionen bekommen immer Parametertypen und am besten auch einen Rückgabetyp. Das ist die
> Dokumentation, die nie veraltet.

## Optionale, Standard- und Rest-Parameter

```ts title="Flexible Parameterlisten"
function greet(name: string, greeting?: string): string {
  return `${greeting ?? "Hallo"}, ${name}!`;   // greeting: string | undefined
}

function formatPrice(cents: number, currency = "EUR"): string {
  return `${(cents / 100).toFixed(2)} ${currency}`;  // currency: string
}

function sum(...numbers: number[]): number {
  return numbers.reduce((total, n) => total + n, 0);
}

sum();          // 0
sum(1, 2, 3);   // 6
```

| Schreibweise | Bedeutung |
|---|---|
| `greeting?: string` | darf fehlen, im Körper ist der Typ `string` oder `undefined` |
| `currency = "EUR"` | darf fehlen, Typ aus dem Standardwert |
| `...numbers: number[]` | beliebig viele Argumente, im Körper ein Array |

Ein [[rest-parameter|Rest-Parameter]] sammelt alle übrigen Argumente in einem Array. Er muss immer an letzter Stelle stehen.

Bei [[destrukturierung|destrukturierten]] Parametern steht der Typ hinter dem ganzen Muster:
`function show({ name, age }: { name: string; age: number })`.

> [!FEHLER]
> `function show({ name: string })` sieht aus wie eine Typangabe, ist aber Destrukturierung mit
> Umbenennung: Die Variable heißt danach `string`! Der Typ gehört hinter die schließende Klammer.

## Funktionstypen für Callbacks

Auch Funktionen haben einen Typ. Ein Funktionstyp sieht aus wie eine
[[arrow-function|Arrow Function]] ohne Körper:

```ts title="Callbacks beschreiben"
type Handler = (event: string, payload: number) => void;

function onEach(items: string[], callback: (item: string, index: number) => void): void {
  items.forEach((item, index) => callback(item, index));
}

onEach(["a", "b"], (item, index) => console.log(item.toUpperCase(), index));
//                  ^ item: string, index: number – ohne Annotation
```

Der [[callback|Callback]] im Aufruf braucht keine eigenen Typen: TypeScript leitet sie aus dem Funktionstyp
ab. `void` als Rückgabetyp eines Callbacks heißt „das Ergebnis wird ignoriert“. Deshalb darfst du auch
`(item) => list.push(item)` übergeben, obwohl `push` eine Zahl zurückgibt.

> [!PRAXIS]
> Event-Handler, `map`/`filter`-Callbacks und Middleware-Funktionen sind überall Funktionstypen. In
> React schreibst du etwa `onSelect: (id: string) => void` als Eigenschaft einer Komponente.

## Überladungen – kurz erklärt

Manchmal hängt der Rückgabetyp vom Eingabetyp ab. Dafür gibt es
[[funktionsueberladung|Überladungen]]: mehrere Signaturen ohne Körper, gefolgt von **einer**
Implementierung.

```ts title="Overloads"
function parse(value: string): number;
function parse(value: string[]): number[];
function parse(value: string | string[]): number | number[] {
  return Array.isArray(value) ? value.map(Number) : Number(value);
}

const one = parse("4");          // number
const many = parse(["1", "2"]);  // number[]
```

Von außen sind nur die ersten beiden Signaturen sichtbar. Überladungen sind selten nötig: Oft reicht ein
Union-Parameter, und für „Ausgabe hängt von der Eingabe ab“ sind Generics meist eleganter. Die lernst du
in der nächsten Lektion.

## Zusammenfassung

- Parameter bekommen immer Typen; Rückgabetypen machen Fehler direkt an der Funktion sichtbar.
- `void` heißt „kein sinnvoller Rückgabewert“, `never` „kehrt nie normal zurück“.
- Optionale Parameter mit `?`, Standardwerte mit `=`, Rest-Parameter mit `...name: T[]`.
- Funktionstypen wie `(item: string) => void` beschreiben Callbacks; die Callback-Parameter werden inferiert.
- Überladungen beschreiben mehrere Aufrufformen mit einer Implementierung – sparsam einsetzen.
