---
title: Löschen und Wildcards
summary: Wie rm und rmdir arbeiten, warum es im Terminal keinen Papierkorb gibt und wie du mit *, ?, [ ] und { } viele Dateien auf einmal triffst – ohne die falschen.
duration: 25
sources:
  - title: GNU Coreutils – rm invocation
    url: https://www.gnu.org/software/coreutils/manual/html_node/rm-invocation.html
  - title: GNU Coreutils – rmdir invocation
    url: https://www.gnu.org/software/coreutils/manual/html_node/rmdir-invocation.html
  - title: Bash Reference Manual – Pattern Matching
    url: https://www.gnu.org/software/bash/manual/html_node/Pattern-Matching.html
  - title: Bash Reference Manual – Brace Expansion
    url: https://www.gnu.org/software/bash/manual/html_node/Brace-Expansion.html
  - title: glob(7) – Globbing-Muster
    url: https://man7.org/linux/man-pages/man7/glob.7.html
quiz:
  - type: single
    question: "Im Ordner liegen `bild1.png`, `bild2.png`, `bild10.png` und `bild.png`. Welche Dateien trifft `bild?.png`?"
    options:
      - "bild1.png und bild2.png"
      - "bild1.png, bild2.png und bild10.png"
      - "Alle vier Dateien"
      - "Nur bild.png"
    answer: 0
    explanation: "? steht für genau ein beliebiges Zeichen. bild10.png hat zwei Zeichen an dieser Stelle, bild.png gar keins."
  - type: match
    question: Ordne jedem Muster zu, was es trifft oder erzeugt.
    pairs:
      - { left: "*.log", right: "Alle Dateien, die auf .log enden" }
      - { left: "foto[0-9].jpg", right: "foto0.jpg bis foto9.jpg, sofern vorhanden" }
      - { left: "{a,b,c}.txt", right: "Die drei Wörter a.txt b.txt c.txt – ob es sie gibt oder nicht" }
      - { left: "tag{1..3}", right: "tag1 tag2 tag3" }
    explanation: "*, ? und [ ] sind Wildcards und treffen nur vorhandene Dateien. Geschweifte Klammern erzeugen dagegen Wörter, unabhängig davon, ob Dateien existieren."
  - type: multiple
    question: Welche Aussagen über rm stimmen?
    options:
      - Gelöschte Dateien landen im Papierkorb
      - "rm -r löscht einen Ordner mit allem Inhalt"
      - "rm -i fragt vor jedem Löschen nach"
      - "rmdir löscht auch Ordner, in denen noch Dateien liegen"
    answers: [1, 2]
    explanation: Im Terminal gibt es keinen Papierkorb – rm entfernt sofort. rmdir löscht nur leere Ordner und ist dadurch die sichere Variante.
  - type: find-bug
    question: Dieses Aufräum-Skript soll nur den Ordner mit temporären Dateien leeren. Welche Zeile ist gefährlich?
    language: bash
    code: |
      ziel="$1"
      echo "Räume $ziel auf"
      ls "$ziel"
      rm -rf "$ziel"/*
    bug_line: 4
    explanation: "Wird das Skript ohne Argument aufgerufen, ist $ziel leer. Aus \"$ziel\"/* wird dann /* – also alles unterhalb der Wurzel. Sicherer: vorher prüfen, ob die Variable gesetzt ist, z. B. mit ${ziel:?}."
  - type: cloze
    text: Bevor du `rm *.tmp` ausführst, prüfst du mit `___ *.tmp`, welche Dateien das Muster trifft. Einen leeren Ordner löschst du mit `___`.
    blanks:
      - [ls, echo]
      - [rmdir, rm -d, rm -r]
    explanation: "Die Shell setzt das Muster vor dem Befehl ein. Mit ls oder echo siehst du genau die Liste, die rm bekommen würde. rmdir löscht nur leere Ordner."
tasks:
  - id: aufraeumen-mit-mustern
    type: terminal
    title: Aufräumen mit Wildcards
    description: |
      Im Ordner `wildcards-aufraeumen` liegen fünf Berichte (`bericht-1.txt` bis `bericht-5.txt`), zwei
      Fotos, eine `notiz.md`, drei Cache-Dateien (`cache1.tmp` bis `cache3.tmp`), ein leerer Ordner
      `leer` und ein Ordner `alt` mit einem Unterordner voller alter Dateien.

      1. Lass dir mit `ls *.tmp` anzeigen, was das Muster trifft. Lösche dann alle `.tmp`-Dateien mit **einem** Befehl.
      2. Lösche `bericht-1.txt`, `bericht-2.txt` und `bericht-3.txt` mit **einem** Befehl und einem
         Muster mit eckigen Klammern. `bericht-4.txt` und `bericht-5.txt` müssen bleiben.
      3. Lösche den leeren Ordner `leer` mit `rmdir`.
      4. Lösche den Ordner `alt` mit allem Inhalt.
      5. Die Fotos und `notiz.md` dürfen nicht angetastet werden.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit die Dateien angelegt werden.
    workdir: wildcards-aufraeumen
    setup: |
      touch bericht-1.txt bericht-2.txt bericht-3.txt bericht-4.txt bericht-5.txt
      touch foto-a.jpg foto-b.jpg notiz.md cache1.tmp cache2.tmp cache3.tmp
      mkdir -p alt/2019 leer
      printf 'alte Rechnung\n' > alt/2019/rechnung.txt
    checks:
      - type: command
        run: ls *.tmp 2>/dev/null | wc -l
        stdout_matches: "^\\s*0\\s*$"
        message: Es liegen noch .tmp-Dateien im Ordner. Lösche sie mit rm und dem Muster *.tmp.
      - type: command
        run: test ! -e bericht-1.txt && test ! -e bericht-2.txt && test ! -e bericht-3.txt
        message: bericht-1.txt bis bericht-3.txt sind noch nicht alle gelöscht. Probiere das Muster bericht-[1-3].txt.
      - type: command
        run: test -f bericht-4.txt && test -f bericht-5.txt
        message: bericht-4.txt und bericht-5.txt müssen erhalten bleiben – dein Muster war zu breit. Klicke auf Aufgabe vorbereiten und versuche es erneut.
      - type: command
        run: test -f foto-a.jpg && test -f foto-b.jpg && test -f notiz.md
        message: Die Fotos oder notiz.md fehlen. Diese Dateien sollten nicht gelöscht werden.
      - type: command
        run: test ! -e leer
        message: Der leere Ordner leer existiert noch. rmdir leer entfernt ihn.
      - type: command
        run: test ! -e alt
        message: Der Ordner alt existiert noch. Er ist nicht leer, deshalb brauchst du rm -r.
    hints:
      - Schau dir jedes Muster erst mit `ls` an, bevor du `rm` davor schreibst.
      - "`[1-3]` steht für genau ein Zeichen aus dem Bereich 1 bis 3."
      - "`rm *.tmp`, `rm bericht-[1-3].txt`, `rmdir leer`, `rm -r alt`."
    solution: |
      ```bash
      cd wildcards-aufraeumen
      ls *.tmp
      rm *.tmp
      ls bericht-[1-3].txt
      rm bericht-[1-3].txt
      rmdir leer
      rm -r alt
      ls
      ```
  - id: buch-gliederung
    type: terminal
    title: Eine Buchgliederung mit Klammern anlegen
    description: |
      Du schreibst ein Buch mit vier Kapiteln. Jedes Kapitel bekommt einen Ordner für Texte und einen für
      Bilder. Lege die Struktur mit Klammererweiterung an, statt jeden Ordner einzeln zu tippen.
      Der Aufgabenordner `klammer-kapitel` ist zu Beginn leer.

      1. Lege mit **einem** `mkdir`-Befehl diese acht Ordner an:
         `buch/kapitel-1/texte`, `buch/kapitel-1/bilder`, … bis `buch/kapitel-4/texte` und `buch/kapitel-4/bilder`.
      2. Lege mit **einem** `touch`-Befehl in jedem `texte`-Ordner eine leere Datei `entwurf.md` an.
      3. Sieh dir das Ergebnis mit `tree buch` an.

      Tipp: Schreib den Befehl zuerst mit `echo` davor, um zu sehen, was die Shell daraus macht.
    workdir: klammer-kapitel
    checks:
      - type: command
        run: find buch -mindepth 2 -maxdepth 2 -type d 2>/dev/null | wc -l
        stdout_matches: "^\\s*8\\s*$"
        message: Es sollten genau acht Ordner der Form buch/kapitel-N/texte bzw. buch/kapitel-N/bilder existieren.
      - type: command
        run: ls -d buch/kapitel-1/bilder buch/kapitel-4/texte
        message: Die Ordnernamen stimmen noch nicht. Erwartet werden zum Beispiel buch/kapitel-1/bilder und buch/kapitel-4/texte.
      - type: command
        run: find buch -name entwurf.md -path "*/texte/*" 2>/dev/null | wc -l
        stdout_matches: "^\\s*4\\s*$"
        message: In jedem der vier texte-Ordner soll eine Datei entwurf.md liegen.
    hints:
      - "`{1..4}` erzeugt die Zahlen 1 bis 4, `{texte,bilder}` die beiden Wörter. Du kannst beides in einem Pfad kombinieren."
      - "`echo buch/kapitel-{1..4}/{texte,bilder}` zeigt dir die acht Pfade. Jetzt noch `mkdir -p` davor."
      - "`mkdir -p buch/kapitel-{1..4}/{texte,bilder}` und `touch buch/kapitel-{1..4}/texte/entwurf.md`."
    solution: |
      ```bash
      cd klammer-kapitel
      echo buch/kapitel-{1..4}/{texte,bilder}     # Vorschau
      mkdir -p buch/kapitel-{1..4}/{texte,bilder}
      touch buch/kapitel-{1..4}/texte/entwurf.md
      tree buch
      ```
  - id: sicher-loeschen
    type: order
    title: Sicher löschen in der richtigen Reihenfolge
    description: Du willst alle alten Log-Dateien in einem Projektordner entfernen. Bringe die Schritte in die sichere Reihenfolge.
    items:
      - Mit pwd prüfen, in welchem Ordner du stehst
      - Mit ls *.log ansehen, welche Dateien das Muster trifft
      - Kontrollieren, dass keine wichtige Datei in der Liste steht
      - Mit rm *.log löschen – denselben Ausdruck wie beim ls
      - Mit ls prüfen, dass nur die Log-Dateien verschwunden sind
    hints:
      - Erst orientieren, dann ansehen, dann löschen, dann kontrollieren.
---

Im Dateimanager ist Löschen harmlos: Die Datei wandert in den Papierkorb, und wenn du dich vertan
hast, holst du sie zurück. Im Terminal gibt es diesen Sicherheitsgurt nicht. Ein einziger Befehl kann
in Sekundenbruchteilen Tausende Dateien entfernen – unwiederbringlich. Deshalb lernst du in dieser
Lektion zwei Dinge zusammen: wie du löschst und wie du mit Mustern genau die Dateien triffst, die du
meinst.

## Dateien löschen – rm

`rm` (*remove*) löscht die Dateien, die du ihm nennst:

```bash title="Terminal"
rm alt.txt
rm entwurf-1.txt entwurf-2.txt
```

Es gibt keine Rückfrage und keine Erfolgsmeldung. Wenn `rm` still bleibt, hat alles geklappt. Mit
`-i` (*interactive*) fragt `rm` vor jeder Datei nach, mit `-v` zeigt es an, was es gelöscht hat:

```bash title="Terminal"
rm -i bericht.txt
```

```text
rm: remove regular empty file 'bericht.txt'? y
```

> [!ACHTUNG]
> `rm` verschiebt nichts in einen Papierkorb. Die Datei ist sofort weg. Selbst Spezialprogramme zur
> Wiederherstellung haben oft keine Chance. Deine Versicherung sind Backups und Git – nicht das
> Terminal.

## Ordner löschen – rmdir und rm -r

Für Ordner gibt es zwei Wege. `rmdir` löscht einen Ordner nur, wenn er **leer** ist. Liegt noch
etwas darin, weigert es sich. Das macht `rmdir` zum sicheren Werkzeug:

```bash title="Terminal"
rmdir leer
rmdir projekte
```

```text
rmdir: failed to remove 'projekte': Directory not empty
```

Willst du einen Ordner mitsamt Inhalt entfernen, brauchst du `rm -r`. Wie bei `cp -r` aus der
letzten Lektion arbeitet sich `-r` [[rekursiv]] durch alle Unterordner und löscht alles, was es
findet – zuerst den Inhalt, dann den Ordner selbst.

```bash title="Terminal"
rm -r alt
```

### rm -rf – die Kettensäge

Oft siehst du in Anleitungen `rm -rf`. Das `-f` steht für *force*: keine Rückfragen, keine
Fehlermeldung, wenn etwas nicht existiert. Zusammen mit `-r` ist das die Kettensäge unter den
Befehlen. Sie ist nützlich, um etwa einen Build-Ordner zu entfernen, aber sie verzeiht keinen
Tippfehler.

Berühmt-berüchtigte Unfälle:

- `rm -rf /` würde versuchen, das gesamte System zu löschen. Moderne GNU-Versionen blockieren das
  standardmäßig – darauf verlassen solltest du dich nie.
- `rm -rf ordner /` mit einem versehentlichen Leerzeichen bedeutet: lösche `ordner` **und** `/`.
- `rm -rf "$VERZEICHNIS"/*` in einem Skript, wenn die Variable leer ist: Aus dem Pfad wird `/*`.
  Ein Fehler dieser Art hat schon ganze Server leergeräumt.

> [!FEHLER]
> **Löschen mit einer leeren Variablen.** Wenn du in Skripten mit Variablen löschst, prüfe vorher,
> ob sie gesetzt sind. In Bash bricht `rm -rf "${VERZEICHNIS:?}"/*` mit einer Fehlermeldung ab, wenn
> die Variable leer ist. Mehr zu Skripten lernst du im letzten Modul.

## Wildcards: viele Dateien mit einem Muster treffen

Stell dir vor, in einem Ordner liegen 200 Fotos und 30 temporäre Dateien. Du willst nur die
temporären loswerden. Alle 30 Namen abzutippen wäre mühsam. Hier helfen [[wildcard|Wildcards]], auf
Deutsch Platzhalter. Ein Wildcard-Muster beschreibt viele Dateinamen auf einmal – ähnlich wie ein
Joker beim Kartenspielen für jede beliebige Karte stehen kann. Diesen Mechanismus nennt man auch
**Globbing**.

| Muster | Bedeutung | Beispiel | Trifft |
|---|---|---|---|
| `*` | beliebig viele beliebige Zeichen, auch keins | `*.txt` | `a.txt`, `notizen.txt` |
| `?` | genau ein beliebiges Zeichen | `foto?.jpg` | `foto1.jpg`, nicht `foto10.jpg` |
| `[abc]` | genau eines der Zeichen a, b oder c | `[ab]*.md` | `anleitung.md`, `brief.md` |
| `[0-9]` | genau ein Zeichen aus dem Bereich | `log-[0-9].txt` | `log-3.txt` |
| `[!0-9]` | genau ein Zeichen, das **nicht** im Bereich liegt | `[!_]*` | alles, was nicht mit `_` beginnt |

```bash title="Terminal"
ls *.jpg
ls bericht-202?.pdf
ls bericht-[1-3].txt
```

Zwei Besonderheiten solltest du kennen. Erstens trifft `*` keine
[[versteckte-datei|versteckten Dateien]]: `*` passt nicht auf einen Namen, der mit einem Punkt
beginnt. Zweitens gilt ein Muster nur innerhalb einer Ordnerebene. `*.txt` findet keine Dateien in
Unterordnern – dafür gibt es `find`, das du bei grep kennenlernst.

## Die Shell setzt das Muster ein – nicht der Befehl

Das ist der wichtigste Gedanke dieser Lektion. Wenn du `rm *.tmp` tippst, sieht `rm` niemals das
Sternchen. Die [[shell]] schaut **vorher** in den Ordner, sucht alle passenden Namen und ersetzt das
Muster durch diese Liste. Erst dann startet sie `rm`:

```text
Du tippst:            rm *.tmp
Die Shell macht:      rm cache1.tmp cache2.tmp cache3.tmp
```

Daraus folgt ein großartiger Trick: Du kannst dir mit `echo` oder `ls` genau die Liste ansehen, die
`rm` bekommen würde – ohne etwas zu löschen.

```bash title="Erst schauen, dann löschen"
echo *.tmp
ls *.tmp
rm *.tmp
```

> [!MERKSATZ]
> Bevor du mit einem Muster löschst, führe denselben Ausdruck mit `ls` oder `echo` aus. Die Liste,
> die du dann siehst, ist exakt die Liste, die `rm` bekommt.

### Wenn nichts passt

Was passiert, wenn kein Dateiname auf das Muster passt? In Bash bleibt das Muster dann einfach
stehen, und der Befehl bekommt das Sternchen wörtlich:

```text
$ ls *.xyz
ls: cannot access '*.xyz': No such file or directory
```

Die Fehlermeldung kommt also von `ls`, das eine Datei namens `*.xyz` sucht. In zsh, der Standard-Shell
auf macOS, sieht das anders aus: Dort bricht die Shell selbst mit `no matches found` ab. Und wenn du
ein Muster in Anführungszeichen setzt (`"*.txt"`), schaltest du die Erweiterung ganz aus – dann ist
das Sternchen ein ganz normales Zeichen.

## Klammererweiterung: Wörter erzeugen mit { }

Geschweifte Klammern sehen aus wie Wildcards, funktionieren aber ganz anders. Die
[[klammererweiterung|Klammererweiterung]] (englisch *brace expansion*) **erzeugt** Wörter – egal, ob
es Dateien mit diesen Namen gibt. Sie ist eine Bash-Funktion, kein Teil des Globbings.

```bash title="Terminal"
echo {rot,gruen,blau}.css
echo kapitel-{1..5}
echo backup-{01..03}.tar
```

```text
rot.css gruen.css blau.css
kapitel-1 kapitel-2 kapitel-3 kapitel-4 kapitel-5
backup-01.tar backup-02.tar backup-03.tar
```

Damit legst du ganze Strukturen in einem Rutsch an. Zwei Klammern in einem Ausdruck werden
kombiniert – jede Möglichkeit mit jeder:

```bash title="Terminal"
mkdir -p projekt/{src,tests,docs}
mkdir -p jahr-2026/{01..12}
touch bild{1..3}.{png,jpg}
```

Ein praktischer Klassiker ist eine schnelle Sicherungskopie: `cp config.yml{,.bak}` wird zu
`cp config.yml config.yml.bak`.

| | Wildcards `* ? [ ]` | Klammern `{ }` |
|---|---|---|
| Was tun sie? | finden **vorhandene** Dateien | erzeugen Wörter |
| Braucht es die Dateien? | ja | nein |
| Typischer Einsatz | `rm *.log`, `ls foto?.jpg` | `mkdir -p {a,b}`, `touch tag{1..7}.md` |

> [!FEHLER]
> **Leerzeichen in der Klammer.** `{a, b}` funktioniert nicht – die Shell sieht das Leerzeichen und
> erweitert gar nichts. Schreib die Teile immer ohne Leerzeichen: `{a,b}`.

> [!PRAXIS]
> In echten Projekten löscht man selten einzelne Dateien von Hand, sondern ganze Gruppen: alte
> Logdateien, Build-Ordner wie `dist`, Caches. Erfahrene Entwickler:innen haben dafür eine feste
> Routine – `pwd`, dann `ls` mit genau dem Muster, dann erst `rm`. In Skripten kommt fast immer
> eine Prüfung dazu, ob der Zielordner wirklich der erwartete ist. Diese Gewohnheit kostet zwei
> Sekunden und verhindert die schlimmsten Unfälle deiner Laufbahn.

## Zusammenfassung

- `rm datei` löscht sofort und endgültig – im Terminal gibt es keinen Papierkorb. `-i` fragt nach, `-v` zeigt, was passiert.
- `rmdir` löscht nur leere Ordner. `rm -r` löscht Ordner mit Inhalt, `rm -rf` zusätzlich ohne jede Rückfrage.
- Wildcards: `*` beliebig viele Zeichen, `?` genau eins, `[abc]` und `[0-9]` eines aus einer Auswahl. Versteckte Dateien trifft `*` nicht.
- Die Shell ersetzt das Muster durch passende Namen, **bevor** der Befehl startet. Deshalb siehst du mit `ls` oder `echo` vorher, was getroffen wird.
- Passt nichts, gibt Bash das Muster wörtlich weiter. In zsh bricht die Shell mit „no matches found“ ab.
- Klammererweiterung `{a,b}` und `{1..5}` erzeugt Wörter, egal ob Dateien existieren – ideal zum Anlegen ganzer Strukturen.
