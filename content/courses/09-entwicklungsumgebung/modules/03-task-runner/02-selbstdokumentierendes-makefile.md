---
title: Ein selbstdokumentierendes Makefile
summary: Typische Targets wie setup, start, stop, test und logs – und ein help-Target, das mit grep und awk automatisch eine Übersicht aller Befehle erzeugt.
duration: 25
sources:
  - title: GNU make – Special Variables (.DEFAULT_GOAL, MAKEFILE_LIST)
    url: https://www.gnu.org/software/make/manual/html_node/Special-Variables.html
  - title: GNU awk – Field Separators
    url: https://www.gnu.org/software/gawk/manual/html_node/Field-Separators.html
  - title: Docker Docs – docker compose
    url: https://docs.docker.com/reference/cli/docker/compose/
quiz:
  - type: single
    question: Was bewirkt `.DEFAULT_GOAL := help`?
    options:
      - Das Target help wird bei jedem Aufruf zusätzlich ausgeführt.
      - Ein Aufruf von `make` ohne Target führt help aus.
      - help wird vor allen anderen Targets versteckt.
    answer: 1
    explanation: Ohne die Zeile wäre das erste Target der Datei der Standard. So zeigt ein einfaches `make` die Übersicht an – ideal für neue Teammitglieder.
  - type: multiple
    question: Welche Zeilen erscheinen in der Ausgabe des help-Targets aus der Lektion?
    options:
      - "`test: ## Führt alle Tests aus`"
      - "`start: up migrate ## Startet die App`"
      - "`build:` (ohne Kommentar)"
      - "`# Interner Hilfsbefehl` über einem Target"
    answers: [0, 1]
    explanation: "Das grep-Muster sucht Zeilen mit `name:` und später `## `. Targets ohne `##`-Kommentar und normale `#`-Kommentare bleiben unsichtbar."
  - type: match
    question: Welches typische Target macht was?
    pairs:
      - { left: "make setup", right: "Einmalige Einrichtung nach dem Klonen" }
      - { left: "make start", right: "Container bzw. Dienste starten" }
      - { left: "make logs", right: "Laufende Log-Ausgaben anzeigen" }
      - { left: "make console", right: "Eine Shell im App-Container öffnen" }
    explanation: Diese Namen haben sich in vielen Teams eingebürgert. Wichtiger als die genauen Namen ist, dass sie im Projekt einheitlich sind.
  - type: cloze
    text: In einem Rezept musst du das Dollarzeichen für awk verdoppeln, also `$___1` statt `$1`.
    blanks:
      - [$]
    explanation: "make würde `$1` selbst als make-Variable auswerten. `$$1` wird zu `$1` und kommt so bei awk an."
tasks:
  - id: help-target
    type: terminal
    title: Ein Makefile mit help-Target
    description: |
      Im Ordner `make-hilfe` liegt ein Makefile mit den Targets `install`, `test`, `lint` und `clean`.
      Niemand weiß, was sie tun. Mach das Makefile selbstdokumentierend.

      1. Schreibe hinter jedes der vier Targets einen Kommentar im Format `## Beschreibung`,
         z. B. `test: ## Führt alle Tests aus`.
      2. Füge ein Target `help` mit Kommentar `## Zeigt diese Hilfe` hinzu, das mit `grep` und `awk` alle
         Zeilen mit `## ` auflistet (Name links, Beschreibung rechts).
      3. Sorge mit `.DEFAULT_GOAL := help` dafür, dass `make` ohne Target die Hilfe zeigt.
      4. Ergänze `help` in der `.PHONY`-Zeile.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: make-hilfe
    setup: |
      printf '.PHONY: install test lint clean\n\ninstall:\n\t@echo "Installiere Abhängigkeiten"\n\ntest:\n\t@echo "Tests bestanden"\n\nlint:\n\t@echo "Code ist sauber"\n\nclean:\n\t@echo "Aufgeräumt"\n' > Makefile
    checks:
      - type: command
        run: make
        stdout_matches: "^\\s*help\\s+Zeigt diese Hilfe"
        message: "make ohne Target soll die Hilfe zeigen – fehlt .DEFAULT_GOAL := help oder der Kommentar ## Zeigt diese Hilfe?"
      - type: command
        run: make help | grep -cE '^\s*(install|test|lint|clean|help)\s+\S'
        stdout_matches: "^5$"
        message: make help soll fünf Zeilen ausgeben – install, test, lint, clean und help, jeweils mit Beschreibung.
      - type: command
        run: make help | grep -E '^\s*test\s'
        stdout_matches: "test\\s+\\S.*"
        message: Hinter test fehlt eine Beschreibung (test ## …).
      - type: command
        run: make test
        stdout_matches: "Tests bestanden"
        message: make test soll weiterhin funktionieren.
      - type: file_contains
        path: Makefile
        pattern: "^\\.PHONY:.*\\bhelp\\b"
        message: Ergänze help in der .PHONY-Zeile.
    hints:
      - "Kommentare kommen in dieselbe Zeile wie das Target: `lint: ## Prüft den Code-Stil`"
      - "Das help-Rezept: `@grep -E '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = \":.*## \"}; {printf \"  %-12s %s\\n\", $$1, $$2}'`"
      - Denk an das Tab vor dem Rezept und an die doppelten Dollarzeichen.
    solution: |
      ```bash
      cd make-hilfe
      cat > Makefile <<'EOF'
      .DEFAULT_GOAL := help
      .PHONY: help install test lint clean

      help: ## Zeigt diese Hilfe
      	@grep -E '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "}; {printf "  %-12s %s\n", $$1, $$2}'

      install: ## Installiert alle Abhängigkeiten
      	@echo "Installiere Abhängigkeiten"

      test: ## Führt alle Tests aus
      	@echo "Tests bestanden"

      lint: ## Prüft den Code-Stil
      	@echo "Code ist sauber"

      clean: ## Löscht erzeugte Dateien
      	@echo "Aufgeräumt"
      EOF
      make
      ```
      Achtung: Die eingerückten Rezeptzeilen beginnen mit einem **Tab**.
  - id: target-zuordnen
    type: dragdrop
    title: Welcher Befehl gehört in welches Target?
    description: Ein Laravel-Projekt läuft in Docker Compose. Ordne jeden Befehl dem Target zu, in dessen Rezept er gehört.
    targets:
      - { id: start, label: make start }
      - { id: stop, label: make stop }
      - { id: logs, label: make logs }
      - { id: console, label: make console }
      - { id: test, label: make test }
    items:
      - { label: "docker compose up -d", target: start }
      - { label: "docker compose down", target: stop }
      - { label: "docker compose logs -f", target: logs }
      - { label: "docker compose exec app bash", target: console }
      - { label: "docker compose exec app php artisan test", target: test }
---

Ein Makefile mit 25 Targets ist wertvoll – aber nur, wenn man weiß, was drinsteht. Neue Teammitglieder
sollen nicht die Datei lesen müssen, sondern einfach `make` tippen und eine Übersicht bekommen. Das
erreichst du mit einem kleinen Trick: einem **help-Target**, das die Hilfe aus Kommentaren erzeugt.

## Typische Targets im Projektalltag

In Web-Projekten haben sich ähnliche Target-Namen eingebürgert. Sie verstecken lange Befehle hinter
kurzen, gleichbleibenden Namen:

| Target | Typischer Inhalt | Wann? |
|---|---|---|
| `setup` | `.env` anlegen, Abhängigkeiten installieren, Datenbank migrieren, Hooks einrichten | Einmal nach dem Klonen |
| `start` | `docker compose up -d` | Arbeitsbeginn |
| `stop` | `docker compose down` | Feierabend |
| `logs` | `docker compose logs -f` | Fehlersuche |
| `console` | `docker compose exec app bash` | Shell im Container |
| `test` | Tests ausführen | Vor jedem Commit |
| `lint` | Linter und Formatter prüfen | Vor jedem Commit |

```makefile title="Makefile (Ausschnitt)"
COMPOSE := docker compose

start: ## Startet alle Container
	$(COMPOSE) up -d

logs: ## Zeigt die Logs aller Container
	$(COMPOSE) logs -f

console: ## Öffnet eine Shell im App-Container
	$(COMPOSE) exec app bash
```

Die genauen Namen sind Geschmackssache. Wichtig ist, dass sie im Projekt **einheitlich** bleiben und
dass jedes Target genau eine Sache tut. Ein Target `start`, das nebenbei die Datenbank leert, ist eine
böse Überraschung.

> [!PRAXIS]
> In großen Projekten ist das Makefile das **Bedienfeld** des Repositorys. Die README sagt nur noch
> „`make setup`, dann `make start`“. Ändert sich ein Befehl (etwa ein neuer Container-Name), wird er an
> genau einer Stelle angepasst – nicht in zehn Wiki-Seiten.

## Das setup-Target

`setup` verbindet viele kleine Schritte zu einem einzigen Befehl. Dabei helfen Voraussetzungen und
Datei-Targets:

![make setup ruft seine Voraussetzungen der Reihe nach auf](/assets/entwicklungsumgebung/make-abhaengigkeiten.svg)

```makefile title="setup mit Voraussetzungen"
setup: .env install hooks ## Richtet das Projekt ein

.env: .env.example
	cp .env.example .env

install: ## Installiert Abhängigkeiten
	composer install
	npm install

hooks: ## Aktiviert die Git-Hooks
	git config core.hooksPath .githooks
```

`.env` ist ein Datei-Target: Existiert die Datei schon, überschreibt make sie nicht. So kann `make setup`
gefahrlos mehrmals laufen.

## Das help-Target

Die Idee: Jedes Target bekommt in seiner Zeile einen Kommentar mit **zwei** Rauten. Ein help-Target sucht
diese Zeilen und formatiert sie als Tabelle.

```makefile title="Makefile"
.DEFAULT_GOAL := help

help: ## Zeigt diese Hilfe
	@grep -E '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "}; {printf "  %-12s %s\n", $$1, $$2}'
```

```text title="Ausgabe von make"
  help         Zeigt diese Hilfe
  start        Startet alle Container
  logs         Zeigt die Logs aller Container
```

So funktioniert die Zeile Stück für Stück:

| Teil | Bedeutung |
|---|---|
| `$(MAKEFILE_LIST)` | Pfad(e) der gelesenen Makefiles |
| `grep -E '^[a-zA-Z_-]+:.*## '` | Nur Zeilen „Name, Doppelpunkt, irgendwas, `## `“ |
| `FS = ":.*## "` | awk teilt jede Zeile an „Doppelpunkt … `## `“ in zwei Felder |
| `printf "  %-12s %s\n"` | Name linksbündig auf 12 Zeichen, dann die Beschreibung |
| `$$1`, `$$2` | Das doppelte `$` reicht `$1` und `$2` an awk durch |

> [!MERKSATZ]
> `##` markiert die öffentliche Beschreibung eines Targets. Interne Hilfs-Targets ohne `##` tauchen in
> der Hilfe nicht auf.

> [!FEHLER]
> **Einfaches `$1` im Rezept.** make wertet `$1` selbst aus (als leere Variable) – awk bekommt nichts,
> und die Hilfe zeigt leere Zeilen. In Rezepten heißt es immer `$$1`.

## Zusammenfassung

- Typische Targets wie `setup`, `start`, `stop`, `logs`, `console`, `test` und `lint` verstecken lange Befehle.
- `setup` kombiniert Voraussetzungen; Datei-Targets wie `.env` machen es wiederholbar.
- Kommentare mit `## ` hinter dem Target dokumentieren es direkt in der Datei.
- Ein help-Target filtert diese Zeilen mit `grep` und formatiert sie mit `awk`.
- `.DEFAULT_GOAL := help` sorgt dafür, dass `make` ohne Target die Übersicht zeigt.
