---
title: Typen aus Typen ableiten
summary: Mit keyof, typeof, Indexed Access und Utility Types wie Partial, Pick, Omit, Record, ReturnType und Awaited baust du neue Typen aus vorhandenen – plus ein erster Blick auf Mapped und Conditional Types.
duration: 25
sources:
  - title: TypeScript Handbook – Creating Types from Types
    url: https://www.typescriptlang.org/docs/handbook/2/types-from-types.html
  - title: TypeScript Handbook – Utility Types
    url: https://www.typescriptlang.org/docs/handbook/utility-types.html
  - title: TypeScript Handbook – Mapped Types
    url: https://www.typescriptlang.org/docs/handbook/2/mapped-types.html
  - title: TypeScript Handbook – Conditional Types
    url: https://www.typescriptlang.org/docs/handbook/2/conditional-types.html
quiz:
  - type: match
    question: 'Ordne jedem Ausdruck sein Ergebnis zu. Gegeben ist `type User = { id: number; name: string }`.'
    pairs:
      - { left: "keyof User", right: "\"id\" | \"name\"" }
      - { left: "User[\"name\"]", right: "string" }
      - { left: "Partial<User>", right: "{ id?: number; name?: string }" }
      - { left: "Pick<User, \"id\">", right: "{ id: number }" }
    explanation: "`keyof` liefert die Schlüssel als Union, `T[K]` den Typ einer Eigenschaft. Partial macht alles optional, Pick wählt Eigenschaften aus."
  - type: single
    question: "`async function load(): Promise<User[]>` – welcher Typ ergibt `User[]`?"
    options:
      - "`ReturnType<typeof load>`"
      - "`Awaited<ReturnType<typeof load>>`"
      - "`typeof load`"
    answer: 1
    explanation: "`ReturnType` liefert `Promise<User[]>`, `Awaited` packt das Promise aus. `typeof load` ist der Funktionstyp selbst."
  - type: find-bug
    question: In welcher Zeile meldet TypeScript einen Fehler?
    language: ts
    code: |
      const config = { port: 3000, host: "localhost" };
      type Config = typeof config;
      type Key = keyof Config;
      const key: Key = "port";
      const other: Key = "timeout";
    bug_line: 5
    explanation: "`typeof config` übernimmt den Typ des Objekts, `keyof` liefert `\"port\" | \"host\"`. `\"timeout\"` gehört nicht dazu."
  - type: cloze
    text: "Der Mapped Type `{ [K in ___ T]: boolean }` macht aus jeder Eigenschaft von T einen Wahrheitswert. Der Conditional Type `T ___ string ? \"Text\" : \"anderes\"` verzweigt auf Typebene."
    blanks:
      - [keyof]
      - [extends]
    explanation: Mapped Types laufen über alle Schlüssel (`K in keyof T`). Conditional Types nutzen `extends` als Bedingung wie einen ternären Operator.
tasks:
  - id: utility-zuordnen
    type: dragdrop
    title: Welcher Utility Type liefert das?
    description: "Gegeben ist `interface User { id: number; name: string; email?: string }` und `async function getUser(): Promise<User>`. Ordne jedes Ergebnis dem Ausdruck zu, der es erzeugt."
    targets:
      - { id: partial, label: "{ id?: number; name?: string; email?: string }" }
      - { id: required, label: "{ id: number; name: string; email: string }" }
      - { id: omit, label: "{ name: string; email?: string }" }
      - { id: record, label: "{ admin: User; guest: User }" }
      - { id: awaited, label: "User" }
    items:
      - { label: "Partial<User>", target: partial }
      - { label: "Required<User>", target: required }
      - { label: "Omit<User, \"id\">", target: omit }
      - { label: "Record<\"admin\" | \"guest\", User>", target: record }
      - { label: "Awaited<ReturnType<typeof getUser>>", target: awaited }
  - id: typen-ableiten
    type: terminal
    title: Typen ableiten statt abschreiben
    description: |
      Im Ordner `typen-ableiten` beschreibt `src/types.ts` einen `User` und die Funktion `loadUser`.
      `src/usage.ts` braucht sechs weitere Typen aus `src/derived.ts`. Schreibe sie dort – aber **leite
      sie ab**, statt Eigenschaften abzutippen. Ändert sich `User`, sollen alle mitwandern.

      1. `UserPreview`: nur `id` und `name` eines Users.
      2. `NewUser`: ein User ohne `id` und `createdAt`.
      3. `UserUpdate`: wie `NewUser`, aber alle Felder optional.
      4. `UserRole`: der Typ der Eigenschaft `role`.
      5. `LoadedUser`: der Typ, den `await loadUser(…)` liefert – aus der Funktion abgeleitet.
      6. `ChangedFields`: für jedes Feld von `NewUser` ein `boolean` (Mapped Type oder `Record`).

      In `src/derived.ts` dürfen keine Eigenschaften wie `name: string` und keine Rollennamen stehen.
      Ändere `src/usage.ts` und `src/types.ts` nicht. Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: typen-ableiten
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
      cat > src/types.ts <<'TS'
      export interface User {
        id: number;
        name: string;
        email: string;
        role: "admin" | "editor" | "viewer";
        createdAt: string;
      }

      export async function loadUser(id: number): Promise<User> {
        return { id, name: "Ada", email: "ada@example.com", role: "admin", createdAt: "2026-10-01" };
      }
      TS
      printf '// Leite hier die Typen aus User und loadUser ab.\nexport {};\n' > src/derived.ts
      cat > src/usage.ts <<'TS'
      import { loadUser } from "./types.ts";
      import type { ChangedFields, LoadedUser, NewUser, UserPreview, UserRole, UserUpdate } from "./derived.ts";

      const preview: UserPreview = { id: 1, name: "Ada" };
      const draft: NewUser = { name: "Grace", email: "grace@example.com", role: "editor" };
      const patch: UserUpdate = { email: "neu@example.com" };
      const empty: UserUpdate = {};
      const role: UserRole = "viewer";
      const loaded: LoadedUser = { id: 2, name: "Linus", email: "linus@example.com", role: "viewer", createdAt: "2026-10-02" };
      const changed: ChangedFields = { name: true, email: false, role: false };

      // @ts-expect-error – eine Vorschau hat keine E-Mail
      const previewWithEmail: UserPreview = { id: 1, name: "Ada", email: "ada@example.com" };
      // @ts-expect-error – neue User haben noch keine id
      const draftWithId: NewUser = { id: 3, name: "Margaret", email: "m@example.com", role: "viewer" };
      // @ts-expect-error – UserUpdate kennt die id nicht
      const patchId: UserUpdate = { id: 4 };
      // @ts-expect-error – "owner" ist keine Rolle
      const badRole: UserRole = "owner";
      // @ts-expect-error – LoadedUser ist der User, nicht das Promise
      const notAwaited: LoadedUser = loadUser(1);
      // @ts-expect-error – ChangedFields braucht für jedes Feld einen Wert
      const incomplete: ChangedFields = { name: true };

      export { preview, draft, patch, empty, role, loaded, changed };
      export { previewWithEmail, draftWithId, patchId, badRole, notAwaited, incomplete };
      TS
      sha256sum src/usage.ts src/types.ts > .original.sha256
    checks:
      - type: command
        run: sha256sum -c --quiet .original.sha256
        message: src/usage.ts oder src/types.ts wurde verändert. Ändere nur src/derived.ts.
      - type: command
        run: "! grep -nE '\\bany\\b|@ts-ignore|(id|name|email|role|createdAt)\\??\\s*:|\"(admin|editor|viewer)\"' src/derived.ts"
        message: In src/derived.ts stehen abgetippte Eigenschaften, Rollennamen oder any. Leite die Typen mit Pick, Omit, Partial, Indexed Access, ReturnType und Awaited ab.
      - type: command
        run: npx tsc --noEmit
        expect_exit: 0
        message: "`npx tsc --noEmit` meldet noch Fehler. Exportierst du alle sechs Typen? Ein „Unused '@ts-expect-error'“ heißt: Der Typ ist zu großzügig."
    hints:
      - "Beginne mit `import type { User } from \"./types.ts\";` und `export type UserPreview = Pick<User, \"id\" | \"name\">;`."
      - "`Omit<User, \"id\" | \"createdAt\">` für NewUser, `Partial<NewUser>` für UserUpdate, `User[\"role\"]` für UserRole."
      - "Für `typeof loadUser` importierst du die Funktion mit `import type { User, loadUser } from \"./types.ts\";` – in Typpositionen ist das erlaubt."
    solution: |
      ```ts
      import type { User, loadUser } from "./types.ts";

      export type UserPreview = Pick<User, "id" | "name">;
      export type NewUser = Omit<User, "id" | "createdAt">;
      export type UserUpdate = Partial<NewUser>;
      export type UserRole = User["role"];
      export type LoadedUser = Awaited<ReturnType<typeof loadUser>>;
      export type ChangedFields = { [K in keyof NewUser]: boolean };
      ```

      `import type` darf auch Funktionen importieren – du kannst sie dann nur in Typpositionen wie
      `typeof loadUser` benutzen, was hier genau richtig ist.
---
Ein `User` hat zehn Felder. Für das Anlegen brauchst du alle außer `id`, für die Vorschau nur zwei, für ein
Update alle optional. Tippst du diese Varianten ab, hast du vier Stellen, die beim nächsten neuen Feld
auseinanderlaufen. TypeScript kann Typen aus anderen Typen **berechnen** – du pflegst nur noch die Quelle.

## typeof und keyof

Im Typkontext (hinter `:` oder in `type … =`) bedeutet `typeof`: „Gib mir den Typ dieses Werts.“
[[keyof]] liefert die Schlüssel eines Objekttyps als Union von Literal-Typen.

```ts title="Typen aus Werten und Schlüsseln"
const defaults = { theme: "light", pageSize: 20, beta: false };

type Settings = typeof defaults;
// { theme: string; pageSize: number; beta: boolean }

type SettingKey = keyof Settings;
// "theme" | "pageSize" | "beta"

function setSetting(key: SettingKey, value: string) { /* … */ }
setSetting("pageSize", "50");
setSetting("pagesize", "50"); // error – Tippfehler im Schlüssel
```

> [!FEHLER]
> `keyof defaults` ist ein Fehler: `keyof` arbeitet mit **Typen**, nicht mit Werten. Richtig ist
> `keyof typeof defaults`.

## Indexed Access: T["key"]

Mit eckigen Klammern im Typkontext greifst du auf den Typ einer Eigenschaft zu – wie bei einem Objekt
zur Laufzeit, nur eben mit Typen:

```ts title="Indexed Access Types"
interface Order {
  id: string;
  status: "open" | "paid" | "shipped";
  items: { sku: string; quantity: number }[];
}

type OrderStatus = Order["status"];          // "open" | "paid" | "shipped"
type OrderItem = Order["items"][number];     // { sku: string; quantity: number }

const ROLES = ["admin", "editor"] as const;
type Role = (typeof ROLES)[number];          // "admin" | "editor"
```

`[number]` heißt: „der Typ eines beliebigen Elements“. So kommst du an den Elementtyp eines Arrays –
das kennst du schon von `as const`.

## Utility Types

TypeScript bringt fertige generische Hilfstypen mit, die [[utility-type|Utility Types]]. Die wichtigsten:

![Aus einem User-Typ werden mit Pick, Omit und Partial neue Typen](/assets/typescript/utility-types.svg)

| Utility Type | Ergebnis |
|---|---|
| `Partial<T>` | alle Eigenschaften optional |
| `Required<T>` | alle Eigenschaften Pflicht |
| `Readonly<T>` | alle Eigenschaften schreibgeschützt |
| `Pick<T, K>` | nur die Eigenschaften K, z. B. `Pick<User, "id">` |
| `Omit<T, K>` | alle Eigenschaften außer K |
| `Record<K, V>` | Objekt mit Schlüsseln K und Werten V |
| `ReturnType<typeof fn>` | Rückgabetyp einer Funktion |
| `Awaited<P>` | packt ein `Promise` aus |
| `NonNullable<T>` | entfernt `null` und `undefined` |

```ts title="Kombinieren"
type NewUser = Omit<User, "id" | "createdAt">;
type UserPatch = Partial<NewUser>;
type LoadedUser = Awaited<ReturnType<typeof loadUser>>;  // User statt Promise<User>
```

> [!PRAXIS]
> Ein Formular zum Bearbeiten nimmt `Partial<…>`, eine Listenansicht `Pick<…>`, eine API ohne interne
> Felder `Omit<…, "passwordHash">`. Alle hängen an derselben Quelle.

## Mapped Types – ein erster Blick

Wie funktioniert `Partial` eigentlich? Es ist ein [[mapped-type|Mapped Type]]: eine Schleife über alle
Schlüssel eines Typs.

```ts title="Mapped Types selbst gebaut"
type MyPartial<T> = { [K in keyof T]?: T[K] };
type Flags<T> = { [K in keyof T]: boolean };

type UserFlags = Flags<{ name: string; email: string }>;
// { name: boolean; email: boolean }
```

`[K in keyof T]` heißt: „für jeden Schlüssel K von T“. Mit `?` oder `readonly` davor änderst du die
Eigenschaften, rechts vom Doppelpunkt bestimmst du den neuen Typ.

## Conditional Types – ein erster Blick

Ein [[conditional-type|Conditional Type]] trifft eine Entscheidung auf Typebene, ähnlich dem
[[ternaerer-operator|ternären Operator]]:

```ts title="Wenn-dann auf Typebene"
type IsText<T> = T extends string ? "ja" : "nein";
type A = IsText<"Hallo">;   // "ja"
type B = IsText<42>;        // "nein"

type ElementOf<T> = T extends (infer E)[] ? E : never;
type C = ElementOf<string[]>;  // string
```

Mit `infer` holst du einen Teil eines Typs heraus. So sind `ReturnType` und `Awaited` gebaut. Im Alltag
**benutzt** du solche Typen viel öfter, als du sie schreibst – tiefer geht das Handbuch-Kapitel
[Creating Types from Types](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html).

> [!MERKSATZ]
> Pflege jede Datenform an **einer** Stelle und leite alles andere ab.

## Zusammenfassung

- `typeof wert` liefert den Typ eines Werts, `keyof Typ` die Schlüssel als Union.
- `T["key"]` liefert den Typ einer Eigenschaft, `T[number]` den Elementtyp eines Arrays.
- Utility Types wie `Partial`, `Pick`, `Omit`, `Record`, `ReturnType` und `Awaited` bauen neue Typen.
- Mapped Types (`[K in keyof T]`) wandeln jede Eigenschaft eines Typs um.
- Conditional Types (`T extends U ? X : Y`) entscheiden auf Typebene.
- Abgeleitete Typen wandern automatisch mit, wenn sich die Quelle ändert.
