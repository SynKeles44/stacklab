---
title: CSS Grid
summary: Zweidimensionale Layouts mit Spalten und Zeilen – mit der fr-Einheit, repeat(), minmax() und benannten Bereichen.
duration: 25
sources:
  - title: MDN – Grid-Layout
    url: https://developer.mozilla.org/de/docs/Learn_web_development/Core/CSS_layout/Grids
  - title: MDN – Grundkonzepte des Grid-Layouts
    url: https://developer.mozilla.org/de/docs/Web/CSS/Guides/Grid_layout/Basic_concepts
  - title: MDN – grid-template-areas
    url: https://developer.mozilla.org/de/docs/Web/CSS/Reference/Properties/grid-template-areas
quiz:
  - type: single
    question: "Ein Grid ist 900px breit, hat `grid-template-columns: 1fr 2fr` und keinen gap. Wie breit ist die zweite Spalte?"
    options:
      - 450px
      - 600px
      - 300px
      - 2px
    answer: 1
    explanation: "Insgesamt gibt es 3 Anteile (1fr + 2fr). Ein Anteil = 900 / 3 = 300px, die zweite Spalte bekommt 2 Anteile = 600px."
  - type: single
    question: Wann ist Grid die bessere Wahl als Flexbox?
    options:
      - Wenn Elemente nur in einer Reihe stehen sollen
      - Wenn du ein Raster mit Zeilen und Spalten gleichzeitig kontrollieren willst
      - Wenn du Text fett machen willst
      - Grid ist veraltet, Flexbox ersetzt es
    answer: 1
    explanation: Flexbox denkt in einer Achse, Grid in zwei. Seitenlayouts und Galerien mit sauberen Spalten sind Grid-Aufgaben.
  - type: find-bug
    question: Das Layout soll drei gleich breite Spalten haben, zeigt aber nur eine. Welche Zeile ist schuld?
    language: css
    code: |
      .galerie {
        display: grid;
        grid-template-columns: repeat(3 1fr);
        gap: 1rem;
      }
    bug_line: 3
    explanation: "In `repeat()` fehlt das Komma: richtig ist `repeat(3, 1fr)`. Ungültige Werte ignoriert der Browser, das Grid hat dann nur eine Spalte."
  - type: cloze
    text: "`grid-template-columns: repeat(auto-fit, ___(14rem, 1fr))` erzeugt so viele Spalten, wie mit mindestens 14rem Breite hineinpassen."
    blanks:
      - [minmax]
    explanation: minmax() legt Mindest- und Höchstgröße fest; auto-fit füllt die Zeile mit so vielen Spalten wie möglich.
tasks:
  - id: fr-rechnen
    type: steps
    title: Wie breit werden die Spalten?
    description: Ein Grid-Container ist genau 1000px breit. Rechne mit.
    steps:
      - situation: "`grid-template-columns: 1fr 1fr 1fr 1fr;` ohne gap."
        question: Wie breit ist jede Spalte?
        options: [100px, 250px, 400px]
        answer: 1
        explanation: Vier gleiche Anteile teilen sich 1000px – je 250px.
      - situation: "`grid-template-columns: 200px 1fr;` ohne gap."
        question: Wie breit ist die zweite Spalte?
        options: [500px, 800px, 1000px]
        answer: 1
        explanation: Feste Größen werden zuerst abgezogen. Der Rest (800px) geht an die fr-Spalte.
      - situation: "`grid-template-columns: repeat(3, 1fr); gap: 20px;`"
        question: Wie breit ist jede Spalte?
        options: [320px, 333px, 300px]
        answer: 0
        explanation: "Zwei Lücken à 20px kosten 40px. Die restlichen 960px teilen sich drei Spalten: je 320px."
      - situation: "`grid-template-columns: 1fr 3fr;` mit `gap: 40px`."
        question: Wie breit ist die erste Spalte?
        options: [250px, 240px, 960px]
        answer: 1
        explanation: "1000 − 40 = 960px bleiben für 4 Anteile. Ein Anteil = 240px."
  - id: galerie-grid
    type: terminal
    title: Ein Seitenlayout und eine Galerie mit Grid
    description: |
      Im Ordner `grid-layout` liegt eine Seite mit `header`, `nav`, `main` und `footer` sowie einer Galerie
      (`<ul class="galerie">`). `style.css` ist eingebunden, aber fast leer.

      1. Gib `body` ein Grid mit benannten Bereichen: `display: grid` und `grid-template-areas` mit den Namen `kopf`, `menue`, `inhalt` und `fuss`.
      2. Weise den Elementen ihren Bereich zu: `header { grid-area: kopf; }`, `nav` → `menue`, `main` → `inhalt`, `footer` → `fuss`.
      3. Mach `.galerie` zu einem Grid mit `grid-template-columns: repeat(auto-fit, minmax(…, 1fr))` und einem `gap`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: grid-layout
    setup: |
      cat > index.html <<'EOF'
      <!DOCTYPE html>
      <html lang="de">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Grid</title>
          <link rel="stylesheet" href="style.css">
        </head>
        <body>
          <header><h1>Fotoalbum</h1></header>
          <nav><a href="/">Start</a></nav>
          <main>
            <ul class="galerie">
              <li><img src="1.jpg" alt="Sonnenaufgang über dem Meer"></li>
              <li><img src="2.jpg" alt="Wanderweg im Nebel"></li>
              <li><img src="3.jpg" alt="Leuchtturm bei Sturm"></li>
              <li><img src="4.jpg" alt="Hafen am Abend"></li>
            </ul>
          </main>
          <footer><p>Fotos: Beispielbilder</p></footer>
        </body>
      </html>
      EOF
      printf '*, *::before, *::after {\n  box-sizing: border-box;\n}\n' > style.css
    checks:
      - type: file_contains
        path: style.css
        pattern: "body\\s*\\{[^}]*display\\s*:\\s*grid"
        message: "body braucht `display: grid`."
      - type: command
        run: tr '\n' ' ' < style.css | grep -oE 'body\s*\{[^}]*grid-template-areas[^;}]*' | grep -q kopf && tr '\n' ' ' < style.css | grep -oE 'body\s*\{[^}]*grid-template-areas[^;}]*' | grep -q menue && tr '\n' ' ' < style.css | grep -oE 'body\s*\{[^}]*grid-template-areas[^;}]*' | grep -q inhalt && tr '\n' ' ' < style.css | grep -oE 'body\s*\{[^}]*grid-template-areas[^;}]*' | grep -q fuss && echo ok
        stdout_equals: ok
        message: "body braucht grid-template-areas mit den Namen kopf, menue, inhalt und fuss."
      - type: file_contains
        path: style.css
        pattern: "(^|[\\s,}])header\\s*\\{[^}]*grid-area\\s*:\\s*kopf"
        message: "header braucht `grid-area: kopf`."
      - type: file_contains
        path: style.css
        pattern: "(^|[\\s,}])nav\\s*\\{[^}]*grid-area\\s*:\\s*menue"
        message: "nav braucht `grid-area: menue`."
      - type: file_contains
        path: style.css
        pattern: "(^|[\\s,}])main\\s*\\{[^}]*grid-area\\s*:\\s*inhalt"
        message: "main braucht `grid-area: inhalt`."
      - type: file_contains
        path: style.css
        pattern: "(^|[\\s,}])footer\\s*\\{[^}]*grid-area\\s*:\\s*fuss"
        message: "footer braucht `grid-area: fuss`."
      - type: file_contains
        path: style.css
        pattern: "\\.galerie\\s*\\{[^}]*display\\s*:\\s*grid"
        message: "Die Galerie braucht `display: grid`."
      - type: file_contains
        path: style.css
        pattern: "\\.galerie\\s*\\{[^}]*grid-template-columns\\s*:\\s*repeat\\(\\s*auto-(fit|fill)\\s*,\\s*minmax\\("
        message: "Die Galerie braucht `grid-template-columns: repeat(auto-fit, minmax(…, 1fr))`."
      - type: file_contains
        path: style.css
        pattern: "\\.galerie\\s*\\{[^}]*gap\\s*:"
        message: Die Galerie braucht einen gap zwischen den Bildern.
    hints:
      - "grid-template-areas bekommt pro Zeile einen String: `\"kopf kopf\" \"menue inhalt\" \"fuss fuss\"`."
      - Zu jedem Namen in den Areas gehört ein Element mit `grid-area` und genau diesem Namen.
      - "Die Galerie: `.galerie { display: grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); gap: 1rem; list-style: none; padding: 0; }`."
    solution: |
      ```bash
      cd grid-layout
      cat >> style.css <<'EOF'

      body {
        display: grid;
        grid-template-columns: 12rem 1fr;
        grid-template-areas:
          "kopf  kopf"
          "menue inhalt"
          "fuss  fuss";
        gap: 1rem;
        margin: 0;
      }
      header { grid-area: kopf; }
      nav { grid-area: menue; }
      main { grid-area: inhalt; }
      footer { grid-area: fuss; }

      .galerie {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
        gap: 1rem;
        list-style: none;
        padding: 0;
      }
      .galerie img {
        width: 100%;
        display: block;
      }
      EOF
      ```
---
Ein Fotoalbum mit gleichmäßigen Spalten, ein Seitenlayout mit Kopf, Seitenleiste und Inhalt: Hier stößt
Flexbox an Grenzen, weil Zeilen **und** Spalten zusammenpassen müssen. Genau dafür gibt es CSS Grid – das
Layout-System für zwei Dimensionen.

## Das Raster anlegen

Wie bei Flexbox aktivierst du [[css-grid|Grid]] am Container:

```css
.galerie {
  display: grid;
  grid-template-columns: 200px 200px 200px;
  gap: 1rem;
}
```

Jetzt landen die Kinder automatisch Zelle für Zelle im Raster: die ersten drei in Zeile 1, die nächsten drei in
Zeile 2 und so weiter. Zeilen entstehen von selbst, so viele wie nötig.

| Begriff | Bedeutung |
|---|---|
| Spur (*track*) | Eine Spalte oder Zeile |
| Zelle | Schnittpunkt von Zeile und Spalte |
| Linie | Die Grenze zwischen Spuren – nummeriert ab 1 |
| `gap` | Abstand zwischen den Spuren |

Feste Pixelbreiten sind aber unflexibel: Auf einem Handy passen keine 600px nebeneinander.

## Die fr-Einheit

Die [[fr-einheit|Einheit fr]] (*fraction*, Anteil) verteilt den **freien** Platz:

```css
.layout {
  display: grid;
  grid-template-columns: 1fr 2fr;   /* Spalte 2 bekommt doppelt so viel */
}
```

So rechnet der Browser:

1. Ziehe feste Größen und Lücken (`gap`) von der Gesamtbreite ab.
2. Teile den Rest durch die Summe aller `fr`-Werte.
3. Jede Spalte bekommt ihren Anteil.

Bei 900px Breite und `1fr 2fr` sind es 3 Anteile à 300px – also 300px und 600px.

`repeat()` spart Tipparbeit: `repeat(4, 1fr)` ist dasselbe wie `1fr 1fr 1fr 1fr`.

> [!MERKSATZ]
> `fr` verteilt nur den Platz, der **nach** festen Breiten und gap übrig bleibt.

## Responsive ohne Media Query: auto-fit und minmax

Eine der stärksten Zeilen in CSS:

```css
.galerie {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 1rem;
}
```

Gelesen: „Lege so viele Spalten an, wie hineinpassen. Jede ist mindestens 14rem breit und teilt sich den Rest
gleichmäßig.“ Auf dem Handy entsteht eine Spalte, auf dem Tablet zwei, auf dem großen Bildschirm vier – ohne
eine einzige Media Query.

| Teil | Bedeutung |
|---|---|
| `minmax(14rem, 1fr)` | Mindestens 14rem, höchstens ein Anteil |
| `auto-fit` | So viele Spalten wie möglich; leere werden zusammengeschoben |
| `auto-fill` | Wie auto-fit, aber leere Spalten bleiben als Platzhalter stehen |

> [!FEHLER]
> **`repeat(3 1fr)` ohne Komma.** Ein einziger Syntaxfehler macht die ganze Deklaration ungültig – das Grid fällt
> still auf eine Spalte zurück. Die DevTools zeigen ungültige Werte mit einem Warnsymbol an.

## Benannte Bereiche

Für Seitenlayouts kannst du das Raster wie eine kleine Zeichnung beschreiben:

```css
body {
  display: grid;
  grid-template-columns: 12rem 1fr;
  grid-template-areas:
    "kopf  kopf"
    "menue inhalt"
    "fuss  fuss";
}
header { grid-area: kopf; }
nav    { grid-area: menue; }
main   { grid-area: inhalt; }
footer { grid-area: fuss; }
```

Jeder String ist eine Zeile, jedes Wort eine Zelle. Gleiche Namen nebeneinander verbinden Zellen zu einem
Bereich. Willst du das Layout auf dem Handy umbauen, änderst du nur die Areas – das HTML bleibt gleich.

Alternativ platzierst du Elemente über Linien: `grid-column: 1 / 3` spannt über die Spalten 1 und 2,
`grid-column: span 2` über zwei Spalten ab der aktuellen Position.

> [!TIPP]
> Auch Grid hat in den DevTools ein Abzeichen („grid“). Damit siehst du Linien-Nummern, Bereichsnamen und Lücken
> als Überlagerung – so findest du schnell heraus, warum ein Element in der falschen Zelle landet.

> [!PRAXIS]
> Faustregel aus dem Alltag: **Grid für das Seitenlayout und Raster, Flexbox für die Bausteine darin.** Die
> Kopfzeile ist ein Grid-Bereich – ihr Inhalt (Logo, Menü) wird mit Flexbox angeordnet.

## Zusammenfassung

- `display: grid` und `grid-template-columns` legen ein Raster an; Zeilen entstehen automatisch.
- `fr` verteilt den restlichen Platz nach festen Breiten und `gap`.
- `repeat(auto-fit, minmax(14rem, 1fr))` erzeugt responsive Spalten ohne Media Query.
- `grid-template-areas` beschreibt Layouts mit benannten Bereichen, `grid-area` ordnet Elemente zu.
- Grid für zweidimensionale Layouts, Flexbox für eindimensionale Reihen.
