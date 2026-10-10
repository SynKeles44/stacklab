---
title: Deployments und Autoscaling
summary: Wie ECS neue Versionen ausrollt, wie der Circuit Breaker kaputte Deployments zurückrollt und wie Services mit der Last wachsen und schrumpfen.
duration: 24
sources:
  - title: Deploy Amazon ECS services by replacing tasks (rolling update)
    url: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-type-ecs.html
  - title: How the Amazon ECS deployment circuit breaker detects failures
    url: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-circuit-breaker.html
  - title: Amazon ECS blue/green deployments
    url: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-type-blue-green.html
  - title: Automatically scale your Amazon ECS service
    url: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-auto-scaling.html
quiz:
  - type: single
    question: Ein Service hat desiredCount 4, minimumHealthyPercent 100 und maximumPercent 200. Was passiert beim Deployment?
    options:
      - ECS stoppt alle 4 alten Tasks und startet danach 4 neue.
      - ECS darf bis zu 8 Tasks gleichzeitig laufen lassen und stoppt alte erst, wenn neue gesund sind.
      - ECS tauscht immer genau einen Task nach dem anderen aus.
      - Das Deployment ist mit diesen Werten nicht möglich.
    answer: 1
    explanation: 100 Prozent heißt, 4 gesunde Tasks müssen immer laufen. 200 Prozent erlaubt bis zu 8 Tasks – also erst neue starten, dann alte stoppen.
  - type: multiple
    question: Was passiert mit deploymentCircuitBreaker enable true und rollback true, wenn die neuen Tasks nie gesund werden?
    options:
      - Nach Erreichen der Fehlerschwelle wird das Deployment als FAILED markiert.
      - ECS startet weiter neue Tasks, bis du eingreifst.
      - ECS rollt automatisch auf das letzte erfolgreiche Deployment zurück.
      - Die alten Tasks werden sofort gestoppt.
    answers: [0, 2]
    explanation: Der Circuit Breaker beendet Endlosschleifen aus startenden und abstürzenden Tasks. Mit rollback kehrt er zur letzten Revision im Zustand COMPLETED zurück.
  - type: match
    question: Ordne jede Deployment-Strategie von ECS ihrer Beschreibung zu.
    pairs:
      - { left: "ROLLING", right: "Tasks werden schrittweise durch neue ersetzt" }
      - { left: "BLUE_GREEN", right: "Neue Version läuft komplett parallel, dann wird der Verkehr umgeschaltet" }
      - { left: "CANARY", right: "Erst ein kleiner Anteil des Verkehrs, nach einer Wartezeit der Rest" }
      - { left: "LINEAR", right: "Verkehr wandert in gleich großen Schritten auf die neue Version" }
    explanation: ROLLING ist der Standard. Die anderen drei brauchen einen Load Balancer mit zwei Target Groups.
  - type: cloze
    text: "Bei Target Tracking gibst du einen ___ vor, zum Beispiel 60 Prozent durchschnittliche CPU, und Application Auto Scaling passt die Zahl der ___ automatisch an."
    blanks:
      - [Zielwert, Sollwert, Ziel]
      - [Tasks, Task]
    explanation: Wie ein Thermostat – du stellst die Temperatur ein, die Heizung regelt sich selbst.
tasks:
  - id: rolling-ablauf
    type: steps
    title: Ein Rolling Deployment Schritt für Schritt
    description: Der Service `web` hat `desiredCount` 2, `minimumHealthyPercent` 100, `maximumPercent` 200 und einen Circuit Breaker mit Rollback. Du registrierst `shop-web:8` und aktualisierst den Service.
    steps:
      - situation: Du rufst `aws ecs update-service --cluster shop --service web --task-definition shop-web:8` auf.
        question: Was macht ECS zuerst?
        options: [Es stoppt beide alten Tasks, Es startet zwei neue Tasks mit Revision 8, Es wartet auf eine Freigabe]
        answer: 1
        explanation: maximumPercent 200 erlaubt 4 Tasks gleichzeitig – erst kommen die neuen.
      - situation: Die neuen Tasks laufen, der Load Balancer meldet sie nach einigen Prüfungen als gesund.
        question: Was passiert mit den alten Tasks?
        options: [Sie bleiben dauerhaft als Reserve, Sie werden aus der Target Group abgemeldet und nach dem Auslaufen gestoppt, Sie werden auf Revision 8 aktualisiert]
        answer: 1
        explanation: Erst Abmelden, dann laufende Anfragen auslaufen lassen (Deregistration Delay), dann stoppen.
      - situation: Beim nächsten Deployment (Revision 9) fehlt ein Secret. Jeder neue Task stürzt beim Start ab.
        question: Was passiert?
        options: [ECS versucht es endlos, Nach der Fehlerschwelle markiert der Circuit Breaker das Deployment als FAILED und rollt auf Revision 8 zurück, Die alten Tasks stürzen ebenfalls ab]
        answer: 1
        explanation: Die alten Tasks liefen die ganze Zeit weiter (minimumHealthyPercent 100). Besucher haben vom Fehler nichts gemerkt.
  - id: autoscaling-einrichten
    type: simulated
    title: Autoscaling für den Web-Service
    description: |
      Der Service `web` im Cluster `shop` soll zwischen 2 und 10 Tasks laufen und eine durchschnittliche CPU-Auslastung
      von 60 Prozent anpeilen.

      1. Registriere das skalierbare Ziel:
         `aws application-autoscaling register-scalable-target --service-namespace ecs --resource-id service/shop/web --scalable-dimension ecs:service:DesiredCount --min-capacity 2 --max-capacity 10`
      2. Lege die Target-Tracking-Policy aus der Datei `cpu-policy.json` an:
         `aws application-autoscaling put-scaling-policy --service-namespace ecs --resource-id service/shop/web --scalable-dimension ecs:service:DesiredCount --policy-name cpu60 --policy-type TargetTrackingScaling --target-tracking-scaling-policy-configuration file://cpu-policy.json`
    prompt: "du@laptop:~/shop$"
    steps:
      - expect: "^aws\\s+application-autoscaling\\s+register-scalable-target\\s+(?=.*--service-namespace\\s+ecs\\b)(?=.*--resource-id\\s+service/shop/web\\b)(?=.*--scalable-dimension\\s+ecs:service:DesiredCount\\b)(?=.*--min-capacity\\s+2\\b)(?=.*--max-capacity\\s+10\\b).*$"
        output: |
          {
              "ScalableTargetARN": "arn:aws:application-autoscaling:eu-central-1:123456789012:scalable-target/0ec1a2b3c4d5e6f708"
          }
        hint: aws application-autoscaling register-scalable-target --service-namespace ecs --resource-id service/shop/web --scalable-dimension ecs:service:DesiredCount --min-capacity 2 --max-capacity 10
      - expect: "^aws\\s+application-autoscaling\\s+put-scaling-policy\\s+(?=.*--resource-id\\s+service/shop/web\\b)(?=.*--policy-type\\s+TargetTrackingScaling\\b)(?=.*--target-tracking-scaling-policy-configuration\\s+file://cpu-policy\\.json\\b).*$"
        output: |
          {
              "PolicyARN": "arn:aws:autoscaling:eu-central-1:123456789012:scalingPolicy:7f3a1b2c:resource/ecs/service/shop/web:policyName/cpu60",
              "Alarms": [
                  { "AlarmName": "TargetTracking-service/shop/web-AlarmHigh-1a2b3c" },
                  { "AlarmName": "TargetTracking-service/shop/web-AlarmLow-4d5e6f" }
              ]
          }
        hint: aws application-autoscaling put-scaling-policy --service-namespace ecs --resource-id service/shop/web --scalable-dimension ecs:service:DesiredCount --policy-name cpu60 --policy-type TargetTrackingScaling --target-tracking-scaling-policy-configuration file://cpu-policy.json
    responses:
      - match: "^cat\\s+cpu-policy\\.json"
        output: '{ "TargetValue": 60.0, "PredefinedMetricSpecification": { "PredefinedMetricType": "ECSServiceAverageCPUUtilization" }, "ScaleOutCooldown": 60, "ScaleInCooldown": 300 }'
---
Bisher hast du einen Service einmal angelegt. Im Alltag lieferst du aber mehrmals pro Woche neue Versionen aus –
ohne dass Besucher etwas merken. Und abends um acht kommen zehnmal so viele Besucher wie morgens um vier. Diese
Lektion zeigt, wie ECS beides automatisch regelt.

## Rolling Update: der Standard

Aktualisierst du einen Service auf eine neue Revision, tauscht ECS die Tasks schrittweise aus. Diese Strategie
heißt [[rolling-deployment|Rolling Update]]. Zwei Werte steuern das Tempo:

| Wert | Standard | Bedeutung |
|---|---|---|
| `minimumHealthyPercent` | 100 | so viel Prozent von `desiredCount` müssen immer gesund laufen |
| `maximumPercent` | 200 | so viel Prozent dürfen gleichzeitig laufen (alt + neu) |

Bei `desiredCount` 2 und den Standardwerten startet ECS zwei neue Tasks, wartet bis sie gesund sind, meldet die
alten beim Load Balancer ab und stoppt sie. Kurz laufen also vier Tasks – du zahlst für diese Minuten doppelt.

```bash title="Neue Revision ausrollen"
aws ecs update-service --cluster shop --service web --task-definition shop-web:8
aws ecs wait services-stable --cluster shop --services web
```

> [!MERKSATZ]
> **Während eines Rolling Updates laufen alte und neue Version gleichzeitig.** Datenbank-Änderungen müssen
> deshalb mit beiden Versionen funktionieren.

## Der Deployment Circuit Breaker

Was, wenn die neue Version beim Start abstürzt? Ohne Schutz startet ECS immer neue Tasks, die immer wieder
abstürzen – stundenlang. Der [[deployment-circuit-breaker|Deployment Circuit Breaker]] bricht das ab:

```json title="Teil der Service-Definition"
"deploymentConfiguration": {
  "minimumHealthyPercent": 100,
  "maximumPercent": 200,
  "deploymentCircuitBreaker": { "enable": true, "rollback": true }
}
```

Er zählt fehlgeschlagene Starts und Health-Checks. Die Schwelle liegt standardmäßig bei der Hälfte von
`desiredCount`, mindestens aber 3. Ist sie erreicht, wird das Deployment `FAILED`. Mit `rollback: true` kehrt
ECS automatisch zur letzten erfolgreichen Revision zurück.

> [!FEHLER]
> **Circuit Breaker ohne Health-Checks.** Er erkennt nur, was gemessen wird. Läuft der Container, liefert aber
> nur Fehlerseiten, merkt ECS nichts – erst ein Health-Check auf `/up` macht den Fehler sichtbar.

## Blue/Green, Canary und Linear

Neben `ROLLING` kennt ECS weitere Strategien im Feld `deploymentConfiguration.strategy`:

| Strategie | Ablauf | Voraussetzung |
|---|---|---|
| `BLUE_GREEN` | neue Version komplett parallel, dann Umschalten, alte bleibt für die `bakeTimeInMinutes` | ALB mit zwei Target Groups |
| `CANARY` | erst wenige Prozent Verkehr, nach Wartezeit der Rest | ebenso |
| `LINEAR` | Verkehr wandert in gleichen Schritten | ebenso |

Bei [[blue-green-deployment|Blue/Green]] ist das Zurückschalten in Sekunden möglich, weil die alte Version noch
läuft. Dafür zahlst du kurzzeitig doppelt. Lifecycle-Hooks können vor dem Umschalten automatische Tests starten.
Details stehen in der [Doku zu Blue/Green](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-type-blue-green.html).

## Autoscaling mit Target Tracking

[[application-auto-scaling|Application Auto Scaling]] passt den `desiredCount` eines Services an. Die einfachste
und meist beste Variante ist [[target-tracking|Target Tracking]]: Du nennst einen Zielwert, AWS regelt nach.

```json title="cpu-policy.json"
{
  "TargetValue": 60.0,
  "PredefinedMetricSpecification": { "PredefinedMetricType": "ECSServiceAverageCPUUtilization" },
  "ScaleOutCooldown": 60,
  "ScaleInCooldown": 300
}
```

| Metrik | passt für |
|---|---|
| `ECSServiceAverageCPUUtilization` | rechenlastige Web-Apps |
| `ECSServiceAverageMemoryUtilization` | speicherhungrige Dienste |
| `ALBRequestCountPerTarget` | Web-Apps, deren Last an Anfragen hängt |

Hochskalieren geht schnell (kurze Abkühlzeit), Herunterskalieren vorsichtig (lange Abkühlzeit). Für
Queue-Worker skalierst du besser nach der Länge der Warteschlange.

> [!PRAXIS]
> Lege immer `min-capacity` und `max-capacity` fest. Das Minimum (mindestens 2) sichert Ausfallsicherheit über
> zwei Availability Zones. Das Maximum schützt dich vor einer Kostenexplosion, etwa bei einem Bot-Angriff.

## Zusammenfassung

- **Rolling Update** ist der Standard: `minimumHealthyPercent` und `maximumPercent` steuern, wie viele Tasks laufen.
- Alte und neue Version laufen kurz gleichzeitig – Migrationen müssen das aushalten.
- Der **Circuit Breaker** stoppt Deployments, die nie gesund werden, und rollt mit `rollback: true` zurück.
- `BLUE_GREEN`, `CANARY` und `LINEAR` verschieben Verkehr zwischen zwei Target Groups.
- **Target Tracking** hält eine Metrik wie 60 Prozent CPU, innerhalb fester Minimal- und Maximalgrenzen.
