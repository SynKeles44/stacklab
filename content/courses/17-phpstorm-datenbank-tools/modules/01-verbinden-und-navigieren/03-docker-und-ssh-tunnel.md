---
title: Datenbanken in Docker und hinter SSH
summary: Wie du eine Datenbank im Docker-Container über ein Port-Mapping erreichst und eine Server-Datenbank sicher über einen SSH-Tunnel verbindest.
duration: 20
sources:
  - title: Docker-Dokumentation – Published ports
    url: https://docs.docker.com/engine/network/port-publishing/
  - title: Docker-Dokumentation – docker compose port
    url: https://docs.docker.com/reference/cli/docker/compose/port/
  - title: PhpStorm-Hilfe – Data Sources and Drivers dialog (SSH/SSL)
    url: https://www.jetbrains.com/help/phpstorm/data-sources-and-drivers-dialog.html
  - title: PhpStorm-Hilfe – Configure SSH and SSL
    url: https://www.jetbrains.com/help/phpstorm/configuring-ssh-and-ssl.html
  - title: OpenSSH-Handbuch – ssh(1), Option -L
    url: https://man.openbsd.org/ssh#L
quiz:
  - type: single
    question: "In der compose.yaml steht `ports: [\"5433:5432\"]`. Welche Werte trägst du in PhpStorm ein?"
    options:
      - Host db, Port 5432
      - Host localhost, Port 5433
      - Host localhost, Port 5432
      - Host 0.0.0.0, Port 5432
    answer: 1
    explanation: Links steht der Port deines Rechners, rechts der Port im Container. PhpStorm läuft auf deinem Rechner, also localhost:5433.
  - type: multiple
    question: Wann brauchst du einen SSH-Tunnel?
    options:
      - Wenn die Datenbank auf einem Server nur intern erreichbar ist.
      - Für jede SQLite-Datei.
      - Wenn du nur per SSH auf einen Zwischenrechner (Bastion-Host) kommst.
      - Für eine Datenbank im lokalen Docker-Container mit veröffentlichtem Port.
    answers: [0, 2]
    explanation: Der Tunnel bringt dich durch eine SSH-Verbindung an eine Datenbank, die du direkt nicht erreichst. Lokale Container und SQLite-Dateien brauchen das nicht.
  - type: find-bug
    question: PhpStorm meldet „Connection refused“. In welcher Zeile liegt das Problem?
    language: yaml
    code: |
      services:
        db:
          image: postgres:18
          environment:
            POSTGRES_USER: app
            POSTGRES_PASSWORD: <dein-passwort>
            POSTGRES_DB: shop
          expose:
            - "5432"
    bug_line: 8
    explanation: "`expose` macht den Port nur für andere Container sichtbar. Damit PhpStorm auf deinem Rechner ihn erreicht, brauchst du `ports: [\"5433:5432\"]`."
  - type: cloze
    text: "Bei `ssh -L 6543:198.51.100.20:5432 deploy@203.0.113.10` verbindest du PhpStorm danach mit Host localhost und Port ___."
    blanks:
      - ["6543"]
    explanation: Der erste Port nach -L ist der lokale Port des Tunnels. Alles, was dort ankommt, landet bei 198.51.100.20:5432.
tasks:
  - id: wege-finden
    type: simulated
    title: Den richtigen Port finden und einen Tunnel öffnen
    description: |
      Dein Projekt startet PostgreSQL mit Docker Compose (Service `db`). Außerdem sollst du dich mit der
      Test-Datenbank auf `198.51.100.20` verbinden, die nur über den Bastion-Host `203.0.113.10`
      (Benutzer `deploy`) erreichbar ist.

      1. Lass dir mit `docker compose ps` die laufenden Container anzeigen.
      2. Frag mit `docker compose port db 5432` gezielt nach, auf welchem Port deines Rechners der
         Container-Port 5432 liegt.
      3. Öffne einen SSH-Tunnel: lokaler Port `6543` → `198.51.100.20:5432` über `deploy@203.0.113.10`.
         Nutze `ssh -N -L …` (`-N` heißt: keine Shell öffnen, nur weiterleiten).
    prompt: "du@laptop:~/shop$"
    steps:
      - expect: "^docker\\s+compose\\s+ps$"
        output: |
          NAME        IMAGE         COMMAND                  SERVICE   CREATED         STATUS         PORTS
          shop-db-1   postgres:18   "docker-entrypoint.s…"   db        3 minutes ago   Up 3 minutes   0.0.0.0:5433->5432/tcp
        hint: Tippe `docker compose ps`.
      - expect: "^docker\\s+compose\\s+port\\s+db\\s+5432$"
        output: |
          0.0.0.0:5433
          # → In PhpStorm: Host localhost, Port 5433
        hint: Tippe `docker compose port db 5432`.
      - expect: "^ssh\\s+(-N\\s+-L|-L)\\s+6543:198\\.51\\.100\\.20:5432\\s+(-N\\s+)?deploy@203\\.0\\.113\\.10(\\s+-N)?$"
        output: |
          # Tunnel steht. Das Terminal bleibt offen, solange der Tunnel läuft (Strg+C beendet ihn).
          # → In PhpStorm: Host localhost, Port 6543
        hint: "Muster: `ssh -N -L lokalerPort:zielHost:zielPort benutzer@bastion`"
    responses:
      - match: "^docker\\s+ps"
        output: "Tipp: docker compose ps zeigt nur die Container dieses Projekts."
      - match: "^ssh\\s+deploy@"
        output: "Damit öffnest du nur eine Shell auf dem Bastion-Host. Für die Weiterleitung brauchst du -L."
  - id: verbindung-debuggen
    type: steps
    title: Was ist hier schiefgelaufen?
    description: Drei typische Situationen aus dem Alltag. Entscheide jeweils, was die Ursache ist.
    steps:
      - situation: >
          Deine `compose.yaml` hat `ports: ["5433:5432"]`. In PhpStorm stehen Host `localhost` und Port `5432`.
          Test Connection meldet „Connection refused“.
        question: Was ist falsch?
        options:
          - Der Port – PhpStorm muss den linken Wert 5433 benutzen.
          - Das Passwort.
          - Der Treiber fehlt.
        answer: 0
        explanation: Auf deinem Rechner ist der Container unter 5433 veröffentlicht. Auf 5432 lauscht dort niemand (oder eine ganz andere Datenbank).
      - situation: >
          Eine Kollegin hat als Host `db` eingetragen, weil der Service in der `compose.yaml` so heißt.
          PhpStorm meldet „Unknown host“.
        question: Warum klappt das nicht?
        options:
          - Service-Namen gelten nur innerhalb des Docker-Netzwerks, nicht auf deinem Rechner.
          - Hostnamen dürfen keine drei Buchstaben haben.
          - PostgreSQL erlaubt nur IP-Adressen.
        answer: 0
        explanation: Andere Container erreichen die Datenbank unter `db:5432`. PhpStorm läuft außerhalb und nutzt `localhost` plus den veröffentlichten Port.
      - situation: >
          Im Reiter SSH/SSL ist der Tunnel zum Bastion-Host eingerichtet. Im Reiter General steht als Host
          `localhost`. Die Datenbank läuft aber auf `198.51.100.20`, nicht auf dem Bastion-Host selbst.
        question: Was trägst du im Reiter General als Host ein?
        options:
          - "`203.0.113.10` – die Adresse des Bastion-Hosts"
          - "`198.51.100.20` – die Adresse der Datenbank aus Sicht des Bastion-Hosts"
          - Nichts, das Feld bleibt leer.
        answer: 1
        explanation: Mit aktivem Tunnel gelten Host und Port im Reiter General aus Sicht des SSH-Servers. `localhost` wäre dort der Bastion-Host selbst.
---
In deinem Projekt läuft die Datenbank nicht „einfach so“ auf deinem Rechner, sondern in einem
[[docker|Docker]]-[[container|Container]]. Und die Test-Datenbank steht auf einem Server, an den du nur per
[[ssh|SSH]] herankommst. Beides ist Alltag – und beides scheitert oft an einer einzigen falschen Zahl im
Verbindungsdialog.

## Datenbank im Container

Viele Projekte starten ihre Datenbank mit [[docker-compose|Docker Compose]]. Ein typischer Ausschnitt:

```yaml title="compose.yaml"
services:
  db:
    image: postgres:18
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: <dein-passwort>
      POSTGRES_DB: shop
    ports:
      - "5433:5432"
```

Ein Container ist zunächst abgeschottet. Die Zeile `ports` schafft ein [[port-mapping|Port-Mapping]]:

- **links** `5433` – der Port auf **deinem Rechner**,
- **rechts** `5432` – der Port **im Container**, auf dem PostgreSQL lauscht.

PhpStorm läuft auf deinem Rechner. Also trägst du ein: **Host** `localhost`, **Port** `5433`, dazu
User `app`, Database `shop` und das Passwort aus der Datei.

> [!MERKSATZ]
> Bei `"HOST:CONTAINER"` gehört in PhpStorm immer die **linke** Zahl.

Warum nicht einfach 5432? Weil auf deinem Rechner vielleicht schon eine andere PostgreSQL läuft. Mit einem
anderen Host-Port gibt es keinen Konflikt.

## Den Port herausfinden

Du kennst die `compose.yaml` nicht auswendig? Docker sagt es dir:

```bash title="Terminal"
docker compose ps
docker compose port db 5432
```

```text title="Ausgabe"
NAME        IMAGE         ...   STATUS         PORTS
shop-db-1   postgres:18   ...   Up 3 minutes   0.0.0.0:5433->5432/tcp
0.0.0.0:5433
```

`0.0.0.0:5433->5432/tcp` liest du genau wie das Mapping: Port 5433 deines Rechners führt zu 5432 im
Container.

> [!FEHLER]
> Als Host den Service-Namen `db` eintragen. Diesen Namen kennen nur andere Container im selben
> Docker-Netzwerk – deine PHP-Anwendung im Container nutzt `db:5432`, PhpStorm auf deinem Rechner
> `localhost:5433`.

Steht in der `compose.yaml` nur `expose` statt `ports`, ist der Port gar nicht veröffentlicht. Dann hilft
nur, ein Mapping zu ergänzen.

## SSH-Tunnel: an Datenbanken hinter Servern

Datenbanken auf Servern sind aus gutem Grund nicht direkt aus dem Internet erreichbar. Erreichbar ist meist
nur ein [[bastion-host|Bastion-Host]] per SSH. Ein [[ssh-tunnel|SSH-Tunnel]] nutzt diese Verbindung als
Röhre: Du schickst Datenbank-Verkehr hinein, und am anderen Ende kommt er bei der Datenbank an.

![Drei Wege von PhpStorm zur Datenbank: lokal, über Port-Mapping und über einen SSH-Tunnel](/assets/phpstorm-datenbank-tools/verbindungswege.svg)

Von Hand baust du einen Tunnel so:

```bash title="Terminal"
ssh -N -L 6543:198.51.100.20:5432 deploy@203.0.113.10
```

Lies das als: „Öffne lokal Port 6543 und leite alles an 198.51.100.20:5432 weiter – über den Server
203.0.113.10.“ Danach verbindest du PhpStorm mit `localhost:6543`.

## Den Tunnel in PhpStorm einrichten

Bequemer ist es, wenn PhpStorm den Tunnel selbst öffnet:

1. Datenquelle markieren, **Shift+Enter** (macOS ⌘;) für **Data Source Properties**.
2. Reiter **SSH/SSL** öffnen und **Use SSH tunnel** anhaken.
3. Neben der SSH-Konfiguration auf **…** klicken und eine neue anlegen: **Host** `203.0.113.10`,
   **Port** `22`, **Username** `deploy`, **Authentication type** z. B. **Key pair** oder
   **OpenSSH config and authentication agent**.
4. Zurück im Reiter **General**: **Host** `198.51.100.20`, **Port** `5432`.
5. **Test Connection**, dann **OK**.

Wichtig ist Schritt 4: Mit aktivem Tunnel gelten Host und Port **aus Sicht des SSH-Servers**. Läuft die
Datenbank direkt auf dem Bastion-Host, trägst du dort `localhost` ein.

> [!PRAXIS]
> Nutze für den Tunnel denselben SSH-Schlüssel wie für den Server-Login und speichere kein Passwort im
> Klartext. Für Datenquellen auf geteilten Umgebungen gilt: **Read-only** anhaken, solange du nur lesen musst.

## Tastenkürzel dieser Lektion

| Aktion | Windows/Linux | macOS |
|---|---|---|
| Data Source Properties | Shift+Enter | ⌘; |
| Terminal-Tool-Fenster (für `docker compose ps`) | Alt+F12 | ⌥F12 |
| Laufenden Tunnel im Terminal beenden | Ctrl+C | ⌃C |

## Zusammenfassung

- Docker-Datenbanken erreichst du über `localhost` und den **linken** Port aus `ports: ["5433:5432"]`.
- `docker compose ps` und `docker compose port db 5432` zeigen dir den veröffentlichten Port.
- Service-Namen wie `db` funktionieren nur zwischen Containern, nicht in PhpStorm.
- Ein SSH-Tunnel leitet Datenbank-Verkehr durch eine SSH-Verbindung, z. B. über einen Bastion-Host.
- In PhpStorm: **Data Source Properties → SSH/SSL → Use SSH tunnel**; Host/Port im Reiter General gelten
  dann aus Sicht des SSH-Servers.
