---
title: Editoren und IDEs produktiv nutzen
summary: VS Code, PhpStorm und Zed im Vergleich – Erweiterungen, Settings Sync, Multi-Cursor, Suche, Refactoring und das eingebaute Terminal.
duration: 25
sources:
  - title: VS Code – Basic Editing (Multi-Cursor)
    url: https://code.visualstudio.com/docs/editing/codebasics
  - title: VS Code – Settings Sync
    url: https://code.visualstudio.com/docs/configure/settings-sync
  - title: PhpStorm – Refactoring code
    url: https://www.jetbrains.com/help/phpstorm/refactoring-source-code.html
  - title: Zed – Dokumentation
    url: https://zed.dev/docs/
quiz:
  - type: single
    question: Du willst die Funktion `calcTotal` in `calculateTotal` umbenennen. Sie wird in 14 Dateien aufgerufen. Was ist der sicherste Weg?
    options:
      - Suchen und Ersetzen über alle Dateien
      - Die Rename-Refactoring-Funktion der IDE
      - Jede Datei einzeln öffnen und von Hand ändern
    answer: 1
    explanation: Rename-Refactoring versteht den Code. Es ändert nur echte Verwendungen dieser Funktion – nicht zufällig gleich lautende Wörter in Kommentaren, Strings oder anderen Funktionen.
  - type: match
    question: Ordne jeder Funktion zu, wofür sie gut ist.
    pairs:
      - { left: "Multi-Cursor", right: "Mehrere gleichartige Zeilen gleichzeitig bearbeiten" }
      - { left: "Gehe zu Definition", right: "Springen, wo eine Funktion definiert ist" }
      - { left: "Settings Sync", right: "Einstellungen auf mehreren Rechnern gleich halten" }
      - { left: "Integriertes Terminal", right: "Befehle ausführen, ohne den Editor zu verlassen" }
    explanation: Diese vier Funktionen sparen im Alltag die meiste Zeit – egal in welchem Editor.
  - type: multiple
    question: Welche Aussagen über Erweiterungen stimmen?
    options:
      - Erweiterungen können Sprachunterstützung, Linter und Formatter einbinden.
      - Jede Erweiterung ist automatisch sicher, weil sie im Marktplatz steht.
      - Ein Team kann empfohlene Erweiterungen in einer Datei im Repository festhalten.
      - Viele Erweiterungen können den Editor spürbar verlangsamen.
    answers: [0, 2, 3]
    explanation: Erweiterungen sind fremder Code mit Zugriff auf deine Dateien. Installiere nur, was du brauchst, und achte auf Herkunft und Bewertungen.
  - type: cloze
    text: In VS Code legt ein Team empfohlene Erweiterungen in der Datei `.vscode/___.json` fest.
    blanks:
      - [extensions]
    explanation: "`.vscode/extensions.json` enthält eine Liste `recommendations`. VS Code schlägt diese Erweiterungen beim Öffnen des Projekts vor."
tasks:
  - id: werkzeug-fuer-aufgabe
    type: steps
    title: Welche Editor-Funktion hilft hier?
    description: Für jede Situation gibt es eine Editor-Funktion, die dir viel Arbeit spart. Wähle die passende.
    steps:
      - situation: In einer Liste von 20 Zeilen soll am Anfang jeder Zeile `- ` stehen.
        question: Was ist am schnellsten?
        options: [Multi-Cursor bzw. Spaltenauswahl, Jede Zeile einzeln bearbeiten, Rename-Refactoring]
        answer: 0
        explanation: Mit mehreren Cursorn tippst du `- ` einmal und es erscheint in allen Zeilen gleichzeitig.
      - situation: Du siehst einen Aufruf `formatPrice(order)` und willst wissen, was die Funktion genau macht.
        question: Was tust du?
        options: [Projektweit nach „formatPrice“ suchen, Gehe zu Definition (z. B. F12 oder Strg/Cmd+Klick), Den Code neu schreiben]
        answer: 1
        explanation: Gehe zu Definition springt direkt zur Stelle, an der die Funktion definiert ist – ohne Trefferliste.
      - situation: Du willst alle Stellen finden, an denen der Text `TODO` im ganzen Projekt vorkommt.
        question: Welche Funktion nutzt du?
        options: [Suche in der aktuellen Datei, Projektweite Suche (z. B. Strg/Cmd+Umschalt+F), Gehe zu Definition]
        answer: 1
        explanation: Die projektweite Suche durchsucht alle Dateien und zeigt eine Trefferliste, die du nacheinander öffnen kannst.
      - situation: Ein 40 Zeilen langer Block in einer Methode berechnet Versandkosten. Du willst ihn als eigene Methode herauslösen.
        question: Welche Funktion hilft?
        options: [Extract Method, Multi-Cursor, Settings Sync]
        answer: 0
        explanation: Extract Method erzeugt eine neue Methode mit passenden Parametern und ersetzt den Block durch einen Aufruf.
  - id: tastenkuerzel-zuordnen
    type: dragdrop
    title: Ordne die Aufgaben den Editor-Bereichen zu
    description: Jede Aufgabe erledigst du am besten mit einer bestimmten Art von Editor-Funktion. Ordne zu.
    targets:
      - { id: navigation, label: Navigation }
      - { id: bearbeiten, label: Bearbeiten }
      - { id: refactoring, label: Refactoring }
    items:
      - { label: Datei per Name öffnen (Quick Open), target: navigation }
      - { label: Alle Verwendungen einer Funktion finden, target: navigation }
      - { label: Zeile duplizieren, target: bearbeiten }
      - { label: Mehrere Cursor setzen, target: bearbeiten }
      - { label: Variable sicher umbenennen, target: refactoring }
      - { label: Code-Block in eine Funktion auslagern, target: refactoring }
    hints:
      - Refactoring verändert die Struktur des Codes, ohne sein Verhalten zu ändern.
---

Ein Profi-Koch schneidet nicht mit dem stumpfen Brotmesser aus der Schublade. Genauso arbeiten
Entwickler:innen nicht im Standard-Texteditor des Betriebssystems. Du verbringst täglich viele Stunden
in deinem Editor – jede Funktion, die du sicher beherrschst, spart dir Woche für Woche Zeit und
Fehler.

## Editor oder IDE?

Ein [[editor|Editor]] ist ein Programm zum Bearbeiten von Textdateien, das für Code optimiert ist:
Syntax-Hervorhebung, Einrückung, Suche. Eine [[ide|IDE]] (*Integrated Development Environment*) bringt
zusätzlich tiefes Verständnis für den Code mit: Sie weiß, welche Klasse wo verwendet wird, kann Code
sicher umbauen, hat einen Debugger, Datenbank-Werkzeuge und eine Git-Oberfläche eingebaut.

Die Grenze ist fließend, denn moderne Editoren lassen sich mit [[erweiterung|Erweiterungen]] zu fast
vollständigen IDEs ausbauen. Drei Werkzeuge begegnen dir besonders oft:

| Werkzeug | Art | Stärken | Typisch für |
|---|---|---|---|
| VS Code | Editor mit riesigem Erweiterungs-Ökosystem | Kostenlos, für jede Sprache erweiterbar, Dev-Container-Unterstützung | JavaScript, TypeScript, React, gemischte Projekte |
| PhpStorm | Vollwertige IDE von JetBrains | Sehr starkes PHP- und Laravel-Verständnis, Refactoring, Datenbank-Tools | PHP, Laravel, Symfony |
| Zed | Schneller, moderner Editor | Sehr flott, eingebaute Zusammenarbeit in Echtzeit, KI-Funktionen | Alle, die einen schlanken Editor wollen |

Es gibt keine „richtige“ Wahl. In vielen Teams nutzen die Backend-Leute PhpStorm und das Frontend-Team
VS Code – im selben Repository. Genau deshalb braucht ihr gemeinsame Regeln, die **unabhängig vom
Editor** gelten. Das erledigt die `.editorconfig` aus der nächsten Lektion.

> [!MERKSATZ]
> Der Editor ist persönliche Wahl – die Regeln für Formatierung und Qualität gehören ins Repository,
> damit sie für alle Editoren gleich gelten.

Woher „weiß“ ein Editor, wo eine Funktion definiert ist? Meist von einem
[[language-server|Language Server]]: einem separaten Programm, das eine Sprache analysiert und dem
Editor über das *Language Server Protocol* (LSP) antwortet. PhpStorm bringt stattdessen seine eigene,
sehr tiefe Analyse mit.

## Navigation und Suche

Die Tabelle zeigt die Kürzel für VS Code (Windows/Linux, auf dem Mac meist `Cmd` statt `Strg`).
PhpStorm und Zed haben dieselben Funktionen mit teils anderen Kürzeln – im Menü stehen sie neben dem
Eintrag.

| Funktion | VS Code | Wofür |
|---|---|---|
| Quick Open | `Strg+P` | Datei per Namen öffnen, ohne durch Ordner zu klicken |
| Befehlspalette | `Strg+Umschalt+P` | Jede Editor-Funktion per Suche finden |
| Projektweite Suche | `Strg+Umschalt+F` | Text oder [[regex|regulären Ausdruck]] in allen Dateien suchen |
| Gehe zu Definition | `F12` | Zur Definition einer Funktion springen |
| Alle Verwendungen | `Umschalt+F12` | Zeigen, wo etwas benutzt wird |
| Umbenennen | `F2` | Symbol sicher im ganzen Projekt umbenennen |
| Integriertes Terminal | ``Strg+` `` | Terminal im Projektordner öffnen |

Das integrierte [[terminal|Terminal]] öffnet sich direkt im Projektordner. Du startest `make test`,
klickst auf einen Dateipfad in der Fehlermeldung und landest an der richtigen Stelle im Code.

> [!FEHLER]
> **„Gehe zu Definition“ funktioniert nicht.** Oft fehlen die Abhängigkeiten: Ohne `node_modules` oder
> `vendor` findet der Editor keine Funktionen aus Paketen. Erst `npm install` bzw. `composer install`
> ausführen, dann klappt die Navigation.

## Multi-Cursor und Refactoring

Mit [[multi-cursor|mehreren Cursorn]] tippst du an vielen Stellen gleichzeitig. Ein Beispiel: Du hast
diese Liste und willst daraus ein JavaScript-Array machen.

```text title="Vorher"
rot
grün
blau
```

In VS Code setzt du mit `Alt+Klick` (Mac: `Option+Klick`) einen weiteren Cursor oder markierst die drei
Zeilen und drückst `Umschalt+Alt+I`, um ans Ende jeder Zeile einen Cursor zu setzen. Dann tippst du einmal
`",` – und es erscheint in allen drei Zeilen:

```js title="Nachher"
"rot",
"grün",
"blau",
```

[[refactoring|Refactoring]] heißt: die Struktur von Code verbessern, **ohne sein Verhalten zu ändern**.
IDEs erledigen das automatisch und sicher:

| Refactoring | Wirkung |
|---|---|
| Rename | Benennt Variable, Funktion, Klasse oder Datei um – mit allen Verwendungen |
| Extract Method | Löst einen markierten Block als eigene Funktion heraus |
| Extract Variable | Macht aus einem komplizierten Ausdruck eine benannte Variable |
| Move | Verschiebt eine Klasse und passt alle Imports an |

Warum nicht „Suchen und Ersetzen“? Wer `total` durch `sum` ersetzt, erwischt auch `subtotal` und
Kommentare. Rename ändert genau dieses eine Symbol.

> [!PRAXIS]
> Lerne pro Woche ein neues Kürzel, bis es sitzt. Die Befehlspalette (`Strg+Umschalt+P` in VS Code,
> zweimal `Umschalt` in PhpStorm) ist dein Notausgang: Dort findest du jede Funktion per Namen.

## Erweiterungen und Einstellungen teilen

[[erweiterung|Erweiterungen]] (auch *Plugins*) ergänzen deinen Editor um Sprachunterstützung, Linter,
Formatter oder Themes. Ein Team kann empfohlene Erweiterungen direkt im Repository festhalten. In VS Code
geht das über `.vscode/extensions.json`:

```json title=".vscode/extensions.json"
{
  "recommendations": [
    "editorconfig.editorconfig",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss"
  ]
}
```

Öffnet jemand das Projekt, schlägt VS Code diese Erweiterungen zur Installation vor. Projektspezifische
Einstellungen kommen in `.vscode/settings.json`, zum Beispiel „beim Speichern formatieren“. PhpStorm
speichert Projekteinstellungen im Ordner `.idea/`; viele Teams committen davon nur ausgewählte Dateien,
etwa den Code-Stil.

Deine **persönlichen** Einstellungen (Theme, Schriftgröße, Tastenkürzel) gehören dagegen nicht ins
Projekt. Dafür gibt es [[settings-sync|Settings Sync]]: VS Code synchronisiert sie über dein GitHub- oder
Microsoft-Konto, JetBrains-IDEs über das JetBrains-Konto. So sieht dein Editor auf dem Arbeitsrechner
und auf dem Laptop gleich aus.

> [!ACHTUNG]
> Erweiterungen laufen mit denselben Rechten wie dein Editor und können alle deine Dateien lesen –
> auch `.env`-Dateien mit Passwörtern. Installiere nur Erweiterungen bekannter Herausgeber, die du
> wirklich brauchst.

## Zusammenfassung

- Ein Editor bearbeitet Code, eine IDE versteht ihn zusätzlich tief (Refactoring, Debugger, Datenbank).
  VS Code, PhpStorm und Zed sind verbreitete Werkzeuge.
- Language Server liefern Editoren das Code-Verständnis für Navigation und Fehlermarkierungen.
- Quick Open, Befehlspalette, projektweite Suche, Gehe zu Definition und Multi-Cursor sparen täglich Zeit.
- Refactoring wie Rename oder Extract Method ändert die Struktur sicher – im Gegensatz zu Suchen und Ersetzen.
- Projektempfehlungen gehören ins Repository (`.vscode/extensions.json`), persönliche Einstellungen in Settings Sync.
- Erweiterungen sind fremder Code mit Zugriff auf deine Dateien – wähle sie bewusst.
