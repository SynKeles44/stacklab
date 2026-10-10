---
title: Narrowing – Typen sicher eingrenzen
summary: Wie TypeScript aus if-Abfragen lernt, Discriminated Unions auswertet und mit never sicherstellt, dass du keinen Fall vergisst.
duration: 25
sources:
  - title: TypeScript Handbook – Narrowing
    url: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
  - title: TypeScript Handbook – Discriminated Unions
    url: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions
quiz:
  - type: match
    question: Welche Prüfung grenzt welchen Typ ein?
    pairs:
      - { left: "typeof x === \"string\"", right: "Primitive Typen wie string, number, boolean" }
      - { left: "x instanceof Date", right: "Objekte einer bestimmten Klasse" }
      - { left: "\"swim\" in animal", right: "Objekte, die eine bestimmte Eigenschaft haben" }
      - { left: "shape.kind === \"circle\"", right: "Mitglieder einer Discriminated Union" }
    explanation: Jede dieser Prüfungen ist ganz normales JavaScript. TypeScript wertet sie aus und schränkt den Typ im jeweiligen Zweig ein.
  - type: single
    question: 'Warum steht in `default` eines vollständigen switch oft `const check: never = shape;`?'
    options:
      - Damit das Programm schneller läuft.
      - Damit TypeScript einen Fehler meldet, sobald ein neuer Fall dazukommt, der nicht behandelt wird.
      - Weil switch-Anweisungen in TypeScript immer ein default brauchen.
    answer: 1
    explanation: Sind alle Fälle behandelt, bleibt im default nur `never` übrig. Kommt ein neues Mitglied zur Union hinzu, landet es dort – und `never` kann nichts zugewiesen werden.
  - type: find-bug
    question: In welcher Zeile meldet TypeScript einen Fehler?
    language: ts
    code: |
      function parse(input: unknown): number {
        if (typeof input === "number") return input;
        if (typeof input === "string") return Number(input.trim());
        return input.length;
      }
    bug_line: 4
    explanation: Nach den beiden Prüfungen ist `input` immer noch `unknown`. Auf `unknown` darfst du nichts aufrufen, bevor du den Typ geprüft hast.
  - type: multiple
    question: Welche Aussagen über `unknown` und `any` stimmen?
    options:
      - Einer Variable vom Typ `unknown` kann man jeden Wert zuweisen.
      - Mit einem `unknown`-Wert darf man erst nach einer Prüfung arbeiten.
      - "`any` schaltet die Typprüfung für diesen Wert ab."
      - "`unknown` und `any` verhalten sich bei der Prüfung gleich."
    answers: [0, 1, 2]
    explanation: Beide nehmen jeden Wert an. `unknown` zwingt dich aber zur Prüfung, `any` erlaubt alles – auch Fehler.
tasks:
  - id: narrowing-verfolgen
    type: steps
    title: Welchen Typ hat value gerade?
    description: Folge dem Code Zeile für Zeile und gib an, was TypeScript an der jeweiligen Stelle über `value` weiß.
    steps:
      - situation: |
          `function show(value: string | number[] | null) {` – du stehst direkt am Anfang der Funktion.
        question: Welchen Typ hat `value` hier?
        options:
          - "string | number[] | null"
          - "string"
          - "unknown"
        answer: 0
        explanation: Ohne jede Prüfung gilt der deklarierte Typ des Parameters.
      - situation: |
          `if (value === null) return "leer";` – du stehst in der Zeile **nach** diesem if.
        question: Welchen Typ hat `value` jetzt?
        options:
          - "string | number[] | null"
          - "string | number[]"
          - "null"
        answer: 1
        explanation: Für `null` wurde die Funktion schon verlassen. TypeScript streicht `null` aus der Union – das nennt man Kontrollflussanalyse.
      - situation: |
          `if (typeof value === "string") { … }` – du stehst **innerhalb** der geschweiften Klammern.
        question: Was darfst du hier aufrufen?
        options:
          - Nur Methoden, die string und number[] gemeinsam haben
          - "Alle String-Methoden wie `value.toUpperCase()`"
          - Gar nichts, value ist noch unknown
        answer: 1
        explanation: "`typeof` grenzt `value` auf `string` ein."
      - situation: |
          Nach dem if-Block mit `return` für Strings folgt `return value.join(", ");`.
        question: Warum meldet TypeScript hier keinen Fehler?
        options:
          - "Weil `value` an dieser Stelle nur noch `number[]` sein kann"
          - "Weil `join` auch auf Strings existiert"
          - Weil TypeScript Methodenaufrufe nie prüft
        answer: 0
        explanation: null und string sind bereits behandelt – übrig bleibt `number[]`, und Arrays haben `join`.
  - id: formen-flaeche
    type: code
    language: ts
    title: Flächen mit einer Discriminated Union
    description: |
      `Shape` ist eine Discriminated Union mit der Eigenschaft `kind`. Ergänze:

      1. `area(shape)` berechnet die Fläche: Kreis `π · r²`, Rechteck `Breite · Höhe`,
         Dreieck `Grundseite · Höhe / 2`. Nutze `switch (shape.kind)`.
      2. Im `default` rufst du `assertNever(shape)` auf. Die Funktion wirft einen Fehler mit dem Text
         `Unbekannte Form`.
      3. `describe(value: unknown)` liefert `"Text mit N Zeichen"`, `"Zahl"`, `"Liste mit N Elementen"`
         oder `"unbekannt"`.
    starter: |
      type Shape =
        | { kind: "circle"; radius: number }
        | { kind: "rect"; width: number; height: number }
        | { kind: "triangle"; base: number; height: number };

      function assertNever(value: never): never {
        throw new Error("TODO");
      }

      function area(shape: Shape): number {
        return 0;
      }

      function describe(value: unknown): string {
        return "unbekannt";
      }
    tests:
      - name: Kreis mit Radius 1
        code: |
          assertEqual(Math.round(area({ kind: "circle", radius: 1 }) * 100), 314)
      - name: Rechteck und Dreieck
        code: |
          assertDeepEqual([area({ kind: "rect", width: 2, height: 3 }), area({ kind: "triangle", base: 4, height: 3 })], [6, 6])
      - name: Unbekannte Form wirft einen Fehler
        code: assertThrows(() => area(JSON.parse('{"kind":"hexagon"}')))
      - name: describe erkennt Text, Zahl und Liste
        code: assertDeepEqual([describe("Hallo"), describe(7), describe([1, 2, 3])], ["Text mit 5 Zeichen", "Zahl", "Liste mit 3 Elementen"])
      - name: describe mit null und Objekt
        code: |
          assertDeepEqual([describe(null), describe({ a: 1 })], ["unbekannt", "unbekannt"])
    solution: |
      type Shape =
        | { kind: "circle"; radius: number }
        | { kind: "rect"; width: number; height: number }
        | { kind: "triangle"; base: number; height: number };

      function assertNever(value: never): never {
        throw new Error(`Unbekannte Form: ${JSON.stringify(value)}`);
      }

      function area(shape: Shape): number {
        switch (shape.kind) {
          case "circle":
            return Math.PI * shape.radius ** 2;
          case "rect":
            return shape.width * shape.height;
          case "triangle":
            return (shape.base * shape.height) / 2;
          default:
            return assertNever(shape);
        }
      }

      function describe(value: unknown): string {
        if (typeof value === "string") return `Text mit ${value.length} Zeichen`;
        if (typeof value === "number") return "Zahl";
        if (Array.isArray(value)) return `Liste mit ${value.length} Elementen`;
        return "unbekannt";
      }
    hints:
      - "Im `case \"circle\"` kennt TypeScript `shape.radius` – in den anderen Zweigen nicht."
      - "`Array.isArray(value)` grenzt `unknown` auf ein Array ein."
---
Eine Funktion bekommt `string | number`. Du willst den Text in Großbuchstaben, die Zahl formatiert. Wie
sagst du TypeScript, welcher Fall gerade vorliegt? Gar nicht extra – du schreibst ganz normale
JavaScript-Prüfungen, und TypeScript liest mit. Das heißt [[narrowing|Narrowing]]: Der Typ wird in jedem
Zweig enger.

## typeof, Wahrheitswerte und Gleichheit

TypeScript verfolgt jeden Pfad durch deinen Code – das heißt [[kontrollflussanalyse|Kontrollflussanalyse]]. Nach einer Prüfung weiß es mehr als vorher:

![Jede Prüfung schneidet Möglichkeiten aus dem Union-Typ weg](/assets/typescript/narrowing.svg)

```ts title="Narrowing mit typeof und ==="
function label(value: string | number | undefined): string {
  if (value === undefined) {
    return "–";                    // value: undefined
  }
  if (typeof value === "string") {
    return value.toUpperCase();    // value: string
  }
  return value.toFixed(2);         // value: number
}
```

| Prüfung | Grenzt ein auf |
|---|---|
| `typeof x === "string"` | `"string"`, `"number"`, `"boolean"`, `"object"`, `"function"` … |
| `x === null`, `x !== undefined` | Entfernt oder behält `null`/`undefined` |
| `if (x)` | Entfernt `null`, `undefined` – Vorsicht: auch `0` und `""` sind falsy |

> [!FEHLER]
> `if (count) …` für eine Zahl ignoriert auch `0`. Für „ist gesetzt?“ prüfst du lieber
> `count !== undefined`. Mehr zu falsy-Werten im Lexikon unter [[truthy-und-falsy]].

## in und instanceof

Bei Objekten hilft `typeof` wenig – es liefert immer `"object"`. Dafür gibt es zwei andere Prüfungen:

```ts title="Objekte unterscheiden"
type Fish = { swim: () => void };
type Bird = { fly: () => void };

function move(animal: Fish | Bird) {
  if ("swim" in animal) {
    animal.swim();          // Fish
  } else {
    animal.fly();           // Bird
  }
}

function format(date: Date | string): string {
  return date instanceof Date ? date.toISOString() : date;
}
```

`in` prüft, ob eine Eigenschaft existiert. `instanceof` prüft, ob ein Objekt mit einer bestimmten
[[klasse|Klasse]] erzeugt wurde – das klappt also nur bei Klassen, nicht bei Interfaces oder Type Aliases.

## Discriminated Unions

Das stärkste Muster: Jedes Mitglied einer Union bekommt eine gemeinsame Eigenschaft mit einem
**Literal-Typ**, meist `kind` oder `type`. Sie heißt Diskriminante. Eine Prüfung darauf grenzt sofort den
ganzen Typ ein. Das ist eine [[discriminated-union|Discriminated Union]].

```ts title="Ergebnis einer Anfrage"
type Result =
  | { status: "loading" }
  | { status: "success"; data: string[] }
  | { status: "error"; message: string };

function render(result: Result): string {
  switch (result.status) {
    case "loading": return "Lädt …";
    case "success": return result.data.join(", "); // data existiert nur hier
    case "error":   return `Fehler: ${result.message}`;
  }
}
```

Unmögliche Zustände wie „lädt, hat aber schon Daten“ lassen sich so gar nicht erst ausdrücken.

> [!PRAXIS]
> Lade-Zustände, API-Ergebnisse, Ereignisse in einem Event-System, Aktionen in einem Reducer – überall
> dort findest du Discriminated Unions. Sie sind das wichtigste Modellierungsmuster in TypeScript.

## Vollständigkeit mit never prüfen

Was passiert, wenn morgen `{ status: "empty" }` dazukommt? Du willst, dass jeder `switch` laut Fehler
meldet. Dafür gibt es den Typ [[never-typ|never]]: Er hat **keinen** einzigen Wert.

```ts title="Exhaustiveness Check"
function assertNever(value: never): never {
  throw new Error(`Unbehandelter Fall: ${JSON.stringify(value)}`);
}

function render(result: Result): string {
  switch (result.status) {
    case "loading": return "Lädt …";
    case "success": return result.data.join(", ");
    case "error":   return `Fehler: ${result.message}`;
    default:        return assertNever(result);
  }
}
```

Sind alle Fälle behandelt, ist `result` im `default` vom Typ `never` – alles passt. Fehlt ein Fall,
landet er dort, und `tsc` meldet: `Argument of type '{ status: "empty"; }' is not assignable to parameter
of type 'never'`.

> [!MERKSATZ]
> `never` im `default` verwandelt „Fall vergessen“ von einem Laufzeitfehler in einen Compilerfehler.

## unknown, any und eigene Type Guards

Daten aus `JSON.parse` oder einem `catch`-Block haben keinen bekannten Typ. Dafür gibt es
[[unknown-typ|unknown]]: Du darfst jeden Wert hineinlegen, aber nichts damit tun, bevor du ihn geprüft
hast. `any` dagegen erlaubt alles und schaltet die Prüfung ab.

Wiederkehrende Prüfungen packst du in einen [[type-guard|Type Guard]] – eine Funktion, deren Rückgabetyp
`wert is Typ` lautet:

```ts title="Ein eigener Type Guard"
type User = { name: string };

function isUser(value: unknown): value is User {
  return typeof value === "object" && value !== null
    && "name" in value && typeof value.name === "string";
}

const data: unknown = JSON.parse('{"name":"Ada"}');
if (isUser(data)) console.log(data.name.toUpperCase()); // data: User
```

Für größere Datenstrukturen werden solche Guards schnell lang. In Modul 4 übernimmt das Zod.

## Zusammenfassung

- **Narrowing**: TypeScript wertet `typeof`, `===`, `in`, `instanceof` und Wahrheitsprüfungen aus.
- Nach einer Prüfung ist der Typ im jeweiligen Zweig enger.
- **Discriminated Unions** nutzen eine gemeinsame Literal-Eigenschaft wie `kind` zur Unterscheidung.
- `never` im `default` meldet vergessene Fälle schon beim Kompilieren.
- `unknown` erzwingt eine Prüfung, `any` schaltet sie ab – nimm `unknown`.
- Eigene **Type Guards** mit `value is Typ` bündeln wiederkehrende Prüfungen.
