---
title: Sources und Application – anhalten, nachsehen, Speicher prüfen
summary: Wie du im Sources-Panel Breakpoints setzt, Schritt für Schritt durch den Code gehst, Variablen beobachtest und im Application-Panel gespeicherte Daten prüfst.
duration: 25
sources:
  - title: Chrome DevTools – Debug JavaScript
    url: https://developer.chrome.com/docs/devtools/javascript
  - title: Chrome DevTools – Pause your code with breakpoints
    url: https://developer.chrome.com/docs/devtools/javascript/breakpoints
  - title: Chrome DevTools – Application panel
    url: https://developer.chrome.com/docs/devtools/application
  - title: MDN – debugger
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/debugger
quiz:
  - type: match
    question: Ordne jedem Schritt-Befehl seine Wirkung zu.
    pairs:
      - { left: "Resume (F8)", right: "Weiterlaufen bis zum nächsten Breakpoint" }
      - { left: "Step over (F10)", right: "Aktuelle Zeile ausführen, Funktionsaufrufe nicht betreten" }
      - { left: "Step into (F11)", right: "In die aufgerufene Funktion hineinspringen" }
      - { left: "Step out (Umschalt+F11)", right: "Rest der Funktion ausführen und zum Aufrufer zurückkehren" }
    explanation: >
      Mit diesen vier Befehlen steuerst du die Ausführung. Die Tastenkürzel gelten in Chrome; andere Debugger
      nutzen dieselben Begriffe.
  - type: single
    question: Eine Schleife läuft 10 000-mal, der Fehler tritt nur beim Artikel mit `id === 4711` auf. Welcher Breakpoint ist am sinnvollsten?
    options:
      - Ein normaler Breakpoint in der Schleife – und dann 4711-mal Resume drücken.
      - Ein bedingter Breakpoint mit der Bedingung `artikel.id === 4711`.
      - Gar keiner, lieber 10 000 console.log-Ausgaben.
    answer: 1
    explanation: >
      Ein bedingter Breakpoint hält nur an, wenn die Bedingung wahr ist. So landest du direkt beim interessanten
      Durchlauf.
  - type: multiple
    question: Was findest du im Application-Panel?
    options:
      - Local Storage und Session Storage der Seite
      - Cookies mit Name, Wert, Ablaufdatum und Flags wie HttpOnly
      - Die Logdateien des Servers
      - Eine Schaltfläche, um alle Daten der Website im Browser zu löschen
    answers: [0, 1, 3]
    explanation: >
      Das Application-Panel zeigt, was der Browser für diese Website speichert. Server-Logs liegen auf dem
      Server und sind dort nicht sichtbar.
  - type: cloze
    text: Schreibst du die Anweisung `___;` in dein JavaScript, hält der Browser an dieser Stelle an, sobald die DevTools geöffnet sind. Einen Breakpoint, der nur eine Nachricht ausgibt, statt anzuhalten, nennt Chrome ___.
    blanks:
      - [debugger]
      - [Logpoint, Logpoints]
    explanation: >
      `debugger;` ist ein Breakpoint im Code. Ein Logpoint ist wie ein console.log, den du setzt, ohne den Code
      zu ändern.
tasks:
  - id: breakpoint-sitzung
    type: steps
    title: Mit Breakpoints einen Rechenfehler finden
    description: >
      Ein Warenkorb zeigt als Gesamtsumme `134.95` statt `17.95`. Spiel die Debugging-Sitzung im
      Sources-Panel durch.
    steps:
      - situation: Du öffnest im Sources-Panel die Datei `warenkorb.js` und findest die Funktion `bestellwert()`.
        question: Wo setzt du den ersten Breakpoint?
        options:
          - Auf der ersten Zeile der Funktion, damit du ihre Eingaben siehst.
          - Irgendwo im CSS.
          - Auf der letzten Zeile der Datei, ganz egal welche Funktion.
        answer: 0
        explanation: Am Anfang der Funktion siehst du im Scope-Bereich alle Parameter – die Eingaben sind der erste Verdächtige.
      - situation: "Der Code hält an. Im Scope steht `positionen: Array(2)` und `versandFeld: \"4.95\"` – in Anführungszeichen."
        question: Was fällt dir auf?
        options:
          - Nichts, 4.95 ist eine ganz normale Zahl.
          - "`versandFeld` ist ein String, weil er aus einem Formularfeld kommt."
          - Das Array ist zu kurz.
        answer: 1
        explanation: Anführungszeichen im Scope zeigen einen String an. Werte aus Eingabefeldern sind immer Strings.
      - situation: "Du fügst unter **Watch** den Ausdruck `summe + versandFeld` hinzu und gehst mit Step over bis zur letzten Zeile. Watch zeigt `\"134.95\"`."
        question: Was ist die Ursache?
        options:
          - "`+` mit einem String verkettet Text, statt zu addieren."
          - Der Browser rechnet falsch.
          - Die Schleife läuft einmal zu oft.
        answer: 0
        explanation: Ist ein Operand von `+` ein String, entsteht Text. Die Lösung ist, den Wert vorher mit `Number()` umzuwandeln.
      - situation: Du hast `Number(versandFeld)` eingebaut, die Seite neu geladen und erneut getestet. Es erscheint `17.95`.
        question: Was machst du mit dem Breakpoint?
        options:
          - Drin lassen, schadet ja nicht.
          - Entfernen oder deaktivieren – und den Fall als Test festhalten.
        answer: 1
        explanation: Breakpoints im Browser stören beim nächsten Testen. Ein automatisierter Test hält die Erkenntnis dauerhaft fest.
  - id: bestellwert-reparieren
    type: code
    language: js
    title: Repariere bestellwert()
    description: |
      Die Debugging-Sitzung hat zwei Fehler in `bestellwert()` gezeigt:

      1. `versandFeld` kommt als **String** aus einem Formularfeld (z. B. `'4.95'`) und wird an die Summe
         angehängt statt addiert.
      2. Bei einem **leeren** Warenkorb soll das Ergebnis `0` sein – ohne Versandkosten.

      Ab einem Warenwert von 50 ist der Versand kostenlos. Das Ergebnis muss immer eine **Zahl** sein.
    starter: |
      function bestellwert(positionen, versandFeld) {
        let summe = 0;
        for (const position of positionen) {
          summe += position.preis * position.menge;
        }
        if (summe >= 50) {
          return summe;
        }
        return summe + versandFeld;
      }
    tests:
      - name: addiert Versandkosten als Zahl
        code: "assertEqual(bestellwert([{ preis: 4.5, menge: 2 }, { preis: 2, menge: 2 }], '4.95'), 17.95)"
      - name: ab 50 ist der Versand frei
        code: "assertEqual(bestellwert([{ preis: 25, menge: 2 }], '4.95'), 50)"
      - name: leerer Warenkorb kostet 0
        code: "assertEqual(bestellwert([], '4.95'), 0)"
      - name: Ergebnis ist immer eine Zahl
        code: "assertEqual(typeof bestellwert([{ preis: 1, menge: 1 }], '3'), 'number')"
    hints:
      - "`'4.95'` ist ein String. Mit `Number(versandFeld)` wird daraus die Zahl 4.95."
      - "Prüfe gleich am Anfang `if (positionen.length === 0) { return 0; }`."
    solution: |
      function bestellwert(positionen, versandFeld) {
        if (positionen.length === 0) {
          return 0;
        }
        let summe = 0;
        for (const position of positionen) {
          summe += position.preis * position.menge;
        }
        if (summe >= 50) {
          return summe;
        }
        return summe + Number(versandFeld);
      }
---
Mit `console.log` siehst du einen Wert zu **einem** Zeitpunkt. Oft willst du aber das Programm mitten im
Ablauf anhalten, dich umsehen und dann Zeile für Zeile weitergehen. Genau das kann der [[debugger|Debugger]],
der im Sources-Panel der DevTools steckt. Danach schauen wir ins Application-Panel – dorthin, wo der Browser
Daten für eine Website speichert.

## Breakpoints setzen

Im Sources-Panel öffnest du links eine Datei – oder mit `Strg`+`P` (Mac: `Cmd`+`P`) per Dateiname. Ein Klick
auf eine **Zeilennummer** setzt einen [[breakpoint|Breakpoint]]: Sobald der Code diese Zeile erreicht, hält er
**vor** ihr an. Die Seite friert ein, und du kannst nachsehen.

Es gibt mehrere Arten, anzuhalten – vom einfachen Zeilen-Breakpoint über den [[bedingter-breakpoint|bedingten Breakpoint]] bis zum [[logpoint|Logpoint]], der nur etwas ausgibt:

| Art | So setzt du sie | Wann sinnvoll |
|---|---|---|
| Zeilen-Breakpoint | Klick auf die Zeilennummer | Standardfall |
| Bedingter Breakpoint | Rechtsklick → *Add conditional breakpoint* | Nur bestimmte Durchläufe interessieren |
| Logpoint | Rechtsklick → *Add logpoint* | Ausgabe ohne Code-Änderung, ohne Anhalten |
| `debugger;` im Code | Anweisung in die Quelldatei schreiben | Stelle ist im Panel schwer zu finden |
| Event-Listener-Breakpoint | rechts unter *Event Listener Breakpoints* | Anhalten bei jedem Klick, ohne die Funktion zu kennen |

`debugger;` wirkt nur, wenn die DevTools geöffnet sind. Vergiss nicht, es vor dem Commit wieder zu entfernen.

> [!MERKSATZ]
> Ein Breakpoint hält **vor** der markierten Zeile an. Der Wert, den diese Zeile berechnet, steht also noch
> nicht in der Variable – erst nach einem Step over.

## Schritt für Schritt weitergehen

Steht der Code, steuerst du ihn mit den Schaltflächen oben rechts. Dieses [[step-debugging|Step-Debugging]]
funktioniert in jedem Debugger gleich – im Browser, in Node.js und mit Xdebug in PHP:

| Befehl | Chrome | Wirkung |
|---|---|---|
| Resume | `F8` | Weiter bis zum nächsten Breakpoint |
| Step over | `F10` | Zeile ausführen, aufgerufene Funktionen nicht betreten |
| Step into | `F11` | In die Funktion hineinspringen, die in dieser Zeile aufgerufen wird |
| Step out | `Umschalt`+`F11` | Rest der Funktion ausführen, zurück zum Aufrufer |

Faustregel: Mit **Step over** gehst du an Funktionen vorbei, denen du vertraust. Mit **Step into** steigst du
in eine Funktion ein, die du verdächtigst.

## Scope, Watch und Call Stack

Während der Code steht, zeigt dir die rechte Seite alles, was du wissen musst:

- **Scope:** alle Variablen, die an dieser Stelle sichtbar sind – lokal, aus umgebenden Funktionen und global.
  Strings erkennst du an Anführungszeichen: `"4.95"` ist Text, `4.95` eine Zahl.
- **Watch:** Hier trägst du eigene Ausdrücke ein, etwa `summe + versandFeld` oder `liste.length`. Ein
  [[watch-ausdruck|Watch-Ausdruck]] wird nach jedem Schritt neu berechnet.
- **Call Stack:** die Kette der Aufrufe – derselbe [[stack-trace|Stack Trace]] wie in einer Fehlermeldung, nur
  live. Ein Klick auf einen Eintrag zeigt dir die Variablen des Aufrufers.

Fährst du mit der Maus über eine Variable im Code, siehst du ihren Wert ebenfalls. Und die Console arbeitet im
angehaltenen Zustand im **aktuellen Scope**: Dort kannst du lokale Variablen abfragen oder sogar ändern.

> [!FEHLER]
> **Minifizierten Code debuggen.** Auf echten Websites ist JavaScript oft [[minifizierung|minifiziert]] – auf eine einzige lange
> Zeile zusammengepresst. Klicke unten auf `{}` (*Pretty print*), um ihn lesbar zu formatieren. In eigenen Projekten
> sorgen [[source-map|Source Maps]] dafür, dass du deine Original-Dateien siehst.

## Das Application-Panel

Viele Fehler hängen an gespeicherten Daten: Ein alter Wert im Speicher, ein abgelaufenes Login, ein Warenkorb
aus einer früheren Version. Das Application-Panel zeigt, was der Browser für diese Website speichert:

| Speicher | Eigenschaften |
|---|---|
| Local Storage | Schlüssel-Wert-Paare, bleiben nach Schließen des Browsers erhalten |
| Session Storage | wie Local Storage, aber nur für diesen Tab, bis er geschlossen wird |
| Cookies | werden bei jedem Request an den Server geschickt, haben Ablaufdatum und Flags |
| IndexedDB | Datenbank im Browser für größere Datenmengen |

[[cookie|Cookies]] kennst du vielleicht schon vom Login. Local und Session Storage zusammen nennt man [[web-storage|Web Storage]]. Du kannst Einträge ansehen, ändern und
löschen. Bei Cookies siehst du außerdem Flags wie **HttpOnly** (für JavaScript unsichtbar) und **Secure** (nur über
HTTPS). Unter **Storage** löscht *Clear site data* alles auf einmal – praktisch, um einen Fehler wie bei
einem neuen Besucher zu testen.

> [!PRAXIS]
> „Bei mir geht's, bei der Kundin nicht“ liegt oft an alten gespeicherten Daten. Teste solche Fälle in einem
> privaten Fenster oder nach *Clear site data* – dann startest du mit leerem Speicher wie jemand, der die Seite
> zum ersten Mal besucht.

## Zusammenfassung

- Im Sources-Panel setzt du Breakpoints per Klick auf die Zeilennummer; der Code hält **vor** der Zeile an.
- Bedingte Breakpoints, Logpoints und `debugger;` helfen in Schleifen und schwer erreichbaren Stellen.
- Resume, Step over, Step into und Step out steuern die Ausführung.
- Scope, Watch und Call Stack zeigen Werte, eigene Ausdrücke und die Aufrufkette live.
- Das Application-Panel zeigt Local Storage, Session Storage, Cookies und IndexedDB.
- Mit *Clear site data* oder einem privaten Fenster testest du ohne alte gespeicherte Daten.
