---
title: "Die Bausteine von ECS: Cluster, Task-Definition, Task, Service"
summary: Vier Begriffe, die du für jede ECS-Anwendung brauchst – und wie sie zusammenhängen.
duration: 20
sources:
  - title: Amazon ECS components
    url: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html
  - title: Amazon ECS task definitions
    url: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definitions.html
  - title: Amazon ECS services
    url: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs_services.html
  - title: Amazon ECS capacity providers for Fargate
    url: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-capacity-providers.html
quiz:
  - type: match
    question: Ordne jeden ECS-Begriff seiner Beschreibung zu.
    pairs:
      - { left: "Task-Definition", right: "Bauplan: Image, CPU, Speicher, Ports, Variablen" }
      - { left: "Task", right: "Eine laufende Instanz dieses Bauplans" }
      - { left: "Service", right: "Hält eine gewünschte Zahl von Tasks dauerhaft am Laufen" }
      - { left: "Cluster", right: "Logische Gruppe, in der Services und Tasks laufen" }
    explanation: Bauplan → Instanz → Aufpasser → Gruppierung. Diese Kette steckt hinter jeder ECS-Anwendung.
  - type: single
    question: In einem Service mit desiredCount 3 stürzt ein Task ab. Was passiert?
    options:
      - Nichts – du musst den Task von Hand neu starten.
      - Der Service startet automatisch einen neuen Task, bis wieder 3 laufen.
      - Der ganze Service wird neu deployt.
      - Der Cluster wird neu gestartet.
    answer: 1
    explanation: Der Service vergleicht ständig den Soll- mit dem Ist-Zustand und ersetzt fehlende Tasks.
  - type: single
    question: Du änderst in einer Task-Definition den Image-Tag. Was entsteht?
    options:
      - Die bestehende Revision wird überschrieben.
      - Eine neue Revision, zum Beispiel shop-web:8 statt shop-web:7.
      - Ein neuer Cluster.
      - Eine neue Task-Definition mit anderem Familiennamen.
    answer: 1
    explanation: Task-Definitionen sind unveränderlich. Jede Änderung erzeugt eine neue Revision derselben Familie.
  - type: cloze
    text: Für eine Migration, die einmal läuft und dann endet, startest du einen einzelnen ___ statt eines ___.
    blanks:
      - [Task, One-off-Task, Einzeltask]
      - [Service, Services, ECS-Service]
    explanation: Ein Service würde einen beendeten Task sofort neu starten – genau das willst du bei einer Migration nicht.
tasks:
  - id: bausteine-beschriften
    type: diagram
    title: Beschrifte die ECS-Bausteine
    description: Ordne jedem leeren Feld den richtigen ECS-Begriff zu.
    image: /assets/aws-fargate/ecs-bausteine-leer.svg
    slots:
      - { x: 15.6, y: 37, answer: Task-Definition }
      - { x: 64.4, y: 11, answer: Cluster }
      - { x: 64.4, y: 23, answer: Service }
      - { x: 46.5, y: 39, answer: Task }
    distractors: [Container-Image, Load Balancer]
    hints:
      - Der Kasten links ist der Bauplan, aus dem alles entsteht.
      - Der große Rahmen gruppiert alles, der mittlere hält die gewünschte Anzahl am Laufen.
  - id: erster-service
    type: simulated
    title: Cluster, Revision, Service
    description: |
      Bringe die Webanwendung `shop-web` mit der AWS CLI zum Laufen. Die Task-Definition liegt schon als
      `taskdef.json` im Ordner, Subnetze und Security Group gibt es bereits.

      1. Lege den Cluster `shop` an.
      2. Registriere die Task-Definition aus der Datei (`aws ecs register-task-definition --cli-input-json file://taskdef.json`).
      3. Erstelle den Service `web` im Cluster `shop` mit der Task-Definition `shop-web`, 2 Tasks und dem Launch-Type `FARGATE`.
         Netzwerk: `--network-configuration "awsvpcConfiguration={subnets=[subnet-0a1b2c3d],securityGroups=[sg-0123abcd]}"`
      4. Schau dir mit `aws ecs list-tasks --cluster shop` die laufenden Tasks an.
    prompt: "du@laptop:~/shop$"
    steps:
      - expect: "^aws\\s+ecs\\s+create-cluster\\s+--cluster-name\\s+shop\\s*$"
        output: |
          {
              "cluster": {
                  "clusterArn": "arn:aws:ecs:eu-central-1:123456789012:cluster/shop",
                  "clusterName": "shop",
                  "status": "ACTIVE"
              }
          }
        hint: aws ecs create-cluster --cluster-name shop
      - expect: "^aws\\s+ecs\\s+register-task-definition\\s+--cli-input-json\\s+file://taskdef\\.json\\s*$"
        output: |
          {
              "taskDefinition": {
                  "taskDefinitionArn": "arn:aws:ecs:eu-central-1:123456789012:task-definition/shop-web:1",
                  "family": "shop-web",
                  "revision": 1,
                  "status": "ACTIVE",
                  "requiresCompatibilities": ["FARGATE"],
                  "cpu": "512",
                  "memory": "1024"
              }
          }
        hint: aws ecs register-task-definition --cli-input-json file://taskdef.json
      - expect: "^aws\\s+ecs\\s+create-service\\s+(?=.*--cluster\\s+shop\\b)(?=.*--service-name\\s+web\\b)(?=.*--task-definition\\s+shop-web(:1)?\\b)(?=.*--desired-count\\s+2\\b)(?=.*--launch-type\\s+FARGATE\\b)(?=.*--network-configuration).*$"
        output: |
          {
              "service": {
                  "serviceName": "web",
                  "clusterArn": "arn:aws:ecs:eu-central-1:123456789012:cluster/shop",
                  "taskDefinition": "arn:aws:ecs:eu-central-1:123456789012:task-definition/shop-web:1",
                  "desiredCount": 2,
                  "runningCount": 0,
                  "launchType": "FARGATE",
                  "status": "ACTIVE"
              }
          }
        hint: aws ecs create-service --cluster shop --service-name web --task-definition shop-web --desired-count 2 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[subnet-0a1b2c3d],securityGroups=[sg-0123abcd]}"
      - expect: "^aws\\s+ecs\\s+list-tasks\\s+--cluster\\s+shop\\b.*$"
        output: |
          {
              "taskArns": [
                  "arn:aws:ecs:eu-central-1:123456789012:task/shop/0f3c9a1b2d4e4f5a8b7c6d5e4f3a2b1c",
                  "arn:aws:ecs:eu-central-1:123456789012:task/shop/9a8b7c6d5e4f4a3b2c1d0e9f8a7b6c5d"
              ]
          }
        hint: aws ecs list-tasks --cluster shop
    responses:
      - match: "^cat\\s+taskdef\\.json"
        output: '{ "family": "shop-web", "requiresCompatibilities": ["FARGATE"], "networkMode": "awsvpc", "cpu": "512", "memory": "1024", "containerDefinitions": [ { "name": "app", "image": "123456789012.dkr.ecr.eu-central-1.amazonaws.com/shop:1.4.0", "essential": true } ] }'
---
Wenn du `docker run shop:1.4.0` tippst, passiert alles in einem Befehl: Image wählen, Ressourcen festlegen,
starten. Fällt der Container um, startet ihn niemand neu. ECS trennt diese Dinge in vier Bausteine. Hast du
sie einmal verstanden, ergibt jede Konsole und jede CLI-Ausgabe Sinn.

![Cluster, Service, Tasks und Task-Definition in ECS](/assets/aws-fargate/ecs-bausteine.svg)

## Die Task-Definition – der Bauplan

Eine [[task-definition|Task-Definition]] ist eine JSON-Beschreibung, wie deine Container laufen sollen: welches
Image, wie viel CPU und Speicher, welche Ports, welche Umgebungsvariablen. Sie entspricht ungefähr einem
Service-Block in `compose.yaml`.

Task-Definitionen sind **unveränderlich**. Jede Änderung erzeugt eine neue
[[task-definition-revision|Revision]] derselben Familie:

| Bezeichnung | Bedeutung |
|---|---|
| `shop-web` | die Familie (der Name) |
| `shop-web:7` | Revision 7 – fest eingefroren |
| `shop-web:8` | entsteht beim nächsten Image-Tag |

So weißt du immer genau, welche Konfiguration lief – und ein Rollback heißt einfach: zurück auf `:7`.

## Der Task – eine laufende Instanz

Ein [[ecs-task|Task]] ist eine laufende Instanz einer Task-Definition. Er kann einen oder mehrere Container
enthalten, die sich Netzwerk und Lebenszyklus teilen – etwa `nginx` und `php-fpm` nebeneinander.

```bash title="Einen einzelnen Task starten"
aws ecs run-task \
  --cluster shop \
  --task-definition shop-web:7 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-0a1b2c3d],securityGroups=[sg-0123abcd]}"
```

Ein so gestarteter Task läuft, bis sein Hauptcontainer endet. Niemand startet ihn neu. Das ist ideal für
einmalige Aufgaben wie Datenbank-[[migration|Migrationen]].

## Der Service – der Aufpasser

Ein [[ecs-service|Service]] sorgt dafür, dass **dauerhaft** eine bestimmte Zahl von Tasks läuft, der
`desiredCount`. Stürzt ein Task ab oder fällt sein Health-Check durch, startet der Service einen Ersatz.

Außerdem kümmert sich der Service um:

- **Deployments:** Neue Revision eintragen → der Service tauscht die Tasks schrittweise aus.
- **Load Balancer:** Neue Tasks werden automatisch im Load Balancer registriert.
- **Autoscaling:** Der `desiredCount` kann sich nach Last richten.

> [!MERKSATZ]
> **Dauerläufer gehören in einen Service, Einmal-Aufgaben in einen einzelnen Task.** Web-Server und
> Queue-Worker sind Services, eine Migration ist ein Task.

> [!FEHLER]
> **Eine Migration als Service starten.** Der Task endet nach erfolgreicher Migration – der Service hält das für
> einen Absturz und startet ihn wieder und wieder.

## Der Cluster und die Kapazität

Ein [[ecs-cluster|Cluster]] ist eine logische Gruppe für Services und Tasks, zum Beispiel ein Cluster pro
Umgebung: `shop-staging` und `shop-production`. Ein leerer Cluster kostet nichts.

Wo die Tasks laufen, bestimmt der [[launch-type|Launch-Type]] oder ein
[[capacity-provider|Capacity Provider]]:

| Option | Bedeutung |
|---|---|
| `FARGATE` | AWS stellt Kapazität bereit, du zahlst pro Task |
| `FARGATE_SPOT` | ungenutzte Kapazität mit hohem Rabatt; AWS darf Tasks mit 2 Minuten Vorwarnung beenden |
| `EC2` | Tasks laufen auf deinen eigenen Instanzen |

> [!PRAXIS]
> Eine verbreitete Mischung: Ein Teil der Tasks läuft auf `FARGATE` als sichere Basis, zusätzliche Tasks laufen
> auf [[fargate-spot|Fargate Spot]]. Für Queue-Worker, die abgebrochene Jobs wiederholen, ist Spot ideal.

## Zusammenfassung

- **Task-Definition**: unveränderlicher Bauplan mit Familie und Revision (`shop-web:7`).
- **Task**: laufende Instanz eines Bauplans, eventuell mit mehreren Containern.
- **Service**: hält `desiredCount` Tasks am Laufen, ersetzt ausgefallene und steuert Deployments.
- **Cluster**: logische Gruppe, oft einer pro Umgebung.
- **Launch-Type / Capacity Provider**: `FARGATE`, `FARGATE_SPOT` oder `EC2`.
- Einmal-Aufgaben wie Migrationen laufen als einzelner Task, nicht als Service.
