---
title: DevTools öffnen – Elements und Console
summary: Was die Entwicklertools des Browsers sind, wie du sie öffnest und wie du mit Elements und Console eine Webseite von innen untersuchst.
duration: 20
sources:
  - title: Chrome DevTools – Überblick
    url: https://developer.chrome.com/docs/devtools/overview
  - title: Chrome DevTools – Console
    url: https://developer.chrome.com/docs/devtools/console
  - title: Firefox DevTools User Docs
    url: https://firefox-source-docs.mozilla.org/devtools-user/
  - title: MDN – What are browser developer tools?
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Tools_and_setup/What_are_browser_developer_tools
quiz:
  - type: single
    question: Du änderst im Elements-Panel die Farbe einer Überschrift. Was passiert beim Neuladen der Seite?
    options:
      - Die Änderung ist dauerhaft in der CSS-Datei gespeichert.
      - Die Änderung ist weg – sie galt nur für die geladene Seite in deinem Browser.
      - Die Änderung wird an den Server geschickt.
    answer: 1
    explanation: >
      DevTools ändern nur die Kopie der Seite in deinem Browser. Das ist perfekt zum Ausprobieren – die echte
      Änderung musst du danach im Quellcode machen.
  - type: multiple
    question: Was kannst du in der Console tun?
    options:
      - JavaScript-Ausdrücke im Kontext der Seite ausführen, zum Beispiel `document.title`.
      - Fehlermeldungen der Seite samt Datei und Zeile sehen.
      - Mit `$0` auf das Element zugreifen, das du zuletzt im Elements-Panel ausgewählt hast.
      - Die PHP-Dateien auf dem Server bearbeiten.
    answers: [0, 1, 2]
    explanation: >
      Die Console ist ein JavaScript-Eingabefeld für die geladene Seite und zugleich ihr Fehlerprotokoll.
      Code auf dem Server erreicht sie nicht.
  - type: cloze
    text: Der Baum aus Objekten, den der Browser aus dem HTML baut und den das Elements-Panel zeigt, heißt ___. Die DevTools öffnest du in den meisten Browsern mit der Taste ___.
    blanks:
      - [DOM, Document Object Model]
      - [F12]
    explanation: >
      Das DOM ist der aktuelle Zustand der Seite – inklusive allem, was JavaScript nachträglich geändert hat.
      F12 (oder Strg+Umschalt+I, auf dem Mac Cmd+Option+I) öffnet die DevTools.
  - type: match
    question: Ordne jeder Frage das Panel zu, das sie beantwortet.
    pairs:
      - { left: "Warum ist der Button rot?", right: "Elements (Styles)" }
      - { left: "Welche JavaScript-Fehler gab es beim Laden?", right: "Console" }
      - { left: "Welche Antwort hat die API geschickt?", right: "Network" }
      - { left: "Was steht im Local Storage?", right: "Application" }
    explanation: >
      Jedes Panel beantwortet eine andere Art Frage. Mit der Zeit wechselst du ganz automatisch zwischen ihnen.
tasks:
  - id: devtools-panels-beschriften
    type: diagram
    title: Erkenne die DevTools-Bereiche
    description: >
      Jeder Kasten zeigt einen typischen Ausschnitt aus einem DevTools-Bereich. Ordne jedem Kasten den richtigen
      Namen zu. Achte auf die Inhalte: HTML-Baum, Fehlermeldungen, Code mit Breakpoint, Requests, gespeicherte
      Daten und eine Bewertung.
    image: /assets/debugging-devtools/devtools-panels-leer.svg
    slots:
      - { x: 17, y: 17, answer: Elements }
      - { x: 50, y: 17, answer: Console }
      - { x: 83, y: 17, answer: Sources }
      - { x: 17, y: 61, answer: Network }
      - { x: 50, y: 61, answer: Application }
      - { x: 83, y: 61, answer: Lighthouse }
    distractors: [Performance, Memory]
    hints:
      - Der blaue Punkt neben einer Zeilennummer ist ein Breakpoint – den setzt du im Bereich mit dem Quellcode.
  - id: welches-panel
    type: dragdrop
    title: Welches Panel hilft hier?
    description: Du untersuchst einen Online-Shop. Ordne jede Frage dem DevTools-Bereich zu, in dem du zuerst nachsiehst.
    targets:
      - { id: elements, label: Elements }
      - { id: console, label: Console }
      - { id: network, label: Network }
      - { id: application, label: Application }
    items:
      - { label: "Der Kaufen-Button ist unsichtbar – welches CSS versteckt ihn?", target: elements }
      - { label: "Hat ein Skript beim Laden einen Fehler geworfen?", target: console }
      - { label: "Wie viele Artikel liegen gerade in `warenkorb.length`?", target: console }
      - { label: "Liefert POST /api/korb einen Statuscode 500?", target: network }
      - { label: "Ist das Cookie `session` noch gesetzt?", target: application }
      - { label: "Welche Klasse hat das ausgewählte `<li>`-Element?", target: elements }
    hints:
      - Alles rund um Requests und Antworten steht im Network-Panel, gespeicherte Daten im Application-Panel.
---
Eine Webseite sieht kaputt aus: Ein Button fehlt, eine Liste bleibt leer, ein Klick bewirkt nichts. Von außen
siehst du nur das Ergebnis. Jeder moderne [[browser|Browser]] bringt aber ein komplettes Werkzeugset mit, mit
dem du in die Seite **hineinschauen** kannst: die [[devtools|DevTools]] (Entwicklertools).

## DevTools öffnen

Die DevTools sind in Chrome, Edge, Firefox und Safari eingebaut. Du öffnest sie so:

| Weg | Windows / Linux | macOS |
|---|---|---|
| Tastenkürzel | `F12` oder `Strg` + `Umschalt` + `I` | `Cmd` + `Option` + `I` |
| Direkt zur Console | `Strg` + `Umschalt` + `J` | `Cmd` + `Option` + `J` |
| Element untersuchen | Rechtsklick → **Untersuchen** | Rechtsklick → **Untersuchen** |

In Safari musst du die Entwicklerfunktionen einmalig in den Einstellungen unter „Erweitert“ einschalten.
Alle Browser bieten dieselben Grundfunktionen, nur die Namen weichen etwas ab: Firefox nennt das Elements-Panel
zum Beispiel „Inspektor“. In diesem Kurs verwenden wir die Namen aus Chrome.

![Die wichtigsten Bereiche der DevTools: Elements, Console, Sources, Network, Application, Lighthouse](/assets/debugging-devtools/devtools-panels.svg)

## Elements: die Seite, wie sie gerade ist

Aus dem HTML baut der Browser einen Baum aus Objekten: das [[dom|DOM]] (*Document Object Model*). Das
Elements-Panel zeigt dieses DOM – also den **aktuellen** Zustand der Seite, inklusive allem, was JavaScript
nachträglich eingefügt oder entfernt hat. Die Seitenquelltext-Ansicht dagegen zeigt nur das ursprünglich
geladene HTML.

Was du im Elements-Panel tun kannst:

- **Element auswählen:** Mit dem Pfeil-Symbol oben links klickst du ein Element auf der Seite an.
- **Styles lesen:** Rechts siehst du alle CSS-Regeln, die auf das Element wirken. Durchgestrichene Regeln
  wurden von einer anderen Regel überschrieben.
- **Computed:** zeigt die endgültigen Werte, etwa die tatsächliche Breite in Pixeln.
- **Live ändern:** Doppelklick auf Text, Attribut oder CSS-Wert – die Seite ändert sich sofort.

> [!MERKSATZ]
> Änderungen in den DevTools gelten nur für die geladene Seite in **deinem** Browser. Nach dem Neuladen sind sie
> weg. Nutze sie zum Ausprobieren und übertrage die Lösung danach in deinen Quellcode.

## Console: Fehlerprotokoll und Eingabefeld

Die Console hat zwei Aufgaben. Erstens sammelt sie alle Meldungen der Seite: Fehler (rot), Warnungen (gelb)
und Ausgaben von [[console-log|console.log]]. Jede Meldung zeigt rechts Datei und Zeile – ein Klick darauf
springt direkt in den Code.

Zweitens ist sie ein Eingabefeld für JavaScript, das **im Kontext der Seite** läuft:

```js title="Console"
document.title
// 'Mein Shop'
document.querySelectorAll('li').length
// 12
$0.classList
// DOMTokenList ['produkt', 'ausverkauft']
```

`$0` ist das Element, das du zuletzt im Elements-Panel ausgewählt hast. So prüfst du schnell Annahmen, ohne
eine Zeile Code zu ändern: Gibt es das Element? Welchen Wert hat die globale Variable gerade?

> [!FEHLER]
> **Meldungen übersehen, weil gefiltert wird.** Oben in der Console gibt es eine Filterleiste und eine Auswahl
> der Log-Level. Ist dort zum Beispiel nur „Errors“ aktiv, fehlen deine `console.log`-Ausgaben scheinbar.
> Prüfe den Filter, bevor du an deinem Code zweifelst.

## Die Console gezielt nutzen

Die Console kann mehr als `console.log`. Ein paar Methoden, die beim Debuggen viel Zeit sparen:

| Methode | Wirkung |
|---|---|
| `console.error('…')` | Rote Meldung mit Stack Trace zum Aufklappen |
| `console.warn('…')` | Gelbe Warnung |
| `console.table(liste)` | Array von Objekten als Tabelle |
| `console.dir(objekt)` | Objekt mit allen Eigenschaften zum Aufklappen |
| `console.count('klick')` | Zählt, wie oft diese Stelle erreicht wurde |

Zwei Einstellungen solltest du kennen: **Preserve log** behält die Meldungen, auch wenn die Seite neu lädt
oder weiterleitet – sonst verschwindet ein Fehler genau in dem Moment, in dem du ihn lesen willst. Und mit dem
Zahnrad kannst du Zeitstempel einblenden.

> [!PRAXIS]
> Wenn dir jemand „Die Seite ist kaputt“ meldet, bitte um einen Screenshot der **Console** – nicht der Seite.
> Eine rote Meldung mit Datei und Zeile verrät oft in Sekunden, was eine Beschreibung in Worten nicht schafft.

## Weitere Bereiche im Überblick

Neben Elements und Console gibt es weitere Panels, die du in den nächsten Lektionen genauer kennenlernst:

- **Network:** alle [[http-request|HTTP-Requests]] der Seite mit Statuscode, Headern und Zeitbedarf.
- **Sources:** der JavaScript-Code der Seite mit [[breakpoint|Breakpoints]] zum Anhalten.
- **Application:** gespeicherte Daten wie Local Storage und [[cookie|Cookies]].
- **Lighthouse:** erstellt einen Bericht zu Ladezeit, Barrierefreiheit und Best Practices. Für den Einstieg
  reicht es zu wissen, dass es ihn gibt – Details stehen in der
  [Lighthouse-Dokumentation](https://developer.chrome.com/docs/lighthouse/overview).

## Zusammenfassung

- DevTools öffnest du mit `F12`, `Strg`+`Umschalt`+`I` (Mac: `Cmd`+`Option`+`I`) oder per Rechtsklick → Untersuchen.
- Elements zeigt das aktuelle DOM und alle CSS-Regeln eines Elements.
- Änderungen in den DevTools sind vorübergehend – ideal zum Ausprobieren.
- Die Console sammelt Fehler mit Datei und Zeile und führt JavaScript im Kontext der Seite aus.
- `console.table`, `console.dir` und `console.count` machen Ausgaben übersichtlicher.
- Prüfe Filter und „Preserve log“, wenn Meldungen zu fehlen scheinen.
