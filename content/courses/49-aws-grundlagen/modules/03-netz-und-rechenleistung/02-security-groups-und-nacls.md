---
title: Security Groups und Network ACLs
summary: Zwei Firewall-Schichten in der VPC – stateful Security Groups an der Ressource und stateless Network ACLs am Subnetz – und wann du welche nutzt.
duration: 20
sources:
  - title: Amazon VPC – Security groups
    url: https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html
  - title: Amazon VPC – Control subnet traffic with network access control lists
    url: https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html
  - title: Amazon VPC – Compare security groups and network ACLs
    url: https://docs.aws.amazon.com/vpc/latest/userguide/infrastructure-security.html#VPC_Security_Comparison
quiz:
  - type: match
    question: Ordne jede Eigenschaft der richtigen Firewall-Schicht zu.
    pairs:
      - { left: "Stateful, nur Allow-Regeln", right: "Security Group" }
      - { left: "Stateless, Allow- und Deny-Regeln", right: "Network ACL" }
      - { left: "Wirkt auf eine Netzwerkschnittstelle (z. B. eine EC2-Instanz)", right: "Security Group" }
      - { left: "Wirkt auf ein ganzes Subnetz", right: "Network ACL" }
    explanation: Security Groups sitzen direkt an der Ressource und merken sich Verbindungen. Network ACLs prüfen jedes Paket am Rand des Subnetzes einzeln.
  - type: single
    question: "Eine Network ACL hat eingehend die Regeln `100 allow tcp 443 0.0.0.0/0` und `90 deny all 203.0.113.0/24`. Was passiert mit einer HTTPS-Anfrage von 203.0.113.50?"
    options:
      - Sie wird erlaubt, weil Regel 100 passt.
      - Sie wird abgelehnt, weil Regel 90 eine kleinere Nummer hat und zuerst passt.
      - Beide Regeln werden kombiniert, das Ergebnis ist zufällig.
    answer: 1
    explanation: Network ACLs prüfen Regeln in aufsteigender Reihenfolge der Nummer. Die erste passende Regel entscheidet.
  - type: single
    question: Warum braucht eine eigene Network ACL eine ausgehende Regel für die Ports 1024–65535, damit ein Webserver antworten kann?
    options:
      - Weil Network ACLs stateless sind und auch die Antwortpakete zum Client einzeln erlauben müssen
      - Weil HTTPS diese Ports zum Senden der Website benutzt
      - Das ist nicht nötig, Antworten sind immer erlaubt
    answer: 0
    explanation: Der Client wartet auf einem zufälligen, flüchtigen Port auf die Antwort. Eine stateless Firewall muss diesen Rückweg ausdrücklich erlauben.
  - type: find-bug
    question: Diese Regeln einer Security Group für eine Datenbank sollen nur die App-Server durchlassen. Welche Zeile ist das Problem?
    language: text
    code: |
      Eingehend  tcp  5432  Quelle: sg-0app (App-Server)
      Eingehend  tcp  5432  Quelle: 10.0.10.0/23 (App-Subnetz a)
      Eingehend  tcp  5432  Quelle: 0.0.0.0/0
      Ausgehend  alle alle  Ziel: 0.0.0.0/0
    bug_line: 3
    explanation: Die dritte Regel öffnet die Datenbank für jede Adresse. Weil Security Groups nur Allow-Regeln kennen, hebt keine andere Regel sie auf.
tasks:
  - id: nacl-js
    type: code
    language: js
    title: Network-ACL-Regeln auswerten
    description: |
      Schreibe `naclDecide(rules, packet)`. Jede Regel hat die Form
      `{ number, protocol, fromPort, toPort, cidr, action }` – `protocol` ist `"tcp"`, `"udp"` oder `"all"`
      (dann gelten alle Ports), `action` ist `"allow"` oder `"deny"`. Ein Paket hat die Form
      `{ protocol, port, sourceIp }`.

      - Prüfe die Regeln in **aufsteigender** Reihenfolge von `number` – egal, in welcher Reihenfolge sie im
        Array stehen.
      - Die erste passende Regel entscheidet. Liefere ihre `action`.
      - Passt keine Regel, liefere `"deny"` (die Regel `*` am Ende jeder Network ACL).

      `ipInCidr(ip, cidr)` ist schon vorbereitet.
    starter: |
      function ipToInt(ip) {
        return ip.split('.').reduce((sum, octet) => sum * 256 + Number(octet), 0)
      }

      function ipInCidr(ip, cidr) {
        const [base, prefix] = cidr.split('/')
        const size = 2 ** (32 - Number(prefix))
        return Math.floor(ipToInt(ip) / size) === Math.floor(ipToInt(base) / size)
      }

      function naclDecide(rules, packet) {
        // Dein Code
      }
    tests:
      - name: Ohne passende Regel wird abgelehnt
        code: |
          assertEqual(naclDecide([], { protocol: 'tcp', port: 443, sourceIp: '198.51.100.7' }), 'deny')
          const rules = [{ number: 100, protocol: 'tcp', fromPort: 443, toPort: 443, cidr: '0.0.0.0/0', action: 'allow' }]
          assertEqual(naclDecide(rules, { protocol: 'tcp', port: 22, sourceIp: '198.51.100.7' }), 'deny')
      - name: Eine passende Allow-Regel erlaubt
        code: |
          const rules = [{ number: 100, protocol: 'tcp', fromPort: 443, toPort: 443, cidr: '0.0.0.0/0', action: 'allow' }]
          assertEqual(naclDecide(rules, { protocol: 'tcp', port: 443, sourceIp: '198.51.100.7' }), 'allow')
          assertEqual(naclDecide(rules, { protocol: 'udp', port: 443, sourceIp: '198.51.100.7' }), 'deny')
      - name: Die kleinste Nummer gewinnt, unabhängig von der Array-Reihenfolge
        code: |
          const rules = [
            { number: 100, protocol: 'tcp', fromPort: 443, toPort: 443, cidr: '0.0.0.0/0', action: 'allow' },
            { number: 90, protocol: 'all', cidr: '203.0.113.0/24', action: 'deny' },
          ]
          assertEqual(naclDecide(rules, { protocol: 'tcp', port: 443, sourceIp: '203.0.113.50' }), 'deny')
          assertEqual(naclDecide(rules, { protocol: 'tcp', port: 443, sourceIp: '198.51.100.7' }), 'allow')
      - name: Portbereiche und Protokoll all
        code: |
          const rules = [
            { number: 200, protocol: 'tcp', fromPort: 1024, toPort: 65535, cidr: '0.0.0.0/0', action: 'allow' },
            { number: 300, protocol: 'all', cidr: '10.0.0.0/16', action: 'allow' },
          ]
          assertEqual(naclDecide(rules, { protocol: 'tcp', port: 50123, sourceIp: '198.51.100.7' }), 'allow')
          assertEqual(naclDecide(rules, { protocol: 'tcp', port: 1023, sourceIp: '198.51.100.7' }), 'deny')
          assertEqual(naclDecide(rules, { protocol: 'udp', port: 53, sourceIp: '10.0.10.4' }), 'allow')
    hints:
      - "Sortiere eine Kopie: `[...rules].sort((a, b) => a.number - b.number)`."
      - "Eine Regel passt, wenn das Protokoll `all` ist oder gleich, der Port im Bereich liegt (bei `all` egal) und `ipInCidr` stimmt."
      - "`find` liefert die erste passende Regel oder `undefined`."
    solution: |
      ```js
      function ipToInt(ip) {
        return ip.split('.').reduce((sum, octet) => sum * 256 + Number(octet), 0)
      }

      function ipInCidr(ip, cidr) {
        const [base, prefix] = cidr.split('/')
        const size = 2 ** (32 - Number(prefix))
        return Math.floor(ipToInt(ip) / size) === Math.floor(ipToInt(base) / size)
      }

      function naclDecide(rules, packet) {
        const sorted = [...rules].sort((a, b) => a.number - b.number)
        const match = sorted.find((rule) => {
          const protocolOk = rule.protocol === 'all' || rule.protocol === packet.protocol
          const portOk = rule.protocol === 'all' || (packet.port >= rule.fromPort && packet.port <= rule.toPort)
          return protocolOk && portOk && ipInCidr(packet.sourceIp, rule.cidr)
        })
        return match ? match.action : 'deny'
      }
      ```
  - id: paket-weg
    type: steps
    title: Der Weg eines Pakets
    description: |
      Ein Browser mit der Adresse `198.51.100.7` ruft per HTTPS einen Webserver im öffentlichen Subnetz auf.
      Das Subnetz hat eine **eigene** Network ACL, die Instanz eine Security Group mit „443/tcp von 0.0.0.0/0“.
    steps:
      - situation: Das Paket an Port 443 erreicht den Rand des Subnetzes.
        question: Was wird zuerst geprüft?
        options: [Die eingehenden Regeln der Network ACL, Die Security Group, Die Routing-Tabelle des Browsers]
        answer: 0
        explanation: Die Network ACL wirkt am Rand des Subnetzes – also bevor das Paket die Instanz erreicht.
      - situation: Die Network ACL lässt das Paket durch, es erreicht die Netzwerkschnittstelle der Instanz.
        question: Was entscheidet jetzt?
        options: [Die eingehenden Regeln der Security Group, Nichts mehr, Das Internet-Gateway]
        answer: 0
        explanation: Die Security Group ist die zweite Schicht direkt an der Instanz.
      - situation: Der Webserver antwortet an `198.51.100.7`, Zielport 50123. Die Security Group hat nur die Standard-Regel „ausgehend alles erlaubt“.
        question: Muss die Security Group für die Antwort etwas extra erlauben?
        options:
          - "Nein, sie ist stateful und lässt Antworten auf erlaubte Verbindungen automatisch durch"
          - "Ja, Port 50123 muss ausgehend erlaubt werden"
        answer: 0
        explanation: Security Groups merken sich Verbindungen. Antworten kommen automatisch durch.
      - situation: Die Antwort verlässt das Subnetz. Die eigene Network ACL hat ausgehend nur „100 allow tcp 443 0.0.0.0/0“.
        question: Was passiert mit der Antwort?
        options: [Sie wird durchgelassen, Sie wird verworfen – Zielport 50123 passt zu keiner Regel]
        answer: 1
        explanation: Network ACLs sind stateless. Ohne ausgehende Regel für die flüchtigen Ports 1024–65535 kommt die Antwort nie beim Browser an.
---

Die Firewall-Regeln stimmen, die Security Group erlaubt Port 443 – und trotzdem lädt die Seite nicht. In
solchen Fällen steckt oft eine zweite Schicht dahinter, die viele vergessen: die Network ACL. Wer beide
Schichten und ihren Unterschied kennt, sucht nicht stundenlang an der falschen Stelle.

## Zwei Schichten in der VPC

In einer VPC kann Verkehr an zwei Stellen gefiltert werden:

```text
Internet
   │
   ▼
┌────────────── Subnetz ──────────────┐
│  Network ACL (Rand des Subnetzes)   │
│        │                            │
│        ▼                            │
│  Security Group (an der Instanz)    │
│        │                            │
│        ▼                            │
│  EC2-Instanz                        │
└─────────────────────────────────────┘
```

Die [[security-group|Security Group]] kennst du schon aus den Netzwerk-Grundlagen: eine stateful
Firewall direkt an der Ressource. Die [[network-acl|Network ACL]] (*Network Access Control List*, kurz
NACL) ist eine zusätzliche Schicht für ein ganzes Subnetz.

## Security Groups im Überblick

- Wirken auf eine Netzwerkschnittstelle, etwa die einer EC2-Instanz oder einer RDS-Datenbank.
- Sind [[stateful-firewall|stateful]]: Antworten auf erlaubte Verbindungen kommen automatisch zurück.
- Kennen **nur Allow-Regeln**. Eingehend ist zunächst nichts erlaubt, ausgehend alles.
- Als Quelle sind CIDR-Bereiche **oder andere Security Groups** möglich – ideal für Schichten wie
  „Datenbank nur von den App-Servern“.

> [!MERKSATZ]
> Security Groups sind die Hauptfirewall in AWS. Fast alle Regeln, die du schreibst, gehören hierhin.

## Network ACLs: stateless und nummeriert

Network ACLs funktionieren anders:

| | Security Group | Network ACL |
|---|---|---|
| Wirkt auf | eine Ressource | ein Subnetz |
| Zustand | stateful | **stateless** |
| Regeln | nur Allow | Allow **und** Deny |
| Reihenfolge | alle Regeln zusammen | nach Nummer, erste passende entscheidet |
| Standard | eingehend nichts, ausgehend alles | Default-NACL: alles erlaubt; eigene NACL: alles verboten |

Jede Regel hat eine Nummer von 1 bis 32766. AWS prüft sie aufsteigend; die erste passende Regel
entscheidet. Am Ende steht immer die Regel `*`, die alles ablehnt, was nicht erlaubt wurde.

```text title="Eingehende Regeln einer Network ACL"
Nr.  Protokoll  Ports        Quelle            Aktion
90   alle       alle         203.0.113.0/24    DENY
100  TCP        443          0.0.0.0/0         ALLOW
*    alle       alle         0.0.0.0/0         DENY
```

Lass zwischen den Nummern Lücken (10, 20, 100 …), damit du später Regeln dazwischen einfügen kannst.

## Der Rückweg: flüchtige Ports

Weil Network ACLs stateless sind, prüfen sie auch jedes **Antwortpaket** einzeln. Ein Browser schickt
seine Anfrage von einem zufälligen [[ephemerer-port|flüchtigen Port]] (meist zwischen 1024 und 65535)
und erwartet die Antwort genau dort.

```text title="Ausgehende Regeln, damit Antworten ankommen"
Nr.  Protokoll  Ports        Ziel              Aktion
100  TCP        1024-65535   0.0.0.0/0         ALLOW
*    alle       alle         0.0.0.0/0         DENY
```

> [!FEHLER]
> **Eigene Network ACL ohne Regel für den Rückweg.** Die Anfrage kommt an, der Server antwortet, aber die
> Antwort wird am Subnetz-Rand verworfen. Im Browser sieht das aus wie ein Timeout – und niemand denkt an
> die NACL, weil die Security Group doch stimmt.

## Wann nutzt du welche Schicht?

- **Security Groups** für alle normalen Regeln: welche Ports, von welchen Quellen, für welche Ressourcen.
- **Network ACLs** als grobe Zusatzschicht, zum Beispiel um einen ganzen Adressbereich, der gerade
  angreift, per Deny auszusperren. Das kann eine Security Group nicht, weil sie keine Deny-Regeln kennt.

Viele Teams lassen die Default-NACL (alles erlaubt) stehen und regeln alles über Security Groups. Das ist
in Ordnung – Hauptsache, die Entscheidung ist bewusst.

> [!PRAXIS]
> Bei Verbindungsproblemen hilft eine feste Reihenfolge: Routing-Tabelle (gibt es überhaupt einen Weg?),
> Network ACL (eingehend **und** ausgehend), Security Group, und erst danach die Anwendung selbst.

## Zusammenfassung

- In der VPC filtern **Network ACLs** am Rand des Subnetzes und **Security Groups** an der Ressource.
- Security Groups sind **stateful** und kennen nur Allow-Regeln, auch mit anderen Security Groups als Quelle.
- Network ACLs sind **stateless**, haben Allow und Deny und werden nach **Nummer** geprüft – die erste Treffer-Regel gewinnt.
- Für eigene NACLs brauchst du Regeln für den Rückweg über die **flüchtigen Ports** 1024–65535.
- Security Groups sind die Hauptfirewall; NACLs eignen sich für grobe Sperren ganzer Bereiche.
