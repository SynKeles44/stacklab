---
title: Der Produktions-Build
summary: Was bun run build erzeugt, warum Dateinamen Hashes tragen, wie du den Build mit preview prüfst, wann du base brauchst und warum der Webserver einen SPA-Fallback braucht.
duration: 20
sources:
  - title: Vite – Building for Production
    url: https://vite.dev/guide/build
  - title: Vite – Deploying a Static Site
    url: https://vite.dev/guide/static-deploy
  - title: Vite – Shared Options (base)
    url: https://vite.dev/config/shared-options#base
  - title: nginx – try_files
    url: https://nginx.org/en/docs/http/ngx_http_core_module.html#try_files
  - title: MDN – Cache-Control
    url: https://developer.mozilla.org/de/docs/Web/HTTP/Reference/Headers/Cache-Control
quiz:
  - type: single
    question: Warum heißt die gebaute Datei `index-CVtPK4EU.js` und nicht einfach `index.js`?
    options:
      - Damit niemand den Code lesen kann.
      - Der Hash ändert sich mit dem Inhalt – so dürfen Browser die Datei sehr lange cachen und bekommen nach einem Update trotzdem sofort die neue.
      - Weil Vite zufällige Namen vergibt, um Konflikte zu vermeiden.
      - Der Hash ist die Versionsnummer aus der package.json.
    answer: 1
    explanation: >
      Ein Content-Hash entsteht aus dem Inhalt der Datei. Gleicher Inhalt, gleicher Name; neuer Inhalt, neuer Name.
      Deshalb kann der Server `assets/` mit „ein Jahr cachen“ ausliefern, während `index.html` immer frisch geladen wird.
  - type: multiple
    question: Die App läuft lokal, aber auf dem Server zeigt ein direkt geöffneter Link wie `/buecher/momo` eine 404-Seite. Was stimmt?
    options:
      - Auf dem Server gibt es keine Datei buecher/momo – nur index.html und assets/.
      - Der Webserver muss für unbekannte Pfade index.html ausliefern (SPA-Fallback).
      - Der Fehler liegt im loader der Route.
      - Bei nginx erledigt das `try_files $uri $uri/ /index.html;`.
    answers: [0, 1, 3]
    explanation: >
      Bei einer Single-Page-Application entscheidet der Router im Browser, was zu `/buecher/momo` gehört. Der Server
      muss dafür erst einmal index.html schicken. Der Loader wird ohne diesen Fallback nie erreicht.
  - type: match
    question: Ordne jedem Befehl zu, was er tut.
    pairs:
      - { left: "bun run build", right: "Typen prüfen und dist/ erzeugen" }
      - { left: "bun run preview", right: "dist/ lokal wie ein Webserver ausliefern" }
      - { left: "bun run dev", right: "Dev-Server mit Hot Module Replacement" }
      - { left: "vite build --mode staging", right: "Build mit .env.staging" }
    explanation: Teste vor dem Ausliefern immer den echten Build mit preview – der Dev-Server verhält sich in Details anders.
  - type: cloze
    text: "Liegt die App nicht im Wurzelverzeichnis, sondern unter `https://example.com/buchclub/`, setzt du in vite.config.ts die Option `___: '/buchclub/'`."
    blanks:
      - [base]
    explanation: Mit `base` schreibt Vite alle Pfade in index.html als `/buchclub/assets/…`. Für den Router passt du zusätzlich `basename` in createBrowserRouter an.
tasks:
  - id: build-pruefen
    type: terminal
    title: Den Build reparieren und für einen Unterpfad bauen
    description: |
      Im Ordner `build-pruefen` liegt ein Projekt, dessen Build gerade fehlschlägt. Es soll später unter
      `https://example.com/buchclub/` laufen.

      1. Führe `bun run build` aus und lies die **erste** Fehlermeldung. Behebe den Typfehler in `src/App.tsx`, ohne
         `any` oder `@ts-ignore` zu benutzen (`formatPrice` erwartet Cent als Zahl).
      2. Setze in `vite.config.ts` die Option `base: '/buchclub/'`.
      3. Ergänze die `.gitignore` um `dist` – gebaute Dateien gehören nicht ins Repository.
      4. Baue erneut und prüfe mit `cat dist/index.html`, dass die Pfade mit `/buchclub/assets/` beginnen.

      Klicke zuerst auf **Aufgabe vorbereiten** (das dauert einige Sekunden).
    workdir: build-pruefen
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
      printf 'node_modules\n' > .gitignore
      mkdir -p src/lib
      cat > src/lib/price.ts <<'EOF'
      export function formatPrice(cents: number): string {
        return `${(cents / 100).toFixed(2).replace('.', ',')} €`
      }
      EOF
      cat > src/App.tsx <<'EOF'
      import { formatPrice } from '@/lib/price'

      const membershipFee = '2490'

      export default function App() {
        return (
          <main className="p-8">
            <h1 className="text-2xl font-bold">Buchclub</h1>
            <p>Jahresbeitrag: {formatPrice(membershipFee)}</p>
          </main>
        )
      }
      EOF
    checks:
      - type: command
        run: 'grep -Ec "as any|: any|@ts-ignore|@ts-expect-error" src/App.tsx || true'
        stdout_equals: "0"
        message: Behebe den Typfehler sauber – ohne any, @ts-ignore oder @ts-expect-error. Der Beitrag soll eine Zahl sein.
      - type: command
        run: ./node_modules/.bin/tsc -b >/dev/null 2>&1
        message: TypeScript meldet noch Fehler. Führe bun run build aus und lies die erste Meldung.
      - type: file_contains
        path: vite.config.ts
        pattern: "base\\s*:\\s*['\"]/buchclub/['\"]"
        message: In vite.config.ts fehlt base '/buchclub/'.
      - type: file_contains
        path: .gitignore
        pattern: "^/?dist/?\\s*$"
        message: Die .gitignore soll eine Zeile dist enthalten.
      - type: command
        run: bun run build >/dev/null 2>&1 && grep -o 'src="/buchclub/assets/index-[A-Za-z0-9_-]*\.js"' dist/index.html
        stdout_matches: "^src=\"/buchclub/assets/index-[A-Za-z0-9_-]+\\.js\"$"
        message: dist/index.html verweist noch nicht auf /buchclub/assets/index-….js. Setze base und baue neu.
      - type: command
        run: cat dist/assets/*.js | grep -c "24,90\|2490"
        stdout_matches: "^[1-9]"
        message: Der Beitrag 2490 Cent fehlt im Build. Übergib formatPrice die Zahl 2490.
    hints:
      - "Die Fehlermeldung nennt Datei, Zeile und Spalte, z. B. `src/App.tsx(9,…): error TS2345: Argument of type 'string' …`."
      - "Aus `const membershipFee = '2490'` wird `const membershipFee = 2490` – eine Zahl statt Text."
      - "In vite.config.ts steht `base` auf derselben Ebene wie `plugins`: `defineConfig({ base: '/buchclub/', plugins: [...] })`."
    solution: |
      ```bash
      cd build-pruefen
      bun run build
      sed -i "s/const membershipFee = '2490'/const membershipFee = 2490/" src/App.tsx
      sed -i "s#  plugins: \[react(), tailwindcss()\],#  base: '/buchclub/',\n  plugins: [react(), tailwindcss()],#" vite.config.ts
      echo "dist" >> .gitignore
      bun run build
      cat dist/index.html
      ```
  - id: ausliefern
    type: simulated
    title: Den Build auf einen Server bringen
    description: |
      Der Build ist fertig. Bring ihn auf den Server `203.0.113.10` (Benutzer `deploy`) und prüfe die Auslieferung.
      Der Server läuft im Internet – deshalb übst du hier im simulierten Terminal.

      1. Baue die App mit `bun run build`.
      2. Kopiere den Inhalt von `dist/` mit `rsync -avz --delete dist/ deploy@203.0.113.10:/var/www/buchclub/`.
      3. Prüfe mit `curl -I https://buchclub.example.com/buecher/momo`, dass auch ein tiefer Link die Seite liefert.
    prompt: "du@laptop:~/buchclub$"
    steps:
      - expect: "^bun\\s+run\\s+build$"
        output: |
          $ tsc -b && vite build
          vite v8.3.4 building client environment for production...
          ✓ 207 modules transformed.
          dist/index.html                   0.39 kB │ gzip:   0.26 kB
          dist/assets/index-BCrS7nBI.css    9.02 kB │ gzip:   2.62 kB
          dist/assets/stats-CQ1EG2bq.js     0.45 kB │ gzip:   0.31 kB
          dist/assets/index-C7VKbhah.js   429.63 kB │ gzip: 132.63 kB
          ✓ built in 193ms
        hint: bun run build
      - expect: "^rsync\\s+-avz\\s+--delete\\s+dist/\\s+deploy@203\\.0\\.113\\.10:/var/www/buchclub/?$"
        output: |
          sending incremental file list
          ./
          index.html
          assets/
          assets/index-BCrS7nBI.css
          assets/index-C7VKbhah.js
          assets/stats-CQ1EG2bq.js
          deleting assets/index-Dk2LpQ7a.js

          sent 132,948 bytes  received 115 bytes  88,708.67 bytes/sec
          total size is 439,523  speedup is 3.30
        hint: "Achte auf den Schrägstrich hinter dist/ – er kopiert den Inhalt, nicht den Ordner selbst."
      - expect: "^curl\\s+-I\\s+https://buchclub\\.example\\.com/buecher/momo$"
        output: |
          HTTP/2 200
          content-type: text/html
          cache-control: no-cache
        hint: curl -I https://buchclub.example.com/buecher/momo
    responses:
      - match: "^ls(\\s+dist)?$"
        output: "assets  index.html"
      - match: "^bun\\s+run\\s+dev"
        output: "Der Dev-Server ist nur für die Entwicklung gedacht. Auf den Server kommt der Inhalt von dist/ aus bun run build."
---
Im Dev-Server sieht alles gut aus. Aber der Dev-Server ist ein Entwicklungswerkzeug: Er übersetzt Dateien bei
Bedarf, liefert hunderte einzelne Module aus und prüft keine Typen. Was auf einen echten Webserver kommt, entsteht
mit `bun run build` – ein [[produktions-build|Produktions-Build]] aus wenigen, kleinen, optimierten Dateien.

## Was bun run build macht

```json title="package.json"
"build": "tsc -b && vite build"
```

1. **`tsc -b`** prüft alle Typen in `src` und `vite.config.ts`. Ein einziger Fehler stoppt hier alles.
2. **`vite build`** bündelt die App mit Rolldown:
   - TSX wird zu JavaScript, alle Importe werden zu wenigen Dateien zusammengefasst,
   - ungenutzter Code fliegt raus ([[tree-shaking|Tree-Shaking]]),
   - alles wird [[minifizierung|minifiziert]],
   - Tailwind erzeugt eine CSS-Datei mit genau den benutzten Klassen,
   - `VITE_`-Variablen aus `.env.production` werden fest eingesetzt.

```text title="dist/ nach dem Build"
dist/
├── index.html
├── favicon.svg                ← aus public/, unverändert
└── assets/
    ├── index-C7VKbhah.js      ← App-Code
    ├── stats-CQ1EG2bq.js      ← lazy Route, eigener Chunk
    └── index-BCrS7nBI.css
```

> [!MERKSATZ]
> `dist/` ist ein [[build-artefakt|Build-Artefakt]]: Es wird jederzeit neu erzeugt, gehört in die `.gitignore` und
> ist das Einzige, was der Webserver braucht.

## Hashes im Dateinamen und Caching

Die Zeichenfolge in `index-C7VKbhah.js` ist ein [[content-hash|Content-Hash]]: Er wird aus dem Inhalt berechnet.
Ändert sich auch nur ein Zeichen, entsteht ein neuer Name. Das erlaubt eine einfache Cache-Regel:

| Datei | Cache-Regel | Warum |
|---|---|---|
| `assets/*` | sehr lange cachen (z. B. ein Jahr, `immutable`) | neuer Inhalt = neuer Name |
| `index.html` | nicht cachen (`no-cache`) | verweist immer auf die aktuellen Asset-Namen |

So bekommen Nutzer:innen nach einem Update sofort die neue Version, und unveränderte Dateien kommen aus dem Cache.
Diese Regeln setzt nicht Vite, sondern der Webserver oder das CDN über den Header `Cache-Control`. Vite liefert
mit den Hashes nur die Voraussetzung dafür.

## Den Build lokal prüfen

```bash title="Terminal"
bun run build
bun run preview
```

[[vite-preview|`vite preview`]] liefert `dist/` unter `http://localhost:4173` aus – wie ein einfacher Webserver.
Teste dort, bevor du auslieferst: Fehlen Umgebungsvariablen? Lädt die lazy Route? Klappt ein Reload auf einer
Unterseite? `preview` ist nur zum Testen gedacht, nicht für den Betrieb.

> [!FEHLER]
> **Den Dev-Server ausliefern.** `bun run dev` auf dem Server zu starten ist langsam, unsicher und prüft keine Typen.
> Ausgeliefert wird immer der Inhalt von `dist/` – von einem Webserver, einem CDN oder einem Static-Hosting-Dienst.

## Unterpfad und SPA-Fallback

**Unterpfad:** Läuft die App unter `https://example.com/buchclub/`, setzt du in `vite.config.ts` `base: '/buchclub/'`.
Vite schreibt dann alle Pfade als `/buchclub/assets/…`. Dem Router sagst du dasselbe mit
`createBrowserRouter(routes, { basename: '/buchclub' })`.

**SPA-Fallback:** Öffnet jemand `/buecher/momo` direkt, sucht der Webserver eine Datei dieses Namens – und findet
keine. Er muss stattdessen `index.html` schicken, damit der Router im Browser übernimmt. Dieses Verhalten heißt
[[spa-fallback|SPA-Fallback]]:

```nginx title="nginx (Ausschnitt)"
location / {
    try_files $uri $uri/ /index.html;
}
```

> [!PRAXIS]
> In der CI-Pipeline läuft bei jedem Merge `bun install --frozen-lockfile` und `bun run build`. Das Ergebnis
> `dist/` wird als Artefakt gespeichert und unverändert auf Staging und später auf Produktion ausgeliefert –
> mit den passenden Umgebungsvariablen beim Build. Wie das automatisiert wird, zeigt der Kurs zu Deployments und CI/CD.

## Zusammenfassung

- `bun run build` prüft erst die Typen (`tsc -b`) und baut dann mit `vite build` den Ordner `dist/`.
- Der Build bündelt, minifiziert, entfernt toten Code und setzt `VITE_`-Werte fest ein.
- Content-Hashes erlauben langes Caching von `assets/`; `index.html` wird nie lange gecacht.
- `bun run preview` testet den echten Build lokal.
- `base` für Unterpfade, und der Webserver braucht einen SPA-Fallback auf `index.html`.
