---
title: Zugang, Versionen und Limits
summary: API-Keys und Bearer-Tokens im Überblick, Versionierung ohne Bruch, Idempotency-Keys gegen doppelte Aktionen und Rate Limits mit 429 und Retry-After.
duration: 25
sources:
  - title: RFC 6750 – OAuth 2.0 Bearer Token Usage
    url: https://www.rfc-editor.org/rfc/rfc6750
  - title: RFC 6585 – Additional HTTP Status Codes (429)
    url: https://www.rfc-editor.org/rfc/rfc6585#section-4
  - title: MDN – Retry-After
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Retry-After
  - title: IETF-Entwurf – The Idempotency-Key HTTP Header Field
    url: https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/
  - title: RFC 8594 – The Sunset HTTP Header Field
    url: https://www.rfc-editor.org/rfc/rfc8594
quiz:
  - type: single
    question: Wo gehört ein API-Key hin?
    options:
      - In die URL, z. B. `?api_key=abc123`
      - In einen Header, z. B. `Authorization` oder `X-API-Key`
      - In den Code der Website, damit jeder Browser ihn mitschickt
      - In die Fehlermeldung, damit der Support ihn sieht
    answer: 1
    explanation: >
      URLs landen in Server-Logs, im Browserverlauf und in Weiterleitungen. Schlüssel gehören in Header – und
      nie in Code, den Nutzer herunterladen können.
  - type: multiple
    question: Welche Änderungen sind Breaking Changes, die eine neue API-Version erfordern?
    options:
      - Ein Feld umbenennen, z. B. `title` → `name`
      - Ein neues, optionales Feld in der Antwort ergänzen
      - Den Typ eines Felds von Zahl auf String ändern
      - Einen Endpunkt entfernen
    answers: [0, 2, 3]
    explanation: Neue Felder brechen keinen sauber geschriebenen Client. Umbenennen, Typ ändern und Entfernen schon.
  - type: cloze
    text: "Ist das Rate Limit erreicht, antwortet die API mit Status ___ und sagt im Header ___, wie viele Sekunden der Client warten soll."
    blanks:
      - ["429"]
      - [Retry-After]
    explanation: "`429 Too Many Requests` plus `Retry-After: 30` heißt: frühestens in 30 Sekunden wieder versuchen."
  - type: single
    question: Wozu dient ein Idempotency-Key bei `POST /payments`?
    options:
      - Er verschlüsselt die Zahlung.
      - Er sorgt dafür, dass eine wiederholte Anfrage mit demselben Schlüssel nicht noch eine Zahlung auslöst.
      - Er ersetzt das Token.
      - Er legt die API-Version fest.
    answer: 1
    explanation: Der Server merkt sich Schlüssel und Ergebnis. Kommt derselbe Schlüssel noch einmal, liefert er das gespeicherte Ergebnis, statt erneut abzubuchen.
tasks:
  - id: sicher-bestellen
    type: request
    title: Lege eine Bestellung sicher an
    description: |
      Die Shop-API unter `https://api.example.com` hat Version 1 im Pfad. Lege eine Bestellung über
      `/v1/orders` an:

      - Melde dich mit dem Token `<dein-token>` per Bearer-Schema an.
      - Schicke einen **Idempotency-Key**, damit ein Netzwerk-Wiederholungsversuch keine zweite Bestellung
        erzeugt. Nimm als Wert z. B. `bestellung-2026-0042`.
      - Body als JSON mit `product_id` 17 und `quantity` 2.
    base_url: https://api.example.com
    expected:
      method: POST
      path: "^/v1/orders/?$"
      headers:
        Authorization: "^Bearer\\s+\\S+$"
        Idempotency-Key: "^\\S{6,}$"
        Content-Type: "^application/json"
      body_contains: ['"product_id"', '"quantity"']
    response:
      status: 201
      body: '{"data": {"id": 9001, "product_id": 17, "quantity": 2, "status": "pending"}}'
    hints:
      - Du brauchst drei Header – Authorization, Idempotency-Key und Content-Type.
      - "`Authorization: Bearer <dein-token>` – zwischen `Bearer` und dem Token steht ein Leerzeichen."
    solution: |
      ```http
      POST /v1/orders HTTP/1.1
      Host: api.example.com
      Authorization: Bearer <dein-token>
      Idempotency-Key: bestellung-2026-0042
      Content-Type: application/json

      {"product_id": 17, "quantity": 2}
      ```
  - id: limit-erreicht
    type: steps
    title: Rate Limit und Wiederholungen
    description: Dein Skript importiert nachts Bestellungen aus einer fremden API. Entscheide, wie es reagieren soll.
    steps:
      - situation: >
          Nach 100 Requests in kurzer Zeit kommt `HTTP/1.1 429 Too Many Requests` mit dem Header
          `Retry-After: 30`.
        question: Was macht dein Skript?
        options:
          - Sofort erneut senden, bis es klappt.
          - 30 Sekunden warten und dann denselben Request wiederholen.
          - Den Import abbrechen und alle Daten löschen.
        answer: 1
        explanation: Sofortiges Wiederholen verlängert die Sperre oft noch. Retry-After sagt genau, wann es weitergeht.
      - situation: >
          Ein `POST /v1/payments` läuft in einen Timeout. Du weißt nicht, ob der Server die Zahlung schon
          ausgeführt hat.
        question: Wann darfst du den Request gefahrlos wiederholen?
        options:
          - Nie – POST ist grundsätzlich nicht wiederholbar.
          - Nur, wenn du beim ersten Mal einen Idempotency-Key mitgeschickt hast und denselben wieder verwendest.
          - Immer, der Server erkennt Duplikate automatisch.
        answer: 1
        explanation: >
          Mit demselben Idempotency-Key erkennt der Server die Wiederholung und liefert das gespeicherte
          Ergebnis. Ohne Schlüssel droht eine doppelte Zahlung.
      - situation: "Die API antwortet plötzlich auf alle Requests mit `401 Unauthorized`."
        question: Was ist die wahrscheinlichste Ursache?
        options:
          - Das Rate Limit ist erreicht.
          - Das Token ist abgelaufen oder wurde widerrufen.
          - Der Server ist abgestürzt.
        answer: 1
        explanation: 401 heißt „nicht angemeldet“. Ein Rate Limit wäre 429, ein Absturz eher 500 oder 503.
---
Deine API läuft. Plötzlich passieren drei Dinge: Ein Fremder liest Daten, die nicht für ihn sind. Ein
Partner beschwert sich, weil du ein Feld umbenannt hast und seine App abstürzt. Und ein fehlerhaftes
Skript schickt 50 000 Requests pro Minute. Diese Lektion zeigt die vier Werkzeuge gegen solche Probleme
im Überblick: Zugangsschutz, Versionierung, Idempotency-Keys und Rate Limits.

## Wer fragt? API-Keys und Bearer-Tokens

Die meisten APIs wollen wissen, wer anfragt. Das Prüfen der Identität heißt
[[authentifizierung|Authentifizierung]], das Prüfen der Rechte [[autorisierung|Autorisierung]]. Die zwei
häufigsten Verfahren sind ein [[api-key|API-Key]] und ein [[bearer-token|Bearer-Token]]:

| Verfahren | Header | Typischer Einsatz |
|---|---|---|
| API-Key | `X-API-Key: <dein-key>` | Server-zu-Server, z. B. dein Backend ruft einen Wetterdienst |
| Bearer-Token | `Authorization: Bearer <dein-token>` | angemeldete Nutzer, Apps, OAuth |

```http
GET /v1/me HTTP/1.1
Host: api.example.com
Authorization: Bearer <dein-token>
```

Wer das Token besitzt („trägt“), bekommt Zugang – deshalb läuft eine API nur über [[https|HTTPS]].
Fehlt das Token oder ist es ungültig, antwortet die API mit `401` und dem Header `WWW-Authenticate`.
Wie Tokens entstehen und ablaufen, lernst du im Kurs „Authentifizierung“.

> [!FEHLER]
> Schlüssel in der URL (`?api_key=…`) oder im JavaScript einer Website. URLs landen in Logs, und
> Frontend-Code kann jeder lesen. Ein geleakter Schlüssel muss sofort gesperrt und ersetzt werden.

## Versionierung: ändern ohne zu brechen

Ein [[breaking-change|Breaking Change]] zwingt Clients, ihren Code anzupassen: Felder umbenennen oder
entfernen, Typen ändern, Endpunkte streichen. Neue optionale Felder dagegen sind harmlos.

Für Breaking Changes gibt es eine neue Version ([[api-versionierung|API-Versionierung]]). Zwei Wege sind
verbreitet:

| Weg | Beispiel | Vorteil |
|---|---|---|
| Im Pfad | `/v1/orders`, `/v2/orders` | sofort sichtbar, einfach zu testen |
| Im Header | `Accept: application/vnd.example.v2+json` | URLs bleiben stabil |

Die alte Version läuft eine angekündigte Zeit weiter. Der Header `Sunset` nennt das Abschaltdatum.

> [!MERKSATZ]
> Erweitern ist erlaubt, Brechen braucht eine neue Version – und eine Übergangszeit für alle Clients.

## Idempotency-Keys: doppelte Aktionen verhindern

POST ist nicht idempotent. Bricht die Verbindung nach `POST /payments` ab, weiß der Client nicht, ob die
Zahlung angekommen ist. Wiederholt er, wird womöglich doppelt abgebucht.

Die Lösung ist ein [[idempotency-key|Idempotency-Key]]: ein eindeutiger Wert, den der Client erzeugt
und mitschickt.

```http
POST /v1/payments HTTP/1.1
Idempotency-Key: 7f3c9a2e-5b1d-4c8e-9f60-2a4b8d1e3c77
Content-Type: application/json

{"amount_cents": 4990, "order_id": 42}
```

1. Der Server speichert Schlüssel und Ergebnis.
2. Kommt derselbe Schlüssel erneut, führt er nichts aus und liefert das gespeicherte Ergebnis.

Zahlungsdienste nutzen das seit Jahren. Für den Header gab es einen IETF-Entwurf, ein fertiger Standard ist
daraus (Stand Oktober 2026) aber noch nicht geworden – die Idee ist trotzdem weit verbreitet.

## Rate Limits: 429 und Retry-After

[[rate-limiting|Rate Limiting]] begrenzt, wie viele Requests ein Client in einer Zeitspanne schicken
darf, z. B. 60 pro Minute. Das schützt den Server vor Überlast und Missbrauch.

```http title="Limit erreicht"
HTTP/1.1 429 Too Many Requests
Retry-After: 30
Content-Type: application/problem+json

{"title": "Zu viele Anfragen", "status": 429, "detail": "Höchstens 60 Anfragen pro Minute."}
```

`Retry-After` nennt die Wartezeit in Sekunden (oder ein Datum). Viele APIs zeigen den Stand schon vorher
an, oft mit Headern wie `X-RateLimit-Limit` und `X-RateLimit-Remaining`.

> [!PRAXIS]
> Ein guter Client wartet bei `429` die angegebene Zeit und wiederholt dann. Bei `5xx` wartet er mit
> wachsenden Abständen (1 s, 2 s, 4 s …) und gibt nach wenigen Versuchen auf. In Laravel begrenzt die
> Middleware `throttle` Routen mit einer Zeile.

## Zusammenfassung

- **API-Keys** (`X-API-Key`) für Server-zu-Server, **Bearer-Tokens** (`Authorization: Bearer …`) für Nutzer und Apps – nie in URLs, immer über HTTPS.
- `401` = nicht angemeldet; Details zur Anmeldung folgen im Kurs „Authentifizierung“.
- **Breaking Changes** brauchen eine neue Version, z. B. `/v2/…`, plus Übergangszeit.
- Ein **Idempotency-Key** macht wiederholte POST-Requests ungefährlich.
- **Rate Limits** antworten mit `429` und `Retry-After` – der Client wartet und versucht es dann erneut.
