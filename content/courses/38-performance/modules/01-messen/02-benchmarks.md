---
title: Benchmarks schreiben
summary: Wie du zwei Varianten fair gegeneinander misst – mit monotoner Uhr, Aufwärmphase, vielen Wiederholungen und dem Median – in Node.js und PHP.
duration: 25
sources:
  - title: MDN – performance.now()
    url: https://developer.mozilla.org/en-US/docs/Web/API/Performance/now
  - title: Node.js – process.hrtime.bigint()
    url: https://nodejs.org/api/process.html#processhrtimebigint
  - title: PHP-Handbuch – hrtime
    url: https://www.php.net/manual/de/function.hrtime.php
  - title: hyperfine – Benchmarks für ganze Kommandos
    url: https://github.com/sharkdp/hyperfine
quiz:
  - type: single
    question: Warum misst du mit `performance.now()` statt mit `Date.now()`?
    options:
      - "`Date.now()` gibt es in Node.js nicht."
      - "`performance.now()` ist monoton und feiner aufgelöst – Zeitumstellungen oder Uhr-Korrekturen verfälschen die Messung nicht."
      - "`performance.now()` macht den Code schneller."
      - Beide sind gleichwertig.
    answer: 1
    explanation: >
      `Date.now()` folgt der Systemuhr, die das Betriebssystem jederzeit nachstellen darf, und liefert nur ganze
      Millisekunden. Eine monotone Uhr läuft immer nur vorwärts und ist für Zeitdifferenzen gemacht.
  - type: find-bug
    question: Dieser Benchmark soll messen, wie lange `sortiere()` braucht. Welche Zeile macht das Ergebnis unbrauchbar?
    language: js
    code: |
      const daten = erzeugeDaten(10000);
      const start = performance.now();
      for (let i = 0; i < 50; i++) {
        sortiere(daten);
      }
      const dauer = performance.now() - start;
      console.log(`${(dauer / 50).toFixed(2)} ms pro Lauf`);
    bug_line: 4
    explanation: >
      Wenn `sortiere()` das Array an Ort und Stelle sortiert, ist es ab dem zweiten Durchlauf schon sortiert – du
      misst also 49-mal den Spezialfall „bereits sortiert“. Jeder Lauf braucht eine frische Kopie, z. B. `sortiere([...daten])`.
  - type: multiple
    question: Was gehört zu einem fairen Mikro-Benchmark?
    options:
      - Eine Aufwärmphase, bevor gemessen wird
      - Viele Wiederholungen und der Median statt eines Einzelwerts
      - Das Ergebnis der Funktion weiterverwenden, damit der Compiler den Aufruf nicht wegoptimiert
      - Nebenbei ein Video rendern, um realistische Last zu erzeugen
    answers: [0, 1, 2]
    explanation: Nebenlast verfälscht Messungen. Miss auf einem möglichst ruhigen System und unter gleichen Bedingungen für alle Varianten.
  - type: cloze
    text: "In PHP liefert `hrtime(___)` die Zeit als ganze Zahl in Nanosekunden. In Node.js gibt `process.hrtime.___()` ebenfalls Nanosekunden zurück."
    blanks:
      - ["true"]
      - [bigint]
    explanation: Beide Funktionen nutzen eine monotone Uhr und sind deshalb für Zeitmessungen geeignet.
tasks:
  - id: set-gegen-array
    type: terminal
    title: Array oder Set? Miss es selbst
    description: |
      In `varianten.js` stecken zwei Funktionen, die dasselbe Ergebnis liefern: `mitArray()` sucht mit
      `includes()` in einem Array, `mitSet()` mit `has()` in einem `Set`. Welche ist schneller – und um wie viel?

      Klicke zuerst auf **Aufgabe vorbereiten**. Dann:

      1. Lege `bench.js` an. Lade die Funktionen mit `const { mitArray, mitSet } = require('./varianten.js');`.
      2. Rufe jede Funktion zuerst 5-mal zum Aufwärmen auf, ohne zu messen.
      3. Miss danach jede Funktion 20-mal einzeln mit `performance.now()` und berechne den **Median** der 20 Zeiten.
      4. Gib zwei Zeilen aus, z. B. `array: 12.34 ms` und `set: 0.05 ms`.
      5. Schreibe den Namen der schnelleren Variante (`array` oder `set`) in die Datei `ergebnis.txt`.
    workdir: set-gegen-array
    setup: |
      cat > varianten.js <<'EOF'
      const ids = Array.from({ length: 5000 }, (_, i) => i * 3);
      const gesucht = Array.from({ length: 5000 }, (_, i) => i * 2);
      const idSet = new Set(ids);

      function mitArray() {
        let treffer = 0;
        for (const g of gesucht) if (ids.includes(g)) treffer++;
        return treffer;
      }

      function mitSet() {
        let treffer = 0;
        for (const g of gesucht) if (idSet.has(g)) treffer++;
        return treffer;
      }

      module.exports = { mitArray, mitSet };
      EOF
    checks:
      - type: file_exists
        path: bench.js
        message: Lege die Datei bench.js an.
      - type: file_contains
        path: bench.js
        pattern: "performance\\.now\\(|hrtime"
        message: Miss die Zeit in bench.js mit performance.now() (oder process.hrtime.bigint()).
      - type: command
        run: node bench.js | grep -iE "^array:?\\s*[0-9]"
        message: "bench.js soll eine Zeile wie `array: 12.34 ms` ausgeben."
      - type: command
        run: node bench.js | grep -iE "^set:?\\s*[0-9]"
        message: "bench.js soll eine Zeile wie `set: 0.05 ms` ausgeben."
      - type: file_contains
        path: ergebnis.txt
        pattern: "^\\s*set\\s*$"
        message: Schreibe in ergebnis.txt, welche Variante schneller ist – nur das Wort array oder set.
    hints:
      - Speichere die 20 Zeiten in einem Array, sortiere es mit `sort((a, b) => a - b)` und nimm das Element in der Mitte.
      - "Eine Hilfsfunktion spart Doppelarbeit: `function miss(fn) { … return median; }`."
      - "`echo set > ergebnis.txt` – aber erst, nachdem du es gemessen hast."
    solution: |
      ```js
      // bench.js
      const { mitArray, mitSet } = require('./varianten.js');

      function miss(fn) {
        for (let i = 0; i < 5; i++) fn();
        const zeiten = [];
        for (let i = 0; i < 20; i++) {
          const start = performance.now();
          fn();
          zeiten.push(performance.now() - start);
        }
        zeiten.sort((a, b) => a - b);
        return zeiten[Math.floor(zeiten.length / 2)];
      }

      console.log(`array: ${miss(mitArray).toFixed(2)} ms`);
      console.log(`set: ${miss(mitSet).toFixed(2)} ms`);
      ```

      ```bash
      node bench.js
      echo set > ergebnis.txt
      ```
  - id: guter-benchmark
    type: order
    title: Der Ablauf eines fairen Benchmarks
    description: Bring die Schritte eines sauberen Vergleichs zweier Implementierungen in die richtige Reihenfolge.
    items:
      - Frage und Kennzahl festlegen (z. B. Median in ms pro Aufruf)
      - Realistische Eingabedaten vorbereiten
      - Jede Variante einige Male aufwärmen
      - Jede Variante viele Male messen, Ergebnisse weiterverwenden
      - Median und Streuung berechnen
      - Messung wiederholen und Ergebnis mit Umgebung dokumentieren
---
Du hast zwei Ideen, wie man eine Funktion schreiben könnte, und willst wissen, welche schneller ist. Einmal
ausführen, Stoppuhr ablesen, fertig? Leider nein: Ein einzelner Messwert kann um den Faktor zehn danebenliegen.
In dieser Lektion lernst du, [[benchmark|Benchmarks]] so zu bauen, dass ihre Zahlen etwas bedeuten.

## Mikro- und Makro-Benchmarks

Es gibt zwei Größenordnungen:

| Art | Misst | Beispiel |
|---|---|---|
| Mikro-Benchmark | Eine kleine Funktion, millionenfach | `includes()` gegen `Set.has()` |
| Makro-Benchmark | Einen ganzen Ablauf | Antwortzeit eines Endpunkts, Laufzeit eines Build-Skripts |

Mikro-Benchmarks sind schnell geschrieben, aber trügerisch: 2 µs gespart klingt gut, ist aber egal, wenn
dieselbe Anfrage 300 ms auf die Datenbank wartet. Prüfe vorher, ob die Funktion überhaupt im
[[engpass|Engpass]] liegt.

Für ganze Kommandos gibt es fertige Werkzeuge wie [hyperfine](https://github.com/sharkdp/hyperfine); im Code
misst du selbst.

## Die richtige Uhr

Zum Messen brauchst du eine [[monotone-uhr|monotone Uhr]]. Sie läuft immer nur vorwärts und wird nicht
nachgestellt, wenn sich der Rechner mit einem Zeitserver abgleicht.

```js title="Node.js / Browser"
const start = performance.now();          // Millisekunden mit Nachkommastellen
arbeite();
console.log(performance.now() - start);

const t0 = process.hrtime.bigint();       // nur Node.js: Nanosekunden als BigInt
arbeite();
console.log(Number(process.hrtime.bigint() - t0) / 1e6, 'ms');
```

```php title="PHP"
$start = hrtime(true);                    // Nanosekunden als int
arbeite();
$ms = (hrtime(true) - $start) / 1e6;
printf("%.2f ms\n", $ms);
```

> [!FEHLER]
> `Date.now()` oder `microtime()` folgen der Systemuhr. Stellt das Betriebssystem während der Messung die Uhr
> nach, bekommst du negative oder absurde Zeiten. Für Dauer immer die monotone Uhr verwenden.

## Aufwärmen und wiederholen

Moderne Laufzeitumgebungen optimieren Code während er läuft: Die JavaScript-Engine [[v8|V8]] übersetzt häufig
genutzte Funktionen mit einem [[jit-compiler|JIT-Compiler]] in schnellen Maschinencode. Die ersten Aufrufe sind
deshalb langsamer als die späteren. Dazu kommen Störungen durch andere [[prozess|Prozesse]] und die
Speicherbereinigung.

Darum gilt:

1. **Aufwärmphase** – einige Durchläufe ohne Messung.
2. **Viele Wiederholungen** – jeden Durchlauf einzeln messen.
3. **Median** statt Durchschnitt – einzelne Störungen fallen dann nicht ins Gewicht.

```js title="Ein kleiner Mess-Helfer"
function miss(fn, runs = 20) {
  for (let i = 0; i < 5; i++) fn();       // aufwärmen
  const zeiten = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    fn();
    zeiten.push(performance.now() - start);
  }
  zeiten.sort((a, b) => a - b);
  return zeiten[Math.floor(runs / 2)];    // Median
}
```

> [!MERKSATZ]
> Ein Messwert ist eine Anekdote. Viele Messwerte nach dem Aufwärmen, zusammengefasst als Median, sind ein Ergebnis.

## Fallen, die Ergebnisse verfälschen

- **Wegoptimierter Code:** Benutzt du das Ergebnis nie, darf der Compiler den Aufruf streichen. Summiere oder
  speichere das Ergebnis.
- **Veränderte Eingaben:** Sortiert eine Funktion ihr Array an Ort und Stelle, misst du ab Lauf zwei nur noch
  „bereits sortiert“. Gib jedem Lauf eine frische Kopie.
- **Unrealistische Daten:** 10 Einträge statt 10 000 zeigen keine Unterschiede in der Laufzeitklasse.
- **Ungleiche Bedingungen:** Beide Varianten im selben Prozess, mit denselben Daten, direkt hintereinander.
- **Debug-Werkzeuge an:** Ein aktiver Debugger wie [[xdebug|Xdebug]] macht PHP um ein Vielfaches langsamer.

## Ergebnisse richtig lesen

Ein Benchmark liefert nicht „die Wahrheit“, sondern eine Messung mit Streuung. Drei Fragen helfen beim Einordnen:

| Frage | Woran du es erkennst |
|---|---|
| Ist der Unterschied echt? | Er bleibt bestehen, wenn du den Benchmark mehrmals neu startest. |
| Ist er groß genug? | 2 % Unterschied sind oft nur Rauschen, Faktor 10 nie. |
| Ist er relevant? | Die gesparte Zeit ist ein spürbarer Anteil der gesamten Antwortzeit. |

Vergleiche Varianten deshalb immer **relativ** („`Set.has()` ist rund 50-mal schneller“) und auf demselben Rechner.
Absolute Zahlen von deinem Laptop lassen sich nicht auf einen Server übertragen.

> [!PRAXIS]
> Schreib in die Beschreibung eines Performance-Pull-Requests, **wie** du gemessen hast: Rechner, Datenmenge,
> Anzahl Läufe, Median vorher und nachher. So können andere die Messung wiederholen – und du selbst in drei Monaten auch.

## Zusammenfassung

- Mikro-Benchmarks messen kleine Funktionen, Makro-Benchmarks ganze Abläufe – prüfe zuerst, ob die Stelle zählt.
- Miss mit einer **monotonen Uhr**: `performance.now()`, `process.hrtime.bigint()` oder `hrtime(true)`.
- **Aufwärmen**, viele Läufe einzeln messen, den **Median** berichten.
- Ergebnis weiterverwenden und jedem Lauf frische Eingabedaten geben.
- Dokumentiere Umgebung und Methode, damit die Messung wiederholbar ist.
