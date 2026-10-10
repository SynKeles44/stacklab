---
title: Generics
summary: Typparameter machen Funktionen und Typen wiederverwendbar, ohne Typinformation zu verlieren – mit Constraints und Standardwerten.
duration: 25
sources:
  - title: TypeScript Handbook – Generics
    url: https://www.typescriptlang.org/docs/handbook/2/generics.html
  - title: TypeScript Handbook – Generic Constraints
    url: https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints
  - title: TypeScript Handbook – Guidelines for Writing Good Generic Functions
    url: https://www.typescriptlang.org/docs/handbook/2/functions.html#guidelines-for-writing-good-generic-functions
quiz:
  - type: single
    question: "Welchen Typ hat `x` in `const x = first([\"a\", \"b\"]);`, wenn `first` als `function first<T>(items: T[]): T | undefined` deklariert ist?"
    options:
      - "`any`"
      - "`string | undefined`"
      - "`unknown`"
    answer: 1
    explanation: TypeScript inferiert `T = string` aus dem Argument. Der Rückgabetyp wird damit zu `string | undefined`.
  - type: find-bug
    question: In welcher Zeile meldet TypeScript einen Fehler?
    language: ts
    code: |
      function longest<T extends { length: number }>(a: T, b: T): T {
        return b.length > a.length ? b : a;
      }
      longest("Haus", "Garten");
      longest([1, 2], [3]);
      longest(10, 20);
    bug_line: 6
    explanation: Der Constraint verlangt eine Eigenschaft `length`. Texte und Arrays haben sie, Zahlen nicht.
  - type: cloze
    text: "In `function get<T, K ___ keyof T>(obj: T, key: K)` darf `key` nur ein Schlüssel von `obj` sein. Mit `type Box<T = ___> = { value: T }` ist `Box` ohne Angabe eine Box für Texte."
    blanks:
      - [extends]
      - [string]
    explanation: "`extends` schränkt einen Typparameter ein. `= string` legt einen Standard-Typparameter fest."
  - type: multiple
    question: Welche Funktionen profitieren wirklich von einem Typparameter?
    options:
      - "`identity<T>(value: T): T`"
      - "`log<T>(message: T): void` – gibt den Wert nur aus"
      - "`last<T>(items: T[]): T | undefined`"
      - "`len<T extends string>(text: T): number`"
    answers: [0, 2]
    explanation: Ein Typparameter lohnt sich, wenn er **zwei** Stellen verbindet, meist Eingabe und Ausgabe. Bei `log` und `len` taucht T nur einmal auf – `unknown` bzw. `string` wären einfacher.
tasks:
  - id: group-by
    type: code
    language: ts
    title: Eine generische groupBy-Funktion
    description: |
      Schreibe zwei generische Hilfsfunktionen, die für **jeden** Elementtyp funktionieren:

      1. `groupBy(items, getKey)` gruppiert die Elemente nach dem Schlüssel, den `getKey` liefert. Ergebnis:
         ein Objekt von Schlüssel zu Array der Elemente (Reihenfolge wie in der Eingabe).
      2. `countBy(items, getKey)` zählt, wie viele Elemente je Schlüssel vorkommen.

      Benutze einen Typparameter `T` statt `any`.
    starter: |
      function groupBy<T>(items: T[], getKey: (item: T) => string): Record<string, T[]> {
        return {};
      }

      function countBy<T>(items: T[], getKey: (item: T) => string): Record<string, number> {
        return {};
      }
    tests:
      - name: gruppiert Objekte nach einer Eigenschaft
        code: |
          const people = [{ name: "Ada", team: "core" }, { name: "Grace", team: "web" }, { name: "Linus", team: "core" }];
          assertDeepEqual(groupBy(people, (p) => p.team), {
            core: [{ name: "Ada", team: "core" }, { name: "Linus", team: "core" }],
            web: [{ name: "Grace", team: "web" }],
          });
      - name: leere Liste ergibt leeres Objekt
        code: assertDeepEqual(groupBy([], (x) => String(x)), {})
      - name: funktioniert auch mit Texten
        code: |
          assertDeepEqual(groupBy(["apfel", "birne", "aprikose"], (w) => w[0] ?? ""), { a: ["apfel", "aprikose"], b: ["birne"] })
      - name: countBy zählt pro Schlüssel
        code: |
          assertDeepEqual(countBy([1, 2, 3, 4, 5], (n) => (n % 2 === 0 ? "gerade" : "ungerade")), { ungerade: 3, gerade: 2 })
    solution: |
      function groupBy<T>(items: T[], getKey: (item: T) => string): Record<string, T[]> {
        const groups: Record<string, T[]> = {};
        for (const item of items) {
          const key = getKey(item);
          (groups[key] ??= []).push(item);
        }
        return groups;
      }

      function countBy<T>(items: T[], getKey: (item: T) => string): Record<string, number> {
        const counts: Record<string, number> = {};
        for (const item of items) {
          const key = getKey(item);
          counts[key] = (counts[key] ?? 0) + 1;
        }
        return counts;
      }
    hints:
      - "`groups[key] ??= []` legt das Array nur an, wenn es noch nicht existiert."
      - "`countBy` kannst du auch mit `groupBy` bauen: Zähle danach die Länge jedes Arrays."
  - id: generische-signaturen
    type: terminal
    title: Generische Signaturen schreiben
    description: |
      Im Ordner `generische-signaturen` liegt `src/generic.ts`. Die Funktionen funktionieren, sind aber
      voller `any` – deshalb erkennt `tsc` in `src/usage.ts` keinen der absichtlichen Fehler, und jede
      `// @ts-expect-error`-Zeile wird als „unused“ gemeldet.

      Ersetze jedes `any` durch Generics:

      1. `first(items)` liefert das erste Element oder `undefined`.
      2. `longest(a, b)` nimmt zwei Werte desselben Typs mit `length` und liefert den längeren.
      3. `pluck(items, key)` liefert für jedes Objekt den Wert unter `key` – `key` muss ein Schlüssel der
         Objekte sein (Tipp: `K extends keyof T`, Ergebnis `T[K][]`).
      4. `ApiResponse<T>` ist entweder `{ ok: true; data: T }` oder `{ ok: false; error: string }`. Ohne
         Angabe soll `T` den Standard `unknown` haben.
      5. `wrap(data)` liefert eine erfolgreiche `ApiResponse` mit dem Typ von `data`.

      Danach muss `npx tsc --noEmit` fehlerfrei sein. Ändere `src/usage.ts` nicht.
      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: generische-signaturen
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
      cat > src/generic.ts <<'TS'
      export type ApiResponse = any;

      export function first(items: any[]): any {
        return items[0];
      }

      export function longest(a: any, b: any): any {
        return b.length > a.length ? b : a;
      }

      export function pluck(items: any[], key: any): any[] {
        return items.map((item) => item[key]);
      }

      export function wrap(data: any): any {
        return { ok: true, data };
      }
      TS
      cat > src/usage.ts <<'TS'
      import { first, longest, pluck, wrap } from "./generic.ts";
      import type { ApiResponse } from "./generic.ts";

      const maybeNumber: number | undefined = first([1, 2, 3]);
      const word: string = longest("Haus", "Garten");
      const list: number[] = longest([1, 2], [3]);
      const names: string[] = pluck([{ name: "Ada", age: 36 }], "name");
      const ages: number[] = pluck([{ name: "Ada", age: 36 }], "age");
      const loaded: ApiResponse<string[]> = { ok: true, data: ["a", "b"] };
      const failed: ApiResponse = { ok: false, error: "Netzwerkfehler" };
      const anything: ApiResponse = { ok: true, data: 42 };
      const wrapped: ApiResponse<number> = wrap(5);

      // @ts-expect-error – first kann undefined liefern
      const sure: number = first([1]);
      // @ts-expect-error – Zahlen haben kein length
      longest(1, 2);
      // @ts-expect-error – "email" ist kein Schlüssel der Objekte
      pluck([{ name: "Ada" }], "email");
      // @ts-expect-error – data muss zum Typparameter passen
      const wrongData: ApiResponse<string> = { ok: true, data: 42 };
      // @ts-expect-error – ein Fehler braucht einen Text in error
      const wrongError: ApiResponse = { ok: false };

      export { maybeNumber, word, list, names, ages, loaded, failed, anything, wrapped, sure, wrongData, wrongError };
      TS
      sha256sum src/usage.ts > .usage.sha256
    checks:
      - type: command
        run: sha256sum -c --quiet .usage.sha256
        message: src/usage.ts wurde verändert. Ändere nur src/generic.ts.
      - type: command
        run: "! grep -nE '\\bany\\b|@ts-ignore' src/generic.ts"
        message: In src/generic.ts steht noch any. Ersetze es durch Typparameter.
      - type: command
        run: npx tsc --noEmit
        expect_exit: 0
        message: "`npx tsc --noEmit` meldet noch Fehler. Ein „Unused '@ts-expect-error'“ heißt: Deine Signatur ist an dieser Stelle zu großzügig."
      - type: command
        run: |
          node --input-type=module -e 'const m = await import("./src/generic.ts"); console.log(m.first([]), m.longest("ab", "abc"), m.pluck([{ a: 1 }, { a: 2 }], "a").join("+"), JSON.stringify(m.wrap(5)));'
        stdout_equals: 'undefined abc 1+2 {"ok":true,"data":5}'
        message: Das Verhalten der Funktionen hat sich verändert. Ersetze nur die Typen, nicht die Logik.
    hints:
      - "Beginne mit `export function first<T>(items: T[]): T | undefined`."
      - "Constraint für longest: `<T extends { length: number }>(a: T, b: T): T`."
      - "`export type ApiResponse<T = unknown> = { ok: true; data: T } | { ok: false; error: string };` und `wrap<T>(data: T): ApiResponse<T>`."
    solution: |
      ```ts
      export type ApiResponse<T = unknown> =
        | { ok: true; data: T }
        | { ok: false; error: string };

      export function first<T>(items: T[]): T | undefined {
        return items[0];
      }

      export function longest<T extends { length: number }>(a: T, b: T): T {
        return b.length > a.length ? b : a;
      }

      export function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
        return items.map((item) => item[key]);
      }

      export function wrap<T>(data: T): ApiResponse<T> {
        return { ok: true, data };
      }
      ```
---
Du schreibst `first(list)`, die das erste Element einer Liste liefert. Mit `items: number[]` geht sie nur
für Zahlen, mit `any[]` geht sie für alles – aber dann weiß TypeScript nicht mehr, was herauskommt. Du
willst beides: eine Funktion für jeden Typ **und** volle Typinformation. Genau dafür gibt es
[[generics|Generics]].

## Typparameter: Typen als Variablen

Ein [[typparameter|Typparameter]] ist ein Platzhalter für einen Typ, den erst der Aufruf festlegt. Er
steht in spitzen Klammern hinter dem Funktionsnamen, meist mit einem Großbuchstaben wie `T`:

```ts title="any verliert Information, T behält sie"
function firstAny(items: any[]): any {
  return items[0];
}
function first<T>(items: T[]): T | undefined {
  return items[0];
}

const a = firstAny(["x"]);  // any – Tippfehler bleiben unentdeckt
const b = first(["x"]);     // string | undefined
const c = first([1, 2]);    // number | undefined
```

Wie ein Formular mit Lücke: `T` ist die Lücke, und bei jedem Aufruf trägt TypeScript den passenden Typ ein.
Meist musst du ihn nicht selbst angeben – er wird aus den Argumenten inferiert. Ausdrücklich geht es auch:
`first<string>([])`.

> [!MERKSATZ]
> Ein Typparameter **verbindet** Typen: „Was hineingeht, bestimmt, was herauskommt.“

## Constraints: Anforderungen an T

Ohne Einschränkung weiß TypeScript über `T` gar nichts – du darfst also auch nichts damit machen. Mit
`extends` legst du fest, was `T` mindestens können muss. Das ist ein [[typ-constraint|Constraint]].

```ts title="T muss eine length haben"
function longest<T extends { length: number }>(a: T, b: T): T {
  return b.length > a.length ? b : a;
}

longest("Haus", "Garten");  // ok – Texte haben length
longest([1, 2], [3]);       // ok – Arrays auch
longest(10, 20);            // error: 'number' is not assignable to parameter of type '{ length: number; }'
```

Ein besonders häufiger Constraint ist `K extends keyof T`: `K` darf nur ein Schlüssel von `T` sein.

```ts title="Nur echte Schlüssel erlaubt"
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
const user = { name: "Ada", age: 36 };
getProperty(user, "age");    // number
getProperty(user, "email");  // error: '"email"' is not assignable to parameter of type '"name" | "age"'
```

`keyof` und `T[K]` schauen wir uns in der nächsten Lektion genauer an.

## Generische Typen und Standardwerte

Nicht nur Funktionen, auch Type Aliases, Interfaces und Klassen können Typparameter haben. Du kennst das
schon: `Array<string>`, `Record<string, number>` und `Promise<User>` sind generische Typen.

```ts title="Ein eigener generischer Typ"
type ApiResponse<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const users: ApiResponse<string[]> = { ok: true, data: ["Ada", "Grace"] };
const failed: ApiResponse = { ok: false, error: "Timeout" };  // T = unknown

interface Box<T> {
  value: T;
}
```

`T = unknown` ist ein Standard-Typparameter: Gibt niemand einen Typ an, gilt `unknown`. Das ist sicherer
als `any`, weil Nutzer der Daten erst prüfen müssen, was drinsteckt.

> [!PRAXIS]
> API-Clients sind fast immer generisch: `async function getJson<T>(url: string): Promise<T>`. Achtung –
> das ist ein Versprechen ohne Prüfung. Ob die Antwort wirklich `T` ist, weiß erst eine
> Laufzeitvalidierung wie Zod.

## Gute und unnötige Generics

Generics sind mächtig, werden aber gern übertrieben. Das TypeScript-Handbuch gibt eine einfache Regel:
Ein Typparameter sollte **mindestens zweimal** vorkommen – sonst verbindet er nichts.

| Signatur | Urteil |
|---|---|
| `identity<T>(value: T): T` | gut: Eingabe und Ausgabe verbunden |
| `log<T>(message: T): void` | unnötig: `message: unknown` reicht |
| `len<T extends string>(s: T): number` | unnötig: `s: string` reicht |
| `pluck<T, K extends keyof T>(items: T[], key: K): T[K][]` | gut: Schlüssel und Ergebnis passen zusammen |

> [!FEHLER]
> `function parse<T>(json: string): T` sieht typsicher aus, ist aber nur eine versteckte Typbehauptung:
> Der Aufrufer kann sich jedes `T` wünschen, geprüft wird nichts.

## Zusammenfassung

- **Generics** machen Funktionen und Typen wiederverwendbar, ohne Typinformation zu verlieren.
- Typparameter wie `T` werden meist aus den Argumenten **inferiert**.
- **Constraints** (`T extends …`) legen fest, was ein Typparameter können muss.
- `K extends keyof T` erlaubt nur echte Schlüssel eines Objekttyps.
- Typen, Interfaces und Klassen können generisch sein; `<T = unknown>` setzt einen Standard.
- Ein Typparameter sollte mindestens zwei Stellen verbinden – sonst ist er überflüssig.
