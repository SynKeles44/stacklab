---
title: Laufzeitvalidierung mit Zod
summary: Warum Typen an der Systemgrenze nicht reichen und wie du mit Zod 4 Daten prüfst und den TypeScript-Typ direkt aus dem Schema ableitest.
duration: 25
sources:
  - title: Zod – Intro
    url: https://zod.dev/
  - title: Zod – Basic usage
    url: https://zod.dev/basics
  - title: Zod – Defining schemas
    url: https://zod.dev/api
  - title: Zod – Formatting errors
    url: https://zod.dev/error-formatting
quiz:
  - type: single
    question: "Warum reicht `const user = (await res.json()) as User;` nicht aus?"
    options:
      - Weil `as` die Daten zur Laufzeit in einen User umwandelt und dabei Felder verliert.
      - Weil `as` nur eine Behauptung ist – geprüft wird zur Laufzeit gar nichts.
      - Weil `res.json()` in TypeScript verboten ist.
    answer: 1
    explanation: Eine Type Assertion verändert nichts und prüft nichts. Schickt die API andere Daten, glaubt TypeScript dir trotzdem – und der Fehler kracht später an ganz anderer Stelle.
  - type: match
    question: Ordne jedem Zod-Aufruf seine Bedeutung zu.
    pairs:
      - { left: "Schema.parse(data)", right: "Liefert geprüfte Daten oder wirft einen ZodError" }
      - { left: "Schema.safeParse(data)", right: "Liefert { success, data } oder { success, error }, wirft nie" }
      - { left: "z.infer<typeof Schema>", right: "Leitet den TypeScript-Typ aus dem Schema ab" }
      - { left: "z.coerce.number()", right: "Wandelt z. B. den Text \"8080\" vor der Prüfung in eine Zahl um" }
    explanation: "`parse` passt, wenn ungültige Daten ein echter Fehler sind; `safeParse`, wenn du den Fehlerfall selbst behandeln willst, etwa in einem Formular."
  - type: find-bug
    question: In welcher Zeile liegt der Denkfehler?
    language: ts
    code: |
      import * as z from "zod";
      const Product = z.object({ name: z.string(), price: z.number() });
      type Product = z.infer<typeof Product>;
      const result = Product.safeParse(JSON.parse(input));
      console.log(result.data.name);
    bug_line: 5
    explanation: "`safeParse` kann fehlschlagen. Erst nach `if (result.success)` grenzt TypeScript `result` so ein, dass `data` sicher existiert."
  - type: cloze
    text: "Mit Zod 4 schreibst du eine E-Mail-Prüfung kurz als `z.___()`. Den Typ zum Schema `User` erhältst du mit `z.___<typeof User>`."
    blanks:
      - [email]
      - [infer]
    explanation: In Zod 4 sind Formate wie `z.email()`, `z.url()` oder `z.uuid()` eigene Funktionen. `z.infer` macht aus dem Schema einen Typ.
tasks:
  - id: safeparse-ablauf
    type: steps
    title: Ein Formular mit safeParse auswerten
    description: Ein Anmeldeformular schickt seine Daten an `SignupSchema.safeParse(formData)`. Verfolge, was passiert.
    steps:
      - situation: |
          `const SignupSchema = z.object({ email: z.email(), age: z.coerce.number().int().min(16) });`
          Das Formular liefert `{ email: "ada@example.com", age: "36" }`.
        question: Was liefert `safeParse`?
        options:
          - "`{ success: true, data: { email: \"ada@example.com\", age: 36 } }`"
          - "`{ success: false, error: … }`, weil age ein Text ist"
          - Es wirft eine Exception.
        answer: 0
        explanation: "`z.coerce.number()` wandelt `\"36\"` vor der Prüfung in die Zahl 36 um. Formularfelder sind immer Texte – dafür ist coerce gedacht."
      - situation: 'Jetzt kommt `{ email: "ada(at)example.com", age: "12" }`.'
        question: Was enthält `result.error.issues`?
        options:
          - Nur das erste Problem, die E-Mail
          - Zwei Einträge – einen für email, einen für age
          - Gar nichts, safeParse hat Erfolg
        answer: 1
        explanation: Zod sammelt alle Probleme. Jedes Issue hat einen `path` (z. B. `["age"]`) und eine `message` – ideal, um jede Meldung am passenden Feld anzuzeigen.
      - situation: "Im Code steht `if (!result.success) return showErrors(result.error); save(result.data);`"
        question: Welchen Typ hat `result.data` in der Zeile mit `save`?
        options:
          - "`unknown`"
          - "`{ email: string; age: number }`"
          - "`{ email: string; age: string }`"
        answer: 1
        explanation: "`result` ist eine Discriminated Union über `success`. Nach dem frühen return bleibt nur der Erfolgsfall. Der Typ ist die Ausgabe des Schemas – age ist nach coerce eine Zahl."
  - id: config-validieren
    type: terminal
    title: Eine Konfiguration mit Zod prüfen
    description: |
      Im Ordner `config-validieren` sind TypeScript, `@types/node` und **Zod 4** installiert. Die Datei
      `src/config.test.ts` enthält Tests mit `node:test` – sie prüfen dein Schema zur Laufzeit **und**
      mit `@ts-expect-error` auf Typebene.

      Schreibe `src/config.ts` mit diesen Exporten:

      1. `ConfigSchema`: ein `z.object` mit
         - `appName`: Text, mindestens 1 Zeichen
         - `port`: Zahl (Texte wie `"8080"` werden umgewandelt), ganzzahlig, 1 bis 65535
         - `adminEmail`: gültige E-Mail-Adresse
         - `mode`: `"development"` oder `"production"`, Standard `"development"`
         - `features`: Array von Texten, Standard `[]`
      2. `type Config`: aus dem Schema abgeleitet – nicht abgetippt.
      3. `parseConfig(input: unknown): Config` – wirft bei ungültigen Daten.
      4. `tryParseConfig(input: unknown)` – liefert `{ ok: true, config }` oder `{ ok: false, errors }`,
         wobei `errors` die Feldnamen der Probleme enthält (z. B. `["port"]`).

      Prüfe mit `npx tsc --noEmit` und `node --test`. Klicke zuerst auf **Aufgabe vorbereiten** (die
      Installation dauert einige Sekunden).
    workdir: config-validieren
    setup: |
      npm init -y >/dev/null
      npm pkg set type=module
      npm install --save-dev --no-audit --no-fund typescript@7.0.2 @types/node@24 >/dev/null
      npm install --no-audit --no-fund zod@4.6.5 >/dev/null
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
          "types": ["node"],
          "skipLibCheck": true
        },
        "include": ["src"]
      }
      JSON
      mkdir -p src
      printf 'import * as z from "zod";\n\n// Schreibe hier ConfigSchema, Config, parseConfig und tryParseConfig.\n' > src/config.ts
      cat > src/config.test.ts <<'TS'
      import { test } from "node:test";
      import assert from "node:assert/strict";
      import { parseConfig, tryParseConfig } from "./config.ts";
      import type { Config } from "./config.ts";

      test("gültige Konfiguration bekommt Standardwerte", () => {
        const config: Config = parseConfig({ appName: "Stacklab", port: "8080", adminEmail: "admin@example.com" });
        assert.equal(config.port, 8080);
        assert.equal(config.mode, "development");
        assert.deepEqual(config.features, []);
      });

      test("ungültiger Port wirft", () => {
        assert.throws(() => parseConfig({ appName: "App", port: 70000, adminEmail: "admin@example.com" }));
        assert.throws(() => parseConfig({ appName: "App", port: 80.5, adminEmail: "admin@example.com" }));
      });

      test("ungültige E-Mail und unbekannter mode werfen", () => {
        assert.throws(() => parseConfig({ appName: "App", port: 80, adminEmail: "admin(at)example.com" }));
        assert.throws(() => parseConfig({ appName: "App", port: 80, adminEmail: "admin@example.com", mode: "staging" }));
      });

      test("tryParseConfig sammelt alle fehlerhaften Felder", () => {
        const result = tryParseConfig({ appName: "", port: "abc", adminEmail: "kein-at-zeichen" });
        assert.equal(result.ok, false);
        if (!result.ok) {
          assert.deepEqual([...result.errors].sort(), ["adminEmail", "appName", "port"]);
        }
      });

      test("tryParseConfig liefert die geprüfte Konfiguration", () => {
        const result = tryParseConfig({ appName: "Shop", port: 443, adminEmail: "ops@example.com", mode: "production", features: ["beta"] });
        assert.equal(result.ok, true);
        if (result.ok) {
          assert.equal(result.config.mode, "production");
          assert.deepEqual(result.config.features, ["beta"]);
        }
      });

      const production: Config["mode"] = "production";
      // @ts-expect-error – mode kennt nur development und production
      const staging: Config["mode"] = "staging";
      // @ts-expect-error – port ist nach dem Parsen eine Zahl
      const textPort: Config["port"] = "8080";
      // @ts-expect-error – features ist nach dem Parsen immer vorhanden
      const noFeatures: Config["features"] = undefined;

      export { production, staging, textPort, noFeatures };
      TS
      sha256sum src/config.test.ts > .test.sha256
    checks:
      - type: command
        run: sha256sum -c --quiet .test.sha256
        message: src/config.test.ts wurde verändert. Schreibe deine Lösung nur in src/config.ts.
      - type: file_contains
        path: src/config.ts
        pattern: "z\\.infer<typeof ConfigSchema>"
        message: "Leite den Typ mit `export type Config = z.infer<typeof ConfigSchema>;` aus dem Schema ab."
      - type: command
        run: "! grep -nE '\\bany\\b|@ts-ignore' src/config.ts"
        message: In src/config.ts steht any oder @ts-ignore. Lass Zod die Typen liefern.
      - type: command
        run: npx tsc --noEmit
        expect_exit: 0
        message: "`npx tsc --noEmit` meldet Fehler. Exportierst du alles? Ein „Unused '@ts-expect-error'“ heißt: Dein Schema ist zu großzügig."
      - type: command
        run: node --test
        expect_exit: 0
        message: "`node --test` meldet fehlgeschlagene Tests. Lies die Ausgabe: Welche Prüfung im Schema fehlt noch?"
    hints:
      - "`z.coerce.number().int().min(1).max(65535)` für den Port, `z.email()` für die E-Mail, `z.enum([\"development\", \"production\"]).default(\"development\")` für mode."
      - "`ConfigSchema.safeParse(input)` liefert bei Fehlern `result.error.issues`. Jedes Issue hat einen `path` – `issue.path.join(\".\")` ergibt den Feldnamen."
      - "Rückgabetyp von tryParseConfig: `{ ok: true; config: Config } | { ok: false; errors: string[] }`."
    solution: |
      ```ts
      import * as z from "zod";

      export const ConfigSchema = z.object({
        appName: z.string().min(1),
        port: z.coerce.number().int().min(1).max(65535),
        adminEmail: z.email(),
        mode: z.enum(["development", "production"]).default("development"),
        features: z.array(z.string()).default([]),
      });

      export type Config = z.infer<typeof ConfigSchema>;

      export function parseConfig(input: unknown): Config {
        return ConfigSchema.parse(input);
      }

      export function tryParseConfig(
        input: unknown,
      ): { ok: true; config: Config } | { ok: false; errors: string[] } {
        const result = ConfigSchema.safeParse(input);
        if (result.success) {
          return { ok: true, config: result.data };
        }
        return { ok: false, errors: result.error.issues.map((issue) => issue.path.join(".")) };
      }
      ```
---
Deine App lädt Produktdaten von einer [[api|API]]. Du hast einen schönen Typ `Product` geschrieben, und
`tsc` ist zufrieden. Dann ändert das Backend-Team `price` von einer Zahl in einen Text – und deine Seite
zeigt plötzlich `NaN €`. TypeScript hat nichts gemerkt, denn zur Laufzeit gibt es keine Typen. An dieser
Stelle brauchst du eine echte Prüfung: [[laufzeitvalidierung|Laufzeitvalidierung]].

## Die Lücke an der Systemgrenze

Alles, was **von außen** kommt, kennt TypeScript nicht: [[json|JSON]] von einer API, Formulareingaben,
[[umgebungsvariable|Umgebungsvariablen]], Dateien, Nachrichten aus einer Warteschlange. Diese Stelle heißt
Systemgrenze.

```ts title="Eine gefährliche Behauptung"
type Product = { name: string; price: number };

const res = await fetch("https://api.example.com/products/1");
const product = (await res.json()) as Product;  // nur behauptet!
console.log(product.price.toFixed(2));          // TypeError, wenn price ein Text ist
```

`res.json()` liefert `any`. Mit `as Product` machst du eine [[type-assertion|Type Assertion]]: Du sagst
TypeScript „glaub mir“. Geprüft wird nichts.

![Daten von außen werden an der Grenze von Zod geprüft und erst danach typisiert](/assets/typescript/zod-grenze.svg)

> [!MERKSATZ]
> Innerhalb deines Codes schützen dich Typen. An der Grenze nach außen schützt dich nur eine Prüfung zur
> Laufzeit.

## Zod: Schema statt Typ

[[zod|Zod]] ist eine Bibliothek für [[schema-validierung|Schema-Validierung]]. Du beschreibst die
erwartete Form einmal als Schema – ein ganz normales JavaScript-Objekt, das es auch zur Laufzeit gibt.

```bash title="Terminal"
npm install zod
```

```ts title="Ein Schema mit Zod 4"
import * as z from "zod";

const ProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative(),
  tags: z.array(z.string()).optional(),
  category: z.enum(["book", "game", "music"]),
  contact: z.email(),
});
```

Jede Methode fügt eine Regel hinzu. In Zod 4 sind häufige Formate wie `z.email()`, `z.url()` oder
`z.uuid()` eigene Funktionen.

## Den Typ aus dem Schema ableiten

Schema und Typ getrennt pflegen? Das wäre wieder doppelte Arbeit. Zod leitet den Typ ab:

```ts title="Ein Schema, ein Typ"
type Product = z.infer<typeof ProductSchema>;
// {
//   name: string;
//   price: number;
//   tags?: string[] | undefined;
//   category: "book" | "game" | "music";
//   contact: string;
// }
```

Das ist dasselbe Prinzip wie in Modul 3: **eine** Quelle, alles andere abgeleitet. Änderst du das Schema,
ändert sich der Typ automatisch mit.

> [!PRAXIS]
> In vielen Projekten liegt neben jedem API-Endpunkt ein Zod-Schema für die Antwort. Der API-Client prüft
> jede Antwort und liefert erst danach typisierte Daten an die Oberfläche.

## parse und safeParse

Zwei Wege, Daten zu prüfen:

```ts title="Prüfen an der Grenze"
const data: unknown = await res.json();

// 1. parse: geprüfte Daten oder Exception
const product = ProductSchema.parse(data);    // Typ: Product

// 2. safeParse: niemals Exception, sondern ein Ergebnisobjekt
const result = ProductSchema.safeParse(data);
if (!result.success) {
  console.error(z.prettifyError(result.error));
  for (const issue of result.error.issues) console.log(issue.path, issue.message);
} else {
  console.log(result.data.price.toFixed(2));  // sicher: price ist eine Zahl
}
```

Das Ergebnis von `safeParse` ist eine [[discriminated-union|Discriminated Union]] über `success` – genau das
Muster aus Modul 2. Ein `ZodError` enthält in `issues` **alle** Probleme mit Pfad und Meldung.

> [!FEHLER]
> `z.number()` für ein Formularfeld schlägt immer fehl, weil Eingaben Texte sind. Nimm
> `z.coerce.number()`: Es wandelt `"42"` vor der Prüfung in `42` um.

## Standardwerte, Ein- und Ausgabetyp

Mit `.default(…)` setzt Zod fehlende Werte ein. Dadurch unterscheiden sich, was hineingehen darf und was
herauskommt:

```ts title="Eingabe und Ausgabe"
const Settings = z.object({
  pageSize: z.coerce.number().default(20),
});
type SettingsInput = z.input<typeof Settings>;   // { pageSize?: unknown }
type SettingsOutput = z.output<typeof Settings>; // { pageSize: number } – wie z.infer
```

`z.infer` liefert den Ausgabetyp – also das, womit dein Code nach der Prüfung arbeitet. Weitere
Möglichkeiten wie eigene Regeln mit `.refine()` oder Umwandlungen mit `.transform()` beschreibt die
[Zod-Dokumentation](https://zod.dev/api).

## Zusammenfassung

- Typen existieren nur beim Prüfen – Daten von außen musst du **zur Laufzeit** validieren.
- `as Typ` ist nur eine Behauptung; an der Systemgrenze ersetzt du sie durch ein Schema.
- Zod beschreibt die Form als Schema, `z.infer<typeof Schema>` leitet den Typ daraus ab.
- `parse` wirft bei Fehlern, `safeParse` liefert `{ success, data | error }` als Discriminated Union.
- `z.coerce.number()` wandelt Texte um, `.default()` setzt Standardwerte.
- Ein Schema, ein Typ: Beides bleibt automatisch synchron.
