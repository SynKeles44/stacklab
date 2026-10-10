---
title: CloudWatch, Budgets und Kosten im Griff
summary: Metriken, Logs und Alarme mit CloudWatch – und wie Budgets, Kostenalarme und Tags dafür sorgen, dass dich keine Rechnung überrascht.
duration: 25
sources:
  - title: Amazon CloudWatch – What is Amazon CloudWatch?
    url: https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html
  - title: Amazon CloudWatch – Using Amazon CloudWatch alarms
    url: https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Alarms.html
  - title: AWS Cost Management – Managing your costs with AWS Budgets
    url: https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html
  - title: AWS CLI – aws budgets create-budget
    url: https://docs.aws.amazon.com/cli/latest/reference/budgets/create-budget.html
  - title: Amazon CloudWatch Logs – Change log data retention
    url: https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/Working-with-log-groups-and-streams.html
quiz:
  - type: match
    question: Ordne jedem CloudWatch-Baustein seine Aufgabe zu.
    pairs:
      - { left: "Metrik", right: "Zahlenreihe über die Zeit, z. B. CPU-Auslastung" }
      - { left: "Log-Gruppe", right: "Sammlung von Logzeilen einer Anwendung oder eines Dienstes" }
      - { left: "Alarm", right: "Beobachtet eine Metrik und löst bei einem Schwellwert eine Aktion aus" }
    explanation: Metriken zeigen den Zustand, Logs die Details, Alarme melden sich, wenn etwas aus dem Rahmen fällt.
  - type: multiple
    question: Welche Posten tauchen typischerweise überraschend auf der Rechnung auf?
    options:
      - Ein NAT-Gateway, das rund um die Uhr läuft und Daten verarbeitet
      - Log-Gruppen ohne Aufbewahrungsfrist, die immer größer werden
      - Vergessene Ressourcen in einer anderen Region
      - Ein IAM-Benutzer ohne Policies
    answers: [0, 1, 2]
    explanation: IAM selbst kostet nichts. NAT-Gateways, endlos wachsende Logs und vergessene Testserver dagegen schon.
  - type: single
    question: Was ist der Unterschied zwischen einer ACTUAL- und einer FORECASTED-Benachrichtigung in AWS Budgets?
    options:
      - ACTUAL meldet sich, wenn die tatsächlichen Kosten den Schwellwert erreichen; FORECASTED, wenn die Prognose für den Zeitraum ihn erreichen wird.
      - ACTUAL gilt nur für EC2, FORECASTED nur für S3.
      - Es gibt keinen Unterschied.
    answer: 0
    explanation: Prognose-Benachrichtigungen warnen früher – oft schon Mitte des Monats, wenn der Trend nach oben zeigt.
  - type: cloze
    text: "Ohne eingestellte Aufbewahrung behält CloudWatch Logs die Daten ___. Für Debug-Logs reicht oft eine Frist von 14 oder 30 ___."
    blanks:
      - [unbegrenzt, für immer, dauerhaft]
      - [Tagen, Tage]
    explanation: Neue Log-Gruppen laufen standardmäßig nie ab. Eine passende Aufbewahrungsfrist spart Geld und erfüllt Datenschutz-Vorgaben leichter.
tasks:
  - id: budget-dateien
    type: terminal
    title: Ein Budget als Dateien vorbereiten
    description: |
      Für das Entwicklungskonto `123456789012` soll ein monatliches Kostenbudget über **50 USD** entstehen.
      Lege im Ordner `budget` die beiden Dateien an, die `aws budgets create-budget` erwartet:

      1. `budget.json` mit `BudgetName` `dev-monatlich`, `BudgetLimit` (`Amount` `"50"`, `Unit` `"USD"`),
         `TimeUnit` `MONTHLY` und `BudgetType` `COST`.
      2. `notifications.json` – eine Liste mit **zwei** Benachrichtigungen an `team@example.com`
         (`SubscriptionType` `EMAIL`):
         - bei **80 %** der tatsächlichen Kosten (`NotificationType` `ACTUAL`),
         - bei **100 %** der prognostizierten Kosten (`NotificationType` `FORECASTED`).
         Beide mit `ComparisonOperator` `GREATER_THAN` und `ThresholdType` `PERCENTAGE`.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit der Ordner angelegt wird.
    workdir: budget
    setup: |
      true
    checks:
      - type: command
        run: jq -r '[.BudgetName, .BudgetLimit.Amount, .BudgetLimit.Unit, .TimeUnit, .BudgetType] | join(" ")' budget.json
        stdout_equals: dev-monatlich 50 USD MONTHLY COST
        message: "budget.json fehlt oder ist unvollständig. Erwartet: BudgetName dev-monatlich, BudgetLimit mit Amount \"50\" und Unit \"USD\", TimeUnit MONTHLY, BudgetType COST."
      - type: command
        run: jq -r 'length' notifications.json
        stdout_equals: "2"
        message: notifications.json fehlt oder enthält nicht genau zwei Benachrichtigungen.
      - type: command
        run: jq -r 'map("\(.Notification.NotificationType) \(.Notification.Threshold) \(.Notification.ComparisonOperator) \(.Notification.ThresholdType)") | sort | join(";")' notifications.json
        stdout_equals: ACTUAL 80 GREATER_THAN PERCENTAGE;FORECASTED 100 GREATER_THAN PERCENTAGE
        message: Die Benachrichtigungen stimmen noch nicht. Gebraucht werden ACTUAL bei 80 und FORECASTED bei 100, jeweils GREATER_THAN und PERCENTAGE (Threshold als Zahl).
      - type: command
        run: jq -r '[.[].Subscribers[] | "\(.SubscriptionType) \(.Address)"] | unique | join(";")' notifications.json
        stdout_equals: EMAIL team@example.com
        message: Jede Benachrichtigung braucht einen Subscriber mit SubscriptionType EMAIL und Address team@example.com.
    hints:
      - "Der Betrag ist in AWS Budgets ein **String**: `\"Amount\": \"50\"`, der Schwellwert eine Zahl: `\"Threshold\": 80`."
      - "Jedes Listenelement in notifications.json hat die Schlüssel `Notification` und `Subscribers`."
      - "Prüfe mit `jq . budget.json notifications.json`, ob beide Dateien gültiges JSON sind."
    solution: |
      ```bash
      cd budget
      cat > budget.json <<'EOF'
      {
        "BudgetName": "dev-monatlich",
        "BudgetLimit": { "Amount": "50", "Unit": "USD" },
        "TimeUnit": "MONTHLY",
        "BudgetType": "COST"
      }
      EOF
      cat > notifications.json <<'EOF'
      [
        {
          "Notification": {
            "NotificationType": "ACTUAL",
            "ComparisonOperator": "GREATER_THAN",
            "Threshold": 80,
            "ThresholdType": "PERCENTAGE"
          },
          "Subscribers": [{ "SubscriptionType": "EMAIL", "Address": "team@example.com" }]
        },
        {
          "Notification": {
            "NotificationType": "FORECASTED",
            "ComparisonOperator": "GREATER_THAN",
            "Threshold": 100,
            "ThresholdType": "PERCENTAGE"
          },
          "Subscribers": [{ "SubscriptionType": "EMAIL", "Address": "team@example.com" }]
        }
      ]
      EOF
      # Später im echten Konto:
      # aws budgets create-budget --account-id 123456789012 \
      #   --budget file://budget.json --notifications-with-subscribers file://notifications.json
      ```
  - id: cpu-alarm
    type: simulated
    title: Einen CloudWatch-Alarm anlegen
    description: |
      Lege einen Alarm an, der eine E-Mail-Benachrichtigung über das SNS-Thema
      `arn:aws:sns:eu-central-1:123456789012:ops-alarme` auslöst, wenn die durchschnittliche CPU-Auslastung
      der Instanz `i-0123456789abcdef0` zwei Fünf-Minuten-Zeiträume lang über 80 % liegt.

      1. `aws cloudwatch put-metric-alarm --alarm-name app-cpu-hoch --namespace AWS/EC2 --metric-name CPUUtilization --dimensions Name=InstanceId,Value=i-0123456789abcdef0 --statistic Average --period 300 --evaluation-periods 2 --threshold 80 --comparison-operator GreaterThanThreshold --alarm-actions arn:aws:sns:eu-central-1:123456789012:ops-alarme`
      2. Zustand prüfen: `aws cloudwatch describe-alarms --alarm-names app-cpu-hoch --query "MetricAlarms[].StateValue"`
    prompt: "du@laptop:~$"
    steps:
      - expect: "^aws\\s+cloudwatch\\s+put-metric-alarm(?=.*--alarm-name\\s+app-cpu-hoch)(?=.*--namespace\\s+AWS/EC2)(?=.*--metric-name\\s+CPUUtilization)(?=.*--dimensions\\s+Name=InstanceId,Value=i-0123456789abcdef0)(?=.*--statistic\\s+Average)(?=.*--period\\s+300)(?=.*--evaluation-periods\\s+2)(?=.*--threshold\\s+80)(?=.*--comparison-operator\\s+GreaterThanThreshold)(?=.*--alarm-actions\\s+arn:aws:sns:eu-central-1:123456789012:ops-alarme).*$"
        output: "(keine Ausgabe – der Alarm wurde angelegt)"
        hint: "Alle Optionen aus Schritt 1 werden gebraucht. Der Befehl gibt bei Erfolg nichts aus."
      - expect: "^aws\\s+cloudwatch\\s+describe-alarms\\s+--alarm-names\\s+app-cpu-hoch\\s+--query\\s+[\"']?MetricAlarms\\[\\]\\.StateValue[\"']?$"
        output: |
          [
              "INSUFFICIENT_DATA"
          ]

          Ein neuer Alarm hat noch nicht genug Datenpunkte. Nach etwa zehn Minuten wechselt er auf OK – oder auf ALARM.
        hint: "Tippe den describe-alarms-Befehl aus Schritt 2."
---

Ein Student probiert am Wochenende eine große Datenbank aus und vergisst sie danach. Vier Wochen später
kommt eine Rechnung über mehrere Hundert Euro. Ein anderes Team merkt erst durch Kundenbeschwerden, dass
ihr Server seit Stunden bei 100 % CPU hängt. Beides verhindern zwei Werkzeuge: CloudWatch für den Zustand
deiner Ressourcen und Budgets für deine Kosten.

## CloudWatch: Metriken, Logs, Alarme

[[cloudwatch|Amazon CloudWatch]] ist der zentrale Überwachungsdienst von AWS. Er hat drei Säulen:

| Baustein | Was er ist | Beispiel |
|---|---|---|
| Metriken | Zahlenreihen über die Zeit | `CPUUtilization` einer EC2-Instanz |
| Logs | Logzeilen, sortiert in Log-Gruppen | Laravel-Log eines Containers |
| [[cloudwatch-alarm\|Alarme]] | Regeln auf Metriken | „CPU 10 Minuten über 80 % → E-Mail“ |

Viele Dienste liefern Metriken automatisch. EC2 meldet ohne Zusatzkosten alle fünf Minuten (*Basic
Monitoring*), mit *Detailed Monitoring* jede Minute. Werte aus dem Betriebssystem wie belegter
Arbeitsspeicher kommen erst über den CloudWatch-Agenten dazu. Wie du Metriken, Logs und Traces
grundsätzlich einsetzt, zeigt der Kurs „Observability“.

## Alarme verstehen

Ein Alarm beobachtet eine Metrik und hat drei Zustände: `OK`, `ALARM` und `INSUFFICIENT_DATA` (noch zu
wenig Daten). Die wichtigsten Einstellungen:

```bash title="Terminal"
aws cloudwatch put-metric-alarm \
  --alarm-name app-cpu-hoch \
  --namespace AWS/EC2 --metric-name CPUUtilization \
  --dimensions Name=InstanceId,Value=i-0123456789abcdef0 \
  --statistic Average --period 300 --evaluation-periods 2 \
  --threshold 80 --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:eu-central-1:123456789012:ops-alarme
```

`--period 300` und `--evaluation-periods 2` heißen: zwei Fünf-Minuten-Zeiträume hintereinander. So löst
ein kurzer Ausschlag keinen Alarm aus. Die Aktion schickt eine Nachricht an ein [[amazon-sns|SNS-Thema]], das zum Beispiel
E-Mails verschickt.

> [!FEHLER]
> **Log-Gruppen ohne Aufbewahrungsfrist.** Neue Log-Gruppen behalten ihre Daten standardmäßig unbegrenzt.
> Bei gesprächigen Anwendungen wachsen sie Monat für Monat – samt Kosten und personenbezogener Daten, die
> längst gelöscht sein sollten. Setze für jede Log-Gruppe eine passende Frist, etwa 30 Tage.

## Woher Kosten kommen

AWS rechnet nach Verbrauch ab. Typische Kostentreiber in kleinen Projekten:

- **Laufende Rechenleistung:** EC2-Instanzen und RDS-Datenbanken kosten pro Stunde – auch nachts.
- **NAT-Gateways:** Stundenpreis plus Gebühr pro verarbeitetem Gigabyte.
- **Datenübertragung ins Internet:** Eingehende Daten sind meist kostenlos, ausgehende nicht.
- **Öffentliche IPv4-Adressen:** Jede öffentliche IPv4-Adresse wird pro Stunde berechnet.
- **Vergessenes:** Snapshots, ungenutzte EBS-Volumes, Testserver in einer anderen Region.

Mit **Tags** wie `projekt=shop` und `umgebung=dev` an jeder Ressource kannst du im
[[cost-explorer|Cost Explorer]] sehen, welches Projekt wie viel kostet.

## Budgets und Kostenalarme

[[aws-budgets|AWS Budgets]] vergleicht die Kosten mit einem Betrag, den du festlegst, und benachrichtigt
dich bei Schwellwerten:

```json title="budget.json"
{
  "BudgetName": "dev-monatlich",
  "BudgetLimit": { "Amount": "50", "Unit": "USD" },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}
```

Dazu kommt eine Liste von Benachrichtigungen, zum Beispiel bei 80 % der **tatsächlichen** Kosten
(`ACTUAL`) und bei 100 % der **Prognose** (`FORECASTED`). Angelegt wird das Budget mit
`aws budgets create-budget --account-id 123456789012 --budget file://budget.json --notifications-with-subscribers file://notifications.json`.

Eine Alternative ist ein CloudWatch-Alarm auf die Metrik `EstimatedCharges`. Die Abrechnungsmetriken
liegen immer in der Region `us-east-1` und müssen vorher in den Billing-Einstellungen eingeschaltet werden.

> [!MERKSATZ]
> Ein Budget ist ein Rauchmelder, keine Sprinkleranlage: Es meldet sich, stoppt aber keine Ressourcen.
> Reagieren musst du selbst – deshalb sollte die E-Mail an eine Adresse gehen, die jemand liest.

> [!PRAXIS]
> Viele Teams legen für jedes Konto ein Budget mit zwei Stufen an (80 % tatsächlich, 100 % Prognose) und
> schauen einmal pro Woche in den Cost Explorer. Eine Kostenexplosion fällt so nach Tagen auf statt
> erst mit der Monatsrechnung.

## Zusammenfassung

- **CloudWatch** sammelt Metriken und Logs und löst über **Alarme** Aktionen aus.
- Alarme haben die Zustände `OK`, `ALARM` und `INSUFFICIENT_DATA`; Zeitraum und Anzahl der Zeiträume verhindern Fehlalarme.
- Log-Gruppen behalten Daten ohne Einstellung **unbegrenzt** – setze eine Aufbewahrungsfrist.
- Kostentreiber sind laufende Ressourcen, NAT-Gateways, ausgehende Daten und Vergessenes; **Tags** machen Kosten zuordenbar.
- **AWS Budgets** warnt bei tatsächlichen und prognostizierten Kosten – es stoppt aber nichts automatisch.
