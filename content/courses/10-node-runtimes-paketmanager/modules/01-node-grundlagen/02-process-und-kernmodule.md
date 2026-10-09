---
title: process und die Kernmodule fs, path, os
summary: Wie dein Skript Argumente und Umgebungsvariablen liest, Erfolg oder Fehler meldet und mit Dateien und Pfaden arbeitet.
duration: 25
sources:
  - title: Node.js API – process
    url: https://nodejs.org/api/process.html
  - title: Node.js API – File system (fs)
    url: https://nodejs.org/api/fs.html
  - title: Node.js API – Path
    url: https://nodejs.org/api/path.html
  - title: Node.js API – import.meta.dirname
    url: https://nodejs.org/api/esm.html#importmetadirname
quiz:
  - type: single
    question: "Du startest `node rechner.js 5 7`. Was steht in `process.argv[2]`?"
    options: ["\"node\"", "\"rechner.js\"", "\"5\"", "5 (als Zahl)"]
    answer: 2
    explanation: "argv[0] ist der Pfad zu node, argv[1] der Pfad zum Skript, ab argv[2] folgen deine Argumente – immer als Strings, also \"5\" und nicht 5."
  - type: multiple
    question: Welche Aussagen über Umgebungsvariablen stimmen?
    options:
      - Du liest sie in Node.js über `process.env`.
      - Ihre Werte sind immer Strings (oder undefined).
      - Sie eignen sich für geheime Werte wie API-Schlüssel, die nicht ins Repository gehören.
      - Node.js wandelt "true" automatisch in den Boolean true um.
    answers: [0, 1, 2]
    explanation: "Umgebungsvariablen sind immer Text. Aus \"true\" wird nicht automatisch true – du vergleichst selbst, z. B. process.env.DEBUG === \"true\"."
  - type: match
    question: Was liefert der Aufruf (auf Linux)?
    pairs:
      - { left: "path.join(\"daten\", \"2026\", \"a.txt\")", right: "daten/2026/a.txt" }
      - { left: "path.basename(\"/home/ada/bericht.pdf\")", right: "bericht.pdf" }
      - { left: "path.extname(\"index.html\")", right: ".html" }
      - { left: "path.dirname(\"/home/ada/bericht.pdf\")", right: "/home/ada" }
    explanation: join setzt Teile zusammen, basename liefert den Dateinamen, extname die Endung, dirname den Ordner.
  - type: find-bug
    question: Das Skript soll `config.json` aus seinem eigenen Ordner lesen. Startest du es aus einem anderen Ordner, kommt `ENOENT`. Welche Zeile ist schuld?
    language: js
    code: |
      import fs from "node:fs";
      import path from "node:path";
      const datei = path.join(process.cwd(), "config.json");
      const config = JSON.parse(fs.readFileSync(datei, "utf8"));
      console.log(config.name);
    bug_line: 3
    explanation: process.cwd() ist der Ordner, aus dem du node startest – nicht der Ordner des Skripts. Richtig ist path.join(import.meta.dirname, "config.json").
tasks:
  - id: argumente-parsen
    type: code
    language: js
    title: Kommandozeilen-Argumente zerlegen
    description: |
      Schreibe die Funktion `parseArgs(args)`. Sie bekommt die Argumente **ohne** die ersten beiden
      Einträge, also das, was `process.argv.slice(2)` liefert, und gibt ein Objekt zurück:

      - `flags`: alle Argumente, die mit `--` beginnen. `--name=Ada` wird zu `name: "Ada"`,
        `--verbose` (ohne `=`) wird zu `verbose: true`.
      - `positional`: alle anderen Argumente in ihrer Reihenfolge.

      Beispiel: `parseArgs(["--name=Ada", "notizen.txt", "--verbose"])` ergibt
      `{ flags: { name: "Ada", verbose: true }, positional: ["notizen.txt"] }`.
    starter: |
      function parseArgs(args) {
        const flags = {};
        const positional = [];
        // Gehe alle Argumente durch und sortiere sie ein
        return { flags, positional };
      }
    tests:
      - name: Flags mit Wert und ohne Wert
        code: |
          assertDeepEqual(parseArgs(["--name=Ada", "notizen.txt", "--verbose"]), { flags: { name: "Ada", verbose: true }, positional: ["notizen.txt"] })
      - name: Leere Argumentliste
        code: "assertDeepEqual(parseArgs([]), { flags: {}, positional: [] })"
      - name: Nur positionelle Argumente bleiben in Reihenfolge
        code: |
          assertDeepEqual(parseArgs(["a.txt", "b.txt"]), { flags: {}, positional: ["a.txt", "b.txt"] })
      - name: Wert darf selbst ein Gleichheitszeichen enthalten
        code: |
          assertDeepEqual(parseArgs(["--filter=a=b"]).flags, { filter: "a=b" })
    hints:
      - "Mit `arg.startsWith(\"--\")` erkennst du ein Flag."
      - "`arg.slice(2)` entfernt die zwei Striche. Mit `indexOf(\"=\")` findest du das erste Gleichheitszeichen."
    solution: |
      ```js
      function parseArgs(args) {
        const flags = {};
        const positional = [];
        for (const arg of args) {
          if (arg.startsWith("--")) {
            const body = arg.slice(2);
            const eq = body.indexOf("=");
            if (eq === -1) {
              flags[body] = true;
            } else {
              flags[body.slice(0, eq)] = body.slice(eq + 1);
            }
          } else {
            positional.push(arg);
          }
        }
        return { flags, positional };
      }
      ```
  - id: einkaufsliste-statistik
    type: terminal
    title: Eine Datei auswerten und JSON schreiben
    description: |
      Im Ordner `einkaufsliste` liegt die Datei `daten/einkauf.txt` mit einem Eintrag pro Zeile.
      Klicke zuerst auf **Aufgabe vorbereiten**.

      1. Lege die Datei `statistik.mjs` an (die Endung `.mjs` bedeutet: ES-Modul, du darfst `import` nutzen).
      2. Baue den Pfad zur Datei mit `path.join(import.meta.dirname, "daten", "einkauf.txt")`.
      3. Lies die Datei und zähle alle **nicht leeren** Zeilen.
      4. Schreibe das Ergebnis als JSON nach `daten/statistik.json`, z. B.
         `{ "datei": "einkauf.txt", "zeilen": 5 }`.
      5. Gib zusätzlich `5 Einträge` (mit der echten Zahl) im Terminal aus.

      Die Prüfung startet dein Skript auch mit einer anderen Liste und aus einem anderen Ordner –
      verlass dich also nicht auf eine feste Zahl oder auf `process.cwd()`.
    workdir: einkaufsliste
    setup: |
      mkdir -p daten
      printf 'Milch\nBrot\nÄpfel\nKäse\nKaffee\n' > daten/einkauf.txt
    checks:
      - type: file_exists
        path: statistik.mjs
        message: Lege die Datei statistik.mjs an.
      - type: command
        run: node statistik.mjs
        stdout_matches: "5 Einträge"
        message: Das Skript soll "5 Einträge" ausgeben (die Datei hat fünf Zeilen).
      - type: command
        run: jq -r '.zeilen' daten/statistik.json
        stdout_equals: "5"
        message: In daten/statistik.json soll das Feld "zeilen" den Wert 5 haben.
      - type: command
        run: jq -r '.datei' daten/statistik.json
        stdout_equals: einkauf.txt
        message: In daten/statistik.json soll das Feld "datei" den Wert "einkauf.txt" haben.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          mkdir -p "$d/daten" && cp statistik.mjs "$d/"
          printf 'Tee\n\nZucker\nSalz\n' > "$d/daten/einkauf.txt"
          (cd / && node "$d/statistik.mjs" >/dev/null 2>&1)
          jq -r '.zeilen' "$d/daten/statistik.json" 2>/dev/null
          rm -rf "$d"
        stdout_equals: "3"
        message: Mit einer anderen Liste (3 Einträge und eine Leerzeile), gestartet aus einem anderen Ordner, stimmt das Ergebnis noch nicht. Nutze import.meta.dirname und ignoriere leere Zeilen.
    hints:
      - "`fs.readFileSync(datei, \"utf8\").split(\"\\n\")` liefert ein Array mit allen Zeilen."
      - "Mit `.filter(zeile => zeile.trim() !== \"\")` wirfst du leere Zeilen heraus."
      - "`fs.writeFileSync(ziel, JSON.stringify(objekt, null, 2))` schreibt formatiertes JSON."
    solution: |
      ```js
      // statistik.mjs
      import fs from "node:fs";
      import path from "node:path";

      const quelle = path.join(import.meta.dirname, "daten", "einkauf.txt");
      const ziel = path.join(import.meta.dirname, "daten", "statistik.json");

      const zeilen = fs
        .readFileSync(quelle, "utf8")
        .split("\n")
        .filter((zeile) => zeile.trim() !== "");

      const ergebnis = { datei: path.basename(quelle), zeilen: zeilen.length };
      fs.writeFileSync(ziel, JSON.stringify(ergebnis, null, 2));
      console.log(`${zeilen.length} Einträge`);
      ```
---

Werkzeuge wie `git` oder `npm` reagieren auf das, was du ihnen mitgibst, lesen Dateien und melden
zurück, ob alles geklappt hat. Dafür bringt Node.js das globale Objekt `process` und eine Reihe
eingebauter **Kernmodule** mit – ganz ohne Installation.

## Das Objekt process

Jedes laufende Programm ist für das Betriebssystem ein [[prozess|Prozess]]. Node.js beschreibt
deinen Prozess im globalen [[objekt|Objekt]] `process`:

| Eigenschaft | Inhalt | Beispiel |
|---|---|---|
| `process.argv` | Kommandozeilen-Argumente | `["/usr/bin/node", "/app/cli.js", "--help"]` |
| `process.env` | Umgebungsvariablen | `{ HOME: "/home/ada", … }` |
| `process.cwd()` | Ordner, aus dem du `node` gestartet hast | `"/home/ada/projekt"` |
| `process.version` | Node-Version | `"v24.21.0"` |
| `process.exitCode` | Exit-Code beim Programmende | `0` |

Deine eigenen [[argument|Argumente]] beginnen in `process.argv` bei Index 2 – die ersten beiden
Plätze belegen die Pfade zu `node` und zum Skript. Deshalb steht in fast jedem Werkzeug
`const args = process.argv.slice(2)`. Für Optionen wie `--name=Ada` bringt Node.js die Funktion
`parseArgs` aus `node:util` mit – in der Übung baust du eine einfache Version selbst, um zu
verstehen, was dabei passiert.

[[umgebungsvariable|Umgebungsvariablen]] setzt du direkt vor den Befehl:

```bash title="Terminal"
PORT=8080 DEBUG=true node server.js
```

```js title="server.js"
const port = Number(process.env.PORT ?? 3000);
const debug = process.env.DEBUG === "true";
```

> [!FEHLER]
> **Argumente und Umgebungsvariablen sind immer Strings.** `node add.js 2 3` liefert `"2"` und
> `"3"`, und `"2" + "3"` ergibt `"23"`. Wandle Zahlen ausdrücklich mit `Number()` um.

## Erfolg oder Fehler melden

Endet ein Programm, meldet es einen [[exit-code|Exit-Code]]: `0` heißt Erfolg, alles andere
Fehler. Die Shell zeigt ihn mit `echo $?`, CI-Systeme brechen bei Werten ungleich 0 ab.

```js title="pruefe-name.js"
const name = process.argv[2];
if (!name) {
  console.error("Fehler: Bitte einen Namen angeben.");
  process.exitCode = 1;          // oder process.exit(1) zum sofortigen Abbruch
} else {
  console.log(`Hallo, ${name}!`);
}
```

`console.error()` schreibt auf die Fehlerausgabe (*stderr*), `console.log()` auf die
Standardausgabe (*stdout*). So mischen sich Fehlermeldungen nicht mit den Daten.

> [!PRAXIS]
> Konfiguration, die sich zwischen Laptop und Server unterscheidet – Ports, Datenbank-Adressen,
> API-Schlüssel –, gehört in Umgebungsvariablen. Lokal liegen sie oft in einer Datei `.env`, die
> du mit `node --env-file=.env app.js` lädst und per `.gitignore` vom Commit ausschließt.

## Kernmodule: fs und path

[[kernmodul|Kernmodule]] sind in Node.js eingebaute [[modul|Module]]. Du importierst sie mit dem
Präfix `node:`. Damit `import` funktioniert, nutzen wir hier die Endung `.mjs` – mehr dazu in der
Lektion über Module.

```js title="notiz.mjs"
import fs from "node:fs";
import path from "node:path";

const datei = path.join(import.meta.dirname, "notiz.txt");
fs.writeFileSync(datei, "Erste Zeile\n");
fs.appendFileSync(datei, "Zweite Zeile\n");
console.log(fs.readFileSync(datei, "utf8"));
console.log(path.extname(datei));   // .txt
```

| Modul | Wofür? |
|---|---|
| `node:fs` | Dateien lesen, schreiben, prüfen (`existsSync`) |
| `node:fs/promises` | Dasselbe, aber ohne den Thread zu blockieren (für Server) |
| `node:path` | Pfade plattformunabhängig bauen und zerlegen |
| `node:os` | Systeminfos: `os.platform()`, `os.cpus().length`, `os.homedir()` |

`path` setzt jeden [[pfad|Pfad]] mit dem passenden Trennzeichen zusammen (`/` oder `\`). Gib beim Lesen von Text immer `"utf8"` an – sonst bekommst du einen `Buffer` mit rohen Bytes.

> [!MERKSATZ]
> `process.cwd()` ist der Ordner, in dem du im Terminal stehst. `import.meta.dirname` ist der
> Ordner der Skriptdatei. Dateien, die zum Skript gehören, findest du immer über `import.meta.dirname`.

## Zusammenfassung

- `process.argv.slice(2)` liefert deine Argumente, `process.env` die Umgebungsvariablen – beides Strings.
- Exit-Code `0` = Erfolg, alles andere = Fehler; setze ihn mit `process.exitCode` oder `process.exit()`.
- Fehler gehören mit `console.error()` auf stderr.
- Kernmodule importierst du mit `node:`-Präfix: `fs` für Dateien, `path` für Pfade, `os` für Systeminfos.
- Pfade zu eigenen Dateien baust du mit `path.join(import.meta.dirname, …)`.
