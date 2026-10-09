---
title: Das HTML-Dokument
summary: Wie eine HTML-Datei aufgebaut ist – Elemente, Attribute, Verschachtelung, Text und Listen.
duration: 20
sources:
  - title: MDN – Grundlagen von HTML
    url: https://developer.mozilla.org/de/docs/Learn_web_development/Getting_started/Your_first_website/Creating_the_content
  - title: MDN – HTML-Elementreferenz
    url: https://developer.mozilla.org/de/docs/Web/HTML/Reference/Elements
  - title: HTML Living Standard (WHATWG)
    url: https://html.spec.whatwg.org/multipage/
quiz:
  - type: single
    question: Wozu dient `<meta charset="utf-8">` im `<head>`?
    options:
      - Es legt die Schriftart der Seite fest.
      - Es sagt dem Browser, wie die Bytes der Datei in Zeichen übersetzt werden, damit Umlaute richtig erscheinen.
      - Es macht die Seite für Suchmaschinen unsichtbar.
      - Es lädt die Seite schneller.
    answer: 1
    explanation: >
      Eine Datei ist nur eine Folge von Bytes. Die Zeichenkodierung UTF-8 sagt dem Browser, welche Bytes welches
      Zeichen bedeuten. Fehlt sie, werden aus „Grüße“ schnell kryptische Zeichen.
  - type: match
    question: Ordne jedem Element seine Aufgabe zu.
    pairs:
      - { left: "<h1>", right: "Hauptüberschrift der Seite" }
      - { left: "<p>", right: "Ein Absatz Fließtext" }
      - { left: "<ul>", right: "Liste ohne feste Reihenfolge" }
      - { left: "<ol>", right: "Nummerierte Liste" }
      - { left: "<strong>", right: "Besonders wichtiger Text" }
    explanation: >
      Jedes Element sagt etwas über die Bedeutung seines Inhalts. `<ul>` ist eine Aufzählung, bei der die
      Reihenfolge egal ist, `<ol>` eine Schrittfolge, `<strong>` markiert Wichtigkeit – nicht bloß Fettdruck.
  - type: find-bug
    question: Diese Liste wird im Browser seltsam dargestellt. In welcher Zeile steckt der Fehler?
    language: html
    code: |
      <h2>Einkaufsliste</h2>
      <ul>
        <li>Milch</li>
        <li>Brot
        <li>Äpfel</li>
      </ul
    bug_line: 6
    explanation: >
      In Zeile 6 fehlt die schließende spitze Klammer: `</ul` statt `</ul>`. Ein fehlendes `</li>` (Zeile 4) ist
      dagegen erlaubt – HTML schließt Listeneinträge automatisch. Sauberer ist es trotzdem, `</li>` immer zu schreiben.
  - type: cloze
    text: Ein Element besteht aus Start-Tag, Inhalt und End-Tag. Zusatzinformationen wie `lang="de"` heißen ___. Die erste Zeile jeder HTML-Datei ist `<!___ html>`.
    blanks:
      - [Attribute, Attribut]
      - [DOCTYPE, doctype]
    explanation: Attribute stehen immer im Start-Tag als `name="wert"`. `<!DOCTYPE html>` schaltet den Browser in den Standardmodus.
tasks:
  - id: erste-seite
    type: terminal
    title: Deine erste HTML-Seite
    description: |
      Du schreibst eine vollständige HTML-Datei von Hand – mit `nano` oder per `cat > index.html <<'EOF'`.

      1. Wechsle in den Ordner `erste-seite` (er wird beim Vorbereiten angelegt und ist leer).
      2. Lege `index.html` an mit:
         - `<!DOCTYPE html>` in der ersten Zeile,
         - `<html lang="de">`,
         - einem `<head>` mit `<meta charset="utf-8">` und einem `<title>`,
         - einem `<body>` mit genau **einer** `<h1>`, mindestens einem `<p>` und einer `<ul>` mit mindestens drei `<li>`.
      3. Prüfe deine Datei mit `cat index.html`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: erste-seite
    setup: |
      true
    checks:
      - type: file_exists
        path: index.html
        message: Es gibt noch keine Datei index.html im Ordner erste-seite.
      - type: command
        run: head -n 1 index.html | tr 'A-Z' 'a-z'
        stdout_matches: "^\\s*<!doctype html>\\s*$"
        message: Die erste Zeile muss `<!DOCTYPE html>` sein.
      - type: file_contains
        path: index.html
        pattern: "<html[^>]*\\slang=\"de\""
        message: Das html-Element braucht das Attribut lang="de".
      - type: file_contains
        path: index.html
        pattern: "<meta\\s+charset=\"(utf|UTF)-8\""
        message: Im head fehlt `<meta charset="utf-8">`.
      - type: file_contains
        path: index.html
        pattern: "<title>[^<]+</title>"
        message: Im head fehlt ein title mit Text.
      - type: command
        run: grep -o "<h1" index.html | wc -l
        stdout_matches: "^\\s*1\\s*$"
        message: Die Seite soll genau eine h1-Überschrift haben.
      - type: file_contains
        path: index.html
        pattern: "<p>[\\s\\S]*?</p>"
        message: Es fehlt mindestens ein Absatz `<p>…</p>`.
      - type: command
        run: grep -o "<li" index.html | wc -l
        stdout_matches: "^\\s*([3-9]|[1-9][0-9]+)\\s*$"
        message: Die Liste braucht mindestens drei `<li>`-Einträge.
      - type: file_contains
        path: index.html
        pattern: "<ul>[\\s\\S]*<li>[\\s\\S]*</ul>"
        message: Die Listeneinträge müssen in einem `<ul>…</ul>` stehen.
    hints:
      - Schreib zuerst das Grundgerüst aus dem Abschnitt „Das Grundgerüst“ ab und fülle dann den body.
      - "`cat > index.html <<'EOF'` startet die Eingabe, eine Zeile nur mit `EOF` beendet sie."
      - "Jede Listenzeile sieht so aus: `<li>HTML</li>` – und alle stehen zwischen `<ul>` und `</ul>`."
    solution: |
      ```bash
      cd erste-seite
      cat > index.html <<'EOF'
      <!DOCTYPE html>
      <html lang="de">
        <head>
          <meta charset="utf-8">
          <title>Meine erste Seite</title>
        </head>
        <body>
          <h1>Hallo Web!</h1>
          <p>Das ist meine <strong>erste</strong> eigene HTML-Seite.</p>
          <ul>
            <li>HTML</li>
            <li>CSS</li>
            <li>Tailwind</li>
          </ul>
        </body>
      </html>
      EOF
      cat index.html
      ```
  - id: grundgeruest-ordnen
    type: order
    title: Das Grundgerüst in die richtige Reihenfolge bringen
    description: Bringe die Zeilen eines minimalen HTML-Dokuments in die Reihenfolge, in der sie in der Datei stehen.
    items:
      - "<!DOCTYPE html>"
      - "<html lang=\"de\">"
      - "<head>"
      - "<meta charset=\"utf-8\">"
      - "<title>Startseite</title>"
      - "</head>"
      - "<body> … sichtbarer Inhalt … </body>"
      - "</html>"
    hints:
      - Der head kommt vor dem body. Alles außer dem DOCTYPE steckt im html-Element.
---
Du öffnest eine Webseite und siehst Überschriften, Texte und Listen. Der Browser hat dafür eine ganz normale
Textdatei geladen – voller spitzer Klammern. In dieser Lektion schreibst du so eine Datei selbst und verstehst
jede Zeile darin.

## Was HTML eigentlich ist

[[html|HTML]] (*Hypertext Markup Language*) ist keine Programmiersprache, sondern eine **Auszeichnungssprache**.
Du rechnest nichts aus, du **markierst** Text: „Das hier ist eine Überschrift, das ein Absatz, das eine Liste.“

Stell dir einen Zeitungsartikel vor, den du mit Textmarkern bearbeitest: gelb für Überschriften, grün für
Zitate. HTML macht dasselbe mit [[html-tag|Tags]] in spitzen Klammern.

```html
<h1>Willkommen</h1>
<p>Schön, dass du da bist.</p>
```

| Teil | Beispiel | Bedeutung |
|---|---|---|
| Start-Tag | `<p>` | Hier beginnt ein Absatz |
| Inhalt | `Schön, dass …` | Was im Element steht |
| End-Tag | `</p>` | Hier endet der Absatz |
| Element | alles zusammen | Ein Baustein der Seite |

Der [[browser|Browser]] liest diese Markierungen und baut daraus den [[dom|DOM]] – einen Baum aus Elementen,
den er anschließend zeichnet. Wie es aussieht, entscheidet später [[css|CSS]].

> [!MERKSATZ]
> HTML beschreibt die **Bedeutung** von Inhalten, nicht ihr Aussehen. Eine `<h1>` ist „die wichtigste
> Überschrift“ – dass sie groß und fett erscheint, ist nur die Voreinstellung des Browsers.

## Attribute und Verschachtelung

Viele Elemente brauchen Zusatzinformationen. Die stehen als [[attribut|Attribute]] im Start-Tag, immer in der
Form `name="wert"`:

```html
<a href="https://example.com" title="Zur Beispielseite">Beispiel</a>
<img src="foto.jpg" alt="Porträt von Ada">
```

`<img>` hat kein End-Tag – es umschließt keinen Inhalt. Solche Elemente heißen **leere Elemente**
(*void elements*), weitere sind `<meta>`, `<link>`, `<br>` und `<input>`.

Elemente stecken ineinander wie russische Puppen. Wichtig: **Was zuletzt geöffnet wurde, wird zuerst
geschlossen.**

```html
<p>Das ist <strong>sehr wichtig</strong>.</p>      <!-- richtig -->
<p>Das ist <strong>sehr wichtig</p></strong>.      <!-- falsch verschachtelt -->
```

Damit du die Struktur auf einen Blick siehst, rückst du Kindelemente mit zwei Leerzeichen ein. Dem Browser
ist das egal, dir und deinem Team nicht.

> [!FEHLER]
> **Falsch verschachtelte Tags.** Der Browser „repariert“ sie stillschweigend – oft anders, als du denkst.
> Das Ergebnis sind Layoutfehler, die schwer zu finden sind. Schließe Tags immer in umgekehrter Reihenfolge.

## Das Grundgerüst

Jede HTML-Seite hat dasselbe Gerüst:

```html title="index.html"
<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Meine Seite</title>
  </head>
  <body>
    <h1>Hallo Web!</h1>
  </body>
</html>
```

| Zeile | Wozu? |
|---|---|
| `<!DOCTYPE html>` | Der [[doctype\|Doctype]] schaltet den Browser in den modernen Standardmodus. |
| `<html lang="de">` | Wurzelelement; `lang` sagt Screenreadern und Übersetzern, welche Sprache gesprochen wird. |
| `<head>` | Unsichtbare Infos *über* die Seite: Kodierung, Titel, Stylesheets. |
| `<meta charset="utf-8">` | Die [[zeichenkodierung\|Zeichenkodierung]] – damit „ä“ und „€“ korrekt erscheinen. |
| `<meta name="viewport" …>` | Sorgt dafür, dass Smartphones die Seite nicht verkleinert darstellen (mehr im Responsive-Kapitel). |
| `<title>` | Text im Browser-Tab und in Suchergebnissen. |
| `<body>` | Alles, was du auf der Seite siehst. |

> [!TIPP]
> Viele Editoren erzeugen das Gerüst mit `!` und der Tab-Taste (Emmet). Tippe es trotzdem ein paarmal selbst –
> dann erkennst du sofort, wenn etwas fehlt.

## Text strukturieren: Überschriften, Absätze, Hervorhebungen

Für Text brauchst du nur eine Handvoll Elemente:

```html
<h1>Rezepte</h1>
<h2>Pfannkuchen</h2>
<p>Ein <strong>schnelles</strong> Frühstück für <em>jeden</em> Tag.</p>
<p>Zeile eins<br>Zeile zwei</p>
```

| Element | Bedeutung |
|---|---|
| `<h1>` … `<h6>` | Überschriften der Ebenen 1 bis 6 |
| `<p>` | Absatz |
| `<strong>` | Wichtiger Inhalt (meist fett dargestellt) |
| `<em>` | Betonung, wie beim Vorlesen (meist kursiv) |
| `<br>` | Zeilenumbruch innerhalb eines Absatzes – sparsam verwenden |

Zeilenumbrüche und mehrere Leerzeichen im Quelltext ignoriert der Browser: Er fasst jeden Weißraum zu
einem Leerzeichen zusammen. Einen neuen Absatz bekommst du nur mit einem neuen `<p>`.

## Listen

Listen gibt es in zwei Sorten – und die Wahl hat eine Bedeutung:

```html
<ul>
  <li>HTML</li>
  <li>CSS</li>
</ul>

<ol>
  <li>Ordner anlegen</li>
  <li>index.html schreiben</li>
  <li>Im Browser öffnen</li>
</ol>
```

- `<ul>` (*unordered list*): Reihenfolge egal – Zutaten, Fähigkeiten, Menüpunkte.
- `<ol>` (*ordered list*): Reihenfolge zählt – Anleitungen, Rankings.
- `<li>` (*list item*) ist ein einzelner Eintrag und steht immer direkt in `<ul>` oder `<ol>`.

Listen dürfen verschachtelt werden: Ein `<li>` kann selbst wieder eine `<ul>` enthalten, etwa für Untermenüs.

> [!PRAXIS]
> In echten Projekten ist fast jede Navigation technisch eine `<ul>` mit Links. Screenreader sagen dann
> „Liste mit fünf Einträgen“ an – Nutzer:innen wissen sofort, wie viele Menüpunkte es gibt.

## Zusammenfassung

- HTML markiert die **Bedeutung** von Inhalten mit Elementen aus Start-Tag, Inhalt und End-Tag.
- Attribute wie `href`, `src` oder `lang` stehen im Start-Tag als `name="wert"`.
- Elemente werden verschachtelt; was zuletzt geöffnet wurde, wird zuerst geschlossen.
- Das Grundgerüst: Doctype, `html` mit `lang`, `head` mit `charset`, `viewport` und `title`, dann `body`.
- Überschriften `h1`–`h6`, Absätze `p`, Hervorhebungen `strong` und `em`.
- `ul` für Aufzählungen, `ol` für Reihenfolgen, `li` für jeden Eintrag.
