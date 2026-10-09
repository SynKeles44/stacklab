---
title: Repositorys anlegen
summary: Wie du ein Repository auf GitHub erstellst, welche Sichtbarkeit du wählst und warum README, LICENSE und .gitignore von Anfang an dazugehören.
duration: 25
sources:
  - title: GitHub Docs – Neues Repository erstellen
    url: https://docs.github.com/de/repositories/creating-and-managing-repositories/creating-a-new-repository
  - title: GitHub Docs – Lizenzierung eines Repositorys
    url: https://docs.github.com/de/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository
  - title: GitHub REST API – Repository für den angemeldeten Benutzer erstellen
    url: https://docs.github.com/de/rest/repos/repos#create-a-repository-for-the-authenticated-user
  - title: github/gitignore – Sammlung von Vorlagen
    url: https://github.com/github/gitignore
quiz:
  - type: single
    question: Du willst ein Repository nur mit zwei Kolleginnen teilen. Welche Sichtbarkeit wählst du?
    options:
      - Public, damit sie es finden
      - Private und die beiden als Collaborators einladen
      - Public, aber ohne README
    answer: 1
    explanation: Private Repositorys sieht nur, wer ausdrücklich eingeladen wurde (oder Mitglied der besitzenden Organisation mit Rechten ist).
  - type: multiple
    question: Was passiert, wenn ein öffentliches Repository KEINE Lizenzdatei hat?
    options:
      - Jeder darf den Code beliebig nutzen
      - Der Code ist urheberrechtlich geschützt, andere dürfen ihn ansehen, aber rechtlich nicht einfach weiterverwenden
      - Andere Nutzer:innen dürfen das Repository auf GitHub trotzdem forken
      - GitHub löscht das Repository nach 30 Tagen
    answers: [1, 2]
    explanation: Ohne Lizenz gilt das Urheberrecht – niemand bekommt Nutzungsrechte. Die GitHub-Nutzungsbedingungen erlauben aber das Ansehen und Forken auf der Plattform.
  - type: match
    question: Welche Datei erfüllt welchen Zweck?
    pairs:
      - { left: "README.md", right: "Startseite: Was ist das Projekt und wie benutze ich es?" }
      - { left: "LICENSE", right: "Regelt, was andere mit dem Code tun dürfen" }
      - { left: ".gitignore", right: "Listet Dateien, die Git nicht verfolgen soll" }
    explanation: Diese drei Dateien bietet GitHub direkt beim Anlegen eines Repositorys an.
  - type: cloze
    text: 'Beim Anlegen per REST-API sendest du einen ___-Request an den Endpunkt `/user/repos`. Mit `"___": true` wird das Repository privat.'
    blanks:
      - [POST]
      - [private]
    explanation: Neue Ressourcen legt man per POST an. Das Feld private steuert die Sichtbarkeit.
tasks:
  - id: repo-per-api
    type: request
    title: Lege ein Repository per REST-API an
    description: |
      Du willst ein öffentliches Repository `todo-app` für dein Konto anlegen – inklusive README,
      einer `.gitignore` für Node.js und der MIT-Lizenz. Baue den Request an die GitHub-REST-API.

      - Endpunkt: `/user/repos`
      - Header `Accept: application/vnd.github+json` und `Authorization: Bearer <dein-token>`
      - JSON-Body mit `name`, `private` (false), `auto_init` (true), `gitignore_template` (`Node`)
        und `license_template` (`mit`)
    base_url: https://api.github.com
    expected:
      method: POST
      path: "^/user/repos$"
      headers:
        Accept: "application/vnd\\.github\\+json"
        Authorization: "^Bearer\\s+\\S+"
        Content-Type: "application/json"
      body_contains: ['"name"', '"todo-app"', '"auto_init"', '"gitignore_template"', '"Node"', '"license_template"', '"mit"']
    response:
      status: 201
      body: '{"id": 123456789, "name": "todo-app", "full_name": "du/todo-app", "private": false, "html_url": "https://github.com/du/todo-app", "default_branch": "main"}'
    hints:
      - Neue Ressourcen legst du mit POST an.
      - "Der Body sieht etwa so aus: `{\"name\": \"todo-app\", \"private\": false, \"auto_init\": true, ...}`"
      - Vergiss den Header Content-Type mit dem Wert application/json nicht.
    solution: |
      ```http
      POST /user/repos HTTP/1.1
      Host: api.github.com
      Accept: application/vnd.github+json
      Authorization: Bearer <dein-token>
      Content-Type: application/json

      {"name": "todo-app", "private": false, "auto_init": true,
       "gitignore_template": "Node", "license_template": "mit"}
      ```
  - id: repo-startklar
    type: terminal
    title: Mach ein Projekt startklar für GitHub
    description: |
      Im Ordner `startklar` liegt ein Node-Projekt in einem frischen Repository ohne Commit. Darin liegen
      auch Dinge, die nicht auf GitHub gehören: `node_modules/`, der Build-Ordner `dist/` und `debug.log`.

      1. Lege eine `.gitignore` an, die `node_modules/`, `dist/` und alle `*.log`-Dateien ignoriert.
      2. Lege eine `README.md` mit einer Überschrift und mindestens einem Satz Beschreibung an.
      3. Lege eine `LICENSE` mit dem Text der MIT-Lizenz an (die erste Zeile lautet `MIT License`).
      4. Committe alles, was ins Repository gehört, in **einem** Commit.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: startklar
    setup: |
      git init -q
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      printf '{\n  "name": "startklar",\n  "version": "1.0.0",\n  "scripts": { "start": "node src/index.js" }\n}\n' > package.json
      mkdir -p src node_modules/left-pad dist
      printf 'console.log("Hallo GitHub");\n' > src/index.js
      printf 'module.exports = () => {};\n' > node_modules/left-pad/index.js
      printf 'console.log("gebaut");\n' > dist/bundle.js
      printf 'Fehler beim Start\n' > debug.log
    checks:
      - type: file_contains
        path: .gitignore
        pattern: "^/?node_modules/?\\s*$"
        message: In .gitignore fehlt node_modules/.
      - type: file_contains
        path: .gitignore
        pattern: "^/?dist/?\\s*$"
        message: In .gitignore fehlt dist/.
      - type: file_contains
        path: .gitignore
        pattern: "^\\*\\.log\\s*$"
        message: In .gitignore fehlt ein Muster für alle Log-Dateien (*.log).
      - type: file_contains
        path: README.md
        pattern: "^#\\s+\\S"
        message: README.md braucht eine Überschrift, z. B. "# Startklar".
      - type: file_contains
        path: LICENSE
        pattern: "^MIT License"
        message: LICENSE soll mit der Zeile "MIT License" beginnen.
      - type: file_contains
        path: LICENSE
        pattern: "Permission is hereby granted"
        message: In LICENSE fehlt der eigentliche Lizenztext der MIT-Lizenz.
      - type: command
        run: git log --oneline 2>/dev/null | wc -l
        stdout_matches: "^\\s*1\\s*$"
        message: Es sollte genau einen Commit geben.
      - type: command
        run: git ls-files | sort | tr '\n' ' '
        stdout_equals: ".gitignore LICENSE README.md package.json src/index.js"
        message: Im Commit sollen genau .gitignore, LICENSE, README.md, package.json und src/index.js liegen – nichts aus node_modules, dist oder Logs.
    hints:
      - "Prüfe mit `git status`, ob node_modules, dist und debug.log nach dem Anlegen der .gitignore verschwinden."
      - "Den MIT-Text findest du unter choosealicense.com/licenses/mit – mit `nano LICENSE` kannst du ihn einfügen. Er beginnt mit `MIT License`, dann `Copyright (c) <Jahr> <Name>`."
      - "Zum Schluss `git add .` (jetzt ungefährlich, weil die .gitignore steht) und `git commit -m \"chore: initial commit\"`."
    solution: |
      ```bash
      cd startklar
      printf 'node_modules/\ndist/\n*.log\n' > .gitignore
      printf '# Startklar\n\nEin kleines Node-Projekt, das „Hallo GitHub“ ausgibt.\n' > README.md
      cat > LICENSE <<'EOF'
      MIT License

      Copyright (c) 2026 Ada Beispiel

      Permission is hereby granted, free of charge, to any person obtaining a copy
      of this software and associated documentation files (the "Software"), to deal
      in the Software without restriction, including without limitation the rights
      to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
      copies of the Software, and to permit persons to whom the Software is
      furnished to do so, subject to the following conditions:

      The above copyright notice and this permission notice shall be included in all
      copies or substantial portions of the Software.

      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
      IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
      FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
      AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
      LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
      OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
      SOFTWARE.
      EOF
      git status
      git add .
      git commit -m "chore: initial commit"
      ```
---

Ein Repository auf GitHub ist in zehn Sekunden angelegt: Name eintippen, auf „Create repository“
klicken, fertig. Trotzdem lohnt es sich, diese zehn Sekunden bewusst zu nutzen. Welche Sichtbarkeit,
welche Lizenz, welche Dateien von Anfang an? Diese Entscheidungen bestimmen, wer dein Projekt sehen
und benutzen darf – und ob versehentlich Müll im ersten Commit landet.

## Ein Repository im Browser anlegen

Oben rechts auf GitHub findest du das **+**-Menü mit **New repository**. Das Formular fragt:

| Feld | Bedeutung |
|---|---|
| **Owner** | Gehört das Repository dir oder einer Organisation? |
| **Repository name** | Kurz, kleingeschrieben, Wörter mit Bindestrich: `todo-app`, nicht `Mein Projekt FINAL` |
| **Description** | Ein Satz, der auf der Startseite und in Suchergebnissen erscheint |
| **Visibility** | Public oder Private (siehe unten) |
| **Add README** | legt eine erste `README.md` an |
| **Add .gitignore** | wählt eine fertige Vorlage, z. B. `Node` oder `Laravel` |
| **Choose a license** | fügt eine Lizenzdatei `LICENSE` hinzu |

Wichtig: Sobald du README, `.gitignore` oder Lizenz auswählst, erstellt GitHub **einen ersten Commit**.
Das ist praktisch, wenn du mit `git clone` startest. Willst du dagegen ein **bereits existierendes**
lokales Repository hochladen, lässt du alle drei Häkchen weg – sonst haben das lokale und das neue
Repository zwei verschiedene erste Commits, und dein erster Push wird abgelehnt.

> [!MERKSATZ]
> Neues Projekt → mit README anlegen und klonen. Vorhandenes lokales Projekt → **leeres** Repository
> anlegen und hochpushen.

## Sichtbarkeit: Public oder Private

Die [[sichtbarkeit|Sichtbarkeit]] legt fest, wer ein Repository sehen kann:

| Sichtbarkeit | Wer sieht es? | Typischer Einsatz |
|---|---|---|
| **Public** | alle im Internet, auch ohne Konto | Open Source, Portfolio, Lernprojekte |
| **Private** | nur du und eingeladene Personen | Firmen-Code, Kundenprojekte, Experimente |
| **Internal** | alle Mitglieder eines Unternehmens (nur bei Enterprise-Konten) | interne Bibliotheken |

Sehen heißt noch nicht schreiben. Selbst bei einem öffentlichen Repository dürfen nur Personen pushen,
die du als **Collaborator** einlädst. Alle anderen können Änderungen nur über einen Fork und einen Pull
Request vorschlagen. Die Sichtbarkeit kannst du später in den **Settings** ändern – aber Vorsicht:
Wer ein privates Repository öffentlich macht, veröffentlicht die **komplette Historie**, inklusive jedes
alten Commits.

## README und Lizenz

Die [[readme|README]] ist die Visitenkarte: GitHub zeigt sie unter der Dateiliste an. Sie beantwortet
mindestens: Was ist das? Wie installiere ich es? Wie benutze ich es? Du schreibst sie in
[[markdown|Markdown]]: `# Titel` für Überschriften, `- Punkt` für Listen, `[Text](LICENSE)` für
relative Links und drei Backticks für Code-Blöcke. GitHub versteht zusätzlich Tabellen,
Aufgabenlisten (`- [ ]`) sowie `@name` und `#12` als Verweise auf Personen und Issues.

Öffentlicher Code ist **nicht** automatisch frei verwendbar. Ohne [[lizenz|Lizenz]] gilt das
Urheberrecht: Andere dürfen ihn ansehen und auf GitHub forken, aber nicht rechtssicher weiterverwenden.

| Lizenz | Kurz gesagt |
|---|---|
| **MIT** | Fast alles erlaubt, nur der Copyright-Hinweis muss bleiben. Sehr verbreitet. |
| **Apache 2.0** | Ähnlich frei wie MIT, regelt zusätzlich Patente. |
| **GPL 3.0** | Veränderte Versionen müssen ebenfalls unter GPL offengelegt werden („Copyleft“). |

Die Datei `LICENSE` liegt im obersten Ordner; GitHub erkennt bekannte [[open-source|Open-Source]]-Lizenzen
automatisch. Eine Entscheidungshilfe bietet choosealicense.com.

## Die .gitignore-Vorlagen

Jede Programmiersprache erzeugt Dateien, die nicht ins Repository gehören: bei Node.js der Ordner
`node_modules/`, bei Builds `dist/` oder `build/`, dazu Logdateien und Editor-Einstellungen. GitHub
pflegt eine öffentliche Sammlung von [[gitignore|.gitignore]]-Vorlagen für fast jede Sprache und jedes
Framework. Beim Anlegen wählst du einfach „Node“ und bekommst eine durchdachte Liste.

```text title="Auszug aus einer .gitignore für Node.js"
node_modules/
dist/
*.log
.env
.DS_Store
```

`node_modules/` gehört nicht ins Repository, weil jede Person die [[abhaengigkeit|Abhängigkeiten]] mit
`npm install` aus `package.json` und dem [[lockfile|Lockfile]] selbst wiederherstellen kann. Der Ordner ist
oft Hunderte Megabyte groß und enthält betriebssystemabhängige Dateien.

> [!FEHLER]
> **`node_modules/` im ersten Commit.** Wer zuerst `git add .` tippt und erst danach eine `.gitignore`
> anlegt, hat Zehntausende Dateien in der Historie. Die Reihenfolge ist immer: `.gitignore` anlegen,
> `git status` prüfen, dann committen.

## Repositorys per API anlegen

Alles, was du im Browser klickst, kann man auch über die [[rest-api|GitHub-REST-API]] erledigen. Das ist
nützlich, wenn ein Skript für jedes neue Projekt automatisch ein Repository anlegen soll. Ein
[[http-request|HTTP-Request]] an `https://api.github.com/user/repos` genügt:

```bash title="Repository per curl anlegen"
curl -X POST https://api.github.com/user/repos \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer <dein-token>" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  -d '{"name": "todo-app", "private": true, "auto_init": true, "gitignore_template": "Node", "license_template": "mit"}'
```

Der Header `X-GitHub-Api-Version` legt fest, welche Version der API du erwartest; ohne ihn nimmt GitHub
eine Standardversion. Das Token braucht dafür die Berechtigung, Repositorys anzulegen.

> [!PRAXIS]
> In Firmen legt man Repositorys meist in einer **Organisation** an, nicht im persönlichen Konto. So
> gehört der Code dem Unternehmen und nicht einer Person, die das Team irgendwann verlässt. Häufig gibt
> es dafür **Template-Repositorys**: fertige Vorlagen mit README, Lizenz, CI-Workflow und Ordnerstruktur,
> aus denen neue Projekte per Klick entstehen.

## Zusammenfassung

- Neue Repositorys legst du über **+ → New repository** an; Name kurz und kleingeschrieben.
- Für ein vorhandenes lokales Projekt legst du ein **leeres** Repository an, sonst gibt es Konflikte beim ersten Push.
- **Public** sieht jeder, **Private** nur Eingeladene; Schreibrechte vergibst du separat.
- Die **README** ist die Visitenkarte, die **LICENSE** regelt die Nutzung – ohne Lizenz gilt das Urheberrecht.
- **.gitignore-Vorlagen** halten `node_modules/`, Build-Ordner und Logs aus dem Repository.
- Über die **REST-API** (`POST /user/repos`) lassen sich Repositorys automatisiert anlegen.
