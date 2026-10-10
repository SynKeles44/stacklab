---
title: Unit, Integration, End-to-End – Pyramide und Trophy
summary: Welche Testarten es gibt, was sie kosten und wie du sie mit Testpyramide und Testing Trophy sinnvoll verteilst.
duration: 20
sources:
  - title: Martin Fowler – The Practical Test Pyramid
    url: https://martinfowler.com/articles/practical-test-pyramid.html
  - title: Kent C. Dodds – The Testing Trophy and Testing Classifications
    url: https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications
  - title: Playwright – Best Practices
    url: https://playwright.dev/docs/best-practices
quiz:
  - type: match
    question: Ordne jedem Test die passende Ebene zu.
    pairs:
      - { left: "rabatt(1000, 10) ergibt 900", right: Unit-Test }
      - { left: "Repository speichert einen Gutschein in einer echten SQLite-Datenbank", right: Integrationstest }
      - { left: "Browser öffnet den Shop, legt ein Produkt in den Warenkorb und bezahlt", right: End-to-End-Test }
      - { left: "PHPStan meldet einen falschen Rückgabetyp", right: Statische Analyse }
    explanation: Je mehr echte Teile zusammenspielen, desto höher die Ebene. Statische Analyse führt den Code gar nicht aus – sie ist die Basis der Testing Trophy.
  - type: single
    question: Warum steht der End-to-End-Test an der Spitze der Pyramide?
    options:
      - Weil er am wichtigsten ist und man möglichst viele davon braucht.
      - Weil er langsam und aufwendig ist – man schreibt nur wenige, für die wichtigsten Wege.
      - Weil er als Erstes geschrieben werden muss.
    answer: 1
    explanation: End-to-End-Tests geben viel Vertrauen, sind aber langsam, teuer in der Pflege und anfälliger für Wackler. Deshalb gibt es wenige davon.
  - type: multiple
    question: Welche Aussagen zur Testing Trophy stimmen?
    options:
      - Sie legt den Schwerpunkt auf Integrationstests.
      - Statische Analyse (Typen, Linter) bildet ihr Fundament.
      - Sie verbietet Unit-Tests.
      - Sie entstand vor allem im Frontend-Umfeld.
    answers: [0, 1, 3]
    explanation: Die Trophy verschiebt das Gewicht zu Integrationstests, weil diese nah an echter Nutzung sind. Unit-Tests gibt es weiterhin – nur nicht für jedes Detail.
  - type: cloze
    text: Ein Test, der Code im Browser genau so bedient wie ein Mensch – vom Klick bis zur Datenbank –, heißt ___-Test.
    blanks:
      - [End-to-End, e2e, end to end, End-to-end]
    explanation: End-to-End bedeutet „von einem Ende zum anderen“ – durch alle Schichten der Anwendung.
tasks:
  - id: pyramide-beschriften
    type: diagram
    title: Beschrifte die Testpyramide
    description: Ordne jeder Ebene der Pyramide die passende Testart zu. Die Pfeile rechts zeigen dir, wo Tests teuer und wo sie billig sind.
    image: /assets/testing/testpyramide-leer.svg
    slots:
      - { x: 37.5, y: 32, answer: End-to-End }
      - { x: 37.5, y: 53, answer: Integration }
      - { x: 37.5, y: 79, answer: Unit }
    distractors: [Statische Analyse, Manuell]
    hints:
      - Unten stehen die vielen, schnellen Tests – oben die wenigen, langsamen.
  - id: ebenen-zuordnen
    type: dragdrop
    title: Welche Ebene passt?
    description: |
      Du planst Tests für einen kleinen Onlineshop. Ordne jeden geplanten Test der Ebene zu, auf der du
      ihn schreiben würdest.
    targets:
      - { id: unit, label: Unit-Test }
      - { id: integration, label: Integrationstest }
      - { id: e2e, label: End-to-End-Test }
    items:
      - { label: Mehrwertsteuer wird korrekt gerundet, target: unit }
      - { label: Gutscheincode ist nur bis zum Ablaufdatum gültig, target: unit }
      - { label: "POST /api/orders legt eine Bestellung in der Datenbank an", target: integration }
      - { label: Der Mail-Versand wird beim Bestellen mit den richtigen Daten aufgerufen, target: integration }
      - { label: "Kundin meldet sich an, bestellt und sieht die Bestätigungsseite", target: e2e }
      - { label: Das Login-Formular zeigt bei falschem Passwort eine Fehlermeldung im Browser, target: e2e }
    hints:
      - Reine Berechnungen ohne Datenbank oder Browser sind Unit-Tests.
      - Sobald ein echter Browser einen ganzen Nutzerweg klickt, ist es End-to-End.
---
„Wir haben 2000 Tests!“ klingt gut – bis du merkst, dass alle durch den Browser klicken und die Suite eine
Stunde braucht. Oder dass alle nur winzige Funktionen prüfen und trotzdem niemand bemerkt, dass der
Checkout kaputt ist. Es kommt auf die **Mischung** an.

## Drei Ebenen von Tests

| Ebene | Was wird geprüft? | Beispiel | Dauer |
|---|---|---|---|
| [[unit-test\|Unit-Test]] | Eine Funktion oder Klasse, isoliert | `rabatt(1000, 10)` ergibt `900` | Millisekunden |
| [[integrationstest\|Integrationstest]] | Mehrere Teile zusammen | Controller + Datenbank + Validierung | Zehntelsekunden |
| [[end-to-end-test\|End-to-End-Test]] | Die ganze Anwendung wie ein Mensch | Browser: anmelden, bestellen, Bestätigung sehen | Sekunden |

Eine **Unit** ist die kleinste sinnvolle Einheit – meist eine Funktion oder Klasse. Der Unit-Test ersetzt
ihre Abhängigkeiten oft durch einfache Platzhalter, damit nur sie selbst geprüft wird.

Ein **Integrationstest** prüft, ob Teile zusammenpassen: Speichert das Repository wirklich in der
Datenbank? Liefert der Endpunkt das richtige JSON?

Ein **End-to-End-Test** (kurz E2E) startet die echte Anwendung und bedient sie im Browser – von einem
Ende (Bildschirm) zum anderen (Datenbank).

> [!MERKSATZ]
> Je höher die Ebene, desto mehr echtes Zusammenspiel prüfst du – und desto langsamer, teurer und
> wackeliger wird der Test.

## Die Testpyramide

Die [[testpyramide|Testpyramide]] ist ein Bild für die Verteilung: viele schnelle Unit-Tests unten,
weniger Integrationstests in der Mitte, nur eine Handvoll End-to-End-Tests oben.

![Die Testpyramide mit Unit-Tests unten, Integrationstests in der Mitte und End-to-End-Tests oben](/assets/testing/testpyramide.svg)

Warum diese Form?

- **Unit-Tests** sind billig: Sie laufen in Millisekunden und zeigen genau die kaputte Stelle.
- **E2E-Tests** geben das meiste Vertrauen, brauchen aber einen Browser, eine laufende App und Testdaten.
  Wird einer rot, musst du oft lange suchen, wo der Fehler steckt.

Die Pyramide ist eine Faustregel, kein Gesetz. Sie warnt vor allem vor dem Gegenteil, der „Eistüte“:
viele langsame UI-Tests, kaum Unit-Tests.

## Die Testing Trophy

Im Frontend hat sich eine zweite Form verbreitet: die [[testing-trophy|Testing Trophy]]. Sie hat vier Stufen:

1. **Statisch** (Fundament): [[typescript|TypeScript]], Linter, [[statische-analyse|statische Analyse]] –
   fangen Tippfehler, ohne Code auszuführen.
2. **Unit**: für reine Logik.
3. **Integration** (der dickste Teil): mehrere Komponenten zusammen, so wie Nutzer sie verwenden.
4. **End-to-End** (die Spitze): die kritischen Wege.

Die Idee: Ein Test, der einer echten Nutzung ähnelt, gibt mehr Vertrauen. Ein Integrationstest einer
Formular-Komponente findet mehr echte Fehler als zehn Unit-Tests für ihre Hilfsfunktionen.

> [!FEHLER]
> **Pyramide gegen Trophy ausspielen.** Beide sagen dasselbe: viele schnelle Tests, wenige langsame –
> und jede Ebene hat ihre Aufgabe. Streite nicht über die Form, sondern frag: Welcher Test findet
> diesen Fehler am billigsten?

## Welche Ebene wählst du?

Eine einfache Entscheidungshilfe:

| Situation | Ebene |
|---|---|
| Berechnung, Regel, Formatierung | Unit |
| Zusammenspiel mit Datenbank, Dateisystem, HTTP-Endpunkt | Integration |
| Geld- oder Login-Weg, der niemals kaputtgehen darf | End-to-End |
| Tippfehler, falsche Typen | Statische Analyse |

> [!PRAXIS]
> In Laravel-Projekten heißen die Ordner `tests/Unit` und `tests/Feature`. Feature-Tests schicken echte
> HTTP-Requests an die App und nutzen eine Testdatenbank – sie sind dort die Integrationstests. Mit
> Playwright kommen ein paar E2E-Tests für Login und Checkout dazu.

## Zusammenfassung

- Unit-Tests prüfen eine Einheit isoliert, Integrationstests das Zusammenspiel, E2E-Tests die ganze App.
- Höhere Ebenen geben mehr Vertrauen, sind aber langsamer, teurer und anfälliger.
- Die Testpyramide empfiehlt viele Unit-, weniger Integrations- und wenige E2E-Tests.
- Die Testing Trophy betont statische Analyse als Fundament und Integrationstests als Schwerpunkt.
- Wähle die niedrigste Ebene, auf der ein Test den Fehler zuverlässig findet.
