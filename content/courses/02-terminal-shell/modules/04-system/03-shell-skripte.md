---
title: Shell-Skripte schreiben
summary: Aus einzelnen Befehlen wird ein eigenes Werkzeug – mit Shebang, Variablen, Argumenten, Exit-Codes, if und for.
duration: 25
sources:
  - title: Bash Reference Manual – Shell Scripts
    url: https://www.gnu.org/software/bash/manual/html_node/Shell-Scripts.html
  - title: Bash Reference Manual – Shell Parameters
    url: https://www.gnu.org/software/bash/manual/html_node/Shell-Parameters.html
  - title: Bash Reference Manual – Exit Status
    url: https://www.gnu.org/software/bash/manual/html_node/Exit-Status.html
  - title: Bash Reference Manual – Conditional Constructs
    url: https://www.gnu.org/software/bash/manual/html_node/Conditional-Constructs.html
  - title: Bash Reference Manual – Looping Constructs
    url: https://www.gnu.org/software/bash/manual/html_node/Looping-Constructs.html
  - title: Bash Reference Manual – The Set Builtin
    url: https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html
quiz:
  - type: single
    question: Welche Aufgabe hat die Zeile `#!/usr/bin/env bash` ganz oben in einem Skript?
    options:
      - Sie ist ein Kommentar und wird komplett ignoriert.
      - Sie sagt dem Betriebssystem, mit welchem Programm die Datei ausgeführt werden soll.
      - Sie macht die Datei automatisch ausführbar.
    answer: 1
    explanation: Das ist der Shebang. Startest du das Skript mit `./skript.sh`, liest das Betriebssystem die erste Zeile und startet das genannte Programm. Ausführbar wird die Datei erst durch `chmod +x`.
  - type: find-bug
    question: "Das Skript bricht mit „name: command not found“ ab. In welcher Zeile steckt der Fehler?"
    language: bash
    code: |
      #!/usr/bin/env bash
      # Begrüßt eine Person
      name = "Ada"
      echo "Hallo, $name!"
    bug_line: 3
    explanation: Bei einer Zuweisung dürfen um das `=` keine Leerzeichen stehen. Sonst hält die Bash `name` für einen Befehl. Richtig ist `name="Ada"`.
  - type: match
    question: Du startest `./gruss.sh Ada Bob`. Ordne jedem Ausdruck seinen Wert im Skript zu.
    pairs:
      - { left: "$0", right: "./gruss.sh" }
      - { left: "$1", right: "Ada" }
      - { left: "$#", right: "2" }
      - { left: "$?", right: "Exit-Code des letzten Befehls" }
    explanation: "`$0` ist der Name des Skripts, `$1` das erste Argument, `$#` die Anzahl der Argumente. `$?` enthält den Exit-Code des zuletzt ausgeführten Befehls."
  - type: single
    question: In welcher Situation läuft `echo fertig` im Befehl `mkdir neu && echo fertig`?
    options:
      - Immer, egal was mkdir meldet
      - Nur wenn mkdir mit Exit-Code 0 endet
      - Nur wenn mkdir mit einem Fehler endet
    answer: 1
    explanation: "`&&` heißt „und dann, falls erfolgreich“. Für „falls fehlgeschlagen“ gibt es `||`, für „auf jeden Fall“ das Semikolon."
  - type: cloze
    text: "Eine for-Schleife hat die Form `for datei in *.txt; ___ echo \"$datei\"; ___`. Ein if-Block endet mit ___."
    blanks:
      - [do]
      - [done]
      - [fi]
    explanation: Der Schleifenkörper steht zwischen do und done. Ein if beginnt mit then und endet mit fi.
tasks:
  - id: pfade-pruefen
    type: terminal
    title: Schreibe pruefe.sh
    description: |
      Im Ordner `skript-pruefen` liegen ein Ordner `bilder`, eine Datei `mein bericht.txt` (mit
      Leerzeichen!) und eine Datei `notiz.txt`. Schreibe ein Skript `pruefe.sh`, das beliebig viele
      Pfade als Argumente bekommt und für **jeden** eine Zeile ausgibt:

      - `Ordner: <pfad>`, wenn es ein Ordner ist,
      - `Datei: <pfad>`, wenn es eine normale Datei ist,
      - `Fehlt: <pfad>`, wenn es den Pfad nicht gibt.

      Exit-Codes:

      1. **0**, wenn alle Pfade existieren.
      2. **1**, wenn mindestens ein Pfad fehlt (trotzdem alle Pfade prüfen!).
      3. **2**, wenn gar kein Argument übergeben wurde. Dann gibt das Skript
         `Aufruf: pruefe.sh PFAD...` auf der Standardfehlerausgabe aus.

      Teste mit `./pruefe.sh bilder "mein bericht.txt" gibt-es-nicht; echo $?`. Erwartet:

      ```text
      Ordner: bilder
      Datei: mein bericht.txt
      Fehlt: gibt-es-nicht
      1
      ```

      Klicke zuerst auf **Aufgabe vorbereiten**. Stacklab startet dein Skript beim Prüfen mit eigenen Testpfaden.
    workdir: skript-pruefen
    setup: |
      mkdir -p bilder
      printf 'Quartalszahlen\n' > "mein bericht.txt"
      printf 'Nicht vergessen\n' > notiz.txt
    checks:
      - type: file_exists
        path: pruefe.sh
        message: Die Datei pruefe.sh fehlt noch.
      - type: command
        run: bash -n pruefe.sh && test -x pruefe.sh && head -n 1 pruefe.sh | grep -Eq '^#!.*bash'
        message: pruefe.sh braucht einen Bash-Shebang, korrekte Syntax (bash -n) und das Ausführen-Recht (chmod +x).
      - type: command
        run: |
          s="$PWD/pruefe.sh"; t=$(mktemp -d "$PWD/.pruefung-XXXXXX"); cd "$t" || exit 1
          mkdir "mein ordner"; echo x > "a b.txt"
          out=$("$s" "mein ordner" "a b.txt" fehlt.txt 2>/dev/null)
          cd .. && rm -rf "$t"
          if [ "$out" = "$(printf 'Ordner: mein ordner\nDatei: a b.txt\nFehlt: fehlt.txt')" ]; then echo ok; else printf '%s\n' "$out"; fi
        stdout_equals: ok
        message: "Die Ausgabe stimmt noch nicht. Für jeden Pfad eine Zeile `Ordner: …`, `Datei: …` oder `Fehlt: …` – und Pfade mit Leerzeichen müssen ganz bleiben (nutze \"$@\" und \"$pfad\")."
      - type: command
        run: |
          s="$PWD/pruefe.sh"; t=$(mktemp -d "$PWD/.pruefung-XXXXXX"); cd "$t" || exit 1
          mkdir ordner; echo x > datei.txt
          "$s" ordner nichts.txt datei.txt >/dev/null 2>&1; a=$?
          "$s" ordner datei.txt >/dev/null 2>&1; b=$?
          cd .. && rm -rf "$t"
          echo "$a $b"
        stdout_equals: "1 0"
        message: Exit-Code 1, wenn mindestens ein Pfad fehlt (auch wenn danach noch einer existiert), und 0, wenn alle existieren.
      - type: command
        run: |
          s="$PWD/pruefe.sh"
          out=$("$s" 2>/dev/null); err=$("$s" 2>&1 >/dev/null); "$s" >/dev/null 2>&1; code=$?
          if [ "$code" -eq 2 ] && [ -z "$out" ] && printf '%s' "$err" | grep -q 'Aufruf'; then echo ok; else echo "code=$code"; fi
        stdout_equals: ok
        message: "Ohne Argument soll das Skript `Aufruf: pruefe.sh PFAD...` auf stderr ausgeben (>&2) und mit Exit-Code 2 enden."
    hints:
      - "Prüfe zuerst `$#`: `if [ \"$#\" -eq 0 ]; then … exit 2; fi`. Danach läuft eine Schleife `for pfad in \"$@\"; do … done`."
      - "In der Schleife entscheidet `if [ -d \"$pfad\" ]; then … elif [ -f \"$pfad\" ]; then … else … fi`."
      - "Merk dir in einer Variable, ob etwas fehlte (`fehlt=1`), und setze am Ende `exit \"$fehlt\"` – starte mit `fehlt=0`."
    solution: |
      ```bash
      cd skript-pruefen
      cat > pruefe.sh <<'EOF'
      #!/usr/bin/env bash
      set -uo pipefail

      if [ "$#" -eq 0 ]; then
        echo "Aufruf: pruefe.sh PFAD..." >&2
        exit 2
      fi

      fehlt=0
      for pfad in "$@"; do
        if [ -d "$pfad" ]; then
          echo "Ordner: $pfad"
        elif [ -f "$pfad" ]; then
          echo "Datei: $pfad"
        else
          echo "Fehlt: $pfad"
          fehlt=1
        fi
      done

      exit "$fehlt"
      EOF
      chmod +x pruefe.sh
      ./pruefe.sh bilder "mein bericht.txt" gibt-es-nicht; echo $?
      ```
  - id: und-oder-fluss
    type: diagram
    title: Wer läuft wann?
    description: Beschrifte das Ablaufdiagramm für `befehl_a && befehl_b || befehl_c`. Welcher Exit-Code führt nach links, welcher nach rechts – und welcher Befehl läuft dann?
    image: /assets/terminal-shell/skripte-exit-codes-leer.svg
    slots:
      - { x: 31, y: 40, answer: Exit-Code 0 }
      - { x: 69, y: 40, answer: Exit-Code ungleich 0 }
      - { x: 21, y: 73, answer: befehl_b }
      - { x: 79, y: 73, answer: befehl_c }
    distractors: [befehl_a, Exit-Code 127]
    hints:
      - "`&&` steht für „bei Erfolg weiter“, `||` für „bei Fehler stattdessen“."
---

Jeden Morgen dieselben fünf Befehle tippen, und einmal pro Woche vertippst du dich? Genau dafür gibt es
Skripte: Du schreibst die Befehle **einmal** auf und lässt sie danach so oft laufen, wie du willst. In
dieser Lektion baust du alles, was du für das Kursprojekt brauchst.

## Ein Skript anlegen und starten

Ein [[skript|Shell-Skript]] ist eine [[textdatei|Textdatei]] mit Befehlen, die die [[bash|Bash]] von
oben nach unten ausführt – wie ein Kochrezept. Die erste Zeile ist der [[shebang|Shebang]]: Er sagt dem
Betriebssystem, welches Programm die Datei ausführen soll. Zeilen mit `#` sind Kommentare.

![Anatomie eines Shell-Skripts: Shebang, Kommentar, Variable, Kommandosubstitution, Ausgabe und Exit-Code](/assets/terminal-shell/skripte-anatomie.svg)

```bash title="hallo.sh"
#!/usr/bin/env bash
# Begrüßt dich mit dem heutigen Datum
echo "Hallo! Heute ist $(date +%F)."
```

```bash title="Terminal"
nano hallo.sh        # schreiben, Strg+O speichern, Strg+X beenden
chmod +x hallo.sh    # ausführbar machen
./hallo.sh           # starten – ./ heißt „die Datei hier“
bash -n hallo.sh     # nur die Syntax prüfen
```

`#!/usr/bin/env bash` findet die erste Bash im PATH und läuft deshalb auf Linux, macOS und in Git Bash.

> [!MERKSATZ]
> Der Shebang steht **immer in der allerersten Zeile**. Ohne `chmod +x` meldet `./skript.sh`
> „Permission denied“.

## Variablen und Argumente

Eine [[variable|Variable]] legst du ohne Leerzeichen um das `=` an und liest sie mit `$`:

```bash
projekt="stacklab"
heute=$(date +%F)              # Ausgabe eines Befehls speichern
echo "Projekt: $projekt am $heute"
```

`$(...)` heißt [[kommandosubstitution|Kommandosubstitution]]: Die Bash führt den Befehl aus und setzt
seine Ausgabe ein. Was du beim Start übergibst, landet in [[skript-argument|Skript-Argumenten]]:

| Ausdruck | Inhalt bei `./gruss.sh Ada Bob` |
|---|---|
| `$0` | `./gruss.sh` |
| `$1`, `$2` | `Ada`, `Bob` |
| `$#` | `2` – die Anzahl |
| `"$@"` | alle Argumente, jedes einzeln und unverändert |

> [!FEHLER]
> **Variablen ohne Anführungszeichen.** `rm $datei` zerlegt `mein bericht.txt` in zwei Wörter und
> versucht zwei Dateien zu löschen. Schreib immer `"$datei"` und `"$@"`.

## Exit-Codes, && und ||

Jeder Befehl endet mit einem [[exit-code|Exit-Code]]: **0** heißt Erfolg, alles andere Fehler oder
„Nein“. Den letzten Exit-Code liest du in `$?`. Mit `exit 1` beendest du dein Skript mit einem Fehler.

| Schreibweise | Bedeutung |
|---|---|
| `a ; b` | `b` läuft immer |
| `a && b` | `b` nur, wenn `a` erfolgreich war |
| `a \|\| b` | `b` nur, wenn `a` fehlgeschlagen ist |

![Ablauf von befehl_a && befehl_b || befehl_c: Exit-Code 0 führt zu befehl_b, ungleich 0 zu befehl_c](/assets/terminal-shell/skripte-exit-codes.svg)

Das wichtigste Muster fängt Fehler ab und meldet sie auf der
[[standardfehlerausgabe|Standardfehlerausgabe]]:

```bash
cd "$ziel" || { echo "Fehler: $ziel gibt es nicht" >&2; exit 1; }
```

Viele Skripte beginnen außerdem mit dem [[strict-mode|Strict Mode]] `set -euo pipefail`: Abbruch bei
unbehandelten Fehlern (`-e`), bei nicht gesetzten Variablen (`-u`) und bei Fehlern mitten in Pipes.

## Entscheiden mit if

`if` führt einen Befehl aus und wertet seinen Exit-Code aus. Meist ist das der Testbefehl `[ … ]` –
mit Leerzeichen innen:

```bash
if [ "$#" -eq 0 ]; then
  echo "Aufruf: $0 ORDNER" >&2
  exit 2
elif [ -d "$1" ]; then
  echo "$1 ist ein Ordner"
else
  echo "$1 fehlt"
fi
```

| Test | Bedeutung |
|---|---|
| `-f pfad` / `-d pfad` / `-e pfad` | Datei / Ordner / existiert |
| `-x pfad` | ausführbar |
| `-z "$s"` | Text ist leer |
| `"$a" = "$b"` | Texte gleich |
| `"$a" -eq "$b"`, `-lt`, `-gt` | Zahlen gleich, kleiner, größer |

In Bash gibt es zusätzlich `[[ … ]]`, das Muster kann: `[[ "$name" == *.txt ]]`.

## Wiederholen mit for

Eine `for`-Schleife läuft über eine Liste – Argumente, Dateien oder Zahlen:

```bash
for datei in *.log; do
  [ -f "$datei" ] || continue        # nichts gefunden? überspringen
  echo "Gefunden: $datei"
done

anzahl=0
for arg in "$@"; do anzahl=$((anzahl + 1)); done
echo "$anzahl Argumente"
```

`continue` springt zum nächsten Durchlauf, `break` beendet die Schleife. `$((…))` rechnet mit ganzen
Zahlen. Zeilen einer Datei liest du mit `while IFS= read -r zeile; do … done < datei.txt`.

> [!PRAXIS]
> In Teams liegen kleine Skripte oft im Ordner `scripts/` eines Repositorys: `setup.sh` richtet die
> Umgebung ein, `test.sh` startet alle Tests. Ein ehrlicher Exit-Code ist dabei Pflicht – CI-Pipelines
> werden rot, wenn ein Skript nicht mit 0 endet.

## Zusammenfassung

- Ein Skript ist eine Textdatei mit Shebang in Zeile 1; `chmod +x` und `./skript.sh` starten es.
- Variablen ohne Leerzeichen zuweisen, immer in Anführungszeichen lesen; `$1`, `$#`, `"$@"` liefern die Argumente.
- Exit-Code 0 heißt Erfolg; `$?` liest ihn, `exit n` setzt ihn, `&&` und `||` reagieren darauf.
- Fehlermeldungen gehören mit `>&2` auf stderr; `set -euo pipefail` macht Skripte strenger.
- `if [ … ]; then … fi` entscheidet, `for x in …; do … done` wiederholt.
