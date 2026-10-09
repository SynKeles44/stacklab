---
title: Varianten, beliebige Werte und das Theme
summary: "Zustände, Breakpoints und Dark Mode mit hover:, md: und dark:, beliebige Werte in eckigen Klammern, eigene Design-Tokens mit @theme und warum du @apply sparsam einsetzt."
duration: 25
sources:
  - title: Tailwind CSS – Hover, focus, and other states
    url: https://tailwindcss.com/docs/hover-focus-and-other-states
  - title: Tailwind CSS – Responsive design
    url: https://tailwindcss.com/docs/responsive-design
  - title: Tailwind CSS – Dark mode
    url: https://tailwindcss.com/docs/dark-mode
  - title: Tailwind CSS – Theme variables
    url: https://tailwindcss.com/docs/theme
  - title: Tailwind CSS – Functions and directives
    url: https://tailwindcss.com/docs/functions-and-directives
quiz:
  - type: single
    question: "Was bewirkt `class=\"grid grid-cols-1 md:grid-cols-3\"`?"
    options:
      - Auf kleinen Bildschirmen drei Spalten, ab md eine Spalte
      - Immer drei Spalten
      - Eine Spalte, ab der Breite md (48rem) drei Spalten
      - Nur auf mittelgroßen Bildschirmen drei Spalten, darüber wieder eine
    answer: 2
    explanation: >-
      Tailwind arbeitet Mobile First. Klassen ohne Präfix gelten immer, md: ergänzt eine min-width-Media-Query ab 48rem – und gilt damit auch für alle größeren Breiten.
  - type: match
    question: Ordne jede Variante der CSS-Bedingung zu, die Tailwind daraus macht.
    pairs:
      - { left: "hover:", right: "Maus über dem Element" }
      - { left: "focus-visible:", right: "Fokus per Tastatur" }
      - { left: "md:", right: "@media (width >= 48rem)" }
      - { left: "dark:", right: "@media (prefers-color-scheme: dark)" }
      - { left: "disabled:", right: "Deaktiviertes Formularelement" }
    explanation: >-
      Varianten sind Präfixe, die eine Utility nur unter einer Bedingung anwenden. dark: nutzt standardmäßig die Systemeinstellung.
  - type: cloze
    text: "Mit `@___ { --color-marke: #e11d48; }` legst du eine eigene Farbe an. Danach gibt es Klassen wie `bg-___` und `text-marke`."
    blanks:
      - [theme]
      - [marke]
    explanation: >-
      Variablen im Namensraum --color-* erzeugen Farb-Utilities wie bg-marke, text-marke oder border-marke.
  - type: find-bug
    question: Der Abstand soll exakt 13px betragen, Tailwind erzeugt aber keine Regel. Welche Zeile ist falsch?
    language: html
    code: |
      <section class="grid gap-4 md:grid-cols-2">
        <article class="p-[13 px] rounded-lg">
          Inhalt
        </article>
      </section>
    bug_line: 2
    explanation: "In beliebigen Werten sind Leerzeichen nicht erlaubt, weil sie Klassen trennen. Richtig ist `p-[13px]` (oder bei mehreren Werten `_` statt Leerzeichen)."
tasks:
  - id: klassen-zuordnen
    type: dragdrop
    title: Welche Klasse brauchst du?
    description: Ordne jede Anforderung der Tailwind-Klasse zu, die sie erfüllt.
    targets:
      - { id: hover, label: "hover:bg-rose-700" }
      - { id: md, label: "md:flex-row" }
      - { id: dark, label: "dark:bg-slate-900" }
      - { id: arbitrary, label: "max-w-[42rem]" }
      - { id: focus, label: "focus-visible:outline-2" }
      - { id: theme, label: "text-marke" }
    items:
      - { label: "Button wird beim Drüberfahren dunkler", target: hover }
      - { label: "Ab Tablet-Breite nebeneinander statt untereinander", target: md }
      - { label: "Dunkler Hintergrund im Dunkelmodus des Systems", target: dark }
      - { label: "Ein Wert, den es in der Skala nicht gibt", target: arbitrary }
      - { label: "Sichtbarer Rahmen bei Tastaturfokus", target: focus }
      - { label: "Textfarbe aus einem eigenen @theme-Token", target: theme }
    hints:
      - Alles mit Doppelpunkt ist eine Variante, alles mit eckigen Klammern ein beliebiger Wert.
  - id: tailwind-karte
    type: terminal
    title: Eine responsive Karte mit eigenem Theme
    description: |
      Im Ordner `tailwind-karte` ist Tailwind schon installiert, und `input.css` enthält `@import "tailwindcss";`.

      1. Ergänze in `input.css` einen `@theme`-Block mit der Farbe `--color-marke` (z. B. `#e11d48`).
      2. Schreibe `index.html` (bindet `output.css` ein) mit einer Karte, die diese Klassen benutzt:
         - `bg-marke` für einen Button,
         - `hover:bg-rose-700` für den Hover-Zustand des Buttons,
         - `focus-visible:outline-2` für den Tastaturfokus,
         - `md:flex-row` (zusammen mit `flex flex-col`) für das Layout,
         - `dark:bg-slate-900` für den Dunkelmodus,
         - einen beliebigen Wert: `max-w-[42rem]`.
      3. Baue mit `npx @tailwindcss/cli -i input.css -o output.css`.

      Klicke zuerst auf **Aufgabe vorbereiten** – die Installation dauert ein paar Sekunden.
    workdir: tailwind-karte
    setup: |
      npm init -y > /dev/null
      npm install -D --no-audit --no-fund --silent tailwindcss @tailwindcss/cli
      printf '@import "tailwindcss";\n' > input.css
    checks:
      - type: file_contains
        path: input.css
        pattern: "@theme\\s*\\{[^}]*--color-marke\\s*:\\s*[^;}]+"
        message: "In input.css fehlt ein @theme-Block mit --color-marke."
      - type: file_contains
        path: index.html
        pattern: "<link[^>]*href=\"(\\./)?output\\.css\""
        message: index.html soll output.css einbinden.
      - type: file_exists
        path: output.css
        message: output.css fehlt. Baue sie mit `npx @tailwindcss/cli -i input.css -o output.css`.
      - type: file_contains
        path: output.css
        pattern: "\\.bg-marke\\s*\\{[^}]*var\\(--color-marke\\)"
        message: In output.css fehlt die Klasse .bg-marke. Benutze sie im HTML, prüfe den @theme-Block und baue neu.
      - type: file_contains
        path: output.css
        pattern: "\\.hover\\\\:bg-rose-700"
        message: In output.css fehlt hover:bg-rose-700.
      - type: file_contains
        path: output.css
        pattern: "\\.focus-visible\\\\:outline-2"
        message: In output.css fehlt focus-visible:outline-2.
      - type: file_contains
        path: output.css
        pattern: "\\.md\\\\:flex-row"
        message: In output.css fehlt md:flex-row.
      - type: file_contains
        path: output.css
        pattern: "\\.dark\\\\:bg-slate-900"
        message: In output.css fehlt dark:bg-slate-900.
      - type: file_contains
        path: output.css
        pattern: "\\.max-w-\\\\\\[42rem\\\\\\]"
        message: "In output.css fehlt der beliebige Wert max-w-[42rem]."
      - type: file_contains
        path: output.css
        pattern: "prefers-color-scheme:\\s*dark"
        message: Die dark:-Klasse sollte eine Media Query mit prefers-color-scheme erzeugen. Baue nach dem Ändern neu.
    hints:
      - "Der Theme-Block: `@theme { --color-marke: #e11d48; }` direkt unter `@import \"tailwindcss\";`."
      - "Ein Button könnte so aussehen: `<button class=\"bg-marke hover:bg-rose-700 focus-visible:outline-2 text-white px-4 py-2 rounded-lg\">Los</button>`."
      - Fehlt eine Klasse in output.css, hast du nach dem letzten Ändern nicht neu gebaut – oder dich vertippt.
    solution: |
      ```bash
      cd tailwind-karte
      cat > input.css <<'EOF'
      @import "tailwindcss";

      @theme {
        --color-marke: #e11d48;
      }
      EOF
      cat > index.html <<'EOF'
      <!DOCTYPE html>
      <html lang="de">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Karte</title>
          <link rel="stylesheet" href="output.css">
        </head>
        <body class="bg-slate-100 p-8 dark:bg-slate-900">
          <article class="max-w-[42rem] mx-auto flex flex-col md:flex-row gap-4 rounded-xl bg-white p-6 shadow-lg">
            <h1 class="text-2xl font-bold">Neuer Kurs</h1>
            <button class="bg-marke hover:bg-rose-700 focus-visible:outline-2 text-white px-4 py-2 rounded-lg">
              Jetzt starten
            </button>
          </article>
        </body>
      </html>
      EOF
      npx @tailwindcss/cli -i input.css -o output.css
      ```
---
Ein Button soll beim Drüberfahren dunkler werden, auf dem Handy untereinander und auf dem Laptop nebeneinander
stehen, im Dunkelmodus anders aussehen und eure Markenfarbe tragen. In normalem CSS sind das Pseudoklassen,
Media Queries und Variablen – in Tailwind sind es Präfixe und ein `@theme`-Block.

## Varianten: Zustände

Eine [[tailwind-variante|Variante]] ist ein Präfix vor einer Utility. Die Utility gilt dann nur unter dieser
Bedingung:

```html
<button class="bg-rose-600 hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2
               disabled:opacity-50 text-white px-4 py-2 rounded-lg">
  Speichern
</button>
```

| Variante | Entspricht in CSS |
|---|---|
| `hover:` | `:hover` |
| `focus-visible:` | `:focus-visible` – Fokus per Tastatur |
| `active:` | `:active` – während des Klicks |
| `disabled:` | `:disabled` |
| `first:`, `last:` | `:first-child`, `:last-child` |

Tailwind erzeugt daraus eine Klasse mit maskiertem Doppelpunkt, z. B. `.hover\:bg-rose-700:hover { … }`.
Varianten lassen sich stapeln: `md:hover:underline` gilt nur ab `md` **und** beim Drüberfahren.

> [!TIPP]
> Denk an Barrierefreiheit: Gib jedem eigenen Button einen sichtbaren Fokus mit `focus-visible:`. Entfernst du die
> Browser-Umrandung, ersetze sie immer durch etwas Gleichwertiges.

## Varianten: Breakpoints und Dark Mode

Tailwind arbeitet [[mobile-first|Mobile First]]. Klassen ohne Präfix gelten immer; Breakpoint-Präfixe gelten
**ab** einer Mindestbreite:

```html
<div class="flex flex-col gap-4 md:flex-row lg:gap-8">…</div>
```

| Präfix | Ab Breite |
|---|---|
| `sm:` | 40rem (640px) |
| `md:` | 48rem (768px) |
| `lg:` | 64rem (1024px) |
| `xl:` | 80rem (1280px) |

Gelesen: „Untereinander; ab `md` nebeneinander; ab `lg` mit größerem Abstand.“ Das ist exakt die
`min-width`-Strategie aus Modul 3.

Die Variante `dark:` nutzt standardmäßig `prefers-color-scheme: dark`:

```html
<body class="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
```

Für einen Umschalter per Klasse überschreibst du die Variante in deiner CSS-Datei mit
`@custom-variant dark (&:where(.dark, .dark *));` – dann gilt `dark:`, sobald ein Elternelement die Klasse `dark` trägt.

> [!FEHLER]
> **`sm:` für das Handy.** `sm:text-center` heißt nicht „auf kleinen Bildschirmen“, sondern „**ab** 640px“. Für
> das Handy schreibst du die Klasse ohne Präfix und überschreibst sie für größere Bildschirme.

## Beliebige Werte

Manchmal passt kein Wert aus der Skala – etwa eine exakte Breite aus einem Design. Dafür gibt es
[[arbitrary-value|beliebige Werte]] in eckigen Klammern:

```html
<div class="max-w-[42rem] p-[13px] bg-[#0f766e] grid-cols-[200px_1fr]">…</div>
```

- In den Klammern steht ein normaler CSS-Wert.
- Leerzeichen sind verboten, weil sie Klassen trennen – nimm `_` als Ersatz (`grid-cols-[200px_1fr]`).
- Auch Variablen gehen: `bg-(--farbe-akzent)` liest eine Custom Property.

Nutze beliebige Werte als Ausnahme. Wenn derselbe Wert öfter vorkommt, gehört er ins Theme.

## Eigene Design-Tokens mit @theme

In Tailwind 4 konfigurierst du direkt im CSS. Der Block `@theme` legt [[theme-variable|Theme-Variablen]] an –
und erzeugt dazu passende Utilities:

```css title="input.css"
@import "tailwindcss";

@theme {
  --color-marke: #e11d48;
  --font-display: "Inter", sans-serif;
  --breakpoint-3xl: 120rem;
}
```

| Namensraum | Erzeugt | Beispiel |
|---|---|---|
| `--color-*` | Farb-Utilities | `bg-marke`, `text-marke`, `border-marke` |
| `--font-*` | Schriftfamilien | `font-display` |
| `--breakpoint-*` | Breakpoint-Varianten | `3xl:grid-cols-6` |
| `--spacing` | Basis aller Abstände (Standard 0.25rem) | `p-4` = 4 × spacing |

Theme-Variablen landen außerdem als ganz normale [[custom-property|Custom Properties]] in `:root`. Du kannst sie
überall mit `var(--color-marke)` lesen. Variablen, die **keine** Klassen erzeugen sollen, schreibst du in ein
normales `:root { … }`.

> [!MERKSATZ]
> `@theme` ist die zentrale Stelle für Design-Tokens: Einmal definiert, gibt es sofort Klassen **und** CSS-Variablen.

## @apply – sparsam einsetzen

Mit der [[apply-direktive|Direktive @apply]] packst du Utilities in eine eigene Klasse:

```css
.btn-primary {
  @apply bg-marke text-white px-4 py-2 rounded-lg hover:bg-rose-700;
}
```

Das wirkt verlockend, bringt aber genau die Probleme zurück, die Tailwind löst: Namen erfinden, CSS und HTML
synchron halten, toten Code. Sinnvoll ist `@apply` nur in Ausnahmen – etwa für HTML, das du nicht selbst schreibst
(Markdown-Inhalte aus einem CMS).

> [!PRAXIS]
> In Projekten mit Komponenten wiederverwendest du **Komponenten**, nicht Klassen: Ein `<Button>`-Baustein enthält
> die Klassenliste genau einmal. Bibliotheken wie shadcn/ui arbeiten nach genau diesem Prinzip.

## Zusammenfassung

- Varianten wie `hover:`, `focus-visible:` und `disabled:` wenden Utilities nur in einem Zustand an.
- Breakpoints (`sm:`, `md:`, `lg:`, `xl:`) gelten Mobile First **ab** einer Mindestbreite.
- `dark:` nutzt `prefers-color-scheme`; mit `@custom-variant` wird daraus ein Klassen-Umschalter.
- Beliebige Werte in eckigen Klammern, ohne Leerzeichen – für Ausnahmen.
- `@theme` definiert Design-Tokens, die Utilities und CSS-Variablen erzeugen.
- `@apply` nur sparsam – wiederverwendet werden Komponenten, nicht Klassenbündel.
