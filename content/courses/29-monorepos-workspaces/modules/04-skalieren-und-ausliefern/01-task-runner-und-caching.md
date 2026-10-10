---
title: Task-Runner und Caching mit Turborepo und Nx
summary: Wie Task-Runner Builds im Monorepo beschleunigen – mit Task-Graph, Cache, Remote-Cache und affected-Builds – am Beispiel von Turborepo, mit einem Blick auf Nx.
duration: 25
sources:
  - title: Turborepo Docs – Configuring tasks
    url: https://turborepo.dev/docs/crafting-your-repository/configuring-tasks
  - title: Turborepo Docs – run (Referenz)
    url: https://turborepo.dev/docs/reference/run
  - title: Turborepo Docs – Caching
    url: https://turborepo.dev/docs/crafting-your-repository/caching
  - title: Nx Docs – Introduction
    url: https://nx.dev/docs/getting-started/intro
quiz:
  - type: single
    question: 'Was bedeutet `"dependsOn": ["^build"]` für die Aufgabe build in turbo.json?'
    options:
      - build läuft nur, wenn sich das Lockfile geändert hat.
      - Vor build eines Pakets muss build in allen Paketen laufen, von denen es abhängt.
      - build läuft im selben Paket zweimal.
      - build darf nie gecacht werden.
    answer: 1
    explanation: Das Dach-Zeichen ^ heißt „in den Abhängigkeiten“. Ohne ^ wäre dieselbe Aufgabe im selben Paket gemeint.
  - type: multiple
    question: Was fließt bei Turborepo in den Hash einer Aufgabe ein? (mehrere richtig)
    options:
      - Die Quelldateien des Pakets
      - Die Hashes der Aufgaben, von denen sie abhängt
      - Die aktuelle Uhrzeit
      - Die Konfiguration der Aufgabe in turbo.json
    answers: [0, 1, 3]
    explanation: Gleiche Eingaben ergeben denselben Hash – und damit einen Cache-Treffer. Die Uhrzeit gehört nicht dazu, sonst gäbe es nie Treffer.
  - type: match
    question: Ordne jedem Begriff seine Bedeutung zu.
    pairs:
      - { left: "Cache-Treffer", right: "Ausgaben und Logs werden wiederhergestellt statt neu erzeugt" }
      - { left: "Remote-Cache", right: "Cache, den das ganze Team und die CI gemeinsam nutzen" }
      - { left: "affected", right: "Nur Pakete, die von Änderungen betroffen sind" }
      - { left: "outputs", right: "Dateien, die im Cache gespeichert werden" }
    explanation: Zusammen sorgen diese Bausteine dafür, dass ein großes Monorepo nicht bei jeder Änderung komplett neu gebaut wird.
  - type: cloze
    text: 'Wenn alle Aufgaben aus dem Cache kommen, meldet Turborepo am Ende `>>> FULL ___`. Bei Nx startest du Tests nur für betroffene Projekte mit `nx ___ -t test`.'
    blanks:
      - [TURBO]
      - [affected]
    explanation: FULL TURBO heißt, dass nichts ausgeführt werden musste.
tasks:
  - id: turbo-cache
    type: terminal
    title: Dein erster Cache-Treffer
    description: |
      Im Monorepo `turbo-cache` ist Turborepo schon als devDependency installiert. Drei Pakete haben ein
      `build`-Skript, das einen Ordner `dist/` erzeugt: `packages/preise`, `apps/kasse` und `apps/web`
      (beide Apps hängen von preise ab). Es fehlt nur die Konfiguration.

      1. Lege im Root eine `turbo.json` an. Die Aufgabe `build` soll vorher `build` in allen Abhängigkeiten
         ausführen und den Ordner `dist/**` als Ausgabe cachen.
      2. Starte `bunx turbo run build` – alle Aufgaben laufen (`cache miss`).
      3. Starte denselben Befehl noch einmal – jetzt kommt alles aus dem Cache (`>>> FULL TURBO`).
      4. Lösche `apps/web/dist` und starte erneut. Schau nach: Ist `apps/web/dist` wieder da?

      Klicke zuerst auf **Aufgabe vorbereiten** – die Installation von Turborepo dauert beim ersten Mal etwa 20 Sekunden.
    workdir: turbo-cache
    setup: |
      git init -q -b main
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      mkdir -p packages/preise apps/kasse apps/web
      cat > package.json <<'EOF'
      {
        "name": "kiosk",
        "private": true,
        "packageManager": "bun@1.4.2",
        "workspaces": ["apps/*", "packages/*"],
        "devDependencies": { "turbo": "^2.11.0" }
      }
      EOF
      printf 'node_modules\n.turbo\ndist\n' > .gitignore
      mk() {
        printf '{\n  "name": "@kiosk/%s",\n  "version": "1.0.0",\n  "dependencies": %s,\n  "scripts": { "build": "mkdir -p dist && echo %s > dist/index.js" }\n}\n' "$2" "$3" "$2" > "$1/package.json"
      }
      mk packages/preise preise '{}'
      mk apps/kasse kasse '{ "@kiosk/preise": "workspace:*" }'
      mk apps/web web '{ "@kiosk/preise": "workspace:*" }'
      bun install > /dev/null 2>&1
      git add -A
      git commit -q -m "chore: initial monorepo"
    checks:
      - type: command
        run: jq -r '.tasks.build.dependsOn | index("^build") != null' turbo.json
        stdout_equals: "true"
        message: 'In turbo.json fehlt tasks.build.dependsOn mit "^build".'
      - type: command
        run: jq -r '.tasks.build.outputs | index("dist/**") != null' turbo.json
        stdout_equals: "true"
        message: 'In turbo.json fehlt tasks.build.outputs mit "dist/**" – ohne outputs stellt ein Cache-Treffer keine Dateien wieder her.'
      - type: command
        run: find .turbo/cache -name '*.tar.zst' 2>/dev/null | wc -l
        stdout_matches: "^\\s*[3-9]\\s*$"
        message: Im Cache .turbo/cache liegen noch keine Ergebnisse für alle drei Pakete. Starte `bunx turbo run build`.
      - type: command
        run: bunx turbo run build 2>&1 | grep -c "FULL TURBO"
        stdout_equals: "1"
        message: Ein weiterer Lauf kommt noch nicht vollständig aus dem Cache. Starte `bunx turbo run build` zweimal hintereinander, ohne Dateien zu ändern.
      - type: file_exists
        path: apps/web/dist/index.js
        message: apps/web/dist fehlt. Starte `bunx turbo run build` – Turborepo stellt den Ordner aus dem Cache wieder her.
    hints:
      - 'turbo.json beginnt mit `{ "tasks": { "build": { … } } }`.'
      - 'Die Aufgabe braucht zwei Schlüssel: `"dependsOn": ["^build"]` und `"outputs": ["dist/**"]`.'
      - Nach dem Anlegen von turbo.json zweimal `bunx turbo run build` ausführen und auf `cache hit` achten.
    solution: |
      ```bash
      cd turbo-cache
      cat > turbo.json <<'EOF'
      {
        "$schema": "https://turborepo.dev/schema.json",
        "tasks": {
          "build": {
            "dependsOn": ["^build"],
            "outputs": ["dist/**"]
          }
        }
      }
      EOF
      bunx turbo run build     # cache miss
      bunx turbo run build     # cache hit … >>> FULL TURBO
      rm -rf apps/web/dist
      bunx turbo run build     # stellt apps/web/dist aus dem Cache wieder her
      ls apps/web/dist
      ```
  - id: cache-ablauf
    type: diagram
    title: Was passiert bei turbo run build?
    description: Beschrifte den Ablauf, den Turborepo für jede einzelne Aufgabe durchläuft.
    image: /assets/monorepos-workspaces/task-cache-leer.svg
    slots:
      - { x: 15, y: 50, answer: Hash berechnen }
      - { x: 40, y: 50, answer: Cache prüfen }
      - { x: 72, y: 25, answer: Ausgaben wiederherstellen }
      - { x: 66, y: 77, answer: Task ausführen }
      - { x: 89, y: 77, answer: Im Cache speichern }
    distractors: [Lockfile löschen, Paket veröffentlichen]
    hints:
      - Oben ist der schnelle Weg bei einem Treffer, unten der Weg bei einem Fehlschlag.
---
Dein Monorepo hat zwanzig Pakete. Du änderst eine Zeile in der Web-App – und die CI baut und testet
trotzdem alle zwanzig. Das dauert. Task-Runner wie Turborepo und Nx lösen das mit zwei Ideen: Sie bauen
nur, was nötig ist, und sie merken sich Ergebnisse, die sie schon kennen.

## Was ein Task-Runner im Monorepo leistet

`bun run --filter` startet Skripte in der richtigen Reihenfolge. Ein Monorepo-[[task-runner|Task-Runner]]
geht drei Schritte weiter:

| Baustein | Bedeutung |
|---|---|
| [[task-graph\|Task-Graph]] | Welche Aufgabe muss vor welcher laufen – über alle Pakete hinweg |
| [[build-cache\|Cache]] | Ergebnisse einer Aufgabe werden gespeichert und bei gleichen Eingaben wiederverwendet |
| [[remote-cache\|Remote-Cache]] | Der Cache liegt auf einem Server – Team und CI teilen ihn |
| [[betroffene-pakete\|Affected]] | Nur Pakete, die von einer Änderung betroffen sind, werden überhaupt betrachtet |

Die zwei bekanntesten Werkzeuge sind [[turborepo|Turborepo]] und [[nx|Nx]]. Beide arbeiten auf deinen
vorhandenen Workspaces und package.json-Skripten auf.

> [!MERKSATZ]
> Ein Task-Runner ersetzt nicht den Paketmanager. Bun installiert und verlinkt, der Task-Runner entscheidet,
> **welche Skripte wann** laufen – und welche er sich sparen kann.

## Turborepo: turbo.json

Turborepo liest seine Konfiguration aus einer `turbo.json` im Root. Unter `tasks` stehen die Namen deiner
package.json-Skripte:

```json title="turbo.json"
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "test": { "dependsOn": ["build"] },
    "dev": { "cache": false, "persistent": true }
  }
}
```

| Schlüssel | Bedeutung |
|---|---|
| `"dependsOn": ["^build"]` | erst `build` in allen **Abhängigkeiten** (das `^`) |
| `"dependsOn": ["build"]` | erst `build` im **selben** Paket |
| `outputs` | diese Dateien landen im Cache und werden bei Treffern wiederhergestellt |
| `inputs` | nur diese Dateien zählen für den Hash (Standard: alle Dateien des Pakets) |
| `cache: false` | nie cachen, z. B. für Deployments |
| `persistent: true` | Dauerprozess wie ein Dev-Server |

Gestartet wird mit `bunx turbo run build`. Turborepo erkennt Bun am Feld `packageManager` und an der `bun.lock`.

## Wie der Cache funktioniert

Für jede Aufgabe berechnet Turborepo einen [[hash|Hash]] aus ihren Eingaben: Dateien des Pakets,
Konfiguration, Hashes der vorherigen Aufgaben und ausgewählte Umgebungsvariablen.

![Ablauf einer Aufgabe mit Cache](/assets/monorepos-workspaces/task-cache.svg)

```text title="Erster Lauf"
@kiosk/preise:build: cache miss, executing 24868260a68d0261
@kiosk/web:build: cache miss, executing c91d60aeef2f88e7
Cached:    0 cached, 3 total
```

```text title="Zweiter Lauf ohne Änderungen"
@kiosk/preise:build: cache hit, replaying logs 24868260a68d0261
@kiosk/web:build: cache hit, replaying logs c91d60aeef2f88e7
Cached:    3 cached, 3 total
  Time:    5ms >>> FULL TURBO
```

Bei einem Treffer stellt Turborepo die `outputs` und die Konsolen-Ausgabe wieder her, ohne das Skript
auszuführen. Der lokale Cache liegt in `.turbo/cache` – der Ordner gehört in die `.gitignore`.

> [!FEHLER]
> **`outputs` vergessen.** Ohne `outputs` merkt sich Turborepo nur die Logs. Ein Treffer meldet dann
> Erfolg, aber `dist/` fehlt – und der nächste Schritt schlägt fehl. Turborepo warnt mit
> „no output files found for task“.

## Affected und Remote-Cache

Zwei Funktionen machen den Unterschied in großen Repositorys:

```bash title="Terminal"
bunx turbo run build --filter=@kiosk/web...   # web und seine Abhängigkeiten
bunx turbo run test --affected                # nur, was seit main geändert wurde
bunx turbo run build --dry                    # zeigen statt ausführen
```

`--affected` vergleicht den aktuellen Branch per Git mit `main` und wählt die geänderten Pakete und alle,
die von ihnen abhängen. Ein **Remote-Cache** legt die Ergebnisse zusätzlich auf einen Server: Hat die CI
`preise` schon gebaut, bekommt dein Laptop das Ergebnis heruntergeladen, statt selbst zu bauen.

> [!ACHTUNG]
> Ein Remote-Cache liefert fremde Build-Ergebnisse aus. Nutze nur vertrauenswürdige Server und achte darauf,
> dass Umgebungsvariablen mit Geheimnissen nicht in gecachte Ausgaben gelangen.

## Nx im Überblick

Nx verfolgt dieselben Ideen, bringt aber mehr eigene Werkzeuge mit:

| | Turborepo | Nx |
|---|---|---|
| Konfiguration | `turbo.json` | `nx.json` und optional `project.json` pro Projekt |
| Abhängige Aufgaben | `"dependsOn": ["^build"]` | `targetDefaults` mit `"dependsOn": ["^build"]` |
| Nur Betroffenes | `--affected` | `nx affected -t test` |
| Alles | `turbo run build` | `nx run-many -t build` |
| Graph ansehen | `turbo run build --graph` | `nx graph` |
| Remote-Cache | selbst gehostet oder Anbieter | Nx Cloud oder selbst gehostet |

Zusätzlich bietet Nx Generatoren für neuen Code und Regeln für erlaubte Abhängigkeiten zwischen Projekten.

> [!PRAXIS]
> Für ein Monorepo mit fünf Paketen reicht oft `bun run --filter`. Wenn Builds in der CI länger als ein paar
> Minuten dauern oder viele Teams beteiligt sind, lohnt sich ein Task-Runner. Mehr findest du in den Dokus
> von [Turborepo](https://turborepo.dev/docs) und [Nx](https://nx.dev/docs).

## Zusammenfassung

- Task-Runner wie Turborepo und Nx planen Aufgaben über einen Task-Graph, cachen Ergebnisse und bauen nur Betroffenes.
- In `turbo.json` steht pro Aufgabe `dependsOn` (`^build` = erst die Abhängigkeiten) und `outputs`.
- Gleiche Eingaben ergeben denselben Hash; bei einem Treffer werden Ausgaben und Logs wiederhergestellt (`FULL TURBO`).
- `--affected` wählt nur geänderte Pakete und ihre Nutzer, ein Remote-Cache teilt Ergebnisse mit Team und CI.
- Nx bietet dasselbe mit `nx affected`, `nx run-many`, `nx graph` und zusätzlichen Generatoren.
