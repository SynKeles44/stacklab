# Stacklab – Roadmap

Lebendes Arbeitsdokument. Wird nach jedem abgeschlossenen Schritt aktualisiert.
Status-Legende: `[ ]` offen · `[~]` in Arbeit · `[x]` fertig · `[-]` zurückgestellt (mit Grund)

## Protokoll

- **Zuletzt erledigt:** Repo initialisiert, Versionen geprüft, Projektanalyse gestartet.
- **Als Nächstes:** Phase 1 (Analyse) abschließen, Phase 2 (Fundament) bauen.

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
| D12 | Simulierter Terminal-Modus (SSH, AWS, DNS) als Szenario-Engine im Frontend, gleiche Terminal-Komponente | Nicht lokal echt ausführbare Themen trotzdem tippbar |

## Phase 1 – Analyse
- [~] Projekt „javascript“ analysieren
- [~] Arbeitsprojekte analysieren (nur Themen und Konzepte)
- [ ] Zusätzliche Kursthemen ableiten und unten eintragen

## Phase 2 – Fundament
- [ ] Docker-Compose (php-fpm, nginx, postgres, frontend-build, sandbox, egress-proxy)
- [ ] Laravel-Backend (Auth, Modelle, Migrationen, API)
- [ ] Content-Importer + Validator
- [ ] Frontend-Grundgerüst (Router Data Mode, shadcn, Theme, Layout, Logo)
- [ ] README, CONTRIBUTING, LICENSE, .env.example

## Phase 3 – Übungs-Terminal-Sandbox
- [ ] Sandbox-Image (git, nvm/node, bun, npm, php, composer, phpstan, pint, Linux-Tools)
- [ ] WebSocket-Gateway (PTY pro Sitzung, Workspace-Ordner pro Kurs)
- [ ] Check-API, Reset-API, Datei-Schreib-API für PHP-Aufgaben
- [ ] Absicherung: non-root, cap_drop, no-new-privileges, pids/mem/cpu-Limits, Egress-Allowlist
- [ ] Simulierter Modus

## Phase 4 – Kernfunktionen
- [ ] Kurse/Module/Lektionen-Ansicht, Markdown-Rendering, Code-Blöcke mit Copy
- [ ] Begriffslexikon inkl. Tooltip, Freischalt-Animation, Fortschritt
- [ ] Quizze (Multiple Choice, Lückentext, Code-Zuordnung, Finde den Fehler)
- [ ] Interaktive Aufgaben (Terminal, simuliert, JS/TS/React, PHP, Drag&Drop, Reihenfolge, Diagramm, Request-Builder, Was-passiert-als-Nächstes)
- [ ] Begleitete Projekte
- [ ] Prüfungen + Schwächenanalyse + Zertifikat
- [ ] Volltextsuche / Wiki-Modus
- [ ] Lesezeichen, Notizen, Fortschritt, Dashboard, Streak, Badges
- [ ] Animationen, Dark/Light, Mobile-First

## Phase 5 – Beispielkurs (alle Aufgabentypen)
- [ ] Git-Kurs vollständig

## Phase 6 – Kurse
(wird nach der Analyse mit allen Kursen befüllt)

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
