---
title: Tailwind CSS 4 und der Pfad-Alias @
summary: Tailwind über das Vite-Plugin einbinden, eigene Theme-Werte mit @theme anlegen und Importe mit dem Alias @ statt langer relativer Pfade schreiben.
duration: 20
sources:
  - title: Tailwind CSS – Installing with Vite
    url: https://tailwindcss.com/docs/installation/using-vite
  - title: Tailwind CSS – Theme variables
    url: https://tailwindcss.com/docs/theme
  - title: Vite – resolve.alias
    url: https://vite.dev/config/shared-options#resolve-alias
  - title: TypeScript – paths
    url: https://www.typescriptlang.org/tsconfig/#paths
  - title: shadcn/ui – Vite installation
    url: https://ui.shadcn.com/docs/installation/vite
quiz:
  - type: single
    question: Wie bindest du Tailwind CSS 4 in ein Vite-Projekt ein?
    options:
      - Mit einer tailwind.config.js und drei @tailwind-Direktiven
      - Mit dem Paket @tailwindcss/vite als Plugin in vite.config.ts und `@import "tailwindcss";` in der CSS-Datei
      - Mit einem `<script>`-Tag von einem CDN in index.html
      - Gar nicht – Vite enthält Tailwind bereits
    answer: 1
    explanation: >
      Das Vite-Plugin erzeugt das CSS direkt im Dev-Server und im Build. In der CSS-Datei reicht eine Zeile
      `@import "tailwindcss";`. Eine tailwind.config.js brauchst du in Version 4 nicht mehr.
  - type: multiple
    question: Du willst `import { Button } from "@/components/ui/button"` schreiben. Was muss dafür eingerichtet sein?
    options:
      - "`resolve.alias` in vite.config.ts, damit Vite den Pfad beim Bündeln findet"
      - "`paths` in der tsconfig, damit TypeScript und dein Editor den Pfad kennen"
      - Ein npm-Paket mit dem Namen @
      - "`@types/node`, damit vite.config.ts das Modul `node:path` kennt"
    answers: [0, 1, 3]
    explanation: >
      Vite und TypeScript lösen Importe unabhängig voneinander auf – beide brauchen den Alias. `@types/node`
      liefert die Typen für `node:path` in der Vite-Konfiguration. Ein Paket namens `@` gibt es nicht.
  - type: cloze
    text: "Eigene Farben legst du in Tailwind 4 im Block `@___ { … }` an. Eine Variable `--color-brand` erzeugt dann Klassen wie `bg-___`."
    blanks:
      - [theme]
      - [brand]
    explanation: Der Namensraum `--color-*` erzeugt Farb-Utilities. Aus `--color-brand` werden `bg-brand`, `text-brand`, `border-brand` und so weiter.
  - type: find-bug
    question: Vite meldet „Failed to resolve import @/lib/utils“. In welcher Zeile steckt der Fehler?
    language: ts
    code: |
      import path from 'node:path'
      import tailwindcss from '@tailwindcss/vite'
      import react from '@vitejs/plugin-react'
      import { defineConfig } from 'vite'

      export default defineConfig({
        plugins: [react(), tailwindcss()],
        resolve: {
          alias: {
            '@': path.resolve(import.meta.dirname, './lib'),
          },
        },
      })
    bug_line: 10
    explanation: Der Alias zeigt auf `./lib` statt auf `./src`. Dann sucht Vite `@/lib/utils` unter `lib/lib/utils`. Richtig ist `path.resolve(import.meta.dirname, './src')`.
tasks:
  - id: tailwind-einbauen
    type: terminal
    title: Tailwind und Alias einrichten
    description: |
      Im Ordner `tailwind-alias` liegt ein frisches Vite-React-Projekt (Abhängigkeiten sind schon installiert).
      Richte Tailwind CSS 4 und den Pfad-Alias `@` ein.

      1. Installiere `tailwindcss` und `@tailwindcss/vite` mit `bun add`.
      2. Ergänze `vite.config.ts`: Plugin `tailwindcss()` und `resolve.alias` mit `'@'` → `path.resolve(import.meta.dirname, './src')`.
      3. Trage in `tsconfig.json` **und** `tsconfig.app.json` unter `compilerOptions` den Eintrag
         `"paths": { "@/*": ["./src/*"] }` ein.
      4. Ersetze `src/index.css` durch `@import "tailwindcss";` und einen `@theme`-Block mit
         `--color-brand: oklch(0.55 0.2 265);`.
      5. Lege `src/components/Greeting.tsx` an, die eine Komponente `Greeting` exportiert. Sie zeigt einen Text mit
         den Klassen `bg-brand text-white p-6 rounded-xl`.
      6. Importiere sie in `src/App.tsx` mit `import { Greeting } from '@/components/Greeting'` und zeige sie an.
      7. Baue mit `bun run build`.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit das Projekt angelegt wird (das dauert einige Sekunden).
    workdir: tailwind-alias
    setup: |
      cat > package.json <<'EOF'
      {
        "name": "app",
        "private": true,
        "version": "0.0.0",
        "type": "module",
        "scripts": {
          "dev": "vite",
          "build": "tsc -b && vite build",
          "preview": "vite preview"
        },
        "dependencies": {
          "react": "^19.2.8",
          "react-dom": "^19.2.8"
        },
        "devDependencies": {
          "@types/node": "^24.13.3",
          "@types/react": "^19.2.18",
          "@types/react-dom": "^19.2.7",
          "@vitejs/plugin-react": "^6.1.1",
          "typescript": "^7.0.2",
          "vite": "^8.3.0"
        }
      }
      EOF
      cat > tsconfig.json <<'EOF'
      {
        "files": [],
        "references": [
          { "path": "./tsconfig.app.json" },
          { "path": "./tsconfig.node.json" }
        ]
      }
      EOF
      cat > tsconfig.app.json <<'EOF'
      {
        "compilerOptions": {
          "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
          "target": "es2023",
          "lib": ["ES2023", "DOM"],
          "module": "esnext",
          "types": ["vite/client"],
          "skipLibCheck": true,
          "moduleResolution": "bundler",
          "allowImportingTsExtensions": true,
          "verbatimModuleSyntax": true,
          "moduleDetection": "force",
          "noEmit": true,
          "jsx": "react-jsx",
          "strict": true,
          "noUnusedLocals": true,
          "noUnusedParameters": true
        },
        "include": ["src"]
      }
      EOF
      cat > tsconfig.node.json <<'EOF'
      {
        "compilerOptions": {
          "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
          "target": "es2023",
          "lib": ["ES2023"],
          "types": ["node"],
          "skipLibCheck": true,
          "module": "nodenext",
          "allowImportingTsExtensions": true,
          "verbatimModuleSyntax": true,
          "moduleDetection": "force",
          "noEmit": true,
          "strict": true
        },
        "include": ["vite.config.ts"]
      }
      EOF
      cat > vite.config.ts <<'EOF'
      import react from '@vitejs/plugin-react'
      import { defineConfig } from 'vite'

      export default defineConfig({
        plugins: [react()],
      })
      EOF
      cat > index.html <<'EOF'
      <!doctype html>
      <html lang="de">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Stacklab App</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" src="/src/main.tsx"></script>
        </body>
      </html>
      EOF
      printf 'node_modules\ndist\n*.local\n' > .gitignore
      mkdir -p src
      cat > src/main.tsx <<'EOF'
      import { StrictMode } from 'react'
      import { createRoot } from 'react-dom/client'
      import './index.css'
      import App from './App.tsx'

      createRoot(document.getElementById('root')!).render(
        <StrictMode>
          <App />
        </StrictMode>,
      )
      EOF
      cat > src/App.tsx <<'EOF'
      export default function App() {
        return <h1>Hallo Stack</h1>
      }
      EOF
      printf 'body {\n  font-family: system-ui, sans-serif;\n}\n' > src/index.css
      bun install >/dev/null 2>&1
    checks:
      - type: command
        run: jq -r '.dependencies + .devDependencies | has("tailwindcss") and has("@tailwindcss/vite")' package.json
        stdout_equals: "true"
        message: In der package.json fehlen tailwindcss und @tailwindcss/vite. Installiere sie mit bun add tailwindcss @tailwindcss/vite.
      - type: file_contains
        path: vite.config.ts
        pattern: "tailwindcss\\(\\)"
        message: In vite.config.ts fehlt das Plugin tailwindcss() in der plugins-Liste.
      - type: file_contains
        path: vite.config.ts
        pattern: "['\"]@['\"]\\s*:\\s*path\\.resolve\\([^)]*['\"]\\./src['\"]\\)"
        message: In vite.config.ts fehlt der Alias '@' → path.resolve(import.meta.dirname, './src').
      - type: command
        run: jq -r '.compilerOptions.paths["@/*"][0]' tsconfig.app.json
        stdout_matches: "^(\\./)?src/\\*$"
        message: In tsconfig.app.json fehlt unter compilerOptions der Eintrag "paths" mit "@/*" → ["./src/*"].
      - type: file_contains
        path: src/index.css
        pattern: "@import\\s+[\"']tailwindcss[\"']"
        message: src/index.css muss Tailwind mit @import "tailwindcss"; laden.
      - type: file_contains
        path: src/index.css
        pattern: "@theme\\s*\\{[^}]*--color-brand\\s*:"
        message: Lege in src/index.css einen @theme-Block mit --color-brand an.
      - type: file_contains
        path: src/App.tsx
        pattern: "from\\s+['\"]@/components/Greeting['\"]"
        message: App.tsx soll Greeting über den Alias importieren – from '@/components/Greeting'.
      - type: command
        run: bun run build >/dev/null 2>&1
        message: bun run build schlägt fehl. Führe den Befehl aus und lies die erste Fehlermeldung.
      - type: command
        run: grep -h -o "\.bg-brand" dist/assets/*.css | head -1
        stdout_equals: ".bg-brand"
        message: Im gebauten CSS fehlt die Klasse bg-brand. Benutze sie in Greeting.tsx und baue neu.
    hints:
      - "Die fertige vite.config.ts importiert `path` aus `node:path`, `tailwindcss` aus `@tailwindcss/vite` und `react` aus `@vitejs/plugin-react`."
      - "tsconfig-Dateien sind JSON: Achte auf Kommas zwischen den Einträgen. `jq . tsconfig.app.json` zeigt dir sofort, ob die Datei gültig ist."
      - "Fehlt `.bg-brand` im CSS, steht die Klasse nicht vollständig ausgeschrieben im Code oder der @theme-Block heißt anders als `--color-brand`."
    solution: |
      ```bash
      cd tailwind-alias
      bun add tailwindcss @tailwindcss/vite
      cat > vite.config.ts <<'EOF'
      import path from 'node:path'
      import tailwindcss from '@tailwindcss/vite'
      import react from '@vitejs/plugin-react'
      import { defineConfig } from 'vite'

      export default defineConfig({
        plugins: [react(), tailwindcss()],
        resolve: {
          alias: {
            '@': path.resolve(import.meta.dirname, './src'),
          },
        },
      })
      EOF
      jq '.compilerOptions.paths = {"@/*": ["./src/*"]}' tsconfig.json > t.json && mv t.json tsconfig.json
      jq '.compilerOptions.paths = {"@/*": ["./src/*"]}' tsconfig.app.json > t.json && mv t.json tsconfig.app.json
      cat > src/index.css <<'EOF'
      @import "tailwindcss";

      @theme {
        --color-brand: oklch(0.55 0.2 265);
      }
      EOF
      mkdir -p src/components
      cat > src/components/Greeting.tsx <<'EOF'
      export function Greeting() {
        return <p className="bg-brand text-white p-6 rounded-xl">Willkommen im Stack!</p>
      }
      EOF
      cat > src/App.tsx <<'EOF'
      import { Greeting } from '@/components/Greeting'

      export default function App() {
        return <Greeting />
      }
      EOF
      bun run build
      ```
  - id: alias-pfade
    type: dragdrop
    title: Welche Datei kümmert sich worum?
    description: Ordne jede Einstellung der Datei zu, in der sie steht.
    targets:
      - { id: vite, label: vite.config.ts }
      - { id: ts, label: tsconfig.json / tsconfig.app.json }
      - { id: css, label: src/index.css }
    items:
      - { label: "plugins: [react(), tailwindcss()]", target: vite }
      - { label: "resolve.alias für @", target: vite }
      - { label: "\"paths\": { \"@/*\": [\"./src/*\"] }", target: ts }
      - { label: "\"strict\": true", target: ts }
      - { label: "@import \"tailwindcss\";", target: css }
      - { label: "@theme { --color-brand: … }", target: css }
    hints:
      - Alles, was Vite beim Bündeln wissen muss, steht in vite.config.ts. Was der Compiler wissen muss, steht in der tsconfig.
---
Tailwind kennst du aus dem HTML-und-CSS-Kurs – dort lief es über das Tailwind-CLI. In einem Vite-Projekt geht es
eleganter: Vite erzeugt das CSS gleich mit. Und weil ein echtes Projekt schnell tief verschachtelte Ordner
bekommt, richtest du gleich noch etwas ein, das dir täglich Tipparbeit spart: den Pfad-Alias `@`.

## Tailwind als Vite-Plugin

Tailwind CSS 4 bringt ein eigenes [[vite-plugin|Vite-Plugin]] mit. Ein Plugin klinkt sich in Vite ein und
verarbeitet Dateien, während Vite sie ausliefert oder baut.

```bash title="Terminal"
bun add tailwindcss @tailwindcss/vite
```

```ts title="vite.config.ts"
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

```css title="src/index.css"
@import "tailwindcss";
```

Mehr braucht es nicht. Das Plugin durchsucht deine Dateien nach Klassennamen und erzeugt nur das CSS, das du
wirklich benutzt – im Dev-Server sofort, im Build als eine kleine CSS-Datei in `dist/assets`.

Welche Dateien es durchsucht, erkennt Tailwind selbst: alles im Projekt außer Ordnern wie `node_modules` und
Dateien, die in der `.gitignore` stehen. Liegen Klassen ausnahmsweise woanders, etwa in einem Paket aus
`node_modules`, meldest du den Ordner mit `@source "../node_modules/paketname";` in der CSS-Datei an.

> [!MERKSATZ]
> In Tailwind 4 wird im CSS konfiguriert, nicht in einer JavaScript-Datei. Eine `tailwind.config.js` brauchst du nicht.

## Eigene Werte mit @theme

Eigene Farben, Schriften oder Abstände legst du als [[theme-variable|Theme-Variablen]] an:

```css title="src/index.css"
@import "tailwindcss";

@theme {
  --color-brand: oklch(0.55 0.2 265);
  --font-display: "Inter", sans-serif;
}
```

| Variable | Erzeugte Klassen |
|---|---|
| `--color-brand` | `bg-brand`, `text-brand`, `border-brand`, `ring-brand` … |
| `--font-display` | `font-display` |

Der Farbwert steht im Format [[oklch|OKLCH]] (Helligkeit, Sättigung, Farbton). Tailwind 4 und shadcn/ui nutzen
es durchgehend, weil gleiche Helligkeitswerte auch für das Auge gleich hell wirken.

> [!FEHLER]
> **Klassen zusammensetzen.** `` `bg-${farbe}` `` findet das Plugin nicht, weil der fertige Name nirgends im Code
> steht. Schreibe Klassen immer komplett aus, z. B. `farbe === 'brand' ? 'bg-brand' : 'bg-white'`.

## Das Problem mit relativen Pfaden

Liegt eine Seite unter `src/routes/admin/users/edit.tsx`, sehen Importe schnell so aus:

```tsx
import { Button } from '../../../components/ui/button'
import { cn } from '../../../lib/utils'
```

Verschiebst du die Datei, stimmen alle Pfade nicht mehr. Ein [[import-alias|Import-Alias]] löst das: `@` steht
immer für den Ordner `src`.

```tsx
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
```

shadcn/ui setzt diesen Alias sogar voraus – seine CLI schreibt alle Importe in dieser Form.

Der Alias ist reine Schreibhilfe: Beim Build ersetzt Vite `@/lib/utils` durch den echten Pfad, im fertigen
JavaScript taucht das `@` nicht mehr auf. Ein Nebeneffekt hilft beim Lesen fremden Codes: Ein Import mit `@/`
kommt immer aus deinem eigenen `src`-Ordner, ein Import ohne Punkt und ohne `@/` immer aus einem Paket.

## Den Alias einrichten – an zwei Stellen

Vite und TypeScript lösen Importe **unabhängig voneinander** auf. Beide müssen den Alias kennen.

```ts title="vite.config.ts"
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
```

```json title="tsconfig.json und tsconfig.app.json (je unter compilerOptions)"
"paths": {
  "@/*": ["./src/*"]
}
```

`path` stammt aus Node.js. Damit TypeScript das Modul kennt, brauchst du `@types/node` (`bun add -d @types/node`,
im Vite-Template schon enthalten). Ältere Anleitungen nutzen `__dirname` und `baseUrl` – Vite 8 empfiehlt
`import.meta.dirname`, und `paths` funktioniert ohne `baseUrl`.

> [!PRAXIS]
> Der Alias steht in `tsconfig.json` **und** `tsconfig.app.json`: Die CLI von shadcn/ui und viele Editoren lesen die
> oberste Datei, der Compiler beim Build die App-Datei. Fehlt er an einer Stelle, klappt mal der Build und mal die
> Autovervollständigung nicht.

## Zusammenfassung

- Tailwind 4 läuft in Vite über das Plugin `@tailwindcss/vite` und eine Zeile `@import "tailwindcss";`.
- Eigene Design-Werte legst du im `@theme`-Block an; der Namensraum bestimmt die erzeugten Klassen.
- Farben stehen im Format OKLCH.
- Der Alias `@` ersetzt lange relative Pfade durch `@/…` ab `src`.
- Vite braucht `resolve.alias`, TypeScript braucht `paths` – sonst funktioniert nur eine Hälfte.
