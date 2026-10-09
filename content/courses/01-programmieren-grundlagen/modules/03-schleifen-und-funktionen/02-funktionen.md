---
title: Funktionen
summary: Code einen Namen geben und wiederverwenden – mit Parametern, Rückgabewerten, Gültigkeitsbereichen und reinen Funktionen ohne Seiteneffekte.
duration: 25
sources:
  - title: MDN – Funktionen (Leitfaden)
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions
  - title: MDN – Scope (Glossar)
    url: https://developer.mozilla.org/en-US/docs/Glossary/Scope
  - title: MDN – Closures
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures
  - title: PHP-Handbuch – Funktionen
    url: https://www.php.net/manual/de/functions.user-defined.php
quiz:
  - type: single
    question: "Was gibt `console.log(verdoppeln(4));` aus, wenn `function verdoppeln(x) { console.log(x * 2); }` definiert ist?"
    options: ["8 und danach undefined", "8", "undefined", "Einen Fehler"]
    answer: 0
    explanation: >
      Die Funktion gibt 8 selbst aus, liefert aber nichts mit return zurück. Der Rückgabewert ist deshalb undefined,
      und das äußere console.log gibt ihn aus.
  - type: match
    question: Ordne die Begriffe zu – am Beispiel `function gruesse(name) { return "Hallo " + name; }` und dem Aufruf `gruesse("Ada")`.
    pairs:
      - { left: "name", right: "Parameter" }
      - { left: "\"Ada\"", right: "Argument" }
      - { left: "\"Hallo Ada\"", right: "Rückgabewert" }
      - { left: "gruesse(\"Ada\")", right: "Funktionsaufruf" }
    explanation: Parameter sind die Platzhalter in der Definition, Argumente die echten Werte beim Aufruf, und return liefert den Rückgabewert.
  - type: find-bug
    question: Dieses Programm bricht mit `ReferenceError` ab. In welcher Zeile?
    language: js
    code: |
      function berechne(a, b) {
        const summe = a + b;
        return summe * 2;
      }
      const ergebnis = berechne(2, 3);
      console.log(summe);
    bug_line: 6
    explanation: summe existiert nur innerhalb der Funktion (ihr Gültigkeitsbereich). Draußen kennst du nur den Rückgabewert, also ergebnis.
  - type: multiple
    question: Welche Eigenschaften hat eine reine Funktion?
    options:
      - Gleiche Eingaben liefern immer das gleiche Ergebnis.
      - Sie verändert keine Variablen außerhalb.
      - Sie gibt immer etwas mit console.log aus.
      - Sie lässt sich leicht testen.
    answers: [0, 1, 3]
    explanation: Eine Ausgabe mit console.log wäre ein Seiteneffekt. Reine Funktionen hängen nur von ihren Parametern ab.
tasks:
  - id: rein-oder-nicht
    type: dragdrop
    title: Rein oder mit Seiteneffekt?
    description: Ordne jede Funktion zu. Hat sie eine Wirkung über ihren Rückgabewert hinaus?
    targets:
      - { id: rein, label: Reine Funktion }
      - { id: effekt, label: Hat Seiteneffekte }
    items:
      - { label: "function brutto(netto) { return netto * 1.19; }", target: rein }
      - { label: "function istGerade(n) { return n % 2 === 0; }", target: rein }
      - { label: "function begruessen(name) { console.log(\"Hallo \" + name); }", target: effekt }
      - { label: "function hinzufuegen(liste, x) { liste.push(x); }", target: effekt }
      - { label: "function erhoehen() { zaehler++; }", target: effekt }
      - { label: "function laenger(a, b) { return a.length > b.length ? a : b; }", target: rein }
    hints:
      - Ausgaben, veränderte Arrays und veränderte äußere Variablen sind Seiteneffekte.
  - id: eigene-funktionen
    type: code
    language: js
    title: Deine ersten eigenen Funktionen
    description: |
      Schreibe drei **reine** Funktionen – sie geben ihr Ergebnis mit `return` zurück und geben nichts aus:

      1. `rechteckFlaeche(breite, hoehe)` liefert die Fläche.
      2. `gruss(name, tageszeit = "Tag")` liefert `"Guten Tag, Ada!"` – mit dem Standardparameter `"Tag"`, wenn keine Tageszeit übergeben wird.
      3. `mwst(netto, satz = 0.19)` liefert den Steuerbetrag, kaufmännisch auf ganze Cent gerundet. `mwst(100)` ist `19`, `mwst(9.99)` ist `1.9` (gerundet aus 1.8981).
    starter: |
      function rechteckFlaeche(breite, hoehe) {
      }

      function gruss(name, tageszeit) {
      }

      function mwst(netto, satz) {
      }
    tests:
      - name: rechteckFlaeche(3, 4) ist 12, mit 0 ist es 0
        code: assertTrue(rechteckFlaeche(3, 4) === 12 && rechteckFlaeche(0, 5) === 0)
      - name: gruss mit Tageszeit
        code: assertEqual(gruss("Ada", "Morgen"), "Guten Morgen, Ada!")
      - name: gruss ohne Tageszeit nutzt den Standardwert
        code: assertEqual(gruss("Ada"), "Guten Tag, Ada!")
      - name: mwst mit Standardsatz
        code: assertTrue(mwst(100) === 19 && mwst(9.99) === 1.9)
      - name: mwst mit eigenem Satz
        code: assertEqual(mwst(50, 0.07), 3.5)
    hints:
      - "Standardparameter: `function gruss(name, tageszeit = \"Tag\")`"
      - "Auf Cent runden: `Math.round(netto * satz * 100) / 100`"
    solution: |
      function rechteckFlaeche(breite, hoehe) {
        return breite * hoehe;
      }

      function gruss(name, tageszeit = "Tag") {
        return `Guten ${tageszeit}, ${name}!`;
      }

      function mwst(netto, satz = 0.19) {
        return Math.round(netto * satz * 100) / 100;
      }
  - id: php-funktion
    type: code
    language: php
    title: Eine Funktion mit Typen in PHP
    description: |
      In PHP schreibst du zu Parametern und Rückgabewert meist den Typ dazu. Ergänze `durchschnitt()`:
      Sie bekommt ein Array von Zahlen und gibt den Durchschnitt als `float` zurück. Für ein leeres Array gibt sie
      `0.0` zurück (sonst würdest du durch 0 teilen).

      Hilfreich: `array_sum($zahlen)` liefert die Summe, `count($zahlen)` die Anzahl.
    starter: |
      <?php
      function durchschnitt(array $zahlen): float
      {
          return 0.0;
      }
    tests:
      - name: Durchschnitt von 2, 4, 6 ist 4.0
        code: assert_same(4.0, durchschnitt([2, 4, 6]));
      - name: Durchschnitt mit Kommaergebnis
        code: assert_same(2.5, durchschnitt([1, 4]));
      - name: leeres Array liefert 0.0
        code: assert_same(0.0, durchschnitt([]));
    hints:
      - Prüfe zuerst mit `if (count($zahlen) === 0)` den Randfall und gib früh zurück.
      - "`return array_sum($zahlen) / count($zahlen);` – PHP wandelt das Ergebnis wegen `: float` in eine Kommazahl um."
    solution: |
      <?php
      function durchschnitt(array $zahlen): float
      {
          if (count($zahlen) === 0) {
              return 0.0;
          }
          return array_sum($zahlen) / count($zahlen);
      }
---

Du hast in den letzten Aufgaben schon vorbereitete Rahmen wie `function eintrittspreis(alter) { … }` ausgefüllt.
Jetzt lernst du, was dahintersteckt. Eine [[funktion|Funktion]] ist wie ein Küchengerät: Du steckst Zutaten
hinein, sie erledigt eine feste Aufgabe und gibt dir ein Ergebnis zurück. Einmal gebaut, benutzt du sie, so oft
du willst.

## Definieren und aufrufen

```js run
function flaeche(breite, hoehe) {
  return breite * hoehe;
}

console.log(flaeche(3, 4));    // 12
console.log(flaeche(10, 2));   // 20
```

| Begriff | Im Beispiel | Bedeutung |
|---|---|---|
| Definition | `function flaeche(…) { … }` | beschreibt, was die Funktion tut |
| Parameter | `breite`, `hoehe` | Platzhalter für die Eingaben |
| Aufruf | `flaeche(3, 4)` | führt die Funktion aus |
| Argument | `3`, `4` | die echten Werte beim Aufruf |
| Rückgabewert | `12` | das Ergebnis von `return` |

Die Eingaben heißen in der Definition [[parameter|Parameter]], beim Aufruf [[argument|Argumente]]; was `return`
liefert, ist der [[rueckgabewert|Rückgabewert]]. Mit `=` gibst du Parametern Standardwerte: `function gruss(name = "Gast")`. Fehlt ein Argument ohne Standardwert,
ist der Parameter `undefined`.

## return ist nicht console.log

`return` beendet die Funktion sofort und **gibt** einen Wert an die aufrufende Stelle **zurück**. Damit kann der
Aufrufer weiterarbeiten. `console.log` zeigt nur etwas an – der Wert ist danach verloren.

```js run
function mitReturn(x) { return x * 2; }
function mitLog(x) { console.log(x * 2); }

const a = mitReturn(5);   // a ist 10
const b = mitLog(5);      // gibt 10 aus, aber b ist undefined
console.log(a + 1, b);
```

> [!FEHLER]
> Ergebnisse in einer Funktion nur mit `console.log` ausgeben statt sie zurückzugeben. Dann kann niemand mit dem
> Ergebnis weiterrechnen – und Tests können es nicht prüfen.

## Gültigkeitsbereich: wer sieht welche Variable?

Jede Variable hat einen [[gueltigkeitsbereich|Gültigkeitsbereich]] (*Scope*). Was in einer Funktion oder einem
Block `{ }` mit `let`/`const` angelegt wird, existiert nur dort. Innen sieht man nach außen, aber nicht umgekehrt:

```js run
const mwstSatz = 0.19;            // global: überall sichtbar
function brutto(netto) {
  const steuer = netto * mwstSatz; // lokal: nur in brutto sichtbar
  return netto + steuer;
}
console.log(brutto(100));          // 119
// console.log(steuer);            // ReferenceError: steuer is not defined
```

Eine Funktion, die in einer anderen entsteht, merkt sich deren Variablen sogar dauerhaft. So etwas heißt
[[closure|Closure]] – ein Werkzeug, dem du später öfter begegnest.

> [!MERKSATZ]
> Daten gehen über **Parameter** in eine Funktion hinein und über **return** wieder heraus. Lokale Variablen
> bleiben drinnen.

## Reine Funktionen

Alles, was eine Funktion außer ihrem Rückgabewert bewirkt, ist ein [[seiteneffekt|Seiteneffekt]]: etwas
ausgeben, eine äußere Variable oder ein übergebenes Array ändern, eine Datei speichern. Eine
[[reine-funktion|reine Funktion]] hat keine Seiteneffekte und liefert für gleiche Eingaben immer dasselbe Ergebnis.

| Rein | Mit Seiteneffekt |
|---|---|
| `function brutto(n) { return n * 1.19; }` | `function log(n) { console.log(n); }` |
| leicht zu testen und wiederzuverwenden | hängt vom Zustand der Welt ab |

Programme brauchen Seiteneffekte – sonst sieht man ja nichts. Gute Programme halten sie aber an wenigen, klaren
Stellen und rechnen den Rest in kleinen, reinen Funktionen mit sprechenden Namen wie `berechneVersand`.

## Funktionen in PHP

```php
<?php
function brutto(float $netto, float $satz = 0.19): float
{
    return $netto * (1 + $satz);
}
echo brutto(100), "\n";   // 119
```

PHP sieht fast gleich aus. Zusätzlich schreibst du Typen zu Parametern und Rückgabewert (`float`, `int`,
`string`, `array`). Übergibt jemand einen falschen Typ, meldet PHP einen Fehler – das fängt viele Bugs früh ab.

> [!PRAXIS]
> In Code-Reviews hört man oft „Die Funktion macht zu viel". Faustregel: Eine Funktion erledigt **eine** Aufgabe
> und passt auf einen Bildschirm. Lässt sich ihr Zweck nicht in einem kurzen Namen ausdrücken, zerlege sie.

## Zusammenfassung

- Eine **Funktion** bündelt Code unter einem Namen; Aufrufe führen ihn aus.
- **Parameter** sind Platzhalter, **Argumente** die echten Werte; Standardwerte mit `=`.
- `return` liefert den **Rückgabewert** und beendet die Funktion; ohne `return` kommt `undefined` zurück.
- Lokale Variablen gelten nur in ihrem **Gültigkeitsbereich**.
- **Reine Funktionen** haben keine Seiteneffekte und sind leicht zu testen.
- PHP-Funktionen sehen ähnlich aus und haben meist Typangaben.
