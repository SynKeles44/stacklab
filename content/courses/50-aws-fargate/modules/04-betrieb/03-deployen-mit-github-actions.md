---
title: Deployen mit GitHub Actions und OIDC
summary: Eine Pipeline, die ohne gespeicherte AWS-Schlüssel ein Image baut, nach ECR pusht, die Task-Definition aktualisiert und den Service ausrollt.
duration: 25
sources:
  - title: Configuring OpenID Connect in Amazon Web Services (GitHub Docs)
    url: https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws
  - title: aws-actions/configure-aws-credentials
    url: https://github.com/aws-actions/configure-aws-credentials
  - title: aws-actions/amazon-ecs-deploy-task-definition
    url: https://github.com/aws-actions/amazon-ecs-deploy-task-definition
  - title: Create a role for OpenID Connect federation (IAM)
    url: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html
quiz:
  - type: single
    question: Welche Berechtigung braucht ein Workflow-Job, damit er sich per OIDC bei AWS anmelden kann?
    options:
      - "contents: write"
      - "id-token: write"
      - "packages: write"
      - "actions: read"
    answer: 1
    explanation: Nur mit id-token write darf der Job ein signiertes OIDC-Token von GitHub anfordern, das AWS gegen kurzlebige Zugangsdaten tauscht.
  - type: find-bug
    question: Mit dieser Trust Policy könnte jedes Repository auf GitHub die Deploy-Rolle übernehmen. Welche Zeile ist das Problem?
    language: json
    code: |
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:*"
        }
      }
    bug_line: 6
    explanation: Die sub-Bedingung muss auf dein Repository und am besten auf ein Environment oder einen Branch eingeschränkt sein, z. B. repo:beispiel-org/shop:environment:production.
  - type: match
    question: Ordne jede Action ihrer Aufgabe zu.
    pairs:
      - { left: "configure-aws-credentials", right: "Tauscht das OIDC-Token gegen kurzlebige AWS-Zugangsdaten" }
      - { left: "amazon-ecr-login", right: "Meldet Docker bei der ECR-Registry an" }
      - { left: "amazon-ecs-render-task-definition", right: "Trägt das neue Image in die Task-Definition ein" }
      - { left: "amazon-ecs-deploy-task-definition", right: "Registriert die Revision und aktualisiert den Service" }
    explanation: Zusammen bilden die vier Actions den typischen Deploy-Job für ECS.
  - type: multiple
    question: Welche Rechte braucht die Deploy-Rolle mindestens zusätzlich zu den ECR-Push-Rechten?
    options:
      - ecs:RegisterTaskDefinition und ecs:UpdateService
      - iam:PassRole für die Task- und die Execution-Rolle
      - iam:CreateUser
      - ecs:DescribeServices, um auf Stabilität zu warten
    answers: [0, 1, 3]
    explanation: Wer eine Task-Definition mit Rollen registriert, muss diese Rollen an ECS weiterreichen dürfen – dafür ist iam:PassRole da. Benutzer anlegen gehört nicht dazu.
tasks:
  - id: deploy-workflow
    type: terminal
    title: Den Deploy-Workflow schreiben
    description: |
      Im Ordner `deploy-pipeline` liegt eine Laravel-App mit `Dockerfile` und `.aws/task-definition.json`. Schreibe
      `.github/workflows/deploy.yml`:

      1. Trigger: `push` auf den Branch `main`.
      2. Workflow-weite `permissions`: `id-token: write` und `contents: read`.
      3. Ein Job `deploy` auf `ubuntu-latest` mit `environment: production`.
      4. Schritte (in dieser Reihenfolge): `actions/checkout@v5`, `aws-actions/configure-aws-credentials@v6` mit
         `role-to-assume: arn:aws:iam::123456789012:role/github-deploy` und `aws-region: eu-central-1`,
         `aws-actions/amazon-ecr-login@v2` mit `id: ecr`, ein `run`-Schritt mit `docker build` und `docker push`,
         `aws-actions/amazon-ecs-render-task-definition@v1` mit `id: render`,
         `aws-actions/amazon-ecs-deploy-task-definition@v2`.
      5. Der Image-Tag ist der Commit: `${{ github.sha }}`.
      6. Der Deploy-Schritt nutzt `task-definition: ${{ steps.render.outputs.task-definition }}`, `cluster: shop`,
         `service: web` und `wait-for-service-stability: true`.

      Keine AWS-Schlüssel im Workflow! Prüfe die Syntax mit
      `bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/deploy.yml").text()), null, 2))'`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: deploy-pipeline
    setup: |
      mkdir -p .aws
      printf 'FROM php:8.5-fpm-alpine\nWORKDIR /var/www/html\nCOPY . .\n' > Dockerfile
      cat > .aws/task-definition.json <<'JSON'
      {
        "family": "shop-web",
        "requiresCompatibilities": ["FARGATE"],
        "networkMode": "awsvpc",
        "cpu": "512",
        "memory": "1024",
        "executionRoleArn": "arn:aws:iam::123456789012:role/shop-execution",
        "taskRoleArn": "arn:aws:iam::123456789012:role/shop-task",
        "containerDefinitions": [
          { "name": "app", "image": "PLATZHALTER", "essential": true, "portMappings": [{ "containerPort": 8080 }] }
        ]
      }
      JSON
    checks:
      - type: command
        run: bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/deploy.yml").text())))' > .wf.json && jq -e '.jobs.deploy' .wf.json > /dev/null; s=$?; rm -f .wf.json; exit $s
        message: .github/workflows/deploy.yml fehlt, ist kein gültiges YAML oder hat keinen Job deploy.
      - type: command
        run: bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/deploy.yml").text())))' | jq -e '.on.push.branches == ["main"]'
        message: Der Workflow soll bei push auf main starten (on → push → branches → [main]).
      - type: command
        run: bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/deploy.yml").text())))' | jq -e '.permissions["id-token"] == "write" and .permissions.contents == "read"'
        message: "Auf oberster Ebene fehlen permissions mit id-token: write und contents: read."
      - type: command
        run: bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/deploy.yml").text())))' | jq -e '.jobs.deploy["runs-on"] == "ubuntu-latest" and .jobs.deploy.environment == "production"'
        message: "Der Job deploy braucht runs-on: ubuntu-latest und environment: production."
      - type: command
        run: bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/deploy.yml").text())))' | jq -e '[.jobs.deploy.steps[] | .uses // "run" | split("@")[0]] == ["actions/checkout","aws-actions/configure-aws-credentials","aws-actions/amazon-ecr-login","run","aws-actions/amazon-ecs-render-task-definition","aws-actions/amazon-ecs-deploy-task-definition"]'
        message: Die sechs Schritte fehlen oder stehen in der falschen Reihenfolge (checkout, credentials, ecr-login, run mit build/push, render, deploy).
      - type: command
        run: bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/deploy.yml").text())))' | jq -e '.jobs.deploy.steps[1].with["role-to-assume"] == "arn:aws:iam::123456789012:role/github-deploy" and .jobs.deploy.steps[1].with["aws-region"] == "eu-central-1"'
        message: configure-aws-credentials braucht role-to-assume mit der Rolle github-deploy und aws-region eu-central-1.
      - type: command
        run: bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/deploy.yml").text())))' | jq -e '.jobs.deploy.steps[2].id == "ecr" and .jobs.deploy.steps[4].id == "render" and (.jobs.deploy.steps[3].run | test("docker build") and test("docker push") and test("github.sha"))'
        message: Der ECR-Login braucht id ecr, der Render-Schritt id render, und der run-Schritt muss mit docker build und docker push den Tag github.sha verwenden.
      - type: command
        run: bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/deploy.yml").text())))' | jq -e '.jobs.deploy.steps[5].with | .cluster == "shop" and .service == "web" and (.["wait-for-service-stability"] | tostring) == "true" and (.["task-definition"] | test("steps\\.render\\.outputs\\.task-definition"))'
        message: Der Deploy-Schritt braucht task-definition aus steps.render.outputs.task-definition, cluster shop, service web und wait-for-service-stability true.
      - type: command
        run: grep -Eiq "aws-access-key-id|aws-secret-access-key|AKIA" .github/workflows/deploy.yml
        expect_exit: 1
        message: Im Workflow stehen AWS-Schlüssel – mit OIDC brauchst du keine.
    hints:
      - Beginne mit dem Gerüst aus der Lektion und passe nur Namen und ARNs an.
      - "Der Image-Name für den Render-Schritt: `image: ${{ steps.ecr.outputs.registry }}/shop:${{ github.sha }}`, dazu `task-definition: .aws/task-definition.json` und `container-name: app`."
      - YAML ist empfindlich bei Einrückung – nutze Leerzeichen, keine Tabs, und prüfe nach jedem Abschnitt mit dem bun-Befehl.
    solution: |
      ```yaml title=".github/workflows/deploy.yml"
      name: Deploy

      on:
        push:
          branches: [main]

      permissions:
        id-token: write
        contents: read

      jobs:
        deploy:
          runs-on: ubuntu-latest
          environment: production
          steps:
            - uses: actions/checkout@v5

            - uses: aws-actions/configure-aws-credentials@v6
              with:
                role-to-assume: arn:aws:iam::123456789012:role/github-deploy
                aws-region: eu-central-1

            - uses: aws-actions/amazon-ecr-login@v2
              id: ecr

            - name: Build and push image
              run: |
                IMAGE=${{ steps.ecr.outputs.registry }}/shop:${{ github.sha }}
                docker build -t "$IMAGE" .
                docker push "$IMAGE"

            - uses: aws-actions/amazon-ecs-render-task-definition@v1
              id: render
              with:
                task-definition: .aws/task-definition.json
                container-name: app
                image: ${{ steps.ecr.outputs.registry }}/shop:${{ github.sha }}

            - uses: aws-actions/amazon-ecs-deploy-task-definition@v2
              with:
                task-definition: ${{ steps.render.outputs.task-definition }}
                cluster: shop
                service: web
                wait-for-service-stability: true
      ```
  - id: pipeline-reihenfolge
    type: order
    title: Was passiert bei einem Push auf main?
    description: Bringe die Schritte der Deploy-Pipeline in die richtige Reihenfolge.
    items:
      - GitHub startet den Job und stellt ein signiertes OIDC-Token aus
      - AWS prüft das Token gegen die Trust Policy und gibt kurzlebige Zugangsdaten heraus
      - Docker meldet sich bei ECR an, baut das Image und pusht es mit dem Commit-Hash als Tag
      - Die Task-Definition bekommt das neue Image und wird als neue Revision registriert
      - Der Service wird auf die neue Revision aktualisiert und tauscht die Tasks aus
      - Der Job wartet, bis der Service stabil ist, und meldet Erfolg
---
Bisher hast du jeden Befehl von Hand getippt. In echten Projekten soll jeder Push auf `main` automatisch
ausgeliefert werden – zuverlässig und ohne dass irgendwo ein AWS-Schlüssel herumliegt. Aus dem Kurs
[Deployments & CI/CD](/kurse/deployments-cicd) kennst du GitHub Actions und das Prinzip von OIDC. Hier setzt du es
konkret für ECS um.

## Warum OIDC statt Zugangsschlüssel?

Ein gespeicherter AWS-Zugangsschlüssel als GitHub-Secret gilt, bis jemand ihn löscht. Gelangt er in ein Log
oder einen Fork, kann jeder damit deployen. Mit [[openid-connect|OpenID Connect]] gibt es keinen solchen
Schlüssel:

1. GitHub stellt dem Job ein signiertes [[id-token|ID-Token]] aus. Darin steht, aus welchem Repository, Branch
   und Environment er kommt.
2. AWS prüft das Token gegen die [[trust-policy|Trust Policy]] einer Deploy-Rolle.
3. Passt alles, gibt AWS [[kurzlebige-zugangsdaten|kurzlebige Zugangsdaten]] heraus, die nach einer Stunde verfallen.

Einmalig legst du in IAM einen [[oidc-identitaetsanbieter|OIDC-Identitätsanbieter]] für
`token.actions.githubusercontent.com` an.

## Die Trust Policy der Deploy-Rolle

```json title="github-deploy-trust.json"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:beispiel-org/shop:environment:production"
        }
      }
    }
  ]
}
```

Die `sub`-Bedingung ist das Herzstück: Nur Jobs aus `beispiel-org/shop`, die im Environment `production`
laufen, dürfen die Rolle übernehmen.

> [!FEHLER]
> **`sub` mit `repo:*` oder ganz ohne `sub`-Bedingung.** Dann kann jedes Repository auf GitHub – auch das eines
> Angreifers – deine Deploy-Rolle übernehmen. Schränke immer auf Repository und Environment oder Branch ein.

## Rechte der Deploy-Rolle

Die Rolle braucht genau das, was die Pipeline tut:

| Zweck | Aktionen |
|---|---|
| bei ECR anmelden | `ecr:GetAuthorizationToken` |
| Image pushen | `ecr:BatchCheckLayerAvailability`, `ecr:InitiateLayerUpload`, `ecr:UploadLayerPart`, `ecr:CompleteLayerUpload`, `ecr:PutImage` |
| ausrollen | `ecs:RegisterTaskDefinition`, `ecs:UpdateService`, `ecs:DescribeServices`, `ecs:DescribeTaskDefinition` |
| Rollen weiterreichen | `iam:PassRole` auf Task- und Execution-Rolle |

[[iam-passrole|`iam:PassRole`]] ist der Teil, den viele vergessen: Wer eine Task-Definition mit
`taskRoleArn` registriert, gibt diese Rolle an ECS weiter – und muss das ausdrücklich dürfen. Beschränke es per
Bedingung `iam:PassedToService` auf `ecs-tasks.amazonaws.com`.

## Der Workflow

```yaml title=".github/workflows/deploy.yml"
name: Deploy
on:
  push:
    branches: [main]
permissions:
  id-token: write
  contents: read
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v5
      - uses: aws-actions/configure-aws-credentials@v6
        with:
          role-to-assume: arn:aws:iam::123456789012:role/github-deploy
          aws-region: eu-central-1
      - uses: aws-actions/amazon-ecr-login@v2
        id: ecr
      - name: Build and push image
        run: |
          IMAGE=${{ steps.ecr.outputs.registry }}/shop:${{ github.sha }}
          docker build -t "$IMAGE" .
          docker push "$IMAGE"
      - uses: aws-actions/amazon-ecs-render-task-definition@v1
        id: render
        with:
          task-definition: .aws/task-definition.json
          container-name: app
          image: ${{ steps.ecr.outputs.registry }}/shop:${{ github.sha }}
      - uses: aws-actions/amazon-ecs-deploy-task-definition@v2
        with:
          task-definition: ${{ steps.render.outputs.task-definition }}
          cluster: shop
          service: web
          wait-for-service-stability: true
```

Die Task-Definition liegt als Vorlage im Repository. Der Render-Schritt setzt das neue Image ein, der Deploy-Schritt
registriert die Revision, aktualisiert den Service und wartet, bis er stabil ist.

> [!MERKSATZ]
> **Das Image wird einmal gebaut und mit dem Commit-Hash getaggt.** Web, Worker und Scheduler bekommen dasselbe
> Image – so läuft überall genau derselbe Code.

## Migration und weitere Services

Für Laravel fehlen noch zwei Dinge:

- **Migration vorher:** Die Deploy-Action kann mit `run-task: true`, `wait-for-task-stopped: true` und
  `run-task-container-overrides` (dort steht `php artisan migrate --force`) einen One-off-Task starten. Der Service
  wird erst aktualisiert, wenn dieser Task erfolgreich endet.
- **Worker und Scheduler:** Für sie wiederholst du Render- und Deploy-Schritt mit ihren eigenen
  Task-Definitionen und Services.

> [!PRAXIS]
> Viele Teams nutzen zwei Environments, `staging` und `production`, mit je eigener Deploy-Rolle. Die
> Produktions-Rolle vertraut nur dem Environment `production`, und das hat in GitHub Pflicht-Reviewer. So kann
> niemand ohne Freigabe in Produktion ausliefern.

## Zusammenfassung

- **OIDC** ersetzt gespeicherte Schlüssel: GitHub-Token gegen kurzlebige AWS-Zugangsdaten.
- Der Workflow braucht `permissions: id-token: write`.
- Die **Trust Policy** schränkt per `sub` auf Repository und Environment ein – nie `repo:*`.
- Die Deploy-Rolle braucht ECR-Push-, ECS-Deploy-Rechte und **`iam:PassRole`** für die Task-Rollen.
- Ablauf: Credentials → ECR-Login → Build und Push mit `github.sha` → Render → Deploy mit Warten auf Stabilität.
