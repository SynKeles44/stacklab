---
title: Binäre Suche
summary: Wie du in sortierten Daten mit jedem Schritt die Hälfte ausschließt, die binäre Suche ohne Off-by-one-Fehler schreibst und mit git bisect einen fehlerhaften Commit in wenigen Schritten findest.
duration: 20
sources:
  - title: Git – git-bisect Documentation
    url: https://git-scm.com/docs/git-bisect
  - title: MDN – Array.prototype.findIndex()
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex
  - title: MDN – Math.floor()
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/floor
quiz:
  - type: single
    question: Wie viele Vergleiche braucht die binäre Suche höchstens, um einen Wert in 1 000 000 sortierten Zahlen zu finden?
    options: ["etwa 20", "etwa 1 000", "etwa 500 000", "genau 1 000 000"]
    answer: 0
    explanation: >
      Jeder Vergleich halbiert den Suchbereich. 2²⁰ ist etwas mehr als eine Million – nach etwa 20 Halbierungen
      bleibt nur noch ein Element übrig.
  - type: multiple
    question: Welche Voraussetzungen und Eigenschaften hat die binäre Suche?
    options:
      - Die Daten müssen sortiert sein.
      - Man muss per Index direkt auf die Mitte zugreifen können.
      - Sie funktioniert genauso gut auf einer verketteten Liste.
      - Ihr Aufwand ist O(log n).
    answers: [0, 1, 3]
    explanation: >
      Auf einer verketteten Liste müsstest du bis zur Mitte laufen – das kostet schon O(n). Die binäre Suche
      braucht sortierte Daten mit O(1)-Zugriff auf jede Position, also ein Array.
  - type: find-bug
    question: "Diese binäre Suche findet manche Werte nicht – zum Beispiel die 7 in `[1, 3, 5, 7]`. In welcher Zeile steckt der Fehler?"
    language: js
    code: |
      function suche(liste, ziel) {
        let links = 0;
        let rechts = liste.length - 1;
        while (links < rechts) {
          const mitte = Math.floor((links + rechts) / 2);
          if (liste[mitte] === ziel) return mitte;
          if (liste[mitte] < ziel) links = mitte + 1;
          else rechts = mitte - 1;
        }
        return -1;
      }
    bug_line: 4
    explanation: >
      Mit `links < rechts` bricht die Schleife ab, wenn nur noch ein Element übrig ist – genau dieses wird
      nie geprüft. Richtig ist `while (links <= rechts)`.
  - type: cloze
    text: "Mit `git ___` findet Git den Commit, der einen Fehler eingeführt hat, per binärer Suche. Bei 1 000 Commits brauchst du dafür etwa ___ Tests."
    blanks:
      - ["bisect"]
      - ["10", "zehn"]
    explanation: log₂(1 000) ist knapp 10 – jeder Test halbiert die Menge der verdächtigen Commits.
tasks:
  - id: binaere-suche-schreiben
    type: code
    language: ts
    title: Binäre Suche und „erster Index ab“
    description: |
      Schreibe zwei Funktionen für **aufsteigend sortierte** Zahlen-Arrays. Beide müssen in O(log n) laufen –
      also ohne `indexOf`, `includes`, `find` oder Schleifen über alle Elemente.

      1. `binaereSuche(liste, ziel)` liefert einen Index, an dem `ziel` steht, oder `-1`.
      2. `ersterIndexAb(liste, wert)` liefert den **ersten** Index, dessen Element `>= wert` ist. Gibt es keins,
         ist das Ergebnis `liste.length`. Damit findest du z. B. den ersten Termin ab einem Datum oder die
         Einfügeposition für einen neuen Wert.
    starter: |
      function binaereSuche(liste: number[], ziel: number): number {
        let links = 0;
        let rechts = liste.length - 1;
        return -1;
      }

      function ersterIndexAb(liste: number[], wert: number): number {
        return liste.length;
      }
    tests:
      - name: findet vorhandene Werte – auch am Rand
        code: |
          const l = [2, 4, 8, 16, 32, 64];
          assertEqual(binaereSuche(l, 2), 0);
          assertEqual(binaereSuche(l, 16), 3);
          assertEqual(binaereSuche(l, 64), 5);
      - name: fehlende Werte und leere Liste
        code: |
          assertEqual(binaereSuche([2, 4, 8], 5), -1);
          assertEqual(binaereSuche([2, 4, 8], 100), -1);
          assertEqual(binaereSuche([], 1), -1);
      - name: ersterIndexAb mit Duplikaten
        code: |
          const l = [1, 3, 3, 3, 7, 9];
          assertEqual(ersterIndexAb(l, 3), 1);
          assertEqual(ersterIndexAb(l, 4), 4);
          assertEqual(ersterIndexAb(l, 0), 0);
          assertEqual(ersterIndexAb(l, 10), 6);
          assertEqual(ersterIndexAb([], 5), 0);
      - name: eine Million Suchen in einer Million Werten
        code: |
          const n = 1000000;
          const l = Array.from({ length: n }, (_, i) => i * 2);
          const start = performance.now();
          let treffer = 0;
          for (let i = 0; i < n; i++) if (binaereSuche(l, i) !== -1) treffer++;
          assertEqual(treffer, n / 2);
          assertTrue(performance.now() - start < 1500, "zu langsam – ist das wirklich O(log n)?");
    hints:
      - "Schleife: `while (links <= rechts) { const mitte = Math.floor((links + rechts) / 2); … }` – je nach Vergleich `links = mitte + 1` oder `rechts = mitte - 1`."
      - "Für `ersterIndexAb` nimmst du einen halboffenen Bereich: `let links = 0, rechts = liste.length;` und `while (links < rechts)`."
      - "In `ersterIndexAb`: Ist `liste[mitte] < wert`, liegt die Antwort rechts davon (`links = mitte + 1`), sonst kann `mitte` selbst die Antwort sein (`rechts = mitte`). Am Ende ist `links` das Ergebnis."
    solution: |
      function binaereSuche(liste: number[], ziel: number): number {
        let links = 0;
        let rechts = liste.length - 1;
        while (links <= rechts) {
          const mitte = Math.floor((links + rechts) / 2);
          if (liste[mitte] === ziel) return mitte;
          if (liste[mitte] < ziel) links = mitte + 1;
          else rechts = mitte - 1;
        }
        return -1;
      }

      function ersterIndexAb(liste: number[], wert: number): number {
        let links = 0;
        let rechts = liste.length;
        while (links < rechts) {
          const mitte = Math.floor((links + rechts) / 2);
          if (liste[mitte] < wert) links = mitte + 1;
          else rechts = mitte;
        }
        return links;
      }
  - id: git-bisect
    type: terminal
    title: Den schuldigen Commit mit git bisect finden
    description: |
      Im Repository `shop` liegen 40 Commits. Irgendwann ist die Bruttopreis-Berechnung in `preis.js` kaputt
      gegangen: `node test.js` meldet heute einen Fehler, beim ersten Commit lief der Test noch. Statt 40 Commits
      einzeln zu prüfen, lässt du Git eine binäre Suche machen.

      Klicke zuerst auf **Aufgabe vorbereiten**. Dann (im Ordner `bisect-uebung/shop`):

      1. Starte die Suche: `git bisect start`, markiere den aktuellen Stand als schlecht (`git bisect bad`) und den
         ersten Commit als gut (`git bisect good <hash>` – den Hash zeigt dir `git log --oneline | tail -1`).
      2. Lass Git den Test automatisch ausführen: `git bisect run node test.js`.
      3. Schreibe den Hash des ersten schlechten Commits (mindestens 7 Zeichen) in die Datei `../schuldig.txt`.
      4. Beende die Suche mit `git bisect reset`.
    workdir: bisect-uebung
    setup: |
      mkdir shop
      cd shop
      git init -q -b main
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      cat > preis.js <<'EOF'
      const STEUERSATZ = 0.19;
      function brutto(netto) {
        return Math.round(netto * (1 + STEUERSATZ) * 100) / 100;
      }
      module.exports = { brutto };
      EOF
      cat > test.js <<'EOF'
      const { brutto } = require('./preis.js');
      if (brutto(100) !== 119) {
        console.error('FEHLER: brutto(100) ist ' + brutto(100) + ', erwartet 119');
        process.exit(1);
      }
      console.log('ok');
      EOF
      echo "Änderungen" > CHANGELOG.txt
      git add .
      git commit -q -m "Startversion des Shops"
      for i in $(seq 2 40); do
        echo "Eintrag $i" >> CHANGELOG.txt
        if [ "$i" -eq 27 ]; then
          sed -i 's/0\.19/0.019/' preis.js
        fi
        git add .
        git commit -q -m "Pflege Version $i"
      done
    checks:
      - type: file_exists
        path: schuldig.txt
        message: Lege die Datei schuldig.txt im Ordner bisect-uebung an (eine Ebene über shop) und schreibe den Hash hinein.
      - type: command
        run: |
          soll=$(cd shop && git log --reverse --format=%H -S'0.019' -- preis.js | head -1)
          ist=$(tr -d '[:space:]' < schuldig.txt)
          [ ${#ist} -ge 7 ] && case "$soll" in "$ist"*) exit 0 ;; *) exit 1 ;; esac
        message: "In schuldig.txt steht noch nicht der Hash des ersten schlechten Commits. `git bisect run node test.js` nennt ihn am Ende in der Zeile „… is the first bad commit“."
      - type: command
        run: cd shop && ! git bisect log >/dev/null 2>&1
        message: Die Suche läuft noch. Beende sie im Ordner shop mit `git bisect reset`.
      - type: command
        run: cd shop && git rev-parse --abbrev-ref HEAD
        stdout_equals: main
        message: Du bist nicht wieder auf dem Branch main. `git bisect reset` bringt dich zurück.
    hints:
      - "`cd shop`, dann `git bisect start` und `git bisect bad`. Den ersten Commit findest du mit `git log --oneline | tail -1`."
      - "`git bisect run node test.js` testet automatisch – Exit-Code 0 heißt gut, 1 heißt schlecht. Zähle mit, wie viele Schritte Git braucht: höchstens 6 für 40 Commits."
      - "Den Hash schreibst du z. B. mit `echo abc1234 > ../schuldig.txt`. Danach `git bisect reset`."
    solution: |
      ```bash
      cd shop
      git bisect start
      git bisect bad
      git bisect good $(git rev-list --max-parents=0 HEAD)
      git bisect run node test.js
      # Ausgabe: <hash> is the first bad commit
      git rev-parse refs/bisect/bad > ../schuldig.txt
      git bisect reset
      ```
---
Denk an das Zahlenraten-Spiel: „Ich denke an eine Zahl zwischen 1 und 100.“ Wer klug rät, sagt 50, hört
„größer“ und sagt 75. Mit jeder Antwort fällt die Hälfte der Möglichkeiten weg – nach höchstens sieben
Fragen steht die Zahl fest. Genau diese Strategie ist die [[binaere-suche|binäre Suche]], und sie ist einer
der Gründe, warum sortierte Daten so wertvoll sind.

## Die Idee: immer die Hälfte wegwerfen

Die binäre Suche funktioniert auf einem **sortierten** Array:

1. Schau dir das Element in der Mitte an.
2. Ist es der gesuchte Wert, bist du fertig.
3. Ist es kleiner, kann der Wert nur in der rechten Hälfte liegen – sonst nur in der linken.
4. Wiederhole mit der verbleibenden Hälfte, bis der Bereich leer ist.

| Anzahl Elemente | lineare Suche (höchstens) | binäre Suche (höchstens) |
|---|---|---|
| 100 | 100 | 7 |
| 1 000 000 | 1 000 000 | 20 |
| 1 000 000 000 | 1 000 000 000 | 30 |

Das ist **O(log n)**: Verdoppelst du die Datenmenge, kommt nur ein einziger Schritt hinzu.

> [!MERKSATZ]
> Binäre Suche braucht zwei Dinge: **sortierte** Daten und **direkten Zugriff** auf jede Position – also ein Array.

## Die Umsetzung in JavaScript

Du merkst dir den noch möglichen Bereich mit zwei Grenzen, `links` und `rechts`:

```js
function binaereSuche(liste, ziel) {
  let links = 0;
  let rechts = liste.length - 1;          // beide Grenzen gehören zum Bereich
  while (links <= rechts) {               // solange der Bereich nicht leer ist
    const mitte = Math.floor((links + rechts) / 2);
    if (liste[mitte] === ziel) return mitte;
    if (liste[mitte] < ziel) links = mitte + 1;   // rechte Hälfte
    else rechts = mitte - 1;                       // linke Hälfte
  }
  return -1;
}

binaereSuche([2, 4, 8, 16, 32], 16); // 3 – nach zwei Vergleichen
```

`mitte + 1` und `mitte - 1` sind wichtig: Das Element in der Mitte ist schon geprüft und gehört nicht mehr
zum Bereich. Sonst kann die Schleife endlos laufen.

## Off-by-one: die klassischen Fehler

Kaum ein Algorithmus ist so kurz und gleichzeitig so fehleranfällig. Fast alle Fehler sind
[[off-by-one-fehler|Off-by-one-Fehler]] – eine Grenze ist um eins verschoben:

| Fehler | Folge |
|---|---|
| `while (links < rechts)` bei geschlossenem Bereich | das letzte verbleibende Element wird nie geprüft |
| `links = mitte` statt `mitte + 1` | Endlosschleife, wenn zwei Elemente übrig sind |
| `rechts = liste.length` und dann `liste[rechts]` | Zugriff hinter das Array-Ende |

> [!FEHLER]
> Binäre Suche auf **unsortierten** Daten wirft keinen Fehler – sie liefert einfach falsche Ergebnisse.
> Prüfe die Voraussetzung, bevor du dich auf das Ergebnis verlässt.

Teste deine Suche deshalb immer mit dem ersten und letzten Element, einem fehlenden Wert und einer leeren
Liste.

## Mehr als „gefunden oder nicht“

Oft willst du nicht nur wissen, **ob** ein Wert existiert, sondern **wo er hingehört**. Die Variante „erster
Index ab einem Wert“ (englisch *lower bound*) beantwortet Fragen wie:

- Ab welchem Index beginnen die Termine ab dem 1. März?
- An welcher Stelle füge ich einen neuen Wert ein, damit das Array sortiert bleibt?
- Wie viele Preise liegen unter 50 €? (Das ist genau der gefundene Index.)

Ob sich das Sortieren lohnt, hängt von der Nutzung ab. Einmal sortieren kostet O(n log n). Danach ist jede
Suche O(log n). Brauchst du nur „gibt es den Wert?“ ohne Reihenfolge, ist ein `Set` mit O(1) noch einfacher.

## Binäre Suche im Entwickleralltag

Das wichtigste Werkzeug mit binärer Suche ist [[git-bisect|git bisect]]. Du sagst Git, welcher Commit gut
und welcher schlecht ist. Git checkt die Mitte aus, du testest – oder Git führt mit `git bisect run` ein
Test-Skript automatisch aus.

```bash title="Terminal"
git bisect start
git bisect bad                 # der aktuelle Stand ist kaputt
git bisect good a1b2c3d        # dieser alte Commit war noch in Ordnung
git bisect run npm test        # Git halbiert, bis der erste schlechte Commit feststeht
git bisect reset               # zurück zum Ausgangszustand
```

> [!PRAXIS]
> Bei 500 Commits seit dem letzten funktionierenden Release brauchst du mit `git bisect` höchstens neun
> Testläufe. Datenbank-Indizes nutzen dieselbe Idee in Form sortierter Bäume.

## Zusammenfassung

- Die binäre Suche halbiert den Suchbereich in jedem Schritt und braucht O(log n) Vergleiche.
- Voraussetzung sind sortierte Daten mit direktem Zugriff per Index.
- `while (links <= rechts)` mit `mitte + 1` / `mitte - 1` ist die sichere Grundform.
- Off-by-one-Fehler sind die häufigste Fehlerquelle – teste Ränder, fehlende Werte und leere Listen.
- „Erster Index ab“ liefert Einfügepositionen und Bereichsgrenzen.
- `git bisect` findet den Commit, der einen Fehler eingeführt hat, per binärer Suche.
