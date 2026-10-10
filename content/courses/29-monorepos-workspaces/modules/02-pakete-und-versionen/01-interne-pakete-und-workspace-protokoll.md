---
title: Interne Pakete und das workspace:-Protokoll
summary: Wie ein Paket im Monorepo ein anderes nutzt, warum dabei ein Symlink entsteht und was beim Veröffentlichen aus workspace:* wird.
duration: 25
sources:
  - title: Bun Docs – Workspaces
    url: https://bun.com/docs/pm/workspaces
  - title: Bun Docs – bun add
    url: https://bun.com/docs/pm/cli/add
  - title: Node.js Docs – Package entry points (exports)
    url: https://nodejs.org/api/packages.html#package-entry-points
  - title: pnpm Docs – Workspace protocol
    url: https://pnpm.io/workspaces#workspace-protocol-workspace
quiz:
  - type: single
    question: 'Was bedeutet `"@kiosk/preise": "workspace:*"` in der package.json von apps/web?'
    options:
      - Lade die neueste Version von @kiosk/preise aus der npm-Registry.
      - Nutze das Paket @kiosk/preise aus diesem Monorepo, egal welche Version es hat.
      - Installiere alle Pakete, deren Name mit @kiosk beginnt.
      - Kopiere den Ordner packages/preise nach apps/web.
    answer: 1
    explanation: Das workspace:-Protokoll erlaubt nur lokale Workspace-Pakete. Der Stern heißt „jede Version“.
  - type: match
    question: "@kiosk/preise hat die Version 1.4.0. Was steht nach `bun pm pack` oder `bun publish` in der veröffentlichten package.json?"
    pairs:
      - { left: "workspace:*", right: "1.4.0" }
      - { left: "workspace:^", right: "^1.4.0" }
      - { left: "workspace:~", right: "~1.4.0" }
      - { left: "workspace:1.3.0", right: "1.3.0" }
    explanation: Beim Packen ersetzt Bun das Protokoll durch echte Versionen. Eine ausdrücklich angegebene Version gewinnt dabei.
  - type: multiple
    question: 'Was stimmt für ein internes Paket mit `"exports": "./src/index.ts"`? (mehrere richtig)'
    options:
      - Andere Pakete importieren direkt den TypeScript-Quellcode.
      - Änderungen sind sofort sichtbar, ohne Build-Schritt.
      - Das Paket lässt sich ohne Build an Node.js-Nutzer außerhalb des Monorepos veröffentlichen.
      - Das funktioniert, weil Bun TypeScript direkt ausführt.
    answers: [0, 1, 3]
    explanation: Solche Just-in-Time-Pakete sind bequem im Monorepo. Wer sie veröffentlichen will, braucht einen Build, der JavaScript und Typdeklarationen erzeugt.
  - type: find-bug
    question: bun install meldet einen 404-Fehler aus der Registry. In welcher Zeile steckt der Fehler?
    language: json
    code: |
      {
        "name": "@kiosk/web",
        "version": "0.1.0",
        "dependencies": {
          "@kiosk/preise": "^1.0.0",
          "react": "^19.2.0"
        }
      }
    bug_line: 5
    explanation: Ohne workspace:-Protokoll sucht Bun hier in der Registry, und dort gibt es kein @kiosk/preise. Mit "workspace:*" wird garantiert lokal verlinkt.
tasks:
  - id: internes-paket-nutzen
    type: terminal
    title: Die Kasse nutzt die Preis-Bibliothek
    description: |
      Im Monorepo `internes-paket` gibt es die Bibliothek `packages/preise` (Paketname `@kiosk/preise`)
      und die App `apps/kasse`. Die Datei `apps/kasse/src/main.ts` importiert schon `formatPreis` aus
      `@kiosk/preise` – aber die Abhängigkeit fehlt noch.

      1. Trage in `apps/kasse/package.json` die Abhängigkeit `@kiosk/preise` mit dem Wert `workspace:*` ein –
         per Hand oder mit `bun add` (Tipp unten).
      2. Führe `bun install` im Root aus.
      3. Starte die Kasse mit `bun apps/kasse/src/main.ts`. Erwartete Ausgabe: `Summe: 4.50 EUR`.
      4. Schau dir mit `ls -l apps/kasse/node_modules/@kiosk` an, worauf der Eintrag zeigt.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: internes-paket
    setup: |
      mkdir -p apps/kasse/src packages/preise/src
      cat > package.json <<'EOF'
      {
        "name": "kiosk",
        "private": true,
        "workspaces": ["apps/*", "packages/*"]
      }
      EOF
      cat > packages/preise/package.json <<'EOF'
      {
        "name": "@kiosk/preise",
        "version": "1.0.0",
        "type": "module",
        "exports": "./src/index.ts"
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
        "type": "module"
      }
      EOF
      cat > apps/kasse/src/main.ts <<'EOF'
      import { formatPreis } from "@kiosk/preise";

      const warenkorb = [150, 300];
      const summe = warenkorb.reduce((a, b) => a + b, 0);
      console.log("Summe: " + formatPreis(summe));
      EOF
    checks:
      - type: command
        run: jq -r '.dependencies["@kiosk/preise"] // "fehlt"' apps/kasse/package.json
        stdout_equals: "workspace:*"
        message: 'In apps/kasse/package.json fehlt noch "@kiosk/preise": "workspace:*" unter dependencies.'
      - type: command
        run: test -L apps/kasse/node_modules/@kiosk/preise && echo link
        stdout_equals: link
        message: apps/kasse/node_modules/@kiosk/preise ist noch kein Symlink. Führe nach der Änderung `bun install` im Root aus.
      - type: command
        run: bun apps/kasse/src/main.ts
        stdout_equals: "Summe: 4.50 EUR"
        message: Die Kasse läuft noch nicht. Erwartet ist die Ausgabe "Summe 4.50 EUR" – ist die Abhängigkeit installiert?
    hints:
      - Ohne Eintrag in der package.json findet Bun das Paket nicht – auch wenn es im selben Repository liegt.
      - 'Vom Root aus geht es mit `bun add "@kiosk/preise@workspace:*" --filter @kiosk/kasse`.'
      - Danach `bun install` und `bun apps/kasse/src/main.ts`.
    solution: |
      ```bash
      cd internes-paket
      bun add "@kiosk/preise@workspace:*" --filter @kiosk/kasse
      bun install
      bun apps/kasse/src/main.ts
      ls -l apps/kasse/node_modules/@kiosk
      ```
  - id: protokoll-beim-veroeffentlichen
    type: dragdrop
    title: Was wird beim Veröffentlichen daraus?
    description: |
      `@kiosk/preise` hat lokal die Version `2.1.0`. Ordne jede Angabe aus einer package.json dem Wert zu,
      der nach `bun pm pack` im Paket steht.
    targets:
      - { id: exakt, label: "2.1.0" }
      - { id: caret, label: "^2.1.0" }
      - { id: tilde, label: "~2.1.0" }
    items:
      - { label: '"workspace:*"', target: exakt }
      - { label: '"workspace:^"', target: caret }
      - { label: '"workspace:~"', target: tilde }
      - { label: '"workspace:2.1.0"', target: exakt }
    hints:
      - Der Stern wird zur exakten aktuellen Version.
---
Deine Kasse soll Preise formatieren, und die passende Funktion liegt schon in `packages/preise`. Ein
`import` allein reicht aber nicht: Die Kasse muss **ausdrücklich sagen**, dass sie dieses Paket braucht.
Genau dafür gibt es das `workspace:`-Protokoll.

## Ein internes Paket

Ein [[internes-paket|internes Paket]] ist ein Paket, das vor allem von anderen Paketen im selben Monorepo
genutzt wird. Es sieht aus wie jedes andere Paket:

```json title="packages/preise/package.json"
{
  "name": "@kiosk/preise",
  "version": "1.0.0",
  "type": "module",
  "exports": "./src/index.ts"
}
```

```ts title="packages/preise/src/index.ts"
export function formatPreis(cent: number): string {
  return (cent / 100).toFixed(2) + " EUR";
}
```

Der Name beginnt mit einem [[npm-scope|Scope]] wie `@kiosk/`. So erkennst du interne Pakete sofort und
vermeidest Namenskonflikte mit Paketen aus der Registry. Das Feld [[exports-feld|`exports`]] legt fest,
welche Datei ein `import "@kiosk/preise"` lädt.

> [!MERKSATZ]
> Ein internes Paket ist ein ganz normales Paket – mit Name, Version und Einstiegspunkt. Der einzige
> Unterschied: Es wird lokal verlinkt statt heruntergeladen.

## Die Abhängigkeit eintragen

Die Kasse trägt das Paket wie jede andere Abhängigkeit ein – aber mit dem [[workspace-protokoll|`workspace:`-Protokoll]]:

```json title="apps/kasse/package.json"
{
  "name": "@kiosk/kasse",
  "dependencies": {
    "@kiosk/preise": "workspace:*"
  }
}
```

```bash title="Terminal – oder per Befehl vom Root aus"
bun add "@kiosk/preise@workspace:*" --filter @kiosk/kasse
bun install
```

`workspace:*` bedeutet: Nimm das Paket aus **diesem** Monorepo, egal in welcher Version. Gibt es kein
Workspace-Paket mit diesem Namen, bricht die Installation ab, statt still etwas aus der Registry zu laden.

> [!FEHLER]
> **Nur importieren, nicht eintragen.** Ohne Eintrag in der package.json kann Bun das Paket nicht
> verlinken, und der Import schlägt fehl. Und `bun add @kiosk/preise` ohne `@workspace:*` sucht in der
> Registry – dort gibt es dein Paket nicht, du bekommst einen 404-Fehler.

## Was bun install daraus macht

Bun kopiert nichts. Es legt einen [[symlink|Symlink]] an, der auf den Paketordner zeigt:

![Ein Symlink verbindet apps/kasse mit packages/preise](/assets/monorepos-workspaces/workspace-verlinkung.svg)

```text title="ls -l apps/kasse/node_modules/@kiosk"
preise -> ../../../../packages/preise
```

Das hat einen großen Vorteil: Änderst du `packages/preise/src/index.ts`, sieht die Kasse die Änderung
**sofort** – kein Veröffentlichen, kein erneutes Installieren.

Weil `exports` hier direkt auf eine `.ts`-Datei zeigt, braucht das Paket nicht einmal einen Build. Bun
führt TypeScript direkt aus. Man nennt solche Pakete auch [[just-in-time-paket|Just-in-Time-Pakete]].

| Art | `exports` zeigt auf | Vorteil | Nachteil |
|---|---|---|---|
| Just-in-Time | `./src/index.ts` | kein Build, sofort aktuell | Nutzer muss TypeScript verarbeiten können |
| Kompiliert | `./dist/index.js` + Typen | läuft überall, auch in Node.js | Build-Schritt nötig |

> [!PRAXIS]
> Für reine Monorepo-Bibliotheken sind Just-in-Time-Pakete beliebt, weil Bundler wie Vite den Quellcode
> ohnehin übersetzen. Kompilierte Pakete lernst du in Modul 3 mit Projektreferenzen kennen.

## Die Varianten des Protokolls

| Angabe | Bedeutung lokal | Beim Veröffentlichen (Version 1.4.0) |
|---|---|---|
| `workspace:*` | jede lokale Version | `1.4.0` |
| `workspace:^` | lokale Version, kompatibel | `^1.4.0` |
| `workspace:~` | lokale Version, nur Patches | `~1.4.0` |
| `workspace:1.3.0` | ausdrücklich diese Version | `1.3.0` |

Die rechte Spalte ist wichtig, sobald du ein Paket mit `bun publish` veröffentlichst oder mit
`bun pm pack` als [[tarball|Tarball]] packst: Außerhalb des Monorepos versteht niemand `workspace:`.
Bun ersetzt das Protokoll deshalb automatisch durch eine echte [[versionsbereich|Versionsangabe]].

```bash title="Terminal"
cd apps/kasse && bun pm pack
tar -xOzf kiosk-kasse-0.1.0.tgz package/package.json
# "@kiosk/preise": "1.0.0"
```

> [!TIPP]
> Wird ein internes Paket **nie** veröffentlicht, setze darin `"private": true`. Dann kann es auch kein
> versehentliches `bun publish` in die Registry schaffen.

## Zusammenfassung

- Ein internes Paket ist ein normales Paket mit Name (meist mit Scope), Version und `exports`.
- Nutzer tragen es mit `"workspace:*"` als Abhängigkeit ein – nur ein Import reicht nicht.
- `bun install` legt einen Symlink an, Änderungen sind sofort sichtbar.
- Just-in-Time-Pakete zeigen mit `exports` direkt auf TypeScript-Quellcode und brauchen keinen Build.
- Beim Packen und Veröffentlichen ersetzt Bun `workspace:*`, `workspace:^` und `workspace:~` durch echte Versionen.
