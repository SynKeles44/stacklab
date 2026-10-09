---
title: Ein API-Design reviewen
summary: Mit einer Checkliste prüfst du neue Endpunkte auf Namen, Methoden, Statuscodes, Antwortform, Fehler, Sicherheit und Kompatibilität.
duration: 20
sources:
  - title: OWASP API Security Top 10 (2023)
    url: https://owasp.org/API-Security/editions/2023/en/0x11-t10/
  - title: RFC 9110 – HTTP Semantics
    url: https://www.rfc-editor.org/rfc/rfc9110
  - title: RFC 9457 – Problem Details for HTTP APIs
    url: https://www.rfc-editor.org/rfc/rfc9457
quiz:
  - type: single
    question: "Im Review siehst du `GET /orders/{id}`. Der Controller lädt die Bestellung per ID und gibt sie zurück – ohne weitere Prüfung. Was ist das größte Problem?"
    options:
      - Der Pfad müsste `/order/{id}` heißen.
      - Jeder angemeldete Nutzer kann fremde Bestellungen lesen, indem er die ID ändert.
      - GET ist für Bestellungen nicht erlaubt.
      - Die Antwort sollte XML sein.
    answer: 1
    explanation: >
      Fehlende Prüfung „gehört diese Ressource diesem Nutzer?“ ist laut OWASP das häufigste API-Sicherheitsproblem
      (Broken Object Level Authorization). Jeder Zugriff per ID braucht diese Prüfung.
  - type: multiple
    question: Welche Befunde sind Breaking Changes für bestehende Clients?
    options:
      - "`created` heißt jetzt `created_at`."
      - In der Antwort gibt es ein neues Feld `updated_at`.
      - "`price` ist jetzt ein String statt einer Zahl."
      - "`GET /books` liefert jetzt standardmäßig 20 statt aller Einträge."
    answers: [0, 2, 3]
    explanation: Umbenennen, Typwechsel und geändertes Standardverhalten brechen Clients. Ein zusätzliches Feld nicht.
  - type: find-bug
    question: Welche Zeile dieses Endpunkt-Entwurfs fällt im Review durch?
    language: text
    code: |
      GET    /v1/books
      POST   /v1/books
      GET    /v1/books/{id}
      POST   /v1/books/{id}/delete
      GET    /v1/authors/{id}/books
    bug_line: 4
    explanation: Löschen ist ein Verb und gehört in die Methode – `DELETE /v1/books/{id}`.
  - type: cloze
    text: "Ein Listen-Endpunkt ohne Obergrenze für die Seitengröße erlaubt Requests wie `?per_page=___`, die den Server überlasten."
    blanks:
      - ["1000000", "999999", "100000", "10000000"]
    explanation: Begrenze `per_page` serverseitig (z. B. auf 100) – egal, was der Client verlangt.
tasks:
  - id: befunde-sortieren
    type: dragdrop
    title: Ordne die Review-Befunde
    description: Ein Kollege hat eine neue API zum Review eingereicht. Ordne jeden Befund der Kategorie der Checkliste zu.
    targets:
      - { id: ressourcen, label: Ressourcen und Methoden }
      - { id: status, label: Statuscodes und Fehler }
      - { id: sicherheit, label: Sicherheit }
      - { id: kompatibilitaet, label: Kompatibilität und Grenzen }
    items:
      - { label: "POST /getInvoices", target: ressourcen }
      - { label: "PUT wird für teilweise Änderungen benutzt", target: ressourcen }
      - { label: "Validierungsfehler kommen mit Status 200", target: status }
      - { label: "Jeder Endpunkt hat ein anderes Fehlerformat", target: status }
      - { label: "Token wird als ?token=… in der URL erwartet", target: sicherheit }
      - { label: "Fremde Rechnungen sind per ID abrufbar", target: sicherheit }
      - { label: "Feld amount wurde ohne neue Version in total umbenannt", target: kompatibilitaet }
      - { label: "GET /invoices liefert alle 2 Millionen Rechnungen", target: kompatibilitaet }
    hints:
      - Sicherheit betrifft alles rund um Tokens und fremde Daten. Kompatibilität und Grenzen betrifft Versionen, Mengen und Limits.
  - id: review-durchgehen
    type: steps
    title: Ein Review Schritt für Schritt
    description: Du reviewst den Entwurf einer Termin-API. Entscheide bei jedem Befund, was du anmerkst.
    steps:
      - situation: "Der Entwurf enthält `POST /appointments/create` und `POST /appointments/{id}/update`."
        question: Was schlägst du vor?
        options:
          - Passt so, Hauptsache es funktioniert.
          - "`POST /appointments` und `PATCH /appointments/{id}` – die Verben stecken in den Methoden."
          - "`GET /appointments/create`, damit man es im Browser testen kann."
        answer: 1
        explanation: Substantive im Pfad, Verben als Methode. Dadurch ist die API ohne Doku vorhersagbar.
      - situation: "`POST /appointments` antwortet bei Erfolg mit `200` und `{\"ok\": true}`."
        question: Was merkst du an?
        options:
          - "`201 Created`, Header `Location` und die angelegte Ressource im Body zurückgeben."
          - "`204 No Content` wäre besser."
          - Nichts, 200 ist immer richtig.
        answer: 0
        explanation: 201 plus Location sagt dem Client, dass und wo etwas angelegt wurde. Die Ressource im Body spart einen weiteren Request.
      - situation: "Termine werden über ein Bezahlformular gebucht. Bricht die Verbindung ab, klicken Nutzer erneut auf „Buchen“."
        question: Was fehlt im Entwurf?
        options:
          - Ein Idempotency-Key für POST, damit Wiederholungen nicht doppelt buchen.
          - Ein zweiter Endpunkt `POST /appointments/again`.
          - Nichts, doppelte Buchungen merkt der Support schon.
        answer: 0
        explanation: Wiederholungen sind bei schlechtem Netz normal. Ein Idempotency-Key macht sie ungefährlich.
      - situation: "`GET /appointments` gibt alle Termine aller Jahre zurück, sortiert nach Erstellungszeit."
        question: Was schlägst du vor?
        options:
          - Paginierung mit Obergrenze und Filter wie `?from=2026-10-01&to=2026-10-31`.
          - Die Liste im Frontend kürzen.
          - Nichts – Server sind schnell genug.
        answer: 0
        explanation: Listen brauchen Seiten und eine Obergrenze. Filter im Query-String machen die Antwort klein und nützlich.
---
Ein neuer Endpunkt ist schnell gebaut – und bleibt dann oft jahrelang. Sobald Apps, Partner oder andere
Teams ihn nutzen, lässt er sich kaum noch ändern, ohne jemanden zu verärgern. Deshalb lohnt sich ein
**Review des API-Designs**, bevor der Code gemergt wird. Mit einer Checkliste geht das in wenigen Minuten.

## Die Checkliste

Gehe einen Entwurf in dieser Reihenfolge durch:

| Bereich | Prüffrage |
|---|---|
| Ressourcen | Substantive im Plural, keine Verben im Pfad, höchstens eine Ebene verschachtelt? |
| Methoden | GET liest nur, POST legt an, PATCH ändert teilweise, DELETE löscht? |
| Statuscodes | 201 + Location, 204, 4xx für Client-Fehler, nie 200 mit Fehler? |
| Antwortform | Einheitlicher Envelope, eine Namenskonvention, echte Typen, ISO-8601-Daten? |
| Fehler | Problem Details überall gleich, Validierung pro Feld, keine internen Details? |
| Sicherheit | Token im Header, Prüfung „gehört das dem Nutzer?“, nur nötige Felder? |
| Grenzen | Paginierung mit Obergrenze, Rate Limits, Timeouts bei fremden Diensten? |
| Kompatibilität | Kein Breaking Change ohne neue Version, Idempotency-Key bei kritischen POSTs? |

> [!MERKSATZ]
> Im Review prüfst du den **Vertrag**, nicht nur den Code: Was sehen Clients, und was können sie sich
> darauf verlassen?

## Ein Entwurf mit Schwächen

So kam der Entwurf einer Rechnungs-API ins Review:

```text title="Entwurf"
POST /getInvoices                 → 200, alle Rechnungen
POST /invoice/new                 → 200 {"ok": true}
GET  /invoice/{id}?token=abc123   → 200 oder 200 {"error": "not found"}
POST /invoice/{id}/delete         → 200
```

Die Befunde:

1. Verben im Pfad, Singular und Plural gemischt, POST zum Lesen.
2. Fehler mit Status 200, kein einheitliches Fehlerformat.
3. Token in der URL – landet in Logs.
4. Keine Paginierung, keine Prüfung, ob die Rechnung dem Nutzer gehört.

## Die verbesserte Version

```text title="Nach dem Review"
GET    /v1/invoices?status=open&page=1&per_page=50   → 200 {data, meta, links}
POST   /v1/invoices    (Idempotency-Key)             → 201 + Location
GET    /v1/invoices/{id}                             → 200 | 404 problem+json
PATCH  /v1/invoices/{id}                             → 200 | 422 problem+json
DELETE /v1/invoices/{id}                             → 204 | 404 problem+json
Authorization: Bearer <dein-token>  (bei allen Requests)
```

Jede Zeile beantwortet eine Frage aus der Checkliste. Der Controller hinter `GET /v1/invoices/{id}`
prüft außerdem, ob die Rechnung zum angemeldeten Konto gehört – sonst antwortet er mit `404`, damit
Fremde nicht einmal erfahren, dass sie existiert.

> [!FEHLER]
> „Der Endpunkt ist doch nur intern.“ Interne APIs werden erstaunlich oft später öffentlich – oder von
> einem kompromittierten internen System missbraucht. Dieselben Regeln gelten für alle APIs.

## Gutes Review-Feedback

- **Konkret:** „`POST /invoice/new` → `POST /v1/invoices` mit 201 und Location“ statt „REST beachten“.
- **Begründet:** Warum ist es ein Problem? („Token in URLs landen in Logs.“)
- **Gewichtet:** Sicherheitslücken und Breaking Changes blockieren den Merge, Namensfragen sind
  Vorschläge.
- **Freundlich:** Du bewertest den Entwurf, nicht die Person. Formuliere Fragen („Was passiert, wenn
  derselbe POST zweimal ankommt?“) statt Vorwürfen.

Ein guter Ort für die Ergebnisse ist die [[api-dokumentation|API-Dokumentation]]: Sie hält den Vertrag
fest, den das Review geprüft hat. Wie man sie schreibt (z. B. mit OpenAPI), lernst du im Kurs
„API-Dokumentation“.

> [!PRAXIS]
> Viele Teams reviewen bei neuen Endpunkten zuerst nur die Beschreibung des Vertrags – Pfade, Beispiele
> für Requests und Antworten, Fehlerfälle. Erst wenn die passt, wird implementiert. Das ist billiger als
> ein Umbau nach dem Release.

## Zusammenfassung

- Ein API-Review prüft den **Vertrag**: Ressourcen, Methoden, Statuscodes, Antwortform, Fehler.
- Sicherheit: Token im Header, Prüfung der Zugehörigkeit bei jedem Zugriff per ID.
- Grenzen: Paginierung mit Obergrenze, Rate Limits, Timeouts.
- Kompatibilität: Breaking Changes nur mit neuer Version, Idempotency-Keys für kritische POSTs.
- Gutes Feedback ist konkret, begründet und nach Schwere gewichtet.
