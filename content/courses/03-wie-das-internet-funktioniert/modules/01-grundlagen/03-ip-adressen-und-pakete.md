---
title: IP-Adressen, Pakete und Schichten
summary: Wie Rechner adressiert werden (IPv4 und IPv6), warum Daten in Paketen reisen und wie Protokolle in Schichten zusammenarbeiten.
duration: 25
sources:
  - title: RFC 791 – Internet Protocol (IPv4)
    url: https://www.rfc-editor.org/rfc/rfc791
  - title: RFC 8200 – Internet Protocol, Version 6 (IPv6)
    url: https://www.rfc-editor.org/rfc/rfc8200
  - title: RFC 1122 – Requirements for Internet Hosts (Schichten des Internets)
    url: https://www.rfc-editor.org/rfc/rfc1122
  - title: RFC 1918 – Address Allocation for Private Internets
    url: https://www.rfc-editor.org/rfc/rfc1918
  - title: MDN – Protocol (Glossar)
    url: https://developer.mozilla.org/en-US/docs/Glossary/Protocol
quiz:
  - type: single
    question: Welche dieser IPv4-Adressen ist ungültig?
    options:
      - 192.0.2.1
      - 203.0.113.255
      - 198.51.100.300
      - 0.0.0.0
    answer: 2
    explanation: >
      Jeder der vier Blöcke einer IPv4-Adresse ist ein Oktett aus 8 Bit und kann nur Werte von 0 bis 255
      annehmen. 300 passt nicht in 8 Bit, deshalb ist 198.51.100.300 ungültig.
  - type: cloze
    text: Eine IPv4-Adresse ist ___ Bit lang, eine IPv6-Adresse ___ Bit.
    blanks:
      - ["32"]
      - ["128"]
    explanation: IPv4 hat 32 Bit (vier Oktette à 8 Bit), IPv6 hat 128 Bit (acht Gruppen à 16 Bit).
  - type: match
    question: Ordne jedes Protokoll seiner Schicht im TCP/IP-Modell zu.
    pairs:
      - { left: "HTTP", right: "Anwendungsschicht" }
      - { left: "TCP", right: "Transportschicht" }
      - { left: "IP", right: "Internetschicht" }
      - { left: "Ethernet", right: "Netzzugangsschicht" }
    explanation: HTTP regelt, was Anwendungen sagen; TCP sorgt für zuverlässigen Transport; IP adressiert und leitet weiter; Ethernet überträgt die Bits im lokalen Netz.
  - type: multiple
    question: Welche Aussagen über das Schichtenmodell stimmen?
    options:
      - Jede Schicht nutzt nur die Dienste der Schicht direkt darunter.
      - Ein Browser muss wissen, ob die Daten über WLAN oder Glasfaser laufen.
      - Beim Empfangen werden die Umschläge in umgekehrter Reihenfolge wieder entfernt.
      - Man kann eine Schicht austauschen, ohne die anderen zu ändern.
    answers: [0, 2, 3]
    explanation: >
      Genau das ist der Sinn der Schichten: Jede kümmert sich um ihre Aufgabe und verlässt sich auf die
      darunter. Deshalb funktioniert derselbe Browser über WLAN, Kabel oder Mobilfunk, ohne davon zu wissen.
tasks:
  - id: adressen-sortieren
    type: dragdrop
    title: Gültig oder ungültig?
    description: >
      Prüfe jede Adresse: Ist sie eine gültige IPv4-Adresse, eine gültige IPv6-Adresse – oder
      ungültig? Achte bei IPv4 auf die Anzahl der Blöcke und den Wertebereich 0–255, bei IPv6 auf
      Hex-Zeichen und darauf, dass `::` nur einmal vorkommen darf.
    targets:
      - { id: ipv4, label: Gültige IPv4-Adresse }
      - { id: ipv6, label: Gültige IPv6-Adresse }
      - { id: ungueltig, label: Ungültig }
    items:
      - { label: "192.0.2.10", target: ipv4 }
      - { label: "203.0.113.255", target: ipv4 }
      - { label: "127.0.0.1", target: ipv4 }
      - { label: "2001:db8::1", target: ipv6 }
      - { label: "2001:db8:0:0:0:0:0:42", target: ipv6 }
      - { label: "::1", target: ipv6 }
      - { label: "192.0.2.256", target: ungueltig }
      - { label: "198.51.100", target: ungueltig }
      - { label: "2001:db8::1::2", target: ungueltig }
      - { label: "2001:db8::g7", target: ungueltig }
    hints:
      - "Hex-Zeichen sind nur 0–9 und a–f. Ein g gehört nicht dazu."
      - "Bei `2001:db8::1::2` wüsste niemand, wie viele Null-Gruppen an welcher Stelle fehlen."
  - id: pakete-bauen
    type: code
    language: js
    title: Nachricht in Pakete teilen und wieder zusammensetzen
    description: |
      Bau das Prinzip der Paketvermittlung im Kleinen nach.

      1. `teileInPakete(nachricht, groesse)` zerlegt einen Text in Stücke mit höchstens `groesse`
         Zeichen. Jedes Paket ist ein Objekt `{ nummer, daten }`. Die Nummerierung beginnt bei 1.
         Ein leerer Text ergibt ein leeres Array.
      2. `setzeZusammen(pakete)` bekommt die Pakete in **beliebiger** Reihenfolge – so, wie sie im
         Internet ankommen können – und liefert den ursprünglichen Text zurück. Verändere das
         übergebene Array dabei nicht.
    starter: |
      function teileInPakete(nachricht, groesse) {
        const pakete = []
        // Schneide die Nachricht in Stücke und nummeriere sie ab 1
        return pakete
      }

      function setzeZusammen(pakete) {
        // Sortiere eine Kopie nach der Nummer und füge die Daten zusammen
        return ''
      }

      console.log(teileInPakete('Hallo Welt', 4))
    tests:
      - name: zerlegt eine Nachricht in nummerierte Pakete
        code: |
          assertDeepEqual(teileInPakete("Hallo Welt", 4), [
            { nummer: 1, daten: "Hall" },
            { nummer: 2, daten: "o We" },
            { nummer: 3, daten: "lt" },
          ])
      - name: ein leerer Text ergibt keine Pakete
        code: assertDeepEqual(teileInPakete("", 4), [])
      - name: ein Text, der genau passt, ergibt ein Paket
        code: 'assertDeepEqual(teileInPakete("abc", 3), [{ nummer: 1, daten: "abc" }])'
      - name: setzt Pakete in falscher Reihenfolge richtig zusammen
        code: |
          assertEqual(setzeZusammen([
            { nummer: 3, daten: "lt" },
            { nummer: 1, daten: "Hall" },
            { nummer: 2, daten: "o We" },
          ]), "Hallo Welt")
      - name: Hin- und Rückweg mit umgedrehter Reihenfolge
        code: |
          const text = "Pakete reisen getrennt und kommen trotzdem an."
          assertEqual(setzeZusammen(teileInPakete(text, 5).reverse()), text)
      - name: verändert das übergebene Array nicht
        code: |
          const angekommen = [{ nummer: 2, daten: "b" }, { nummer: 1, daten: "a" }]
          assertEqual(setzeZusammen(angekommen), "ab")
          assertEqual(angekommen[0].nummer, 2)
    hints:
      - "Mit einer `for`-Schleife und `start += groesse` kommst du in Schritten durch den Text, `slice(start, start + groesse)` schneidet ein Stück aus."
      - "`[...pakete]` erzeugt eine Kopie. Die sortierst du mit `sort((a, b) => a.nummer - b.nummer)`."
      - "Zum Schluss holst du mit `map` die Daten heraus und verbindest sie mit `join('')`."
    solution: |
      function teileInPakete(nachricht, groesse) {
        const pakete = []
        for (let start = 0; start < nachricht.length; start += groesse) {
          pakete.push({ nummer: pakete.length + 1, daten: nachricht.slice(start, start + groesse) })
        }
        return pakete
      }

      function setzeZusammen(pakete) {
        return [...pakete]
          .sort((a, b) => a.nummer - b.nummer)
          .map((paket) => paket.daten)
          .join('')
      }
  - id: schichten-beschriften
    type: diagram
    title: Beschrifte das TCP/IP-Modell
    description: >
      Ordne jedem Kasten den Namen seiner Schicht zu. Die Beispiele im Kasten helfen dir: Welche
      Schicht ist für HTTP zuständig, welche für TCP, welche für IP und welche für WLAN und Kabel?
    image: /assets/wie-das-internet-funktioniert/schichten-leer.svg
    slots:
      - { x: 33.3, y: 18.3, answer: Anwendungsschicht }
      - { x: 33.3, y: 37.4, answer: Transportschicht }
      - { x: 33.3, y: 56.4, answer: Internetschicht }
      - { x: 33.3, y: 75.5, answer: Netzzugangsschicht }
    distractors: [Darstellungsschicht, Browserschicht]
    hints:
      - Oben steht, was die Anwendung sagt, unten, wie die Bits physisch übertragen werden.
      - Die Darstellungsschicht gibt es nur im OSI-Modell, nicht im TCP/IP-Modell.
---

Wenn du einen Brief verschickst, schreibst du Absender und Empfänger auf den Umschlag. Im Internet ist das
genauso: Jedes Gerät braucht eine Adresse, jede Nachricht trägt Absender und Ziel – und alle Beteiligten
müssen sich an dieselben Regeln halten. In dieser Lektion lernst du Adressen, Pakete und die Schichten
kennen, in denen die Regeln des Internets organisiert sind.

## IP-Adressen: IPv4 und IPv6

Eine [[ip-adresse|IP-Adresse]] kennzeichnet ein Gerät im Netzwerk. „IP“ steht für das
[[internet-protocol|Internet Protocol]]. Es gibt zwei Versionen, die parallel im Einsatz sind:

| | [[ipv4\|IPv4]] | [[ipv6\|IPv6]] |
|---|---|---|
| Länge | 32 [[bit\|Bit]] | 128 Bit |
| Schreibweise | Vier Zahlen von 0 bis 255 | Acht [[hexadezimal\|Hex]]-Gruppen |
| Beispiel | `192.0.2.10` | `2001:db8::10` |
| Eigener Rechner | `127.0.0.1` | `::1` |

Jede IPv4-Zahl ist ein [[oktett|Oktett]] aus 8 Bit – daher der Bereich 0 bis 255. Mit 32 Bit gibt es nur
rund 4,3 Milliarden Adressen, und die sind praktisch aufgebraucht. IPv6 hat unvorstellbar viele mehr.

Bei IPv6 dürfen führende Nullen einer Gruppe wegfallen, und **eine** Folge von Null-Gruppen darf durch
`::` ersetzt werden: `2001:0db8:0000:0000:0000:0000:0000:0010` wird zu `2001:db8::10`.

Bereiche wie `192.168.x.x` oder `10.x.x.x` sind [[private-ip-adresse|private Adressen]]: Sie gelten nur im
eigenen Heim- oder Firmennetz. Nach außen tritt dein [[router|Router]] mit einer öffentlichen Adresse auf.

> [!FEHLER]
> `192.0.2.256` (Zahl über 255) und `2001:db8::1::5` (zweimal `::`) sehen plausibel aus, sind aber ungültig.

## Datenpakete: warum nicht alles am Stück?

![Eine Nachricht wird in drei nummerierte Pakete zerlegt, die auf verschiedenen Wegen zum Empfänger reisen](/assets/wie-das-internet-funktioniert/pakete.svg)

Ein Foto reist nicht als ein langer Strom, sondern in vielen kleinen [[datenpaket|Datenpaketen]] von meist
höchstens etwa 1.500 [[byte|Byte]]:

| Teil | Inhalt | Vergleich |
|---|---|---|
| Header | Absender-IP, Ziel-IP, Nummer, Verwaltungsangaben | Adressaufkleber |
| Nutzdaten | Ein Stück der eigentlichen Nachricht | Inhalt des Kartons |

Wie bei einem Umzug mit vielen nummerierten Kartons hat das Vorteile: Viele Absender teilen sich die
Leitungen fair, Pakete können Ausfälle umgehen, und geht eines verloren, wird nur dieses neu gesendet.
Weil Pakete verschiedene Wege nehmen, sortiert der Empfänger sie anhand der Nummern – genau das baust du in
der Code-Aufgabe nach.

## Protokolle und Schichten

Ein [[protokoll|Protokoll]] ist ein Regelwerk für Kommunikation: welche Nachrichten es gibt, wie sie
aufgebaut sind, in welcher Reihenfolge sie kommen und was bei Fehlern passiert – wie bei einem Telefonat
(klingeln, melden, abwechselnd reden, verabschieden).

Weil die Aufgabe riesig ist, teilt das Internet sie in ein [[schichtenmodell|Schichtenmodell]] auf, das
[[tcp-ip|TCP/IP]]-Modell. Jede Schicht nutzt nur die Schicht darunter. So läuft dein Browser über
[[wlan|WLAN]], Kabel oder Mobilfunk, ohne den Unterschied zu kennen.

![Das TCP/IP-Modell mit vier Schichten](/assets/wie-das-internet-funktioniert/schichten.svg)

| Schicht | Aufgabe | Beispiele |
|---|---|---|
| Anwendung | Was Programme einander sagen | [[http\|HTTP]], DNS, [[smtp\|SMTP]] |
| Transport | Daten zwischen zwei Programmen zustellen | [[tcp\|TCP]], [[udp\|UDP]] |
| Internet | Pakete adressieren und weiterleiten | IP |
| Netzzugang | Bits physisch übertragen | [[ethernet\|Ethernet]], WLAN, Glasfaser |

> [!MERKSATZ]
> Nur weil alle Geräte dieselben **offenen Protokolle** sprechen, verstehen sie sich. Die vier Schichten
> teilen die Arbeit auf: Anwendung, Transport, Internet, Netzzugang.

Vielleicht hörst du auch vom OSI-Modell mit sieben Schichten („Layer 7“). Für das Internet reichen die vier
von TCP/IP.

## Kapselung: Umschlag im Umschlag

Beim Senden setzt jede Schicht einen eigenen Header vor die Daten der Schicht darüber. Das nennt man
[[datenkapselung|Kapselung]]:

```text title="Kapselung beim Senden"
Anwendung:                       [ HTTP: GET / ]
Transport:            [ TCP-Header | HTTP: GET / ]
Internet:  [ IP-Header | TCP-Header | HTTP: GET / ]
Netzzugang: [ Rahmen | IP-Header | TCP-Header | HTTP: GET / ]
```

Beim Empfangen läuft es rückwärts: Jede Schicht entfernt ihre Hülle. Router unterwegs schauen nur bis zum
IP-Header – ob darin eine Webseite oder ein Video steckt, ist ihnen egal.

> [!PRAXIS]
> Bei der Fehlersuche gehen Fachleute Schicht für Schicht vor: WLAN verbunden? IP-Adresse vorhanden?
> Antwortet der Server auf dem Port? Stimmt die Antwort der Anwendung? So grenzt du Probleme ein, statt zu raten.

## Zusammenfassung

- Eine **IP-Adresse** kennzeichnet ein Gerät: **IPv4** mit 32 Bit (`192.0.2.10`), **IPv6** mit 128 Bit (`2001:db8::10`).
- **Private Adressen** wie `192.168.x.x` gelten nur im eigenen Netz.
- Daten reisen in **Paketen** aus Header (Absender, Ziel, Nummer) und Nutzdaten.
- Ein **Protokoll** ist ein gemeinsames Regelwerk; das **TCP/IP-Modell** hat vier Schichten.
- Bei der **Kapselung** setzt jede Schicht beim Senden ihren eigenen Header davor.
