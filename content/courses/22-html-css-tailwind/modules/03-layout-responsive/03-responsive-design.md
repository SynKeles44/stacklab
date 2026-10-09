---
title: Responsive Design mit Mobile First
summary: Mit dem Viewport-Meta-Tag, Media Queries und Mobile First Seiten bauen, die vom Smartphone bis zum großen Monitor funktionieren – plus ein Blick auf Container Queries.
duration: 25
sources:
  - title: MDN – Responsive Design
    url: https://developer.mozilla.org/de/docs/Learn_web_development/Core/CSS_layout/Responsive_Design
  - title: MDN – Media Queries verwenden
    url: https://developer.mozilla.org/de/docs/Web/CSS/Guides/Media_queries/Using
  - title: MDN – Container Queries
    url: https://developer.mozilla.org/de/docs/Web/CSS/Guides/Containment/Container_queries
quiz:
  - type: single
    question: Was passiert auf einem Smartphone, wenn das Viewport-Meta-Tag fehlt?
    options:
      - Die Seite wird gar nicht angezeigt.
      - Das Smartphone tut so, als wäre der Bildschirm etwa 980px breit, und verkleinert die ganze Seite.
      - Alle Media Queries funktionieren trotzdem wie gewünscht.
      - Die Schrift wird automatisch größer.
    answer: 1
    explanation: >
      Ohne `<meta name="viewport" content="width=device-width, initial-scale=1">` simulieren mobile Browser einen breiten
      Desktop-Bildschirm und zoomen heraus. Deine Media Queries für schmale Bildschirme greifen dann nicht.
  - type: single
    question: "Mobile First: Welche Media Query passt dazu?"
    options:
      - "`@media (max-width: 48rem) { … }` für Handy-Styles"
      - "`@media (min-width: 48rem) { … }` für Styles ab Tablet-Breite"
      - "`@media print { … }`"
      - "`@media (orientation: portrait) { … }`"
    answer: 1
    explanation: Bei Mobile First sind die Grundregeln für schmale Bildschirme gedacht. Mit min-width ergänzt du Schritt für Schritt Regeln für breitere Bildschirme.
  - type: find-bug
    question: Ab 48rem Breite sollen drei Spalten erscheinen. Auf breiten Bildschirmen bleibt es bei einer Spalte. Wo ist der Fehler?
    language: css
    code: |
      @media (min-width: 48rem) {
        .karten {
          grid-template-columns: repeat(3, 1fr);
        }
      }
      .karten {
        display: grid;
        grid-template-columns: 1fr;
      }
    bug_line: 6
    explanation: >
      Media Queries erhöhen die Spezifität nicht. Die Grundregel ab Zeile 6 steht später und überschreibt die Regel in der
      Media Query. Bei Mobile First stehen die Grundregeln oben, die Media Queries danach.
  - type: cloze
    text: "Container Queries reagieren auf die Breite eines ___ statt auf die Breite des Viewports. Dafür bekommt dieses Element `container-type: ___`."
    blanks:
      - [Containers, Container, Elternelements, Containerelements]
      - [inline-size]
    explanation: Mit container-type inline-size wird ein Element zum Container; @container fragt dann seine Breite ab.
tasks:
  - id: mobile-first-ablauf
    type: order
    title: Mobile First in der richtigen Reihenfolge
    description: Bringe die Arbeitsschritte für eine responsive Seite nach Mobile First in eine sinnvolle Reihenfolge.
    items:
      - Viewport-Meta-Tag in den head schreiben
      - Semantisches HTML für den Inhalt schreiben
      - Grundstyles für schmale Bildschirme schreiben (eine Spalte)
      - Browser schmal ziehen und schauen, wo das Layout zu viel Platz verschenkt
      - "Media Query mit min-width an genau dieser Stelle ergänzen"
      - Im Gerätemodus der DevTools auf Handy-, Tablet- und Desktop-Breite prüfen
    hints:
      - Breakpoints legst du dort fest, wo dein Inhalt es braucht – nicht nach Gerätenamen.
  - id: mobil-zuerst
    type: terminal
    title: Eine Seite responsiv machen
    description: |
      Im Ordner `mobil-zuerst` liegt eine Seite mit drei Karten in `<div class="karten">`. Mach sie nach Mobile First responsiv.

      1. Ergänze in `index.html` das Viewport-Meta-Tag `<meta name="viewport" content="width=device-width, initial-scale=1">`.
      2. In `style.css`: `.karten` ist ein Grid mit **einer** Spalte (`grid-template-columns: 1fr`) und einem `gap`.
      3. Füge **danach** eine Media Query `@media (min-width: 48rem)` hinzu, in der `.karten` drei Spalten bekommt (`repeat(3, 1fr)`).
      4. Füge eine zweite Media Query mit `min-width` hinzu, die die Schriftgröße von `h1` erhöht.
      5. Verwende kein `max-width` in Media Queries – Mobile First arbeitet mit `min-width`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: mobil-zuerst
    setup: |
      cat > index.html <<'EOF'
      <!DOCTYPE html>
      <html lang="de">
        <head>
          <meta charset="utf-8">
          <title>Responsive</title>
          <link rel="stylesheet" href="style.css">
        </head>
        <body>
          <main>
            <h1>Unsere Angebote</h1>
            <div class="karten">
              <article class="karte"><h2>Basis</h2><p>Für den Einstieg.</p></article>
              <article class="karte"><h2>Plus</h2><p>Für Fortgeschrittene.</p></article>
              <article class="karte"><h2>Profi</h2><p>Für Teams.</p></article>
            </div>
          </main>
        </body>
      </html>
      EOF
      printf '*, *::before, *::after {\n  box-sizing: border-box;\n}\n\nh1 {\n  font-size: 1.75rem;\n}\n' > style.css
    checks:
      - type: file_contains
        path: index.html
        pattern: "<meta(?=[^>]*name=\"viewport\")(?=[^>]*width=device-width)(?=[^>]*initial-scale=1)[^>]*>"
        message: Es fehlt das Viewport-Meta-Tag mit width=device-width und initial-scale=1.
      - type: file_contains
        path: style.css
        pattern: "^\\.karten\\s*\\{[^}]*display\\s*:\\s*grid[^}]*\\}"
        message: "Die Grundregel `.karten { display: grid; … }` fehlt (außerhalb jeder Media Query)."
      - type: file_contains
        path: style.css
        pattern: "^\\.karten\\s*\\{[^}]*grid-template-columns\\s*:\\s*1fr\\s*;"
        message: "In der Grundregel braucht .karten genau eine Spalte: `grid-template-columns: 1fr;`."
      - type: file_contains
        path: style.css
        pattern: "^\\.karten\\s*\\{[^}]*gap\\s*:"
        message: .karten braucht einen gap.
      - type: file_contains
        path: style.css
        pattern: "@media\\s*\\(\\s*min-width\\s*:\\s*48rem\\s*\\)\\s*\\{\\s*\\.karten\\s*\\{[^}]*grid-template-columns\\s*:\\s*repeat\\(\\s*3\\s*,\\s*1fr\\s*\\)"
        message: "Es fehlt `@media (min-width: 48rem) { .karten { grid-template-columns: repeat(3, 1fr); } }`."
      - type: command
        run: tr '\n' ' ' < style.css | grep -oE '^.*@media\s*\(\s*min-width\s*:\s*48rem' | grep -qE '\.karten\s*\{[^}]*display\s*:\s*grid' && echo ok
        stdout_equals: ok
        message: Die Grundregel für .karten muss VOR der Media Query stehen, sonst überschreibt sie die drei Spalten.
      - type: command
        run: tr '\n' ' ' < style.css | grep -oE '@media\s*\(\s*min-width[^)]*\)\s*\{\s*h1\s*\{[^}]*font-size' | wc -l
        stdout_matches: "^\\s*[1-9]\\s*$"
        message: "Es fehlt eine Media Query mit min-width, in der h1 eine größere font-size bekommt."
      - type: command
        run: grep -c "max-width" style.css
        expect_exit: 1
        stdout_matches: "^0$"
        message: Bitte nur min-width-Media-Queries verwenden (Mobile First).
    hints:
      - Die Grundregel ist für das Handy gedacht und steht oben, die Media Queries kommen darunter.
      - "`@media (min-width: 48rem) { .karten { grid-template-columns: repeat(3, 1fr); } }`"
      - "Für die Überschrift z. B. `@media (min-width: 64rem) { h1 { font-size: 3rem; } }`."
    solution: |
      ```bash
      cd mobil-zuerst
      sed -i 's|<meta charset="utf-8">|<meta charset="utf-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1">|' index.html
      cat >> style.css <<'EOF'

      .karten {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      @media (min-width: 48rem) {
        .karten {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      @media (min-width: 64rem) {
        h1 {
          font-size: 3rem;
        }
      }
      EOF
      ```
---
Mehr als die Hälfte aller Seitenaufrufe kommt von Smartphones. Eine Seite, die nur auf dem Laptop gut aussieht,
ist für die meisten Menschen kaputt: winzige Schrift, seitliches Scrollen, Buttons, die man nicht trifft.
[[responsive-design|Responsive Design]] heißt: **eine** Seite, die sich an jede Bildschirmbreite anpasst.

## Der Viewport

Der [[viewport|Viewport]] ist der sichtbare Bereich der Seite im Browserfenster. Mobile Browser haben eine
Eigenheit: Ohne Hinweis tun sie so, als wäre der Bildschirm rund 980px breit, und verkleinern die Seite. Das
stammt aus der Zeit, als Webseiten nur für Desktops gebaut wurden.

Diese eine Zeile im `<head>` schaltet das ab:

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

| Teil | Bedeutung |
|---|---|
| `width=device-width` | Viewport ist so breit wie der Bildschirm des Geräts |
| `initial-scale=1` | Kein Herauszoomen beim Laden |

> [!FEHLER]
> **Viewport-Tag vergessen.** Alles sieht im Desktop-Browser perfekt aus, aber auf dem Handy ist die Seite
> winzig und deine Media Queries greifen nicht. Die erste Frage bei „mobil kaputt“ lautet immer: Ist das Tag da?

## Media Queries

Eine [[media-query|Media Query]] wendet CSS nur unter bestimmten Bedingungen an:

```css
.karten {
  display: grid;
  grid-template-columns: 1fr;          /* gilt immer */
  gap: 1rem;
}

@media (min-width: 48rem) {            /* nur ab 48rem = 768px Breite */
  .karten {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

| Bedingung | Bedeutung |
|---|---|
| `(min-width: 48rem)` | Viewport ist **mindestens** 48rem breit |
| `(max-width: 30rem)` | Viewport ist **höchstens** 30rem breit |
| `(orientation: landscape)` | Querformat |
| `(prefers-color-scheme: dark)` | Das System nutzt den Dunkelmodus (nächste Lektion) |
| `print` | Beim Drucken |

Die Breite, ab der sich das Layout ändert, heißt [[css-breakpoint|Breakpoint]].

Wichtig: Eine Media Query macht Regeln **nicht** spezifischer. Es gilt weiter die Kaskade – steht die
Grundregel weiter unten, überschreibt sie die Regel in der Media Query.

## Mobile First

Es gibt zwei Richtungen, eine responsive Seite zu bauen. Bewährt hat sich [[mobile-first|Mobile First]]:

1. Schreibe zuerst die Styles für den **schmalsten** Bildschirm – ohne Media Query.
2. Ergänze mit `min-width`-Media-Queries Schritt für Schritt, was auf breiteren Bildschirmen anders ist.

```css
/* Basis: Handy */
nav ul { display: flex; flex-direction: column; }

/* ab Tablet */
@media (min-width: 48rem) {
  nav ul { flex-direction: row; }
}
```

Warum so herum? Die schmale Variante ist meist die einfachere (eine Spalte, alles untereinander). Auf großen
Bildschirmen **fügst du hinzu**, statt auf kleinen mühsam zu überschreiben. Das ergibt weniger und klareren Code.

> [!MERKSATZ]
> Mobile First: Grundregeln für schmale Bildschirme, dann `min-width`-Media-Queries in aufsteigender Reihenfolge.
> Genau so arbeitet auch Tailwind mit `md:` und `lg:`.

## Gute Breakpoints finden

Breakpoints legst du nicht nach Geräten fest („iPhone“, „iPad“), denn davon gibt es Hunderte. Lege sie dort hin,
wo **dein Inhalt** es braucht: Zieh das Browserfenster langsam breiter. Sobald das Layout zu viel Platz
verschenkt oder Zeilen zu lang werden, setzt du einen Breakpoint.

Gängige Werte (in rem, damit sie mit der Schriftgröße skalieren):

| Name (Tailwind) | Breite |
|---|---|
| `sm` | 40rem (640px) |
| `md` | 48rem (768px) |
| `lg` | 64rem (1024px) |
| `xl` | 80rem (1280px) |

Zum Testen öffnest du in den DevTools die **Geräte-Symbolleiste** (Strg+Shift+M bzw. Cmd+Shift+M) und wählst
verschiedene Breiten.

> [!PRAXIS]
> Viele Layouts brauchen dank `flex-wrap` und `repeat(auto-fit, minmax(…))` erstaunlich wenige Media Queries.
> Gute Teams nutzen erst flexible Layouts und Media Queries nur dort, wo sich die Struktur wirklich ändert.

## Ausblick: Container Queries

Media Queries fragen den **Viewport**. Eine Karte weiß aber nicht, ob sie in einer schmalen Seitenleiste oder
im breiten Hauptbereich steht. Dafür gibt es [[container-query|Container Queries]]:

```css
.karten-bereich {
  container-type: inline-size;   /* dieses Element wird zum Container */
}

@container (min-width: 30rem) {
  .karte { display: flex; gap: 1rem; }   /* Bild neben Text, wenn der Container breit genug ist */
}
```

So passt sich eine Komponente an den Platz an, den sie tatsächlich bekommt. Alle aktuellen Browser
unterstützen Container Queries; mehr dazu bei MDN unter „CSS container queries“.

## Zusammenfassung

- Ohne `<meta name="viewport" content="width=device-width, initial-scale=1">` funktioniert nichts auf dem Handy.
- Media Queries wenden CSS nur bei bestimmten Bedingungen an, ändern aber nicht die Spezifität.
- Mobile First: Grundstyles für schmale Bildschirme, dann `min-width`-Queries aufsteigend.
- Breakpoints richten sich nach dem Inhalt, nicht nach Gerätemodellen – am besten in `rem`.
- Container Queries reagieren auf die Breite eines Elternelements statt des Viewports.
