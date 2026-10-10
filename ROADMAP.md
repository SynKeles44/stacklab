# Stacklab – Roadmap

Lebendes Arbeitsdokument. Wird nach jedem abgeschlossenen Schritt aktualisiert.
Status-Legende: `[ ]` offen · `[~]` in Arbeit · `[x]` fertig · `[-]` zurückgestellt (mit Grund)

## Protokoll

- **Zuletzt erledigt (2026-10-10):** Fundament komplett und getestet; Lektionen seitenweise (Blättern); zwei UI-Varianten (Standard + Apple, wählbar unter Einstellungen → Darstellung, gespeichert in users.ui_variant); Kursdauer wird aus Lektionsdauern berechnet; Kurs-Größenregel 10–12 Lektionen / 4–6 h (Laravel bis 10 h) in docs/AUTHORING.md.
- **Kursstand:** alle 52 Kurse fertig, siehe Abschnitt „Kursstand 2026-10-10“.
- **Als Nächstes:** Screenshots aus MISSING_SCREENSHOTS.md ergänzen (macht der Owner); optional Frontend auf JavaScript umstellen (vom Owner zurückgestellt).
- **2026-10-10 (Nachtrag):** Tests leerten die Entwicklungs-DB (Docker-Env überschrieb phpunit.xml) – behoben, danach Neu-Import nötig (Konten waren weg). Neu: „Für mich erledigen“ bei Projektschritten (`solve:`-Skripte, Prüfwerkzeug `stacklab:solve-check --require-all`), Fortschritt zurücksetzen (Einstellungen), `make workspace` (Ordner-Dialog), Suche repariert, Module starten eingeklappt.
- **Hinweise für Autoren:** Jeder Projektschritt braucht ein `solve`-Skript, `stacklab:solve-check <kurs> --require-all` muss grün sein. Sandbox /tmp ist noexec; kein man/sudo/zsh/python3/rsync; `nvm install` höchstens einmal mit `timeout 300` (Prozesslimit 512).

## Kursstand 2026-10-10 – alle 52 Kurse fertig

Alle 52 Kurse sind geschrieben, isoliert validiert (committeter Stand + Kurs), mit `stacklab:solve-check --require-all`
geprüft, committet und importiert: 52 Kurse, 207 Module, 609 Lektionen, 2053 Lexikon-Begriffe.

**Ablauf für spätere Kursänderungen:** `.wip/isolated-validate.sh <dir>:<slug>` → `stacklab:solve-check <slug> --require-all`
→ commit → `.wip/import-committed.sh` (beide Skripte lokal in `.wip/`, nicht im Git). Nur EINE Sitzung arbeitet an den Kursen.

## Entscheidungen

| # | Entscheidung | Begründung |
|---|---|---|
| D1 | Monorepo: `backend/` (Laravel), `frontend/` (React), `sandbox/` (Übungs-Terminal), `content/` (Lerninhalte), `docker/` | Ein Klon, ein Befehl; Inhalte per PR ergänzbar |
| D2 | Datenbank **PostgreSQL** | Eingebaute Volltextsuche mit deutscher Stemming-Konfiguration (`to_tsvector('german', …)`), JSONB für Quiz-/Aufgabendaten |
| D3 | UI ausschließlich **shadcn/ui** (Radix-basiert, Tailwind v4) als Komponentenbibliothek | Vorgabe; CodeMirror (Editor) und xterm.js (Terminal) sind Spezialwerkzeuge, keine Komponentenbibliothek, und werden in shadcn-Komponenten eingebettet |
| D4 | Code-Editor **CodeMirror 6** statt Monaco | Deutlich kleiner, mobil bedienbar (Monaco ist auf Touch-Geräten schwach) |
| D5 | Inhalte als Markdown mit YAML-Frontmatter (Lektion) + YAML (Kurs/Modul/Lexikon/Projekt/Prüfung) | Lesbar, PR-freundlich, maschinell validierbar |
| D6 | Sandbox = eigener Container mit Node-Gateway (WebSocket + node-pty) als unprivilegierter Nutzer `learner` | Echte Shell, kein Docker-Socket nötig, kein Root im laufenden Container |
| D7 | Zustandsprüfung läuft **im** Sandbox-Container (deklarative Checks: Datei, Inhalt, Befehl+Ausgabe), Backend ruft sie über internes HTTP mit Token auf | Prüft den echten Zustand dort, wo die Tools (git, node, php) installiert sind |
| D8 | Netz der Sandbox: `internal`-Netzwerk + Egress-Proxy (tinyproxy) mit Allowlist für Paket-Registries | Kein freier Internetzugang aus der Übungs-Shell |
| D9 | Frontend wird bei `docker compose up` per Bun gebaut und von Nginx ausgeliefert; `make dev` für Vite-Dev-Server | „Ein Befehl“-Vorgabe, trotzdem komfortable Entwicklung |
| D10 | Auth: Laravel Sanctum Personal Access Tokens | Einfach, lokal, ohne Cookie-/CSRF-Komplexität |
| D11 | Begriffe im Text: explizite Syntax `[[slug]]` / `[[slug\|Anzeigetext]]` | Eindeutig, validierbar, kein falsches Auto-Linking |
| D13 | Diagramm-Aufgabe: Antippen statt Popover pro Feld | Popover sprang bei schnellem Wechsel ans falsche Feld; Antippen funktioniert auf Touch zuverlässig |
| D14 | PHP-FPM nicht im Sandbox-Netz; Backend erreicht Sandbox über internen Nginx-Port 8081 | Sonst könnte die Übungs-Shell per FastCGI Code im Backend-Container ausführen |
| D15 | Editor, Terminal und Transpiler per Code-Splitting nachgeladen | Haupt-Bundle von 712 KB auf 352 KB gzip |
| D17 | Keine JetBrains-Screenshots, stattdessen SVG-Nachbau + Links + MISSING_SCREENSHOTS.md | Keine Lizenz gefunden, die Weiterverwendung erlaubt |
| D18 | Zwei UI-Varianten (Standard/Apple) per data-ui-Attribut und Design-Tokens, Wahl pro Nutzer | Nutzerwunsch; Basis: emilkowalski/skills (MIT) |
| D19 | Lektionen seitenweise, Kurse 10–12 Lektionen | Nutzerfeedback: zu viel Text, zu lange Kurse |
| D20 | „Für mich erledigen“ nur mit explizitem `solve`-Skript, nie aus dem Lösungstext abgeleitet | Lösungstexte enthalten Editor-Schritte und Platzhalter; abgeleitete Skripte scheiterten bei 18 von 41 Schritten |
| D16 | Commits als SynKeles44, Signierung nur in diesem Repo aus | Globaler Signaturschlüssel gehört zum Arbeitskonto |
| D12 | Simulierter Terminal-Modus (SSH, AWS, DNS) als Szenario-Engine im Frontend, gleiche Terminal-Komponente | Nicht lokal echt ausführbare Themen trotzdem tippbar |

## Phase 1 – Analyse
- [x] Projekt „javascript“ analysieren
- [x] Arbeitsprojekte analysieren (nur Themen und Konzepte)
- [x] Zusätzliche Kursthemen ableiten und unten eintragen (11 Kurse, Quelle A)

## Phase 2 – Fundament
- [x] Docker-Compose (php-fpm, nginx, postgres, frontend-build, sandbox, egress-proxy)
- [x] Laravel-Backend (Auth, Modelle, Migrationen, API)
- [x] Content-Importer + Validator
- [x] Frontend-Grundgerüst (Router Data Mode, shadcn, Theme, Layout, Logo)
- [ ] README, CONTRIBUTING, LICENSE, .env.example

## Phase 3 – Übungs-Terminal-Sandbox
- [x] Sandbox-Image (git, nvm/node, bun, npm, php, composer, phpstan, pint, Linux-Tools)
- [x] WebSocket-Gateway (PTY pro Sitzung, Workspace-Ordner pro Kurs)
- [x] Check-API, Reset-API, Datei-Schreib-API für PHP-Aufgaben
- [x] Absicherung: non-root, cap_drop, no-new-privileges, pids/mem/cpu-Limits, Egress-Allowlist
- [x] Simulierter Modus

## Phase 4 – Kernfunktionen
- [x] Kurse/Module/Lektionen-Ansicht, Markdown-Rendering, Code-Blöcke mit Copy
- [x] Begriffslexikon inkl. Tooltip, Freischalt-Animation, Fortschritt
- [x] Quizze (Multiple Choice, Lückentext, Code-Zuordnung, Finde den Fehler)
- [x] Interaktive Aufgaben (Terminal, simuliert, JS/TS/React, PHP, Drag&Drop, Reihenfolge, Diagramm, Request-Builder, Was-passiert-als-Nächstes)
- [x] Begleitete Projekte
- [x] Prüfungen + Schwächenanalyse + Zertifikat
- [x] Volltextsuche / Wiki-Modus
- [x] Lesezeichen, Notizen, Fortschritt, Dashboard, Streak, Badges
- [x] Animationen, Dark/Light, Mobile-First

## Phase 5 – Beispielkurs (alle Aufgabentypen)
- [ ] Git-Kurs vollständig

## Phase 6 – Kurse
Legende Quelle: P = aus dem Prompt, A = aus der Analyse der eigenen Projekte abgeleitet.

| Nr | Slug | Kurs | Quelle | Status |
|---|---|---|---|---|
| 01 | programmieren-grundlagen | Grundlagen der Programmierung | P | [x] |
| 02 | terminal-shell | Terminal & Shell | P | [x] |
| 03 | wie-das-internet-funktioniert | Wie das Internet funktioniert | P | [x] |
| 04 | netzwerk-grundlagen | Netzwerk-Grundlagen & Server-Zugang | P | [x] |
| 05 | ssh | SSH | P | [x] |
| 06 | git | Git (Beispielkurs, alle Aufgabentypen) | P | [x] |
| 07 | github | GitHub | P | [x] |
| 08 | teamarbeit | Arbeiten im Team | P | [x] |
| 09 | entwicklungsumgebung | Entwicklungsumgebung & Task-Runner (mise, direnv, EditorConfig, Devcontainer, Makefile) | A | [x] |
| 10 | node-runtimes-paketmanager | Node.js, Runtimes & Paketmanager | P | [x] |
| 11 | libraries-pakete-registries | Libraries, Pakete & Registries | P | [x] |
| 12 | projektaufbau | Aufbau eines Projekts | P | [x] |
| 13 | datenformate | JSON, YAML & Datenformate | P | [x] |
| 14 | regex | Reguläre Ausdrücke | P | [x] |
| 15 | debugging-devtools | Debugging & Entwicklertools | P | [x] |
| 16 | fremden-code-lesen | Fremden Code lesen und verstehen | P | [x] |
| 17 | phpstorm-datenbank-tools | PhpStorm: Datenbank-Tools | P | [x] |
| 18 | http-https | HTTP & HTTPS | P | [x] |
| 19 | apis-endpunkte | Endpunkte & APIs | P | [x] |
| 20 | api-dokumentation | API-Dokumentation automatisieren (OpenAPI, swagger-php, Scramble, Redocly) | P+A | [x] |
| 21 | dokumentation-schreiben | Dokumentation schreiben | P | [x] |
| 22 | html-css-tailwind | HTML & CSS inkl. Tailwind | P | [x] |
| 23 | javascript | JavaScript | P | [x] |
| 24 | typescript | TypeScript | P | [x] |
| 25 | react | React | P | [x] |
| 26 | react-komponenten-architektur | React-Komponenten-Architektur (Atomic Design, Compound Components, Storybook) | P+A | [x] |
| 27 | moderner-react-stack | Moderner React-Stack (Vite, Tailwind, shadcn/ui, Zod, React Router Data Mode, Bun) | P | [x] |
| 28 | server-state-tanstack | Server-State mit TanStack Query & Table | A | [x] |
| 29 | monorepos-workspaces | Monorepos & Workspaces (Bun Workspaces, Catalogs) | A | [x] |
| 30 | internationalisierung | Internationalisierung (i18n) | A | [x] |
| 31 | php | PHP | P | [x] |
| 32 | datenbanken-sql | Datenbanken & SQL | P | [x] |
| 33 | laravel | Laravel (Hauptkurs) | P | [x] |
| 34 | laravel-vertieft | Laravel vertieft | P | [~] |
| 35 | laravel-architektur | Architektur großer Laravel-Apps (Services, DTOs, Repositories, Multi-Tenancy, modularer Monolith) | A | [~] |
| 36 | authentifizierung | Authentifizierung (Sessions, JWT, OAuth, Sanctum, 2FA) | P+A | [x] |
| 37 | websicherheit | Websicherheit | P | [x] |
| 38 | performance | Performance | P | [x] |
| 39 | testing | Testing (Pest, Architekturtests, Mutation Testing, Vitest, Playwright) | P+A | [x] |
| 40 | code-qualitaet | Code-Qualität automatisiert (PHPStan, Rector, ECS, Pint, Biome, Hooks) | P+A | [~] |
| 41 | clean-code-solid-patterns | Clean Code, SOLID & Design Patterns | P | [~] |
| 42 | datenstrukturen-algorithmen | Datenstrukturen & Algorithmen | P | [~] |
| 43 | legacy-modernisieren | Legacy-Code modernisieren (Strangler-Pattern, Illuminate standalone) | A | [ ] |
| 44 | docker | Docker & Container | P+A | [~] |
| 45 | nginx-webserver | Nginx & Webserver | P | [ ] |
| 46 | deployments-cicd | Deployments & CI/CD | P+A | [ ] |
| 47 | projekt-live-stellen | Ein lokales Projekt live stellen | P | [ ] |
| 48 | observability | Observability (Logs, Metriken, Grafana, Loki, Alerting) | A | [ ] |
| 49 | aws-grundlagen | AWS-Grundlagen | P+A | [ ] |
| 50 | aws-fargate | Container in der Cloud mit AWS Fargate | P+A | [ ] |
| 51 | ki-assistenten | KI-Assistenten im Entwickleralltag | A | [ ] |
| 52 | capstone | Capstone: Von null bis live | P | [ ] |

Vorgehen: Die Inhalte schreiben parallele Autoren-Agenten nach [docs/AUTHORING.md](docs/AUTHORING.md),
ein Agent pro Kurs (Laravel: zwei Agenten). Danach Validierung, Dublettenbereinigung im Lexikon,
Stichproben-Review.

## Phase 6b – Plattform-Nacharbeiten aus den Kursen
- [x] project.yaml: optionales `setup` + Button „Projekt zurücksetzen“ (Fremden-Code-Kurs legt das Projekt aktuell über eine Modulübung an)
- [x] Projektschritte: `solve`-Skript + Button „Für mich erledigen“ + `stacklab:solve-check` (D20)
- [x] Git-Projekt: alle 7 `solve`-Skripte grün
- [x] `solve`-Skripte für die übrigen committeten Projekte (01–05, 07–22) – `solve-check --require-all` für alle 22 Kurse grün (2026-10-10)
- [x] `solve`-Skripte für die Kurse 23–52 (alle Projektschritte, `solve-check --require-all`)
- [x] Fortschritt zurücksetzen (Einstellungen), `make workspace` mit nativem Ordner-Dialog
- [x] `stacklab:solve-check` läuft in einem Wegwerf-Ordner `/workspace/solve-check-<kurs>` und räumt ihn danach weg; vorher setzte es die echten Projektordner der Lernenden zurück (2026-10-10)
- [x] Tests dürfen die Entwicklungs-DB nicht mehr leeren (`<server force>` in phpunit.xml)

## Phase 7 – Tests & Qualität
- [x] Backend-Tests (Pest) – 46 Tests grün, phpstan + pint sauber
- [x] Frontend-Tests (Vitest) – 17 Tests grün, tsc sauber
- [x] Content-Validierung in CI – erster GitHub-Lauf grün (2026-10-10)
- [x] Frischer Klon: `docker compose up` getestet – 52 Kurse importiert, Sandbox, Terminal und „Für mich erledigen“ funktionieren (2026-10-10)
- [x] Übungs-Terminal mit Workspace getestet – alle Terminal-Aufgaben und Projektschritte in der Sandbox durchgespielt

## Phase 8 – Doku & Abschluss
- [x] SOURCES.md, MISSING_SCREENSHOTS.md – fehlende Screenshots gibt es nur im PhpStorm-Kurs (32 Stellen); alle 237 Grafikverweise der Kurse existieren
- [x] GitHub-Repo SynKeles44/stacklab anlegen und pushen
- [x] Abgleich gegen den Ursprungs-Prompt – 52 Kurse, Laravel größter Kurs (8 h), Zertifikate, Lexikon, Suche, Lesezeichen, Notizen, Übungs-Terminal, `docker compose up` im frischen Klon
