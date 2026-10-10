---
title: Bäume und binäre Suchbäume
summary: Was einen Baum ausmacht, warum das DOM und dein Dateisystem Bäume sind und wie ein binärer Suchbaum Suchen in O(log n) ermöglicht – solange er ausgeglichen bleibt.
duration: 25
sources:
  - title: MDN – Using the Document Object Model
    url: https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Using_the_Document_Object_Model
  - title: MDN – Node.childNodes
    url: https://developer.mozilla.org/en-US/docs/Web/API/Node/childNodes
  - title: Node.js – File system (fs.readdirSync)
    url: https://nodejs.org/api/fs.html#fsreaddirsyncpath-options
quiz:
  - type: single
    question: Was unterscheidet einen Baum von einer beliebigen Ansammlung verbundener Knoten?
    options:
      - Jeder Knoten hat genau zwei Kinder.
      - Es gibt genau eine Wurzel, und jeder andere Knoten hat genau einen Elternknoten.
      - Alle Werte sind sortiert.
      - Die Knoten liegen nebeneinander im Speicher.
    answer: 1
    explanation: >
      Ein Baum hat eine Wurzel, und jeder übrige Knoten hängt an genau einem Elternknoten. Dadurch gibt es
      keine Kreise und zu jedem Knoten genau einen Weg von der Wurzel. „Höchstens zwei Kinder“ gilt nur für Binärbäume.
  - type: match
    question: Ordne jedem Begriff die passende Stelle im Dateisystem-Baum zu.
    pairs:
      - { left: "Wurzel", right: "/ (das oberste Verzeichnis)" }
      - { left: "Blatt", right: "eine Datei wie README.md" }
      - { left: "Kinder von src/", right: "alle Einträge direkt in src/" }
      - { left: "Teilbaum", right: "src/ mit allem, was darunter liegt" }
    explanation: Dateien haben keine Kinder und sind deshalb Blätter. Jeder Ordner bildet mit seinem Inhalt einen eigenen Teilbaum.
  - type: cloze
    text: "In einem binären Suchbaum liegen alle kleineren Werte im ___ Teilbaum und alle größeren im ___ Teilbaum."
    blanks:
      - ["linken", "linke", "links"]
      - ["rechten", "rechte", "rechts"]
    explanation: Diese eine Regel gilt an jedem Knoten. Deshalb kannst du bei jeder Suche eine Hälfte ignorieren.
  - type: multiple
    question: Du fügst die Zahlen 1, 2, 3, 4, 5 in genau dieser Reihenfolge in einen einfachen binären Suchbaum ein. Was stimmt?
    options:
      - Der Baum wird zu einer langen Kette nach rechts.
      - Die Suche nach 5 braucht fünf Vergleiche – O(n).
      - Der Baum bleibt automatisch ausgeglichen.
      - Eine Höhe von etwa log₂(5) ist garantiert.
    answers: [0, 1]
    explanation: >
      Sortierte Eingaben lassen einen einfachen Suchbaum entarten: Jeder neue Wert ist größer und hängt
      rechts unten an. Selbstbalancierende Bäume (z. B. Rot-Schwarz-Bäume) verhindern das.
  - type: find-bug
    question: "`enthaelt()` soll prüfen, ob ein Wert im Suchbaum steckt. In welcher Zeile steckt der Fehler?"
    language: js
    code: |
      function enthaelt(knoten, wert) {
        if (knoten === null) return false;
        if (wert === knoten.wert) return true;
        if (wert < knoten.wert) return enthaelt(knoten.rechts, wert);
        return enthaelt(knoten.links, wert);
      }
    bug_line: 4
    explanation: >
      Kleinere Werte liegen links. Zeile 4 sucht im falschen Teilbaum weiter (und Zeile 5 deshalb auch).
      Richtig ist `enthaelt(knoten.links, wert)` für kleinere und `knoten.rechts` für größere Werte.
tasks:
  - id: suchbaum-beschriften
    type: diagram
    title: Werte in den Suchbaum einsetzen
    description: >
      Die Zahlen **50, 25, 75, 10, 35, 60, 90** wurden in dieser Reihenfolge in einen binären Suchbaum
      eingefügt. Vier Knoten sind noch leer. Ziehe die passenden Zahlen in die leeren Knoten – zwei
      Zahlen bleiben übrig.
    image: /assets/datenstrukturen-algorithmen/suchbaum-leer.svg
    slots:
      - { x: 27.5, y: 45, answer: "25" }
      - { x: 40, y: 75, answer: "35" }
      - { x: 60, y: 75, answer: "60" }
      - { x: 85, y: 75, answer: "90" }
    distractors: ["40", "100"]
    hints:
      - Fang bei der Wurzel 50 an. 25 ist kleiner, also geht sie nach links.
      - 35 ist kleiner als 50 (links), aber größer als 25 (dort rechts).
  - id: suchbaum-bauen
    type: code
    language: js
    title: Einen binären Suchbaum bauen
    description: |
      Vervollständige die Klasse `Suchbaum`. Jeder Knoten ist ein Objekt `{ wert, links, rechts }`.

      1. `einfuegen(wert)` hängt den Wert an der richtigen Stelle ein. Doppelte Werte werden ignoriert.
      2. `enthaelt(wert)` liefert `true` oder `false` – ohne den ganzen Baum zu durchsuchen.
      3. `hoehe()` liefert die Anzahl der Ebenen: leerer Baum `0`, nur Wurzel `1`.
      4. `sortiert()` liefert alle Werte aufsteigend als Array (Tipp: erst links, dann der Knoten, dann rechts).

      Du darfst rekursive Hilfsfunktionen oder Schleifen verwenden.
    starter: |
      class Suchbaum {
        constructor() {
          this.wurzel = null;
        }

        einfuegen(wert) {
        }

        enthaelt(wert) {
          return false;
        }

        hoehe() {
          return 0;
        }

        sortiert() {
          return [];
        }
      }
    tests:
      - name: einfügen und finden
        code: |
          const b = new Suchbaum();
          [50, 25, 75, 10, 35].forEach((x) => b.einfuegen(x));
          assertTrue(b.enthaelt(35));
          assertEqual(b.enthaelt(40), false);
          assertEqual(b.wurzel.links.rechts.wert, 35);
      - name: leerer Baum
        code: |
          const b = new Suchbaum();
          assertEqual(b.enthaelt(1), false);
          assertEqual(b.hoehe(), 0);
          assertDeepEqual(b.sortiert(), []);
      - name: sortierte Ausgabe ohne Duplikate
        code: |
          const b = new Suchbaum();
          [8, 3, 10, 1, 6, 14, 4, 7, 13, 3, 8].forEach((x) => b.einfuegen(x));
          assertDeepEqual(b.sortiert(), [1, 3, 4, 6, 7, 8, 10, 13, 14]);
      - name: Höhe ausgeglichen und entartet
        code: |
          const a = new Suchbaum();
          [4, 2, 6, 1, 3, 5, 7].forEach((x) => a.einfuegen(x));
          assertEqual(a.hoehe(), 3);
          const k = new Suchbaum();
          [1, 2, 3, 4, 5].forEach((x) => k.einfuegen(x));
          assertEqual(k.hoehe(), 5);
      - name: Wert 0 und negative Zahlen
        code: |
          const b = new Suchbaum();
          [0, -5, 5].forEach((x) => b.einfuegen(x));
          assertTrue(b.enthaelt(0));
          assertDeepEqual(b.sortiert(), [-5, 0, 5]);
    hints:
      - "Beim Einfügen: Ist `this.wurzel` null, wird der neue Knoten die Wurzel. Sonst läufst du mit `let k = this.wurzel` nach links oder rechts, bis der passende Platz `null` ist."
      - "Für `hoehe` und `sortiert` helfen rekursive Funktionen: `const h = (k) => k === null ? 0 : 1 + Math.max(h(k.links), h(k.rechts));`"
      - "`sortiert`: `const besuche = (k) => { if (!k) return; besuche(k.links); werte.push(k.wert); besuche(k.rechts); };`"
    solution: |
      class Suchbaum {
        constructor() {
          this.wurzel = null;
        }

        einfuegen(wert) {
          const neu = { wert, links: null, rechts: null };
          if (this.wurzel === null) {
            this.wurzel = neu;
            return;
          }
          let k = this.wurzel;
          while (true) {
            if (wert === k.wert) return;
            const seite = wert < k.wert ? "links" : "rechts";
            if (k[seite] === null) {
              k[seite] = neu;
              return;
            }
            k = k[seite];
          }
        }

        enthaelt(wert) {
          let k = this.wurzel;
          while (k !== null) {
            if (wert === k.wert) return true;
            k = wert < k.wert ? k.links : k.rechts;
          }
          return false;
        }

        hoehe() {
          const h = (k) => (k === null ? 0 : 1 + Math.max(h(k.links), h(k.rechts)));
          return h(this.wurzel);
        }

        sortiert() {
          const werte = [];
          const besuche = (k) => {
            if (k === null) return;
            besuche(k.links);
            werte.push(k.wert);
            besuche(k.rechts);
          };
          besuche(this.wurzel);
          return werte;
        }
      }
---
Öffne die Entwicklerwerkzeuge deines Browsers: `<html>` enthält `<body>`, darin ein `<main>`, darin
Absätze. Im Terminal zeigt `tree` Ordner in Ordnern in Ordnern. Beide Strukturen verzweigen sich von
einem einzigen Startpunkt aus immer weiter – wie ein umgedrehter [[baum|Baum]]. Bäume sind die
Datenstruktur für alles Hierarchische: Menüs, Kategorien, Kommentare mit Antworten, Organigramme.

## Begriffe am Baum

Ein Baum besteht aus [[knoten|Knoten]], die über Verbindungen von oben nach unten hängen. Die
wichtigsten Begriffe:

| Begriff | Bedeutung | Im Dateisystem |
|---|---|---|
| Wurzel | der oberste Knoten, hat keinen Elternknoten | `/` |
| Kind / Elternknoten | direkt darunter / direkt darüber | `src/` ist Kind von `/` |
| Blatt | Knoten ohne Kinder | eine Datei |
| Teilbaum | ein Knoten mit allem, was darunter hängt | `src/` samt Inhalt |
| Tiefe | Abstand eines Knotens zur Wurzel | Anzahl der `/` im Pfad |
| Höhe | Anzahl der Ebenen des ganzen Baums | tiefste Verschachtelung |

Die entscheidende Regel: Jeder Knoten außer der Wurzel hat **genau einen** Elternknoten. Deshalb gibt
es keine Kreise, und zu jedem Knoten führt genau ein Weg von der Wurzel.

> [!MERKSATZ]
> Ein Baum hat eine Wurzel, und jeder andere Knoten hängt an genau einem Elternknoten.

## Bäume, die dir täglich begegnen

Im [[dom|DOM]] ist jedes Element ein Knoten mit `parentNode` und `children`. In einem
[[dateisystem|Dateisystem]] ist jeder Ordner ein Knoten, dessen Kinder die enthaltenen Einträge sind.
Und eine Kategorie-Struktur aus einer API sieht meist so aus:

```js
const kategorien = {
  name: "Shop",
  kinder: [
    { name: "Kleidung", kinder: [{ name: "Jacken", kinder: [] }, { name: "Schuhe", kinder: [] }] },
    { name: "Technik", kinder: [{ name: "Laptops", kinder: [] }] },
  ],
};
```

Jeder Knoten darf hier beliebig viele Kinder haben. Wie du solche Bäume vollständig durchläufst, lernst
du in der nächsten Lektion.

> [!PRAXIS]
> Datenbanken speichern Bäume oft „flach“ – jede Zeile mit einer `parent_id`. Für die Anzeige baust du
> daraus im Code wieder einen Baum: eine `Map` von ID zu Knoten, dann jeden Knoten an seinen Elternknoten
> hängen. Das ist O(n) statt O(n²).

## Der binäre Suchbaum

Ein Binärbaum ist ein Baum, in dem jeder Knoten **höchstens zwei** Kinder hat: `links` und `rechts`.
Ein [[binaerer-suchbaum|binärer Suchbaum]] (englisch *binary search tree*, BST) hält zusätzlich eine
Ordnung ein:

- Alle Werte im **linken** Teilbaum sind **kleiner** als der Knoten.
- Alle Werte im **rechten** Teilbaum sind **größer**.

![Ein binärer Suchbaum mit Wurzel, Teilbäumen und Blättern](/assets/datenstrukturen-algorithmen/suchbaum.svg)

Suchst du die 35, vergleichst du an der Wurzel 50: kleiner, also links. Bei 25: größer, also rechts – gefunden.
Mit jedem Vergleich fällt ein ganzer Teilbaum weg. Bei einer Million Werten genügen in einem gut
gefüllten Baum rund 20 Vergleiche.

```js
function enthaelt(knoten, wert) {
  while (knoten !== null) {
    if (wert === knoten.wert) return true;
    knoten = wert < knoten.wert ? knoten.links : knoten.rechts;
  }
  return false;
}
```

Einfügen funktioniert genauso: Du läufst wie bei der Suche nach unten und hängst den neuen Knoten an der
ersten freien Stelle ein.

## Ausgeglichen oder entartet?

Die schnelle Suche hat einen Haken: Sie hängt von der **Höhe** des Baums ab, nicht von der Anzahl der
Werte. Fügst du bereits sortierte Werte ein (1, 2, 3, 4, 5), hängt jeder neue Wert rechts unten an. Der
Baum entartet zu einer verketteten Liste – und die Suche wird O(n).

| Baumform | Höhe bei n Werten | Suchen / Einfügen |
|---|---|---|
| ausgeglichen | ≈ log₂ n | O(log n) |
| entartet (Kette) | n | O(n) |

Ein [[balancierter-baum|balancierter Baum]] (zum Beispiel ein Rot-Schwarz-Baum oder AVL-Baum) dreht seine
Knoten nach jedem Einfügen so um, dass die Höhe klein bleibt.

> [!FEHLER]
> Einen einfachen Suchbaum mit sortierten Daten zu füllen – etwa mit IDs aus einer Datenbank – ist der
> klassische Weg zu O(n). Selbst gebaute Suchbäume sind im Alltag selten die beste Wahl.

## Und wo stecken Suchbäume wirklich?

JavaScript und PHP haben keinen eingebauten Suchbaum. Für schnelles Nachschlagen nutzt du dort eine
`Map` oder ein PHP-Array. Suchbäume brauchst du, wenn die **Reihenfolge** wichtig ist: „alle Werte
zwischen 100 und 200“ oder „der nächstgrößere Termin“. Genau dafür nutzen Datenbanken
[[b-baum|B-Bäume]] in ihren Indizes – eine Variante mit vielen Kindern pro Knoten.

## Zusammenfassung

- Ein Baum hat eine Wurzel; jeder andere Knoten hat genau einen Elternknoten, Blätter haben keine Kinder.
- DOM, Dateisystem, Menüs und Kategorien sind Bäume.
- Im binären Suchbaum liegen kleinere Werte links, größere rechts – jeder Vergleich halbiert den Suchraum.
- Suchen und Einfügen kosten O(Höhe): O(log n) im ausgeglichenen, O(n) im entarteten Baum.
- Sortierte Eingaben lassen einen einfachen Suchbaum entarten; balancierte Bäume verhindern das.
- Im Weballtag nimmst du für Nachschlagen eine Map – Suchbäume stecken in Datenbank-Indizes.
