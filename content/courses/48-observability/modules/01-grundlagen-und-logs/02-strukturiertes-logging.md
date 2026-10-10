---
title: Strukturiertes Logging und Korrelations-IDs
summary: Warum Logzeilen JSON sein sollten, welche Felder hineingehören, wie du Log-Levels richtig wählst und wie Korrelations-IDs alle Zeilen einer Anfrage verbinden.
duration: 25
sources:
  - title: OpenTelemetry – Logs
    url: https://opentelemetry.io/docs/concepts/signals/logs/
  - title: RFC 5424 – Severity Levels (The Syslog Protocol)
    url: https://datatracker.ietf.org/doc/html/rfc5424#section-6.2.1
  - title: jq Manual
    url: https://jqlang.org/manual/
quiz:
  - type: single
    question: Warum ist `{"level":"error","order_id":4711,"message":"Payment failed"}` besser als `ERROR Payment for order 4711 failed`?
    options:
      - JSON ist kürzer.
      - Maschinen können Felder wie `order_id` direkt filtern und zählen, statt Text mit regulären Ausdrücken zu zerlegen.
      - Text-Logs sind seit PHP 8 verboten.
      - JSON-Logs brauchen keinen Zeitstempel.
    answer: 1
    explanation: Bei strukturierten Logs ist jede Information ein eigenes Feld. Werkzeuge wie jq, Loki oder Elasticsearch können danach filtern, gruppieren und zählen – ohne fragile Regex.
  - type: match
    question: Ordne jedem Ereignis das passende Log-Level zu.
    pairs:
      - { left: "Zahlung endgültig fehlgeschlagen, Kund:in bekommt eine Fehlerseite", right: "error" }
      - { left: "Erster Versuch beim Zahlungsdienst gescheitert, Wiederholung klappt", right: "warning" }
      - { left: "Bestellung 4711 wurde angelegt", right: "info" }
      - { left: "Inhalt des Warenkorbs vor der Preisberechnung", right: "debug" }
    explanation: error heißt „jemand hat ein Problem“, warning „ungewöhnlich, aber abgefangen“, info sind wichtige Geschäftsereignisse, debug sind Details für Entwickler:innen.
  - type: find-bug
    question: Diese Middleware soll jeder Anfrage eine Korrelations-ID geben und eine mitgeschickte übernehmen. In welcher Zeile steckt der Fehler?
    language: php
    code: |
      public function handle(Request $request, Closure $next): Response
      {
          $id = Str::uuid()->toString();
          Log::shareContext(['request_id' => $id]);
          $response = $next($request);
          $response->headers->set('X-Request-Id', $id);
          return $response;
      }
    bug_line: 3
    explanation: "Zeile 3 erzeugt immer eine neue ID und ignoriert einen mitgeschickten Header. Richtig wäre `$id = $request->header('X-Request-Id') ?? Str::uuid()->toString();` – sonst reißt die Kette zwischen zwei Diensten ab."
  - type: cloze
    text: Ein Format mit genau einem JSON-Objekt pro Zeile heißt JSON ___. Mit `jq -c 'select(.level == "___")' app.jsonl` zeigst du nur Fehlerzeilen.
    blanks:
      - [Lines, lines]
      - [error]
    explanation: JSON Lines lässt sich Zeile für Zeile verarbeiten. jq wendet den Filter auf jedes Objekt einzeln an.
tasks:
  - id: logs-auswerten
    type: terminal
    title: Einen Incident in JSON-Logs nachvollziehen
    description: |
      Im Ordner `logs-auswerten` liegt die Datei `app.jsonl` mit Logzeilen einer Laravel-App im Format
      JSON Lines. Beantworte drei Fragen mit `jq` und schreibe die Antworten in Dateien:

      1. Wie viele Zeilen haben das Level `error`? Schreibe nur die Zahl in `anzahl-fehler.txt`.
      2. Schreibe **alle** Zeilen der Anfrage mit `request_id` `req-b2` (in der Reihenfolge der Datei) nach
         `req-b2.jsonl`.
      3. Welche Anfrage hatte die größte `duration_ms`? Schreibe nur ihre `request_id` in `langsamste.txt`.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit die Logdatei angelegt wird.
    workdir: logs-auswerten
    setup: |
      cat > app.jsonl <<'EOF'
      {"time":"2026-10-05T13:55:01Z","level":"info","message":"Request started","request_id":"req-a1","route":"GET /products"}
      {"time":"2026-10-05T13:55:01Z","level":"info","message":"Request finished","request_id":"req-a1","route":"GET /products","status":200,"duration_ms":42}
      {"time":"2026-10-05T13:55:03Z","level":"info","message":"Request started","request_id":"req-b2","route":"POST /checkout"}
      {"time":"2026-10-05T13:55:03Z","level":"info","message":"Cart loaded","request_id":"req-b2","route":"POST /checkout","items":3}
      {"time":"2026-10-05T13:55:13Z","level":"error","message":"Payment request failed","request_id":"req-b2","route":"POST /checkout","error":"connection timed out after 10000 ms"}
      {"time":"2026-10-05T13:55:13Z","level":"info","message":"Request finished","request_id":"req-b2","route":"POST /checkout","status":502,"duration_ms":10120}
      {"time":"2026-10-05T13:55:04Z","level":"info","message":"Request started","request_id":"req-c3","route":"GET /cart"}
      {"time":"2026-10-05T13:55:04Z","level":"warning","message":"Slow query","request_id":"req-c3","route":"GET /cart","duration_ms":850}
      {"time":"2026-10-05T13:55:05Z","level":"info","message":"Request finished","request_id":"req-c3","route":"GET /cart","status":200,"duration_ms":910}
      {"time":"2026-10-05T13:55:20Z","level":"info","message":"Request started","request_id":"req-d4","route":"POST /checkout"}
      {"time":"2026-10-05T13:55:30Z","level":"error","message":"Payment request failed","request_id":"req-d4","route":"POST /checkout","error":"connection timed out after 10000 ms"}
      {"time":"2026-10-05T13:55:30Z","level":"info","message":"Request finished","request_id":"req-d4","route":"POST /checkout","status":502,"duration_ms":10080}
      {"time":"2026-10-05T13:55:31Z","level":"error","message":"Mail transport unavailable","request_id":"req-e5","route":"POST /contact","error":"smtp connect failed"}
      EOF
    checks:
      - type: file_exists
        path: anzahl-fehler.txt
        message: Lege die Datei anzahl-fehler.txt mit der Anzahl der error-Zeilen an.
      - type: command
        run: tr -d '[:space:]' < anzahl-fehler.txt
        stdout_equals: "3"
        message: In anzahl-fehler.txt steht nicht die richtige Anzahl. Zähle mit jq -c 'select(.level == "error")' app.jsonl | wc -l.
      - type: command
        run: jq -r '.request_id' req-b2.jsonl | sort -u
        stdout_equals: req-b2
        message: req-b2.jsonl darf nur gültige JSON-Zeilen der Anfrage req-b2 enthalten.
      - type: command
        run: jq -r '.message' req-b2.jsonl | tr '\n' '|'
        stdout_equals: "Request started|Cart loaded|Payment request failed|Request finished|"
        message: In req-b2.jsonl fehlen Zeilen oder die Reihenfolge stimmt nicht – es sind vier Zeilen in der Reihenfolge der Originaldatei.
      - type: command
        run: cat langsamste.txt
        stdout_matches: "^\\s*req-b2\\s*$"
        message: In langsamste.txt steht noch nicht die request_id der Anfrage mit der größten duration_ms.
    hints:
      - "`jq -c 'select(.level == \"error\")' app.jsonl` gibt nur die Fehlerzeilen aus – `wc -l` zählt sie."
      - "Für Frage 2 filterst du mit `select(.request_id == \"req-b2\")` und leitest mit `>` in die Datei um."
      - "Für Frage 3: `jq -s -r 'map(select(.duration_ms != null)) | max_by(.duration_ms) | .request_id' app.jsonl` – `-s` liest alle Zeilen in ein Array."
    solution: |
      ```bash
      cd logs-auswerten
      jq -c 'select(.level == "error")' app.jsonl | wc -l > anzahl-fehler.txt
      jq -c 'select(.request_id == "req-b2")' app.jsonl > req-b2.jsonl
      jq -s -r 'map(select(.duration_ms != null)) | max_by(.duration_ms) | .request_id' app.jsonl > langsamste.txt
      cat anzahl-fehler.txt langsamste.txt
      ```
  - id: log-level-zaehlen
    type: code
    language: js
    title: Logzeilen pro Level zählen
    description: |
      Schreibe die Funktion `countByLevel(text)`. Sie bekommt den Inhalt einer JSON-Lines-Datei als String
      und gibt ein Objekt zurück, das zählt, wie viele Zeilen es pro `level` gibt.

      - Leere Zeilen werden übersprungen.
      - Zeilen, die kein gültiges JSON sind oder kein Feld `level` haben, zählst du unter dem Schlüssel `"invalid"`.
      - Beispiel: zwei info-Zeilen und eine error-Zeile ergeben `{ info: 2, error: 1 }`.
    starter: |
      function countByLevel(text) {
        const counts = {}
        // Zerlege den Text in Zeilen und werte jede Zeile aus
        return counts
      }
    tests:
      - name: zählt Levels
        code: |
          const t = '{"level":"info","message":"a"}\n{"level":"error","message":"b"}\n{"level":"info","message":"c"}'
          assertDeepEqual(countByLevel(t), { info: 2, error: 1 })
      - name: leerer Text ergibt leeres Objekt
        code: assertDeepEqual(countByLevel(''), {})
      - name: überspringt leere Zeilen
        code: |
          assertDeepEqual(countByLevel('{"level":"warning"}\n\n\n'), { warning: 1 })
      - name: zählt kaputte Zeilen als invalid
        code: |
          assertDeepEqual(countByLevel('ERROR plain text\n{"message":"no level"}\n{"level":"debug"}'), { invalid: 2, debug: 1 })
    solution: |
      function countByLevel(text) {
        const counts = {}
        for (const line of text.split('\n')) {
          if (line.trim() === '') continue
          let key = 'invalid'
          try {
            const entry = JSON.parse(line)
            if (entry && typeof entry.level === 'string') key = entry.level
          } catch {
            key = 'invalid'
          }
          counts[key] = (counts[key] ?? 0) + 1
        }
        return counts
      }
---
Ein Kollege schickt dir einen Ausschnitt aus der Logdatei: 40 000 Zeilen wie `[2026-10-05 13:55:13]
production.ERROR: Payment failed for order 4711`. Du willst wissen, wie viele Bestellungen betroffen sind
und ob immer derselbe Zahlungsanbieter dahintersteckt. Mit Freitext wird das eine Regex-Bastelei. Mit
strukturierten Logs ist es eine Zeile `jq`.

## Text-Logs gegen strukturierte Logs

Klassische Logzeilen sind für Menschen geschrieben. Sobald eine Maschine sie auswerten soll, musst du
den Text zerlegen – und jede kleine Formatänderung bricht deine Auswertung.

```text title="Freitext"
[2026-10-05 13:55:13] production.ERROR: Payment failed for order 4711 (timeout)
```

Beim [[strukturiertes-logging|strukturierten Logging]] ist jede Information ein eigenes Feld. Meist
schreibt man eine Zeile [[json|JSON]] pro Ereignis – das Format heißt [[json-lines|JSON Lines]].

```json title="Strukturiert"
{"time":"2026-10-05T13:55:13Z","level":"error","message":"Payment failed",
 "order_id":4711,"provider":"card","error":"timeout","request_id":"req-b2"}
```

Jetzt kannst du direkt fragen: „Alle Fehler mit `provider` = `card` seit 13:50“ – ohne Regex.

> [!MERKSATZ]
> Die `message` bleibt **gleich**, die veränderlichen Werte stehen in **eigenen Feldern**. Dann kannst du
> nach „Payment failed“ gruppieren und nach `order_id` filtern.

## Welche Felder gehören hinein?

Ein gutes Grundgerüst, das jede Logzeile hat:

| Feld | Inhalt | Beispiel |
|---|---|---|
| `time` | [[zeitstempel\|Zeitstempel]] in [[utc\|UTC]], [[iso-8601\|ISO 8601]] | `2026-10-05T13:55:13Z` |
| `level` | Schweregrad | `error` |
| `message` | kurze, **feste** Beschreibung | `Payment failed` |
| `request_id` / `trace_id` | verbindet alle Zeilen einer Anfrage | `req-b2` |
| `service`, `env` | wer loggt, wo | `shop`, `production` |
| Kontext | fachliche Felder | `order_id`, `route`, `duration_ms` |

Zahlen bleiben Zahlen (`"duration_ms":120`, nicht `"120ms"`). Nur so kannst du später rechnen und
vergleichen.

> [!FEHLER]
> **Werte in die Message mischen.** `"message":"Payment failed for order 4711"` erzeugt tausende
> verschiedene Messages. Gruppieren wird unmöglich. Schreibe `"message":"Payment failed","order_id":4711`.

## Log-Levels richtig wählen

[[log-level|Log-Levels]] sagen, wie dringend ein Eintrag ist. Laravel nutzt die acht Stufen aus RFC 5424.
Im Alltag reichen meist vier:

| Level | Wann? | Beispiel |
|---|---|---|
| `error` | Eine Aktion ist fehlgeschlagen, jemand hat ein Problem. | Zahlung endgültig gescheitert |
| `warning` | Ungewöhnlich, aber abgefangen. | Erster Versuch gescheitert, Wiederholung klappt |
| `info` | Wichtiges Geschäftsereignis. | Bestellung angelegt |
| `debug` | Details zum Entwickeln. | Warenkorb vor der Berechnung |

Darüber gibt es noch `critical`, `alert` und `emergency` für schwere Ausfälle sowie `notice` zwischen
info und warning. In [[produktionsumgebung|Produktion]] steht das minimale Level meist auf `info` – `debug`
wäre zu viel und zu teuer.

> [!TIPP]
> Faustregel: Wenn bei einem `error` niemand etwas tun muss, ist es kein `error`. Zu viele Fehler-Logs
> machen echte Fehler unsichtbar.

## Korrelations-IDs: der rote Faden

Bei vielen gleichzeitigen Anfragen liegen ihre Logzeilen bunt durcheinander. Eine
[[korrelations-id|Korrelations-ID]] ist der rote Faden: Jede Anfrage bekommt eine eindeutige
[[request-id|Request-ID]], und jede ihrer Zeilen trägt sie.

So läuft es ab:

1. Eine [[middleware|Middleware]] liest den Header `X-Request-Id`. Fehlt er, erzeugt sie eine neue ID.
2. Sie hängt die ID an den Log-Kontext – jede folgende Zeile hat sie automatisch.
3. Ruft die App einen anderen Dienst auf, schickt sie die ID im Header mit.
4. Die Antwort bekommt die ID ebenfalls als Header – Support kann sie nennen.

```php title="app/Http/Middleware/AssignRequestId.php (Ausschnitt)"
$id = $request->header('X-Request-Id') ?? (string) Str::uuid();
Log::shareContext(['request_id' => $id]);
$response = $next($request);
$response->headers->set('X-Request-Id', $id);
```

Mit Tracing (Modul 3) übernimmt die [[trace-id|Trace-ID]] diese Rolle über Dienstgrenzen hinweg.

> [!PRAXIS]
> Zeig die Request-ID auf deiner Fehlerseite an („Fehlercode: req-b2“). Meldet sich eine Kundin, findest
> du ihre Anfrage in Sekunden statt in Stunden.

## Logs mit jq auswerten

[[jq]] ist das Schweizer Taschenmesser für JSON im Terminal. Es wendet einen Filter auf jede Zeile an:

```bash title="Terminal"
jq -c 'select(.level == "error")' app.jsonl            # nur Fehler
jq -c 'select(.request_id == "req-b2")' app.jsonl      # eine Anfrage komplett
jq -r 'select(.level == "error") | .route' app.jsonl | sort | uniq -c   # Fehler pro Route
jq -s 'map(.duration_ms // 0) | max' app.jsonl         # -s: alle Zeilen als ein Array
```

`-c` gibt kompakte Zeilen aus, `-r` gibt Text ohne Anführungszeichen aus. Genau diese Abfragen stellst du
später in Loki mit LogQL – nur über Millionen Zeilen und mehrere Server.

## Zusammenfassung

- Strukturierte Logs sind JSON-Objekte mit festen Feldern statt Freitext – meist eine Zeile pro Ereignis.
- Feste `message`, veränderliche Werte als eigene Felder, Zahlen als Zahlen, Zeit in UTC.
- Log-Levels bewusst wählen: `error` nur, wenn wirklich etwas schiefging.
- Eine Korrelations-ID pro Anfrage verbindet alle Zeilen – auch über Dienstgrenzen hinweg per Header.
- Mit `jq` filterst, gruppierst und zählst du Logs direkt im Terminal.
