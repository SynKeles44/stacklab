---
title: Formatieren und Linten mit Biome
summary: Wie Biome JavaScript und TypeScript in einem einzigen, schnellen Werkzeug formatiert und lintet, wie du biome.json konfigurierst und sichere von unsicheren Fixes unterscheidest – und wo ESLint und Prettier stehen.
duration: 25
sources:
  - title: Biome – Getting Started
    url: https://biomejs.dev/guides/getting-started/
  - title: Biome – Konfiguration
    url: https://biomejs.dev/reference/configuration/
  - title: Biome – CLI
    url: https://biomejs.dev/reference/cli/
  - title: Biome – Linter-Regeln
    url: https://biomejs.dev/linter/rules/
  - title: Biome – Suppressions
    url: https://biomejs.dev/analyzer/suppressions/
quiz:
  - type: single
    question: Welcher Biome-Befehl gehört in die CI-Pipeline?
    options: ["biome ci", "biome check --write", "biome init", "biome format --write"]
    answer: 0
    explanation: "`biome ci` prüft Format, Lint und Import-Sortierung, verändert nichts und endet bei Fehlern mit einem Exit-Code ungleich 0."
  - type: multiple
    question: Welche Aussagen über Fixes in Biome stimmen?
    options:
      - "`--write` wendet nur sichere Fixes an, die das Verhalten nicht ändern."
      - "`==` → `===` ist ein unsicherer Fix, weil sich das Ergebnis eines Vergleichs ändern kann."
      - "Unsichere Fixes wendest du mit `--write --unsafe` an und prüfst sie danach."
      - "Biome repariert jeden Fehler automatisch."
    answers: [0, 1, 2]
    explanation: Sichere Fixes kann Biome blind anwenden. Unsichere können die Bedeutung ändern – du musst sie bewusst anfordern und kontrollieren.
  - type: find-bug
    question: "`biome lint` meldet in dieser Datei einen Fehler (nicht nur eine Warnung). In welcher Zeile?"
    language: js
    code: |
      export function isAdmin(user) {
        const role = user.role ?? "guest";
        if (role == "admin") {
          return true;
        }
        return false;
      }
    bug_line: 3
    explanation: "`noDoubleEquals` aus dem empfohlenen Regelsatz meldet `==` als Fehler. Nur der Vergleich mit `null` ist erlaubt."
  - type: match
    question: Ordne jeden Konfigurationsteil der biome.json seiner Aufgabe zu.
    pairs:
      - { left: "formatter", right: "Einrückung, Zeilenbreite, Zeilenende" }
      - { left: "linter.rules", right: "Welche Lint-Regeln mit welcher Stufe gelten" }
      - { left: "assist", right: "Aktionen wie das Sortieren von Imports" }
      - { left: "files.includes", right: "Welche Dateien Biome überhaupt anfasst" }
    explanation: Eine einzige Datei steuert Formatter, Linter und Assist – bei ESLint und Prettier waren das mehrere Dateien.
tasks:
  - id: biome-einrichten
    type: terminal
    title: Biome in einem JavaScript-Projekt einrichten
    description: |
      Im Ordner `biome-einrichten` liegt ein kleines JavaScript-Projekt (`src/cart.js`) ohne Qualitätswerkzeuge.

      1. Installiere Biome mit exakter Version als Entwicklungsabhängigkeit: `npm i -D -E @biomejs/biome`.
      2. Erzeuge mit `npx biome init` eine `biome.json`.
      3. Passe sie an: Einrückung mit Leerzeichen (`"indentStyle": "space"`), einfache Anführungszeichen in
         JavaScript (`"quoteStyle": "single"`) und die Regel `noVar` aus der Gruppe `suspicious` als `"error"`.
      4. Lass Biome mit `npx biome check --write` alles Sichere reparieren.
      5. Behebe die übrigen Meldungen. Den unsicheren Fix für `==` darfst du mit `--unsafe` anwenden – lies den
         Diff aber vorher.
      6. Am Ende muss `npx biome ci` mit Exit-Code 0 enden.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: biome-einrichten
    setup: |
      cat > package.json <<'EOF'
      {
        "name": "biome-uebung",
        "private": true,
        "type": "module"
      }
      EOF
      mkdir -p src
      cat > src/cart.js <<'EOF'
      export function total(items) {
          var sum = 0
          for (const item of items) {
              if (item.quantity == 0) continue
              sum += item.price * item.quantity
          }
          return sum
      }

      export function label(cents) {
          return (cents / 100).toFixed(2).replace(".", ",") + " €"
      }
      EOF
    checks:
      - type: command
        run: test -x node_modules/.bin/biome && jq -re '.devDependencies["@biomejs/biome"] | test("^[0-9]")' package.json
        message: Biome ist noch nicht (mit exakter Version, ohne ^) installiert. Nutze npm i -D -E @biomejs/biome.
      - type: command
        run: jq -r '.formatter.indentStyle' biome.json
        stdout_equals: space
        message: "Setze in der biome.json unter formatter \"indentStyle\": \"space\"."
      - type: command
        run: jq -r '.javascript.formatter.quoteStyle' biome.json
        stdout_equals: single
        message: "Setze unter javascript.formatter \"quoteStyle\": \"single\"."
      - type: command
        run: jq -r '.linter.rules.suspicious.noVar' biome.json
        stdout_equals: error
        message: "Schalte die Regel noVar als Fehler ein: linter.rules.suspicious.noVar = \"error\"."
      - type: command
        run: ./node_modules/.bin/biome ci
        message: npx biome ci meldet noch Probleme. Führe npx biome check --write aus und behebe den Rest (var, ==).
      - type: command
        run: "node --input-type=module -e \"import { total, label } from './src/cart.js'; console.log(total([{ price: 250, quantity: 2 }, { price: 99, quantity: 0 }]), label(1299));\""
        stdout_equals: "500 12,99 €"
        message: Das Verhalten von total() oder label() hat sich verändert. Prüfe deine Änderungen.
    hints:
      - "Die Struktur: `\"formatter\": { \"indentStyle\": \"space\" }`, `\"javascript\": { \"formatter\": { \"quoteStyle\": \"single\" } }`, `\"linter\": { \"rules\": { \"suspicious\": { \"noVar\": \"error\" } } }` – `preset` darf daneben stehen bleiben."
      - "`var` ersetzt du durch `let`, weil `sum` sich ändert. Der Fix ist unsicher, Biome macht ihn mit `--unsafe`."
      - "`npx biome check --write --unsafe` wendet auch die unsicheren Fixes an. Kontrolliere danach `src/cart.js`."
    solution: |
      ```bash
      cd biome-einrichten
      npm i -D -E @biomejs/biome
      npx biome init
      jq '.formatter.indentStyle = "space"
        | .javascript.formatter.quoteStyle = "single"
        | .linter.rules.suspicious.noVar = "error"' biome.json > biome.tmp && mv biome.tmp biome.json
      npx biome check --write
      npx biome check
      npx biome check --write --unsafe
      cat src/cart.js
      npx biome ci
      ```
  - id: biome-befehle
    type: dragdrop
    title: Welcher Befehl wofür?
    description: Ordne jede Situation dem passenden Biome-Befehl zu.
    targets:
      - { id: write, label: "biome check --write" }
      - { id: ci, label: "biome ci" }
      - { id: staged, label: "biome check --staged --write" }
      - { id: format, label: "biome format --write" }
    items:
      - { label: "Lokal alles Sichere reparieren: Format, Lint, Imports", target: write }
      - { label: "Pull-Request-Prüfung in GitHub Actions", target: ci }
      - { label: "Pre-Commit-Hook, der nur vorgemerkte Dateien anfasst", target: staged }
      - { label: "Nur die Formatierung anpassen, Lint-Regeln egal", target: format }
    hints:
      - "`check` kombiniert Formatter, Linter und Assist. `format` macht nur den Formatter."
      - "`--staged` schaut auf Git-Vorgemerktes – praktisch für Hooks."
---
Lange brauchte ein JavaScript-Projekt zwei Werkzeuge mit je eigener Konfiguration, eigenen Plugins und
Konflikten untereinander: **ESLint** zum Linten und **Prettier** zum Formatieren. [[biome|Biome]] macht
beides in einem Programm, mit einer Datei – und deutlich schneller. In dieser Lektion richtest du es ein.

## Biome, ESLint und Prettier

| | ESLint + Prettier | Biome |
|---|---|---|
| Werkzeuge | Zwei | Eins |
| Konfiguration | `eslint.config.js`, `.prettierrc`, Plugins | `biome.json` |
| Geschrieben in | JavaScript | Rust – sehr schnell |
| Sprachen | Über Plugins fast alles | JS, TS, JSX, JSON, CSS, GraphQL u. a. |

[[eslint|ESLint]] hat das größte Ökosystem an Regeln und Plugins und ist in vielen bestehenden Projekten
gesetzt. [[prettier|Prettier]] ist der bekannteste Formatter. Für neue Projekte ist Biome eine sehr gute Wahl,
weil es mit einer Datei auskommt. Biome kann bestehende Einstellungen sogar übernehmen:
`npx biome migrate eslint` und `npx biome migrate prettier`.

> [!MERKSATZ]
> Ein Projekt, ein Formatter, ein Linter. Ob das Biome oder ESLint plus Prettier ist, ist zweitrangig –
> wichtig ist, dass alle dasselbe verwenden und die Konfiguration im Repository liegt.

## Installieren und einrichten

```bash title="Terminal"
npm i -D -E @biomejs/biome   # -E = exakte Version, ohne ^
npx biome init               # legt biome.json an
```

Die exakte Version ist Absicht: Schon ein Patch-Update kann die Formatierung minimal ändern. Mit einer festen
Version formatieren alle im Team und die CI garantiert gleich.

> [!ACHTUNG]
> Das Paket heißt `@biomejs/biome`, der Befehl nur `biome`. Ist Biome nicht im Projekt installiert, lädt
> `npx biome` ein **ganz anderes**, fremdes npm-Paket namens `biome` herunter. Installiere deshalb immer zuerst
> lokal – dann findet `npx` den richtigen Befehl in `node_modules/.bin`.

Die erzeugte Datei sieht ungefähr so aus:

```json title="biome.json"
{
  "$schema": "https://biomejs.dev/schemas/2.5.15/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { "includes": ["src/**", "!**/dist"] },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2 },
  "linter": {
    "enabled": true,
    "rules": {
      "preset": "recommended",
      "suspicious": { "noVar": "error", "noConsole": "warn" }
    }
  },
  "javascript": { "formatter": { "quoteStyle": "single" } },
  "assist": { "enabled": true, "actions": { "source": { "organizeImports": "on" } } }
}
```

- **`vcs`** – mit `useIgnoreFile` überspringt Biome alles aus der `.gitignore`.
- **`files.includes`** – Muster mit `!` schließen aus.
- **`linter.rules`** – `preset: "recommended"` ist der empfohlene [[regelsatz|Regelsatz]]; darunter stellst du
  einzelne Regeln pro Gruppe auf `"off"`, `"warn"` oder `"error"`.

## Die Befehle

| Befehl | Was er tut |
|---|---|
| `biome format --write` | Nur formatieren |
| `biome lint` | Nur Lint-Regeln prüfen |
| `biome check` | Format + Lint + Assist (z. B. Imports sortieren) prüfen |
| `biome check --write` | … und alles Sichere reparieren |
| `biome ci` | Wie `check`, aber nur lesend und für die CI gedacht |

Eine Meldung von Biome nennt Datei, Zeile, Regel und oft einen Vorschlag:

```text title="Ausgabe"
src/cart.js:4:28 lint/suspicious/noDoubleEquals  FIXABLE
  × Using == may be unsafe if you are relying on type coercion.
  i Unsafe fix: Use === instead.
```

Mit `--staged` prüft Biome nur Dateien, die in Git vorgemerkt sind, mit `--changed` nur die gegenüber dem
Haupt-Branch geänderten – ideal für Hooks und große Projekte.

## Sichere und unsichere Fixes

Biome unterscheidet zwei Arten von [[autofix|Autofixes]]:

- **Sicher** – die Bedeutung bleibt garantiert gleich, z. B. Formatierung oder `let` → `const`, wenn nie neu
  zugewiesen wird. `--write` wendet sie an.
- **Unsicher** – das Verhalten *kann* sich ändern. `a == 1` ist für `a = "1"` wahr, `a === 1` nicht. Solche
  [[unsafe-fix|unsicheren Fixes]] wendest du nur mit `--write --unsafe` an – und liest danach den Diff.

> [!FEHLER]
> Blind `--unsafe` über ein großes Projekt laufen lassen. Wenn irgendwo absichtlich mit `==` ein String mit
> einer Zahl verglichen wurde, ist das Verhalten danach ein anderes. Unsichere Fixes gehören in einen eigenen
> Commit, den du mit Tests absicherst.

Musst du eine Regel an einer Stelle bewusst ausschalten, schreibst du einen Kommentar mit Begründung direkt
darüber: `// biome-ignore lint/suspicious/noConsole: Ausgabe ist hier gewollt`.

> [!PRAXIS]
> Die meisten Editoren haben eine Biome-Erweiterung, die beim Speichern formatiert und sichere Fixes anwendet.
> In der CI läuft dann nur noch `biome ci` – und findet fast nie etwas.

## Zusammenfassung

- **Biome** vereint Formatter und Linter für JavaScript, TypeScript, JSON und CSS in einem Werkzeug.
- **ESLint** und **Prettier** sind die etablierte Alternative mit mehr Plugins, aber mehr Konfiguration.
- Installation mit exakter Version (`-E`), Konfiguration in einer `biome.json`.
- `check --write` repariert lokal, `ci` prüft in der Pipeline, `--staged` hilft in Hooks.
- Unsichere Fixes (wie `==` → `===`) nur bewusst mit `--unsafe` – und danach kontrollieren.
