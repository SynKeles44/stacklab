---
title: CSS-Variablen und Dark Mode
summary: Farben und Abstände als Custom Properties zentral festlegen und mit prefers-color-scheme automatisch zwischen hellem und dunklem Design wechseln.
duration: 20
sources:
  - title: MDN – CSS Custom Properties verwenden
    url: https://developer.mozilla.org/de/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties
  - title: MDN – prefers-color-scheme
    url: https://developer.mozilla.org/de/docs/Web/CSS/Reference/At-rules/@media/prefers-color-scheme
  - title: MDN – color-scheme
    url: https://developer.mozilla.org/de/docs/Web/CSS/Reference/Properties/color-scheme
quiz:
  - type: single
    question: Wie liest du eine Custom Property namens `--farbe-akzent` aus?
    options:
      - "`color: --farbe-akzent;`"
      - "`color: $farbe-akzent;`"
      - "`color: var(--farbe-akzent);`"
      - "`color: get(farbe-akzent);`"
    answer: 2
    explanation: Custom Properties beginnen mit zwei Bindestrichen und werden mit var() gelesen. $-Variablen gibt es nur in Präprozessoren wie Sass.
  - type: multiple
    question: Welche Aussagen über Custom Properties stimmen?
    options:
      - Sie werden wie andere Eigenschaften vererbt.
      - Sie können in einer Media Query neu gesetzt werden und wirken dann sofort überall, wo sie benutzt werden.
      - Sie werden beim Bauen der Seite fest eingesetzt und sind danach unveränderlich.
      - "`var(--abstand, 1rem)` nutzt 1rem, wenn --abstand nicht definiert ist."
    answers: [0, 1, 3]
    explanation: >
      Custom Properties leben im Browser, nehmen an Kaskade und Vererbung teil und können sich zur Laufzeit ändern – etwa
      im Dark Mode. Der zweite Wert in var() ist ein Ersatzwert.
  - type: find-bug
    question: Im Dunkelmodus soll der Hintergrund dunkel werden, er bleibt aber hell. Welche Zeile ist falsch?
    language: css
    code: |
      :root {
        --hintergrund: #ffffff;
      }
      @media (prefers-color-scheme: night) {
        :root {
          --hintergrund: #0f172a;
        }
      }
      body {
        background: var(--hintergrund);
      }
    bug_line: 4
    explanation: "Die Werte von prefers-color-scheme sind `light` und `dark`. `night` gibt es nicht – die Media Query trifft nie zu."
  - type: cloze
    text: "Globale Variablen definierst du meist im Selektor ___. Den Dunkelmodus des Systems fragst du mit `@media (prefers-color-scheme: ___)` ab."
    blanks:
      - [":root", "root", "html"]
      - [dark]
    explanation: ":root ist das oberste Element (html). Alle Elemente der Seite erben die dort gesetzten Variablen."
tasks:
  - id: welcher-wert
    type: steps
    title: Welcher Wert gilt?
    description: |
      Gegeben ist dieses CSS:

      ```css
      :root { --akzent: #e11d48; --text: #1e1b3a; }
      @media (prefers-color-scheme: dark) {
        :root { --text: #f1f5f9; }
      }
      .warnung { --akzent: #f59e0b; }
      a { color: var(--akzent); }
      body { color: var(--text); }
      ```
    steps:
      - situation: Dein System ist auf hell eingestellt. Ein Link steht in einem normalen Absatz.
        question: Welche Farbe hat der Link?
        options: ["#e11d48", "#f59e0b", "#1e1b3a"]
        answer: 0
        explanation: Der Link liest --akzent und erbt den Wert von :root.
      - situation: Ein Link steht in `<div class="warnung">`.
        question: Welche Farbe hat dieser Link?
        options: ["#e11d48", "#f59e0b"]
        answer: 1
        explanation: Custom Properties werden vererbt. .warnung setzt --akzent für sich und alle Nachfahren neu.
      - situation: Du stellst dein System auf dunkel um. Wie sieht der normale Fließtext aus?
        question: Welche Farbe hat der Text im body?
        options: ["#1e1b3a", "#f1f5f9", "Er bleibt unverändert, bis die Seite neu geladen wird"]
        answer: 1
        explanation: Die Media Query greift sofort und überschreibt --text. Alles, was var(--text) nutzt, ändert sich mit.
  - id: dunkelmodus
    type: terminal
    title: Ein Theme mit Variablen und Dark Mode
    description: |
      Im Ordner `dunkelmodus` liegt eine Seite, deren `style.css` überall feste Farbwerte benutzt. Baue daraus ein
      Theme mit Custom Properties.

      1. Lege in `:root` mindestens die Variablen `--farbe-hintergrund`, `--farbe-text` und `--farbe-akzent` an.
      2. Setze in `:root` außerdem `color-scheme: light dark`, damit auch Scrollbalken und Formularfelder mitwechseln.
      3. Ersetze die festen Farben bei `body` (background und color) und bei `a` durch `var(--…)`.
      4. Füge `@media (prefers-color-scheme: dark)` hinzu, in der `:root` die Variablen `--farbe-hintergrund` und `--farbe-text` mit dunklen bzw. hellen Werten **neu setzt**.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: dunkelmodus
    setup: |
      cat > index.html <<'EOF'
      <!DOCTYPE html>
      <html lang="de">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Dark Mode</title>
          <link rel="stylesheet" href="style.css">
        </head>
        <body>
          <main>
            <h1>Tag und Nacht</h1>
            <p>Diese Seite passt sich deinem System an. <a href="/mehr">Mehr erfahren</a></p>
          </main>
        </body>
      </html>
      EOF
      cat > style.css <<'EOF'
      body {
        background: #ffffff;
        color: #1e1b3a;
        font-family: system-ui, sans-serif;
      }

      a {
        color: #e11d48;
      }
      EOF
    checks:
      - type: file_contains
        path: style.css
        pattern: "^:root\\s*\\{[^}]*--farbe-hintergrund\\s*:"
        message: In :root fehlt die Variable --farbe-hintergrund.
      - type: file_contains
        path: style.css
        pattern: "^:root\\s*\\{[^}]*--farbe-text\\s*:"
        message: In :root fehlt die Variable --farbe-text.
      - type: file_contains
        path: style.css
        pattern: "^:root\\s*\\{[^}]*--farbe-akzent\\s*:"
        message: In :root fehlt die Variable --farbe-akzent.
      - type: file_contains
        path: style.css
        pattern: "^:root\\s*\\{[^}]*color-scheme\\s*:\\s*light\\s+dark"
        message: "Setze in :root `color-scheme: light dark`."
      - type: file_contains
        path: style.css
        pattern: "body\\s*\\{[^}]*background(-color)?\\s*:\\s*var\\(\\s*--farbe-hintergrund"
        message: body soll seinen Hintergrund aus var(--farbe-hintergrund) lesen.
      - type: file_contains
        path: style.css
        pattern: "body\\s*\\{[^}]*[^-]color\\s*:\\s*var\\(\\s*--farbe-text"
        message: body soll seine Textfarbe aus var(--farbe-text) lesen.
      - type: file_contains
        path: style.css
        pattern: "(^|[\\s,}])a\\s*\\{[^}]*color\\s*:\\s*var\\(\\s*--farbe-akzent"
        message: Links sollen ihre Farbe aus var(--farbe-akzent) lesen.
      - type: file_contains
        path: style.css
        pattern: "@media\\s*\\(\\s*prefers-color-scheme\\s*:\\s*dark\\s*\\)\\s*\\{\\s*:root\\s*\\{[^}]*--farbe-hintergrund\\s*:[^}]*\\}"
        message: "Es fehlt `@media (prefers-color-scheme: dark) { :root { --farbe-hintergrund: …; --farbe-text: …; } }`."
      - type: file_contains
        path: style.css
        pattern: "@media\\s*\\(\\s*prefers-color-scheme\\s*:\\s*dark\\s*\\)\\s*\\{\\s*:root\\s*\\{[^}]*--farbe-text\\s*:"
        message: Im Dark-Mode-Block muss auch --farbe-text neu gesetzt werden.
      - type: command
        run: tr '\n' ' ' < style.css | grep -oE '(body|[ }]a)\s*\{[^}]*\}' | grep -cE '#[0-9a-fA-F]{3,8}'
        expect_exit: 1
        stdout_matches: "^0$"
        message: In den Regeln für body und a sollen keine festen Hex-Farben mehr stehen – nur noch var(--…).
    hints:
      - "Beginne die Datei mit `:root { --farbe-hintergrund: #ffffff; --farbe-text: #1e1b3a; --farbe-akzent: #e11d48; color-scheme: light dark; }`."
      - "Aus `background: #ffffff;` wird `background: var(--farbe-hintergrund);`."
      - "Der Dark-Mode-Block: `@media (prefers-color-scheme: dark) { :root { --farbe-hintergrund: #0f172a; --farbe-text: #f1f5f9; } }`."
    solution: |
      ```bash
      cd dunkelmodus
      cat > style.css <<'EOF'
      :root {
        --farbe-hintergrund: #ffffff;
        --farbe-text: #1e1b3a;
        --farbe-akzent: #e11d48;
        color-scheme: light dark;
      }

      @media (prefers-color-scheme: dark) {
        :root {
          --farbe-hintergrund: #0f172a;
          --farbe-text: #f1f5f9;
          --farbe-akzent: #fb7185;
        }
      }

      body {
        background: var(--farbe-hintergrund);
        color: var(--farbe-text);
        font-family: system-ui, sans-serif;
      }

      a {
        color: var(--farbe-akzent);
      }
      EOF
      ```
---
Deine Markenfarbe steht an 37 Stellen im CSS. Jetzt soll sie etwas dunkler werden – und nebenbei wünscht sich
das Team einen Dunkelmodus. Ohne Variablen heißt das: 37 Stellen suchen, ersetzen und für dunkel noch einmal
alles duplizieren. Mit CSS-Variablen änderst du einen Wert an einer Stelle.

## Custom Properties

Eine [[custom-property|Custom Property]] (umgangssprachlich CSS-Variable) ist eine selbst erfundene Eigenschaft.
Ihr Name beginnt mit zwei Bindestrichen, gelesen wird sie mit `var()`:

```css
:root {
  --farbe-akzent: #e11d48;
  --abstand: 1rem;
  --radius: 0.75rem;
}

.button {
  background: var(--farbe-akzent);
  padding: var(--abstand);
  border-radius: var(--radius);
}
```

`:root` ist das oberste Element der Seite (`<html>`). Was dort definiert ist, steht allen Elementen zur
Verfügung, weil Custom Properties **vererbt** werden.

| Schreibweise | Bedeutung |
|---|---|
| `--name: wert;` | Variable setzen |
| `var(--name)` | Variable lesen |
| `var(--name, 1rem)` | Lesen mit Ersatzwert, falls sie nicht gesetzt ist |

> [!MERKSATZ]
> Custom Properties sind echte CSS-Eigenschaften: Sie nehmen an Kaskade und Vererbung teil und können sich
> **zur Laufzeit** ändern – etwa durch eine Media Query oder eine Klasse.

## Variablen lokal überschreiben

Weil Custom Properties vererbt werden, kannst du sie für einen Teilbaum neu setzen:

```css
:root      { --farbe-akzent: #e11d48; }
.warnung   { --farbe-akzent: #f59e0b; }

a, .button { color: var(--farbe-akzent); }
```

Alle Links und Buttons innerhalb von `.warnung` werden orange, alle anderen bleiben rot – ohne eine einzige
zusätzliche Regel für Links oder Buttons.

Solche zentral gepflegten Werte nennt man [[design-token|Design-Tokens]]: Farben, Abstände, Radien und
Schriftgrößen mit Namen, die Design und Entwicklung gemeinsam benutzen.

> [!FEHLER]
> **Ein Bindestrich zu wenig.** `-farbe: red` oder `var(farbe)` sind ungültig. Der Browser verwirft die
> Deklaration still. Merke: zwei Bindestriche beim Setzen **und** beim Lesen.

## Dark Mode mit prefers-color-scheme

Viele Menschen stellen ihr Betriebssystem auf dunkel. Mit der Media Query `prefers-color-scheme` fragst du diese
Einstellung ab – das ist die Grundlage für einen [[dark-mode|Dark Mode]]:

```css
:root {
  --farbe-hintergrund: #ffffff;
  --farbe-text: #1e1b3a;
  color-scheme: light dark;
}

@media (prefers-color-scheme: dark) {
  :root {
    --farbe-hintergrund: #0f172a;
    --farbe-text: #f1f5f9;
  }
}

body {
  background: var(--farbe-hintergrund);
  color: var(--farbe-text);
}
```

Der Trick: Die Regeln für `body` ändern sich nie. Nur die **Variablen** bekommen im Dunkelmodus andere Werte.
Wechselt jemand die Systemeinstellung, passt sich die Seite sofort an – ohne Neuladen.

`color-scheme: light dark` sagt dem Browser, dass deine Seite beide Modi kann. Dann färbt er auch Scrollbalken,
Formularfelder und Standardfarben passend ein.

## Gute dunkle Farben

Der Dunkelmodus ist keine Spielerei: Viele Menschen empfinden dunkle Flächen abends als angenehmer, und manche
sind wegen Lichtempfindlichkeit darauf angewiesen. Ein guter Dunkelmodus ist aber mehr als „Farben umdrehen“:

- **Kein reines Schwarz.** Ein sehr dunkles Blau- oder Grau (`#0f172a`) ist angenehmer als `#000`.
- **Kein reines Weiß für Text.** Leicht gedämpftes Weiß (`#f1f5f9`) blendet weniger.
- **Akzentfarben aufhellen.** Ein kräftiges Rot wirkt auf dunklem Grund oft zu dunkel; nimm eine hellere Stufe.
- **Kontrast prüfen.** Auch im Dunkelmodus gilt mindestens 4,5 : 1 für normalen Text.

> [!PRAXIS]
> Viele Seiten bieten zusätzlich einen Schalter „Hell / Dunkel / System“. Dazu setzt ein kleines JavaScript eine
> Klasse wie `dark` am `<html>`-Element, und das CSS fragt diese Klasse statt der Media Query ab. Tailwind
> unterstützt beide Wege – das siehst du im letzten Modul.

## Zusammenfassung

- Custom Properties heißen `--name`, werden mit `var(--name)` gelesen und vererbt.
- Globale Werte stehen in `:root`; in Teilbäumen kannst du sie überschreiben.
- Zentrale Variablen für Farben, Abstände und Radien sind Design-Tokens.
- `@media (prefers-color-scheme: dark)` setzt die Variablen im Dunkelmodus neu – die übrigen Regeln bleiben gleich.
- `color-scheme: light dark` lässt auch Browser-Bedienelemente mitwechseln.
- Dunkle Themes: kein reines Schwarz und Weiß, Akzente aufhellen, Kontrast prüfen.
