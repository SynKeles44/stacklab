---
title: Daten speichern – Volumes, Bind Mounts und tmpfs
summary: Warum Daten im Container verloren gehen und wie du sie mit Volumes, Bind Mounts und tmpfs richtig ablegst.
duration: 25
sources:
  - title: Docker Docs – Persisting container data
    url: https://docs.docker.com/get-started/docker-concepts/running-containers/persisting-container-data/
  - title: Docker Docs – Volumes
    url: https://docs.docker.com/engine/storage/volumes/
  - title: Docker Docs – Bind mounts
    url: https://docs.docker.com/engine/storage/bind-mounts/
  - title: Docker Docs – tmpfs mounts
    url: https://docs.docker.com/engine/storage/tmpfs/
quiz:
  - type: single
    question: Du startest PostgreSQL ohne Volume, legst Tabellen an und löschst den Container mit `docker rm -f db`. Was passiert mit den Daten?
    options:
      - Sie bleiben im Image erhalten.
      - Sie sind weg – sie lagen nur in der beschreibbaren Schicht des Containers.
      - Docker legt automatisch ein Backup an.
      - Sie landen im Build-Cache.
    answer: 1
    explanation: >
      Die beschreibbare Schicht gehört dem Container und wird mit ihm gelöscht. Dauerhafte Daten gehören deshalb
      in ein Volume.
  - type: match
    question: Ordne jeder Speicherart ihren typischen Einsatz zu.
    pairs:
      - { left: "Volume", right: "Datenbankdateien, die Neustarts und Updates überleben sollen" }
      - { left: "Bind Mount", right: "Quellcode, den du lokal bearbeitest und sofort im Container siehst" }
      - { left: "tmpfs", right: "Flüchtige Zwischendaten nur im Arbeitsspeicher" }
    explanation: Volumes verwaltet Docker, Bind Mounts zeigen auf einen Ordner deines Rechners, tmpfs lebt nur im RAM.
  - type: cloze
    text: "Mit `-v pgdata:/var/lib/postgresql` hängst du das ___ `pgdata` ein. Mit `-v ./src:/app/src` hängst du dagegen einen Ordner deines Rechners als ___ ein."
    blanks:
      - [Volume, Docker-Volume, named volume]
      - [Bind Mount, Bind-Mount, Bindmount]
    explanation: Beginnt der linke Teil mit einem Pfad (`./`, `/`), ist es ein Bind Mount. Ein reiner Name bezeichnet ein Volume.
  - type: multiple
    question: Welche Aussagen über Volumes stimmen?
    options:
      - "`docker rm` löscht ein Volume nicht automatisch mit."
      - Mehrere Container können dasselbe Volume nutzen.
      - Ein Volume ist an genau ein Image gebunden.
      - "`docker volume rm pgdata` löscht die Daten endgültig."
    answers: [0, 1, 3]
    explanation: Volumes leben unabhängig von Containern und Images. Gelöscht werden sie nur ausdrücklich – dann aber unwiderruflich.
tasks:
  - id: speicherarten-beschriften
    type: diagram
    title: Welche Speicherart ist das?
    description: Ein Container speichert an drei Stellen Daten. Beschrifte jeden Pfeil mit der passenden Speicherart.
    image: /assets/docker/speicherarten-leer.svg
    slots:
      - { x: 20, y: 52, answer: Volume }
      - { x: 50, y: 52, answer: Bind Mount }
      - { x: 82.5, y: 52, answer: tmpfs }
    distractors: [Image-Layer, Build-Kontext]
    hints:
      - Links landen die Daten in einem Bereich, den Docker selbst verwaltet.
  - id: daten-ueberleben
    type: simulated
    title: Daten, die den Container überleben
    description: |
      Beweise, dass ein Volume den Container überlebt. Das Terminal ist simuliert.

      1. Lege ein Volume `pgdata` an.
      2. Starte im Hintergrund den Container `db` aus `postgres:18-alpine` mit `-e POSTGRES_PASSWORD=geheim` und
         hänge das Volume unter `/var/lib/postgresql` ein (`-v pgdata:/var/lib/postgresql`).
      3. Lösche den Container mit `docker rm -f db`.
      4. Zeige alle Volumes an – `pgdata` ist noch da.
    prompt: "du@laptop:~$"
    steps:
      - expect: "^docker\\s+volume\\s+create\\s+pgdata\\s*$"
        output: pgdata
        hint: docker volume create pgdata
      - expect: "^docker\\s+run\\s+(?=.*(-d|--detach)\\b)(?=.*--name[\\s=]db\\b)(?=.*(-e|--env)[\\s=]POSTGRES_PASSWORD=geheim\\b)(?=.*(-v|--volume)[\\s=]pgdata:/var/lib/postgresql/?(\\s|$)).*postgres:18-alpine\\s*$"
        output: 7b2e9f1c4d3a8b6e5f4c3d2a1b0e9f8c7d6b5a4e3f2c1d0b9a8e7f6c5d4b3a2e
        hint: "docker run -d --name db -e POSTGRES_PASSWORD=geheim -v pgdata:/var/lib/postgresql postgres:18-alpine"
      - expect: "^docker\\s+(container\\s+)?rm\\s+(-f|--force)\\s+db\\s*$"
        output: db
        hint: docker rm -f db
      - expect: "^docker\\s+volume\\s+ls\\s*$"
        output: |
          DRIVER    VOLUME NAME
          local     pgdata
        hint: docker volume ls
    responses:
      - match: "^docker\\s+volume\\s+inspect\\s+pgdata"
        output: |
          [
              {
                  "Driver": "local",
                  "Mountpoint": "/var/lib/docker/volumes/pgdata/_data",
                  "Name": "pgdata",
                  "Scope": "local"
              }
          ]
      - match: "^docker\\s+ps"
        output: "CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES"
    hints:
      - Volumes verwaltest du mit `docker volume …`.
      - "Ein Volume hängst du mit -v name:/pfad/im/container ein."
    solution: |
      ```bash
      docker volume create pgdata
      docker run -d --name db -e POSTGRES_PASSWORD=geheim -v pgdata:/var/lib/postgresql postgres:18-alpine
      docker rm -f db
      docker volume ls
      ```
---
Du hast stundenlang Testdaten in deine Container-Datenbank eingetragen. Dann aktualisierst du das Image, startest
den Container neu – und alles ist leer. Container sind bewusst kurzlebig. Daten, die bleiben sollen, gehören
deshalb an einen anderen Ort.

## Warum Daten im Container verschwinden

Erinnere dich: Jeder Container bekommt eine dünne, beschreibbare Schicht über seinem Image. Alles, was der
Prozess schreibt, landet dort. Diese Schicht gehört **nur diesem einen Container** – löschst du ihn, ist sie weg.

Das ist gewollt. Container sollen sich jederzeit wegwerfen und neu erzeugen lassen, etwa bei einem Update auf eine
neue Image-Version. Damit das klappt, trennt man **Programm** (im Image) und **Daten** (außerhalb des Containers).

Docker bietet dafür drei Speicherarten:

![Volume, Bind Mount und tmpfs: wo die Daten eines Containers landen](/assets/docker/speicherarten.svg)

> [!MERKSATZ]
> Container sind Wegwerfware. Alles, was einen Neustart überleben soll, gehört in ein Volume oder einen Bind Mount.

## Volumes: von Docker verwaltet

Ein [[docker-volume|Volume]] ist ein Speicherbereich, den Docker selbst anlegt und verwaltet. Wo genau er auf der
Festplatte liegt, muss dich nicht interessieren – du sprichst ihn über seinen Namen an.

```bash title="Mit Volumes arbeiten"
docker volume create pgdata
docker run -d --name db \
  -e POSTGRES_PASSWORD=geheim \
  -v pgdata:/var/lib/postgresql \
  postgres:18-alpine
docker volume ls
docker volume inspect pgdata
```

Löschst du den Container und startest einen neuen mit demselben `-v pgdata:…`, sind alle Daten wieder da.
Fehlt das Volume beim Start, legt Docker es automatisch an. Ausführlicher, aber gleichwertig ist die Schreibweise
`--mount type=volume,source=pgdata,target=/var/lib/postgresql`.

> [!FEHLER]
> Ab PostgreSQL 18 liegen die Daten im offiziellen Image unter `/var/lib/postgresql/18/docker`. Hängst du das
> Volume wie in alten Anleitungen nur an `/var/lib/postgresql/data`, landen deine Daten **nicht** darin. Richtig ist
> `/var/lib/postgresql`. Lies bei jedem Image in der Doku nach, wo es seine Daten ablegt.

## Bind Mounts: dein Ordner im Container

Ein [[bind-mount|Bind Mount]] hängt einen bestehenden Ordner deines Rechners in den Container ein. Beide sehen
dieselben Dateien – änderst du lokal etwas, sieht der Container es sofort.

```bash title="Bind Mount für die Entwicklung"
docker run -d --name web -p 8080:80 \
  -v ./public:/usr/share/nginx/html:ro \
  nginx:1.30-alpine
```

Der linke Teil ist ein **Pfad** (beginnt mit `./` oder `/`) – daran erkennt Docker den Bind Mount. Das angehängte
`:ro` macht ihn schreibgeschützt (read-only).

| | Volume | Bind Mount |
|---|---|---|
| Ort | von Docker verwaltet | beliebiger Ordner deines Rechners |
| Typischer Einsatz | Datenbanken, Uploads | Quellcode in der Entwicklung, Konfigurationsdateien |
| In Produktion | ja | selten |
| Rechte-Probleme | kaum | häufig (Benutzer-IDs von Host und Container) |

> [!PRAXIS]
> In der lokalen Entwicklung hängt man den Projektordner per Bind Mount ein. So siehst du jede Code-Änderung
> sofort, ohne das Image neu zu bauen. In Produktion steckt der Code dagegen fest im Image.

## tmpfs und Aufräumen

Ein [[tmpfs]]-Mount liegt nur im Arbeitsspeicher. Er ist schnell und verschwindet beim Stoppen des Containers – gut
für temporäre Dateien oder Daten, die nie auf eine Festplatte geschrieben werden sollen.

```bash title="tmpfs und Aufräumen"
docker run -d --tmpfs /tmp/cache meine-app:1.0
docker volume rm pgdata     # löscht das Volume samt Daten
docker volume prune         # löscht ungenutzte Volumes
```

Volumes werden **nie** automatisch mit dem Container gelöscht. Das schützt deine Daten, kostet aber mit der Zeit
Platz. `docker volume rm` und `prune` sind dafür endgültig – es gibt keinen Papierkorb.

> [!ACHTUNG]
> Ein Volume ist kein Backup. Geht die Festplatte kaputt oder löscht jemand das Volume, sind die Daten weg.
> Für Datenbanken brauchst du zusätzlich echte Sicherungen, z. B. mit `pg_dump`.

## Zusammenfassung

- Die beschreibbare Schicht eines Containers wird mit ihm gelöscht – dauerhafte Daten gehören nach außen.
- **Volumes** verwaltet Docker; du sprichst sie per Namen an (`-v pgdata:/pfad`).
- **Bind Mounts** hängen einen Ordner deines Rechners ein (`-v ./src:/app/src`), ideal für die Entwicklung.
- **tmpfs** liegt nur im Arbeitsspeicher und ist nach dem Stopp weg.
- Prüfe in der Image-Doku, wo die Daten liegen (PostgreSQL 18: `/var/lib/postgresql`).
- Volumes überleben `docker rm`, sind aber kein Backup.
