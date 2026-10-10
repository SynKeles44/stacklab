---
title: Dashboards mit Grafana
summary: Wie Grafana Datenquellen, Panels und Variablen zu Dashboards verbindet, wie ein gutes RED-Dashboard aussieht und warum du Dashboards als JSON-Code versionierst.
duration: 20
sources:
  - title: Grafana – Dashboards
    url: https://grafana.com/docs/grafana/latest/dashboards/
  - title: Grafana – Dashboard JSON model
    url: https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/view-dashboard-json-model/
  - title: Grafana – Provisioning
    url: https://grafana.com/docs/grafana/latest/administration/provisioning/
  - title: Grafana – Dashboard best practices
    url: https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/best-practices/
quiz:
  - type: single
    question: Was ist eine Datenquelle (Data Source) in Grafana?
    options:
      - Ein Ordner mit Screenshots.
      - Eine Verbindung zu einem Speicher wie Prometheus oder Loki, aus dem Panels ihre Daten abfragen.
      - Eine CSV-Datei, die Grafana selbst schreibt.
      - Das Passwort des Admin-Kontos.
    answer: 1
    explanation: Grafana speichert selbst keine Messwerte. Es fragt Datenquellen ab – Prometheus mit PromQL, Loki mit LogQL, Tempo mit TraceQL – und zeigt die Ergebnisse an.
  - type: multiple
    question: Was macht ein gutes Dashboard für den Ernstfall aus?
    options:
      - Wenige, klar beschriftete Panels mit Einheiten.
      - Oben die Sicht der Nutzer:innen (Rate, Fehler, Dauer), unten Details zu Ressourcen.
      - Möglichst viele Panels, damit nichts fehlt.
      - Eine Variable, um zwischen Diensten oder Routen umzuschalten.
    answers: [0, 1, 3]
    explanation: Im Incident zählt Orientierung in Sekunden. 60 Panels ohne Einheiten überfordern. Ein klarer Aufbau von „Wie geht es den Nutzer:innen?“ hin zu „Woran liegt es?“ hilft.
  - type: cloze
    text: Damit Dashboards nicht nur in der Grafana-Datenbank liegen, speichert man ihr ___-Modell im Git-Repository und lädt es per ___ beim Start.
    blanks:
      - [JSON]
      - [Provisioning, provisioning]
    explanation: Dashboards als Code sind versioniert, im Review prüfbar und lassen sich auf jeder Umgebung gleich ausrollen.
  - type: find-bug
    question: Dieses Panel soll die Anfragen pro Sekunde zeigen, die Kurve steigt aber endlos. In welcher Zeile liegt der Fehler?
    language: json
    code: |
      {
        "type": "timeseries",
        "title": "Anfragen pro Sekunde",
        "targets": [
          { "refId": "A", "expr": "sum(http_requests_total)" }
        ],
        "fieldConfig": { "defaults": { "unit": "reqps" } }
      }
    bug_line: 5
    explanation: "Ein Counter wächst immer weiter. Für „pro Sekunde“ braucht es `sum(rate(http_requests_total[5m]))`."
tasks:
  - id: stack-beschriften
    type: diagram
    title: Beschrifte den Observability-Stack
    description: Ordne die Komponenten den leeren Kästen zu. Die Pfeile zeigen, wie Logs (oben), Metriken (Mitte) und Traces (unten) fließen.
    image: /assets/observability/stack-architektur-leer.svg
    slots:
      - { x: 37, y: 18, answer: Alloy }
      - { x: 61, y: 18, answer: Loki }
      - { x: 37, y: 49, answer: Prometheus }
      - { x: 61, y: 49, answer: Alertmanager }
      - { x: 88, y: 49, answer: Grafana }
    distractors: [nginx, Redis]
    hints:
      - Prometheus holt die Metriken per Pull bei der App ab und gibt Alarme an den Alertmanager weiter.
      - Grafana fragt alle drei Speicher ab und zeigt sie an einem Ort.
  - id: red-dashboard-json
    type: terminal
    title: Ein RED-Dashboard als Code
    description: |
      Im Ordner `dashboard` liegt `checkout.json`, das JSON-Modell eines fast leeren Grafana-Dashboards. Es
      hat schon den Titel und ein Panel für die Rate. Ergänze es zu einem vollständigen RED-Dashboard:

      1. Setze die `uid` auf `checkout-red`.
      2. Füge im Array `panels` ein zweites Panel hinzu: `type` `timeseries`, `title` `Fehlerquote`, ein
         Target mit `refId` `A` und einem `expr`, der den Anteil der 5xx-Antworten berechnet – er muss
         `status=~"5.."` und `rate(` enthalten und durch die Gesamt-Rate teilen (`/`).
         Setze `fieldConfig.defaults.unit` auf `percentunit`.
      3. Füge ein drittes Panel hinzu: `type` `timeseries`, `title` `p95-Dauer`, ein Target mit einem `expr`,
         der `histogram_quantile(0.95` enthält. Einheit: `s`.
      4. Die Datei muss gültiges JSON bleiben – prüfe mit `jq . checkout.json`.

      Klicke zuerst auf **Aufgabe vorbereiten**. Du kannst die Datei mit `nano` bearbeiten oder mit `jq`
      umbauen und in eine neue Datei schreiben.
    workdir: dashboard
    setup: |
      cat > checkout.json <<'EOF'
      {
        "title": "Checkout – RED",
        "uid": "",
        "schemaVersion": 41,
        "time": { "from": "now-6h", "to": "now" },
        "panels": [
          {
            "type": "timeseries",
            "title": "Anfragen pro Sekunde",
            "gridPos": { "x": 0, "y": 0, "w": 8, "h": 8 },
            "targets": [
              { "refId": "A", "expr": "sum(rate(http_requests_total{route=\"/checkout\"}[5m]))" }
            ],
            "fieldConfig": { "defaults": { "unit": "reqps" } }
          }
        ]
      }
      EOF
    checks:
      - type: command
        run: jq -e . checkout.json > /dev/null
        message: checkout.json ist kein gültiges JSON mehr. Prüfe Kommas und Klammern mit jq . checkout.json.
      - type: command
        run: jq -r '.uid' checkout.json
        stdout_equals: checkout-red
        message: Setze "uid" auf "checkout-red".
      - type: command
        run: jq -r '.panels | length' checkout.json
        stdout_equals: "3"
        message: Das Dashboard braucht genau drei Panels – Rate, Fehlerquote und p95-Dauer.
      - type: command
        run: jq -r '.panels[] | select(.title == "Fehlerquote") | [.type, .fieldConfig.defaults.unit] | join(" ")' checkout.json
        stdout_equals: timeseries percentunit
        message: Es fehlt ein Panel "Fehlerquote" vom Typ timeseries mit der Einheit percentunit.
      - type: command
        run: jq -r '.panels[] | select(.title == "Fehlerquote") | .targets[0].expr' checkout.json
        stdout_matches: "rate\\(.*status=~\"5\\.\\.\".*/.*rate\\("
        message: 'Der expr des Panels "Fehlerquote" soll die 5xx-Rate (status=~"5..") durch die Gesamt-Rate teilen, z. B. sum(rate(...{status=~"5.."}[5m])) / sum(rate(...[5m])).'
      - type: command
        run: jq -r '.panels[] | select(.title == "p95-Dauer") | [.type, .fieldConfig.defaults.unit, .targets[0].expr] | join(" ")' checkout.json
        stdout_matches: "^timeseries s .*histogram_quantile\\(0\\.95"
        message: Es fehlt ein Panel "p95-Dauer" vom Typ timeseries mit der Einheit s und einem expr mit histogram_quantile(0.95, …).
    hints:
      - Kopiere das vorhandene Panel als Vorlage und ändere Titel, `expr` und Einheit. Achte auf das Komma zwischen den Panels.
      - "Fehlerquote: `sum(rate(http_requests_total{route=\"/checkout\",status=~\"5..\"}[5m])) / sum(rate(http_requests_total{route=\"/checkout\"}[5m]))`. Im JSON müssen die inneren Anführungszeichen als `\\\"` geschrieben werden."
      - "p95: `histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket{route=\"/checkout\"}[5m])))`."
    solution: |
      Mit `jq` lässt sich das Dashboard ohne Editor umbauen:

      ```bash
      cd dashboard
      jq '.uid = "checkout-red"
        | .panels += [
            {
              "type": "timeseries", "title": "Fehlerquote",
              "gridPos": { "x": 8, "y": 0, "w": 8, "h": 8 },
              "targets": [{ "refId": "A", "expr": "sum(rate(http_requests_total{route=\"/checkout\",status=~\"5..\"}[5m])) / sum(rate(http_requests_total{route=\"/checkout\"}[5m]))" }],
              "fieldConfig": { "defaults": { "unit": "percentunit" } }
            },
            {
              "type": "timeseries", "title": "p95-Dauer",
              "gridPos": { "x": 16, "y": 0, "w": 8, "h": 8 },
              "targets": [{ "refId": "A", "expr": "histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket{route=\"/checkout\"}[5m])))" }],
              "fieldConfig": { "defaults": { "unit": "s" } }
            }
          ]' checkout.json > neu.json && mv neu.json checkout.json
      jq '.panels[].title' checkout.json
      ```
---
Prometheus hat jetzt Tausende Zeitreihen. Aber niemand liest im Incident Zahlenkolonnen. Du brauchst
ein Bild, das dir in fünf Sekunden sagt: „Seit 13:55 steigen die Fehler beim Checkout, und die Dauer
explodiert.“ Dafür gibt es Grafana.

![Ein typischer Observability-Stack mit Prometheus, Loki, Tempo, Alertmanager und Grafana](/assets/observability/stack-architektur.svg)

## Grafana in einem Satz

[[grafana|Grafana]] ist eine Weboberfläche, die Daten aus vielen Quellen abfragt und als
[[dashboard|Dashboards]] darstellt. Grafana speichert selbst keine Messwerte – es fragt nur ab.

| Begriff | Bedeutung |
|---|---|
| **Data Source** | Verbindung zu einem Speicher: Prometheus, Loki, Tempo, PostgreSQL … |
| **Dashboard** | eine Seite mit mehreren Panels und einem gemeinsamen Zeitraum |
| **[[dashboard-panel\|Panel]]** | ein Diagramm, eine Zahl oder Tabelle mit einer oder mehreren Abfragen |
| **Variable** | ein Auswahlfeld oben, z. B. `$route`, das in alle Abfragen eingesetzt wird |

Grafana läuft lokal am einfachsten als Container (`grafana/grafana`, Port 3000). Wie du den ganzen
Stack startest, siehst du in der Übung am Modulende.

## Panel-Typen und Einheiten

| Panel | Wofür | Beispiel |
|---|---|---|
| Time series | Verlauf über die Zeit | Anfragen pro Sekunde |
| Stat | eine große Zahl mit Farbe | aktuelle Fehlerquote: 0,4 % |
| Gauge | Füllstand gegen ein Maximum | Festplatte zu 72 % voll |
| Table | Liste mit Spalten | die 10 langsamsten Routen |
| Logs | Logzeilen aus Loki | Fehler der letzten Stunde |

Setze immer eine **Einheit** (`s`, `bytes`, `reqps`, `percentunit`). Prometheus liefert Basiseinheiten,
Grafana macht daraus „250 ms“ oder „1,2 GiB“. Schwellenwerte (*Thresholds*) färben Werte gelb oder rot.

> [!TIPP]
> `percentunit` erwartet einen Anteil zwischen 0 und 1 und zeigt ihn als Prozent an. Deine PromQL-Abfrage
> muss also **nicht** mit 100 multiplizieren.

## Ein gutes RED-Dashboard

Ein Dashboard soll eine Frage beantworten, nicht alles zeigen. Ein bewährter Aufbau für einen Dienst:

1. **Oben:** Rate, Fehlerquote, p95-Dauer – die RED-Sicht der Nutzer:innen.
2. **Mitte:** Aufteilung nach Route oder Statuscode für die Suche nach dem „Wo?“.
3. **Unten:** USE-Werte der Ressourcen – PHP-FPM-Worker, Datenbank-Verbindungen, Queue-Länge.

```text title="PromQL der drei Kopf-Panels"
sum(rate(http_requests_total{route="$route"}[5m]))
sum(rate(http_requests_total{route="$route",status=~"5.."}[5m]))
  / sum(rate(http_requests_total{route="$route"}[5m]))
histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket{route="$route"}[5m])))
```

> [!FEHLER]
> **Das Dashboard mit 60 Panels.** Es wirkt gründlich, aber um 3 Uhr nachts findet niemand das eine
> entscheidende Diagramm. Lieber mehrere kleine Dashboards mit klarer Frage und Links dazwischen.

## Dashboards als Code

Klickst du Dashboards nur in der Oberfläche zusammen, liegen sie in Grafanas Datenbank – ohne Historie,
ohne Review. Besser: Jedes Dashboard hat ein [[json|JSON]]-Modell, und das gehört ins Git-Repository.

```json title="dashboards/checkout.json (Ausschnitt)"
{
  "title": "Checkout – RED",
  "uid": "checkout-red",
  "panels": [
    { "type": "timeseries", "title": "Anfragen pro Sekunde",
      "targets": [{ "refId": "A", "expr": "sum(rate(http_requests_total[5m]))" }],
      "fieldConfig": { "defaults": { "unit": "reqps" } } }
  ]
}
```

Beim Start lädt Grafana Datenquellen und Dashboards per [[provisioning|Provisioning]] aus YAML-Dateien:

```yaml title="provisioning/datasources/prometheus.yaml"
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
```

> [!PRAXIS]
> Die `uid` ist die stabile Adresse eines Dashboards (`/d/checkout-red`). Halte sie fest – dann
> funktionieren Links aus Alarmen und Runbooks auch nach jeder Änderung weiter.

## Zusammenfassung

- Grafana fragt **Datenquellen** wie Prometheus, Loki und Tempo ab und speichert selbst keine Messwerte.
- Ein Dashboard besteht aus **Panels**; jedes Panel hat Abfragen, einen Typ und eine **Einheit**.
- Ein gutes Dienst-Dashboard zeigt oben RED, darunter das „Wo?“, unten die Ressourcen (USE).
- Variablen wie `$route` machen ein Dashboard für viele Routen oder Dienste nutzbar.
- Dashboards gehören als **JSON** ins Repository und werden per **Provisioning** ausgerollt.
