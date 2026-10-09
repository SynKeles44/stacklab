---
title: Monorepos im Überblick
summary: Mehrere Projekte in einem Repository – mit apps/, packages/ und npm-Workspaces.
duration: 20
sources:
  - title: npm – Workspaces
    url: https://docs.npmjs.com/cli/using-npm/workspaces
  - title: npm – package.json (workspaces)
    url: https://docs.npmjs.com/cli/configuring-npm/package-json#workspaces
  - title: Bun – Workspaces
    url: https://bun.com/docs/install/workspaces
quiz:
  - type: single
    question: Was ist ein Monorepo?
    options:
      - Ein Repository mit nur einer einzigen Datei.
      - Ein Repository, das mehrere zusammengehörige Projekte enthält.
      - Ein Repository, an dem nur eine Person arbeiten darf.
      - Ein Repository ohne Branches.
    answer: 1
    explanation: Ein Monorepo bündelt mehrere Projekte, etwa Frontend, Backend und gemeinsame Bibliotheken, in einem Repository mit gemeinsamer Historie.
  - type: multiple
    question: Welche Vorteile hat ein Monorepo?
    options:
      - Eine Änderung an Frontend und Backend passt in einen einzigen Commit.
      - Gemeinsamer Code lässt sich ohne Veröffentlichung teilen.
      - Builds werden automatisch schneller, egal wie groß das Repository ist.
      - Einheitliche Werkzeuge und Konfiguration für alle Teilprojekte.
    answers: [0, 1, 3]
    explanation: Monorepos erleichtern gemeinsame Änderungen und geteilten Code. Bei großen Repositorys braucht es aber zusätzliche Werkzeuge, damit Builds schnell bleiben.
  - type: cloze
    text: In npm legst du die Teilprojekte im Feld `___` der Wurzel-package.json fest. Ausgelieferte Anwendungen liegen üblicherweise in `___/`, geteilte Bibliotheken in `packages/`.
    blanks:
      - [workspaces]
      - [apps]
    explanation: "\"workspaces\": [\"apps/*\", \"packages/*\"] ist das verbreitetste Muster."
  - type: find-bug
    question: "`npm run build --workspaces` findet das Teilprojekt `packages/ui` nicht. Welche Zeile ist falsch?"
    language: json
    code: |
      {
        "name": "produkt",
        "private": true,
        "workspaces": ["apps/*", "package/*"]
      }
    bug_line: 4
    explanation: Der Ordner heißt packages (Mehrzahl). Das Muster package/* passt auf keinen vorhandenen Ordner.
tasks:
  - id: workspaces-anlegen
    type: terminal
    title: Ein Monorepo mit npm-Workspaces anlegen
    description: |
      Der Ordner `monorepo` ist leer. Baue darin ein kleines Monorepo:

      1. Lege eine `package.json` in der Wurzel an mit `"name": "produkt"`, `"private": true` und
         `"workspaces": ["apps/*", "packages/*"]`.
      2. Lege `apps/web/package.json` mit dem Namen `web` an.
      3. Lege `packages/ui/package.json` mit dem Namen `@produkt/ui` an.
      4. Gib beiden Teilprojekten ein Skript `build`, das etwas ausgibt, z. B. `echo baue web`.
      5. Führe in der Wurzel `npm run build --workspaces` aus.
    workdir: monorepo
    checks:
      - type: command
        run: jq -r '.private' package.json
        stdout_equals: "true"
        message: Die Wurzel-package.json braucht "private" true (ein Monorepo-Wurzelpaket wird nie veröffentlicht).
      - type: command
        run: jq -c '.workspaces' package.json
        stdout_equals: '["apps/*","packages/*"]'
        message: Trage "workspaces" mit ["apps/*", "packages/*"] in die Wurzel-package.json ein.
      - type: command
        run: jq -r '.name' apps/web/package.json
        stdout_equals: web
        message: apps/web/package.json fehlt oder hat nicht den Namen web.
      - type: command
        run: jq -r '.name' packages/ui/package.json
        stdout_equals: "@produkt/ui"
        message: packages/ui/package.json fehlt oder hat nicht den Namen @produkt/ui.
      - type: command
        run: npm run build --workspaces --silent | grep -c .
        stdout_matches: "^[2-9]"
        message: npm run build --workspaces soll in beiden Teilprojekten ein build-Skript ausführen, das etwas ausgibt.
    hints:
      - "In einer bestehenden package.json (zur Not erst `echo '{}' > package.json`) setzt `npm pkg set name=web scripts.build=\"echo baue web\"` die Felder."
      - "Für die Wurzel: `echo '{\"name\":\"produkt\",\"private\":true,\"workspaces\":[\"apps/*\",\"packages/*\"]}' > package.json`"
      - Lege die Teilprojekt-Ordner vorher mit `mkdir -p apps/web packages/ui` an.
    solution: |
      ```bash
      cd monorepo
      mkdir -p apps/web packages/ui
      echo '{"name":"produkt","private":true,"workspaces":["apps/*","packages/*"]}' > package.json
      echo '{"name":"web","version":"1.0.0","scripts":{"build":"echo baue web"}}' > apps/web/package.json
      echo '{"name":"@produkt/ui","version":"1.0.0","scripts":{"build":"echo baue ui"}}' > packages/ui/package.json
      npm run build --workspaces
      ```
  - id: apps-oder-packages
    type: dragdrop
    title: apps oder packages?
    description: Entscheide für jedes Teilprojekt, ob es eine ausgelieferte Anwendung oder eine geteilte Bibliothek ist.
    targets:
      - { id: apps, label: "apps/ – wird ausgeliefert" }
      - { id: packages, label: "packages/ – wird geteilt" }
    items:
      - { label: Das React-Frontend für Kundinnen, target: apps }
      - { label: Das Laravel-Backend, target: apps }
      - { label: Die Verwaltungsoberfläche, target: apps }
      - { label: Gemeinsame Button- und Dialog-Komponenten, target: packages }
      - { label: Gemeinsame tsconfig- und Linter-Einstellungen, target: packages }
      - { label: TypeScript-Typen für die API, target: packages }
---
Bisher hattest du immer **ein** Projekt pro Repository. In der Praxis gehören aber oft mehrere
Projekte zusammen: ein Frontend, ein Backend, eine Verwaltungsoberfläche. Liegen sie in getrennten
Repositorys, wird jede gemeinsame Änderung zum Koordinationsaufwand.

## Polyrepo oder Monorepo?

Es gibt zwei Wege, mehrere Projekte zu organisieren:

| | Polyrepo | Monorepo |
|---|---|---|
| Aufbau | ein Repository pro Projekt | alle Projekte in einem Repository |
| Gemeinsame Änderung | mehrere Pull Requests | ein Commit |
| Geteilter Code | als Paket veröffentlichen | direkt aus `packages/` nutzen |
| Werkzeuge | pro Repository eingerichtet | einmal für alle |

Ein [[monorepo|Monorepo]] ist also kein einzelnes Riesenprojekt. Es ist ein Repository, in dem
mehrere eigenständige Projekte nebeneinander wohnen.

![Ein Monorepo mit apps/ und packages/](/assets/projektaufbau/monorepo.svg)

## apps und packages

Die meisten JavaScript-Monorepos nutzen dieselbe Zweiteilung:

- `apps/` enthält, was **ausgeliefert** wird: das Frontend, das Backend, eine Admin-Oberfläche.
- `packages/` enthält, was **geteilt** wird: Komponenten, Typen, gemeinsame Konfiguration.

Jedes Teilprojekt hat seine eigene `package.json`. In der Wurzel liegt eine weitere, die alles
zusammenhält:

```json title="package.json in der Wurzel"
{
  "name": "produkt",
  "private": true,
  "workspaces": ["apps/*", "packages/*"]
}
```

`"private": true` verhindert, dass das Wurzelpaket aus Versehen veröffentlicht wird.

> [!MERKSATZ]
> `apps/` = was ausgeliefert wird, `packages/` = was geteilt wird. Die Wurzel verbindet alles über
> `workspaces`.

## Was Workspaces für dich tun

Ein [[workspace|Workspace]] ist ein Teilprojekt, das der [[paketmanager|Paketmanager]] kennt. Mit
Workspaces erledigt npm drei Dinge:

1. Ein `npm install` in der Wurzel installiert die Abhängigkeiten **aller** Teilprojekte.
2. Es gibt nur **ein** [[lockfile|Lockfile]] in der Wurzel.
3. `apps/web` kann `@produkt/ui` nutzen, ohne dass das Paket irgendwo veröffentlicht ist – npm
   verlinkt den Ordner direkt.

```bash title="Skripte in Teilprojekten ausführen"
npm run build --workspaces     # in allen Teilprojekten
npm run build -w web           # nur im Workspace "web"
```

Geteilte Pakete bekommen oft einen Namen mit Präfix, etwa `@produkt/ui`. So erkennt man sofort, dass
sie aus dem eigenen Monorepo stammen und nicht aus der öffentlichen Registry. Im Frontend importierst du
sie wie jedes andere Paket: `import { Button } from '@produkt/ui'`.

Bun und pnpm kennen dasselbe Prinzip mit fast identischer Konfiguration.

> [!FEHLER]
> **In jedem Teilprojekt einzeln `npm install` ausführen.** Dann entstehen mehrere `node_modules/`
> und mehrere Lockfiles, und die Verknüpfung zwischen den Paketen fehlt. Installiere in einem
> Monorepo immer in der Wurzel.

## Wann lohnt sich ein Monorepo?

Ein Monorepo lohnt sich, wenn Teile **eng zusammenarbeiten** und **gemeinsam geändert** werden –
zum Beispiel ein Frontend und die Typen der API, die es aufruft. Für völlig unabhängige Projekte
bringt es wenig.

Bei sehr großen Monorepos kommen spezielle Werkzeuge hinzu, die nur geänderte Teile neu bauen und
testen. Genau darum geht es im Kurs „Monorepos und Workspaces“.

> [!PRAXIS]
> Auch ein Laravel-Backend und ein React-Frontend leben oft in einem Repository, etwa als `backend/`
> und `frontend/`. Das ist ebenfalls eine Form von Monorepo – nur ohne gemeinsamen Paketmanager.
> Diesen Aufbau baust du im Projekt am Ende des Kurses.

## Zusammenfassung

- Ein Monorepo enthält mehrere eigenständige Projekte in einem Repository.
- `apps/` enthält Ausgeliefertes, `packages/` Geteiltes.
- Jedes Teilprojekt hat eine eigene `package.json`, die Wurzel verbindet sie mit `workspaces`.
- Installiert wird in der Wurzel; es gibt nur ein Lockfile.
- `npm run <skript> --workspaces` bzw. `-w <name>` führt Skripte in Teilprojekten aus.
- Monorepos lohnen sich für eng verbundene Projekte, die gemeinsam geändert werden.
