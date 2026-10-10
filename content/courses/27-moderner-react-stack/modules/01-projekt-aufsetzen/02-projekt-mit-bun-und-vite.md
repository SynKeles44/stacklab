---
title: Ein Projekt mit Bun und Vite anlegen
summary: Mit bun create vite ein React-TypeScript-Projekt erzeugen, seine Dateien verstehen und mit bun install, bun run dev und bun run build arbeiten.
duration: 25
sources:
  - title: Vite – Scaffolding Your First Vite Project
    url: https://vite.dev/guide/#scaffolding-your-first-vite-project
  - title: Bun – bun create
    url: https://bun.com/docs/runtime/templating/create
  - title: Bun – bun install
    url: https://bun.com/docs/pm/cli/install
  - title: Bun – bun run
    url: https://bun.com/docs/runtime
quiz:
  - type: single
    question: Was erzeugt `bun create vite app --template react-ts`?
    options:
      - Einen fertigen Produktions-Build im Ordner dist
      - Einen neuen Ordner app mit einem React-TypeScript-Projekt, aber noch ohne node_modules
      - Eine globale Installation von Vite
      - Nur eine leere package.json
    answer: 1
    explanation: >
      Das Gerüst enthält package.json, index.html, src/, tsconfig-Dateien und vite.config.ts. Die Abhängigkeiten
      installierst du danach mit `bun install`.
  - type: match
    question: Ordne jedem Befehl seine Wirkung zu.
    pairs:
      - { left: "bun install", right: "Installiert alle Abhängigkeiten und schreibt bun.lock" }
      - { left: "bun run dev", right: "Startet den Vite-Dev-Server" }
      - { left: "bun run build", right: "Prüft die Typen und baut dist/" }
      - { left: "bun add zod", right: "Fügt ein Paket hinzu und trägt es in package.json ein" }
      - { left: "bun add -d vitest", right: "Fügt ein Paket als devDependency hinzu" }
    explanation: "`bun run <skript>` führt ein Skript aus der package.json aus. `bun add -d` (oder `--dev`) landet unter devDependencies."
  - type: cloze
    text: Die Datei, in der Bun die exakt installierten Versionen festhält, heißt ___. Der Einstiegspunkt der App, den Vite zuerst ausliefert, ist die Datei ___.
    blanks:
      - [bun.lock]
      - [index.html]
    explanation: bun.lock ist ein Textformat und gehört ins Repository. Vite startet bei index.html, die per `<script type="module">` die Datei src/main.tsx lädt.
  - type: find-bug
    question: Nach `bun run build` fehlt der Ordner dist. Welche Zeile in dieser package.json ist schuld?
    language: json
    code: |
      {
        "name": "app",
        "type": "module",
        "scripts": {
          "dev": "vite",
          "build": "tsc -b && vite",
          "preview": "vite preview"
        }
      }
    bug_line: 6
    explanation: "`vite` ohne Unterbefehl startet den Dev-Server. Für den Produktions-Build braucht es `vite build`, also `tsc -b && vite build`."
tasks:
  - id: ablauf-neues-projekt
    type: order
    title: Vom leeren Ordner zum Build
    description: Bring die Schritte für ein neues Projekt in die richtige Reihenfolge.
    items:
      - "`bun create vite app --template react-ts` erzeugt das Gerüst"
      - "`cd app` wechselt in den neuen Ordner"
      - "`bun install` lädt alle Abhängigkeiten"
      - "`bun run dev` startet den Dev-Server"
      - "`src/App.tsx` ändern und das Ergebnis sofort im Browser sehen"
      - "`bun run build` erzeugt den Ordner dist für die Auslieferung"
    hints:
      - Ohne installierte Pakete kann weder der Dev-Server noch der Build starten.
  - id: vite-start
    type: terminal
    title: Dein erstes Vite-Projekt mit Bun
    description: |
      Lege im Ordner `vite-start` ein neues React-TypeScript-Projekt an und baue es.

      1. Das Übungs-Terminal sperrt aus Sicherheitsgründen das Ausführen von Programmen in `/tmp`. `bun create`
         legt dort aber kurz Dateien ab. Lenke den temporären Ordner deshalb zuerst um:
         `mkdir -p .tmp && export TMPDIR="$PWD/.tmp"` (auf deinem eigenen Rechner brauchst du das nicht).
      2. Erzeuge das Projekt: `bun create vite app --template react-ts --no-interactive`.
      3. Wechsle mit `cd app` hinein und installiere die Abhängigkeiten mit `bun install`.
      4. Ersetze den Inhalt von `src/App.tsx` durch eine Komponente, die eine Überschrift `<h1>Mein erster Stack</h1>` zeigt.
      5. Baue das Projekt mit `bun run build` und schau dir mit `ls dist dist/assets` an, was entstanden ist.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit der leere Ordner angelegt wird.
    workdir: vite-start
    setup: |
      true
    checks:
      - type: file_exists
        path: app/package.json
        message: Es gibt noch kein Projekt im Unterordner app. Führe bun create vite app --template react-ts --no-interactive aus.
      - type: command
        run: jq -r '.devDependencies.vite // empty' app/package.json
        stdout_matches: "\\S"
        message: In app/package.json fehlt Vite unter devDependencies – hast du das Template react-ts gewählt?
      - type: file_exists
        path: app/bun.lock
        message: app/bun.lock fehlt. Führe im Ordner app den Befehl bun install aus.
      - type: dir_exists
        path: app/node_modules/vite
        message: Die Abhängigkeiten sind noch nicht installiert. Führe im Ordner app bun install aus.
      - type: file_contains
        path: app/src/App.tsx
        pattern: "<h1>\\s*Mein erster Stack\\s*</h1>"
        message: src/App.tsx soll die Überschrift <h1>Mein erster Stack</h1> anzeigen.
      - type: file_exists
        path: app/dist/index.html
        message: Der Ordner dist fehlt. Baue das Projekt im Ordner app mit bun run build.
      - type: command
        run: grep -l "Mein erster Stack" app/dist/assets/*.js
        message: Im gebauten JavaScript fehlt deine Überschrift. Baue nach dem Ändern von App.tsx erneut mit bun run build.
    hints:
      - Bricht `bun create` ohne Ausgabe ab, hast du `export TMPDIR="$PWD/.tmp"` vergessen.
      - "`cat > src/App.tsx <<'EOF'` … `EOF` überschreibt die Datei direkt im Terminal – oder du nutzt `nano src/App.tsx`."
      - "Eine minimale App: `export default function App() { return <h1>Mein erster Stack</h1> }`"
    solution: |
      ```bash
      cd vite-start
      mkdir -p .tmp && export TMPDIR="$PWD/.tmp"
      bun create vite app --template react-ts --no-interactive
      cd app
      bun install
      cat > src/App.tsx <<'EOF'
      export default function App() {
        return <h1>Mein erster Stack</h1>
      }
      EOF
      bun run build
      ls dist dist/assets
      ```
---
Ein neues Projekt von Hand einzurichten heißt: package.json schreiben, TypeScript konfigurieren, einen
[[bundler|Bundler]] auswählen, HTML anlegen, React einbinden. Das dauert Stunden und geht leicht schief. Ein
Gerüst-Generator erledigt das in Sekunden – und zwar so, wie die Werkzeug-Autor:innen es empfehlen. Dieses
Vorgehen heißt [[scaffolding|Scaffolding]].

## Das Gerüst erzeugen

Vite bringt einen Generator namens `create-vite` mit. Mit Bun rufst du ihn so auf:

```bash title="Terminal"
bun create vite app --template react-ts --no-interactive
cd app
bun install
bun run dev
```

| Teil | Bedeutung |
|---|---|
| `bun create vite` | Lädt das Paket `create-vite` und führt es aus |
| `app` | Name des neuen Ordners |
| `--template react-ts` | React mit TypeScript (es gibt u. a. auch `vue-ts`, `svelte-ts`) |
| `--no-interactive` | Keine Rückfragen, alles kommt aus den Optionen |

`bun create vite` ist eine Abkürzung für [[bunx|bunx]] `create-vite`: Bun lädt das Paket, ohne es dauerhaft zu
installieren. Mit npm hieße der Befehl `npm create vite@latest`.

> [!MERKSATZ]
> Ein Generator schreibt nur Dateien. Installiert ist danach noch nichts – erst `bun install` füllt `node_modules`.

## Was im Projekt liegt

```text title="Ein frisches Vite-Projekt"
app/
├── index.html          ← Einstieg: lädt /src/main.tsx
├── package.json        ← Abhängigkeiten und Skripte
├── bun.lock            ← exakte Versionen (nach bun install)
├── vite.config.ts      ← Vite-Konfiguration mit React-Plugin
├── tsconfig.json       ← verweist auf die beiden folgenden
├── tsconfig.app.json   ← Regeln für deinen Code in src/
├── tsconfig.node.json  ← Regeln für vite.config.ts
├── public/             ← Dateien, die unverändert ausgeliefert werden
└── src/
    ├── main.tsx        ← rendert <App /> in <div id="root">
    ├── App.tsx
    └── index.css
```

Anders als bei vielen Werkzeugen ist bei Vite die `index.html` der Einstiegspunkt, nicht eine JavaScript-Datei.
Sie enthält `<script type="module" src="/src/main.tsx">`, und von dort folgt Vite allen Importen.

Zwei [[tsconfig|tsconfig]]-Dateien gibt es, weil zwei Welten geprüft werden: dein App-Code läuft im Browser
(mit `DOM`-Typen), `vite.config.ts` läuft in Node.js. Das Template bringt außerdem den [[linter|Linter]] oxlint
mit.

## Bun im Alltag

Bun ersetzt im Projekt den Paketmanager. Die wichtigsten Befehle:

| Befehl | Wirkung |
|---|---|
| `bun install` | alle Abhängigkeiten aus package.json installieren |
| `bun add zod` | Paket hinzufügen (dependencies) |
| `bun add -d @types/node` | Paket als [[devdependency|devDependency]] hinzufügen |
| `bun remove zod` | Paket entfernen |
| `bun run dev` | [[npm-script|Skript]] `dev` aus der package.json starten |
| `bunx --bun shadcn@latest add button` | Paket-Befehl einmalig ausführen |

Die Datei [[bun-lock|bun.lock]] hält die exakten Versionen fest. Sie gehört ins Repository, damit alle im Team
dieselben Pakete bekommen. `node_modules` dagegen steht in der `.gitignore`.

> [!FEHLER]
> **npm und Bun mischen.** Wer abwechselnd `npm install` und `bun install` ausführt, bekommt zwei
> [[lockfile|Lockfiles]] (`package-lock.json` und `bun.lock`), die sich widersprechen. Entscheidet euch im
> Team für einen Paketmanager.

## Entwickeln und bauen

Die Skripte im Template:

```json title="package.json (Ausschnitt)"
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview"
}
```

![Dev-Server mit Hot Module Replacement und Build-Ablauf mit tsc und vite build](/assets/moderner-react-stack/dev-und-build.svg)

- **`bun run dev`** startet den Dev-Server auf `http://localhost:5173`. Speicherst du eine Datei, tauscht
  [[hot-module-replacement|Hot Module Replacement]] nur das geänderte Modul im Browser aus – der State deiner
  Komponenten bleibt erhalten.
- **`bun run build`** prüft zuerst mit `tsc -b` alle Typen. Nur wenn das klappt, bündelt `vite build` alles in
  den Ordner `dist`. Für das Bündeln nutzt Vite 8 den Bundler Rolldown.
- **`bun run preview`** liefert den fertigen `dist`-Ordner lokal aus, damit du den Build testen kannst.

> [!PRAXIS]
> In Teams läuft `bun run build` in der [[ci-pipeline|CI-Pipeline]] bei jedem Pull Request. Ein Typfehler
> bricht den Build ab – und damit kommt fehlerhafter Code gar nicht erst ins Haupt-Repository.

## Zusammenfassung

- `bun create vite app --template react-ts` erzeugt ein komplettes React-TypeScript-Gerüst.
- Erst `bun install` installiert die Pakete und schreibt `bun.lock`.
- Einstiegspunkt ist `index.html`, die `src/main.tsx` lädt.
- `bun run dev` startet den Dev-Server mit Hot Module Replacement.
- `bun run build` = Typprüfung mit `tsc -b`, danach `vite build` nach `dist`.
- Ein Paketmanager pro Projekt – sonst widersprechen sich die Lockfiles.
