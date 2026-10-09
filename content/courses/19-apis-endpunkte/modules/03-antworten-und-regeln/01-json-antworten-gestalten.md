---
title: JSON-Antworten gestalten
summary: Einheitliche Antwortformen, Envelope oder nicht, Namenskonventionen, Datentypen, Datumsangaben und was nie in eine Antwort gehört.
duration: 20
sources:
  - title: RFC 8259 – The JSON Data Interchange Format
    url: https://www.rfc-editor.org/rfc/rfc8259
  - title: RFC 3339 – Date and Time on the Internet
    url: https://www.rfc-editor.org/rfc/rfc3339
  - title: Laravel-Dokumentation – Eloquent API Resources
    url: https://laravel.com/docs/13.x/eloquent-resources
  - title: PHP-Handbuch – DateTimeInterface::format
    url: https://www.php.net/manual/de/datetime.format.php
quiz:
  - type: single
    question: Welche Datumsangabe ist für eine API am besten geeignet?
    options:
      - "`\"03.05.2026\"`"
      - "`\"2026-05-03T14:30:00+00:00\"`"
      - "`\"May 3rd, 2:30pm\"`"
      - "`\"vor 2 Stunden\"`"
    answer: 1
    explanation: >
      ISO 8601 (bzw. RFC 3339) ist eindeutig, sortierbar und enthält die Zeitzone. Das Formatieren für
      Menschen („vor 2 Stunden“, deutsches Datum) übernimmt der Client.
  - type: multiple
    question: Welche Regeln machen JSON-Antworten konsistent?
    options:
      - Eine Namenskonvention für alle Felder, z. B. überall snake_case.
      - Zahlen als Zahlen und Wahrheitswerte als `true`/`false`, nicht als Strings.
      - Bei Einzelobjekten und Listen dieselbe Hülle, z. B. immer `data`.
      - Jeder Endpunkt erfindet die Feldnamen, die gerade am besten passen.
    answers: [0, 1, 2]
    explanation: Clients schreiben Code gegen die Form der Antwort. Je gleichförmiger sie ist, desto weniger Sonderfälle.
  - type: find-bug
    question: Diese Antwort von `GET /users/5` hat ein Sicherheitsproblem. In welcher Zeile?
    language: json
    code: |
      {
        "data": {
          "id": 5,
          "name": "Ada",
          "email": "ada@example.com",
          "password_hash": "$2y$12$abc...",
          "created_at": "2026-01-10T08:00:00+00:00"
        }
      }
    bug_line: 6
    explanation: >
      Interne Felder wie Passwort-Hashes gehören nie in eine Antwort – auch nicht „nur für die eigene App“.
      Deshalb baut man Antworten bewusst Feld für Feld, statt die Datenbankzeile durchzureichen.
  - type: cloze
    text: "Eine Hülle um die eigentlichen Daten wie `{\"data\": …, \"meta\": …}` nennt man ___."
    blanks:
      - [Envelope, Umschlag, Hülle]
    explanation: Der Envelope schafft Platz für Zusatzinfos wie Paginierung, ohne die Form der Daten zu ändern.
tasks:
  - id: buch-resource
    type: code
    language: php
    title: Aus einer Datenbankzeile wird eine API-Antwort
    description: |
      Die Datenbank liefert Bücher als Zeilen mit Strings, z. B.:

      ```php
      ['id' => '7', 'title' => 'Atlas der Funken', 'is_available' => '1',
       'published_at' => '2023-04-01 09:30:00', 'internal_note' => 'Lizenz prüfen']
      ```

      Schreibe `bookResource(array $row): array`, die daraus genau diese API-Form baut:

      ```php
      ['id' => 7, 'title' => 'Atlas der Funken', 'available' => true,
       'published_at' => '2023-04-01T09:30:00+00:00']
      ```

      - `id` als `int`, `available` als `bool` (`'1'` → `true`, `'0'` → `false`).
      - `published_at` als ISO-8601-Zeitpunkt in UTC (Format `DATE_ATOM`). Ist der Wert `null`, bleibt er `null`.
      - `internal_note` und alle anderen Felder kommen **nicht** in die Antwort.
    starter: |
      <?php
      declare(strict_types=1);

      function bookResource(array $row): array
      {
          return [
              'id' => $row['id'],
          ];
      }
    tests:
      - name: wandelt Typen und Datum um
        code: |
          $row = ['id' => '7', 'title' => 'Atlas der Funken', 'is_available' => '1', 'published_at' => '2023-04-01 09:30:00', 'internal_note' => 'Lizenz prüfen'];
          assert_same(['id' => 7, 'title' => 'Atlas der Funken', 'available' => true, 'published_at' => '2023-04-01T09:30:00+00:00'], bookResource($row));
      - name: macht aus '0' ein false
        code: |
          $row = ['id' => '2', 'title' => 'Bits und Bohnen', 'is_available' => '0', 'published_at' => '2018-11-20 00:00:00', 'internal_note' => ''];
          assert_same(false, bookResource($row)['available']);
      - name: lässt ein fehlendes Datum als null stehen
        code: |
          $row = ['id' => '3', 'title' => 'Entwurf', 'is_available' => '0', 'published_at' => null, 'internal_note' => null];
          assert_same(null, bookResource($row)['published_at']);
      - name: gibt keine internen Felder heraus
        code: |
          $row = ['id' => '1', 'title' => 'X', 'is_available' => '1', 'published_at' => null, 'internal_note' => 'geheim', 'supplier_price' => '3.10'];
          assert_same(['id', 'title', 'available', 'published_at'], array_keys(bookResource($row)));
    hints:
      - "`(int) $row['id']` und `$row['is_available'] === '1'` erledigen die Typen."
      - "`(new DateTimeImmutable($row['published_at'], new DateTimeZone('UTC')))->format(DATE_ATOM)` erzeugt `2023-04-01T09:30:00+00:00`."
      - Baue das Ergebnis-Array Feld für Feld neu auf, statt `$row` zu verändern.
    solution: |
      ```php
      <?php
      declare(strict_types=1);

      function bookResource(array $row): array
      {
          $published = $row['published_at'] === null
              ? null
              : (new DateTimeImmutable($row['published_at'], new DateTimeZone('UTC')))->format(DATE_ATOM);

          return [
              'id' => (int) $row['id'],
              'title' => $row['title'],
              'available' => $row['is_available'] === '1',
              'published_at' => $published,
          ];
      }
      ```
  - id: oeffentlich-oder-intern
    type: dragdrop
    title: Gehört das in die Antwort?
    description: Eine Kundin ruft `GET /me` für ihr eigenes Konto auf. Welche Felder gehören in die Antwort, welche bleiben auf dem Server?
    targets:
      - { id: antwort, label: In die API-Antwort }
      - { id: intern, label: Bleibt intern }
    items:
      - { label: id, target: antwort }
      - { label: display_name, target: antwort }
      - { label: email, target: antwort }
      - { label: created_at, target: antwort }
      - { label: password_hash, target: intern }
      - { label: last_login_ip, target: intern }
      - { label: internal_risk_score, target: intern }
      - { label: two_factor_secret, target: intern }
    hints:
      - Frage dich bei jedem Feld, ob ein Angreifer mit dem Wert etwas anfangen könnte oder ob er nur für interne Abläufe existiert.
---
Ein Endpunkt antwortet mit `{"book": {...}}`, der nächste mit `{"result": [...]}`, ein dritter mit einem
nackten Array. Mal heißt das Feld `createdAt`, mal `created`, mal `date_created`, und das Datum steht
einmal als `03.05.2026` und einmal als Zahl da. Wer diese API nutzt, schreibt für jeden Endpunkt
Sonderfälle. Einheitliche Antworten sparen allen Beteiligten Zeit.

## Eine Form für alle Antworten

Lege für deine API **eine** Form fest und halte sie überall ein. Eine verbreitete Variante nutzt einen
[[envelope|Envelope]] – eine Hülle mit festen Schlüsseln:

```json title="Einzelnes Element"
{"data": {"id": 2, "title": "Code im Morgengrauen"}}
```

```json title="Liste"
{
  "data": [{"id": 1, "title": "Die Wolkeninsel"}, {"id": 2, "title": "Code im Morgengrauen"}],
  "meta": {"page": 1, "per_page": 2, "total": 6}
}
```

Ohne Envelope stünde das Objekt bzw. Array direkt auf oberster Ebene. Beides ist erlaubt – der Envelope
hat aber Platz für `meta` und `links`, ohne dass sich die Form der Daten ändert.

> [!MERKSATZ]
> Wichtiger als die *perfekte* Form ist eine **einheitliche** Form. Jede Ausnahme ist ein Sonderfall in
> jedem Client.

## Namen und Datentypen

Entscheide dich für **eine** Namenskonvention: [[snake-case|snake_case]] (`published_at`) oder
[[camelcase|camelCase]] (`publishedAt`). Mische nie beides.

Nutze die echten [[datentyp|Datentypen]] von [[json|JSON]]:

| Schlecht | Gut | Warum |
|---|---|---|
| `"id": "7"` | `"id": 7` | Zahlen sind Zahlen (oder bewusst immer Strings) |
| `"available": "1"` | `"available": true` | Wahrheitswerte als `true`/`false` |
| `"price": "9,99"` | `"price_cents": 999` | Geldbeträge als ganze Zahl in Cent |
| `"tags": "a,b"` | `"tags": ["a", "b"]` | Listen als Arrays |

Fehlt ein Wert, schreibe das Feld mit `null` hinein, statt es wegzulassen. So bleibt die Form stabil.

Auch bei IDs lohnt eine bewusste Entscheidung: Fortlaufende Zahlen (`7`, `8`, `9`) verraten, wie viele
Datensätze es gibt, und laden zum Ausprobieren fremder IDs ein. Viele APIs nutzen deshalb zufällige IDs
wie UUIDs und geben sie als String aus. Entscheidend ist wieder: überall gleich.

## Datum und Uhrzeit

Zeitpunkte schreibst du im Format [[iso-8601|ISO 8601]] mit Zeitzone:

```json
{"published_at": "2023-04-01T09:30:00+00:00"}
```

So ist der Wert eindeutig, maschinenlesbar und sortierbar. Speichere und liefere Zeitpunkte am besten in UTC; die
Umrechnung in die Ortszeit der Nutzer ist Aufgabe der Anzeige. Ob daraus „1. April 2023“ oder „vor 3 Jahren“
wird, entscheidet der Client – je nach Sprache und Zeitzone seiner Nutzer.

```php title="PHP: Datenbankwert → ISO 8601"
$date = new DateTimeImmutable('2023-04-01 09:30:00', new DateTimeZone('UTC'));
echo $date->format(DATE_ATOM);   // 2023-04-01T09:30:00+00:00
```

> [!FEHLER]
> `"date": "03.05.2026"` – ist das der 3. Mai oder der 5. März? Und in welcher Zeitzone? Lokale Formate
> gehören in die Anzeige, nie in die API.

## Antworten bewusst bauen

Die Umwandlung von internen Daten in die öffentliche Form heißt [[serialisierung|Serialisierung]].
Gib dabei **nie** einfach die Datenbankzeile weiter. Sonst landen früher oder später Passwort-Hashes,
interne Notizen oder Einkaufspreise in der Antwort.

Baue stattdessen jede Antwort Feld für Feld in einer eigenen Funktion oder Klasse:

```php title="Eine Resource-Funktion"
function bookResource(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'title' => $row['title'],
    ];
}
```

> [!PRAXIS]
> In Laravel heißen diese Klassen [[api-resource|API Resources]] (`BookResource`). Jede Antwort läuft
> durch sie – dadurch ist sofort sichtbar, welche Felder eine API nach außen gibt, und ein neues
> Datenbankfeld wird nicht versehentlich öffentlich.

## Zusammenfassung

- Eine **einheitliche Form** für alle Antworten, z. B. ein Envelope mit `data`, `meta`, `links`.
- **Eine** Namenskonvention (snake_case oder camelCase), nie gemischt.
- Echte JSON-Typen: Zahlen, `true`/`false`, Arrays; Geld in Cent; fehlende Werte als `null`.
- Zeitpunkte in **ISO 8601** mit Zeitzone, Formatierung macht der Client.
- Antworten **bewusst** Feld für Feld bauen – nie die Datenbankzeile durchreichen.
