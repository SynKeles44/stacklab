---
title: Doku für KI-Assistenten
summary: Mit AGENTS.md und CLAUDE.md gibst du KI-Assistenten ein Onboarding – Befehle, Struktur, Konventionen und Grenzen.
duration: 20
sources:
  - title: AGENTS.md – offenes Format für Anweisungen an Coding-Agenten
    url: https://agents.md/
  - title: Claude Code – Memory und CLAUDE.md
    url: https://code.claude.com/docs/en/memory
quiz:
  - type: single
    question: Wofür ist eine AGENTS.md gedacht?
    options:
      - Sie ersetzt die README für Menschen.
      - Sie gibt KI-Assistenten projektspezifische Anweisungen – Befehle, Konventionen und Grenzen.
      - Sie speichert die Zugangsdaten für KI-Dienste.
      - Sie listet alle Mitwirkenden auf.
    answer: 1
    explanation: >
      Die AGENTS.md ist das Onboarding-Dokument für KI-Assistenten. Menschen lesen weiterhin README und
      CONTRIBUTING; die AGENTS.md ergänzt, was ein Agent zusätzlich wissen muss.
  - type: multiple
    question: Was gehört in eine gute AGENTS.md?
    options:
      - Die genauen Befehle für Tests, Linter und Build.
      - Konventionen, z. B. Commit-Format und Ordnerstruktur.
      - Ein API-Token, damit der Assistent selbst deployen kann.
      - Grenzen, z. B. „Ändere keine Migrationen, die schon ausgeliefert sind.“
    answers: [0, 1, 3]
    explanation: Geheimnisse gehören in keine Datei im Repository – auch nicht in eine, die nur ein KI-Assistent liest.
  - type: find-bug
    question: Welche Zeile dieser AGENTS.md ist ein Problem?
    language: markdown
    code: |
      # AGENTS.md

      ## Befehle

      - Tests: `npm test`
      - Linter: `npm run lint`
      - Deployment-Token: dpl_9f8e7d6c5b4a
    bug_line: 7
    explanation: >
      Ein Token in einer Datei im Repository ist ein Sicherheitsleck – Menschen und Maschinen können es lesen, und es
      bleibt in der Git-Historie. Schreib höchstens, **wo** der Token herkommt (z. B. aus einer Umgebungsvariable).
  - type: cloze
    text: Viele KI-Werkzeuge lesen die Datei ___.md im Hauptordner. Die eigene Anweisungsdatei von Claude Code heißt ___.md.
    blanks:
      - [AGENTS]
      - [CLAUDE]
    explanation: AGENTS.md ist ein offenes Format, das mehrere Werkzeuge unterstützen. CLAUDE.md ist die Datei von Claude Code.
tasks:
  - id: agents-md-schreiben
    type: terminal
    title: Schreibe eine AGENTS.md
    description: |
      Im Ordner `ki-onboarding` liegt ein Projekt mit `package.json`, `src/` und `docs/adr/`. Ein KI-Assistent soll
      darin mitarbeiten. Schreibe ihm ein kurzes Onboarding in `AGENTS.md`:

      1. Schau dir das Projekt an: `cat package.json` und `ls -R src docs`.
      2. `## Befehle`: die Befehle für Tests (`npm test`) und Linter (`npm run lint`) aus der package.json.
      3. `## Projektstruktur`: wofür `src/` und `docs/adr/` da sind.
      4. `## Konventionen`: Commit-Messages nach Conventional Commits.
      5. `## Grenzen`: mindestens eine klare Regel, z. B. dass `.env` nie gelesen oder geändert wird.
      6. Halte die Datei kurz: höchstens 40 Zeilen.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit das Projekt angelegt wird.
    workdir: ki-onboarding
    setup: |
      mkdir -p src docs/adr
      cat > package.json <<'EOF'
      {
        "name": "notizen",
        "private": true,
        "type": "module",
        "scripts": {
          "dev": "node --watch src/server.js",
          "test": "node --test",
          "lint": "eslint ."
        }
      }
      EOF
      printf 'export const notes = []\n' > src/store.js
      printf 'import { notes } from "./store.js"\nconsole.log(notes.length)\n' > src/server.js
      printf '# 1. SQLite als Datenbank\n\n## Status\n\nAkzeptiert\n' > docs/adr/0001-sqlite-als-datenbank.md
      printf 'DB_PASSWORD=<dein-passwort>\n' > .env
    checks:
      - type: file_exists
        path: AGENTS.md
        message: Es gibt noch keine Datei AGENTS.md im Ordner ki-onboarding.
      - type: command
        run: awk '/^## Befehle/{f=1;next} /^## /{f=0} f' AGENTS.md | grep -cE 'npm test|npm run lint'
        stdout_matches: "^([2-9]|[1-9][0-9])$"
        message: "Unter `## Befehle` sollen `npm test` und `npm run lint` stehen."
      - type: command
        run: awk '/^## Projektstruktur/{f=1;next} /^## /{f=0} f' AGENTS.md | grep -cE 'src/?|docs/adr'
        stdout_matches: "^([2-9]|[1-9][0-9])$"
        message: "Unter `## Projektstruktur` soll stehen, wofür `src/` und `docs/adr/` da sind."
      - type: command
        run: awk '/^## Konventionen/{f=1;next} /^## /{f=0} f' AGENTS.md | grep -ci 'conventional commits'
        stdout_matches: "^[1-9]"
        message: "Unter `## Konventionen` fehlt der Hinweis auf Conventional Commits."
      - type: command
        run: awk '/^## Grenzen/{f=1;next} /^## /{f=0} f' AGENTS.md | grep -c '\S'
        stdout_matches: "^[1-9]"
        message: "Unter `## Grenzen` fehlt mindestens eine Regel, z. B. „Lies oder ändere niemals `.env`.“"
      - type: command
        run: wc -l < AGENTS.md
        stdout_matches: "^\\s*([1-9]|[1-3][0-9]|40)\\s*$"
        message: AGENTS.md ist zu lang. Höchstens 40 Zeilen – ein Assistent liest sie bei jeder Aufgabe.
      - type: command
        run: grep -c '<dein-passwort>\|DB_PASSWORD' AGENTS.md || true
        stdout_equals: "0"
        message: Kopiere keine Inhalte aus `.env` in die AGENTS.md – nenne höchstens den Dateinamen.
    hints:
      - "Gliedere die Datei mit vier `##`-Überschriften: Befehle, Projektstruktur, Konventionen, Grenzen."
      - "Befehle als Liste, z. B. `- Tests: npm test`. Kurz und genau ist besser als ausführlich."
      - "Eine gute Grenze: `- Lies oder ändere niemals .env – dort stehen lokale Geheimnisse.`"
    solution: |
      ```bash
      cd ki-onboarding
      cat > AGENTS.md <<'EOF'
      # AGENTS.md

      Notizen-App auf Node.js 24 mit ES-Modulen.

      ## Befehle

      - Entwicklungsserver: `npm run dev`
      - Tests: `npm test`
      - Linter: `npm run lint`

      ## Projektstruktur

      - `src/` – Quellcode, Einstieg ist `src/server.js`
      - `docs/adr/` – Architekturentscheidungen; neue Entscheidungen als nächste Nummer anlegen

      ## Konventionen

      - Commit-Messages nach Conventional Commits, z. B. `fix: handle empty notes`
      - Nach jeder Änderung `npm test` und `npm run lint` ausführen

      ## Grenzen

      - Lies oder ändere niemals `.env` – dort stehen lokale Geheimnisse.
      - Ändere keine akzeptierten ADRs, sondern schlage einen neuen vor.
      EOF
      ```
  - id: wohin-gehoert-das
    type: dragdrop
    title: Wohin gehört diese Information?
    description: Ordne jede Information dem Ort zu, an dem sie am besten aufgehoben ist.
    targets:
      - { id: readme, label: README.md (für Menschen) }
      - { id: agents, label: AGENTS.md (für KI-Assistenten) }
      - { id: nirgends, label: In keine Datei im Repository }
    items:
      - { label: Was das Projekt macht und für wen es gedacht ist, target: readme }
      - { label: Schnellstart mit Screenshot der Oberfläche, target: readme }
      - { label: "„Führe nach jeder Änderung npm test und npm run lint aus.“", target: agents }
      - { label: "„Ändere niemals Dateien in vendor/.“", target: agents }
      - { label: "„Neue API-Endpunkte bekommen immer einen Test in tests/api/.“", target: agents }
      - { label: Das Passwort der Produktionsdatenbank, target: nirgends }
      - { label: Ein persönlicher API-Token für den KI-Dienst, target: nirgends }
    hints:
      - Geheimnisse gehören in Umgebungsvariablen oder einen Secret-Manager – nie in eine Datei im Repository.
---
Du gibst einem [[ki-assistent|KI-Assistenten]] die Aufgabe: „Füge eine Suche hinzu.“ Er schreibt Code – mit
einem anderen Test-Framework als dem, das ihr nutzt, Commit-Messages in einem fremden Format, und nebenbei
ändert er eine Datei, die niemand anfassen sollte. Der Assistent ist nicht dumm. Er kennt dein Projekt nur nicht.
Genau wie ein neues Teammitglied braucht er ein **Onboarding**.

## Warum KI-Assistenten Doku brauchen

Ein KI-Assistent startet bei jeder Sitzung fast ohne Wissen über dein Projekt. Er sieht die Dateien, aber nicht:

- welche Befehle Tests und Linter starten,
- welche Konventionen im Team gelten,
- welche Ordner tabu sind,
- welche Entscheidungen schon getroffen wurden.

Ohne diese Informationen rät er – und Raten führt zu plausibel aussehendem, aber falschem Code. Manche Lücken
füllt er sogar mit erfundenen Details, einer sogenannten [[halluzination|Halluzination]].

> [!MERKSATZ]
> Ein KI-Assistent ist wie ein sehr schnelles neues Teammitglied ohne Gedächtnis. Was er wissen muss, muss
> aufgeschrieben sein.

## AGENTS.md und CLAUDE.md

Für dieses Onboarding gibt es eigene Dateien im Hauptordner des Repositorys:

| Datei | Gelesen von |
|---|---|
| [[agents-md|AGENTS.md]] | Ein offenes Format, das viele Coding-Agenten unterstützen |
| [[claude-md|CLAUDE.md]] | Claude Code – gibt es keine CLAUDE.md, liest Claude Code direkt die AGENTS.md |

Die Werkzeuge laden die Datei automatisch zu Beginn einer Sitzung. In großen Projekten kann es zusätzlich
Dateien in Unterordnern geben, die nur für diesen Bereich gelten.

Damit du nicht zwei Dateien pflegst, schreibst du den Inhalt einmal in die `AGENTS.md`. Brauchst du zusätzlich
eine `CLAUDE.md`, bindet sie die gemeinsame Datei mit der Zeile `@AGENTS.md` ein – darunter stehen nur noch
Anweisungen, die speziell für Claude Code gelten.

## Was hineingehört

Eine gute AGENTS.md ist kurz und konkret. Bewährt haben sich vier Abschnitte:

```markdown title="AGENTS.md"
# AGENTS.md

## Befehle

- Tests: `npm test`
- Linter: `npm run lint`

## Projektstruktur

- `src/` – Quellcode
- `docs/adr/` – Architekturentscheidungen

## Konventionen

- Commit-Messages nach Conventional Commits.
- Neue Funktionen bekommen immer einen Test.

## Grenzen

- Lies oder ändere niemals `.env`.
- Ändere keine Migrationen, die schon ausgeliefert sind.
```

Die **Befehle** sind am wichtigsten: Damit kann der Assistent seine Arbeit selbst prüfen. **Grenzen**
verhindern Schäden, bevor sie passieren.

## Was nicht hineingehört

> [!FEHLER]
> Zugangsdaten in der AGENTS.md, „damit der Assistent selbst deployen kann“. Die Datei liegt im Repository –
> jeder mit Lesezugriff sieht das Geheimnis, und es bleibt für immer in der Git-Historie.

Außerdem schadet:

- **Romane:** Der Assistent liest die Datei bei jeder Aufgabe. Viel Text kostet Zeit und verdrängt Wichtiges.
- **Doppelte Doku:** Verweise auf README, CONTRIBUTING und ADRs, statt sie zu kopieren.
- **Veraltete Befehle:** Ein falscher Testbefehl ist schlimmer als keiner – der Assistent hält ihn für wahr.

Die AGENTS.md ist Doku wie jede andere: Sie liegt im Repository, wird im Pull Request geändert und reviewt.

> [!PRAXIS]
> Wenn ein Assistent denselben Fehler zweimal macht, ergänze eine Zeile in der AGENTS.md. So lernt nicht nur
> eine Sitzung, sondern jede folgende – und nebenbei jedes neue Teammitglied, das die Datei liest.

## Zusammenfassung

- KI-Assistenten brauchen ein **Onboarding** wie neue Teammitglieder.
- **AGENTS.md** ist ein offenes Format, **CLAUDE.md** die Datei für Claude Code.
- Hinein gehören: **Befehle**, **Projektstruktur**, **Konventionen**, **Grenzen**.
- Kurz halten, auf andere Doku verweisen statt sie zu kopieren.
- **Niemals Geheimnisse** – die Datei liegt im Repository.
- Die AGENTS.md wird wie Code im Pull Request gepflegt.
