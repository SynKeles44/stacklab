---
title: Warum Code-Qualität automatisieren?
summary: Welches Problem Qualitätswerkzeuge lösen, welche Arten es gibt und warum ein Fehler umso teurer wird, je später er auffällt.
duration: 20
sources:
  - title: PHPStan – Getting Started
    url: https://phpstan.org/user-guide/getting-started
  - title: Laravel Pint
    url: https://laravel.com/docs/13.x/pint
  - title: Biome – Getting Started
    url: https://biomejs.dev/guides/getting-started/
  - title: Pro Git – Git-Hooks
    url: https://git-scm.com/book/de/v2/Git-individuell-einrichten-Git-Hooks
quiz:
  - type: single
    question: Was ist der wichtigste Grund, Stil- und Typregeln an Werkzeuge abzugeben?
    options:
      - Werkzeuge prüfen jede Änderung in Sekunden und immer gleich – Menschen im Review können sich auf Logik und Idee konzentrieren.
      - Werkzeuge ersetzen Code-Reviews komplett.
      - Werkzeuge machen den Code schneller.
      - Ohne Werkzeuge lässt sich PHP nicht ausführen.
    answer: 0
    explanation: >
      Qualitätswerkzeuge sind unermüdlich und konsequent. Sie nehmen dem Review die langweiligen Fragen ab
      (Einrückung, vergessene Typen), ersetzen aber nicht das Nachdenken über die Lösung.
  - type: multiple
    question: Welche Aussagen über die Feedback-Schleife stimmen?
    options:
      - Ein Fehler, den der Editor beim Speichern meldet, kostet fast nichts.
      - Ein Fehler, der erst in Produktion auffällt, ist am teuersten.
      - Die CI-Pipeline ist die schnellste Stelle, um Fehler zu finden.
      - Dieselben Prüfungen sollten lokal und in der CI laufen.
    answers: [0, 1, 3]
    explanation: >
      Je näher ein Fehler an dem Moment gemeldet wird, in dem du ihn gemacht hast, desto billiger ist er.
      Die CI ist das Sicherheitsnetz, aber nicht die schnellste Stelle – sie braucht Minuten.
  - type: match
    question: Ordne jede Werkzeugart ihrer Frage zu.
    pairs:
      - { left: "Formatter", right: "Wie sieht der Code aus?" }
      - { left: "Linter", right: "Gibt es verdächtige Muster?" }
      - { left: "Statische Analyse", right: "Passen Typen und Aufrufe zusammen?" }
      - { left: "Tests", right: "Tut der Code beim Ausführen das Richtige?" }
    explanation: Die ersten drei prüfen den Code, ohne ihn auszuführen. Tests führen ihn aus.
  - type: cloze
    text: Eine automatische Prüfung, die einen Merge verhindert, wenn sie fehlschlägt, nennt man ___ (englisch Quality Gate).
    blanks:
      - [Qualitätsschranke, Qualitaetsschranke, Quality Gate]
    explanation: Eine Qualitätsschranke lässt nur Code durch, der alle vereinbarten Prüfungen besteht.
tasks:
  - id: werkzeuge-zuordnen
    type: dragdrop
    title: Welche Frage beantwortet welches Werkzeug?
    description: >
      Ziehe jedes Werkzeug zu der Werkzeugart, zu der es gehört. Manche Werkzeuge kennst du erst nach
      diesem Kurs – entscheide nach der Beschreibung in Klammern.
    targets:
      - { id: formatter, label: "Formatter – Aussehen" }
      - { id: linter, label: "Linter – verdächtige Muster" }
      - { id: analyse, label: "Statische Analyse – Typen" }
      - { id: refactoring, label: "Automatisches Refactoring – Umbauen" }
    items:
      - { label: "Laravel Pint (rückt PHP-Code ein)", target: formatter }
      - { label: "biome format (formatiert JavaScript)", target: formatter }
      - { label: "biome lint (meldet == statt ===)", target: linter }
      - { label: "php -l (findet Syntaxfehler)", target: linter }
      - { label: "PHPStan (meldet: strtoupper bekommt int|null)", target: analyse }
      - { label: "tsc --noEmit (prüft TypeScript-Typen)", target: analyse }
      - { label: "Rector (macht aus array() kurze Arrays)", target: refactoring }
    hints:
      - Ein Formatter ändert nur Leerzeichen, Zeilenumbrüche und Klammern – nie die Bedeutung.
      - Wer etwas über Typen weiß, gehört zur statischen Analyse.
  - id: feedback-schleife
    type: diagram
    title: Beschrifte die Feedback-Schleife
    description: >
      Das Bild zeigt vier Stellen, an denen ein Fehler auffallen kann – von links (sofort) nach rechts (spät).
      Ziehe die Namen in die richtigen Kästen. Ein Begriff gehört nicht ins Bild.
    image: /assets/code-qualitaet/feedback-schleife-leer.svg
    slots:
      - { x: 13.3, y: 31, answer: Editor }
      - { x: 37.7, y: 31, answer: Pre-Commit-Hook }
      - { x: 62.2, y: 31, answer: CI-Pipeline }
      - { x: 86.6, y: 31, answer: Code-Review }
    distractors: [Produktionsserver]
    hints:
      - Die Zeitangaben in den Kästen helfen dir – Millisekunden sind nur im Editor möglich.
      - Der Hook läuft vor dem Commit, die CI erst nach dem Push.
---
Du öffnest einen Pull Request und bekommst zwölf Kommentare. Elf davon lauten: „Hier fehlt ein Leerzeichen“,
„Bitte `===` statt `==`“, „Der Rückgabetyp fehlt“. Der zwölfte weist auf einen echten Denkfehler hin – und
geht im Lärm fast unter. Genau dieses Problem löst automatisierte **Code-Qualität**: Die langweiligen Regeln
prüft eine Maschine, die spannenden Fragen bleiben für Menschen.

## Das Problem: Menschen sind schlechte Regelprüfer

Jedes Team hat Regeln. Manche betreffen das Aussehen (Einrückung, Klammern), manche die Sicherheit
(„Prüfe immer auf `null`“), manche die Modernität („Wir nutzen keine alten Sprachfeatures mehr“).
Werden diese Regeln von Hand geprüft, passiert immer dasselbe:

- **Es kostet Zeit.** Reviewer lesen Leerzeichen statt Logik.
- **Es ist ungleich.** Montags fällt ein Fehler auf, freitags nicht.
- **Es nervt.** Kommentare zum Stil fühlen sich persönlich an und führen zu Diskussionen.
- **Es skaliert nicht.** Bei 200 Dateien pro Woche übersieht jeder etwas.

Ein Werkzeug dagegen prüft jede Datei, jedes Mal, in Sekunden – und diskutiert nicht.

> [!MERKSATZ]
> Was eine Maschine prüfen kann, soll eine Maschine prüfen. Menschen prüfen, ob die Lösung **sinnvoll** ist.

## Der Werkzeugkasten im Überblick

Qualitätswerkzeuge lassen sich nach der Frage ordnen, die sie beantworten. Du lernst sie in diesem Kurs
alle kennen:

![Vier Schichten der automatischen Prüfung](/assets/code-qualitaet/werkzeug-schichten.svg)

| Werkzeugart | Frage | PHP | JavaScript/TypeScript |
|---|---|---|---|
| [[formatter]] | Wie sieht der Code aus? | Laravel Pint | Biome (format) |
| [[linter]] | Gibt es verdächtige Muster? | `php -l`, Regeln in PHPStan | Biome (lint) |
| [[statische-analyse]] | Passen Typen und Aufrufe? | PHPStan | `tsc` |
| Automatisches [[refactoring]] | Lässt sich das moderner schreiben? | Rector | Biome-Fixes |
| [[automatisierter-test\|Tests]] | Tut der Code das Richtige? | Pest | Vitest |

Die ersten vier Arten führen deinen Code **nicht aus** – sie lesen ihn nur. Tests führen ihn aus. Tests
behandelt ein eigener Kurs; hier geht es um alles, was ohne Ausführen funktioniert.

## Die Feedback-Schleife: früh ist billig

Ein Fehler kann an vielen Stellen auffallen. Entscheidend ist, **wie lange** es dauert, bis du davon erfährst:

![Die Feedback-Schleife](/assets/code-qualitaet/feedback-schleife.svg)

1. **Im Editor** beim Speichern – nach Millisekunden. Du weißt noch genau, was du getan hast.
2. **Im [[pre-commit-hook|Pre-Commit-Hook]]** – nach Sekunden, bevor der Fehler in die Historie kommt.
3. **In der [[ci-pipeline|CI-Pipeline]]** – nach Minuten. Du arbeitest gedanklich schon an etwas anderem.
4. **Im Code-Review oder in Produktion** – nach Stunden oder Tagen. Jetzt sind andere Menschen betroffen.

Jede Stufe nach rechts macht den Fehler teurer: mehr Kontextwechsel, mehr beteiligte Personen, im
schlimmsten Fall echte Nutzer, die ihn sehen.

> [!PRAXIS]
> In professionellen Teams laufen dieselben Prüfungen an mehreren Stellen: Der Editor formatiert beim
> Speichern, ein Hook prüft die geänderten Dateien vor dem Commit, und die CI-Pipeline prüft alles noch
> einmal – denn Hooks lassen sich umgehen, die CI nicht.

## Regeln gehören ins Repository

Damit alle dieselben Regeln prüfen, liegen sie als Konfigurationsdateien **im Repository** – nicht in den
Einstellungen einzelner Editoren:

```text title="Typische Qualitäts-Dateien in einem Projekt"
projekt/
├── .editorconfig      ← Grundregeln für jeden Editor
├── pint.json          ← PHP-Code-Stil
├── phpstan.neon       ← statische Analyse für PHP
├── rector.php         ← automatische Umbauten
├── biome.json         ← Format und Lint für JS/TS
├── tsconfig.json      ← TypeScript-Strenge
└── lefthook.yml       ← Git-Hooks
```

So gelten die Regeln automatisch für jeden, der das Repository klont – und jede Regeländerung ist ein
nachvollziehbarer Commit.

> [!FEHLER]
> „Bei mir ist der Code sauber, mein Editor formatiert doch.“ – Wenn die Regeln nur in deinem Editor
> stehen, formatiert die Kollegin mit anderen Einstellungen alles zurück. Jeder Commit wird dann zum
> riesigen Diff aus Leerzeichen.

## Die Qualitätsschranke

Am Ende steht eine einfache Abmachung: **Code, der eine Prüfung nicht besteht, wird nicht gemergt.** Diese
Abmachung heißt [[quality-gate|Qualitätsschranke]] (englisch *Quality Gate*). Technisch ist das ganz simpel:
Jedes Werkzeug beendet sich mit einem [[exit-code|Exit-Code]]. `0` heißt bestanden, alles andere heißt
durchgefallen – und die CI-Pipeline färbt sich rot.

```bash title="Eine Prüfung in der Kommandozeile"
./vendor/bin/pint --test
echo $?   # 0 = alles sauber, 1 = Stilfehler gefunden
```

Wie genau das funktioniert und wie du die Werkzeuge einrichtest, lernst du in den nächsten Lektionen.

## Zusammenfassung

- Menschen prüfen Regeln langsam und ungleichmäßig – Werkzeuge schnell und immer gleich.
- **Formatter**, **Linter**, **statische Analyse** und **Refactoring-Werkzeuge** lesen Code, ohne ihn auszuführen.
- Je früher ein Fehler auffällt (Editor → Hook → CI → Review), desto billiger ist er.
- Die Regeln liegen als Konfigurationsdateien im Repository und gelten so für alle.
- Eine **Qualitätsschranke** lässt nur Code durch, dessen Prüfungen mit Exit-Code `0` enden.
