---
title: Profiling in Node.js und PHP
summary: Wie ein Profiler zeigt, in welcher Funktion die Zeit wirklich verbraucht wird, wie du ein Flame Graph liest und wie du CPU-Profile mit Node.js und Xdebug erzeugst.
duration: 25
sources:
  - title: Node.js – Command-line options (--cpu-prof)
    url: https://nodejs.org/api/cli.html#--cpu-prof
  - title: Node.js – Profiling Node.js Applications
    url: https://nodejs.org/en/learn/getting-started/profiling
  - title: Xdebug – Profiling
    url: https://xdebug.org/docs/profiler
  - title: Chrome DevTools – Analyze runtime performance
    url: https://developer.chrome.com/docs/devtools/performance
quiz:
  - type: single
    question: Was zeigt die Breite eines Balkens in einem Flame Graph?
    options:
      - Wie oft die Funktion im Quellcode vorkommt
      - Wie viel Anteil der gemessenen Zeit in dieser Funktion und ihren Aufrufen steckt
      - In welcher Reihenfolge die Funktionen aufgerufen wurden
      - Wie viel Arbeitsspeicher die Funktion belegt
    answer: 1
    explanation: >
      Breit heißt teuer. Die x-Achse ist keine Zeitachse, sondern der Anteil an allen Stichproben. Die Höhe zeigt die
      Aufruftiefe: Wer oben auf einem Balken liegt, wurde von ihm aufgerufen.
  - type: multiple
    question: Welche Aussagen über Profiler stimmen?
    options:
      - Ein Sampling-Profiler schaut in kurzen Abständen nach, welche Funktion gerade läuft.
      - Profiling verlangsamt das Programm etwas, darum misst du Zeiten nicht gleichzeitig mit aktivem Profiler.
      - Ein Profil zeigt dir sofort die Lösung des Problems.
      - "`node --cpu-prof` schreibt beim Beenden eine `.cpuprofile`-Datei."
    answers: [0, 1, 3]
    explanation: Ein Profil zeigt, **wo** die Zeit verbraucht wird. **Warum** und was du daran änderst, musst du selbst herausfinden.
  - type: match
    question: Ordne jedem Werkzeug seinen Einsatzzweck zu.
    pairs:
      - { left: "node --cpu-prof", right: "CPU-Profil eines Node.js-Skripts als Datei" }
      - { left: "xdebug.mode=profile", right: "Cachegrind-Profil eines PHP-Skripts" }
      - { left: "Performance-Tab der DevTools", right: "Profil von JavaScript und Rendering im Browser" }
      - { left: "Eigene Messpunkte mit hrtime", right: "Gezielte Dauer eines bekannten Abschnitts" }
    explanation: Profiler finden den Engpass, eigene Messpunkte bestätigen danach gezielt die Verbesserung.
tasks:
  - id: cpu-profil
    type: terminal
    title: Finde den Hotspot mit einem CPU-Profil
    description: |
      `app.js` erzeugt eine Liste von Prüfsummen und ist spürbar langsam. Finde heraus, welche Funktion die meiste
      Zeit verbraucht – nicht durch Raten, sondern mit einem Profil.

      Klicke zuerst auf **Aufgabe vorbereiten**. Dann:

      1. Starte das Skript mit dem eingebauten Profiler und lege das Profil im Ordner `profil` ab:
         `node --cpu-prof --cpu-prof-dir=profil app.js`.
      2. Werte die `.cpuprofile`-Datei mit `jq` aus: Summiere den `hitCount` je `callFrame.functionName` und
         sortiere absteigend (der Befehl steht in der Lektion).
      3. Schreibe den Namen der teuersten **eigenen** Funktion in die Datei `hotspot.txt`.
    workdir: cpu-profil
    setup: |
      cat > app.js <<'EOF'
      function checksum(text) {
        let hash = 0;
        for (let round = 0; round < 3000; round++) {
          for (let i = 0; i < text.length; i++) {
            hash = (hash * 31 + text.charCodeAt(i)) | 0;
          }
        }
        return hash;
      }

      function formatRow(id, hash) {
        return `${String(id).padStart(4, '0')};${hash}`;
      }

      function buildRows(count) {
        const rows = [];
        for (let id = 0; id < count; id++) {
          rows.push(formatRow(id, checksum(`user-${id}-${'x'.repeat(40)}`)));
        }
        return rows;
      }

      console.log(buildRows(500).length, 'rows');
      EOF
    checks:
      - type: command
        run: ls profil/*.cpuprofile | wc -l
        stdout_matches: "^\\s*[1-9]\\d*\\s*$"
        message: Im Ordner profil liegt noch keine .cpuprofile-Datei. Starte app.js mit node --cpu-prof --cpu-prof-dir=profil.
      - type: command
        run: jq -e '.nodes | length > 0' "$(ls profil/*.cpuprofile | head -n 1)"
        message: Die .cpuprofile-Datei ist kein gültiges Profil. Lass das Skript vollständig durchlaufen.
      - type: file_contains
        path: hotspot.txt
        pattern: "^\\s*checksum\\s*$"
        message: In hotspot.txt steht noch nicht der Name der teuersten Funktion. Werte das Profil mit jq aus und schreibe nur den Funktionsnamen hinein.
    hints:
      - Der Profiler schreibt die Datei erst, wenn das Skript endet. Danach zeigt `ls profil` einen Namen wie `CPU.….cpuprofile`.
      - "Im Profil steht jeder Knoten unter `.nodes[]` mit `.callFrame.functionName` und `.hitCount`."
      - "`jq -r '[.nodes[] | {f: .callFrame.functionName, h: .hitCount}] | group_by(.f) | map({f: .[0].f, h: (map(.h) | add)}) | sort_by(-.h) | .[0:5][] | \"\\(.h) \\(.f)\"' profil/*.cpuprofile`"
    solution: |
      ```bash
      node --cpu-prof --cpu-prof-dir=profil app.js
      jq -r '[.nodes[] | {f: .callFrame.functionName, h: .hitCount}]
        | group_by(.f) | map({f: .[0].f, h: (map(.h) | add)})
        | sort_by(-.h) | .[0:5][] | "\(.h) \(.f)"' profil/*.cpuprofile
      echo checksum > hotspot.txt
      ```

      Ganz oben steht `checksum` mit den weitaus meisten Treffern. `formatRow` und `buildRows` tauchen kaum auf.
  - id: flamegraph-lesen
    type: steps
    title: Ein Flame Graph im Team-Alltag
    description: Du untersuchst einen langsamen Endpunkt und liest das Profil Schritt für Schritt.
    steps:
      - situation: >
          Im Flame Graph ist `handleRequest` ganz unten und über die volle Breite. Darüber liegen `loadUser` (schmal),
          `renderInvoice` (sehr breit) und `sendMetrics` (schmal).
        question: Wo schaust du als Nächstes genauer hin?
        options:
          - Bei handleRequest, weil es am breitesten ist
          - Bei renderInvoice, weil es den größten Anteil der Zeit unter handleRequest verbraucht
          - Bei sendMetrics, weil es ganz rechts steht
        answer: 1
        explanation: Die unterste Funktion ist immer breit – sie ruft ja alles auf. Interessant ist, welcher Kind-Balken die Breite verursacht.
      - situation: >
          Über `renderInvoice` liegt fast über die ganze Breite `formatCurrency`, das bei jedem Aufruf einen neuen
          `Intl.NumberFormat` erzeugt.
        question: Was ist eine sinnvolle Hypothese?
        options:
          - Das Erzeugen des Formatierers ist teuer – einmal erzeugen und wiederverwenden
          - Die Rechnung hat zu viele Positionen, das Profil ist kaputt
          - Man sollte sofort einen Cache vor die ganze Anfrage bauen
        answer: 0
        explanation: Ein Profil führt zu einer konkreten Hypothese. Ob sie stimmt, zeigt die nächste Messung.
      - situation: Du hast den Formatierer in eine Konstante außerhalb der Funktion verschoben.
        question: Was machst du jetzt?
        options:
          - Fertig, das Profil hatte ja recht
          - Ohne Profiler erneut messen und Median vorher/nachher vergleichen
          - Gleich noch fünf weitere Stellen umbauen
        answer: 1
        explanation: Eine Änderung, dann messen. Nur so weißt du, welche Änderung wie viel gebracht hat.
---
Dein Benchmark sagt: Der Endpunkt braucht 800 ms. Aber **wo** gehen sie verloren? In dreißig Funktionen
nacheinander Messpunkte einzubauen dauert ewig. Ein [[profiling|Profiler]] beantwortet die Frage in einem
Durchlauf: Er zeigt für jede Funktion, wie viel Zeit in ihr steckt.

## Wie ein Profiler arbeitet

Die meisten Profiler sind **Sampling-Profiler**. Sie schauen in kurzen Abständen (z. B. jede Millisekunde) auf
den [[call-stack|Call Stack]] und notieren, welche Funktion gerade läuft und wer sie aufgerufen hat. Nach
tausenden Stichproben ergibt sich ein statistisch gutes Bild:

| Funktion | Stichproben | Anteil |
|---|---|---|
| `checksum` | 640 | 91 % |
| `formatRow` | 12 | 2 % |
| `buildRows` (eigener Code) | 8 | 1 % |

Eine Funktion mit 91 % der Stichproben ist dein Hotspot. Eine Funktion mit 1 % zu optimieren, bringt höchstens 1 %.

> [!MERKSATZ]
> Ein Profil zeigt, **wo** die Zeit verbraucht wird. Warum – und was du daran änderst – findest du danach selbst heraus.

## Den Flame Graph lesen

Profile werden oft als [[flamegraph|Flame Graph]] dargestellt: Jeder Balken ist eine Funktion, darüber liegen
die Funktionen, die sie aufruft.

![Flame Graph: handleRequest ruft loadUser, renderInvoice und sendMetrics auf, renderInvoice ist am breitesten](/assets/performance/flamegraph.svg)

- **Breite** = Anteil an der gemessenen Zeit (keine Zeitachse!).
- **Höhe** = Aufruftiefe.
- Suche **breite Balken, über denen wenig liegt** – dort verbringt der Prozessor die Zeit selbst.

> [!FEHLER]
> „`main` ist am breitesten, also ist `main` das Problem.“ – Die unterste Funktion ruft alles andere auf und ist
> deshalb immer breit. Entscheidend ist, welcher Balken darüber die Breite verursacht.

## CPU-Profile mit Node.js

Node.js bringt einen Profiler mit. Mit `--cpu-prof` schreibt es beim Beenden eine Datei im Format
`.cpuprofile`:

```bash title="Terminal"
node --cpu-prof --cpu-prof-dir=profil app.js
ls profil
# CPU.20261010.105922.4711.0.001.cpuprofile
```

Die Datei kannst du in den [[devtools|DevTools]] von Chrome öffnen (Performance-Tab, „Load profile“) und dort als
Flame Graph ansehen. Weil sie [[json|JSON]] ist, geht es auch direkt im Terminal mit [[jq]]:

```bash title="Die fünf teuersten Funktionen"
jq -r '[.nodes[] | {f: .callFrame.functionName, h: .hitCount}]
  | group_by(.f) | map({f: .[0].f, h: (map(.h) | add)})
  | sort_by(-.h) | .[0:5][] | "\(.h) \(.f)"' profil/*.cpuprofile
```

Einträge wie `(program)`, `(idle)` oder `(garbage collector)` sind interne Arbeit der Laufzeitumgebung.

Für Server-Anwendungen startest du den Prozess genauso mit `--cpu-prof`, schickst einige Anfragen und beendest ihn sauber.

## Profile mit PHP und Xdebug

In PHP übernimmt [[xdebug|Xdebug]] das Profiling. Du aktivierst es nur für einen Lauf:

```bash title="Terminal"
php -d xdebug.mode=profile \
    -d xdebug.start_with_request=yes \
    -d xdebug.output_dir=profil \
    report.php
ls profil
# cachegrind.out.4711.gz
```

Die Datei im Cachegrind-Format öffnest du mit Werkzeugen wie KCachegrind, QCachegrind oder direkt in PhpStorm
(„Tools → Analyze Xdebug Profiler Snapshot“). Xdebug misst jeden Funktionsaufruf und bremst dabei stark – für
den Engpass ist das egal, für absolute Zeiten nicht.

> [!PRAXIS]
> In Produktion läuft niemals Xdebug. Teams nutzen dort Sampling-Profiler mit wenig Overhead, die nur einen
> kleinen Anteil der Anfragen aufzeichnen – zum Beispiel über eine Observability-Plattform. Lokal reicht Xdebug völlig.

## Zusammenfassung

- Ein **Sampling-Profiler** sammelt Stichproben des Call Stacks und zeigt, wo die Zeit verbraucht wird.
- Im **Flame Graph** ist Breite der Zeitanteil und Höhe die Aufruftiefe; suche breite Balken mit wenig darüber.
- `node --cpu-prof --cpu-prof-dir=profil app.js` erzeugt ein `.cpuprofile`, das du in den DevTools oder mit `jq` auswertest.
- In PHP erzeugt `xdebug.mode=profile` ein Cachegrind-Profil.
- Profiler verlangsamen das Programm: Profil zum Finden, Benchmark ohne Profiler zum Bestätigen.
