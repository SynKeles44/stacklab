---
title: Sortieren – einfach, effizient, eingebaut
summary: Wie Insertion Sort und Merge Sort funktionieren, warum O(n log n) die Grenze für Vergleichssortierungen ist und wie du die eingebaute Sortierung in JavaScript und PHP richtig benutzt.
duration: 25
sources:
  - title: MDN – Array.prototype.sort()
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
  - title: MDN – Array.prototype.toSorted()
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted
  - title: PHP-Handbuch – Sortieren von Arrays
    url: https://www.php.net/manual/de/array.sorting.php
  - title: PHP-Handbuch – usort
    url: https://www.php.net/manual/de/function.usort.php
quiz:
  - type: single
    question: "Was liefert `[10, 9, 1, 100].sort()` in JavaScript?"
    options: ["[1, 9, 10, 100]", "[1, 10, 100, 9]", "[100, 10, 9, 1]", "Einen TypeError"]
    answer: 1
    explanation: >
      Ohne Vergleichsfunktion wandelt `sort()` alle Werte in Strings um und vergleicht sie Zeichen für Zeichen.
      "10" kommt vor "9", weil "1" vor "9" steht. Für Zahlen brauchst du `sort((a, b) => a - b)`.
  - type: match
    question: Ordne jedem Verfahren seinen Aufwand im schlechtesten Fall zu.
    pairs:
      - { left: "Insertion Sort", right: "O(n²)" }
      - { left: "Merge Sort", right: "O(n log n)" }
      - { left: "Array.prototype.sort() in JavaScript", right: "O(n log n)" }
      - { left: "Insertion Sort auf bereits sortierten Daten", right: "O(n)" }
    explanation: >
      Insertion Sort ist im Allgemeinen quadratisch, bei fast sortierten Daten aber sehr schnell. Merge Sort und
      die eingebauten Sortierungen garantieren O(n log n).
  - type: find-bug
    question: Die Produkte sollen nach Preis absteigend sortiert werden. In welcher Zeile steckt der Fehler?
    language: js
    code: |
      const produkte = [
        { name: "Maus", preis: 19.9 },
        { name: "Monitor", preis: 189 },
        { name: "Kabel", preis: 4.5 },
      ];
      produkte.sort((a, b) => a.preis > b.preis);
    bug_line: 6
    explanation: >
      Die Vergleichsfunktion muss eine Zahl liefern – negativ, 0 oder positiv. Ein Boolean wird zu 0 oder 1
      und ergibt eine unzuverlässige Reihenfolge. Richtig: `(a, b) => b.preis - a.preis`.
  - type: multiple
    question: Welche Aussagen über stabiles Sortieren stimmen?
    options:
      - Bei gleichen Sortierschlüsseln bleibt die ursprüngliche Reihenfolge erhalten.
      - "`Array.prototype.sort()` ist in JavaScript seit ES2019 garantiert stabil."
      - PHP-Sortierfunktionen sind seit PHP 8.0 stabil.
      - Stabil heißt, dass die Sortierung nie länger als O(n) dauert.
    answers: [0, 1, 2]
    explanation: >
      Stabilität sagt nur etwas über gleiche Elemente aus. Sie ist praktisch, wenn du nacheinander nach mehreren
      Kriterien sortierst.
  - type: cloze
    text: "Der Raumschiff-Operator `$a ___ $b` liefert in PHP -1, 0 oder 1 und ist ideal für `usort()`."
    blanks:
      - ["<=>"]
    explanation: "`usort($liste, fn($a, $b) => $a['preis'] <=> $b['preis']);` sortiert aufsteigend nach Preis."
tasks:
  - id: zwei-sortierverfahren
    type: code
    language: js
    title: Insertion Sort und Merge Sort selbst schreiben
    description: |
      Schreibe zwei Sortierfunktionen. Beide bekommen eine Vergleichsfunktion `vergleich(a, b)`, die wie bei
      `Array.prototype.sort()` eine negative Zahl, 0 oder eine positive Zahl liefert. Nutze **nicht** die
      eingebaute `sort()`-Methode.

      1. `einfuegeSortieren(liste, vergleich)` sortiert das übergebene Array **an Ort und Stelle** und gibt es zurück.
      2. `mergeSort(liste, vergleich)` gibt ein **neues**, sortiertes Array zurück und lässt die Eingabe unverändert.
      3. Beide Verfahren müssen **stabil** sein: Gleiche Elemente behalten ihre Reihenfolge.
    starter: |
      function einfuegeSortieren(liste, vergleich) {
        for (let i = 1; i < liste.length; i++) {
          // liste[i] nach links schieben, solange der linke Nachbar größer ist
        }
        return liste;
      }

      function mergeSort(liste, vergleich) {
        if (liste.length <= 1) return liste.slice();
        // 1. halbieren  2. beide Hälften sortieren  3. zusammenführen
        return liste.slice();
      }
    tests:
      - name: Zahlen aufsteigend
        code: |
          const auf = (a, b) => a - b;
          assertDeepEqual(einfuegeSortieren([5, 2, 9, 1, 5, 6], auf), [1, 2, 5, 5, 6, 9]);
          assertDeepEqual(mergeSort([5, 2, 9, 1, 5, 6], auf), [1, 2, 5, 5, 6, 9]);
      - name: leere und einelementige Listen
        code: |
          const auf = (a, b) => a - b;
          assertDeepEqual(einfuegeSortieren([], auf), []);
          assertDeepEqual(mergeSort([], auf), []);
          assertDeepEqual(mergeSort([7], auf), [7]);
      - name: mergeSort verändert die Eingabe nicht
        code: |
          const eingabe = [3, 1, 2];
          const ergebnis = mergeSort(eingabe, (a, b) => a - b);
          assertDeepEqual(eingabe, [3, 1, 2]);
          assertDeepEqual(ergebnis, [1, 2, 3]);
      - name: beide sortieren stabil
        code: |
          const leute = [
            { name: "Ada", team: 2 }, { name: "Bo", team: 1 }, { name: "Cy", team: 2 },
            { name: "Di", team: 1 }, { name: "Ed", team: 2 },
          ];
          const nachTeam = (a, b) => a.team - b.team;
          const namen = (l) => l.map((p) => p.name).join(",");
          assertEqual(namen(mergeSort(leute, nachTeam)), "Bo,Di,Ada,Cy,Ed");
          assertEqual(namen(einfuegeSortieren(leute.slice(), nachTeam)), "Bo,Di,Ada,Cy,Ed");
      - name: mergeSort schafft 100 000 Zahlen schnell
        code: |
          const zahlen = Array.from({ length: 100000 }, (_, i) => (i * 7919) % 100003);
          const start = performance.now();
          const s = mergeSort(zahlen, (a, b) => a - b);
          assertTrue(performance.now() - start < 1000, "zu langsam – ist das wirklich O(n log n)?");
          for (let i = 1; i < s.length; i++) if (s[i - 1] > s[i]) throw new Error("nicht sortiert bei " + i);
    hints:
      - "Insertion Sort: Merke dir `const wert = liste[i]; let j = i - 1;` und schiebe mit `while (j >= 0 && vergleich(liste[j], wert) > 0)` größere Elemente eine Position nach rechts."
      - "Merge Sort: `const mitte = Math.floor(liste.length / 2);` – dann `mergeSort(liste.slice(0, mitte), vergleich)` und `mergeSort(liste.slice(mitte), vergleich)`."
      - "Beim Zusammenführen nimmst du bei Gleichstand (`vergleich(l[i], r[j]) <= 0`) das Element aus der **linken** Hälfte – das macht die Sortierung stabil."
    solution: |
      function einfuegeSortieren(liste, vergleich) {
        for (let i = 1; i < liste.length; i++) {
          const wert = liste[i];
          let j = i - 1;
          while (j >= 0 && vergleich(liste[j], wert) > 0) {
            liste[j + 1] = liste[j];
            j--;
          }
          liste[j + 1] = wert;
        }
        return liste;
      }

      function mergeSort(liste, vergleich) {
        if (liste.length <= 1) return liste.slice();
        const mitte = Math.floor(liste.length / 2);
        const links = mergeSort(liste.slice(0, mitte), vergleich);
        const rechts = mergeSort(liste.slice(mitte), vergleich);
        const ergebnis = [];
        let i = 0;
        let j = 0;
        while (i < links.length && j < rechts.length) {
          if (vergleich(links[i], rechts[j]) <= 0) ergebnis.push(links[i++]);
          else ergebnis.push(rechts[j++]);
        }
        while (i < links.length) ergebnis.push(links[i++]);
        while (j < rechts.length) ergebnis.push(rechts[j++]);
        return ergebnis;
      }
  - id: php-usort-produkte
    type: terminal
    title: Produkte in PHP nach mehreren Kriterien sortieren
    description: |
      `produkte.csv` enthält Produkte im Format `name;preis;bewertung` (erste Zeile = Überschriften).

      Klicke zuerst auf **Aufgabe vorbereiten**. Dann:

      1. Schreibe `sortiere.php`, das den Dateinamen als erstes Argument bekommt
         (`php sortiere.php produkte.csv`) und die Produkte einliest.
      2. Sortiere mit `usort()` und dem Raumschiff-Operator `<=>`:
         erst nach **Preis aufsteigend**, bei gleichem Preis nach **Bewertung absteigend**,
         bei gleicher Bewertung nach **Name aufsteigend**.
      3. Gib pro Produkt eine Zeile `Name: Preis` aus, den Preis genau so, wie er in der CSV steht
         (z. B. `Maus: 19.90`).

      Die Prüfung testet dein Skript zusätzlich mit einer zweiten, unbekannten CSV-Datei.
    workdir: php-sortieren
    setup: |
      cat > produkte.csv <<'EOF'
      name;preis;bewertung
      Tastatur;49.90;4.5
      Maus;19.90;4.1
      Monitor;189.00;4.7
      Headset;49.90;4.8
      Webcam;49.90;4.5
      Mauspad;9.90;3.9
      USB-Hub;19.90;4.1
      EOF
    checks:
      - type: file_contains
        path: sortiere.php
        pattern: "usort\\s*\\("
        message: Sortiere in sortiere.php mit usort() und einer eigenen Vergleichsfunktion.
      - type: file_contains
        path: sortiere.php
        pattern: "<=>"
        message: Nutze in der Vergleichsfunktion den Raumschiff-Operator <=>.
      - type: command
        run: "timeout 10 php sortiere.php produkte.csv | tr '\\n' '|'"
        stdout_equals: "Mauspad: 9.90|Maus: 19.90|USB-Hub: 19.90|Headset: 49.90|Tastatur: 49.90|Webcam: 49.90|Monitor: 189.00|"
        message: "Die Reihenfolge stimmt noch nicht. Erwartet wird zuerst `Mauspad: 9.90` und zuletzt `Monitor: 189.00`; bei 49.90 kommt Headset (4.8) vor Tastatur und Webcam (beide 4.5, dann alphabetisch)."
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          printf 'name;preis;bewertung\nBeta;100.00;4.0\nAlpha;99.00;4.0\nGamma;100.00;4.9\nDelta;100.00;4.0\n' > "$d/test.csv"
          out=$(timeout 10 php sortiere.php "$d/test.csv" | tr '\n' '|')
          rm -rf "$d"
          echo "$out"
        stdout_equals: "Alpha: 99.00|Gamma: 100.00|Beta: 100.00|Delta: 100.00|"
        message: "Mit einer anderen CSV stimmt die Reihenfolge nicht. Liest du den Dateinamen aus $argv[1]? Vergleichst du den Preis als Zahl (z. B. mit (float))?"
    hints:
      - "Einlesen: `$zeilen = file($argv[1], FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES); array_shift($zeilen);` entfernt die Überschrift. Danach `explode(';', $zeile)`."
      - "Mehrere Kriterien: `usort($produkte, fn($a, $b) => [(float) $a[1], (float) $b[2], $a[0]] <=> [(float) $b[1], (float) $a[2], $b[0]]);` – beachte die vertauschten Seiten bei der Bewertung."
      - "Ausgabe: `foreach ($produkte as [$name, $preis]) { echo \"{$name}: {$preis}\\n\"; }`"
    solution: |
      ```php
      <?php
      $zeilen = file($argv[1], FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
      array_shift($zeilen);

      $produkte = array_map(fn($zeile) => explode(';', $zeile), $zeilen);

      usort($produkte, fn($a, $b) =>
          [(float) $a[1], (float) $b[2], $a[0]] <=> [(float) $b[1], (float) $a[2], $b[0]]
      );

      foreach ($produkte as [$name, $preis]) {
          echo "{$name}: {$preis}\n";
      }
      ```

      ```bash
      php sortiere.php produkte.csv
      ```
---
Ein Online-Shop zeigt Produkte nach Preis, eine Tabelle nach Datum, ein Leaderboard nach Punkten. Sortieren
ist eine der häufigsten Operationen überhaupt – und eine der wichtigsten Vorbereitungen: Viele schnelle
Verfahren, etwa die binäre Suche, funktionieren nur auf sortierten Daten. In dieser Lektion lernst du ein
einfaches und ein effizientes [[sortierverfahren|Sortierverfahren]] kennen – und wie du die eingebaute
Sortierung ohne Stolperfallen benutzt.

## Insertion Sort: sortieren wie Spielkarten

Du nimmst Spielkarten einzeln auf und steckst jede an die richtige Stelle in deiner bereits sortierten Hand.
Genau das macht [[insertion-sort|Insertion Sort]]:

```js
function einfuegeSortieren(liste) {
  for (let i = 1; i < liste.length; i++) {
    const wert = liste[i];               // die neue Karte
    let j = i - 1;
    while (j >= 0 && liste[j] > wert) {  // größere Karten rücken nach rechts
      liste[j + 1] = liste[j];
      j--;
    }
    liste[j + 1] = wert;                 // Karte in die Lücke stecken
  }
  return liste;
}
```

Im schlechtesten Fall (umgekehrt sortiert) muss jede Karte an allen vorherigen vorbei: O(n²). Ist die
Liste dagegen **fast sortiert**, rückt kaum etwas – dann ist Insertion Sort nahezu O(n) und schlägt viele
„bessere“ Verfahren.

> [!MERKSATZ]
> Insertion Sort ist einfach, braucht keinen Zusatzspeicher und ist bei kleinen oder fast sortierten Listen
> unschlagbar – bei großen, ungeordneten Listen aber quadratisch.

## Merge Sort: teilen und zusammenführen

[[merge-sort|Merge Sort]] folgt dem Prinzip „Teile und herrsche“:

1. **Teilen:** Halbiere die Liste, bis nur noch einzelne Elemente übrig sind – die sind automatisch sortiert.
2. **Zusammenführen:** Füge je zwei sortierte Listen zu einer sortierten zusammen. Dazu vergleichst du immer
   nur die beiden vordersten Elemente und nimmst das kleinere.

![Merge Sort teilt die Liste und führt sortierte Hälften wieder zusammen](/assets/datenstrukturen-algorithmen/merge-sort.svg)

Das Halbieren ergibt log₂ n Ebenen, und auf jeder Ebene wird jedes Element einmal angefasst. Zusammen sind
das **O(n log n)** – auch im schlechtesten Fall. Dafür braucht Merge Sort O(n) zusätzlichen Speicher für die
Zwischenlisten.

| Verfahren | bester Fall | schlechtester Fall | Zusatzspeicher | stabil |
|---|---|---|---|---|
| Insertion Sort | O(n) | O(n²) | O(1) | ja |
| Merge Sort | O(n log n) | O(n log n) | O(n) | ja |

Schneller als O(n log n) geht es mit Verfahren, die nur Elemente **vergleichen**, grundsätzlich nicht.

## Die eingebaute Sortierung in JavaScript

Im Alltag schreibst du keine Sortierung selbst. `Array.prototype.sort()` nutzt in aktuellen Engines einen
Mix aus Merge Sort und Insertion Sort, ist stabil und O(n log n). Zwei Stolperfallen musst du kennen:

```js
[10, 9, 1, 100].sort();                  // [1, 10, 100, 9] – Strings werden verglichen!
[10, 9, 1, 100].sort((a, b) => a - b);   // [1, 9, 10, 100]

const preise = [3, 1, 2];
const sortiert = preise.toSorted((a, b) => a - b); // neues Array, preise bleibt [3, 1, 2]
```

Die [[vergleichsfunktion|Vergleichsfunktion]] liefert eine negative Zahl (a zuerst), 0 (gleich) oder eine
positive Zahl (b zuerst). Für Texte nimmst du `a.localeCompare(b)`, damit Umlaute richtig einsortiert werden.

> [!FEHLER]
> `sort()` verändert das Array an Ort und Stelle. Sortierst du so ein Array aus dem React-State oder aus
> Props, veränderst du fremde Daten. Nimm `toSorted()` oder sortiere eine Kopie.

## Stabil sortieren und mehrere Kriterien

Eine [[stabile-sortierung|stabile Sortierung]] lässt gleiche Elemente in ihrer ursprünglichen Reihenfolge.
Das ist wichtig, wenn eine Tabelle schon nach Namen sortiert ist und du jetzt nach Abteilung sortierst:
Innerhalb jeder Abteilung bleiben die Namen alphabetisch. `sort()` ist in JavaScript seit ES2019 garantiert
stabil.

Mehrere Kriterien verkettest du in einer Vergleichsfunktion:

```js
produkte.sort((a, b) =>
  a.preis - b.preis ||                // erst Preis aufsteigend
  b.bewertung - a.bewertung ||        // dann Bewertung absteigend
  a.name.localeCompare(b.name)        // dann Name
);
```

`||` greift nur, wenn der vorherige Vergleich 0 ergibt – also bei Gleichstand.

## Sortieren in PHP

PHP bringt viele Sortierfunktionen mit. Sie arbeiten an Ort und Stelle und sind seit PHP 8.0 stabil.

| Funktion | sortiert nach | Schlüssel bleiben? |
|---|---|---|
| `sort` / `rsort` | Wert auf- / absteigend | nein, neu nummeriert |
| `asort` / `arsort` | Wert | ja |
| `ksort` | Schlüssel | ja |
| `usort` | eigene Vergleichsfunktion | nein |

```php
usort($produkte, fn($a, $b) => $a['preis'] <=> $b['preis']);
```

Der [[raumschiff-operator|Raumschiff-Operator]] `<=>` liefert -1, 0 oder 1. Er vergleicht sogar Arrays Element für Element – damit
lassen sich mehrere Kriterien in einer Zeile ausdrücken.

> [!PRAXIS]
> Sortiere große Datenmengen möglichst schon in der Datenbank mit `ORDER BY` – am besten über einen Index.
> Im Code sortierst du, was schon geladen ist: Tabellenspalten, Suchergebnisse, Menüs.

## Zusammenfassung

- Insertion Sort steckt jedes Element an die richtige Stelle: O(n²), bei fast sortierten Daten O(n).
- Merge Sort halbiert und führt zusammen: immer O(n log n), braucht aber Zusatzspeicher.
- `sort()` ohne Vergleichsfunktion vergleicht Strings – für Zahlen immer `(a, b) => a - b` angeben.
- `sort()` verändert das Original, `toSorted()` liefert eine Kopie.
- Stabile Sortierungen behalten die Reihenfolge gleicher Elemente; JS und PHP sortieren stabil.
- In PHP sortiert `usort()` mit dem Raumschiff-Operator `<=>` – auch nach mehreren Kriterien.
