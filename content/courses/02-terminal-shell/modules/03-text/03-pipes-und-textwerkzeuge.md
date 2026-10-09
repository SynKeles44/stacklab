---
title: Pipes und Textwerkzeuge
summary: Mit dem senkrechten Strich verbindest du kleine Werkzeuge wie sort, uniq, cut, tr und xargs zu Fließbändern, die in einer Zeile ganze Auswertungen erledigen.
duration: 25
sources:
  - title: Bash Reference Manual – Pipelines
    url: https://www.gnu.org/software/bash/manual/html_node/Pipelines.html
  - title: GNU Coreutils – sort, uniq, cut, tr
    url: https://www.gnu.org/software/coreutils/manual/html_node/index.html
  - title: xargs(1) – Linux manual page
    url: https://man7.org/linux/man-pages/man1/xargs.1.html
quiz:
  - type: single
    question: "`uniq -c namen.txt` zählt `Ada` zweimal einzeln, obwohl der Name nur zweimal in der Datei vorkommt – einmal am Anfang, einmal am Ende. Warum?"
    options:
      - uniq unterscheidet Groß- und Kleinschreibung.
      - uniq fasst nur direkt aufeinanderfolgende gleiche Zeilen zusammen. Die Datei muss vorher sortiert werden.
      - uniq zählt nur Zahlen, keine Namen.
      - "-c bedeutet „case“, nicht „count“."
    answer: 1
    explanation: "uniq vergleicht jede Zeile nur mit der direkt davor. Deshalb steht fast immer `sort` davor: `sort namen.txt | uniq -c`."
  - type: match
    question: Ordne jedem Befehl seine Wirkung zu.
    pairs:
      - { left: "sort -nr", right: "Zahlen absteigend sortieren" }
      - { left: "cut -d, -f2", right: "Zweite Spalte einer CSV-Zeile ausschneiden" }
      - { left: "tr a-z A-Z", right: "Kleinbuchstaben in Großbuchstaben umwandeln" }
      - { left: "wc -l", right: "Zeilen zählen" }
      - { left: "head -n 3", right: "Nur die ersten drei Zeilen durchlassen" }
    explanation: Jedes dieser Werkzeuge kann genau eine Sache gut. Die Stärke entsteht erst, wenn du sie mit Pipes verbindest.
  - type: cloze
    text: "In `ls | wc -l` verbindet die ___ die Standardausgabe von ls mit der Standardeingabe von ___."
    blanks:
      - [Pipe, Pipeline]
      - [wc, "wc -l"]
    explanation: Der senkrechte Strich heißt Pipe. Was links auf stdout geschrieben wird, liest das Programm rechts von stdin.
  - type: find-bug
    question: Die Pipeline soll die drei häufigsten Produkte zeigen. Sie liefert aber jedes Produkt mit der Zahl 1. Welche Zeile ist falsch?
    language: bash
    code: |
      tail -n +2 bestellungen.csv \
        | cut -d, -f3 \
        | uniq -c \
        | sort -nr \
        | head -n 3
    bug_line: 3
    explanation: "Vor `uniq -c` fehlt `sort`. Ohne Sortierung stehen gleiche Produkte nicht direkt untereinander, und uniq zählt jede Zeile einzeln. Richtig: `| sort | uniq -c`."
  - type: single
    question: 'Was gibt `printf ''a.txt\nb.txt\n'' | xargs -I {} echo "Datei: {}"` aus?'
    options:
      - "`Datei: {}` zweimal"
      - "`Datei: a.txt` und `Datei: b.txt` in zwei Zeilen"
      - "`Datei: a.txt b.txt` in einer Zeile"
      - Eine Fehlermeldung, weil echo keine Eingabe liest
    answer: 1
    explanation: "Mit `-I {}` startet xargs den Befehl einmal pro Eingabezeile und setzt die Zeile an der Stelle von `{}` ein."
tasks:
  - id: pipeline-reihenfolge
    type: order
    title: Baue die Top-3-Pipeline
    description: Du willst aus `zugriffe.log` die drei IP-Adressen mit den meisten Zugriffen ermitteln. Die IP steht in der ersten Spalte, getrennt durch Leerzeichen. Bringe die Stationen der Pipeline in die richtige Reihenfolge.
    items:
      - "cat zugriffe.log"
      - "cut -d' ' -f1"
      - "sort"
      - "uniq -c"
      - "sort -nr"
      - "head -n 3"
    hints:
      - "uniq braucht sortierte Eingabe, und die Rangliste entsteht erst, nachdem gezählt wurde."
  - id: bestellungen-auswerten
    type: terminal
    title: Bestellungen auswerten
    description: |
      Im Ordner `pipes-bestellungen` liegt die Datei `bestellungen.csv`. Die erste Zeile ist eine
      Kopfzeile (`datum,kunde,produkt,menge`), danach folgt eine Bestellung pro Zeile. Außerdem gibt es
      einen Ordner `export` und eine Datei `veraltet.txt`, die drei Dateinamen aus `export` auflistet.

      1. Schreibe die Anzahl der Bestellungen (**ohne** Kopfzeile) in `anzahl-bestellungen.txt`.
      2. Schreibe die Anzahl der **verschiedenen** Kunden in `anzahl-kunden.txt`.
      3. Schreibe die drei am häufigsten bestellten Produkte mit ihrer Anzahl in `top-produkte.txt`
         (häufigstes zuerst, Format wie bei `uniq -c`, also z. B. `      6 Kaffee`).
      4. Lösche mit `xargs` genau die Dateien, die in `veraltet.txt` stehen. Wechsle dafür in den Ordner
         `export` oder setze den Pfad davor.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit die Daten angelegt werden.
    workdir: pipes-bestellungen
    setup: |
      cat > bestellungen.csv <<'EOF'
      datum,kunde,produkt,menge
      2026-10-01,kunde-01,Kaffee,2
      2026-10-01,kunde-02,Tee,1
      2026-10-01,kunde-03,Kaffee,1
      2026-10-02,kunde-01,Kakao,3
      2026-10-02,kunde-04,Kaffee,1
      2026-10-02,kunde-05,Saft,2
      2026-10-03,kunde-02,Tee,2
      2026-10-03,kunde-06,Kaffee,4
      2026-10-03,kunde-07,Wasser,6
      2026-10-04,kunde-03,Kakao,1
      2026-10-04,kunde-08,Tee,1
      2026-10-04,kunde-01,Kaffee,2
      2026-10-05,kunde-09,Saft,1
      2026-10-05,kunde-04,Tee,3
      2026-10-05,kunde-05,Kakao,2
      2026-10-05,kunde-06,Kaffee,1
      EOF
      mkdir -p export
      for n in 01 02 03 04 05; do printf 'Rechnung %s\n' "$n" > "export/rechnung-$n.txt"; done
      printf 'rechnung-01.txt\nrechnung-02.txt\nrechnung-03.txt\n' > veraltet.txt
    checks:
      - type: command
        run: cat anzahl-bestellungen.txt
        stdout_matches: "^\\s*16\\s*$"
        message: In anzahl-bestellungen.txt soll 16 stehen. Lass die Kopfzeile weg, z. B. mit tail -n +2, und zähle mit wc -l.
      - type: command
        run: cat anzahl-kunden.txt
        stdout_matches: "^\\s*9\\s*$"
        message: In anzahl-kunden.txt soll die Zahl der verschiedenen Kunden stehen (9). Schneide Spalte 2 aus und nutze sort -u.
      - type: command
        run: wc -l < top-produkte.txt
        stdout_matches: "^\\s*3\\s*$"
        message: top-produkte.txt soll genau drei Zeilen haben. Begrenze mit head -n 3.
      - type: command
        run: head -n 1 top-produkte.txt
        stdout_matches: "^\\s*6\\s+Kaffee\\s*$"
        message: Die erste Zeile von top-produkte.txt soll "6 Kaffee" sein. Sortiere vor uniq -c und danach mit sort -nr.
      - type: command
        run: sed -n '2p;3p' top-produkte.txt | tr -s ' ' | sed 's/^ //' | tr '\n' '|'
        stdout_matches: "^4 Tee\\|3 Kakao\\|$"
        message: Auf Platz zwei und drei sollen Tee (4) und Kakao (3) stehen.
      - type: command
        run: ls export | tr '\n' ' '
        stdout_matches: "^rechnung-04\\.txt rechnung-05\\.txt\\s*$"
        message: Im Ordner export sollen nur noch rechnung-04.txt und rechnung-05.txt liegen. Gib den Inhalt von veraltet.txt an xargs rm weiter.
    hints:
      - "Baue jede Pipeline Schritt für Schritt auf und schau dir nach jeder Station das Zwischenergebnis an. Erst ganz am Ende hängst du `> datei.txt` an."
      - "Kunden: `tail -n +2 bestellungen.csv | cut -d, -f2 | sort -u | wc -l`. Produkte: `… | cut -d, -f3 | sort | uniq -c | sort -nr | head -n 3`."
      - "Löschen: `cd export`, dann `xargs rm < ../veraltet.txt` – oder ohne Ordnerwechsel `sed 's|^|export/|' veraltet.txt | xargs rm`."
    solution: |
      ```bash
      cd pipes-bestellungen
      tail -n +2 bestellungen.csv | wc -l > anzahl-bestellungen.txt
      tail -n +2 bestellungen.csv | cut -d, -f2 | sort -u | wc -l > anzahl-kunden.txt
      tail -n +2 bestellungen.csv | cut -d, -f3 | sort | uniq -c | sort -nr | head -n 3 > top-produkte.txt
      cd export
      xargs rm < ../veraltet.txt
      cd ..
      ```
---

Deine Chefin fragt: „Welches Produkt wurde letzte Woche am häufigsten bestellt?“ Die Antwort steckt in einer
Datei mit tausenden Zeilen. Es gibt kein einzelnes Programm, das genau diese Frage beantwortet. Aber es gibt
fünf kleine Programme, die jeweils einen Teil können. Wenn du sie hintereinanderschaltest, hast du die
Antwort in einer einzigen Zeile.

## Die Pipe: ein Fließband aus Befehlen

Der senkrechte Strich `|` heißt [[pipe|Pipe]], auf Deutsch Rohr. Er verbindet zwei Befehle: Die
[[standardausgabe|Standardausgabe]] des linken Befehls wird direkt zur [[standardeingabe|Standardeingabe]]
des rechten. Nichts landet auf dem Bildschirm oder in einer Zwischendatei.

Denk an ein Fließband in einer Fabrik. Jede Station macht genau einen Handgriff und schiebt das Werkstück
weiter. Die erste Station schneidet zu, die zweite sortiert, die dritte zählt. Keine Station muss wissen, was
die anderen tun. Mehrere Befehle, die so verbunden sind, nennt man eine [[pipeline|Pipeline]].

```bash title="Erste Pipes"
ls | wc -l                    # Wie viele Einträge hat der Ordner?
grep ERROR app.log | wc -l    # Wie viele Fehlerzeilen?
history | grep git            # Welche git-Befehle habe ich getippt?
```

Alle Programme einer Pipeline laufen gleichzeitig. Die Daten fließen Zeile für Zeile hindurch, sobald sie
entstehen. Deshalb funktionieren Pipes auch mit riesigen Dateien, die nie komplett in den Arbeitsspeicher
passen würden.

Programme, die so gebaut sind, dass sie Text von stdin lesen, ihn verändern und auf stdout ausgeben, nennt
man [[filter|Filter]]. Fast alle Werkzeuge dieser Lektion sind Filter. Das ist die berühmte Unix-Idee:
viele kleine Werkzeuge, die je eine Sache gut können und sich über Text verbinden lassen.

![Eine Pipeline als Fließband: tail, cut, sort, uniq, sort und head verarbeiten die Bestellungen Station für Station](/assets/terminal-shell/text-pipeline.svg)

> [!MERKSATZ]
> Durch eine Pipe fließt nur die **Standardausgabe**. Fehlermeldungen auf stderr landen weiterhin im
> Terminal. Willst du sie mitschicken, schreibst du `2>&1` vor die Pipe.

## CSV-Daten zerlegen: cut und tr

Unser Beispiel ist eine [[csv|CSV]]-Datei (*comma-separated values*): eine Zeile pro Datensatz, Spalten
durch Kommas getrennt, oben eine Kopfzeile. Tabellenprogramme und viele Systeme exportieren dieses Format.

```text title="bestellungen.csv"
datum,kunde,produkt,menge
2026-10-01,kunde-01,Kaffee,2
2026-10-01,kunde-02,Tee,1
```

Die Kopfzeile stört beim Zählen. `tail -n +2` gibt alles **ab** Zeile 2 aus. Ohne Plus wären es die
letzten zwei Zeilen.

`cut` schneidet Teile aus jeder Zeile: `-d` legt das Trennzeichen fest, `-f` die Spalten, `-c` Zeichenpositionen.

```bash title="cut"
cut -d, -f3 bestellungen.csv          # nur die Produkte
cut -d, -f2,3 bestellungen.csv        # Kunde und Produkt
cut -c 1-10 bestellungen.csv          # die ersten 10 Zeichen
```

`tr` ersetzt einzelne Zeichen. Es liest nur von stdin, deshalb steht es fast immer hinter einer Pipe.

```bash title="tr"
echo "hallo welt" | tr a-z A-Z        # HALLO WELT
echo "a,b,c" | tr , '\n'              # Kommas werden Zeilenumbrüche
echo "zu    viele" | tr -s ' '         # -s: Wiederholungen zusammenfassen
echo "4,99 €" | tr -d '€'              # -d: Zeichen löschen
```

## Sortieren, zählen, begrenzen: sort, uniq, wc, head

`sort` sortiert Zeilen. Ohne Optionen sortiert es alphabetisch. Das führt bei Zahlen zu Überraschungen,
denn alphabetisch kommt „10“ vor „9“. Die wichtigsten Optionen:

| Option | Bedeutung |
|---|---|
| `-n` | numerisch sortieren (2 vor 10) |
| `-r` | umgekehrte Reihenfolge |
| `-u` | doppelte Zeilen nur einmal ausgeben |
| `-t,` | Spalten sind durch Kommas getrennt |
| `-k4` | nach der vierten Spalte sortieren |

`sort -t, -k4 -n bestellungen.csv` sortiert also die Bestellungen nach der Menge.

`uniq` fasst gleiche Zeilen zusammen, **aber nur, wenn sie direkt untereinander stehen**. Mit `-c` schreibt
es vor jede Zeile, wie oft sie hintereinander vorkam. Weil uniq nur Nachbarn vergleicht, steht davor fast
immer ein `sort`.

`wc -l` zählt Zeilen, `head -n 3` lässt nur die ersten drei Zeilen durch, `tail -n 3` die letzten drei.

> [!FEHLER]
> **uniq ohne sort.** `cut -d, -f3 bestellungen.csv | uniq -c` liefert eine lange Liste mit vielen Einsen,
> weil gleiche Produkte verstreut in der Datei stehen. Die Reihenfolge `sort | uniq -c` ist ein festes
> Paar – merke sie dir als Einheit.

## Eine Top-3-Auswertung Schritt für Schritt

Jetzt setzen wir alles zusammen. Der wichtigste Trick dabei: **Baue Pipelines Station für Station auf.**
Hänge immer nur ein Werkzeug an, drücke Enter und schau dir das Zwischenergebnis an. Mit der Pfeiltaste nach
oben holst du den letzten Befehl zurück und erweiterst ihn.

```bash title="Station für Station"
tail -n +2 bestellungen.csv                          # 1. Kopfzeile weg
tail -n +2 bestellungen.csv | cut -d, -f3            # 2. nur die Produkte
tail -n +2 bestellungen.csv | cut -d, -f3 | sort     # 3. gleiche Produkte untereinander
… | sort | uniq -c                                   # 4. zählen
… | sort | uniq -c | sort -nr                        # 5. größte Zahl zuerst
… | sort | uniq -c | sort -nr | head -n 3            # 6. die besten drei
```

```text title="Ergebnis"
      6 Kaffee
      4 Tee
      3 Kakao
```

Die Leerzeichen am Anfang stammen von `uniq -c`. Es rückt die Zahlen ein, damit sie rechtsbündig stehen.
Willst du das Ergebnis speichern, hängst du ganz am Ende `> top-produkte.txt` an. Eine Umleitung gehört
immer zur letzten Station.

Lange Pipelines darfst du übrigens auf mehrere Zeilen verteilen. Ein Backslash am Zeilenende sagt der
Shell, dass der Befehl in der nächsten Zeile weitergeht. Das macht Skripte deutlich lesbarer.

## Aus Zeilen Argumente machen: xargs

Manche Befehle lesen gar nicht von stdin. `rm`, `mkdir` oder `touch` wollen ihre Dateinamen als
Argumente. `cat liste.txt | rm` tut deshalb nichts Sinnvolles. Hier kommt [[xargs]] ins Spiel: Es liest
Zeilen von stdin und hängt sie als Argumente an einen Befehl an.

```bash title="xargs verbindet Listen mit Befehlen"
cat veraltet.txt | xargs rm                 # rm datei1 datei2 datei3
cat ordner.txt | xargs mkdir -p             # legt alle Ordner an
cat dateien.txt | xargs -n 1 wc -l          # -n 1: ein Aufruf pro Datei
cat namen.txt | xargs -I {} touch "{}.md"   # -I {}: Platzhalter einsetzen
cat veraltet.txt | xargs echo rm            # Trockenlauf: zeigt nur den Befehl
```

Ohne weitere Optionen sammelt xargs alle Zeilen und ruft den Befehl so selten wie möglich auf. Mit `-n 1`
startet es ihn einmal pro Eintrag. Mit `-I {}` kannst du festlegen, an welcher Stelle der Eintrag
eingesetzt wird. Das vorangestellte `echo` ist ein guter Trockenlauf, bevor du etwas löschst.

> [!ACHTUNG]
> xargs trennt standardmäßig an Leerzeichen. Ein Dateiname wie `meine notizen.txt` wird zu zwei Argumenten.
> Kommt die Liste von find, nutze deshalb `find … -print0 | xargs -0 …`. Dabei trennt ein Nullzeichen die Namen statt eines Zeilenumbruchs.

> [!PRAXIS]
> Solche Einzeiler sind im Berufsalltag Gold wert. Wenn ein Server plötzlich langsam wird, findet
> `cut -d' ' -f1 access.log | sort | uniq -c | sort -nr | head` in Sekunden heraus, ob eine einzelne
> IP-Adresse ungewöhnlich viele Anfragen schickt. Für so eine Frage musst du keine Auswertungs-Software
> öffnen.

## Zusammenfassung

- Die Pipe `|` verbindet stdout des linken Befehls mit stdin des rechten. Mehrere verbundene Befehle bilden eine Pipeline.
- `cut -d -f` schneidet Spalten aus, `tr` ersetzt oder löscht einzelne Zeichen.
- `sort` sortiert (`-n` numerisch, `-r` rückwärts, `-u` eindeutig, `-t` und `-k` für Spalten).
- `uniq -c` zählt gleiche Zeilen, braucht aber sortierte Eingabe: `sort | uniq -c`.
- `wc -l`, `head` und `tail` zählen und begrenzen. `tail -n +2` überspringt eine Kopfzeile.
- Baue Pipelines Station für Station auf und prüfe jedes Zwischenergebnis.
- `xargs` macht aus Eingabezeilen Argumente, `-n 1` und `-I {}` steuern, wie.
