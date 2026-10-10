---
title: Big-O verstehen und Aufwand messen
summary: Wie du mit der Big-O-Notation abschätzt, wie Code bei wachsenden Datenmengen langsamer wird – und wie du die Schätzung mit einem Verdopplungstest überprüfst.
duration: 25
sources:
  - title: MDN – performance.now()
    url: https://developer.mozilla.org/en-US/docs/Web/API/Performance/now
  - title: MDN – Array.prototype.includes()
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
  - title: Node.js – Performance measurement APIs
    url: https://nodejs.org/api/perf_hooks.html
quiz:
  - type: single
    question: Was beschreibt die Big-O-Notation?
    options:
      - Wie viele Millisekunden eine Funktion genau braucht.
      - Wie der Aufwand einer Funktion wächst, wenn die Eingabe größer wird.
      - Wie viele Zeilen Code eine Funktion hat.
      - Wie viel Arbeitsspeicher der Rechner insgesamt besitzt.
    answer: 1
    explanation: >
      Big-O sagt nichts über konkrete Sekunden. Es beschreibt das Wachstum: Verdoppelt sich die Eingabe,
      verdoppelt sich der Aufwand (O(n)), vervierfacht er sich (O(n²)) oder bleibt er gleich (O(1))?
  - type: match
    question: Ordne jedem Code-Muster seine Aufwandsklasse zu (n = Länge von `liste`).
    pairs:
      - { left: "liste[0]", right: "O(1)" }
      - { left: "for (const x of liste) summe += x", right: "O(n)" }
      - { left: "Zwei verschachtelte Schleifen über liste", right: "O(n²)" }
      - { left: "Suchbereich wird in jedem Schritt halbiert", right: "O(log n)" }
    explanation: >
      Direkter Zugriff über den Index ist konstant, eine Schleife linear, zwei verschachtelte Schleifen
      quadratisch. Wer in jedem Schritt die Hälfte wegwirft, braucht nur logarithmisch viele Schritte.
  - type: find-bug
    question: Diese Funktion soll für 50 000 Bestellungen schnell sein, ist es aber nicht. Welche Zeile macht sie quadratisch?
    language: js
    code: |
      function neueKunden(bestellungen, bekannteIds) {
        const ergebnis = [];
        for (const b of bestellungen) {
          if (!bekannteIds.includes(b.kundeId)) {
            ergebnis.push(b.kundeId);
          }
        }
        return ergebnis;
      }
    bug_line: 4
    explanation: >
      `includes()` durchsucht das ganze Array – das ist eine versteckte Schleife. In der äußeren Schleife
      aufgerufen ergibt das O(n · m). Mit `const bekannt = new Set(bekannteIds)` und `bekannt.has(...)` wird
      daraus O(n + m).
  - type: cloze
    text: "Verdoppelst du die Eingabe und die Laufzeit verdoppelt sich ungefähr, ist der Code wahrscheinlich O(___). Vervierfacht sie sich, ist er wahrscheinlich O(___)."
    blanks:
      - ["n"]
      - ["n²", "n^2", "n2", "n*n"]
    explanation: Das ist die Idee des Verdopplungstests – du liest die Klasse am Faktor zwischen zwei Messungen ab.
  - type: multiple
    question: Welche Aussagen über Big-O stimmen?
    options:
      - Konstante Faktoren fallen weg – O(2n) schreibt man als O(n).
      - Bei kleinen Datenmengen kann ein O(n²)-Algorithmus schneller sein als ein O(n log n)-Algorithmus.
      - Ein O(1)-Zugriff dauert immer genau eine Nanosekunde.
      - Bei zwei Schleifen nacheinander addiert sich der Aufwand, bei verschachtelten multipliziert er sich.
    answers: [0, 1, 3]
    explanation: >
      O(1) heißt nur „unabhängig von n“ – der Zugriff kann trotzdem langsam sein. Und weil Konstanten
      wegfallen, kann bei kleinen n die „schlechtere“ Klasse gewinnen.
tasks:
  - id: aufwand-zuordnen
    type: dragdrop
    title: Welche Aufwandsklasse hat der Code?
    description: >
      Ordne jedes Code-Stück der passenden Aufwandsklasse zu. `n` ist jeweils die Länge des Arrays `liste`
      bzw. die Größe von `zahl`.
    targets:
      - { id: konstant, label: "O(1) – konstant" }
      - { id: logarithmisch, label: "O(log n) – logarithmisch" }
      - { id: linear, label: "O(n) – linear" }
      - { id: quadratisch, label: "O(n²) – quadratisch" }
    items:
      - { label: "liste[liste.length - 1]", target: konstant }
      - { label: "liste.push(42)", target: konstant }
      - { label: "liste.includes(42)", target: linear }
      - { label: "Math.max(...liste)", target: linear }
      - { label: "while (zahl > 1) zahl = Math.floor(zahl / 2)", target: logarithmisch }
      - { label: "for (const a of liste) for (const b of liste) vergleiche(a, b)", target: quadratisch }
      - { label: "for (const a of liste) if (liste.indexOf(a) !== liste.lastIndexOf(a)) zaehle++", target: quadratisch }
    hints:
      - Zähle die Schleifen – auch die versteckten in Methoden wie `includes`, `indexOf` oder dem Spread in `Math.max`.
      - Halbiert sich die Zahl bei jedem Durchlauf, brauchst du nur wenige Schritte, selbst bei riesigen Zahlen.
  - id: verdopplungstest
    type: terminal
    title: Der Verdopplungstest
    description: |
      In `kandidaten.js` liegen zwei Funktionen, die beide prüfen, ob ein Array doppelte Werte enthält.
      `variante1` vergleicht jedes Element mit jedem anderen, `variante2` merkt sich bereits gesehene
      Werte in einem `Set`. Finde durch Messen heraus, wie ihr Aufwand wächst.

      Klicke zuerst auf **Aufgabe vorbereiten**. Dann:

      1. Lege `messung.js` an und lade die Funktionen mit
         `const { variante1, variante2, erzeugeDaten } = require('./kandidaten.js');`.
      2. Miss jede Variante für `n = 2000`, `4000` und `8000` (Daten mit `erzeugeDaten(n)`).
         Nutze `performance.now()` und nimm je Größe den **Median** aus 5 Läufen.
      3. Gib pro Messung eine Zeile aus, z. B. `variante1 n=4000: 12.3 ms`.
      4. Lies den Faktor zwischen den Zeilen ab und schreibe in `klassen.txt` zwei Zeilen:
         `variante1: O(...)` und `variante2: O(...)`.
    workdir: verdopplungstest
    setup: |
      cat > kandidaten.js <<'EOF'
      function erzeugeDaten(n) {
        // n verschiedene Zahlen – es gibt also keine Doppelten (schlechtester Fall)
        return Array.from({ length: n }, (_, i) => i * 7);
      }

      function variante1(liste) {
        for (let i = 0; i < liste.length; i++) {
          for (let j = i + 1; j < liste.length; j++) {
            if (liste[i] === liste[j]) return true;
          }
        }
        return false;
      }

      function variante2(liste) {
        const gesehen = new Set();
        for (const wert of liste) {
          if (gesehen.has(wert)) return true;
          gesehen.add(wert);
        }
        return false;
      }

      module.exports = { variante1, variante2, erzeugeDaten };
      EOF
    checks:
      - type: file_contains
        path: messung.js
        pattern: "performance\\.now\\(|hrtime"
        message: Miss die Zeit in messung.js mit performance.now() (oder process.hrtime.bigint()).
      - type: command
        run: timeout 60 node messung.js | grep -cE "variante1.*(2000|4000|8000).*[0-9]"
        stdout_matches: "^\\s*3\\s*$"
        message: "messung.js soll für variante1 drei Zeilen ausgeben – je eine für n=2000, 4000 und 8000, z. B. `variante1 n=4000: 12.3 ms`."
      - type: command
        run: timeout 60 node messung.js | grep -cE "variante2.*(2000|4000|8000).*[0-9]"
        stdout_matches: "^\\s*3\\s*$"
        message: "messung.js soll auch für variante2 drei Zeilen ausgeben."
      - type: file_contains
        path: klassen.txt
        pattern: "variante1:\\s*O\\((n²|n\\^2|n\\*n|n2)\\)"
        message: "Schau dir den Faktor bei variante1 noch einmal an: Bei doppeltem n braucht sie etwa viermal so lange. Schreibe `variante1: O(n²)` (oder `O(n^2)`) in klassen.txt."
      - type: file_contains
        path: klassen.txt
        pattern: "variante2:\\s*O\\(n\\)"
        message: "In klassen.txt fehlt die Zeile `variante2: O(n)` – bei doppeltem n braucht sie etwa doppelt so lange."
    hints:
      - "Eine Hilfsfunktion `miss(fn, daten)` ruft `fn(daten)` fünfmal auf, sammelt die Dauer in einem Array, sortiert es und gibt das mittlere Element zurück."
      - "`for (const n of [2000, 4000, 8000]) { ... }` – erzeuge die Daten einmal pro n und miss dann beide Varianten."
      - "Bei variante1 wächst die Zeit ungefähr um den Faktor 4 pro Verdopplung, bei variante2 um den Faktor 2. Sehr kleine Zeiten (unter 1 ms) schwanken stark – das ist normal."
    solution: |
      ```js
      // messung.js
      const { variante1, variante2, erzeugeDaten } = require('./kandidaten.js');

      function miss(fn, daten) {
        const zeiten = [];
        for (let i = 0; i < 5; i++) {
          const start = performance.now();
          fn(daten);
          zeiten.push(performance.now() - start);
        }
        zeiten.sort((a, b) => a - b);
        return zeiten[2];
      }

      for (const n of [2000, 4000, 8000]) {
        const daten = erzeugeDaten(n);
        console.log(`variante1 n=${n}: ${miss(variante1, daten).toFixed(2)} ms`);
        console.log(`variante2 n=${n}: ${miss(variante2, daten).toFixed(2)} ms`);
      }
      ```

      ```bash
      node messung.js
      printf 'variante1: O(n²)\nvariante2: O(n)\n' > klassen.txt
      ```
---
Deine Funktion filtert eine Kundenliste. Im Test mit 100 Einträgen ist sie sofort fertig. In Produktion
kommen 100 000 Einträge – und plötzlich friert die Seite für zehn Sekunden ein. Der Code hat sich nicht
geändert, nur die Datenmenge. Wie stark Code bei mehr Daten langsamer wird, beschreibt die
[[big-o-notation|Big-O-Notation]]. Sie ist das wichtigste Werkzeug dieses Kurses.

## Warum „schnell genug“ nicht reicht

Ein [[algorithmus|Algorithmus]] ist eine Schritt-für-Schritt-Anleitung, eine
[[datenstruktur|Datenstruktur]] die Art, wie Daten im Speicher organisiert sind. Beides bestimmt, wie viel
Arbeit dein Programm erledigen muss.

Stell dir vor, du suchst in einem Stapel Briefe nach einem Absender:

- **Ungeordneter Stapel:** Du schaust im schlimmsten Fall jeden Brief an. Doppelt so viele Briefe – doppelt so viel Arbeit.
- **Alphabetisch sortierter Ordner:** Du schlägst in der Mitte auf und weißt sofort, in welcher Hälfte du weitersuchst.
- **Fächer mit Namensschild:** Du greifst direkt ins richtige Fach – egal, wie viele Briefe es gibt.

Bei zehn Briefen ist alles gleich schnell. Bei einer Million entscheidet die Organisation darüber, ob
du Sekunden oder Tage brauchst.

## Big-O: Wie wächst der Aufwand?

Big-O beschreibt, wie die Anzahl der Arbeitsschritte wächst, wenn die Eingabe größer wird. Die Größe der
Eingabe nennt man **n** – etwa die Länge eines Arrays. Man betrachtet meist den **schlechtesten Fall**.

| Klasse | Name | n = 1 000 | n = 1 000 000 | Beispiel |
|---|---|---|---|---|
| O(1) | konstant | 1 | 1 | `liste[5]`, `map.get(key)` |
| O(log n) | logarithmisch | ≈ 10 | ≈ 20 | binäre Suche |
| O(n) | linear | 1 000 | 1 000 000 | eine Schleife |
| O(n log n) | „n log n“ | ≈ 10 000 | ≈ 20 000 000 | gute Sortierverfahren |
| O(n²) | quadratisch | 1 000 000 | 10¹² | zwei verschachtelte Schleifen |

![Wachstumskurven der wichtigsten Aufwandsklassen](/assets/datenstrukturen-algorithmen/big-o-kurven.svg)

Zwei Vereinfachungen gehören dazu: **Konstanten fallen weg** (O(3n) ist O(n)) und **nur der größte Term
zählt** (O(n² + n) ist O(n²)). Denn bei großen n dominiert der schnellste Anstieg alles andere.

> [!MERKSATZ]
> Big-O misst keine Sekunden, sondern das **Wachstum** des Aufwands mit der Eingabegröße n.

## Aufwand am Code ablesen

Du musst keine Formeln aufstellen. Drei Regeln reichen für den Alltag:

1. **Schleifen nacheinander addieren sich:** O(n) + O(n) = O(n).
2. **Verschachtelte Schleifen multiplizieren sich:** O(n) · O(n) = O(n²).
3. **Versteckte Schleifen mitzählen:** `includes`, `indexOf`, `find`, `filter`, `shift` und der Spread `...liste` laufen intern über das Array.

```js
function gemeinsame(a, b) {
  return a.filter((x) => b.includes(x)); // filter: n, includes: m → O(n · m)
}

function gemeinsameSchnell(a, b) {
  const inB = new Set(b);                 // O(m)
  return a.filter((x) => inB.has(x));     // O(n), has ist O(1) → gesamt O(n + m)
}
```

> [!FEHLER]
> `liste.includes()` in einer Schleife sieht harmlos aus, ist aber eine zweite Schleife. Bei 10 000
> Elementen sind das 100 Millionen Vergleiche.

Neben der Zeit gibt es auch den **Speicheraufwand**: `gemeinsameSchnell` braucht O(m) zusätzlichen Speicher
für das `Set`. Oft tauschst du Speicher gegen Zeit – meist ein guter Tausch.

## Messen statt raten: der Verdopplungstest

Eine Schätzung ist eine Hypothese. Überprüfen kannst du sie mit dem **Verdopplungstest**: Miss die
Laufzeit für n, 2n und 4n und schau dir den Faktor zwischen den Messungen an.

| Faktor bei doppeltem n | wahrscheinliche Klasse |
|---|---|
| ≈ 1 | O(1) oder O(log n) |
| ≈ 2 | O(n) |
| etwas über 2 | O(n log n) |
| ≈ 4 | O(n²) |

```js title="messung.js"
function miss(fn, daten) {
  const zeiten = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now();   // monotone Uhr, Millisekunden mit Nachkommastellen
    fn(daten);
    zeiten.push(performance.now() - start);
  }
  zeiten.sort((a, b) => a - b);
  return zeiten[2];                    // Median aus 5 Läufen
}
```

Einzelne Messungen schwanken. Deshalb nimmst du den [[median|Median]] mehrerer Läufe und vergleichst nur
Messungen derselben Maschine. Wie man richtige [[benchmark|Benchmarks]] baut, vertieft der Kurs
„Performance“.

> [!PRAXIS]
> Bevor du Code „optimierst“, miss ihn mit realistischen Datenmengen. Ein O(n²) über 50 Elemente ist
> egal – über 50 000 Elemente ist es ein Bug, der erst in Produktion auffällt.

## Zusammenfassung

- Big-O beschreibt, wie der Aufwand mit der Eingabegröße n wächst – nicht, wie viele Millisekunden etwas dauert.
- Die wichtigsten Klassen: O(1), O(log n), O(n), O(n log n), O(n²).
- Konstanten und kleinere Terme fallen weg; verschachtelte Schleifen multiplizieren sich.
- Methoden wie `includes`, `indexOf` und `filter` sind versteckte Schleifen.
- Der Verdopplungstest überprüft deine Schätzung: Faktor 2 heißt linear, Faktor 4 quadratisch.
- Oft lohnt es sich, etwas Speicher (z. B. ein `Set`) gegen viel Zeit zu tauschen.
