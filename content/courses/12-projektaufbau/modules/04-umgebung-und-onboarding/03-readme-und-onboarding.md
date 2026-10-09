---
title: README und Onboarding
summary: Was eine gute README enthält und wie neue Teammitglieder ein Projekt in wenigen Minuten zum Laufen bringen.
duration: 20
sources:
  - title: GitHub Docs – About READMEs
    url: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes
  - title: GitHub Docs – Basic writing and formatting syntax
    url: https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax
  - title: Make a README
    url: https://www.makeareadme.com/
quiz:
  - type: multiple
    question: Welche Abschnitte gehören in fast jede README?
    options:
      - Was das Projekt tut
      - Voraussetzungen und Installation
      - Die Passwörter für die Produktionsdatenbank
      - Wie man startet und testet
    answers: [0, 1, 3]
    explanation: Die README erklärt Zweck, Einrichtung und Bedienung. Geheimnisse haben dort – wie überall im Repository – nichts zu suchen.
  - type: single
    question: Woran erkennst du eine gute Installationsanleitung?
    options:
      - Sie ist möglichst lang und erklärt jedes Werkzeug ausführlich.
      - Man kann die Befehle der Reihe nach kopieren, und am Ende läuft das Projekt.
      - Sie verweist nur auf eine Kollegin, die es erklären kann.
      - Sie steht in einer separaten Word-Datei.
    answer: 1
    explanation: Der beste Test ist ein frischer Rechner. Funktioniert die Anleitung Schritt für Schritt ohne Nachfragen, ist sie gut.
  - type: cloze
    text: GitHub zeigt die Datei ___.md automatisch auf der Startseite eines Repositorys an. Überschriften der zweiten Ebene schreibst du in Markdown mit ___.
    blanks:
      - [README]
      - ["##", "## "]
    explanation: Die README ist das Aushängeschild. Mit ## gliederst du sie in Abschnitte.
  - type: find-bug
    question: Neue Teammitglieder scheitern an dieser Anleitung. In welcher Zeile fehlt ein Schritt?
    language: bash
    code: |
      git clone https://github.com/example/notizen.git
      cd notizen
      composer install
      php artisan key:generate
      php artisan serve
    bug_line: 4
    explanation: Vor key:generate muss die .env existieren – also zuerst cp .env.example .env. Sonst gibt es keine Datei, in die Laravel den Schlüssel schreiben kann.
tasks:
  - id: readme-schreiben
    type: terminal
    title: Eine README für das Team schreiben
    description: |
      Im Ordner `readme` liegt ein kleines Full-Stack-Projekt mit `Makefile`, `.env.example`,
      `frontend/` und `backend/` – aber ohne README. Schau dir zuerst mit `cat Makefile` an, welche
      Targets es gibt. Schreibe dann eine `README.md` mit:

      1. einer Überschrift `# notizen` in der ersten Zeile und darunter einem Satz, was das Projekt tut,
      2. einem Abschnitt `## Voraussetzungen`, in dem Node.js und PHP genannt werden,
      3. einem Abschnitt `## Einrichtung` mit den Befehlen zum Starten (mindestens `make setup`),
      4. einem Abschnitt `## Tests`, der erklärt, wie man testet (`make test`),
      5. einem Abschnitt `## Projektstruktur`, der `frontend/` und `backend/` kurz erklärt.

      Jeder `make`-Befehl, den du nennst, muss im Makefile existieren. Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: readme
    setup: |
      mkdir -p frontend/src backend/app docs
      printf 'APP_NAME=notizen\nDB_PASSWORD=\n' > .env.example
      printf '.PHONY: setup dev test\n\nsetup:\n\ttest -f .env || cp .env.example .env\n\t@echo "Abhängigkeiten installieren …"\n\ndev:\n\t@echo "Starte Frontend und Backend …"\n\ntest:\n\t@echo "Tests laufen …"\n' > Makefile
    checks:
      - type: command
        run: head -n 1 README.md
        stdout_matches: "^#\\s+notizen\\s*$"
        message: "Die erste Zeile der README.md soll # notizen lauten."
      - type: command
        run: sed -n '2,6p' README.md | grep -E '[A-Za-zÄÖÜäöü]{3,}'
        message: Schreibe direkt unter die Überschrift einen Satz, was das Projekt tut.
      - type: file_contains
        path: README.md
        pattern: "^##\\s+Voraussetzungen"
        message: Es fehlt der Abschnitt ## Voraussetzungen.
      - type: command
        run: grep -qi 'node' README.md && grep -qi 'php' README.md
        message: Nenne unter Voraussetzungen Node.js und PHP.
      - type: file_contains
        path: README.md
        pattern: "^##\\s+Einrichtung"
        message: Es fehlt der Abschnitt ## Einrichtung.
      - type: file_contains
        path: README.md
        pattern: "make setup"
        message: Erkläre in der Einrichtung den Befehl make setup.
      - type: file_contains
        path: README.md
        pattern: "^##\\s+Tests"
        message: Es fehlt der Abschnitt ## Tests.
      - type: file_contains
        path: README.md
        pattern: "^##\\s+Projektstruktur"
        message: Es fehlt der Abschnitt ## Projektstruktur.
      - type: command
        run: grep -q 'frontend/' README.md && grep -q 'backend/' README.md
        message: Erkläre unter Projektstruktur die Ordner frontend/ und backend/.
      - type: command
        run: for t in $(grep -oE 'make [a-z][a-z-]*' README.md | awk '{print $2}' | sort -u); do make -n "$t" >/dev/null 2>&1 || { echo "make $t gibt es nicht"; exit 1; }; done
        message: Die README nennt einen make-Befehl, den es im Makefile nicht gibt.
    hints:
      - Schreibe die README mit `nano README.md` – Markdown-Überschriften beginnen mit `#` bzw. `##`.
      - Befehle stellst du in einem Code-Block dar, der mit drei Backticks und `bash` beginnt.
      - "`make -n setup` zeigt, was ein Target tun würde, ohne es auszuführen – so prüfst du, ob es existiert."
    solution: |
      ````bash
      cd readme
      cat > README.md <<'EOF'
      # notizen

      Eine kleine Notiz-App mit React-Frontend und Laravel-Backend.

      ## Voraussetzungen

      - Node.js 24 und npm
      - PHP 8.5 und Composer

      ## Einrichtung

      ```bash
      make setup   # legt .env an und installiert Abhängigkeiten
      make dev     # startet Frontend und Backend
      ```

      ## Tests

      ```bash
      make test
      ```

      ## Projektstruktur

      - `frontend/` – React-Anwendung (Vite)
      - `backend/` – Laravel-API
      - `docs/` – weitere Dokumentation
      EOF
      ````
  - id: erster-tag
    type: order
    title: Dein erster Tag im Projekt
    description: Bringe die Schritte, mit denen du ein neues Projekt lokal zum Laufen bringst, in die richtige Reihenfolge.
    items:
      - Repository klonen
      - README lesen
      - Voraussetzungen installieren (z. B. Node.js und PHP in der passenden Version)
      - .env.example nach .env kopieren und eigene Werte eintragen
      - Abhängigkeiten installieren (make setup)
      - Tests ausführen, um zu sehen, dass alles funktioniert
      - Dev-Server starten und die Anwendung im Browser öffnen
---
Deine neue Kollegin startet am Montag. Wie lange braucht sie, bis das Projekt auf ihrem Laptop läuft?
In einem gut vorbereiteten Projekt: eine halbe Stunde. In einem schlecht vorbereiteten: zwei Tage
und viele Fragen. Der Unterschied steckt fast immer in einer Datei – der README.

## Die README ist die Eingangstür

Die [[readme|README]] liegt in der [[projektwurzel|Projektwurzel]] und heißt meist `README.md`.
GitHub und andere Plattformen zeigen sie automatisch auf der Startseite des Repositorys an. Sie ist
in [[markdown|Markdown]] geschrieben.

Eine gute README beantwortet die Fragen, die jeder Neue stellt – in dieser Reihenfolge:

| Frage | Abschnitt |
|---|---|
| Was ist das? | Titel und ein, zwei Sätze Beschreibung |
| Was brauche ich? | Voraussetzungen (Werkzeuge und Versionen) |
| Wie starte ich es? | Einrichtung, Schritt für Schritt |
| Wie arbeite ich damit? | wichtige Befehle: Dev-Server, Tests, Linter |
| Wo finde ich was? | Projektstruktur |
| Wo erfahre ich mehr? | Links nach `docs/`, Ansprechpartner, Mitmachen |

> [!MERKSATZ]
> Die README ist für Menschen, die das Projekt **noch nicht kennen**. Schreibe sie für dich selbst an
> deinem ersten Tag.

## Ein Beispiel

```markdown title="README.md"
# notizen

Eine kleine Notiz-App mit React-Frontend und Laravel-Backend.

## Voraussetzungen

- Node.js 24 und npm
- PHP 8.5 und Composer

## Einrichtung

    git clone https://github.com/example/notizen.git
    cd notizen
    make setup      # legt .env an, installiert alles
    make dev        # startet Frontend und Backend

## Tests

    make test

## Projektstruktur

- `frontend/` – React-Anwendung (Vite)
- `backend/` – Laravel-API
- `docs/` – Architektur und Entscheidungen
```

Neben der README gibt es weitere Standarddateien in der Wurzel, die Plattformen wie GitHub erkennen:
`CONTRIBUTING.md` erklärt, wie man mitarbeitet, `CHANGELOG.md` listet Änderungen pro Version, und
`LICENSE` legt fest, wer den Code wie nutzen darf.

Die Befehle stehen so da, dass man sie der Reihe nach kopieren kann. Lange Erklärungen wandern nach
`docs/`, die README verlinkt nur dorthin.

## Onboarding: vom Klonen zum ersten Commit

[[onboarding|Onboarding]] heißt, neue Teammitglieder arbeitsfähig zu machen. Ein gut aufgebautes
Projekt nimmt ihnen dabei fast alles ab:

1. **Klonen** und die README lesen.
2. **Voraussetzungen** installieren – idealerweise mit festgelegten Versionen.
3. `.env.example` nach `.env` kopieren (oft erledigt das `make setup`).
4. Abhängigkeiten **reproduzierbar** installieren (`npm ci`, `composer install`).
5. **Tests** laufen lassen: Grün heißt, die Einrichtung hat geklappt.
6. Dev-Server starten und loslegen.

Alles, was du in diesem Kurs gelernt hast, zahlt hier ein: klare Struktur, Lockfiles, `.env.example`
und Skripte als Bedienoberfläche.

> [!FEHLER]
> **Eine README, die nicht mehr stimmt.** Ein umbenanntes Skript, ein vergessener Schritt – und schon
> scheitert die Anleitung. Ändert sich die Einrichtung, gehört die Anpassung der README in denselben
> Commit.

## Die README prüfen

Der ehrlichste Test für eine Anleitung: Folge ihr selbst in einem frischen Ordner, ohne Vorwissen
einzusetzen. Jede Stelle, an der du improvisieren musst, ist eine Lücke.

```bash title="Ein frischer Test"
git clone https://github.com/example/notizen.git notizen-test
cd notizen-test
make setup && make test
```

> [!PRAXIS]
> Viele Teams lassen jede neue Kollegin die README beim Onboarding verbessern. Wer gerade erst
> angefangen hat, sieht Lücken am besten – und der erste Pull Request ist gleich ein nützlicher.

## Zusammenfassung

- Die README ist die Eingangstür jedes Projekts und liegt in der Projektwurzel.
- Sie erklärt: Was ist das, was brauche ich, wie starte ich, wie teste ich, wo finde ich was.
- Befehle stehen kopierbar und in der richtigen Reihenfolge da.
- Ausführliches gehört nach `docs/`, die README verlinkt dorthin.
- Gutes Onboarding baut auf Struktur, Lockfiles, `.env.example` und Skripten auf.
- Änderungen an der Einrichtung und an der README gehören in denselben Commit.
