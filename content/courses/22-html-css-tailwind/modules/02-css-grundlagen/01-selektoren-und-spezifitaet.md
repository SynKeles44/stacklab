---
title: CSS-Regeln, Selektoren und Spezifität
summary: Wie CSS an HTML angebunden wird, mit welchen Selektoren du Elemente auswählst und wie der Browser die Spezifität berechnet.
duration: 25
sources:
  - title: MDN – CSS-Grundlagen
    url: https://developer.mozilla.org/de/docs/Learn_web_development/Core/Styling_basics/Getting_started
  - title: MDN – CSS-Selektoren
    url: https://developer.mozilla.org/de/docs/Web/CSS/CSS_selectors
  - title: MDN – Spezifität
    url: https://developer.mozilla.org/de/docs/Web/CSS/Guides/Cascade/Specificity
quiz:
  - type: single
    question: Welcher Weg, CSS einzubinden, ist für eine ganze Website am sinnvollsten?
    options:
      - Ein style-Attribut an jedem Element
      - Ein style-Element in jeder einzelnen HTML-Datei
      - Eine externe Datei, eingebunden mit `<link rel="stylesheet" href="style.css">`
      - CSS direkt in den Text der Seite schreiben
    answer: 2
    explanation: >
      Eine externe Datei gilt für alle Seiten, wird vom Browser zwischengespeichert und trennt Inhalt von Gestaltung.
      Änderst du eine Farbe, änderst du sie an genau einer Stelle.
  - type: match
    question: Ordne jedem Selektor zu, was er auswählt.
    pairs:
      - { left: "p", right: "Alle Absätze" }
      - { left: ".hinweis", right: "Alle Elemente mit class=\"hinweis\"" }
      - { left: "#kontakt", right: "Das Element mit id=\"kontakt\"" }
      - { left: "nav a", right: "Alle Links irgendwo innerhalb einer nav" }
      - { left: "a:hover", right: "Ein Link, über dem gerade die Maus ist" }
    explanation: Typ-, Klassen- und ID-Selektor sind die Grundbausteine; Leerzeichen bedeutet „irgendwo darin“, der Doppelpunkt leitet eine Pseudoklasse ein.
  - type: single
    question: "Welche Regel gewinnt für `<p class=\"intro\" id=\"start\">`? (A) `p.intro { color: blue }` – (B) `#start { color: red }` – (C) `body p { color: green }`"
    options:
      - A, weil sie zwei Teile hat
      - B, weil ein ID-Selektor mehr wiegt als beliebig viele Klassen und Typen
      - C, weil sie zuletzt steht
      - Keine – die Farben mischen sich
    answer: 1
    explanation: "Spezifität: A = (0,1,1), B = (1,0,0), C = (0,0,2). Die erste Spalte entscheidet zuerst – (1,0,0) gewinnt."
  - type: cloze
    text: "Die Spezifität von `.menu a:hover` ist (0, ___, ___)."
    blanks:
      - ["2"]
      - ["1"]
    explanation: "`.menu` und `:hover` zählen in der Klassenspalte (2), `a` in der Typspalte (1)."
tasks:
  - id: spezifitaet-zuordnen
    type: dragdrop
    title: Selektoren nach Spezifität sortieren
    description: Ordne jeden Selektor seiner Spezifität (IDs, Klassen, Typen) zu.
    targets:
      - { id: s001, label: "(0, 0, 1)" }
      - { id: s011, label: "(0, 1, 1)" }
      - { id: s020, label: "(0, 2, 0)" }
      - { id: s100, label: "(1, 0, 0)" }
      - { id: s111, label: "(1, 1, 1)" }
    items:
      - { label: "h2", target: s001 }
      - { label: "a:hover", target: s011 }
      - { label: "input[type=\"email\"]", target: s011 }
      - { label: ".karte.aktiv", target: s020 }
      - { label: "#footer", target: s100 }
      - { label: "#menu a.aktiv", target: s111 }
    hints:
      - "Klassen, Attribut-Selektoren (`[…]`) und Pseudoklassen (`:hover`) zählen alle in der mittleren Spalte."
  - id: spezifitaet-berechnen
    type: code
    language: js
    title: Spezifität automatisch berechnen
    description: |
      Schreibe eine Funktion `specificity(selector)`, die die Spezifität eines Selektors als Array
      `[ids, klassen, typen]` zurückgibt.

      - `#name` zählt als ID.
      - `.name`, Attribut-Selektoren wie `[type="email"]` und Pseudoklassen wie `:hover` oder `:nth-child(2)` zählen als Klasse.
      - Elementnamen wie `li` und Pseudoelemente wie `::before` zählen als Typ.
      - `*` und Kombinatoren (Leerzeichen, `>`, `+`, `~`) zählen nicht.

      Sonderfälle wie `:not()` oder `:is()` musst du nicht behandeln.
    starter: |
      function specificity(selector) {
        let ids = 0;
        let classes = 0;
        let elements = 0;
        // Tipp: Entferne zuerst Attribut-Selektoren [...] und zähle sie,
        // dann zerlege den Rest mit einem regulären Ausdruck in Teile.

        return [ids, classes, elements];
      }
    tests:
      - name: ID-Selektor
        code: assertDeepEqual(specificity('#main'), [1, 0, 0])
      - name: drei Typ-Selektoren
        code: assertDeepEqual(specificity('nav ul li'), [0, 0, 3])
      - name: Klassen und Pseudoklasse
        code: assertDeepEqual(specificity('.btn.primary:hover'), [0, 3, 0])
      - name: Attribut-Selektor
        code: assertDeepEqual(specificity('input[type="email"]'), [0, 1, 1])
      - name: Pseudoelement zählt als Typ
        code: assertDeepEqual(specificity('p::first-line'), [0, 0, 2])
      - name: Universalselektor zählt nicht
        code: assertDeepEqual(specificity('*'), [0, 0, 0])
      - name: gemischt mit Kombinator
        code: assertDeepEqual(specificity('#nav > ul li.aktiv'), [1, 1, 2])
    hints:
      - "`selector.replace(/\\[[^\\]]*\\]/g, …)` findet alle Attribut-Selektoren."
      - "Ein regulärer Ausdruck wie `/::?[a-zA-Z-]+(\\([^)]*\\))?|#[\\w-]+|\\.[\\w-]+|[a-zA-Z][\\w-]*/g` liefert dir Pseudo-Teile, IDs, Klassen und Elementnamen."
      - Prüfe `::` vor `:` – sonst zählst du Pseudoelemente als Klasse.
    solution: |
      function specificity(selector) {
        let ids = 0;
        let classes = 0;
        let elements = 0;
        const withoutAttributes = selector.replace(/\[[^\]]*\]/g, () => {
          classes++;
          return ' ';
        });
        const tokens = withoutAttributes.match(/::?[a-zA-Z-]+(\([^)]*\))?|#[\w-]+|\.[\w-]+|[a-zA-Z][\w-]*/g) || [];
        for (const token of tokens) {
          if (token.startsWith('::')) elements++;
          else if (token.startsWith(':')) classes++;
          else if (token.startsWith('#')) ids++;
          else if (token.startsWith('.')) classes++;
          else elements++;
        }
        return [ids, classes, elements];
      }
---
Dein HTML steht, aber es sieht aus wie 1995: schwarze Schrift, blaue Links, alles untereinander. Jetzt kommt
CSS. Die erste Frage ist dabei immer dieselbe: **Welches Element** soll gestaltet werden? Die Antwort gibst du
mit einem Selektor.

## Aufbau einer CSS-Regel

[[css|CSS]] (*Cascading Style Sheets*) besteht aus [[css-regel|Regeln]]. Jede Regel hat zwei Teile:

```css
h1 {
  color: #e11d48;
  font-size: 2rem;
}
```

| Teil | Beispiel | Bedeutung |
|---|---|---|
| [[selektor\|Selektor]] | `h1` | **Welche** Elemente? |
| Deklarationsblock | `{ … }` | **Was** soll gelten? |
| Eigenschaft | `color` | Welche Eigenschaft? |
| Wert | `#e11d48` | Welcher Wert? |

Eigenschaft und Wert zusammen heißen Deklaration; jede endet mit einem Semikolon. Vergisst du es, ignoriert
der Browser oft die nächste Zeile gleich mit – ohne Fehlermeldung.

> [!FEHLER]
> **Tippfehler werden still verschluckt.** `colr: red;` oder `color: rde;` erzeugen keine Fehlermeldung. Der
> Browser überspringt einfach, was er nicht versteht. Die DevTools streichen solche Zeilen durch – schau dort nach.

## CSS einbinden

Es gibt drei Wege, CSS an HTML zu hängen:

```html
<!-- 1. Externe Datei (der Normalfall) -->
<link rel="stylesheet" href="style.css">

<!-- 2. style-Element im head -->
<style>
  h1 { color: teal; }
</style>

<!-- 3. style-Attribut direkt am Element -->
<p style="color: gray;">Klein gedruckt</p>
```

Nimm fast immer die **externe Datei**. Sie gilt für alle Seiten, der Browser speichert sie im [[cache|Cache]],
und Inhalt und Gestaltung bleiben getrennt. Das `<link>` gehört in den `<head>`.

> [!MERKSATZ]
> HTML für die Struktur, CSS in einer eigenen Datei für das Aussehen. Ein `style`-Attribut ist die Ausnahme,
> nicht die Regel.

## Die wichtigsten Selektoren

| Selektor | Beispiel | Wählt aus |
|---|---|---|
| Typ | `p` | alle `<p>` |
| Klasse | `.hinweis` | alle Elemente mit `class="hinweis"` |
| ID | `#kontakt` | das eine Element mit `id="kontakt"` |
| Universal | `*` | alle Elemente |
| Attribut | `input[type="email"]` | E-Mail-Felder |
| Nachfahre | `nav a` | Links irgendwo in einer `nav` |
| Kind | `ul > li` | `li`, die **direkt** in einer `ul` stecken |
| Gruppe | `h1, h2` | beide – Komma heißt „und auch“ |

Klassen sind dein Hauptwerkzeug: Ein Element kann mehrere haben (`class="karte aktiv"`), und `.karte.aktiv`
(ohne Leerzeichen) wählt nur Elemente, die **beide** tragen.

[[pseudoklasse|Pseudoklassen]] beschreiben einen Zustand: `a:hover` (Maus darüber), `input:focus` (Fokus),
`li:first-child` (erstes Kind), `:focus-visible` (Fokus per Tastatur). Pseudoelemente wie `p::first-line`
beginnen mit zwei Doppelpunkten und gestalten einen Teil eines Elements.

## Spezifität: Wer gewinnt?

Was passiert, wenn zwei Regeln dasselbe Element treffen?

```css
#start { color: red; }
p.intro { color: blue; }
```

Der Browser vergleicht die [[spezifitaet|Spezifität]] – wie „spezifisch“ ein Selektor ist. Er zählt drei Spalten:

| Spalte | Was zählt? | Beispiel |
|---|---|---|
| A – IDs | `#name` | `#start` → (1, 0, 0) |
| B – Klassen | `.name`, `[attr]`, `:hover` | `p.intro` → (0, 1, 1) |
| C – Typen | `p`, `::before` | `body p` → (0, 0, 2) |

Verglichen wird **spaltenweise von links**, wie beim Sortieren von Versionsnummern. (1, 0, 0) schlägt (0, 15, 0):
Eine ID wiegt mehr als beliebig viele Klassen. Nur bei Gleichstand entscheidet die Reihenfolge – die spätere Regel gewinnt.

Ein `style`-Attribut schlägt jeden Selektor, und `!important` schlägt fast alles. Beides macht CSS schwer
wartbar.

> [!PRAXIS]
> Professionelle Teams halten die Spezifität bewusst **niedrig und gleichmäßig**: fast nur Klassen, kaum IDs,
> kein `!important`. Dann gewinnt einfach die Regel, die weiter unten steht – das ist vorhersehbar.

## Zusammenfassung

- Eine CSS-Regel besteht aus Selektor und Deklarationen (`eigenschaft: wert;`).
- CSS gehört in eine externe Datei, eingebunden mit `<link rel="stylesheet">` im head.
- Typ-, Klassen-, ID-, Attribut- und Kombinator-Selektoren wählen Elemente; Pseudoklassen beschreiben Zustände.
- Spezifität wird in drei Spalten gezählt: IDs, Klassen/Attribute/Pseudoklassen, Typen/Pseudoelemente.
- Spaltenweise von links vergleichen; bei Gleichstand gewinnt die spätere Regel.
- Bevorzuge Klassen und vermeide IDs und `!important` im CSS.
