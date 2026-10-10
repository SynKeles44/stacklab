---
title: Komponenten lesen und anpassen
summary: Wie eine shadcn-Komponente aufgebaut ist, wie du Varianten ergänzt und wann du stattdessen eine eigene Komponente darauf aufbaust.
duration: 20
sources:
  - title: shadcn/ui – Button
    url: https://ui.shadcn.com/docs/components/button
  - title: cva – Variants
    url: https://cva.style/docs/getting-started/variants
  - title: tailwind-merge
    url: https://github.com/dcastil/tailwind-merge
  - title: shadcn/ui – Introduction (Open Code)
    url: https://ui.shadcn.com/docs
quiz:
  - type: single
    question: Was liefert `cn('px-4 py-2', 'px-8')`?
    options:
      - "`px-4 py-2 px-8` – beide Klassen bleiben, der Browser entscheidet"
      - "`py-2 px-8` – tailwind-merge entfernt die widersprüchliche px-4"
      - "`px-4 py-2` – die erste Klasse gewinnt"
      - Einen Fehler, weil px doppelt vorkommt
    answer: 1
    explanation: >
      `cn()` verbindet Klassen mit clsx und lässt danach tailwind-merge Konflikte auflösen: Von zwei
      Tailwind-Klassen für dieselbe Eigenschaft bleibt die spätere stehen. So kann ein `className` von außen die
      Standardklassen der Komponente gezielt überschreiben.
  - type: multiple
    question: Welche Änderungen gehören direkt in `src/components/ui/button.tsx`?
    options:
      - Eine neue Variante `destructive`, die überall im Projekt gebraucht wird
      - Ein API-Aufruf, der beim Klick einen Datensatz löscht
      - Eine zusätzliche Größe `icon` für quadratische Icon-Buttons
      - Ein fester Text „Buch löschen“
    answers: [0, 2]
    explanation: >
      `ui`-Komponenten bleiben allgemein: Varianten und Größen gehören hinein. Fachlogik und feste Texte gehören in
      eine eigene Komponente, die den Button benutzt – zum Beispiel `DeleteBookButton`.
  - type: cloze
    text: Die Varianten einer shadcn-Komponente definiert die Funktion ___. Den passenden Props-Typ dazu liefert der Hilfstyp ___<typeof buttonVariants>.
    blanks:
      - [cva]
      - [VariantProps]
    explanation: "`cva()` beschreibt Basis-Klassen, Varianten und Standardwerte. `VariantProps` leitet daraus den Typ `{ variant?: …; size?: … }` ab."
  - type: find-bug
    question: TypeScript meldet beim Build einen Fehler. In welcher Zeile?
    language: tsx
    code: |
      const buttonVariants = cva('inline-flex rounded-md', {
        variants: {
          variant: {
            default: 'bg-primary text-primary-foreground',
            outline: 'border border-border',
          },
        },
        defaultVariants: { variant: 'default' },
      })

      export function SaveButton() {
        return <Button variant="success">Speichern</Button>
      }
    bug_line: 12
    explanation: Die Variante `success` gibt es in `buttonVariants` nicht. Weil die Props per `VariantProps` aus cva abgeleitet sind, erkennt TypeScript den Tippfehler oder die fehlende Variante schon beim Build.
tasks:
  - id: button-variante
    type: terminal
    title: Eine Variante ergänzen und darauf aufbauen
    description: |
      Im Ordner `button-variante` liegt ein Vite-Projekt mit Tailwind, Alias `@`, `src/lib/utils.ts` und einem
      shadcn-Button in `src/components/ui/button.tsx` (Varianten `default`, `outline`, `ghost`).

      1. Ergänze in `buttonVariants` die Variante `destructive` mit den Klassen
         `bg-destructive text-white hover:bg-destructive/90`.
      2. Ergänze die Größe `icon` mit der Klasse `size-9`.
      3. Lege `src/components/DeleteButton.tsx` an: Die Komponente `DeleteButton` nimmt eine Prop `label: string`
         und rendert `<Button variant="destructive" size="sm">` mit diesem Text.
      4. Zeige in `src/App.tsx` einen `DeleteButton` mit dem Label „Buch löschen“ an (Import über `@/components/DeleteButton`).
      5. Baue mit `bun run build`. Läuft der Build durch, hat TypeScript deine neue Variante akzeptiert.

      Klicke zuerst auf **Aufgabe vorbereiten** (das dauert einige Sekunden).
    workdir: button-variante
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
        path: src/components/ui/button.tsx
        pattern: "destructive\\s*:\\s*['\"][^'\"]*bg-destructive"
        message: In buttonVariants fehlt die Variante destructive mit der Klasse bg-destructive.
      - type: file_contains
        path: src/components/ui/button.tsx
        pattern: "icon\\s*:\\s*['\"][^'\"]*size-9"
        message: Unter size fehlt die Größe icon mit der Klasse size-9.
      - type: file_contains
        path: src/components/DeleteButton.tsx
        pattern: "variant=[\"'{]+destructive"
        message: DeleteButton soll den Button mit variant="destructive" rendern.
      - type: file_contains
        path: src/components/DeleteButton.tsx
        pattern: "from\\s+['\"]@/components/ui/button['\"]"
        message: DeleteButton soll Button aus '@/components/ui/button' importieren.
      - type: file_contains
        path: src/App.tsx
        pattern: "<DeleteButton[^>]*label=[\"{]+Buch löschen"
        message: App.tsx soll <DeleteButton label="Buch löschen" /> anzeigen.
      - type: command
        run: bun run build >/dev/null 2>&1
        message: bun run build schlägt fehl. Führe ihn aus – meist fehlt die Variante in buttonVariants oder ein Import.
      - type: command
        run: grep -h -o "\.bg-destructive{\|\.bg-destructive " dist/assets/*.css | head -1
        stdout_matches: "bg-destructive"
        message: Im gebauten CSS fehlt bg-destructive. Benutze die Variante tatsächlich und baue neu.
    hints:
      - "Varianten stehen in cva unter `variants.variant`, Größen unter `variants.size` – jeweils als `name: 'klassen'`."
      - "DeleteButton: `export function DeleteButton({ label }: { label: string }) { return <Button variant=\"destructive\" size=\"sm\">{label}</Button> }`"
      - "Fehlermeldung „Type '\"destructive\"' is not assignable“? Dann steht die Variante noch nicht (oder vertippt) in buttonVariants."
    solution: |
      ```bash
      cd button-variante
      sed -i "s#        ghost: 'hover:bg-muted',#        ghost: 'hover:bg-muted',\n        destructive: 'bg-destructive text-white hover:bg-destructive/90',#" src/components/ui/button.tsx
      sed -i "s#        lg: 'h-10 px-6',#        lg: 'h-10 px-6',\n        icon: 'size-9',#" src/components/ui/button.tsx
      cat > src/components/DeleteButton.tsx <<'EOF'
      import { Button } from '@/components/ui/button'

      export function DeleteButton({ label }: { label: string }) {
        return (
          <Button variant="destructive" size="sm">
            {label}
          </Button>
        )
      }
      EOF
      cat > src/App.tsx <<'EOF'
      import { DeleteButton } from '@/components/DeleteButton'

      export default function App() {
        return (
          <main className="p-8">
            <DeleteButton label="Buch löschen" />
          </main>
        )
      }
      EOF
      bun run build
      ```
  - id: varianten-funktion
    type: code
    language: ts
    title: Was cva für dich erledigt
    description: |
      Baue im Kleinen nach, was `cva` im Button macht. Schreibe `buttonClasses(options)`, die einen Klassen-String
      zusammensetzt:

      - Immer zuerst die Basis-Klassen `BASE`.
      - Dann die Klassen der Variante (`default`, `outline` oder `ghost`, Standard `default`).
      - Dann die Klassen der Größe (`sm` oder `default`, Standard `default`).
      - Zum Schluss – falls angegeben – `className`.

      Alle Teile werden mit genau einem Leerzeichen verbunden.
    starter: |
      const BASE = 'inline-flex items-center rounded-md'

      const VARIANTS = {
        default: 'bg-primary text-primary-foreground',
        outline: 'border border-border',
        ghost: 'hover:bg-muted',
      }

      const SIZES = {
        default: 'h-9 px-4',
        sm: 'h-8 px-3',
      }

      type ButtonOptions = {
        variant?: keyof typeof VARIANTS
        size?: keyof typeof SIZES
        className?: string
      }

      function buttonClasses(options: ButtonOptions = {}): string {
        // dein Code
        return ''
      }
    tests:
      - name: ohne Optionen gelten die Standardwerte
        code: |
          assertEqual(buttonClasses(), 'inline-flex items-center rounded-md bg-primary text-primary-foreground h-9 px-4')
      - name: Variante und Größe werden übernommen
        code: |
          assertEqual(buttonClasses({ variant: 'outline', size: 'sm' }), 'inline-flex items-center rounded-md border border-border h-8 px-3')
      - name: className kommt ans Ende
        code: |
          assertEqual(buttonClasses({ variant: 'ghost', className: 'w-full' }), 'inline-flex items-center rounded-md hover:bg-muted h-9 px-4 w-full')
      - name: leerer className erzeugt kein zusätzliches Leerzeichen
        code: |
          assertEqual(buttonClasses({ className: '' }), 'inline-flex items-center rounded-md bg-primary text-primary-foreground h-9 px-4')
    hints:
      - "Mit Destrukturierung und Standardwerten: `const { variant = 'default', size = 'default', className } = options`"
      - "Sammle die Teile in einem Array, filtere leere Werte mit `.filter(Boolean)` und verbinde mit `.join(' ')`."
    solution: |
      ```ts
      function buttonClasses(options: ButtonOptions = {}): string {
        const { variant = 'default', size = 'default', className } = options
        return [BASE, VARIANTS[variant], SIZES[size], className].filter(Boolean).join(' ')
      }
      ```
---
Nach `shadcn add button` liegt eine Datei in deinem Projekt, die du nicht selbst geschrieben hast. Bevor du sie
änderst, solltest du sie lesen können. Gute Nachricht: Eine shadcn-Komponente ist kurz, und jede Zeile hat einen
klaren Zweck.

## Anatomie eines Buttons

So ähnlich sieht `src/components/ui/button.tsx` aus (gekürzt):

```tsx title="src/components/ui/button.tsx"
import type { ComponentProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium disabled:opacity-50',
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
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

function Button({ className, variant, size, ...props }:
  ComponentProps<'button'> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
```

| Teil | Aufgabe |
|---|---|
| `cva(...)` | Basis-Klassen, Varianten, Standardwerte |
| `VariantProps<typeof buttonVariants>` | erzeugt den Typ `{ variant?: 'default' \| 'outline' \| 'ghost'; size?: … }` |
| `ComponentProps<'button'>` | alle normalen Button-Attribute wie `type`, `disabled`, `onClick` |
| `cn(...)` | verbindet Klassen und löst Tailwind-Konflikte |
| `data-slot="button"` | Markierung für Styling von außen (z. B. in Gruppen) |

Wichtig ist `...props`: Alles, was du nicht ausdrücklich herausnimmst, landet unverändert am `<button>`. Deshalb
funktionieren `type="submit"`, `disabled` oder `aria-label` ohne eine einzige Zeile Extra-Code. Viele shadcn-Komponenten
können außerdem mit `asChild` ihr Aussehen auf ein anderes Element übertragen, etwa auf einen Link – dieses Muster
erklärt der Kurs zur Komponenten-Architektur.

## Varianten ergänzen

Eine neue Variante ist eine neue Zeile:

```tsx
variant: {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  outline: 'border border-border bg-background hover:bg-muted',
  ghost: 'hover:bg-muted',
  destructive: 'bg-destructive text-white hover:bg-destructive/90',
},
```

Mehr ist nicht nötig. Weil die Props per `VariantProps` aus cva abgeleitet sind, kennt TypeScript die neue
Variante sofort – und meldet jede, die es nicht gibt.

`defaultVariants` legt fest, was gilt, wenn niemand eine Variante angibt. Ein `<Button>` ohne Props ist deshalb
automatisch `default` in Größe `default`. Für Sonderfälle, die nur bei einer bestimmten Kombination greifen sollen
(etwa `variant="ghost"` **und** `size="sm"`), kennt cva außerdem `compoundVariants`.

> [!MERKSATZ]
> Varianten und Größen gehören in die `ui`-Komponente. Sie beschreiben **wie** etwas aussieht, nicht **wofür**
> es benutzt wird.

## className von außen – und warum cn() wichtig ist

Jede Komponente nimmt ein `className` entgegen. So passt du einen einzelnen Button an, ohne eine Variante zu
erfinden:

```tsx
<Button className="w-full px-8">Weiter</Button>
```

Die Standardgröße bringt aber schon `px-4` mit. Ohne Hilfe stünden `px-4` und `px-8` gleichzeitig im HTML, und
welche gewinnt, hinge von der Reihenfolge im CSS ab. [[cn-funktion|cn()]] ruft deshalb nach `clsx` noch
[[tailwind-merge|tailwind-merge]] auf: Von zwei Klassen für dieselbe Eigenschaft bleibt die **spätere** – deine.

> [!FEHLER]
> **Klassen mit Template-Strings anhängen.** `` className={`${base} ${className}`} `` lässt Konflikte stehen.
> Verwende in eigenen Komponenten immer `cn(base, className)`.

## Ändern oder darauf aufbauen?

Weil der Code dir gehört, könntest du alles hineinschreiben. Sinnvoll ist eine klare Grenze:

| In `components/ui/…` ändern | Eigene Komponente darauf bauen |
|---|---|
| neue Variante, neue Größe | feste Texte und Icons |
| Fokus-Stil, Radius, Übergänge | Fachlogik („Buch löschen“, API-Aufruf) |
| Fehler in der Barrierefreiheit beheben | Kombinationen aus mehreren ui-Komponenten |

```tsx title="src/components/DeleteButton.tsx"
import { Button } from '@/components/ui/button'

export function DeleteButton({ label }: { label: string }) {
  return <Button variant="destructive" size="sm">{label}</Button>
}
```

> [!PRAXIS]
> Ändert ihr `ui`-Komponenten, haltet die Änderungen klein und dokumentiert sie im Pull Request. Wenn shadcn/ui
> später eine verbesserte Version veröffentlicht, zeigt `bunx --bun shadcn@latest add button --diff`, was sich
> unterscheidet – und ihr übernehmt Neuerungen bewusst, statt eure Anpassungen zu verlieren.

## Zusammenfassung

- Eine shadcn-Komponente besteht aus `cva`-Varianten, `cn()`, normalen HTML-Props und `data-slot`.
- `VariantProps` macht Varianten typsicher: Unbekannte Varianten scheitern beim Build.
- Neue Varianten und Größen sind je eine Zeile in `buttonVariants`.
- `cn()` lässt ein `className` von außen widersprüchliche Standardklassen überschreiben.
- Fachlogik und feste Texte kommen in eigene Komponenten, die auf `ui` aufbauen.
