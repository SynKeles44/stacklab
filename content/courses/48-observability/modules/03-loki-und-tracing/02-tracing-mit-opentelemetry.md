---
title: Tracing mit OpenTelemetry
summary: Was Traces und Spans sind, wie der Kontext per traceparent-Header von Dienst zu Dienst wandert und wie OpenTelemetry, OTLP und der Collector zusammenspielen – ein Überblick.
duration: 25
sources:
  - title: OpenTelemetry – Traces
    url: https://opentelemetry.io/docs/concepts/signals/traces/
  - title: OpenTelemetry – Context propagation
    url: https://opentelemetry.io/docs/concepts/context-propagation/
  - title: W3C Trace Context
    url: https://www.w3.org/TR/trace-context/
  - title: OpenTelemetry – Collector
    url: https://opentelemetry.io/docs/collector/
  - title: OpenTelemetry – PHP zero-code instrumentation
    url: https://opentelemetry.io/docs/zero-code/php/auto/
quiz:
  - type: single
    question: Was ist ein Span?
    options:
      - Ein kompletter Weg einer Anfrage durch alle Dienste.
      - Ein einzelner, zeitlich begrenzter Arbeitsschritt mit Name, Start, Dauer und Attributen – Teil eines Traces.
      - Eine Logzeile im JSON-Format.
      - Ein Bucket eines Histogramms.
    answer: 1
    explanation: Ein Trace ist der ganze Weg, ein Span ein einzelner Schritt darin – etwa eine SQL-Abfrage oder ein HTTP-Aufruf. Spans haben eine Eltern-Kind-Beziehung.
  - type: cloze
    text: "Im Header traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01 ist der zweite Teil die ___-ID und der dritte Teil die ID des Eltern-___."
    blanks:
      - [Trace, trace]
      - [Spans, Span, spans, span]
    explanation: Aufbau ist version-traceid-parentid-flags. Die Trace-ID bleibt über alle Dienste gleich, die Parent-ID zeigt auf den Span, der den Aufruf ausgelöst hat. Flag 01 heißt „gesampelt“.
  - type: multiple
    question: Welche Aufgaben übernimmt der OpenTelemetry Collector?
    options:
      - Telemetrie per OTLP empfangen
      - Daten verarbeiten, z. B. bündeln, Attribute entfernen, sampeln
      - Daten an einen oder mehrere Speicher wie Tempo, Prometheus oder Loki exportieren
      - Den PHP-Code automatisch reparieren
    answers: [0, 1, 2]
    explanation: Der Collector ist eine Zwischenstation aus Receivern, Processors und Exportern. So muss die App nur OTLP sprechen und kennt keine konkreten Speicher.
  - type: single
    question: Ein Trace endet an der Grenze zum Zahlungsdienst – dessen Spans tauchen als eigener, unverbundener Trace auf. Was ist die wahrscheinlichste Ursache?
    options:
      - Der Zahlungsdienst hat zu wenig Arbeitsspeicher.
      - Der ausgehende HTTP-Aufruf schickt keinen traceparent-Header mit – die Kontext-Weitergabe fehlt.
      - Der Trace war zu lang und wurde gekürzt.
      - Grafana zeigt nur einen Dienst pro Trace an.
    answer: 1
    explanation: Ohne Kontext-Weitergabe weiß der Zahlungsdienst nichts vom laufenden Trace und beginnt einen neuen. Instrumentierte HTTP-Clients setzen den Header automatisch.
tasks:
  - id: kontext-weitergabe
    type: order
    title: Wie wandert der Trace-Kontext?
    description: Bringe die Schritte einer verteilten Anfrage in die richtige Reihenfolge.
    items:
      - Die Laravel-App empfängt POST /checkout ohne traceparent und startet einen neuen Trace mit Root-Span.
      - Für die Datenbankabfrage entsteht ein Kind-Span mit derselben Trace-ID.
      - Vor dem Aufruf des Zahlungsdienstes schreibt der HTTP-Client den Header traceparent mit Trace-ID und eigener Span-ID.
      - Der Zahlungsdienst liest traceparent und legt seine Spans als Kinder in denselben Trace.
      - Beide Dienste schicken ihre fertigen Spans per OTLP an den Collector.
      - Der Collector exportiert die Spans an Tempo, wo Grafana sie als einen Wasserfall anzeigt.
    hints:
      - Erst entsteht der Trace, dann wird er weitergereicht, ganz am Ende werden die Daten gespeichert.
  - id: traceparent-parsen
    type: code
    language: js
    title: Den traceparent-Header lesen
    description: |
      Schreibe `parseTraceparent(header)`. Der Header hat das Format `version-traceid-parentid-flags`:

      - `version`: 2 Hex-Zeichen, wir akzeptieren nur `00`,
      - `traceid`: 32 Hex-Zeichen (Kleinbuchstaben), darf nicht nur aus Nullen bestehen,
      - `parentid`: 16 Hex-Zeichen (Kleinbuchstaben), darf nicht nur aus Nullen bestehen,
      - `flags`: 2 Hex-Zeichen; ist das niedrigste Bit gesetzt, wurde der Trace gesampelt.

      Gib bei gültigem Header `{ traceId, parentId, sampled }` zurück (sampled als Boolean), sonst `null`.
    starter: |
      function parseTraceparent(header) {
        const parts = header.split('-')
        // prüfe Aufbau und Werte
        return null
      }
    tests:
      - name: gültiger, gesampelter Header
        code: |
          assertDeepEqual(
            parseTraceparent('00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'),
            { traceId: '4bf92f3577b34da6a3ce929d0e0e4736', parentId: '00f067aa0ba902b7', sampled: true }
          )
      - name: nicht gesampelt
        code: |
          assertEqual(parseTraceparent('00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00').sampled, false)
      - name: Trace-ID nur aus Nullen ist ungültig
        code: |
          assertEqual(parseTraceparent('00-00000000000000000000000000000000-00f067aa0ba902b7-01'), null)
      - name: falsche Länge und leerer String sind ungültig
        code: |
          assertEqual(parseTraceparent('00-4bf92f35-00f067aa0ba902b7-01'), null)
          assertEqual(parseTraceparent(''), null)
      - name: Großbuchstaben und andere Versionen sind ungültig
        code: |
          assertEqual(parseTraceparent('00-4BF92F3577B34DA6A3CE929D0E0E4736-00f067aa0ba902b7-01'), null)
          assertEqual(parseTraceparent('ff-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'), null)
    solution: |
      function parseTraceparent(header) {
        const match = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/.exec(header)
        if (!match) return null
        const [, traceId, parentId, flags] = match
        if (/^0+$/.test(traceId) || /^0+$/.test(parentId)) return null
        return { traceId, parentId, sampled: (parseInt(flags, 16) & 1) === 1 }
      }
---
Das Dashboard zeigt: `POST /checkout` braucht seit 13:55 zehn Sekunden. Aber warum? Die Anfrage lädt
den Warenkorb, fragt die Datenbank, ruft den Zahlungsdienst, der wiederum Betrugsregeln prüft. Irgendwo
in dieser Kette geht die Zeit verloren. Ein Trace zeigt dir genau, wo.

![Ein Trace als Wasserfall: Spans der Laravel-App und des Zahlungsdienstes](/assets/observability/trace-wasserfall.svg)

## Traces und Spans

Ein [[trace|Trace]] beschreibt den Weg **einer** Anfrage durch dein System. Er besteht aus
[[span|Spans]] – je einer pro Arbeitsschritt.

| Feld eines Spans | Beispiel |
|---|---|
| Name | `SELECT carts`, `POST payment-api/charges` |
| [[trace-id\|Trace-ID]] | `4bf92f3577b34da6a3ce929d0e0e4736` (gleich für alle Spans des Traces) |
| Span-ID und Parent-ID | eigene ID und die ID des Eltern-Spans |
| Start und Dauer | 13:55:03.080, 340 ms |
| Attribute | `http.route=/checkout`, `db.system=postgresql` |
| Status | `OK` oder `ERROR` |

Der erste Span ohne Eltern heißt *Root-Span*. Im Wasserfall siehst du sofort: Der Aufruf an den
Zahlungsdienst dauert 340 von 480 Millisekunden – dort lohnt sich die Suche.

> [!MERKSATZ]
> Ein Trace ist ein Baum aus Spans mit **einer** gemeinsamen Trace-ID. Die Länge der Balken zeigt, wo die
> Zeit hingeht – parallel und nacheinander.

## Kontext-Weitergabe

Damit der Zahlungsdienst seine Spans in **denselben** Trace hängt, muss er die Trace-ID kennen. Das
nennt man [[kontext-propagation|Kontext-Weitergabe]] (*context propagation*). Über HTTP geschieht sie
mit dem standardisierten Header [[traceparent]] aus der W3C-Spezifikation *Trace Context*:

```text title="HTTP-Header beim Aufruf des Zahlungsdienstes"
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
             │  │                                │                └ Flags (01 = gesampelt)
             │  │                                └ Span-ID des Aufrufers (wird Parent)
             │  └ Trace-ID (32 Hex-Zeichen)
             └ Version
```

Bei Queue-Jobs funktioniert es genauso: Der Kontext wird in die Job-Daten geschrieben und vom Worker
wieder gelesen. So landet auch ein Hintergrund-Job im richtigen Trace.

> [!FEHLER]
> **Abgerissene Traces.** Ein HTTP-Client ohne Instrumentierung schickt keinen `traceparent` mit. Der
> nächste Dienst startet dann einen neuen Trace – im Wasserfall endet die Kette einfach. Prüfe bei
> fehlenden Spans zuerst, ob der Header ankommt.

## OpenTelemetry: ein Standard für alle Signale

[[opentelemetry|OpenTelemetry]] (kurz OTel) ist ein herstellerneutraler Standard für Telemetrie. Er
besteht aus:

| Baustein | Aufgabe |
|---|---|
| API und SDK pro Sprache | Spans, Metriken und Logs im Code erzeugen |
| [[instrumentierung\|Instrumentierung]] | fertige Bausteine für Frameworks, HTTP-Clients, Datenbanken |
| [[otlp\|OTLP]] | das Protokoll, mit dem Telemetrie verschickt wird (Port 4317 gRPC, 4318 HTTP) |
| [[otel-collector\|Collector]] | empfängt, verarbeitet und exportiert Telemetrie |

Der Vorteil: Deine App spricht nur OTLP. Ob die Traces in Tempo, Jaeger oder bei einem kommerziellen
Anbieter landen, entscheidet die Konfiguration des Collectors – nicht dein Code.

## OpenTelemetry in PHP und Laravel

Für PHP gibt es eine Erweiterung `opentelemetry` (per PECL) und Composer-Pakete, die Frameworks
automatisch instrumentieren, darunter Laravel. Die Konfiguration läuft über Umgebungsvariablen:

```bash title=".env bzw. Container-Umgebung"
OTEL_PHP_AUTOLOAD_ENABLED=true
OTEL_SERVICE_NAME=shop
OTEL_TRACES_EXPORTER=otlp
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
OTEL_PROPAGATORS=baggage,tracecontext
```

Automatische Instrumentierung liefert Spans für Requests, Datenbankabfragen und HTTP-Aufrufe. Eigene
Spans für fachliche Schritte („Preise berechnen“) ergänzt du von Hand. Die genauen Paketnamen findest du
in der [OpenTelemetry-Registry](https://opentelemetry.io/ecosystem/registry/?language=php).

> [!PRAXIS]
> Schreib die aktuelle `trace_id` in jede Logzeile. Dann springst du in Grafana mit einem Klick vom
> langsamen Span zu den Logs genau dieser Anfrage – die Verbindung der drei Signale aus Lektion 1.

## Sampling: nicht alles speichern

Bei vielen Anfragen pro Sekunde wird es teuer, jeden Trace zu speichern. [[sampling|Sampling]] wählt
einen Teil aus:

- **Head Sampling:** Am Anfang wird entschieden, z. B. „10 % aller Traces“. Einfach und billig – das
  Flag im `traceparent` gibt die Entscheidung an alle Dienste weiter.
- **Tail Sampling:** Der Collector entscheidet erst am Ende, z. B. „alle fehlerhaften und langsamen
  Traces behalten, vom Rest 5 %“. Aufwendiger, aber du verlierst die interessanten Fälle nicht.

## Zusammenfassung

- Ein **Trace** ist der Weg einer Anfrage, ein **Span** ein Arbeitsschritt mit Name, Dauer und Attributen.
- Alle Spans eines Traces teilen die **Trace-ID**; Spans bilden über die Parent-ID einen Baum.
- Der Header **traceparent** (`version-traceid-parentid-flags`) gibt den Kontext an andere Dienste weiter.
- **OpenTelemetry** standardisiert API, SDKs, Instrumentierung und das Protokoll **OTLP**; der **Collector** leitet weiter.
- **Sampling** begrenzt die Datenmenge: Head Sampling am Anfang, Tail Sampling nach Ende des Traces.
