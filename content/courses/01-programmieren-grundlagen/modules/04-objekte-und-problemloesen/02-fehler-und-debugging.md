---
title: Fehler finden und abfangen
summary: Fehlermeldungen und Stack Traces lesen, systematisch debuggen und Fehler mit throw und try/catch kontrolliert behandeln.
duration: 25
sources:
  - title: MDN – Fehlertypen (Error)
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
  - title: MDN – try...catch
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch
  - title: Node.js – Debugging
    url: https://nodejs.org/en/learn/getting-started/debugging
  - title: PHP-Handbuch – Die Klasse Exception
    url: https://www.php.net/manual/de/class.exception.php
quiz:
  - type: match
    question: Welche Fehlerart passt?
    pairs:
      - { left: "console.log(\"Hallo\";", right: "SyntaxError – das Programm startet gar nicht" }
      - { left: "console.log(preiss); // Tippfehler", right: "ReferenceError – unbekannter Name" }
      - { left: "const u = null; u.name;", right: "TypeError – Zugriff auf null" }
      - { left: "const schnitt = a + b / 2;", right: "Logischer Fehler – falsches Ergebnis ohne Meldung" }
    explanation: Syntaxfehler verhindern den Start, Laufzeitfehler brechen beim Erreichen der Zeile ab, logische Fehler melden sich gar nicht.
  - type: single
    question: "In einem Stack Trace steht `at nettoSumme (/workspace/app/rechnung.js:4:16)`. Was bedeutet `4:16`?"
    options: ["Zeile 4, Spalte 16", "4 Fehler in 16 Dateien", "Fehler um 4:16 Uhr"]
    answer: 0
    explanation: Datei, Zeile und Spalte zeigen genau, wo der Fehler aufgetreten ist.
  - type: multiple
    question: Welche Vorgehensweisen sind gutes Debugging?
    options:
      - Eine Vermutung aufstellen und gezielt mit console.log prüfen.
      - Zufällig Zeilen ändern, bis es funktioniert.
      - Den Code einer Gummiente Zeile für Zeile erklären.
      - Den Fehler auf ein möglichst kleines Beispiel eingrenzen.
    answers: [0, 2, 3]
    explanation: Debugging ist methodisch – Hypothese, Test, Beobachtung. Herumprobieren erzeugt oft neue Fehler.
  - type: find-bug
    question: Der Fehler wird zwar abgefangen, aber niemand erfährt davon – und das Programm rechnet mit falschen Daten weiter. Welche Zeile ist das Problem?
    language: js
    code: |
      try {
        const daten = JSON.parse(text);
        verarbeite(daten);
      } catch (error) {
      }
    bug_line: 4
    explanation: Ein leerer catch-Block verschluckt den Fehler. Mindestens eine Meldung ausgeben oder sinnvoll reagieren – oder den Fehler gar nicht erst abfangen.
tasks:
  - id: fehlermeldung-lesen
    type: terminal
    title: Lies die Fehlermeldung und repariere das Programm
    description: |
      Im Ordner `kassenbon` liegt `bon.js`. Es soll einen kleinen Kassenbon ausgeben, bricht aber mit einem Fehler ab.

      Klicke zuerst auf **Aufgabe vorbereiten**.

      1. Wechsle in den Ordner (`cd kassenbon`) und starte `node bon.js`.
      2. Lies die Fehlermeldung genau: Welcher Fehlertyp? Welche Zeile? Welcher Name ist unbekannt?
      3. Öffne die Datei mit `nano bon.js` und behebe **nur** die Ursache. Du kannst dir die Zeilennummer mit `cat -n bon.js` anzeigen lassen.
      4. Starte erneut. Die Ausgabe soll genau so aussehen:
         ```text
         Brot: 2.49 €
         Milch: 1.19 €
         Summe: 3.68 €
         ```
    workdir: kassenbon
    setup: |
      cat > bon.js <<'EOF'
      const posten = [
        { name: "Brot", preis: 2.49 },
        { name: "Milch", preis: 1.19 },
      ];

      function zeile(name, preis) {
        return `${name}: ${preis.toFixed(2)} €`;
      }

      let summe = 0;
      for (const p of posten) {
        console.log(zeile(p.name, p.preis));
        summe += p.preis;
      }
      console.log(zeile("Summe", sume));
      EOF
    checks:
      - type: command
        run: node bon.js
        message: bon.js bricht noch mit einem Fehler ab. Lies die Meldung – welcher Name ist nicht definiert?
      - type: command
        run: node bon.js
        stdout_equals: "Brot: 2.49 €\nMilch: 1.19 €\nSumme: 3.68 €"
        message: 'Die Ausgabe stimmt noch nicht. Es sollen genau drei Zeilen erscheinen – zuletzt „Summe: 3.68 €".'
      - type: file_contains
        path: bon.js
        pattern: "zeile\\(\"Summe\",\\s*summe\\)"
        message: Repariere die Ursache in der letzten Zeile, statt die Summe als feste Zahl hineinzuschreiben.
    hints:
      - "Node meldet `ReferenceError: sume is not defined` und zeigt auf die letzte Zeile."
      - Die Variable heißt `summe` – mit zwei m.
    solution: |
      Die Meldung `ReferenceError: sume is not defined` zeigt auf die letzte Zeile – ein Tippfehler. Richtig ist:
      ```js
      console.log(zeile("Summe", summe));
      ```
  - id: menge-pruefen
    type: code
    language: js
    title: Ungültige Eingaben mit Exceptions melden
    description: |
      1. `mengeLesen(text)` wandelt einen Text in eine ganze Zahl um. Ist das Ergebnis keine ganze Zahl oder kleiner als 1, wirf eine Exception: `throw new Error("Ungültige Menge: " + text)`. Prüfe mit `Number.isInteger(zahl)`.
      2. `mengeOderEins(text)` ruft `mengeLesen` in einem `try`-Block auf. Tritt ein Fehler auf, fängt sie ihn mit `catch` ab und gibt stattdessen `1` zurück.
    starter: |
      function mengeLesen(text) {
        return Number(text);
      }

      function mengeOderEins(text) {
        return mengeLesen(text);
      }
    tests:
      - name: gültige Menge wird gelesen
        code: assertEqual(mengeLesen("3"), 3)
      - name: Text, Kommazahl und 0 werfen eine Exception
        code: assertThrows(() => mengeLesen("drei")); assertThrows(() => mengeLesen("2.5")); assertThrows(() => mengeLesen("0"))
      - name: die Fehlermeldung nennt die Eingabe
        code: 'try { mengeLesen("abc"); assertTrue(false, "Es wurde keine Exception geworfen."); } catch (e) { assertEqual(e.message, "Ungültige Menge: abc"); }'
      - name: mengeOderEins fängt Fehler ab
        code: assertTrue(mengeOderEins("4") === 4 && mengeOderEins("") === 1 && mengeOderEins("-2") === 1)
    hints:
      - "`if (!Number.isInteger(zahl) || zahl < 1) { throw new Error(\"Ungültige Menge: \" + text); }`"
      - "`try { return mengeLesen(text); } catch (error) { return 1; }`"
    solution: |
      function mengeLesen(text) {
        const zahl = Number(text);
        if (!Number.isInteger(zahl) || zahl < 1) {
          throw new Error("Ungültige Menge: " + text);
        }
        return zahl;
      }

      function mengeOderEins(text) {
        try {
          return mengeLesen(text);
        } catch (error) {
          return 1;
        }
      }
---

Dein Programm stürzt ab, und das Terminal ist voller roter Zeilen. Viele Anfänger:innen erschrecken und
schließen das Fenster. Profis lesen die Meldung – denn sie verrät fast immer, **was** passiert ist und **wo**.
Fehler sind beim Programmieren völlig normal. Entscheidend ist, wie du mit ihnen umgehst.

## Drei Arten von Fehlern

| Art | Wann | Beispiel |
|---|---|---|
| Syntaxfehler | vor dem Start – das Programm läuft gar nicht | fehlende Klammer |
| Laufzeitfehler | während des Laufs, beim Erreichen der Zeile | `ReferenceError`, `TypeError` |
| Logischer Fehler | nie – das Ergebnis ist einfach falsch | `a + b / 2` statt `(a + b) / 2` |

[[laufzeitfehler|Laufzeitfehler]] fallen erst beim Ausführen auf, [[logischer-fehler|logische Fehler]] gar nicht von
selbst. Die häufigsten Laufzeitfehler in JavaScript: Ein `ReferenceError` meldet einen unbekannten Namen (oft ein
Tippfehler). Ein `TypeError` entsteht, wenn du etwas mit einem Wert tust, das nicht geht – etwa auf eine
Eigenschaft von `null` zugreifen. Ein Fehler im Programm heißt umgangssprachlich [[bug|Bug]].

## Eine Fehlermeldung lesen

So sieht eine echte [[fehlermeldung|Fehlermeldung]] von Node.js aus (gekürzt):

```text
/workspace/programmieren/fehlerdemo/rechnung.js:4
    summe += p.preis * p.menge;
               ^

TypeError: Cannot read properties of null (reading 'preis')
    at nettoSumme (/workspace/programmieren/fehlerdemo/rechnung.js:4:16)
    at drucke (/workspace/programmieren/fehlerdemo/rechnung.js:10:17)
    at Object.<anonymous> (/workspace/programmieren/fehlerdemo/rechnung.js:14:1)
    at Module._compile (node:internal/modules/cjs/loader:1929:14)
```

1. **Ort und Codezeile** oben: Datei und Zeile 4, das `^` zeigt auf die Stelle.
2. **Typ und Nachricht**: `TypeError` – du hast `preis` von `null` lesen wollen.
3. Der [[stack-trace|Stack Trace]] darunter: welche Funktion lief (`nettoSumme`, Zeile 4, Spalte 16) und wer sie
   aufgerufen hat (`drucke` in Zeile 10, diese wiederum aus Zeile 14). Zeilen mit `node:internal` gehören zu
   Node.js selbst – suche die erste Zeile mit **deiner** Datei.

Das Array enthielt also ein `null` statt eines Postens. PHP meldet Fehler ähnlich: `Fatal error: Uncaught
ArgumentCountError: strlen() expects exactly 1 argument, 0 given in a.php:3`, darunter ebenfalls ein Stack trace.

> [!MERKSATZ]
> Lies jede Fehlermeldung vollständig: Typ, Nachricht, Datei, Zeile. Meist steht die Lösung schon darin.

## Systematisch debuggen

[[debugging|Debugging]] heißt, einen Fehler methodisch einzugrenzen – nicht herumzuprobieren:

| Strategie | So geht's |
|---|---|
| Hypothese prüfen | „Ich vermute, `summe` ist schon falsch, bevor sie ausgegeben wird." – dann gezielt prüfen |
| `console.log` mit Label | `console.log("summe nach Schleife:", summe)` statt nur `console.log(summe)` |
| Halbieren | Prüfe in der Mitte des Ablaufs, ob die Werte noch stimmen – so halbierst du den Suchraum |
| Kleinstes Beispiel | Fehler mit möglichst wenig Code und Daten nachstellen |
| Rubber Duck | Code Zeile für Zeile laut erklären – oft fällt der Fehler dabei selbst auf |
| Debugger | Programm an einem Breakpoint anhalten und Variablen ansehen |

Beim [[rubber-duck-debugging|Rubber-Duck-Debugging]] hört dir notfalls eine Gummiente zu – das Erklären ist
der eigentliche Trick. Ein [[debugger|Debugger]] hält das Programm an einem [[breakpoint|Breakpoint]] an und
zeigt dir alle Variablen. Er steckt in den Entwicklerwerkzeugen jedes Browsers; mit `node inspect datei.js` oder der Anweisung
`debugger;` hältst du auch Node.js-Programme an und gehst Schritt für Schritt weiter.

> [!FEHLER]
> Fünf Dinge gleichzeitig ändern und hoffen. Ändere immer nur eine Sache und prüfe danach – sonst weißt du nicht,
> welche Änderung geholfen oder einen neuen Fehler erzeugt hat.

## Fehler werfen und abfangen

Manchmal soll dein Code selbst einen Fehler melden, etwa bei einer ungültigen Eingabe. Dafür wirfst du mit
`throw` eine [[exception|Exception]]. Mit [[try-catch|try/catch]] fängst du sie an einer passenden Stelle ab:

```js run
function teile(a, b) {
  if (b === 0) {
    throw new Error("Division durch 0 ist nicht erlaubt");
  }
  return a / b;
}

try {
  console.log(teile(10, 2));
  console.log(teile(1, 0));      // wirft – die nächste Zeile läuft nicht mehr
  console.log("nie erreicht");
} catch (error) {
  console.log("Fehler:", error.message);
} finally {
  console.log("Rechnung beendet"); // läuft immer
}
```

Fange nur Fehler ab, auf die du sinnvoll reagieren kannst, und verschlucke sie nie mit einem leeren `catch`.
PHP funktioniert genauso: `throw new InvalidArgumentException("…")` und `try { … } catch (Exception $e) { … }`.

> [!PRAXIS]
> In Teams beginnt fast jeder Bug-Report mit einer Fehlermeldung oder einem Stack Trace. Wer sie souverän liest
> und den Fehler reproduzieren kann, löst die meisten Probleme in Minuten statt Stunden.

## Zusammenfassung

- **Syntaxfehler** verhindern den Start, **Laufzeitfehler** brechen ab, **logische Fehler** liefern still falsche Ergebnisse.
- Eine **Fehlermeldung** nennt Typ, Nachricht, Datei und Zeile; der **Stack Trace** zeigt die Aufrufkette.
- **Debugging** ist methodisch: Hypothese, gezieltes `console.log`, halbieren, Rubber Duck, Debugger.
- Mit `throw` meldest du Fehler, mit `try`/`catch`/`finally` fängst du sie kontrolliert ab.
- Nie Fehler stillschweigend verschlucken.
