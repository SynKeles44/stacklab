# Stacklab – Roadmap

Lebendes Arbeitsdokument. Wird nach jedem abgeschlossenen Schritt aktualisiert.
Status-Legende: `[ ]` offen · `[~]` in Arbeit · `[x]` fertig · `[-]` zurückgestellt (mit Grund)

## Protokoll

- **Zuletzt erledigt (2026-10-10):** Fundament komplett und getestet; Lektionen seitenweise (Blättern); zwei UI-Varianten (Standard + Apple, wählbar unter Einstellungen → Darstellung, gespeichert in users.ui_variant); Kursdauer wird aus Lektionsdauern berechnet; Kurs-Größenregel 10–12 Lektionen / 4–6 h (Laravel bis 10 h) in docs/AUTHORING.md.
- **Kursstand:** siehe Abschnitt „Abbruchstand 2026-10-10“.
- **Als Nächstes:** nach Abschluss der laufenden Autoren `make validate` + Import; restliche Kurse 13–52 mit der Größenregel schreiben (Brief: docs/AUTHORING.md + content/README.md); Lexikon-Dubletten prüfen; Testkonten test@example.com und ui-test@example.com löschen; MISSING_SCREENSHOTS.md (PhpStorm-Kurs); GitHub-Repo SynKeles44/stacklab anlegen und pushen (Commits als SynKeles44, Signierung nur in diesem Repo aus); Abschlusszusammenfassung.
- **Hinweise für Autoren:** Sandbox /tmp ist noexec; kein man/sudo/zsh/python3/rsync; `nvm install` höchstens einmal mit `timeout 300` (Prozesslimit 512).

## Abbruchstand 2026-10-10 (alle Autoren-Agenten gestoppt) – HIER WEITERMACHEN

Wiederaufnahme: neue Sitzung im Ordner `stacklab`, dann „Mach mit der Roadmap weiter“. Für neue Autoren-Agenten
den Brief `.wip/agent-brief.md` verwenden (lokal, nicht im Git) – er ergänzt `docs/AUTHORING.md` um Sandbox-Regeln.
Entwürfe/Hilfsskripte der gestoppten Autoren liegen unter `.wip/scratchpad/<kurs>/` (ohne vendor/node_modules).
Unfertige Kurse liegen **unversioniert** im Arbeitsverzeichnis (`git status`), damit CI grün bleibt; der Import überspringt sie.

**Fertig und committet (23 Kurse):** 01–16 (alle), 17 phpstorm-datenbank-tools, 18 http-https, 19 apis-endpunkte,
20 api-dokumentation, 21 dokumentation-schreiben, 22 html-css-tailwind.
- Bei 17, 18, 20, 21, 22 sowie beim Projekt von 16 (neues `setup`, workdir `kiezladen-projekt`) fehlt nur der
  **abschließende Sandbox-Testlauf** (Validator: 0 Fehler, 0 Warnungen). Nächster Schritt: Terminal-Aufgaben,
  Projektschritte und Prüfungsaufgaben je Kurs einmal durchspielen (setup → Lösung → Checks).

**Unfertig (unversioniert):**

| Kurs | Vorhanden | Fehlt / nächster Schritt |
|---|---|---|
| 23 javascript | course.yaml, 4 module.yaml, 12 Lektionen, project.yaml, exam.yaml | Lexikon `content/glossary/javascript.yaml` fehlt komplett (45 Validator-Fehler = unbekannte Begriffe); SVGs fehlen; Sandbox-Tests |
| 24 typescript | course.yaml, 4 module.yaml, 11 Lektionen, Lexikon (43 Begriffe) | project.yaml, exam.yaml; Sandbox-Tests (tsc-Aufgaben) |
| 25 react | course.yaml, 3 module.yaml, 11 Lektionen (Modul 04 hat nur 2 Lektionen, kein module.yaml) | modules/04-effekte-und-praxis/module.yaml, ggf. 1 Lektion, Lexikon `react.yaml`, project.yaml, exam.yaml, Tests der jsx-Aufgaben |
| 26 react-komponenten-architektur | nur 3 Lektionen in modules/01-struktur | fast alles: course.yaml, module.yaml, Module 02–04, Lexikon, Projekt, Prüfung |
| 31 php | course.yaml, 2 module.yaml, 9 Lektionen (Module 01–02 komplett, 03-oop hat 3 Lektionen ohne module.yaml) | module.yaml für 03-oop, Modul 04 (Fehler/Composer/PSR-4, Projekt-App), Lexikon `php.yaml`, project.yaml, exam.yaml |
| 32 datenbanken-sql | course.yaml, 3 module.yaml, 10 Lektionen (04 hat 1 Lektion: transaktionen) | Modul 04 (indizes/explain, sql-injection), module.yaml 04, Lexikon `datenbanken-sql.yaml`, project.yaml, exam.yaml |
| 33 laravel | **nichts im content-Ordner** | komplett. Vorarbeit in `.wip/scratchpad/laravel/` (Setup-Skripte `setup-basis.sh`, `snippet-*.sh`, Referenz-App `ref/`, Worker-Notizen w1–w3) |

**Noch nicht begonnen:** 27 moderner-react-stack, 28 server-state-tanstack, 29 monorepos-workspaces,
30 internationalisierung, 34 laravel-vertieft, 35 laravel-architektur, 36 authentifizierung, 37 websicherheit,
38 performance, 39 testing, 40 code-qualitaet, 41 clean-code-solid-patterns, 42 datenstrukturen-algorithmen,
43 legacy-modernisieren, 44 docker, 45 nginx-webserver, 46 deployments-cicd, 47 projekt-live-stellen,
48 observability, 49 aws-grundlagen, 50 aws-fargate, 51 ki-assistenten, 52 capstone.

**Betriebs-Hinweise für die Autoren-Phase:**
- Höchstens ca. 8 Autoren gleichzeitig: Die Sandbox (Prozesslimit 512) lief zweimal voll. Bei
  „fork: Resource temporarily unavailable“: `docker compose restart sandbox`.
- Jeder Autor nutzt einen eigenen Hilfsordner; nie fremde Skripte ausführen.
- Vor Abschluss: `grep -rh "^- slug:" content/glossary | sort | uniq -d` muss leer sein.

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
| 23 | javascript | JavaScript | P | [~] |
| 24 | typescript | TypeScript | P | [~] |
| 25 | react | React | P | [~] |
| 26 | react-komponenten-architektur | React-Komponenten-Architektur (Atomic Design, Compound Components, Storybook) | P+A | [~] |
| 27 | moderner-react-stack | Moderner React-Stack (Vite, Tailwind, shadcn/ui, Zod, React Router Data Mode, Bun) | P | [ ] |
| 28 | server-state-tanstack | Server-State mit TanStack Query & Table | A | [ ] |
| 29 | monorepos-workspaces | Monorepos & Workspaces (Bun Workspaces, Catalogs) | A | [ ] |
| 30 | internationalisierung | Internationalisierung (i18n) | A | [ ] |
| 31 | php | PHP | P | [~] |
| 32 | datenbanken-sql | Datenbanken & SQL | P | [~] |
| 33 | laravel | Laravel (Hauptkurs) | P | [~] |
| 34 | laravel-vertieft | Laravel vertieft | P | [ ] |
| 35 | laravel-architektur | Architektur großer Laravel-Apps (Services, DTOs, Repositories, Multi-Tenancy, modularer Monolith) | A | [ ] |
| 36 | authentifizierung | Authentifizierung (Sessions, JWT, OAuth, Sanctum, 2FA) | P+A | [ ] |
| 37 | websicherheit | Websicherheit | P | [ ] |
| 38 | performance | Performance | P | [ ] |
| 39 | testing | Testing (Pest, Architekturtests, Mutation Testing, Vitest, Playwright) | P+A | [ ] |
| 40 | code-qualitaet | Code-Qualität automatisiert (PHPStan, Rector, ECS, Pint, Biome, Hooks) | P+A | [ ] |
| 41 | clean-code-solid-patterns | Clean Code, SOLID & Design Patterns | P | [ ] |
| 42 | datenstrukturen-algorithmen | Datenstrukturen & Algorithmen | P | [ ] |
| 43 | legacy-modernisieren | Legacy-Code modernisieren (Strangler-Pattern, Illuminate standalone) | A | [ ] |
| 44 | docker | Docker & Container | P+A | [ ] |
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

## Phase 7 – Tests & Qualität
- [ ] Backend-Tests (Pest)
- [ ] Frontend-Tests (Vitest)
- [ ] Content-Validierung in CI
- [ ] Frischer Klon: `docker compose up` getestet
- [ ] Übungs-Terminal mit Workspace getestet

## Phase 8 – Doku & Abschluss
- [ ] SOURCES.md, MISSING_SCREENSHOTS.md
- [ ] GitHub-Repo SynKeles44/stacklab anlegen und pushen
- [ ] Abgleich gegen den Ursprungs-Prompt
