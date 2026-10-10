---
title: Projektreferenzen und tsc --build
summary: Wie TypeScript mit composite-Projekten und references kompilierte Pakete in der richtigen Reihenfolge baut – und nur das, was sich geändert hat.
duration: 25
sources:
  - title: TypeScript Docs – Project References
    url: https://www.typescriptlang.org/docs/handbook/project-references.html
  - title: TypeScript Docs – composite
    url: https://www.typescriptlang.org/tsconfig/#composite
  - title: Announcing TypeScript 7.0
    url: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
  - title: Node.js Docs – Package entry points
    url: https://nodejs.org/api/packages.html#package-entry-points
quiz:
  - type: single
    question: Was muss ein Projekt einstellen, damit andere Projekte es über `references` einbinden können?
    options:
      - '"noEmit": true'
      - '"composite": true'
      - '"incremental": false'
      - '"strict": false'
    answer: 1
    explanation: composite markiert ein Projekt als referenzierbar. Dafür muss es Deklarationsdateien erzeugen und alle Dateien über include oder files erfassen.
  - type: multiple
    question: Was macht `tsc -b` (Build-Modus)? (mehrere richtig)
    options:
      - Es findet alle referenzierten Projekte.
      - Es baut Projekte in Abhängigkeitsreihenfolge.
      - Es überspringt Projekte, die schon aktuell sind.
      - Es installiert fehlende npm-Pakete.
    answers: [0, 1, 2]
    explanation: Der Build-Modus ist ein kleiner Build-Orchestrator für TypeScript. Mit Paketinstallation hat er nichts zu tun.
  - type: match
    question: Was bewirkt welcher Schalter von tsc -b?
    pairs:
      - { left: "--verbose", right: "Erklärt, warum ein Projekt gebaut oder übersprungen wird" }
      - { left: "--clean", right: "Löscht die Ausgaben der Projekte" }
      - { left: "--force", right: "Baut alles neu, auch aktuelle Projekte" }
      - { left: "--dry", right: "Zeigt nur, was gebaut würde" }
    explanation: Diese Schalter gibt es nur im Build-Modus.
  - type: cloze
    text: 'Eine Root-tsconfig, die nur andere Projekte bündelt, setzt `"files": ___` und listet alle Pakete unter `"___"`.'
    blanks:
      - ["[]"]
      - [references]
    explanation: So eine „Solution“-Konfiguration kompiliert selbst nichts. tsc -b im Root baut dann das ganze Monorepo.
tasks:
  - id: referenzen-bauen
    type: terminal
    title: Kompilierte Pakete mit tsc -b
    description: |
      Im Monorepo `referenzen` gibt es die Bibliothek `packages/preise` und die App `apps/kasse`, die sie nutzt.
      Beide sollen zu JavaScript in `dist/` kompiliert werden. Die gemeinsame Basis `tsconfig.base.json` liegt im
      Root, TypeScript 7 ist installiert.

      1. Mache beide Pakete referenzierbar: Ergänze in `packages/preise/tsconfig.json` **und**
         `apps/kasse/tsconfig.json` die Option `"composite": true`.
      2. Ergänze in `apps/kasse/tsconfig.json` eine Referenz auf `../../packages/preise`.
      3. Lege im Root eine `tsconfig.json` an, die selbst keine Dateien kompiliert (`"files": []`) und beide
         Pakete referenziert.
      4. Baue alles mit `bunx tsc -b --verbose` und starte das Ergebnis mit `node apps/kasse/dist/main.js`.
         Erwartete Ausgabe: `Summe: 4.50 EUR`.

      Klicke zuerst auf **Aufgabe vorbereiten** (das dauert ein paar Sekunden).
    workdir: referenzen
    setup: |
      mkdir -p apps/kasse/src packages/preise/src
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
      cat > tsconfig.base.json <<'EOF'
      {
        "compilerOptions": {
          "strict": true,
          "target": "es2022",
          "module": "nodenext",
          "declaration": true,
          "skipLibCheck": true
        }
      }
      EOF
      cat > packages/preise/package.json <<'EOF'
      {
        "name": "@kiosk/preise",
        "version": "1.0.0",
        "type": "module",
        "exports": {
          ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" }
        }
      }
      EOF
      cat > packages/preise/tsconfig.json <<'EOF'
      {
        "extends": "../../tsconfig.base.json",
        "compilerOptions": { "rootDir": "src", "outDir": "dist" },
        "include": ["src"]
      }
      EOF
      cat > packages/preise/src/index.ts <<'EOF'
      export function formatPreis(cent: number): string {
        return (cent / 100).toFixed(2) + " EUR";
      }
      EOF
      cat > apps/kasse/package.json <<'EOF'
      {
        "name": "@kiosk/kasse",
        "version": "0.1.0",
        "type": "module",
        "dependencies": { "@kiosk/preise": "workspace:*" }
      }
      EOF
      cat > apps/kasse/tsconfig.json <<'EOF'
      {
        "extends": "../../tsconfig.base.json",
        "compilerOptions": { "rootDir": "src", "outDir": "dist" },
        "include": ["src"]
      }
      EOF
      cat > apps/kasse/src/main.ts <<'EOF'
      import { formatPreis } from "@kiosk/preise";

      const summe = [150, 300].reduce((a, b) => a + b, 0);
      console.log("Summe: " + formatPreis(summe));
      EOF
      bun install > /dev/null 2>&1
    checks:
      - type: command
        run: for p in packages/preise apps/kasse; do bunx tsc --showConfig -p $p | jq -r '.compilerOptions.composite'; done | paste -sd ' ' -
        stdout_equals: "true true"
        message: 'Beide Pakete brauchen "composite": true in ihren compilerOptions.'
      - type: command
        run: jq -r '[.references[]?.path] | map(sub("/$"; "")) | join(",")' apps/kasse/tsconfig.json
        stdout_matches: "^(\\.\\./\\.\\./)?packages/preise(/tsconfig\\.json)?$|^\\.\\./\\.\\./packages/preise"
        message: 'apps/kasse/tsconfig.json braucht "references": [{ "path": "../../packages/preise" }].'
      - type: command
        run: jq -r '(.files | length | tostring) + " " + (.references | length | tostring)' tsconfig.json
        stdout_equals: "0 2"
        message: 'Die Root-tsconfig.json soll "files": [] setzen und genau zwei Einträge unter "references" haben.'
      - type: file_exists
        path: packages/preise/dist/index.d.ts
        message: In packages/preise/dist fehlt die Deklarationsdatei. Hast du `bunx tsc -b` im Root ausgeführt?
      - type: command
        run: node apps/kasse/dist/main.js
        stdout_equals: "Summe: 4.50 EUR"
        message: apps/kasse/dist/main.js fehlt oder liefert nicht "Summe 4.50 EUR". Baue mit `bunx tsc -b`.
      - type: command
        run: bunx tsc -b && echo ok
        stdout_equals: ok
        message: tsc -b meldet noch Fehler. Lies die Meldungen mit `bunx tsc -b --verbose`.
    hints:
      - '"composite": true gehört in den Block "compilerOptions" der beiden Paket-tsconfigs.'
      - 'In apps/kasse/tsconfig.json: `"references": [{ "path": "../../packages/preise" }]` auf oberster Ebene, neben "include".'
      - 'Root-tsconfig.json: `{ "files": [], "references": [{ "path": "packages/preise" }, { "path": "apps/kasse" }] }`.'
    solution: |
      ```bash
      cd referenzen
      cat > packages/preise/tsconfig.json <<'EOF'
      {
        "extends": "../../tsconfig.base.json",
        "compilerOptions": { "composite": true, "rootDir": "src", "outDir": "dist" },
        "include": ["src"]
      }
      EOF
      cat > apps/kasse/tsconfig.json <<'EOF'
      {
        "extends": "../../tsconfig.base.json",
        "compilerOptions": { "composite": true, "rootDir": "src", "outDir": "dist" },
        "include": ["src"],
        "references": [{ "path": "../../packages/preise" }]
      }
      EOF
      cat > tsconfig.json <<'EOF'
      {
        "files": [],
        "references": [{ "path": "packages/preise" }, { "path": "apps/kasse" }]
      }
      EOF
      bunx tsc -b --verbose
      node apps/kasse/dist/main.js
      ```
  - id: build-reihenfolge
    type: order
    title: In welcher Reihenfolge baut tsc -b?
    description: |
      `apps/shop` referenziert `packages/ui` und `packages/preise`. `packages/ui` referenziert ebenfalls
      `packages/preise`. `packages/tsconfig` enthält nur JSON und wird von niemandem referenziert. Du startest
      `tsc -b` im Root, alles ist veraltet. Bringe die Schritte in die richtige Reihenfolge.
    items:
      - tsc liest die Root-tsconfig und sammelt alle referenzierten Projekte
      - tsc prüft für jedes Projekt anhand der .tsbuildinfo, ob es veraltet ist
      - packages/preise wird gebaut
      - packages/ui wird gebaut
      - apps/shop wird gebaut
    hints:
      - Ein Projekt kann erst gebaut werden, wenn alle Projekte fertig sind, die es referenziert.
---
Deine Bibliothek soll nicht nur im Monorepo funktionieren, sondern auch in einer Node.js-Anwendung, die
kein TypeScript versteht. Dafür muss sie zu JavaScript mit Typdeklarationen kompiliert werden – und zwar
**bevor** die App kompiliert wird, die sie nutzt. Genau diese Reihenfolge organisieren Projektreferenzen.

## Kompilierte interne Pakete

In Lektion 4 hast du Just-in-Time-Pakete kennengelernt, deren `exports` direkt auf TypeScript zeigt. Ein
**kompiliertes** Paket zeigt dagegen auf erzeugte Dateien in `dist/`:

```json title="packages/preise/package.json"
{
  "name": "@kiosk/preise",
  "type": "module",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" }
  }
}
```

Die Bedingung `types` zeigt auf die [[typdeklaration|Deklarationsdatei]] (`.d.ts`), `default` auf den
JavaScript-Code. Damit das funktioniert, muss `dist/` existieren – die Bibliothek muss also vor der App
gebaut werden. Bei zwei Paketen geht das noch von Hand, bei zwanzig nicht mehr.

## composite und references

Eine [[projektreferenz|Projektreferenz]] sagt TypeScript: „Dieses Projekt hängt von jenem ab.“

```json title="apps/kasse/tsconfig.json"
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "composite": true, "rootDir": "src", "outDir": "dist" },
  "include": ["src"],
  "references": [{ "path": "../../packages/preise" }]
}
```

Das referenzierte Projekt muss [[composite-projekt|`composite`]] sein:

| `composite: true` bewirkt … | Warum |
|---|---|
| `declaration` muss an sein | andere Projekte lesen nur die `.d.ts`-Dateien |
| alle Dateien müssen über `include`/`files` erfasst sein | TypeScript muss wissen, was zum Projekt gehört |
| `rootDir` ist standardmäßig der Ordner der tsconfig | Ausgabepfade bleiben vorhersehbar |
| eine [[tsbuildinfo\|`.tsbuildinfo`]]-Datei wird geschrieben | merkt sich, was zuletzt gebaut wurde |

> [!MERKSATZ]
> `references` beschreibt die Abhängigkeiten **zwischen TypeScript-Projekten**, `dependencies` in der
> package.json die Abhängigkeiten **zwischen Paketen**. Im Monorepo brauchst du beides – und beides sollte
> zueinander passen.

## Der Build-Modus: tsc -b

Mit einer „Solution“-tsconfig im Root baust du das ganze Monorepo mit einem Befehl:

```json title="tsconfig.json (Root)"
{
  "files": [],
  "references": [{ "path": "packages/preise" }, { "path": "apps/kasse" }]
}
```

```text title="bunx tsc -b --verbose"
Projects in this build:
    * packages/preise/tsconfig.json
    * apps/kasse/tsconfig.json
    * tsconfig.json
Project 'packages/preise/tsconfig.json' is out of date because output file
  'packages/preise/tsconfig.tsbuildinfo' does not exist
Building project 'packages/preise/tsconfig.json'...
Building project 'apps/kasse/tsconfig.json'...
```

Der [[tsc-build-modus|Build-Modus]] findet alle Projekte, sortiert sie nach Abhängigkeiten und baut nur
veraltete. Ein zweiter Aufruf ohne Änderungen ist fast sofort fertig:

```text title="Zweiter Aufruf"
Project 'packages/preise/tsconfig.json' is up to date because newest input
  'packages/preise/src/index.ts' is older than output 'packages/preise/tsconfig.tsbuildinfo'
```

| Befehl | Wirkung |
|---|---|
| `tsc -b` | alles Veraltete in richtiger Reihenfolge bauen |
| `tsc -b --verbose` | erklären, warum gebaut oder übersprungen wird |
| `tsc -b --clean` | Ausgaben löschen |
| `tsc -b --force` | alles neu bauen |
| `tsc -b --watch` | bei Änderungen neu bauen |

> [!FEHLER]
> **`tsc -p apps/kasse` statt `tsc -b`.** Ohne Build-Modus baut TypeScript nur dieses eine Projekt. Fehlt
> `packages/preise/dist`, meldet es „Cannot find module '@kiosk/preise'“. Nutze im Monorepo immer `tsc -b`.

## Schneller mit TypeScript 7

TypeScript 7 baut unabhängige Projektreferenzen **parallel**. Zwei experimentelle Schalter steuern das:
`--builders` (wie viele Projekte gleichzeitig) und `--checkers` (wie viele Prüf-Threads pro Projekt).
Mit `--singleThreaded` schaltest du die Parallelität zur Fehlersuche ab.

Die `.tsbuildinfo`-Dateien und `dist/`-Ordner sind [[build-artefakt|Build-Artefakte]] – sie gehören in die
`.gitignore`, nicht ins Repository.

> [!PRAXIS]
> In vielen Monorepos sind nur die veröffentlichten Bibliotheken kompiliert. Apps, die ohnehin ein Bundler
> wie Vite baut, und reine Monorepo-Pakete bleiben Just-in-Time. Projektreferenzen lohnen sich vor allem für
> die Typprüfung großer Codebasen: `tsc -b` prüft dann nur, was sich geändert hat.

## Typische Stolperfallen

| Meldung oder Symptom | Ursache | Lösung |
|---|---|---|
| „Referenced project must have setting composite: true“ | dem referenzierten Projekt fehlt `composite` | `"composite": true` ergänzen |
| „Cannot find module '@kiosk/preise'“ | Bibliothek nicht gebaut oder nicht verlinkt | `tsc -b` statt `tsc -p`, Abhängigkeit mit `workspace:*` eintragen und `bun install` |
| „File is not listed within the file list of project“ | eine Datei liegt außerhalb von `include` | `include` erweitern oder die Datei verschieben |
| Änderungen kommen in der App nicht an | alte `dist/` oder `.tsbuildinfo` | `tsc -b --force` oder `tsc -b --clean` |

Ein guter Gesundheitscheck für das ganze Monorepo ist ein Root-Skript `"typecheck": "tsc -b"`. Es läuft
lokal vor dem Push und in der CI – und meldet jeden Typfehler in jedem Paket, ohne dass jemand die
Reihenfolge kennen muss.

## Zusammenfassung

- Kompilierte Pakete zeigen mit `exports` auf `dist/` – sie müssen vor ihren Nutzern gebaut werden.
- `references` beschreibt Abhängigkeiten zwischen TypeScript-Projekten, referenzierte Projekte brauchen `composite: true`.
- Eine Solution-tsconfig im Root mit `"files": []` und allen `references` bündelt das Monorepo.
- `tsc -b` baut in Abhängigkeitsreihenfolge und überspringt aktuelle Projekte dank `.tsbuildinfo`.
- TypeScript 7 baut unabhängige Projekte parallel; `dist/` und `.tsbuildinfo` gehören in die `.gitignore`.
