---
title: Dateien kopieren und Tunnel bauen
summary: Dateien mit scp, sftp und rsync übertragen und mit -L, -R und -D Dienste durch SSH tunneln.
duration: 25
sources:
  - title: scp(1) – Handbuchseite
    url: https://man.openbsd.org/scp
  - title: sftp(1) – Handbuchseite
    url: https://man.openbsd.org/sftp
  - title: rsync – Handbuchseite
    url: https://download.samba.org/pub/rsync/rsync.1
  - title: ssh(1) – Optionen -L, -R, -D, -N und -f
    url: https://man.openbsd.org/ssh
quiz:
  - type: find-bug
    question: Der Server lauscht auf Port 2222. Welche Zeile funktioniert nicht wie gedacht?
    language: bash
    code: |
      ssh -p 2222 deploy@203.0.113.10 "mkdir -p /tmp/upload"
      scp -p 2222 bericht.pdf deploy@203.0.113.10:/tmp/upload/
      sftp -P 2222 deploy@203.0.113.10
    bug_line: 2
    explanation: >
      Bei scp (und sftp) heißt die Port-Option -P mit großem P. Das kleine -p bedeutet bei scp
      „Zeitstempel erhalten“ – scp versucht dann Port 22 und hält „2222“ für eine Datei.
  - type: match
    question: Welches Werkzeug passt zu welcher Situation?
    pairs:
      - { left: "Eine einzelne Datei schnell hochladen", right: "scp" }
      - { left: "Auf dem Server herumstöbern und gezielt Dateien holen", right: "sftp" }
      - { left: "Einen großen Ordner regelmäßig abgleichen", right: "rsync" }
    explanation: scp für schnelle Einzelkopien, sftp für interaktives Arbeiten, rsync zum effizienten Synchronisieren.
  - type: cloze
    text: "`ssh -L 5433:localhost:5432 deploy@203.0.113.20` öffnet auf deinem Laptop Port ___. Die Daten kommen auf dem Server bei Port ___ an."
    blanks:
      - ["5433"]
      - ["5432"]
    explanation: "Das Schema ist -L lokalerPort:zielhost:zielport. „localhost“ ist dabei aus Sicht des Servers gemeint."
  - type: single
    question: "Im Tunnel-Befehl `ssh -L 5433:localhost:5432 deploy@203.0.113.20` – wessen „localhost“ ist gemeint?"
    options:
      - Dein Laptop
      - Der Server 203.0.113.20
      - Irgendein Rechner im Internet
    answer: 1
    explanation: >
      Das Ziel nach dem ersten Doppelpunkt wird vom Server aus aufgelöst. localhost bedeutet also:
      die Datenbank, die auf dem Server selbst läuft. Statt localhost könnte dort auch eine interne Adresse wie 10.0.1.30 stehen.
  - type: multiple
    question: Welche Aussagen stimmen?
    options:
      - Der Datenbank-Port muss für den Tunnel im Internet offen sein.
      - Ein Tunnel bleibt nur so lange bestehen wie die SSH-Verbindung.
      - Ports unter 1024 kann ein normaler Benutzer lokal nicht öffnen.
      - In der ssh-Config heißt die Option für -L LocalForward.
    answers: [1, 2, 3]
    explanation: >
      Genau das ist der Sinn des Tunnels: Nur Port 22 muss offen sein. Endet ssh, endet der Tunnel.
      Niedrige Ports brauchen Administratorrechte, deshalb nimmt man 5433 statt 5432 oder 8080 statt 80.
tasks:
  - id: tunnel-beschriften
    type: diagram
    title: Beschrifte den Tunnel
    description: "Der Befehl lautet `ssh -L 5433:localhost:5432 deploy@203.0.113.20`. Ordne die Beschriftungen zu."
    image: /assets/ssh/port-forwarding-leer.svg
    slots:
      - { x: 18, y: 63, answer: "localhost:5433" }
      - { x: 50, y: 63, answer: SSH-Tunnel (Port 22) }
      - { x: 82, y: 63, answer: sshd }
      - { x: 82, y: 38, answer: "Datenbank :5432" }
    distractors: ["localhost:5432", known_hosts]
    hints:
      - Links steht, wo dein Programm sich verbindet – der lokale Port aus dem Befehl.
  - id: datenbank-tunnel
    type: simulated
    title: Die Datenbank durch den Tunnel erreichen
    description: |
      Die PostgreSQL-Datenbank auf `203.0.113.20` lauscht nur auf `localhost:5432` des Servers.
      Von außen ist nur SSH erreichbar.

      1. Öffne einen Tunnel von deinem lokalen Port `5433` zu `localhost:5432` auf dem Server –
         ohne entfernte Shell (`-N`) und im Hintergrund (`-f`), als Benutzer `deploy`.
      2. Verbinde dich mit `psql -h localhost -p 5433 -U app shop`.
      3. Zähle die Bestellungen mit `SELECT count(*) FROM orders;` und beende psql mit `\q`.
    prompt: "du@laptop:~$"
    steps:
      - expect: "^ssh\\s+(?=.*-L\\s*5433:localhost:5432)(?=.*-N)(?=.*-f).*deploy@203\\.0\\.113\\.20\\s*$"
        output: ""
        hint: "ssh -f -N -L 5433:localhost:5432 deploy@203.0.113.20"
      - expect: "^psql\\s+(?=.*-h\\s*localhost)(?=.*-p\\s*5433)(?=.*-U\\s*app).*shop\\s*$"
        output: |
          Password for user app:
          psql (18.0, server 18.0)
          Type "help" for help.
        prompt: "shop=>"
        hint: "psql -h localhost -p 5433 -U app shop"
      - expect: "^(SELECT|select)\\s+count\\(\\*\\)\\s+(FROM|from)\\s+orders;?\\s*$"
        output: |2
           count
          -------
           18342
          (1 row)
        prompt: "shop=>"
      - expect: "^\\\\q\\s*$"
        output: ""
        prompt: "du@laptop:~$"
    responses:
      - match: "^psql.*-p\\s*5432"
        output: |
          psql: error: connection to server at "localhost" (127.0.0.1), port 5432 failed: Connection refused
          Is the server running on that host and accepting TCP/IP connections?
    solution: |
      ```bash
      ssh -f -N -L 5433:localhost:5432 deploy@203.0.113.20
      psql -h localhost -p 5433 -U app shop
      shop=> SELECT count(*) FROM orders;
      shop=> \q
      ```
---

Ein Deployment-Paket hochladen, eine Log-Datei holen, kurz in die Produktionsdatenbank schauen, die
aus dem Internet gar nicht erreichbar ist: Für all das reicht die SSH-Verbindung, die du ohnehin
hast. Alle Werkzeuge nutzen dieselben Schlüssel und Config-Aliase.

## Dateien kopieren: scp, sftp, rsync

[[scp|scp]] funktioniert wie `cp` – erst Quelle, dann Ziel. Entfernte Pfade schreibst du als `host:pfad`:

```bash title="scp"
scp backup.sql web:/tmp/                          # hochladen
scp web:/var/log/app/error.log .                  # herunterladen
scp -r fotos web:/srv/app/storage/                # Ordner
scp -P 2222 bericht.pdf deploy@203.0.113.10:~/    # anderer Port – großes P!
```

[[sftp|sftp]] öffnet eine interaktive Sitzung mit `ls`, `cd`, `get`, `put` (lokal: `lls`, `lcd`).
[[rsync|rsync]] gleicht Ordner ab und überträgt nur Änderungen:

```bash title="rsync"
rsync -avz --dry-run public/ web:/srv/app/public/   # erst ansehen
rsync -avz --delete public/ web:/srv/app/public/    # abgleichen, am Ziel Überflüssiges löschen
```

| Situation | Werkzeug |
|---|---|
| eine Datei schnell hoch- oder herunterladen | `scp` |
| auf dem Server stöbern, gezielt holen | `sftp` |
| große Ordner, wiederholte Abgleiche | `rsync` |

> [!FEHLER]
> **`-p` statt `-P`.** Bei `ssh` heißt der Port `-p`, bei `scp` und `sftp` `-P`. Das kleine `-p`
> bedeutet dort „Zeitstempel erhalten“. Am einfachsten legst du den Port in der ssh-Config fest.

Bei rsync zählt der Schrägstrich: `public/` heißt „der Inhalt von public“, `public` „der Ordner selbst“.
rsync muss auf beiden Rechnern installiert sein. Seit OpenSSH 9.0 nutzt übrigens auch `scp` intern
das moderne SFTP-Protokoll – für dich ändert sich dadurch nichts.

## Tunnel: Port-Forwarding mit -L

Die Datenbank lauscht auf Port 5432, aber nur innerhalb des Servers. Beim
[[port-forwarding|Port-Forwarding]] öffnet `ssh` einen lokalen Port und leitet alles verschlüsselt
durch die SSH-Verbindung weiter:

![Lokale Weiterleitung von Port 5433 zur Datenbank auf dem Server](/assets/ssh/port-forwarding.svg)

```bash title="Tunnel zur Datenbank"
ssh -f -N -L 5433:localhost:5432 deploy@203.0.113.20
psql -h localhost -p 5433 -U app shop
```

Lies `-L lokalerPort:zielhost:zielport` so: „Öffne bei mir Port 5433, der Server schickt alles an
`localhost:5432` – aus **seiner** Sicht.“ `-N` hält nur den Tunnel ohne Shell, `-f` schickt `ssh` in
den Hintergrund. Der Tunnel lebt so lange wie die Verbindung. Nimm lokal einen freien Port wie 5433: Läuft auf
deinem Laptop selbst ein PostgreSQL auf 5432, würde dein Programm sonst in der falschen Datenbank landen.

> [!MERKSATZ]
> Für einen Tunnel muss nur Port 22 offen sein. Der Datenbank-Port bleibt aus dem Internet
> unerreichbar – genau so soll es sein.

## Rückwärts, dynamisch und in der Config

| Option | Richtung | Beispiel |
|---|---|---|
| `-L` | lokal → hinter den Server | `-L 5433:localhost:5432` |
| `-R` | Server → zurück zu dir | `-R 8080:localhost:3000` macht deine lokale App auf dem Server erreichbar |
| `-D` | beliebige Ziele ([[socks-proxy|SOCKS-Proxy]]) | `-D 1080`, im Browser als Proxy eintragen |

Wiederkehrende Tunnel gehören in die Config:

```text title="~/.ssh/config"
Host db-tunnel
  HostName 203.0.113.20
  User deploy
  LocalForward 5433 localhost:5432
  ExitOnForwardFailure yes
```

`ExitOnForwardFailure yes` lässt `ssh` abbrechen, wenn der lokale Port schon belegt ist – statt
still ohne Tunnel weiterzulaufen. Dann reicht `ssh -f -N db-tunnel`.

> [!PRAXIS]
> Datenbankzugriff „nur per SSH-Tunnel“ ist in vielen Firmen der Standardweg zur Produktion. Die
> meisten Datenbank-Programme haben dafür ein eigenes Feld „SSH-Tunnel“ mit Host, Benutzer und
> Schlüsseldatei.

## Zusammenfassung

- `scp quelle ziel` kopiert wie `cp`; Ordner mit `-r`, Port mit großem `-P`.
- `sftp` ist interaktiv (`get`, `put`), `rsync -avz` überträgt nur Änderungen; vor `--delete` kommt `--dry-run`.
- `ssh -L lokal:ziel:port` holt einen entfernten Dienst auf einen lokalen Port; das Ziel gilt aus Sicht des Servers.
- `-R` leitet vom Server zu dir, `-D` startet einen SOCKS-Proxy; `-N` und `-f` für reine Tunnel.
- In der Config heißen die Optionen `LocalForward`, `RemoteForward`, `DynamicForward`; `ExitOnForwardFailure yes` verhindert stille Fehler.
