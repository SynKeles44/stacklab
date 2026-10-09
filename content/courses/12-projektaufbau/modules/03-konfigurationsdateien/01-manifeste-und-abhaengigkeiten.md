---
title: package.json, composer.json und Lockfiles
summary: Die Manifeste eines Projekts lesen, Laufzeit- von Entwicklungsabhängigkeiten trennen und mit Lockfiles reproduzierbar installieren.
duration: 25
sources:
  - title: npm – package.json
    url: https://docs.npmjs.com/cli/configuring-npm/package-json
  - title: npm – npm ci
    url: https://docs.npmjs.com/cli/commands/npm-ci
  - title: Composer – The composer.json schema
    url: https://getcomposer.org/doc/04-schema.md
  - title: Composer – Basic usage (composer.lock)
    url: https://getcomposer.org/doc/01-basic-usage.md
quiz:
  - type: single
    question: Wohin gehört das Test-Werkzeug `vitest` in der package.json?
    options: [dependencies, devDependencies, scripts, workspaces]
    answer: 1
    explanation: Tests laufen nur während der Entwicklung und in der CI. Die ausgelieferte Anwendung braucht vitest nicht.
  - type: match
    question: Ordne die Begriffe aus npm und Composer einander zu.
    pairs:
      - { left: "dependencies", right: "require" }
      - { left: "devDependencies", right: "require-dev" }
      - { left: "package-lock.json", right: "composer.lock" }
      - { left: "node_modules/", right: "vendor/" }
    explanation: Beide Paketmanager folgen demselben Prinzip, nur die Namen unterscheiden sich.
  - type: multiple
    question: Welche Aussagen über Lockfiles stimmen?
    options:
      - Sie halten die exakte Version jeder installierten Abhängigkeit fest.
      - In einer Anwendung werden sie committet.
      - Man bearbeitet sie regelmäßig von Hand.
      - npm ci installiert genau die Versionen aus dem Lockfile.
    answers: [0, 1, 3]
    explanation: Lockfiles schreibt der Paketmanager. Sie sorgen dafür, dass alle Rechner exakt dieselben Versionen installieren.
  - type: cloze
    text: Für eine Produktions-Installation ohne Entwicklungswerkzeuge nutzt du `npm ci --omit=___` bzw. `composer install --no-___`.
    blanks:
      - [dev]
      - [dev]
    explanation: Beide Befehle lassen devDependencies bzw. require-dev weg. Das macht die Installation auf dem Server kleiner und sicherer.
tasks:
  - id: abhaengigkeiten-sortieren
    type: terminal
    title: Abhängigkeiten richtig einsortieren
    description: |
      Im Ordner `abhaengigkeiten` liegt eine `package.json`, in der **alle** Pakete unter
      `dependencies` stehen. Das ist falsch: `typescript`, `vitest` und `eslint` werden nur beim
      Entwickeln gebraucht.

      1. Lies die Datei mit `jq . package.json`.
      2. Verschiebe `typescript`, `vitest` und `eslint` samt Versionsangabe nach `devDependencies`.
      3. `react`, `react-dom` und `zod` bleiben unter `dependencies`.

      Du musst nichts installieren – es geht nur um die Datei. Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: abhaengigkeiten
    setup: |
      cat > package.json <<'JSON'
      {
        "name": "shop-frontend",
        "version": "1.0.0",
        "private": true,
        "dependencies": {
          "eslint": "^9.0.0",
          "react": "^19.2.0",
          "react-dom": "^19.2.0",
          "typescript": "^6.0.0",
          "vitest": "^4.0.0",
          "zod": "^4.1.0"
        }
      }
      JSON
    checks:
      - type: command
        run: jq -r '.dependencies | keys | join(" ")' package.json
        stdout_equals: react react-dom zod
        message: Unter dependencies sollen nur noch react, react-dom und zod stehen.
      - type: command
        run: jq -r '.devDependencies | keys | join(" ")' package.json
        stdout_equals: eslint typescript vitest
        message: Unter devDependencies sollen eslint, typescript und vitest stehen.
      - type: command
        run: jq -r '.devDependencies.typescript' package.json
        stdout_equals: ^6.0.0
        message: Übernimm die Versionsangaben unverändert (typescript ^6.0.0).
    hints:
      - Du kannst die Datei mit `nano package.json` bearbeiten – achte auf Kommas und Klammern.
      - "`npm pkg get dependencies.vitest` liest einen Wert, `npm pkg set devDependencies.vitest=^4.0.0` schreibt ihn."
      - "`npm pkg delete dependencies.vitest` entfernt den alten Eintrag."
    solution: |
      ```bash
      cd abhaengigkeiten
      npm pkg set devDependencies.typescript=^6.0.0 devDependencies.vitest=^4.0.0 devDependencies.eslint=^9.0.0
      npm pkg delete dependencies.typescript dependencies.vitest dependencies.eslint
      jq . package.json
      ```
  - id: laufzeit-oder-entwicklung
    type: dragdrop
    title: Laufzeit oder Entwicklung?
    description: Entscheide für jedes Paket, ob die laufende Anwendung es braucht oder nur die Entwicklung.
    targets:
      - { id: runtime, label: "Laufzeit (dependencies / require)" }
      - { id: dev, label: "Entwicklung (devDependencies / require-dev)" }
    items:
      - { label: react, target: runtime }
      - { label: laravel/framework, target: runtime }
      - { label: zod, target: runtime }
      - { label: phpunit/phpunit, target: dev }
      - { label: phpstan/phpstan, target: dev }
      - { label: typescript, target: dev }
      - { label: vite, target: dev }
      - { label: laravel/pint, target: dev }
---
Jedes Projekt braucht fremden Code: React, Laravel, ein Test-Framework. Damit alle im Team dieselben
Pakete in denselben Versionen bekommen, schreibt man sie in eine Datei – das **Manifest**. In
JavaScript heißt es `package.json`, in PHP `composer.json`.

## Das Manifest: package.json

Die [[package-json|package.json]] beschreibt ein JavaScript-Projekt. Die wichtigsten Felder:

```json title="package.json"
{
  "name": "shop-frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build"
  },
  "dependencies": { "react": "^19.2.0" },
  "devDependencies": { "vite": "^8.0.0" }
}
```

| Feld | Bedeutung |
|---|---|
| `name`, `version` | Name und Version des Projekts |
| `private` | verhindert versehentliches Veröffentlichen |
| `type` | `module` = Dateien nutzen `import`/`export` |
| `scripts` | Befehle für `npm run` – Thema der übernächsten Lektion |
| `dependencies` | Pakete, die die Anwendung zur Laufzeit braucht |
| `devDependencies` | Pakete nur für die Entwicklung |

## Das PHP-Gegenstück: composer.json

[[composer|Composer]] liest die [[composer-json|composer.json]]. Sie ist ähnlich aufgebaut:

```json title="composer.json"
{
  "name": "beispiel/shop-backend",
  "type": "project",
  "require": {
    "php": "^8.5",
    "laravel/framework": "^13.0"
  },
  "require-dev": {
    "phpunit/phpunit": "^12.0",
    "phpstan/phpstan": "^2.1"
  },
  "autoload": {
    "psr-4": { "App\\": "app/" }
  }
}
```

Neu ist `autoload`: Dieser Abschnitt sagt Composer, dass Klassen mit dem Namensraum `App\` im Ordner
`app/` liegen. Dank [[autoloading|Autoloading]] musst du keine Datei von Hand einbinden.

> [!MERKSATZ]
> `dependencies` heißt bei Composer `require`, `devDependencies` heißt `require-dev`. Das Prinzip ist
> dasselbe.

## Laufzeit oder Entwicklung?

Die wichtigste Frage beim Hinzufügen eines Pakets: Braucht die **laufende Anwendung** es – oder nur
**du beim Entwickeln**?

| Laufzeit-[[abhaengigkeit|Abhängigkeit]] | [[devdependency|Entwicklungsabhängigkeit]] |
|---|---|
| React, Laravel, Zod | TypeScript, Vite, ESLint |
| Code, der im Browser oder auf dem Server läuft | Test-, Build- und Prüfwerkzeuge |
| `npm install react` | `npm install -D vitest` |
| `composer require laravel/framework` | `composer require --dev phpstan/phpstan` |

Die Trennung zahlt sich auf dem Server aus. Dort installierst du mit `npm ci --omit=dev` oder
`composer install --no-dev` nur, was wirklich läuft. Das spart Platz und verkleinert die
Angriffsfläche.

> [!FEHLER]
> **Alles in `dependencies`.** Dann landen Test-Frameworks und Linter auf dem Produktivserver. Prüfe
> bei jedem neuen Paket: Wird es im Code der Anwendung importiert? Wenn nein, gehört es meist zu den
> Entwicklungsabhängigkeiten.

## Lockfiles: exakt dieselben Versionen

`"react": "^19.2.0"` ist ein Versionsbereich nach [[semantic-versioning|Semantic Versioning]]: „19.2.0
oder neuer, aber unter 20“. Installierst du heute und deine Kollegin nächste Woche, bekommt ihr
womöglich unterschiedliche Versionen.

Das [[lockfile|Lockfile]] verhindert das. `package-lock.json` bzw. `composer.lock` hält die **exakte**
Version jedes Pakets fest – auch der Pakete, die deine Pakete selbst brauchen.

| Befehl | Was er tut |
|---|---|
| `npm install` / `composer update` | löst Bereiche auf und aktualisiert das Lockfile |
| `npm ci` | installiert exakt aus `package-lock.json`, bricht bei Widerspruch ab |
| `composer install` | installiert exakt aus `composer.lock` |

So entsteht eine [[reproduzierbare-installation|reproduzierbare Installation]]: Jeder Rechner, die
CI und der Server haben dieselben Versionen.

> [!PRAXIS]
> Committe das Lockfile immer mit, wenn du eine Abhängigkeit hinzufügst. In der CI und beim Deployment
> nutzt du `npm ci` und `composer install`, nie `npm install` oder `composer update` – sonst kann sich
> unbemerkt eine Version ändern.

## Zusammenfassung

- `package.json` und `composer.json` sind die Manifeste eines Projekts.
- Laufzeitpakete: `dependencies` bzw. `require`; Werkzeuge: `devDependencies` bzw. `require-dev`.
- `npm install -D` und `composer require --dev` fügen Entwicklungsabhängigkeiten hinzu.
- Lockfiles halten exakte Versionen fest und werden committet.
- `npm ci` und `composer install` installieren reproduzierbar aus dem Lockfile.
- Auf dem Server: `--omit=dev` bzw. `--no-dev`.
