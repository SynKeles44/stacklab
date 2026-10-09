---
title: Umgebungsvariablen und .env-Dateien
summary: Konfiguration gehört nicht in den Code – wie Umgebungsvariablen funktionieren, was in .env und .env.example steht, warum Secrets nie ins Repository dürfen und wie direnv Variablen pro Ordner lädt.
duration: 25
sources:
  - title: The Twelve-Factor App – Config
    url: https://12factor.net/de/config
  - title: Bash Reference Manual – Shell Parameter Expansion
    url: https://www.gnu.org/software/bash/manual/html_node/Shell-Parameter-Expansion.html
  - title: Node.js – process.env
    url: https://nodejs.org/api/process.html#processenv
  - title: Laravel – Configuration (Environment)
    url: https://laravel.com/docs/configuration#environment-configuration
  - title: direnv – offizielle Seite
    url: https://direnv.net/
quiz:
  - type: single
    question: Welche Datei gehört ins Repository?
    options:
      - .env mit deinen echten Passwörtern
      - .env.example mit allen Variablennamen und harmlosen Beispielwerten
      - Beide
    answer: 1
    explanation: Die `.env.example` dokumentiert, welche Variablen es gibt. Die `.env` mit echten Werten bleibt lokal und steht in der `.gitignore`.
  - type: find-bug
    question: In welcher Zeile steckt ein Sicherheitsproblem?
    language: js
    code: |
      const port = process.env.APP_PORT ?? "8000";
      const dbHost = process.env.DB_HOST ?? "localhost";
      const apiToken = process.env.API_TOKEN ?? "geheim-123";
      console.log(`Starte auf Port ${port}`);
    bug_line: 3
    explanation: Ein echtes Token als Standardwert landet mit dem Code im Repository. Secrets bekommen keinen Standardwert – fehlt die Variable, soll das Programm mit einer klaren Fehlermeldung abbrechen.
  - type: match
    question: Was gibt die Shell jeweils aus, wenn `PORT` nicht gesetzt ist?
    pairs:
      - { left: "echo \"${PORT:-8000}\"", right: "8000" }
      - { left: "echo \"$PORT\"", right: "(leere Zeile)" }
      - { left: "echo \"${PORT:?fehlt}\"", right: "Fehler: PORT: fehlt" }
    explanation: "`:-` liefert einen Standardwert, `:?` bricht mit einer Fehlermeldung ab, und eine nicht gesetzte Variable ist einfach leer."
  - type: cloze
    text: Mit `___ APP_ENV=local` machst du eine Variable auch für Programme sichtbar, die du aus der Shell startest.
    blanks:
      - [export]
    explanation: Ohne `export` ist die Variable nur in der aktuellen Shell bekannt, nicht in gestarteten Kindprozessen.
tasks:
  - id: env-skript
    type: terminal
    title: Ein Startskript, das sich über Variablen konfigurieren lässt
    description: |
      Im Ordner `env-start` liegt ein leeres Git-Repository. Baue ein Startskript, das seine
      Konfiguration aus Umgebungsvariablen und einer optionalen `.env` liest.

      1. Lege `.env.example` an mit den Zeilen `APP_NAME=Demo` und `APP_PORT=8000`.
      2. Lege eine `.gitignore` an, die die Datei `.env` ignoriert.
      3. Schreibe ein ausführbares Skript `start.sh`, das
         - eine vorhandene `.env` lädt (`set -a; . ./.env; set +a`),
         - mit einer Fehlermeldung abbricht, wenn `APP_NAME` fehlt (`${APP_NAME:?…}`),
         - für `APP_PORT` den Standardwert `8000` nutzt,
         - genau eine Zeile ausgibt: `Starte <APP_NAME> auf Port <APP_PORT>`.

      Teste es mit `APP_NAME=Shop ./start.sh`. Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: env-start
    setup: |
      git init -q
    checks:
      - type: file_contains
        path: .env.example
        pattern: "^APP_NAME="
        message: In der .env.example fehlt die Zeile APP_NAME=….
      - type: file_contains
        path: .env.example
        pattern: "^APP_PORT=8000$"
        message: In der .env.example fehlt die Zeile APP_PORT=8000.
      - type: command
        run: git check-ignore -q .env
        message: .env wird noch nicht von Git ignoriert – trage sie in die .gitignore ein.
      - type: command
        run: git check-ignore -q .env.example
        expect_exit: 1
        message: .env.example darf nicht ignoriert werden – sie gehört ins Repository.
      - type: command
        run: env -u APP_PORT APP_NAME=Shop ./start.sh
        stdout_equals: Starte Shop auf Port 8000
        message: "Mit APP_NAME=Shop soll das Skript genau „Starte Shop auf Port 8000“ ausgeben."
      - type: command
        run: APP_NAME=Shop APP_PORT=9000 ./start.sh
        stdout_equals: Starte Shop auf Port 9000
        message: Ist APP_PORT gesetzt, muss das Skript diesen Wert statt 8000 nutzen.
      - type: command
        run: env -u APP_NAME ./start.sh
        expect_exit: 1
        message: Fehlt APP_NAME, soll das Skript mit einem Fehler abbrechen (${APP_NAME:?Meldung}).
      - type: command
        run: d=$(mktemp -d "$PWD/.pruefung-XXXXXX") && cp start.sh "$d/" && printf 'APP_NAME=AusDatei\nAPP_PORT=7000\n' > "$d/.env" && (cd "$d" && env -u APP_NAME -u APP_PORT ./start.sh); rc=$?; rm -rf "$d"; exit $rc
        stdout_equals: Starte AusDatei auf Port 7000
        message: Liegt eine .env im Ordner, soll das Skript ihre Werte laden.
    hints:
      - "Eine Datei nur laden, wenn sie existiert: `if [ -f .env ]; then set -a; . ./.env; set +a; fi`"
      - "`${APP_PORT:-8000}` liefert 8000, wenn APP_PORT leer oder nicht gesetzt ist."
      - "`: \"${APP_NAME:?APP_NAME fehlt}\"` bricht ab, wenn APP_NAME fehlt."
    solution: |
      ```bash
      cd env-start
      printf 'APP_NAME=Demo\nAPP_PORT=8000\n' > .env.example
      echo ".env" > .gitignore
      cat > start.sh <<'EOF'
      #!/usr/bin/env bash
      if [ -f .env ]; then
        set -a
        . ./.env
        set +a
      fi
      : "${APP_NAME:?APP_NAME fehlt – kopiere .env.example nach .env}"
      echo "Starte $APP_NAME auf Port ${APP_PORT:-8000}"
      EOF
      chmod +x start.sh
      APP_NAME=Shop ./start.sh
      ```
  - id: direnv-simulation
    type: simulated
    title: direnv freigeben und erleben
    description: |
      direnv ist im Übungs-Terminal nicht installiert. In dieser Simulation hast du direnv bereits in
      deiner Shell eingebunden. Im Ordner `~/projekte/shop` liegt eine `.envrc`.

      1. Wechsle in den Projektordner: `cd ~/projekte/shop`
      2. direnv blockiert die unbekannte Datei. Gib sie frei: `direnv allow`
      3. Prüfe die Variable: `echo $APP_ENV`
      4. Verlasse den Ordner wieder: `cd ..`
    prompt: "du@laptop:~/projekte$"
    steps:
      - expect: "^cd\\s+(~/projekte/)?shop/?$"
        output: "direnv: error /home/du/projekte/shop/.envrc is blocked. Run `direnv allow` to approve its content"
        prompt: "du@laptop:~/projekte/shop$"
        hint: "cd ~/projekte/shop"
      - expect: "^direnv\\s+allow(\\s+\\.)?$"
        output: |
          direnv: loading ~/projekte/shop/.envrc
          direnv: loading ~/projekte/shop/.env
          direnv: export +APP_ENV +APP_PORT ~PATH
        hint: "Mit direnv allow gibst du die aktuelle .envrc frei."
      - expect: "^echo\\s+\"?\\$APP_ENV\"?$"
        output: "local"
        hint: "echo $APP_ENV"
      - expect: "^cd\\s+\\.\\.$"
        output: "direnv: unloading"
        prompt: "du@laptop:~/projekte$"
        hint: "cd .."
    responses:
      - match: "^cat\\s+\\.envrc"
        output: |
          PATH_add bin
          dotenv_if_exists
          export APP_ENV=local
  - id: env-parser
    type: code
    language: js
    title: Einen einfachen .env-Parser schreiben
    description: |
      Schreibe eine Funktion `parseEnv(text)`, die den Inhalt einer `.env`-Datei in ein Objekt umwandelt.

      - Leere Zeilen und Zeilen, die (nach Leerzeichen) mit `#` beginnen, werden ignoriert.
      - Jede andere Zeile wird am **ersten** `=` geteilt. Schlüssel und Wert werden getrimmt.
      - Steht der Wert in doppelten oder einfachen Anführungszeichen, werden diese entfernt.
    starter: |
      function parseEnv(text) {
        const result = {};
        // dein Code
        return result;
      }
    tests:
      - name: liest einfache Paare
        code: |
          assertDeepEqual(parseEnv("APP_NAME=Shop\nAPP_PORT=8000"), { APP_NAME: "Shop", APP_PORT: "8000" })
      - name: ignoriert Kommentare und leere Zeilen
        code: |
          assertDeepEqual(parseEnv("# Kommentar\n\n  # eingerückt\nDEBUG=true\n"), { DEBUG: "true" })
      - name: leerer Text ergibt leeres Objekt
        code: |
          assertDeepEqual(parseEnv(""), {})
      - name: teilt nur am ersten Gleichheitszeichen
        code: |
          assertDeepEqual(parseEnv("DB_URL=postgres://db/app?sslmode=require&x=1"), { DB_URL: "postgres://db/app?sslmode=require&x=1" })
      - name: entfernt Anführungszeichen und Leerzeichen
        code: |
          assertDeepEqual(parseEnv(" APP_NAME = \"Mein Shop\" \nTITLE='Hallo'"), { APP_NAME: "Mein Shop", TITLE: "Hallo" })
    solution: |
      function parseEnv(text) {
        const result = {};
        for (const rawLine of text.split("\n")) {
          const line = rawLine.trim();
          if (line === "" || line.startsWith("#")) continue;
          const index = line.indexOf("=");
          if (index === -1) continue;
          const key = line.slice(0, index).trim();
          let value = line.slice(index + 1).trim();
          const quoted = value.length >= 2 && (value[0] === '"' || value[0] === "'") && value.at(-1) === value[0];
          if (quoted) value = value.slice(1, -1);
          result[key] = value;
        }
        return result;
      }
    hints:
      - "`text.split(\"\\n\")` liefert die Zeilen, `line.indexOf(\"=\")` die Position des ersten Gleichheitszeichens."
      - Prüfe erstes und letztes Zeichen des Werts, bevor du Anführungszeichen entfernst.
---

Dein Projekt soll auf deinem Laptop mit einer lokalen Datenbank laufen, auf dem Testserver mit einer
anderen und in Produktion mit einer dritten. Schreibst du die Adresse fest in den Code, musst du ihn für
jede Umgebung ändern – und das Produktionspasswort stünde für immer in der Git-Historie. Die Lösung:
Konfiguration kommt von **außen**, über Umgebungsvariablen.

## Was Umgebungsvariablen sind

Eine [[umgebungsvariable|Umgebungsvariable]] ist ein Name-Wert-Paar, das ein Prozess von seinem
Elternprozess erbt. Startest du in der [[shell]] ein Programm, bekommt es eine Kopie aller exportierten
Variablen mit.

```bash title="Variablen setzen und lesen"
export APP_ENV=local          # für diese Shell und alle gestarteten Programme
echo "$APP_ENV"               # local
APP_ENV=test node app.js      # nur für diesen einen Befehl
env | grep APP_               # alle Variablen anzeigen, die mit APP_ beginnen
```

Jede Sprache kann sie lesen: Node.js über `process.env.APP_ENV`, PHP über `getenv('APP_ENV')`, Laravel
über `env('APP_ENV')` in den Konfigurationsdateien. Eine besondere Variable kennst du schon: `PATH`
enthält die Ordner, in denen die Shell nach Programmen sucht.

> [!MERKSATZ]
> Code ist überall gleich, Konfiguration unterscheidet sich je Umgebung. Deshalb steht Konfiguration in
> Umgebungsvariablen und nicht im Code.

## .env und .env.example

Dutzende Variablen vor jedem Start von Hand zu exportieren, wäre mühsam. Deshalb gibt es die
[[env-datei|`.env`-Datei]]: eine einfache Textdatei mit `NAME=wert` pro Zeile, die das Framework beim
Start einliest.

![.env.example wird committet, .env bleibt lokal](/assets/entwicklungsumgebung/env-dateien.svg)

| Datei | Inhalt | Im Repository? |
|---|---|---|
| `.env.example` | Alle Variablennamen, harmlose Beispielwerte, leere Platzhalter für Secrets | Ja |
| `.env` | Deine echten, lokalen Werte | Nein – steht in `.gitignore` |

Nach dem Klonen kopierst du die Vorlage einmal und trägst deine Werte ein:

```bash title="Erste Einrichtung"
cp .env.example .env
```

Kommt eine neue Variable hinzu, wird sie in der `.env.example` ergänzt. So sieht jede Person im Diff,
dass sie ihre eigene `.env` anpassen muss.

## Secrets gehören nie ins Repository

Ein [[secret|Secret]] ist jeder Wert, mit dem man Zugriff bekommt: Passwörter, API-Tokens, private
Schlüssel. Was einmal committet und gepusht ist, steckt in der Historie jedes Klons – Löschen im
nächsten Commit hilft nicht mehr.

> [!FEHLER]
> **Die `.env` aus Versehen committet.** Passiert schnell mit `git add .`, wenn die `.gitignore` fehlt.
> Ein geleaktes Secret ist nicht zu retten: Du musst es beim Anbieter **sofort ungültig machen und neu
> erzeugen**. Prüfe neue Repositorys deshalb mit `git check-ignore -v .env`.

Auch die `.env.example` enthält keine echten Werte – nur Platzhalter wie `API_TOKEN=<dein-token>` oder
ein leeres `DB_PASSWORD=`. In Produktion kommen Secrets aus einem Secret-Manager der Hosting-Plattform,
nicht aus einer Datei.

## Variablen sicher lesen

In Shell-Skripten hilft die Parameter-Erweiterung, mit fehlenden Werten umzugehen:

| Ausdruck | Bedeutung |
|---|---|
| `${PORT:-8000}` | Wert von `PORT`, sonst `8000` |
| `${APP_NAME:?APP_NAME fehlt}` | Abbruch mit Meldung, wenn `APP_NAME` leer ist |
| `set -a; . ./.env; set +a` | `.env` laden und alle Variablen automatisch exportieren |

Für Secrets gilt: **kein Standardwert**. Fehlt das Datenbank-Passwort, soll das Programm laut abbrechen,
statt still mit einem falschen Wert weiterzulaufen.

> [!PRAXIS]
> In Laravel-Projekten liest nur `config/*.php` die Umgebung mit `env()`; der übrige Code nutzt
> `config('app.name')`. So gibt es eine zentrale Stelle, an der alle Variablen und ihre Standardwerte
> stehen – die perfekte Vorlage für die `.env.example`.

## direnv: Variablen automatisch pro Ordner

Das Framework liest seine `.env` selbst. Für Befehle im Terminal (Skripte, `make`) lädt [[direnv]] die
Variablen automatisch, sobald du den Projektordner betrittst – und entfernt sie beim Verlassen wieder.
Einmalig kommt `eval "$(direnv hook zsh)"` in die `~/.zshrc`, im Projekt liegt eine `.envrc`:

```bash title=".envrc"
PATH_add bin            # ./bin vorne an PATH hängen
dotenv_if_exists        # .env laden, falls vorhanden
export APP_ENV=local
```

Weil eine `.envrc` beliebigen Shell-Code enthält, ist jede neue oder geänderte Datei **blockiert**, bis
du sie gelesen und mit `direnv allow` freigegeben hast. Eine `.envrc` ohne Secrets darf committet
werden. Wer nur ein Werkzeug pflegen will, lädt die `.env` stattdessen über mise mit `_.file = ".env"`
im Abschnitt `[env]` der `mise.toml`.

## Zusammenfassung

- Umgebungsvariablen sind Name-Wert-Paare, die Prozesse erben; `export` macht sie für Kindprozesse sichtbar.
- Konfiguration (Adressen, Ports, Zugangsdaten) gehört in Variablen, nicht in den Code.
- `.env.example` wird committet und listet alle Variablen; `.env` mit echten Werten steht in `.gitignore`.
- Secrets kommen nie ins Repository – ein geleaktes Secret muss sofort erneuert werden.
- `${VAR:-standard}` setzt Standardwerte, `${VAR:?meldung}` erzwingt Pflichtvariablen.
- direnv lädt die `.envrc` beim Betreten eines Ordners – erst nach der Freigabe mit `direnv allow`.
