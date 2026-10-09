---
title: Tree Shaking, Peer Dependencies und Typen
summary: Wie Bundler ungenutzten Paketcode entfernen, warum Plugins ihr Host-Paket nicht selbst mitbringen und woher TypeScript die Typen eines Pakets kennt.
duration: 25
sources:
  - title: npm Docs – peerDependencies
    url: https://docs.npmjs.com/cli/v11/configuring-npm/package-json#peerdependencies
  - title: TypeScript Handbook – Type Declarations
    url: https://www.typescriptlang.org/docs/handbook/2/type-declarations.html
  - title: TypeScript – Publishing (types und @types)
    url: https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html
  - title: MDN – Tree shaking
    url: https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking
quiz:
  - type: single
    question: Warum funktioniert Tree Shaking mit ES-Modulen besser als mit CommonJS?
    options:
      - ES-Module sind kleiner.
      - Importe und Exporte von ES-Modulen stehen fest und lassen sich vor dem Ausführen analysieren.
      - CommonJS gibt es im Browser nicht.
      - Tree Shaking ist ein Feature von npm.
    answer: 1
    explanation: Ein Bundler sieht bei `import { add } from …` schon beim Bauen, dass nur `add` gebraucht wird. Bei `require()` weiß er das nicht sicher.
  - type: multiple
    question: Ein Paket bringt keine eigenen Typen mit. Welche Aussagen stimmen?
    options:
      - TypeScript meldet, dass es keine Deklarationsdatei für das Modul findet.
      - Oft gibt es ein Paket @types/<name> aus dem Projekt DefinitelyTyped.
      - "@types-Pakete gehören meistens in die devDependencies."
      - Ohne Typen kann man das Paket in TypeScript überhaupt nicht verwenden.
    answers: [0, 1, 2]
    explanation: Typen brauchst du nur beim Entwickeln und Bauen. Ohne sie geht es zur Not auch – aber dann ist das Paket für TypeScript vom Typ any.
  - type: match
    question: Wohin gehört welches Paket in der package.json einer React-Komponenten-Library?
    pairs:
      - { left: "react", right: "peerDependencies" }
      - { left: "clsx (intern genutzt)", right: "dependencies" }
      - { left: "typescript", right: "devDependencies" }
    explanation: React stellt die App, die deine Library nutzt. Die Library sagt nur, welche Version sie erwartet. Interne Helfer bringt sie selbst mit, Werkzeuge braucht nur die Entwicklung.
  - type: cloze
    text: Eine Typdeklarationsdatei hat die Endung `.___`. Ihren Pfad nennt ein Paket im Feld `___` der package.json.
    blanks:
      - [d.ts]
      - [types, typings]
    explanation: ".d.ts-Dateien enthalten nur Typen, keinen ausführbaren Code. Das Feld types (älter: typings) zeigt TypeScript, wo sie liegen."
tasks:
  - id: typen-nachruesten
    type: terminal
    title: Typen für ein Paket nachrüsten
    description: |
      Im Ordner `typen` liegt ein TypeScript-Projekt: `typescript` ist schon installiert, und `zeit.ts`
      nutzt das Paket `ms`.

      1. Installiere `ms` als normale Abhängigkeit.
      2. Führe `npx tsc` aus. TypeScript beschwert sich, dass es keine Deklarationsdatei für `ms` findet.
      3. Installiere die passenden Typen aus DefinitelyTyped – als **Dev-Abhängigkeit**.
      4. Führe `npx tsc` erneut aus, bis keine Fehler mehr kommen.

      Klicke zuerst auf **Aufgabe vorbereiten** (das dauert ein paar Sekunden).
    workdir: typen
    setup: |
      npm init -y > /dev/null
      npm pkg set type=module
      npm install -D typescript > /dev/null 2>&1
      cat > tsconfig.json <<'EOF'
      {
        "compilerOptions": {
          "strict": true,
          "module": "nodenext",
          "target": "es2024",
          "noEmit": true
        },
        "files": ["zeit.ts"]
      }
      EOF
      printf 'import ms from "ms";\n\nconst dauer: number = ms("90m");\nconsole.log(dauer);\n' > zeit.ts
    checks:
      - type: command
        run: jq -r '.dependencies.ms // empty' package.json
        stdout_matches: "\\d"
        message: ms soll als normale Abhängigkeit in der package.json stehen.
      - type: command
        run: jq -r '.devDependencies["@types/ms"] // empty' package.json
        stdout_matches: "\\d"
        message: "@types/ms fehlt in den devDependencies (npm install -D @types/ms)."
      - type: command
        run: jq -r '.dependencies["@types/ms"] // "ok"' package.json
        stdout_equals: ok
        message: "@types/ms gehört in die devDependencies, nicht in die dependencies."
      - type: command
        run: npx tsc
        message: npx tsc meldet noch Fehler. Sind ms und die Typen installiert?
    hints:
      - "Typen aus DefinitelyTyped heißen immer `@types/<paketname>`."
      - "`npm install -D @types/ms` installiert die Typen als Dev-Abhängigkeit."
    solution: |
      ```bash
      cd typen
      npm install ms
      npx tsc              # error TS7016: Could not find a declaration file for module 'ms'
      npm install -D @types/ms
      npx tsc              # keine Ausgabe = keine Fehler
      ```
  - id: peer-und-shaking
    type: steps
    title: Was passiert als Nächstes?
    description: Spiele drei typische Situationen aus dem Frontend-Alltag durch.
    steps:
      - situation: Deine App importiert aus einer großen Hilfs-Library nur `import { debounce } from "helfer"`. Die Library ist als ES-Modul gebaut, der Bundler erstellt das Produktions-Bundle.
        question: Was landet im Bundle?
        options:
          - Die komplette Library
          - Nur debounce und das, was debounce selbst braucht
          - Gar nichts, Imports werden immer entfernt
        answer: 1
        explanation: Das ist Tree Shaking – ungenutzte Exporte fallen weg, weil der Bundler die statischen Importe kennt.
      - situation: 'Du installierst ein Datepicker-Plugin für React. In dessen package.json steht `"peerDependencies": { "react": "^19.0.0" }`. Deine App nutzt React 19.'
        question: Was macht npm?
        options:
          - Es installiert eine zweite, eigene React-Kopie für das Plugin.
          - Es nutzt das React deiner App – die Version passt zum Bereich.
          - Es bricht ab, weil React doppelt vorkommt.
        answer: 1
        explanation: Peer Dependencies teilen sich die Kopie der App. Genau das ist ihr Zweck – zwei React-Kopien würden Fehler verursachen.
      - situation: 'Ein anderes Plugin verlangt `"react": "^17.0.0"` als Peer. npm meldet ERESOLVE.'
        question: Was ist der beste nächste Schritt?
        options:
          - Sofort npm install --force ausführen
          - Prüfen, ob es eine neuere Plugin-Version für React 19 gibt
          - React auf 17 zurückstufen, ohne nachzudenken
        answer: 1
        explanation: --force überdeckt den Konflikt nur. Meist gibt es eine aktuelle Plugin-Version – oder ein besser gepflegtes Ersatzpaket.
---
Dein Bundle für die Startseite ist 800 KB groß, obwohl du aus einer Library nur eine einzige Funktion
nutzt. Ein React-Plugin installiert sich nicht, weil „die Peer-Abhängigkeiten nicht passen“. Und
TypeScript behauptet, ein Paket habe keine Typen. Drei Alltagsprobleme – eine Lektion.

## Tree Shaking

Im Frontend fasst ein [[bundler|Bundler]] wie Vite alle Module zu wenigen Dateien zusammen, die der Browser
lädt. Dabei schüttelt er den „Baum“ deiner Importe und lässt ungenutzte Exporte herausfallen:
[[tree-shaking|Tree Shaking]].

```js
import { debounce } from "helfer";   // nur debounce wird gebraucht
```

Damit das klappt, braucht es zwei Dinge:

| Voraussetzung | Warum |
|---|---|
| Das Paket ist als **ES-Modul** gebaut | Nur statische `import`/`export` lassen sich sicher analysieren. |
| Module haben keine [[seiteneffekt\|Seiteneffekte]] beim Laden | Sonst darf der Bundler nichts weglassen. Pakete melden das mit `"sideEffects": false`. |

> [!FEHLER]
> **`import * as helfer from "helfer"` und dann nur eine Funktion nutzen.** Moderne Bundler kommen damit
> oft klar, aber bei CommonJS-Paketen landet trotzdem alles im Bundle. Prüfe mit dem Bundle-Report deines
> Bundlers, was wirklich drin ist.

## Peer Dependencies

Manche Pakete erweitern ein anderes Paket: ein Datepicker für React, ein Plugin für Vite. Sie dürfen das
Host-Paket **nicht selbst mitbringen** – zwei React-Kopien in einer App führen zu schwer zu findenden
Fehlern. Stattdessen sagen sie: „Ich erwarte, dass du React in dieser Version hast.“

```json title="package.json eines React-Plugins"
{
  "peerDependencies": { "react": "^19.0.0" }
}
```

Das ist eine [[peerdependency|Peer Dependency]]. npm installiert passende Peers seit Version 7 automatisch.
Passen die Versionen nicht, bricht npm mit **ERESOLVE** ab.

> [!MERKSATZ]
> `dependencies`: „Das bringe ich mit.“ `peerDependencies`: „Das muss die App mitbringen.“

## Typen für Pakete

TypeScript muss wissen, welche Funktionen ein Paket hat und welche Typen sie erwarten. Diese Information
steht in [[typdeklaration|Typdeklarationen]] – Dateien mit der Endung `.d.ts`:

```ts title="index.d.ts"
export declare function slugify(text: string): string;
```

Es gibt zwei Quellen:

| Quelle | Woran erkennst du sie? | Beispiel |
|---|---|---|
| **Mitgeliefert** (*bundled types*) | Feld `types` in der package.json, `.d.ts` im Paket | picocolors, Vite, Zod |
| **DefinitelyTyped** | Separates Paket `@types/<name>` | `@types/ms`, `@types/node` |

[[definitelytyped|DefinitelyTyped]] ist ein Community-Projekt, das Typen für Pakete sammelt, die selbst
keine mitbringen. Typen brauchst du nur beim Entwickeln – sie gehören in die `devDependencies`.

Auch in reinem JavaScript profitierst du davon: Editoren wie VS Code oder PhpStorm lesen die `.d.ts`-Dateien
und zeigen dir beim Tippen, welche Funktionen ein Paket hat und welche Argumente sie erwarten.

## Fehlende Typen erkennen und beheben

Fehlen die Typen, meldet TypeScript:

```text title="npx tsc"
error TS7016: Could not find a declaration file for module 'ms'.
```

So gehst du vor:

1. Prüfen, ob das Paket Typen mitbringt: `npm view <paket> types` oder das TS-Symbol auf npmjs.com.
2. Wenn nicht: `npm install -D @types/<paket>`.
3. Gibt es auch dort nichts, schreibst du eine kleine eigene `.d.ts` – oder wählst ein anderes Paket.

> [!PRAXIS]
> Beim Auswählen eines Pakets ist „bringt eigene Typen mit“ ein echtes Qualitätsmerkmal. Mitgelieferte
> Typen passen immer zur installierten Version – `@types`-Pakete hinken manchmal hinterher.

## Zusammenfassung

- **Tree Shaking** entfernt ungenutzte Exporte – vorausgesetzt, das Paket ist ESM und frei von Seiteneffekten.
- **Peer Dependencies** beschreiben das Host-Paket (z. B. React), das die App mitbringen muss.
- ERESOLVE heißt: Peer-Versionen passen nicht. Erst nach einer passenden Version suchen, nicht blind `--force`.
- Typen stehen in `.d.ts`-Dateien – mitgeliefert (Feld `types`) oder als `@types/<name>` von DefinitelyTyped.
- Typ-Pakete installierst du als **devDependencies**.
