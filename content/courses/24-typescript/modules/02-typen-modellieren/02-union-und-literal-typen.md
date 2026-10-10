---
title: Union- und Literal-Typen, as const und satisfies
summary: Wie du „das eine oder das andere“ ausdrückst, erlaubte Werte exakt festlegst und Konfigurationen prüfst, ohne Typinformation zu verlieren.
duration: 25
sources:
  - title: TypeScript Handbook – Union Types und Literal Types
    url: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types
  - title: TypeScript 4.9 – The satisfies Operator
    url: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator
  - title: TypeScript 3.4 – const assertions
    url: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions
quiz:
  - type: find-bug
    question: In welcher Zeile meldet TypeScript einen Fehler?
    language: ts
    code: |
      function printId(id: string | number) {
        console.log("ID:", id);
        console.log(id.toUpperCase());
      }
      printId(42);
    bug_line: 3
    explanation: "`id` kann eine Zahl sein, und Zahlen haben kein `toUpperCase`. Bei einem Union-Typ ist nur erlaubt, was für **alle** Mitglieder gilt – erst nach einer Prüfung (Narrowing) geht mehr."
  - type: single
    question: "Welchen Typ hat `method` in `const req = { method: \"GET\" };`?"
    options:
      - "`\"GET\"`"
      - "`string`"
      - "`readonly \"GET\"`"
    answer: 1
    explanation: Eigenschaften von Objekten sind veränderbar, deshalb verallgemeinert TypeScript zu `string`. Mit `as const` bliebe es `"GET"`.
  - type: multiple
    question: "Was bewirkt `const config = { port: 3000 } satisfies Record<string, number>;`?"
    options:
      - TypeScript prüft, ob das Objekt zum Typ `Record<string, number>` passt.
      - "`config.port` behält seinen genauen inferierten Typ."
      - Das Objekt wird zur Laufzeit gegen den Typ geprüft.
      - "`config` hat danach genau den Typ `Record<string, number>`."
    answers: [0, 1]
    explanation: "`satisfies` prüft nur – der inferierte Typ bleibt erhalten. Eine Annotation würde den Typ auf `Record<string, number>` verbreitern. Zur Laufzeit passiert gar nichts."
  - type: cloze
    text: "`const sizes = [\"S\", \"M\", \"L\"] as ___;` ergibt den Typ `readonly [\"S\", \"M\", \"L\"]`. Mit `(typeof sizes)[___]` erhältst du daraus `\"S\" | \"M\" | \"L\"`."
    blanks:
      - [const]
      - [number]
    explanation: "`as const` friert die Werte als Literal-Typen ein. Der Index `number` liefert den Typ aller Elemente als Union."
tasks:
  - id: literal-inferenz
    type: dragdrop
    title: Weit oder eng?
    description: Welchen Typ inferiert TypeScript? Ordne jede Deklaration zu.
    targets:
      - { id: string, label: "string" }
      - { id: literal, label: "\"dark\"" }
      - { id: tupel, label: "readonly [\"de\", \"en\"]" }
      - { id: union, label: "\"de\" | \"en\"" }
    items:
      - { label: "let theme = \"dark\"", target: string }
      - { label: "const theme = \"dark\"", target: literal }
      - { label: "const langs = [\"de\", \"en\"] as const", target: tupel }
      - { label: "(typeof langs)[number]", target: union }
  - id: bestellstatus
    type: code
    language: ts
    title: Ein Bestellstatus mit Literal-Typen
    description: |
      Ein Shop kennt genau vier Bestellstatus. Baue ihn typsicher auf:

      1. `STATUSES` ist ein Array mit `"pending"`, `"paid"`, `"shipped"`, `"delivered"` – mit `as const`.
      2. `Status` ist der Union-Typ aller Werte aus `STATUSES` (abgeleitet, nicht abgetippt).
      3. `LABELS` ordnet jedem Status einen deutschen Text zu und wird mit `satisfies Record<Status, string>`
         geprüft: `Offen`, `Bezahlt`, `Versendet`, `Zugestellt`.
      4. `nextStatus(status)` liefert den folgenden Status oder `undefined` nach `"delivered"`.
      5. `parseStatus(text)` liefert den passenden `Status` für einen beliebigen Text oder `undefined`.
    starter: |
      const STATUSES = ["pending"];

      type Status = string;

      const LABELS = {};

      function nextStatus(status: Status): Status | undefined {
        return undefined;
      }

      function parseStatus(text: string): Status | undefined {
        return undefined;
      }
    tests:
      - name: nextStatus geht einen Schritt weiter
        code: assertEqual(nextStatus("paid"), "shipped")
      - name: nach delivered kommt nichts mehr
        code: assertEqual(nextStatus("delivered"), undefined)
      - name: parseStatus erkennt gültige Werte
        code: assertEqual(parseStatus("pending"), "pending")
      - name: parseStatus lehnt Unbekanntes ab (auch Großschreibung)
        code: assertEqual(parseStatus("PAID") ?? parseStatus("lost"), undefined)
      - name: LABELS enthält alle vier Texte
        code: assertDeepEqual(STATUSES.map((s) => LABELS[s]), ["Offen", "Bezahlt", "Versendet", "Zugestellt"])
    solution: |
      const STATUSES = ["pending", "paid", "shipped", "delivered"] as const;

      type Status = (typeof STATUSES)[number];

      const LABELS = {
        pending: "Offen",
        paid: "Bezahlt",
        shipped: "Versendet",
        delivered: "Zugestellt",
      } satisfies Record<Status, string>;

      function nextStatus(status: Status): Status | undefined {
        const index = STATUSES.indexOf(status);
        return STATUSES[index + 1];
      }

      function parseStatus(text: string): Status | undefined {
        return STATUSES.find((status) => status === text);
      }
    hints:
      - "`type Status = (typeof STATUSES)[number];` macht aus dem eingefrorenen Array eine Union."
      - "`STATUSES.indexOf(status) + 1` ist der Index des nächsten Status; außerhalb des Arrays liefert der Zugriff `undefined`."
---
Ein Bestellstatus ist `"pending"`, `"paid"` oder `"shipped"` – aber niemals `"payed"` mit Tippfehler. Ein
Parameter darf eine Zahl **oder** ein Text sein. Solche Regeln beschreibst du mit Union- und
Literal-Typen. Sie gehören zu den nützlichsten Werkzeugen in TypeScript.

## Union-Typen: das eine oder das andere

Ein [[union-typ|Union-Typ]] verbindet mehrere Typen mit `|`. Ein Wert muss zu **mindestens einem** davon
passen:

```ts title="Union-Typen"
function formatId(id: string | number): string {
  return `#${id}`;
}
formatId(42);      // ok
formatId("A-17");  // ok
formatId(true);    // error TS2345: 'boolean' is not assignable to 'string | number'
```

Innerhalb der Funktion darfst du nur nutzen, was **alle** Mitglieder können. Template-Strings gehen mit
beiden, `id.toUpperCase()` nicht – das gibt es nur bei Texten. Wie du den Typ vorher eingrenzt, lernst du
in der nächsten Lektion.

> [!MERKSATZ]
> Bei `A | B` darfst du nur verwenden, was A **und** B gemeinsam haben. Erst eine Prüfung schaltet mehr frei.

## Literal-Typen: genau dieser Wert

Ein [[literal-typ|Literal-Typ]] ist ein einzelner, exakter Wert als Typ. Allein ist das wenig nützlich,
in einer Union aber sehr:

```ts title="Literal-Unions statt Magic Strings"
type Theme = "light" | "dark" | "system";
type Dice = 1 | 2 | 3 | 4 | 5 | 6;

function setTheme(theme: Theme) { /* … */ }
setTheme("dark");  // ok
setTheme("drak");  // error: '"drak"' is not assignable to type 'Theme'
```

Der Editor schlägt dir die drei erlaubten Werte sogar vor. Literal-Unions sind die moderne Alternative zu
einem `enum`: Sie verschwinden beim Entfernen der Typen spurlos.

**Weit oder eng?** Bei `const theme = "dark"` ist der Typ `"dark"`, denn der Wert ändert sich nie. Bei
`let theme = "dark"` oder `{ theme: "dark" }` verallgemeinert TypeScript zu `string`, weil später ein
anderer Text hineinkommen könnte.

## as const: Werte einfrieren

Mit [[as-const|as const]] sagst du: „Dieser Wert ändert sich nie – nimm die engsten Typen.“ Arrays werden
zu schreibgeschützten Tupeln, Objekteigenschaften zu `readonly`-Literalen.

```ts title="Eine Union aus einer Liste ableiten"
const SIZES = ["S", "M", "L"] as const;
// Typ: readonly ["S", "M", "L"]

type Size = (typeof SIZES)[number];
// Typ: "S" | "M" | "L"

for (const size of SIZES) console.log(size); // die Liste gibt es auch zur Laufzeit
```

So pflegst du die erlaubten Werte an **einer** Stelle: Die Liste nutzt du im Code (etwa für ein
Auswahlmenü), der Typ entsteht automatisch daraus. `typeof` und `[number]` schauen wir uns in Modul 3
genauer an.

> [!FEHLER]
> `type Size = "S" | "M" | "L"` **und** `const SIZES = ["S", "M", "L"]` getrennt pflegen. Früher oder
> später kommt `"XL"` nur an einer Stelle dazu. Leite den Typ lieber aus der Liste ab.

## satisfies: prüfen, ohne zu verbreitern

Eine Annotation wie `const x: Typ = …` prüft den Wert, **ersetzt** aber auch seinen Typ. Dabei geht oft
Wissen verloren. Der Operator [[satisfies]] prüft nur und behält den genauen, inferierten Typ.

```ts title="Annotation vs. satisfies"
type Route = "home" | "settings";

const a: Record<Route, string> = { home: "/", settings: "/settings" };
a.home;      // string

const b = { home: "/", settings: "/settings" } satisfies Record<Route, string>;
b.home;      // "/" – genau bekannt
// Fehlt ein Schlüssel oder steht ein Tippfehler drin, meldet satisfies das sofort.
```

> [!PRAXIS]
> `satisfies` ist ideal für Konfigurationsobjekte, Routen-Tabellen oder Übersetzungen: Du bekommst die
> Prüfung „alle Schlüssel vorhanden, alle Werte passen“ und trotzdem präzise Typen für den Editor.

## Zusammenfassung

- Ein **Union-Typ** `A | B` erlaubt Werte beider Typen; nutzbar ist nur das Gemeinsame.
- **Literal-Typen** legen exakte Werte fest – als Union ersetzen sie Magic Strings und `enum`s.
- `const` behält Literal-Typen, `let` und Objekteigenschaften werden verallgemeinert.
- `as const` friert Werte ein; `(typeof LISTE)[number]` macht daraus eine Union.
- `satisfies` prüft einen Wert gegen einen Typ, ohne den inferierten Typ zu verlieren.
