---
title: Vom Problem zum Programm
summary: Wie Programmierer:innen denken – Probleme mit dem EVA-Prinzip verstehen, zerlegen, als Algorithmus in Pseudocode planen, Randfälle sammeln und Schritt für Schritt umsetzen.
duration: 25
sources:
  - title: MDN – A first splash into JavaScript (Thinking like a programmer)
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/A_first_splash
  - title: MDN – Glossar Algorithmus
    url: https://developer.mozilla.org/en-US/docs/Glossary/Algorithm
quiz:
  - type: multiple
    question: Welche Eigenschaften muss ein Algorithmus haben?
    options:
      - Jeder Schritt ist eindeutig.
      - Er endet nach endlich vielen Schritten.
      - Er muss in JavaScript geschrieben sein.
      - Er funktioniert für alle passenden Eingaben, nicht nur für ein Beispiel.
    answers: [0, 1, 3]
    explanation: Ein Algorithmus ist eine eindeutige, endliche und allgemeine Schrittfolge. Die Sprache ist egal – Deutsch, Pseudocode oder JavaScript.
  - type: match
    question: "Ordne bei einem Programm, das aus Preis und Menge den Gesamtpreis berechnet, die Teile dem EVA-Prinzip zu."
    pairs:
      - { left: "Eingabe", right: "Preis 2,50 € und Menge 4" }
      - { left: "Verarbeitung", right: "Preis mal Menge rechnen" }
      - { left: "Ausgabe", right: "Anzeige: Gesamt 10,00 €" }
    explanation: Eingabe = die Daten, die hereinkommen. Verarbeitung = die Regeln. Ausgabe = das Ergebnis.
  - type: cloze
    text: Ein großes Problem in kleine Teilprobleme zu zerlegen nennt man ___. Eine codeähnliche Beschreibung in Umgangssprache heißt ___.
    blanks:
      - [Dekomposition, Zerlegung, Problemzerlegung]
      - [Pseudocode]
    explanation: Dekomposition macht Probleme beherrschbar; Pseudocode hält die Lösung fest, bevor du programmierst.
  - type: single
    question: Eine Funktion soll in einer Liste mit 1000 Namen prüfen, ob „Ada" vorkommt. Wie oft vergleicht eine lineare Suche im schlimmsten Fall?
    options: ["1-mal", "10-mal", "1000-mal"]
    answer: 2
    explanation: Steht „Ada" ganz hinten oder gar nicht in der Liste, muss die lineare Suche jedes Element einmal ansehen.
tasks:
  - id: eva-beschriften
    type: diagram
    title: Beschrifte das EVA-Prinzip
    description: Jedes Programm nimmt etwas entgegen, verarbeitet es und gibt ein Ergebnis zurück. Beschrifte die drei Kästen.
    image: /assets/programmieren-grundlagen/m4-eva-leer.svg
    slots:
      - { x: 17, y: 37, answer: Eingabe }
      - { x: 50, y: 37, answer: Verarbeitung }
      - { x: 83, y: 37, answer: Ausgabe }
    distractors: [Compiler, Speicher]
    hints:
      - Links stehen die Daten, die ins Programm hineinkommen.
  - id: maximum-pseudocode
    type: order
    title: Pseudocode für „größte Zahl finden"
    description: >
      Du sollst aus einer nicht-leeren Liste von Zahlen die größte finden. Bring die Zeilen des Pseudocodes in
      eine Reihenfolge, die das Problem korrekt löst.
    items:
      - "EINGABE: eine Liste von Zahlen"
      - "Merke dir die erste Zahl als „größte\""
      - "FÜR JEDE weitere Zahl in der Liste:"
      - "    WENN die Zahl größer als „größte\" ist, DANN merke sie dir als neue „größte\""
      - "AUSGABE: „größte\""
    hints:
      - Bevor du vergleichen kannst, brauchst du einen Startwert.
      - Die Ausgabe kommt erst, wenn alle Zahlen geprüft sind.
  - id: kleine-algorithmen
    type: code
    language: js
    title: Drei kleine Algorithmen
    description: |
      Setze diese Algorithmen mit Schleifen um (ohne `Math.max`, `includes` oder `indexOf` – du sollst sie selbst bauen):

      1. `maximum(zahlen)` liefert die größte Zahl, bei einer leeren Liste `null`.
      2. `position(liste, gesucht)` sucht linear nach `gesucht` und liefert den Index des ersten Treffers, sonst `-1`.
      3. `zaehle(text, zeichen)` zählt, wie oft `zeichen` im Text vorkommt.

      Denk an die Randfälle: leere Liste, leerer Text, Treffer ganz vorn oder ganz hinten.
    starter: |
      function maximum(zahlen) {
        return null;
      }

      function position(liste, gesucht) {
        return -1;
      }

      function zaehle(text, zeichen) {
        return 0;
      }
    tests:
      - name: maximum findet die größte Zahl, auch negative
        code: assertTrue(maximum([3, 9, 4]) === 9 && maximum([-5, -2, -8]) === -2)
      - name: maximum einer leeren Liste ist null
        code: assertEqual(maximum([]), null)
      - name: position findet den ersten Treffer vorn und hinten
        code: assertTrue(position(["a", "b", "a"], "a") === 0 && position(["x", "y", "z"], "z") === 2)
      - name: position ohne Treffer ist -1
        code: assertTrue(position(["a"], "q") === -1 && position([], "a") === -1)
      - name: zaehle zählt Zeichen
        code: assertTrue(zaehle("Banane", "a") === 2 && zaehle("", "a") === 0)
    hints:
      - "maximum: Starte mit `zahlen[0]` – nicht mit 0, sonst scheitern negative Zahlen."
      - "position: eine for-Schleife mit Index und `return i;` beim Treffer."
      - "zaehle: `for (const z of text) { if (z === zeichen) anzahl++; }`"
    solution: |
      function maximum(zahlen) {
        if (zahlen.length === 0) return null;
        let groesste = zahlen[0];
        for (const zahl of zahlen) {
          if (zahl > groesste) groesste = zahl;
        }
        return groesste;
      }

      function position(liste, gesucht) {
        for (let i = 0; i < liste.length; i++) {
          if (liste[i] === gesucht) return i;
        }
        return -1;
      }

      function zaehle(text, zeichen) {
        let anzahl = 0;
        for (const z of text) {
          if (z === zeichen) anzahl++;
        }
        return anzahl;
      }
---

Eine Kollegin bittet dich: „Schreib mir mal schnell ein Programm, das die beste Note einer Klasse findet."
Viele Anfänger:innen öffnen sofort den Editor und starren dann auf eine leere Datei. Profis machen etwas anderes:
Sie denken zuerst – ganz ohne Code. Du kennst jetzt alle Bausteine. In dieser Lektion lernst du, sie gezielt
einzusetzen.

## Verstehen: das EVA-Prinzip

Fast jedes Programm folgt dem [[eva-prinzip|EVA-Prinzip]]: Eingabe, Verarbeitung, Ausgabe.

![Das EVA-Prinzip am Beispiel Durchschnitt berechnen](/assets/programmieren-grundlagen/m4-eva.svg)

| Teil | Frage | Beispiel „beste Note" |
|---|---|---|
| Eingabe | Welche Daten kommen herein? | die Noten aller Schüler:innen |
| Verarbeitung | Was muss damit passieren? | die beste (kleinste) Note heraussuchen |
| Ausgabe | Was soll herauskommen? | die beste Note |

Wer diese drei Fragen beantwortet, entdeckt Unklarheiten sofort: Ist bei Schulnoten die 1 oder die 6 die beste?
Was passiert, wenn die Liste leer ist? Solche ungewöhnlichen, aber möglichen Eingaben heißen [[randfall|Randfälle]] –
sammle sie, **bevor** du programmierst.

## Zerlegen und planen

Große Aufgaben zerlegst du durch [[dekomposition|Dekomposition]] so lange, bis jedes Teil klein und klar ist –
oft wird daraus je eine Funktion:

```text
Notenrechner
├── Noten einlesen
├── Statistik berechnen
│   ├── beste Note finden
│   └── Durchschnitt berechnen (addieren, durch Anzahl teilen)
└── Ergebnis anzeigen
```

Die Lösung eines Teilproblems beschreibst du als [[algorithmus|Algorithmus]]: eine eindeutige, endliche und
allgemeine Schrittfolge. Aufschreiben kannst du ihn in [[pseudocode|Pseudocode]] – einer Mischung aus
Umgangssprache und Programmstruktur, ohne Syntaxregeln:

```text
EINGABE: Liste von Noten
WENN die Liste leer ist: AUSGABE "keine Noten"
Merke dir die erste Note als "beste"
FÜR JEDE Note in der Liste:
    WENN Note < beste DANN beste = Note
AUSGABE: beste
```

> [!MERKSATZ]
> Erst verstehen (EVA, Randfälle), dann zerlegen, dann planen, dann programmieren. Der Code ist nur die
> Übersetzung eines Algorithmus in eine bestimmte Sprache.

## Von Hand testen, dann umsetzen

Spiel den Pseudocode mit einem Beispiel durch, etwa `[3, 1, 4, 2]`: Start `beste = 3`, dann 1 (kleiner → 1),
dann 4 und 2 (nicht kleiner). Ergebnis 1 – stimmt. Jetzt prüfe den Randfall `[]`: abgefangen. Erst dann übersetzt
du Zeile für Zeile:

```js run
function besteNote(noten) {
  if (noten.length === 0) return null;
  let beste = noten[0];
  for (const note of noten) {
    if (note < beste) beste = note;
  }
  return beste;
}
console.log(besteNote([3, 1, 4, 2]), besteNote([]));
```

`WENN` wird zu `if`, `FÜR JEDE` zu `for...of`, „merke dir" zu einer Variablen. Danach testest du mit den
gesammelten Beispielen und Randfällen.

> [!FEHLER]
> Alles auf einmal lösen wollen. Wer den ganzen Notenrechner in einem Rutsch schreibt, findet Fehler kaum wieder.
> Löse ein Teilproblem, teste es, dann das nächste.

## Wie viel Arbeit macht ein Algorithmus?

Algorithmen unterscheiden sich darin, wie viele Schritte sie brauchen. Die lineare Suche prüft im schlimmsten
Fall jedes Element einmal – bei 1000 Elementen 1000 Vergleiche. Eine [[verschachtelte-schleife|verschachtelte Schleife]]
 über dieselbe Liste („jeder mit jedem") braucht schon eine Million. Eine gute Faustfrage lautet deshalb:
„Wie oft läuft meine innerste Schleife, wenn die Daten zehnmal größer werden?" Genauer misst man das mit der
O-Notation, die du im Kurs zu Datenstrukturen und Algorithmen kennenlernst.

> [!PRAXIS]
> Erfahrene Entwickler:innen skizzieren schwierige Probleme auf Papier oder als Kommentarliste im Editor, bevor
> sie Code schreiben. Und bevor sie etwas selbst bauen, schauen sie nach, ob die Sprache es schon kann – etwa
> `Math.max` oder `includes`. Selbst bauen lohnt sich vor allem zum Lernen.

## Zusammenfassung

- Das **EVA-Prinzip** hilft, ein Problem zu verstehen; sammle **Randfälle**, bevor du programmierst.
- **Dekomposition** zerlegt große Probleme in kleine, lösbare Teile – oft je eine Funktion.
- Ein **Algorithmus** ist eindeutig, endlich und allgemein; **Pseudocode** hält ihn ohne Syntax fest.
- Spiel den Plan von Hand durch, übersetze ihn dann Zeile für Zeile und teste mit Beispielen und Randfällen.
- Frag dich, wie oft deine Schleifen laufen, wenn die Daten wachsen.
