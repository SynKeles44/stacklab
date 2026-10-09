---
title: Registries, Versionen und Lockfiles
summary: Was npmjs.com, Packagist, Docker Hub und GitHub Packages gemeinsam haben, wie ein Paket veröffentlicht wird und wie Paketmanager aus Versionsbereichen exakte Versionen machen.
duration: 25
sources:
  - title: npm Docs – About the public npm registry
    url: https://docs.npmjs.com/about-the-public-npm-registry
  - title: npm Docs – npm publish
    url: https://docs.npmjs.com/cli/v11/commands/npm-publish
  - title: npm Docs – package-lock.json
    url: https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json
  - title: Packagist – About
    url: https://packagist.org/about
  - title: Docker Docs – Docker Hub
    url: https://docs.docker.com/docker-hub/
  - title: GitHub Docs – Introduction to GitHub Packages
    url: https://docs.github.com/en/packages/learn-github-packages/introduction-to-github-packages
quiz:
  - type: match
    question: Ordne jeder Registry zu, was sie verteilt.
    pairs:
      - { left: "npmjs.com", right: "JavaScript- und TypeScript-Pakete" }
      - { left: "Packagist", right: "Metadaten zu PHP-Paketen für Composer" }
      - { left: "Docker Hub", right: "Container-Images" }
      - { left: "GitHub Packages", right: "Pakete und Images direkt neben dem GitHub-Repository" }
    explanation: Alle vier sind Registries – zentrale Verzeichnisse mit Namen, Versionen und Downloads. Sie unterscheiden sich vor allem darin, welche Art von Paket sie speichern.
  - type: single
    question: 'In der package.json steht `"ms": "^2.1.0"`. Die Registry kennt 2.0.0, 2.1.0, 2.1.3 und 3.0.0. Was installiert npm ohne Lockfile?'
    options: ["2.0.0", "2.1.0", "2.1.3", "3.0.0"]
    answer: 2
    explanation: "^2.1.0 erlaubt alles ab 2.1.0 unter 3.0.0. Der Paketmanager nimmt die höchste passende Version – also 2.1.3."
  - type: multiple
    question: Was steht im Lockfile-Eintrag eines npm-Pakets?
    options:
      - Die exakte installierte Version
      - Die Adresse, von der das Archiv geladen wurde (resolved)
      - Eine Prüfsumme des Archivs (integrity)
      - Das Passwort für die Registry
    answers: [0, 1, 2]
    explanation: Mit Version, Adresse und Prüfsumme kann npm genau dasselbe Archiv wieder laden und prüfen, dass es unverändert ist. Zugangsdaten gehören nie ins Lockfile.
  - type: cloze
    text: Ein Composer-Paket wird auf Packagist veröffentlicht, indem du sein Git-Repository dort einträgst. Neue Versionen entstehen durch Git-___. Bei npm lädst du ein Paket mit `npm ___` hoch.
    blanks:
      - [Tags, Tag]
      - [publish]
    explanation: Packagist liest Versionen aus den Tags deines Repositorys (z. B. v1.2.0). npm publish packt den Ordner und lädt ihn in die Registry.
tasks:
  - id: lockfiles-lesen
    type: terminal
    title: Lockfiles mit jq lesen
    description: |
      Im Ordner `lockfiles` liegt ein Projekt mit beiden Welten: npm hat `debug` installiert
      (`package-lock.json`), Composer hat `ramsey/uuid` installiert (`composer.lock`).

      Lege eine Datei `bericht.txt` mit genau drei Zeilen an:

      1. die **exakte** Version des Pakets `ms` aus der package-lock.json,
      2. den **Hostnamen**, von dem npm das Archiv von `ms` geladen hat (steht im Feld `resolved`),
      3. die **exakte** Version des Composer-Pakets `brick/math` aus der composer.lock.

      Nutze `jq` – die Versionen ändern sich mit der Zeit, darum lies sie aus, statt zu raten.

      Klicke zuerst auf **Aufgabe vorbereiten** (dauert ein paar Sekunden).
    workdir: lockfiles
    setup: |
      npm init -y > /dev/null
      npm install debug > /dev/null 2>&1
      composer init -n -q --name=stacklab/lockfiles
      composer require -n -q ramsey/uuid 2> /dev/null
    checks:
      - type: file_exists
        path: bericht.txt
        message: Die Datei bericht.txt fehlt noch.
      - type: command
        run: '[ "$(sed -n 1p bericht.txt | tr -d "[:space:]")" = "$(jq -r ''.packages["node_modules/ms"].version'' package-lock.json)" ] && echo stimmt'
        stdout_equals: stimmt
        message: Zeile 1 soll genau die Version von ms aus package-lock.json enthalten (packages → "node_modules/ms" → version).
      - type: command
        run: sed -n 2p bericht.txt | tr -d '[:space:]'
        stdout_equals: registry.npmjs.org
        message: Zeile 2 soll den Hostnamen aus dem Feld resolved von ms enthalten – ohne https:// und ohne Pfad.
      - type: command
        run: '[ "$(sed -n 3p bericht.txt | tr -d "[:space:]")" = "$(jq -r ''.packages[] | select(.name == "brick/math") | .version'' composer.lock)" ] && echo stimmt'
        stdout_equals: stimmt
        message: Zeile 3 soll genau die Version von brick/math aus composer.lock enthalten.
    hints:
      - "`jq -r '.packages[\"node_modules/ms\"]' package-lock.json` zeigt den ganzen Eintrag von ms."
      - "In composer.lock ist `packages` eine Liste: `jq -r '.packages[] | select(.name == \"brick/math\") | .version' composer.lock`"
      - "Mit `>` schreibst du die erste Zeile, mit `>>` hängst du weitere an."
    solution: |
      ```bash
      cd lockfiles
      jq -r '.packages["node_modules/ms"].version' package-lock.json > bericht.txt
      jq -r '.packages["node_modules/ms"].resolved' package-lock.json   # https://registry.npmjs.org/ms/-/ms-….tgz
      echo registry.npmjs.org >> bericht.txt
      jq -r '.packages[] | select(.name == "brick/math") | .version' composer.lock >> bericht.txt
      cat bericht.txt
      ```
  - id: weg-eines-pakets
    type: diagram
    title: Der Weg eines Pakets
    description: Beschrifte die vier Stationen, die ein Paket von der Autorin bis in dein Projekt durchläuft.
    image: /assets/libraries-pakete-registries/registry-fluss-leer.svg
    slots:
      - { x: 12.5, y: 50, answer: Autorin }
      - { x: 37.5, y: 50, answer: Registry }
      - { x: 62.5, y: 50, answer: Paketmanager }
      - { x: 87.5, y: 50, answer: Projekt }
    distractors: [Compiler, Browser]
    hints:
      - Die Pfeile zeigen npm publish, Download und npm install.
---
Wenn du `npm install ms` tippst, woher weiß dein Rechner, wo `ms` liegt und welche Version die richtige
ist? Die Antwort ist eine [[registry|Registry]]: ein zentrales Verzeichnis, das zu jedem Paketnamen alle
Versionen und ihre Downloads kennt – wie ein riesiger Katalog einer Bibliothek.

## Die wichtigsten Registries

| Registry | Für | Paketmanager | Namensform |
|---|---|---|---|
| [[npm-registry\|npmjs.com]] | JavaScript/TypeScript | npm, Bun, pnpm | `ms`, `@scope/name` |
| [[packagist\|Packagist]] | PHP | Composer | `hersteller/paket` |
| [[docker-hub\|Docker Hub]] | [[docker-image\|Container-Images]] | Docker | `nginx`, `user/image:tag` |
| [[github-packages\|GitHub Packages]] | npm, Container, Maven u. a. | je nach Typ | `@owner/name`, `ghcr.io/owner/image` |

Ein Unterschied ist wichtig: npmjs.com speichert die **Archive** selbst. Packagist speichert nur
**Metadaten** – die Dateien lädt Composer meist direkt als ZIP von GitHub oder GitLab.

![Der Weg eines Pakets: Autorin, Registry, Paketmanager, Projekt](/assets/libraries-pakete-registries/registry-fluss.svg)

## Veröffentlichen

**npm:** Du packst den Ordner und lädst ihn hoch. Vorher lohnt ein Blick, welche Dateien im Archiv landen:

```bash title="Terminal"
npm pack --dry-run   # zeigt den Inhalt des Archivs, ohne etwas hochzuladen
npm publish          # lädt die Version aus package.json hoch (Konto nötig)
```

Das Feld `files` in der package.json legt fest, was ins Archiv kommt (z. B. nur `dist/`). Eine einmal
veröffentlichte Versionsnummer ist für immer vergeben – auch nach dem Zurückziehen.

**Packagist:** Du trägst die Adresse deines Git-Repositorys ein. Jeder Git-[[tag|Tag]] wie `v1.2.0` wird
automatisch zu einer Version.

> [!FEHLER]
> **Geheimnisse veröffentlichen.** Ohne `files`-Feld landet alles im Archiv, was nicht ignoriert wird –
> auch eine vergessene `.env`. Prüfe vor jedem `npm publish` die Liste von `npm pack --dry-run`.

## Vom Versionsbereich zur exakten Version

In der package.json stehen **Wünsche** wie `^2.1.0`. Der Paketmanager macht daraus eine **exakte** Version.
Diesen Vorgang nennt man [[versionsaufloesung|Versionsauflösung]]:

1. Alle Versionen des Pakets aus der Registry holen.
2. Die herausfiltern, die zum Bereich passen.
3. Die **höchste** passende nehmen – und das für jede transitive Abhängigkeit wiederholen.

| Bereich | Erlaubt | Bei 2.0.0, 2.1.3, 2.4.1, 3.0.0 gewinnt |
|---|---|---|
| `^2.1.0` | ≥ 2.1.0 und < 3.0.0 | 2.4.1 |
| `~2.1.0` | ≥ 2.1.0 und < 2.2.0 | 2.1.3 |
| `2.1.3` | genau 2.1.3 | 2.1.3 |

Morgen kann eine neue Version 2.5.0 erscheinen – dann würde dieselbe package.json etwas anderes
installieren. Genau dagegen hilft das Lockfile.

## Lockfiles lesen

Das [[lockfile|Lockfile]] friert das Ergebnis der Auflösung ein. Beide Formate sind JSON und lassen sich mit
[[jq]] lesen:

```bash title="package-lock.json"
jq '.packages["node_modules/ms"]' package-lock.json
# { "version": "2.1.3",
#   "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
#   "integrity": "sha512-…" }
```

```bash title="composer.lock"
jq -r '.packages[] | "\(.name) \(.version)"' composer.lock
```

| Feld | Bedeutung |
|---|---|
| `version` | exakt installierte Version |
| `resolved` / `dist.url` | woher das Archiv kam |
| `integrity` / `shasum` | [[pruefsumme\|Prüfsumme]] – stimmt sie nicht, bricht die Installation ab |

> [!MERKSATZ]
> Manifest = **Wunsch** (Bereich), Lockfile = **Wirklichkeit** (exakte Version, Quelle, Prüfsumme). Das
> Lockfile gehört immer ins Repository.

> [!PRAXIS]
> In Code-Reviews lohnt ein Blick in die Lockfile-Änderungen: Steht dort plötzlich eine fremde Adresse
> unter `resolved` oder ein Paket, das niemand bewusst hinzugefügt hat, ist das ein Warnsignal.

## Zusammenfassung

- Eine **Registry** ist ein Katalog aus Paketnamen, Versionen und Downloads: npmjs.com, Packagist, Docker Hub, GitHub Packages.
- Packagist speichert nur Metadaten, die Dateien kommen meist von GitHub.
- `npm publish` lädt hoch, `npm pack --dry-run` zeigt vorher den Inhalt; bei Packagist werden Git-Tags zu Versionen.
- **Versionsauflösung** nimmt die höchste Version, die zum Bereich passt.
- Das **Lockfile** hält Version, Quelle und Prüfsumme fest – mit `jq` kannst du es gezielt auslesen.
