---
title: Den API-Vertrag schneiden
summary: Endpunkte, Statuscodes und Antwortformat von Vereinskurse festlegen – bevor Frontend und Backend getrennt loslaufen.
duration: 20
sources:
  - title: Laravel-Dokumentation – Eloquent API Resources
    url: https://laravel.com/docs/13.x/eloquent-resources
  - title: Laravel-Dokumentation – Form Request Validation
    url: https://laravel.com/docs/13.x/validation#form-request-validation
  - title: MDN – HTTP-Statuscodes
    url: https://developer.mozilla.org/de/docs/Web/HTTP/Reference/Status
quiz:
  - type: single
    question: Ein Mitglied will einen Workshop buchen, der schon voll ist. Welcher Statuscode passt am besten?
    options:
      - 200 OK
      - 404 Not Found
      - 409 Conflict
      - 500 Internal Server Error
    answer: 2
    explanation: >
      Die Anfrage ist formal korrekt, kollidiert aber mit dem aktuellen Zustand der Ressource. Genau dafür ist
      409 gedacht. 422 wäre richtig, wenn die **Eingabe** selbst ungültig wäre.
  - type: match
    question: Ordne jedem Endpunkt seine Aufgabe zu.
    pairs:
      - { left: "GET /api/workshops", right: "Kommende Workshops auflisten" }
      - { left: "GET /api/workshops/{id}", right: "Einen Workshop anzeigen" }
      - { left: "POST /api/workshops", right: "Einen Workshop anlegen" }
      - { left: "POST /api/workshops/{id}/booking", right: "Einen Platz buchen" }
      - { left: "DELETE /api/workshops/{id}/booking", right: "Die eigene Buchung stornieren" }
    explanation: Ressourcen sind Substantive im Pfad, die HTTP-Methode sagt, was passieren soll.
  - type: multiple
    question: Warum liefert die API ein eigenes Feld `seats_left`, statt das Frontend rechnen zu lassen?
    options:
      - Die Regel „freie Plätze“ steht dann an genau einer Stelle.
      - Das Frontend müsste sonst alle Buchungen laden.
      - JSON kann keine Subtraktion.
      - Andere Clients bekommen denselben Wert ohne eigene Logik.
    answers: [0, 1, 3]
    explanation: Fachlogik gehört in die API. Das Frontend zeigt an, was der Vertrag liefert.
  - type: cloze
    text: Ungültige Eingaben beantwortet Laravel automatisch mit Status ___ und einem Objekt ___, das die Fehler pro Feld enthält.
    blanks:
      - ["422"]
      - [errors]
    explanation: Ein Form Request erzeugt bei JSON-Anfragen eine 422-Antwort mit `message` und `errors`.
tasks:
  - id: workshop-anlegen-request
    type: request
    title: Lege einen Workshop über die API an
    description: |
      Du bist als Organisatorin angemeldet und hast das Token `1|abc123` bekommen. Lege den Workshop
      „Erste Hilfe“ im Vereinsheim an: Beginn am 14. November 2026 um 10:00 Uhr, 12 Plätze.

      Achte auf Methode, Pfad, die Header `Content-Type`, `Accept` und `Authorization` sowie einen JSON-Body mit
      `title`, `location`, `starts_at` und `capacity`.
    base_url: https://kurse.example.com
    expected:
      method: POST
      path: "^/api/workshops$"
      headers:
        Content-Type: "application/json"
        Accept: "application/json"
        Authorization: "^Bearer 1\\|abc123$"
      body_contains: ['"title"', '"location"', '"starts_at"', '"capacity"']
    response:
      status: 201
      body: '{"data": {"id": 3, "title": "Erste Hilfe", "description": null, "location": "Vereinsheim", "starts_at": "2026-11-14T10:00:00+00:00", "capacity": 12, "seats_left": 12}}'
    hints:
      - Neue Ressourcen legst du mit POST auf der Sammlung an – ohne ID im Pfad.
      - "Das Token schickst du als `Authorization: Bearer 1|abc123`."
  - id: statuscodes-zuordnen
    type: dragdrop
    title: Welcher Statuscode passt?
    description: Ordne jede Situation aus Vereinskurse dem Statuscode zu, den die API antwortet.
    targets:
      - { id: s201, label: 201 Created }
      - { id: s204, label: 204 No Content }
      - { id: s401, label: 401 Unauthorized }
      - { id: s404, label: 404 Not Found }
      - { id: s409, label: 409 Conflict }
      - { id: s422, label: 422 Unprocessable Content }
    items:
      - { label: Workshop erfolgreich angelegt, target: s201 }
      - { label: Buchung storniert – es gibt nichts zurückzugeben, target: s204 }
      - { label: Buchen ohne Token, target: s401 }
      - { label: GET /api/workshops/999 – gibt es nicht, target: s404 }
      - { label: Workshop ist ausgebucht, target: s409 }
      - { label: Schon gebucht, target: s409 }
      - { label: Kapazität 0 eingegeben, target: s422 }
    hints:
      - "422: Die Eingabe ist falsch. 409: Die Eingabe ist in Ordnung, aber der Zustand lässt es nicht zu."
---
Ab jetzt arbeiten zwei Seiten gleichzeitig: die API und das Frontend. Damit sie am Ende zusammenpassen,
braucht es eine Absprache darüber, welche Adressen es gibt, was sie erwarten und was sie zurückgeben. Diese
Absprache ist dein [[api-vertrag|API-Vertrag]]. In dieser Lektion legst du ihn für Vereinskurse fest.

## Endpunkte aus den Stories ableiten

Jede Muss-Story wird zu einem oder mehreren [[endpunkt|Endpunkten]]. Die Ressourcen sind Substantive im
Pfad, die [[http-methode|HTTP-Methode]] beschreibt die Aktion:

| Story | Methode und Pfad | Login nötig |
|---|---|---|
| Workshops ansehen | `GET /api/workshops` | nein |
| Einen Workshop ansehen | `GET /api/workshops/{workshop}` | nein |
| Workshop anlegen | `POST /api/workshops` | ja |
| Platz buchen | `POST /api/workshops/{workshop}/booking` | ja |
| Buchung stornieren | `DELETE /api/workshops/{workshop}/booking` | ja |
| Anmelden / Abmelden | `POST /api/login`, `POST /api/logout` | nur Logout |

Die Buchung ist als **Unterressource** modelliert: Pro Person und Workshop gibt es höchstens eine. Darum
braucht der Pfad keine Buchungs-ID – „meine Buchung für diesen Workshop“ ist eindeutig.

> [!MERKSATZ]
> Pfade benennen Dinge, Methoden benennen Aktionen. `POST /api/bookWorkshop` ist ein Verb im Pfad – das
> vermeidest du.

## Das Antwortformat festlegen

Das Frontend soll sich auf ein festes Format verlassen können. In Laravel legt das eine
[[api-resource|API Resource]] fest – sie trennt das Datenbankmodell vom Vertrag:

```json title="GET /api/workshops/3"
{
  "data": {
    "id": 3,
    "title": "Erste Hilfe",
    "description": null,
    "location": "Vereinsheim",
    "starts_at": "2026-11-14T10:00:00+00:00",
    "capacity": 12,
    "seats_left": 9
  }
}
```

Drei Entscheidungen stecken darin:

- **Datum als [[iso-8601|ISO 8601]]** mit Zeitzone – eindeutig für jeden Client.
- **`seats_left` rechnet die API.** Die Regel steht so an genau einer Stelle.
- **Alles steckt in `data`.** Listen bekommen zusätzlich `links` und `meta` für die
  [[paginierung|Paginierung]].

> [!FEHLER]
> Das Model direkt als JSON zurückgeben (`return $workshop;`). Dann wird jede neue Spalte – auch eine interne –
> automatisch Teil des Vertrags, und das Frontend bricht bei Umbenennungen.

## Statuscodes, die etwas sagen

Ein [[statuscode|Statuscode]] erzählt dem Client, was passiert ist, bevor er den Body liest:

| Code | Bedeutung in Vereinskurse |
|---|---|
| 200 / 201 | gelesen / angelegt |
| 204 | erledigt, kein Inhalt (Logout, Stornieren) |
| 401 | kein oder ungültiges Token |
| 404 | Workshop existiert nicht |
| 409 | Konflikt mit dem Zustand: ausgebucht, schon gebucht |
| 422 | Eingabe ungültig (Validierung) |
| 429 | zu viele Versuche (gedrosselter Login) |

Der Unterschied zwischen **409** und **422** ist wichtig fürs Frontend: Bei 422 zeigt es Fehler an den
Formularfeldern, bei 409 eine allgemeine Meldung.

## Validierung als Teil des Vertrags

Eingaben prüfst du in einem [[form-request|Form Request]]. Die Regeln sind zugleich Dokumentation:

```php title="app/Http/Requests/StoreWorkshopRequest.php"
public function rules(): array
{
    return [
        'title' => ['required', 'string', 'max:120'],
        'description' => ['nullable', 'string', 'max:2000'],
        'location' => ['required', 'string', 'max:120'],
        'starts_at' => ['required', 'date', 'after:now'],
        'capacity' => ['required', 'integer', 'min:1', 'max:500'],
    ];
}
```

Schlägt eine Regel fehl, antwortet Laravel mit **422** und dem Objekt `errors` – pro Feld eine Liste von
Meldungen. Genau dieses Format wird das Frontend später an die Formularfelder hängen.

> [!PRAXIS]
> In Teams wird der Vertrag oft zusätzlich als [[openapi|OpenAPI]]-Datei beschrieben, aus der Dokumentation
> und Client-Code entstehen. Für Vereinskurse reichen die Tabelle oben, die Resource und die Tests – die Tests
> sind die Spezifikation, die nie veraltet.

## Checkliste für den Vertrag

1. Jede Muss-Story hat einen Endpunkt.
2. Jeder Endpunkt hat festgelegte Statuscodes für Erfolg und Fehler.
3. Das Antwortformat kommt aus einer Resource, nicht direkt aus dem Model.
4. Datumswerte sind ISO 8601, Fachwerte wie `seats_left` rechnet die API.
5. Listen sind paginiert und laden Zählungen vorab ([[n-plus-1-problem|kein N+1]]).

## Zusammenfassung

- Der **API-Vertrag** legt Endpunkte, Eingaben, Antworten und Statuscodes fest.
- Pfade benennen Ressourcen, Methoden die Aktion; die Buchung ist eine Unterressource.
- **API Resources** trennen Datenbank und Vertrag.
- **422** heißt „Eingabe falsch“, **409** heißt „Zustand lässt es nicht zu“.
- **Form Requests** prüfen Eingaben und liefern Fehler pro Feld.
