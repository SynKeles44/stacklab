---
title: bun test, bun build, bunfig.toml und Workspaces
summary: Wie du mit Bun testest und bündelst, Bun per bunfig.toml konfigurierst und mehrere Pakete mit Workspaces und Catalogs verwaltest.
duration: 25
sources:
  - title: Bun Docs – Test runner
    url: https://bun.com/docs/test
  - title: Bun Docs – Bundler
    url: https://bun.com/docs/bundler
  - title: Bun Docs – bunfig.toml
    url: https://bun.com/docs/runtime/bunfig
  - title: Bun Docs – Workspaces
    url: https://bun.com/docs/pm/workspaces
  - title: Bun Docs – Catalogs
    url: https://bun.com/docs/pm/catalogs
quiz:
  - type: single
    question: Welche Dateien findet `bun test` automatisch?
    options:
      - Nur Dateien im Ordner test/
      - Dateien wie *.test.ts, *.spec.js oder *_test.ts im ganzen Projekt
      - Alle .ts-Dateien
      - Nur die Datei, die in package.json unter test steht
    answer: 1
    explanation: bun test sucht rekursiv nach Dateien mit .test. oder .spec. (bzw. _test/_spec) im Namen – node_modules ausgenommen.
  - type: match
    question: Was macht welcher Befehl?
    pairs:
      - { left: "bun test --watch", right: "Tests bei jeder Änderung neu ausführen" }
      - { left: "bun test --coverage", right: "Testabdeckung anzeigen" }
      - { left: "bun build ./src/index.ts --outdir dist", right: "Code in eine Ausgabedatei bündeln" }
      - { left: "bun build ./cli.ts --compile --outfile meintool", right: "Eigenständige ausführbare Datei erzeugen" }
    explanation: bun test ist ein vollständiger Test-Runner, bun build ein Bundler – mit --compile sogar inklusive Runtime.
  - type: cloze
    text: 'Bun wird über die Datei ___ konfiguriert. In einem Workspace verweist eine Abhängigkeit mit `"react": "___"` auf die zentrale Version im Catalog.'
    blanks:
      - [bunfig.toml]
      - ["catalog:"]
    explanation: "bunfig.toml liegt neben der package.json. Mit catalog: teilen sich alle Pakete eines Monorepos eine Versionsangabe."
  - type: find-bug
    question: Der Test schlägt fehl, obwohl `summe([1, 2])` richtig 3 liefert. Welche Zeile ist falsch?
    language: ts
    code: |
      import { test, expect } from "bun:test";
      import { summe } from "./summe";
      test("addiert", () => {
        expect(summe([1, 2])).toBe("3");
      });
    bug_line: 4
    explanation: toBe vergleicht streng. Die Zahl 3 ist nicht gleich dem String "3" – richtig ist toBe(3).
tasks:
  - id: bun-tests-schreiben
    type: terminal
    title: Testen und bündeln mit Bun
    description: |
      Im Ordner `bun-tests` liegt eine Funktion `slug()` in `src/text.ts`, die Texte in
      URL-taugliche Kürzel verwandelt (`"Hallo Welt"` → `"hallo-welt"`). Klicke zuerst auf
      **Aufgabe vorbereiten**.

      1. Schreibe `src/text.test.ts` mit **mindestens drei** Tests (`test` und `expect` aus `bun:test`),
         z. B. für Leerzeichen, Umlaute und Sonderzeichen. Sieh dir dazu `src/text.ts` an.
      2. Lege in der package.json das Skript `test` an, das `bun test` ausführt, und lass es laufen.
      3. Bündle die Funktion für Node.js:
         `bun build ./src/text.ts --outdir dist --target node`.
      4. Lege eine `bunfig.toml` an, die für Tests die Testabdeckung einschaltet
         (Abschnitt `[test]`, Schlüssel `coverage = true`).
    workdir: bun-tests
    setup: |
      cat > package.json <<'EOF'
      {
        "name": "bun-tests",
        "version": "1.0.0",
        "type": "module",
        "private": true
      }
      EOF
      mkdir -p src
      cat > src/text.ts <<'EOF'
      export function slug(text: string): string {
        return text
          .toLowerCase()
          .trim()
          .replace(/ä/g, "ae")
          .replace(/ö/g, "oe")
          .replace(/ü/g, "ue")
          .replace(/ß/g, "ss")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      }
      EOF
    checks:
      - type: file_exists
        path: src/text.test.ts
        message: Lege die Testdatei src/text.test.ts an.
      - type: command
        run: jq -r '.scripts.test' package.json
        stdout_equals: bun test
        message: Das Skript test soll "bun test" ausführen.
      - type: command
        run: bun test 2>&1 | grep -E '^\s*[0-9]+ pass' | grep -oE '[0-9]+' | head -n 1
        stdout_matches: "^([3-9]|[1-9][0-9]+)$"
        message: Es sollen mindestens drei Tests grün sein.
      - type: command
        run: bun test >/dev/null 2>&1; echo $?
        stdout_equals: "0"
        message: bun test schlägt noch fehl.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          mkdir -p "$d/src" && cp src/text.test.ts "$d/src/" && echo '{"name":"p","type":"module"}' > "$d/package.json"
          printf 'export function slug(text: string): string {\n  return "";\n}\n' > "$d/src/text.ts"
          (cd "$d" && bun test >/dev/null 2>&1); code=$?
          rm -rf "$d"
          echo $code
        stdout_matches: "^[1-9]"
        message: Deine Tests bleiben grün, selbst wenn slug() immer "" liefert. Prüfe mit expect(...).toBe(...) echte Ergebnisse.
      - type: command
        run: node -e 'import("./dist/text.js").then(m => console.log(m.slug("Grüße aus Köln!")))'
        stdout_equals: gruesse-aus-koeln
        message: dist/text.js fehlt oder funktioniert nicht. Bündle mit bun build ./src/text.ts --outdir dist --target node.
      - type: file_contains
        path: bunfig.toml
        pattern: "\\[test\\][^\\[]*coverage\\s*=\\s*true"
        message: In bunfig.toml fehlt im Abschnitt [test] die Zeile coverage = true.
    hints:
      - "`import { test, expect } from \"bun:test\"; import { slug } from \"./text\";`"
      - "Ein Test: `test(\"Leerzeichen\", () => { expect(slug(\"Hallo Welt\")).toBe(\"hallo-welt\"); });`"
      - "bunfig.toml: zwei Zeilen – `[test]` und darunter `coverage = true`."
    solution: |
      ```ts
      // src/text.test.ts
      import { test, expect } from "bun:test";
      import { slug } from "./text";

      test("Leerzeichen werden zu Bindestrichen", () => {
        expect(slug("Hallo Welt")).toBe("hallo-welt");
      });

      test("Umlaute werden umgeschrieben", () => {
        expect(slug("Grüße")).toBe("gruesse");
      });

      test("Sonderzeichen am Rand verschwinden", () => {
        expect(slug("  !Bun ist schnell!  ")).toBe("bun-ist-schnell");
      });
      ```

      ```bash
      npm pkg set scripts.test="bun test"
      bun test
      bun build ./src/text.ts --outdir dist --target node
      printf '[test]\ncoverage = true\n' > bunfig.toml
      ```
  - id: catalog-aufloesen
    type: code
    language: ts
    title: Catalog-Versionen auflösen
    description: |
      In einem Bun-Workspace können Pakete statt einer Version `catalog:` oder `catalog:<name>`
      angeben. Bun ersetzt das beim Installieren durch die zentrale Version aus der Root-package.json.

      Schreibe `loese(abhaengigkeiten, catalog, catalogs)`:

      - `"catalog:"` → Version aus `catalog` (Standard-Catalog)
      - `"catalog:testing"` → Version aus `catalogs.testing`
      - jede andere Angabe bleibt unverändert
      - fehlt ein Eintrag im Catalog, wirf einen Fehler (`throw new Error(…)`)
    starter: |
      type Versionen = Record<string, string>;

      function loese(
        abhaengigkeiten: Versionen,
        catalog: Versionen,
        catalogs: Record<string, Versionen>,
      ): Versionen {
        const ergebnis: Versionen = {};
        // für jedes Paket die Angabe prüfen und auflösen
        return ergebnis;
      }
    tests:
      - name: Standard- und benannter Catalog
        code: |
          assertDeepEqual(
            loese({ react: "catalog:", vitest: "catalog:testing", zod: "^4.1.0" }, { react: "^19.2.0" }, { testing: { vitest: "^4.0.0" } }),
            { react: "^19.2.0", vitest: "^4.0.0", zod: "^4.1.0" }
          )
      - name: Keine Abhängigkeiten
        code: assertDeepEqual(loese({}, {}, {}), {})
      - name: Fehlender Eintrag wirft einen Fehler
        code: |
          assertThrows(() => loese({ react: "catalog:" }, {}, {}))
          assertThrows(() => loese({ jest: "catalog:testing" }, {}, { testing: {} }))
    hints:
      - "`for (const [paket, angabe] of Object.entries(abhaengigkeiten))` geht alle Einträge durch."
      - "Mit `angabe.startsWith(\"catalog:\")` erkennst du eine Catalog-Angabe, `angabe.slice(8)` liefert den Namen (leer beim Standard-Catalog)."
    solution: |
      ```ts
      type Versionen = Record<string, string>;

      function loese(
        abhaengigkeiten: Versionen,
        catalog: Versionen,
        catalogs: Record<string, Versionen>,
      ): Versionen {
        const ergebnis: Versionen = {};
        for (const [paket, angabe] of Object.entries(abhaengigkeiten)) {
          if (!angabe.startsWith("catalog:")) {
            ergebnis[paket] = angabe;
            continue;
          }
          const name = angabe.slice("catalog:".length);
          const quelle = name === "" ? catalog : catalogs[name] ?? {};
          const version = quelle[paket];
          if (version === undefined) {
            throw new Error(`Kein Catalog-Eintrag für ${paket} (${angabe})`);
          }
          ergebnis[paket] = version;
        }
        return ergebnis;
      }
      ```
---

Bun kann mehr als Code ausführen und Pakete installieren. Ohne ein einziges Zusatzpaket bringt es
einen Test-Runner und einen Bundler mit – und mit Workspaces verwaltest du mehrere Pakete in
einem Repository.

## Testen mit bun test

`bun test` ist ein [[test-runner|Test-Runner]] mit einer API, die Jest und Vitest ähnelt. Er findet
automatisch alle Dateien wie `*.test.ts` oder `*.spec.js` und führt TypeScript direkt aus.

```ts title="src/summe.test.ts"
import { describe, test, expect } from "bun:test";
import { summe } from "./summe";

describe("summe", () => {
  test("addiert Zahlen", () => {
    expect(summe([1, 2, 3])).toBe(6);
  });
  test("leere Liste ergibt 0", () => {
    expect(summe([])).toBe(0);
  });
});
```

```text title="bun test"
src/summe.test.ts:
(pass) summe > addiert Zahlen
(pass) summe > leere Liste ergibt 0

 2 pass
 0 fail
```

Ein Test besteht aus einem Namen und einer Funktion. Darin prüfst du mit `expect(wert)` und einem
*Matcher*, ob das Ergebnis stimmt. `describe` fasst zusammengehörige Tests zu einer Gruppe zusammen.

| Matcher | Prüft … |
|---|---|
| `toBe(3)` | strikte Gleichheit (wie `===`) |
| `toEqual({ a: 1 })` | gleichen Inhalt bei Objekten und Arrays |
| `toThrow()` | dass eine Funktion einen Fehler wirft |
| `toContain("x")` | dass ein String oder Array etwas enthält |

| Aufruf | Wirkung |
|---|---|
| `bun test` | alle Tests ausführen |
| `bun test summe` | nur Dateien, deren Pfad „summe“ enthält |
| `bun test --watch` | bei Änderungen neu ausführen |
| `bun test --coverage` | Testabdeckung anzeigen |

> [!FEHLER]
> **Tests, die nie rot werden.** Ein Test ohne `expect` oder mit `expect(true).toBe(true)` ist
> immer grün und schützt vor nichts. Prüfe neue Tests, indem du den Code absichtlich kaputt
> machst – der Test muss dann fehlschlagen.

## Bündeln mit bun build

Ein [[bundler|Bundler]] fasst deinen Code und seine Importe zu wenigen Dateien zusammen, wandelt
TypeScript in JavaScript um und kann den Code verkleinern.

```bash title="Terminal"
bun build ./src/index.ts --outdir dist --target node   # für Node.js
bun build ./src/app.ts --outdir dist --minify           # für den Browser, verkleinert
bun build ./cli.ts --compile --outfile meintool         # eigenständiges Programm
```

Die Option `--target` legt fest, wo das Ergebnis laufen soll: `browser` (Standard), `node` oder
`bun`. Für Code, der Node-APIs wie `node:fs` nutzt, wählst du `node`. Mit `--compile` entsteht eine einzige ausführbare Datei, die Bun selbst enthält – sie läuft auf
Rechnern ohne installiertes Node.js oder Bun.

## Konfiguration mit bunfig.toml

Bun liest Einstellungen aus einer [[bunfig|`bunfig.toml`]] neben der package.json. Eine globale
`~/.bunfig.toml` gilt für Paketmanager-Befehle auf dem ganzen Rechner. Gibt es beide, gewinnen die
Werte aus dem Projekt. Das Format TOML besteht aus Abschnitten in eckigen Klammern und darunter
Zeilen der Form `schluessel = wert`.

```toml title="bunfig.toml"
[install]
exact = true          # bun add schreibt exakte Versionen statt ^

[test]
coverage = true       # Testabdeckung bei jedem bun test
preload = ["./test/setup.ts"]
```

> [!MERKSATZ]
> package.json beschreibt **das Projekt**, bunfig.toml beschreibt, **wie Bun damit arbeitet**.

## Workspaces und Catalogs

Ein [[workspace|Workspace]] fasst mehrere Pakete in einem Repository zusammen, etwa
`packages/web` und `packages/api`. Die Root-package.json listet sie, und ein einziges
`bun install` installiert alles. Pakete im Workspace können sich gegenseitig als Abhängigkeit
nutzen – Bun verlinkt sie, statt sie aus der Registry zu laden. Mit einem [[catalog|Catalog]] legst du Versionen zentral fest:

```json title="package.json (Root)"
{
  "name": "mein-monorepo",
  "private": true,
  "workspaces": {
    "packages": ["packages/*"],
    "catalog": { "react": "^19.2.0" },
    "catalogs": { "testing": { "vitest": "^4.0.0" } }
  }
}
```

```json title="packages/web/package.json"
{
  "name": "web",
  "dependencies": { "react": "catalog:" },
  "devDependencies": { "vitest": "catalog:testing" }
}
```

> [!PRAXIS]
> In Monorepos sorgen Catalogs dafür, dass alle Pakete dieselbe React- oder TypeScript-Version
> nutzen. Ein Update ist dann eine Zeile in der Root-package.json. Den Aufbau großer Monorepos
> vertiefst du im Kurs „Monorepos und Workspaces“.

## Zusammenfassung

- `bun test` findet `*.test.ts`-Dateien automatisch; `test`, `expect` und `describe` kommen aus `bun:test`.
- `--watch` und `--coverage` machen den Test-Runner alltagstauglich.
- `bun build` bündelt Code für Node.js oder den Browser, `--compile` erzeugt ein eigenständiges Programm.
- **bunfig.toml** konfiguriert Bun, etwa `[install] exact` oder `[test] coverage`.
- **Workspaces** verwalten mehrere Pakete; **Catalogs** (`catalog:`) legen Versionen zentral fest.
