---
title: Code aufteilen mit ES-Modulen
summary: Benannte und Standard-Exporte, Importe mit Umbenennung und Namensraum, Module im Browser und in Node.js sowie dynamisches Nachladen mit import().
duration: 20
sources:
  - title: MDN – JavaScript modules
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
  - title: MDN – export
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export
  - title: MDN – import()
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import
  - title: Node.js – ECMAScript modules
    url: https://nodejs.org/docs/latest-v24.x/api/esm.html
quiz:
  - type: match
    question: Ordne jedem Import zu, was er importiert.
    pairs:
      - { left: "import { summe } from \"./mathe.js\"", right: "den benannten Export summe" }
      - { left: "import mathe from \"./mathe.js\"", right: "den Standard-Export" }
      - { left: "import * as mathe from \"./mathe.js\"", right: "alle Exporte als ein Objekt" }
      - { left: "import { summe as plus } from \"./mathe.js\"", right: "summe unter dem Namen plus" }
    explanation: Geschweifte Klammern stehen für benannte Exporte. Ohne Klammern kommt der Standard-Export, mit `* as` ein Namensraum-Objekt.
  - type: single
    question: "Zwei Dateien importieren beide `./zaehler.js`, das beim Laden `console.log(\"geladen\")` ausführt. Wie oft erscheint „geladen“?"
    options: ["Einmal", "Zweimal", "Gar nicht", "Je nach Browser"]
    answer: 0
    explanation: Ein Modul wird pro Seite (bzw. pro Node-Prozess) genau einmal ausgewertet. Alle Importe teilen sich dieselbe Instanz.
  - type: multiple
    question: Was gilt für `<script type="module">` im Browser?
    options:
      - Der Code läuft automatisch im strikten Modus.
      - Variablen auf oberster Ebene landen nicht im globalen Gültigkeitsbereich.
      - Das Skript wird wie mit defer erst nach dem Parsen des HTML ausgeführt.
      - Die Seite funktioniert zuverlässig, wenn du sie per Doppelklick als file:// öffnest.
    answers: [0, 1, 2]
    explanation: Module brauchen aus Sicherheitsgründen einen Webserver; über file:// blockiert der Browser die Importe.
  - type: find-bug
    question: "Das Projekt hat `\"type\": \"module\"` in der package.json. Welche Zeile lässt `node app.js` scheitern?"
    language: js
    code: |
      import { readFile } from "node:fs/promises";
      import { parse } from "./lib/parser";
      const text = await readFile("daten.txt", "utf8");
      console.log(parse(text));
    bug_line: 2
    explanation: "In Node.js und im Browser brauchen relative Importe die vollständige Dateiendung: `./lib/parser.js`. Top-Level-await in Zeile 3 ist in ES-Modulen dagegen erlaubt."
tasks:
  - id: preis-modul
    type: terminal
    title: Dein erstes eigenes Modul
    description: |
      Du baust im Ordner `preis-modul` ein kleines Projekt aus zwei Modulen. Der Ordner ist leer – ein
      Setup gibt es nicht.

      1. Lege eine `package.json` an und setze `"type": "module"`.
      2. Lege `lib/preise.js` an mit
         - dem benannten Export `MWST` mit dem Wert `0.19`,
         - dem benannten Export `brutto(netto)`, der `netto * (1 + MWST)` auf zwei Nachkommastellen gerundet
           zurückgibt (`brutto(10)` ergibt `11.9`),
         - einem **Standard-Export** `formatiere(betrag)`, der den Betrag mit zwei Nachkommastellen und
           Eurozeichen liefert (`formatiere(11.9)` ergibt `"11.90 €"`).
      3. Lege `main.js` an, importiere beides aus `./lib/preise.js` und gib `formatiere(brutto(10))` mit
         `console.log` aus.
      4. Starte `node main.js` – es soll `11.90 €` erscheinen.
    workdir: preis-modul
    checks:
      - type: command
        run: jq -r '.type' package.json
        stdout_equals: module
        message: 'In der package.json fehlt "type": "module".'
      - type: command
        run: node -e 'import("./lib/preise.js").then((m) => console.log(m.MWST, m.brutto(10), m.brutto(0), m.brutto(19.99)))'
        stdout_equals: "0.19 11.9 0 23.79"
        message: lib/preise.js soll MWST (0.19) und brutto() als benannte Exporte haben. brutto(10) muss 11.9 und brutto(19.99) muss 23.79 ergeben.
      - type: command
        run: node -e 'import("./lib/preise.js").then((m) => console.log(typeof m.default, m.default(11.9), m.default(3)))'
        stdout_equals: "function 11.90 € 3.00 €"
        message: Der Standard-Export von lib/preise.js soll formatiere() sein und z. B. "3.00 €" liefern.
      - type: file_contains
        path: main.js
        pattern: "from\\s+[\"']\\./lib/preise\\.js[\"']"
        message: main.js soll aus "./lib/preise.js" importieren – mit Dateiendung.
      - type: command
        run: node main.js
        stdout_equals: "11.90 €"
        message: node main.js soll genau "11.90 €" ausgeben.
    hints:
      - "`npm init -y` und danach `npm pkg set type=module` erledigen Schritt 1."
      - "Runden auf zwei Stellen: `Math.round(netto * (1 + MWST) * 100) / 100`. Formatieren: `` `${betrag.toFixed(2)} €` ``."
      - "In main.js: `import formatiere, { brutto } from \"./lib/preise.js\";` – Standard-Export zuerst, benannte in Klammern."
    solution: |
      ```bash
      npm init -y
      npm pkg set type=module
      mkdir -p lib
      cat > lib/preise.js <<'EOF'
      export const MWST = 0.19;

      export function brutto(netto) {
        return Math.round(netto * (1 + MWST) * 100) / 100;
      }

      export default function formatiere(betrag) {
        return `${betrag.toFixed(2)} €`;
      }
      EOF
      cat > main.js <<'EOF'
      import formatiere, { brutto } from "./lib/preise.js";

      console.log(formatiere(brutto(10)));
      EOF
      node main.js
      ```
  - id: module-auswerten
    type: steps
    title: Wann läuft welcher Modul-Code?
    description: |
      Gegeben sind drei Dateien. `config.js` enthält `console.log("config"); export const sprache = "de";`.
      `a.js` enthält `import { sprache } from "./config.js"; console.log("a", sprache);`.
      `main.js` enthält `import "./a.js"; import { sprache } from "./config.js"; console.log("main", sprache);`.
      Du startest `node main.js`.
    steps:
      - situation: Node lädt main.js und findet zuerst `import "./a.js"`.
        question: Was passiert, bevor eine Zeile von main.js läuft?
        options:
          - Alle Importe werden geladen und ausgewertet – abhängige Module zuerst.
          - main.js läuft bis zur ersten Verwendung, dann wird nachgeladen.
          - Node lädt nur a.js, config.js wird ignoriert.
        answer: 0
        explanation: Importe sind statisch. Node baut erst den kompletten Abhängigkeitsgraphen auf und wertet die Module von den Blättern her aus.
      - situation: a.js importiert config.js, das noch nicht ausgewertet wurde.
        question: Was erscheint zuerst in der Konsole?
        options: ["a de", "config", "main de"]
        answer: 1
        explanation: config.js ist eine Abhängigkeit von a.js und wird deshalb vorher ausgewertet.
      - situation: Jetzt kommt main.js beim zweiten Import an – ebenfalls config.js.
        question: Wird „config“ noch einmal ausgegeben?
        options: ["Ja, jeder Import führt die Datei erneut aus", "Nein, das Modul ist bereits ausgewertet und wird wiederverwendet"]
        answer: 1
        explanation: Jedes Modul wird nur einmal ausgewertet. Die komplette Ausgabe lautet config, a de, main de.
---
Dein Skript ist auf 800 Zeilen angewachsen. Funktionen für Preise, für das Formular und für die Anzeige
stehen bunt gemischt in einer Datei, und jede Variable ist überall sichtbar. Ändert jemand `name`, bricht
an einer ganz anderen Stelle etwas. Die Lösung heißt Module: Jede Datei bekommt einen eigenen
Gültigkeitsbereich und gibt nur frei, was andere wirklich brauchen.

## Warum Module?

Früher band man mehrere Skripte einfach nacheinander ein. Alle teilten sich einen globalen Gültigkeitsbereich,
und die Reihenfolge der `<script>`-Tags entschied, ob etwas funktionierte. Ein [[modul|Modul]] löst beide
Probleme:

- **Eigener Gültigkeitsbereich:** Was du nicht exportierst, bleibt privat.
- **Ausdrückliche Abhängigkeiten:** `import` sagt, was eine Datei braucht – die Reihenfolge ergibt sich daraus.
- **Einmalige Auswertung:** Jedes Modul läuft nur einmal, alle Importe teilen sich das Ergebnis.

Der offizielle Standard heißt [[es-module|ES-Module]] (ESM). Daneben findest du in älterem Node-Code noch
[[commonjs|CommonJS]] mit `require()` und `module.exports`. Neue Projekte nutzen ESM.

## export und import

Es gibt zwei Arten von Exporten. Ein Modul kann beliebig viele [[benannter-export|benannte Exporte]] und
höchstens einen [[standard-export|Standard-Export]] haben:

```js title="lib/mathe.js"
export const PI = 3.14159;
export function summe(...zahlen) {
  return zahlen.reduce((s, z) => s + z, 0);
}
export default function runde(zahl, stellen = 2) {
  const faktor = 10 ** stellen;
  return Math.round(zahl * faktor) / faktor;
}
```

```js title="main.js"
import runde, { summe, PI as kreiszahl } from "./lib/mathe.js";
import * as mathe from "./lib/mathe.js";       // alles als Objekt

console.log(runde(summe(1.234, 2)));           // 3.23
console.log(mathe.PI === kreiszahl);           // true
```

| Schreibweise | Bedeutung |
|---|---|
| `import { a, b } from …` | benannte Exporte, Namen müssen passen |
| `import x from …` | Standard-Export, Name frei wählbar |
| `import { a as b } from …` | umbenennen |
| `import * as ns from …` | alle Exporte als Objekt |
| `export { a } from "./a.js"` | weiterreichen (z. B. in einer `index.js`) |

> [!MERKSATZ]
> Benannte Exporte importierst du **mit** geschweiften Klammern, den Standard-Export **ohne**.

## Module im Browser

Im Browser kennzeichnest du ein Modul mit `type="module"`. Weitere Module lädt es dann selbst über `import`:

```html title="index.html"
<script type="module" src="./src/app.js"></script>
```

Module verhalten sich anders als klassische Skripte:

| Eigenschaft | Klassisches Skript | Modul |
|---|---|---|
| Gültigkeitsbereich | global | eigener pro Datei |
| [[js-strict-mode\|Strikter Modus]] | nur mit `"use strict"` | immer |
| Ausführung | sofort, blockiert das Parsen | nach dem Parsen (wie `defer`) |
| Öffnen per `file://` | funktioniert | wird vom Browser blockiert |

Für Module brauchst du deshalb einen lokalen Webserver, etwa `npx serve` oder einen Dev-Server wie [[vite|Vite]].

> [!FEHLER]
> `import { x } from "./helfer"` ohne `.js` funktioniert im Browser nicht – er lädt exakt die angegebene
> [[url|URL]]. Bundler wie Vite ergänzen Endungen, der Browser nicht.

## Module in Node.js

Node.js behandelt eine Datei als ES-Modul, wenn sie auf `.mjs` endet oder in der nächsten
[[package-json|package.json]] `"type": "module"` steht. Dann gilt:

- Relative Importe brauchen die Dateiendung: `./lib/preise.js`.
- Eingebaute Module importierst du mit Präfix: `import { readFile } from "node:fs/promises";`.
- `await` ist auf oberster Ebene erlaubt (Top-Level-await).
- `import.meta.dirname` liefert den Ordner der aktuellen Datei (statt `__dirname` aus CommonJS).

```js title="liste.js"
import { readdir } from "node:fs/promises";

const dateien = await readdir(import.meta.dirname);
console.log(dateien.filter((name) => name.endsWith(".js")));
```

## Dynamisches Nachladen und Live-Bindings

Normale Importe stehen ganz oben und werden vor dem Start geladen. Mit dem [[dynamischer-import|dynamischen
Import]] `import()` lädst du ein Modul erst bei Bedarf. Er liefert ein [[promise|Promise]] mit allen Exporten:

```js
const knopf = document.querySelector("#diagramm-zeigen");
knopf.addEventListener("click", async () => {
  const { zeichneDiagramm } = await import("./diagramm.js");   // erst beim Klick laden
  zeichneDiagramm();
});
```

Noch eine Besonderheit: Importierte Namen sind [[live-binding|Live-Bindings]]. Ändert das exportierende Modul
seine Variable, sehen alle Importe den neuen Wert. Du selbst darfst einen Import aber nicht neu zuweisen –
`summe = 5` nach `import { summe }` ist ein Fehler.

> [!PRAXIS]
> In Frontend-Projekten ist ein Modul pro Thema üblich: `api.js` für Netzwerkzugriffe, `format.js` für
> Formatierungen, `app.js` für den DOM. Dynamische Importe nutzt man für große, selten gebrauchte Teile wie
> Diagramm-Bibliotheken – so startet die Seite schneller.

## Zusammenfassung

- Jedes ES-Modul hat einen eigenen Gültigkeitsbereich und wird genau einmal ausgewertet.
- Benannte Exporte importierst du mit `{ }`, den einen Standard-Export ohne Klammern.
- Im Browser: `<script type="module">`, immer strikt, ausgeführt nach dem Parsen, nur über einen Webserver.
- In Node.js: `"type": "module"` oder `.mjs`, Dateiendungen bei relativen Importen, `node:`-Präfix.
- `import()` lädt Module bei Bedarf und liefert ein Promise.
- Importe sind Live-Bindings – sie zeigen auf die Variable im Modul, nicht auf eine Kopie.
