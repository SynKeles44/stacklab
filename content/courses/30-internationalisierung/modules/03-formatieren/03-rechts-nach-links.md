---
title: Rechts-nach-links-Sprachen
summary: Wie du Layouts baust, die sich für Arabisch und Hebräisch automatisch spiegeln – mit dir, logischen CSS-Eigenschaften und Bidi-Isolation.
duration: 20
sources:
  - title: W3C – Structural markup and right-to-left text in HTML
    url: https://www.w3.org/International/questions/qa-html-dir
  - title: MDN – CSS logical properties and values
    url: https://developer.mozilla.org/de/docs/Web/CSS/CSS_logical_properties_and_values
  - title: MDN – Das bdi-Element
    url: https://developer.mozilla.org/de/docs/Web/HTML/Element/bdi
  - title: MDN – Intl.Locale.prototype.getTextInfo()
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/getTextInfo
  - title: Tailwind CSS – Margin (logische Utilities ms-/me-)
    url: https://tailwindcss.com/docs/margin
quiz:
  - type: single
    question: Wo setzt du die Schreibrichtung für eine arabische Seite?
    options:
      - "`<html lang=\"ar\" dir=\"rtl\">`"
      - "`body { text-align: right; }`"
      - "`<meta name=\"direction\" content=\"rtl\">`"
      - Gar nicht, der Browser erkennt das an den Buchstaben.
    answer: 0
    explanation: >
      Die Richtung ist Teil der Struktur, nicht nur Gestaltung. `dir="rtl"` am `<html>`-Element spiegelt
      Textfluss, Tabellen, Formulare und alle logischen CSS-Eigenschaften.
  - type: match
    question: Ordne jeder physischen Eigenschaft das logische Gegenstück zu.
    pairs:
      - { left: "margin-left", right: "margin-inline-start" }
      - { left: "padding-right", right: "padding-inline-end" }
      - { left: "text-align: left", right: "text-align: start" }
      - { left: "Tailwind ml-4", right: "Tailwind ms-4" }
    explanation: >
      „inline“ meint die Textrichtung, „start“ den Anfang der Zeile. In LTR ist start links, in RTL rechts.
  - type: multiple
    question: Was wird in einem RTL-Layout gespiegelt?
    options:
      - Pfeile für „weiter“ und „zurück“
      - Die Reihenfolge von Navigation und Seitenleiste
      - Telefonnummern und Zahlen
      - Firmenlogos
    answers: [0, 1]
    explanation: >
      Richtungsabhängige Elemente spiegeln sich mit. Zahlen laufen auch im Arabischen von links nach rechts,
      und Logos bleiben, wie sie sind.
  - type: cloze
    text: "Für Text unbekannter Richtung, etwa einen Benutzernamen, nutzt du das Element ___ oder das Attribut `dir=\"auto\"`."
    blanks:
      - [bdi, "<bdi>"]
    explanation: >
      `<bdi>` isoliert den Text, damit seine Richtung den umgebenden Satz nicht durcheinanderbringt.
tasks:
  - id: logische-eigenschaften
    type: dragdrop
    title: Physisch oder logisch?
    description: >
      Ein Layout soll ohne Umbau auch in Arabisch funktionieren. Ordne jede CSS-Angabe ein: Spiegelt sie sich
      in RTL automatisch, oder bleibt sie fest auf einer Seite?
    targets:
      - { id: logisch, label: Spiegelt sich mit (logisch) }
      - { id: physisch, label: Bleibt fest (physisch) }
    items:
      - { label: "`margin-inline-start: 1rem`", target: logisch }
      - { label: "`padding-inline-end: 2rem`", target: logisch }
      - { label: "`text-align: start`", target: logisch }
      - { label: "Tailwind `ps-4`", target: logisch }
      - { label: "`margin-left: 1rem`", target: physisch }
      - { label: "`float: right`", target: physisch }
      - { label: "Tailwind `pl-4`", target: physisch }
    hints:
      - "Alles mit `left` oder `right` im Namen ist physisch."
  - id: richtungs-umschalter
    type: code
    language: tsx
    title: Ein Sprachumschalter, der die Richtung setzt
    description: |
      Die Komponente `App` hat drei Buttons, um zwischen Deutsch, Arabisch und Hebräisch zu wechseln. Noch
      bleibt die Seite aber immer links-nach-rechts. Ergänze:

      1. Eine Funktion `directionOf(locale)`, die `"rtl"` für die Sprachen `ar`, `he`, `fa` und `ur` liefert,
         sonst `"ltr"`. Tipp: `new Intl.Locale(locale).language`.
      2. Setze am Element `<main id="app">` die Attribute `lang` (aktuelle Locale) und `dir`.
      3. Zeige in `<p id="count">` die Zahl `1234567`, formatiert mit `Intl.NumberFormat` in der aktuellen
         Locale.
    starter: |
      const GREETINGS: Record<string, string> = {
        "de-DE": "Willkommen",
        "ar-EG": "أهلاً وسهلاً",
        "he-IL": "ברוכים הבאים",
      };

      function App() {
        const [locale, setLocale] = React.useState("de-DE");
        return (
          <main id="app" dir="ltr">
            <nav>
              <button id="lang-de" onClick={() => setLocale("de-DE")}>Deutsch</button>
              <button id="lang-ar" onClick={() => setLocale("ar-EG")}>العربية</button>
              <button id="lang-he" onClick={() => setLocale("he-IL")}>עברית</button>
            </nav>
            <h1>{GREETINGS[locale]}</h1>
            <p id="count">1234567</p>
          </main>
        );
      }
    tests:
      - name: startet auf Deutsch, links nach rechts
        code: |
          assertEqual(query("#app").getAttribute("dir"), "ltr");
          assertEqual(query("#app").getAttribute("lang"), "de-DE");
          assertEqual(query("#count").textContent, new Intl.NumberFormat("de-DE").format(1234567));
      - name: Arabisch läuft von rechts nach links
        code: |
          await click("#lang-ar");
          assertEqual(query("#app").getAttribute("dir"), "rtl");
          assertEqual(query("#app").getAttribute("lang"), "ar-EG");
          assertEqual(query("h1").textContent, "أهلاً وسهلاً");
      - name: Zahl im arabischen Format
        code: |
          await click("#lang-ar");
          assertEqual(query("#count").textContent, new Intl.NumberFormat("ar-EG").format(1234567));
      - name: Hebräisch ebenfalls rtl, zurück zu Deutsch ltr
        code: |
          await click("#lang-he");
          assertEqual(query("#app").getAttribute("dir"), "rtl");
          await click("#lang-de");
          assertEqual(query("#app").getAttribute("dir"), "ltr");
    solution: |
      const GREETINGS: Record<string, string> = {
        "de-DE": "Willkommen",
        "ar-EG": "أهلاً وسهلاً",
        "he-IL": "ברוכים הבאים",
      };

      const RTL_LANGUAGES = ["ar", "he", "fa", "ur"];

      function directionOf(locale: string): "ltr" | "rtl" {
        return RTL_LANGUAGES.includes(new Intl.Locale(locale).language) ? "rtl" : "ltr";
      }

      function App() {
        const [locale, setLocale] = React.useState("de-DE");
        const count = React.useMemo(() => new Intl.NumberFormat(locale).format(1234567), [locale]);
        return (
          <main id="app" lang={locale} dir={directionOf(locale)}>
            <nav>
              <button id="lang-de" onClick={() => setLocale("de-DE")}>Deutsch</button>
              <button id="lang-ar" onClick={() => setLocale("ar-EG")}>العربية</button>
              <button id="lang-he" onClick={() => setLocale("he-IL")}>עברית</button>
            </nav>
            <h1>{GREETINGS[locale]}</h1>
            <p id="count">{count}</p>
          </main>
        );
      }
    hints:
      - "`new Intl.Locale(\"ar-EG\").language` liefert `\"ar\"`."
      - "In JSX setzt du Attribute aus Variablen mit geschweiften Klammern: `dir={directionOf(locale)}`."
      - "`new Intl.NumberFormat(locale).format(1234567)` – mit `React.useMemo` wird der Formatierer nur bei einem Sprachwechsel neu erzeugt."
---
Euer Shop startet in Ägypten. Die Texte sind übersetzt, aber die Seite sieht seltsam aus: Der arabische Text
klebt rechts, das Produktbild links, der „Weiter“-Pfeil zeigt in die falsche Richtung und das Suchfeld hat
den Abstand auf der falschen Seite. Arabisch, Hebräisch, Persisch und Urdu werden von **rechts nach links**
geschrieben – und mit ihnen spiegelt sich das ganze Layout.

## Sprachen von rechts nach links

In [[rtl|RTL]]-Sprachen beginnt eine Zeile rechts. Das betrifft nicht nur Text:

- Navigation und Seitenleisten tauschen die Seiten.
- Das Logo steht oben rechts, das Menü-Symbol oben links.
- Fortschrittsbalken füllen sich von rechts nach links.
- „Weiter“-Pfeile zeigen nach links.

Manches bleibt aber, wie es ist: **Zahlen** (auch Telefonnummern) laufen von links nach rechts, Logos und
Fotos werden nicht gespiegelt, und ein Play-Symbol zeigt weiter nach rechts – es steht für das Band einer
Kassette, nicht für die Leserichtung.

> [!MERKSATZ]
> RTL heißt: Das Layout spiegelt sich. Zahlen, Logos und Medien-Steuerung bleiben unverändert.

## Das dir-Attribut

Die Richtung ist Teil der Struktur und gehört ins HTML – nicht nur ins CSS:

```html title="Arabische Seite"
<html lang="ar" dir="rtl">
```

`dir` vererbt sich an alle Elemente. Der Browser setzt Text, Tabellenspalten, Formularfelder und
Scrollbalken dann automatisch richtig. Für einzelne Bereiche kannst du die Richtung wechseln, etwa ein
englisches Zitat mit `<blockquote lang="en" dir="ltr">`.

Die Richtung einer Locale kennt `Intl.Locale` mit `getTextInfo()` – in älteren Browsern heißt die Eigenschaft
noch `textInfo`, und nicht jeder Browser unterstützt sie. Eine kleine Liste mit `ar`, `he`, `fa` und `ur` ist
deshalb oft die robustere Lösung.

## Logische CSS-Eigenschaften

Die eigentliche Arbeit steckt im CSS. Statt `left` und `right` nutzt du
[[logische-css-eigenschaft|logische Eigenschaften]] mit `start` und `end`:

![Dieselbe Karte in LTR und RTL: inline-start ist links in LTR und rechts in RTL](/assets/internationalisierung/rtl-spiegelung.svg)

| Physisch (fest) | Logisch (spiegelt sich) | Tailwind |
|---|---|---|
| `margin-left` | `margin-inline-start` | `ms-4` |
| `margin-right` | `margin-inline-end` | `me-4` |
| `padding-left` | `padding-inline-start` | `ps-4` |
| `left: 0` | `inset-inline-start: 0` | `inset-s-0` |
| `text-align: left` | `text-align: start` | `text-start` |
| `border-left` | `border-inline-start` | `border-s` |

```css title="Eine Karte, die sich selbst spiegelt"
.card img {
  margin-inline-end: 1rem; /* Abstand zum Text – in LTR rechts, in RTL links */
}
.card {
  text-align: start;
}
```

Für Ausnahmen gibt es in Tailwind die Varianten `rtl:` und `ltr:`, z. B. `rtl:rotate-180` für ein Pfeil-Symbol.

> [!FEHLER]
> RTL nachträglich mit einer zweiten CSS-Datei voller `right`-Überschreibungen „reparieren“ – das ist
> doppelte Arbeit und bricht bei jeder Änderung. Logische Eigenschaften von Anfang an kosten nichts extra.

## Bidirektionaler Text

Oft mischen sich Richtungen in einem Satz: ein hebräischer Satz mit dem Produktnamen „iPhone“ oder ein
deutscher Satz mit einem arabischen Benutzernamen. Das heißt [[bidi-text|bidirektionaler Text]]. Der Browser
ordnet solche Stellen mit dem Unicode-Bidi-Algorithmus – bei Satzzeichen und Zahlen am Rand eines Wortes
manchmal falsch.

```html title="Benutzernamen isolieren"
<p>Kommentar von <bdi>{username}</bdi>: 3 Antworten</p>
```

`<bdi>` (oder `dir="auto"`) isoliert den eingesetzten Text, sodass seine Richtung den umgebenden Satz nicht
durcheinanderbringt. Für reine Texte, etwa in Benachrichtigungen ohne HTML, gibt es die unsichtbaren
Unicode-Zeichen U+2068 und U+2069 (First Strong Isolate / Pop Directional Isolate).

> [!PRAXIS]
> Teste RTL früh – nicht erst, wenn die Übersetzung fertig ist. Schalte `dir="rtl"` testweise auf deiner
> deutschen Seite ein. Alles, was dann nicht gespiegelt aussieht, nutzt noch physische Eigenschaften.

## Zusammenfassung

- In **RTL-Sprachen** spiegelt sich das Layout; Zahlen, Logos und Medien-Steuerung bleiben gleich.
- `dir="rtl"` am `<html>`-Element setzt die Richtung für die ganze Seite, `lang` gehört immer dazu.
- **Logische CSS-Eigenschaften** (`margin-inline-start`, `text-align: start`, Tailwind `ms-`/`me-`) spiegeln sich automatisch.
- Für Ausnahmen gibt es die Varianten `rtl:` und `ltr:`.
- Eingesetzte Texte unbekannter Richtung isolierst du mit `<bdi>` oder `dir="auto"`.
