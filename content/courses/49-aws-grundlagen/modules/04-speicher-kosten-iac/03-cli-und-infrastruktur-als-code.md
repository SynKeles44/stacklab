---
title: AWS CLI und Infrastruktur als Code
summary: Wie AWS-CLI-Befehle aufgebaut sind, wie du Ausgaben mit --query filterst und warum du Ressourcen besser als Code mit CloudFormation (oder Terraform/OpenTofu) beschreibst als sie in der Konsole zusammenzuklicken.
duration: 25
sources:
  - title: AWS CLI – Command structure in the AWS CLI
    url: https://docs.aws.amazon.com/cli/latest/userguide/cli-usage-commandstructure.html
  - title: AWS CLI – Filtering output with --query
    url: https://docs.aws.amazon.com/cli/latest/userguide/cli-usage-filter.html
  - title: AWS CloudFormation – How CloudFormation works
    url: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cloudformation-overview.html
  - title: AWS CloudFormation – AWS::S3::Bucket
    url: https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-s3-bucket.html
  - title: AWS CloudFormation – DeletionPolicy attribute
    url: https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-attribute-deletionpolicy.html
quiz:
  - type: match
    question: Ordne jeder globalen CLI-Option ihre Wirkung zu.
    pairs:
      - { left: "--profile dev", right: "Nutzt Zugangsdaten und Einstellungen des Profils dev" }
      - { left: "--region eu-west-1", right: "Schickt den Befehl an eine andere Region" }
      - { left: "--output table", right: "Zeigt das Ergebnis als Tabelle statt als JSON" }
      - { left: "--query", right: "Filtert die Antwort mit einem JMESPath-Ausdruck" }
    explanation: Diese Optionen funktionieren bei fast allen Befehlen der AWS CLI gleich.
  - type: multiple
    question: Welche Vorteile hat Infrastruktur als Code gegenüber Klicken in der Konsole?
    options:
      - Jede Änderung ist im Git-Verlauf nachvollziehbar und kann im Review geprüft werden.
      - Dieselbe Umgebung lässt sich reproduzierbar ein zweites Mal aufbauen, etwa für Staging.
      - Ressourcen kosten dadurch automatisch weniger.
      - Abweichungen zwischen Code und Wirklichkeit lassen sich erkennen.
    answers: [0, 1, 3]
    explanation: Infrastruktur als Code bringt Nachvollziehbarkeit, Wiederholbarkeit und Drift-Erkennung. Die Preise der Ressourcen bleiben gleich.
  - type: single
    question: 'Was passiert mit einem S3-Bucket, der in einem CloudFormation-Template `DeletionPolicy: Retain` hat, wenn du den Stack löschst?'
    options:
      - Der Bucket wird mit allen Objekten gelöscht.
      - Der Bucket bleibt erhalten, CloudFormation verwaltet ihn nur nicht mehr.
      - Das Löschen des Stacks schlägt immer fehl.
    answer: 1
    explanation: Retain schützt wichtige Daten davor, beim Aufräumen eines Stacks mitgelöscht zu werden.
  - type: find-bug
    question: Dieses CloudFormation-Template soll einen privaten, versionierten Bucket anlegen. Welche Zeile ist falsch?
    language: yaml
    code: |
      AWSTemplateFormatVersion: "2010-09-09"
      Resources:
        DocsBucket:
          Type: AWS::S3::Bucket
          Properties:
            VersioningConfiguration:
              Status: true
    bug_line: 7
    explanation: "Der Status der Versionierung ist ein Text: `Enabled` oder `Suspended`. `true` ist kein gültiger Wert."
tasks:
  - id: cfn-template
    type: terminal
    title: Ein CloudFormation-Template schreiben
    description: |
      CloudFormation versteht Templates in YAML **und** in JSON. Weil du im Übungs-Terminal JSON mit `jq`
      prüfen kannst, schreibst du hier die JSON-Form.

      Lege im Ordner `cloudformation` die Datei `bucket.json` an:

      1. `AWSTemplateFormatVersion` ist `2010-09-09`.
      2. Unter `Resources` steht eine Ressource mit der logischen ID `DocsBucket` vom Typ `AWS::S3::Bucket`
         und mit `"DeletionPolicy": "Retain"`.
      3. Ihre `Properties` enthalten `BucketName` `example-docs-123456789012`, eine
         `PublicAccessBlockConfiguration` mit allen vier Einstellungen auf `true` und eine
         `VersioningConfiguration` mit `Status` `Enabled`.
      4. Unter `Outputs` gibt `BucketArn` den Wert `{ "Fn::GetAtt": ["DocsBucket", "Arn"] }` aus.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit der Ordner angelegt wird.
    workdir: cloudformation
    setup: |
      true
    checks:
      - type: command
        run: jq -r '.AWSTemplateFormatVersion' bucket.json
        stdout_equals: "2010-09-09"
        message: bucket.json fehlt, ist kein gültiges JSON oder AWSTemplateFormatVersion ist nicht 2010-09-09.
      - type: command
        run: jq -r '.Resources.DocsBucket | "\(.Type) \(.DeletionPolicy)"' bucket.json
        stdout_equals: AWS::S3::Bucket Retain
        message: Die Ressource DocsBucket braucht den Type AWS::S3::Bucket und DeletionPolicy Retain (auf derselben Ebene wie Type).
      - type: command
        run: jq -r '.Resources.DocsBucket.Properties.BucketName' bucket.json
        stdout_equals: example-docs-123456789012
        message: Unter Properties fehlt BucketName example-docs-123456789012.
      - type: command
        run: jq -r '.Resources.DocsBucket.Properties.PublicAccessBlockConfiguration | [.BlockPublicAcls, .IgnorePublicAcls, .BlockPublicPolicy, .RestrictPublicBuckets] | map(tostring) | join(",")' bucket.json
        stdout_equals: true,true,true,true
        message: PublicAccessBlockConfiguration braucht alle vier Einstellungen mit dem JSON-Wert true.
      - type: command
        run: jq -r '.Resources.DocsBucket.Properties.VersioningConfiguration.Status' bucket.json
        stdout_equals: Enabled
        message: VersioningConfiguration braucht Status Enabled.
      - type: command
        run: jq -c '.Outputs.BucketArn.Value' bucket.json
        stdout_equals: '{"Fn::GetAtt":["DocsBucket","Arn"]}'
        message: "Unter Outputs fehlt BucketArn mit dem Wert { \"Fn::GetAtt\": [\"DocsBucket\", \"Arn\"] }."
    hints:
      - "Die Grundstruktur: `{ \"AWSTemplateFormatVersion\": \"2010-09-09\", \"Resources\": { … }, \"Outputs\": { … } }`."
      - "`DeletionPolicy` steht neben `Type` und `Properties`, nicht darin."
      - "Ein Output hat die Form `\"BucketArn\": { \"Value\": … }`."
    solution: |
      ```bash
      cd cloudformation
      cat > bucket.json <<'EOF'
      {
        "AWSTemplateFormatVersion": "2010-09-09",
        "Description": "Privater, versionierter Bucket für Dokumente",
        "Resources": {
          "DocsBucket": {
            "Type": "AWS::S3::Bucket",
            "DeletionPolicy": "Retain",
            "Properties": {
              "BucketName": "example-docs-123456789012",
              "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": true,
                "IgnorePublicAcls": true,
                "BlockPublicPolicy": true,
                "RestrictPublicBuckets": true
              },
              "VersioningConfiguration": { "Status": "Enabled" }
            }
          }
        },
        "Outputs": {
          "BucketArn": { "Value": { "Fn::GetAtt": ["DocsBucket", "Arn"] } }
        }
      }
      EOF
      jq . bucket.json
      ```
  - id: stack-deployen
    type: simulated
    title: Den Stack prüfen und ausrollen
    description: |
      Dein Template `bucket.json` ist fertig. Prüfe es, rolle es als Stack `docs-bucket` aus und lies die
      Ausgabe des Stacks.

      1. `aws cloudformation validate-template --template-body file://bucket.json`
      2. `aws cloudformation deploy --template-file bucket.json --stack-name docs-bucket`
      3. `aws cloudformation describe-stacks --stack-name docs-bucket --query "Stacks[0].Outputs" --output table`
    prompt: "du@laptop:~/cloudformation$"
    steps:
      - expect: "^aws\\s+cloudformation\\s+validate-template\\s+--template-body\\s+file://bucket\\.json$"
        output: |
          {
              "Parameters": [],
              "Description": "Privater, versionierter Bucket für Dokumente"
          }
        hint: "Tippe `aws cloudformation validate-template --template-body file://bucket.json`."
      - expect: "^aws\\s+cloudformation\\s+deploy(?=.*--template-file\\s+bucket\\.json)(?=.*--stack-name\\s+docs-bucket).*$"
        output: |
          Waiting for changeset to be created..
          Waiting for stack create/update to complete
          Successfully created/updated stack - docs-bucket
        hint: "Nutze `--template-file bucket.json` und `--stack-name docs-bucket`."
      - expect: "^aws\\s+cloudformation\\s+describe-stacks(?=.*--stack-name\\s+docs-bucket)(?=.*--query\\s+[\"']?Stacks\\[0\\]\\.Outputs[\"']?)(?=.*--output\\s+table).*$"
        output: |
          ----------------------------------------------------------------
          |                        DescribeStacks                        |
          +--------------+-----------------------------------------------+
          |   OutputKey  |                  OutputValue                  |
          +--------------+-----------------------------------------------+
          |  BucketArn   |  arn:aws:s3:::example-docs-123456789012       |
          +--------------+-----------------------------------------------+
        hint: "Nutze --stack-name, --query \"Stacks[0].Outputs\" und --output table."
    responses:
      - match: "delete-stack"
        output: "Nicht jetzt – der Stack wurde gerade erst angelegt. Dank DeletionPolicy Retain bliebe der Bucket beim Löschen ohnehin erhalten."
---

Euer Staging-System wurde vor zwei Jahren von Hand in der AWS-Konsole zusammengeklickt. Jetzt soll eine
zweite, identische Umgebung für einen Kunden entstehen – und niemand weiß mehr genau, welche Einstellungen
damals gesetzt wurden. Die Lösung heißt: Infrastruktur nicht klicken, sondern beschreiben.

## Aufbau eines CLI-Befehls

Die [[aws-cli|AWS CLI]] folgt immer demselben Muster:

```text
aws <dienst> <befehl> [optionen]

aws s3 ls
aws ec2 describe-instances --instance-ids i-0123456789abcdef0
aws iam list-roles --profile prod
```

Globale Optionen funktionieren bei fast allen Befehlen:

| Option | Wirkung |
|---|---|
| `--profile <name>` | Profil aus `~/.aws/config` verwenden |
| `--region <code>` | Region für diesen Befehl |
| `--output json\|table\|text\|yaml` | Format der Ausgabe |
| `--query <ausdruck>` | Antwort filtern (JMESPath) |

Hilfe zu jedem Befehl bekommst du mit `aws ec2 describe-instances help`. Einige EC2-Befehle kennen außerdem
`--dry-run`: Er prüft nur, ob du die Rechte hättest, ohne etwas zu ändern.

## Ausgaben filtern mit --query

AWS-Antworten sind oft riesig. Mit `--query` filterst du sie direkt in der CLI:

```bash title="Terminal"
aws ec2 describe-instances \
  --query "Reservations[].Instances[].[InstanceId, State.Name, InstanceType]" \
  --output table
```

`[]` läuft über eine Liste, `.` greift auf Felder zu. Alternativ kannst du JSON-Ausgaben wie gewohnt an
[[jq|jq]] weiterreichen – das hast du in diesem Kurs schon oft gemacht.

> [!FEHLER]
> **Befehle in der falschen Region oder im falschen Konto.** Ohne `--profile` und `--region` nutzt die CLI
> die Standardwerte – und die zeigen vielleicht auf Produktion. Prüfe vor ändernden Befehlen mit
> `aws sts get-caller-identity`, wo du gerade bist.

## Warum Infrastruktur als Code?

Bei [[infrastructure-as-code|Infrastruktur als Code]] (IaC) beschreibst du Ressourcen in Textdateien. Ein
Werkzeug vergleicht die Beschreibung mit der Wirklichkeit und legt an, ändert oder löscht, was nötig ist.

| Klicken in der Konsole | Infrastruktur als Code |
|---|---|
| Niemand weiß später, wer was eingestellt hat | Jede Änderung steht im Git-Verlauf |
| Zweite Umgebung = alles nochmal klicken | Gleiches Template, anderer Stack |
| Änderungen ohne Review | Pull Request mit Vier-Augen-Prinzip |
| Abweichungen fallen nicht auf | Drift-Erkennung zeigt Unterschiede |

## CloudFormation

[[cloudformation|AWS CloudFormation]] ist das IaC-Werkzeug von AWS. Ein Template (YAML oder JSON) beschreibt
Ressourcen, ein [[cloudformation-stack|Stack]] ist eine ausgerollte Instanz davon:

```yaml title="bucket.yaml"
AWSTemplateFormatVersion: "2010-09-09"
Description: Privater, versionierter Bucket für Dokumente
Resources:
  DocsBucket:                       # logische ID
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain          # beim Löschen des Stacks behalten
    Properties:
      BucketName: example-docs-123456789012
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        IgnorePublicAcls: true
        BlockPublicPolicy: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
Outputs:
  BucketArn:
    Value: !GetAtt DocsBucket.Arn
```

```bash title="Terminal"
aws cloudformation validate-template --template-body file://bucket.yaml
aws cloudformation deploy --template-file bucket.yaml --stack-name docs-bucket
```

`deploy` erzeugt intern ein *Change Set* – eine Vorschau der Änderungen – und führt es aus. Löschst du
den Stack, löscht CloudFormation alle Ressourcen darin, außer denen mit `DeletionPolicy: Retain`.

> [!MERKSATZ]
> Was als Code beschrieben ist, änderst du nur noch im Code. Wer nebenbei in der Konsole nachbessert,
> erzeugt Drift – und der nächste Deploy überschreibt die Handarbeit oder scheitert.

## Terraform und OpenTofu

Neben CloudFormation sind [[terraform|Terraform]] und sein quelloffener Ableger OpenTofu weit verbreitet.
Sie nutzen eine eigene Sprache (HCL) und funktionieren mit vielen Anbietern, nicht nur mit AWS:

```hcl title="main.tf"
resource "aws_s3_bucket" "docs" {
  bucket = "example-docs-123456789012"
}
```

Mit `terraform plan` (bzw. `tofu plan`) siehst du die geplanten Änderungen, mit `apply` führst du sie aus.
Mehr dazu in der [OpenTofu-Dokumentation](https://opentofu.org/docs/).

> [!PRAXIS]
> In vielen Teams läuft IaC über die CI-Pipeline: Ein Pull Request zeigt automatisch den Plan bzw. das
> Change Set, nach dem Review rollt die Pipeline mit einer eigenen Deploy-Rolle aus. Niemand braucht dann
> Schreibrechte in der Konsole der Produktion.

## Zusammenfassung

- CLI-Befehle folgen dem Muster `aws <dienst> <befehl> [optionen]`; `--profile`, `--region`, `--output` und `--query` gelten fast überall.
- Vor ändernden Befehlen prüfst du mit `aws sts get-caller-identity`, in welchem Konto du bist.
- **Infrastruktur als Code** macht Umgebungen nachvollziehbar, reviewbar und wiederholbar.
- **CloudFormation** rollt Templates (YAML oder JSON) als **Stacks** aus; `DeletionPolicy: Retain` schützt wichtige Daten.
- **Terraform** und **OpenTofu** sind anbieterübergreifende Alternativen mit `plan` und `apply`.
