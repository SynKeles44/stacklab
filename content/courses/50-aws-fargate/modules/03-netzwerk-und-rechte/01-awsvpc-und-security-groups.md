---
title: Netzwerk mit awsvpc und Security Groups
summary: Jeder Task bekommt seine eigene Netzwerkschnittstelle – wie du Subnetze wählst und den Verkehr mit Security Groups absicherst.
duration: 22
sources:
  - title: Amazon ECS task networking options for Fargate
    url: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-task-networking.html
  - title: Control traffic to your AWS resources using security groups
    url: https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html
  - title: Amazon ECR interface VPC endpoints (AWS PrivateLink)
    url: https://docs.aws.amazon.com/AmazonECR/latest/userguide/vpc-endpoints.html
quiz:
  - type: single
    question: Was bedeutet der Netzwerkmodus awsvpc für einen Fargate-Task?
    options:
      - Alle Tasks teilen sich die IP-Adresse eines Hosts.
      - Jeder Task bekommt eine eigene Netzwerkschnittstelle mit eigener privater IP im gewählten Subnetz.
      - Der Task ist automatisch aus dem Internet erreichbar.
      - Der Task hat kein Netzwerk.
    answer: 1
    explanation: Bei awsvpc verhält sich jeder Task im Netzwerk wie ein eigener kleiner Server mit eigener Security Group.
  - type: single
    question: Ein Task in einem privaten Subnetz ohne NAT-Gateway und ohne VPC-Endpunkte startet nicht. Warum?
    options:
      - Private Subnetze sind für Fargate verboten.
      - Er kann das Image aus ECR nicht herunterladen, weil er keinen Weg zu den AWS-Diensten hat.
      - Er braucht eine Elastic IP.
      - Die Security Group blockiert ausgehenden Verkehr standardmäßig.
    answer: 1
    explanation: Zum Image-Pull, für Secrets und Logs muss der Task AWS-Dienste erreichen – über ein NAT-Gateway oder über VPC-Endpunkte.
  - type: multiple
    question: Welche Regeln passen zum Prinzip der geringsten Rechte?
    options:
      - "App-Tasks: Port 8080 nur von der Security Group des Load Balancers"
      - "App-Tasks: Port 8080 von 0.0.0.0/0"
      - "Datenbank: Port 5432 nur von der Security Group der App-Tasks"
      - "Load Balancer: Port 443 von 0.0.0.0/0"
    answers: [0, 2, 3]
    explanation: Nur der Load Balancer ist öffentlich. Alles dahinter erlaubt Verkehr ausschließlich von der Schicht davor – über Security-Group-Verweise statt IP-Bereiche.
  - type: cloze
    text: Statt eines IP-Bereichs kann eine Regel als Quelle eine andere ___ angeben. Dann darf jede Ressource mit dieser Gruppe zugreifen, egal welche ___ sie gerade hat.
    blanks:
      - [Security Group, Sicherheitsgruppe, SG]
      - [IP, IP-Adresse, IP-Adressen]
    explanation: Fargate-Tasks bekommen bei jedem Start neue IPs. Verweise auf Security Groups bleiben trotzdem gültig.
tasks:
  - id: sg-regeln
    type: dragdrop
    title: Welche Regel gehört zu welcher Security Group?
    description: Ordne jede eingehende Regel der Security Group zu, zu der sie gehört. Aufbau Internet → Load Balancer → App-Tasks → Datenbank.
    targets:
      - { id: alb, label: sg-alb (Load Balancer) }
      - { id: app, label: sg-app (Fargate-Tasks) }
      - { id: db, label: sg-db (Datenbank) }
    items:
      - { label: "TCP 443 von 0.0.0.0/0", target: alb }
      - { label: "TCP 80 von 0.0.0.0/0 (Weiterleitung auf HTTPS)", target: alb }
      - { label: "TCP 8080 von sg-alb", target: app }
      - { label: "TCP 5432 von sg-app", target: db }
      - { label: "TCP 6379 von sg-app", target: db }
  - id: sg-anlegen
    type: simulated
    title: Security Group für die Tasks anlegen
    description: |
      Lege für die App-Tasks im VPC `vpc-0a1b2c3d4e5f60718` eine Security Group an und erlaube Port 8080 nur von
      der Load-Balancer-Gruppe `sg-0alb1111aaaa2222`.

      1. `aws ec2 create-security-group --group-name shop-app --description "Fargate tasks" --vpc-id vpc-0a1b2c3d4e5f60718`
      2. Eingehende Regel: `aws ec2 authorize-security-group-ingress --group-id <neue-id> --protocol tcp --port 8080 --source-group sg-0alb1111aaaa2222`
    prompt: "du@laptop:~$"
    steps:
      - expect: "^aws\\s+ec2\\s+create-security-group\\s+(?=.*--group-name\\s+shop-app\\b)(?=.*--vpc-id\\s+vpc-0a1b2c3d4e5f60718\\b).*$"
        output: |
          {
              "GroupId": "sg-0app3333bbbb4444"
          }
        hint: aws ec2 create-security-group --group-name shop-app --description "Fargate tasks" --vpc-id vpc-0a1b2c3d4e5f60718
      - expect: "^aws\\s+ec2\\s+authorize-security-group-ingress\\s+(?=.*--group-id\\s+sg-0app3333bbbb4444\\b)(?=.*--protocol\\s+tcp\\b)(?=.*--port\\s+8080\\b)(?=.*--source-group\\s+sg-0alb1111aaaa2222\\b).*$"
        output: |
          {
              "Return": true,
              "SecurityGroupRules": [
                  {
                      "GroupId": "sg-0app3333bbbb4444",
                      "IpProtocol": "tcp",
                      "FromPort": 8080,
                      "ToPort": 8080,
                      "ReferencedGroupInfo": { "GroupId": "sg-0alb1111aaaa2222" }
                  }
              ]
          }
        hint: aws ec2 authorize-security-group-ingress --group-id sg-0app3333bbbb4444 --protocol tcp --port 8080 --source-group sg-0alb1111aaaa2222
    responses:
      - match: ".*--cidr\\s+0\\.0\\.0\\.0/0.*"
        output: "Lieber nicht: Damit wären die Tasks für das ganze Internet offen. Nutze --source-group mit der Load-Balancer-Gruppe."
---
Im Docker-Kurs hingen deine Container an einem gemeinsamen Bridge-Netzwerk auf deinem Rechner. In der Cloud
laufen Tasks verteilt auf unbekannten Maschinen – und trotzdem sollen sie in **deinem** Netz stehen, mit deinen
Regeln. Dafür gibt es bei Fargate genau einen Netzwerkmodus.

![Netzwerk einer Fargate-Anwendung mit Load Balancer, privaten Subnetzen und Security Groups](/assets/aws-fargate/netzwerk.svg)

## awsvpc: jeder Task ein eigener Netzwerkteilnehmer

Im Modus [[awsvpc]] bekommt jeder Task eine eigene [[eni|Elastic Network Interface]] (ENI) – eine virtuelle
Netzwerkkarte mit eigener [[private-ip-adresse|privater IP]] im [[subnetz|Subnetz]], das du wählst.

Das hat drei Folgen:

- Jeder Task hat eine **eigene IP**, Port-Konflikte zwischen Tasks gibt es nicht.
- Jeder Task bekommt eine eigene [[security-group|Security Group]].
- Container **im selben Task** teilen sich die ENI und sprechen sich über `localhost` an.

```json title="Netzwerk beim Starten eines Tasks oder Services"
"networkConfiguration": {
  "awsvpcConfiguration": {
    "subnets": ["subnet-0aaa1111", "subnet-0bbb2222"],
    "securityGroups": ["sg-0app3333bbbb4444"],
    "assignPublicIp": "DISABLED"
  }
}
```

Gib Subnetze in mindestens zwei [[availability-zone|Availability Zones]] an. Fällt eine Zone aus, startet
der Service die Tasks in der anderen.

## Öffentlich oder privat?

| Variante | Wie | Bewertung |
|---|---|---|
| Öffentliches Subnetz, `assignPublicIp: ENABLED` | Task hat öffentliche IP | einfach, aber Tasks sind direkt erreichbar |
| Privates Subnetz, `assignPublicIp: DISABLED` | nur der Load Balancer ist öffentlich | Standard für Produktion |

Ein Task im privaten Subnetz muss trotzdem nach außen telefonieren: Image aus [[amazon-ecr|ECR]] holen, Secrets
lesen, Logs schreiben. Zwei Wege:

1. Ein [[nat-gateway|NAT-Gateway]] im öffentlichen Subnetz leitet ausgehenden Verkehr weiter.
2. [[vpc-endpunkt|VPC-Endpunkte]] für ECR, S3, Secrets Manager und CloudWatch Logs verbinden die Dienste direkt
   mit deinem VPC – ohne Umweg über das Internet.

> [!FEHLER]
> **Privates Subnetz ohne NAT-Gateway und ohne Endpunkte.** Der Task bleibt in `PENDING` hängen und bricht mit
> „CannotPullContainerError … i/o timeout“ ab. Das Image ist da – der Weg dorthin fehlt.

## Security Groups in Schichten

Eine Security Group ist eine [[stateful-firewall|zustandsbehaftete Firewall]] direkt an der ENI. Sie erlaubt
eingehenden Verkehr nur, wenn eine Regel passt. Antworten auf erlaubte Anfragen kommen automatisch durch.

Der Trick für Fargate: Als Quelle einer Regel kann statt eines IP-Bereichs eine **andere Security Group**
stehen.

| Security Group | eingehend erlaubt |
|---|---|
| `sg-alb` | 443 und 80 von `0.0.0.0/0` |
| `sg-app` | 8080 nur von `sg-alb` |
| `sg-db` | 5432 nur von `sg-app` |

Tasks bekommen bei jedem Start neue IPs – die Regel „von `sg-app`“ gilt trotzdem für jeden neuen Task.

> [!MERKSATZ]
> **Nur der Load Balancer ist öffentlich. Jede Schicht dahinter vertraut nur der Schicht davor** – über
> Security-Group-Verweise, nie über `0.0.0.0/0`.

## Typische Netzwerkfehler

| Symptom | häufige Ursache |
|---|---|
| `CannotPullContainerError` | kein NAT-Gateway / keine Endpunkte, oder öffentliches Subnetz ohne öffentliche IP |
| Load Balancer meldet Ziele „unhealthy“ | `sg-app` erlaubt den Port nicht von `sg-alb` |
| Laravel: „Connection timed out“ zur DB | `sg-db` erlaubt 5432 nicht von `sg-app` |
| Kein Platz für neue Tasks | Subnetz hat keine freien IP-Adressen mehr |

> [!PRAXIS]
> Ein NAT-Gateway kostet pro Stunde und pro übertragenem Gigabyte – bei vielen Image-Pulls summiert sich das.
> Ein ECR- und ein S3-Endpunkt (Image-Schichten liegen in S3) senken diese Kosten oft deutlich. Plane die
> Subnetze großzügig: Ein /24-Subnetz hat nur rund 250 nutzbare Adressen, und jeder Task belegt eine.

## Zusammenfassung

- Fargate nutzt immer **awsvpc**: eigene ENI, eigene private IP, eigene Security Group pro Task.
- Container im selben Task sprechen sich über `localhost` an.
- Produktion: Tasks in **privaten Subnetzen** in mindestens zwei Availability Zones, nur der Load Balancer ist öffentlich.
- Für ECR, Secrets und Logs braucht der Task ein **NAT-Gateway** oder **VPC-Endpunkte**.
- Security Groups verweisen aufeinander: `sg-app` erlaubt nur `sg-alb`, `sg-db` erlaubt nur `sg-app`.
