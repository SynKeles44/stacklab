---
title: Der Network-Tab – Requests unter der Lupe
summary: Wie du im Network-Tab Requests filterst, Statuscodes und Header liest und mit dem Timing herausfindest, wo eine Seite Zeit verliert.
duration: 25
sources:
  - title: Chrome DevTools – Network features reference
    url: https://developer.chrome.com/docs/devtools/network/reference
  - title: MDN – HTTP response status codes
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status
  - title: MDN – HTTP headers
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers
quiz:
  - type: match
    question: Ordne jedem Statuscode seine Bedeutung zu.
    pairs:
      - { left: "200", right: "OK – alles hat geklappt" }
      - { left: "304", right: "Nicht geändert – der Browser nutzt seine gespeicherte Kopie" }
      - { left: "404", right: "Unter dieser Adresse gibt es nichts" }
      - { left: "422", right: "Anfrage verstanden, aber die Daten sind ungültig" }
      - { left: "500", right: "Fehler im Server-Code" }
    explanation: >
      Die erste Ziffer verrät die Klasse: 2xx Erfolg, 3xx Umleitung oder Cache, 4xx Fehler auf Client-Seite,
      5xx Fehler auf Server-Seite.
  - type: single
    question: "Eine API-Anfrage antwortet mit Status 500. Wo suchst du die Ursache zuerst?"
    options:
      - Im CSS der Seite.
      - Im Server-Code und in den Server-Logs – der Server ist bei der Verarbeitung gescheitert.
      - In den Browser-Einstellungen.
      - Bei der Internetverbindung.
    answer: 1
    explanation: >
      5xx bedeutet: Die Anfrage kam an, aber der Server hat einen Fehler. Die Antwort im Response-Tab und die
      Logdatei des Servers verraten meist mehr.
  - type: multiple
    question: Welche Einstellungen im Network-Tab helfen beim Debuggen?
    options:
      - "**Preserve log**, damit die Liste bei Weiterleitungen und Neuladen erhalten bleibt."
      - "**Disable cache**, damit der Browser alles frisch lädt, solange die DevTools offen sind."
      - Der Filter **Fetch/XHR**, um nur API-Anfragen aus JavaScript zu sehen.
      - "**Delete server**, um den Server neu zu starten."
    answers: [0, 1, 2]
    explanation: >
      Die drei Einstellungen gibt es wirklich. Den Server kann der Browser natürlich nicht steuern.
  - type: cloze
    text: Im Timing eines Requests heißt die Phase, in der der Browser auf das erste Byte der Antwort wartet, „Waiting for server ___“. Mit dem Filter `status-code:___` zeigst du nur Anfragen mit Serverfehler 500.
    blanks:
      - [response]
      - ["500"]
    explanation: >
      Ist „Waiting for server response“ lang, rechnet der Server zu lange. Der Filter `status-code:500` blendet
      alle anderen Requests aus.
tasks:
  - id: request-nachbauen
    type: request
    title: Den kaputten Request korrekt nachbauen
    description: |
      Im Network-Tab siehst du, dass der Klick auf **In den Warenkorb** diesen Request auslöst:

      ```text
      Request URL:    https://api.example.com/warenkorb?produkt=42&menge=2
      Request Method: GET
      Status Code:    405 Method Not Allowed
      ```

      In der API-Dokumentation steht: Artikel legst du mit `POST /warenkorb` an. Der Body ist JSON mit den
      Feldern `produkt_id` und `menge`, und der Header `Content-Type: application/json` ist Pflicht.

      Baue den Request so, wie das Frontend ihn hätte schicken sollen – für Produkt 42 in der Menge 2.
    base_url: https://api.example.com
    expected:
      method: POST
      path: "^/warenkorb$"
      headers: { Content-Type: "application/json" }
      body_contains: ['"produkt_id"', '"menge"']
    response:
      status: 201
      body: '{"warenkorb_id": 7, "positionen": [{"produkt_id": 42, "menge": 2}]}'
    hints:
      - Methode POST statt GET, und die Daten gehören in den Body statt in die URL.
      - 'Der Body könnte so aussehen: {"produkt_id": 42, "menge": 2}'
  - id: leere-produktliste
    type: steps
    title: Warum ist die Produktliste leer?
    description: Die Produktseite eines Shops zeigt keine Produkte. Untersuche das Problem Schritt für Schritt mit dem Network-Tab.
    steps:
      - situation: Du öffnest die DevTools, wechselst zum Network-Tab und lädst die Seite neu. Die Liste zeigt über 40 Einträge – Bilder, Schriften, CSS.
        question: Wie findest du am schnellsten den Request, der die Produkte lädt?
        options:
          - Alle 40 Einträge nacheinander anklicken.
          - Den Filter **Fetch/XHR** wählen oder `produkte` ins Filterfeld tippen.
          - Die Seite schließen und neu öffnen.
        answer: 1
        explanation: API-Anfragen aus JavaScript laufen über fetch oder XHR. Der Filter blendet alles andere aus.
      - situation: "Übrig bleibt `GET /api/produkte?kategorie=Schuhe` mit Status `200`. Im Tab **Response** steht `{\"daten\": []}`."
        question: Was schließt du daraus?
        options:
          - Der Server ist abgestürzt.
          - Der Request hat technisch geklappt, aber der Server hat für diese Anfrage keine Produkte gefunden.
          - Das CSS versteckt die Produkte.
        answer: 1
        explanation: 200 mit leerem Array heißt nicht „kaputt“, sondern „nichts gefunden“. Jetzt lohnt sich ein Blick auf die Parameter.
      - situation: Unter **Payload** siehst du den Query-Parameter `kategorie=Schuhe`. In der Datenbank heißt die Kategorie aber `schuhe` – kleingeschrieben.
        question: Welche Hypothese prüfst du als Nächstes?
        options:
          - Das Frontend schickt die Kategorie mit großem Anfangsbuchstaben, und der Server vergleicht Groß-/Kleinschreibung genau.
          - Der Browser-Cache ist schuld.
          - Die Internetverbindung ist zu langsam.
        answer: 0
        explanation: >
          Eine konkrete, prüfbare Hypothese. Zum Prüfen kopierst du den Request per Rechtsklick → **Copy as cURL**,
          änderst `Schuhe` zu `schuhe` und schickst ihn im Terminal erneut ab.
---
Viele Fehler in Webanwendungen sind gar keine Fehler im JavaScript, sondern in der **Kommunikation**: Das
Frontend fragt die falsche Adresse an, schickt falsche Daten, oder der Server antwortet mit einem Fehler.
Ohne Hilfsmittel siehst du davon nichts. Der Network-Tab zeigt dir **jeden** [[http-request|Request]], den die
Seite verschickt – und die Antwort darauf.

## Die Request-Liste

Öffne den Network-Tab, **bevor** du die Seite lädst oder die Aktion auslöst. Er zeichnet nur auf, solange er
offen ist. Jede Zeile ist ein Request:

| Spalte | Bedeutung |
|---|---|
| Name | Pfad bzw. Dateiname der angefragten Ressource |
| Status | HTTP-Statuscode der Antwort |
| Type | Art: `document`, `script`, `fetch`, `xhr`, `png` … |
| Initiator | Wer den Request ausgelöst hat – oft mit Link zur Codezeile |
| Size | Größe der Antwort, oder „(disk cache)“ |
| Time / Waterfall | Dauer und zeitliche Einordnung |

Fehlerhafte Requests mit Status 4xx oder 5xx färbt Chrome rot. Die Spalte **Initiator** ist beim Debuggen Gold
wert: Sie verrät, welche Zeile JavaScript den Request abgeschickt hat.

## Statuscodes lesen

Der [[statuscode|Statuscode]] ist die kürzeste Zusammenfassung einer Antwort. Die erste Ziffer verrät,
wer „schuld“ ist:

| Klasse | Bedeutung | Typische Codes |
|---|---|---|
| 2xx | Erfolg | `200 OK`, `201 Created`, `204 No Content` |
| 3xx | Umleitung oder Cache | `301`, `302`, `304 Not Modified` |
| 4xx | Problem mit der Anfrage | `400`, `401`, `403`, `404`, `405`, `422` |
| 5xx | Problem im Server | `500`, `502`, `503`, `504` |

Bei 4xx schaust du zuerst, **was das Frontend geschickt hat**: Adresse, Methode, Daten, Login. Bei 5xx liegt
der Fehler im Server – dann helfen die Antwort selbst und die Logdatei des Servers weiter.

> [!MERKSATZ]
> Status 200 heißt nur „technisch geklappt“, nicht „richtig“. Eine leere Liste oder falsche Daten mit Status
> 200 sind ein **logischer** Fehler – dann prüfst du die gesendeten Parameter.

## Einen Request im Detail

Ein Klick auf einen Request öffnet seine Details in mehreren Reitern:

- **Headers:** oben die Grunddaten (URL, Methode, Status), darunter die [[http-header|Header]] von Antwort
  und Anfrage – etwa `Content-Type`, `Authorization` oder `Set-Cookie`.
- **Payload:** die gesendeten Daten – Query-Parameter aus der URL und der Body bei POST.
- **Preview:** die Antwort hübsch aufbereitet, etwa [[json|JSON]] als aufklappbarer Baum.
- **Response:** die Antwort als roher Text. Bei Serverfehlern steht hier oft die eigentliche Meldung.
- **Timing:** wie lange die einzelnen Phasen gedauert haben.

> [!FEHLER]
> **Nur auf den Statuscode schauen.** Ein `422` sagt dir nur „ungültige Daten“. *Welches* Feld ungültig ist,
> steht fast immer in der Antwort unter Preview oder Response, zum Beispiel
> `{"errors": {"email": ["Pflichtfeld"]}}`. Lies die Antwort, bevor du rätst.

## Filtern und wichtige Einstellungen

Auf einer echten Seite siehst du schnell hundert Requests. Diese Werkzeuge schaffen Ordnung:

| Werkzeug | Wirkung |
|---|---|
| Typ-Filter **Fetch/XHR** | Nur Anfragen aus JavaScript – meist deine API-Aufrufe |
| Textfeld | Filtert nach Teilen der URL, z. B. `api/produkte` |
| `status-code:500` | Nur Requests mit diesem Statuscode |
| `-bild` | Minus schließt Treffer aus |
| **Preserve log** | Liste bleibt bei Neuladen und Weiterleitung erhalten |
| **Disable cache** | Lädt alles frisch, solange die DevTools offen sind |
| Throttling | Simuliert eine langsame Verbindung, z. B. „Slow 4G“ |

Per Rechtsklick auf einen Request → **Copy** → **Copy as cURL** bekommst du einen [[curl|curl]]-Befehl fürs Terminal, der genau
diesen Request wiederholt. Damit kannst du einen Request ändern und erneut schicken, ohne die Seite anzufassen.

## Timing: Wo geht die Zeit verloren?

Langsame Seiten sind auch ein Bug. Der Reiter **Timing** zerlegt die [[latenz|Latenz]] eines Requests in Phasen:

| Phase | Was passiert |
|---|---|
| Queueing / Stalled | Request wartet im Browser, z. B. auf eine freie Verbindung |
| DNS Lookup, Initial connection, SSL | Verbindung zum Server aufbauen |
| Request sent | Anfrage wird verschickt |
| Waiting for server response | Server rechnet – bis das erste Byte zurückkommt |
| Content Download | Antwort wird übertragen |

Ist **Waiting for server response** lang, liegt das Problem im Server, etwa bei einer langsamen
Datenbankabfrage. Ist **Content Download** lang, ist die Antwort zu groß – ein Bild mit mehreren Megabyte oder
eine API, die tausende Datensätze auf einmal liefert.

> [!PRAXIS]
> Bei einem Fehlerbericht zwischen Frontend und Backend klärt der Network-Tab den Streit „Wessen Fehler ist
> das?“ in Sekunden: Schickt das Frontend die richtigen Daten und antwortet der Server falsch, liegt es am
> Backend – und umgekehrt. Hänge an Tickets die URL, Methode, Statuscode und die Antwort an.

## Zusammenfassung

- Öffne den Network-Tab vor der Aktion – er zeichnet nur auf, solange er offen ist.
- Statuscodes: 2xx Erfolg, 3xx Umleitung/Cache, 4xx Fehler in der Anfrage, 5xx Fehler im Server.
- Headers, Payload, Preview und Response zeigen, was wirklich gesendet und empfangen wurde.
- Lies bei Fehlern die Antwort – dort steht meist die genaue Meldung.
- Filter wie Fetch/XHR und `status-code:500` sowie „Preserve log“ und „Disable cache“ sparen Zeit.
- Das Timing zeigt, ob der Server rechnet oder die Übertragung zu groß ist.
