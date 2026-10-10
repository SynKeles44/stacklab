---
title: Den DOM lesen und verändern
summary: Wie der Browser aus HTML einen Baum aus Objekten baut, wie du Elemente mit querySelector findest, Inhalte sicher mit textContent setzt und neue Elemente erzeugst.
duration: 25
sources:
  - title: MDN – Introduction to the DOM
    url: https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction
  - title: MDN – Document.querySelector()
    url: https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector
  - title: MDN – Node.textContent
    url: https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent
  - title: MDN – Element.classList
    url: https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
  - title: MDN – HTMLElement.dataset
    url: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset
quiz:
  - type: single
    question: "Was liefert `document.querySelector(\".karte\")`, wenn es fünf Elemente mit der Klasse `karte` gibt?"
    options: ["Alle fünf als Array", "Das erste passende Element", "Das letzte passende Element", "null"]
    answer: 1
    explanation: querySelector liefert das erste Element in Dokumentreihenfolge. Alle bekommst du mit querySelectorAll – als NodeList, nicht als Array.
  - type: multiple
    question: "Ein Nutzer gibt als Namen `<img src=x onerror=\"alert(1)\">` ein. Welche Zeilen zeigen den Namen gefahrlos an?"
    options:
      - "element.textContent = name;"
      - "element.innerHTML = name;"
      - "element.innerHTML = `<b>${name}</b>`;"
      - "const b = document.createElement(\"b\"); b.textContent = name; element.append(b);"
    answers: [0, 3]
    explanation: textContent behandelt alles als reinen Text. innerHTML interpretiert den Text als HTML – das eingeschleuste Bild führt sein onerror-Skript aus (XSS).
  - type: match
    question: Ordne jeder Aufgabe die passende DOM-Methode zu.
    pairs:
      - { left: "Klasse an- und ausschalten", right: "element.classList.toggle(\"aktiv\")" }
      - { left: "data-id=\"7\" auslesen", right: "element.dataset.id" }
      - { left: "Nächsten Vorfahren mit Klasse finden", right: "element.closest(\".karte\")" }
      - { left: "Element entfernen", right: "element.remove()" }
    explanation: Diese vier Methoden brauchst du fast in jedem Projekt.
  - type: find-bug
    question: "Das Skript steht als klassisches `<script src=\"app.js\">` im `<head>` und meldet `Cannot set properties of null`. Welche Zeile wirft den Fehler?"
    language: js
    code: |
      const titel = document.querySelector("#titel");
      const name = "Ada";
      titel.textContent = `Hallo ${name}`;
    bug_line: 3
    explanation: "Das Skript läuft, bevor der Browser das `<h1 id=\"titel\">` gelesen hat. querySelector liefert null, Zeile 3 greift auf null zu. Lösung: `type=\"module\"` oder `defer` benutzen – dann läuft das Skript erst nach dem Parsen."
tasks:
  - id: dom-baum
    type: diagram
    title: Beschrifte den DOM-Baum
    description: |
      Der Browser hat dieses HTML in einen DOM-Baum verwandelt:

      ```html
      <html>
        <head><title>Meine Liste</title></head>
        <body>
          <h1>Lernplan</h1>
          <ul id="liste"><li>JavaScript</li></ul>
        </body>
      </html>
      ```

      Ziehe die Beschriftungen an die leeren Knoten.
    image: /assets/javascript/dom-baum-leer.svg
    slots:
      - { x: 50, y: 34.9, answer: html }
      - { x: 27.5, y: 53.5, answer: head }
      - { x: 72.5, y: 53.5, answer: body }
      - { x: 85, y: 72.1, answer: "ul#liste" }
      - { x: 27.5, y: 89.5, answer: "Text: Meine Liste" }
    distractors: [div, script, "Text: Lernplan"]
    hints:
      - Jedes Element wird ein Knoten, sein Inhalt ein Kindknoten. Auch reiner Text ist ein eigener Knoten.
  - id: dom-liste
    type: terminal
    title: Eine Liste per JavaScript füllen
    description: |
      Im Ordner `dom-liste` baust du eine Seite, die ihre Liste selbst erzeugt. Der Ordner ist leer.

      1. Lege `index.html` an mit einem `<ul id="liste"></ul>` und einem Modul-Skript:
         `<script type="module" src="./liste.js"></script>`.
      2. Lege `liste.js` an. Darin steht das Array `const sprachen = ["HTML", "CSS", "JavaScript"];`.
      3. Hole die Liste mit `document.querySelector("#liste")`.
      4. Erzeuge für jede Sprache mit `document.createElement("li")` ein Element, setze den Text mit
         `textContent` (nicht `innerHTML`) und hänge es mit `append` an die Liste.
      5. Gib der Liste am Ende mit `classList.add` die Klasse `fertig`.

      Die Prüfung führt `liste.js` mit einem nachgebauten `document` aus. Wenn du magst, öffnest du die Seite
      danach mit `npx serve` in deinem Browser.
    workdir: dom-liste
    checks:
      - type: file_contains
        path: index.html
        pattern: "<ul[^>]*id=[\"']liste[\"']"
        message: In index.html fehlt <ul id="liste">.
      - type: file_contains
        path: index.html
        pattern: "<script(?=[^>]*type=[\"']module[\"'])(?=[^>]*src=[\"'](\\./)?liste\\.js[\"'])"
        message: index.html soll liste.js als Modul einbinden – <script type="module" src="./liste.js">.
      - type: command
        run: node --check liste.js
        message: liste.js enthält einen Syntaxfehler. Die Ausgabe zeigt dir die Zeile.
      - type: command
        run: |
          node -e '
          const klassen = new Set();
          const el = (tag) => ({ tagName: tag.toUpperCase(), textContent: "", innerHTML: "", children: [],
            classList: { add: (...k) => k.forEach((x) => klassen.add(x)), remove() {}, toggle() {} },
            append(...k) { this.children.push(...k); }, appendChild(k) { this.children.push(k); return k; } });
          const liste = el("ul");
          globalThis.document = { querySelector: (s) => (s === "#liste" ? liste : null),
            getElementById: (id) => (id === "liste" ? liste : null), createElement: el };
          import("./liste.js").then(() => console.log(liste.children.map((k) => k.tagName + ":" + k.textContent).join(",") + "|" + [...klassen].join(",")));
          '
        stdout_equals: "LI:HTML,LI:CSS,LI:JavaScript|fertig"
        message: liste.js soll drei li-Elemente mit den Texten HTML, CSS und JavaScript (über textContent) an #liste anhängen und der Liste die Klasse fertig geben.
      - type: command
        run: grep -c "innerHTML" liste.js
        expect_exit: 1
        message: Verzichte in liste.js auf innerHTML – setze den Text mit textContent.
    hints:
      - "Mit `for (const sprache of sprachen) { … }` oder `sprachen.forEach(…)` gehst du alle Sprachen durch."
      - "`const li = document.createElement(\"li\"); li.textContent = sprache; liste.append(li);`"
      - "Ganz am Ende: `liste.classList.add(\"fertig\");`"
    solution: |
      ```bash
      cat > index.html <<'EOF'
      <!doctype html>
      <html lang="de">
        <head>
          <meta charset="utf-8">
          <title>Lernplan</title>
          <script type="module" src="./liste.js"></script>
        </head>
        <body>
          <h1>Lernplan</h1>
          <ul id="liste"></ul>
        </body>
      </html>
      EOF
      cat > liste.js <<'EOF'
      const sprachen = ["HTML", "CSS", "JavaScript"];
      const liste = document.querySelector("#liste");

      for (const sprache of sprachen) {
        const li = document.createElement("li");
        li.textContent = sprache;
        liste.append(li);
      }

      liste.classList.add("fertig");
      EOF
      ```
---
Du hast eine Liste von Aufgaben in einem Array und willst sie auf der Seite anzeigen. HTML allein kann das
nicht: Es beschreibt einen festen Zustand. Sobald sich etwas ändern soll – ein Eintrag kommt dazu, ein Haken
wird gesetzt –, brauchst du JavaScript, das die Seite verändert. Die Schnittstelle dafür ist der DOM.

## Vom HTML zum DOM-Baum

Wenn der [[browser|Browser]] eine Seite lädt, liest er das [[html|HTML]] und baut daraus einen Baum aus
Objekten: das Document Object Model, kurz [[dom|DOM]]. Jedes Element wird ein [[dom-knoten|Knoten]], sein
Inhalt wird zu Kindknoten. Selbst reiner Text ist ein eigener Knoten.

![Der DOM-Baum einer kleinen Seite: document, html, head und body, darunter title, h1, ul und li sowie ein Textknoten.](/assets/javascript/dom-baum.svg)

Der Einstiegspunkt ist das globale Objekt `document`. Von dort erreichst du jeden Knoten – und jede Änderung
am Baum zeigt der Browser sofort an.

| Begriff | Bedeutung |
|---|---|
| Knoten (*Node*) | jeder Punkt im Baum: Element, Text, Kommentar |
| Element | ein Knoten für ein [[html-tag\|HTML-Tag]], z. B. `<li>` |
| Elternknoten / Kinder | die Ebene darüber / darunter |
| `document` | die Wurzel, über die du alles erreichst |

> [!MERKSATZ]
> Der DOM ist nicht dein HTML-Quelltext, sondern die lebendige Objekt-Version davon. JavaScript ändert den
> DOM – die HTML-Datei bleibt unverändert.

## Elemente finden

Am vielseitigsten ist [[queryselector|`querySelector`]]: Du übergibst einen CSS-[[selektor|Selektor]] und bekommst das
**erste** passende Element – oder `null`.

```js
const titel = document.querySelector("#titel");             // nach id
const ersteKarte = document.querySelector(".karte");          // nach Klasse
const knoepfe = document.querySelectorAll("button.loeschen"); // alle Treffer als NodeList
const formular = document.querySelector("form[name='login']");

for (const knopf of knoepfe) {        // eine NodeList kannst du mit for…of durchlaufen
  knopf.disabled = true;
}
const alsArray = [...knoepfe];       // für map, filter & Co. in ein Array umwandeln
```

Du kannst auch innerhalb eines Elements suchen: `karte.querySelector("h2")`. Und `element.closest(".karte")`
sucht den nächsten **Vorfahren**, der zum Selektor passt – das brauchst du bei Events ständig.

> [!FEHLER]
> Ein klassisches `<script>` im `<head>` läuft, bevor der Rest der Seite gelesen ist – `querySelector` liefert
> dann `null`. Binde Skripte mit `type="module"` (oder `defer`) ein; dann laufen sie erst nach dem Parsen.

## Inhalte ändern – sicher

Für Text gibt es zwei Wege, und der Unterschied ist sicherheitsrelevant:

| Eigenschaft | Wirkung | Wann? |
|---|---|---|
| `textContent` | setzt reinen Text, `<` bleibt ein Zeichen | fast immer |
| [[innerhtml\|`innerHTML`]] | wertet den Text als HTML aus | nur für eigenen, festen HTML-Code |

```js
const name = '<img src="x" onerror="alert(\'gehackt\')">';   // Eingabe eines Nutzers
ausgabe.textContent = `Hallo ${name}`;   // sicher: wird als Text angezeigt
ausgabe.innerHTML = `Hallo ${name}`;     // GEFÄHRLICH: das Skript wird ausgeführt
```

Gelangt Text von Nutzern oder aus einer Schnittstelle in `innerHTML`, können Angreifer eigenes JavaScript in
deine Seite schleusen. Diese Angriffsart heißt [[xss|Cross-Site-Scripting (XSS)]].

> [!FEHLER]
> `liste.innerHTML += "<li>" + eintrag + "</li>"` ist doppelt schlecht: unsicher bei fremden Daten und
> langsam, weil der Browser die ganze Liste neu aufbaut. Erzeuge Elemente stattdessen mit `createElement`.

## Attribute, Klassen und data-Attribute

Aussehen und Zustand steuerst du meist über CSS-Klassen. `classList` bietet dafür passende Methoden:

```js
karte.classList.add("aktiv");
karte.classList.remove("versteckt");
karte.classList.toggle("erledigt", aufgabe.erledigt);   // an, wenn das zweite Argument true ist
console.log(karte.classList.contains("aktiv"));          // true

link.setAttribute("href", "https://example.com");
bild.alt = "Diagramm der Umsätze";                       // viele Attribute gibt es als Eigenschaft
```

Eigene Daten hängst du mit `data-`-Attributen an Elemente. Im JavaScript liest du sie über
[[dataset|`dataset`]] – aus `data-aufgaben-id` wird `dataset.aufgabenId`. Werte in `dataset` sind immer
Strings.

```html
<li data-aufgaben-id="7" data-prioritaet="hoch">Einkaufen</li>
```

```js
const li = document.querySelector("li");
console.log(li.dataset.aufgabenId, Number(li.dataset.aufgabenId) + 1);   // "7" 8
```

## Neue Elemente erzeugen und entfernen

Mit `document.createElement` erzeugst du ein Element, befüllst es und hängst es an:

```js
function erzeugeEintrag(aufgabe) {
  const li = document.createElement("li");
  li.textContent = aufgabe.titel;
  li.dataset.id = aufgabe.id;
  li.classList.toggle("erledigt", aufgabe.erledigt);
  return li;
}

const liste = document.querySelector("#liste");
liste.append(...aufgaben.map(erzeugeEintrag));   // append nimmt beliebig viele Knoten
liste.querySelector("li")?.remove();             // erstes li entfernen
liste.replaceChildren();                          // alle Kinder entfernen
```

`append` hängt hinten an, `prepend` vorne, `before`/`after` neben ein Element. Ein bewährtes Muster für
dynamische Listen: Funktion für **einen** Eintrag schreiben, bei jeder Änderung mit `replaceChildren` die
ganze Liste neu befüllen.

> [!PRAXIS]
> Frameworks wie [[react|React]] machen genau das für dich: Du beschreibst, wie die Oberfläche für einen
> Zustand aussieht, und das Framework erledigt `createElement`, `append` und `remove`. Wer den DOM versteht,
> versteht auch, was React im Hintergrund tut.

## Zusammenfassung

- Der Browser baut aus HTML den DOM – einen Baum aus Knoten mit `document` als Einstieg.
- `querySelector` liefert das erste passende Element oder `null`, `querySelectorAll` eine NodeList.
- `textContent` ist für Text immer die sichere Wahl; `innerHTML` mit fremden Daten öffnet XSS-Lücken.
- `classList` schaltet Klassen, `dataset` liest `data-`-Attribute (immer als String).
- `createElement` + `append` erzeugen neue Elemente, `remove` und `replaceChildren` entfernen sie.
- Skripte mit `type="module"` laufen erst, wenn das HTML gelesen ist.
