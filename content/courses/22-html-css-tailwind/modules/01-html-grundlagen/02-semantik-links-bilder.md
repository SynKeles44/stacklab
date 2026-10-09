---
title: Semantisches HTML, Links und Bilder
summary: Mit header, nav, main, article und footer eine Seite gliedern, Überschriften richtig staffeln und Links sowie Bilder barrierearm einbinden.
duration: 25
sources:
  - title: MDN – Dokument- und Webseitenstruktur
    url: https://developer.mozilla.org/de/docs/Learn_web_development/Core/Structuring_content/Structuring_documents
  - title: MDN – Das a-Element
    url: https://developer.mozilla.org/de/docs/Web/HTML/Reference/Elements/a
  - title: MDN – Das img-Element
    url: https://developer.mozilla.org/de/docs/Web/HTML/Reference/Elements/img
  - title: W3C WAI – Tutorial zu Bildern und Alternativtexten
    url: https://www.w3.org/WAI/tutorials/images/
quiz:
  - type: single
    question: Wie viele `<main>`-Elemente darf eine Seite sichtbar enthalten?
    options:
      - Beliebig viele
      - Genau eines
      - Eines pro article
      - Keines – main ist veraltet
    answer: 1
    explanation: >
      `<main>` markiert den Hauptinhalt der Seite. Davon gibt es genau einen sichtbaren – Screenreader können
      direkt dorthin springen und Kopf und Navigation überspringen.
  - type: multiple
    question: Welche Alternativtexte sind gut gewählt?
    options:
      - "`alt=\"bild.jpg\"` für ein Teamfoto"
      - "`alt=\"Drei Personen beim Whiteboard-Workshop\"` für ein Teamfoto"
      - "`alt=\"\"` für eine rein dekorative Trennlinie"
      - "`alt=\"Bild von einem Logo\"` für das Logo, das zur Startseite verlinkt"
      - "`alt=\"Startseite\"` für das Logo, das zur Startseite verlinkt"
    answers: [1, 2, 4]
    explanation: >
      Der Alternativtext ersetzt das Bild: Er beschreibt den Inhalt oder – bei einem Link – das Ziel. Dekorative
      Bilder bekommen ein leeres `alt=""`, damit Screenreader sie überspringen. Dateinamen und „Bild von …“ helfen niemandem.
  - type: find-bug
    question: Die Überschriften-Hierarchie dieser Seite ist kaputt. In welcher Zeile?
    language: html
    code: |
      <h1>Mein Blog</h1>
      <h2>Neueste Artikel</h2>
      <h3>Flexbox verstehen</h3>
      <h3>Grid verstehen</h3>
      <h5>Über mich</h5>
    bug_line: 5
    explanation: >
      Von h3 direkt auf h5 zu springen lässt eine Ebene aus. „Über mich“ ist ein eigener Hauptabschnitt und
      gehört auf Ebene h2. Überschriften wählst du nach Gliederung, nie nach Schriftgröße.
  - type: cloze
    text: Ein Link entsteht mit dem Element `<a>` und dem Attribut ___. Das Bild-Element `<img>` braucht immer `src` und ___.
    blanks:
      - [href]
      - [alt]
    explanation: "`href` ist das Linkziel, `alt` der Alternativtext für alle, die das Bild nicht sehen."
tasks:
  - id: semantik-zuordnen
    type: dragdrop
    title: Welches Element passt?
    description: Ordne jeden Inhalt dem semantischen Element zu, das ihn am besten beschreibt.
    targets:
      - { id: header, label: "<header>" }
      - { id: nav, label: "<nav>" }
      - { id: main, label: "<main>" }
      - { id: article, label: "<article>" }
      - { id: aside, label: "<aside>" }
      - { id: footer, label: "<footer>" }
    items:
      - { label: "Logo und Seitentitel oben", target: header }
      - { label: "Menü mit Links zu allen Unterseiten", target: nav }
      - { label: "Der eigentliche Inhalt dieser Seite", target: main }
      - { label: "Ein Blogbeitrag, der auch allein Sinn ergibt", target: article }
      - { label: "Kasten „Das könnte dich auch interessieren“", target: aside }
      - { label: "Impressum-Link und Copyright ganz unten", target: footer }
    hints:
      - "`<article>` ist für Inhalte, die man auch einzeln verschicken oder in einen Feed stellen könnte."
  - id: div-suppe
    type: terminal
    title: Aus div-Suppe wird semantisches HTML
    description: |
      In `semantik/index.html` liegt eine Seite, die nur aus `<div>`-Elementen besteht. Mach daraus sauberes,
      semantisches HTML.

      1. Ersetze den Kopfbereich `<div class="kopf">` durch `<header>`.
      2. Ersetze `<div class="menue">` durch `<nav>` (im header).
      3. Ersetze `<div class="inhalt">` durch `<main>` und `<div class="beitrag">` durch `<article>`.
      4. Ersetze `<div class="fuss">` durch `<footer>`.
      5. Das Bild `team.jpg` hat keinen Alternativtext – ergänze ein **aussagekräftiges** `alt`.
      6. Achte darauf, dass jedes Start-Tag ein passendes End-Tag bekommt und keine `<div>` übrig bleiben.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: semantik
    setup: |
      cat > index.html <<'EOF'
      <!DOCTYPE html>
      <html lang="de">
        <head>
          <meta charset="utf-8">
          <title>Team Blog</title>
        </head>
        <body>
          <div class="kopf">
            <h1>Team Blog</h1>
            <div class="menue">
              <ul>
                <li><a href="/">Start</a></li>
                <li><a href="/archiv">Archiv</a></li>
              </ul>
            </div>
          </div>
          <div class="inhalt">
            <div class="beitrag">
              <h2>Unser erster Workshop</h2>
              <img src="team.jpg">
              <p>Wir haben einen Tag lang an unserer neuen Startseite gearbeitet.</p>
            </div>
          </div>
          <div class="fuss">
            <p><a href="/impressum">Impressum</a></p>
          </div>
        </body>
      </html>
      EOF
    checks:
      - type: file_contains
        path: index.html
        pattern: "<header>[\\s\\S]*<nav>[\\s\\S]*</nav>[\\s\\S]*</header>"
        message: Der Kopfbereich soll ein header sein, in dem eine nav steckt.
      - type: file_contains
        path: index.html
        pattern: "<main>[\\s\\S]*<article>[\\s\\S]*</article>[\\s\\S]*</main>"
        message: Der Hauptinhalt soll ein main sein, in dem der Beitrag als article steht.
      - type: file_contains
        path: index.html
        pattern: "<footer>[\\s\\S]*</footer>"
        message: Der Fußbereich soll ein footer sein.
      - type: command
        run: grep -c "<div" index.html
        expect_exit: 1
        stdout_matches: "^0$"
        message: Es sind noch div-Elemente übrig. Ersetze alle durch semantische Elemente.
      - type: file_contains
        path: index.html
        pattern: "<img[^>]*\\salt=\"[^\"]{8,}\""
        message: Das Bild braucht einen aussagekräftigen Alternativtext (mindestens ein paar Wörter) im Attribut alt.
      - type: command
        run: for t in header nav main article footer; do o=$(grep -o "<$t>" index.html | wc -l); c=$(grep -o "</$t>" index.html | wc -l); [ "$o" = "$c" ] || echo "$t"; done
        stdout_equals: ""
        message: Mindestens ein Element hat ein Start-Tag ohne passendes End-Tag (oder umgekehrt). Prüfe header, nav, main, article und footer.
    hints:
      - "Ersetze immer beide Seiten: aus `<div class=\"kopf\">` wird `<header>`, und das zugehörige `</div>` wird zu `</header>`."
      - Die Einrückung zeigt dir, welches `</div>` zu welchem Start-Tag gehört.
      - "Für das Bild: `<img src=\"team.jpg\" alt=\"Das Team arbeitet gemeinsam am Whiteboard\">`."
    solution: |
      ```bash
      cd semantik
      cat > index.html <<'EOF'
      <!DOCTYPE html>
      <html lang="de">
        <head>
          <meta charset="utf-8">
          <title>Team Blog</title>
        </head>
        <body>
          <header>
            <h1>Team Blog</h1>
            <nav>
              <ul>
                <li><a href="/">Start</a></li>
                <li><a href="/archiv">Archiv</a></li>
              </ul>
            </nav>
          </header>
          <main>
            <article>
              <h2>Unser erster Workshop</h2>
              <img src="team.jpg" alt="Das Team arbeitet gemeinsam am Whiteboard">
              <p>Wir haben einen Tag lang an unserer neuen Startseite gearbeitet.</p>
            </article>
          </main>
          <footer>
            <p><a href="/impressum">Impressum</a></p>
          </footer>
        </body>
      </html>
      EOF
      ```
---
Zwei Seiten sehen im Browser identisch aus. Die eine besteht nur aus `<div>`-Kästen, die andere aus
`<header>`, `<nav>` und `<main>`. Für Screenreader, Suchmaschinen und dein Team sind das zwei völlig
verschiedene Seiten. In dieser Lektion lernst du, warum.

## Warum Semantik zählt

[[semantisches-html|Semantisches HTML]] heißt: Du wählst jedes Element nach seiner **Bedeutung**. Ein `<div>`
ist ein neutraler Kasten ohne Bedeutung – ein `<nav>` sagt „hier ist die Navigation“.

Davon profitieren drei Gruppen:

| Wer? | Was bringt Semantik? |
|---|---|
| Menschen mit [[screenreader\|Screenreader]] | Sie springen per Tastenkürzel direkt zur Navigation oder zum Hauptinhalt. |
| Suchmaschinen | Sie erkennen, was Hauptinhalt und was Beiwerk ist. |
| Dein Team | `</article>` ist lesbarer als das fünfte `</div>` in Folge. |

Semantik ist die Grundlage von [[barrierefreiheit|Barrierefreiheit]]: Webseiten, die alle Menschen nutzen
können – auch mit Sehbehinderung, nur mit Tastatur oder mit vergrößerter Schrift.

> [!MERKSATZ]
> Nimm das Element, das den Inhalt **beschreibt**. `<div>` und `<span>` sind nur für Fälle da, in denen
> es kein passendes Element gibt – etwa als reiner Gestaltungs-Container.

## Die Landmarken einer Seite

Fast jede Seite folgt demselben Aufbau. Die folgenden Elemente heißen [[landmark|Landmarken]]:

![Typischer Seitenaufbau mit header, nav, main, article, aside und footer](/assets/html-css-tailwind/semantik-layout.svg)

```html
<body>
  <header>
    <a href="/">Logo</a>
    <nav>…Menü…</nav>
  </header>
  <main>
    <article>…Beitrag…</article>
    <aside>…Randinfos…</aside>
  </main>
  <footer>…Impressum…</footer>
</body>
```

| Element | Bedeutung |
|---|---|
| `<header>` | Kopfbereich: Logo, Titel, oft die Navigation |
| `<nav>` | Hauptnavigation mit Links |
| `<main>` | Der einzigartige Hauptinhalt – genau einmal pro Seite |
| `<article>` | In sich geschlossener Inhalt: Blogpost, Produktkarte, Kommentar |
| `<section>` | Thematischer Abschnitt mit eigener Überschrift |
| `<aside>` | Ergänzendes: Infokasten, verwandte Links |
| `<footer>` | Fußbereich: Kontakt, Impressum, Copyright |

`<section>` vs. `<article>`: Würde der Inhalt allein Sinn ergeben (z. B. in einem Newsletter)? Dann
`<article>`. Ist er nur ein Kapitel der Seite? Dann `<section>`.

## Die Überschriften-Hierarchie

Überschriften sind das Inhaltsverzeichnis deiner Seite. Screenreader-Nutzer:innen lassen sich oft zuerst
nur die Überschriften vorlesen, um sich zu orientieren.

```html
<h1>Stacklab Blog</h1>          <!-- genau eine pro Seite -->
  <h2>Neue Kurse</h2>
    <h3>HTML & CSS</h3>
    <h3>Tailwind</h3>
  <h2>Über uns</h2>
```

Regeln für die [[ueberschriften-hierarchie|Überschriften-Hierarchie]]:

1. Genau eine `<h1>` – das Thema der Seite.
2. Keine Ebene überspringen: Nach `<h2>` folgt `<h3>`, nicht `<h5>`.
3. Wähle die Ebene nach der **Gliederung**, nie nach der Schriftgröße. Größe regelt CSS.

> [!FEHLER]
> **`<h4>`, weil es „so schön klein“ ist.** Wer Überschriften nach Optik auswählt, zerstört das Inhaltsverzeichnis.
> Nimm die logisch richtige Ebene und passe die Größe mit CSS an.

## Links

Ein [[hyperlink|Link]] ist ein `<a>`-Element (*anchor*) mit dem Ziel im Attribut `href`:

```html
<a href="https://developer.mozilla.org">MDN Web Docs</a>   <!-- absolute URL -->
<a href="kontakt.html">Kontakt</a>                       <!-- relativ zur aktuellen Seite -->
<a href="/impressum">Impressum</a>                       <!-- relativ zur Domain -->
<a href="#faq">Zu den FAQ</a>                            <!-- Sprung zu id="faq" -->
<a href="mailto:hallo@example.com">E-Mail schreiben</a>
```

Wie bei Dateipfaden gibt es absolute und relative Ziele. `#faq` springt zu dem Element mit `id="faq"` auf
derselben Seite.

Gute Linktexte beschreiben das **Ziel**. „Hier klicken“ ist nutzlos, wenn ein Screenreader alle Links einer
Seite als Liste vorliest – zehnmal „hier klicken“ verrät nichts.

> [!TIPP]
> `target="_blank"` öffnet einen neuen Tab. Nutze es sparsam: Viele Menschen möchten selbst entscheiden,
> wo eine Seite aufgeht.

## Bilder und Alternativtexte

```html
<img src="bilder/ada.jpg" alt="Ada lächelt in die Kamera" width="400" height="300">
```

| Attribut | Zweck |
|---|---|
| `src` | Pfad oder URL zur Bilddatei |
| `alt` | [[alt-text\|Alternativtext]]: ersetzt das Bild, wenn man es nicht sieht |
| `width`, `height` | Seitenverhältnis – der Browser reserviert Platz, die Seite springt beim Laden nicht |

Der Alternativtext wird vorgelesen, angezeigt, wenn das Bild nicht lädt, und von Suchmaschinen gelesen.
Faustregeln:

- **Inhaltsbild:** Beschreibe, was wichtig ist – „Diagramm: Umsatz verdoppelt sich 2026“.
- **Bild in einem Link:** Beschreibe das Ziel – beim Logo also „Startseite“.
- **Reine Dekoration:** `alt=""` (leer, aber vorhanden), damit Screenreader es überspringen.

> [!PRAXIS]
> In vielen Teams gehört „alle Bilder haben einen sinnvollen alt-Text“ zur Checkliste im Code-Review.
> Automatische Prüfwerkzeuge finden fehlende `alt`-Attribute, aber nur Menschen merken, ob der Text auch hilft.

## Zusammenfassung

- Semantisches HTML wählt Elemente nach Bedeutung – das hilft Screenreadern, Suchmaschinen und dem Team.
- Landmarken: `header`, `nav`, `main` (genau einmal), `article`, `section`, `aside`, `footer`.
- Eine `h1` pro Seite, keine Ebenen überspringen, Ebene nach Gliederung statt Größe.
- Links: `<a href="…">` mit absoluten, relativen oder `#id`-Zielen und aussagekräftigem Linktext.
- Bilder: `src` und immer `alt` – beschreibend, als Linkziel oder bei Dekoration leer.
