---
title: Kaskade und Vererbung
summary: Wie der Browser aus vielen widersprüchlichen Regeln den einen Wert pro Eigenschaft bestimmt – und welche Werte Kinder von ihren Eltern übernehmen.
duration: 20
sources:
  - title: MDN – Kaskade, Spezifität und Vererbung
    url: https://developer.mozilla.org/de/docs/Learn_web_development/Core/Styling_basics/Handling_conflicts
  - title: MDN – Einführung in die Kaskade
    url: https://developer.mozilla.org/de/docs/Web/CSS/Guides/Cascade/Introduction
  - title: MDN – Vererbung
    url: https://developer.mozilla.org/de/docs/Web/CSS/Guides/Cascade/Inheritance
quiz:
  - type: multiple
    question: Welche Eigenschaften werden standardmäßig an Kindelemente vererbt?
    options:
      - color
      - font-family
      - border
      - padding
      - line-height
    answers: [0, 1, 4]
    explanation: >
      Text-Eigenschaften wie Farbe, Schriftart und Zeilenhöhe werden vererbt. Rahmen, Abstände, Breiten und
      Hintergründe nicht – sonst hätte jedes Kind denselben Rahmen wie sein Elternelement.
  - type: single
    question: "Zwei Regeln mit gleicher Spezifität: `.titel { color: blue }` steht in Zeile 3, `.titel { color: green }` in Zeile 20 derselben Datei. Welche Farbe hat der Titel?"
    options:
      - Blau, weil die Regel zuerst kommt
      - Grün, weil bei Gleichstand die spätere Regel gewinnt
      - Eine Mischfarbe
      - Schwarz, weil sich die Regeln aufheben
    answer: 1
    explanation: Herkunft und Spezifität sind gleich – also entscheidet die Reihenfolge. Die zuletzt geladene Deklaration gewinnt.
  - type: find-bug
    question: Alle Links auf der Seite sollen die Textfarbe ihres Elternelements übernehmen. Welche Zeile ist falsch?
    language: css
    code: |
      body {
        color: #1e1b3a;
      }
      a {
        color: inherited;
      }
    bug_line: 5
    explanation: "Das Schlüsselwort heißt `inherit`, nicht `inherited`. Den unbekannten Wert ignoriert der Browser still – Links bleiben blau."
  - type: cloze
    text: "Das Schlüsselwort ___ übernimmt den Wert des Elternelements, ___ setzt eine Eigenschaft auf ihren Grundwert aus der CSS-Spezifikation zurück."
    blanks:
      - [inherit]
      - [initial]
    explanation: "`inherit` erzwingt Vererbung, `initial` den Ausgangswert der Spezifikation (für `color` meist Schwarz)."
tasks:
  - id: kaskade-durchspielen
    type: steps
    title: Die Kaskade Schritt für Schritt
    description: |
      Für `<p class="hinweis">Achtung</p>` gibt es diese Regeln:

      - Browser-Standard: `p { color: black }`
      - In `style.css`, Zeile 4: `p { color: gray }`
      - In `style.css`, Zeile 9: `.hinweis { color: orange }`
      - In `style.css`, Zeile 15: `p { color: purple }`

      Spiel durch, wie der Browser entscheidet.
    steps:
      - situation: "Die Browser-Regel `p { color: black }` und deine Regel `p { color: gray }` haben dieselbe Spezifität."
        question: Welche gewinnt?
        options:
          - Die Browser-Regel, weil sie zuerst geladen wird
          - Deine Regel, weil Autoren-Stylesheets Vorrang vor dem Browser-Standard haben
        answer: 1
        explanation: Zuerst zählt die Herkunft. Dein CSS (Autoren-Stylesheet) schlägt die Standardwerte des Browsers.
      - situation: "Jetzt konkurrieren `p { color: gray }` (Zeile 4) und `.hinweis { color: orange }` (Zeile 9) – beide aus deiner Datei."
        question: Welche Regel gewinnt?
        options:
          - ".hinweis, weil (0,1,0) spezifischer ist als (0,0,1)"
          - "p, weil Typ-Selektoren Vorrang haben"
        answer: 0
        explanation: Bei gleicher Herkunft entscheidet die Spezifität. Eine Klasse wiegt mehr als ein Typ-Selektor.
      - situation: "Ganz unten in Zeile 15 steht noch `p { color: purple }`."
        question: Welche Farbe hat der Absatz am Ende?
        options:
          - Lila, weil die Regel zuletzt steht
          - Orange, weil die Reihenfolge erst bei gleicher Spezifität zählt
        answer: 1
        explanation: Die Reihenfolge ist nur der letzte Tie-Breaker. `.hinweis` ist spezifischer, also bleibt es Orange.
      - situation: Im Absatz steckt ein `<strong>Wichtig</strong>`, für das es keine eigene color-Regel gibt.
        question: Welche Farbe hat das strong-Element?
        options:
          - Schwarz, der Browser-Standard
          - Orange, weil color vom Elternelement geerbt wird
        answer: 1
        explanation: Für strong gilt keine eigene color-Deklaration, also erbt es den berechneten Wert seines Elternelements.
  - id: stylesheet-vererbung
    type: terminal
    title: Ein Stylesheet einbinden und Vererbung nutzen
    description: |
      Im Ordner `kaskade` liegen `index.html` und eine leere `style.css`.

      1. Binde `style.css` im `<head>` von `index.html` mit `<link rel="stylesheet" href="style.css">` ein.
      2. Setze in `style.css` für `body` eine `font-family` und eine `color` – alle Texte erben sie.
      3. Gib Elementen mit der Klasse `.hinweis` eine eigene Farbe (`color`).
      4. Sorge dafür, dass Links (`a`) die Textfarbe ihres Elternelements erben (`color: inherit`).
      5. Verwende **kein** `!important`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: kaskade
    setup: |
      cat > index.html <<'EOF'
      <!DOCTYPE html>
      <html lang="de">
        <head>
          <meta charset="utf-8">
          <title>Kaskade</title>
        </head>
        <body>
          <h1>Vererbung</h1>
          <p>Normaler Text mit einem <a href="/mehr">Link</a>.</p>
          <p class="hinweis">Ein Hinweis mit einem <a href="/hilfe">Link</a>.</p>
        </body>
      </html>
      EOF
      : > style.css
    checks:
      - type: file_contains
        path: index.html
        pattern: "<head>[\\s\\S]*<link(?=[^>]*rel=\"stylesheet\")(?=[^>]*href=\"(\\./)?style\\.css\")[^>]*>[\\s\\S]*</head>"
        message: Binde style.css im head mit `<link rel="stylesheet" href="style.css">` ein.
      - type: file_contains
        path: style.css
        pattern: "body\\s*\\{[^}]*font-family\\s*:[^;}]+"
        message: In style.css fehlt für body eine font-family.
      - type: file_contains
        path: style.css
        pattern: "body\\s*\\{[^}]*[^-]color\\s*:[^;}]+"
        message: In style.css fehlt für body eine color.
      - type: file_contains
        path: style.css
        pattern: "\\.hinweis\\s*\\{[^}]*color\\s*:[^;}]+"
        message: Elemente mit der Klasse .hinweis brauchen eine eigene color.
      - type: file_contains
        path: style.css
        pattern: "(^|[\\s,}])a\\s*\\{[^}]*color\\s*:\\s*inherit"
        message: "Links sollen ihre Farbe erben: `a { color: inherit; }`."
      - type: command
        run: grep -c "!important" style.css
        expect_exit: 1
        stdout_matches: "^0$"
        message: Bitte ohne !important – die Kaskade löst das auch so.
    hints:
      - "Eine Zeile im head reicht: `<link rel=\"stylesheet\" href=\"style.css\">`."
      - "In style.css: `body { font-family: system-ui, sans-serif; color: #1e1b3a; }`."
      - "Dazu `.hinweis { color: #b45309; }` und `a { color: inherit; }`."
    solution: |
      ```bash
      cd kaskade
      sed -i 's|<title>Kaskade</title>|<title>Kaskade</title>\n    <link rel="stylesheet" href="style.css">|' index.html
      cat > style.css <<'EOF'
      body {
        font-family: system-ui, sans-serif;
        color: #1e1b3a;
      }

      .hinweis {
        color: #b45309;
      }

      a {
        color: inherit;
      }
      EOF
      ```
---
Du setzt eine Überschrift auf Rot – und sie bleibt blau. Irgendwo gibt es eine andere Regel, die gewinnt. Wer
versteht, **wie** der Browser diesen Streit entscheidet, sucht nicht mehr stundenlang, sondern weiß nach einem
Blick in die DevTools, was los ist.

## Was „Kaskade“ bedeutet

Für ein einzelnes Element gelten oft Dutzende Deklarationen: vom Browser, aus deinem Stylesheet, aus einer
Bibliothek. Für jede **Eigenschaft** braucht der Browser am Ende genau **einen** Wert. Das Verfahren, das ihn
auswählt, heißt [[kaskade|Kaskade]] – sie gibt CSS den Namen *Cascading* Style Sheets.

Stell dir einen Wasserfall mit mehreren Stufen vor. Auf jeder Stufe fallen Kandidaten heraus. Wer unten
ankommt, gewinnt.

![Die Kaskade: Herkunft und Wichtigkeit, dann Spezifität, dann Reihenfolge](/assets/html-css-tailwind/kaskade.svg)

Der Streit wird **pro Eigenschaft** ausgetragen, nicht pro Regel. Eine Regel kann bei `color` verlieren und bei
`font-size` trotzdem gewinnen.

## Die Stufen der Kaskade

Der Browser prüft der Reihe nach – und schaut nur dann auf die nächste Stufe, wenn es auf der aktuellen
einen Gleichstand gibt:

| Stufe | Frage | Beispiel |
|---|---|---|
| 1. Herkunft und Wichtigkeit | Woher stammt die Regel? Hat sie `!important`? | Dein CSS schlägt den Browser-Standard |
| 2. Spezifität | Wie spezifisch ist der Selektor? | `.hinweis` schlägt `p` |
| 3. Reihenfolge | Welche Deklaration kommt zuletzt? | Zeile 20 schlägt Zeile 3 |

Ein `style`-Attribut am Element sitzt dabei noch über allen Selektoren. Zwischen Stufe 1 und 2 gibt es
außerdem *Cascade Layers* (`@layer`), mit denen große Projekte Bereiche ordnen – Tailwind nutzt sie intern.
Details findest du bei MDN unter „@layer“.

> [!MERKSATZ]
> Herkunft → Spezifität → Reihenfolge. Die Reihenfolge ist nur der **letzte** Tie-Breaker, keine Trumpfkarte.

## Warum !important keine Lösung ist

`!important` hebt eine Deklaration in eine höhere Stufe:

```css
.titel { color: blue !important; }
#seite .titel { color: red; }   /* verliert trotz höherer Spezifität */
```

Das wirkt wie eine schnelle Lösung. Aber die nächste Person, die die Farbe ändern will, braucht wieder ein
`!important` – und noch eins. So entsteht CSS, in dem niemand mehr vorhersagen kann, was gilt.

> [!FEHLER]
> **`!important` als Reparatur.** Wenn eine Regel nicht greift, finde in den DevTools heraus, welche Regel
> gewinnt und warum. Meist reicht es, eine Klasse zu ergänzen oder die Reihenfolge zu ändern.

## Vererbung

Manche Werte bekommt ein Element gar nicht aus einer eigenen Regel, sondern von seinem Elternelement. Das ist
[[css-vererbung|Vererbung]]:

```css
body {
  font-family: system-ui, sans-serif;
  color: #1e1b3a;
}
```

Diese zwei Zeilen reichen, damit **alle** Texte der Seite Schrift und Farbe übernehmen – Überschriften, Absätze,
Listen. Du musst sie nicht für jedes Element wiederholen.

| Wird vererbt | Wird nicht vererbt |
|---|---|
| `color`, `font-family`, `font-size`, `font-weight` | `margin`, `padding`, `border` |
| `line-height`, `text-align`, `letter-spacing` | `width`, `height`, `background` |
| `visibility`, `cursor` | `display`, `position` |

Faustregel: Was mit **Text** zu tun hat, wird vererbt; was mit der **Box** zu tun hat, nicht.

Wichtig: Eine eigene Regel schlägt immer den geerbten Wert – egal wie unspezifisch sie ist. Deshalb sind Links
blau, obwohl `body` eine Farbe hat: Der Browser-Standard `a { color: … }` ist eine eigene Regel für `a`.

## Vererbung steuern

Mit Schlüsselwörtern greifst du gezielt ein:

| Wert | Wirkung |
|---|---|
| `inherit` | Nimm den Wert des Elternelements |
| `initial` | Nimm den Grundwert aus der CSS-Spezifikation |
| `unset` | Vererbbar? Dann `inherit`, sonst `initial` |

```css
a {
  color: inherit;   /* Links haben die Textfarbe ihrer Umgebung */
}
```

> [!PRAXIS]
> In den DevTools zeigt der Tab „Styles“ (Chrome) bzw. „Regeln“ (Firefox) alle Regeln für ein Element.
> Verlierer sind durchgestrichen, geerbte Werte stehen unter „Inherited from …“. So debuggst du die Kaskade in Sekunden.

## Zusammenfassung

- Die Kaskade bestimmt pro Eigenschaft genau einen Wert.
- Reihenfolge der Prüfung: Herkunft und Wichtigkeit → Spezifität → Position im Code.
- `!important` löst Konflikte nur scheinbar und macht CSS schwer wartbar.
- Text-Eigenschaften wie `color` und `font-family` werden vererbt, Box-Eigenschaften wie `margin` nicht.
- Eine eigene Regel schlägt immer einen geerbten Wert.
- `inherit`, `initial` und `unset` steuern Vererbung gezielt.
