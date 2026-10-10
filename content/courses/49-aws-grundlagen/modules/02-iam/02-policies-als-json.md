---
title: Policies als JSON
summary: Wie eine IAM-Policy aufgebaut ist – Effect, Action, Resource und Condition – und wie du nach dem Prinzip der minimalen Rechte genau so viel erlaubst wie nötig.
duration: 25
sources:
  - title: IAM – IAM JSON policy element reference
    url: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html
  - title: IAM – Identity-based policies and resource-based policies
    url: https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_identity-vs-resource.html
  - title: IAM – Managed policies and inline policies
    url: https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_managed-vs-inline.html
  - title: IAM – Apply least-privilege permissions
    url: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html#grant-least-privilege
quiz:
  - type: single
    question: 'Was bedeutet `"Version": "2012-10-17"` in einer Policy?'
    options:
      - Das Datum, an dem die Policy erstellt wurde
      - Die Version der Policy-Sprache – dieser Wert ist der aktuelle und gehört in jede Policy
      - Das Ablaufdatum der Policy
    answer: 1
    explanation: Der Wert bezeichnet die Version der Policy-Grammatik. Ohne ihn fallen einige Funktionen wie Policy-Variablen weg.
  - type: find-bug
    question: Die Policy soll das Lesen aller Dateien im Bucket `example-reports` erlauben. Welche Zeile ist falsch?
    language: json
    code: |
      {
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Action": "s3:GetObject",
          "Resource": "arn:aws:s3:::example-reports"
        }]
      }
    bug_line: 6
    explanation: GetObject wirkt auf Objekte, also braucht die Resource den Zusatz `/*` – `arn:aws:s3:::example-reports/*`. Die ARN ohne `/*` meint nur den Bucket selbst.
  - type: match
    question: Ordne jedem Policy-Element seine Aufgabe zu.
    pairs:
      - { left: "Effect", right: "Erlauben oder verbieten" }
      - { left: "Action", right: "Welche API-Aktionen" }
      - { left: "Resource", right: "Auf welche Ressourcen (ARNs)" }
      - { left: "Condition", right: "Unter welchen Bedingungen" }
    explanation: Zusammen ergeben sie einen Satz – „Erlaube s3:GetObject auf diesem Bucket, wenn die Verbindung verschlüsselt ist.“
  - type: multiple
    question: Welche Aussagen über `Principal` stimmen?
    options:
      - In einer ressourcenbasierten Policy (z. B. Bucket-Policy) gibt Principal an, wem etwas erlaubt wird.
      - In einer identitätsbasierten Policy fehlt Principal, weil die Policy an der Identität selbst hängt.
      - Principal ist in jeder Policy Pflicht.
    answers: [0, 1]
    explanation: Eine identitätsbasierte Policy hängt an einem Benutzer, einer Gruppe oder Rolle – wer gemeint ist, ergibt sich daraus. Nur Policies an Ressourcen (und Trust Policies) nennen einen Principal.
  - type: cloze
    text: "Die Aktion zum Auflisten eines Buckets heißt `s3:___Bucket`, die zum Hochladen einer Datei `s3:___Object`."
    blanks:
      - [List]
      - [Put]
    explanation: ListBucket wirkt auf den Bucket, PutObject und GetObject wirken auf Objekte.
tasks:
  - id: upload-policy
    type: terminal
    title: Eine Policy mit minimalen Rechten schreiben
    description: |
      Eine Laravel-App soll Uploads im Bucket `example-uploads-123456789012` speichern. Sie braucht genau
      diese Rechte – nicht mehr:

      - Objekte unter dem Präfix `uploads/` lesen (`s3:GetObject`) und schreiben (`s3:PutObject`)
      - den Bucket auflisten (`s3:ListBucket`)

      1. Lege im Ordner `upload-policy` die Datei `policy.json` an.
      2. Nutze `"Version": "2012-10-17"` und zwei Statements mit den Sids `ObjekteLesenSchreiben` und
         `BucketAuflisten`.
      3. Die Objekt-Aktionen gelten nur für `arn:aws:s3:::example-uploads-123456789012/uploads/*`,
         `s3:ListBucket` nur für `arn:aws:s3:::example-uploads-123456789012`.
      4. Prüfe deine Datei mit `jq . policy.json` auf gültiges JSON.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit der (leere) Ordner angelegt wird.
    workdir: upload-policy
    setup: |
      true
    checks:
      - type: command
        run: jq empty policy.json
        message: policy.json fehlt oder ist kein gültiges JSON. Prüfe Kommas und Anführungszeichen mit `jq . policy.json`.
      - type: command
        run: jq -r '.Version' policy.json
        stdout_equals: "2012-10-17"
        message: "Die Policy braucht \"Version\": \"2012-10-17\"."
      - type: command
        run: jq -r '[.Statement[] | .Action | if type == "array" then .[] else . end] | map(select(test("\\*"))) | length' policy.json
        stdout_equals: "0"
        message: In den Actions steht ein Platzhalter (*). Nenne die drei Aktionen ausdrücklich.
      - type: command
        run: jq -r '.Statement[] | select(.Sid == "ObjekteLesenSchreiben") | [.Effect, ([.Action] | flatten | sort | join(",")), ([.Resource] | flatten | join(","))] | join(" ")' policy.json
        stdout_equals: "Allow s3:GetObject,s3:PutObject arn:aws:s3:::example-uploads-123456789012/uploads/*"
        message: Das Statement ObjekteLesenSchreiben soll genau s3:GetObject und s3:PutObject auf arn:aws:s3:::example-uploads-123456789012/uploads/* erlauben.
      - type: command
        run: jq -r '.Statement[] | select(.Sid == "BucketAuflisten") | [.Effect, ([.Action] | flatten | join(",")), ([.Resource] | flatten | join(","))] | join(" ")' policy.json
        stdout_equals: "Allow s3:ListBucket arn:aws:s3:::example-uploads-123456789012"
        message: Das Statement BucketAuflisten soll s3:ListBucket nur auf arn:aws:s3:::example-uploads-123456789012 (ohne /*) erlauben.
    hints:
      - Action und Resource dürfen ein einzelner String oder ein Array sein.
      - Objekt-Aktionen brauchen die ARN mit Pfad, ListBucket die ARN des Buckets selbst.
      - "`jq . policy.json` zeigt dir sofort, ob das JSON gültig ist."
    solution: |
      ```bash
      cd upload-policy
      cat > policy.json <<'EOF'
      {
        "Version": "2012-10-17",
        "Statement": [
          {
            "Sid": "ObjekteLesenSchreiben",
            "Effect": "Allow",
            "Action": ["s3:GetObject", "s3:PutObject"],
            "Resource": "arn:aws:s3:::example-uploads-123456789012/uploads/*"
          },
          {
            "Sid": "BucketAuflisten",
            "Effect": "Allow",
            "Action": "s3:ListBucket",
            "Resource": "arn:aws:s3:::example-uploads-123456789012"
          }
        ]
      }
      EOF
      jq . policy.json
      ```
  - id: action-wildcards
    type: code
    language: js
    title: Platzhalter in Actions auswerten
    description: |
      In Actions sind Platzhalter erlaubt: `*` steht für beliebig viele Zeichen, `?` für genau ein Zeichen.
      Groß- und Kleinschreibung spielt bei Actions keine Rolle. Schreibe `actionMatches(pattern, action)`,
      die `true` liefert, wenn die Aktion zum Muster passt.

      - `actionMatches("s3:Get*", "s3:GetObject")` → `true`
      - `actionMatches("s3:*", "ec2:RunInstances")` → `false`
      - `actionMatches("*", "iam:CreateUser")` → `true`
    starter: |
      function actionMatches(pattern, action) {
        // Wandle das Muster in einen regulären Ausdruck um
      }
    tests:
      - name: Exakter Treffer, egal ob groß oder klein
        code: |
          assertEqual(actionMatches('s3:GetObject', 's3:GetObject'), true)
          assertEqual(actionMatches('s3:getobject', 'S3:GetObject'), true)
          assertEqual(actionMatches('s3:GetObject', 's3:PutObject'), false)
      - name: Stern als Platzhalter
        code: |
          assertEqual(actionMatches('s3:Get*', 's3:GetObjectTagging'), true)
          assertEqual(actionMatches('s3:*', 'ec2:RunInstances'), false)
          assertEqual(actionMatches('*', 'iam:CreateUser'), true)
      - name: Fragezeichen steht für genau ein Zeichen
        code: |
          assertEqual(actionMatches('ec2:Describe?', 'ec2:DescribeX'), true)
          assertEqual(actionMatches('ec2:Describe?', 'ec2:Describe'), false)
      - name: Punkte und andere Sonderzeichen sind keine Regex-Zeichen
        code: |
          assertEqual(actionMatches('s3:Get.bject', 's3:GetObject'), false)
          assertEqual(actionMatches('s3:Get*', 'xs3:GetObject'), false)
    hints:
      - "Escape erst alle Regex-Sonderzeichen: `pattern.replace(/[.+^${}()|[\\]\\\\]/g, '\\\\$&')`."
      - "Dann `*` durch `.*` und `?` durch `.` ersetzen und das Ganze mit `^` und `$` umschließen."
      - "Mit dem Flag `i` ignoriert der reguläre Ausdruck Groß- und Kleinschreibung."
    solution: |
      ```js
      function actionMatches(pattern, action) {
        const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&')
        const source = '^' + escaped.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
        return new RegExp(source, 'i').test(action)
      }
      ```
---

„Gib der App einfach `AdministratorAccess`, dann funktioniert es.“ Das funktioniert tatsächlich – bis
jemand über eine Sicherheitslücke in der App Zugriff auf ihre Zugangsdaten bekommt und damit das gesamte
Konto löschen kann. Gute Policies erlauben genau das, was nötig ist. Dafür musst du sie lesen und
schreiben können.

## Aufbau einer Policy

Eine [[iam-policy|IAM-Policy]] ist ein [[json|JSON]]-Dokument mit einer Liste von Aussagen (*Statements*):

```json title="policy.json"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BerichteLesen",
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::example-reports/*"
    }
  ]
}
```

| Element | Bedeutung |
|---|---|
| `Version` | Version der Policy-Sprache – immer `2012-10-17` |
| `Sid` | Optionaler Name des Statements, hilft beim Lesen |
| `Effect` | `Allow` (erlauben) oder `Deny` (verbieten) |
| `Action` | API-Aktionen im Format `dienst:Aktion`, z. B. `s3:GetObject` |
| `Resource` | Eine oder mehrere [[arn\|ARNs]], auf die sich die Aktion bezieht |
| `Condition` | Optional: Bedingungen, unter denen das Statement gilt |

Lies jedes Statement als Satz: „**Erlaube** die Aktion **s3:GetObject** auf allen Objekten im Bucket
**example-reports**.“

## Actions und Resources genau wählen

Actions heißen wie die API-Aufrufe des Dienstes. Platzhalter sind erlaubt: `s3:Get*` meint alle
Aktionen, die mit `Get` beginnen, `*` meint wirklich **alles**.

Bei S3 musst du zwischen Bucket und Objekten unterscheiden:

| Aktion | wirkt auf | Resource |
|---|---|---|
| `s3:ListBucket` | den Bucket | `arn:aws:s3:::example-reports` |
| `s3:GetObject`, `s3:PutObject` | Objekte | `arn:aws:s3:::example-reports/*` |

> [!FEHLER]
> **`"Action": "*"` und `"Resource": "*"` „damit es erst mal läuft“.** Diese Kombination entspricht
> vollen Administratorrechten. Sie wird selten wieder eingeschränkt, weil später niemand mehr weiß, welche
> Rechte wirklich gebraucht werden.

## Bedingungen

Mit `Condition` knüpfst du ein Statement an Umstände. Die Form ist immer
`"Operator": { "Schlüssel": "Wert" }`:

```json title="Nur in Frankfurt erlauben"
{
  "Effect": "Allow",
  "Action": "ec2:RunInstances",
  "Resource": "*",
  "Condition": {
    "StringEquals": { "aws:RequestedRegion": "eu-central-1" }
  }
}
```

Häufige Schlüssel sind `aws:RequestedRegion`, `aws:SecureTransport` (Anfrage über [[https|HTTPS]]?),
`aws:MultiFactorAuthPresent` und `aws:SourceIp`. Weitere stehen in der
[Element-Referenz](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_condition.html).

## Wo Policies hängen

| Art | Hängt an | `Principal`? | Beispiel |
|---|---|---|---|
| [[identitaetsbasierte-policy\|Identitätsbasiert]] | Benutzer, Gruppe, Rolle | nein | Rechte einer Deploy-Rolle |
| [[ressourcenbasierte-policy\|Ressourcenbasiert]] | einer Ressource | **ja** | [[bucket-policy\|Bucket-Policy]] in S3 |

Identitätsbasierte Policies gibt es als [[managed-policy|Managed Policies]] (eigenständig, mehrfach
verwendbar – von AWS vorgefertigt wie `ReadOnlyAccess` oder selbst geschrieben) und als
**Inline-Policies**, die fest zu genau einer Identität gehören. Für eigene Rechte sind selbst verwaltete
Managed Policies meist die bessere Wahl: Sie lassen sich versionieren und wiederverwenden.

## Minimale Rechte in der Praxis

Das Prinzip der [[least-privilege|minimalen Rechte]] heißt: so wenig wie möglich, so viel wie nötig.
Ein bewährter Weg:

1. Mit konkreten Aktionen und ARNs beginnen, ohne Platzhalter.
2. Testen. Fehlt ein Recht, nennt die Fehlermeldung Aktion und ARN.
3. Genau dieses Recht ergänzen – nicht `*`.

> [!MERKSATZ]
> Eine gute Policy lässt sich als Satz vorlesen und jeder Satz hat einen Grund. „Erlaube alles auf
> allem“ ist kein Grund.

> [!PRAXIS]
> Der IAM Access Analyzer kann aus den tatsächlich genutzten Aktionen der letzten Wochen eine passende
> Policy vorschlagen und meldet Rechte, die nie verwendet wurden. Viele Teams nutzen das, um zu breite
> Policies nach und nach zu verkleinern.

## Zusammenfassung

- Eine Policy ist JSON mit `Version` und einer Liste von **Statements**.
- Jedes Statement hat **Effect**, **Action**, **Resource** und optional **Condition**.
- Bei S3 wirkt `ListBucket` auf den Bucket, `GetObject`/`PutObject` auf `bucket/*`.
- Identitätsbasierte Policies hängen an Benutzern, Gruppen und Rollen, ressourcenbasierte an Ressourcen und nennen einen **Principal**.
- **Minimale Rechte**: konkrete Aktionen und ARNs statt `*`, Rechte gezielt ergänzen.
