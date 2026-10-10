---
title: Logs zentral sammeln mit Loki und LogQL
summary: Wie Loki Logs über Labels organisiert, warum Labels wenige Werte haben müssen und wie du mit LogQL filterst, JSON zerlegst und aus Logs Kennzahlen machst.
duration: 25
sources:
  - title: Grafana Loki – Query (LogQL)
    url: https://grafana.com/docs/loki/latest/query/
  - title: Grafana Loki – Metric queries
    url: https://grafana.com/docs/loki/latest/query/metric_queries/
  - title: Grafana Loki – Labels
    url: https://grafana.com/docs/loki/latest/get-started/labels/
  - title: Grafana Loki – Promtail ist veraltet, Nachfolger Alloy
    url: https://grafana.com/docs/loki/latest/send-data/promtail/
quiz:
  - type: single
    question: Was indexiert Loki – und was nicht?
    options:
      - Jedes Wort jeder Logzeile, wie eine Suchmaschine.
      - Nur die Labels und den Zeitstempel; der Inhalt der Zeile wird bei der Abfrage durchsucht.
      - Nichts, Loki speichert nur Metriken.
      - Nur Logzeilen mit Level error.
    answer: 1
    explanation: Loki indexiert bewusst wenig – nur Labels. Das macht Speichern billig. Den Inhalt durchsucht Loki bei der Abfrage, eingegrenzt durch den Stream-Selektor.
  - type: multiple
    question: Welche Felder eignen sich als Loki-Labels?
    options:
      - "`app` (z. B. shop, admin)"
      - "`env` (production, staging)"
      - "`request_id`"
      - "`user_email`"
    answers: [0, 1]
    explanation: Labels brauchen wenige, feste Werte. Jede neue Label-Kombination ist ein eigener Stream. request_id oder E-Mail-Adressen würden Millionen Streams erzeugen – sie bleiben im Inhalt der Zeile.
  - type: match
    question: Was macht welcher Teil der LogQL-Abfrage?
    pairs:
      - { left: "{app=\"shop\", env=\"production\"}", right: "wählt die Streams anhand der Labels aus" }
      - { left: "|= \"Payment\"", right: "behält nur Zeilen, die diesen Text enthalten" }
      - { left: "| json", right: "zerlegt die JSON-Zeile in Felder" }
      - { left: "| status >= 500", right: "filtert nach einem extrahierten Feld" }
    explanation: Eine LogQL-Abfrage beginnt immer mit dem Stream-Selektor, danach folgt eine Pipeline aus Filtern und Parsern.
  - type: cloze
    text: "Die Anzahl der Fehlerzeilen pro 5 Minuten berechnest du mit sum(___({app=\"shop\"} | json | level=\"error\" [5m]))."
    blanks:
      - [count_over_time]
    explanation: count_over_time zählt Logzeilen in einem Zeitfenster. So wird aus Logs eine Kennzahl, die du in Grafana anzeigen oder für Alarme nutzen kannst.
tasks:
  - id: labels-oder-inhalt
    type: dragdrop
    title: Label oder Inhalt der Logzeile?
    description: Entscheide für jedes Feld, ob es ein Loki-Label werden soll oder im Inhalt der Logzeile bleibt.
    targets:
      - { id: label, label: Als Label (wenige feste Werte) }
      - { id: inhalt, label: Im Inhalt der Zeile }
    items:
      - { label: "app = shop", target: label }
      - { label: "env = production", target: label }
      - { label: "container = queue-worker", target: label }
      - { label: "request_id = req-b2", target: inhalt }
      - { label: "order_id = 4711", target: inhalt }
      - { label: "duration_ms = 10120", target: inhalt }
    hints:
      - Frag dich, wie viele verschiedene Werte das Feld in einer Woche annimmt. Zehn? Dann Label. Millionen? Dann Inhalt.
  - id: logcli-suche
    type: simulated
    title: Den Checkout-Fehler in Loki finden
    description: |
      Auf deinem Rechner läuft Loki mit den Logs der App, und das Kommandozeilen-Werkzeug `logcli` ist
      eingerichtet. Finde in drei Schritten die Ursache für die 502-Fehler beim Checkout:

      1. Zeige alle Zeilen der App `shop` aus `production`, die den Text `Payment` enthalten. Nutze
         `logcli query` mit dem Stream-Selektor `{app="shop", env="production"}` und dem Filter `|= "Payment"`.
      2. Zerlege die Zeilen mit `| json` und behalte nur Zeilen mit `level="error"`.
      3. Zähle die Fehler pro Route über 5 Minuten: `sum by (route) (count_over_time(… [5m]))`.

      Setze die Abfrage jeweils in einfache Anführungszeichen.
    prompt: "du@laptop:~$"
    steps:
      - expect: "^logcli\\s+query\\s+(--\\S+\\s+)*'\\{\\s*app=\"shop\",\\s*env=\"production\"\\s*\\}\\s*\\|=\\s*\"Payment\"'\\s*(--\\S+)?\\s*$"
        output: |
          2026-10-05T13:55:13Z {app="shop", env="production"} {"level":"error","message":"Payment request failed","request_id":"req-b2","route":"POST /checkout","error":"connection timed out after 10000 ms"}
          2026-10-05T13:55:30Z {app="shop", env="production"} {"level":"error","message":"Payment request failed","request_id":"req-d4","route":"POST /checkout","error":"connection timed out after 10000 ms"}
          2026-10-05T13:55:41Z {app="shop", env="production"} {"level":"info","message":"Payment captured","request_id":"req-f6","route":"POST /checkout"}
        hint: "logcli query '{app=\"shop\", env=\"production\"} |= \"Payment\"'"
      - expect: "^logcli\\s+query\\s+(--\\S+\\s+)*'\\{\\s*app=\"shop\",\\s*env=\"production\"\\s*\\}\\s*(\\|=\\s*\"Payment\"\\s*)?\\|\\s*json\\s*\\|\\s*level\\s*=\\s*\"error\"'\\s*(--\\S+)?\\s*$"
        output: |
          2026-10-05T13:55:13Z {app="shop", env="production", level="error", route="POST /checkout"} {"level":"error","message":"Payment request failed","request_id":"req-b2","error":"connection timed out after 10000 ms"}
          2026-10-05T13:55:30Z {app="shop", env="production", level="error", route="POST /checkout"} {"level":"error","message":"Payment request failed","request_id":"req-d4","error":"connection timed out after 10000 ms"}
          2026-10-05T13:55:31Z {app="shop", env="production", level="error", route="POST /contact"} {"level":"error","message":"Mail transport unavailable","request_id":"req-e5","error":"smtp connect failed"}
        hint: "logcli query '{app=\"shop\", env=\"production\"} | json | level=\"error\"'"
      - expect: "^logcli\\s+query\\s+(--\\S+\\s+)*'sum\\s+by\\s*\\(\\s*route\\s*\\)\\s*\\(\\s*count_over_time\\s*\\(\\s*\\{\\s*app=\"shop\",\\s*env=\"production\"\\s*\\}\\s*\\|\\s*json\\s*\\|\\s*level\\s*=\\s*\"error\"\\s*\\[5m\\]\\s*\\)\\s*\\)'\\s*(--\\S+)?\\s*$"
        output: |
          [
            { "metric": { "route": "POST /checkout" }, "value": [1791208530, "2"] },
            { "metric": { "route": "POST /contact" },  "value": [1791208530, "1"] }
          ]
        hint: "logcli query 'sum by (route) (count_over_time({app=\"shop\", env=\"production\"} | json | level=\"error\" [5m]))'"
    responses:
      - match: "^logcli\\s*$"
        output: "usage: logcli [<flags>] <command> [<args> ...]  – probiere: logcli query '<LogQL>'"
      - match: "^logcli\\s+labels"
        output: |
          app
          container
          env
---
Deine App läuft auf drei Servern, dazu ein Queue-Worker und ein Scheduler. Jeder schreibt eigene Logs.
Per SSH auf jeden Server zu gehen und `grep` zu tippen, dauert im Incident viel zu lange. Du brauchst
einen zentralen Ort für alle Logs – mit einer Suche, die so schnell ist wie `jq`, nur über alles.

## Loki: Logs wie Metriken organisieren

[[loki|Loki]] ist ein Log-Speicher von Grafana Labs. Seine Idee: Logs werden nicht wie in einer
Suchmaschine Wort für Wort indexiert, sondern nur über ihre **Labels** – genau wie Metriken in Prometheus.

| Teil | Wird indexiert? | Beispiel |
|---|---|---|
| Labels | ja | `{app="shop", env="production"}` |
| Zeitstempel | ja | `2026-10-05T13:55:13Z` |
| Inhalt der Zeile | nein, wird bei der Abfrage durchsucht | `{"level":"error", …}` |

Alle Zeilen mit derselben Label-Kombination bilden einen [[log-stream|Log-Stream]]. Weil Loki wenig
indexiert, ist das Speichern günstig. Die Abfrage grenzt zuerst über Labels die Streams ein und
durchsucht dann nur deren Inhalt.

## Labels: wenige, feste Werte

Für Loki-Labels gilt dieselbe Regel wie bei Prometheus: **niedrige Kardinalität**.

| Gute Labels | Schlechte Labels |
|---|---|
| `app`, `env`, `container`, `namespace` | `request_id`, `user_id`, `order_id`, `ip` |
| ein paar Dutzend Werte | unbegrenzt viele Werte |

Jede neue Label-Kombination ist ein neuer Stream. Millionen winziger Streams machen Loki langsam und
teuer. Felder wie `request_id` bleiben im Inhalt – du findest sie trotzdem, mit einem Filter.

> [!FEHLER]
> **„Damit man schneller suchen kann“ die `request_id` als Label.** Das Gegenteil passiert: Loki erzeugt
> für jede Anfrage einen eigenen Stream. Eine Zeilensuche wie `|= "req-b2"` innerhalb von
> `{app="shop"}` ist für Loki genau der vorgesehene Weg.

## Wie kommen die Logs zu Loki?

Deine App schreibt JSON nach stderr (Modul 1). Ein Agent liest diese Ströme und schickt sie an Loki:

- **[[grafana-alloy|Grafana Alloy]]** ist der empfohlene Agent. Er liest Container-Logs oder Dateien,
  vergibt Labels und kann auch Metriken und Traces weiterleiten.
- Der ältere Agent *Promtail* ist seit März 2026 am Ende seiner Unterstützung – neue Projekte nutzen Alloy.

> [!PRAXIS]
> Die Labels vergibt der Agent, nicht die App. Typisch sind `app`, `env` und `container` aus den
> Metadaten der Container-Plattform. Die App liefert nur saubere JSON-Zeilen.

## LogQL: Logs abfragen

[[logql|LogQL]] sieht absichtlich aus wie PromQL. Jede Abfrage beginnt mit einem **Stream-Selektor**,
danach folgt eine **Pipeline**:

```text title="LogQL"
{app="shop", env="production"}                       # Streams auswählen
{app="shop"} |= "Payment"                            # Zeile enthält Text
{app="shop"} != "healthcheck"                        # Zeile enthält Text nicht
{app="shop"} |~ "timed? ?out"                        # regulärer Ausdruck
{app="shop"} | json | level="error"                  # JSON zerlegen, nach Feld filtern
{app="shop"} | json | duration_ms > 1000             # Zahlenvergleich
{app="shop"} | json | line_format "{{.route}} {{.message}}"   # Ausgabe umformen
```

Der Parser `| json` macht aus jedem JSON-Feld ein temporäres Label, nach dem du danach filtern kannst.
Für Logs im Format `key=value` gibt es `| logfmt`.

> [!TIPP]
> Filtere so früh wie möglich mit `|=`. Ein Textfilter vor `| json` spart Loki viel Arbeit, weil nur die
> passenden Zeilen zerlegt werden.

## Aus Logs werden Kennzahlen

LogQL kann auch zählen. Diese *Metrik-Abfragen* liefern Zeitreihen wie Prometheus:

```text title="LogQL – Metrik-Abfragen"
count_over_time({app="shop"} | json | level="error" [5m])          # Fehlerzeilen pro 5 Minuten
sum by (route) (count_over_time({app="shop"} | json | level="error" [5m]))
rate({app="shop"} |= "Payment request failed" [1m])                # Zeilen pro Sekunde
```

Das ist praktisch für Ereignisse, für die es (noch) keine Metrik gibt. Für dauerhafte Kennzahlen wie
die Fehlerquote einer Route sind echte Metriken aber günstiger und schneller.

## Zusammenfassung

- Loki indexiert nur **Labels** und Zeitstempel; der Inhalt wird bei der Abfrage durchsucht.
- Labels brauchen **wenige, feste Werte** (`app`, `env`, `container`) – IDs bleiben im Inhalt.
- **Grafana Alloy** sammelt die Logs der Container ein und schickt sie an Loki; Promtail ist veraltet.
- LogQL: Stream-Selektor `{…}`, dann Filter (`|=`, `!=`, `|~`), Parser (`| json`) und Feldfilter.
- Mit `count_over_time`, `rate` und `sum by` machst du aus Logs Kennzahlen für Dashboards.
