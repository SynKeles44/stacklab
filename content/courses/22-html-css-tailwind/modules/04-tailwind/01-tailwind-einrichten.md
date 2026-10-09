---
title: Tailwind CSS einrichten und verstehen
summary: Die Idee hinter Utility-first, die Installation von Tailwind CSS 4 mit dem CLI, der Build-Schritt und die wichtigsten Utility-Klassen.
duration: 25
sources:
  - title: Tailwind CSS – Installation mit dem Tailwind CLI
    url: https://tailwindcss.com/docs/installation/tailwind-cli
  - title: Tailwind CSS – Installation mit Vite
    url: https://tailwindcss.com/docs/installation/using-vite
  - title: Tailwind CSS – Styling with utility classes
    url: https://tailwindcss.com/docs/styling-with-utility-classes
  - title: Tailwind CSS – Detecting classes in source files
    url: https://tailwindcss.com/docs/detecting-classes-in-source-files
quiz:
  - type: single
    question: Was steht in Tailwind CSS 4 in der Eingabe-CSS-Datei, damit Tailwind geladen wird?
    options:
      - "`@tailwind base; @tailwind components; @tailwind utilities;`"
      - "`@import \"tailwindcss\";`"
      - "`require('tailwindcss')`"
      - Nichts – Tailwind braucht zwingend eine tailwind.config.js
    answer: 1
    explanation: >
      Seit Version 4 reicht eine Zeile: `@import "tailwindcss";`. Die drei @tailwind-Direktiven und eine Pflicht-Konfigurationsdatei
      gehören zu Version 3. Konfiguriert wird jetzt direkt im CSS.
  - type: multiple
    question: Welche Aussagen über den Build mit dem Tailwind CLI stimmen?
    options:
      - Tailwind durchsucht deine Dateien nach Klassennamen und erzeugt nur das CSS für die tatsächlich benutzten Klassen.
      - Die Ausgabedatei enthält immer alle Tausende möglichen Klassen.
      - "`--watch` baut automatisch neu, sobald du eine Datei änderst."
      - Im HTML bindest du die Ausgabedatei (z. B. output.css) ein, nicht die Eingabedatei.
    answers: [0, 2, 3]
    explanation: Tailwind erzeugt CSS bedarfsgerecht aus den gefundenen Klassen. Der Browser bekommt die fertige Ausgabedatei.
  - type: match
    question: Ordne jede Utility-Klasse ihrem CSS zu.
    pairs:
      - { left: "p-4", right: "padding: 1rem" }
      - { left: "mt-2", right: "margin-top: 0.5rem" }
      - { left: "text-center", right: "text-align: center" }
      - { left: "font-bold", right: "font-weight: 700" }
      - { left: "flex", right: "display: flex" }
    explanation: "Die Zahlen in Abstands-Klassen sind Vielfache von 0.25rem: p-4 = 4 × 0.25rem = 1rem."
  - type: find-bug
    question: Die Klasse `bg-rose-600` hat keine Wirkung. Was ist falsch an diesem HTML?
    language: html
    code: |
      <!DOCTYPE html>
      <html lang="de">
        <head>
          <meta charset="utf-8">
          <link rel="stylesheet" href="input.css">
        </head>
        <body class="bg-rose-600">Hallo</body>
      </html>
    bug_line: 5
    explanation: "Eingebunden ist die Eingabedatei mit `@import \"tailwindcss\"`. Der Browser braucht die gebaute Datei, z. B. `output.css`."
tasks:
  - id: tailwind-schritte
    type: order
    title: Tailwind mit dem CLI aufsetzen
    description: Bringe die Schritte für ein neues Projekt mit dem Tailwind CLI in die richtige Reihenfolge.
    items:
      - "`npm init -y` legt eine package.json an"
      - "`npm install -D tailwindcss @tailwindcss/cli` installiert Tailwind"
      - "`input.css` mit `@import \"tailwindcss\";` anlegen"
      - "`index.html` mit Utility-Klassen schreiben und `output.css` einbinden"
      - "`npx @tailwindcss/cli -i input.css -o output.css` baut das CSS"
      - Seite im Browser öffnen und das Ergebnis prüfen
    hints:
      - Ohne package.json gibt es kein Projekt, in das npm installieren kann.
  - id: tailwind-start
    type: terminal
    title: Dein erster Tailwind-Build
    description: |
      Richte im leeren Ordner `tailwind-start` ein Tailwind-Projekt ein und baue das CSS.

      1. Lege mit `npm init -y` eine `package.json` an.
      2. Installiere `tailwindcss` und `@tailwindcss/cli` als Entwicklungsabhängigkeiten (`-D`).
      3. Lege `input.css` mit `@import "tailwindcss";` an.
      4. Lege `index.html` an, die `output.css` einbindet und im body eine Karte enthält, die **mindestens** diese Klassen benutzt:
         `max-w-md`, `mx-auto`, `p-6`, `rounded-xl`, `shadow-lg`, `text-3xl`, `font-bold`.
      5. Baue das CSS: `npx @tailwindcss/cli -i input.css -o output.css`.
      6. Schau mit `grep -n "text-3xl" output.css` nach, was Tailwind erzeugt hat.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit der leere Ordner angelegt wird.
    workdir: tailwind-start
    setup: |
      true
    checks:
      - type: command
        run: jq -r '.devDependencies | has("tailwindcss") and has("@tailwindcss/cli")' package.json
        stdout_equals: "true"
        message: In der package.json fehlen tailwindcss und @tailwindcss/cli unter devDependencies. Installiere sie mit `npm install -D …`.
      - type: dir_exists
        path: node_modules/@tailwindcss/cli
        message: Das Paket @tailwindcss/cli ist noch nicht installiert.
      - type: file_contains
        path: input.css
        pattern: "^@import\\s+[\"']tailwindcss[\"'];"
        message: input.css muss mit `@import "tailwindcss";` Tailwind laden.
      - type: file_contains
        path: index.html
        pattern: "<link[^>]*href=\"(\\./)?output\\.css\""
        message: index.html soll die gebaute Datei output.css einbinden.
      - type: file_exists
        path: output.css
        message: output.css fehlt. Baue sie mit `npx @tailwindcss/cli -i input.css -o output.css`.
      - type: command
        run: for c in max-w-md mx-auto p-6 rounded-xl shadow-lg text-3xl font-bold; do grep -q "\.$c\s*{" output.css || echo "$c"; done
        stdout_equals: ""
        message: In output.css fehlen Klassen. Benutze alle geforderten Klassen in index.html und baue danach neu.
    hints:
      - "Die Installation: `npm install -D tailwindcss @tailwindcss/cli` – das kann ein paar Sekunden dauern."
      - "`printf '@import \"tailwindcss\";\\n' > input.css` legt die Eingabedatei an."
      - Wenn eine Klasse in output.css fehlt, hast du sie im HTML vertippt oder nach dem Ändern nicht neu gebaut.
    solution: |
      ```bash
      cd tailwind-start
      npm init -y
      npm install -D tailwindcss @tailwindcss/cli
      printf '@import "tailwindcss";\n' > input.css
      cat > index.html <<'EOF'
      <!DOCTYPE html>
      <html lang="de">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Tailwind</title>
          <link rel="stylesheet" href="output.css">
        </head>
        <body class="bg-slate-100 p-8">
          <article class="max-w-md mx-auto p-6 rounded-xl shadow-lg bg-white">
            <h1 class="text-3xl font-bold">Hallo Tailwind</h1>
            <p class="mt-2 text-slate-600">Gebaut mit dem Tailwind CLI.</p>
          </article>
        </body>
      </html>
      EOF
      npx @tailwindcss/cli -i input.css -o output.css
      grep -n "text-3xl" output.css
      ```
---
Du hast gelernt, Klassen zu erfinden, Selektoren zu schreiben und Spezifitätskonflikte zu lösen. Tailwind
dreht den Ablauf um: Statt eigene Klassen wie `.karte` mit CSS zu füllen, setzt du fertige, winzige Klassen
direkt ins HTML. Das klingt erst falsch – und ist trotzdem der Weg, auf dem heute sehr viele Teams Oberflächen bauen.

## Die Idee: Utility-first

[[tailwind-css|Tailwind CSS]] ist ein CSS-[[framework|Framework]] aus [[utility-klasse|Utility-Klassen]]: Jede
Klasse macht genau **eine** Sache.

```html title="Klassisches CSS"
<article class="karte">…</article>
<style>
  .karte { padding: 1.5rem; border-radius: 0.75rem; box-shadow: …; }
</style>
```

```html title="Tailwind"
<article class="p-6 rounded-xl shadow-lg">…</article>
```

| Vorteil | Warum? |
|---|---|
| Kein Namen-Erfinden | Du überlegst nicht, ob es `.karte`, `.card` oder `.box-wrapper` heißt. |
| Kein toter Code | Löschst du HTML, verschwindet auch sein Styling. |
| Keine Spezifitätskämpfe | Alle Utilities haben dieselbe niedrige Spezifität. |
| Einheitliches Design | Werte kommen aus einer festen Skala statt aus beliebigen Pixeln. |

Der Nachteil: Lange Klassenlisten im HTML. In Projekten mit Komponenten (z. B. [[react|React]]) fällt das kaum
ins Gewicht, weil jede Komponente ihre Klassen nur einmal enthält.

> [!MERKSATZ]
> Tailwind ersetzt kein CSS-Wissen. `flex`, `grid`, `p-4` und `md:` sind nur Kurzschreibweisen für Flexbox,
> Grid, Box-Modell und Media Queries – alles, was du in den Modulen davor gelernt hast.

## Wie Tailwind arbeitet: der Build-Schritt

Tailwind ist keine fertige CSS-Datei, die du einbindest. Ein Programm erzeugt das CSS **aus deinem Code**:

![Der Tailwind-Build: input.css und HTML-Dateien werden vom CLI zu output.css](/assets/html-css-tailwind/tailwind-build.svg)

1. Du schreibst eine kleine Eingabedatei (`input.css`) mit `@import "tailwindcss";`.
2. Das CLI durchsucht deine Projektdateien nach Klassennamen wie `p-6` oder `text-3xl`.
3. Es erzeugt eine Ausgabedatei (`output.css`) mit **genau** den Regeln, die du benutzt.
4. Der Browser lädt nur `output.css`.

Dieser [[build-schritt|Build-Schritt]] ist der Grund, warum das fertige CSS klein bleibt, obwohl Tailwind
Tausende Klassen kennt. Ordner wie `node_modules` und Dateien aus der `.gitignore` durchsucht Tailwind nicht.

> [!FEHLER]
> **Klassen zusammenbauen.** `"text-" + farbe + "-600"` findet Tailwind nicht, weil der vollständige Name nirgends
> im Code steht. Schreibe Klassennamen immer komplett aus, z. B. per Auswahl zwischen `"text-rose-600"` und `"text-sky-600"`.

## Installation mit dem Tailwind CLI

Seit Version 4 brauchst du keine Konfigurationsdatei mehr. Im Terminal:

```bash title="Terminal"
npm init -y
npm install -D tailwindcss @tailwindcss/cli
printf '@import "tailwindcss";\n' > input.css
npx @tailwindcss/cli -i input.css -o output.css
```

| Teil | Bedeutung |
|---|---|
| `tailwindcss` | Die Tailwind-Engine |
| `@tailwindcss/cli` | Das Kommandozeilenprogramm |
| `-D` | Als [[devdependency\|Entwicklungsabhängigkeit]] – gebraucht beim Bauen, nicht im Browser |
| `-i` / `-o` | Eingabe- und Ausgabedatei |
| `--watch` | Baut bei jeder Dateiänderung automatisch neu |
| `--minify` | [[minifizierung\|Minifiziert]] die Datei für den Live-Betrieb |

Im HTML bindest du die **Ausgabedatei** ein:

```html
<link rel="stylesheet" href="output.css">
```

Damit du den Befehl nicht jedes Mal tippen musst, legst du ihn als [[npm-script|npm-Script]] in die `package.json`:
`"build": "tailwindcss -i input.css -o output.css --minify"` und startest ihn mit `npm run build`.

> [!PRAXIS]
> In Projekten mit [[vite|Vite]] (React, Laravel) nutzt du statt des CLI das Plugin `@tailwindcss/vite`.
> Es läuft im Dev-Server mit, das Prinzip ist identisch. Die Anleitung steht auf tailwindcss.com unter „Using Vite“.

## Die wichtigsten Utilities

Die Namen folgen einem Muster: **Eigenschaft-Wert**.

| Bereich | Beispiele | Entspricht |
|---|---|---|
| Abstände | `p-4`, `px-6`, `mt-2`, `gap-4` | padding, margin, gap (1 Stufe = 0.25rem) |
| Größen | `w-full`, `max-w-md`, `h-screen` | width, max-width, height |
| Text | `text-lg`, `font-bold`, `text-center` | font-size, font-weight, text-align |
| Farben | `text-slate-700`, `bg-rose-600` | color, background-color (Stufen 50–950) |
| Rahmen | `border`, `rounded-xl`, `shadow-lg` | border, border-radius, box-shadow |
| Layout | `flex`, `grid`, `grid-cols-3`, `items-center`, `justify-between` | Flexbox und Grid |

```html
<header class="flex items-center justify-between p-4">
  <a href="/" class="text-xl font-bold text-rose-600">Stacklab</a>
  <nav class="flex gap-4">…</nav>
</header>
```

Das ist exakt die Flexbox-Kopfzeile aus Modul 3 – nur ohne eigene CSS-Datei. Alle Klassen findest du in der
Doku auf tailwindcss.com; die Suche (Strg+K) ist dein bester Freund.

## Zusammenfassung

- Utility-first: kleine Klassen mit genau einer Aufgabe direkt im HTML.
- Das Tailwind CLI durchsucht deine Dateien und erzeugt nur das CSS für benutzte Klassen.
- Installation: `npm install -D tailwindcss @tailwindcss/cli`, Eingabe `@import "tailwindcss";`.
- Bauen mit `npx @tailwindcss/cli -i input.css -o output.css` (plus `--watch` oder `--minify`).
- Im HTML wird die Ausgabedatei eingebunden; Klassennamen schreibst du immer vollständig aus.
- In Vite-Projekten übernimmt das Plugin `@tailwindcss/vite` denselben Job.
