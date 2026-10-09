---
title: .nvmrc, Aliase und LTS-Versionen
summary: Wie du die Node-Version pro Projekt festschreibst und welche Version du nach dem Release-Plan von Node.js wählst.
duration: 25
sources:
  - title: nvm – README (.nvmrc)
    url: https://github.com/nvm-sh/nvm#nvmrc
  - title: npm Docs – package.json engines
    url: https://docs.npmjs.com/cli/v11/configuring-npm/package-json#engines
  - title: Node.js – Releases
    url: https://nodejs.org/en/about/previous-releases
  - title: Node.js Release Working Group – Release schedule
    url: https://github.com/nodejs/Release#release-schedule
quiz:
  - type: single
    question: Im Projektordner liegt eine `.nvmrc` mit dem Inhalt `22`. Was macht `nvm use` ohne weitere Angabe?
    options:
      - Es wechselt auf die neueste installierte Version.
      - Es liest die .nvmrc und wechselt auf die installierte Version 22.x.
      - Es meldet einen Fehler, weil die Version fehlt.
      - Es ändert die Standardversion dauerhaft auf 22.
    answer: 1
    explanation: Ohne Argument sucht nvm im aktuellen Ordner und den Elternordnern nach einer .nvmrc und nutzt die Version daraus – nur für diese Shell.
  - type: match
    question: Was legt welche Datei oder welcher Befehl fest?
    pairs:
      - { left: ".nvmrc", right: "Welche Version nvm in diesem Projekt aktiviert" }
      - { left: "engines.node in package.json", right: "Welche Versionen das Paket unterstützt (Bereich)" }
      - { left: "nvm alias default 24", right: "Version für jede neue Shell" }
      - { left: "nvm alias legacy 22", right: "Eigener Kurzname für eine Version" }
    explanation: .nvmrc steuert nvm, engines dokumentiert die Unterstützung, Aliase sind Namen für Versionen.
  - type: single
    question: Welche Node-Versionen empfiehlt das Node.js-Projekt für Produktionsanwendungen?
    options:
      - Nur die Current-Version, weil sie am neuesten ist.
      - Active-LTS- oder Maintenance-LTS-Versionen.
      - Jede ungerade Version.
      - Die Version, die beim Betriebssystem vorinstalliert ist.
    answer: 1
    explanation: LTS-Versionen bekommen lange Sicherheits- und Fehlerkorrekturen. Current-Versionen sind zum Ausprobieren gedacht.
  - type: cloze
    text: LTS steht für Long Term ___. Bis Node.js 26 wurden nur die ___ Hauptversionen zu LTS-Versionen.
    blanks:
      - [Support]
      - [geraden, gerade]
    explanation: Ungerade Versionen wie 23 oder 25 waren nur rund sechs Monate unterstützt. Ab Node.js 27 erscheint eine Hauptversion pro Jahr, die nach ihrer Current-Phase LTS wird.
  - type: find-bug
    question: Ein Kollege wundert sich, warum `nvm use` „No .nvmrc file found“ meldet. Was ist falsch?
    language: bash
    code: |
      cd ~/projekte/shop
      echo "22" > .nvmrc.txt
      nvm install
      nvm use
    bug_line: 2
    explanation: Die Datei muss exakt .nvmrc heißen – ohne Endung.
tasks:
  - id: projektversion-festlegen
    type: terminal
    title: Die Node-Version eines Projekts festschreiben
    description: |
      Im Ordner `altprojekt` liegt ein Projekt, das laut package.json Node.js 22 braucht. Klicke
      zuerst auf **Aufgabe vorbereiten**. Node.js 22 hast du in der letzten Lektion installiert –
      falls nicht, führe einmal `nvm install 22` aus.

      1. Lies mit `jq .engines package.json`, welche Version gebraucht wird.
      2. Lege im Ordner eine `.nvmrc` an, die auf Node.js `22` zeigt.
      3. Wechsle mit `nvm use` (ohne Argument) und prüfe mit `node -v`.
      4. Lege einen Alias `altprojekt` an, der auf `22` zeigt.
      5. Die Standardversion (`default`) bleibt 24.
    workdir: altprojekt
    setup: |
      cat > package.json <<'EOF'
      {
        "name": "altprojekt",
        "version": "3.2.0",
        "private": true,
        "engines": { "node": ">=22 <23" }
      }
      EOF
    checks:
      - type: file_exists
        path: .nvmrc
        message: Im Ordner fehlt die Datei .nvmrc.
      - type: file_contains
        path: .nvmrc
        pattern: "^\\s*v?22(\\.\\d+){0,2}\\s*$"
        message: Die .nvmrc soll auf Version 22 zeigen, z. B. mit dem Inhalt 22.
      - type: command
        run: nvm use >/dev/null 2>&1 && node -v
        stdout_matches: "^v22\\."
        message: nvm use im Ordner soll auf Node 22 wechseln. Ist Node 22 installiert (nvm install 22)?
      - type: command
        run: nvm version altprojekt
        stdout_matches: "^v22\\."
        message: Der Alias altprojekt soll auf 22 zeigen (nvm alias altprojekt 22).
      - type: command
        run: nvm version default
        stdout_matches: "^v24\\."
        message: Die Standardversion soll 24 bleiben.
    hints:
      - "`echo 22 > .nvmrc` legt die Datei an."
      - "`nvm alias altprojekt 22` legt einen eigenen Namen an. Danach geht auch `nvm use altprojekt`."
    solution: |
      ```bash
      cd altprojekt
      jq .engines package.json
      echo 22 > .nvmrc
      nvm use          # Found '.nvmrc' with version <22>
      node -v          # v22.x.x
      nvm alias altprojekt 22
      ```
  - id: versionsstatus
    type: dragdrop
    title: Welcher Status gilt im Oktober 2026?
    description: |
      Ordne jede Node-Version ihrem Status zu – Stand Anfang Oktober 2026. Die Release-Übersicht
      auf nodejs.org hilft dir.
    targets:
      - { id: current, label: Current }
      - { id: lts, label: LTS (Active oder Maintenance) }
      - { id: eol, label: End-of-Life }
    items:
      - { label: Node.js 26, target: current }
      - { label: Node.js 24 „Krypton“, target: lts }
      - { label: Node.js 22 „Jod“, target: lts }
      - { label: Node.js 25, target: eol }
      - { label: Node.js 20 „Iron“, target: eol }
      - { label: Node.js 18 „Hydrogen“, target: eol }
    hints:
      - Ungerade Versionen (23, 25) waren nur rund sechs Monate unterstützt.
      - Node.js 20 hat im Frühjahr 2026 sein Lebensende erreicht.
---

„Bei mir läuft es!“ – oft steckt eine andere Node-Version dahinter. Du kannst inzwischen Versionen
wechseln. Jetzt sorgst du dafür, dass **jedes Projekt selbst weiß**, welche Version es braucht –
und lernst, welche Version du überhaupt wählen solltest.

## Die .nvmrc-Datei

Eine [[nvmrc|`.nvmrc`]] ist eine winzige Textdatei im Hauptordner des Projekts mit einer
Versionsangabe wie `24`. Rufst du `nvm install` oder `nvm use` **ohne** Version auf, sucht nvm im
aktuellen Ordner und in allen Elternordnern danach.

```bash title="Terminal"
cd ~/projekte/shop
nvm install    # installiert die Version aus .nvmrc, falls sie fehlt
nvm use        # Found '/home/ada/projekte/shop/.nvmrc' with version <24>
```

| Inhalt | Bedeutung |
|---|---|
| `24` | neueste installierte 24.x |
| `24.21.0` | genau diese Version |
| `lts/krypton` | neueste Version der LTS-Linie „Krypton“ (Node 24) |
| `lts/*` | neueste LTS-Version überhaupt |

Die `.nvmrc` wird committet. Viele CI-Dienste lesen sie direkt, und Versionsmanager wie fnm,
Volta oder mise verstehen sie ebenfalls – teils mit automatischem Wechsel beim `cd`.

> [!MERKSATZ]
> Wer das Projekt klont, tippt `nvm install` und `nvm use` – und hat automatisch die richtige
> Version. `.nvmrc` legt **eine** Version fest, `engines` in der package.json einen **Bereich**.

## Aliase

Ein Alias ist ein Name für eine Version. Der wichtigste heißt `default`: Diese Version bekommt
jede neue Shell.

```bash title="Terminal"
nvm alias default 24       # neue Shells starten mit 24
nvm alias legacy 22        # eigener Name
nvm use legacy             # entspricht nvm use 22
nvm unalias legacy         # Alias entfernen
```

> [!FEHLER]
> **Die Standardversion für ein einzelnes Projekt ändern.** Wer für ein Altprojekt
> `nvm alias default 22` setzt, arbeitet danach überall versehentlich mit der alten Version. Für
> ein Projekt gehört die Version in dessen `.nvmrc`.

## LTS und der Release-Plan

Jede Hauptversion von Node.js durchläuft feste Phasen. [[lts|LTS]] steht für *Long Term Support*:
rund 30 Monate Pflege.

| Phase | Was passiert? | Für wen? |
|---|---|---|
| **Current** | Neue Funktionen, schnelle Änderungen | Ausprobieren |
| **Active LTS** | Stabil, Fehlerkorrekturen und Verbesserungen | Produktion |
| **Maintenance LTS** | Nur noch kritische Fehler und Sicherheitslücken | Produktion, Upgrade planen |
| **End-of-Life** | Keine Updates mehr – auch keine Sicherheitskorrekturen | Niemand |

Bis Node.js 26 erschien jedes Frühjahr eine gerade Version (wird im Oktober LTS) und jeden Herbst
eine ungerade (nach sechs Monaten EOL). Ab Node.js 27 gibt es **eine Hauptversion pro Jahr**, die
nach ihrer Current-Phase LTS wird. LTS-Linien tragen Codenamen: 22 „Jod“, 24 „Krypton“.

Stand Anfang Oktober 2026: 26 ist Current und wird Ende Oktober LTS, 24 ist die
LTS-Empfehlung, 22 ist in Maintenance, 20 und 25 sind End-of-Life.

> [!PRAXIS]
> Für neue Produktionsprojekte nimmst du die aktuelle LTS-Version. Upgrades testest du parallel:
> `nvm install 26`, `nvm use 26`, `npm ci`, `npm test` – dann `.nvmrc`, `engines` und
> CI-Konfiguration anpassen. Viele Teams tragen das End-of-Life-Datum ihrer Version in den
> Kalender ein, um nicht unter Zeitdruck zu geraten.

## Zusammenfassung

- Die **.nvmrc** legt die Node-Version eines Projekts fest und wird committet.
- `nvm install` und `nvm use` ohne Argument lesen die .nvmrc.
- `default` ist die Version jeder neuen Shell; projektspezifische Versionen gehören in die .nvmrc.
- Phasen: **Current → Active LTS → Maintenance LTS → End-of-Life**; für Produktion nimmst du LTS.
- Ab Node.js 27 erscheint eine Hauptversion pro Jahr; Stand Oktober 2026 ist 24 „Krypton“ die Empfehlung.
