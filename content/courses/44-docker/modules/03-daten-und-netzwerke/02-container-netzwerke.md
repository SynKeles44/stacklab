---
title: Container-Netzwerke
summary: Wie Container miteinander sprechen, warum eigene Netzwerke Namensauflösung bringen und wann du überhaupt Ports veröffentlichen musst.
duration: 20
sources:
  - title: Docker Docs – Networking overview
    url: https://docs.docker.com/engine/network/
  - title: Docker Docs – Bridge network driver
    url: https://docs.docker.com/engine/network/drivers/bridge/
  - title: Docker Docs – docker network create
    url: https://docs.docker.com/reference/cli/docker/network/create/
quiz:
  - type: single
    question: Die Container `api` und `db` hängen im selben selbst angelegten Netzwerk. Welche Adresse trägt die API als Datenbank-Host ein?
    options:
      - "`localhost`"
      - "`db`"
      - "`127.0.0.1`"
      - Die IP-Adresse deines Laptops.
    answer: 1
    explanation: >
      In einem eigenen Netzwerk löst Dockers eingebauter DNS-Server Container-Namen auf. `localhost` wäre im
      Container `api` dagegen der Container `api` selbst.
  - type: multiple
    question: Welche Aussagen über Container-Netzwerke stimmen?
    options:
      - Im Standard-Netzwerk `bridge` finden sich Container nicht über ihren Namen.
      - Container im selben eigenen Netzwerk erreichen sich auch ohne `-p`.
      - "`-p` ist nötig, damit dein Browser auf dem Host einen Container erreicht."
      - Ein Container kann nur in genau einem Netzwerk hängen.
    answers: [0, 1, 2]
    explanation: >
      `-p` öffnet einen Weg vom Host in den Container. Untereinander sprechen Container über das gemeinsame Netzwerk
      direkt mit dem internen Port. Ein Container kann mit `docker network connect` in mehrere Netzwerke.
  - type: find-bug
    question: Die API findet die Datenbank nicht („could not translate host name db“). In welcher Zeile steckt der Fehler?
    language: bash
    code: |
      docker network create shop
      docker run -d --name db --network shop -e POSTGRES_PASSWORD=geheim postgres:18-alpine
      docker run -d --name api -e DB_HOST=db -p 3000:3000 shop-api:1.0
    bug_line: 3
    explanation: Der Container `api` hängt im Standard-Netzwerk, nicht in `shop`. Es fehlt `--network shop`.
  - type: cloze
    text: Ein eigenes Netzwerk legst du mit `docker network ___ shop` an. Einen Container startest du darin mit der Option `___ shop`.
    blanks:
      - [create]
      - [--network, --net]
    explanation: "`docker network create` legt ein Bridge-Netzwerk an, `--network` hängt den Container hinein."
tasks:
  - id: netzwerk-anlegen
    type: simulated
    title: Zwei Container verbinden
    description: |
      Verbinde eine Datenbank und einen Test-Container über ein eigenes Netzwerk. Das Terminal ist simuliert.

      1. Lege das Netzwerk `shop` an.
      2. Starte im Hintergrund den Container `db` aus `postgres:18-alpine` im Netzwerk `shop` mit
         `-e POSTGRES_PASSWORD=geheim`. Veröffentliche **keinen** Port.
      3. Starte einen Wegwerf-Container aus `busybox:1.38` im Netzwerk `shop`, der `ping -c 1 db` ausführt und sich
         danach selbst löscht (`--rm`).
      4. Zeige mit `docker network inspect shop` an, welche Container im Netzwerk hängen.
    prompt: "du@laptop:~$"
    steps:
      - expect: "^docker\\s+network\\s+create\\s+shop\\s*$"
        output: 3c8f1a2b9d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a
        hint: docker network create shop
      - expect: "^docker\\s+run\\s+(?=.*(-d|--detach)\\b)(?=.*--name[\\s=]db\\b)(?=.*--network[\\s=]shop\\b)(?=.*(-e|--env)[\\s=]POSTGRES_PASSWORD=geheim\\b)(?!.*\\s(-p|--publish)\\s).*postgres:18-alpine\\s*$"
        output: 5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c
        hint: "docker run -d --name db --network shop -e POSTGRES_PASSWORD=geheim postgres:18-alpine"
      - expect: "^docker\\s+run\\s+(?=.*--rm\\b)(?=.*--network[\\s=]shop\\b).*busybox:1\\.38\\s+ping\\s+-c\\s*1\\s+db\\s*$"
        output: |
          PING db (172.18.0.2): 56 data bytes
          64 bytes from 172.18.0.2: seq=0 ttl=64 time=0.091 ms

          --- db ping statistics ---
          1 packets transmitted, 1 packets received, 0% packet loss
        hint: "docker run --rm --network shop busybox:1.38 ping -c 1 db"
      - expect: "^docker\\s+network\\s+inspect\\s+shop\\s*$"
        output: |
          [
              {
                  "Name": "shop",
                  "Driver": "bridge",
                  "Containers": {
                      "5d4c3b2a1f0e…": {
                          "Name": "db",
                          "IPv4Address": "172.18.0.2/16"
                      }
                  }
              }
          ]
        hint: docker network inspect shop
    responses:
      - match: "^docker\\s+network\\s+ls"
        output: |
          NETWORK ID     NAME      DRIVER    SCOPE
          1a2b3c4d5e6f   bridge    bridge    local
          7a8b9c0d1e2f   host      host      local
          3c8f1a2b9d7e   shop      bridge    local
          9f8e7d6c5b4a   none      null      local
    hints:
      - Netzwerke verwaltest du mit `docker network …`, Container hängst du mit `--network` hinein.
      - "Das Image steht vor dem Befehl: docker run --rm --network shop busybox:1.38 ping -c 1 db"
    solution: |
      ```bash
      docker network create shop
      docker run -d --name db --network shop -e POSTGRES_PASSWORD=geheim postgres:18-alpine
      docker run --rm --network shop busybox:1.38 ping -c 1 db
      docker network inspect shop
      ```
  - id: welche-adresse
    type: steps
    title: Welche Adresse ist die richtige?
    description: Deine Laravel-App läuft im Container `php`, die Datenbank im Container `db`. Beide hängen im Netzwerk `shop`, die Datenbank ist zusätzlich mit `-p 127.0.0.1:5433:5432` veröffentlicht.
    steps:
      - situation: In der `.env` der Laravel-App (im Container `php`) trägst du die Datenbankverbindung ein.
        question: Welche Werte sind richtig?
        options:
          - "DB_HOST=db und DB_PORT=5432"
          - "DB_HOST=localhost und DB_PORT=5433"
          - "DB_HOST=127.0.0.1 und DB_PORT=5432"
        answer: 0
        explanation: Im gemeinsamen Netzwerk sprichst du den Container über seinen Namen und den **internen** Port an. Die Port-Veröffentlichung spielt dafür keine Rolle.
      - situation: Du willst dich mit dem Datenbank-Tool von PhpStorm auf deinem Laptop verbinden.
        question: Welche Adresse nutzt du jetzt?
        options:
          - "db:5432"
          - "127.0.0.1:5433"
          - "php:5432"
        answer: 1
        explanation: Dein Laptop ist nicht im Docker-Netzwerk und kennt den Namen `db` nicht. Er erreicht den Container nur über den veröffentlichten Port.
      - situation: Du entfernst die Option `-p 127.0.0.1:5433:5432` und startest die Datenbank neu.
        question: Kann die Laravel-App die Datenbank noch erreichen?
        options:
          - Ja – Container im selben Netzwerk brauchen keine veröffentlichten Ports.
          - Nein – ohne -p ist der Container komplett abgeschottet.
        answer: 0
        explanation: Ohne `-p` ist die Datenbank nur von deinem Laptop aus nicht mehr erreichbar. Das ist in Produktion sogar gewollt.
---
Deine Laravel-App läuft in einem Container, PostgreSQL in einem anderen. Du trägst `DB_HOST=localhost` ein – und
bekommst „Connection refused“. Container haben jeweils ihr eigenes Netzwerk. Damit sie sich finden, musst du
verstehen, wie Docker sie verbindet.

## Jeder Container hat sein eigenes localhost

Durch die Namespaces aus Modul 1 hat jeder Container einen eigenen Netzwerkstapel – eigene
[[ip-adresse|IP-Adresse]], eigene Ports, eigenes [[localhost]]. `localhost` im Container `php` ist der Container
`php` selbst, nicht dein Laptop und nicht die Datenbank.

Docker verbindet Container über virtuelle Netzwerke. Ohne Angabe landet jeder Container im Standard-Netzwerk
namens `bridge`.

| Netzwerk-Treiber | Wirkung |
|---|---|
| `bridge` | Virtuelles Netz auf deinem Rechner – der Standard |
| `host` | Der Container nutzt direkt das Netzwerk des Hosts, ohne Isolation |
| `none` | Gar kein Netzwerk |

> [!FEHLER]
> `DB_HOST=localhost` in einem Container zeigt nie auf einen anderen Container. Das ist der häufigste Fehler beim
> ersten Multi-Container-Setup.

## Eigene Netzwerke mit Namensauflösung

Im Standard-Netzwerk `bridge` können Container sich nur über IP-Adressen erreichen – und die ändern sich bei jedem
Start. Legst du dagegen ein **eigenes** [[bridge-netzwerk|Bridge-Netzwerk]] an, bekommst du einen eingebauten
[[dns|DNS]]-Dienst dazu: Container finden sich über ihren **Namen**.

```bash title="Eigenes Netzwerk"
docker network create shop
docker run -d --name db --network shop \
  -e POSTGRES_PASSWORD=geheim postgres:18-alpine
docker run -d --name api --network shop \
  -e DB_HOST=db -p 3000:3000 shop-api:1.0
```

Die API erreicht die Datenbank jetzt unter `db:5432`. Der Name des Containers ist gleichzeitig sein
[[hostname|Hostname]] im Netzwerk.

> [!MERKSATZ]
> Container im selben eigenen Netzwerk sprechen sich über ihren Namen und den internen Port an.

## Ports nur für den Weg von außen

Hier verwechseln viele zwei Dinge: Container im selben Netzwerk erreichen **alle** Ports voneinander – ganz ohne
`-p`. Die Option `-p` brauchst du nur, damit etwas **außerhalb** von Docker (dein Browser, dein Datenbank-Tool)
einen Container erreicht.

| Wer spricht mit wem? | Adresse |
|---|---|
| Container `api` → Container `db` | `db:5432` (interner Port, kein `-p` nötig) |
| Dein Laptop → Container `db` | `127.0.0.1:5433` (nur mit `-p 127.0.0.1:5433:5432`) |
| Container → Dienst auf deinem Laptop | `host.docker.internal` (Docker Desktop) |

Eine Datenbank veröffentlichst du deshalb in Produktion gar nicht. Nur der Webserver bekommt einen Port nach außen.
Das verkleinert die Angriffsfläche erheblich.

> [!PRAXIS]
> In typischen Setups hängen Webserver, PHP-FPM, Datenbank und Cache in einem gemeinsamen Netzwerk. Nach außen ist
> nur Port 80 bzw. 443 des Webservers offen. Genau dieses Netzwerk legt Docker Compose später automatisch an.

## Netzwerke untersuchen und verwalten

```bash title="Netzwerk-Befehle"
docker network ls                      # alle Netzwerke
docker network inspect shop            # Details und angeschlossene Container
docker network connect shop web        # laufenden Container zusätzlich anschließen
docker network rm shop                 # Netzwerk löschen
```

Zum Testen startest du einen Wegwerf-Container im selben Netzwerk:
`docker run --rm --network shop busybox:1.38 ping -c 1 db`. Antwortet `db`, stimmen Netzwerk und Name.

Antwortet er nicht, prüfe der Reihe nach: Hängen beide Container wirklich im selben Netzwerk
(`docker network inspect`)? Stimmt der Name exakt? Lauscht der Dienst im Container auf `0.0.0.0` statt nur auf
`127.0.0.1`? Ein Dienst, der nur auf seinem eigenen localhost lauscht, ist für andere Container unsichtbar.

> [!TIPP]
> Den Treiber `host` brauchst du selten. Er hebt die Netzwerk-Isolation auf und verhält sich auf Docker Desktop
> anders als unter Linux. Bleib im Zweifel bei eigenen Bridge-Netzwerken.

## Zusammenfassung

- Jeder Container hat sein eigenes `localhost` – es zeigt nie auf andere Container.
- Im Standard-Netzwerk `bridge` gibt es keine Namensauflösung, in eigenen Netzwerken schon.
- `docker network create` legt ein Netzwerk an, `--network` hängt Container hinein.
- Container im selben Netzwerk erreichen sich über `name:interner-port`, ganz ohne `-p`.
- `-p` öffnet nur den Weg von außen; Datenbanken veröffentlicht man in Produktion nicht.
