---
title: Filtern, Sortieren, Paginieren
summary: Wie du große Sammlungen mit Query-Parametern filterst, sortierst und seitenweise ausgibst – Offset- und Cursor-Paginierung.
duration: 25
sources:
  - title: MDN – URLSearchParams
    url: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
  - title: RFC 8288 – Web Linking
    url: https://www.rfc-editor.org/rfc/rfc8288
  - title: Laravel-Dokumentation – Pagination
    url: https://laravel.com/docs/13.x/pagination
quiz:
  - type: single
    question: Wie sollte eine API die Liste aller Bücher eines Genres anbieten?
    options:
      - "`GET /books/genre/krimi/list`"
      - "`GET /books?genre=krimi`"
      - "`POST /books/search` mit dem Genre im Body"
      - "`GET /krimiBooks`"
    answer: 1
    explanation: Filter verfeinern eine Sammlung – das ist genau die Aufgabe des Query-Strings. Die Ressource bleibt `/books`.
  - type: cloze
    text: "Mit `?sort=___` sortiert die Buch-API absteigend nach Erscheinungsjahr, also die neuesten Bücher zuerst."
    blanks:
      - [-year]
    explanation: Ein vorangestelltes Minus für „absteigend“ ist eine weit verbreitete Konvention.
  - type: multiple
    question: Was spricht für Cursor-Paginierung statt `?page=3`?
    options:
      - Keine Lücken oder doppelten Einträge, wenn während des Blätterns neue Daten dazukommen.
      - Sie ist auch bei sehr großen Tabellen schnell.
      - Man kann direkt zu Seite 57 springen.
      - Der Client muss die Gesamtzahl nicht kennen.
    answers: [0, 1, 3]
    explanation: >
      Ein Cursor merkt sich die Position („nach Eintrag 2048“), nicht die Seitennummer. Dafür kann man nicht
      direkt zu einer beliebigen Seite springen.
  - type: single
    question: "Die Antwort enthält `\"links\": {\"next\": null}`. Was bedeutet das?"
    options:
      - Der Server hatte einen Fehler.
      - Du bist auf der letzten Seite angekommen.
      - Die Sammlung ist leer.
      - Du musst den nächsten Link selbst zusammenbauen.
    answer: 1
    explanation: Ein Client folgt `links.next`, bis es `null` ist – dann hat er alle Seiten gelesen.
tasks:
  - id: krimis-blaettern
    type: request
    title: Blättere durch die Krimis
    description: |
      Du baust eine Übersicht der Buch-API (`https://api.example.com`). Hole von der Sammlung der Bücher
      **die zweite Seite** mit **5 Einträgen pro Seite**, gefiltert auf das Genre `krimi` und **absteigend
      nach Jahr** sortiert.

      Die API kennt die Parameter `genre`, `sort` (Feldname, mit `-` für absteigend), `page` und `per_page`.
      Die Reihenfolge der Parameter ist egal.
    base_url: https://api.example.com
    expected:
      method: GET
      path: '^/books/?(?=.*[?&]genre=krimi(?:&|$))(?=.*[?&]sort=-year(?:&|$))(?=.*[?&]page=2(?:&|$))(?=.*[?&]per_page=5(?:&|$))\?'
    response:
      status: 200
      body: '{"data": [], "meta": {"page": 2, "per_page": 5, "total": 2, "total_pages": 1}, "links": {"next": null, "prev": "/books?genre=krimi&sort=-year&page=1&per_page=5"}}'
    hints:
      - Alle vier Werte stehen im Query-String nach dem `?`, getrennt durch `&`.
      - "Zum Beispiel `/books?genre=krimi&sort=-year&page=2&per_page=5`."
    solution: |
      ```http
      GET /books?genre=krimi&sort=-year&page=2&per_page=5 HTTP/1.1
      Host: api.example.com
      Accept: application/json
      ```
  - id: list-url-bauen
    type: code
    language: js
    title: Baue Listen-URLs sicher zusammen
    description: |
      Schreibe `buildListUrl(path, params)`. Die Funktion hängt die Einträge des Objekts `params` als
      Query-String an `path` an.

      - Werte, die `undefined`, `null` oder ein leerer String sind, werden **weggelassen**.
      - Bleibt kein Parameter übrig, gibst du nur `path` zurück (ohne `?`).
      - Sonderzeichen müssen korrekt kodiert werden. Nutze dafür `URLSearchParams`.
    starter: |
      function buildListUrl(path, params = {}) {
        const query = new URLSearchParams()
        // Gehe durch Object.entries(params) und hänge nur sinnvolle Werte an

        return path
      }
    tests:
      - name: baut einen Query-String aus zwei Parametern
        code: |
          assertEqual(buildListUrl('/books', { genre: 'krimi', page: 2 }), '/books?genre=krimi&page=2')
      - name: lässt leere Werte weg
        code: |
          assertEqual(buildListUrl('/books', { genre: '', sort: '-year', page: undefined, q: null }), '/books?sort=-year')
      - name: gibt ohne Parameter nur den Pfad zurück
        code: |
          assertEqual(buildListUrl('/books', {}), '/books')
          assertEqual(buildListUrl('/books'), '/books')
      - name: kodiert Leerzeichen und Sonderzeichen
        code: |
          assertEqual(buildListUrl('/books', { q: 'Bits & Bohnen' }), '/books?q=Bits+%26+Bohnen')
      - name: behält die Zahl 0 als echten Wert
        code: |
          assertEqual(buildListUrl('/orders', { min_total: 0 }), '/orders?min_total=0')
    hints:
      - "`for (const [key, value] of Object.entries(params)) { … }` geht durch alle Einträge."
      - "Prüfe mit `value === undefined || value === null || value === ''` – nicht mit `!value`, sonst verschwindet die 0."
      - "`query.append(key, String(value))` und am Ende `const text = query.toString()`."
    solution: |
      ```js
      function buildListUrl(path, params = {}) {
        const query = new URLSearchParams()
        for (const [key, value] of Object.entries(params)) {
          if (value === undefined || value === null || value === '') continue
          query.append(key, String(value))
        }
        const text = query.toString()
        return text === '' ? path : `${path}?${text}`
      }
      ```
---
Die Buch-API eines Online-Shops kennt 250 000 Bücher. Schickt `GET /books` alle auf einmal, wartet das
Handy des Kunden eine halbe Minute und lädt viele Megabyte, von denen es 20 Einträge anzeigt. Deshalb
liefern gute APIs große Sammlungen **gefiltert, sortiert und in Seiten** – gesteuert über den Query-String.

## Filtern mit Query-Parametern

Filter verfeinern eine Sammlung, ohne die Ressource zu wechseln. Sie stehen im
[[query-string|Query-String]] als Schlüssel-Wert-Paare:

```http
GET /books?genre=krimi
GET /books?genre=krimi&year=2024
GET /orders?status=open&customer_id=42
```

Für Bereiche nutzen viele APIs Präfixe oder eigene Namen, z. B. `?min_year=2020&max_year=2024`. Für eine
Freitextsuche ist `?q=...` verbreitet. Sollen mehrere Werte gelten, trennt man sie meist mit Kommas:
`?status=open,paid`. Mehrere Filter werden mit UND verknüpft – `?genre=krimi&year=2024` liefert nur
Krimis aus 2024. Wichtig: Dokumentiere, welche Filter es gibt, und ignoriere unbekannte Parameter nicht
stillschweigend.

Sonderzeichen müssen in URLs kodiert werden ([[percent-encoding]]): Aus `Bits & Bohnen` wird
`Bits+%26+Bohnen`. Sonst hielte der Server das `&` für den Beginn eines neuen Parameters.

> [!FEHLER]
> Filter als Pfad (`/books/genre/krimi`) oder als eigener Endpunkt (`/krimiBooks`). Damit wächst die API
> mit jedem Filter um neue Endpunkte – und Kombinationen werden unmöglich.

## Sortieren

Ein Parameter `sort` nennt das Feld, ein Minus davor dreht die Richtung um:

| Query | Ergebnis |
|---|---|
| `?sort=title` | A bis Z |
| `?sort=-year` | neueste zuerst |
| `?sort=genre,-year` | nach Genre, darin neueste zuerst |

Erlaube nur Felder, die du ausdrücklich freigibst. Ein unbekanntes Feld beantwortest du mit
`400 Bad Request` und einer klaren Meldung – nie leitest du den Wert ungeprüft an die Datenbank weiter.

## Offset-Paginierung: page und per_page

[[paginierung|Paginierung]] teilt eine Sammlung in Seiten. Die einfachste Form nutzt Seitennummer und
Seitengröße:

![Sechs Bücher auf drei Seiten mit Links zur vorherigen und nächsten Seite](/assets/apis-endpunkte/paginierung.svg)

```json title="GET /books?page=2&per_page=2"
{
  "data": [{"id": 3, "title": "Der stille Hafen"}, {"id": 4, "title": "Atlas der Funken"}],
  "meta": {"page": 2, "per_page": 2, "total": 6, "total_pages": 3},
  "links": {"next": "/books?page=3&per_page=2", "prev": "/books?page=1&per_page=2"}
}
```

- `meta` erklärt, wo der Client steht.
- `links` enthält fertige URLs. Der Client folgt `next`, bis es `null` ist.
- Setze eine **Obergrenze** für `per_page` (z. B. 100), sonst fragt jemand `per_page=1000000` an.

## Cursor-Paginierung

Offset-Paginierung hat zwei Schwächen: Bei großen Tabellen wird `page=5000` langsam, und kommen beim
Blättern neue Einträge dazu, verrutschen die Seiten. Die [[cursor-paginierung|Cursor-Paginierung]] merkt
sich deshalb die **Position** statt der Seitennummer:

```json title="GET /orders?limit=50&cursor=eyJpZCI6MjA0OH0"
{
  "data": [ … ],
  "links": {"next": "/orders?limit=50&cursor=eyJpZCI6MjA5OH0"}
}
```

Der Cursor ist für den Client ein undurchsichtiger Text – er reicht ihn nur weiter.

| | Offset (`page`) | Cursor |
|---|---|---|
| Zu Seite 57 springen | ja | nein |
| Schnell bei Millionen Einträgen | eher nein | ja |
| Stabil bei neuen Einträgen | nein | ja |

> [!MERKSATZ]
> Listen-Endpunkte liefern **nie** unbegrenzt viele Einträge. Filter, Sortierung und Seiten gehören in den
> Query-String, die Ressource bleibt dieselbe.

> [!PRAXIS]
> Laravel liefert beide Varianten fertig: `paginate()` für Seitennummern und `cursorPaginate()` für
> Cursor. Für Admin-Tabellen mit Seitenzahlen nimmt man meist Offset, für endlose Feeds und große
> Exporte den Cursor.

## Zusammenfassung

- **Filter** und **Sortierung** stehen im Query-String: `?genre=krimi&sort=-year`.
- Sonderzeichen werden kodiert – in JavaScript erledigt das `URLSearchParams`.
- **Offset-Paginierung** mit `page` und `per_page`, plus `meta` und `links` in der Antwort.
- **Cursor-Paginierung** ist schneller und stabiler, erlaubt aber keine Sprünge.
- Immer eine Obergrenze für die Seitengröße und eine Liste erlaubter Sortierfelder.
