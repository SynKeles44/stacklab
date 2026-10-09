---
title: Flexbox
summary: Elemente in einer Reihe oder Spalte anordnen, ausrichten, verteilen und umbrechen – mit Hauptachse und Querachse.
duration: 25
sources:
  - title: MDN – Flexbox
    url: https://developer.mozilla.org/de/docs/Learn_web_development/Core/CSS_layout/Flexbox
  - title: MDN – Grundkonzepte von Flexbox
    url: https://developer.mozilla.org/de/docs/Web/CSS/Guides/Flexible_box_layout/Basic_concepts
quiz:
  - type: single
    question: "Ein Container hat `display: flex; flex-direction: column;`. Welche Eigenschaft zentriert die Kinder horizontal?"
    options:
      - justify-content center
      - align-items center
      - text-align center
      - flex-wrap wrap
    answer: 1
    explanation: >
      Bei `column` läuft die Hauptachse von oben nach unten. justify-content wirkt entlang der Hauptachse (vertikal),
      align-items entlang der Querachse – hier also horizontal.
  - type: match
    question: Ordne jedem Wert von justify-content seine Wirkung zu (Hauptachse = Reihe).
    pairs:
      - { left: "flex-start", right: "Alle Elemente links gesammelt" }
      - { left: "center", right: "Alle Elemente in der Mitte" }
      - { left: "space-between", right: "Erstes ganz links, letztes ganz rechts, Rest gleich verteilt" }
      - { left: "flex-end", right: "Alle Elemente rechts gesammelt" }
    explanation: justify-content verteilt den freien Platz auf der Hauptachse.
  - type: find-bug
    question: Die Karten sollen nebeneinanderstehen und bei wenig Platz in die nächste Zeile rutschen. Stattdessen werden sie immer schmaler. Welche Zeile fehlt bzw. ist falsch?
    language: css
    code: |
      .karten {
        display: flex;
        gap: 1rem;
        flex-wrap: nowrap;
      }
      .karte {
        flex: 1 1 15rem;
      }
    bug_line: 4
    explanation: "`flex-wrap: nowrap` (der Standard) zwingt alle Karten in eine Zeile. Mit `flex-wrap: wrap` dürfen sie umbrechen."
  - type: cloze
    text: "`flex: 1 1 15rem` steht für flex-grow 1, flex-shrink 1 und eine Ausgangsbreite (flex-___) von 15rem. Den Abstand zwischen den Elementen setzt du mit ___."
    blanks:
      - [basis]
      - [gap]
    explanation: flex-basis ist die Startgröße, grow und shrink regeln, wie die Elemente wachsen oder schrumpfen. gap setzt Lücken ohne margin-Tricks.
tasks:
  - id: flex-eigenschaften
    type: dragdrop
    title: Welche Eigenschaft macht was?
    description: Ordne jede Wirkung der Flexbox-Eigenschaft zu, die sie erzeugt.
    targets:
      - { id: direction, label: flex-direction }
      - { id: justify, label: justify-content }
      - { id: align, label: align-items }
      - { id: wrap, label: flex-wrap }
      - { id: gap, label: gap }
      - { id: grow, label: flex-grow }
    items:
      - { label: "Kinder untereinander statt nebeneinander", target: direction }
      - { label: "Freien Platz auf der Hauptachse verteilen", target: justify }
      - { label: "Kinder auf der Querachse ausrichten", target: align }
      - { label: "Bei Platzmangel in neue Zeile umbrechen", target: wrap }
      - { label: "Gleichmäßige Lücke zwischen den Kindern", target: gap }
      - { label: "Ein Kind nimmt den restlichen Platz ein", target: grow }
    hints:
      - Eigenschaften wie justify-content und align-items stehen am Container, flex-grow steht am einzelnen Kind.
  - id: flex-navigation
    type: terminal
    title: Eine Kopfzeile mit Flexbox
    description: |
      Im Ordner `flex-navigation` liegt eine Seite mit einem `<header>`: links das Logo, rechts eine `<nav>` mit
      einer `<ul>`. Ergänze `style.css` (ist bereits eingebunden):

      1. `header`: `display: flex`, `justify-content: space-between` und `align-items: center` – Logo links, Menü rechts, beide vertikal mittig.
      2. `nav ul`: ebenfalls `display: flex` mit einem `gap` in `rem`, damit die Menüpunkte nebeneinanderstehen.
      3. Entferne in `nav ul` die Aufzählungspunkte mit `list-style: none` und setze `padding: 0` und `margin: 0`.
      4. Lass die Menüpunkte bei schmalen Bildschirmen umbrechen: `flex-wrap: wrap` für `nav ul`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: flex-navigation
    setup: |
      cat > index.html <<'EOF'
      <!DOCTYPE html>
      <html lang="de">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Flexbox</title>
          <link rel="stylesheet" href="style.css">
        </head>
        <body>
          <header>
            <a href="/" class="logo">Stacklab</a>
            <nav>
              <ul>
                <li><a href="/kurse">Kurse</a></li>
                <li><a href="/projekte">Projekte</a></li>
                <li><a href="/kontakt">Kontakt</a></li>
              </ul>
            </nav>
          </header>
        </body>
      </html>
      EOF
      printf '*, *::before, *::after {\n  box-sizing: border-box;\n}\n' > style.css
    checks:
      - type: file_contains
        path: style.css
        pattern: "(^|[\\s,}])header\\s*\\{[^}]*display\\s*:\\s*flex"
        message: "header braucht `display: flex`."
      - type: file_contains
        path: style.css
        pattern: "(^|[\\s,}])header\\s*\\{[^}]*justify-content\\s*:\\s*space-between"
        message: "header braucht `justify-content: space-between`, damit Logo und Menü an die Ränder rücken."
      - type: file_contains
        path: style.css
        pattern: "(^|[\\s,}])header\\s*\\{[^}]*align-items\\s*:\\s*center"
        message: "header braucht `align-items: center` für die vertikale Mitte."
      - type: file_contains
        path: style.css
        pattern: "nav\\s+ul\\s*\\{[^}]*display\\s*:\\s*flex"
        message: "nav ul braucht `display: flex`."
      - type: file_contains
        path: style.css
        pattern: "nav\\s+ul\\s*\\{[^}]*gap\\s*:[^;}]*rem"
        message: nav ul braucht einen gap in rem.
      - type: file_contains
        path: style.css
        pattern: "nav\\s+ul\\s*\\{[^}]*list-style(-type)?\\s*:\\s*none"
        message: "Entferne die Aufzählungspunkte mit `list-style: none`."
      - type: file_contains
        path: style.css
        pattern: "nav\\s+ul\\s*\\{[^}]*flex-wrap\\s*:\\s*wrap"
        message: "nav ul braucht `flex-wrap: wrap`."
      - type: file_contains
        path: style.css
        pattern: "nav\\s+ul\\s*\\{[^}]*padding\\s*:\\s*0"
        message: "Setze in nav ul `padding: 0`, sonst bleibt der Einzug der Liste stehen."
    hints:
      - "Eigenschaften wie `justify-content` wirken nur am Flex-**Container**, also an dem Element mit `display: flex`."
      - "Für header: `header { display: flex; justify-content: space-between; align-items: center; }`."
      - "Für die Liste: `nav ul { display: flex; flex-wrap: wrap; gap: 1rem; list-style: none; padding: 0; margin: 0; }`."
    solution: |
      ```bash
      cd flex-navigation
      cat >> style.css <<'EOF'

      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
      }

      nav ul {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        list-style: none;
        padding: 0;
        margin: 0;
      }
      EOF
      ```
---
Ein Logo links, ein Menü rechts, beides vertikal mittig – früher brauchte man dafür Tricks mit `float` und
genau berechneten Abständen. Mit Flexbox sind es drei Zeilen. Flexbox ist das Werkzeug für **eindimensionale**
Layouts: Elemente in einer Reihe oder einer Spalte.

## Container und Kinder

[[flexbox|Flexbox]] aktivierst du am **Elternelement**. Es wird zum *Flex-Container*, seine direkten Kinder zu
*Flex-Items*:

```html
<div class="leiste">
  <button>Zurück</button>
  <button>Weiter</button>
</div>
```

```css
.leiste {
  display: flex;
  gap: 1rem;
}
```

Sofort stehen die Kinder nebeneinander statt untereinander – auch Elemente, die sonst eine ganze Zeile füllen
würden. `gap` setzt den Abstand zwischen den Items, ohne dass du mit `margin` rechnen musst.

> [!MERKSATZ]
> `display: flex` gehört an den **Container**. Es wirkt auf seine **direkten Kinder** – Enkel bleiben davon
> unberührt.

## Haupt- und Querachse

Flexbox denkt in zwei Achsen:

![Flexbox-Achsen: Hauptachse mit justify-content, Querachse mit align-items](/assets/html-css-tailwind/flexbox-achsen.svg)

| Eigenschaft | Wirkt auf | Typische Werte |
|---|---|---|
| `flex-direction` | Richtung der Hauptachse | `row` (Standard), `column` |
| `justify-content` | Verteilung auf der **Hauptachse** | `flex-start`, `center`, `space-between`, `flex-end` |
| `align-items` | Ausrichtung auf der **Querachse** | `stretch` (Standard), `center`, `flex-start` |

Bei `row` ist die Hauptachse waagerecht, bei `column` senkrecht – und dann tauschen `justify-content` und
`align-items` ihre Wirkung.

```css
.zentriert {
  display: flex;
  justify-content: center;   /* waagerecht mittig */
  align-items: center;       /* senkrecht mittig */
  min-height: 100vh;
}
```

Das ist der berühmte Weg, ein Element exakt in der Mitte des Bildschirms zu platzieren.

> [!FEHLER]
> **justify und align verwechselt.** Wenn `justify-content: center` „nicht funktioniert“, prüfe zuerst
> `flex-direction`. Bei `column` zentriert es vertikal, nicht horizontal.

## Wachsen, schrumpfen, umbrechen

Am **Kind** steuerst du, wie viel Platz es bekommt:

```css
.suche {
  flex-grow: 1;          /* nimmt allen freien Platz */
}
.karte {
  flex: 1 1 15rem;       /* grow shrink basis */
}
```

| Eigenschaft | Bedeutung |
|---|---|
| `flex-grow` | Wie stark das Item freien Platz aufnimmt (0 = gar nicht) |
| `flex-shrink` | Wie stark es schrumpfen darf, wenn der Platz fehlt |
| `flex-basis` | Ausgangsgröße, bevor verteilt wird |
| `flex` | Kurzschreibweise für alle drei |

Ohne weitere Angabe quetscht Flexbox alle Items in **eine** Zeile. Mit `flex-wrap: wrap` am Container dürfen
sie umbrechen:

```css
.karten {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.karte {
  flex: 1 1 15rem;   /* mindestens ca. 15rem, sonst neue Zeile */
}
```

So entsteht ein Kartenraster, das sich ganz ohne Media Query an die Bildschirmbreite anpasst.

## Typische Flexbox-Muster

| Muster | CSS |
|---|---|
| Logo links, Menü rechts | `display: flex; justify-content: space-between; align-items: center;` |
| Buttons rechts ausrichten | `display: flex; justify-content: flex-end; gap: 0.5rem;` |
| Eingabefeld + Button in einer Zeile | Feld mit `flex-grow: 1`, Button ohne |
| Footer unten auf kurzen Seiten | `body { display: flex; flex-direction: column; min-height: 100vh; }` und `main { flex: 1; }` |

Ein einzelnes Item kannst du mit `align-self` anders ausrichten als die übrigen, und `margin-left: auto`
schiebt ein Item ganz nach rechts.

> [!TIPP]
> In den DevTools erscheint neben jedem Flex-Container ein kleines „flex“-Abzeichen. Ein Klick darauf blendet
> die Achsen, Lücken und den freien Platz direkt auf der Seite ein – ideal, wenn ein Layout nicht tut, was du erwartest.

> [!PRAXIS]
> Navigationsleisten, Button-Gruppen, Formularzeilen, Karten-Footer: Im Alltag ist Flexbox das Layout-Werkzeug,
> das du am häufigsten benutzt. Für echte Raster mit Zeilen **und** Spalten nimmst du Grid – das kommt als Nächstes.

## Zusammenfassung

- `display: flex` am Container ordnet die direkten Kinder in einer Reihe an.
- Hauptachse (`flex-direction`) und Querachse bestimmen, was `justify-content` und `align-items` tun.
- `gap` setzt Abstände zwischen Items.
- `flex-grow`, `flex-shrink` und `flex-basis` (kurz `flex`) verteilen den Platz.
- `flex-wrap: wrap` lässt Items umbrechen – ideal für flexible Kartenreihen.
