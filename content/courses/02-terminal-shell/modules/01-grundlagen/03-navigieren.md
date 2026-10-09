---
title: Im Dateisystem navigieren
summary: Wie Ordner als Baum organisiert sind und wie du dich mit pwd, ls und cd sicher darin bewegst – mit absoluten und relativen Pfaden.
duration: 20
sources:
  - title: GNU Coreutils – ls invocation
    url: https://www.gnu.org/software/coreutils/manual/html_node/ls-invocation.html
  - title: GNU Coreutils – pwd invocation
    url: https://www.gnu.org/software/coreutils/manual/html_node/pwd-invocation.html
  - title: Bash Reference Manual – Bourne Shell Builtins (cd)
    url: https://www.gnu.org/software/bash/manual/html_node/Bourne-Shell-Builtins.html
  - title: hier(7) – Beschreibung der Linux-Verzeichnisstruktur
    url: https://man7.org/linux/man-pages/man7/hier.7.html
  - title: Microsoft Learn – Dateisysteme in WSL
    url: https://learn.microsoft.com/de-de/windows/wsl/filesystems
quiz:
  - type: single
    question: Du bist in `/home/ada/projekte` und tippst `cd ..`. Wo bist du danach?
    options:
      - "/home/ada"
      - "/home"
      - "/"
      - "/home/ada/projekte/.."
    answer: 0
    explanation: "`..` bedeutet „eine Ebene nach oben“. Von projekte aus ist das der Ordner ada, also `/home/ada`."
  - type: multiple
    question: Welche dieser Pfade sind absolute Pfade?
    options:
      - "/etc/hosts"
      - "projekte/web"
      - "~/bilder"
      - "../notizen.txt"
    answers: [0, 2]
    explanation: "Ein absoluter Pfad beginnt bei der Wurzel `/`. `~` ist eine Abkürzung, die die Shell durch dein Home-Verzeichnis (z. B. `/home/ada`) ersetzt – also ebenfalls absolut. `projekte/web` und `../notizen.txt` hängen davon ab, wo du gerade bist."
  - type: cloze
    text: Mit `___` zeigst du an, in welchem Ordner du gerade bist. Mit `ls ___` siehst du auch versteckte Dateien.
    blanks:
      - [pwd]
      - [-a, -la, -al, -A]
    explanation: pwd steht für „print working directory“. Die Option -a (all) zeigt auch Dateien, deren Name mit einem Punkt beginnt.
  - type: match
    question: Ordne jedem Befehl zu, wohin er dich bringt.
    pairs:
      - { left: "cd", right: "In dein Home-Verzeichnis" }
      - { left: "cd /", right: "In das Wurzelverzeichnis" }
      - { left: "cd -", right: "In den Ordner, in dem du vorher warst" }
      - { left: "cd .", right: "Bleibt im aktuellen Ordner" }
    explanation: cd ohne Argument führt nach Hause, / ist die Wurzel, - springt zurück zum vorherigen Ordner, und . ist der aktuelle Ordner selbst.
  - type: find-bug
    question: Ada will in ihren Ordner `Meine Bilder` wechseln und dort alles auflisten. In welcher Zeile steckt der Fehler?
    language: bash
    code: |
      pwd
      cd Meine Bilder
      ls -l
    bug_line: 2
    explanation: "Die Shell trennt Argumente an Leerzeichen. `cd` bekommt hier zwei Argumente (Meine und Bilder) und meldet einen Fehler. Richtig ist `cd \"Meine Bilder\"` oder `cd Meine\\ Bilder`."
tasks:
  - id: baum-beschriften
    type: diagram
    title: Beschrifte den Verzeichnisbaum
    description: |
      So ist ein typisches Linux-System aufgebaut. Fünf Ordnernamen fehlen. Die kleine graue Zeile
      in jedem Kasten verrät dir, wofür der Ordner da ist.
    image: /assets/terminal-shell/dateisystem-baum-leer.svg
    slots:
      - { x: 50, y: 14, answer: "/" }
      - { x: 16, y: 38, answer: home }
      - { x: 33, y: 38, answer: etc }
      - { x: 50, y: 38, answer: tmp }
      - { x: 84, y: 62, answer: log }
    distractors: [Users, Desktop, root]
    hints:
      - Ganz oben steht die Wurzel, die keinen Buchstaben als Namen hat.
      - "Die Abkürzungen: home = Benutzer, etc = Einstellungen, tmp = temporary, log = Protokolle."
  - id: schatzsuche
    type: terminal
    title: Schatzsuche im Dateisystem
    description: |
      Im Ordner `nav-schatzsuche` sind mehrere Wege angelegt: `wald/eiche/hoehle`,
      `wald/buche/hoehle` und `berg/gipfel/hoehle`. In **genau einer** Höhle liegt eine
      versteckte Datei namens `.schatz`.

      1. Sieh dich mit `pwd`, `ls` und `ls -a` um. Auch im Startordner liegt etwas Verstecktes.
      2. Finde die Höhle mit der versteckten Datei. Wechsle mit `cd` hinein.
      3. Schreibe dort den absoluten Pfad dieser Höhle in die Datei `fundort.txt`:
         `pwd > fundort.txt` (das `>` leitet die Ausgabe in eine Datei um – mehr dazu im Modul „Suchen, Umleiten und Pipes“).
      4. Wechsle mit `cd` (ohne Argument) in dein Home-Verzeichnis und schreibe von dort aus den
         aktuellen Pfad in die Datei `home.txt` im Aufgabenordner. Weil du nicht mehr im
         Aufgabenordner bist, brauchst du dafür einen **absoluten** Pfad:
         `pwd > /workspace/terminal/nav-schatzsuche/home.txt`

      Klicke zuerst auf **Aufgabe vorbereiten**, damit Wald, Berg und Höhlen angelegt werden.
    workdir: nav-schatzsuche
    setup: |
      mkdir -p wald/eiche/hoehle wald/buche/hoehle berg/gipfel/hoehle
      printf 'Nur Moos hier.\n' > wald/eiche/hoehle/moos.txt
      printf 'Nur Steine hier.\n' > berg/gipfel/hoehle/steine.txt
      printf 'Gefunden!\n' > wald/buche/hoehle/.schatz
      printf 'Der Schatz liegt in einer Hoehle.\n' > .wegweiser
    checks:
      - type: file_exists
        path: wald/buche/hoehle/fundort.txt
        message: In der richtigen Höhle liegt noch keine fundort.txt. Prüfe jede Höhle mit ls -a – die mit .schatz ist die richtige.
      - type: file_contains
        path: wald/buche/hoehle/fundort.txt
        pattern: "^/.*/nav-schatzsuche/wald/buche/hoehle\\s*$"
        message: fundort.txt muss den absoluten Pfad der Höhle enthalten. Führe pwd > fundort.txt aus, während du in der Höhle bist.
      - type: file_exists
        path: home.txt
        message: Die Datei home.txt fehlt im Aufgabenordner. Schreibe sie mit dem absoluten Pfad /workspace/terminal/nav-schatzsuche/home.txt.
      - type: file_contains
        path: home.txt
        pattern: "^/workspace/\\.home\\s*$"
        message: home.txt soll den Pfad deines Home-Verzeichnisses enthalten. Wechsle zuerst mit cd (ohne Argument) nach Hause und führe dann pwd aus.
    hints:
      - "`ls` zeigt keine Dateien, deren Name mit einem Punkt beginnt. Nutze in jeder Höhle `ls -a`."
      - "Du kannst auch von oben hineinschauen, ohne zu wechseln: `ls -a wald/buche/hoehle`."
      - "Die richtige Höhle ist `wald/buche/hoehle`. Dort: `pwd > fundort.txt`, danach `cd` und `pwd > /workspace/terminal/nav-schatzsuche/home.txt`."
    solution: |
      ```bash
      cd nav-schatzsuche
      ls -a                      # zeigt auch .wegweiser
      ls -a wald/eiche/hoehle    # nur moos.txt
      ls -a wald/buche/hoehle    # hier liegt .schatz
      cd wald/buche/hoehle
      pwd > fundort.txt
      cd                         # ab nach Hause
      pwd > /workspace/terminal/nav-schatzsuche/home.txt
      cd -                       # zurück in die Höhle
      ```
  - id: wo-bin-ich
    type: steps
    title: Wo bist du jetzt?
    description: Verfolge im Kopf, wie sich der aktuelle Ordner nach jedem Befehl ändert. Du startest in `/home/ada`.
    steps:
      - situation: Du bist in `/home/ada` und tippst `cd projekte/web`.
        question: Wo bist du jetzt?
        options: ["/projekte/web", "/home/ada/projekte/web", "/home/projekte/web"]
        answer: 1
        explanation: projekte/web ist ein relativer Pfad. Er wird an den aktuellen Ordner /home/ada angehängt.
      - situation: Jetzt tippst du `cd ../..`.
        question: Wo landest du?
        options: ["/home/ada", "/home", "/home/ada/projekte"]
        answer: 0
        explanation: Jedes .. geht eine Ebene nach oben – von web zu projekte und von dort zu ada.
      - situation: Du tippst `cd /etc`.
        question: Wo bist du jetzt?
        options: ["/home/ada/etc", "/etc", "/home/etc"]
        answer: 1
        explanation: Der Pfad beginnt mit / und ist damit absolut. Er gilt unabhängig davon, wo du vorher warst.
      - situation: Zum Schluss tippst du `cd -`.
        question: Wohin bringt dich das?
        options: ["/home/ada", "/", "/etc/.."]
        answer: 0
        explanation: cd - springt zurück in den Ordner, in dem du direkt vorher warst – das war /home/ada.
---

Stell dir vor, jemand drückt dir einen Schlüsselbund in die Hand und sagt: „Der Ordner mit den
Rechnungen liegt irgendwo im Keller.“ Ohne zu wissen, wie das Haus aufgebaut ist, suchst du ewig.
Im Terminal ist es genauso. Bevor du Dateien anlegen oder löschen kannst, musst du wissen, **wo** du
stehst und **wie** du woandershin kommst.

## Das Dateisystem ist ein Baum

Das [[dateisystem|Dateisystem]] ist die Ordnung, in der dein [[betriebssystem|Betriebssystem]] alle
[[datei|Dateien]] und [[ordner]] ablegt. Stell es dir als umgedrehten Baum vor: oben ein Stamm, darunter
Äste, darunter kleinere Äste. Die Blätter sind die Dateien.

Ganz oben steht das [[wurzelverzeichnis|Wurzelverzeichnis]] `/` (ein Schrägstrich, englisch *slash*).
Es gibt nur eine Wurzel – alles hängt irgendwo darunter. Ordner heißen im Terminal oft
**Verzeichnis** (*directory*), beide Wörter meinen dasselbe.

![Das Linux-Dateisystem als Baum: unter / liegen home, etc, tmp, usr und var](/assets/terminal-shell/dateisystem-baum.svg)

| Ordner | Wofür? |
|---|---|
| `/home` | persönliche Ordner der Benutzer, z. B. `/home/ada` |
| `/etc` | Einstellungsdateien |
| `/tmp` | temporäre Dateien |
| `/usr/bin` | [[programm|Programme]], die du als Befehle aufrufst, z. B. `ls` |
| `/var/log` | Protokolldateien |

Jeder Benutzer hat ein [[home-verzeichnis|Home-Verzeichnis]] – deinen persönlichen Bereich. Die Shell
kürzt es mit `~` (Tilde) ab. Zeigt dein Prompt `ada@laptop:~$`, bist du zu Hause.

Auf **macOS** heißen die Benutzerordner `/Users/ada`. **Windows** hat pro Laufwerk eine eigene Wurzel
und trennt mit Backslash: `C:\Users\ada`. In WSL findest du dieses Laufwerk unter `/mnt/c`, in Git Bash
unter `/c`.

> [!HINWEIS]
> Im Übungs-Terminal ist dein Home-Verzeichnis `/workspace/.home`. Die Aufgaben laufen in Unterordnern
> von `/workspace/terminal`.

## Wo bin ich, was liegt hier? – pwd und ls

Die Shell merkt sich immer einen Ordner, in dem du dich „befindest“: das
[[aktuelles-verzeichnis|aktuelle Verzeichnis]]. Befehle ohne Ortsangabe arbeiten dort. `pwd`
(*print working directory*) zeigt ihn – wie der rote Punkt „Sie sind hier“ auf einem Lageplan.

```bash title="Terminal"
pwd          # /home/ada
ls           # Inhalt des aktuellen Ordners
ls /etc      # Inhalt eines anderen Ordners
ls -lah      # lang, alle Dateien, lesbare Größen
```

| Option | Wirkung |
|---|---|
| `-l` | lange Liste: Rechte, Besitzer, Größe, Datum |
| `-a` | **alle** Dateien, auch versteckte |
| `-h` | Größen lesbar (`4.0K`) – zusammen mit `-l` |
| `-t` | nach Änderungszeit, neueste zuerst |
| `-R` | rekursiv, auch alle Unterordner |
| `-1` | ein Eintrag pro Zeile |

Eine [[versteckte-datei|versteckte Datei]] ist einfach eine Datei, deren Name mit einem Punkt beginnt:
`.bashrc`, `.gitconfig`, `.env`. Man nennt sie auch **Dotfiles**; `ls` zeigt sie nur mit `-a`. Dann
siehst du auch `.` (der Ordner selbst) und `..` (eine Ebene darüber).

`tree` zeichnet die Struktur als Baum, `tree -L 2` nur zwei Ebenen tief.

> [!FEHLER]
> **„Die Datei ist weg!“** – Oft ist sie nur versteckt. Findest du `.env` mit `ls` nicht, probiere `ls -a`.

## Woanders hingehen – cd

Mit `cd` (*change directory*) wechselst du den Ordner:

```bash title="Terminal"
cd projekte
pwd          # /home/ada/projekte
```

| Eingabe | Wohin? |
|---|---|
| `cd` oder `cd ~` | ins Home-Verzeichnis |
| `cd ..` | eine Ebene nach oben |
| `cd ../..` | zwei Ebenen nach oben |
| `cd -` | zurück in den vorherigen Ordner |
| `cd /` | ins Wurzelverzeichnis |

`cd -` ist wie die Zurück-Taste im Browser. Tippe Namen nie ganz ab: Erste Buchstaben, dann Tab – die
Shell ergänzt den Rest.

Enthält ein Name ein Leerzeichen, brauchst du [[anfuehrungszeichen|Anführungszeichen]]:
`cd "Meine Bilder"`. Sonst hält die Shell `Meine` und `Bilder` für zwei [[argument|Argumente]].

## Absolute und relative Pfade

Ein [[pfad]] ist eine Wegbeschreibung – entweder als volle Adresse oder als „zweimal links, dann
geradeaus“.

- Ein [[absoluter-pfad|absoluter Pfad]] beginnt bei der Wurzel `/` und gilt von überall:
  `/home/ada/bilder/urlaub.jpg`. Auch `~/bilder` zählt dazu, denn die Shell ersetzt `~` durch `/home/ada`.
- Ein [[relativer-pfad|relativer Pfad]] beginnt **nicht** mit `/` und geht vom aktuellen Ordner aus.
  Von `/home/ada/projekte` führt `../bilder/urlaub.jpg` zur selben Datei.

![Absoluter Pfad von der Wurzel und relativer Pfad vom aktuellen Ordner zur selben Datei](/assets/terminal-shell/dateisystem-pfade.svg)

Relative Pfade sind kurz und praktisch in der Nähe. Absolute Pfade sind eindeutig und gehören in
Skripte, Konfigurationen und Anleitungen.

> [!MERKSATZ]
> Beginnt ein Pfad mit `/` oder `~`, ist er absolut. Beginnt er mit einem Namen, `.` oder `..`, hängt
> er davon ab, wo du gerade stehst.

> [!FEHLER]
> **„No such file or directory“**, obwohl die Datei existiert? Meist stehst du im falschen Ordner.
> Erst `pwd`, dann `ls`. Und: `Bilder` und `bilder` sind unter Linux zwei verschiedene Ordner.

> [!PRAXIS]
> Im Projektalltag springst du ständig: `cd ~/projekte/shop`, `cd src`, kurz `cd -` zurück. Vor
> riskanten Befehlen prüfen Profis mit `pwd`, wo sie wirklich sind.

## Zusammenfassung

- Das Dateisystem ist ein Baum mit einer Wurzel `/`. macOS nutzt `/Users`, Windows `C:\` (WSL: `/mnt/c`, Git Bash: `/c`).
- Wichtige Ordner: `/home`, `/etc`, `/tmp`, `/usr/bin`, `/var/log`.
- `pwd` zeigt, wo du bist, `ls` (mit `-l -a -h -t -R -1`) was dort liegt, `tree` den Baum.
- `cd` wechselt: `cd`/`cd ~` nach Hause, `cd ..` hoch, `cd -` zurück, `cd /` zur Wurzel.
- Versteckte Dateien beginnen mit einem Punkt und erscheinen mit `ls -a`.
- Absolute Pfade beginnen mit `/` und gelten überall, relative gehen vom aktuellen Ordner aus.
