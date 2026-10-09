---
title: Private Registries und Supply-Chain-Sicherheit
summary: Interne Pakete über Scopes und eigene Registries verteilen – und dich mit Audits, Lockfiles und Provenance gegen Typosquatting und Supply-Chain-Angriffe schützen.
duration: 25
sources:
  - title: npm Docs – .npmrc
    url: https://docs.npmjs.com/cli/v11/configuring-npm/npmrc
  - title: npm Docs – Scopes
    url: https://docs.npmjs.com/cli/v11/using-npm/scope
  - title: Bun Docs – bunfig.toml (install.scopes)
    url: https://bun.com/docs/runtime/bunfig
  - title: npm Docs – npm audit
    url: https://docs.npmjs.com/cli/v11/commands/npm-audit
  - title: npm Docs – Generating provenance statements
    url: https://docs.npmjs.com/generating-provenance-statements
  - title: Composer – audit und Konfiguration
    url: https://getcomposer.org/doc/03-cli.md#audit
quiz:
  - type: find-bug
    question: Das Team will das Token für die interne Registry nicht ins Repository einchecken. Welche Zeile der .npmrc verstößt dagegen?
    language: ini
    code: |
      @firma:registry=https://npm.example.com/
      //npm.example.com/:_authToken=<dein-token>
      save-exact=true
    bug_line: 2
    explanation: "Das Token steht im Klartext in der Datei. Richtig ist ein Verweis auf eine Umgebungsvariable: `//npm.example.com/:_authToken=${NPM_TOKEN}`."
  - type: single
    question: Was ist Typosquatting?
    options:
      - Ein Angreifer veröffentlicht ein Schadpaket mit einem Namen, der einem beliebten Paket zum Verwechseln ähnlich ist.
      - Ein Paket enthält viele Tippfehler in der Dokumentation.
      - Eine Registry ist wegen Überlastung nicht erreichbar.
      - Zwei Pakete verlangen unvereinbare Versionen.
    answer: 0
    explanation: Wer sich bei `npm install lodahs` vertippt, installiert womöglich Schadcode. Deshalb Paketnamen immer genau prüfen.
  - type: multiple
    question: Welche Maßnahmen schützen dich vor Supply-Chain-Angriffen?
    options:
      - Lockfile committen und in CI mit npm ci bzw. composer install installieren
      - Regelmäßig npm audit und composer audit ausführen
      - Install-Skripte von Abhängigkeiten nur nach Prüfung erlauben
      - Bei jedem Build `npm update` ausführen, damit alles aktuell ist
    answers: [0, 1, 2]
    explanation: Unkontrollierte Updates holen im Zweifel genau die kompromittierte neue Version herein. Sicherer ist, Updates bewusst und geprüft einzuspielen.
  - type: match
    question: Ordne jedem Werkzeug seinen Zweck zu.
    pairs:
      - { left: "npm audit", right: "Bekannte Sicherheitslücken im npm-Abhängigkeitsbaum finden" }
      - { left: "composer audit", right: "Bekannte Sicherheitslücken in PHP-Paketen finden" }
      - { left: "npm publish --provenance", right: "Nachweis veröffentlichen, aus welchem Repository und Build ein Paket stammt" }
      - { left: "npm install-scripts approve", right: "Install-Skripte eines Pakets bewusst erlauben" }
    explanation: Audits finden bekannte Lücken, Provenance belegt die Herkunft, die Freigabe von Install-Skripten verhindert, dass beliebiger Code beim Installieren läuft.
tasks:
  - id: audit-und-npmrc
    type: terminal
    title: Registry konfigurieren und Lücke schließen
    description: |
      Im Ordner `sicherheit` liegt ein Projekt, das eine **alte** Version von `lodash` mit einer bekannten
      Sicherheitslücke nutzt.

      1. Lege eine `.npmrc` an, die alle Pakete mit dem Scope `@firma` von `https://npm.example.com/`
         lädt. Das Token für diese Registry soll aus der Umgebungsvariable `NPM_TOKEN` kommen – **nicht**
         im Klartext.
      2. Führe `npm audit --json` aus und filtere mit `jq` den Schweregrad (`severity`) der Lücke in lodash
         heraus. Schreibe ihn in die Datei `schweregrad.txt`.
      3. Schließe die Lücke (`npm audit fix` oder gezielt eine neuere Version installieren).
      4. Prüfe mit `npm audit`, dass keine Lücken mehr gemeldet werden.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: sicherheit
    setup: |
      npm init -y > /dev/null
      npm install lodash@4.17.20 > /dev/null 2>&1
    checks:
      - type: file_contains
        path: .npmrc
        pattern: "^@firma:registry\\s*=\\s*https://npm\\.example\\.com/?\\s*$"
        message: In der .npmrc fehlt die Zeile @firma:registry=https://npm.example.com/.
      - type: file_contains
        path: .npmrc
        pattern: "^//npm\\.example\\.com/:_authToken=\\$\\{NPM_TOKEN\\}\\s*$"
        message: "Das Token soll per //npm.example.com/:_authToken=${NPM_TOKEN} aus der Umgebungsvariable kommen."
      - type: file_contains
        path: schweregrad.txt
        pattern: "^\\s*high\\s*$"
        message: In schweregrad.txt soll der Schweregrad der lodash-Lücke stehen, so wie npm audit --json ihn meldet.
      - type: command
        run: npm audit --json 2>/dev/null | jq -r '.metadata.vulnerabilities.total'
        stdout_equals: "0"
        message: npm audit meldet noch Sicherheitslücken. Versuche npm audit fix.
    hints:
      - "Eine .npmrc ist eine einfache Textdatei mit `schluessel=wert`-Zeilen. Umgebungsvariablen schreibst du als `${NAME}`."
      - "`npm audit --json | jq -r '.vulnerabilities.lodash.severity'` liefert den Schweregrad."
      - "Achte bei `printf` oder `echo` darauf, dass `${NPM_TOKEN}` in einfachen Anführungszeichen steht – sonst setzt die Shell den (leeren) Wert ein."
    solution: |
      ```bash
      cd sicherheit
      printf '%s\n' '@firma:registry=https://npm.example.com/' '//npm.example.com/:_authToken=${NPM_TOKEN}' > .npmrc
      npm audit --json | jq -r '.vulnerabilities.lodash.severity' > schweregrad.txt
      npm audit fix
      npm audit
      ```
  - id: privat-veroeffentlichen
    type: simulated
    title: Ein internes Paket veröffentlichen
    description: |
      Du arbeitest an der internen UI-Library `@firma/ui`. Die `.npmrc` des Projekts zeigt für den Scope
      `@firma` auf die private Registry `https://npm.example.com/`, und `NPM_TOKEN` ist gesetzt.

      1. Prüfe mit `npm pack --dry-run`, welche Dateien im Paket landen.
      2. Veröffentliche das Paket mit `npm publish`.
      3. Frage die Registry nach der aktuellen Version: `npm view @firma/ui version`.
    prompt: "du@laptop:~/ui$"
    steps:
      - expect: "^npm\\s+pack\\s+--dry-run$"
        output: |
          npm notice 📦  @firma/ui@1.0.0
          npm notice Tarball Contents
          npm notice 1.1kB README.md
          npm notice 2.4kB dist/index.js
          npm notice 612B dist/index.d.ts
          npm notice 742B package.json
          npm notice Tarball Details
          npm notice name: @firma/ui
          npm notice version: 1.0.0
          npm notice total files: 4
          @firma-ui-1.0.0.tgz
        hint: "Der Befehl lautet `npm pack --dry-run`."
      - expect: "^npm\\s+publish$"
        output: |
          npm notice Publishing to https://npm.example.com/ with tag latest and restricted access
          + @firma/ui@1.0.0
        hint: "Veröffentlichen geht mit `npm publish`."
      - expect: "^npm\\s+view\\s+@firma/ui\\s+version$"
        output: "1.0.0"
        hint: "`npm view <paket> version` fragt die Registry."
    responses:
      - match: "^cat\\s+\\.npmrc"
        output: |
          @firma:registry=https://npm.example.com/
          //npm.example.com/:_authToken=${NPM_TOKEN}
      - match: "^ls"
        output: "README.md  dist  package.json  src"
---
Deine Firma baut eine eigene UI-Library, die mehrere Apps nutzen sollen – aber sie soll nicht öffentlich
auf npmjs.com landen. Gleichzeitig liest du in den Nachrichten, dass ein beliebtes Paket mit Schadcode
verseucht wurde. Beide Themen hängen an derselben Frage: **Woher kommt der Code, den du installierst?**

## Scopes und private Registries

Ein [[scope|Scope]] ist ein Namensraum für npm-Pakete: `@firma/ui`, `@firma/utils`. Jeder Scope kann auf
eine **eigene** Registry zeigen – etwa eine [[private-registry|private Registry]] der Firma oder GitHub
Packages. Alle anderen Pakete kommen weiter von npmjs.com.

```ini title=".npmrc im Projekt"
@firma:registry=https://npm.example.com/
//npm.example.com/:_authToken=${NPM_TOKEN}
```

Bun liest die `.npmrc` ebenfalls, kann Scopes aber auch in der [[bunfig|bunfig.toml]] festlegen:

```toml title="bunfig.toml"
[install.scopes]
firma = { url = "https://npm.example.com/", token = "$NPM_TOKEN" }
```

Bei Composer trägst du eine weitere Quelle unter `repositories` ein (`"type": "composer"`), die
Zugangsdaten liegen in einer `auth.json`, die nicht ins Repository gehört.

> [!FEHLER]
> **Token im Klartext in die .npmrc schreiben und committen.** Damit kann jede Person mit Lesezugriff auf
> das Repository Pakete in deinem Namen veröffentlichen. Nutze `${NPM_TOKEN}` und setze die Variable lokal
> oder als Secret in der CI.

## Bekannte Lücken finden: Audits

Für Pakete werden laufend Sicherheitslücken gemeldet und mit einer [[cve|CVE-Nummer]] katalogisiert. Beide
Paketmanager gleichen deinen Lockfile-Baum mit diesen Datenbanken ab:

```bash title="Terminal"
npm audit                     # Bericht für Menschen
npm audit --json | jq '.metadata.vulnerabilities'
npm audit fix                 # passende, kompatible Updates einspielen
composer audit                # dasselbe für PHP
```

| Schweregrad | Bedeutung |
|---|---|
| `low`, `moderate` | Einschränkungen oder schwer ausnutzbar – zeitnah beheben |
| `high`, `critical` | Ernsthaft ausnutzbar – sofort beheben |

Composer blockiert in neueren Versionen sogar standardmäßig, dass du eine Version mit bekannter Lücke per
`require` oder `update` installierst.

## Supply-Chain-Angriffe

Bei einem [[supply-chain-angriff|Supply-Chain-Angriff]] greift niemand deine App direkt an, sondern ein
Glied in der Lieferkette: ein Paket, das du benutzt.

| Angriff | So läuft er ab |
|---|---|
| **Gekapertes Konto** | Ein Maintainer-Konto wird übernommen, eine neue Version enthält Schadcode. |
| [[typosquatting\|Typosquatting]] | Ein Paket heißt fast wie ein bekanntes: `lodahs` statt `lodash`. |
| **Install-Skript** | Ein `postinstall`-Skript stiehlt beim Installieren Tokens oder Umgebungsvariablen. |

Deshalb laufen Install-Skripte von Abhängigkeiten in aktuellen npm-Versionen erst, wenn du sie mit
`npm install-scripts approve <paket>` erlaubst. Bun nutzt dafür die Liste `trustedDependencies`.

> [!MERKSATZ]
> Ein Paket ist so vertrauenswürdig wie **jeder** in seiner Kette: Autor:innen, ihre Konten, ihr Build und
> alle transitiven Abhängigkeiten.

## Herkunft belegen: Provenance

[[provenance|Provenance]] („Herkunftsnachweis“) beantwortet: Wurde diese Version wirklich aus diesem
Repository und diesem Commit gebaut? Pakete, die aus einer CI-Pipeline mit `npm publish --provenance`
veröffentlicht werden, tragen einen signierten Nachweis. npmjs.com zeigt ihn als Abzeichen an, und
`npm audit signatures` prüft die Signaturen deiner installierten Pakete.

> [!PRAXIS]
> Eine solide Grundausstattung im Team: Lockfile committen, in CI `npm ci` und `composer install`,
> Audits als eigenen CI-Schritt, Updates per Pull Request – und neue Pakete erst nach einem Blick auf
> Namen, Maintainer und Download-Zahlen.

## Zusammenfassung

- Ein **Scope** (`@firma/…`) kann über `.npmrc` oder `bunfig.toml` auf eine **private Registry** zeigen.
- Tokens kommen aus Umgebungsvariablen (`${NPM_TOKEN}`), nie im Klartext ins Repository.
- `npm audit` und `composer audit` finden **bekannte** Lücken; `npm audit fix` spielt kompatible Updates ein.
- **Supply-Chain-Angriffe** nutzen gekaperte Konten, **Typosquatting** oder Install-Skripte.
- **Provenance** belegt, aus welchem Repository und Build eine Version stammt.
