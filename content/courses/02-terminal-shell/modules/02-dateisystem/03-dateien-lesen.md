---
title: Dateien lesen
summary: Mit cat, less, head, tail, wc und file liest du Dateien jeder Größe im Terminal – von der kurzen Notiz bis zur Logdatei, die gerade wächst.
duration: 20
sources:
  - title: GNU Coreutils – cat invocation
    url: https://www.gnu.org/software/coreutils/manual/html_node/cat-invocation.html
  - title: GNU Coreutils – head invocation
    url: https://www.gnu.org/software/coreutils/manual/html_node/head-invocation.html
  - title: GNU Coreutils – tail invocation
    url: https://www.gnu.org/software/coreutils/manual/html_node/tail-invocation.html
  - title: GNU Coreutils – wc invocation
    url: https://www.gnu.org/software/coreutils/manual/html_node/wc-invocation.html
  - title: less(1) – Handbuchseite
    url: https://man7.org/linux/man-pages/man1/less.1.html
  - title: file(1) – Handbuchseite
    url: https://man7.org/linux/man-pages/man1/file.1.html
quiz:
  - type: single
    question: Du willst eine 50 000 Zeilen lange Logdatei in Ruhe durchblättern und darin suchen. Welcher Befehl passt am besten?
    options:
      - "cat app.log"
      - "less app.log"
      - "head app.log"
      - "wc app.log"
    answer: 1
    explanation: "cat schüttet alles auf einmal in das Terminal, head zeigt nur den Anfang, wc zählt nur. less zeigt die Datei seitenweise, und mit / kannst du darin suchen."
  - type: match
    question: Was tust du in less mit welcher Taste?
    pairs:
      - { left: "Leertaste", right: "Eine Seite weiter" }
      - { left: "b", right: "Eine Seite zurück" }
      - { left: "/fehler", right: "Nach „fehler“ suchen" }
      - { left: "G", right: "Zum Ende der Datei springen" }
      - { left: "q", right: "less beenden" }
    explanation: Leertaste und b blättern, / sucht (n springt zum nächsten Treffer), g und G springen an Anfang und Ende, q beendet.
  - type: cloze
    text: "Die letzten 20 Zeilen zeigt `tail -n ___ app.log`. Mit `tail ___ app.log` siehst du live, was neu hinzukommt."
    blanks:
      - ["20"]
      - [-f, -F, --follow]
    explanation: "-n bestimmt die Anzahl der Zeilen. -f (follow) bleibt geöffnet und zeigt neue Zeilen, sobald sie geschrieben werden. Beenden mit Strg+C."
  - type: find-bug
    question: Ada will zwei Kapitel zu einer Datei `buch.txt` zusammenfügen. In welcher Zeile steckt der Fehler?
    language: bash
    code: |
      ls kapitel-*.txt
      head kapitel-1.txt kapitel-2.txt > buch.txt
      wc -l buch.txt
    bug_line: 2
    explanation: "head zeigt von jeder Datei nur die ersten zehn Zeilen und schreibt zusätzlich Überschriften wie ==> kapitel-1.txt <== dazwischen. Zum Aneinanderhängen ist cat da: cat kapitel-1.txt kapitel-2.txt > buch.txt."
  - type: multiple
    question: Welche Aussagen über den Befehl `file` stimmen?
    options:
      - Er erkennt den Dateityp am Inhalt, nicht an der Endung
      - Er zeigt den Inhalt einer Datei an
      - "Er kann erkennen, ob eine Textdatei Windows-Zeilenenden hat"
      - Er ändert die Dateiendung passend zum Inhalt
    answers: [0, 2]
    explanation: file schaut in die ersten Bytes einer Datei und vergleicht sie mit bekannten Mustern. Es zeigt keinen Inhalt und ändert nichts, meldet aber zum Beispiel „with CRLF line terminators“.
tasks:
  - id: log-auswerten
    type: terminal
    title: Eine Logdatei untersuchen
    description: |
      Im Ordner `logs-lesen` liegt die Datei `app.log` mit Hunderten Zeilen sowie zwei kurze Textdateien
      `teil1.txt` und `teil2.txt`. Untersuche die Logdatei und halte deine Ergebnisse in Dateien fest.
      Das Zeichen `>` schreibt die Ausgabe eines Befehls in eine Datei.

      1. Blättere die Datei mit `less app.log` durch. Suche mit `/ERROR` nach dem Fehler und beende less mit `q`.
      2. Speichere die **ersten 5 Zeilen** von `app.log` in `anfang.txt`.
      3. Speichere die **letzten 3 Zeilen** von `app.log` in `ende.txt`.
      4. Zähle die Zeilen von `app.log` und speichere die Ausgabe von `wc -l` in `anzahl.txt`.
      5. Hänge `teil1.txt` und `teil2.txt` (in dieser Reihenfolge) zu einer Datei `gesamt.txt` zusammen.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit die Logdatei erzeugt wird.
    workdir: logs-lesen
    setup: |
      for i in $(seq 1 239); do printf '2026-10-01 08:%02d:%02d INFO Anfrage %d bearbeitet\n' $((i / 60)) $((i % 60)) "$i"; done > app.log
      printf '2026-10-01 08:04:00 ERROR Datenbank nicht erreichbar\n' >> app.log
      printf 'Kapitel 1: Die Shell\n' > teil1.txt
      printf 'Kapitel 2: Das Dateisystem\n' > teil2.txt
    checks:
      - type: command
        run: head -n 5 app.log | cmp -s - anfang.txt
        message: anfang.txt fehlt oder enthält nicht genau die ersten 5 Zeilen. Nutze head -n 5 app.log > anfang.txt.
      - type: command
        run: tail -n 3 app.log | cmp -s - ende.txt
        message: ende.txt fehlt oder enthält nicht genau die letzten 3 Zeilen. Nutze tail -n 3.
      - type: file_contains
        path: anzahl.txt
        pattern: "^\\s*240\\b"
        message: anzahl.txt soll die Zeilenzahl von app.log enthalten. Nutze wc -l app.log > anzahl.txt.
      - type: command
        run: cat teil1.txt teil2.txt | cmp -s - gesamt.txt
        message: gesamt.txt fehlt oder ist nicht teil1.txt gefolgt von teil2.txt. Dafür ist cat da.
    hints:
      - "`head` und `tail` zeigen ohne Option je 10 Zeilen. Mit `-n` bestimmst du die Anzahl."
      - "Hänge `> datei.txt` hinter den Befehl, um die Ausgabe zu speichern statt sie anzuzeigen."
      - "`head -n 5 app.log > anfang.txt`, `tail -n 3 app.log > ende.txt`, `wc -l app.log > anzahl.txt`, `cat teil1.txt teil2.txt > gesamt.txt`."
    solution: |
      ```bash
      cd logs-lesen
      less app.log                 # /ERROR suchen, q beendet
      head -n 5 app.log > anfang.txt
      tail -n 3 app.log > ende.txt
      wc -l app.log > anzahl.txt
      cat teil1.txt teil2.txt > gesamt.txt
      cat anzahl.txt               # 240 app.log
      ```
  - id: endungen-luegen
    type: terminal
    title: Dateiendungen können lügen
    description: |
      Im Ordner `dateitypen` liegen drei Dateien: `urlaub.txt`, `einkauf.jpg` und `gruss` (ohne Endung).
      Mindestens eine Endung passt nicht zum Inhalt. Finde mit `file` heraus, was wirklich drinsteckt.

      1. Führe `file *` aus und speichere die Ausgabe mit `file * > typen.txt`.
      2. Die Datei, die in Wahrheit ein PNG-Bild ist, benennst du in `bild.png` um.
      3. Die Datei, die in Wahrheit Text ist, aber eine Bild-Endung trägt, benennst du in `einkauf.txt` um.
      4. Schau dir `einkauf.txt` danach mit `cat` an.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit die Dateien angelegt werden.
    workdir: dateitypen
    setup: |
      printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde' > urlaub.txt
      printf 'Einkaufsliste:\n- Brot\n- Milch\n' > einkauf.jpg
      printf 'Hallo Welt\n' > gruss
    checks:
      - type: file_contains
        path: typen.txt
        pattern: "urlaub\\.txt:\\s+PNG image"
        message: typen.txt fehlt oder enthält nicht die Ausgabe von file für alle Dateien. Führe file * > typen.txt aus, bevor du etwas umbenennst.
      - type: command
        run: file bild.png | grep -q PNG
        message: bild.png fehlt oder ist kein PNG-Bild. Welche Datei hat file als PNG erkannt?
      - type: file_contains
        path: einkauf.txt
        pattern: "Brot"
        message: einkauf.txt fehlt. Die Einkaufsliste versteckt sich hinter einer Bild-Endung.
      - type: command
        run: test ! -e urlaub.txt && test ! -e einkauf.jpg
        message: urlaub.txt oder einkauf.jpg gibt es noch. Benenne die Dateien mit mv um, statt sie zu kopieren.
    hints:
      - "`file` schaut in die Datei hinein und ignoriert die Endung."
      - "`urlaub.txt` ist laut `file` ein „PNG image“, `einkauf.jpg` ist „ASCII text“."
      - "`file * > typen.txt`, dann `mv urlaub.txt bild.png` und `mv einkauf.jpg einkauf.txt`."
    solution: |
      ```bash
      cd dateitypen
      file *
      file * > typen.txt
      mv urlaub.txt bild.png
      mv einkauf.jpg einkauf.txt
      cat einkauf.txt
      ```
  - id: in-less-navigieren
    type: steps
    title: Unterwegs in less
    description: Du hast `less server.log` geöffnet. Die Datei ist mehrere Tausend Zeilen lang. Was tippst du als Nächstes?
    steps:
      - situation: Du siehst die ersten Zeilen. Du willst eine Seite weiterblättern.
        question: Welche Taste drückst du?
        options: ["Leertaste", "q", "Strg+C"]
        answer: 0
        explanation: Die Leertaste blättert eine Bildschirmseite weiter, b eine zurück. q würde less beenden.
      - situation: Du suchst die erste Zeile, in der „timeout“ vorkommt.
        question: Was tippst du?
        options: ["/timeout und Enter", "grep timeout", ":timeout"]
        answer: 0
        explanation: Mit / startest du in less eine Suche nach unten. Treffer werden hervorgehoben.
      - situation: Der erste Treffer ist es nicht. Du willst zum nächsten Treffer.
        question: Welche Taste?
        options: ["n", "N", "G"]
        answer: 0
        explanation: n springt zum nächsten Treffer, N zum vorherigen. G springt ans Dateiende.
      - situation: Du willst sehen, was ganz am Ende der Datei steht – dort stehen die neuesten Einträge.
        question: Welche Taste?
        options: ["G", "g", "b"]
        answer: 0
        explanation: Großes G springt ans Ende, kleines g an den Anfang.
      - situation: Du hast genug gesehen.
        question: Wie verlässt du less?
        options: ["q", "Esc", ":wq"]
        answer: 0
        explanation: q beendet less, und du bist wieder am Prompt. :wq ist ein vim-Befehl.
---

Du hast einen Fehler auf deiner Website und jemand sagt: „Schau mal ins Log.“ Die Datei hat
80 000 Zeilen, und sie wächst, während du sie anschaust. Ein Doppelklick im Dateimanager würde
einen Editor öffnen, der minutenlang lädt. Im Terminal brauchst du dafür einen einzigen Befehl –
du musst nur wissen, welchen.

## Textdateien ausgeben – cat

Eine [[textdatei|Textdatei]] enthält nur lesbare Zeichen: Quellcode, Notizen, Konfigurationen, Logs.
Eine [[binaerdatei|Binärdatei]] enthält Bytes, die nur Programme verstehen: Bilder, PDFs, Archive.
Alle Befehle dieser Lektion sind für Text gemacht. Gibst du eine Binärdatei aus, erscheint
Zeichensalat – `reset` stellt das Terminal danach wieder her.

Welches Byte welches Zeichen ist, regelt die [[zeichenkodierung|Zeichenkodierung]], heute fast immer
**UTF-8**. Siehst du `Ã¼` statt `ü`, wurde mit der falschen Kodierung gelesen.

`cat` gibt eine Datei komplett aus. Der Name kommt von *concatenate* (verketten): Mehrere Dateien
hängt `cat` hintereinander. Mit `>` landet das Ergebnis in einer Datei – eine
[[umleitung|Umleitung]], die du im nächsten Modul genau kennenlernst.

```bash title="Terminal"
cat notizen.txt
cat -n notizen.txt                          # mit Zeilennummern
cat kopf.html inhalt.html > seite.html      # zusammenfügen
```

Für kurze Dateien ist `cat` ideal. Bei langen rauscht alles durch, und du siehst nur das Ende.

## Seitenweise blättern – less

Für lange Dateien gibt es [[pager|Pager]]. Ein Pager zeigt Text Bildschirmseite für
Bildschirmseite an, wie ein Buch, in dem du blätterst. Der Standard-Pager heißt `less`. Er lädt die
Datei nicht komplett, deshalb öffnet er auch riesige Dateien sofort:

```bash title="Terminal"
less app.log
```

Innerhalb von `less` steuerst du mit Tasten:

| Taste | Wirkung |
|---|---|
| Leertaste / `f` | eine Seite weiter |
| `b` | eine Seite zurück |
| Pfeiltasten / `j` `k` | zeilenweise |
| `g` / `G` | an den Anfang / ans Ende |
| `/muster` + Enter | nach unten suchen |
| `?muster` + Enter | nach oben suchen |
| `n` / `N` | nächster / vorheriger Treffer |
| `q` | beenden |

> [!MERKSATZ]
> Wenn im Terminal plötzlich kein Prompt mehr da ist und unten ein `:` oder `(END)` steht, bist du
> in einem Pager. Mit `q` kommst du raus.

Du begegnest `less` öfter, als du denkst: `git log`, `git diff` und die Handbuchseiten von `man`
öffnen ihre Ausgabe automatisch darin. Der ältere Pager `more` kann weniger – daher der Wortwitz
„less is more“.

> [!HINWEIS]
> Im Übungs-Terminal ist `man` nicht installiert. Auf deinem eigenen Linux oder Mac öffnet zum
> Beispiel `man less` die vollständige Anleitung – natürlich in `less`.

## Anfang und Ende – head und tail

Oft interessiert dich nur ein Teil. `head` zeigt die ersten zehn Zeilen, `tail` die letzten zehn.
Mit `-n` legst du die Anzahl fest:

```bash title="Terminal"
head app.log
head -n 3 app.log
tail -n 20 app.log
```

`head` hilft, um zu verstehen, wie eine Datei aufgebaut ist, etwa welche Spalten eine CSV-Datei hat.
`tail` ist das Werkzeug für Logs, denn neue Einträge landen immer am Ende.

### Live mitlesen mit tail -f

Eine [[logdatei|Logdatei]] ist eine Textdatei, in die ein Programm laufend notiert, was passiert:
jede Anfrage, jede Warnung, jeden Fehler, meist mit Datum und Uhrzeit. Auf Linux liegen viele davon
unter `/var/log`. Solche Dateien wachsen ständig. Mit `-f` (*follow*) bleibt `tail` geöffnet und zeigt
jede neue Zeile in dem Moment, in dem sie geschrieben wird:

```bash title="Terminal"
tail -f /var/log/nginx/error.log
```

Jetzt kannst du im Browser die fehlerhafte Seite neu laden und siehst sofort, was der Server
meldet. Beenden kannst du das Mitlesen mit `Strg+C`.

Viele Programme beginnen regelmäßig eine neue Logdatei und benennen die alte um (das nennt man
*Log-Rotation*). `tail -f` hängt dann weiter an der alten, umbenannten Datei. `tail -F` merkt sich
stattdessen den Namen und wechselt automatisch zur neuen Datei. Für Server-Logs ist `-F` deshalb die
robustere Wahl.

> [!FEHLER]
> **„tail hängt!“** – Nein, `tail -f` wartet genau so, wie es soll, auf neue Zeilen. Der Prompt kommt
> erst zurück, wenn du `Strg+C` drückst. Dasselbe gilt für alle Befehle, die auf etwas warten: Ein
> fehlender Prompt bedeutet „läuft noch“, nicht „kaputt“.

## Zählen und erkennen – wc und file

`wc` (*word count*) zählt: `-l` Zeilen, `-w` Wörter, `-c` Bytes, `-m` Zeichen.

```bash title="Terminal"
wc -l app.log     # 240 app.log
```

Für Linux ist die [[dateiendung|Dateiendung]] nur ein Teil des Namens. Was wirklich in einer Datei
steckt, verrät `file`: Es liest die ersten Bytes und vergleicht sie mit bekannten Kennungen – PNG-Bilder
beginnen zum Beispiel immer mit den Buchstaben `PNG`.

```bash title="Terminal"
file foto.jpg notizen.txt skript.sh windows.txt
```

```text
foto.jpg:    JPEG image data, JFIF standard 1.01
notizen.txt: UTF-8 Unicode text
skript.sh:   Bourne-Again shell script, ASCII text executable
windows.txt: ASCII text, with CRLF line terminators
```

Die Formulierung hängt von der Version ab. Die letzte Zeile verrät [[zeilenende|Windows-Zeilenenden]] (CRLF statt
LF), die in Skripten seltsame Fehler auslösen. Der Befehl `file` verrät dir, ob eine Datei solche Zeilenenden hat.

> [!PRAXIS]
> Wenn in einem Projekt „irgendwas nicht geht“, sind Logs die erste Anlaufstelle. Der typische
> Ablauf: `ls -lt /var/log` zeigt, welche Datei sich zuletzt geändert hat. `tail -n 50` zeigt die
> letzten Einträge. `less` hilft beim Suchen nach `ERROR`, und `tail -F` läuft in einem zweiten
> Terminalfenster mit, während du den Fehler nachstellst. Wer diese vier Befehle beherrscht, findet
> Fehler oft schneller als mit jedem grafischen Werkzeug.

## Zusammenfassung

- Textdateien enthalten lesbare Zeichen, Binärdateien nicht. Die Zeichenkodierung (heute meist UTF-8) bestimmt, welches Byte welches Zeichen ist.
- `cat` gibt Dateien komplett aus und hängt mehrere aneinander – gut für kurze Dateien.
- `less` ist ein Pager: blättern mit Leertaste und `b`, suchen mit `/`, weiter mit `n`, Ende mit `G`, raus mit `q`.
- `head` und `tail` zeigen Anfang und Ende, `-n` bestimmt die Anzahl. `tail -f` und `tail -F` lesen wachsende Logdateien live mit.
- `wc -l` zählt Zeilen, `-w` Wörter, `-c` Bytes.
- `file` erkennt den Typ am Inhalt, nicht an der Endung – und verrät auch Windows-Zeilenenden.
