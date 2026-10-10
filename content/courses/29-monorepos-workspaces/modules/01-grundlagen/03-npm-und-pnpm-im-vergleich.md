---
title: Workspaces in npm und pnpm
summary: Wie npm und pnpm dasselbe Konzept umsetzen – und woran du im Alltag merkst, welcher Paketmanager ein Monorepo verwaltet.
duration: 20
sources:
  - title: npm Docs – Workspaces
    url: https://docs.npmjs.com/cli/v11/using-npm/workspaces
  - title: pnpm Docs – Workspace
    url: https://pnpm.io/workspaces
  - title: pnpm Docs – Catalogs
    url: https://pnpm.io/catalogs
  - title: Bun Docs – Workspaces
    url: https://bun.com/docs/pm/workspaces
quiz:
  - type: match
    question: Wo legt welcher Paketmanager fest, welche Ordner zum Workspace gehören?
    pairs:
      - { left: "Bun", right: "Feld workspaces in der Root-package.json" }
      - { left: "npm", right: "Feld workspaces in der Root-package.json" }
      - { left: "pnpm", right: "Datei pnpm-workspace.yaml" }
    explanation: Bun und npm (und Yarn) nutzen das Feld workspaces. pnpm liest stattdessen pnpm-workspace.yaml.
  - type: single
    question: 'Ein Paket enthält `"@kiosk/format": "workspace:*"`. Welcher Paketmanager bricht damit ab?'
    options:
      - Bun
      - pnpm
      - npm
      - Yarn
    answer: 2
    explanation: npm kennt das workspace:-Protokoll nicht und meldet EUNSUPPORTEDPROTOCOL. Dort verweist man mit einer normalen Version wie "*" auf das lokale Paket.
  - type: match
    question: Ordne jedem Befehl den Paketmanager zu, zu dem er gehört.
    pairs:
      - { left: "npm run build --workspaces", right: "npm – Skript in allen Workspaces" }
      - { left: "pnpm -r run build", right: "pnpm – rekursiv in allen Paketen" }
      - { left: "bun run --filter '*' build", right: "Bun – alle passenden Pakete" }
      - { left: "npm run build -w @kiosk/api", right: "npm – Skript in einem Workspace" }
    explanation: Alle drei können Skripte in mehreren Paketen ausführen, nur die Schalter heißen unterschiedlich.
  - type: cloze
    text: Welcher Paketmanager ein Projekt verwaltet, verrät meist das Lockfile – bei Bun heißt es ___, bei npm ___ und bei pnpm ___.
    blanks:
      - [bun.lock]
      - [package-lock.json]
      - [pnpm-lock.yaml]
    explanation: Mischst du Paketmanager in einem Repository, entstehen mehrere Lockfiles mit widersprüchlichen Versionen.
tasks:
  - id: npm-workspace
    type: terminal
    title: Ein npm-Workspace, der nicht installiert
    description: |
      Im Ordner `npm-workspace` liegt ein kleines Monorepo, das mit **npm** verwaltet werden soll:
      `packages/format` und `apps/shop`. Leider bricht `npm install` ab.

      1. Führe `npm install` aus und lies die Fehlermeldung.
      2. Korrigiere die Abhängigkeit in `apps/shop/package.json` so, dass npm sie versteht – das lokale
         Paket `@kiosk/format` soll weiterhin genutzt werden.
      3. Führe `npm install` erneut aus.
      4. Starte das Skript `build` in **allen** Workspaces mit einem einzigen npm-Befehl. `apps/shop` hat
         kein build-Skript – sorge dafür, dass das nicht als Fehler zählt.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: npm-workspace
    setup: |
      mkdir -p packages/format apps/shop
      cat > package.json <<'EOF'
      {
        "name": "kiosk-npm",
        "private": true,
        "workspaces": ["apps/*", "packages/*"]
      }
      EOF
      cat > packages/format/package.json <<'EOF'
      {
        "name": "@kiosk/format",
        "version": "1.0.0",
        "main": "index.js",
        "scripts": {
          "build": "mkdir -p dist && cp index.js dist/index.js"
        }
      }
      EOF
      printf 'exports.euro = (cent) => (cent / 100).toFixed(2) + " EUR";\n' > packages/format/index.js
      cat > apps/shop/package.json <<'EOF'
      {
        "name": "@kiosk/shop",
        "version": "0.1.0",
        "dependencies": {
          "@kiosk/format": "workspace:*"
        }
      }
      EOF
      printf 'const { euro } = require("@kiosk/format");\nconsole.log(euro(250));\n' > apps/shop/index.js
    checks:
      - type: command
        run: jq -r '.dependencies["@kiosk/format"] // "fehlt"' apps/shop/package.json
        stdout_matches: "^(\\*|\\^?1(\\.0(\\.0)?)?|~1\\.0\\.0|1\\.x|>=1\\.0\\.0)$"
        message: 'In apps/shop/package.json soll @kiosk/format mit einer Version stehen, die npm versteht – zum Beispiel "*" statt "workspace:*".'
      - type: file_exists
        path: package-lock.json
        message: Es gibt noch keine package-lock.json im Root. Führe `npm install` aus, nachdem du die Abhängigkeit korrigiert hast.
      - type: command
        run: test -L node_modules/@kiosk/format && echo link
        stdout_equals: link
        message: node_modules/@kiosk/format ist noch kein Symlink auf das lokale Paket. Führe `npm install` im Root aus.
      - type: command
        run: node apps/shop/index.js
        stdout_equals: "2.50 EUR"
        message: apps/shop kann @kiosk/format noch nicht laden. Ist die Installation durchgelaufen?
      - type: file_exists
        path: packages/format/dist/index.js
        message: Das build-Skript von @kiosk/format ist noch nicht gelaufen. Nutze `npm run build --workspaces --if-present`.
    hints:
      - npm meldet `EUNSUPPORTEDPROTOCOL` – es kennt `workspace:*` nicht.
      - 'Bei npm reicht eine normale Version: `"@kiosk/format": "*"`. npm verlinkt das lokale Paket automatisch.'
      - '`npm run build --workspaces --if-present` startet build überall, wo es existiert.'
    solution: |
      ```bash
      cd npm-workspace
      npm install || true    # bricht mit EUNSUPPORTEDPROTOCOL ab
      sed -i 's/"workspace:\*"/"*"/' apps/shop/package.json
      npm install
      node apps/shop/index.js   # 2.50 EUR
      npm run build --workspaces --if-present
      ```
  - id: paketmanager-erkennen
    type: dragdrop
    title: Welcher Paketmanager ist das?
    description: Du klonst fremde Monorepos. Ordne jedes Indiz dem Paketmanager zu, der das Repo verwaltet.
    targets:
      - { id: bun, label: Bun }
      - { id: npm, label: npm }
      - { id: pnpm, label: pnpm }
    items:
      - { label: Eine bun.lock im Root, target: bun }
      - { label: '"@kiosk/ui": "workspace:*" und eine bun.lock', target: bun }
      - { label: Eine package-lock.json im Root, target: npm }
      - { label: 'Lokale Pakete stehen mit "*" in den dependencies', target: npm }
      - { label: Eine pnpm-workspace.yaml mit packages und catalog, target: pnpm }
      - { label: Eine pnpm-lock.yaml im Root, target: pnpm }
    hints:
      - Das Lockfile ist das zuverlässigste Indiz.
---
Bun ist nicht der einzige Paketmanager mit Workspaces. Wenn du ein fremdes Monorepo klonst, triffst du
genauso oft auf npm oder pnpm. Die Idee ist überall gleich – nur Dateien und Schalter heißen anders.

## npm Workspaces

[[npm]] nutzt dasselbe Feld wie Bun:

```json title="package.json (Root)"
{
  "name": "kiosk-npm",
  "private": true,
  "workspaces": ["apps/*", "packages/*"]
}
```

`npm install` im Root installiert alles und legt für jedes Workspace-Paket einen Symlink in
`node_modules` an. Lokale Pakete trägst du mit einer **normalen Version** ein:

```json title="apps/shop/package.json (npm)"
{
  "dependencies": { "@kiosk/format": "*" }
}
```

Passt ein Workspace-Paket zur Version, verlinkt npm es automatisch statt es herunterzuladen.

> [!FEHLER]
> **`workspace:*` in einem npm-Projekt.** npm kennt dieses Protokoll nicht und bricht mit
> `EUNSUPPORTEDPROTOCOL` ab. Das passiert oft, wenn jemand ein Bun- oder pnpm-Projekt nach npm umzieht.

## Skripte mit npm

| Befehl | Wirkung |
|---|---|
| `npm run build --workspaces` | `build` in allen Workspaces |
| `npm run build --workspaces --if-present` | wie oben, Pakete ohne `build` werden übersprungen |
| `npm run build -w @kiosk/shop` | nur in einem Workspace |
| `npm install zod -w @kiosk/shop` | Abhängigkeit zu einem Workspace hinzufügen |

npm arbeitet die Workspaces in der Reihenfolge ab, in der sie in der package.json stehen – nicht nach Abhängigkeiten. Das ist ein
wichtiger Unterschied zu Bun und pnpm, die interne Abhängigkeiten zuerst bauen.

> [!ACHTUNG]
> Die Kurzform heißt `-w` für **einen** Workspace. Für alle schreibst du `--workspaces` aus –
> `-ws` ist kein gültiger Schalter.

## pnpm Workspaces

[[pnpm]] liest die Paketordner nicht aus der package.json, sondern aus einer eigenen Datei:

```yaml title="pnpm-workspace.yaml"
packages:
  - "apps/*"
  - "packages/*"
catalog:
  react: ^19.2.0
```

| Befehl | Wirkung |
|---|---|
| `pnpm install` | alles installieren, Lockfile `pnpm-lock.yaml` |
| `pnpm -r run build` | `build` rekursiv in allen Paketen |
| `pnpm --filter @kiosk/web build` | nur ein Paket |
| `pnpm add zod --filter @kiosk/api` | Abhängigkeit hinzufügen |

pnpm kennt das `workspace:`-Protokoll und Catalogs – Bun hat beides von dort übernommen. Auch die
[[isolierte-installation|isolierte Installation]], die du in Lektion 6 kennenlernst, ist bei pnpm
seit jeher Standard.

> [!TIPP]
> Yarn (ab Version 2) unterstützt ebenfalls `workspaces` und `workspace:`. Details findest du in der
> [Yarn-Dokumentation](https://yarnpkg.com/features/workspaces).

## Der Vergleich auf einen Blick

| | Bun | npm | pnpm |
|---|---|---|---|
| Paketordner | `workspaces` in package.json | `workspaces` in package.json | `pnpm-workspace.yaml` |
| Lokale Abhängigkeit | `workspace:*` | `*` oder Version | `workspace:*` |
| Catalogs | ja | nein | ja |
| Lockfile | `bun.lock` | `package-lock.json` | `pnpm-lock.yaml` |
| Alle Pakete | `--filter '*'` / `--workspaces` | `--workspaces` | `-r` |
| Ein Paket | `--filter <name>` | `-w <name>` | `--filter <name>` |

> [!MERKSATZ]
> Pro Repository **ein** Paketmanager. Liegen `bun.lock` und `package-lock.json` nebeneinander,
> installiert jede:r im Team mit einem anderen Werkzeug – und bekommt andere Versionen.

> [!PRAXIS]
> Das Feld [[packagemanager-feld|`packageManager`]] in der Root-package.json (z. B. `"packageManager": "bun@1.4.2"`) dokumentiert,
> welcher Paketmanager gemeint ist. Werkzeuge wie Turborepo lesen es aus.

## Von npm oder pnpm zu Bun umziehen

Viele bestehende Monorepos wechseln irgendwann den Paketmanager. Bun macht den Umzug leicht: Findet
`bun install` eine `pnpm-lock.yaml` und noch keine `bun.lock`, übernimmt es die dort festgehaltenen
Versionen automatisch. Für Lockfiles anderer Paketmanager gibt es `bun pm migrate`, das die Versionen
überträgt, ohne gleich zu installieren.

Danach bleiben ein paar Handgriffe:

1. Altes Lockfile löschen, damit es nur noch eine Quelle der Wahrheit gibt.
2. Bei npm-Projekten lokale Abhängigkeiten von `"*"` auf `"workspace:*"` umstellen.
3. Bei pnpm-Projekten die Muster und Catalogs aus `pnpm-workspace.yaml` in die Root-package.json übernehmen.
4. Skripte prüfen, die `npm run … --workspaces` oder `pnpm -r` aufrufen.

## Zusammenfassung

- npm und Bun nutzen das Feld `workspaces`, pnpm die Datei `pnpm-workspace.yaml`.
- npm kennt kein `workspace:`-Protokoll – lokale Pakete stehen dort mit `*` oder einer Version.
- npm: `--workspaces`, `-w <name>`, `--if-present`; pnpm: `-r` und `--filter`.
- pnpm und Bun unterstützen Catalogs und bauen in Abhängigkeitsreihenfolge.
- Das Lockfile verrät den Paketmanager – und es gibt pro Repository nur einen.
