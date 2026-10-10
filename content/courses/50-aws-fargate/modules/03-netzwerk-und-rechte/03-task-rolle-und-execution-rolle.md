---
title: Task-Rolle und Execution-Rolle
summary: Zwei IAM-Rollen mit zwei Aufgaben – wer das Image zieht und Secrets holt, und wer zur Laufzeit auf S3 oder SQS zugreift.
duration: 20
sources:
  - title: Amazon ECS task execution IAM role
    url: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_execution_IAM_role.html
  - title: Amazon ECS task IAM role
    url: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html
  - title: IAM JSON policy elements reference
    url: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html
quiz:
  - type: match
    question: Welche Rolle braucht welche Berechtigung?
    pairs:
      - { left: "Image aus ECR ziehen", right: "Execution-Rolle" }
      - { left: "Upload in einen S3-Bucket aus Laravel heraus", right: "Task-Rolle" }
      - { left: "Secret für das Feld secrets abholen", right: "Execution-Rolle" }
      - { left: "Nachricht an eine SQS-Queue senden", right: "Task-Rolle" }
    explanation: Alles vor und rund um den Start erledigt der Agent mit der Execution-Rolle. Alles, was dein Code tut, läuft über die Task-Rolle.
  - type: single
    question: Welcher Principal steht in der Trust Policy beider Rollen?
    options:
      - "\"Service\": \"ec2.amazonaws.com\""
      - "\"Service\": \"ecs-tasks.amazonaws.com\""
      - "\"AWS\": \"arn:aws:iam::123456789012:root\""
      - "\"Federated\": \"token.actions.githubusercontent.com\""
    answer: 1
    explanation: Beide Rollen werden von ECS-Tasks übernommen. Deshalb vertraut ihre Trust Policy dem Dienst ecs-tasks.amazonaws.com.
  - type: find-bug
    question: Diese Task-Rollen-Policy ist zu großzügig. In welcher Zeile steckt das Problem?
    language: json
    code: |
      {
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": "s3:*",
            "Resource": "arn:aws:s3:::shop-uploads-production/*"
          }
        ]
      }
    bug_line: 6
    explanation: s3:* erlaubt auch Löschen, Rechte ändern und mehr. Die App braucht nur s3:GetObject und s3:PutObject (eventuell s3:DeleteObject).
  - type: multiple
    question: Wie kommen die Zugangsdaten der Task-Rolle in den Container?
    options:
      - Das AWS SDK holt sie automatisch von einem Endpunkt, den ECS im Task bereitstellt.
      - Du musst AWS_ACCESS_KEY_ID und AWS_SECRET_ACCESS_KEY in secrets eintragen.
      - Sie sind kurzlebig und werden automatisch erneuert.
      - Laravels S3-Treiber nutzt sie ohne Schlüssel in der .env.
    answers: [0, 2, 3]
    explanation: Mit Task-Rolle gibt es keine dauerhaften Schlüssel. Lass AWS_ACCESS_KEY_ID und AWS_SECRET_ACCESS_KEY einfach leer.
tasks:
  - id: rolle-zuordnen
    type: dragdrop
    title: Execution-Rolle oder Task-Rolle?
    description: Ordne jede Berechtigung der Rolle zu, die sie braucht.
    targets:
      - { id: exec, label: Execution-Rolle }
      - { id: task, label: Task-Rolle }
    items:
      - { label: "ecr:BatchGetImage", target: exec }
      - { label: "logs:PutLogEvents", target: exec }
      - { label: "secretsmanager:GetSecretValue für das Feld secrets", target: exec }
      - { label: "s3:PutObject auf den Upload-Bucket", target: task }
      - { label: "sqs:SendMessage auf die Job-Queue", target: task }
      - { label: "ses:SendEmail", target: task }
  - id: task-policy
    type: terminal
    title: Eine Task-Rollen-Policy mit minimalen Rechten
    description: |
      Die Laravel-App speichert Uploads im Bucket `shop-uploads-production`. Schreibe im Ordner `task-rolle` zwei
      Dateien.

      1. `trust-policy.json`: Erlaube dem Dienst `ecs-tasks.amazonaws.com` die Aktion `sts:AssumeRole`
         (`Version` `2012-10-17`).
      2. `task-policy.json`: **Ein** Statement mit `Effect` `Allow`, den Aktionen `s3:GetObject`, `s3:PutObject` und
         `s3:DeleteObject` und als `Resource` **nur** `arn:aws:s3:::shop-uploads-production/*`. Keine Wildcard-Aktionen
         wie `s3:*`.

      Prüfe beide mit `jq .`.
    workdir: task-rolle
    checks:
      - type: command
        run: jq -e '.Version == "2012-10-17" and (.Statement | length == 1) and .Statement[0].Effect == "Allow" and .Statement[0].Principal.Service == "ecs-tasks.amazonaws.com" and .Statement[0].Action == "sts:AssumeRole"' trust-policy.json
        message: trust-policy.json fehlt oder erlaubt nicht genau ecs-tasks.amazonaws.com die Aktion sts:AssumeRole.
      - type: command
        run: jq -e '.Version == "2012-10-17" and (.Statement | length == 1) and .Statement[0].Effect == "Allow"' task-policy.json
        message: task-policy.json fehlt, ist ungültig oder hat nicht genau ein Allow-Statement mit Version 2012-10-17.
      - type: command
        run: jq -e '([.Statement[0].Action] | flatten | sort) == ["s3:DeleteObject","s3:GetObject","s3:PutObject"]' task-policy.json
        message: Action soll genau s3:GetObject, s3:PutObject und s3:DeleteObject enthalten – nicht mehr, nicht weniger.
      - type: command
        run: jq -e '([.Statement[0].Resource] | flatten) == ["arn:aws:s3:::shop-uploads-production/*"]' task-policy.json
        message: Resource soll nur arn:aws:s3:::shop-uploads-production/* sein.
      - type: command
        run: grep -E '"(s3:)?\*"' task-policy.json
        expect_exit: 1
        message: In task-policy.json steht noch eine Wildcard-Aktion wie "s3:*" oder "*".
    hints:
      - "Ein Statement hat die Schlüssel `Effect`, `Action` und `Resource` – bei der Trust Policy `Principal` statt `Resource`."
      - Action darf eine Liste sein, Resource ein einzelner String.
      - "Prüfe mit `jq '.Statement[0].Action' task-policy.json`."
    solution: |
      ```bash
      cd task-rolle
      cat > trust-policy.json <<'JSON'
      {
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": { "Service": "ecs-tasks.amazonaws.com" },
            "Action": "sts:AssumeRole"
          }
        ]
      }
      JSON
      cat > task-policy.json <<'JSON'
      {
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
            "Resource": "arn:aws:s3:::shop-uploads-production/*"
          }
        ]
      }
      JSON
      jq . trust-policy.json task-policy.json
      ```
---
Deine App läuft auf Fargate und soll Bilder nach [[s3|S3]] hochladen. Früher hätte man dafür einen
Zugangsschlüssel in die `.env` geschrieben. Bei ECS ist das unnötig – und gefährlich. Stattdessen bekommt jeder
Task Rechte über [[iam-rolle|IAM-Rollen]]. Davon gibt es zwei, und ihre Verwechslung ist der häufigste Fehler.

![Execution-Rolle und Task-Rolle im Vergleich](/assets/aws-fargate/rollen.svg)

## Die Execution-Rolle: für den Start

Die [[execution-rolle|Execution-Rolle]] (`executionRoleArn`) nutzt **nicht** dein Code, sondern der ECS- bzw.
Fargate-Agent. Er braucht sie, um deinen Task überhaupt starten zu können:

- das Image aus ECR ziehen,
- Logs nach CloudWatch schreiben,
- Werte für das Feld `secrets` aus Secrets Manager oder Parameter Store holen.

AWS liefert dafür die verwaltete Policy `AmazonECSTaskExecutionRolePolicy`. Sie deckt ECR und Logs ab. Für
Secrets ergänzt du eine eigene Policy mit genau deinen Secret-ARNs.

> [!FEHLER]
> **S3-Rechte in die Execution-Rolle packen.** Dein Code sieht diese Rolle nie. Der Upload scheitert mit
> „Access Denied“, obwohl die Rolle die Berechtigung hat – es ist die falsche Rolle.

## Die Task-Rolle: für deinen Code

Die [[task-rolle|Task-Rolle]] (`taskRoleArn`) ist die Identität deiner Anwendung zur Laufzeit. Das AWS SDK im
Container holt sich ihre Zugangsdaten automatisch von einem Endpunkt, den ECS im Task bereitstellt. Die Daten
sind kurzlebig und werden erneuert.

```php title="config/filesystems.php – kein Schlüssel nötig"
's3' => [
    'driver' => 's3',
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION'),
    'bucket' => env('AWS_BUCKET'),
],
```

Lässt du `AWS_ACCESS_KEY_ID` und `AWS_SECRET_ACCESS_KEY` leer, nutzt das SDK die Task-Rolle. Es gibt keinen
Schlüssel, der in einem Log oder Git-Repository landen kann.

> [!MERKSATZ]
> **Execution-Rolle = was AWS für dich tut, bevor die App läuft. Task-Rolle = was deine App selbst tut.**

## Trust Policy: wer darf die Rolle übernehmen?

Jede Rolle hat zwei Teile: die Berechtigungen und eine [[trust-policy|Trust Policy]], die festlegt, **wer** sie
übernehmen darf. Für beide ECS-Rollen ist das der Dienst `ecs-tasks.amazonaws.com`:

```json title="trust-policy.json"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "ecs-tasks.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

`sts:AssumeRole` bedeutet: „Ich darf diese Rolle annehmen und bekomme dafür kurzlebige Zugangsdaten.“ Ohne diesen
Eintrag könnte ECS die Rolle gar nicht nutzen – der Task startet dann mit einem Berechtigungsfehler, egal wie gut
die Berechtigungen selbst sind. Trust Policy und Berechtigungen sind also zwei getrennte Schlösser, die beide passen
müssen.

AWS empfiehlt zusätzlich Bedingungen wie `aws:SourceAccount`, damit nur Tasks aus deinem Konto die Rolle nutzen
können.

## Minimale Rechte für die Task-Rolle

Gib der Task-Rolle nur, was die App wirklich braucht – nach dem Prinzip [[least-privilege|Least Privilege]]:

```json title="task-policy.json"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::shop-uploads-production/*"
    }
  ]
}
```

| Statt | Besser |
|---|---|
| `"Action": "s3:*"` | einzelne Aktionen auflisten |
| `"Resource": "*"` | konkreter Bucket, konkrete Queue |
| eine Rolle für Web, Worker, Scheduler | je Service eine Rolle, wenn die Rechte sich unterscheiden |

> [!PRAXIS]
> Wirst du gehackt, kann ein Angreifer genau das, was die Task-Rolle darf. Eine Rolle mit `s3:*` auf `*` macht
> aus einer Lücke in einem Upload-Formular einen Zugriff auf jeden Bucket des Kontos. Trenne außerdem Rollen
> pro Umgebung: Die Staging-App darf nie den Produktions-Bucket sehen.

## Zusammenfassung

- **Execution-Rolle**: vom ECS-Agenten genutzt – Image ziehen, Logs schreiben, `secrets` holen.
- **Task-Rolle**: von deinem Code genutzt – S3, SQS, SES und alles, was die App zur Laufzeit braucht.
- Beide vertrauen in ihrer Trust Policy dem Dienst `ecs-tasks.amazonaws.com`.
- Mit Task-Rolle brauchst du keine AWS-Schlüssel in der `.env`; das SDK holt kurzlebige Zugangsdaten.
- Minimale Rechte: einzelne Aktionen, konkrete Ressourcen, getrennte Rollen pro Umgebung.
