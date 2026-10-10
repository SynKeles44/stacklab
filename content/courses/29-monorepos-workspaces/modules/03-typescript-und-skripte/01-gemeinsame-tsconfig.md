---
title: Eine gemeinsame TypeScript-Konfiguration
summary: Wie alle Pakete eines Monorepos eine tsconfig-Basis teilen – als eigenes internes Paket mit extends – und was TypeScript 7 dabei schon voreinstellt.
duration: 25
sources:
  - title: TypeScript Docs – tsconfig extends
    url: https://www.typescriptlang.org/tsconfig/#extends
  - title: TypeScript Docs – What is a tsconfig.json
    url: https://www.typescriptlang.org/docs/handbook/tsconfig-json.html
  - title: Announcing TypeScript 7.0
    url: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
  - title: Bun Docs – Catalogs
    url: https://bun.com/docs/pm/catalogs
quiz:
  - type: single
    question: 'Was macht `"extends": "@kiosk/tsconfig/base.json"` in einer tsconfig.json?'
    options:
      - Es kopiert die Datei base.json in den Paketordner.
      - Es übernimmt alle Einstellungen aus base.json; eigene Angaben in der Datei überschreiben sie.
      - Es installiert das Paket @kiosk/tsconfig aus der Registry.
      - Es fasst alle Pakete zu einem TypeScript-Projekt zusammen.
    answer: 1
    explanation: extends erbt Einstellungen. Was in der erbenden Datei steht, gewinnt. TypeScript findet das Paket wie einen normalen Import über node_modules.
  - type: multiple
    question: Welche Einstellungen gehören typischerweise in die gemeinsame Basis, welche ins Paket? Wähle die, die in die **Basis** gehören.
    options:
      - '"strict": true'
      - '"noUncheckedIndexedAccess": true'
      - '"include": ["src"]'
      - '"skipLibCheck": true'
    answers: [0, 1, 3]
    explanation: Pfadangaben wie include, rootDir und outDir werden relativ zur Datei aufgelöst, in der sie stehen. Sie gehören deshalb ins jeweilige Paket.
  - type: cloze
    text: 'In TypeScript 7 ist `strict` standardmäßig ___. Mit `tsc --___ -p apps/web` siehst du die fertig zusammengesetzte Konfiguration eines Pakets.'
    blanks:
      - ["true", an, eingeschaltet, aktiv]
      - [showConfig]
    explanation: TypeScript 7 hat mehrere Standardwerte geändert. --showConfig zeigt das Ergebnis aus extends und eigenen Angaben.
  - type: find-bug
    question: TypeScript meldet, dass es die Basis-Konfiguration nicht findet. In welcher Zeile liegt die Ursache?
    language: json
    code: |
      {
        "name": "@kiosk/web",
        "version": "0.1.0",
        "dependencies": {
          "react": "catalog:"
        }
      }
      // tsconfig.json: { "extends": "@kiosk/tsconfig/base.json" }
    bug_line: 4
    explanation: '@kiosk/tsconfig fehlt in den Abhängigkeiten (meist als devDependency mit "workspace:*"). Ohne Eintrag gibt es keinen Link in node_modules, also findet TypeScript das Paket nicht.'
tasks:
  - id: tsconfig-teilen
    type: terminal
    title: Eine Basis für alle
    description: |
      Im Monorepo `tsconfig-teilen` haben `apps/web` und `apps/api` je eine eigene, recht lockere tsconfig.json.
      Das leere Paket `packages/tsconfig` (`@kiosk/tsconfig`) ist schon angelegt, TypeScript 7 ist installiert.

      1. Lege `packages/tsconfig/base.json` an mit diesen `compilerOptions`: `"strict": true`,
         `"noUncheckedIndexedAccess": true`, `"target": "es2022"`, `"module": "preserve"`,
         `"moduleResolution": "bundler"`, `"noEmit": true`, `"skipLibCheck": true`.
      2. Ersetze die tsconfig.json in **beiden** Apps durch `"extends": "@kiosk/tsconfig/base.json"` plus
         `"include": ["src"]`.
      3. Trage in beiden Apps `@kiosk/tsconfig` als `devDependency` mit `workspace:*` ein und führe `bun install` aus.
      4. Prüfe mit `bunx tsc -p apps/web` und `bunx tsc -p apps/api`. Die strengere Basis deckt in `apps/web`
         einen Fehler auf – behebe ihn im Code, ohne die Basis zu lockern.

      Klicke zuerst auf **Aufgabe vorbereiten** (das dauert ein paar Sekunden).
    workdir: tsconfig-teilen
    setup: |
      mkdir -p apps/web/src apps/api/src packages/tsconfig
      cat > package.json <<'EOF'
      {
        "name": "kiosk",
        "private": true,
        "workspaces": {
          "packages": ["apps/*", "packages/*"],
          "catalog": { "typescript": "^7.0.2" }
        },
        "devDependencies": { "typescript": "catalog:" }
      }
      EOF
      printf '{\n  "name": "@kiosk/tsconfig",\n  "version": "1.0.0",\n  "private": true\n}\n' > packages/tsconfig/package.json
      printf '{\n  "name": "@kiosk/web",\n  "version": "0.1.0"\n}\n' > apps/web/package.json
      printf '{\n  "name": "@kiosk/api",\n  "version": "0.1.0"\n}\n' > apps/api/package.json
      for app in web api; do
        printf '{\n  "compilerOptions": { "strict": false, "target": "es2022", "module": "preserve", "moduleResolution": "bundler", "noEmit": true },\n  "include": ["src"]\n}\n' > apps/$app/tsconfig.json
      done
      cat > apps/web/src/main.ts <<'EOF'
      const preise: number[] = [250, 199];
      const erster: number = preise[0];
      console.log(erster);
      EOF
      cat > apps/api/src/main.ts <<'EOF'
      export function gesamt(werte: number[]): number {
        return werte.reduce((summe, wert) => summe + wert, 0);
      }
      EOF
      bun install > /dev/null 2>&1
    checks:
      - type: command
        run: jq -r '.compilerOptions.strict, .compilerOptions.noUncheckedIndexedAccess' packages/tsconfig/base.json | paste -sd ' ' -
        stdout_equals: "true true"
        message: 'packages/tsconfig/base.json braucht in compilerOptions "strict": true und "noUncheckedIndexedAccess": true.'
      - type: command
        run: jq -r '.extends' apps/web/tsconfig.json apps/api/tsconfig.json | sort -u
        stdout_equals: "@kiosk/tsconfig/base.json"
        message: 'Beide Apps sollen mit "extends": "@kiosk/tsconfig/base.json" von der Basis erben.'
      - type: command
        run: jq -r '.devDependencies["@kiosk/tsconfig"] // "fehlt"' apps/web/package.json apps/api/package.json | sort -u
        stdout_equals: "workspace:*"
        message: 'Beide Apps brauchen "@kiosk/tsconfig": "workspace:*" unter devDependencies – danach `bun install`.'
      - type: command
        run: bunx tsc --showConfig -p apps/web | jq -r '.compilerOptions.noUncheckedIndexedAccess'
        stdout_equals: "true"
        message: apps/web übernimmt die Basis noch nicht. Prüfe extends und ob `bun install` gelaufen ist.
      - type: command
        run: bunx tsc -p apps/web && bunx tsc -p apps/api && echo ok
        stdout_equals: ok
        message: TypeScript meldet noch Fehler. Behebe den Fehler in apps/web/src/main.ts, z. B. mit einem Standardwert per ??.
      - type: command
        run: jq -r '(.compilerOptions // {}) | has("strict")' apps/web/tsconfig.json
        stdout_equals: "false"
        message: 'In apps/web/tsconfig.json soll kein eigenes "strict" mehr stehen – die Einstellung kommt aus der Basis.'
    hints:
      - 'TypeScript löst `extends` mit einem Paketnamen über node_modules auf – deshalb braucht jede App den Eintrag `"@kiosk/tsconfig": "workspace:*"`.'
      - 'Die App-tsconfig ist kurz: `{ "extends": "@kiosk/tsconfig/base.json", "include": ["src"] }`.'
      - 'Der Fehler entsteht, weil `preise[0]` mit noUncheckedIndexedAccess den Typ `number | undefined` hat. Lösung: `const erster: number = preise[0] ?? 0;`.'
    solution: |
      ```bash
      cd tsconfig-teilen
      cat > packages/tsconfig/base.json <<'EOF'
      {
        "compilerOptions": {
          "strict": true,
          "noUncheckedIndexedAccess": true,
          "target": "es2022",
          "module": "preserve",
          "moduleResolution": "bundler",
          "noEmit": true,
          "skipLibCheck": true
        }
      }
      EOF
      for app in web api; do
        printf '{\n  "extends": "@kiosk/tsconfig/base.json",\n  "include": ["src"]\n}\n' > apps/$app/tsconfig.json
        jq '.devDependencies = {"@kiosk/tsconfig": "workspace:*"}' apps/$app/package.json > tmp.json && mv tmp.json apps/$app/package.json
      done
      bun install
      sed -i 's/preise\[0\];/preise[0] ?? 0;/' apps/web/src/main.ts
      bunx tsc -p apps/web && bunx tsc -p apps/api
      ```
  - id: wohin-gehoert-was
    type: dragdrop
    title: Basis oder Paket?
    description: Ordne jede tsconfig-Einstellung dem Ort zu, an dem sie in einem Monorepo am besten steht.
    targets:
      - { id: basis, label: Gemeinsame Basis (base.json) }
      - { id: paket, label: tsconfig.json des Pakets }
    items:
      - { label: '"strict": true', target: basis }
      - { label: '"noUncheckedIndexedAccess": true', target: basis }
      - { label: '"skipLibCheck": true', target: basis }
      - { label: '"include": ["src"]', target: paket }
      - { label: '"outDir": "dist"', target: paket }
      - { label: '"extends": "@kiosk/tsconfig/base.json"', target: paket }
    hints:
      - Pfade werden relativ zu der Datei aufgelöst, in der sie stehen.
---
Fünf Pakete, fünf tsconfig.json-Dateien – und in jeder steht fast dasselbe. Irgendwann schaltet jemand in
einem Paket `strict` aus, und niemand merkt es. Eine gemeinsame Basis sorgt dafür, dass alle Pakete nach
denselben Regeln geprüft werden.

## Das Problem kopierter Konfiguration

Die [[tsconfig|tsconfig.json]] steuert, wie streng der [[compiler|Compiler]] von [[typescript|TypeScript]]
prüft. In einem Monorepo hat jedes Paket eine eigene. Werden sie kopiert, passiert dasselbe wie bei
Abhängigkeiten ohne Catalog:

- Einstellungen laufen auseinander („bei der API ist `strict` aus?!“).
- Neue Regeln müssen in jede Datei einzeln.
- Code verhält sich in Paketen unterschiedlich, obwohl er gleich aussieht.

Die Lösung heißt [[tsconfig-extends|`extends`]]: Eine tsconfig erbt alle Einstellungen aus einer anderen
und ergänzt oder überschreibt nur, was sie selbst angibt.

```json title="apps/web/tsconfig.json"
{
  "extends": "@kiosk/tsconfig/base.json",
  "include": ["src"]
}
```

> [!MERKSATZ]
> `extends` vererbt `compilerOptions`. Was in der erbenden Datei steht, **überschreibt** die Basis.
> `references` werden nicht vererbt, und Pfade gelten relativ zu der Datei, in der sie stehen.

## Die Basis als internes Paket

Du könntest einfach eine `tsconfig.base.json` in den Root legen und mit `"extends": "../../tsconfig.base.json"`
darauf zeigen. Das funktioniert, aber relative Pfade brechen, sobald Pakete umziehen. Eleganter ist ein
eigenes internes Paket:

```text title="Aufbau"
packages/tsconfig/
├── package.json   → "name": "@kiosk/tsconfig", "private": true
└── base.json      → die gemeinsamen compilerOptions
```

```json title="packages/tsconfig/base.json"
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "target": "es2022",
    "module": "preserve",
    "moduleResolution": "bundler",
    "noEmit": true,
    "skipLibCheck": true
  }
}
```

Jede App trägt das Paket als [[devdependency|devDependency]] ein, damit Bun es verlinkt:

```json title="apps/web/package.json"
{
  "devDependencies": { "@kiosk/tsconfig": "workspace:*" }
}
```

TypeScript löst `"extends": "@kiosk/tsconfig/base.json"` dann über `node_modules` auf – genau wie einen Import.

> [!FEHLER]
> **extends ohne Abhängigkeit.** Fehlt der Eintrag `"@kiosk/tsconfig": "workspace:*"`, gibt es keinen Link
> in `node_modules`, und TypeScript meldet, dass es die Basis nicht findet.

## Was gehört wohin?

| In die Basis | Ins Paket |
|---|---|
| `strict`, `noUncheckedIndexedAccess` | `include`, `exclude`, `files` |
| `target`, `module`, `moduleResolution` | `rootDir`, `outDir` |
| `skipLibCheck`, `verbatimModuleSyntax` | `references` |
| — | Abweichungen wie `"lib": ["dom"]` nur für die Web-App |

> [!PRAXIS]
> Wer nicht sicher ist, was am Ende gilt, fragt den Compiler: `bunx tsc --showConfig -p apps/web` zeigt die
> vollständige, zusammengesetzte Konfiguration eines Pakets.

## Mehrere Basen für verschiedene Umgebungen

Eine Web-App braucht andere Einstellungen als ein Server-Paket: Sie kennt `document` und `window`, übersetzt
JSX und läuft im Browser. Deshalb legst du im Konfigurationspaket oft mehrere Dateien an, die aufeinander
aufbauen:

```json title="packages/tsconfig/react.json"
{
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["es2022", "dom", "dom.iterable"]
  }
}
```

| Datei | Für … | erbt von |
|---|---|---|
| `base.json` | alle Pakete | – |
| `react.json` | Web-Apps und UI-Bibliotheken | `base.json` |
| `node.json` | Server und Skripte, z. B. mit `"types": ["node"]` | `base.json` |

Eine App wählt dann die passende Basis, etwa `"extends": "@kiosk/tsconfig/react.json"`. Die strengen Regeln
aus `base.json` gelten trotzdem überall – sie werden einfach weitervererbt.


## TypeScript 7 im Monorepo

TypeScript 7 ist ein Neubau des Compilers in Go und deutlich schneller. Für deine Basis sind vor allem die
geänderten Standardwerte wichtig:

| Option | Standard in TypeScript 7 |
|---|---|
| `strict` | `true` |
| `module` | `esnext` |
| `rootDir` | `./` (Ordner der tsconfig) |
| `types` | `[]` – Typpakete wie `@types/node` musst du ausdrücklich eintragen |

Alte Optionen wie `baseUrl` oder `moduleResolution: "node"` sind entfernt und führen zu Fehlern. Schreib
`strict` trotzdem ausdrücklich in die Basis: So ist für alle sofort sichtbar, was gilt.

TypeScript selbst installierst du **einmal** im Root, am besten über den Catalog:

```json title="package.json (Root)"
{
  "workspaces": { "packages": ["apps/*", "packages/*"], "catalog": { "typescript": "^7.0.2" } },
  "devDependencies": { "typescript": "catalog:" }
}
```

## Zusammenfassung

- Kopierte tsconfig-Dateien laufen auseinander – eine gemeinsame Basis verhindert das.
- `extends` erbt `compilerOptions`; eigene Angaben überschreiben, Pfade bleiben relativ zur eigenen Datei.
- Am robustesten ist die Basis als internes Paket (`@kiosk/tsconfig`), das jede App als devDependency mit `workspace:*` einträgt.
- Strenge und Zielplattform gehören in die Basis, `include`, `outDir` und `references` ins Paket.
- TypeScript 7 schaltet `strict` standardmäßig ein und setzt `types` auf `[]`; `tsc --showConfig` zeigt das Ergebnis.
