---
title: Eine VPC aufbauen
summary: Wie du eine VPC mit öffentlichen und privaten Subnetzen über zwei Verfügbarkeitszonen planst – mit Routing-Tabellen, Internet-Gateway und NAT-Gateway.
duration: 25
sources:
  - title: Amazon VPC – How Amazon VPC works
    url: https://docs.aws.amazon.com/vpc/latest/userguide/how-it-works.html
  - title: Amazon VPC – Subnet CIDR blocks
    url: https://docs.aws.amazon.com/vpc/latest/userguide/subnet-sizing.html
  - title: Amazon VPC – Configure route tables
    url: https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Route_Tables.html
  - title: Amazon VPC – NAT gateways
    url: https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html
quiz:
  - type: single
    question: Was macht ein Subnetz in AWS zu einem öffentlichen Subnetz?
    options:
      - Seine Routing-Tabelle hat eine Route 0.0.0.0/0 zu einem Internet-Gateway.
      - Es hat eine Security Group mit Port 443.
      - Es liegt in der ersten Verfügbarkeitszone der Region.
    answer: 0
    explanation: „Öffentlich“ ist eine Frage des Routings. Ohne Route zum Internet-Gateway ist ein Subnetz privat.
  - type: single
    question: Wie viele Adressen kannst du in einem Subnetz `10.0.1.0/24` an Ressourcen vergeben?
    options: ["256", "254", "251", "250"]
    answer: 2
    explanation: Ein /24 hat 256 Adressen. AWS reserviert in jedem Subnetz fünf davon – die ersten vier und die letzte –, also bleiben 251.
  - type: match
    question: Ordne jedem Baustein seine Aufgabe zu.
    pairs:
      - { left: "Internet-Gateway", right: "Verbindet die VPC in beide Richtungen mit dem Internet" }
      - { left: "NAT-Gateway", right: "Gibt privaten Subnetzen nur ausgehenden Internetzugang" }
      - { left: "Routing-Tabelle", right: "Legt fest, wohin Pakete aus einem Subnetz geschickt werden" }
      - { left: "Route mit Ziel local", right: "Verbindet alle Subnetze innerhalb der VPC" }
    explanation: Zusammen bestimmen diese Bausteine, welche Wege es überhaupt gibt. Security Groups regeln danach, was davon erlaubt ist.
  - type: multiple
    question: Ihr wollt, dass die App-Server auch beim Ausfall einer ganzen Verfügbarkeitszone Pakete aus dem Internet laden können. Was braucht ihr?
    options:
      - Private App-Subnetze in mindestens zwei Zonen
      - Ein NAT-Gateway pro Zone, jeweils in einem öffentlichen Subnetz
      - Öffentliche IP-Adressen für alle App-Server
      - Eine Routing-Tabelle pro Zone für die privaten Subnetze, die auf das NAT-Gateway derselben Zone zeigt
    answers: [0, 1, 3]
    explanation: Ein NAT-Gateway gehört zu genau einer Zone. Für echte Ausfallsicherheit braucht jede Zone ihr eigenes – und die privaten Subnetze zeigen auf das Gateway ihrer Zone.
tasks:
  - id: vpc-beschriften
    type: diagram
    title: Beschrifte die VPC
    description: Ordne die Bausteine einer typischen VPC über zwei Verfügbarkeitszonen den richtigen Stellen zu.
    image: /assets/aws-grundlagen/vpc-leer.svg
    slots:
      - { x: 37.5, y: 11, answer: Internet-Gateway }
      - { x: 20.6, y: 35, answer: Öffentliches Subnetz }
      - { x: 20.6, y: 49, answer: NAT-Gateway }
      - { x: 20.6, y: 65, answer: Privates Subnetz }
      - { x: 86.6, y: 39, answer: Routing-Tabelle }
    distractors: [Security Group, S3-Bucket]
    hints:
      - Das Internet-Gateway hängt an der VPC, nicht an einem einzelnen Subnetz.
      - Das NAT-Gateway steht im öffentlichen Subnetz, die App-Server im privaten.
  - id: vpc-auswerten
    type: terminal
    title: Öffentliche Subnetze und freie Adressen ermitteln
    description: |
      Im Ordner `vpc-analyse` liegt `vpc.json` – eine vereinfachte Beschreibung einer VPC mit Subnetzen und
      Routing-Tabellen, wie sie die AWS CLI liefern würde.

      1. Finde alle Subnetze, deren Routing-Tabelle eine Route zu einem Internet-Gateway hat (die
         `GatewayId` beginnt mit `igw-`). Schreibe ihre IDs sortiert, eine pro Zeile, in `oeffentlich.txt`.
      2. Berechne für jedes Subnetz (in der Reihenfolge der Datei), wie viele Adressen du vergeben kannst:
         2^(32 − Präfix) − 5. Schreibe pro Subnetz eine Zeile `<subnet-id> <anzahl>` in `nutzbar.txt`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: vpc-analyse
    setup: |
      cat > vpc.json <<'EOF'
      {
        "Vpc": { "VpcId": "vpc-0example", "CidrBlock": "10.0.0.0/16" },
        "Subnets": [
          { "SubnetId": "subnet-0pub-a", "CidrBlock": "10.0.0.0/24", "AvailabilityZone": "eu-central-1a" },
          { "SubnetId": "subnet-0pub-b", "CidrBlock": "10.0.1.0/24", "AvailabilityZone": "eu-central-1b" },
          { "SubnetId": "subnet-0app-a", "CidrBlock": "10.0.10.0/23", "AvailabilityZone": "eu-central-1a" },
          { "SubnetId": "subnet-0app-b", "CidrBlock": "10.0.12.0/23", "AvailabilityZone": "eu-central-1b" },
          { "SubnetId": "subnet-0db-a", "CidrBlock": "10.0.20.0/26", "AvailabilityZone": "eu-central-1a" }
        ],
        "RouteTables": [
          {
            "RouteTableId": "rtb-0public",
            "Associations": ["subnet-0pub-b", "subnet-0pub-a"],
            "Routes": [
              { "DestinationCidrBlock": "10.0.0.0/16", "GatewayId": "local" },
              { "DestinationCidrBlock": "0.0.0.0/0", "GatewayId": "igw-0example" }
            ]
          },
          {
            "RouteTableId": "rtb-0private-a",
            "Associations": ["subnet-0app-a", "subnet-0db-a"],
            "Routes": [
              { "DestinationCidrBlock": "10.0.0.0/16", "GatewayId": "local" },
              { "DestinationCidrBlock": "0.0.0.0/0", "NatGatewayId": "nat-0zone-a" }
            ]
          },
          {
            "RouteTableId": "rtb-0private-b",
            "Associations": ["subnet-0app-b"],
            "Routes": [
              { "DestinationCidrBlock": "10.0.0.0/16", "GatewayId": "local" },
              { "DestinationCidrBlock": "0.0.0.0/0", "NatGatewayId": "nat-0zone-b" }
            ]
          }
        ]
      }
      EOF
    checks:
      - type: command
        run: cat oeffentlich.txt | tr '\n' ' '
        stdout_matches: "^subnet-0pub-a subnet-0pub-b ?$"
        message: oeffentlich.txt soll genau die zwei Subnetze enthalten, deren Routing-Tabelle zum Internet-Gateway führt – sortiert, eins pro Zeile.
      - type: command
        run: cat nutzbar.txt | tr '\n' ';'
        stdout_matches: "^subnet-0pub-a 251;subnet-0pub-b 251;subnet-0app-a 507;subnet-0app-b 507;subnet-0db-a 59;?$"
        message: "nutzbar.txt stimmt noch nicht. Erwartet je Zeile `<subnet-id> <anzahl>`, z. B. `subnet-0pub-a 251` – ein /23 hat 512 Adressen, ein /26 hat 64, jeweils minus 5."
    hints:
      - "Öffentliche Routing-Tabellen: `.RouteTables[] | select(any(.Routes[]; (.GatewayId // \"\") | startswith(\"igw-\")))`."
      - "Danach `.Associations[]` ausgeben und mit `sort` sortieren."
      - "Präfix als Zahl: `.CidrBlock | split(\"/\")[1] | tonumber`; Potenz mit `pow(2; 32 - $p)`."
    solution: |
      ```bash
      cd vpc-analyse
      jq -r '.RouteTables[] | select(any(.Routes[]; (.GatewayId // "") | startswith("igw-"))) | .Associations[]' vpc.json | sort > oeffentlich.txt
      jq -r '.Subnets[] | (.CidrBlock | split("/")[1] | tonumber) as $p | "\(.SubnetId) \(pow(2; 32 - $p) - 5)"' vpc.json > nutzbar.txt
      cat oeffentlich.txt nutzbar.txt
      ```
---

Eure Datenbank soll niemals direkt aus dem Internet erreichbar sein, der Load Balancer aber schon. Die
App-Server dazwischen müssen trotzdem Updates und Pakete laden können. In AWS löst du das mit einer
[[vpc|VPC]] – deinem eigenen, privaten Netz in der Cloud. Die Grundlagen zu Subnetzen und
[[cidr|CIDR]] kennst du aus den Netzwerk-Grundlagen; hier geht es um die AWS-Bausteine.

## Die VPC und ihr Adressbereich

Eine VPC gehört zu einer Region und bekommt einen privaten Adressbereich in CIDR-Schreibweise. Erlaubt
sind Größen von `/16` (65.536 Adressen) bis `/28` (16 Adressen). Üblich ist ein `/16` aus einem privaten
Bereich, etwa `10.0.0.0/16`.

> [!FEHLER]
> **Überlappende Adressbereiche.** Wer heute für jede VPC `10.0.0.0/16` nimmt, kann sie später nicht per
> VPN oder Peering mit dem Büro oder anderen VPCs verbinden. Plane pro VPC einen eigenen Bereich, zum
> Beispiel `10.0.0.0/16` für Produktion und `10.1.0.0/16` für Staging.

Jedes neue Konto hat in jeder Region eine **Default-VPC** mit nur öffentlichen Subnetzen. Sie ist zum
Ausprobieren gedacht – für echte Anwendungen legst du eine eigene VPC an.

## Subnetze und reservierte Adressen

Ein [[subnetz|Subnetz]] liegt immer in **genau einer** Verfügbarkeitszone. Für Ausfallsicherheit legst du
deshalb jede Schicht doppelt an:

| Subnetz | CIDR | Zone | Zweck |
|---|---|---|---|
| public-a | `10.0.0.0/24` | eu-central-1a | Load Balancer, NAT-Gateway |
| public-b | `10.0.1.0/24` | eu-central-1b | Load Balancer, NAT-Gateway |
| app-a | `10.0.10.0/23` | eu-central-1a | App-Server |
| app-b | `10.0.12.0/23` | eu-central-1b | App-Server |

AWS reserviert in jedem Subnetz **fünf** Adressen: die Netzadresse, `.1` für den VPC-Router, `.2` für den
DNS-Server, `.3` für spätere Zwecke und die letzte Adresse. Ein `/24` hat also 256 − 5 = **251** nutzbare
Adressen.

## Routing-Tabellen

Jedes Subnetz ist mit einer [[routing-tabelle|Routing-Tabelle]] verbunden. Sie bestimmt, wohin Pakete
gehen. Jede Tabelle enthält automatisch die Route `local`, über die alle Subnetze der VPC einander erreichen.

```text title="Routing-Tabelle der öffentlichen Subnetze"
Ziel            Weiterleitung
10.0.0.0/16     local
0.0.0.0/0       igw-0example        ← Internet-Gateway
```

```text title="Routing-Tabelle des privaten Subnetzes in Zone a"
Ziel            Weiterleitung
10.0.0.0/16     local
0.0.0.0/0       nat-0zone-a         ← NAT-Gateway in public-a
```

> [!MERKSATZ]
> Ein Subnetz ist **öffentlich**, wenn seine Routing-Tabelle `0.0.0.0/0` an ein Internet-Gateway schickt.
> Sonst ist es **privat**. Den Unterschied macht allein das Routing.

## Internet-Gateway und NAT-Gateway

![Eine VPC über zwei Verfügbarkeitszonen mit öffentlichen und privaten Subnetzen](/assets/aws-grundlagen/vpc.svg)

- Das [[internet-gateway|Internet-Gateway]] verbindet die VPC mit dem Internet – in beide Richtungen.
  Eine Ressource im öffentlichen Subnetz braucht zusätzlich eine öffentliche IP-Adresse.
- Das [[nat-gateway|NAT-Gateway]] steht in einem öffentlichen Subnetz und lässt Ressourcen aus privaten
  Subnetzen **nur ausgehend** ins Internet. Von außen kann niemand eine Verbindung zu ihnen aufbauen.

Ein NAT-Gateway gehört zu einer Zone. Fällt die Zone aus, ist es weg – deshalb gibt es in ausfallsicheren
Setups eines pro Zone.

> [!PRAXIS]
> NAT-Gateways kosten pro Stunde **und** pro verarbeitetem Gigabyte. In kleinen Projekten sind sie oft
> der größte Posten auf der Rechnung. Für Zugriffe auf S3 oder andere AWS-Dienste aus privaten Subnetzen
> lohnen sich deshalb VPC-Endpunkte, die den Weg über das NAT-Gateway sparen.

## Zusammenfassung

- Eine **VPC** ist dein privates Netz in einer Region, typischerweise ein `/16`.
- Jedes **Subnetz** liegt in genau einer Zone; AWS reserviert darin **fünf** Adressen.
- Die **Routing-Tabelle** entscheidet: Route zum **Internet-Gateway** = öffentlich, sonst privat.
- Ein **NAT-Gateway** im öffentlichen Subnetz gibt privaten Subnetzen ausgehenden Internetzugang.
- Für Ausfallsicherheit: jede Schicht und jedes NAT-Gateway in **mindestens zwei Zonen**.
