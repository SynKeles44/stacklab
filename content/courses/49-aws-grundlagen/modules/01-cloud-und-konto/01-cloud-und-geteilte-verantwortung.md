---
title: Cloud Computing und geteilte Verantwortung
summary: Was „Cloud“ wirklich bedeutet, wie sich IaaS, PaaS und SaaS unterscheiden und wofür AWS und wofür du zuständig bist.
duration: 20
sources:
  - title: AWS – Overview of Amazon Web Services (Whitepaper)
    url: https://docs.aws.amazon.com/whitepapers/latest/aws-overview/introduction.html
  - title: AWS – Shared Responsibility Model
    url: https://aws.amazon.com/compliance/shared-responsibility-model/
  - title: AWS Billing – Explore AWS services with AWS Free Tier
    url: https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier.html
quiz:
  - type: single
    question: Wer ist bei einer EC2-Instanz für Sicherheitsupdates des Betriebssystems zuständig?
    options:
      - AWS, weil der Server in einem AWS-Rechenzentrum steht
      - Du als Kunde, weil das Betriebssystem in der Cloud läuft und du es verwaltest
      - Niemand, Updates passieren in der Cloud automatisch
    answer: 1
    explanation: Bei EC2 (IaaS) kümmert sich AWS um Hardware und Virtualisierung. Ab dem Betriebssystem aufwärts – Updates, Firewall-Regeln, Software – bist du zuständig.
  - type: match
    question: Ordne jedem Dienstmodell ein passendes Beispiel zu.
    pairs:
      - { left: IaaS, right: "Eine virtuelle Maschine mieten (EC2)" }
      - { left: PaaS, right: "Eine verwaltete Datenbank nutzen (RDS)" }
      - { left: SaaS, right: "Ein fertiges Webmail-Programm im Browser" }
    explanation: Je weiter du von IaaS über PaaS zu SaaS gehst, desto mehr übernimmt der Anbieter – und desto weniger musst du selbst betreiben.
  - type: multiple
    question: Was gehört im Modell der geteilten Verantwortung immer zu deinen Aufgaben – egal welchen Dienst du nutzt?
    options:
      - Wer Zugriff auf deine Daten und Ressourcen bekommt (IAM)
      - Die Klassifizierung und der Schutz deiner eigenen Daten
      - Der Zutritt zu den Rechenzentren
      - Der Austausch defekter Festplatten
    answers: [0, 1]
    explanation: Zugriffsrechte und deine Daten bleiben immer deine Verantwortung. Rechenzentren und Hardware sind Teil der „Sicherheit der Cloud“ – das macht AWS.
  - type: cloze
    text: "AWS ist für die Sicherheit ___ Cloud verantwortlich, du für die Sicherheit ___ der Cloud."
    blanks:
      - [der]
      - [in]
    explanation: Diese Formel fasst das Shared Responsibility Model zusammen – AWS schützt die Infrastruktur, du schützt, was du darauf baust.
tasks:
  - id: verantwortung-zuordnen
    type: dragdrop
    title: Wer ist zuständig?
    description: |
      Dein Team betreibt eine Laravel-App auf einer EC2-Instanz und speichert Uploads in S3. Ordne jede
      Aufgabe der Partei zu, die im Modell der geteilten Verantwortung dafür zuständig ist.
    targets:
      - { id: aws, label: "AWS (Sicherheit der Cloud)" }
      - { id: du, label: "Du (Sicherheit in der Cloud)" }
    items:
      - { label: Strom und Kühlung im Rechenzentrum, target: aws }
      - { label: Defekte Server-Hardware austauschen, target: aws }
      - { label: Den Hypervisor patchen, target: aws }
      - { label: Sicherheitsupdates für Ubuntu auf der EC2-Instanz, target: du }
      - { label: Security-Group-Regeln festlegen, target: du }
      - { label: "Entscheiden, wer den S3-Bucket lesen darf", target: du }
      - { label: Passwörter und MFA der Teammitglieder, target: du }
    hints:
      - Alles, was du in der AWS-Konsole einstellen kannst, ist deine Aufgabe.
      - AWS kümmert sich um das, was du nie zu sehen bekommst – Gebäude, Hardware, Virtualisierung.
  - id: cloud-entscheidungen
    type: steps
    title: Was passiert als Nächstes?
    description: Ein kleines Team zieht mit seiner Web-App in die Cloud. Entscheide an jeder Stelle, was richtig ist.
    steps:
      - situation: Am Black Friday kommen zehnmal so viele Besucher wie sonst. Die App läuft auf zwei virtuellen Servern.
        question: Was ist der typische Cloud-Weg?
        options:
          - Für den einen Tag weitere Server starten und danach wieder beenden
          - Zehn Server kaufen und dauerhaft betreiben
          - Die Website für den Tag abschalten
        answer: 0
        explanation: Elastizität ist ein Kernvorteil der Cloud – du bezahlst die zusätzlichen Server nur für die Stunden, in denen du sie brauchst.
      - situation: Ein Scanner meldet, dass auf euren EC2-Instanzen eine alte OpenSSL-Version läuft.
        question: Wer muss handeln?
        options:
          - AWS, denn die Server stehen bei AWS
          - Euer Team, denn das Betriebssystem auf EC2 gehört zu euren Aufgaben
          - Niemand, Security Groups schützen ja
        answer: 1
        explanation: Software auf der Instanz – inklusive Betriebssystem-Paketen – liegt in eurer Verantwortung.
      - situation: Ihr wollt die Datenbank nicht mehr selbst patchen und sichern.
        question: Welcher Schritt verschiebt am meisten Arbeit zu AWS?
        options:
          - Die Datenbank auf eine größere EC2-Instanz umziehen
          - Auf den verwalteten Datenbankdienst RDS wechseln
          - Die Datenbank in einen Docker-Container packen
        answer: 1
        explanation: Bei RDS übernimmt AWS Betriebssystem, Datenbank-Updates und automatische Backups. Zugriffsrechte und Daten bleiben trotzdem eure Sache.
---

Stell dir vor, dein Team braucht für einen Test 20 Server – aber nur für drei Stunden. Früher hieß das:
Hardware bestellen, Wochen warten, Kabel stecken. In der Cloud klickst oder tippst du einen Befehl, und
wenige Minuten später laufen die Server. Nach dem Test löschst du sie wieder und zahlst nur die drei Stunden.

## Was Cloud Computing ist

[[cloud-computing|Cloud Computing]] bedeutet: Du mietest IT-Ressourcen – Rechenleistung, Speicher,
Datenbanken, Netzwerke – über das Internet, statt sie selbst zu kaufen und zu betreiben. Der Anbieter
betreibt riesige [[rechenzentrum|Rechenzentren]] und teilt sie in kleine, gemietete Stücke auf.

[[aws|Amazon Web Services (AWS)]] ist der größte dieser Anbieter. Andere große sind Microsoft Azure und
Google Cloud. Typische Eigenschaften der Cloud:

| Eigenschaft | Bedeutung |
|---|---|
| Auf Abruf | Ressourcen per Konsole, Befehl oder Code in Minuten anlegen |
| [[pay-as-you-go\|Pay-as-you-go]] | Abrechnung nach Nutzung – pro Sekunde, Stunde oder Gigabyte |
| Elastisch | Bei Last mehr Ressourcen starten, danach wieder abbauen |
| Verwaltet | Viele Dienste übernehmen Updates, Backups und Ausfallsicherheit |
| Global | Rechenzentren auf mehreren Kontinenten stehen sofort bereit |

> [!MERKSATZ]
> Cloud heißt nicht „jemand anderes kümmert sich um alles“. Cloud heißt: Du mietest Bausteine und
> entscheidest selbst, wie viel Betrieb du abgibst.

## IaaS, PaaS und SaaS

Wie viel du abgibst, beschreiben drei Dienstmodelle. Als Alltagsbild hilft Pizza: selbst backen in
einer gemieteten Küche, liefern lassen oder im Restaurant essen.

| Modell | Du bekommst | Du kümmerst dich um | AWS-Beispiel |
|---|---|---|---|
| [[iaas\|IaaS]] (*Infrastructure as a Service*) | [[virtuelle-maschine\|Virtuelle Maschinen]], Netz, Festplatten | Betriebssystem, Software, Updates, Daten | [[ec2\|EC2]] |
| [[paas\|PaaS]] (*Platform as a Service*) | Eine fertige Plattform, z. B. eine Datenbank | Konfiguration, Daten, Zugriffe | [[rds\|RDS]] |
| [[saas\|SaaS]] (*Software as a Service*) | Ein fertiges Programm | Nutzung, Daten, Benutzerkonten | Webmail, Office im Browser |

Viele AWS-Dienste liegen dazwischen. [[s3|S3]] zum Beispiel ist ein verwalteter Speicherdienst: Du siehst
keinen Server, nur deine Dateien.

## Das Modell der geteilten Verantwortung

Wer sorgt für Sicherheit, wenn deine App in einem fremden Rechenzentrum läuft? AWS beantwortet das mit
dem [[shared-responsibility-modell|Modell der geteilten Verantwortung]] (*Shared Responsibility Model*):

- **AWS** ist für die Sicherheit **der** Cloud zuständig: Gebäude, Strom, Hardware, Netz zwischen den
  Rechenzentren und die Virtualisierung.
- **Du** bist für die Sicherheit **in** der Cloud zuständig: wer Zugriff bekommt, wie Netz und
  [[firewall|Firewall]]-Regeln aussehen, welche Software läuft und wie deine Daten geschützt sind.

![Modell der geteilten Verantwortung: AWS schützt die Cloud, du schützt, was du darin baust](/assets/aws-grundlagen/geteilte-verantwortung.svg)

> [!FEHLER]
> **„Das liegt doch bei Amazon, das ist sicher.“** Fast alle bekannten Cloud-Datenlecks hatten
> nichts mit gehackten Rechenzentren zu tun – sondern mit falsch konfigurierten Rechten oder öffentlich
> lesbaren Speicher-Buckets. Das ist immer der Teil des Kunden.

## Die Grenze verschiebt sich je nach Dienst

Die Linie zwischen „AWS“ und „du“ liegt nicht immer an derselben Stelle:

| Aufgabe | EC2 (IaaS) | RDS (verwaltet) | S3 (verwaltet) |
|---|---|---|---|
| Hardware, Rechenzentrum | AWS | AWS | AWS |
| [[betriebssystem\|Betriebssystem]] patchen | **du** | AWS | AWS |
| Datenbank-Software aktualisieren | **du** | AWS | – |
| Backups einrichten | **du** | AWS (automatisch, du wählst die Aufbewahrung) | **du** (z. B. Versionierung) |
| Zugriffsrechte und Netz | **du** | **du** | **du** |
| Deine Daten, [[verschluesselung\|Verschlüsselung]] einschalten | **du** | **du** | **du** |

Die letzten beiden Zeilen ändern sich nie: Rechte und Daten bleiben immer bei dir.

> [!PRAXIS]
> In vielen Teams ist das ein Hauptgrund, verwaltete Dienste zu wählen: Ein RDS-Datenbankserver
> kostet etwas mehr als eine selbst gebaute Datenbank auf EC2, spart aber jede Woche Stunden an Patches,
> Backups und nächtlichen Ausfällen.

## Was die Cloud kostet

Abgerechnet wird nach Verbrauch. Ein Server, der läuft, kostet – auch wenn niemand ihn benutzt. Neue
Konten bekommen über das [[aws-free-tier|AWS Free Tier]] Startguthaben und einige dauerhaft kostenlose
Kontingente; die genauen Beträge und Laufzeiten ändern sich und stehen in der verlinkten Billing-Doku.

Wichtig für den Anfang: Lege gleich nach dem Anlegen eines Kontos ein Budget mit Benachrichtigung an.
Wie das geht, lernst du im letzten Modul.

## Zusammenfassung

- **Cloud Computing** heißt, IT-Ressourcen auf Abruf zu mieten und nach Verbrauch zu bezahlen.
- **IaaS** gibt dir virtuelle Maschinen, **PaaS** eine fertige Plattform, **SaaS** ein fertiges Programm.
- AWS sichert die Cloud selbst (Gebäude, Hardware, Virtualisierung), **du** sicherst, was du darin baust.
- Je verwalteter der Dienst, desto mehr Betrieb übernimmt AWS – **Zugriffsrechte und Daten bleiben bei dir**.
- Laufende Ressourcen kosten Geld, auch ungenutzt – Budgets gehören zu den ersten Schritten.
