---
title: Skripte über mehrere Pakete mit --filter
summary: Wie du mit bun run --filter und --workspaces Skripte in vielen Paketen gleichzeitig startest – in der richtigen Reihenfolge und nur dort, wo es nötig ist.
duration: 20
sources:
  - title: Bun Docs – Filter
    url: https://bun.com/docs/pm/filter
  - title: Bun Docs – bun run
    url: https://bun.com/docs/runtime/run
  - title: Bun Docs – Workspaces
    url: https://bun.com/docs/pm/workspaces
quiz:
  - type: match
    question: Welche Pakete wählt welcher Filter aus?
    pairs:
      - { left: "--filter '*'", right: "Alle Workspace-Pakete" }
      - { left: "--filter '@kiosk/*'", right: "Alle Pakete, deren Name mit @kiosk/ beginnt" }
      - { left: "--filter './apps/*'", right: "Alle Pakete direkt im Ordner apps" }
      - { left: "--filter '!@kiosk/docs'", right: "Schließt @kiosk/docs aus" }
    explanation: Namensmuster vergleichen das Feld name, Pfadmuster beginnen mit ./ und vergleichen Ordner.
  - type: single
    question: '@kiosk/kasse hängt von @kiosk/preise ab. Was macht `bun run --filter "*" build`?'
    options:
      - Es startet beide build-Skripte gleichzeitig in zufälliger Reihenfolge.
      - Es startet build in @kiosk/preise und erst danach in @kiosk/kasse.
      - Es startet nur das build-Skript im Root.
      - Es bricht ab, weil zwei Pakete gefunden wurden.
    answer: 1
    explanation: Bun beachtet die Abhängigkeiten zwischen Workspace-Paketen. Ein Paket startet erst, wenn seine Abhängigkeiten fertig sind.
  - type: cloze
    text: 'Der Filter `"@kiosk/kasse___"` wählt die Kasse **und** alle Pakete, von denen sie abhängt. Mit `bun run --workspaces --___ test` werden Pakete ohne test-Skript übersprungen.'
    blanks:
      - ["..."]
      - [if-present]
    explanation: Drei Punkte hinter dem Namen nehmen die Abhängigkeiten mit, davor die abhängigen Pakete.
  - type: find-bug
    question: Das Root-Skript soll build nur in den Apps starten, findet aber kein einziges Paket. In welcher Zeile liegt der Fehler?
    language: json
    code: |
      {
        "name": "kiosk",
        "private": true,
        "scripts": {
          "build:apps": "bun run --filter 'apps/*' build"
        }
      }
    bug_line: 5
    explanation: Ohne führendes ./ wird apps/* als Paketname gelesen – und so heißt kein Paket. Pfadmuster beginnen mit ./, also './apps/*'.
tasks:
  - id: filter-skripte
    type: terminal
    title: Root-Skripte mit --filter
    description: |
      Im Monorepo `filter-skripte` haben vier Pakete ein `build`-Skript: `packages/preise`, `apps/kasse`
      (hängt von preise ab), `apps/web` (hängt ebenfalls von preise ab) und `apps/docs`. Jedes Skript schreibt
      seinen Namen in die Datei `build.log` im Root – so siehst du die Reihenfolge.

      1. Lege in der Root-`package.json` das Skript `build` an: Es soll `build` in **allen** Paketen außer
         `@kiosk/docs` starten.
      2. Lege das Skript `build:kasse` an: Es soll `build` nur in `@kiosk/kasse` **und allem, wovon die Kasse
         abhängt**, starten.
      3. Probiere beide aus: `rm -f build.log; bun run build:kasse; cat build.log`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: filter-skripte
    setup: |
      mkdir -p packages/preise apps/kasse apps/web apps/docs
      cat > package.json <<'EOF'
      {
        "name": "kiosk",
        "private": true,
        "workspaces": ["apps/*", "packages/*"]
      }
      EOF
      mk() {
        printf '{\n  "name": "@kiosk/%s",\n  "version": "1.0.0",\n  "dependencies": %s,\n  "scripts": { "build": "echo %s >> ../../build.log" }\n}\n' "$2" "$3" "$2" > "$1/package.json"
      }
      mk packages/preise preise '{}'
      mk apps/kasse kasse '{ "@kiosk/preise": "workspace:*" }'
      mk apps/web web '{ "@kiosk/preise": "workspace:*" }'
      mk apps/docs docs '{}'
      bun install > /dev/null 2>&1
    checks:
      - type: command
        run: jq -r '.scripts.build // ""' package.json
        stdout_matches: "--filter"
        message: Lege in der Root-package.json ein Skript "build" an, das `bun run --filter …` nutzt.
      - type: command
        run: rm -f build.log; bun run build > /dev/null 2>&1; sort build.log | paste -sd ',' -
        stdout_equals: "kasse,preise,web"
        message: '`bun run build` soll genau preise, kasse und web bauen – nicht docs. Tipp: zwei Filter, einer davon mit !.'
      - type: command
        run: rm -f build.log; bun run build > /dev/null 2>&1; head -n 1 build.log
        stdout_equals: preise
        message: preise muss zuerst gebaut werden. Nutze bun run --filter ohne --parallel, dann beachtet Bun die Abhängigkeiten.
      - type: command
        run: rm -f build.log; bun run build:kasse > /dev/null 2>&1; paste -sd ',' build.log
        stdout_equals: "preise,kasse"
        message: '`bun run build:kasse` soll erst preise und dann kasse bauen – sonst nichts. Tipp: der Filter "@kiosk/kasse...".'
    hints:
      - Mehrere `--filter`-Angaben lassen sich kombinieren; ein `!` vorne schließt aus.
      - '"build": "bun run --filter ''*'' --filter ''!@kiosk/docs'' build"'
      - '"build:kasse": "bun run --filter ''@kiosk/kasse...'' build" – die drei Punkte nehmen die Abhängigkeiten mit.'
    solution: |
      ```bash
      cd filter-skripte
      jq '.scripts = {
        "build": "bun run --filter '"'"'*'"'"' --filter '"'"'!@kiosk/docs'"'"' build",
        "build:kasse": "bun run --filter '"'"'@kiosk/kasse...'"'"' build"
      }' package.json > tmp.json && mv tmp.json package.json
      rm -f build.log; bun run build; cat build.log
      rm -f build.log; bun run build:kasse; cat build.log
      ```

      Die Root-package.json enthält danach:

      ```json
      "scripts": {
        "build": "bun run --filter '*' --filter '!@kiosk/docs' build",
        "build:kasse": "bun run --filter '@kiosk/kasse...' build"
      }
      ```
  - id: filter-zuordnen
    type: dragdrop
    title: Welcher Filter passt?
    description: |
      Das Monorepo enthält `@kiosk/web` und `@kiosk/api` in `apps/` sowie `@kiosk/preise` und `@kiosk/ui` in
      `packages/`. `@kiosk/web` hängt von `@kiosk/ui` ab, `@kiosk/ui` von `@kiosk/preise`. Ordne jede Aufgabe dem
      passenden Filter zu.
    targets:
      - { id: pfad, label: "--filter './packages/*'" }
      - { id: abh, label: "--filter '@kiosk/web...'" }
      - { id: abhaengige, label: "--filter '...@kiosk/preise'" }
      - { id: name, label: "--filter '@kiosk/api'" }
    items:
      - { label: Nur die Bibliotheken testen, target: pfad }
      - { label: "Die Web-App samt allem bauen, was sie braucht", target: abh }
      - { label: "Nach einer Änderung an preise alles testen, was preise nutzt", target: abhaengige }
      - { label: Nur den API-Server starten, target: name }
    hints:
      - Punkte hinter dem Namen = Abhängigkeiten, Punkte davor = abhängige Pakete.
---
Dein Monorepo hat zehn Pakete, und jedes hat ein `build`- und ein `test`-Skript. Du willst nicht zehnmal
`cd` tippen – und auch nicht jedes Mal alles bauen, wenn du nur an der Kasse arbeitest. Dafür gibt es
`--filter`.

## Ein Skript in vielen Paketen

Ein [[npm-script|Skript]] steht wie gewohnt in der package.json des Pakets. Mit einem
[[workspace-filter|Workspace-Filter]] startest du es vom Root aus in mehreren Paketen:

```bash title="Terminal"
bun run --filter '*' build              # build in allen Paketen
bun run --filter '@kiosk/kasse' dev     # nur in einem Paket
bun run --workspaces --if-present test  # test überall, wo es existiert
```

```text title="Ausgabe – jede Zeile trägt den Paketnamen"
@kiosk/preise build: Building…
@kiosk/preise build: Exited with code 0
@kiosk/kasse build: Building…
@kiosk/kasse build: Exited with code 0
```

`-F` ist die Kurzform von `--filter`. Bei sehr gesprächigen Skripten kürzt `--elide-lines=<n>` die
Ausgabe pro Paket.

> [!MERKSATZ]
> `--filter` wählt **Pakete** aus, das Wort danach ist das **Skript**. Bun startet das Skript in jedem
> ausgewählten Paket, das es besitzt.

## Filter-Muster

| Muster | Wählt aus |
|---|---|
| `'*'` | alle Workspace-Pakete |
| `'@kiosk/*'` | Pakete, deren **Name** passt |
| `'./apps/*'` | Pakete in diesem **Ordner** (Pfadmuster beginnen mit `./`) |
| `'!@kiosk/docs'` | schließt ein Paket aus |
| `'@kiosk/kasse...'` | die Kasse **und ihre Abhängigkeiten** |
| `'...@kiosk/preise'` | preise **und alle Pakete, die es nutzen** |
| `'@kiosk/kasse^...'` | nur die Abhängigkeiten, ohne die Kasse selbst |

Mehrere Filter lassen sich kombinieren: Positive Treffer kommen dazu, `!`-Treffer fallen wieder raus.

> [!FEHLER]
> **Pfad ohne `./`.** `--filter 'apps/*'` sucht nach Paketen mit dem **Namen** `apps/…` und findet nichts.
> Für Ordner schreibst du `--filter './apps/*'`. Setze Muster außerdem immer in Anführungszeichen, sonst
> ersetzt die Shell `*` durch Dateinamen.

## Die richtige Reihenfolge

Bun kennt die Abhängigkeiten zwischen den Workspace-Paketen. Ein Skript startet in einem Paket erst, wenn
es in allen Paketen fertig ist, von denen dieses abhängt. Das ist eine
[[topologische-reihenfolge|topologische Reihenfolge]]:

![Abhängigkeitsgraph eines Monorepos mit Build-Reihenfolge](/assets/monorepos-workspaces/abhaengigkeitsgraph.svg)

Für `build` ist das entscheidend: Die Kasse kann erst gebaut werden, wenn `preise/dist` existiert.
Unabhängige Pakete wie `web` und `kasse` laufen dabei gleichzeitig.

| Schalter | Wirkung |
|---|---|
| (keiner) | Abhängigkeitsreihenfolge, Unabhängiges parallel |
| `--parallel` | alles sofort gleichzeitig – ohne Rücksicht auf Abhängigkeiten |
| `--sequential` | eines nach dem anderen |
| `--no-exit-on-error` | mit `--parallel` oder `--sequential`: bei einem Fehler die übrigen weiterlaufen lassen |

> [!ACHTUNG]
> `--parallel` ist ideal für Dauerprozesse wie mehrere `dev`-Server. Für `build` ist es gefährlich, weil
> eine App starten kann, bevor ihre Bibliothek gebaut ist.

## Root-Skripte als Einstiegspunkt

Damit niemand die Filter auswendig kennen muss, legst du sie als Skripte in die Root-package.json:

```json title="package.json (Root)"
{
  "scripts": {
    "build": "bun run --filter '*' --filter '!@kiosk/docs' build",
    "build:kasse": "bun run --filter '@kiosk/kasse...' build",
    "test": "bun run --workspaces --if-present test",
    "dev": "bun run --filter './apps/*' --parallel dev",
    "typecheck": "tsc -b"
  }
}
```

So startet jede:r im Team mit `bun run build` oder `bun run dev` – egal, wie viele Pakete es gibt.

> [!PRAXIS]
> Auch Paketmanager-Befehle kennen `--filter`: `bun add zod --filter @kiosk/api`, `bun outdated --filter
> './apps/*'` oder `bun install --filter @kiosk/api` für ein schlankes Docker-Image der API.

## Wenn ein Skript fehlschlägt

Bei vielen Paketen schlägt früher oder später ein Skript fehl. Bun meldet das mit dem Exit-Code des
Pakets, und der gesamte Lauf endet mit einem Exit-Code ungleich 0 – genau richtig für die CI, denn ein roter
Build soll auffallen.

Die Ausgabe hilft bei der Suche: Jede Zeile trägt den Paketnamen, und am Ende meldet jedes Paket seinen
Exit-Code. So siehst du sofort, **welches** Paket gescheitert ist, und kannst es gezielt erneut starten:

```bash title="Terminal"
bun run --filter '@kiosk/kasse' build   # nur das fehlerhafte Paket wiederholen
```

Fehlt einem ausgewählten Paket das Skript, überspringt Bun es einfach. Nur wenn **kein einziges**
ausgewähltes Paket das Skript hat, meldet `bun run` einen Fehler – außer du setzt `--if-present`.

> [!TIPP]
> Arbeitest du länger nur an einem Paket, wechsle mit `cd apps/kasse` hinein. Dort startet `bun run build`
> nur das Skript dieses Pakets – ganz ohne Filter.

## Zusammenfassung

- `bun run --filter <muster> <skript>` startet ein Skript in allen passenden Paketen, `--workspaces` in allen.
- Namensmuster vergleichen `name`, Pfadmuster beginnen mit `./`, `!` schließt aus.
- `paket...` nimmt Abhängigkeiten mit, `...paket` die abhängigen Pakete.
- Ohne `--parallel` beachtet Bun die Abhängigkeitsreihenfolge – wichtig für `build`.
- Root-Skripte wie `build`, `test` und `dev` sind der bequeme Einstieg für das ganze Team.
