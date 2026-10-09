---
title: Prozesse, Umgebungsvariablen und der PATH
summary: Du findest und beendest laufende Prozesse, schickst Befehle in den Hintergrund, setzt Umgebungsvariablen mit export und verstehst, warum „command not found“ fast immer ein PATH-Problem ist.
duration: 25
sources:
  - title: Bash Reference Manual – Job Control Basics
    url: https://www.gnu.org/software/bash/manual/html_node/Job-Control-Basics.html
  - title: kill(1) – Linux manual page
    url: https://man7.org/linux/man-pages/man1/kill.1.html
  - title: signal(7) – Linux manual page
    url: https://man7.org/linux/man-pages/man7/signal.7.html
  - title: Bash Reference Manual – Environment
    url: https://www.gnu.org/software/bash/manual/html_node/Environment.html
  - title: Bash Reference Manual – Command Search and Execution
    url: https://www.gnu.org/software/bash/manual/html_node/Command-Search-and-Execution.html
quiz:
  - type: single
    question: Welches Signal schickt `kill 4711` ohne weitere Angabe?
    options:
      - SIGKILL (9) – der Prozess wird sofort beendet
      - SIGTERM (15) – der Prozess wird höflich gebeten, sich zu beenden
      - SIGINT (2) – wie Strg+C
    answer: 1
    explanation: Ohne Angabe sendet kill SIGTERM. Das Programm kann aufräumen und sich sauber beenden. SIGKILL (`kill -9`) ist der letzte Ausweg.
  - type: match
    question: Ordne jeder Tastenkombination oder jedem Befehl die Wirkung zu.
    pairs:
      - { left: "Strg+C", right: "Vordergrund-Prozess abbrechen" }
      - { left: "Strg+Z", right: "Vordergrund-Prozess anhalten" }
      - { left: "befehl &", right: "Befehl im Hintergrund starten" }
      - { left: "fg", right: "Job zurück in den Vordergrund holen" }
    explanation: Strg+C bricht ab, Strg+Z pausiert. Ein & startet im Hintergrund, fg holt einen Job nach vorn.
  - type: single
    question: "Du tippst `FARBE=blau` und startest danach `bash -c 'echo $FARBE'`. Was wird ausgegeben?"
    options:
      - blau
      - Eine leere Zeile
      - Eine Fehlermeldung
    answer: 1
    explanation: Ohne export ist FARBE nur eine Shell-Variable. Der neue bash-Prozess ist ein Kindprozess und erbt nur Umgebungsvariablen.
  - type: find-bug
    question: Nach diesen Zeilen funktionieren plötzlich weder `ls` noch `git`. Wo liegt der Fehler?
    language: bash
    code: |
      mkdir -p ~/bin
      cp mein-tool ~/bin/
      export PATH="$HOME/bin"
      mein-tool
    bug_line: 3
    explanation: "Die Zeile **ersetzt** den PATH, statt ihn zu erweitern. Danach sucht die Shell nur noch in ~/bin. Richtig: `export PATH=\"$HOME/bin:$PATH\"`."
  - type: cloze
    text: "Mit `___ PROJEKT=stacklab` erben auch Kindprozesse die Variable. Die Ordner im PATH sind durch ein ___ getrennt."
    blanks:
      - [export]
      - [":", Doppelpunkt]
    explanation: export macht aus einer Shell-Variable eine Umgebungsvariable. Der PATH ist eine Liste von Ordnern, getrennt durch Doppelpunkte.
tasks:
  - id: prozess-beenden
    type: terminal
    title: Einen Hintergrund-Dienst finden und beenden
    description: |
      Im Ordner `prozess-stoppen` liegt das Skript `dienst.sh`. Es schreibt beim Start seine PID in die
      Datei `dienst.pid` und läuft dann endlos weiter – wie ein kleiner Server.

      1. Starte das Skript im Hintergrund: `./dienst.sh &`
      2. Sieh dir mit `jobs -l` an, dass es läuft.
      3. Finde seine PID mit `pgrep -f dienst.sh` und speichere sie in der Datei `gefunden.txt`
         (`pgrep -f dienst.sh > gefunden.txt`).
      4. Beende den Prozess mit `kill` und der gefundenen PID (ohne `-9`).
      5. Prüfe mit `jobs` oder `pgrep -f dienst.sh`, dass er wirklich weg ist.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit das Skript angelegt wird.
    workdir: prozess-stoppen
    setup: |
      cat > dienst.sh <<'EOF'
      #!/usr/bin/env bash
      echo $$ > "$(dirname "$0")/dienst.pid"
      while true; do sleep 1; done
      EOF
      chmod +x dienst.sh
    checks:
      - type: file_exists
        path: dienst.pid
        message: dienst.pid fehlt – du hast dienst.sh noch nicht gestartet (`./dienst.sh &`).
      - type: command
        run: test -s gefunden.txt && [ "$(tr -d '[:space:]' < gefunden.txt)" = "$(tr -d '[:space:]' < dienst.pid)" ]
        message: In gefunden.txt steht noch nicht die PID von dienst.sh. Nutze `pgrep -f dienst.sh > gefunden.txt`, solange das Skript läuft.
      - type: command
        run: test -f dienst.pid && ! kill -0 "$(cat dienst.pid)" 2>/dev/null
        message: Der Prozess läuft noch. Beende ihn mit `kill` und seiner PID.
    hints:
      - Ein `&` am Ende der Zeile startet einen Befehl im Hintergrund – dein Prompt ist sofort wieder frei.
      - "`pgrep -f dienst.sh` sucht in der ganzen Befehlszeile aller Prozesse und gibt die PID aus."
      - "`kill $(cat dienst.pid)` oder `kill %1` (Job Nummer 1) beendet den Dienst höflich mit SIGTERM."
    solution: |
      ```bash
      cd prozess-stoppen
      ./dienst.sh &
      jobs -l
      pgrep -f dienst.sh > gefunden.txt
      kill "$(cat gefunden.txt)"
      pgrep -f dienst.sh   # keine Ausgabe mehr
      ```
  - id: path-erweitern
    type: terminal
    title: Ein eigenes Werkzeug in den PATH bringen
    description: |
      Im Ordner `path-erweitern` liegt der Unterordner `werkzeuge` mit einem kleinen Programm `gruss`.
      Es ist noch nicht ausführbar und liegt nicht im PATH.

      1. Finde heraus, wo das Programm `ls` liegt, und speichere den Pfad: `which ls > ls-ort.txt`
      2. Tippe `gruss` – du bekommst „command not found“.
      3. Mache `werkzeuge/gruss` ausführbar und starte es einmal mit `./werkzeuge/gruss`.
      4. Lege eine Datei `pfad.sh` an, die den Ordner `werkzeuge` **vorne** an den PATH anhängt.
         Verwende dafür den **absoluten** Pfad des Ordners (den liefert dir `pwd`) und überschreibe
         den bisherigen PATH nicht.
      5. Lade die Datei mit `source pfad.sh` und tippe `gruss` und `which gruss`.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit der Ordner `werkzeuge` angelegt wird.
    workdir: path-erweitern
    setup: |
      mkdir -p werkzeuge
      printf '#!/usr/bin/env bash\necho "Hallo aus dem PATH!"\n' > werkzeuge/gruss
      chmod 644 werkzeuge/gruss
    checks:
      - type: file_contains
        path: ls-ort.txt
        pattern: "^/(usr/)?bin/ls$"
        message: In ls-ort.txt steht noch nicht der Pfad von ls. Nutze `which ls > ls-ort.txt`.
      - type: command
        run: test -x werkzeuge/gruss
        message: werkzeuge/gruss ist noch nicht ausführbar. Denk an `chmod +x`.
      - type: file_exists
        path: pfad.sh
        message: Die Datei pfad.sh fehlt noch.
      - type: command
        run: source ./pfad.sh >/dev/null 2>&1; command -v ls
        message: Nach `source pfad.sh` findet die Shell nicht einmal mehr `ls` – du hast den PATH überschrieben. Hänge `:$PATH` an.
      - type: command
        run: d="$PWD"; cd / && source "$d/pfad.sh" >/dev/null 2>&1 && gruss
        stdout_matches: "Hallo aus dem PATH"
        message: Nach `source pfad.sh` lässt sich `gruss` noch nicht aus jedem Ordner starten. Nutze den absoluten Pfad von `werkzeuge` und `export`.
    hints:
      - Der PATH ist eine Liste von Ordnern, getrennt durch Doppelpunkte. Neue Ordner hängst du davor und behältst den Rest mit `$PATH`.
      - "`pwd` zeigt dir den absoluten Pfad, im Übungs-Terminal `/workspace/terminal/path-erweitern`."
      - "`echo 'export PATH=\"/workspace/terminal/path-erweitern/werkzeuge:$PATH\"' > pfad.sh` – die einfachen Anführungszeichen außen sorgen dafür, dass `$PATH` erst beim `source` eingesetzt wird."
    solution: |
      ```bash
      cd path-erweitern
      which ls > ls-ort.txt
      gruss                      # bash: gruss: command not found
      chmod +x werkzeuge/gruss
      ./werkzeuge/gruss
      pwd                        # /workspace/terminal/path-erweitern
      echo 'export PATH="/workspace/terminal/path-erweitern/werkzeuge:$PATH"' > pfad.sh
      source pfad.sh
      gruss
      which gruss
      ```
  - id: variablen-reichweite
    type: dragdrop
    title: Wie weit reicht die Variable?
    description: Ordne jede Zeile danach, wo die Variable anschließend sichtbar ist.
    targets:
      - { id: shell, label: Nur in der aktuellen Shell }
      - { id: kinder, label: In der aktuellen Shell und allen später gestarteten Programmen }
      - { id: einmal, label: Nur für genau einen Befehl }
    items:
      - { label: "FARBE=blau", target: shell }
      - { label: "ZAEHLER=0", target: shell }
      - { label: "export FARBE=blau", target: kinder }
      - { label: "export PATH=\"$HOME/bin:$PATH\"", target: kinder }
      - { label: "LANG=C sort liste.txt", target: einmal }
      - { label: "DEBUG=1 ./start.sh", target: einmal }
    hints:
      - Steht die Zuweisung direkt vor einem Befehl in derselben Zeile, gilt sie nur für diesen Befehl.
---

Du startest einen Befehl – und der Prompt kommt nicht zurück. Läuft das noch? Hängt es? Und warum
findet die Shell ein Programm nicht, obwohl du es gerade installiert hast? Beide Fragen beantwortest
du, wenn du zwei Dinge verstehst: **Prozesse** und die **Umgebung**, die jeder Prozess mitbekommt.

## Programme und Prozesse

Ein [[programm|Programm]] ist eine Datei, zum Beispiel `/usr/bin/sleep` – ein Rezept im Kochbuch.
Startest du es, entsteht ein [[prozess|Prozess]]: das Kochen selbst, mit eigenem Speicher und eigener
Rechenzeit. Dasselbe Programm kann mehrmals gleichzeitig laufen. Jeder Prozess bekommt deshalb eine
eindeutige Nummer, die [[pid|PID]].

Tippst du `ls`, startet deine Shell einen neuen Prozess. Die Shell ist der Elternprozess, `ls` ist ein
[[kindprozess|Kindprozess]].

| Befehl | Zeigt |
|---|---|
| `ps` | Prozesse in deinem Terminal |
| `ps aux` | alle Prozesse des Systems |
| `pgrep -a name` | PIDs und Befehlszeilen passender Prozesse |
| `top` / `htop` | Live-Ansicht, sortiert nach CPU – beenden mit `q` |
| `echo $$` | die PID deiner eigenen Shell |

```bash title="Terminal"
pgrep -a sleep        # 2381 sleep 300
pgrep -f dienst.sh    # sucht in der ganzen Befehlszeile – nötig bei Skripten
```

## Prozesse beenden: Signale

Prozesse bekommen Nachrichten in Form von [[signal|Signalen]]. Der Befehl `kill` schickt ein Signal an
eine PID – nicht unbedingt den Tod:

| Signal | Bedeutung | Auslöser |
|---|---|---|
| `SIGTERM` (15) | Bitte beenden – Standard von kill | `kill PID` |
| `SIGKILL` (9) | Sofort beenden, nicht abfangbar | `kill -9 PID` |
| `SIGINT` (2) | Unterbrechen | Strg+C |
| `SIGTSTP` | Anhalten | Strg+Z |

Mit SIGTERM kann ein Programm noch Dateien speichern und aufräumen. SIGKILL entfernt es mitten in der
Arbeit. Ob ein Prozess noch lebt, prüfst du mit `kill -0 PID`: Exit-Code 0 heißt „lebt“.

> [!MERKSATZ]
> Erst `kill PID` (SIGTERM), ein paar Sekunden warten – und nur wenn der Prozess dann noch lebt:
> `kill -9 PID`.

## Vordergrund und Hintergrund

Normalerweise läuft ein Befehl im **Vordergrund**: Die Shell wartet, bis er fertig ist. Ein `&` am
Ende startet ihn als [[hintergrundprozess|Hintergrundprozess]], und dein Prompt ist sofort frei:

```bash title="Terminal"
sleep 300 &       # [1] 2381  – Jobnummer und PID
jobs -l           # alle Jobs dieser Shell
fg %1             # Job 1 nach vorn holen
kill %1           # Job 1 beenden, ohne die PID zu kennen
```

Ein [[job|Job]] ist ein Prozess, den deine aktuelle Shell verwaltet. Läuft ein langer Befehl schon im
Vordergrund, hältst du ihn mit Strg+Z an und lässt ihn mit `bg` im Hintergrund weiterlaufen.

> [!FEHLER]
> **Sofort `kill -9`.** Das wirkt immer, hinterlässt aber oft halb geschriebene Dateien. Gib dem
> Prozess mit SIGTERM erst die Chance aufzuräumen.

## Umgebungsvariablen

Eine Shell-[[variable|Variable]] legst du mit `NAME=wert` an – ohne Leerzeichen um das `=` – und
liest sie mit `"$NAME"`. Sie existiert nur in deiner aktuellen Shell.

Eine [[umgebungsvariable|Umgebungsvariable]] dagegen wird an jeden Kindprozess **als Kopie**
weitergegeben. Stell dir einen Rucksack vor, den jedes Kind mitbekommt. Mit `export` packst du eine
Variable hinein:

```bash title="Terminal"
FARBE=blau
bash -c 'echo "Kind sieht: $FARBE"'   # Kind sieht:
export FARBE
bash -c 'echo "Kind sieht: $FARBE"'   # Kind sieht: blau
DEBUG=1 ./start.sh                     # gilt nur für diesen einen Befehl
```

Wichtige Variablen sind `HOME`, `USER`, `SHELL`, `PWD`, `EDITOR` und `PATH`; `env` zeigt alle.
Dauerhaft werden Variablen und [[alias|Aliase]] (`alias ll='ls -la'`) erst in einer
[[shell-konfiguration|Konfigurationsdatei]]: `~/.bashrc` unter Linux, `~/.zshrc` auf dem Mac. Nach
einer Änderung lädst du sie mit dem [[source-befehl|source-Befehl]] neu: `source ~/.bashrc`.

> [!PRAXIS]
> Webanwendungen lesen ihre Konfiguration fast immer aus Umgebungsvariablen: Datenbank-Adresse,
> Debug-Modus, API-Schlüssel. So läuft derselbe Code lokal und auf dem Server – nur die Umgebung ist
> anders.

## Der PATH und „command not found“

Tippst du `git`, startest du eigentlich eine Datei wie `/usr/bin/git`. Die Shell sucht sie in den
Ordnern der Variable [[path-variable|PATH]] – von links nach rechts, der erste Treffer gewinnt:

![Die Shell durchsucht die Ordner im PATH von links nach rechts](/assets/terminal-shell/system-path-suche.svg)

```bash title="Terminal"
echo "$PATH"                       # /usr/local/bin:/usr/bin:/bin
command -v git                     # /usr/bin/git – oder nichts, Exit-Code 1
export PATH="$HOME/bin:$PATH"      # eigenen Ordner vorn anhängen
```

Der aktuelle Ordner steht absichtlich **nicht** im PATH. Deshalb startest du eigene Skripte mit
`./skript.sh` – und die Datei muss eine [[ausfuehrbare-datei|ausführbare Datei]] sein.

Bei „command not found“ prüfst du der Reihe nach: Tippfehler? Findet `command -v` das Programm? Ist es
überhaupt installiert (sonst [[paketmanager|Paketmanager]] wie `apt` oder `brew`)? Liegt sein Ordner im
PATH? Wurde die `.bashrc` nach der Installation neu geladen?

## Zusammenfassung

- Ein Prozess ist ein laufendes Programm mit eigener PID; `ps aux`, `pgrep` und `top` zeigen Prozesse.
- `kill PID` schickt SIGTERM, `kill -9` SIGKILL als letzten Ausweg; Strg+C bricht ab, Strg+Z hält an.
- `befehl &` startet im Hintergrund, `jobs`, `fg`, `bg` und `kill %1` verwalten Jobs.
- `export NAME=wert` macht eine Variable für Kindprozesse sichtbar; dauerhaft wird sie in `~/.bashrc` oder `~/.zshrc`.
- Der PATH ist eine Liste von Ordnern, die von links nach rechts durchsucht wird – erweitern, nie ersetzen.
