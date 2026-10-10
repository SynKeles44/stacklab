---
title: "Graphen: Netze, Wege und Abhängigkeiten"
summary: Wie du Netzwerke aus Knoten und Kanten als Adjazenzliste speicherst, mit Breiten- und Tiefensuche durchläufst, den kürzesten Weg findest und Kreise in Abhängigkeiten erkennst.
duration: 25
sources:
  - title: MDN – Map
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
  - title: npm Docs – package.json dependencies
    url: https://docs.npmjs.com/cli/v11/configuring-npm/package-json#dependencies
  - title: Node.js – Modules – Cycles
    url: https://nodejs.org/api/modules.html#cycles
quiz:
  - type: single
    question: Was unterscheidet einen Graphen von einem Baum?
    options:
      - In einem Graphen darf ein Knoten mehrere Vorgänger haben, und es darf Kreise geben.
      - Ein Graph hat immer genau eine Wurzel.
      - Ein Graph kann nur Zahlen speichern.
      - In einem Graphen hat jeder Knoten höchstens zwei Nachbarn.
    answer: 0
    explanation: >
      Ein Baum ist ein Spezialfall eines Graphen: verbunden, ohne Kreise, mit genau einem Elternknoten pro
      Knoten. Ein allgemeiner Graph hat keine dieser Einschränkungen.
  - type: match
    question: Ordne jedem Beispiel die passende Art von Graph zu.
    pairs:
      - { left: "Freundschaften in einem sozialen Netzwerk", right: "ungerichtet" }
      - { left: "Wer folgt wem auf einer Plattform", right: "gerichtet" }
      - { left: "Straßenkarte mit Fahrzeiten in Minuten", right: "gewichtet" }
      - { left: "npm-Pakete und ihre Abhängigkeiten", right: "gerichtet, idealerweise ohne Kreise" }
    explanation: >
      Freundschaft gilt in beide Richtungen, Folgen nicht. Fahrzeiten sind Gewichte an den Kanten.
      Abhängigkeiten zeigen vom Paket zur Bibliothek, die es braucht.
  - type: multiple
    question: Welche Aussagen zur Breitensuche in einem Graphen stimmen?
    options:
      - Sie findet in einem ungewichteten Graphen einen Weg mit den wenigsten Kanten.
      - Ohne „besucht“-Set kann sie bei Kreisen endlos laufen.
      - Sie findet auch in Graphen mit Fahrzeiten automatisch den schnellsten Weg.
      - Ihr Aufwand ist O(V + E), also Knoten plus Kanten.
    answers: [0, 1, 3]
    explanation: >
      Die Breitensuche zählt Kanten, nicht Gewichte. Für gewichtete Kanten brauchst du zum Beispiel den
      Dijkstra-Algorithmus.
  - type: find-bug
    question: "`erreichbar()` soll alle Knoten liefern, die von `start` aus erreichbar sind. Bei einem Graphen mit Kreis hängt sich die Funktion auf. Welche Zeile fehlt bzw. ist falsch?"
    language: js
    code: |
      function erreichbar(graph, start) {
        const besucht = new Set([start]);
        const queue = [start];
        for (let i = 0; i < queue.length; i++) {
          for (const nachbar of graph.get(queue[i]) ?? []) {
            queue.push(nachbar);
            besucht.add(nachbar);
          }
        }
        return besucht;
      }
    bug_line: 6
    explanation: >
      Zeile 6 hängt jeden Nachbarn an – auch bereits besuchte. Bei einem Kreis wächst die Queue endlos.
      Richtig: `if (!besucht.has(nachbar)) { besucht.add(nachbar); queue.push(nachbar); }`.
  - type: cloze
    text: "Eine Adjazenzliste speichert zu jedem ___ die Liste seiner ___. In JavaScript nimmst du dafür meist eine Map."
    blanks:
      - ["Knoten"]
      - ["Nachbarn", "Nachbarknoten", "Kanten"]
    explanation: "Zum Beispiel `graph.get(\"A\")` → `[\"B\", \"C\"]`."
tasks:
  - id: kuerzester-weg
    type: code
    language: js
    title: Den kürzesten Weg im U-Bahn-Netz finden
    description: |
      Ein Verkehrsverbund liefert seine Verbindungen als Liste von Paaren, z. B. `["Markt", "Rathaus"]`.
      Jede Verbindung gilt in **beide** Richtungen. Schreibe:

      1. `baueGraph(verbindungen)` liefert eine `Map` von Station zu einem Array ihrer Nachbarstationen.
      2. `kuerzesterWeg(verbindungen, start, ziel)` liefert den Weg mit den **wenigsten Stationen** als
         Array von `start` bis `ziel` – oder `null`, wenn es keinen gibt. Ist `start === ziel`, ist das
         Ergebnis `[start]`.

      Nutze eine Breitensuche und merke dir für jede entdeckte Station, von welcher Station du kamst.
    starter: |
      function baueGraph(verbindungen) {
        const graph = new Map();
        return graph;
      }

      function kuerzesterWeg(verbindungen, start, ziel) {
        const graph = baueGraph(verbindungen);
        return null;
      }
    tests:
      - name: Graph in beide Richtungen
        code: |
          const g = baueGraph([["A", "B"], ["B", "C"]]);
          assertDeepEqual(g.get("B"), ["A", "C"]);
          assertDeepEqual(g.get("C"), ["B"]);
      - name: kürzester statt erster Weg
        code: |
          const netz = [["Markt", "Rathaus"], ["Rathaus", "Park"], ["Park", "Zoo"], ["Markt", "Hafen"], ["Hafen", "Zoo"]];
          assertDeepEqual(kuerzesterWeg(netz, "Markt", "Zoo"), ["Markt", "Hafen", "Zoo"]);
          assertDeepEqual(kuerzesterWeg(netz, "Zoo", "Rathaus").length, 3);
      - name: kein Weg und gleicher Start
        code: |
          const netz = [["A", "B"], ["C", "D"]];
          assertEqual(kuerzesterWeg(netz, "A", "D"), null);
          assertEqual(kuerzesterWeg(netz, "A", "X"), null);
          assertDeepEqual(kuerzesterWeg(netz, "A", "A"), ["A"]);
      - name: Kreise führen nicht zur Endlosschleife
        code: |
          const netz = [["A", "B"], ["B", "C"], ["C", "A"], ["C", "D"]];
          assertDeepEqual(kuerzesterWeg(netz, "A", "D"), ["A", "C", "D"]);
      - name: großes Netz mit 50 000 Stationen
        code: |
          const netz = [];
          for (let i = 0; i < 50000; i++) netz.push(["s" + i, "s" + (i + 1)]);
          const start = performance.now();
          const weg = kuerzesterWeg(netz, "s0", "s50000");
          assertEqual(weg.length, 50001);
          assertTrue(performance.now() - start < 500, "zu langsam – nutzt du shift() oder includes()?");
    hints:
      - "`baueGraph`: Für jedes Paar `[a, b]` hängst du `b` an die Liste von `a` und `a` an die Liste von `b`. Lege fehlende Listen mit `if (!graph.has(a)) graph.set(a, []);` an."
      - "Breitensuche: `const herkunft = new Map([[start, null]]); const queue = [start];` – und mit einem Lese-Index statt `shift()` durch die Queue laufen. `herkunft.has(station)` heißt „schon entdeckt“."
      - "Hast du das Ziel erreicht, läufst du über `herkunft` rückwärts bis zum Start und drehst das Array am Ende mit `reverse()` um."
    solution: |
      function baueGraph(verbindungen) {
        const graph = new Map();
        for (const [a, b] of verbindungen) {
          if (!graph.has(a)) graph.set(a, []);
          if (!graph.has(b)) graph.set(b, []);
          graph.get(a).push(b);
          graph.get(b).push(a);
        }
        return graph;
      }

      function kuerzesterWeg(verbindungen, start, ziel) {
        if (start === ziel) return [start];
        const graph = baueGraph(verbindungen);
        const herkunft = new Map([[start, null]]);
        const queue = [start];
        for (let i = 0; i < queue.length; i++) {
          const station = queue[i];
          for (const nachbar of graph.get(station) ?? []) {
            if (herkunft.has(nachbar)) continue;
            herkunft.set(nachbar, station);
            if (nachbar === ziel) {
              const weg = [];
              for (let s = ziel; s !== null; s = herkunft.get(s)) weg.push(s);
              return weg.reverse();
            }
            queue.push(nachbar);
          }
        }
        return null;
      }
  - id: breitensuche-schritte
    type: steps
    title: Die Breitensuche Schritt für Schritt
    description: >
      Du suchst den kürzesten Weg von **A** nach **E** im folgenden ungerichteten Graphen:
      A–B, A–C, B–D, C–D, D–E. Die Nachbarn werden alphabetisch in die Queue gestellt.
    steps:
      - situation: Die Queue enthält nur A. A ist als besucht markiert.
        question: Welche Knoten stehen in der Queue, nachdem A bearbeitet wurde?
        options: ["B, C", "B, D", "C, D, E"]
        answer: 0
        explanation: A hat die Nachbarn B und C. Beide sind neu und werden hinten angestellt.
      - situation: Jetzt wird B bearbeitet. Die Queue enthält noch C.
        question: Was passiert mit den Nachbarn von B (A und D)?
        options:
          - A und D werden angehängt.
          - Nur D wird angehängt, weil A schon besucht ist. Für D merkst du dir „kam von B“.
          - B wird entfernt, und die Suche bricht ab.
        answer: 1
        explanation: Ohne den Abgleich mit „besucht“ würde A erneut in die Queue kommen – bei Kreisen endlos.
      - situation: C wird bearbeitet. Sein Nachbar D ist bereits entdeckt (über B). Danach kommt D an die Reihe und entdeckt E.
        question: Welchen Weg liefert die Rückverfolgung über „kam von“?
        options: ["A → C → D → E", "A → B → D → E", "A → B → C → D → E"]
        answer: 1
        explanation: >
          D wurde zuerst über B entdeckt, E über D. Rückwärts: E ← D ← B ← A. Der Weg über C wäre gleich
          kurz – die Breitensuche liefert den, den sie zuerst findet.
---
Dein Navigationsgerät sucht den kürzesten Weg durch die Stadt. npm entscheidet, in welcher Reihenfolge
Pakete installiert werden. Ein soziales Netzwerk schlägt dir „Freunde von Freunden“ vor. In allen drei
Fällen hängen die Dinge nicht hierarchisch zusammen wie in einem Baum, sondern kreuz und quer. Dafür gibt
es den [[graph|Graphen]].

## Knoten und Kanten

Ein Graph besteht aus **Knoten** (englisch *vertices*, kurz V) und [[kante|Kanten]] (englisch *edges*,
kurz E), die jeweils zwei Knoten verbinden. Ein Baum ist ein besonders strenger Graph. Allgemeine Graphen
dürfen mehr:

| Eigenschaft | Bedeutung | Beispiel |
|---|---|---|
| ungerichtet | Kante gilt in beide Richtungen | Freundschaft, Straße ohne Einbahn |
| gerichtet | Kante zeigt von A nach B | „folgt“, Abhängigkeit, Link |
| gewichtet | Kante hat einen Wert | Entfernung, Fahrzeit, Kosten |
| mit Kreis (Zyklus) | man kommt zum Start zurück | A → B → C → A |

![Ein ungerichteter Graph mit Kreis und seine Adjazenzliste](/assets/datenstrukturen-algorithmen/graph-adjazenzliste.svg)

> [!MERKSATZ]
> Ein Baum ist ein Graph ohne Kreise, in dem jeder Knoten genau einen Elternknoten hat. Fallen diese
> Regeln weg, hast du einen allgemeinen Graphen.

## Graphen speichern: die Adjazenzliste

Die gängigste Form ist die [[adjazenzliste|Adjazenzliste]]: Zu jedem Knoten speicherst du die Liste
seiner Nachbarn. In JavaScript passt dafür eine `Map` perfekt:

```js
const graph = new Map([
  ["A", ["B", "C"]],
  ["B", ["A", "D"]],
  ["C", ["A", "D"]],
  ["D", ["B", "C"]],
]);

graph.get("A");            // ["B", "C"] – Nachbarn in O(1) nachschlagen
```

Die Alternative ist eine Matrix mit `true`/`false` für jedes Knotenpaar. Sie braucht n² Speicherplätze
und lohnt sich nur bei sehr dicht verbundenen Graphen. Im Weballtag nimmst du die Adjazenzliste.

## Durchlaufen mit Breiten- und Tiefensuche

Breiten- und Tiefensuche funktionieren wie bei Bäumen – mit einem Unterschied: Weil es Kreise gibt,
brauchst du ein `Set` mit den bereits **besuchten** Knoten. Sonst läuft die Suche im Kreis.

```js
function erreichbar(graph, start) {
  const besucht = new Set([start]);
  const stapel = [start];                      // Stack → Tiefensuche
  while (stapel.length > 0) {
    const knoten = stapel.pop();
    for (const nachbar of graph.get(knoten) ?? []) {
      if (!besucht.has(nachbar)) {
        besucht.add(nachbar);
        stapel.push(nachbar);
      }
    }
  }
  return besucht;
}
```

Jeder Knoten wird einmal entnommen, jede Kante einmal angeschaut. Der Aufwand ist deshalb **O(V + E)**.

> [!FEHLER]
> Das „besucht“-Set zu vergessen fällt in Tests mit baumartigen Daten nicht auf. Sobald echte Daten einen
> Kreis enthalten, läuft die Funktion endlos oder bis der Speicher voll ist.

## Der kürzeste Weg

In einem **ungewichteten** Graphen findet die Breitensuche automatisch einen Weg mit den wenigsten Kanten.
Sie entdeckt erst alle Knoten im Abstand 1, dann im Abstand 2 und so weiter. Merkst du dir für jeden
entdeckten Knoten, von wo du kamst, kannst du den Weg am Ende rückwärts ablesen.

Sind die Kanten **gewichtet** (Fahrzeiten, Kosten), reicht das nicht: Zwei kurze Kanten können länger
dauern als eine lange. Dafür gibt es den [[dijkstra-algorithmus|Dijkstra-Algorithmus]]. Er nimmt statt einer
einfachen Queue eine [[prioritaetswarteschlange|Prioritätswarteschlange]] und arbeitet immer den bisher am schnellsten erreichbaren
Knoten zuerst ab. Navigationsdienste nutzen Weiterentwicklungen dieser Idee.

| Frage | Verfahren |
|---|---|
| Ist B von A aus erreichbar? | Tiefen- oder Breitensuche |
| Weg mit den wenigsten Schritten | Breitensuche |
| Schnellster Weg mit Fahrzeiten | Dijkstra |
| Gibt es einen Kreis? | Tiefensuche mit „in Arbeit“-Markierung |

## Kreise in Abhängigkeiten

In gerichteten Graphen wie Paket-Abhängigkeiten ist ein [[zyklus|Zyklus]] meist ein Fehler: Paket A
braucht B, B braucht C, C braucht A – keines kann zuerst gebaut werden. Eine Tiefensuche erkennt das, wenn
sie sich merkt, welche Knoten gerade **in Arbeit** sind. Trifft sie auf einen Knoten, der noch in Arbeit
ist, hat sie einen Kreis gefunden.

Ohne Kreise lässt sich eine [[topologische-reihenfolge|topologische Reihenfolge]] bilden: Jedes Paket kommt
erst nach allem, wovon es abhängt. Genau so planen Paketmanager und Build-Werkzeuge ihre Arbeit. Das baust
du im Projekt dieses Kurses selbst.

> [!PRAXIS]
> Node.js erlaubt zyklische `require`-Aufrufe, liefert dann aber halb fertige Module aus. Wenn ein Import
> „plötzlich `undefined`“ ist, steckt oft ein Kreis dahinter.

## Zusammenfassung

- Ein Graph besteht aus Knoten und Kanten; er kann gerichtet, gewichtet und mit Kreisen sein.
- Die Adjazenzliste – eine `Map` von Knoten zu Nachbarn – ist die Standard-Speicherform.
- Breiten- und Tiefensuche brauchen in Graphen ein „besucht“-Set und kosten O(V + E).
- Die Breitensuche liefert in ungewichteten Graphen den Weg mit den wenigsten Kanten.
- Für gewichtete Kanten gibt es den Dijkstra-Algorithmus.
- Kreise in Abhängigkeiten erkennst du mit einer Tiefensuche; ohne Kreise gibt es eine topologische Reihenfolge.
