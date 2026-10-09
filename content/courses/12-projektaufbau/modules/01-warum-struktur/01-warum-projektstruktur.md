---
title: Warum Projektstruktur wichtig ist
summary: Feste Ordner und Dateinamen sind keine Bürokratie, sondern eine gemeinsame Sprache für Menschen und Werkzeuge.
duration: 20
sources:
  - title: Laravel – Directory Structure
    url: https://laravel.com/docs/structure
  - title: Vite – Getting Started (Projektaufbau)
    url: https://vite.dev/guide/
  - title: npm – package.json
    url: https://docs.npmjs.com/cli/configuring-npm/package-json
quiz:
  - type: single
    question: Was ist der wichtigste Grund, warum Projekte festen Konventionen für Ordner folgen?
    options:
      - Weil Git sonst keine Dateien speichern kann.
      - Damit Menschen und Werkzeuge Dateien finden, ohne dass es jemand erklären muss.
      - Weil Programme mit vielen Ordnern schneller laufen.
      - Weil das Betriebssystem bestimmte Ordnernamen vorschreibt.
    answer: 1
    explanation: Konventionen sind eine gemeinsame Absprache. Wer sie kennt, findet sich sofort zurecht – und Werkzeuge wie Vite oder PHPUnit suchen Dateien automatisch an den üblichen Orten.
  - type: multiple
    question: Welche Vorteile bringt eine saubere Projektstruktur?
    options:
      - Neue Teammitglieder sind schneller produktiv.
      - Werkzeuge brauchen weniger Konfiguration.
      - Der Code hat automatisch keine Fehler mehr.
      - Code-Reviews werden einfacher, weil jede Änderung an einem erwartbaren Ort liegt.
    answers: [0, 1, 3]
    explanation: Struktur macht ein Projekt verständlich und wartbar. Fehlerfrei wird der Code dadurch natürlich nicht.
  - type: cloze
    text: Das Prinzip „Konvention vor ___“ bedeutet, dass ein Werkzeug sinnvolle Standards mitbringt und du nur Abweichungen einstellen musst. Der oberste Ordner eines Projekts heißt Projekt___.
    blanks:
      - [Konfiguration, configuration]
      - [wurzel, root]
    explanation: Convention over Configuration spart Einstellungen. Die Projektwurzel ist der Ordner, in dem package.json, README.md und Co. liegen.
  - type: match
    question: Ordne jedem Ordnernamen seine übliche Bedeutung zu.
    pairs:
      - { left: "src/", right: "Quellcode des Projekts" }
      - { left: "tests/", right: "Automatische Tests" }
      - { left: "docs/", right: "Ausführliche Dokumentation" }
      - { left: "dist/", right: "Vom Build erzeugte Dateien" }
    explanation: Diese Namen haben sich über viele Sprachen und Frameworks hinweg durchgesetzt. Du begegnest ihnen ständig.
tasks:
  - id: geruest-anlegen
    type: terminal
    title: Ein Projektgerüst von Hand anlegen
    description: |
      Du legst das Grundgerüst für ein kleines Projekt namens `notiz-app` an – ganz ohne Generator,
      nur mit `mkdir` und `touch`. Der Ordner `geruest` ist leer vorbereitet.

      1. Lege die Ordner `src`, `tests` und `docs` an.
      2. Lege in `src` die Datei `main.js` an und in `tests` die Datei `main.test.js`.
      3. Lege in der Projektwurzel eine `README.md` an, deren erste Zeile die Überschrift `# notiz-app` ist.
      4. Prüfe dein Ergebnis mit `tree` oder `ls -R`.
    workdir: geruest
    checks:
      - type: dir_exists
        path: src
        message: Der Ordner src fehlt noch (mkdir src).
      - type: dir_exists
        path: tests
        message: Der Ordner tests fehlt noch.
      - type: dir_exists
        path: docs
        message: Der Ordner docs fehlt noch.
      - type: file_exists
        path: src/main.js
        message: Lege die Datei src/main.js an (touch src/main.js).
      - type: file_exists
        path: tests/main.test.js
        message: Lege die Datei tests/main.test.js an.
      - type: file_contains
        path: README.md
        pattern: "^#\\s+notiz-app\\s*$"
        message: "README.md braucht die Überschrift # notiz-app in einer eigenen Zeile."
      - type: file_absent
        path: src/README.md
        message: Die README gehört in die Projektwurzel, nicht nach src.
    hints:
      - "`mkdir src tests docs` legt alle drei Ordner auf einmal an."
      - "`touch src/main.js tests/main.test.js` erzeugt leere Dateien."
      - "`echo \"# notiz-app\" > README.md` schreibt die Überschrift in die README."
    solution: |
      ```bash
      cd geruest
      mkdir src tests docs
      touch src/main.js tests/main.test.js
      echo "# notiz-app" > README.md
      tree
      ```
  - id: fremdes-projekt-erkunden
    type: steps
    title: Ein fremdes Projekt erkunden
    description: Du hast gerade ein unbekanntes Projekt geklont. Entscheide Schritt für Schritt, wie du vorgehst.
    steps:
      - situation: Du öffnest den Projektordner zum ersten Mal und siehst 20 Dateien und Ordner.
        question: Was liest du zuerst?
        options: [Die README.md, Die größte Datei in src/, Den Ordner node_modules/]
        answer: 0
        explanation: Die README ist die Eingangstür. Sie erklärt Zweck, Voraussetzungen und Start des Projekts.
      - situation: In der Wurzel liegen `package.json` und `composer.json`.
        question: Was verrät dir das?
        options: [Das Projekt nutzt JavaScript und PHP, Das Projekt ist kaputt, Das Projekt nutzt nur Python]
        answer: 0
        explanation: package.json ist das Manifest für JavaScript-Projekte, composer.json das für PHP. Beide zusammen deuten auf ein Full-Stack-Projekt hin.
      - situation: Du willst wissen, wie man das Projekt startet und testet.
        question: Wo schaust du nach?
        options: [Im Bereich scripts von package.json oder im Makefile, In der Datei .gitignore, Im Ordner dist/]
        answer: 0
        explanation: Skripte und Makefile-Targets sind die Bedienoberfläche eines Projekts. Dort stehen Befehle wie dev, build und test.
---
Stell dir eine Küche vor, in der jeden Tag jemand anderes kocht. Wenn Messer, Töpfe und Gewürze
jeden Tag woanders liegen, verbringt jede Person die Hälfte der Zeit mit Suchen. Genau so fühlt sich
ein Software-Projekt ohne klare Struktur an.

## Ein Projekt ist mehr als Code

Ein Software-Projekt besteht nicht nur aus [[quellcode|Quellcode]]. Dazu gehören auch Tests,
Einstellungen für Werkzeuge, Dokumentation, eine Liste der verwendeten [[abhaengigkeit|Abhängigkeiten]]
und vieles mehr. Schnell kommen so Hunderte [[datei|Dateien]] zusammen.

Die [[projektstruktur|Projektstruktur]] legt fest, **wo** welche Datei liegt und **wie** sie heißt.
Sie beantwortet Fragen wie:

- Wo steht der eigentliche Code?
- Wo liegen die Tests?
- Welche Dateien steuern Werkzeuge wie den [[linter|Linter]] oder den Test-Runner?
- Welche Dateien werden automatisch erzeugt und gehören nicht ins [[repository|Repository]]?

> [!MERKSATZ]
> Eine gute Projektstruktur beantwortet die Frage „Wo gehört das hin?“, bevor jemand sie stellen muss.

## Konventionen: eine gemeinsame Sprache

Eine [[konvention|Konvention]] ist eine Absprache, an die sich (fast) alle halten. Niemand zwingt dich,
deinen Code in `src/` abzulegen. Aber fast jedes JavaScript-Projekt tut es – und deshalb weiß jede
Entwicklerin sofort, wo sie suchen muss.

| Name | Bedeutung | Typisch in |
|---|---|---|
| `src/` | Quellcode (*source*) | JavaScript, TypeScript |
| `app/` | Anwendungscode | Laravel |
| `tests/` | Automatische Tests | fast überall |
| `docs/` | Ausführliche Dokumentation | fast überall |
| `public/` | Dateien, die der Browser direkt abrufen darf | Laravel, Vite |
| `dist/` | Ergebnis des Builds (*distribution*) | JavaScript, TypeScript |

Konventionen sparen Gespräche. Statt „Wo liegen bei euch die Tests?“ zu fragen, schaust du einfach
in `tests/`.

## Konvention vor Konfiguration

Viele Werkzeuge nutzen Konventionen aktiv. Das Prinzip heißt [[konvention-vor-konfiguration|Konvention vor Konfiguration]]:
Das Werkzeug bringt sinnvolle Standards mit, und du stellst nur ein, was davon abweicht.

Ein paar Beispiele:

- Der [[dev-server|Dev-Server]] von [[vite|Vite]] sucht die Startseite automatisch als `index.html`
  in der [[projektwurzel|Projektwurzel]].
- [[laravel|Laravel]] lädt Routen aus `routes/web.php`, ohne dass du das irgendwo eintragen musst.
- [[npm]] liest Projektinformationen immer aus `package.json`.

```bash title="Vite findet index.html von selbst"
npm run dev
#  VITE ready
#  ➜  Local:   http://localhost:5173/
```

Hältst du dich an die Konvention, funktioniert alles ohne Zusatzaufwand. Weichst du ab, musst du es
dem Werkzeug ausdrücklich sagen – und jedem Menschen im Team auch.

> [!FEHLER]
> **Eigene Ordnernamen erfinden.** `meinCode/` statt `src/` oder `pruefungen/` statt `tests/` wirkt
> harmlos. Doch jedes Werkzeug braucht dann Extra-Einstellungen, und Neue im Team suchen vergeblich.
> Nutze die Namen, die dein Framework vorgibt.

## Was eine gute Struktur bringt

Struktur ist kein Selbstzweck. Sie zahlt sich in vier Situationen aus:

1. **Einarbeitung:** Neue Teammitglieder finden sich in Stunden statt Tagen zurecht.
2. **Code-Review:** Wer eine Änderung prüft, erwartet Tests in `tests/` und Routen in `routes/`.
   Liegt etwas woanders, fällt es sofort auf.
3. **Werkzeuge:** Test-Runner, Linter und Build-Tools finden Dateien ohne lange Konfiguration.
4. **Automatisierung:** Eine [[ci-pipeline|CI-Pipeline]] kann sich auf feste Pfade verlassen,
   etwa „führe alle Tests in `tests/` aus“.

> [!PRAXIS]
> In vielen Teams ist die erste Aufgabe für Neue: „Bring das Projekt lokal zum Laufen.“ In einem gut
> strukturierten Projekt reichen dafür die README und zwei, drei Befehle. In einem chaotischen Projekt
> dauert es Tage – und kostet Kolleginnen viele Erklärungen.

## Die Projektwurzel lesen lernen

Die Projektwurzel ist der oberste Ordner eines Projekts. Dort liegen die wichtigsten Wegweiser.
Schon ein `ls -a` verrät dir viel:

```bash title="Ein typisches Full-Stack-Projekt"
ls -a
# .  ..  .editorconfig  .env.example  .gitignore  Makefile  README.md
# backend  docs  frontend  package.json
```

Daraus kannst du ablesen: Es gibt eine README (lesen!), ein `Makefile` mit Befehlen, eine
Vorlage für Umgebungsvariablen, einen Frontend- und einen Backend-Teil. Ohne eine Zeile Code
geöffnet zu haben, kennst du schon den groben Aufbau.

In den nächsten Lektionen lernst du jede dieser Dateiarten genau kennen.

## Zusammenfassung

- Ein Projekt besteht aus Code, Tests, Konfiguration, Dokumentation und erzeugten Dateien.
- Die Projektstruktur legt fest, wo welche Datei liegt und wie sie heißt.
- Konventionen wie `src/`, `tests/` und `docs/` sind eine gemeinsame Sprache im Team.
- „Konvention vor Konfiguration“: Werkzeuge finden Dateien an den üblichen Orten von selbst.
- Gute Struktur beschleunigt Einarbeitung, Code-Reviews, Werkzeuge und Automatisierung.
- Die Projektwurzel mit README, Manifesten und Konfigurationsdateien ist dein Wegweiser.
