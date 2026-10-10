---
title: TypeScript strict als Qualitätswerkzeug
summary: Wie du den TypeScript-Compiler mit tsc --noEmit als statische Analyse einsetzt, was strict einschaltet, welche Zusatzoptionen wie noUncheckedIndexedAccess sich lohnen und wie du die Fehler sauber behebst.
duration: 25
sources:
  - title: TypeScript – TSConfig Reference (strict)
    url: https://www.typescriptlang.org/tsconfig/#strict
  - title: TypeScript – noUncheckedIndexedAccess
    url: https://www.typescriptlang.org/tsconfig/#noUncheckedIndexedAccess
  - title: TypeScript – exactOptionalPropertyTypes
    url: https://www.typescriptlang.org/tsconfig/#exactOptionalPropertyTypes
  - title: TypeScript – tsc CLI Options
    url: https://www.typescriptlang.org/docs/handbook/compiler-options.html
quiz:
  - type: single
    question: Wozu dient `tsc --noEmit` in einer Qualitäts-Pipeline?
    options:
      - Es prüft alle Typen im Projekt, ohne JavaScript-Dateien zu erzeugen.
      - Es formatiert TypeScript-Dateien.
      - Es entfernt alle Typen aus dem Code.
      - Es startet die Anwendung im Testmodus.
    answer: 0
    explanation: Bauen übernimmt meist ein Bundler wie Vite. `tsc` wird dann nur noch als Typprüfer genutzt – genau wie PHPStan für PHP.
  - type: multiple
    question: "Welche Optionen schaltet `strict: true` ein?"
    options: [strictNullChecks, noImplicitAny, noUncheckedIndexedAccess, useUnknownInCatchVariables]
    answers: [0, 1, 3]
    explanation: "`noUncheckedIndexedAccess` gehört nicht zur strict-Familie und muss extra eingeschaltet werden."
  - type: find-bug
    question: Mit `noUncheckedIndexedAccess` meldet TypeScript hier einen Fehler. In welcher Zeile?
    language: ts
    code: |
      const prices: number[] = [450, 200];
      const sum = prices.reduce((a, b) => a + b, 0);
      const first: number = prices[0];
      console.log(sum, first);
    bug_line: 3
    explanation: "`prices[0]` hat mit dieser Option den Typ `number | undefined` – das Array könnte leer sein."
  - type: match
    question: Ordne jede Fehlermeldung ihrer Ursache zu.
    pairs:
      - { left: "Parameter 'input' implicitly has an 'any' type.", right: "noImplicitAny – Typangabe fehlt" }
      - { left: "'user' is possibly 'undefined'.", right: "strictNullChecks – undefined nicht behandelt" }
      - { left: "Object is possibly 'undefined'. (bei users[0])", right: "noUncheckedIndexedAccess – Index-Zugriff" }
    explanation: Die Meldungen nennen die Ursache recht direkt. Der Fehlercode (z. B. TS7006) hilft beim Nachschlagen.
tasks:
  - id: typescript-strict
    type: terminal
    title: Ein Projekt auf strict umstellen
    description: |
      Im Ordner `typescript-strict` liegt `src/users.ts`. Die `tsconfig.json` hat `strict` ausgeschaltet – deshalb
      meldet TypeScript keine Fehler, obwohl der Code bei leeren Listen und fehlenden E-Mails abstürzt.

      1. Installiere TypeScript als Entwicklungsabhängigkeit: `npm i -D typescript`.
      2. Stelle in der `tsconfig.json` `strict` auf `true` und schalte zusätzlich `noUncheckedIndexedAccess` ein.
      3. Starte `npx tsc` (die Konfiguration enthält schon `noEmit`) und behebe alle Fehler im Code – **ohne** `any`,
         `!` oder `@ts-ignore`. Gewünschtes Verhalten:
         - `displayName()` liefert für eine unbekannte ID `UNBEKANNT`.
         - `firstEmail()` liefert für eine leere Liste oder einen Nutzer ohne E-Mail `keine`.
         - `parse()` bekommt einen `string`.
         - `mailDomain()` liefert ohne E-Mail einen leeren String.
      4. Wiederhole `npx tsc`, bis keine Ausgabe mehr kommt.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: typescript-strict
    setup: |
      cat > package.json <<'EOF'
      {
        "name": "strict-uebung",
        "private": true,
        "type": "module"
      }
      EOF
      cat > tsconfig.json <<'EOF'
      {
        "compilerOptions": {
          "target": "es2022",
          "module": "nodenext",
          "strict": false,
          "noEmit": true
        },
        "include": ["src"]
      }
      EOF
      mkdir -p src
      cat > src/users.ts <<'EOF'
      export interface User {
        id: number;
        name: string;
        email?: string;
      }

      export function findUser(users: User[], id: number) {
        return users.find((u) => u.id === id);
      }

      export function displayName(users: User[], id: number): string {
        const user = findUser(users, id);
        return user.name.toUpperCase();
      }

      export function firstEmail(users: User[]): string {
        return users[0].email ?? "keine";
      }

      export function parse(input) {
        return input.trim().split(",");
      }

      export function mailDomain(user: User): string {
        return user.email.split("@")[1];
      }
      EOF
    checks:
      - type: command
        run: test -x node_modules/.bin/tsc && jq -e '.devDependencies.typescript' package.json
        message: TypeScript ist noch nicht im Projekt installiert. Führe npm i -D typescript aus.
      - type: command
        run: ./node_modules/.bin/tsc --showConfig | jq -r '.compilerOptions.strict'
        stdout_equals: "true"
        message: Stelle in der tsconfig.json "strict" auf true.
      - type: command
        run: ./node_modules/.bin/tsc --showConfig | jq -r '.compilerOptions.noUncheckedIndexedAccess'
        stdout_equals: "true"
        message: Schalte in der tsconfig.json zusätzlich "noUncheckedIndexedAccess" ein.
      - type: command
        run: "! grep -Eq 'any|@ts-ignore|@ts-expect-error|[a-zA-Z)\\]]!\\.' src/users.ts"
        message: Behebe die Fehler ohne any, ohne @ts-ignore und ohne den Non-Null-Operator (!).
      - type: command
        run: ./node_modules/.bin/tsc
        message: tsc meldet noch Typfehler. Lies jede Meldung und behandle den undefined-Fall.
      - type: command
        run: "node --input-type=module -e \"import { displayName, firstEmail, mailDomain, parse } from './src/users.ts'; const u = [{ id: 1, name: 'ada', email: 'ada@example.com' }]; console.log([displayName(u, 1), displayName(u, 2), firstEmail([]), firstEmail(u), mailDomain({ id: 2, name: 'bob' }), parse(' a,b ').length].join('|'));\""
        stdout_equals: "ADA|UNBEKANNT|keine|ada@example.com||2"
        message: "Das Verhalten stimmt noch nicht. Erwartet: ADA|UNBEKANNT|keine|ada@example.com||2 (leere Domain ohne E-Mail)."
    hints:
      - "Beginne mit `npx tsc` – jede Meldung nennt Datei, Zeile und Ursache."
      - "Optional Chaining hilft: `users[0]?.email ?? 'keine'` und `user?.name.toUpperCase() ?? 'UNBEKANNT'`."
      - "Für `mailDomain()` passt `user.email?.split('@')[1] ?? ''`, für `parse()` der Typ `input: string`."
    solution: |
      ```bash
      cd typescript-strict
      npm i -D typescript
      jq '.compilerOptions.strict = true | .compilerOptions.noUncheckedIndexedAccess = true' tsconfig.json > t.json && mv t.json tsconfig.json
      npx tsc
      sed -i 's/return user.name.toUpperCase();/return user?.name.toUpperCase() ?? "UNBEKANNT";/' src/users.ts
      sed -i 's/return users\[0\].email ?? "keine";/return users[0]?.email ?? "keine";/' src/users.ts
      sed -i 's/export function parse(input) {/export function parse(input: string): string[] {/' src/users.ts
      sed -i 's/return user.email.split("@")\[1\];/return user.email?.split("@")[1] ?? "";/' src/users.ts
      npx tsc
      ```
  - id: strict-code
    type: code
    language: ts
    title: Sicher auf eine Liste zugreifen
    description: |
      Schreibe die Funktion `cheapest(prices: number[]): number | null`. Sie liefert den kleinsten Preis oder `null`,
      wenn die Liste leer ist. Schreibe sie so, als wäre `noUncheckedIndexedAccess` eingeschaltet: `prices[0]` hat
      dann den Typ `number | undefined` – behandle das, statt es mit `!` zu überspielen.
    starter: |
      function cheapest(prices: number[]): number | null {
        // dein Code
      }
    tests:
      - name: findet den kleinsten Preis
        code: assertEqual(cheapest([450, 200, 990]), 200)
      - name: liefert null bei leerer Liste
        code: assertEqual(cheapest([]), null)
      - name: funktioniert mit einem einzigen Preis
        code: assertEqual(cheapest([0]), 0)
      - name: funktioniert mit negativen Werten
        code: assertEqual(cheapest([5, -3, 2]), -3)
    solution: |
      function cheapest(prices: number[]): number | null {
        const first = prices[0];
        if (first === undefined) {
          return null;
        }
        let min = first;
        for (const price of prices) {
          if (price < min) {
            min = price;
          }
        }
        return min;
      }
    hints:
      - Lies `prices[0]` in eine Variable und prüfe sie auf `undefined`.
      - Achtung bei `cheapest([0])` – `0` ist falsy, prüfe also ausdrücklich auf `undefined`, nicht mit `if (!first)`.
---
TypeScript ist nur so streng, wie du es einstellst. Mit lockerer Konfiguration lässt der Compiler
`user.name` durchgehen, obwohl `user` `undefined` sein kann – und im Browser erscheint
`Cannot read properties of undefined`. Richtig eingestellt ist der Compiler dein bestes
Qualitätswerkzeug für JavaScript-Code. Diese Lektion zeigt, wie.

## tsc als Prüfwerkzeug

In modernen Projekten übersetzt meist ein Bundler wie Vite oder eine Laufzeit wie Bun den TypeScript-Code.
Diese Werkzeuge **entfernen die Typen nur** – sie prüfen sie nicht. Die Typprüfung übernimmt der
TypeScript-[[compiler|Compiler]] `tsc`, und zwar ohne Dateien zu erzeugen:

```bash title="Terminal"
npm i -D typescript
npx tsc --noEmit        # alle Dateien aus der tsconfig.json prüfen
echo $?                 # 0 = keine Typfehler
```

Damit ist `tsc` für TypeScript, was [[phpstan|PHPStan]] für PHP ist: [[statische-analyse|statische Analyse]]
über alle Wege durch den Code. In der `package.json` steht dafür meist ein Skript wie
`"typecheck": "tsc --noEmit"`.

> [!FEHLER]
> `npx tsc --noEmit src/users.ts` – mit einem Dateinamen ignoriert `tsc` die `tsconfig.json`. TypeScript 7
> bricht deshalb mit dem Fehler TS5112 ab. Rufe `tsc` ohne Dateinamen auf, dann gilt deine Konfiguration.

## Was strict einschaltet

`strict` ist ein Sammelschalter für eine ganze Familie strenger Prüfungen ([[typescript-strict|strict-Modus]]):

| Option | Was sie verlangt |
|---|---|
| `strictNullChecks` | `null` und `undefined` müssen behandelt werden |
| `noImplicitAny` | Wo TypeScript keinen Typ ableiten kann, musst du einen angeben |
| `strictFunctionTypes` | Funktionsparameter werden genau verglichen |
| `strictPropertyInitialization` | Klassen-Eigenschaften müssen im Konstruktor gesetzt werden |
| `useUnknownInCatchVariables` | Der Fehler in `catch (e)` ist `unknown`, nicht `any` |
| `alwaysStrict`, `noImplicitThis`, `strictBindCallApply` … | weitere Prüfungen |

In TypeScript 7 ist `strict` standardmäßig eingeschaltet, und `tsc --init` legt eine strenge Konfiguration an.
In älteren Projekten steht dagegen oft noch `"strict": false` – dann fehlen genau die Prüfungen, die
Abstürze verhindern.

> [!MERKSATZ]
> Ohne `strictNullChecks` ist jeder Typ heimlich „oder `undefined`“. Mit `strict` wird das sichtbar – und
> du musst entscheiden, was in diesem Fall passieren soll.

## Strenger als strict

Zwei Optionen gehören nicht zu `strict`, lohnen sich aber, und `tsc --init` schaltet beide ein:

```json title="tsconfig.json"
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

- **`noUncheckedIndexedAccess`** – `users[0]` hat den Typ `User | undefined`, denn das Array könnte leer sein.
  Dasselbe gilt für Zugriffe über eine [[index-signatur|Index-Signatur]] wie `Record<string, string>`.
- **`exactOptionalPropertyTypes`** – eine [[optionale-eigenschaft|optionale Eigenschaft]] `email?: string`
  darf fehlen, aber nicht ausdrücklich auf `undefined` gesetzt werden.

## Fehler richtig beheben

Für die typischen Meldungen gibt es saubere Lösungen:

```ts title="Vorher → nachher"
// 'user' is possibly 'undefined'
return user.name.toUpperCase();
return user?.name.toUpperCase() ?? "UNBEKANNT";

// Object is possibly 'undefined' (noUncheckedIndexedAccess)
return users[0].email ?? "keine";
return users[0]?.email ?? "keine";

// Parameter 'input' implicitly has an 'any' type
export function parse(input) {}
export function parse(input: string): string[] {}
```

Drei Abkürzungen solltest du vermeiden, weil sie die Prüfung nur abschalten statt das Problem zu lösen:

| Abkürzung | Warum schlecht |
|---|---|
| `as any` / Typ `any` | Schaltet die Typprüfung für diesen Wert komplett ab ([[any-typ\|any]]) |
| `user!.name` | Behauptet „ist nie undefined“ – stimmt das nicht, stürzt es trotzdem ab |
| `// @ts-ignore` | Versteckt die Meldung, egal welche |

> [!PRAXIS]
> Biome kennt passende Lint-Regeln: `noExplicitAny` meldet `any`, `noNonNullAssertion` den `!`-Operator.
> Zusammen mit `tsc --noEmit` ist so sichergestellt, dass niemand die Strenge heimlich umgeht.

## Zusammenfassung

- `tsc --noEmit` ist die statische Analyse für TypeScript; Bundler entfernen Typen nur, ohne sie zu prüfen.
- `strict` schaltet eine Familie von Prüfungen ein, allen voran `strictNullChecks` und `noImplicitAny`.
- `noUncheckedIndexedAccess` und `exactOptionalPropertyTypes` machen Index-Zugriffe und optionale Felder sicher.
- Fehler behebst du mit Typangaben, `?.`, `??` und echten Prüfungen – nicht mit `any`, `!` oder `@ts-ignore`.
- Ruf `tsc` ohne Dateinamen auf, sonst wird die `tsconfig.json` nicht verwendet.
