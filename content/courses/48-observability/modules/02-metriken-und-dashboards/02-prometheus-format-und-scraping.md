---
title: Prometheus – Textformat, Scraping und PromQL
summary: Wie eine App ihre Metriken unter /metrics anbietet, wie Prometheus sie per Scraping einsammelt und wie du mit PromQL Rate, Fehlerquote und p95 berechnest.
duration: 25
sources:
  - title: Prometheus – Exposition formats
    url: https://prometheus.io/docs/instrumenting/exposition_formats/
  - title: Prometheus – Configuration (scrape_config)
    url: https://prometheus.io/docs/prometheus/latest/configuration/configuration/
  - title: Prometheus – Querying basics
    url: https://prometheus.io/docs/prometheus/latest/querying/basics/
  - title: Prometheus – Metric and label naming
    url: https://prometheus.io/docs/practices/naming/
quiz:
  - type: single
    question: Wie kommen die Metriken einer App standardmäßig in Prometheus?
    options:
      - Die App schickt jede Messung sofort per E-Mail.
      - Prometheus ruft in festen Abständen die Adresse `/metrics` der App ab (Pull).
      - Prometheus liest die Logdatei der App.
      - Die App schreibt direkt in die Datenbank von Prometheus.
    answer: 1
    explanation: Prometheus arbeitet nach dem Pull-Prinzip. Es „scrapt“ jedes Ziel alle paar Sekunden. Fällt ein Ziel aus, merkt Prometheus das sofort – die Metrik `up` wird 0.
  - type: find-bug
    question: Diese Ausgabe unter `/metrics` ist ungültig. In welcher Zeile steckt der Fehler?
    language: text
    code: |
      # HELP http_request_duration_seconds Request duration.
      # TYPE http_request_duration_seconds histogram
      http_request_duration_seconds_bucket{le="0.1"} 240
      http_request_duration_seconds_bucket{le="0.5"} 900
      http_request_duration_seconds_bucket{le="+Inf"} 990
      http_request_duration_seconds_sum 412.5
      http_request_duration_seconds_count 1000
    bug_line: 5
    explanation: Der Bucket mit `le="+Inf"` zählt alle Messungen und muss genau so groß sein wie `_count`. 990 und 1000 widersprechen sich.
  - type: match
    question: Was berechnet welche PromQL-Abfrage?
    pairs:
      - { left: "rate(http_requests_total[5m])", right: "Anfragen pro Sekunde, gemittelt über 5 Minuten" }
      - { left: "sum by (route) (rate(http_requests_total[5m]))", right: "Anfragen pro Sekunde je Route" }
      - { left: "histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))", right: "geschätzte p95-Antwortzeit" }
      - { left: "up == 0", right: "Ziele, die gerade nicht erreichbar sind" }
    explanation: rate() macht aus einem Counter eine Rate pro Sekunde, sum by fasst Zeitreihen zusammen, histogram_quantile schätzt Perzentile aus Buckets.
  - type: cloze
    text: Counter enden laut Namenskonvention auf ___. Dauern misst man in der Basiseinheit ___.
    blanks:
      - [_total, total]
      - [Sekunden, seconds, Sekunde]
    explanation: Konventionen wie `_total` und `_seconds` machen Metriken selbsterklärend. Prometheus nutzt Basiseinheiten (Sekunden, Bytes), Grafana rechnet sie für die Anzeige um.
tasks:
  - id: metriken-schreiben
    type: terminal
    title: Metriken im Prometheus-Textformat schreiben
    description: |
      Du baust einen kleinen `/metrics`-Endpunkt nach. Lege im Ordner `exposition` die Datei `metrics.prom`
      an, so wie Prometheus sie beim Scrapen erwartet:

      1. Einen Counter `http_requests_total` mit `# HELP`- und `# TYPE`-Zeile und zwei Zeitreihen:
         `{route="/checkout",status="200"}` mit dem Wert `950` und `{route="/checkout",status="500"}` mit `50`.
      2. Ein Histogramm `http_request_duration_seconds` mit `# HELP`- und `# TYPE`-Zeile, den Buckets
         `le="0.1"` (`600`), `le="0.5"` (`940`) und `le="+Inf"` (`1000`), dazu `_sum` (`180.5`) und `_count` (`1000`).

      Ein Ordner `exposition` wird beim Vorbereiten angelegt – eine Vorlage gibt es nicht. Klicke zuerst
      auf **Aufgabe vorbereiten**.
    workdir: exposition
    setup: |
      echo "Lege hier metrics.prom an." > LIESMICH.txt
    checks:
      - type: file_exists
        path: metrics.prom
        message: Lege die Datei metrics.prom an.
      - type: file_contains
        path: metrics.prom
        pattern: "^# TYPE http_requests_total counter$"
        message: "Es fehlt die Zeile # TYPE http_requests_total counter."
      - type: file_contains
        path: metrics.prom
        pattern: "^# HELP http_requests_total \\S"
        message: "Es fehlt eine # HELP-Zeile mit Beschreibung für http_requests_total."
      - type: file_contains
        path: metrics.prom
        pattern: "^http_requests_total\\{route=\"/checkout\",\\s*status=\"500\"\\} 50$"
        message: Es fehlt die Zeitreihe http_requests_total{route="/checkout",status="500"} 50.
      - type: file_contains
        path: metrics.prom
        pattern: "^http_requests_total\\{route=\"/checkout\",\\s*status=\"200\"\\} 950$"
        message: Es fehlt die Zeitreihe http_requests_total{route="/checkout",status="200"} 950.
      - type: file_contains
        path: metrics.prom
        pattern: "^# TYPE http_request_duration_seconds histogram$"
        message: "Es fehlt die Zeile # TYPE http_request_duration_seconds histogram."
      - type: command
        run: grep -E '^http_request_duration_seconds_bucket' metrics.prom | sed -E 's/.*le="([^"]+)"\} ([0-9.]+)$/\1=\2/' | tr '\n' ' '
        stdout_matches: "^0\\.1=600 0\\.5=940 \\+Inf=1000 ?$"
        message: Die Buckets müssen in aufsteigender Reihenfolge le="0.1" 600, le="0.5" 940 und le="+Inf" 1000 lauten.
      - type: command
        run: awk '/^http_request_duration_seconds_count/ {c=$2} /le="\+Inf"/ {i=$2} /^http_request_duration_seconds_sum/ {s=$2} END {print c, i, s}' metrics.prom
        stdout_equals: "1000 1000 180.5"
        message: Es fehlen _sum (180.5) oder _count (1000) – und _count muss gleich dem +Inf-Bucket sein.
      - type: command
        run: awk '/^# TYPE/ {t[$3]=NR} /^http_request_duration_seconds/ && !f {f=NR} /^http_requests_total/ && !g {g=NR} END {exit !(t["http_requests_total"] < g && t["http_request_duration_seconds"] < f)}' metrics.prom
        message: Jede "# TYPE"-Zeile muss vor der ersten Zeitreihe ihrer Metrik stehen.
    hints:
      - "Aufbau: `# HELP name Beschreibung`, dann `# TYPE name typ`, dann die Zeitreihen `name{label=\"wert\"} zahl`."
      - "Die Bucket-Zeilen heißen `http_request_duration_seconds_bucket{le=\"0.1\"} 600` usw. Danach folgen `_sum` und `_count` ohne Label."
      - "Schreibe die Datei am einfachsten mit `cat > metrics.prom <<'EOF'` … `EOF`."
    solution: |
      ```bash
      cd exposition
      cat > metrics.prom <<'EOF'
      # HELP http_requests_total Total number of HTTP requests.
      # TYPE http_requests_total counter
      http_requests_total{route="/checkout",status="200"} 950
      http_requests_total{route="/checkout",status="500"} 50
      # HELP http_request_duration_seconds HTTP request duration.
      # TYPE http_request_duration_seconds histogram
      http_request_duration_seconds_bucket{le="0.1"} 600
      http_request_duration_seconds_bucket{le="0.5"} 940
      http_request_duration_seconds_bucket{le="+Inf"} 1000
      http_request_duration_seconds_sum 180.5
      http_request_duration_seconds_count 1000
      EOF
      ```
  - id: quantil-aus-buckets
    type: code
    language: js
    title: Ein Perzentil aus Buckets schätzen
    description: |
      Prometheus speichert keine Einzelwerte, nur Bucket-Zähler. `histogram_quantile` schätzt daraus ein
      Perzentil. Baue das vereinfacht nach: `quantile(q, buckets)`.

      - `buckets` ist aufsteigend sortiert, jeder Eintrag `{ le, count }` ist **kumulativ** (alle Werte ≤ `le`).
        Der letzte Bucket hat `le: Infinity`.
      - Gesucht ist der Rang `q * gesamt` (gesamt = `count` des letzten Buckets).
      - Finde den ersten Bucket mit `count >= rang` und interpoliere **linear** zwischen der Untergrenze
        (`le` des vorigen Buckets, beim ersten Bucket `0`) und seiner Obergrenze.
      - Landet der Rang im `Infinity`-Bucket, gib die Obergrenze des vorletzten Buckets zurück.
      - Bei gesamt `0` gib `NaN` zurück.
    starter: |
      function quantile(q, buckets) {
        const total = buckets[buckets.length - 1].count
        const rank = q * total
        // finde den passenden Bucket und interpoliere
      }
    tests:
      - name: Median im ersten Bucket
        code: |
          const b = [{ le: 0.1, count: 600 }, { le: 0.5, count: 940 }, { le: Infinity, count: 1000 }]
          assertTrue(Math.abs(quantile(0.5, b) - 0.1 * 500 / 600) < 1e-9)
      - name: p90 im zweiten Bucket wird interpoliert
        code: |
          const b = [{ le: 0.1, count: 600 }, { le: 0.5, count: 940 }, { le: Infinity, count: 1000 }]
          assertTrue(Math.abs(quantile(0.9, b) - (0.1 + 0.4 * (900 - 600) / (940 - 600))) < 1e-9)
      - name: p99 im Infinity-Bucket liefert die letzte endliche Grenze
        code: |
          const b = [{ le: 0.1, count: 600 }, { le: 0.5, count: 940 }, { le: Infinity, count: 1000 }]
          assertEqual(quantile(0.99, b), 0.5)
      - name: keine Messungen ergibt NaN
        code: |
          assertTrue(Number.isNaN(quantile(0.5, [{ le: 0.1, count: 0 }, { le: Infinity, count: 0 }])))
    solution: |
      function quantile(q, buckets) {
        const total = buckets[buckets.length - 1].count
        if (total === 0) return NaN
        const rank = q * total
        let lowerBound = 0
        let lowerCount = 0
        for (let i = 0; i < buckets.length; i++) {
          const { le, count } = buckets[i]
          if (count >= rank) {
            if (le === Infinity) return buckets[i - 1].le
            return lowerBound + (le - lowerBound) * (rank - lowerCount) / (count - lowerCount)
          }
          lowerBound = le
          lowerCount = count
        }
        return NaN
      }
---
Du weißt jetzt, *was* du messen willst. Aber wie kommen die Zahlen aus deiner Laravel-App in eine
Datenbank, wo du sie abfragen kannst? Der Platzhirsch dafür ist Prometheus – und sein schlichtes
Textformat ist so verbreitet, dass auch viele andere Werkzeuge es sprechen.

## Pull statt Push: Scraping

[[prometheus|Prometheus]] ist eine Datenbank für Zeitreihen mit eigener Abfragesprache. Es holt sich
die Metriken selbst ab – dieses Abholen heißt [[scraping|Scraping]].

1. Deine App bietet einen [[endpunkt|Endpunkt]] an, meist `GET /metrics`.
2. Prometheus ruft ihn alle 15–60 Sekunden ab (`scrape_interval`).
3. Jede Antwort enthält den **aktuellen Stand** aller Metriken. Prometheus speichert ihn mit Zeitstempel.

Jedes abgefragte Ziel ist ein [[scrape-target|Scrape-Target]]. Für jedes Ziel legt Prometheus selbst die
Metrik `up` an: `1` = erreichbar, `0` = nicht erreichbar. Damit hast du nebenbei eine Verfügbarkeitsprüfung.

> [!TIPP]
> Kurzlebige Batch-Jobs leben oft nicht lange genug, um gescrapt zu werden. Dafür gibt es das
> [Pushgateway](https://prometheus.io/docs/practices/pushing/) – nutze es aber nur für solche Sonderfälle.

## Das Textformat

Was unter `/metrics` steht, folgt dem [[exposition-format|Exposition-Format]]: einfacher Text, eine
Messung pro Zeile.

```text title="GET /metrics"
# HELP http_requests_total Total number of HTTP requests.
# TYPE http_requests_total counter
http_requests_total{route="/checkout",status="200"} 950
http_requests_total{route="/checkout",status="500"} 50
# HELP http_request_duration_seconds HTTP request duration.
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 600
http_request_duration_seconds_bucket{le="0.5"} 940
http_request_duration_seconds_bucket{le="+Inf"} 1000
http_request_duration_seconds_sum 180.5
http_request_duration_seconds_count 1000
```

| Regel | Bedeutung |
|---|---|
| `# HELP` | Beschreibung, höchstens einmal pro Metrik |
| `# TYPE` | `counter`, `gauge`, `histogram`, `summary` oder `untyped` – **vor** der ersten Zeitreihe |
| Histogramm | Buckets aufsteigend nach `le`, `le="+Inf"` ist Pflicht und gleich `_count` |
| Namen | `snake_case`, Counter auf `_total`, Einheit im Namen: `_seconds`, `_bytes` |

## Prometheus konfigurieren

Welche Ziele Prometheus scrapt, steht in `prometheus.yml`:

```yaml title="prometheus.yml"
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: laravel
    metrics_path: /metrics
    static_configs:
      - targets: ["app:8000"]
  - job_name: node
    static_configs:
      - targets: ["node-exporter:9100"]
```

Für Dinge, die du nicht selbst instrumentierst – Server, Datenbank, PHP-FPM – gibt es fertige
[[exporter|Exporter]]: kleine Programme, die Messwerte im Prometheus-Format anbieten (etwa
`node_exporter` für CPU, Speicher und Festplatte).

> [!PRAXIS]
> Laravel bringt keinen eingebauten `/metrics`-Endpunkt mit. Üblich sind ein Community-Paket, ein
> OpenTelemetry-SDK (Modul 3) oder eine eigene Route, die Zähler aus Redis ausgibt. Schütze den Endpunkt
> – er gehört ins interne Netz, nicht ins Internet.

## PromQL: Fragen an die Metriken

[[promql|PromQL]] ist die Abfragesprache von Prometheus. Vier Bausteine reichen für den Anfang:

```text title="PromQL"
# Rate: Anfragen pro Sekunde über die letzten 5 Minuten
sum(rate(http_requests_total[5m]))

# Errors: Anteil der 5xx-Antworten
sum(rate(http_requests_total{status=~"5.."}[5m]))
  / sum(rate(http_requests_total[5m]))

# Duration: geschätztes p95 aus den Buckets
histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))

# Nach Route aufgeteilt
sum by (route) (rate(http_requests_total[5m]))
```

`rate()` rechnet aus einem Counter die Steigung pro Sekunde aus – und kommt mit Neustarts zurecht, bei
denen der Counter auf 0 fällt. `[5m]` ist das Zeitfenster.

In den geschweiften Klammern wählst du Zeitreihen über ihre Labels aus. Vier Vergleiche gibt es:

| Selektor | Bedeutung | Beispiel |
|---|---|---|
| `=` | genau gleich | `route="/checkout"` |
| `!=` | ungleich | `status!="200"` |
| `=~` | passt auf regulären Ausdruck | `status=~"5.."` (alle 5xx) |
| `!~` | passt nicht auf regulären Ausdruck | `route!~"/health.*"` |

`sum by (route)` fasst alle Zeitreihen zusammen und behält nur das Label `route` – so bekommst du eine
Kurve pro Route statt einer pro Server und Statuscode.

> [!FEHLER]
> **`rate()` auf einen Gauge anwenden** oder einen Counter ohne `rate()` anzeigen. Der rohe Counter
> wächst einfach immer weiter – die Kurve sagt nichts. Counter immer mit `rate()`, Gauges direkt.

## Zusammenfassung

- Prometheus **scrapt** Ziele regelmäßig per HTTP (Pull); die Metrik `up` zeigt, ob ein Ziel erreichbar ist.
- Das Textformat: `# HELP`, `# TYPE`, dann Zeitreihen `name{label="wert"} zahl`.
- Histogramme bestehen aus `_bucket{le=…}`, `_sum` und `_count`; `le="+Inf"` muss gleich `_count` sein.
- In `prometheus.yml` legst du `scrape_interval` und die `scrape_configs` mit ihren Zielen fest.
- PromQL-Grundlagen: `rate()`, `sum by (…)`, Fehlerquote als Bruch und `histogram_quantile()` für Perzentile.
