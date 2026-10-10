---
title: Was shadcn/ui anders macht
summary: Warum shadcn/ui keine Bibliothek im klassischen Sinn ist, was die CLI mit init und add in dein Projekt schreibt und welche Rolle components.json spielt.
duration: 20
sources:
  - title: shadcn/ui – Introduction
    url: https://ui.shadcn.com/docs
  - title: shadcn/ui – Vite installation
    url: https://ui.shadcn.com/docs/installation/vite
  - title: shadcn/ui – CLI
    url: https://ui.shadcn.com/docs/cli
  - title: shadcn/ui – components.json
    url: https://ui.shadcn.com/docs/components-json
quiz:
  - type: single
    question: Was passiert bei `bunx --bun shadcn@latest add button`?
    options:
      - Ein Paket namens button landet in node_modules, und du importierst es von dort.
      - Die CLI schreibt den Quellcode der Button-Komponente nach src/components/ui/button.tsx und installiert fehlende Abhängigkeiten.
      - Die CLI lädt ein fertiges CSS-Stylesheet herunter.
      - Der Button wird nur im Dev-Server angezeigt, nicht im Build.
    answer: 1
    explanation: >
      Das ist der Kern von shadcn/ui: Du bekommst den Code, nicht ein Paket. Die Datei gehört ab dann zu deinem
      Projekt, liegt im Repository und darf verändert werden.
  - type: multiple
    question: Welche Aussagen über components.json stimmen?
    options:
      - Sie sagt der CLI, wo deine CSS-Datei liegt und welche Import-Aliase gelten.
      - Sie enthält den Code aller Komponenten.
      - "`style`, `baseColor` und `cssVariables` lassen sich nach init nicht einfach umstellen."
      - Sie wird beim Build in die App eingebaut.
    answers: [0, 2]
    explanation: >
      components.json ist nur Konfiguration für die CLI. Sie landet nicht in deinem Bundle. Einige Felder gelten ab
      init fest – wer sie ändern will, muss die Komponenten neu hinzufügen.
  - type: match
    question: Ordne jeder Datei zu, wer sie anlegt oder ändert.
    pairs:
      - { left: "components.json", right: "shadcn init – Konfiguration für die CLI" }
      - { left: "src/lib/utils.ts", right: "shadcn init – enthält die Funktion cn()" }
      - { left: "src/components/ui/button.tsx", right: "shadcn add button – Quellcode der Komponente" }
      - { left: "src/index.css", right: "shadcn init – bekommt die Theme-Variablen" }
    explanation: init richtet das Projekt einmal ein, add holt danach einzelne Komponenten.
  - type: single
    question: Du hast button.tsx angepasst. Ein Kollege führt `shadcn add button` erneut aus. Was passiert ohne weitere Optionen?
    options:
      - Deine Änderungen werden stillschweigend überschrieben.
      - Die CLI überschreibt vorhandene Dateien nicht ohne Weiteres; mit `--diff` kannst du dir den Unterschied zur Registry ansehen.
      - Die CLI löscht die Datei.
    answer: 1
    explanation: Überschreiben passiert nur mit `-o`/`--overwrite` (oder nach Rückfrage). Mit `add --diff` vergleichst du deinen Stand mit der aktuellen Version der Registry und übernimmst Neuerungen bewusst.
tasks:
  - id: shadcn-cli
    type: simulated
    title: shadcn/ui in ein Vite-Projekt holen
    description: |
      Das Projekt `app` hat schon Tailwind CSS 4 und den Alias `@` (wie in Modul 1). Die CLI von shadcn/ui lädt
      Komponenten aus dem Internet – deshalb übst du sie hier im simulierten Terminal.

      1. Richte shadcn/ui mit `bunx --bun shadcn@latest init` ein.
      2. Füge die Komponenten `button` und `card` mit **einem** Befehl hinzu.
      3. Schau mit `ls src/components/ui` nach, was angelegt wurde.
      4. Zeige mit `cat components.json` die Konfiguration an.
    prompt: "du@laptop:~/app$"
    steps:
      - expect: "^bunx\\s+(--bun\\s+)?shadcn@latest\\s+init(\\s+.*)?$"
        output: |
          ✔ Preflight checks.
          ✔ Verifying framework. Found Vite.
          ✔ Validating Tailwind CSS config. Found v4.
          ✔ Validating import alias.
          ✔ Writing components.json.
          ✔ Checking registry.
          ✔ Updating CSS variables in src/index.css
          ✔ Installing dependencies.
          ✔ Created 1 file:
            - src/lib/utils.ts

          Success! Project initialization completed.
          You may now add components.
        hint: "Der Befehl lautet bunx --bun shadcn@latest init"
      - expect: "^bunx\\s+(--bun\\s+)?shadcn@latest\\s+add\\s+(button\\s+card|card\\s+button)$"
        output: |
          ✔ Checking registry.
          ✔ Installing dependencies.
          ✔ Created 2 files:
            - src/components/ui/button.tsx
            - src/components/ui/card.tsx
        hint: "add nimmt mehrere Namen: bunx --bun shadcn@latest add button card"
      - expect: "^ls\\s+(\\./)?src/components/ui/?$"
        output: "button.tsx  card.tsx"
        hint: ls src/components/ui
      - expect: "^cat\\s+components\\.json$"
        output: |
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
        hint: cat components.json
    responses:
      - match: "^npm\\s+install\\s+shadcn"
        output: "Das brauchst du nicht: shadcn ist kein Paket für node_modules, sondern eine CLI. Nutze bunx --bun shadcn@latest …"
      - match: "^ls(\\s+-la?)?$"
        output: "bun.lock  components.json  index.html  node_modules  package.json  public  src  tsconfig.app.json  tsconfig.json  tsconfig.node.json  vite.config.ts"
  - id: shadcn-dateien
    type: dragdrop
    title: Abhängigkeit oder eigener Code?
    description: Ordne jedes Teil zu – liegt es als Paket in node_modules, oder ist es Code in deinem Projekt, den du selbst pflegst?
    targets:
      - { id: paket, label: Paket in node_modules }
      - { id: eigen, label: Eigener Code im Repository }
    items:
      - { label: "src/components/ui/button.tsx", target: eigen }
      - { label: "src/lib/utils.ts mit cn()", target: eigen }
      - { label: "Theme-Variablen in src/index.css", target: eigen }
      - { label: "class-variance-authority (cva)", target: paket }
      - { label: "tailwind-merge und clsx", target: paket }
      - { label: "radix-ui (Primitive für Verhalten und Barrierefreiheit)", target: paket }
    hints:
      - Alles, was die CLI als Datei schreibt, gehört dir. Was sie installiert, bleibt eine Abhängigkeit.
---
Jede App braucht Buttons, Dialoge, Menüs und Formularfelder. Selbst gebaut kosten sie viel Zeit – vor allem die
unsichtbaren Teile: Tastaturbedienung, Fokus, Screenreader. Eine klassische Komponentenbibliothek nimmt dir das
ab, sperrt dich aber in ihr Design und ihre API ein. shadcn/ui geht einen dritten Weg.

## Code statt Paket

Eine klassische [[komponentenbibliothek|Komponentenbibliothek]] installierst du als Paket und importierst die
Komponenten aus `node_modules`. Willst du etwas ändern, bist du auf die Optionen angewiesen, die das Paket anbietet.

[[shadcn-ui|shadcn/ui]] dreht das um: Es ist eine Sammlung von Komponenten-Quellcode. Eine CLI **kopiert** den
Code der Komponenten, die du brauchst, in dein Projekt.

| | Klassische Bibliothek | shadcn/ui |
|---|---|---|
| Wo liegt der Code? | in `node_modules` | in `src/components/ui` |
| Anpassen | über Props und Theme-Optionen | direkt im Code |
| Updates | Paket-Version erhöhen | bewusst übernehmen (`add --diff`) |
| Unbenutzte Komponenten | sind trotzdem installiert | gibt es gar nicht |

> [!MERKSATZ]
> shadcn/ui ist kein Paket, das du importierst, sondern Code, den du **besitzt**. Nach `add` ist die Komponente
> ein normaler Teil deines Projekts.

## Was unter der Haube steckt

Eine shadcn-Komponente ist kein Hexenwerk, sondern eine Kombination aus bekannten Bausteinen:

- **Tailwind-Klassen** für das Aussehen,
- **[[cva|cva]]** (class-variance-authority) für Varianten wie `variant="outline"` oder `size="sm"`,
- **[[cn-funktion|cn()]]** aus `src/lib/utils.ts` zum Zusammenführen von Klassen,
- **[[radix-ui|Radix UI]]** (oder wahlweise Base UI) für das Verhalten komplexer Komponenten: Ein Dialog fängt den
  Fokus ein, ein Menü reagiert auf Pfeiltasten. Diese Primitive sind
  [[headless-komponente|headless]] – sie liefern Verhalten und Barrierefreiheit, aber kein Aussehen.

Die Muster dahinter (cva, `cn()`, `asChild`, `data-slot`) behandelt der Kurs zur Komponenten-Architektur ausführlich.
Hier geht es darum, wie sie in deinem Projekt landen.

## Einrichten mit init

shadcn/ui setzt voraus, was du in Modul 1 gebaut hast: Vite, Tailwind CSS 4 und den Alias `@`. Dann reicht:

```bash title="Terminal"
bunx --bun shadcn@latest init
```

`--bun` sorgt dafür, dass die CLI mit Bun statt mit Node.js läuft. Die CLI fragt nach einigen Einstellungen und
erledigt dann:

1. Sie schreibt [[components-json|components.json]] mit deinen Pfaden und Aliasen.
2. Sie installiert Hilfspakete wie `clsx`, `tailwind-merge` und `class-variance-authority`.
3. Sie legt `src/lib/utils.ts` mit der Funktion `cn()` an.
4. Sie ergänzt `src/index.css` um Theme-Variablen für Farben und Radius.

Für ganz neue Projekte gibt es auch `bunx --bun shadcn@latest init -t vite` – das erzeugt das Vite-Projekt gleich mit.

> [!FEHLER]
> **Alias vergessen.** Ohne `paths` in der `tsconfig.json` bricht `init` mit dem Hinweis ab, dass kein Import-Alias
> gefunden wurde. Richte zuerst Tailwind und den Alias ein, dann shadcn/ui.

## Komponenten holen mit add

```bash title="Terminal"
bunx --bun shadcn@latest add button card dialog
```

Die Dateien landen in `src/components/ui`. Du benutzt sie wie jede eigene Komponente:

```tsx title="src/App.tsx"
import { Button } from '@/components/ui/button'

export default function App() {
  return <Button variant="outline">Speichern</Button>
}
```

Ein paar nützliche Optionen: `add --dry-run` zeigt, was passieren würde; `add --diff button` vergleicht deine
Datei mit der aktuellen Version in der [[registry|Registry]]; `-o` überschreibt bestehende Dateien. Alle Befehle
beschreibt die [CLI-Dokumentation](https://ui.shadcn.com/docs/cli).

> [!PRAXIS]
> In Teams gilt oft die Regel: shadcn/ui ist die **einzige** Komponentenbibliothek. Neue Bausteine kommen per CLI
> nach `src/components/ui`, fachliche Komponenten (z. B. `BookCard`) bauen darauf auf und liegen woanders. So
> bleibt das Design einheitlich, und niemand installiert eine zweite Bibliothek.

## Zusammenfassung

- shadcn/ui liefert **Quellcode**, kein Paket – die Komponenten gehören dir.
- Die Komponenten kombinieren Tailwind, cva, `cn()` und headless Primitive wie Radix UI.
- `shadcn init` schreibt components.json, `src/lib/utils.ts` und die Theme-Variablen.
- `shadcn add <name>` kopiert Komponenten nach `src/components/ui`.
- Voraussetzung sind Tailwind CSS 4 und der Alias `@`.
- Updates übernimmst du bewusst, z. B. nach einem Blick mit `add --diff`.
