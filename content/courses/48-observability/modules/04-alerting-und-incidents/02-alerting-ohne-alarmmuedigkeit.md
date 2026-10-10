---
title: Alerting ohne Alarmmüdigkeit
summary: Wie du Alarme schreibst, die nur bei echten Problemen wecken – symptombasiert, mit Wartezeit, Schweregrad und Runbook – und wie Prometheus und Alertmanager dabei zusammenarbeiten.
duration: 25
sources:
  - title: Prometheus – Alerting rules
    url: https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/
  - title: Prometheus – Alertmanager
    url: https://prometheus.io/docs/alerting/latest/alertmanager/
  - title: Prometheus – Alerting best practices
    url: https://prometheus.io/docs/practices/alerting/
  - title: Google SRE Workbook – Alerting on SLOs
    url: https://sre.google/workbook/alerting-on-slos/
quiz:
  - type: single
    question: Welcher Alarm ist symptombasiert?
    options:
      - CPU-Auslastung eines Servers über 80 %
      - Mehr als 2 % der Checkout-Anfragen schlagen seit 5 Minuten fehl
      - Ein Queue-Worker wurde neu gestartet
      - Der Arbeitsspeicher des Datenbank-Servers ist zu 70 % belegt
    answer: 1
    explanation: Symptome sind das, was Nutzer:innen spüren – Fehler und Langsamkeit. Hohe CPU kann völlig harmlos sein. Ursachen-Messwerte gehören aufs Dashboard, nicht in den Pager.
  - type: find-bug
    question: Diese Alarmregel weckt das Team bei jedem kurzen Ausreißer. In welcher Zeile fehlt etwas Entscheidendes?
    language: yaml
    code: |
      groups:
        - name: checkout
          rules:
            - alert: CheckoutHighErrorRate
              expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
              labels:
                severity: page
    bug_line: 5
    explanation: "Nach dem `expr` fehlt `for: 5m`. Ohne `for` feuert der Alarm schon bei einer einzigen Auswertung über der Schwelle – kurze Spitzen wecken dann Menschen ohne Grund."
  - type: multiple
    question: Was gehört zu einem guten Alarm, der jemanden weckt?
    options:
      - Ein Symptom, das Nutzer:innen betrifft
      - Eine klare Handlung, die ein Mensch jetzt tun muss
      - Ein Link auf ein Runbook mit ersten Schritten
      - Möglichst niedrige Schwellen, damit nichts übersehen wird
    answers: [0, 1, 2]
    explanation: Ein Page muss dringend, wichtig und handlungsfähig sein. Niedrige Schwellen erzeugen Fehlalarme – und die führen zu Alarmmüdigkeit.
  - type: match
    question: Welche Funktion des Alertmanagers macht was?
    pairs:
      - { left: "Grouping", right: "fasst 30 gleichzeitige Alarme zu einer Nachricht zusammen" }
      - { left: "Inhibition", right: "unterdrückt Folgealarme, wenn schon ein übergeordneter Alarm feuert" }
      - { left: "Silence", right: "schaltet Alarme für eine geplante Wartung stumm" }
      - { left: "Routing", right: "schickt Alarme je nach Label an das richtige Team" }
    explanation: Prometheus entscheidet, ob ein Alarm feuert. Der Alertmanager entscheidet, wer wann wie benachrichtigt wird.
tasks:
  - id: page-ticket-oder-nichts
    type: dragdrop
    title: Page, Ticket oder gar kein Alarm?
    description: Entscheide für jede Situation, wie das Team benachrichtigt werden sollte.
    targets:
      - { id: page, label: Sofort wecken (Page) }
      - { id: ticket, label: Ticket für die Arbeitszeit }
      - { id: nichts, label: Kein Alarm – nur Dashboard }
    items:
      - { label: "5 % aller Checkouts schlagen seit 10 Minuten fehl", target: page }
      - { label: "Fehlerbudget würde bei aktueller Burn Rate in 2 Tagen aufgebraucht", target: page }
      - { label: "Festplatte ist in etwa 5 Tagen voll", target: ticket }
      - { label: "TLS-Zertifikat läuft in 14 Tagen ab", target: ticket }
      - { label: "CPU eines Servers kurz bei 90 %, Antwortzeiten normal", target: nichts }
      - { label: "Ein einzelner Queue-Job wurde nach Wiederholung erfolgreich verarbeitet", target: nichts }
    hints:
      - "Page: Nutzer:innen sind jetzt betroffen oder es wird sehr bald kritisch. Ticket: muss erledigt werden, aber nicht nachts."
  - id: alarmregeln-schreiben
    type: terminal
    title: Symptombasierte Alarmregeln schreiben
    description: |
      Schreibe im Ordner `alarmregeln` die Prometheus-Regeldatei `checkout.rules.yml` mit einer Gruppe
      `checkout` und zwei Alarmen:

      1. `CheckoutHighErrorRate`: `expr` teilt die Rate der 5xx-Antworten (`status=~"5.."`) durch die
         Gesamt-Rate von `http_requests_total{route="/checkout"}` und vergleicht mit `> 0.05`. Er feuert erst
         nach `for: 5m`, hat das Label `severity: page` und die Annotationen `summary` und `runbook_url`.
      2. `CheckoutSlow`: `expr` mit `histogram_quantile(0.95, …)` über
         `http_request_duration_seconds_bucket{route="/checkout"}` und `> 1`. `for: 15m`, Label
         `severity: ticket`, Annotation `summary`.

      Der Ordner wird beim Vorbereiten angelegt. Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: alarmregeln
    setup: |
      echo "Lege hier checkout.rules.yml an." > LIESMICH.txt
    checks:
      - type: file_exists
        path: checkout.rules.yml
        message: Lege die Datei checkout.rules.yml an.
      - type: file_contains
        path: checkout.rules.yml
        pattern: "^groups:\\s*$"
        message: Die Datei muss mit groups beginnen.
      - type: file_contains
        path: checkout.rules.yml
        pattern: "^\\s*- name:\\s*[\"']?checkout[\"']?\\s*$"
        message: Es fehlt die Gruppe mit name checkout.
      - type: command
        run: awk '/- alert:/ {a=$NF} a == "CheckoutHighErrorRate"' checkout.rules.yml | grep -E 'expr:.*status=~"5\.\.".*/.*> *0\.05'
        message: CheckoutHighErrorRate braucht einen expr, der die 5xx-Rate durch die Gesamt-Rate teilt und mit > 0.05 vergleicht.
      - type: command
        run: awk '/- alert:/ {a=$NF} a == "CheckoutHighErrorRate"' checkout.rules.yml | grep -E '^\s*for:\s*5m\s*$'
        message: "CheckoutHighErrorRate braucht for: 5m, damit kurze Spitzen nicht wecken."
      - type: command
        run: awk '/- alert:/ {a=$NF} a == "CheckoutHighErrorRate"' checkout.rules.yml | grep -E '^\s*severity:\s*["'"'"']?page'
        message: "CheckoutHighErrorRate braucht unter labels severity: page."
      - type: command
        run: awk '/- alert:/ {a=$NF} a == "CheckoutHighErrorRate"' checkout.rules.yml | grep -E '^\s*runbook_url:\s*\S'
        message: CheckoutHighErrorRate braucht unter annotations eine runbook_url.
      - type: command
        run: awk '/- alert:/ {a=$NF} a == "CheckoutSlow"' checkout.rules.yml | grep -E 'expr:.*histogram_quantile\(0\.95.*http_request_duration_seconds_bucket.*> *1'
        message: CheckoutSlow braucht einen expr mit histogram_quantile(0.95, …) über http_request_duration_seconds_bucket und > 1.
      - type: command
        run: awk '/- alert:/ {a=$NF} a == "CheckoutSlow"' checkout.rules.yml | grep -E '^\s*for:\s*15m\s*$'
        message: "CheckoutSlow braucht for: 15m."
      - type: command
        run: awk '/- alert:/ {a=$NF} a == "CheckoutSlow"' checkout.rules.yml | grep -E '^\s*severity:\s*["'"'"']?ticket'
        message: "CheckoutSlow braucht unter labels severity: ticket – Langsamkeit über 15 Minuten ist ein Fall für die Arbeitszeit."
    hints:
      - "Aufbau: `groups:` → `- name: checkout` → `rules:` → `- alert: …` mit `expr`, `for`, `labels`, `annotations`."
      - "Schreibe jeden `expr` in eine einzige Zeile, z. B. `expr: sum(rate(http_requests_total{route=\"/checkout\",status=~\"5..\"}[5m])) / sum(rate(http_requests_total{route=\"/checkout\"}[5m])) > 0.05`."
      - "Für p95: `expr: histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket{route=\"/checkout\"}[5m]))) > 1`."
    solution: |
      ```bash
      cd alarmregeln
      cat > checkout.rules.yml <<'EOF'
      groups:
        - name: checkout
          rules:
            - alert: CheckoutHighErrorRate
              expr: sum(rate(http_requests_total{route="/checkout",status=~"5.."}[5m])) / sum(rate(http_requests_total{route="/checkout"}[5m])) > 0.05
              for: 5m
              labels:
                severity: page
              annotations:
                summary: "Mehr als 5 % der Checkout-Anfragen schlagen fehl"
                runbook_url: https://wiki.example.com/runbooks/checkout-errors
            - alert: CheckoutSlow
              expr: histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket{route="/checkout"}[5m]))) > 1
              for: 15m
              labels:
                severity: ticket
              annotations:
                summary: "p95 des Checkouts liegt seit 15 Minuten über 1 Sekunde"
      EOF
      ```
---
Es ist 3:12 Uhr, das Handy vibriert: „CPU über 80 % auf web-2“. Du schaust nach – alles normal, die
Kurve ist schon wieder unten. Um 3:40 Uhr dasselbe. Nach einer Woche schaltest du die Benachrichtigungen
leiser. Und genau dann kommt der Alarm, der wirklich zählt – und niemand reagiert.

## Alarmmüdigkeit ist das eigentliche Risiko

[[alarmmuedigkeit|Alarmmüdigkeit]] entsteht, wenn zu viele Alarme feuern, die keine Handlung erfordern.
Menschen gewöhnen sich daran und reagieren langsamer – oder gar nicht mehr.

Jeder Alarm, der jemanden weckt, muss drei Fragen mit **Ja** beantworten:

1. **Ist es dringend?** Muss jetzt gehandelt werden, nicht morgen?
2. **Ist es wichtig?** Spüren Nutzer:innen es – oder bald?
3. **Ist es handlungsfähig?** Gibt es etwas, das ein Mensch tun kann?

Was nur eine oder zwei Fragen erfüllt, wird ein **Ticket** oder bleibt auf dem **Dashboard**.

| Klasse | Wann | Kanal |
|---|---|---|
| Page | Nutzer:innen jetzt betroffen, Handlung nötig | Telefon, Pager, Push |
| Ticket | muss erledigt werden, aber nicht nachts | Issue-Tracker, Team-Chat |
| Kein Alarm | interessant für die Diagnose | Dashboard |

## Symptome statt Ursachen

Ein [[symptombasierter-alert|symptombasierter Alarm]] meldet, was Nutzer:innen spüren: Fehler und
Langsamkeit – genau die RED-Werte und deine SLOs. Ursachen wie hohe CPU, volle Queues oder ein
Neustart sind wichtig für die Diagnose, aber keine guten Weckgründe.

| Ursache (schlechter Page) | Symptom (guter Page) |
|---|---|
| CPU über 80 % | p95 des Checkouts über 1 s seit 15 Minuten |
| Datenbank-Verbindungen fast voll | 5 % der Anfragen schlagen fehl |
| Queue-Worker neu gestartet | Bestellbestätigungen kommen über 10 Minuten zu spät |

Ein Symptom-Alarm fängt auch Ursachen, an die du nie gedacht hast. Ein Ursachen-Alarm feuert dagegen
oft, ohne dass jemand etwas merkt.

> [!MERKSATZ]
> Wecke Menschen für **Symptome**, zeige **Ursachen** auf dem Dashboard. Ein Alarm ohne mögliche Handlung
> ist kein Alarm, sondern Lärm.

## Alarmregeln in Prometheus

Prometheus wertet [[alert-regel|Alarmregeln]] regelmäßig aus. Eine Regel ist eine PromQL-Bedingung mit
Wartezeit und Zusatzinfos:

```yaml title="checkout.rules.yml"
groups:
  - name: checkout
    rules:
      - alert: CheckoutHighErrorRate
        expr: sum(rate(http_requests_total{route="/checkout",status=~"5.."}[5m])) / sum(rate(http_requests_total{route="/checkout"}[5m])) > 0.05
        for: 5m
        labels:
          severity: page
        annotations:
          summary: "Mehr als 5 % der Checkout-Anfragen schlagen fehl"
          runbook_url: https://wiki.example.com/runbooks/checkout-errors
```

| Feld | Zweck |
|---|---|
| `expr` | Bedingung; jede Zeitreihe im Ergebnis ist ein aktiver Alarm |
| `for` | so lange muss die Bedingung gelten – filtert kurze Spitzen heraus |
| `labels` | z. B. `severity` für das Routing |
| `annotations` | Text für Menschen: Zusammenfassung, [[runbook\|Runbook]]-Link |

In `prometheus.yml` bindest du die Datei mit `rule_files: ["rules/*.yml"]` ein.

> [!FEHLER]
> **Kein `for`.** Ohne Wartezeit feuert ein Alarm schon bei einer einzigen Auswertung über der Schwelle.
> Eine Sekunde Lastspitze reicht dann, um jemanden zu wecken.

## Der Alertmanager

Prometheus entscheidet, **ob** ein Alarm aktiv ist. Der [[alertmanager|Alertmanager]] entscheidet,
**wer, wann und wie** benachrichtigt wird:

- **Routing:** `severity: page` an die [[bereitschaft|Bereitschaft]], `severity: ticket` in den Team-Chat.
- **Grouping:** 30 gleichzeitige Alarme desselben Ausfalls werden eine Nachricht.
- **Inhibition:** Ist die ganze Region down, werden Folgealarme einzelner Dienste unterdrückt.
- **Silences:** geplante Wartung stumm schalten.

```yaml title="alertmanager.yml (Ausschnitt)"
route:
  receiver: team-chat
  group_by: [alertname, route]
  routes:
    - matchers: ['severity="page"']
      receiver: on-call-pager
```

## Alarme auf das Fehlerbudget

Noch besser als feste Schwellen sind Alarme auf die **Burn Rate** aus der letzten Lektion. Das SRE-Workbook
empfiehlt zwei Fenster gleichzeitig – ein langes gegen Fehlalarme, ein kurzes, damit der Alarm nach der
Behebung schnell endet:

```text title="PromQL – schneller Budgetverbrauch (SLO 99,9 %)"
(
  job:checkout_error_ratio:rate1h > (14.4 * 0.001)
and
  job:checkout_error_ratio:rate5m > (14.4 * 0.001)
)
```

`job:checkout_error_ratio:rate1h` ist eine *Recording Rule* – eine vorab berechnete Fehlerquote. Bei
Burn Rate 14,4 sind in einer Stunde 2 % des Monatsbudgets weg: ein klarer Fall für einen Page. Eine
langsamere Burn Rate wie 6 über 6 Stunden wird eher ein Ticket.

> [!PRAXIS]
> Jedes Page bekommt ein Runbook: Was bedeutet der Alarm, welches Dashboard zeigt die Lage, welche ersten
> drei Schritte helfen (Rollback, Feature-Flag aus, Dienst skalieren)? Nachts denkt niemand gern frei.

## Zusammenfassung

- **Alarmmüdigkeit** ist gefährlich: Zu viele unnötige Alarme führen dazu, dass echte übersehen werden.
- Ein Page muss **dringend, wichtig und handlungsfähig** sein; alles andere wird Ticket oder Dashboard.
- Alarmiere auf **Symptome** (Fehler, Langsamkeit, SLOs), nicht auf Ursachen wie CPU.
- Prometheus-Regeln: `expr`, `for`, `labels` (z. B. `severity`) und `annotations` mit Runbook-Link.
- Der **Alertmanager** übernimmt Routing, Grouping, Inhibition und Silences; Burn-Rate-Alarme mit zwei Fenstern sind der Goldstandard.
