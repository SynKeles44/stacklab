---
title: CIDR und Netzbereiche berechnen
summary: Was /24 und /16 bedeuten, wie du Netzadresse, Broadcast-Adresse und nutzbare Hosts berechnest und ein Netz in Subnetze aufteilst.
duration: 25
sources:
  - title: RFC 4632 – Classless Inter-domain Routing (CIDR)
    url: https://www.rfc-editor.org/rfc/rfc4632
  - title: RFC 3021 – Using 31-Bit Prefixes on Point-to-Point Links
    url: https://www.rfc-editor.org/rfc/rfc3021
  - title: AWS VPC – Subnet sizing
    url: https://docs.aws.amazon.com/vpc/latest/userguide/subnet-sizing.html
quiz:
  - type: match
    question: Ordne jeder Präfixlänge ihre Netzmaske zu.
    pairs:
      - { left: "/8", right: "255.0.0.0" }
      - { left: "/16", right: "255.255.0.0" }
      - { left: "/20", right: "255.255.240.0" }
      - { left: "/26", right: "255.255.255.192" }
    explanation: Die Präfixlänge zählt die Einsen von links. /20 = 8 + 8 + 4 Einsen, das dritte Oktett ist 11110000 = 240.
  - type: single
    question: Welches Netz ist größer?
    options: ["10.0.0.0/24", "10.0.0.0/20", "Beide sind gleich groß"]
    answer: 1
    explanation: Kleinere Präfixlänge heißt mehr Hostbits. /20 hat 4096 Adressen, /24 nur 256.
  - type: single
    question: Wie lautet die Broadcast-Adresse von `198.51.100.64/26`?
    options: ["198.51.100.127", "198.51.100.128", "198.51.100.255", "198.51.100.95"]
    answer: 0
    explanation: Ein /26 hat 64 Adressen. 64 + 64 − 1 = 127.
  - type: cloze
    text: "Teilst du `10.0.0.0/24` in vier gleich große Subnetze, hat jedes das Präfix /___ und ___ nutzbare Hosts."
    blanks:
      - ["26"]
      - ["62"]
    explanation: Vier Teile brauchen 2 Bits mehr (24 + 2 = 26). 2⁶ = 64 Adressen, minus Netz- und Broadcast-Adresse = 62.
  - type: single
    question: Zu welcher historischen Adressklasse gehörte `172.16.5.4`?
    options: [Klasse A, Klasse B, Klasse C]
    answer: 1
    explanation: Das erste Oktett 172 liegt zwischen 128 und 191 – Klasse B. Heute zählt aber nur noch die Präfixlänge.
tasks:
  - id: subnetz-rechner
    type: code
    language: js
    title: Dein eigener Subnetz-Rechner
    description: |
      Schreibe `subnetInfo(cidr)`. Die Eingabe ist eine Adresse mit Präfix, z. B. `"198.51.100.77/27"`
      – die Adresse muss **nicht** die Netzadresse sein. Gib ein Objekt zurück:

      ```js
      {
        network: '198.51.100.64',
        broadcast: '198.51.100.95',
        firstHost: '198.51.100.65',
        lastHost: '198.51.100.94',
        hosts: 30,
      }
      ```

      Sonderfälle: Bei `/32` ist `hosts` 1 und erster wie letzter Host sind die Adresse selbst. Bei `/31`
      sind beide Adressen nutzbar (`hosts: 2`, erster Host = Netzadresse, letzter = Broadcast).

      `ipToInt` und `intToIp` sind vorgegeben. Rechne mit normaler Arithmetik
      (`Math.floor`, `%`), dann umgehst du die Vorzeichen-Falle von `&`.
    starter: |
      function ipToInt(ip) {
        return ip.split('.').reduce((sum, octet) => sum * 256 + Number(octet), 0)
      }

      function intToIp(n) {
        return [24, 16, 8, 0].map((shift) => Math.floor(n / 2 ** shift) % 256).join('.')
      }

      function subnetInfo(cidr) {
        const [address, prefixText] = cidr.split('/')
        const prefix = Number(prefixText)
        const size = 2 ** (32 - prefix)
        // Netzadresse: Adresse auf ein Vielfaches von size abrunden
      }
    tests:
      - name: berechnet ein /27 aus einer Host-Adresse
        code: |
          assertDeepEqual(subnetInfo('198.51.100.77/27'), {
            network: '198.51.100.64', broadcast: '198.51.100.95',
            firstHost: '198.51.100.65', lastHost: '198.51.100.94', hosts: 30,
          })
      - name: berechnet ein klassisches /24
        code: |
          const info = subnetInfo('192.168.178.23/24')
          assertEqual(info.network, '192.168.178.0')
          assertEqual(info.broadcast, '192.168.178.255')
          assertEqual(info.hosts, 254)
      - name: rechnet über Oktettgrenzen (/22)
        code: |
          const info = subnetInfo('10.4.9.200/22')
          assertEqual(info.network, '10.4.8.0')
          assertEqual(info.lastHost, '10.4.11.254')
          assertEqual(info.hosts, 1022)
      - name: funktioniert mit hohen Adressen
        code: assertEqual(subnetInfo('203.0.113.250/28').network, '203.0.113.240')
      - name: Sonderfall /32
        code: |
          assertDeepEqual(subnetInfo('192.0.2.10/32'), {
            network: '192.0.2.10', broadcast: '192.0.2.10',
            firstHost: '192.0.2.10', lastHost: '192.0.2.10', hosts: 1,
          })
      - name: Sonderfall /31
        code: |
          const info = subnetInfo('198.51.100.7/31')
          assertEqual(info.firstHost, '198.51.100.6')
          assertEqual(info.lastHost, '198.51.100.7')
          assertEqual(info.hosts, 2)
    hints:
      - "Die Netzadresse als Zahl ist `Math.floor(ipToInt(address) / size) * size`."
      - "Die Broadcast-Adresse ist `network + size - 1`."
      - "Für /31 und /32 (also `size <= 2`) sind erster und letzter Host einfach Netz- und Broadcast-Adresse, `hosts` ist `size`."
    solution: |
      ```js
      function ipToInt(ip) {
        return ip.split('.').reduce((sum, octet) => sum * 256 + Number(octet), 0)
      }

      function intToIp(n) {
        return [24, 16, 8, 0].map((shift) => Math.floor(n / 2 ** shift) % 256).join('.')
      }

      function subnetInfo(cidr) {
        const [address, prefixText] = cidr.split('/')
        const prefix = Number(prefixText)
        const size = 2 ** (32 - prefix)
        const network = Math.floor(ipToInt(address) / size) * size
        const broadcast = network + size - 1
        const special = size <= 2
        return {
          network: intToIp(network),
          broadcast: intToIp(broadcast),
          firstHost: intToIp(special ? network : network + 1),
          lastHost: intToIp(special ? broadcast : broadcast - 1),
          hosts: special ? size : size - 2,
        }
      }
      ```
  - id: vier-subnetze
    type: terminal
    title: Ein /24 in vier Subnetze teilen
    description: |
      Das Netz `192.168.50.0/24` soll in **vier gleich große** Subnetze aufgeteilt werden. Halte das
      Ergebnis in einer Datei fest.

      1. Wechsle in den Ordner `aufteilung`.
      2. Lege die Datei `subnetze.txt` an.
      3. Schreibe die vier Subnetze in CIDR-Schreibweise hinein – **eins pro Zeile**, aufsteigend sortiert,
         ohne weitere Zeichen (zum Beispiel mit `nano subnetze.txt` oder mit `printf`).

      In `auftrag.txt` steht die Aufgabe noch einmal. Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: aufteilung
    setup: |
      printf 'Teile 192.168.50.0/24 in vier gleich grosse Subnetze.\nEine Zeile pro Subnetz in subnetze.txt.\n' > auftrag.txt
    checks:
      - type: file_exists
        path: subnetze.txt
        message: Die Datei subnetze.txt fehlt noch.
      - type: command
        run: grep -c . subnetze.txt
        stdout_matches: "^4$"
        message: subnetze.txt soll genau vier nicht-leere Zeilen enthalten.
      - type: command
        run: grep -c '/26$' subnetze.txt
        stdout_matches: "^4$"
        message: Alle vier Subnetze brauchen dasselbe Präfix. Wie viele Bits brauchst du für vier Teile?
      - type: command
        run: tr -d ' \r' < subnetze.txt | grep . | tr '\n' ' '
        stdout_equals: "192.168.50.0/26 192.168.50.64/26 192.168.50.128/26 192.168.50.192/26"
        message: Die Netzadressen stimmen noch nicht. Ein /26 ist 64 Adressen groß – die Netze beginnen bei 0, 64, 128 und 192.
    hints:
      - Für vier Teile brauchst du 2 zusätzliche Netzbits – aus /24 wird /26.
      - Ein /26 umfasst 64 Adressen. Das zweite Subnetz beginnt also bei .64.
      - "Mit `printf '%s\\n' 192.168.50.0/26 192.168.50.64/26 … > subnetze.txt` schreibst du alle Zeilen auf einmal."
    solution: |
      ```bash
      cd aufteilung
      printf '%s\n' 192.168.50.0/26 192.168.50.64/26 192.168.50.128/26 192.168.50.192/26 > subnetze.txt
      cat subnetze.txt
      ```
---

„Gib dem neuen Server eine freie Adresse aus `10.0.12.0/22`.“ Welche Adressen sind das – und welche
darfst du nicht nehmen? Mit CIDR und einer einfachen Rechenmethode beantwortest du das in Sekunden.

## Die Zahl hinter dem Schrägstrich

Früher verriet das erste Oktett die Netzgröße: Die historischen [[adressklasse|Adressklassen]] A
(0–127, /8), B (128–191, /16) und C (192–223, /24) kannten nur drei Größen. Das verschwendete Adressen
und ließ die Routing-Tabellen explodieren. Seit 1993 gilt [[cidr|CIDR]]: Die Größe wird ausdrücklich
dazugeschrieben.

```text
198.51.100.64/26   → die ersten 26 Bit sind der Netzanteil
```

Die Zahl heißt [[praefixlaenge|Präfixlänge]] und zählt einfach die Einsen der Netzmaske. Für jede volle
8 schreibst du `255`, der Rest bestimmt das nächste Oktett:

| Präfix | Netzmaske | Adressen | Nutzbare Hosts |
|---|---|---|---|
| /16 | 255.255.0.0 | 65.536 | 65.534 |
| /20 | 255.255.240.0 | 4.096 | 4.094 |
| /24 | 255.255.255.0 | 256 | 254 |
| /26 | 255.255.255.192 | 64 | 62 |
| /28 | 255.255.255.240 | 16 | 14 |
| /32 | 255.255.255.255 | 1 | eine einzelne Adresse |

> [!MERKSATZ]
> Adressen = 2^(32 − Präfix), nutzbare Hosts = Adressen − 2. Jedes Bit mehr Präfix halbiert das Netz.

`0.0.0.0/0` steht für **alle** Adressen – in Firewall-Regeln heißt das „das ganze Internet“.

## Die vier Eckdaten eines Netzes

| Wert | Bedeutung | Beispiel `198.51.100.64/26` |
|---|---|---|
| [[netzadresse|Netzadresse]] | alle Hostbits 0 | `198.51.100.64` |
| Erster Host | Netzadresse + 1 | `198.51.100.65` |
| Letzter Host | Broadcast − 1 | `198.51.100.126` |
| [[broadcast-adresse|Broadcast-Adresse]] | alle Hostbits 1 | `198.51.100.127` |

Netz- und Broadcast-Adresse sind reserviert, deshalb „minus 2“. Ausnahmen: Ein /32 ist eine einzelne
Adresse, ein /31 darf laut RFC 3021 für Punkt-zu-Punkt-Verbindungen beide Adressen nutzen.

## Die Blockgrößen-Methode

So rechnest du ohne Binärzahlen:

1. **Interessantes Oktett** finden – dort, wo die Maske weder 255 noch 0 ist (/17–/24: drittes, /25–/32: viertes).
2. **Blockgröße** = 256 − Maskenwert in diesem Oktett.
3. Netze beginnen bei Vielfachen der Blockgröße. Das größte Vielfache ≤ deinem Wert ist die Netzadresse.

```text
198.51.100.77/27   Maske .224 → Block 32 → Blöcke 0, 32, 64, 96 …
                   77 liegt in 64–95 → Netz .64, Broadcast .95, Hosts .65–.94

10.4.9.200/22      Maske 255.255.252.0 → Block 4 im 3. Oktett → 8–11
                   Netz 10.4.8.0, Broadcast 10.4.11.255, 1022 Hosts
```

> [!FEHLER]
> **Bei Präfixen unter /24 jedes Oktett einzeln behandeln.** In `10.4.8.0/22` ist `10.4.8.255` kein
> Broadcast und `10.4.9.0` keine Netzadresse – beides sind normale Hosts. Netz- und Broadcast-Adresse
> gibt es pro Netz nur einmal.

Im Code geht es noch einfacher: Adresse als Zahl auf ein Vielfaches der Netzgröße abrunden –
`Math.floor(ip / size) * size`. Genau das baust du in der Code-Aufgabe.

## Netze aufteilen

Ein [[subnetz|Subnetz]] entsteht, indem du die Präfixlänge vergrößerst. n zusätzliche Bits ergeben 2ⁿ
Subnetze, die lückenlos hintereinander liegen:

```text
192.168.50.0/24 in vier /26:
.0/26 (.0–.63)   .64/26 (.64–.127)   .128/26 (.128–.191)   .192/26 (.192–.255)
```

Jedes Subnetz beginnt an einem Vielfachen seiner Größe. Bei unterschiedlich großen Subnetzen vergibst du
die großen zuerst – das übst du in der Modul-Übung. Und: Netze, die du je verbinden willst (Cloud, Büro,
VPN), dürfen sich nicht **überschneiden**.

> [!PRAXIS]
> In der Cloud nimmt man für das Gesamtnetz eines Projekts (die [[vpc|VPC]]) großzügig ein `/16` und
> teilt es in `/24`-Subnetze: `10.0.1.0/24` öffentlich, `10.0.11.0/24` für App-Server, `10.0.21.0/24`
> für Datenbanken. AWS reserviert pro Subnetz übrigens fünf Adressen – plane mit Luft.

## Zusammenfassung

- CIDR schreibt die Netzgröße als **Präfixlänge**: `/24` = `255.255.255.0`; die alten Klassen A/B/C sind Geschichte.
- Adressen = 2^(32 − Präfix), nutzbare Hosts = Adressen − 2 (Sonderfälle /31 und /32).
- **Blockgröße** = 256 − Maskenwert; Netze beginnen bei Vielfachen davon.
- n Bits mehr Präfix = 2ⁿ Subnetze; jedes beginnt an einem Vielfachen seiner Größe.
- Netze, die verbunden werden sollen, dürfen sich nicht überschneiden.
