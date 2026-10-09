---
title: Mit grep Text durchsuchen
summary: Wie du mit grep in Sekunden die eine wichtige Zeile in tausenden Zeilen Text findest – mit Optionen, Kontext und einfachen Mustern.
duration: 20
sources:
  - title: GNU Grep Manual
    url: https://www.gnu.org/software/grep/manual/grep.html
  - title: grep(1) – Linux manual page
    url: https://man7.org/linux/man-pages/man1/grep.1.html
  - title: Bash Reference Manual – Quoting
    url: https://www.gnu.org/software/bash/manual/html_node/Quoting.html
quiz:
  - type: single
    question: Welcher Befehl zeigt alle Zeilen aus `app.log`, die **nicht** das Wort `INFO` enthalten?
    options:
      - "`grep -n INFO app.log`"
      - "`grep -v INFO app.log`"
      - "`grep -c INFO app.log`"
      - "`grep -l INFO app.log`"
    answer: 1
    explanation: "`-v` (invert) kehrt die Auswahl um: grep zeigt dann nur die Zeilen, auf die das Muster nicht passt. `-n` nummeriert, `-c` zählt und `-l` listet Dateinamen."
  - type: match
    question: Ordne jeder Option ihre Wirkung zu.
    pairs:
      - { left: "-i", right: "Groß- und Kleinschreibung ignorieren" }
      - { left: "-n", right: "Zeilennummer vor jeden Treffer schreiben" }
      - { left: "-c", right: "Nur die Anzahl der Trefferzeilen ausgeben" }
      - { left: "-r", right: "Alle Dateien in Unterordnern durchsuchen" }
      - { left: "-w", right: "Nur ganze Wörter finden" }
    explanation: Diese fünf Optionen brauchst du im Alltag ständig. Du kannst sie kombinieren, zum Beispiel `grep -rin fehler src`.
  - type: cloze
    text: "Das Muster `^ERROR` passt nur, wenn ERROR am ___ der Zeile steht. Das Zeichen `___` steht für das Zeilenende."
    blanks:
      - [Anfang, Zeilenanfang, Beginn]
      - [$]
    explanation: "`^` verankert das Muster am Zeilenanfang, `$` am Zeilenende. `^$` passt deshalb genau auf leere Zeilen."
  - type: find-bug
    question: Mia will alle Zeilen finden, in denen der Text `Zahlung fehlgeschlagen` vorkommt. grep meldet aber einen Fehler. In welcher Zeile steckt das Problem?
    language: bash
    code: |
      cd logs
      ls -l
      grep -n Zahlung fehlgeschlagen app.log
      echo "fertig"
    bug_line: 3
    explanation: "Ohne Anführungszeichen trennt die Shell an den Leerzeichen. grep sucht dann nach `Zahlung` in den Dateien `fehlgeschlagen` und `app.log` – die erste Datei gibt es nicht. Richtig ist `grep -n \"Zahlung fehlgeschlagen\" app.log`."
  - type: single
    question: Du führst `grep -q ERROR app.log` aus und danach `echo $?`. Die Ausgabe ist `1`. Was bedeutet das?
    options:
      - grep ist abgestürzt.
      - Die Datei app.log existiert nicht.
      - Keine Zeile in app.log enthält ERROR.
      - Genau eine Zeile enthält ERROR.
    answer: 2
    explanation: "grep endet mit 0, wenn mindestens eine Zeile gefunden wurde, mit 1, wenn nichts gefunden wurde, und mit 2 bei einem echten Fehler (z. B. fehlende Datei)."
tasks:
  - id: grep-optionen
    type: dragdrop
    title: Welche Option brauchst du?
    description: Ordne jede Aufgabe der grep-Option zu, die sie löst.
    targets:
      - { id: i, label: "-i" }
      - { id: v, label: "-v" }
      - { id: c, label: "-c" }
      - { id: l, label: "-l" }
      - { id: kontext, label: "-C 2" }
    items:
      - { label: "Finde „Fehler“, „FEHLER“ und „fehler“ gleichermaßen", target: i }
      - { label: "Blende alle DEBUG-Zeilen aus", target: v }
      - { label: "Wie viele Zeilen enthalten 404?", target: c }
      - { label: "In welchen Dateien steht TODO?", target: l }
      - { label: "Zeige jeden Treffer mit zwei Zeilen davor und danach", target: kontext }
    hints:
      - "-l steht für „list files“, -c für „count“."
  - id: grep-logs-auswerten
    type: terminal
    title: Fehler im Server-Log finden
    description: |
      Im Ordner `grep-logs` liegen eine Log-Datei `logs/app.log` und ein kleiner Quellcode-Ordner `src`
      mit JavaScript-Dateien.

      Mit `>` am Ende eines Befehls schreibst du dessen Ausgabe in eine Datei statt auf den Bildschirm
      (das lernst du in der Lektion zur Umleitung genauer). Beispiel: `grep -c INFO logs/app.log > info.txt`.

      1. Zähle, wie viele Zeilen in `logs/app.log` das Wort `ERROR` enthalten. Schreibe **nur die Zahl**
         in die Datei `fehler-anzahl.txt`.
      2. Suche alle Zeilen, die `timeout` enthalten – egal ob groß oder klein geschrieben – und schreibe
         sie in `timeouts.txt`.
      3. Finde heraus, in welchen Dateien unter `src` (inklusive Unterordnern) ein `TODO` steht. Schreibe
         nur die Dateinamen in `todo-dateien.txt`.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit die Dateien angelegt werden.
    workdir: grep-logs
    setup: |
      mkdir -p logs src/lib
      cat > logs/app.log <<'EOF'
      2026-10-01 08:00:01 INFO  Server gestartet auf Port 8080
      2026-10-01 08:00:05 INFO  Verbindung zur Datenbank hergestellt
      2026-10-01 08:12:44 WARN  Antwortzeit hoch: 2300 ms
      2026-10-01 08:15:02 ERROR Zahlung 4711 fehlgeschlagen: Timeout
      2026-10-01 08:15:03 INFO  Wiederhole Zahlung 4711
      2026-10-01 08:15:09 ERROR Zahlung 4711 fehlgeschlagen: timeout beim Anbieter
      2026-10-01 09:01:17 INFO  Benutzer user@example.com angemeldet
      2026-10-01 09:30:00 ERROR Datei /var/data/export.csv nicht gefunden
      2026-10-01 10:02:51 WARN  Cache fast voll (91 %)
      2026-10-01 10:45:12 ERROR Verbindung verloren: TIMEOUT nach 30 s
      2026-10-01 11:00:00 INFO  Naechtlicher Export geplant
      EOF
      printf 'function login() {\n  // TODO: Fehlertext uebersetzen\n  return true\n}\n' > src/login.js
      printf 'function zahle(betrag) {\n  // TODO: Waehrung pruefen\n  return betrag\n}\n' > src/zahlung.js
      printf 'export function rund(x) {\n  return Math.round(x)\n}\n' > src/utils.js
      printf 'export function heute() {\n  // TODO: Zeitzone beachten\n  return new Date()\n}\n' > src/lib/datum.js
    checks:
      - type: file_exists
        path: fehler-anzahl.txt
        message: Die Datei fehler-anzahl.txt fehlt noch. Hänge `> fehler-anzahl.txt` an deinen grep-Befehl.
      - type: command
        run: cat fehler-anzahl.txt
        stdout_matches: "^\\s*4\\s*$"
        message: In fehler-anzahl.txt soll nur die Anzahl der ERROR-Zeilen stehen. Tipp – die Option -c zählt.
      - type: command
        run: echo "$(grep -ic timeout timeouts.txt)/$(wc -l < timeouts.txt)"
        stdout_equals: 3/3
        message: timeouts.txt soll genau die drei Zeilen mit Timeout, timeout und TIMEOUT enthalten. Denk an -i.
      - type: command
        run: sort todo-dateien.txt | tr '\n' ' '
        stdout_matches: "^(\\./)?src/lib/datum\\.js (\\./)?src/login\\.js (\\./)?src/zahlung\\.js\\s*$"
        message: todo-dateien.txt soll nur die drei Dateinamen mit TODO enthalten (auch die im Unterordner). Kombiniere -r und -l.
    hints:
      - "Für die drei Schritte brauchst du die Optionen `-c`, `-i` sowie `-r` und `-l`."
      - "Schritt 1: `grep -c ERROR logs/app.log > fehler-anzahl.txt`."
      - "Schritt 3: `grep -rl TODO src > todo-dateien.txt` – `-r` durchsucht Unterordner, `-l` gibt nur Dateinamen aus."
    solution: |
      ```bash
      cd grep-logs
      grep -c ERROR logs/app.log > fehler-anzahl.txt
      grep -i timeout logs/app.log > timeouts.txt
      grep -rl TODO src > todo-dateien.txt
      cat fehler-anzahl.txt timeouts.txt todo-dateien.txt   # kontrollieren
      ```
---

Dein Webshop meldet nachts einen Fehler. Am Morgen liegt eine [[logdatei|Logdatei]] mit 80 000 Zeilen vor dir.
Irgendwo darin steht die eine Zeile, die erklärt, was passiert ist. Mit einem einzigen [[befehl|Befehl]]
hast du sie in einer Sekunde auf dem Bildschirm: `grep`.

## Was grep macht

[[grep]] ist ein Suchprogramm für Text. Du gibst ihm ein Suchmuster und eine oder mehrere
[[datei|Dateien]]. grep liest die Dateien Zeile für Zeile und gibt **jede Zeile aus, in der das Muster
vorkommt**. Alle anderen Zeilen lässt es weg.

Stell dir jemanden mit einem Textmarker vor, der ein dickes Buch durchgeht. Am Ende legt er dir nur die
markierten Zeilen hin. Das Buch selbst bleibt unverändert – grep liest Dateien nur, es ändert sie nie.

Die Grundform lautet immer: erst das Muster, dann die Datei.

```bash title="Terminal"
grep ERROR logs/app.log
```

```text title="Ausgabe"
2026-10-01 08:15:02 ERROR Zahlung 4711 fehlgeschlagen: Timeout
2026-10-01 08:15:09 ERROR Zahlung 4711 fehlgeschlagen: timeout beim Anbieter
2026-10-01 09:30:00 ERROR Datei /var/data/export.csv nicht gefunden
2026-10-01 10:45:12 ERROR Verbindung verloren: TIMEOUT nach 30 s
```

Drei Dinge solltest du von Anfang an wissen:

- Bei **mehreren Dateien** schreibt grep den Dateinamen vor jede Trefferzeile.
- Ohne Datei liest grep von der Tastatur oder aus einem anderen Befehl. Das wird bei Pipes wichtig.
- grep unterscheidet **Groß- und Kleinschreibung**. `error` findet also nicht `ERROR`.

## Die wichtigsten Optionen

Optionen stehen zwischen `grep` und dem Muster. Diese Tabelle deckt fast deinen ganzen Alltag ab:

| Option | Bedeutung | Beispiel |
|---|---|---|
| `-i` | Groß-/Kleinschreibung ignorieren | `grep -i timeout app.log` |
| `-n` | Zeilennummer vor jeden Treffer | `grep -n ERROR app.log` |
| `-v` | umkehren: nur Zeilen **ohne** Treffer | `grep -v DEBUG app.log` |
| `-c` | nur zählen, wie viele Zeilen passen | `grep -c ERROR app.log` |
| `-l` | nur Namen der Dateien mit Treffern | `grep -l TODO *.js` |
| `-r` | Ordner [[rekursiv]] durchsuchen | `grep -r TODO src` |
| `-w` | nur ganze Wörter | `grep -w log app.log` |
| `-o` | nur den passenden Teil zeigen | `grep -o "[0-9]* ms" app.log` |
| `-A 2` / `-B 2` / `-C 2` | 2 Zeilen nach / vor / um jeden Treffer | `grep -C 2 ERROR app.log` |

Optionen lassen sich kombinieren: `grep -rin todo src` durchsucht `src` samt allen Unterordnern, ignoriert
die Schreibweise und zeigt Zeilennummern. Rekursiv heißt: grep geht in jeden [[ordner|Ordner]] darin, und
in jeden Ordner darin, bis alles durchsucht ist.

Zwei Feinheiten werden oft übersehen. `-c` zählt **Zeilen**, nicht Vorkommen. Und `-w log` findet „log“,
aber nicht „login“. Mit `-A`, `-B` und `-C` siehst du, was rund um einen Fehler passiert ist. Liegen
mehrere Blöcke auseinander, trennt grep sie mit `--`.

> [!MERKSATZ]
> grep zeigt Zeilen, nicht Wörter. Optionen ändern nur, **welche** Zeilen gezeigt werden und **wie**.

## Muster in Anführungszeichen

Die [[shell|Shell]] zerlegt jede Befehlszeile an den Leerzeichen, bevor grep startet. Aus
`grep Zahlung fehlgeschlagen app.log` werden drei Teile: das Muster `Zahlung` und die Dateien
`fehlgeschlagen` und `app.log`. grep meldet dann, dass es `fehlgeschlagen` nicht gibt.

Die Lösung sind [[anfuehrungszeichen|Anführungszeichen]]. Alles dazwischen bleibt ein Stück:

```bash title="Mehrere Wörter als ein Muster"
grep "Zahlung 4711 fehlgeschlagen" logs/app.log
grep 'Preis: 5$' preise.txt
```

| Schreibweise | Was die Shell damit macht |
|---|---|
| `'…'` einfach | gar nichts – der sicherste Weg für Muster |
| `"…"` doppelt | ersetzt noch Variablen wie `$NAME` |

> [!FEHLER]
> **Sonderzeichen ohne Anführungszeichen.** Bei `grep *.log app.log` ersetzt die Shell `*.log` vorher
> durch passende Dateinamen. grep bekommt ein ganz anderes Muster, als du denkst. Setze Muster in
> Anführungszeichen, sobald sie mehr als ein einfaches Wort sind.

## Einfache reguläre Ausdrücke

Das Muster ist in Wahrheit ein [[regex|regulärer Ausdruck]]: eine kleine Sprache, um Textmuster zu
beschreiben. Einige Zeichen haben darin eine besondere Bedeutung:

| Zeichen | Bedeutung | Beispiel | passt auf |
|---|---|---|---|
| `^` | Zeilenanfang | `^2026-10-01` | Zeilen, die mit dem Datum beginnen |
| `$` | Zeilenende | `ms$` | Zeilen, die auf „ms“ enden |
| `.` | ein beliebiges Zeichen | `h.llo` | hallo, hello |
| `*` | Zeichen davor beliebig oft | `ab*c` | ac, abc, abbbc |
| `[ ]` | eins der Zeichen | `[0-9]` | eine Ziffer |

```bash title="Muster in der Praxis"
grep '^2026-10-01 09' logs/app.log      # alles zwischen 9 und 10 Uhr
grep -c '^$' notizen.txt                # Anzahl Leerzeilen
grep -E 'ERROR|WARN' logs/app.log       # -E erlaubt | für „oder“
```

Der Punkt ist ein Sonderzeichen. Suchst du einen echten Punkt, schreibst du `export\.csv`. Mit `-F` sucht
grep den Text ganz ohne Sonderzeichen.

## Gefunden oder nicht? Der Exit-Code

Jedes Programm meldet beim Beenden eine Zahl an die Shell, den [[exit-code|Exit-Code]]. Bei grep bedeutet sie:

| Exit-Code | Bedeutung |
|---|---|
| `0` | mindestens eine Zeile gefunden |
| `1` | nichts gefunden – kein Fehler, nur ein „Nein“ |
| `2` | echter Fehler, z. B. Datei fehlt |

Mit `echo $?` siehst du den Exit-Code des letzten Befehls. Mit `-q` (*quiet*) gibt grep nichts aus und
antwortet nur über den Exit-Code. Das nutzt man in [[skript|Skripten]].

```bash title="Ja oder nein?"
grep -q ERROR logs/app.log
echo $?      # 0 = ja, es gibt Fehler
```

> [!PRAXIS]
> `grep -rn` gehört zu den meistgenutzten Werkzeugen im Entwickleralltag. Du findest damit, wo ein
> Fehlertext herkommt oder wo eine Funktion aufgerufen wird: `grep -rn "Zahlung fehlgeschlagen" src`.

> [!TIPP]
> Im Übungs-Terminal gibt es kein `man`. Nutze `grep --help`. Auf einem normalen Linux oder macOS zeigt
> `man grep` die ausführliche Anleitung.

> [!TIPP]
> grep sucht **in** Dateien, [[find]] sucht **nach** Dateien – nach Name, Typ oder Alter, durch alle
> Unterordner: `find . -name "*.log"` listet alle Logdateien, `find . -type d` nur Ordner,
> `find . -name "*.tmp" -mtime +7` alle .tmp-Dateien, die älter als eine Woche sind. Fehlermeldungen
> zu gesperrten Ordnern blendest du mit `2> /dev/null` aus (dazu mehr in der nächsten Lektion).

## Zusammenfassung

- `find ordner -name "muster"` sucht Dateien nach Namen, grep sucht Text in Dateien.
- `grep MUSTER DATEI` gibt alle passenden Zeilen aus. Die Datei bleibt unverändert.
- `-i`, `-v`, `-n` und `-c` ignorieren Schreibweise, kehren um, nummerieren und zählen.
- `-r` sucht rekursiv, `-l` listet Dateinamen, `-w` ganze Wörter, `-C` zeigt Kontext.
- Muster mit Leerzeichen oder Sonderzeichen gehören in Anführungszeichen, am besten einfache.
- `^`, `$`, `.`, `*` und `[ ]` sind die wichtigsten Regex-Bausteine.
- Exit-Code 0 heißt gefunden, 1 nichts gefunden, 2 Fehler.
