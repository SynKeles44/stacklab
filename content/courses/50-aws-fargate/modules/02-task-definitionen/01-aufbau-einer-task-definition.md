---
title: Aufbau einer Task-Definition
summary: Familie, CPU und Speicher, Plattform, Container-Definitionen und Ports – das Grundgerüst jeder Fargate-Task-Definition.
duration: 22
sources:
  - title: Amazon ECS task definition parameters for Fargate
    url: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html
  - title: Amazon ECS task definition differences for Fargate (CPU and memory)
    url: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-tasks-services.html
  - title: Amazon ECS task definitions for 64-bit ARM workloads
    url: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-arm64.html
quiz:
  - type: single
    question: Welche Kombination aus Task-CPU und Task-Speicher ist bei Fargate gültig?
    options:
      - "cpu 256, memory 4096"
      - "cpu 512, memory 768"
      - "cpu 1024, memory 2048"
      - "cpu 2048, memory 2048"
    answer: 2
    explanation: 1 vCPU (1024) erlaubt 2 bis 8 GB. 256 erlaubt höchstens 2 GB, 512 nur ganze GB ab 1 GB, 2048 mindestens 4 GB.
  - type: find-bug
    question: Diese Fargate-Task-Definition wird abgelehnt. In welcher Zeile liegt der Fehler?
    language: json
    code: |
      {
        "family": "shop-web",
        "requiresCompatibilities": ["FARGATE"],
        "networkMode": "bridge",
        "cpu": "512",
        "memory": "1024",
        "containerDefinitions": [ { "name": "app", "image": "shop:1.4.0", "essential": true } ]
      }
    bug_line: 4
    explanation: Fargate unterstützt nur den Netzwerkmodus awsvpc.
  - type: multiple
    question: Welche Aussagen über portMappings bei Fargate stimmen?
    options:
      - containerPort ist der Port, auf dem dein Prozess im Container lauscht.
      - Du brauchst einen hostPort wie 8080:80 bei docker run.
      - hostPort ist entweder weggelassen oder gleich containerPort.
      - Ein Queue-Worker ohne HTTP braucht keine portMappings.
    answers: [0, 2, 3]
    explanation: Bei awsvpc hat jeder Task eine eigene IP. Eine Port-Umleitung wie bei Docker gibt es nicht – hostPort entspricht containerPort.
  - type: cloze
    text: "Ist ein Container mit `\"essential\": ___` beendet, stoppt ECS den ganzen Task."
    blanks:
      - [true]
    explanation: Mindestens ein Container pro Task muss essential sein. Endet er, endet der Task.
tasks:
  - id: taskdef-reparieren
    type: terminal
    title: Eine kaputte Task-Definition reparieren
    description: |
      Im Ordner `web-taskdef` liegt `web.json`, die Task-Definition der Web-App. Sie hat vier Fehler, wegen derer
      Fargate sie ablehnen würde oder der Container nicht erreichbar wäre.

      1. Setze `networkMode` auf den einzigen Modus, den Fargate kennt.
      2. Ändere `memory` auf `"1024"` – `768` ist zu 0,5 vCPU nicht erlaubt.
      3. `containerPort` muss eine **Zahl** sein (`8080`), kein String.
      4. Markiere den Container `app` als `essential`.

      Prüfe am Ende mit `jq . web.json`, dass die Datei gültiges JSON ist.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit die Datei angelegt wird.
    workdir: web-taskdef
    setup: |
      cat > web.json <<'JSON'
      {
        "family": "shop-web",
        "requiresCompatibilities": ["FARGATE"],
        "networkMode": "bridge",
        "cpu": "512",
        "memory": "768",
        "runtimePlatform": { "operatingSystemFamily": "LINUX", "cpuArchitecture": "ARM64" },
        "executionRoleArn": "arn:aws:iam::123456789012:role/shop-execution",
        "containerDefinitions": [
          {
            "name": "app",
            "image": "123456789012.dkr.ecr.eu-central-1.amazonaws.com/shop:1.4.0",
            "essential": false,
            "portMappings": [ { "containerPort": "8080", "protocol": "tcp" } ]
          }
        ]
      }
      JSON
    checks:
      - type: command
        run: jq -r '.networkMode' web.json
        stdout_equals: awsvpc
        message: networkMode ist noch nicht awsvpc (oder die Datei ist kein gültiges JSON mehr).
      - type: command
        run: jq -e '.cpu == "512" and .memory == "1024"' web.json
        message: Bei cpu "512" soll memory "1024" sein – beides als String.
      - type: command
        run: jq -e '.containerDefinitions[0].portMappings[0].containerPort == 8080' web.json
        message: containerPort muss die Zahl 8080 sein, ohne Anführungszeichen.
      - type: command
        run: jq -e '.containerDefinitions[0].essential == true' web.json
        message: Der Container app ist noch nicht essential.
      - type: command
        run: jq -e '.family == "shop-web" and (.containerDefinitions[0].image | endswith("/shop:1.4.0"))' web.json
        message: family oder image wurden versehentlich verändert – lass sie wie vorgegeben.
    hints:
      - Öffne die Datei mit `nano web.json` und gehe die vier Punkte der Reihe nach durch.
      - "Strings stehen in Anführungszeichen, Zahlen und `true`/`false` nicht: `\"containerPort\": 8080`, `\"essential\": true`."
      - "Mit `jq '.containerDefinitions[0]' web.json` prüfst du gezielt den Container."
    solution: |
      ```bash
      cd web-taskdef
      jq '.networkMode = "awsvpc"
          | .memory = "1024"
          | .containerDefinitions[0].essential = true
          | .containerDefinitions[0].portMappings[0].containerPort = 8080' web.json > web.neu.json
      mv web.neu.json web.json
      jq . web.json
      ```
      Natürlich kannst du die vier Stellen auch mit `nano` von Hand ändern.
  - id: groesse-pruefen
    type: code
    language: js
    title: Gültige Fargate-Größen prüfen
    description: |
      Schreibe `isValidFargateSize(cpu, memory)`. Beide Werte sind Zahlen in CPU-Einheiten bzw. MiB. Gib `true`
      zurück, wenn die Kombination für einen Linux-Task gültig ist, sonst `false`. Berücksichtige diese Stufen:

      | cpu | erlaubter Speicher (MiB) |
      |---|---|
      | 256 | 512, 1024, 2048 |
      | 512 | 1024 bis 4096 in 1024er-Schritten |
      | 1024 | 2048 bis 8192 in 1024er-Schritten |
      | 2048 | 4096 bis 16384 in 1024er-Schritten |
      | 4096 | 8192 bis 30720 in 1024er-Schritten |

      Jeder andere CPU-Wert ist für diese Aufgabe ungültig.
    starter: |
      function isValidFargateSize(cpu, memory) {
        // Deine Lösung
      }
    tests:
      - name: kleinste Größe ist gültig
        code: assertEqual(isValidFargateSize(256, 512), true)
      - name: 0,5 vCPU mit 1 GB ist gültig
        code: assertEqual(isValidFargateSize(512, 1024), true)
      - name: 768 MiB passt nicht in 1024er-Schritte
        code: assertEqual(isValidFargateSize(512, 768), false)
      - name: 256 CPU-Einheiten mit 3 GB ist zu viel
        code: assertEqual(isValidFargateSize(256, 3072), false)
      - name: obere Grenze bei 4 vCPU
        code: assertEqual(isValidFargateSize(4096, 30720), true)
      - name: zu wenig Speicher für 2 vCPU
        code: assertEqual(isValidFargateSize(2048, 2048), false)
      - name: unbekannter CPU-Wert
        code: assertEqual(isValidFargateSize(300, 1024), false)
      - name: 0 ist ungültig
        code: assertEqual(isValidFargateSize(0, 0), false)
    solution: |
      function isValidFargateSize(cpu, memory) {
        if (cpu === 256) {
          return [512, 1024, 2048].includes(memory)
        }
        const ranges = {
          512: [1024, 4096],
          1024: [2048, 8192],
          2048: [4096, 16384],
          4096: [8192, 30720],
        }
        const range = ranges[cpu]
        if (!range) {
          return false
        }
        const [min, max] = range
        return memory >= min && memory <= max && memory % 1024 === 0
      }
---
Du hast gelernt, dass eine Task-Definition der Bauplan deiner Container ist. Jetzt schreibst du einen. Die
JSON-Datei wirkt anfangs lang, folgt aber einer einfachen Ordnung: oben die Einstellungen für den ganzen Task,
darunter eine Liste von Containern.

## Das Grundgerüst

```json title="web.json"
{
  "family": "shop-web",
  "requiresCompatibilities": ["FARGATE"],
  "networkMode": "awsvpc",
  "cpu": "512",
  "memory": "1024",
  "runtimePlatform": { "operatingSystemFamily": "LINUX", "cpuArchitecture": "ARM64" },
  "executionRoleArn": "arn:aws:iam::123456789012:role/shop-execution",
  "taskRoleArn": "arn:aws:iam::123456789012:role/shop-task",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "123456789012.dkr.ecr.eu-central-1.amazonaws.com/shop:1.4.0",
      "essential": true,
      "portMappings": [{ "containerPort": 8080, "protocol": "tcp" }]
    }
  ]
}
```

| Feld | Bedeutung |
|---|---|
| `family` | Name der Task-Definition; Revisionen zählen hoch |
| `requiresCompatibilities` | `FARGATE` – AWS prüft beim Registrieren, ob alles zu Fargate passt |
| `networkMode` | bei Fargate immer [[awsvpc]] |
| `cpu`, `memory` | Ressourcen für den **ganzen Task** |
| `executionRoleArn`, `taskRoleArn` | zwei [[iam-rolle|IAM-Rollen]] – mehr dazu in Modul 3 |

Die Datei registrierst du mit `aws ecs register-task-definition --cli-input-json file://web.json`.

## CPU und Speicher

Fargate rechnet in [[vcpu|vCPU]]: `1024` CPU-Einheiten sind eine vCPU. Speicher gibst du in MiB an. Nicht jede
Kombination ist erlaubt:

| cpu | vCPU | erlaubter Speicher |
|---|---|---|
| `256` | 0,25 | 512 MiB, 1 GB, 2 GB |
| `512` | 0,5 | 1–4 GB in 1-GB-Schritten |
| `1024` | 1 | 2–8 GB in 1-GB-Schritten |
| `2048` | 2 | 4–16 GB in 1-GB-Schritten |
| `4096` | 4 | 8–30 GB in 1-GB-Schritten |

Darüber gibt es noch Stufen bis 16 vCPU und mehr. Für eine typische PHP-App mit PHP-FPM sind 0,5 vCPU und 1 GB
ein guter Start. Miss danach in CloudWatch, wie viel wirklich gebraucht wird.

> [!MERKSATZ]
> **Bezahlt wird, was du anforderst, nicht was du nutzt.** Ein Task mit 4 GB, der 300 MB braucht, kostet
> trotzdem 4 GB.

## Plattform: x86 oder ARM

`runtimePlatform` legt Betriebssystem und Prozessor-Architektur fest. `ARM64` läuft auf
[[graviton|Graviton]]-Prozessoren von AWS und ist pro vCPU günstiger als `X86_64`.

Wichtig: Das Image muss zur Architektur passen. Baust du auf einem Apple-Mac (ARM) und der Task läuft auf
x86, scheitert der Start mit `exec format error`. Abhilfe: passend bauen oder ein Multi-Plattform-Image mit
`docker buildx build --platform linux/amd64,linux/arm64` erzeugen.

## Container-Definitionen

Jeder Eintrag in `containerDefinitions` ist eine [[container-definition|Container-Definition]]:

| Feld | Bedeutung |
|---|---|
| `name` | Name im Task, z. B. `app` oder `nginx` |
| `image` | vollständige Image-Adresse mit eindeutigem Tag |
| `essential` | `true`: endet dieser Container, endet der ganze Task |
| `command` | überschreibt `CMD` aus dem Dockerfile |
| `entryPoint` | überschreibt `ENTRYPOINT` |
| `portMappings` | Ports, auf denen der Container lauscht |

`command` ist eine Liste – jedes Argument ein eigener String: `["php", "artisan", "queue:work"]`. So nutzt du
**ein** Image für Web, Worker und Scheduler.

> [!FEHLER]
> **Den Befehl als einen einzigen String schreiben.** `["php artisan queue:work"]` sucht ein Programm, das
> wirklich „php artisan queue:work“ heißt, und scheitert. Jedes Wort ist ein eigener Listeneintrag.

## Ports bei awsvpc

Bei `docker run -p 8080:80` leitet Docker einen Port des Hosts auf den Container um. Bei Fargate fällt das
weg: Jeder Task hat seine **eigene** IP-Adresse, also gibt es nichts umzuleiten.

```json
"portMappings": [{ "containerPort": 8080, "protocol": "tcp" }]
```

Lässt du `hostPort` weg, setzt ECS ihn gleich `containerPort`. Container im selben Task erreichen sich über
`localhost` – nginx spricht PHP-FPM also unter `127.0.0.1:9000` an.

> [!PRAXIS]
> Viele Teams lassen den Webserver auf einem Port über 1024 lauschen (etwa `8080`). Dann muss der Prozess im
> Container nicht als `root` laufen, um den Port zu öffnen.

## Zusammenfassung

- Oben stehen Task-Einstellungen (`family`, `cpu`, `memory`, `networkMode`, Rollen), darunter die Container.
- Fargate verlangt `networkMode: awsvpc` und eine **gültige CPU-Speicher-Kombination**.
- Du bezahlst die angeforderten Ressourcen, nicht die genutzten.
- `runtimePlatform` wählt x86 oder ARM – das Image muss passen.
- `command` ist eine Liste einzelner Argumente; so nutzt ein Image mehrere Rollen.
- Bei awsvpc gibt es keine Port-Umleitung: `containerPort` reicht.
