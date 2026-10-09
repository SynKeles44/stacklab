# Quellen und Lizenzen

Alle Lerninhalte von Stacklab sind in eigenen Worten geschrieben. Als fachliche Referenz dienen die
offiziellen Dokumentationen der jeweiligen Projekte. Jede Lektion nennt ihre Quellen im Frontmatter
(`sources`) und zeigt sie unten auf der Seite an.

## Grafiken

Alle Diagramme unter `content/assets/` wurden für Stacklab erstellt und stehen unter der MIT-Lizenz
dieses Repositorys.

## Screenshots

| Datei | Quelle | Lizenz |
|---|---|---|
| – | – | – |

**Entscheidung zu PhpStorm-Screenshots:** Für die Hilfe-Seiten von JetBrains
(jetbrains.com/help/phpstorm) konnte keine Lizenz gefunden werden, die eine Weiterverwendung der
Screenshots in einem Open-Source-Projekt ausdrücklich erlaubt. Deshalb werden **keine** JetBrains-
Screenshots ins Repository übernommen. Stattdessen:

- verlinken die Lektionen auf die passende Seite der offiziellen Dokumentation,
- zeigen nachgebaute, schematische SVG-Darstellungen die Bedienelemente,
- listet [MISSING_SCREENSHOTS.md](MISSING_SCREENSHOTS.md) alle Stellen, an denen eigene Screenshots
  die Lektion verbessern würden.

Eigene Screenshots (aus deiner PhpStorm-Installation, mit Beispieldaten) dürfen ergänzt werden.
Lege sie unter `content/screenshots/<kurs-slug>/` ab und trage sie in die Tabelle oben ein.

## Software

Stacklab nutzt Open-Source-Software, u. a. Laravel (MIT), React (MIT), React Router (MIT),
Tailwind CSS (MIT), shadcn/ui (MIT), Radix UI (MIT), Zod (MIT), Motion (MIT), CodeMirror (MIT),
xterm.js (MIT), Vite (MIT), Bun (MIT), node-pty (MIT), PostgreSQL (PostgreSQL License),
Nginx (BSD-2-Clause), tinyproxy (GPL-2.0, nur als separates Container-Programm), lucide (ISC).
