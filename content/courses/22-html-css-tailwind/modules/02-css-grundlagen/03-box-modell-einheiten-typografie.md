---
title: Box-Modell, Einheiten, Farben und Typografie
summary: Jedes Element ist eine Box aus Inhalt, Innenabstand, Rahmen und Außenabstand – dazu die wichtigsten Einheiten, Farbangaben und Schrift-Eigenschaften.
duration: 25
sources:
  - title: MDN – Das Box-Modell
    url: https://developer.mozilla.org/de/docs/Learn_web_development/Core/Styling_basics/Box_model
  - title: MDN – CSS-Werte und Einheiten
    url: https://developer.mozilla.org/de/docs/Learn_web_development/Core/Styling_basics/Values_and_units
  - title: MDN – Grundlegende Textgestaltung
    url: https://developer.mozilla.org/de/docs/Learn_web_development/Core/Text_styling/Fundamentals
  - title: W3C WAI – Kontrast verstehen (WCAG 1.4.3)
    url: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
quiz:
  - type: single
    question: "Eine Box hat `width: 200px; padding: 10px; border: 1px solid;` und den Standardwert `box-sizing: content-box`. Wie breit ist sie inklusive Rahmen?"
    options:
      - 200px
      - 211px
      - 222px
      - 220px
    answer: 2
    explanation: "Bei content-box gilt width nur für den Inhalt: 200 + 2 × 10 (padding) + 2 × 1 (border) = 222px."
  - type: match
    question: Ordne jede Einheit ihrer Bedeutung zu.
    pairs:
      - { left: "px", right: "Fester CSS-Pixel" }
      - { left: "rem", right: "Vielfaches der Schriftgröße des html-Elements" }
      - { left: "em", right: "Vielfaches der Schriftgröße des aktuellen Elements" }
      - { left: "%", right: "Anteil an der Größe des Elternelements" }
      - { left: "vw", right: "Ein Hundertstel der Breite des Browserfensters" }
    explanation: rem eignet sich für Schriftgrößen und Abstände, % und vw für flexible Breiten.
  - type: multiple
    question: Welche Angaben beschreiben dieselbe Farbe (ein reines Rot)?
    options:
      - "`#ff0000`"
      - "`#f00`"
      - "`rgb(255 0 0)`"
      - "`hsl(0 100% 50%)`"
      - "`rgb(0 0 255)`"
    answers: [0, 1, 2, 3]
    explanation: Hex lang und kurz, rgb und hsl sind nur verschiedene Schreibweisen. rgb(0 0 255) wäre Blau.
  - type: cloze
    text: "Mit `box-sizing: ___` zählen padding und border zur angegebenen width. Den Abstand zwischen Rahmen und Nachbar-Elementen regelt ___."
    blanks:
      - [border-box]
      - [margin]
    explanation: border-box macht Breiten vorhersehbar. margin ist der Außenabstand, padding der Innenabstand.
tasks:
  - id: box-modell-beschriften
    type: diagram
    title: Beschrifte das Box-Modell
    description: Ordne den vier Schichten der Box die richtigen Namen zu – von außen nach innen.
    image: /assets/html-css-tailwind/box-modell-leer.svg
    slots:
      - { x: 50, y: 15, answer: margin }
      - { x: 50, y: 27, answer: border }
      - { x: 50, y: 39, answer: padding }
      - { x: 50, y: 59, answer: content }
    distractors: [outline, gap]
    hints:
      - Der Rahmen (border) trennt den Innenabstand vom Außenabstand.
  - id: box-breite
    type: code
    language: js
    title: Wie viel Platz braucht die Box?
    description: |
      Schreibe `gesamtBreite(box)`. Die Funktion bekommt ein Objekt mit `width`, `padding`, `border`, `margin`
      (alle in px, jeweils für **eine** Seite) und `boxSizing` (`'content-box'` oder `'border-box'`) und gibt
      zurück, wie viel horizontalen Platz die Box **inklusive margin** belegt.

      - `content-box`: width ist nur der Inhalt – padding und border kommen links und rechts dazu.
      - `border-box`: width enthält bereits padding und border.
      - margin kommt in beiden Fällen links und rechts dazu.
    starter: |
      function gesamtBreite({ width, padding, border, margin, boxSizing }) {
        // Dein Code
      }
    tests:
      - name: content-box addiert padding und border
        code: "assertEqual(gesamtBreite({ width: 300, padding: 20, border: 2, margin: 10, boxSizing: 'content-box' }), 364)"
      - name: border-box enthält padding und border bereits
        code: "assertEqual(gesamtBreite({ width: 300, padding: 20, border: 2, margin: 10, boxSizing: 'border-box' }), 320)"
      - name: alles null
        code: "assertEqual(gesamtBreite({ width: 0, padding: 0, border: 0, margin: 0, boxSizing: 'content-box' }), 0)"
      - name: nur margin
        code: "assertEqual(gesamtBreite({ width: 100, padding: 0, border: 0, margin: 25, boxSizing: 'border-box' }), 150)"
    hints:
      - Jeder Abstand kommt zweimal vor – links und rechts.
      - "Bei border-box ist der Rand schon in width enthalten: Dann zählt nur `width + 2 * margin`."
    solution: |
      function gesamtBreite({ width, padding, border, margin, boxSizing }) {
        const rand = boxSizing === 'border-box' ? 0 : 2 * padding + 2 * border;
        return width + rand + 2 * margin;
      }
---
Du gibst einer Karte `width: 300px`, fügst etwas Innenabstand hinzu – und plötzlich passt sie nicht mehr neben
die Nachbarkarte. Der Grund steckt im wichtigsten Modell von CSS: Jedes Element ist eine **Box**, und ihre
Breite setzt sich aus mehreren Schichten zusammen.

## Jedes Element ist eine Box

Der Browser zeichnet jedes Element als Rechteck aus vier Schichten – das [[box-modell|Box-Modell]]:

![Das Box-Modell: margin, border, padding und content](/assets/html-css-tailwind/box-modell.svg)

| Schicht | Bedeutung | Beispiel |
|---|---|---|
| content | Der Inhalt: Text, Bild | `width: 300px` |
| padding | Innenabstand zwischen Inhalt und Rahmen | `padding: 1rem` |
| border | Der Rahmen | `border: 2px solid #e11d48` |
| margin | Außenabstand zu Nachbarn | `margin: 1rem 0` |

Abstände kannst du für alle Seiten oder einzeln setzen:

```css
.karte {
  padding: 1rem;            /* alle vier Seiten */
  margin: 0 auto;           /* oben/unten 0, links/rechts automatisch → zentriert */
  border: 1px solid #ccc;
  border-radius: 0.5rem;    /* runde Ecken */
}
```

Bei zwei Werten gilt: erst oben/unten, dann links/rechts. Bei vier Werten im Uhrzeigersinn: oben, rechts,
unten, links.

## box-sizing: die wichtigste Zeile CSS

Standardmäßig gilt `box-sizing: content-box`: `width` beschreibt nur den **Inhalt**. Padding und Rahmen kommen
dazu.

```css
.karte { width: 300px; padding: 20px; border: 2px solid; }
/* content-box: tatsächliche Breite = 300 + 40 + 4 = 344px */
```

Mit `border-box` zählen padding und border **in** die Breite hinein. Das ist viel leichter zu rechnen,
deshalb setzen fast alle Projekte gleich zu Beginn:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}
```

> [!MERKSATZ]
> Mit `box-sizing: border-box` ist `width` die Breite, die du siehst – inklusive Innenabstand und Rahmen.
> Nur `margin` kommt noch außen dazu.

> [!FEHLER]
> **Zusammenfallende Außenabstände.** Stehen zwei Blöcke untereinander, addieren sich ihre vertikalen margins
> nicht: Aus `margin-bottom: 20px` und `margin-top: 30px` werden 30px, nicht 50px. Das heißt *margin collapsing*
> und ist gewollt – überrascht aber fast jeden.

Übrigens: Block-Elemente wie `<p>` oder `<section>` nehmen die volle Breite ein und beginnen in einer neuen
Zeile. Inline-Elemente wie `<a>` oder `<strong>` fließen im Text mit; bei ihnen wirken `width` und vertikales
`margin` nicht. Die Eigenschaft `display` ändert dieses Verhalten.

## Einheiten

CSS kennt absolute und relative [[css-einheit|Einheiten]]:

| Einheit | Bezieht sich auf | Typischer Einsatz |
|---|---|---|
| `px` | einen festen CSS-Pixel | Rahmen, feine Linien |
| `rem` | Schriftgröße des `html`-Elements (meist 16px) | Schrift, Abstände |
| `em` | Schriftgröße des aktuellen Elements | Abstände, die mit der Schrift wachsen |
| `%` | Größe des Elternelements | Breiten |
| `vw` / `vh` | 1 % der Breite/Höhe des [[viewport\|Viewports]] | Vollbild-Bereiche |

Warum [[rem|rem]] statt px für Schrift? Viele Menschen stellen im Browser eine größere Grundschrift ein. Mit
`rem` wächst deine Seite mit, mit `px` nicht.

```css
h1 { font-size: 2rem; }      /* 32px bei Standardeinstellung */
.inhalt { max-width: 65ch; } /* ch = Breite der Ziffer 0 – gut für Zeilenlängen */
```

## Farben

Farben kannst du auf mehrere Arten schreiben – alle beschreiben dasselbe:

```css
color: #e11d48;                 /* Hex: Rot, Grün, Blau in 00–ff */
color: rgb(225 29 72);          /* Rot, Grün, Blau in 0–255 */
color: rgb(225 29 72 / 50%);    /* mit 50 % Deckkraft */
color: hsl(346 77% 50%);        /* Farbton, Sättigung, Helligkeit */
color: oklch(0.586 0.253 17.6);     /* modern, wahrnehmungsgleich – nutzt auch Tailwind */
```

Hex ist am verbreitetsten, `hsl` ist praktisch zum Abwandeln („gleiche Farbe, nur heller“). `oklch` sorgt dafür,
dass gleiche Helligkeitswerte auch gleich hell **wirken**.

> [!ACHTUNG]
> Prüfe den [[kontrast|Kontrast]] zwischen Text- und Hintergrundfarbe. Normaler Text braucht mindestens 4,5 : 1.
> Die DevTools zeigen das Verhältnis direkt im Farbwähler an.

## Typografie

Mit wenigen Eigenschaften wird Text gut lesbar:

```css
body {
  font-family: "Inter", system-ui, sans-serif;  /* Liste mit Ausweichschriften */
  font-size: 1rem;
  line-height: 1.6;          /* ohne Einheit: das 1,6-Fache der Schriftgröße */
}
h1 {
  font-size: 2.5rem;
  font-weight: 700;          /* 400 = normal, 700 = fett */
  letter-spacing: -0.02em;
}
p { max-width: 65ch; }
```

- `font-family` ist eine Liste: Fehlt die erste Schrift, nimmt der Browser die nächste.
- `line-height` ohne Einheit vererbt sich sauber an Kinder mit anderer Schriftgröße.
- Zeilen mit 45–75 Zeichen lesen sich am angenehmsten.

> [!PRAXIS]
> In Projekten legst du Schriftgrößen, Abstände und Farben einmal als feste Skala fest (z. B. 0.25rem-Schritte).
> Genau das macht Tailwind später mit seinem Theme – du lernst also schon die Idee dahinter.

## Zusammenfassung

- Jede Box besteht aus content, padding, border und margin.
- `box-sizing: border-box` lässt padding und border in die Breite einrechnen.
- Vertikale margins zwischen Blöcken fallen zusammen.
- `rem` für Schrift und Abstände, `%`/`vw` für flexible Breiten, `px` für feine Linien.
- Farben als Hex, `rgb`, `hsl` oder `oklch` – immer mit ausreichendem Kontrast.
- Gute Typografie: Schriftliste, `line-height` um 1,5, Zeilenlänge um 65 Zeichen.
