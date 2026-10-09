---
title: So wird ein Name aufgelöst – mit Caches und hosts-Datei
summary: Wer bei einer DNS-Anfrage wen fragt, warum Antworten zwischengespeichert werden (TTL) und wie die hosts-Datei DNS überstimmt.
duration: 25
sources:
  - title: RFC 1034 – Domain Names, Concepts and Facilities (Resolvers)
    url: https://www.rfc-editor.org/rfc/rfc1034
  - title: IANA – Root Servers
    url: https://www.iana.org/domains/root/servers
  - title: RFC 2308 – Negative Caching of DNS Queries
    url: https://www.rfc-editor.org/rfc/rfc2308
  - title: hosts(5) – Linux manual page
    url: https://man7.org/linux/man-pages/man5/hosts.5.html
  - title: dig – BIND 9 Manual
    url: https://bind9.readthedocs.io/en/latest/manpages.html#dig-dns-lookup-utility
quiz:
  - type: single
    question: Wer kennt die endgültige Antwort auf „Welche IP hat www.example.com?“
    options:
      - Der Root-Server
      - Der TLD-Server für .com
      - Der autoritative Nameserver von example.com
      - Dein Heimrouter
    answer: 2
    explanation: >
      Root- und TLD-Server verweisen nur weiter. Die Antwort mit der IP-Adresse kommt vom autoritativen Nameserver
      der Zone example.com – dort pflegt der Domain-Inhaber seine Einträge.
  - type: multiple
    question: Welche Aussagen über den rekursiven Resolver stimmen?
    options:
      - Er erledigt die ganze Fragerei stellvertretend für deinen Rechner.
      - Er speichert Antworten in einem Cache.
      - Er ist für die Zone example.com zuständig.
      - Er wird oft vom Internetanbieter oder einem öffentlichen DNS-Dienst betrieben.
    answers: [0, 1, 3]
    explanation: >
      Der Resolver ist ein Dienstleister: Er fragt sich durch und merkt sich die Antworten. Zuständig (autoritativ)
      für eine Zone ist er nicht.
  - type: cloze
    text: DNS-Anfragen laufen normalerweise über das Protokoll ___ auf Port ___.
    blanks:
      - [UDP]
      - ["53"]
    explanation: Eine Frage, eine Antwort – dafür reicht UDP. Bei sehr großen Antworten wird auf TCP Port 53 gewechselt.
  - type: find-bug
    question: Diese Beschreibung der Auflösung enthält einen Fehler. In welcher Zeile?
    language: text
    code: |
      1. Dein Rechner fragt den rekursiven Resolver.
      2. Der Resolver fragt einen Root-Server.
      3. Der Root-Server antwortet mit der IP von www.example.com.
      4. Der Resolver liefert die Antwort an deinen Rechner.
    bug_line: 3
    explanation: >
      Root-Server kennen keine einzelnen Namen. Sie antworten nur: „Für .com frag diese Server.“ Danach folgen noch
      der TLD-Server und der autoritative Server.
  - type: single
    question: Ein A-Eintrag hat die TTL 3600. Was bedeutet das?
    options:
      - Der Server ist 3600 Sekunden lang erreichbar.
      - Resolver dürfen die Antwort bis zu 3600 Sekunden (1 Stunde) zwischenspeichern.
      - Der Eintrag wird nach 3600 Sekunden gelöscht.
      - Die Anfrage darf 3600 Millisekunden dauern.
    answer: 1
    explanation: Die TTL ist ein Haltbarkeitsdatum für Kopien. Danach muss ein Resolver neu beim autoritativen Server nachfragen.
tasks:
  - id: dig-trace
    type: simulated
    title: Schau dem Resolver über die Schulter
    description: |
      Mit `dig` stellst du DNS-Anfragen von Hand. Das Übungs-Terminal hat keinen Zugang zu echten DNS-Servern,
      deshalb ist dieses Terminal **simuliert** (mit Beispieladressen).

      1. Frag nach der Adresse: `dig www.example.com`
      2. Lass dir nur die Antwort zeigen: `dig +short www.example.com`
      3. Verfolge die ganze Kette von der Root aus: `dig +trace www.example.com`
    prompt: "du@laptop:~$"
    steps:
      - expect: "^dig\\s+www\\.example\\.com$"
        output: |
          ; <<>> DiG 9.20 <<>> www.example.com
          ;; global options: +cmd
          ;; Got answer:
          ;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 4711
          ;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

          ;; QUESTION SECTION:
          ;www.example.com.               IN      A

          ;; ANSWER SECTION:
          www.example.com.        3600    IN      A       192.0.2.10

          ;; Query time: 28 msec
          ;; SERVER: 198.51.100.53#53(198.51.100.53) (UDP)
          ;; WHEN: Fri Oct 09 10:00:00 CEST 2026
          ;; MSG SIZE  rcvd: 60
        hint: "`dig www.example.com`"
      - expect: "^dig\\s+\\+short\\s+www\\.example\\.com$|^dig\\s+www\\.example\\.com\\s+\\+short$"
        output: "192.0.2.10"
        hint: "`dig +short www.example.com`"
      - expect: "^dig\\s+\\+trace\\s+www\\.example\\.com$|^dig\\s+www\\.example\\.com\\s+\\+trace$"
        output: |
          ; <<>> DiG 9.20 <<>> +trace www.example.com
          .                       518400  IN      NS      a.root-servers.net.
          .                       518400  IN      NS      b.root-servers.net.
          ;; Received 239 bytes from 198.51.100.53#53(198.51.100.53) in 12 ms

          com.                    172800  IN      NS      a.tld-com.example.net.
          com.                    172800  IN      NS      b.tld-com.example.net.
          ;; Received 1170 bytes from 203.0.113.1#53(a.root-servers.net) in 20 ms

          example.com.            172800  IN      NS      ns1.example.com.
          example.com.            172800  IN      NS      ns2.example.com.
          ;; Received 180 bytes from 203.0.113.2#53(a.tld-com.example.net) in 24 ms

          www.example.com.        3600    IN      A       192.0.2.10
          ;; Received 60 bytes from 203.0.113.53#53(ns1.example.com) in 31 ms
        hint: "`dig +trace www.example.com`"
    responses:
      - match: "^nslookup\\s+www\\.example\\.com$"
        output: |
          Server:         198.51.100.53
          Address:        198.51.100.53#53

          Non-authoritative answer:
          Name:   www.example.com
          Address: 192.0.2.10
    hints:
      - "Im ANSWER-Abschnitt steht das Ergebnis; `3600` ist die TTL in Sekunden."
      - "Bei `+trace` siehst du drei Verweise (NS) und erst am Ende den A-Eintrag."
    solution: |
      ```bash
      dig www.example.com
      dig +short www.example.com
      dig +trace www.example.com
      ```
      `+trace` zeigt die Kette: Root nennt die .com-Server, diese nennen ns1/ns2.example.com, und erst der
      autoritative Server ns1.example.com liefert `192.0.2.10`.
  - id: hosts-erkunden
    type: terminal
    title: Die hosts-Datei lesen und selbst schreiben
    description: |
      Du schaust dir die hosts-Datei des Übungs-Terminals an und schreibst eine eigene Datei im selben Format.
      `/etc/hosts` selbst kannst du hier nicht ändern – dafür bräuchtest du Administratorrechte.

      1. Wechsle in den Ordner `hosts-datei` (er wird beim Vorbereiten angelegt).
      2. Speichere die IPv4-Zeile für `localhost` aus `/etc/hosts` in `localhost-zeile.txt`:
         `grep -E '^127\.0\.0\.1\s+localhost' /etc/hosts > localhost-zeile.txt`
      3. Frag den Auflösungsweg des Systems mit `getent hosts localhost` und speichere die Ausgabe in `getent.txt`.
      4. Lege eine Datei `meine-hosts` im hosts-Format an, die `shop.example.test` auf `192.0.2.10` und
         `api.example.test` auf `192.0.2.11` zeigen lässt (eine Zeile pro Eintrag).

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: hosts-datei
    setup: |
      printf '# Hier entstehen deine Dateien\n' > LIESMICH.txt
    checks:
      - type: file_contains
        path: localhost-zeile.txt
        pattern: "^127\\.0\\.0\\.1\\s+localhost"
        message: localhost-zeile.txt soll die Zeile mit 127.0.0.1 und localhost aus /etc/hosts enthalten.
      - type: file_contains
        path: getent.txt
        pattern: "localhost"
        message: getent.txt fehlt oder enthält nicht die Ausgabe von `getent hosts localhost`.
      - type: file_contains
        path: meine-hosts
        pattern: "^192\\.0\\.2\\.10\\s+shop\\.example\\.test\\s*$"
        message: "In meine-hosts fehlt die Zeile `192.0.2.10 shop.example.test` (erst die IP, dann der Name)."
      - type: file_contains
        path: meine-hosts
        pattern: "^192\\.0\\.2\\.11\\s+api\\.example\\.test\\s*$"
        message: "In meine-hosts fehlt die Zeile `192.0.2.11 api.example.test`."
    hints:
      - "Mit `cat /etc/hosts` siehst du die ganze Datei."
      - "`>` leitet die Ausgabe eines Befehls in eine Datei um."
      - "`printf '192.0.2.10 shop.example.test\\n192.0.2.11 api.example.test\\n' > meine-hosts`"
    solution: |
      ```bash
      cd hosts-datei
      grep -E '^127\.0\.0\.1\s+localhost' /etc/hosts > localhost-zeile.txt
      getent hosts localhost > getent.txt
      printf '192.0.2.10 shop.example.test\n192.0.2.11 api.example.test\n' > meine-hosts
      cat meine-hosts
      ```
---

Du tippst `www.example.com` in den Browser. Noch bevor irgendein Byte der Webseite fließt, muss dein Rechner
die IP-Adresse herausfinden. Dafür fragt er sich durch eine Kette von Servern – meist in wenigen
Millisekunden. In dieser Lektion schaust du genau zu, wer wen fragt.

## Die Beteiligten

| Rolle | Wo | Aufgabe |
|---|---|---|
| Stub-Resolver | Auf deinem Rechner (im Betriebssystem) | Stellt eine einzige Frage und wartet auf die fertige Antwort |
| Rekursiver [[resolver\|Resolver]] | Beim Internetanbieter oder öffentlicher DNS-Dienst | Fragt sich stellvertretend durch und speichert Antworten |
| [[root-server\|Root-Server]] | Weltweit verteilt | Kennt die Server aller Top-Level-Domains |
| TLD-Server | Bei der Registry | Kennt die Nameserver aller Domains unter seiner TLD |
| [[autoritativer-nameserver\|Autoritativer Nameserver]] | Beim Domain-Inhaber oder DNS-Anbieter | Hat die echten Einträge der Zone |

Der Stub-Resolver ist bequem: Er schickt seine Frage an den rekursiven Resolver, der in den
Netzwerkeinstellungen eingetragen ist, und bekommt eine fertige Antwort zurück. Die eigentliche Arbeit macht
der rekursive Resolver.

> [!MERKSATZ]
> Nur der **autoritative** Nameserver einer Zone kennt die Antwort aus erster Hand. Alle anderen verweisen
> weiter oder geben eine gespeicherte Kopie heraus.

## Die Kette von oben nach unten

![So findet ein Resolver die IP-Adresse von www.example.com](/assets/wie-das-internet-funktioniert/dns-aufloesung.svg)

Angenommen, der Resolver hat noch nichts im Speicher. Dann läuft es so:

1. Dein Rechner fragt den Resolver: „Welche IP hat `www.example.com`?“
2. Der Resolver fragt einen Root-Server.
3. Der Root-Server antwortet: „Weiß ich nicht. Für `.com` frag diese Server.“
4. Der Resolver fragt einen `.com`-Server.
5. Der antwortet: „Für `example.com` sind `ns1.example.com` und `ns2.example.com` zuständig.“
6. Der Resolver fragt `ns1.example.com`.
7. Der autoritative Server antwortet: „`192.0.2.10`.“
8. Der Resolver gibt die Antwort an deinen Rechner weiter und merkt sie sich.

Dabei gibt es zwei Arten zu fragen:

| Art | Bedeutung | Wer fragt so? |
|---|---|---|
| Rekursiv | „Besorg mir bitte die fertige Antwort.“ | Dein Rechner fragt den Resolver |
| Iterativ | „Sag mir, was du weißt – notfalls, wen ich fragen soll.“ | Der Resolver fragt Root, TLD, autoritativ |

Der Resolver übernimmt die Rekursion für dich – daher sein Name.

> [!FEHLER]
> „Die Root-Server kennen alle Domains.“ – Nein. Die Root-Zone enthält nur die Top-Level-Domains und deren
> Nameserver. Es gibt 13 Root-Server-Namen mit weltweit über tausend Standorten (*Anycast*).

## dig: Anfragen von Hand stellen

Mit [[dig|dig]] stellst du DNS-Anfragen selbst. Die Ausgabe ist in Abschnitte gegliedert:

```text title="dig www.example.com (gekürzt)"
;; QUESTION SECTION:
;www.example.com.               IN      A

;; ANSWER SECTION:
www.example.com.        3600    IN      A       192.0.2.10

;; SERVER: 198.51.100.53#53(198.51.100.53) (UDP)
```

| Teil | Bedeutung |
|---|---|
| `QUESTION` | Was gefragt wurde: Typ A (IPv4-Adresse) |
| `3600` | TTL – so viele Sekunden darf die Antwort gespeichert werden |
| `IN A 192.0.2.10` | Klasse Internet, Typ A, Wert |
| `SERVER` | Welcher Resolver geantwortet hat, über UDP Port 53 |

`dig +short` zeigt nur das Ergebnis, `dig +trace` spielt selbst die ganze Kette von der Root aus durch.

> [!PRAXIS]
> Nach dem Umzug einer Website lautet die erste Diagnose oft: `dig +short www.example.com`. Zeigt das noch die
> alte Adresse, liegt es am DNS (oder an einem Cache) – nicht am neuen Server.

## Caches, TTL und die hosts-Datei

Würde jede Anfrage die ganze Kette durchlaufen, wäre DNS langsam. Deshalb speichern Browser, Betriebssystem
und Resolver Antworten in einem [[cache|Cache]]. Wie lange, bestimmt die [[ttl|TTL]] des Eintrags in
Sekunden – die `3600` in der dig-Ausgabe. Auch „gibt es nicht“ (`NXDOMAIN`) wird kurz gespeichert.

| TTL | Vorteil | Nachteil |
|---|---|---|
| Lang (86400 = 1 Tag) | Wenige Anfragen, schnell aus dem Cache | Änderungen brauchen bis zu einem Tag |
| Kurz (300 = 5 Minuten) | Änderungen wirken schnell | Mehr Anfragen |

Eine „DNS-Propagation“ gibt es eigentlich nicht: Der autoritative Server liefert neue Werte sofort, nur die
alten Kopien in den Caches laufen nach und nach ab. Vor einem Server-Umzug senkt man die TTL deshalb
rechtzeitig vorher.

Noch vor DNS fragt dein Rechner die [[hosts-datei|hosts-Datei]] (`/etc/hosts`, unter Windows
`C:\Windows\System32\drivers\etc\hosts`). Pro Zeile steht **erst die IP-Adresse, dann der Name** – ein Eintrag
dort gewinnt gegen jede DNS-Antwort. `getent hosts <name>` zeigt, was dein System wirklich auflöst.

```text title="/etc/hosts"
127.0.0.1   localhost
127.0.0.1   shop.example.test
```

> [!PRAXIS]
> Lädt eine Seite „nur bei dir“ falsch, prüfe den Browser-Cache und die hosts-Datei. Für lokale Projekte
> trägt man gern Testnamen mit der reservierten Endung `.test` auf `127.0.0.1` ein.

## Zusammenfassung

- Der **Stub-Resolver** auf deinem Rechner fragt rekursiv einen **rekursiven Resolver**.
- Der Resolver fragt sich **iterativ** durch: Root-Server → TLD-Server → autoritativer Nameserver.
- Nur der **autoritative Nameserver** kennt die Einträge einer Zone aus erster Hand.
- Es gibt 13 Root-Server-Namen mit sehr vielen Anycast-Standorten.
- DNS nutzt meist **UDP Port 53**; mit `dig` und `dig +trace` kannst du jede Anfrage nachvollziehen.
- Antworten werden gemäß **TTL** in Caches gespeichert; die **hosts-Datei** wird vor DNS gefragt.
