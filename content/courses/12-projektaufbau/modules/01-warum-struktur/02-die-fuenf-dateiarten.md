---
title: Die fünf Dateiarten in einem Projekt
summary: Quellcode, Konfiguration, Dokumentation, generierte und geheime Dateien – wer sie unterscheiden kann, versteht jedes Projekt schneller.
duration: 20
sources:
  - title: Git – gitignore
    url: https://git-scm.com/docs/gitignore
  - title: npm – Folders (node_modules)
    url: https://docs.npmjs.com/cli/configuring-npm/folders
  - title: Laravel – Directory Structure
    url: https://laravel.com/docs/structure
quiz:
  - type: single
    question: Zu welcher Dateiart gehört der Ordner `node_modules/`?
    options: [Quellcode, Konfiguration, Generiert, Dokumentation]
    answer: 2
    explanation: node_modules/ wird von npm aus package.json und dem Lockfile erzeugt. Du kannst ihn jederzeit löschen und neu installieren.
  - type: multiple
    question: Welche Dateien gehören ins Repository?
    options: [tsconfig.json, .env, README.md, dist/app.js, src/main.ts]
    answers: [0, 2, 4]
    explanation: Konfiguration, Dokumentation und Quellcode werden committet. .env enthält Geheimnisse, dist/ wird beim Build erzeugt – beides bleibt draußen.
  - type: match
    question: Ordne jede Datei ihrer Dateiart zu.
    pairs:
      - { left: "app/Models/User.php", right: "Quellcode" }
      - { left: "phpstan.neon", right: "Konfiguration" }
      - { left: "docs/architektur.md", right: "Dokumentation" }
      - { left: "vendor/", right: "Generiert" }
      - { left: ".env", right: "Geheim" }
    explanation: Die Dateiart entscheidet, ob eine Datei committet, ignoriert oder besonders geschützt wird.
  - type: cloze
    text: Generierte Dateien kannst du jederzeit löschen, weil ein Werkzeug sie aus der ___ neu erzeugen kann. Dateien, die mit einem Punkt beginnen, sind unter Linux ___.
    blanks:
      - [Quelle, Quelldatei, Quelldateien, Konfiguration]
      - [versteckt, unsichtbar]
    explanation: Was aus einer Quelle entsteht, ist reproduzierbar. Dateien wie .gitignore oder .env zeigt ls erst mit der Option -a.
tasks:
  - id: dateiarten-sortieren
    type: dragdrop
    title: Sortiere die Dateien nach Art
    description: Ziehe jede Datei aus einem typischen Full-Stack-Projekt in die passende Kategorie.
    targets:
      - { id: quellcode, label: Quellcode }
      - { id: konfiguration, label: Konfiguration }
      - { id: doku, label: Dokumentation }
      - { id: generiert, label: Generiert }
      - { id: geheim, label: Geheim }
    items:
      - { label: src/App.tsx, target: quellcode }
      - { label: routes/web.php, target: quellcode }
      - { label: vite.config.ts, target: konfiguration }
      - { label: composer.json, target: konfiguration }
      - { label: .gitignore, target: konfiguration }
      - { label: README.md, target: doku }
      - { label: CHANGELOG.md, target: doku }
      - { label: node_modules/, target: generiert }
      - { label: dist/, target: generiert }
      - { label: .env, target: geheim }
  - id: landkarte-beschriften
    type: diagram
    title: Beschrifte die Landkarte
    description: Die Farben links zeigen, welche Datei zu welcher Art gehört. Setze die fünf Dateiarten in die passenden Kästen rechts.
    image: /assets/projektaufbau/projekt-landkarte-leer.svg
    slots:
      - { x: 60, y: 23, answer: Quellcode }
      - { x: 60, y: 38, answer: Konfiguration }
      - { x: 60, y: 53, answer: Dokumentation }
      - { x: 60, y: 68, answer: Generiert }
      - { x: 60, y: 83, answer: Geheim }
    distractors: [Datenbank, Cache]
    hints:
      - Die rote Farbe markiert die Datei .env.
---
Wenn du ein Projekt zum ersten Mal öffnest, wirken die vielen Dateien wie ein Durcheinander. Mit einem
einfachen Trick wird daraus Ordnung: Jede Datei gehört zu einer von **fünf Arten**. Kennst du die Art,
weißt du sofort, wie du mit der Datei umgehen musst.

![Die fünf Dateiarten: Quellcode, Konfiguration, Dokumentation, Generiert, Geheim](/assets/projektaufbau/projekt-landkarte.svg)

## 1. Quellcode

[[quellcode|Quellcode]] ist alles, was Menschen schreiben, damit das Programm etwas tut: PHP-Klassen,
React-[[komponente|Komponenten]], Tests, CSS. Er liegt in Ordnern wie `src/`, `app/`, `resources/`
oder `tests/`.

```text title="Typischer Quellcode"
src/App.tsx
src/components/Button.tsx
app/Models/User.php
tests/Feature/LoginTest.php
```

Quellcode ist das Herz des Projekts. Er wird immer committet und im Code-Review geprüft.

## 2. Konfiguration

Eine [[konfigurationsdatei|Konfigurationsdatei]] steuert ein Werkzeug, statt selbst Programmlogik zu
enthalten. Sie liegt fast immer in der [[projektwurzel|Projektwurzel]].

| Datei | Steuert |
|---|---|
| `package.json` | Name, Abhängigkeiten und Skripte eines JavaScript-Projekts |
| `composer.json` | dasselbe für PHP |
| `tsconfig.json` | den TypeScript-Compiler |
| `vite.config.ts` | den Build mit Vite |
| `.gitignore` | welche Dateien Git ignoriert |
| `.env.example` | welche Umgebungsvariablen es gibt |

Konfiguration wird committet, denn alle im Team sollen dieselben Einstellungen nutzen.

> [!MERKSATZ]
> Quellcode sagt, **was** das Programm tut. Konfiguration sagt, **wie** die Werkzeuge damit umgehen.

## 3. Dokumentation

Dokumentation erklärt das Projekt für Menschen: [[readme|README]], `CHANGELOG.md`, `CONTRIBUTING.md`
und ausführliche Texte im Ordner `docs/`. Sie wird committet, damit sie mit dem Code zusammen wächst.

Die README ist dabei die wichtigste Datei überhaupt. Sie ist die Eingangstür für alle, die das
Projekt zum ersten Mal sehen. Ihr widmen wir später eine ganze Lektion.

## 4. Generierte Dateien

Eine [[generierte-datei|generierte Datei]] erzeugt ein Werkzeug automatisch – aus deinem Quellcode
oder deiner Konfiguration. Du schreibst sie nie von Hand.

| Ordner | Erzeugt von | Aus |
|---|---|---|
| `node_modules/` | npm | `package.json` + Lockfile |
| `vendor/` | Composer | `composer.json` + `composer.lock` |
| `dist/` oder `build/` | Vite, TypeScript | deinem Quellcode |
| `storage/logs/` | Laravel | Laufzeit |

Generierte Dateien gehören **nicht** ins Repository. Sie sind oft riesig, ändern sich ständig und
lassen sich jederzeit neu erzeugen.

> [!FEHLER]
> **Generierte Dateien von Hand ändern.** Wer eine Datei in `node_modules/` oder `dist/` „schnell
> repariert“, verliert die Änderung beim nächsten `npm install` oder Build. Ändere immer die Quelle.

## 5. Geheime Dateien

Die gefährlichste Art: Dateien mit Passwörtern, API-Schlüsseln oder Tokens. Das wichtigste Beispiel
ist die [[env-datei|.env-Datei]]. Sie enthält die echten Werte für genau einen Rechner.

```bash title=".env – niemals committen"
DB_PASSWORD=<dein-passwort>
MAIL_API_KEY=<dein-token>
```

Geheime Dateien werden **nie** committet. Stattdessen gibt es eine Vorlage ohne echte Werte – die
`.env.example`. Mehr dazu im letzten Modul.

> [!PRAXIS]
> Viele Dateien dieser Liste beginnen mit einem Punkt, etwa `.env` oder `.gitignore`. Das sind
> [[versteckte-datei|versteckte Dateien]]. Gewöhne dir an, ein fremdes Projekt mit `ls -a` statt `ls`
> anzuschauen – sonst übersiehst du genau die Dateien, die am meisten über das Projekt verraten.

## Zusammenfassung

- **Quellcode**: von Menschen geschrieben, z. B. in `src/`, `app/`, `tests/` – wird committet.
- **Konfiguration**: steuert Werkzeuge, z. B. `package.json`, `tsconfig.json` – wird committet.
- **Dokumentation**: README, Changelog, `docs/` – wird committet.
- **Generiert**: `node_modules/`, `vendor/`, `dist/` – wird ignoriert und neu erzeugt.
- **Geheim**: `.env` mit Passwörtern – wird nie committet, nur die Vorlage `.env.example`.
- Mit `ls -a` siehst du auch versteckte Dateien.
