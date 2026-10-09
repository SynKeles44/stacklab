---
title: REST – Ressourcen und Methoden
summary: Die REST-Prinzipien im Alltag – Substantive als Pfade, HTTP-Methoden als Verben, sichere und idempotente Methoden, Zustandslosigkeit.
duration: 25
sources:
  - title: RFC 9110 – HTTP Semantics, Abschnitt 9 Methods
    url: https://www.rfc-editor.org/rfc/rfc9110#section-9
  - title: RFC 5789 – PATCH Method for HTTP
    url: https://www.rfc-editor.org/rfc/rfc5789
  - title: MDN – HTTP request methods
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods
  - title: Roy Fielding – Architectural Styles (Kapitel 5, REST)
    url: https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm
quiz:
  - type: single
    question: Welcher Endpunkt folgt den REST-Konventionen, um ein neues Buch anzulegen?
    options:
      - "`GET /createBook?title=Atlas`"
      - "`POST /books` mit dem Buch als JSON im Body"
      - "`POST /books/create`"
      - "`PUT /newBook`"
    answer: 1
    explanation: >
      Der Pfad nennt die Ressource (Substantiv, Plural), die Methode das Verb. POST auf die Sammlung legt ein
      neues Element an. Verben im Pfad wie `create` sind doppelt gemoppelt.
  - type: multiple
    question: Welche Methoden sind idempotent – mehrfach ausgeführt also mit derselben Wirkung wie einmal?
    options: [GET, POST, PUT, DELETE]
    answers: [0, 2, 3]
    explanation: >
      GET verändert nichts, PUT setzt immer denselben Endzustand, und ein gelöschtes Buch bleibt gelöscht.
      POST legt bei jedem Aufruf ein weiteres Element an – nicht idempotent.
  - type: match
    question: Ordne jeder Aktion den passenden REST-Endpunkt zu.
    pairs:
      - { left: "Alle Bestellungen auflisten", right: "GET /orders" }
      - { left: "Bestellung 7 anzeigen", right: "GET /orders/7" }
      - { left: "Nur die Adresse von Bestellung 7 ändern", right: "PATCH /orders/7" }
      - { left: "Bestellung 7 stornieren (löschen)", right: "DELETE /orders/7" }
      - { left: "Positionen von Bestellung 7 auflisten", right: "GET /orders/7/items" }
    explanation: Sammlung, Element und verschachtelte Sammlung – mit Methoden als Verben reicht das für fast alle Fälle.
  - type: cloze
    text: "REST-APIs sind ___: Jeder Request bringt alles mit, was der Server zum Beantworten braucht – der Server merkt sich zwischen zwei Requests keinen Client-Zustand."
    blanks:
      - [zustandslos, stateless]
    explanation: Deshalb schickt der Client z. B. sein Token bei jedem Request mit, statt sich einmal „anzumelden“.
tasks:
  - id: buch-anlegen
    type: request
    title: Lege ein neues Buch an
    description: |
      Die Buch-API unter `https://api.example.com` soll ein neues Buch speichern:
      Titel „Die Kunst der Pause“, Genre `sachbuch`, Erscheinungsjahr 2025.

      Wähle Methode und Pfad nach REST, sag dem Server mit einem Header, dass du JSON schickst, und schreibe
      das Buch als JSON-Objekt mit den Feldern `title`, `genre` und `year` in den Body.
    base_url: https://api.example.com
    expected:
      method: POST
      path: "^/books/?$"
      headers: { Content-Type: "^application/json" }
      body_contains: ['"title"', '"genre"', '"year"', 'sachbuch']
    response:
      status: 201
      body: '{"data": {"id": 7, "title": "Die Kunst der Pause", "genre": "sachbuch", "year": 2025}}'
    hints:
      - Neue Elemente legst du mit POST auf der Sammlung an.
      - "Header-Name `Content-Type`, Wert `application/json`. Body z. B. `{\"title\": \"Die Kunst der Pause\", \"genre\": \"sachbuch\", \"year\": 2025}`"
    solution: |
      ```http
      POST /books HTTP/1.1
      Host: api.example.com
      Content-Type: application/json

      {"title": "Die Kunst der Pause", "genre": "sachbuch", "year": 2025}
      ```
  - id: jahr-korrigieren
    type: request
    title: Korrigiere nur das Jahr
    description: |
      Beim Buch mit der ID 3 ist das Erscheinungsjahr falsch – richtig ist 2016. Alle anderen Felder sollen
      unverändert bleiben. Schicke **nur** die Änderung.
    base_url: https://api.example.com
    expected:
      method: PATCH
      path: "^/books/3/?$"
      headers: { Content-Type: "^application/json" }
      body_contains: ['"year"', '2016']
    response:
      status: 200
      body: '{"data": {"id": 3, "title": "Der stille Hafen", "author_id": 1, "genre": "krimi", "year": 2016}}'
    hints:
      - PUT ersetzt die komplette Ressource, PATCH ändert nur die mitgeschickten Felder.
      - "Body: `{\"year\": 2016}`"
    solution: |
      ```http
      PATCH /books/3 HTTP/1.1
      Host: api.example.com
      Content-Type: application/json

      {"year": 2016}
      ```
  - id: methoden-eigenschaften
    type: dragdrop
    title: Sicher, idempotent oder keins von beiden?
    description: Ordne jede Methode der stärksten Eigenschaft zu, die sie hat. Sichere Methoden sind immer auch idempotent.
    targets:
      - { id: sicher, label: "Sicher (ändert nichts)" }
      - { id: idempotent, label: "Idempotent, aber nicht sicher" }
      - { id: keins, label: "Weder sicher noch idempotent" }
    items:
      - { label: GET, target: sicher }
      - { label: HEAD, target: sicher }
      - { label: OPTIONS, target: sicher }
      - { label: PUT, target: idempotent }
      - { label: DELETE, target: idempotent }
      - { label: POST, target: keins }
    hints:
      - Frage dich bei jeder Methode, was passiert, wenn derselbe Request zweimal ankommt.
---
Stell dir vor, jedes Team würde seine API anders benennen: `getAllBooks`, `/fetch_book.php?id=2`,
`/books/remove/2`. Wer eine neue API nutzt, müsste jedes Mal von vorn raten. **REST** ist eine Sammlung
von Prinzipien, die solche APIs vorhersagbar macht – wer eine REST-API kennt, findet sich in der nächsten
schnell zurecht.

## REST in einem Satz

REST (*Representational State Transfer*) beschreibt Roy Fielding im Jahr 2000 als Architekturstil für das
Web. Eine [[rest-api|REST-API]] folgt im Alltag vor allem diesen Regeln:

| Prinzip | Bedeutung |
|---|---|
| Ressourcen mit URLs | Jedes „Ding“ hat eine eigene Adresse: `/books/2` |
| Einheitliche Methoden | GET, POST, PUT, PATCH, DELETE bedeuten überall dasselbe |
| Repräsentationen | Der Server schickt eine *Darstellung* der Ressource, meist JSON |
| Zustandslos | Jeder Request ist für sich vollständig |
| Statuscodes | Das Ergebnis steht im Statuscode, nicht versteckt im Body |

![Sammlung, Element und verschachtelte Ressource mit ihren Methoden](/assets/apis-endpunkte/rest-ressourcen.svg)

## Substantive im Pfad, Verben als Methode

Der Pfad nennt die Ressource als **Substantiv im Plural**. Was passieren soll, sagt die Methode – damit
entfallen alle Verben im Pfad. Die vier Grundoperationen Anlegen, Lesen, Ändern, Löschen heißen
zusammen [[crud|CRUD]].

| Aktion | Schlecht | REST |
|---|---|---|
| Alle lesen | `GET /getBooks` | `GET /books` |
| Anlegen | `POST /createBook` | `POST /books` |
| Eines lesen | `GET /book?id=2` | `GET /books/2` |
| Ändern | `POST /updateBook/2` | `PATCH /books/2` |
| Löschen | `GET /deleteBook/2` | `DELETE /books/2` |

Daten zum Anlegen oder Ändern stehen im [[http-body|Body]] des Requests. Der Header
[[content-type|Content-Type]] sagt dem Server, in welchem Format: `Content-Type: application/json`.

> [!FEHLER]
> Löschen per GET-Link (`GET /deleteBook/2`) ist gefährlich: Browser, Vorschau-Programme und Suchmaschinen
> rufen GET-Links ungefragt auf – und löschen damit Daten.

## PUT oder PATCH?

Beide ändern ein bestehendes Element, aber unterschiedlich:

- **PUT** ersetzt die **komplette** Ressource. Fehlt ein Feld im Body, ist es danach weg (oder leer).
- **PATCH** ändert nur die mitgeschickten Felder.

```http title="PATCH: nur das Jahr ändern"
PATCH /books/3 HTTP/1.1
Host: api.example.com
Content-Type: application/json

{"year": 2016}
```

Die meisten APIs bieten heute PATCH an, weil Clients selten alle Felder kennen oder mitschicken wollen.

## Sicher und idempotent

Zwei Eigenschaften helfen dir, Methoden richtig einzusetzen:

- **Sicher** ([[sichere-methode]]): Die Methode verändert nichts auf dem Server. Das gilt für GET, HEAD
  und OPTIONS.
- **Idempotent** ([[idempotenz]]): Zweimal ausgeführt hat dieselbe Wirkung wie einmal. Das gilt für alle
  sicheren Methoden plus PUT und DELETE.

| Methode | sicher | idempotent |
|---|---|---|
| GET | ja | ja |
| PUT | nein | ja |
| DELETE | nein | ja |
| PATCH | nein | nicht garantiert |
| POST | nein | nein |

Warum das wichtig ist: Bricht die Verbindung ab, darf ein Client idempotente Requests gefahrlos
wiederholen. Ein wiederholtes POST legt dagegen womöglich eine zweite Bestellung an.

> [!MERKSATZ]
> GET liest nur, PUT und DELETE darfst du wiederholen, POST nicht ohne Weiteres.

## Zustandslos und verschachtelt

**Zustandslos** ([[zustandslosigkeit]]) heißt: Der Server merkt sich zwischen zwei Requests nichts über
den Client. Jeder Request bringt alles mit – auch seinen Zugangsschlüssel. Dadurch kann jeder von zehn
Servern hinter einem [[load-balancer|Load Balancer]] jeden Request beantworten.

Beziehungen bildest du mit **verschachtelten Ressourcen** ab:

```text
GET /authors/1/books      Bücher der Person 1
GET /orders/7/items       Positionen der Bestellung 7
```

Halte die Verschachtelung flach – eine Ebene genügt. Statt `/authors/1/books/3/reviews/9` nutzt du
`/reviews/9`, denn jede Bewertung hat ohnehin eine eigene ID.

> [!PRAXIS]
> Nicht jede Aktion passt in CRUD. Für „Bestellung stornieren“ legen viele Teams eine eigene Ressource an,
> z. B. `POST /orders/7/cancellation`, statt ein Verb wie `/cancelOrder` zu erfinden.

## Zusammenfassung

- REST macht APIs vorhersagbar: Ressourcen mit URLs, einheitliche Methoden, Statuscodes, Zustandslosigkeit.
- Pfade sind **Substantive im Plural**, die Methode ist das **Verb**.
- **PUT** ersetzt komplett, **PATCH** ändert nur die mitgeschickten Felder.
- **Sicher**: GET, HEAD, OPTIONS. **Idempotent**: zusätzlich PUT und DELETE. POST ist beides nicht.
- Beziehungen als **verschachtelte Ressourcen**, aber höchstens eine Ebene tief.
