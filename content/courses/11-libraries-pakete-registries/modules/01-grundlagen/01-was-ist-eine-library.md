---
title: Was ist eine Library?
summary: Library, Framework, Modul und Paket – vier Begriffe, die oft durcheinandergehen, sauber voneinander getrennt.
duration: 20
sources:
  - title: npm Docs – About packages and modules
    url: https://docs.npmjs.com/about-packages-and-modules
  - title: Composer – Libraries
    url: https://getcomposer.org/doc/02-libraries.md
  - title: MDN – JavaScript modules
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
quiz:
  - type: single
    question: Woran erkennst du am sichersten, ob du mit einer Library oder einem Framework arbeitest?
    options:
      - An der Größe – Frameworks haben mehr Dateien.
      - Daran, wer wen aufruft – bei einer Library rufst du sie auf, ein Framework ruft deinen Code auf.
      - An der Programmiersprache – Frameworks gibt es nur für PHP.
      - Am Preis – Frameworks kosten Geld.
    answer: 1
    explanation: Der Kern ist die Kontrolle über den Ablauf (Inversion of Control). Größe, Sprache oder Preis sagen darüber nichts aus.
  - type: match
    question: Ordne jedem Begriff die passende Beschreibung zu.
    pairs:
      - { left: "Modul", right: "Eine Datei mit Code, die etwas exportiert" }
      - { left: "Paket", right: "Ordner mit Manifest, den ein Paketmanager installieren kann" }
      - { left: "Library", right: "Sammlung wiederverwendbarer Funktionen, die du aufrufst" }
      - { left: "Framework", right: "Grundgerüst, das deinen Code an festen Stellen aufruft" }
    explanation: Die Begriffe überlappen sich – eine Library wird meist als Paket verteilt und besteht aus Modulen. Trotzdem beschreiben sie verschiedene Blickwinkel.
  - type: multiple
    question: Welche Dateien findest du typischerweise in einem npm-Paket?
    options:
      - package.json
      - Eine Lizenzdatei wie LICENSE
      - Den Ordner .git mit der Historie
      - Den eigentlichen Code, z. B. index.js
    answers: [0, 1, 3]
    explanation: Veröffentlichte Pakete enthalten Manifest, Code, README und Lizenz. Die Git-Historie gehört nicht dazu.
  - type: cloze
    text: Die Datei, die ein Paket beschreibt (Name, Version, Abhängigkeiten), heißt allgemein ___. Bei npm ist das die package.json, bei Composer die ___.
    blanks:
      - [Manifest]
      - [composer.json]
    explanation: Jeder Paketmanager hat sein eigenes Manifest, aber die Idee ist überall gleich.
tasks:
  - id: begriffe-zuordnen
    type: dragdrop
    title: Library, Framework oder Modul?
    description: Ordne jedes Beispiel der passenden Kategorie zu. Überlege jeweils, wer den Ablauf bestimmt.
    targets:
      - { id: library, label: Library – du rufst sie auf }
      - { id: framework, label: Framework – es ruft dich auf }
      - { id: modul, label: Modul – eine einzelne Datei }
    items:
      - { label: "ms – rechnet \"2h\" in Millisekunden um", target: library }
      - { label: "picocolors – färbt Text im Terminal", target: library }
      - { label: "Laravel – ruft deine Controller pro Request auf", target: framework }
      - { label: "React – rendert deine Komponenten, wann es will", target: framework }
      - { label: "utils.js mit export function add()", target: modul }
      - { label: "Greeter.php mit einer Klasse", target: modul }
    hints:
      - Frage dich bei jedem Beispiel – schreibst du den Aufruf selbst, oder wartet dein Code darauf, aufgerufen zu werden?
  - id: erste-library
    type: terminal
    title: Deine erste Library benutzen
    description: |
      Im Ordner `erste-library` liegt ein leeres Node-Projekt (nur eine `package.json`).
      Du nutzt die winzige Library `ms`, die Zeitangaben wie `"2h"` in Millisekunden umrechnet.

      1. Installiere das Paket `ms` mit npm.
      2. Lege eine Datei `zeit.js` an, die `ms` importiert und `ms("2h")` mit `console.log` ausgibt.
      3. Führe `node zeit.js` aus – die Ausgabe sollte `7200000` sein.
      4. Schau dir mit `ls node_modules/ms` an, was in einem Paket steckt.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: erste-library
    setup: |
      npm init -y > /dev/null
      npm pkg set type=module
    checks:
      - type: command
        run: jq -r '.dependencies.ms // empty' package.json
        stdout_matches: "\\d"
        message: In der package.json steht ms noch nicht unter dependencies. Installiere es mit npm install ms.
      - type: dir_exists
        path: node_modules/ms
        message: Der Ordner node_modules/ms fehlt – die Installation ist noch nicht gelaufen.
      - type: file_contains
        path: zeit.js
        pattern: "from\\s+['\"]ms['\"]"
        message: zeit.js soll ms importieren, z. B. mit import ms from "ms".
      - type: command
        run: node zeit.js
        stdout_matches: "7200000"
        message: node zeit.js soll 7200000 ausgeben (ms("2h")).
    hints:
      - "Ein Paket installierst du mit `npm install <name>`."
      - "Weil das Projekt `\"type\": \"module\"` hat, importierst du so: `import ms from \"ms\";`"
    solution: |
      ```bash
      cd erste-library
      npm install ms
      printf 'import ms from "ms";\nconsole.log(ms("2h"));\n' > zeit.js
      node zeit.js
      ls node_modules/ms
      ```
---
Du willst in deinem Programm „2 Stunden“ in Millisekunden umrechnen. Du könntest eine Funktion schreiben,
die Einheiten erkennt, Tippfehler abfängt und Tests bekommt. Oder du merkst: Diese Aufgabe hat schon jemand
gelöst – tausendfach getestet und kostenlos. Genau dafür gibt es **Libraries**.

## Was ist eine Library?

Eine [[library|Library]] (deutsch: Bibliothek, Programmbibliothek) ist eine Sammlung von fertigem Code,
den du in deinem eigenen Programm wiederverwendest. Sie löst ein klar umrissenes Problem: Zeiten umrechnen,
Text einfärben, Datumswerte formatieren.

Stell dir einen **Werkzeugkasten** vor. Du entscheidest, wann du den Hammer herausnimmst und wohin du
schlägst. Der Hammer redet dir nicht in deinen Bauplan hinein.

```js
import ms from "ms";

console.log(ms("2h"));      // 7200000
console.log(ms(60000));     // "1m"
```

Du rufst `ms` auf, wann und wie oft du willst. Was `ms` intern macht, muss dich nicht interessieren – du
kennst nur seine [[api|API]], also die Funktionen, die es nach außen anbietet.

> [!MERKSATZ]
> Eine Library ist Code, **den du aufrufst**. Sie erledigt eine Teilaufgabe, den Ablauf deines Programms
> bestimmst weiterhin du.

## Library oder Framework?

Ein [[framework|Framework]] dreht die Rollen um. Es gibt das Grundgerüst und den Ablauf vor – und ruft
**deinen** Code an festgelegten Stellen auf. Laravel nimmt zum Beispiel einen HTTP-Request entgegen und
ruft dann deinen Controller auf. Du schreibst nur die Lücken.

Dieses Prinzip heißt [[inversion-of-control|Inversion of Control]] („Umkehr der Kontrolle“) oder
scherzhaft *Hollywood-Prinzip*: „Ruf uns nicht an – wir rufen dich an.“

![Library und Framework im Vergleich: Bei der Library ruft dein Code auf, beim Framework wird dein Code aufgerufen](/assets/libraries-pakete-registries/library-vs-framework.svg)

| | Library | Framework |
|---|---|---|
| Wer steuert den Ablauf? | Du | Das Framework |
| Austauschbar? | Meist leicht | Meist schwer |
| Beispiele | `ms`, `picocolors`, Carbon | Laravel, Next.js |

> [!FEHLER]
> **„Framework“ heißt nicht einfach „große Library“.** Auch ein riesiges Paket wie eine
> Datums-Bibliothek bleibt eine Library, solange du sie aufrufst. Entscheidend ist, wer die Kontrolle hat.

## Modul, Paket, Library – die Begriffe trennen

Im Alltag fallen diese Wörter oft durcheinander. Sie beschreiben aber verschiedene Blickwinkel:

| Begriff | Was ist das? | Beispiel |
|---|---|---|
| [[modul\|Modul]] | Eine Datei mit Code, die etwas exportiert | `utils.js`, `Greeter.php` |
| [[paket\|Paket]] | Ein Ordner mit Manifest, den ein Paketmanager installieren kann | `node_modules/ms/` |
| Library | Ein Paket (oder Modul) mit wiederverwendbaren Funktionen | `ms` |
| Framework | Ein Paket, das den Ablauf deiner Anwendung vorgibt | `laravel/framework` |

Ein [[paketmanager|Paketmanager]] wie [[npm]] oder [[composer|Composer]] lädt Pakete herunter und legt sie
in dein Projekt. Aus Sicht deines Projekts ist jedes installierte Paket eine
[[abhaengigkeit|Abhängigkeit]] (*dependency*): Dein Code funktioniert nicht ohne sie.

> [!TIPP]
> Eine Library wird fast immer **als Paket verteilt** und besteht intern aus mehreren Modulen. Die drei
> Wörter schließen sich also nicht aus, sie ergänzen sich.

## Was steckt in einem Paket?

Schau in ein installiertes Paket hinein, zum Beispiel `ms`:

```text title="node_modules/ms"
ms/
├── index.js        ← der eigentliche Code
├── package.json    ← das Manifest
├── readme.md       ← Dokumentation
└── license.md      ← unter welchen Bedingungen du es nutzen darfst
```

Das [[manifest|Manifest]] ist der Steckbrief des Pakets. Bei npm heißt es [[package-json|package.json]],
bei Composer `composer.json`. Es enthält mindestens:

- **Name** – eindeutig in der Registry, z. B. `ms` oder `laravel/pint`.
- **Version** – nach [[semantic-versioning|Semantic Versioning]], z. B. `2.1.3`.
- **Einstiegspunkt** – welche Datei geladen wird, wenn du das Paket importierst.
- **Abhängigkeiten** – welche anderen Pakete es selbst braucht.

Dazu kommt die [[lizenz|Lizenz]]. Sie regelt, ob du den Code in deinem (vielleicht kommerziellen)
Projekt verwenden darfst – dazu mehr in der nächsten Lektion.

> [!PRAXIS]
> In echten Projekten stecken schnell hunderte Pakete. Wenn ein Fehler aus `node_modules` oder `vendor`
> kommt, öffne die betroffene Datei ruhig: Paketcode ist ganz normaler Code, den du lesen kannst.

## Zusammenfassung

- Eine **Library** ist fertiger Code, den **du aufrufst**.
- Ein **Framework** gibt den Ablauf vor und **ruft deinen Code auf** (Inversion of Control).
- Ein **Modul** ist eine einzelne Code-Datei, ein **Paket** ein installierbarer Ordner mit Manifest.
- Das **Manifest** (package.json, composer.json) beschreibt Name, Version, Einstiegspunkt und Abhängigkeiten.
- Jedes installierte Paket ist eine **Abhängigkeit** deines Projekts.
