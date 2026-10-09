---
title: Was ist das Terminal?
summary: Terminal, Shell, Kommandozeile und GUI auseinanderhalten, die gängigen Shells kennen und die ersten drei Befehle tippen.
duration: 20
sources:
  - title: GNU Bash Reference Manual – What is a shell?
    url: https://www.gnu.org/software/bash/manual/html_node/What-is-a-shell_003f.html
  - title: Terminal-Benutzerhandbuch für Mac
    url: https://support.apple.com/de-de/guide/terminal/welcome/mac
  - title: zsh als Standard-Shell auf dem Mac verwenden
    url: https://support.apple.com/de-de/102360
  - title: Windows Terminal – Übersicht
    url: https://learn.microsoft.com/de-de/windows/terminal/
  - title: Installieren von Linux unter Windows mit WSL
    url: https://learn.microsoft.com/de-de/windows/wsl/install
  - title: Was ist PowerShell?
    url: https://learn.microsoft.com/de-de/powershell/scripting/overview
quiz:
  - type: single
    question: Welche Aussage beschreibt den Unterschied zwischen Terminal und Shell richtig?
    options:
      - Terminal und Shell sind zwei Namen für dasselbe Programm.
      - Das Terminal ist das Fenster für Ein- und Ausgabe, die Shell versteht und startet die Befehle.
      - Die Shell ist das Fenster, das Terminal führt die Befehle aus.
      - Das Terminal ist ein Teil des Betriebssystems-Kernels.
    answer: 1
    explanation: Das Terminal (genauer der Terminal-Emulator) zeigt Text an und nimmt Tastendrücke entgegen. Die Shell darin liest deine Zeile, versteht sie und lässt das Betriebssystem das passende Programm ausführen.
  - type: multiple
    question: Welche der folgenden Programme sind Shells?
    options: [bash, zsh, Windows Terminal, PowerShell, iTerm2]
    answers: [0, 1, 3]
    explanation: bash, zsh und PowerShell sind Shells. Windows Terminal und iTerm2 sind Terminal-Emulatoren – Fenster, in denen eine Shell läuft.
  - type: match
    question: Ordne jedem Prompt-Bestandteil seine Bedeutung zu (Prompt `ada@laptop:~$`).
    pairs:
      - { left: "ada", right: "Der angemeldete Benutzer" }
      - { left: "laptop", right: "Der Name des Computers (Host)" }
      - { left: "~", right: "Der Ordner, in dem du gerade bist (hier: dein Home-Ordner)" }
      - { left: "$", right: "Normaler Benutzer – bereit für deinen Befehl" }
    explanation: Der Prompt verrät dir auf einen Blick, wer du bist, wo du bist und ob die Shell bereit ist. Ein `#` am Ende würde bedeuten, dass du als Administrator (root) arbeitest.
  - type: cloze
    text: Seit macOS Catalina ist ___ die Standard-Shell auf dem Mac. Unter Windows bringt ___ ein echtes Linux mit bash mit.
    blanks:
      - [zsh]
      - [WSL, WSL2, WSL 2]
    explanation: Apple hat 2019 von bash auf zsh gewechselt. WSL (Windows-Subsystem für Linux) startet eine echte Linux-Distribution unter Windows.
  - type: single
    question: Warum arbeiten Entwickler:innen so viel im Terminal, obwohl es grafische Programme gibt?
    options:
      - Weil grafische Oberflächen verboten sind.
      - Weil Befehle sich wiederholen, automatisieren und auf Servern ohne Bildschirm nutzen lassen.
      - Weil das Terminal schneller rechnet als der Prozessor.
    answer: 1
    explanation: Ein Befehl ist Text – man kann ihn speichern, teilen, in Skripte schreiben und auf jedem Server ausführen. Die Rechenleistung ist dieselbe.
tasks:
  - id: schichten-beschriften
    type: diagram
    title: Wer macht was?
    description: |
      Wenn du `ls` tippst und Enter drückst, arbeiten mehrere Schichten zusammen. Ziehe die
      Beschriftungen in die drei leeren Kästen in der Mitte.
    image: /assets/terminal-shell/grundlagen-schichten-leer.svg
    slots:
      - { x: 30.6, y: 41, answer: Terminal-Emulator }
      - { x: 51, y: 41, answer: Shell }
      - { x: 71.4, y: 41, answer: Betriebssystem }
    distractors: [GUI, Browser]
    hints:
      - Das Fenster-Programm nimmt deine Tasten entgegen, der „Dolmetscher“ versteht sie.
      - Ganz rechts vor den Dateien sitzt der Teil, der wirklich auf Festplatte und Prozessor zugreift.
  - id: erste-befehle
    type: terminal
    title: Deine ersten drei Befehle
    description: |
      Im Ordner `erste-befehle` liegt nur eine Datei `LIESMICH.txt`. Du tippst deine ersten Befehle und lässt ihre Ausgabe
      mit dem Zeichen `>` in Dateien schreiben (das `>` ist eine kleine Vorschau – genauer lernst du es
      im Modul „Suchen, Filtern und Umleiten“).

      1. Probiere zuerst `echo Hallo Terminal`, `date` und `whoami` ohne `>` aus und lies die Ausgaben.
      2. Schreibe mit `echo` den Text `Hallo Terminal` in die Datei `hallo.txt`.
      3. Schreibe die Ausgabe von `date` in die Datei `datum.txt`.
      4. Schreibe die Ausgabe von `whoami` in die Datei `ich.txt`.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit der Ordner angelegt wird. Wechsle dann mit
      `cd erste-befehle` hinein.
    workdir: erste-befehle
    setup: |
      printf 'Hier entstehen deine ersten Dateien.\n' > LIESMICH.txt
    checks:
      - type: file_contains
        path: hallo.txt
        pattern: "Hallo Terminal"
        message: In hallo.txt fehlt noch der Text „Hallo Terminal“ (echo Hallo Terminal > hallo.txt).
      - type: file_contains
        path: datum.txt
        pattern: "20[0-9][0-9]"
        message: datum.txt enthält noch kein Datum mit Jahreszahl – leite die Ausgabe von date um.
      - type: command
        run: cat ich.txt
        stdout_equals: learner
        message: ich.txt soll genau die Ausgabe von whoami enthalten (whoami > ich.txt).
    hints:
      - "Ein `>` hinter einem Befehl schickt die Ausgabe in eine Datei statt auf den Bildschirm."
      - "Die Form ist immer gleich: `befehl > dateiname`."
      - "Für Schritt 2: `echo Hallo Terminal > hallo.txt`."
    solution: |
      ```bash
      cd erste-befehle
      echo Hallo Terminal > hallo.txt
      date > datum.txt
      whoami > ich.txt
      cat hallo.txt datum.txt ich.txt   # zur Kontrolle anzeigen
      ```
---

Stell dir vor, du müsstest 300 Fotos umbenennen, damit sie alle mit dem Datum beginnen. Mit der Maus
wären das 300 Rechtsklicks. Im Terminal ist das **eine Zeile**. Darum lohnt es sich, dieses schwarze
Fenster mit dem blinkenden Cursor kennenzulernen – es ist das wichtigste Werkzeug von Entwickler:innen.

## Klicken oder tippen: GUI und Kommandozeile

Die meisten Menschen bedienen ihren [[computer|Computer]] über eine [[gui|GUI]] (*Graphical User
Interface*, grafische Benutzeroberfläche): Fenster, Symbole, Knöpfe, Mausklicks.

Die [[kommandozeile|Kommandozeile]] ist die andere Art, mit dem Computer zu reden. Du tippst einen kurzen
Satz in einer festen Sprache und drückst Enter. Der Computer antwortet mit Text. Auf Englisch heißt das
*Command Line Interface*, kurz [[cli|CLI]]. Viele Programme haben nur eine CLI, etwa [[git|Git]], npm oder Docker.

Ein Vergleich: Die GUI ist eine Speisekarte mit Bildern, auf die du zeigst. Die Kommandozeile ist eine
Bestellung, die du aufschreibst. Zeigen ist leichter – aber ein Zettel funktioniert auch morgen noch.

Warum Entwickler:innen tippen:

- **Automatisieren:** Getippte Befehle lassen sich speichern und beliebig oft wiederholen (Shell-Skripte).
- **Server haben keinen Bildschirm:** Dort gibt es nur eine Textverbindung zur Shell.
- **Eindeutig:** Ein Befehl in einer Anleitung bleibt gleich, Knöpfe wandern mit jedem Update.
- **Die Werkzeuge leben dort:** Git, npm, Composer und Docker bedienst du über die Kommandozeile.

> [!PRAXIS]
> Viele Projekt-Anleitungen beginnen mit „Klone das Repository und führe `npm install` aus“. Wer das
> Terminal sicher bedient, ist am ersten Arbeitstag nach einer Stunde startklar.

## Terminal, Shell, Betriebssystem – wer macht was?

![Schichten vom Tippen bis zur Ausführung: Du, Terminal-Emulator, Shell, Betriebssystem, Dateien und Programme](/assets/terminal-shell/grundlagen-schichten.svg)

Drei Begriffe werden ständig verwechselt:

- Das [[terminal|Terminal]] ist das **Fenster**. Früher war es ein echtes Gerät aus Bildschirm und
  Tastatur. Heute ahmt ein [[programm|Programm]] es nach, deshalb heißt es genau
  [[terminal-emulator|Terminal-Emulator]]. Es nimmt Tasten an und zeigt Text an – sonst nichts.
- Die [[shell|Shell]] läuft **im** Terminal und ist der Dolmetscher. Sie liest deine Zeile, erkennt den
  Befehl und lässt das passende Programm starten.
- Das [[betriebssystem|Betriebssystem]] greift wirklich auf Festplatte, Speicher und Prozessor zu.

| Begriff | Alltagsbild | Beispiele |
|---|---|---|
| Terminal(-Emulator) | Telefonhörer | Terminal.app, iTerm2, Windows Terminal, GNOME Terminal |
| Shell | Dolmetscher am anderen Ende | bash, zsh, PowerShell |
| Betriebssystem | Hausverwaltung | [[linux|Linux]], macOS, Windows |

> [!MERKSATZ]
> Das Terminal ist das Fenster, die Shell ist der Dolmetscher darin. In einem Terminal kannst du
> verschiedene Shells starten.

## Die wichtigsten Shells – und wo du sie findest

| Shell | Wo? | Besonderheit |
|---|---|---|
| [[bash]] | fast jeder Linux-[[server|Server]], Übungs-Terminal (Bash 5.2) | der Klassiker, Thema dieses Kurses |
| [[zsh]] | Standard auf dem Mac seit macOS Catalina (2019) | verhält sich bei unseren Befehlen fast wie bash |
| [[powershell|PowerShell]] | Windows | gibt Objekte statt Text weiter, eigene Befehle wie `Get-ChildItem` |
| fish | optional | sehr einsteigerfreundlich, bei Skripten aber anders |

bash und zsh folgen weitgehend [[posix|POSIX]], einem gemeinsamen Regelwerk dafür, wie Shell und
Grundbefehle sich verhalten. Darum laufen viele Befehle auf Linux und macOS gleich.

So öffnest du ein Terminal:

- **macOS:** Spotlight (Cmd+Leertaste) → „Terminal“. Darin läuft zsh.
- **Linux:** meist Strg+Alt+T. Darin läuft fast immer bash.
- **Windows:** *Windows Terminal* startet PowerShell. Für diesen Kurs empfehlen sich [[wsl|WSL]]
  (*Windows Subsystem for Linux*, ein echtes Linux in Windows) oder [[git-bash|Git Bash]], eine kleine
  bash, die mit Git für Windows kommt. Details folgen im Modul „Editoren und Plattformen“.
- **Stacklab:** Das Übungs-Terminal ist ein echter Linux-Container mit bash, du bist dort `learner`.

## Der Prompt: Die Shell wartet auf dich

```text title="Ein typischer Prompt"
ada@laptop:~$
```

Diese Zeile ist der [[prompt|Prompt]], die Eingabeaufforderung. Die Shell sagt: „Ich bin bereit.“

| Teil | Bedeutung |
|---|---|
| `ada` | angemeldeter Benutzer |
| `laptop` | Name des Computers |
| `~` | aktueller Ordner, hier dein Home-Ordner |
| `$` | normaler Benutzer; `#` hieße *root*, also Administrator |

Auf dem Mac sieht der zsh-Prompt etwa so aus: `ada@MacBook ~ %`. Das `%` entspricht dort dem `$`.

> [!FEHLER]
> **Den Prompt mit abtippen.** In Anleitungen steht oft `$ whoami`. Das `$` zeigt nur, dass ein Befehl
> beginnt. Tippst du es mit, meldet die Shell einen Fehler. Kopiere nur den Teil **nach** dem Prompt.

## Deine ersten drei Befehle

Diese [[befehl|Befehle]] sind harmlos:

```bash title="Terminal"
echo Hallo Terminal
date
whoami
```

- `echo` gibt den Text dahinter aus – ein Echo.
- `date` zeigt Datum und Uhrzeit.
- `whoami` („who am I?“) nennt deinen Benutzer, im Übungs-Terminal `learner`.

Eine Vorschau für die Aufgabe: Mit `>` schickst du die Ausgabe in eine [[datei|Datei]] statt auf den
Bildschirm. `cat` zeigt den Inhalt einer Datei an. Genauer lernst du das im Modul über Umleitungen.

```bash title="Terminal"
whoami > ich.txt
cat ich.txt
```

> [!TIPP]
> Tippst du `wohami`, antwortet bash mit `wohami: command not found`. Das ist kein Absturz, nur:
> „Diesen Befehl kenne ich nicht.“ Korrigieren, Enter, weiter.

## Zusammenfassung

- Eine **GUI** bedienst du mit Maus und Knöpfen, die **Kommandozeile (CLI)** mit getippten Befehlen.
- Das **Terminal** ist das Fenster, die **Shell** versteht deine Befehle, das **Betriebssystem** führt sie aus.
- Wichtige Shells: **bash** (Linux, Übungs-Terminal), **zsh** (Mac), **PowerShell** (Windows, Objekte); bash und zsh folgen **POSIX**.
- Unter Windows bekommst du bash über **WSL** oder **Git Bash**.
- Der **Prompt** zeigt Benutzer, Rechner und Ordner; `$` heißt normaler Benutzer, `#` root.
- `echo`, `date` und `whoami` sind deine ersten Befehle; mit `>` landet die Ausgabe in einer Datei.
