---
title: Application Load Balancer und Target Groups
summary: Wie Anfragen aus dem Internet über Listener und Target Groups bei deinen Tasks ankommen und wie der Service sie automatisch registriert.
duration: 22
sources:
  - title: Use load balancing to distribute Amazon ECS service traffic
    url: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-load-balancing.html
  - title: What is an Application Load Balancer?
    url: https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html
  - title: Target groups for your Application Load Balancers
    url: https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-target-groups.html
  - title: Laravel – Configuring Trusted Proxies
    url: https://laravel.com/docs/requests#configuring-trusted-proxies
quiz:
  - type: single
    question: Welchen Zieltyp braucht eine Target Group für Fargate-Tasks?
    options: [instance, ip, lambda, alb]
    answer: 1
    explanation: Fargate-Tasks haben eigene IPs (awsvpc), aber keine EC2-Instanz. Deshalb registriert ECS sie über ihre IP-Adresse.
  - type: match
    question: Ordne jeden Baustein des Load Balancers seiner Aufgabe zu.
    pairs:
      - { left: "Listener", right: "Lauscht auf Protokoll und Port, z. B. HTTPS 443" }
      - { left: "Regel", right: "Entscheidet nach Host oder Pfad, wohin eine Anfrage geht" }
      - { left: "Target Group", right: "Gruppe von Zielen mit gemeinsamem Health-Check" }
      - { left: "Zertifikat aus ACM", right: "Ermöglicht HTTPS am Listener" }
    explanation: Anfrage → Listener → Regel → Target Group → gesunder Task.
  - type: multiple
    question: Laravel erzeugt hinter dem Load Balancer Links mit http:// statt https://. Was hilft?
    options:
      - Den Load Balancer als vertrauenswürdigen Proxy konfigurieren, damit Laravel X-Forwarded-Proto auswertet.
      - Im Container ein eigenes TLS-Zertifikat einrichten.
      - "In bootstrap/app.php `$middleware->trustProxies(at: '*')` setzen, wenn nur der Load Balancer die Tasks erreicht."
      - Den Listener auf Port 80 umstellen.
    answers: [0, 2]
    explanation: TLS endet am Load Balancer. Er teilt Laravel per X-Forwarded-Proto mit, dass die ursprüngliche Anfrage HTTPS war – Laravel muss ihm dafür vertrauen.
  - type: single
    question: Wozu dient healthCheckGracePeriodSeconds im Service?
    options:
      - Wie lange ein Deployment höchstens dauern darf
      - Wie lange Load-Balancer-Health-Checks nach dem Start eines Tasks ignoriert werden
      - Wie oft der Load Balancer prüft
      - Wie lange Verbindungen beim Entfernen eines Tasks noch auslaufen dürfen
    answer: 1
    explanation: Eine langsam startende App würde sonst ersetzt, bevor sie bereit ist. Das Auslaufen beim Entfernen heißt Deregistration Delay.
tasks:
  - id: anfrage-weg
    type: order
    title: Der Weg einer Anfrage
    description: Bringe die Stationen einer HTTPS-Anfrage an `https://shop.example.com/produkte` in die richtige Reihenfolge.
    items:
      - DNS löst shop.example.com auf den Load Balancer auf
      - Der HTTPS-Listener auf Port 443 nimmt die Verbindung an und beendet TLS
      - Eine Listener-Regel wählt die Target Group shop-web
      - Die Target Group schickt die Anfrage an einen gesunden Task auf Port 8080
      - nginx im Task reicht sie an PHP-FPM über localhost weiter
      - Laravel antwortet, die Antwort läuft über den Load Balancer zurück
  - id: service-mit-alb
    type: terminal
    title: Service-Definition mit Load Balancer
    description: |
      Schreibe im Ordner `web-service` die Datei `service.json`. Sie wird später mit
      `aws ecs create-service --cli-input-json file://service.json` verwendet.

      1. `cluster` ist `shop`, `serviceName` ist `web`, `taskDefinition` ist `shop-web`, `desiredCount` ist `2`,
         `launchType` ist `FARGATE`.
      2. `loadBalancers` enthält **einen** Eintrag mit `targetGroupArn`
         `arn:aws:elasticloadbalancing:eu-central-1:123456789012:targetgroup/shop-web/6d0ecf831eec9f09`,
         `containerName` `app` und `containerPort` `8080`.
      3. `healthCheckGracePeriodSeconds` ist `60`.
      4. `networkConfiguration.awsvpcConfiguration`: Subnetze `subnet-0aaa1111` und `subnet-0bbb2222`,
         Security Group `sg-0app3333bbbb4444`, `assignPublicIp` `DISABLED`.

      Prüfe mit `jq . service.json`.
    workdir: web-service
    checks:
      - type: command
        run: jq -e '.cluster == "shop" and .serviceName == "web" and .taskDefinition == "shop-web" and .desiredCount == 2 and .launchType == "FARGATE"' service.json
        message: service.json fehlt, ist ungültig, oder cluster, serviceName, taskDefinition, desiredCount (Zahl 2) bzw. launchType stimmen nicht.
      - type: command
        run: jq -e '(.loadBalancers | length == 1) and .loadBalancers[0].containerName == "app" and .loadBalancers[0].containerPort == 8080 and (.loadBalancers[0].targetGroupArn | endswith(":targetgroup/shop-web/6d0ecf831eec9f09"))' service.json
        message: loadBalancers braucht genau einen Eintrag mit der Target-Group-ARN, containerName app und containerPort 8080.
      - type: command
        run: jq -e '.healthCheckGracePeriodSeconds == 60' service.json
        message: healthCheckGracePeriodSeconds soll die Zahl 60 sein.
      - type: command
        run: jq -e '.networkConfiguration.awsvpcConfiguration | (.subnets | sort) == ["subnet-0aaa1111","subnet-0bbb2222"] and .securityGroups == ["sg-0app3333bbbb4444"] and .assignPublicIp == "DISABLED"' service.json
        message: Unter networkConfiguration.awsvpcConfiguration fehlen die zwei Subnetze, die Security Group oder assignPublicIp DISABLED.
    hints:
      - "Die Struktur: `{ \"cluster\": …, \"loadBalancers\": [ { … } ], \"networkConfiguration\": { \"awsvpcConfiguration\": { … } } }`."
      - containerName muss exakt dem Container-Namen in der Task-Definition entsprechen – hier `app`.
      - "Zahlen ohne Anführungszeichen: `\"desiredCount\": 2`, `\"containerPort\": 8080`."
    solution: |
      ```bash
      cd web-service
      cat > service.json <<'JSON'
      {
        "cluster": "shop",
        "serviceName": "web",
        "taskDefinition": "shop-web",
        "desiredCount": 2,
        "launchType": "FARGATE",
        "loadBalancers": [
          {
            "targetGroupArn": "arn:aws:elasticloadbalancing:eu-central-1:123456789012:targetgroup/shop-web/6d0ecf831eec9f09",
            "containerName": "app",
            "containerPort": 8080
          }
        ],
        "healthCheckGracePeriodSeconds": 60,
        "networkConfiguration": {
          "awsvpcConfiguration": {
            "subnets": ["subnet-0aaa1111", "subnet-0bbb2222"],
            "securityGroups": ["sg-0app3333bbbb4444"],
            "assignPublicIp": "DISABLED"
          }
        }
      }
      JSON
      jq . service.json
      ```
---
Zwei Tasks laufen, jeder mit eigener privater IP. Aber wie kommen Besucher dorthin? Die IPs ändern sich bei
jedem Deployment, und aus dem Internet sind private IPs ohnehin nicht erreichbar. Du brauchst einen festen
Eingang, der Anfragen auf die gerade gesunden Tasks verteilt.

## Der Application Load Balancer

Ein [[application-load-balancer|Application Load Balancer]] (ALB) ist ein verwalteter
[[load-balancer|Load Balancer]] für HTTP und HTTPS. Er steht in öffentlichen Subnetzen, hat einen festen
DNS-Namen und verteilt Anfragen an die Tasks dahinter.

Er besteht aus drei Bausteinen:

| Baustein | Aufgabe |
|---|---|
| [[listener|Listener]] | lauscht auf Protokoll und Port, z. B. HTTPS 443 |
| Regel | wählt nach Host oder Pfad eine Target Group |
| [[target-group|Target Group]] | Gruppe von Zielen mit gemeinsamem Health-Check |

Typisch sind zwei Listener: Port 443 mit einem Zertifikat aus AWS Certificate Manager (ACM) und Port 80, der nur
auf HTTPS umleitet. TLS endet am ALB – zwischen ALB und Task läuft in deinem privaten Netz meist HTTP.

## Target Groups für Fargate

Für Fargate muss die Target Group den Zieltyp `ip` haben: Es gibt keine EC2-Instanz, nur die IP der ENI.

```bash title="Target Group anlegen"
aws elbv2 create-target-group \
  --name shop-web --protocol HTTP --port 8080 \
  --target-type ip --vpc-id vpc-0a1b2c3d4e5f60718 \
  --health-check-path /up --matcher HttpCode=200
```

Die Target Group prüft jedes Ziel regelmäßig über `/up`. Nur gesunde Ziele bekommen Verkehr.

Wird ein Task entfernt, lässt der ALB laufende Anfragen noch auslaufen – die **Deregistration Delay**,
standardmäßig 300 Sekunden. Für schnelle Web-Anfragen reichen oft 30 Sekunden; das beschleunigt Deployments.

> [!FEHLER]
> **Target Group mit Zieltyp `instance`.** ECS kann Fargate-Tasks darin nicht registrieren, und der Service
> lässt sich nicht anlegen. Bei Fargate immer `--target-type ip`.

## Der Service registriert die Tasks

Du trägst Tasks nie von Hand ein. Im Service steht, welcher Container auf welchem Port zu welcher Target Group
gehört:

```json title="Ausschnitt aus der Service-Definition"
"loadBalancers": [
  {
    "targetGroupArn": "arn:aws:elasticloadbalancing:eu-central-1:123456789012:targetgroup/shop-web/6d0ecf831eec9f09",
    "containerName": "app",
    "containerPort": 8080
  }
],
"healthCheckGracePeriodSeconds": 60
```

Startet ein neuer Task, registriert ECS seine IP. Wird er gestoppt, meldet ECS ihn vorher ab.
`healthCheckGracePeriodSeconds` gibt neuen Tasks Zeit, bevor fehlschlagende ALB-Checks zählen.

> [!MERKSATZ]
> **Der ALB kennt keine Tasks, nur IPs in Target Groups. Der Service pflegt diese Liste automatisch.**

## Laravel hinter dem Load Balancer

Weil TLS am ALB endet, sieht Laravel eine HTTP-Anfrage vom ALB. Ohne weitere Einstellung erzeugt es Links mit
`http://` und hält die IP des ALB für die Besucher-IP. Der ALB schickt die echten Werte in den Headern
`X-Forwarded-For` und `X-Forwarded-Proto`. Laravel wertet sie aus, sobald es dem Proxy vertraut:

```php title="bootstrap/app.php"
->withMiddleware(function (Middleware $middleware): void {
    $middleware->trustProxies(at: '*');
})
```

`'*'` ist hier vertretbar, weil die Security Group nur den ALB an die Tasks lässt. Sind Tasks direkt
erreichbar, könnte jeder diese Header fälschen.

> [!PRAXIS]
> Ein ALB kann mehrere Anwendungen bedienen: Regeln nach Host (`api.example.com` → Target Group `api`,
> `shop.example.com` → `shop-web`) sparen einen zweiten Load Balancer und damit Grundkosten.

## Zusammenfassung

- Der **ALB** ist der feste, öffentliche Eingang; TLS endet dort mit einem ACM-Zertifikat.
- **Listener** → **Regel** → **Target Group** → gesunde Tasks.
- Für Fargate braucht die Target Group `--target-type ip` und einen Health-Check wie `/up`.
- Im Service verbinden `loadBalancers` (Container + Port) und `healthCheckGracePeriodSeconds` Tasks und ALB.
- Laravel muss dem ALB als Proxy vertrauen, damit HTTPS-Links und Besucher-IPs stimmen.
