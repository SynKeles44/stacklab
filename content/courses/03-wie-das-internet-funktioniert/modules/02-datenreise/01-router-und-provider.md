---
title: Router, Provider und der Weg durchs Netz
summary: Wie ein Datenpaket über Heimrouter, Internetanbieter und Internet-Knoten zum Ziel findet – und wie du den Weg mit ping und traceroute misst.
duration: 25
sources:
  - title: MDN – How does the Internet work?
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/How_does_the_Internet_work
  - title: RFC 1812 – Requirements for IP Version 4 Routers
    url: https://www.rfc-editor.org/rfc/rfc1812
  - title: RFC 792 – Internet Control Message Protocol
    url: https://www.rfc-editor.org/rfc/rfc792
  - title: ping(8) – Linux manual page
    url: https://man7.org/linux/man-pages/man8/ping.8.html
quiz:
  - type: single
    question: Was ist die Hauptaufgabe eines Routers?
    options:
      - Er speichert Webseiten, damit sie schneller laden.
      - Er entscheidet für jedes Paket, an welchen nächsten Nachbarn er es weitergibt.
      - Er übersetzt Domainnamen in IP-Adressen.
      - Er verschlüsselt alle Daten im Netzwerk.
    answer: 1
    explanation: >
      Ein Router schaut auf die Zieladresse eines Pakets, vergleicht sie mit seiner Routing-Tabelle und
      reicht das Paket an den passenden Nachbarn weiter. Namen auflösen macht DNS, Verschlüsseln macht TLS.
  - type: multiple
    question: Welche Aussagen über den Weg eines Pakets stimmen?
    options:
      - Kein Router kennt den kompletten Weg bis zum Ziel.
      - Pakete derselben Nachricht nehmen immer exakt denselben Weg.
      - Jeder Router, den ein Paket passiert, ist ein Hop.
      - Unterwegs wechseln Pakete oft zwischen den Netzen verschiedener Anbieter.
    answers: [0, 2, 3]
    explanation: >
      Jeder Router kennt nur den nächsten sinnvollen Schritt. Jeder dieser Schritte heißt Hop. Weil das
      Internet aus vielen verbundenen Netzen besteht, wechseln Pakete häufig zwischen Anbietern. Pakete
      können aber unterschiedliche Wege nehmen, wenn sich die Lage im Netz ändert.
  - type: match
    question: Ordne jedem Begriff die passende Beschreibung zu.
    pairs:
      - { left: "Latenz", right: "Wie lange ein Paket für den Weg braucht" }
      - { left: "Bandbreite", right: "Wie viele Daten pro Sekunde durch die Leitung passen" }
      - { left: "Hop", right: "Ein Zwischenschritt über einen Router" }
      - { left: "Internet-Knoten", right: "Ort, an dem viele Netze direkt Daten austauschen" }
    explanation: >
      Latenz ist eine Zeit (Millisekunden), Bandbreite eine Menge pro Zeit (z. B. Megabit pro Sekunde).
      Ein Hop ist eine Station auf dem Weg, ein Internet-Knoten ein großer Treffpunkt vieler Netze.
  - type: cloze
    text: Der Router bei dir zu Hause schickt alles, was nicht ins eigene Netz gehört, an das ___-Gateway. Die Firma, die dich ans Internet anschließt, heißt Internetanbieter oder englisch ___.
    blanks:
      - [Default, Standard, Standard-Gateway, Default-Gateway]
      - [ISP, Internet Service Provider, Provider]
    explanation: >
      Die Default-Route (Standard-Route) ist der Eintrag „alles andere“ in der Routing-Tabelle. Bei dir zu
      Hause zeigt sie zum Netz deines Internetanbieters (ISP).
  - type: cloze
    text: Jedes IP-Paket hat ein Feld namens ___. Jeder Router zieht davon 1 ab. Erreicht der Wert 0, wird das Paket verworfen und der Router schickt eine ICMP-Meldung „Time ___“ zurück.
    blanks:
      - [TTL, Time to Live, Hop Limit]
      - [exceeded]
    explanation: >
      Die TTL verhindert, dass Pakete endlos im Kreis laufen. traceroute nutzt genau diese Fehlermeldung
      „Time exceeded“, um die Router auf dem Weg sichtbar zu machen.
tasks:
  - id: paket-auf-reisen
    type: steps
    title: Was passiert als Nächstes mit dem Paket?
    description: >
      Du rufst in Berlin eine Seite auf, deren Server in einem Rechenzentrum in Nordamerika steht
      (IP-Adresse `203.0.113.40`). Begleite ein einzelnes Datenpaket auf seiner Reise.
    steps:
      - situation: >
          Dein Laptop hat das Paket fertig gepackt. Zieladresse ist `203.0.113.40`. Dein Laptop weiß,
          dass diese Adresse nicht in deinem Heimnetz liegt.
        question: Wohin schickt der Laptop das Paket?
        options:
          - Direkt zum Server in Nordamerika.
          - An seinen Heimrouter (das Default-Gateway).
          - An alle Geräte im WLAN gleichzeitig.
        answer: 1
        explanation: >
          Dein Laptop kennt nur sein eigenes Netz. Für alles andere hat er genau einen Eintrag: „Schick es an
          den Router.“ Dieser Router ist sein Default-Gateway.
      - situation: >
          Der Heimrouter bekommt das Paket. Auch er kennt den Server nicht, hat aber eine Leitung zu deinem
          Internetanbieter.
        question: Was macht der Heimrouter?
        options:
          - Er wirft das Paket weg, weil er das Ziel nicht kennt.
          - Er reicht es über seine Default-Route an den Router deines Internetanbieters weiter.
          - Er fragt einen DNS-Server nach dem Weg.
        answer: 1
        explanation: >
          Auch der Heimrouter hat eine Default-Route – sie zeigt zum Netz deines Anbieters. DNS hat mit dem
          Weiterleiten nichts zu tun, DNS liefert nur die IP-Adresse, bevor das Paket überhaupt losgeht.
      - situation: >
          Im Netz deines Anbieters landet das Paket bei großen Routern. Diese kennen Routen zu sehr vielen
          Netzen weltweit, auch zum Netz des Rechenzentrums.
        question: Wie gelangt das Paket typischerweise in das Netz des Rechenzentrums?
        options:
          - Über einen Internet-Knoten oder eine direkte Verbindung zwischen den Anbietern.
          - Über einen zentralen Hauptrechner, der das ganze Internet steuert.
          - Per Satellit, weil Kontinente nicht verbunden sind.
        answer: 0
        explanation: >
          Netze verschiedener Betreiber sind an Internet-Knoten oder über direkte Leitungen verbunden.
          Zwischen Kontinenten laufen die Daten fast immer durch Seekabel aus Glasfaser. Einen zentralen
          Hauptrechner gibt es nicht.
      - situation: >
          Das Paket kommt beim Router des Rechenzentrums an. Die Zieladresse `203.0.113.40` gehört zu einem
          Netz, das direkt an diesem Router hängt.
        question: Was passiert jetzt?
        options:
          - Der Router gibt das Paket direkt an den Server weiter – die Reise ist zu Ende.
          - Der Router schickt es zurück zu dir, damit du es bestätigst.
          - Das Paket wartet, bis alle anderen Pakete angekommen sind.
        answer: 0
        explanation: >
          Der letzte Router kennt das Zielnetz direkt und liefert das Paket aus. Ob alle Pakete vollständig
          und in der richtigen Reihenfolge da sind, kümmert sich nicht der Router – das macht TCP auf den
          beiden Endgeräten.
  - id: ping-traceroute-sim
    type: simulated
    title: Miss den Weg zu example.com
    description: |
      Das Übungs-Terminal darf nicht ins offene Internet, deshalb ist dieses Terminal **simuliert**.
      Die Ausgaben sind aber genau so aufgebaut wie echte.

      1. Schicke mit `ping -c 4 example.com` genau vier Pakete an `example.com`.
      2. Zeige mit `traceroute example.com` alle Router auf dem Weg.
      3. Prüfe mit `ping -c 2 203.0.113.99`, ob ein Rechner antwortet, der nicht existiert.

      Lies dir jede Ausgabe genau durch: Wo steht die Round-Trip-Time? Wo die TTL? Wo ist der Paketverlust?
    prompt: "du@laptop:~$"
    steps:
      - expect: "^ping\\s+-c\\s*4\\s+example\\.com$"
        output: |
          PING example.com (192.0.2.80) 56(84) bytes of data.
          64 bytes from 192.0.2.80: icmp_seq=1 ttl=52 time=24.8 ms
          64 bytes from 192.0.2.80: icmp_seq=2 ttl=52 time=23.9 ms
          64 bytes from 192.0.2.80: icmp_seq=3 ttl=52 time=25.3 ms
          64 bytes from 192.0.2.80: icmp_seq=4 ttl=52 time=24.1 ms

          --- example.com ping statistics ---
          4 packets transmitted, 4 received, 0% packet loss, time 3004ms
          rtt min/avg/max/mdev = 23.9/24.5/25.3/0.5 ms
        hint: "`ping -c 4 example.com` – die Option `-c` steht für count (Anzahl)."
      - expect: "^traceroute\\s+example\\.com$"
        output: |
          traceroute to example.com (192.0.2.80), 30 hops max, 60 byte packets
           1  router.local (192.168.1.1)  1.1 ms  0.9 ms  1.0 ms
           2  198.51.100.1 (198.51.100.1)  7.9 ms  8.2 ms  8.0 ms
           3  198.51.100.33 (198.51.100.33)  9.4 ms  9.1 ms  9.6 ms
           4  * * *
           5  203.0.113.9 (203.0.113.9)  14.7 ms  14.2 ms  14.9 ms
           6  203.0.113.130 (203.0.113.130)  22.8 ms  23.1 ms  22.6 ms
           7  example.com (192.0.2.80)  24.3 ms  24.0 ms  24.6 ms
        hint: "Einfach `traceroute example.com` – ohne weitere Optionen."
      - expect: "^ping\\s+-c\\s*2\\s+203\\.0\\.113\\.99$"
        output: |
          PING 203.0.113.99 (203.0.113.99) 56(84) bytes of data.

          --- 203.0.113.99 ping statistics ---
          2 packets transmitted, 0 received, 100% packet loss, time 1021ms
        hint: "`ping -c 2 203.0.113.99`"
    responses:
      - match: "^ping\\s+example\\.com$"
        output: "Ohne -c läuft ping endlos weiter. Nutze hier `ping -c 4 example.com`."
      - match: "^traceroute"
        output: "traceroute: Prüfe den Zielnamen – gesucht ist example.com."
    hints:
      - "Die Round-Trip-Time steht bei ping hinter `time=`, die TTL hinter `ttl=`."
      - "100 % packet loss bedeutet nicht zwingend „Rechner aus“ – vielleicht blockiert nur eine Firewall ICMP."
    solution: |
      ```bash
      ping -c 4 example.com
      traceroute example.com
      ping -c 2 203.0.113.99
      ```
      example.com antwortet mit rund 24 ms RTT. Auf dem Weg liegen 7 Hops; Hop 4 antwortet nicht
      (`* * *`), leitet aber weiter. Die Adresse 203.0.113.99 antwortet gar nicht: 100 % Paketverlust.
---

Wenn du einen Brief nach Kanada schickst, gibt es keinen Briefträger, der ihn persönlich von deinem
Briefkasten bis zur Haustür in Toronto trägt. Der Brief wandert von Station zu Station: Briefkasten,
Verteilzentrum, Flughafen, Verteilzentrum in Kanada, Zusteller. Keine Station kennt den ganzen Weg –
jede weiß nur, wohin sie den Brief **als Nächstes** geben muss. Genau so reisen Daten durch das [[internet|Internet]].

## Das Internet ist ein Netz aus Netzen

Das Internet ist kein einzelnes großes Kabel und kein zentraler Superrechner. Fällt eine Leitung aus,
nehmen die Pakete einfach einen anderen Weg. Das Internet besteht aus
zehntausenden einzelnen [[netzwerk|Netzwerken]]: dein Heimnetz, das Netz deines Internetanbieters, das Netz
einer Universität, das Netz eines Rechenzentrums. Jedes dieser Netze wird von jemand anderem betrieben.

Damit Daten von einem Netz ins andere kommen, gibt es [[router|Router]]. Ein Router ist ein Gerät mit
mindestens zwei Netzwerk-Anschlüssen, das zwischen Netzen vermittelt. Kommt ein [[datenpaket|Datenpaket]]
an, schaut der Router auf die Ziel-[[ip-adresse|IP-Adresse]] und entscheidet, über welchen Anschluss es
weitergeht. Dieses Entscheiden und Weiterreichen heißt [[routing|Routing]].

| Ebene | Beispiel | Wer betreibt es? |
|---|---|---|
| Heimnetz | Laptop, Handy, Drucker im WLAN | Du selbst |
| Zugangsnetz | Die Leitung von deiner Wohnung bis zum Anbieter | Dein Internetanbieter |
| Backbone | Große Glasfaserstrecken zwischen Städten | Große Netzbetreiber |
| Rechenzentrum | Server, auf denen Websites laufen | Hosting-Firmen, Cloud-Anbieter |

> [!MERKSATZ]
> Das Internet ist ein **Netz aus Netzen**. Router verbinden diese Netze und reichen Pakete Schritt
> für Schritt weiter – kein Gerät kennt den kompletten Weg.

## Die Routing-Tabelle: der Wegweiser im Router

Jeder Router hat eine [[routing-tabelle|Routing-Tabelle]]. Das ist eine Liste von Regeln nach dem Muster:
„Pakete für dieses Zielnetz gibst du an diesen Nachbarn.“ Ganz vereinfacht sieht die Tabelle deines
Heimrouters so aus:

```text title="Vereinfachte Routing-Tabelle eines Heimrouters"
Zielnetz             Weiter an            Über Anschluss
192.168.1.0/24       (direkt verbunden)   WLAN/LAN
0.0.0.0/0            198.51.100.1         Internet-Anschluss
```

Die erste Zeile sagt: Alles, was mit `192.168.1.` beginnt, ist hier im Heimnetz – direkt ausliefern.
Die zweite Zeile ist die **Default-Route** (Standard-Route). `0.0.0.0/0` bedeutet „jede beliebige Adresse“.
Sie greift immer dann, wenn keine genauere Regel passt. Bei dir zu Hause zeigt sie zum Router deines Anbieters.

Auch dein Laptop hat eine solche Tabelle, nur noch kürzer. Sein Default-Gateway ist dein Heimrouter.
Unter Linux und macOS kannst du sie dir ansehen:

```bash title="Eigene Routen anzeigen"
ip route        # Linux
netstat -rn     # macOS
```

Die großen Router deines Anbieters kennen dagegen Routen zu hunderttausenden Netzen. Die Betreiber
tauschen diese Routen automatisch untereinander aus (mit einem Protokoll namens BGP).

> [!FEHLER]
> „Mein Router kennt den Weg zu jeder Website.“ – Nein. Dein Heimrouter kennt nur dein Heimnetz und
> „alles andere geht zum Anbieter“. Erst die großen Router im Netz der Anbieter kennen Routen zu sehr
> vielen Zielen, und auch die kennen immer nur den nächsten Schritt.

## Internetanbieter, Internet-Knoten und Seekabel

Der [[internetanbieter|Internetanbieter]] (englisch *Internet Service Provider*, kurz ISP) ist die Firma,
mit der du einen Vertrag für deinen Anschluss hast. Er gibt deinem Anschluss eine öffentliche IP-Adresse
und leitet deine Pakete in die Welt hinaus.

Kein Anbieter hat Leitungen zu allen anderen Netzen der Welt. Deshalb treffen sich die Netze an
[[internet-knoten|Internet-Knoten]] (englisch *Internet Exchange Point*, kurz IXP). Das sind Gebäude mit
riesigen Switches, an die hunderte Netzbetreiber ihre Router anschließen. Dort tauschen sie Daten
direkt aus, statt einen Umweg über Dritte zu nehmen. Große Knoten gibt es in vielen Großstädten,
zum Beispiel in Frankfurt, Amsterdam oder London.

Zwischen Kontinenten laufen die Daten fast immer durch **Seekabel**: Glasfaserkabel auf dem
Meeresgrund, in denen die Daten als Lichtimpulse reisen.

Ein typischer Weg von Berlin zu einem Server in Nordamerika sieht so aus:

| Station | Was passiert |
|---|---|
| Laptop | Packt die Daten in Pakete mit Ziel `203.0.113.40` |
| Heimrouter | Default-Route → Anbieter |
| Router des Anbieters | Kennt eine Route Richtung Nordamerika |
| Internet-Knoten / Backbone | Wechsel ins Netz eines anderen Betreibers |
| Seekabel | Überquert den Atlantik |
| Router des Rechenzentrums | Zielnetz direkt angeschlossen → Auslieferung |

Jede dieser Router-Stationen nennt man einen [[hop|Hop]] (englisch für „Hüpfer“). Eine Anfrage
zu einem weit entfernten Server passiert typischerweise 10 bis 20 Hops.

![Eine Nachricht reist in Paketen über mehrere Router](/assets/wie-das-internet-funktioniert/pakete.svg)

## Latenz messen: ping und traceroute

Die [[latenz|Latenz]] ist die **Verzögerung** eines Wegs in Millisekunden. Die [[bandbreite|Bandbreite]]
ist die **Kapazität** in Mbit/s. Ein schneller Anschluss hilft nichts gegen einen weiten Weg – wie eine
achtspurige Autobahn, die die Strecke nach München nicht kürzer macht.

[[ping|ping]] schickt kleine Kontrollpakete des Protokolls [[icmp|ICMP]] und misst die
[[round-trip-time|Round-Trip-Time]] – Hin- und Rückweg:

```text title="ping -c 2 example.com"
64 bytes from 192.0.2.80: icmp_seq=1 ttl=52 time=24.8 ms
64 bytes from 192.0.2.80: icmp_seq=2 ttl=52 time=23.9 ms
2 packets transmitted, 2 received, 0% packet loss
```

Jedes IP-Paket hat eine [[ttl|TTL]]: Jeder Router zieht 1 ab, bei 0 wird das Paket verworfen und der Router
meldet „Time Exceeded“. [[traceroute|traceroute]] nutzt das: Es schickt Pakete mit TTL 1, 2, 3 … und
erfährt so nacheinander jeden Router auf dem Weg. `* * *` heißt nur, dass ein Router nicht antwortet.

> [!FEHLER]
> „ping antwortet nicht, also ist der Server aus.“ – Viele Server blockieren ICMP absichtlich. Die Website
> kann trotzdem laufen. Fehlen einzelne `icmp_seq`-Nummern, gab es [[paketverlust|Paketverlust]].

> [!PRAXIS]
> Server stehen meist nah bei ihren Nutzer:innen – nicht wegen „dickerer“ Leitungen, sondern weil kürzere
> Wege weniger Latenz bedeuten. traceroute zeigt dir, ab welchem Hop eine Strecke langsam wird.

## Zusammenfassung

- Das Internet ist ein **Netz aus Netzen**, die von vielen verschiedenen Betreibern gehören.
- **Router** verbinden Netze und reichen Pakete anhand ihrer **Routing-Tabelle** an den nächsten Nachbarn weiter.
- Pakete können verschiedene Wege nehmen; Sortieren und Nachfordern übernimmt später **TCP**.
- Die **Default-Route** gilt für alles, was keine genauere Regel hat – zu Hause zeigt sie zum Internetanbieter.
- Netze tauschen Daten an **Internet-Knoten** aus, Kontinente sind über **Seekabel** verbunden.
- Jede Router-Station heißt **Hop**; ein weiter Weg hat oft 10–20 Hops.
- **Latenz** (Verzögerung) und **Bandbreite** (Kapazität) sind zwei verschiedene Dinge.
- **ping** misst die Round-Trip-Time, **traceroute** zeigt über die **TTL** jeden Hop.
