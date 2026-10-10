---
title: Logs in CloudWatch und Health-Checks
summary: Wie die Ausgaben deiner Container in CloudWatch Logs landen und wie ECS erkennt, ob ein Container wirklich gesund ist.
duration: 20
sources:
  - title: Send Amazon ECS logs to CloudWatch
    url: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/using_awslogs.html
  - title: HealthCheck (Amazon ECS API Reference)
    url: https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_HealthCheck.html
  - title: Determine Amazon ECS task health using container health checks
    url: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/healthcheck.html
  - title: Laravel – Health Route
    url: https://laravel.com/docs/deployment#the-health-route
quiz:
  - type: single
    question: Warum sollte Laravel im Container nach stderr loggen statt in storage/logs/laravel.log?
    options:
      - Weil Dateien im Container verboten sind.
      - Weil nur die Standardausgaben vom Log-Treiber eingesammelt werden und Dateien mit dem Task verschwinden.
      - Weil stderr schneller ist.
      - Weil CloudWatch nur Fehler speichert.
    answer: 1
    explanation: Der awslogs-Treiber liest stdout und stderr. Eine Logdatei im Container ist nach dem Ende des Tasks weg und für niemanden sichtbar.
  - type: match
    question: Ordne jede awslogs-Option ihrer Bedeutung zu.
    pairs:
      - { left: "awslogs-group", right: "Log-Gruppe in CloudWatch, z. B. /ecs/shop" }
      - { left: "awslogs-region", right: "Region, in die geschrieben wird" }
      - { left: "awslogs-stream-prefix", right: "Präfix des Log-Streams, z. B. web" }
      - { left: "awslogs-create-group", right: "Gruppe anlegen, falls sie fehlt (braucht extra Rechte)" }
    explanation: Die ersten drei brauchst du praktisch immer. Besser ist es, die Log-Gruppe vorher mit Aufbewahrungsdauer anzulegen.
  - type: find-bug
    question: Der Container wird immer wieder als „unhealthy“ ersetzt, obwohl die App läuft. Im Image ist kein curl installiert. Welche Zeile ist schuld?
    language: json
    code: |
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8080/up || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 30
      }
    bug_line: 2
    explanation: Der Health-Check läuft im Container. Fehlt curl, scheitert er immer. Nutze ein vorhandenes Werkzeug oder installiere curl im Image.
  - type: multiple
    question: Welche Aussagen über Health-Checks stimmen?
    options:
      - Der Container-Health-Check läuft innerhalb des Containers.
      - Der Load-Balancer-Health-Check prüft den Task von außen über das Netzwerk.
      - startPeriod gibt der App Zeit zum Hochfahren, bevor Fehlschläge zählen.
      - Ein Health-Check ersetzt Logs und Monitoring.
    answers: [0, 1, 2]
    explanation: Beide Health-Checks ergänzen sich. Logs und Metriken brauchst du trotzdem, um zu verstehen, warum etwas krank ist.
tasks:
  - id: logs-und-check
    type: terminal
    title: Logs und Health-Check ergänzen
    description: |
      Im Ordner `logs-health` liegt `web.json` mit dem Container `app`. Ihm fehlen Logs und ein Health-Check.

      1. Füge eine `logConfiguration` mit `logDriver` `awslogs` hinzu. Optionen: `awslogs-group` `/ecs/shop`,
         `awslogs-region` `eu-central-1`, `awslogs-stream-prefix` `web`.
      2. Füge einen `healthCheck` hinzu: `command` ist
         `["CMD-SHELL", "curl -fsS http://localhost:8080/up || exit 1"]`, `interval` 30, `timeout` 5,
         `retries` 3, `startPeriod` 60 (alles Zahlen).
      3. Setze in `environment` zusätzlich `LOG_CHANNEL` auf `stderr`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: logs-health
    setup: |
      cat > web.json <<'JSON'
      {
        "family": "shop-web",
        "requiresCompatibilities": ["FARGATE"],
        "networkMode": "awsvpc",
        "cpu": "512",
        "memory": "1024",
        "containerDefinitions": [
          {
            "name": "app",
            "image": "123456789012.dkr.ecr.eu-central-1.amazonaws.com/shop:1.4.0",
            "essential": true,
            "portMappings": [{ "containerPort": 8080, "protocol": "tcp" }],
            "environment": [{ "name": "APP_ENV", "value": "production" }]
          }
        ]
      }
      JSON
    checks:
      - type: command
        run: jq -e '.containerDefinitions[0].logConfiguration.logDriver == "awslogs"' web.json
        message: Dem Container fehlt logConfiguration mit logDriver awslogs (oder web.json ist ungültig).
      - type: command
        run: jq -e '.containerDefinitions[0].logConfiguration.options | .["awslogs-group"] == "/ecs/shop" and .["awslogs-region"] == "eu-central-1" and .["awslogs-stream-prefix"] == "web"' web.json
        message: Die awslogs-Optionen stimmen noch nicht (Gruppe /ecs/shop, Region eu-central-1, Präfix web).
      - type: command
        run: jq -e '.containerDefinitions[0].healthCheck.command == ["CMD-SHELL", "curl -fsS http://localhost:8080/up || exit 1"]' web.json
        message: healthCheck.command fehlt oder weicht ab – zwei Einträge, CMD-SHELL und der curl-Befehl.
      - type: command
        run: jq -e '.containerDefinitions[0].healthCheck | .interval == 30 and .timeout == 5 and .retries == 3 and .startPeriod == 60' web.json
        message: interval 30, timeout 5, retries 3 und startPeriod 60 müssen als Zahlen im healthCheck stehen.
      - type: command
        run: jq -e '.containerDefinitions[0].environment | any(.name == "LOG_CHANNEL" and .value == "stderr") and any(.name == "APP_ENV")' web.json
        message: In environment fehlt LOG_CHANNEL=stderr, oder APP_ENV ist verloren gegangen.
    hints:
      - logConfiguration und healthCheck stehen auf derselben Ebene wie image und portMappings, also im Container-Objekt.
      - "Mit jq: `.containerDefinitions[0].logConfiguration = {\"logDriver\": \"awslogs\", \"options\": {…}}`."
      - "Ein neuer Eintrag in environment: `.containerDefinitions[0].environment += [{\"name\": \"LOG_CHANNEL\", \"value\": \"stderr\"}]`."
    solution: |
      ```bash
      cd logs-health
      jq '.containerDefinitions[0].logConfiguration = {
            "logDriver": "awslogs",
            "options": {
              "awslogs-group": "/ecs/shop",
              "awslogs-region": "eu-central-1",
              "awslogs-stream-prefix": "web"
            }
          }
          | .containerDefinitions[0].healthCheck = {
            "command": ["CMD-SHELL", "curl -fsS http://localhost:8080/up || exit 1"],
            "interval": 30, "timeout": 5, "retries": 3, "startPeriod": 60
          }
          | .containerDefinitions[0].environment += [{"name": "LOG_CHANNEL", "value": "stderr"}]' web.json > web.neu.json
      mv web.neu.json web.json
      jq '.containerDefinitions[0]' web.json
      ```
  - id: logs-lesen
    type: simulated
    title: Einen abstürzenden Task untersuchen
    description: |
      Der Service `web` im Cluster `shop` startet seine Tasks immer wieder neu. Finde heraus, warum.

      1. Lies die Logs der letzten zehn Minuten: `aws logs tail /ecs/shop --since 10m`.
      2. Die Logs zeigen einen Fehler zur Datenbank. Prüfe mit
         `aws ecs describe-services --cluster shop --services web --query "services[0].events[0:3]"` die letzten Ereignisse des Services.
    prompt: "du@laptop:~$"
    steps:
      - expect: "^aws\\s+logs\\s+tail\\s+/ecs/shop\\b.*--since\\s+10m.*$"
        output: |
          2026-10-10T09:14:02 web/app/0f3c9a1b [2026-10-10 09:14:02] production.ERROR: SQLSTATE[08006] could not connect to server: Connection timed out (Connection: pgsql)
          2026-10-10T09:14:02 web/app/0f3c9a1b PHP Fatal error: Uncaught PDOException in /var/www/html/vendor/laravel/framework/src/Illuminate/Database/Connectors/Connector.php
          2026-10-10T09:14:33 web/app/9a8b7c6d [2026-10-10 09:14:33] production.ERROR: SQLSTATE[08006] could not connect to server: Connection timed out (Connection: pgsql)
        hint: aws logs tail /ecs/shop --since 10m
      - expect: "^aws\\s+ecs\\s+describe-services\\s+.*--cluster\\s+shop\\b.*--services\\s+web\\b.*$"
        output: |
          [
              { "message": "(service web) has started 1 tasks: (task 9a8b7c6d5e4f4a3b2c1d0e9f8a7b6c5d)." },
              { "message": "(service web) deregistered 1 targets in (target-group arn:aws:elasticloadbalancing:eu-central-1:123456789012:targetgroup/shop-web/6d0ecf831eec9f09)" },
              { "message": "(service web) (task 0f3c9a1b2d4e4f5a8b7c6d5e4f3a2b1c) failed container health checks." }
          ]

          Diagnose: Die App erreicht die Datenbank nicht (Timeout). Typische Ursache: Die Security Group der
          Datenbank erlaubt Port 5432 nicht von der Security Group der Tasks – das klärst du in Modul 3.
        hint: aws ecs describe-services --cluster shop --services web --query "services[0].events[0:3]"
    responses:
      - match: "^aws\\s+logs\\s+describe-log-groups"
        output: '{ "logGroups": [ { "logGroupName": "/ecs/shop", "retentionInDays": 30 } ] }'
---
Auf deinem Laptop schaust du mit `docker logs` in einen Container. Bei Fargate gibt es keinen Host, auf dem du
das tippen könntest – und wenn ein Task beendet wird, ist er weg. Damit du trotzdem siehst, was passiert, müssen
die Ausgaben an einen zentralen Ort. Außerdem muss ECS erkennen, ob ein laufender Container wirklich
funktioniert.

## Logs: stdout und stderr nach CloudWatch

Der Log-Treiber [[awslogs]] sammelt alles, was ein Container auf die [[standardausgabe|Standardausgabe]] und
die [[standardfehlerausgabe|Standardfehlerausgabe]] schreibt, und schickt es an
[[cloudwatch-logs|CloudWatch Logs]]:

```json title="Teil einer Container-Definition"
"logConfiguration": {
  "logDriver": "awslogs",
  "options": {
    "awslogs-group": "/ecs/shop",
    "awslogs-region": "eu-central-1",
    "awslogs-stream-prefix": "web"
  }
}
```

| Begriff | Bedeutung |
|---|---|
| [[log-group|Log-Gruppe]] `/ecs/shop` | Sammelbehälter, z. B. eine pro Anwendung |
| Log-Stream `web/app/<task-id>` | ein Stream pro Container und Task |
| Aufbewahrung | legst du pro Gruppe fest, z. B. 30 Tage |

Das Schreiben erledigt die Execution-Rolle. Lege die Gruppe vorher mit einer Aufbewahrungsdauer an – sonst
bleiben Logs für immer liegen und kosten jeden Monat mehr.

## Laravel richtig loggen

Laravel schreibt standardmäßig in `storage/logs/laravel.log`. Im Container ist das eine Sackgasse: Die Datei
sieht niemand, und sie verschwindet mit dem Task.

```bash title="Umgebungsvariablen für die Task-Definition"
LOG_CHANNEL=stderr
LOG_LEVEL=info
```

Auch nginx und PHP-FPM sollten nach stdout/stderr schreiben. Die offiziellen Images sind meist schon so
eingestellt.

```bash title="Logs ansehen"
aws logs tail /ecs/shop --follow --since 15m
```

> [!FEHLER]
> **Logs in eine Datei im Container schreiben.** In CloudWatch erscheint dann nichts, und nach einem Absturz
> sind alle Hinweise verloren. Alles, was du sehen willst, gehört nach stdout oder stderr.

## Container-Health-Check

Ein Container kann laufen und trotzdem kaputt sein, etwa wenn PHP-FPM hängt. Ein
[[healthcheck|Health-Check]] in der Container-Definition prüft das regelmäßig **im Container**:

```json
"healthCheck": {
  "command": ["CMD-SHELL", "curl -fsS http://localhost:8080/up || exit 1"],
  "interval": 30,
  "timeout": 5,
  "retries": 3,
  "startPeriod": 60
}
```

| Feld | Bedeutung |
|---|---|
| `command` | Befehl; Exit-Code 0 heißt gesund |
| `interval` | Sekunden zwischen zwei Prüfungen |
| `timeout` | so lange darf eine Prüfung dauern |
| `retries` | so viele Fehlschläge in Folge → „unhealthy“ |
| `startPeriod` | Schonfrist beim Start, in der Fehlschläge nicht zählen |

Ist ein essentieller Container „unhealthy“, ersetzt der Service den Task. Laravel bringt dafür die Route
`/up` mit.

> [!MERKSATZ]
> **Der Health-Check-Befehl läuft im Container.** Was er aufruft – etwa `curl` –, muss im Image installiert sein.

## Zwei Health-Checks, zwei Blickwinkel

Später kommt ein Load Balancer dazu. Auch er prüft deine Tasks, aber **von außen** über das Netzwerk.

| | Container-Health-Check | Load-Balancer-Health-Check |
|---|---|---|
| läuft | im Container | im Load Balancer |
| prüft | Prozess lebt und antwortet lokal | Task ist über das Netzwerk erreichbar |
| Folge bei Fehlschlag | Task wird ersetzt | kein Verkehr mehr, dann Ersatz |

> [!PRAXIS]
> Halte die Health-Route **leicht**: Sie soll zeigen, dass die App antwortet. Prüft sie zusätzlich Datenbank,
> Redis und drei externe APIs, fallen bei einer Störung von außen alle Tasks gleichzeitig durch, und ECS
> ersetzt sie unnötig im Kreis.

## Zusammenfassung

- Der Treiber **awslogs** schickt stdout und stderr nach **CloudWatch Logs**.
- Log-Gruppe, Region und Stream-Präfix stehen in `logConfiguration`; Aufbewahrung pro Gruppe festlegen.
- Laravel loggt im Container mit `LOG_CHANNEL=stderr`.
- Der **Container-Health-Check** läuft im Container; `startPeriod` gibt Zeit zum Hochfahren.
- Der **Load-Balancer-Health-Check** prüft von außen – beide ergänzen sich.
- Health-Routen bleiben leicht, sonst kaskadieren Störungen.
