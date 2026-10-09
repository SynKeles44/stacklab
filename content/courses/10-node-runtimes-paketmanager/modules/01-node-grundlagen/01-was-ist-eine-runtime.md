---
title: Node.js – eine JavaScript-Runtime
summary: Was eine Runtime ist, wie V8 und libuv zusammenarbeiten und wie du JavaScript in der REPL und als Skript ausführst.
duration: 25
sources:
  - title: Introduction to Node.js
    url: https://nodejs.org/en/learn/getting-started/introduction-to-nodejs
  - title: Differences between Node.js and the Browser
    url: https://nodejs.org/en/learn/getting-started/differences-between-nodejs-and-the-browser
  - title: How to use the Node.js REPL
    url: https://nodejs.org/en/learn/command-line/how-to-use-the-nodejs-repl
  - title: Command-line API
    url: https://nodejs.org/api/cli.html
quiz:
  - type: single
    question: Welche Aufgabe übernimmt V8 innerhalb von Node.js?
    options:
      - Es liest Dateien und öffnet Netzwerkverbindungen.
      - Es übersetzt JavaScript-Code und führt ihn aus.
      - Es installiert Pakete aus der npm-Registry.
      - Es zeigt Webseiten an.
    answer: 1
    explanation: V8 ist die JavaScript-Engine. Sie kennt nur die Sprache selbst. Dateien, Netzwerk und Timer kommen von libuv und den Node.js-APIs.
  - type: multiple
    question: Welche dieser Dinge gibt es in Node.js, aber nicht im Browser?
    options:
      - Das Modul `fs` zum Lesen und Schreiben von Dateien
      - Das Objekt `document` für die HTML-Seite
      - Das Objekt `process` mit Infos über den laufenden Prozess
      - Das Objekt `window`
    answers: [0, 2]
    explanation: "`fs` und `process` sind Node-APIs. `document` und `window` gehören zum Browser, weil es dort eine Seite und ein Fenster gibt."
  - type: match
    question: Was macht welcher Aufruf?
    pairs:
      - { left: "node", right: "Startet die interaktive REPL" }
      - { left: "node app.js", right: "Führt die Datei app.js aus" }
      - { left: "node -p \"1 + 1\"", right: "Rechnet den Ausdruck aus und gibt das Ergebnis aus" }
      - { left: "node --watch app.js", right: "Startet app.js bei jeder Änderung neu" }
    explanation: Ohne Argument startet die REPL. Mit Dateiname läuft das Skript, -p wertet Code aus und gibt ihn aus, --watch beobachtet Dateien.
  - type: cloze
    text: Die JavaScript-Engine in Node.js heißt ___, die Bibliothek für Event Loop und asynchrones I/O heißt ___.
    blanks:
      - [V8]
      - [libuv]
    explanation: V8 kommt aus Chrome, libuv wurde für Node.js geschrieben.
  - type: find-bug
    question: Das Skript soll mit `./hallo.js` startbar sein, aber die Shell meldet einen Fehler. In welcher Zeile liegt das Problem?
    language: js
    code: |
      // Begrüßungsskript
      #!/usr/bin/env node
      const name = "Ada";
      console.log(`Hallo, ${name}!`);
    bug_line: 2
    explanation: Die Shebang-Zeile muss die allererste Zeile der Datei sein. Steht ein Kommentar davor, erkennt das Betriebssystem sie nicht.
tasks:
  - id: runtime-schichten
    type: diagram
    title: Beschrifte die Schichten von Node.js
    description: |
      Das Diagramm zeigt, wie dein Programm in Node.js ausgeführt wird. Ordne jeder Schicht den
      richtigen Namen zu. Die kleinen grauen Texte in den Kästen helfen dir.
    image: /assets/node-runtimes-paketmanager/runtime-aufbau-leer.svg
    slots:
      - { x: 50, y: 14, answer: Dein JavaScript-Code }
      - { x: 50, y: 35, answer: Node.js-APIs }
      - { x: 26, y: 58, answer: V8 }
      - { x: 74, y: 58, answer: libuv }
      - { x: 50, y: 84, answer: Betriebssystem }
    distractors: [Browser, npm]
    hints:
      - Ganz oben steht das, was du selbst schreibst, ganz unten das, was der Rechner mitbringt.
      - V8 führt JavaScript aus, libuv kümmert sich um Event Loop und Ein-/Ausgabe.
  - id: erstes-skript
    type: terminal
    title: Dein erstes Node-Skript
    description: |
      Der Ordner `erstes-skript` ist leer. Schreibe dein erstes Skript und führe es aus.

      1. Wechsle in den Ordner: `cd erstes-skript`.
      2. Lege die Datei `hallo.js` an (z. B. mit `nano hallo.js`).
      3. Das Skript soll **zwei Zeilen** ausgeben: zuerst `Hallo, Node.js!` und danach das Ergebnis
         von `21 * 2` – lass Node.js rechnen, schreib nicht einfach 42 hin.
      4. Starte das Skript mit `node hallo.js` und prüfe die Ausgabe.
    workdir: erstes-skript
    checks:
      - type: file_exists
        path: hallo.js
        message: Die Datei hallo.js gibt es noch nicht.
      - type: command
        run: node hallo.js | head -n 1
        stdout_matches: "^Hallo, Node\\.js!$"
        message: Die erste Zeile der Ausgabe soll genau "Hallo, Node.js!" lauten.
      - type: command
        run: node hallo.js | sed -n 2p
        stdout_matches: "^42$"
        message: Die zweite Zeile soll das Ergebnis von 21 * 2 sein.
      - type: file_contains
        path: hallo.js
        pattern: "21\\s*\\*\\s*2"
        message: Lass Node.js rechnen – im Skript sollte 21 * 2 stehen.
    hints:
      - Jeder Aufruf von `console.log()` erzeugt eine eigene Zeile.
      - "`console.log(21 * 2)` gibt das Ergebnis der Rechnung aus."
    solution: |
      ```bash
      cd erstes-skript
      cat > hallo.js <<'EOF'
      console.log("Hallo, Node.js!");
      console.log(21 * 2);
      EOF
      node hallo.js
      ```
---

Du kennst JavaScript vielleicht aus dem Browser: Ein Klick, und ein Fenster springt auf. Aber wie
läuft dieselbe Sprache auf einem [[server|Server]], wo es weder Fenster noch Knöpfe gibt? Die
Antwort heißt **Runtime** – und [[nodejs|Node.js]] ist die bekannteste davon.

## Runtime = Engine + Umgebung

[[javascript|JavaScript]] ist zunächst nur eine [[programmiersprache|Programmiersprache]]. Sie
weiß nichts über Dateien, Netzwerk oder Bildschirme. Damit aus Code ein laufendes
[[programm|Programm]] wird, braucht es zwei Dinge:

1. Eine **Engine**, die den Code versteht und in Maschinenbefehle übersetzt.
2. Eine **Umgebung**, die dem Code Fähigkeiten gibt – „lies diese Datei“, „warte zwei Sekunden“.

Beides zusammen ist eine [[laufzeitumgebung|Laufzeitumgebung]], englisch **Runtime**. Denk an
Motor und Auto: Derselbe Motor kann in einem Sportwagen oder einem Transporter stecken. Genauso
steckt dieselbe JavaScript-Engine im [[browser|Browser]] Chrome und in Node.js.

Weitere Runtimes lernst du später kennen: [[bun|Bun]] und [[deno|Deno]].

> [!MERKSATZ]
> **Runtime = Engine + Umgebung.** Die Engine führt die Sprache aus, die Umgebung verbindet
> deinen Code mit der Außenwelt.

## Die Schichten von Node.js

![Die Schichten von Node.js: dein Code, Node.js-APIs, V8 und libuv, Betriebssystem](/assets/node-runtimes-paketmanager/runtime-aufbau.svg)

| Schicht | Aufgabe | Beispiel |
|---|---|---|
| Dein Code | Die Logik deiner Anwendung | `server.js` |
| Node.js-APIs | Fertige Bausteine | `fs`, `http`, `path`, `process` |
| V8 | Übersetzt JavaScript und führt es aus | `2 + 3` ausrechnen |
| libuv | Event Loop, Hintergrund-Threads, asynchrone Ein-/Ausgabe | Datei lesen, ohne zu warten |
| Betriebssystem | Echte Hardware-Zugriffe | Festplatte, Netzwerk, Uhr |

[[v8|V8]] ist die Engine aus Chrome; sie übersetzt Code während der Ausführung mit einem
[[jit-compiler|JIT-Compiler]]. [[libuv|libuv]] übergibt langsame Arbeit wie Dateizugriffe an das
[[betriebssystem|Betriebssystem]] oder an Hintergrund-[[thread|Threads]] und meldet sich über die
[[event-loop|Event Loop]], wenn sie fertig ist. Wie das genau funktioniert, siehst du in der
Lektion zur Event Loop.

## Node.js und der Browser

Beide teilen sich die Sprache, aber nicht die Umgebung:

| | Browser | Node.js |
|---|---|---|
| Globale Objekte | `window`, `document`, `localStorage` | `process`, `globalThis`, `Buffer` |
| Dateizugriff | Nein (aus Sicherheitsgründen) | Ja, mit `node:fs` |
| Wer bestimmt die Version? | Die Besucherin (welcher Browser?) | Du |
| In beiden vorhanden | `console.log`, `setTimeout`, `fetch`, `JSON` | dieselben |

Weil **du** die Node-Version bestimmst, kannst du neue Sprachfunktionen sofort nutzen. Darum gibt
es Werkzeuge wie nvm, mit denen du die Version pro Projekt festlegst.

> [!FEHLER]
> **`document is not defined`.** Wer Code aus einem Browser-Tutorial mit Node.js startet, bekommt
> oft diesen Fehler. Node.js hat keine HTML-Seite. Prüfe immer zuerst: Läuft der Code im Browser
> oder in Node.js?

## REPL und Skripte

Tippst du im [[terminal|Terminal]] nur `node`, startet die [[repl|REPL]] (*Read, Eval, Print,
Loop*): Du gibst JavaScript ein und siehst sofort das Ergebnis.

```text title="REPL"
> 3 * 7
21
> const namen = ["Ada", "Linus"]
undefined
> namen.length
2
> .exit
```

`undefined` nach `const` ist kein Fehler: Eine Deklaration hat keinen Ergebniswert. Für alles, was
du behalten willst, schreibst du eine [[datei|Datei]] und startest sie als [[skript|Skript]]. Dort
siehst du nur, was du mit [[console-log|`console.log()`]] ausgibst.

```bash title="Terminal"
node hallo.js                 # Skript ausführen
node -p '2 ** 10'             # Einzeiler auswerten und ausgeben
node --watch server.js        # bei jeder Änderung neu starten
```

Mit einer [[shebang|Shebang-Zeile]] `#!/usr/bin/env node` in **Zeile 1** und `chmod +x` startest
du ein Skript direkt mit `./hallo.js` – so funktionieren alle Kommandozeilen-Werkzeuge aus npm.

> [!PRAXIS]
> Viele Entwickler haben immer eine REPL offen, um schnell etwas auszuprobieren: ein Datumsformat,
> einen regulären Ausdruck, den Rückgabewert einer Funktion. Prüfe Node- und V8-Version jederzeit
> mit `node --version` und `node -p process.versions.v8`.

## Zusammenfassung

- Eine **Runtime** besteht aus Engine und Umgebung.
- **Node.js** = V8 (führt JavaScript aus) + libuv (Event Loop, asynchrones I/O) + APIs wie `fs` und `process`.
- Im Browser gibt es `window` und `document`, in Node.js `process` und Dateizugriff.
- `node` startet die REPL, `node datei.js` ein Skript; Ausgaben erzeugst du mit `console.log()`.
- `--watch` startet neu bei Änderungen; eine Shebang in Zeile 1 macht Skripte direkt startbar.
