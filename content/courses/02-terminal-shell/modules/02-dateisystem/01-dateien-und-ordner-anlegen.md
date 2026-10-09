---
title: Dateien und Ordner anlegen, kopieren und verschieben
summary: Mit touch, mkdir, cp und mv baust du Ordnerstrukturen auf, kopierst und benennst Dateien um – und weißt, wann das Terminal ungefragt überschreibt.
duration: 20
sources:
  - title: GNU Coreutils – touch invocation
    url: https://www.gnu.org/software/coreutils/manual/html_node/touch-invocation.html
  - title: GNU Coreutils – mkdir invocation
    url: https://www.gnu.org/software/coreutils/manual/html_node/mkdir-invocation.html
  - title: GNU Coreutils – cp invocation
    url: https://www.gnu.org/software/coreutils/manual/html_node/cp-invocation.html
  - title: GNU Coreutils – mv invocation
    url: https://www.gnu.org/software/coreutils/manual/html_node/mv-invocation.html
quiz:
  - type: single
    question: Der Ordner `projekt` existiert noch nicht. Was passiert bei `mkdir projekt/src/components`?
    options:
      - Alle drei Ordner werden angelegt
      - Es gibt einen Fehler, weil projekt und src fehlen
      - Nur components wird im aktuellen Ordner angelegt
    answer: 1
    explanation: "Ohne -p legt mkdir nur den letzten Ordner an und erwartet, dass alle darüberliegenden schon existieren. `mkdir -p projekt/src/components` legt alle fehlenden Ebenen an."
  - type: match
    question: Ordne jedem Befehl seine Wirkung zu.
    pairs:
      - { left: "touch log.txt", right: "Legt eine leere Datei an oder aktualisiert ihren Zeitstempel" }
      - { left: "cp a.txt b.txt", right: "Erstellt eine Kopie, a.txt bleibt erhalten" }
      - { left: "mv a.txt b.txt", right: "Benennt a.txt in b.txt um" }
      - { left: "cp -r src backup", right: "Kopiert einen Ordner mit allem Inhalt" }
    explanation: touch legt an oder frischt den Zeitstempel auf, cp kopiert, mv verschiebt oder benennt um, und Ordner brauchen beim Kopieren -r.
  - type: multiple
    question: "In `ziel/` liegt bereits eine Datei `bericht.txt`. Welche Befehle überschreiben sie **nicht** ungefragt?"
    options:
      - "cp bericht.txt ziel/"
      - "cp -i bericht.txt ziel/"
      - "cp -n bericht.txt ziel/"
      - "mv bericht.txt ziel/"
    answers: [1, 2]
    explanation: "Ohne Option überschreiben cp und mv still und ohne Nachfrage. -i fragt nach, -n überschreibt grundsätzlich nicht."
  - type: find-bug
    question: Ada will den Ordner `fotos` sichern. In welcher Zeile steckt der Fehler?
    language: bash
    code: |
      ls fotos
      mkdir -p sicherung
      cp fotos sicherung/
      ls sicherung
    bug_line: 3
    explanation: "cp kopiert ohne -r keine Ordner und meldet „omitting directory“. Richtig ist `cp -r fotos sicherung/`."
  - type: cloze
    text: Um eine Datei umzubenennen, nutzt du `___`. Damit `mkdir` auch fehlende Elternordner anlegt, brauchst du die Option `___`.
    blanks:
      - [mv]
      - [-p, --parents]
    explanation: Ein eigenes „rename“-Kommando gibt es nicht – Umbenennen ist Verschieben an einen neuen Namen. -p steht für parents.
tasks:
  - id: website-geruest
    type: terminal
    title: Baue das Gerüst einer Website
    description: |
      Im Ordner `anlegen-website` liegen drei Dateien: eine HTML-Vorlage `vorlage.html`, ein Logo mit
      dem unpraktischen Namen `Logo Final.png` (mit Leerzeichen!) und eine `notiz.txt`.
      Baue daraus diese Struktur:

      ```text
      website/
      ├── index.html          (Kopie von vorlage.html)
      └── assets/
          ├── bilder/
          │   └── logo-final.png
          └── css/
              └── style.css   (leer)
      ```

      1. Lege die Ordner `website/assets/css` und `website/assets/bilder` an.
      2. Kopiere `vorlage.html` nach `website/index.html`. Die Vorlage selbst bleibt liegen.
      3. Verschiebe `Logo Final.png` nach `website/assets/bilder/` und gib ihm dabei den Namen `logo-final.png`.
      4. Lege die leere Datei `website/assets/css/style.css` an.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit die drei Dateien angelegt werden.
    workdir: anlegen-website
    setup: |
      printf '<!doctype html>\n<h1>Willkommen</h1>\n' > vorlage.html
      printf 'PNG-Platzhalter\n' > "Logo Final.png"
      printf 'Ideen fuer die Seite\n' > notiz.txt
    checks:
      - type: dir_exists
        path: website/assets/css
        message: Der Ordner website/assets/css fehlt noch. mkdir -p legt auch die Zwischenebenen an.
      - type: dir_exists
        path: website/assets/bilder
        message: Der Ordner website/assets/bilder fehlt noch.
      - type: file_contains
        path: website/index.html
        pattern: "Willkommen"
        message: website/index.html fehlt oder ist keine Kopie der Vorlage. Nutze cp vorlage.html website/index.html.
      - type: file_exists
        path: vorlage.html
        message: vorlage.html ist verschwunden. Sie sollte kopiert, nicht verschoben werden.
      - type: file_exists
        path: website/assets/bilder/logo-final.png
        message: website/assets/bilder/logo-final.png fehlt. Verschiebe und benenne das Logo mit einem einzigen mv-Befehl um.
      - type: file_absent
        path: Logo Final.png
        message: "„Logo Final.png“ liegt noch im Aufgabenordner. Es soll verschoben, nicht kopiert werden."
      - type: file_exists
        path: website/assets/css/style.css
        message: Die leere Datei website/assets/css/style.css fehlt noch. touch legt sie an.
    hints:
      - "`mkdir -p` kann mehrere Pfade auf einmal anlegen: `mkdir -p website/assets/css website/assets/bilder`."
      - "Bei mv ist das Ziel gleichzeitig der neue Name. Setze den alten Namen in Anführungszeichen: `mv \"Logo Final.png\" …`."
      - "Komplett: `mv \"Logo Final.png\" website/assets/bilder/logo-final.png` und `touch website/assets/css/style.css`."
    solution: |
      ```bash
      cd anlegen-website
      mkdir -p website/assets/css website/assets/bilder
      cp vorlage.html website/index.html
      mv "Logo Final.png" website/assets/bilder/logo-final.png
      touch website/assets/css/style.css
      tree website
      ```
  - id: fotos-sichern
    type: terminal
    title: Fotos sichern und einen Entwurf umbenennen
    description: |
      Im Ordner `kopieren-backup` gibt es einen Ordner `fotos` mit zwei Unterordnern (`2025` und `2026`)
      und eine Datei `entwurf.txt`.

      1. Erstelle eine vollständige Kopie von `fotos` mit dem Namen `fotos-backup` – inklusive aller
         Unterordner. Der Ordner `fotos` bleibt unverändert.
      2. Benenne `entwurf.txt` in `final.txt` um.
      3. Kopiere `final.txt` in den Ordner `fotos-backup`.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit die Fotos angelegt werden.
    workdir: kopieren-backup
    setup: |
      mkdir -p fotos/2025 fotos/2026
      printf 'Bild\n' > fotos/2025/strand.jpg
      printf 'Bild\n' > fotos/2025/berge.jpg
      printf 'Bild\n' > fotos/2026/stadt.jpg
      printf 'Fotoalbum, Version 1\n' > entwurf.txt
    checks:
      - type: command
        run: test -f fotos-backup/2025/strand.jpg && test -f fotos-backup/2025/berge.jpg && test -f fotos-backup/2026/stadt.jpg
        message: fotos-backup fehlt oder ist unvollständig. Ordner kopierst du mit cp -r.
      - type: command
        run: test ! -e fotos-backup/fotos
        message: In fotos-backup steckt ein weiterer Ordner fotos – das passiert, wenn das Ziel beim Kopieren schon existierte. Lösche fotos-backup (rm -r, nächste Lektion) oder verschiebe die Inhalte und kopiere erneut.
      - type: command
        run: test -f fotos/2025/strand.jpg && test -f fotos/2026/stadt.jpg
        message: Der Originalordner fotos ist nicht mehr vollständig. Er soll kopiert, nicht verschoben werden.
      - type: file_absent
        path: entwurf.txt
        message: entwurf.txt gibt es noch. Benenne die Datei mit mv um.
      - type: file_exists
        path: final.txt
        message: final.txt fehlt noch im Aufgabenordner.
      - type: file_contains
        path: fotos-backup/final.txt
        pattern: "Version 1"
        message: In fotos-backup liegt noch keine Kopie von final.txt.
    hints:
      - "Ohne `-r` weigert sich `cp`, Ordner zu kopieren."
      - "Umbenennen heißt im Terminal verschieben: `mv alter-name neuer-name`."
      - "`cp -r fotos fotos-backup`, dann `mv entwurf.txt final.txt`, dann `cp final.txt fotos-backup/`."
    solution: |
      ```bash
      cd kopieren-backup
      cp -r fotos fotos-backup
      mv entwurf.txt final.txt
      cp final.txt fotos-backup/
      tree
      ```
  - id: gute-namen
    type: dragdrop
    title: Gute und problematische Dateinamen
    description: Welche Namen kannst du im Terminal bequem und sicher verwenden, welche machen Ärger? Ordne zu.
    targets:
      - { id: gut, label: Terminal-freundlich }
      - { id: schlecht, label: Problematisch }
    items:
      - { label: "projekt-notizen.md", target: gut }
      - { label: "rechnung_2026-10.pdf", target: gut }
      - { label: "index.html", target: gut }
      - { label: "Mein Projekt FINAL (2).docx", target: schlecht }
      - { label: "über uns.html", target: schlecht }
      - { label: "-wichtig.txt", target: schlecht }
    hints:
      - Achte auf Leerzeichen, Klammern, Umlaute und auf das erste Zeichen.
---

Im grafischen Dateimanager klickst du mit rechts auf „Neuer Ordner“, ziehst Dateien mit der Maus
herum und benennst sie mit einem Doppelklick um. Im Terminal erledigst du dasselbe mit vier kurzen
Befehlen: `touch`, `mkdir`, `cp` und `mv`. Das wirkt am Anfang umständlicher – bis du zum ersten Mal
zwanzig Ordner mit einem einzigen Befehl anlegst.

## Anlegen – touch und mkdir

`touch` setzt eigentlich nur den [[zeitstempel|Zeitstempel]] einer Datei auf „jetzt“. Ein Zeitstempel
ist die gespeicherte Information, **wann** eine Datei zuletzt geändert wurde – du siehst ihn in
`ls -l`. Existiert die Datei noch nicht, legt `touch` sie leer an. Vorhandener Inhalt bleibt unangetastet.

```bash title="Terminal"
touch notizen.txt
touch index.html style.css app.js
```

`mkdir` (*make directory*) legt Ordner an. Bei verschachtelten Pfaden scheitert es, wenn Ebenen fehlen:

```text
$ mkdir projekt/src/components
mkdir: cannot create directory 'projekt/src/components': No such file or directory
```

Die [[option|Option]] `-p` (*parents*) legt alle fehlenden Ebenen mit an und bleibt still, wenn der
Ordner schon existiert:

```bash title="Terminal"
mkdir -p projekt/src/components
```

> [!MERKSATZ]
> `mkdir -p` legt einen ganzen Pfad an und meldet keinen Fehler, wenn er schon da ist. Deshalb steht
> es in fast jedem Skript, das Ordner vorbereitet.

## Kopieren – cp

`cp` (*copy*) braucht mindestens zwei Argumente: **was** du kopierst und **wohin**. Die Quelle
bleibt dabei unverändert.

```bash title="Terminal"
cp brief.txt brief-kopie.txt     # Kopie unter neuem Namen
cp brief.txt archiv/              # Kopie in einen Ordner, gleicher Name
cp a.txt b.txt c.txt archiv/      # mehrere Dateien in einen Ordner
```

Ist das letzte Argument ein vorhandener Ordner, landet die Kopie darin. Sonst ist das letzte
Argument der neue Dateiname.

### Ordner kopieren mit -r

Einen Ordner kopiert `cp` nur, wenn du ausdrücklich `-r` angibst. Das steht für
[[rekursiv]]: Der Befehl arbeitet sich durch den Ordner, dann durch jeden Unterordner, dann durch
dessen Unterordner – so lange, bis alles erledigt ist. Wie eine russische Matroschka-Puppe, die du
Schicht für Schicht öffnest.

```bash title="Terminal"
cp -r fotos fotos-backup
```

Dabei gibt es eine Falle, die selbst Erfahrene erwischt:

| Situation | Ergebnis von `cp -r fotos fotos-backup` |
|---|---|
| `fotos-backup` existiert **noch nicht** | `fotos-backup` wird als Kopie von `fotos` angelegt |
| `fotos-backup` existiert **schon** | Die Kopie landet **darin**: `fotos-backup/fotos` |

Prüfe deshalb vorher mit `ls`, ob das Ziel schon da ist.

## Verschieben und umbenennen – mv

`mv` (*move*) funktioniert wie `cp`, nur dass die Quelle danach verschwunden ist. Und weil
Verschieben an einen neuen Namen nichts anderes als Umbenennen ist, gibt es dafür keinen eigenen
Befehl:

```bash title="Terminal"
mv entwurf.txt final.txt          # umbenennen
mv final.txt archiv/              # in einen Ordner verschieben
mv final.txt archiv/2026-final.txt  # verschieben und umbenennen
mv alter-ordner neuer-ordner      # Ordner umbenennen – ohne -r!
```

Anders als `cp` braucht `mv` für Ordner kein `-r`. Innerhalb desselben Laufwerks ändert `mv` nämlich
nur den Eintrag im Dateisystem – die Daten selbst bleiben, wo sie sind. Deshalb ist das Verschieben
eines riesigen Ordners blitzschnell, das Kopieren dagegen nicht.

## Vorsicht: Überschreiben ohne Nachfrage

Jetzt kommt der wichtigste Absatz dieser Lektion. Der Dateimanager fragt dich: „Eine Datei mit
diesem Namen existiert bereits. Ersetzen?“ Das Terminal fragt **nicht**. Wenn das Ziel schon
existiert, überschreiben `cp` und `mv` es kommentarlos. Der alte Inhalt ist weg – es gibt keinen
Papierkorb.

```bash title="Ein stiller Unfall"
cp leere-vorlage.txt bericht.txt   # bericht.txt war dein fertiger Bericht …
```

Dagegen helfen drei Optionen:

| Option | Wirkung |
|---|---|
| `-i` | *interactive*: fragt vor jedem Überschreiben nach (`y` für ja) |
| `-n` | *no-clobber*: überschreibt nie, vorhandene Dateien bleiben unangetastet |
| `-v` | *verbose*: zeigt an, was kopiert oder verschoben wurde |

```bash title="Terminal"
cp -i vorlage.txt bericht.txt
```

```text
cp: overwrite 'bericht.txt'? n
```

> [!FEHLER]
> **„Ich habe die falsche Datei überschrieben.“** – Das passiert fast immer, weil Quelle und Ziel
> vertauscht wurden. Merke dir die Reihenfolge wie beim Umzug: erst *was*, dann *wohin*. Und nutze
> bei wichtigen Dateien `-i`. Manche Leute legen sich dafür sogar einen [[alias]] an, sodass `cp`
> immer nachfragt.

## Namen mit Leerzeichen und gute Namensregeln

Die [[shell]] trennt [[argument|Argumente]] an Leerzeichen. `mv Logo Final.png bilder/` versteht sie
als drei Argumente: `Logo`, `Final.png` und `bilder/`. Das geht schief. Du hast zwei Auswege:

```bash title="Namen mit Leerzeichen"
mv "Logo Final.png" bilder/        # Anführungszeichen um den ganzen Namen
mv Logo\ Final.png bilder/         # Backslash vor dem Leerzeichen
```

Die Tab-Vervollständigung setzt den Backslash übrigens automatisch. Noch besser ist es, solche Namen
gar nicht erst zu vergeben. Diese Regeln haben sich bewährt:

- **Keine Leerzeichen.** Nutze Bindestriche oder Unterstriche: `logo-final.png`.
- **Kleinbuchstaben.** Linux unterscheidet `Bild.png` und `bild.png`, macOS und Windows oft nicht.
  Wer konsequent kleinschreibt, vermeidet Verwechslungen beim Austausch.
- **Keine Sonderzeichen und Umlaute.** Klammern, `&`, `!`, `ä` oder `ß` haben in der Shell teils
  besondere Bedeutungen oder machen auf anderen Systemen Probleme.
- **Kein Bindestrich am Anfang.** Ein Name wie `-wichtig.txt` sieht für Befehle wie eine Option aus.
- **Kebab-Case** (`mein-projekt`) ist im Web üblich, Unterstriche (`rechnung_2026.pdf`) sind ebenfalls
  in Ordnung. Wichtig ist, dass du dich innerhalb eines Projekts für eine Schreibweise entscheidest.
- **Datum im ISO-Format** (`2026-10-09`), dann sortiert `ls` chronologisch richtig.

> [!PRAXIS]
> In Projekten mit Git, Webservern und Build-Werkzeugen sind Leerzeichen und Großbuchstaben in
> Dateinamen ein Klassiker für Fehler, die nur auf *einem* Rechner auftreten – etwa auf dem Server,
> aber nicht auf dem Mac. Teams legen deshalb oft verbindliche Namensregeln fest. Ein Gerüst wie
> `mkdir -p src/{components,pages} public/images` gehört in vielen Projekten zum Einrichten dazu.
> Die geschweiften Klammern lernst du in der nächsten Lektion kennen.

## Zusammenfassung

- `touch datei` legt eine leere Datei an oder aktualisiert nur ihren Zeitstempel – der Inhalt bleibt.
- `mkdir ordner` legt einen Ordner an, `mkdir -p a/b/c` einen ganzen Pfad inklusive fehlender Ebenen.
- `cp quelle ziel` kopiert, `cp -r` kopiert Ordner rekursiv. Existiert der Zielordner schon, landet die Kopie darin.
- `mv quelle ziel` verschiebt oder benennt um – auch Ordner, ganz ohne `-r`.
- `cp` und `mv` überschreiben ohne Nachfrage. `-i` fragt nach, `-n` überschreibt nie, `-v` zeigt, was passiert.
- Namen mit Leerzeichen brauchen Anführungszeichen oder Backslash. Besser: kleinschreiben, Bindestriche, keine Sonderzeichen.
