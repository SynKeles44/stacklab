---
title: Dateirechte, Benutzer und sudo
summary: Du liest die Rechte-Spalte von `ls -l`, setzt Rechte mit chmod symbolisch und als Zahl und verstehst, wann sudo nötig ist – und wann nicht.
duration: 25
sources:
  - title: GNU Coreutils – File permissions
    url: https://www.gnu.org/software/coreutils/manual/html_node/File-permissions.html
  - title: chmod(1) – Linux manual page
    url: https://man7.org/linux/man-pages/man1/chmod.1.html
  - title: chown(1) – Linux manual page
    url: https://man7.org/linux/man-pages/man1/chown.1.html
  - title: sudo – offizielle Dokumentation
    url: https://www.sudo.ws/docs/man/sudo.man/
  - title: umask(2) – Linux manual page
    url: https://man7.org/linux/man-pages/man2/umask.2.html
quiz:
  - type: single
    question: "`ls -l` zeigt für einen Ordner `drwxr-x---  ada  team  …  berichte`. Was darf Bob, der **nicht** in der Gruppe `team` ist?"
    options:
      - Den Inhalt auflisten, aber nichts ändern
      - In den Ordner wechseln, aber nichts auflisten
      - Gar nichts – weder auflisten noch hineinwechseln
      - Alles, weil er Dateien darin sehen kann
    answer: 2
    explanation: Die letzten drei Zeichen `---` gelten für „alle anderen“. Bob hat also weder r (auflisten) noch x (hineinwechseln) – der Ordner ist für ihn komplett verschlossen.
  - type: match
    question: Ordne jeder Oktalzahl die passende Rechte-Spalte zu.
    pairs:
      - { left: "755", right: "rwxr-xr-x" }
      - { left: "644", right: "rw-r--r--" }
      - { left: "600", right: "rw-------" }
      - { left: "700", right: "rwx------" }
    explanation: "Jede Ziffer ist die Summe aus r=4, w=2 und x=1 – für Besitzer, Gruppe und andere. 7 = 4+2+1 (rwx), 6 = 4+2 (rw-), 5 = 4+1 (r-x), 4 = nur r, 0 = nichts."
  - type: cloze
    text: Mit `chmod ___ deploy.sh` gibst du nur dem Besitzer zusätzlich das Ausführungsrecht. Der Benutzer mit allen Rechten auf einem Linux-System heißt ___.
    blanks:
      - ["u+x"]
      - [root]
    explanation: "`u` steht für den Besitzer (user), `+x` fügt das Ausführungsrecht hinzu. root ist der Superuser mit der Benutzernummer 0."
  - type: find-bug
    question: Ada will ihr neues Skript starten, bekommt aber „Permission denied“. In welcher Zeile liegt der Fehler?
    language: bash
    code: |
      echo 'echo "Hallo!"' > hallo.sh
      chmod u-x hallo.sh
      ls -l hallo.sh
      ./hallo.sh
    bug_line: 2
    explanation: "`u-x` **entfernt** das Ausführungsrecht für den Besitzer. Gemeint war `chmod u+x hallo.sh` – mit Plus statt Minus."
  - type: multiple
    question: Welche Aussagen über `sudo` stimmen?
    options:
      - sudo führt einen einzelnen Befehl mit root-Rechten aus.
      - sudo fragt nach dem Passwort des root-Benutzers.
      - Wer „Permission denied“ sieht, sollte zuerst verstehen, warum – nicht reflexartig sudo davorsetzen.
      - Dateien, die du mit sudo anlegst, gehören danach root.
    answers: [0, 2, 3]
    explanation: sudo fragt in der Regel nach **deinem eigenen** Passwort und prüft, ob du sudo benutzen darfst. Was du mit sudo erzeugst, gehört root – ein häufiger Grund für spätere Rechteprobleme.
tasks:
  - id: rechte-beschriften
    type: diagram
    title: Beschrifte die Rechte-Spalte
    description: |
      Die Abbildung zeigt die Rechte-Spalte `-rwxr-xr--` aus `ls -l`. Ordne unten jedem Block zu,
      wofür er steht, und trage oben die passende Oktalziffer für jede Dreiergruppe ein.
    image: /assets/terminal-shell/system-rechte-leer.svg
    slots:
      - { x: 15, y: 71, answer: Dateityp }
      - { x: 33.25, y: 71, answer: Besitzer (u) }
      - { x: 58.25, y: 71, answer: Gruppe (g) }
      - { x: 83.25, y: 71, answer: Andere (o) }
      - { x: 33.25, y: 24, answer: "7" }
      - { x: 58.25, y: 24, answer: "5" }
      - { x: 83.25, y: 24, answer: "4" }
    distractors: [Größe, root, "6"]
    hints:
      - Die Spalte beginnt mit einem einzelnen Zeichen, danach folgen drei Gruppen à drei Zeichen.
      - "r=4, w=2, x=1 – addiere pro Gruppe. `r-x` ergibt 4+0+1."
  - id: rechte-setzen
    type: terminal
    title: Rechte für ein kleines Projekt setzen
    description: |
      Im Ordner `rechte-setzen` liegen drei Dateien, die alle die Rechte `rw-r--r--` (644) haben:

      - `deploy.sh` – ein Skript, das gestartet werden soll
      - `zugang.env` – enthält ein (Platzhalter-)Passwort
      - `regeln.txt` – soll niemand mehr versehentlich ändern

      1. Sieh dir die Rechte mit `ls -l` an.
      2. Gib `deploy.sh` die Rechte `rwxr-xr-x` (755).
      3. Gib `zugang.env` die Rechte `rw-------` (600) – nur du darfst lesen und schreiben.
      4. Gib `regeln.txt` die Rechte `r--r--r--` (444) – für alle nur noch lesbar.
      5. Starte das Skript mit `./deploy.sh` und leite seine Ausgabe in die Datei `ausgabe.txt` um
         (`./deploy.sh > ausgabe.txt`).

      Klicke zuerst auf **Aufgabe vorbereiten**, damit die Dateien angelegt werden.
    workdir: rechte-setzen
    setup: |
      printf '#!/usr/bin/env bash\necho "Deploy gestartet"\n' > deploy.sh
      printf 'DB_PASSWORT=<dein-passwort>\n' > zugang.env
      printf 'Bitte nicht aendern\n' > regeln.txt
      chmod 644 deploy.sh zugang.env regeln.txt
    checks:
      - type: command
        run: stat -c %a deploy.sh
        stdout_matches: "^755$"
        message: deploy.sh hat noch nicht die Rechte 755 (rwxr-xr-x). Versuche `chmod 755 deploy.sh`.
      - type: command
        run: stat -c %a zugang.env
        stdout_matches: "^600$"
        message: zugang.env sollte nur für dich lesbar und schreibbar sein (600).
      - type: command
        run: stat -c %a regeln.txt
        stdout_matches: "^444$"
        message: regeln.txt sollte für alle nur lesbar sein (444 bzw. r--r--r--).
      - type: file_contains
        path: ausgabe.txt
        pattern: "Deploy gestartet"
        message: In ausgabe.txt fehlt die Ausgabe des Skripts. Starte es mit `./deploy.sh > ausgabe.txt`.
    hints:
      - Mit `chmod` und einer dreistelligen Zahl setzt du alle Rechte einer Datei auf einmal.
      - "r=4, w=2, x=1: 755 = rwx r-x r-x, 600 = rw- --- ---, 444 = r-- r-- r--."
      - "`chmod 755 deploy.sh`, `chmod 600 zugang.env`, `chmod 444 regeln.txt` – danach `./deploy.sh > ausgabe.txt`."
    solution: |
      ```bash
      cd rechte-setzen
      ls -l
      chmod 755 deploy.sh
      chmod 600 zugang.env
      chmod a-w regeln.txt      # oder: chmod 444 regeln.txt
      ls -l
      ./deploy.sh > ausgabe.txt
      cat ausgabe.txt
      ```
  - id: sudo-chown
    type: simulated
    title: Besitzer auf einem Server ändern
    description: |
      Du bist per SSH als Benutzer `deploy` auf einem (simulierten) Server angemeldet. Die Logdatei
      `upload.log` gehört versehentlich `root`, deine Anwendung kann deshalb nicht hineinschreiben.

      1. Sieh dir die Datei mit `ls -l upload.log` an.
      2. Versuche, sie mit `chown deploy upload.log` dir zu übertragen – und lies die Fehlermeldung.
      3. Wiederhole den Befehl mit `sudo` davor.
      4. Kontrolliere das Ergebnis mit `ls -l upload.log`.
    prompt: "deploy@server:/var/www/app$"
    steps:
      - expect: "^ls\\s+-l\\s+upload\\.log$"
        output: |
          -rw-r--r-- 1 root root 2048 Oct  9 10:12 upload.log
        hint: Tippe `ls -l upload.log`.
      - expect: "^chown\\s+deploy(:deploy)?\\s+upload\\.log$"
        output: |
          chown: changing ownership of 'upload.log': Operation not permitted
        hint: Tippe `chown deploy upload.log` – ohne sudo, damit du die Fehlermeldung siehst.
      - expect: "^sudo\\s+chown\\s+deploy(:deploy)?\\s+upload\\.log$"
        output: |
          [sudo] password for deploy:
        hint: Setze `sudo` vor denselben Befehl.
      - expect: "^ls\\s+-l\\s+upload\\.log$"
        output: |
          -rw-r--r-- 1 deploy root 2048 Oct  9 10:12 upload.log
        hint: Prüfe mit `ls -l upload.log`, wem die Datei jetzt gehört.
    responses:
      - match: "^whoami$"
        output: deploy
      - match: "^sudo\\s+!!$"
        output: "Fast: `sudo !!` wiederholt den letzten Befehl mit sudo – tippe hier zur Übung den ganzen Befehl aus."
    hints:
      - Nur root darf den Besitzer einer Datei ändern.
    solution: |
      ```bash
      ls -l upload.log
      chown deploy upload.log        # Operation not permitted
      sudo chown deploy upload.log
      ls -l upload.log
      ```
---

Stell dir ein Bürogebäude vor. Jede Tür hat ein Schloss, und auf jedem Schlüsselbund hängen andere
Schlüssel: Die Chefin kommt überall hinein, das Team in die Teamräume, Besucher nur in die Lobby.
Ein Linux- oder macOS-System funktioniert genauso. Jede [[datei|Datei]] und jeder [[ordner|Ordner]]
hat ein Schloss – und dieses Schloss nennt man [[dateirechte|Dateirechte]].

Früher oder später siehst du im [[terminal|Terminal]] die Meldung `Permission denied`. Hier lernst
du, was sie bedeutet und wie du sie gezielt behebst.

## Benutzer, Gruppen und root

Ein Linux-System kennt viele [[benutzer|Benutzer]] – nicht nur Menschen. Auch ein Webserver oder
eine Datenbank läuft oft unter einem eigenen Benutzer. Jeder Benutzer hat einen Namen und eine
Nummer, die User-ID. `whoami` zeigt, wer du bist, `id` zusätzlich deine Gruppen:

```bash title="Terminal"
whoami
id
```

```text
learner
uid=1000(learner) gid=1000(learner) groups=1000(learner)
```

Eine [[benutzergruppe|Benutzergruppe]] fasst mehrere Benutzer zusammen. Statt jedem Teammitglied
einzeln Zugriff zu geben, bekommt die Gruppe `team` ihn – wer in der Gruppe ist, darf hinein.

Besonders ist [[root]], der Superuser mit der User-ID 0. Für ihn gelten keine Schlösser: Er darf
jede Datei ändern und löschen, auch Systemdateien. Deshalb arbeitet man im Alltag **nicht** als root.
Am [[prompt|Prompt]] erkennst du ihn oft am `#` statt `$`.

> [!HINWEIS]
> Im Übungs-Terminal bist du der Benutzer `learner` und hast **keine** root-Rechte. Befehle mit
> `sudo` gibt es dort nicht. Für diese Fälle nutzt du in dieser Lektion ein simuliertes Terminal.

## Die Rechte-Spalte von ls -l lesen

Mit `ls -l` siehst du die Rechte jeder Datei. Eine typische Zeile sieht so aus:

```text
-rwxr-xr-- 1 ada team 1520 Oct  9 10:12 backup.sh
```

Von links nach rechts bedeutet das:

| Teil | Beispiel | Bedeutung |
|---|---|---|
| Typ und Rechte | `-rwxr-xr--` | Dateityp plus drei Dreiergruppen mit Rechten |
| Anzahl Links | `1` | Wie viele Namen auf diese Datei zeigen (meist 1) |
| Besitzer | `ada` | Der Benutzer, dem die Datei gehört |
| Gruppe | `team` | Die Gruppe, der die Datei zugeordnet ist |
| Größe | `1520` | Größe in Bytes (mit `-h` lesbarer, z. B. `1.5K`) |
| Datum | `Oct  9 10:12` | Zeitpunkt der letzten Änderung |
| Name | `backup.sh` | Der Dateiname |

Das Spannende steckt in den ersten zehn Zeichen:

![Die Rechte-Spalte -rwxr-xr-- aufgeteilt in Dateityp, Besitzer, Gruppe und Andere](/assets/terminal-shell/system-rechte.svg)

Das **erste Zeichen** ist der Typ: `-` Datei, `d` Ordner (*directory*), `l` Link. Danach folgen
drei Gruppen mit je drei Zeichen:

1. **u** wie *user* – die Rechte des Besitzers,
2. **g** wie *group* – die Rechte der Gruppe,
3. **o** wie *others* – die Rechte aller anderen.

Jede Gruppe enthält an fester Stelle `r` (lesen), `w` (schreiben) und `x` (ausführen); ein `-`
heißt: Recht fehlt. `-rwxr-xr--` bedeutet also: Ada darf alles, das Team lesen und ausführen, alle
anderen nur lesen. Es gilt immer nur **eine** Gruppe: Besitzer vor Gruppe vor andere.

## r, w und x bei Dateien und Ordnern

Die drei Buchstaben bedeuten bei Dateien und Ordnern etwas leicht anderes. Das ist eine der
häufigsten Stolperfallen:

| Recht | Bei einer Datei | Bei einem Ordner |
|---|---|---|
| `r` | Inhalt lesen (`cat`, `less`) | Inhalt auflisten (`ls`) |
| `w` | Inhalt ändern | Dateien darin anlegen, umbenennen, löschen |
| `x` | Als Programm starten | Hineinwechseln (`cd`) und auf Dateien darin zugreifen |

Zwei Folgen solltest du kennen. Erstens: Ob du eine Datei **löschen** darfst, entscheidet das
w-Recht des **Ordners**, nicht das der Datei. Zweitens: Ein Ordner ohne x ist wie ein Raum mit
Fenster, aber ohne Tür – mit r siehst du die Namen, kommst aber an nichts heran.

Das x-Recht einer Datei macht sie zu einer [[ausfuehrbare-datei|ausführbaren Datei]]. Ein
[[skript|Skript]] ohne x kannst du nicht direkt mit `./skript.sh` starten. Das `./` heißt dabei
„die Datei im aktuellen Ordner“ – warum das nötig ist, lernst du in der nächsten Lektion beim PATH.

## Rechte ändern mit chmod

Mit [[chmod]] (*change mode*) änderst du Rechte. Es gibt zwei Schreibweisen.

**Symbolisch:** Du sagst, *für wen* (`u`, `g`, `o` oder `a` für alle), *was* passiert (`+`
hinzufügen, `-` entfernen, `=` genau so setzen) und *welches* Recht (`r`, `w`, `x`):

```bash title="Terminal"
chmod u+x deploy.sh      # Besitzer darf ausführen
chmod go-w bericht.txt   # Gruppe und andere dürfen nicht mehr schreiben
chmod a=r regeln.txt     # alle dürfen nur lesen, sonst nichts
chmod u+x,g+x tool.sh    # mehrere Änderungen mit Komma
```

**Als Zahl:** Die [[oktalschreibweise|Oktalschreibweise]] setzt alle Rechte auf einmal. Jedes Recht
hat einen Wert: r = 4, w = 2, x = 1. Pro Gruppe addierst du die Werte. Drei Ziffern stehen dann für
Besitzer, Gruppe und andere:

| Zahl | Rechte | Typischer Einsatz |
|---|---|---|
| `755` | `rwxr-xr-x` | Skripte und Programme, Ordner |
| `644` | `rw-r--r--` | Normale Dateien wie Texte oder Code |
| `600` | `rw-------` | Geheimes: Passwortdateien, SSH-Schlüssel |
| `700` | `rwx------` | Private Ordner und Skripte |
| `444` | `r--r--r--` | Dateien, die niemand ändern soll |

```bash title="Terminal"
chmod 755 deploy.sh
chmod 600 zugang.env
ls -l
```

> [!MERKSATZ]
> r = 4, w = 2, x = 1. Pro Gruppe addieren, drei Ziffern für Besitzer, Gruppe und andere:
> 755 für Programme und Ordner, 644 für normale Dateien, 600 für Geheimes.

> [!FEHLER]
> **`chmod 777` als Allheilmittel.** Die Fehlermeldung verschwindet – aber jetzt darf **jeder**
> die Datei ändern. Gib lieber genau das Recht, das fehlt.

Dass neue Dateien `644` bekommen, regelt die [[umask]]: Sie nimmt beim Anlegen Rechte weg.
`umask` zeigt meist `0022` – Gruppe und andere bekommen kein Schreibrecht.

## Besitzer ändern und sudo

Den Besitzer einer Datei änderst du mit [[chown]] (*change owner*), die Gruppe mit `chgrp`:

```bash
chown deploy upload.log         # Besitzer wird deploy
chown deploy:www upload.log     # Besitzer deploy, Gruppe www
chgrp team bericht.txt          # nur die Gruppe ändern
```

Den Besitzer darf nur root ändern. Hier hilft [[sudo]] (*superuser do*): Es führt **einen**
Befehl mit root-Rechten aus und fragt nach **deinem** Passwort, nicht nach dem von root.

```bash
sudo chown deploy upload.log
sudo !!       # wiederholt den letzten Befehl, diesmal mit sudo
```

> [!ACHTUNG]
> sudo ist kein Zauberwort gegen Fehlermeldungen. Ein falscher Befehl mit sudo kann das System
> beschädigen, und Dateien, die du mit sudo anlegst, gehören danach root – das nächste
> „Permission denied“ ist vorprogrammiert.

> [!PRAXIS]
> Auf Servern läuft eine Anwendung meist unter einem eigenen Benutzer wie `www-data` oder `deploy`.
> Ein Klassiker nach dem Deployment: Der Log-Ordner gehört root, weil jemand sudo benutzt hat.
> Die Lösung ist ein gezieltes `sudo chown -R deploy:deploy storage/`.

## Zusammenfassung

- Jede Datei hat einen Besitzer, eine Gruppe und Rechte für Besitzer (u), Gruppe (g) und andere (o).
- `ls -l` zeigt die Rechte als zehn Zeichen: Typ (`-`, `d`, `l`) und dreimal `rwx`.
- Bei Ordnern heißt r „auflisten“, w „Dateien anlegen und löschen“ und x „hineinwechseln“.
- `chmod u+x datei` ändert ein Recht gezielt, `chmod 755 datei` setzt alle auf einmal (r=4, w=2, x=1).
- `chown` und `chgrp` ändern Besitzer und Gruppe – das darf nur root.
- `sudo` führt einen Befehl mit root-Rechten aus. Nutze es bewusst, nie reflexartig – und nie `chmod 777`.
