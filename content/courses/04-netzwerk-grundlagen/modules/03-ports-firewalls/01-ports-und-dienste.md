---
title: Ports und Dienste
summary: Wie Ports viele Dienste auf einer IP-Adresse unterscheidbar machen, was TCP und UDP unterscheidet und welche Ports du kennen solltest.
duration: 25
sources:
  - title: IANA Service Name and Transport Protocol Port Number Registry
    url: https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml
  - title: RFC 6335 – Port-Bereiche und Vergabeverfahren
    url: https://www.rfc-editor.org/rfc/rfc6335
  - title: Node.js – HTTP-Modul
    url: https://nodejs.org/api/http.html
quiz:
  - type: match
    question: Ordne jedem Port seinen üblichen Dienst zu.
    pairs:
      - { left: "22", right: SSH }
      - { left: "443", right: HTTPS }
      - { left: "5432", right: PostgreSQL }
      - { left: "3306", right: MySQL / MariaDB }
      - { left: "6379", right: Redis }
    explanation: Diese Zuordnungen begegnen dir in Firewalls, Docker-Compose-Dateien und Fehlermeldungen.
  - type: single
    question: Dein Browser öffnet eine Verbindung zu `203.0.113.10:443`. Welchen Quell-Port benutzt er?
    options: [Ebenfalls 443, "Einen zufälligen flüchtigen Port, z. B. 51544", Immer Port 80]
    answer: 1
    explanation: Clients bekommen vom Betriebssystem einen freien flüchtigen Port. Der Server antwortet an genau diesen Port.
  - type: cloze
    text: "Die Kombination aus IP-Adresse und Port, z. B. `203.0.113.10:443`, nennt man ___. Ein Port ist eine Zahl zwischen 0 und ___."
    blanks:
      - [Socket, Socket-Adresse, Endpunkt]
      - ["65535"]
    explanation: Ports sind 16-Bit-Zahlen. Adresse und Port zusammen bilden einen Socket bzw. Endpunkt.
  - type: multiple
    question: Welche Aussagen stimmen?
    options:
      - TCP baut eine Verbindung auf und garantiert Reihenfolge und Zustellung.
      - DNS-Anfragen und Video-Calls nutzen oft UDP.
      - Wer SSH auf Port 2222 legt, hat SSH damit sicher gemacht.
      - Ein Dienst kann auf jedem freien Port laufen – die Standardnummern sind Konvention.
    answers: [0, 1, 3]
    explanation: Ein ungewöhnlicher Port verringert höchstens Lärm im Log. Echte Absicherung sind Schlüssel und Firewall-Regeln.
tasks:
  - id: pong-server
    type: terminal
    title: Ein eigener Dienst auf Port 4000
    description: |
      Schreibe einen winzigen HTTP-Dienst mit Node.js, der auf `127.0.0.1` und Port `4000` lauscht und
      auf jede Anfrage mit dem Text `pong` antwortet.

      1. Wechsle in den Ordner `pong-server` (Klicke zuerst auf **Aufgabe vorbereiten**).
      2. Öffne die vorbereitete Datei `server.js` mit `nano server.js` und ergänze den Aufruf von
         `server.listen(...)` mit Port und Bind-Adresse.
      3. Teste: `node server.js &`, dann `curl -s http://127.0.0.1:4000/`, danach `kill %1`.

      Die Prüfung startet deinen Server selbst – lass ihn am Ende nicht laufen.
    workdir: pong-server
    setup: |
      cat > server.js <<'EOF'
      const http = require('node:http')

      const server = http.createServer((req, res) => {
        res.end('pong')
      })

      // Ergänze hier: server.listen(PORT, ADRESSE, () => console.log('lauscht ...'))
      EOF
    checks:
      - type: file_contains
        path: server.js
        pattern: "listen\\(\\s*4000"
        message: server.js ruft `server.listen` noch nicht mit Port 4000 auf.
      - type: file_contains
        path: server.js
        pattern: "listen\\(\\s*4000\\s*,\\s*['\"]127\\.0\\.0\\.1['\"]"
        message: Der Server soll nur auf der Loopback-Adresse lauschen – gib `'127.0.0.1'` als zweites Argument an.
      - type: command
        run: "node server.js >/dev/null 2>&1 & pid=$!; sleep 1; curl -s --max-time 3 http://127.0.0.1:4000/; kill $pid 2>/dev/null; true"
        stdout_equals: pong
        message: Unter http://127.0.0.1:4000/ antwortet noch nichts mit „pong“. Startet `node server.js` ohne Fehler?
    hints:
      - "`server.listen(port, host)` – zuerst die Zahl, dann die Adresse als Text."
      - "Die fertige Zeile lautet `server.listen(4000, '127.0.0.1', () => console.log('lauscht auf 4000'))`."
    solution: |
      ```js
      const http = require('node:http')

      const server = http.createServer((req, res) => {
        res.end('pong')
      })

      server.listen(4000, '127.0.0.1', () => console.log('lauscht auf 127.0.0.1:4000'))
      ```

      ```bash
      node server.js &
      curl -s http://127.0.0.1:4000/    # pong
      kill %1
      ```
  - id: ports-zuordnen
    type: dragdrop
    title: Welcher Dienst lauscht hier?
    description: Ordne die Ports den Diensten zu.
    targets:
      - { id: ssh, label: SSH }
      - { id: web, label: Webserver (HTTP/HTTPS) }
      - { id: db, label: Datenbank }
      - { id: cache, label: Cache / Key-Value-Store }
      - { id: dns, label: DNS }
    items:
      - { label: "22/tcp", target: ssh }
      - { label: "80/tcp", target: web }
      - { label: "443/tcp", target: web }
      - { label: "5432/tcp", target: db }
      - { label: "3306/tcp", target: db }
      - { label: "6379/tcp", target: cache }
      - { label: "53/udp", target: dns }
    hints:
      - 5432 ist PostgreSQL, 3306 MySQL, 6379 Redis.
---

Ein Server hat eine IP-Adresse – aber darauf laufen oft viele Programme gleichzeitig: Webserver,
Datenbank, SSH. Wenn ein Paket ankommt, woher weiß das Betriebssystem, welches Programm es bekommt?
Dafür gibt es [[port|Ports]].

## Adresse und Port: Haus und Wohnung

Die IP-Adresse ist die **Hausanschrift**, der Port die **Wohnungsnummer**. Ein Port ist eine Zahl von
0 bis 65535. Ein Programm, das Verbindungen annehmen will, *lauscht* auf einem Port.

```text
Dein Browser                        Server
192.168.178.23:51544  ─────────▶   203.0.113.10:443   (Webserver)
                                    203.0.113.10:22    (SSH)
                                    203.0.113.10:5432  (Datenbank)
```

Adresse und Port zusammen heißen [[socket|Socket]] oder Endpunkt. Eine Verbindung ist durch vier Werte
eindeutig: Quell-Adresse, Quell-Port, Ziel-Adresse, Ziel-Port. Deshalb können tausende Browser
gleichzeitig mit Port 443 desselben Servers sprechen.

> [!MERKSATZ]
> Die IP-Adresse bringt ein Paket zum Rechner, der Port zum richtigen Programm.

## TCP und UDP

Ports gehören zu den Transportprotokollen [[tcp|TCP]] und [[udp|UDP]] – mit getrennten Port-Bereichen:

| | TCP | UDP |
|---|---|---|
| Verbindung | ja, mit Handshake | nein, einzelne Datagramme |
| Zuverlässigkeit | verlorene Pakete werden neu gesendet | keine Garantie |
| Typisch für | HTTP, SSH, Datenbanken | DNS, Video-Calls, DHCP |

TCP ist wie ein Einschreiben: Bevor Daten fließen, vereinbaren beide Seiten in einem dreistufigen
*Handshake* die Verbindung, jedes Paket wird bestätigt und notfalls erneut geschickt. UDP ist wie eine
Postkarte: schnell abgeschickt, aber ohne Bestätigung. Für eine Webseite muss jedes Byte ankommen, bei
einem Video-Call ist ein verlorenes Bild weniger schlimm als eine Verzögerung.

Deshalb schreibt man in Firewall-Regeln `443/tcp` oder `53/udp` – TCP-Port 53 und UDP-Port 53 sind zwei
verschiedene Briefkästen.

## Die Ports, die du kennen solltest

| Port | Dienst |
|---|---|
| 22/tcp | SSH |
| 53/udp | DNS |
| 80/tcp, 443/tcp | HTTP, HTTPS |
| 3306/tcp | MySQL / MariaDB |
| 5432/tcp | PostgreSQL |
| 6379/tcp | Redis |
| 3000, 5173, 8000, 8080 | typische Entwicklungsserver |

Die IANA teilt die Ports in **Well-Known** (0–1023), **Registered** (1024–49151) und **Dynamic**
(49152–65535). Unter Linux dürfen meist nur Root-Programme unter 1024 lauschen. Clients bekommen als
Absender einen [[ephemerer-port|flüchtigen Port]]; Linux nutzt dafür 32768–60999.

Wichtig: Die Nummern sind **Konvention**. Ein [[dienst|Dienst]] kann auf jedem freien Port laufen – und
ein Port verrät nicht sicher, was dahinter läuft.

> [!FEHLER]
> **„SSH auf Port 2222 – jetzt ist der Server sicher.“** Port-Scanner probieren in Sekunden alle Ports
> durch. Echte Absicherung sind Schlüssel statt Passwörter und Firewall-Regeln.

## Ein Dienst, der lauscht

```js title="server.js"
const http = require('node:http')
const server = http.createServer((req, res) => res.end('pong'))
server.listen(4000, '127.0.0.1')   // Port 4000, nur Loopback
```

```bash title="Terminal"
node server.js &
curl http://127.0.0.1:4000/     # pong
kill %1
```

Läuft schon ein Programm auf demselben Port, scheitert der Start mit `EADDRINUSE` (*address already in
use*). Meist läuft dann der alte Server noch im Hintergrund oder in einem anderen Terminal – wie du ihn
findest, lernst du in der nächsten Lektion. In URLs steht der
Port hinter dem Doppelpunkt; fehlt er, gilt 80 für `http://` und 443 für `https://`.

> [!PRAXIS]
> Eine kleine Tabelle „Dienst → Port“ in der README eines Projekts (Frontend 5173, API 8000,
> Datenbank 5432) spart dem Team viele Rückfragen.

## Zusammenfassung

- Ein **Port** (0–65535) wählt das Programm, die IP-Adresse den Rechner; zusammen bilden sie einen **Socket**.
- **TCP** ist verbindungsorientiert und zuverlässig, **UDP** schnell und ohne Garantie.
- Wichtige Ports: 22 SSH, 80/443 Web, 3306 MySQL, 5432 PostgreSQL, 6379 Redis.
- Clients nutzen **flüchtige Ports**; Portnummern sind Konvention, kein Schutz.
