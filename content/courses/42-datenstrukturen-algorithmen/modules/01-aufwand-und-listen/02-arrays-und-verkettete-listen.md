---
title: Arrays und verkettete Listen
summary: Warum der Zugriff auf ein Array-Element sofort geht, Einfügen am Anfang aber teuer ist – und wie eine verkettete Liste dieses Problem umdreht.
duration: 25
sources:
  - title: MDN – Array
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
  - title: MDN – Array.prototype.splice()
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
  - title: PHP-Handbuch – SplDoublyLinkedList
    url: https://www.php.net/manual/de/class.spldoublylinkedlist.php
quiz:
  - type: single
    question: Warum ist `liste[50000]` bei einem Array genauso schnell wie `liste[0]`?
    options:
      - Weil JavaScript alle Elemente vorher in einen Cache lädt.
      - Weil die Elemente nebeneinander liegen und die Position direkt aus dem Index berechnet wird.
      - Weil Arrays intern immer sortiert sind.
      - Ist es nicht – `liste[50000]` dauert 50 000-mal so lange.
    answer: 1
    explanation: >
      Ein Array speichert seine Elemente in einem zusammenhängenden Speicherbereich. Die Adresse von
      Element i ist „Start + i · Elementgröße“ – eine einzige Rechnung, also O(1).
  - type: match
    question: Ordne jeder Operation ihren Aufwand zu (n = Anzahl der Elemente).
    pairs:
      - { left: "Array: liste[i] lesen", right: "O(1)" }
      - { left: "Array: liste.unshift(x)", right: "O(n), alles rückt nach" }
      - { left: "Verkettete Liste: vorne einfügen", right: "O(1), nur Zeiger umhängen" }
      - { left: "Verkettete Liste: i-tes Element lesen", right: "O(n), von vorne durchlaufen" }
    explanation: Array und verkettete Liste haben genau entgegengesetzte Stärken und Schwächen.
  - type: multiple
    question: Welche Array-Operationen sind in JavaScript linear, also O(n)?
    options:
      - "`liste.push(x)`"
      - "`liste.shift()`"
      - "`liste.splice(0, 0, x)`"
      - "`liste.length`"
      - "`liste.indexOf(x)`"
    answers: [1, 2, 4]
    explanation: >
      `shift` und `splice` am Anfang verschieben alle folgenden Elemente, `indexOf` durchsucht das Array.
      `push` hängt hinten an (amortisiert O(1)) und `length` ist ein gespeicherter Wert.
  - type: find-bug
    question: "`einfuegenNach(knoten, wert)` soll einen neuen Knoten hinter `knoten` einhängen. In welcher Zeile geht der Rest der Liste verloren?"
    language: js
    code: |
      function einfuegenNach(knoten, wert) {
        const neu = { wert, next: null };
        knoten.next = neu;
        neu.next = knoten.next;
      }
    bug_line: 3
    explanation: >
      Zeile 3 überschreibt `knoten.next`, bevor der alte Nachfolger gesichert ist. Danach zeigt `neu.next`
      auf sich selbst. Richtig ist die umgekehrte Reihenfolge: erst `neu.next = knoten.next`, dann
      `knoten.next = neu`.
tasks:
  - id: verkettete-liste
    type: code
    language: js
    title: Baue eine verkettete Liste
    description: |
      Vervollständige die Klasse `VerketteteListe`. Jeder Knoten ist ein Objekt `{ wert, next }`.
      Die Liste merkt sich den ersten (`kopf`) und den letzten Knoten (`ende`), damit beide Enden O(1) sind.

      1. `vorne(wert)` fügt einen Wert am Anfang ein.
      2. `hinten(wert)` fügt einen Wert am Ende ein.
      3. `entferneVorne()` entfernt den ersten Knoten und gibt seinen Wert zurück – bei leerer Liste `undefined`.
      4. `groesse` ist die aktuelle Anzahl der Elemente.
      5. `toArray()` gibt alle Werte von vorne nach hinten als Array zurück.
    starter: |
      class VerketteteListe {
        constructor() {
          this.kopf = null;
          this.ende = null;
          this.groesse = 0;
        }

        vorne(wert) {
          // neuen Knoten anlegen, auf den alten Kopf zeigen lassen
        }

        hinten(wert) {
          // an this.ende anhängen – Achtung bei leerer Liste
        }

        entferneVorne() {
          return undefined;
        }

        toArray() {
          const werte = [];
          return werte;
        }
      }
    tests:
      - name: vorne und hinten einfügen
        code: |
          const l = new VerketteteListe();
          l.hinten(2); l.hinten(3); l.vorne(1);
          assertDeepEqual(l.toArray(), [1, 2, 3]);
          assertEqual(l.groesse, 3);
      - name: leere Liste
        code: |
          const l = new VerketteteListe();
          assertDeepEqual(l.toArray(), []);
          assertEqual(l.entferneVorne(), undefined);
          assertEqual(l.groesse, 0);
      - name: entferneVorne liefert Werte in Reihenfolge
        code: |
          const l = new VerketteteListe();
          l.hinten("a"); l.hinten("b");
          assertEqual(l.entferneVorne(), "a");
          assertEqual(l.entferneVorne(), "b");
          assertEqual(l.entferneVorne(), undefined);
          assertEqual(l.groesse, 0);
      - name: nach dem Leeren wieder hinten anhängen
        code: |
          const l = new VerketteteListe();
          l.vorne(1); l.entferneVorne(); l.hinten(5); l.hinten(6);
          assertDeepEqual(l.toArray(), [5, 6]);
          assertEqual(l.ende.wert, 6);
      - name: Wert 0 bleibt erhalten
        code: |
          const l = new VerketteteListe();
          l.hinten(0);
          assertEqual(l.entferneVorne(), 0);
    hints:
      - "`vorne`: `const knoten = { wert, next: this.kopf }; this.kopf = knoten;` – und wenn die Liste leer war, ist der neue Knoten auch das Ende."
      - "`hinten`: Ist die Liste leer, sind Kopf und Ende der neue Knoten. Sonst `this.ende.next = knoten; this.ende = knoten;`."
      - "`entferneVorne`: Wird die Liste dabei leer, setze auch `this.ende = null`. `toArray` läuft mit `let k = this.kopf; while (k) { …; k = k.next; }` durch."
    solution: |
      class VerketteteListe {
        constructor() {
          this.kopf = null;
          this.ende = null;
          this.groesse = 0;
        }

        vorne(wert) {
          const knoten = { wert, next: this.kopf };
          this.kopf = knoten;
          if (this.ende === null) this.ende = knoten;
          this.groesse++;
        }

        hinten(wert) {
          const knoten = { wert, next: null };
          if (this.ende === null) {
            this.kopf = knoten;
          } else {
            this.ende.next = knoten;
          }
          this.ende = knoten;
          this.groesse++;
        }

        entferneVorne() {
          if (this.kopf === null) return undefined;
          const wert = this.kopf.wert;
          this.kopf = this.kopf.next;
          if (this.kopf === null) this.ende = null;
          this.groesse--;
          return wert;
        }

        toArray() {
          const werte = [];
          let k = this.kopf;
          while (k !== null) {
            werte.push(k.wert);
            k = k.next;
          }
          return werte;
        }
      }
  - id: knoten-einhaengen
    type: order
    title: Einen Knoten in der Mitte einhängen
    description: >
      Du willst in der Liste `A → C` den Wert `B` zwischen `A` und `C` einfügen, ohne dass `C` verloren geht.
      Bring die Schritte in die richtige Reihenfolge.
    items:
      - Den Knoten A finden, hinter dem eingefügt werden soll.
      - "Einen neuen Knoten `{ wert: 'B', next: null }` anlegen."
      - "Den neuen Knoten auf den bisherigen Nachfolger zeigen lassen: `neu.next = a.next` (also C)."
      - "A auf den neuen Knoten zeigen lassen: `a.next = neu`."
      - "Die Größe der Liste um eins erhöhen."
    hints:
      - Wer zuerst `a.next` überschreibt, hat keinen Weg mehr zu C.
---
Du baust eine Playlist. Neue Lieblingssongs sollen ganz nach vorne. Bei einem Array heißt das: Jeder
vorhandene Song rückt einen Platz nach hinten. Bei zehn Songs merkst du nichts, bei einer Million schon.
In dieser Lektion vergleichst du zwei Grundformen, um Elemente hintereinander zu speichern: das
[[array|Array]] und die [[verkettete-liste|verkettete Liste]].

## Das Array: Fächer nebeneinander

Ein Array ist wie eine Reihe nummerierter Schließfächer im Bahnhof. Alle Fächer liegen direkt
nebeneinander im [[arbeitsspeicher|Arbeitsspeicher]]. Willst du Fach 512, rechnest du einfach:
Startadresse + 512 · Fachgröße – und gehst direkt hin.

```js
const farben = ["rot", "grün", "blau"];
farben[2];        // O(1) – direkt berechnet
farben.push("gelb"); // O(1) – hinten ist meistens Platz
```

Ist hinten kein Platz mehr, reserviert die Laufzeitumgebung einen größeren Bereich und kopiert alles um.
Das passiert selten (die Größe wird jeweils vervielfacht), deshalb gilt `push` als
[[amortisierte-laufzeit|amortisiert]] O(1): im Durchschnitt über viele Aufrufe konstant.

> [!MERKSATZ]
> Ein Array glänzt beim **Zugriff über den Index** und beim **Anhängen am Ende**.

## Was Einfügen am Anfang kostet

Schwierig wird es, wenn du vorne oder in der Mitte etwas änderst. Damit die Fächer lückenlos bleiben,
muss jedes folgende Element umziehen.

| Operation | Aufwand | Grund |
|---|---|---|
| `liste[i]` | O(1) | Adresse wird berechnet |
| `push` / `pop` | O(1) | nur das Ende ändert sich |
| `unshift` / `shift` | O(n) | alle Elemente rücken |
| `splice(i, 0, x)` | O(n) | alles ab i rückt |
| `includes` / `indexOf` | O(n) | Element für Element prüfen |

> [!FEHLER]
> Eine Warteschlange mit `push` und `shift` zu bauen ist bei großen Mengen langsam: Jedes `shift`
> verschiebt alle restlichen Elemente. In der Lektion über Queues lernst du eine bessere Lösung.

## Die verkettete Liste: eine Schnitzeljagd

Eine verkettete Liste funktioniert wie eine Schnitzeljagd: Jeder Zettel enthält einen Wert und den
Hinweis, wo der nächste Zettel liegt. Ein solcher Zettel heißt [[knoten|Knoten]], der Hinweis ist eine
[[referenz|Referenz]] auf den nächsten Knoten (`next`).

![Array und verkettete Liste im Vergleich](/assets/datenstrukturen-algorithmen/array-und-liste.svg)

- **Vorne einfügen:** neuen Knoten anlegen, auf den alten Kopf zeigen lassen – O(1), egal wie lang die Liste ist.
- **Element Nr. 500 lesen:** 500 Hinweisen folgen – O(n).
- **Knoten entfernen:** den Vorgänger auf den Nachfolger zeigen lassen – O(1), wenn du den Vorgänger schon kennst.

Die Knoten liegen verstreut im Speicher. Nur die Referenzen halten sie zusammen.

## Eine Liste in JavaScript

JavaScript hat keine eingebaute verkettete Liste. Du baust sie aus einfachen Objekten:

```js
let kopf = null;

function vorne(wert) {
  kopf = { wert, next: kopf }; // neuer Knoten zeigt auf den alten Kopf
}

vorne(3); vorne(2); vorne(1);

for (let k = kopf; k !== null; k = k.next) {
  console.log(k.wert); // 1, 2, 3
}
```

Merkt sich die Liste zusätzlich ihr letztes Element (`ende`), ist auch das Anhängen hinten O(1). Eine
**doppelt** verkettete Liste speichert in jedem Knoten außerdem `prev` – dann kannst du in beide
Richtungen laufen. PHP bringt dafür
[`SplDoublyLinkedList`](https://www.php.net/manual/de/class.spldoublylinkedlist.php) mit.

## Wer gewinnt im Alltag?

In der Praxis gewinnt fast immer das Array. Der Prozessor liest Speicher in Blöcken; nebeneinander
liegende Elemente landen gemeinsam im schnellen Prozessor-Cache. Verstreute Knoten verlieren diesen
Vorteil.

| Brauchst du … | dann nimm |
|---|---|
| Zugriff per Index, Sortieren, Durchlaufen | Array |
| Ständiges Einfügen/Entfernen an beiden Enden | Queue-Struktur (nächstes Modul) |
| Häufiges Einfügen mitten in sehr langen Folgen | verkettete Liste |

> [!PRAXIS]
> Verkettete Listen schreibst du im Weballtag selten selbst. Du triffst die Idee aber überall: im
> [[dom|DOM]] hat jeder Knoten `nextSibling`, ein Git-Commit zeigt auf seinen Vorgänger, und viele
> Caches halten ihre Einträge in einer doppelt verketteten Liste.

## Zusammenfassung

- Ein Array speichert Elemente nebeneinander: Index-Zugriff und `push` sind O(1).
- Einfügen oder Entfernen am Anfang (`unshift`, `shift`, `splice`) ist O(n), weil alles nachrückt.
- Eine verkettete Liste besteht aus Knoten mit Wert und Referenz auf den Nachfolger.
- Vorne einfügen ist in der Liste O(1), der Zugriff auf das i-te Element O(n).
- Beim Umhängen von Referenzen zuerst den Nachfolger sichern, sonst geht der Rest verloren.
- Im Alltag ist das Array meist schneller, weil es den Prozessor-Cache gut nutzt.
