---
title: Secrets und Abhängigkeiten im Griff
summary: Zugangsdaten aus dem Code und aus Git heraushalten, geleakte Secrets rotieren und Abhängigkeiten mit npm audit und composer audit auf bekannte Lücken prüfen.
duration: 25
sources:
  - title: OWASP Cheat Sheet – Secrets Management
    url: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
  - title: OWASP Top 10:2025 – A03 Software Supply Chain Failures
    url: https://top10.owasp.org/2025/A03_2025-Software_Supply_Chain_Failures/
  - title: npm Docs – npm audit
    url: https://docs.npmjs.com/cli/v11/commands/npm-audit
  - title: Composer – audit
    url: https://getcomposer.org/doc/03-cli.md#audit
  - title: Composer – Konfiguration policy.advisories
    url: https://getcomposer.org/doc/06-config.md
  - title: GitHub Docs – Secret scanning
    url: https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning
quiz:
  - type: single
    question: Ein API-Key wurde versehentlich committet und gepusht. Was ist der wichtigste erste Schritt?
    options:
      - Die Datei löschen und einen neuen Commit machen.
      - Den Key beim Anbieter widerrufen und einen neuen erzeugen (rotieren).
      - Das Repository auf privat stellen.
      - Nichts, solange niemand davon weiß.
    answer: 1
    explanation: >
      Der Key steckt in der Git-Historie, in Klonen und vielleicht schon in Bot-Scans. Nur ein Widerruf macht ihn
      wertlos. Aufräumen der Historie kommt danach – und ersetzt die Rotation nie.
  - type: multiple
    question: Wo haben Secrets nichts zu suchen?
    options:
      - Im Quellcode und in der Git-Historie
      - Im JavaScript-Bundle, das an den Browser geht
      - In Log-Dateien und Fehlermeldungen
      - In einer `.env`-Datei auf dem Server, die nicht im Repository liegt
      - In URLs als Query-Parameter
    answers: [0, 1, 2, 4]
    explanation: >
      Eine `.env`-Datei außerhalb von Git (oder besser ein Secrets-Manager) ist ein üblicher Ort. Alles im Bundle
      ist öffentlich, Logs und URLs werden gespeichert und weitergegeben.
  - type: match
    question: Ordne jedem Befehl seine Wirkung zu.
    pairs:
      - { left: "npm audit", right: "Listet bekannte Lücken in installierten npm-Paketen" }
      - { left: "npm ci", right: "Installiert exakt die Versionen aus package-lock.json" }
      - { left: "composer audit", right: "Prüft Composer-Pakete gegen die Packagist-Sicherheitsdatenbank" }
      - { left: "npm audit fix", right: "Aktualisiert betroffene Pakete innerhalb der erlaubten Versionsbereiche" }
    explanation: Audit-Befehle finden Probleme, Lockfiles und npm ci sorgen dafür, dass überall dieselben geprüften Versionen laufen.
  - type: cloze
    text: "Die Vorlage mit allen Variablennamen, aber ohne echte Werte, heißt meist `.env.___`. Die echte `.env` steht in der Datei `.___`."
    blanks:
      - [example]
      - [gitignore]
    explanation: So wissen alle im Team, welche Variablen nötig sind, ohne dass Werte im Repository landen.
tasks:
  - id: secret-auslagern
    type: terminal
    title: Einen geleakten API-Key auslagern und rotieren
    description: |
      Im Ordner `geheimnisse` liegt ein Git-Repository. `config.php` enthält einen API-Key für den Mailversand im
      Klartext – und ist bereits committet. Der Key `mailkey-0000-alt` gilt damit als verbrannt.

      1. Lege eine Datei `.env` an mit einem **neuen** Wert, z. B. `MAIL_API_KEY=mailkey-1111-neu`
         (stell dir vor, du hast ihn gerade beim Anbieter neu erzeugt).
      2. Ändere `config.php` so, dass der Key aus `.env` gelesen wird, z. B. mit
         `parse_ini_file(__DIR__ . '/.env')`. Der alte Key darf nicht mehr in `config.php` stehen.
      3. Trage `.env` in `.gitignore` ein.
      4. Lege `.env.example` mit `MAIL_API_KEY=` (ohne Wert) an.
      5. Committe `config.php`, `.gitignore` und `.env.example` – aber **nicht** `.env`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: geheimnisse
    setup: |
      git init -q -b main
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      cat > config.php <<'PHP'
      <?php
      declare(strict_types=1);

      return [
          'mail_api_key' => 'mailkey-0000-alt',
          'mail_from' => 'shop@example.com',
      ];
      PHP
      git add config.php
      git commit -q -m "feat: add mail config"
    checks:
      - type: command
        run: |
          php -r '$c = require "config.php"; $e = @parse_ini_file(".env") ?: []; $k = $c["mail_api_key"] ?? "";
          if ($k === "" ) { echo "leer"; } elseif ($k === "mailkey-0000-alt") { echo "alt"; } elseif ($k !== ($e["MAIL_API_KEY"] ?? null)) { echo "nicht-aus-env"; } else { echo "ok"; }'
        stdout_equals: ok
        message: config.php soll den neuen Wert von MAIL_API_KEY aus .env liefern – nicht leer, nicht der alte Key mailkey-0000-alt.
      - type: command
        run: grep -c 'mailkey-0000-alt' config.php || true
        stdout_equals: "0"
        message: In config.php steht noch der alte Key. Lies den Wert stattdessen aus .env.
      - type: command
        run: git check-ignore -q .env && echo ignoriert
        stdout_equals: ignoriert
        message: .env wird noch nicht ignoriert. Trage .env in .gitignore ein.
      - type: command
        run: git ls-files .env | wc -l
        stdout_matches: "^\\s*0\\s*$"
        message: .env ist im Repository gelandet. Entferne sie mit git rm --cached .env und committe erneut.
      - type: command
        run: git ls-files --error-unmatch .env.example .gitignore config.php >/dev/null 2>&1 && git status --porcelain -- config.php .gitignore .env.example | wc -l
        stdout_matches: "^\\s*0\\s*$"
        message: config.php, .gitignore und .env.example sollen committet sein und keine offenen Änderungen mehr haben.
      - type: command
        run: grep -E '^MAIL_API_KEY=' .env.example
        stdout_equals: MAIL_API_KEY=
        message: .env.example soll die Zeile MAIL_API_KEY= ohne Wert enthalten.
      - type: command
        run: git show HEAD:config.php | grep -c 'mailkey-0000-alt' || true
        stdout_equals: "0"
        message: Im letzten Commit enthält config.php noch den alten Key. Committe die geänderte config.php.
    hints:
      - "`.env` anlegen: `echo 'MAIL_API_KEY=mailkey-1111-neu' > .env`, Vorlage: `echo 'MAIL_API_KEY=' > .env.example`."
      - "In config.php: `$env = parse_ini_file(__DIR__ . '/.env');` und dann `'mail_api_key' => $env['MAIL_API_KEY'] ?? ''`."
      - "`echo '.env' > .gitignore`, danach `git add config.php .gitignore .env.example` und `git commit -m \"fix: move mail key to env\"`. Prüfe mit `git status`, dass .env nicht auftaucht."
    solution: |
      ```bash
      echo 'MAIL_API_KEY=mailkey-1111-neu' > .env
      echo 'MAIL_API_KEY=' > .env.example
      echo '.env' > .gitignore
      cat > config.php <<'PHP'
      <?php
      declare(strict_types=1);

      $env = parse_ini_file(__DIR__ . '/.env') ?: [];

      return [
          'mail_api_key' => $env['MAIL_API_KEY'] ?? '',
          'mail_from' => 'shop@example.com',
      ];
      PHP
      git add config.php .gitignore .env.example
      git commit -m "fix: move mail key to env"
      git status
      ```

      Der alte Key bleibt in der Historie sichtbar (`git log -p`). Deshalb ist die Rotation beim Anbieter Pflicht.
  - id: secrets-orte
    type: dragdrop
    title: Wohin gehört dieser Wert?
    description: Ordne jeden Wert dem passenden Ort zu.
    targets:
      - { id: env, label: ".env / Secrets-Manager (nicht in Git)" }
      - { id: example, label: ".env.example (in Git, ohne Wert)" }
      - { id: code, label: "Darf im Code oder Repository stehen" }
    items:
      - { label: "Datenbank-Passwort der Produktion", target: env }
      - { label: "Name der Variable DB_PASSWORD", target: example }
      - { label: "Privater Schlüssel für Webhook-Signaturen", target: env }
      - { label: "Öffentliche URL der eigenen API", target: code }
      - { label: "Name der Variable MAIL_API_KEY", target: example }
      - { label: "Zeitzone Europe/Berlin", target: code }
---
Ein Entwickler pusht schnell einen Fix ins öffentliche Repository. In `config.php` steht noch der Schlüssel für
den Mailversand. Eine Stunde später verschickt der Account zehntausende Spam-Mails – Bots durchsuchen öffentliche
Repositories rund um die Uhr nach genau solchen Schlüsseln.

## Wo Secrets nicht hingehören

Ein [[secret|Secret]] ist jeder Wert, der Zugriff gewährt: Passwörter, API-Keys, private Schlüssel, Tokens.

| Ort | Warum gefährlich |
|---|---|
| Quellcode / Git | Jeder mit Zugriff aufs Repository – und auf jeden alten Klon – sieht ihn |
| Frontend-Bundle | Alles, was an den Browser geht, ist öffentlich |
| Logs und Fehlerseiten | Logs werden kopiert, durchsucht und lange aufbewahrt |
| URLs | Landen in Server-Logs, Verlauf und Referrer |
| Chat und Tickets | Werden selten gelöscht |

Stattdessen liest die App Secrets zur Laufzeit aus [[umgebungsvariable|Umgebungsvariablen]] oder einer
[[env-datei|.env-Datei]], die nur auf dem Server liegt. In größeren Setups verwaltet ein
[[secrets-manager|Secrets-Manager]] die Werte zentral, mit Zugriffsrechten und Protokoll.

```bash title=".gitignore"
.env
```

```bash title=".env.example – kommt ins Repository"
DB_PASSWORD=
MAIL_API_KEY=
```

> [!MERKSATZ]
> Ins Repository gehört nur die **Vorlage** mit den Variablennamen. Die Werte leben außerhalb von Git.

## Wenn ein Secret geleakt ist

Ein committetes Secret ist **verbrannt** – auch wenn du die Datei sofort wieder löschst. Es steckt in der
Historie, in Forks und vielleicht schon in fremden Kopien.

1. **Rotieren**: Den Wert beim Anbieter widerrufen und einen neuen erzeugen ([[secret-rotation|Secret-Rotation]]).
2. **Neuen Wert sicher hinterlegen**: `.env` oder Secrets-Manager, nie wieder im Code.
3. **Nutzung prüfen**: Logs des Anbieters auf fremde Zugriffe durchsehen.
4. **Optional aufräumen**: Historie bereinigen – das ersetzt die Rotation aber nie.

> [!FEHLER]
> „Ich habe den Key im nächsten Commit gelöscht, also ist er weg.“ `git log -p` zeigt ihn weiterhin. Ohne
> Rotation bleibt der alte Key gültig.

Vorbeugend helfen [[secret-scanning|Secret Scanning]] und [[push-protection|Push Protection]] auf Plattformen
wie GitHub: Sie erkennen typische Schlüsselformate und blockieren den Push.

## Abhängigkeiten: die Lieferkette

Deine App besteht zum größten Teil aus fremdem Code. Jedes Paket bringt [[transitive-abhaengigkeit|transitive Abhängigkeiten]]
mit. OWASP nennt das 2025 **A03 Software Supply Chain Failures**: bekannte Lücken in Paketen,
ungepflegte Pakete und gezielte [[supply-chain-angriff|Supply-Chain-Angriffe]] wie
[[typosquatting|Typosquatting]].

Bekannte Lücken bekommen eine [[cve|CVE]]-Nummer. Die Paketmanager gleichen deine Versionen mit diesen Datenbanken ab:

```bash title="Terminal"
npm audit                      # npm-Pakete prüfen
npm audit --audit-level=high   # nur ab „high“ mit Fehlercode abbrechen
composer audit                 # Composer-Pakete prüfen
composer audit --locked        # nur composer.lock lesen, ohne vendor/
```

```text
minimist  1.0.0 - 1.2.5
Severity: critical
Prototype Pollution in minimist
fix available via `npm audit fix --force`
```

Beide Befehle enden mit einem Exit-Code ungleich 0, wenn sie Lücken finden – ideal für die CI-Pipeline.

## Lücken beheben und vorbeugen

| Werkzeug | Zweck |
|---|---|
| `npm audit fix` | Aktualisiert innerhalb der erlaubten Versionsbereiche |
| `npm install paket@^1.2.8` | Hebt gezielt auf eine sichere Version |
| `composer update vendor/paket` | Aktualisiert ein Composer-Paket |
| [[lockfile\|Lockfile]] + [[npm-ci\|npm ci]] | Überall exakt dieselben geprüften Versionen |

Aktuelle Composer-Versionen blockieren bei `composer update` und `composer require` standardmäßig Versionen mit
bekannten Sicherheitswarnungen (Einstellung `policy.advisories.block`).

> [!PRAXIS]
> Im Team läuft `npm audit --audit-level=high` und `composer audit` in jeder CI-Pipeline. Werkzeuge wie Dependabot
> oder Renovate öffnen automatisch Pull Requests für Updates – so bleibt das Aktualisieren klein und regelmäßig.

## Zusammenfassung

- **Secrets** gehören nicht in Code, Git, Bundle, Logs oder URLs, sondern in `.env` oder einen Secrets-Manager.
- `.env` steht in `.gitignore`, `.env.example` dokumentiert die Variablen ohne Werte.
- Ein geleaktes Secret wird **sofort rotiert** – Löschen allein hilft nicht.
- **npm audit** und **composer audit** finden bekannte Lücken; Lockfiles und `npm ci` halten Versionen fest.
- Regelmäßige, kleine Updates sind die beste Vorbeugung gegen Supply-Chain-Risiken.
