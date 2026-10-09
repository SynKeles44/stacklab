---
title: Node.js debuggen – console und Inspector
summary: Gezielte Ausgaben mit den console-Methoden, und wie du Node-Programme mit --inspect im Browser oder Editor anhältst und Schritt für Schritt durchgehst.
duration: 25
sources:
  - title: Node.js – Debugging (Learn)
    url: https://nodejs.org/learn/getting-started/debugging
  - title: Node.js – Debugger (node inspect)
    url: https://nodejs.org/api/debugger.html
  - title: Node.js – Console
    url: https://nodejs.org/api/console.html
  - title: VS Code – Node.js debugging
    url: https://code.visualstudio.com/docs/nodejs/nodejs-debugging
quiz:
  - type: match
    question: Ordne jeder console-Methode ihren Zweck zu.
    pairs:
      - { left: "console.table(liste)", right: "Array von Objekten als Tabelle ausgeben" }
      - { left: "console.error('…')", right: "Meldung auf die Standardfehlerausgabe schreiben" }
      - { left: "console.time('x') / console.timeEnd('x')", right: "Messen, wie lange ein Abschnitt dauert" }
      - { left: "console.trace('hier')", right: "Meldung samt aktuellem Stack Trace ausgeben" }
    explanation: >
      Die passende Methode spart Zeit: Tabellen für Listen, timeEnd für Messungen, trace für die Frage
      „Wer hat mich aufgerufen?“.
  - type: single
    question: Was ist der Unterschied zwischen `node --inspect app.js` und `node --inspect-brk app.js`?
    options:
      - Es gibt keinen.
      - "`--inspect-brk` hält schon vor der ersten Zeile an, damit du in Ruhe einen Debugger verbinden kannst."
      - "`--inspect-brk` startet das Programm schneller."
      - "`--inspect` funktioniert nur unter Windows."
    answer: 1
    explanation: >
      Bei `--inspect` läuft das Programm sofort los – ein kurzes Skript ist fertig, bevor du dich verbunden hast.
      `--inspect-brk` wartet am Anfang.
  - type: cloze
    text: Der Node-Inspector lauscht standardmäßig auf Port ___. In Chrome findest du laufende Node-Prozesse unter der Adresse `chrome://___`.
    blanks:
      - ["9229"]
      - [inspect]
    explanation: >
      Port 9229 auf 127.0.0.1 ist der Standard. Unter chrome://inspect verbindest du die Chrome-DevTools mit dem
      Node-Prozess.
  - type: find-bug
    question: Dieses Skript soll prüfen, ob ein Artikel nachbestellt werden muss. Für `bestand = '8'` und `mindest = '10'` kommt `false` heraus. In welcher Zeile steckt der Fehler?
    language: js
    code: |
      const zeile = 'Schrauben;8;10';
      const [name, bestand, mindest] = zeile.split(';');
      const nachbestellen = bestand < mindest;
      console.log(name, nachbestellen);
    bug_line: 3
    explanation: >
      `split` liefert Strings. `'8' < '10'` vergleicht Zeichen für Zeichen – `'8'` ist größer als `'1'`, also
      `false`. Mit `Number(bestand) < Number(mindest)` stimmt das Ergebnis.
tasks:
  - id: lager-debuggen
    type: terminal
    title: Die falsche Nachbestell-Liste untersuchen
    description: |
      Im Ordner `node-konsole` liegt `lager.js`. Es liest `bestand.csv` und soll alle Artikel ausgeben, deren
      Bestand **kleiner** als der Mindestbestand ist. Erwartet ist:

      ```text
      Nachbestellen: Schrauben, Dübel
      ```

      Das Skript gibt aber etwas anderes aus.

      1. Führe `node lager.js` aus und vergleiche mit der Erwartung.
      2. Füge vor dem `filter` eine Ausgabe ein, z. B. `console.table(artikel)`, und schau dir die Werte an.
         Mit `console.log(typeof artikel[0].bestand)` siehst du den Datentyp.
      3. Behebe den Fehler so, dass er für **alle** Daten funktioniert – nicht nur für `bestand.csv`.
      4. Entferne deine Debug-Ausgaben wieder: Am Ende gibt das Skript nur die eine Zeile aus.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit die Dateien angelegt werden.
    workdir: node-konsole
    setup: |
      cat > lager.js <<'EOF'
      const fs = require('node:fs');

      const datei = process.argv[2] ?? 'bestand.csv';
      const zeilen = fs.readFileSync(datei, 'utf8').trim().split('\n').slice(1);

      const artikel = zeilen.map((zeile) => {
        const [name, bestand, mindest] = zeile.split(';');
        return { name, bestand, mindest };
      });

      const nachbestellen = artikel.filter((a) => a.bestand < a.mindest);

      console.log(`Nachbestellen: ${nachbestellen.map((a) => a.name).join(', ')}`);
      EOF
      printf 'artikel;bestand;mindest\nSchrauben;8;10\nMuttern;100;20\nDübel;5;20\nNägel;30;9\nWinkel;40;40\n' > bestand.csv
    checks:
      - type: command
        run: node lager.js
        stdout_equals: "Nachbestellen: Schrauben, Dübel"
        message: "`node lager.js` soll genau `Nachbestellen: Schrauben, Dübel` ausgeben – ohne zusätzliche Debug-Zeilen."
      - type: command
        run: d=$(mktemp -d "$PWD/.pruefung-XXXXXX"); printf 'artikel;bestand;mindest\nA;99;100\nB;100;99\nC;7;12\n' > "$d/t.csv"; node lager.js "$d/t.csv"; s=$?; rm -rf "$d"; exit $s
        stdout_equals: "Nachbestellen: A, C"
        message: Mit anderen Daten stimmt das Ergebnis noch nicht. Wandle Bestand und Mindestbestand in Zahlen um, statt die Ausgabe anzupassen.
    hints:
      - "`console.table(artikel)` zeigt die Werte. Achte darauf, ob `bestand` eine Zahl oder ein String ist."
      - "Strings werden Zeichen für Zeichen verglichen: `'100' < '20'` ist `true`, weil `'1'` vor `'2'` kommt."
      - "Wandle beim Einlesen um: `return { name, bestand: Number(bestand), mindest: Number(mindest) };`"
    solution: |
      ```bash
      cd node-konsole
      node lager.js          # Nachbestellen: Muttern, Nägel  (falsch)
      ```

      Kurz zum Untersuchen in `lager.js` vor dem `filter` einfügen und wieder entfernen:

      ```js
      console.table(artikel);
      console.log(typeof artikel[0].bestand);   // 'string'
      ```

      Die eigentliche Korrektur:

      ```js
      return { name, bestand: Number(bestand), mindest: Number(mindest) };
      ```
  - id: node-inspect-sitzung
    type: simulated
    title: Mit dem eingebauten Node-Debugger anhalten
    description: |
      `summe.js` soll die Zahlen `[10, 20, 30]` addieren, gibt aber `50` statt `60` aus. Du untersuchst das mit
      dem Kommandozeilen-Debugger von Node.

      ```js
      1 const netto = [10, 20, 30];
      2 let summe = 0;
      3 for (let i = 1; i < netto.length; i++) {
      4   summe += netto[i];
      5 }
      6 console.log(summe);
      ```

      1. Starte den Debugger mit `node inspect summe.js`.
      2. Setze mit `sb(4)` einen Breakpoint in Zeile 4.
      3. Lass das Programm mit `c` bis zum Breakpoint laufen.
      4. Frag mit `exec i` den Wert von `i` im ersten Durchlauf ab.
      5. Beende den Debugger mit `.exit`.
    prompt: "du@laptop:~/node-konsole$"
    steps:
      - expect: "^node\\s+inspect\\s+summe\\.js\\s*$"
        output: |
          < Debugger listening on ws://127.0.0.1:9229/8fcdd5f7-a69d-4c9d-b0ca-fb4efa82565f
          < For help, see: https://nodejs.org/learn/getting-started/debugging
          <
          connecting to 127.0.0.1:9229 ... ok
          < Debugger attached.
          <
          Break on start in summe.js:1
          > 1 const netto = [10, 20, 30];
            2 let summe = 0;
            3 for (let i = 1; i < netto.length; i++) {
        prompt: "debug>"
        hint: node inspect summe.js
      - expect: "^(sb|setBreakpoint)\\(\\s*4\\s*\\)\\s*$"
        output: |2
            1 const netto = [10, 20, 30];
            2 let summe = 0;
            3 for (let i = 1; i < netto.length; i++) {
          > 4   summe += netto[i];
            5 }
            6 console.log(summe);
        hint: sb(4)
      - expect: "^(c|cont)\\s*$"
        output: |2
          break in summe.js:4
            2 let summe = 0;
            3 for (let i = 1; i < netto.length; i++) {
          > 4   summe += netto[i];
            5 }
            6 console.log(summe);
        hint: c
      - expect: "^exec\\s+i\\s*$"
        output: "1"
        hint: exec i
      - expect: "^\\.exit\\s*$"
        output: ""
        prompt: "du@laptop:~/node-konsole$"
        hint: .exit
    responses:
      - match: "^exec\\s+netto\\[0\\]\\s*$"
        output: "10"
      - match: "^exec\\s+summe\\s*$"
        output: "0"
      - match: "^help\\s*$"
        output: "c, n, s, o, sb(line), exec expr, watch('expr'), bt, repl, .exit …"
---
Ein Node-Programm läuft im Terminal, nicht im Browser – trotzdem musst du auf die bequemen Werkzeuge nicht
verzichten. In dieser Lektion lernst du zwei Wege: **gezielte Ausgaben** mit den console-Methoden und den
**Inspector**, mit dem du Node-Programme genauso anhältst wie JavaScript im Browser.

## Mehr als console.log

[[console-log|console.log]] ist das schnellste Debug-Werkzeug überhaupt. Mit ein paar Tricks wird es deutlich
aussagekräftiger:

```js title="debug-ausgaben.js"
const preis = '4.95';
console.log({ preis });               // { preis: '4.95' }  – Name und Wert, Anführungszeichen = String
console.log(typeof preis);            // string
console.table([{ a: 1 }, { a: 2 }]);  // Tabelle mit Spalte a
console.dir(daten, { depth: null });  // verschachtelte Objekte komplett ausgeben
console.time('import');
// … langsamer Code …
console.timeEnd('import');            // import: 812.4ms
console.trace('wer ruft mich?');      // Meldung plus Stack Trace
```

Der Trick mit den geschweiften Klammern `console.log({ preis })` lohnt sich besonders: Du siehst Name **und**
Wert, und an den Anführungszeichen erkennst du sofort, ob ein Wert ein String ist.

> [!MERKSATZ]
> `console.log` schreibt auf die Standardausgabe, `console.error` und `console.warn` auf die
> [[standardfehlerausgabe|Standardfehlerausgabe]]. Debug-Ausgaben gehören auf stderr – dann stören sie nicht,
> wenn ein anderes Programm die normale Ausgabe weiterverarbeitet.

## Debug-Ausgaben gezielt einsetzen

Ausgaben sind ein Werkzeug für den Debugging-Kreislauf, kein Selbstzweck. Gute Debug-Ausgaben prüfen eine
**Hypothese**: „Ich vermute, `bestand` ist hier ein String“ → `console.log(typeof bestand)`.

| Gut | Schlecht |
|---|---|
| `console.log('nach parse', { bestand, mindest })` | `console.log('hier')` |
| Eine Ausgabe an der Stelle, die du vermutest | Zwanzig Ausgaben überall verteilt |
| Wieder entfernen, sobald die Ursache klar ist | Im Commit vergessen |

> [!FEHLER]
> **Debug-Ausgaben committen.** Vergessene `console.log`-Zeilen landen schnell im Repository und später in
> Logdateien der Produktion. Prüfe vor jedem Commit mit `git diff`, ob noch Debug-Zeilen drin sind. Viele Teams
> lassen einen [[linter|Linter]] danach suchen.

## Der Inspector: Node anhalten

Für knifflige Fälle startest du Node mit dem [[inspector|Inspector]]. Dann kann sich ein Debugger mit dem
laufenden Prozess verbinden:

```bash title="Terminal"
node --inspect app.js        # Programm läuft sofort los, Debugger darf sich verbinden
node --inspect-brk app.js    # wartet vor der ersten Zeile, bis du dich verbunden hast
```

Node meldet dann `Debugger listening on ws://127.0.0.1:9229/…`. Der [[port|Port]] 9229 ist der Standard.
Verbinden kannst du dich auf mehreren Wegen:

| Werkzeug | So geht's |
|---|---|
| Chrome / Edge | `chrome://inspect` aufrufen → unter *Remote Target* auf **inspect** klicken |
| VS Code | *JavaScript Debug Terminal* öffnen und dort `node app.js` starten |
| WebStorm / PhpStorm | Run-Konfiguration „Node.js“ anlegen und mit dem Käfer-Symbol starten |
| Terminal | `node inspect app.js` – der eingebaute Kommandozeilen-Debugger |

Danach funktioniert alles wie im Browser: [[breakpoint|Breakpoints]] setzen, Step over, Step into, Variablen
im Scope ansehen. Auch die Anweisung `debugger;` im Code hält an, sobald ein Debugger verbunden ist.

## Breakpoints im Editor

Am bequemsten ist das Debuggen direkt in der [[ide|IDE]]: Du klickst links neben die Zeilennummer, ein roter
Punkt erscheint, und du startest das Programm im Debug-Modus. Der Editor zeigt dann die Variablen direkt neben
dem Code an.

Der eingebaute Kommandozeilen-Debugger ist ein Notnagel, wenn kein Editor zur Verfügung steht – etwa auf einem
Server. Seine wichtigsten Befehle:

| Befehl | Wirkung |
|---|---|
| `sb(4)` | Breakpoint in Zeile 4 setzen |
| `c` | weiterlaufen bis zum nächsten Breakpoint |
| `n` / `s` / `o` | Step over / Step into / Step out |
| `exec ausdruck` | Ausdruck im aktuellen Scope auswerten |
| `watch('summe')` | Ausdruck bei jedem Halt anzeigen |
| `.exit` | Debugger beenden |

> [!ACHTUNG]
> Der Inspector gibt volle Kontrolle über den Prozess. Starte ihn nie mit `--inspect=0.0.0.0` auf einem
> öffentlich erreichbaren Server – der Standard `127.0.0.1` ist nur von deinem eigenen Rechner aus erreichbar.

> [!PRAXIS]
> In der täglichen Arbeit kombinierst du beides: Eine schnelle `console.log`-Ausgabe für einfache Fragen, der
> Debugger für Fälle, in denen du nicht weißt, **wo** du suchen sollst – etwa wenn ein Wert über mehrere
> Funktionen hinweg unerwartet verändert wird.

## Zusammenfassung

- `console.log({ wert })` zeigt Name, Wert und an den Anführungszeichen auch den Typ.
- `console.table`, `console.dir`, `console.time` und `console.trace` lösen typische Debug-Fragen schneller.
- Debug-Ausgaben gehören auf stderr und werden vor dem Commit entfernt.
- `node --inspect` bzw. `--inspect-brk` öffnet den Inspector auf `127.0.0.1:9229`.
- Verbinden kannst du dich über `chrome://inspect`, deinen Editor oder `node inspect` im Terminal.
- Breakpoints, Steps und Scope funktionieren genauso wie in den Browser-DevTools.
