---
title: Schleifen
summary: Code wiederholen statt kopieren – mit for, while und for...of, gesteuert durch break und continue, und ohne Off-by-one-Fehler.
duration: 25
sources:
  - title: MDN – Schleifen und Iteration
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration
  - title: MDN – for...of
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of
  - title: MDN – while
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/while
  - title: PHP-Handbuch – foreach
    url: https://www.php.net/manual/de/control-structures.foreach.php
quiz:
  - type: single
    question: Wie oft läuft der Körper von `for (let i = 0; i < 5; i++) { … }`?
    options: ["4-mal", "5-mal", "6-mal"]
    answer: 1
    explanation: i nimmt die Werte 0, 1, 2, 3, 4 an – das sind 5 Durchläufe. Bei i = 5 ist die Bedingung falsch.
  - type: match
    question: Ordne jedem Teil seine Aufgabe zu.
    pairs:
      - { left: "let i = 0", right: "Startwert – läuft einmal vor der Schleife" }
      - { left: "i < 10", right: "Bedingung – vor jedem Durchlauf geprüft" }
      - { left: "i++", right: "Schritt – nach jedem Durchlauf ausgeführt" }
      - { left: "break", right: "Beendet die ganze Schleife sofort" }
      - { left: "continue", right: "Überspringt den Rest des aktuellen Durchlaufs" }
    explanation: Start einmal, dann immer Bedingung → Körper → Schritt. break bricht ab, continue springt zum nächsten Durchlauf.
  - type: find-bug
    question: Dieses Programm hört nie auf. Welche Zeile ist falsch?
    language: js
    code: |
      let i = 1;
      while (i <= 3) {
        console.log(i);
        i--;
      }
    bug_line: 4
    explanation: i wird verringert statt erhöht. 1, 0, -1 … bleiben immer <= 3 – eine Endlosschleife. Richtig ist i++.
  - type: find-bug
    question: Die Schleife soll alle Elemente ausgeben, liefert am Ende aber zusätzlich `undefined`. Welche Zeile ist falsch?
    language: js
    code: |
      const farben = ["rot", "grün", "blau"];
      for (let i = 0; i <= farben.length; i++) {
        console.log(farben[i]);
      }
    bug_line: 2
    explanation: Der letzte gültige Index ist length - 1. Mit <= läuft die Schleife einmal zu oft und liest farben[3]. Richtig ist i < farben.length.
tasks:
  - id: schleife-beschriften
    type: diagram
    title: Beschrifte den Ablauf einer for-Schleife
    description: Ordne die vier Teile der Schleife und das Ende den richtigen Kästen zu. Der Code in den Kästen hilft dir.
    image: /assets/programmieren-grundlagen/m3-for-schleife-leer.svg
    slots:
      - { x: 17, y: 25, answer: 1. Start }
      - { x: 50, y: 25, answer: 2. Bedingung }
      - { x: 83, y: 25, answer: Ende }
      - { x: 50, y: 69, answer: 3. Schleifenkörper }
      - { x: 17, y: 69, answer: 4. Schritt }
    distractors: [Funktion, Rückgabewert]
    hints:
      - Nur bei true geht es in den Schleifenkörper, bei false zum Ende.
  - id: sparziel-reparieren
    type: terminal
    title: Repariere die Spar-Schleife
    description: |
      Im Ordner `sparplan` liegt `sparen.js`. Es soll ausrechnen, nach wie vielen Monaten ein Sparziel von 1000 €
      erreicht ist, wenn du jeden Monat 150 € zurücklegst. Leider hängt das Programm in einer **Endlosschleife**.

      Klicke zuerst auf **Aufgabe vorbereiten**.

      1. Wechsle in den Ordner (`cd sparplan`) und sieh dir die Datei an: `cat sparen.js`
      2. Starte sie mit `node sparen.js` – die Ausgabe hört nicht auf. Brich mit **Strg+C** ab.
      3. Finde heraus, warum die Bedingung nie falsch wird, und repariere die Datei mit `nano sparen.js` (Speichern: Strg+O, Enter; Beenden: Strg+X).
      4. Starte erneut. Die letzte Zeile soll lauten: `Ziel erreicht nach 7 Monaten: 1050 €`
    workdir: sparplan
    setup: |
      cat > sparen.js <<'EOF'
      const ziel = 1000;
      const sparrate = 150;
      let kontostand = 0;
      let monate = 0;

      while (kontostand < ziel) {
        monate++;
        console.log(`Monat ${monate}: ${kontostand} €`);
      }

      console.log(`Ziel erreicht nach ${monate} Monaten: ${kontostand} €`);
      EOF
    checks:
      - type: command
        run: timeout 3 node sparen.js > /dev/null
        message: sparen.js läuft noch endlos oder bricht mit einem Fehler ab. Wird kontostand in der Schleife erhöht?
      - type: command
        run: timeout 3 node sparen.js | tail -n 1
        stdout_equals: "Ziel erreicht nach 7 Monaten: 1050 €"
        message: "Die letzte Zeile soll „Ziel erreicht nach 7 Monaten: 1050 €\" lauten. Erhöhst du kontostand um die sparrate?"
      - type: command
        run: timeout 3 node sparen.js | grep -c "^Monat"
        stdout_equals: "7"
        message: Für jeden der 7 Monate soll weiterhin eine Zeile „Monat …" ausgegeben werden.
    hints:
      - Die Bedingung prüft `kontostand < ziel`. Ändert sich kontostand irgendwo in der Schleife?
      - "Ergänze im Schleifenkörper `kontostand += sparrate;` – vor der Ausgabe, damit der neue Stand angezeigt wird."
    solution: |
      ```js
      while (kontostand < ziel) {
        monate++;
        kontostand += sparrate;
        console.log(`Monat ${monate}: ${kontostand} €`);
      }
      ```
      Danach `node sparen.js` – die letzte Zeile lautet `Ziel erreicht nach 7 Monaten: 1050 €`.
  - id: summe-und-suche
    type: code
    language: js
    title: Zählen, sammeln, suchen
    description: |
      Die Funktionsrahmen sind vorbereitet: Eingaben kommen über die Parameter, das Ergebnis gibst du mit `return` zurück.

      1. `summeBis(n)` addiert mit einer `for`-Schleife alle ganzen Zahlen von 1 bis `n`. `summeBis(4)` ist `10`, `summeBis(0)` ist `0`.
      2. `summeGueltiger(werte)` addiert mit `for...of` alle Zahlen eines Arrays, überspringt aber negative Zahlen mit `continue`.
      3. `ersteLangeStadt(staedte)` gibt die erste Stadt mit **mehr als 6 Zeichen** zurück – oder `null`, wenn es keine gibt.
    starter: |
      function summeBis(n) {
        let summe = 0;
        return summe;
      }

      function summeGueltiger(werte) {
        let summe = 0;
        return summe;
      }

      function ersteLangeStadt(staedte) {
        return null;
      }
    tests:
      - name: summeBis(4) ist 10, summeBis(100) ist 5050
        code: assertTrue(summeBis(4) === 10 && summeBis(100) === 5050)
      - name: summeBis(0) ist 0
        code: assertEqual(summeBis(0), 0)
      - name: Summe ohne negative Werte
        code: assertEqual(summeGueltiger([4, -2, 5, -1, 3]), 12)
      - name: findet die erste lange Stadt
        code: assertEqual(ersteLangeStadt(["Bonn", "Hamburg", "Augsburg"]), "Hamburg")
      - name: keine lange Stadt oder leere Liste liefert null
        code: assertTrue(ersteLangeStadt(["Ulm", "Kiel"]) === null && ersteLangeStadt([]) === null)
    hints:
      - "Summe: `for (let i = 1; i <= n; i++) { summe += i; }`"
      - "`if (wert < 0) continue;` überspringt negative Zahlen."
      - "`return` in einer Schleife beendet sofort die ganze Funktion – praktisch, wenn du etwas gefunden hast."
    solution: |
      function summeBis(n) {
        let summe = 0;
        for (let i = 1; i <= n; i++) {
          summe += i;
        }
        return summe;
      }

      function summeGueltiger(werte) {
        let summe = 0;
        for (const wert of werte) {
          if (wert < 0) continue;
          summe += wert;
        }
        return summe;
      }

      function ersteLangeStadt(staedte) {
        for (const stadt of staedte) {
          if (stadt.length > 6) {
            return stadt;
          }
        }
        return null;
      }
---

Stell dir vor, du sollst die Zahlen von 1 bis 100 ausgeben. Hundert Zeilen `console.log` tippen? Und wenn es
morgen 1000 sein sollen? Computer sind genau für solche Wiederholungen gemacht. Eine [[schleife|Schleife]]
führt denselben Code immer wieder aus – so oft, wie du es brauchst.

## Die for-Schleife

```js run
for (let i = 1; i <= 3; i++) {
  console.log(`Runde ${i}`);
}
```

| Teil | Beispiel | Aufgabe |
|---|---|---|
| Start | `let i = 1` | legt die Zählvariable an – **einmal** |
| Bedingung | `i <= 3` | wird **vor jedem** Durchlauf geprüft; bei `false` ist Schluss |
| Schritt | `i++` | wird **nach jedem** Durchlauf ausgeführt |

Jeder einzelne Durchlauf heißt [[iteration|Iteration]].

![Ablauf einer for-Schleife: Start, Bedingung, Schleifenkörper, Schritt](/assets/programmieren-grundlagen/m3-for-schleife.svg)

> [!MERKSATZ]
> Start einmal – dann immer: Bedingung prüfen → Körper ausführen → Schritt. Ist die Bedingung falsch, geht es
> hinter der Schleife weiter.

Ergebnisse sammelst du in einer Variablen, die **vor** der Schleife angelegt wird:

```js run
let summe = 0;
for (let i = 1; i <= 100; i++) {
  summe += i;
}
console.log(summe);   // 5050
```

## Die while-Schleife

Wenn du vorher nicht weißt, wie oft wiederholt wird, sondern nur, **wann Schluss ist**, passt `while`:

```js run
let kontostand = 0;
let monate = 0;
while (kontostand < 500) {
  kontostand += 120;
  monate++;
}
console.log(`${monate} Monate, ${kontostand} €`);   // 5 Monate, 600 €
```

Irgendetwas im Körper muss die Bedingung irgendwann falsch machen. Sonst entsteht eine
[[endlosschleife|Endlosschleife]]: Der Browser-Tab friert ein, im Terminal rauscht die Ausgabe endlos durch.
Mit **Strg+C** brichst du ein Programm im Terminal ab. Die Variante `do { … } while (…)` prüft erst am Ende und
läuft deshalb mindestens einmal.

> [!FEHLER]
> Die Zählvariable in der falschen Richtung oder gar nicht verändern. Frag dich bei jeder while-Schleife:
> Welche Zeile bringt mich der Abbruchbedingung näher?

## for...of, break und continue

Willst du einfach jedes Element eines Arrays anfassen, ist `for...of` am bequemsten – ohne Index, ohne Bedingung:

```js run
const preise = [12, -5, 30, 0, 8];
let summe = 0;
for (const preis of preise) {
  if (preis <= 0) continue;   // diesen Durchlauf überspringen
  if (preis > 25) break;      // ganze Schleife beenden
  summe += preis;
}
console.log(summe);   // 12
```

`continue` beendet nur den aktuellen Durchlauf, `break` die ganze Schleife. In einer Funktion beendet `return`
sogar die Funktion. PHP schreibt `foreach ($preise as $preis) { … }` – erst das Array, dann die Variable.

| Schleife | Wann |
|---|---|
| `for (let i = 0; …)` | Zählen oder wenn du den Index brauchst |
| `while` | Anzahl unbekannt, „bis ein Zustand erreicht ist" |
| `for...of` | Jedes Element, Index egal |

## Off-by-one und verschachtelte Schleifen

Der Klassiker unter den Schleifenfehlern ist der [[off-by-one-fehler|Off-by-one-Fehler]]: Die Schleife läuft
einmal zu oft oder zu selten. Weil Indizes bei 0 beginnen, ist der letzte gültige Index `length - 1`:

```js
for (let i = 0; i < farben.length; i++)    // richtig: <
for (let i = 0; i <= farben.length; i++)   // falsch: liest farben[3] → undefined
```

Steht eine Schleife in einer anderen, spricht man von einer [[verschachtelte-schleife|verschachtelten Schleife]].
Die innere läuft für jeden Durchlauf der äußeren komplett durch – so entsteht etwa das Einmaleins:

```js run
for (let zeile = 1; zeile <= 3; zeile++) {
  let text = "";
  for (let spalte = 1; spalte <= 3; spalte++) {
    text += `${zeile * spalte}\t`;
  }
  console.log(text);
}
```

> [!PRAXIS]
> Wenn eine Schleife nicht tut, was sie soll, zeichnen Profis eine Ablauftabelle: Zeile für Zeile, welchen Wert
> hat `i`, ist die Bedingung wahr, was passiert? Prüfe dabei immer den ersten und den letzten Durchlauf.

## Zusammenfassung

- Eine **Schleife** wiederholt Code; jeder Durchlauf ist eine **Iteration**.
- `for (start; bedingung; schritt)` zum Zählen, `while` bis ein Zustand erreicht ist, `for...of` für jedes Element.
- Ohne Veränderung im Körper droht eine **Endlosschleife** – Strg+C bricht ab.
- `break` beendet die Schleife, `continue` überspringt einen Durchlauf.
- Achte auf **Off-by-one**: Der letzte Index ist `length - 1`, also `i < length`.
