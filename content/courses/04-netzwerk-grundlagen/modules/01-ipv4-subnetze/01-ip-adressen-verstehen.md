---
title: Was ist eine IP-Adresse?
summary: Warum jedes Gerät im Netz eine Adresse braucht, wie eine IPv4-Adresse aufgebaut ist und wie du deine eigene findest.
duration: 20
sources:
  - title: RFC 791 – Internet Protocol (IPv4)
    url: https://www.rfc-editor.org/rfc/rfc791
  - title: MDN Glossar – IP-Adresse
    url: https://developer.mozilla.org/en-US/docs/Glossary/IP_Address
  - title: man ip-address (iproute2)
    url: https://man7.org/linux/man-pages/man8/ip-address.8.html
quiz:
  - type: single
    question: Welche dieser Zeichenketten ist eine gültige IPv4-Adresse?
    options:
      - "192.0.2.256"
      - "203.0.113.7"
      - "198.51.100"
      - "10.0.0.1.4"
    answer: 1
    explanation: Eine IPv4-Adresse hat genau vier Zahlen zwischen 0 und 255, getrennt durch Punkte. 256 ist zu groß, drei oder fünf Teile sind falsch.
  - type: multiple
    question: Welche Aussagen über IP-Adressen stimmen?
    options:
      - Eine IP-Adresse gehört zu einer Netzwerkschnittstelle, nicht zum ganzen Computer.
      - Ein Laptop hat immer genau eine IP-Adresse.
      - Router leiten Pakete anhand der Ziel-IP-Adresse weiter.
      - Eine IPv4-Adresse ist 32 Bit lang.
    answers: [0, 2, 3]
    explanation: Jede Schnittstelle (WLAN, Kabel, Loopback) hat eigene Adressen – ein Laptop hat also meist mehrere. Router schauen auf die Zieladresse, und IPv4-Adressen bestehen aus 32 Bit.
  - type: cloze
    text: Eine IPv4-Adresse besteht aus ___ Oktetten. Jedes Oktett ist eine Zahl zwischen 0 und ___.
    blanks:
      - ["4", vier]
      - ["255"]
    explanation: Vier Oktette zu je 8 Bit ergeben 32 Bit. Mit 8 Bit lassen sich die Werte 0 bis 255 darstellen.
  - type: match
    question: Ordne jeder Analogie den passenden Netzwerkbegriff zu.
    pairs:
      - { left: Hausanschrift auf dem Brief, right: IP-Adresse }
      - { left: "Briefzentrum, das Briefe weiterleitet", right: Router }
      - { left: Der Brief selbst, right: Datenpaket }
      - { left: Briefkastenschlitz an der Haustür, right: Netzwerkschnittstelle }
    explanation: Das Internet funktioniert wie die Post – Pakete tragen Absender- und Zieladresse, Router leiten sie Station für Station weiter.
tasks:
  - id: eigene-adresse
    type: terminal
    title: Finde die Adresse deines Übungs-Terminals
    description: |
      Auch dein Übungs-Terminal ist ein kleiner Computer mit eigener IP-Adresse. Finde sie heraus und
      halte sie in Dateien fest.

      1. Wechsle in den Ordner `meine-adresse` (`cd meine-adresse`).
      2. Zeige mit `hostname -I` alle IP-Adressen des Systems an.
      3. Speichere die Ausgabe in der Datei `adresse.txt`.
      4. Suche in der Datei `/etc/hosts` die Zeile, die `127.0.0.1` enthält, und speichere sie in `loopback.txt`.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit der Ordner angelegt wird.
    workdir: meine-adresse
    setup: |
      echo "Hier sammelst du die Adressen deines Übungs-Terminals." > LIESMICH.txt
    checks:
      - type: file_exists
        path: adresse.txt
        message: Die Datei adresse.txt fehlt noch. Leite die Ausgabe mit `>` in die Datei um.
      - type: file_contains
        path: adresse.txt
        pattern: "^[0-9]{1,3}(\\.[0-9]{1,3}){3}"
        message: In adresse.txt steht noch keine IPv4-Adresse. Nutze `hostname -I > adresse.txt`.
      - type: command
        run: "[ \"$(awk '{print $1}' adresse.txt)\" = \"$(hostname -I | awk '{print $1}')\" ] && echo gleich"
        stdout_equals: gleich
        message: Die Adresse in adresse.txt passt nicht zur Ausgabe von `hostname -I`.
      - type: file_contains
        path: loopback.txt
        pattern: "^127\\.0\\.0\\.1\\s+localhost"
        message: loopback.txt soll die Zeile aus /etc/hosts mit 127.0.0.1 enthalten. Tipp – `grep "127.0.0.1" /etc/hosts`.
    hints:
      - Mit `>` schreibst du die Ausgabe eines Befehls in eine Datei, statt sie anzuzeigen.
      - "`grep` sucht Zeilen in einer Datei: `grep \"127.0.0.1\" /etc/hosts`."
    solution: |
      ```bash
      cd meine-adresse
      hostname -I
      hostname -I > adresse.txt
      grep "127.0.0.1" /etc/hosts > loopback.txt
      cat adresse.txt loopback.txt
      ```
  - id: gueltig-oder-nicht
    type: dragdrop
    title: Gültige und ungültige IPv4-Adressen
    description: Ziehe jede Zeichenkette in die richtige Spalte. Prüfe dabei Anzahl der Teile und Wertebereich.
    targets:
      - { id: gueltig, label: Gültige IPv4-Adresse }
      - { id: ungueltig, label: Keine gültige IPv4-Adresse }
    items:
      - { label: "192.0.2.1", target: gueltig }
      - { label: "0.0.0.0", target: gueltig }
      - { label: "255.255.255.255", target: gueltig }
      - { label: "198.51.100.300", target: ungueltig }
      - { label: "203.0.113", target: ungueltig }
      - { label: "10.0.0.0.1", target: ungueltig }
      - { label: "10.20.30.40", target: gueltig }
      - { label: "192.168.1.-5", target: ungueltig }
    hints:
      - Zähle zuerst die Punkte – es müssen genau drei sein.
      - Jede der vier Zahlen muss zwischen 0 und 255 liegen.
---

Stell dir vor, du schickst einen Brief ohne Adresse los. Die Post weiß weder, wohin er soll, noch, an
wen eine Antwort zurückgehen müsste. Genau dieses Problem löst die [[ip-adresse|IP-Adresse]]: Sie sagt
jedem Gerät im [[netzwerk|Netzwerk]], wohin ein Datenpaket gehört – und woher es kommt.

## Das Problem: Milliarden Geräte, ein Netz

Wenn du `example.com` im Browser öffnest, reden zwei Computer miteinander, die vielleicht tausende
Kilometer auseinander stehen. Dazwischen liegen dein WLAN-Router, das Netz deines Internetanbieters,
mehrere große Knotenpunkte und das Rechenzentrum, in dem der [[server|Server]] steht. Keiner dieser
Zwischenstationen kennt den kompletten Weg. Jede weiß nur: „Pakete mit dieser Zieladresse schicke ich
dort entlang.“

Damit das klappt, braucht jedes Ziel eine eindeutige Adresse – so wie jedes Haus eine Anschrift hat.
Im Internet ist das die IP-Adresse. „IP“ steht für *Internet Protocol*, die Regeln, nach denen Daten
zwischen Netzen weitergereicht werden.

Die Daten selbst reisen nicht am Stück, sondern zerteilt in viele kleine
[[datenpaket|Datenpakete]]. Jedes Paket trägt zwei Adressen im Kopf: die **Quell-Adresse** (wer hat
es geschickt?) und die **Ziel-Adresse** (wer soll es bekommen?). Ein [[router|Router]] liest die
Zieladresse und entscheidet, an welche nächste Station er das Paket weitergibt.

| Post | Internet |
|---|---|
| Brief | Datenpaket |
| Empfänger-Anschrift | Ziel-IP-Adresse |
| Absender-Anschrift | Quell-IP-Adresse |
| Briefzentrum | Router |
| Briefkastenschlitz | Netzwerkschnittstelle |

## So sieht eine IPv4-Adresse aus

Die bis heute am häufigsten genutzte Variante heißt [[ipv4|IPv4]] (Internet Protocol Version 4). Eine
IPv4-Adresse schreibt man als vier Zahlen, getrennt durch Punkte:

```text
203.0.113.42
```

Diese Schreibweise heißt *Punktschreibweise* (englisch *dotted decimal*). Jede der vier Zahlen nennt
man [[oktett|Oktett]], weil sie intern aus genau acht [[bit|Bits]] besteht. Mit acht Bits lassen sich
256 verschiedene Werte darstellen – deshalb liegt jedes Oktett zwischen **0 und 255**. Wie das mit den
Bits genau funktioniert, lernst du in der nächsten Lektion.

Vier Oktette mal acht Bit ergeben **32 Bit**. Das ist die eigentliche Adresse – die Punktschreibweise
ist nur eine für Menschen lesbare Darstellung dieser 32 Nullen und Einsen.

```text
203      .0        .113      .42
11001011 00000000 01110001 00101010
```

Mit 32 Bit gibt es 2³² = 4.294.967.296 mögliche Adressen, also gut vier Milliarden. Das klang 1981,
als IPv4 festgelegt wurde, nach unendlich viel. Heute gibt es weit mehr Geräte als das – warum das
trotzdem funktioniert, lernst du bei NAT und IPv6.

> [!MERKSATZ]
> Eine IPv4-Adresse ist eine 32-Bit-Zahl. Wir schreiben sie als vier Oktette von 0 bis 255,
> getrennt durch Punkte.

> [!HINWEIS]
> In diesem Kurs verwenden wir für öffentliche Beispiele nur Adressen aus `192.0.2.0/24`,
> `198.51.100.0/24` und `203.0.113.0/24`. Diese Bereiche sind offiziell für Dokumentation reserviert
> und gehören niemandem. So schickst du beim Ausprobieren nie aus Versehen Pakete an fremde Server.

## Adressen gehören zu Schnittstellen, nicht zu Geräten

Ein häufiger Denkfehler ist: „Mein Laptop *hat* die IP-Adresse X.“ Genauer gesagt hat jede
[[netzwerkschnittstelle|Netzwerkschnittstelle]] eine Adresse. Eine Schnittstelle (englisch
*interface*) ist der Anschluss, über den ein Gerät mit einem Netz verbunden ist: die WLAN-Karte, die
Netzwerkbuchse, aber auch rein virtuelle Schnittstellen.

Dein Laptop hat deshalb fast immer **mehrere** Adressen:

| Schnittstelle | Typischer Name unter Linux | Beispiel-Adresse |
|---|---|---|
| Loopback (der Rechner selbst) | `lo` | `127.0.0.1` |
| WLAN | `wlan0` oder `wlp2s0` | `192.168.178.23` |
| Netzwerkkabel | `eth0` oder `enp3s0` | `192.168.178.40` |
| Docker-Netz | `docker0` | `172.17.0.1` |

Ein [[host|Host]] ist in der Netzwerk-Sprache jedes Gerät, das eine IP-Adresse hat und Pakete senden
oder empfangen kann – dein Laptop, ein Server, ein Drucker, ein Container.

## Deine Adresse herausfinden

Unter Linux zeigt der [[befehl|Befehl]] `ip addr` (kurz `ip a`) alle Schnittstellen mit ihren Adressen:

```text title="ip addr (gekürzt)"
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536
    inet 127.0.0.1/8 scope host lo
    inet6 ::1/128 scope host
2: wlan0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500
    link/ether 02:00:5e:10:00:01 brd ff:ff:ff:ff:ff:ff
    inet 192.168.178.23/24 brd 192.168.178.255 scope global dynamic wlan0
```

So liest du die Ausgabe:

- `lo` und `wlan0` sind die Namen der Schnittstellen.
- Hinter `inet` steht die IPv4-Adresse. Das `/24` dahinter verrät die Größe des Netzes – das ist
  Thema der übernächsten Lektion.
- Hinter `inet6` steht eine IPv6-Adresse (Modul 2).
- `link/ether` ist die Hardware-Adresse der Netzwerkkarte, die MAC-Adresse.

Kürzer geht es mit `hostname -I`. Der Befehl gibt nur die Adressen aus, ohne Loopback:

```bash title="Terminal"
hostname -I
```

Auf macOS heißt der Befehl `ifconfig`, unter Windows `ipconfig`. Die Information ist dieselbe.

Namen wie `example.com` übersetzt ein Namensdienst ([[dns|DNS]]) in IP-Adressen – am Ende spricht dein Rechner
**immer** mit einer Adresse. Eine kleine lokale Version dieses Telefonbuchs ist `/etc/hosts`: Dort
steht, dass `localhost` die Adresse `127.0.0.1` bedeutet.

> [!FEHLER]
> **„Meine IP ist 192.168.178.23 – damit findet mich jeder im Internet.“** Nein. Adressen mit
> `192.168.` sind private Adressen, die nur in deinem Heimnetz gelten. Im Internet tritt dein ganzer
> Haushalt mit **einer** öffentlichen Adresse deines Routers auf. Warum das so ist, lernst du in der
> Lektion über NAT.

## Wie ein Paket seinen Weg findet

Ein Router hat eine Tabelle, die [[routing-tabelle|Routing-Tabelle]]. Vereinfacht steht darin: „Alles für das Netz
`192.168.178.x` gebe ich direkt ins WLAN. Alles andere schicke ich an meinen Internetanbieter.“ Beim
Anbieter steht ein Router mit einer viel größeren Tabelle, und so weiter.

Kein Router kennt den gesamten Weg. Jeder kennt nur den **nächsten Schritt**. Das macht das Internet
so robust: Fällt eine Leitung aus, schicken die Router Pakete einfach über einen anderen Weg.

Du kannst die Erreichbarkeit einer Adresse mit [[ping]] testen. Der Befehl schickt ein kleines
Testpaket und wartet auf die Antwort:

```bash title="Terminal"
ping -c 3 127.0.0.1
```

Die Option `-c 3` bedeutet: genau drei Pakete, dann aufhören. Ohne `-c` läuft `ping` unter Linux
endlos, bis du es mit `Strg + C` abbrichst.

> [!PRAXIS]
> Wenn im Team jemand sagt „Der Server ist nicht erreichbar“, ist die erste Frage fast immer:
> „Welche IP-Adresse hast du benutzt – die öffentliche oder die interne?“ Viele Fehler entstehen,
> weil jemand eine interne Adresse aus der Cloud-Konsole kopiert und sie von zu Hause aus erreichen
> will. Nach diesem Kurs erkennst du den Unterschied auf einen Blick.

## Zusammenfassung

- Eine IP-Adresse sagt, wohin ein Datenpaket gehört und woher es kommt – wie eine Postanschrift.
- Eine IPv4-Adresse ist eine **32-Bit-Zahl**, geschrieben als vier Oktette von 0 bis 255.
- Adressen gehören zu **Schnittstellen**: Ein Gerät hat meist mehrere (Loopback, WLAN, Docker …).
- Router kennen nur den nächsten Schritt und leiten Pakete anhand der Ziel-Adresse weiter.
- `ip addr` und `hostname -I` zeigen unter Linux deine Adressen, `ping` testet die Erreichbarkeit.
- Für Beispiele nutzen wir nur die Dokumentationsbereiche `192.0.2.0/24`, `198.51.100.0/24` und `203.0.113.0/24`.
