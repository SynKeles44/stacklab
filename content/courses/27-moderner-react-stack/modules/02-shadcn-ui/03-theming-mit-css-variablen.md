---
title: Theming mit CSS-Variablen
summary: Wie shadcn/ui Farben über semantische CSS-Variablen in :root und .dark steuert, wie @theme inline daraus Tailwind-Klassen macht und wie du eigene Farben ergänzt.
duration: 20
sources:
  - title: shadcn/ui – Theming
    url: https://ui.shadcn.com/docs/theming
  - title: shadcn/ui – Dark Mode (Vite)
    url: https://ui.shadcn.com/docs/dark-mode/vite
  - title: Tailwind CSS – Theme variables
    url: https://tailwindcss.com/docs/theme
  - title: Tailwind CSS – Dark mode
    url: https://tailwindcss.com/docs/dark-mode
quiz:
  - type: single
    question: Wofür steht die Variable `--primary-foreground`?
    options:
      - Für eine zweite Hintergrundfarbe neben primary
      - Für die Text- und Icon-Farbe auf einer Fläche mit der Farbe primary
      - Für die Farbe des Fokus-Rings
      - Für den Hintergrund der ganzen Seite
    answer: 1
    explanation: >
      shadcn/ui arbeitet mit Paaren: `primary` ist die Fläche, `primary-foreground` die Farbe darauf. So bleibt
      Text lesbar, egal wie du die Fläche einfärbst.
  - type: multiple
    question: Was ist nötig, damit die Klasse `bg-warning` funktioniert und im Dark Mode eine andere Farbe hat?
    options:
      - "`--warning` in `:root` und in `.dark` festlegen"
      - "`--color-warning: var(--warning);` im Block `@theme inline`"
      - Eine neue Variante in jeder Komponente
      - Die Klasse `dark` am `<html>`-Element setzen, um den Dark Mode einzuschalten
    answers: [0, 1, 3]
    explanation: >
      Der Wert kommt aus `:root` bzw. `.dark`, `@theme inline` macht daraus Tailwind-Klassen, und die Klasse `dark`
      am Wurzelelement schaltet um. Komponenten musst du dafür nicht anfassen.
  - type: cloze
    text: "Damit Tailwind-Klassen wie `dark:bg-muted` auf die Klasse `.dark` reagieren statt auf die Systemeinstellung, steht in der CSS-Datei `@___-variant dark (&:is(.dark *));`."
    blanks:
      - [custom]
    explanation: "`@custom-variant` definiert eine eigene Variante. Ohne diese Zeile richtet sich `dark:` nach `prefers-color-scheme` des Betriebssystems."
  - type: match
    question: Ordne jedem Teil der Token-Kette seine Aufgabe zu.
    pairs:
      - { left: ":root { --primary: … }", right: "Wert im hellen Modus" }
      - { left: ".dark { --primary: … }", right: "Wert im dunklen Modus" }
      - { left: "@theme inline { --color-primary: var(--primary) }", right: "macht Tailwind-Klassen daraus" }
      - { left: "bg-primary", right: "benutzt die Farbe im Markup" }
    explanation: Werte und Klassen sind getrennt. Deshalb reicht es, die Werte zu tauschen, um das ganze Design umzufärben.
tasks:
  - id: token-kette
    type: diagram
    title: Die Token-Kette beschriften
    description: Vom Farbwert bis zur Komponente durchläuft eine Farbe vier Stationen. Ziehe die Beschriftungen an die richtige Stelle.
    image: /assets/moderner-react-stack/token-kette-leer.svg
    slots:
      - { x: 13.4, y: 38.5, answer: CSS-Variable }
      - { x: 37.8, y: 38.5, answer: "@theme inline" }
      - { x: 62.1, y: 38.5, answer: Utility-Klasse }
      - { x: 86.5, y: 38.5, answer: Komponente }
    distractors: [tailwind.config.js, components.json]
    hints:
      - Links steht der reine Wert, rechts das, was der Mensch auf dem Bildschirm sieht.
  - id: warn-farbe
    type: terminal
    title: Eine eigene Warnfarbe mit Dark Mode
    description: |
      Im Ordner `theme-farben` liegt ein Projekt mit shadcn-Button und Theme-Variablen in `src/index.css`.
      Ergänze eine Warnfarbe, die sich im Dark Mode ändert.

      1. Lege in `:root` die Variablen `--warning: oklch(0.84 0.16 84);` und
         `--warning-foreground: oklch(0.28 0.07 46);` an.
      2. Lege in `.dark` dieselben Variablen mit `oklch(0.41 0.11 46)` und `oklch(0.99 0.02 95)` an.
      3. Mache sie in `@theme inline` als `--color-warning` und `--color-warning-foreground` verfügbar.
      4. Zeige in `src/App.tsx` einen Hinweis `<p className="bg-warning text-warning-foreground rounded-md p-4">`
         mit einem Text deiner Wahl.
      5. Ergänze in `App.tsx` einen Button, der beim Klick `document.documentElement.classList.toggle('dark')` aufruft.
      6. Baue mit `bun run build`.

      Klicke zuerst auf **Aufgabe vorbereiten** (das dauert einige Sekunden).
    workdir: theme-farben
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
      bun add tailwindcss @tailwindcss/vite >/dev/null 2>&1
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
      cat > tsconfig.json <<'EOF'
      {
        "files": [],
        "references": [
          { "path": "./tsconfig.app.json" },
          { "path": "./tsconfig.node.json" }
        ],
        "compilerOptions": {
          "paths": {
            "@/*": ["./src/*"]
          }
        }
      }
      EOF
      jq '.compilerOptions.paths = {"@/*": ["./src/*"]}' tsconfig.app.json > tsconfig.app.tmp && mv tsconfig.app.tmp tsconfig.app.json
      printf '@import "tailwindcss";\n' > src/index.css
      cat > src/App.tsx <<'EOF'
      export default function App() {
        return <h1 className="p-8 text-3xl font-bold">Hallo Stack</h1>
      }
      EOF
      bun add clsx tailwind-merge class-variance-authority >/dev/null 2>&1
      mkdir -p src/lib src/components/ui
      cat > src/lib/utils.ts <<'EOF'
      import { clsx, type ClassValue } from 'clsx'
      import { twMerge } from 'tailwind-merge'

      export function cn(...inputs: ClassValue[]) {
        return twMerge(clsx(inputs))
      }
      EOF
      cat > components.json <<'EOF'
      {
        "$schema": "https://ui.shadcn.com/schema.json",
        "style": "new-york",
        "rsc": false,
        "tsx": true,
        "tailwind": {
          "config": "",
          "css": "src/index.css",
          "baseColor": "neutral",
          "cssVariables": true,
          "prefix": ""
        },
        "aliases": {
          "components": "@/components",
          "utils": "@/lib/utils",
          "ui": "@/components/ui",
          "lib": "@/lib",
          "hooks": "@/hooks"
        }
      }
      EOF
      cat > src/components/ui/button.tsx <<'EOF'
      import type { ComponentProps } from 'react'
      import { cva, type VariantProps } from 'class-variance-authority'
      import { cn } from '@/lib/utils'

      const buttonVariants = cva(
        'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
        {
          variants: {
            variant: {
              default: 'bg-primary text-primary-foreground hover:bg-primary/90',
              outline: 'border border-border bg-background hover:bg-muted',
              ghost: 'hover:bg-muted',
            },
            size: {
              default: 'h-9 px-4 py-2',
              sm: 'h-8 px-3',
              lg: 'h-10 px-6',
            },
          },
          defaultVariants: {
            variant: 'default',
            size: 'default',
          },
        },
      )

      function Button({
        className,
        variant,
        size,
        ...props
      }: ComponentProps<'button'> & VariantProps<typeof buttonVariants>) {
        return (
          <button
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
          />
        )
      }

      export { Button, buttonVariants }
      EOF
      cat > src/index.css <<'EOF'
      @import "tailwindcss";

      @custom-variant dark (&:is(.dark *));

      :root {
        --radius: 0.625rem;
        --background: oklch(1 0 0);
        --foreground: oklch(0.145 0 0);
        --primary: oklch(0.205 0 0);
        --primary-foreground: oklch(0.985 0 0);
        --muted: oklch(0.97 0 0);
        --muted-foreground: oklch(0.556 0 0);
        --destructive: oklch(0.577 0.245 27.325);
        --border: oklch(0.922 0 0);
      }

      .dark {
        --background: oklch(0.145 0 0);
        --foreground: oklch(0.985 0 0);
        --primary: oklch(0.922 0 0);
        --primary-foreground: oklch(0.205 0 0);
        --muted: oklch(0.269 0 0);
        --muted-foreground: oklch(0.708 0 0);
        --destructive: oklch(0.704 0.191 22.216);
        --border: oklch(1 0 0 / 10%);
      }

      @theme inline {
        --color-background: var(--background);
        --color-foreground: var(--foreground);
        --color-primary: var(--primary);
        --color-primary-foreground: var(--primary-foreground);
        --color-muted: var(--muted);
        --color-muted-foreground: var(--muted-foreground);
        --color-destructive: var(--destructive);
        --color-border: var(--border);
        --radius-md: calc(var(--radius) - 2px);
      }

      body {
        @apply bg-background text-foreground;
      }
      EOF
      cat > src/App.tsx <<'EOF'
      import { Button } from '@/components/ui/button'

      export default function App() {
        return (
          <main className="p-8">
            <Button variant="outline">Hallo Stack</Button>
          </main>
        )
      }
      EOF
    checks:
      - type: file_contains
        path: src/index.css
        pattern: ":root\\s*\\{[^}]*--warning\\s*:[^}]*--warning-foreground\\s*:"
        message: In :root fehlen --warning und --warning-foreground (in dieser Reihenfolge).
      - type: file_contains
        path: src/index.css
        pattern: "\\.dark\\s*\\{[^}]*--warning\\s*:[^}]*--warning-foreground\\s*:"
        message: In .dark fehlen --warning und --warning-foreground – sonst sieht der Hinweis im Dark Mode gleich aus.
      - type: file_contains
        path: src/index.css
        pattern: "@theme\\s+inline\\s*\\{[^}]*--color-warning\\s*:\\s*var\\(--warning\\)"
        message: Im Block @theme inline fehlt --color-warning - var(--warning).
      - type: file_contains
        path: src/index.css
        pattern: "--color-warning-foreground\\s*:\\s*var\\(--warning-foreground\\)"
        message: Im Block @theme inline fehlt --color-warning-foreground - var(--warning-foreground).
      - type: file_contains
        path: src/App.tsx
        pattern: "bg-warning[^\"']*text-warning-foreground|text-warning-foreground[^\"']*bg-warning"
        message: App.tsx soll ein Element mit den Klassen bg-warning und text-warning-foreground zeigen.
      - type: file_contains
        path: src/App.tsx
        pattern: "classList\\.toggle\\(\\s*['\"]dark['\"]"
        message: In App.tsx fehlt ein Button, der document.documentElement.classList.toggle('dark') aufruft.
      - type: command
        run: bun run build >/dev/null 2>&1
        message: bun run build schlägt fehl. Führe ihn aus und lies die Fehlermeldung.
      - type: command
        run: grep -h -o "\.bg-warning{[^}]*}" dist/assets/*.css | head -1
        stdout_matches: "var\\(--warning\\)"
        message: Im gebauten CSS fehlt eine Regel .bg-warning mit var(--warning). Prüfe den Namen im @theme-inline-Block.
    hints:
      - "Jede Farbe braucht drei Stellen: `:root`, `.dark` und `@theme inline`."
      - "`@theme inline` schreibt `var(--warning)` direkt in die Klasse. Ohne `inline` würde Tailwind auf eine Zwischenvariable verweisen."
      - "Toggle-Button: `<Button variant=\"outline\" onClick={() => document.documentElement.classList.toggle('dark')}>Modus wechseln</Button>`"
    solution: |
      ```bash
      cd theme-farben
      sed -i 's#  --border: oklch(0.922 0 0);#  --border: oklch(0.922 0 0);\n  --warning: oklch(0.84 0.16 84);\n  --warning-foreground: oklch(0.28 0.07 46);#' src/index.css
      sed -i 's#  --border: oklch(1 0 0 / 10%);#  --border: oklch(1 0 0 / 10%);\n  --warning: oklch(0.41 0.11 46);\n  --warning-foreground: oklch(0.99 0.02 95);#' src/index.css
      sed -i 's#  --color-border: var(--border);#  --color-border: var(--border);\n  --color-warning: var(--warning);\n  --color-warning-foreground: var(--warning-foreground);#' src/index.css
      cat > src/App.tsx <<'EOF'
      import { Button } from '@/components/ui/button'

      export default function App() {
        return (
          <main className="space-y-4 p-8">
            <p className="bg-warning text-warning-foreground rounded-md p-4">Die Ausleihe läuft morgen ab.</p>
            <Button variant="outline" onClick={() => document.documentElement.classList.toggle('dark')}>
              Modus wechseln
            </Button>
          </main>
        )
      }
      EOF
      bun run build
      ```
---
Dein Team bekommt ein neues Corporate Design: andere Hauptfarbe, rundere Ecken, und bitte endlich einen Dark
Mode. Hätte jede Komponente ihre Farben fest eingebaut, müsstest du hunderte Stellen ändern. Mit shadcn/ui
änderst du ein paar Zeilen CSS – weil alle Komponenten über **CSS-Variablen** gestaltet sind.

## Semantische Farben statt Farbnamen

Ein shadcn-Button benutzt nicht `bg-zinc-900`, sondern `bg-primary`. `primary` ist ein
[[design-token|Design-Token]]: ein Name für eine **Rolle**, nicht für eine Farbe.

| Token | Rolle |
|---|---|
| `background` / `foreground` | Seitenhintergrund / normaler Text |
| `primary` / `primary-foreground` | Hauptaktion / Text darauf |
| `muted` / `muted-foreground` | zurückhaltende Flächen / Nebentext |
| `destructive` | gefährliche Aktionen wie Löschen |
| `border`, `input`, `ring` | Rahmen, Eingabefelder, Fokus-Ring |
| `radius` | Grundwert für abgerundete Ecken |

Die Paare folgen einer festen Regel: Die Fläche heißt einfach `primary`, die Farbe für Text und Icons darauf
`primary-foreground`.

> [!MERKSATZ]
> Komponenten benutzen nur Rollen-Namen. Welche Farbe hinter einer Rolle steckt, entscheidet allein die CSS-Datei.

## Die Token-Kette

![Token-Kette: CSS-Variable, @theme inline, Utility-Klasse, Komponente](/assets/moderner-react-stack/token-kette.svg)

`shadcn init` schreibt diese drei Blöcke in `src/index.css` (gekürzt):

```css title="src/index.css"
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
}
```

1. `:root` und `.dark` enthalten normale [[custom-property|CSS-Variablen]] mit den Werten.
2. [[theme-inline|@theme inline]] verbindet sie mit Tailwind: Aus `--color-primary` entstehen `bg-primary`,
   `text-primary`, `border-primary` …
3. Komponenten benutzen nur diese Klassen.

Das Wort `inline` sorgt dafür, dass Tailwind `var(--primary)` direkt in die erzeugte Klasse schreibt. Nur so
wirkt ein Wechsel von `:root` zu `.dark` sofort auf jede Klasse.

Dasselbe Prinzip gilt für Rundungen: `--radius` ist der Grundwert, und `@theme inline` leitet daraus Stufen wie
`--radius-md: calc(var(--radius) - 2px)` ab. Änderst du nur `--radius`, werden Buttons, Karten und Eingabefelder
gemeinsam runder oder eckiger.

## Dark Mode umschalten

Der [[dark-mode|Dark Mode]] ist hier nichts anderes als eine Klasse am `<html>`-Element: Steht dort `class="dark"`,
gelten die Werte aus `.dark`. Damit auch Tailwinds `dark:`-Variante darauf hört, steht in der CSS-Datei:

```css title="src/index.css"
@custom-variant dark (&:is(.dark *));
```

Umschalten ist dann eine Zeile JavaScript:

```tsx
<Button variant="outline" onClick={() => document.documentElement.classList.toggle('dark')}>
  Modus wechseln
</Button>
```

In echten Apps merkt sich ein kleiner Theme-Provider die Wahl im `localStorage` und beachtet die
Systemeinstellung. Eine fertige Vorlage dafür zeigt die [shadcn-Anleitung zum Dark Mode](https://ui.shadcn.com/docs/dark-mode/vite).

> [!FEHLER]
> **Farbe nur in `:root` anlegen.** Dann hat sie im Dark Mode denselben Wert – heller Text auf heller Fläche ist
> die Folge. Jede neue Variable gehört in **beide** Blöcke.

## Eine eigene Farbe ergänzen

Für eine Warnfarbe brauchst du drei Stellen:

```css title="src/index.css"
:root {
  --warning: oklch(0.84 0.16 84);
  --warning-foreground: oklch(0.28 0.07 46);
}

.dark {
  --warning: oklch(0.41 0.11 46);
  --warning-foreground: oklch(0.99 0.02 95);
}

@theme inline {
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
}
```

Danach funktioniert `<p className="bg-warning text-warning-foreground">` – im hellen wie im dunklen Modus.
Ganze Farbschemata kannst du dir übrigens im [Baukasten von shadcn/ui](https://ui.shadcn.com/create)
zusammenklicken – heraus kommt ein `shadcn init`-Befehl mit einem Preset, der die passenden Variablen schreibt.

> [!PRAXIS]
> Für eine Markenanpassung ändern Teams fast nie Komponenten-Code, sondern nur die Werte in `:root` und `.dark` –
> oft in einem einzigen Pull Request, den Design und Entwicklung gemeinsam prüfen.

## Zusammenfassung

- shadcn/ui benutzt semantische Tokens wie `primary`, `muted` oder `destructive` statt fester Farben.
- Paare aus Fläche und `-foreground` halten Text lesbar.
- Werte stehen in `:root` und `.dark`, `@theme inline` macht daraus Tailwind-Klassen.
- Dark Mode = Klasse `dark` am `<html>`-Element plus `@custom-variant dark`.
- Eine neue Farbe braucht drei Stellen: `:root`, `.dark` und `@theme inline`.
