---
title: CI für Monorepos
summary: Wie eine CI-Pipeline ein Monorepo reproduzierbar installiert, schnell prüft und nur Betroffenes baut, testet und ausliefert.
duration: 25
sources:
  - title: Bun Docs – CI/CD mit GitHub Actions
    url: https://bun.com/docs/guides/runtime/cicd
  - title: Bun Docs – bun install (--frozen-lockfile)
    url: https://bun.com/docs/pm/cli/install
  - title: GitHub Docs – Workflow syntax
    url: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
  - title: actions/checkout
    url: https://github.com/actions/checkout
  - title: Turborepo Docs – run --affected
    url: https://turborepo.dev/docs/reference/run
quiz:
  - type: single
    question: Warum nutzt die CI `bun install --frozen-lockfile` statt `bun install`?
    options:
      - Es ist schneller, weil es nichts herunterlädt.
      - Es bricht ab, wenn package.json und bun.lock nicht zusammenpassen, statt das Lockfile still zu ändern.
      - Es installiert nur Pakete aus dem Root.
      - Es überspringt devDependencies.
    answer: 1
    explanation: Die CI soll genau die Versionen testen, die im Repository festgehalten sind. Ein veraltetes Lockfile ist ein Fehler, den jemand lokal beheben muss.
  - type: multiple
    question: Welche Maßnahmen machen die CI eines großen Monorepos schneller? (mehrere richtig)
    options:
      - Nur betroffene Pakete bauen und testen (affected)
      - Den Paket-Cache von Bun zwischen Läufen aufbewahren
      - Einen Remote-Cache für Build-Ergebnisse nutzen
      - Vor jedem Lauf das Lockfile löschen
    answers: [0, 1, 2]
    explanation: Das Lockfile zu löschen macht Builds nicht schneller, sondern unreproduzierbar.
  - type: cloze
    text: 'Damit `turbo run test --affected` den aktuellen Branch mit main vergleichen kann, braucht der Checkout die volle Historie: `fetch-depth: ___`.'
    blanks:
      - ["0"]
    explanation: Standardmäßig holt actions/checkout nur den letzten Commit. Ohne Historie gilt alles als geändert.
  - type: find-bug
    question: Die Pipeline testet nie die Web-App, obwohl sich dort Code ändert. In welcher Zeile liegt der Fehler?
    language: yaml
    code: |
      on:
        pull_request:
          paths:
            - "packages/**"
      jobs:
        test:
          runs-on: ubuntu-latest
          steps:
            - uses: actions/checkout@v4
            - uses: oven-sh/setup-bun@v2
            - run: bun install --frozen-lockfile
            - run: bun run test
    bug_line: 4
    explanation: Der Pfadfilter startet den Workflow nur bei Änderungen unter packages/. Änderungen in apps/web lösen ihn gar nicht aus.
tasks:
  - id: ci-workflow
    type: terminal
    title: Lockfile reparieren und Workflow schreiben
    description: |
      Im Monorepo `ci-monorepo` hat jemand in `apps/api/package.json` die Abhängigkeit `ms` eingetragen, aber
      vergessen, danach zu installieren. Die `bun.lock` ist also veraltet. Die Root-Skripte `typecheck` und
      `test` gibt es schon.

      1. Führe `bun install --frozen-lockfile` aus – so, wie es die CI tun würde – und lies die Meldung.
      2. Bring die `bun.lock` auf den aktuellen Stand, sodass `bun install --frozen-lockfile` danach erfolgreich ist.
      3. Lege `.github/workflows/ci.yml` an. Der Workflow soll bei Pull Requests laufen und einen Job mit diesen
         Schritten haben:
         - `actions/checkout@v4` mit `fetch-depth: 0`
         - `oven-sh/setup-bun@v2`
         - `bun install --frozen-lockfile`
         - `bun run typecheck`
         - `bun run test`

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: ci-monorepo
    setup: |
      git init -q -b main
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      mkdir -p apps/api apps/web
      cat > package.json <<'EOF'
      {
        "name": "kiosk",
        "private": true,
        "workspaces": {
          "packages": ["apps/*"],
          "catalog": { "ms": "^2.1.3" }
        },
        "scripts": {
          "typecheck": "echo typecheck ok",
          "test": "bun run --workspaces --if-present test"
        }
      }
      EOF
      printf '{\n  "name": "@kiosk/api",\n  "version": "0.1.0",\n  "scripts": { "test": "echo api tests ok" }\n}\n' > apps/api/package.json
      printf '{\n  "name": "@kiosk/web",\n  "version": "0.1.0"\n}\n' > apps/web/package.json
      printf 'node_modules\n' > .gitignore
      bun install > /dev/null 2>&1
      git add -A
      git commit -q -m "chore: initial monorepo"
      printf '{\n  "name": "@kiosk/api",\n  "version": "0.1.0",\n  "dependencies": { "ms": "catalog:" },\n  "scripts": { "test": "echo api tests ok" }\n}\n' > apps/api/package.json
    checks:
      - type: command
        run: bun install --frozen-lockfile > /dev/null 2>&1 && echo ok
        stdout_equals: ok
        message: '`bun install --frozen-lockfile` schlägt noch fehl – die bun.lock passt nicht zur package.json. Führe einmal `bun install` aus.'
      - type: file_exists
        path: .github/workflows/ci.yml
        message: Die Datei .github/workflows/ci.yml fehlt noch.
      - type: command
        run: |-
          bun -e 'const y = Bun.YAML.parse(await Bun.file(".github/workflows/ci.yml").text()); const on = y.on ?? y[true]; console.log(typeof on === "string" ? on : Array.isArray(on) ? on.join(",") : Object.keys(on ?? {}).join(","))'
        stdout_matches: "pull_request"
        message: Der Workflow soll bei pull_request starten (Schlüssel on).
      - type: command
        run: |-
          bun -e 'const y = Bun.YAML.parse(await Bun.file(".github/workflows/ci.yml").text()); const s = Object.values(y.jobs ?? {}).flatMap((j) => j.steps ?? []); const c = s.find((x) => String(x.uses ?? "").startsWith("actions/checkout")); console.log(c ? String(c.with?.["fetch-depth"]) : "fehlt")'
        stdout_equals: "0"
        message: 'Es fehlt ein Schritt mit actions/checkout und "with: fetch-depth: 0".'
      - type: command
        run: |-
          bun -e 'const y = Bun.YAML.parse(await Bun.file(".github/workflows/ci.yml").text()); const s = Object.values(y.jobs ?? {}).flatMap((j) => j.steps ?? []); const u = s.map((x) => x.uses ?? ""); const r = s.map((x) => x.run ?? "").join("\n"); console.log([u.some((x) => x.startsWith("oven-sh/setup-bun")), /bun install --frozen-lockfile|bun ci/.test(r), /bun run typecheck/.test(r), /bun run test/.test(r)].join(" "))'
        stdout_equals: "true true true true"
        message: Im Workflow fehlt einer der Schritte setup-bun, bun install --frozen-lockfile, bun run typecheck oder bun run test.
    hints:
      - Die CI-Meldung lautet sinngemäß „lockfile had changes, but lockfile is frozen“. Lokal reicht ein normales `bun install`.
      - 'Ein Workflow beginnt mit `name:`, `on:` und `jobs:`. Jeder Schritt ist ein Listeneintrag mit `uses:` oder `run:`.'
      - 'Für den Checkout: `- uses: actions/checkout@v4` und darunter eingerückt `with:` und `fetch-depth: 0`.'
    solution: |
      ```bash
      cd ci-monorepo
      bun install --frozen-lockfile || true   # schlägt fehl: Lockfile veraltet
      bun install
      bun install --frozen-lockfile
      mkdir -p .github/workflows
      cat > .github/workflows/ci.yml <<'EOF'
      name: CI
      on:
        pull_request:
        push:
          branches: [main]
      jobs:
        check:
          runs-on: ubuntu-latest
          steps:
            - uses: actions/checkout@v4
              with:
                fetch-depth: 0
            - uses: oven-sh/setup-bun@v2
            - run: bun install --frozen-lockfile
            - run: bun run typecheck
            - run: bun run test
      EOF
      ```
  - id: ci-entscheidungen
    type: steps
    title: Die Pipeline wächst mit
    description: Die CI deines Monorepos braucht inzwischen 20 Minuten. Triff in jeder Situation die beste Entscheidung.
    steps:
      - situation: Jeder Pull Request baut und testet alle zwölf Pakete, auch wenn nur die Doku-App geändert wurde.
        question: Was hilft am meisten?
        options:
          - Nur betroffene Pakete testen, z. B. mit turbo run test --affected
          - Tests nur noch nachts laufen lassen
          - Alle Pakete in ein einziges zusammenlegen
        answer: 0
        explanation: Affected-Builds testen genau das, was sich geändert hat, plus alle Pakete, die davon abhängen.
      - situation: Du stellst auf --affected um, aber trotzdem werden immer alle Pakete getestet.
        question: Was ist die wahrscheinlichste Ursache?
        options:
          - Der Checkout holt nur den letzten Commit, also fehlt der Vergleich mit main
          - Bun ist zu alt
          - Das Lockfile ist zu groß
        answer: 0
        explanation: Ohne fetch-depth 0 (oder genug Historie) kann das Werkzeug nicht vergleichen und nimmt sicherheitshalber alles.
      - situation: Web-App und API sollen nach dem Merge getrennt ausgeliefert werden – aber nur, wenn sie sich geändert haben.
        question: Wie baust du das?
        options:
          - Ein Deploy-Job pro App, der nur startet, wenn die App oder eine ihrer Abhängigkeiten betroffen ist
          - Beide Apps immer gemeinsam ausliefern
          - Die API aus dem Monorepo entfernen
        answer: 0
        explanation: Getrennte Jobs mit Affected-Prüfung halten Deployments klein und unabhängig.
---
Im Monorepo landet jede Änderung im selben Repository – und damit in derselben CI-Pipeline. Ohne Plan
dauert jeder Pull Request ewig, oder schlimmer: Die CI testet andere Versionen als die, die auf deinem
Rechner laufen. Diese Lektion zeigt, worauf es bei einer Pipeline für Monorepos ankommt.

## Reproduzierbar installieren

Die [[ci-pipeline|CI-Pipeline]] soll exakt die Versionen testen, die in der `bun.lock` stehen. Dafür gibt es
den Schalter [[frozen-lockfile|`--frozen-lockfile`]]:

```text title="bun install --frozen-lockfile mit veraltetem Lockfile"
error: lockfile had changes, but lockfile is frozen
```

| Befehl | Verhalten |
|---|---|
| `bun install` | passt die bun.lock an, wenn package.json sich geändert hat |
| `bun install --frozen-lockfile` | bricht ab, wenn die bun.lock nicht passt |
| `bun ci` | Kurzform für die eingefrorene Installation |

Der Fehler ist gewollt: Jemand hat eine Abhängigkeit eingetragen, aber das neue Lockfile nicht
committet. Das muss lokal behoben werden, nicht still in der CI.

> [!MERKSATZ]
> Lokal `bun install`, in der CI `bun install --frozen-lockfile`. Die bun.lock wird immer zusammen mit der
> geänderten package.json committet.

## Ein Workflow für GitHub Actions

Mit [[github-actions|GitHub Actions]] sieht eine einfache Pipeline für ein Bun-Monorepo so aus:

```yaml title=".github/workflows/ci.yml"
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run typecheck
      - run: bun run test
```

Die Pipeline nutzt die Root-Skripte aus Lektion 9. So läuft in der CI genau das, was jede:r im Team lokal
startet. `fetch-depth: 0` holt die ganze Git-Historie – die brauchst du, sobald du nur Betroffenes testen willst.

> [!FEHLER]
> **Unterschiedliche Befehle lokal und in der CI.** Steht in der Pipeline eine lange Kette eigener
> Befehle, laufen lokal und in der CI bald verschiedene Prüfungen. Lege alles als Root-Skript an und rufe
> in der CI nur `bun run <skript>` auf.

## Nur Betroffenes bauen

Je größer das Monorepo, desto wichtiger ist es, nicht alles bei jeder Änderung zu prüfen:

| Technik | Wie |
|---|---|
| [[betroffene-pakete\|Affected]] | `bunx turbo run test --affected` oder `nx affected -t test` vergleicht mit `main` |
| Abhängige mitnehmen | Bun-Filter wie `--filter '...@kiosk/preise'` testen alle Nutzer eines Pakets |
| Pfadfilter | `on.pull_request.paths` startet einen Workflow nur bei Änderungen in bestimmten Ordnern |
| Inkrementell | `tsc -b` prüft nur veraltete Projekte |

> [!ACHTUNG]
> Pfadfilter sind grob: Ein Workflow mit `paths: ["apps/web/**"]` startet **nicht**, wenn sich nur die
> Bibliothek ändert, die die Web-App nutzt. Für Abhängigkeiten zwischen Paketen ist `--affected` die
> sicherere Wahl.

## Caches in der CI

Zwei Caches beschleunigen jeden Lauf:

- **Paket-[[cache|Cache]]:** Bun speichert heruntergeladene Pakete global (unter `~/.bun/install/cache`).
  Mit `actions/cache` und dem Hash der `bun.lock` als Schlüssel bleibt er zwischen Läufen erhalten.
- **Build-Cache:** Mit Turborepo oder Nx und einem Remote-Cache bekommt die CI Ergebnisse, die schon einmal
  gebaut wurden – auch von deinem Laptop. Der Zugangsschlüssel kommt als [[secret|Secret]] in die Pipeline,
  nie ins Repository.

```yaml title="Paket-Cache in GitHub Actions"
- uses: actions/cache@v4
  with:
    path: ~/.bun/install/cache
    key: bun-${{ runner.os }}-${{ hashFiles('bun.lock') }}
```

> [!PRAXIS]
> Für die Auslieferung bekommt jede App einen eigenen Job oder Workflow. Im Docker-Image der API installierst
> du mit `bun install --filter @kiosk/api --frozen-lockfile` nur, was die API braucht. Und eine
> [[codeowners|CODEOWNERS]]-Datei sorgt dafür, dass Änderungen in `apps/api/` automatisch vom API-Team
> reviewt werden.

## Zusammenfassung

- In der CI installierst du mit `bun install --frozen-lockfile` (oder `bun ci`) – ein veraltetes Lockfile bricht den Lauf ab.
- Ein Workflow besteht aus Checkout, `oven-sh/setup-bun`, eingefrorener Installation und den Root-Skripten.
- `fetch-depth: 0` ist nötig, damit `--affected` mit `main` vergleichen kann.
- Pfadfilter sind grob, Affected-Builds berücksichtigen die Abhängigkeiten zwischen Paketen.
- Paket-Cache und Remote-Build-Cache sparen Zeit; Zugangsschlüssel gehören in Secrets, Deployments in eigene Jobs pro App.
