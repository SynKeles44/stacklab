---
title: Wie ein Computer Code ausführt
summary: Vom Quellcode zum Prozessor – was Compiler, Interpreter, JIT und Laufzeitumgebungen tun und warum dasselbe JavaScript im Browser und in Node.js läuft.
duration: 25
sources:
  - title: Node.js – Introduction to Node.js
    url: https://nodejs.org/en/learn/getting-started/introduction-to-nodejs
  - title: MDN – JavaScript-Technologieübersicht (Engines und Laufzeitumgebungen)
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/JavaScript_technologies_overview
  - title: PHP-Handbuch – Kommandozeilen-Nutzung
    url: https://www.php.net/manual/de/features.commandline.usage.php
  - title: TypeScript-Handbuch – TypeScript für Programmieranfänger
    url: https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html
quiz:
  - type: single
    question: Welche Sprache versteht ein Prozessor direkt?
    options:
      - JavaScript
      - PHP
      - Maschinencode
      - Englisch
    answer: 2
    explanation: >
      Der Prozessor kennt nur Maschinencode – Befehle als Bitfolgen. Alle anderen Sprachen müssen erst von
      einem Compiler oder Interpreter übersetzt bzw. ausgeführt werden.
  - type: match
    question: Ordne jedem Werkzeug seine Arbeitsweise zu.
    pairs:
      - { left: "Compiler", right: "Übersetzt das ganze Programm vorab in eine ausführbare Datei" }
      - { left: "Interpreter", right: "Liest den Code und führt ihn direkt aus" }
      - { left: "JIT-Compiler", right: "Übersetzt häufig genutzten Code während der Ausführung" }
      - { left: "Laufzeitumgebung", right: "Stellt dem Programm Werkzeuge wie Ausgabe oder Dateizugriff bereit" }
    explanation: Compiler arbeiten vorher, Interpreter währenddessen, JIT-Compiler kombinieren beides. Die Laufzeitumgebung ist das „Zuhause" des laufenden Programms.
  - type: multiple
    question: Welche Aussagen über JavaScript und Node.js stimmen?
    options:
      - Node.js ist eine Laufzeitumgebung für JavaScript.
      - Node.js ist eine eigene Programmiersprache.
      - Derselbe JavaScript-Code kann im Browser und in Node.js laufen.
      - Im Browser kann JavaScript ohne Weiteres beliebige Dateien auf deiner Festplatte lesen.
    answers: [0, 2]
    explanation: >
      Node.js ist keine Sprache, sondern eine Laufzeitumgebung. Die Sprache JavaScript ist überall gleich, aber
      jede Umgebung bietet andere Werkzeuge. Aus Sicherheitsgründen darf der Browser nicht einfach deine Dateien lesen.
  - type: cloze
    text: Mit dem Befehl `___ hallo.js` startest du eine JavaScript-Datei im Terminal, mit `___ hallo.php` eine PHP-Datei.
    blanks:
      - [node]
      - [php]
    explanation: "`node` startet die Laufzeitumgebung Node.js, `php` den PHP-Interpreter. Beide bekommen den Dateinamen als Argument."
tasks:
  - id: compiler-oder-interpreter
    type: dragdrop
    title: Compiler oder Interpreter?
    description: Ordne jede Eigenschaft dem Verfahren zu, auf das sie am besten passt.
    targets:
      - { id: compiler, label: Klassischer Compiler }
      - { id: interpreter, label: Klassischer Interpreter }
    items:
      - { label: "Erzeugt vor dem Start eine ausführbare Datei", target: compiler }
      - { label: "Syntaxfehler fallen auf, bevor das Programm überhaupt läuft", target: compiler }
      - { label: "Nach jeder Änderung muss neu übersetzt werden", target: compiler }
      - { label: "Datei speichern und sofort starten", target: interpreter }
      - { label: "Das Programm braucht zum Laufen immer das Übersetzungsprogramm", target: interpreter }
      - { label: "Fehler in einer Zeile fallen erst auf, wenn diese Zeile erreicht wird", target: interpreter }
    hints:
      - Der Compiler arbeitet einmal vorher, der Interpreter jedes Mal, während das Programm läuft.
  - id: node-startet
    type: steps
    title: Was passiert, wenn du node hallo.js tippst?
    description: Spiel Schritt für Schritt durch, was zwischen Enter-Taste und Ausgabe passiert.
    steps:
      - situation: Du tippst im Terminal `node hallo.js` und drückst Enter. In der Datei steht `console.log("Hallo");`.
        question: Was passiert zuerst?
        options:
          - Der Prozessor liest die Datei hallo.js direkt.
          - Das Terminal startet das Programm Node.js und übergibt ihm den Dateinamen.
          - Der Browser öffnet sich.
        answer: 1
        explanation: Das Terminal startet das Programm `node`. Den Dateinamen bekommt Node.js als Argument mit.
      - situation: Node.js hat die Datei hallo.js geöffnet und den Text eingelesen.
        question: Was macht die JavaScript-Engine von Node.js als Nächstes?
        options:
          - Sie prüft den Code auf Syntaxfehler und bereitet ihn zur Ausführung vor.
          - Sie schickt den Code an einen Server im Internet.
          - Sie speichert eine .exe-Datei auf der Festplatte.
        answer: 0
        explanation: >
          Die Engine (V8) zerlegt den Text und prüft die Syntax. Ist alles in Ordnung, wird der Code ausgeführt –
          zunächst interpretiert, häufig genutzte Teile später per JIT in Maschinencode übersetzt.
      - situation: Die Anweisung `console.log("Hallo");` wird ausgeführt.
        question: Woher kommt die Fähigkeit, Text ins Terminal zu schreiben?
        options:
          - Aus der Laufzeitumgebung Node.js, die `console.log` bereitstellt.
          - Der Prozessor kann von sich aus Texte ausgeben.
          - Aus dem Internet.
        answer: 0
        explanation: Die Sprache JavaScript selbst kann nichts ausgeben. Die Laufzeitumgebung stellt `console` zur Verfügung und leitet die Ausgabe ans Terminal.
      - situation: Die letzte Zeile der Datei wurde ausgeführt.
        question: Was passiert jetzt?
        options:
          - Node.js wartet für immer.
          - Node.js beendet sich und das Terminal zeigt wieder den Prompt.
          - Der Computer startet neu.
        answer: 1
        explanation: Gibt es nichts mehr zu tun, beendet sich Node.js. Du kannst den nächsten Befehl eingeben.
---

Du hast in der letzten Lektion gelernt, dass ein Computer nur Nullen und Einsen versteht, Menschen aber
in Programmiersprachen schreiben. Irgendwo dazwischen muss also eine Übersetzung passieren. Wer
übersetzt da eigentlich? Wann? Und warum läuft JavaScript sowohl im Browser als auch im Terminal?
In dieser Lektion schaust du hinter die Kulissen.

## Der Prozessor: das Herz, das nur Maschinencode versteht

Im Inneren jedes Computers sitzt ein [[prozessor|Prozessor]] (CPU). Er ist der Teil, der wirklich
rechnet. Seine Fähigkeiten sind erstaunlich bescheiden: Zahlen addieren, Zahlen vergleichen, Werte im
Speicher ablegen, zu einer anderen Stelle im Programm springen. Mehr nicht. Dafür schafft er Milliarden
solcher Schritte pro Sekunde.

Diese Befehle bekommt der Prozessor als [[maschinencode|Maschinencode]] – lange Folgen aus Nullen und
Einsen. Ein winziger Ausschnitt könnte so aussehen:

```text
10110000 01100001
00000100 00000010
```

Niemand möchte so programmieren: Jede Kleinigkeit bräuchte Dutzende Zeilen, und jede Prozessorfamilie hat
eigene Befehle. Deshalb schreiben Menschen in Programmiersprachen und lassen den Computer übersetzen.

## Compiler und Interpreter

Für die Übersetzung gibt es zwei grundlegende Strategien: den [[compiler|Compiler]] und den [[interpreter|Interpreter]]. Beide verarbeiten deinen [[code|Quellcode]], aber zu unterschiedlichen Zeitpunkten.

| | Compiler | Interpreter |
|---|---|---|
| Arbeitsweise | Liest den ganzen Quellcode und erzeugt vorab eine ausführbare Datei | Liest den Code und führt ihn sofort aus, Anweisung für Anweisung |
| Analogie | Übersetzerin, die ein ganzes Buch überträgt | Simultandolmetscherin, die jeden Satz sofort übersetzt |
| Vorteil | Sehr schnell, viele Fehler fallen vor dem Start auf | Speichern und sofort starten – ideal zum Ausprobieren |
| Nachteil | Nach jeder Änderung neu übersetzen | Braucht zum Laufen immer den Interpreter |
| Beispiele | C, Go, Rust | PHP, Bash |

```bash title="Terminal – zwei Wege (nur zur Anschauung)"
gcc hallo.c -o hallo   # Compiler: erzeugt die Datei "hallo" …
./hallo                # … die du danach beliebig oft startest
php hallo.php          # Interpreter: liest die Datei und führt sie sofort aus
```

Beim Interpreter fallen manche Fehler erst auf, wenn die fehlerhafte Zeile tatsächlich erreicht wird.

> [!MERKSATZ]
> Ein **Compiler** übersetzt vorher das ganze Programm. Ein **Interpreter** führt den Code während des
> Laufs aus. Beide haben dasselbe Ziel: Der Prozessor soll am Ende Maschinencode bekommen.

## Das Beste aus beiden Welten: Just-in-time

Heute ist die Grenze zwischen beiden Strategien verschwommen. Moderne Sprachumgebungen nutzen einen
[[jit-compiler|JIT-Compiler]] („just in time" – gerade rechtzeitig). Das Programm startet sofort wie bei
einem Interpreter. Während es läuft, beobachtet die Umgebung, welche Codeteile besonders oft ausgeführt
werden, und übersetzt genau diese im Hintergrund in schnellen Maschinencode.

![Drei Wege vom Quellcode zum laufenden Programm: Compiler, Interpreter und JIT](/assets/programmieren-grundlagen/m1-compiler-interpreter.svg)

Die JavaScript-Engine V8 in Chrome und Node.js arbeitet genau so; auch PHP bringt seit Version 8 einen
zuschaltbaren JIT-Compiler mit. Du startest also sofort und bekommst trotzdem gute Geschwindigkeit.

| Verfahren | Wann wird übersetzt? | Typische Beispiele |
|---|---|---|
| Compiler | Einmal vor dem Start | C, Go, Rust |
| Interpreter | Während des Laufs, Anweisung für Anweisung | klassische Skriptsprachen, Bash |
| JIT-Compiler | Während des Laufs, häufiger Code wird in Maschinencode übersetzt | JavaScript in V8, PHP 8 mit JIT |

Sonderfall [[typescript|TypeScript]]: Sein Compiler erzeugt keinen Maschinencode, sondern normales JavaScript
und prüft dabei, ob du Werte richtig verwendest.

> [!FEHLER]
> „Interpretierte Sprachen sind immer langsam" – das war vor zwanzig Jahren oft richtig. Dank
> JIT-Compilern ist JavaScript heute für die meisten Aufgaben mehr als schnell genug. Ob ein Programm
> langsam ist, liegt fast immer am Programm selbst, selten an der Sprache.

## Die Laufzeitumgebung: das Zuhause deines Programms

Damit ein Programm etwas Nützliches tun kann, braucht es mehr als nur einen Übersetzer. Es muss Text
ausgeben, Dateien lesen, die Uhrzeit abfragen oder auf Klicks reagieren. Diese Fähigkeiten stellt die
[[laufzeitumgebung|Laufzeitumgebung]] (englisch *runtime*) bereit.

Für JavaScript gibt es mehrere Laufzeitumgebungen. Die beiden wichtigsten sind der [[browser|Browser]] und [[nodejs|Node.js]]:

| | Browser | Node.js |
|---|---|---|
| Wo läuft der Code? | In einem Browser-Tab | Im Terminal oder auf einem Server |
| Typische Aufgaben | Webseiten interaktiv machen | Kommandozeilen-Werkzeuge, Webserver |
| Zugriff auf die Webseite | Ja | Nein |
| Zugriff auf Dateien | Nein (aus Sicherheitsgründen) | Ja |
| Ausgabe von `console.log` | In der Konsole der Entwicklerwerkzeuge | Im Terminal |

Die **Sprache** JavaScript ist überall gleich: Variablen, Bedingungen und Schleifen funktionieren im
Browser genauso wie in Node.js. Unterschiedlich ist nur der **Werkzeugkasten**, den die Umgebung
mitbringt. Eine Anweisung, die eine Datei liest, funktioniert in Node.js, aber nicht im Browser – und
umgekehrt kann Node.js keinen Button auf einer Webseite anklicken.

Bei PHP ist die Lage einfacher: Der PHP-Interpreter ist die Laufzeitumgebung. Meist läuft er auf einem
Webserver und erzeugt dort Webseiten. Du kannst ihn aber genauso im Terminal benutzen, wie du gleich in
der nächsten Lektion siehst.

## Was „ausführen" konkret bedeutet

Egal ob Browser, Node.js oder PHP: Ein Programm wird grundsätzlich **von oben nach unten** ausgeführt,
eine Anweisung nach der anderen. Was in Zeile 1 steht, passiert vor Zeile 2.

```js run
console.log("Erste Zeile");
console.log("Zweite Zeile");
console.log("Dritte Zeile");
```

Später lernst du Werkzeuge kennen, die diesen Fluss verändern: Bedingungen überspringen Zeilen,
Schleifen wiederholen sie, Funktionen springen an eine andere Stelle und wieder zurück. Aber die
Grundregel bleibt: Der Computer arbeitet einen Schritt nach dem anderen ab.

Diesen Codeblock kannst du übrigens direkt hier im Browser ausführen. Die Laufzeitumgebung ist in diesem
Fall dein Browser – Stacklab zeigt dir die Ausgabe von `console.log` unter dem Code an.

> [!PRAXIS]
> In echten Projekten läuft oft beides: JavaScript im Browser für die Oberfläche und JavaScript in
> Node.js oder PHP auf dem Server für Daten und Logik. Wer versteht, welche Umgebung was kann, vermeidet
> klassische Missverständnisse wie „Warum kann mein Browser-Code nicht auf die Datenbank zugreifen?".

## Zusammenfassung

- Der **Prozessor** versteht nur **Maschinencode**; Menschen schreiben deshalb in Programmiersprachen.
- Ein **Compiler** übersetzt das ganze Programm vorab, ein **Interpreter** führt es während des Laufs aus.
- **JIT-Compiler** kombinieren beides: sofort starten, häufigen Code später schnell machen (z. B. V8, PHP 8).
- Eine **Laufzeitumgebung** stellt Werkzeuge wie Ausgabe oder Dateizugriff bereit – für JavaScript vor allem Browser und **Node.js**.
- Die Sprache JavaScript ist überall gleich, nur der Werkzeugkasten der Umgebung unterscheidet sich.
- Programme laufen grundsätzlich **von oben nach unten**, Anweisung für Anweisung.
