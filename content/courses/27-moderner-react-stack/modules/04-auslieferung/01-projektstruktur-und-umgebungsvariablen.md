---
title: Projektstruktur und Umgebungsvariablen
summary: Eine Ordnerstruktur, die mit der App wächst, und Konfiguration über .env-Dateien, import.meta.env, das Präfix VITE_ und eine Zod-Prüfung beim Start.
duration: 20
sources:
  - title: Vite – Env Variables and Modes
    url: https://vite.dev/guide/env-and-mode
  - title: shadcn/ui – components.json (aliases)
    url: https://ui.shadcn.com/docs/components-json
  - title: Bun – Environment variables
    url: https://bun.com/docs/runtime/environment-variables
  - title: Zod – Basic usage
    url: https://zod.dev/basics
quiz:
  - type: single
    question: In `.env` steht `API_KEY=abc` und `VITE_API_URL=https://api.example.com`. Was liefert `import.meta.env` im Browser-Code?
    options:
      - Beide Werte
      - Nur VITE_API_URL – Variablen ohne das Präfix VITE_ gibt Vite nicht an den Client-Code weiter
      - Nur API_KEY
      - Keinen der beiden, man muss process.env benutzen
    answer: 1
    explanation: >
      Vite schützt dich vor versehentlichem Ausliefern: Nur Variablen mit `VITE_` landen im Bundle. Alles andere
      bleibt außen vor. `process.env` gibt es im Browser nicht.
  - type: multiple
    question: Welche Aussagen über VITE_-Variablen stimmen?
    options:
      - Sie werden beim Build als fester Text ins JavaScript geschrieben.
      - Jede Person kann sie im ausgelieferten Code lesen.
      - Sie eignen sich für geheime API-Schlüssel, solange die Datei .env.local heißt.
      - Ändert sich ein Wert, muss die App neu gebaut werden.
    answers: [0, 1, 3]
    explanation: >
      Alles, was im Browser landet, ist öffentlich. Geheimnisse gehören auf einen Server oder in eine
      Serverless-Funktion – nie in eine VITE_-Variable, egal in welcher Datei sie steht.
  - type: match
    question: Ordne jede Datei zu, wann Vite sie lädt.
    pairs:
      - { left: ".env", right: "immer" }
      - { left: ".env.local", right: "immer, aber nicht im Repository" }
      - { left: ".env.production", right: "nur bei vite build (Modus production)" }
      - { left: ".env.development", right: "nur bei vite (Dev-Server)" }
    explanation: Modus-Dateien überschreiben die allgemeinen. `*.local`-Dateien stehen in der .gitignore und sind für persönliche Einstellungen gedacht.
  - type: cloze
    text: Damit TypeScript deine eigenen Variablen kennt, erweiterst du in `src/vite-env.d.ts` das Interface ___. Zur Laufzeit prüfst du die Werte mit `EnvSchema.___(import.meta.env)`.
    blanks:
      - [ImportMetaEnv]
      - [parse]
    explanation: Das Interface sorgt für Autovervollständigung, Zod sorgt dafür, dass die Werte beim Start wirklich da und gültig sind.
tasks:
  - id: env-config
    type: terminal
    title: Konfiguration pro Umgebung
    description: |
      Im Ordner `env-config` liegt ein Projekt mit Tailwind, Alias `@` und Zod. Lege die Konfiguration für
      Entwicklung und Produktion an.

      1. Lege `.env` an mit `VITE_APP_TITLE=Buchclub`, `VITE_API_URL=http://localhost:3000/api` und
         `DB_PASSWORD=nur-fuer-den-server` (eine Variable **ohne** Präfix).
      2. Lege `.env.production` an, die nur `VITE_API_URL=https://api.example.com` setzt.
      3. Lege `src/vite-env.d.ts` an und erweitere `ImportMetaEnv` um `VITE_APP_TITLE` und `VITE_API_URL` (beide `readonly … : string`).
      4. Lege `src/lib/env.ts` an: Ein `EnvSchema` mit `VITE_APP_TITLE` (nicht leer) und `VITE_API_URL` (`z.url()`)
         und `export const env = EnvSchema.parse(import.meta.env)`.
      5. `src/App.tsx` zeigt `env.VITE_APP_TITLE` als Überschrift und `env.VITE_API_URL` darunter.
      6. Baue mit `bun run build` und prüfe mit `grep -o "https://api.example.com" dist/assets/*.js`, welche URL im Build steht.

      Klicke zuerst auf **Aufgabe vorbereiten** (das dauert einige Sekunden).
    workdir: env-config
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
      bun add zod >/dev/null 2>&1
    checks:
      - type: file_contains
        path: .env
        pattern: "^DB_PASSWORD=nur-fuer-den-server"
        message: In .env fehlt die Zeile DB_PASSWORD=nur-fuer-den-server.
      - type: file_contains
        path: .env.production
        pattern: "^VITE_API_URL=https://api\\.example\\.com\\s*$"
        message: .env.production soll VITE_API_URL=https://api.example.com setzen.
      - type: file_contains
        path: src/vite-env.d.ts
        pattern: "interface\\s+ImportMetaEnv\\s*\\{[^}]*VITE_API_URL"
        message: In src/vite-env.d.ts fehlt interface ImportMetaEnv mit VITE_APP_TITLE und VITE_API_URL.
      - type: file_contains
        path: src/lib/env.ts
        pattern: "\\.parse\\(\\s*import\\.meta\\.env\\s*\\)"
        message: src/lib/env.ts soll export const env = EnvSchema.parse(import.meta.env) enthalten.
      - type: file_contains
        path: src/lib/env.ts
        pattern: "VITE_API_URL\\s*:\\s*z\\.url\\(\\)"
        message: Im EnvSchema soll VITE_API_URL mit z.url() geprüft werden.
      - type: command
        run: bun run build >/dev/null 2>&1
        message: bun run build schlägt fehl. Führe ihn aus und lies die Fehlermeldung.
      - type: command
        run: cat dist/assets/*.js | grep -c "https://api.example.com"
        stdout_matches: "^[1-9]"
        message: Im Build fehlt https://api.example.com. Steht der Wert in .env.production, und benutzt App.tsx env.VITE_API_URL?
      - type: command
        run: cat dist/assets/*.js | grep -c "localhost:3000\|nur-fuer-den-server" || true
        stdout_equals: "0"
        message: Im Build steht noch die Entwicklungs-URL oder das Passwort. Prüfe, ob .env.production den Wert überschreibt und DB_PASSWORD kein VITE_-Präfix hat.
      - type: command
        run: cat dist/assets/*.js | grep -c "Buchclub"
        stdout_matches: "^[1-9]"
        message: Der Titel Buchclub fehlt im Build. Zeige env.VITE_APP_TITLE in App.tsx an.
    hints:
      - "`printf 'VITE_APP_TITLE=Buchclub\\nVITE_API_URL=http://localhost:3000/api\\nDB_PASSWORD=nur-fuer-den-server\\n' > .env` legt die Datei in einem Schritt an."
      - "vite-env.d.ts: `interface ImportMetaEnv { readonly VITE_APP_TITLE: string; readonly VITE_API_URL: string }` – ohne import-Zeilen."
      - "Steht `localhost:3000` noch im Build? Vite lädt .env.production nur im Modus production – also bei `bun run build`, nicht im Dev-Server."
    solution: |
      ```bash
      cd env-config
      printf 'VITE_APP_TITLE=Buchclub\nVITE_API_URL=http://localhost:3000/api\nDB_PASSWORD=nur-fuer-den-server\n' > .env
      printf 'VITE_API_URL=https://api.example.com\n' > .env.production
      cat > src/vite-env.d.ts <<'EOF'
      interface ImportMetaEnv {
        readonly VITE_APP_TITLE: string
        readonly VITE_API_URL: string
      }

      interface ImportMeta {
        readonly env: ImportMetaEnv
      }
      EOF
      mkdir -p src/lib
      cat > src/lib/env.ts <<'EOF'
      import { z } from 'zod'

      const EnvSchema = z.object({
        VITE_APP_TITLE: z.string().min(1),
        VITE_API_URL: z.url(),
      })

      export const env = EnvSchema.parse(import.meta.env)
      EOF
      cat > src/App.tsx <<'EOF'
      import { env } from '@/lib/env'

      export default function App() {
        return (
          <main className="p-8">
            <h1 className="text-2xl font-bold">{env.VITE_APP_TITLE}</h1>
            <p>API: {env.VITE_API_URL}</p>
          </main>
        )
      }
      EOF
      bun run build
      grep -o "https://api.example.com" dist/assets/*.js
      ```
  - id: wohin-damit
    type: dragdrop
    title: Wohin gehört diese Datei?
    description: Ordne jede Datei dem Ordner zu, in den sie in unserer Projektstruktur gehört.
    targets:
      - { id: ui, label: src/components/ui }
      - { id: components, label: src/components }
      - { id: routes, label: src/routes }
      - { id: lib, label: src/lib }
      - { id: public, label: public }
    items:
      - { label: "button.tsx (per shadcn add)", target: ui }
      - { label: "dialog.tsx (per shadcn add)", target: ui }
      - { label: "BookCard.tsx (fachliche Komponente)", target: components }
      - { label: "book-detail.tsx mit bookLoader und Seite", target: routes }
      - { label: "schemas.ts mit Zod-Schemas", target: lib }
      - { label: "env.ts mit geprüfter Konfiguration", target: lib }
      - { label: "favicon.svg, das unverändert ausgeliefert wird", target: public }
    hints:
      - "`ui` enthält nur, was die shadcn-CLI erzeugt. Fachliches liegt eine Ebene höher."
---
Am Anfang passt jedes Projekt in drei Dateien. Nach einem halben Jahr sind es hundert – und die Frage „Wo liegt
noch mal die Validierung fürs Formular?“ kostet jeden Tag Zeit. Gleichzeitig soll dieselbe App lokal gegen eine
Test-API laufen und in Produktion gegen die echte. Beides löst du jetzt: mit einer klaren
[[projektstruktur|Projektstruktur]] und mit Umgebungsvariablen.

## Eine Struktur, die mitwächst

```text title="Ordnerstruktur des Buchclubs"
src/
├── main.tsx              ← Einstieg: RouterProvider
├── router.tsx            ← alle Routen an einer Stelle
├── index.css             ← Tailwind + Theme-Variablen
├── vite-env.d.ts         ← Typen für import.meta.env
├── components/
│   ├── ui/               ← nur shadcn-Code (button.tsx, card.tsx …)
│   └── BookCard.tsx      ← fachliche Komponenten
├── routes/               ← eine Datei pro Seite: loader, action, Komponente
│   ├── root.tsx
│   ├── books.tsx
│   └── book-detail.tsx
└── lib/                  ← Hilfen ohne Oberfläche
    ├── utils.ts          ← cn()
    ├── schemas.ts        ← Zod-Schemas
    ├── api.ts            ← fetch + Schema.parse
    └── env.ts            ← geprüfte Konfiguration
```

Zwei Prinzipien stecken dahinter:

- **Zusammen, was sich zusammen ändert.** Loader, Action und Komponente einer Seite liegen in **einer** Datei unter
  `routes/`. Wer die Seite ändert, findet alles an einem Ort.
- **`ui` bleibt generisch.** Dort liegt nur, was die shadcn-CLI erzeugt. Fachliches wie `BookCard` baut darauf auf.

Wird die App groß, gruppieren viele Teams nach Fachbereichen ([[feature-ordner|Feature-Ordner]]):
`src/features/books/…`, `src/features/members/…` – jeweils mit eigenen Routen, Komponenten und Schemas.

> [!MERKSATZ]
> Die Struktur soll eine Frage schnell beantworten: „Wo würde ich das suchen?“ Wenn zwei Leute im Team
> unterschiedlich antworten, ist es Zeit für eine gemeinsame Regel.

## Umgebungsvariablen in Vite

Werte, die sich je Umgebung unterscheiden – API-Adresse, App-Titel, Feature-Schalter – gehören nicht in den Code,
sondern in [[env-datei|.env-Dateien]]. Vite stellt sie über [[import-meta-env|`import.meta.env`]] bereit:

```bash title=".env"
VITE_APP_TITLE=Buchclub
VITE_API_URL=http://localhost:3000/api
DB_PASSWORD=nur-fuer-den-server
```

```ts
console.log(import.meta.env.VITE_API_URL)   // "http://localhost:3000/api"
console.log(import.meta.env.DB_PASSWORD)    // undefined – kein VITE_-Präfix
console.log(import.meta.env.MODE)           // "development" oder "production"
```

| Eingebaut | Bedeutung |
|---|---|
| `import.meta.env.MODE` | aktueller [[build-modus|Modus]] |
| `import.meta.env.DEV` / `PROD` | Entwicklung oder Produktion |
| `import.meta.env.BASE_URL` | Basis-Pfad der App (Option `base`) |

> [!FEHLER]
> **Geheimnisse in VITE_-Variablen.** Alles mit `VITE_` schreibt Vite beim Build als festen Text ins JavaScript.
> Jeder Mensch mit Browser kann es lesen. API-Schlüssel mit echten Rechten gehören auf einen Server.

## Dateien und Modi

| Datei | wird geladen |
|---|---|
| `.env` | immer |
| `.env.local` | immer, steht in der `.gitignore` |
| `.env.development` | bei `bun run dev` (Modus `development`) |
| `.env.production` | bei `bun run build` (Modus `production`) |
| `.env.[modus].local` | im Modus, nicht im Repository |

Spezifische Dateien gewinnen: `.env.production` überschreibt `.env`. Noch stärker sind Variablen, die beim Start
schon gesetzt sind, z. B. `VITE_API_URL=https://staging.example.com bun run build`. Mit `vite build --mode staging`
lädt Vite `.env.staging`. Nach Änderungen an `.env`-Dateien startest du den Dev-Server neu.

Bun lädt `.env`-Dateien übrigens selbst schon, bevor es ein Skript startet. Bei den üblichen Skripten stört das nicht;
die Vite-Doku verweist für Sonderfälle auf eine Diskussion im Bun-Repository.

## Typen und Prüfung beim Start

TypeScript kennt deine eigenen Variablen nicht. Du ergänzt sie in `src/vite-env.d.ts`:

```ts title="src/vite-env.d.ts"
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

Das ist nur ein Versprechen. Ob die Werte wirklich gesetzt sind, prüft Zod – einmal beim Start:

```ts title="src/lib/env.ts"
import { z } from 'zod'

const EnvSchema = z.object({
  VITE_APP_TITLE: z.string().min(1),
  VITE_API_URL: z.url(),
})

export const env = EnvSchema.parse(import.meta.env)
```

Im Code benutzt du dann nur noch `env.VITE_API_URL`. Fehlt eine Variable, scheitert die App sofort mit einer klaren
Meldung – statt Stunden später mit einem `fetch` an `undefined/books`.

> [!PRAXIS]
> Teams legen eine `.env.example` mit allen Variablen und Beispielwerten ins Repository. Neue Kolleg:innen kopieren
> sie nach `.env.local` und tragen ihre eigenen Werte ein. Die echte Konfiguration für Produktion setzt die
> CI-Pipeline beim Build.

## Zusammenfassung

- Seiten mit Loader und Action liegen gemeinsam in `src/routes/`, shadcn-Code in `src/components/ui`, Hilfen in `src/lib`.
- Nur Variablen mit dem Präfix `VITE_` landen über `import.meta.env` im Browser-Code.
- VITE_-Werte sind öffentlich und fest eingebaut – keine Geheimnisse, Neubau bei Änderungen.
- `.env.production` und andere Modus-Dateien überschreiben `.env`; `*.local` bleibt außerhalb des Repositorys.
- `ImportMetaEnv` liefert Typen, ein Zod-Schema prüft die Werte beim Start.
