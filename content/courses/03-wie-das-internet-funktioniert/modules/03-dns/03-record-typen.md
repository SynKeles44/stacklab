---
title: "DNS-Einträge: A, AAAA, CNAME, MX, TXT und NS"
summary: Welche Arten von DNS-Einträgen es gibt, wofür du sie brauchst und wie du sie in einer Zonendatei und mit dig liest.
duration: 25
sources:
  - title: RFC 1035 – Domain Names, Implementation and Specification
    url: https://www.rfc-editor.org/rfc/rfc1035
  - title: RFC 3596 – DNS Extensions to Support IP Version 6 (AAAA)
    url: https://www.rfc-editor.org/rfc/rfc3596
  - title: IANA – DNS Parameters (Resource Record Types)
    url: https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml
quiz:
  - type: match
    question: Ordne jedem Record-Typ seinen Zweck zu.
    pairs:
      - { left: "A", right: "Name → IPv4-Adresse" }
      - { left: "AAAA", right: "Name → IPv6-Adresse" }
      - { left: "CNAME", right: "Name ist ein Alias für einen anderen Namen" }
      - { left: "MX", right: "Welcher Server nimmt E-Mails für die Domain an" }
      - { left: "NS", right: "Welche Nameserver für die Zone zuständig sind" }
    explanation: >
      A und AAAA liefern Adressen, CNAME verweist auf einen anderen Namen, MX nennt Mailserver, NS die
      autoritativen Nameserver. TXT enthält freien Text, etwa für SPF oder Verifizierungen.
  - type: single
    question: Ein MX-Eintrag hat die Priorität 10, ein zweiter die Priorität 20. Welcher Mailserver wird zuerst versucht?
    options:
      - Der mit 20, weil höher besser ist.
      - Der mit 10, weil die kleinere Zahl Vorrang hat.
      - Beide gleichzeitig.
      - Zufällig einer von beiden.
    answer: 1
    explanation: Bei MX gilt die kleinere Zahl zuerst. Der Server mit 20 ist der Ersatz, falls der erste nicht erreichbar ist.
  - type: find-bug
    question: In welcher Zeile dieser Zonendatei steckt ein Fehler?
    language: text
    code: |
      example.com.       3600  IN  A      192.0.2.10
      www.example.com.   3600  IN  CNAME  example.com.
      example.com.       3600  IN  AAAA   192.0.2.11
      example.com.       3600  IN  MX     10 mail.example.com.
    bug_line: 3
    explanation: "AAAA-Einträge enthalten IPv6-Adressen wie `2001:db8::10`. `192.0.2.11` ist eine IPv4-Adresse und gehört in einen A-Eintrag."
  - type: cloze
    text: Ein ___-Eintrag macht `www.example.com` zu einem Alias. Auf der Domain selbst (`example.com`) darf so ein Eintrag nicht stehen, weil dort schon ___- und SOA-Einträge liegen.
    blanks:
      - [CNAME]
      - [NS]
    explanation: Ein CNAME darf nicht neben anderen Einträgen desselben Namens stehen. Die Zonenspitze braucht immer SOA und NS – deshalb kein CNAME auf example.com.
tasks:
  - id: record-zuordnen
    type: dragdrop
    title: Welcher Eintrag passt?
    description: Du richtest DNS für `example.com` ein. Welcher Record-Typ erfüllt welche Anforderung?
    targets:
      - { id: a, label: A }
      - { id: aaaa, label: AAAA }
      - { id: cname, label: CNAME }
      - { id: mx, label: MX }
      - { id: txt, label: TXT }
      - { id: ns, label: NS }
    items:
      - { label: "example.com soll auf 192.0.2.10 zeigen", target: a }
      - { label: "example.com soll per IPv6 unter 2001:db8::10 erreichbar sein", target: aaaa }
      - { label: "www.example.com soll dasselbe Ziel wie example.com haben", target: cname }
      - { label: "E-Mails an @example.com sollen bei mail.example.com landen", target: mx }
      - { label: "Festlegen, welche Server Mails im Namen der Domain senden dürfen (SPF)", target: txt }
      - { label: "ns1.example.com als zuständigen Nameserver eintragen", target: ns }
    hints:
      - Vier A-Zeichen stehen für die viermal so langen IPv6-Adressen.
  - id: dig-records
    type: simulated
    title: Frag verschiedene Record-Typen ab
    description: |
      Simuliertes Terminal mit Beispieldaten. Hinter `dig <name> <typ>` kannst du jeden Record-Typ abfragen.

      1. `dig +short example.com A`
      2. `dig +short example.com AAAA`
      3. `dig +short www.example.com CNAME`
      4. `dig +short example.com MX`
      5. `dig +short example.com TXT`
      6. `dig +short example.com NS`
    prompt: "du@laptop:~$"
    steps:
      - expect: "^dig\\s+\\+short\\s+example\\.com\\s+A$"
        output: "192.0.2.10"
        hint: "`dig +short example.com A`"
      - expect: "^dig\\s+\\+short\\s+example\\.com\\s+AAAA$"
        output: "2001:db8::10"
        hint: "`dig +short example.com AAAA`"
      - expect: "^dig\\s+\\+short\\s+www\\.example\\.com\\s+CNAME$"
        output: "example.com."
        hint: "`dig +short www.example.com CNAME`"
      - expect: "^dig\\s+\\+short\\s+example\\.com\\s+MX$"
        output: |
          10 mail.example.com.
          20 mail2.example.com.
        hint: "`dig +short example.com MX`"
      - expect: "^dig\\s+\\+short\\s+example\\.com\\s+TXT$"
        output: |
          "v=spf1 mx -all"
          "site-verification=abc123-beispiel"
        hint: "`dig +short example.com TXT`"
      - expect: "^dig\\s+\\+short\\s+example\\.com\\s+NS$"
        output: |
          ns1.example.com.
          ns2.example.com.
        hint: "`dig +short example.com NS`"
    responses:
      - match: "^dig\\s+\\+short\\s+www\\.example\\.com(\\s+A)?$"
        output: |
          example.com.
          192.0.2.10
    hints:
      - Der Record-Typ steht am Ende des Befehls.
    solution: |
      ```bash
      dig +short example.com A
      dig +short example.com AAAA
      dig +short www.example.com CNAME
      dig +short example.com MX
      dig +short example.com TXT
      dig +short example.com NS
      ```
---

Ein DNS-Eintrag sagt nicht nur „dieser Name hat diese Adresse“. Eine Domain braucht auch Angaben dafür,
wo E-Mails ankommen, welche Server zuständig sind oder dass sie dir wirklich gehört. Dafür gibt es
verschiedene Arten von Einträgen, die [[dns-record|DNS-Records]]. Die wichtigsten lernst du jetzt kennen.

## Aufbau eines Eintrags

Jeder Eintrag hat dieselben fünf Teile. So sieht er in einer Zonendatei aus, dem Textformat, in dem
autoritative Server ihre Einträge speichern:

```text title="Ein DNS-Eintrag"
www.example.com.   3600   IN   A   192.0.2.10
```

| Teil | Beispiel | Bedeutung |
|---|---|---|
| Name | `www.example.com.` | Für welchen Namen gilt der Eintrag |
| TTL | `3600` | Wie viele Sekunden Resolver ihn speichern dürfen |
| Klasse | `IN` | Internet – praktisch immer `IN` |
| Typ | `A` | Art des Eintrags |
| Wert | `192.0.2.10` | Der Inhalt, je nach Typ |

Ein Name kann mehrere Einträge haben – auch mehrere vom selben Typ, etwa zwei A-Einträge für zwei Server.

## Adressen: A und AAAA

Der [[a-record|A-Eintrag]] verknüpft einen Namen mit einer [[ipv4|IPv4]]-Adresse. Der
[[aaaa-record|AAAA-Eintrag]] („Quad-A“) macht dasselbe für [[ipv6|IPv6]]. Der Name kommt daher, dass eine
IPv6-Adresse viermal so lang ist (128 statt 32 Bit).

```text title="Adress-Einträge"
example.com.   3600   IN   A      192.0.2.10
example.com.   3600   IN   AAAA   2001:db8::10
```

Hat ein Name beide Einträge, bevorzugen moderne Rechner meist IPv6 und fallen sonst auf IPv4 zurück.

## Aliase und Zuständigkeit: CNAME und NS

Ein [[cname|CNAME]]-Eintrag (*canonical name*) sagt: „Dieser Name ist nur ein anderer Name für jenen.“
Der Resolver folgt dem Verweis und fragt dann nach dessen Adresse.

```text title="Alias und Nameserver"
www.example.com.   3600    IN   CNAME   example.com.
example.com.       86400   IN   NS      ns1.example.com.
example.com.       86400   IN   NS      ns2.example.com.
```

Ein [[ns-record|NS-Eintrag]] nennt die autoritativen Nameserver einer Zone. Genau diese Einträge liefert der
TLD-Server, wenn der Resolver nach `example.com` fragt. Für Ausfallsicherheit gibt es immer mindestens zwei.

> [!FEHLER]
> CNAME auf der Domain selbst: `example.com. IN CNAME andere.example.net.` ist nicht erlaubt. Ein CNAME darf
> nicht neben anderen Einträgen desselben Namens stehen – und an der Zonenspitze stehen immer NS und SOA.
> Für `www` ist ein CNAME dagegen völlig normal.

## E-Mail und Text: MX und TXT

Der [[mx-record|MX-Eintrag]] (*mail exchanger*) legt fest, welcher Server E-Mails für die Domain annimmt.
Die Zahl davor ist die Priorität: **kleiner gewinnt**.

```text title="Mail und Text"
example.com.   3600   IN   MX    10 mail.example.com.
example.com.   3600   IN   MX    20 mail2.example.com.
example.com.   3600   IN   TXT   "v=spf1 mx -all"
```

Ein [[txt-record|TXT-Eintrag]] enthält freien Text. Er wird für viele Zwecke genutzt:

| Einsatz | Beispielinhalt |
|---|---|
| SPF – wer darf Mails für die Domain senden? | `v=spf1 mx -all` |
| Domain-Verifizierung bei einem Dienst | `site-verification=abc123` |
| DKIM/DMARC – Mail-Absicherung | Schlüssel und Richtlinien |

> [!MERKSATZ]
> **A/AAAA** = Adresse, **CNAME** = Alias, **NS** = zuständige Nameserver, **MX** = Mailserver,
> **TXT** = freier Text für Nachweise und Regeln.

## Seltener, aber gut zu kennen: SOA und PTR

Jede Zone beginnt mit genau einem **SOA**-Eintrag (*Start of Authority*). Er enthält Verwaltungsdaten wie
den primären Nameserver, eine Kontaktadresse und eine Seriennummer, die bei jeder Änderung steigt.

Ein **PTR**-Eintrag funktioniert andersherum: von der IP-Adresse zum Namen (*Reverse DNS*). Mailserver
prüfen das gern, um Spam zu erkennen.

> [!PRAXIS]
> Wenn ein Online-Dienst sagt „Bitte beweise, dass dir die Domain gehört“, sollst du fast immer einen
> TXT-Eintrag mit einem vorgegebenen Wert anlegen. Der Dienst fragt ihn dann per DNS ab.

## Zusammenfassung

- Jeder Eintrag besteht aus **Name, TTL, Klasse, Typ und Wert**.
- **A** und **AAAA** verknüpfen Namen mit IPv4- bzw. IPv6-Adressen.
- **CNAME** ist ein Alias, aber nie auf der Domain selbst; **NS** nennt die zuständigen Nameserver.
- **MX** bestimmt die Mailserver (kleinere Priorität zuerst), **TXT** trägt Text wie SPF oder Verifizierungen.
- **SOA** eröffnet jede Zone, **PTR** übersetzt Adressen zurück in Namen.
