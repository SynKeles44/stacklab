---
title: S3 – Buckets, Objekte und sicherer Zugriff
summary: Wie S3 Dateien als Objekte in Buckets speichert, wie Block Public Access und Bucket-Policies sie schützen und wie du mit Presigned URLs zeitlich begrenzt teilst.
duration: 25
sources:
  - title: Amazon S3 – What is Amazon S3?
    url: https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html
  - title: Amazon S3 – Blocking public access to your Amazon S3 storage
    url: https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html
  - title: Amazon S3 – Bucket policies
    url: https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-policies.html
  - title: Amazon S3 – Download and upload objects with presigned URLs
    url: https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html
  - title: AWS CLI – aws s3 presign
    url: https://docs.aws.amazon.com/cli/latest/reference/s3/presign.html
quiz:
  - type: single
    question: Ein Objekt hat den Schlüssel `rechnungen/2026/oktober.pdf`. Was stimmt?
    options:
      - S3 legt dafür echte Ordner `rechnungen` und `2026` an.
      - Der ganze Pfad ist der Schlüssel; die Konsole zeigt die Präfixe nur wie Ordner an.
      - Schrägstriche sind in Schlüsseln verboten.
    answer: 1
    explanation: S3 ist ein flacher Speicher aus Schlüssel und Inhalt. Präfixe mit `/` sind eine Konvention, die die Konsole als Ordner darstellt.
  - type: multiple
    question: Welche Aussagen über Block Public Access stimmen?
    options:
      - Neue Buckets sind standardmäßig nicht öffentlich.
      - Die Einstellungen überstimmen Bucket-Policies und ACLs, die öffentlichen Zugriff gewähren würden.
      - Man kann sie für einen Bucket und für das ganze Konto setzen.
      - Sie verschlüsseln die Objekte.
    answers: [0, 1, 2]
    explanation: Block Public Access ist eine Schutzschicht über allen Policies. Verschlüsselung ist ein eigenes Thema.
  - type: single
    question: Du erzeugst eine Presigned URL mit den temporären Zugangsdaten einer Rolle, deren Sitzung in 30 Minuten endet, und gibst `--expires-in 86400` an. Wie lange funktioniert die URL?
    options:
      - 24 Stunden
      - Höchstens bis die Sitzung der Rolle endet, also etwa 30 Minuten
      - Für immer
    answer: 1
    explanation: Eine Presigned URL gilt nie länger als die Zugangsdaten, mit denen sie signiert wurde.
  - type: find-bug
    question: Diese Bucket-Policy soll unverschlüsselte Verbindungen verbieten. Welche Zeile ist falsch?
    language: json
    code: |
      {
        "Effect": "Deny",
        "Principal": "*",
        "Action": "s3:*",
        "Resource": ["arn:aws:s3:::example-docs", "arn:aws:s3:::example-docs/*"],
        "Condition": { "Bool": { "aws:SecureTransport": "true" } }
      }
    bug_line: 6
    explanation: 'Verboten werden sollen Anfragen ohne TLS, also `"aws:SecureTransport": "false"`. Mit "true" würde die Policy jeden verschlüsselten Zugriff sperren.'
tasks:
  - id: bucket-absichern
    type: terminal
    title: Einen Bucket als Dateien absichern
    description: |
      Für den Bucket `example-docs-123456789012` sollen zwei Konfigurationsdateien entstehen, die später per
      CLI angewendet werden. Lege sie im Ordner `bucket-schutz` an:

      1. `public-access-block.json` mit allen vier Block-Public-Access-Einstellungen auf `true`:
         `BlockPublicAcls`, `IgnorePublicAcls`, `BlockPublicPolicy`, `RestrictPublicBuckets`.
      2. `bucket-policy.json` mit `"Version": "2012-10-17"` und zwei Statements:
         - `NurTls`: **Deny** für `"Principal": "*"` und `"Action": "s3:*"` auf den Bucket **und** alle
           Objekte (`…-123456789012` und `…-123456789012/*`), wenn `aws:SecureTransport` `"false"` ist
           (Operator `Bool`).
         - `AppLiest`: **Allow** `s3:GetObject` für den Principal
           `{ "AWS": "arn:aws:iam::123456789012:role/app" }` auf `arn:aws:s3:::example-docs-123456789012/*`.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit der Ordner angelegt wird.
    workdir: bucket-schutz
    setup: |
      true
    checks:
      - type: command
        run: jq -r '[.BlockPublicAcls, .IgnorePublicAcls, .BlockPublicPolicy, .RestrictPublicBuckets] | map(tostring) | join(",")' public-access-block.json
        stdout_equals: true,true,true,true
        message: public-access-block.json fehlt oder nicht alle vier Einstellungen stehen auf true (als JSON-Wahrheitswert).
      - type: command
        run: jq -r '.Version' bucket-policy.json
        stdout_equals: "2012-10-17"
        message: bucket-policy.json fehlt, ist kein gültiges JSON oder die Version 2012-10-17 fehlt.
      - type: command
        run: jq -r '.Statement[] | select(.Sid == "NurTls") | [.Effect, (.Principal | tostring), ([.Action] | flatten | join(",")), .Condition.Bool["aws:SecureTransport"]] | join(" ")' bucket-policy.json
        stdout_equals: "Deny * s3:* false"
        message: "Das Statement NurTls braucht Effect Deny, Principal \"*\", Action s3:* und die Bedingung Bool aws:SecureTransport \"false\"."
      - type: command
        run: jq -r '.Statement[] | select(.Sid == "NurTls") | [.Resource] | flatten | sort | join(" ")' bucket-policy.json
        stdout_equals: "arn:aws:s3:::example-docs-123456789012 arn:aws:s3:::example-docs-123456789012/*"
        message: NurTls muss für den Bucket selbst und für alle Objekte gelten – zwei ARNs, einmal ohne und einmal mit /*.
      - type: command
        run: jq -r '.Statement[] | select(.Sid == "AppLiest") | [.Effect, .Principal.AWS, ([.Action] | flatten | join(",")), ([.Resource] | flatten | join(","))] | join(" ")' bucket-policy.json
        stdout_equals: "Allow arn:aws:iam::123456789012:role/app s3:GetObject arn:aws:s3:::example-docs-123456789012/*"
        message: Das Statement AppLiest soll der Rolle arn:aws:iam::123456789012:role/app nur s3:GetObject auf arn:aws:s3:::example-docs-123456789012/* erlauben.
    hints:
      - "In JSON schreibst du Wahrheitswerte ohne Anführungszeichen: `\"BlockPublicAcls\": true`."
      - "Die Bedingung: `\"Condition\": { \"Bool\": { \"aws:SecureTransport\": \"false\" } }`."
      - "Prüfe beide Dateien mit `jq . datei.json`, bevor du die Checks laufen lässt."
    solution: |
      ```bash
      cd bucket-schutz
      cat > public-access-block.json <<'EOF'
      {
        "BlockPublicAcls": true,
        "IgnorePublicAcls": true,
        "BlockPublicPolicy": true,
        "RestrictPublicBuckets": true
      }
      EOF
      cat > bucket-policy.json <<'EOF'
      {
        "Version": "2012-10-17",
        "Statement": [
          {
            "Sid": "NurTls",
            "Effect": "Deny",
            "Principal": "*",
            "Action": "s3:*",
            "Resource": [
              "arn:aws:s3:::example-docs-123456789012",
              "arn:aws:s3:::example-docs-123456789012/*"
            ],
            "Condition": { "Bool": { "aws:SecureTransport": "false" } }
          },
          {
            "Sid": "AppLiest",
            "Effect": "Allow",
            "Principal": { "AWS": "arn:aws:iam::123456789012:role/app" },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::example-docs-123456789012/*"
          }
        ]
      }
      EOF
      jq . public-access-block.json bucket-policy.json
      ```
  - id: s3-cli
    type: simulated
    title: Hochladen und zeitlich begrenzt teilen
    description: |
      Lade einen Bericht in den privaten Bucket hoch und teile ihn eine Stunde lang mit einem Kunden.

      1. Hochladen: `aws s3 cp bericht.pdf s3://example-docs-123456789012/berichte/bericht.pdf`
      2. Prüfen: `aws s3 ls s3://example-docs-123456789012/berichte/`
      3. Link für eine Stunde: `aws s3 presign s3://example-docs-123456789012/berichte/bericht.pdf --expires-in 3600`
    prompt: "du@laptop:~$"
    steps:
      - expect: "^aws\\s+s3\\s+cp\\s+bericht\\.pdf\\s+s3://example-docs-123456789012/berichte/bericht\\.pdf$"
        output: "upload: ./bericht.pdf to s3://example-docs-123456789012/berichte/bericht.pdf"
        hint: "Tippe `aws s3 cp bericht.pdf s3://example-docs-123456789012/berichte/bericht.pdf`."
      - expect: "^aws\\s+s3\\s+ls\\s+s3://example-docs-123456789012/berichte/?$"
        output: "2026-10-10 11:42:17     184320 bericht.pdf"
        hint: "Tippe `aws s3 ls s3://example-docs-123456789012/berichte/`."
      - expect: "^aws\\s+s3\\s+presign\\s+s3://example-docs-123456789012/berichte/bericht\\.pdf\\s+--expires-in\\s+3600$"
        output: |
          https://example-docs-123456789012.s3.eu-central-1.amazonaws.com/berichte/bericht.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=<gekuerzt>&X-Amz-Date=20261010T114300Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=<gekuerzt>

          Wer diesen Link hat, kann die Datei eine Stunde lang herunterladen – behandle ihn wie ein Passwort.
        hint: "Nutze `aws s3 presign` mit dem s3://-Pfad und `--expires-in 3600`."
    responses:
      - match: "--acl\\s+public-read"
        output: "Stopp: Eine öffentliche ACL ist hier genau falsch – und Block Public Access würde sie ohnehin blockieren. Teile die Datei mit einer Presigned URL."
---

Ein Team speichert Kundenrechnungen in der Cloud. Ein Kollege möchte „schnell mal“ eine Datei teilen und
macht dafür den ganzen Speicher öffentlich. Ein paar Monate später findet ein Sicherheitsforscher die
Rechnungen über eine Suchmaschine. Solche Fälle gab es wirklich oft – und sie sind vermeidbar.

## Buckets und Objekte

[[s3|Amazon S3]] (*Simple Storage Service*) speichert Dateien als [[s3-objekt|Objekte]] in
[[bucket|Buckets]]:

| Begriff | Bedeutung | Beispiel |
|---|---|---|
| Bucket | Behälter für Objekte, gehört zu einer Region | `example-docs-123456789012` |
| Objekt | Inhalt plus Metadaten | eine PDF-Datei |
| Schlüssel (Key) | Der vollständige Name des Objekts | `berichte/2026/oktober.pdf` |

Bucket-Namen sind **weltweit eindeutig** – über alle Konten hinweg. Deshalb hängen viele Teams die
Konto-ID oder den Projektnamen an. Ordner gibt es in S3 eigentlich nicht: `berichte/2026/` ist nur ein
**Präfix** im Schlüssel, das die Konsole wie einen Ordner darstellt.

```bash title="Terminal"
aws s3 cp bericht.pdf s3://example-docs-123456789012/berichte/bericht.pdf
aws s3 ls s3://example-docs-123456789012/berichte/
aws s3 sync ./public s3://example-website-123456789012/
```

## Standardmäßig privat: Block Public Access

Neue Buckets und Objekte sind **nicht öffentlich**. Darüber wacht zusätzlich
[[block-public-access|Block Public Access]] mit vier Einstellungen, die bei neuen Buckets eingeschaltet sind:

| Einstellung | Wirkung |
|---|---|
| `BlockPublicAcls` | Lehnt das Setzen öffentlicher ACLs ab |
| `IgnorePublicAcls` | Ignoriert vorhandene öffentliche ACLs |
| `BlockPublicPolicy` | Lehnt Bucket-Policies ab, die öffentlichen Zugriff erlauben |
| `RestrictPublicBuckets` | Beschränkt Buckets mit öffentlicher Policy auf AWS-Dienste und das eigene Konto |

Die Einstellungen gibt es pro Bucket und für das ganze Konto. Es gilt immer die strengere.

> [!MERKSATZ]
> Lass Block Public Access auf Kontoebene eingeschaltet. Einen öffentlichen Bucket braucht man fast nie –
> für Websites gibt es ein CDN davor, für einzelne Dateien Presigned URLs.

## Bucket-Policies

Eine [[bucket-policy|Bucket-Policy]] ist eine ressourcenbasierte Policy am Bucket – deshalb mit `Principal`.
Ein bewährtes Muster verbietet alle Zugriffe ohne verschlüsselte Verbindung:

```json title="bucket-policy.json (Ausschnitt)"
{
  "Sid": "NurTls",
  "Effect": "Deny",
  "Principal": "*",
  "Action": "s3:*",
  "Resource": [
    "arn:aws:s3:::example-docs-123456789012",
    "arn:aws:s3:::example-docs-123456789012/*"
  ],
  "Condition": { "Bool": { "aws:SecureTransport": "false" } }
}
```

Seit 2023 verschlüsselt S3 außerdem jedes neue Objekt automatisch auf der Festplatte. Mit
[[s3-versionierung|Versionierung]] behält S3 zusätzlich alte Stände von Objekten – ein guter Schutz gegen
versehentliches Überschreiben oder Löschen.

> [!FEHLER]
> **`"Principal": "*"` mit Allow, um schnell etwas zu teilen.** Damit ist der Bucket öffentlich – sofern
> Block Public Access es nicht verhindert. Wer daraufhin Block Public Access abschaltet, öffnet die Tür
> für alle Objekte, nicht nur für die eine Datei.

## Presigned URLs: zeitlich begrenzt teilen

Eine [[presigned-url|Presigned URL]] ist ein Link, in dem eine Signatur mit deinen Zugangsdaten steckt.
Wer den Link hat, darf genau diese eine Aktion auf genau diesem Objekt ausführen – bis er abläuft.

```bash title="Terminal"
aws s3 presign s3://example-docs-123456789012/berichte/bericht.pdf --expires-in 3600
```

- Ohne `--expires-in` gilt der Link eine Stunde (3600 Sekunden).
- Mit CLI oder SDK sind bis zu **7 Tage** möglich, in der Konsole bis zu 12 Stunden.
- Der Link gilt nie länger als die Zugangsdaten, mit denen er erstellt wurde – bei Rollen oft nur Stunden.

> [!PRAXIS]
> Web-Apps nutzen Presigned URLs auch für **Uploads**: Der Server erzeugt eine URL für `PutObject`, der
> Browser lädt die Datei direkt nach S3. So läuft die große Datei nicht durch den App-Server, und der
> Bucket bleibt trotzdem privat.

## Zusammenfassung

- **S3** speichert **Objekte** unter einem **Schlüssel** in **Buckets**; Bucket-Namen sind weltweit eindeutig.
- „Ordner“ sind nur **Präfixe** im Schlüssel.
- **Block Public Access** schützt Buckets und Konto vor versehentlich öffentlichen Policies und ACLs.
- **Bucket-Policies** sind ressourcenbasiert; ein Deny für `aws:SecureTransport` `false` erzwingt TLS.
- **Presigned URLs** teilen einzelne Objekte zeitlich begrenzt – höchstens so lange wie die Zugangsdaten gelten.
