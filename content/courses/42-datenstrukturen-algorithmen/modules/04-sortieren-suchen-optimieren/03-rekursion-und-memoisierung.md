---
title: Rekursion, Memoisierung und dynamische Programmierung
summary: Wie rekursive Funktionen funktionieren, wann du sie besser als Schleife schreibst und wie Memoisierung und dynamische Programmierung aus exponentiellem Aufwand linearen machen.
duration: 25
sources:
  - title: MDN – Recursion (Glossar)
    url: https://developer.mozilla.org/en-US/docs/Glossary/Recursion
  - title: MDN – Too much recursion (RangeError)
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Too_much_recursion
  - title: PHP-Handbuch – Statische Variablen
    url: https://www.php.net/manual/de/language.variables.scope.php#language.variables.scope.static
quiz:
  - type: single
    question: Was passiert, wenn eine rekursive Funktion keinen erreichbaren Basisfall hat?
    options:
      - Sie gibt automatisch `undefined` zurück.
      - Sie ruft sich endlos selbst auf, bis der Call Stack voll ist und ein Fehler geworfen wird.
      - JavaScript wandelt sie automatisch in eine Schleife um.
      - Sie läuft endlos, aber ohne Speicher zu verbrauchen.
    answer: 1
    explanation: >
      Jeder Aufruf legt einen Rahmen auf den Call Stack. Ohne Basisfall wächst er, bis JavaScript einen
      `RangeError: Maximum call stack size exceeded` wirft.
  - type: find-bug
    question: "`summe(liste)` soll alle Zahlen eines Arrays rekursiv addieren. In welcher Zeile steckt der Fehler?"
    language: js
    code: |
      function summe(liste) {
        if (liste.length === 1) return liste[0];
        return liste[0] + summe(liste.slice(1));
      }
      console.log(summe([]));
    bug_line: 2
    explanation: >
      Der Basisfall deckt das leere Array nicht ab. `summe([])` ruft sich mit `[].slice(1)` endlos selbst auf.
      Ein robuster Basisfall ist `if (liste.length === 0) return 0;`.
  - type: multiple
    question: Wann lohnt sich Memoisierung?
    options:
      - Wenn dieselbe Funktion mehrfach mit denselben Argumenten aufgerufen wird.
      - Wenn die Funktion für dieselben Argumente immer dasselbe Ergebnis liefert.
      - Wenn die Funktion bei jedem Aufruf die aktuelle Uhrzeit zurückgibt.
      - Wenn eine rekursive Lösung dieselben Teilprobleme immer wieder neu berechnet.
    answers: [0, 1, 3]
    explanation: >
      Memoisierung setzt reine Funktionen voraus: gleiche Eingabe, gleiches Ergebnis. Eine Funktion, die die
      Uhrzeit liefert, darf man nicht zwischenspeichern.
  - type: match
    question: Ordne jeder Variante von `fib(n)` ihren Aufwand zu.
    pairs:
      - { left: "naiv rekursiv: fib(n-1) + fib(n-2)", right: "O(2ⁿ) – exponentiell" }
      - { left: "rekursiv mit Map als Memo", right: "O(n) Zeit, O(n) Speicher" }
      - { left: "Schleife mit zwei Variablen", right: "O(n) Zeit, O(1) Speicher" }
    explanation: >
      Die naive Variante berechnet dieselben Werte immer wieder. Das Memo merkt sich jedes Ergebnis einmal.
      Die Schleife (Bottom-up) braucht nur die letzten beiden Werte.
  - type: cloze
    text: "Bei der dynamischen Programmierung löst du zuerst die kleinsten ___ und baust daraus Schritt für Schritt die Lösung des großen Problems."
    blanks:
      - ["Teilprobleme", "Teilproblem", "Teilaufgaben"]
    explanation: Das nennt man Bottom-up. Memoisierung ist dieselbe Idee von oben nach unten (Top-down).
tasks:
  - id: memo-und-dp
    type: code
    language: js
    title: Treppen und Wechselgeld
    description: |
      Zwei klassische Aufgaben, die naiv exponentiell und mit Memoisierung bzw. dynamischer Programmierung linear sind.

      1. `treppenWege(n)`: Du steigst eine Treppe mit `n` Stufen hinauf und nimmst pro Schritt **eine oder zwei**
         Stufen. Auf wie viele Arten kommst du oben an? `treppenWege(0)` ist `1` (nichts tun), `treppenWege(3)` ist `3`
         (1+1+1, 1+2, 2+1). Die Funktion muss `treppenWege(70)` sofort liefern.
      2. `wenigsteMuenzen(betrag, muenzen)`: die kleinste Anzahl Münzen, die zusammen genau `betrag` Cent
         ergeben (jede Münzsorte beliebig oft). Ist der Betrag nicht erreichbar, liefere `-1`. `betrag` ist höchstens 10 000.
    starter: |
      function treppenWege(n) {
        // naiv: treppenWege(n - 1) + treppenWege(n - 2) – viel zu langsam für n = 70
        return 0;
      }

      function wenigsteMuenzen(betrag, muenzen) {
        // Tipp: Tabelle beste[0..betrag], beste[0] = 0
        return -1;
      }
    tests:
      - name: kleine Treppen
        code: |
          assertEqual(treppenWege(0), 1);
          assertEqual(treppenWege(1), 1);
          assertEqual(treppenWege(3), 3);
          assertEqual(treppenWege(5), 8);
      - name: lange Treppe sofort
        code: |
          const start = performance.now();
          assertEqual(treppenWege(70), 308061521170129);
          assertTrue(performance.now() - start < 100, "zu langsam – merkst du dir Zwischenergebnisse?");
      - name: Wechselgeld mit gängigen Münzen
        code: |
          assertEqual(wenigsteMuenzen(0, [1, 2, 5]), 0);
          assertEqual(wenigsteMuenzen(11, [1, 2, 5]), 3);
          assertEqual(wenigsteMuenzen(99, [1, 2, 5, 10, 20, 50]), 6);
      - name: gierig wäre falsch
        code: |
          assertEqual(wenigsteMuenzen(6, [1, 3, 4]), 2);
      - name: nicht erreichbar
        code: |
          assertEqual(wenigsteMuenzen(3, [2]), -1);
          assertEqual(wenigsteMuenzen(7, []), -1);
      - name: großer Betrag schnell
        code: |
          const start = performance.now();
          assertEqual(wenigsteMuenzen(9999, [1, 2, 5, 10, 20, 50, 100, 200]), 56);
          assertTrue(performance.now() - start < 500, "zu langsam");
    hints:
      - "`treppenWege`: Auf Stufe n kommst du von Stufe n-1 oder n-2. Also gilt `wege(n) = wege(n-1) + wege(n-2)` – merke dir Ergebnisse in einer `Map` oder rechne mit einer Schleife von unten nach oben."
      - "`wenigsteMuenzen`: Lege `const beste = new Array(betrag + 1).fill(Infinity); beste[0] = 0;` an. Für jeden Betrag `b` von 1 bis `betrag` probierst du jede Münze `m <= b`: `beste[b] = Math.min(beste[b], beste[b - m] + 1)`."
      - "Am Ende ist `beste[betrag]` die Antwort – oder `-1`, wenn dort noch `Infinity` steht."
    solution: |
      function treppenWege(n) {
        let vorletzte = 1; // Wege für Stufe 0
        let letzte = 1;    // Wege für Stufe 1
        if (n === 0) return 1;
        for (let i = 2; i <= n; i++) {
          const neu = vorletzte + letzte;
          vorletzte = letzte;
          letzte = neu;
        }
        return letzte;
      }

      function wenigsteMuenzen(betrag, muenzen) {
        const beste = new Array(betrag + 1).fill(Infinity);
        beste[0] = 0;
        for (let b = 1; b <= betrag; b++) {
          for (const m of muenzen) {
            if (m <= b && beste[b - m] + 1 < beste[b]) {
              beste[b] = beste[b - m] + 1;
            }
          }
        }
        return beste[betrag] === Infinity ? -1 : beste[betrag];
      }
  - id: rekursion-oder-schleife
    type: dragdrop
    title: Rekursion, Schleife oder Memo?
    description: >
      Für welche Aufgabe passt welcher Ansatz am besten? Ordne jedes Problem dem Ansatz zu, den du im Alltag
      wählen würdest.
    targets:
      - { id: rekursion, label: Rekursion (natürliche Baumstruktur) }
      - { id: schleife, label: Einfache Schleife }
      - { id: memo, label: Memoisierung / dynamische Programmierung }
    items:
      - { label: "Ein verschachteltes Kommentar-Objekt mit Antworten auf Antworten rendern", target: rekursion }
      - { label: "Alle Dateien in einem Ordner samt Unterordnern auflisten", target: rekursion }
      - { label: "Die Summe aller Preise in einem flachen Array bilden", target: schleife }
      - { label: "Die größte Zahl in einer Liste finden", target: schleife }
      - { label: "Die Anzahl der Wege durch ein Raster berechnen, bei der dieselben Teilwege ständig neu vorkommen", target: memo }
      - { label: "Die minimale Anzahl Münzen für einen Betrag bestimmen", target: memo }
    hints:
      - Rekursion passt, wenn die Daten selbst verschachtelt sind – Bäume, Ordner, Kommentare.
      - Memoisierung lohnt sich, wenn sich Teilprobleme wiederholen.
---
Du willst die Größe eines Ordners samt aller Unterordner berechnen. Die Antwort lautet: die Größe der
eigenen Dateien plus die Größe jedes Unterordners. Und wie groß ist ein Unterordner? Genauso. Wenn sich ein
Problem durch eine kleinere Version seiner selbst erklären lässt, ist [[rekursion|Rekursion]] die natürliche
Lösung. In dieser Lektion lernst du, wann sie glänzt, wann sie gefährlich ist – und wie du sie mit
Memoisierung beschleunigst.

## Eine Funktion, die sich selbst aufruft

Jede rekursive Funktion besteht aus zwei Teilen:

1. Dem [[basisfall|Basisfall]]: ein Fall, der ohne weiteren Aufruf direkt beantwortet wird.
2. Dem **rekursiven Fall**: Die Funktion ruft sich mit einem **kleineren** Problem auf.

```js
function fakultaet(n) {
  if (n <= 1) return 1;              // Basisfall
  return n * fakultaet(n - 1);       // rekursiver Fall: n wird kleiner
}

fakultaet(4); // 4 * 3 * 2 * 1 = 24
```

Jeder Aufruf legt einen Rahmen auf den [[call-stack|Call Stack]]: `fakultaet(4)` wartet auf `fakultaet(3)`,
das auf `fakultaet(2)` wartet und so weiter. Erst wenn der Basisfall erreicht ist, werden die Ergebnisse
nacheinander zurückgereicht.

> [!MERKSATZ]
> Ohne erreichbaren Basisfall gibt es keine Rekursion, sondern eine Endlosschleife auf dem Call Stack.

## Rekursion oder Schleife?

Jede Rekursion lässt sich als Schleife schreiben – notfalls mit einem eigenen Stack, wie du es bei Bäumen
gesehen hast. Was ist besser?

| Kriterium | Rekursion | Schleife |
|---|---|---|
| Verschachtelte Daten (Bäume, Ordner) | sehr lesbar | braucht eigenen Stack |
| Flache Daten (Listen, Zähler) | unnötig umständlich | natürlich |
| Speicher | ein Stack-Rahmen pro Ebene | konstant oder eigener Stack |
| sehr große Tiefe | Gefahr von Stack Overflow | kein Problem |

Der Call Stack ist begrenzt – in Node.js reicht er für grob zehntausend Ebenen. Darüber wirft JavaScript
einen [[stack-overflow|Stack Overflow]] als `RangeError`. Verlass dich nicht darauf, dass die Laufzeit
Rekursion wegoptimiert: Node.js und PHP tun das nicht.

> [!FEHLER]
> Ein Basisfall, der nicht jeden Eingabefall abdeckt: `if (liste.length === 1)` vergisst die leere Liste,
> `if (n === 0)` vergisst negative Zahlen. Die Funktion läuft dann bis zum Stack Overflow.

## Das Problem: dieselbe Arbeit immer wieder

Die Fibonacci-Zahlen sind definiert als `fib(n) = fib(n-1) + fib(n-2)`. Direkt übersetzt:

```js
function fib(n) {
  if (n < 2) return n;
  return fib(n - 1) + fib(n - 2);
}
```

Das sieht harmlos aus, ist aber eine Katastrophe: `fib(5)` berechnet `fib(3)` zweimal und `fib(2)` dreimal.
Der Aufrufbaum verdoppelt sich mit jeder Ebene – der Aufwand ist **O(2ⁿ)**. `fib(50)` dauert so Minuten.

![Der Aufrufbaum von fib(5) mit doppelt berechneten Teilproblemen](/assets/datenstrukturen-algorithmen/fib-aufrufbaum.svg)

## Memoisierung: einmal rechnen, dann merken

[[memoisierung|Memoisierung]] heißt: Jedes Ergebnis wird beim ersten Mal in einer Map gespeichert und danach
nur noch nachgeschlagen.

```js
function fibMemo(n, memo = new Map()) {
  if (n < 2) return n;
  if (memo.has(n)) return memo.get(n);         // schon berechnet?
  const ergebnis = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  memo.set(n, ergebnis);
  return ergebnis;
}

fibMemo(70); // sofort – jedes n wird genau einmal berechnet: O(n)
```

Das funktioniert nur bei [[reine-funktion|reinen Funktionen]]: Dieselbe Eingabe muss immer dasselbe Ergebnis liefern. In
PHP merkst du dir Werte für die Dauer einer Anfrage oft in einer `static`-Variable oder einer Eigenschaft.

> [!PRAXIS]
> `useMemo` in React, berechnete Eigenschaften in Frameworks und Request-Caches in Laravel sind
> Memoisierung im Großen: Teure Ergebnisse werden zu ihren Eingaben gespeichert und wiederverwendet.

## Dynamische Programmierung: von unten nach oben

Die [[dynamische-programmierung|dynamische Programmierung]] dreht die Richtung um: Statt oben anzufangen und
nach unten zu rekursieren, löst du die kleinsten Teilprobleme zuerst und baust die Lösung in einer Tabelle
oder Schleife auf (*Bottom-up*).

```js
function fibSchleife(n) {
  let a = 0, b = 1;              // fib(0), fib(1)
  for (let i = 0; i < n; i++) {
    [a, b] = [b, a + b];         // eine Stufe weiter
  }
  return a;                      // O(n) Zeit, O(1) Speicher, keine Rekursion
}
```

Das Muster passt immer, wenn sich ein Problem aus **überlappenden Teilproblemen** zusammensetzt: Wege durch
ein Raster, Wechselgeld mit den wenigsten Münzen, die Ähnlichkeit zweier Texte (so arbeitet z. B. ein Diff).
Eine „gierige“ Strategie – immer die größte Münze nehmen – liefert dort nicht immer das beste Ergebnis.

## Zusammenfassung

- Eine rekursive Funktion braucht einen Basisfall und einen rekursiven Fall, der das Problem verkleinert.
- Jeder Aufruf belegt einen Rahmen auf dem Call Stack; zu tiefe Rekursion endet im Stack Overflow.
- Für verschachtelte Daten ist Rekursion lesbar, für flache Daten ist die Schleife natürlicher.
- Naive Rekursion mit überlappenden Teilproblemen kann exponentiell werden (O(2ⁿ)).
- Memoisierung speichert Ergebnisse reiner Funktionen in einer Map und macht daraus O(n).
- Dynamische Programmierung löst Teilprobleme von unten nach oben – oft mit konstantem Speicher.
