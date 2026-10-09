---
title: pnpm, Yarn und Deno im Vergleich
summary: Wie pnpm Speicher spart und Phantom-Abhängigkeiten verhindert, was Yarn Classic von Yarn Berry unterscheidet, warum Deno auf Berechtigungen setzt – und wann du was wählst.
duration: 25
sources:
  - title: pnpm – Motivation
    url: https://pnpm.io/motivation
  - title: pnpm – Symlinked node_modules structure
    url: https://pnpm.io/symlinked-node-modules-structure
  - title: Yarn – Plug'n'Play
    url: https://yarnpkg.com/features/pnp
  - title: Deno Docs – Security and permissions
    url: https://docs.deno.com/runtime/fundamentals/security/
  - title: Deno Docs – Node and npm compatibility
    url: https://docs.deno.com/runtime/fundamentals/node/
quiz:
  - type: single
    question: Was ist eine Phantom-Abhängigkeit?
    options:
      - Ein Paket, das in package.json steht, aber nie installiert wurde.
      - Ein Paket, das dein Code importiert, obwohl es nicht in deiner package.json steht – es liegt nur zufällig in node_modules.
      - Ein Paket ohne Lizenz.
      - Ein Paket, das nur in devDependencies steht.
    answer: 1
    explanation: Weil npm transitive Pakete flach nach node_modules legt, funktioniert ein Import auch ohne Eintrag in der package.json – bis das Paket, das es mitgebracht hat, es nicht mehr braucht.
  - type: match
    question: Welches Werkzeug hat welche Besonderheit?
    pairs:
      - { left: "pnpm", right: "Content-Addressable Store mit Symlinks, strikte node_modules" }
      - { left: "Yarn Berry", right: "Plug'n'Play ohne node_modules-Ordner" }
      - { left: "Deno", right: "Kein Datei- oder Netzzugriff ohne ausdrückliche Erlaubnis" }
      - { left: "Bun", right: "Runtime, Paketmanager, Test-Runner und Bundler in einem" }
    explanation: Alle vier lösen bekannte Schwächen von npm und Node.js – jeweils mit einem anderen Schwerpunkt.
  - type: multiple
    question: Welche Aussagen über Deno stimmen?
    options:
      - Deno führt TypeScript direkt aus.
      - Ein Skript darf ohne --allow-read keine Dateien lesen.
      - Deno kann npm-Pakete über den Präfix npm: nutzen.
      - Deno nutzt package-lock.json als einziges Lockfile.
    answers: [0, 1, 2]
    explanation: Deno hat ein eigenes Lockfile (deno.lock) und versteht inzwischen auch package.json – ein package-lock.json braucht es nicht.
tasks:
  - id: phantom-abhaengigkeit
    type: terminal
    title: Eine Phantom-Abhängigkeit aufspüren
    description: |
      Im Ordner `phantom` liegt ein Projekt, das nur `debug` als Abhängigkeit installiert hat. Die
      Datei `app.js` importiert aber auch `ms`. Klicke zuerst auf **Aufgabe vorbereiten**.

      1. Starte `node app.js` – es funktioniert. Warum eigentlich?
      2. Sieh dir mit `jq .dependencies package.json` die eingetragenen Abhängigkeiten an.
      3. Finde mit `npm ls ms` heraus, wer `ms` mitgebracht hat.
      4. Behebe das Problem richtig: Trage `ms` als **eigene** Abhängigkeit ein.
      5. Schreibe in `antwort.txt` den Namen des Pakets, das `ms` ursprünglich mitgebracht hat.
    workdir: phantom
    setup: |
      npm init -y >/dev/null
      npm pkg set type=module
      npm install debug --no-audit --no-fund >/dev/null 2>&1
      cat > app.js <<'EOF'
      import ms from "ms";
      console.log(`Eine Stunde hat ${ms("1h")} Millisekunden.`);
      EOF
    checks:
      - type: command
        run: jq -r '.dependencies.ms // "fehlt"' package.json
        stdout_matches: "^\\^?\\d"
        message: ms steht noch nicht in deinen dependencies – es ist noch eine Phantom-Abhängigkeit.
      - type: command
        run: jq -r '.dependencies.debug // "fehlt"' package.json
        stdout_matches: "^\\^?\\d"
        message: debug soll weiterhin in den dependencies stehen.
      - type: command
        run: node app.js
        stdout_matches: "3600000"
        message: node app.js soll weiterhin funktionieren.
      - type: file_contains
        path: antwort.txt
        pattern: "^\\s*[Dd]ebug\\s*$"
        message: In antwort.txt soll der Name des Pakets stehen, das ms mitgebracht hat.
    hints:
      - "`npm ls ms` zeigt den Baum: Unter welchem Paket hängt ms?"
      - "`npm install ms` trägt ms als eigene Abhängigkeit ein – npm nutzt dieselbe Version weiter."
    solution: |
      ```bash
      cd phantom
      node app.js
      jq .dependencies package.json   # nur debug
      npm ls ms                       # phantom@1.0.0 └─┬ debug@4.x └── ms@2.1.3
      npm install ms
      echo debug > antwort.txt
      ```
  - id: deno-berechtigungen
    type: simulated
    title: Deno und seine Berechtigungen
    description: |
      Ein Skript `zaehle.ts` liest die Datei `daten.txt` und zählt die Zeilen. Du führst es mit Deno aus.

      1. Starte es ohne Berechtigungen: `deno run zaehle.ts` – und lehne die Rückfrage ab, indem
         du `n` tippst.
      2. Starte es erneut und erlaube nur das Lesen genau dieser Datei:
         `deno run --allow-read=daten.txt zaehle.ts`.
    prompt: "du@laptop:~/deno-test$"
    steps:
      - expect: "^deno\\s+run\\s+zaehle\\.ts$"
        output: |
          ┏ ⚠️  Deno requests read access to "daten.txt".
          ┠─ Requested by `Deno.readTextFile()` API.
          ┠─ To see a stack trace for this prompt, set the DENO_TRACE_PERMISSIONS environmental variable.
          ┠─ Learn more at: https://docs.deno.com/go/--allow-read
          ┠─ Run again with --allow-read to bypass this prompt.
          ┗ Allow? [y/n/A] (y = yes, allow; n = no, deny; A = allow all read permissions)
        prompt: ">"
        hint: Tippe deno run zaehle.ts
      - expect: "^n$"
        output: |
          ❌ Denied read access to "daten.txt".
          error: Uncaught (in promise) NotCapable: Requires read access to "daten.txt", run again with the --allow-read flag
        prompt: "du@laptop:~/deno-test$"
        hint: Tippe n, um den Zugriff abzulehnen.
      - expect: "^deno\\s+run\\s+--allow-read=daten\\.txt\\s+zaehle\\.ts$"
        output: |
          daten.txt hat 42 Zeilen.
        hint: "Erlaube nur das Lesen dieser Datei: deno run --allow-read=daten.txt zaehle.ts"
    responses:
      - match: "--allow-all|-A\\b"
        output: "Das würde funktionieren, erlaubt aber alles – auch Netzwerk und Schreiben. Erlaube nur, was das Skript braucht."
      - match: "^node\\s"
        output: "Node.js würde die Datei ohne Rückfrage lesen. Hier geht es um Deno."
---

npm und Node.js sind der Standard – aber nicht die einzige Wahl. Neben Bun begegnen dir drei
weitere Namen in Projekten: **pnpm**, **Yarn** und **Deno**. Jedes Werkzeug löst eine Schwäche
des Standards auf seine eigene Art.

## pnpm: ein Store für alle Projekte

npm legt Pakete **flach** nach `node_modules`: Auch transitive Pakete landen ganz oben. Daraus
entstehen zwei Probleme:

- **Speicher:** Zehn Projekte mit React haben zehn Kopien von React auf der Festplatte.
- **[[phantom-abhaengigkeit|Phantom-Abhängigkeiten]]:** Dein Code kann `ms` importieren, obwohl nur
  `debug` in der package.json steht. Entfernt `debug` es irgendwann, bricht dein Code.

![npm legt Pakete flach ab, pnpm nutzt einen Store und Symlinks](/assets/node-runtimes-paketmanager/node-modules-layouts.svg)

[[pnpm|pnpm]] speichert jede Paketversion genau **einmal** in einem
[[content-addressable-store|Content-Addressable Store]] auf deinem Rechner. In `node_modules`
legt es nur [[symlink|Symlinks]] auf die **direkten** Abhängigkeiten an. Eine Phantom-Abhängigkeit
führt daher sofort zu einem Fehler – du merkst das Problem, bevor es in Produktion auffällt.

```bash title="Terminal"
pnpm install         # liest package.json, schreibt pnpm-lock.yaml
pnpm add zod         # Paket hinzufügen
pnpm add -D vitest   # devDependency
pnpm dlx create-vite # wie npx
```

## Yarn: Classic und Berry

[[yarn|Yarn]] entstand 2016, als npm langsam war und kein Lockfile hatte. Heute gibt es zwei
sehr unterschiedliche Generationen:

| | Yarn Classic (1.x) | Yarn Berry (ab 2.x) |
|---|---|---|
| Status | nur noch Wartung | aktiv entwickelt |
| node_modules | flach wie npm | optional – Standard ist Plug'n'Play |
| Lockfile | `yarn.lock` | `yarn.lock` (anderes Format) |

Yarn Berry kann mit [[plug-n-play|Plug'n'Play]] ganz ohne `node_modules` arbeiten: Eine Datei `.pnp.cjs` sagt
Node.js, wo jedes Paket liegt. Das ist schnell und streng, braucht aber Werkzeuge, die damit
umgehen können. Die passende Yarn-Version legt ein Projekt im Feld `packageManager` der
package.json fest.

## Deno: sicher von Anfang an

[[deno|Deno]] stammt vom ursprünglichen Node.js-Erfinder. Es nutzt V8, ist in Rust geschrieben
und führt TypeScript direkt aus. Die große Besonderheit sind **Berechtigungen**: Ein Skript darf
ohne ausdrückliche Erlaubnis weder Dateien lesen noch ins Netz.

```bash title="Terminal"
deno run zaehle.ts                          # fragt bei jedem Zugriff nach
deno run --allow-read=daten.txt zaehle.ts   # nur diese Datei lesen
deno run --allow-net=api.example.com app.ts # nur diesen Server erreichen
```

npm-Pakete nutzt Deno über den Präfix `npm:` (`import ms from "npm:ms"`), Deno-eigene Pakete
kommen aus der Registry JSR (`jsr:`). Auch eine vorhandene package.json versteht Deno.

> [!FEHLER]
> **`--allow-all` aus Bequemlichkeit.** Wer jedes Skript mit `-A` startet, verschenkt den
> größten Vorteil von Deno. Erlaube nur, was das Skript wirklich braucht – so kann ein
> manipuliertes Paket keine Daten nach außen schicken.

## Was wann wählen?

| Situation | Gute Wahl |
|---|---|
| Bestehendes Projekt mit `package-lock.json` | npm beibehalten |
| Viele Projekte, Monorepo, strenge Abhängigkeiten | pnpm |
| Projekt nutzt bereits Yarn (`yarn.lock`, `packageManager`) | Yarn in der festgelegten Version |
| Neues Projekt, Geschwindigkeit, All-in-one | Bun |
| Skripte und Server mit Fokus auf Sicherheit | Deno |

> [!MERKSATZ]
> Das wichtigste Kriterium ist das **Lockfile im Repository**. Es verrät, welcher Paketmanager
> genutzt wird – und genau den nimmst du. Mische nie zwei in einem Projekt.

> [!PRAXIS]
> Mit *Corepack* (bei Node.js lange mitgeliefert, heute separat installierbar) halten Teams die
> Version von pnpm oder Yarn über das Feld `packageManager` einheitlich – ähnlich wie `.nvmrc`
> für Node.js selbst.

## Zusammenfassung

- **pnpm** speichert Pakete einmal im Store, verlinkt sie per Symlink und verhindert **Phantom-Abhängigkeiten**.
- **Yarn Classic** ist in Wartung; **Yarn Berry** bietet Plug'n'Play ohne `node_modules`.
- **Deno** setzt auf Berechtigungen (`--allow-read`, `--allow-net`), TypeScript und `npm:`/`jsr:`-Importe.
- **Bun** ist die All-in-one-Variante mit Fokus auf Geschwindigkeit.
- Das Lockfile im Repository bestimmt den Paketmanager – nie zwei mischen.
