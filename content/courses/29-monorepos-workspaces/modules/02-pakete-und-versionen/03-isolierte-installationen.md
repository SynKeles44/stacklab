---
title: Isolierte Installationen und Phantom-Abhängigkeiten
summary: Warum Bun Workspace-Pakete standardmäßig isoliert installiert, wie Phantom-Abhängigkeiten entstehen und wie du sie findest und behebst.
duration: 20
sources:
  - title: Bun Docs – Isolated installs
    url: https://bun.com/docs/pm/isolated-installs
  - title: Bun Docs – bun why
    url: https://bun.com/docs/pm/cli/why
  - title: Bun Docs – bunfig.toml (install.linker)
    url: https://bun.com/docs/runtime/bunfig
  - title: pnpm Docs – Motivation
    url: https://pnpm.io/motivation
quiz:
  - type: single
    question: Was ist eine Phantom-Abhängigkeit?
    options:
      - Ein Paket, das in der package.json steht, aber nie importiert wird.
      - Ein Paket, das dein Code importiert, obwohl es nicht in seiner package.json steht.
      - Ein Paket, das nur in der Registry existiert.
      - Ein Workspace-Paket ohne Version.
    answer: 1
    explanation: Der Import funktioniert nur zufällig, weil ein anderes Paket die Abhängigkeit mitgebracht hat. Fällt sie dort weg, bricht dein Code.
  - type: multiple
    question: Was stimmt für den isolierten Linker von Bun? (mehrere richtig)
    options:
      - Pakete liegen in einem zentralen Speicher unter node_modules/.bun.
      - Jedes Paket sieht nur die Abhängigkeiten, die es selbst deklariert.
      - Er ist für neue Projekte mit Workspaces der Standard.
      - Er kopiert jedes Paket für jedes Workspace-Paket einzeln auf die Festplatte.
    answers: [0, 1, 2]
    explanation: Statt Kopien legt der isolierte Linker Symlinks in den zentralen Speicher an. So bleibt er schnell und platzsparend.
  - type: cloze
    text: 'Mit `bun install --linker ___` erzwingst du die klassische, flache node_modules-Struktur. Dauerhaft stellst du das in der bunfig.toml unter `[install]` mit `linker = "___"` ein.'
    blanks:
      - [hoisted]
      - [hoisted]
    explanation: Die beiden Werte heißen isolated und hoisted. Ohne Angabe entscheidet die configVersion in der bun.lock.
  - type: match
    question: Welcher Befehl hilft bei welcher Frage?
    pairs:
      - { left: "bun why ms", right: "Warum ist ms überhaupt installiert?" }
      - { left: "bun pm ls", right: "Welche Pakete sind direkt installiert?" }
      - { left: "bun install --filter @kiosk/api", right: "Nur das installieren, was die API braucht" }
      - { left: "bun install --linker isolated", right: "Strikte Trennung der Pakete erzwingen" }
    explanation: bun why zeigt die Kette von Paketen, die eine Abhängigkeit mitbringen.
tasks:
  - id: phantom-beheben
    type: terminal
    title: Eine Phantom-Abhängigkeit beheben
    description: |
      Im Monorepo `phantom` nutzt `packages/zeit` das Paket `ms` und hat es korrekt eingetragen.
      `apps/web` importiert `ms` ebenfalls – hat es aber **nicht** in seiner package.json. Die Installation ist
      schon gelaufen.

      1. Starte `bun apps/web/src/main.ts` und lies die Fehlermeldung.
      2. Finde mit `bun why ms` heraus, welches Paket `ms` bisher mitbringt.
      3. Trage `ms` in `apps/web` ein – über den vorhandenen Standard-Catalog, also mit `catalog:`.
      4. Installiere neu und starte die App erneut. Erwartete Ausgabe: `1m`.

      Klicke zuerst auf **Aufgabe vorbereiten** (das dauert ein paar Sekunden).
    workdir: phantom
    setup: |
      mkdir -p apps/web/src packages/zeit/src
      cat > package.json <<'EOF'
      {
        "name": "kiosk",
        "private": true,
        "workspaces": {
          "packages": ["apps/*", "packages/*"],
          "catalog": { "ms": "^2.1.3" }
        }
      }
      EOF
      cat > packages/zeit/package.json <<'EOF'
      {
        "name": "@kiosk/zeit",
        "version": "1.0.0",
        "type": "module",
        "exports": "./src/index.ts",
        "dependencies": { "ms": "catalog:" }
      }
      EOF
      printf 'import ms from "ms";\nexport const dauer = (wert: string) => ms(wert);\n' > packages/zeit/src/index.ts
      cat > apps/web/package.json <<'EOF'
      {
        "name": "@kiosk/web",
        "version": "0.1.0",
        "type": "module"
      }
      EOF
      printf 'import ms from "ms";\nconsole.log(ms(60000));\n' > apps/web/src/main.ts
      bun install > /dev/null 2>&1
    checks:
      - type: command
        run: jq -r '.dependencies.ms // .devDependencies.ms // "fehlt"' apps/web/package.json
        stdout_equals: "catalog:"
        message: 'apps/web soll ms als Abhängigkeit mit "catalog:" eintragen.'
      - type: command
        run: bun apps/web/src/main.ts
        stdout_equals: "1m"
        message: apps/web kann ms noch nicht laden. Hast du nach dem Eintragen `bun install` ausgeführt?
      - type: command
        run: test -L apps/web/node_modules/ms && echo link
        stdout_equals: link
        message: In apps/web/node_modules fehlt der Link auf ms. Führe `bun install` im Root aus.
    hints:
      - Die Meldung lautet sinngemäß „Cannot find package ms“ – apps/web darf ms nicht sehen, weil es nicht eingetragen ist.
      - '`bun why ms` zeigt, dass nur @kiosk/zeit ms verlangt.'
      - 'Im Ordner apps/web: `bun add --catalog ms`. Oder per Hand `"dependencies": { "ms": "catalog:" }` und danach `bun install`.'
    solution: |
      ```bash
      cd phantom
      bun apps/web/src/main.ts || true   # Cannot find package 'ms'
      bun why ms
      cd apps/web && bun add --catalog ms && cd ../..
      bun install
      bun apps/web/src/main.ts           # 1m
      ```
  - id: hoisted-oder-isolated
    type: dragdrop
    title: Hoisted oder isoliert?
    description: Ordne jede Eigenschaft dem passenden Installations-Modus zu.
    targets:
      - { id: hoisted, label: Hoisted (flach) }
      - { id: isolated, label: Isoliert }
    items:
      - { label: Alle Pakete liegen flach im Root-node_modules, target: hoisted }
      - { label: Phantom-Abhängigkeiten funktionieren zufällig, target: hoisted }
      - { label: Klassisches Verhalten von npm und Yarn 1, target: hoisted }
      - { label: Zentraler Speicher unter node_modules/.bun, target: isolated }
      - { label: "Jedes Paket sieht nur, was es deklariert", target: isolated }
      - { label: Standard bei pnpm und bei neuen Bun-Workspaces, target: isolated }
    hints:
      - „Hoisting“ heißt Hochziehen – Pakete wandern nach oben in den Root.
---
In deinem Monorepo läuft alles – bis jemand in `packages/zeit` eine Abhängigkeit entfernt. Plötzlich
stürzt die Web-App ab, obwohl dort niemand etwas geändert hat. Der Grund ist eine Phantom-Abhängigkeit.
Bun verhindert sie mit isolierten Installationen.

## Zwei Arten, node_modules zu füllen

Ein Paketmanager kann installierte Pakete auf zwei Arten anordnen. Bun nennt das den **Linker**.

| Modus | So sieht es aus | Folge |
|---|---|---|
| [[paket-hoisting\|Hoisted]] | Alle Pakete liegen flach in `node_modules` im Root | jedes Paket findet jede Abhängigkeit |
| [[isolierte-installation\|Isoliert]] | Pakete liegen in `node_modules/.bun`, jedes Paket bekommt nur Links auf seine eigenen Abhängigkeiten | jedes Paket sieht nur, was es deklariert |

![Hoisted und isolierte Installation im Vergleich](/assets/monorepos-workspaces/hoisted-vs-isoliert.svg)

Beim Hoisting werden Pakete „nach oben gezogen“. Node.js und Bun suchen Importe vom Paketordner aus
nach oben in jedem `node_modules`. Liegt alles im Root, wird alles gefunden – auch, was gar nicht
deklariert ist.

## Phantom-Abhängigkeiten

Eine [[phantom-abhaengigkeit|Phantom-Abhängigkeit]] ist ein Paket, das dein Code importiert, ohne es
in seiner package.json einzutragen:

```text title="Das Szenario"
packages/zeit/package.json   → "ms": "catalog:"     ✅ eingetragen
apps/web/package.json        → (kein ms)             ❌ nicht eingetragen
apps/web/src/main.ts         → import ms from "ms"  🤞 klappt nur dank Hoisting
```

Im hoisted Modus funktioniert der Import, weil `ms` zufällig im Root liegt. Entfernt jemand `ms` aus
`packages/zeit`, verschwindet es aus dem Root – und `apps/web` bricht, ohne selbst geändert worden zu sein.

```text title="Im isolierten Modus fällt der Fehler sofort auf"
$ bun apps/web/src/main.ts
error: Cannot find package 'ms' from '/kiosk/apps/web/src/main.ts'
```

> [!MERKSATZ]
> Was ein Paket importiert, muss in **seiner** package.json stehen. Der isolierte Linker erzwingt diese Regel,
> der hoisted Linker verdeckt Verstöße.

## Der isolierte Linker in Bun

Bei neuen Projekten mit Workspaces ist der isolierte Linker der Standard. Ob ein Projekt „neu“ ist, merkt
sich Bun über `configVersion` in der `bun.lock`:

| configVersion | Workspaces | Einzelnes Paket |
|---|---|---|
| `1` (neue Projekte, auch aus pnpm migriert) | isoliert | hoisted |
| `0` (ältere Projekte, aus npm/Yarn migriert) | hoisted | hoisted |

Du kannst den Modus jederzeit ausdrücklich wählen:

```bash title="Terminal"
bun install --linker isolated
bun install --linker hoisted
```

```toml title="bunfig.toml – dauerhaft für das Projekt"
[install]
linker = "isolated"
```

Im isolierten Modus sieht `node_modules` so aus:

```text title="Isolierte Struktur"
node_modules/.bun/ms@2.1.3/node_modules/ms   ← das echte Paket, einmal gespeichert
apps/web/node_modules/ms        → Symlink in den Speicher
packages/zeit/node_modules/ms   → Symlink in den Speicher
```

> [!FEHLER]
> **„Bei mir läuft es doch!“** Läuft ein Projekt lokal mit einem alten, hoisted `node_modules`, in der CI
> aber nicht, ist oft eine Phantom-Abhängigkeit schuld. Lösche `node_modules`, installiere neu und trage
> fehlende Pakete ein, statt auf hoisted zurückzuschalten.

## Werkzeuge für saubere Abhängigkeiten

| Befehl | Wofür |
|---|---|
| `bun why ms` | zeigt, welche Pakete `ms` verlangen – über welche Kette |
| `bun pm ls` | listet die installierten Pakete |
| `bun install --filter @kiosk/api` | installiert nur, was die API (und ihre internen Abhängigkeiten) braucht |
| `bun outdated` | zeigt veraltete Abhängigkeiten in allen Workspaces |

```text title="bun why ms"
ms@2.1.3
  └─ @kiosk/zeit@workspace (requires catalog:)
```

`bun install --filter` ist besonders in Docker-Images und CI nützlich: Für das Image der API brauchst du
nicht die Abhängigkeiten der Web-App.

> [!PRAXIS]
> Wer ein bestehendes Monorepo von npm auf Bun umzieht, startet hoisted (configVersion 0). Ein guter erster
> Schritt ist ein Testlauf mit `bun install --linker isolated`: Alles, was danach nicht mehr startet, ist eine
> Phantom-Abhängigkeit, die du eintragen solltest.

## Zusammenfassung

- **Hoisted** legt alle Pakete flach in den Root, **isoliert** gibt jedem Paket nur Links auf seine eigenen Abhängigkeiten.
- Phantom-Abhängigkeiten sind Importe ohne Eintrag in der eigenen package.json – sie brechen unvorhersehbar.
- Bun nutzt für neue Workspaces (configVersion 1) den isolierten Linker mit Speicher in `node_modules/.bun`.
- Umschalten mit `--linker isolated|hoisted` oder dauerhaft mit `[install] linker` in der bunfig.toml.
- `bun why` erklärt, warum ein Paket installiert ist; `bun install --filter` installiert nur Teile des Monorepos.
