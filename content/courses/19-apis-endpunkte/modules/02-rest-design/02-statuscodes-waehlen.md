---
title: Statuscodes richtig wählen
summary: Welche Statuscodes eine API für Erfolg und Fehler zurückgibt – von 200, 201 und 204 bis 401, 403, 404, 409, 422 und 500.
duration: 20
sources:
  - title: RFC 9110 – HTTP Semantics, Abschnitt 15 Status Codes
    url: https://www.rfc-editor.org/rfc/rfc9110#section-15
  - title: MDN – HTTP response status codes
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status
  - title: MDN – Location
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Location
quiz:
  - type: match
    question: Ordne jeder Situation den passenden Statuscode zu.
    pairs:
      - { left: "Buch erfolgreich angelegt", right: "201 Created" }
      - { left: "Buch gelöscht, kein Inhalt in der Antwort", right: "204 No Content" }
      - { left: "Das Feld title fehlt im Body", right: "422 Unprocessable Content" }
      - { left: "Kein oder ungültiges Token", right: "401 Unauthorized" }
      - { left: "Ungefangene Exception im Controller", right: "500 Internal Server Error" }
    explanation: Statuscodes sind für Programme gemacht – ein Client entscheidet allein anhand der Zahl, wie es weitergeht.
  - type: single
    question: Ein angemeldeter Nutzer möchte die Bestellung einer anderen Person ändern. Was antwortet die API?
    options: ["401 Unauthorized", "403 Forbidden", "404 Not Found", "200 OK mit Fehlermeldung"]
    answer: 1
    explanation: >
      Der Nutzer ist angemeldet (also nicht 401), darf diese Aktion aber nicht ausführen – das ist 403. Manche
      APIs antworten bewusst mit 404, damit Fremde nicht einmal erfahren, dass die Bestellung existiert.
  - type: cloze
    text: "Nach `POST /books` antwortet die API mit `201 Created` und nennt die Adresse des neuen Buchs im Header ___."
    blanks:
      - [Location]
    explanation: "Zum Beispiel `Location: /books/7`. So weiß der Client sofort, wo er die neue Ressource findet."
  - type: find-bug
    question: In welcher Zeile wählt dieser Controller einen falschen Statuscode?
    language: php
    code: |
      function show(int $id): array
      {
          $book = findBook($id);
          if ($book === null) {
              return ['status' => 200, 'body' => ['error' => 'not found']];
          }
          return ['status' => 200, 'body' => ['data' => $book]];
      }
    bug_line: 5
    explanation: >
      Ein Fehler mit Status 200 ist das häufigste Anti-Muster. Clients, Monitoring und Caches halten die
      Antwort für einen Erfolg. Richtig ist 404 Not Found.
tasks:
  - id: status-entscheiden
    type: steps
    title: Welcher Statuscode passt?
    description: Du programmierst die Buch-API. Entscheide in jeder Situation, was der Server antwortet.
    steps:
      - situation: "`POST /books` mit gültigem Body. Das Buch wird gespeichert und bekommt die ID 7."
        question: Was antwortest du?
        options: ["200 OK", "201 Created mit Location: /books/7", "204 No Content"]
        answer: 1
        explanation: 201 meldet „neue Ressource angelegt“. Location zeigt, wo sie liegt; den Body mit dem Buch schickst du meist mit.
      - situation: "`POST /books` mit dem Body `{\"title\": \"Atlas\", \"year\": \"neulich\"}` – das Jahr ist keine Zahl."
        question: Was antwortest du?
        options: ["400 Bad Request", "422 Unprocessable Content", "500 Internal Server Error"]
        answer: 1
        explanation: >
          Das JSON ist technisch korrekt, aber inhaltlich ungültig – dafür steht 422. 400 nimmst du, wenn der
          Request gar nicht lesbar ist, z. B. bei kaputtem JSON.
      - situation: "`POST /books` mit dem Titel eines Buchs, das es mit derselben ISBN schon gibt."
        question: Was antwortest du?
        options: ["409 Conflict", "404 Not Found", "201 Created"]
        answer: 0
        explanation: 409 meldet einen Konflikt mit dem aktuellen Zustand der Ressource, z. B. ein Duplikat.
      - situation: "`DELETE /books/7` – das Buch wird gelöscht."
        question: Was antwortest du?
        options: ["200 OK mit dem gelöschten Buch", "204 No Content", "Beides ist üblich und erlaubt"]
        answer: 2
        explanation: Am häufigsten ist 204 ohne Body. 200 mit Inhalt ist ebenfalls korrekt – wichtig ist, dass deine API es einheitlich macht.
      - situation: "`PUT /books` – auf der Sammlung gibt es aber nur GET und POST."
        question: Was antwortest du?
        options: ["404 Not Found", "405 Method Not Allowed mit Allow-Header", "403 Forbidden"]
        answer: 1
        explanation: "Der Pfad existiert, nur die Methode nicht. 405 plus `Allow: GET, POST` sagt dem Client, was erlaubt ist."
  - id: buch-loeschen
    type: request
    title: Lösche ein Buch
    description: |
      Das Buch mit der ID 6 soll aus der Buch-API unter `https://api.example.com` verschwinden. Die API
      verlangt für schreibende Requests ein Token im Header `Authorization` im Format `Bearer <token>`.
      Dein Test-Token lautet `test-token`.
    base_url: https://api.example.com
    expected:
      method: DELETE
      path: "^/books/6/?$"
      headers: { Authorization: "^Bearer\\s+test-token$" }
    response:
      status: 204
      body: ""
    hints:
      - Löschen ist eine eigene HTTP-Methode – kein Body, keine Verben im Pfad.
      - "Header-Name `Authorization`, Wert `Bearer test-token`."
    solution: |
      ```http
      DELETE /books/6 HTTP/1.1
      Host: api.example.com
      Authorization: Bearer test-token
      ```
---
Ein Client schickt einen Request und bekommt eine Antwort. Bevor er auch nur eine Zeile JSON liest, will
er wissen: Hat es geklappt? Und wenn nicht – liegt es an mir oder am Server? Genau diese Frage beantwortet
der **Statuscode**. Wählt die API ihn falsch, reagieren alle Clients falsch.

## Die fünf Klassen

Ein [[statuscode|Statuscode]] ist dreistellig, die erste Ziffer verrät die Klasse:

| Klasse | Bedeutung | Wer muss handeln? |
|---|---|---|
| 1xx | Information, Verbindung läuft weiter | niemand (selten sichtbar) |
| 2xx | Erfolg | niemand |
| 3xx | Umleitung | der Client folgt einer anderen URL |
| 4xx | Fehler des Clients | der Client muss seinen Request ändern |
| 5xx | Fehler des Servers | der Server (bzw. sein Team) |

Die Unterscheidung 4xx/5xx ist für den Betrieb wichtig: Viele 5xx-Antworten wecken nachts jemanden auf,
4xx-Antworten sind meist normale Fehleingaben.

## Erfolg: 200, 201, 204

| Code | Wann | Body |
|---|---|---|
| `200 OK` | GET, PATCH, PUT erfolgreich | die Ressource |
| `201 Created` | POST hat etwas angelegt | meist die neue Ressource |
| `204 No Content` | Erfolg ohne Inhalt, typisch bei DELETE | leer |

Nach `201 Created` nennt der Header `Location` die Adresse der neuen Ressource ([[location-header]]):

```http title="Antwort auf POST /books"
HTTP/1.1 201 Created
Location: /books/7
Content-Type: application/json

{"data": {"id": 7, "title": "Die Kunst der Pause"}}
```

## Client-Fehler: 400 bis 429

| Code | Bedeutung | Beispiel |
|---|---|---|
| `400 Bad Request` | Request ist kaputt | ungültiges JSON, unbekannter Parameter |
| `401 Unauthorized` | nicht angemeldet | Token fehlt oder ist abgelaufen |
| `403 Forbidden` | angemeldet, aber nicht berechtigt | fremde Bestellung ändern |
| `404 Not Found` | Ressource gibt es nicht | `/books/42` |
| `405 Method Not Allowed` | Methode hier nicht erlaubt | `PUT /books` |
| `409 Conflict` | Konflikt mit dem aktuellen Zustand | Duplikat, veraltete Version |
| `415 Unsupported Media Type` | Body-Format falsch | Formulardaten statt JSON |
| `422 Unprocessable Content` | Inhalt ungültig | Pflichtfeld fehlt |
| `429 Too Many Requests` | zu viele Requests | Rate Limit erreicht |

> [!MERKSATZ]
> **401** heißt „Wer bist du?“, **403** heißt „Ich weiß, wer du bist – aber das darfst du nicht.“

## Server-Fehler: 500 und 503

- `500 Internal Server Error`: Im Code ist etwas schiefgegangen, z. B. eine ungefangene [[exception]].
- `503 Service Unavailable`: Der Dienst ist vorübergehend nicht erreichbar, etwa wegen Wartung.

Eine 500er-Antwort darf **nie** interne Details enthalten – keinen [[stack-trace|Stack-Trace]], keine
SQL-Abfrage, keine Dateipfade. Das hilft nur Angreifern. Details gehören ins Log.

> [!FEHLER]
> `200 OK` mit `{"error": "not found"}` im Body. Für den Client, für Caches und für das Monitoring sieht
> das wie ein Erfolg aus. Fehler brauchen einen Fehler-Statuscode.

## So entscheidest du

Gehe die Fragen der Reihe nach durch – die erste passende Antwort gewinnt:

1. Ist der Request lesbar (gültiges JSON, richtiger Content-Type)? Sonst **400** bzw. **415**.
2. Ist der Client angemeldet? Sonst **401**.
3. Darf er das? Sonst **403**.
4. Gibt es die Ressource? Sonst **404**.
5. Sind die Daten gültig? Sonst **422**.
6. Passt es zum aktuellen Zustand? Sonst **409**.
7. Erfolg: **201** beim Anlegen, **204** ohne Inhalt, sonst **200**.

> [!PRAXIS]
> Frameworks nehmen dir viel ab: Laravel antwortet bei fehlgeschlagener Validierung automatisch mit 422 und
> bei fehlender Anmeldung mit 401. Du musst die Codes trotzdem kennen, um Antworten zu verstehen und eigene
> Fälle richtig zu behandeln.

## Zusammenfassung

- Die erste Ziffer zählt: **2xx** Erfolg, **4xx** Client-Fehler, **5xx** Server-Fehler.
- **201** plus `Location` nach dem Anlegen, **204** ohne Body nach dem Löschen.
- **401** = nicht angemeldet, **403** = nicht berechtigt, **404** = gibt es nicht.
- **422** für inhaltlich ungültige Daten, **400** für kaputte Requests, **409** für Konflikte.
- Nie `200` mit Fehlermeldung, nie interne Details in `500`-Antworten.
