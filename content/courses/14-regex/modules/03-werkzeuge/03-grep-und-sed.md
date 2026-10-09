---
title: Regex im Terminal – grep und sed
summary: Mit grep -E durchsuchst und zählst du Dateien, mit sed -E baust du Zeilen per Suchen und Ersetzen um – ohne eine einzige Zeile Code zu schreiben.
duration: 25
sources:
  - title: GNU grep Manual
    url: https://www.gnu.org/software/grep/manual/grep.html
  - title: GNU sed Manual – The s Command
    url: https://www.gnu.org/software/sed/manual/sed.html#The-_0022s_0022-Command
  - title: GNU sed Manual – BRE vs. ERE
    url: https://www.gnu.org/software/sed/manual/sed.html#BRE-vs-ERE
quiz:
  - type: match
    question: Welche grep-Option bewirkt was?
    pairs:
      - { left: "-E", right: "erweiterte Regex (ERE) verwenden" }
      - { left: "-o", right: "nur den passenden Teil ausgeben" }
      - { left: "-c", right: "passende Zeilen zählen" }
      - { left: "-v", right: "nicht passende Zeilen ausgeben" }
      - { left: "-i", right: "Groß-/Kleinschreibung ignorieren" }
      - { left: "-n", right: "Zeilennummern voranstellen" }
    explanation: Die Optionen lassen sich kombinieren, z. B. `grep -inE` oder `grep -cvE`.
  - type: single
    question: "Was gibt `echo 'Datum: 2026-10-09' | sed -E 's/([0-9]{4})-([0-9]{2})-([0-9]{2})/\\3.\\2.\\1/'` aus?"
    options:
      - "Datum: 09.10.2026"
      - "Datum: 2026-10-09"
      - "09.10.2026"
      - "Datum: \\3.\\2.\\1"
    answer: 0
    explanation: "sed ersetzt nur den passenden Teil der Zeile; der Rest bleibt stehen. Im Ersatz stehen `\\1` bis `\\3` für die Gruppen."
  - type: find-bug
    question: "Das Kommando soll alle Zeilen mit einer Bestellnummer wie „B-1042“ finden, gibt aber nichts aus. In welcher Zeile liegt der Fehler?"
    language: bash
    code: |
      cd logs
      grep -E 'B-\d{4}' app.log
      echo "fertig"
    bug_line: 2
    explanation: "`grep -E` kennt die Kurzschreibweise `\\d` nicht – es sucht nach einem normalen „d“. Richtig: `grep -E 'B-[0-9]{4}' app.log` (oder `grep -P` für Perl-Syntax)."
  - type: multiple
    question: Welche Aussagen über `sed -E 's/alt/neu/g' datei.txt` stimmen?
    options:
      - Das Ergebnis erscheint auf der Standardausgabe, die Datei bleibt unverändert
      - "Das `g` ersetzt alle Treffer pro Zeile statt nur des ersten"
      - Ohne -E müsstest du Gruppen als \( \) schreiben
      - sed liest die ganze Datei als einen einzigen String
    answers: [0, 1, 2]
    explanation: "sed arbeitet zeilenweise und schreibt nach stdout. Erst `-i` ändert die Datei selbst. Ohne `-E` spricht sed die Basis-Syntax (BRE), in der Gruppen und Quantoren wie `+` einen Backslash brauchen."
tasks:
  - id: log-statistik
    type: terminal
    title: Eine Log-Statistik mit grep
    description: |
      Im Ordner `grep-logs` liegt die Logdatei `app.log`. Erstelle mit `grep` (und Pipes) drei Dateien:

      1. `fehler-anzahl.txt` – nur die **Anzahl** der Zeilen mit dem Level `[ERROR]`.
      2. `level-statistik.txt` – für jedes Level, wie oft es vorkommt, im Format von `uniq -c`, also z. B.
         `      6 [ERROR]`. Die Zeile „WARNING …“ ohne Level zählt nicht mit.
      3. `langsam.txt` – alle Zeilen, deren Dauer bei `took …ms` **mindestens 1000 ms** beträgt.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit die Logdatei angelegt wird.
    workdir: grep-logs
    setup: |
      cat > app.log <<'LOG'
      2026-10-01 08:00:01 [INFO] auth: User 1042 logged in from 192.0.2.15
      2026-10-01 08:00:07 [INFO] http: GET /products 200 took 87ms
      2026-10-01 08:01:13 [WARN] cache: Miss for key product:77 took 312ms
      2026-10-01 08:02:45 [ERROR] db: Query timeout after 5000ms
      2026-10-01 08:03:02 [INFO] http: GET /cart 200 took 45ms
      2026-10-01 08:03:10 [ERROR] payment: Card declined for order 5531
      2026-10-01 08:04:22 [INFO] auth: User 2210 logged in from 198.51.100.7
      2026-10-01 08:05:00 [WARN] http: GET /search 200 took 1450ms
      2026-10-01 08:05:31 [ERROR] db: Query timeout after 5000ms
      2026-10-01 08:06:12 [INFO] http: POST /orders 201 took 230ms
      2026-10-01 08:06:13 [INFO] mail: Sent confirmation to user@example.com
      2026-10-01 08:07:40 [ERROR] payment: Card declined for order 5540
      2026-10-01 08:08:05 [WARN] auth: Failed login for user 1042 from 203.0.113.9
      2026-10-01 08:08:09 [WARN] auth: Failed login for user 1042 from 203.0.113.9
      2026-10-01 08:09:55 [ERROR] db: Query timeout after 7500ms
      2026-10-01 08:10:30 [INFO] http: GET /products 200 took 92ms
      2026-10-01 08:11:02 [DEBUG] cache: Warmup finished
      2026-10-01 08:11:47 [ERROR] http: GET /checkout 500 took 3021ms
      WARNING: disk almost full
      2026-10-01 08:12:00 [INFO] auth: User 2210 logged out
      LOG
    checks:
      - type: command
        run: cat fehler-anzahl.txt
        stdout_matches: "^\\s*6\\s*$"
        message: In fehler-anzahl.txt soll nur die Zahl 6 stehen. Zähle mit `grep -c` die Zeilen mit [ERROR].
      - type: command
        run: sed -E 's/^\s+//; s/\s+/ /g; s/[][]//g' level-statistik.txt | sort -k2 | tr '\n' ';'
        stdout_equals: "1 DEBUG;6 ERROR;8 INFO;4 WARN;"
        message: "level-statistik.txt stimmt noch nicht. Erwartet: DEBUG 1, ERROR 6, INFO 8, WARN 4. Hole die Level mit grep -oE, sortiere sie und zähle mit uniq -c."
      - type: command
        run: wc -l < langsam.txt
        stdout_matches: "^\\s*2\\s*$"
        message: langsam.txt soll genau 2 Zeilen enthalten – die Anfragen mit 1450 ms und 3021 ms.
      - type: command
        run: grep -c -e 'took 1450ms' -e 'took 3021ms' langsam.txt
        stdout_equals: "2"
        message: In langsam.txt fehlen die Zeilen mit 1450ms oder 3021ms. Mindestens 1000 heißt mindestens vier Ziffern.
    hints:
      - "`grep -c '\\[ERROR\\]' app.log > fehler-anzahl.txt` – für die Statistik brauchst du `-o`."
      - "`grep -oE '\\[[A-Z]+\\]' app.log | sort | uniq -c > level-statistik.txt`"
      - "Mindestens 1000 ms sind mindestens vier Ziffern: `grep -E 'took [0-9]{4,}ms' app.log > langsam.txt`"
    solution: |
      ```bash
      cd grep-logs
      grep -c '\[ERROR\]' app.log > fehler-anzahl.txt
      grep -oE '\[[A-Z]+\]' app.log | sort | uniq -c > level-statistik.txt
      grep -E 'took [0-9]{4,}ms' app.log > langsam.txt
      cat fehler-anzahl.txt level-statistik.txt langsam.txt
      ```
  - id: csv-umbauen
    type: terminal
    title: Eine CSV-Datei mit sed umbauen
    description: |
      Im Ordner `sed-umbau` liegt `kunden.csv` mit Testdaten. Die Datumsangaben sind im Format `JJJJ-MM-TT`,
      die Telefonnummern stehen vollständig darin.

      Erzeuge mit **einem** `sed -E`-Aufruf (gern mit zwei `-e`-Ausdrücken) die Datei `kunden-de.csv`:

      1. Jedes Datum wird zu `TT.MM.JJJJ`.
      2. Jede Telefonnummer wird bis auf die Ländervorwahl unkenntlich: aus `+49 151 2345678` wird `+49 ***`.
      3. `kunden.csv` selbst bleibt **unverändert** – nutze kein `-i`, sondern eine Umleitung.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit die Datei angelegt wird.
    workdir: sed-umbau
    setup: |
      cat > kunden.csv <<'CSV'
      id;name;geburtstag;telefon
      1;Ada Lovelace;1815-12-10;+49 151 2345678
      2;Grace Hopper;1906-12-09;+49 160 9876543
      3;Alan Turing;1912-06-23;+44 20 7946000
      CSV
    checks:
      - type: file_exists
        path: kunden-de.csv
        message: Die Datei kunden-de.csv fehlt noch. Leite die Ausgabe von sed mit > um.
      - type: command
        run: tr '\n' '|' < kunden-de.csv
        stdout_equals: "id;name;geburtstag;telefon|1;Ada Lovelace;10.12.1815;+49 ***|2;Grace Hopper;09.12.1906;+49 ***|3;Alan Turing;23.06.1912;+44 ***|"
        message: "kunden-de.csv stimmt noch nicht. Jede Zeile soll z. B. so aussehen: 1;Ada Lovelace;10.12.1815;+49 ***. Die Kopfzeile bleibt unverändert."
      - type: command
        run: grep -c '1815-12-10' kunden.csv
        stdout_equals: "1"
        message: kunden.csv wurde verändert. Stelle sie mit „Aufgabe vorbereiten“ wieder her und schreibe das Ergebnis per Umleitung in eine neue Datei.
    hints:
      - "Das Datum kennst du schon: `s/([0-9]{4})-([0-9]{2})-([0-9]{2})/\\3.\\2.\\1/`."
      - "Telefon: Plus und Ziffern der Vorwahl merken, den Rest bis zum Zeilenende ersetzen. Das `+` ist in ERE ein Metazeichen und braucht einen Backslash."
      - "`sed -E -e 's/…/…/' -e 's/(\\+[0-9]+) [0-9 ]+$/\\1 ***/' kunden.csv > kunden-de.csv`"
    solution: |
      ```bash
      cd sed-umbau
      sed -E \
        -e 's/([0-9]{4})-([0-9]{2})-([0-9]{2})/\3.\2.\1/' \
        -e 's/(\+[0-9]+) [0-9 ]+$/\1 ***/' \
        kunden.csv > kunden-de.csv
      cat kunden-de.csv
      ```
---
Ein [[server|Server]] meldet Fehler, und du hast nur ein [[terminal|Terminal]] und eine 200 MB große Logdatei. Ein Skript zu
schreiben dauert – mit [[grep]] und [[sed]] hast du die Antwort in einer Zeile. Beide Werkzeuge sind auf
praktisch jedem Linux- und macOS-System vorhanden.

## Zwei Dialekte: BRE und ERE

`grep` und `sed` verstehen ohne Option die **Basis-Syntax** (BRE). Dort brauchen Gruppen, `+`, `?`, `|` und
`{}` einen Backslash. Mit `-E` schaltest du auf die **erweiterte** Syntax [[posix-ere|ERE]] um – sie sieht
fast aus wie in JavaScript.

| Ziel | BRE (ohne -E) | ERE (mit -E) |
|---|---|---|
| eins oder mehr | `a\+` | `a+` |
| Gruppe | `\(ab\)` | `(ab)` |
| Anzahl | `[0-9]\{4\}` | `[0-9]{4}` |

Für „oder“ schreibst du in BRE `\|`, in ERE einfach `|`.

> [!MERKSATZ]
> Gewöhne dir **`grep -E` und `sed -E`** an. Dann gilt fast alles, was du in diesem Kurs gelernt hast –
> mit einer Ausnahme: `\d` gibt es nicht, nimm `[0-9]`.

GNU grep kennt außerdem `-P` für Perl-kompatible Muster mit `\d` und Lookarounds. Auf macOS fehlt `-P`
im mitgelieferten grep allerdings – `-E` funktioniert überall.

## grep: suchen, zählen, herausschneiden

`grep` gibt jede Zeile aus, in der das Muster vorkommt. Mit Optionen steuerst du das Ergebnis:

| Option | Wirkung |
|---|---|
| `-E` | erweiterte Regex |
| `-i` | Groß-/Kleinschreibung egal |
| `-v` | nicht passende Zeilen |
| `-c` | Anzahl passender Zeilen |
| `-o` | nur der Treffer, einer pro Zeile |
| `-n` | mit Zeilennummer |
| `-r` | ganze Ordner durchsuchen |

```bash title="Terminal"
grep -c '\[ERROR\]' app.log                       # 6
grep -nE 'took [0-9]{4,}ms' app.log               # langsame Anfragen mit Zeilennummer
grep -rE 'TODO|FIXME' src/                         # offene Punkte im Code
```

Setze Muster immer in **einfache Anführungszeichen**. Sonst versucht die Shell, Zeichen wie `*`, `$` oder
`\` selbst zu deuten.

## grep in Pipelines

Richtig stark wird `grep -o` zusammen mit anderen Programmen über die [[pipe|Pipe]]:

```bash title="Terminal"
grep -oE '\[[A-Z]+\]' app.log | sort | uniq -c
```

```text title="Ausgabe"
      1 [DEBUG]
      6 [ERROR]
      8 [INFO]
      4 [WARN]
```

1. `grep -oE` schneidet nur die Level heraus.
2. `sort` sortiert sie, damit gleiche Werte nebeneinanderstehen.
3. `uniq -c` fasst gleiche Zeilen zusammen und zählt sie.

> [!PRAXIS]
> Bei einem Vorfall lautet die erste Frage oft: „Seit wann und wie oft?“ Mit
> `grep -oE '^[0-9-]+ [0-9]{2}' app.log | uniq -c` siehst du die Einträge pro Stunde – der Ausreißer springt
> sofort ins Auge.

## sed: Suchen und Ersetzen im Datenstrom

[[sed]] ist ein *Stream Editor*: Er liest Zeile für Zeile, wendet Befehle an und gibt das Ergebnis aus. Der
wichtigste Befehl ist `s` (substitute):

```text
s/MUSTER/ERSATZ/FLAGS
```

```bash title="Terminal"
echo "Datum: 2026-10-09" | sed -E 's/([0-9]{4})-([0-9]{2})-([0-9]{2})/\3.\2.\1/'
# Datum: 09.10.2026
```

| Teil | Bedeutung |
|---|---|
| `\1`, `\2` … | Capture-Gruppen im Ersatz |
| `&` | der gesamte Treffer |
| Flag `g` | alle Treffer pro Zeile, nicht nur den ersten |
| Flag `I` | Groß-/Kleinschreibung egal (GNU sed) |

Auch bei sed ist der Begrenzer frei wählbar: `s#/alt/pfad#/neu/pfad#g` spart Backslashes.

## sed sicher einsetzen

Standardmäßig schreibt sed nach `stdout` – die Datei bleibt unverändert. Erst `-i` (*in place*) überschreibt
sie:

```bash title="Terminal"
sed -E 's/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/<ip>/g' app.log > anonym.log   # neue Datei
sed -E -i.bak 's/DEBUG/INFO/' app.log                                   # ändert app.log, Kopie in app.log.bak
sed -nE '/\[ERROR\]/p' app.log                                         # wie grep: nur passende Zeilen
```

`-n` schaltet die automatische Ausgabe ab, `p` gibt nur die passenden Zeilen aus. Mehrere Ersetzungen
verbindest du mit `-e 's/…/…/' -e 's/…/…/'`.

> [!FEHLER]
> **`sed -i` ohne Probelauf.** Ein falsches Muster zerstört die Datei in Sekunden – oft Hunderte Dateien
> gleichzeitig, wenn `find` oder `xargs` im Spiel sind. Teste immer zuerst ohne `-i` und prüfe die Ausgabe.
> Auf macOS verlangt `sed -i` zudem ein Argument, z. B. `sed -i '' …`.

## Zusammenfassung

- `grep -E` und `sed -E` nutzen die erweiterte Syntax (ERE) – `\d` gibt es dort nicht, `[0-9]` schon.
- `grep` filtert Zeilen; `-c` zählt, `-o` schneidet heraus, `-v` dreht um, `-n` nummeriert, `-r` durchsucht Ordner.
- Mit `grep -o … | sort | uniq -c` baust du in einer Zeile eine Häufigkeitsstatistik.
- `sed -E 's/muster/ersatz/g'` ersetzt zeilenweise; `\1` und `&` stehen für Gruppen und den Treffer.
- sed schreibt nach stdout – `-i` ändert die Datei selbst, also vorher ohne `-i` testen.
