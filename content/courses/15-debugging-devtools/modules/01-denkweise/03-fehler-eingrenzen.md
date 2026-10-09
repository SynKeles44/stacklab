---
title: Fehler eingrenzen – halbieren statt suchen
summary: Mit binärer Suche, minimalen Beispielen und git bisect findest du in wenigen Schritten die Stelle oder den Commit, der den Fehler verursacht.
duration: 25
sources:
  - title: git-bisect Dokumentation
    url: https://git-scm.com/docs/git-bisect
  - title: Pro Git – Debugging mit Git
    url: https://git-scm.com/book/de/v2/Git-Tools-Debuggen-mit-Git
quiz:
  - type: single
    question: Ein Fehler ist irgendwo in den letzten 1000 Commits entstanden. Wie viele Tests braucht `git bisect` ungefähr, um den Commit zu finden?
    options:
      - Etwa 1000
      - Etwa 500
      - Etwa 10
      - Genau 1
    answer: 2
    explanation: >
      Jeder Test halbiert den Suchraum: 1000 → 500 → 250 → … → 1. Das sind rund 10 Schritte, weil 2 hoch 10
      ungefähr 1000 ist.
  - type: multiple
    question: Welche Aussagen über `git bisect` stimmen?
    options:
      - Du brauchst einen Commit, in dem der Fehler sicher noch nicht da war.
      - "`git bisect run` kann einen Befehl automatisch testen lassen: Exit-Code 0 bedeutet gut, 1 bis 127 (außer 125) bedeutet schlecht."
      - "`git bisect` ändert deine Commits dauerhaft."
      - Mit `git bisect reset` kehrst du danach zu deinem Branch zurück.
    answers: [0, 1, 3]
    explanation: >
      Bisect braucht einen guten und einen schlechten Commit und checkt dazwischen Commits aus. Die Historie bleibt
      unverändert. `reset` beendet die Suche und bringt dich zurück an den Ausgangspunkt.
  - type: cloze
    text: Ein möglichst kleines Programm, das den Fehler noch zeigt, nennt man ___ Reproduktion. Die Suchstrategie, die den Bereich in jedem Schritt halbiert, heißt ___ Suche.
    blanks:
      - [minimale, minimal]
      - [binäre, binaere]
    explanation: >
      Beim Verkleinern zur minimalen Reproduktion wendest du oft selbst eine binäre Suche an: Hälfte weg – ist der
      Fehler noch da?
  - type: find-bug
    question: Ada will mit `git bisect` suchen, bekommt aber sofort eine Fehlermeldung. In welcher Zeile liegt das Problem?
    language: bash
    code: |
      git bisect start
      git bisect bad
      git bisect bad v1.2.0
      git bisect run npm test
    bug_line: 3
    explanation: >
      Bisect braucht einen **guten** Commit als untere Grenze. Richtig wäre `git bisect good v1.2.0` – die Version,
      in der der Fehler noch nicht auftrat.
tasks:
  - id: bisect-reihenfolge
    type: order
    title: Eine git-bisect-Sitzung in der richtigen Reihenfolge
    description: Bring die Befehle in die Reihenfolge, in der du sie bei einer automatischen Suche ausführst.
    items:
      - git bisect start
      - git bisect bad
      - git bisect good v1.0.0
      - git bisect run node test.js
      - "Hash aus „… is the first bad commit“ notieren"
      - git bisect reset
    hints:
      - Erst starten, dann die beiden Grenzen nennen, dann automatisch testen lassen, zum Schluss aufräumen.
  - id: bisect-praxis
    type: terminal
    title: Den schuldigen Commit mit git bisect finden
    description: |
      Im Ordner `bisect` liegt ein Repository mit 16 Commits. `preis.js` berechnet Bruttopreise mit 19 %
      Mehrwertsteuer, `test.js` prüft, ob `brutto(10.99)` genau `13.08` ergibt. Im ersten Commit
      funktionierte das noch, heute schlägt der Test fehl. Die Commit-Messages verraten leider nichts.

      1. Führe `node test.js` aus und sieh dir den Fehler an.
      2. Starte `git bisect`, markiere den aktuellen Stand als schlecht und den ersten Commit als gut.
         Den Hash des ersten Commits zeigt dir `git log --oneline --reverse | head -n 1`.
      3. Lass Git mit `git bisect run node test.js` automatisch suchen.
      4. Notiere den Hash, den Git als „first bad commit“ meldet, und beende die Suche mit `git bisect reset`.
      5. Schreibe den Hash (kurz oder lang) in die Datei `schuldig.txt`.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit das Repository angelegt wird.
    workdir: bisect
    setup: |
      git init -q -b main
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      cat > preis.js <<'EOF'
      function brutto(netto) {
        return Math.round(netto * 119) / 100;
      }

      module.exports = { brutto };
      EOF
      cat > test.js <<'EOF'
      const { brutto } = require('./preis');

      const ist = brutto(10.99);
      if (ist !== 13.08) {
        console.error(`FEHLER: brutto(10.99) ist ${ist}, erwartet 13.08`);
        process.exit(1);
      }
      console.log('ok');
      EOF
      printf '# Changelog\n' > CHANGELOG.md
      git add .
      git commit -q -m "chore: schritt 01"
      for i in 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16; do
        printf -- '- Schritt %s\n' "$i" >> CHANGELOG.md
        if [ "$i" = "11" ]; then
          sed -i 's/Math.round/Math.floor/' preis.js
        fi
        git commit -q -am "chore: schritt $i"
      done
    checks:
      - type: file_exists
        path: schuldig.txt
        message: Lege die Datei schuldig.txt mit dem Hash des ersten schlechten Commits an.
      - type: command
        run: |
          test "$(git rev-parse "$(grep -Eo '[0-9a-f]{7,40}' schuldig.txt | head -n 1)^{commit}")" = "$(git log --format=%H --grep='^chore: schritt 11$')"
        message: Der Hash in schuldig.txt ist nicht der erste schlechte Commit. Lass `git bisect run node test.js` suchen und kopiere den Hash aus „is the first bad commit“.
      - type: command
        run: test ! -e .git/BISECT_LOG
        message: Die Bisect-Sitzung läuft noch. Beende sie mit `git bisect reset`.
      - type: command
        run: git symbolic-ref --short HEAD
        stdout_equals: main
        message: Du stehst nicht mehr auf dem Branch main. `git bisect reset` bringt dich zurück.
    hints:
      - "`git bisect start`, dann `git bisect bad` (aktueller Stand) und `git bisect good <hash-des-ersten-commits>`."
      - "`git bisect run node test.js` testet jeden Kandidaten automatisch: Exit-Code 0 = gut, 1 = schlecht."
      - "Am Ende steht `<hash> is the first bad commit`. Danach `git bisect reset` und `echo <hash> > schuldig.txt`."
    solution: |
      ```bash
      cd bisect
      node test.js                                   # FEHLER: brutto(10.99) ist 13.07 …
      git bisect start
      git bisect bad
      git bisect good $(git rev-list --max-parents=0 HEAD)
      git bisect run node test.js                    # … is the first bad commit
      git bisect reset
      echo 1a2b3c4 > schuldig.txt                    # deinen gemeldeten Hash einsetzen
      git show 1a2b3c4 -- preis.js                   # Math.round wurde zu Math.floor
      ```
---
Du weißt jetzt, wie du einen Fehler reproduzierst und eine Fehlermeldung liest. Aber was, wenn es keine
Meldung gibt – nur ein falsches Ergebnis irgendwo in 5000 Zeilen Code oder 300 Commits? Zeile für Zeile
durchlesen dauert Stunden. Viel schneller geht es mit einem Trick aus der Informatik: **halbieren**.

## Die Idee der binären Suche

Stell dir ein Zahlenratespiel vor: Jemand denkt sich eine Zahl zwischen 1 und 100. Du fragst „Ist sie größer
als 50?“ – und hast mit einer Frage die Hälfte aller Möglichkeiten ausgeschlossen. Nach höchstens sieben
Fragen kennst du die Zahl.

Diese [[binaere-suche|binäre Suche]] funktioniert auch beim Debuggen. Du brauchst nur zwei Punkte:

- einen Punkt, an dem noch **alles stimmt**,
- einen Punkt, an dem der Fehler **sicher auftritt**.

Dann prüfst du die Mitte und behältst die Hälfte, in der der Wechsel von „gut“ zu „schlecht“ liegt.

| Suchraum | Schritte bei linearer Suche | Schritte bei binärer Suche |
|---|---|---|
| 16 | bis zu 16 | 4 |
| 1000 | bis zu 1000 | 10 |
| 1 000 000 | bis zu 1 000 000 | 20 |

> [!MERKSATZ]
> Binäre Suche braucht einen **guten** und einen **schlechten** Zustand. Wer nur „kaputt“ kennt, muss zuerst
> einen Zustand finden, in dem es noch funktionierte.

## Halbieren im Code und in den Daten

Die binäre Suche funktioniert in drei Richtungen:

1. **Im Ablauf:** Gib den Wert in der Mitte der Verarbeitung aus. Stimmt er dort noch, liegt der Fehler
   danach – sonst davor.
2. **In den Daten:** Eine Import-Datei mit 10 000 Zeilen bringt das Programm zum Absturz? Nimm nur die erste
   Hälfte. Stürzt es noch ab, halbiere weiter. Nach etwa 14 Schritten hast du die eine kaputte Zeile.
3. **Im Code:** Kommentiere die Hälfte einer verdächtigen Funktion aus oder ersetze sie durch feste Werte.

Am Ende steht eine [[minimales-beispiel|minimale Reproduktion]]: zum Beispiel eine CSV-Datei mit genau einer
Zeile, die den Absturz auslöst. Damit ist die Ursache meist offensichtlich – und du hast gleich das perfekte
Beispiel für einen Test.

> [!FEHLER]
> **Mehrere Dinge gleichzeitig ändern.** Wenn du beim Halbieren nebenbei noch „schnell“ etwas anderes
> korrigierst, weißt du nicht mehr, welche Änderung das Verhalten beeinflusst hat. Ein Schritt, eine Änderung.

## git bisect: binäre Suche durch die Historie

Oft lautet die Frage nicht „wo im Code?“, sondern „seit wann?“. Letzte Woche funktionierte der Export noch,
heute nicht – dazwischen liegen 40 [[commit|Commits]]. Genau dafür gibt es [[git-bisect|git bisect]].

```bash title="Manuelle Suche"
git bisect start
git bisect bad              # der aktuelle Stand ist kaputt
git bisect good v2.3.0      # in diesem Tag funktionierte es noch
# Git checkt einen Commit in der Mitte aus. Du testest und sagst:
git bisect good             # … oder: git bisect bad
# … wiederholen, bis Git meldet: <hash> is the first bad commit
git bisect reset            # zurück zu deinem Branch
```

Während der Suche steht dein Repository auf einem älteren Commit ([[detached-head|detached HEAD]]). Das ist gewollt –
`git bisect reset` bringt dich am Ende zurück.

## Automatisch suchen mit git bisect run

Kannst du den Fehler mit einem Befehl prüfen, übernimmt Git die ganze Arbeit:

```bash title="Terminal"
git bisect start
git bisect bad
git bisect good a1b2c3d
git bisect run node test.js
```

Git führt den Befehl für jeden Kandidaten aus und wertet den [[exit-code|Exit-Code]] aus:

| Exit-Code | Bedeutung für bisect |
|---|---|
| `0` | Commit ist gut |
| `1` bis `127`, außer `125` | Commit ist schlecht |
| `125` | Commit nicht testbar, überspringen |

Ein kleines Testskript, das bei einem Fehler mit `process.exit(1)` endet, reicht völlig aus. Fehlt so ein
Skript, schreib eins – das lohnt sich schon ab etwa zehn Commits.

> [!PRAXIS]
> Wenn du den schuldigen Commit gefunden hast, schau ihn dir mit `git show <hash>` an. Oft ist die Änderung
> klein, und du siehst sofort, welche Annahme sie verletzt. Kleine, fokussierte Commits machen bisect besonders
> wirkungsvoll – ein weiterer Grund, nicht alles in einen Riesen-Commit zu packen.

## Zusammenfassung

- Binäre Suche halbiert den Suchraum in jedem Schritt: 1000 Möglichkeiten brauchen nur etwa 10 Tests.
- Du brauchst immer einen guten und einen schlechten Zustand.
- Halbieren klappt im Ablauf, in den Daten und im Code – bis zur minimalen Reproduktion.
- `git bisect` sucht den ersten schlechten Commit: `start`, `bad`, `good <commit>`, testen, `reset`.
- `git bisect run <befehl>` testet automatisch anhand des Exit-Codes.
- Pro Schritt nur eine Änderung – sonst verlierst du den Überblick.
