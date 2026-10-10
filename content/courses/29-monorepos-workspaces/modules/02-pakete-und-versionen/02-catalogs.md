---
title: Versionen zentral festlegen mit Catalogs
summary: Wie Catalogs verhindern, dass Pakete im Monorepo unterschiedliche Versionen derselben Abhängigkeit nutzen.
duration: 20
sources:
  - title: Bun Docs – Catalogs
    url: https://bun.com/docs/pm/catalogs
  - title: Bun Docs – bun add
    url: https://bun.com/docs/pm/cli/add
  - title: pnpm Docs – Catalogs
    url: https://pnpm.io/catalogs
quiz:
  - type: single
    question: Welches Problem lösen Catalogs?
    options:
      - Sie machen bun install schneller.
      - Sie sorgen dafür, dass alle Pakete dieselbe Version einer Abhängigkeit nutzen, die nur an einer Stelle steht.
      - Sie ersetzen das Lockfile.
      - Sie veröffentlichen Pakete automatisch.
    answer: 1
    explanation: Ein Catalog ist eine zentrale Versionsliste. Pakete verweisen mit catalog darauf, statt selbst eine Version zu nennen.
  - type: match
    question: Worauf verweist welche Angabe?
    pairs:
      - { left: "catalog:", right: "Standard-Catalog" }
      - { left: "catalog:default", right: "Standard-Catalog (ausgeschrieben)" }
      - { left: "catalog:testing", right: "Benannter Catalog testing" }
      - { left: "workspace:*", right: "Lokales Workspace-Paket" }
    explanation: catalog und catalog:default sind gleichwertig. Benannte Catalogs stehen unter catalogs.
  - type: cloze
    text: 'Mit `bun add react --___` trägt Bun react in den Standard-Catalog ein und schreibt `"___"` in die package.json des aktuellen Pakets.'
    blanks:
      - [catalog]
      - ["catalog:"]
    explanation: Mit --catalog=name landet die Version in einem benannten Catalog.
  - type: find-bug
    question: bun install bricht ab. In welcher Zeile steckt der Fehler?
    language: json
    code: |
      {
        "name": "kiosk",
        "private": true,
        "workspaces": {
          "packages": ["apps/*", "packages/*"],
          "catalog": { "react": "^19.2.0" },
          "catalogs": { "tests": { "vitest": "^4.0.0" } }
        }
      }
      // apps/web/package.json:
      // "devDependencies": { "vitest": "catalog:testing" }
    bug_line: 11
    explanation: Der benannte Catalog heißt tests, verwiesen wird aber auf testing. Jede catalog-Angabe muss zu einem vorhandenen Eintrag passen.
tasks:
  - id: catalog-einfuehren
    type: terminal
    title: Zwei Versionen, ein Catalog
    description: |
      Im Monorepo `catalog-einfuehren` nutzen `apps/web` und `packages/zeit` beide das Paket `ms` – aber mit
      unterschiedlichen Versionsangaben. Zusätzlich braucht `packages/zeit` das Werkzeug `picocolors`.

      1. Stelle die Root-`package.json` auf die Objekt-Schreibweise um und lege einen **Standard-Catalog** mit
         `"ms": "^2.1.3"` an.
      2. Lege einen **benannten Catalog** `cli` mit `"picocolors": "^1.1.0"` an.
      3. Ändere `apps/web` und `packages/zeit` so, dass beide `ms` mit `catalog:` beziehen.
      4. Ändere `packages/zeit` so, dass `picocolors` aus dem Catalog `cli` kommt.
      5. Führe `bun install` aus.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: catalog-einfuehren
    setup: |
      mkdir -p apps/web packages/zeit
      cat > package.json <<'EOF'
      {
        "name": "kiosk",
        "private": true,
        "workspaces": ["apps/*", "packages/*"]
      }
      EOF
      cat > apps/web/package.json <<'EOF'
      {
        "name": "@kiosk/web",
        "version": "0.1.0",
        "dependencies": {
          "ms": "^2.1.1"
        }
      }
      EOF
      cat > packages/zeit/package.json <<'EOF'
      {
        "name": "@kiosk/zeit",
        "version": "1.0.0",
        "dependencies": {
          "ms": "2.1.3",
          "picocolors": "^1.0.0"
        }
      }
      EOF
    checks:
      - type: command
        run: jq -r '.workspaces.catalog.ms // "fehlt"' package.json
        stdout_equals: "^2.1.3"
        message: 'Im Root fehlt workspaces.catalog mit "ms": "^2.1.3". Denk an die Objekt-Schreibweise mit "packages".'
      - type: command
        run: jq -r '.workspaces.packages | sort | join(",")' package.json
        stdout_equals: "apps/*,packages/*"
        message: 'In der Objekt-Schreibweise stehen die Muster unter workspaces.packages: ["apps/*", "packages/*"].'
      - type: command
        run: jq -r '.workspaces.catalogs.cli.picocolors // "fehlt"' package.json
        stdout_equals: "^1.1.0"
        message: 'Lege unter workspaces.catalogs einen Catalog "cli" mit "picocolors": "^1.1.0" an.'
      - type: command
        run: jq -r '.dependencies.ms' apps/web/package.json packages/zeit/package.json | sort -u
        stdout_equals: "catalog:"
        message: 'apps/web und packages/zeit sollen ms beide mit "catalog:" beziehen.'
      - type: command
        run: jq -r '.dependencies.picocolors // .devDependencies.picocolors // "fehlt"' packages/zeit/package.json
        stdout_equals: "catalog:cli"
        message: 'packages/zeit soll picocolors mit "catalog:cli" beziehen.'
      - type: command
        run: |-
          sed -n '/^  "catalog"/,/}/p' bun.lock | grep -c '"ms": "^2.1.3"'
        stdout_equals: "1"
        message: Die bun.lock kennt den Catalog noch nicht. Führe `bun install` aus.
    hints:
      - '`"workspaces"` wird ein Objekt: `{ "packages": [...], "catalog": {...}, "catalogs": {...} }`.'
      - 'Benannte Catalogs stehen unter `"catalogs": { "cli": { "picocolors": "^1.1.0" } }`, verwiesen wird mit `"catalog:cli"`.'
      - Die fertigen Dateien findest du in der Lösung – vergleiche sie mit deinen.
    solution: |
      ```bash
      cd catalog-einfuehren
      cat > package.json <<'EOF'
      {
        "name": "kiosk",
        "private": true,
        "workspaces": {
          "packages": ["apps/*", "packages/*"],
          "catalog": { "ms": "^2.1.3" },
          "catalogs": { "cli": { "picocolors": "^1.1.0" } }
        }
      }
      EOF
      cat > apps/web/package.json <<'EOF'
      {
        "name": "@kiosk/web",
        "version": "0.1.0",
        "dependencies": { "ms": "catalog:" }
      }
      EOF
      cat > packages/zeit/package.json <<'EOF'
      {
        "name": "@kiosk/zeit",
        "version": "1.0.0",
        "dependencies": { "ms": "catalog:", "picocolors": "catalog:cli" }
      }
      EOF
      bun install
      ```
  - id: catalog-update
    type: steps
    title: Ein Update mit Catalog
    description: Im Monorepo nutzen fünf Pakete React über `catalog:`. Eine neue React-Version ist erschienen.
    steps:
      - situation: Du willst alle fünf Pakete auf die neue React-Version heben.
        question: Wo änderst du die Version?
        options:
          - In allen fünf package.json-Dateien
          - Einmal im Catalog der Root-package.json
          - In der bun.lock
        answer: 1
        explanation: Genau das ist der Sinn eines Catalogs – eine Stelle für alle Pakete.
      - situation: Die Version im Catalog ist geändert.
        question: Was ist der nächste Schritt?
        options:
          - bun install ausführen, damit Lockfile und node_modules aktualisiert werden
          - Nichts, die Änderung wirkt sofort
          - Jedes Paket einzeln veröffentlichen
        answer: 0
        explanation: Erst bun install löst die neue Version auf und schreibt sie in die bun.lock.
      - situation: Ein Paket braucht vorübergehend eine ältere React-Version, weil eine Bibliothek noch nicht kompatibel ist.
        question: Was ist die sauberste Lösung?
        options:
          - Den Standard-Catalog zurückdrehen
          - Für dieses eine Paket eine feste Version statt catalog eintragen und das als Ausnahme dokumentieren
          - Das Paket aus dem Monorepo löschen
        answer: 1
        explanation: Catalogs sind ein Standard, keine Pflicht. Bewusste, dokumentierte Ausnahmen sind erlaubt – sie sollten aber selten bleiben.
---
Im Monorepo nutzen Web-App, API und UI-Bibliothek React. Die Web-App steht auf `^19.2.0`, die
UI-Bibliothek noch auf `^19.0.0`, und irgendwann landen zwei React-Versionen im Projekt. Das führt zu
schwer zu findenden Fehlern. Catalogs schieben dem einen Riegel vor.

## Das Problem: auseinanderlaufende Versionen

Jedes Paket trägt seine Abhängigkeiten selbst ein. Bei drei Paketen mit derselben Bibliothek stehen also
drei Versionsangaben im Repository – und die laufen mit der Zeit auseinander:

| Paket | Angabe | Folge |
|---|---|---|
| apps/web | `"react": "^19.2.0"` | neueste Version |
| packages/ui | `"react": "^19.0.0"` | darf älter bleiben |
| apps/admin | `"react": "19.1.0"` | fest gepinnt |

Updates werden mühsam, weil du jede Datei einzeln anfassen musst. Und manche Bibliotheken wie React
funktionieren gar nicht, wenn zwei Versionen gleichzeitig geladen werden.

Viele Teams folgen deshalb einer [[single-version-policy|Single-Version-Policy]]: Jede externe
Abhängigkeit gibt es im Monorepo nur in **einer** Version.

## Der Standard-Catalog

Ein [[catalog|Catalog]] ist eine zentrale Liste von Versionen in der Root-package.json. Er steht im
Objekt `workspaces`:

```json title="package.json (Root)"
{
  "name": "kiosk",
  "private": true,
  "workspaces": {
    "packages": ["apps/*", "packages/*"],
    "catalog": {
      "react": "^19.2.0",
      "zod": "^4.1.0"
    }
  }
}
```

Die Pakete nennen keine Version mehr, sondern verweisen auf den Catalog:

```json title="apps/web/package.json"
{
  "dependencies": {
    "react": "catalog:",
    "zod": "catalog:"
  }
}
```

`catalog:` (gleichbedeutend mit `catalog:default`) heißt: Nimm die Version aus dem Standard-Catalog. Das
funktioniert in `dependencies`, `devDependencies`, `peerDependencies` und `optionalDependencies`.

> [!MERKSATZ]
> Der Catalog legt die Version **einmal** fest, `catalog:` übernimmt sie. Ein Update ist eine einzige Zeile
> in der Root-package.json – gefolgt von `bun install`.

## Benannte Catalogs

Manchmal brauchst du Gruppen, etwa alle Test-Werkzeuge oder eine zweite React-Version für eine Migration.
Dafür gibt es benannte Catalogs unter `catalogs`:

```json title="package.json (Root)"
{
  "workspaces": {
    "packages": ["apps/*", "packages/*"],
    "catalog": { "react": "^19.2.0" },
    "catalogs": {
      "testing": { "vitest": "^4.0.0" },
      "cli": { "picocolors": "^1.1.0" }
    }
  }
}
```

```json title="packages/ui/package.json"
{
  "dependencies": { "react": "catalog:" },
  "devDependencies": { "vitest": "catalog:testing" }
}
```

> [!FEHLER]
> **Verweis ohne passenden Eintrag.** Steht in einem Paket `catalog:testing`, im Root heißt der Catalog
> aber `tests`, bricht `bun install` ab. Name und Paket müssen im Catalog existieren. Ein Paket darf außerdem
> nicht gleichzeitig in `catalog` und in `catalogs.default` stehen.

## Arbeiten mit Catalogs

Du musst Catalogs nicht von Hand pflegen. `bun add` hilft:

```bash title="Terminal – im Paketordner apps/web"
bun add --catalog react            # Version in den Standard-Catalog, "catalog:" ins Paket
bun add --catalog=testing vitest   # in den benannten Catalog testing
```

| Situation | Vorgehen |
|---|---|
| Update für alle | Version im Root-Catalog ändern, `bun install` |
| Neue gemeinsame Abhängigkeit | `bun add --catalog <paket>` im Paketordner |
| Bewusste Ausnahme | feste Version im einzelnen Paket – und dokumentieren, warum |
| Veröffentlichen | `bun publish` und `bun pm pack` ersetzen `catalog:` durch die echte Version |

Die [[bun-lock|bun.lock]] speichert die Catalog-Definitionen und die aufgelöste Version jedes Eintrags.
Damit bekommen alle im Team exakt dieselben Versionen.

> [!PRAXIS]
> pnpm kennt Catalogs mit derselben Schreibweise (`catalog:`), nur stehen sie dort in der
> `pnpm-workspace.yaml`. Beim Umstieg zwischen Bun und pnpm bleiben die package.json-Dateien der Pakete
> also gleich.

## Catalogs im Team-Alltag

Ein Catalog wirkt nur, wenn alle ihn nutzen. Drei Gewohnheiten helfen dabei:

1. **Neue gemeinsame Abhängigkeiten** kommen immer mit `bun add --catalog` ins Projekt, nie mit einer
   festen Version im einzelnen Paket.
2. **Im Code-Review** fällt jede Versionsangabe ohne `catalog:` auf. Sie ist entweder ein Versehen oder eine
   bewusste Ausnahme, die einen Kommentar im Pull Request braucht.
3. **Updates** sind eigene, kleine Pull Requests: eine Zeile im Catalog, die neue `bun.lock` – und die CI
   prüft sofort alle Pakete, die die Abhängigkeit nutzen.

So wird aus der Single-Version-Policy eine gelebte Regel statt eines guten Vorsatzes. Gleichzeitig bleibt
jedes Paket ehrlich: In seiner package.json steht weiterhin, **welche** Abhängigkeiten es braucht – nur die
Version kommt von zentraler Stelle.

## Zusammenfassung

- Ohne Catalog laufen Versionsangaben in Monorepos auseinander – Updates werden mühsam und fehleranfällig.
- Der Standard-Catalog steht unter `workspaces.catalog`, Pakete verweisen mit `"catalog:"` darauf.
- Benannte Catalogs stehen unter `workspaces.catalogs` und werden mit `"catalog:name"` genutzt.
- `bun add --catalog` pflegt Catalog und Paket in einem Schritt.
- Updates: Version im Root ändern, `bun install` – beim Veröffentlichen ersetzt Bun `catalog:` durch echte Versionen.
