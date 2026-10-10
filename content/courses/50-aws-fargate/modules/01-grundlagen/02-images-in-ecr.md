---
title: Images in Amazon ECR ablegen
summary: Repositorys anlegen, Images taggen und pushen, Schwachstellen scannen und alte Images automatisch aufräumen.
duration: 22
sources:
  - title: What is Amazon Elastic Container Registry?
    url: https://docs.aws.amazon.com/AmazonECR/latest/userguide/what-is-ecr.html
  - title: Pushing a Docker image to an Amazon ECR private repository
    url: https://docs.aws.amazon.com/AmazonECR/latest/userguide/docker-push-ecr-image.html
  - title: Scan images for software vulnerabilities in Amazon ECR
    url: https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-scanning.html
  - title: Lifecycle policies in Amazon ECR
    url: https://docs.aws.amazon.com/AmazonECR/latest/userguide/LifecyclePolicies.html
  - title: Image tag mutability
    url: https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-tag-mutability.html
quiz:
  - type: single
    question: Wie lautet die vollständige Adresse eines Images in einem privaten ECR-Repository?
    options:
      - "ecr.amazonaws.com/123456789012/shop:1.4.0"
      - "123456789012.dkr.ecr.eu-central-1.amazonaws.com/shop:1.4.0"
      - "docker.io/aws/shop:1.4.0"
      - "shop.ecr.eu-central-1.aws:1.4.0"
    answer: 1
    explanation: Die Registry-Adresse besteht aus Konto-ID, dkr.ecr, Region und amazonaws.com. Dahinter folgen Repository-Name und Tag.
  - type: find-bug
    question: Der Push scheitert mit „no basic auth credentials“. In welcher Zeile liegt der Fehler?
    language: bash
    code: |
      REGISTRY=123456789012.dkr.ecr.eu-central-1.amazonaws.com
      aws ecr get-login-password --region eu-central-1 | docker login --username admin --password-stdin $REGISTRY
      docker tag shop:latest $REGISTRY/shop:1.4.0
      docker push $REGISTRY/shop:1.4.0
    bug_line: 2
    explanation: Bei ECR ist der Benutzername immer `AWS`. Das Passwort ist ein kurzlebiges Token aus `get-login-password`.
  - type: multiple
    question: Welche Vorteile haben unveränderliche Tags (IMMUTABLE)?
    options:
      - Ein Tag wie 1.4.0 zeigt immer auf genau dasselbe Image.
      - Ein Rollback auf 1.4.0 startet garantiert den alten Code.
      - Images werden dadurch kleiner.
      - Ein versehentlicher zweiter Push mit demselben Tag schlägt fehl, statt das alte Image zu ersetzen.
    answers: [0, 1, 3]
    explanation: Mit IMMUTABLE ist ein Tag ein festes Versprechen. Die Größe des Images ändert das nicht.
  - type: match
    question: Ordne jede Einstellung ihrer Wirkung zu.
    pairs:
      - { left: "scanOnPush", right: "Prüft jedes neue Image auf bekannte Schwachstellen" }
      - { left: "imageTagMutability IMMUTABLE", right: "Ein Tag kann nicht überschrieben werden" }
      - { left: "Lifecycle-Policy", right: "Löscht alte Images nach festen Regeln" }
      - { left: "get-login-password", right: "Liefert ein Anmelde-Token für docker login" }
    explanation: Diese vier Einstellungen gehören zu jedem gut gepflegten ECR-Repository.
tasks:
  - id: ecr-push
    type: simulated
    title: Ein Image nach ECR pushen
    description: |
      Lege das Repository `shop` an und pushe dein lokal gebautes Image `shop:latest` mit dem Tag `1.4.0`.
      Nutze das Konto `123456789012` und die Region `eu-central-1`.

      1. Repository anlegen: `aws ecr create-repository --repository-name shop --image-tag-mutability IMMUTABLE --image-scanning-configuration scanOnPush=true`
      2. Docker bei ECR anmelden (Benutzer `AWS`, Passwort aus `aws ecr get-login-password --region eu-central-1`).
      3. Das Image mit der vollständigen ECR-Adresse taggen.
      4. Das Image pushen.
    prompt: "du@laptop:~/shop$"
    steps:
      - expect: "^aws\\s+ecr\\s+create-repository\\s+.*--repository-name\\s+shop\\b.*$"
        output: |
          {
              "repository": {
                  "repositoryArn": "arn:aws:ecr:eu-central-1:123456789012:repository/shop",
                  "registryId": "123456789012",
                  "repositoryName": "shop",
                  "repositoryUri": "123456789012.dkr.ecr.eu-central-1.amazonaws.com/shop",
                  "imageTagMutability": "IMMUTABLE",
                  "imageScanningConfiguration": { "scanOnPush": true }
              }
          }
        hint: "aws ecr create-repository --repository-name shop --image-tag-mutability IMMUTABLE --image-scanning-configuration scanOnPush=true"
      - expect: "^aws\\s+ecr\\s+get-login-password\\s+--region\\s+eu-central-1\\s*\\|\\s*docker\\s+login\\s+--username\\s+AWS\\s+--password-stdin\\s+123456789012\\.dkr\\.ecr\\.eu-central-1\\.amazonaws\\.com\\s*$"
        output: |
          Login Succeeded
        hint: "aws ecr get-login-password --region eu-central-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.eu-central-1.amazonaws.com"
      - expect: "^docker\\s+tag\\s+shop:latest\\s+123456789012\\.dkr\\.ecr\\.eu-central-1\\.amazonaws\\.com/shop:1\\.4\\.0\\s*$"
        output: ""
        hint: "docker tag shop:latest 123456789012.dkr.ecr.eu-central-1.amazonaws.com/shop:1.4.0"
      - expect: "^docker\\s+push\\s+123456789012\\.dkr\\.ecr\\.eu-central-1\\.amazonaws\\.com/shop:1\\.4\\.0\\s*$"
        output: |
          The push refers to repository [123456789012.dkr.ecr.eu-central-1.amazonaws.com/shop]
          5f70bf18a086: Pushed
          a3c1f2e9d4b7: Pushed
          1.4.0: digest: sha256:4b1e0c6f2a9d8e7c5b3a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c size: 1784
        hint: "docker push 123456789012.dkr.ecr.eu-central-1.amazonaws.com/shop:1.4.0"
    responses:
      - match: "^docker\\s+images"
        output: |
          REPOSITORY   TAG       IMAGE ID       CREATED          SIZE
          shop         latest    4b1e0c6f2a9d   10 minutes ago   142MB
      - match: "^aws\\s+ecr\\s+describe-image-scan-findings"
        output: '{ "imageScanFindings": { "findingSeverityCounts": { "MEDIUM": 2, "LOW": 5 } } }'
  - id: lifecycle-lesen
    type: steps
    title: Was löscht die Lifecycle-Policy?
    description: |
      Das Repository hat diese Regeln: Priorität 1 – untagged Images nach 7 Tagen löschen. Priorität 2 – von allen
      Images nur die neuesten 30 behalten. Überlege, was mit den Images passiert.
    steps:
      - situation: Ein Image ohne Tag wurde vor 10 Tagen gepusht.
        question: Was passiert damit?
        options: [Es bleibt erhalten, Es wird innerhalb von etwa 24 Stunden gelöscht, Es bekommt automatisch den Tag latest]
        answer: 1
        explanation: Regel 1 trifft zu. ECR führt Lifecycle-Aktionen innerhalb von 24 Stunden nach Erfüllen der Bedingung aus.
      - situation: Im Repository liegen 35 getaggte Images, alle jünger als eine Woche.
        question: Wie viele bleiben übrig?
        options: [35, 30, 7]
        answer: 1
        explanation: Regel 2 behält die neuesten 30 und lässt die 5 ältesten verfallen.
      - situation: Ein Task in Produktion läuft noch mit einem der 5 ältesten Images.
        question: Was bedeutet das für dich?
        options: [Nichts, ECR prüft laufende Tasks, Ein Neustart oder Rollback auf dieses Image schlägt danach fehl, ECR verschiebt das Image in ein anderes Repository]
        answer: 1
        explanation: ECR weiß nicht, welche Tasks ein Image nutzen. Wähle die Anzahl so groß, dass alle realistischen Rollback-Ziele erhalten bleiben.
---
Dein Image `shop:latest` liegt bisher nur auf deinem Laptop. Fargate kann es von dort nicht holen – es braucht
eine [[registry|Registry]] im Internet. [[docker-hub|Docker Hub]] wäre möglich, aber dann liegen deine
Firmen-Images bei einem fremden Anbieter, und für private Images brauchst du dort eigene Zugangsdaten. AWS
bringt deshalb eine eigene Registry mit.

## Amazon ECR und seine Repositorys

[[amazon-ecr|Amazon ECR]] (Elastic Container Registry) ist die Image-Registry von AWS. Jedes Konto hat pro
[[region|Region]] eine private Registry. Darin legst du für jede Anwendung ein
[[ecr-repository|Repository]] an.

```text title="Aufbau einer Image-Adresse"
123456789012.dkr.ecr.eu-central-1.amazonaws.com/shop:1.4.0
└── Konto ──┘    └ Region ┘                  └Repo┘ └Tag┘
```

Vorteile gegenüber einer fremden Registry:

| Vorteil | Warum wichtig |
|---|---|
| Zugriff über [[iam|IAM]] | keine extra Passwörter – die Execution-Rolle darf pullen |
| gleiche Region wie Fargate | schnelle Pulls, kein Datenverkehr übers Internet nötig |
| Scannen und Aufräumen eingebaut | weniger Werkzeuge |

> [!MERKSATZ]
> **Ein Repository pro Anwendung, ein Tag pro Version.** Web, Worker und Scheduler einer Laravel-App nutzen
> dasselbe Image aus demselben Repository.

## Pushen in vier Schritten

Docker muss sich zuerst bei ECR anmelden. Das Passwort ist ein Token, das 12 Stunden gilt. Der Benutzername
lautet immer `AWS`.

```bash title="Image nach ECR bringen"
REGISTRY=123456789012.dkr.ecr.eu-central-1.amazonaws.com

aws ecr create-repository --repository-name shop

aws ecr get-login-password --region eu-central-1 \
  | docker login --username AWS --password-stdin "$REGISTRY"

docker tag shop:latest "$REGISTRY/shop:1.4.0"
docker push "$REGISTRY/shop:1.4.0"
```

Achte auf die Plattform: Dein Mac mit Apple-Chip baut standardmäßig `arm64`-Images. Läuft der Task auf
`X86_64`, startet er nicht. Baue dann mit `docker build --platform linux/amd64` – oder nutze bewusst ARM, das
bei Fargate günstiger ist.

> [!FEHLER]
> **Nur `latest` pushen.** Wenn jedes Deployment `latest` überschreibt, weißt du nie, welcher Code läuft, und
> ein Rollback ist unmöglich. Tagge jedes Image eindeutig, etwa mit dem Git-Commit (`shop:3f9c2a1`) oder einer
> Version (`shop:1.4.0`).

## Unveränderliche Tags

Standardmäßig darfst du einen Tag erneut pushen – das alte Image verliert ihn dann. Mit
[[tag-immutability|unveränderlichen Tags]] (`IMMUTABLE`) lehnt ECR das ab.

```bash
aws ecr put-image-tag-mutability \
  --repository-name shop --image-tag-mutability IMMUTABLE
```

Damit ist `shop:1.4.0` ein festes Versprechen: Ein Rollback auf 1.4.0 startet garantiert den alten Code.
Noch genauer ist der [[image-digest|Digest]] (`shop@sha256:4b1e…`), denn er ist ein Prüfwert über den Inhalt.

## Schwachstellen scannen

Images enthalten Betriebssystem-Pakete und Bibliotheken – und damit bekannte Lücken ([[cve|CVEs]]). ECR kann
sie per [[image-scanning|Image-Scanning]] finden:

| Variante | Was wird geprüft | Wann |
|---|---|---|
| Basic | Pakete des Betriebssystems | beim Push oder manuell |
| Enhanced (mit Amazon Inspector) | Betriebssystem **und** Sprachpakete (Composer, npm …) | beim Push und fortlaufend bei neuen CVEs |

```bash title="Ergebnisse abrufen"
aws ecr describe-image-scan-findings \
  --repository-name shop --image-id imageTag=1.4.0
```

> [!PRAXIS]
> Viele Teams lassen die Pipeline abbrechen, wenn der Scan Lücken der Stufe `CRITICAL` meldet. Ein schlankes
> Basis-Image (Alpine, Distroless) reduziert die Zahl der Funde erheblich.

## Aufräumen mit Lifecycle-Policies

Jeder Push erzeugt ein Image, und Speicher kostet Geld. Eine [[lifecycle-policy|Lifecycle-Policy]] löscht
alte Images automatisch nach Regeln:

```json title="lifecycle-policy.json"
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Untagged Images nach 7 Tagen entfernen",
      "selection": { "tagStatus": "untagged", "countType": "sinceImagePushed", "countUnit": "days", "countNumber": 7 },
      "action": { "type": "expire" }
    },
    {
      "rulePriority": 2,
      "description": "Nur die neuesten 30 Images behalten",
      "selection": { "tagStatus": "any", "countType": "imageCountMoreThan", "countNumber": 30 },
      "action": { "type": "expire" }
    }
  ]
}
```

Die kleinere Zahl bei `rulePriority` gewinnt. Eine Regel mit `tagStatus: any` muss die höchste Zahl haben.
Teste neue Regeln vorher mit der Vorschau (`aws ecr start-lifecycle-policy-preview`).

## Zusammenfassung

- **Amazon ECR** ist die private Registry deines Kontos pro Region; pro Anwendung gibt es ein **Repository**.
- Anmelden mit `aws ecr get-login-password | docker login --username AWS --password-stdin <registry>`.
- Jedes Image bekommt einen **eindeutigen Tag** (Version oder Commit), nie nur `latest`.
- **IMMUTABLE** verhindert, dass ein Tag überschrieben wird – Rollbacks werden verlässlich.
- **Scan on Push** findet bekannte Schwachstellen; Enhanced Scanning prüft auch Sprachpakete.
- **Lifecycle-Policies** löschen alte Images – behalte genug für Rollbacks.
