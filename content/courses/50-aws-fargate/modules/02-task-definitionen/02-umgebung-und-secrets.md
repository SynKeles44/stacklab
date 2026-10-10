---
title: Umgebungsvariablen und Secrets
summary: Was als normale Variable in die Task-Definition darf, was aus Secrets Manager oder Parameter Store kommt und welche Rolle es abholt.
duration: 22
sources:
  - title: Pass sensitive data to an Amazon ECS container
    url: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/specifying-sensitive-data.html
  - title: Pass Secrets Manager secrets through Amazon ECS environment variables
    url: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/secrets-envvar-secrets-manager.html
  - title: Pass Systems Manager parameters through Amazon ECS environment variables
    url: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/secrets-envvar-ssm-paramstore.html
  - title: Amazon ECS task execution IAM role
    url: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_execution_IAM_role.html
quiz:
  - type: single
    question: Wo gehört der Laravel-APP_KEY in einer Task-Definition hin?
    options:
      - In environment, damit Laravel ihn findet.
      - In secrets mit valueFrom auf Secrets Manager oder einen SecureString-Parameter.
      - In das Dockerfile als ENV.
      - In die .env-Datei im Image.
    answer: 1
    explanation: Alles in environment steht im Klartext in der Task-Definition und ist für jeden mit Leserechten sichtbar. Secrets gehören in secrets.
  - type: find-bug
    question: Der Task startet nicht und meldet „unable to pull secrets“. Die Execution-Rolle hat nur die AWS-Standardpolicy für ECS. Welche Zeile zeigt das Problem am deutlichsten?
    language: json
    code: |
      {
        "name": "app",
        "image": "123456789012.dkr.ecr.eu-central-1.amazonaws.com/shop:1.4.0",
        "secrets": [
          { "name": "DB_PASSWORD", "valueFrom": "arn:aws:secretsmanager:eu-central-1:123456789012:secret:shop/production-AbCdEf:DB_PASSWORD::" }
        ]
      }
    bug_line: 5
    explanation: Für Secrets aus Secrets Manager braucht die Execution-Rolle zusätzlich secretsmanager:GetSecretValue für genau diese ARN. Die Standardpolicy deckt nur ECR und Logs ab.
  - type: multiple
    question: Welche Aussagen über secrets in ECS stimmen?
    options:
      - Die Werte werden beim Start des Tasks abgeholt und als Umgebungsvariablen gesetzt.
      - Ändert sich ein Secret, sehen laufende Tasks den neuen Wert sofort.
      - Mit `:SCHLÜSSEL::` am Ende der ARN holst du einen einzelnen Wert aus einem JSON-Secret.
      - Neben Secrets Manager kann valueFrom auch auf einen Parameter im Parameter Store zeigen.
    answers: [0, 2, 3]
    explanation: Werte werden nur beim Start gelesen. Nach einer Änderung brauchst du ein neues Deployment (zum Beispiel --force-new-deployment).
  - type: cloze
    text: Normale Werte stehen unter ___ mit name und value, sensible unter ___ mit name und valueFrom.
    blanks:
      - [environment]
      - [secrets]
    explanation: Beide werden im Container zu ganz normalen Umgebungsvariablen – der Unterschied liegt darin, wo der Wert gespeichert ist.
tasks:
  - id: env-oder-secret
    type: dragdrop
    title: environment oder secrets?
    description: Entscheide für jede Variable einer Laravel-App, wo sie in der Task-Definition hingehört.
    targets:
      - { id: env, label: "environment (Klartext)" }
      - { id: secret, label: "secrets (valueFrom)" }
    items:
      - { label: "APP_ENV=production", target: env }
      - { label: "APP_KEY", target: secret }
      - { label: "DB_HOST", target: env }
      - { label: "DB_PASSWORD", target: secret }
      - { label: "LOG_CHANNEL=stderr", target: env }
      - { label: "STRIPE_SECRET", target: secret }
      - { label: "QUEUE_CONNECTION=redis", target: env }
      - { label: "MAIL_PASSWORD", target: secret }
  - id: secrets-eintragen
    type: terminal
    title: Klartext-Passwörter in Secrets verwandeln
    description: |
      In `secrets-umbauen/web.json` stehen `APP_KEY` und `DB_PASSWORD` im Klartext unter `environment`. Das
      Secret `shop/production` im Secrets Manager enthält beide Werte als JSON-Schlüssel. Seine ARN lautet
      `arn:aws:secretsmanager:eu-central-1:123456789012:secret:shop/production-AbCdEf`.

      1. Entferne `APP_KEY` und `DB_PASSWORD` aus `environment`. `APP_ENV` und `DB_HOST` bleiben.
      2. Lege beim Container `app` eine Liste `secrets` an mit
         - `APP_KEY` → `valueFrom` `<ARN>:APP_KEY::`
         - `DB_PASSWORD` → `valueFrom` `<ARN>:DB_PASSWORD::`
      3. Prüfe mit `jq '.containerDefinitions[0]' web.json`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: secrets-umbauen
    setup: |
      cat > web.json <<'JSON'
      {
        "family": "shop-web",
        "requiresCompatibilities": ["FARGATE"],
        "networkMode": "awsvpc",
        "cpu": "512",
        "memory": "1024",
        "executionRoleArn": "arn:aws:iam::123456789012:role/shop-execution",
        "containerDefinitions": [
          {
            "name": "app",
            "image": "123456789012.dkr.ecr.eu-central-1.amazonaws.com/shop:1.4.0",
            "essential": true,
            "environment": [
              { "name": "APP_ENV", "value": "production" },
              { "name": "APP_KEY", "value": "base64:bm9jaC1rZWluLWVjaHRlci1zY2hsdWVzc2Vs" },
              { "name": "DB_HOST", "value": "shop-db.example.internal" },
              { "name": "DB_PASSWORD", "value": "nicht-so-geheim" }
            ]
          }
        ]
      }
      JSON
    checks:
      - type: command
        run: jq -r '[.containerDefinitions[0].environment[].name] | sort | join(",")' web.json
        stdout_equals: APP_ENV,DB_HOST
        message: In environment sollen nur noch APP_ENV und DB_HOST stehen (oder die Datei ist kein gültiges JSON).
      - type: command
        run: jq -e '.containerDefinitions[0].secrets | length == 2' web.json
        message: Der Container app braucht eine Liste secrets mit genau zwei Einträgen.
      - type: command
        run: jq -e '.containerDefinitions[0].secrets | any(.name == "APP_KEY" and .valueFrom == "arn:aws:secretsmanager:eu-central-1:123456789012:secret:shop/production-AbCdEf:APP_KEY::")' web.json
        message: Der Eintrag für APP_KEY fehlt oder valueFrom stimmt nicht (ARN, dann :APP_KEY::).
      - type: command
        run: jq -e '.containerDefinitions[0].secrets | any(.name == "DB_PASSWORD" and .valueFrom == "arn:aws:secretsmanager:eu-central-1:123456789012:secret:shop/production-AbCdEf:DB_PASSWORD::")' web.json
        message: Der Eintrag für DB_PASSWORD fehlt oder valueFrom stimmt nicht (ARN, dann :DB_PASSWORD::).
      - type: command
        run: grep -c "nicht-so-geheim" web.json
        expect_exit: 1
        message: Das alte Klartext-Passwort steht noch irgendwo in web.json.
    hints:
      - "Ein Eintrag in secrets sieht so aus: `{ \"name\": \"APP_KEY\", \"valueFrom\": \"arn:...:secret:shop/production-AbCdEf:APP_KEY::\" }`."
      - "Mit jq geht es ohne Editor: `.containerDefinitions[0].environment |= map(select(.name == \"APP_ENV\" or .name == \"DB_HOST\"))`."
      - Die zwei Doppelpunkte am Ende stehen für Versionsstufe und Versions-ID, die du leer lässt.
    solution: |
      ```bash
      cd secrets-umbauen
      ARN="arn:aws:secretsmanager:eu-central-1:123456789012:secret:shop/production-AbCdEf"
      jq --arg arn "$ARN" '
        .containerDefinitions[0].environment |= map(select(.name == "APP_ENV" or .name == "DB_HOST"))
        | .containerDefinitions[0].secrets = [
            { "name": "APP_KEY",     "valueFrom": ($arn + ":APP_KEY::") },
            { "name": "DB_PASSWORD", "valueFrom": ($arn + ":DB_PASSWORD::") }
          ]' web.json > web.neu.json
      mv web.neu.json web.json
      jq '.containerDefinitions[0]' web.json
      ```
---
Lokal steht in deiner `.env`-Datei alles nebeneinander: `APP_ENV`, `DB_HOST`, aber auch `APP_KEY` und
`DB_PASSWORD`. Im Image hat diese Datei nichts verloren – sonst kann jeder mit Zugriff auf das Image deine
Passwörter lesen. Eine Task-Definition kennt deshalb zwei Wege, Werte in den Container zu bringen.

## environment: Klartext für harmlose Werte

Unter `environment` stehen normale [[umgebungsvariable|Umgebungsvariablen]] als Paare aus `name` und `value`:

```json
"environment": [
  { "name": "APP_ENV", "value": "production" },
  { "name": "LOG_CHANNEL", "value": "stderr" },
  { "name": "DB_HOST", "value": "shop-db.example.internal" }
]
```

Diese Werte stehen **im Klartext** in der Task-Definition. Jeder, der Task-Definitionen lesen darf, sieht sie –
in der Konsole, in der CLI und in jeder alten Revision.

> [!FEHLER]
> **Passwörter in `environment`.** Auch wenn du sie später entfernst, bleiben sie in allen alten Revisionen
> sichtbar. Ein solches Passwort musst du als verbrannt betrachten und erneuern.

## secrets: Werte aus einem Tresor

Unter `secrets` stehen Paare aus `name` und `valueFrom`. Statt des Werts steht dort, **wo** er liegt – als
[[arn|ARN]] auf AWS [[secrets-manager|Secrets Manager]] oder den [[ssm-parameter-store|Parameter Store]]:

```json
"secrets": [
  {
    "name": "DB_PASSWORD",
    "valueFrom": "arn:aws:secretsmanager:eu-central-1:123456789012:secret:shop/production-AbCdEf:DB_PASSWORD::"
  },
  {
    "name": "MAIL_PASSWORD",
    "valueFrom": "arn:aws:ssm:eu-central-1:123456789012:parameter/shop/production/mail-password"
  }
]
```

Beim Start holt ECS die Werte ab und setzt sie als ganz normale Umgebungsvariablen. Laravel merkt keinen
Unterschied.

> [!MERKSATZ]
> **`environment` für alles, was jeder sehen darf. `secrets` für alles, was niemand sehen darf.** Im
> Container sind beide am Ende einfache Umgebungsvariablen.

## Einen Schlüssel aus einem JSON-Secret holen

Ein Secret im Secrets Manager speichert oft mehrere Werte als JSON:

```json title="Inhalt des Secrets shop/production"
{ "APP_KEY": "base64:…", "DB_PASSWORD": "…", "STRIPE_SECRET": "…" }
```

Mit einem Zusatz an der ARN holst du einen einzelnen Schlüssel:

```text
arn:aws:secretsmanager:eu-central-1:123456789012:secret:shop/production-AbCdEf:DB_PASSWORD::
└──────────────────── ARN des Secrets ───────────────────────────┘ └Schlüssel┘ └Stufe:ID┘
```

Die letzten beiden Felder (Versionsstufe und Versions-ID) lässt du leer – dann gilt die aktuelle Version.
Ohne Zusatz bekommst du das ganze JSON als einen String.

## Secrets Manager oder Parameter Store?

| | Secrets Manager | Parameter Store (SecureString) |
|---|---|---|
| Verschlüsselt mit KMS | ja | ja |
| Automatische Rotation | ja, eingebaut | nein |
| mehrere Werte in einem Secret | ja (JSON) | ein Wert pro Parameter |
| Kosten | pro Secret und Monat | Standard-Parameter ohne Grundgebühr |

Faustregel: Datenbank-Passwörter, die rotiert werden sollen, gehören in Secrets Manager. Einzelne, selten
geänderte Werte passen gut in den Parameter Store.

Benenne Secrets und Parameter nach Anwendung und Umgebung, etwa `shop/production` und `shop/staging`. So kannst
du der Execution-Rolle jeder Umgebung per Wildcard genau ihre eigenen Werte freigeben – und die Staging-App kommt nie
an ein Produktions-Passwort heran.

## Wer holt die Secrets ab?

Nicht dein Code holt die Secrets, sondern der ECS-Agent – **bevor** der Container startet. Dafür nutzt er die
[[execution-rolle|Execution-Rolle]]. Sie braucht Leserechte auf genau diese Secrets:

```json title="Zusatz-Policy für die Execution-Rolle"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue", "ssm:GetParameters"],
      "Resource": [
        "arn:aws:secretsmanager:eu-central-1:123456789012:secret:shop/production-*",
        "arn:aws:ssm:eu-central-1:123456789012:parameter/shop/production/*"
      ]
    }
  ]
}
```

Nutzt das Secret einen eigenen KMS-Schlüssel, braucht die Rolle zusätzlich `kms:Decrypt` darauf.

> [!PRAXIS]
> Werte werden **nur beim Start** gelesen. Rotierst du ein Passwort, laufen alte Tasks mit dem alten Wert
> weiter. Starte danach ein neues Deployment: `aws ecs update-service --cluster shop --service web --force-new-deployment`.

## Zusammenfassung

- `environment` (name/value) steht im Klartext in jeder Revision – nur für harmlose Werte.
- `secrets` (name/valueFrom) verweist per ARN auf Secrets Manager oder Parameter Store.
- Mit `:SCHLÜSSEL::` holst du einen einzelnen Wert aus einem JSON-Secret.
- Die **Execution-Rolle** braucht `secretsmanager:GetSecretValue` bzw. `ssm:GetParameters` (ggf. `kms:Decrypt`).
- Secrets werden beim Start gelesen – nach einer Änderung neu deployen.
- Ein Passwort, das einmal im Klartext in einer Task-Definition stand, gilt als verbrannt.
