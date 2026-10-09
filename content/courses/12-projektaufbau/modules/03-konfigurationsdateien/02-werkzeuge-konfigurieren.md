---
title: Werkzeuge konfigurieren
summary: tsconfig.json, vite.config.ts, .editorconfig, phpunit.xml, phpstan.neon und docker-compose.yml lesen und verstehen.
duration: 25
sources:
  - title: TypeScript – What is a tsconfig.json
    url: https://www.typescriptlang.org/docs/handbook/tsconfig-json.html
  - title: Vite – Configuring Vite
    url: https://vite.dev/config/
  - title: EditorConfig
    url: https://editorconfig.org/
  - title: PHPStan – Config Reference
    url: https://phpstan.org/config-reference
  - title: PHPUnit – The XML Configuration File
    url: https://docs.phpunit.de/en/12.0/configuration.html
  - title: Docker – Compose file reference
    url: https://docs.docker.com/reference/compose-file/
quiz:
  - type: match
    question: Welche Datei konfiguriert welches Werkzeug?
    pairs:
      - { left: "tsconfig.json", right: "TypeScript-Compiler" }
      - { left: "vite.config.ts", right: "Dev-Server und Build des Frontends" }
      - { left: ".editorconfig", right: "Einrückung und Zeilenenden im Editor" }
      - { left: "phpunit.xml", right: "PHP-Tests" }
      - { left: "phpstan.neon", right: "Statische Analyse von PHP" }
      - { left: "docker-compose.yml", right: "Container wie Datenbank und Mailserver" }
    explanation: Fast jedes Werkzeug hat eine eigene Konfigurationsdatei in der Projektwurzel. Am Namen erkennst du, welches.
  - type: find-bug
    question: Vite startet, aber React-Komponenten werden nicht korrekt verarbeitet. Welche Zeile ist falsch?
    language: ts
    code: |
      import { defineConfig } from 'vite'
      import react from '@vitejs/plugin-react'

      export default defineConfig({
        plugins: [react],
      })
    bug_line: 5
    explanation: Plugins sind Funktionen, die ein Plugin-Objekt erzeugen. Richtig ist plugins mit react() – also mit Klammern.
  - type: single
    question: 'Was bewirkt `"strict": true` in der tsconfig.json?'
    options:
      - TypeScript bricht beim ersten Tippfehler im Editor ab.
      - Eine Gruppe strenger Typprüfungen wird eingeschaltet, z. B. gegen versehentliches null.
      - Der Code wird schneller ausgeführt.
      - Nur Dateien in src/ werden geprüft.
    answer: 1
    explanation: strict schaltet mehrere Prüfungen auf einmal ein, etwa strictNullChecks. In neuen Projekten ist das der empfohlene Standard.
  - type: cloze
    text: In der phpstan.neon legt `___` fest, wie streng PHPStan prüft. Unter `___` stehen die Ordner, die analysiert werden.
    blanks:
      - [level]
      - [paths]
    explanation: Ein höheres Level findet mehr Probleme. Teams erhöhen es oft Schritt für Schritt.
tasks:
  - id: werkzeuge-einstellen
    type: terminal
    title: TypeScript, PHPStan und EditorConfig einstellen
    description: |
      Im Ordner `werkzeuge` liegt ein kleines Projekt mit `tsconfig.json`, einer PHP-Klasse in `app/`
      und noch ohne weitere Konfiguration.

      1. Schalte in der `tsconfig.json` unter `compilerOptions` den strengen Modus ein (`"strict": true`).
      2. Lege eine `phpstan.neon` an, die mit **Level 6** den Ordner `app` prüft.
      3. Führe `phpstan analyse` aus – es sollte `[OK] No errors` melden.
      4. Lege eine `.editorconfig` an mit `root = true` und für alle Dateien (`[*]`):
         `indent_style = space`, `indent_size = 4` und `end_of_line = lf`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: werkzeuge
    setup: |
      mkdir -p app src
      cat > tsconfig.json <<'JSON'
      {
        "compilerOptions": {
          "target": "ES2022",
          "module": "ESNext",
          "jsx": "react-jsx",
          "strict": false,
          "noEmit": true
        },
        "include": ["src"]
      }
      JSON
      cat > app/Greeter.php <<'PHP'
      <?php

      declare(strict_types=1);

      final class Greeter
      {
          public function greet(string $name): string
          {
              return 'Hallo ' . $name;
          }
      }
      PHP
    checks:
      - type: command
        run: jq -r '.compilerOptions.strict' tsconfig.json
        stdout_equals: "true"
        message: In tsconfig.json steht unter compilerOptions noch nicht "strict" true.
      - type: file_contains
        path: phpstan.neon
        pattern: "^\\s+level:\\s*6\\s*$"
        message: phpstan.neon braucht unter parameters die Zeile level 6.
      - type: file_contains
        path: phpstan.neon
        pattern: "^\\s+-\\s*app/?\\s*$"
        message: phpstan.neon soll unter paths den Ordner app aufführen.
      - type: command
        run: phpstan analyse --no-progress --no-ansi
        message: phpstan analyse schlägt fehl. Prüfe die Einrückung deiner phpstan.neon (Leerzeichen, keine Tabs).
      - type: file_contains
        path: .editorconfig
        pattern: "^root\\s*=\\s*true"
        message: .editorconfig braucht die Zeile root = true ganz oben.
      - type: file_contains
        path: .editorconfig
        pattern: "^indent_style\\s*=\\s*space"
        message: In .editorconfig fehlt indent_style = space.
      - type: file_contains
        path: .editorconfig
        pattern: "^end_of_line\\s*=\\s*lf"
        message: In .editorconfig fehlt end_of_line = lf.
    hints:
      - "`jq '.compilerOptions.strict = true' tsconfig.json > t.json && mv t.json tsconfig.json` ändert den Wert ohne Editor."
      - "Die phpstan.neon hat drei Ebenen: `parameters:`, darunter eingerückt `level: 6` und `paths:`, darunter `- app`."
      - In NEON und YAML zählt die Einrückung. Nutze Leerzeichen, keine Tabs.
    solution: |
      ```bash
      cd werkzeuge
      jq '.compilerOptions.strict = true' tsconfig.json > t.json && mv t.json tsconfig.json
      printf 'parameters:\n    level: 6\n    paths:\n        - app\n' > phpstan.neon
      phpstan analyse
      printf 'root = true\n\n[*]\nindent_style = space\nindent_size = 4\nend_of_line = lf\n' > .editorconfig
      ```
  - id: einstellung-finden
    type: dragdrop
    title: Wo stellst du das ein?
    description: Ordne jede Einstellung der Datei zu, in der du sie änderst.
    targets:
      - { id: tsconfig, label: tsconfig.json }
      - { id: vite, label: vite.config.ts }
      - { id: editorconfig, label: .editorconfig }
      - { id: phpunit, label: phpunit.xml }
      - { id: compose, label: docker-compose.yml }
    items:
      - { label: Strenge Typprüfung einschalten, target: tsconfig }
      - { label: Port des Dev-Servers ändern, target: vite }
      - { label: Zwei statt vier Leerzeichen Einrückung, target: editorconfig }
      - { label: Tests mit einer In-Memory-Datenbank ausführen, target: phpunit }
      - { label: PostgreSQL-Datenbank lokal starten, target: compose }
      - { label: Das React-Plugin aktivieren, target: vite }
---
Neben `package.json` und `composer.json` findest du in der Projektwurzel eine Handvoll weiterer
Dateien. Jede gehört zu genau einem Werkzeug. Du musst sie nicht auswendig kennen – aber du solltest
erkennen, wofür sie da sind und welche Zeilen wichtig sind.

Das Lesen folgt immer demselben Muster: Zuerst erkennst du am Dateinamen das Werkzeug. Dann suchst du
die zwei, drei Einstellungen, die das Verhalten am stärksten prägen – etwa wie streng geprüft wird oder
welche Ordner betroffen sind. Alles andere schlägst du bei Bedarf in der offiziellen Dokumentation nach.

## tsconfig.json – der TypeScript-Compiler

Die [[tsconfig|tsconfig.json]] sagt [[typescript|TypeScript]], welche Dateien es prüft und wie streng.

```json title="tsconfig.json (vereinfacht)"
{
  "compilerOptions": {
    "target": "ES2022",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

| Option | Bedeutung |
|---|---|
| `target` | welche JavaScript-Version erzeugt wird |
| `jsx` | wie JSX in React-Dateien übersetzt wird |
| `strict` | schaltet alle strengen Prüfungen ein |
| `noEmit` | nur prüfen, keine Dateien schreiben (das übernimmt Vite) |
| `include` | welche Ordner geprüft werden |

Vite-Projekte teilen die Datei oft in `tsconfig.app.json` (für `src/`) und `tsconfig.node.json`
(für `vite.config.ts`). Die `tsconfig.json` verweist dann nur auf beide.

## vite.config.ts – Dev-Server und Build

```ts title="vite.config.ts"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
})
```

Hier stehen [[plugin|Plugins]] (etwa für React oder Tailwind), der Port des [[dev-server|Dev-Servers]]
und Build-Optionen. Vieles funktioniert ohne Eintrag – Konvention vor Konfiguration.

Die Datei ist selbst TypeScript-Code und wird beim Start ausgeführt. Deshalb kannst du darin auch Werte
berechnen, etwa einen Pfad-Alias `@` für den Ordner `src/`. Ein häufiger Eintrag in Full-Stack-Projekten
ist `server.proxy`: Er leitet Anfragen an `/api` vom Dev-Server an das lokale Backend weiter.

## .editorconfig – für alle Editoren gleich

Die [[editorconfig|.editorconfig]] sorgt dafür, dass VS Code, PhpStorm und Vim gleich einrücken.

```ini title=".editorconfig"
root = true

[*]
indent_style = space
indent_size = 4
end_of_line = lf
insert_final_newline = true

[*.{js,ts,tsx,json}]
indent_size = 2
```

> [!MERKSATZ]
> Konfigurationsdateien werden committet. Nur so arbeitet jede Person mit denselben Regeln –
> egal welcher Editor, welches Betriebssystem.

## phpunit.xml und phpstan.neon – PHP-Werkzeuge

[[phpunit|PHPUnit]] liest `phpunit.xml`: welche Test-Ordner es gibt und welche Umgebungsvariablen beim
Testen gelten.

```xml title="phpunit.xml (Ausschnitt)"
<testsuites>
    <testsuite name="Feature">
        <directory>tests/Feature</directory>
    </testsuite>
</testsuites>
<php>
    <env name="APP_ENV" value="testing"/>
    <env name="DB_DATABASE" value=":memory:"/>
</php>
```

[[phpstan|PHPStan]] betreibt [[statische-analyse|statische Analyse]]: Es findet Fehler, ohne den Code
auszuführen. Die Datei `phpstan.neon` nutzt das YAML-ähnliche Format NEON:

```yaml title="phpstan.neon"
parameters:
    level: 6
    paths:
        - app
```

> [!FEHLER]
> **Tabs statt Leerzeichen in NEON oder YAML.** Die Einrückung bestimmt die Struktur. Ein Tab oder eine
> falsche Anzahl Leerzeichen führt zu kryptischen Fehlern. Die `.editorconfig` hilft, das zu vermeiden.

## docker-compose.yml – die Umgebung drumherum

Viele Projekte brauchen eine Datenbank oder einen Mailserver. Mit [[docker-compose|Docker Compose]]
startest du sie mit einem Befehl in [[container|Containern]]:

```yaml title="docker-compose.yml"
services:
  db:
    image: postgres:18
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - db-data:/var/lib/postgresql
volumes:
  db-data:
```

`docker compose up -d` startet alles. Der neuere Standardname ist `compose.yaml`, der ältere
`docker-compose.yml` funktioniert weiterhin. Beachte `${DB_PASSWORD}`: Das Passwort steht nicht in
der Datei, sondern kommt aus der `.env`.

> [!PRAXIS]
> Öffnest du ein neues Projekt, lies die Konfigurationsdateien kurz quer. Nach fünf Minuten weißt du:
> TypeScript streng oder locker? Welches PHPStan-Level? Welche Datenbank? Das spart später viele
> Überraschungen.

## Zusammenfassung

- `tsconfig.json` steuert TypeScript; `strict: true` ist der empfohlene Standard.
- `vite.config.ts` enthält Plugins, Dev-Server- und Build-Einstellungen.
- `.editorconfig` vereinheitlicht Einrückung und Zeilenenden über alle Editoren.
- `phpunit.xml` definiert Test-Ordner und Test-Umgebung, `phpstan.neon` Level und Pfade.
- `docker-compose.yml` bzw. `compose.yaml` startet Dienste wie die Datenbank.
- Alle diese Dateien werden committet; Geheimnisse kommen aus der `.env`.
