---
title: Container auf AWS – wo läuft dein Image?
summary: Welche AWS-Dienste Container ausführen, was Fargate dir abnimmt und wann ECS, EKS oder Lambda besser passt.
duration: 18
sources:
  - title: What is Amazon Elastic Container Service?
    url: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html
  - title: AWS Fargate for Amazon ECS
    url: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html
  - title: Amazon ECS Express Mode
    url: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/express-service-overview.html
  - title: Choosing an AWS container service
    url: https://docs.aws.amazon.com/decision-guides/latest/containers-on-aws-how-to-choose/choosing-aws-container-service.html
quiz:
  - type: single
    question: Was nimmt dir AWS Fargate gegenüber ECS auf eigenen EC2-Instanzen ab?
    options:
      - Das Schreiben des Dockerfiles
      - Die Verwaltung, das Patchen und das Skalieren der Server, auf denen die Container laufen
      - Die Entscheidung, wie viel CPU und Speicher ein Container bekommt
      - Die Konfiguration von Security Groups
    answer: 1
    explanation: Mit Fargate gibt es keine EC2-Instanzen, die du betreust. CPU und Speicher, Netzwerk und Security Groups legst du aber weiterhin selbst fest.
  - type: match
    question: Ordne jedem Dienst die Situation zu, für die er am besten passt.
    pairs:
      - { left: "ECS mit Fargate", right: "Container-Web-App ohne eigene Server, wenig Betriebsaufwand" }
      - { left: "EKS", right: "Team setzt bereits auf Kubernetes-Werkzeuge und -Manifeste" }
      - { left: "Lambda", right: "Kurze, ereignisgesteuerte Funktion, die nur bei Bedarf läuft" }
      - { left: "ECS auf EC2", right: "Sehr gleichmäßige Dauerlast oder GPU-Bedarf" }
    explanation: Alle vier führen Code aus. Sie unterscheiden sich darin, wie viel Infrastruktur du selbst verantwortest und wie gut sie zur Last passen.
  - type: multiple
    question: Welche Aussagen über Fargate stimmen?
    options:
      - Du bezahlst pro Sekunde für die angeforderte CPU und den angeforderten Speicher deiner Tasks.
      - Du kannst dich per SSH auf den Host verbinden, auf dem dein Task läuft.
      - Jeder Task bekommt eine eigene Netzwerkschnittstelle im VPC.
      - Fargate kann ein normales Docker-Image aus einer Registry starten.
    answers: [0, 2, 3]
    explanation: Den Host siehst du bei Fargate nie – das ist ja der Sinn. Abgerechnet wird nach angefordertem vCPU und Speicher pro Sekunde (mindestens eine Minute).
  - type: cloze
    text: ECS ist der ___ (er entscheidet, wo welche Container laufen), Fargate ist die ___ (die Maschinen darunter).
    blanks:
      - [Orchestrator, Container-Orchestrator]
      - [Rechenkapazität, Kapazität, Compute-Engine, Rechen-Engine]
    explanation: ECS plant und überwacht Container. Fargate stellt die Rechenleistung dafür bereit, ohne dass du Server siehst.
tasks:
  - id: dienst-waehlen
    type: dragdrop
    title: Welcher Dienst passt?
    description: Ordne jedes Vorhaben dem AWS-Dienst zu, der dafür am besten geeignet ist.
    targets:
      - { id: fargate, label: ECS mit Fargate }
      - { id: eks, label: Amazon EKS }
      - { id: lambda, label: AWS Lambda }
      - { id: ec2, label: ECS auf EC2 }
    items:
      - { label: "Laravel-Shop als Container mit Web und Queue-Worker, kleines Team", target: fargate }
      - { label: "Firma betreibt schon 40 Dienste mit Helm-Charts", target: eks }
      - { label: "Bild verkleinern, sobald es in S3 hochgeladen wird", target: lambda }
      - { label: "Machine-Learning-Inferenz auf GPUs rund um die Uhr", target: ec2 }
      - { label: "Interne API als Container, niemand will Server patchen", target: fargate }
      - { label: "Webhook, der zehnmal am Tag aufgerufen wird", target: lambda }
  - id: fargate-ablauf
    type: steps
    title: Was passiert, wenn du einen Fargate-Task startest?
    description: Geh Schritt für Schritt durch, was AWS beim Start eines Tasks tut.
    steps:
      - situation: Du startest einen Task aus der Task-Definition `shop-web:7` mit 0,5 vCPU und 1 GB Speicher.
        question: Was musst du vorher an Servern bereitstellen?
        options: [Eine EC2-Instanz mit genug Speicher, Nichts – Fargate stellt passende Kapazität bereit, Einen Kubernetes-Knoten]
        answer: 1
        explanation: Genau das ist Fargate – du forderst Ressourcen an, AWS sucht den Platz.
      - situation: AWS hat Kapazität für den Task gefunden.
        question: Wie kommt der Task ins Netzwerk?
        options: [Er teilt sich die IP des Hosts, Er bekommt eine eigene Netzwerkschnittstelle mit privater IP in deinem Subnetz, Er ist nur über SSH erreichbar]
        answer: 1
        explanation: Fargate nutzt immer den Netzwerkmodus awsvpc – jeder Task hat seine eigene Netzwerkschnittstelle.
      - situation: Das Netzwerk steht.
        question: Was passiert als Nächstes?
        options: [Fargate lädt das Image aus der Registry und startet den Container, Fargate baut das Image aus deinem Dockerfile, ECS wartet auf eine manuelle Freigabe]
        answer: 0
        explanation: Fargate baut nichts. Es zieht ein fertiges Image – meistens aus Amazon ECR.
---
Dein Laravel-Shop läuft lokal in [[docker|Docker]], das Image ist gebaut. Jetzt soll er ins Internet – mit
mehreren Kopien, damit ein Absturz niemanden stört. Auf einem eigenen [[server|Server]] müsstest du das
Betriebssystem patchen, Docker aktualisieren und bei mehr Besuchern neue Maschinen aufsetzen. AWS bietet
dafür mehrere Dienste an. Diese Lektion zeigt, welcher wofür gedacht ist.

## Orchestrator und Rechenkapazität

Ein [[container|Container]] allein ist noch kein Betrieb. Jemand muss entscheiden: Wo läuft er? Was passiert,
wenn er abstürzt? Wie viele Kopien braucht es gerade? Diese Aufgabe heißt **Orchestrierung**.

Auf AWS teilt sich das in zwei Ebenen:

| Ebene | Aufgabe | Beispiele |
|---|---|---|
| Orchestrator | plant, startet, überwacht und ersetzt Container | [[amazon-ecs|Amazon ECS]], [[amazon-eks|Amazon EKS]] |
| Rechenkapazität | stellt CPU und Speicher bereit | [[aws-fargate|AWS Fargate]], [[ec2|EC2]]-Instanzen |

Analogie: ECS ist die Disposition einer Spedition, die Touren plant. Fargate ist ein Fuhrpark zum Mieten –
du sagst „ich brauche einen Transporter mit 1 Tonne Zuladung“, und er steht bereit. Wartung und Reifenwechsel
sind nicht dein Problem.

> [!MERKSATZ]
> **ECS entscheidet, was läuft. Fargate liefert, worauf es läuft.** Mit Fargate gibt es keine Server, die du
> anlegst, patchst oder skalierst.

## Was Fargate dir abnimmt – und was nicht

Mit Fargate forderst du pro Task nur Ressourcen an, zum Beispiel 0,5 [[vcpu|vCPU]] und 1 GB Speicher. AWS
sucht passende Kapazität, startet den Container und rechnet **pro Sekunde** ab.

| Erledigt AWS | Bleibt bei dir |
|---|---|
| Server bereitstellen und patchen | ein gutes, sicheres [[docker-image|Image]] bauen |
| Container-Laufzeit aktualisieren | CPU und Speicher passend wählen |
| Kapazität für neue Tasks finden | Netzwerk, [[security-group|Security Groups]], Rechte |
| Isolation zwischen Kunden | Logs, Monitoring, Kosten im Blick behalten |

Du kannst dich nicht per SSH auf den Host verbinden – es gibt keinen Host, den du siehst. Zum Debuggen nutzt
du Logs oder ECS Exec, das eine Shell im laufenden Container öffnet
([Doku](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html)).

> [!FEHLER]
> **Fargate mit „serverlos = kostenlos im Leerlauf“ verwechseln.** Ein Fargate-Task kostet Geld, solange er
> läuft – auch wenn niemand die Seite aufruft. Nur [[aws-lambda|Lambda]] zahlt wirklich nur pro Aufruf.

## Die Alternativen im Vergleich

| Dienst | Wann sinnvoll | Haken |
|---|---|---|
| **ECS + Fargate** | Web-Apps, APIs, Worker als Container; kleines Team | pro Ressource etwas teurer als eigene EC2 |
| **ECS + EC2** | gleichmäßige Dauerlast, GPUs, Spezial-Hardware | du patchst und skalierst die Instanzen |
| **EKS** | Team nutzt schon [[kubernetes|Kubernetes]] und dessen Werkzeuge | Kubernetes ist deutlich komplexer |
| **Lambda** | kurze, ereignisgesteuerte Funktionen | Laufzeitlimit 15 Minuten, anderes Programmiermodell |

[[ecs-express-mode|ECS Express Mode]] ist ein Schnellstart: Aus Image und zwei Rollen erzeugt AWS einen
Fargate-Service mit Load Balancer, HTTPS und Autoscaling. Darunter liegen dieselben ECS-Bausteine, die du in
diesem Kurs lernst. Der ältere Dienst [[aws-app-runner|App Runner]] nimmt keine Neukunden mehr an.

> [!PRAXIS]
> Für die meisten Laravel- oder Node-Anwendungen ist **ECS mit Fargate** der pragmatische Standard: kein
> Kubernetes-Wissen nötig, keine Server, aber volle Kontrolle über Netzwerk und Rechte. EKS lohnt sich meist
> erst, wenn eine Plattform-Abteilung viele Teams versorgt.

## Was du für diesen Kurs brauchst

Aus dem Kurs [AWS-Grundlagen](/kurse/aws-grundlagen) kennst du [[iam|IAM]], [[region|Regionen]] und
das [[vpc|VPC]]. Aus dem Docker-Kurs kennst du Images und Container. Hier kommt hinzu:

1. Images in einer Registry bei AWS ablegen – **Amazon ECR**.
2. Beschreiben, wie ein Container laufen soll – die **Task-Definition**.
3. Netzwerk, Load Balancer und Rechte verbinden.
4. Ausliefern, skalieren und Kosten steuern.

Alle Beispiele nutzen Platzhalter: das Konto `123456789012` und die Region `eu-central-1`.

## Zusammenfassung

- Ein **Orchestrator** (ECS, EKS) plant und überwacht Container, die **Rechenkapazität** (Fargate, EC2) führt sie aus.
- **Fargate** nimmt dir Server ab: kein Patchen, kein Skalieren von Instanzen, Abrechnung pro Sekunde.
- CPU, Speicher, Netzwerk, Rechte und Image-Qualität bleiben deine Aufgabe.
- **EKS** passt, wenn Kubernetes schon gesetzt ist; **Lambda** für kurze, ereignisgesteuerte Funktionen.
- Ein laufender Fargate-Task kostet auch ohne Besucher Geld.
