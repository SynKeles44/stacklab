---
title: Regionen und Verfügbarkeitszonen
summary: Wie die AWS-Infrastruktur weltweit aufgeteilt ist, wie du eine Region auswählst und warum ausfallsichere Anwendungen auf mehrere Verfügbarkeitszonen verteilt werden.
duration: 20
sources:
  - title: AWS – Regions and Zones (EC2 User Guide)
    url: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html
  - title: AWS RAM – Availability Zone IDs
    url: https://docs.aws.amazon.com/ram/latest/userguide/working-with-az-ids.html
  - title: IAM – Identify AWS resources with Amazon Resource Names (ARNs)
    url: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference-arns.html
quiz:
  - type: single
    question: Was ist eine Verfügbarkeitszone (Availability Zone)?
    options:
      - Ein Land, in dem AWS Kunden hat
      - Ein oder mehrere Rechenzentren mit eigener Stromversorgung und Netzanbindung innerhalb einer Region
      - Ein Ordner in der AWS-Konsole
    answer: 1
    explanation: Eine Region besteht aus mehreren, voneinander getrennten Verfügbarkeitszonen. Fällt eine aus, laufen die anderen weiter.
  - type: multiple
    question: Welche Kriterien sind bei der Wahl einer Region sinnvoll?
    options:
      - Nähe zu deinen Nutzer:innen (Latenz)
      - Datenschutz-Vorgaben, wo Daten gespeichert werden dürfen
      - Ob alle benötigten Dienste dort angeboten werden
      - Der Name der Region klingt am schönsten
    answers: [0, 1, 2]
    explanation: Latenz, rechtliche Vorgaben, Preise und Dienst-Verfügbarkeit sind die üblichen Kriterien.
  - type: match
    question: Ordne jedem Teil der ARN `arn:aws:iam::123456789012:role/deploy` seine Bedeutung zu.
    pairs:
      - { left: "aws", right: "Partition" }
      - { left: "iam", right: "Dienst" }
      - { left: "123456789012", right: "Konto-ID" }
      - { left: "role/deploy", right: "Ressource" }
    explanation: Das Feld für die Region ist bei IAM leer, weil IAM ein globaler Dienst ist – daher die zwei Doppelpunkte hintereinander.
  - type: cloze
    text: "Die Verfügbarkeitszonen der Region `eu-central-1` heißen zum Beispiel `eu-central-1a`, `eu-central-1b` und `eu-central-___`."
    blanks:
      - ["1c"]
    explanation: Der Name einer Zone ist der Regionscode plus ein Buchstabe.
tasks:
  - id: region-waehlen
    type: terminal
    title: Eine Region mit jq auswählen
    description: |
      Im Ordner `regionen` liegt `regionen.json` mit vereinfachten Übungsdaten: Regionscode, Standort,
      Kontinent, Verfügbarkeitszonen und gemessene Latenz von deinem Büro aus.

      1. Schau dir die Datei mit `jq . regionen.json` an.
      2. Schreibe alle Regionscodes mit `"kontinent": "Europa"` alphabetisch sortiert, einen pro Zeile, in
         die Datei `eu-regionen.txt`.
      3. Schreibe den Code der europäischen Region mit der **niedrigsten Latenz** in `wahl.txt`.
      4. Schreibe die Namen der Verfügbarkeitszonen dieser Region, einen pro Zeile, in `zonen.txt`.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit die Datei angelegt wird.
    workdir: regionen
    setup: |
      cat > regionen.json <<'EOF'
      [
        { "code": "us-east-1", "standort": "N. Virginia", "kontinent": "Nordamerika", "latenz_ms": 92,
          "zonen": ["us-east-1a", "us-east-1b", "us-east-1c", "us-east-1d", "us-east-1e", "us-east-1f"] },
        { "code": "eu-west-1", "standort": "Irland", "kontinent": "Europa", "latenz_ms": 31,
          "zonen": ["eu-west-1a", "eu-west-1b", "eu-west-1c"] },
        { "code": "eu-central-1", "standort": "Frankfurt", "kontinent": "Europa", "latenz_ms": 11,
          "zonen": ["eu-central-1a", "eu-central-1b", "eu-central-1c"] },
        { "code": "ap-northeast-1", "standort": "Tokio", "kontinent": "Asien", "latenz_ms": 241,
          "zonen": ["ap-northeast-1a", "ap-northeast-1c", "ap-northeast-1d"] },
        { "code": "eu-north-1", "standort": "Stockholm", "kontinent": "Europa", "latenz_ms": 29,
          "zonen": ["eu-north-1a", "eu-north-1b", "eu-north-1c"] }
      ]
      EOF
    checks:
      - type: file_exists
        path: eu-regionen.txt
        message: Die Datei eu-regionen.txt fehlt noch.
      - type: command
        run: cat eu-regionen.txt | tr '\n' ' '
        stdout_matches: "^eu-central-1 eu-north-1 eu-west-1 ?$"
        message: "eu-regionen.txt soll genau die drei europäischen Codes enthalten, sortiert und einer pro Zeile. Tipp: jq -r mit select und dann sort."
      - type: command
        run: tr -d ' \n' < wahl.txt
        stdout_equals: eu-central-1
        message: In wahl.txt gehört nur der Code der europäischen Region mit der kleinsten Latenz.
      - type: command
        run: cat zonen.txt | tr '\n' ' '
        stdout_matches: "^eu-central-1a eu-central-1b eu-central-1c ?$"
        message: zonen.txt soll die drei Zonen der gewählten Region enthalten, eine pro Zeile.
    hints:
      - "`jq -r '.[] | select(.kontinent == \"Europa\") | .code' regionen.json` listet die europäischen Codes."
      - "Mit `sort_by(.latenz_ms) | .[0]` bekommst du das Element mit der kleinsten Latenz."
      - "`.zonen[]` gibt jedes Element des Arrays auf einer eigenen Zeile aus (mit `jq -r`)."
    solution: |
      ```bash
      cd regionen
      jq -r '.[] | select(.kontinent == "Europa") | .code' regionen.json | sort > eu-regionen.txt
      jq -r 'map(select(.kontinent == "Europa")) | sort_by(.latenz_ms) | .[0].code' regionen.json > wahl.txt
      jq -r 'map(select(.kontinent == "Europa")) | sort_by(.latenz_ms) | .[0].zonen[]' regionen.json > zonen.txt
      ```
  - id: geltungsbereich
    type: dragdrop
    title: Global, regional oder zonal?
    description: |
      AWS-Ressourcen gelten in unterschiedlich großen Bereichen. Ordne jede Ressource ihrem
      Geltungsbereich zu.
    targets:
      - { id: global, label: "Global (eine für alle Regionen)" }
      - { id: regional, label: "Regional (gehört zu einer Region)" }
      - { id: zonal, label: "Zonal (gehört zu einer Verfügbarkeitszone)" }
    items:
      - { label: IAM-Benutzer und -Rollen, target: global }
      - { label: Eine VPC, target: regional }
      - { label: Ein S3-Bucket, target: regional }
      - { label: Ein Subnetz, target: zonal }
      - { label: Eine EC2-Instanz, target: zonal }
      - { label: Ein EBS-Volume (Festplatte einer Instanz), target: zonal }
    hints:
      - IAM ist der klassische globale Dienst – deshalb fehlt die Region in seinen ARNs.
      - Alles, was physisch an einem Ort laufen oder liegen muss (Server, Festplatte), ist zonal.
---

Deine App läuft auf einem einzigen Server in Frankfurt. Eines Nachts fällt in genau diesem Rechenzentrum
der Strom aus – und deine Website ist weg. AWS ist so gebaut, dass du dieses Risiko vermeiden kannst. Dafür
musst du aber verstehen, wie die Infrastruktur aufgeteilt ist.

## Regionen

Eine [[region|Region]] ist ein geografischer Standort, an dem AWS mehrere Rechenzentren betreibt. AWS hat
weltweit über 30 Regionen. Jede hat einen Code, den du in Befehlen und Konfigurationen immer wieder siehst:

| Code | Standort |
|---|---|
| `eu-central-1` | Frankfurt |
| `eu-west-1` | Irland |
| `eu-north-1` | Stockholm |
| `us-east-1` | Nord-Virginia (USA) |

Regionen sind **voneinander unabhängig**. Was du in `eu-central-1` anlegst, existiert in `eu-west-1` nicht.
Daten verlassen eine Region nur, wenn du sie ausdrücklich kopierst.

> [!FEHLER]
> **„Wo ist mein Server hin?“** Die AWS-Konsole zeigt immer nur die Ressourcen der gerade gewählten
> Region (oben rechts). Wer versehentlich in `us-east-1` statt `eu-central-1` schaut, sieht leere Listen –
> oder legt Ressourcen in der falschen Region an.

## Verfügbarkeitszonen

Jede Region besteht aus mindestens drei [[availability-zone|Verfügbarkeitszonen]] (*Availability Zones*, AZ).
Eine AZ ist ein oder mehrere Rechenzentren mit eigener Stromversorgung, Kühlung und Netzanbindung. Die
Zonen einer Region liegen viele Kilometer auseinander, sind aber über schnelle Leitungen verbunden.

```text
Region eu-central-1 (Frankfurt)
├── eu-central-1a   ← eigenes Gebäude, eigener Strom
├── eu-central-1b
└── eu-central-1c
```

Der Buchstabe am Ende ist pro Konto zufällig zugeordnet: Dein `eu-central-1a` kann ein anderes Gebäude
sein als das `eu-central-1a` eines anderen Kontos. Wer über Konten hinweg planen muss, nutzt deshalb die
eindeutigen **AZ-IDs** wie `euc1-az2`.

> [!MERKSATZ]
> Eine Region hält mehrere Verfügbarkeitszonen. Wer seine Anwendung auf **mindestens zwei Zonen**
> verteilt, überlebt den Ausfall eines ganzen Rechenzentrums.

## Eine Region auswählen

Vier Fragen helfen bei der Wahl:

1. **Wo sind deine Nutzer:innen?** Je näher, desto kleiner die [[latenz|Latenz]].
2. **Wo dürfen die Daten liegen?** Bei personenbezogenen Daten aus der EU wählen viele Teams eine
   Region in der EU, um die Datenschutz-Vorgaben einfacher zu erfüllen.
3. **Gibt es dort alle Dienste?** Neue Dienste starten oft zuerst in wenigen Regionen.
4. **Was kostet es?** Preise unterscheiden sich je Region.

Für Projekte mit Nutzer:innen in Deutschland ist `eu-central-1` (Frankfurt) eine häufige Wahl. In diesem
Kurs nutzen wir sie in allen Beispielen.

## Global, regional, zonal

Nicht jede Ressource gehört zu einer Region:

| Bereich | Beispiele |
|---|---|
| Global | [[iam\|IAM]] (Benutzer, Rollen, Policies), Abrechnung |
| Regional | [[vpc\|VPC]], [[bucket\|S3-Buckets]], RDS-Datenbanken (verteilt auf Zonen) |
| Zonal | [[subnetz\|Subnetze]], EC2-Instanzen, [[ebs\|EBS]]-Volumes |

Ein Sonderfall ist S3: Ein Bucket liegt in einer Region, aber sein **Name** muss weltweit eindeutig sein.

## ARNs – die Adresse jeder Ressource

Jede AWS-Ressource hat eine eindeutige Adresse, die [[arn|ARN]] (*Amazon Resource Name*). Du brauchst sie
ständig, vor allem in Berechtigungen:

```text
arn:partition:dienst:region:konto-id:ressource

arn:aws:ec2:eu-central-1:123456789012:instance/i-0123456789abcdef0
arn:aws:iam::123456789012:role/deploy
arn:aws:s3:::example-uploads-bucket
```

Bei IAM fehlt die Region, weil der Dienst global ist. Bei S3 fehlen Region **und** Konto-ID, weil
Bucket-Namen weltweit eindeutig sind.

> [!PRAXIS]
> In Fehlermeldungen wie „User … is not authorized to perform … on resource arn:aws:…“ steht die ARN
> der Ressource, auf die der Zugriff verweigert wurde. Wer ARNs lesen kann, findet den Fehler in Sekunden.

## Zusammenfassung

- Eine **Region** ist ein geografischer Standort mit eigenem Code, z. B. `eu-central-1`.
- Jede Region hat mindestens drei **Verfügbarkeitszonen** – getrennte Rechenzentren mit eigener Versorgung.
- Ausfallsicher wird eine Anwendung erst, wenn sie auf **mehrere Zonen** verteilt ist.
- Wähle Regionen nach Latenz, Datenschutz, Dienst-Angebot und Preis.
- Ressourcen sind global (IAM), regional (VPC, S3) oder zonal (Subnetz, EC2).
- Eine **ARN** adressiert jede Ressource eindeutig: `arn:aws:dienst:region:konto-id:ressource`.
