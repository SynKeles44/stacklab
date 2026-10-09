---
title: Anatomie eines Vite-React-Projekts
summary: index.html, src, public und die Ordner components, pages, lib und hooks – so ist ein modernes React-Frontend aufgebaut.
duration: 25
sources:
  - title: Vite – Getting Started
    url: https://vite.dev/guide/
  - title: Vite – Static Asset Handling (public-Ordner)
    url: https://vite.dev/guide/assets
  - title: React – Thinking in React
    url: https://react.dev/learn/thinking-in-react
  - title: React – Reusing Logic with Custom Hooks
    url: https://react.dev/learn/reusing-logic-with-custom-hooks
quiz:
  - type: single
    question: Wo liegt in einem Vite-Projekt die `index.html`?
    options: [In public/, In src/, In der Projektwurzel, In dist/]
    answer: 2
    explanation: Vite behandelt index.html als Einstiegspunkt und erwartet sie in der Projektwurzel. Von dort bindet sie src/main.tsx ein.
  - type: match
    question: Ordne jeder Datei den passenden Ordner zu.
    pairs:
      - { left: "Button.tsx", right: "src/components/" }
      - { left: "SettingsPage.tsx", right: "src/pages/" }
      - { left: "useDarkMode.ts", right: "src/hooks/" }
      - { left: "formatPrice.ts", right: "src/lib/" }
      - { left: "robots.txt", right: "public/" }
    explanation: Komponenten, Seiten, Hooks und Hilfsfunktionen bekommen je einen eigenen Ordner. Dateien, die unverändert ausgeliefert werden, liegen in public/.
  - type: multiple
    question: Welche Aussagen über den Ordner `public/` stimmen?
    options:
      - Dateien darin werden unverändert in den Build kopiert.
      - Sie sind im Browser unter der Wurzel-URL erreichbar, z. B. /favicon.svg.
      - Vite optimiert und bündelt sie wie Dateien aus src/.
      - Hier gehören Komponenten hin.
    answers: [0, 1]
    explanation: public/ ist für Dateien, die einen festen Namen und Pfad brauchen. Bilder, die du im Code importierst, gehören dagegen nach src/assets/.
  - type: find-bug
    question: Dieses Projekt startet nicht – Vite meldet, dass es die Startdatei nicht findet. Welche Zeile ist falsch?
    language: html
    code: |
      <!doctype html>
      <html lang="de">
        <body>
          <div id="root"></div>
          <script type="module" src="/main.tsx"></script>
        </body>
      </html>
    bug_line: 5
    explanation: Die Startdatei liegt in src/. Richtig ist src="/src/main.tsx".
tasks:
  - id: react-src-ordnen
    type: terminal
    title: Einen flachen src-Ordner aufräumen
    description: |
      Im Ordner `react-ordnen` liegt ein kleines React-Projekt, bei dem alle Dateien direkt in `src/`
      gelandet sind. Räume es nach der üblichen Konvention auf:

      1. `Button.tsx` und `Header.tsx` → `src/components/`
      2. `HomePage.tsx` und `AboutPage.tsx` → `src/pages/`
      3. `useAuth.ts` → `src/hooks/`
      4. `formatDate.ts` → `src/lib/`
      5. `favicon.svg` soll unverändert unter `/favicon.svg` erreichbar sein → passender Ordner in der Wurzel
      6. `main.tsx` und `App.tsx` bleiben direkt in `src/`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: react-ordnen
    setup: |
      mkdir -p src public
      for f in main.tsx App.tsx Button.tsx Header.tsx HomePage.tsx AboutPage.tsx useAuth.ts formatDate.ts favicon.svg; do
        echo "// $f" > "src/$f"
      done
      printf '<!doctype html>\n<div id="root"></div>\n<script type="module" src="/src/main.tsx"></script>\n' > index.html
      echo '{ "name": "react-ordnen", "private": true }' > package.json
    checks:
      - type: command
        run: test -f src/components/Button.tsx && test -f src/components/Header.tsx
        message: Button.tsx und Header.tsx gehören nach src/components/.
      - type: command
        run: test -f src/pages/HomePage.tsx && test -f src/pages/AboutPage.tsx
        message: HomePage.tsx und AboutPage.tsx gehören nach src/pages/.
      - type: file_exists
        path: src/hooks/useAuth.ts
        message: useAuth.ts ist ein Hook und gehört nach src/hooks/.
      - type: file_exists
        path: src/lib/formatDate.ts
        message: formatDate.ts ist eine Hilfsfunktion und gehört nach src/lib/.
      - type: file_exists
        path: public/favicon.svg
        message: favicon.svg soll unverändert ausgeliefert werden – also nach public/.
      - type: command
        run: ls -p src | grep -v / | LC_ALL=C sort | tr '\n' ' '
        stdout_matches: "^App\\.tsx main\\.tsx\\s*$"
        message: Direkt in src/ sollen nur noch App.tsx und main.tsx liegen.
    hints:
      - Lege die Zielordner mit `mkdir -p src/components src/pages src/hooks src/lib` an.
      - "`mv src/Button.tsx src/Header.tsx src/components/` verschiebt mehrere Dateien auf einmal."
      - Der Ordner für unverändert ausgelieferte Dateien heißt `public` und liegt neben `src`.
    solution: |
      ```bash
      cd react-ordnen
      mkdir -p src/components src/pages src/hooks src/lib
      mv src/Button.tsx src/Header.tsx src/components/
      mv src/HomePage.tsx src/AboutPage.tsx src/pages/
      mv src/useAuth.ts src/hooks/
      mv src/formatDate.ts src/lib/
      mv src/favicon.svg public/
      tree
      ```
  - id: build-ablauf
    type: order
    title: Was passiert bei npm run build?
    description: Bringe die Schritte eines Vite-Builds in die richtige Reihenfolge.
    items:
      - Vite liest index.html in der Projektwurzel
      - Vite folgt dem Script-Tag zu src/main.tsx
      - Vite folgt allen Imports und bündelt den Code
      - Dateien aus public/ werden unverändert kopiert
      - Das Ergebnis landet im Ordner dist/
---
Auf der Frontend-Seite ist [[react|React]] die verbreitetste Bibliothek, und [[vite|Vite]] ist das
Werkzeug, mit dem die meisten neuen React-Projekte entstehen. Anders als Laravel schreibt React dir
kaum Ordner vor. Umso wichtiger ist es, die gängigen Konventionen zu kennen.

## Das Grundgerüst von Vite

Ein neues Projekt legst du mit `npm create vite@latest` an und wählst die Vorlage React mit
TypeScript. Das Ergebnis sieht ungefähr so aus:

```text title="Ein frisches Vite-React-Projekt"
index.html          package.json        vite.config.ts
tsconfig.json       eslint.config.js    README.md
public/             src/
  vite.svg            main.tsx
                      App.tsx
                      assets/
```

| Datei / Ordner | Aufgabe |
|---|---|
| `index.html` | die einzige HTML-Seite, der [[einstiegspunkt|Einstiegspunkt]] |
| `src/main.tsx` | startet React und hängt `App` in die Seite |
| `src/App.tsx` | die oberste [[komponente|Komponente]] |
| `src/assets/` | Bilder, die du im Code importierst |
| `public/` | Dateien, die unverändert ausgeliefert werden |
| `vite.config.ts` | Einstellungen für Vite |

## index.html liegt in der Wurzel

Bei vielen Werkzeugen ist die HTML-Datei ein Nebendarsteller. Bei Vite ist sie der Startpunkt. Sie
liegt bewusst in der [[projektwurzel|Projektwurzel]] und lädt per Script-Tag deinen Code:

```html title="index.html"
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

Von `main.tsx` aus folgt Vite allen `import`-Anweisungen. So findet es jede Datei, die dein Programm
braucht. Beim Build bündelt der [[bundler|Bundler]] alles in wenige Dateien im Ordner `dist/` – ein
typisches [[build-artefakt|Build-Artefakt]].

Während der Entwicklung entsteht dagegen kein `dist/`. Der Dev-Server übersetzt jede Datei erst, wenn
der Browser sie anfordert – darum startet er so schnell. Mit `npm run preview` kannst du dir das fertige
`dist/` vor dem Ausliefern lokal ansehen.

> [!MERKSATZ]
> `src/` ist dein Code, `public/` wird unverändert kopiert, `dist/` ist das Ergebnis des Builds und
> wird nie committet.

## src sinnvoll gliedern

Wächst das Projekt, legst du in `src/` Unterordner an. Diese vier sind weit verbreitet:

| Ordner | Inhalt | Beispiel |
|---|---|---|
| `components/` | wiederverwendbare Bausteine | `Button.tsx`, `Header.tsx` |
| `pages/` | ganze Seiten, je eine pro Route | `HomePage.tsx` |
| `hooks/` | eigene [[react-hook|Hooks]], beginnen mit `use` | `useAuth.ts` |
| `lib/` | Hilfsfunktionen ohne React | `formatDate.ts` |

Eine einfache Faustregel hilft beim Einsortieren: Gibt die Datei JSX zurück und wird an mehreren
Stellen genutzt, ist sie eine Komponente. Hängt sie an einer URL, ist sie eine Seite. Beginnt sie mit
`use`, ist sie ein Hook. Hat sie gar nichts mit React zu tun, gehört sie nach `lib/`.

Manche Teams nennen `lib/` auch `utils/` oder `pages/` auch `routes/`. Wichtig ist nicht der exakte
Name, sondern dass das ganze Team denselben nutzt.

> [!FEHLER]
> **Alles in `src/` werfen.** Bei fünf Dateien ist das egal, bei fünfzig nicht mehr. Dann suchst du
> zwischen Seiten, Buttons und Hilfsfunktionen. Ordne früh – Verschieben wird mit jeder Datei teurer.

## Nach Typ oder nach Feature?

Die Tabelle oben ordnet **nach Typ**: alle Komponenten zusammen, alle Hooks zusammen. Große
Anwendungen ordnen oft zusätzlich **nach Feature**:

```text title="Ordnung nach Feature"
src/features/cart/      CartPage.tsx  CartItem.tsx  useCart.ts
src/features/profile/   ProfilePage.tsx  useProfile.ts
src/components/         Button.tsx  Dialog.tsx   ← wirklich geteilte Bausteine
```

Alles zum Warenkorb liegt dann beieinander. Für kleine und mittlere Projekte reicht die Ordnung nach
Typ völlig.

> [!PRAXIS]
> Viele Projekte richten einen Pfad-Alias ein, damit du `import { Button } from '@/components/Button'`
> statt `'../../../components/Button'` schreibst. Das `@` zeigt auf `src/` und wird in
> `tsconfig.json` und `vite.config.ts` eingestellt.

## Zusammenfassung

- Vite startet bei `index.html` in der Projektwurzel und folgt den Imports ab `src/main.tsx`.
- `src/` enthält deinen Code, `src/assets/` importierte Bilder.
- `public/` wird unverändert ausgeliefert, z. B. `favicon.svg` oder `robots.txt`.
- `dist/` entsteht beim Build und gehört in die `.gitignore`.
- Übliche Unterordner: `components/`, `pages/`, `hooks/`, `lib/`.
- Große Projekte ordnen zusätzlich nach Feature.
