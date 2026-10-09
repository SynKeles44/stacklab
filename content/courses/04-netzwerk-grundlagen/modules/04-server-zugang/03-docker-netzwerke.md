---
title: Docker-Netzwerke als Beispiel vor der Haustür
summary: Wie Docker private Netze, NAT, DNS und Port-Freigaben auf deinem eigenen Rechner nachbaut – und wie du damit alles aus diesem Kurs wiedererkennst.
duration: 20
sources:
  - title: Docker – Networking overview
    url: https://docs.docker.com/engine/network/
  - title: Docker – Port publishing and mapping
    url: https://docs.docker.com/engine/network/port-publishing/
  - title: Docker CLI – docker network
    url: https://docs.docker.com/reference/cli/docker/network/
quiz:
  - type: single
    question: Zwei Container hängen im selben benutzerdefinierten Docker-Netz `backend`. Wie erreicht die App die Datenbank am einfachsten?
    options:
      - Über den Container- bzw. Dienstnamen, z. B. `db:5432`
      - Über `127.0.0.1:5432`
      - Nur über eine veröffentlichte Port-Freigabe auf dem Host
    answer: 0
    explanation: Docker bringt einen eingebauten DNS-Server mit, der Namen in benutzerdefinierten Netzen auflöst. 127.0.0.1 wäre der App-Container selbst.
  - type: match
    question: Ordne die Docker-Begriffe ihren Netzwerk-Grundlagen zu.
    pairs:
      - { left: "Bridge-Netz 172.18.0.0/16", right: Privates Subnetz (RFC 1918) }
      - { left: Container erreicht das Internet, right: NAT über den Host }
      - { left: "-p 8080:80", right: Port-Forwarding vom Host in den Container }
      - { left: Dienstname db wird zu 172.18.0.3, right: DNS }
    explanation: Docker setzt genau die Bausteine ein, die du in diesem Kurs kennengelernt hast.
  - type: single
    question: "Was bewirkt `-p 127.0.0.1:5432:5432`?"
    options:
      - Die Datenbank ist von allen Geräten im WLAN erreichbar.
      - Der Port wird nur auf der Loopback-Adresse des Hosts veröffentlicht – nur der eigene Rechner kommt dran.
      - Der Container bekommt die Adresse 127.0.0.1.
    answer: 1
    explanation: Ohne Adresse veröffentlicht Docker auf allen Schnittstellen (0.0.0.0) – mit 127.0.0.1 bleibt es lokal.
tasks:
  - id: docker-netz-simuliert
    type: simulated
    title: Ein eigenes Docker-Netz anlegen
    description: |
      Du baust auf deinem Laptop eine kleine Umgebung mit App und Datenbank.

      1. Lege ein Netz an: `docker network create backend`
      2. Starte die Datenbank darin: `docker run -d --name db --network backend -e POSTGRES_PASSWORD=geheim postgres:18`
      3. Starte die App, nur lokal veröffentlicht: `docker run -d --name app --network backend -p 127.0.0.1:8080:80 nginx`
      4. Prüfe die Namensauflösung aus der App heraus: `docker exec app getent hosts db`
      5. Schau dir das Netz an: `docker network inspect backend --format '{{json .IPAM.Config}}'`
    prompt: "du@laptop:~$"
    steps:
      - expect: "^docker\\s+network\\s+create\\s+backend$"
        output: "3f9c2b1e8a7d4c6b9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d"
        hint: docker network create backend
      - expect: "^docker\\s+run\\s+(?=.*--name\\s+db)(?=.*--network\\s+backend)(?=.*postgres).*$"
        output: "8d1e5a0c7b2f9e4d6a3c1b0f8e7d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d"
        hint: "docker run -d --name db --network backend -e POSTGRES_PASSWORD=geheim postgres:18"
      - expect: "^docker\\s+run\\s+(?=.*--name\\s+app)(?=.*--network\\s+backend)(?=.*-p\\s+127\\.0\\.0\\.1:8080:80).*$"
        output: "b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3"
        hint: "docker run -d --name app --network backend -p 127.0.0.1:8080:80 nginx"
      - expect: "^docker\\s+exec\\s+app\\s+getent\\s+hosts\\s+db$"
        output: |
          172.18.0.2      db

          Docker-DNS hat den Namen db in die private Adresse des Datenbank-Containers übersetzt.
        hint: docker exec app getent hosts db
      - expect: "^docker\\s+network\\s+inspect\\s+backend.*$"
        output: |
          [{"Subnet":"172.18.0.0/16","Gateway":"172.18.0.1"}]

          Ein privates /16 aus 172.16.0.0/12 – mit dem Host als Gateway.
        hint: "docker network inspect backend --format '{{json .IPAM.Config}}'"
    responses:
      - match: "^docker\\s+run\\s+.*-p\\s+5432:5432"
        output: "Achtung: Damit wäre die Datenbank auf allen Schnittstellen deines Laptops erreichbar – und ufw würde das nicht verhindern. Im Netz backend braucht die App gar keine Port-Freigabe."
      - match: "^docker\\s+ps"
        output: |
          CONTAINER ID   IMAGE         PORTS                    NAMES
          b4c3d2e1f0a9   nginx         127.0.0.1:8080->80/tcp   app
          8d1e5a0c7b2f   postgres:18   5432/tcp                 db
  - id: uebungs-terminal-netz
    type: terminal
    title: Das Netz deines Übungs-Terminals untersuchen
    description: |
      Dein Übungs-Terminal ist selbst ein Docker-Container. Untersuche sein Netz mit den Werkzeugen aus
      diesem Kurs.

      1. Klicke auf **Aufgabe vorbereiten** und wechsle in den Ordner `container-netz`.
      2. Speichere die eigene Adresse: `hostname -I > adresse.txt`
      3. Speichere die `nameserver`-Zeile aus `/etc/resolv.conf` in `dns.txt`.
      4. Im selben Docker-Netz läuft ein Container mit dem Dienstnamen `proxy`. Löse seinen Namen auf:
         `getent hosts proxy > proxy.txt`
      5. Ist deine Adresse öffentlich oder privat? Schreibe `privat` oder `oeffentlich` in `bereich.txt`.
    workdir: container-netz
    setup: |
      echo "Untersuche hier das Docker-Netz des Übungs-Terminals." > LIESMICH.txt
    checks:
      - type: command
        run: "[ \"$(awk '{print $1}' adresse.txt)\" = \"$(hostname -I | awk '{print $1}')\" ] && echo gleich"
        stdout_equals: gleich
        message: adresse.txt passt nicht zur Ausgabe von `hostname -I`.
      - type: command
        run: "[ \"$(awk '{print $2}' dns.txt | head -n 1)\" = \"$(awk '/^nameserver/ {print $2; exit}' /etc/resolv.conf)\" ] && echo gleich"
        stdout_equals: gleich
        message: In dns.txt fehlt die nameserver-Zeile aus /etc/resolv.conf. Tipp – `grep nameserver /etc/resolv.conf > dns.txt`.
      - type: command
        run: "[ \"$(awk '{print $1}' proxy.txt)\" = \"$(getent hosts proxy | awk '{print $1}')\" ] && echo gleich"
        stdout_equals: gleich
        message: proxy.txt enthält noch nicht die Adresse des Dienstes proxy (`getent hosts proxy > proxy.txt`).
      - type: file_contains
        path: bereich.txt
        pattern: "^\\s*privat\\s*$"
        message: Schau dir die Adresse in adresse.txt an – liegt sie in 10.0.0.0/8, 172.16.0.0/12 oder 192.168.0.0/16?
    hints:
      - "`grep nameserver /etc/resolv.conf > dns.txt` filtert die richtige Zeile."
      - Vergleiche die Adresse mit den drei privaten Bereichen aus RFC 1918.
      - "`echo privat > bereich.txt` schreibt das Ergebnis in die Datei."
    solution: |
      ```bash
      cd container-netz
      hostname -I > adresse.txt
      grep nameserver /etc/resolv.conf > dns.txt
      getent hosts proxy > proxy.txt
      cat adresse.txt dns.txt proxy.txt   # alles private Adressen im selben Docker-Netz
      echo privat > bereich.txt
      ```
---

Du musst nicht in die Cloud, um private Netze, NAT, DNS und Port-Freigaben in Aktion zu sehen. [[docker|Docker]]
baut all das auf deinem eigenen Rechner nach – sogar dein Übungs-Terminal läuft in einem Docker-Netz.
Damit ist Docker die perfekte Wiederholung dieses Kurses.

## Container in einem privaten Netz

Startest du einen [[container|Container]], hängt Docker ihn standardmäßig an ein **Bridge-Netz** – ein privates
Subnetz auf deinem Rechner, meist aus `172.16.0.0/12` (das Standardnetz `docker0` ist oft
`172.17.0.0/16`). Dein Rechner ist darin das Gateway, Container bekommen Adressen wie `172.17.0.2`.

Mit `docker network ls` siehst du alle Netze, mit `docker network inspect <name>` ihr Subnetz und
Gateway. Auf Linux taucht das Standardnetz sogar als eigene Schnittstelle `docker0` in `ip addr` auf.

| Docker | Netzwerk-Grundlage |
|---|---|
| Bridge-Netz `172.18.0.0/16` | privates Subnetz (RFC 1918), CIDR |
| Host als Gateway `172.18.0.1` | Standard-Gateway |
| Container lädt Pakete aus dem Internet | NAT über den Host |
| `-p 8080:80` | Port-Forwarding vom Host in den Container |
| Dienstname `db` | DNS |

## Eigene Netze und DNS per Name

Für echte Projekte legst du eigene Netze an. Container im selben benutzerdefinierten Netz finden sich
über ihren **Namen** – Docker bringt einen eingebauten DNS-Server mit:

```bash title="Terminal"
docker network create backend
docker run -d --name db  --network backend -e POSTGRES_PASSWORD=geheim postgres:18
docker run -d --name app --network backend my-app
# in der App: DATABASE_URL=postgres://postgres:geheim@db:5432/postgres
```

[[docker-compose|Docker Compose]] macht das automatisch: Alle Dienste einer `compose.yaml` landen in einem gemeinsamen
Netz und erreichen sich über ihre Dienstnamen. Das ist robuster als feste Adressen: Startet ein
Container neu, bekommt er vielleicht eine andere IP – der Name bleibt gleich. Im Standardnetz `bridge`
gibt es diese Namensauflösung übrigens nicht; deshalb legt man für Projekte immer eigene Netze an.

> [!MERKSATZ]
> Im Docker-Netz sprechen Container sich über **Namen** an (`db:5432`), nicht über `127.0.0.1` – das
> wäre immer der eigene Container.

## Ports veröffentlichen – bewusst

Von deinem Rechner aus erreichst du einen Container nur über eine **Port-Freigabe** (`-p`). Ohne
Adresse veröffentlicht Docker auf allen Schnittstellen (`0.0.0.0`) – und umgeht dabei ufw-Regeln:

```bash title="Terminal"
docker run -p 8080:80 nginx              # von überall erreichbar
docker run -p 127.0.0.1:8080:80 nginx    # nur vom eigenen Rechner
```

Die App im Container muss dabei auf `0.0.0.0` lauschen, sonst kommt die Weiterleitung nicht an.

> [!FEHLER]
> **Die Datenbank mit `-p 5432:5432` veröffentlichen, „damit die App sie findet“.** Container im selben
> Netz brauchen keine Freigabe – sie nutzen `db:5432`. Die Freigabe öffnet die Datenbank nur unnötig
> nach außen. Brauchst du sie für ein Werkzeug auf dem Laptop, dann mit `127.0.0.1:5432:5432`.

> [!PRAXIS]
> Lokale Compose-Umgebungen sind ein verkleinertes Abbild der Cloud: öffentlich ist nur der Webserver,
> Datenbank und Cache bleiben im internen Netz. Wer das lokal sauber trennt, macht es in der Cloud mit
> Subnetzen und Security Groups genauso.

## Zusammenfassung

- Docker-Container hängen in **privaten Bridge-Netzen** mit dem Host als Gateway und NAT nach außen.
- In benutzerdefinierten Netzen (und in Compose) finden sich Container über **Namen** per Docker-DNS.
- `-p` veröffentlicht Ports vom Host in den Container – ohne Adresse auf `0.0.0.0`, also überall.
- Lokal gebrauchte Ports nur auf `127.0.0.1` veröffentlichen; interne Dienste brauchen gar keine Freigabe.
