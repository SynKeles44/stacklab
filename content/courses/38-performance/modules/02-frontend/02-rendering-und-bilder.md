---
title: Rendering-Pfad, Skripte und Bilder
summary: Wie der Browser aus HTML und CSS Pixel macht, warum Skripte und Stylesheets ihn aufhalten und wie du Bilder so einbindest, dass LCP und CLS gut bleiben.
duration: 25
sources:
  - title: MDN – Critical rendering path
    url: https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Critical_rendering_path
  - title: MDN – The script element (defer, async)
    url: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script
  - title: web.dev – Optimize Largest Contentful Paint
    url: https://web.dev/articles/optimize-lcp
  - title: MDN – Responsive images
    url: https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images
  - title: web.dev – Browser-level image lazy loading
    url: https://web.dev/articles/browser-level-image-lazy-loading
quiz:
  - type: single
    question: Was passiert, wenn der Browser beim Lesen des HTML auf `<script src="app.js"></script>` (ohne Attribute) stößt?
    options:
      - Er lädt das Skript im Hintergrund und liest das HTML weiter.
      - Er hält den Aufbau des DOM an, lädt das Skript, führt es aus und macht erst dann weiter.
      - Er ignoriert das Skript bis zum Ende der Seite.
      - Er führt das Skript erst aus, wenn die Nutzerin klickt.
    answer: 1
    explanation: >
      Ein klassisches Skript könnte mit `document.write` das HTML verändern, darum wartet der Parser. Mit `defer` lädt der
      Browser parallel und führt das Skript erst nach dem Parsen aus.
  - type: find-bug
    question: Dieses Titelbild ist das LCP-Element ganz oben auf der Seite. Welche Zeile verschlechtert LCP?
    language: html
    code: |
      <img
        src="/img/hero-1200.avif"
        width="1200"
        height="600"
        loading="lazy"
        alt="Unser Team bei der Arbeit">
    bug_line: 5
    explanation: >
      `loading="lazy"` lässt den Browser mit dem Laden warten, bis er das Layout kennt. Für Bilder im sichtbaren Bereich –
      vor allem das LCP-Bild – ist das kontraproduktiv. Dort passt eher `fetchpriority="high"`.
  - type: match
    question: Ordne jedem Attribut seine Wirkung zu.
    pairs:
      - { left: "defer", right: "Skript parallel laden, nach dem Parsen in Reihenfolge ausführen" }
      - { left: "async", right: "Skript parallel laden, sofort nach dem Laden ausführen" }
      - { left: "loading=\"lazy\"", right: "Bild erst laden, wenn es in die Nähe des Viewports kommt" }
      - { left: "fetchpriority=\"high\"", right: "Ressource bevorzugt laden" }
    explanation: "`defer` ist für die meisten eigenen Skripte die richtige Wahl, `async` für unabhängige Skripte wie Analytics."
  - type: multiple
    question: Welche Maßnahmen verhindern Layout-Verschiebungen (CLS) durch Bilder?
    options:
      - "`width`- und `height`-Attribute am `<img>`"
      - "Eine CSS-Regel mit `aspect-ratio` für den Bildcontainer"
      - "Ein Bild im Format AVIF statt JPEG"
      - "`loading=\"lazy\"` an allen Bildern"
    answers: [0, 1]
    explanation: Das Format spart Bytes, und Lazy Loading spart Bandbreite – aber nur reservierter Platz verhindert das Verrutschen.
tasks:
  - id: rendering-pfad
    type: diagram
    title: Beschrifte den Critical Rendering Path
    description: Setze die Stationen ein, die der Browser vom HTML und CSS bis zu den Pixeln durchläuft.
    image: /assets/performance/critical-rendering-path-leer.svg
    slots:
      - { x: 32.5, y: 21.7, answer: DOM }
      - { x: 32.5, y: 68.3, answer: CSSOM }
      - { x: 55, y: 45, answer: Render Tree }
      - { x: 75, y: 45, answer: Layout }
      - { x: 91.9, y: 45, answer: Paint }
    distractors: [Event Loop, Bundle]
  - id: ladestrategie
    type: dragdrop
    title: Die passende Ladestrategie
    description: Du optimierst die Startseite eines Online-Shops. Ordne jede Ressource der sinnvollsten Ladestrategie zu.
    targets:
      - { id: defer, label: "<script defer>" }
      - { id: async, label: "<script async>" }
      - { id: hoch, label: "fetchpriority=\"high\"" }
      - { id: lazy, label: "loading=\"lazy\"" }
    items:
      - { label: "app.js – baut das Menü und den Warenkorb", target: defer }
      - { label: "Statistik-Skript, unabhängig vom Rest der Seite", target: async }
      - { label: "Titelbild oben auf der Seite (LCP-Element)", target: hoch }
      - { label: "Produktbilder im unteren Bereich der Seite", target: lazy }
      - { label: "Bilder im Footer mit Partnerlogos", target: lazy }
---
In der letzten Lektion hast du gesehen, dass LCP oft am Titelbild hängt. Aber warum dauert es, bis ein Bild
erscheint, das längst im Netzwerk-Tab angekommen ist? Um das zu verstehen, schaust du dem Browser zu, wie er aus
Text Pixel macht – und an welchen Stellen du ihm helfen kannst.

## Vom HTML zu den Pixeln

Der [[critical-rendering-path|Critical Rendering Path]] ist der Weg vom ersten Byte HTML bis zum ersten
gezeichneten Bild:

![Critical Rendering Path: HTML wird zum DOM, CSS zum CSSOM, beide zum Render Tree, dann Layout und Paint](/assets/performance/critical-rendering-path.svg)

1. Aus dem [[html|HTML]] baut der Browser das [[dom|DOM]].
2. Aus allen Stylesheets baut er das [[cssom|CSSOM]].
3. Beides zusammen ergibt den [[render-tree|Render Tree]] – nur sichtbare Elemente.
4. **Layout:** Der Browser berechnet Position und Größe jedes Elements.
5. **Paint:** Er zeichnet die Pixel ([[paint]]).

Gezeichnet wird erst, wenn das CSSOM vollständig ist – darum ist jedes Stylesheet im `<head>`
[[render-blocking|render-blockierend]].

> [!MERKSATZ]
> Ohne vollständiges CSSOM kein erstes Bild. Alles, was DOM oder CSSOM aufhält, schiebt den sichtbaren Inhalt nach hinten.

## Skripte richtig einbinden

Ein klassisches `<script>` hält den HTML-Parser an: laden, ausführen, erst dann weiterlesen. Zwei Attribute
ändern das:

| Einbindung | Laden | Ausführen | Reihenfolge |
|---|---|---|---|
| `<script src>` | blockiert den Parser | sofort | ja |
| `<script defer src>` | parallel | nach dem Parsen | ja |
| `<script async src>` | parallel | sobald geladen | nein |
| `<script type="module">` | parallel | wie `defer` | ja |

```html title="Ein schlanker head"
<head>
  <link rel="stylesheet" href="/assets/app.3f9a1c.css">
  <script defer src="/assets/app.81bd2e.js"></script>
  <script async src="/assets/stats.js"></script>
</head>
```

Mit [[defer-attribut|`defer`]] lädt dein Skript, während der Browser weiter das HTML liest. Für eine wichtige
Ressource, die der Browser spät entdecken würde (etwa eine Schrift aus dem CSS), sagst du ihm mit
[[preload|`<link rel="preload">`]] früh Bescheid.

> [!FEHLER]
> Fünf Skripte ohne `defer` im `<head>` – und der Bildschirm bleibt weiß, bis alle geladen und ausgeführt sind.
> Eigene Skripte bekommen `defer` (oder `type="module"`), unabhängige Dritt-Skripte `async`.

## Bilder: das richtige Format und die richtige Größe

Bilder sind oft der größte Teil einer Seite. Drei Hebel:

- **Format:** [[modernes-bildformat|AVIF oder WebP]] sind bei gleicher Qualität deutlich kleiner als JPEG und PNG.
- **Größe:** Ein Smartphone braucht kein 3000 Pixel breites Bild. Mit `srcset` und `sizes` bietest du
  [[responsive-bilder|mehrere Breiten]] an, der Browser wählt die passende.
- **Komprimierung:** Qualität 60–80 reicht für Fotos meist völlig.

```html title="Ein responsives Titelbild"
<img
  src="/img/hero-800.avif"
  srcset="/img/hero-400.avif 400w, /img/hero-800.avif 800w, /img/hero-1600.avif 1600w"
  sizes="(max-width: 600px) 100vw, 800px"
  width="1600" height="800"
  fetchpriority="high"
  alt="Unser Team bei der Arbeit">
```

## Laden zur richtigen Zeit – und mit reserviertem Platz

**Oben auf der Seite** (das LCP-Bild): sofort laden, gern mit `fetchpriority="high"`, und das Bild direkt im
HTML angeben – nicht erst per JavaScript oder als CSS-Hintergrund nachladen.

**Weiter unten:** [[lazy-loading|Lazy Loading]] mit `loading="lazy"`. Der Browser lädt das Bild erst, wenn es sich
dem sichtbaren Bereich nähert, und spart so Bandbreite für das Wichtige.

**Immer:** `width` und `height` angeben. Der Browser kennt dann das Seitenverhältnis und reserviert den Platz,
bevor das Bild da ist – das verhindert [[cls|Layout-Verschiebungen]].

```css title="Bilder dürfen trotzdem flexibel sein"
img {
  max-width: 100%;
  height: auto; /* Seitenverhältnis kommt aus width/height */
}
```

> [!PRAXIS]
> Ein schneller Check im Team: DevTools öffnen, Netzwerk-Tab auf „Img“ filtern und nach Größe sortieren. Das
> größte Bild ist oft ein unkomprimiertes PNG-Foto oder ein 4000 Pixel breites Original – ein Fund, der LCP sofort verbessert.

## Zusammenfassung

- Der **Critical Rendering Path** führt von HTML und CSS über DOM, CSSOM und Render Tree zu Layout und Paint.
- Stylesheets blockieren das Rendern, Skripte ohne Attribut blockieren den Parser.
- Eigene Skripte mit **`defer`** oder `type="module"`, unabhängige Skripte mit **`async`**.
- Bilder als **AVIF/WebP** in passenden Größen per `srcset` ausliefern.
- Das LCP-Bild früh und priorisiert laden, Bilder weiter unten mit **`loading="lazy"`**.
- **`width` und `height`** an jedem Bild verhindern Layout-Verschiebungen.
