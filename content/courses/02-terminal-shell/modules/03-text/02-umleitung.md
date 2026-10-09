---
title: Ein- und Ausgabe umleiten
summary: Jeder Befehl hat drei Datenkanäle. Du lernst, wie du Ausgaben in Dateien schreibst, Fehler getrennt auffängst, Dateien als Eingabe nutzt und Ausgaben mit tee gleichzeitig speicherst und anzeigst.
duration: 20
sources:
  - title: Bash Reference Manual – Redirections
    url: https://www.gnu.org/software/bash/manual/html_node/Redirections.html
  - title: stdin(3) – Linux manual page
    url: https://man7.org/linux/man-pages/man3/stdin.3.html
  - title: GNU Coreutils – tee invocation
    url: https://www.gnu.org/software/coreutils/manual/html_node/tee-invocation.html
quiz:
  - type: match
    question: Ordne jeder Schreibweise ihre Wirkung zu.
    pairs:
      - { left: "befehl > datei", right: "Standardausgabe in die Datei, alter Inhalt wird überschrieben" }
      - { left: "befehl >> datei", right: "Standardausgabe ans Ende der Datei anhängen" }
      - { left: "befehl 2> datei", right: "Nur die Fehlermeldungen in die Datei" }
      - { left: "befehl < datei", right: "Die Datei als Eingabe verwenden" }
      - { left: "befehl > /dev/null", right: "Normale Ausgabe wegwerfen" }
    explanation: Das Zeichen zeigt die Richtung an. Ein Pfeil zur Datei hin schreibt, ein Pfeil vom Dateinamen weg liest.
  - type: single
    question: "Was passiert bei `ls vorhanden.txt fehlt.txt 2>&1 > ergebnis.txt`?"
    options:
      - Beide Meldungen landen in ergebnis.txt.
      - Die normale Ausgabe landet in ergebnis.txt, die Fehlermeldung erscheint trotzdem im Terminal.
      - Beide Meldungen erscheinen im Terminal.
      - Die Shell meldet einen Syntaxfehler.
    answer: 1
    explanation: "Die Shell liest Umleitungen von links nach rechts. `2>&1` macht Kanal 2 zu einer Kopie von Kanal 1 – und der zeigt in diesem Moment noch aufs Terminal. Erst danach wird Kanal 1 in die Datei umgeleitet. Richtig wäre `> ergebnis.txt 2>&1`."
  - type: cloze
    text: "Die drei Standardkanäle haben die Nummern ___ (Eingabe), ___ (Ausgabe) und ___ (Fehler)."
    blanks:
      - ["0"]
      - ["1"]
      - ["2"]
    explanation: Diese Nummern heißen Dateideskriptoren. Deshalb schreibst du `2>`, wenn du Fehlermeldungen umleiten willst.
  - type: find-bug
    question: Das Skript soll jeden Tag eine Zeile an `protokoll.txt` anhängen. Nach einer Woche steht aber immer nur eine Zeile darin. Welche Zeile ist falsch?
    language: bash
    code: |
      #!/usr/bin/env bash
      datum=$(date +%F)
      echo "Sicherung gestartet: $datum"
      echo "$datum Sicherung ok" > protokoll.txt
    bug_line: 4
    explanation: "`>` überschreibt die Datei bei jedem Aufruf. Zum Anhängen brauchst du `>>`: `echo \"$datum Sicherung ok\" >> protokoll.txt`."
  - type: multiple
    question: Welche Befehle schreiben **sowohl** die normale Ausgabe **als auch** die Fehlermeldungen in `alles.txt`?
    options:
      - "`./skript.sh > alles.txt 2>&1`"
      - "`./skript.sh &> alles.txt`"
      - "`./skript.sh 2>&1 > alles.txt`"
      - "`./skript.sh 2> alles.txt`"
    answers: [0, 1]
    explanation: "`&>` ist die Bash-Kurzform von `> datei 2>&1`. Bei Option 3 ist die Reihenfolge falsch, Option 4 fängt nur die Fehler."
tasks:
  - id: datenstroeme-beschriften
    type: diagram
    title: Beschrifte die drei Datenströme
    description: Jeder Befehl hat einen Eingang und zwei Ausgänge. Ordne jedem Pfeil den richtigen Namen zu. Die Zahlen sind die Dateideskriptoren.
    image: /assets/terminal-shell/text-datenstroeme-leer.svg
    slots:
      - { x: 29, y: 42, answer: Standardeingabe }
      - { x: 70, y: 22, answer: Standardausgabe }
      - { x: 70, y: 65, answer: Standardfehlerausgabe }
    distractors: [Pipe, Umleitung]
    hints:
      - "Kanal 0 kommt herein, Kanal 1 ist für normale Ergebnisse, Kanal 2 für Fehlermeldungen."
  - id: ausgaben-trennen
    type: terminal
    title: Normale Ausgabe und Fehler trennen
    description: |
      Im Ordner `umleitung-pruefung` liegt das Skript `pruefen.sh`. Es prüft, ob drei Dateien vorhanden
      sind. Für jede vorhandene Datei schreibt es eine `OK`-Zeile auf die Standardausgabe, für jede
      fehlende eine `FEHLER`-Zeile auf die Standardfehlerausgabe. Außerdem gibt es `protokoll.txt` mit
      einem ersten Eintrag. Starte das Skript ruhig zuerst einmal ohne Umleitung mit `./pruefen.sh`.

      1. Starte das Skript so, dass die OK-Zeilen in `ok.txt` und die Fehlermeldungen in `fehler.txt` landen.
      2. Starte es noch einmal so, dass **beide** Kanäle zusammen in `alles.txt` landen.
      3. Hänge an `protokoll.txt` die Zeile `2026-10-02 Lauf 2` an. Der erste Eintrag muss erhalten bleiben.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit Skript und Dateien angelegt werden.
    workdir: umleitung-pruefung
    setup: |
      cat > pruefen.sh <<'EOF'
      #!/usr/bin/env bash
      for f in bericht.txt bilder.zip notizen.md; do
        if [ -e "$f" ]; then
          echo "OK: $f ist vorhanden"
        else
          echo "FEHLER: $f fehlt" >&2
        fi
      done
      EOF
      chmod +x pruefen.sh
      printf 'Quartalsbericht\n' > bericht.txt
      printf '# Notizen\n' > notizen.md
      printf '2026-10-01 Lauf 1\n' > protokoll.txt
    checks:
      - type: command
        run: echo "$(grep -c '^OK:' ok.txt)/$(wc -l < ok.txt)"
        stdout_equals: 2/2
        message: ok.txt soll genau die zwei OK-Zeilen enthalten und keine Fehlermeldung. Nutze > für die Standardausgabe.
      - type: command
        run: echo "$(grep -c '^FEHLER:' fehler.txt)/$(wc -l < fehler.txt)"
        stdout_equals: 1/1
        message: fehler.txt soll genau die eine FEHLER-Zeile enthalten. Fehlermeldungen leitest du mit 2> um.
      - type: command
        run: echo "$(grep -c '^OK:' alles.txt)/$(grep -c '^FEHLER:' alles.txt)/$(wc -l < alles.txt)"
        stdout_equals: 2/1/3
        message: alles.txt soll alle drei Zeilen enthalten. Achte auf die Reihenfolge – erst > alles.txt, dann 2>&1.
      - type: command
        run: head -n 1 protokoll.txt
        stdout_equals: 2026-10-01 Lauf 1
        message: Der erste Eintrag in protokoll.txt ist verschwunden. Zum Anhängen brauchst du >>, nicht >. Klicke auf Aufgabe vorbereiten, um neu zu starten.
      - type: command
        run: echo "$(wc -l < protokoll.txt)|$(tail -n 1 protokoll.txt)"
        stdout_equals: "2|2026-10-02 Lauf 2"
        message: protokoll.txt soll genau zwei Zeilen haben, die letzte lautet "2026-10-02 Lauf 2".
    hints:
      - "Die Standardausgabe hat die Nummer 1, die Fehlerausgabe die Nummer 2. Beide kannst du in einem Befehl getrennt umleiten."
      - "Schritt 1: `./pruefen.sh > ok.txt 2> fehler.txt`. Schritt 2: `./pruefen.sh > alles.txt 2>&1`."
      - "Schritt 3: `echo \"2026-10-02 Lauf 2\" >> protokoll.txt` – zwei spitze Klammern hängen an."
    solution: |
      ```bash
      cd umleitung-pruefung
      ./pruefen.sh > ok.txt 2> fehler.txt
      ./pruefen.sh > alles.txt 2>&1
      echo "2026-10-02 Lauf 2" >> protokoll.txt
      cat ok.txt fehler.txt alles.txt protokoll.txt   # kontrollieren
      ```
---

Du startest ein Programm, und es schreibt fünfzig Zeilen auf den Bildschirm. Drei davon sind Fehlermeldungen,
der Rest sind Ergebnisse, die du eigentlich in einer Datei bräuchtest. Alles abtippen? Nein. Die
[[shell|Shell]] kann Ausgaben dorthin lenken, wo du sie haben willst – in eine Datei, in den Papierkorb
oder in ein anderes Programm. Dafür musst du nur verstehen, dass jeder Befehl drei getrennte Kanäle hat.

## Drei Kanäle für jeden Befehl

Stell dir jedes [[programm|Programm]] wie eine kleine Werkstatt vor. Sie hat eine Tür, durch die Material
hereinkommt, und zwei Rutschen nach draußen: eine für fertige Ware und eine für Ausschuss und Beschwerden.
Diese drei Öffnungen gibt es bei jedem Befehl im [[terminal|Terminal]], ganz automatisch.

![Die drei Datenströme: Standardeingabe kommt herein, Standardausgabe und Standardfehlerausgabe gehen hinaus](/assets/terminal-shell/text-datenstroeme.svg)

| Kanal | Nummer | Kurzname | Normalerweise verbunden mit |
|---|---|---|---|
| [[standardeingabe|Standardeingabe]] | 0 | stdin | Tastatur |
| [[standardausgabe|Standardausgabe]] | 1 | stdout | Bildschirm |
| [[standardfehlerausgabe|Standardfehlerausgabe]] | 2 | stderr | Bildschirm |

Die Nummern heißen [[dateideskriptor|Dateideskriptoren]]. Ein Dateideskriptor ist einfach eine Zahl, über
die ein Programm einen geöffneten Kanal anspricht. 0, 1 und 2 sind beim Start immer schon belegt.

Warum gibt es zwei Ausgänge? Damit Ergebnisse und Probleme getrennt bleiben. Wenn `ls` eine Liste von
Dateien ausgibt und eine davon nicht findet, landet die Liste auf stdout und die Beschwerde auf stderr. Im
Terminal siehst du beides untereinander, weil beide Kanäle auf denselben Bildschirm zeigen. Sobald du
umleitest, merkst du den Unterschied sofort.

## Ausgabe in eine Datei: > und >>

Die [[umleitung|Umleitung]] mit `>` schickt die Standardausgabe in eine [[datei|Datei]] statt auf den
Bildschirm:

```bash title="Ausgabe in eine Datei schreiben"
ls -l > dateiliste.txt
date > zeitpunkt.txt
echo "Hallo" > gruss.txt
```

Im Terminal erscheint dabei nichts. Gibt es die Datei noch nicht, legt die Shell sie an. **Gibt es sie
schon, wird ihr Inhalt ohne Rückfrage gelöscht und ersetzt.** Das passiert sogar, bevor der Befehl
startet. Deshalb ist `sort liste.txt > liste.txt` eine Falle: Die Shell leert `liste.txt`, dann liest sort
eine leere Datei, und am Ende ist alles weg.

Zwei spitze Klammern `>>` hängen dagegen an das Ende der Datei an. Der alte Inhalt bleibt erhalten:

```bash title="Anhängen statt überschreiben"
echo "2026-10-01 Sicherung ok" >> protokoll.txt
echo "2026-10-02 Sicherung ok" >> protokoll.txt
cat protokoll.txt      # zeigt beide Zeilen
```

> [!MERKSATZ]
> `>` heißt „neu schreiben“, `>>` heißt „anhängen“. Bei Protokollen, die wachsen sollen, brauchst du
> immer `>>`.

## Fehlermeldungen umleiten: 2> und 2>&1

Vor `>` kannst du die Nummer des Kanals schreiben. `>` ist eigentlich nur die Kurzform von `1>`. Mit `2>`
leitest du die Fehlermeldungen um:

```bash title="Ergebnisse und Fehler getrennt speichern"
ls bericht.txt gibtsnicht.txt > ergebnis.txt 2> fehler.txt
```

Danach steht `bericht.txt` in `ergebnis.txt`, und die Meldung über die fehlende Datei steht in
`fehler.txt`. Beide Ausgaben sind sauber getrennt.

Oft willst du aber **alles** in einer Datei haben, etwa für ein vollständiges Protokoll. Dafür gibt es die
Schreibweise `2>&1`. Sie bedeutet: „Kanal 2 soll dorthin zeigen, wohin Kanal 1 gerade zeigt.“ Das `&`
sagt der Shell, dass `1` hier ein Kanal ist und keine Datei mit dem Namen „1“.

```bash title="Beide Kanäle in eine Datei"
./pruefen.sh > alles.txt 2>&1
./pruefen.sh &> alles.txt         # Bash-Kurzform, gleiche Wirkung
```

Bei `2>&1` kommt es auf die Reihenfolge an. Die Shell arbeitet Umleitungen von links nach rechts ab:

1. `> alles.txt` – Kanal 1 zeigt jetzt auf die Datei.
2. `2>&1` – Kanal 2 kopiert das Ziel von Kanal 1, zeigt also auch auf die Datei.

Drehst du die Reihenfolge um, kopiert Kanal 2 zuerst das alte Ziel von Kanal 1, also den Bildschirm. Erst
danach wird Kanal 1 auf die Datei gelenkt. Die Fehler erscheinen dann weiterhin im Terminal.

> [!FEHLER]
> **`befehl 2>&1 > log.txt`** sieht richtig aus, fängt aber die Fehlermeldungen nicht ein. Merke dir die
> Reihenfolge so: erst sagen, wohin die Ausgabe soll, dann den Fehlerkanal hinterherschicken –
> `befehl > log.txt 2>&1`.

## Eingabe aus einer Datei und /dev/null

Die Standardeingabe lässt sich genauso umlenken, nur in die andere Richtung. Mit `<` liest ein Befehl aus
einer Datei, als hättest du ihren Inhalt eingetippt:

```bash title="Eine Datei als Eingabe"
wc -l < bestellungen.csv     # nur die Zahl, ohne Dateinamen
sort < namen.txt
```

Die meisten Programme nehmen Dateinamen auch direkt als Argument. `<` brauchst du vor allem für Programme,
die nur von stdin lesen.

Manchmal interessiert dich eine Ausgabe gar nicht. Dafür gibt es [[dev-null|/dev/null]], eine spezielle
Datei, die alles schluckt und immer leer bleibt – der Papierkorb des Terminals.

```bash title="Ausgaben wegwerfen"
find / -name "*.conf" 2> /dev/null     # "Keine Berechtigung"-Meldungen ausblenden
befehl > /dev/null 2>&1                 # komplett still
```

Das erste Beispiel ist ein Klassiker: find stößt auf viele Ordner, die du nicht lesen darfst. Die
Meldungen landen auf stderr und verschwinden, die Treffer auf stdout bleiben.

> [!ACHTUNG]
> Wirf Fehlermeldungen nur weg, wenn du weißt, welche. `2> /dev/null` versteckt auch die eine Meldung,
> die erklären würde, warum dein Befehl nicht funktioniert.

## Speichern und anzeigen zugleich: tee

Mit `>` verschwindet die Ausgabe vom Bildschirm. Manchmal willst du sie aber sehen **und** speichern. Dafür
gibt es [[tee]]. Der Name kommt vom T-Stück aus dem Rohrleitungsbau: Ein Strom geht hinein, zwei gehen
hinaus.

tee liest von der Standardeingabe. Um ihm die Ausgabe eines anderen Befehls zu geben, nutzt du den
senkrechten Strich `|`, eine [[pipe|Pipe]]. Pipes lernst du in der nächsten Lektion ausführlich kennen –
hier reicht: Sie verbindet die Ausgabe des linken Befehls mit der Eingabe des rechten.

```bash title="tee speichert und zeigt an"
./pruefen.sh | tee ergebnis.txt          # anzeigen und in Datei schreiben
./pruefen.sh | tee -a verlauf.txt        # anzeigen und anhängen
./pruefen.sh 2>&1 | tee komplett.txt     # inklusive Fehlermeldungen
```

`tee -a` hängt an, so wie `>>`. Durch eine Pipe fließt nur stdout. Deshalb steht im letzten Beispiel
`2>&1` **vor** der Pipe: Erst werden die Fehler in die Ausgabe gemischt, dann geht beides gemeinsam an tee.

> [!PRAXIS]
> In der Softwareentwicklung laufen Builds, Tests und Deployments oft minutenlang. Mit
> `./deploy.sh 2>&1 | tee deploy.log` verfolgst du live, was passiert, und hast hinterher trotzdem das
> komplette Protokoll, um es einer Kollegin zu schicken oder an ein Ticket anzuhängen.

## Zusammenfassung

- Jeder Befehl hat drei Kanäle: Standardeingabe (0), Standardausgabe (1) und Standardfehlerausgabe (2).
- `>` schreibt stdout in eine Datei und überschreibt sie, `>>` hängt an.
- `2>` leitet Fehlermeldungen um, `> datei 2>&1` oder `&> datei` schreibt beides in eine Datei.
- Bei `2>&1` zählt die Reihenfolge: erst die Ausgabe umleiten, dann den Fehlerkanal hinterherschicken.
- `<` liest die Eingabe aus einer Datei.
- `/dev/null` schluckt alles, was du nicht sehen willst.
- `tee` zeigt eine Ausgabe an und speichert sie gleichzeitig, `tee -a` hängt an.
