# Leitfaden für Kurs-Autor:innen

Dieser Leitfaden ergänzt den technischen Vertrag in [`content/README.md`](../content/README.md).
Er beschreibt, **wie** eine Stacklab-Lektion klingt, wie tief sie geht und welche Regeln für
Aufgaben gelten. Musterlektionen:

- `content/courses/06-git/modules/01-grundlagen/01-was-ist-versionskontrolle.md`
- `content/courses/06-git/modules/02-commits/01-die-drei-bereiche.md`

## Zielgruppe und Ton

- Komplette Anfänger:innen und Junior-Entwickler:innen. Wer **null** Vorwissen hat, soll das Thema
  danach **wirklich gut** verstehen.
- Deutsch, Du-Form, kurze Sätze, aktive Sprache. Fachwörter sind erlaubt, werden aber beim ersten
  Auftreten erklärt **und** als Lexikon-Begriff verlinkt: `[[slug]]` oder `[[slug|Anzeigetext]]`.
- Erst das **Warum** (welches Problem wird gelöst?), dann das **Wie**, dann die **Praxis**.
- Analogien aus dem Alltag (Packtisch, Fotoalbum, Briefumschlag) – danach die präzise Fachsprache.
- Keine oberflächlichen Zusammenfassungen. Lieber ein Thema vollständig als drei halb.

## Aufbau einer Lektion

1. Einstieg: ein konkretes Problem oder eine Alltagssituation (2–4 Sätze, keine Überschrift).
2. 3–7 Abschnitte mit `##`-Überschriften, je mit Erklärung, Code-Beispiel(en) und ggf. Tabelle.
3. Mindestens ein `> [!MERKSATZ]`, ein `> [!FEHLER]` (typischer Fehler) und ein `> [!PRAXIS]`
   (Bezug zum Berufsalltag).
4. Abschluss `## Zusammenfassung` mit 4–7 Stichpunkten.
5. Umfang: **900–2000 Wörter** Fließtext. Code-Blöcke zählen nicht mit.
6. Frontmatter: `title`, `summary`, `duration`, `sources` (offizielle Dokumentation!), `quiz` (3–6 Fragen,
   gemischte Typen), `tasks` (mindestens 1, besser 2 **verschiedene** interaktive Aufgaben).

## Fachliche Korrektheit

- Offizielle Dokumentation ist die Referenz (git-scm.com, nodejs.org, bun.com, php.net, laravel.com,
  react.dev, reactrouter.com, typescriptlang.org, tailwindcss.com, ui.shadcn.com, zod.dev, vite.dev,
  docs.docker.com, nginx.org, docs.aws.amazon.com, developer.mozilla.org …). Inhalte in **eigenen Worten**,
  nichts kopieren.
- Aktuelle Versionen (Stand Oktober 2026): PHP 8.5, Laravel 13, Composer 2.10, Node.js 24 LTS, npm 11,
  Bun 1.4, TypeScript 6, React 19, React Router 8 (wir lehren den **Data Mode**: `createBrowserRouter`,
  `loader`, `action`, `RouterProvider` aus `react-router/dom`), Vite 8, Tailwind CSS 4 (CSS-first, `@import
  "tailwindcss"`, `@theme`, kein `tailwind.config.js` nötig), shadcn/ui 4 (CLI `shadcn@latest`), Zod 4,
  PostgreSQL 18, MySQL 8.4/9, Docker Compose v2 (`docker compose`, ohne Bindestrich), Git 2.47.
- Wenn du unsicher bist, ob eine API noch aktuell ist: offizielle Doku per Web-Zugriff nachlesen.

## Sicherheit und Datenschutz

- **Niemals** echte Zugangsdaten, Tokens, Hostnamen, Account-IDs, Kundennamen oder Firmendaten.
- Platzhalter: `example.com`, `api.example.com`, `user@example.com`, `<dein-token>`, `123456789012`
  (AWS-Account), IPs aus `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32`.
- Themen aus realen Projekten sind willkommen („In großen Laravel-Projekten trennt man …“),
  aber ohne Code oder Namen daraus.

## Das Übungs-Terminal (Aufgabentyp `terminal`)

Die Befehle laufen in einem echten Linux-Container (Debian, Bash) als Benutzer `learner`.

- Verfügbar: git, node 24 (über nvm), npm, npx, nvm, bun, bunx, php 8.5 (mit pdo_sqlite, pdo_pgsql,
  intl, zip, bcmath, pcntl, xdebug), composer, pint, phpstan, laravel (Installer), sqlite3, jq, curl,
  wget, tree, nano, vim, less, make, zip/unzip, dig, ping, ssh-Client.
- **Netzwerk:** nur Paket-Registries sind erreichbar (registry.npmjs.org, Packagist/getcomposer,
  github.com/codeload/objects.githubusercontent.com, nodejs.org, bun.sh). Alles andere ist gesperrt –
  für SSH, DNS, AWS, echte Server nutzt du den Typ `simulated`.
- Pfade: Aufgaben laufen in `/workspace/<workspace_dir>/<workdir>`. `workdir` muss ein eigener,
  sprechender Unterordner sein (z. B. `erstes-repo`), niemals `.`.
- `setup` läuft beim Zurücksetzen in einem **leeren** `workdir` mit `set -e`. Alles, was die Aufgabe
  voraussetzt, legt `setup` an. Es gibt **keine** globale Git-Identität: Wenn `setup` committet, setze
  vorher `git config user.name "Stacklab"` und `git config user.email "stacklab@example.com"` (lokal).
  Der Standard-Branch ist `main`.
- `npm install`/`composer install` in `setup` sind erlaubt, aber langsam – nutze sie nur, wenn nötig,
  und bevorzuge kleine Pakete.
- Checks prüfen das **Ergebnis**, nicht den Weg. Robust formulieren: `git log --oneline | wc -l`
  statt exakte Hashes; `stdout_matches` mit `\\s*` für Leerzeichen; `jq -r` für JSON; keine Checks auf
  Ausgaben, die sich zwischen Versionen ändern.
- Jede Check-`message` sagt in Du-Form, **was noch fehlt** – sie ist der Hinweis für Lernende.
- In der Aufgabenbeschreibung steht immer: was vorbereitet ist, was zu tun ist (nummerierte
  Schritte) und dass zuerst **Aufgabe vorbereiten** geklickt werden soll, falls `setup` existiert.
- Jede Terminal-Aufgabe hat `hints` (2–3, vom vagen zum konkreten Tipp) und eine `solution`.

## Code-Aufgaben (Typ `code`)

- js/ts: Tests mit `assertEqual`, `assertDeepEqual`, `assertTrue`, `assertThrows`. Der Testcode sieht
  alle Variablen und Funktionen deines Codes (gleicher Gültigkeitsbereich). Kein `import`/`require`,
  kein DOM, kein Netzwerk.
- jsx/tsx: Code definiert `function App()`. React ist als `React` verfügbar (`React.useState`).
  Kein `import`. Tests sind asynchron und nutzen `container`, `query`, `queryAll`, `text()`,
  `await click(selector)`, `await type(selector, value)`, `assertEqual`, `assertTrue`.
- php: Testcode läuft **in einer Funktion** – er sieht deine Funktionen und Klassen, aber keine
  globalen Variablen. Nutze `assert_same($erwartet, $ist)` und `assert_true($wert)`.
  Kein Laravel, keine Composer-Pakete, keine Datenbank (dafür gibt es Terminal-Aufgaben).
- `starter` gibt ein sinnvolles Gerüst vor, `solution` ist vollständig lauffähig.
- Mindestens 3 Tests: Normalfall, Randfall (leer/0/null), Sonderfall.

## Konzept-Aufgaben

`dragdrop`, `order`, `diagram`, `request`, `steps` – siehe Vertrag. Für `diagram` brauchst du ein
SVG **ohne** Beschriftung an den Slot-Stellen (Variante `…-leer.svg`), Slot-Koordinaten in Prozent der
Bildbreite/-höhe.

## SVG-Grafiken

- Ablage unter `content/assets/<kurs-slug>/name.svg`, Einbindung `![Beschreibung](/assets/<kurs-slug>/name.svg)`.
- Weißer Hintergrund (`<rect width="100%" height="100%" fill="#ffffff"/>`), dunkle Schrift (#1e1b3a),
  Akzentfarben #22d3ee, #a78bfa, #34d399, #f59e0b, #f87171, Schrift `Inter, Segoe UI, Helvetica, Arial, sans-serif`,
  Code in `ui-monospace, Menlo, monospace`. `viewBox` setzen, keine festen width/height, keine Skripte,
  keine externen Ressourcen.

## Lexikon

- **Jedes** IT-spezifische Wort bekommt einen Eintrag – auch einfache.
- Eigene Begriffe in `content/glossary/<kurs-slug>.yaml`. Fremde Lexikon-Dateien nicht ändern.
- Vor dem Anlegen prüfen, ob der Slug existiert: `grep -rh "^- slug:" content/glossary | sort`.
  Existiert er, verlinke ihn einfach.
- `lesson` zeigt auf die Lektion **deines** Kurses, in der der Begriff erklärt wird
  (`kurs-slug/lektions-slug`).
- `short`: ein Satz. `explanation`: 2–4 Sätze. `example`: konkret.

## Projekt und Prüfung

- `project.yaml`: ein echtes Projekt, das Lernende **selbst** bauen, 5–10 Schritte, jeder mit
  Checkliste, Tipps und – wo möglich – automatischen `checks` im Workspace.
- `exam.yaml`: mindestens 15 Fragen über alle Module (Feld `module`!), 2–4 Praxis-Aufgaben
  (`code` oder `terminal`), `pass_percent: 70`, Zeitlimit passend zum Umfang.

## Prüfen

```bash
cd backend && php artisan stacklab:validate --path=../content --warnings
```

Fehler in deinen Dateien müssen weg. Warnungen zu kurzen Texten oder fehlenden Übungen ernst nehmen.
