---
title: Ein Qualitäts-Gate für beide Seiten
summary: Formatter, Linter, Typprüfung und Tests zu einem einzigen Befehl bündeln – lokal, vor dem Push und in der CI.
duration: 20
sources:
  - title: Laravel Pint
    url: https://laravel.com/docs/13.x/pint
  - title: Oxlint – Dokumentation
    url: https://oxc.rs/docs/guide/usage/linter
  - title: Larastan (PHPStan für Laravel)
    url: https://github.com/larastan/larastan
  - title: Composer – Scripts
    url: https://getcomposer.org/doc/articles/scripts.md
quiz:
  - type: match
    question: Ordne jedem Werkzeug seine Aufgabe zu.
    pairs:
      - { left: "Pint", right: "formatiert PHP-Code einheitlich" }
      - { left: "PHPStan / Larastan", right: "findet Typfehler im PHP-Code, ohne ihn auszuführen" }
      - { left: "Oxlint", right: "findet verdächtige Muster im JavaScript/TypeScript-Code" }
      - { left: "tsc", right: "prüft die TypeScript-Typen" }
      - { left: "Pest", right: "prüft das Verhalten durch Tests" }
    explanation: Formatter, Linter, Typprüfung und Tests finden jeweils andere Fehlerarten – zusammen bilden sie das Gate.
  - type: single
    question: Was ist der Vorteil eines Skripts wie `composer check`?
    options:
      - Es ersetzt die CI.
      - Lokal, im Git-Hook und in der CI läuft exakt dieselbe Prüfung – niemand muss sich die Einzelbefehle merken.
      - Es macht den Code schneller.
    answer: 1
    explanation: Ein Befehl, überall gleich. Weichen lokale Prüfung und CI voneinander ab, gibt es Überraschungen im Pull Request.
  - type: multiple
    question: Welche Aussagen über ein Qualitäts-Gate stimmen?
    options:
      - Es soll schnell genug sein, dass man es vor jedem Push ausführt.
      - Es darf Warnungen dauerhaft ignorieren, solange der Build grün ist.
      - Ein Formatter beendet Stil-Diskussionen im Code-Review.
      - In der CI ist es die letzte Hürde vor dem Merge.
    answers: [0, 2, 3]
    explanation: Ignorierte Warnungen werden zu Rauschen, das niemand mehr liest. Lieber eine Regel abschalten als dauerhaft ignorieren.
tasks:
  - id: lint-gate
    type: terminal
    title: Ein Gate für ein Node-Projekt
    description: |
      Im Ordner `lint-gate` liegt ein kleines Node-Projekt mit Oxlint und einem Test (`node --test`). Im Code
      stecken zwei Probleme, die der Linter findet. Klicke zuerst auf **Aufgabe vorbereiten**.

      1. Ergänze in `package.json` zwei Skripte:
         - `lint`: `oxlint --deny-warnings src` (Warnungen zählen als Fehler)
         - `check`: führt nacheinander `npm run lint` und `npm test` aus (verbunden mit `&&`)
      2. Führe `npm run check` aus und behebe die Funde in `src/preise.js`, **ohne** die Funktion zu verändern.
      3. `npm run check` muss am Ende grün sein.

      Die Prüfung testet danach, ob dein Gate wirklich zuschlägt: Sie baut kurz einen Fehler ein und erwartet,
      dass `npm run check` rot wird.
    workdir: lint-gate
    setup: |
      npm init -y >/dev/null
      timeout 120 npm install -D --no-audit --no-fund oxlint >/dev/null 2>&1
      mkdir -p src test
      cat > src/preise.js <<'EOF'
      export function gesamtpreis(plaetze, preisProPlatz) {
        const rabatt = 0.1
        debugger
        if (plaetze <= 0) return 0
        return plaetze * preisProPlatz
      }
      EOF
      cat > test/preise.test.js <<'EOF'
      import { test } from 'node:test'
      import assert from 'node:assert/strict'
      import { gesamtpreis } from '../src/preise.js'

      test('rechnet Plätze mal Preis', () => {
        assert.equal(gesamtpreis(3, 12), 36)
      })

      test('keine Plätze kosten nichts', () => {
        assert.equal(gesamtpreis(0, 12), 0)
      })
      EOF
      jq '.type = "module" | .scripts = { "test": "node --test" }' package.json > package.json.neu && mv package.json.neu package.json
      printf '%s\n' 'node_modules' > .gitignore
    checks:
      - type: command
        run: jq -r '.scripts.lint // ""' package.json
        stdout_matches: "^oxlint .*--deny-warnings.*src|^oxlint .*src.*--deny-warnings"
        message: "Das Skript lint fehlt oder prüft nicht streng: Es soll oxlint --deny-warnings src ausführen."
      - type: command
        run: jq -r '.scripts.check // ""' package.json
        stdout_matches: "npm run lint.*&&.*npm (run )?test"
        message: "Das Skript check soll npm run lint && npm test ausführen."
      - type: command
        run: npm run check >/dev/null 2>&1 && echo gruen
        stdout_equals: gruen
        message: npm run check ist noch rot. Führe es aus und behebe, was der Linter oder die Tests melden.
      - type: command
        run: grep -cE 'debugger|rabatt' src/preise.js || true
        stdout_matches: "^0\\s*$"
        message: In src/preise.js stehen noch die ungenutzte Variable rabatt oder die debugger-Anweisung.
      - type: command
        run: >-
          npm run check >/dev/null 2>&1 || { echo rot; exit 0; }; cp src/preise.js .preise.bak; printf 'export const unbenutzt = () => { debugger }\n' >> src/preise.js;
          npm run check >/dev/null 2>&1 && r=durchgerutscht || r=gestoppt; mv .preise.bak src/preise.js; echo $r
        stdout_equals: gestoppt
        message: Dein Gate lässt eine debugger-Anweisung durch. Prüfe, ob check wirklich npm run lint ausführt und lint --deny-warnings nutzt.
    hints:
      - "Skripte setzt du bequem mit `npm pkg set scripts.lint=\"oxlint --deny-warnings src\"`."
      - "`npm pkg set scripts.check=\"npm run lint && npm test\"`"
      - Lösche in src/preise.js die Zeilen mit rabatt und debugger – an der Rechnung selbst ändert sich nichts.
    solution: |
      ```bash
      cd lint-gate
      npm pkg set scripts.lint="oxlint --deny-warnings src"
      npm pkg set scripts.check="npm run lint && npm test"
      sed -i '/rabatt/d; /debugger/d' src/preise.js
      npm run check
      ```
  - id: was-laeuft-wo
    type: dragdrop
    title: Was läuft wo?
    description: Ordne jede Prüfung dem Moment zu, in dem sie in Vereinskurse läuft.
    targets:
      - { id: editor, label: Beim Speichern im Editor }
      - { id: hook, label: Vor dem Push (Git-Hook) }
      - { id: ci, label: In der CI bei jedem Pull Request }
    items:
      - { label: Formatter formatiert die Datei, target: editor }
      - { label: Schneller Lint der geänderten Dateien, target: hook }
      - { label: composer check mit allen Tests auf frischer Maschine, target: ci }
      - { label: npm ci und Produktions-Build, target: ci }
      - { label: Typprüfung im Hintergrund mit Unterstreichungen, target: editor }
    hints:
      - Je später der Moment, desto gründlicher und langsamer darf die Prüfung sein.
---
Du hast jetzt eine API mit Tests und ein Frontend mit Build. Jede Seite hat eigene Prüfwerkzeuge – und
niemand will sich merken, welche fünf Befehle vor einem Push laufen müssen. Ein **Qualitäts-Gate** bündelt sie
zu einem einzigen Befehl, der lokal, im Git-Hook und in der CI genau gleich läuft.

## Vier Arten von Prüfungen

| Art | PHP (`api/`) | TypeScript (`web/`) | Findet |
|---|---|---|---|
| [[formatter\|Formatter]] | [[pint\|Pint]] | Prettier (optional) | uneinheitlichen Stil |
| [[linter\|Linter]] | – | [[oxlint\|Oxlint]] | verdächtige Muster, ungenutzten Code |
| [[statische-analyse\|Statische Analyse]] | PHPStan mit [[larastan\|Larastan]] | `tsc` | Typfehler |
| Tests | Pest | Build + später Vitest | falsches Verhalten |

Das Vite-Template bringt Oxlint bereits mit (`npm run lint`), und `npm run build` startet vorher `tsc -b`.
Für PHP ist Pint in jedem Laravel-Projekt dabei. PHPStan mit Larastan installierst du bei Bedarf als
Dev-Abhängigkeit – für Vereinskurse ist es ein guter nächster Schritt.

> [!MERKSATZ]
> Formatter beenden Stil-Diskussionen, Linter und Typprüfung finden Fehler ohne Ausführung, Tests prüfen
> Verhalten. Erst zusammen sind sie ein [[quality-gate|Qualitäts-Gate]].

## Ein Befehl pro Seite

Für die API definierst du ein Composer-Skript, fürs Frontend reichen die vorhandenen npm-Skripte:

```json title="api/composer.json (Ausschnitt)"
"scripts": {
    "check": [
        "@php vendor/bin/pint --test",
        "@php artisan test"
    ]
}
```

```bash title="Das komplette Gate"
cd api && composer check
cd web && npm run lint && npm run build
```

`pint --test` ändert nichts, sondern meldet nur Abweichungen – genau richtig für ein Gate. Lokal führst du
vorher einfach `./vendor/bin/pint` aus, das korrigiert den Stil selbst.

> [!FEHLER]
> Im Gate `pint` ohne `--test` aufrufen. Dann formatiert die CI den Code, das Gate ist immer grün, und die
> unformatierten Dateien landen trotzdem im Repository.

## Wann was läuft

Nicht jede Prüfung muss bei jedem Tastendruck laufen. Die Faustregel: Je später der Moment, desto
gründlicher darf es sein.

1. **Im Editor:** Formatieren beim Speichern, Typfehler als Unterstreichung.
2. **Vor dem Push:** ein [[git-hook|Git-Hook]] startet das schnelle Gate – mit Werkzeugen wie
   [[lefthook|Lefthook]] oder [[husky|Husky]] ist er für das ganze Team eingerichtet.
3. **In der CI:** das komplette Gate auf einer frischen Maschine, für jeden Pull Request.

Die CI ist die einzige Stufe, die niemand überspringen kann. Hooks und Editor sorgen dafür, dass sie selten
rot wird.

## Ein Gate muss zuschlagen

Ein Gate, das immer grün ist, ist wertlos. Prüfe es deshalb einmal bewusst: Bau einen Stilfehler, eine
`debugger`-Anweisung oder einen falschen Test ein und schau, ob der Befehl wirklich **fehlschlägt**
([[exit-code|Exit-Code]] ungleich 0). Oxlint meldet manche Funde nur als Warnung – mit `--deny-warnings`
werden sie zu Fehlern.

> [!PRAXIS]
> Teams führen neue Linter-Regeln oft schrittweise ein: erst als Warnung, und sobald der Bestand bereinigt
> ist, als Fehler. Dauerhaft ignorierte Warnungen liest nach zwei Wochen niemand mehr.

## Checkliste für dein Gate

1. Ein Befehl pro Seite: `composer check` und `npm run lint && npm run build`.
2. Das Gate prüft nur und ändert nichts.
3. Ein absichtlich eingebauter Fehler macht es rot.
4. Die CI ruft exakt dieselben Befehle auf wie du lokal.
5. Neue Regeln kommen bewusst dazu – nie als dauerhaft ignorierte Warnung.

## Zusammenfassung

- **Formatter, Linter, Typprüfung und Tests** finden unterschiedliche Fehlerarten.
- Pro Seite gibt es **einen Befehl**: `composer check` bzw. `npm run lint && npm run build`.
- Im Gate prüfst du nur (`pint --test`), lokal darfst du korrigieren (`pint`).
- Editor, Git-Hook und CI prüfen gestaffelt – die CI ist die letzte, verbindliche Hürde.
- Teste dein Gate: Ein eingebauter Fehler muss es **rot** machen.
