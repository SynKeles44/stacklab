---
title: HTTP-Methoden und ihre Versprechen
summary: GET, POST, PUT, PATCH, DELETE, HEAD und OPTIONS – was sie bedeuten und was „sicher“ und „idempotent“ garantieren.
duration: 20
sources:
  - title: MDN – HTTP request methods
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods
  - title: RFC 9110 – Abschnitt 9, Methods
    url: https://www.rfc-editor.org/rfc/rfc9110#name-methods
  - title: MDN – Idempotent (Glossar)
    url: https://developer.mozilla.org/en-US/docs/Glossary/Idempotent
  - title: RFC 5789 – PATCH Method for HTTP
    url: https://www.rfc-editor.org/rfc/rfc5789
quiz:
  - type: single
    question: Was bedeutet „idempotent“?
    options:
      - Die Anfrage verändert auf dem Server nie etwas.
      - Die Anfrage einmal oder zehnmal hintereinander zu schicken, hinterlässt auf dem Server denselben Zustand.
      - Die Anfrage ist verschlüsselt.
      - Die Antwort darf zwischengespeichert werden.
    answer: 1
    explanation: >
      Idempotent heißt: Wiederholen schadet nicht. `DELETE /notizen/3` zweimal – danach ist Notiz 3 genauso
      weg wie nach dem ersten Mal. Verändern darf eine idempotente Anfrage trotzdem etwas.
  - type: multiple
    question: Welche Methoden sind sicher (lesen nur, ändern nichts)?
    options: [GET, POST, HEAD, DELETE, OPTIONS, PUT]
    answers: [0, 2, 4]
    explanation: GET, HEAD und OPTIONS lesen nur. Alle sicheren Methoden sind automatisch auch idempotent.
  - type: match
    question: Ordne jeder Aufgabe die passende Methode zu.
    pairs:
      - { left: "Eine neue Bestellung anlegen", right: "POST" }
      - { left: "Nur die E-Mail-Adresse eines Nutzers ändern", right: "PATCH" }
      - { left: "Ein Profil komplett durch eine neue Fassung ersetzen", right: "PUT" }
      - { left: "Prüfen, wie groß eine Datei ist, ohne sie zu laden", right: "HEAD" }
      - { left: "Ein Foto entfernen", right: "DELETE" }
    explanation: PATCH ändert einzelne Felder, PUT ersetzt die ganze Ressource. HEAD liefert nur die Header.
  - type: find-bug
    question: Diese Route einer Web-App verursacht Ärger, weil Suchmaschinen-Crawler allen Links folgen. Welche Zeile ist das Problem?
    language: http
    code: |
      GET /produkte HTTP/1.1
      GET /produkte/42 HTTP/1.1
      GET /produkte/42/loeschen HTTP/1.1
      POST /produkte HTTP/1.1
    bug_line: 3
    explanation: >
      Löschen per GET verletzt das Versprechen „GET ist sicher“. Crawler, Vorschau-Dienste oder ein
      Prefetch des Browsers lösen den Link aus – und löschen Produkte. Richtig wäre `DELETE /produkte/42`.
tasks:
  - id: methoden-eigenschaften
    type: dragdrop
    title: Sortiere die Methoden nach ihren Garantien
    description: Ordne jede Methode der Gruppe zu, deren Versprechen sie laut HTTP-Standard gibt.
    targets:
      - { id: sicher, label: "Sicher und idempotent" }
      - { id: idempotent, label: "Nur idempotent" }
      - { id: keins, label: "Weder sicher noch garantiert idempotent" }
    items:
      - { label: GET, target: sicher }
      - { label: HEAD, target: sicher }
      - { label: OPTIONS, target: sicher }
      - { label: PUT, target: idempotent }
      - { label: DELETE, target: idempotent }
      - { label: POST, target: keins }
      - { label: PATCH, target: keins }
    hints:
      - Sicher heißt „nur lesen“. Idempotent heißt „Wiederholen schadet nicht“.
      - Zweimal POST legt zwei Datensätze an.
  - id: email-aendern
    type: request
    title: Ändere nur die E-Mail-Adresse
    description: |
      Die Nutzerin mit der ID `5` hat eine neue E-Mail-Adresse: `ada@example.com`. Alle anderen Felder
      (Name, Rolle, Sprache …) sollen unverändert bleiben. Die API liegt unter `https://api.example.com`,
      Nutzer findest du unter `/nutzer/{id}`, sie erwartet JSON.
    base_url: https://api.example.com
    expected:
      method: PATCH
      path: "^/nutzer/5/?$"
      headers: { Content-Type: "^application/json" }
      body_contains: ['"email"', 'ada@example.com']
    response:
      status: 200
      body: '{"id": 5, "name": "Ada", "email": "ada@example.com", "rolle": "admin"}'
    hints:
      - Du änderst nur einen Teil der Ressource – das ist kein PUT.
      - 'Body: `{"email": "ada@example.com"}`, Header `Content-Type: application/json`.'
    solution: |
      ```http
      PATCH /nutzer/5 HTTP/1.1
      Host: api.example.com
      Content-Type: application/json

      {"email": "ada@example.com"}
      ```
---
Du klickst im Online-Shop zweimal auf „Jetzt kaufen“, weil die Seite hängt. Hast du jetzt zwei
Bestellungen? Und warum darf ein Browser ein Formular nicht einfach erneut abschicken, eine normale
Seite aber jederzeit neu laden? Die Antwort steckt in der [[http-methode|Methode]] – dem ersten Wort
jeder Anfrage.

## Die Methode sagt, was passieren soll

Die URL nennt die [[ressource|Ressource]], die Methode die Absicht. Dieselbe URL kann je nach Methode
etwas völlig anderes bewirken:

| Methode | Bedeutung | Beispiel |
|---|---|---|
| `GET` | Ressource lesen | `GET /notizen/7` |
| `HEAD` | Wie GET, aber nur die Header | `HEAD /video.mp4` |
| `POST` | Daten zur Verarbeitung schicken, meist: Neues anlegen | `POST /notizen` |
| `PUT` | Ressource komplett ersetzen (oder unter dieser URL anlegen) | `PUT /notizen/7` |
| `PATCH` | Ressource teilweise ändern | `PATCH /notizen/7` |
| `DELETE` | Ressource löschen | `DELETE /notizen/7` |
| `OPTIONS` | Fragen, was erlaubt ist | `OPTIONS /notizen` |

Für Datensätze ergibt sich ein festes Muster, oft [[crud|CRUD]] genannt (Create, Read, Update, Delete):
[[http-post|POST]] legt an, [[http-get|GET]] liest, [[http-put|PUT]] und [[http-patch|PATCH]] ändern,
[[http-delete|DELETE]] löscht. Dazu kommen [[http-head|HEAD]] und [[http-options|OPTIONS]], die nur
Auskunft geben.

## Sicher: nur lesen

Eine [[sichere-methode|sichere Methode]] verspricht: „Ich ändere nichts.“ Das gilt für `GET`, `HEAD`
und `OPTIONS`.

Auf dieses Versprechen verlassen sich viele Programme. Browser laden Links manchmal vorab, Crawler
von Suchmaschinen folgen jedem Link, Vorschau-Dienste in Chats rufen URLs auf. All das ist harmlos –
solange `GET` wirklich nur liest.

> [!FEHLER]
> Ein Link wie `<a href="/konto/loeschen">` wird per `GET` aufgerufen. Klickt ein Crawler darauf, ist
> das Konto weg. Alles, was Daten ändert, gehört in `POST`, `PUT`, `PATCH` oder `DELETE`.

Natürlich darf der Server bei einem `GET` eine Zugriffszahl ins Log schreiben. „Sicher“ meint: Der
Client hat **nichts angefordert**, was sich ändern soll.

## Idempotent: Wiederholen schadet nicht

[[idempotenz|Idempotent]] heißt: Eine Anfrage einmal oder mehrmals zu schicken, führt zum selben
Zustand auf dem Server.

- `DELETE /notizen/3` – nach dem ersten Mal ist die Notiz weg, danach bleibt sie weg.
- `PUT /notizen/3` mit demselben Inhalt – das Ergebnis ist immer dieselbe Notiz.
- `POST /bestellungen` – jedes Mal entsteht eine **neue** Bestellung. Nicht idempotent!

| Methode | sicher | idempotent |
|---|---|---|
| GET, HEAD, OPTIONS | ja | ja |
| PUT, DELETE | nein | ja |
| POST, PATCH | nein | nein (PATCH nur, wenn man es so baut) |

> [!MERKSATZ]
> Sicher = ändert nichts. Idempotent = Wiederholen schadet nicht. Jede sichere Methode ist auch idempotent.

Warum das zählt: Bricht die Verbindung ab, darf ein Client eine idempotente Anfrage einfach erneut
senden. Bei `POST` fragt der Browser deshalb „Formular erneut senden?“.

## PUT oder PATCH?

Beide ändern eine bestehende Ressource – aber unterschiedlich viel:

```http title="PUT ersetzt die ganze Ressource"
PUT /nutzer/5 HTTP/1.1
Content-Type: application/json

{"name": "Ada", "email": "ada@example.com", "rolle": "admin"}
```

```http title="PATCH ändert nur, was drinsteht"
PATCH /nutzer/5 HTTP/1.1
Content-Type: application/json

{"email": "ada@example.com"}
```

Fehlt bei `PUT` ein Feld, setzt der Server es zurück oder lehnt die Anfrage ab. Bei `PATCH` bleiben
fehlende Felder unverändert. Deshalb ist `PATCH` meist die bessere Wahl für Formulare, die nur einen
Teil bearbeiten.

## HEAD und OPTIONS

`HEAD` liefert exakt die Header, die ein `GET` liefern würde – ohne Body. Praktisch, um Größe oder
Änderungsdatum einer großen Datei zu prüfen: `curl -I` nutzt genau das.

`OPTIONS` fragt: „Was darf ich hier?“ Der Server antwortet mit dem Header `Allow`:

```http title="Antwort auf OPTIONS /notizen"
HTTP/1.1 204 No Content
Allow: GET, POST, OPTIONS
```

Browser schicken `OPTIONS` automatisch als Vorab-Anfrage, bevor sie bestimmte Anfragen an eine fremde
Domain stellen. Das lernst du bei [[cors|CORS]] in Modul 3 kennen.

> [!PRAXIS]
> Zahlungsdienste lösen das POST-Problem mit einem Header wie `Idempotency-Key`: Der Client schickt
> eine eindeutige ID mit, und der Server führt dieselbe Zahlung bei einer Wiederholung nicht doppelt aus.

## Zusammenfassung

- Die Methode sagt, was mit der Ressource passieren soll; die URL sagt, welche Ressource.
- GET liest, POST legt an, PUT ersetzt, PATCH ändert teilweise, DELETE löscht.
- Sicher (GET, HEAD, OPTIONS) heißt: ändert nichts – nie Daten per GET ändern.
- Idempotent (zusätzlich PUT, DELETE) heißt: Wiederholen schadet nicht. POST ist es nicht.
- HEAD liefert nur Header, OPTIONS nennt im Header `Allow`, was erlaubt ist.
