---
title: Mehrere Node-Versionen mit nvm
summary: Warum du verschiedene Node-Versionen brauchst und wie du mit nvm installierst, wechselst und aufräumst.
duration: 25
sources:
  - title: nvm – README (Installing and Updating, Usage)
    url: https://github.com/nvm-sh/nvm#usage
  - title: Node.js – Download Node.js (Paketmanager und Versionsmanager)
    url: https://nodejs.org/en/download
  - title: Node.js – Releases
    url: https://nodejs.org/en/about/previous-releases
quiz:
  - type: single
    question: Du führst in einem Terminal-Tab `nvm use 22` aus. Welche Node-Version gilt in einem zweiten, schon offenen Tab?
    options:
      - Ebenfalls 22, nvm ändert die Version systemweit.
      - Weiterhin die bisherige Version – nvm use gilt nur für die aktuelle Shell.
      - Gar keine, Node.js ist im zweiten Tab deaktiviert.
      - Die neueste installierte Version.
    answer: 1
    explanation: nvm use ändert nur den PATH der aktuellen Shell. Andere Tabs und neue Shells nutzen die Standardversion (default).
  - type: match
    question: Welcher nvm-Befehl tut was?
    pairs:
      - { left: "nvm install 22", right: "Lädt die neueste 22.x herunter und installiert sie" }
      - { left: "nvm use 22", right: "Wechselt in dieser Shell auf 22.x" }
      - { left: "nvm ls", right: "Zeigt alle installierten Versionen" }
      - { left: "nvm current", right: "Zeigt die gerade aktive Version" }
      - { left: "nvm ls-remote --lts", right: "Listet alle LTS-Versionen zum Herunterladen" }
    explanation: install lädt herunter, use aktiviert, ls und current zeigen den Zustand. ls-remote fragt die Liste auf nodejs.org ab.
  - type: multiple
    question: Warum nutzen Entwicklerinnen einen Versionsmanager wie nvm statt einer einzigen systemweiten Node-Installation?
    options:
      - Verschiedene Projekte brauchen verschiedene Node-Versionen.
      - Man kann neue Versionen gefahrlos ausprobieren und wieder zurückwechseln.
      - Globale npm-Pakete brauchen dann keine Administratorrechte.
      - nvm macht Node.js schneller.
    answers: [0, 1, 2]
    explanation: nvm installiert alles im Benutzerordner. Dadurch brauchst du kein sudo, und jede Version hat ihre eigenen globalen Pakete. Schneller wird Node.js dadurch nicht.
tasks:
  - id: node-22-installieren
    type: terminal
    title: Eine zweite Node-Version installieren
    description: |
      Im Übungs-Terminal ist Node.js 24 installiert und als Standard gesetzt. Ein älteres Projekt
      braucht aber Node.js 22.

      1. Sieh dir mit `nvm ls` an, welche Versionen installiert sind.
      2. Installiere Node.js 22 mit `nvm install 22` (der Download dauert einen Moment).
      3. Prüfe mit `node -v`, welche Version jetzt aktiv ist.
      4. Wechsle mit `nvm use 24` zurück und prüfe erneut mit `node -v`.
      5. Lass die Standardversion (`default`) auf 24 – ändere sie **nicht**.

      Diese Aufgabe nutzt keinen eigenen Ordner. Die Prüfung läuft im Ordner `nvm-start`,
      lege ihn mit `mkdir -p nvm-start` an, falls Stacklab ihn nicht findet.
    workdir: nvm-start
    checks:
      - type: command
        run: nvm version 22
        stdout_matches: "^v22\\.\\d+\\.\\d+$"
        message: Node.js 22 ist noch nicht installiert. Führe nvm install 22 aus.
      - type: command
        run: nvm version default
        stdout_matches: "^v24\\."
        message: Die Standardversion soll 24 bleiben. Setze sie mit nvm alias default 24 zurück.
    hints:
      - "`nvm install 22` installiert die neueste Version der Reihe 22 und aktiviert sie sofort in dieser Shell."
      - "`nvm use 24` wechselt zurück. Eine neue Shell startet ohnehin wieder mit der Standardversion."
    solution: |
      ```bash
      nvm ls
      nvm install 22
      node -v        # v22.x.x
      nvm use 24
      node -v        # v24.x.x
      ```
  - id: nvm-alltag
    type: steps
    title: Ein Tag mit nvm
    description: Verfolge, was nvm in diesen Situationen tut.
    steps:
      - situation: "Installiert sind 22.20.0 und 24.21.0, default zeigt auf 24. Du öffnest ein neues Terminal und tippst `node -v`."
        question: Was erscheint?
        options: ["v22.20.0", "v24.21.0", "command not found", "Eine Auswahl"]
        answer: 1
        explanation: Jede neue Shell startet mit der Version, auf die der Alias default zeigt.
      - situation: Du tippst `nvm use 22` und danach `npm install -g cowsay`.
        question: Für welche Node-Version ist cowsay jetzt global installiert?
        options: ["Für alle Versionen", "Nur für 22.20.0", "Nur für 24.21.0", "Für keine, -g ist mit nvm verboten"]
        answer: 1
        explanation: Jede Node-Version unter nvm hat ihren eigenen Ordner mit eigenen globalen Paketen.
      - situation: Du wechselst mit `nvm use 24` zurück und tippst `cowsay hallo`.
        question: Was passiert?
        options: ["Die Kuh sagt hallo", "command not found", "nvm wechselt automatisch auf 22", "npm installiert cowsay nach"]
        answer: 1
        explanation: In 24 wurde cowsay nie installiert. Beim Wechsel kannst du globale Pakete mit nvm install --reinstall-packages-from=22 mitnehmen.
      - situation: Version 22.20.0 brauchst du nicht mehr.
        question: Wie entfernst du sie?
        options: ["rm -rf ~/.node", "nvm uninstall 22.20.0", "npm uninstall node", "nvm delete 22"]
        answer: 1
        explanation: nvm uninstall entfernt eine installierte Version samt ihren globalen Paketen. Die gerade aktive Version kannst du nicht entfernen.
---

Projekt A läuft seit Jahren stabil auf Node.js 22. Projekt B ist neu und nutzt Funktionen aus
Node.js 24. Mit einer einzigen, fest installierten Node-Version müsstest du ständig neu installieren
– oder ein Projekt kaputt laufen lassen. Ein **Versionsmanager** löst das.

## Warum mehrere Versionen?

In der Praxis gibt es viele Gründe, mehr als eine Node-Version zu brauchen:

- **Ältere Projekte** sind auf einer früheren Version getestet und noch nicht umgestellt.
- **Neue Versionen** willst du ausprobieren, bevor du ein Projekt umstellst.
- **Server und CI** laufen mit einer bestimmten Version – lokal willst du genau dieselbe.
- **Bibliotheken** sollen mit mehreren Versionen funktionieren und werden mit jeder getestet.

Eine Installation über den Installer von nodejs.org oder den System-Paketmanager kennt nur
**eine** Version. Zudem brauchen globale Pakete dort oft Administratorrechte (`sudo`).

## Was ist nvm?

[[nvm|nvm]] (*Node Version Manager*) ist ein Shell-[[skript|Skript]] für Linux und macOS, das
beliebig viele Node-Versionen in deinem Benutzerordner verwaltet. Unter Windows gibt es das
separate Projekt *nvm-windows* mit ähnlichen Befehlen.

Die Idee ist einfach: Jede Version liegt in einem eigenen Ordner, etwa
`~/.nvm/versions/node/v24.21.0/`. Wenn du eine Version „benutzt“, setzt nvm deren `bin`-Ordner
an den Anfang deiner `PATH`-Variablen. Die Shell findet dann genau dieses `node` und dieses `npm`.

```bash title="Installation (einmalig, Version siehe README)"
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
# Terminal neu öffnen, dann:
nvm --version
```

Im Übungs-Terminal ist nvm schon eingerichtet.

> [!MERKSATZ]
> nvm tauscht keine Programme aus, sondern verändert nur den **PATH** deiner Shell. Dadurch
> wechselst du in Sekunden zwischen Versionen.

## Die wichtigsten Befehle

| Befehl | Wirkung |
|---|---|
| `nvm install 24` | Neueste 24.x herunterladen, installieren und aktivieren |
| `nvm install --lts` | Neueste LTS-Version installieren |
| `nvm use 22` | In **dieser** Shell auf 22.x wechseln |
| `nvm ls` | Installierte Versionen und Aliase anzeigen |
| `nvm ls-remote --lts` | Verfügbare LTS-Versionen auflisten |
| `nvm current` | Aktive Version anzeigen |
| `nvm alias default 24` | Standardversion für neue Shells festlegen |
| `nvm uninstall 22.20.0` | Version entfernen |
| `nvm exec 22 node app.js` | Einen einzelnen Befehl mit einer anderen Version ausführen |

```text title="nvm ls"
       v22.20.0
->     v24.21.0
default -> 24 (-> v24.21.0)
lts/* -> lts/krypton (-> v24.21.0)
```

Der Pfeil `->` zeigt die aktive Version. Statt voller Versionsnummern kannst du überall auch nur
die Hauptversion (`22`) oder Aliase wie `lts/*` angeben.

> [!FEHLER]
> **„Ich habe gewechselt, aber in VS Code läuft die alte Version.“** `nvm use` gilt nur für die
> Shell, in der du es eingibst. Andere Terminals, IDEs und neu geöffnete Fenster nutzen die
> Version hinter `default`. Willst du dauerhaft wechseln: `nvm alias default 24`.

## Globale Pakete und Aufräumen

Jede Node-Version hat ihren eigenen Ordner für **globale** Pakete (`npm install -g`). Wechselst du
die Version, sind die globalen Werkzeuge der alten Version nicht mehr da. Beim Installieren einer
neuen Version kannst du sie mitnehmen:

```bash title="Terminal"
nvm install 24 --reinstall-packages-from=22
```

> [!PRAXIS]
> Weil nvm-Versionen im Benutzerordner liegen, brauchst du für `npm install -g` nie `sudo`. Das
> ist sicherer: Ein Installationsskript eines Pakets läuft so nie mit Administratorrechten.

## Zusammenfassung

- Verschiedene Projekte brauchen oft verschiedene Node-Versionen.
- **nvm** verwaltet beliebig viele Versionen im Benutzerordner und wechselt per PATH.
- `nvm install`, `nvm use`, `nvm ls` und `nvm current` sind die Befehle für den Alltag.
- `nvm use` gilt nur für die aktuelle Shell, `nvm alias default` für alle neuen Shells.
- Globale Pakete gehören zur jeweiligen Version; `--reinstall-packages-from` nimmt sie mit.
