---
title: Laravel auf Fargate betreiben – und was es kostet
summary: Web, Queue-Worker und Scheduler als getrennte Services aus einem Image, Migrationen als One-off-Task und eine ehrliche Kostenrechnung.
duration: 25
sources:
  - title: Laravel – Deployment
    url: https://laravel.com/docs/deployment
  - title: Laravel – Queues (Running the Queue Worker)
    url: https://laravel.com/docs/queues#running-the-queue-worker
  - title: Laravel – Task Scheduling
    url: https://laravel.com/docs/scheduling#running-the-scheduler-locally
  - title: Running an application as an Amazon ECS task (run-task)
    url: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/standalone-task-create.html
  - title: AWS Fargate Pricing
    url: https://aws.amazon.com/fargate/pricing/
quiz:
  - type: single
    question: Warum läuft der Laravel-Scheduler als Service mit genau einem Task?
    options:
      - Weil schedule:work sehr viel Speicher braucht.
      - Weil mehrere Scheduler-Tasks jeden geplanten Befehl mehrfach auslösen würden.
      - Weil ECS nur einen Task pro Service erlaubt.
      - Weil der Scheduler einen Load Balancer braucht.
    answer: 1
    explanation: Jeder schedule:work-Prozess löst die Befehle selbst aus. Zwei Tasks würden Rechnungen doppelt verschicken – außer jeder Befehl nutzt onOneServer() mit gemeinsamem Cache.
  - type: multiple
    question: Welche Laravel-Einstellungen passen zu mehreren Fargate-Tasks?
    options:
      - SESSION_DRIVER=redis oder database
      - CACHE_STORE=file
      - FILESYSTEM_DISK=s3 für Uploads
      - LOG_CHANNEL=stderr
    answers: [0, 2, 3]
    explanation: Tasks haben kein gemeinsames Dateisystem und verschwinden beim Deployment. Alles Gemeinsame muss in Datenbank, Redis oder S3.
  - type: find-bug
    question: Die Migration soll vor dem Rollout einmal laufen. Was ist an diesem Ablauf falsch?
    language: bash
    code: |
      aws ecs register-task-definition --cli-input-json file://web.json
      aws ecs update-service --cluster shop --service web --task-definition shop-web:9
      aws ecs run-task --cluster shop --task-definition shop-web:9 --launch-type FARGATE \
        --overrides '{"containerOverrides":[{"name":"app","command":["php","artisan","migrate","--force"]}]}'
    bug_line: 2
    explanation: Der Service wird schon aktualisiert, bevor die Migration gelaufen ist. Richtig ist erst run-task mit migrate, auf das Ende warten, Exit-Code prüfen – und dann update-service.
  - type: single
    question: "Ein Task mit 0,5 vCPU und 1 GB läuft rund um die Uhr. Wodurch halbieren sich die Rechenkosten ungefähr am deutlichsten, ohne die Größe zu ändern?"
    options:
      - Durch ein kleineres Docker-Image
      - Durch Fargate Spot für Tasks, die eine Unterbrechung verkraften
      - Durch mehr Logs
      - Durch einen zweiten Cluster
    answer: 1
    explanation: Fargate Spot ist deutlich rabattiert, kann aber mit zwei Minuten Vorwarnung beendet werden – gut für Worker, die Jobs wiederholen.
tasks:
  - id: scheduler-und-migration
    type: terminal
    title: Scheduler-Definition und Migrations-Override
    description: |
      Im Ordner `laravel-services` liegt `web.json`, die Task-Definition der Web-App mit dem Container `app`.
      Erzeuge daraus zwei neue Dateien.

      1. `scheduler.json`: eine Kopie von `web.json` mit
         - `family` `shop-scheduler`,
         - `command` des Containers `app` gleich `["php", "artisan", "schedule:work"]`,
         - **ohne** `portMappings` und **ohne** `healthCheck` (der Scheduler hat keinen Webserver).
         Alles andere (Image, Rollen, Secrets, Logs) bleibt gleich.
      2. `migrate-overrides.json`: das JSON für `aws ecs run-task --overrides`. Es überschreibt beim Container
         `app` den Befehl mit `["php", "artisan", "migrate", "--force"]`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: laravel-services
    setup: |
      cat > web.json <<'JSON'
      {
        "family": "shop-web",
        "requiresCompatibilities": ["FARGATE"],
        "networkMode": "awsvpc",
        "cpu": "512",
        "memory": "1024",
        "executionRoleArn": "arn:aws:iam::123456789012:role/shop-execution",
        "taskRoleArn": "arn:aws:iam::123456789012:role/shop-task",
        "containerDefinitions": [
          {
            "name": "app",
            "image": "123456789012.dkr.ecr.eu-central-1.amazonaws.com/shop:1.4.0",
            "essential": true,
            "portMappings": [{ "containerPort": 8080, "protocol": "tcp" }],
            "environment": [
              { "name": "APP_ENV", "value": "production" },
              { "name": "LOG_CHANNEL", "value": "stderr" }
            ],
            "secrets": [
              { "name": "APP_KEY", "valueFrom": "arn:aws:secretsmanager:eu-central-1:123456789012:secret:shop/production-AbCdEf:APP_KEY::" }
            ],
            "healthCheck": {
              "command": ["CMD-SHELL", "curl -fsS http://localhost:8080/up || exit 1"],
              "interval": 30, "timeout": 5, "retries": 3, "startPeriod": 60
            },
            "logConfiguration": {
              "logDriver": "awslogs",
              "options": { "awslogs-group": "/ecs/shop", "awslogs-region": "eu-central-1", "awslogs-stream-prefix": "web" }
            }
          }
        ]
      }
      JSON
    checks:
      - type: command
        run: jq -e '.family == "shop-scheduler"' scheduler.json
        message: scheduler.json fehlt, ist ungültig oder family ist nicht shop-scheduler.
      - type: command
        run: jq -e '.containerDefinitions[0].command == ["php","artisan","schedule:work"]' scheduler.json
        message: Der Container app in scheduler.json braucht command ["php", "artisan", "schedule:work"].
      - type: command
        run: jq -e '.containerDefinitions[0] | has("portMappings") or has("healthCheck") | not' scheduler.json
        message: Entferne portMappings und healthCheck aus dem Scheduler-Container.
      - type: command
        run: jq -e --slurpfile web web.json '.containerDefinitions[0].image == $web[0].containerDefinitions[0].image and .containerDefinitions[0].secrets == $web[0].containerDefinitions[0].secrets and .containerDefinitions[0].logConfiguration == $web[0].containerDefinitions[0].logConfiguration and .taskRoleArn == $web[0].taskRoleArn' scheduler.json
        message: Image, secrets, logConfiguration und taskRoleArn sollen genau wie in web.json bleiben.
      - type: command
        run: jq -e '.family == "shop-web" and (.containerDefinitions[0] | has("portMappings"))' web.json
        message: web.json selbst soll unverändert bleiben – erzeuge scheduler.json als Kopie.
      - type: command
        run: jq -e '.containerOverrides == [{"name":"app","command":["php","artisan","migrate","--force"]}]' migrate-overrides.json
        message: migrate-overrides.json braucht genau containerOverrides mit name app und command ["php", "artisan", "migrate", "--force"].
    hints:
      - "jq kann kopieren und ändern in einem Schritt: `jq '…' web.json > scheduler.json`."
      - "Felder entfernst du mit `del(...)`, z. B. `del(.containerDefinitions[0].portMappings)`."
      - "Das Override-JSON ist klein: `{\"containerOverrides\": [{\"name\": \"app\", \"command\": [...]}]}`."
    solution: |
      ```bash
      cd laravel-services
      jq '.family = "shop-scheduler"
          | .containerDefinitions[0].command = ["php", "artisan", "schedule:work"]
          | del(.containerDefinitions[0].portMappings, .containerDefinitions[0].healthCheck)' web.json > scheduler.json
      cat > migrate-overrides.json <<'JSON'
      {
        "containerOverrides": [
          { "name": "app", "command": ["php", "artisan", "migrate", "--force"] }
        ]
      }
      JSON
      jq . scheduler.json migrate-overrides.json
      ```
  - id: kosten-rechnen
    type: code
    language: php
    title: Monatliche Fargate-Kosten berechnen
    description: |
      Schreibe `fargateMonthlyCost(float $vcpu, float $memoryGb, int $tasks, float $pricePerVcpuHour, float $pricePerGbHour, int $hours = 730): float`.
      Sie berechnet die Kosten für `$tasks` gleich große Tasks, die `$hours` Stunden laufen:

      `tasks × hours × (vcpu × Preis pro vCPU-Stunde + memoryGb × Preis pro GB-Stunde)`

      Runde auf zwei Nachkommastellen. Bei `$tasks` ≤ 0 ist das Ergebnis `0.0`. Die Preise sind Parameter, weil sie
      je nach Region und Architektur unterschiedlich sind – in den Tests stehen erfundene Beispielpreise.
    starter: |
      <?php
      declare(strict_types=1);

      function fargateMonthlyCost(float $vcpu, float $memoryGb, int $tasks, float $pricePerVcpuHour, float $pricePerGbHour, int $hours = 730): float
      {
          // Deine Lösung
      }
    tests:
      - name: zwei Tasks einen Monat lang
        code: assert_same(43.8, fargateMonthlyCost(0.5, 1.0, 2, 0.04, 0.01))
      - name: ein Task für 10 Stunden
        code: assert_same(0.5, fargateMonthlyCost(1.0, 2.0, 1, 0.03, 0.01, 10))
      - name: keine Tasks kosten nichts
        code: assert_same(0.0, fargateMonthlyCost(0.5, 1.0, 0, 0.04, 0.01))
      - name: Rundung auf Cent
        code: assert_same(1.4, fargateMonthlyCost(0.25, 0.5, 1, 0.0333, 0.0033, 140))
    solution: |
      <?php
      declare(strict_types=1);

      function fargateMonthlyCost(float $vcpu, float $memoryGb, int $tasks, float $pricePerVcpuHour, float $pricePerGbHour, int $hours = 730): float
      {
          if ($tasks <= 0) {
              return 0.0;
          }

          $perTaskHour = $vcpu * $pricePerVcpuHour + $memoryGb * $pricePerGbHour;

          return round($tasks * $hours * $perTaskHour, 2);
      }
---
Auf einem klassischen Server läuft alles nebeneinander: nginx, PHP-FPM, ein Queue-Worker unter Supervisor und
ein Cron-Eintrag für den Scheduler. Auf Fargate trennst du diese Aufgaben in eigene Services. Das klingt nach mehr
Aufwand, macht aber jede Aufgabe einzeln skalierbar und austauschbar.

![Laravel auf Fargate: ein Image, mehrere Services und ein One-off-Task](/assets/aws-fargate/laravel-services.svg)

## Ein Image, mehrere Rollen

Du baust **ein** Image mit deinem Code und allen Abhängigkeiten. Die Task-Definitionen unterscheiden sich nur in
`command`, Ports und Größe:

| Service | Befehl | Load Balancer | Anzahl |
|---|---|---|---|
| `web` | nginx + PHP-FPM (Standard-`CMD`) | ja | 2–10, nach Last |
| `worker` | `php artisan queue:work --max-time=3600` | nein | 1–5, nach Queue-Länge |
| `scheduler` | `php artisan schedule:work` | nein | genau 1 |

Der Worker beendet sich mit `--max-time` regelmäßig selbst. Der Service startet ihn neu – so wächst kein
Speicherleck über Tage. `stopTimeout` (bei Fargate höchstens 120 Sekunden) gibt laufenden Jobs beim Deployment
Zeit: ECS schickt erst `SIGTERM`, und `queue:work` beendet den aktuellen Job sauber.

> [!MERKSATZ]
> **Der Scheduler läuft genau einmal.** Zwei Scheduler-Tasks lösen jeden geplanten Befehl doppelt aus – es sei
> denn, jeder Befehl nutzt `->onOneServer()` mit einem gemeinsamen Cache wie Redis.

## Zustandslos werden

Tasks werden bei jedem Deployment ersetzt und haben kein gemeinsames Dateisystem. Alles, was mehrere Tasks teilen
oder was ein Deployment überleben muss, gehört nach außen – ganz im Sinne der
[[twelve-factor-app|Twelve-Factor App]]:

| Einstellung | lokal oft | auf Fargate |
|---|---|---|
| `SESSION_DRIVER` | `file` | `redis` oder `database` |
| `CACHE_STORE` | `file` | `redis` |
| `QUEUE_CONNECTION` | `sync` | `redis` oder `sqs` |
| `FILESYSTEM_DISK` | `local` | `s3` |
| `LOG_CHANNEL` | `stack` | `stderr` |

> [!FEHLER]
> **Uploads in `storage/app` speichern.** Sie liegen dann in genau einem Task – und sind nach dem nächsten
> Deployment weg. Nutzer laden ein Bild hoch, und beim nächsten Klick fehlt es.

## Migrationen als One-off-Task

Migrationen laufen weder beim Start jedes Web-Tasks (dann laufen sie parallel) noch in einem Service. Du startest
einen [[one-off-task|One-off-Task]] mit derselben Task-Definition und überschreibst nur den Befehl:

```bash title="Migration vor dem Rollout"
TASK_ARN=$(aws ecs run-task --cluster shop --task-definition shop-web:9 --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-0aaa1111],securityGroups=[sg-0app3333bbbb4444]}" \
  --overrides file://migrate-overrides.json --query 'tasks[0].taskArn' --output text)

aws ecs wait tasks-stopped --cluster shop --tasks "$TASK_ARN"
aws ecs describe-tasks --cluster shop --tasks "$TASK_ARN" --query 'tasks[0].containers[0].exitCode'
```

Erst wenn der Exit-Code `0` ist, aktualisierst du die Services. Die Migration muss mit der alten Version
funktionieren ([[expand-contract|Expand/Contract]]), weil beide beim Rolling Update kurz gleichzeitig laufen.

## Was kostet das?

Fargate rechnet pro Sekunde nach angeforderten vCPU und GB ab, mit einer Minute Minimum. Die Formel:

```text
Kosten = Tasks × Stunden × (vCPU × Preis pro vCPU-Stunde + GB × Preis pro GB-Stunde)
```

Die aktuellen Preise je Region stehen auf der [Preisseite](https://aws.amazon.com/fargate/pricing/). Dazu kommen:

| Posten | Hinweis |
|---|---|
| Application Load Balancer | Grundgebühr pro Stunde plus Nutzung |
| NAT-Gateway | pro Stunde und pro GB – oft unterschätzt |
| CloudWatch Logs | pro GB Aufnahme und Speicherung |
| ECR | Speicher pro GB und Monat |
| Datenbank, Redis | meist der größte Posten neben Fargate |

> [!PRAXIS]
> Drei Hebel wirken fast immer: **ARM64** (Graviton) ist pro vCPU günstiger, **Fargate Spot** spart bei Workern
> viel, und **Right-Sizing** nach echten CloudWatch-Werten verhindert, dass du 2 GB bezahlst und 400 MB nutzt.
> Staging-Umgebungen kannst du nachts per Zeitplan auf `desiredCount` 0 setzen.

## Zusammenfassung

- Ein Image, mehrere Services: **web** (mit ALB), **worker** (`queue:work`), **scheduler** (`schedule:work`, genau 1 Task).
- Laravel wird zustandslos: Sessions und Cache in Redis, Uploads in S3, Logs nach stderr.
- **Migrationen** laufen als One-off-Task mit `--overrides`; erst bei Exit-Code 0 wird ausgerollt.
- `stopTimeout` und `--max-time` lassen Worker sauber enden und regelmäßig neu starten.
- Kosten = Tasks × Stunden × (vCPU- und GB-Preis) plus Load Balancer, NAT, Logs, Datenbank.
- ARM64, Fargate Spot und Right-Sizing sind die wichtigsten Sparhebel.
