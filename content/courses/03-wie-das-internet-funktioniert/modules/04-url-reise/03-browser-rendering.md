---
title: Wie der Browser eine Seite zeichnet
summary: Vom HTML-Text zum DOM, vom CSS zum CSSOM und weiter über Render-Tree, Layout und Paint zu Pixeln – und warum CSS und Skripte die Darstellung blockieren können.
duration: 25
sources:
  - title: MDN – How browsers work
    url: https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work
  - title: MDN – Critical rendering path
    url: https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Critical_rendering_path
  - title: MDN – Introduction to the DOM
    url: https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction
  - title: MDN – The script element (defer, async)
    url: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script
quiz:
  - type: single
    question: Was ist der DOM?
    options:
      - Eine Datei auf dem Server, in der das HTML gespeichert ist.
      - Ein Baum aus Objekten im Browser, der die Struktur der Seite darstellt.
      - Ein anderer Name für CSS.
      - Ein Protokoll zum Übertragen von HTML.
    answer: 1
    explanation: Der Browser baut den DOM aus dem HTML-Text. JavaScript liest und verändert die Seite über den DOM.
  - type: match
    question: Ordne die Begriffe zu.
    pairs:
      - { left: "Tokenizer", right: "Zerlegt den Text in Tags und Textstücke" }
      - { left: "Parser", right: "Setzt die Stücke zu einem Baum zusammen" }
      - { left: "DOM", right: "Baum der HTML-Elemente" }
      - { left: "CSSOM", right: "Baum der CSS-Regeln" }
    explanation: Erst wird zerlegt, dann zusammengesetzt. HTML wird zum DOM, CSS zum CSSOM.
  - type: single
    question: "Ein Element hat `display: none`. Was passiert damit im Render-Tree?"
    options:
      - Es steht drin, wird aber durchsichtig gezeichnet.
      - Es fehlt im Render-Tree, weil es nicht dargestellt wird.
      - Es wird ans Ende der Seite verschoben.
      - Es wird aus dem DOM gelöscht.
    answer: 1
    explanation: Im DOM bleibt das Element erhalten, in den Render-Tree kommen aber nur Elemente, die tatsächlich angezeigt werden.
  - type: multiple
    question: Was stimmt über `<script src="app.js" defer>`?
    options:
      - Das Skript wird parallel zum HTML geladen.
      - Das Skript läuft erst, wenn das HTML fertig geparst ist.
      - Das Skript blockiert den Parser, bis es geladen ist.
      - Mehrere defer-Skripte laufen in der Reihenfolge, in der sie im HTML stehen.
    answers: [0, 1, 3]
    explanation: defer lädt im Hintergrund, führt nach dem Parsen aus und hält die Reihenfolge ein. Ein Skript ohne defer oder async blockiert den Parser.
  - type: find-bug
    question: Diese Seite zeigt lange nichts an, obwohl das HTML schnell da ist. Welche Zeile ist schuld?
    language: html
    code: |
      <head>
        <link rel="stylesheet" href="style.css">
        <script src="riesig.js"></script>
      </head>
      <body><h1>Hallo</h1></body>
    bug_line: 3
    explanation: Ein Skript ohne defer oder async im head hält den Parser an, bis es geladen und ausgeführt ist. Mit `defer` wäre das Problem gelöst.
tasks:
  - id: pipeline-beschriften
    type: diagram
    title: Beschrifte die Rendering-Pipeline
    description: Setze die fünf Stationen an die richtigen Stellen.
    image: /assets/wie-das-internet-funktioniert/rendering-pipeline-leer.svg
    slots:
      - { x: 31.1, y: 24.4, answer: DOM }
      - { x: 31.1, y: 68.1, answer: CSSOM }
      - { x: 54.4, y: 46.3, answer: Render-Tree }
      - { x: 73.3, y: 46.3, answer: Layout }
      - { x: 91.1, y: 46.3, answer: Paint }
    distractors: [DNS, Cache]
    hints:
      - Aus HTML wird der DOM, aus CSS das CSSOM. Danach geht es nach rechts.
  - id: dom-bauen
    type: terminal
    title: Baue eine Seite mit vorgegebenem DOM
    description: |
      Schreibe im Ordner `dom-bauen` eine Datei `index.html`, deren DOM-Baum so aussieht:

      ```text
      html
      ├── head
      │   └── title   (Text: "Meine Reiseseite")
      └── body
          ├── header
          │   └── h1
          ├── main
          │   └── ul
          │       ├── li
          │       ├── li
          │       └── li
          └── footer
      ```

      1. Beginne mit `<!doctype html>`.
      2. Schreibe die Elemente genau in dieser Verschachtelung, mit drei `<li>` in der `<ul>`.
      3. Prüfe dein Ergebnis mit `cat index.html`.

      Der Ordner wird beim Vorbereiten angelegt – klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: dom-bauen
    setup: |
      printf 'Lege hier index.html an.\n' > LIESMICH.txt
    checks:
      - type: file_contains
        path: index.html
        pattern: "<!(doctype|DOCTYPE) html>"
        message: index.html fehlt oder beginnt nicht mit <!doctype html>.
      - type: file_contains
        path: index.html
        pattern: "<title>Meine Reiseseite</title>"
        message: "Im head fehlt `<title>Meine Reiseseite</title>`."
      - type: command
        run: tr -d '\n' < index.html | grep -Eo '<header>.*<h1>.*</h1>.*</header>.*<main>.*<ul>.*</ul>.*</main>.*<footer>.*</footer>' | wc -l
        stdout_matches: "^\\s*1\\s*$"
        message: Die Reihenfolge stimmt noch nicht – header (mit h1), dann main (mit ul), dann footer.
      - type: command
        run: tr -d '\n' < index.html | grep -o '<li>' | wc -l
        stdout_matches: "^\\s*3\\s*$"
        message: In der Liste sollen genau drei <li>-Elemente stehen.
    hints:
      - "Jedes Element bekommt ein öffnendes und ein schließendes Tag, z. B. `<main>…</main>`."
      - "Mit `nano index.html` kannst du die Datei bequem im Terminal bearbeiten."
    solution: |
      ```bash
      cd dom-bauen
      cat > index.html <<'EOF'
      <!doctype html>
      <html lang="de">
        <head>
          <title>Meine Reiseseite</title>
        </head>
        <body>
          <header>
            <h1>Reise einer Anfrage</h1>
          </header>
          <main>
            <ul>
              <li>DNS</li>
              <li>TCP und TLS</li>
              <li>HTTP</li>
            </ul>
          </main>
          <footer>Stand: 2026</footer>
        </body>
      </html>
      EOF
      ```
  - id: script-im-head
    type: steps
    title: Was passiert als Nächstes beim Rendern?
    description: Der Browser bekommt dieses HTML und beginnt zu parsen.
    steps:
      - situation: "Im `<head>` steht `<link rel=\"stylesheet\" href=\"style.css\">`."
        question: Was macht der Browser?
        options:
          - Er lädt style.css und zeichnet nichts, bevor das CSSOM fertig ist.
          - Er ignoriert CSS bis ganz zum Schluss.
          - Er bricht das Parsen ab.
        answer: 0
        explanation: CSS ist render-blockierend. Ohne CSSOM würde die Seite erst ohne Stil aufblitzen und dann umspringen.
      - situation: "Direkt danach steht `<script src=\"app.js\"></script>` – ohne defer oder async."
        question: Was passiert mit dem Parsen des HTML?
        options:
          - Es läuft ungestört weiter.
          - Es hält an, bis app.js geladen und ausgeführt ist.
          - Das Skript wird übersprungen.
        answer: 1
        explanation: Ein klassisches Skript könnte den DOM per JavaScript verändern. Deshalb wartet der Parser.
      - situation: "Du änderst die Zeile in `<script src=\"app.js\" defer></script>`."
        question: Was ändert sich?
        options:
          - Das Skript wird im Hintergrund geladen und erst nach dem Parsen ausgeführt – der Parser muss nicht warten.
          - Das Skript wird nie ausgeführt.
          - Das Skript läuft jetzt vor dem CSS.
        answer: 0
        explanation: Mit defer kann der Browser das HTML durchparsen und früher etwas anzeigen.
      - situation: Die Seite ist sichtbar. Ein Skript ändert später die Breite einer Box per JavaScript.
        question: Welche Schritte muss der Browser wiederholen?
        options:
          - Gar keine.
          - Layout und Paint (für die betroffenen Bereiche).
          - Die komplette DNS-Auflösung.
        answer: 1
        explanation: Größenänderungen erfordern ein neues Layout (Reflow) und neues Zeichnen. Netzwerk ist dafür nicht nötig.
---

Was der Server schickt, ist nur Text mit spitzen Klammern. Bevor der Browser auch nur einen Pixel zeichnet,
baut er daraus Strukturen, mit denen er rechnen kann, und schickt sie durch eine feste Abfolge von
Schritten: die **Rendering-Pipeline**.

![Vom HTML-Text zu Pixeln](/assets/wie-das-internet-funktioniert/rendering-pipeline.svg)

## Vom HTML zum DOM

Der Browser wandelt die empfangenen Bytes anhand der Zeichenkodierung (meist UTF-8) in Zeichen um. Ein
*Tokenizer* zerlegt sie in Bausteine wie Start-[[html-tag|Tag]] `<h1>`, Text und End-Tag `</h1>`. Der
[[parser|Parser]] setzt daraus einen Baum zusammen – den [[dom|DOM]] (*Document Object Model*):

```text title="HTML und der DOM-Baum dazu"
<body>                          body
  <header><h1>Hallo</h1></header>  ├── header
  <main><p>Willkommen!</p></main>  │   └── h1 → "Hallo"
</body>                         └── main
                                    └── p → "Willkommen!"
```

Wie in einem Stammbaum gibt es Eltern, Kinder und Geschwister. Jeder Knoten ist ein Objekt, das
[[javascript|JavaScript]] lesen und ändern kann. Fehlerhaftes HTML repariert der Browser nach festen Regeln –
nicht immer so, wie du es meinst. Die DevTools zeigen im Tab „Elemente“ immer den DOM, nicht den Quelltext.

## CSSOM und Render-Tree

Aus [[css|CSS]] baut der Browser das [[cssom|CSSOM]]: welche Regel welche Elemente trifft und welche Werte sie
setzt. DOM und CSSOM zusammen ergeben den [[render-tree|Render-Tree]] – nur mit dem, was wirklich sichtbar ist:

| Im DOM | Im Render-Tree? |
|---|---|
| `<h1>` mit Text | Ja |
| `<head>`, `<script>` | Nein |
| Element mit `display: none` | Nein |
| Element mit `visibility: hidden` | Ja – nimmt Platz ein, ist aber unsichtbar |

## Layout, Paint und Compositing

1. **[[layout|Layout]]**: Wo steht jedes Element, wie groß ist es?
2. **[[paint|Paint]]**: Hintergründe, Text und Bilder werden zu Pixeln.
3. **Compositing**: Die Ebenen werden übereinandergelegt und angezeigt.

Das Layout hängt von vielem ab: Fenstergröße, Schriftgröße, Textlänge, Bildgrößen. Deshalb rechnet der
Browser es neu, wenn du das Fenster verkleinerst. Ändert JavaScript später die Breite einer Box, laufen Layout
und Paint erneut; ändert sich nur eine Farbe, reicht Paint. Animationen mit `transform` betreffen oft nur das
Compositing und laufen deshalb besonders flüssig. Lange laufendes JavaScript blockiert diese Arbeit – die Seite ruckelt.

> [!MERKSATZ]
> **DOM + CSSOM → Render-Tree → Layout → Paint → Compositing.** Je weiter vorn eine Änderung ansetzt,
> desto teurer ist sie.

## Der Critical Rendering Path

Alle Schritte bis zum ersten sichtbaren Bild heißen [[critical-rendering-path|Critical Rendering Path]].
Zwei Dinge halten ihn auf:

| Ressource | Verhalten |
|---|---|
| CSS im `<head>` | [[render-blocking\|Render-blockierend]] – ohne CSSOM keine korrekte Darstellung |
| `<script>` ohne Attribute | Hält den Parser an, bis es geladen und ausgeführt ist |
| `<script defer>` | Lädt parallel, läuft nach dem Parsen, in Reihenfolge |
| `<script async>` | Lädt parallel, läuft sofort nach dem Laden |

```html title="Gut: CSS im head, JavaScript mit defer"
<link rel="stylesheet" href="style.css">
<script src="app.js" defer></script>
```

> [!FEHLER]
> Ein großes Skript ohne `defer` im `<head>` lässt die Seite weiß, bis es geladen und ausgeführt ist.

> [!PRAXIS]
> Im Tab „Performance“ der DevTools siehst du, wann der Browser Skripte ausführt, Layout berechnet oder
> zeichnet. Lange Skript-Blöcke vor der ersten Darstellung deuten auf blockierendes JavaScript hin.

## Zusammenfassung

- Der **Parser** baut aus HTML den **DOM**, einen Baum aus Element-Objekten.
- Aus CSS entsteht das **CSSOM**; zusammen ergeben sie den **Render-Tree** (nur Sichtbares).
- **Layout** berechnet Positionen, **Paint** erzeugt Pixel, **Compositing** legt Ebenen übereinander.
- **CSS** blockiert das Rendern, **Skripte ohne defer/async** blockieren den Parser.
- Mit `defer` lädt JavaScript parallel und läuft erst nach dem Parsen.
