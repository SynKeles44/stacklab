---
title: Fehlermeldungen und Stack Traces lesen
summary: Wie du eine Fehlermeldung in JavaScript und PHP zerlegst, den Stack Trace von oben nach unten liest und die Zeile findest, auf die es ankommt.
duration: 25
sources:
  - title: MDN – JavaScript error reference
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors
  - title: Node.js – Errors
    url: https://nodejs.org/api/errors.html
  - title: Node.js – Command-line options (--trace-uncaught)
    url: https://nodejs.org/api/cli.html#--trace-uncaught
  - title: PHP-Handbuch – Fehler in PHP 7 und neuer
    url: https://www.php.net/manual/de/language.errors.php7.php
quiz:
  - type: single
    question: "Node meldet `TypeError: Cannot read properties of undefined (reading 'preis')`. Was bedeutet das?"
    options:
      - Die Variable `preis` existiert nicht.
      - Du greifst auf `.preis` eines Werts zu, der `undefined` ist.
      - "`preis` hat den falschen Datentyp, zum Beispiel String statt Zahl."
      - Die Datei mit dem Namen `preis` fehlt.
    answer: 1
    explanation: >
      Die Meldung sagt: Links vom Punkt steht `undefined`. Nicht `preis` ist das Problem, sondern das Objekt davor.
      Die Frage lautet also: Warum ist es undefined?
  - type: match
    question: Ordne jedem Teil der PHP-Meldung seine Bedeutung zu.
    pairs:
      - { left: "Fatal error: Uncaught", right: "Niemand hat die Exception abgefangen, das Skript endet" }
      - { left: "DivisionByZeroError", right: "Die Fehlerklasse – welche Art von Fehler" }
      - { left: "Division by zero", right: "Die Nachricht – was genau schiefging" }
      - { left: "in /app/rechner.php:2", right: "Datei und Zeile, an der der Fehler geworfen wurde" }
    explanation: >
      Fast jede Fehlermeldung hat dieselben Bausteine: Typ, Nachricht, Ort und darunter den Stack Trace.
  - type: find-bug
    question: "Der Stack Trace zeigt `TypeError: Cannot read properties of undefined (reading 'name')` in Zeile 2. Die eigentliche Ursache liegt aber woanders. In welcher Zeile?"
    language: js
    code: |
      function begruesse(nutzer) {
        return `Hallo ${nutzer.name}`;
      }
      const nutzer = [{ name: 'Ada' }, { name: 'Linus' }];
      for (let i = 0; i <= nutzer.length; i++) {
        console.log(begruesse(nutzer[i]));
      }
    bug_line: 5
    explanation: >
      Die Schleife läuft mit `<=` einmal zu oft. Beim dritten Durchlauf ist `nutzer[2]` undefined. Der Fehler
      **knallt** in Zeile 2, **entsteht** aber in Zeile 5 – genau dafür liest du den Stack Trace weiter nach unten.
  - type: cloze
    text: In einem JavaScript-Stack-Trace steht die Stelle, an der der Fehler auftrat, ganz ___. Bei einem geworfenen String hilft die Node-Option `--trace-___`.
    blanks:
      - [oben]
      - [uncaught]
    explanation: >
      Oben steht der innerste Aufruf, darunter die Aufrufer. `node --trace-uncaught` zeigt zusätzlich, wo ein
      Wert geworfen wurde, der kein Error-Objekt ist.
tasks:
  - id: meldung-zerlegen
    type: dragdrop
    title: Eine Fehlermeldung zerlegen
    description: |
      Diese Ausgabe kommt von Node.js:

      ```text
      /app/shop/rechnung.js:8
        return eintrag.preis * eintrag.menge;
                       ^
      TypeError: Cannot read properties of undefined (reading 'preis')
          at zeilenSumme (/app/shop/rechnung.js:8:18)
          at gesamt (/app/shop/rechnung.js:14:14)
          at Object.<anonymous> (/app/shop/rechnung.js:19:23)
      ```

      Ordne jedes Stück der passenden Bedeutung zu.
    targets:
      - { id: typ, label: Fehlertyp }
      - { id: nachricht, label: Nachricht }
      - { id: ort, label: "Ort, an dem es knallt" }
      - { id: aufrufer, label: Aufrufer weiter unten im Stack }
    items:
      - { label: "TypeError", target: typ }
      - { label: "Cannot read properties of undefined (reading 'preis')", target: nachricht }
      - { label: "at zeilenSumme (rechnung.js:8:18)", target: ort }
      - { label: "at gesamt (rechnung.js:14:14)", target: aufrufer }
      - { label: "at Object.<anonymous> (rechnung.js:19:23)", target: aufrufer }
    hints:
      - Die erste `at`-Zeile ist die innerste Funktion – dort ist der Fehler aufgetreten.
  - id: stack-trace-lesen
    type: terminal
    title: Zwei Abstürze mit dem Stack Trace aufklären
    description: |
      Im Ordner `stack-trace` liegen zwei kaputte Node-Skripte:

      - `rechnung.js` soll für drei Posten `Summe: 23.50` ausgeben, stürzt aber ab.
      - `start.js` soll einen Server „starten“, bricht aber mit einer seltsam knappen Meldung ab.

      1. Führe `node rechnung.js` aus und lies den Stack Trace. Die Zeile, in der es knallt, ist nicht die
         Zeile, in der der Fehler entsteht.
      2. Behebe den Fehler in `rechnung.js`, sodass `Summe: 23.50` ausgegeben wird.
      3. Schreibe die Nummer der Zeile, die du geändert hast, in die Datei `ursache.txt`
         (z. B. `echo 7 > ursache.txt`).
      4. Führe `node start.js` aus. Hier wird kein Error-Objekt, sondern ein String geworfen. Starte das Skript
         noch einmal mit `node --trace-uncaught start.js` und schreibe den **Namen der Funktion**, die den Wert
         wirft, in `werfer.txt`. `start.js` musst du nicht reparieren.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit die Dateien angelegt werden.
    workdir: stack-trace
    setup: |
      cat > rechnung.js <<'EOF'
      const posten = [
        { name: 'Kaffee', preis: 3.5, menge: 2 },
        { name: 'Kuchen', preis: 4.25, menge: 2 },
        { name: 'Wasser', preis: 2, menge: 4 },
      ];

      function zeilenSumme(eintrag) {
        return eintrag.preis * eintrag.menge;
      }

      function gesamt(liste) {
        let summe = 0;
        for (let i = 0; i <= liste.length; i++) {
          summe += zeilenSumme(liste[i]);
        }
        return summe;
      }

      console.log(`Summe: ${gesamt(posten).toFixed(2)}`);
      EOF
      cat > start.js <<'EOF'
      const einstellungen = { host: 'localhost' };

      function ladeKonfiguration(werte) {
        if (werte.port === undefined) {
          throw 'Port fehlt';
        }
        return werte;
      }

      function starteServer() {
        const konfiguration = ladeKonfiguration(einstellungen);
        console.log(`Server läuft auf ${konfiguration.host}:${konfiguration.port}`);
      }

      setTimeout(starteServer, 10);
      EOF
    checks:
      - type: command
        run: node rechnung.js
        stdout_equals: "Summe: 23.50"
        message: "`node rechnung.js` soll ohne Fehler genau `Summe: 23.50` ausgeben. Schau dir die Schleifenbedingung an."
      - type: command
        run: cat ursache.txt
        stdout_matches: "^\\s*13\\s*$"
        message: In ursache.txt gehört die Zeilennummer der Schleife, die eine Runde zu viel dreht – nicht die Zeile, in der es knallt.
      - type: command
        run: cat werfer.txt
        stdout_matches: "^\\s*ladeKonfiguration\\s*$"
        message: In werfer.txt gehört der Name der Funktion aus der ersten Zeile unter „Thrown at“ von `node --trace-uncaught start.js`.
    hints:
      - "Der Trace zeigt zuerst `zeilenSumme` – aber wer ruft `zeilenSumme` mit `undefined` auf? Lies die zweite `at`-Zeile."
      - "Ein Array mit 3 Elementen hat die Indizes 0, 1 und 2. Welcher Index entsteht bei `i <= liste.length`?"
      - "Ändere in Zeile 13 `<=` zu `<`, dann `echo 13 > ursache.txt`. Für start.js: `node --trace-uncaught start.js`, dann `echo ladeKonfiguration > werfer.txt`."
    solution: |
      ```bash
      cd stack-trace
      node rechnung.js                 # TypeError in zeilenSumme, aufgerufen aus gesamt (Zeile 14)
      sed -i 's/i <= liste.length/i < liste.length/' rechnung.js
      node rechnung.js                 # Summe: 23.50
      echo 13 > ursache.txt
      node --trace-uncaught start.js   # Thrown at: at ladeKonfiguration (...start.js:5:5)
      echo ladeKonfiguration > werfer.txt
      ```
---
Rote Schrift im Terminal, zwanzig Zeilen Text, Pfade, die du nie gesehen hast – viele Einsteiger:innen
scrollen Fehlermeldungen einfach weg. Dabei ist eine [[fehlermeldung|Fehlermeldung]] das Beste, was dir beim
Debuggen passieren kann: Das Programm sagt dir selbst, **was** schiefging und **wo**. Du musst nur lernen,
sie zu lesen.

## Der Aufbau einer Fehlermeldung

Fast jede Fehlermeldung – egal ob JavaScript, PHP oder eine andere Sprache – hat dieselben Bausteine:

| Baustein | Frage | Beispiel |
|---|---|---|
| Typ | Welche Art Fehler? | `TypeError`, `DivisionByZeroError` |
| Nachricht | Was genau ging schief? | `Cannot read properties of undefined` |
| Ort | Datei, Zeile, Spalte | `rechnung.js:8:18` |
| Stack Trace | Wie kam das Programm dorthin? | Liste von `at …`-Zeilen |

In JavaScript und PHP sind die meisten Fehler [[exception|Exceptions]]: Objekte, die „geworfen“ werden und
das Programm abbrechen, wenn niemand sie abfängt. Deshalb steht in Meldungen oft **Uncaught** – „nicht
abgefangen“.

> [!MERKSATZ]
> Lies zuerst **Typ und Nachricht**, dann den **Ort**. Erst danach schaust du in den Code. Wer gleich in den
> Code springt, sucht oft an der falschen Stelle.

## JavaScript: typische Meldungen

Ein [[typeerror|TypeError]] heißt: Ein Wert hat nicht den Typ, den der Code erwartet.

| Meldung | Bedeutet |
|---|---|
| `Cannot read properties of undefined (reading 'x')` | Links vom `.x` steht `undefined` |
| `x is not a function` | Du rufst `x()` auf, aber `x` ist keine Funktion |
| `ReferenceError: x is not defined` | Die Variable `x` gibt es an dieser Stelle nicht |
| `SyntaxError: Unexpected token` | Der Code ist kein gültiges JavaScript, er läuft gar nicht erst los |

Wichtig bei der ersten Zeile: Nicht `x` ist kaputt, sondern das Objekt **davor**. Deine nächste Frage lautet
deshalb: Warum ist es [[undefined]]?

> [!FEHLER]
> **Nur die letzte Zeile lesen.** Node gibt über der Meldung die betroffene Codezeile mit einem `^` aus, und
> unter ihr den Stack Trace. Wer nur „TypeError“ liest und dann rät, verschenkt die halbe Information.

## Den Stack Trace lesen

Der [[stack-trace|Stack Trace]] ist die Liste der Funktionsaufrufe, die gerade aktiv waren. In JavaScript
steht der **innerste** Aufruf oben, darunter jeweils, wer ihn aufgerufen hat:

```text title="node rechnung.js"
TypeError: Cannot read properties of undefined (reading 'preis')
    at zeilenSumme (/workspace/debugging/stack-trace/rechnung.js:8:18)
    at gesamt (/workspace/debugging/stack-trace/rechnung.js:14:14)
    at Object.<anonymous> (/workspace/debugging/stack-trace/rechnung.js:19:23)
    at Module._compile (node:internal/modules/cjs/loader:1929:14)
```

So gehst du vor:

1. Suche die **erste Zeile, die auf deine eigene Datei zeigt**. Zeilen mit `node:internal` gehören zu Node selbst.
2. Dort **knallt** es: `zeilenSumme` in Zeile 8.
3. Frag dich, woher der kaputte Wert kommt, und geh eine Zeile **tiefer**: `gesamt` in Zeile 14 hat
   `zeilenSumme` mit `undefined` aufgerufen. Hier **entsteht** der Fehler oft.

## PHP: Fatal error, Warning und Stack trace

PHP zeigt nicht abgefangene Exceptions als `Fatal error` an – mit einem Stack Trace in umgekehrter
Nummerierung:

```text title="php rechner.php"
PHP Fatal error:  Uncaught DivisionByZeroError: Division by zero in /app/rechner.php:2
Stack trace:
#0 /app/rechner.php(2): intdiv(4, 0)
#1 /app/rechner.php(3): teile(4, 0)
#2 /app/rechner.php(4): rechne()
#3 {main}
  thrown in /app/rechner.php on line 2
```

`#0` ist der innerste Aufruf, `{main}` der Start des Skripts. Praktisch: PHP zeigt sogar die **Argumente** –
hier siehst du sofort, dass eine 0 übergeben wurde.

Neben dem [[fatal-error|Fatal error]] gibt es leisere Meldungen:

| Stufe | Wirkung | Beispiel |
|---|---|---|
| `Fatal error` | Skript bricht ab | Uncaught Exception, Aufruf einer unbekannten Funktion |
| `Warning` | Skript läuft weiter, Ergebnis ist oft falsch | `Undefined array key "note"` |
| `Deprecated` | Funktioniert noch, fällt in einer späteren Version weg | Veraltete Funktionsaufrufe |

Gerade Warnings werden gern übersehen – dabei erklären sie viele „rätselhaft falsche“ Ergebnisse.

## Wenn die Meldung zu knapp ist

Manchmal wird in JavaScript kein Error-Objekt geworfen, sondern ein String: `throw 'Port fehlt'`. Dann gibt es
keinen Stack Trace, und Node zeigt nur die Zeile mit dem `throw`. Für solche Fälle gibt es eine Option:

```bash title="Terminal"
node --trace-uncaught start.js
```

Node ergänzt dann unter `Thrown at:` die Aufrufkette zum Zeitpunkt des Werfens. Für PHP gibt es mit
[[xdebug|Xdebug]] eine ähnliche Hilfe: `php -d xdebug.mode=develop skript.php` zeigt zu jeder Meldung einen
ausführlichen Call Stack mit allen Argumenten. Beides lernst du später im Kurs genauer kennen.

> [!PRAXIS]
> Kopiere die **Nachricht** einer unbekannten Meldung – ohne deine Pfade und Variablennamen – in die
> Suchmaschine oder die offizielle Doku. Fast jede Meldung hatte schon jemand vor dir. Wenn du im Team um
> Hilfe bittest, schick immer die **vollständige** Meldung samt Stack Trace als Text mit, nie nur „geht nicht“.

## Zusammenfassung

- Eine Fehlermeldung besteht aus Typ, Nachricht, Ort und Stack Trace.
- „Uncaught“ heißt: Niemand hat die Exception abgefangen, das Programm endet.
- `Cannot read properties of undefined` meint das Objekt **vor** dem Punkt.
- Im JS-Stack-Trace steht der innerste Aufruf oben; suche die erste Zeile mit deiner eigenen Datei.
- Wo es knallt, ist nicht immer, wo der Fehler entsteht – lies die Aufrufer darunter.
- PHP unterscheidet Fatal error, Warning und Deprecated; Warnings erklären oft falsche Ergebnisse.
- `node --trace-uncaught` und `php -d xdebug.mode=develop` liefern mehr Details.
