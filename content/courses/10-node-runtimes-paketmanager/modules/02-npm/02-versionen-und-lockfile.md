---
title: Versionen, Lockfile und Sicherheit
summary: Wie Semantic Versioning und Versionsbereiche funktionieren, warum das Lockfile ins Repository gehört und wie npm ci und npm audit dich schützen.
duration: 25
sources:
  - title: Semantic Versioning 2.0.0
    url: https://semver.org/lang/de/
  - title: npm Docs – About semantic versioning
    url: https://docs.npmjs.com/about-semantic-versioning
  - title: npm Docs – package-lock.json
    url: https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json
  - title: npm Docs – npm ci
    url: https://docs.npmjs.com/cli/v11/commands/npm-ci
  - title: npm Docs – npm audit
    url: https://docs.npmjs.com/cli/v11/commands/npm-audit
quiz:
  - type: single
    question: "In package.json steht `\"zod\": \"^4.1.0\"`. Welche Version darf npm installieren?"
    options: ["4.0.9", "4.3.2", "5.0.0", "4.1.0-beta.1"]
    answer: 1
    explanation: "^4.1.0 erlaubt alles ab 4.1.0 bis unter 5.0.0. 4.0.9 ist zu alt, 5.0.0 ist ein neues Major, und Vorabversionen wählt ein normaler Bereich nicht."
  - type: match
    question: Welche Änderung führt zu welcher neuen Version (ausgehend von 2.4.1)?
    pairs:
      - { left: "Tippfehler in einer Fehlermeldung behoben", right: "2.4.2" }
      - { left: "Neue optionale Funktion hinzugefügt", right: "2.5.0" }
      - { left: "Eine Funktion umbenannt, alte entfernt", right: "3.0.0" }
      - { left: "Erste Testversion des nächsten Majors", right: "3.0.0-beta.1" }
    explanation: PATCH für Fehlerbehebungen, MINOR für neue kompatible Funktionen, MAJOR für inkompatible Änderungen. Vorabversionen bekommen ein Suffix mit Bindestrich.
  - type: multiple
    question: Welche Aussagen zu Lockfile und npm ci stimmen?
    options:
      - package-lock.json wird ins Repository committet.
      - npm ci installiert genau die Versionen aus dem Lockfile.
      - npm ci passt das Lockfile an, wenn die package.json neuer ist.
      - In CI-Pipelines nutzt man npm ci statt npm install.
    answers: [0, 1, 3]
    explanation: npm ci ändert das Lockfile nie. Passen package.json und Lockfile nicht zusammen, bricht es mit einem Fehler ab.
  - type: find-bug
    question: Diese CI-Pipeline soll reproduzierbar installieren. Welche Zeile verhindert das?
    language: bash
    code: |
      git clone https://example.com/team/app.git
      cd app
      rm package-lock.json
      npm install
      npm test
    bug_line: 3
    explanation: Ohne Lockfile löst npm alle Bereiche neu auf und installiert womöglich neuere Versionen als im Team getestet. Richtig wäre, das Lockfile zu behalten und npm ci zu nutzen.
tasks:
  - id: semver-pruefen
    type: code
    language: js
    title: Prüfe Versionen gegen einen Bereich
    description: |
      Schreibe `erfuellt(version, bereich)`. Die Funktion gibt `true` zurück, wenn `version` zum
      Bereich passt. Unterstütze drei Formen:

      - **exakt** `"1.2.3"` – nur genau diese Version
      - **Tilde** `"~1.2.3"` – gleiche MAJOR- und MINOR-Nummer, PATCH mindestens 3
      - **Dach** `"^1.2.3"` – gleiche MAJOR-Nummer, insgesamt mindestens 1.2.3.
        Sonderregel: Ist MAJOR `0`, muss auch MINOR gleich bleiben (`^0.4.1` erlaubt nur 0.4.x).

      Versionen mit Vorab-Kennung (etwas mit `-`, z. B. `2.0.0-beta.1`) passen **nie** zu einem
      Dach- oder Tilde-Bereich. Die Hilfsfunktion `zerlege` ist schon vorbereitet.
    starter: |
      function zerlege(v) {
        const [major, minor, patch] = v.split(".").map(Number);
        return { major, minor, patch };
      }

      function erfuellt(version, bereich) {
        // Tipp: Prüfe zuerst das erste Zeichen von bereich
        return false;
      }
    tests:
      - name: Dach-Bereich im Normalfall
        code: |
          assertTrue(erfuellt("1.9.0", "^1.2.3"))
          assertTrue(!erfuellt("2.0.0", "^1.2.3"))
          assertTrue(!erfuellt("1.2.2", "^1.2.3"))
      - name: Tilde erlaubt nur Patch-Updates
        code: |
          assertTrue(erfuellt("1.2.9", "~1.2.3"))
          assertTrue(!erfuellt("1.3.0", "~1.2.3"))
      - name: Exakte Version
        code: |
          assertTrue(erfuellt("1.2.3", "1.2.3"))
          assertTrue(!erfuellt("1.2.4", "1.2.3"))
      - name: Sonderregel für 0.x beim Dach
        code: |
          assertTrue(erfuellt("0.4.7", "^0.4.1"))
          assertTrue(!erfuellt("0.5.0", "^0.4.1"))
      - name: Vorabversionen passen nicht zu Bereichen
        code: assertTrue(!erfuellt("2.0.0-beta.1", "^1.0.0") && !erfuellt("1.2.4-rc.1", "~1.2.3"))
    hints:
      - "Vergleiche MAJOR, MINOR und PATCH nacheinander: Erst wenn MINOR gleich ist, entscheidet PATCH."
      - "`version.includes(\"-\")` erkennt eine Vorabversion."
      - "Für \"mindestens\": `v.minor > b.minor || (v.minor === b.minor && v.patch >= b.patch)`."
    solution: |
      ```js
      function zerlege(v) {
        const [major, minor, patch] = v.split(".").map(Number);
        return { major, minor, patch };
      }

      function erfuellt(version, bereich) {
        const art = bereich[0];
        if (art !== "^" && art !== "~") {
          return version === bereich;
        }
        if (version.includes("-")) {
          return false;
        }
        const v = zerlege(version);
        const b = zerlege(bereich.slice(1));
        if (v.major !== b.major) return false;
        if (art === "~" || b.major === 0) {
          return v.minor === b.minor && v.patch >= b.patch;
        }
        return v.minor > b.minor || (v.minor === b.minor && v.patch >= b.patch);
      }
      ```
  - id: npm-ci-ausfuehren
    type: terminal
    title: Reproduzierbar installieren mit npm ci
    description: |
      Im Ordner `reproduzierbar` liegt ein Projekt mit package.json und package-lock.json – aber
      ohne `node_modules`, so wie direkt nach einem `git clone`. Klicke zuerst auf **Aufgabe vorbereiten**.

      1. Vergleiche: `jq .dependencies package.json` zeigt den erlaubten Bereich für `debug`,
         `jq -r '.packages["node_modules/debug"].version' package-lock.json` die festgeschriebene Version.
      2. Schreibe genau die Version aus dem Lockfile in die Datei `debug-version.txt`.
      3. Installiere die Abhängigkeiten mit `npm ci`.
      4. Lege eine `.gitignore` an, die `node_modules` vom Commit ausschließt.
      5. Bonus: Schau mit `npm ls --all`, welche transitive Abhängigkeit `debug` mitgebracht hat.
    workdir: reproduzierbar
    setup: |
      npm init -y >/dev/null
      npm install debug@4.4.1 --save-exact --no-audit --no-fund >/dev/null 2>&1
      npm pkg set dependencies.debug="^4.4.0"
      npm install --package-lock-only --no-audit --no-fund >/dev/null 2>&1
      rm -rf node_modules
    checks:
      - type: dir_exists
        path: node_modules/debug
        message: node_modules/debug fehlt noch. Führe npm ci aus.
      - type: command
        run: test "$(jq -r '.version' node_modules/debug/package.json)" = "$(jq -r '.packages["node_modules/debug"].version' package-lock.json)" && echo gleich
        stdout_equals: gleich
        message: Die installierte debug-Version weicht vom Lockfile ab. npm ci installiert genau die Version aus dem Lockfile.
      - type: command
        run: test "$(tr -d '[:space:]' < debug-version.txt)" = "$(jq -r '.packages["node_modules/debug"].version' package-lock.json)" && echo gleich
        stdout_equals: gleich
        message: debug-version.txt soll genau die Version aus dem Lockfile enthalten.
      - type: file_contains
        path: .gitignore
        pattern: "^/?node_modules/?\\s*$"
        message: Die .gitignore soll eine Zeile node_modules enthalten.
      - type: dir_exists
        path: node_modules/ms
        message: Die transitive Abhängigkeit ms fehlt in node_modules.
    hints:
      - "`jq -r '…' package-lock.json > debug-version.txt` schreibt das Ergebnis direkt in die Datei."
      - "`echo node_modules > .gitignore` legt die .gitignore an."
    solution: |
      ```bash
      cd reproduzierbar
      jq -r '.packages["node_modules/debug"].version' package-lock.json > debug-version.txt
      npm ci
      echo node_modules > .gitignore
      npm ls --all
      ```
---

`npm install` hat `"picocolors": "^1.1.1"` in deine package.json geschrieben. Was bedeutet das
Dach? Und warum installiert die Kollegin vielleicht eine andere Version als du? Um das zu
verstehen, brauchst du drei Dinge: Semantic Versioning, Versionsbereiche und das Lockfile.

## MAJOR.MINOR.PATCH

Fast alle npm-Pakete folgen [[semantic-versioning|Semantic Versioning]] (SemVer). Jede der drei
Zahlen hat eine feste Bedeutung:

![Aufbau einer SemVer-Version und Bedeutung von ^ und ~](/assets/node-runtimes-paketmanager/semver.svg)

| Teil | Erhöhen, wenn … | Für dich heißt das |
|---|---|---|
| **MAJOR** | sich etwas inkompatibel ändert | Code muss eventuell angepasst werden |
| **MINOR** | neue Funktionen dazukommen | Update ist gefahrlos |
| **PATCH** | nur Fehler behoben werden | Update ist gefahrlos und empfohlen |

Eine inkompatible Änderung heißt [[breaking-change|Breaking Change]]. Testversionen bekommen ein
Suffix: [[prerelease|Vorabversionen]] wie `3.0.0-beta.1` oder `3.0.0-rc.2`.

## Versionsbereiche und Updates

In der package.json steht meist ein [[versionsbereich|Versionsbereich]]:

| Angabe | Erlaubt |
|---|---|
| `^2.4.1` (Standard) | ≥ 2.4.1 und < 3.0.0 |
| `~2.4.1` | ≥ 2.4.1 und < 2.5.0 |
| `2.4.1` | nur genau 2.4.1 (`npm install -E`) |
| `^0.4.1` | ≥ 0.4.1 und < 0.5.0 – unter 1.0.0 ist das Dach strenger |
| `*`, `latest` | alles – vermeiden! |

Vorabversionen wählt ein normaler Bereich nie; du installierst sie nur ausdrücklich
(`npm install paket@beta`). `npm outdated` zeigt pro Paket *Current* (installiert), *Wanted*
(neueste im Bereich) und *Latest*. `npm update` hebt auf *Wanted* an; für ein neues MAJOR nutzt du
`npm install paket@latest` – nach einem Blick in die Release Notes.

## Das Lockfile und npm ci

Die package.json sagt: „`debug` in `^4.4.0`.“ Das [[lockfile|Lockfile]] `package-lock.json` sagt:
„Installiert wurde **4.4.1**, von dieser Adresse, mit dieser Prüfsumme – dazu `ms` 2.1.3.“ Es hält
**alle** Pakete fest, auch transitive, und gehört ins Repository.

| | `npm install` | `npm ci` |
|---|---|---|
| Liest | package.json und Lockfile | nur das Lockfile |
| Ändert das Lockfile | ja, wenn nötig | niemals |
| Vorhandenes node_modules | wird ergänzt | wird zuerst gelöscht |
| package.json passt nicht zum Lockfile | Lockfile wird angepasst | Abbruch mit Fehler |

In einer [[continuous-integration|CI]]-Pipeline und nach dem Klonen nutzt du [[npm-ci|`npm ci`]].

> [!MERKSATZ]
> package.json = **was erlaubt ist**. package-lock.json = **was genau installiert wurde**. Beide
> werden committet, `node_modules` nicht.

> [!FEHLER]
> **Lockfile löschen, „weil es Konflikte macht“.** Dann installierst du still und leise neuere
> Versionen aller Pakete. Besser: Konflikt in der package.json lösen, `npm install` ausführen –
> npm repariert das Lockfile selbst.

## Sicherheitslücken finden

Wird in einem Paket eine [[sicherheitsluecke|Sicherheitslücke]] bekannt, landet sie in einer
öffentlichen Datenbank. [[npm-audit|`npm audit`]] vergleicht deinen ganzen Abhängigkeitsbaum damit.

```bash title="Terminal"
npm audit                 # Bericht: low, moderate, high, critical
npm audit fix             # kompatible Updates innerhalb der Bereiche einspielen
npm audit --omit=dev      # nur Laufzeit-Abhängigkeiten prüfen
```

`npm audit fix --force` darf auch MAJOR-Versionen einspielen – das kann Code kaputt machen.

> [!PRAXIS]
> In vielen Teams läuft `npm audit` in der CI, und Bots öffnen Pull Requests für Updates.
> Bewerte trotzdem jeden Fund: Eine Lücke in einem Test-Werkzeug ist weniger dringend als eine im
> Webserver.

## Zusammenfassung

- SemVer: **MAJOR** = inkompatibel, **MINOR** = neue Funktion, **PATCH** = Fehlerbehebung.
- `^1.2.3` erlaubt neue MINOR- und PATCH-Versionen, `~1.2.3` nur PATCH; Vorabversionen nur ausdrücklich.
- `npm outdated` zeigt Updates, `npm update` bleibt innerhalb der Bereiche.
- Das **Lockfile** hält exakte Versionen und Prüfsummen fest und wird committet.
- `npm ci` installiert streng nach Lockfile – Standard in CI und nach dem Klonen.
- `npm audit` findet bekannte Sicherheitslücken, `npm audit fix` behebt sie kompatibel.
