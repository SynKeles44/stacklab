---
title: Alltägliche Typen und Typinferenz
summary: Primitive Typen, Arrays, Tupel und Objekttypen – und wann TypeScript die Typen selbst herausfindet.
duration: 25
sources:
  - title: TypeScript Handbook – Everyday Types
    url: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html
  - title: TypeScript Handbook – Object Types
    url: https://www.typescriptlang.org/docs/handbook/2/objects.html
  - title: TypeScript Handbook – Type Inference
    url: https://www.typescriptlang.org/docs/handbook/type-inference.html
quiz:
  - type: single
    question: "Welchen Typ inferiert TypeScript für `let count = 0;`?"
    options:
      - "`0`"
      - "`number`"
      - "`any`"
    answer: 1
    explanation: Bei `let` kann sich der Wert noch ändern, deshalb nimmt TypeScript den allgemeinen Typ `number`.
  - type: multiple
    question: Wo solltest du Typen ausdrücklich hinschreiben?
    options:
      - Bei den Parametern einer Funktion
      - Bei jeder lokalen Variable wie `const name = "Ada"`
      - Beim Rückgabetyp einer exportierten Funktion, damit Änderungen auffallen
      - Bei den Parametern eines Callbacks in `names.map((n) => …)`
    answers: [0, 2]
    explanation: >
      Parameter kann TypeScript nicht erraten. Für Rückgabetypen exportierter Funktionen lohnt sich die
      Angabe als Vertrag. Lokale Variablen und Callback-Parameter inferiert TypeScript selbst.
  - type: find-bug
    question: In welcher Zeile meldet TypeScript einen Fehler?
    language: ts
    code: |
      type Product = { name: string; price: number; tags?: string[] };
      const book: Product = { name: "TypeScript lernen", price: 29 };
      const pen: Product = { name: "Kugelschreiber", price: 2, color: "blau" };
      console.log(book.tags?.length ?? 0);
    bug_line: 3
    explanation: "`color` gibt es im Typ `Product` nicht. Bei Objektliteralen meldet TypeScript überzählige Eigenschaften (excess property check). `tags` ist optional und darf fehlen."
  - type: cloze
    text: "Ein Array von Texten schreibst du als `string___` oder `Array<___>`. Ein Tupel aus Text und Zahl ist `[string, ___]`."
    blanks:
      - ["[]"]
      - [string]
      - [number]
    explanation: "`string[]` und `Array<string>` sind gleichwertig. Ein Tupel legt Länge und Typ jeder Position fest."
tasks:
  - id: inferenz-zuordnen
    type: dragdrop
    title: Was inferiert TypeScript?
    description: Ordne jeder Deklaration den Typ zu, den TypeScript ohne Annotation ermittelt.
    targets:
      - { id: number, label: "number" }
      - { id: numarray, label: "number[]" }
      - { id: objekt, label: "{ id: number; title: string }" }
      - { id: mixed, label: "(string | number)[]" }
    items:
      - { label: "let total = 19.99", target: number }
      - { label: "const prices = [1, 2, 3]", target: numarray }
      - { label: "const post = { id: 7, title: \"Hallo\" }", target: objekt }
      - { label: "const mixed = [1, \"zwei\"]", target: mixed }
  - id: bestellzeile
    type: code
    language: ts
    title: Bestellzeilen formatieren
    description: |
      Schreibe zwei Funktionen mit sauberen Typen:

      1. `formatLine(item)` bekommt ein Objekt mit `name` (Text), `priceCents` (Preis in Cent) und optional
         `quantity`. Fehlt `quantity`, gilt 1. Ergebnis: `"2 × Kaffee = 7,00 €"` (Gesamtpreis mit Komma).
      2. `minMax(values)` bekommt ein Array von Zahlen und gibt das Tupel `[kleinste, größte]` zurück –
         bei einem leeren Array `undefined`.

      Hinweis: Die Tests prüfen das Verhalten zur Laufzeit. Die Typen schreibst du trotzdem vollständig.
    starter: |
      type LineItem = {
        // name, priceCents, quantity (optional)
      };

      function formatLine(item: LineItem): string {
        return "";
      }

      function minMax(values: number[]): [number, number] | undefined {
        return undefined;
      }
    tests:
      - name: formatiert eine Zeile mit Menge
        code: |
          assertEqual(formatLine({ name: "Kaffee", priceCents: 350, quantity: 2 }), "2 × Kaffee = 7,00 €")
      - name: ohne Menge gilt 1
        code: |
          assertEqual(formatLine({ name: "Tee", priceCents: 220 }), "1 × Tee = 2,20 €")
      - name: Preis 0 wird als 0,00 € angezeigt
        code: |
          assertEqual(formatLine({ name: "Probe", priceCents: 0, quantity: 3 }), "3 × Probe = 0,00 €")
      - name: minMax liefert kleinste und größte Zahl
        code: assertDeepEqual(minMax([4, -2, 9, 0]), [-2, 9])
      - name: minMax mit leerem Array
        code: assertEqual(minMax([]), undefined)
    solution: |
      type LineItem = {
        name: string;
        priceCents: number;
        quantity?: number;
      };

      function formatLine(item: LineItem): string {
        const quantity = item.quantity ?? 1;
        const total = (item.priceCents * quantity) / 100;
        return `${quantity} × ${item.name} = ${total.toFixed(2).replace(".", ",")} €`;
      }

      function minMax(values: number[]): [number, number] | undefined {
        if (values.length === 0) return undefined;
        return [Math.min(...values), Math.max(...values)];
      }
    hints:
      - "Mit `quantity?: number` wird die Eigenschaft optional; `item.quantity ?? 1` liefert den Standardwert."
      - "`(cents / 100).toFixed(2)` ergibt `\"7.00\"` – ersetze den Punkt durch ein Komma."
---
Du kennst aus JavaScript Texte, Zahlen, Arrays und Objekte. In TypeScript beschreibst du genau diese Werte
mit Typen. Die gute Nachricht: Meist musst du kaum etwas hinschreiben, weil TypeScript die Typen selbst
erkennt. Diese Lektion zeigt dir die Grundbausteine und wann sich eine Angabe lohnt.

## Die primitiven Typen

Für die [[primitiver-datentyp|primitiven Werte]] von JavaScript gibt es gleichnamige Typen – immer
kleingeschrieben:

| Typ | Beispielwerte |
|---|---|
| `string` | `"Ada"`, `` `Hallo ${name}` `` |
| `number` | `42`, `3.5`, `-1`, `NaN` (ganze und Kommazahlen) |
| `boolean` | `true`, `false` |
| `null` / `undefined` | „absichtlich leer“ / „nicht gesetzt“ |
| `bigint`, `symbol` | selten: sehr große Ganzzahlen, eindeutige Schlüssel |

```ts title="Typ-Annotationen"
let city: string = "Hamburg";
let age: number = 36;
let isAdmin: boolean = false;
let nickname: string | undefined = undefined;
```

Die [[typ-annotation|Annotation]] steht hinter dem Namen, getrennt durch einen Doppelpunkt. Mit `|` sagst
du „das eine **oder** das andere“ – das ist ein [[union-typ|Union-Typ]], dazu mehr im nächsten Modul.

> [!FEHLER]
> `let name: String` mit großem S meint das selten genutzte Wrapper-Objekt von JavaScript. Schreibe
> immer `string`, `number` und `boolean` klein.

## Typinferenz: TypeScript denkt mit

Schreibst du einen Wert direkt hin, erkennt TypeScript den Typ selbst. Das heißt
[[typinferenz|Typinferenz]].

```ts title="Kein Typ nötig"
let count = 0;                       // number
const greeting = "Hallo";            // "Hallo" (const ändert sich nie)
const prices = [9.99, 4.5];          // number[]
const user = { id: 1, name: "Ada" }; // { id: number; name: string }

count = "viel"; // error TS2322: Type 'string' is not assignable to type 'number'.
```

Auch Callback-[[parameter|Parameter]] bekommen ihren Typ aus dem Zusammenhang: In
`prices.map((p) => p * 2)` weiß TypeScript, dass `p` eine Zahl ist.

| Hier lohnt eine Annotation | Hier nicht |
|---|---|
| Funktionsparameter | Lokale Variablen mit Startwert |
| Rückgabetyp exportierter Funktionen | Callback-Parameter |
| Leere Arrays: `const ids: number[] = []` | Werte aus typisierten Funktionen |

> [!MERKSATZ]
> Annotiere die **Ränder** deines Codes (Parameter, öffentliche Rückgaben). Im Inneren lässt du
> TypeScript die Typen ableiten.

## Arrays und Tupel

Ein [[array|Array]], dessen Elemente alle denselben Typ haben, schreibst du als `string[]` oder
gleichwertig `Array<string>`.

Ein [[tupel|Tupel]] ist ein Array mit fester Länge, bei dem jede Position einen eigenen Typ hat. Es
eignet sich für kleine Paare, etwa Koordinaten oder „Wert und Fehler“.

```ts title="Arrays und Tupel"
const names: string[] = ["Ada", "Grace"];
const scores: Array<number> = [12, 7];

const point: [number, number] = [3, 4];
const entry: [string, number] = ["Ada", 36];
const [who, howOld] = entry;   // who: string, howOld: number

point.push("fünf"); // error: 'string' is not assignable to 'number'
```

Bei gemischten Literalen wie `[1, "zwei"]` inferiert TypeScript kein Tupel, sondern `(string | number)[]`
– ein Array, in dem jedes Element Text oder Zahl sein darf.

## Objekttypen

Ein Objekttyp beschreibt, welche [[eigenschaft|Eigenschaften]] ein [[objekt|Objekt]] hat und welchen Typ
jede davon trägt. Ein `?` macht eine Eigenschaft [[optionale-eigenschaft|optional]], `readonly` macht sie
[[readonly|schreibgeschützt]].

```ts title="Objekttypen"
function printUser(user: { readonly id: number; name: string; email?: string }) {
  console.log(user.name.toUpperCase());
  console.log(user.email?.toLowerCase() ?? "keine E-Mail");
  user.id = 2; // error TS2540: Cannot assign to 'id' because it is a read-only property.
}

printUser({ id: 1, name: "Ada" });
printUser({ id: 2, name: "Grace", phone: "123" });
// error TS2353: Object literal may only specify known properties,
//               and 'phone' does not exist in type …
```

Die letzte Zeile zeigt die Prüfung auf überzählige Eigenschaften: Bei einem direkt hingeschriebenen
Objekt meldet TypeScript jeden Schlüssel, den der Typ nicht kennt – meist ein Tippfehler.

> [!PRAXIS]
> Geldbeträge speichern viele Teams als ganze Zahl in Cent (`priceCents: number`). Kommazahlen wie
> `0.1 + 0.2` ergeben in JavaScript `0.30000000000000004` – mit Cent passiert das nicht.

## Funktionen annotieren und any vermeiden

Bei [[funktion|Funktionen]] annotierst du die Parameter und meist auch den
[[rueckgabewert|Rückgabewert]]:

```ts run title="Funktion mit Typen"
function total(prices: number[], discount: number = 0): number {
  const sum = prices.reduce((acc, p) => acc + p, 0);
  return sum - sum * discount;
}
console.log(total([10, 20], 0.1)); // 27
```

Lässt du bei einem Parameter den Typ weg, nimmt TypeScript [[any-typ|any]] an. `any` schaltet die Prüfung
für diesen Wert komplett ab. Mit `strict` ist das verboten: `error TS7006: Parameter 'x' implicitly has an
'any' type.` Das ist gut so – ein `any` breitet sich im Code aus wie ein Loch im Sicherheitsnetz.

## Zusammenfassung

- Primitive Typen: `string`, `number`, `boolean`, `null`, `undefined` – immer kleingeschrieben.
- **Typinferenz** ermittelt Typen aus Werten; annotiere vor allem Parameter und öffentliche Rückgaben.
- Arrays: `T[]` oder `Array<T>`; **Tupel** haben feste Länge und Typen pro Position.
- Objekttypen beschreiben Eigenschaften; `?` macht sie optional, `readonly` schützt vor Überschreiben.
- Überzählige Eigenschaften in Objektliteralen meldet TypeScript als Fehler.
- `any` schaltet die Prüfung ab – mit `strict` sind implizite `any`-Parameter verboten.
