---
title: Das Performance-Budget
summary: Wie du Grenzwerte für Bytes, Ladezeiten und Antwortzeiten festlegst und sie mit einem Skript in der CI-Pipeline automatisch überwachst, damit Performance nicht schleichend verloren geht.
duration: 25
sources:
  - title: web.dev – Performance budgets 101
    url: https://web.dev/articles/performance-budgets-101
  - title: Lighthouse CI
    url: https://github.com/GoogleChrome/lighthouse-ci
  - title: Vite – build.chunkSizeWarningLimit
    url: https://vite.dev/config/build-options#build-chunksizewarninglimit
  - title: Node.js – zlib.gzipSync
    url: https://nodejs.org/api/zlib.html#zlibgzipsyncbuffer-options
quiz:
  - type: single
    question: Warum geht Performance ohne Budget meist schleichend verloren?
    options:
      - Weil Browser jedes Jahr langsamer werden
      - Weil jede einzelne Änderung nur ein paar Kilobyte oder Millisekunden kostet und niemand die Summe bemerkt
      - Weil Server mit der Zeit verschleißen
      - Weil Caches nach einem Jahr ablaufen
    answer: 1
    explanation: Ein neues Paket hier, ein zusätzliches Skript dort – jede Änderung wirkt harmlos. Ein Budget macht die Summe sichtbar und erzwingt eine bewusste Entscheidung.
  - type: match
    question: Ordne jedes Budget seiner Art zu.
    pairs:
      - { left: "JavaScript höchstens 170 KB (gzip)", right: "Mengen-Budget" }
      - { left: "LCP p75 höchstens 2,5 s", right: "Zeit-Budget" }
      - { left: "Lighthouse-Performance mindestens 90", right: "Regel-Budget (Score)" }
      - { left: "API p95 höchstens 300 ms im Lasttest", right: "Zeit-Budget (Backend)" }
    explanation: Mengen-Budgets lassen sich am einfachsten automatisch prüfen; Zeit-Budgets beschreiben am direktesten, was Nutzer:innen erleben.
  - type: multiple
    question: Ein Pull Request überschreitet das JavaScript-Budget um 12 KB. Welche Reaktionen sind sinnvoll?
    options:
      - Prüfen, ob die neue Bibliothek durch eine kleinere oder eingebaute Funktion ersetzbar ist
      - Den neuen Code per Code-Splitting erst bei Bedarf laden
      - Das Budget stillschweigend erhöhen, damit die Pipeline grün wird
      - Im Team bewusst entscheiden, ob das Feature die 12 KB wert ist, und die Entscheidung festhalten
    answers: [0, 1, 3]
    explanation: Ein Budget darf sich ändern – aber bewusst und begründet, nicht still, um eine rote Pipeline loszuwerden.
  - type: cloze
    text: "Ein Prüfskript beendet sich bei überschrittenem Budget mit einem ___ ungleich 0, damit die CI-Pipeline den Build als fehlgeschlagen markiert. In Node.js setzt du ihn mit `process.___ = 1`."
    blanks:
      - [Exit-Code, Exitcode, Exit Code, Rückgabewert]
      - [exitCode]
    explanation: Jede CI-Pipeline wertet den Exit-Code aus. 0 heißt Erfolg, alles andere Fehler.
tasks:
  - id: budget-pruefen
    type: terminal
    title: Ein Budget-Prüfskript für die Pipeline
    description: |
      In `budget.json` hat das Team Grenzen für die **gzip-komprimierte** Gesamtgröße aller JavaScript- und CSS-Dateien
      festgelegt (in Bytes). Schreibe ein Skript, das diese Grenzen prüft.

      Klicke zuerst auf **Aufgabe vorbereiten**. Dann schreibe `check-budget.js`:

      1. Aufruf: `node check-budget.js <ordner> <budget.json>`, z. B. `node check-budget.js dist budget.json`.
      2. Lies alle Dateien im Ordner (ohne Unterordner) und summiere ihre gzip-Größen getrennt nach Endung `.js` und
         `.css`. Die gzip-Größe einer Datei ist `zlib.gzipSync(inhalt).length`.
      3. Gib pro Typ eine Zeile aus, z. B. `js: 45210 / 40000 B – zu groß` oder `css: 312 / 8000 B – ok`.
      4. Ist mindestens ein Typ über seiner Grenze, beende das Skript mit Exit-Code `1`, sonst mit `0`.

      Zum Ausprobieren: `dist` ist zu groß, `dist-klein` hält das Budget ein. Mit `echo $?` siehst du den Exit-Code.
    workdir: budget-pruefen
    setup: |
      echo '{ "js": 40000, "css": 8000 }' > budget.json
      mkdir -p dist dist-klein
      printf 'export const appData = "%s";\n' "$(head -c 22500 /dev/urandom | base64 -w0)" > dist/app.4f2a91c0.js
      printf 'export const vendorData = "%s";\n' "$(head -c 22500 /dev/urandom | base64 -w0)" > dist/vendor.9b1e33d7.js
      for i in $(seq 1 200); do echo ".card-$i { padding: 1rem; border-radius: 0.5rem; }"; done > dist/app.0c7d2e11.css
      printf 'export const appData = "%s";\n' "$(head -c 15000 /dev/urandom | base64 -w0)" > dist-klein/app.4f2a91c0.js
      cp dist/app.0c7d2e11.css dist-klein/
    checks:
      - type: file_exists
        path: check-budget.js
        message: Lege die Datei check-budget.js an.
      - type: command
        run: node check-budget.js dist budget.json
        expect_exit: 1
        message: Für dist (zu viel JavaScript) soll das Skript mit Exit-Code 1 enden.
      - type: command
        run: node check-budget.js dist-klein budget.json
        message: Für dist-klein (im Budget) soll das Skript mit Exit-Code 0 enden.
      - type: command
        run: node check-budget.js dist budget.json | grep -iE '^js'
        expect_exit: 0
        message: "Das Skript soll eine Zeile ausgeben, die mit js beginnt, z. B. `js: 45210 / 40000 B – zu groß`."
      - type: command
        run: |-
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX"); head -c 20000 /dev/urandom | base64 > "$d/gross.css"; node check-budget.js "$d" budget.json > /dev/null; c=$?; rm -rf "$d"; test "$c" -eq 1
        message: Auch zu viel CSS soll das Budget sprengen (Exit-Code 1). Prüfst du .css-Dateien separat?
      - type: command
        run: |-
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX"); echo '{ "js": 1, "css": 1 }' > "$d/b.json"; mkdir "$d/leer"; node check-budget.js "$d/leer" "$d/b.json" > /dev/null; c=$?; rm -rf "$d"; test "$c" -eq 0
        message: Ein leerer Ordner (0 Bytes) hält jedes Budget ein und soll mit Exit-Code 0 enden. Lies die Grenzen aus der übergebenen budget.json.
    hints:
      - "`process.argv[2]` ist der Ordner, `process.argv[3]` die Budget-Datei. `fs.readdirSync(ordner)` listet die Dateien."
      - "`path.extname(name).slice(1)` liefert `js` oder `css`. Summiere in einem Objekt `{ js: 0, css: 0 }`."
      - "Am Ende: `process.exitCode = ueberschritten ? 1 : 0;`"
    solution: |
      ```js
      // check-budget.js
      const fs = require('node:fs');
      const path = require('node:path');
      const zlib = require('node:zlib');

      const [dir, budgetFile] = process.argv.slice(2);
      const budget = JSON.parse(fs.readFileSync(budgetFile, 'utf8'));
      const totals = { js: 0, css: 0 };

      for (const name of fs.readdirSync(dir)) {
        const file = path.join(dir, name);
        const type = path.extname(name).slice(1);
        if (!(type in totals) || !fs.statSync(file).isFile()) continue;
        totals[type] += zlib.gzipSync(fs.readFileSync(file)).length;
      }

      let overBudget = false;
      for (const [type, limit] of Object.entries(budget)) {
        const size = totals[type] ?? 0;
        const ok = size <= limit;
        if (!ok) overBudget = true;
        console.log(`${type}: ${size} / ${limit} B – ${ok ? 'ok' : 'zu groß'}`);
      }

      process.exitCode = overBudget ? 1 : 0;
      ```

      ```bash
      node check-budget.js dist budget.json; echo $?
      node check-budget.js dist-klein budget.json; echo $?
      ```
  - id: budget-arten
    type: dragdrop
    title: Welches Budget wo prüfen?
    description: Ordne jedes Budget dem Ort zu, an dem es sich am besten automatisch oder regelmäßig prüfen lässt.
    targets:
      - { id: build, label: "Im Build (jeder Pull Request)" }
      - { id: labor, label: "Im Labortest (Lighthouse CI)" }
      - { id: feld, label: "In Felddaten (Dashboard)" }
    items:
      - { label: "JavaScript gesamt höchstens 170 KB gzip", target: build }
      - { label: "Kein einzelnes Bild über 200 KB", target: build }
      - { label: "Lighthouse-Performance-Score mindestens 90", target: labor }
      - { label: "Total Blocking Time unter 200 ms auf simuliertem Mobilgerät", target: labor }
      - { label: "LCP p75 der echten Besuche unter 2,5 s", target: feld }
      - { label: "INP p75 der echten Besuche unter 200 ms", target: feld }
---
Vor einem Jahr war die Startseite schnell. Heute braucht sie doppelt so lange – und niemand weiß, wann das passiert
ist. Ein Analyse-Skript hier, eine Datumsbibliothek dort, ein größeres Titelbild: Jede Änderung war harmlos, die
Summe nicht. Ein [[performance-budget|Performance-Budget]] verhindert genau diesen schleichenden Verfall.

## Was ist ein Performance-Budget?

Ein Performance-Budget ist eine **Grenze, auf die sich das Team einigt**, und die bei jeder Änderung geprüft wird.
Es gibt drei Arten:

| Art | Beispiel | Vorteil |
|---|---|---|
| Mengen-Budget | JavaScript ≤ 170 KB gzip, ≤ 30 Anfragen | Einfach und zuverlässig automatisch prüfbar |
| Zeit-Budget | LCP p75 ≤ 2,5 s, API p95 ≤ 300 ms | Beschreibt direkt das Erlebnis |
| Regel-Budget | Lighthouse-Performance ≥ 90 | Fasst viele Kennzahlen zusammen |

Mengen-Budgets sind Stellvertreter: Weniger JavaScript macht LCP und INP nicht garantiert besser, aber sehr
wahrscheinlich. Darum kombinieren Teams meist ein Mengen-Budget im Build mit Zeit-Budgets aus Lasttests und Felddaten.

> [!MERKSATZ]
> Ein Budget macht aus „Performance ist uns wichtig“ eine prüfbare Regel. Was nicht automatisch geprüft wird, geht verloren.

## Das Budget festlegen

Woher kommen die Zahlen? Drei gute Quellen:

1. **Ziele der Nutzer:innen:** die Core-Web-Vitals-Grenzen (LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1).
2. **Der Ist-Zustand:** Miss heute und setze das Budget knapp darüber – so wird es zumindest nicht schlechter.
3. **Das Gerät der Zielgruppe:** Ein günstiges Smartphone braucht für 1 MB JavaScript ein Vielfaches der Zeit eines Laptops.

```json title="budget.json – gzip-Bytes pro Dateityp"
{ "js": 170000, "css": 30000 }
```

Für das Backend formulierst du Budgets als Perzentile aus einem Lasttest, etwa: „`/api/search` p95 ≤ 300 ms bei
100 Verbindungen, Fehlerrate 0 %“.

## Automatisch prüfen in der Pipeline

Ein Budget wirkt erst, wenn es in der [[ci-pipeline|CI-Pipeline]] läuft. Dafür reicht ein kleines Skript, das bei
Überschreitung mit einem [[exit-code|Exit-Code]] ungleich 0 endet:

```js title="Das Prinzip"
const size = zlib.gzipSync(fs.readFileSync('dist/app.js')).length;
console.log(`js: ${size} / ${limit} B`);
process.exitCode = size > limit ? 1 : 0;   // ≠ 0 → Pipeline wird rot
```

```yaml title="Ausschnitt einer CI-Pipeline"
- run: npm run build
- run: node check-budget.js dist/assets budget.json
```

Fertige Werkzeuge gibt es auch: Vite warnt ab einer einstellbaren Chunk-Größe
(`build.chunkSizeWarningLimit`), und [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) prüft Zeit- und
Score-Budgets bei jedem Pull Request in einem echten Browser.

> [!FEHLER]
> Die Pipeline ist rot, also wird das Budget „mal eben“ von 170 auf 200 KB erhöht. Damit ist es wertlos. Eine
> Erhöhung ist eine bewusste Team-Entscheidung mit Begründung – zum Beispiel im Pull Request dokumentiert.

## Wenn das Budget reißt

Ein überschrittenes Budget ist kein Verbot, sondern ein Gesprächsanlass. Typische Auswege:

- **Ersetzen:** Gibt es eine kleinere Bibliothek – oder eine eingebaute Browser-Funktion?
- **Verschieben:** Per [[code-splitting|Code-Splitting]] erst laden, wenn das Feature gebraucht wird.
- **Tauschen:** Etwas anderes entfernen, das weniger Nutzen bringt.
- **Bewusst erhöhen:** Ist das Feature den Preis wert, wird das Budget begründet angepasst.

> [!PRAXIS]
> Teams, die Budgets ernst nehmen, zeigen die Größenänderung direkt im Pull Request an („+3,2 KB JS“). Reviewer:innen
> sehen so bei jeder Änderung, was sie kostet – und Performance wird Teil des normalen Code-Reviews.

## Zusammenfassung

- Ein **Performance-Budget** ist eine vereinbarte, prüfbare Grenze gegen schleichenden Verfall.
- Es gibt **Mengen-**, **Zeit-** und **Regel-Budgets**; Mengen-Budgets lassen sich am einfachsten automatisieren.
- Budgets leiten sich aus Nutzerzielen, dem Ist-Zustand und den Geräten der Zielgruppe ab.
- Ein Skript mit **Exit-Code ≠ 0** macht das Budget in der CI-Pipeline verbindlich.
- Ein gerissenes Budget wird bewusst gelöst – ersetzen, verschieben, tauschen oder begründet erhöhen.
