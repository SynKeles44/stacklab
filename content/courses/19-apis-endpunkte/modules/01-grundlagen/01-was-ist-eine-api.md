---
title: Was ist eine API?
summary: Eine API ist ein Vertrag zwischen Programmen – du lernst, was er festlegt und wie sich Bibliotheks-APIs von Web-APIs unterscheiden.
duration: 15
sources:
  - title: MDN – Einführung in Web-APIs
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Client-side_APIs/Introduction
  - title: MDN – Ein Überblick über HTTP
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview
  - title: PHP-Handbuch – Funktionsreferenz
    url: https://www.php.net/manual/de/funcref.php
quiz:
  - type: single
    question: Was beschreibt eine API am besten?
    options:
      - Eine Datenbank, in der ein Programm seine Daten ablegt.
      - Ein Vertrag, der festlegt, wie ein Programm die Funktionen eines anderen nutzen kann.
      - Eine Programmiersprache für Webserver.
      - Die Benutzeroberfläche einer Website.
    answer: 1
    explanation: >
      API steht für Application Programming Interface. Sie legt fest, welche Anfragen erlaubt sind, welche
      Eingaben nötig sind und welche Antworten zurückkommen – ein Vertrag zwischen zwei Programmen.
  - type: multiple
    question: Welche Beispiele sind Web-APIs (Kommunikation über das Netzwerk per HTTP)?
    options:
      - "`GET https://api.example.com/weather?city=Berlin`"
      - "`Math.max(3, 7)` in JavaScript"
      - Eine App lädt per `POST /orders` eine Bestellung auf einen Server.
      - "`strtoupper('hallo')` in PHP"
    answers: [0, 2]
    explanation: >
      `Math.max` und `strtoupper` sind Bibliotheks-APIs: Funktionen im selben Programm, ohne Netzwerk.
      Die beiden HTTP-Requests gehen über das Netzwerk an einen Server – das sind Web-APIs.
  - type: cloze
    text: Bei einer Web-API schickt der ___ einen Request, der ___ antwortet mit einer Response.
    blanks:
      - [Client]
      - [Server]
    explanation: Der Client fragt, der Server antwortet. Dieselbe Rollenverteilung kennst du von Browser und Webserver.
  - type: match
    question: Ordne jedem Teil des API-Vertrags ein Beispiel zu.
    pairs:
      - { left: "Was darf ich fragen?", right: "GET /books/{id}" }
      - { left: "Was muss ich mitschicken?", right: "Die ID des Buchs im Pfad" }
      - { left: "Was bekomme ich zurück?", right: "JSON mit id, title, year" }
      - { left: "Was passiert im Fehlerfall?", right: "404 mit Fehlerbeschreibung" }
    explanation: Ein guter API-Vertrag beantwortet alle vier Fragen – erst dann kann sich ein anderes Team darauf verlassen.
tasks:
  - id: api-arten
    type: dragdrop
    title: Bibliotheks-API oder Web-API?
    description: >
      Ordne jedes Beispiel zu. Frage dich: Läuft der Aufruf im selben Programm, oder geht er als
      HTTP-Request über das Netzwerk?
    targets:
      - { id: bibliothek, label: "Bibliotheks-API (im selben Programm)" }
      - { id: web, label: "Web-API (über HTTP)" }
    items:
      - { label: "array_map() in PHP", target: bibliothek }
      - { label: "JSON.parse() in JavaScript", target: bibliothek }
      - { label: "localStorage.setItem() im Browser", target: bibliothek }
      - { label: "GET https://api.example.com/books", target: web }
      - { label: "Eine App holt das Wetter von einem Wetterdienst", target: web }
      - { label: "Ein Shop meldet eine Zahlung an einen Zahlungsdienst", target: web }
    hints:
      - Steht eine URL mit Host im Spiel, ist es fast immer eine Web-API.
  - id: restaurant
    type: steps
    title: Die API als Kellner
    description: Spiel die Restaurant-Analogie durch – sie hilft dir, die Rollen in einer Web-API zu sortieren.
    steps:
      - situation: >
          Du sitzt im Restaurant. Die Küche darfst du nicht betreten. Du bekommst eine Speisekarte und
          bestellst beim Kellner „einmal Nummer 12“.
        question: Was entspricht in der Analogie der API?
        options:
          - Die Küche
          - Die Speisekarte samt Kellner – sie legen fest, was du bestellen kannst und wie
          - Dein Tisch
        answer: 1
        explanation: >
          Die Speisekarte ist der Vertrag (welche Gerichte, welche Angaben), der Kellner trägt Anfragen und
          Antworten hin und her. Wie die Küche intern arbeitet, bleibt verborgen – genau wie der Code hinter
          einer API.
      - situation: Du bestellst „Nummer 99“, aber die Karte endet bei Nummer 40.
        question: Was sollte eine gute API in diesem Fall tun?
        options:
          - Irgendein anderes Gericht bringen.
          - Gar nicht reagieren.
          - Klar antworten, dass es dieses Gericht nicht gibt.
        answer: 2
        explanation: >
          Eine gute API antwortet auch im Fehlerfall verständlich, bei Web-APIs z. B. mit dem Statuscode 404
          und einer kurzen Beschreibung. Stilles Scheitern ist für Clients das Schlimmste.
---
Deine Wetter-App zeigt 14 Grad für Hamburg. Aber woher weiß sie das? Die App misst nichts selbst – sie
fragt ein anderes Programm, das die Wetterdaten kennt. Damit zwei Programme sich verstehen, brauchen sie
feste Regeln: Welche Fragen sind erlaubt, und wie sehen die Antworten aus? Diese Regeln heißen **API**.

## Eine API ist ein Vertrag

[[api|API]] steht für *Application Programming Interface* – eine Programmierschnittstelle. Sie ist ein
**Vertrag** zwischen zwei [[programm|Programmen]]: Das eine bietet etwas an, das andere nutzt es. Der
Vertrag legt fest:

| Frage | Beispiel |
|---|---|
| Was darf ich fragen? | „Gib mir das Buch mit der ID 2“ |
| Was muss ich mitschicken? | Die ID, vielleicht einen Zugangsschlüssel |
| Was bekomme ich zurück? | Titel, Jahr und Genre des Buchs |
| Was passiert bei Fehlern? | „Dieses Buch gibt es nicht“ |

Wie das Programm intern arbeitet, verrät der Vertrag **nicht**. Das ist Absicht: Solange der Vertrag
gleich bleibt, darf sich der Code dahinter komplett ändern.

> [!MERKSATZ]
> Eine API beschreibt das **Was** (Anfragen und Antworten), nicht das **Wie** (den Code dahinter).

## Bibliotheks-APIs: Verträge im selben Programm

Du hast schon viele APIs benutzt, ohne es zu merken. Jede [[funktion|Funktion]] einer
[[library|Bibliothek]] hat eine API: ihren Namen, ihre [[parameter|Parameter]] und ihren
[[rueckgabewert|Rückgabewert]].

```php
<?php
echo strtoupper('hallo');          // HALLO
echo json_encode(['id' => 2]);     // {"id":2}
```

```js
Math.max(3, 7)                    // 7
JSON.parse('{"id": 2}')           // { id: 2 }
```

Diese Aufrufe passieren **im selben Programm**, ohne Netzwerk. Die Dokumentation von PHP oder MDN ist
nichts anderes als die Beschreibung dieser Verträge.

## Web-APIs: Verträge über das Netzwerk

Eine [[web-api|Web-API]] funktioniert genauso – nur dass das andere Programm auf einem anderen Rechner
läuft. Statt eine Funktion aufzurufen, schickt dein Programm einen [[http-request|HTTP-Request]] an einen
[[server|Server]] und bekommt eine [[response|Response]] zurück, meist im Format [[json|JSON]].

```http title="Request"
GET /books/2 HTTP/1.1
Host: api.example.com
Accept: application/json
```

```http title="Response"
HTTP/1.1 200 OK
Content-Type: application/json

{"data": {"id": 2, "title": "Code im Morgengrauen", "year": 2021}}
```

Der [[client|Client]] (deine App, ein Skript, `curl`) fragt, der Server antwortet. Wer den Client
programmiert, muss nichts über die [[datenbank|Datenbank]] oder die [[programmiersprache]] des Servers
wissen – nur den Vertrag.

> [!FEHLER]
> „Die API ist die Datenbank.“ – Nein. Die API ist die **Tür** davor. Clients greifen nie direkt auf die
> Datenbank zu, sondern nur über die Regeln, die die API erlaubt.

## Wer nutzt Web-APIs – und warum?

Web-APIs sind überall, wo Programme über Grenzen hinweg zusammenarbeiten:

- **Frontend und Backend:** Eine React-App holt ihre Daten per API vom eigenen Server.
- **Mobile Apps:** Die App auf dem Handy und die Website nutzen dieselbe API.
- **Fremde Dienste:** Ein Shop spricht mit einem Zahlungsdienst, ein Formular mit einem Mail-Dienst.
- **Automatisierung:** Ein nächtliches Skript lädt Berichte herunter.

Der große Vorteil: Teams arbeiten unabhängig. Das App-Team und das Server-Team einigen sich auf den
Vertrag und können dann parallel bauen.

> [!PRAXIS]
> In Projekten wird der API-Vertrag oft zuerst geschrieben – noch bevor eine Zeile Code existiert. Frontend
> und Backend entwickeln dann gleichzeitig gegen diese Beschreibung. Wie man APIs dokumentiert, lernst du im
> Kurs „API-Dokumentation“.

## Zusammenfassung

- Eine **API** ist ein Vertrag zwischen Programmen: erlaubte Anfragen, nötige Eingaben, Antworten, Fehler.
- Sie beschreibt das **Was**, nicht das **Wie** – der Code dahinter darf sich ändern.
- **Bibliotheks-APIs** sind Funktionen im selben Programm, z. B. `strtoupper()` oder `JSON.parse()`.
- **Web-APIs** laufen über HTTP: Ein Client schickt einen Request, ein Server antwortet, meist mit JSON.
- Web-APIs trennen Teams und Systeme – solange der Vertrag stabil bleibt.
