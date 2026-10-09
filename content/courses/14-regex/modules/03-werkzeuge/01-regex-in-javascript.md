---
title: Regex in JavaScript
summary: "test, match, matchAll, replace und split: Welche Methode du wofür nimmst, wie du mit Gruppen ersetzt und warum das Flag g und lastIndex dich überraschen können."
duration: 25
sources:
  - title: MDN – RegExp
    url: https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/RegExp
  - title: MDN – String.prototype.replace()
    url: https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/String/replace
  - title: MDN – String.prototype.matchAll()
    url: https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/String/matchAll
quiz:
  - type: match
    question: Was liefert welcher Aufruf, wenn das Muster passt?
    pairs:
      - { left: "regex.test(text)", right: "true oder false" }
      - { left: "text.match(/x/)", right: "Array mit Treffer, Gruppen und index" }
      - { left: "text.match(/x/g)", right: "Array nur mit den Treffer-Texten" }
      - { left: "text.matchAll(/x/g)", right: "Iterator mit einem Treffer-Array pro Fund" }
      - { left: "text.replace(/x/g, \"y\")", right: "ein neuer String" }
    explanation: "match() verhält sich mit und ohne g unterschiedlich: Mit g verliert es die Gruppen. Brauchst du alle Treffer **mit** Gruppen, nimm matchAll()."
  - type: single
    question: "Was gibt `\"2026-10-09\".replace(/(\\d+)-(\\d+)-(\\d+)/, \"$3.$2.$1\")` zurück?"
    options: ["09.10.2026", "$3.$2.$1", "2026.10.09", "10.09.2026"]
    answer: 0
    explanation: Im Ersatztext stehen $1, $2, $3 für die Capture-Gruppen. So drehst du die Reihenfolge der Teile um.
  - type: find-bug
    question: Die Schleife soll alle Zahlen im Text verdoppeln, bricht aber mit einem Fehler ab. In welcher Zeile liegt die Ursache?
    language: js
    code: |
      const text = "3 Äpfel, 12 Birnen";
      const muster = /\d+/;
      for (const t of text.matchAll(muster)) {
        console.log(Number(t[0]) * 2);
      }
    bug_line: 2
    explanation: "matchAll() verlangt ein Muster mit dem Flag g und wirft sonst einen TypeError. Richtig: `/\\d+/g`."
  - type: multiple
    question: Welche Aussagen über den RegExp-Konstruktor stimmen?
    options:
      - "`new RegExp(\"\\\\d+\")` entspricht `/\\d+/` – der Backslash muss im String doppelt stehen"
      - "Er ist nützlich, wenn das Muster erst zur Laufzeit feststeht"
      - "Benutzereingaben kannst du ohne Escaping direkt einsetzen"
      - "Flags übergibst du als zweites Argument, z. B. `new RegExp(\"x\", \"gi\")`"
    answers: [0, 1, 3]
    explanation: "Im String-Literal ist der Backslash selbst ein Escape-Zeichen – deshalb `\\\\d`. Benutzereingaben enthalten oft Metazeichen wie `.` oder `(` und müssen vorher escapt werden."
tasks:
  - id: preise-umformatieren
    type: code
    language: js
    title: Preise und Daten umformatieren
    description: |
      Ein Online-Shop speichert Texte im englischen Format. Schreibe zwei Funktionen mit `replace()`:

      1. `deutschesDatum(text)` ersetzt **jedes** Datum `JJJJ-MM-TT` im Text durch `TT.MM.JJJJ`.
         `"Lieferung 2026-10-09, Rückgabe bis 2026-11-09"` → `"Lieferung 09.10.2026, Rückgabe bis 09.11.2026"`
      2. `preiseInCent(text)` ersetzt jeden Preis der Form `12.99 EUR` durch den Betrag in Cent: `1299 ct`.
         Führende Nullen entfallen: `0.99 EUR` → `99 ct`. Nutze dafür eine **Ersetzungsfunktion**.
    starter: |
      function deutschesDatum(text) {
        return text.replace(/(\d{4})-(\d{2})-(\d{2})/, "$1.$2.$3");
      }

      function preiseInCent(text) {
        return text.replace(/(\d+)\.(\d{2}) EUR/g, (treffer, euro, cent) => {
          return treffer;
        });
      }
    tests:
      - name: Alle Daten werden umgebaut
        code: assertEqual(deutschesDatum("Lieferung 2026-10-09, Rückgabe bis 2026-11-09"), "Lieferung 09.10.2026, Rückgabe bis 09.11.2026")
      - name: Text ohne Datum bleibt unverändert
        code: |
          assertEqual(deutschesDatum("kein Datum"), "kein Datum")
          assertEqual(deutschesDatum(""), "")
      - name: Preise werden in Cent umgerechnet
        code: assertEqual(preiseInCent("Buch 12.99 EUR, Stift 0.99 EUR"), "Buch 1299 ct, Stift 99 ct")
      - name: Runde Beträge funktionieren
        code: assertEqual(preiseInCent("Gutschein 50.00 EUR"), "Gutschein 5000 ct")
      - name: Andere Zahlen bleiben unangetastet
        code: assertEqual(preiseInCent("Artikel 4711 kostet 3.50 USD"), "Artikel 4711 kostet 3.50 USD")
    hints:
      - "Bei `deutschesDatum` fehlen zwei Dinge: das Flag `g` und die richtige Reihenfolge im Ersatztext."
      - "Die Ersetzungsfunktion bekommt den Treffer und danach die Gruppen als Strings: `(treffer, euro, cent)`."
      - "`Number(euro) * 100 + Number(cent)` ergibt die Cent – danach hängst du ` ct` an."
    solution: |
      ```js
      function deutschesDatum(text) {
        return text.replace(/(\d{4})-(\d{2})-(\d{2})/g, "$3.$2.$1");
      }

      function preiseInCent(text) {
        return text.replace(/(\d+)\.(\d{2}) EUR/g, (treffer, euro, cent) => {
          return `${Number(euro) * 100 + Number(cent)} ct`;
        });
      }
      ```
  - id: methoden-zuordnen
    type: dragdrop
    title: Welche Methode passt?
    description: Ordne jede Aufgabe der JavaScript-Methode zu, mit der du sie am direktesten löst.
    targets:
      - { id: test, label: "regex.test()" }
      - { id: matchall, label: "text.matchAll()" }
      - { id: replace, label: "text.replace()" }
      - { id: split, label: "text.split()" }
    items:
      - { label: "Prüfen, ob eine Eingabe eine gültige Postleitzahl ist", target: test }
      - { label: "Einen Button nur aktivieren, wenn die E-Mail ein @ enthält", target: test }
      - { label: "Alle Datumsangaben samt Jahr, Monat und Tag auslesen", target: matchall }
      - { label: "Für jede Bestellnummer im Text die Nummer und den Index ermitteln", target: matchall }
      - { label: "Alle Telefonnummern im Text durch *** ersetzen", target: replace }
      - { label: "Eine Zeile an Kommas mit beliebig vielen Leerzeichen zerlegen", target: split }
---
Du kennst jetzt die Bausteine. Im [[code|Code]] stellt sich eine neue Frage: **Was** willst du eigentlich wissen? Ob
etwas passt? Wo es passt? Welche Teile drinstecken? Oder willst du den Text verändern? JavaScript hat dafür
jeweils eine eigene Methode – und ein paar Stolperfallen.

## Muster anlegen: Literal oder Konstruktor

Es gibt zwei Schreibweisen für ein Muster:

```js
const a = /\d{4}-\d{2}/g;                 // Literal – Normalfall
const b = new RegExp("\\d{4}-\\d{2}", "g"); // Konstruktor – Muster als String
```

Das Literal ist kürzer und wird beim Laden geprüft. Den Konstruktor brauchst du, wenn das Muster erst zur
**Laufzeit** feststeht, etwa aus einem Suchfeld.

> [!ACHTUNG]
> Im String ist der Backslash selbst ein Escape-Zeichen: Aus `"\d"` wird einfach `d`. Schreibe im
> Konstruktor deshalb `"\\d"`. Setzt du Benutzereingaben ein, musst du deren Metazeichen escapen –
> neuere Laufzeiten bieten dafür `RegExp.escape()`, sonst ersetzt du sie selbst mit
> `text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")`.

## Prüfen und finden: test, match, matchAll

| Methode | Frage | Ergebnis |
|---|---|---|
| `regex.test(text)` | Passt es irgendwo? | `true`/`false` |
| `text.match(regex)` | Wo ist der erste Treffer, welche Gruppen? | Array oder `null` |
| `text.match(regexMitG)` | Welche Texte passen? | Array der Treffer-Texte oder `null` |
| `text.matchAll(regexMitG)` | Alle Treffer **mit** Gruppen | Iterator |
| `text.search(regex)` | An welcher Stelle? | Index oder `-1` |

```js run
const text = "B-1042 und B-7719";
console.log(/B-\d+/.test(text));          // true
console.log(text.match(/B-(\d+)/));       // [ 'B-1042', '1042', index: 0, … ]
console.log(text.match(/B-(\d+)/g));      // [ 'B-1042', 'B-7719' ] – ohne Gruppen!
for (const m of text.matchAll(/B-(\d+)/g)) {
  console.log(m.index, m[1]);             // 0 1042, dann 11 7719
}
```

> [!MERKSATZ]
> Ein Treffer → `match()`. Alle Treffer-Texte → `match()` mit `g`. Alle Treffer **mit** Gruppen →
> `matchAll()` mit `g`.

## Das Treffer-Array genauer ansehen

Das Array, das `match()` ohne `g` und jeder Eintrag von `matchAll()` liefert, hat neben den Gruppen weitere
Eigenschaften:

| Eigenschaft | Inhalt |
|---|---|
| `[0]` | der ganze Treffer |
| `[1]`, `[2]` … | die Capture-Gruppen |
| `index` | Position des Treffers im Text (ab 0) |
| `input` | der durchsuchte Text |
| `groups` | Objekt mit den benannten Gruppen oder `undefined` |

```js run
const m = "Fehler in Zeile 42".match(/Zeile (?<nr>\d+)/);
console.log(m.index, m.groups.nr);   // 10 '42'
```

Mit `index` markierst du Fundstellen, etwa beim Hervorheben eines Suchbegriffs. Brauchst du zusätzlich
Start und Ende jeder Gruppe, gibt es das Flag `d`.

## Ersetzen: replace und replaceAll

`replace()` gibt einen **neuen** [[string|String]] zurück – das Original bleibt unverändert. Ohne `g` ersetzt es nur
den ersten Treffer.

Im Ersatztext gibt es Platzhalter:

| Platzhalter | steht für |
|---|---|
| `$&` | den ganzen Treffer |
| `$1`, `$2` … | Gruppe 1, 2 … |
| `$<name>` | eine benannte Gruppe |
| `$$` | ein echtes Dollarzeichen |

```js run
const tel = "Ruf 0151 2345678 an";
console.log(tel.replace(/\d/g, "*"));                  // "Ruf **** ******* an"
console.log("ada lovelace".replace(/\b\w/g, (b) => b.toUpperCase())); // "Ada Lovelace"
```

Statt eines Textes kannst du eine **Ersetzungsfunktion** übergeben. Sie bekommt den Treffer, dann die
Gruppen – und gibt den neuen Text zurück. So rechnest du beim Ersetzen, formatierst oder schlägst Werte nach.
`replaceAll()` funktioniert wie `replace()`, verlangt bei Regex aber das Flag `g`.

## Zerlegen mit split

`split()` akzeptiert ebenfalls ein Muster als Trennzeichen. Das ist praktisch, wenn die Trenner
unregelmäßig sind:

```js run
console.log("rot, grün ,blau,,gelb".split(/\s*,+\s*/));   // [ 'rot', 'grün', 'blau', 'gelb' ]
console.log("eins  zwei\tdrei".split(/\s+/));              // [ 'eins', 'zwei', 'drei' ]
```

> [!PRAXIS]
> Tags, die Nutzer:innen in ein Formularfeld tippen („php, laravel ,  api“), zerlegst du mit
> `split(/\s*,\s*/)` und filterst leere Einträge heraus. Das ist robuster als `split(",")` mit
> anschließendem `trim()` an jeder Stelle.

## Die lastIndex-Falle

Ein Muster mit `g` (oder `y`) hat einen Zustand: `lastIndex`. Jeder Aufruf von `test()` oder `exec()`
beginnt die Suche an dieser Stelle und verschiebt sie weiter.

```js run
const istZahl = /^\d+$/g;
console.log(istZahl.test("42"));   // true  – lastIndex ist jetzt 2
console.log(istZahl.test("42"));   // false – Suche beginnt bei Index 2!
console.log(istZahl.test("42"));   // true  – nach dem Fehlschlag wieder 0
```

> [!FEHLER]
> **`g` beim Prüfen.** Für `test()` brauchst du kein `g`. Ein wiederverwendetes Muster mit `g` liefert
> abwechselnd `true` und `false` – ein Fehler, der nur bei jedem zweiten Formular-Absenden auftritt und
> deshalb schwer zu finden ist.

## Zusammenfassung

- Regex-Literale `/…/` sind der Normalfall; `new RegExp("…")` braucht doppelte Backslashes.
- `test()` prüft, `match()` liefert den ersten Treffer, `match()` mit `g` alle Texte, `matchAll()` alle Treffer mit Gruppen.
- `replace()` ersetzt mit `$1`, `$<name>`, `$&` oder einer Ersetzungsfunktion – ohne `g` nur den ersten Treffer.
- `split()` zerlegt an flexiblen Trennern wie `/\s*,\s*/`.
- Muster mit `g` merken sich `lastIndex` – zum Prüfen nimmst du Muster ohne `g`.
