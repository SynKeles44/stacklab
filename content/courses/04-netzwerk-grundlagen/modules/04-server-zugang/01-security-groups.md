---
title: Security Groups in der Cloud
summary: Wie Security Groups in AWS den Netzwerkzugriff auf Server, Datenbanken und Load Balancer regeln – stateful, nur mit Erlaubnis-Regeln und mit Verweisen auf andere Gruppen.
duration: 25
sources:
  - title: AWS VPC – Control traffic to your AWS resources using security groups
    url: https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html
  - title: AWS CLI – authorize-security-group-ingress
    url: https://docs.aws.amazon.com/cli/latest/reference/ec2/authorize-security-group-ingress.html
  - title: AWS VPC – Subnets for your VPC
    url: https://docs.aws.amazon.com/vpc/latest/userguide/configure-subnets.html
quiz:
  - type: multiple
    question: Welche Aussagen über AWS Security Groups stimmen?
    options:
      - Sie sind stateful – Antworten auf erlaubte Verbindungen kommen automatisch zurück.
      - Sie kennen nur Erlaubnis-Regeln, keine Verbots-Regeln.
      - Eine neue Security Group erlaubt standardmäßig allen eingehenden Verkehr.
      - Als Quelle kann man eine andere Security Group angeben.
    answers: [0, 1, 3]
    explanation: Eine neue Security Group erlaubt eingehend nichts und ausgehend alles. Erlaubt ist nur, was eine Regel ausdrücklich zulässt.
  - type: single
    question: Wie erlaubst du am saubersten, dass nur die App-Server die Datenbank auf Port 5432 erreichen?
    options:
      - "Eingehende Regel 5432/tcp von 0.0.0.0/0"
      - Eingehende Regel 5432/tcp mit der Security Group der App-Server als Quelle
      - Eine Verbots-Regel für alle anderen Adressen
    answer: 1
    explanation: Mit der Security Group als Quelle gilt die Regel automatisch für alle App-Server – auch für neue, deren Adressen du noch nicht kennst.
  - type: cloze
    text: "Eine Quelle `203.0.113.25/___` meint genau eine einzige Adresse."
    blanks:
      - ["32"]
    explanation: /32 heißt – alle 32 Bit sind Netzanteil, also genau eine Adresse.
  - type: single
    question: Was unterscheidet ein öffentliches von einem privaten Subnetz in einer VPC?
    options:
      - Öffentliche Subnetze haben eine Route zu einem Internet Gateway, private nicht.
      - Öffentliche Subnetze nutzen IPv6, private IPv4.
      - Private Subnetze haben keine Security Groups.
    answer: 0
    explanation: „Öffentlich“ ist eine Frage der Routing-Tabelle. Private Subnetze erreichen das Internet höchstens ausgehend über ein NAT-Gateway.
tasks:
  - id: sg-regeln-planen
    type: dragdrop
    title: Welche Regel gehört in welche Security Group?
    description: |
      Eine Web-Anwendung besteht aus drei Schichten. Jede Schicht hat eine eigene Security Group:
      `sg-alb` (Load Balancer), `sg-app` (App-Server) und `sg-db` (Datenbank). Admins kommen über einen
      Bastion-Host mit `sg-bastion`. Ordne jede eingehende Regel der richtigen Gruppe zu.
    targets:
      - { id: alb, label: "sg-alb (Load Balancer)" }
      - { id: app, label: "sg-app (App-Server)" }
      - { id: db, label: "sg-db (Datenbank)" }
      - { id: bastion, label: "sg-bastion (Bastion-Host)" }
    items:
      - { label: "443/tcp von 0.0.0.0/0", target: alb }
      - { label: "80/tcp von 0.0.0.0/0 (Weiterleitung auf HTTPS)", target: alb }
      - { label: "8080/tcp von sg-alb", target: app }
      - { label: "22/tcp von sg-bastion", target: app }
      - { label: "5432/tcp von sg-app", target: db }
      - { label: "22/tcp von 198.51.100.0/24 (Büronetz)", target: bastion }
    hints:
      - Nur der Load Balancer ist für die ganze Welt erreichbar.
      - Jede Schicht erlaubt nur Verkehr von der Schicht direkt davor.
  - id: sg-cli
    type: simulated
    title: Eine Regel per AWS CLI anlegen
    description: |
      Die Datenbank-Security-Group `sg-0db0db0db0db0db00` soll Verbindungen auf Port 5432 nur von der
      App-Security-Group `sg-0aaa1111bbbb22223` annehmen.

      1. Schau dir die aktuellen Regeln an:
         `aws ec2 describe-security-groups --group-ids sg-0db0db0db0db0db00`
      2. Lege die Regel an:
         `aws ec2 authorize-security-group-ingress --group-id sg-0db0db0db0db0db00 --protocol tcp --port 5432 --source-group sg-0aaa1111bbbb22223`
    prompt: "du@laptop:~$"
    steps:
      - expect: "^aws\\s+ec2\\s+describe-security-groups\\s+--group-ids\\s+sg-0db0db0db0db0db00$"
        output: |
          {
              "SecurityGroups": [
                  {
                      "GroupId": "sg-0db0db0db0db0db00",
                      "GroupName": "db",
                      "OwnerId": "123456789012",
                      "VpcId": "vpc-0123456789abcdef0",
                      "IpPermissions": [],
                      "IpPermissionsEgress": [
                          { "IpProtocol": "-1", "IpRanges": [ { "CidrIp": "0.0.0.0/0" } ] }
                      ]
                  }
              ]
          }

          Noch keine eingehenden Regeln (IpPermissions ist leer) – niemand erreicht die Datenbank.
        hint: Tippe den describe-security-groups-Befehl aus der Aufgabe.
      - expect: "^aws\\s+ec2\\s+authorize-security-group-ingress(?=.*--group-id\\s+sg-0db0db0db0db0db00)(?=.*--protocol\\s+tcp)(?=.*--port\\s+5432)(?=.*--source-group\\s+sg-0aaa1111bbbb22223).*$"
        output: |
          {
              "Return": true,
              "SecurityGroupRules": [
                  {
                      "SecurityGroupRuleId": "sgr-0123456789abcdef0",
                      "GroupId": "sg-0db0db0db0db0db00",
                      "IsEgress": false,
                      "IpProtocol": "tcp",
                      "FromPort": 5432,
                      "ToPort": 5432,
                      "ReferencedGroupInfo": { "GroupId": "sg-0aaa1111bbbb22223" }
                  }
              ]
          }
        hint: "Nutze --group-id, --protocol tcp, --port 5432 und --source-group."
    responses:
      - match: "--cidr\\s+0\\.0\\.0\\.0/0"
        output: "Stopp: Damit wäre die Datenbank für das ganze Internet offen. Nutze --source-group sg-0aaa1111bbbb22223."
---

Auf einem eigenen Server richtest du die Firewall mit `ufw` ein. In der Cloud gibt es dafür eine eigene,
vorgeschaltete Schicht: die [[security-group|Security Group]]. Bei AWS ist sie Pflicht – jeder Server,
jede Datenbank und jeder [[load-balancer|Load Balancer]] hängt an mindestens einer. Wer Cloud-Projekte betreut, liest und
schreibt diese Regeln ständig.

## Was eine Security Group ist

Eine Security Group ist eine **virtuelle Firewall um eine einzelne Ressource** herum – genauer: um ihre
Netzwerkschnittstelle. Sie besteht aus Regeln für eingehenden (*inbound*) und ausgehenden (*outbound*)
Verkehr. Jede Regel nennt Protokoll, Port und Quelle bzw. Ziel.

Die wichtigsten Eigenschaften:

| Eigenschaft | Bedeutung |
|---|---|
| Stateful | Antworten auf erlaubte Verbindungen kommen automatisch zurück |
| Nur Erlaubnisse | Es gibt keine Verbots-Regeln; was nicht erlaubt ist, ist verboten |
| Standard eingehend | nichts erlaubt |
| Standard ausgehend | alles erlaubt |
| Quelle | CIDR-Bereich (`198.51.100.0/24`) **oder** eine andere Security Group |

> [!MERKSATZ]
> Security Groups sind stateful, kennen nur Erlaubnis-Regeln und lassen eingehend zunächst nichts durch.
> Jede Freigabe ist eine bewusste Entscheidung.

## Security Groups verweisen auf Security Groups

Die stärkste Funktion: Als Quelle einer Regel kannst du eine **andere Security Group** angeben. Die
Regel „5432/tcp von `sg-app`“ bedeutet: Jede Ressource, die in `sg-app` ist, darf auf Port 5432 zugreifen
– egal welche IP-Adresse sie gerade hat.

Das passt perfekt zur Cloud, in der Server ständig neu entstehen und verschwinden. Startet ein vierter
App-Server, hat er sofort Zugriff auf die Datenbank, ohne dass jemand eine Adresse nachträgt.

```text
Internet ──443──▶ [sg-alb]  Load Balancer
                      │ 8080 (Quelle: sg-alb)
                      ▼
                  [sg-app]  App-Server
                      │ 5432 (Quelle: sg-app)
                      ▼
                  [sg-db]   Datenbank
```

So entsteht eine Kette: Jede Schicht erlaubt nur Verkehr von der Schicht davor. Selbst wenn jemand die
Datenbank-Adresse kennt, kommt er ohne den Weg über die App-Server nicht hin.

## Öffentliche und private Subnetze

Security Groups arbeiten zusammen mit dem Aufbau der VPC. Ob eine Ressource überhaupt aus dem Internet
erreichbar sein **kann**, entscheidet das Subnetz:

- **Öffentliches Subnetz:** Die Routing-Tabelle hat eine Route `0.0.0.0/0` zu einem *Internet Gateway*.
  Ressourcen mit öffentlicher Adresse sind erreichbar – wenn die Security Group es erlaubt.
- **Privates Subnetz:** Keine Route zum Internet Gateway. Ressourcen haben nur private Adressen und
  erreichen das Internet höchstens ausgehend über ein [[nat-gateway|NAT-Gateway]].

Load Balancer und Bastion-Host kommen ins öffentliche Subnetz, App-Server und Datenbanken ins private.
Das ist doppelter Schutz: Routing **und** Security Group.

> [!FEHLER]
> **„Nur kurz zum Debuggen“: Port 5432 für `0.0.0.0/0` öffnen.** Solche Regeln werden vergessen und
> bleiben monatelang stehen. Automatische Scanner finden offene Datenbank-Ports innerhalb von Stunden.
> Nutze für den Zugriff von außen den Weg über Bastion-Host oder VPN – die nächste Lektion.

## Regeln lesen und anlegen

In der AWS-Konsole siehst du Regeln als Tabelle. Mit der AWS CLI legst du sie reproduzierbar an:

```bash title="Terminal"
aws ec2 authorize-security-group-ingress \
  --group-id sg-0db0db0db0db0db00 \
  --protocol tcp --port 5432 \
  --source-group sg-0aaa1111bbbb22223
```

Statt `--source-group` gibst du mit `--cidr 198.51.100.0/24` einen Adressbereich an. In größeren
Projekten beschreibt man Security Groups meist als Code (Terraform, CloudFormation, CDK), damit jede
Änderung im Review sichtbar ist.

> [!PRAXIS]
> Ein bewährtes Review-Kriterium für Infrastruktur-Änderungen lautet: „Taucht irgendwo `0.0.0.0/0` als
> Quelle auf – und wenn ja, nur für 80 und 443 am Load Balancer?“ Alles andere muss gut begründet sein.

## Zusammenfassung

- Eine **Security Group** ist eine stateful, virtuelle Firewall um eine Cloud-Ressource.
- Sie kennt nur **Erlaubnis-Regeln**; eingehend ist zunächst nichts erlaubt, ausgehend alles.
- Als Quelle dienen CIDR-Bereiche oder **andere Security Groups** – ideal für Schichten-Ketten.
- **Öffentliche Subnetze** haben eine Route zum Internet Gateway, private nicht.
- `0.0.0.0/0` gehört höchstens auf 80/443 am Load Balancer – nie auf Datenbank- oder SSH-Ports.
