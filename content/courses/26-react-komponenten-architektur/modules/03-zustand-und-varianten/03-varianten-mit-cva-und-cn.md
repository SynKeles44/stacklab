---
title: Varianten mit cva und cn()
summary: Wie du Klassen mit clsx bedingt zusammensetzt, Tailwind-Konflikte mit tailwind-merge auflöst und Varianten wie primary oder ghost mit cva deklarierst.
duration: 25
sources:
  - title: cva – Dokumentation
    url: https://cva.style/docs
  - title: tailwind-merge – README
    url: https://github.com/dcastil/tailwind-merge
  - title: clsx – README
    url: https://github.com/lukeed/clsx
  - title: shadcn/ui – Manual Installation (utils.ts mit cn)
    url: https://ui.shadcn.com/docs/installation/manual
quiz:
  - type: match
    question: Ordne jedem Aufruf sein Ergebnis zu.
    pairs:
      - { left: "clsx('btn', false && 'aktiv')", right: "btn" }
      - { left: "clsx('btn', { aktiv: true })", right: "btn aktiv" }
      - { left: "twMerge('px-4 py-2', 'px-2')", right: "py-2 px-2" }
    explanation: >
      clsx wirft falsche Werte heraus und nimmt Objekt-Schlüssel mit wahrem Wert auf. twMerge erkennt, dass `px-4`
      und `px-2` dieselbe Eigenschaft setzen, und behält nur die letzte.
  - type: single
    question: Warum reicht `clsx` allein für Tailwind-Klassen nicht aus?
    options:
      - clsx kann keine Arrays verarbeiten.
      - "Bei `clsx('px-4', 'px-2')` landen beide Klassen im Element. Welche gewinnt, entscheidet die Reihenfolge im CSS – nicht die im Attribut."
      - clsx funktioniert nur mit CSS-Modulen.
    answer: 1
    explanation: >
      Im Attribut `class` ist die Reihenfolge egal. Es gewinnt die Regel, die im Stylesheet später steht. tailwind-merge
      entfernt die überholte Klasse, damit das Ergebnis vorhersehbar ist.
  - type: cloze
    text: "In `cva` legt `___Variants` fest, welche Variante gilt, wenn der Aufrufer nichts angibt. Mit `___Variants` vergibst du Klassen für eine Kombination, etwa ghost + sm."
    blanks:
      - [default]
      - [compound]
    explanation: defaultVariants liefert Standardwerte, compoundVariants Klassen für bestimmte Kombinationen mehrerer Varianten.
  - type: multiple
    question: Welche Vorteile hat es, `buttonVariants` zusätzlich zur Komponente `Button` zu exportieren?
    options:
      - "Ein Link kann `className={buttonVariants({ variant: 'ghost' })}` nutzen und sieht aus wie ein Button."
      - Mit `VariantProps<typeof buttonVariants>` leitest du die Prop-Typen automatisch ab.
      - Die Komponente rendert dadurch schneller.
      - Alle Varianten stehen an einer Stelle und sind leicht zu überblicken.
    answers: [0, 1, 3]
    explanation: Die Varianten-Funktion ist reines JavaScript ohne React. Sie lässt sich überall wiederverwenden, und TypeScript liest die erlaubten Werte direkt aus ihr ab.
tasks:
  - id: cn-und-cva
    type: terminal
    title: cn() und buttonVariants anlegen
    description: |
      Im Ordner `varianten` liegt ein leeres Projekt mit einer `package.json`. Richte dort die beiden
      Hilfsmittel ein, die shadcn/ui in jedem Projekt nutzt.

      1. Installiere die Pakete: `npm install clsx tailwind-merge class-variance-authority`.
      2. Lege `src/lib/cn.js` an. Sie exportiert `cn(...inputs)`, die `twMerge(clsx(inputs))` zurückgibt.
      3. Lege `src/components/atoms/button-variants.js` an. Sie exportiert `buttonVariants`, erstellt mit `cva`:
         - Basis: `inline-flex items-center rounded-md font-medium`
         - `variant`: `primary` → `bg-blue-600 text-white`, `ghost` → `bg-transparent hover:bg-gray-100`,
           `destructive` → `bg-red-600 text-white`
         - `size`: `sm` → `h-8 px-3 text-sm`, `md` → `h-10 px-4`
         - Standard: `primary` und `md`
      4. Probiere beides aus, z. B. mit
         `node --input-type=module -e 'import { cn } from "./src/lib/cn.js"; console.log(cn("px-4", "px-2"))'`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: varianten
    setup: |
      cat > package.json <<'EOF'
      {
        "name": "varianten",
        "private": true,
        "type": "module"
      }
      EOF
    checks:
      - type: dir_exists
        path: node_modules/tailwind-merge
        message: tailwind-merge ist noch nicht installiert. Führe npm install clsx tailwind-merge class-variance-authority aus.
      - type: dir_exists
        path: node_modules/class-variance-authority
        message: class-variance-authority ist noch nicht installiert.
      - type: file_exists
        path: src/lib/cn.js
        message: Die Datei src/lib/cn.js fehlt noch.
      - type: command
        run: |
          node --input-type=module -e 'import { cn } from "./src/lib/cn.js"; console.log(cn("px-4 py-2", false, { "opacity-50": true }, "px-2"))'
        stdout_matches: "^py-2 opacity-50 px-2\\s*$"
        message: "cn() liefert noch nicht das erwartete Ergebnis. Sie soll clsx und twMerge kombinieren: return twMerge(clsx(inputs))."
      - type: file_contains
        path: src/components/atoms/button-variants.js
        pattern: "from ['\"]class-variance-authority['\"]"
        message: button-variants.js soll cva aus 'class-variance-authority' importieren.
      - type: command
        run: |
          node --input-type=module -e 'import { buttonVariants } from "./src/components/atoms/button-variants.js"; console.log(buttonVariants())'
        stdout_matches: "inline-flex items-center rounded-md font-medium bg-blue-600 text-white h-10 px-4"
        message: Ohne Angaben soll buttonVariants() die Basisklassen plus primary und md liefern – prüfe defaultVariants.
      - type: command
        run: |
          node --input-type=module -e 'import { buttonVariants } from "./src/components/atoms/button-variants.js"; console.log(buttonVariants({ variant: "destructive", size: "sm" }))'
        stdout_matches: "^inline-flex items-center rounded-md font-medium bg-red-600 text-white h-8 px-3 text-sm\\s*$"
        message: buttonVariants({ variant 'destructive', size 'sm' }) liefert noch nicht die erwarteten Klassen.
      - type: command
        run: |
          node --input-type=module -e 'import { buttonVariants } from "./src/components/atoms/button-variants.js"; console.log(buttonVariants({ variant: "ghost" }))'
        stdout_matches: "bg-transparent hover:bg-gray-100"
        message: Die Variante ghost fehlt noch oder hat andere Klassen.
    hints:
      - "Die Datei `cn.js` hat nur fünf Zeilen: zwei Importe (`clsx` aus 'clsx', `twMerge` aus 'tailwind-merge') und die Funktion."
      - "Grundgerüst: `export const buttonVariants = cva('basis …', { variants: { variant: { … }, size: { … } }, defaultVariants: { variant: 'primary', size: 'md' } })`."
      - "Dateien schreibst du am schnellsten mit `nano` oder mit `cat > datei <<'EOF'` … `EOF`. Vergiss `mkdir -p src/lib src/components/atoms` nicht."
    solution: |
      ```bash
      cd varianten
      npm install clsx tailwind-merge class-variance-authority
      mkdir -p src/lib src/components/atoms
      cat > src/lib/cn.js <<'EOF'
      import { clsx } from 'clsx'
      import { twMerge } from 'tailwind-merge'

      export function cn(...inputs) {
        return twMerge(clsx(inputs))
      }
      EOF
      cat > src/components/atoms/button-variants.js <<'EOF'
      import { cva } from 'class-variance-authority'

      export const buttonVariants = cva('inline-flex items-center rounded-md font-medium', {
        variants: {
          variant: {
            primary: 'bg-blue-600 text-white',
            ghost: 'bg-transparent hover:bg-gray-100',
            destructive: 'bg-red-600 text-white',
          },
          size: {
            sm: 'h-8 px-3 text-sm',
            md: 'h-10 px-4',
          },
        },
        defaultVariants: { variant: 'primary', size: 'md' },
      })
      EOF
      ```
  - id: mini-cva
    type: code
    language: ts
    title: Ein Mini-cva selbst bauen
    description: |
      Um zu verstehen, was `cva` tut, baust du eine kleine Version nach.

      `varianten(basis, config)` gibt eine Funktion zurück. Diese Funktion bekommt ein Objekt mit den
      gewählten Varianten (darf fehlen) und liefert einen Klassen-String:

      1. Zuerst kommt `basis`.
      2. Dann für jeden Schlüssel in `config.variants` die Klassen des gewählten Werts – fehlt die Angabe,
         der Wert aus `config.defaultVariants`. Gibt es keinen Wert, wird der Schlüssel übersprungen.
      3. Zuletzt eine übergebene `className`.
      4. Alle Teile werden mit genau einem Leerzeichen verbunden.
    starter: |
      type Config = {
        variants: Record<string, Record<string, string>>
        defaultVariants?: Record<string, string>
      }

      function varianten(basis: string, config: Config) {
        return (auswahl: Record<string, string | undefined> = {}) => {
          return basis
        }
      }

      const badge = varianten('badge', {
        variants: {
          tone: { neutral: 'bg-gray', erfolg: 'bg-green', fehler: 'bg-red' },
          size: { sm: 'text-xs', md: 'text-sm' },
        },
        defaultVariants: { tone: 'neutral', size: 'md' },
      })
    tests:
      - name: Standardvarianten greifen
        code: |
          assertEqual(badge(), 'badge bg-gray text-sm')
      - name: gewählte Varianten ersetzen die Standardwerte
        code: |
          assertEqual(badge({ tone: 'fehler', size: 'sm' }), 'badge bg-red text-xs')
      - name: className kommt ans Ende
        code: |
          assertEqual(badge({ tone: 'erfolg', className: 'ml-2' }), 'badge bg-green text-sm ml-2')
      - name: ohne Standardwert wird ein Schlüssel übersprungen
        code: |
          const knopf = varianten('knopf', { variants: { size: { sm: 'klein' } } })
          assertEqual(knopf(), 'knopf')
          assertEqual(knopf({ size: 'sm' }), 'knopf klein')
    hints:
      - "Sammle die Teile in einem Array: `const teile = [basis]`."
      - "Schleife: `for (const [name, werte] of Object.entries(config.variants)) { const wahl = auswahl[name] ?? config.defaultVariants?.[name]; … }`."
      - "Am Ende: `if (auswahl.className) teile.push(auswahl.className)` und `return teile.join(' ')`."
    solution: |
      type Config = {
        variants: Record<string, Record<string, string>>
        defaultVariants?: Record<string, string>
      }

      function varianten(basis: string, config: Config) {
        return (auswahl: Record<string, string | undefined> = {}) => {
          const teile = [basis]
          for (const [name, werte] of Object.entries(config.variants)) {
            const wahl = auswahl[name] ?? config.defaultVariants?.[name]
            if (wahl !== undefined && werte[wahl]) teile.push(werte[wahl])
          }
          if (auswahl.className) teile.push(auswahl.className)
          return teile.join(' ')
        }
      }

      const badge = varianten('badge', {
        variants: {
          tone: { neutral: 'bg-gray', erfolg: 'bg-green', fehler: 'bg-red' },
          size: { sm: 'text-xs', md: 'text-sm' },
        },
        defaultVariants: { tone: 'neutral', size: 'md' },
      })
---
Dein Button hat inzwischen drei Varianten und zwei Größen. Die Klassen setzt du mit verschachtelten
Ternären zusammen, und wenn jemand `className="px-2"` übergibt, ist der Button trotzdem breit. Für beide
Probleme gibt es kleine, bewährte Werkzeuge, die du in fast jedem shadcn/ui-Projekt findest.

## Klassen bedingt zusammensetzen: clsx

Ohne Hilfsmittel wird das Zusammensetzen schnell unlesbar:

```tsx
className={'btn ' + (variant === 'ghost' ? 'bg-transparent ' : 'bg-blue-600 ') + (disabled ? 'opacity-50 ' : '') + (className ?? '')}
```

Das Paket [[clsx]] nimmt beliebig viele Argumente und baut daraus einen Klassen-String:

```js
clsx('btn', disabled && 'opacity-50', { 'w-full': breit }, className)
// disabled=false, breit=true, className=undefined → "btn w-full"
```

| Argument | Wirkung |
|---|---|
| String | wird übernommen |
| `false`, `null`, `undefined`, `''` | wird ignoriert |
| Objekt `{ klasse: bedingung }` | Klasse nur, wenn die Bedingung wahr ist |
| Array | wird ausgepackt |

Das ersetzt das `filter(Boolean).join(' ')` aus Modul 1 – mit mehr Möglichkeiten.

## Konflikte auflösen: tailwind-merge

Ein Problem bleibt: `clsx('px-4', 'px-2')` ergibt `"px-4 px-2"`. Welche Klasse gewinnt? Nicht die
letzte im Attribut, sondern die, deren Regel im [[css|CSS]] später steht. Das ist für dich kaum
vorhersehbar.

[[tailwind-merge]] kennt alle Tailwind-Klassen und entfernt die überholten:

```js
twMerge('px-4 py-2 bg-blue-600', 'px-2 bg-red-600')
// → "py-2 px-2 bg-red-600"
```

Die beiden kombiniert ergeben die Hilfsfunktion [[cn-funktion|cn()]], die shadcn/ui in jedem Projekt
unter `lib/utils.ts` anlegt:

```ts title="lib/cn.ts"
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

> [!MERKSATZ]
> `cn()` = **clsx** (bedingt zusammensetzen) + **tailwind-merge** (Konflikte auflösen). Die übergebene
> `className` steht immer zuletzt, damit der Aufrufer gewinnt.

## Varianten deklarieren: cva

Für die Varianten selbst gibt es [[cva]] (class-variance-authority). Statt Bedingungen schreibst du eine
Tabelle aus Varianten und Klassen:

```ts title="button-variants.ts"
import { cva } from 'class-variance-authority'

export const buttonVariants = cva('inline-flex items-center rounded-md font-medium', {
  variants: {
    variant: {
      primary: 'bg-blue-600 text-white',
      ghost: 'bg-transparent hover:bg-gray-100',
    },
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4',
    },
  },
  compoundVariants: [{ variant: 'ghost', size: 'sm', class: 'px-2' }],
  defaultVariants: { variant: 'primary', size: 'md' },
})

buttonVariants({ variant: 'ghost' }) // Basis + ghost + md
```

| Schlüssel | Bedeutung |
|---|---|
| `variants` | Welche Varianten es gibt und welche Klassen jede Option bekommt |
| `defaultVariants` | Was gilt, wenn der Aufrufer nichts angibt |
| `compoundVariants` | Extra-Klassen für eine **Kombination** von Optionen |

## Alles zusammen im Button

Mit `VariantProps` liest [[typescript|TypeScript]] die erlaubten Werte direkt aus `buttonVariants` ab:

```tsx title="button.tsx"
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/cn'
import { buttonVariants } from './button-variants'

type ButtonProps = React.ComponentProps<'button'> & VariantProps<typeof buttonVariants>

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
```

Schreibt jemand `variant="gost"`, meldet TypeScript sofort einen Fehler. Und weil `buttonVariants`
eine eigene Datei ist, kann auch ein Link das Button-Aussehen nutzen:
`<a className={buttonVariants({ variant: 'ghost' })}>`.

> [!FEHLER]
> **Die `className` des Aufrufers vor die Varianten stellen**, also `cn(className, buttonVariants(…))`. Dann
> überschreiben die Varianten die Wünsche des Aufrufers. Die übergebene Klasse gehört immer ans Ende.

> [!PRAXIS]
> In shadcn/ui-Projekten liegen die Komponenten als Quellcode in deinem Repository. Neue Varianten wie
> `outline` ergänzt du einfach in der `cva`-Tabelle – ohne auf ein Update einer Bibliothek zu warten.

## Varianten klug benennen

Eine `cva`-Tabelle wächst schnell. Damit sie verständlich bleibt, helfen drei Regeln:

1. **Nach Bedeutung benennen, nicht nach Farbe.** `destructive` statt `red`: Ändert sich die Markenfarbe, bleibt
   der Name richtig. So bilden die Varianten das Design-System ab, nicht einzelne [[tailwind-css|Tailwind]]-Klassen.
2. **Wenige, klare Achsen.** `variant` (Aussehen) und `size` (Größe) reichen meist. Eine dritte Achse wie
   `rounded` ist oft ein Zeichen, dass jemand einen Sonderfall über eine Variante lösen will – dafür gibt
   es `className`.
3. **Kombinationen bewusst regeln.** Sieht `ghost` in `sm` seltsam aus, ergänzt du einen Eintrag in
   `compoundVariants`, statt eine neue Variante `ghostSmall` zu erfinden.

| Gut | Schlecht | Warum |
|---|---|---|
| `variant: 'destructive'` | `variant: 'red'` | beschreibt die Absicht |
| `size: 'sm'` | `small: true` | eine Achse statt vieler Booleans |
| `className="w-full"` | `variant: 'fullWidth'` | Layout ist Sache des Aufrufers |

## Zusammenfassung

- **clsx** setzt Klassen aus Strings, Bedingungen, Objekten und Arrays zusammen.
- **tailwind-merge** entfernt widersprüchliche Tailwind-Klassen – die letzte gewinnt.
- **cn()** kombiniert beides und ist die Standard-Hilfsfunktion für `className`.
- **cva** beschreibt Varianten als Tabelle mit `variants`, `defaultVariants` und `compoundVariants`.
- `VariantProps<typeof buttonVariants>` leitet die Prop-Typen automatisch ab.
- Die `className` des Aufrufers steht in `cn()` immer zuletzt.
