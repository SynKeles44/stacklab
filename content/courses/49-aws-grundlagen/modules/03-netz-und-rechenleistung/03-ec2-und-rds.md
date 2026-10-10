---
title: EC2 und RDS im Überblick
summary: Virtuelle Server mit EC2 – AMI, Instanztyp, EBS, Instanzprofil – und verwaltete Datenbanken mit RDS, Multi-AZ und automatischen Backups.
duration: 25
sources:
  - title: Amazon EC2 – What is Amazon EC2?
    url: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html
  - title: Amazon EC2 – IAM roles for Amazon EC2
    url: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html
  - title: AWS Systems Manager – Session Manager
    url: https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html
  - title: Amazon RDS – What is Amazon RDS?
    url: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Welcome.html
  - title: Amazon RDS – Multi-AZ deployments
    url: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html
quiz:
  - type: single
    question: Wie bekommt eine App auf einer EC2-Instanz am sichersten Zugriff auf S3?
    options:
      - Einen Access Key in die `.env`-Datei der App schreiben
      - Der Instanz über ein Instanzprofil eine IAM-Rolle geben – das SDK holt sich die temporären Zugangsdaten selbst
      - Den S3-Bucket öffentlich machen
    answer: 1
    explanation: Mit einem Instanzprofil liegen keine dauerhaften Schlüssel auf dem Server. Die Zugangsdaten rotieren automatisch.
  - type: multiple
    question: Was übernimmt AWS bei RDS für dich?
    options:
      - Installation und Updates der Datenbank-Software
      - Automatische Backups mit einstellbarer Aufbewahrung
      - Bei Multi-AZ das automatische Umschalten auf eine Standby-Instanz in einer anderen Zone
      - Das Schreiben deiner SQL-Abfragen und Indizes
    answers: [0, 1, 2]
    explanation: Betrieb, Backups und Failover übernimmt RDS. Schema, Abfragen und Indizes bleiben deine Aufgabe.
  - type: match
    question: Ordne jedem EC2-Baustein seine Bedeutung zu.
    pairs:
      - { left: "AMI", right: "Vorlage mit Betriebssystem und Software, aus der die Instanz startet" }
      - { left: "Instanztyp", right: "Größe: CPU, Arbeitsspeicher, Netzwerk" }
      - { left: "EBS-Volume", right: "Netzwerk-Festplatte der Instanz" }
      - { left: "User Data", right: "Skript, das beim ersten Start ausgeführt wird" }
    explanation: Aus diesen Bausteinen (plus Subnetz, Security Group und Rolle) setzt sich jede EC2-Instanz zusammen.
  - type: cloze
    text: "Eine angehaltene (stopped) EC2-Instanz kostet keine Rechenzeit mehr, ihr ___-Volume wird aber weiter berechnet."
    blanks:
      - [EBS]
    explanation: Der Speicher bleibt reserviert, damit die Instanz später mit denselben Daten wieder starten kann. Erst beim Beenden (terminate) wird er standardmäßig gelöscht.
tasks:
  - id: ec2-starten
    type: simulated
    title: Eine EC2-Instanz sicher starten
    description: |
      Starte eine kleine Instanz für einen internen Test – im privaten Subnetz, ohne SSH-Schlüssel, mit
      Instanzprofil und IMDSv2.

      1. Starte die Instanz:
         `aws ec2 run-instances --image-id ami-0example1234567890 --instance-type t4g.micro --subnet-id subnet-0app-a --security-group-ids sg-0app --iam-instance-profile Name=app-profile --metadata-options HttpTokens=required`
      2. Frage den Zustand ab:
         `aws ec2 describe-instances --instance-ids i-0123456789abcdef0 --query "Reservations[].Instances[].State.Name"`
    prompt: "du@laptop:~$"
    steps:
      - expect: "^aws\\s+ec2\\s+run-instances(?=.*--image-id\\s+ami-0example1234567890)(?=.*--instance-type\\s+t4g\\.micro)(?=.*--subnet-id\\s+subnet-0app-a)(?=.*--security-group-ids\\s+sg-0app)(?=.*--iam-instance-profile\\s+Name=app-profile)(?=.*--metadata-options\\s+HttpTokens=required).*$"
        output: |
          {
              "Instances": [
                  {
                      "InstanceId": "i-0123456789abcdef0",
                      "InstanceType": "t4g.micro",
                      "Placement": { "AvailabilityZone": "eu-central-1a" },
                      "PrivateIpAddress": "10.0.10.25",
                      "State": { "Name": "pending" },
                      "IamInstanceProfile": { "Arn": "arn:aws:iam::123456789012:instance-profile/app-profile" },
                      "MetadataOptions": { "HttpTokens": "required" }
                  }
              ]
          }

          Keine öffentliche IP, kein Key-Pair – Zugriff später über Session Manager.
        hint: "Alle sechs Optionen aus der Aufgabe werden gebraucht: --image-id, --instance-type, --subnet-id, --security-group-ids, --iam-instance-profile und --metadata-options."
      - expect: "^aws\\s+ec2\\s+describe-instances\\s+--instance-ids\\s+i-0123456789abcdef0\\s+--query\\s+[\"']?Reservations\\[\\]\\.Instances\\[\\]\\.State\\.Name[\"']?$"
        output: |
          [
              "running"
          ]
        hint: "Tippe den describe-instances-Befehl aus der Aufgabe – mit --query."
    responses:
      - match: "--key-name"
        output: "Hinweis: Für diese Instanz brauchst du kein SSH-Schlüsselpaar. Zugriff läuft über Session Manager und die Rolle im Instanzprofil."
      - match: "--associate-public-ip-address"
        output: "Stopp: Eine Instanz im privaten Subnetz braucht keine öffentliche IP-Adresse."
  - id: bausteine-zuordnen
    type: dragdrop
    title: EC2 oder RDS?
    description: Ordne jede Eigenschaft dem Dienst zu, zu dem sie gehört.
    targets:
      - { id: ec2, label: "EC2 (virtueller Server)" }
      - { id: rds, label: "RDS (verwaltete Datenbank)" }
    items:
      - { label: Du wählst ein AMI als Startvorlage, target: ec2 }
      - { label: Betriebssystem-Updates sind deine Aufgabe, target: ec2 }
      - { label: User-Data-Skript beim ersten Start, target: ec2 }
      - { label: "Automatische Backups bis zu 35 Tage, Wiederherstellung auf einen Zeitpunkt", target: rds }
      - { label: Multi-AZ mit synchroner Standby-Instanz, target: rds }
      - { label: DB-Subnetzgruppe über mindestens zwei Zonen, target: rds }
    hints:
      - Alles rund um das Betriebssystem gehört zu EC2.
      - Backups, Failover und Subnetzgruppen sind typische Datenbank-Funktionen.
---

Deine Laravel-App braucht zwei Dinge: einen Server, auf dem PHP läuft, und eine Datenbank. In AWS
bekommst du beides in wenigen Minuten. Der Unterschied liegt darin, wie viel du danach selbst betreiben
musst: Bei [[ec2|EC2]] bist du Admin eines Servers, bei [[rds|RDS]] nutzt du eine fertige Datenbank.

## EC2: Bausteine einer Instanz

Eine EC2-Instanz ist eine [[virtuelle-maschine|virtuelle Maschine]]. Beim Start legst du fest:

| Baustein | Bedeutung | Beispiel |
|---|---|---|
| [[ami\|AMI]] | Vorlage mit Betriebssystem und Software | Ubuntu 24.04, Amazon Linux 2023 |
| [[instanztyp\|Instanztyp]] | CPU, Arbeitsspeicher, Netzwerk | `t4g.micro`, `m7i.large` |
| [[ebs\|EBS-Volume]] | Festplatte, über das Netz angebunden | 20 GB `gp3` |
| Subnetz | In welcher Zone und welchem Netz | `subnet-0app-a` |
| Security Group | Firewall-Regeln | `sg-0app` |
| [[user-data\|User Data]] | Skript beim ersten Start | Pakete installieren |

Der Instanztyp verrät viel: `t` steht für günstige Typen mit Leistungsreserve für Spitzen, `m` für
Allzweck, `c` für viel CPU, `r` für viel Arbeitsspeicher. Ein `g` in `t4g` bedeutet ARM-Prozessoren
(Graviton), die oft günstiger sind.

## Zugriff ohne Schlüssel im Code

Zwei Fragen stellen sich bei jedem Server: Wie kommt die App an AWS-Rechte? Und wie kommst du auf den Server?

1. **Rechte für die App:** Ein [[instanzprofil|Instanzprofil]] hängt eine IAM-Rolle an die Instanz. Die
   AWS-SDKs holen sich die temporären Zugangsdaten automatisch über den
   [[cloud-metadaten-dienst|Metadaten-Dienst]]. Schalte dabei **IMDSv2** ein (`HttpTokens=required`) – es
   schützt vor dem Abgreifen der Zugangsdaten über SSRF-Lücken.
2. **Zugang für dich:** Statt Port 22 zu öffnen, nutzt du den [[ssm-session-manager|Session Manager]].
   Er öffnet eine Shell über die AWS-API – ohne offenen Port, ohne SSH-Schlüssel, mit Protokollierung.

> [!FEHLER]
> **Access Keys in der `.env` auf dem Server.** Die Instanz hat mit dem Instanzprofil bereits Zugangsdaten,
> die sich von selbst erneuern. Ein zusätzlicher Access Key ist nur ein weiteres Geheimnis, das gestohlen
> werden kann.

## Lebenszyklus und Kosten

```text
pending → running → stopping → stopped → (start) → running
                                    └──→ terminated (gelöscht)
```

- **running:** Rechenzeit wird sekundengenau abgerechnet (bei Linux mit Mindestdauer).
- **stopped:** keine Rechenzeit, aber das EBS-Volume kostet weiter.
- **terminated:** Instanz weg; das Root-Volume wird standardmäßig mitgelöscht.

Neben dem normalen Preis (*On-Demand*) gibt es Rabatte für feste Nutzungszusagen (Savings Plans) und
günstige, aber jederzeit kündbare Spot-Instanzen – Details in der
[EC2-Preisübersicht](https://aws.amazon.com/ec2/pricing/).

## RDS: die verwaltete Datenbank

RDS betreibt relationale Datenbanken wie [[postgresql|PostgreSQL]], MySQL oder MariaDB für dich. Du
bekommst einen Endpunkt (Hostnamen) und verbindest dich wie mit jeder anderen Datenbank.

| Funktion | Was sie bringt |
|---|---|
| Automatische Backups | Tägliche Sicherung plus Transaktionslogs, Aufbewahrung 1–35 Tage, Wiederherstellung auf eine Sekunde genau |
| [[multi-az\|Multi-AZ]] | Synchrone Standby-Kopie in einer anderen Zone; fällt die Hauptinstanz aus, schaltet RDS automatisch um |
| [[lesereplikat\|Lesereplikate]] | Zusätzliche Kopien nur zum Lesen, um die Hauptinstanz zu entlasten |
| Wartungsfenster | Updates laufen zu einer Zeit, die du festlegst |

Eine RDS-Datenbank gehört in **private Subnetze**: Du gibst ihr eine DB-Subnetzgruppe mit Subnetzen in
mindestens zwei Zonen. Die Security Group erlaubt Port 5432 (PostgreSQL) nur von der Security Group der
App-Server.

> [!MERKSATZ]
> EC2 gibt dir einen Server, den du selbst pflegst. RDS gibt dir eine Datenbank, die AWS pflegt – das
> Schema, die Daten und die Zugriffsrechte bleiben trotzdem deine.

> [!PRAXIS]
> Das Master-Passwort einer RDS-Datenbank kann RDS direkt im [[secrets-manager|Secrets Manager]] verwalten
> und rotieren. Die App liest es zur Laufzeit von dort – so steht es in keinem Repository und keiner
> Konfigurationsdatei.

## Zusammenfassung

- Eine **EC2-Instanz** entsteht aus AMI, Instanztyp, EBS-Volume, Subnetz, Security Group und optional User Data.
- Rechte bekommt die App über ein **Instanzprofil** mit IAM-Rolle – nie über Access Keys auf dem Server.
- **IMDSv2** schützt die temporären Zugangsdaten; der **Session Manager** ersetzt offene SSH-Ports.
- Angehaltene Instanzen kosten keine Rechenzeit, ihre **EBS-Volumes** aber schon.
- **RDS** übernimmt Betrieb, Updates, Backups und mit **Multi-AZ** das Failover – in privaten Subnetzen.
