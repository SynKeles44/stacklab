---
title: Bäume durchlaufen – tief und breit
summary: Wie du jeden Knoten eines Baums genau einmal besuchst – mit Tiefensuche (rekursiv oder mit eigenem Stack) und Breitensuche (mit einer Queue) – am Beispiel von Menüs, DOM und Ordnern.
duration: 25
sources:
  - title: MDN – Element.children
    url: https://developer.mozilla.org/en-US/docs/Web/API/Element/children
  - title: MDN – Document.createTreeWalker()
    url: https://developer.mozilla.org/en-US/docs/Web/API/Document/createTreeWalker
  - title: Node.js – fs.readdirSync mit withFileTypes
    url: https://nodejs.org/api/fs.html#fsreaddirsyncpath-options
quiz:
  - type: single
    question: Welche Hilfsstruktur nutzt die Breitensuche, um Knoten Ebene für Ebene zu besuchen?
    options: [Einen Stack, Eine Queue, Ein Set, Einen Suchbaum]
    answer: 1
    explanation: >
      Die Breitensuche hängt entdeckte Kinder hinten an eine Warteschlange und nimmt vorne den nächsten Knoten.
      So kommen erst alle Knoten der Ebene 1, dann alle der Ebene 2 dran (FIFO).
  - type: match
    question: "Ordne jeder Durchlauf-Art die Reihenfolge für diesen Baum zu: A hat die Kinder B und C, B hat das Kind D."
    pairs:
      - { left: "Tiefensuche, Preorder (erst der Knoten, dann die Kinder)", right: "A, B, D, C" }
      - { left: "Tiefensuche, Postorder (erst die Kinder, dann der Knoten)", right: "D, B, C, A" }
      - { left: "Breitensuche (Ebene für Ebene)", right: "A, B, C, D" }
    explanation: >
      Preorder schreibt einen Knoten auf, bevor es tiefer geht. Postorder erst, wenn alle Kinder fertig sind.
      Die Breitensuche arbeitet Ebene für Ebene von links nach rechts.
  - type: find-bug
    question: "`zaehleDateien()` soll alle Dateien in einem verschachtelten Ordner-Objekt zählen. In welcher Zeile steckt der Fehler?"
    language: js
    code: |
      function zaehleDateien(ordner) {
        let anzahl = ordner.dateien.length;
        for (const unterordner of ordner.ordner) {
          zaehleDateien(unterordner);
        }
        return anzahl;
      }
    bug_line: 4
    explanation: >
      Der rekursive Aufruf liefert ein Ergebnis, das hier weggeworfen wird. Richtig ist
      `anzahl += zaehleDateien(unterordner);` – sonst zählt die Funktion nur die oberste Ebene.
  - type: multiple
    question: Welche Aussagen über das Durchlaufen von Bäumen stimmen?
    options:
      - Jeder vollständige Durchlauf besucht jeden Knoten genau einmal und ist O(n).
      - Eine rekursive Tiefensuche kann bei sehr tiefen Bäumen den Call Stack sprengen.
      - Eine Tiefensuche lässt sich mit einem eigenen Stack auch ohne Rekursion schreiben.
      - Die Breitensuche ist immer schneller als die Tiefensuche.
    answers: [0, 1, 2]
    explanation: >
      Beide Verfahren besuchen alle n Knoten. Welches besser passt, hängt von der Frage ab: Die Breitensuche
      findet zum Beispiel den am wenigsten tief liegenden Treffer zuerst.
tasks:
  - id: breitensuche-reihenfolge
    type: order
    title: In welcher Reihenfolge besucht die Breitensuche das Menü?
    description: |
      Ein Navigationsmenü ist so aufgebaut:

      - **Start**
        - **Produkte** mit den Kindern *Software* und *Hardware*
        - **Hilfe** mit dem Kind *FAQ*
        - **Kontakt**

      Die Breitensuche beginnt bei *Start* und hängt die Kinder immer von links nach rechts an die Queue.
      Bring die Menüpunkte in die Reihenfolge, in der sie besucht werden.
    items: [Start, Produkte, Hilfe, Kontakt, Software, Hardware, FAQ]
    hints:
      - Erst kommt die Wurzel, dann alle ihre direkten Kinder, erst danach die Enkel.
      - Software und Hardware stehen in der Queue hinter Kontakt, weil sie erst beim Besuch von Produkte entdeckt werden.
  - id: kategorien-durchlaufen
    type: code
    language: ts
    title: Kategorienbaum auswerten
    description: |
      Ein Shop liefert seine Kategorien als Baum vom Typ `Kategorie`. Schreibe drei Funktionen:

      1. `alleNamen(k)` liefert alle Namen in **Preorder** (erst der Knoten, dann die Kinder von links nach rechts).
      2. `tiefe(k)` liefert die Anzahl der Ebenen (nur Wurzel: `1`).
      3. `pfadZu(k, name)` liefert den Pfad von der Wurzel bis zur Kategorie als Array, z. B.
         `["Shop", "Kleidung", "Jacken"]`, oder `null`, wenn es die Kategorie nicht gibt.

      `alleNamen` und `tiefe` sollen **ohne Rekursion** auskommen – mit einem eigenen Stack oder einer
      Queue. Ein Test prüft einen Baum mit 20 000 Ebenen, an dem rekursive Lösungen scheitern können.
    starter: |
      type Kategorie = { name: string; kinder: Kategorie[] };

      function alleNamen(k: Kategorie): string[] {
        return [];
      }

      function tiefe(k: Kategorie): number {
        return 0;
      }

      function pfadZu(k: Kategorie, name: string): string[] | null {
        return null;
      }
    tests:
      - name: Preorder-Reihenfolge
        code: |
          const shop = { name: "Shop", kinder: [
            { name: "Kleidung", kinder: [{ name: "Jacken", kinder: [] }, { name: "Schuhe", kinder: [] }] },
            { name: "Technik", kinder: [{ name: "Laptops", kinder: [] }] },
          ] };
          assertDeepEqual(alleNamen(shop), ["Shop", "Kleidung", "Jacken", "Schuhe", "Technik", "Laptops"]);
          assertEqual(tiefe(shop), 3);
      - name: Pfad finden
        code: |
          const shop = { name: "Shop", kinder: [
            { name: "Kleidung", kinder: [{ name: "Jacken", kinder: [] }] },
            { name: "Technik", kinder: [{ name: "Laptops", kinder: [{ name: "Gaming", kinder: [] }] }] },
          ] };
          assertDeepEqual(pfadZu(shop, "Gaming"), ["Shop", "Technik", "Laptops", "Gaming"]);
          assertDeepEqual(pfadZu(shop, "Shop"), ["Shop"]);
          assertEqual(pfadZu(shop, "Möbel"), null);
      - name: Baum mit nur einem Knoten
        code: |
          const einzeln = { name: "Leer", kinder: [] };
          assertDeepEqual(alleNamen(einzeln), ["Leer"]);
          assertEqual(tiefe(einzeln), 1);
      - name: sehr tiefer Baum (20 000 Ebenen)
        code: |
          let k = { name: "n0", kinder: [] };
          const wurzel = k;
          for (let i = 1; i < 20000; i++) { const neu = { name: "n" + i, kinder: [] }; k.kinder.push(neu); k = neu; }
          assertEqual(alleNamen(wurzel).length, 20000);
          assertEqual(tiefe(wurzel), 20000);
    hints:
      - "Preorder ohne Rekursion: `const stapel = [k];` – nimm mit `pop()` einen Knoten, schreibe den Namen auf und lege die Kinder in **umgekehrter** Reihenfolge auf den Stapel."
      - "Für `tiefe` ohne Rekursion legst du Paare `[knoten, ebene]` auf den Stapel und merkst dir das Maximum."
      - "Für `pfadZu` legst du statt Knoten ganze Pfade auf den Stapel: `[ [k] ]`. Der letzte Eintrag eines Pfads ist der aktuelle Knoten. `pfadZu` darf auch rekursiv sein."
    solution: |
      type Kategorie = { name: string; kinder: Kategorie[] };

      function alleNamen(k: Kategorie): string[] {
        const namen: string[] = [];
        const stapel: Kategorie[] = [k];
        while (stapel.length > 0) {
          const knoten = stapel.pop()!;
          namen.push(knoten.name);
          for (let i = knoten.kinder.length - 1; i >= 0; i--) {
            stapel.push(knoten.kinder[i]);
          }
        }
        return namen;
      }

      function tiefe(k: Kategorie): number {
        let max = 0;
        const stapel: Array<[Kategorie, number]> = [[k, 1]];
        while (stapel.length > 0) {
          const [knoten, ebene] = stapel.pop()!;
          if (ebene > max) max = ebene;
          for (const kind of knoten.kinder) stapel.push([kind, ebene + 1]);
        }
        return max;
      }

      function pfadZu(k: Kategorie, name: string): string[] | null {
        const stapel: Array<{ knoten: Kategorie; pfad: string[] }> = [{ knoten: k, pfad: [k.name] }];
        while (stapel.length > 0) {
          const { knoten, pfad } = stapel.pop()!;
          if (knoten.name === name) return pfad;
          for (const kind of knoten.kinder) {
            stapel.push({ knoten: kind, pfad: [...pfad, kind.name] });
          }
        }
        return null;
      }
---
Du willst in einem Kategorienbaum alle Kategorien auflisten, im DOM alle Links finden oder die Größe
eines Ordners samt Unterordnern berechnen. Jedes Mal musst du **jeden Knoten genau einmal** besuchen.
Dieses systematische Abarbeiten heißt [[traversierung|Traversierung]]. Es gibt zwei Grundstrategien:
erst in die Tiefe oder erst in die Breite.

## Tiefensuche: erst ganz nach unten

Die [[tiefensuche|Tiefensuche]] (englisch *depth-first search*, DFS) folgt einem Ast bis zum Blatt,
bevor sie den nächsten Ast nimmt – so, wie du einen Ordner komplett durchschaust, bevor du den
nächsten öffnest.

Am natürlichsten schreibst du sie mit [[rekursion|Rekursion]]: Eine Funktion ruft sich selbst für jedes
Kind auf.

```js
function besuche(knoten, ebene = 0) {
  console.log("  ".repeat(ebene) + knoten.name); // Preorder: erst der Knoten …
  for (const kind of knoten.kinder) {
    besuche(kind, ebene + 1);                    // … dann jedes Kind komplett
  }
}
```

Das Ergebnis sieht aus wie die Ausgabe von `tree`. Die Rekursion endet von selbst, weil Blätter keine
Kinder haben – die Schleife läuft dann nullmal.

> [!MERKSATZ]
> Eine rekursive Baumfunktion behandelt **einen** Knoten und überlässt die Kinder sich selbst.

## Preorder, Postorder und Inorder

Wann du den Knoten selbst bearbeitest, bestimmt die Reihenfolge:

| Variante | Ablauf | typischer Einsatz |
|---|---|---|
| Preorder | Knoten, dann Kinder | Menü einrücken, Baum kopieren |
| Postorder | Kinder, dann Knoten | Ordnergröße summieren, Baum löschen |
| Inorder (nur Binärbaum) | links, Knoten, rechts | Suchbaum sortiert ausgeben |

Postorder brauchst du immer dann, wenn ein Knoten die Ergebnisse seiner Kinder benötigt:

```js
function groesse(ordner) {
  let summe = ordner.dateien.reduce((s, d) => s + d.bytes, 0);
  for (const unter of ordner.ordner) {
    summe += groesse(unter); // erst die Kinder fertig rechnen
  }
  return summe;
}
```

> [!FEHLER]
> Den Rückgabewert des rekursiven Aufrufs zu ignorieren (`groesse(unter);` statt `summe += …`) ist der
> häufigste Rekursionsfehler. Die Funktion läuft fehlerfrei durch – und liefert nur die oberste Ebene.

## Tiefensuche ohne Rekursion

Jeder rekursive Aufruf liegt auf dem [[call-stack|Call Stack]]. Bei Zehntausenden Ebenen läuft der über,
und JavaScript wirft `RangeError: Maximum call stack size exceeded`. Die Lösung: Du verwaltest den
Stack selbst – ein einfaches Array mit `push` und `pop`.

```js
function alleNamen(wurzel) {
  const namen = [];
  const stapel = [wurzel];
  while (stapel.length > 0) {
    const knoten = stapel.pop();
    namen.push(knoten.name);
    // Kinder rückwärts drauflegen, damit das erste Kind oben liegt
    for (let i = knoten.kinder.length - 1; i >= 0; i--) stapel.push(knoten.kinder[i]);
  }
  return namen;
}
```

Das Ergebnis ist dieselbe Preorder-Reihenfolge – nur ohne Aufruf-Tiefe.

## Breitensuche: Ebene für Ebene

Die [[breitensuche|Breitensuche]] (englisch *breadth-first search*, BFS) besucht erst alle Knoten der
Ebene 1, dann alle der Ebene 2 und so weiter. Statt eines Stacks nimmt sie eine [[queue|Queue]]:

```js
function ebenen(wurzel) {
  const ergebnis = [];
  const queue = [{ knoten: wurzel, ebene: 0 }];
  for (let i = 0; i < queue.length; i++) {   // Lese-Index statt shift() – O(1)
    const { knoten, ebene } = queue[i];
    (ergebnis[ebene] ??= []).push(knoten.name);
    for (const kind of knoten.kinder) queue.push({ knoten: kind, ebene: ebene + 1 });
  }
  return ergebnis; // [["Shop"], ["Kleidung", "Technik"], ["Jacken", …]]
}
```

![Tiefensuche und Breitensuche besuchen denselben Baum in unterschiedlicher Reihenfolge](/assets/datenstrukturen-algorithmen/tiefe-und-breite.svg)

Die Breitensuche findet den Treffer, der der Wurzel **am nächsten** liegt, zuerst. Das wird bei Graphen
wichtig: Dort liefert sie den kürzesten Weg.

## DOM und Ordner in der Praxis

Im Browser durchläufst du das DOM mit genau diesen Mustern – `element.children` liefert die Kinder.
Für Spezialfälle gibt es den eingebauten
[`TreeWalker`](https://developer.mozilla.org/en-US/docs/Web/API/Document/createTreeWalker). In Node.js
liest du Ordner mit `fs.readdirSync(pfad, { withFileTypes: true })` und entscheidest per
`eintrag.isDirectory()`, ob du tiefer gehst.

| Frage | Verfahren |
|---|---|
| Alles auflisten, Reihenfolge egal | Tiefensuche (am einfachsten) |
| Summe über Kinder bilden | Tiefensuche, Postorder |
| Nächstgelegenen Treffer finden | Breitensuche |
| Sehr tiefe Bäume | Tiefensuche mit eigenem Stack |

> [!PRAXIS]
> Ein rekursiv gerendertes Menü in React oder Blade ist eine Preorder-Tiefensuche: Die Komponente rendert
> ihren Eintrag und ruft sich für jedes Untermenü selbst auf.

## Zusammenfassung

- Traversierung heißt: jeden Knoten genau einmal besuchen – das kostet O(n).
- Die Tiefensuche geht erst ganz nach unten; sie ist rekursiv oder mit eigenem Stack schreibbar.
- Preorder bearbeitet den Knoten vor den Kindern, Postorder danach, Inorder (Binärbaum) dazwischen.
- Den Rückgabewert rekursiver Aufrufe musst du auch verwenden.
- Die Breitensuche arbeitet mit einer Queue Ebene für Ebene und findet nahe Treffer zuerst.
- Tiefe Bäume können den Call Stack sprengen – dann hilft ein eigener Stack.
