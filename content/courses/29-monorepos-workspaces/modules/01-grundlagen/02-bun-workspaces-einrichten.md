---
title: Bun Workspaces einrichten
summary: Wie die Root-package.json mit dem Feld workspaces ein Monorepo zusammenhält und was bun install dabei macht.
duration: 20
sources:
  - title: Bun Docs – Workspaces
    url: https://bun.com/docs/pm/workspaces
  - title: Bun Docs – bun install
    url: https://bun.com/docs/pm/cli/install
  - title: Bun Docs – Lockfile
    url: https://bun.com/docs/pm/lockfile
quiz:
  - type: single
    question: Wo steht in einem Bun-Monorepo, welche Ordner Workspace-Pakete sind?
    options:
      - In einer bunfig.toml in jedem Paket
      - Im Feld workspaces der Root-package.json
      - In der bun.lock
      - In einer Datei workspaces.txt
    answer: 1
    explanation: Die Root-package.json listet die Paketordner im Feld workspaces – als Array oder als Objekt mit dem Schlüssel packages.
  - type: multiple
    question: Was stimmt nach `bun install` in einem Workspace? (mehrere richtig)
    options:
      - Es gibt genau eine bun.lock, und zwar im Root-Ordner.
      - Jedes Paket bekommt eine eigene bun.lock.
      - Alle Pakete aller Workspaces sind installiert.
      - Workspace-Pakete werden aus der npm-Registry geladen.
    answers: [0, 2]
    explanation: Ein Install, ein Lockfile, alle Pakete. Workspace-Pakete werden lokal verlinkt, nie aus der Registry geholt.
  - type: cloze
    text: 'Das Muster `"___"` nimmt alle direkten Unterordner von packages auf. Ein Muster mit führendem `___` schließt Ordner aus.'
    blanks:
      - ["packages/*"]
      - ["!"]
    explanation: Bun unterstützt die volle Glob-Syntax inklusive negativer Muster wie "!packages/**/test/**".
  - type: find-bug
    question: In welcher Zeile steckt der Fehler? Das Paket in apps/web wird von bun install nicht als Workspace erkannt.
    language: json
    code: |
      {
        "name": "kiosk",
        "private": true,
        "workspaces": ["app/*", "packages/*"]
      }
    bug_line: 4
    explanation: Der Ordner heißt apps, das Muster sucht aber in app. Glob-Muster müssen exakt zum Ordnernamen passen.
tasks:
  - id: erster-workspace
    type: terminal
    title: Mach aus drei Ordnern ein Monorepo
    description: |
      Im Ordner `erster-workspace` liegen schon drei Pakete mit je einer package.json:
      `apps/web`, `apps/api` und `packages/preise`. Die Root-package.json weiß davon aber noch nichts.

      1. Ergänze die Root-`package.json` um `"private": true`.
      2. Ergänze das Feld `workspaces`, sodass **alle** Unterordner von `apps/` und `packages/` dazugehören.
      3. Führe `bun install` im Root-Ordner aus.
      4. Prüfe mit `bun pm ls`, dass alle drei Pakete erkannt wurden.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: erster-workspace
    setup: |
      mkdir -p apps/web apps/api packages/preise
      printf '{\n  "name": "kiosk"\n}\n' > package.json
      printf '{\n  "name": "@kiosk/web",\n  "version": "0.1.0"\n}\n' > apps/web/package.json
      printf '{\n  "name": "@kiosk/api",\n  "version": "0.1.0"\n}\n' > apps/api/package.json
      printf '{\n  "name": "@kiosk/preise",\n  "version": "1.0.0"\n}\n' > packages/preise/package.json
    checks:
      - type: command
        run: jq -r '.private' package.json
        stdout_equals: "true"
        message: 'Die Root-package.json braucht "private": true, damit sie nie versehentlich veröffentlicht wird.'
      - type: command
        run: jq -r '(.workspaces | if type == "object" then .packages else . end) | sort | join(",")' package.json
        stdout_equals: "apps/*,packages/*"
        message: 'Das Feld workspaces soll genau die Muster "apps/*" und "packages/*" enthalten.'
      - type: file_exists
        path: bun.lock
        message: Es gibt noch keine bun.lock im Root-Ordner. Führe dort `bun install` aus.
      - type: command
        run: grep -c '"@kiosk/' bun.lock
        stdout_matches: "^\\s*[3-9]\\s*$"
        message: In der bun.lock fehlen Workspace-Pakete. Stimmen die Muster, und hast du danach erneut `bun install` ausgeführt?
    hints:
      - Öffne die Datei mit `nano package.json` und ergänze zwei Felder.
      - 'Das Feld sieht so aus: `"workspaces": ["apps/*", "packages/*"]`. Achte auf das Komma nach dem vorherigen Feld.'
      - 'Komplett: `{ "name": "kiosk", "private": true, "workspaces": ["apps/*", "packages/*"] }`, danach `bun install` und `bun pm ls`.'
    solution: |
      ```bash
      cd erster-workspace
      cat > package.json <<'EOF'
      {
        "name": "kiosk",
        "private": true,
        "workspaces": ["apps/*", "packages/*"]
      }
      EOF
      bun install
      bun pm ls
      ```
  - id: install-ablauf
    type: order
    title: Was passiert bei bun install?
    description: Bringe die Schritte, die Bun bei `bun install` in einem Monorepo durchläuft, in die richtige Reihenfolge.
    items:
      - Bun sucht nach oben den Root-Ordner mit dem Feld workspaces
      - Bun findet alle Paketordner über die Glob-Muster
      - Bun liest die package.json jedes gefundenen Pakets
      - Bun löst alle Abhängigkeiten gemeinsam auf und dedupliziert sie
      - Externe Pakete werden geladen, Workspace-Pakete lokal verlinkt
      - Bun schreibt eine gemeinsame bun.lock in den Root-Ordner
    hints:
      - Erst muss Bun wissen, welche Pakete es überhaupt gibt.
---
Du hast drei Ordner mit je einer package.json. Ohne weitere Angaben sind das drei unabhängige Projekte:
drei Installationen, drei Lockfiles, drei `node_modules`. Mit einer einzigen Zeile in der Root-package.json
werden daraus Pakete **eines** Monorepos.

## Die Root-package.json

Ein [[workspace|Workspace]] ist ein Verbund von Paketen, die ein [[paketmanager|Paketmanager]] gemeinsam
verwaltet. Den Verbund beschreibt die [[workspace-root|Root-package.json]] ganz oben im Repository:

```json title="package.json (Root)"
{
  "name": "kiosk",
  "private": true,
  "workspaces": ["apps/*", "packages/*"]
}
```

| Feld | Bedeutung |
|---|---|
| `name` | Name des Gesamtprojekts – wird nie als Paket installiert |
| `private` | verhindert, dass der Root versehentlich in einer Registry landet |
| `workspaces` | [[glob-muster\|Glob-Muster]], die auf Paketordner zeigen |

Jeder Ordner, auf den ein Muster passt und der eine eigene package.json hat, ist ein Workspace-Paket.
`apps/*` heißt: jeder **direkte** Unterordner von `apps`.

> [!MERKSATZ]
> Die Root-package.json beschreibt das **Monorepo**, die package.json in jedem Ordner beschreibt das
> **Paket**. Abhängigkeiten gehören fast immer ins Paket, nicht in den Root.

## Muster und die Objekt-Schreibweise

Bun versteht die volle Glob-Syntax, auch tiefe Muster und Ausschlüsse:

```json title="Mehr Möglichkeiten"
{
  "workspaces": [
    "apps/*",
    "packages/**",
    "!packages/**/fixtures/**"
  ]
}
```

`packages/**` findet auch verschachtelte Pakete, `!` schließt Ordner wieder aus – praktisch für
Testdaten, die zufällig eine package.json enthalten.

Statt eines Arrays darf `workspaces` auch ein **Objekt** sein. Das brauchst du, sobald weitere Einstellungen
dazukommen, etwa die [[catalog|Catalogs]] aus Modul 2:

```json title="Objekt-Schreibweise"
{
  "workspaces": {
    "packages": ["apps/*", "packages/*"],
    "catalog": { "react": "^19.2.0" }
  }
}
```

> [!FEHLER]
> **Tippfehler im Muster.** Steht dort `app/*`, der Ordner heißt aber `apps`, meldet Bun keinen Fehler –
> das Paket gehört einfach nicht dazu. Prüfe nach jeder Änderung mit `bun pm ls`, welche Pakete erkannt wurden.

## bun install im Monorepo

Ein einziges `bun install` im Root-Ordner installiert alles für **alle** Pakete:

```bash title="Terminal"
bun install
bun pm ls
```

```text title="Ausgabe von bun pm ls"
/kiosk node_modules (3 installed)
├── @kiosk/api@workspace:apps/api
├── @kiosk/preise@workspace:packages/preise
└── @kiosk/web@workspace:apps/web
```

Was dabei entsteht:

- **Eine** [[bun-lock|bun.lock]] im Root – sie hält die Versionen aller Pakete fest.
- Abhängigkeiten, die mehrere Pakete brauchen, werden nur einmal geladen.
- Workspace-Pakete werden per [[symlink|Symlink]] verknüpft, nie aus der Registry geholt.

Führst du `bun install` in einem Unterordner aus, sucht Bun nach oben den Root und installiert trotzdem
das ganze Monorepo. Das [[lockfile|Lockfile]] landet immer im Root.

> [!ACHTUNG]
> Liegt in einem Paketordner noch eine alte `bun.lock` oder `package-lock.json` aus der Zeit vor dem
> Monorepo, lösche sie. Sonst verwirrt sie Werkzeuge und Kolleg:innen.

## Wohin mit den Abhängigkeiten?

Jedes Paket trägt **seine eigenen** Abhängigkeiten in seine package.json ein. In die Root-package.json
gehören nur Werkzeuge, die das ganze Repository betreffen:

| Gehört in … | Beispiele |
|---|---|
| das Paket | `react` in `apps/web`, `zod` in `apps/api` |
| den Root (`devDependencies`) | `typescript`, Linter, Formatter, `@changesets/cli` |

Mit `bun add` fügst du eine Abhängigkeit gezielt einem Paket hinzu – entweder im Paketordner oder vom Root
aus mit `--filter`:

```bash title="Terminal"
cd apps/api && bun add zod        # im Paketordner
bun add zod --filter @kiosk/api   # vom Root aus
```

> [!PRAXIS]
> Ein guter Test für saubere Pakete: Könntest du einen Paketordner kopieren und allein installieren? Wenn
> ihm dann Abhängigkeiten fehlen, hat er sich unbemerkt auf den Root verlassen.

## Zusammenfassung

- Das Feld `workspaces` in der Root-package.json macht aus Ordnern ein Monorepo.
- Muster wie `apps/*` und `packages/*` finden die Pakete, `!` schließt Ordner aus.
- `workspaces` kann ein Array oder ein Objekt mit `packages` (und später `catalog`) sein.
- Ein `bun install` installiert alles, es gibt genau eine `bun.lock` im Root.
- Abhängigkeiten gehören ins jeweilige Paket, repo-weite Werkzeuge als `devDependencies` in den Root.
- `bun pm ls` zeigt, welche Pakete Bun erkannt hat.
