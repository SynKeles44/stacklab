---
title: Die Anatomie einer HTTP-Nachricht
summary: Anfragezeile, Statuszeile, Header, Leerzeile und Body – jeder Teil einer HTTP-Nachricht und seine Aufgabe.
duration: 20
sources:
  - title: MDN – HTTP messages
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Messages
  - title: RFC 9112 – HTTP/1.1, Abschnitt Message Format
    url: https://www.rfc-editor.org/rfc/rfc9112#name-message-format
  - title: MDN – Content-Type
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Type
quiz:
  - type: single
    question: Woran erkennt der Empfänger, wo die Header enden und der Body beginnt?
    options:
      - Am Wort „Body“
      - An einer leeren Zeile
      - Am Header Content-Type
      - An einem Semikolon
    answer: 1
    explanation: Nach dem letzten Header folgt eine Zeile ohne Inhalt (nur `\r\n`). Alles danach ist der Body.
  - type: match
    question: Ordne jedem Teil der Anfragezeile `GET /suche?q=http HTTP/1.1` seine Rolle zu.
    pairs:
      - { left: "GET", right: "Methode – was getan werden soll" }
      - { left: "/suche?q=http", right: "Ziel – Pfad und Query-String" }
      - { left: "HTTP/1.1", right: "Protokollversion" }
    explanation: Die Anfragezeile hat immer drei Teile, getrennt durch je ein Leerzeichen.
  - type: find-bug
    question: Diese Anfrage wird vom Server mit 400 abgelehnt. In welcher Zeile steckt der Fehler?
    language: http
    code: |
      POST /notizen HTTP/1.1
      Content-Type: application/json
      Content-Length: 22

      {"titel": "Einkaufen"}
    bug_line: 1
    explanation: >
      Es fehlt der Header `Host`. In HTTP/1.1 ist er Pflicht – ohne ihn weiß ein Server mit mehreren
      Websites nicht, welche gemeint ist. Er gehört direkt unter die Anfragezeile.
  - type: multiple
    question: Welche Aussagen über Header stimmen?
    options:
      - "`content-type` und `Content-Type` meinen denselben Header."
      - Ein Header besteht aus Name, Doppelpunkt und Wert.
      - Header stehen nach dem Body.
      - "`Content-Length` gibt die Größe des Bodys in Bytes an."
    answers: [0, 1, 3]
    explanation: Header-Namen sind unabhängig von Groß- und Kleinschreibung, stehen vor der Leerzeile und beschreiben die Nachricht.
  - type: cloze
    text: "Die erste Zeile einer Antwort heißt ___. Sie enthält Version, ___ und einen kurzen Text wie OK."
    blanks:
      - [Statuszeile, Status-Zeile, Status Line]
      - [Statuscode, Status-Code, Status]
    explanation: "`HTTP/1.1 404 Not Found` – Version, Statuscode, Begründungstext."
tasks:
  - id: nachricht-beschriften
    type: diagram
    title: Beschrifte die Teile einer HTTP-Nachricht
    description: Links siehst du eine Anfrage, rechts die Antwort. Ziehe die Begriffe an die gestrichelten Stellen.
    image: /assets/http-https/http-nachricht-leer.svg
    slots:
      - { x: 41.1, y: 26.7, answer: Anfragezeile }
      - { x: 41.1, y: 45.7, answer: Header }
      - { x: 41.1, y: 61.7, answer: Leerzeile }
      - { x: 41.1, y: 75, answer: Body }
      - { x: 88.9, y: 26.7, answer: Statuszeile }
    distractors: [Cookie, Port]
    hints:
      - Die rechte Seite ist schon fast beschriftet – die Teile heißen links genauso, bis auf die erste Zeile.
  - id: notiz-anlegen
    type: request
    title: Schicke eine Notiz als JSON
    description: |
      Die Notizen-API unter `https://api.example.com` legt neue Notizen an, wenn du sie an `/notizen`
      schickst. Baue die Anfrage:

      - Methode zum **Anlegen**
      - Pfad `/notizen`
      - Header `Content-Type` mit dem Wert `application/json`
      - Body: ein JSON-Objekt mit dem Feld `titel` (Wert z. B. `"Einkaufen"`)
    base_url: https://api.example.com
    expected:
      method: POST
      path: "^/notizen/?$"
      headers: { Content-Type: "^application/json" }
      body_contains: ['"titel"']
    response:
      status: 201
      body: '{"id": 7, "titel": "Einkaufen"}'
    hints:
      - Zum Anlegen nutzt man POST.
      - 'Der Body ist JSON: `{"titel": "Einkaufen"}` – Schlüssel in doppelten Anführungszeichen.'
    solution: |
      ```http
      POST /notizen HTTP/1.1
      Host: api.example.com
      Content-Type: application/json

      {"titel": "Einkaufen"}
      ```
---
Ein Brief hat immer denselben Aufbau: Adresse, Absender, Betreff, dann der Text. Wer ihn öffnet, weiß
sofort, wo was steht. Eine [[http-nachricht|HTTP-Nachricht]] funktioniert genauso – Anfrage und
Antwort folgen einem festen Schema. Kennst du es, liest du jede Unterhaltung im Klartext.

## Der Bauplan im Überblick

Jede HTTP/1.1-Nachricht besteht aus vier Teilen in fester Reihenfolge:

1. **Startzeile** – bei der Anfrage die [[request-zeile|Anfragezeile]], bei der Antwort die
   [[statuszeile|Statuszeile]]
2. **Header** – beliebig viele Zeilen `Name: Wert`
3. **Leerzeile** – sie trennt Kopf und Inhalt
4. **Body** – der eigentliche Inhalt, optional

![Aufbau einer HTTP-Anfrage und -Antwort](/assets/http-https/http-nachricht.svg)

Jede Zeile endet mit den zwei unsichtbaren Zeichen `\r\n` (Wagenrücklauf und Zeilenumbruch, kurz
CRLF). Genau das hast du in der letzten Lektion mit `printf` von Hand geschrieben.

> [!MERKSATZ]
> Startzeile, Header, Leerzeile, Body – diese Reihenfolge gilt für **jede** Anfrage und **jede** Antwort.

## Die Anfragezeile

Die erste Zeile einer Anfrage hat drei Teile, getrennt durch je ein Leerzeichen:

```http title="Anfragezeile"
GET /produkte?seite=2 HTTP/1.1
```

| Teil | Beispiel | Bedeutung |
|---|---|---|
| Methode | `GET` | Was soll passieren? Lesen, anlegen, löschen … |
| Ziel | `/produkte?seite=2` | Pfad plus [[query-string|Query-String]] |
| Version | `HTTP/1.1` | Welche HTTP-Version spricht der Client? |

Schema, Host und Port stehen **nicht** in dieser Zeile – die Verbindung zum richtigen Server besteht
ja schon. Den Hostnamen schickt der Client trotzdem mit, im [[host-header|Host-Header]]. Ein
[[webserver|Webserver]] mit vielen Websites auf einer IP-Adresse weiß nur so, welche gemeint ist.

> [!FEHLER]
> Fehlt `Host` in einer HTTP/1.1-Anfrage, muss der Server mit `400 Bad Request` antworten. curl und
> Browser setzen den Header automatisch – wer HTTP von Hand schreibt, vergisst ihn leicht.

## Die Statuszeile

Die Antwort beginnt mit der Statuszeile:

```http title="Statuszeile"
HTTP/1.1 404 Not Found
```

Sie enthält die Version, den dreistelligen [[statuscode|Statuscode]] und einen kurzen Text für
Menschen. Programme werten nur die Zahl aus – der Text ist Beiwerk und darf sogar fehlen.

Die erste Ziffer verrät die Klasse: `2xx` Erfolg, `3xx` Umleitung, `4xx` Fehler des Clients,
`5xx` Fehler des Servers. Die wichtigen Codes lernst du in Modul 2 genau kennen.

## Header: Zusatzangaben zur Nachricht

[[http-header|Header]] beschreiben die Nachricht. Jeder Header ist eine Zeile `Name: Wert`. Die Namen
sind unabhängig von Groß- und Kleinschreibung: `content-type` ist dasselbe wie `Content-Type`.

| Header | Steht in | Bedeutung |
|---|---|---|
| `Host` | Anfrage | Welche Website ist gemeint? |
| `User-Agent` | Anfrage | Welches Programm fragt? |
| `Accept` | Anfrage | Welche Formate versteht der Client? |
| `Content-Type` | beide | Welches Format hat der Body? |
| `Content-Length` | beide | Wie viele Bytes hat der Body? |
| `Date` | Antwort | Wann wurde die Antwort erzeugt? |

Der [[user-agent|User-Agent]] verrät zum Beispiel `curl/8.14.1` oder eine lange Browser-Kennung.
Die wichtigsten Header vertiefst du in Modul 3.

## Der Body und sein Format

Der [[http-body|Body]] trägt den Inhalt: HTML, ein Bild, [[json|JSON]] oder Formulardaten. Damit der
Empfänger ihn richtig liest, sagt der Header [[content-type|Content-Type]], welches Format er hat. Der
Wert ist ein [[mime-typ|MIME-Typ]]:

| MIME-Typ | Inhalt |
|---|---|
| `text/html; charset=UTF-8` | HTML-Seite |
| `application/json` | JSON-Daten |
| `application/x-www-form-urlencoded` | Klassisches HTML-Formular |
| `image/png` | PNG-Bild |

`Content-Length` sagt, wie viele Bytes kommen. So weiß der Empfänger, wann die Nachricht zu Ende ist.
Viele Anfragen, etwa `GET`, haben gar keinen Body.

> [!PRAXIS]
> Ein Klassiker bei API-Fehlern: Der Client schickt JSON, setzt aber keinen `Content-Type`. Der Server
> hält den Body dann für Formulardaten und meldet „Feld titel fehlt“. Der Blick auf die rohe Anfrage
> klärt das in Sekunden.

## Zusammenfassung

- Jede Nachricht: Startzeile, Header, Leerzeile, Body – Zeilen enden mit `\r\n`.
- Anfragezeile = Methode, Ziel (Pfad + Query-String), Version.
- Statuszeile = Version, Statuscode, kurzer Text.
- Header sind `Name: Wert`, die Namen sind unabhängig von Groß- und Kleinschreibung.
- `Host` ist in HTTP/1.1 Pflicht.
- `Content-Type` nennt das Format des Bodys als MIME-Typ, `Content-Length` seine Größe.
