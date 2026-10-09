---
title: Die Anatomie eines Befehls
summary: Befehlsname, Optionen und Argumente erkennen, Leerzeichen richtig mit Anführungszeichen schützen und dir mit --help, man und type selbst helfen.
duration: 20
sources:
  - title: GNU Bash Reference Manual – Simple Commands
    url: https://www.gnu.org/software/bash/manual/html_node/Simple-Commands.html
  - title: GNU Bash Reference Manual – Quoting
    url: https://www.gnu.org/software/bash/manual/html_node/Quoting.html
  - title: GNU Coreutils – Common options
    url: https://www.gnu.org/software/coreutils/manual/html_node/Common-options.html
  - title: man(1) – Linux manual page
    url: https://man7.org/linux/man-pages/man1/man.1.html
  - title: GNU Bash Reference Manual – Bash Builtins (type)
    url: https://www.gnu.org/software/bash/manual/html_node/Bash-Builtins.html
quiz:
  - type: match
    question: "Ordne die Teile des Befehls `head -n 5 --quiet bericht.txt` zu."
    pairs:
      - { left: "head", right: "Befehlsname" }
      - { left: "-n 5", right: "Kurze Option mit Wert" }
      - { left: "--quiet", right: "Lange Option" }
      - { left: "bericht.txt", right: "Argument" }
    explanation: Der Befehlsname steht immer vorn. Optionen beginnen mit einem oder zwei Strichen und verändern das Verhalten, Argumente sagen, womit der Befehl arbeiten soll.
  - type: multiple
    question: "Welche Schreibweisen sind bei `ls` gleichwertig zu `ls -l -a`?"
    options: ["ls -la", "ls -al", "ls --all -l", "ls -l a", "ls - la"]
    answers: [0, 1, 2]
    explanation: Kurze Optionen darf man zusammenfassen, die Reihenfolge ist egal, und `-a` heißt lang `--all`. `ls -l a` sucht dagegen eine Datei namens „a“, und `- la` ist kaputt, weil das Leerzeichen den Strich vom Buchstaben trennt.
  - type: find-bug
    question: "Ada will die Datei `meine notizen.txt` anzeigen. In welcher Zeile steckt der Fehler?"
    language: bash
    code: |
      ls -l
      cat meine notizen.txt
      echo "fertig"
    bug_line: 2
    explanation: "Ohne Anführungszeichen trennt die Shell am Leerzeichen und `cat` sucht zwei Dateien: `meine` und `notizen.txt`. Richtig ist `cat \"meine notizen.txt\"` oder `cat meine\\ notizen.txt`."
  - type: single
    question: "Was gibt `echo 'Mein Ordner ist $HOME'` aus?"
    options:
      - "Mein Ordner ist /home/ada (der echte Pfad)"
      - "Mein Ordner ist $HOME"
      - Eine Fehlermeldung
    answer: 1
    explanation: In einfachen Anführungszeichen wird nichts ersetzt – die Shell gibt jedes Zeichen genau so weiter. In doppelten Anführungszeichen würde `$HOME` durch den Pfad ersetzt.
  - type: cloze
    text: Eine kurze Hilfe zu fast jedem Befehl bekommst du mit der Option `___`. Die ausführliche Anleitung öffnest du auf Linux und macOS mit `___ ls`.
    blanks:
      - ["--help"]
      - [man]
    explanation: "`--help` gibt eine Übersicht direkt im Terminal aus, `man` öffnet die Handbuchseite (Man-Page) zum Blättern."
tasks:
  - id: teile-zuordnen
    type: dragdrop
    title: Befehlsteile sortieren
    description: |
      Ordne jedes Stück aus diesen drei Befehlen der richtigen Rolle zu:

      `ls -l --color=auto /etc` · `head -n 3 einkauf.txt` · `wc -w "meine notizen.txt"`
    targets:
      - { id: name, label: Befehlsname }
      - { id: option, label: Option (ggf. mit Wert) }
      - { id: argument, label: Argument }
    items:
      - { label: "ls", target: name }
      - { label: "head", target: name }
      - { label: "wc", target: name }
      - { label: "-l", target: option }
      - { label: "--color=auto", target: option }
      - { label: "-n 3", target: option }
      - { label: "-w", target: option }
      - { label: "/etc", target: argument }
      - { label: "einkauf.txt", target: argument }
      - { label: "\"meine notizen.txt\"", target: argument }
  - id: befehle-zerlegen
    type: terminal
    title: Optionen, Argumente und Anführungszeichen
    description: |
      Im Ordner `befehl-anatomie` liegen eine Einkaufsliste `einkauf.txt`, eine Datei mit Leerzeichen
      im Namen (`meine notizen.txt`) und eine versteckte Datei. Lass die Ergebnisse jeweils mit `>` in
      eine Datei schreiben.

      1. Schreibe die **ersten drei Zeilen** von `einkauf.txt` in `oben.txt` (Befehl `head` mit der Option `-n`).
      2. Schreibe eine ausführliche Liste **aller** Dateien inklusive versteckter in `liste.txt` (`ls` mit zwei Optionen).
      3. Schreibe den Inhalt von `meine notizen.txt` in `notiz-kopie.txt` – achte auf das Leerzeichen!
      4. Schreibe die Kurzhilfe von `wc` in `hilfe.txt`.

      Klicke zuerst auf **Aufgabe vorbereiten** und wechsle dann mit `cd befehl-anatomie` in den Ordner.
    workdir: befehl-anatomie
    setup: |
      printf 'Milch\nBrot\nÄpfel\nKäse\nNudeln\nTomaten\nKaffee\nReis\n' > einkauf.txt
      printf 'Quoting schützt Leerzeichen.\n' > 'meine notizen.txt'
      printf 'Versteckt, aber nicht verschwunden.\n' > .geheim
    checks:
      - type: command
        run: test -f oben.txt && diff -q oben.txt <(head -n 3 einkauf.txt)
        message: oben.txt soll genau die ersten drei Zeilen von einkauf.txt enthalten (head -n 3 einkauf.txt > oben.txt).
      - type: file_contains
        path: liste.txt
        pattern: "\\.geheim"
        message: In liste.txt fehlt die versteckte Datei .geheim – du brauchst die Option -a.
      - type: file_contains
        path: liste.txt
        pattern: "^[-d]r"
        message: liste.txt ist noch keine ausführliche Liste mit Rechten und Größen – ergänze die Option -l.
      - type: file_contains
        path: notiz-kopie.txt
        pattern: "Quoting schützt Leerzeichen"
        message: notiz-kopie.txt fehlt noch oder ist leer – setze den Dateinamen in Anführungszeichen.
      - type: file_contains
        path: hilfe.txt
        pattern: "(Usage|Aufruf):\\s+wc"
        message: In hilfe.txt steht noch nicht die Hilfe von wc (wc --help > hilfe.txt).
    hints:
      - "Jeder Schritt hat dieselbe Form: `befehl optionen argumente > zieldatei`."
      - "Versteckte Dateien zeigt `ls` erst mit `-a`, die ausführliche Ansicht kommt von `-l`. Zusammen: `-la`."
      - "Für den Dateinamen mit Leerzeichen: `cat \"meine notizen.txt\" > notiz-kopie.txt`."
    solution: |
      ```bash
      cd befehl-anatomie
      head -n 3 einkauf.txt > oben.txt
      ls -la > liste.txt
      cat "meine notizen.txt" > notiz-kopie.txt
      wc --help > hilfe.txt
      ```
---

Ein Befehl im Terminal sieht für Einsteiger:innen oft aus wie Geheimschrift: `ls -la --color=auto /etc`.
Dabei folgt fast jeder Befehl demselben Bauplan, so wie fast jeder deutsche Satz Subjekt, Verb und
Objekt hat. Wenn du diesen Bauplan kennst, kannst du auch Befehle lesen, die du noch nie gesehen hast –
und du weißt, wo du nachschlagen musst.

## Der Bauplan: Name, Optionen, Argumente

![Ein Befehl zerlegt in Befehlsname, kurze Option, lange Option, Option mit Wert und Argument](/assets/terminal-shell/grundlagen-befehl-anatomie.svg)

Jeder [[befehl|Befehl]] beginnt mit dem **Befehlsnamen**. Er sagt, *was* passieren soll: `ls` listet
Dateien, `head` zeigt den Anfang einer Datei, `wc` zählt Wörter und Zeilen. Danach folgen, durch
Leerzeichen getrennt, zwei Arten von Zusätzen.

[[option|Optionen]] verändern, **wie** der Befehl arbeitet. Sie beginnen mit einem Strich. Ein
Beispiel: `ls` zeigt nur Namen, `ls -l` dagegen eine lange Liste mit Größe, Datum und Rechten.
Optionen werden auch *Flags* oder *Schalter* genannt.

[[argument|Argumente]] sagen, **womit** der Befehl arbeiten soll – meist mit einer [[datei|Datei]],
einem [[ordner|Ordner]] oder einem Text. In `head einkauf.txt` ist `einkauf.txt` das Argument.

Im Alltag klingt das so: „Koche (Befehl) **scharf** (Option) **das Curry** (Argument).“ Du kannst die
Würze weglassen, dann wird gekocht wie immer. Lässt du aber weg, *was* gekocht werden soll, weiß die
Küche bei manchen Gerichten nicht weiter. Genauso ist es mit Befehlen: Manche brauchen ein Argument,
manche haben einen sinnvollen Standard – `ls` ohne Argument zeigt einfach den aktuellen Ordner.

> [!MERKSATZ]
> Name sagt **was**, Optionen sagen **wie**, Argumente sagen **womit**. Leerzeichen trennen die Teile.

## Kurze und lange Optionen

Optionen gibt es in zwei Formen. **Kurze Optionen** bestehen aus einem Strich und einem Buchstaben:
`-l`, `-a`, `-h`. **Lange Optionen** bestehen aus zwei Strichen und einem ganzen Wort: `--all`,
`--help`. Viele Optionen gibt es in beiden Formen; `ls -a` und `ls --all` bedeuten dasselbe. Die kurze
Form spart Tipparbeit, die lange Form ist in Anleitungen und Skripten leichter zu lesen.

Kurze Optionen darfst du zusammenziehen. Diese vier Zeilen tun dasselbe:

```bash title="Vier Schreibweisen, ein Ergebnis"
ls -l -a
ls -la
ls -al
ls --all -l
```

Manche Optionen brauchen einen **Wert**. `head` zeigt normalerweise die ersten zehn Zeilen; mit `-n`
legst du die Anzahl selbst fest. Der Wert folgt bei kurzen Optionen nach einem Leerzeichen, bei langen
meist nach einem Gleichheitszeichen:

```bash title="Optionen mit Wert"
head -n 3 einkauf.txt
head --lines=3 einkauf.txt
ls --color=auto
```

Die Reihenfolge von Optionen ist meist egal. Viele Linux-Befehle (die GNU-Werkzeuge) akzeptieren
Optionen sogar hinter den Argumenten. Auf dem Mac sind manche Befehle strenger und wollen die Optionen
vor den Argumenten. Gewöhne dir deshalb die Reihenfolge **Name – Optionen – Argumente** an, dann
funktioniert es überall.

Einen Sonderfall solltest du kennen: Zwei Striche allein, `--`, bedeuten „ab hier kommen keine Optionen
mehr“. Das brauchst du selten, etwa wenn eine Datei wirklich `-n` heißt: `cat -- -n`.

## Groß, klein und Leerzeichen

Die Shell unterscheidet streng zwischen Groß- und Kleinbuchstaben. `ls` funktioniert, `LS` nicht.
`-a` und `-A` sind bei `ls` zwei verschiedene Optionen, und `Notizen.txt` ist eine andere Datei als
`notizen.txt`. Unter Linux ist das immer so; auf dem Mac und unter Windows ist das Dateisystem zwar oft
nachsichtig, Befehle und Optionen aber nicht.

Das größte Stolperfeld sind **Leerzeichen**. Die Shell zerlegt deine Zeile an jedem Leerzeichen in
einzelne Wörter, *bevor* sie das Programm startet. Bei `cat meine notizen.txt` bekommt `cat` deshalb
zwei Argumente – `meine` und `notizen.txt` – und meldet zwei Fehler, weil es beide Dateien nicht gibt.

Die Lösung sind [[anfuehrungszeichen|Anführungszeichen]]. Alles zwischen ihnen bleibt ein einziges Wort:

```bash title="Leerzeichen schützen"
cat "meine notizen.txt"
cat 'meine notizen.txt'
cat meine\ notizen.txt
```

Die dritte Zeile nutzt den **Backslash** `\`. Er schützt genau das eine Zeichen, das direkt danach kommt.

> [!FEHLER]
> **Leerzeichen in Dateinamen ohne Anführungszeichen.** Die Fehlermeldung
> `cat: meine: No such file or directory` verwirrt viele, weil die Datei ja existiert. Die Shell hat den
> Namen aber vorher zerschnitten. Darum benennen Profis Dateien gleich ohne Leerzeichen, etwa
> `meine-notizen.txt`.

## Doppelte oder einfache Anführungszeichen?

Beide halten Leerzeichen zusammen, aber sie unterscheiden sich in einem wichtigen Punkt.
**Doppelte Anführungszeichen** `"…"` lassen die Shell noch Platzhalter ersetzen, zum Beispiel
Variablen, die mit `$` beginnen. **Einfache Anführungszeichen** `'…'` sind ein Tresor: Was drin steht,
kommt Zeichen für Zeichen beim Programm an.

```bash title="Der Unterschied"
echo "Mein Home-Ordner ist $HOME"
# Mein Home-Ordner ist /workspace/.home

echo 'Mein Home-Ordner ist $HOME'
# Mein Home-Ordner ist $HOME
```

Eine Faustregel für den Anfang: Nimm einfache Anführungszeichen, wenn der Text genau so bleiben soll,
und doppelte, wenn du bewusst etwas einsetzen lassen willst. Brauchst du ein Anführungszeichen *im*
Text, nimm die andere Sorte außen herum: `echo 'Sie sagte "Hallo"'` oder `echo "Das ist Adas Datei"`.
Variablen lernst du im Modul über Umgebungsvariablen und Skripte genauer kennen.

## Hilfe holen: --help, man und type

Niemand kennt alle Optionen auswendig. Profis schlagen ständig nach – sie wissen nur, wo.

**`--help`** ist der schnellste Weg. Fast jedes Programm gibt damit eine Kurzübersicht aus:

```bash title="Kurzhilfe"
wc --help
```

Die Ausgabe beginnt mit einer Zeile wie `Usage: wc [OPTION]... [FILE]...`. Eckige Klammern bedeuten
„optional“, drei Punkte bedeuten „darf mehrfach vorkommen“. Diese Schreibweise findest du in jeder
Dokumentation wieder.

**`man`** öffnet die ausführliche Handbuchseite, die [[man-page|Man-Page]] (von *manual*). Mit `man ls`
liest du alles über `ls`. Du blätterst mit den Pfeiltasten oder der Leertaste, suchst mit `/` gefolgt
von einem Wort und Enter, springst mit `n` zum nächsten Treffer und verlässt die Seite mit `q`. Im
Stacklab-Übungs-Terminal ist `man` nicht installiert, um den Container klein zu halten – nutze dort
`--help`. Auf deinem Mac oder Linux-Rechner funktioniert `man` ganz normal; die Handbuchseiten gibt es
auch online, etwa auf man7.org.

**`type`** verrät dir, *was* ein Befehl eigentlich ist:

```bash title="Was ist das für ein Befehl?"
type echo
# echo is a shell builtin
type ls
# ls is /usr/bin/ls
```

Manche Befehle sind direkt in die Shell eingebaut (*builtin*), andere sind eigene Programme, die
irgendwo als Datei liegen. Für eingebaute Befehle gibt es oft keine eigene Man-Page; dafür hat bash den
Befehl `help`, etwa `help cd`.

> [!PRAXIS]
> Viele Entwickler:innen installieren zusätzlich `tldr`. Es zeigt zu einem Befehl nur die fünf, sechs
> häufigsten Beispiele statt der kompletten Handbuchseite – ideal, wenn du schnell wissen willst, wie man
> mit `tar` ein Archiv entpackt. Für die Details bleibt die Man-Page die verlässliche Quelle.

## Zusammenfassung

- Ein Befehl besteht aus **Befehlsname**, **Optionen** (wie?) und **Argumenten** (womit?), getrennt durch Leerzeichen.
- **Kurze Optionen** `-l` lassen sich zusammenziehen (`-la`), **lange Optionen** `--all` sind besser lesbar;
  Werte stehen hinter der Option (`-n 3`, `--lines=3`).
- Die Shell unterscheidet **Groß- und Kleinschreibung** und trennt an **Leerzeichen**.
- **Anführungszeichen** halten Wörter zusammen: `"…"` ersetzt noch `$`-Platzhalter, `'…'` nimmt alles wörtlich; `\` schützt ein einzelnes Zeichen.
- Hilfe gibt es mit `--help`, ausführlich mit `man` (nicht im Übungs-Terminal) und `type` zeigt, ob ein Befehl eingebaut oder ein eigenes Programm ist.
