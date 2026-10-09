---
title: Die mentale Landkarte
summary: Wie du aus Ordnerstruktur und einem einzigen verfolgten Request ein Bild der ganzen Anwendung gewinnst – und es aufzeichnest.
duration: 20
sources:
  - title: Laravel 13 – Request Lifecycle
    url: https://laravel.com/docs/13.x/lifecycle
  - title: Mermaid – Sequenzdiagramme
    url: https://mermaid.js.org/syntax/sequenceDiagram.html
  - title: PHP-Handbuch – Namespaces
    url: https://www.php.net/manual/de/language.namespaces.php
quiz:
  - type: single
    question: Was ist die wirksamste Methode, um den Aufbau einer unbekannten Webanwendung zu verstehen?
    options:
      - Alle Klassen alphabetisch lesen.
      - Einen einzigen Request vom Einstiegspunkt bis zur Antwort verfolgen und aufschreiben.
      - Nur die Datenbanktabellen ansehen.
      - Den Code des Frameworks in vendor/ lesen.
    answer: 1
    explanation: >
      Ein verfolgter Request zeigt dir, welche Schichten es gibt und wie sie zusammenspielen. Die meisten anderen
      Requests laufen nach demselben Muster.
  - type: match
    question: Ordne jedem Ordner im Kiezladen seine Aufgabe zu.
    pairs:
      - { left: "src/Controller", right: "Nimmt Requests entgegen und baut die Antwort" }
      - { left: "src/Service", right: "Enthält die Geschäftslogik, z. B. Preisberechnung" }
      - { left: "src/Repository", right: "Liefert Daten, z. B. Produkte" }
      - { left: "src/Listener", right: "Reagiert auf Ereignisse wie eine neue Bestellung" }
    explanation: >
      Die Ordnernamen verraten die Schichten der Anwendung. Diese Aufteilung findest du in vielen Projekten wieder.
  - type: multiple
    question: Wann ist es sinnvoll, beim Verfolgen eines Requests nicht tiefer zu gehen?
    options:
      - Wenn der Aufruf in ein fremdes Paket in vendor/ führt.
      - Wenn eine Funktion einen sprechenden Namen hat und für deine Frage keine Rolle spielt.
      - Wenn der Aufruf in der Klasse steckt, deren Verhalten du ändern sollst.
      - Wenn du an einer Stelle bist, die dein Ticket direkt betrifft.
    answers: [0, 1]
    explanation: >
      Fremde Pakete und unwichtige Hilfsfunktionen behandelst du als Blackbox. Tiefer gehst du genau dort, wo
      deine Aufgabe liegt.
  - type: cloze
    text: Ein Diagramm, das zeigt, welcher Teil in welcher Reihenfolge welchen anderen aufruft, heißt ___diagramm.
    blanks:
      - [Sequenz]
    explanation: Sequenzdiagramme zeigen Aufrufe als Pfeile zwischen Beteiligten, von oben nach unten in zeitlicher Reihenfolge.
tasks:
  - id: landkarte-beschriften
    type: diagram
    title: Beschrifte die Landkarte des Kiezladens
    description: >
      Das Diagramm zeigt, durch welche Teile ein `POST /checkout` läuft. Unter jedem Kasten steht die Datei oder
      Klasse. Ziehe die passende Rolle in jeden Kasten.
    image: /assets/fremden-code-lesen/request-ablauf-leer.svg
    slots:
      - { x: 8.9, y: 27.5, answer: Browser }
      - { x: 29.2, y: 27.5, answer: Front Controller }
      - { x: 50.5, y: 27.5, answer: Router }
      - { x: 71.9, y: 27.5, answer: Controller }
      - { x: 71.9, y: 70.5, answer: Service }
      - { x: 91.7, y: 70.5, answer: DTO }
      - { x: 50.5, y: 70.5, answer: Event }
      - { x: 29.2, y: 70.5, answer: Listener }
    distractors: [Repository, Datenbank]
    hints:
      - Die Dateinamen verraten die Rolle – CheckoutController ist ein Controller, PriceCalculator liegt in src/Service.
  - id: checkout-verfolgen
    type: order
    title: Was passiert bei POST /checkout?
    description: Bring die Stationen eines Checkout-Requests im Kiezladen in die richtige Reihenfolge.
    items:
      - Der Webserver übergibt den Request an public/index.php.
      - bootstrap.php registriert den Autoloader.
      - routes.php legt alle Routen fest und liefert den Router.
      - Der Router findet den Handler CheckoutController::store.
      - Der Controller lässt den PriceCalculator die Summe berechnen.
      - Der PriceCalculator gibt ein OrderSummary-Objekt zurück.
      - Der EventDispatcher meldet das Ereignis OrderPlaced an den Listener.
      - Der Controller gibt den Text „Danke! Summe …“ zurück.
    hints:
      - Lies public/index.php von oben nach unten, dann CheckoutController::store.
---
Nach der ersten Stunde kennst du README, Tests und Einstiegspunkte. Trotzdem fühlt sich das Projekt noch an
wie eine Stadt, in der du nur den Bahnhof kennst. Jetzt baust du dir eine Landkarte – nicht von jeder
Straße, sondern von den Hauptwegen.

## Die Ordner verraten die Architektur

Die Ordnerstruktur ist der erste Hinweis darauf, wie die Anwendung gedacht ist. Viele Projekte teilen ihren
Code in Schichten auf – das nennt man [[schichtenarchitektur|Schichtenarchitektur]]. Jede Schicht hat eine
Aufgabe und spricht nur mit bestimmten anderen.

| Ordner im Kiezladen | Schicht | Aufgabe |
|---|---|---|
| `src/Controller` | Eingang | Request annehmen, Antwort bauen |
| `src/Service` | Geschäftslogik | Regeln wie „Versand gratis ab 50 €“ |
| `src/Repository` | Datenzugriff | Produkte liefern |
| `src/Dto` | Datenobjekte | Ergebnisse sauber verpacken |
| `src/Event`, `src/Listener` | Ereignisse | Auf eine Bestellung reagieren |

Schon diese Tabelle beantwortet viele Fragen. Eine Frage zu Preisen? Dann fängst du in `src/Service` an.

> [!MERKSATZ]
> Ordnernamen sind Hypothesen über die Architektur. Prüfe sie, indem du einen Request verfolgst.

## Einen Request von Anfang bis Ende verfolgen

Die beste Methode, eine Webanwendung zu verstehen: Du nimmst **eine** Funktion und verfolgst sie vom
Einstiegspunkt bis zur Antwort. Dabei schreibst du jede Station mit. So entsteht ein Bild vom
[[request-lebenszyklus|Request-Lebenszyklus]].

Für `POST /checkout` sieht deine Mitschrift so aus:

1. `public/index.php` lädt `bootstrap.php` und `routes.php`.
2. Der Router findet `CheckoutController::store`.
3. `store()` holt den Warenkorb über `CartController::cart()`. Er liegt in der [[session|Session]].
4. Der `PriceCalculator` berechnet Rabatt, Versand und Summe und gibt ein `OrderSummary` zurück.
5. Der `EventDispatcher` meldet das Ereignis `OrderPlaced`. Der Listener `SendOrderConfirmation` reagiert.
6. Der Controller gibt den Danke-Text zurück.

Der Rest der Anwendung funktioniert meist nach demselben Muster. Ein zweiter Request geht deshalb viel
schneller.

## Zeichne es auf

Was du aufschreibst oder zeichnest, behältst du. Und du kannst es anderen zeigen. Eine Skizze auf Papier
reicht völlig, solange die Stationen und ihre Reihenfolge stimmen:

![Der Weg eines Requests durch den Kiezladen](/assets/fremden-code-lesen/request-ablauf.svg)

Für die Dokumentation eignet sich ein [[sequenzdiagramm|Sequenzdiagramm]]. Mit der Textsprache Mermaid
schreibst du es direkt in eine [[markdown|Markdown]]-Datei. Viele Code-Hosting-Dienste zeigen es dann als
Grafik an:

```text title="Sequenzdiagramm in Mermaid-Syntax"
sequenceDiagram
    Browser->>index.php: POST /checkout
    index.php->>CheckoutController: store()
    CheckoutController->>PriceCalculator: summarize(subtotal, voucher)
    PriceCalculator-->>CheckoutController: OrderSummary
    CheckoutController->>EventDispatcher: dispatch(OrderPlaced)
    CheckoutController-->>Browser: "Danke! Summe: …"
```

## Wie tief du gehst

Beim Verfolgen landest du ständig an Abzweigungen. Die wichtigste Entscheidung lautet: **Gehe ich hier
hinein oder nicht?**

| Situation | Entscheidung |
|---|---|
| Aufruf in ein fremdes Paket (`vendor/`, `node_modules/`) | Blackbox: Name und Doku reichen |
| Hilfsfunktion mit klarem Namen, z. B. `formatPrice()` | Blackbox, solange sie nicht dein Thema ist |
| Code, der dein Ticket direkt betrifft | Hinein und genau lesen |
| Du verstehst das Ergebnis eines Aufrufs nicht | Hinein, bis du es verstehst |

> [!FEHLER]
> Sich im Framework verlaufen: Wer bei jedem Aufruf in den Quellcode von Laravel oder React abtaucht, ist
> nach einer Stunde zwanzig Dateien tief und hat seine eigentliche Frage vergessen. Notiere die Frage und
> kehre zu ihr zurück.

> [!PRAXIS]
> Viele Teams hängen ein Ablaufdiagramm des wichtigsten Requests ins Wiki. Wenn es keins gibt, ist deine
> Skizze nach der ersten Woche ein wertvoller Beitrag – für dich und für die nächste neue Person.

## Zusammenfassung

- Ordnernamen zeigen dir die **Schichten** der Anwendung – als Hypothese, die du prüfst.
- Verfolge **einen** Request vom Einstiegspunkt bis zur Antwort und schreib jede Station mit.
- Der zweite Request geht schneller, weil die meisten Abläufe demselben Muster folgen.
- Zeichne deine Landkarte auf: auf Papier oder als Sequenzdiagramm in Mermaid.
- Fremde Pakete und unwichtige Hilfsfunktionen sind Blackboxen. Tief liest du nur, wo deine Aufgabe liegt.
