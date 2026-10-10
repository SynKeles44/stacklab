---
title: Interfaces und Type Aliases
summary: Wie du Datenformen mit type und interface benennst, erweiterst und wann du welches Werkzeug nimmst.
duration: 20
sources:
  - title: TypeScript Handbook – Everyday Types (Type Aliases, Interfaces)
    url: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-aliases
  - title: TypeScript Handbook – Object Types
    url: https://www.typescriptlang.org/docs/handbook/2/objects.html
quiz:
  - type: single
    question: Was kann nur ein `type`, aber kein `interface`?
    options:
      - Eigenschaften mit `?` als optional markieren
      - Einen Union-Typ wie `"light" | "dark"` benennen
      - Einen anderen Objekttyp erweitern
    answer: 1
    explanation: Ein Interface beschreibt immer die Form eines Objekts. Unions, Tupel oder primitive Typen benennst du mit `type`.
  - type: multiple
    question: Welche Schreibweisen beschreiben ein Objekt, dessen Schlüssel beliebige Texte und dessen Werte Zahlen sind?
    options:
      - "`{ [key: string]: number }`"
      - "`Record<string, number>`"
      - "`number[]`"
      - "`[string, number]`"
    answers: [0, 1]
    explanation: Die Index-Signatur und `Record<string, number>` sind gleichwertig. `number[]` ist ein Array, `[string, number]` ein Tupel.
  - type: find-bug
    question: In welcher Zeile meldet TypeScript einen Fehler?
    language: ts
    code: |
      interface Point { readonly x: number; readonly y: number }
      interface Point3D extends Point { z: number }
      const p: Point3D = { x: 1, y: 2, z: 3 };
      p.z = 4;
      p.x = 5;
    bug_line: 5
    explanation: "`x` ist in `Point` als `readonly` markiert, und `Point3D` erbt das. `z` ist nicht readonly und darf geändert werden."
  - type: cloze
    text: "Mit `interface Admin ___ User { … }` erweitert ein Interface ein anderes. Bei Type Aliases verbindest du Typen mit dem Operator `___`."
    blanks:
      - [extends]
      - ["&"]
    explanation: "`extends` erbt alle Eigenschaften. Bei `type` erzeugt `&` einen Schnittmengentyp (Intersection) mit den Eigenschaften beider Typen."
tasks:
  - id: interface-oder-type
    type: dragdrop
    title: interface oder type?
    description: Ordne jede Aufgabe dem Werkzeug zu, das sie erledigen kann. Was beide können, landet in der Mitte.
    targets:
      - { id: nur-type, label: Nur mit type }
      - { id: beide, label: Mit beiden }
      - { id: nur-interface, label: Nur mit interface }
    items:
      - { label: "Union benennen: \"de\" | \"en\"", target: nur-type }
      - { label: "Tupel benennen: [number, number]", target: nur-type }
      - { label: "Objektform mit optionalen Eigenschaften", target: beide }
      - { label: "Einen Objekttyp um Felder erweitern", target: beide }
      - { label: "Zwei gleichnamige Deklarationen automatisch zusammenführen", target: nur-interface }
  - id: typen-fuer-api
    type: terminal
    title: Typen für eine Benutzer-API schreiben
    description: |
      Im Ordner `typen-fuer-api` liegt `src/usage.ts`. Diese Datei benutzt die Typen `User`, `Admin` und
      `UserMap` aus `src/types.ts` – aber `types.ts` ist noch leer. Zeilen mit `// @ts-expect-error` sind
      **absichtlich falsch**: Dort **muss** dein Typ einen Fehler auslösen, sonst meldet `tsc` die Zeile.

      1. Lies `src/usage.ts` genau.
      2. Schreibe in `src/types.ts` drei exportierte Typen:
         - `User` mit `id` (Zahl), `name` (Text), optional `email` (Text) und dem schreibgeschützten
           `createdAt` (Text).
         - `Admin`: ein `User` mit zusätzlich `permissions` (Array von Texten).
         - `UserMap`: ein Objekt, dessen Schlüssel Texte und dessen Werte `User` sind.
      3. Ändere `src/usage.ts` nicht. `npx tsc --noEmit` muss fehlerfrei durchlaufen.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: typen-fuer-api
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
      printf '// Schreibe hier die Typen User, Admin und UserMap.\nexport {};\n' > src/types.ts
      cat > src/usage.ts <<'TS'
      import type { Admin, User, UserMap } from "./types.ts";

      const ada: User = { id: 1, name: "Ada", createdAt: "2026-10-01" };
      const grace: User = { id: 2, name: "Grace", email: "grace@example.com", createdAt: "2026-10-02" };
      const boss: Admin = { ...ada, permissions: ["users:write"] };
      const byId: UserMap = { "1": ada, "2": grace };
      const maybe: User | undefined = byId["3"];

      // @ts-expect-error – id muss eine Zahl sein
      const wrongId: User = { id: "3", name: "Linus", createdAt: "2026-10-03" };
      // @ts-expect-error – createdAt fehlt
      const missing: User = { id: 4, name: "Margaret" };
      // @ts-expect-error – createdAt ist schreibgeschützt
      ada.createdAt = "2026-01-01";
      // @ts-expect-error – ein Admin braucht permissions
      const noPermissions: Admin = { ...grace };
      // @ts-expect-error – die Werte einer UserMap müssen User sein
      const broken: UserMap = { "5": "Barbara" };

      export { boss, maybe, wrongId, missing, noPermissions, broken };
      TS
      sha256sum src/usage.ts > .usage.sha256
    checks:
      - type: command
        run: sha256sum -c --quiet .usage.sha256
        message: src/usage.ts wurde verändert. Setze die Aufgabe zurück oder stelle die Datei wieder her – nur types.ts soll sich ändern.
      - type: command
        run: "! grep -nE '\\bany\\b|@ts-ignore' src/types.ts"
        message: In src/types.ts steht any oder @ts-ignore. Beschreibe die Typen genau.
      - type: command
        run: npx tsc --noEmit
        expect_exit: 0
        message: "`npx tsc --noEmit` meldet noch Fehler. „Unused '@ts-expect-error' directive“ heißt: Dein Typ ist an dieser Stelle noch zu großzügig."
    hints:
      - "Starte mit `export interface User { … }`. Schreibgeschützt wird eine Eigenschaft mit `readonly`, optional mit `?`."
      - "`export interface Admin extends User { permissions: string[] }` übernimmt alle Felder von User."
      - "Für die Map: `export type UserMap = Record<string, User>;` oder `{ [id: string]: User }`."
    solution: |
      ```ts
      export interface User {
        id: number;
        name: string;
        email?: string;
        readonly createdAt: string;
      }

      export interface Admin extends User {
        permissions: string[];
      }

      export type UserMap = Record<string, User>;
      ```
---
In der letzten Lektion hast du Objekttypen direkt an Parameter geschrieben. Brauchst du dieselbe Form an
zehn Stellen, kopierst du sie zehnmal – und änderst beim nächsten neuen Feld neun davon. Besser: Du gibst
der Form einen **Namen**. Dafür hat TypeScript zwei Werkzeuge, `type` und `interface`.

## Type Aliases: Typen einen Namen geben

Ein [[typ-alias|Type Alias]] ist ein Name für einen beliebigen Typ. Er beginnt mit dem
[[schluesselwort|Schlüsselwort]] `type`:

```ts title="Type Aliases"
type UserId = number;
type Point = { x: number; y: number };
type Language = "de" | "en";          // Union – mehr dazu in der nächsten Lektion
type Range = [start: number, end: number];

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
```

Ein Alias erzeugt keinen neuen Typ, sondern nur einen zweiten Namen. `UserId` und `number` sind
austauschbar. Wie ein Kontakt im Telefonbuch: Der Name ist bequemer als die Nummer, gemeint ist dasselbe.

## Interfaces: Verträge für Objekte

Ein [[ts-interface|Interface]] beschreibt ausschließlich die Form eines Objekts. Statt `=` steht direkt
die geschweifte Klammer:

```ts title="Ein Interface"
interface User {
  id: number;
  name: string;
  email?: string;            // optional
  readonly createdAt: string; // nach dem Anlegen nicht mehr änderbar
}

const ada: User = { id: 1, name: "Ada", createdAt: "2026-10-01" };
```

Interfaces kennst du vielleicht aus [[oop|objektorientierten]] Sprachen wie PHP. In TypeScript sind sie
allgemeiner: Sie beschreiben jedes Objekt, nicht nur [[klasse|Klassen]]. Ob ein Wert passt, entscheidet
allein seine **Form** – das nennt man [[strukturelle-typisierung|strukturelle Typisierung]].

> [!MERKSATZ]
> TypeScript prüft die **Form**, nicht den Namen. Jedes Objekt mit `id`, `name` und `createdAt` passt zu
> `User`, egal woher es kommt.

> [!TIPP]
> Ob ein Typ streng genug ist, testest du mit einem [[ts-expect-error|Expect-Error-Kommentar]] (`// @ts-expect-error`) über einer
> absichtlich falschen Zeile. Meldet `tsc` dort **keinen** Fehler, beschwert es sich über die unnötige
> Markierung – dein Typ ist dann zu großzügig. Diese Technik nutzen die Übungen in diesem Kurs.

## Erweitern: extends und &

Oft baut ein Typ auf einem anderen auf. Ein Admin ist ein User mit zusätzlichen Rechten:

```ts title="Zwei Wege zur Erweiterung"
interface Admin extends User {
  permissions: string[];
}

type Moderator = User & {
  channels: string[];
};
```

`extends` übernimmt alle Eigenschaften des Basis-Interfaces. Bei Type Aliases nutzt du `&`, den
[[intersection-typ|Intersection-Typ]]: Ein Wert muss **beide** Teile erfüllen. Beide Wege führen hier zum
selben Ergebnis. `extends` meldet Konflikte (gleicher Name, anderer Typ) allerdings sofort und deutlicher.

## Index-Signaturen und Record

Manchmal kennst du die Schlüssel vorher nicht – etwa bei einem Nachschlagewerk von User-IDs zu Usern.
Dann hilft eine [[index-signatur|Index-Signatur]]:

```ts title="Objekte als Wörterbuch"
interface UserMap {
  [id: string]: User;
}
type Prices = Record<string, number>;   // gleichwertige Kurzform

const prices: Prices = { apple: 120, pear: 95 };
const kiwi = prices["kiwi"];  // number | undefined (mit noUncheckedIndexedAccess)
```

`Record<K, V>` ist ein eingebauter Hilfstyp, ein sogenannter [[utility-type|Utility Type]]. Weitere lernst
du in Modul 3 kennen.

> [!FEHLER]
> Ohne `noUncheckedIndexedAccess` behauptet TypeScript, `prices["kiwi"]` sei immer eine `number`. Die
> Option macht ehrlich sichtbar, dass ein Schlüssel fehlen kann.

## type oder interface?

Für Objektformen können beide fast alles. Die Unterschiede sind klein, aber merkenswert:

| Eigenschaft | `type` | `interface` |
|---|---|---|
| Objektform beschreiben | ja | ja |
| Union, Tupel, primitive Typen benennen | ja | nein |
| Erweitern | mit `&` | mit `extends` |
| Gleichnamige Deklarationen werden zusammengeführt | nein (Fehler) | ja |

Das Zusammenführen heißt [[declaration-merging|Declaration Merging]]. Schreibst du `interface Window { myApp: App }`, ergänzt du
das vorhandene `Window`-Interface. Für eigene Daten ist das eher selten gewünscht.

> [!PRAXIS]
> Viele Teams legen eine Regel fest, etwa: „`interface` für Objektformen, `type` für alles andere.“
> Wichtiger als die Wahl ist, dass das ganze Projekt einheitlich ist – oft erzwingt ein
> [[linter|Linter]] die Hausregel.

## Zusammenfassung

- `type` gibt **jedem** Typ einen Namen, `interface` beschreibt die Form von Objekten.
- TypeScript prüft strukturell: Passt die Form, passt der Wert.
- Erweitern mit `extends` (Interface) oder `&` (Intersection).
- Index-Signaturen und `Record<K, V>` beschreiben Objekte mit unbekannten Schlüsseln.
- Unions und Tupel gehen nur mit `type`; Declaration Merging nur mit `interface`.
- Wichtig ist eine einheitliche Regel im Team.
